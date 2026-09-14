function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applySiteMeta(site) {
  if (!site) return;

  const titleEl = document.getElementById('site-title');
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroBadge = document.getElementById('hero-badge');
  const githubLink = document.getElementById('github-link');
  const footerGithub = document.getElementById('footer-github');

  if (titleEl) titleEl.textContent = site.title;
  if (heroTitle) heroTitle.textContent = site.title;
  if (heroSubtitle) heroSubtitle.textContent = site.subtitle;
  if (heroBadge && site.badge) heroBadge.textContent = site.badge;
  if (githubLink && site.github) githubLink.href = site.github;
  if (footerGithub) {
    footerGithub.textContent = site.author;
    if (site.github) footerGithub.href = site.github;
  }
}

function detailUrl(id) {
  return `detail.html?id=${encodeURIComponent(id)}`;
}

function skillUrl(id) {
  return `skill.html?id=${encodeURIComponent(id)}`;
}

function renderTags(tags) {
  return (tags || [])
    .map((t) => `<span class="ext-tag">${escapeHtml(t)}</span>`)
    .join('');
}

function renderList(items, className = 'detail-list', ordered = false) {
  if (!items || !items.length) return '';
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag} class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
}

function renderShortcuts(shortcuts) {
  if (!shortcuts || !shortcuts.length) return '';
  const rows = shortcuts
    .map(
      (s) =>
        `<tr><td><kbd>${escapeHtml(s.keys)}</kbd></td><td>${escapeHtml(s.desc)}</td></tr>`
    )
    .join('');
  return `<table class="shortcut-table"><tbody>${rows}</tbody></table>`;
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

async function fetchExtensionsData() {
  return fetchJson('data/extensions.json');
}

async function fetchHubData() {
  const [extData, sitesData, skillsData] = await Promise.all([
    fetchJson('data/extensions.json'),
    fetchJson('data/sites.json'),
    fetchJson('data/skills.json'),
  ]);
  return {
    site: extData.site,
    extensions: extData.extensions || [],
    sites: sitesData.sites || [],
    skills: skillsData.skills || [],
  };
}

function getById(items, id) {
  return items.find((item) => item.id === id);
}

function getExtensionById(extensions, id) {
  return getById(extensions, id);
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
