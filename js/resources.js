/**
 * Useme Team - Resources & Assets Central Hub (Admin Only)
 */
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('useme_role') !== 'admin') {
    window.location.replace('dashboard.html');
    return;
  }

  const tableBody = document.getElementById('resourcesTableBody');
  const searchInput = document.getElementById('resSearchInput') || document.getElementById('resSearch');
  const memberFilter = document.getElementById('resMemberFilter');
  const projectFilter = document.getElementById('resProjectFilter');
  const typeFilterChips = document.getElementById('resTypeChips');

  if (!tableBody) return;

  const ds = window.DataStore;
  const isAdmin = (localStorage.getItem('useme_role') || 'admin') === 'admin';

  let activeType = 'all';
  const typeCategories = [
    { id: 'all', label: 'All Types' },
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'image', label: 'Images & Creatives' },
    { id: 'code', label: 'Code & Data' },
    { id: 'doc', label: 'Docs & Sheets' },
    { id: 'url', label: 'External Links' }
  ];

  const allMembers = ds ? ds.getMembers() : [];
  if (memberFilter) {
    memberFilter.innerHTML = '<option value="all">All Uploaders</option>' +
      allMembers.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  }

  const allProjects = ds ? ds.getProjects() : [];
  if (projectFilter) {
    projectFilter.innerHTML = '<option value="all">All Initiatives / Projects</option>' +
      allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  if (typeFilterChips) {
    typeFilterChips.innerHTML = '';
    typeCategories.forEach(tc => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `rank-chip ${tc.id === activeType ? 'active' : ''}`;
      chip.textContent = tc.label;
      chip.onclick = () => {
        activeType = tc.id;
        render();
      };
      typeFilterChips.appendChild(chip);
    });
  }

  function getFileIcon(name = '', type = '', source = '') {
    const ext = name.split('.').pop().toLowerCase();
    if (source === 'url' || type === 'url') {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'fig'].includes(ext)) {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
    if (['pdf'].includes(ext)) {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
    }
    if (['sql', 'py', 'js', 'html', 'css', 'ts'].includes(ext)) {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    }
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  }

  function matchesType(item, typeCategory) {
    if (typeCategory === 'all') return true;
    const ext = (item.name || '').split('.').pop().toLowerCase();
    if (typeCategory === 'url') return item.source === 'url' || item.type === 'url';
    if (typeCategory === 'pdf') return ext === 'pdf';
    if (typeCategory === 'image') return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'fig'].includes(ext);
    if (typeCategory === 'code') return ['sql', 'py', 'js', 'html', 'css', 'ts'].includes(ext);
    return ['doc', 'docx', 'txt', 'md', 'xlsx', 'csv'].includes(ext);
  }

  function collectAllAssets() {
    const store = window.DataStore;
    const tasks = store ? store.getTasks() : [];
    const projects = store ? store.getProjects() : [];
    const engSubs = store ? store.getEngagementSubmissions() : [];
    const motSubs = store ? store.getMotivationSubmissions() : [];
    const members = store ? store.getMembers() : [];

    const items = [];

    // 1. Task Assets
    tasks.forEach(t => {
      if (t.isArchived) return;
      (t.assets || []).forEach((a, idx) => {
        const isObj = typeof a === 'object' && a !== null;
        const name = isObj ? (a.name || 'Deliverable') : a;
        const type = isObj ? (a.type || 'file') : 'file';
        const source = isObj ? (a.source || (a.url ? 'url' : 'file')) : 'file';
        const url = isObj ? (a.url || a.data || '#') : '#';
        const data = isObj ? (a.data || null) : null;
        const sizeText = isObj ? (a.sizeText || (source === 'url' ? 'External URL' : 'Deliverable')) : 'Deliverable';
        const timestamp = isObj && a.timestamp ? a.timestamp : (t.statusHistory?.[0]?.timestamp?.slice(0, 10) || 'Aug 2026');

        let uploader = null;
        if (isObj && a.uploadedBy) {
          if (store.getMemberById && store.getMemberById(a.uploadedBy)) {
            uploader = store.getMemberById(a.uploadedBy);
          } else {
            const byName = members.find(m => a.uploadedBy.includes(m.name));
            if (byName) uploader = byName;
          }
        }
        if (!uploader && Array.isArray(t.assignedTo) && t.assignedTo.length) {
          uploader = store.getMemberById ? store.getMemberById(t.assignedTo[0]) : members.find(m => m.id === t.assignedTo[0]);
        }
        if (!uploader) {
          uploader = { name: 'Assigned Member', avatar: 'TM', id: '' };
        }

        const project = t.projectId ? projects.find(p => p.id === t.projectId) : null;
        const linkedProject = t.linkedProject || project?.name || 'General Deliverables';

        items.push({
          id: (isObj && a.id) ? a.id : `task-ast-${t.id}-${idx}`,
          assetReference: {
            type: 'task',
            taskId: t.id,
            assetId: (isObj && a.id) ? a.id : undefined,
            assetName: name,
            assetIndex: idx
          },
          name,
          type,
          source,
          url,
          data,
          sizeText,
          timestamp,
          sourceType: 'task',
          sourceId: t.id,
          sourceTitle: t.title,
          projectId: t.projectId,
          linkedProject,
          uploaderName: uploader.name,
          uploaderAvatar: uploader.avatar || 'TM',
          uploaderId: uploader.id,
          clickAction: () => {
            if (window.openTaskDetailModal) window.openTaskDetailModal(t.id);
          }
        });
      });
    });

    // 2. Engagement Submissions (Proofs)
    engSubs.forEach(sub => {
      if (!sub.proofValue) return;
      const mem = (store.getMemberById ? store.getMemberById(sub.memberId) : null) || members.find(m => m.id === sub.memberId) || { name: 'Member', avatar: 'TM', id: sub.memberId };
      const name = sub.proofValue.split('/').pop() || sub.proofValue;
      items.push({
        id: `eng-proof-${sub.id}`,
        assetReference: {
          type: 'engagementSubmission',
          submissionId: sub.id
        },
        name,
        type: sub.proofType || (sub.proofValue.startsWith('http') ? 'url' : 'file'),
        source: sub.proofType || (sub.proofValue.startsWith('http') ? 'url' : 'file'),
        url: sub.proofType === 'url' || sub.proofValue.startsWith('http') ? sub.proofValue : '#',
        data: null,
        sizeText: sub.proofType === 'url' ? 'External Proof Link' : 'Proof File',
        timestamp: sub.date || 'Aug 2026',
        sourceType: 'engagement',
        sourceId: sub.id,
        sourceTitle: sub.title || 'Outreach Activity Proof',
        projectId: null,
        linkedProject: 'Outreach & Motivation',
        uploaderName: mem.name,
        uploaderAvatar: mem.avatar || 'TM',
        uploaderId: mem.id,
        clickAction: () => {
          window.location.href = 'engagement-motivation.html';
        }
      });
    });

    // 3. Motivation Submissions (Proofs)
    motSubs.forEach(sub => {
      if (!sub.proofValue) return;
      const mem = (store.getMemberById ? store.getMemberById(sub.memberId) : null) || members.find(m => m.id === sub.memberId) || { name: 'Member', avatar: 'TM', id: sub.memberId };
      const name = sub.proofValue.split('/').pop() || sub.proofValue;
      items.push({
        id: `mot-proof-${sub.id}`,
        assetReference: {
          type: 'motivationSubmission',
          submissionId: sub.id
        },
        name,
        type: sub.proofType || (sub.proofValue.startsWith('http') ? 'url' : 'file'),
        source: sub.proofType || (sub.proofValue.startsWith('http') ? 'url' : 'file'),
        url: sub.proofType === 'url' || sub.proofValue.startsWith('http') ? sub.proofValue : '#',
        data: null,
        sizeText: sub.proofType === 'url' ? 'External Proof Link' : 'Proof File',
        timestamp: sub.date || 'Aug 2026',
        sourceType: 'motivation',
        sourceId: sub.id,
        sourceTitle: sub.title || 'Motivation Activity Proof',
        projectId: null,
        linkedProject: 'Outreach & Motivation',
        uploaderName: mem.name,
        uploaderAvatar: mem.avatar || 'TM',
        uploaderId: mem.id,
        clickAction: () => {
          window.location.href = 'engagement-motivation.html';
        }
      });
    });

    // 4. Project Assets (if any project stores assets directly)
    projects.forEach(p => {
      if (!Array.isArray(p.assets)) return;
      p.assets.forEach((a, idx) => {
        const isObj = typeof a === 'object' && a !== null;
        const name = isObj ? (a.name || 'Project Asset') : a;
        const type = isObj ? (a.type || 'file') : 'file';
        const source = isObj ? (a.source || (a.url ? 'url' : 'file')) : 'file';
        const url = isObj ? (a.url || a.data || '#') : '#';
        const data = isObj ? (a.data || null) : null;
        const sizeText = isObj ? (a.sizeText || 'Project File') : 'Project File';
        const timestamp = isObj && a.timestamp ? a.timestamp : (p.startDate || 'Aug 2026');

        let uploader = null;
        if (isObj && a.uploadedBy) {
          uploader = store.getMemberById ? store.getMemberById(a.uploadedBy) : members.find(m => m.id === a.uploadedBy);
        }
        if (!uploader && Array.isArray(p.memberIds) && p.memberIds.length) {
          uploader = store.getMemberById ? store.getMemberById(p.memberIds[0]) : members.find(m => m.id === p.memberIds[0]);
        }
        if (!uploader) uploader = { name: 'Project Lead', avatar: 'PL', id: '' };

        items.push({
          id: (isObj && a.id) ? a.id : `proj-ast-${p.id}-${idx}`,
          assetReference: {
            type: 'project',
            projectId: p.id,
            assetId: (isObj && a.id) ? a.id : undefined,
            assetName: name,
            assetIndex: idx
          },
          name,
          type,
          source,
          url,
          data,
          sizeText,
          timestamp,
          sourceType: 'project',
          sourceId: p.id,
          sourceTitle: p.name,
          projectId: p.id,
          linkedProject: p.name,
          uploaderName: uploader.name,
          uploaderAvatar: uploader.avatar || 'PL',
          uploaderId: uploader.id,
          clickAction: () => {
            if (window.openProjectDetailModal) window.openProjectDetailModal(p.id);
          }
        });
      });
    });

    return items;
  }

  function render() {
    if (typeFilterChips) {
      typeFilterChips.querySelectorAll('.rank-chip').forEach((c, idx) => {
        c.className = `rank-chip ${typeCategories[idx].id === activeType ? 'active' : ''}`;
      });
    }

    const allItems = collectAllAssets();
    const query = (searchInput?.value || '').trim().toLowerCase();
    const sMem = memberFilter?.value || 'all';
    const sProj = projectFilter?.value || 'all';

    const filtered = allItems.filter(item => {
      const matchQ = !query ||
        item.name.toLowerCase().includes(query) ||
        item.sourceTitle.toLowerCase().includes(query) ||
        item.uploaderName.toLowerCase().includes(query) ||
        (item.linkedProject && item.linkedProject.toLowerCase().includes(query));
      const matchM = sMem === 'all' || item.uploaderId === sMem;
      const matchP = sProj === 'all' || item.projectId === sProj || (item.linkedProject && item.linkedProject.toLowerCase().includes((allProjects.find(p => p.id === sProj)?.name || '').toLowerCase()));
      return matchQ && matchM && matchP && matchesType(item, activeType);
    });

    tableBody.innerHTML = '';
    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--color-text-muted);">No assets matching current filters.</td></tr>`;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      const icon = getFileIcon(item.name, item.type, item.source);

      const deleteBtnHtml = isAdmin ? `
        <button type="button" class="btn-action-delete btn-res-delete" title="Delete asset from ${item.sourceTitle}" style="margin-left:6px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Delete</span>
        </button>
      ` : '';

      tr.innerHTML = `
        <td><div class="res-name-cell"><span class="res-icon-badge">${icon}</span><div><strong>${item.name}</strong><div style="font-size:10.5px; color:var(--color-text-muted);">${item.sizeText || (item.source === 'url' ? 'External URL' : 'File')}</div></div></div></td>
        <td><div class="res-uploader-badge"><span class="avatar-mini" style="width:22px;height:22px;border-radius:50%;background:var(--color-orange);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">${item.uploaderAvatar}</span><span>${item.uploaderName}</span></div></td>
        <td><button type="button" class="res-link-task">${item.sourceTitle}</button></td>
        <td><span class="modal-skill-chip">${item.linkedProject}</span></td>
        <td style="font-size:11px; color:var(--color-text-muted);">${item.timestamp || 'Aug 24, 2026'}</td>
        <td>
          <div style="display:inline-flex; align-items:center;">
            <a href="${item.data || item.url || '#'}" target="_blank" download="${item.name}" class="btn btn-primary btn-xs" style="text-decoration:none;">View</a>
            ${deleteBtnHtml}
          </div>
        </td>
      `;

      // Wire click through to origin record
      const linkBtn = tr.querySelector('.res-link-task');
      if (linkBtn && item.clickAction) {
        linkBtn.onclick = item.clickAction;
      }

      // Wire admin delete with confirmation
      if (isAdmin) {
        const delBtn = tr.querySelector('.btn-res-delete');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            const sourceLabel = item.sourceType === 'task' ? 'task' : (item.sourceType === 'project' ? 'project' : 'activity');
            const confirmMsg = `Permanently delete "${item.name}" from ${sourceLabel} "${item.sourceTitle}"?\n\nThis will remove the asset from its original source record.`;
            if (window.confirm(confirmMsg)) {
              try {
                const currentUser = { id: localStorage.getItem('useme_user_id') || 'm1', role: 'admin' };
                window.DataStore.deleteAsset(item.assetReference, currentUser);
                render();
              } catch (err) {
                alert(err.message || 'Failed to delete asset');
              }
            }
          };
        }
      }

      tableBody.appendChild(tr);
    });
  }

  if (searchInput) searchInput.oninput = render;
  if (memberFilter) memberFilter.onchange = render;
  if (projectFilter) projectFilter.onchange = render;

  render();
});
