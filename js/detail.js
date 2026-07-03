async function loadDetail() {
  const container = document.getElementById('detail-content');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNotFound(container, '未指定扩展 ID');
    return;
  }

  try {
    const data = await fetchExtensionsData();
    applySiteMeta(data.site);

    const ext = getExtensionById(data.extensions, id);
    if (!ext) {
      renderNotFound(container, `找不到扩展「${id}」`);
      return;
    }

    document.title = `${ext.name} · ${data.site.title}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = ext.description;

    container.innerHTML = renderDetail(ext);
  } catch (err) {
    console.error('Failed to load detail:', err);
    container.innerHTML = '<p class="error-message">扩展详情加载失败。</p>';
  }
}

function renderNotFound(container, message) {
  container.innerHTML = `
    <div class="detail-not-found">
      <h1>未找到扩展</h1>
      <p>${escapeHtml(message)}</p>
      <a class="btn btn-secondary" href="./">返回首页</a>
    </div>
  `;
}

function renderDetail(ext) {
  const detail = ext.detail || {};
  const tags = renderTags(ext.tags);

  const sections = [];

  if (detail.overview) {
    sections.push(`
      <section class="detail-section">
        <h2>介绍</h2>
        <p class="detail-overview">${escapeHtml(detail.overview)}</p>
      </section>
    `);
  }

  if (detail.features?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>功能特性</h2>
        ${renderList(detail.features)}
      </section>
    `);
  }

  if (detail.usage?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>使用方法</h2>
        ${renderList(detail.usage, 'detail-list', true)}
      </section>
    `);
  }

  if (detail.shortcuts?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>快捷键</h2>
        ${renderShortcuts(detail.shortcuts)}
      </section>
    `);
  }

  if (detail.techStack?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>技术栈</h2>
        <div class="ext-tags">${detail.techStack.map((t) => `<span class="ext-tag">${escapeHtml(t)}</span>`).join('')}</div>
      </section>
    `);
  }

  if (detail.requirements?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>使用要求</h2>
        ${renderList(detail.requirements)}
      </section>
    `);
  }

  if (ext.installNote) {
    sections.push(`
      <section class="detail-section">
        <h2>安装备注</h2>
        <div class="callout callout-info">${escapeHtml(ext.installNote)}</div>
      </section>
    `);
  }

  return `
    <header class="detail-hero">
      <img class="detail-icon" src="${escapeHtml(ext.icon)}" alt="${escapeHtml(ext.name)} 图标" width="80" height="80">
      <div class="detail-hero-text">
        <h1>${escapeHtml(ext.name)}</h1>
        <p class="detail-desc">${escapeHtml(ext.description)}</p>
        <div class="detail-meta">
          <span class="ext-version">v${escapeHtml(ext.version)}</span>
          ${tags ? `<div class="ext-tags">${tags}</div>` : ''}
        </div>
        <div class="detail-actions">
          <a class="btn btn-primary" href="${escapeHtml(ext.download)}" download>下载扩展</a>
          <a class="btn btn-secondary" href="${escapeHtml(ext.github)}" target="_blank" rel="noopener">查看源码</a>
          <a class="btn btn-secondary" href="install.html">安装指南</a>
        </div>
      </div>
    </header>
    ${sections.join('')}
  `;
}

loadDetail();
