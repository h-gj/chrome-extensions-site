async function loadExtensions() {
  const grid = document.getElementById('extensions-grid');
  const countEl = document.getElementById('extension-count');

  try {
    const data = await fetchExtensionsData();
    applySiteMeta(data.site);
    document.title = `${data.site.title} · ${data.site.author}`;
    renderExtensions(data.extensions, grid, countEl);
  } catch (err) {
    console.error('Failed to load extensions:', err);
    grid.innerHTML = '<p class="error-message">扩展列表加载失败，请确认 data/extensions.json 存在。</p>';
    if (countEl) countEl.textContent = '';
  }
}

function renderExtensions(extensions, grid, countEl) {
  if (countEl) {
    countEl.textContent = `共 ${extensions.length} 个扩展`;
  }

  grid.innerHTML = extensions.map(renderCard).join('');

  grid.querySelectorAll('.ext-note').forEach((el) => {
    el.addEventListener('toggle', () => {
      if (el.open) {
        grid.querySelectorAll('.ext-note').forEach((other) => {
          if (other !== el) other.open = false;
        });
      }
    });
  });
}

function renderCard(ext) {
  const tags = renderTags(ext.tags);
  const url = detailUrl(ext.id);

  const note = ext.installNote
    ? `<details class="ext-note">
         <summary>安装备注</summary>
         ${escapeHtml(ext.installNote)}
       </details>`
    : '';

  return `
    <article class="ext-card" id="${escapeHtml(ext.id)}">
      <a class="ext-card-link" href="${escapeHtml(url)}" aria-label="查看 ${escapeHtml(ext.name)} 详情"></a>
      <div class="ext-card-header">
        <img class="ext-icon" src="${escapeHtml(ext.icon)}" alt="${escapeHtml(ext.name)} 图标" width="56" height="56">
        <div class="ext-meta">
          <h3><a href="${escapeHtml(url)}">${escapeHtml(ext.name)}</a></h3>
          <span class="ext-version">v${escapeHtml(ext.version)}</span>
        </div>
      </div>
      <p class="ext-desc">${escapeHtml(ext.description)}</p>
      ${tags ? `<div class="ext-tags">${tags}</div>` : ''}
      <div class="ext-actions">
        <a class="btn btn-primary btn-sm" href="${escapeHtml(ext.download)}" download>下载</a>
        <a class="btn btn-secondary btn-sm" href="${escapeHtml(url)}">详情</a>
        <a class="btn btn-secondary btn-sm" href="${escapeHtml(ext.github)}" target="_blank" rel="noopener">GitHub</a>
      </div>
      ${note}
    </article>
  `;
}

loadExtensions();
