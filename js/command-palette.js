/**
 * Useme Team - Global Command Palette Search Controller (Dashboard Only)
 */
(function() {
  function initPalette() {
    if (document.getElementById('cmdPaletteOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cmdPaletteOverlay';
    overlay.className = 'cmd-overlay';
    overlay.innerHTML = `<div class="cmd-card">
      <div class="cmd-input-wrapper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="cmdInput" class="cmd-input" placeholder="Search leaders, tasks, projects, skills..." autocomplete="off" />
        <kbd class="global-search-kbd" id="cmdCloseKbd" style="cursor:pointer;">ESC</kbd>
      </div>
      <div class="cmd-results" id="cmdResults"></div>
      <div class="cmd-footer"><span>Navigate <kbd class="global-search-kbd">↑</kbd> <kbd class="global-search-kbd">↓</kbd> <kbd class="global-search-kbd">↵</kbd></span><span>Close <kbd class="global-search-kbd">ESC</kbd></span></div>
    </div>`;
    document.body.appendChild(overlay);
    modalEl = overlay;
    inputEl = document.getElementById('cmdInput');
    resultsEl = document.getElementById('cmdResults');
    overlay.onclick = (e) => { if (e.target === overlay) closePalette(); };
    document.getElementById('cmdCloseKbd').onclick = closePalette;
    inputEl.oninput = () => renderResults(inputEl.value.trim());
    inputEl.onkeydown = handleKeyNav;
    injectTopBarTriggers();
  }

  function injectTopBarTriggers() {

    const mob = document.querySelector('.mobile-header');
    if (mob && !document.getElementById('mobileSearchBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'mobileSearchBtn';
      btn.className = 'mobile-search-btn';
      btn.setAttribute('aria-label', 'Open search');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
      btn.onclick = openPalette;
      const toggle = document.getElementById('sidebarToggle');
      toggle ? mob.insertBefore(btn, toggle) : mob.appendChild(btn);
    }
    const dBtn = document.getElementById('desktopSearchBtn');
    if (dBtn) {
      dBtn.onclick = openPalette;
      dBtn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPalette(); } };
    }
  }

  function openPalette() {
    if (!modalEl) initPalette();
    modalEl.classList.add('active');
    inputEl.value = '';
    renderResults('');
    setTimeout(() => inputEl.focus(), 50);
  }

  function closePalette() { if (modalEl) modalEl.classList.remove('active'); }

  function searchEntities(q) {
    const ds = window.DataStore, role = localStorage.getItem('useme_role') || 'member', groups = [];
    const data = ds ? { members: ds.getMembers(), tasks: ds.getTasks(), projects: ds.getProjects(), events: ds.getEvents(), categories: ds.getSkillCategories() } : { members: [], tasks: [], projects: [], events: [], categories: [] };
    const members = (data.members || []).filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.skills || []).some(s => s.toLowerCase().includes(q)) || m.role.toLowerCase().includes(q));
    if (members.length) groups.push({ label: 'Members', items: members.map(m => ({ title: m.name, sub: `${m.role} • ${(m.skills || []).join(', ')}`, badge: m.id.toUpperCase(), avatar: m.avatar, act: () => { window.openMemberModal ? window.openMemberModal(m.id) : (window.location.href = `ranking.html?memberId=${m.id}`); } })) });

    const allMembers = data.members || [];
    const tasks = (data.tasks || []).filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || allMembers.filter(m => (t.assignedTo || []).includes(m.id)).map(m => m.name.toLowerCase()).join(' ').includes(q));
    if (tasks.length) groups.push({ label: 'Tasks', items: tasks.map(t => ({ title: t.title, sub: `Due: ${t.dueDate} • ${t.status}`, badge: 'TASK', act: () => { window.openTaskDetailModal ? window.openTaskDetailModal(t.id) : (window.location.href = `tasks.html?taskId=${t.id}`); } })) });

    const subs = (data.tasks || []).filter(t => (t.submittedForReview || t.status === 'awaitingFeedback') && t.title.toLowerCase().includes(q));
    if (subs.length) groups.push({ label: 'Submissions', items: subs.map(t => ({ title: t.title, sub: `Review Status • ${t.linkedProject || 'Deliverable'}`, badge: 'REVIEW', act: () => { window.openTaskDetailModal ? window.openTaskDetailModal(t.id) : (window.location.href = `submissions.html?taskId=${t.id}`); } })) });

    const projs = (data.projects || []).filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    if (projs.length) groups.push({ label: 'Projects', items: projs.map(p => ({ title: p.name, sub: p.description, badge: p.status.toUpperCase(), act: () => { window.location.href = `projects.html?id=${p.id}`; } })) });

    const events = (data.events || []).filter(e => e.name.toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
    if (events.length) groups.push({ label: 'Events', items: events.map(e => ({ title: e.name, sub: `${e.eventDate} • ${e.venue}`, badge: e.status.toUpperCase(), act: () => { window.location.href = `events.html?id=${e.id}`; } })) });

    if (role === 'admin') {
      const skillsFound = new Map();
      (data.categories || []).forEach(c => { if (c.name.toLowerCase().includes(q)) skillsFound.set(c.name, c.id); });
      allMembers.forEach(m => (m.skills || []).forEach(s => { if (s.toLowerCase().includes(q)) skillsFound.set(s, m.skillCategory); }));
      if (skillsFound.size) groups.push({ label: 'Skills', items: Array.from(skillsFound.keys()).map(name => ({ title: name, sub: 'Skill Mapping Directory', badge: 'SKILL', act: () => { window.location.href = `skill-mapping.html?skill=${encodeURIComponent(name)}`; } })) });
    }
    return groups;
  }

  function renderResults(query) {
    if (!resultsEl) return;
    if (!query) {
      resultsEl.innerHTML = `<div class="cmd-empty-state"><p style="font-weight:600; color:var(--color-text); margin-bottom:4px;">Search leaders, tasks, projects...</p><p style="font-size:var(--text-xs);">Type a keyword or member name to search across Useme Team.</p></div>`;
      activeItems = [];
      return;
    }
    const groups = searchEntities(query.toLowerCase());
    activeItems = [];
    selectedIdx = 0;
    if (!groups.length) {
      resultsEl.innerHTML = `<div class="cmd-empty-state">No matching results found for "<strong>${query}</strong>".</div>`;
      return;
    }
    resultsEl.innerHTML = groups.map(g => `<div class="cmd-group-label">${g.label}</div>` + g.items.map(item => {
      const idx = activeItems.length;
      activeItems.push(item);
      const icon = item.avatar ? `<span class="cmd-item-avatar">${item.avatar}</span>` : `<span class="cmd-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg></span>`;
      return `<div class="cmd-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}"><div class="cmd-item-main">${icon}<div><div class="cmd-item-title">${item.title}</div><div class="cmd-item-subtitle">${item.sub}</div></div></div><span class="cmd-item-badge">${item.badge}</span></div>`;
    }).join('')).join('');

    resultsEl.querySelectorAll('.cmd-item').forEach(el => {
      el.onclick = () => { const it = activeItems[parseInt(el.dataset.idx, 10)]; if (it) { closePalette(); it.act(); } };
    });
  }

  function handleKeyNav(e) {
    if (e.key === 'Escape') { closePalette(); return; }
    if (!activeItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = (selectedIdx + 1) % activeItems.length; updateSelection(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = (selectedIdx - 1 + activeItems.length) % activeItems.length; updateSelection(); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = activeItems[selectedIdx]; if (it) { closePalette(); it.act(); } }
  }

  function updateSelection() {
    resultsEl.querySelectorAll('.cmd-item').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIdx);
      if (i === selectedIdx) el.scrollIntoView({ block: 'nearest' });
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modalEl && modalEl.classList.contains('active') ? closePalette() : openPalette();
    } else if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
      closePalette();
    }
  });

  document.addEventListener('DOMContentLoaded', initPalette);
  window.openCommandPalette = openPalette;
})();
