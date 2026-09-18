/**
 * Useme Team - Skill Mapping Renderer
 */
(function() {
  function renderMemberRow(m, cachedCats) {
    const tr = document.createElement('tr');
    tr.className = 'member-row';
    const profClass = m.proficiency === 'Intermediate' ? 'prof-intermediate' : m.proficiency === 'Expert' ? 'prof-expert' : m.proficiency === 'Advanced' ? 'prof-intermediate' : 'prof-beginner';

    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const isAdmin = u?.role === 'admin';
    const isSelf = u?.id === m.id;

    const cats = cachedCats || (window.DataStore ? window.DataStore.getSkillCategories() : []);
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>Override
          </button>
        ` : (isSelf ? `
          <button type="button" class="btn-action-edit" style="color:var(--color-primary); border-color:var(--color-primary); font-weight:700;" data-action="edit-prof" data-member-id="${m.id}" data-cat-id="${m.skillCategory || 'dev'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>Self-Upgrade
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
