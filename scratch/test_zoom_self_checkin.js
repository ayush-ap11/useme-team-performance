const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Zoom Self-Check-in, Motivation Programs & Submissions Log Tests ---');
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

  // 1. Line counts <= 150
  const zoomJs = fs.readFileSync(path.join(__dirname, '../js/zoom-self-capture.js'), 'utf8');
  const engCss = fs.readFileSync(path.join(__dirname, '../css/engagement.css'), 'utf8');
  assert(`js/zoom-self-capture.js line count <= 150 (${zoomJs.split('\n').length})`, zoomJs.split('\n').length <= 150);
  assert(`css/engagement.css line count <= 150 (${engCss.split('\n').length})`, engCss.split('\n').length <= 150);

  // 2. CSS Styles
  assert('CSS has .btn-coral-live primary coral button styling', engCss.includes('.btn-coral-live') && engCss.includes('var(--color-primary)'));
  assert('CSS has .btn-join-call.confirmed styling', engCss.includes('.btn-join-call.confirmed'));
  assert('CSS has .prog-btn styling for program cards', engCss.includes('.prog-btn') && engCss.includes('var(--pastel-peach)'));
  assert('CSS has suggested-present and suggested-late roster button styling', engCss.includes('.att-seg-btn.suggested-present') && engCss.includes('.att-seg-btn.suggested-late'));
  assert('CSS has suggested source-tag styling', engCss.includes('.source-tag.self-capture.suggested'));

  // 3. Logic verification with mock DOM/DataStore
  global.window = {};
  let openedUrl = null;
  let openedTarget = null;
  global.window.open = (url, target, features) => {
    openedUrl = url;
    openedTarget = target;
  };

  const mockUser = { id: 'm1', role: 'Member', name: 'Aditya Sharma' };
  const adminUser = { id: 'admin', role: 'Admin', name: 'Admin' };

  let zoomSessions = [{
    id: 'z-live',
    title: 'Meeting Link (Live)',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00 AM',
    scheduledStart: new Date(Date.now() - 2 * 60000).toISOString(),
    sessionEnd: new Date(Date.now() + 58 * 60000).toISOString(),
    status: 'live',
    zoomUrl: 'https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync',
    attendance: {},
    attendanceRecords: {},
    pendingCheckIns: {}
  }];

  const DataStore = {
    getCurrentUser: () => mockUser,
    getZoomSessions: () => zoomSessions,
    getZoomSessionById: (id) => zoomSessions.find(z => z.id === id),
    recordZoomSelfCapture: (sid, mid, captureTime, u) => {
      const sess = zoomSessions.find(z => z.id === sid);
      const start = new Date(sess.scheduledStart).getTime();
      const capTime = captureTime ? new Date(captureTime).getTime() : Date.now();
      const diffMin = (capTime - start) / 60000;
      const status = diffMin <= 5 ? 'present' : (diffMin <= 15 ? 'late' : 'absent');
      sess.pendingCheckIns = sess.pendingCheckIns || {};
      sess.pendingCheckIns[mid] = {
        sessionId: sess.id,
        memberId: mid,
        capturedAt: new Date(capTime).toISOString(),
        timeStr: new Date(capTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedStatus: status
      };
      sess.attendanceRecords = sess.attendanceRecords || {};
      sess.attendanceRecords[mid] = { sessionId: sess.id, memberId: mid, capturedAt: new Date(capTime).toISOString(), status, source: 'self-capture', pending: true };
      return sess;
    },
    setZoomAttendance: (sid, mid, st, u) => {
      const sess = zoomSessions.find(z => z.id === sid);
      sess.attendance = sess.attendance || {};
      sess.attendance[mid] = st;
      sess.attendanceRecords = sess.attendanceRecords || {};
      sess.attendanceRecords[mid] = { sessionId: sess.id, memberId: mid, capturedAt: new Date().toISOString(), status: st, source: 'admin-override' };
      if (sess.pendingCheckIns?.[mid]) sess.pendingCheckIns[mid].confirmed = true;
      return sess;
    }
  };
  global.window.DataStore = DataStore;

  // Mock document
  let clickHandler = null;
  global.document = {
    getElementById: (id) => {
      if (id === 'btnJoinZoomCall') {
        return {
          set onclick(fn) { clickHandler = fn; },
          get onclick() { return clickHandler; }
        };
      }
      return null;
    }
  };

  // Execute zoom-self-capture.js code
  eval(zoomJs);

  const captureCtrl = global.window.ZOOM_SELF_CAPTURE;
  assert('ZOOM_SELF_CAPTURE module loaded', !!captureCtrl);

  const active = captureCtrl.getActiveOrUpcomingSession();
  assert('Active session detected as live', active && active.isLive && active.session.id === 'z-live');

  // State 1: Before member clicks: show ONLY single coral "Join" button (no badge!)
  const mockContainer = { innerHTML: '' };
  captureCtrl.renderJoinCallBanner(mockContainer, 'm1');
  assert('State 1: Banner renders single "Join" button', mockContainer.innerHTML.includes("<span>Join</span>"));
  assert('State 1: Button uses primary coral styling (btn-coral-live)', mockContainer.innerHTML.includes("btn-coral-live"));
  assert('State 1: No status badge is rendered', !mockContainer.innerHTML.includes('status-badge'));

  // Test Join Click: window.open Zoom URL + Record Check-in together
  assert('Join button click handler is wired up', typeof clickHandler === 'function');
  clickHandler();
  assert('Join click opens Zoom meeting URL in a new tab', openedUrl === 'https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync' && openedTarget === '_blank');
  assert('Join click simultaneously captures pending check-in', zoomSessions[0].pendingCheckIns?.m1?.suggestedStatus === 'present');

  // State 2: After member clicks: button becomes "Checked In at [time]" with checkmark - ONLY state shown
  captureCtrl.renderJoinCallBanner(mockContainer, 'm1');
  assert('State 2: Banner renders ONLY "Checked In at ..."', mockContainer.innerHTML.includes("Checked In at"));
  assert('State 2: Button is disabled after checked in', mockContainer.innerHTML.includes("disabled"));
  assert('State 2: No separate admin-status badge is shown', !mockContainer.innerHTML.includes('CONFIRMED'));

  // Test Fallback if session has no zoomUrl configured
  openedUrl = null;
  const noZoomSession = {
    id: 'z-no-url',
    title: 'Daily Sync Without URL',
    date: new Date().toISOString().slice(0, 10),
    time: '11:00 AM',
    scheduledStart: new Date(Date.now() - 2 * 60000).toISOString(),
    sessionEnd: new Date(Date.now() + 58 * 60000).toISOString(),
    status: 'live',
    attendance: {},
    attendanceRecords: {},
    pendingCheckIns: {}
  };
  zoomSessions.unshift(noZoomSession);
  captureCtrl.renderJoinCallBanner(mockContainer, 'm2');
  assert('Join button wired for session without zoomUrl', typeof clickHandler === 'function');
  clickHandler();
  assert('Fallback: window.open redirects to dummy Zoom URL when none specified on session', openedUrl === 'https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync');
  assert('Fallback: Check-in was still recorded for m2', noZoomSession.pendingCheckIns?.m2?.suggestedStatus === 'present');
  zoomSessions.shift();

  // State 3: Only after Admin confirms/overrides in roster modal should card reflect final Admin-confirmed status
  DataStore.setZoomAttendance('z-live', 'm1', 'present', adminUser);
  captureCtrl.renderJoinCallBanner(mockContainer, 'm1');
  assert('State 3: Card reflects final Admin-confirmed status (PRESENT (CONFIRMED))', mockContainer.innerHTML.includes("PRESENT (CONFIRMED)"));
  assert('State 3: Replaces the "Checked In at..." button (never both at once)', !mockContainer.innerHTML.includes("Checked In at"));

  // 4. DataStore motivationSubmissions verification
  const dsJs = fs.readFileSync(path.join(__dirname, '../js/data-store.js'), 'utf8');
  assert('data-store.js contains REALISTIC_MOTIVATION_LOGS', dsJs.includes('REALISTIC_MOTIVATION_LOGS'));
  const motCount = (dsJs.match(/id:\s*["']mot-\d+["']/g) || []).length;
  assert(`REALISTIC_MOTIVATION_LOGS has 15-20 entries (${motCount})`, motCount >= 15 && motCount <= 20);

  // 5. Engagement.js programs verification
  const engJs = fs.readFileSync(path.join(__dirname, '../js/engagement.js'), 'utf8');
  assert('engagement.js populates Team Lead Bootcamp', engJs.includes('Team Lead Bootcamp'));
  assert('engagement.js populates Communication Skills Workshop', engJs.includes('Communication Skills Workshop'));
  assert('engagement.js populates Sales Mastery Program', engJs.includes('Sales Mastery Program'));
  assert('engagement.js populates Peer Mentoring Circle', engJs.includes('Peer Mentoring Circle'));
  assert('engagement.js populates Meeting Link', engJs.includes('Meeting Link'));
  assert('engagement.js displays all motivation submissions for team log', engJs.includes('category !== \'motivation\''));
  assert('engagement.js exposes window.renderMotivationTab', engJs.includes('window.renderMotivationTab = renderMotivationTab'));

  console.log(`\nResults: ${passed}/${total} assertions passed.`);
  if (passed !== total) process.exit(1);
}

runTests();
