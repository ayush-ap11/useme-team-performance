/**
 * Useme Team - Ranking & Leaderboard Logic (Powered by Unified Scoring Engine)
 */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('useme_role') || 'member';
  const currentUserId = localStorage.getItem('useme_user_id') || 'm5';
  const summaryBox = document.getElementById('myRankSummary');
  const podiumContainer = document.getElementById('podiumContainer');
  const tableBody = document.getElementById('rankTableBody');
  const filterContainer = document.getElementById('rankFilterChips');

  let activeCategory = 'all';
  function getFilterCategories() {
    const dynamicCats = window.DataStore ? window.DataStore.getSkillCategories() : [];
    return [{ id: 'all', name: 'All Overall' }, { id: 'engagement', name: 'Engagement Score' }, { id: 'motivation', name: 'Motivation Score' }, ...dynamicCats];
  }

  function renderFilters() {
    if (!filterContainer) return;
    filterContainer.innerHTML = '';
    getFilterCategories().forEach(c => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `rank-chip ${c.id === activeCategory ? 'active' : ''}`;
      chip.textContent = c.name;
      chip.onclick = () => { activeCategory = c.id; renderRanking(); };
      filterContainer.appendChild(chip);
    });
  }

  function renderRanking() {
    renderFilters();
    const rawMembers = (window.DataStore ? window.DataStore.getMembers() : []).map(m => {
      const eng = window.SCORING_ENGINE ? window.SCORING_ENGINE.getEngagementScore(m.id) : (m.engagementScore ?? 80);
      const mot = window.SCORING_ENGINE ? window.SCORING_ENGINE.getMotivationScore(m.id) : (m.motivationScore ?? 85);
      const comp = window.SCORING_ENGINE ? window.SCORING_ENGINE.getOverallScore(m.id) : (m.compositeScore ?? 80);
      const kra = window.SCORING_ENGINE ? window.SCORING_ENGINE.getKRAScore(m.id).overall : (m.kpiScore ?? 80);
      const pen = window.SCORING_ENGINE ? window.SCORING_ENGINE.getKRIPenalty(m.id) : (m.kriPenalty ?? 0);
      return { ...m, compositeScore: comp, engagementScore: eng, motivationScore: mot, kpiScore: kra, kriPenalty: pen };
    });

    let sorted = [...rawMembers];
    let scoreKey = 'compositeScore', labelSuffix = 'pts';
    if (activeCategory === 'engagement') {
      scoreKey = 'engagementScore'; labelSuffix = 'eng pts';
      sorted.sort((a, b) => b.engagementScore - a.engagementScore);
    } else if (activeCategory === 'motivation') {
      scoreKey = 'motivationScore'; labelSuffix = 'mot pts';
      sorted.sort((a, b) => b.motivationScore - a.motivationScore);
    } else {
      if (activeCategory !== 'all') sorted = sorted.filter(m => m.skillCategory === activeCategory);
      sorted.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    if (summaryBox) {
      if (role === 'member') {
        const myIdx = sorted.findIndex(m => m.id === currentUserId);
        if (myIdx !== -1) {
          const myData = sorted[myIdx];
          const diff = myIdx > 0 ? `${Math.round((sorted[myIdx - 1][scoreKey] - myData[scoreKey]) * 10) / 10} pts behind #${myIdx}` : 'Rank #1 Leader';
          summaryBox.style.display = 'flex';
          summaryBox.innerHTML = `<div><div style="font-size:var(--text-xs); color:var(--color-text-muted); text-transform:uppercase; font-weight:600;">Your Standing</div><div class="my-rank-stat"><span class="my-rank-num">#${myIdx + 1}</span> <span class="my-rank-score">${myData.name} (${myData[scoreKey]} ${labelSuffix})</span></div></div><div style="text-align:right;"><span class="modal-skill-chip" style="color:var(--color-orange-dark); font-weight:600;">${diff}</span></div>`;
        } else summaryBox.style.display = 'none';
      } else summaryBox.style.display = 'none';
    }

    if (podiumContainer) {
      const [top1, top2, top3] = [sorted[0], sorted[1], sorted[2]];
      const renderCard = (m, num, cls) => m ? `<div class="podium-card ${cls}" onclick="window.openMemberModal('${m.id}')" style="cursor:pointer;"><span class="podium-badge">Rank #${num}</span><div class="podium-avatar">${m.avatar}</div><div class="podium-name">${m.name}</div><div style="font-size:11px; color:var(--color-text-muted);">${m.role}</div><div class="podium-score">${m[scoreKey]} <span style="font-size:11px; font-weight:normal; color:var(--color-text-muted);">${labelSuffix}</span></div></div>` : `<div class="podium-card ${cls}"><div class="podium-badge">Rank #${num}</div><p style="color:var(--color-text-muted); font-size:11px; padding:16px 0;">--</p></div>`;
      podiumContainer.innerHTML = `${renderCard(top2, 2, 'second')}${renderCard(top1, 1, 'first')}${renderCard(top3, 3, 'third')}`;
    }

    if (tableBody) {
      tableBody.innerHTML = '';
      const kraHistory = window.DataStore ? window.DataStore.getKraHistory() : null;
      const frag = document.createDocumentFragment();
      sorted.forEach((m, idx) => {
        const isMe = role === 'member' && m.id === currentUserId;
        const hist = kraHistory?.members?.[m.id];
        let trendCls = 'trend-same', trendLabel = '0.0';
        if (Array.isArray(hist) && hist.length >= 2) {
          const diff = Math.round(((typeof m.compositeScore === 'number' ? m.compositeScore : hist[hist.length - 1]) - hist[hist.length - 2]) * 10) / 10;
          trendCls = diff > 0 ? 'trend-up' : (diff < 0 ? 'trend-down' : 'trend-same');
          trendLabel = diff > 0 ? `+${diff}` : `${diff}`;
        } else { trendCls = 'trend-same'; trendLabel = '—'; }

        const tr = document.createElement('tr');
        tr.className = `task-row rank-row ${isMe ? 'my-row' : ''}`;
        tr.innerHTML = `
          <td style="font-weight:700; color:var(--color-text); width:60px;">#${idx + 1}</td>
          <td><div style="display:flex; align-items:center; gap:8px;"><span class="avatar-mini" style="width:28px;height:28px;border-radius:50%;background:var(--color-orange);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">${m.avatar}</span><div><strong>${m.name} ${isMe ? '<span style="font-size:10px; background:var(--color-orange); color:#fff; padding:1px 4px; border-radius:4px; margin-left:4px;">YOU</span>' : ''}</strong><div style="font-size:11px; color:var(--color-text-muted);">${m.role}</div></div></div></td>
          <td><span class="modal-skill-chip">${(m.skillCategory || 'General').toUpperCase()}</span></td>
          <td style="color:var(--color-text-muted); font-size:var(--text-xs);">${m.kpiScore ?? 80} / <span style="color:var(--color-red);">${m.kriPenalty ?? 0}</span></td>
          <td style="font-weight:700; font-size:var(--text-sm);">${m[scoreKey]} ${labelSuffix}</td>
          <td><span class="${trendCls}">${trendLabel}</span></td>`;
        tr.onclick = () => window.openMemberModal && window.openMemberModal(m.id);
        frag.appendChild(tr);
      });
      tableBody.appendChild(frag);
    }
  }
  renderRanking();
});
