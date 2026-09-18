const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Step 25: Restyle Submissions Page (Peko Reference) Tests ---');
  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
    }
  }

  const subCss = fs.readFileSync(path.join(__dirname, '../css/submissions.css'), 'utf8');
  const subJs = fs.readFileSync(path.join(__dirname, '../js/submissions.js'), 'utf8');
  const subHtml = fs.readFileSync(path.join(__dirname, '../submissions.html'), 'utf8');

  // 1. Line counts <= 150
  const subCssLines = subCss.split('\n').length;
  const subJsLines = subJs.split('\n').length;
  const subHtmlLines = subHtml.split('\n').length;

  assert(`css/submissions.css line count <= 150 (${subCssLines})`, subCssLines <= 150);
  assert(`js/submissions.js line count <= 150 (${subJsLines})`, subJsLines <= 150);
  assert(`submissions.html line count <= 150 (${subHtmlLines})`, subHtmlLines <= 150);

  // 2. Tabs styling
  assert('Submissions tabs active button uses var(--color-primary)',
    subCss.includes('.sub-tab-btn.active') && subCss.includes('var(--color-primary)'));
  assert('Submissions tab count badge uses pill radius and pastel-peach on active',
    subCss.includes('.sub-count-badge') && subCss.includes('var(--pastel-peach)'));

  // 3. Submission cards styling
  assert('Submission card has rounded corners (var(--radius-lg)) and soft shadow',
    subCss.includes('.submission-card') && subCss.includes('var(--radius-lg)') && subCss.includes('var(--shadow-card)'));
  assert('Submission member avatar uses var(--color-primary)',
    subCss.includes('.sub-member-avatar') && subCss.includes('var(--color-primary)'));

  // 4. Proof chips styling
  assert('Proof chips have rounded pill styling and standardized class',
    subCss.includes('.proof-chip') && subCss.includes('var(--radius-pill)') && subCss.includes('var(--color-bg)'));
  assert('js/submissions.js renders proof chips markup when task.assets present',
    subJs.includes('sub-proof-assets') && subJs.includes('proof-chip'));

  // 5. Equal-width Approve / Send Back buttons
  assert('Approve and Send Back buttons have equal-width styling (flex: 1)',
    subCss.includes('.sub-actions .btn-approve, .sub-actions .btn-rework') && subCss.includes('flex: 1'));
  assert('Approve button is filled with coral (var(--color-primary))',
    subCss.includes('.sub-actions .btn-approve') && subCss.includes('background-color: var(--color-primary)'));
  assert('Send Back button has coral border/color and pastel-peach hover',
    subCss.includes('.sub-actions .btn-rework') && subCss.includes('color: var(--color-primary)') && subCss.includes('var(--pastel-peach)'));

  // 6. Inline rework box styling
  assert('Rework box textarea has coral focus ring and pill buttons',
    subCss.includes('.rework-box textarea:focus') && subCss.includes('var(--radius-pill)'));

  // 7. Shared task-detail modal call preserved
  assert('js/submissions.js preserves openTaskDetailModal integration',
    subJs.includes('window.openTaskDetailModal'));

  console.log(`\nResult: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
