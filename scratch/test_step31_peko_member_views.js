const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 31: Team Member Projects, Events, Ranking & Engagement/Motivation Peko Verification ===\n');

const workspaceRoot = path.join(__dirname, '..');

// 1. Line Count Audits (<= 150 lines per file)
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/projects.css',
  'css/events.css',
  'css/ranking.css',
  'css/engagement.css',
  'css/project-modal.css',
  'css/event-modal.css',
  'projects.html',
  'events.html',
  'ranking.html'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(workspaceRoot, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `FAIL: ${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Projects and Events Card Treatment
console.log('2. Checking Projects and Events Card Treatment in css/projects.css & css/events.css...');
const projCss = fs.readFileSync(path.join(workspaceRoot, 'css/projects.css'), 'utf8');
const evCss = fs.readFileSync(path.join(workspaceRoot, 'css/events.css'), 'utf8');

assert(projCss.includes('.project-card') && projCss.includes('var(--shadow-card)'), 'Project card must use soft shadow');
assert(projCss.includes('.project-card') && projCss.includes('var(--radius-lg)'), 'Project card must have rounded corners');
assert(projCss.includes('.proj-icon-wrapper') && projCss.includes('border-radius: 50%'), 'Project icon badge must be circular');
assert(projCss.includes('.progress-bar-fill') && projCss.includes('var(--color-primary)'), 'Progress bar fill must use coral accent');
assert(projCss.includes('.progress-bar-bg') && projCss.includes('var(--radius-pill)'), 'Progress bar track must have rounded pill ends');

assert(evCss.includes('.event-card') && evCss.includes('var(--shadow-card)'), 'Event card must use soft shadow');
assert(evCss.includes('.event-card') && evCss.includes('var(--radius-lg)'), 'Event card must have rounded corners');
assert(evCss.includes('.event-icon-wrapper') && evCss.includes('border-radius: 50%'), 'Event icon badge must be circular');
assert(evCss.includes('.event-venue-row') && evCss.includes('var(--color-primary)'), 'Venue box must have coral icon accent');
console.log('  PASS: Projects and Events card treatment, progress bar, and venue box verified.\n');

// 3. Ranking Page Member Own-Row Highlight
console.log('3. Checking Ranking Page Member Own-Row Highlight in css/ranking.css...');
const rankCss = fs.readFileSync(path.join(workspaceRoot, 'css/ranking.css'), 'utf8');

assert(rankCss.includes('.rank-row.my-row') && rankCss.includes('var(--color-primary)'), 'Own-row highlight must use coral accent border');
assert(rankCss.includes('.rank-row.my-row') && rankCss.includes('var(--pastel-peach)'), 'Own-row highlight must use pastel peach background');
assert(rankCss.includes('.rank-row.my-row .avatar-mini') && rankCss.includes('var(--color-primary)'), 'Own-row avatar must use coral accent');
assert(rankCss.includes('.rank-chip') && rankCss.includes('var(--radius-pill)'), 'Filter chips must have rounded pill geometry');
assert(rankCss.includes('.rank-chip.active') && rankCss.includes('var(--color-primary)'), 'Active filter chip must use coral accent');
console.log('  PASS: Ranking page member own-row coral highlight and filter chips verified.\n');

// 4. Engagement Tab - Log Outreach Activity Modal
console.log('4. Checking Log Outreach Activity Modal in css/engagement.css...');
const engCss = fs.readFileSync(path.join(workspaceRoot, 'css/engagement.css'), 'utf8');

assert(engCss.includes('#logSubmitBtn') && engCss.includes('var(--color-primary)'), 'Log Outreach submit button must use coral accent');
assert(engCss.includes('#logSubmitBtn') && engCss.includes('var(--radius-pill)'), 'Log Outreach submit button must have pill radius');
assert(engCss.includes('.file-upload-btn') && engCss.includes('var(--radius-pill)'), 'Styled Choose File button must have pill radius');
assert(engCss.includes('.file-upload-btn:hover') && engCss.includes('var(--color-primary)'), 'Choose File button must have coral hover state');
assert(engCss.includes('.proof-choice-divider'), 'Labeled divider between URL/file options must exist');
assert(engCss.includes('.file-name-display'), 'Filename display styling must exist');
console.log('  PASS: Log Outreach Activity modal buttons, file upload, and divider verified.\n');

// 5. Motivation Tab Read-Only History
console.log('5. Checking Motivation Tab Read-Only History in css/engagement.css...');
assert(engCss.includes('.tab-btn.tab-mot.active') && engCss.includes('var(--color-green)'), 'Motivation tab active state must use soft green accent');
assert(engCss.includes('.mot-score-card') && engCss.includes('var(--shadow-card)'), 'Motivation score card must use soft shadow');
assert(engCss.includes('.mot-cards-grid .sparkline-svg polyline') && engCss.includes('var(--color-green)'), 'Motivation sparklines must use soft green accent');
assert(engCss.includes('.channel-card.zoom-card') && engCss.includes('var(--color-green)'), 'Zoom card must have soft green border');
console.log('  PASS: Motivation tab read-only history and soft green accent verified.\n');

console.log('ALL STEP 31 AUDITS PASSED SUCCESSFULLY!');
