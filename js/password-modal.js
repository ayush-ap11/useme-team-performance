/**
 * Useme Team - Password Management Modal (Change / Reset Password)
 */
(function() {
  window.openPasswordModal = function({ memberId, isReset = false, onComplete } = {}) {
    let modal = document.getElementById('passwordModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'passwordModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card" style="max-width:440px;">
          <button type="button" class="modal-close-btn" id="pwdCloseBtn" aria-label="Close modal">&times;</button>
          <h2 class="task-modal-title" id="pwdTitle">Change Password</h2>
          <p id="pwdSubtitle" style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:var(--space-3);"></p>
          <div id="pwdError" class="alert-banner alert-banner-error" style="display:none;"></div>
          <div id="pwdSuccess" class="alert-banner alert-banner-success" style="display:none;"></div>
          <form id="pwdForm">
            <div id="pwdCurrentGroup" class="form-group">
              <label class="form-label" for="pwdCurrent">Current Password *</label>
              <input type="password" id="pwdCurrent" class="form-input" placeholder="Enter current password" autocomplete="current-password">
            </div>
            <div class="form-group">
              <label class="form-label" for="pwdNew">New Password *</label>
              <input type="password" id="pwdNew" class="form-input" placeholder="At least 4 characters" required autocomplete="new-password">
            </div>
            <div class="form-group">
              <label class="form-label" for="pwdConfirm">Confirm New Password *</label>
              <input type="password" id="pwdConfirm" class="form-input" placeholder="Re-enter new password" required autocomplete="new-password">
            </div>
            <div class="modal-actions-footer">
              <button type="button" class="btn btn-secondary" id="pwdCancelBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="pwdSubmitBtn">Save Password</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#pwdCloseBtn').onclick = () => modal.classList.remove('active');
      modal.querySelector('#pwdCancelBtn').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }

    const member = window.DataStore ? window.DataStore.getMemberById(memberId) : null;
    const mName = member ? member.name : 'Member';
    const mUser = member?.username ? `@${member.username}` : '';

    const titleEl = modal.querySelector('#pwdTitle');
    const subEl = modal.querySelector('#pwdSubtitle');
    const curGroup = modal.querySelector('#pwdCurrentGroup');
    const curInput = modal.querySelector('#pwdCurrent');
    const newInput = modal.querySelector('#pwdNew');
    const confInput = modal.querySelector('#pwdConfirm');
    const submitBtn = modal.querySelector('#pwdSubmitBtn');
    const errEl = modal.querySelector('#pwdError');
    const succEl = modal.querySelector('#pwdSuccess');

    errEl.style.display = 'none';
    succEl.style.display = 'none';
    modal.querySelector('#pwdForm').reset();

    if (isReset) {
      titleEl.textContent = 'Reset Member Password';
      subEl.textContent = `Set a new temporary password for ${mName} (${mUser})`;
      curGroup.style.display = 'none';
      curInput.removeAttribute('required');
      submitBtn.textContent = 'Reset Password';
    } else {
      titleEl.textContent = 'Change Your Password';
      subEl.textContent = `Update credentials for ${mName} (${mUser})`;
      curGroup.style.display = 'block';
      curInput.setAttribute('required', 'required');
      submitBtn.textContent = 'Update Password';
    }

    modal.querySelector('#pwdForm').onsubmit = (e) => {
      e.preventDefault();
      errEl.style.display = 'none';
      succEl.style.display = 'none';

      const oldPass = curInput.value;
      const newPass = newInput.value.trim();
      const confPass = confInput.value.trim();

      if (!newPass || newPass.length < 4) {
        errEl.textContent = 'New password must be at least 4 characters long.';
        errEl.style.display = 'block'; return;
      }
      if (newPass !== confPass) {
        errEl.textContent = 'New password and confirmation do not match.';
        errEl.style.display = 'block'; return;
      }

      const u = window.currentUser || window.DataStore?.getCurrentUser();
      try {
        if (isReset) {
          window.DataStore.resetMemberPassword(memberId, newPass, u);
          succEl.textContent = `Password reset successfully for ${mName}.`;
        } else {
          window.DataStore.updateMemberPassword(memberId, oldPass, newPass, u);
          succEl.textContent = 'Your password has been changed successfully.';
        }
        succEl.style.display = 'block';
        setTimeout(() => {
          modal.classList.remove('active');
          if (onComplete) onComplete();
        }, 1200);
      } catch (err) {
        errEl.textContent = err.message || 'Failed to update password.';
        errEl.style.display = 'block';
      }
    };

    modal.classList.add('active');
  };
})();
