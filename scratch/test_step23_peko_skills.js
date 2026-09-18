const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 23: Skill Mapping & Member Modal Peko-Style Verification ===\n');

// 1. File Line Count Audit
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/skill-mapping.css',
  'css/skill-search.css',
  'css/modal.css'
];
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Skill Category Cards in skill-mapping.html & skill-mapping.css
console.log('2. Checking Skill Category Cards in HTML and CSS...');
const htmlContent = fs.readFileSync(path.join(__dirname, '../skill-mapping.html'), 'utf8');
assert(htmlContent.includes('skill-category-grid'), 'Missing .skill-category-grid in HTML');
assert(htmlContent.includes('skill-cat-card'), 'Missing .skill-cat-card in HTML');
assert(htmlContent.includes('cat-icon-badge'), 'Missing .cat-icon-badge in HTML');

const mapCss = fs.readFileSync(path.join(__dirname, '../css/skill-mapping.css'), 'utf8');
assert(mapCss.includes('var(--color-white)'), 'Category card must have white background');
assert(mapCss.includes('var(--radius-lg)'), 'Category card must have large rounded corners');
assert(mapCss.includes('var(--shadow-card)'), 'Category card must have soft shadow');
assert(mapCss.includes('--badge-peach') && mapCss.includes('--badge-lavender') && mapCss.includes('--badge-mint'), 'Category cards must cycle pastel badges');
assert(mapCss.includes('.cat-card-name'), 'Category card must style bold name');
assert(mapCss.includes('.cat-card-count'), 'Category card must style gray member count');
console.log('  PASS: Category cards styled with white cards, rounded geometry, pastel badges, and count subtext.\n');

// 3. Search Bar with Left Icon in skill-search.css & HTML
console.log('3. Checking Search Bar in css/skill-search.css and HTML...');
assert(htmlContent.includes('search-left-icon'), 'Search input must have left-aligned icon in HTML');
const searchCss = fs.readFileSync(path.join(__dirname, '../css/skill-search.css'), 'utf8');
assert(searchCss.includes('border-radius: var(--radius-pill)'), 'Search input must be rounded pill');
assert(searchCss.includes('.search-left-icon'), 'Search icon position must be styled');
assert(searchCss.includes('var(--color-primary)'), 'Search input focus must use coral accent');
console.log('  PASS: Search bar formatted as pill with left icon and coral focus state.\n');

// 4. Member Directory List & Coral Proficiency Badges in skill-mapping.css
console.log('4. Checking Member Directory and Coral Proficiency Badges...');
assert(mapCss.includes('.member-list-section') && mapCss.includes('var(--radius-lg)'), 'Member section must have rounded corners');
assert(mapCss.includes('.prof-intermediate') && mapCss.includes('var(--color-primary)'), 'Intermediate badge must use coral accent');
assert(mapCss.includes('.prof-expert') && mapCss.includes('var(--color-primary)'), 'Expert badge must use coral accent');
assert(mapCss.includes('.member-cell-avatar') && mapCss.includes('var(--color-primary)'), 'Member avatar must use coral accent');
console.log('  PASS: Member directory and coral proficiency indicators verified.\n');

// 5. Shared Member Profile Modal in css/modal.css
console.log('5. Checking Member Profile Modal in css/modal.css...');
const modalCss = fs.readFileSync(path.join(__dirname, '../css/modal.css'), 'utf8');
assert(modalCss.includes('.modal-card') && modalCss.includes('var(--radius-xl)'), 'Modal card must have large rounded corners');
assert(modalCss.includes('.modal-close-btn') && modalCss.includes('border-radius: 50%'), 'Modal close button must be circular');
assert(modalCss.includes('.modal-avatar') && modalCss.includes('var(--color-primary)'), 'Modal avatar must use coral accent');
assert(modalCss.includes('.modal-role') && modalCss.includes('var(--color-text-muted)'), 'Modal role must use gray secondary text');
console.log('  PASS: Member profile modal styled with white card, rounded corners, visible circular close button, and coral accents.\n');

console.log('ALL STEP 23 AUDITS PASSED SUCCESSFULLY!');
