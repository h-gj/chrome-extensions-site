---
name: site-rebuild-ship
description: >-
  End-to-end one-shot: user gives a source site domain/URL; agent runs
  site-rebuild-and-deploy (mirror → GitHub Pages + custom host) then
  cloudflare-manager to add a DNS-only CNAME. Use when the user says
  一条龙, 复刻并解析, 复刻上线加 CNAME, site-rebuild-ship, or provides only
  a domain and wants rebuild + Pages + Cloudflare DNS together.
agent_created: true
metadata:
  version: "1.0.0"
---

# 复刻 → Pages → Cloudflare CNAME 一条龙

用户只给**源站域名或 URL**。本 skill **不重写**复刻/发布管线，只规定调用顺序与默认值。

```
用户: json.cn
  → 读并执行 site-rebuild-and-deploy（含 website-rebuild）
  → Pages 已 built 且仓库 CNAME 已写
  → 读并执行 cloudflare-manager：CNAME json → <gh-user>.github.io（DNS only）
  → 验收 HTTP 200
```

## 立刻加载（不许凭记忆复述）

1. `~/.cursor/skills/site-rebuild-and-deploy/SKILL.md` — **整份跟着跑**
2. `~/.cursor/skills/website-rebuild/SKILL.md` — Phase A 必经
3. `~/.cursor/skills/cloudflare-manager/SKILL.md` — Phase D 才读完再动 DNS

⛔ 复刻纪律与法务边界**不可放宽**（私有+noindex 默认；公开必须用户明确决定）。本条龙的默认发布假设：用户要 **公开 Pages + `{slug}.hgjhub.com`**。若用户没说公开，仍先问；若说「一条龙 / 只要域名」，视为明确要公开到该 CNAME。

## 输入与派生（用户只给源站时）

从输入抽出 origin 与 slug，**缺一就问，能推就不要再问仓库/域名**：

| 输入 | origin URL | slug（CNAME 名 + 仓库名） |
|---|---|---|
| `json.cn` / `https://json.cn` / `www.json.cn` | `https://www.json.cn/`（Step 0 以指纹 final URL 为准） | `json`（去 `www.`，取主机**第一段**） |
| `https://foo.example.com/path` | 指纹目标用用户给的 path | `foo` |

其余默认：

| 项 | 默认 |
|---|---|
| 复刻终点 | **L2** |
| 范围 | **首页 + 核心流程**（不是整站 CMS） |
| GitHub owner | `gh api user --jq .login`（Windows 先设 `GH_CONFIG_DIR`） |
| 仓库 | `{owner}/{slug}`，**public**（免费 Pages） |
| 自定义域 | `{slug}.{zone}`。`zone` 从 `list-dns` 结果里最长公共后缀得出（实测 `*.hgjhub.com` → `hgjhub.com`） |
| CNAME 目标 | `{owner}.github.io` |
| 代理 | **`--no-proxy`（DNS only）**，方便 GitHub 签证书 |

用户若显式给了 repo / 子域 / L1–L3 / 整站范围，覆盖上表。

开工仍用 `AskUserQuestion` **一次问完**，但选项要把上表写成「已预填，确认即开」：

1. 终点（预选 L2）
2. 范围（预选首页+核心）
3. 发布：`{owner}/{slug}` + `{slug}.{zone}` 公开 Pages（可改）

## 阶段与门（串行，红了停）

| 段 | 做什么 | 过门才能下一步 |
|---|---|---|
| **A–C** | **原样执行** `site-rebuild-and-deploy` | 该 skill 的镜像/重拼/探针/像素/远端 blob 门 |
| **C′ Pages API** | Git Bash 里 `gh api /repos/...` 会被 MSYS 改成盘符路径而失败。失败后用 **PowerShell**（无前导 `/`）：见下 | `gh api repos/{owner}/{repo}/pages` 有 `cname` 且 `status` 为 `built` 或已创建 |
| **D DNS** | `cloudflare-manager`：`list-dns` → 无冲突则 `add-dns`，同名不同值则 `update-dns` 或先删后加 | Cloudflare `success: true`；权威解析 CNAME = `{owner}.github.io` |
| **E 线上** | `curl.exe -sI http://{slug}.{zone}/` | **HTTP 200**。HTTPS 证签未完成时 60/403 **不算失败**，写进 `DEPLOY-STATUS.md` 即可 |

### C′ PowerShell（Pages）

```powershell
$env:GH_CONFIG_DIR = "$env:USERPROFILE\AppData\Roaming\GitHub CLI"
$body = '{"source":{"branch":"main","path":"/"},"cname":"<slug>.<zone>"}'
# 已存在用 PUT，否则 POST
$body | gh api repos/<owner>/<repo>/pages --method POST --input -
```

### D Cloudflare（Windows）

优先跑本 skill 脚本（list → add 或 update，默认 DNS only）：

```powershell
$py  = "$env:USERPROFILE\.cursor\skills\cloudflare-manager\.venv\Scripts\python.exe"
$ens = "$env:USERPROFILE\.cursor\skills\site-rebuild-ship\scripts\ensure_cname.py"
& $py $ens --name <slug> --content <owner>.github.io --no-proxy --comment "GitHub Pages unofficial rebuild of <origin-host>"
```

等价手写（脚本不可用时）：

```powershell
$cf = "$env:USERPROFILE\.cursor\skills\cloudflare-manager\scripts\cf_manager.py"
& $py $cf list-dns
& $py $cf add-dns --type CNAME --name <slug> --content <owner>.github.io --no-proxy --comment "..."
```

⛔ 不要用 A 记录指 GitHub IP。⛔ 同名旧 A/AAAA/CNAME 必须先处理。凭据只读 `cloudflare-manager` 的 `.env`，禁止打进仓库或聊天。

## 交付（必须一次给全）

- 源站 / 仓库 / `http(s)://{slug}.{zone}/`
- 验收表（A–C 门 + Pages built + CNAME 记录 id + HTTP 探测）
- `DEPLOY-STATUS.md` 记 Cloudflare record id、`proxied: false`、HTTPS 是否已通

## 已知坑（本条龙额外）

1. `ship-to-pages.sh` 在 Git Bash 开 Pages 常失败 → 走 C′，不要重跑整段复刻。
2. `header.js` 一类 `assetsPath = "//cdn"+data-assets-path` **没有尾斜杠**，serve 默认协议相对改写会漏 → 在 `site-rebuild-and-deploy` 里用 `--rewrite`；本 skill 不另发明改写。
3. HTTPS 往往晚于 HTTP；先报 HTTP 200，再视情况等证书。
