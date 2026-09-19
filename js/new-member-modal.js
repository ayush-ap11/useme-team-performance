/**
 * Useme Team - Systematic Member Hierarchy Assignment & Creation Modal
 */
(function() {
  const DEPTS = ['Engineering', 'Product & Design', 'Growth & Marketing', 'Finance & Operations', 'Data & Analytics', 'Customer Support', 'Executive'];
  const BANDS = ['L3 - Junior Associate', 'L4 - Specialist', 'L5 - Senior Staff', 'L6 - Principal Lead', 'L7 - Director'];

  function hasLoop(mgrId, mid, emps) {
    let cur = emps.find(m => m.id === mgrId);
    while (cur) { if (cur.reportsTo === mid || cur.id === mid) return true; cur = emps.find(m => m.id === cur.reportsTo); }
    return false;
  }

  window.openNewMemberModal = function(onCreated) {
    let m = document.getElementById('newMemberModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'newMemberModal';
      m.className = 'modal-overlay';
      m.innerHTML = `
        <div class="task-modal-card" style="max-width:580px;">
          <button type="button" class="modal-close-btn" id="nmCloseBtn">&times;</button>
          <h2 class="task-modal-title" style="margin-bottom:10px;">Team Member Hierarchy Setup</h2>
          <div class="role-toggle-group" id="nmModeGroup" style="margin-bottom:14px;">
            <button type="button" class="role-toggle-btn active" id="nmModeAssign"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>Assign Registered Member</button>
            <button type="button" class="role-toggle-btn" id="nmModeCreate"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>Create New Member</button>
          </div>
          <div id="nmError" class="alert-banner alert-banner-error" style="display:none; margin-bottom:12px;"></div>
          <form id="newMemberForm">
            <div id="nmUnassignedWrap" class="form-group" style="margin-bottom:10px;">
              <label class="form-label">Select Registered Member (Awaiting Role) *</label>
              <select id="nmSelectUnassigned" class="form-input"></select>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Full Name *</label><input type="text" id="nmName" class="form-input" required></div>
              <div><label class="form-label">Email Address *</label><input type="email" id="nmEmail" class="form-input" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Username (Login ID) *</label><input type="text" id="nmUsername" class="form-input" required></div>
              <div id="nmPassWrap"><label class="form-label">Temporary Password *</label><input type="text" id="nmPassword" class="form-input" value="Useme@2026"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Title / Role *</label><input type="text" id="nmRole" class="form-input" placeholder="e.g. Frontend Developer" required></div>
              <div><label class="form-label">Department *</label><select id="nmDept" class="form-input" required>${DEPTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Reporting Manager *</label><select id="nmManager" class="form-input" required></select></div>
              <div><label class="form-label">Band / Level *</label><select id="nmBand" class="form-input" required>${BANDS.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Workplace Location *</label><input type="text" id="nmLocation" class="form-input" value="Bangalore, IN" required></div>
              <div><label class="form-label">Start Date *</label><input type="date" id="nmStartDate" class="form-input" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;" class="form-group">
              <div><label class="form-label">Avatar Initials (Optional)</label><input type="text" id="nmAvatar" class="form-input" placeholder="Auto" maxlength="3"></div>
              <div><label class="form-label">Skill Domain *</label><select id="nmSkillCat" class="form-input"><option value="dev">Software Development</option><option value="data">Data Analysis</option><option value="finance">CA / Finance</option><option value="design">Printing & Design</option><option value="marketing">Marketing</option><option value="support">Tech Support</option></select></div>
            </div>
            <div class="modal-actions-footer">
              <button type="button" class="btn btn-secondary" id="nmCancelBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="nmSubmitBtn">Assign to Hierarchy</button>
            </div>
          </form>
        </div>`;
      document.body.appendChild(m);
      m.querySelector('#nmCloseBtn').onclick = () => m.classList.remove('active');
      m.querySelector('#nmCancelBtn').onclick = () => m.classList.remove('active');
      m.onclick = (e) => { if (e.target === m) m.classList.remove('active'); };
      const nIn = m.querySelector('#nmName'), uIn = m.querySelector('#nmUsername');
      nIn.oninput = () => { if (!isAssign && !uIn.dataset.edited) uIn.value = nIn.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.'); };
      uIn.oninput = () => { if (!isAssign) uIn.dataset.edited = 'true'; };
    }

    const ds = window.DataStore, emps = ds?.getMembers() || [];
    const unassigned = ds?.getUnassignedMembers ? ds.getUnassignedMembers() : [];
    const q = id => m.querySelector(id);
    const modeAssign = q('#nmModeAssign'), modeCreate = q('#nmModeCreate');
    const uWrap = q('#nmUnassignedWrap'), pWrap = q('#nmPassWrap'), uSel = q('#nmSelectUnassigned');
    const nIn = q('#nmName'), eIn = q('#nmEmail'), usrIn = q('#nmUsername'), subBtn = q('#nmSubmitBtn');
    let isAssign = unassigned.length > 0;

    function applyMode(assign) {
      isAssign = assign && unassigned.length > 0;
      modeAssign.classList.toggle('active', isAssign);
      modeCreate.classList.toggle('active', !isAssign);
      uWrap.style.display = isAssign ? 'block' : 'none';
      pWrap.style.display = isAssign ? 'none' : 'block';
      nIn.readOnly = isAssign; eIn.readOnly = isAssign; usrIn.readOnly = isAssign;
      subBtn.textContent = isAssign ? 'Assign to Hierarchy' : 'Add Member';
      if (isAssign) loadSelected(); else { nIn.value = ''; eIn.value = ''; usrIn.value = ''; }
    }

    function loadSelected() {
      const cur = unassigned.find(x => x.id === uSel.value) || unassigned[0];
      if (cur) { nIn.value = cur.name || ''; eIn.value = cur.email || ''; usrIn.value = cur.username || ''; }
    }

    uSel.innerHTML = unassigned.length ? unassigned.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('') : '<option value="">No unassigned members</option>';
    uSel.onchange = loadSelected;
    modeAssign.onclick = () => applyMode(true);
    modeCreate.onclick = () => applyMode(false);
    applyMode(unassigned.length > 0);

    q('#nmManager').innerHTML = emps.map(e => `<option value="${e.id}">${e.name} (${e.role || 'Member'} - ${e.department || ''})</option>`).join('');
    if (!q('#nmStartDate').value) q('#nmStartDate').value = new Date().toISOString().slice(0, 10);
    q('#nmError').style.display = 'none';

    q('#newMemberForm').onsubmit = (e) => {
      e.preventDefault();
      const err = q('#nmError'), u = window.currentUser || ds?.getCurrentUser();
      const role = q('#nmRole').value.trim(), dept = q('#nmDept').value, mgrId = q('#nmManager').value;
      const band = q('#nmBand').value, loc = q('#nmLocation').value.trim(), start = q('#nmStartDate').value;
      const av = q('#nmAvatar').value.trim().toUpperCase(), cat = q('#nmSkillCat').value;

      if (hasLoop(mgrId, isAssign ? uSel.value : null, emps)) {
        err.textContent = 'Invalid manager: circular reporting detected.'; err.style.display = 'block'; return;
      }
      try {
        let result;
        if (isAssign) {
          result = ds.assignMemberToHierarchy(uSel.value, { role, department: dept, reportsTo: mgrId, band, location: loc, startDate: start, avatar: av, skillCategory: cat }, u);
        } else {
          result = ds.addTeamMember({ name: nIn.value.trim(), email: eIn.value.trim(), username: usrIn.value.trim(), initialPassword: q('#nmPassword').value.trim(), role, department: dept, reportsTo: mgrId, band, location: loc, startDate: start, avatar: av, skillCategory: cat }, u);
        }
        m.classList.remove('active');
        window.dispatchEvent(new CustomEvent('useme:member-added', { detail: result }));
        if (onCreated) onCreated(result);
      } catch (ex) {
        err.textContent = ex.message; err.style.display = 'block';
      }
    };
    m.classList.add('active');
  };
})();
