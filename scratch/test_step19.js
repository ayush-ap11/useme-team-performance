/**
 * Test script for Team Hierarchy Cross-Column State Bugfix & Full Name on Select
 */
const fs = require('fs');
const path = require('path');

console.log('--- 1. FILE LINE COUNT AUDIT (< 150 lines per file) ---');
const filesToCheck = [
  'js/hierarchy.js',
  'js/hierarchy-render.js',
  'js/hierarchy-connectors.js',
  'js/hierarchy-seed.js',
  'css/hierarchy-card.css',
  'css/hierarchy.css'
];

let allPassed = true;
filesToCheck.forEach(rel => {
  const full = path.join(__dirname, '..', rel);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n').length;
  const ok = lines <= 150;
  console.log(`${rel}: ${lines} lines -> ${ok ? 'PASS' : 'FAIL (>150)'}`);
  if (!ok) allPassed = false;
});

console.log('\n--- 2. SEED DATA & DISTRIBUTION AUDIT ---');
const seedCode = fs.readFileSync(path.join(__dirname, '..', 'js/hierarchy-seed.js'), 'utf8');
const fakeWindow = {};
eval(`(function(global) { ${seedCode} })(fakeWindow);`);
const emps = fakeWindow.buildHierarchy();
console.log(`Generated ${emps.length} employees (Target: 300-500) -> ${emps.length >= 300 && emps.length <= 500 ? 'PASS' : 'FAIL'}`);
console.log(`Max branch depth: ${fakeWindow.buildHierarchy.maxDepth}`);

console.log('\n--- 3. LOGIC & CROSS-COLUMN STATE INTEGRATION TEST ---');
// Verify activePath logic in hierarchy.js
const hierarchyCode = fs.readFileSync(path.join(__dirname, '..', 'js/hierarchy.js'), 'utf8');
// Check that handleCardClick updates activePath at colIdx and preserves previous columns
if (hierarchyCode.includes('activePath = [...activePath.slice(0, colIdx), emp.id]')) {
  console.log('handleCardClick slice isolation: PASS');
} else {
  console.log('handleCardClick slice isolation: FAIL');
  allPassed = false;
}

// Check that handleBadgeClick updates activePath at colIdx
if (hierarchyCode.includes('activePath.slice(0, colIdx)')) {
  console.log('handleBadgeClick collapse isolation: PASS');
} else {
  console.log('handleBadgeClick collapse isolation: FAIL');
  allPassed = false;
}

// Verify no card reordering in hierarchy-render.js
const renderCode = fs.readFileSync(path.join(__dirname, '..', 'js/hierarchy-render.js'), 'utf8');
if (!renderCode.includes('childIds.splice(idx, 1)') && !renderCode.includes('childIds.unshift(activeChildId)')) {
  console.log('Stable natural sibling order (no reordering): PASS');
} else {
  console.log('Reordering detected in render: FAIL');
  allPassed = false;
}

// Verify alignColumns implementation in hierarchy-render.js
if (renderCode.includes('alignColumns') && renderCode.includes('nextCol.style.marginTop')) {
  console.log('alignColumns vertical alignment: PASS');
} else {
  console.log('alignColumns missing: FAIL');
  allPassed = false;
}

// Verify full name on select styling in hierarchy-card.css
const cardCss = fs.readFileSync(path.join(__dirname, '..', 'css/hierarchy-card.css'), 'utf8');
if (cardCss.includes('.zoho-card.selected .zoho-name') && cardCss.includes('white-space: normal')) {
  console.log('Full name on select CSS expansion: PASS');
} else {
  console.log('Full name CSS expansion missing: FAIL');
  allPassed = false;
}

console.log(`\nOverall result: ${allPassed ? 'ALL AUDITS PASSED' : 'SOME AUDITS FAILED'}`);
process.exit(allPassed ? 0 : 1);
