/**
 * Verification Script for Step 18 - Auth: Give Every Member a Real Login
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

// Mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};
global.window = global;

// Load mock-data and data-store files
const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/mock-data.js'), 'utf8');
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../js/data-store.js'), 'utf8');
const dataStoreWritesCode = fs.readFileSync(path.join(__dirname, '../js/data-store-writes.js'), 'utf8');
const dataStoreTeamWritesCode = fs.readFileSync(path.join(__dirname, '../js/data-store-team-writes.js'), 'utf8');

eval(mockDataCode);
eval(dataStoreCode);
eval(dataStoreWritesCode);
eval(dataStoreTeamWritesCode);

const DS = window.DataStore;
const adminUser = DS.getMemberById('m1');
adminUser.role = 'admin';

console.log('=== Running Step 18 Auth Verification ===\n');

// 1. SHA-256 Hashing Verification
console.log('Test 1: SHA-256 Hashing implementation');
const testStrings = ['Useme@Admin1', 'Useme@Member1', 'Useme@2026', 'P@ssw0rd!#$ 2026', ''];
testStrings.forEach(s => {
  const expected = crypto.createHash('sha256').update(s).digest('hex');
  const actual = DS.hashPassword(s);
  assert.strictEqual(actual, expected, `Hash mismatch for "${s}"`);
});
console.log('  ✓ SHA-256 produces exact NIST standard digests synchronously');

// 2. Member Credentials & No Plaintext Passwords
console.log('\nTest 2: Member Record Credentials & No Plaintext Passwords');
const members = DS.getMembers();
assert.ok(members.length >= 12, `Expected at least 12 initial members, got ${members.length}`);
members.forEach(m => {
  assert.ok(m.username, `Member ${m.id} (${m.name}) must have a username`);
  assert.ok(m.passwordHash, `Member ${m.id} (${m.name}) must have a passwordHash`);
  assert.strictEqual(m.passwordHash.length, 64, `Member ${m.id} passwordHash must be 64-char hex`);
  assert.strictEqual(m.password, undefined, `Member ${m.id} must NEVER store plaintext password`);
  assert.strictEqual(m.initialPassword, undefined, `Member ${m.id} must NEVER store plaintext initialPassword`);
  assert.strictEqual(m.tempPassword, undefined, `Member ${m.id} must NEVER store plaintext tempPassword`);
});
console.log('  ✓ All 12 members possess usernames and 64-char SHA-256 password hashes; 0 plaintext passwords');

// 3. Original 4 Accounts Work
console.log('\nTest 3: Authentication of Original 4 Accounts');
const m1Auth = DS.authenticate('aditya.sharma', 'Useme@Admin1', 'admin');
assert.ok(m1Auth, 'm1 (aditya.sharma) must authenticate');
assert.strictEqual(m1Auth.id, 'm1');
assert.strictEqual(m1Auth.role, 'admin');

const m1EmailAuth = DS.authenticate('aditya@useme.in', 'Useme@Admin1');
assert.ok(m1EmailAuth, 'm1 must authenticate via email');

const m5Auth = DS.authenticate('rahul.sen', 'Useme@Member1', 'member');
assert.ok(m5Auth, 'm5 (rahul.sen) must authenticate');
assert.strictEqual(m5Auth.id, 'm5');

const m3Auth = DS.authenticate('priya.iyer', 'Useme@Member2', 'member');
assert.ok(m3Auth, 'm3 (priya.iyer) must authenticate');
assert.strictEqual(m3Auth.id, 'm3');

const m7Auth = DS.authenticate('vikram.mehta', 'Useme@Member3', 'member');
assert.ok(m7Auth, 'm7 (vikram.mehta) must authenticate');
assert.strictEqual(m7Auth.id, 'm7');
console.log('  ✓ Original 4 accounts authenticate seamlessly with original credentials');

// 4. Remaining 8 Members Can All Log In
console.log('\nTest 4: Remaining 8 Members Can Log In');
const remainingIds = ['m2', 'm4', 'm6', 'm8', 'm9', 'm10', 'm11', 'm12'];
remainingIds.forEach(id => {
  const m = DS.getMemberById(id);
  const authByName = DS.authenticate(m.username, 'Useme@2026', 'member');
  assert.ok(authByName, `Member ${id} (${m.username}) must authenticate with username`);
  assert.strictEqual(authByName.id, id);

  const authByEmail = DS.authenticate(m.email, 'Useme@2026');
  assert.ok(authByEmail, `Member ${id} (${m.email}) must authenticate with email`);
});
console.log('  ✓ All other 8 members (100% of team) can log in via username or email with Useme@2026');

// 5. Invalid Credentials & Security Hygiene
console.log('\nTest 5: Invalid Credentials Handling');
assert.strictEqual(DS.authenticate('rahul.sen', 'WrongPassword123'), null, 'Wrong password must fail');
assert.strictEqual(DS.authenticate('nonexistent.user', 'SomePass123'), null, 'Nonexistent username must fail');
assert.strictEqual(DS.authenticate('', 'Useme@2026'), null, 'Empty user must fail');
assert.strictEqual(DS.authenticate('rahul.sen', ''), null, 'Empty pass must fail');

// Member trying to log in under Admin role toggle
const privEscalation = DS.authenticate('rahul.sen', 'Useme@Member1', 'admin');
assert.strictEqual(privEscalation, null, 'Non-admin member cannot log in as admin role');
console.log('  ✓ Failed auth returns null without leaking failure cause; privilege escalation blocked');

// 6. Onboarding New Member with Credentials
console.log('\nTest 6: Onboarding New Member with Credentials (addTeamMember)');
assert.throws(() => {
  DS.addTeamMember({ name: 'Ravi Kumar', email: 'ravi@useme.in' }, adminUser);
}, /password/i, 'Must reject onboarding without temporary password');

const newMember = DS.addTeamMember({
  name: 'Kavish Deshmukh',
  email: 'kavish@useme.in',
  username: 'kavish.deshmukh',
  initialPassword: 'TempPassword@2026',
  role: 'Cloud Operations Lead',
  department: 'Engineering',
  reportsTo: 'm1'
}, adminUser);

assert.ok(newMember.id);
assert.strictEqual(newMember.username, 'kavish.deshmukh');
assert.strictEqual(newMember.password, undefined, 'Plaintext password must not be stored on record');
assert.strictEqual(newMember.passwordHash, DS.hashPassword('TempPassword@2026'));

// Verify new member can immediately log in
const newAuth = DS.authenticate('kavish.deshmukh', 'TempPassword@2026', 'member');
assert.ok(newAuth, 'Newly onboarded member must be able to log in immediately');
assert.strictEqual(newAuth.id, newMember.id);

// Duplicate username check
assert.throws(() => {
  DS.addTeamMember({
    name: 'Duplicate Guy',
    email: 'dup@useme.in',
    username: 'kavish.deshmukh',
    initialPassword: 'SomePassword@1'
  }, adminUser);
}, /username already exists/i, 'Must reject duplicate username');
console.log('  ✓ addTeamMember requires username & temp password, hashes credentials, and enables immediate login');

// 7. Member Change Password (Self)
console.log('\nTest 7: Member Change Password (updateMemberPassword)');
const memberUser = { id: 'm5', role: 'member' };
const anotherUser = { id: 'm3', role: 'member' };

// Member trying to change someone else's password
assert.throws(() => {
  DS.updateMemberPassword('m3', 'Useme@Member2', 'NewPassword@2026', memberUser);
}, /own password/i, 'Members must not be allowed to change another member password');

// Wrong current password
assert.throws(() => {
  DS.updateMemberPassword('m5', 'IncorrectOldPass', 'NewPassword@2026', memberUser);
}, /current password is incorrect/i, 'Must reject incorrect current password');

// Short new password
assert.throws(() => {
  DS.updateMemberPassword('m5', 'Useme@Member1', '12', memberUser);
}, /at least 4 characters/i, 'Must reject password < 4 chars');

// Successful password change
const updateRes = DS.updateMemberPassword('m5', 'Useme@Member1', 'RahulNewPass@2026', memberUser);
assert.ok(updateRes.success);

// Old password no longer works
assert.strictEqual(DS.authenticate('rahul.sen', 'Useme@Member1'), null, 'Old password must no longer authenticate');

// New password works
const m5NewAuth = DS.authenticate('rahul.sen', 'RahulNewPass@2026', 'member');
assert.ok(m5NewAuth, 'New password must authenticate');
console.log('  ✓ updateMemberPassword enforces self-only, verifies current hash, and updates successfully');

// 8. Admin Reset Password
console.log('\nTest 8: Admin Reset Password (resetMemberPassword)');
// Non-admin cannot reset
assert.throws(() => {
  DS.resetMemberPassword('m6', 'AdminResetPass@2026', memberUser);
}, /admin only/i, 'Non-admin must not be allowed to reset passwords');

// Admin resets m6 without knowing old password
const resetRes = DS.resetMemberPassword('m6', 'AnanyaReset@2026', adminUser);
assert.ok(resetRes.success);

// m6 can authenticate with reset password
const m6Auth = DS.authenticate('ananya.roy', 'AnanyaReset@2026', 'member');
assert.ok(m6Auth, 'Reset password must allow member login');
console.log('  ✓ Admin can reset any member password without knowing old password');

// 9. Activity Log Audit & No Leaked Passwords
console.log('\nTest 9: Activity Logging Audit (No Plaintext Passwords in Logs)');
const log = DS.getActivityLog();
const authLogs = log.filter(l => l.relatedEntityType === 'auth');
assert.ok(authLogs.length >= 2, 'Must have at least 2 auth log entries');

authLogs.forEach(l => {
  assert.ok(!l.actionText.includes('RahulNewPass'), 'Log must NEVER contain password');
  assert.ok(!l.actionText.includes('AnanyaReset'), 'Log must NEVER contain password');
  assert.ok(!l.actionText.includes('Useme@'), 'Log must NEVER contain password');
});

const selfChangeLog = authLogs.find(l => l.actorMemberId === 'm5' && l.actionText.includes('changed their password'));
assert.ok(selfChangeLog, 'Must log "changed their password"');

const adminResetLog = authLogs.find(l => l.actorMemberId === 'm1' && l.actionText.includes('reset password'));
assert.ok(adminResetLog, 'Must log admin password reset');
console.log('  ✓ Password changes and resets audited in activityLog with 0 leaked passwords');

console.log('\n=============================================');
console.log('ALL STEP 18 TESTS PASSED SUCCESSFULLY! (9/9)');
console.log('=============================================\n');
