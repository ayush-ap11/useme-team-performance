const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 29: Team Member Dashboard & Resources Hub Peko-Style Verification ===\n');

const workspaceRoot = path.join(__dirname, '..');

// 1. Line Count Audits (<= 150 lines per file)
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/dashboard.css',
  'css/resources.css',
  'css/task-modal.css',
  'dashboard.html',
  'resources.html'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(workspaceRoot, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `FAIL: ${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Personal Summary Cards & Pastel Tints in css/dashboard.css
console.log('2. Checking Personal Summary Cards & Pastel Tints in css/dashboard.css...');
const dashCss = fs.readFileSync(path.join(workspaceRoot, 'css/dashboard.css'), 'utf8');

assert(dashCss.includes('--pastel-peach') && dashCss.includes('--pastel-lavender') && dashCss.includes('--pastel-mint'), 'Stat cards must cycle pastel tints');
assert(dashCss.includes('.stat-icon-badge'), 'Stat cards must support circular icon badges');
assert(dashCss.includes('var(--color-primary)'), 'Coral icon badges must use var(--color-primary)');
assert(dashCss.includes('.stat-value'), 'Stat cards must format bold values');
assert(dashCss.includes('.stat-label'), 'Stat cards must format gray labels');
console.log('  PASS: Personal summary cards pastel cycling, icon badges, and typography verified.\n');

// 3. Personal Attainment Donut + Engagement Card (White Card + Soft Shadow)
console.log('3. Checking Personal Attainment Donut + Engagement Card in css/dashboard.css...');
assert(dashCss.includes('.donut-circle-progress') && dashCss.includes('var(--color-primary)'), 'Donut progress stroke must use coral');
assert(dashCss.includes('var(--color-white)') && dashCss.includes('var(--shadow-card)'), 'Donut and engagement cards must use white background with soft shadow');
assert(dashCss.includes('.stats-grid > .stat-card:nth-child(1)') || dashCss.includes('stat-card:has(circle)'), 'White card styling must apply to donut card');
console.log('  PASS: Donut card and Engagement card white surface + soft shadow verified.\n');

// 4. Personal Task / Activity List in css/dashboard.css
console.log('4. Checking Personal Task / Activity List in css/dashboard.css...');
assert(dashCss.includes('.activity-item') && dashCss.includes('border-bottom: none !important'), 'Activity items must have spacing-based separation');
assert(dashCss.includes('.activity-item') && dashCss.includes('#FAF9F7'), 'Activity items must have soft neutral background');
assert(dashCss.includes('.activity-time') && dashCss.includes('margin-left: auto'), 'Activity items must right-align time/status');
assert(dashCss.includes('.dot-orange, .dot-red') && dashCss.includes('var(--color-primary)'), 'Status dots must use coral accent');
console.log('  PASS: Activity list spacing-based row separation and coral status accents verified.\n');

// 5. Resources & Assets Hub in css/resources.css
console.log('5. Checking Resources & Assets Hub in css/resources.css...');
const resCss = fs.readFileSync(path.join(workspaceRoot, 'css/resources.css'), 'utf8');

assert(resCss.includes('.res-table-container') && resCss.includes('var(--shadow-card)'), 'Resource table container must use soft shadow');
assert(resCss.includes('.res-table-container') && resCss.includes('var(--radius-lg)'), 'Resource table container must have rounded corners');
assert(resCss.includes('.res-icon-badge') && resCss.includes('border-radius: 50%'), 'File type icon badges must be circular');
assert(resCss.includes('--badge-peach') && resCss.includes('--badge-lavender') && resCss.includes('--badge-mint'), 'File badges must cycle soft pastel colors');
assert(resCss.includes('.res-table .btn-primary') && resCss.includes('var(--color-primary)'), 'Primary action (view/download) must use coral accent');
assert(resCss.includes('.res-table .btn-primary') && resCss.includes('var(--radius-pill)'), 'Primary action must use rounded pill geometry');
assert(resCss.includes('.res-link-task') && resCss.includes('var(--color-primary)'), 'Origin record link must use coral accent');
assert(resCss.includes('.modal-skill-chip') && resCss.includes('var(--radius-pill)'), 'Asset tag chips must use rounded pill shape');
console.log('  PASS: Resources hub table, circular pastel badges, coral actions, and pill chips verified.\n');

// 6. Upload Controls (Choose File button + Filename display + Labeled divider)
console.log('6. Checking Upload Controls & Labeled Divider in css/resources.css & css/task-modal.css...');
const taskModalCss = fs.readFileSync(path.join(workspaceRoot, 'css/task-modal.css'), 'utf8');

[resCss, taskModalCss].forEach((css, idx) => {
  const name = idx === 0 ? 'css/resources.css' : 'css/task-modal.css';
  assert(css.includes('.proof-choice-divider'), `Missing .proof-choice-divider in ${name}`);
  assert(css.includes('.file-upload-btn') || css.includes('file-selector-button'), `Missing styled file button in ${name}`);
  assert(css.includes('.file-name-display'), `Missing .file-name-display in ${name}`);
  assert(css.includes('var(--radius-pill)'), `Upload buttons must use rounded pill in ${name}`);
});
console.log('  PASS: Upload controls, "Choose File" button, filename display, and labeled divider verified.\n');

console.log('ALL STEP 29 AUDITS PASSED SUCCESSFULLY!');
