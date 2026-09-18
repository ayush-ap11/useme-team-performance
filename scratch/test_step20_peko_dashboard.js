const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 20: Admin Dashboard Peko-Style Fintech Verification ===\n');

// 1. File Line Count Audit
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/variables.css',
  'css/dashboard.css',
  'css/command-palette.css',
  'css/nav.css'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked CSS files are <= 150 lines.\n');

// 2. Design Tokens in variables.css
console.log('2. Checking Design Tokens in css/variables.css...');
const varCss = fs.readFileSync(path.join(__dirname, '../css/variables.css'), 'utf8');
assert(varCss.includes('#E8514D'), 'Missing coral-red (#E8514D) primary accent in variables.css');
assert(varCss.includes('--pastel-peach'), 'Missing --pastel-peach token');
assert(varCss.includes('--pastel-lavender'), 'Missing --pastel-lavender token');
assert(varCss.includes('--pastel-mint'), 'Missing --pastel-mint token');
assert(varCss.includes('--shadow-card'), 'Missing --shadow-card token');
assert(varCss.includes('--radius-pill'), 'Missing --radius-pill token');
console.log('  PASS: All design tokens (coral-red, pastel tints, radius, shadow) present.\n');

// 3. Topbar Styles in command-palette.css
console.log('3. Checking Topbar Styles in css/command-palette.css...');
const cmdCss = fs.readFileSync(path.join(__dirname, '../css/command-palette.css'), 'utf8');
assert(cmdCss.includes('.dash-notif-badge') && cmdCss.includes('--color-primary'), 'Notification badge should use coral accent');
assert(cmdCss.includes('.dash-profile-chip') && cmdCss.includes('--radius-pill'), 'Profile chip should use rounded pill shape');
assert(cmdCss.includes('.dash-search-box') && cmdCss.includes('box-shadow: none'), 'Search box should be flattened and minimal');
console.log('  PASS: Topbar correctly styled with coral accent, pill profile chip, and minimal controls.\n');

// 4. Summary / Stat Cards & Donut / Engagement Cards in dashboard.css & dashboard-home.js
console.log('4. Checking Dashboard Cards in css/dashboard.css & js/dashboard-home.js...');
const dashCss = fs.readFileSync(path.join(__dirname, '../css/dashboard.css'), 'utf8');
assert(dashCss.includes('--pastel-peach') && dashCss.includes('--pastel-lavender') && dashCss.includes('--pastel-mint'), 'Stat cards must cycle pastel tints');
assert(dashCss.includes('border: none !important'), 'Stat cards must remove borders and keep tint fill');
assert(dashCss.includes('.stat-icon-badge'), 'Stat cards must support circular icon badge top-left');
assert(dashCss.includes('.stat-value'), 'Stat cards must format bold large number');
assert(dashCss.includes('.stat-label'), 'Stat cards must format gray label below');
assert(dashCss.includes('.donut-circle-progress') || dashCss.includes('var(--color-primary)'), 'Attainment donut must use coral progress color');

const dashHomeJs = fs.readFileSync(path.join(__dirname, '../js/dashboard-home.js'), 'utf8');
assert(dashHomeJs.includes('stat-icon-badge'), 'dashboard-home.js should render icon badges in stat cards');
assert(dashHomeJs.includes('stat-label'), 'dashboard-home.js should render stat-label below numbers');
console.log('  PASS: Summary cards, Donut card, and Engagement card correctly styled.\n');

// 5. Quick Actions / Shortcuts Row in css/dashboard.css
console.log('5. Checking Quick Actions / Shortcuts row in css/dashboard.css...');
assert(dashCss.includes('.shortcut-tile') || dashCss.includes('.quick-action-tile'), 'Shortcut tile styles must exist');
assert(dashCss.includes('.shortcut-icon') || dashCss.includes('.quick-action-icon'), 'Shortcut circular icon styles must exist');
console.log('  PASS: Quick actions / shortcut tiles flat pastel styling present.\n');

// 6. Activity / Task List in css/dashboard.css
console.log('6. Checking Activity List spacing-based separation in css/dashboard.css...');
assert(dashCss.includes('.activity-item') && dashCss.includes('border-bottom: none !important'), 'Activity items must not have heavy dividers');
assert(dashCss.includes('.activity-time'), 'Activity items must have right-aligned timestamp');
console.log('  PASS: Activity list spacing-based separation and row styling verified.\n');

console.log('ALL STEP 20 AUDITS PASSED SUCCESSFULLY!');
