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
            <div class="form-group">
              <label class="form-label">Suggested & Selected Assignees</label>
              <div id="ntSuggestedPeople" class="suggested-chips"></div>
            </div>
            <div class="modal-tabs">
              <button type="button" class="modal-tab-btn active" data-pane="ntPaneRes">Resources</button>
              <button type="button" class="modal-tab-btn" data-pane="ntPaneAssets">Assets</button>
              <button type="button" class="modal-tab-btn" data-pane="ntPaneQuality">Quality Criteria</button>
            </div>
            <div class="modal-tab-pane active" id="ntPaneRes">
              <div style="display:flex; gap:4px;"><input type="text" id="ntResInput" class="form-input" placeholder="Add doc / link resource..."><button type="button" class="btn btn-primary" id="ntAddRes" style="padding:4px 8px; font-size:var(--text-xs);">Add</button></div>
              <ul class="tab-list" id="ntResList"></ul>
            </div>
            <div class="modal-tab-pane" id="ntPaneAssets">
              <div id="ntAssetWidget"></div>
            </div>
            <div class="modal-tab-pane" id="ntPaneQuality">
              <label style="display:flex; align-items:center; gap:8px; font-size:var(--text-xs); margin-bottom:6px;"><input type="checkbox" checked> Functional test coverage verified</label>
              <label style="display:flex; align-items:center; gap:8px; font-size:var(--text-xs);"><input type="checkbox" checked> Mobile responsive & UX review passed</label>
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

    const updateSuggested = () => {
      const skill = modal.querySelector('#ntSkill').value;
      const container = modal.querySelector('#ntSuggestedPeople');
      container.innerHTML = '';
      (window.DataStore ? window.DataStore.getMembers() : []).forEach(m => {
        const isMatched = m.skillCategory === skill;
        const chip = document.createElement('span');
        chip.className = `suggested-chip ${selectedAssignees.has(m.id) ? 'selected' : ''}`;
        chip.innerHTML = `<strong>${m.avatar}</strong> ${m.name} ${isMatched ? '<span style="font-size:10px; color:var(--color-orange); font-weight:bold;">(Match)</span>' : ''}`;
        chip.onclick = () => {
          if (selectedAssignees.has(m.id)) selectedAssignees.delete(m.id);
          else selectedAssignees.add(m.id);
          updateSuggested();
        };
        container.appendChild(chip);
      });
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
