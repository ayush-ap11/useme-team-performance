/**
 * Useme Team - Centralized Data Store (Task, Project & Event Writes)
 */
(function() {
  const DS = window.DataStore;
  if (!DS) throw new Error('DataStore core must be loaded first');
  const { _data, _persist, _clone } = DS;
  const now = () => new Date().toISOString().replace('T', ' ').slice(0, 16);
  const deny = (act, u, msg) => {
    console.error(`[DataStore] Unauthorized: ${act} (${msg}) by ${u?.id || 'unknown'} [${u?.role}]`);
    throw new Error(`[DataStore] Unauthorized: ${act} (${msg})`);
  };
  const reqAdmin = (act, u) => { if (u?.role !== 'admin') deny(act, u, 'Admin only'); };
  const reqMember = (act, u) => { if (u?.role !== 'member') deny(act, u, 'Member only'); };
  const getTask = (id) => {
    const t = _data.tasks.find(x => x.id === id);
    if (!t) throw new Error(`Task not found: ${id}`);
    return t;
  };

  DS.createTask = (data, u) => {
    reqAdmin('createTask', u);
    const task = {
      id: data.id || ('t' + (Date.now() % 10000)), title: data.title || 'Untitled Task', description: data.description || '',
      assignedTo: Array.isArray(data.assignedTo) && data.assignedTo.length ? data.assignedTo : ['m5'],
      linkedSkill: data.linkedSkill || 'dev', linkedProject: data.linkedProject || null, projectId: data.projectId || null, eventId: data.eventId || null,
      status: data.status || 'notStarted', dueDate: data.dueDate || new Date().toISOString().slice(0, 10),
      resources: data.resources || [], assets: data.assets || [], qualityScore: data.qualityScore ?? null,
      submittedForReview: false, statusHistory: data.statusHistory || [{ status: data.status || 'notStarted', timestamp: now() }]
    };
    _data.tasks.unshift(task); _persist();
    DS.logActivity(u?.id, `created task "${task.title}"`, 'task', task.id);
    return _clone(task);
  };

  DS.updateTask = (id, updates, u) => {
    reqAdmin('updateTask', u);
    const t = getTask(id);

    if (updates.title !== undefined) t.title = updates.title.trim();
    if (updates.description !== undefined) t.description = updates.description.trim();
    if (updates.assignedTo !== undefined) {
      t.assignedTo = Array.isArray(updates.assignedTo) && updates.assignedTo.length ? updates.assignedTo : t.assignedTo;
    }
    if (updates.dueDate !== undefined) t.dueDate = updates.dueDate;
    if (updates.linkedSkill !== undefined) t.linkedSkill = updates.linkedSkill;
    if (updates.linkedProject !== undefined) t.linkedProject = updates.linkedProject;
    if (updates.projectId !== undefined) t.projectId = updates.projectId;
    if (updates.eventId !== undefined) t.eventId = updates.eventId;
    if (updates.resources !== undefined) t.resources = Array.isArray(updates.resources) ? updates.resources : t.resources;
    if (updates.priority !== undefined) t.priority = updates.priority;

    _persist();
    DS.logActivity(u?.id, `updated task "${t.title}"`, 'task', t.id);
    return _clone(t);
  };

  DS.deleteTask = (id, u) => {
    reqAdmin('deleteTask', u);
    const t = getTask(id);

    // Refuse if task has an active deliverable submission awaiting review
    if (t.submittedForReview || t.status === 'awaitingFeedback') {
      throw new Error(`Cannot delete task "${t.title}": it has an active deliverable submission awaiting review. Please approve or request rework on the submission first.`);
    }

    // Preserve audit trail: soft-delete/archive if statusHistory > 1 or assets exist
    const hasHistoryOrAssets = (t.statusHistory && t.statusHistory.length > 1) || (t.assets && t.assets.length > 0);
    if (hasHistoryOrAssets) {
      t.isArchived = true;
      t.archivedAt = new Date().toISOString();
      t.archivedBy = u?.id;
    } else {
      const idx = _data.tasks.findIndex(x => x.id === id);
      if (idx !== -1) _data.tasks.splice(idx, 1);
    }

    // Remove task ID from linked project and event task lists
    (_data.projects || []).forEach(p => {
      if (Array.isArray(p.linkedTaskIds)) {
        p.linkedTaskIds = p.linkedTaskIds.filter(tid => tid !== id);
      }
    });
    (_data.events || []).forEach(ev => {
      if (Array.isArray(ev.linkedTaskIds)) {
        ev.linkedTaskIds = ev.linkedTaskIds.filter(tid => tid !== id);
      }
    });

    _persist();
    DS.logActivity(u?.id, `deleted task "${t.title}"`, 'task', id);
    return true;
  };

  DS.updateTaskStatus = (id, st, u) => {
    const t = getTask(id), isAssigned = (t.assignedTo || []).includes(u?.id);
    if (u?.role === 'member') {
      if (!isAssigned) deny('updateTaskStatus', u, 'Not assigned to this task');
      if (st === 'completed') deny('updateTaskStatus', u, 'Members cannot directly complete tasks');
      if (st !== 'testing' && st !== 'awaitingFeedback') deny('updateTaskStatus', u, `Cannot set status to ${st}`);
    } else if (u?.role !== 'admin') deny('updateTaskStatus', u, 'Invalid role');
    t.status = st;
    if (st === 'awaitingFeedback') t.submittedForReview = true;
    if (st === 'completed') t.submittedForReview = false;
    (t.statusHistory = t.statusHistory || []).push({ status: st, timestamp: now() });
    _persist();
    DS.logActivity(u?.id, `updated status of "${t.title}" to ${st}`, 'task', t.id);
    return _clone(t);
  };

  DS.submitTaskForReview = (id, u) => {
    reqMember('submitTaskForReview', u);
    const t = getTask(id);
    if (!(t.assignedTo || []).includes(u?.id)) deny('submitTaskForReview', u, 'Not assigned to this task');
    t.submittedForReview = true; t.status = 'awaitingFeedback';
    (t.statusHistory = t.statusHistory || []).push({ status: 'awaitingFeedback', timestamp: now() });
    _persist();
    DS.logActivity(u?.id, `submitted "${t.title}" for review`, 'task', t.id);
    return _clone(t);
  };

  DS.addTaskAsset = (id, asset, u) => {
    const t = getTask(id), isAssigned = (t.assignedTo || []).includes(u?.id);
    if (u?.role !== 'admin' && !(u?.role === 'member' && isAssigned)) deny('addTaskAsset', u, 'Must be admin or assigned member');
    const uploader = member?.name || u?.name || (u?.role === 'admin' ? 'Admin' : 'Team Member');
    const entry = {
      name: asset.name || 'Deliverable', type: asset.type || 'document', source: asset.source || (asset.url ? 'url' : 'file'),
      url: asset.url || '#', data: asset.data || null, sizeText: asset.sizeText || 'Doc',
      uploadedBy: `${uploader} (${u?.role === 'admin' ? 'Admin' : 'Member'})`,
      timestamp: asset.timestamp || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    (t.assets = t.assets || []).push(entry); _persist();
    DS.logActivity(u?.id, `uploaded deliverable "${asset.name}" for "${t.title}"`, 'task', t.id);
    return _clone(t);
  };

  DS.approveSubmission = (id, u) => {
    reqAdmin('approveSubmission', u);
    const t = getTask(id);
    t.status = 'completed'; t.submittedForReview = false;
    (t.statusHistory = t.statusHistory || []).push({ status: 'completed', timestamp: now() });
    _persist();
    DS.logActivity(u?.id, `approved "${t.title}"`, 'task', t.id);
    return _clone(t);
  };

  DS.reworkSubmission = (id, notes, u) => {
    reqAdmin('reworkSubmission', u);
    const t = getTask(id);
    t.status = 'reworkNeeded'; t.submittedForReview = false; t.reworkNotes = notes || '';
    (t.statusHistory = t.statusHistory || []).push({ status: 'reworkNeeded', timestamp: now(), notes: notes || '' });
    _persist();
    DS.logActivity(u?.id, `requested rework on "${t.title}"`, 'task', t.id);
    return _clone(t);
  };

  DS.createProject = (data, u) => {
    reqAdmin('createProject', u);
    const p = {
      id: data.id || ('p' + (Date.now() % 1000)), name: data.name || 'New Project', description: data.description || '',
      status: data.status || 'active', startDate: data.startDate || new Date().toISOString().slice(0, 10), targetDate: data.targetDate || '',
      memberIds: Array.isArray(data.memberIds) ? data.memberIds : [], linkedTaskIds: Array.isArray(data.linkedTaskIds) ? data.linkedTaskIds : []
    };
    _data.projects.unshift(p); _persist();
    DS.logActivity(u?.id, `created project "${p.name}"`, 'project', p.id);
    return _clone(p);
  };

  const getProject = (id) => {
    const p = (_data.projects || []).find(x => x.id === id);
    if (!p) throw new Error(`Project not found: ${id}`);
    return p;
  };

  DS.updateProject = (id, updates, u) => {
    reqAdmin('updateProject', u);
    const p = getProject(id);
    if (updates.name !== undefined) p.name = updates.name.trim();
    if (updates.description !== undefined) p.description = updates.description.trim();
    if (updates.status !== undefined) p.status = updates.status;
    if (updates.startDate !== undefined) p.startDate = updates.startDate;
    if (updates.targetDate !== undefined) p.targetDate = updates.targetDate;
    if (updates.memberIds !== undefined) {
      p.memberIds = Array.isArray(updates.memberIds) ? updates.memberIds : p.memberIds;
    }
    if (updates.linkedTaskIds !== undefined) {
      p.linkedTaskIds = Array.isArray(updates.linkedTaskIds) ? updates.linkedTaskIds : p.linkedTaskIds;
    }
    _persist();
    DS.logActivity(u?.id, `updated project "${p.name}"`, 'project', p.id);
    return _clone(p);
  };

  DS.deleteProject = (id, u) => {
    reqAdmin('deleteProject', u);
    const p = getProject(id);

    // Conflict check: refuse if active tasks are still linked to this project
    const activeLinkedTasks = (_data.tasks || []).filter(t => 
      t.isArchived !== true &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      ((p.linkedTaskIds || []).includes(t.id) || t.projectId === id)
    );

    if (activeLinkedTasks.length > 0) {
      const titles = activeLinkedTasks.map(t => `"${t.title}"`).slice(0, 3).join(', ');
      const more = activeLinkedTasks.length > 3 ? ` and ${activeLinkedTasks.length - 3} more` : '';
      throw new Error(`Cannot delete project "${p.name}": ${activeLinkedTasks.length} active task(s) are still linked (${titles}${more}). Reassign or close these tasks before deleting.`);
    }

    // Clean up task references: remove project links from completed/cancelled tasks
    (_data.tasks || []).forEach(t => {
      if (t.projectId === id) t.projectId = null;
      if (t.linkedProject === p.name) t.linkedProject = null;
    });

    const idx = _data.projects.findIndex(x => x.id === id);
    if (idx !== -1) _data.projects.splice(idx, 1);

    _persist();
    DS.logActivity(u?.id, `deleted project "${p.name}"`, 'project', id);
    return true;
  };

  const getEvent = (id) => {
    const ev = (_data.events || []).find(x => x.id === id);
    if (!ev) throw new Error(`Event not found: ${id}`);
    return ev;
  };

  DS.checkEventVenueConflict = (eventId, venue, eventDate) => {
    if (!venue || !eventDate) return null;
    const cleanVenue = venue.trim().toLowerCase();
    const other = (_data.events || []).find(e => e.id !== eventId && (e.venue || '').trim().toLowerCase() === cleanVenue && e.eventDate === eventDate);
    return other ? _clone(other) : null;
  };

  DS.createEvent = (data, u) => {
    reqAdmin('createEvent', u);
    const ev = {
      id: data.id || ('e' + (Date.now() % 1000)), name: data.name || 'New Event', description: data.description || '', venue: data.venue || '',
      eventDate: data.eventDate || new Date().toISOString().slice(0, 10), status: data.status || 'upcoming',
      members: Array.isArray(data.members) ? data.members : [], linkedTaskIds: Array.isArray(data.linkedTaskIds) ? data.linkedTaskIds : []
    };
    _data.events.unshift(ev); _persist();
    DS.logActivity(u?.id, `created event "${ev.name}"`, 'event', ev.id);
    return _clone(ev);
  };

  DS.updateEvent = (id, updates, u) => {
    reqAdmin('updateEvent', u);
    const ev = getEvent(id);
    if (updates.name !== undefined) ev.name = updates.name.trim();
    if (updates.title !== undefined) ev.name = updates.title.trim();
    if (updates.description !== undefined) ev.description = updates.description.trim();
    if (updates.venue !== undefined) ev.venue = updates.venue.trim();
    if (updates.eventDate !== undefined) ev.eventDate = updates.eventDate;
    if (updates.date !== undefined) ev.eventDate = updates.date;
    if (updates.status !== undefined) ev.status = updates.status;
    if (updates.members !== undefined) {
      ev.members = Array.isArray(updates.members) ? updates.members : ev.members;
    }
    if (updates.linkedTaskIds !== undefined) {
      ev.linkedTaskIds = Array.isArray(updates.linkedTaskIds) ? updates.linkedTaskIds : ev.linkedTaskIds;
    }

    _persist();
    DS.logActivity(u?.id, `updated event "${ev.name}"`, 'event', ev.id);
    return _clone(ev);
  };

  DS.deleteEvent = (id, u) => {
    reqAdmin('deleteEvent', u);
    const ev = getEvent(id);

    // Conflict check: refuse if active prep tasks are still linked to this event
    const activeLinkedTasks = (_data.tasks || []).filter(t => 
      t.isArchived !== true &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      ((ev.linkedTaskIds || []).includes(t.id) || t.eventId === id)
    );

    if (activeLinkedTasks.length > 0) {
      const titles = activeLinkedTasks.map(t => `"${t.title}"`).slice(0, 3).join(', ');
      const more = activeLinkedTasks.length > 3 ? ` and ${activeLinkedTasks.length - 3} more` : '';
      throw new Error(`Cannot delete event "${ev.name}": ${activeLinkedTasks.length} active preparation task(s) are still linked (${titles}${more}). Reassign or close these tasks before deleting.`);
    }

    // Clean up task references: remove event links from completed/cancelled tasks
    (_data.tasks || []).forEach(t => {
      if (t.eventId === id) t.eventId = null;
    });

    const idx = _data.events.findIndex(x => x.id === id);
    if (idx !== -1) _data.events.splice(idx, 1);

    _persist();
    DS.logActivity(u?.id, `deleted event "${ev.name}"`, 'event', id);
    return true;
  };

  DS.deleteAsset = (ref, u) => {
    reqAdmin('deleteAsset', u);
    if (!ref || typeof ref !== 'object') {
      throw new Error('assetReference must be an object specifying type and identifier');
    }

    if (ref.type === 'task') {
      const taskId = ref.taskId;
      if (!taskId) throw new Error('taskId is required for task asset deletion');
      const t = getTask(taskId);
      if (!Array.isArray(t.assets) || t.assets.length === 0) {
        throw new Error(`Task "${t.title}" has no assets to delete`);
      }

      const idx = t.assets.findIndex((a, i) => {
        if (ref.assetId && (a.id === ref.assetId || a === ref.assetId)) return true;
        if (ref.assetIndex !== undefined && ref.assetIndex === i) return true;
        const name = typeof a === 'string' ? a : a.name;
        if (ref.assetName && name === ref.assetName) return true;
        return false;
      });

      if (idx === -1) {
        throw new Error(`Asset not found on task "${t.title}"`);
      }

      const removed = t.assets.splice(idx, 1)[0];
      const assetName = typeof removed === 'string' ? removed : (removed.name || 'Deliverable');
      _persist();
      DS.logActivity(u?.id, `removed asset "${assetName}" from task "${t.title}"`, 'asset', taskId);
      return true;
    }

    if (ref.type === 'engagementSubmission' || ref.type === 'engagement') {
      const subId = ref.submissionId || ref.id;
      if (!subId) throw new Error('submissionId is required for engagement proof deletion');
      const sub = (_data.engagementSubmissions || []).find(s => s.id === subId);
      if (!sub) throw new Error(`Engagement submission not found: ${subId}`);

      const proofName = sub.proofValue ? (sub.proofValue.split('/').pop() || sub.proofValue) : 'Proof';
      sub.proofValue = null;
      sub.proofType = null;
      _persist();
      DS.logActivity(u?.id, `removed proof "${proofName}" from engagement "${sub.title}"`, 'asset', subId);
      return true;
    }

    if (ref.type === 'motivationSubmission' || ref.type === 'motivation') {
      const subId = ref.submissionId || ref.id;
      if (!subId) throw new Error('submissionId is required for motivation proof deletion');
      const sub = (_data.motivationSubmissions || []).find(s => s.id === subId);
      if (!sub) throw new Error(`Motivation submission not found: ${subId}`);

      const proofName = sub.proofValue ? (sub.proofValue.split('/').pop() || sub.proofValue) : 'Proof';
      sub.proofValue = null;
      sub.proofType = null;
      _persist();
      DS.logActivity(u?.id, `removed proof "${proofName}" from motivation "${sub.title}"`, 'asset', subId);
      return true;
    }

    if (ref.type === 'project') {
      const projectId = ref.projectId || ref.id;
      if (!projectId) throw new Error('projectId is required for project asset deletion');
      const p = getProject(projectId);
      if (!Array.isArray(p.assets) || p.assets.length === 0) {
        throw new Error(`Project "${p.name}" has no assets to delete`);
      }

      const idx = p.assets.findIndex((a, i) => {
        if (ref.assetId && (a.id === ref.assetId || a === ref.assetId)) return true;
        if (ref.assetIndex !== undefined && ref.assetIndex === i) return true;
        const name = typeof a === 'string' ? a : a.name;
        if (ref.assetName && name === ref.assetName) return true;
        return false;
      });

      if (idx === -1) throw new Error(`Asset not found on project "${p.name}"`);
      const removed = p.assets.splice(idx, 1)[0];
      const assetName = typeof removed === 'string' ? removed : (removed.name || 'Asset');
      _persist();
      DS.logActivity(u?.id, `removed asset "${assetName}" from project "${p.name}"`, 'asset', projectId);
      return true;
    }

    throw new Error(`Unsupported asset reference type: ${ref.type}`);
  };
})();
