/**
 * Useme Team - Projects Seed Generator (100 records with realistic progress & member assignments)
 */
(function(exports) {
  const { rInt, pick, pickMultiple, REF_DATE, addDays, formatDate } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const PROJECT_THEMES = [
    { name: 'V2 Analytics & Platform Core', desc: 'High-throughput KPI calculation engine, connection pool tuning, and telemetry indexing.' },
    { name: 'Design System & UI Refresh', desc: 'Accessible components, token architecture, WCAG focus trapping, and mobile drawer navigation.' },
    { name: 'Q3 Financial Compliance & Tax', desc: 'Statutory GST audits, reconciliation, and ledger closing.' },
    { name: 'Help Desk 2.0 Customer Portal', desc: 'Unified customer self-service center with markdown docs.' },
    { name: 'UPI Soundbox 4G Firmware Sync', desc: 'Embedded audio notification firmware for instant merchant transaction voice alerts.' },
    { name: 'Direct Selling Tier Commission Engine', desc: 'Automated multi-level distributor payout calculation and instant IMPS wallet disbursements.' },
    { name: 'Dynamic Fraud Velocity Rules', desc: 'Sliding-window IP and device fingerprint rate limiting to prevent carding and credential stuffing.' },
    { name: 'Merchant QR Onboarding Express', desc: 'Instant paperless KYC OCR extraction and bank verification for tier-2/tier-3 merchants.' },
    { name: 'Zero-Downtime Database Migration Pipeline', desc: 'PostgreSQL logical replication and blue-green failover mechanism for transaction ledgers.' },
    { name: 'Vernacular Voice Payment Prompts', desc: 'Voice-assisted UPI payment confirmations in Hindi, Tamil, Telugu, and Kannada.' },
    { name: 'Chargeback & Dispute Arbitration Portal', desc: 'Automated bank evidence bundle compilation and webhook notification handling.' },
    { name: 'Distributor Hierarchy Tree Visualizer', desc: 'Interactive real-time visualizer for downline distributor networks and volume attainment.' },
    { name: 'Merchant Cash Advance Risk Scoring', desc: 'Machine learning model predicting repayment default probability from transaction telemetry.' },
    { name: 'Festive Flash Sale Capacity Scaling', desc: 'Load testing and elastic Kubernetes auto-scaling for 50,000 requests/second burst events.' },
    { name: 'Point-of-Sale Bluetooth Terminal SDK', desc: 'Lightweight Android and iOS SDK for micro-ATM chip and swipe readers.' },
    { name: 'Automated E-Way Bill Reconciliation', desc: 'Syncing transport logistics data with GSTN portal for seamless interstate shipments.' },
    { name: 'Affiliate Growth Referral Loop V3', desc: 'Viral viral merchant referral incentives with instant cashback and loyalty token credits.' },
    { name: 'Customer Sentiment & NPS Telemetry', desc: 'Real-time NLP sentiment extraction from support chat transcripts and app store reviews.' },
    { name: 'Automated Escrow Settlement Batcher', desc: 'Daily midnight bank settlement clearing pipeline with multi-bank fallback routes.' },
    { name: 'Packaging Rebrand & Tamper-Evident QR', desc: 'Secure QR serial codes printed on physical shipments for customer delivery verification.' }
  ];

  const SECONDARY_PREFIXES = ['Regional', 'Enterprise', 'Cloud-Native', 'Automated', 'Global', 'Scalable', 'NextGen', 'Zero-Trust'];
  const SECONDARY_SUFFIXES = ['Rollout', 'Enhancement', 'Migration', 'Optimization', 'Revamp', 'Audit', 'Integration', 'Sprint'];

  function generateProjects(members) {
    const projects = [];
    const memberIds = members.map(m => m.id);

    // Initial 4 projects matching existing test cases
    const initialProjects = [
      { id: 'p1', name: PROJECT_THEMES[0].name, description: PROJECT_THEMES[0].desc, status: 'active', startDate: '2026-07-01', targetDate: '2026-10-15', memberIds: ['m1', 'm2', 'm5', 'm7', 'm8'], progress: 68, linkedTaskIds: [] },
      { id: 'p2', name: PROJECT_THEMES[1].name, description: PROJECT_THEMES[1].desc, status: 'active', startDate: '2026-08-01', targetDate: '2026-09-10', memberIds: ['m2', 'm5', 'm6', 'm9'], progress: 75, linkedTaskIds: [] },
      { id: 'p3', name: PROJECT_THEMES[2].name, description: PROJECT_THEMES[2].desc, status: 'onHold', startDate: '2026-07-15', targetDate: '2026-08-31', memberIds: ['m1', 'm4'], progress: 40, linkedTaskIds: [] },
      { id: 'p4', name: PROJECT_THEMES[3].name, description: PROJECT_THEMES[3].desc, status: 'completed', startDate: '2026-06-01', targetDate: '2026-08-24', memberIds: ['m2', 'm12'], progress: 100, linkedTaskIds: [] }
    ];
    projects.push(...initialProjects);

    // Generate up to 100 projects
    for (let i = 5; i <= 100; i++) {
      let name, desc;
      if (i - 1 < PROJECT_THEMES.length) {
        name = PROJECT_THEMES[i - 1].name;
        desc = PROJECT_THEMES[i - 1].desc;
      } else {
        const base = pick(PROJECT_THEMES);
        const prefix = pick(SECONDARY_PREFIXES);
        const suffix = pick(SECONDARY_SUFFIXES);
        name = `${prefix} ${base.name.split(' ')[0]} ${suffix}`;
        desc = `${base.desc} Tailored for regional scale and partner integrations.`;
      }

      // Generate start & target dates
      const startOffset = rInt(-150, 10);
      const duration = rInt(30, 90);
      const sDate = addDays(REF_DATE, startOffset);
      const tDate = addDays(sDate, duration);

      // Status and progress distribution
      let status, progress;
      const daysUntilDue = Math.floor((tDate - REF_DATE) / 86400000);

      if (daysUntilDue < 0) {
        status = 'completed';
        progress = 100;
      } else if (i === 15 || i === 28 || i === 42) {
        // Intentional at-risk projects due in <= 20 days with < 50% deliverables done (to trigger Insights Rule 4)
        status = 'active';
        progress = rInt(20, 42);
      } else {
        const roll = rInt(1, 100);
        if (roll < 20) {
          status = 'planning';
          progress = 0;
        } else if (roll < 35) {
          status = 'onHold';
          progress = rInt(25, 60);
        } else if (roll < 85) {
          status = 'active';
          progress = rInt(20, 85);
        } else {
          status = 'completed';
          progress = 100;
        }
      }

      const assignedCount = rInt(3, 8);
      const assignedMembers = pickMultiple(memberIds, assignedCount);

      projects.push({
        id: `p${i}`,
        name,
        description: desc,
        status,
        progress,
        startDate: formatDate(sDate),
        targetDate: formatDate(tDate),
        memberIds: assignedMembers,
        linkedTaskIds: []
      });
    }

    return projects;
  }

  exports.SeedProjects = { generateProjects };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
