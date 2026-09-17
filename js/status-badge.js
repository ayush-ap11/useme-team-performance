/**
 * Useme Team - Canonical Status Badge & Member Fallback Utility
 *
 * CANONICAL STATUS LABELS & BADGE CLASSES:
 * - notStarted       : 'Not Started'     (badge-grey)
 * - inProgress       : 'In Progress'     (badge-orange)
 * - testing          : 'Testing'         (badge-amber)
 * - awaitingFeedback : 'Awaiting Review' (badge-blue)
 * - completed        : 'Completed'       (badge-green)
 * - reworkNeeded     : 'Rework Needed'   (badge-red)
 * - cancelled        : 'Cancelled'       (badge-grey)
 * - active           : 'Active'          (badge-orange)
 * - onHold           : 'On Hold'         (badge-grey)
 * - upcoming         : 'Upcoming'        (badge-blue)
 * - ongoing          : 'Ongoing'         (badge-orange)
 * - pending          : 'Pending'         (badge-amber)
 * - approved         : 'Approved'        (badge-green)
 */
(function() {
  const BADGE_MAP = {
    notStarted: { label: 'Not Started', cls: 'badge-grey' },
    inProgress: { label: 'In Progress', cls: 'badge-orange' },
    testing: { label: 'Testing', cls: 'badge-amber' },
    awaitingFeedback: { label: 'Awaiting Review', cls: 'badge-blue' },
    completed: { label: 'Completed', cls: 'badge-green' },
    reworkNeeded: { label: 'Rework Needed', cls: 'badge-red' },
    cancelled: { label: 'Cancelled', cls: 'badge-grey' },
    active: { label: 'Active', cls: 'badge-orange' },
    onHold: { label: 'On Hold', cls: 'badge-grey' },
    upcoming: { label: 'Upcoming', cls: 'badge-blue' },
    ongoing: { label: 'Ongoing', cls: 'badge-orange' },
    pending: { label: 'Pending', cls: 'badge-amber' },
    approved: { label: 'Approved', cls: 'badge-green' }
  };

  function getStatusBadge(st) {
    const item = BADGE_MAP[st] || { label: st ? String(st) : 'Unknown', cls: 'badge-grey' };
    return `<span class="status-badge ${item.cls}">${item.label}</span>`;
  }

  const MEMBER_NOT_FOUND = Object.freeze({
    id: 'unknown',
    name: 'Unknown Member',
    role: 'Team Member',
    avatar: '??',
    email: '',
    skillCategory: 'general',
    proficiency: 'Beginner',
    kpiScore: 80,
    kriPenalty: 0,
    compositeScore: 80,
    rank: '#--'
  });

  function getMemberOrFallback(id, fallback) {
    if (!id) return fallback ? { ...MEMBER_NOT_FOUND, ...fallback } : MEMBER_NOT_FOUND;
    const m = window.DataStore ? window.DataStore.getMemberById(id) : null;
    if (m) return m;
    return fallback ? { ...MEMBER_NOT_FOUND, ...fallback } : MEMBER_NOT_FOUND;
  }

  window.getStatusBadge = getStatusBadge;
  window.MEMBER_NOT_FOUND = MEMBER_NOT_FOUND;
  window.getMemberOrFallback = getMemberOrFallback;
})();
