/**
 * Useme Team - Reports UI Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('useme_role') !== 'admin') {
    window.location.replace('dashboard.html');
    return;
  }

  let currentPeriod = 'month';

  function renderReports() {
    const metrics = window.REPORTS_DATA?.getMetrics(currentPeriod) || {};
    const chartData = window.REPORTS_DATA?.getChartData(currentPeriod) || {};

    // Summary Cards
    const elCompleted = document.getElementById('repCompleted');
    const elScore = document.getElementById('repScore');
    const elOverdue = document.getElementById('repOverdue');
    const elRework = document.getElementById('repRework');

    if (elCompleted) elCompleted.textContent = `${metrics.completed || 0} tasks`;
    if (elScore) elScore.textContent = `${metrics.avgScore || 85} / 100`;
    if (elOverdue) elOverdue.textContent = `${metrics.overdue || 0} overdue`;
    if (elRework) elRework.textContent = `${metrics.reworkRate || '0'}%`;

    // Tasks Completed Bar Chart
    const compChartEl = document.getElementById('repCompletedChart');
    if (compChartEl && chartData.completedPerWeek) {
      compChartEl.innerHTML = chartData.completedPerWeek.map(item => `
        <div class="bar-column">
          <span class="bar-val">${item.count}</span>
          <div class="bar-fill green" style="height:${item.heightPct}%;"></div>
          <span class="bar-label">${item.label}</span>
        </div>
      `).join('');
    }

    // Rework Rate Trend Bar Chart
    const reworkChartEl = document.getElementById('repReworkChart');
    if (reworkChartEl && chartData.reworkTrend) {
      reworkChartEl.innerHTML = chartData.reworkTrend.map(item => `
        <div class="bar-column">
          <span class="bar-val">${item.rate}%</span>
          <div class="bar-fill red" style="height:${item.heightPct}%;"></div>
          <span class="bar-label">${item.label}</span>
        </div>
      `).join('');
    }

    // Top Skill Gaps
    const gapsListEl = document.getElementById('repSkillGaps');
    if (gapsListEl && metrics.skillGaps) {
      gapsListEl.innerHTML = metrics.skillGaps.map(g => `
        <li class="gap-item">
          <div>
            <strong>${g.skill}</strong>
            <div style="font-size:11px; color:var(--color-text-muted);">${g.domain} • Gap: <span style="color:var(--color-red); font-weight:600;">${g.gapLevel}</span></div>
          </div>
          <span class="status-badge badge-amber">${g.status}</span>
        </li>
      `).join('');
    }
  }

  // Date Range Controls
  const rangeButtons = document.querySelectorAll('.rep-range-btn');
  rangeButtons.forEach(btn => {
    btn.onclick = () => {
      rangeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.range || 'month';
      renderReports();
    };
  });

  // Export CSV Action
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.onclick = () => {
      if (window.REPORTS_DATA?.downloadCSV) {
        window.REPORTS_DATA.downloadCSV(currentPeriod);
      }
    };
  }

  renderReports();
});
