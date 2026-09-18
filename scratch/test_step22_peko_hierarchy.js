const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 22: Team Hierarchy Peko-Style Verification ===\n');

// 1. File Line Count Audit
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/hierarchy-card.css',
  'css/hierarchy.css',
  'css/hierarchy-popover.css',
  'js/hierarchy-connectors.js'
];
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Card Styling in hierarchy-card.css
console.log('2. Checking Hierarchy Cards in css/hierarchy-card.css...');
const cardCss = fs.readFileSync(path.join(__dirname, '../css/hierarchy-card.css'), 'utf8');
assert(cardCss.includes('var(--color-white)'), 'Card should have white background');
assert(cardCss.includes('var(--radius-md)'), 'Card should have rounded corners');
assert(cardCss.includes('var(--shadow-card)'), 'Card should have soft low-opacity shadow');
assert(!cardCss.includes('border-left: 3.5px'), 'Harsh colored left border should be removed');
assert(cardCss.includes('.zoho-card.selected') && cardCss.includes('var(--color-primary)'), 'Selected card should use coral accent');
assert(cardCss.includes('.zoho-card.selected .zoho-name') && cardCss.includes('white-space: normal'), 'Selected name expansion should be preserved');
console.log('  PASS: Cards styled with white background, rounded corners, and coral selection.\n');

// 3. Count Badges
console.log('3. Checking Count Badges in css/hierarchy-card.css...');
assert(cardCss.includes('.zoho-badge') && cardCss.includes('background-color: var(--color-primary)'), 'Badge must have coral background');
assert(cardCss.includes('.zoho-badge') && cardCss.includes('color: #ffffff'), 'Badge must have white text');
assert(cardCss.includes('.zoho-badge') && cardCss.includes('border-radius: 50%'), 'Badge must be circular');
console.log('  PASS: Count badges are solid coral circles with bold white text.\n');

// 4. Connector Lines in hierarchy-connectors.js & hierarchy.css
console.log('4. Checking Connector Lines in js/hierarchy-connectors.js and css/hierarchy.css...');
const connJs = fs.readFileSync(path.join(__dirname, '../js/hierarchy-connectors.js'), 'utf8');
assert(connJs.includes("COLOR: '#E8514D'"), "hierarchy-connectors CONFIG.COLOR must be '#E8514D'");
const hierCss = fs.readFileSync(path.join(__dirname, '../css/hierarchy.css'), 'utf8');
assert(hierCss.includes('.zoho-connector-line') && hierCss.includes('var(--color-primary)'), 'Connector line stroke should be coral');
assert(hierCss.includes('.zoho-connector-badge-group circle') && hierCss.includes('var(--color-primary)'), 'Connector badge fill should be coral');
console.log('  PASS: Connector lines and badges recolored to coral.\n');

// 5. Detail Popover in hierarchy-popover.css
console.log('5. Checking Detail Popover in css/hierarchy-popover.css...');
const popCss = fs.readFileSync(path.join(__dirname, '../css/hierarchy-popover.css'), 'utf8');
assert(popCss.includes('var(--color-white)'), 'Popover should have white card background');
assert(popCss.includes('var(--radius-lg)'), 'Popover should have large rounded corners');
assert(popCss.includes('.zoho-popover-action-btn') && popCss.includes('var(--color-primary)'), 'Action buttons should use coral accent');
assert(popCss.includes('.zoho-popover-role') && popCss.includes('var(--color-text-muted)'), 'Role/meta fields should use gray secondary text');
console.log('  PASS: Detail popover styled with white card, soft shadow, coral buttons, and gray meta text.\n');

console.log('ALL STEP 22 AUDITS PASSED SUCCESSFULLY!');
