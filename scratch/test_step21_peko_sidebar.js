const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 21: Peko-Style Sidebar Navigation Verification ===\n');

// 1. File Line Count Audit
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = ['css/layout.css', 'css/nav.css'];
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Logo Area Spacing & Clean Top-Left Placement
console.log('2. Checking Logo Area & Header Spacing in css/layout.css...');
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
assert(layoutCss.includes('.sidebar-header'), 'Missing .sidebar-header');
assert(layoutCss.includes('border-bottom: none'), 'Sidebar header should not have a harsh bottom border');
assert(layoutCss.includes('max-width: 170px') || layoutCss.includes('height: 44px'), 'Brand logo should have proportionate breathing room');
console.log('  PASS: Logo area cleanly placed with ample breathing room.\n');

// 3. Nav Items Styling in css/nav.css
console.log('3. Checking Nav Items (Active, Inactive, Pill shape, Airy spacing)...');
const navCss = fs.readFileSync(path.join(__dirname, '../css/nav.css'), 'utf8');

// Active item: soft peach pill, coral text + icon
assert(navCss.includes('.nav-link.active') && navCss.includes('var(--pastel-peach)'), 'Active nav item must have soft peach background');
assert(navCss.includes('.nav-link.active') && navCss.includes('var(--color-primary)'), 'Active nav item must use coral accent for text and icon');

// Inactive item: dark text/icon, no background, no border
assert(navCss.includes('border: none !important'), 'Nav links must be borderless');
assert(navCss.includes('border-radius: var(--radius-pill)'), 'Nav links must use pill border-radius');

// Hover state: light pastel/gray background
assert(navCss.includes('.nav-link:hover') && (navCss.includes('#F7F6F3') || navCss.includes('background-color')), 'Nav link hover must have subtle background');

// Airy vertical spacing
assert(navCss.includes('.nav-list') && navCss.includes('gap: 6px'), 'Nav list must have vertical gap spacing for airier feel');
console.log('  PASS: Nav items adhere to Peko pill and color specifications.\n');

// 4. Utility Group Divider
console.log('4. Checking Subtle Horizontal Divider before Reports...');
assert(navCss.includes('a[data-page="reports"]'), 'Subtle divider must target utility item group (Reports)');
assert(navCss.includes('border-top: 1px solid var(--color-border)'), 'Divider line must be a subtle border-top');
console.log('  PASS: Utility grouping divider verified.\n');

console.log('ALL STEP 21 AUDITS PASSED SUCCESSFULLY!');
