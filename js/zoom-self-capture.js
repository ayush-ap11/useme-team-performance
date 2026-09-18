/**
 * Useme Team - Zoom Self-Capture Controller (Team Member & Roster Integration)
 */
(function() {
  function getActiveOrUpcomingSession() {
    const ds = window.DataStore;
    if (!ds) return null;
    const sessions = ds.getZoomSessions ? ds.getZoomSessions() : [];
    if (!sessions.length) return null;
    const now = Date.now();

    // Check if any session is currently live or in grace window (15m before start to end)
    for (const s of sessions) {
      const start = new Date(s.scheduledStart || (s.date + 'T10:00:00.000Z')).getTime();
      const end = new Date(s.sessionEnd || (s.date + 'T11:00:00.000Z')).getTime();
      if (now >= start - (15 * 60000) && now <= end) {
        return { session: s, isLive: true, start, end };
      }
    }
    // Otherwise return the most recent or upcoming
    const s = sessions[0];
    const start = new Date(s.scheduledStart || (s.date + 'T10:00:00.000Z')).getTime();
    const end = new Date(s.sessionEnd || (s.date + 'T11:00:00.000Z')).getTime();
    return { session: s, isLive: false, start, end };
  }

  function renderJoinCallBanner(containerEl, memberId) {
    if (!containerEl) return;
    const info = getActiveOrUpcomingSession();
    if (!info) {
      containerEl.innerHTML = '';
      return;
    }
    const { session, isLive, start, end } = info;
    const now = Date.now();
    const ds = window.DataStore;
    const u = ds?.getCurrentUser();

    // Auto-resolve to absent if session ended and user never clicked join
    if (now > end && session.attendance && !session.attendance[memberId]) {
      if (ds && ds.recordZoomSelfCapture) {
        ds.recordZoomSelfCapture(session.id, memberId, end, u);
      }
    }

    const currentRec = session.attendanceRecords?.[memberId] || (session.attendance?.[memberId] ? { status: session.attendance[memberId], source: 'self-capture' } : null);
    const hasJoined = !!currentRec && currentRec.status !== 'absent';
    const statusBadge = hasJoined
      ? `<span class="status-badge ${currentRec.status === 'present' ? 'badge-green' : 'badge-amber'}">${currentRec.status.toUpperCase()} (${currentRec.source || 'self-capture'})</span>`
      : '';

    containerEl.innerHTML = `
      <div class="zoom-join-card ${isLive ? 'is-live' : ''}">
        <div class="zoom-join-left">
          <div class="zoom-pulse-indicator ${isLive ? 'active' : ''}"></div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:var(--text-sm);">${session.title}</strong>
              ${isLive ? '<span class="live-pill">LIVE NOW</span>' : '<span class="upcoming-pill">SCHEDULED</span>'}
            </div>
            <div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;">
              ${session.date} &bull; ${session.time || '10:00 AM'} &bull; Window: &le;5m Present, 5&ndash;15m Late
            </div>
          </div>
        </div>
        <div class="zoom-join-right">
          ${statusBadge}
          <button type="button" class="btn-join-call" id="btnJoinZoomCall" data-sid="${session.id}" ${(!isLive || hasJoined) ? 'disabled' : ''}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>${hasJoined ? 'Joined Session' : (isLive ? 'Join Call & Capture' : 'Call Not Live')}</span>
          </button>
        </div>
      </div>`;

    const btn = document.getElementById('btnJoinZoomCall');
    if (btn && isLive && !hasJoined) {
      btn.onclick = () => {
        const clickTime = Date.now();
        try {
          ds.recordZoomSelfCapture(session.id, memberId, clickTime, u);
          renderJoinCallBanner(containerEl, memberId);
          if (window.renderMotivationTab) window.renderMotivationTab();
        } catch (err) { alert(err.message); }
      };
    }
  }

  function getRosterSourceTag(session, memberId) {
    const rec = session?.attendanceRecords?.[memberId];
    if (!rec) return '';
    const isOverride = rec.source === 'admin-override';
    const timeStr = rec.capturedAt ? new Date(rec.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return `<span class="source-tag ${isOverride ? 'admin-override' : 'self-capture'}" title="${isOverride ? 'Admin manual override' : 'Self-capture'} at ${timeStr}">
      ${isOverride ? 'admin-override' : 'self-capture'}${timeStr ? ' &bull; ' + timeStr : ''}
    </span>`;
  }

  window.ZOOM_SELF_CAPTURE = {
    getActiveOrUpcomingSession,
    renderJoinCallBanner,
    getRosterSourceTag
  };
})();
