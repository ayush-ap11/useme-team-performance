/**
 * Useme Team - Event Modals (Detail & Creation & Editing)
 */
(function() {

  window.openEventDetailModal = function(eventId, onUpdate) {
    let modal = document.getElementById('eventDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'eventDetailModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="evModalClose" aria-label="Close modal">&times;</button>
          <div id="evConflictNotice"></div>
          <div class="task-modal-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1; min-width:0; padding-right:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                <h2 class="task-modal-title" id="evTitle" style="margin:0;">Event Title</h2>
                <div id="evStatus"></div>
              </div>
              <div class="task-modal-meta" id="evMeta"></div>
            </div>
            <div id="evAdminActions" style="display:none; gap:6px; align-items:center; margin-right:24px;">
              <button type="button" class="btn-action-edit" id="evBtnEdit" title="Edit Event">Edit</button>
              <button type="button" class="btn-action-delete" id="evBtnDelete" title="Delete Event">Delete</button>
            </div>
          </div>
          <p id="evDesc" style="font-size:var(--text-sm); margin-bottom:var(--space-4); color:var(--color-text);"></p>
          <div style="background:var(--color-bg); padding:var(--space-3); border-radius:var(--radius-sm); border:1px solid var(--color-border); margin-bottom:var(--space-4);">
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:var(--color-text-muted);">Event Venue & Date</div>
            <div id="evVenueBox" style="font-size:var(--text-sm); font-weight:600; color:var(--color-text); margin-top:2px;"></div>
          </div>
          <div style="margin-bottom:var(--space-4);">
            <div style="font-size:var(--text-xs); font-weight:600; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:var(--space-2);">Assigned Members & Responsibilities</div>
            <div id="evMembersList" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
          </div>
          <div>
            <div style="font-size:var(--text-xs); font-weight:600; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:var(--space-2);">Linked Preparation Tasks</div>
            <ul class="tab-list" id="evTasksList"></ul>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#evModalClose').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }

    const ev = window.DataStore ? window.DataStore.getEventById(eventId) : null;
    if (!ev) return;

    const allEvents = window.DataStore ? window.DataStore.getEvents() : [];
    const conflict = allEvents.find(o => o.id !== ev.id && o.venue.toLowerCase() === ev.venue.toLowerCase() && o.eventDate === ev.eventDate);
    const notice = modal.querySelector('#evConflictNotice');
    notice.innerHTML = conflict ? `<div class="conflict-alert" style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <span>Venue Conflict: "${conflict.name}" is also booked at this venue on ${ev.eventDate}.</span></div>` : '';

    modal.querySelector('#evTitle').textContent = ev.name;
    modal.querySelector('#evMeta').innerHTML = `<span>Date: ${ev.eventDate}</span> • <span>Venue: ${ev.venue}</span>`;
    modal.querySelector('#evStatus').innerHTML = getStatusBadge(ev.status);
    modal.querySelector('#evDesc').textContent = ev.description;
    modal.querySelector('#evVenueBox').textContent = `${ev.venue} — ${ev.eventDate}`;

    const allMembers = window.DataStore ? window.DataStore.getMembers() : [];
    modal.querySelector('#evMembersList').innerHTML = (ev.members || []).map(item => {
      const m = window.getMemberOrFallback ? window.getMemberOrFallback(item.memberId, { name: 'Member', avatar: '?' }) : (allMembers.find(mem => mem.id === item.memberId) || { name: 'Member', avatar: '?' });
      return `<div class="event-member-chip" onclick="window.openMemberModal('${item.memberId}')" style="cursor:pointer;"><span class="avatar-mini">${m.avatar}</span><strong>${m.name}</strong><span class="event-role-badge">${item.roleAtEvent}</span></div>`;
    }).join('');

    const allTasks = window.DataStore ? window.DataStore.getTasks() : [];
    const linked = allTasks.filter(t => (ev.linkedTaskIds || []).includes(t.id) || t.eventId === ev.id);
    modal.querySelector('#evTasksList').innerHTML = linked.length > 0 ? linked.map(t => `<li class="tab-list-item" style="cursor:pointer;" onclick="window.openTaskDetailModal('${t.id}')"><div><strong>${t.title}</strong><div style="font-size:11px;color:var(--color-text-muted);">Due: ${t.dueDate}</div></div>${getStatusBadge(t.status)}</li>`).join('') : '<li class="tab-list-item"><span style="color:var(--color-text-muted);">No linked tasks currently.</span></li>';

    const role = localStorage.getItem('useme_role') || 'member';
    const u = window.currentUser || window.DataStore?.getCurrentUser();
    const adminActions = modal.querySelector('#evAdminActions');

    if (role === 'admin') {
      adminActions.style.display = 'inline-flex';
      modal.querySelector('#evBtnEdit').onclick = () => {
        modal.classList.remove('active');
        if (typeof window.openEditEventModal === 'function') {
          window.openEditEventModal(ev, () => {
            if (onUpdate) onUpdate();
            window.openEventDetailModal(ev.id, onUpdate);
          });
        }
      };
      modal.querySelector('#evBtnDelete').onclick = () => {
        if (confirm(`Are you sure you want to delete event "${ev.name}"?`)) {
          try {
            window.DataStore.deleteEvent(ev.id, u);
            modal.classList.remove('active');
            if (onUpdate) onUpdate();
          } catch (err) {
            alert(err.message);
          }
        }
      };
    } else {
      adminActions.style.display = 'none';
    }

    modal.classList.add('active');
  };

  function ensureEventModal() {
    let modal = document.getElementById('newEventModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'newEventModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="task-modal-card">
          <button type="button" class="modal-close-btn" id="neModalClose" aria-label="Close modal">&times;</button>
          <h2 class="task-modal-title" id="neModalTitle" style="margin-bottom:var(--space-4);">+ Create New Event</h2>
          <div id="neConflictWarning" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#FEE2E2; color:#991B1B; border:1px solid #FECACA;"></div>
          <form id="newEventForm">
            <div class="form-group"><label class="form-label">Event Name</label><input type="text" id="neName" class="form-input" required placeholder="e.g. Annual Tech Symposium"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea id="neDesc" class="form-input" rows="2" required placeholder="Event scope and program..."></textarea></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:var(--space-3);" class="form-group">
              <div><label class="form-label">Venue</label><input type="text" id="neVenue" class="form-input" required placeholder="e.g. Auditorium Hall B"></div>
              <div><label class="form-label">Event Date</label><input type="date" id="neDate" class="form-input" required></div>
              <div><label class="form-label">Status</label><select id="neStatus" class="form-input"><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            </div>
            <div class="form-group">
              <label class="form-label">Member Assignments & Roles</label>
              <div id="neMemberAssignments" style="max-height:160px; overflow-y:auto; border:1px solid var(--color-border); padding:var(--space-2); border-radius:var(--radius-sm);"></div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:var(--space-5); border-top:1px solid var(--color-border); padding-top:var(--space-4);">
              <button type="button" class="btn" id="neCancel" style="border:1px solid var(--color-border);">Cancel</button>
              <button type="submit" class="btn btn-primary" id="neSubmitBtn">Create Event</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#neModalClose').onclick = () => modal.classList.remove('active');
      modal.querySelector('#neCancel').onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }
    return modal;
  }

  function setupEventModal(existingEvent, callback) {
    const modal = ensureEventModal();
    const isEdit = !!existingEvent;

    modal.querySelector('#neModalTitle').textContent = isEdit ? 'Edit Event' : '+ Create New Event';
    modal.querySelector('#neSubmitBtn').textContent = isEdit ? 'Save Changes' : 'Create Event';

    modal.querySelector('#neName').value = isEdit ? (existingEvent.name || '') : '';
    modal.querySelector('#neDesc').value = isEdit ? (existingEvent.description || '') : '';
    modal.querySelector('#neVenue').value = isEdit ? (existingEvent.venue || '') : '';
    modal.querySelector('#neDate').value = isEdit ? (existingEvent.eventDate || '') : new Date().toISOString().slice(0, 10);
    modal.querySelector('#neStatus').value = isEdit ? (existingEvent.status || 'upcoming') : 'upcoming';

    const conflictEl = modal.querySelector('#neConflictWarning');
    conflictEl.style.display = 'none';

    const checkConflict = () => {
      const v = modal.querySelector('#neVenue').value.trim();
      const d = modal.querySelector('#neDate').value;
      if (v && d && window.DataStore?.checkEventVenueConflict) {
        const conflict = window.DataStore.checkEventVenueConflict(isEdit ? existingEvent.id : null, v, d);
        if (conflict) {
          conflictEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>Venue Conflict: "${conflict.name}" is already booked at "${v}" on ${d}.`;
          conflictEl.style.display = 'block';
          return;
        }
      }
      conflictEl.style.display = 'none';
    };

    modal.querySelector('#neVenue').oninput = checkConflict;
    modal.querySelector('#neDate').onchange = checkConflict;
    checkConflict();

    const container = modal.querySelector('#neMemberAssignments');
    const membersList = window.DataStore ? window.DataStore.getMembers() : [];
    const existingMemberMap = new Map();
    if (isEdit && Array.isArray(existingEvent.members)) {
      existingEvent.members.forEach(m => existingMemberMap.set(m.memberId, m.roleAtEvent));
    }

    container.innerHTML = membersList.map(m => {
      const isAssigned = isEdit ? existingMemberMap.has(m.id) : false;
      const roleVal = isAssigned ? (existingMemberMap.get(m.id) || 'Team Member') : '';
      return `
        <div class="event-member-row" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0; border-bottom:1px solid #f3f4f6;">
          <label style="font-size:var(--text-xs); font-weight:600; display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" class="ne-mem-check" data-id="${m.id}" ${isAssigned ? 'checked' : ''}> ${m.name}
          </label>
          <input type="text" class="form-input ne-mem-role" placeholder="Role (e.g. Organizer)" value="${roleVal}" style="font-size:var(--text-xs); padding:2px 6px; width:160px;">
        </div>
      `;
    }).join('');

    modal.querySelector('#newEventForm').onsubmit = (e) => {
      e.preventDefault();
      const assigned = [];
      modal.querySelectorAll('.event-member-row').forEach(row => {
        const chk = row.querySelector('.ne-mem-check');
        const roleInp = row.querySelector('.ne-mem-role');
        if (chk && chk.checked) {
          assigned.push({ memberId: chk.dataset.id, roleAtEvent: roleInp.value.trim() || 'Team Member' });
        }
      });

      const u = window.currentUser || window.DataStore?.getCurrentUser();

      if (isEdit) {
        const updates = {
          name: modal.querySelector('#neName').value.trim(),
          description: modal.querySelector('#neDesc').value.trim(),
          venue: modal.querySelector('#neVenue').value.trim(),
          eventDate: modal.querySelector('#neDate').value,
          status: modal.querySelector('#neStatus').value,
          members: assigned.length > 0 ? assigned : existingEvent.members
        };
        if (window.DataStore?.updateEvent) {
          window.DataStore.updateEvent(existingEvent.id, updates, u);
        } else {
          Object.assign(existingEvent, updates);
        }
      } else {
        const newEv = {
          id: 'e' + (Date.now() % 1000),
          name: modal.querySelector('#neName').value.trim(),
          description: modal.querySelector('#neDesc').value.trim(),
          venue: modal.querySelector('#neVenue').value.trim(),
          eventDate: modal.querySelector('#neDate').value,
          status: modal.querySelector('#neStatus').value || 'upcoming',
          members: assigned.length > 0 ? assigned : [{ memberId: 'm1', roleAtEvent: 'Organizer' }],
          linkedTaskIds: []
        };
        if (window.DataStore?.createEvent) {
          window.DataStore.createEvent(newEv, u);
        }
      }

      modal.classList.remove('active');
      modal.querySelector('#newEventForm').reset();
      if (callback) callback();
    };

    modal.classList.add('active');
  }

  window.openNewEventModal = function(onCreated) {
    setupEventModal(null, onCreated);
  };

  window.openEditEventModal = function(event, onSaved) {
    setupEventModal(event, onSaved);
  };

})();
