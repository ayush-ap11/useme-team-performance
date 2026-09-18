/**
 * Useme Team - Login & Registration Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const tabLogin = $('tabLogin'), tabSignup = $('tabSignup');
  const loginSection = $('loginSection'), signupSection = $('signupSection');
  const demoBox = document.querySelector('.demo-creds-box');
  const rAdmin = $('roleAdmin'), rMember = $('roleMember');
  const uIn = $('username'), pIn = $('password'), lErr = $('loginError');
  const sForm = $('signupForm'), sName = $('signupName'), sEmail = $('signupEmail');
  const sUser = $('signupUsername'), sPass = $('signupPassword'), sConf = $('signupConfirmPassword'), sAlert = $('signupAlert');

  function setAuthMode(mode) {
    const isLogin = mode === 'login';
    tabLogin?.classList.toggle('active', isLogin);
    tabSignup?.classList.toggle('active', !isLogin);
    if (loginSection) loginSection.style.display = isLogin ? 'block' : 'none';
    if (signupSection) signupSection.style.display = !isLogin ? 'block' : 'none';
    if (demoBox) demoBox.style.display = isLogin ? 'block' : 'none';
    hideAlerts();
  }

  function setRole(role) {
    const isAdmin = role === 'admin';
    rAdmin?.classList.toggle('active', isAdmin);
    rMember?.classList.toggle('active', !isAdmin);
    hideAlerts();
  }

  function showAlert(el, msg, isSuccess = false) {
    if (!el) return;
    el.textContent = msg;
    el.className = `login-error visible ${isSuccess ? 'success' : ''}`;
  }

  function hideAlerts() {
    [lErr, sAlert].forEach(el => { if (el) { el.textContent = ''; el.className = 'login-error'; } });
  }

  tabLogin?.addEventListener('click', () => setAuthMode('login'));
  tabSignup?.addEventListener('click', () => setAuthMode('signup'));
  $('linkToSignup')?.addEventListener('click', (e) => { e.preventDefault(); setAuthMode('signup'); });
  $('linkToLogin')?.addEventListener('click', (e) => { e.preventDefault(); setAuthMode('login'); });

  if (rAdmin && rMember) {
    rAdmin.addEventListener('click', () => setRole('admin'));
    rMember.addEventListener('click', () => setRole('member'));
  }

  document.querySelectorAll('.demo-creds-item').forEach(item => {
    item.addEventListener('click', () => {
      const { user, pass, role } = item.dataset;
      if (user && pass) {
        setAuthMode('login'); setRole(role || 'member');
        if (uIn) uIn.value = user;
        if (pIn) pIn.value = pass;
      }
    });
  });

  if (sName && sUser) {
    sName.addEventListener('input', () => {
      if (!sUser.dataset.edited) sUser.value = sName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.');
    });
    sUser.addEventListener('input', () => { sUser.dataset.edited = 'true'; });
  }

  sForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlerts();
    const name = (sName?.value || '').trim(), email = (sEmail?.value || '').trim().toLowerCase();
    const username = (sUser?.value || '').trim().toLowerCase(), pass = (sPass?.value || '').trim(), conf = (sConf?.value || '').trim();

    if (!name || !email || !username || !pass) return showAlert(sAlert, 'Please fill in all required fields.');
    if (pass !== conf) return showAlert(sAlert, 'Passwords do not match. Please verify.');
    if (pass.length < 4) return showAlert(sAlert, 'Password must be at least 4 characters long.');
    if (!window.DataStore?.registerMember) return showAlert(sAlert, 'Registration service unavailable.');

    try {
      const reg = window.DataStore.registerMember({ name, email, username, password: pass });
      sForm.reset();
      if (sUser) delete sUser.dataset.edited;
      showAlert(sAlert, `✓ Account registered successfully for ${reg.name}! Switching to login...`, true);
      setTimeout(() => {
        setAuthMode('login'); setRole('member');
        if (uIn) uIn.value = reg.username;
        if (pIn) { pIn.value = ''; pIn.focus(); }
        showAlert(lErr, `Welcome ${reg.name}! Enter your password to log in.`, true);
      }, 1200);
    } catch (err) {
      showAlert(sAlert, err.message || 'Registration failed.');
    }
  });

  $('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlerts();
    const user = (uIn?.value || '').trim().toLowerCase(), pass = (pIn?.value || '').trim();
    const role = rAdmin?.classList.contains('active') ? 'admin' : 'member';

    if (!user || !pass) return showAlert(lErr, 'Please enter both username and password.');
    if (!window.DataStore?.authenticate) return showAlert(lErr, 'Authentication service unavailable.');

    const match = window.DataStore.authenticate(user, pass, role);
    if (match) {
      localStorage.setItem('useme_role', match.role || role);
      localStorage.setItem('useme_user_id', match.id);
      localStorage.setItem('useme_logged_in', 'true');
      window.location.href = 'dashboard.html';
    } else {
      showAlert(lErr, 'Invalid credentials. Please try again.');
    }
  });
});
