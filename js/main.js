async function loadPage() {
  const catalog = document.getElementById('catalog-grid');
  try {
    const data = await fetchHubData();
    applySiteMeta(data.site);

    if (catalog) {
      loadCatalog(data, catalog);
      return;
    }

    document.title = data.site.title;
    setCount('extension-count', data.extensions.length, '个扩展');
    setCount('site-count', data.sites.length, '个站点');
    setCount('skill-count', data.skills.length, '个 Skills');
  } catch (err) {
    console.error('Failed to load hub:', err);
    const msg = '<p class="error-message">列表加载失败，请确认 data/*.json 可通过 HTTP 访问。</p>';
    if (catalog) catalog.innerHTML = msg;
  }
}

function setCount(id, n, label) {
  const el = document.getElementById(id);
  if (el) el.textContent = `${n} ${label}`;
}

function loadCatalog(data, grid) {
  const kind = grid.dataset.catalog;
  const countEl = document.getElementById('catalog-count');
  if (kind === 'extensions') {
    document.title = `扩展 · ${data.site.title}`;
    renderExtensions(data.extensions, grid, countEl);
  } else if (kind === 'sites') {
    document.title = `站点 · ${data.site.title}`;
    renderSites(data.sites, grid, countEl);
  } else if (kind === 'skills') {
    document.title = `Skills · ${data.site.title}`;
    renderSkills(data.skills, grid, countEl);
  }
}

function bindNoteToggles(grid) {
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

function renderExtensions(extensions, grid, countEl) {
  if (countEl) countEl.textContent = `共 ${extensions.length} 个`;
  grid.innerHTML = extensions.map(renderExtensionCard).join('');
  bindNoteToggles(grid);
}

function renderSites(sites, grid, countEl) {
  if (countEl) countEl.textContent = `共 ${sites.length} 个`;
  grid.innerHTML = sites.map(renderSiteCard).join('');
}

function renderSkills(skills, grid, countEl) {
  if (countEl) countEl.textContent = `共 ${skills.length} 个`;
  grid.innerHTML = skills.map(renderSkillCard).join('');
}

function renderExtensionCard(ext) {
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

function renderSiteCard(site) {
  const tags = renderTags(site.tags);
  const source = site.source
    ? `<p class="ext-source">参考：<a href="${escapeHtml(site.source)}" target="_blank" rel="noopener">${escapeHtml(site.source.replace(/^https?:\/\//, ''))}</a></p>`
    : '';

  return `
    <article class="ext-card" id="${escapeHtml(site.id)}">
      <a class="ext-card-link" href="${escapeHtml(site.url)}" target="_blank" rel="noopener" aria-label="打开 ${escapeHtml(site.name)}"></a>
      <div class="ext-card-header">
        <img class="ext-icon" src="${escapeHtml(site.icon)}" alt="" width="56" height="56">
        <div class="ext-meta">
          <h3><a href="${escapeHtml(site.url)}" target="_blank" rel="noopener">${escapeHtml(site.name)}</a></h3>
          <span class="ext-version">${escapeHtml(new URL(site.url, location.href).host || 'web')}</span>
        </div>
      </div>
      <p class="ext-desc">${escapeHtml(site.description)}</p>
      ${source}
      ${tags ? `<div class="ext-tags">${tags}</div>` : ''}
      <div class="ext-actions">
        <a class="btn btn-primary btn-sm" href="${escapeHtml(site.url)}" target="_blank" rel="noopener">打开</a>
        <a class="btn btn-secondary btn-sm" href="${escapeHtml(site.github)}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </article>
  `;
}

function renderSkillCard(skill) {
  const tags = renderTags(skill.tags);
  const url = skillUrl(skill.id);

  return `
    <article class="ext-card" id="${escapeHtml(skill.id)}">
      <a class="ext-card-link" href="${escapeHtml(url)}" aria-label="查看 ${escapeHtml(skill.name)} 详情"></a>
      <div class="ext-card-header">
        <img class="ext-icon" src="${escapeHtml(skill.icon)}" alt="" width="56" height="56">
        <div class="ext-meta">
          <h3><a href="${escapeHtml(url)}">${escapeHtml(skill.name)}</a></h3>
          <span class="ext-version">v${escapeHtml(skill.version)}</span>
        </div>
      </div>
      <p class="ext-desc">${escapeHtml(skill.description)}</p>
      ${tags ? `<div class="ext-tags">${tags}</div>` : ''}
      <div class="ext-actions">
        <a class="btn btn-primary btn-sm" href="${escapeHtml(skill.download)}" download>下载</a>
        <a class="btn btn-secondary btn-sm" href="${escapeHtml(url)}">详情</a>
      </div>
    </article>
  `;
}

loadPage();
