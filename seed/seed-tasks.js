/**
 * Useme Team - Tasks Seed Generator (1,250 records across all statuses and modules)
 */
(function(exports) {
  const { rInt, pick, pickMultiple, REF_DATE, addDays, formatDate, formatDateTime, SKILL_CATEGORIES } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const TASK_TEMPLATES = [
    { title: 'PostgreSQL Query Plan Optimization & PgBouncer Tuning', skill: 'dev', res: ['PgBouncer Guide', 'Index Blueprint'], ast: ['benchmarks_v2.sql'] },
    { title: 'Responsive Mobile Navigation Drawer & Focus Trap', skill: 'dev', res: ['A11y Spec', 'Drawer Figma'], ast: ['drawer_spec.png'] },
    { title: 'Monthly GST & Tax Reconciliation', skill: 'finance', res: ['Tally Guide', 'Form 3B'], ast: ['gst_q3.xlsx'] },
    { title: 'Marketing Sprint Ad Creatives', skill: 'design', res: ['Brand Guidelines'], ast: ['banner_promo.fig'] },
    { title: 'Customer Sentiment Analysis & NPS Modeling', skill: 'data', res: ['NPS Export'], ast: ['model_nps.py'] },
    { title: 'Knowledge Base Article Migration', skill: 'support', res: ['Zendesk KB'], ast: ['help_articles.zip'] },
    { title: 'Summit Keynote Live Stream AV & WebRTC Ingest Relay', skill: 'support', res: ['OBS Setup'], ast: ['webrtc_topology.pdf'] },
    { title: 'CSS Custom Property Token Modernization & WCAG Contrast Audit', skill: 'dev', res: ['Design Tokens'], ast: ['tokens_v2.css'] },
    { title: 'Brand Identity Typography & Font Licensing Audit', skill: 'design', res: ['Fonts Folder'], ast: ['font_audit.pdf'] },
    { title: 'Packaging Box Die-line Formatting & CMYK Proofing', skill: 'design', res: ['Dieline AI'], ast: ['box_dieline.pdf'] },
    { title: 'Redis API Rate Limiter & Sliding Window Counter', skill: 'dev', res: ['Redis Docs'], ast: ['rate_limiter.ts'] },
    { title: 'Event-Driven WebSocket PubSub Notification Hub', skill: 'dev', res: ['WebSocket RFC'], ast: ['pubsub_arch.ts'] },
    { title: 'Merchant QR Soundbox Audio Firmware Payload Validation', skill: 'dev', res: ['ESP32 Specs'], ast: ['firmware_v14.bin'] },
    { title: 'Distributor Multi-Tier Commission Ledger Engine', skill: 'finance', res: ['Payout Rules'], ast: ['commission_calc.py'] },
    { title: 'Carding Velocity Rules & Fraud Fingerprint Heuristics', skill: 'data', res: ['Fraud Dataset'], ast: ['fraud_rules.json'] },
    { title: 'Instant KYC Aadhaar/PAN OCR Extraction Microservice', skill: 'dev', res: ['OCR Models'], ast: ['ocr_benchmark.pdf'] },
    { title: 'Zero-Downtime Database Failover Drill & Replication Check', skill: 'dev', res: ['Patroni Docs'], ast: ['failover_drill.log'] },
    { title: 'Vernacular Audio Audio Asset Library Assembly (Telugu & Tamil)', skill: 'design', res: ['Audio Guidelines'], ast: ['voice_pack_v1.zip'] },
    { title: 'Bank Webhook Reconciliation Engine & Idempotency Filter', skill: 'dev', res: ['Webhook Spec'], ast: ['webhook_handler.ts'] },
    { title: 'Quarterly Vendor TDS & Statutory Compliance Deductions', skill: 'finance', res: ['Tax Guidelines'], ast: ['tds_returns_q2.xlsx'] },
    { title: 'Merchant App Onboarding Dropoff Telemetry Funnel', skill: 'data', res: ['Clickstream DB'], ast: ['funnel_analysis.ipynb'] },
    { title: 'Dispute Chargeback Bank Evidence Dossier Generator', skill: 'support', res: ['Arbitration Spec'], ast: ['dispute_packet.pdf'] },
    { title: 'Distributor Downline Hierarchy Tree Real-Time Query Cache', skill: 'dev', res: ['Graph DB Schema'], ast: ['hierarchy_cache.rs'] },
    { title: 'Tamper-Evident Security Seal Label Packaging Graphics', skill: 'design', res: ['Packaging Spec'], ast: ['seal_vector.ai'] },
    { title: 'WhatsApp Business API Template Message Verification', skill: 'marketing', res: ['Meta API Guidelines'], ast: ['wa_templates.json'] },
    { title: 'Payment Gateway Dynamic Routing & Success Rate Optimizer', skill: 'dev', res: ['Bank Latency API'], ast: ['routing_engine.go'] },
    { title: 'High-Volume Merchant Settlements Midnight Batch Pipeline', skill: 'finance', res: ['IMPS Batch Specs'], ast: ['settlement_cron.ts'] },
    { title: 'Tier-2 Merchant Digital Adoption Social Video Reel', skill: 'marketing', res: ['Video Script'], ast: ['merchant_reel_v1.mp4'] }
  ];

  const STATUSES = ['notStarted', 'inProgress', 'testing', 'awaitingFeedback', 'completed'];

  function generateTasks(members, projects, events) {
    const tasks = [];
    const memberIds = members.map(m => m.id);
    const projectIds = projects.map(p => p.id);
    const eventIds = events.map(e => e.id);

    // Initial 12 tasks matching existing unit tests & references
    const initialTasks = [
      { id: 't1', title: 'PostgreSQL Query Plan Optimization & PgBouncer Tuning', description: 'Analyze slow query logs (>150ms), reconfigure connection pool sizing, and add composite B-Tree indexes on event telemetry partitions.', assignedTo: ['m5', 'm7'], linkedSkill: 'dev', linkedProject: 'V2 Analytics & Platform Core', projectId: 'p1', eventId: null, status: 'inProgress', dueDate: '2026-09-02', resources: ['PgBouncer Guide', 'Index Blueprint'], assets: ['benchmarks_v2.sql'], qualityScore: 8.8, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-18 10:00' }, { status: 'inProgress', timestamp: '2026-08-20 14:30' }] },
      { id: 't2', title: 'Responsive Mobile Navigation Drawer & Focus Trap', description: 'Implement CSS touch gesture dismiss drawer with WCAG 2.1 AA focus trapping for screen readers and keyboard users.', assignedTo: ['m5', 'm6'], linkedSkill: 'dev', linkedProject: 'Design System & UI Refresh', projectId: 'p2', eventId: null, status: 'testing', dueDate: '2026-08-28', resources: ['A11y Spec', 'Drawer Figma'], assets: ['drawer_spec.png'], qualityScore: 9.0, submittedForReview: true, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-18 09:00' }, { status: 'inProgress', timestamp: '2026-08-21 11:00' }, { status: 'testing', timestamp: '2026-08-25 16:45' }] },
      { id: 't3', title: 'Monthly GST & Tax Reconciliation', description: 'Complete Q3 tax audit and sign-off.', assignedTo: ['m4'], linkedSkill: 'finance', linkedProject: 'Q3 Financial Compliance & Tax', projectId: 'p3', eventId: null, status: 'awaitingFeedback', dueDate: '2026-08-30', resources: ['Tally'], assets: ['gst.xlsx'], qualityScore: 8.0, submittedForReview: true, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-15 10:00' }, { status: 'inProgress', timestamp: '2026-08-19 12:00' }, { status: 'awaitingFeedback', timestamp: '2026-08-24 11:15' }] },
      { id: 't4', title: 'Marketing Sprint Ad Creatives', description: 'Design social banners for promo.', assignedTo: ['m9', 'm10'], linkedSkill: 'design', linkedProject: null, projectId: null, eventId: 'e2', status: 'reworkNeeded', dueDate: '2026-09-05', resources: ['Guidelines'], assets: ['banner.fig'], qualityScore: 6.5, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-12 10:00' }, { status: 'inProgress', timestamp: '2026-08-15 15:00' }, { status: 'reworkNeeded', timestamp: '2026-08-22 18:20' }] },
      { id: 't5', title: 'Customer Sentiment Analysis', description: 'Extract NPS records and model sentiments.', assignedTo: ['m7', 'm8'], linkedSkill: 'data', linkedProject: 'V2 Analytics & Platform Core', projectId: 'p1', eventId: null, status: 'inProgress', dueDate: '2026-09-08', resources: ['NPS Export'], assets: ['model.py'], qualityScore: null, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-15 09:30' }, { status: 'inProgress', timestamp: '2026-08-17 10:00' }] },
      { id: 't6', title: 'Knowledge Base Article Migration', description: 'Migrate legacy support guides.', assignedTo: ['m12'], linkedSkill: 'support', linkedProject: 'Help Desk 2.0 Customer Portal', projectId: 'p4', eventId: null, status: 'completed', dueDate: '2026-08-24', resources: ['Zendesk'], assets: ['articles.zip'], qualityScore: 9.8, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-10 10:00' }, { status: 'completed', timestamp: '2026-08-24 15:00' }] },
      { id: 't7', title: 'Summit Keynote Live Stream AV & WebRTC Ingest Relay', description: 'Configure redundant RTMP-to-WebRTC low-latency streaming pipeline and dual audio mixers for the annual leadership summit keynote broadcast.', assignedTo: ['m5', 'm12'], linkedSkill: 'support', linkedProject: null, projectId: null, eventId: 'e1', status: 'completed', dueDate: '2026-08-16', resources: ['AV Checklist', 'OBS Setup'], assets: ['webrtc_topology.pdf'], qualityScore: 9.5, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-08 09:30' }, { status: 'inProgress', timestamp: '2026-08-11 11:00' }, { status: 'completed', timestamp: '2026-08-15 17:30' }] },
      { id: 't8', title: 'CSS Custom Property Token Modernization & WCAG Contrast Audit', description: 'Refactor hardcoded color and spacing values across navigation and modal components to standardized HSL design tokens, validating 4.5:1 contrast ratios.', assignedTo: ['m5'], linkedSkill: 'dev', linkedProject: 'Design System & UI Refresh', projectId: 'p2', eventId: null, status: 'completed', dueDate: '2026-08-22', resources: ['Design Tokens'], assets: ['variables.css'], qualityScore: 9.8, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-17 10:00' }, { status: 'inProgress', timestamp: '2026-08-19 14:00' }, { status: 'completed', timestamp: '2026-08-23 11:15' }] },
      { id: 't9', title: 'Brand Identity Typography Review', description: 'Audit print font licenses and typography guidelines.', assignedTo: ['m9'], linkedSkill: 'design', linkedProject: null, projectId: null, eventId: 'e2', status: 'reworkNeeded', dueDate: '2026-09-08', resources: ['Fonts Folder'], assets: ['audit.pdf'], qualityScore: 5.5, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-14 10:00' }, { status: 'inProgress', timestamp: '2026-08-18 11:00' }, { status: 'reworkNeeded', timestamp: '2026-08-23 15:00' }] },
      { id: 't10', title: 'Packaging Box Die-line Formatting', description: 'Review bleeds and CMYK cuts for physical product boxes.', assignedTo: ['m9', 'm10'], linkedSkill: 'design', linkedProject: null, projectId: null, eventId: 'e2', status: 'testing', dueDate: '2026-09-10', resources: ['Dieline AI'], assets: ['box.pdf'], qualityScore: null, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-12 09:00' }, { status: 'inProgress', timestamp: '2026-08-15 14:00' }, { status: 'testing', timestamp: '2026-08-17 11:00' }] },
      { id: 't11', title: 'Redis API Rate Limiter & OWASP Security Audit', description: 'Implement token-bucket sliding-window rate limiting on public auth endpoints and patch security headers.', assignedTo: ['m5'], linkedSkill: 'dev', linkedProject: 'V2 Analytics & Platform Core', projectId: 'p1', eventId: null, status: 'reworkNeeded', dueDate: '2026-08-19', resources: ['OWASP Guide', 'Redis Docs'], assets: ['security_audit_report.pdf'], qualityScore: 6.0, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-11 10:00' }, { status: 'inProgress', timestamp: '2026-08-14 11:00' }, { status: 'reworkNeeded', timestamp: '2026-08-20 16:30' }] },
      { id: 't12', title: 'Event-Driven WebSocket PubSub Notification Hub', description: 'Design low-latency Redis PubSub worker and draft RFC for pushing real-time KPI milestone notifications to active sessions.', assignedTo: ['m5'], linkedSkill: 'dev', linkedProject: 'V2 Analytics & Platform Core', projectId: 'p1', eventId: null, status: 'inProgress', dueDate: '2026-09-06', resources: ['WebSocket RFC'], assets: ['socket_arch.ts'], qualityScore: null, submittedForReview: false, statusHistory: [{ status: 'notStarted', timestamp: '2026-08-24 09:00' }, { status: 'inProgress', timestamp: '2026-08-25 14:00' }] }
    ];
    tasks.push(...initialTasks);

    const projectMap = new Map(projects.map(p => [p.id, p]));
    const eventMap = new Map(events.map(e => [e.id, e]));

    // Generate up to 1,250 tasks
    for (let i = 13; i <= 1250; i++) {
      const tmpl = pick(TASK_TEMPLATES);
      const title = `${tmpl.title} (Batch #${Math.floor(i / 10) + 1})`;
      const desc = `Detailed production execution: ${tmpl.title} following platform architecture specifications.`;
      
      // Assign 1 to 2 members
      const assigneeCount = rInt(1, 2);
      const assignees = pickMultiple(memberIds, assigneeCount);
      
      // Optional Project link (65% chance) or Event link (15% chance)
      let pId = null, pName = null, evId = null;
      const rollLink = rInt(1, 100);
      if (rollLink <= 65) {
        pId = pick(projectIds);
        pName = projectMap.get(pId)?.name || null;
      } else if (rollLink <= 80) {
        evId = pick(eventIds);
      }

      // Date ranges from -160 days to +60 days
      const dueOffset = rInt(-150, 60);
      const dueDateObj = addDays(REF_DATE, dueOffset);
      const dueDateStr = formatDate(dueDateObj);
      const startOffset = dueOffset - rInt(7, 24);
      const startDateObj = addDays(REF_DATE, startOffset);

      // Status distribution
      let status;
      if (dueOffset < -20) {
        status = rInt(1, 10) > 2 ? 'completed' : 'awaitingFeedback';
      } else if (dueOffset < 0) {
        const r = rInt(1, 100);
        status = r < 50 ? 'completed' : (r < 75 ? 'testing' : 'reworkNeeded');
      } else if (dueOffset < 15) {
        const r = rInt(1, 100);
        status = r < 40 ? 'inProgress' : (r < 70 ? 'testing' : 'awaitingFeedback');
      } else {
        status = rInt(1, 10) > 4 ? 'inProgress' : 'notStarted';
      }

      // Intentional Insight triggers:
      // A few tasks stagnant for >= 5 days
      let lastHistOffset = Math.min(startOffset + rInt(1, 5), -1);
      if (i % 65 === 0 && !['completed', 'cancelled'].includes(status)) {
        lastHistOffset = -rInt(6, 12); // stagnant for > 5 days -> triggers Insight Rule 1 High
      } else if (i % 80 === 0 && !['completed', 'cancelled'].includes(status)) {
        lastHistOffset = -4; // stagnant for 4 days -> triggers Insight Rule 1 Medium
      }

      // Create realistic statusHistory
      const statusHistory = [
        { status: 'notStarted', timestamp: formatDateTime(startDateObj) }
      ];
      if (status !== 'notStarted') {
        const progDate = addDays(REF_DATE, lastHistOffset);
        statusHistory.push({ status: status, timestamp: formatDateTime(progDate) });
      }

      const isSub = ['awaitingFeedback', 'testing', 'completed'].includes(status);
      const qScore = (status === 'completed' || isSub) ? (rInt(75, 99) / 10) : (status === 'reworkNeeded' ? (rInt(50, 68) / 10) : null);

      const taskObj = {
        id: `t${i}`,
        title,
        description: desc,
        assignedTo: assignees,
        linkedSkill: tmpl.skill,
        linkedProject: pName,
        projectId: pId,
        eventId: evId,
        status,
        dueDate: dueDateStr,
        resources: tmpl.res,
        assets: tmpl.ast,
        qualityScore: qScore,
        submittedForReview: isSub,
        statusHistory
      };

      tasks.push(taskObj);

      // Backlink to project & event
      if (pId && projectMap.has(pId)) projectMap.get(pId).linkedTaskIds.push(taskObj.id);
      if (evId && eventMap.has(evId)) eventMap.get(evId).linkedTaskIds.push(taskObj.id);
    }

    return tasks;
  }

  exports.SeedTasks = { generateTasks };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
