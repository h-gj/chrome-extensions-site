async function loadSkill() {
  const container = document.getElementById('detail-content');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNotFound(container, '未指定 Skill ID');
    return;
  }

  try {
    const data = await fetchHubData();
    applySiteMeta(data.site);

    const skill = getById(data.skills, id);
    if (!skill) {
      renderNotFound(container, `找不到 Skill「${id}」`);
      return;
    }

    document.title = `${skill.name} · ${data.site.title}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = skill.description;

    container.innerHTML = renderSkill(skill);
  } catch (err) {
    console.error('Failed to load skill:', err);
    container.innerHTML = '<p class="error-message">Skill 详情加载失败。</p>';
  }
}

function renderNotFound(container, message) {
  container.innerHTML = `
    <div class="detail-not-found">
      <h1>未找到 Skill</h1>
      <p>${escapeHtml(message)}</p>
      <a class="btn btn-secondary" href="skills.html">返回 Skills</a>
    </div>
  `;
}

function renderSkill(skill) {
  const detail = skill.detail || {};
  const tags = renderTags(skill.tags);
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
        <h2>能力</h2>
        ${renderList(detail.features)}
      </section>
    `);
  }

  if (detail.usage?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>安装与使用</h2>
        ${renderList(detail.usage, 'detail-list', true)}
      </section>
    `);
  }

  if (skill.installPath) {
    sections.push(`
      <section class="detail-section">
        <h2>目标目录</h2>
        <pre class="code-block">${escapeHtml(skill.installPath)}</pre>
      </section>
    `);
  }

  if (detail.requirements?.length) {
    sections.push(`
      <section class="detail-section">
        <h2>依赖</h2>
        ${renderList(detail.requirements)}
      </section>
    `);
  }

  return `
    <header class="detail-hero">
      <img class="detail-icon" src="${escapeHtml(skill.icon)}" alt="" width="80" height="80">
      <div class="detail-hero-text">
        <h1>${escapeHtml(skill.name)}</h1>
        <p class="detail-desc">${escapeHtml(skill.description)}</p>
        <div class="detail-meta">
          <span class="ext-version">v${escapeHtml(skill.version)}</span>
          ${tags ? `<div class="ext-tags">${tags}</div>` : ''}
        </div>
        <div class="detail-actions">
          <a class="btn btn-primary" href="${escapeHtml(skill.download)}" download>下载</a>
          <a class="btn btn-secondary" href="install.html#skills">安装指南</a>
        </div>
      </div>
    </header>
    ${sections.join('')}
  `;
}

loadSkill();
