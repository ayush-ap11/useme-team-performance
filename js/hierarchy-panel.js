/**
 * Useme Team - Hierarchy Slide-in Detail Panel Controller (ChartHop Model)
 */
(function() {
  const DEPT_COLORS = {
    'Executive': '#4F46E5', 'Engineering': '#2563EB', 'Product & Design': '#D97706',
    'Growth & Marketing': '#059669', 'Finance & Operations': '#0D9488',
    'Data & Analytics': '#7C3AED', 'Customer Support': '#E11D48'
  };

  let activeMemberId = null;

  function getDeptColor(deptName) {
    const depts = window.DataStore ? window.DataStore.getDepartments() : [];
    const match = depts.find(d => d.name.toLowerCase() === (deptName || '').toLowerCase() || d.id === deptName);
    return match?.colorHex || DEPT_COLORS[deptName] || '#2563EB';
  }

  function initPanel() {
    const panel = document.getElementById('hierarchyDetailPanel');
    if (!panel) return;

    panel.querySelector('#panelCloseBtn')?.addEventListener('click', closeHierarchyPanel);
    panel.querySelectorAll('.panel-tab-btn').forEach(btn => {
      btn.onclick = () => {
        panel.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.remove('active'));
        panel.querySelectorAll('.panel-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab === 'details' ? 'paneDetails' : 'paneHistory';
        document.getElementById(target)?.classList.add('active');
      };
    });

    // Admin Action: Edit Member
    const editBtn = document.getElementById('panelEditMemberBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (!activeMemberId) return;
        const m = window.DataStore?.getMemberById(activeMemberId);
        if (!m) return;

        const editModal = document.getElementById('editMemberModal');
        if (!editModal) return;

        document.getElementById('emMemberId').value = m.id;
        document.getElementById('emName').value = m.name || '';
        document.getElementById('emEmail').value = m.email || '';
        document.getElementById('emRole').value = m.role || '';
        document.getElementById('emLocation').value = m.location || 'Bangalore, IN';

        // Format start date YYYY-MM-DD
        let sDate = m.startDate;
        if (!sDate || !/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
          sDate = new Date().toISOString().slice(0, 10);
        }
        document.getElementById('emStartDate').value = sDate;

        // Populate departments dynamically from DataStore
        const depts = window.DataStore ? window.DataStore.getDepartments() : [];
        const deptSelect = document.getElementById('emDept');
        if (deptSelect) {
          deptSelect.innerHTML = depts.map(d => `<option value="${d.name}" ${d.name === m.department ? 'selected' : ''}>${d.name}</option>`).join('');
        }

        // Populate bands
        const bands = ['L3 - Junior Associate', 'L3 - Junior Specialist', 'L4 - Specialist', 'L5 - Senior Staff', 'L6 - Principal Lead', 'L7 - Director'];
        const bandSelect = document.getElementById('emBand');
        if (bandSelect) {
          bandSelect.innerHTML = bands.map(b => `<option value="${b}" ${b === m.band ? 'selected' : ''}>${b}</option>`).join('');
        }

        // Populate reporting manager select
        const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
        const mgrSelect = document.getElementById('emManager');
        if (mgrSelect) {
          // Exclude self from reporting manager list
          const eligibleMgrs = allMembers.filter(x => x.id !== m.id);
          mgrSelect.innerHTML = `<option value="">None (Top-level Executive)</option>` +
            eligibleMgrs.map(mgr => `<option value="${mgr.id}" ${mgr.id === m.reportsTo ? 'selected' : ''}>${mgr.name} (${mgr.role} - ${mgr.department || ''})</option>`).join('');
        }

        const errBox = document.getElementById('emError');
        if (errBox) errBox.style.display = 'none';

        editModal.classList.add('active');
      });
    }

    // Admin Action: Offboard Member
    const offboardBtn = document.getElementById('panelOffboardMemberBtn');
    if (offboardBtn) {
      offboardBtn.addEventListener('click', () => {
        if (!activeMemberId) return;
        const m = window.DataStore?.getMemberById(activeMemberId);
        if (!m) return;

        const offboardModal = document.getElementById('offboardMemberModal');
        if (!offboardModal) return;

        document.getElementById('offboardMemberId').value = m.id;
        document.getElementById('offboardMemberName').textContent = m.name;
        document.getElementById('offboardMemberRole').textContent = m.role;

        const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
        const directReports = allMembers.filter(x => x.reportsTo === m.id);

        const alertEl = document.getElementById('offboardReportsAlert');
        const selectEl = document.getElementById('offboardReassignSelect');
        const descEl = document.getElementById('offboardReportsDesc');

        if (directReports.length > 0) {
          if (alertEl) alertEl.style.display = 'block';
          if (descEl) descEl.textContent = `This member manages ${directReports.length} direct report(s) (${directReports.map(r => r.name).join(', ')}). Please designate a new manager to inherit them:`;
          const eligibleMgrs = allMembers.filter(x => x.id !== m.id);
          if (selectEl) {
            selectEl.innerHTML = eligibleMgrs.map(mgr => `<option value="${mgr.id}">${mgr.name} (${mgr.role} - ${mgr.department || ''})</option>`).join('');
            selectEl.required = true;
          }
        } else {
          if (alertEl) alertEl.style.display = 'none';
          if (selectEl) {
            selectEl.innerHTML = '';
            selectEl.required = false;
          }
        }

        offboardModal.classList.add('active');
      });
    }

    // Wire Edit Member Form Submission
    document.getElementById('editMemberForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const mid = document.getElementById('emMemberId').value;
      const errEl = document.getElementById('emError');
      if (errEl) errEl.style.display = 'none';

      const updates = {
        name: document.getElementById('emName').value.trim(),
        role: document.getElementById('emRole').value.trim(),
        department: document.getElementById('emDept').value,
        reportsTo: document.getElementById('emManager').value || null,
        band: document.getElementById('emBand').value,
        location: document.getElementById('emLocation').value.trim(),
        startDate: document.getElementById('emStartDate').value
      };

      const u = window.currentUser || window.DataStore?.getCurrentUser();
      try {
        const updated = window.DataStore.updateMember(mid, updates, u);
        document.getElementById('editMemberModal')?.classList.remove('active');
        openHierarchyPanel(mid);
        if (window.handleMemberUpdated) {
          window.handleMemberUpdated(updated);
        } else if (window.refreshHierarchyTree) {
          window.refreshHierarchyTree();
        }
      } catch (err) {
        if (errEl) {
          errEl.textContent = err.message;
          errEl.style.display = 'block';
        } else {
          alert(err.message);
        }
      }
    });

    // Wire Offboard Member Form Submission
    document.getElementById('offboardMemberForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const mid = document.getElementById('offboardMemberId').value;
      const reassignId = document.getElementById('offboardReassignSelect')?.value || null;
      const u = window.currentUser || window.DataStore?.getCurrentUser();

      try {
        window.DataStore.deleteMember(mid, u, { reassignReportsTo: reassignId });
        document.getElementById('offboardMemberModal')?.classList.remove('active');
        closeHierarchyPanel();
        if (window.refreshHierarchyTree) window.refreshHierarchyTree();
      } catch (err) {
        alert(err.message);
      }
    });

    // Wire Modal Close and Cancel Buttons
    const closeModals = () => {
      document.getElementById('editMemberModal')?.classList.remove('active');
      document.getElementById('offboardMemberModal')?.classList.remove('active');
    };
    document.getElementById('emCloseBtn')?.addEventListener('click', closeModals);
    document.getElementById('emCancelBtn')?.addEventListener('click', closeModals);
    document.getElementById('offboardCloseBtn')?.addEventListener('click', closeModals);
    document.getElementById('offboardCancelBtn')?.addEventListener('click', closeModals);

    ['editMemberModal', 'offboardMemberModal'].forEach(mId => {
      const m = document.getElementById(mId);
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) m.classList.remove('active');
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('editMemberModal')?.classList.contains('active') ||
            document.getElementById('offboardMemberModal')?.classList.contains('active')) {
          closeModals();
        } else if (panel.classList.contains('active')) {
          closeHierarchyPanel();
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.org-card') && !e.target.closest('.zoho-card') && !e.target.closest('.org-exec-card') && !e.target.closest('.modal-overlay')) {
        closeHierarchyPanel();
      }
    });
  }

  function openHierarchyPanel(mid) {
    const panel = document.getElementById('hierarchyDetailPanel');
    if (!panel) return;
    const m = window.DataStore ? window.DataStore.getMemberById(mid) : null;
    if (!m) return;
    activeMemberId = mid;

    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const isAdmin = u?.role === 'admin';

    // Show/hide admin management buttons based on session
    const adminTitle = panel.querySelector('#panelAdminSectionTitle');
    const adminActions = panel.querySelector('#panelAdminActions');
    if (adminTitle) adminTitle.style.display = isAdmin ? 'block' : 'none';
    if (adminActions) adminActions.style.display = isAdmin ? 'flex' : 'none';

    const dept = m.department || 'Engineering';
    const color = getDeptColor(dept);

    const b = panel.querySelector('#panelDeptBadge');
    if (b) { b.textContent = dept; b.style.backgroundColor = color; }

    const av = panel.querySelector('#panelAvatar');
    if (av) { av.textContent = m.avatar; av.style.backgroundColor = color; }

    const name = panel.querySelector('#panelName'), role = panel.querySelector('#panelRole');
    if (name) name.textContent = m.name;
    if (role) role.textContent = m.role;

    // Manager
    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
    const mgr = m.reportsTo ? allMembers.find(x => x.id === m.reportsTo) : null;
    const mgrBox = panel.querySelector('#panelManagerBox');
    if (mgrBox) {
      mgrBox.innerHTML = mgr ? `
        <button type="button" class="panel-nav-chip" onclick="window.navigateToMemberCard('${mgr.id}')">
          <span class="card-avatar" style="width:22px;height:22px;font-size:10px;background:${getDeptColor(mgr.department)}">${mgr.avatar}</span>
          <div><strong>${mgr.name}</strong> <span style="color:var(--color-text-muted);font-size:10.5px;">(${mgr.role})</span></div>
        </button>` : `<span style="font-size:var(--text-xs);color:var(--color-text-muted);">None (Top-level Executive)</span>`;
    }

    // Direct reports
    const reports = allMembers.filter(x => x.reportsTo === m.id);
    const repBox = panel.querySelector('#panelReportsList'), repCount = panel.querySelector('#panelReportsCount');
    if (repCount) repCount.textContent = `${reports.length} member${reports.length === 1 ? '' : 's'}`;
    if (repBox) {
      repBox.innerHTML = reports.length ? reports.map(r => `
        <button type="button" class="panel-nav-chip" onclick="window.navigateToMemberCard('${r.id}')">
          <span class="card-avatar" style="width:22px;height:22px;font-size:10px;background:${getDeptColor(r.department)}">${r.avatar}</span>
          <div><strong>${r.name}</strong> <span style="color:var(--color-text-muted);font-size:10.5px;">(${r.role})</span></div>
        </button>`).join('') : `<span style="font-size:var(--text-xs);color:var(--color-text-muted);">No direct reports</span>`;
    }

    // Meta fields
    const fBand = panel.querySelector('#panelBand'), fLoc = panel.querySelector('#panelLocation'), fStart = panel.querySelector('#panelStartDate'), fTasks = panel.querySelector('#panelTasks');
    if (fBand) fBand.textContent = m.band || 'L4 - Specialist';
    if (fLoc) fLoc.textContent = m.location || 'Bangalore, IN';
    if (fStart) fStart.textContent = m.startDate || m.joinedDate || 'Jan 2023';
    if (fTasks) fTasks.textContent = `${m.activeTasks || 0} active deliverable${m.activeTasks === 1 ? '' : 's'}`;

    // Quick links
    const emailLink = panel.querySelector('#panelEmailLink');
    if (emailLink) emailLink.href = `mailto:${m.email}`;

    // Reset tabs
    panel.querySelectorAll('.panel-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === 'details'));
    panel.querySelector('#paneDetails')?.classList.add('active');
    panel.querySelector('#paneHistory')?.classList.remove('active');

    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');

    // Update active class on card (preserve multi-column activePath in Zoho mode)
    if (!document.getElementById('zohoColumns')) {
      document.querySelectorAll('.org-card, .zoho-card, .org-exec-card').forEach(c => c.classList.remove('selected'));
      const activeCard = document.getElementById(`card-${mid}`) || document.getElementById(`org-node-${mid}`) || document.getElementById('orgExecCard');
      if (activeCard) activeCard.classList.add('selected');
    }
  }

  function closeHierarchyPanel() {
    const panel = document.getElementById('hierarchyDetailPanel');
    if (panel) {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    }
    if (!document.getElementById('zohoColumns')) {
      document.querySelectorAll('.org-card, .org-exec-card').forEach(c => c.classList.remove('selected'));
    }
    activeMemberId = null;
  }

  window.openHierarchyPanel = openHierarchyPanel;
  window.closeHierarchyPanel = closeHierarchyPanel;
  document.addEventListener('DOMContentLoaded', initPanel);
})();
