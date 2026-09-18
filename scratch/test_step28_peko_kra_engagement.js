const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Step 28: Restyle KRA & KPI and Engagement/Motivation Pages (Peko Reference) Tests ---');
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

  const kraCss = fs.readFileSync(path.join(__dirname, '../css/kra.css'), 'utf8');
  const engCss = fs.readFileSync(path.join(__dirname, '../css/engagement.css'), 'utf8');
  const kraHtml = fs.readFileSync(path.join(__dirname, '../kra.html'), 'utf8');

  // 1. Line counts <= 150
  assert(`css/kra.css line count <= 150 (${kraCss.split('\n').length})`, kraCss.split('\n').length <= 150);
  assert(`css/engagement.css line count <= 150 (${engCss.split('\n').length})`, engCss.split('\n').length <= 150);
  assert(`kra.html line count <= 150 (${kraHtml.split('\n').length})`, kraHtml.split('\n').length <= 150);

  // 2. Member search combobox: fixed width 320px, rounded pill, coral focus, dropdown rounded/shadow
  assert('Combobox has fixed width 320px',
    kraCss.includes('.kra-combo { position: relative; width: 320px; }') || kraCss.includes('width: 320px;'));
  assert('Combobox input wrap has pill radius and coral focus ring',
    kraCss.includes('.kra-combo-input-wrap') && kraCss.includes('var(--radius-pill)') && kraCss.includes('var(--color-primary)'));
  assert('Combobox dropdown panel has rounded geometry and deep shadow',
    kraCss.includes('.kra-combo-panel') && kraCss.includes('var(--radius-lg)') && kraCss.includes('rgba(0,0,0,0.12)'));

  // 3. Trajectory chart: rounded card, soft shadow, coral legend dot
  assert('Trajectory chart card has rounded geometry (var(--radius-lg)) and soft shadow',
    kraCss.includes('.kra-chart-card') && kraCss.includes('var(--radius-lg)') && kraCss.includes('var(--shadow-card)'));
  assert('Trajectory chart legend dot uses coral (var(--color-primary))',
    kraCss.includes('.kra-legend .legend-dot') && kraCss.includes('var(--color-primary)'));

  // 4. Pillar breakdown table: rounded container, gray-on-white header, RAG status dots recolored
  assert('Pillar table container has rounded geometry (var(--radius-lg)) and soft shadow',
    kraCss.includes('.kra-table-card') && kraCss.includes('var(--radius-lg)') && kraCss.includes('var(--shadow-card)'));
  assert('Pillar table header is styled gray-on-white (#FAF9F7)',
    kraCss.includes('.kra-table th') && kraCss.includes('#FAF9F7'));
  assert('RAG dots follow finalized palette (green, coral/primary, red)',
    kraCss.includes('.rag-dot.rag-amber') && kraCss.includes('var(--color-primary)') && kraCss.includes('.rag-dot.rag-red') && kraCss.includes('var(--color-red)'));

  // 5. Engagement (coral) and Motivation (green) tabs
  assert('Engagement active tab uses var(--color-primary)',
    engCss.includes('.tab-btn.tab-eng.active') && engCss.includes('var(--color-primary)'));
  assert('Motivation active tab uses var(--color-green)',
    engCss.includes('.tab-btn.tab-mot.active') && engCss.includes('var(--color-green)'));

  // 6. Activity cards with sparklines: rounded card, soft shadow, sparkline accent
  assert('Channel activity card has rounded geometry (var(--radius-lg)) and soft shadow',
    engCss.includes('.channel-card') && engCss.includes('var(--radius-lg)') && engCss.includes('var(--shadow-card)'));
  assert('Engagement sparklines use var(--color-primary)',
    engCss.includes('.eng-activity-grid .sparkline-svg polyline') && engCss.includes('var(--color-primary)'));
  assert('Motivation sparklines use var(--color-green)',
    engCss.includes('.mot-cards-grid .sparkline-svg polyline') && engCss.includes('var(--color-green)'));

  // 7. Scoring breakdown tables consistent styling
  assert('Scoring breakdown cards have rounded geometry and soft shadow',
    engCss.includes('.eng-breakdown-card') && engCss.includes('var(--radius-lg)') && engCss.includes('var(--shadow-card)'));

  // 8. Zoom attendance roster: present = green, late = coral, absent = red
  assert('Attendance segment present uses var(--color-green)',
    engCss.includes('.att-seg-btn.active-present') && engCss.includes('var(--color-green)'));
  assert('Attendance segment late uses var(--color-primary) (coral)',
    engCss.includes('.att-seg-btn.active-late') && engCss.includes('var(--color-primary)'));
  assert('Attendance segment absent uses var(--color-red)',
    engCss.includes('.att-seg-btn.active-absent') && engCss.includes('var(--color-red)'));

  console.log(`\nResult: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
