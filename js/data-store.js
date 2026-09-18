/**
 * Useme Team - Centralized Data Store (Queries & Core Engine)
 */
(function() {
  const STORAGE_KEY = 'useme_data_store';
  const clone = (obj) => (obj === undefined ? undefined : JSON.parse(JSON.stringify(obj)));

  function sha256(str) {
    const ascii = unescape(encodeURIComponent(String(str || '')));
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    let words = [];
    let asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [], k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    let padded = ascii + '\x80';
    while (padded[lengthProperty] % 64 - 56) padded += '\x00';
    for (i = 0; i < padded[lengthProperty]; i++) {
      j = padded.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength) | 0;
    for (j = 0; j < words[lengthProperty];) {
      let w = words.slice(j, j += 16);
      let oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        let w15 = w[i - 15], w2 = w[i - 2];
        let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        let s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        let ch = (hash[4] & hash[5]) ^ ((~hash[4]) & hash[6]);
        let temp1 = hash[7] + s1h + ch + k[i] + w[i];
        let s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        let temp2 = s0h + maj;
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        let b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  function initData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        const seedMembers = (window.USEME_DATA && window.USEME_DATA.members) || [];
        const seedTasks = (window.USEME_DATA && window.USEME_DATA.tasks) || [];
        let upgraded = false;

        if (!parsed.isSeeded || !parsed.members || parsed.members.length < seedMembers.length || (parsed.tasks && parsed.tasks.length < 100)) {
          if (seedMembers.length >= 50) {
            parsed = clone(window.USEME_DATA);
            upgraded = true;
          }
        }
        (parsed.members || []).forEach(m => {
          const s = seedMembers.find(sm => sm.id === m.id);
          if (!m.department) { m.department = s?.department || 'Engineering'; upgraded = true; }
          if (!m.band) { m.band = s?.band || 'L4 - Specialist'; upgraded = true; }
          if (!m.location) { m.location = s?.location || 'Bangalore, IN'; upgraded = true; }
          if (!m.startDate) { m.startDate = s?.startDate || '2023-01-15'; upgraded = true; }
          if (m.reportsTo === undefined) { m.reportsTo = s?.reportsTo ?? null; upgraded = true; }
          if (!m.username) {
            m.username = s?.username || (m.name ? m.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.') : m.id);
            upgraded = true;
          }
          if (!m.passwordHash) {
            if (s?.passwordHash) {
              m.passwordHash = s.passwordHash;
            } else if (m.id === 'm1') {
              m.passwordHash = sha256('Useme@Admin1');
            } else if (m.id === 'm5') {
              m.passwordHash = sha256('Useme@Member1');
            } else if (m.id === 'm3') {
              m.passwordHash = sha256('Useme@Member2');
            } else if (m.id === 'm7') {
              m.passwordHash = sha256('Useme@Member3');
            } else {
              m.passwordHash = sha256('Useme@2026');
            }
            upgraded = true;
          }
        });
        if (!parsed.cycles || !Array.isArray(parsed.cycles) || parsed.cycles.length === 0) {
          parsed.cycles = clone(seedMembers && window.USEME_DATA?.cycles ? window.USEME_DATA.cycles : [
            { id: 'cycle-mar-2026', label: 'Mar 2026', startDate: '2026-03-01', endDate: '2026-03-31', isCurrent: false },
            { id: 'cycle-apr-2026', label: 'Apr 2026', startDate: '2026-04-01', endDate: '2026-04-30', isCurrent: false },
            { id: 'cycle-may-2026', label: 'May 2026', startDate: '2026-05-01', endDate: '2026-05-31', isCurrent: false },
            { id: 'cycle-jun-2026', label: 'Jun 2026', startDate: '2026-06-01', endDate: '2026-06-30', isCurrent: false },
            { id: 'cycle-jul-2026', label: 'Jul 2026', startDate: '2026-07-01', endDate: '2026-07-31', isCurrent: false },
            { id: 'cycle-aug-2026', label: 'Aug 2026', startDate: '2026-08-01', endDate: '2026-08-31', isCurrent: true }
          ]);
          upgraded = true;
        }
        if (!parsed.activityLog || !Array.isArray(parsed.activityLog)) {
          parsed.activityLog = clone(window.USEME_DATA?.activityLog || [
            { id: 'act-1', actorMemberId: 'm5', actionText: 'logged "Tech Meetup On-Ground Booth"', timestamp: '2026-08-25T14:20:00.000Z', relatedEntityType: 'engagement', relatedEntityId: 'eng-2' },
            { id: 'act-2', actorMemberId: 'm3', actionText: 'approved "LinkedIn Platform Spotlight"', timestamp: '2026-08-25T13:45:00.000Z', relatedEntityType: 'task', relatedEntityId: 't6' },
            { id: 'act-3', actorMemberId: 'm12', actionText: 'marked Present in "Weekly Strategy Zoom Sync"', timestamp: '2026-08-25T12:30:00.000Z', relatedEntityType: 'attendance', relatedEntityId: 'z1' }
          ]);
          upgraded = true;
        }
        if (!parsed.kraPillars || !Array.isArray(parsed.kraPillars) || parsed.kraPillars.length === 0) {
          parsed.kraPillars = clone(window.USEME_DATA?.kraPillars || [
            { id: 'pillar-growth', name: 'Growth', weight: 25, targetDescription: 'Platform Deliverables & Milestone Output Velocity', order: 1 },
            { id: 'pillar-quality', name: 'Quality', weight: 25, targetDescription: 'Quality Assurance & First-Try Approval Standards', order: 2 },
            { id: 'pillar-timeliness', name: 'Timeliness', weight: 20, targetDescription: 'On-Time Delivery & Schedule Adherence', order: 3 },
            { id: 'pillar-skill', name: 'Skill', weight: 15, targetDescription: 'Competency Mastery & Skill Proficiency Growth', order: 4 },
            { id: 'pillar-compliance', name: 'Compliance', weight: 15, targetDescription: 'Process Adherence & Statutory Standard Execution', order: 5 }
          ]);
          upgraded = true;
        }
        if (!parsed.kraScores || !Array.isArray(parsed.kraScores) || parsed.kraScores.length === 0) {
          parsed.kraScores = clone(window.USEME_DATA?.kraScores || []);
          upgraded = true;
        }
        if (!parsed.activityTypes || !Array.isArray(parsed.activityTypes) || parsed.activityTypes.length === 0) {
          parsed.activityTypes = clone(window.USEME_DATA?.activityTypes || [
            { id: 'social', label: 'Social Media', category: 'outreach', pointValue: 2, requiresProof: true },
            { id: 'onGround', label: 'On-Ground Visit', category: 'outreach', pointValue: 5, requiresProof: true },
            { id: 'whatsapp', label: 'WhatsApp Group', category: 'outreach', pointValue: 2, requiresProof: false },
            { id: 'offlineAds', label: 'Offline / Print Ad', category: 'outreach', pointValue: 4, requiresProof: true },
            { id: 'socialAds', label: 'Social Media Ads', category: 'outreach', pointValue: 3, requiresProof: true },
            { id: 'groupTalk', label: 'Group Talk', category: 'motivation', pointValue: 4, requiresProof: true },
            { id: 'microEvent', label: 'Micro Event', category: 'motivation', pointValue: 5, requiresProof: true }
          ]);
          upgraded = true;
        }
        if (!parsed.departments || !Array.isArray(parsed.departments) || parsed.departments.length === 0) {
          parsed.departments = clone(window.USEME_DATA?.departments || [
            { id: 'dept-exec', name: 'Executive', colorHex: '#4F46E5', order: 1 },
            { id: 'dept-eng', name: 'Engineering', colorHex: '#2563EB', order: 2 },
            { id: 'dept-prod', name: 'Product & Design', colorHex: '#D97706', order: 3 },
            { id: 'dept-growth', name: 'Growth & Marketing', colorHex: '#059669', order: 4 },
            { id: 'dept-fin', name: 'Finance & Operations', colorHex: '#0D9488', order: 5 },
            { id: 'dept-data', name: 'Data & Analytics', colorHex: '#7C3AED', order: 6 },
            { id: 'dept-supp', name: 'Customer Support', colorHex: '#E11D48', order: 7 }
          ]);
          upgraded = true;
        }
        if (!parsed.skillCategories || !Array.isArray(parsed.skillCategories) || parsed.skillCategories.length === 0) {
          const rawCats = parsed.categories || window.USEME_DATA?.skillCategories || window.USEME_DATA?.categories || [];
          parsed.skillCategories = rawCats.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || ''
          }));
          upgraded = true;
        }
        if (!parsed.skillProficiencies || !Array.isArray(parsed.skillProficiencies) || parsed.skillProficiencies.length === 0) {
          parsed.skillProficiencies = clone(window.USEME_DATA?.skillProficiencies || []);
          if (parsed.skillProficiencies.length === 0) {
            (parsed.members || []).forEach(m => {
              if (m.skillCategory) {
                parsed.skillProficiencies.push({
                  id: `sp-${m.id}-${m.skillCategory}`,
                  memberId: m.id,
                  categoryId: m.skillCategory,
                  level: m.proficiency || 'Intermediate',
                  lastUpdated: '2026-08-15T10:00:00.000Z',
                  updatedBy: 'm1'
                });
              }
            });
          }
          upgraded = true;
        }
        (parsed.members || []).forEach(m => {
          if (m.isActive === undefined) { m.isActive = true; upgraded = true; }
        });
        (parsed.zoomSessions || []).forEach(z => {
          if (!z.time) { z.time = '10:00 AM'; upgraded = true; }
        });
        if (upgraded) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (err) {}
        }
        return parsed;
      }
    } catch (e) {
      console.error('[DataStore] Failed to read from localStorage:', e);
    }
    const seed = window.USEME_DATA || {};
    const initial = {
      categories: clone(seed.categories || []),
      skillCategories: clone(seed.skillCategories || [
        { id: 'dev', name: 'Software Development', description: 'Web, backend, frontend, APIs, and distributed systems architecture' },
        { id: 'data', name: 'Data Analysis', description: 'Data modeling, BI reporting, telemetry, and analytics pipelines' },
        { id: 'finance', name: 'CA / Finance', description: 'Financial auditing, accounting, GST compliance, and forecasting' },
        { id: 'design', name: 'Printing & Design', description: 'Packaging, visual identity, UI/UX prototyping, and print assets' },
        { id: 'marketing', name: 'Marketing', description: 'Growth hacking, performance advertising, and campaign optimization' },
        { id: 'support', name: 'Tech Support', description: 'Customer troubleshooting, hardware diagnostics, and ticket resolution' }
      ]),
      skillProficiencies: clone(seed.skillProficiencies || []),
      members: clone(seed.members || []),
      tasks: clone(seed.tasks || []),
      projects: clone(seed.projects || []),
      events: clone(seed.events || []),
      kraObjectives: clone(seed.kraObjectives || []),
      kraHistory: clone(seed.kraHistory || { months: [], org: [], members: {} }),
      engagementSubmissions: clone(seed.engagementSubmissions || []),
      zoomSessions: clone(seed.zoomSessions || []),
      activityTypes: clone(seed.activityTypes || [
        { id: 'social', label: 'Social Media', category: 'outreach', pointValue: 2, requiresProof: true },
        { id: 'onGround', label: 'On-Ground Visit', category: 'outreach', pointValue: 5, requiresProof: true },
        { id: 'whatsapp', label: 'WhatsApp Group', category: 'outreach', pointValue: 2, requiresProof: false },
        { id: 'offlineAds', label: 'Offline / Print Ad', category: 'outreach', pointValue: 4, requiresProof: true },
        { id: 'socialAds', label: 'Social Media Ads', category: 'outreach', pointValue: 3, requiresProof: true },
        { id: 'groupTalk', label: 'Group Talk', category: 'motivation', pointValue: 4, requiresProof: true },
        { id: 'microEvent', label: 'Micro Event', category: 'motivation', pointValue: 5, requiresProof: true }
      ]),
      motivationSubmissions: clone(seed.motivationSubmissions || []),
      cycles: clone(seed.cycles || []),
      activityLog: clone(seed.activityLog || []),
      kraPillars: clone(seed.kraPillars || []),
      kraScores: clone(seed.kraScores || []),
      departments: clone(seed.departments || [
        { id: 'dept-exec', name: 'Executive', colorHex: '#4F46E5', order: 1 },
        { id: 'dept-eng', name: 'Engineering', colorHex: '#2563EB', order: 2 },
        { id: 'dept-prod', name: 'Product & Design', colorHex: '#D97706', order: 3 },
        { id: 'dept-growth', name: 'Growth & Marketing', colorHex: '#059669', order: 4 },
        { id: 'dept-fin', name: 'Finance & Operations', colorHex: '#0D9488', order: 5 },
        { id: 'dept-data', name: 'Data & Analytics', colorHex: '#7C3AED', order: 6 },
        { id: 'dept-supp', name: 'Customer Support', colorHex: '#E11D48', order: 7 }
      ])
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.error('[DataStore] Failed to persist initial seed:', e);
    }
    return initial;
  }

  const _data = initData();
  window.USEME_DATA = _data;

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('[DataStore] Failed to persist state:', e);
    }
  }

  const deny = (act, u, msg) => {
    console.error(`[DataStore] Unauthorized: ${act} (${msg}) by ${u?.id || 'unknown'} [${u?.role}]`);
    throw new Error(`[DataStore] Unauthorized: ${act} (${msg})`);
  };
  const reqAdmin = (act, u) => { if (u?.role !== 'admin') deny(act, u, 'Admin only'); };

  function filterList(list, f) {
    if (!list) return [];
    if (!f) return list.slice();
    if (typeof f === 'function') return list.filter(f);
    return list.filter(item => Object.entries(f).every(([k, v]) => {
      if (v === undefined || v === null || v === 'all') return true;
      if (k === 'memberId' || k === 'assignedTo') {
        if (Array.isArray(item.assignedTo)) return item.assignedTo.includes(v);
        if (Array.isArray(item.memberIds)) return item.memberIds.includes(v);
        if (Array.isArray(item.members)) return item.members.some(m => (m.memberId || m) === v);
        return item.memberId === v;
      }
      if (Array.isArray(item[k])) return item[k].includes(v);
      return item[k] === v;
    }));
  }

  window.DataStore = {
    _data,
    _persist: persist,
    _clone: clone,
    hashPassword: (pwd) => sha256(pwd),
    authenticate: (identifier, password, requestedRole) => {
      if (!identifier || !password) return null;
      const idClean = identifier.toLowerCase().trim();
      const enteredHash = sha256(password);
      const activeMembers = (_data.members || []).filter(m => m.isActive !== false);
      const member = activeMembers.find(m => 
        (m.username && m.username.toLowerCase() === idClean) ||
        (m.email && m.email.toLowerCase() === idClean)
      );
      if (!member) return null;
      if (member.passwordHash !== enteredHash) return null;
      const isAdm = member.id === 'm1' || member.department === 'Executive';
      const inherentRole = isAdm ? 'admin' : 'member';
      if (requestedRole === 'admin' && inherentRole !== 'admin') {
        return null;
      }
      const resolvedRole = (requestedRole === 'admin' && inherentRole === 'admin') ? 'admin' : inherentRole;
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        email: member.email,
        role: resolvedRole,
        department: member.department,
        avatar: member.avatar
      };
    },
    getMembers: (f) => {
      let list = _data.members || [];
      if (!f || f.includeInactive !== true) {
        list = list.filter(m => m.isActive !== false);
      }
      if (typeof f === 'function') return list.filter(f);
      return filterList(list, f);
    },
    getMemberById: (id) => {
      const m = (_data.members || []).find(x => x.id === id);
      return m ? { ...m } : null;
    },
    getDepartments: () => {
      const list = (_data.departments || []).slice();
      return list.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    getDepartmentById: (id) => {
      const d = (_data.departments || []).find(x => x.id === id || x.name.toLowerCase() === (id || '').toLowerCase());
      return d ? { ...d } : null;
    },
    getTasks: (f) => {
      let list = _data.tasks || [];
      if (!f || f.includeArchived !== true) {
        list = list.filter(t => t.isArchived !== true);
      }
      if (typeof f === 'function') return list.filter(f);
      if (f && f.includeArchived !== undefined) {
        const copy = { ...f };
        delete copy.includeArchived;
        return filterList(list, copy);
      }
      return filterList(list, f);
    },
    getTaskById: (id) => {
      const t = (_data.tasks || []).find(x => x.id === id);
      return t ? { ...t } : null;
    },
    getProjects: (f) => filterList(_data.projects, f),
    getProjectById: (id) => {
      const p = (_data.projects || []).find(x => x.id === id);
      return p ? { ...p } : null;
    },
    getEvents: (f) => filterList(_data.events, f),
    getEventById: (id) => {
      const e = (_data.events || []).find(x => x.id === id);
      return e ? { ...e } : null;
    },
    getSkillCategories: () => {
      const cats = _data.skillCategories || [];
      const activeMembers = (_data.members || []).filter(m => m.isActive !== false);
      const activeIdSet = new Set(activeMembers.map(m => m.id));
      const profs = _data.skillProficiencies || [];
      return cats.map(c => {
        const memberIds = new Set(
          profs
            .filter(p => p.categoryId === c.id && activeIdSet.has(p.memberId))
            .map(p => p.memberId)
        );
        activeMembers.forEach(m => {
          if (m.skillCategory === c.id) memberIds.add(m.id);
        });
        return {
          id: c.id,
          name: c.name,
          description: c.description || '',
          count: memberIds.size
        };
      });
    },
    getCategories: () => window.DataStore.getSkillCategories(),
    getSkillCategoryById: (id) => {
      const cats = window.DataStore.getSkillCategories();
      return cats.find(c => c.id === id || c.name.toLowerCase() === (id || '').toLowerCase()) || null;
    },
    getSkillProficiencies: (filters) => {
      let list = (_data.skillProficiencies || []).slice();
      if (!filters) return list;
      if (typeof filters === 'function') return list.filter(filters);
      return list.filter(item => {
        if (filters.memberId && item.memberId !== filters.memberId) return false;
        if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
        if (filters.level && item.level !== filters.level) return false;
        return true;
      });
    },
    getEngagementSubmissions: (f) => filterList(_data.engagementSubmissions, f),
    getMotivationSubmissions: (f) => filterList(_data.motivationSubmissions, f),
    getZoomSessions: (f) => {
      let list = (_data.zoomSessions || []).slice();
      if (!f) return list;
      if (typeof f === 'function') return list.filter(f);
      if (typeof f === 'object') {
        if (f.startDate) list = list.filter(s => s.date >= f.startDate);
        if (f.endDate) list = list.filter(s => s.date <= f.endDate);
        return list.filter(item => Object.entries(f).every(([k, v]) => {
          if (k === 'startDate' || k === 'endDate' || v === undefined || v === null || v === 'all') return true;
          return item[k] === v;
        }));
      }
      return list;
    },
    getZoomSessionById: (id) => {
      const z = (_data.zoomSessions || []).find(x => x.id === id);
      return z ? { ...z } : null;
    },
    getActivityTypes: (category) => {
      const list = (_data.activityTypes || []).slice();
      if (!category || category === 'all') return list;
      return list.filter(t => t.category === category);
    },
    getActivityTypeById: (id) => {
      const t = (_data.activityTypes || []).find(x => x.id === id);
      return t ? { ...t } : null;
    },
    getKraObjectives: () => (_data.kraObjectives || []).slice(),
    getKraHistory: () => (_data.kraHistory || { months: [], org: [], members: {} }),
    updateMemberScores: (id, scores) => {
      const m = (_data.members || []).find(x => x.id === id);
      if (!m) return null;
      Object.assign(m, scores);
      persist();
      return { ...m };
    },
    getCurrentUser: () => {
      const loggedIn = localStorage.getItem('useme_logged_in') === 'true';
      const role = localStorage.getItem('useme_role') || 'member';
      const userId = localStorage.getItem('useme_user_id') || 'm5';
      const member = (_data.members || []).find(m => m.id === userId);
      if (member) return { ...member, role, loggedIn };
      return { id: userId, role, name: role === 'admin' ? 'Admin' : 'Team Member', loggedIn };
    },

    // Review Cycle APIs
    getCycles: () => (_data.cycles || []).slice(),
    getCycleById: (id) => {
      const c = (_data.cycles || []).find(x => x.id === id);
      return c ? { ...c } : null;
    },
    getCurrentCycle: () => {
      const curr = (_data.cycles || []).find(c => c.isCurrent);
      const c = curr || _data.cycles?.[_data.cycles.length - 1];
      return c ? { ...c } : null;
    },
    createCycle: (cycleData, currentUser) => {
      reqAdmin('createCycle', currentUser);
      if (!cycleData || !cycleData.label || !cycleData.startDate || !cycleData.endDate) {
        throw new Error('Cycle label, start date, and end date are required');
      }
      const label = cycleData.label.trim();
      if ((_data.cycles || []).some(c => c.label.toLowerCase() === label.toLowerCase())) {
        throw new Error(`A cycle with label "${label}" already exists`);
      }
      const id = cycleData.id || ('cycle-' + label.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000));
      const isCurrent = !!cycleData.isCurrent;
      if (isCurrent) {
        (_data.cycles || []).forEach(c => { c.isCurrent = false; });
      }
      const newCycle = {
        id,
        label,
        startDate: cycleData.startDate,
        endDate: cycleData.endDate,
        isCurrent
      };
      _data.cycles = _data.cycles || [];
      _data.cycles.push(newCycle);
      persist();
      window.DataStore.logActivity(currentUser?.id, `created review cycle "${newCycle.label}"`, 'cycle', newCycle.id);
      return clone(newCycle);
    },
    updateCycle: (cycleId, updates, currentUser) => {
      reqAdmin('updateCycle', currentUser);
      const cycle = (_data.cycles || []).find(c => c.id === cycleId);
      if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);
      if (updates.label) cycle.label = updates.label.trim();
      if (updates.startDate) cycle.startDate = updates.startDate;
      if (updates.endDate) cycle.endDate = updates.endDate;
      if (updates.isCurrent !== undefined) {
        const isCurr = !!updates.isCurrent;
        if (isCurr) {
          (_data.cycles || []).forEach(c => { c.isCurrent = (c.id === cycleId); });
        } else {
          cycle.isCurrent = false;
        }
      }
      persist();
      window.DataStore.logActivity(currentUser?.id, `updated review cycle "${cycle.label}"`, 'cycle', cycle.id);
      return clone(cycle);
    },
    deleteCycle: (cycleId, currentUser) => {
      reqAdmin('deleteCycle', currentUser);
      const cycle = (_data.cycles || []).find(c => c.id === cycleId);
      if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);
      if (cycle.isCurrent) {
        throw new Error(`Cannot delete active cycle "${cycle.label}". Please set another cycle as current first.`);
      }

      // Check conflicts in tasks, engagement, motivation, kra
      const conflicts = [];
      const sDate = cycle.startDate, eDate = cycle.endDate;

      const refTasks = (_data.tasks || []).filter(t => t.cycleId === cycleId || (sDate && eDate && t.dueDate >= sDate && t.dueDate <= eDate));
      if (refTasks.length > 0) conflicts.push(`${refTasks.length} task(s)`);

      const refEng = (_data.engagementSubmissions || []).filter(e => e.cycleId === cycleId || (sDate && eDate && e.date >= sDate && e.date <= eDate));
      if (refEng.length > 0) conflicts.push(`${refEng.length} engagement submission(s)`);

      const refMot = (_data.motivationSubmissions || []).filter(m => m.cycleId === cycleId || (sDate && eDate && m.date >= sDate && m.date <= eDate));
      if (refMot.length > 0) conflicts.push(`${refMot.length} motivation submission(s)`);

      const refKra = (_data.kraHistory?.months || []).some(m => cycle.label.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(cycle.label.slice(0, 3).toLowerCase()));
      if (refKra) conflicts.push('historical KRA performance data');

      if (conflicts.length > 0) {
        throw new Error(`Cannot delete cycle "${cycle.label}" because active data references it: ${conflicts.join(', ')}.`);
      }

      const idx = _data.cycles.findIndex(c => c.id === cycleId);
      _data.cycles.splice(idx, 1);
      persist();
      window.DataStore.logActivity(currentUser?.id, `deleted review cycle "${cycle.label}"`, 'cycle', cycleId);
      return true;
    },
    setCurrentCycle: (cycleId, currentUser) => {
      reqAdmin('setCurrentCycle', currentUser);
      const target = (_data.cycles || []).find(c => c.id === cycleId);
      if (!target) throw new Error(`Cycle not found: ${cycleId}`);
      _data.cycles.forEach(c => {
        c.isCurrent = (c.id === cycleId);
      });
      persist();
      const idx = _data.cycles.findIndex(c => c.id === cycleId);
      if (idx !== -1) {
        try { localStorage.setItem('useme_review_cycle', idx); } catch (e) {}
      }
      window.DataStore.logActivity(currentUser?.id, `switched active review cycle to "${target.label}"`, 'cycle', target.id);
      return clone(target);
    },

    // Activity Log APIs
    getActivityLog: (limit) => {
      const list = clone(_data.activityLog || []);
      return typeof limit === 'number' ? list.slice(0, limit) : list;
    },
    logActivity: (actorMemberId, actionText, relatedEntityType, relatedEntityId) => {
      const entry = {
        id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        actorMemberId: actorMemberId || 'm1',
        actionText: actionText || '',
        timestamp: new Date().toISOString(),
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null
      };
      _data.activityLog = _data.activityLog || [];
      _data.activityLog.unshift(entry);
      if (_data.activityLog.length > 100) _data.activityLog.length = 100;
      persist();
      return clone(entry);
    },

    // KRA Strategic Pillar APIs
    getKraPillars: () => {
      return (_data.kraPillars || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    getKraPillarById: (id) => {
      const p = (_data.kraPillars || []).find(x => x.id === id);
      return p ? { ...p } : null;
    },
    createKraPillar: (pillarData, currentUser) => {
      reqAdmin('createKraPillar', currentUser);
      if (!pillarData || !pillarData.name || pillarData.weight === undefined) {
        throw new Error('Pillar name and weight are required');
      }
      const name = pillarData.name.trim();
      if ((_data.kraPillars || []).some(p => p.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`A pillar with name "${name}" already exists`);
      }
      const newWeight = Number(pillarData.weight);
      if (isNaN(newWeight) || newWeight <= 0) {
        throw new Error('Pillar weight must be a positive number');
      }
      const currentSum = (_data.kraPillars || []).reduce((sum, p) => sum + Number(p.weight || 0), 0);
      const total = Math.round((currentSum + newWeight) * 10) / 10;
      if (total !== 100) {
        throw new Error(`Total weight of all pillars must equal 100% (currently ${total}% with +${newWeight}%)`);
      }
      const id = pillarData.id || ('pillar-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
      const newPillar = {
        id,
        name,
        weight: newWeight,
        targetDescription: (pillarData.targetDescription || '').trim(),
        order: pillarData.order !== undefined ? Number(pillarData.order) : ((_data.kraPillars || []).length + 1)
      };
      _data.kraPillars = _data.kraPillars || [];
      _data.kraPillars.push(newPillar);
      persist();
      window.DataStore.logActivity(currentUser?.id, `created pillar "${newPillar.name}" with weight ${newPillar.weight}%`, 'kraPillar', newPillar.id);
      return clone(newPillar);
    },
    updateKraPillar: (pillarId, updates, currentUser) => {
      reqAdmin('updateKraPillar', currentUser);
      const pillar = (_data.kraPillars || []).find(p => p.id === pillarId);
      if (!pillar) throw new Error(`Pillar not found: ${pillarId}`);
      if (updates.weight !== undefined) {
        const newWeight = Number(updates.weight);
        if (isNaN(newWeight) || newWeight <= 0) {
          throw new Error('Pillar weight must be a positive number');
        }
        const total = Math.round((_data.kraPillars.reduce((sum, p) => sum + (p.id === pillarId ? newWeight : Number(p.weight || 0)), 0)) * 10) / 10;
        if (total !== 100) {
          throw new Error(`Total weight of all pillars must equal 100% (currently ${total}%)`);
        }
        pillar.weight = newWeight;
      }
      if (updates.name) pillar.name = updates.name.trim();
      if (updates.targetDescription !== undefined) pillar.targetDescription = updates.targetDescription.trim();
      if (updates.order !== undefined) pillar.order = Number(updates.order);
      persist();
      window.DataStore.logActivity(currentUser?.id, `updated pillar "${pillar.name}" weight to ${pillar.weight}%`, 'kraPillar', pillar.id);
      return clone(pillar);
    },
    deleteKraPillar: (pillarId, currentUser) => {
      reqAdmin('deleteKraPillar', currentUser);
      const pillar = (_data.kraPillars || []).find(p => p.id === pillarId);
      if (!pillar) throw new Error(`Pillar not found: ${pillarId}`);
      const hasScores = (_data.kraScores || []).some(s => s.pillarId === pillarId || s.pillarId === pillar.name.toLowerCase() || s.pillarId === ('pillar-' + pillar.name.toLowerCase()));
      const hasObj = (_data.kraObjectives || []).some(o => o.pillar.toLowerCase() === pillar.name.toLowerCase() || o.id === pillarId);
      if (hasScores || hasObj) {
        throw new Error(`Cannot delete pillar "${pillar.name}" because active scores or performance history reference it.`);
      }
      const idx = _data.kraPillars.findIndex(p => p.id === pillarId);
      _data.kraPillars.splice(idx, 1);
      persist();
      window.DataStore.logActivity(currentUser?.id, `deleted pillar "${pillar.name}"`, 'kraPillar', pillarId);
      return true;
    },
    reorderKraPillars: (orderedIdList, currentUser) => {
      reqAdmin('reorderKraPillars', currentUser);
      if (!Array.isArray(orderedIdList)) throw new Error('Ordered ID list must be an array');
      orderedIdList.forEach((id, idx) => {
        const p = (_data.kraPillars || []).find(x => x.id === id);
        if (p) p.order = idx + 1;
      });
      persist();
      window.DataStore.logActivity(currentUser?.id, 'reordered KRA strategic pillars', 'kraPillar', null);
      return clone((_data.kraPillars || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)));
    },

    // KRA Per-Member Score Entry APIs
    getKraScores: (filters) => {
      return filterList(_data.kraScores || [], filters);
    },
    setKraScore: (memberId, cycleId, pillarId, score, notes, currentUser) => {
      reqAdmin('setKraScore', currentUser);
      if (!memberId || !cycleId || !pillarId) {
        throw new Error('memberId, cycleId, and pillarId are required');
      }
      const numScore = Number(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 100) {
        throw new Error('Score must be a number between 0 and 100');
      }
      const cleanScore = Math.round(numScore * 10) / 10;
      _data.kraScores = _data.kraScores || [];
      let record = _data.kraScores.find(s =>
        s.memberId === memberId &&
        s.cycleId === cycleId &&
        (s.pillarId === pillarId || s.pillarId.toLowerCase() === pillarId.toLowerCase())
      );
      if (record) {
        record.score = cleanScore;
        if (notes !== undefined) record.notes = String(notes || '').trim();
        record.enteredBy = currentUser?.id || 'admin';
        record.enteredAt = new Date().toISOString();
      } else {
        record = {
          id: 'score-' + memberId + '-' + pillarId.replace(/[^a-z0-9]/gi, '-') + '-' + Date.now().toString().slice(-4),
          memberId,
          cycleId,
          pillarId,
          score: cleanScore,
          notes: String(notes || '').trim(),
          enteredBy: currentUser?.id || 'admin',
          enteredAt: new Date().toISOString()
        };
        _data.kraScores.push(record);
      }
      // Keep legacy memberActuals in kraObjectives synchronized for seamless backwards compatibility
      const pMatch = (_data.kraPillars || []).find(p => p.id === pillarId || p.name.toLowerCase() === pillarId.toLowerCase());
      const pName = pMatch ? pMatch.name : pillarId;
      const obj = (_data.kraObjectives || []).find(o => o.pillar.toLowerCase() === pName.toLowerCase() || o.id === pillarId);
      if (obj && obj.memberActuals) {
        obj.memberActuals[memberId] = cleanScore;
      }
      persist();
      const m = (_data.members || []).find(x => x.id === memberId);
      const memberName = m ? m.name : memberId;
      window.DataStore.logActivity(currentUser?.id, `scored ${memberName}'s ${pName} pillar: ${cleanScore}%`, 'kraScore', record.id);
      return clone(record);
    },
    getMemberOverallKraAttainment: (memberId, cycleId) => {
      const pillars = (_data.kraPillars || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      const scores = (_data.kraScores || []).filter(s => s.memberId === memberId && s.cycleId === cycleId);
      let total = 0;
      pillars.forEach(p => {
        const entry = scores.find(s => s.pillarId === p.id || s.pillarId.toLowerCase() === p.name.toLowerCase());
        const scoreVal = entry ? entry.score : 80;
        total += scoreVal * (Number(p.weight || 0) / 100);
      });
      return Math.round(total * 10) / 10;
    },
    reseed: () => {
      const source = window.USEME_SEEDED_DATA || window.USEME_DATA;
      if (source && source.members && source.members.length >= 50) {
        _data = clone(source);
        _data.isSeeded = true;
        persist();
        return true;
      }
      return false;
    }
  };
  window.currentUser = window.DataStore.getCurrentUser();
  window.reseedDatabase = () => {
    const ok = window.DataStore.reseed();
    if (ok && typeof window.location !== 'undefined') {
      window.location.reload();
    }
    return ok;
  };
})();

