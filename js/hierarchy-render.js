/**
 * Useme Team - Hierarchy DOM Rendering Module
 * Builds Miller-columns, cards, badges, and layout with shift-on-expand transform
 */
(function(global) {
  const RENDER_CONFIG = {
    CARD_WIDTH: 236,
    CONNECTOR_WIDTH: 72,
    COLUMN_GAP: 0,
    COLUMN_WIDTH: 308, // 236 + 72 + 0
    TRANSITION_MS: 300
  };

  const DEPT_COLS = {
    'Executive': '#4F46E5', 'Engineering': '#2563EB', 'Product & Design': '#D97706',
    'Growth & Marketing': '#059669', 'Finance & Operations': '#0D9488',
    'Data & Analytics': '#7C3AED', 'Customer Support': '#E11D48'
  };
  const getDeptColor = d => DEPT_COLS[d] || '#2563EB';

  function createCardEl(emp, colIdx, context) {
    const { activePath, activeDept, onBadgeClick, onCardClick } = context;
    const isExpanded = activePath[colIdx] === emp.id;
    const isOnPath = activePath.includes(emp.id);
    const hasReports = Boolean(emp.directReportIds && emp.directReportIds.length > 0);
    const deptColor = getDeptColor(emp.department);

    const wrap = document.createElement('div');
    wrap.className = `zoho-card-wrapper ${isExpanded ? 'expanded' : ''}`;
    wrap.id = `wrapper-${emp.id}`;

    const card = document.createElement('div');
    const isDimmed = activeDept !== 'all' && emp.department !== activeDept;
    card.className = `zoho-card org-card ${isDimmed ? 'dimmed' : ''} ${isOnPath ? 'on-path' : ''} ${isExpanded ? 'selected' : ''}`;
    card.id = `card-${emp.id}`;
    card.dataset.id = emp.id;
    card.dataset.dept = emp.department;
    card.style.setProperty('--dept-color', deptColor);

    card.innerHTML = `
      <div class="zoho-avatar">${emp.avatar}</div>
      <div class="zoho-info">
        <div class="zoho-name" title="${emp.name}">${emp.name}</div>
        <div class="zoho-role" title="${emp.role}">${emp.role}</div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.zoho-badge')) return;
      e.stopPropagation();
      onCardClick(emp, card, colIdx);
    });

    wrap.appendChild(card);

    if (hasReports && !isExpanded) {
      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'zoho-badge';
      badge.setAttribute('aria-label', `Show reports for ${emp.name}`);
      badge.textContent = emp.totalReportCount || emp.directReportIds.length;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        onBadgeClick(emp.id, colIdx);
      });
      wrap.appendChild(badge);
    }

    return wrap;
  }

  function alignColumns(container, activePath) {
    let cumulativeTop = 0;
    for (let i = 0; i < activePath.length; i++) {
      const parentId = activePath[i];
      const nextCol = container.querySelector(`.zoho-column[data-depth="${i + 1}"]`);
      if (!nextCol) break;
      const parentWrap = document.getElementById(`wrapper-${parentId}`);
      if (parentWrap) cumulativeTop += parentWrap.offsetTop;
      nextCol.style.marginTop = `${cumulativeTop}px`;
    }
  }

  function renderColumns(treeCanvas, root, empMap, context) {
    if (!treeCanvas || !root) return null;
    let container = document.getElementById('zohoColumns');
    if (!container) {
      container = document.createElement('div');
      container.className = 'zoho-columns-container';
      container.id = 'zohoColumns';
      treeCanvas.appendChild(container);
    }
    container.innerHTML = '';

    const col0 = document.createElement('div');
    col0.className = 'zoho-column';
    col0.dataset.depth = '0';
    col0.appendChild(createCardEl(root, 0, context));
    container.appendChild(col0);

    let renderedCount = 1;
    for (let i = 0; i < context.activePath.length; i++) {
      const parentId = context.activePath[i];
      const parent = empMap.get(parentId);
      if (!parent || !parent.directReportIds || !parent.directReportIds.length) break;

      const colEl = document.createElement('div');
      colEl.className = 'zoho-column';
      colEl.dataset.depth = String(i + 1);

      parent.directReportIds.forEach(cid => {
        const child = empMap.get(cid);
        if (child) colEl.appendChild(createCardEl(child, i + 1, context));
      });

      container.appendChild(colEl);
      renderedCount++;
    }

    container.classList.toggle('root-only', renderedCount === 1);
    if (renderedCount > 1) alignColumns(container, context.activePath);

    return { container, renderedCount };
  }

  global.HierarchyRender = { createCardEl, renderColumns, alignColumns, RENDER_CONFIG };
})(typeof window !== 'undefined' ? window : global);
