/**
 * Useme Team - Skill Search & Category Filter Controller (Step 11)
 */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('skillSearchInput');
  const searchClearBtn = document.getElementById('skillSearchClear');
  const filterBtn = document.getElementById('skillFilterBtn');
  const filterLabel = document.getElementById('skillFilterLabel');
  const filterDropdown = document.getElementById('skillFilterDropdown');
  const filterOptionsList = document.getElementById('filterOptionsList');
  const filterResetBtn = document.getElementById('skillFilterClearBtn');
  const tableBody = document.getElementById('memberTableBody');
  const filteredTitle = document.getElementById('filteredCategoryTitle');
  const memberCountBadge = document.getElementById('memberCountBadge');
  const btnManageCategories = document.getElementById('btnManageCategories');

  const u = window.currentUser || window.DataStore?.getCurrentUser();
  const isAdmin = u?.role === 'admin';

  if (!tableBody) return;

  let selectedCategory = null;

  function getCategories() {
    return window.DataStore ? window.DataStore.getSkillCategories() : [];
  }

  function getMembers() {
    return window.DataStore ? window.DataStore.getMembers() : [];
  }

  function initFilterDropdown() {
    if (!filterOptionsList) return;
    const categories = getCategories();
    filterOptionsList.innerHTML = categories.map(cat => `
      <div class="filter-option-item ${selectedCategory === cat.id ? 'selected' : ''}" data-category-id="${cat.id}">
        <span>${cat.name}</span><span class="filter-option-count">${cat.count}</span>
      </div>
    `).join('');

    filterOptionsList.querySelectorAll('.filter-option-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        setCategoryFilter(selectedCategory === item.dataset.categoryId ? null : item.dataset.categoryId);
        closeDropdown();
      };
    });
  }

  function setCategoryFilter(catId) {
    selectedCategory = catId;
    const categories = getCategories();
    const activeCat = categories.find(c => c.id === catId);
    if (filterBtn && filterLabel) {
      filterLabel.textContent = activeCat ? `Skill: ${activeCat.name}` : 'Filter by Skill Category';
      filterBtn.classList.toggle('active', !!activeCat);
    }
    if (filterOptionsList) {
      filterOptionsList.querySelectorAll('.filter-option-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.categoryId === catId);
      });
    }
    applyFilterAndSearch();
  }

  function applyFilterAndSearch() {
    const rawVal = searchInput ? searchInput.value.trim() : '';
    const query = rawVal.toLowerCase();
    if (searchClearBtn) searchClearBtn.style.display = rawVal ? 'block' : 'none';

    const categories = getCategories();
    const members = getMembers();
    let results = members;

    const activeCat = categories.find(c => c.id === selectedCategory);
    if (selectedCategory) {
      results = results.filter(m => m.skillCategory === selectedCategory);
    }

    if (query) {
      results = results.filter(m => {
        const nameMatch = (m.name || '').toLowerCase().includes(query);
        const roleMatch = (m.role || '').toLowerCase().includes(query);
        const skillsMatch = Array.isArray(m.skills) && m.skills.some(s => s.toLowerCase().includes(query));
        const catObj = categories.find(c => c.id === m.skillCategory);
        const catMatch = (m.skillCategory || '').toLowerCase().includes(query) || (catObj && catObj.name.toLowerCase().includes(query));
        return nameMatch || roleMatch || skillsMatch || catMatch;
      });
    }

    if (filteredTitle) {
      if (activeCat && query) filteredTitle.textContent = `${activeCat.name} Specialists`;
      else if (activeCat) filteredTitle.textContent = `${activeCat.name} Specialist Directory`;
      else if (query) filteredTitle.textContent = 'Search Results';
      else filteredTitle.textContent = 'Specialist Directory';
    }

    if (memberCountBadge) memberCountBadge.textContent = `${results.length} member${results.length === 1 ? '' : 's'}`;

    tableBody.innerHTML = '';
    if (results.length === 0) {
      const safeQuery = rawVal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const msg = safeQuery
        ? `No matches found for "<strong>${safeQuery}</strong>"${activeCat ? ` in ${activeCat.name}` : ''}.`
        : `No specialists currently mapped to this skill category.`;
      tableBody.innerHTML = `<tr><td colspan="6" class="no-results-cell">${msg}</td></tr>`;
      return;
    }

    results.forEach(m => {
      if (window.renderMemberRow) tableBody.appendChild(window.renderMemberRow(m));
    });
  }

  function toggleDropdown() {
    if (!filterDropdown) return;
    const isShown = filterDropdown.style.display === 'block';
    filterDropdown.style.display = isShown ? 'none' : 'block';
    if (filterBtn) filterBtn.setAttribute('aria-expanded', !isShown);
  }

  function closeDropdown() {
    if (filterDropdown) filterDropdown.style.display = 'none';
    if (filterBtn) filterBtn.setAttribute('aria-expanded', 'false');
  }

  if (filterBtn) filterBtn.onclick = (e) => { e.stopPropagation(); toggleDropdown(); };
  if (filterResetBtn) filterResetBtn.onclick = (e) => { e.stopPropagation(); setCategoryFilter(null); closeDropdown(); };
  if (searchInput) searchInput.oninput = applyFilterAndSearch;
  if (searchClearBtn) searchClearBtn.onclick = () => { searchInput.value = ''; searchInput.focus(); applyFilterAndSearch(); };
  document.addEventListener('click', (e) => { if (filterDropdown && !e.target.closest('#skillFilterWrapper')) closeDropdown(); });

  // Admin Category Management
  if (isAdmin && btnManageCategories) {
    btnManageCategories.style.display = 'inline-flex';
    btnManageCategories.onclick = openCategoriesModal;
  }

  function openCategoriesModal() {
    renderCategoriesTable();
    document.getElementById('categoriesModal')?.classList.add('active');
  }

  function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    const alertBox = document.getElementById('catAlertBox');
    if (alertBox) alertBox.style.display = 'none';
    if (!tbody) return;

    const categories = getCategories();
    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td><strong>${cat.name}</strong></td>
        <td><code>${cat.id}</code></td>
        <td style="font-size:11.5px; color:var(--color-text-muted);">${cat.description || '--'}</td>
        <td><span class="card-pill">${cat.count} specialist${cat.count === 1 ? '' : 's'}</span></td>
        <td>
          <div class="actions-cell">
            <button type="button" class="btn-action-edit" data-cat-act="edit" data-id="${cat.id}">Edit</button>
            <button type="button" class="btn-action-delete" data-cat-act="del" data-id="${cat.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.onclick = (e) => {
      const btn = e.target.closest('[data-cat-act]');
      if (!btn) return;
      const { catAct, id } = btn.dataset;

      if (catAct === 'edit') {
        const cat = window.DataStore?.getSkillCategoryById(id);
        if (!cat) return;
        document.getElementById('catEditId').value = cat.id;
        document.getElementById('catFormTitle').textContent = `Edit Skill Category (${cat.name})`;
        document.getElementById('catNameInput').value = cat.name;
        document.getElementById('catDescInput').value = cat.description || '';
        document.getElementById('categoryFormModal')?.classList.add('active');
      } else if (catAct === 'del') {
        const cat = window.DataStore?.getSkillCategoryById(id);
        if (!cat) return;
        if (confirm(`Are you sure you want to delete skill category "${cat.name}"?`)) {
          try {
            window.DataStore.deleteSkillCategory(id, u);
            renderCategoriesTable();
            initFilterDropdown();
            applyFilterAndSearch();
          } catch (err) {
            if (alertBox) {
              alertBox.textContent = err.message;
              alertBox.style.display = 'block';
            } else {
              alert(err.message);
            }
          }
        }
      }
    };
  }

  document.getElementById('btnAddCategory')?.addEventListener('click', () => {
    document.getElementById('catEditId').value = '';
    document.getElementById('catFormTitle').textContent = 'New Skill Category';
    document.getElementById('catNameInput').value = '';
    document.getElementById('catDescInput').value = '';
    document.getElementById('categoryFormModal')?.classList.add('active');
  });

  document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('catEditId').value;
    const name = document.getElementById('catNameInput').value.trim();
    const description = document.getElementById('catDescInput').value.trim();

    try {
      if (editId) {
        window.DataStore.updateSkillCategory(editId, { name, description }, u);
      } else {
        window.DataStore.createSkillCategory({ name, description }, u);
      }
      document.getElementById('categoryFormModal')?.classList.remove('active');
      renderCategoriesTable();
      initFilterDropdown();
      applyFilterAndSearch();
    } catch (err) {
      alert(err.message);
    }
  });

  // Edit / Self-Upgrade Proficiency Modal Handling
  tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="edit-prof"]');
    if (!btn) return;
    const { memberId, catId } = btn.dataset;
    const member = window.DataStore?.getMemberById(memberId);
    if (!member) return;

    const cats = getCategories();
    const cat = cats.find(c => c.id === catId || c.id === member.skillCategory) || { id: catId, name: 'General Competency' };

    document.getElementById('epMemberId').value = member.id;
    document.getElementById('epCategoryId').value = cat.id;
    document.getElementById('epMemberName').textContent = `${member.name} (${member.role})`;
    document.getElementById('epCategoryName').textContent = cat.name;

    const lvlSelect = document.getElementById('epLevelSelect');
    if (lvlSelect) {
      lvlSelect.value = member.proficiency || 'Intermediate';
    }

    const noticeEl = document.getElementById('epNotice');
    if (noticeEl) {
      if (isAdmin && member.id !== u?.id) {
        noticeEl.textContent = 'Admin override will verify this proficiency level immediately as "Admin Verified".';
      } else {
        noticeEl.textContent = 'Self-declared level updates are applied immediately and recorded as "Self-Declared".';
      }
    }

    document.getElementById('editProficiencyModal')?.classList.add('active');
  });

  document.getElementById('editProficiencyForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mid = document.getElementById('epMemberId').value;
    const cid = document.getElementById('epCategoryId').value;
    const lvl = document.getElementById('epLevelSelect').value;

    try {
      window.DataStore.upgradeSkillProficiency(mid, cid, lvl, u);
      document.getElementById('editProficiencyModal')?.classList.remove('active');
      initFilterDropdown();
      applyFilterAndSearch();
    } catch (err) {
      alert(err.message);
    }
  });

  // Close handlers
  const closeAllModals = () => {
    document.getElementById('categoriesModal')?.classList.remove('active');
    document.getElementById('categoryFormModal')?.classList.remove('active');
    document.getElementById('editProficiencyModal')?.classList.remove('active');
  };

  document.getElementById('catModalClose')?.addEventListener('click', closeAllModals);
  document.getElementById('catFormClose')?.addEventListener('click', closeAllModals);
  document.getElementById('catCancelBtn')?.addEventListener('click', closeAllModals);
  document.getElementById('epCloseBtn')?.addEventListener('click', closeAllModals);
  document.getElementById('epCancelBtn')?.addEventListener('click', closeAllModals);

  ['categoriesModal', 'categoryFormModal', 'editProficiencyModal'].forEach(mId => {
    const m = document.getElementById(mId);
    if (m) {
      m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  window.addEventListener('useme:member-updated', () => {
    initFilterDropdown();
    applyFilterAndSearch();
  });

  initFilterDropdown();
  const urlParams = new URLSearchParams(window.location.search);
  const paramCat = urlParams.get('cat'), paramSkill = urlParams.get('skill');
  if (paramCat) setCategoryFilter(paramCat);
  else if (paramSkill && searchInput) { searchInput.value = paramSkill; }
  applyFilterAndSearch();
});
