/**
 * Useme Team - Project Modals (Detail & Creation & Editing)
 */
(function() {

  window.openProjectDetailModal = function(projectId, onUpdate) {
    let modal = document.getElementById('projectDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'projectDetailModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="projModalClose" aria-label="Close modal">&times;</button>
          <div class="task-modal-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1; min-width:0; padding-right:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                <h2 class="task-modal-title" id="pmTitle" style="margin:0;">Project Title</h2>
                <div id="pmStatus"></div>
              </div>
              <div class="task-modal-meta" id="pmMeta"></div>
            </div>
            <div id="pmAdminActions" style="display:none; gap:6px; align-items:center; margin-right:24px;">
              <button type="button" class="btn-action-edit" id="pmBtnEdit" title="Edit Project">Edit</button>
              <button type="button" class="btn-action-delete" id="pmBtnDelete" title="Delete Project">Delete</button>
            </div>
          </div>
          <p id="pmDesc" style="font-size:var(--text-sm); margin-bottom:var(--space-4); color:var(--color-text);"></p>
          <div class="progress-container" id="pmProgressBox"></div>
          <div style="margin:var(--space-4) 0;">
            <div style="font-size:var(--text-xs); font-weight:600; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:var(--space-2);">Assigned Project Members</div>
            <div id="pmMembersList" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
          </div>
          <div>
            <div style="font-size:var(--text-xs); font-weight:600; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:var(--space-2);">Linked Project Deliverables & Tasks</div>
            <ul class="tab-list" id="pmTasksList"></ul>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#projModalClose').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }

    const proj = window.DataStore ? window.DataStore.getProjectById(projectId) : null;
    if (!proj) return;

    modal.querySelector('#pmTitle').textContent = proj.name;
    modal.querySelector('#pmMeta').innerHTML = `<span>Start: ${proj.startDate}</span> • <span>Target: ${proj.targetDate}</span>`;
    modal.querySelector('#pmStatus').innerHTML = getStatusBadge(proj.status);
    modal.querySelector('#pmDesc').textContent = proj.description;

    const allTasks = window.DataStore ? window.DataStore.getTasks() : [];
    const linkedTasks = allTasks.filter(t => (proj.linkedTaskIds || []).includes(t.id) || t.projectId === proj.id);
    const completedTasks = linkedTasks.filter(t => t.status === 'completed');
    const pct = linkedTasks.length > 0 ? Math.round((completedTasks.length / linkedTasks.length) * 100) : 0;

    modal.querySelector('#pmProgressBox').innerHTML = `
      <div class="progress-info"><span>Progress (${completedTasks.length}/${linkedTasks.length} tasks)</span><span>${pct}%</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${pct}%;"></div></div>
    `;

    const members = (window.DataStore ? window.DataStore.getMembers() : []).filter(m => (proj.memberIds || []).includes(m.id));
    modal.querySelector('#pmMembersList').innerHTML = members.map(m => `<span style="display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); background:var(--color-bg); padding:2px 8px; border-radius:9999px; border:1px solid var(--color-border); cursor:pointer;" onclick="window.openMemberModal('${m.id}')"><span style="width:18px;height:18px;border-radius:50%;background:var(--color-primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">${m.avatar}</span>${m.name}</span>`).join(' ');

    modal.querySelector('#pmTasksList').innerHTML = linkedTasks.length > 0 ? linkedTasks.map(t => `<li class="tab-list-item" style="cursor:pointer;" onclick="window.openTaskDetailModal('${t.id}')"><div><strong>${t.title}</strong><div style="font-size:11px;color:var(--color-text-muted);">Due: ${t.dueDate}</div></div><span class="status-badge ${t.status === 'completed' ? 'badge-green' : 'badge-orange'}">${t.status}</span></li>`).join('') : '<li class="tab-list-item"><span style="color:var(--color-text-muted);">No linked tasks currently.</span></li>';

    const role = localStorage.getItem('useme_role') || 'member';
    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const adminActions = modal.querySelector('#pmAdminActions');

    if (role === 'admin') {
      adminActions.style.display = 'inline-flex';
      modal.querySelector('#pmBtnEdit').onclick = () => {
        modal.classList.remove('active');
        if (typeof window.openEditProjectModal === 'function') {
          window.openEditProjectModal(proj, () => {
            if (onUpdate) onUpdate();
            window.openProjectDetailModal(proj.id, onUpdate);
          });
        }
      };
      modal.querySelector('#pmBtnDelete').onclick = () => {
        if (confirm(`Are you sure you want to delete project "${proj.name}"?`)) {
          try {
            window.DataStore.deleteProject(proj.id, u);
            modal.classList.remove('active');
            if (onUpdate) onUpdate();
          } catch (err) {
            alert(err.message);
          }
        }
      };
    } else {
      adminActions.style.display = 'none';
    }

    modal.classList.add('active');
  };

  function ensureProjectModal() {
    let modal = document.getElementById('newProjectModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'newProjectModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="npModalClose" aria-label="Close modal">&times;</button>
          <h2 class="task-modal-title" id="npModalTitle" style="margin-bottom:var(--space-4);">+ Create New Project</h2>
          <form id="newProjectForm">
            <div class="form-group"><label class="form-label">Project Name</label><input type="text" id="npName" class="form-input" required placeholder="e.g. Enterprise Client Onboarding"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea id="npDesc" class="form-input" rows="2" required placeholder="Project objectives and timeline..."></textarea></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Status</label><select id="npStatus" class="form-input"><option value="active">Active</option><option value="onHold">On Hold</option><option value="completed">Completed</option></select></div>
              <div><label class="form-label">Start Date</label><input type="date" id="npStart" class="form-input" required></div>
              <div><label class="form-label">Target Date</label><input type="date" id="npTarget" class="form-input" required></div>
            </div>
            <div class="form-group"><label class="form-label">Select Project Team</label><div id="npMembersSelect" class="suggested-chips"></div></div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:var(--space-5); border-top:1px solid var(--color-border); padding-top:var(--space-4);">
              <button type="button" class="btn" id="npCancel" style="border:1px solid var(--color-border);">Cancel</button>
              <button type="submit" class="btn btn-primary" id="npSubmitBtn">Create Project</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#npModalClose').onclick = () => modal.classList.remove('active');
      modal.querySelector('#npCancel').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }
    return modal;
  }

  function setupProjectModal(existingProj, callback) {
    const modal = ensureProjectModal();
    const isEdit = !!existingProj;

    modal.querySelector('#npModalTitle').textContent = isEdit ? 'Edit Project' : '+ Create New Project';
    modal.querySelector('#npSubmitBtn').textContent = isEdit ? 'Save Changes' : 'Create Project';

    modal.querySelector('#npName').value = isEdit ? (existingProj.name || '') : '';
    modal.querySelector('#npDesc').value = isEdit ? (existingProj.description || '') : '';
    modal.querySelector('#npStatus').value = isEdit ? (existingProj.status || 'active') : 'active';
    modal.querySelector('#npStart').value = isEdit ? (existingProj.startDate || '') : new Date().toISOString().slice(0, 10);
    modal.querySelector('#npTarget').value = isEdit ? (existingProj.targetDate || '') : '';

    const selectedMembers = new Set(isEdit ? (existingProj.memberIds || []) : ['m1', 'm2']);
    const container = modal.querySelector('#npMembersSelect');

    const updateChips = () => {
      container.innerHTML = '';
      (window.DataStore ? window.DataStore.getMembers() : []).forEach(m => {
        const chip = document.createElement('span');
        chip.className = `suggested-chip ${selectedMembers.has(m.id) ? 'selected' : ''}`;
        chip.innerHTML = `<strong>${m.avatar}</strong> ${m.name}`;
        chip.onclick = () => {
          if (selectedMembers.has(m.id)) selectedMembers.delete(m.id);
          else selectedMembers.add(m.id);
          updateChips();
        };
        container.appendChild(chip);
      });
    };
    updateChips();

    modal.querySelector('#newProjectForm').onsubmit = (e) => {
      e.preventDefault();
      const u = window.currentUser || window.DataStore?.getCurrentUser();

      if (isEdit) {
        const updates = {
          name: modal.querySelector('#npName').value.trim(),
          description: modal.querySelector('#npDesc').value.trim(),
          status: modal.querySelector('#npStatus').value,
          startDate: modal.querySelector('#npStart').value,
          targetDate: modal.querySelector('#npTarget').value,
          memberIds: Array.from(selectedMembers)
        };
        if (window.DataStore?.updateProject) {
          window.DataStore.updateProject(existingProj.id, updates, u);
        } else {
          Object.assign(existingProj, updates);
        }
      } else {
        const newProj = {
          id: 'p' + (Date.now() % 1000),
          name: modal.querySelector('#npName').value.trim(),
          description: modal.querySelector('#npDesc').value.trim(),
          status: modal.querySelector('#npStatus').value || 'active',
          startDate: modal.querySelector('#npStart').value,
          targetDate: modal.querySelector('#npTarget').value,
          memberIds: Array.from(selectedMembers),
          linkedTaskIds: []
        };
        if (window.DataStore?.createProject) {
          window.DataStore.createProject(newProj, u);
        }
      }

      modal.classList.remove('active');
      modal.querySelector('#newProjectForm').reset();
      if (callback) callback();
    };

    modal.classList.add('active');
  }

  window.openNewProjectModal = function(onCreated) {
    setupProjectModal(null, onCreated);
  };

  window.openEditProjectModal = function(project, onSaved) {
    setupProjectModal(project, onSaved);
  };

})();
