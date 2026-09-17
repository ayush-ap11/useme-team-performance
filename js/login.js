/**
 * Useme Team - Login Logic
 * Authenticates dynamically against DataStore with SHA-256 password hashing.
 */
document.addEventListener('DOMContentLoaded', () => {
  const roleAdminBtn = document.getElementById('roleAdmin');
  const roleMemberBtn = document.getElementById('roleMember');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');

  function setRole(role) {
    if (role === 'admin') {
      roleAdminBtn?.classList.add('active');
      roleAdminBtn?.setAttribute('aria-pressed', 'true');
      roleMemberBtn?.classList.remove('active');
      roleMemberBtn?.setAttribute('aria-pressed', 'false');
    } else {
      roleMemberBtn?.classList.add('active');
      roleMemberBtn?.setAttribute('aria-pressed', 'true');
      roleAdminBtn?.classList.remove('active');
      roleAdminBtn?.setAttribute('aria-pressed', 'false');
    }
    hideError();
  }

  function getSelectedRole() {
    return roleAdminBtn && roleAdminBtn.classList.contains('active') ? 'admin' : 'member';
  }

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.classList.add('visible');
    }
  }

  function hideError() {
    if (loginError) {
      loginError.textContent = '';
      loginError.classList.remove('visible');
    }
  }

  if (roleAdminBtn && roleMemberBtn) {
    roleAdminBtn.addEventListener('click', () => setRole('admin'));
    roleMemberBtn.addEventListener('click', () => setRole('member'));
  }

  // Quick autofill when clicking any demo credential item
  document.querySelectorAll('.demo-creds-item').forEach(item => {
    item.addEventListener('click', () => {
      const u = item.dataset.user;
      const p = item.dataset.pass;
      const r = item.dataset.role;
      if (u && p) {
        setRole(r || 'member');
        if (usernameInput) usernameInput.value = u;
        if (passwordInput) passwordInput.value = p;
      }
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();

      const user = (usernameInput?.value || '').trim().toLowerCase();
      const pass = (passwordInput?.value || '').trim();
      const role = getSelectedRole();

      if (!user || !pass) {
        showError('Please enter both username and password.');
        return;
      }

      if (!window.DataStore || !window.DataStore.authenticate) {
        showError('Authentication service is currently unavailable.');
        return;
      }

      const match = window.DataStore.authenticate(user, pass, role);

      if (match) {
        localStorage.setItem('useme_role', match.role || role);
        localStorage.setItem('useme_user_id', match.id);
        localStorage.setItem('useme_logged_in', 'true');
        window.location.href = 'dashboard.html';
      } else {
        showError('Invalid credentials. Please try again.');
      }
    });
  }
});
