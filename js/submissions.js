/**
 * Useme Team - Submissions Review Queue & Member Submissions
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const container = document.getElementById('submissionsGrid');
  const tabs = document.querySelectorAll('.sub-tab-btn');
  const titleEl = document.getElementById('subPageTitle');
  const subEl = document.getElementById('subPageSubtitle');

  let currentTab = 'pending';

  if (role === 'member') {
    if (titleEl) titleEl.textContent = 'My Submissions & Review Status';
    if (subEl) subEl.textContent = 'Track review status, approval confirmations, and rework requests on your deliverables.';
  }


  function renderSubmissions() {
    let tasks = window.DataStore ? window.DataStore.getTasks() : [];
    if (role === 'member') {
      tasks = tasks.filter(t => t.assignedTo.includes(currentUserId));
    }

    let list = [];
    if (currentTab === 'pending') {
      list = tasks.filter(t => t.submittedForReview || t.status === 'awaitingFeedback');
    } else if (currentTab === 'approved') {
      list = tasks.filter(t => t.status === 'completed');
    } else if (currentTab === 'needsRework') {
      list = tasks.filter(t => t.status === 'reworkNeeded');
    }

    document.getElementById('countPending').textContent = tasks.filter(t => t.submittedForReview || t.status === 'awaitingFeedback').length;
    document.getElementById('countApproved').textContent = tasks.filter(t => t.status === 'completed').length;
    document.getElementById('countRework').textContent = tasks.filter(t => t.status === 'reworkNeeded').length;

    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:8px; border:1px solid var(--color-border); color:var(--color-text-muted);">No submissions found in this queue.</div>`;
      return;
    }

    list.forEach(task => {
      const card = document.createElement('div');
      card.className = `submission-card ${task.status === 'completed' ? 'accent-green' : task.status === 'reworkNeeded' ? 'accent-red' : 'accent-orange'}`;
      const firstAssignee = window.getMemberOrFallback ? window.getMemberOrFallback(task.assignedTo[0], { name: 'Unassigned', avatar: '?' }) : ((window.DataStore ? window.DataStore.getMembers() : []).find(m => task.assignedTo.includes(m.id)) || { name: 'Unassigned', avatar: '?' });

      card.innerHTML = `
        <div class="sub-card-top">
          <div>
            <h3 class="sub-task-title">${task.title}</h3>
            <div class="sub-member-row" style="margin-top:4px;">
              <span class="sub-member-avatar">${firstAssignee.avatar}</span>
              <span>${firstAssignee.name}</span> • <span>${task.linkedProject || 'Operations'}</span>
            </div>
          </div>
          ${getStatusBadge(task.status)}
        </div>
        <div class="sub-meta-box">
          <span>Quality Self-Score: <strong>${task.qualityScore !== null ? task.qualityScore + '/10' : '8.5/10'}</strong></span>
          <span style="color:var(--color-text-muted);">Due: ${task.dueDate}</span>
        </div>
        <div class="sub-actions">
          ${(role === 'admin' && (task.submittedForReview || task.status === 'awaitingFeedback')) ? `
            <button type="button" class="btn btn-sm btn-success btn-approve">Approve</button>
            <button type="button" class="btn btn-sm btn-danger btn-rework">Send Back</button>
            <button type="button" class="btn-action-delete btn-del-sub" title="Remove from review queue (Admin only)">Delete</button>
          ` : ''}
          <button type="button" class="btn btn-sm btn-secondary btn-view" style="margin-left:auto;">View Full Task</button>
        </div>
        <div class="rework-box" style="display:none;">
          <textarea class="form-input" placeholder="Specify required revisions..." rows="2" style="margin-bottom:6px;"></textarea>
          <div style="display:flex; justify-content:flex-end; gap:6px;">
            <button type="button" class="btn btn-sm btn-secondary btn-rework-cancel">Cancel</button>
            <button type="button" class="btn btn-sm btn-danger btn-rework-submit">Confirm Rework</button>
          </div>
        </div>
      `;

      if (role === 'admin' && (task.submittedForReview || task.status === 'awaitingFeedback')) {
        const approveBtn = card.querySelector('.btn-approve');
        if (approveBtn) {
          approveBtn.onclick = () => {
            const u = window.currentUser || window.DataStore?.getCurrentUser();
            if (window.DataStore?.approveSubmission) window.DataStore.approveSubmission(task.id, u);
            if (window.KPI_ENGINE?.onTaskStatusChanged) window.KPI_ENGINE.onTaskStatusChanged(task);
            renderSubmissions();
          };
        }
        const reworkBox = card.querySelector('.rework-box');
        const reworkBtn = card.querySelector('.btn-rework');
        if (reworkBtn) reworkBtn.onclick = () => { reworkBox.style.display = 'block'; };
        const cancelBtn = card.querySelector('.btn-rework-cancel');
        if (cancelBtn) cancelBtn.onclick = () => { reworkBox.style.display = 'none'; };
        const submitReworkBtn = card.querySelector('.btn-rework-submit');
        if (submitReworkBtn) {
          submitReworkBtn.onclick = () => {
            const notes = (reworkBox.querySelector('textarea')?.value || '').trim();
            const u = window.currentUser || window.DataStore?.getCurrentUser();
            if (window.DataStore?.reworkSubmission) window.DataStore.reworkSubmission(task.id, notes, u);
            if (window.KPI_ENGINE?.onTaskStatusChanged) window.KPI_ENGINE.onTaskStatusChanged(task);
            renderSubmissions();
          };
        }
        const delBtn = card.querySelector('.btn-del-sub');
        if (delBtn) {
          delBtn.onclick = () => {
            if (confirm(`Remove "${task.title}" from the review queue?`)) {
              const u = window.currentUser || window.DataStore?.getCurrentUser();
              if (window.DataStore?.deleteSubmission) {
                window.DataStore.deleteSubmission(task.id, u);
              }
              renderSubmissions();
            }
          };
        }
      }

      card.querySelector('.btn-view').onclick = () => {
        if (typeof window.openTaskDetailModal === 'function') {
          window.openTaskDetailModal(task.id, renderSubmissions);
        }
      };

      container.appendChild(card);
    });
  }

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderSubmissions();
    };
  });

  renderSubmissions();

  const urlTaskId = new URLSearchParams(window.location.search).get('taskId');
  if (urlTaskId && typeof window.openTaskDetailModal === 'function') {
    window.openTaskDetailModal(urlTaskId, renderSubmissions);
  }
});
