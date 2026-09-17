/**
 * Useme Team - Automated Performance Insights Logic (Admin Only)
 */
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('useme_role') !== 'admin') {
    window.location.replace('dashboard.html');
    return;
  }

  const container = document.getElementById('insightsGrid');
  const lastAnalyzedEl = document.getElementById('lastAnalyzedTime');
  const btnReanalyze = document.getElementById('btnReanalyze');
  if (!container) return;

  function runAnalysis() {
    const ds = window.DataStore;
    const tasks = ds ? ds.getTasks() : [];
    const members = ds ? ds.getMembers() : [];
    const categories = ds ? ds.getSkillCategories() : [];
    const projects = ds ? ds.getProjects() : [];
    const engSubs = ds ? ds.getEngagementSubmissions() : [];
    const motSubs = ds ? ds.getMotivationSubmissions() : [];
    const zoomSessions = ds ? ds.getZoomSessions() : [];
    const currentCycle = ds ? ds.getCurrentCycle() : null;

    const now = new Date();
    const insights = [];

    // Helper: filter items by current cycle date range if available
    const inCurrentCycle = (dateStr) => {
      if (!currentCycle || !currentCycle.startDate || !currentCycle.endDate || !dateStr) return true;
      return dateStr >= currentCycle.startDate && dateStr <= currentCycle.endDate;
    };

    // Rule 1: Stuck Tasks (Current active deliverables stagnant for >= 4 days)
    tasks.forEach(t => {
      if (['completed', 'cancelled'].includes(t.status)) return;
      const history = t.statusHistory || [];
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        const lastDate = new Date(lastEntry.timestamp.replace(' ', 'T') + ':00Z');
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 4) {
          const assignee = window.getMemberOrFallback
            ? window.getMemberOrFallback(t.assignedTo[0], { name: 'Assigned Member' })
            : (members.find(m => (t.assignedTo || []).includes(m.id)) || { name: 'Assigned Member' });
          insights.push({
            type: 'Stuck Task',
            headline: `Stalled Deliverable: ${t.title}`,
            explanation: `Assigned to ${assignee.name}. In "${t.status}" status for ${diffDays} days without milestone progress.`,
            severity: diffDays > 5 ? 'high' : 'medium',
            actionText: 'View Task Detail',
            action: () => window.openTaskDetailModal && window.openTaskDetailModal(t.id)
          });
        }
      }
    });

    // Rule 2: Quality Pattern (Rework Cluster in current active deliverables)
    const reworkMap = new Map();
    tasks.forEach(t => {
      if (t.status === 'reworkNeeded') {
        (t.assignedTo || []).forEach(mid => reworkMap.set(mid, (reworkMap.get(mid) || 0) + 1));
      }
    });
    reworkMap.forEach((count, mid) => {
      if (count >= 2) {
        const mem = members.find(m => m.id === mid);
        if (mem) {
          insights.push({
            type: 'Quality Pattern',
            headline: `Rework Cluster: ${mem.name}`,
            explanation: `${mem.name} currently has ${count} active deliverables flagged for rework, impacting sprint completion.`,
            severity: 'high',
            actionText: 'View Member Profile',
            action: () => window.openMemberModal && window.openMemberModal(mem.id)
          });
        }
      }
    });

    // Rule 3: Category Bottleneck (Current active queue blockage in specific skill domains)
    categories.forEach(cat => {
      const catTasks = tasks.filter(t => t.linkedSkill === cat.id && ['reworkNeeded', 'testing', 'awaitingFeedback'].includes(t.status));
      if (catTasks.length >= 3) {
        insights.push({
          type: 'Domain Bottleneck',
          headline: `Capacity Bottleneck: ${cat.name}`,
          explanation: `${catTasks.length} tasks in ${cat.name} are currently blocked in review or rework queues simultaneously.`,
          severity: 'medium',
          actionText: 'Open Skill Directory',
          action: () => { window.location.href = 'skill-mapping.html'; }
        });
      }
    });

    // Rule 4: At-Risk Projects (Active projects due in <= 20 days with < 50% deliverables done)
    projects.forEach(p => {
      if (p.status === 'completed') return;
      const linked = tasks.filter(t => (p.linkedTaskIds || []).includes(t.id) || t.projectId === p.id);
      const done = linked.filter(t => t.status === 'completed').length;
      const pct = linked.length > 0 ? (done / linked.length) * 100 : 0;
      const target = new Date(p.targetDate + 'T00:00:00Z');
      const daysUntil = Math.floor((target - now) / (1000 * 60 * 60 * 24));
      if (pct < 50 && daysUntil <= 20 && daysUntil >= 0) {
        insights.push({
          type: 'Timeline Risk',
          headline: `Project at Risk: ${p.name}`,
          explanation: `Due in ${daysUntil} days with only ${Math.round(pct)}% deliverables complete (${done}/${linked.length} tasks).`,
          severity: 'high',
          actionText: 'View Project',
          action: () => window.openProjectDetailModal && window.openProjectDetailModal(p.id)
        });
      }
    });

    // Rule 5: Low Engagement in Current Cycle (Dynamic threshold based on cycle activity average)
    const allApprovedSubs = [...engSubs, ...motSubs].filter(s => s.status === 'approved' && inCurrentCycle(s.date));
    const avgActivities = members.length > 0 ? (allApprovedSubs.length / members.length) : 1;
    const threshold = Math.max(1, Math.floor(avgActivities * 0.5));
    members.forEach(mem => {
      const memSubs = allApprovedSubs.filter(s => s.memberId === mem.id);
      if (memSubs.length < threshold) {
        const cycleLabel = currentCycle ? ` in ${currentCycle.label}` : '';
        insights.push({
          type: 'Engagement Risk',
          headline: `Low Activity: ${mem.name}`,
          explanation: `${mem.name} has logged only ${memSubs.length} approved activities${cycleLabel}, below the team threshold (${threshold}).`,
          severity: 'medium',
          actionText: 'View Engagement',
          action: () => { window.location.href = 'engagement-motivation.html'; }
        });
      }
    });

    // Rule 6: Repeated Zoom Absence in Current Cycle
    const cycleZoomSessions = zoomSessions.filter(z => inCurrentCycle(z.date));
    members.forEach(mem => {
      const absences = cycleZoomSessions.filter(z => (z.attendance?.[mem.id] || 'absent') === 'absent').length;
      if (absences >= 2) {
        const cycleLabel = currentCycle ? ` during ${currentCycle.label}` : '';
        insights.push({
          type: 'Motivation Anomaly',
          headline: `Repeated Sync Absence: ${mem.name}`,
          explanation: `${mem.name} was recorded absent in ${absences} of ${cycleZoomSessions.length} weekly Zoom synchronization calls${cycleLabel}.`,
          severity: 'high',
          actionText: 'View Zoom Roster',
          action: () => { window.location.href = 'engagement-motivation.html'; }
        });
      }
    });

    // Render cards
    container.innerHTML = '';
    if (insights.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:8px; border:1px solid var(--color-border); color:var(--color-text-muted);">No critical operational anomalies detected.</div>`;
    } else {
      insights.forEach(item => {
        const card = document.createElement('div');
        card.className = `insight-card severity-${item.severity}`;
        card.innerHTML = `
          <div class="insight-top"><span class="insight-type-tag">${item.type}</span><span class="status-badge ${item.severity === 'high' ? 'badge-red' : 'badge-orange'}">${item.severity.toUpperCase()}</span></div>
          <div><h3 class="insight-headline">${item.headline}</h3><p class="insight-body" style="margin-top:4px;">${item.explanation}</p></div>
          <div class="insight-footer"><button type="button" class="insight-link">${item.actionText} →</button></div>
        `;
        card.querySelector('.insight-link').onclick = item.action;
        container.appendChild(card);
      });
    }
    if (lastAnalyzedEl) lastAnalyzedEl.textContent = new Date().toLocaleTimeString();
  }

  if (btnReanalyze) {
    btnReanalyze.onclick = () => {
      btnReanalyze.textContent = 'Analyzing...';
      setTimeout(() => { runAnalysis(); btnReanalyze.textContent = 'Re-analyze'; }, 200);
    };
  }

  runAnalysis();
});
