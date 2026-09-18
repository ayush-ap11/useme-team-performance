/**
 * Useme Team - Team Members Seed Generator (180 records across hierarchy)
 */
(function(exports) {
  const { rInt, pick, FIRST_NAMES, LAST_NAMES, CITIES, DEPARTMENTS, sha256 } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  function generateMembers() {
    const defaultPasswordHash = sha256('Useme@2026');

    // 1. Core 12 members preserved with their existing credentials & roles
    const members = [
      { id: 'm1', name: 'Aditya Sharma', username: 'aditya.sharma', passwordHash: '10ea7bafc95f4947ebd22bacb811d004c32b3cf895c9b809d9b6a68d0e992455', email: 'aditya@useme.in', role: 'Director / Operations Head', department: 'Executive', band: 'L7 - Director', location: 'Bangalore, IN', startDate: '2023-01-15', reportsTo: null, avatar: 'AS', activeTasks: 3, joinedDate: 'Jan 2023', skills: ['Operations', 'Strategy'], skillCategory: 'finance', proficiency: 'Expert', verified: true, rank: '#1', kpiScore: 96, kriPenalty: 2, compositeScore: 94, isActive: true, directReportIds: [] },
      { id: 'm2', name: 'Rohan Verma', username: 'rohan.verma', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'rohan@useme.in', role: 'Lead Architect & Tech Lead', department: 'Engineering', band: 'L6 - Principal Lead', location: 'Bangalore, IN', startDate: '2023-03-01', reportsTo: 'm1', avatar: 'RV', activeTasks: 5, joinedDate: 'Mar 2023', skills: ['System Design', 'Cloud'], skillCategory: 'dev', proficiency: 'Expert', verified: true, rank: '#2', kpiScore: 94, kriPenalty: 4, compositeScore: 90, isActive: true, directReportIds: [] },
      { id: 'm3', name: 'Priya Iyer', username: 'priya.iyer', passwordHash: '4c61e332caae39b2843e2f0d3a957937df80a72bde88cf1183c440832b3c0d77', email: 'priya@useme.in', role: 'Head of Growth & Marketing', department: 'Growth & Marketing', band: 'L6 - Head of Growth', location: 'Mumbai, IN', startDate: '2023-02-15', reportsTo: 'm1', avatar: 'PI', activeTasks: 4, joinedDate: 'Feb 2023', skills: ['Growth', 'Analytics'], skillCategory: 'marketing', proficiency: 'Expert', verified: true, rank: '#4', kpiScore: 89, kriPenalty: 5, compositeScore: 84, isActive: true, directReportIds: [] },
      { id: 'm4', name: 'Sneha Patel', username: 'sneha.patel', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'sneha@useme.in', role: 'Finance & Compliance Manager', department: 'Finance & Operations', band: 'L5 - Manager', location: 'Bangalore, IN', startDate: '2023-04-10', reportsTo: 'm1', avatar: 'SP', activeTasks: 2, joinedDate: 'Apr 2023', skills: ['Taxation', 'GST'], skillCategory: 'finance', proficiency: 'Expert', verified: true, rank: '#6', kpiScore: 84, kriPenalty: 8, compositeScore: 76, isActive: true, directReportIds: [] },
      { id: 'm5', name: 'Rahul Sen', username: 'rahul.sen', passwordHash: '5b2f85db447f09e23440a3b4a9105ea0c04157fa44789baa4dbd4d750ab307f2', email: 'rahul@useme.in', role: 'Senior Fullstack Engineer', department: 'Engineering', band: 'L5 - Senior Staff', location: 'Bangalore, IN', startDate: '2023-06-01', reportsTo: 'm2', avatar: 'RS', activeTasks: 5, joinedDate: 'Jun 2023', skills: ['TypeScript', 'Node.js', 'PostgreSQL'], skillCategory: 'dev', proficiency: 'Expert', verified: true, rank: '#3', kpiScore: 92, kriPenalty: 3, compositeScore: 89, isActive: true, directReportIds: [] },
      { id: 'm6', name: 'Ananya Roy', username: 'ananya.roy', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'ananya@useme.in', role: 'Junior Frontend Developer', department: 'Engineering', band: 'L3 - Junior Specialist', location: 'Remote (Kolkata)', startDate: '2023-10-15', reportsTo: 'm5', avatar: 'AR', activeTasks: 3, joinedDate: 'Oct 2023', skills: ['HTML/CSS', 'JS'], skillCategory: 'dev', proficiency: 'Beginner', verified: false, rank: '#10', kpiScore: 74, kriPenalty: 12, compositeScore: 62, isActive: true, directReportIds: [] },
      { id: 'm7', name: 'Vikram Mehta', username: 'vikram.mehta', passwordHash: 'cc62dd9df284cd3de126641f776171dad3b33e9cff1b99db8dd2cc7c268a5844', email: 'vikram@useme.in', role: 'Data & BI Analyst', department: 'Data & Analytics', band: 'L4 - Mid Specialist', location: 'Bangalore, IN', startDate: '2023-08-01', reportsTo: 'm2', avatar: 'VM', activeTasks: 3, joinedDate: 'Aug 2023', skills: ['SQL', 'Python'], skillCategory: 'data', proficiency: 'Intermediate', verified: true, rank: '#7', kpiScore: 82, kriPenalty: 6, compositeScore: 76, isActive: true, directReportIds: [] },
      { id: 'm8', name: 'Kavita Joshi', username: 'kavita.joshi', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'kavita@useme.in', role: 'Junior Data Associate', department: 'Data & Analytics', band: 'L3 - Junior Associate', location: 'Remote (Pune)', startDate: '2023-11-20', reportsTo: 'm7', avatar: 'KJ', activeTasks: 2, joinedDate: 'Nov 2023', skills: ['Data Cleaning', 'SQL'], skillCategory: 'data', proficiency: 'Beginner', verified: false, rank: '#12', kpiScore: 68, kriPenalty: 16, compositeScore: 52, isActive: true, directReportIds: [] },
      { id: 'm9', name: 'Karan Malhotra', username: 'karan.malhotra', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'karan@useme.in', role: 'Lead UI/UX & Print Designer', department: 'Product & Design', band: 'L5 - Design Lead', location: 'Mumbai, IN', startDate: '2023-05-12', reportsTo: 'm3', avatar: 'KM', activeTasks: 3, joinedDate: 'May 2023', skills: ['Figma', 'Print'], skillCategory: 'design', proficiency: 'Expert', verified: true, rank: '#5', kpiScore: 86, kriPenalty: 14, compositeScore: 72, isActive: true, directReportIds: [] },
      { id: 'm10', name: 'Neha Kapoor', username: 'neha.kapoor', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'neha@useme.in', role: 'Visual Designer', department: 'Product & Design', band: 'L4 - Visual Specialist', location: 'Bangalore, IN', startDate: '2023-09-01', reportsTo: 'm9', avatar: 'NK', activeTasks: 2, joinedDate: 'Sep 2023', skills: ['Illustrations', 'Print'], skillCategory: 'design', proficiency: 'Intermediate', verified: false, rank: '#9', kpiScore: 76, kriPenalty: 11, compositeScore: 65, isActive: true, directReportIds: [] },
      { id: 'm11', name: 'Amitabh Sen', username: 'amitabh.sen', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'amitabh@useme.in', role: 'Digital Marketing Specialist', department: 'Growth & Marketing', band: 'L4 - Digital Specialist', location: 'Bangalore, IN', startDate: '2023-07-15', reportsTo: 'm3', avatar: 'AS', activeTasks: 3, joinedDate: 'Jul 2023', skills: ['Ads', 'Strategy'], skillCategory: 'marketing', proficiency: 'Intermediate', verified: true, rank: '#8', kpiScore: 80, kriPenalty: 7, compositeScore: 73, isActive: true, directReportIds: [] },
      { id: 'm12', name: 'Tanya Das', username: 'tanya.das', passwordHash: '051344c20f1b118b100587dc29ab0fd3d505bc3dcdbdfddda30f2e631ed03aa7', email: 'tanya@useme.in', role: 'Technical Support Lead', department: 'Customer Support', band: 'L5 - Support Lead', location: 'Bangalore, IN', startDate: '2023-05-20', reportsTo: 'm2', avatar: 'TD', activeTasks: 4, joinedDate: 'May 2023', skills: ['Troubleshooting'], skillCategory: 'support', proficiency: 'Expert', verified: true, rank: '#11', kpiScore: 72, kriPenalty: 9, compositeScore: 63, isActive: true, directReportIds: [] }
    ];

    // Functional roles by department
    const ROLES_BY_DEPT = {
      'Engineering': [
        { role: 'Senior Backend Engineer', band: 'L5 - Senior Staff', cat: 'dev' },
        { role: 'Frontend Architect', band: 'L5 - Senior Staff', cat: 'dev' },
        { role: 'Payment Gateway Integration Engineer', band: 'L4 - Specialist', cat: 'dev' },
        { role: 'DevOps & Site Reliability Engineer', band: 'L4 - Specialist', cat: 'dev' },
        { role: 'API Infrastructure Engineer', band: 'L4 - Specialist', cat: 'dev' },
        { role: 'QA & Test Automation Specialist', band: 'L3 - Specialist', cat: 'dev' },
        { role: 'Junior Software Engineer', band: 'L2 - Junior Associate', cat: 'dev' }
      ],
      'Growth & Marketing': [
        { role: 'Regional Growth Manager', band: 'L5 - Senior Staff', cat: 'marketing' },
        { role: 'Performance Advertising Lead', band: 'L5 - Senior Staff', cat: 'marketing' },
        { role: 'Merchant Acquisition Specialist', band: 'L4 - Specialist', cat: 'marketing' },
        { role: 'Affiliate Network Specialist', band: 'L4 - Specialist', cat: 'marketing' },
        { role: 'Content & Brand Strategist', band: 'L3 - Specialist', cat: 'marketing' },
        { role: 'Growth Marketing Associate', band: 'L2 - Junior Associate', cat: 'marketing' }
      ],
      'Finance & Operations': [
        { role: 'Senior Financial Controller', band: 'L5 - Senior Staff', cat: 'finance' },
        { role: 'Merchant Settlements Manager', band: 'L5 - Senior Staff', cat: 'finance' },
        { role: 'Tax & GST Compliance Specialist', band: 'L4 - Specialist', cat: 'finance' },
        { role: 'Reconciliation & Payouts Analyst', band: 'L4 - Specialist', cat: 'finance' },
        { role: 'Dispute & Chargeback Specialist', band: 'L3 - Specialist', cat: 'finance' },
        { role: 'Finance Operations Associate', band: 'L2 - Junior Associate', cat: 'finance' }
      ],
      'Data & Analytics': [
        { role: 'Senior Telemetry & BI Architect', band: 'L5 - Senior Staff', cat: 'data' },
        { role: 'Fraud Risk Modeling Specialist', band: 'L4 - Specialist', cat: 'data' },
        { role: 'ETL & Pipeline Engineer', band: 'L4 - Specialist', cat: 'data' },
        { role: 'Analytics Reporting Specialist', band: 'L3 - Specialist', cat: 'data' },
        { role: 'Data Quality Associate', band: 'L2 - Junior Associate', cat: 'data' }
      ],
      'Product & Design': [
        { role: 'Principal UX/UI Designer', band: 'L5 - Senior Staff', cat: 'design' },
        { role: 'Merchant Experience Designer', band: 'L4 - Specialist', cat: 'design' },
        { role: 'Print Packaging & Brand Lead', band: 'L4 - Specialist', cat: 'design' },
        { role: 'Visual & Motion Designer', band: 'L3 - Specialist', cat: 'design' },
        { role: 'Junior Product Designer', band: 'L2 - Junior Associate', cat: 'design' }
      ],
      'Customer Support': [
        { role: 'Customer Escalations Manager', band: 'L5 - Senior Staff', cat: 'support' },
        { role: 'Merchant Onboarding Lead', band: 'L4 - Specialist', cat: 'support' },
        { role: 'Tier-2 Technical Support Specialist', band: 'L3 - Specialist', cat: 'support' },
        { role: 'Payment Disputes Resolution Agent', band: 'L3 - Specialist', cat: 'support' },
        { role: 'Support Operations Associate', band: 'L2 - Junior Associate', cat: 'support' }
      ]
    };

    // Intermediate Managers to anchor the reporting layers
    const tierManagers = [
      { id: 'm13', name: 'Rajesh Singhania', role: 'Engineering Manager (Core Services)', dept: 'Engineering', mgr: 'm2', cat: 'dev' },
      { id: 'm14', name: 'Sunita Deshmukh', role: 'Engineering Manager (Merchant APIs)', dept: 'Engineering', mgr: 'm2', cat: 'dev' },
      { id: 'm15', name: 'Karthik Swaminathan', role: 'Growth Operations Manager', dept: 'Growth & Marketing', mgr: 'm3', cat: 'marketing' },
      { id: 'm16', name: 'Swati Chauhan', role: 'Merchant Alliances Lead', dept: 'Growth & Marketing', mgr: 'm3', cat: 'marketing' },
      { id: 'm17', name: 'Abhishek Pandey', role: 'Senior Treasury & Audit Lead', dept: 'Finance & Operations', mgr: 'm4', cat: 'finance' },
      { id: 'm18', name: 'Monika Agarwal', role: 'Merchant Settlements Lead', dept: 'Finance & Operations', mgr: 'm4', cat: 'finance' },
      { id: 'm19', name: 'Mohit Kashyap', role: 'Data Engineering Lead', dept: 'Data & Analytics', mgr: 'm7', cat: 'data' },
      { id: 'm20', name: 'Preeti Pillai', role: 'Merchant Experience Lead', dept: 'Product & Design', mgr: 'm9', cat: 'design' },
      { id: 'm21', name: 'Deepak Choudhury', role: 'Customer Success Operations Lead', dept: 'Customer Support', mgr: 'm12', cat: 'support' }
    ];

    tierManagers.forEach(tm => {
      const parts = tm.name.split(' ');
      const username = `${parts[0].toLowerCase()}.${parts[1].toLowerCase()}`;
      members.push({
        id: tm.id, name: tm.name, username, passwordHash: defaultPasswordHash,
        email: `${username}@useme.in`, role: tm.role, department: tm.dept,
        band: 'L5 - Manager', location: pick(CITIES), startDate: `2023-0${rInt(2, 9)}-15`,
        reportsTo: tm.mgr, avatar: (parts[0][0] + parts[1][0]).toUpperCase(),
        activeTasks: rInt(2, 5), joinedDate: `2023`, skills: [tm.cat.toUpperCase(), 'Leadership'],
        skillCategory: tm.cat, proficiency: 'Expert', verified: true, rank: `#${members.length + 1}`,
        kpiScore: rInt(80, 92), kriPenalty: rInt(3, 8), compositeScore: rInt(75, 89),
        isActive: true, directReportIds: []
      });
    });

    // Pool of reporting managers (Level 2 & 3 managers)
    const activeManagers = members.filter(m => ['m2', 'm3', 'm4', 'm5', 'm7', 'm9', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19', 'm20', 'm21'].includes(m.id));

    // Generate members m22 through m180 (total 180 members)
    const usedUsernames = new Set(members.map(m => m.username));
    for (let i = 22; i <= 180; i++) {
      const fName = pick(FIRST_NAMES);
      const lName = pick(LAST_NAMES);
      const name = `${fName} ${lName}`;
      let unameBase = `${fName.toLowerCase()}.${lName.toLowerCase()}`;
      let username = unameBase;
      let counter = 1;
      while (usedUsernames.has(username)) {
        username = `${unameBase}${counter++}`;
      }
      usedUsernames.add(username);

      const mgr = pick(activeManagers);
      const dept = mgr.department || 'Engineering';
      const roleTemplates = ROLES_BY_DEPT[dept] || ROLES_BY_DEPT['Engineering'];
      const rObj = pick(roleTemplates);
      const startYear = rInt(2023, 2025);
      const startMonth = String(rInt(1, 12)).padStart(2, '0');
      const startDay = String(rInt(1, 28)).padStart(2, '0');

      members.push({
        id: `m${i}`,
        name,
        username,
        passwordHash: defaultPasswordHash,
        email: `${username}@useme.in`,
        role: rObj.role,
        department: dept,
        band: rObj.band,
        location: pick(CITIES),
        startDate: `${startYear}-${startMonth}-${startDay}`,
        joinedDate: `${startMonth}/${startYear}`,
        reportsTo: mgr.id,
        avatar: (fName[0] + lName[0]).toUpperCase(),
        activeTasks: rInt(1, 6),
        skills: [rObj.cat],
        skillCategory: rObj.cat,
        proficiency: pick(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
        verified: rInt(0, 10) > 2,
        rank: `#${i}`,
        kpiScore: rInt(60, 95),
        kriPenalty: rInt(2, 15),
        compositeScore: rInt(55, 92),
        isActive: true,
        directReportIds: []
      });
    }

    // Populate directReportIds on all manager records for referential hierarchy
    const memberMap = new Map(members.map(m => [m.id, m]));
    members.forEach(m => {
      if (m.reportsTo && memberMap.has(m.reportsTo)) {
        memberMap.get(m.reportsTo).directReportIds.push(m.id);
      }
    });

    return members;
  }

  exports.SeedMembers = { generateMembers };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
