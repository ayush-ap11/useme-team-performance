/**
 * Useme Team - Tasks Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const tableBody = document.getElementById('tasksTableBody');
  const statusFilter = document.getElementById('statusFilter');
  const assigneeFilter = document.getElementById('assigneeFilter');
  const btnNewTask = document.getElementById('btnNewTask');

  if (!tableBody) return;

  if (role === 'admin') {
    if (btnNewTask) {
      btnNewTask.style.display = 'inline-flex';
      btnNewTask.onclick = () => window.openNewTaskModal && window.openNewTaskModal(renderTasks);
    }
    if (assigneeFilter) {
      assigneeFilter.innerHTML = '<option value="all">All Assignees</option>' + (window.DataStore ? window.DataStore.getMembers() : []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }
  } else {
    if (btnNewTask) btnNewTask.style.display = 'none';
    const assignGrp = document.getElementById('assigneeFilterGroup');
    if (assignGrp) assignGrp.style.display = 'none';
  }

  let displayLimit = 50;

  if (statusFilter) statusFilter.onchange = () => { displayLimit = 50; renderTasks(); };
  if (assigneeFilter) assigneeFilter.onchange = () => { displayLimit = 50; renderTasks(); };

  function renderTasks() {
    let list = window.DataStore ? window.DataStore.getTasks() : [];

    if (role === 'member') {
      list = list.filter(t => t.assignedTo.includes(currentUserId));
    } else if (assigneeFilter && assigneeFilter.value !== 'all') {
      list = list.filter(t => t.assignedTo.includes(assigneeFilter.value));
    }

    if (statusFilter && statusFilter.value !== 'all') {
      list = list.filter(t => t.status === statusFilter.value);
    }

    const actionsHeader = document.getElementById('tasksActionColHeader');
    if (actionsHeader) {
      actionsHeader.style.display = role === 'admin' ? '' : 'none';
    }

    tableBody.innerHTML = '';

    if (list.length === 0) {
      const colSpan = role === 'admin' ? 6 : 5;
      tableBody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center; padding:32px; color:var(--color-text-muted);">No tasks found matching current filters.</td></tr>`;
      return;
    }

    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
    const memberMap = new Map(allMembers.map(m => [m.id, m]));
    const fragment = document.createDocumentFragment();
    const visibleList = list.slice(0, displayLimit);

    visibleList.forEach(task => {
      const tr = document.createElement('tr');
      tr.className = 'task-row';
      const assignees = (task.assignedTo || []).map(id => memberMap.get(id)).filter(Boolean);
      const avatarStack = `<div class="avatar-stack">${assignees.map(a => `<span class="avatar-stack-item" title="${a.name}">${a.avatar}</span>`).join('')}</div>`;

      tr.innerHTML = `
        <td class="task-title-cell">
          <strong>${task.title}</strong>
          <span>${task.linkedProject || 'General Operation'}</span>
        </td>
        <td>${avatarStack}</td>
        <td>${getStatusBadge(task.status)}</td>
        <td style="color:var(--color-text-muted); font-size:var(--text-xs);">${task.dueDate}</td>
        <td><span class="modal-skill-chip" style="font-size:11px;">${task.linkedSkill.toUpperCase()}</span></td>
        ${role === 'admin' ? `
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn-action-edit btn-edit-task" title="Edit Task">Edit</button>
            <button type="button" class="btn-action-delete btn-delete-task" title="Delete Task">Delete</button>
          </td>
        ` : ''}
      `;

      if (role === 'admin') {
        const editBtn = tr.querySelector('.btn-edit-task');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof window.openEditTaskModal === 'function') {
              window.openEditTaskModal(task, renderTasks);
            }
          };
        }
        const delBtn = tr.querySelector('.btn-delete-task');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
              const u = window.currentUser || window.DataStore?.getCurrentUser();
              try {
                if (window.DataStore?.deleteTask) {
                  window.DataStore.deleteTask(task.id, u);
                }
                renderTasks();
              } catch (err) {
                alert(err.message);
              }
            }
          };
        }
      }

      tr.onclick = () => {
        if (typeof window.openTaskDetailModal === 'function') {
          window.openTaskDetailModal(task.id, renderTasks);
        }
      };

      fragment.appendChild(tr);
    });

    if (list.length > displayLimit) {
      const colSpan = role === 'admin' ? 6 : 5;
      const loadMoreTr = document.createElement('tr');
      loadMoreTr.innerHTML = `
        <td colspan="${colSpan}" style="text-align:center; padding:16px;">
          <button type="button" class="btn" id="btnLoadMoreTasks" style="padding:8px 20px; font-size:var(--text-xs); font-weight:600; background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-pill); cursor:pointer;">
            Load More Tasks (Showing ${visibleList.length} of ${list.length})
          </button>
        </td>
      `;
      const lmBtn = loadMoreTr.querySelector('#btnLoadMoreTasks');
      if (lmBtn) {
        lmBtn.onclick = () => {
          displayLimit += 50;
          renderTasks();
        };
      }
      fragment.appendChild(loadMoreTr);
    }

    tableBody.appendChild(fragment);
  }

  renderTasks();

  const urlTaskId = new URLSearchParams(window.location.search).get('taskId');
  if (urlTaskId && typeof window.openTaskDetailModal === 'function') {
    window.openTaskDetailModal(urlTaskId, renderTasks);
  }
});
