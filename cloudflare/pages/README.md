# Cloudflare Pages 反爬层（`cloudflare/pages/`）

这个目录不是后端 Worker（后端在 `cloudflare/worker.js`，是另一回事），
而是**站点前端的托管层**：把本站从 GitHub Pages 迁到 Cloudflare Pages 之后，
用一层可编程边缘（Pages 高级模式 Worker）挡住爬虫。

## 为什么迁

GitHub Pages 是纯静态托管，**没有任何边缘计算能力**，所以：

- `data/published.json`（整库题目+答案，约 2MB）一条 `curl` 就能整包拿走；
- `q/*.html` 是 1209 个把**完整答案**写进 `ld+json` 的分享页，
  沿公开的 `sitemap.xml` 走一遍，同样等于整库下载。

robots.txt 只是「君子协定」，对不看 robots 的采集器毫无约束力。

Cloudflare Pages 免费版就支持：私有仓库部署 + 高级模式 Worker（`_worker.js`），
于是能在静态资源之上加一层真正会拒绝请求的守卫。

## 文件

| 文件 | 作用 |
| --- | --- |
| `_worker.js` | 高级模式 Worker，全部反爬逻辑（三道闸门，见文件头注释） |
| （仓库根）`robots.txt` | 明确拒绝 AI 训练 / SEO 采集工具的声明式兜底 |
| （仓库根）`404.html` | 自定义 404（Pages 会把未命中的路径交给它） |
| `tools/build-pages.mjs` | 组装发布目录 `dist/`（白名单拷贝 + 放置 `_worker.js`） |

> ⚠️ `_worker.js` **故意不放在仓库根**：Cloudflare Pages 只认根目录的 `_worker.js`，
> 但 GitHub Pages 会把根目录的它当成普通静态文件公开出去。放在这里，
> 由构建脚本拷进 `dist/`，两边都干净。

## 部署方式

### 方式 A：Git 集成（推荐，配一次就自动）

Cloudflare Dashboard → Workers & Pages → 创建 → Pages → 连接到 Git →
选 `succedd/workbuddy_it-interview`，然后：

| 设置项 | 值 |
| --- | --- |
| 生产分支 | `release` |
| 构建命令 | `node tools/build-pages.mjs` |
| 构建输出目录 | `dist` |

这样**站点自动发布会连带触发重新部署**（前端把题库推到 `release` 后，
Cloudflare 自动重建），不需要任何人工动作。

支持私有仓库——这正是当初想把仓库设为私有的前提条件。

### 方式 B：本地直接上传（改完立刻看效果）

```bash
node tools/build-pages.mjs
npx wrangler pages deploy dist --project-name it-interview
```

本机网络需要代理时：

```bash
export HTTPS_PROXY=http://127.0.0.1:7897
```

> `wrangler pages deploy` **不支持 `functions/` 目录**（那是 Dashboard 直传的能力），
> 只认高级模式 `_worker.js`。所以守卫逻辑全写在 `_worker.js` 里 —— 别改回 `functions/`。

## 关于自定义域名 `it-interview.is-a.dev`

- 该域名的 DNS 归属 **is-a.dev 项目**，不在本 Cloudflare 账号下，
  所以 **用不了 WAF / Bot Fight Mode**（那需要域名接入本账号）。
- 换域名要在 `is-a-dev/register` 仓库提 PR 改 `domains/it-interview.json`
  的 `CNAME`，从 `succedd.github.io` 改成 `it-interview-889.pages.dev`，约 1–2 天合并。
- 合并前，Cloudflare Pages 的预览地址 `https://it-interview-889.pages.dev` 已经可用，
  可以先在那里验收。

## 验证清单（改完 `_worker.js` 后跑一遍）

| 场景 | 期望 |
| --- | --- |
| 浏览器正常打开首页 | 200，题库正常加载 |
| 浏览器点开任一 `q/<id>.html` 分享页 | 200（人类访客不会被拦） |
| `curl /data/published.json` | 403 `bot-ua` |
| 浏览器 UA 但不带 `Sec-Fetch-Site`/同源 Referer 直接请求 `/data/published.json` | 403 `missing-browser-signal` |
| 浏览器 UA + `Sec-Fetch-Site: same-origin` 请求 `/data/published.json` | 200 |
| `Googlebot` UA + 非搜索引擎 ASN（伪造）请求 `/q/<id>.html` | 403 `spoofed-search-bot-ua` |
| 真实搜索引擎抓 `q/<id>.html` | 200（SEO 不受影响） |
| `/tools/build-pages.mjs`、`/cloudflare/pages/_worker.js`、`/HANDOVER.md` | 404 |

## 诚实的边界

这是**应用层**防护：能挡掉绝大多数随意采集（`curl` 一把梭、现成爬虫框架、
AI 训练抓取），但挡不住「会改请求头 + 肯租代理池」的定向攻击 ——
伪造 UA、手工补 `Sec-Fetch-Site` 仍能拿到数据。

想再进一步只有两条路：

1. 域名接入自己的 Cloudflare 账号，开 WAF / Bot Fight Mode（要放弃 `is-a.dev`）；
2. 改产品形态：把答案从静态 JSON / 分享页挪到需要登录的接口后面。
