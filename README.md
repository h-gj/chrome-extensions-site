# hgjhub · 扩展 · 站点 · Skills

个人公开货架：Chrome 扩展、托管在 `*.hgjhub.com` 的站点，以及可下载的 Cursor / Codex Agent Skills。纯 HTML / CSS / JavaScript，无构建步骤。

## 本地预览

```powershell
cd C:\Users\69063\Projects\chrome-extensions-site
python -m http.server 8080
```

浏览器打开 http://127.0.0.1:8080/

> 需通过 HTTP 服务访问（不能直接双击 `index.html`），因为页面通过 `fetch` 加载 `data/*.json`。

## 维护目录

| 文件 | 内容 |
|------|------|
| `data/extensions.json` | Chrome 扩展 + 站点标题/副标题 |
| `data/sites.json` | 个人站点与学习复刻站 |
| `data/skills.json` | 可分享的 Agent Skills |
| `share/skills/` | Skill 源文件与 zip |

## 维护扩展列表

编辑 `data/extensions.json`：

```json
{
  "id": "my-extension",
  "name": "扩展名称",
  "version": "1.0.0",
  "description": "一句话描述",
  "icon": "assets/icons/my-extension.svg",
  "tags": ["标签1", "标签2"],
  "github": "https://github.com/h-gj/my-extension",
  "download": "https://github.com/h-gj/my-extension/releases/download/v1.0.0/my-extension.zip",
  "installNote": "可选的特殊安装说明"
}
```

编辑 `data/extensions.json`，在对应扩展下填写 `detail` 字段（overview、features、usage 等）。详情页地址格式：`detail.html?id=扩展ID`。

## 部署到 GitHub Pages

### 1. 创建仓库并推送

```powershell
cd C:\Users\69063\Projects\chrome-extensions-site
git init
git add .
git commit -m "Initial static site for Chrome extensions"
git branch -M main
git remote add origin git@github.com:h-gj/chrome-extensions-site.git
git push -u origin main
```

### 2. 开启 Pages

GitHub 仓库 → **Settings** → **Pages** → Source 选 **Deploy from a branch** → Branch 选 `main` / `/ (root)` → Save。

几分钟后站点上线：`https://h-gj.github.io/chrome-extensions-site/`

### 3. 绑定自定义域名 hgjhub.com

仓库根目录已有 `CNAME` 文件（内容为 `hgjhub.com`），推送后生效。

**DNS 配置（GitHub Pages）：**

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | `@` 或 `www` | `h-gj.github.io` |

- 只用根域名 `hgjhub.com`：添加 `@` → `h-gj.github.io`
- 根域名 + `www` 都支持：两条 CNAME 都指向 `h-gj.github.io`，`CNAME` 文件填 `hgjhub.com`

**GitHub 侧：** 仓库 → **Settings** → **Pages** → Custom domain 填 `hgjhub.com` → 等待 DNS 检测通过 → 勾选 **Enforce HTTPS**。

**在 Cloudflare 买域名时：**

1. 购买 `hgjhub.com` 后进入 **DNS** → **Records**
2. 添加 CNAME：`@` → `h-gj.github.io`（若 CF 不允许根域名 CNAME，改用 **DNS only** 灰色云，或添加 A 记录指向 GitHub Pages IP）
3. 首次配置建议 **关闭代理**（灰色云 ☁️），等 GitHub HTTPS 证书签发后再决定是否开启
4. 若国内解析慢，可将 NS 改到阿里云 / DNSPod，记录仍指向 `h-gj.github.io`

生效后访问：**https://hgjhub.com**

## 扩展打包（可选）

当前下载链接指向 GitHub 源码 zip。若需发布精简的安装包，可在各扩展仓库运行：

```powershell
.\scripts\package-extension.ps1 -ProjectPath C:\Users\69063\Projects\vault-pass
```

然后在 GitHub 创建 Release 并上传 zip，将 `extensions.json` 中的 `download` 改为 Release 地址。

## 项目结构

```
chrome-extensions-site/
├── index.html              # 首页入口
├── extensions.html         # 扩展列表
├── sites.html              # 站点列表
├── skills.html             # Skills 列表
├── install.html            # 扩展与 Skill 安装指南
├── skill.html              # Skill 详情
├── detail.html             # 扩展详情
├── data/extensions.json
├── data/sites.json
├── data/skills.json
├── share/skills/           # 可下载的 skill 包
├── css/style.css
├── js/
└── assets/icons/
```

## License

MIT
