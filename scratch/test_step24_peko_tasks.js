const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Step 24: Restyle Tasks Page & Modals (Peko Reference) Tests ---');
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

  const tasksCss = fs.readFileSync(path.join(__dirname, '../css/tasks.css'), 'utf8');
  const taskModalCss = fs.readFileSync(path.join(__dirname, '../css/task-modal.css'), 'utf8');
  const modalCss = fs.readFileSync(path.join(__dirname, '../css/modal.css'), 'utf8');
  const tasksHtml = fs.readFileSync(path.join(__dirname, '../tasks.html'), 'utf8');

  // Check line counts
  const tasksCssLines = tasksCss.split('\n').length;
  const taskModalCssLines = taskModalCss.split('\n').length;
  const modalCssLines = modalCss.split('\n').length;
  const tasksHtmlLines = tasksHtml.split('\n').length;

  assert('css/tasks.css line count <= 150 (' + tasksCssLines + ')', tasksCssLines <= 150);
  assert('css/task-modal.css line count <= 150 (' + taskModalCssLines + ')', taskModalCssLines <= 150);
  assert('css/modal.css line count <= 150 (' + modalCssLines + ')', modalCssLines <= 150);
  assert('tasks.html line count <= 150 (' + tasksHtmlLines + ')', tasksHtmlLines <= 150);

  // 1. Task list card-hybrid & shadow & radius
  assert('Tasks container has rounded corners (var(--radius-lg)) and soft shadow',
    tasksCss.includes('--radius-lg') && tasksCss.includes('--shadow-card'));
  assert('Mobile card view has rounded corners and soft shadow',
    tasksCss.includes('@media (max-width: 768px)') && tasksCss.includes('--shadow-card'));

  // 2. Status badges: coral for active/pending, soft green only for completed, red for rework
  assert('css/modal.css badge-orange uses pastel-peach and color-primary',
    modalCss.includes('.badge-orange') && modalCss.includes('var(--pastel-peach)') && modalCss.includes('var(--color-primary)'));
  assert('css/modal.css badge-amber uses pastel-peach and color-primary',
    modalCss.includes('.badge-amber') && modalCss.includes('var(--pastel-peach)') && modalCss.includes('var(--color-primary)'));
  assert('css/modal.css badge-green uses color-green-soft and color-green',
    modalCss.includes('.badge-green') && modalCss.includes('var(--color-green-soft)') && modalCss.includes('var(--color-green)'));
  assert('css/modal.css badge-red uses color-red or danger style',
    modalCss.includes('.badge-red') && modalCss.includes('var(--color-red)'));

  // 3. Filters/tabs: pill shape, coral active, gray inactive
  assert('Filter bar and controls use rounded pill styling',
    tasksCss.includes('--radius-pill') && tasksCss.includes('#statusFilter'));
  assert('Active filter pill uses var(--color-primary)',
    tasksCss.includes('.filter-pill.active') && tasksCss.includes('var(--color-primary)'));

  // 4. New Task modal: white card, large rounded corners, soft shadow, coral submit, gray cancel
  assert('Task modal card has large rounded corners (var(--radius-xl)) and soft shadow',
    taskModalCss.includes('--radius-xl') && taskModalCss.includes('rgba(0, 0, 0, 0.12)'));
  assert('Submit button uses var(--color-primary) and pill radius',
    taskModalCss.includes('#ntSubmitBtn') && taskModalCss.includes('var(--color-primary)'));
  assert('Cancel button is styled neutral gray with pill radius',
    taskModalCss.includes('#ntCancelBtn') && taskModalCss.includes('--radius-pill'));

  // 5. Modal tabs coral active indicator
  assert('Modal tabs active button uses var(--color-primary)',
    taskModalCss.includes('.modal-tab-btn.active') && taskModalCss.includes('var(--color-primary)'));

  // 6. Suggestion chips: pastel background (peach/lavender/mint) and pill shape
  assert('Suggested chips use rounded pill shape',
    taskModalCss.includes('.suggested-chip') && taskModalCss.includes('--radius-pill'));
  assert('Suggested chips cycle pastel peach, lavender, mint',
    taskModalCss.includes('--pastel-peach') && taskModalCss.includes('--pastel-lavender') && taskModalCss.includes('--pastel-mint'));
  assert('Selected chip fills with var(--color-primary)',
    taskModalCss.includes('.suggested-chip.selected') && taskModalCss.includes('var(--color-primary)'));

  // 7. Timeline dots in detail modal use coral
  assert('Timeline dots use var(--color-primary)',
    taskModalCss.includes('.timeline-item::before') && taskModalCss.includes('var(--color-primary)'));

  // 8. Modal close button uses .modal-close-btn
  assert('Modal close button uses .modal-close-btn circular pattern',
    modalCss.includes('.modal-close-btn') && modalCss.includes('border-radius: 50%'));

  console.log(`\nResult: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
