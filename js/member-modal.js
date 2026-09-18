/**
 * Useme Team - Shared Member Profile Modal Component
 */
(function() {
  let activeMember = null;
  let updateCallback = null;

  function initModal() {
    if (document.getElementById('memberProfileModal')) return;

    const modalMarkup = document.createElement('div');
    modalMarkup.id = 'memberProfileModal';
    modalMarkup.className = 'modal-overlay';
    modalMarkup.setAttribute('role', 'dialog');
    modalMarkup.innerHTML = `
      <div class="modal-card">
        <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close modal">&times;</button>
        <div class="modal-header">
          <div class="modal-avatar" id="modalAvatar">--</div>
          <div style="flex:1;">
            <h3 class="modal-name" id="modalName">Member Name</h3>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:2px;">
              <p class="modal-role" id="modalRole" style="margin:0;">Role Title</p>
              <button type="button" id="btnEditRole" class="modal-action-pill" style="display:none;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:3px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit</button>
            </div>
            <div id="roleEditForm" class="modal-inline-form" style="display:none;">
              <input type="text" id="roleEditInput" class="form-input" style="padding:4px 8px; font-size:12px; height:28px; flex:1;">
              <button type="button" id="btnSaveRole" class="btn btn-primary btn-xs">Save</button>
              <button type="button" id="btnCancelRole" class="btn btn-secondary btn-xs">Cancel</button>
            </div>
            <div id="roleUpdatedNotice" style="font-size:10.5px; color:var(--color-text-muted); margin-top:4px; display:none;"></div>
          </div>
        </div>
        <div class="modal-grid">
          <div><div class="modal-stat-label">Joined</div><div class="modal-stat-val" id="modalJoined">--</div></div>
          <div><div class="modal-stat-label">Active Tasks</div><div class="modal-stat-val" id="modalTasks">--</div></div>
          <div><div class="modal-stat-label">Current Rank</div><div class="modal-stat-val" id="modalRank" style="color:var(--color-primary);">--</div></div>
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="modal-stat-label">Proficiency</div>
              <button type="button" id="btnEditProficiency" class="modal-action-pill" style="display:none;">Edit</button>
            </div>
            <div class="modal-stat-val" id="modalProficiency">--</div>
            <div id="profEditBox" class="modal-inline-form" style="display:none;">
              <select id="profEditSelect" class="form-input form-select" style="padding:2px 24px 2px 8px; font-size:11px; height:28px; flex:1;">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              <button type="button" id="btnSaveProf" class="btn btn-primary btn-xs">Save</button>
              <button type="button" id="btnCancelProf" class="btn btn-secondary btn-xs">&times;</button>
            </div>
          </div>
        </div>
        <div>
          <div class="modal-skills-title">Skills & Specializations</div>
          <div class="modal-skills-list" id="modalSkills"></div>
        </div>
        <div id="modalAuthSection" class="modal-auth-box">
          <div class="modal-username-tag" id="modalUsernameTag">Login: @user</div>
          <button type="button" id="btnMemberPasswordAction" class="modal-auth-btn">Change Password</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalMarkup);
    document.getElementById('modalCloseBtn').onclick = window.closeMemberModal;
    modalMarkup.onclick = (e) => { if (e.target === modalMarkup) window.closeMemberModal(); };

    const editBtn = document.getElementById('btnEditRole');
    const editForm = document.getElementById('roleEditForm');
    const roleText = document.getElementById('modalRole');
    const roleInput = document.getElementById('roleEditInput');
    const saveBtn = document.getElementById('btnSaveRole');
    const cancelBtn = document.getElementById('btnCancelRole');
    const noticeEl = document.getElementById('roleUpdatedNotice');

    editBtn.onclick = () => {
      editForm.style.display = 'block';
      editBtn.style.display = 'none';
      roleText.style.display = 'none';
      roleInput.value = activeMember ? activeMember.role : '';
      roleInput.focus();
    };

    cancelBtn.onclick = () => {
      editForm.style.display = 'none';
      editBtn.style.display = 'inline-block';
      roleText.style.display = 'block';
    };

    const saveAction = () => {
      if (!activeMember) return;
      const newRole = roleInput.value.trim();
      if (newRole) {
        const u = window.currentUser || window.DataStore?.getCurrentUser();
        try {
          const updated = window.DataStore ? window.DataStore.updateMemberRole(activeMember.id, newRole, u) : null;
          if (updated) activeMember = updated;
          else { activeMember.role = newRole; activeMember.lastRoleUpdated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
          roleText.textContent = activeMember.role;
          noticeEl.textContent = `Last updated by Admin on ${activeMember.lastRoleUpdated}`;
          noticeEl.style.display = 'block';
          cancelBtn.onclick();
          window.dispatchEvent(new CustomEvent('useme:member-updated', { detail: activeMember }));
          if (updateCallback) updateCallback(activeMember);
        } catch (err) {
          alert(err.message || 'Unauthorized');
        }
      }
    };

    saveBtn.onclick = saveAction;
    roleInput.onkeydown = (e) => { if (e.key === 'Enter') saveAction(); };
  }

  window.openMemberModal = function(memberId, onUpdate) {
    initModal();
    updateCallback = onUpdate;
    const members = window.DataStore ? window.DataStore.getMembers() : [];
    activeMember = window.DataStore ? window.DataStore.getMemberById(memberId) : members.find(m => m.id === memberId);
    if (!activeMember) return;

    document.getElementById('modalAvatar').textContent = activeMember.avatar;
    document.getElementById('modalName').textContent = activeMember.name;
    document.getElementById('modalRole').textContent = activeMember.role;
    document.getElementById('modalJoined').textContent = activeMember.joinedDate;
    document.getElementById('modalTasks').textContent = `${activeMember.activeTasks} tasks`;
    document.getElementById('modalRank').textContent = activeMember.rank;
    document.getElementById('modalProficiency').textContent = activeMember.proficiency;

    const isAdmin = localStorage.getItem('useme_role') === 'admin';
    const editBtn = document.getElementById('btnEditRole');
    const editForm = document.getElementById('roleEditForm');
    const roleText = document.getElementById('modalRole');
    const noticeEl = document.getElementById('roleUpdatedNotice');

    editForm.style.display = 'none';
    roleText.style.display = 'block';
    editBtn.style.display = isAdmin ? 'inline-block' : 'none';

    if (activeMember.lastRoleUpdated) {
      noticeEl.textContent = `Last updated by Admin on ${activeMember.lastRoleUpdated}`;
      noticeEl.style.display = 'block';
    } else {
      noticeEl.style.display = 'none';
    }

    // Proficiency Edit / Self-Upgrade wiring
    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const isSelf = u?.id === activeMember.id;
    const canEditProf = isAdmin || isSelf;

    const editProfBtn = document.getElementById('btnEditProficiency');
    const profEditBox = document.getElementById('profEditBox');
    const profText = document.getElementById('modalProficiency');
    const profSelect = document.getElementById('profEditSelect');
    const saveProfBtn = document.getElementById('btnSaveProf');
    const cancelProfBtn = document.getElementById('btnCancelProf');

    if (editProfBtn) {
      editProfBtn.textContent = isSelf ? 'Self-Upgrade' : 'Override';
      editProfBtn.style.display = canEditProf ? 'inline-block' : 'none';
      if (profEditBox) profEditBox.style.display = 'none';
      if (profText) profText.style.display = 'block';

      editProfBtn.onclick = () => {
        editProfBtn.style.display = 'none';
        profText.style.display = 'none';
        profEditBox.style.display = 'block';
        if (profSelect) profSelect.value = activeMember.proficiency || 'Intermediate';
      };

      if (cancelProfBtn) {
        cancelProfBtn.onclick = () => {
          profEditBox.style.display = 'none';
          profText.style.display = 'block';
          editProfBtn.style.display = canEditProf ? 'inline-block' : 'none';
        };
      }

      if (saveProfBtn) {
        saveProfBtn.onclick = () => {
          const newLevel = profSelect.value;
          try {
            const catId = activeMember.skillCategory || 'dev';
            window.DataStore.upgradeSkillProficiency(activeMember.id, catId, newLevel, u);
            activeMember.proficiency = newLevel;
            activeMember.verified = isAdmin;
            profText.textContent = newLevel;
            cancelProfBtn.onclick();
            window.dispatchEvent(new CustomEvent('useme:member-updated', { detail: activeMember }));
            if (updateCallback) updateCallback(activeMember);
          } catch (err) {
            alert(err.message || 'Error updating proficiency');
          }
        };
      }
    }

    const skillsContainer = document.getElementById('modalSkills');
    skillsContainer.innerHTML = '';
    (activeMember.skills || []).forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'modal-skill-chip';
      chip.textContent = skill;
      skillsContainer.appendChild(chip);
    });

    const userTag = document.getElementById('modalUsernameTag');
    if (userTag) userTag.textContent = activeMember.username ? `Login: @${activeMember.username}` : `ID: ${activeMember.id}`;

    const pwdActionBtn = document.getElementById('btnMemberPasswordAction');
    if (pwdActionBtn) {
      if (isSelf) {
        pwdActionBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Change Password';
        pwdActionBtn.style.display = 'inline-block';
        pwdActionBtn.onclick = () => {
          if (window.openPasswordModal) window.openPasswordModal({ memberId: activeMember.id, isReset: false });
        };
      } else if (isAdmin) {
        pwdActionBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3"></path></svg>Reset Password';
        pwdActionBtn.style.display = 'inline-block';
        pwdActionBtn.onclick = () => {
          if (window.openPasswordModal) window.openPasswordModal({ memberId: activeMember.id, isReset: true });
        };
      } else {
        pwdActionBtn.style.display = 'none';
      }
    }

    document.getElementById('memberProfileModal').classList.add('active');
  };

  window.closeMemberModal = function() {
    const modal = document.getElementById('memberProfileModal');
    if (modal) modal.classList.remove('active');
  };
})();
