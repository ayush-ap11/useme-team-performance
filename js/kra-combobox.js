/**
 * Useme Team - KRA Searchable Combobox Component
 */
(function() {
  function createCombobox(container, { members = [], activeId = 'all', onSelect = () => {} }) {
    let currentId = activeId, isOpen = false, query = '', selectedIdx = 0, currentNavItems = [];
    const MAX_RESULTS = 8;

    container.innerHTML = `
      <div class="kra-combo" id="kraCombo">
        <div class="kra-combo-trigger" id="kraComboTrigger"></div>
        <div class="kra-combo-panel" id="kraComboPanel" role="listbox">
          <div class="kra-combo-list" id="kraComboList"></div>
        </div>
      </div>
    `;

    const triggerEl = container.querySelector('#kraComboTrigger');
    const panelEl = container.querySelector('#kraComboPanel');
    const listEl = container.querySelector('#kraComboList');

    function updateTrigger() {
      const mem = members.find(m => m.id === currentId);
      if (currentId !== 'all' && mem) {
        triggerEl.innerHTML = `
          <div class="kra-combo-pill" tabindex="0" role="button" aria-label="Selected: ${mem.name}. Click to change.">
            <div class="kra-combo-pill-main">
              <span class="kra-combo-avatar">${mem.avatar}</span>
              <span class="kra-combo-name">${mem.name}</span>
              <span class="kra-combo-role">(${mem.role})</span>
            </div>
            <button type="button" class="kra-combo-clear" id="kraComboClearBtn" aria-label="Clear to Organization-Wide">&times;</button>
          </div>`;
        triggerEl.querySelector('#kraComboClearBtn').onclick = (e) => {
          e.stopPropagation();
          selectItem('all');
        };
        triggerEl.querySelector('.kra-combo-pill').onclick = () => { togglePanel(true); };
      } else {
        triggerEl.innerHTML = `
          <div class="kra-combo-input-wrap">
            <svg class="kra-combo-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="kra-combo-input" id="kraComboInput" placeholder="Search member or view Organization-Wide..." value="${query}" autocomplete="off" />
          </div>`;
        const inp = triggerEl.querySelector('#kraComboInput');
        inp.onfocus = () => togglePanel(true);
        inp.oninput = (e) => { query = e.target.value; selectedIdx = 0; renderList(); };
        inp.onkeydown = handleKeyNav;
      }
    }

    function togglePanel(open) {
      isOpen = typeof open === 'boolean' ? open : !isOpen;
      panelEl.classList.toggle('active', isOpen);
      if (isOpen) {
        renderList();
        const inp = triggerEl.querySelector('#kraComboInput');
        if (inp) { inp.focus(); }
      }
    }

    function selectItem(id) {
      currentId = id;
      query = '';
      togglePanel(false);
      updateTrigger();
      onSelect(id);
    }

    function renderList() {
      const q = query.trim().toLowerCase();
      const orgItem = { id: 'all', name: 'Organization-Wide (Average)', role: 'Aggregated Team Benchmark', avatar: 'ALL', isOrg: true };
      const matched = members.filter(m => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
      const capped = matched.slice(0, MAX_RESULTS);
      currentNavItems = [orgItem, ...capped];

      let html = `
        <div class="kra-combo-item ${currentNavItems[selectedIdx]?.id === 'all' ? 'selected' : ''} ${currentId === 'all' ? 'is-active' : ''}" data-idx="0">
          <span class="kra-combo-avatar org">ALL</span>
          <div class="kra-combo-meta"><div class="kra-combo-title">Organization-Wide (Average)</div><div class="kra-combo-sub">Aggregated Team Benchmark</div></div>
          <span class="kra-combo-badge">PINNED</span>
        </div>`;

      if (capped.length === 0 && q) {
        html += `<div class="kra-combo-empty">No members matching "<strong>${query}</strong>"</div>`;
      } else {
        html += capped.map((m, i) => {
          const idx = i + 1;
          return `
            <div class="kra-combo-item ${selectedIdx === idx ? 'selected' : ''} ${m.id === currentId ? 'is-active' : ''}" data-idx="${idx}">
              <span class="kra-combo-avatar">${m.avatar}</span>
              <div class="kra-combo-meta"><div class="kra-combo-title">${m.name}</div><div class="kra-combo-sub">${m.role}</div></div>
              <span class="kra-combo-badge">${m.id.toUpperCase()}</span>
            </div>`;
        }).join('');
      }

      if (matched.length > MAX_RESULTS) {
        html += `<div class="kra-combo-hint">+${matched.length - MAX_RESULTS} more — keep typing to narrow</div>`;
      }

      listEl.innerHTML = html;
      listEl.querySelectorAll('.kra-combo-item').forEach(el => {
        el.onclick = () => { const item = currentNavItems[parseInt(el.dataset.idx, 10)]; if (item) selectItem(item.id); };
      });
    }

    function handleKeyNav(e) {
      if (e.key === 'Escape') { togglePanel(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = (selectedIdx + 1) % currentNavItems.length; renderList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = (selectedIdx - 1 + currentNavItems.length) % currentNavItems.length; renderList(); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = currentNavItems[selectedIdx]; if (it) selectItem(it.id); }
    }

    document.addEventListener('click', (e) => { if (!container.contains(e.target)) togglePanel(false); });
    updateTrigger();
  }

  window.initKraCombobox = createCombobox;
})();