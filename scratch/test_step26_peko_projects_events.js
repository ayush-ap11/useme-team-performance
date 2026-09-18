const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Step 26: Restyle Projects & Events Pages (Peko Reference) Tests ---');
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

  const projCss = fs.readFileSync(path.join(__dirname, '../css/projects.css'), 'utf8');
  const projModalCss = fs.readFileSync(path.join(__dirname, '../css/project-modal.css'), 'utf8');
  const projHtml = fs.readFileSync(path.join(__dirname, '../projects.html'), 'utf8');
  const evCss = fs.readFileSync(path.join(__dirname, '../css/events.css'), 'utf8');
  const evModalCss = fs.readFileSync(path.join(__dirname, '../css/event-modal.css'), 'utf8');
  const evHtml = fs.readFileSync(path.join(__dirname, '../events.html'), 'utf8');

  // 1. Line counts <= 150
  assert(`css/projects.css line count <= 150 (${projCss.split('\n').length})`, projCss.split('\n').length <= 150);
  assert(`css/project-modal.css line count <= 150 (${projModalCss.split('\n').length})`, projModalCss.split('\n').length <= 150);
  assert(`projects.html line count <= 150 (${projHtml.split('\n').length})`, projHtml.split('\n').length <= 150);
  assert(`css/events.css line count <= 150 (${evCss.split('\n').length})`, evCss.split('\n').length <= 150);
  assert(`css/event-modal.css line count <= 150 (${evModalCss.split('\n').length})`, evModalCss.split('\n').length <= 150);
  assert(`events.html line count <= 150 (${evHtml.split('\n').length})`, evHtml.split('\n').length <= 150);

  // 2. Project cards: white background, rounded corners, soft shadow
  assert('Project card has rounded corners (var(--radius-lg)) and soft shadow',
    projCss.includes('.project-card') && projCss.includes('var(--radius-lg)') && projCss.includes('var(--shadow-card)'));

  // 3. Project icon badge: circular, soft pastel peach, coral icon
  assert('Project icon wrapper is circular with pastel-peach background and coral color',
    projCss.includes('.proj-icon-wrapper') && projCss.includes('border-radius: 50%') && projCss.includes('var(--pastel-peach)') && projCss.includes('var(--color-primary)'));

  // 4. Progress bar: coral fill on light-gray track, rounded ends, bold percentage
  assert('Project progress bar has light gray track (#E5E7EB) and pill radius',
    projCss.includes('.progress-bar-bg') && projCss.includes('#E5E7EB') && projCss.includes('var(--radius-pill)'));
  assert('Project progress bar fill is coral (var(--color-primary)) with pill radius',
    projCss.includes('.progress-bar-fill') && projCss.includes('var(--color-primary)') && projCss.includes('var(--radius-pill)'));
  assert('Project progress bar fill in project-modal.css is also coral (var(--color-primary))',
    projModalCss.includes('.progress-bar-fill') && projModalCss.includes('var(--color-primary)'));
  assert('Percentage label is styled bold in projects.css',
    projCss.includes('.progress-info span:last-child') && projCss.includes('font-weight: 700'));

  // 5. Event cards: white background, rounded corners, soft shadow
  assert('Event card has rounded corners (var(--radius-lg)) and soft shadow',
    evCss.includes('.event-card') && evCss.includes('var(--radius-lg)') && evCss.includes('var(--shadow-card)'));

  // 6. Event icon badge: circular, soft pastel lavender, coral icon
  assert('Event icon wrapper is circular with pastel-lavender background and coral color',
    evCss.includes('.event-icon-wrapper') && evCss.includes('border-radius: 50%') && evCss.includes('var(--pastel-lavender)') && evCss.includes('var(--color-primary)'));

  // 7. Venue box: soft pastel background, coral icon accent
  assert('Event venue row has pastel-lavender background and coral icon',
    evCss.includes('.event-venue-row') && evCss.includes('var(--pastel-lavender)') && evCss.includes('var(--color-primary)'));

  // 8. Venue double-booking conflict warning banner kept as danger red
  assert('Conflict alert banner remains danger red (#FEF2F2, var(--color-red))',
    projModalCss.includes('.conflict-alert') && projModalCss.includes('#FEF2F2') && projModalCss.includes('var(--color-red)'));

  // 9. Crew/role-tag chips: rounded pill chips, soft pastel background
  assert('Event role tags are rounded pills with pastel cycling',
    evModalCss.includes('.event-role-badge') && evModalCss.includes('var(--radius-pill)') && evModalCss.includes('var(--pastel-peach)'));
  assert('Event member chips are rounded pills with coral mini avatar',
    evModalCss.includes('.event-member-chip') && evModalCss.includes('var(--radius-pill)') && evModalCss.includes('.avatar-mini') && evModalCss.includes('var(--color-primary)'));
  assert('Project modal role tags are rounded pills with pastel cycling',
    projModalCss.includes('.role-tag') && projModalCss.includes('var(--radius-pill)') && projModalCss.includes('var(--pastel-peach)'));

  console.log(`\nResult: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
