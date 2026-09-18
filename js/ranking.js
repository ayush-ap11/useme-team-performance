/**
 * Useme Team - Ranking & Leaderboard Logic
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
    return [
      { id: 'all', name: 'All Overall' },
      { id: 'engagement', name: 'Engagement Score' },
      { id: 'motivation', name: 'Motivation Score' },
      ...dynamicCats
    ];
  }
  function renderFilters() {
    if (!filterContainer) return;
    filterContainer.innerHTML = '';
    const categories = getFilterCategories();
    categories.forEach(c => {
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
      const eng = typeof m.engagementScore === 'number' ? m.engagementScore : (window.KPI_ENGINE?.calculateEngagementScore ? window.KPI_ENGINE.calculateEngagementScore(m.id) : 80);
      const mot = typeof m.motivationScore === 'number' ? m.motivationScore : (window.KPI_ENGINE?.calculateMotivationScore ? window.KPI_ENGINE.calculateMotivationScore(m.id) : 85);
      const comp = typeof m.compositeScore === 'number' ? m.compositeScore : 80;
      return { ...m, compositeScore: comp, engagementScore: eng, motivationScore: mot };
    });

    let sorted = [...rawMembers];
    let scoreKey = 'compositeScore', labelSuffix = 'pts';
    if (activeCategory === 'engagement') {
      scoreKey = 'engagementScore';
      labelSuffix = 'eng pts';
      sorted.sort((a, b) => b.engagementScore - a.engagementScore);
    } else if (activeCategory === 'motivation') {
      scoreKey = 'motivationScore';
      labelSuffix = 'mot pts';
      sorted.sort((a, b) => b.motivationScore - a.motivationScore);
    } else {
      if (activeCategory !== 'all') {
        sorted = sorted.filter(m => m.skillCategory === activeCategory);
      }
      sorted.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    if (summaryBox) {
      if (role === 'member') {
        const myIndex = sorted.findIndex(m => m.id === currentUserId);
        if (myIndex !== -1) {
          const myData = sorted[myIndex];
          const diffText = myIndex > 0 ? `${Math.round((sorted[myIndex - 1][scoreKey] - myData[scoreKey]) * 10) / 10} pts behind #${myIndex}` : 'Rank #1 Leader';
          summaryBox.style.display = 'flex';
          summaryBox.innerHTML = `
            <div>
              <div style="font-size:var(--text-xs); color:var(--color-text-muted); text-transform:uppercase; font-weight:600;">Your Standing</div>
              <div class="my-rank-stat"><span class="my-rank-num">#${myIndex + 1}</span> <span class="my-rank-score">${myData.name} (${myData[scoreKey]} ${labelSuffix})</span></div>
            </div>
            <div style="text-align:right;"><span class="modal-skill-chip" style="color:var(--color-orange-dark); font-weight:600;">${diffText}</span></div>
          `;
        } else {
          summaryBox.style.display = 'none';
        }
      } else {
        summaryBox.style.display = 'none';
      }
    }

    if (podiumContainer) {
      const [top1, top2, top3] = [sorted[0], sorted[1], sorted[2]];
      const renderPodiumCard = (m, rankNum, cls) => m ? `
        <div class="podium-card ${cls}" onclick="window.openMemberModal('${m.id}')" style="cursor:pointer;">
          <span class="podium-badge">Rank #${rankNum}</span>
          <div class="podium-avatar">${m.avatar}</div>
          <div class="podium-name">${m.name}</div>
          <div style="font-size:11px; color:var(--color-text-muted);">${m.role}</div>
          <div class="podium-score">${m[scoreKey]} <span style="font-size:11px; font-weight:normal; color:var(--color-text-muted);">${labelSuffix}</span></div>
        </div>` : `<div class="podium-card ${cls}"><div class="podium-badge">Rank #${rankNum}</div><p style="color:var(--color-text-muted); font-size:11px; padding:16px 0;">--</p></div>`;
      podiumContainer.innerHTML = `${renderPodiumCard(top2, 2, 'second')}${renderPodiumCard(top1, 1, 'first')}${renderPodiumCard(top3, 3, 'third')}`;
    }

    if (tableBody) {
      tableBody.innerHTML = '';
      const kraHistory = window.DataStore ? window.DataStore.getKraHistory() : null;
      const fragment = document.createDocumentFragment();

      sorted.forEach((m, idx) => {
        const isMe = role === 'member' && m.id === currentUserId;
        const hist = kraHistory?.members?.[m.id];
        let trendCls = 'trend-same', trendLabel = '0.0';
        if (Array.isArray(hist) && hist.length >= 2) {
          const prior = hist[hist.length - 2];
          const curr = typeof m.compositeScore === 'number' ? m.compositeScore : hist[hist.length - 1];
          const diff = Math.round((curr - prior) * 10) / 10;
          if (diff > 0) {
            trendCls = 'trend-up';
            trendLabel = `+${diff}`;
          } else if (diff < 0) {
            trendCls = 'trend-down';
            trendLabel = `${diff}`;
          } else {
            trendCls = 'trend-same';
            trendLabel = '0.0';
          }
        } else {
          trendCls = 'trend-same';
          trendLabel = '—';
        }

        const tr = document.createElement('tr');
        tr.className = `task-row rank-row ${isMe ? 'my-row' : ''}`;
        tr.innerHTML = `
          <td style="font-weight:700; color:var(--color-text); width:60px;">#${idx + 1}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="avatar-mini" style="width:28px;height:28px;border-radius:50%;background:var(--color-orange);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">${m.avatar}</span>
              <div>
                <strong>${m.name} ${isMe ? '<span style="font-size:10px; background:var(--color-orange); color:#fff; padding:1px 4px; border-radius:4px; margin-left:4px;">YOU</span>' : ''}</strong>
                <div style="font-size:11px; color:var(--color-text-muted);">${m.role}</div>
              </div>
            </div>
          </td>
          <td><span class="modal-skill-chip">${(m.skillCategory || 'General').toUpperCase()}</span></td>
          <td style="color:var(--color-text-muted); font-size:var(--text-xs);">${m.kpiScore ?? 80} / <span style="color:var(--color-red);">${m.kriPenalty ?? 0}</span></td>
          <td style="font-weight:700; font-size:var(--text-sm);">${m[scoreKey]} ${labelSuffix}</td>
          <td><span class="${trendCls}">${trendLabel}</span></td>
        `;
        tr.onclick = () => window.openMemberModal && window.openMemberModal(m.id);
        fragment.appendChild(tr);
      });
      tableBody.appendChild(fragment);
    }
  }
  renderRanking();
});
