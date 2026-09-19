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

    for (const s of sessions) {
      const isDesignatedLive = s.id === 'z-live' || s.status === 'live' || (s.title && s.title.includes('(Live)'));
      let start = new Date(s.scheduledStart || (s.date + 'T10:00:00.000Z')).getTime();
      let end = new Date(s.sessionEnd || (s.date + 'T11:00:00.000Z')).getTime();

      if (isDesignatedLive && (isNaN(start) || now > end)) {
        s.date = new Date(now).toISOString().slice(0, 10);
        s.scheduledStart = new Date(now - 2 * 60000).toISOString();
        s.sessionEnd = new Date(now + 58 * 60000).toISOString();
        s.status = 'live';
        s.title = 'Team Meeting Link (Live)';
        if (!s.zoomUrl) s.zoomUrl = 'https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync';
        start = new Date(s.scheduledStart).getTime();
        end = new Date(s.sessionEnd).getTime();
      } else if (isDesignatedLive && s.title && s.title.includes('Daily Sync')) {
        s.title = 'Team Meeting Link (Live)';
      }

      const isLive = s.status === 'live' || (now >= start - (15 * 60000) && now <= end);
      if (isLive) return { session: s, isLive: true, start, end };
    }
    const s = sessions[0];
    const start = new Date(s.scheduledStart || (s.date + 'T10:00:00.000Z')).getTime();
    const end = new Date(s.sessionEnd || (s.date + 'T11:00:00.000Z')).getTime();
    const isLive = s.status === 'live' || (now >= start - (15 * 60000) && now <= end);
    return { session: s, isLive, start, end };
  }

  function renderJoinCallBanner(containerEl, memberId) {
    if (!containerEl) return;
    const info = getActiveOrUpcomingSession();
    if (!info) { containerEl.innerHTML = ''; return; }
    const { session, isLive, start, end } = info;
    const ds = window.DataStore;
    const u = ds?.getCurrentUser();

    // Mutually exclusive single-status logic:
    // 1. Admin confirmed: only show confirmed status badge
    // 2. Pending member checkin: only show "Checked In at [time] ✓" button
    // 3. Before member clicks: show active coral "Join" button (or "Call Not Live" if scheduled)
    const isAdminConfirmed = session.attendance?.[memberId] && session.attendanceRecords?.[memberId]?.source === 'admin-override';
    const pending = session.pendingCheckIns?.[memberId];

    let rightContent = '';
    if (isAdminConfirmed) {
      const st = session.attendance[memberId];
      const badgeCls = st === 'present' ? 'badge-green' : (st === 'late' ? 'badge-amber' : 'badge-red');
      rightContent = `<span class="status-badge ${badgeCls}" style="font-size:12px; font-weight:700; padding:6px 14px; border-radius:var(--radius-pill);">${st.toUpperCase()} (CONFIRMED)</span>`;
    } else if (pending) {
      const timeStr = pending.timeStr || (pending.capturedAt ? new Date(pending.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      rightContent = `
        <button type="button" class="btn-join-call confirmed" id="btnJoinZoomCall" data-sid="${session.id}" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Checked In at ${timeStr || 'Session'} &#10003;</span>
        </button>`;
    } else if (isLive) {
      rightContent = `
        <button type="button" class="btn-join-call btn-coral-live" id="btnJoinZoomCall" data-sid="${session.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span>Join</span>
        </button>`;
    } else {
      rightContent = `
        <button type="button" class="btn-join-call" id="btnJoinZoomCall" data-sid="${session.id}" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span>Call Not Live</span>
        </button>`;
    }

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
          ${rightContent}
        </div>
      </div>`;

    const btn = typeof document !== 'undefined' ? document.getElementById('btnJoinZoomCall') : null;
    if (btn && isLive && !pending && !isAdminConfirmed) {
      btn.onclick = () => {
        const clickTime = Date.now();
        const zoomUrl = session.zoomUrl || session.meetingUrl || session.link || session.url || 'https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync';
        if (zoomUrl && typeof window !== 'undefined' && typeof window.open === 'function') {
          try { window.open(zoomUrl, '_blank', 'noopener,noreferrer'); } catch (e) {}
        }
        try {
          if (ds && ds.recordZoomSelfCapture) {
            ds.recordZoomSelfCapture(session.id, memberId, clickTime, u);
          }
          renderJoinCallBanner(containerEl, memberId);
          if (window.renderMotivationTab) window.renderMotivationTab();
        } catch (err) { alert(err.message); }
      };
    }
  }

  function getRosterSourceTag(session, memberId) {
    if (session?.attendance?.[memberId]) {
      return `<span class="source-tag admin-override" title="Admin confirmed manual mark">CONFIRMED</span>`;
    }
    const pending = session?.pendingCheckIns?.[memberId];
    if (pending) {
      const st = (pending.suggestedStatus || 'present').toUpperCase();
      return `<span class="source-tag self-capture suggested" title="Member checked in at ${pending.timeStr}">SUGGESTED: ${st} &bull; ${pending.timeStr}</span>`;
    }
    return '';
  }

  window.ZOOM_SELF_CAPTURE = {
    getActiveOrUpcomingSession,
    renderJoinCallBanner,
    getRosterSourceTag
  };
})();
