/**
 * Useme Team - KRA & KPI Seed Generator (6-month fluctuating history & 5 pillars)
 */
(function(exports) {
  const { rInt, clamp, rnd } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const CYCLES = [
    { id: 'cycle-mar-2026', label: 'Mar 2026', startDate: '2026-03-01', endDate: '2026-03-31', isCurrent: false },
    { id: 'cycle-apr-2026', label: 'Apr 2026', startDate: '2026-04-01', endDate: '2026-04-30', isCurrent: false },
    { id: 'cycle-may-2026', label: 'May 2026', startDate: '2026-05-01', endDate: '2026-05-31', isCurrent: false },
    { id: 'cycle-jun-2026', label: 'Jun 2026', startDate: '2026-06-01', endDate: '2026-06-30', isCurrent: false },
    { id: 'cycle-jul-2026', label: 'Jul 2026', startDate: '2026-07-01', endDate: '2026-07-31', isCurrent: false },
    { id: 'cycle-aug-2026', label: 'Aug 2026', startDate: '2026-08-01', endDate: '2026-08-31', isCurrent: true }
  ];

  const KRA_PILLARS = [
    { id: 'pillar-growth', name: 'Growth', weight: 25, targetDescription: 'Platform Deliverables & Milestone Output Velocity', order: 1 },
    { id: 'pillar-quality', name: 'Quality', weight: 25, targetDescription: 'Quality Assurance & First-Try Approval Standards', order: 2 },
    { id: 'pillar-timeliness', name: 'Timeliness', weight: 20, targetDescription: 'On-Time Delivery & Schedule Adherence', order: 3 },
    { id: 'pillar-skill', name: 'Skill', weight: 15, targetDescription: 'Competency Mastery & Skill Proficiency Growth', order: 4 },
    { id: 'pillar-compliance', name: 'Compliance', weight: 15, targetDescription: 'Process Adherence & Statutory Standard Execution', order: 5 }
  ];

  function generateKraData(members) {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const kraHistory = {
      months,
      org: [83.2, 85.1, 84.4, 87.8, 86.5, 89.4],
      members: {}
    };

    const kraScores = [];
    const memberActualsByPillar = {
      'Growth': {},
      'Quality': {},
      'Timeliness': {},
      'Skill': {},
      'Compliance': {}
    };

    // Calculate natural fluctuating scores per member
    members.forEach(m => {
      // Base performance level for this member
      let baseline = rInt(68, 92);
      if (m.id === 'm1') baseline = 95;
      else if (m.id === 'm5') baseline = 93;
      else if (m.id === 'm2') baseline = 91;
      else if (m.id === 'm8' || m.id === 'm6') baseline = 68;

      const monthlyHistory = [];
      let currentVal = baseline;

      for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
        // Natural fluctuations: some months up, some down (randomized deltas ±3 to ±12)
        const sign = (rnd() > 0.48) ? 1 : -1;
        const delta = sign * (rInt(3, 12) + (rnd() * 0.8));
        currentVal = clamp(Math.round((currentVal + delta) * 10) / 10, 52, 98);
        monthlyHistory.push(currentVal);

        // Generate detailed pillar scores for the active review cycle (Aug 2026)
        if (monthIdx === months.length - 1) {
          KRA_PILLARS.forEach(pillar => {
            const pDelta = (rnd() > 0.5 ? 1 : -1) * rInt(1, 6);
            const pScore = clamp(Math.round((currentVal + pDelta) * 10) / 10, 50, 99);
            memberActualsByPillar[pillar.name][m.id] = pScore;

            kraScores.push({
              id: `score-${m.id}-${pillar.name.toLowerCase()}`,
              memberId: m.id,
              cycleId: 'cycle-aug-2026',
              pillarId: pillar.id,
              score: pScore,
              notes: `Attainment evaluated against ${pillar.targetDescription}.`,
              enteredBy: 'm1',
              enteredAt: '2026-08-20T10:00:00.000Z'
            });
          });
        }
      }

      kraHistory.members[m.id] = monthlyHistory;

      // Update current cycle KPI and composite score
      const latestScore = monthlyHistory[monthlyHistory.length - 1];
      const penalty = rInt(2, 12);
      m.kpiScore = latestScore;
      m.kriPenalty = penalty;
      m.compositeScore = clamp(Math.round((latestScore - penalty) * 10) / 10, 45, 96);
    });

    // Update member ranks based on compositeScore (#1 to #180)
    const sortedMembers = [...members].sort((a, b) => b.compositeScore - a.compositeScore);
    sortedMembers.forEach((m, idx) => {
      m.rank = `#${idx + 1}`;
    });

    // Generate KRA Objectives
    const kraObjectives = [
      { id: 'kra-1', pillar: 'Growth', ownerId: 'm3', title: 'Platform Deliverables & Milestone Output Velocity', weight: 25, target: 90, orgActual: 89.5, memberActuals: memberActualsByPillar['Growth'] },
      { id: 'kra-2', pillar: 'Quality', ownerId: 'm2', title: 'Quality Assurance & First-Try Approval Standards', weight: 25, target: 90, orgActual: 88.2, memberActuals: memberActualsByPillar['Quality'] },
      { id: 'kra-3', pillar: 'Timeliness', ownerId: 'm1', title: 'On-Time Delivery & Schedule Adherence', weight: 20, target: 95, orgActual: 91.0, memberActuals: memberActualsByPillar['Timeliness'] },
      { id: 'kra-4', pillar: 'Skill', ownerId: 'm5', title: 'Competency Mastery & Skill Proficiency Growth', weight: 15, target: 85, orgActual: 86.4, memberActuals: memberActualsByPillar['Skill'] },
      { id: 'kra-5', pillar: 'Compliance', ownerId: 'm4', title: 'Process Adherence & Statutory Standard Execution', weight: 15, target: 95, orgActual: 93.8, memberActuals: memberActualsByPillar['Compliance'] }
    ];

    return {
      cycles: CYCLES,
      kraPillars: KRA_PILLARS,
      kraObjectives,
      kraHistory,
      kraScores
    };
  }

  exports.SeedKraKpi = { generateKraData };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
