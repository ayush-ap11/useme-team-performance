/**
 * Useme Team - Engagement & Motivation Seed Generator (400 outreach, 65 Zoom sessions, 80 group talks/micro-events)
 */
(function(exports) {
  const { rInt, pick, REF_DATE, addDays, formatDate, rnd } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const ACTIVITY_TYPES = [
    { id: 'social', label: 'Social Media', category: 'outreach', pointValue: 2, requiresProof: true },
    { id: 'onGround', label: 'On-Ground Visit', category: 'outreach', pointValue: 5, requiresProof: true },
    { id: 'whatsapp', label: 'WhatsApp Group', category: 'outreach', pointValue: 2, requiresProof: false },
    { id: 'offlineAds', label: 'Offline / Print Ad', category: 'outreach', pointValue: 4, requiresProof: true },
    { id: 'socialAds', label: 'Social Media Ads', category: 'outreach', pointValue: 3, requiresProof: true },
    { id: 'groupTalk', label: 'Group Talk', category: 'motivation', pointValue: 4, requiresProof: true },
    { id: 'microEvent', label: 'Micro Event', category: 'motivation', pointValue: 5, requiresProof: true }
  ];

  const OUTREACH_TOPICS = [
    'LinkedIn Platform Feature Spotlight Post',
    'Bangalore Tech Summit Booth & Live Demo Relay',
    'Q3 Developer Community Growth Discussion',
    'Metro Station Billboard Print Placement Inspection',
    'Instagram Paid Conversion Sprint Campaign',
    'X/Twitter Dev Changelog Thread',
    'Engineering Blog: Scaling High-Concurrency KPI Aggregations',
    'Internal Frontend Guild Weekly Code Review & Async Mentorship',
    'Q3 Campus Dev Hiring Campaign & Technical Challenge Ad',
    'Tier-2 City Merchant Network Local Meetup',
    'WhatsApp Business Soundbox Demo Broadcast',
    'Merchant KYC Assistance Camp Bangalore South',
    'E-Commerce Partner Onboarding Webinar Promotion'
  ];

  const MOTIVATION_TOPICS = [
    'Design Thinking & Agile Collaboration Talk',
    'Interactive Hands-on Lab: TypeScript AST & Custom Lint Rules',
    'UI Typography & Brand Consistency Workshop',
    'Data Analytics Basics for Support Team',
    'Tech Architecture Deep Dive: Zero-Downtime PostgreSQL Migrations',
    'Merchant Objections Handling & Sales Psychology',
    'Direct Selling Compensation Model Mastery',
    'Modern Responsive Web Performance & CWV Optimization'
  ];

  const ZOOM_TOPICS = [
    'Weekly Strategy & Operations Alignment',
    'Mid-Sprint Architectural Sync',
    'Monthly All-Hands & KRA Kickoff',
    'Bi-Weekly Merchant Onboarding Review',
    'Product Demo & Design System Sync',
    'Security & RBI Compliance Check-in'
  ];

  function generateEngagementData(members) {
    const memberIds = members.map(m => m.id);

    // 1. Generate 400 Engagement Submissions (Outreach)
    const engagementSubmissions = [];
    for (let i = 1; i <= 400; i++) {
      const mid = pick(memberIds);
      const typeObj = pick(ACTIVITY_TYPES.filter(a => a.category === 'outreach'));
      const baseTopic = pick(OUTREACH_TOPICS);
      const dayOffset = rInt(-160, 0);
      const dateStr = formatDate(addDays(REF_DATE, dayOffset));

      const statusRoll = rInt(1, 100);
      const status = statusRoll < 75 ? 'approved' : (statusRoll < 90 ? 'pending' : 'reworkNeeded');

      const isUrl = typeObj.id === 'social' || typeObj.id === 'socialAds' || rnd() > 0.5;
      const proofType = isUrl ? 'url' : 'file';
      const proofValue = isUrl ? `https://useme.in/proof/${typeObj.id}/${i}` : `proof_asset_${i}.jpg`;

      engagementSubmissions.push({
        id: `eng-${i}`,
        memberId: mid,
        type: typeObj.id,
        title: `${baseTopic} (#${i})`,
        date: dateStr,
        proofType,
        proofValue,
        status
      });
    }

    // 2. Generate 80 Motivation Submissions (Group Talks & Micro Events)
    const motivationSubmissions = [];
    for (let i = 1; i <= 80; i++) {
      const mid = pick(memberIds);
      const type = rnd() > 0.5 ? 'groupTalk' : 'microEvent';
      const topic = pick(MOTIVATION_TOPICS);
      const dayOffset = rInt(-150, 0);
      const dateStr = formatDate(addDays(REF_DATE, dayOffset));

      const statusRoll = rInt(1, 100);
      const status = statusRoll < 75 ? 'approved' : (statusRoll < 90 ? 'pending' : 'reworkNeeded');

      motivationSubmissions.push({
        id: `mot-${i}`,
        memberId: mid,
        type,
        title: `${topic} (Session #${i})`,
        date: dateStr,
        proofType: 'url',
        proofValue: `https://youtube.com/watch?v=mot-${i}`,
        status
      });
    }

    // 3. Generate 65 Zoom Sessions spanning past 6 months
    const zoomSessions = [];
    for (let i = 1; i <= 65; i++) {
      const topic = pick(ZOOM_TOPICS);
      const dayOffset = -((65 - i) * 2.5); // Spread across ~160 days
      const dateStr = formatDate(addDays(REF_DATE, Math.floor(dayOffset)));
      const time = pick(['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM']);

      const attendance = {};
      memberIds.forEach(mid => {
        // Specific members with intentional absences to trigger Insight Rule 6 (m8, m6)
        if ((mid === 'm8' || mid === 'm6') && dayOffset >= -25) {
          attendance[mid] = rnd() > 0.3 ? 'absent' : 'late';
        } else {
          const r = rnd();
          attendance[mid] = r < 0.78 ? 'present' : (r < 0.92 ? 'late' : 'absent');
        }
      });

      zoomSessions.push({
        id: `z${i}`,
        title: `${topic} #${i}`,
        date: dateStr,
        time,
        attendance
      });
    }

    return {
      activityTypes: ACTIVITY_TYPES,
      engagementSubmissions,
      motivationSubmissions,
      zoomSessions
    };
  }

  exports.SeedEngagement = { generateEngagementData };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
