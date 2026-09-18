/**
 * Useme Team - Insights Verification & Recent Activity Feed Seed Generator
 */
(function(exports) {
  const { rInt, pick, REF_DATE, addDays, formatISO } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const ACTIVITY_ACTIONS = [
    { text: 'completed milestone deliverable "PostgreSQL Query Plan Optimization"', type: 'task' },
    { text: 'submitted proof asset for "Mobile Navigation Drawer & Focus Trap"', type: 'task' },
    { text: 'approved deliverable "Monthly GST & Tax Reconciliation"', type: 'task' },
    { text: 'requested revisions on "Packaging Box Die-line Formatting"', type: 'task' },
    { text: 'logged on-ground outreach "Bangalore Tech Summit Booth Demo"', type: 'engagement' },
    { text: 'shared LinkedIn feature spotlight "Next-Gen UPI Soundbox Architecture"', type: 'engagement' },
    { text: 'hosted group talk "Zero-Downtime PostgreSQL Schema Migrations"', type: 'motivation' },
    { text: 'marked Present in "Weekly Strategy & Operations Alignment Zoom Call"', type: 'attendance' },
    { text: 'updated skill proficiency to Expert in "Software Development"', type: 'skill' },
    { text: 'cleared first-pass review for "Direct Selling Tier Commission Engine"', type: 'project' }
  ];

  function generateActivityFeed(members, tasks) {
    const activityLog = [];
    const memberIds = members.map(m => m.id);

    // Generate 60 recent activities spanning the last 3 days
    for (let i = 1; i <= 60; i++) {
      const mid = pick(memberIds);
      const action = pick(ACTIVITY_ACTIONS);
      // Minutes offset from reference time (between 5 minutes and 4,320 minutes = 3 days ago)
      const minutesAgo = i * rInt(45, 75);
      const actDate = new Date(REF_DATE.getTime() - minutesAgo * 60000);
      const linkedTask = pick(tasks);

      activityLog.push({
        id: `act-${i}`,
        actorMemberId: mid,
        actionText: action.text,
        timestamp: formatISO(actDate),
        relatedEntityType: action.type,
        relatedEntityId: action.type === 'task' ? linkedTask.id : `ent-${i}`
      });
    }

    // Sort descending by timestamp (most recent first)
    activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return activityLog;
  }

  // Self-diagnostic verification function to ensure insights triggers are guaranteed
  function verifyInsightsData(data) {
    const now = REF_DATE;
    const tasks = data.tasks || [];
    const members = data.members || [];
    const projects = data.projects || [];
    const currentCycle = data.cycles?.find(c => c.isCurrent) || { startDate: '2026-08-01', endDate: '2026-08-31' };

    let stuckHigh = 0, stuckMed = 0;
    tasks.forEach(t => {
      if (['completed', 'cancelled'].includes(t.status)) return;
      const history = t.statusHistory || [];
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        const lastDate = new Date(lastEntry.timestamp.replace(' ', 'T') + ':00Z');
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 5) stuckHigh++;
        else if (diffDays >= 4) stuckMed++;
      }
    });

    const reworkMap = new Map();
    tasks.forEach(t => {
      if (t.status === 'reworkNeeded') (t.assignedTo || []).forEach(mid => reworkMap.set(mid, (reworkMap.get(mid) || 0) + 1));
    });
    let reworkClusters = 0;
    reworkMap.forEach(count => { if (count >= 2) reworkClusters++; });

    let atRiskProjects = 0;
    projects.forEach(p => {
      if (p.status === 'completed') return;
      const linked = tasks.filter(t => (p.linkedTaskIds || []).includes(t.id) || t.projectId === p.id);
      const done = linked.filter(t => t.status === 'completed').length;
      const pct = linked.length > 0 ? (done / linked.length) * 100 : 0;
      const target = new Date(p.targetDate + 'T00:00:00Z');
      const daysUntil = Math.floor((target - now) / (1000 * 60 * 60 * 24));
      if (pct < 50 && daysUntil <= 20 && daysUntil >= 0) atRiskProjects++;
    });

    return {
      stuckHigh,
      stuckMed,
      reworkClusters,
      atRiskProjects
    };
  }

  exports.SeedInsightsActivity = {
    generateActivityFeed,
    verifyInsightsData
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
