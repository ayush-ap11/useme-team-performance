/**
 * Useme Team - Deterministic Distributed Hierarchy Seed Generator
 * Weighted distribution (12% 1 report, 60% 3-5, 28% 8-12) & variable tier depths
 */
(function(global) {
  let seed = 3141592;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const rInt = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  function getReportCount() {
    const r = rnd();
    if (r < 0.15) return 1;          // a few get 1 report
    if (r < 0.72) return rInt(2, 5); // most get 2-5 reports
    return rInt(8, 12);              // some get 8-12 reports
  }

  const FIRSTS = [
    'Aarav','Aditi','Amit','Ananya','Arjun','Dev','Diya','Ishaan','Kavya','Manish',
    'Neha','Nikhil','Pooja','Priya','Rahul','Ravi','Rhea','Rohan','Sameer','Sneha',
    'Tanvi','Varun','Vikram','Zara','Kiran','Siddharth','Meera','Tarun','Alok','Deepa',
    'Gaurav','Harsh','Isha','Jatin','Kunal','Maya','Naveen','Pallavi','Pranav','Radhika',
    'Sanjay','Shreya','Sumit','Tanya','Umesh','Vidya','Vivek','Yash','Anil','Bhavna'
  ];
  const LASTS = [
    'Sharma','Verma','Patel','Mehta','Iyer','Nair','Reddy','Rao','Gupta','Joshi',
    'Bhat','Kulkarni','Malhotra','Kapoor','Singh','Das','Sen','Chatterjee','Deshmukh','Chopra',
    'Saxena','Agarwal','Nambiar','Menon','Trivedi','Pandey','Mishra','Dubey','Bose','Ghosh'
  ];
  const LOCATIONS = ['Bangalore, IN', 'Mumbai, IN', 'Delhi, IN', 'Hyderabad, IN', 'Pune, IN'];

  function buildHierarchy() {
    seed = 3141592;
    const emps = [];
    let idCounter = 1;

    const mk = (name, role, mgrId, dept, band, depth) => {
      const parts = name.split(' ');
      const avatar = (parts[0][0] + (parts[1]?.[0] || 'X')).toUpperCase();
      const emp = {
        id: `emp-${idCounter++}`, name, role, avatar, managerId: mgrId, reportsTo: mgrId,
        department: dept, band: band || 'L4 - Specialist', depth, location: pick(LOCATIONS),
        startDate: `202${rInt(1, 4)}-0${rInt(1, 9)}-15`, joinedDate: `Jan 202${rInt(1, 4)}`,
        activeTasks: rInt(1, 6), email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}${idCounter}@useme.team`,
        rank: idCounter, proficiency: pick(['Intermediate', 'Advanced', 'Expert']),
        directReportIds: []
      };
      emps.push(emp);
      return emp;
    };

    const ceo = mk('Vikram Malhotra', 'Chief Executive Officer', null, 'Executive', 'L8 - Executive', 0);

    const dirConfigs = [
      { dept: 'Engineering', role: 'Director of Engineering', levelsBelow: 3, mgrs: [4, 6] },
      { dept: 'Product & Design', role: 'Director of Product', levelsBelow: 2, mgrs: [3, 5] },
      { dept: 'Growth & Marketing', role: 'Director of Growth', levelsBelow: 2, mgrs: [4, 5] },
      { dept: 'Finance & Operations', role: 'Director of Operations', levelsBelow: 2, mgrs: [3, 5] },
      { dept: 'Data & Analytics', role: 'Director of Data Science', levelsBelow: 3, mgrs: [4, 6] },
      { dept: 'Customer Support', role: 'Director of Customer Support', levelsBelow: 2, mgrs: [3, 5] }
    ];

    dirConfigs.forEach(dc => {
      const dir = mk(`${pick(FIRSTS)} ${pick(LASTS)}`, dc.role, ceo.id, dc.dept, 'L7 - Director', 1);
      const mgrCount = rInt(dc.mgrs[0], dc.mgrs[1]);
      for (let m = 0; m < mgrCount; m++) {
        const mgrRole = `${dc.dept.split(' ')[0]} Manager`;
        const mgr = mk(`${pick(FIRSTS)} ${pick(LASTS)}`, mgrRole, dir.id, dc.dept, 'L6 - Principal Lead', 2);
        const count = getReportCount();
        for (let r = 0; r < count; r++) {
          const isLead = (dc.levelsBelow >= 3) && (r < 3 || rnd() < 0.35);
          if (isLead) {
            const leadRole = `Lead ${dc.dept.split(' ')[0]} Specialist`;
            const lead = mk(`${pick(FIRSTS)} ${pick(LASTS)}`, leadRole, mgr.id, dc.dept, 'L5 - Senior Staff', 3);
            const subCount = rInt(3, 5);
            for (let s = 0; s < subCount; s++) {
              const memRole = pick([`Associate ${dc.dept.split(' ')[0]}`, `Staff ${dc.dept.split(' ')[0]} Analyst`, `${dc.dept.split(' ')[0]} Specialist`]);
              mk(`${pick(FIRSTS)} ${pick(LASTS)}`, memRole, lead.id, dc.dept, 'L3 - Junior Associate', 4);
            }
          } else {
            const memRole = pick([`Senior ${dc.dept.split(' ')[0]} Specialist`, `Staff ${dc.dept.split(' ')[0]} Engineer`, `${dc.dept.split(' ')[0]} Associate`]);
            mk(`${pick(FIRSTS)} ${pick(LASTS)}`, memRole, mgr.id, dc.dept, 'L4 - Specialist', 3);
          }
        }
      }
    });

    try {
      const ds = typeof window !== 'undefined' ? window.DataStore : null;
      const dsMembers = (ds && ds._data && ds._data.members) ? ds._data.members : [];
      dsMembers.forEach(dm => {
        if (!dm.isUnassigned && dm.role !== 'Unassigned' && dm.reportsTo && !emps.some(e => e.id === dm.id)) {
          const mgr = emps.find(e => e.id === dm.reportsTo) || emps[0];
          emps.push({
            id: dm.id,
            name: dm.name,
            role: dm.role,
            avatar: dm.avatar || dm.name.split(' ').map(n => n[0]).join('').slice(0, 2),
            managerId: mgr ? mgr.id : null,
            reportsTo: mgr ? mgr.id : null,
            department: dm.department || (mgr ? mgr.department : 'Engineering'),
            band: dm.band || 'L4 - Specialist',
            depth: (mgr ? mgr.depth : 1) + 1,
            location: dm.location || 'Bangalore, IN',
            startDate: dm.startDate || '2026-09-18',
            joinedDate: dm.joinedDate || 'Sep 2026',
            activeTasks: dm.activeTasks || 0,
            email: dm.email,
            rank: emps.length + 1,
            proficiency: dm.proficiency || 'Beginner',
            directReportIds: []
          });
        }
      });
    } catch (e) { /* ignore */ }

    const map = new Map(emps.map(e => [e.id, e]));
    emps.forEach(e => {
      if (e.managerId && map.has(e.managerId)) map.get(e.managerId).directReportIds.push(e.id);
    });

    const memo = new Map();
    function countReports(id) {
      if (memo.has(id)) return memo.get(id);
      const e = map.get(id);
      if (!e) return 0;
      let count = e.directReportIds.length;
      for (const cid of e.directReportIds) count += countReports(cid);
      memo.set(id, count);
      return count;
    }
    emps.forEach(e => { e.totalReportCount = countReports(e.id); });

    let maxDepth = 0;
    emps.forEach(e => { if (e.depth > maxDepth) maxDepth = e.depth; });
    buildHierarchy.maxDepth = maxDepth;
    buildHierarchy.employeeCount = emps.length;

    return emps;
  }

  global.buildHierarchy = buildHierarchy;
})(typeof window !== 'undefined' ? window : global);
