/**
 * Useme Team - Events Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const grid = document.getElementById('eventsGrid');
  const btnNewEvent = document.getElementById('btnNewEvent');

  if (!grid) return;

  if (role === 'admin') {
    if (btnNewEvent) {
      btnNewEvent.style.display = 'inline-flex';
      btnNewEvent.onclick = () => window.openNewEventModal && window.openNewEventModal(renderEvents);
    }
  } else if (btnNewEvent) {
    btnNewEvent.style.display = 'none';
  }


  function renderEvents() {
    let events = window.DataStore ? window.DataStore.getEvents() : [];
    if (role === 'member') {
      events = events.filter(e => (e.members || []).some(m => m.memberId === currentUserId));
    }

    grid.innerHTML = '';

    if (events.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:8px; border:1px solid var(--color-border); color:var(--color-text-muted);">No events found for your account.</div>`;
      return;
    }

    events.forEach(e => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-card-top">
          <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
            <div class="event-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <h3 class="event-card-title">${e.name}</h3>
              <p class="event-card-desc">${e.description}</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${getStatusBadge(e.status)}
            ${role === 'admin' ? `
              <div class="event-card-actions" style="display:flex; gap:4px; margin-left:4px;">
                <button type="button" class="btn-action-edit btn-edit-ev" title="Edit Event">Edit</button>
                <button type="button" class="btn-action-delete btn-del-ev" title="Delete Event">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="event-venue-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${e.venue}</span>
        </div>

        <div class="event-card-footer">
          <span style="color:var(--color-text-muted); display:inline-flex; align-items:center; gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> <strong>${e.eventDate}</strong></span>
          <span class="modal-skill-chip">${(e.members || []).length} crew members</span>
        </div>
      `;

      card.dataset.id = e.id;
      card.id = `event-${e.id}`;

      if (role === 'admin') {
        const editBtn = card.querySelector('.btn-edit-ev');
        if (editBtn) {
          editBtn.onclick = (ev) => {
            ev.stopPropagation();
            if (typeof window.openEditEventModal === 'function') {
              window.openEditEventModal(e, renderEvents);
            }
          };
        }
        const delBtn = card.querySelector('.btn-del-ev');
        if (delBtn) {
          delBtn.onclick = (ev) => {
            ev.stopPropagation();
            if (confirm(`Are you sure you want to delete event "${e.name}"?`)) {
              const u = window.currentUser || window.DataStore?.getCurrentUser();
              try {
                window.DataStore.deleteEvent(e.id, u);
                renderEvents();
              } catch (err) {
                alert(err.message);
              }
            }
          };
        }
      }

      card.onclick = () => {
        if (typeof window.openEventDetailModal === 'function') {
          window.openEventDetailModal(e.id, renderEvents);
        }
      };

      grid.appendChild(card);
    });

    const targetId = new URLSearchParams(window.location.search).get('id');
    if (targetId) {
      const targetCard = document.getElementById(`event-${targetId}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('item-highlight');
      }
    }
  }

  renderEvents();
});
