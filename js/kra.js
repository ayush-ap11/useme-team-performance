/**
 * Useme Team - KRA & KPI Visual Performance Layer
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const isAdm = role === 'admin';

  const members = window.DataStore ? window.DataStore.getMembers() : [];
  const kraObjectives = window.DataStore ? window.DataStore.getKraObjectives() : [];
  const kraHistory = window.DataStore ? window.DataStore.getKraHistory() : { months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], org: [82, 84, 85, 87, 89, 90.2], members: {} };

  let activeMemberId = isAdm ? 'all' : currentUserId;
  const storeCycles = window.DataStore ? window.DataStore.getCycles() : [];
  const currCycleIdx = storeCycles.findIndex(c => c.isCurrent);
  let activeCycleIdx = parseInt(localStorage.getItem('useme_review_cycle') || (currCycleIdx !== -1 ? currCycleIdx : '5'), 10);
  if (isNaN(activeCycleIdx) || activeCycleIdx < 0 || activeCycleIdx > (storeCycles.length ? storeCycles.length - 1 : 5)) {
    activeCycleIdx = currCycleIdx !== -1 ? currCycleIdx : (storeCycles.length ? storeCycles.length - 1 : 5);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function getRag(pct) {
    if (window.SCORING_ENGINE?.getRAG) return window.SCORING_ENGINE.getRAG(pct);
    if (pct >= 85) return { cls: 'rag-green', label: 'On Track', color: 'var(--color-green)' };
    if (pct >= 60) return { cls: 'rag-amber', label: 'At Risk', color: 'var(--color-orange)' };
    return { cls: 'rag-red', label: 'Behind', color: 'var(--color-red)' };
  }

  function getActiveCycle() {
    const cycles = window.DataStore ? window.DataStore.getCycles() : storeCycles;
    return cycles[activeCycleIdx] || cycles.find(c => c.isCurrent) || { id: 'cycle-aug-2026', label: 'Aug 2026', isCurrent: true };
  }

  function getMemberPillarScore(mId, cycleId, pillar) {
    if (!window.DataStore) return 80;
    const scores = window.DataStore.getKraScores({ memberId: mId, cycleId });
    const match = scores.find(s => s.pillarId === pillar.id || s.pillarId.toLowerCase() === pillar.name.toLowerCase() || s.pillarId === ('pillar-' + pillar.name.toLowerCase()));
    if (match) return { score: match.score, notes: match.notes || '' };

    const legacyObj = kraObjectives.find(o => o.pillar.toLowerCase() === pillar.name.toLowerCase() || o.id === pillar.id);
    if (legacyObj && legacyObj.memberActuals && legacyObj.memberActuals[mId] !== undefined) {
      return { score: Number(legacyObj.memberActuals[mId]), notes: '' };
    }
    return { score: 80, notes: '' };
  }

  function getPillarsData() {
    const pillars = window.DataStore ? window.DataStore.getKraPillars() : [];
    const activeCycle = getActiveCycle();

    if (window.SCORING_ENGINE) {
      const kra = window.SCORING_ENGINE.getKRAScore(activeMemberId, activeCycle);
      return pillars.map(p => {
        const key = p.name.toLowerCase();
        const pillarScore = kra.pillars[key] || kra.pillars[p.id?.replace('pillar-', '')] || { score: 85, attainment: 85, rag: getRag(85) };
        return {
          ...p,
          score: pillarScore.score,
          attainment: pillarScore.attainment || pillarScore.score,
          rag: pillarScore.rag || getRag(pillarScore.score),
          notes: activeMemberId === 'all' ? 'Team aggregate across all members' : (getMemberPillarScore(activeMemberId, activeCycle.id, p).notes || '')
        };
      });
    }

    return pillars.map(p => {
      if (activeMemberId !== 'all') {
        const { score, notes } = getMemberPillarScore(activeMemberId, activeCycle.id, p);
        const attainment = score;
        const rag = getRag(attainment);
        return { ...p, score, attainment, rag, notes };
      } else {
        const allScores = members.map(m => getMemberPillarScore(m.id, activeCycle.id, p).score);
        const avg = allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 85;
        const rag = getRag(avg);
        return { ...p, score: avg, attainment: avg, rag, notes: 'Team aggregate across all members' };
      }
    });
  }

  function renderControls() {
    const group = document.getElementById('kraControlsGroup');
    if (!group) return;
    const cycles = window.DataStore ? window.DataStore.getCycles() : storeCycles;

    const managePillarsBtn = isAdm ? `
      <button type="button" class="btn-manage-pillars" id="btnManagePillars" title="Manage KRA Strategic Pillars">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Manage Pillars
      </button>
    ` : '';

    group.innerHTML = `
      ${isAdm ? '<div id="kraMemberComboWrapper" class="kra-combo-container"></div>' : ''}
      <select class="kra-select" id="kraCycleSelect" aria-label="Select Review Cycle">
        ${cycles.map((c, idx) => `<option value="${idx}" ${idx === activeCycleIdx ? 'selected' : ''}>Cycle: ${escapeHtml(c.label)}${c.isCurrent ? ' (Current)' : ''}</option>`).join('')}
      </select>
      ${managePillarsBtn}
    `;

    if (isAdm) {
      const comboWrap = document.getElementById('kraMemberComboWrapper');
      if (comboWrap && window.initKraCombobox) {
        window.initKraCombobox(comboWrap, {
          members,
          activeId: activeMemberId,
          onSelect: (id) => {
            activeMemberId = id;
            renderAll();
          }
        });
      }
      const btnManage = document.getElementById('btnManagePillars');
      if (btnManage) btnManage.onclick = () => openManagePillarsModal();
    }

    const cSel = document.getElementById('kraCycleSelect');
    if (cSel) {
      cSel.onchange = (e) => {
        activeCycleIdx = parseInt(e.target.value, 10);
        localStorage.setItem('useme_review_cycle', activeCycleIdx);
        renderAll();
      };
    }
  }

  function renderSummary(pillars) {
    const totalAttain = Math.round(pillars.reduce((acc, p) => acc + (p.score * (Number(p.weight || 0) / 100)), 0) * 10) / 10;
    const totalRag = getRag(totalAttain);
    const sorted = [...pillars].sort((a, b) => b.attainment - a.attainment);
    const topPillar = sorted[0] || { name: 'Growth', attainment: 90, rag: getRag(90), targetDescription: '' };
    const focusPillar = sorted[sorted.length - 1] || { name: 'Quality', attainment: 85, rag: getRag(85), targetDescription: '' };
    const circ = 2 * Math.PI * 34, offset = circ * (1 - Math.min(totalAttain, 100) / 100);

    const summaryGrid = document.getElementById('kraSummaryGrid');
    if (!summaryGrid) return;

    summaryGrid.innerHTML = `
      <div class="stat-card" style="border-top: 3px solid ${totalRag.color};">
        <div class="stat-header"><span>Overall KRA Attainment</span><span class="rag-badge ${totalRag.cls}">${totalRag.label}</span></div>
        <div style="display:flex; align-items:center; gap:var(--space-3); margin-top:var(--space-2);">
          <svg width="68" height="68" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border)" stroke-width="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="${totalRag.color}" stroke-width="8" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 40 40)" />
            <text x="40" y="45" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-text)">${Math.round(totalAttain)}%</text>
          </svg>
          <div>
            <div style="font-size:var(--text-2xl); font-weight:700; color:${totalRag.color};">${totalAttain}%</div>
            <div style="font-size:11px; color:var(--color-text-muted);">Live weighted across ${pillars.length} pillars</div>
          </div>
        </div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-header"><span>Leading Pillar</span><span class="rag-badge ${topPillar.rag.cls}">${topPillar.rag.label}</span></div>
        <div style="font-size:var(--text-xl); font-weight:700; color:var(--color-green); margin-top:var(--space-1);">${escapeHtml(topPillar.name)}</div>
        <div style="font-size:var(--text-xs); color:var(--color-text-muted);">${topPillar.attainment}% attainment (${escapeHtml(topPillar.targetDescription)})</div>
      </div>
      <div class="stat-card accent-orange">
        <div class="stat-header"><span>Focus Opportunity</span><span class="rag-badge ${focusPillar.rag.cls}">${focusPillar.rag.label}</span></div>
        <div style="font-size:var(--text-xl); font-weight:700; color:var(--color-orange-dark); margin-top:var(--space-1);">${escapeHtml(focusPillar.name)}</div>
        <div style="font-size:var(--text-xs); color:var(--color-text-muted);">${focusPillar.attainment}% attainment (${escapeHtml(focusPillar.targetDescription)})</div>
      </div>`;
  }

  function renderLineChart() {
    const container = document.getElementById('trajectoryChartContainer');
    if (!container) return;
    const cycles = window.DataStore ? window.DataStore.getCycles() : storeCycles;
    const months = cycles.map(c => c.label.replace(' 2026', ''));

    // Live calculation of historical attainment across cycles
    const values = cycles.map((c, idx) => {
      if (activeMemberId !== 'all') {
        const score = window.DataStore?.getMemberOverallKraAttainment(activeMemberId, c.id);
        if (score && !isNaN(score)) return score;
        return kraHistory.members[activeMemberId]?.[idx] ?? kraHistory.org[idx] ?? 85;
      } else {
        const memberScores = members.map(m => window.DataStore?.getMemberOverallKraAttainment(m.id, c.id));
        const valid = memberScores.filter(s => s && !isNaN(s));
        if (valid.length) return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
        return kraHistory.org[idx] ?? 85;
      }
    });

    const activeVal = values[activeCycleIdx] || values[values.length - 1];
    const lineColor = getRag(activeVal).color;
    const legendLabel = document.getElementById('trajectoryLegendLabel');
    if (legendLabel) {
      const activeCycle = getActiveCycle();
      legendLabel.textContent = activeMemberId === 'all' ? `Team Average (${activeCycle.label})` : `${members.find(m => m.id === activeMemberId)?.name || 'Member'} Trend`;
    }
    const legendDot = document.getElementById('trajectoryLegendDot');
    if (legendDot) legendDot.style.backgroundColor = lineColor;

    const points = values.map((val, i) => ({
      x: 55 + i * (490 / Math.max(1, months.length - 1)),
      y: Math.max(25, Math.min(160, 160 - ((val - 50) / 50) * 130)),
      val,
      isSel: i === activeCycleIdx,
      label: months[i]
    }));

    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const areaD = `M 55 160 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 545 160 Z`;
    const gridYs = [60, 80, 100].map(v => ({ v, y: 160 - ((v - 50) / 50) * 130 }));

    container.innerHTML = `
      <svg width="100%" height="210" viewBox="0 0 600 200" preserveAspectRatio="none" style="overflow:visible;">
        ${gridYs.map(g => `<line x1="45" y1="${g.y}" x2="555" y2="${g.y}" stroke="var(--color-border)" stroke-dasharray="3,3" stroke-width="1" /><text x="38" y="${g.y + 4}" text-anchor="end" font-size="10" font-weight="500" fill="var(--color-text-muted)">${g.v}%</text>`).join('')}
        <path d="${areaD}" fill="${lineColor}" opacity="0.10" />
        <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.isSel ? '5.5' : '4'}" fill="${p.isSel ? lineColor : 'var(--color-white)'}" stroke="${lineColor}" stroke-width="2.5" /><text x="${p.x}" y="${p.y - 9}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${lineColor}" letter-spacing="0.2px">${Math.round(p.val)}%</text><text x="${p.x}" y="185" text-anchor="middle" font-size="11" font-weight="600" fill="var(--color-text-muted)" letter-spacing="0.3px">${p.label}</text>`).join('')}
      </svg>`;
  }

  function renderPillarTable(pillars) {
    const thead = document.getElementById('kraTableHead');
    const tbody = document.getElementById('kraPillarTableBody');
    if (!thead || !tbody) return;

    const activeCycle = getActiveCycle();
    const isCurrentCycle = !!activeCycle.isCurrent;

    if (activeMemberId !== 'all') {
      thead.innerHTML = `<tr><th>Strategic Pillar</th><th>Weight</th><th>Score &amp; Attainment</th><th>Audit Notes</th>${isAdm ? '<th>Action</th>' : ''}</tr>`;
      tbody.innerHTML = pillars.map(p => {
        const actionBtn = isAdm ? `
          <td>
            <button type="button" class="btn-score-entry ${!isCurrentCycle ? 'is-historical' : ''}" data-pillar-id="${p.id}" data-historical="${!isCurrentCycle}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              ${isCurrentCycle ? 'Update Score' : 'Edit Historical'}
            </button>
          </td>
        ` : '';

        return `<tr>
          <td>
            <span class="pillar-badge"><span class="rag-dot ${p.rag.cls}"></span>${escapeHtml(p.name)}</span>
            <span class="pillar-title">${escapeHtml(p.targetDescription)}</span>
          </td>
          <td><strong>${p.weight}%</strong></td>
          <td>
            <div class="progress-container" style="margin:0; min-width:160px;">
              <div class="progress-info">
                <span class="rag-badge ${p.rag.cls}">${p.rag.label}</span>
                <span style="color:${p.rag.color}; font-weight:700;">${p.score}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:${Math.min(p.score, 100)}%; background-color:${p.rag.color};"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="score-notes-preview" title="${escapeHtml(p.notes)}">${p.notes ? escapeHtml(p.notes) : '<span style="opacity:0.5;">No notes recorded</span>'}</span>
          </td>
          ${actionBtn}
        </tr>`;
      }).join('');

      // Wire Score Entry Buttons
      tbody.querySelectorAll('.btn-score-entry').forEach(btn => {
        btn.onclick = () => {
          const pillarId = btn.dataset.pillarId;
          const isHist = btn.dataset.historical === 'true';
          if (isHist) {
            openHistoricalConfirmModal(activeCycle.label, () => {
              openScoreModal(activeMemberId, activeCycle.id, pillarId);
            });
          } else {
            openScoreModal(activeMemberId, activeCycle.id, pillarId);
          }
        };
      });
    } else {
      // Organization / Team Wide view
      thead.innerHTML = `<tr><th>Strategic Pillar</th><th>Weight</th><th>Team Average Attainment</th><th>Status</th></tr>`;
      tbody.innerHTML = pillars.map(p => `<tr>
        <td>
          <span class="pillar-badge"><span class="rag-dot ${p.rag.cls}"></span>${escapeHtml(p.name)}</span>
          <span class="pillar-title">${escapeHtml(p.targetDescription)}</span>
        </td>
        <td><strong>${p.weight}%</strong></td>
        <td>
          <div class="progress-container" style="margin:0; min-width:160px;">
            <div class="progress-info">
              <span class="rag-badge ${p.rag.cls}">${p.rag.label}</span>
              <span style="color:${p.rag.color}; font-weight:700;">${p.attainment}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width:${Math.min(p.attainment, 100)}%; background-color:${p.rag.color};"></div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size:var(--text-xs); color:var(--color-text-muted);">Organization Baseline (${escapeHtml(activeCycle.label)})</span>
        </td>
      </tr>`).join('');
    }
  }

  function renderAll() {
    const pillars = getPillarsData();
    renderSummary(pillars);
    renderLineChart();
    renderPillarTable(pillars);
  }

  // Modals Implementation
  function ensureKraModals() {
    let container = document.getElementById('kraModalsContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kraModalsContainer';
      container.innerHTML = `
        <!-- Manage Pillars Modal -->
        <div class="modal-overlay" id="managePillarsModal">
          <div class="modal-card modal-wide" style="max-width: 640px;">
            <button type="button" class="modal-close-btn" id="mpModalClose" aria-label="Close modal">&times;</button>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-3); padding-right:32px;">
              <div>
                <h2 class="modal-title">KRA Strategic Pillars Management</h2>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                  <span id="mpWeightBadge" class="weight-sum-badge weight-sum-ok">Total Weight: 100%</span>
                  <span style="font-size:11px; color:var(--color-text-muted);">Must always sum to 100%</span>
                </div>
              </div>
              <button type="button" id="mpAddPillarBtn" class="btn" style="padding:6px 12px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">+ Add Pillar</button>
            </div>
            <div id="mpAlert" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#FEE2E2; color:var(--color-red); border:1px solid #FECACA;"></div>
            <div id="mpSuccess" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#DEF7EC; color:#03543F; border:1px solid #BCF0DA;"></div>
            <div id="mpPillarsList" style="display:flex; flex-direction:column; gap:8px; max-height:360px; overflow-y:auto; padding-right:4px;"></div>
          </div>
        </div>

        <!-- Add/Edit Pillar Modal Form -->
        <div class="modal-overlay" id="pillarFormModal">
          <div class="modal-card" style="max-width: 440px;">
            <button type="button" class="modal-close-btn" id="pfModalClose" aria-label="Close modal">&times;</button>
            <h2 class="modal-title" id="pfModalTitle" style="margin-bottom:var(--space-4);">Add Strategic Pillar</h2>
            <div id="pfAlert" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#FEE2E2; color:var(--color-red); border:1px solid #FECACA;"></div>
            <form id="pillarForm">
              <input type="hidden" id="pfPillarId" value="">
              <div class="form-group" style="margin-bottom:var(--space-3);">
                <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Pillar Name *</label>
                <input type="text" id="pfName" class="form-input" required placeholder="e.g. Innovation &amp; Research" style="width:100%; height:36px; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);">
              </div>
              <div class="form-group" style="margin-bottom:var(--space-3);">
                <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Weight Percentage (%) *</label>
                <input type="number" id="pfWeight" class="form-input" required min="1" max="100" step="1" placeholder="e.g. 20" style="width:100%; height:36px; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);">
                <div id="pfWeightHint" style="font-size:11px; color:var(--color-text-muted); margin-top:2px;"></div>
              </div>
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Target Description *</label>
                <textarea id="pfDesc" class="form-input" required rows="2" placeholder="Describe strategic objective &amp; governance standards..." style="width:100%; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:var(--space-2);">
                <button type="button" class="btn" id="pfCancelBtn" style="padding:8px 14px; border:1px solid var(--color-border); background:var(--color-white); border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Cancel</button>
                <button type="submit" class="btn" style="padding:8px 16px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Save Pillar</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Enter Score Modal -->
        <div class="modal-overlay" id="enterScoreModal">
          <div class="modal-card" style="max-width: 440px;">
            <button type="button" class="modal-close-btn" id="esModalClose" aria-label="Close modal">&times;</button>
            <h2 class="modal-title" style="margin-bottom:var(--space-2);">Enter Member Pillar Score</h2>
            <div id="esSubtitle" style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:var(--space-4);"></div>
            <div id="esAlert" style="display:none; margin-bottom:var(--space-3); padding:8px 12px; border-radius:var(--radius-sm); font-size:var(--text-xs); background-color:#FEE2E2; color:var(--color-red); border:1px solid #FECACA;"></div>
            <form id="enterScoreForm">
              <input type="hidden" id="esMemberId" value="">
              <input type="hidden" id="esCycleId" value="">
              <input type="hidden" id="esPillarId" value="">
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <label class="form-label" style="font-size:var(--text-xs); font-weight:600;">Attainment Score (0 - 100%) *</label>
                  <span id="esScoreDisplay" style="font-size:var(--text-base); font-weight:700; color:var(--color-orange);">85%</span>
                </div>
                <input type="range" id="esScoreSlider" min="0" max="100" step="0.5" value="85" style="width:100%; accent-color:var(--color-orange); cursor:pointer;">
                <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                  <input type="number" id="esScoreNum" min="0" max="100" step="0.1" value="85" style="width:80px; height:32px; padding:4px 8px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm); font-weight:700;">
                  <span style="font-size:var(--text-xs); color:var(--color-text-muted);">% percentage attainment</span>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label" style="display:block; font-size:var(--text-xs); font-weight:600; margin-bottom:4px;">Evaluation &amp; Audit Notes (Optional)</label>
                <textarea id="esNotes" class="form-input" rows="3" placeholder="Specify rationale, deliverable quality, or audit context..." style="width:100%; padding:6px 10px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm);"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:var(--space-2);">
                <button type="button" class="btn" id="esCancelBtn" style="padding:8px 14px; border:1px solid var(--color-border); background:var(--color-white); border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Cancel</button>
                <button type="submit" class="btn" style="padding:8px 16px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Save Score</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Historical Warning Confirmation Modal -->
        <div class="modal-overlay" id="historicalConfirmModal">
          <div class="modal-card" style="max-width: 420px; border-top: 4px solid var(--color-orange);">
            <button type="button" class="modal-close-btn" id="hcModalClose" aria-label="Close modal">&times;</button>
            <h2 class="modal-title" style="margin-bottom:var(--space-2); color:#92400E;">Historical Record Warning</h2>
            <p id="hcMessage" style="font-size:var(--text-xs); color:var(--color-text); line-height:1.5; margin-bottom:var(--space-4);">
              You are editing historical KRA score data for a closed review cycle. Modifying past cycle scores rewrites recorded audit history.
            </p>
            <div style="display:flex; justify-content:flex-end; gap:var(--space-2);">
              <button type="button" class="btn" id="hcCancelBtn" style="padding:8px 14px; border:1px solid var(--color-border); background:var(--color-white); border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Cancel</button>
              <button type="button" class="btn" id="hcConfirmBtn" style="padding:8px 16px; background:var(--color-orange); color:var(--color-white); border:none; border-radius:var(--radius-md); font-size:var(--text-xs); font-weight:600; cursor:pointer;">Unlock &amp; Proceed</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // Wire close handlers
      document.getElementById('mpModalClose').onclick = () => document.getElementById('managePillarsModal').classList.remove('active');
      document.getElementById('pfModalClose').onclick = () => document.getElementById('pillarFormModal').classList.remove('active');
      document.getElementById('pfCancelBtn').onclick = () => document.getElementById('pillarFormModal').classList.remove('active');
      document.getElementById('esModalClose').onclick = () => document.getElementById('enterScoreModal').classList.remove('active');
      document.getElementById('esCancelBtn').onclick = () => document.getElementById('enterScoreModal').classList.remove('active');
      document.getElementById('hcModalClose').onclick = () => document.getElementById('historicalConfirmModal').classList.remove('active');
      document.getElementById('hcCancelBtn').onclick = () => document.getElementById('historicalConfirmModal').classList.remove('active');

      document.getElementById('mpAddPillarBtn').onclick = () => openPillarFormModal(null);

      // Score Slider & Input Sync
      const slider = document.getElementById('esScoreSlider');
      const numInp = document.getElementById('esScoreNum');
      const disp = document.getElementById('esScoreDisplay');
      slider.oninput = (e) => {
        numInp.value = e.target.value;
        disp.textContent = `${e.target.value}%`;
      };
      numInp.oninput = (e) => {
        slider.value = e.target.value;
        disp.textContent = `${e.target.value}%`;
      };

      // Enter Score Form Submit
      document.getElementById('enterScoreForm').onsubmit = (e) => {
        e.preventDefault();
        const mId = document.getElementById('esMemberId').value;
        const cId = document.getElementById('esCycleId').value;
        const pId = document.getElementById('esPillarId').value;
        const score = parseFloat(document.getElementById('esScoreNum').value);
        const notes = document.getElementById('esNotes').value.trim();
        const u = window.currentUser || window.DataStore?.getCurrentUser();

        try {
          if (window.DataStore?.setKraScore) {
            window.DataStore.setKraScore(mId, cId, pId, score, notes, u);
          }
          document.getElementById('enterScoreModal').classList.remove('active');
          renderAll();
        } catch (err) {
          const alertEl = document.getElementById('esAlert');
          alertEl.textContent = err.message || 'Failed to save score';
          alertEl.style.display = 'block';
        }
      };

      // Pillar Form Submit
      document.getElementById('pillarForm').onsubmit = (e) => {
        e.preventDefault();
        const alertEl = document.getElementById('pfAlert');
        alertEl.style.display = 'none';
        const pId = document.getElementById('pfPillarId').value;
        const name = document.getElementById('pfName').value.trim();
        const weight = parseFloat(document.getElementById('pfWeight').value);
        const targetDescription = document.getElementById('pfDesc').value.trim();
        const u = window.currentUser || window.DataStore?.getCurrentUser();

        try {
          if (pId) {
            window.DataStore.updateKraPillar(pId, { name, weight, targetDescription }, u);
          } else {
            window.DataStore.createKraPillar({ name, weight, targetDescription }, u);
          }
          document.getElementById('pillarFormModal').classList.remove('active');
          renderPillarsList();
          renderControls();
          renderAll();
        } catch (err) {
          alertEl.textContent = err.message || 'Failed to save pillar';
          alertEl.style.display = 'block';
        }
      };
    }
  }

  function openManagePillarsModal() {
    ensureKraModals();
    renderPillarsList();
    document.getElementById('managePillarsModal').classList.add('active');
  }

  function renderPillarsList() {
    const listEl = document.getElementById('mpPillarsList');
    if (!listEl) return;
    const pillars = window.DataStore ? window.DataStore.getKraPillars() : [];
    const totalWeight = Math.round(pillars.reduce((s, p) => s + Number(p.weight || 0), 0) * 10) / 10;
    const badge = document.getElementById('mpWeightBadge');
    if (badge) {
      badge.textContent = `Total Weight: ${totalWeight}%`;
      badge.className = `weight-sum-badge ${totalWeight === 100 ? 'weight-sum-ok' : 'weight-sum-bad'}`;
    }

    const alertEl = document.getElementById('mpAlert');
    const successEl = document.getElementById('mpSuccess');
    if (alertEl) alertEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';

    listEl.innerHTML = pillars.map((p, idx) => `
      <div class="pillar-manage-row" id="pRow-${p.id}">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="pillar-reorder-btns">
            <button type="button" class="btn-reorder btn-move-up" data-id="${p.id}" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" class="btn-reorder btn-move-down" data-id="${p.id}" ${idx === pillars.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:700; font-size:var(--text-sm);">${escapeHtml(p.name)}</span>
              <span class="rag-badge rag-green" style="font-size:10px; padding:2px 6px;">${p.weight}%</span>
            </div>
            <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${escapeHtml(p.targetDescription)}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="btn-action-edit mp-edit-btn" data-id="${p.id}">Edit</button>
          <button type="button" class="btn-action-delete mp-del-btn" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Reorder & Action Handlers
    listEl.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const idx = pillars.findIndex(x => x.id === id);
        if (idx > 0) {
          const newOrder = [...pillars];
          const temp = newOrder[idx];
          newOrder[idx] = newOrder[idx - 1];
          newOrder[idx - 1] = temp;
          window.DataStore.reorderKraPillars(newOrder.map(x => x.id), window.currentUser);
          renderPillarsList();
          renderAll();
        }
      };
    });

    listEl.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const idx = pillars.findIndex(x => x.id === id);
        if (idx < pillars.length - 1) {
          const newOrder = [...pillars];
          const temp = newOrder[idx];
          newOrder[idx] = newOrder[idx + 1];
          newOrder[idx + 1] = temp;
          window.DataStore.reorderKraPillars(newOrder.map(x => x.id), window.currentUser);
          renderPillarsList();
          renderAll();
        }
      };
    });

    listEl.querySelectorAll('.mp-edit-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const p = window.DataStore.getKraPillarById(id);
        if (p) openPillarFormModal(p);
      };
    });

    listEl.querySelectorAll('.mp-del-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (alertEl) alertEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';
        try {
          window.DataStore.deleteKraPillar(id, window.currentUser);
          if (successEl) {
            successEl.textContent = 'Pillar deleted successfully.';
            successEl.style.display = 'block';
          }
          renderPillarsList();
          renderAll();
        } catch (err) {
          if (alertEl) {
            alertEl.textContent = err.message || 'Cannot delete pillar';
            alertEl.style.display = 'block';
          }
        }
      };
    });
  }

  function openPillarFormModal(pillar) {
    ensureKraModals();
    const modal = document.getElementById('pillarFormModal');
    const alertEl = document.getElementById('pfAlert');
    alertEl.style.display = 'none';

    document.getElementById('pfPillarId').value = pillar ? pillar.id : '';
    document.getElementById('pfName').value = pillar ? pillar.name : '';
    document.getElementById('pfWeight').value = pillar ? pillar.weight : '';
    document.getElementById('pfDesc').value = pillar ? pillar.targetDescription : '';
    document.getElementById('pfModalTitle').textContent = pillar ? 'Edit Strategic Pillar' : 'Add Strategic Pillar';

    const pillars = window.DataStore ? window.DataStore.getKraPillars() : [];
    const otherSum = pillars.reduce((s, p) => s + (pillar && p.id === pillar.id ? 0 : Number(p.weight || 0)), 0);
    const needed = Math.max(0, 100 - otherSum);
    document.getElementById('pfWeightHint').textContent = `Target remaining weight needed to equal 100%: ${needed}%`;

    modal.classList.add('active');
  }

  function openScoreModal(mId, cycleId, pillarId) {
    ensureKraModals();
    const modal = document.getElementById('enterScoreModal');
    const alertEl = document.getElementById('esAlert');
    alertEl.style.display = 'none';

    const mem = members.find(m => m.id === mId) || { name: 'Member', role: 'Specialist' };
    const p = window.DataStore.getKraPillarById(pillarId) || { name: 'Pillar', weight: 20 };
    const activeCycle = getActiveCycle();

    document.getElementById('esMemberId').value = mId;
    document.getElementById('esCycleId').value = cycleId;
    document.getElementById('esPillarId').value = pillarId;

    document.getElementById('esSubtitle').innerHTML = `
      <strong>${escapeHtml(mem.name)}</strong> &bull; Cycle: <strong>${escapeHtml(activeCycle.label)}</strong> &bull; Pillar: <strong>${escapeHtml(p.name)} (${p.weight}%)</strong>
    `;

    const { score, notes } = getMemberPillarScore(mId, cycleId, p);
    document.getElementById('esScoreSlider').value = score;
    document.getElementById('esScoreNum').value = score;
    document.getElementById('esScoreDisplay').textContent = `${score}%`;
    document.getElementById('esNotes').value = notes || '';

    modal.classList.add('active');
  }

  function openHistoricalConfirmModal(cycleLabel, onConfirm) {
    ensureKraModals();
    const modal = document.getElementById('historicalConfirmModal');
    document.getElementById('hcMessage').innerHTML = `
      You are about to edit historical KRA score data for closed cycle <strong>"${escapeHtml(cycleLabel)}"</strong>.
      Modifying closed review cycles will alter recorded performance audit history.
      <br><br>
      Are you sure you want to proceed?
    `;
    document.getElementById('hcConfirmBtn').onclick = () => {
      modal.classList.remove('active');
      if (typeof onConfirm === 'function') onConfirm();
    };
    modal.classList.add('active');
  }

  renderControls();
  renderAll();
});
