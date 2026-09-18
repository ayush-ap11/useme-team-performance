/**
 * Useme Team - Team Hierarchy Controller
 * Manages centered root, smooth auto-scroll on expand/collapse, drag-pan, and popover
 */
document.addEventListener('DOMContentLoaded', () => {
  const treeCanvas = document.getElementById('treeWrapper');
  const searchInput = document.getElementById('orgSearchInput');
  const deptSelect = document.getElementById('orgDeptSelect');
  const btnExport = document.getElementById('btnExportOrg');

  const hierarchyData = window.buildHierarchy ? window.buildHierarchy() : [];
  const empMap = new Map(hierarchyData.map(e => [e.id, e]));
  const root = hierarchyData.find(e => !e.managerId) || hierarchyData[0];
  const COL_WIDTH = window.HierarchyRender?.RENDER_CONFIG?.COLUMN_WIDTH || 308;

  let activePath = []; // Initial load: only root is rendered
  let activeDept = 'all';

  if (window.DataStore) {
    const origGet = window.DataStore.getMemberById;
    window.DataStore.getMemberById = id => empMap.get(id) || (origGet ? origGet.call(window.DataStore, id) : null);
    window.DataStore.getMembers = () => hierarchyData;
  }

  function handleBadgeClick(empId, colIdx) {
    activePath = (activePath[colIdx] === empId) ? activePath.slice(0, colIdx) : [...activePath.slice(0, colIdx), empId];
    updateTree();
  }

  function handleCardClick(emp, cardEl) {
    if (window.HierarchyPopover) window.HierarchyPopover.toggle(emp, cardEl);
  }

  function updateTree() {
    if (!treeCanvas || !root || !window.HierarchyRender) return;
    const context = { activePath, activeDept, onBadgeClick: handleBadgeClick, onCardClick: handleCardClick };
    const res = window.HierarchyRender.renderColumns(treeCanvas, root, empMap, context);
    if (!res) return;
    const { container, renderedCount } = res;

    const targetLeft = renderedCount > 1 ? (COL_WIDTH * (renderedCount - 1)) : 0;
    const targetTop = renderedCount === 1 ? 0 : treeCanvas.scrollTop;
    treeCanvas.scrollTo({ left: targetLeft, top: targetTop, behavior: 'smooth' });

    if (window.HierarchyConnectors && container) {
      requestAnimationFrame(() => {
        window.HierarchyConnectors.draw(treeCanvas, container, activePath, empMap, handleBadgeClick);
      });
    }
  }

  // Native Drag-to-Scroll (Free horizontal & vertical panning)
  let isDown = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
  if (treeCanvas) {
    treeCanvas.addEventListener('mousedown', (e) => {
      if (e.target.closest('.zoho-card') || e.target.closest('.zoho-connector-badge-group')) return;
      isDown = true;
      startX = e.pageX;
      startY = e.pageY;
      startLeft = treeCanvas.scrollLeft;
      startTop = treeCanvas.scrollTop;
      treeCanvas.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      treeCanvas.scrollLeft = startLeft - (e.pageX - startX);
      treeCanvas.scrollTop = startTop - (e.pageY - startY);
    });

    window.addEventListener('mouseup', () => {
      if (isDown) { isDown = false; treeCanvas.classList.remove('is-dragging'); }
    });

    treeCanvas.addEventListener('scroll', () => {
      const container = document.getElementById('zohoColumns');
      if (window.HierarchyConnectors && container) {
        window.HierarchyConnectors.draw(treeCanvas, container, activePath, empMap, handleBadgeClick);
      }
    });
  }

  window.navigateToMember = (id) => {
    const path = [];
    let cur = empMap.get(id);
    while (cur && cur.managerId) { path.unshift(cur.managerId); cur = empMap.get(cur.managerId); }
    activePath = path;
    updateTree();
    setTimeout(() => {
      const card = document.getElementById(`card-${id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        card.classList.add('highlight-pulse');
        setTimeout(() => card.classList.remove('highlight-pulse'), 2000);
        const mem = empMap.get(id);
        if (mem && window.HierarchyPopover) window.HierarchyPopover.show(mem, card);
      }
    }, 350);
  };
  window.navigateToMemberCard = window.navigateToMember;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return;
      const f = hierarchyData.find(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
      if (f) window.navigateToMember(f.id);
    });
  }

  if (deptSelect) {
    const depts = [...new Set(hierarchyData.map(e => e.department))];
    deptSelect.innerHTML = `<option value="all">All Departments</option>` +
      depts.map(d => `<option value="${d}">${d}</option>`).join('');
    deptSelect.addEventListener('change', (e) => {
      activeDept = e.target.value;
      document.querySelectorAll('.zoho-card').forEach(c => {
        c.classList.toggle('dimmed', activeDept !== 'all' && c.dataset.dept !== activeDept);
        c.classList.toggle('dept-highlight', activeDept !== 'all' && c.dataset.dept === activeDept);
      });
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const rows = [['ID', 'Name', 'Role', 'Department', 'Manager ID', 'Total Reports'], ...hierarchyData.map(e => [e.id, `"${e.name}"`, `"${e.role}"`, `"${e.department}"`, e.managerId || '', e.totalReportCount])];
      const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'useme_team_hierarchy.csv'; a.click();
    });
  }

  window.addEventListener('resize', () => {
    const container = document.getElementById('zohoColumns');
    if (window.HierarchyConnectors && container) {
      window.HierarchyConnectors.draw(treeCanvas, container, activePath, empMap, handleBadgeClick);
    }
  });

  updateTree();
});
