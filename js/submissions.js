/**
 * Useme Team - Submissions Review Queue & Member Submissions (Peko Theme)
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const container = document.getElementById('submissionsGrid');
  const tabs = document.querySelectorAll('.sub-tab-btn');
  const titleEl = document.getElementById('subPageTitle');
  const subEl = document.getElementById('subPageSubtitle');
  let currentTab = 'pending', subDisplayLimit = 30;

  if (role === 'member') {
    if (titleEl) titleEl.textContent = 'My Submissions & Review Status';
    if (subEl) subEl.textContent = 'Track review status, approval confirmations, and rework requests on your deliverables.';
  }

  function renderSubmissions() {
    let tasks = window.DataStore ? window.DataStore.getTasks() : [];
    if (role === 'member') tasks = tasks.filter(t => t.assignedTo.includes(currentUserId));

    let list = [];
    if (currentTab === 'pending') list = tasks.filter(t => t.submittedForReview || t.status === 'awaitingFeedback');
    else if (currentTab === 'approved') list = tasks.filter(t => t.status === 'completed');
    else if (currentTab === 'needsRework') list = tasks.filter(t => t.status === 'reworkNeeded');

    document.getElementById('countPending').textContent = tasks.filter(t => t.submittedForReview || t.status === 'awaitingFeedback').length;
    document.getElementById('countApproved').textContent = tasks.filter(t => t.status === 'completed').length;
    document.getElementById('countRework').textContent = tasks.filter(t => t.status === 'reworkNeeded').length;

    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:var(--radius-lg); border:1px solid var(--color-border); color:var(--color-text-muted);">No submissions found in this queue.</div>`;
      return;
    }

    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
    const memberMap = new Map(allMembers.map(m => [m.id, m]));
    const fragment = document.createDocumentFragment();
    const visibleList = list.slice(0, subDisplayLimit);

    visibleList.forEach(task => {
      const card = document.createElement('div');
      card.className = 'submission-card';
      const firstAssignee = memberMap.get(task.assignedTo[0]) || { name: 'Unassigned', avatar: '?' };
      const proofChipsHtml = (task.assets && task.assets.length > 0) ? `
        <div class="sub-proof-assets">
          ${task.assets.map(a => `<span class="chip proof-chip" title="${typeof a === 'string' ? a : (a.name || 'Deliverable Proof')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> <span>${typeof a === 'string' ? a : (a.name || 'Deliverable Proof')}</span></span>`).join('')}
        </div>` : '';

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
          <span style="display:inline-flex; align-items:center; gap:5px; color:var(--color-text-muted); font-size:11.5px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Due: <strong>${task.dueDate}</strong></span>
          </span>
        </div>
        ${proofChipsHtml}
        <div class="sub-actions">
          ${(role === 'admin' && (task.submittedForReview || task.status === 'awaitingFeedback')) ? `
            <button type="button" class="btn btn-sm btn-approve">Approve</button>
            <button type="button" class="btn btn-sm btn-rework">Send Back</button>
            <button type="button" class="btn-action-delete btn-del-sub" title="Remove from review queue (Admin only)" aria-label="Delete submission"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
          ` : ''}
          <button type="button" class="btn btn-sm btn-view">View Full Task</button>
        </div>
        <div class="rework-box" style="display:none;">
          <textarea class="form-input" placeholder="Specify required revisions..." rows="2" style="margin-bottom:6px;"></textarea>
          <div style="display:flex; justify-content:flex-end; gap:6px;">
            <button type="button" class="btn btn-sm btn-rework-cancel">Cancel</button>
            <button type="button" class="btn btn-sm btn-rework-submit">Confirm Rework</button>
          </div>
        </div>
      `;

      if (role === 'admin' && (task.submittedForReview || task.status === 'awaitingFeedback')) {
        const reworkBox = card.querySelector('.rework-box');
        const reworkTextarea = reworkBox.querySelector('textarea');
        card.querySelector('.btn-approve').onclick = () => {
          const u = window.currentUser || window.DataStore?.getCurrentUser();
          if (window.DataStore?.approveSubmission) window.DataStore.approveSubmission(task.id, u);
          if (window.KPI_ENGINE?.onTaskStatusChanged) window.KPI_ENGINE.onTaskStatusChanged(task);
          renderSubmissions();
        };
        card.querySelector('.btn-rework').onclick = () => {
          reworkBox.style.display = reworkBox.style.display === 'none' ? 'block' : 'none';
          if (reworkBox.style.display === 'block') reworkTextarea.focus();
        };
        reworkBox.querySelector('.btn-rework-cancel').onclick = () => { reworkBox.style.display = 'none'; reworkTextarea.value = ''; };
        reworkBox.querySelector('.btn-rework-submit').onclick = () => {
          const notes = reworkTextarea.value.trim();
          if (!notes) return alert('Please specify the revisions required before sending back for rework.');
          const u = window.currentUser || window.DataStore?.getCurrentUser();
          if (window.DataStore?.reworkSubmission) window.DataStore.reworkSubmission(task.id, notes, u);
          if (window.KPI_ENGINE?.onTaskStatusChanged) window.KPI_ENGINE.onTaskStatusChanged(task);
          renderSubmissions();
        };
        const delBtn = card.querySelector('.btn-del-sub');
        if (delBtn) delBtn.onclick = () => {
          if (confirm(`Remove "${task.title}" from the review queue?`)) {
            const u = window.currentUser || window.DataStore?.getCurrentUser();
            if (window.DataStore?.deleteSubmission) window.DataStore.deleteSubmission(task.id, u);
            renderSubmissions();
          }
        };
      }
      card.querySelector('.btn-view').onclick = () => {
        if (typeof window.openTaskDetailModal === 'function') window.openTaskDetailModal(task.id, renderSubmissions);
      };
      fragment.appendChild(card);
    });

    if (list.length > subDisplayLimit) {
      const lmCard = document.createElement('div');
      lmCard.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 16px;';
      lmCard.innerHTML = `<button type="button" class="btn" id="btnLoadMoreSubs" style="padding:8px 20px; font-size:var(--text-xs); font-weight:600; background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-pill); cursor:pointer;">Load More Submissions (Showing ${visibleList.length} of ${list.length})</button>`;
      lmCard.querySelector('#btnLoadMoreSubs').onclick = () => { subDisplayLimit += 30; renderSubmissions(); };
      fragment.appendChild(lmCard);
    }
    container.appendChild(fragment);
  }

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      subDisplayLimit = 30;
      renderSubmissions();
    };
  });
  renderSubmissions();

  const urlTaskId = new URLSearchParams(window.location.search).get('taskId');
  if (urlTaskId && typeof window.openTaskDetailModal === 'function') window.openTaskDetailModal(urlTaskId, renderSubmissions);
});
