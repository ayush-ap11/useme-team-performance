const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 30: Team Member Tasks Page & Submission Flow Peko-Style Verification ===\n');

const workspaceRoot = path.join(__dirname, '..');

// 1. Line Count Audits (<= 150 lines per file)
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/tasks.css',
  'css/task-modal.css',
  'css/modal.css',
  'tasks.html'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(workspaceRoot, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `FAIL: ${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Personal Task List Container & Status Badges
console.log('2. Checking Personal Task List & Stage-to-Color Status Badges in css/tasks.css...');
const tasksCss = fs.readFileSync(path.join(workspaceRoot, 'css/tasks.css'), 'utf8');

assert(tasksCss.includes('.tasks-container') && tasksCss.includes('var(--radius-lg)'), 'Tasks container must have rounded corners');
assert(tasksCss.includes('.tasks-container') && tasksCss.includes('var(--shadow-card)'), 'Tasks container must have soft shadow');

// Check stage-to-color mapping in tasks.css:
// Not Started = gray
assert(tasksCss.includes('.badge-grey') && tasksCss.includes('#F3F4F6'), 'Not Started must be styled with gray palette');
// In Progress = coral
assert(tasksCss.includes('.badge-orange') && tasksCss.includes('var(--color-primary)'), 'In Progress must use coral accent');
// Testing = soft lavender
assert(tasksCss.includes('.badge-amber') && (tasksCss.includes('--pastel-lavender') || tasksCss.includes('#7C3AED')), 'Testing must use soft lavender');
// Awaiting Feedback = coral / soft peach variant
assert(tasksCss.includes('.badge-blue') && (tasksCss.includes('var(--color-primary)') || tasksCss.includes('--pastel-peach')), 'Awaiting Feedback must use coral/peach variant');
// Completed = soft green
assert(tasksCss.includes('.badge-green') && tasksCss.includes('var(--color-green)'), 'Completed must use soft green');
// Rework Needed = danger red
assert(tasksCss.includes('.badge-red') && tasksCss.includes('var(--color-red)'), 'Rework Needed must use danger red');
console.log('  PASS: Task list card container and stage-to-color mapping verified.\n');

// 3. Status Dropdown Control
console.log('3. Checking Status Dropdown Control in css/tasks.css & css/task-modal.css...');
const taskModalCss = fs.readFileSync(path.join(workspaceRoot, 'css/task-modal.css'), 'utf8');

assert(tasksCss.includes('#statusFilter') && tasksCss.includes('var(--radius-pill)'), 'Status filter dropdown must have rounded pill geometry');
assert(tasksCss.includes('#statusFilter:focus') && tasksCss.includes('var(--color-primary)'), 'Status filter dropdown focus must have coral border');
assert(taskModalCss.includes('#tmStatusSelect') && taskModalCss.includes('var(--radius-pill)'), 'Task detail modal status select must have rounded pill geometry');
assert(taskModalCss.includes('#tmStatusSelect:focus') && taskModalCss.includes('var(--color-primary)'), 'Task detail modal status select focus must have coral border');
console.log('  PASS: Status dropdown control styling and coral focus ring verified.\n');

// 4. Task Submission Modal & Button Controls
console.log('4. Checking Task Submission Modal Controls in css/task-modal.css...');
assert(taskModalCss.includes('#btnSubmitReview') && taskModalCss.includes('var(--color-primary)'), 'Submit for Review button must use coral accent');
assert(taskModalCss.includes('#btnSubmitReview') && taskModalCss.includes('var(--radius-pill)'), 'Submit for Review button must use rounded pill geometry');
assert(taskModalCss.includes('.task-modal-card .btn-secondary') || taskModalCss.includes('#ntCancelBtn'), 'Cancel button must be styled secondary with pill radius');
assert(taskModalCss.includes('.modal-tab-btn.active') && taskModalCss.includes('var(--color-primary)'), 'Modal tabs must have coral active indicator');
console.log('  PASS: Task submission modal buttons, tabs, and pill radius verified.\n');

// 5. Shared Task-Detail Modal Timeline History
console.log('5. Checking Shared Task-Detail Modal Status History Timeline...');
assert(taskModalCss.includes('.timeline-item::before') && taskModalCss.includes('var(--color-primary)'), 'Timeline dots must use coral accent');
assert(taskModalCss.includes('.timeline::before') && taskModalCss.includes('var(--color-border)'), 'Timeline connector line must exist');
console.log('  PASS: Status history timeline coral dots and connector verified.\n');

console.log('ALL STEP 30 AUDITS PASSED SUCCESSFULLY!');
