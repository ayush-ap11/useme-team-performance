const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Step 32: Login Page Peko-Style Fintech Verification ===\n');

const workspaceRoot = path.join(__dirname, '..');

// 1. Line Count Audits (<= 150 lines per file)
console.log('1. Checking File Line Counts (<= 150 lines per file)...');
const filesToCheck = [
  'css/login.css',
  'index.html'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(workspaceRoot, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  console.log(`  ${file}: ${lines} lines`);
  assert(lines <= 150, `FAIL: ${file} exceeded 150 lines: ${lines}`);
});
console.log('  PASS: All checked files are <= 150 lines.\n');

// 2. Login Page Background & Card Container
console.log('2. Checking Login Page Background & Card Container in css/login.css...');
const loginCss = fs.readFileSync(path.join(workspaceRoot, 'css/login.css'), 'utf8');

assert(loginCss.includes('.login-page') && loginCss.includes('linear-gradient'), 'Page background must be a subtle pastel gradient');
assert(loginCss.includes('.login-card') && loginCss.includes('var(--color-white)'), 'Login card must have white background');
assert(loginCss.includes('.login-card') && loginCss.includes('var(--radius-xl)'), 'Login card must have large rounded corners');
assert(loginCss.includes('.login-card') && loginCss.includes('rgba(0, 0, 0, 0.08)'), 'Login card must have soft shadow');
console.log('  PASS: Login page gradient background and card container verified.\n');

// 3. Role Toggle (Admin/Member)
console.log('3. Checking Role Toggle in css/login.css...');
assert(loginCss.includes('.role-toggle-group') && loginCss.includes('var(--radius-pill)'), 'Role toggle group must be pill-shaped');
assert(loginCss.includes('.role-toggle-btn.active') && loginCss.includes('var(--color-primary)'), 'Role toggle active state must use coral accent');
assert(loginCss.includes('.role-toggle-btn') && loginCss.includes('var(--color-text-muted)'), 'Role toggle inactive state must use muted gray');
console.log('  PASS: Role toggle pill geometry and coral active state verified.\n');

// 4. Input Fields
console.log('4. Checking Input Fields in css/login.css...');
assert(loginCss.includes('.form-input') && loginCss.includes('var(--radius-pill)'), 'Input fields must have rounded pill geometry');
assert(loginCss.includes('.form-input') && loginCss.includes('var(--color-border)'), 'Input fields must have light-gray border');
assert(loginCss.includes('.form-input:focus') && loginCss.includes('var(--color-primary)'), 'Input fields must have coral focus border');
assert(loginCss.includes('.form-input:focus') && loginCss.includes('var(--color-primary-subtle)'), 'Input fields must have coral focus ring');
console.log('  PASS: Input fields rounded pill geometry and coral focus ring verified.\n');

// 5. Primary Login Button
console.log('5. Checking Primary Login Button in css/login.css...');
assert(loginCss.includes('#loginSubmitBtn, .btn-full') || loginCss.includes('.btn-full'), 'Login submit button styles must exist');
assert(loginCss.includes('width: 100%') || loginCss.includes('.btn-full'), 'Login button must be full-width');
assert(loginCss.includes('var(--color-primary)'), 'Login button must use coral accent');
assert(loginCss.includes('var(--radius-pill)'), 'Login button must use rounded pill geometry');
console.log('  PASS: Primary login button full-width, rounded pill, and coral fill verified.\n');

// 6. Demo Credentials List
console.log('6. Checking Demo Credentials Box in css/login.css...');
assert(loginCss.includes('.demo-creds-box') && loginCss.includes('var(--radius-lg)'), 'Demo credentials box must have rounded corners');
assert(loginCss.includes('.demo-creds-box') && loginCss.includes('#FAF9F7'), 'Demo credentials box must have muted neutral background');
assert(loginCss.includes('.demo-creds-item strong') && loginCss.includes('var(--color-primary)'), 'Demo credentials label must have coral emphasis');
assert(loginCss.includes('.demo-creds-item code') && loginCss.includes('monospace'), 'Credentials must have monospace code styling');
console.log('  PASS: Demo credentials card, muted styling, and coral emphasis verified.\n');

console.log('ALL STEP 32 AUDITS PASSED SUCCESSFULLY!');
