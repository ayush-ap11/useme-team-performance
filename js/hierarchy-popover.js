/**
 * Useme Team - Hierarchy Card Detail Popover Controller
 * Anchored to card bottom-left with 8px offset, auto-flips near viewport bounds
 */
(function(global) {
  let popoverEl = null;
  let activeEmpId = null;
  let activeCardEl = null;

  const DEPT_COLORS = {
    'Executive': '#4F46E5', 'Engineering': '#2563EB', 'Product & Design': '#D97706',
    'Growth & Marketing': '#059669', 'Finance & Operations': '#0D9488',
    'Data & Analytics': '#7C3AED', 'Customer Support': '#E11D48'
  };

  function getDeptColor(dept) {
    return DEPT_COLORS[dept] || '#2563EB';
  }

  function ensurePopoverEl() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement('div');
    popoverEl.className = 'zoho-popover';
    popoverEl.id = 'zohoCardPopover';
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.style.display = 'none';

    popoverEl.innerHTML = `
      <div class="zoho-popover-header">
        <div class="zoho-popover-avatar" id="zpAvatar">--</div>
        <div class="zoho-popover-meta">
          <div class="zoho-popover-name" id="zpName">--</div>
          <div class="zoho-popover-role" id="zpRole">--</div>
        </div>
      </div>
      <div class="zoho-popover-divider"></div>
      <div class="zoho-popover-stats">
        <div class="zoho-popover-stat">
          <div class="zoho-popover-stat-value" id="zpTotalMembers">0</div>
          <div class="zoho-popover-stat-label">Total Members</div>
        </div>
        <div class="zoho-popover-stat">
          <div class="zoho-popover-stat-value" id="zpDirectReports">0</div>
          <div class="zoho-popover-stat-label">Direct Reports</div>
        </div>
      </div>
      <div class="zoho-popover-actions">
        <button type="button" class="zoho-popover-action-btn" aria-label="Chat message" title="Message">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button type="button" class="zoho-popover-action-btn" aria-label="Video meeting" title="Video call">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </button>
        <button type="button" class="zoho-popover-action-btn" aria-label="Audio call" title="Phone call">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(popoverEl);

    document.addEventListener('pointerdown', (e) => {
      if (!activeEmpId) return;
      if (popoverEl.contains(e.target) || (activeCardEl && activeCardEl.contains(e.target))) return;
      hide();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeEmpId) hide();
    });

    window.addEventListener('resize', () => {
      if (activeEmpId && activeCardEl) updatePosition(activeCardEl);
    });

    window.addEventListener('scroll', () => {
      if (activeEmpId && activeCardEl) updatePosition(activeCardEl);
    }, true);

    return popoverEl;
  }

  function updatePosition(cardEl) {
    if (!popoverEl || !cardEl) return;
    const cardRect = cardEl.getBoundingClientRect();
    const popWidth = 260;
    const popHeight = popoverEl.offsetHeight || 190;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: anchored to bottom-left corner of card, offset 8px below
    let left = cardRect.left;
    let top = cardRect.bottom + 8;

    // Flip horizontally if overflowing right edge
    if (left + popWidth > vw - 12) {
      left = cardRect.right - popWidth;
    }
    // Flip vertically if overflowing bottom edge
    if (top + popHeight > vh - 12) {
      top = cardRect.top - popHeight - 8;
    }

    // Viewport bounds clamping
    left = Math.max(12, Math.min(left, vw - popWidth - 12));
    top = Math.max(12, Math.min(top, vh - popHeight - 12));

    popoverEl.style.left = `${Math.round(left)}px`;
    popoverEl.style.top = `${Math.round(top)}px`;
  }

  function show(emp, cardEl) {
    const pop = ensurePopoverEl();
    activeEmpId = emp.id;
    activeCardEl = cardEl;

    const av = pop.querySelector('#zpAvatar');
    av.textContent = emp.avatar || '??';
    av.style.backgroundColor = getDeptColor(emp.department);

    pop.querySelector('#zpName').textContent = emp.name;
    pop.querySelector('#zpRole').textContent = emp.role;
    pop.querySelector('#zpTotalMembers').textContent = emp.totalReportCount || (emp.directReportIds ? emp.directReportIds.length : 0);
    pop.querySelector('#zpDirectReports').textContent = emp.directReportIds ? emp.directReportIds.length : 0;

    pop.style.display = 'block';
    updatePosition(cardEl);
    requestAnimationFrame(() => pop.classList.add('visible'));
  }

  function hide() {
    if (!popoverEl || !activeEmpId) return;
    popoverEl.classList.remove('visible');
    activeEmpId = null;
    activeCardEl = null;
    setTimeout(() => { if (!activeEmpId) popoverEl.style.display = 'none'; }, 150);
  }

  function toggle(emp, cardEl) {
    if (activeEmpId === emp.id) hide();
    else show(emp, cardEl);
  }

  global.HierarchyPopover = { show, hide, toggle, updatePosition };
})(typeof window !== 'undefined' ? window : global);
