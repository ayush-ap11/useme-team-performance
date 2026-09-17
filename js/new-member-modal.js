/**
 * Useme Team - Systematic New Member Modal Component (Admin Only)
 */
(function() {
  const DEPTS = ['Engineering', 'Product & Design', 'Growth & Marketing', 'Finance & Operations', 'Data & Analytics', 'Customer Support', 'Executive'];
  const BANDS = ['L3 - Junior Associate', 'L4 - Specialist', 'L5 - Senior Staff', 'L6 - Principal Lead', 'L7 - Director'];

  function hasCircularLoop(mgrId, mid, members) {
    if (!mgrId || !mid) return false;
    if (mgrId === mid) return true;
    let curr = members.find(m => m.id === mgrId);
    while (curr) {
      if (curr.reportsTo === mid) return true;
      curr = members.find(m => m.id === curr.reportsTo);
    }
    return false;
  }

  window.openNewMemberModal = function(onCreated) {
    let modal = document.getElementById('newMemberModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'newMemberModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card" style="max-width:560px;">
          <button type="button" class="modal-close-btn" id="nmCloseBtn" aria-label="Close modal">&times;</button>
          <h2 class="task-modal-title" style="margin-bottom:var(--space-3);">+ Add New Team Member</h2>
          <div id="nmError" class="alert-banner alert-banner-error" style="display:none;"></div>
          <form id="newMemberForm">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Full Name *</label><input type="text" id="nmName" class="form-input" placeholder="e.g. Ravi Kumar" required></div>
              <div><label class="form-label">Email Address *</label><input type="email" id="nmEmail" class="form-input" placeholder="e.g. ravi.kumar@useme.in" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Username (Login ID) *</label><input type="text" id="nmUsername" class="form-input" placeholder="e.g. ravi.kumar" required></div>
              <div><label class="form-label">Temporary Password *</label><input type="text" id="nmPassword" class="form-input" placeholder="e.g. Useme@2026" required value="Useme@2026"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Title / Role *</label><input type="text" id="nmRole" class="form-input" placeholder="e.g. Frontend Developer" required></div>
              <div><label class="form-label">Department *</label><select id="nmDept" class="form-input" required>${DEPTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Reporting Manager *</label><select id="nmManager" class="form-input" required></select></div>
              <div><label class="form-label">Band / Level *</label><select id="nmBand" class="form-input" required>${BANDS.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Workplace Location *</label><input type="text" id="nmLocation" class="form-input" placeholder="e.g. Bangalore, IN" required value="Bangalore, IN"></div>
              <div><label class="form-label">Start Date *</label><input type="date" id="nmStartDate" class="form-input" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Avatar Initials (Optional)</label><input type="text" id="nmAvatar" class="form-input" placeholder="Auto-derived" maxlength="3"></div>
              <div><label class="form-label">Skill Domain *</label><select id="nmSkillCat" class="form-input"><option value="dev">Software Development</option><option value="data">Data Analysis</option><option value="finance">CA / Finance</option><option value="design">Printing & Design</option><option value="marketing">Marketing</option><option value="support">Tech Support</option></select></div>
            </div>
            <div class="modal-actions-footer">
              <button type="button" class="btn btn-secondary" id="nmCancelBtn">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Member</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#nmCloseBtn').onclick = () => modal.classList.remove('active');
      modal.querySelector('#nmCancelBtn').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
      const nIn = modal.querySelector('#nmName');
      const uIn = modal.querySelector('#nmUsername');
      nIn.oninput = () => { if (!uIn.dataset.edited) uIn.value = nIn.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.'); };
      uIn.oninput = () => { uIn.dataset.edited = 'true'; };
    }

    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
    const mgrSelect = modal.querySelector('#nmManager');
    mgrSelect.innerHTML = allMembers.map(m => `<option value="${m.id}">${m.name} (${m.role} - ${m.department || ''})</option>`).join('');

    const depts = window.DataStore ? window.DataStore.getDepartments() : [];
    const deptSelect = modal.querySelector('#nmDept');
    if (deptSelect && depts.length > 0) {
      deptSelect.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }

    const startInput = modal.querySelector('#nmStartDate');
    if (startInput && !startInput.value) startInput.value = new Date().toISOString().slice(0, 10);

    const errorEl = modal.querySelector('#nmError');
    errorEl.style.display = 'none';

    modal.querySelector('#newMemberForm').onsubmit = (e) => {
      e.preventDefault();
      const name = modal.querySelector('#nmName').value.trim();
      const email = modal.querySelector('#nmEmail').value.trim().toLowerCase();
      const username = modal.querySelector('#nmUsername').value.trim().toLowerCase();
      const initialPassword = modal.querySelector('#nmPassword').value.trim();
      const role = modal.querySelector('#nmRole').value.trim();
      const department = modal.querySelector('#nmDept').value;
      const managerId = modal.querySelector('#nmManager').value;
      const band = modal.querySelector('#nmBand').value;
      const location = modal.querySelector('#nmLocation').value.trim();
      const startDate = modal.querySelector('#nmStartDate').value;
      const avatarCustom = modal.querySelector('#nmAvatar').value.trim().toUpperCase();
      const skillCategory = modal.querySelector('#nmSkillCat').value;

      if (allMembers.some(m => (m.email || '').toLowerCase() === email)) {
        errorEl.textContent = 'A team member with this email address already exists.';
        errorEl.style.display = 'block'; return;
      }
      if (allMembers.some(m => (m.username || '').toLowerCase() === username)) {
        errorEl.textContent = 'A team member with this username already exists.';
        errorEl.style.display = 'block'; return;
      }
      if (!initialPassword || initialPassword.length < 4) {
        errorEl.textContent = 'Temporary password must be at least 4 characters.';
        errorEl.style.display = 'block'; return;
      }

      if (hasCircularLoop(managerId, null, allMembers)) {
        errorEl.textContent = 'Invalid reporting manager selection: circular reporting detected.';
        errorEl.style.display = 'block'; return;
      }

      const initials = avatarCustom || name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM';
      const newMemberData = {
        name, email, username, initialPassword, role, department, reportsTo: managerId, band, location, startDate,
        avatar: initials, skillCategory, proficiency: 'Beginner', activeTasks: 0, kpiScore: 75, kriPenalty: 0
      };

      const u = window.currentUser || window.DataStore?.getCurrentUser();
      if (!window.DataStore?.addTeamMember) {
        errorEl.textContent = 'DataStore is unavailable. Cannot add member.';
        errorEl.style.display = 'block'; return;
      }

      try {
        const created = window.DataStore.addTeamMember(newMemberData, u);
        modal.classList.remove('active');
        modal.querySelector('#newMemberForm').reset();
        window.dispatchEvent(new CustomEvent('useme:member-added', { detail: created }));
        if (onCreated) onCreated(created);
        if (window.drawHierarchyConnectors) window.drawHierarchyConnectors();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
    };

    modal.classList.add('active');
  };
})();
