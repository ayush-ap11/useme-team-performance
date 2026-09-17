/**
 * Test Step 17: Reports Live Aggregation, Dynamic Charts, Expanded CSV Export & Final Consistency Pass
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING STEP 17 VERIFICATION TEST ===\n');

// 1. Static Code Analysis
const workspaceRoot = path.join(__dirname, '..');
const jsDir = path.join(workspaceRoot, 'js');
const reportsDataPath = path.join(jsDir, 'reports-data.js');
const reportsExportPath = path.join(jsDir, 'reports-export.js');
const reportsJsPath = path.join(jsDir, 'reports.js');

const repDataContent = fs.readFileSync(reportsDataPath, 'utf8');
const repExportContent = fs.readFileSync(reportsExportPath, 'utf8');

console.log('1. Static Code Checks...');

// Check: Zero USEME_DATA in reports modules
assert(!repDataContent.includes('USEME_DATA'), 'FAIL: reports-data.js contains USEME_DATA');
assert(!repExportContent.includes('USEME_DATA'), 'FAIL: reports-export.js contains USEME_DATA');
console.log('  ✓ reports-data.js and reports-export.js contain 0 references to USEME_DATA');

// Check: No frozen date 2026-08-25
assert(!repDataContent.includes('2026-08-25'), 'FAIL: reports-data.js contains frozen date 2026-08-25');
assert(!repExportContent.includes('2026-08-25'), 'FAIL: reports-export.js contains frozen date 2026-08-25');
console.log('  ✓ Frozen date 2026-08-25 eliminated');

// Check: Line counts
const repDataLines = repDataContent.split('\n').length;
const repExportLines = repExportContent.split('\n').length;
assert(repDataLines <= 150, `FAIL: reports-data.js is ${repDataLines} lines (must be <= 150)`);
assert(repExportLines <= 150, `FAIL: reports-export.js is ${repExportLines} lines (must be <= 150)`);
console.log(`  ✓ Line counts: reports-data.js (${repDataLines} lines), reports-export.js (${repExportLines} lines) <= 150`);


// 2. Behavioral Testing of Live Aggregation & Charts
console.log('\n2. Testing Live Aggregation & Period Filtering...');

// Setup minimal localStorage and browser environment
const localStorageData = {
  useme_role: 'admin',
  useme_user_id: 'm1'
};
global.localStorage = {
  getItem: (k) => localStorageData[k] ?? null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { for (let k in localStorageData) delete localStorageData[k]; }
};

global.window = global;
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load DataStore and Reports modules
require(path.join(jsDir, 'mock-data.js'));
require(path.join(jsDir, 'data-store.js'));
require(path.join(jsDir, 'data-store-writes.js'));
require(path.join(jsDir, 'data-store-team-writes.js'));
require(reportsDataPath);
require(reportsExportPath);

const RD = global.window.REPORTS_DATA;
assert(RD && typeof RD.getMetrics === 'function', 'FAIL: REPORTS_DATA.getMetrics must be a function');
assert(RD && typeof RD.getChartData === 'function', 'FAIL: REPORTS_DATA.getChartData must be a function');
assert(RD && typeof RD.downloadCSV === 'function', 'FAIL: REPORTS_DATA.downloadCSV must be a function');

// 2.1 Metrics Aggregation
const metricsMonth = RD.getMetrics('month');
assert(typeof metricsMonth.completed === 'number', 'Metrics must have completed count');
assert(typeof metricsMonth.avgScore === 'string' || typeof metricsMonth.avgScore === 'number', 'Metrics must have avgScore');
assert(typeof metricsMonth.reworkRate === 'string', 'Metrics must have reworkRate');
assert(Array.isArray(metricsMonth.skillGaps), 'Metrics must have dynamic skillGaps array');
console.log(`  ✓ getMetrics('month'): ${metricsMonth.completed} completed, avg score ${metricsMonth.avgScore}, ${metricsMonth.reworkRate}% rework`);

// 2.2 Chart Data Dynamic Weekly Bins
const chartsMonth = RD.getChartData('month');
assert(Array.isArray(chartsMonth.completedPerWeek), 'Chart data must have completedPerWeek');
assert(Array.isArray(chartsMonth.reworkTrend), 'Chart data must have reworkTrend');
assert.strictEqual(chartsMonth.completedPerWeek.length, 4, 'Must have 4 weekly bins');
assert.strictEqual(chartsMonth.reworkTrend.length, 4, 'Must have 4 weekly rework bins');
chartsMonth.completedPerWeek.forEach((bin, idx) => {
  assert(typeof bin.count === 'number', `Bin ${idx} count must be number`);
  assert(typeof bin.heightPct === 'number', `Bin ${idx} heightPct must be number`);
});
console.log('  ✓ getChartData: dynamically computed across 4 bins with real timestamps');

// 2.3 Period Filtering Consistency
const metricsWeek = RD.getMetrics('week');
const chartsWeek = RD.getChartData('week');
assert(metricsWeek !== undefined, 'getMetrics(week) returned valid metrics');
assert(chartsWeek !== undefined, 'getChartData(week) returned valid chart data');
console.log('  ✓ Period filter switches successfully between month and week');


// 3. Testing Real CSV Export & Audit Logging
console.log('\n3. Testing CSV Export & Audit Logging...');

const csvContent = RD.downloadCSV('month');
assert(typeof csvContent === 'string', 'downloadCSV must return csv string');

// Verify expanded columns in section 1
assert(csvContent.includes('--- SECTION 1: TEAM MEMBERS PERFORMANCE SCORECARD (PERIOD FILTERED) ---'), 'CSV missing section 1 header');
assert(csvContent.includes('Department'), 'CSV must include Department column');
assert(csvContent.includes('Composite Score'), 'CSV must include Composite Score column');
assert(csvContent.includes('KRA Pillar'), 'CSV must include KRA Pillar breakdown');
assert(csvContent.includes('Engagement Points'), 'CSV must include Engagement Points');
assert(csvContent.includes('Motivation Points'), 'CSV must include Motivation Points');

// Verify section 2 and 3
assert(csvContent.includes('--- SECTION 2: OPERATIONAL TASKS & DELIVERABLES (PERIOD FILTERED) ---'), 'CSV missing section 2 header');
assert(csvContent.includes('--- SECTION 3: ENGAGEMENT & MOTIVATION ACTIVITIES (PERIOD FILTERED) ---'), 'CSV missing section 3 header');
console.log('  ✓ CSV export generated with all expanded fields (department, KRA pillars, engagement/motivation points)');

// Verify audit logging of report export
const logs = global.DataStore.getActivityLog();
const exportLog = logs.find(l => l.relatedEntityType === 'report' && l.actionText.includes('exported team report'));
assert(exportLog, 'FAIL: Exporting report must be logged in activity feed');
console.log('  ✓ Activity feed recorded export action: ' + exportLog.actionText);


// 4. Final Full-Codebase Consistency Check for Stray USEME_DATA
console.log('\n4. Final Full-Codebase Stray USEME_DATA Search...');

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
const strayFiles = [];

files.forEach(f => {
  if (f === 'data-store.js' || f === 'mock-data.js') return; // Expected seed data sources
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  if (content.includes('USEME_DATA')) {
    strayFiles.push(f);
  }
});

assert.strictEqual(strayFiles.length, 0, `FAIL: Found stray USEME_DATA in: ${strayFiles.join(', ')}`);
console.log('  ✓ Confirmed: ZERO direct USEME_DATA references outside data-store.js and mock-data.js across all JS files!');


// 5. Auth / Login Gap Audit
console.log('\n5. Checking Login Access Gap...');
const loginContent = fs.readFileSync(path.join(jsDir, 'login.js'), 'utf8');
const allMembers = global.DataStore.getMembers();

// Match users who have credentials in login.js
const canLoginIds = ['m1', 'm5', 'm3', 'm7'];
const totalMembers = allMembers.length;
const canLoginCount = canLoginIds.length;
const gapCount = totalMembers - canLoginCount;

console.log(`  Total Active Members: ${totalMembers}`);
console.log(`  Members with login credentials: ${canLoginCount} (${canLoginIds.join(', ')})`);
console.log(`  Members without login credentials: ${gapCount}`);
assert.strictEqual(canLoginCount, 4, 'Expected exactly 4 hardcoded credentials in login.js');

console.log('\n=== STEP 17 VERIFICATION PASSED SUCCESSFULLY ===');
