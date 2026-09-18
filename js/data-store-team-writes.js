/**
 * Useme Team - Centralized Data Store (Team, Engagement, Zoom & Skill Writes)
 */
(function() {
  const DS = window.DataStore;
  if (!DS) throw new Error('DataStore core must be loaded first');
  const { _data, _persist, _clone } = DS;
  const deny = (act, u, msg) => {
    console.error(`[DataStore] Unauthorized: ${act} (${msg}) by ${u?.id || 'unknown'} [${u?.role}]`);
    throw new Error(`[DataStore] Unauthorized: ${act} (${msg})`);
  };
  const reqAdmin = (act, u) => { if (u?.role !== 'admin') deny(act, u, 'Admin only'); };
  const reqMember = (act, u) => { if (u?.role !== 'member') deny(act, u, 'Member only'); };

  const logAct = (list, act, data, u, defType) => {
    reqMember(act, u);
    const entry = {
      id: data.id || (`${act === 'logEngagementActivity' ? 'eng' : 'mot'}-${Date.now()}`),
      memberId: u.id, type: data.type || defType, title: data.title || 'Activity',
      date: data.date || new Date().toISOString().slice(0, 10), proofType: data.proofType || 'url',
      proofValue: data.proofValue || '', status: 'pending'
    };
    list.unshift(entry); _persist();
    DS.logActivity(u?.id, `logged "${data.title || 'Activity'}"`, defType === 'social' ? 'engagement' : 'motivation', entry.id);
    return _clone(entry);
  };

  DS.addTeamMember = (data, u) => {
    reqAdmin('addTeamMember', u);
    const email = (data.email || '').toLowerCase().trim();
    if (!email) throw new Error('Email address is required');
    if (_data.members.some(m => (m.email || '').toLowerCase() === email)) throw new Error('A team member with this email address already exists');
    const name = (data.name || 'New Member').trim();
    const username = (data.username || name.toLowerCase().replace(/[^a-z0-9]+/g, '.')).toLowerCase().trim();
    if (!username) throw new Error('Username is required');
    if (_data.members.some(m => (m.username || '').toLowerCase() === username)) throw new Error('A team member with this username already exists');
    const rawPass = (data.initialPassword || data.password || data.tempPassword || '').trim();
    if (!rawPass || rawPass.length < 4) throw new Error('An initial temporary password of at least 4 characters is required');
    const passwordHash = DS.hashPassword(rawPass);

    const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM';
    const m = {
      id: data.id || ('m' + (_data.members.length + 1)), name, username, passwordHash, email, phone: data.phone || '+91 98765 43210',
      role: data.role || 'Member', reportsTo: data.reportsTo || null, avatar: data.avatar || initials, activeTasks: 0,
      department: data.department || (data.skillCategory === 'design' ? 'Product & Design' : data.skillCategory === 'data' ? 'Data & Analytics' : data.skillCategory === 'marketing' ? 'Growth & Marketing' : data.skillCategory === 'finance' ? 'Finance & Operations' : data.skillCategory === 'support' ? 'Customer Support' : 'Engineering'),
      band: data.band || 'L4 - Specialist', location: data.location || 'Bangalore, IN',
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      joinedDate: data.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      skills: Array.isArray(data.skills) ? data.skills : ['General Competency'], skillCategory: data.skillCategory || data.category || 'dev',
      proficiency: data.proficiency || 'Beginner', verified: false, rank: '#' + (_data.members.length + 1),
      kpiScore: data.kpiScore || 75, kriPenalty: data.kriPenalty || 0, compositeScore: (data.kpiScore || 75) - (data.kriPenalty || 0),
      isActive: true
    };
    _data.members.push(m);
    _data.skillProficiencies = _data.skillProficiencies || [];
    _data.skillProficiencies.push({
      id: `sp-${m.id}-${m.skillCategory}`,
      memberId: m.id,
      categoryId: m.skillCategory,
      level: m.proficiency || 'Beginner',
      lastUpdated: new Date().toISOString(),
      updatedBy: u?.id || 'admin'
    });
    _persist();
    DS.logActivity(u?.id, `added ${m.name} to the team`, 'member', m.id);
    return _clone(m);
  };

  DS.registerMember = (data) => {
    const name = (data.name || '').trim();
    if (!name) throw new Error('Full name is required');
    const email = (data.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) throw new Error('A valid email address is required');
    if (_data.members.some(m => (m.email || '').toLowerCase() === email)) {
      throw new Error('A member with this email address already exists');
    }
    const username = (data.username || name.toLowerCase().replace(/[^a-z0-9]+/g, '.')).toLowerCase().trim();
    if (!username || username.length < 3) throw new Error('Username must be at least 3 characters');
    if (_data.members.some(m => (m.username || '').toLowerCase() === username)) {
      throw new Error('This username is already taken');
    }
    const rawPass = (data.password || '').trim();
    if (!rawPass || rawPass.length < 4) throw new Error('Password must be at least 4 characters');

    const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM';
    const m = {
      id: data.id || ('m' + (_data.members.length + 1)),
      name, username,
      passwordHash: DS.hashPassword(rawPass),
      email,
      phone: data.phone || '',
      role: 'Unassigned',
      department: 'Unassigned',
      reportsTo: null,
      avatar: initials,
      band: 'Unassigned',
      location: data.location || 'Bangalore, IN',
      startDate: new Date().toISOString().slice(0, 10),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      skills: [],
      skillCategory: null,
      proficiency: 'Beginner',
      verified: false,
      rank: '#' + (_data.members.length + 1),
      kpiScore: 70,
      kriPenalty: 0,
      compositeScore: 70,
      isActive: true,
      isUnassigned: true
    };
    _data.members.push(m);
    _persist();
    DS.logActivity(m.id, `registered credentials as a new team member`, 'member', m.id);
    return _clone(m);
  };

  DS.assignMemberToHierarchy = (id, details, u) => {
    reqAdmin('assignMemberToHierarchy', u);
    const m = _data.members.find(x => x.id === id);
    if (!m) throw new Error(`Member not found: ${id}`);
    m.role = details.role || 'Member';
    m.department = details.department || 'Engineering';
    m.reportsTo = details.reportsTo || null;
    m.band = details.band || 'L4 - Specialist';
    m.location = details.location || 'Bangalore, IN';
    m.startDate = details.startDate || new Date().toISOString().slice(0, 10);
    m.skillCategory = details.skillCategory || 'dev';
    if (details.avatar) m.avatar = details.avatar;
    m.isUnassigned = false;

    _data.skillProficiencies = _data.skillProficiencies || [];
    const existingSp = _data.skillProficiencies.find(sp => sp.memberId === m.id && sp.categoryId === m.skillCategory);
    if (!existingSp) {
      _data.skillProficiencies.push({
        id: `sp-${m.id}-${m.skillCategory}`,
        memberId: m.id,
        categoryId: m.skillCategory,
        level: details.proficiency || 'Beginner',
        lastUpdated: new Date().toISOString(),
        updatedBy: u?.id || 'admin'
      });
    }
    _persist();
    const mgr = _data.members.find(x => x.id === m.reportsTo);
    const mgrName = mgr ? mgr.name : (m.reportsTo || 'None');
    DS.logActivity(u?.id, `assigned ${m.name} as ${m.role} reporting to ${mgrName}`, 'member', m.id);
    return _clone(m);
  };

  DS.getUnassignedMembers = () => {
    return (_data.members || []).filter(m => m.isActive !== false && (m.isUnassigned === true || m.role === 'Unassigned'));
  };

  DS.updateMemberRole = (id, role, u) => {
    reqAdmin('updateMemberRole', u);
    const m = _data.members.find(x => x.id === id);
    if (!m) throw new Error(`Member not found: ${id}`);
    m.role = role; m.lastRoleUpdated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    _persist();
    DS.logActivity(u?.id, `updated role of ${m.name} to ${role}`, 'member', m.id);
    return _clone(m);
  };

  DS.logEngagementActivity = (d, u) => logAct(_data.engagementSubmissions, 'logEngagementActivity', d, u, 'social');

  DS.logMotivationActivity = (d, u) => logAct(_data.motivationSubmissions, 'logMotivationActivity', d, u, 'groupTalk');

  DS.updateEngagementSubmissionStatus = (id, st, u) => {
    reqAdmin('updateEngagementSubmissionStatus', u);
    const item = _data.engagementSubmissions.find(s => s.id === id) || _data.motivationSubmissions.find(s => s.id === id);
    if (!item) throw new Error(`Submission not found: ${id}`);
    item.status = st; _persist();
    DS.logActivity(u?.id, `${st === 'approved' ? 'approved' : 'marked ' + st} "${item.title}"`, 'submission', item.id);
    return _clone(item);
  };

  DS.setZoomAttendance = (sid, mid, st, u) => {
    reqAdmin('setZoomAttendance', u);
    const sess = sid ? _data.zoomSessions.find(z => z.id === sid) : _data.zoomSessions[0];
    if (!sess) throw new Error(`Zoom session not found: ${sid}`);
    sess.attendance = sess.attendance || {};
    sess.attendance[mid] = st;
    sess.attendanceRecords = sess.attendanceRecords || {};
    sess.attendanceRecords[mid] = {
      sessionId: sess.id,
      memberId: mid,
      capturedAt: new Date().toISOString(),
      status: st,
      source: 'admin-override'
    };
    _persist();
    const targetMember = _data.members.find(m => m.id === mid);
    const mName = targetMember ? targetMember.name : mid;
    DS.logActivity(u?.id, `marked ${mName} as ${st} in "${sess.title}"`, 'attendance', sess.id);
    return _clone(sess);
  };

  DS.recordZoomSelfCapture = (sid, mid, captureTime, u) => {
    if (!u) throw new Error('Unauthorized: login session required');
    const sess = _data.zoomSessions.find(z => z.id === sid);
    if (!sess) throw new Error(`Zoom session not found: ${sid}`);
    const existingRec = sess.attendanceRecords?.[mid];
    if (existingRec && existingRec.source === 'admin-override') {
      return _clone(sess);
    }
    const start = new Date(sess.scheduledStart || (sess.date + 'T10:00:00.000Z')).getTime();
    const capTime = captureTime ? new Date(captureTime).getTime() : Date.now();
    const diffMin = (capTime - start) / 60000;
    let status = 'absent';
    if (diffMin <= 5) status = 'present';
    else if (diffMin <= 15) status = 'late';
    else status = 'absent';

    sess.attendance = sess.attendance || {};
    sess.attendance[mid] = status;
    sess.attendanceRecords = sess.attendanceRecords || {};
    sess.attendanceRecords[mid] = {
      sessionId: sess.id,
      memberId: mid,
      capturedAt: new Date(capTime).toISOString(),
      status,
      source: 'self-capture'
    };
    _persist();
    const targetMember = _data.members.find(m => m.id === mid);
    const mName = targetMember ? targetMember.name : mid;
    DS.logActivity(mid, `joined "${sess.title}" (${status}, self-capture)`, 'attendance', sess.id);
    return _clone(sess);
  };

  DS.saveTargetGroup = (group, u) => {
    reqAdmin('saveTargetGroup', u);
    if (!group || !group.name || isNaN(Number(group.targetPoints))) {
      throw new Error('Group name and numeric target points are required');
    }
    _data.targetGroups = _data.targetGroups || [];
    let saved;
    if (group.id) {
      const idx = _data.targetGroups.findIndex(g => g.id === group.id);
      if (idx !== -1) {
        _data.targetGroups[idx] = {
          ..._data.targetGroups[idx],
          name: group.name,
          memberIds: Array.isArray(group.memberIds) ? group.memberIds : [],
          targetPoints: Number(group.targetPoints)
        };
        saved = _data.targetGroups[idx];
      }
    }
    if (!saved) {
      saved = {
        id: group.id || `tg-${Date.now()}`,
        name: group.name,
        memberIds: Array.isArray(group.memberIds) ? group.memberIds : [],
        targetPoints: Number(group.targetPoints)
      };
      _data.targetGroups.push(saved);
    }
    _persist();
    DS.logActivity(u?.id, `saved target group "${saved.name}" (${saved.targetPoints} pts)`, 'cycle', saved.id);
    return _clone(saved);
  };

  DS.deleteTargetGroup = (id, u) => {
    reqAdmin('deleteTargetGroup', u);
    _data.targetGroups = _data.targetGroups || [];
    const idx = _data.targetGroups.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Target group not found');
    const removed = _data.targetGroups.splice(idx, 1)[0];
    _persist();
    DS.logActivity(u?.id, `deleted target group "${removed.name}"`, 'cycle', id);
    return true;
  };

  DS.setMemberTargetOverride = (memberId, category, points, u) => {
    reqAdmin('setMemberTargetOverride', u);
    _data.memberTargetOverrides = _data.memberTargetOverrides || {};
    _data.memberTargetOverrides[memberId] = _data.memberTargetOverrides[memberId] || {};
    if (points === null || points === undefined || points === '') {
      delete _data.memberTargetOverrides[memberId][category];
      if (Object.keys(_data.memberTargetOverrides[memberId]).length === 0) {
        delete _data.memberTargetOverrides[memberId];
      }
    } else {
      _data.memberTargetOverrides[memberId][category] = Number(points);
    }
    _persist();
    DS.logActivity(u?.id, `updated target override for member ${memberId} (${category}: ${points} pts)`, 'cycle', memberId);
    return _clone(_data.memberTargetOverrides);
  };

  // Skill Proficiency CRUD (Self-declaration by member, override by admin)
  DS.upgradeSkillProficiency = (memberId, categoryId, newLevel, currentUser) => {
    if (!currentUser) throw new Error('Unauthorized: login session required');
    const isAdmin = currentUser.role === 'admin';
    // Member can only set this for their OWN memberId (ignore any other memberId passed in, substitute currentUser.id)
    const targetMemberId = isAdmin ? (memberId || currentUser.id) : currentUser.id;

    const m = (_data.members || []).find(x => x.id === targetMemberId);
    if (!m) throw new Error(`Member not found: ${targetMemberId}`);

    // Category validation
    _data.skillCategories = _data.skillCategories || [];
    const cat = _data.skillCategories.find(c => c.id === categoryId || c.name.toLowerCase() === (categoryId || '').toLowerCase());
    if (!cat) throw new Error(`Skill category not found: ${categoryId}`);
    const catId = cat.id;

    const cleanLevel = typeof newLevel === 'string' ? newLevel.trim() : String(newLevel);
    if (!cleanLevel) throw new Error('Proficiency level is required');

    _data.skillProficiencies = _data.skillProficiencies || [];
    let rec = _data.skillProficiencies.find(p => p.memberId === targetMemberId && p.categoryId === catId);
    const now = new Date().toISOString();
    const updatedBy = currentUser.id;

    if (rec) {
      rec.level = cleanLevel;
      rec.lastUpdated = now;
      rec.updatedBy = updatedBy;
    } else {
      rec = {
        id: `sp-${targetMemberId}-${catId}`,
        memberId: targetMemberId,
        categoryId: catId,
        level: cleanLevel,
        lastUpdated: now,
        updatedBy
      };
      _data.skillProficiencies.push(rec);
    }

    // Keep member record in sync: if primary category matches or none set
    if (m.skillCategory === catId || !m.skillCategory) {
      m.proficiency = cleanLevel;
      m.verified = isAdmin;
    }

    // Update skills array if it mentions this category or skill
    if (Array.isArray(m.skills)) {
      const idx = m.skills.findIndex(s => s.toLowerCase().includes(cat.name.toLowerCase()));
      if (idx !== -1) m.skills[idx] = `${cat.name} (${cleanLevel})`;
    }

    _persist();

    const isSelf = currentUser.id === targetMemberId;
    const actionText = isSelf
      ? `updated own ${cat.name} proficiency to ${cleanLevel}`
      : `updated ${m.name}'s ${cat.name} proficiency to ${cleanLevel}`;
    DS.logActivity(currentUser.id, actionText, 'skill', rec.id);

    return _clone(rec);
  };

  // Activity Type CRUD (Admin Only)
  DS.createActivityType = (data, u) => {
    reqAdmin('createActivityType', u);
    if (!data?.label || !data?.category) throw new Error('Activity type label and category are required');
    const category = data.category.toLowerCase().trim();
    if (category !== 'outreach' && category !== 'motivation') throw new Error('Category must be "outreach" or "motivation"');
    const label = data.label.trim();
    const id = data.id ? data.id.trim() : (label.toLowerCase().replace(/[^a-z0-9]/g, '') || ('act-' + Date.now()));
    _data.activityTypes = _data.activityTypes || [];
    if (_data.activityTypes.some(t => t.id === id || t.label.toLowerCase() === label.toLowerCase())) {
      throw new Error(`Activity type with ID "${id}" or label "${label}" already exists`);
    }
    const pointValue = Number(data.pointValue !== undefined ? data.pointValue : 2);
    if (isNaN(pointValue) || pointValue < 0) throw new Error('Point value must be a non-negative number');
    const item = {
      id,
      label,
      category,
      pointValue,
      requiresProof: data.requiresProof !== undefined ? Boolean(data.requiresProof) : true
    };
    _data.activityTypes.push(item);
    _persist();
    DS.logActivity(u?.id, `created activity type "${item.label}" (${item.category}, ${item.pointValue} pts)`, 'activityType', item.id);
    return _clone(item);
  };

  DS.updateActivityType = (id, updates, u) => {
    reqAdmin('updateActivityType', u);
    const item = (_data.activityTypes || []).find(t => t.id === id);
    if (!item) throw new Error(`Activity type not found: ${id}`);
    if (updates.label) item.label = updates.label.trim();
    if (updates.category) {
      const cat = updates.category.toLowerCase().trim();
      if (cat !== 'outreach' && cat !== 'motivation') throw new Error('Category must be "outreach" or "motivation"');
      item.category = cat;
    }
    if (updates.pointValue !== undefined) {
      const pv = Number(updates.pointValue);
      if (isNaN(pv) || pv < 0) throw new Error('Point value must be a non-negative number');
      item.pointValue = pv;
    }
    if (updates.requiresProof !== undefined) {
      item.requiresProof = Boolean(updates.requiresProof);
    }
    _persist();
    DS.logActivity(u?.id, `updated activity type "${item.label}" (${item.pointValue} pts)`, 'activityType', item.id);
    return _clone(item);
  };

  DS.deleteActivityType = (id, u) => {
    reqAdmin('deleteActivityType', u);
    const idx = (_data.activityTypes || []).findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Activity type not found: ${id}`);
    const item = _data.activityTypes[idx];
    const engConflict = (_data.engagementSubmissions || []).some(s => s.type === id);
    const motConflict = (_data.motivationSubmissions || []).some(s => s.type === id);
    if (engConflict || motConflict) {
      throw new Error(`Cannot delete activity type "${item.label}": it is referenced by existing submissions.`);
    }
    _data.activityTypes.splice(idx, 1);
    _persist();
    DS.logActivity(u?.id, `deleted activity type "${item.label}"`, 'activityType', id);
    return true;
  };

  // Zoom Session CRUD (Admin Only)
  DS.createZoomSession = (data, u) => {
    reqAdmin('createZoomSession', u);
    if (!data?.title || !data?.date) throw new Error('Title and date are required for Zoom session');
    const id = data.id ? data.id.trim() : ('z-' + Date.now());
    const sess = {
      id,
      title: data.title.trim(),
      date: data.date.trim(),
      time: (data.time || '10:00 AM').trim(),
      attendance: {}
    };
    _data.zoomSessions = _data.zoomSessions || [];
    _data.zoomSessions.unshift(sess);
    _persist();
    DS.logActivity(u?.id, `created Zoom session "${sess.title}" on ${sess.date}`, 'zoom', sess.id);
    return _clone(sess);
  };

  DS.updateZoomSession = (id, updates, u) => {
    reqAdmin('updateZoomSession', u);
    const sess = (_data.zoomSessions || []).find(z => z.id === id);
    if (!sess) throw new Error(`Zoom session not found: ${id}`);
    if (updates.title) sess.title = updates.title.trim();
    if (updates.date) sess.date = updates.date.trim();
    if (updates.time) sess.time = updates.time.trim();
    _persist();
    DS.logActivity(u?.id, `updated Zoom session "${sess.title}"`, 'zoom', sess.id);
    return _clone(sess);
  };

  DS.deleteZoomSession = (id, u) => {
    reqAdmin('deleteZoomSession', u);
    const idx = (_data.zoomSessions || []).findIndex(z => z.id === id);
    if (idx === -1) throw new Error(`Zoom session not found: ${id}`);
    const sess = _data.zoomSessions[idx];
    _data.zoomSessions.splice(idx, 1);
    _persist();
    DS.logActivity(u?.id, `deleted Zoom session "${sess.title}"`, 'zoom', id);
    return true;
  };

  // Submission Edit & Delete (Admin Only)
  DS.updateSubmission = (submissionId, updates, u) => {
    reqAdmin('updateSubmission', u);
    let item = (_data.engagementSubmissions || []).find(s => s.id === submissionId);
    if (!item) item = (_data.motivationSubmissions || []).find(s => s.id === submissionId);
    if (!item) {
      const task = (_data.tasks || []).find(t => t.id === submissionId);
      if (task) {
        if (updates.reworkNotes !== undefined) task.reworkNotes = updates.reworkNotes;
        if (updates.status !== undefined) task.status = updates.status;
        _persist();
        DS.logActivity(u?.id, `updated submission for task "${task.title}"`, 'submission', task.id);
        return _clone(task);
      }
      throw new Error(`Submission not found: ${submissionId}`);
    }
    if (updates.title !== undefined) item.title = updates.title.trim();
    if (updates.date !== undefined) item.date = updates.date.trim();
    if (updates.type !== undefined) item.type = updates.type.trim();
    if (updates.proofType !== undefined) item.proofType = updates.proofType;
    if (updates.proofValue !== undefined) item.proofValue = updates.proofValue.trim();
    if (updates.status !== undefined) item.status = updates.status;
    _persist();
    DS.logActivity(u?.id, `updated submission "${item.title}"`, 'submission', item.id);
    return _clone(item);
  };

  DS.deleteSubmission = (submissionId, u) => {
    reqAdmin('deleteSubmission', u);
    let idx = (_data.engagementSubmissions || []).findIndex(s => s.id === submissionId);
    let deleted = null;
    if (idx !== -1) {
      deleted = _data.engagementSubmissions.splice(idx, 1)[0];
    } else {
      idx = (_data.motivationSubmissions || []).findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        deleted = _data.motivationSubmissions.splice(idx, 1)[0];
      }
    }
    if (!deleted) {
      const task = (_data.tasks || []).find(t => t.id === submissionId);
      if (task && (task.submittedForReview || task.status === 'awaitingFeedback')) {
        task.submittedForReview = false;
        task.status = 'inProgress';
        (task.statusHistory = task.statusHistory || []).push({
          status: 'inProgress',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note: 'Submission removed from review queue by admin'
        });
        _persist();
        DS.logActivity(u?.id, `removed review queue submission for task "${task.title}"`, 'submission', task.id);
        return true;
      }
      throw new Error(`Submission not found: ${submissionId}`);
    }
    _persist();
    DS.logActivity(u?.id, `deleted submission "${deleted.title}"`, 'submission', submissionId);
    return true;
  };

  function checkCircularLoop(targetMgrId, memberId, members) {
    if (!targetMgrId || !memberId) return false;
    if (targetMgrId === memberId) return true;
    let curr = members.find(m => m.id === targetMgrId);
    while (curr) {
      if (curr.reportsTo === memberId) return true;
      curr = members.find(m => m.id === curr.reportsTo);
    }
    return false;
  }

  // Department CRUD (Admin Only)
  DS.createDepartment = (data, u) => {
    reqAdmin('createDepartment', u);
    if (!data?.name) throw new Error('Department name is required');
    const name = data.name.trim();
    _data.departments = _data.departments || [];
    if (_data.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A department with name "${name}" already exists`);
    }
    const id = data.id ? data.id.trim() : ('dept-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const newDept = {
      id,
      name,
      colorHex: (data.colorHex || '#2563EB').trim(),
      order: data.order !== undefined ? Number(data.order) : (_data.departments.length + 1)
    };
    _data.departments.push(newDept);
    _persist();
    DS.logActivity(u?.id, `created department "${newDept.name}"`, 'department', newDept.id);
    return _clone(newDept);
  };

  DS.updateDepartment = (id, updates, u) => {
    reqAdmin('updateDepartment', u);
    const dept = (_data.departments || []).find(d => d.id === id);
    if (!dept) throw new Error(`Department not found: ${id}`);
    const oldName = dept.name;
    if (updates.name && updates.name.trim() !== oldName) {
      const newName = updates.name.trim();
      if (_data.departments.some(d => d.id !== id && d.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`A department with name "${newName}" already exists`);
      }
      dept.name = newName;
      (_data.members || []).forEach(m => {
        if (m.department === oldName) m.department = newName;
      });
    }
    if (updates.colorHex) dept.colorHex = updates.colorHex.trim();
    if (updates.order !== undefined) dept.order = Number(updates.order);
    _persist();
    DS.logActivity(u?.id, `updated department "${dept.name}"`, 'department', dept.id);
    return _clone(dept);
  };

  DS.deleteDepartment = (id, u) => {
    reqAdmin('deleteDepartment', u);
    const idx = (_data.departments || []).findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Department not found: ${id}`);
    const dept = _data.departments[idx];

    // Conflict check: refuse if any active member belongs to this department
    const blockingMembers = (_data.members || []).filter(m => (m.isActive !== false) && (m.department === dept.name || m.department === dept.id));
    if (blockingMembers.length > 0) {
      const names = blockingMembers.map(m => m.name).join(', ');
      throw new Error(`Cannot delete department "${dept.name}": ${blockingMembers.length} member(s) currently assigned (${names}). Reassign them before deleting this department.`);
    }

    _data.departments.splice(idx, 1);
    _persist();
    DS.logActivity(u?.id, `deleted department "${dept.name}"`, 'department', id);
    return true;
  };

  // Member Update (Admin Only)
  DS.updateMember = (memberId, updates, u) => {
    reqAdmin('updateMember', u);
    const m = (_data.members || []).find(x => x.id === memberId);
    if (!m) throw new Error(`Member not found: ${memberId}`);

    // Department validation
    if (updates.department !== undefined) {
      const deptVal = updates.department.trim();
      const validDepts = _data.departments || [];
      const match = validDepts.find(d => d.name.toLowerCase() === deptVal.toLowerCase() || d.id === deptVal);
      if (!match) {
        throw new Error(`Invalid department "${deptVal}". Department must exist in department registry.`);
      }
      m.department = match.name;
    }

    // ReportsTo validation
    if (updates.reportsTo !== undefined) {
      const newMgrId = updates.reportsTo ? updates.reportsTo.trim() : null;
      if (newMgrId === memberId) {
        throw new Error('A member cannot report to themselves.');
      }
      if (newMgrId && checkCircularLoop(newMgrId, memberId, _data.members)) {
        throw new Error('Circular reporting loop detected: a member cannot report directly or indirectly to themselves.');
      }
      m.reportsTo = newMgrId;
    }

    if (updates.name !== undefined) m.name = updates.name.trim();
    if (updates.role !== undefined) m.role = updates.role.trim();
    if (updates.band !== undefined) m.band = updates.band.trim();
    if (updates.location !== undefined) m.location = updates.location.trim();
    if (updates.phone !== undefined) m.phone = updates.phone.trim();
    if (updates.startDate !== undefined) m.startDate = updates.startDate;

    _persist();
    DS.logActivity(u?.id, `changed ${m.name}'s profile (${m.role}, ${m.department})`, 'member', memberId);
    return _clone(m);
  };

  // Member Delete / Offboard (Admin Only)
  DS.deleteMember = (memberId, currentUser, options = {}) => {
    reqAdmin('deleteMember', currentUser);
    const m = (_data.members || []).find(x => x.id === memberId);
    if (!m) throw new Error(`Member not found: ${memberId}`);

    // Check direct reports
    const directReports = (_data.members || []).filter(x => x.reportsTo === memberId && x.isActive !== false);
    if (directReports.length > 0) {
      const reassignId = options.reassignReportsTo ? options.reassignReportsTo.trim() : null;
      if (!reassignId) {
        const names = directReports.map(r => r.name).join(', ');
        throw new Error(`Cannot offboard ${m.name}: they have ${directReports.length} direct report(s) (${names}). Please select a new manager to reassign them.`);
      }
      if (reassignId === memberId) {
        throw new Error('Cannot reassign direct reports to the member being offboarded.');
      }
      const newMgr = (_data.members || []).find(x => x.id === reassignId && x.isActive !== false);
      if (!newMgr) {
        throw new Error(`New manager not found or inactive: ${reassignId}`);
      }
      directReports.forEach(r => {
        r.reportsTo = newMgr.id;
      });
      DS.logActivity(currentUser?.id, `reassigned ${directReports.length} direct reports from ${m.name} to ${newMgr.name}`, 'member', newMgr.id);
    }

    // Soft-delete member to preserve historical records
    m.isActive = false;
    m.offboardedAt = new Date().toISOString();
    m.reportsTo = null;

    _persist();
    DS.logActivity(currentUser?.id, `offboarded team member "${m.name}"`, 'member', memberId);
    return { success: true, member: _clone(m), reassignedCount: directReports.length };
  };

  // Skill Category CRUD (Admin Only)
  DS.createSkillCategory = (data, u) => {
    reqAdmin('createSkillCategory', u);
    if (!data?.name) throw new Error('Skill category name is required');
    const name = data.name.trim();
    _data.skillCategories = _data.skillCategories || [];
    if (_data.skillCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A skill category with name "${name}" already exists`);
    }
    const id = data.id ? data.id.trim() : ('cat-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const newCat = {
      id,
      name,
      description: (data.description || '').trim()
    };
    _data.skillCategories.push(newCat);
    _persist();
    DS.logActivity(u?.id, `created skill category "${newCat.name}"`, 'skillCategory', newCat.id);
    return { ..._clone(newCat), count: 0 };
  };

  DS.updateSkillCategory = (id, updates, u) => {
    reqAdmin('updateSkillCategory', u);
    const cat = (_data.skillCategories || []).find(c => c.id === id);
    if (!cat) throw new Error(`Skill category not found: ${id}`);
    const oldName = cat.name;
    if (updates.name && updates.name.trim() !== oldName) {
      const newName = updates.name.trim();
      if (_data.skillCategories.some(c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`A skill category with name "${newName}" already exists`);
      }
      cat.name = newName;
    }
    if (updates.description !== undefined) {
      cat.description = updates.description.trim();
    }
    _persist();
    DS.logActivity(u?.id, `updated skill category "${cat.name}"`, 'skillCategory', cat.id);
    return DS.getSkillCategoryById(cat.id);
  };

  DS.deleteSkillCategory = (id, u) => {
    reqAdmin('deleteSkillCategory', u);
    const idx = (_data.skillCategories || []).findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Skill category not found: ${id}`);
    const cat = _data.skillCategories[idx];

    // Conflict check: refuse if any active member has a proficiency record or skillCategory referencing this category
    const activeMembers = (_data.members || []).filter(m => m.isActive !== false);
    const profs = _data.skillProficiencies || [];
    const blockingMembers = activeMembers.filter(m =>
      profs.some(p => p.categoryId === id && p.memberId === m.id) || m.skillCategory === id
    );

    if (blockingMembers.length > 0) {
      const names = blockingMembers.map(m => m.name).join(', ');
      throw new Error(`Cannot delete skill category "${cat.name}": ${blockingMembers.length} member(s) currently assigned (${names}). Reassign or update their proficiency records first.`);
    }

    _data.skillCategories.splice(idx, 1);
    _persist();
    DS.logActivity(u?.id, `deleted skill category "${cat.name}"`, 'skillCategory', id);
    return true;
  };

  // Member Password Management
  DS.updateMemberPassword = (memberId, oldPassword, newPassword, currentUser) => {
    if (!currentUser) throw new Error('Unauthorized: login session required');
    if (currentUser.id !== memberId) {
      deny('updateMemberPassword', currentUser, 'Members can only change their own password');
    }
    const m = (_data.members || []).find(x => x.id === memberId);
    if (!m) throw new Error(`Member not found: ${memberId}`);
    if (DS.hashPassword(oldPassword || '') !== m.passwordHash) {
      throw new Error('Current password is incorrect');
    }
    const cleanNew = (newPassword || '').trim();
    if (cleanNew.length < 4) {
      throw new Error('New password must be at least 4 characters');
    }
    if (oldPassword === cleanNew) {
      throw new Error('New password must be different from current password');
    }
    m.passwordHash = DS.hashPassword(cleanNew);
    _persist();
    DS.logActivity(currentUser.id, 'changed their password', 'auth', memberId);
    return { success: true, memberId };
  };

  DS.resetMemberPassword = (memberId, newPassword, currentUser) => {
    reqAdmin('resetMemberPassword', currentUser);
    const m = (_data.members || []).find(x => x.id === memberId);
    if (!m) throw new Error(`Member not found: ${memberId}`);
    const cleanNew = (newPassword || '').trim();
    if (cleanNew.length < 4) {
      throw new Error('New password must be at least 4 characters');
    }
    m.passwordHash = DS.hashPassword(cleanNew);
    _persist();
    DS.logActivity(currentUser.id, `reset password for member "${m.name}"`, 'auth', memberId);
    return { success: true, memberId };
  };
})();
