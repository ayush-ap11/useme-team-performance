/**
 * Useme Team - New & Edit Task Modal Component (Admin Only)
 */
(function() {
  function ensureModal() {
    let modal = document.getElementById('newTaskModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'newTaskModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="ntModalClose" aria-label="Close modal">&times;</button>
          <h2 class="task-modal-title" id="ntModalTitle" style="margin-bottom:var(--space-4);">+ Create New Task</h2>
          <form id="newTaskForm">
            <div class="form-group"><label class="form-label">Task Title</label><input type="text" id="ntTitle" class="form-input" required placeholder="e.g. Design Landing Page"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea id="ntDesc" class="form-input" rows="2" required placeholder="Task details and scope..."></textarea></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Linked Skill</label><select id="ntSkill" class="form-input"><option value="dev">Software Development</option><option value="data">Data Analysis</option><option value="finance">CA / Finance</option><option value="design">Printing & Design</option><option value="marketing">Marketing</option><option value="support">Tech Support</option></select></div>
              <div><label class="form-label">Due Date</label><input type="date" id="ntDueDate" class="form-input" required></div>
            </div>
            <div class="form-group" style="margin-bottom:var(--space-4);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <label class="form-label" style="margin:0;">Suggested & Selected Assignees</label>
                  <span id="ntSelectedCount" style="font-size:11px; padding:2px 8px; font-weight:700; background:var(--pastel-peach); color:var(--color-primary); border:1px solid rgba(232, 81, 77, 0.25); border-radius:var(--radius-pill);">0 selected</span>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                  <button type="button" class="assignee-quick-btn" id="ntSelectAllVisible" style="color:var(--color-primary);" title="Select all currently visible members">Select All Visible</button>
                  <span style="color:var(--color-border);">|</span>
                  <button type="button" class="assignee-quick-btn" id="ntClearAllAssignees" style="color:var(--color-text-muted);" title="Clear all selections">Clear</button>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:8px;">
                <div style="position:relative; width:100%;">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--color-text-muted); pointer-events:none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" id="ntAssigneeSearch" class="form-input" placeholder="Search by name, role, dept..." style="padding-left:34px; padding-right:28px; height:34px; font-size:12px; border-radius:var(--radius-pill);">
                  <button type="button" id="ntClearSearch" style="display:none; position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; font-size:16px; color:var(--color-text-muted); cursor:pointer; line-height:1; padding:0;">&times;</button>
                </div>
                <div id="ntAssigneeFilters" style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
                  <button type="button" class="assignee-filter-btn active" data-filter="matched"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>Skill Match (<span id="ntCountMatched">0</span>)</button>
                  <button type="button" class="assignee-filter-btn" data-filter="selected"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Selected (<span id="ntCountSelected">0</span>)</button>
                  <button type="button" class="assignee-filter-btn" data-filter="new"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>New Members (<span id="ntCountNew">0</span>)</button>
                  <button type="button" class="assignee-filter-btn" data-filter="all"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>All (<span id="ntCountAll">0</span>)</button>
                </div>
              </div>
              <div id="ntSuggestedPeople" class="suggested-chips"></div>
              <div id="ntNoAssigneesMsg" style="display:none; text-align:center; padding:14px; font-size:11.5px; color:var(--color-text-muted); background:#FAF9F7; border:1px dashed var(--color-border); border-radius:var(--radius-md); margin-top:4px;">No members match the current filter or search.</div>
            </div>
            <div class="modal-tabs">
              <button type="button" class="modal-tab-btn active" data-pane="ntPaneRes">Resources</button>
              <button type="button" class="modal-tab-btn" data-pane="ntPaneAssets">Assets</button>
            </div>
            <div class="modal-tab-pane active" id="ntPaneRes">
              <div style="display:flex; gap:4px;"><input type="text" id="ntResInput" class="form-input" placeholder="Add doc / link resource..."><button type="button" class="btn btn-primary" id="ntAddRes" style="padding:4px 8px; font-size:var(--text-xs);">Add</button></div>
              <ul class="tab-list" id="ntResList"></ul>
            </div>
            <div class="modal-tab-pane" id="ntPaneAssets">
              <div id="ntAssetWidget"></div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:var(--space-5); border-top:1px solid var(--color-border); padding-top:var(--space-4);">
              <button type="button" class="btn" id="ntCancelBtn" style="border:1px solid var(--color-border);">Cancel</button>
              <button type="submit" class="btn btn-primary" id="ntSubmitBtn">Create Task</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#ntModalClose').onclick = () => modal.classList.remove('active');
      modal.querySelector('#ntCancelBtn').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

      modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.onclick = () => {
          modal.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          modal.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          modal.querySelector(`#${btn.dataset.pane}`).classList.add('active');
        };
      });

      // Event delegation for resource list removal to prevent listener desync
      const listEl = modal.querySelector('#ntResList');
      listEl.onclick = (e) => {
        const btn = e.target.closest('.tab-remove-btn');
        if (btn && modal._state) {
          const idx = parseInt(btn.dataset.idx, 10);
          if (!isNaN(idx) && idx >= 0 && idx < modal._state.resources.length) {
            modal._state.resources.splice(idx, 1);
            modal._renderResList();
          }
        }
      };
    }
    return modal;
  }

  function setupModal(existingTask, callback) {
    const modal = ensureModal();
    const isEdit = !!existingTask;

    const selectedAssignees = new Set(isEdit ? (existingTask.assignedTo || []) : []);
    const resources = isEdit ? [...(existingTask.resources || [])] : [];

    modal._state = { resources };

    modal.querySelector('#ntModalTitle').textContent = isEdit ? 'Edit Task' : '+ Create New Task';
    modal.querySelector('#ntSubmitBtn').textContent = isEdit ? 'Save Changes' : 'Create Task';

    modal.querySelector('#ntTitle').value = isEdit ? (existingTask.title || '') : '';
    modal.querySelector('#ntDesc').value = isEdit ? (existingTask.description || '') : '';
    modal.querySelector('#ntSkill').value = isEdit ? (existingTask.linkedSkill || 'dev') : 'dev';
    modal.querySelector('#ntDueDate').value = isEdit ? (existingTask.dueDate || '') : '';

    const curUser = window.currentUser || (window.DataStore?.getCurrentUser ? window.DataStore.getCurrentUser() : null);
    let assetWidgetInstance = null;
    if (typeof window.createTaskAssetField === 'function') {
      assetWidgetInstance = window.createTaskAssetField(modal.querySelector('#ntAssetWidget'), {
        initialAssets: isEdit ? (existingTask.assets || []) : [],
        uploaderName: curUser?.name || (curUser?.role === 'admin' ? 'Admin' : 'Member')
      });
    }

    let currentFilter = 'matched';
    let searchQuery = '';

    const searchInput = modal.querySelector('#ntAssigneeSearch');
    const clearSearchBtn = modal.querySelector('#ntClearSearch');
    const filterBtns = modal.querySelectorAll('#ntAssigneeFilters .assignee-filter-btn');
    const noAssigneesMsg = modal.querySelector('#ntNoAssigneesMsg');
    const selectedCountEl = modal.querySelector('#ntSelectedCount');
    const selectAllBtn = modal.querySelector('#ntSelectAllVisible');
    const clearAllBtn = modal.querySelector('#ntClearAllAssignees');

    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    currentFilter = 'matched';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'matched'));

    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        updateSuggested();
      };
    });

    searchInput.oninput = () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      updateSuggested();
    };

    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      updateSuggested();
    };

    const updateSuggested = () => {
      const skill = modal.querySelector('#ntSkill').value;
      const container = modal.querySelector('#ntSuggestedPeople');
      const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
      const unassignedList = window.DataStore?.getUnassignedMembers ? window.DataStore.getUnassignedMembers() : [];
      const unassignedIds = new Set(unassignedList.map(u => u.id));

      const isNewMember = (m) => m.isUnassigned || unassignedIds.has(m.id) || m.role === 'Unassigned' || (m.startDate && m.startDate >= '2026-01-01');

      const matchedCount = allMembers.filter(m => m.skillCategory === skill).length;
      const selectedCount = selectedAssignees.size;
      const newCount = allMembers.filter(isNewMember).length;
      const allCount = allMembers.length;

      modal.querySelector('#ntCountMatched').textContent = matchedCount;
      modal.querySelector('#ntCountSelected').textContent = selectedCount;
      modal.querySelector('#ntCountNew').textContent = newCount;
      modal.querySelector('#ntCountAll').textContent = allCount;
      selectedCountEl.textContent = `${selectedCount} selected`;

      let filtered = allMembers.filter(m => {
        if (currentFilter === 'matched' && m.skillCategory !== skill) return false;
        if (currentFilter === 'selected' && !selectedAssignees.has(m.id)) return false;
        if (currentFilter === 'new' && !isNewMember(m)) return false;
        return true;
      });

      if (searchQuery) {
        filtered = filtered.filter(m => {
          return (m.name && m.name.toLowerCase().includes(searchQuery)) ||
                 (m.role && m.role.toLowerCase().includes(searchQuery)) ||
                 (m.department && m.department.toLowerCase().includes(searchQuery)) ||
                 (m.avatar && m.avatar.toLowerCase().includes(searchQuery));
        });
      }

      container.innerHTML = '';
      if (filtered.length === 0) {
        container.style.display = 'none';
        noAssigneesMsg.style.display = 'block';
      } else {
        container.style.display = 'flex';
        noAssigneesMsg.style.display = 'none';
        filtered.forEach(m => {
          const isMatched = m.skillCategory === skill;
          const isSelected = selectedAssignees.has(m.id);
          const chip = document.createElement('span');
          chip.className = `suggested-chip ${isSelected ? 'selected' : ''}`;
          chip.innerHTML = `<strong>${m.avatar || 'U'}</strong> <span>${m.name}</span> ${isMatched ? '<span style="font-size:10px; color:var(--color-orange); font-weight:bold;">(Match)</span>' : ''}`;
          chip.onclick = () => {
            if (selectedAssignees.has(m.id)) selectedAssignees.delete(m.id);
            else selectedAssignees.add(m.id);
            updateSuggested();
          };
          container.appendChild(chip);
        });
      }

      modal._currentVisibleAssignees = filtered;
    };

    selectAllBtn.onclick = () => {
      (modal._currentVisibleAssignees || []).forEach(m => selectedAssignees.add(m.id));
      updateSuggested();
    };

    clearAllBtn.onclick = () => {
      selectedAssignees.clear();
      updateSuggested();
    };

    modal.querySelector('#ntSkill').onchange = updateSuggested;
    updateSuggested();

    modal._renderResList = () => {
      const listEl = modal.querySelector('#ntResList');
      listEl.innerHTML = resources.map((r, i) => `<li class="tab-list-item"><span>${r}</span><button type="button" class="tab-remove-btn" data-idx="${i}" aria-label="Remove resource">×</button></li>`).join('');
    };
    modal._renderResList();

    modal.querySelector('#ntAddRes').onclick = () => {
      const inp = modal.querySelector('#ntResInput');
      if (inp.value.trim()) {
        resources.push(inp.value.trim());
        modal._renderResList();
        inp.value = '';
      }
    };

    modal.querySelector('#newTaskForm').onsubmit = (e) => {
      e.preventDefault();
      const assets = assetWidgetInstance ? assetWidgetInstance.getAssets() : (isEdit ? existingTask.assets : []);
      const u = window.currentUser || (window.DataStore?.getCurrentUser ? window.DataStore.getCurrentUser() : null);

      if (isEdit) {
        const updates = {
          title: modal.querySelector('#ntTitle').value.trim(),
          description: modal.querySelector('#ntDesc').value.trim(),
          assignedTo: selectedAssignees.size > 0 ? Array.from(selectedAssignees) : existingTask.assignedTo,
          linkedSkill: modal.querySelector('#ntSkill').value,
          dueDate: modal.querySelector('#ntDueDate').value,
          resources: [...resources],
          assets: [...assets]
        };
        if (window.DataStore?.updateTask) {
          window.DataStore.updateTask(existingTask.id, updates, u);
        } else {
          Object.assign(existingTask, updates);
        }
      } else {
        const newTask = {
          id: 't' + (Date.now() % 10000),
          title: modal.querySelector('#ntTitle').value.trim(),
          description: modal.querySelector('#ntDesc').value.trim(),
          assignedTo: selectedAssignees.size > 0 ? Array.from(selectedAssignees) : ['m5'],
          linkedSkill: modal.querySelector('#ntSkill').value,
          linkedProject: 'Active Operations',
          status: 'notStarted',
          dueDate: modal.querySelector('#ntDueDate').value || '2026-09-30',
          resources: [...resources],
          assets: [...assets],
          qualityScore: null,
          submittedForReview: false,
          statusHistory: [{ status: 'notStarted', timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) }]
        };
        if (window.DataStore?.createTask) {
          window.DataStore.createTask(newTask, u);
        }
      }

      modal.classList.remove('active');
      modal.querySelector('#newTaskForm').reset();
      if (callback) callback();
    };

    modal.classList.add('active');
  }

  window.openNewTaskModal = function(onCreated) {
    setupModal(null, onCreated);
  };

  window.openEditTaskModal = function(task, onSaved) {
    setupModal(task, onSaved);
  };
})();
