/**
 * Useme Team - Navigation Builder & Auth Handler
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const navContainer = document.querySelector('.sidebar-nav .nav-list');
  const sidebar = document.getElementById('sidebar');
  const currentPage = document.body.dataset.page || 'dashboard';

  const getIcon = (type) => {
    const icons = {
      dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      hierarchy: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      skills: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      tasks: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      submissions: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      projects: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      events: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      ranking: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>',
      insights: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>',
      resources: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
      reports: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      kra: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      engagement: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"></path></svg>'
    };
    return icons[type] || icons.dashboard;
  };

  const getPageUrl = (page) => {
    const urls = {
      dashboard: 'dashboard.html', hierarchy: 'hierarchy.html', skills: 'skill-mapping.html',
      tasks: 'tasks.html', submissions: 'submissions.html', projects: 'projects.html',
      events: 'events.html', ranking: 'ranking.html', kra: 'kra.html', insights: 'insights.html',
      resources: 'resources.html', reports: 'reports.html', engagement: 'engagement-motivation.html'
    };
    return urls[page] || '#';
  };

  const adminNav = [
    { label: 'Dashboard', page: 'dashboard', icon: 'dashboard' },
    { label: 'KRA & KPI', page: 'kra', icon: 'kra' },
    { label: 'Engagement & Motivation', page: 'engagement', icon: 'engagement' },
    { label: 'Team Hierarchy', page: 'hierarchy', icon: 'hierarchy' },
    { label: 'Skill Mapping', page: 'skills', icon: 'skills' },
    { label: 'Tasks', page: 'tasks', icon: 'tasks' },
    { label: 'Submissions', page: 'submissions', icon: 'submissions' },
    { label: 'Projects', page: 'projects', icon: 'projects' },
    { label: 'Events', page: 'events', icon: 'events' },
    { label: 'Ranking', page: 'ranking', icon: 'ranking' },
    { label: 'Insights (AI)', page: 'insights', icon: 'insights' },
    { label: 'Resources & Assets', page: 'resources', icon: 'resources' },
    { label: 'Reports', page: 'reports', icon: 'reports' }
  ];

  const memberNav = [
    { label: 'Dashboard', page: 'dashboard', icon: 'dashboard' },
    { label: 'My KRA & KPI', page: 'kra', icon: 'kra' },
    { label: 'Engagement & Motivation', page: 'engagement', icon: 'engagement' },
    { label: 'Skill Mapping', page: 'skills', icon: 'skills' },
    { label: 'My Tasks', page: 'tasks', icon: 'tasks' },
    { label: 'My Submissions', page: 'submissions', icon: 'submissions' },
    { label: 'My Projects', page: 'projects', icon: 'projects' },
    { label: 'My Events', page: 'events', icon: 'events' },
    { label: 'My Ranking', page: 'ranking', icon: 'ranking' }
  ];

  const items = role === 'admin' ? adminNav : memberNav;

  if (navContainer) {
    navContainer.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = getPageUrl(item.page);
      a.className = `nav-link ${item.page === currentPage ? 'active' : ''}`;
      a.dataset.page = item.page;
      a.innerHTML = `${getIcon(item.icon)}<span>${item.label}</span>`;
      li.appendChild(a);
      navContainer.appendChild(li);
    });
  }

  if (sidebar && !document.getElementById('sidebarFooter')) {
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.id = 'sidebarFooter';
    const isAdm = role === 'admin';
    const userId = localStorage.getItem('useme_user_id') || 'm5';
    footer.innerHTML = `
      <div class="sidebar-footer-row">
        <span class="role-badge ${isAdm ? 'admin' : 'member'}">${isAdm ? 'Admin' : 'Team Member'}</span>
        <button type="button" class="nav-profile-btn" id="navProfileBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>My Profile</span>
        </button>
      </div>
      <button type="button" class="logout-btn" id="logoutBtn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        <span>Logout</span>
      </button>
    `;
    sidebar.appendChild(footer);

    document.getElementById('navProfileBtn')?.addEventListener('click', () => {
      if (window.openMemberModal) window.openMemberModal(userId);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
});
