/**
 * Useme Team - Dashboard Home Content Renderer
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return 'just now';
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (isNaN(diff) || diff < 0) return 'just now';
    if (diff < 60) return 'just now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getActivityDot(type) {
    switch (type) {
      case 'task': return 'dot-green';
      case 'engagement':
      case 'motivation': return 'dot-orange';
      case 'attendance': return 'dot-blue';
      case 'member': return 'dot-amber';
      case 'cycle': return 'dot-grey';
      default: return 'dot-grey';
    }
  }

  function getRag(pct) {
    if (pct >= 90) return { cls: 'rag-green', label: 'On Track', color: 'var(--color-green)' };
    if (pct >= 70) return { cls: 'rag-amber', label: 'At Risk', color: 'var(--color-orange)' };
    return { cls: 'rag-red', label: 'Behind', color: 'var(--color-red)' };
  }

  function getPillarSnapshot(currentCycle, kraObjectives, kraHistory, memberId) {
    let histIdx = 5;
    if (currentCycle && kraHistory?.months?.length) {
      const match = kraHistory.months.findIndex(m => currentCycle.label.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(currentCycle.label.slice(0, 3).toLowerCase()));
      if (match !== -1) histIdx = match;
    }
    const histTotal = memberId ? (kraHistory.members[memberId]?.[histIdx] ?? kraHistory.org[histIdx] ?? 85) : (kraHistory.org[histIdx] ?? 85);
    const currTotal = memberId ? (kraHistory.members[memberId]?.[5] ?? kraHistory.org[5] ?? 90.2) : (kraHistory.org[5] ?? 90.2);
    const ratio = currTotal > 0 ? (histTotal / currTotal) : 1;
    const pillars = kraObjectives.map(obj => {
      const base = memberId ? (obj.memberActuals?.[memberId] ?? obj.orgActual) : obj.orgActual;
      const actual = Math.round(base * ratio * 10) / 10;
      const attainment = Math.round((actual / obj.target) * 100);
      return { ...obj, actual, attainment, rag: getRag(attainment) };
    });
    const sorted = [...pillars].sort((a, b) => b.attainment - a.attainment);
    const [topPillar, focusPillar] = [sorted[0] || { pillar: 'Growth', title: 'Output Velocity', attainment: 90, rag: getRag(90) }, sorted[sorted.length - 1] || { pillar: 'Quality', title: 'Quality Standards', attainment: 85, rag: getRag(85) }];
    const counts = { onTrack: pillars.filter(p => p.attainment >= 90).length, atRisk: pillars.filter(p => p.attainment >= 70 && p.attainment < 90).length, behind: pillars.filter(p => p.attainment < 70).length };
    return { topPillar, focusPillar, counts, totalAttain: Math.round(histTotal), totalRag: getRag(Math.round(histTotal)) };
  }

  function renderTopbar(name, roleLabel, avatar, cycles, currentCycle, isAdm) {
    const cycleAffordance = isAdm ? `
      <select class="dash-select" id="dashCycleSelect" aria-label="Review Cycle">
        ${cycles.map(c => `<option value="${c.id}" ${c.isCurrent ? 'selected' : ''}>Cycle: ${escapeHtml(c.label)}${c.isCurrent ? ' (Current)' : ''}</option>`).join('')}
        <option disabled>──────────</option>
        <option value="__NEW__">+ New Cycle...</option>
        <option value="__MANAGE__">Manage Cycles...</option>
      </select>
    ` : `
      <div class="dash-cycle-readonly" title="Current Review Cycle">
        <span class="dash-cycle-badge">Cycle: ${escapeHtml(currentCycle ? currentCycle.label : 'Aug 2026')}${currentCycle?.isCurrent ? ' (Current)' : ''}</span>
      </div>
    `;

    return `<div class="dash-topbar" id="dashboardTopbar">
      <div class="dash-search-box" id="desktopSearchBtn" role="button" tabindex="0" aria-label="Quick search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dash-search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span class="dash-search-placeholder">Search leaders, tasks, projects...</span>
        <kbd class="global-search-kbd">Ctrl K</kbd>
      </div>
      <div class="dash-topbar-right">
        ${cycleAffordance}
        <button type="button" class="dash-notif-btn" aria-label="Notifications" title="Updates"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span class="dash-notif-badge"></span></button>
        <div class="dash-profile-chip"><span class="dash-profile-avatar">${avatar}</span><div class="dash-profile-meta"><span class="dash-profile-name">${name}</span><span class="dash-profile-role">${roleLabel}</span></div></div>
      </div>
    </div>`;
  }

  function renderEngMotCard(memberId) {
    const eng = window.KPI_ENGINE?.calculateEngagementScore(memberId) || 84;
    const mot = window.KPI_ENGINE?.calculateMotivationScore(memberId) || 88;
    return `<div class="stat-card" style="cursor:pointer;" onclick="window.location.href='engagement-motivation.html'">
      <div class="stat-header">
        <div class="stat-icon-badge stat-icon-purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
        <span class="rag-badge rag-green">Active</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
        <div><div class="stat-value" style="color:var(--color-primary);">${eng} <span style="font-size:11px; font-weight:500; color:var(--color-text-muted);">pts</span></div><div class="stat-label">Outreach Index</div></div>
        <div style="text-align:right;"><div class="stat-value" style="color:#7C3AED;">${mot} <span style="font-size:11px; font-weight:500; color:var(--color-text-muted);">pts</span></div><div class="stat-label">Motivation Index</div></div>
      </div>
    </div>`;
  }

  function renderDonutCard(title, { totalAttain, totalRag }) {
    const circ = 2 * Math.PI * 26, offset = circ * (1 - Math.min(totalAttain, 100) / 100);
    return `<div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon-badge stat-icon-coral"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg></div>
        <span class="rag-badge ${totalRag.cls}">${totalRag.label}</span>
      </div>
      <div style="display:flex; align-items:center; gap:var(--space-3); margin-top:2px;">
        <svg width="56" height="56" viewBox="0 0 64 64" style="flex-shrink:0;">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-primary)" stroke-width="6" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 32 32)" />
          <text x="32" y="36" text-anchor="middle" font-size="12" font-weight="700" fill="var(--color-text)">${totalAttain}%</text>
        </svg>
        <div><div class="stat-value">${totalAttain}%</div><div class="stat-label">Weighted 5 pillars</div></div>
      </div>
    </div>`;
  }

  function renderActivityFeed() {
    const activities = window.DataStore ? window.DataStore.getActivityLog(10) : [];
    if (!activities || !activities.length) {
      return `<li style="padding:var(--space-4) 0; color:var(--color-text-muted); font-size:var(--text-sm); text-align:center;">No recent activity logged yet.</li>`;
    }

    return activities.map(act => {
      const actor = window.DataStore ? window.DataStore.getMemberById(act.actorMemberId) : null;
      const actorName = actor ? actor.name : (act.actorMemberId === 'm1' || role === 'admin' ? 'Aditya Sharma' : 'Team Member');
      const rawText = escapeHtml(act.actionText || '');
      const formattedAction = rawText.replace(/&quot;([^&]+)&quot;/g, '<em>$1</em>').replace(/"([^"]+)"/g, '<em>$1</em>');
      const timeAgo = formatRelativeTime(act.timestamp);
      const dotCls = getActivityDot(act.relatedEntityType);

      return `<li class="activity-item">
        <div class="activity-left">
          <span class="status-dot ${dotCls}"></span>
          <span><strong>${escapeHtml(actorName)}</strong> ${formattedAction}</span>
        </div>
        <span class="activity-time">${timeAgo}</span>
      </li>`;
    }).join('');
  }

  // Modals management
  function ensureModals() {
    let container = document.getElementById('dashModalsWrapper');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dashModalsWrapper';
      container.innerHTML = `
        <!-- New Cycle Modal -->
        <div class="modal-overlay" id="newCycleModal">
          <div class="modal-card" style="max-width: 440px;">
            <button type="button" class="modal-close-btn" id="ncModalClose" aria-label="Close modal">&times;</button>
            <h2 class="modal-title" style="margin-bottom:var(--space-4);">+ New Review Cycle</h2>
            <div id="ncAlert" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#FEE2E2; color:var(--color-red); border:1px solid #FECACA;"></div>
            <form id="newCycleForm">
              <div class="form-group" style="margin-bottom:var(--space-3);">
                <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Cycle Label *</label>
                <input type="text" id="ncLabel" class="form-input" required placeholder="e.g. Sep 2026" style="width:100%; height:36px; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);">
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-3); margin-bottom:var(--space-3);">
                <div>
                  <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Start Date *</label>
                  <input type="date" id="ncStartDate" class="form-input" required style="width:100%; height:36px; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);">
                </div>
                <div>
                  <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">End Date *</label>
                  <input type="date" id="ncEndDate" class="form-input" required style="width:100%; height:36px; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);">
                </div>
              </div>
              <div style="margin-bottom:var(--space-4);">
                <label style="display:flex; align-items:center; gap:8px; font-size:var(--text-xs); cursor:pointer; color:var(--color-text);">
                  <input type="checkbox" id="ncIsCurrent" style="accent-color:var(--color-orange);">
                  <span>Set as Active / Current Cycle</span>
                </label>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:var(--space-2);">
                <button type="button" class="btn" id="ncCancelBtn" style="padding:8px 14px; border:1px solid var(--color-border); background:var(--color-white); border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Cancel</button>
                <button type="submit" class="btn" style="padding:8px 16px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Create Cycle</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Manage Cycles Modal -->
        <div class="modal-overlay" id="manageCyclesModal">
          <div class="modal-card modal-wide" style="max-width: 600px;">
            <button type="button" class="modal-close-btn" id="mcModalClose" aria-label="Close modal">&times;</button>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-4); padding-right:32px;">
              <h2 class="modal-title">Review Cycles Management</h2>
              <button type="button" id="mcAddNewBtn" class="btn" style="padding:6px 12px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">+ New Cycle</button>
            </div>
            <div id="mcConflictAlert" style="display:none; margin-bottom:var(--space-3); padding:10px 14px; border-radius:var(--radius-md); font-size:var(--text-xs); background-color:#FEE2E2; color:#991B1B; border:1px solid #FECACA; line-height:1.4;"></div>
            <div id="mcSuccessAlert" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-md); font-size:var(--text-xs); background-color:#DEF7EC; color:#03543F; border:1px solid #BCF0DA;"></div>
            <div id="mcCyclesList" style="display:flex; flex-direction:column; gap:8px; max-height:360px; overflow-y:auto; padding-right:4px;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // Wire close buttons
      document.getElementById('ncModalClose').onclick = () => document.getElementById('newCycleModal').classList.remove('active');
      document.getElementById('ncCancelBtn').onclick = () => document.getElementById('newCycleModal').classList.remove('active');
      document.getElementById('mcModalClose').onclick = () => document.getElementById('manageCyclesModal').classList.remove('active');

      document.getElementById('mcAddNewBtn').onclick = () => {
        openNewCycleModal();
      };

      // Form submission for new cycle
      document.getElementById('newCycleForm').onsubmit = (e) => {
        e.preventDefault();
        const alertEl = document.getElementById('ncAlert');
        alertEl.style.display = 'none';
        const label = document.getElementById('ncLabel').value.trim();
        const startDate = document.getElementById('ncStartDate').value;
        const endDate = document.getElementById('ncEndDate').value;
        const isCurrent = document.getElementById('ncIsCurrent').checked;
        const u = window.currentUser || window.DataStore?.getCurrentUser();

        try {
          if (window.DataStore?.createCycle) {
            window.DataStore.createCycle({ label, startDate, endDate, isCurrent }, u);
          }
          document.getElementById('newCycleModal').classList.remove('active');
          document.getElementById('newCycleForm').reset();
          renderDashboard();
          if (document.getElementById('manageCyclesModal').classList.contains('active')) {
            renderCyclesList();
          }
        } catch (err) {
          alertEl.textContent = err.message || 'Failed to create cycle';
          alertEl.style.display = 'block';
        }
      };
    }
  }

  function openNewCycleModal() {
    ensureModals();
    const modal = document.getElementById('newCycleModal');
    const alertEl = document.getElementById('ncAlert');
    alertEl.style.display = 'none';
    document.getElementById('newCycleForm').reset();
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${lastDay}`;
    document.getElementById('ncStartDate').value = startStr;
    document.getElementById('ncEndDate').value = endStr;
    modal.classList.add('active');
  }

  function renderCyclesList() {
    const listEl = document.getElementById('mcCyclesList');
    if (!listEl) return;
    const cycles = window.DataStore ? window.DataStore.getCycles() : [];
    const conflictEl = document.getElementById('mcConflictAlert');
    const successEl = document.getElementById('mcSuccessAlert');
    conflictEl.style.display = 'none';
    successEl.style.display = 'none';

    listEl.innerHTML = cycles.map(c => `
      <div class="cycle-manage-item" id="cRow-${c.id}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-md);">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; font-size:var(--text-sm);">${escapeHtml(c.label)}</span>
            ${c.isCurrent ? `<span class="rag-badge rag-green" style="font-size:10px; padding:2px 6px;">Current</span>` : ''}
          </div>
          <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${c.startDate} &mdash; ${c.endDate}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${!c.isCurrent ? `<button type="button" class="btn mc-set-current-btn" data-id="${c.id}" style="padding:4px 8px; border:1px solid var(--color-border); background:var(--color-white); font-size:11px; font-weight:600; border-radius:var(--radius-sm); cursor:pointer;">Set Current</button>` : ''}
          <button type="button" class="btn mc-edit-btn" data-id="${c.id}" style="padding:4px 8px; border:1px solid var(--color-border); background:var(--color-white); font-size:11px; font-weight:600; border-radius:var(--radius-sm); cursor:pointer;">Edit</button>
          <button type="button" class="btn mc-delete-btn" data-id="${c.id}" ${c.isCurrent ? 'disabled title="Cannot delete current cycle"' : ''} style="padding:4px 8px; border:1px solid #FECACA; background:#FFF5F5; color:var(--color-red); font-size:11px; font-weight:600; border-radius:var(--radius-sm); cursor:${c.isCurrent ? 'not-allowed' : 'pointer'}; opacity:${c.isCurrent ? '0.5' : '1'};">Delete</button>
        </div>
      </div>
    `).join('');

    // Wire action buttons
    listEl.onclick = (e) => {
      const u = window.currentUser || window.DataStore?.getCurrentUser();
      const setBtn = e.target.closest('.mc-set-current-btn');
      if (setBtn) {
        const id = setBtn.dataset.id;
        try {
          window.DataStore.setCurrentCycle(id, u);
          successEl.textContent = 'Active cycle updated successfully.';
          successEl.style.display = 'block';
          renderCyclesList();
          renderDashboard();
        } catch (err) {
          conflictEl.textContent = err.message || 'Failed to update cycle';
          conflictEl.style.display = 'block';
        }
        return;
      }

      const delBtn = e.target.closest('.mc-delete-btn');
      if (delBtn) {
        const id = delBtn.dataset.id;
        conflictEl.style.display = 'none';
        successEl.style.display = 'none';
        try {
          window.DataStore.deleteCycle(id, u);
          successEl.textContent = 'Review cycle deleted successfully.';
          successEl.style.display = 'block';
          renderCyclesList();
          renderDashboard();
        } catch (err) {
          conflictEl.textContent = err.message || 'Cannot delete review cycle';
          conflictEl.style.display = 'block';
        }
        return;
      }

      const editBtn = e.target.closest('.mc-edit-btn');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const cycle = window.DataStore.getCycleById(id);
        if (!cycle) return;
        const row = document.getElementById(`cRow-${id}`);
        row.innerHTML = `
          <div style="width:100%;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:6px;">
              <div><label style="font-size:10px; color:var(--color-text-muted);">Label</label><input type="text" id="editLabel-${id}" value="${escapeHtml(cycle.label)}" style="width:100%; height:28px; font-size:11px; padding:2px 6px; border:1px solid var(--color-border); border-radius:var(--radius-sm);"></div>
              <div><label style="font-size:10px; color:var(--color-text-muted);">Start Date</label><input type="date" id="editStart-${id}" value="${cycle.startDate}" style="width:100%; height:28px; font-size:11px; padding:2px 6px; border:1px solid var(--color-border); border-radius:var(--radius-sm);"></div>
              <div><label style="font-size:10px; color:var(--color-text-muted);">End Date</label><input type="date" id="editEnd-${id}" value="${cycle.endDate}" style="width:100%; height:28px; font-size:11px; padding:2px 6px; border:1px solid var(--color-border); border-radius:var(--radius-sm);"></div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              <button type="button" class="btn mc-cancel-edit" style="padding:2px 8px; font-size:11px; border:1px solid var(--color-border); background:var(--color-white); border-radius:var(--radius-sm); cursor:pointer;">Cancel</button>
              <button type="button" class="btn mc-save-edit" data-id="${id}" style="padding:2px 10px; font-size:11px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-sm); font-weight:600; cursor:pointer;">Save</button>
            </div>
          </div>
        `;
        row.querySelector('.mc-cancel-edit').onclick = () => renderCyclesList();
        row.querySelector('.mc-save-edit').onclick = () => {
          const newLabel = document.getElementById(`editLabel-${id}`).value.trim();
          const newStart = document.getElementById(`editStart-${id}`).value;
          const newEnd = document.getElementById(`editEnd-${id}`).value;
          try {
            window.DataStore.updateCycle(id, { label: newLabel, startDate: newStart, endDate: newEnd }, u);
            successEl.textContent = `Review cycle "${newLabel}" updated successfully.`;
            successEl.style.display = 'block';
            renderCyclesList();
            renderDashboard();
          } catch (err) {
            conflictEl.textContent = err.message || 'Failed to update cycle';
            conflictEl.style.display = 'block';
          }
        };
      }
    };
  }

  function openManageCyclesModal() {
    ensureModals();
    renderCyclesList();
    document.getElementById('manageCyclesModal').classList.add('active');
  }

  function renderDashboard() {
    const isAdm = role === 'admin';
    const targetMid = isAdm ? null : currentUserId;
    const tasks = window.DataStore ? window.DataStore.getTasks() : [];
    const members = window.DataStore ? window.DataStore.getMembers() : [];
    const kraObjectives = window.DataStore ? window.DataStore.getKraObjectives() : [];
    const kraHistory = window.DataStore ? window.DataStore.getKraHistory() : { months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], org: [82, 84, 85, 87, 89, 90.2], members: {} };
    const cycles = window.DataStore ? window.DataStore.getCycles() : [];
    const currentCycle = (window.DataStore && window.DataStore.getCurrentCycle()) || cycles.find(c => c.isCurrent) || cycles[cycles.length - 1];

    const snap = getPillarSnapshot(currentCycle, kraObjectives, kraHistory, targetMid);
    const totalMembers = members.length;
    const activeTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length;
    const pendingSubs = tasks.filter(t => t.submittedForReview).length;
    const me = window.getMemberOrFallback ? window.getMemberOrFallback(currentUserId, { name: 'Member', role: 'Specialist', avatar: 'ME' }) : (members.find(m => m.id === currentUserId) || { name: 'Member', role: 'Specialist', avatar: 'ME' });

    mainContent.innerHTML = `
      ${renderTopbar(isAdm ? 'Admin' : me.name, isAdm ? 'Administrator' : me.role, isAdm ? 'AD' : me.avatar, cycles, currentCycle, isAdm)}
      <div class="stats-grid">
        ${renderDonutCard('Overall KRA Attainment', snap)}
        ${renderEngMotCard(targetMid)}
        <div class="stat-card">
          <div class="stat-icon-badge stat-icon-mint"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <div class="stat-value">${isAdm ? totalMembers : tasks.filter(t => t.assignedTo.includes(currentUserId) && !['completed', 'cancelled'].includes(t.status)).length}</div>
          <div class="stat-label">${isAdm ? 'Total Members' : 'Active Tasks'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-badge stat-icon-peach"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <div class="stat-value">${pendingSubs}</div>
          <div class="stat-label">Pending Reviews</div>
        </div>
      </div>
      <div class="dash-pillar-snapshot">
        <div class="snapshot-card snapshot-leading">
          <div class="snapshot-label">Leading Pillar</div>
          <div class="snapshot-value-row">
            <span class="snapshot-name">${escapeHtml(snap.topPillar.pillar)}</span>
            <span class="rag-badge ${snap.topPillar.rag.cls}">${snap.topPillar.attainment}%</span>
          </div>
          <div class="snapshot-desc">${escapeHtml(snap.topPillar.title)}</div>
        </div>
        <div class="snapshot-card snapshot-focus">
          <div class="snapshot-label">Focus Opportunity</div>
          <div class="snapshot-value-row">
            <span class="snapshot-name">${escapeHtml(snap.focusPillar.pillar)}</span>
            <span class="rag-badge ${snap.focusPillar.rag.cls}">${snap.focusPillar.attainment}%</span>
          </div>
          <div class="snapshot-desc">${escapeHtml(snap.focusPillar.title)}</div>
        </div>
        <div class="snapshot-card snapshot-rag">
          <div class="snapshot-label">Pillar Health Breakdown</div>
          <div class="snapshot-rag-strip">
            <span class="rag-chip rag-green"><span class="rag-dot rag-green"></span>${snap.counts.onTrack} On Track</span>
            <span class="rag-chip rag-amber"><span class="rag-dot rag-amber"></span>${snap.counts.atRisk} At Risk</span>
            <span class="rag-chip rag-red"><span class="rag-dot rag-red"></span>${snap.counts.behind} Behind</span>
          </div>
          <div class="snapshot-desc">5 Strategic Governance Pillars</div>
        </div>
      </div>
      <section class="dashboard-section">
        <h2 class="section-title">Recent Activity Feed</h2>
        <ul class="activity-list" id="dashActivityList">
          ${renderActivityFeed()}
        </ul>
      </section>
    `;

    // Wire Topbar Actions
    const sBtn = document.getElementById('desktopSearchBtn');
    if (sBtn) sBtn.onclick = () => window.openCommandPalette && window.openCommandPalette();

    const cSel = document.getElementById('dashCycleSelect');
    if (cSel) {
      cSel.onchange = (e) => {
        const val = e.target.value;
        const u = window.currentUser || window.DataStore?.getCurrentUser();
        if (val === '__NEW__') {
          cSel.value = currentCycle?.id || '';
          openNewCycleModal();
        } else if (val === '__MANAGE__') {
          cSel.value = currentCycle?.id || '';
          openManageCyclesModal();
        } else if (val) {
          try {
            if (window.DataStore?.setCurrentCycle) {
              window.DataStore.setCurrentCycle(val, u);
              renderDashboard();
            }
          } catch (err) {
            console.error('Failed to set current cycle:', err);
          }
        }
      };
    }
  }

  renderDashboard();
});
