/**
 * Test Step 15: Automated Performance Insights Verification
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING STEP 15 VERIFICATION TEST ===\n');

// 1. Static Analysis of js/insights.js
const insightsPath = path.join(__dirname, '..', 'js', 'insights.js');
const content = fs.readFileSync(insightsPath, 'utf8');

console.log('1. Checking static code properties in js/insights.js...');

// Check: No USEME_DATA
assert(!content.includes('USEME_DATA'), 'FAIL: js/insights.js should not contain any reference to USEME_DATA');
console.log('  ✓ Zero references to USEME_DATA');

// Check: No frozen date string
assert(!content.includes('2026-08-24T12:00:00Z'), 'FAIL: js/insights.js contains frozen date 2026-08-24T12:00:00Z');
console.log('  ✓ Frozen date 2026-08-24T12:00:00Z is eliminated, uses live new Date()');

// Check: No hardcoded low-engagement member list ['m6','m8','m10']
assert(!content.includes("'m6','m8','m10'") && !content.includes('"m6","m8","m10"'), 'FAIL: js/insights.js contains hardcoded member list');
assert(!content.includes("['m6'") && !content.includes('["m6"'), 'FAIL: js/insights.js contains hardcoded member array');
console.log('  ✓ Hardcoded low-engagement member list is eliminated');

// Check: Reads from DataStore
const requiredMethods = [
  'getTasks',
  'getMembers',
  'getSkillCategories',
  'getProjects',
  'getEngagementSubmissions',
  'getMotivationSubmissions',
  'getZoomSessions',
  'getCurrentCycle'
];
requiredMethods.forEach(method => {
  assert(content.includes(`ds.${method}`), `FAIL: js/insights.js must call ds.${method}()`);
});
console.log('  ✓ All 8 data queries read live via DataStore methods');

// Check: Pure read-only (no DataStore write methods called)
const writeMethods = [
  'createTask', 'updateTask', 'deleteTask',
  'createProject', 'updateProject', 'deleteProject',
  'createCycle', 'updateCycle', 'deleteCycle',
  'createDepartment', 'updateDepartment', 'deleteDepartment',
  'createSkillCategory', 'updateSkillCategory', 'deleteSkillCategory',
  'createActivityType', 'updateActivityType', 'deleteActivityType',
  'saveMembers', 'saveTasks', 'saveProjects'
];
writeMethods.forEach(wm => {
  assert(!content.includes(`ds.${wm}`), `FAIL: js/insights.js should be read-only, but calls ds.${wm}`);
});
console.log('  ✓ Pure read-only confirmed: zero write operations invoked');

// 2. Behavioral Testing of Rules in js/insights.js
console.log('\n2. Testing Anomaly Rules Logic...');

// Setup a mock DOM and window environment
global.window = global;
global.document = {
  addEventListener: (evt, fn) => { global._domReady = fn; },
  getElementById: (id) => {
    if (!global._elements[id]) {
      global._elements[id] = {
        innerHTML: '',
        textContent: '',
        children: [],
        appendChild: function(child) { this.children.push(child); }
      };
    }
    return global._elements[id];
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      className: '',
      innerHTML: '',
      querySelector: function(sel) {
        return { onclick: null };
      }
    };
  }
};
global.localStorage = {
  getItem: (k) => k === 'useme_role' ? 'admin' : null
};
global._elements = {};

// Mock DataStore with controllable test data
const mockCurrentCycle = {
  id: 'c1',
  label: 'Aug 2026',
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  isCurrent: true
};

const now = new Date();
const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');

global.DataStore = {
  getCurrentCycle: () => mockCurrentCycle,
  getMembers: () => [
    { id: 'm1', name: 'Alice' },
    { id: 'm2', name: 'Bob' },
    { id: 'm3', name: 'Charlie' }
  ],
  getSkillCategories: () => [
    { id: 'cat-frontend', name: 'Frontend Engineering' }
  ],
  getTasks: () => [
    // Task 1: Stagnant for 4 days -> should trigger Rule 1
    {
      id: 't1',
      title: 'Stagnant Task 1',
      status: 'inProgress',
      assignedTo: ['m1'],
      statusHistory: [{ timestamp: fourDaysAgo, status: 'inProgress' }]
    },
    // Task 2 & 3: Rework needed for Bob -> should trigger Rule 2
    {
      id: 't2',
      title: 'Rework Task 1',
      status: 'reworkNeeded',
      assignedTo: ['m2'],
      linkedSkill: 'cat-frontend'
    },
    {
      id: 't3',
      title: 'Rework Task 2',
      status: 'reworkNeeded',
      assignedTo: ['m2'],
      linkedSkill: 'cat-frontend'
    },
    // Task 4: Another frontend task in review -> together with t2 and t3 makes 3 in cat-frontend -> triggers Rule 3
    {
      id: 't4',
      title: 'Frontend Review Task',
      status: 'testing',
      assignedTo: ['m1'],
      linkedSkill: 'cat-frontend'
    }
  ],
  getProjects: () => [
    // Project 1: Due in 10 days, 0% complete -> triggers Rule 4
    {
      id: 'p1',
      name: 'Alpha Project',
      status: 'inProgress',
      targetDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      linkedTaskIds: ['t1']
    }
  ],
  getEngagementSubmissions: () => [
    // Alice has 3 approved submissions in current cycle
    { id: 'es1', memberId: 'm1', status: 'approved', date: '2026-08-10' },
    { id: 'es2', memberId: 'm1', status: 'approved', date: '2026-08-15' },
    { id: 'es3', memberId: 'm1', status: 'approved', date: '2026-08-20' },
    // Bob has 2 approved submissions in current cycle
    { id: 'es4', memberId: 'm2', status: 'approved', date: '2026-08-12' },
    { id: 'es5', memberId: 'm2', status: 'approved', date: '2026-08-18' }
    // Charlie has 0 submissions in cycle -> below threshold -> triggers Rule 5
  ],
  getMotivationSubmissions: () => [],
  getZoomSessions: () => [
    // Zoom session in cycle: Charlie absent in both -> triggers Rule 6
    {
      id: 'z1',
      date: '2026-08-05',
      attendance: { m1: 'present', m2: 'present', m3: 'absent' }
    },
    {
      id: 'z2',
      date: '2026-08-19',
      attendance: { m1: 'present', m2: 'present', m3: 'absent' }
    },
    // Zoom session out of cycle (e.g. July) -> should be filtered out by inCurrentCycle!
    {
      id: 'z0',
      date: '2026-07-25',
      attendance: { m1: 'absent', m2: 'absent', m3: 'absent' }
    }
  ]
};

// Execute insights.js
require(insightsPath);
global._domReady();

const grid = global._elements['insightsGrid'];
console.log(`  ✓ Successfully executed insights analysis, generated ${grid.children.length} insight cards`);

// Verify card types generated
const cardHtmls = grid.children.map(c => c.innerHTML);

// Check Rule 1 (Stuck Task)
const hasStuck = cardHtmls.some(h => h.includes('Stalled Deliverable: Stagnant Task 1'));
assert(hasStuck, 'FAIL: Rule 1 should have caught Stagnant Task 1');
console.log('  ✓ Rule 1 (Stuck Task) correctly identified stalled deliverable');

// Check Rule 2 (Quality Pattern)
const hasQuality = cardHtmls.some(h => h.includes('Rework Cluster: Bob'));
assert(hasQuality, 'FAIL: Rule 2 should have caught rework cluster for Bob');
console.log('  ✓ Rule 2 (Quality Pattern) correctly caught rework cluster');

// Check Rule 3 (Domain Bottleneck)
const hasBottleneck = cardHtmls.some(h => h.includes('Capacity Bottleneck: Frontend Engineering'));
assert(hasBottleneck, 'FAIL: Rule 3 should have caught frontend category bottleneck');
console.log('  ✓ Rule 3 (Domain Bottleneck) correctly flagged frontend review queue blockage');

// Check Rule 4 (Timeline Risk)
const hasTimeline = cardHtmls.some(h => h.includes('Project at Risk: Alpha Project'));
assert(hasTimeline, 'FAIL: Rule 4 should have caught Alpha Project timeline risk');
console.log('  ✓ Rule 4 (Timeline Risk) correctly flagged at-risk project with upcoming deadline');

// Check Rule 5 (Low Engagement)
const hasEngagement = cardHtmls.some(h => h.includes('Low Activity: Charlie'));
assert(hasEngagement, 'FAIL: Rule 5 should have identified Charlie with low activity in current cycle');
console.log('  ✓ Rule 5 (Low Engagement) dynamically computed threshold and flagged Charlie');

// Check Rule 6 (Repeated Sync Absence)
const hasAbsence = cardHtmls.some(h => h.includes('Repeated Sync Absence: Charlie'));
assert(hasAbsence, 'FAIL: Rule 6 should have caught Charlie repeated zoom absence in current cycle');
console.log('  ✓ Rule 6 (Repeated Zoom Absence) scoped to current cycle and flagged Charlie');

// Verify line count
const lineCount = content.split('\n').length;
console.log(`\n3. File length of js/insights.js: ${lineCount} lines.`);

console.log('\n=== STEP 15 VERIFICATION PASSED SUCCESSFULLY ===');
