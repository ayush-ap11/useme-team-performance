/**
 * Useme Team - Shared Task Asset Field Component (File Upload & URL)
 */
(function() {
  const iconFile = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  const iconLink = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
  const iconUpload = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';
  window.createTaskAssetField = function(container, options = {}) {
    if (!container) return;
    const { initialAssets = [], onChange, allowAdd = true } = options;
    let dynamicUploader = 'Team Member';
    const cu = window.currentUser || (window.DataStore?.getCurrentUser ? window.DataStore.getCurrentUser() : null);
    if (cu && cu.name) {
      dynamicUploader = `${cu.name} (${cu.role === 'admin' ? 'Admin' : 'Member'})`;
    } else {
      const storedRole = localStorage.getItem('useme_role') || 'member';
      const storedId = localStorage.getItem('useme_user_id');
      const member = storedId && window.DataStore?.getMemberById ? window.DataStore.getMemberById(storedId) : null;
      if (member && member.name) {
        dynamicUploader = `${member.name} (${storedRole === 'admin' ? 'Admin' : 'Member'})`;
      } else {
        dynamicUploader = storedRole === 'admin' ? 'Admin' : 'Member';
      }
    }
    const currentUserName = options.uploaderName || dynamicUploader;
    let assets = (initialAssets || []).map(a => typeof a === 'string' ? {
      name: a, type: 'document', sizeText: 'Doc', uploadedBy: 'Team Member', timestamp: 'Aug 24, 2026', source: 'file', url: '#'
    } : a);
    let activeTab = 'file';
    function render() {
      container.innerHTML = `
        <div class="task-asset-widget">
          ${allowAdd ? `
            <div class="asset-toggle-group">
              <button type="button" class="asset-toggle-pill ${activeTab === 'file' ? 'active' : ''}" id="taTabFile">
                ${iconFile} <span>Upload File</span>
              </button>
              <button type="button" class="asset-toggle-pill ${activeTab === 'url' ? 'active' : ''}" id="taTabUrl">
                ${iconLink} <span>Paste URL</span>
              </button>
            </div>
            <div id="taFilePane" style="display:${activeTab === 'file' ? 'block' : 'none'}; background:var(--color-bg); padding:10px; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:10px;">
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="file" id="taFileInput" class="form-input" style="font-size:12px; padding:6px;" accept=".png,.jpg,.jpeg,.gif,.svg,.pdf,.doc,.docx,.txt,.sql,.fig,.zip">
                <button type="button" class="btn-asset-action" id="taUploadBtn">
                  ${iconUpload} <span>Attach Deliverable</span>
                </button>
              </div>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:6px;">Max file size: <strong>2MB</strong>. Stored locally in session.</div>
            </div>
            <div id="taUrlPane" style="display:${activeTab === 'url' ? 'block' : 'none'}; background:var(--color-bg); padding:10px; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:10px;">
              <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:center;">
                <input type="text" id="taUrlName" class="form-input" placeholder="Asset Name (e.g. Specs)" style="font-size:12px; padding:6px 10px;">
                <input type="url" id="taUrlVal" class="form-input" placeholder="https://..." style="font-size:12px; padding:6px 10px;">
                <button type="button" class="btn-asset-action" id="taAddUrlBtn">
                  ${iconLink} <span>Add Link</span>
                </button>
              </div>
            </div>
            <div id="taError" style="display:none; color:var(--color-red); font-size:11px; background:#FDF2F2; padding:6px 10px; border-radius:var(--radius-sm); border:1px solid rgba(214,69,69,0.2); margin-bottom:8px;"></div>
          ` : ''}
          <ul class="tab-list" id="taList" style="margin-top:8px;">
            ${assets.length > 0 ? assets.map((a, i) => `
              <li class="tab-list-item" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div style="overflow:hidden; text-overflow:ellipsis;">
                  <div style="font-weight:600; color:var(--color-text); font-size:12px;">${a.source === 'url' ? iconLink : iconFile} ${a.name} ${a.sizeText ? `<span style="font-size:10px; color:var(--color-text-muted); font-weight:normal;">(${a.sizeText})</span>` : ''}</div>
                  <div style="font-size:10.5px; color:var(--color-text-muted);">Uploaded by <strong>${a.uploadedBy || 'Member'}</strong> • ${a.timestamp}</div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  ${a.data || (a.url && a.url !== '#') ? `<a href="${a.data || a.url}" target="_blank" download="${a.name}" class="btn btn-primary" style="padding:2px 8px; font-size:10.5px; text-decoration:none;">View</a>` : ''}
                  ${allowAdd ? `<button type="button" class="tab-remove-btn" data-index="${i}" style="color:var(--color-red); border:none; background:none; cursor:pointer; font-weight:bold; font-size:14px;" aria-label="Remove asset">×</button>` : ''}
                </div>
              </li>
            `).join('') : '<li class="tab-list-item"><span style="color:var(--color-text-muted); font-size:11px;">No assets attached yet.</span></li>'}
          </ul>
        </div>
      `;

      if (allowAdd) {
        container.querySelector('#taTabFile').onclick = () => { activeTab = 'file'; render(); };
        container.querySelector('#taTabUrl').onclick = () => { activeTab = 'url'; render(); };

        const errorEl = container.querySelector('#taError');
        const showErr = (m) => { errorEl.textContent = m; errorEl.style.display = 'block'; };

        container.querySelector('#taUploadBtn').onclick = () => {
          const fileInput = container.querySelector('#taFileInput');
          if (!fileInput.files || fileInput.files.length === 0) return showErr('Please select a file to attach.');
          const file = fileInput.files[0];
          if (file.size > 2 * 1024 * 1024) return showErr(`File exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const newAsset = {
                name: file.name,
                type: file.type || 'file',
                sizeText: (file.size / 1024).toFixed(0) + ' KB',
                uploadedBy: currentUserName,
                timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                source: 'file',
                data: e.target.result
              };
              assets.push(newAsset);
              render();
              if (onChange) onChange(assets);
            } catch (err) {
              showErr('Storage quota exceeded. Please upload smaller files.');
            }
          };
          reader.onerror = () => showErr('Failed to read file.');
          reader.readAsDataURL(file);
        };

        container.querySelector('#taAddUrlBtn').onclick = () => {
          const name = container.querySelector('#taUrlName').value.trim();
          const url = container.querySelector('#taUrlVal').value.trim();
          if (!url) return showErr('Please enter a valid URL.');
          assets.push({
            name: name || url.replace(/^https?:\/\//, '').split('/')[0],
            type: 'url',
            sizeText: 'External URL',
            uploadedBy: currentUserName,
            timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            source: 'url',
            url
          });
          render();
          if (onChange) onChange(assets);
        };

        container.querySelectorAll('.tab-remove-btn').forEach(btn => {
          btn.onclick = () => {
            assets.splice(parseInt(btn.dataset.index), 1);
            render();
            if (onChange) onChange(assets);
          };
        });
      }
    }
    render();
    return {
      getAssets: () => assets,
      setAssets: (newAssets) => { assets = [...newAssets]; render(); }
    };
  };
})();
