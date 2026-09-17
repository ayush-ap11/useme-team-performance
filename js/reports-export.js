/**
 * Useme Team - Reports CSV Exporter (Step 17)
 */
(function() {
  window.REPORTS_DATA = window.REPORTS_DATA || {};

  window.REPORTS_DATA.downloadCSV = function(period = 'month') {
    const ds = window.DataStore;
    const tasks = ds ? ds.getTasks() : [];
    const members = ds ? ds.getMembers() : [];
    const kraScores = ds && ds.getKraScores ? ds.getKraScores() : [];
    const kraPillars = ds && ds.getKraPillars ? ds.getKraPillars() : [];
    const engSubs = ds && ds.getEngagementSubmissions ? ds.getEngagementSubmissions() : [];
    const motSubs = ds && ds.getMotivationSubmissions ? ds.getMotivationSubmissions() : [];

    const getDateRange = window.REPORTS_DATA.getDateRange || function(p) {
      const now = new Date();
      const end = new Date(now.getTime());
      const start = new Date(now.getTime());
      start.setDate(now.getDate() - (p === 'week' ? 7 : (p === 'quarter' ? 90 : 30)));
      return { start, end };
    };

    const { start, end } = getDateRange(period);

    const inPeriodDate = (dStr) => {
      if (!dStr) return true;
      const d = new Date(dStr.replace(' ', 'T'));
      return isNaN(d.getTime()) || (d >= start && d <= end);
    };

    const filteredTasks = tasks.filter(t => inPeriodDate(t.dueDate) || (t.statusHistory || []).some(h => inPeriodDate(h.timestamp)));
    const filteredEng = engSubs.filter(s => inPeriodDate(s.date));
    const filteredMot = motSubs.filter(s => inPeriodDate(s.date));

    let csv = 'Useme Team - Executive Performance Report\r\n';
    csv += `Generated On: ${new Date().toISOString().slice(0, 10)} | Period: ${period.toUpperCase()} (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)})\r\n\r\n`;

    csv += '--- SECTION 1: TEAM MEMBERS PERFORMANCE SCORECARD (PERIOD FILTERED) ---\r\n';
    const pillarNames = kraPillars.map(p => p.name);
    csv += 'Member ID,Full Name,Role,Department,Composite Score,Tasks Completed,Total Tasks Assigned,Completion Rate,Engagement Points,Motivation Points,' + pillarNames.map(p => `KRA Pillar (${p})`).join(',') + '\r\n';

    members.forEach(m => {
      const memberTasks = filteredTasks.filter(t => (t.assignedTo || []).includes(m.id));
      const doneTasks = memberTasks.filter(t => t.status === 'completed').length;
      const taskRate = memberTasks.length > 0 ? Math.round((doneTasks / memberTasks.length) * 100) + '%' : '0%';

      const memEng = filteredEng.filter(e => e.memberId === m.id && e.status === 'approved');
      const engPts = memEng.length * 3;
      const memMot = filteredMot.filter(mo => mo.memberId === m.id && mo.status === 'approved');
      const motPts = memMot.length * 4;

      const pillarScoreMap = {};
      kraScores.filter(s => s.memberId === m.id).forEach(s => {
        const pillar = kraPillars.find(p => p.id === s.pillarId);
        if (pillar) pillarScoreMap[pillar.name] = s.score;
      });

      const pillarVals = pillarNames.map(p => pillarScoreMap[p] !== undefined ? pillarScoreMap[p] : 'N/A');
      const comp = typeof m.compositeScore === 'number' ? m.compositeScore : 80;

      csv += `"${m.id}","${m.name}","${m.role}","${m.department || 'Engineering'}","${comp}","${doneTasks}","${memberTasks.length}","${taskRate}","${engPts}","${motPts}",` + pillarVals.map(v => `"${v}"`).join(',') + '\r\n';
    });

    csv += '\r\n--- SECTION 2: OPERATIONAL TASKS & DELIVERABLES (PERIOD FILTERED) ---\r\n';
    csv += 'Task ID,Title,Linked Skill,Due Date,Status,Quality Score,Assignees\r\n';
    filteredTasks.forEach(t => {
      csv += `"${t.id}","${t.title}","${t.linkedSkill || 'General'}","${t.dueDate || 'N/A'}","${t.status}","${t.qualityScore ?? 'Pending'}","${(t.assignedTo || []).join(';')}"\r\n`;
    });

    csv += '\r\n--- SECTION 3: ENGAGEMENT & MOTIVATION ACTIVITIES (PERIOD FILTERED) ---\r\n';
    csv += 'Submission ID,Member ID,Category,Title,Date,Status\r\n';
    filteredEng.forEach(e => {
      csv += `"${e.id}","${e.memberId}","Outreach","${e.title || 'Activity'}","${e.date || 'N/A'}","${e.status}"\r\n`;
    });
    filteredMot.forEach(mo => {
      csv += `"${mo.id}","${mo.memberId}","Motivation","${mo.title || 'Activity'}","${mo.date || 'N/A'}","${mo.status}"\r\n`;
    });

    // Log admin export action to activity feed
    const currentUser = { id: localStorage.getItem('useme_user_id') || 'm1', role: 'admin' };
    const currentCycle = ds && ds.getCurrentCycle ? ds.getCurrentCycle() : null;
    const periodLabel = currentCycle ? currentCycle.label : period.toUpperCase();
    if (ds && ds.logActivity) {
      ds.logActivity(currentUser.id, `exported team report for ${periodLabel}`, 'report', null);
    }

    // Trigger download in browser environment
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && typeof Blob !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `useme-team-report-${period}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return csv;
  };
})();
