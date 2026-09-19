/**
 * Useme Team - Task Detail Modal Component with Asset Uploads
 */
(function() {

  window.openTaskDetailModal = function(taskId, onUpdate) {
    let modal = document.getElementById('taskDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'taskDetailModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="taskModalClose" aria-label="Close modal">&times;</button>
          <div class="task-modal-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1; min-width:0; padding-right:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                <h2 class="task-modal-title" id="tmTitle" style="margin:0;">Task Title</h2>
                <div id="tmStatusBadge"></div>
              </div>
              <div class="task-modal-meta" id="tmMeta"></div>
            </div>
            <div id="tmAdminActions" style="display:none; gap:6px; align-items:center; margin-right:24px;">
              <button type="button" class="btn-action-edit" id="tmBtnEdit" title="Edit Task">Edit</button>
              <button type="button" class="btn-action-delete" id="tmBtnDelete" title="Delete Task">Delete</button>
            </div>
          </div>
          <div id="tmReworkBanner" class="alert-banner alert-banner-error" style="display:none;"></div>
          <p id="tmDesc" style="font-size:var(--text-sm); margin-bottom:var(--space-4); color:var(--color-text);"></p>
          <div style="margin-bottom:var(--space-4);">
            <div style="font-size:var(--text-xs); font-weight:600; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:4px;">Assignees</div>
            <div id="tmAssignees" style="display:flex; align-items:center; gap:8px;"></div>
          </div>
          <div class="modal-tabs">
            <button type="button" class="modal-tab-btn active" data-pane="tabTimeline">History</button>
            <button type="button" class="modal-tab-btn" data-pane="tabResources">Resources & Assets</button>
          </div>
          <div class="modal-tab-pane active" id="tabTimeline"><ul class="timeline" id="tmTimeline"></ul></div>
          <div class="modal-tab-pane" id="tabResources">
            <p style="font-size:var(--text-xs);font-weight:600;margin-bottom:4px;">Resources & Documentation:</p>
            <ul class="tab-list" id="tmResources"></ul>
            <p style="font-size:var(--text-xs);font-weight:600;margin-top:12px;margin-bottom:6px;">Deliverables & Assets (Proof of Work):</p>
            <div id="tmAssetContainer"></div>
          </div>
          <div style="border-top:1px solid var(--color-border); padding-top:var(--space-4); margin-top:var(--space-4); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <label for="tmStatusSelect" style="font-size:var(--text-xs); font-weight:600;">Status:</label>
              <select id="tmStatusSelect" class="form-input" style="width:auto; padding:4px 8px;">
                <option value="notStarted">Not Started</option><option value="inProgress">In Progress</option><option value="testing">Testing</option><option value="awaitingFeedback">Awaiting Feedback</option><option value="completed">Completed</option><option value="reworkNeeded">Rework Needed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div id="tmSubmitReviewContainer"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#taskModalClose').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
      modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.onclick = () => {
          modal.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          modal.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          modal.querySelector(`#${btn.dataset.pane}`).classList.add('active');
        };
      });
    }

    const task = window.DataStore ? window.DataStore.getTaskById(taskId) : null;
    if (!task) return;

    modal.querySelector('#tmTitle').textContent = task.title;
    modal.querySelector('#tmMeta').innerHTML = `<span>Due: ${task.dueDate}</span> • <span>Skill: ${task.linkedSkill.toUpperCase()}</span> • <span>Project: ${task.linkedProject || 'None'}</span>`;
    modal.querySelector('#tmStatusBadge').innerHTML = getStatusBadge(task.status);
    modal.querySelector('#tmDesc').textContent = task.description;
    const assignees = (window.DataStore ? window.DataStore.getMembers() : []).filter(m => task.assignedTo.includes(m.id));
    modal.querySelector('#tmAssignees').innerHTML = assignees.map(a => `<span style="display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); background:var(--color-bg); padding:2px 8px; border-radius:9999px; border:1px solid var(--color-border);"><span style="width:18px;height:18px;border-radius:50%;background:var(--color-orange);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">${a.avatar}</span>${a.name}</span>`).join(' ');
    modal.querySelector('#tmTimeline').innerHTML = (task.statusHistory || []).map(h => `<li class="timeline-item"><strong>${h.status}</strong> <span class="timeline-time">${h.timestamp}</span>${h.notes ? `<div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;"><strong>Note:</strong> ${h.notes}</div>` : ''}</li>`).join('');
    modal.querySelector('#tmResources').innerHTML = (task.resources || []).map(r => `<li class="tab-list-item"><span>${r}</span></li>`).join('') || '<li class="tab-list-item"><span style="color:var(--color-text-muted);">No reference links provided.</span></li>';

    const reworkBanner = modal.querySelector('#tmReworkBanner');
    if (task.status === 'reworkNeeded' || task.reworkNotes) {
      reworkBanner.style.display = 'block';
      reworkBanner.innerHTML = `<strong>Rework Requested:</strong> ${task.reworkNotes || 'Please address feedback and resubmit deliverables.'}`;
    } else {
      reworkBanner.style.display = 'none';
    }

    const role = localStorage.getItem('useme_role') || 'member', currentUserId = localStorage.getItem('useme_user_id') || 'm5';
    const me = (window.getMemberOrFallback ? window.getMemberOrFallback(currentUserId, { name: 'Team Member' }) : (window.DataStore ? window.DataStore.getMemberById(currentUserId) : null)) || { name: 'Team Member' };
    const u = window.currentUser || window.DataStore?.getCurrentUser();

    const adminActions = modal.querySelector('#tmAdminActions');
    if (role === 'admin') {
      adminActions.style.display = 'inline-flex';
      modal.querySelector('#tmBtnEdit').onclick = () => {
        modal.classList.remove('active');
        if (typeof window.openEditTaskModal === 'function') {
          window.openEditTaskModal(task, () => {
            if (onUpdate) onUpdate();
            window.openTaskDetailModal(task.id, onUpdate);
          });
        }
      };
      modal.querySelector('#tmBtnDelete').onclick = () => {
        if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
          try {
            window.DataStore.deleteTask(task.id, u);
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

    if (typeof window.createTaskAssetField === 'function') {
      window.createTaskAssetField(modal.querySelector('#tmAssetContainer'), {
        initialAssets: task.assets || [],
        uploaderName: `${me.name} (${role === 'admin' ? 'Admin' : 'Member'})`,
        allowAdd: true,
        onChange: (updatedAssets) => {
          if (updatedAssets.length > (task.assets || []).length) {
            window.DataStore?.addTaskAsset(task.id, updatedAssets[updatedAssets.length - 1], u);
          }
          task.assets = updatedAssets;
          if (onUpdate) onUpdate();
        }
      });
    }

    const select = modal.querySelector('#tmStatusSelect'), revCont = modal.querySelector('#tmSubmitReviewContainer');
    if (role === 'admin') {
      select.disabled = false;
      select.value = task.status;
      select.onchange = () => {
        const updated = window.DataStore ? window.DataStore.updateTaskStatus(task.id, select.value, u) : { status: select.value, statusHistory: [] };
        task.status = updated.status; task.statusHistory = updated.statusHistory;
        modal.querySelector('#tmStatusBadge').innerHTML = getStatusBadge(task.status);
        modal.querySelector('#tmTimeline').innerHTML = (task.statusHistory || []).map(h => `<li class="timeline-item"><strong>${h.status}</strong> <span class="timeline-time">${h.timestamp}</span>${h.notes ? `<div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;"><strong>Note:</strong> ${h.notes}</div>` : ''}</li>`).join('');
        if (task.status === 'reworkNeeded' || task.reworkNotes) {
          reworkBanner.style.display = 'block';
          reworkBanner.innerHTML = `<strong>Rework Requested:</strong> ${task.reworkNotes || 'Please address feedback and resubmit deliverables.'}`;
        } else {
          reworkBanner.style.display = 'none';
        }
        if (onUpdate) onUpdate();
      };
    } else {
      select.innerHTML = `<option value="${task.status}">${task.status}</option>`;
      select.disabled = true;
    }

    const isAssigned = (task.assignedTo || []).includes(currentUserId);
    if (role === 'member' && isAssigned && !task.submittedForReview && task.status !== 'completed') {
      revCont.innerHTML = `<button type="button" class="btn btn-primary" style="font-size:var(--text-xs); padding:4px 10px;" id="btnSubmitReview">Submit for Review</button>`;
      revCont.querySelector('#btnSubmitReview').onclick = () => {
        const updated = window.DataStore ? window.DataStore.submitTaskForReview(task.id, u) : { status: 'awaitingFeedback', statusHistory: [] };
        task.submittedForReview = true; task.status = updated.status; task.statusHistory = updated.statusHistory;
        select.innerHTML = `<option value="awaitingFeedback">awaitingFeedback</option>`;
        modal.querySelector('#tmStatusBadge').innerHTML = getStatusBadge(task.status);
        modal.querySelector('#tmTimeline').innerHTML = (task.statusHistory || []).map(h => `<li class="timeline-item"><strong>${h.status}</strong> <span class="timeline-time">${h.timestamp}</span>${h.notes ? `<div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;"><strong>Note:</strong> ${h.notes}</div>` : ''}</li>`).join('');
        revCont.innerHTML = `<span style="color:var(--color-green); font-size:var(--text-xs); font-weight:600;">Submitted for Review</span>`;
        if (onUpdate) onUpdate();
      };
    } else {
      revCont.innerHTML = task.submittedForReview ? `<span style="color:var(--color-orange); font-size:var(--text-xs); font-weight:600;">In Review Queue</span>` : '';
    }

    modal.classList.add('active');
  };
})();
