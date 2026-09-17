/**
 * Useme Team - Projects Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const grid = document.getElementById('projectsGrid');
  const btnNewProject = document.getElementById('btnNewProject');

  if (!grid) return;

  if (role === 'admin') {
    if (btnNewProject) {
      btnNewProject.style.display = 'inline-flex';
      btnNewProject.onclick = () => window.openNewProjectModal && window.openNewProjectModal(renderProjects);
    }
  } else if (btnNewProject) {
    btnNewProject.style.display = 'none';
  }


  function renderProjects() {
    let projects = window.DataStore ? window.DataStore.getProjects() : [];
    if (role === 'member') {
      projects = projects.filter(p => p.memberIds.includes(currentUserId));
    }

    grid.innerHTML = '';

    if (projects.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:8px; border:1px solid var(--color-border); color:var(--color-text-muted);">No projects found for your account.</div>`;
      return;
    }

    const allTasks = window.DataStore ? window.DataStore.getTasks() : [];
    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];

    projects.forEach(p => {
      const linkedTasks = allTasks.filter(t => p.linkedTaskIds.includes(t.id) || t.projectId === p.id);
      const completedCount = linkedTasks.filter(t => t.status === 'completed').length;
      const progressPct = linkedTasks.length > 0 ? Math.round((completedCount / linkedTasks.length) * 100) : 0;

      const members = allMembers.filter(m => p.memberIds.includes(m.id));
      const avatarStack = `<div class="avatar-stack">${members.map(m => `<span class="avatar-stack-item" title="${m.name}">${m.avatar}</span>`).join('')}</div>`;

      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="proj-top">
          <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
            <div class="proj-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <h3 class="proj-title">${p.name}</h3>
              <p class="proj-desc">${p.description}</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${getStatusBadge(p.status)}
            ${role === 'admin' ? `
              <div class="proj-card-actions" style="display:flex; gap:4px; margin-left:4px;">
                <button type="button" class="btn-action-edit btn-edit-proj" title="Edit Project">Edit</button>
                <button type="button" class="btn-action-delete btn-del-proj" title="Delete Project">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-info">
            <span>Milestone Completion (${completedCount}/${linkedTasks.length})</span>
            <span>${progressPct}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <div class="proj-footer">
          <div>${avatarStack}</div>
          <span class="proj-date">Target: <strong>${p.targetDate}</strong></span>
        </div>
      `;

      card.dataset.id = p.id;
      card.id = `project-${p.id}`;

      if (role === 'admin') {
        const editBtn = card.querySelector('.btn-edit-proj');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof window.openEditProjectModal === 'function') {
              window.openEditProjectModal(p, renderProjects);
            }
          };
        }
        const delBtn = card.querySelector('.btn-del-proj');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete project "${p.name}"?`)) {
              const u = window.currentUser || window.DataStore?.getCurrentUser();
              try {
                window.DataStore.deleteProject(p.id, u);
                renderProjects();
              } catch (err) {
                alert(err.message);
              }
            }
          };
        }
      }

      card.onclick = () => {
        if (typeof window.openProjectDetailModal === 'function') {
          window.openProjectDetailModal(p.id, renderProjects);
        }
      };

      grid.appendChild(card);
    });

    const targetId = new URLSearchParams(window.location.search).get('id');
    if (targetId) {
      const targetCard = document.getElementById(`project-${targetId}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('item-highlight');
      }
    }
  }

  renderProjects();
});
