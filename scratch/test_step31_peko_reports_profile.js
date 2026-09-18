const fs = require('fs');
const assert = require('assert');

console.log('--- AUDITING PEKO REPORTS & PROFILE RESTYLING ---');

// 1. Line count checks (strictly <= 150 lines)
const filesToCheck = [
  'reports.html',
  'css/reports.css',
  'profile.html',
  'css/profile.css',
  'js/profile.js',
  'css/nav.css',
  'js/nav.js',
  'css/dashboard.css',
  'css/modal.css'
];

filesToCheck.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n').length;
  assert(lines <= 150, `${f} must be <= 150 lines, got ${lines}`);
  console.log(`[PASS] ${f} line count: ${lines} lines`);
});

// 2. Reports styling checks
const reportsHtml = fs.readFileSync('reports.html', 'utf8');
const reportsCss = fs.readFileSync('css/reports.css', 'utf8');

assert(reportsHtml.includes('stat-card'), 'reports.html must have stat-card elements');
assert(reportsHtml.includes('stat-icon-peach') && reportsHtml.includes('stat-icon-lavender'), 'reports.html must have stat-icon badges');
assert(reportsHtml.includes('repOverdue') && reportsHtml.includes('var(--color-red)'), 'Overdue stat must keep red warning color');
assert(reportsCss.includes('.rep-range-btn.active') && reportsCss.includes('var(--color-primary)'), 'Range button active must use coral primary');
assert(reportsCss.includes('.btn-export') && reportsCss.includes('var(--color-primary)'), 'Export button must use coral primary');
assert(reportsCss.includes('.bar-fill.green') && reportsCss.includes('var(--color-green)'), 'Completed chart bars must use color-green');
assert(reportsCss.includes('.bar-fill.red') && reportsCss.includes('var(--color-red)'), 'Rework chart bars must use color-red');
assert(reportsCss.includes('badge-amber') && reportsCss.includes('var(--pastel-peach)'), 'Skill gap pills must use soft peach');
console.log('[PASS] Reports page structure & Peko styling verified');

// 3. Profile page checks
const profileHtml = fs.readFileSync('profile.html', 'utf8');
const profileCss = fs.readFileSync('css/profile.css', 'utf8');
const profileJs = fs.readFileSync('js/profile.js', 'utf8');

assert(profileHtml.includes('profile-card'), 'profile.html must contain profile cards');
assert(profileHtml.includes('profAvatar') && profileHtml.includes('profName'), 'profile.html must have personal details');
assert(profileHtml.includes('btnEditRole') && profileHtml.includes('profilePasswordForm'), 'profile.html must have role edit & password form');
assert(profileCss.includes('var(--shadow-card)') && profileCss.includes('var(--radius-lg)'), 'profile.css must use Peko card styles');
assert(profileCss.includes('.profile-input:focus') && profileCss.includes('var(--color-primary)'), 'profile inputs must have coral focus ring');
assert(profileCss.includes('.btn-coral-pill') && profileCss.includes('var(--color-primary)'), 'profile action buttons must use coral primary');
assert(profileJs.includes('ds.getCurrentUser') || profileJs.includes('DataStore'), 'profile.js must integrate with DataStore');
console.log('[PASS] My Profile page structure & styling verified');

// 4. Sidebar footer checks
const navCss = fs.readFileSync('css/nav.css', 'utf8');
const navJs = fs.readFileSync('js/nav.js', 'utf8');

assert(navCss.includes('.role-badge') && navCss.includes('var(--color-bg)'), 'Role badge must use neutral background');
assert(navCss.includes('.nav-profile-btn') && navCss.includes('var(--color-white)'), 'Profile button must use neutral white pill');
assert(navCss.includes('.logout-btn') && navCss.includes('var(--color-primary)'), 'Logout button must use coral primary');
assert(navJs.includes('profile.html'), 'nav.js must reference profile.html');
console.log('[PASS] Sidebar footer styling & routing verified');

// 5. Palette audit (no legacy orange hex codes)
const allCssFiles = fs.readdirSync('css').filter(f => f.endsWith('.css'));
const legacyOrangeRegex = /#f5820b|#f97316|#d96b00|#fb923c|#ea580c/i;

allCssFiles.forEach(f => {
  const content = fs.readFileSync(`css/${f}`, 'utf8');
  assert(!legacyOrangeRegex.test(content), `Found legacy orange in css/${f}`);
});
console.log('[PASS] Global CSS palette audit: 0 legacy orange hex codes found');

console.log('ALL PEKO RESTYLING AUDITS PASSED!');
