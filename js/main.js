/**
 * Useme Team - Main Application Script
 */
window.currentUser = window.DataStore ? window.DataStore.getCurrentUser() : null;

document.addEventListener('DOMContentLoaded', () => {
  if (!window.currentUser && window.DataStore) {
    window.currentUser = window.DataStore.getCurrentUser();
  }
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle && sidebar && sidebarOverlay) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    };

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
});
