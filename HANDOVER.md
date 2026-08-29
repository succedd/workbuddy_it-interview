# HANDOVER — 开发交接卡

> 本文件供 AI 编码工具（zcode 等）无缝接入开发使用。
> **维护规则：在 WorkBuddy 内每次完成开发/部署后，必须同步刷新第 6 节「当前状态」并更新时间戳。**

## 1. 仓库与分支

- 仓库：`https://github.com/succedd/workbuddy_it-interview.git`（GitHub 账号 `succedd`）
- 本地路径（WorkBuddy 侧）：`C:/Users/Life/WorkBuddy/2026-08-24-14-31-52/workbuddy_it-interview`
- **分支模型（部署安全铁律）：**
  - `release` = 唯一开发/部署分支，GitHub Pages 发布源，所有提交推它
  - `main` = 镜像分支，每次发版后 `git push --force origin HEAD:main` 同步
  - 推 release **必须 fast-forward**：push 前 `git ls-remote origin release` 核对线上 tip；若历史分叉，禁止 force push，必须把新代码移植到线上基线之上再推
  - commit 后立即 push（防本地事故丢代码）
  - `git add` 只精确加具体文件，禁用 `add -A`（防误提交 `wrangler.jsonc`/`.wrangler/`/临时文件）
- 凭据：GitHub Personal Access Token（repo 权限）由使用者自行配置（GitHub → Settings → Developer settings → Tokens）

## 2. 版本缓存机制（改代码必做）

- `index.html` 所有资源带 `?v=20260827v` 缓存戳（约 21 处）——**改动任何 js/css 后必须整体 bump**：
  `sed -i 's/v=20260827旧/v=20260827新/g' index.html`（字母递增 u→v→w…）
- `sw.js` 第 8 行 `const VERSION = "..."` 必须与 index.html 同步 bump（SW 缓存靠它失效）
- 部署 = `git push origin HEAD:release`，GitHub Pages 约 1 分钟生效
- 验证：`curl https://it-interview.is-a.dev/?nocache=<ts>` 确认新版本号命中

## 3. 技术栈与结构

- **纯静态零构建**：HTML + 原生 JS（hash 路由 `#/question/<id>`）+ IndexedDB，无框架无打包，改文件即开发
- 行尾是 CRLF：node 脚本批量改文件需归一化 `\r\n`，否则 diff 爆炸；优先用逐处编辑工具
- 后端：Cloudflare Worker（`cloudflare/worker.js`）；部署必须 `wrangler deploy --config cloudflare/wrangler.toml`（根目录 wrangler.jsonc 是历史事故元凶，已进 .gitignore，勿动）
- D1 数据库 `it-interview-users`：表 users / sessions / daily_done / mock_reports
- 数据源：`data/published.json`（发布数据，结构 `{questions:[...]}`）
- 静态分享页：`tools/gen-share-pages.js` 生成 258 个 `q/<id>.html`（per-question OG 标签 + 自动跳回 SPA）——**新增题目后需重跑一次**
- 域名 `it-interview.is-a.dev`（is-a.dev 子域名，CNAME 已配）；百度统计 ID `856d2b08330e4b9f225cf101d6f14103`

## 4. 本机网络（在用户这台 Windows 机器上跑命令时）

- git 推拉需显式代理：`git -c http.proxy=http://127.0.0.1:7897 fetch/push`（环境变量代理对 git 不生效；无代理直连 GitHub 间歇性超时，失败重试 2-3 次）
- curl 走代理正常；curl `-o` 落盘需写入工作目录（沙箱限制）

## 5. 验证与回归（发版后必做）

- **上线新功能绝不允许覆盖/丢失原有功能**：发版后逐项 grep 旧功能标记词验证仍在（如 pageReview / todayFive / weakGrade / nav-pulse / review-banner / share-btn / beaconSync / uploadImageAsset 等）
- 用户反馈的问题必须追根修复，不做表面处理
- 微信环境认知（已实测确认）：
  1. 聊天框粘贴 URL 永远只是蓝字链接（微信产品规则，与 OG 无关）
  2. 链接卡片只在「点开链接 → ⋯ → 发送给朋友」路径出现；is-a.dev 免费域名缩略图可能被省略
  3. 微信 WebView 内 `navigator.share({files})` 不可用、a[download] 体验差 → 分享弹窗已做 `MicroMessenger` UA 检测，走「点图放大 → 长按发送给朋友」专属路径

## 6. 当前状态（⚠️ 实时更新区，每次开发后刷新）

- **最后更新**：2026-08-29 13:24
- **最新 commit**：`99f83b4`（缓存版本 `20260827v`）——微信内置浏览器分享适配：长按大图发送给朋友
- **线上**：release = main = `99f83b4`，站点已验证
- **已上线功能**：题库浏览/搜索/刷题/收藏/错题本（间隔复习）/模拟面试（报告云端+历次趋势）/学习周报/每日打卡上云/PWA 离线/无障碍/题目分享卡片（canvas 图片 + 258 个静态 OG 分享页）/sendBeacon 兜底同步/图片外置上传
- **进行中/待办**：
  - P1：登录时顺手清理自己已过期的旧会话（防 sessions 表膨胀）
  - P1：eu.org 自有域名审核中（automation 每天 10:00 检查）
  - P2：题目查重机制仅覆盖 Excel/CSV 批量导入，手动新增与 AI 生成无查重
  - P2：ima 知识库订阅内容作为题库数据源的探索
  - P2：可访问性补齐（卡片内图标按钮 aria-label）
