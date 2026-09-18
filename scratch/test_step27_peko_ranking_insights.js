const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Step 27: Restyle Ranking & Insights Pages (Peko Reference) Tests ---');
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

  const rankCss = fs.readFileSync(path.join(__dirname, '../css/ranking.css'), 'utf8');
  const insightsCss = fs.readFileSync(path.join(__dirname, '../css/insights.css'), 'utf8');
  const rankHtml = fs.readFileSync(path.join(__dirname, '../ranking.html'), 'utf8');
  const insightsHtml = fs.readFileSync(path.join(__dirname, '../insights.html'), 'utf8');

  // 1. Line counts <= 150
  assert(`css/ranking.css line count <= 150 (${rankCss.split('\n').length})`, rankCss.split('\n').length <= 150);
  assert(`css/insights.css line count <= 150 (${insightsCss.split('\n').length})`, insightsCss.split('\n').length <= 150);
  assert(`ranking.html line count <= 150 (${rankHtml.split('\n').length})`, rankHtml.split('\n').length <= 150);
  assert(`insights.html line count <= 150 (${insightsHtml.split('\n').length})`, insightsHtml.split('\n').length <= 150);

  // 2. Podium (top-3): white/soft-pastel, rounded corners, soft shadow
  assert('Podium card has rounded corners (var(--radius-lg)) and soft shadow',
    rankCss.includes('.podium-card') && rankCss.includes('var(--radius-lg)') && rankCss.includes('var(--shadow-card)'));
  assert('1st place podium card has coral border and accent',
    rankCss.includes('.podium-card.first') && rankCss.includes('var(--color-primary)'));
  assert('1st place badge and avatar use var(--color-primary)',
    rankCss.includes('.podium-card.first .podium-badge') && rankCss.includes('.podium-card.first .podium-avatar') && rankCss.includes('var(--color-primary)'));
  assert('2nd and 3rd place have gray-toned badges and avatars',
    rankCss.includes('.podium-card.second .podium-badge') && rankCss.includes('#E5E7EB') && rankCss.includes('.podium-card.third .podium-badge') && rankCss.includes('#F3F4F6'));

  // 3. Leaderboard rows: white background, rounded corners on container, bold rank, coral own-row highlight
  assert('Leaderboard table container has rounded corners (var(--radius-lg)) and soft shadow',
    rankCss.includes('.rank-table-container') && rankCss.includes('var(--radius-lg)') && rankCss.includes('var(--shadow-card)'));
  assert('Leaderboard rows have bold rank number',
    rankCss.includes('.tasks-table td:first-child') && rankCss.includes('font-weight: 800'));
  assert('Own-row highlight uses pastel-peach background and coral left border',
    rankCss.includes('.rank-row.my-row') && rankCss.includes('var(--pastel-peach)') && rankCss.includes('var(--color-primary)'));

  // 4. Skill-category filter chips: rounded pill, coral active, gray inactive
  assert('Rank filter chips have rounded pill shape',
    rankCss.includes('.rank-chip') && rankCss.includes('var(--radius-pill)'));
  assert('Rank filter chips active state uses var(--color-primary)',
    rankCss.includes('.rank-chip.active') && rankCss.includes('var(--color-primary)'));

  // 5. Insights diagnostic cards: white card, rounded corners, soft shadow
  assert('Insight card has rounded corners (var(--radius-lg)) and soft shadow',
    insightsCss.includes('.insight-card') && insightsCss.includes('var(--radius-lg)') && insightsCss.includes('var(--shadow-card)'));

  // 6. Severity left borders: high = danger red, medium = coral, low = soft green
  assert('High severity card has red left border',
    insightsCss.includes('.insight-card.severity-high') && insightsCss.includes('var(--color-red)'));
  assert('Medium severity card has coral left border (var(--color-primary))',
    insightsCss.includes('.insight-card.severity-medium') && insightsCss.includes('var(--color-primary)'));
  assert('Low severity card has green left border (var(--color-green))',
    insightsCss.includes('.insight-card.severity-low') && insightsCss.includes('var(--color-green)'));

  // 7. Meta bar & action links
  assert('Insights meta bar has rounded corners and soft shadow',
    insightsCss.includes('.insights-meta-bar') && insightsCss.includes('var(--radius-lg)') && insightsCss.includes('var(--shadow-card)'));
  assert('Insights action link uses coral accent (var(--color-primary))',
    insightsCss.includes('.insight-link') && insightsCss.includes('var(--color-primary)'));

  console.log(`\nResult: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
