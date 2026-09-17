/**
 * Useme Team - Engagement & Motivation Module Controller (Step 9)
 */
document.addEventListener('DOMContentLoaded', () => {
  const u = window.currentUser || window.DataStore?.getCurrentUser();
  const role = u?.role || localStorage.getItem('useme_role') || 'member';
  const currentUserId = u?.id || localStorage.getItem('useme_user_id') || 'm5';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';

  const getMembers = () => window.DataStore ? window.DataStore.getMembers() : [];
  const tabEng = document.getElementById('tabEngagementBtn'), tabMot = document.getElementById('tabMotivationBtn');
  const paneEng = document.getElementById('paneEngagement'), paneMot = document.getElementById('paneMotivation');
  const svgLine = (d, w=16, h=16) => `<svg viewBox="0 0 24 24" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const ICONS = {
    social: svgLine('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
    onGround: svgLine('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    whatsapp: svgLine('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    offlineAds: svgLine('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'),
    socialAds: svgLine('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    zoom: svgLine('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'),
    talk: svgLine('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
    groupTalk: svgLine('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
    event: svgLine('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    microEvent: svgLine('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    link: svgLine('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 12, 12),
    file: svgLine('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', 12, 12),
    default: svgLine('<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>')
  };

  const getIcon = (k) => ICONS[k] || (k.toLowerCase().includes('talk') ? ICONS.talk : k.toLowerCase().includes('event') ? ICONS.event : ICONS.default);

  // Tab switching
  if (tabEng && tabMot) {
    tabEng.onclick = () => { tabEng.classList.add('active'); tabMot.classList.remove('active'); paneEng.classList.add('active'); paneMot.classList.remove('active'); };
    tabMot.onclick = () => { tabMot.classList.add('active'); tabEng.classList.remove('active'); paneMot.classList.add('active'); paneEng.classList.remove('active'); };
  }

  // Admin button visibility
  const btnManageAct = document.getElementById('btnManageActivityTypes');
  if (btnManageAct) {
    if (isAdmin) {
      btnManageAct.style.display = 'inline-flex';
      btnManageAct.onclick = openActivityTypesModal;
    } else {
      btnManageAct.style.display = 'none';
    }
  }

  function getSparkline(data, color) {
    if (!data || data.length === 0) data = [0, 1, 2];
    const min = Math.min(...data), max = Math.max(...data), range = (max - min) || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 140},${24 - ((v - min) / range) * 20}`).join(' ');
    return `<svg class="sparkline-svg" viewBox="0 0 140 28"><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts}" /></svg>`;
  }

  // Render Outreach / Engagement Tab
  function renderEngagementTab() {
    const score = window.KPI_ENGINE?.calculateEngagementScore(isMember ? currentUserId : null) || 84;
    const sRow = document.getElementById('engSummaryRow');
    if (sRow) {
      sRow.innerHTML = `
        <div class="eng-score-card">
          <div class="stat-header"><span>Combined Outreach Index</span><span class="rag-badge rag-green">Computed Live</span></div>
          <div style="display:flex; align-items:baseline; gap:var(--space-2); margin-top:var(--space-1);">
            <span class="stat-value" style="color:var(--color-orange); font-size:var(--text-3xl); font-weight:700;">${score}</span>
            <span style="font-size:var(--text-xs); color:var(--color-text-muted);">/ 100 benchmark</span>
          </div>
          <div class="score-explanation">Dynamically calculated from approved outreach submissions multiplied by activity type point values.</div>
        </div>`;
    }

    const types = window.DataStore ? window.DataStore.getActivityTypes('outreach') : [];
    const allSubs = window.DataStore ? window.DataStore.getEngagementSubmissions() : [];
    const approvedSubs = allSubs.filter(s => s.status === 'approved');

    const channels = types.map(t => {
      const count = approvedSubs.filter(s => s.type === t.id).length;
      return {
        id: t.id,
        name: t.label,
        key: t.id,
        weight: t.pointValue,
        count: count,
        pts: count * t.pointValue,
        data: [Math.max(1, count - 4), Math.max(1, count - 3), Math.max(2, count - 2), Math.max(2, count - 1), count]
      };
    });

    const grid = document.getElementById('engActivityGrid');
    if (grid) {
      grid.innerHTML = channels.map(c => `
        <div class="channel-card">
          <div class="channel-top">
            <span class="channel-icon">${getIcon(c.key)}</span>
            <span class="channel-count">${c.count}</span>
          </div>
          <span class="channel-name">${c.name}</span>
          ${getSparkline(c.data, 'var(--color-orange)')}
        </div>`).join('');
    }

    const totalPts = channels.reduce((sum, c) => sum + c.pts, 0) || 1;
    renderBreakdown('engBreakdownContainer', 'Engagement Scoring Breakdown', channels.map(c => ({
      name: c.name,
      icon: getIcon(c.key),
      weight: `${c.weight} pts / unit`,
      count: c.count,
      pts: c.pts,
      totalPts: totalPts,
      color: 'var(--color-orange)'
    })));

    const act = document.getElementById('engActionContainer');
    if (act && isMember) {
      act.innerHTML = `<button type="button" class="btn btn-primary" id="btnLogEng">+ Log Outreach</button>`;
      document.getElementById('btnLogEng').onclick = () => openLogModal('engagement');
    }

    renderSubmissionsTable('engSubmissionsTableBody', allSubs, 'tag-social', 'outreach');
  }

  // Render Motivation Tab
  function renderMotivationTab() {
    const score = window.KPI_ENGINE?.calculateMotivationScore(isMember ? currentUserId : null) || 88;
    const streak = window.KPI_ENGINE?.calculateAttendanceStreak(isMember ? currentUserId : 'm1') || 3;
    const sRow = document.getElementById('motSummaryRow');
    if (sRow) {
      sRow.innerHTML = `
        <div class="mot-score-card">
          <div class="stat-header"><span>Combined Motivation Index</span><span class="rag-badge rag-green">${streak} Session Streak</span></div>
          <div style="display:flex; align-items:baseline; gap:var(--space-2); margin-top:var(--space-1);">
            <span class="stat-value" style="color:var(--color-green); font-size:var(--text-3xl); font-weight:700;">${score}</span>
            <span style="font-size:var(--text-xs); color:var(--color-text-muted);">/ 100 benchmark</span>
          </div>
          <div class="score-explanation">Dynamically calculated from Zoom session attendance records and approved motivation programs.</div>
        </div>`;
    }

    const zoomSessions = window.DataStore ? window.DataStore.getZoomSessions() : [];
    const types = window.DataStore ? window.DataStore.getActivityTypes('motivation') : [];
    const motSubs = window.DataStore ? window.DataStore.getMotivationSubmissions() : [];
    const approvedSubs = motSubs.filter(s => s.status === 'approved');

    // Tally attendance across zoom sessions
    let presCount = 0, lateCount = 0;
    zoomSessions.forEach(zs => {
      Object.values(zs.attendance || {}).forEach(st => {
        if (st === 'present') presCount++;
        else if (st === 'late') lateCount++;
      });
    });
    const zoomPts = presCount * 3 + lateCount * 1;

    const cards = types.map(t => {
      const count = approvedSubs.filter(s => s.type === t.id).length;
      return {
        id: t.id,
        name: t.label,
        key: t.id,
        weight: t.pointValue,
        count: count,
        pts: count * t.pointValue,
        data: [Math.max(1, count - 3), Math.max(1, count - 2), Math.max(1, count - 1), count]
      };
    });

    const grid = document.getElementById('motCardsGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="channel-card zoom-card" id="cardZoomSessions">
          <div class="channel-top">
            <span class="channel-icon green">${ICONS.zoom}</span>
            <span class="channel-count">${zoomSessions.length}</span>
          </div>
          <span class="channel-name">Zoom Calls &amp; Sync</span>
          <button type="button" class="roster-btn"><span>View Roster</span>${svgLine('<path d="M5 12h14M12 5l7 7-7 7"/>', 12, 12)}</button>
        </div>
        ${cards.map(c => `
          <div class="channel-card">
            <div class="channel-top">
              <span class="channel-icon green">${getIcon(c.key)}</span>
              <span class="channel-count">${c.count}</span>
            </div>
            <span class="channel-name">${c.name}</span>
            ${getSparkline(c.data, 'var(--color-green)')}
          </div>
        `).join('')}
      `;
      document.getElementById('cardZoomSessions').onclick = openZoomRosterModal;
    }

    const totalMotPts = (zoomPts + cards.reduce((sum, c) => sum + c.pts, 0)) || 1;
    const breakdownItems = [
      { name: 'Zoom Attendance', icon: ICONS.zoom, weight: '3 pts / pres, 1 pt / late', count: `${presCount} Pres, ${lateCount} Late`, pts: zoomPts, totalPts: totalMotPts, color: 'var(--color-green)' },
      ...cards.map(c => ({
        name: c.name,
        icon: getIcon(c.key),
        weight: `${c.weight} pts / unit`,
        count: c.count,
        pts: c.pts,
        totalPts: totalMotPts,
        color: 'var(--color-green)'
      }))
    ];

    renderBreakdown('motBreakdownContainer', 'Motivation Scoring Breakdown', breakdownItems);

    const act = document.getElementById('motActionContainer');
    if (act && isMember) {
      act.innerHTML = `<button type="button" class="btn btn-primary" id="btnLogMot">+ Log Talk / Event</button>`;
      document.getElementById('btnLogMot').onclick = () => openLogModal('motivation');
    }

    renderSubmissionsTable('motSubmissionsTableBody', motSubs, 'tag-mot', 'motivation');
  }

  function renderBreakdown(containerId, title, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <h2 class="section-title" style="margin-bottom:var(--space-4); border:none; padding:0;">${title}</h2>
      <div class="rank-table-container">
        <table class="tasks-table kra-table">
          <thead>
            <tr><th>Parameter</th><th>Point Weight</th><th>Approved Count</th><th>Points Contributed</th><th>Contribution</th></tr>
          </thead>
          <tbody>
            ${items.map(p => {
              const pct = Math.min(100, Math.round((p.pts / p.totalPts) * 100)) || 0;
              return `
                <tr>
                  <td><span class="pillar-badge" style="color:var(--color-text);">${p.icon} ${p.name}</span></td>
                  <td>${p.weight}</td>
                  <td><strong>${p.count}</strong></td>
                  <td><strong style="color:${p.color};">${p.pts} pts</strong></td>
                  <td>
                    <div class="progress-container" style="margin:0; min-width:140px;">
                      <div class="progress-info"><span class="rag-badge rag-green">${pct}%</span><span style="font-weight:700; color:${p.color};">${p.pts} / ${p.totalPts}</span></div>
                      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%; background-color:${p.color};"></div></div>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Render Submissions Table (Member view vs Admin view)
  function renderSubmissionsTable(tbodyId, list, tagCls, category) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const filtered = isMember ? list.filter(s => s.memberId === currentUserId) : list;
    const allTypes = window.DataStore ? window.DataStore.getActivityTypes() : [];
    const typeLabelMap = {};
    allTypes.forEach(t => { typeLabelMap[t.id] = t.label; });

    tbody.innerHTML = filtered.map(s => {
      const m = window.getMemberOrFallback ? window.getMemberOrFallback(s.memberId) : { name: 'Member', avatar: 'ME' };
      const proofChip = s.proofType === 'url' && s.proofValue
        ? `<a href="${s.proofValue}" target="_blank" rel="noopener noreferrer" class="chip chip-link">${ICONS.link}<span>${s.proofValue}</span></a>`
        : s.proofValue
          ? `<span class="chip">${ICONS.file}<span>${s.proofValue}</span></span>`
          : `<span style="font-size:11px; color:var(--color-text-muted);">None</span>`;

      const typeLabel = typeLabelMap[s.type] || s.type;

      let actionsHtml = '';
      if (isAdmin) {
        actionsHtml = `
          <div class="actions-cell">
            ${s.status !== 'approved' ? `<button type="button" class="btn-action btn-action-approve" data-act="status" data-id="${s.id}" data-st="approved">Approve</button>` : ''}
            ${s.status !== 'reworkNeeded' ? `<button type="button" class="btn-action btn-action-rework" data-act="status" data-id="${s.id}" data-st="reworkNeeded">Rework</button>` : ''}
            <button type="button" class="action-icon-btn icon-edit" data-act="edit" data-id="${s.id}" title="Edit Submission Details">
              ${svgLine('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>', 13, 13)}
            </button>
            <button type="button" class="action-icon-btn icon-delete" data-act="delete" data-id="${s.id}" title="Delete Submission">
              ${svgLine('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 13, 13)}
            </button>
          </div>`;
      } else {
        actionsHtml = `<div class="actions-cell"><span style="font-size:11px; color:var(--color-text-muted);">Submitted</span></div>`;
      }

      const badge = window.getStatusBadge ? window.getStatusBadge(s.status) : `<span class="status-badge badge-grey">${s.status}</span>`;

      return `
        <tr class="table-row-hover">
          <td><div class="activity-cell"><span class="activity-title">${s.title}</span><span class="activity-badge ${tagCls}">${typeLabel}</span></div></td>
          <td><div class="member-cell"><span class="member-avatar">${m.avatar}</span><span class="member-name">${m.name}</span></div></td>
          <td>${s.date}</td>
          <td>${proofChip}</td>
          <td>${badge}</td>
          <td>${actionsHtml}</td>
        </tr>`;
    }).join('');

    tbody.onclick = (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const { act, id, st } = btn.dataset;

      if (act === 'status' && id && st && window.DataStore?.updateEngagementSubmissionStatus) {
        window.DataStore.updateEngagementSubmissionStatus(id, st, u);
        window.KPI_ENGINE?.recalculateAllMembers();
        renderEngagementTab();
        renderMotivationTab();
      } else if (act === 'edit' && id) {
        openEditSubmissionModal(id);
      } else if (act === 'delete' && id) {
        if (confirm('Are you sure you want to permanently delete this submission?')) {
          try {
            window.DataStore.deleteSubmission(id, u);
            window.KPI_ENGINE?.recalculateAllMembers();
            renderEngagementTab();
            renderMotivationTab();
          } catch (err) {
            alert(err.message);
          }
        }
      }
    };
  }

  // Log Activity Modal (Member-Facing)
  function openLogModal(cat) {
    const modal = document.getElementById('logActivityModal');
    const categoryKey = cat === 'engagement' ? 'outreach' : 'motivation';
    document.getElementById('logCategoryType').value = cat;
    document.getElementById('logModalTitle').textContent = cat === 'engagement' ? 'Log Outreach Activity' : 'Log Talk / Micro-Event';

    const select = document.getElementById('logActivitySelect');
    const types = window.DataStore ? window.DataStore.getActivityTypes(categoryKey) : [];

    select.innerHTML = types.map(t => `<option value="${t.id}">${t.label} (${t.pointValue} pts)</option>`).join('');

    function updateProofReq() {
      const curType = types.find(t => t.id === select.value);
      const reqBadge = document.getElementById('logProofRequiredBadge');
      const optHint = document.getElementById('logProofOptionalHint');
      const requiresProof = curType ? curType.requiresProof : true;

      if (requiresProof) {
        if (reqBadge) { reqBadge.textContent = 'Required'; reqBadge.className = 'proof-badge-required'; }
        if (optHint) optHint.style.display = 'none';
      } else {
        if (reqBadge) { reqBadge.textContent = 'Optional'; reqBadge.className = 'proof-badge-optional'; }
        if (optHint) optHint.style.display = 'block';
      }
    }

    select.onchange = updateProofReq;
    updateProofReq();

    document.getElementById('logFileName').textContent = 'No file chosen';
    modal.classList.add('active');
  }

  document.getElementById('logProofFile')?.addEventListener('change', (e) => {
    document.getElementById('logFileName').textContent = e.target.files[0]?.name || 'No file chosen';
  });

  document.getElementById('logActivityForm').onsubmit = (e) => {
    e.preventDefault();
    const cat = document.getElementById('logCategoryType').value;
    const type = document.getElementById('logActivitySelect').value;
    const title = document.getElementById('logActivityTitle').value;
    const date = document.getElementById('logActivityDate').value;
    const url = document.getElementById('logProofUrl').value;
    const file = document.getElementById('logProofFile').files[0];

    const curType = window.DataStore?.getActivityTypeById(type);
    if (curType && curType.requiresProof && !url && !file) {
      alert(`Proof of work (URL or document upload) is required for "${curType.label}".`);
      return;
    }

    const entryData = {
      type,
      title,
      date,
      proofType: url ? 'url' : (file ? 'file' : 'none'),
      proofValue: url || file?.name || ''
    };

    if (window.DataStore) {
      if (cat === 'engagement') window.DataStore.logEngagementActivity(entryData, u);
      else window.DataStore.logMotivationActivity(entryData, u);
    }

    document.getElementById('logActivityModal').classList.remove('active');
    e.target.reset();
    document.getElementById('logFileName').textContent = 'No file chosen';
    renderEngagementTab();
    renderMotivationTab();
  };

  // Zoom Roster & Session Lifecycle Management
  let activeZoomSessionId = null;

  function openZoomRosterModal() {
    const modal = document.getElementById('zoomRosterModal');
    const sessions = window.DataStore ? window.DataStore.getZoomSessions() : [];
    if (!activeZoomSessionId || !sessions.some(s => s.id === activeZoomSessionId)) {
      activeZoomSessionId = sessions[0]?.id || null;
    }
    renderZoomRosterContent();
    modal.classList.add('active');
  }

  function renderZoomRosterContent() {
    const sessions = window.DataStore ? window.DataStore.getZoomSessions() : [];
    const select = document.getElementById('zoomSessionSelect');
    const adminActions = document.getElementById('zoomAdminActions');
    const info = document.getElementById('zoomSessionInfo');
    const body = document.getElementById('zoomModalBody');

    if (isAdmin && adminActions) adminActions.style.display = 'flex';

    if (select) {
      select.innerHTML = sessions.map(s => `
        <option value="${s.id}" ${s.id === activeZoomSessionId ? 'selected' : ''}>
          ${s.title} (${s.date} ${s.time || ''})
        </option>`).join('');

      select.onchange = (e) => {
        activeZoomSessionId = e.target.value;
        renderZoomRosterContent();
      };
    }

    const curSess = sessions.find(s => s.id === activeZoomSessionId) || sessions[0];
    if (curSess) {
      activeZoomSessionId = curSess.id;
      if (info) {
        info.innerHTML = `<strong>Active Session:</strong> ${curSess.title} &bull; <strong>Date:</strong> ${curSess.date} &bull; <strong>Time:</strong> ${curSess.time || '10:00 AM'}`;
      }
    } else {
      if (info) info.innerHTML = `<em>No Zoom sessions configured.</em>`;
    }

    const members = getMembers();
    if (body) {
      if (!curSess) {
        body.innerHTML = `<div style="padding:var(--space-4); text-align:center; color:var(--color-text-muted);">No sessions available. Admin can create a new session above.</div>`;
        return;
      }

      body.innerHTML = members.map(m => {
        const status = curSess.attendance?.[m.id] || 'absent';
        return `
          <div class="zoom-member-row">
            <div class="zoom-member-info">
              <span class="zoom-member-name">${m.name}</span>
              <span class="zoom-member-role">(${m.role})</span>
            </div>
            ${isAdmin ? `
              <div class="att-segment-group">
                <button type="button" class="att-seg-btn ${status==='present'?'active-present':''}" data-mid="${m.id}" data-st="present">Present</button>
                <button type="button" class="att-seg-btn ${status==='late'?'active-late':''}" data-mid="${m.id}" data-st="late">Late</button>
                <button type="button" class="att-seg-btn ${status==='absent'?'active-absent':''}" data-mid="${m.id}" data-st="absent">Absent</button>
              </div>` : `
              <span class="status-badge ${status==='present'?'badge-green':status==='late'?'badge-amber':'badge-red'}">${status}</span>`}
          </div>`;
      }).join('');

      body.onclick = (e) => {
        const btn = e.target.closest('.att-seg-btn');
        if (!btn) return;
        const { mid, st } = btn.dataset;
        if (mid && st && curSess && window.DataStore?.setZoomAttendance) {
          window.DataStore.setZoomAttendance(curSess.id, mid, st, u);
          window.KPI_ENGINE?.recalculateAllMembers();
          renderZoomRosterContent();
          renderMotivationTab();
        }
      };
    }
  }

  // Zoom Session Admin Actions
  document.getElementById('btnNewZoomSession')?.addEventListener('click', () => {
    document.getElementById('zoomSessionEditId').value = '';
    document.getElementById('zoomSessionFormTitle').textContent = 'New Zoom Session';
    document.getElementById('zoomSessionTitle').value = '';
    document.getElementById('zoomSessionDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('zoomSessionTime').value = '10:00 AM';
    document.getElementById('zoomSessionFormModal').classList.add('active');
  });

  document.getElementById('btnEditZoomSession')?.addEventListener('click', () => {
    const curSess = window.DataStore?.getZoomSessionById(activeZoomSessionId);
    if (!curSess) return;
    document.getElementById('zoomSessionEditId').value = curSess.id;
    document.getElementById('zoomSessionFormTitle').textContent = 'Edit Zoom Session';
    document.getElementById('zoomSessionTitle').value = curSess.title;
    document.getElementById('zoomSessionDate').value = curSess.date;
    document.getElementById('zoomSessionTime').value = curSess.time || '10:00 AM';
    document.getElementById('zoomSessionFormModal').classList.add('active');
  });

  document.getElementById('btnDeleteZoomSession')?.addEventListener('click', () => {
    const curSess = window.DataStore?.getZoomSessionById(activeZoomSessionId);
    if (!curSess) return;
    const attCount = Object.keys(curSess.attendance || {}).length;
    const confirmMsg = attCount > 0
      ? `This Zoom session already has ${attCount} recorded member attendance records. Are you sure you want to delete "${curSess.title}"?`
      : `Are you sure you want to delete Zoom session "${curSess.title}"?`;

    if (confirm(confirmMsg)) {
      try {
        window.DataStore.deleteZoomSession(curSess.id, u);
        activeZoomSessionId = null;
        renderZoomRosterContent();
        renderMotivationTab();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  document.getElementById('zoomSessionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('zoomSessionEditId').value;
    const title = document.getElementById('zoomSessionTitle').value.trim();
    const date = document.getElementById('zoomSessionDate').value;
    const time = document.getElementById('zoomSessionTime').value.trim();

    try {
      if (editId) {
        window.DataStore.updateZoomSession(editId, { title, date, time }, u);
        activeZoomSessionId = editId;
      } else {
        const created = window.DataStore.createZoomSession({ title, date, time }, u);
        activeZoomSessionId = created.id;
      }
      document.getElementById('zoomSessionFormModal').classList.remove('active');
      renderZoomRosterContent();
      renderMotivationTab();
    } catch (err) {
      alert(err.message);
    }
  });

  // Admin Activity Types Panel Management
  function openActivityTypesModal() {
    renderActivityTypesTable();
    document.getElementById('activityTypesModal').classList.add('active');
  }

  function renderActivityTypesTable() {
    const tbody = document.getElementById('activityTypesTableBody');
    const alertBox = document.getElementById('actTypeAlertBox');
    if (alertBox) alertBox.style.display = 'none';
    if (!tbody) return;

    const list = window.DataStore ? window.DataStore.getActivityTypes() : [];
    tbody.innerHTML = list.map(t => {
      const catBadge = t.category === 'outreach'
        ? `<span class="activity-badge tag-social">Outreach</span>`
        : `<span class="activity-badge tag-mot">Motivation</span>`;
      const proofBadge = t.requiresProof
        ? `<span class="rag-badge rag-green">Required</span>`
        : `<span class="status-badge badge-grey">Optional</span>`;

      return `
        <tr>
          <td><strong>${t.label}</strong> <span style="font-size:11px; color:var(--color-text-muted);">(${t.id})</span></td>
          <td>${catBadge}</td>
          <td><strong>${t.pointValue} pts</strong></td>
          <td>${proofBadge}</td>
          <td>
            <div class="actions-cell">
              <button type="button" class="btn-action-edit" data-act="edit-type" data-id="${t.id}">Edit</button>
              <button type="button" class="btn-action-delete" data-act="del-type" data-id="${t.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.onclick = (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const { act, id } = btn.dataset;

      if (act === 'edit-type') {
        const item = window.DataStore.getActivityTypeById(id);
        if (!item) return;
        document.getElementById('actTypeEditId').value = item.id;
        document.getElementById('actTypeFormTitle').textContent = `Edit Activity Type (${item.label})`;
        document.getElementById('actTypeLabel').value = item.label;
        document.getElementById('actTypeCategory').value = item.category;
        document.getElementById('actTypePointValue').value = item.pointValue;
        document.getElementById('actTypeRequiresProof').checked = Boolean(item.requiresProof);
        document.getElementById('activityTypeFormModal').classList.add('active');
      } else if (act === 'del-type') {
        const item = window.DataStore.getActivityTypeById(id);
        if (!item) return;
        if (confirm(`Are you sure you want to delete activity type "${item.label}"?`)) {
          try {
            window.DataStore.deleteActivityType(id, u);
            renderActivityTypesTable();
            window.KPI_ENGINE?.recalculateAllMembers();
            renderEngagementTab();
            renderMotivationTab();
          } catch (err) {
            if (alertBox) {
              alertBox.textContent = err.message;
              alertBox.style.display = 'block';
            } else {
              alert(err.message);
            }
          }
        }
      }
    };
  }

  document.getElementById('btnAddActivityType')?.addEventListener('click', () => {
    document.getElementById('actTypeEditId').value = '';
    document.getElementById('actTypeFormTitle').textContent = 'New Activity Type';
    document.getElementById('actTypeLabel').value = '';
    document.getElementById('actTypeCategory').value = 'outreach';
    document.getElementById('actTypePointValue').value = '3';
    document.getElementById('actTypeRequiresProof').checked = true;
    document.getElementById('activityTypeFormModal').classList.add('active');
  });

  document.getElementById('activityTypeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('actTypeEditId').value;
    const label = document.getElementById('actTypeLabel').value.trim();
    const category = document.getElementById('actTypeCategory').value;
    const pointValue = Number(document.getElementById('actTypePointValue').value);
    const requiresProof = document.getElementById('actTypeRequiresProof').checked;

    try {
      if (editId) {
        window.DataStore.updateActivityType(editId, { label, category, pointValue, requiresProof }, u);
      } else {
        window.DataStore.createActivityType({ label, category, pointValue, requiresProof }, u);
      }
      document.getElementById('activityTypeFormModal').classList.remove('active');
      renderActivityTypesTable();
      window.KPI_ENGINE?.recalculateAllMembers();
      renderEngagementTab();
      renderMotivationTab();
    } catch (err) {
      alert(err.message);
    }
  });

  // Submission Edit Modal (Admin Correction)
  function openEditSubmissionModal(submissionId) {
    const allSubs = [
      ...(window.DataStore ? window.DataStore.getEngagementSubmissions() : []),
      ...(window.DataStore ? window.DataStore.getMotivationSubmissions() : [])
    ];
    const sub = allSubs.find(s => s.id === submissionId);
    if (!sub) return;

    document.getElementById('editSubmissionId').value = sub.id;
    document.getElementById('editSubmissionTitle').value = sub.title;
    document.getElementById('editSubmissionDate').value = sub.date;
    document.getElementById('editSubmissionProofValue').value = sub.proofValue || '';

    const types = window.DataStore ? window.DataStore.getActivityTypes() : [];
    const typeSelect = document.getElementById('editSubmissionType');
    typeSelect.innerHTML = types.map(t => `<option value="${t.id}" ${t.id === sub.type ? 'selected' : ''}>${t.label} (${t.category})</option>`).join('');

    document.getElementById('editSubmissionModal').classList.add('active');
  }

  document.getElementById('editSubmissionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const subId = document.getElementById('editSubmissionId').value;
    const type = document.getElementById('editSubmissionType').value;
    const title = document.getElementById('editSubmissionTitle').value.trim();
    const date = document.getElementById('editSubmissionDate').value;
    const proofValue = document.getElementById('editSubmissionProofValue').value.trim();
    const proofType = proofValue.startsWith('http://') || proofValue.startsWith('https://') ? 'url' : 'file';

    try {
      window.DataStore.updateSubmission(subId, { type, title, date, proofValue, proofType }, u);
      document.getElementById('editSubmissionModal').classList.remove('active');
      window.KPI_ENGINE?.recalculateAllMembers();
      renderEngagementTab();
      renderMotivationTab();
    } catch (err) {
      alert(err.message);
    }
  });

  // Close handlers
  const closeModals = () => {
    ['logActivityModal', 'zoomRosterModal', 'activityTypesModal', 'activityTypeFormModal', 'zoomSessionFormModal', 'editSubmissionModal'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
  };

  document.getElementById('logModalClose')?.addEventListener('click', closeModals);
  document.getElementById('logCancelBtn')?.addEventListener('click', closeModals);
  document.getElementById('zoomModalClose')?.addEventListener('click', closeModals);
  document.getElementById('activityTypesModalClose')?.addEventListener('click', closeModals);
  document.getElementById('actTypeFormClose')?.addEventListener('click', closeModals);
  document.getElementById('actTypeCancelBtn')?.addEventListener('click', closeModals);
  document.getElementById('zoomSessionFormClose')?.addEventListener('click', closeModals);
  document.getElementById('zoomSessionCancelBtn')?.addEventListener('click', closeModals);
  document.getElementById('editSubmissionModalClose')?.addEventListener('click', closeModals);
  document.getElementById('editSubmissionCancelBtn')?.addEventListener('click', closeModals);

  // Initial render
  renderEngagementTab();
  renderMotivationTab();
});
