const fs = require('fs');
const assert = require('assert');

// Setup browser-like globals
global.window = {
  location: { href: 'http://localhost' },
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

// Load dependencies
require('../js/mock-data.js');
require('../js/data-store.js');
require('../js/data-store-writes.js');
require('../js/data-store-team-writes.js');
require('../js/hierarchy-seed.js');

const DS = window.DataStore;
console.log('1. Testing DataStore initialization & unassigned members...');
const initialUnassigned = DS.getUnassignedMembers();
console.log('Initial unassigned count:', initialUnassigned.length);
assert(initialUnassigned.length >= 2, 'Should have at least 2 seeded unassigned members');
assert(initialUnassigned.some(m => m.name === 'Kavita Rao'), 'Kavita Rao should be unassigned');

console.log('2. Testing DS.registerMember()...');
const regResult = DS.registerMember({
  name: 'Divya Nair',
  email: 'divya.nair@useme.in',
  username: 'divya.nair',
  password: 'Password@123'
});
console.log('Registered member:', regResult.id, regResult.name, regResult.role, regResult.isUnassigned);
assert.strictEqual(regResult.name, 'Divya Nair');
assert.strictEqual(regResult.role, 'Unassigned');
assert.strictEqual(regResult.isUnassigned, true);
assert.strictEqual(regResult.reportsTo, null);

console.log('3. Testing authentication of newly registered member...');
const authUser = DS.authenticate('divya.nair', 'Password@123', 'member');
assert(authUser, 'Registered member should authenticate successfully');
assert.strictEqual(authUser.username, 'divya.nair');

console.log('4. Testing duplicate check on registration...');
assert.throws(() => {
  DS.registerMember({
    name: 'Duplicate',
    email: 'divya.nair@useme.in',
    username: 'divya.nair2',
    password: 'Password@123'
  });
}, /already exists/);

console.log('5. Testing getUnassignedMembers includes new registration...');
const unassignedList = DS.getUnassignedMembers();
assert(unassignedList.some(m => m.id === regResult.id), 'Newly registered member should be in unassigned list');

console.log('6. Testing DS.assignMemberToHierarchy()...');
const adminUser = { id: 'm1', role: 'admin' };
const assignedMember = DS.assignMemberToHierarchy(regResult.id, {
  role: 'Full Stack Engineer',
  department: 'Engineering',
  reportsTo: 'emp-1',
  band: 'L4 - Specialist',
  location: 'Bangalore, IN',
  startDate: '2026-09-18',
  skillCategory: 'dev'
}, adminUser);

console.log('Assigned member:', assignedMember.id, assignedMember.role, assignedMember.department, 'isUnassigned:', assignedMember.isUnassigned);
assert.strictEqual(assignedMember.isUnassigned, false);
assert.strictEqual(assignedMember.role, 'Full Stack Engineer');
assert.strictEqual(assignedMember.reportsTo, 'emp-1');

console.log('7. Verifying member is removed from unassigned list...');
const updatedUnassigned = DS.getUnassignedMembers();
assert(!updatedUnassigned.some(m => m.id === regResult.id), 'Assigned member must no longer be unassigned');

console.log('8. Testing buildHierarchy() integration...');
const tree = (window.buildHierarchy || global.buildHierarchy)();
const ceo = tree.find(e => e.id === 'emp-1');
assert(ceo, 'CEO emp-1 should exist');
const memberNode = tree.find(e => e.id === regResult.id);
assert(memberNode, 'Assigned member should be present in the hierarchy tree');
assert.strictEqual(memberNode.managerId, 'emp-1');
assert(ceo.directReportIds.includes(regResult.id), 'CEO should have assigned member in directReportIds');

console.log('9. Checking line counts of files with strict <= 150 lines constraint...');
const checkFiles = [
  'js/login.js',
  'css/login.css',
  'js/new-member-modal.js',
  'js/hierarchy.js',
  'js/hierarchy-seed.js'
];
checkFiles.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  console.log(`  ${f}: ${lines} lines`);
  assert(lines <= 150, `${f} has ${lines} lines, exceeding 150 lines limit!`);
});

console.log('\n✓ ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
