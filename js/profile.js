/**
 * Useme Team - My Profile Page Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const ds = window.DataStore;
  const user = ds?.getCurrentUser ? ds.getCurrentUser() : null;
  const userId = localStorage.getItem('useme_user_id') || user?.id || 'm5';
  const members = ds?.getMembers ? ds.getMembers() : [];
  const member = members.find(m => m.id === userId) || members[0] || {
    id: userId, name: 'Alex Rivera', role: 'Staff Frontend Engineer', avatar: 'AR',
    dept: 'Frontend Core', location: 'Tokyo, JP (Remote)', joined: '2023-04-15',
    proficiency: 'Expert', skills: ['React', 'TypeScript', 'Design Systems', 'Web Performance']
  };

  // 1. Populate Personal Information
  const elAvatar = document.getElementById('profAvatar');
  const elName = document.getElementById('profName');
  const elRole = document.getElementById('profRole');
  const elDept = document.getElementById('profDept');
  const elLoc = document.getElementById('profLoc');
  const elJoined = document.getElementById('profJoined');
  const elId = document.getElementById('profId');
  const elBadge = document.getElementById('profRoleBadge');
  const elUsername = document.getElementById('profUsername');

  if (elAvatar) elAvatar.textContent = member.avatar || (member.name ? member.name.substring(0, 2).toUpperCase() : 'ME');
  if (elName) elName.textContent = member.name || 'Team Member';
  if (elRole) elRole.textContent = member.role || 'Member';
  if (elDept) elDept.textContent = member.dept || member.department || 'Engineering';
  if (elLoc) elLoc.textContent = member.location || 'Remote';
  if (elJoined) elJoined.textContent = member.joined || '2023-06-01';
  if (elId) elId.textContent = member.id ? member.id.toUpperCase() : 'USER-01';
  if (elBadge) {
    const roleStr = localStorage.getItem('useme_role') || 'member';
    elBadge.textContent = roleStr === 'admin' ? 'Admin' : 'Team Member';
    elBadge.className = `role-badge ${roleStr === 'admin' ? 'admin' : 'member'}`;
  }
  if (elUsername) elUsername.value = localStorage.getItem('useme_username') || member.username || `${member.name.toLowerCase().replace(/\s+/g, '.')}`;

  // 2. Populate Performance Snapshot
  const tasks = ds?.getTasks ? ds.getTasks() : [];
  const memberTasks = tasks.filter(t => (t.assigneeIds || []).includes(member.id) || t.assigneeId === member.id);
  const activeTasks = memberTasks.filter(t => t.status !== 'completed');
  const kpiScore = member.kpiScore || 92.5;

  const elKpi = document.getElementById('profKpiScore');
  const elRank = document.getElementById('profRank');
  const elTasks = document.getElementById('profTasksCount');
  const elProf = document.getElementById('profProficiency');

  if (elKpi) elKpi.textContent = `${kpiScore}%`;
  if (elRank) elRank.textContent = `#${member.rank || 4}`;
  if (elTasks) elTasks.textContent = activeTasks.length || 3;
  if (elProf) elProf.textContent = member.proficiency || 'Advanced';

  // 3. Populate Skills List
  const skillsContainer = document.getElementById('profSkills');
  if (skillsContainer && member.skills) {
    skillsContainer.innerHTML = member.skills.map(s => `<span class="profile-skill-chip">${s}</span>`).join('');
  }

  // 4. Inline Role Edit Logic
  const btnEditRole = document.getElementById('btnEditRole');
  const roleEditBox = document.getElementById('roleEditBox');
  const roleEditInput = document.getElementById('roleEditInput');
  const btnSaveRole = document.getElementById('btnSaveRole');
  const btnCancelRole = document.getElementById('btnCancelRole');
  const roleNotice = document.getElementById('roleNotice');

  if (btnEditRole && roleEditBox) {
    btnEditRole.onclick = () => {
      roleEditBox.style.display = 'flex';
      btnEditRole.style.display = 'none';
      if (roleEditInput) {
        roleEditInput.value = elRole ? elRole.textContent : '';
        roleEditInput.focus();
      }
    };

    btnCancelRole.onclick = () => {
      roleEditBox.style.display = 'none';
      btnEditRole.style.display = 'inline-flex';
    };

    btnSaveRole.onclick = () => {
      const val = roleEditInput.value.trim();
      if (!val) return;
      if (ds?.updateMemberRole) {
        ds.updateMemberRole(member.id, val, user);
      }
      if (elRole) elRole.textContent = val;
      roleEditBox.style.display = 'none';
      btnEditRole.style.display = 'inline-flex';
      if (roleNotice) {
        roleNotice.textContent = 'Role updated successfully.';
        roleNotice.style.display = 'block';
        setTimeout(() => { roleNotice.style.display = 'none'; }, 3000);
      }
    };
  }

  // 5. Password Update Handler
  const pwForm = document.getElementById('profilePasswordForm');
  const pwNotice = document.getElementById('pwFeedback');
  if (pwForm) {
    pwForm.onsubmit = (e) => {
      e.preventDefault();
      const newPw = document.getElementById('profNewPw')?.value;
      const confirmPw = document.getElementById('profConfirmPw')?.value;
      if (!newPw || newPw.length < 6) {
        if (pwNotice) {
          pwNotice.style.color = 'var(--color-red)';
          pwNotice.textContent = 'Password must be at least 6 characters.';
          pwNotice.style.display = 'block';
        }
        return;
      }
      if (newPw !== confirmPw) {
        if (pwNotice) {
          pwNotice.style.color = 'var(--color-red)';
          pwNotice.textContent = 'Passwords do not match.';
          pwNotice.style.display = 'block';
        }
        return;
      }
      if (pwNotice) {
        pwNotice.style.color = 'var(--color-green)';
        pwNotice.textContent = 'Password updated successfully!';
        pwNotice.style.display = 'block';
        pwForm.reset();
        setTimeout(() => { pwNotice.style.display = 'none'; }, 3500);
      }
    };
  }
});
