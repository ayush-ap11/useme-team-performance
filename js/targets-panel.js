/**
 * Useme Team - Admin Configurable Targets Panel Controller
 */
(function() {
  function renderTargetsPanel() {
    const ds = window.DataStore;
    if (!ds) return;
    const groups = ds.getTargetGroups ? ds.getTargetGroups() : [];
    const members = ds.getMembers ? ds.getMembers() : [];
    const overrides = ds.getMemberTargetOverrides ? ds.getMemberTargetOverrides() : {};
    const modal = document.getElementById('targetsPanelModal');
    if (!modal) return;

    const groupListEl = document.getElementById('targetsGroupList');
    if (groupListEl) {
      groupListEl.innerHTML = groups.length ? groups.map(g => {
        const memChips = (g.memberIds || []).map(mid => `<span class="target-member-chip">${members.find(x => x.id === mid)?.name || mid}</span>`).join('');
        return `
          <div class="target-group-card" id="tgCard-${g.id}">
            <div class="target-group-header">
              <div><strong class="target-group-title">${g.name}</strong><span class="target-group-badge">${g.targetPoints} pts/mo</span></div>
              <div class="target-group-actions">
                <button type="button" class="btn-target-edit" data-id="${g.id}">Edit</button>
                <button type="button" class="btn-target-del" data-id="${g.id}">Delete</button>
              </div>
            </div>
            <div class="target-group-members">${memChips || '<em style="font-size:11px; color:var(--color-text-muted);">No members assigned</em>'}</div>
          </div>`;
      }).join('') : `<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">No target groups defined yet.</p>`;
    }

    const overrideListEl = document.getElementById('targetsOverrideList');
    if (overrideListEl) {
      const entries = Object.entries(overrides);
      overrideListEl.innerHTML = entries.length ? entries.map(([mid, data]) => {
        const m = members.find(x => x.id === mid);
        const labels = [data.engagement && `${data.engagement} pts (Eng)`, data.motivation && `${data.motivation} pts (Mot)`].filter(Boolean).join(', ') || `${data} pts`;
        return `<li class="target-override-row"><span><strong>${m ? m.name : mid}</strong>: <span style="color:var(--color-primary); font-weight:600;">${labels}</span></span><button type="button" class="btn-override-del" data-mid="${mid}">Clear Override</button></li>`;
      }).join('') : `<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:8px 0;">No active member overrides.</p>`;
    }

    const memSel = document.getElementById('overrideMemberSelect');
    if (memSel) memSel.innerHTML = `<option value="">Select Member...</option>` + members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');

    const memBoxes = document.getElementById('targetGroupMembersBox');
    if (memBoxes) memBoxes.innerHTML = members.map(m => `<label class="tg-member-checkbox-label"><input type="checkbox" name="tgMember" value="${m.id}"><span>${m.name}</span></label>`).join('');
  }

  function openTargetsModal() {
    const modal = document.getElementById('targetsPanelModal');
    if (!modal) return;
    renderTargetsPanel();
    modal.classList.add('active');
  }

  function refreshViews() {
    renderTargetsPanel();
    if (window.renderEngagementTab) window.renderEngagementTab();
    if (window.renderMotivationTab) window.renderMotivationTab();
  }

  function wireTargetsEvents() {
    const modal = document.getElementById('targetsPanelModal');
    if (!modal) return;
    const ds = window.DataStore, u = ds?.getCurrentUser();

    document.getElementById('targetsModalClose')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('btnNewTargetGroup')?.addEventListener('click', () => {
      document.getElementById('targetGroupForm').reset();
      document.getElementById('targetGroupId').value = '';
      document.getElementById('tgFormTitle').textContent = 'New Target Group';
      document.getElementById('targetGroupFormWrapper').style.display = 'block';
    });
    document.getElementById('tgCancelBtn')?.addEventListener('click', () => {
      document.getElementById('targetGroupFormWrapper').style.display = 'none';
    });

    document.getElementById('targetGroupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('targetGroupId').value.trim() || undefined;
      const name = document.getElementById('targetGroupName').value.trim();
      const targetPoints = Number(document.getElementById('targetGroupPoints').value);
      const memberIds = Array.from(document.querySelectorAll('input[name="tgMember"]:checked')).map(cb => cb.value);
      try {
        ds.saveTargetGroup({ id, name, targetPoints, memberIds }, u);
        document.getElementById('targetGroupFormWrapper').style.display = 'none';
        refreshViews();
      } catch (err) { alert(err.message); }
    });

    document.getElementById('targetsGroupList')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-target-edit');
      if (editBtn) {
        const g = ds.getTargetGroupById(editBtn.dataset.id);
        if (!g) return;
        document.getElementById('targetGroupId').value = g.id;
        document.getElementById('targetGroupName').value = g.name;
        document.getElementById('targetGroupPoints').value = g.targetPoints;
        document.querySelectorAll('input[name="tgMember"]').forEach(cb => { cb.checked = (g.memberIds || []).includes(cb.value); });
        document.getElementById('tgFormTitle').textContent = 'Edit Target Group';
        document.getElementById('targetGroupFormWrapper').style.display = 'block';
      }
      const delBtn = e.target.closest('.btn-target-del');
      if (delBtn && confirm('Delete this target group?')) {
        ds.deleteTargetGroup(delBtn.dataset.id, u);
        refreshViews();
      }
    });

    document.getElementById('memberOverrideForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const mid = document.getElementById('overrideMemberSelect').value, cat = document.getElementById('overrideCategorySelect').value, pts = document.getElementById('overridePointsInput').value;
      if (!mid || !pts) return;
      ds.setMemberTargetOverride(mid, cat, pts, u);
      document.getElementById('memberOverrideForm').reset();
      refreshViews();
    });

    document.getElementById('targetsOverrideList')?.addEventListener('click', (e) => {
      const clrBtn = e.target.closest('.btn-override-del');
      if (clrBtn) {
        ds.setMemberTargetOverride(clrBtn.dataset.mid, 'engagement', null, u);
        ds.setMemberTargetOverride(clrBtn.dataset.mid, 'motivation', null, u);
        refreshViews();
      }
    });
  }

  window.TARGETS_PANEL = { openTargetsModal, renderTargetsPanel, wireTargetsEvents };
})();
