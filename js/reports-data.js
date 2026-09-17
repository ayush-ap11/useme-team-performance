/**
 * Useme Team - Reports Data Aggregator (Step 17)
 */
(function() {
  function getDateRange(period) {
    const now = new Date();
    const end = new Date(now.getTime());
    const start = new Date(now.getTime());
    if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setDate(now.getDate() - 30);
    } else if (period === 'quarter') {
      start.setDate(now.getDate() - 90);
    } else {
      start.setDate(now.getDate() - 180);
    }
    return { start, end };
  }

  window.REPORTS_DATA = window.REPORTS_DATA || {};
  window.REPORTS_DATA.getDateRange = getDateRange;

  window.REPORTS_DATA.getMetrics = function(period = 'month') {
    const ds = window.DataStore;
    const tasks = ds ? ds.getTasks() : [];
    const members = ds ? ds.getMembers() : [];
    const { start, end } = getDateRange(period);
    const now = new Date();

    const tasksInPeriod = tasks.filter(t => {
      if (!t.statusHistory || t.statusHistory.length === 0) return true;
      return t.statusHistory.some(h => {
        const d = new Date((h.timestamp || '').replace(' ', 'T'));
        return isNaN(d.getTime()) || (d >= start && d <= end);
      });
    });

    const completed = tasksInPeriod.filter(t => t.status === 'completed').length;
    const rework = tasksInPeriod.filter(t => t.status === 'reworkNeeded').length;
    const overdue = tasksInPeriod.filter(t => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
      const due = new Date(t.dueDate + 'T23:59:59Z');
      return due < now;
    }).length;

    const totalScore = members.reduce((sum, m) => sum + (typeof m.compositeScore === 'number' ? m.compositeScore : 80), 0);
    const avgScore = members.length > 0 ? (totalScore / members.length).toFixed(1) : '85.0';
    const reworkRate = tasksInPeriod.length > 0 ? ((rework / tasksInPeriod.length) * 100).toFixed(1) : '0.0';
    const unverifiedCount = members.filter(m => !m.verified).length;

    const categories = ds && ds.getSkillCategories ? ds.getSkillCategories() : [];
    const profs = ds && ds.getMemberProficiencies ? ds.getMemberProficiencies() : [];
    const skillGaps = categories.map(cat => {
      const catProfs = profs.filter(p => p.categoryId === cat.id);
      const expertCount = catProfs.filter(p => p.level === 'L3' || p.level === 'L4').length;
      const reworkCount = tasksInPeriod.filter(t => t.linkedSkill === cat.id && t.status === 'reworkNeeded').length;
      let gapLevel = 'Low Risk';
      let status = 'Sufficient Coverage';
      if (expertCount <= 1 && reworkCount > 0) {
        gapLevel = `High (${expertCount} lead, ${reworkCount} rework)`;
        status = 'Immediate Review';
      } else if (expertCount <= 1) {
        gapLevel = `High (${expertCount} verified expert)`;
        status = 'Recruiting / Training';
      } else if (reworkCount > 0) {
        gapLevel = `Medium (${reworkCount} in rework)`;
        status = 'Quality Review Pending';
      }
      return {
        skill: cat.name,
        domain: cat.name,
        gapLevel,
        status,
        severity: (expertCount <= 1 ? 3 : 0) + (reworkCount * 2)
      };
    }).sort((a, b) => b.severity - a.severity).slice(0, 3);

    return { completed, avgScore, overdue, reworkRate, rework, skillGaps, unverifiedCount };
  };

  window.REPORTS_DATA.getChartData = function(period = 'month') {
    const ds = window.DataStore;
    const tasks = ds ? ds.getTasks() : [];
    const { start, end } = getDateRange(period);
    const totalDuration = Math.max(1, end.getTime() - start.getTime());
    const binDuration = totalDuration / 4;

    const weeks = [
      { label: 'Week 1', completed: 0, rework: 0, total: 0 },
      { label: 'Week 2', completed: 0, rework: 0, total: 0 },
      { label: 'Week 3', completed: 0, rework: 0, total: 0 },
      { label: 'Week 4 (Current)', completed: 0, rework: 0, total: 0 }
    ];

    tasks.forEach(t => {
      (t.statusHistory || []).forEach(h => {
        const time = new Date((h.timestamp || '').replace(' ', 'T')).getTime();
        if (isNaN(time) || time < start.getTime() || time > end.getTime()) return;

        const binIndex = Math.min(3, Math.floor((time - start.getTime()) / binDuration));
        weeks[binIndex].total++;
        if (h.status === 'completed') weeks[binIndex].completed++;
        if (h.status === 'reworkNeeded') weeks[binIndex].rework++;
      });
    });

    const maxComp = Math.max(...weeks.map(w => w.completed), 1);
    const completedPerWeek = weeks.map(w => ({
      label: w.label,
      count: w.completed,
      heightPct: Math.max(12, Math.round((w.completed / maxComp) * 100))
    }));

    const reworkTrend = weeks.map(w => {
      const rate = w.total > 0 ? Math.round((w.rework / w.total) * 100) : 0;
      return {
        label: w.label,
        rate,
        heightPct: Math.min(100, Math.max(12, rate * 2))
      };
    });

    return { completedPerWeek, reworkTrend };
  };
})();
