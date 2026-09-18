/**
 * Useme Team - Auto-Scoring KRA & KPI Engine (Single Source of Authority)
 * 
 * SCORING RECONCILIATION RULE:
 * Members with 0 assigned tasks in the active review cycle retain their legitimate
 * prior compositeScore (and kpiScore / kriPenalty) carried over from their record or
 * prior review cycle, rather than being reset to a generic 80 baseline. When compositeScore
 * is not yet explicitly defined, it is computed once as (kpiScore - kriPenalty).
 * For members with active tasks, compositeScore = netKpi - kriPenalty is computed here
 * and written directly into the member record via DataStore.
 */
(function() {
  const BASE_APPROVAL_POINTS = 10, ON_TIME_BONUS = 5, LATE_PENALTY_PER_DAY = 2, MAX_LATE_PENALTY = 10, REWORK_PENALTY_PER_CYCLE = 3, FIRST_TRY_APPROVAL_BONUS = 5, BASE_STARTING_KPI = 80;
  const ACTIVITY_POINTS = { social: 2, onGround: 5, whatsapp: 2, offlineAds: 4, socialAds: 3, groupTalk: 4, microEvent: 5, zoomPresent: 3, zoomLate: 1, zoomAbsent: 0 };

  function calculateTaskScore(task) {
    if (!task || task.status === 'cancelled') return { kpiPoints: 0, kriPenalty: 0, breakdown: ['Cancelled task: 0 impact'] };
    let kpiPoints = 0, kriPenalty = 0;
    const breakdown = [], isCompleted = task.status === 'completed', history = task.statusHistory || [];
    if (isCompleted) { kpiPoints += BASE_APPROVAL_POINTS; breakdown.push(`Approved task: +${BASE_APPROVAL_POINTS}`); }
    const reworkCount = history.filter(h => h.status === 'reworkNeeded').length;
    if (reworkCount === 0 && isCompleted) { kpiPoints += FIRST_TRY_APPROVAL_BONUS; breakdown.push(`First-try approval: +${FIRST_TRY_APPROVAL_BONUS}`); }
    else if (reworkCount > 0) { const reworkPen = reworkCount * REWORK_PENALTY_PER_CYCLE; kriPenalty += reworkPen; breakdown.push(`Rework penalty: -${reworkPen}`); }
    if (task.dueDate && isCompleted) {
      const doneEntry = [...history].reverse().find(h => h.status === 'completed');
      const compDate = doneEntry ? new Date(doneEntry.timestamp.replace(' ', 'T')) : new Date(), dueDate = new Date(task.dueDate + 'T23:59:59');
      if (compDate <= dueDate) { kpiPoints += ON_TIME_BONUS; breakdown.push(`On-time: +${ON_TIME_BONUS}`); }
      else { const lateDays = Math.max(1, Math.ceil((compDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))); const latePen = Math.min(lateDays * LATE_PENALTY_PER_DAY, MAX_LATE_PENALTY); kriPenalty += latePen; breakdown.push(`Late: -${latePen}`); }
    }
    return { kpiPoints, kriPenalty, breakdown };
  }

  function recalculateMemberScores(memberId) {
    const tasks = window.DataStore ? window.DataStore.getTasks() : [];
    const members = window.DataStore ? window.DataStore.getMembers() : [];
    const member = members.find(m => m.id === memberId);
    if (!member) return null;
    const assignedTasks = tasks.filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled');

    let netKpi, kriPen, compScore;
    if (assignedTasks.length === 0) {
      netKpi = typeof member.kpiScore === 'number' ? member.kpiScore : BASE_STARTING_KPI;
      kriPen = typeof member.kriPenalty === 'number' ? member.kriPenalty : 0;
      compScore = typeof member.compositeScore === 'number' ? member.compositeScore : (netKpi - kriPen);
    } else {
      let earnedKpi = 0;
      kriPen = 0;
      assignedTasks.forEach(t => {
        const res = calculateTaskScore(t);
        earnedKpi += res.kpiPoints;
        kriPen += res.kriPenalty;
      });
      netKpi = BASE_STARTING_KPI + earnedKpi;
      compScore = netKpi - kriPen;
    }

    const scores = {
      kpiScore: netKpi,
      kriPenalty: kriPen,
      compositeScore: compScore,
      engagementScore: calculateEngagementScore(memberId),
      motivationScore: calculateMotivationScore(memberId)
    };
    if (window.DataStore?.updateMemberScores) {
      window.DataStore.updateMemberScores(memberId, scores);
    } else {
      Object.assign(member, scores);
    }
    return scores;
  }

  function calculateEngagementScore(memberId) {
    const subs = window.DataStore ? window.DataStore.getEngagementSubmissions() : [];
    const targetSubs = memberId ? subs.filter(s => s.memberId === memberId && s.status === 'approved') : subs.filter(s => s.status === 'approved');
    const actTypes = window.DataStore ? window.DataStore.getActivityTypes('outreach') : [];
    const typePoints = {};
    actTypes.forEach(t => { typePoints[t.id] = t.pointValue; });
    const pts = targetSubs.reduce((sum, s) => sum + (typePoints[s.type] !== undefined ? typePoints[s.type] : (ACTIVITY_POINTS[s.type] || 2)), 0);
    const totalMemCount = (window.DataStore ? window.DataStore.getMembers() : []).length || 1;
    return memberId ? Math.min(100, Math.round(pts * 12)) : Math.min(100, Math.round((pts / totalMemCount) * 12));
  }

  function calculateMotivationScore(memberId) {
    const sessions = window.DataStore ? window.DataStore.getZoomSessions() : [];
    const talks = window.DataStore ? window.DataStore.getMotivationSubmissions() : [];
    const members = window.DataStore ? window.DataStore.getMembers() : [];
    const actTypes = window.DataStore ? window.DataStore.getActivityTypes('motivation') : [];
    const typePoints = {};
    actTypes.forEach(t => { typePoints[t.id] = t.pointValue; });
    if (memberId) {
      let pts = 0;
      sessions.forEach(s => { const att = s.attendance?.[memberId] || 'absent'; if (att === 'present') pts += 3; else if (att === 'late') pts += 1; });
      talks.filter(t => t.memberId === memberId && t.status === 'approved').forEach(t => {
        pts += (typePoints[t.type] !== undefined ? typePoints[t.type] : (ACTIVITY_POINTS[t.type] || 4));
      });
      return Math.min(100, Math.round(pts * 10));
    }
    let total = 0;
    const count = members.length || 1;
    members.forEach(m => {
      let pts = 0;
      sessions.forEach(s => { const att = s.attendance?.[m.id] || 'absent'; if (att === 'present') pts += 3; else if (att === 'late') pts += 1; });
      talks.filter(t => t.memberId === m.id && t.status === 'approved').forEach(t => {
        pts += (typePoints[t.type] !== undefined ? typePoints[t.type] : (ACTIVITY_POINTS[t.type] || 4));
      });
      total += Math.min(100, Math.round(pts * 10));
    });
    return Math.round(total / count);
  }

  function calculateAttendanceStreak(memberId) {
    const sessions = window.DataStore ? window.DataStore.getZoomSessions() : [];
    let streak = 0;
    for (let i = 0; i < sessions.length; i++) {
      const att = sessions[i].attendance?.[memberId];
      if (att === 'present' || att === 'late') streak++;
      else break;
    }
    return streak;
  }

  function recalculateAllMembers() {
    const mems = window.DataStore ? window.DataStore.getMembers() : [];
    mems.forEach(m => recalculateMemberScores(m.id));
    const updated = window.DataStore ? window.DataStore.getMembers() : [];
    const sorted = [...updated].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
    sorted.forEach((m, idx) => {
      const r = '#' + (idx + 1);
      if (m.rank !== r) {
        if (window.DataStore?.updateMemberScores) window.DataStore.updateMemberScores(m.id, { rank: r });
        else m.rank = r;
      }
    });
  }

  function onTaskStatusChanged(task) {
    if (task?.assignedTo) task.assignedTo.forEach(recalculateMemberScores);
  }

  window.KPI_ENGINE = {
    CONSTANTS: { BASE_APPROVAL_POINTS, ON_TIME_BONUS, LATE_PENALTY_PER_DAY, MAX_LATE_PENALTY, REWORK_PENALTY_PER_CYCLE, FIRST_TRY_APPROVAL_BONUS, ACTIVITY_POINTS },
    calculateTaskScore, recalculateMemberScores, recalculateAllMembers, onTaskStatusChanged,
    calculateEngagementScore, calculateMotivationScore, calculateAttendanceStreak
  };

  // Only run full recalculation on startup if scores are uninitialized
  const _sampleMem = (window.DataStore?.getMembers() || [])[0];
  if (_sampleMem && typeof _sampleMem.compositeScore !== 'number') {
    recalculateAllMembers();
  }
})();
