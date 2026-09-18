/**
 * Useme Team - Straight Horizontal SVG Connector Layer
 * Draws 2px horizontal lines with a centered circular report-count badge on active path
 */
(function(global) {
  const CONFIG = {
    COLOR: '#E8514D',
    WIDTH: 2,
    BADGE_RADIUS: 14
  };

  function draw(treeCanvas, container, activePath, empMap, onBadgeClick) {
    if (!treeCanvas || !container || !activePath) return;
    let svg = document.getElementById('zohoConnectorsSvg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'zohoConnectorsSvg';
      svg.setAttribute('class', 'zoho-connectors-overlay');
      container.prepend(svg);
    }

    svg.setAttribute('width', String(container.scrollWidth));
    svg.setAttribute('height', String(container.scrollHeight));
    svg.innerHTML = '';

    const cRect = container.getBoundingClientRect();

    activePath.forEach((parentId, colIdx) => {
      const pEmp = empMap ? empMap.get(parentId) : null;
      if (!pEmp || !pEmp.directReportIds || !pEmp.directReportIds.length) return;

      const card = document.getElementById(`card-${parentId}`);
      const nextCol = container.querySelector(`.zoho-column[data-depth="${colIdx + 1}"]`);
      if (!card || !nextCol) return;

      const cardRect = card.getBoundingClientRect();
      const colRect = nextCol.getBoundingClientRect();

      const startX = Math.round(cardRect.right - cRect.left);
      const endX = Math.round(colRect.left - cRect.left);
      const y = Math.round(cardRect.top + cardRect.height / 2 - cRect.top);

      // Straight horizontal line only (M x1,y L x2,y)
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${y} L ${endX} ${y}`);
      path.setAttribute('stroke', CONFIG.COLOR);
      path.setAttribute('stroke-width', String(CONFIG.WIDTH));
      path.setAttribute('fill', 'none');
      path.setAttribute('class', 'zoho-connector-line');
      svg.appendChild(path);

      // Circular badge sitting directly on that line, centered between card's right and next column's left
      const midX = Math.round((startX + endX) / 2);
      const count = pEmp.totalReportCount || pEmp.directReportIds.length;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'zoho-connector-badge-group');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Toggle reports for ${pEmp.name}`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(midX));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('r', String(CONFIG.BADGE_RADIUS));
      circle.setAttribute('fill', CONFIG.COLOR);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(midX));
      text.setAttribute('y', String(y));
      text.setAttribute('dy', '0.35em');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'var(--font-sans, system-ui, sans-serif)');
      text.textContent = count;

      g.appendChild(circle);
      g.appendChild(text);

      if (typeof onBadgeClick === 'function') {
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          onBadgeClick(parentId, colIdx);
        });
      }

      svg.appendChild(g);
    });
  }

  function clear() {
    const svg = document.getElementById('zohoConnectorsSvg');
    if (svg) svg.innerHTML = '';
  }

  function highlight() {} // No-op: no extra hover-glow per reference screenshot

  global.HierarchyConnectors = { draw, clear, highlight, CONFIG };
})(typeof window !== 'undefined' ? window : global);
