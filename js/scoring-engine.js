/**
 * Useme Team - Unified Scoring Engine (Authoritative Single Source)
 */
(function() {
  const OVERALL_WEIGHTS = { KRA: 0.40, ENGAGEMENT: 0.20, MOTIVATION: 0.20, QUALITY: 0.20 };
  const KRA_WEIGHTS = { growth: 0.25, quality: 0.25, timeliness: 0.20, skill: 0.15, compliance: 0.15 };
  const RAG_THRESHOLDS = { GREEN: 85, AMBER: 60 };
  function getRAG(score) {
    const s = Number(score) || 0;
    if (s >= RAG_THRESHOLDS.GREEN) return { cls: 'rag-green', label: 'On Track', color: 'var(--color-green)' };
    if (s >= RAG_THRESHOLDS.AMBER) return { cls: 'rag-amber', label: 'At Risk', color: 'var(--color-orange)' };
    return { cls: 'rag-red', label: 'Behind', color: 'var(--color-red)' };
  }

  function getSubmissionQualityScore(memberId, cycle) {
    const ds = window.DataStore;
    if (!ds) return 85;
    const tasks = ds.getTasks ? ds.getTasks() : [];
    const memTasks = memberId && memberId !== 'all' ? tasks.filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled') : tasks.filter(t => t.status !== 'cancelled');
    const comp = memTasks.filter(t => t.status === 'completed');
    const firstPass = comp.filter(t => !(t.statusHistory || []).some(h => h.status === 'reworkNeeded')).length;
    const passRate = comp.length > 0 ? (firstPass / comp.length) * 100 : 86.5;
    const rated = comp.filter(t => typeof (t.qualityRating || t.rating) === 'number');
    const avgR = rated.length > 0 ? (rated.reduce((acc, t) => acc + (t.qualityRating || t.rating), 0) / rated.length) : 4.3;
    return Math.round(((passRate * 0.6) + ((avgR / 5) * 100 * 0.4)) * 10) / 10;
  }

  function getKRAScore(memberId, cycle) {
    const ds = window.DataStore;
    if (!ds) return { overall: 85, rag: getRAG(85), pillars: {} };
    const cObj = typeof cycle === 'object' ? cycle : (ds.getCycleById ? ds.getCycleById(cycle) : null);
    const hist = ds.getKraHistory ? ds.getKraHistory() : null;
    let ratio = 1, fixedTarget = null;
    if (cObj && hist?.months?.length) {
      const idx = hist.months.findIndex(m => cObj.label?.toLowerCase().includes(m.toLowerCase()));
      if (idx !== -1) {
        fixedTarget = (!memberId || memberId === 'all') ? (hist.org[idx] ?? 85) : (hist.members?.[memberId]?.[idx] ?? hist.org[idx] ?? 85);
        ratio = fixedTarget / 90.2;
      }
    }
    if (!memberId || memberId === 'all') {
      const mems = ds.getMembers ? ds.getMembers() : [];
      const memScores = mems.map(m => getKRAScore(m.id, cycle));
      const avg = fixedTarget !== null ? Math.round(fixedTarget * 10) / 10 : (memScores.length ? Math.round((memScores.reduce((acc, s) => acc + s.overall, 0) / memScores.length) * 10) / 10 : 85);
      const pillars = ['growth', 'quality', 'timeliness', 'skill', 'compliance'].reduce((acc, k) => {
        const pAvg = Math.round((memScores.reduce((s, item) => s + (item.pillars[k]?.score || 85), 0) / (memScores.length || 1)) * 10) / 10;
        acc[k] = { name: k.charAt(0).toUpperCase() + k.slice(1), weight: KRA_WEIGHTS[k] * 100, score: pAvg, attainment: pAvg, rag: getRAG(pAvg) };
        return acc;
      }, {});
      return { overall: avg, rag: getRAG(avg), pillars };
    }
    const tasks = ds.getTasks ? ds.getTasks().filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled') : [];
    const comp = tasks.filter(t => t.status === 'completed');
    const growth = tasks.length > 0 ? Math.min(100, Math.round((comp.length / tasks.length) * 100)) : 88;
    const quality = getSubmissionQualityScore(memberId, cycle);
    const onTime = comp.filter(t => !t.dueDate || new Date((t.statusHistory?.slice().reverse().find(h => h.status === 'completed')?.timestamp || '').replace(' ', 'T')) <= new Date(t.dueDate + 'T23:59:59')).length;
    const timeliness = comp.length > 0 ? Math.round((onTime / comp.length) * 100) : 85;
    const profs = ds.getMemberProficiencies ? ds.getMemberProficiencies({ memberId }) : [];
    const lvlMap = { Expert: 95, Advanced: 85, Intermediate: 75, Beginner: 65, L4: 95, L3: 85, L2: 75, L1: 65 };
    const skill = profs.length > 0 ? Math.round(profs.reduce((acc, p) => acc + (lvlMap[p.level] || 75), 0) / profs.length) : 82;
    const overdue = tasks.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate + 'T23:59:59') < new Date()).length;
    const rawPillars = { growth, quality, timeliness, skill, compliance: Math.max(50, 100 - (overdue * 5)) };
    const descMap = { growth: 'Platform Deliverables & Milestone Output Velocity', quality: 'Quality Assurance & First-Try Approval Standards', timeliness: 'On-Time Delivery & Schedule Adherence', skill: 'Competency Mastery & Skill Proficiency Growth', compliance: 'Process Adherence & Statutory Standard Execution' };
    const pillars = {};
    let overall = 0;
    Object.keys(KRA_WEIGHTS).forEach(k => {
      const sc = Math.min(100, Math.max(40, Math.round(rawPillars[k] * ratio * 10) / 10));
      pillars[k] = { name: k.charAt(0).toUpperCase() + k.slice(1), weight: KRA_WEIGHTS[k] * 100, score: sc, attainment: sc, rag: getRAG(sc), targetDescription: descMap[k] };
      overall += sc * KRA_WEIGHTS[k];
    });
    overall = fixedTarget !== null ? Math.round(fixedTarget * 10) / 10 : Math.round(overall * 10) / 10;
    return { overall, rag: getRAG(overall), pillars };
  }

  function getEngagementScore(memberId, cycle) {
    const ds = window.DataStore;
    if (!ds) return 80;
    const subs = ds.getEngagementSubmissions ? ds.getEngagementSubmissions() : [];
    const actTypes = ds.getActivityTypes ? ds.getActivityTypes('outreach') : [];
    const typePts = {};
    actTypes.forEach(t => { typePts[t.id] = t.pointValue; });
    const calcPts = (mId) => subs.filter(s => s.memberId === mId && s.status === 'approved').reduce((acc, s) => acc + (typePts[s.type] !== undefined ? typePts[s.type] : 2), 0);
    if (memberId && memberId !== 'all') {
      const target = window.SCORING_TARGETS?.resolveTarget(memberId, 'engagement') || 40;
      return Math.min(100, Math.round((calcPts(memberId) / target) * 100));
    }
    const mems = ds.getMembers ? ds.getMembers() : [];
    const total = mems.reduce((acc, m) => acc + getEngagementScore(m.id, cycle), 0);
    return mems.length ? Math.round(total / mems.length) : 80;
  }

  function getMotivationScore(memberId, cycle) {
    const ds = window.DataStore;
    if (!ds) return 85;
    const sessions = ds.getZoomSessions ? ds.getZoomSessions() : [];
    const talks = ds.getMotivationSubmissions ? ds.getMotivationSubmissions() : [];
    const actTypes = ds.getActivityTypes ? ds.getActivityTypes('motivation') : [];
    const typePts = {};
    actTypes.forEach(t => { typePts[t.id] = t.pointValue; });
    const calcPts = (mId) => {
      const zPts = sessions.reduce((acc, s) => { const a = s.attendanceRecords?.[mId]?.status || s.attendance?.[mId] || 'absent'; return acc + (a === 'present' ? 3 : a === 'late' ? 1 : 0); }, 0);
      const tPts = talks.filter(t => t.memberId === mId && t.status === 'approved').reduce((acc, t) => acc + (typePts[t.type] ?? 4), 0);
      return zPts + tPts;
    };
    if (memberId && memberId !== 'all') {
      const target = window.SCORING_TARGETS?.resolveTarget(memberId, 'motivation') || 40;
      return Math.min(100, Math.round((calcPts(memberId) / target) * 100));
    }
    const mems = ds.getMembers ? ds.getMembers() : [];
    const total = mems.reduce((acc, m) => acc + getMotivationScore(m.id, cycle), 0);
    return mems.length ? Math.round(total / mems.length) : 85;
  }

  function getKRIPenalty(memberId, cycle) {
    const ds = window.DataStore;
    if (!ds || !memberId || memberId === 'all') return 0;
    const tasks = ds.getTasks ? ds.getTasks().filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled') : [];
    const now = new Date();
    return tasks.reduce((pen, t) => {
      let p = pen;
      if (t.dueDate && t.status !== 'completed' && new Date(t.dueDate + 'T23:59:59') < now) p += 3;
      const reworks = (t.statusHistory || []).filter(h => h.status === 'reworkNeeded').length;
      if (reworks > 1) p += 5 * (reworks - 1);
      return t.complianceFlag ? p + 5 : p;
    }, 0);
  }

  function getOverallScore(memberId, cycle) {
    const kra = getKRAScore(memberId, cycle).overall;
    const eng = getEngagementScore(memberId, cycle);
    const mot = getMotivationScore(memberId, cycle);
    const quality = getSubmissionQualityScore(memberId, cycle);
    const penalty = getKRIPenalty(memberId, cycle);
    const raw = (kra * OVERALL_WEIGHTS.KRA) + (eng * OVERALL_WEIGHTS.ENGAGEMENT) + (mot * OVERALL_WEIGHTS.MOTIVATION) + (quality * OVERALL_WEIGHTS.QUALITY) - penalty;
    return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
  }

  window.SCORING_ENGINE = {
    OVERALL_WEIGHTS, KRA_WEIGHTS, RAG_THRESHOLDS, getRAG,
    getKRAScore, getEngagementScore, getMotivationScore, getSubmissionQualityScore, getKRIPenalty, getOverallScore
  };
  window.KPI_ENGINE = Object.assign(window.KPI_ENGINE || {}, {
    calculateEngagementScore: (id) => getEngagementScore(id),
    calculateMotivationScore: (id) => getMotivationScore(id),
    getOverallScore: (id) => getOverallScore(id)
  });
})();
