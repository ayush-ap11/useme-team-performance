/**
 * Useme Team - Skill Mapping Renderer
 */
(function() {
  function renderMemberRow(m) {
    const tr = document.createElement('tr');
    tr.className = 'member-row';
    const profClass = m.proficiency === 'Intermediate' ? 'prof-intermediate' : m.proficiency === 'Expert' ? 'prof-expert' : m.proficiency === 'Advanced' ? 'prof-intermediate' : 'prof-beginner';

    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const isAdmin = u?.role === 'admin';
    const isSelf = u?.id === m.id;

    const cats = window.DataStore ? window.DataStore.getSkillCategories() : [];
    const cat = cats.find(c => c.id === m.skillCategory);
    const catName = cat ? cat.name : (m.skillCategory || 'General');

    tr.innerHTML = `
      <td>
        <div class="member-cell-info" style="cursor:pointer;" onclick="window.openMemberModal && window.openMemberModal('${m.id}')">
          <div class="member-cell-avatar">${m.avatar}</div>
          <div>
            <strong>${m.name}</strong>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${m.role}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="card-pill" style="font-size:11px; padding:2px 8px;">${catName}</span>
      </td>
      <td><span class="prof-badge ${profClass}">${m.proficiency}</span></td>
      <td><strong>${m.activeTasks || 0}</strong> active tasks</td>
      <td><span class="verified-tag ${m.verified ? 'verified-true' : 'verified-false'}">${m.verified ? 'Admin Verified' : 'Self-Declared'}</span></td>
      <td style="text-align:right;">
        ${isAdmin ? `
          <button type="button" class="btn-action-edit" data-action="edit-prof" data-member-id="${m.id}" data-cat-id="${m.skillCategory || 'dev'}">
            ⚙️ Override
          </button>
        ` : (isSelf ? `
          <button type="button" class="btn-action-edit" style="color:var(--color-primary); border-color:var(--color-primary); font-weight:700;" data-action="edit-prof" data-member-id="${m.id}" data-cat-id="${m.skillCategory || 'dev'}">
            ✨ Self-Upgrade
          </button>
        ` : `
          <span style="font-size:11px; color:var(--color-text-muted);">Read-only</span>
        `)}
      </td>
    `;
    return tr;
  }

  window.renderMemberRow = renderMemberRow;
})();
