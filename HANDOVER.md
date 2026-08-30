# HANDOVER — 开发交接卡

> 本文件供 AI 编码工具（zcode 等）无缝接入开发使用。
> **维护规则：在 WorkBuddy 内每次完成开发/部署后，必须同步刷新第 6 节「当前状态」并更新时间戳，同时在 README.md「更新日志」顶部追加本次变更（时间逆序，含缓存版本号）；同一天的变更合并在同一天条目下，不单开新日期标题。用户可见功能有变化时，还必须同步更新站内「使用指南」（app.js 的 pageHelp 函数，#/help 路由），并更新指南底部的「文档最近更新」日期。**

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

- `index.html` 所有资源带 `?v=20260829h` 缓存戳（约 21 处）——**改动任何 js/css 后必须整体 bump**：
  `sed -i 's/v=20260829旧/v=20260829新/g' index.html`（字母递增 u→v→w…）
- `sw.js` 第 8 行 `const VERSION = "..."` 必须与 index.html 同步 bump（SW 缓存靠它失效）
- 部署 = `git push origin HEAD:release`，GitHub Pages 约 1 分钟生效
- 验证：`curl https://it-interview.is-a.dev/?nocache=<ts>` 确认新版本号命中

## 3. 技术栈与结构

- **纯静态零构建**：HTML + 原生 JS（hash 路由 `#/question/<id>`）+ IndexedDB，无框架无打包，改文件即开发
- **第三方库已本地化 vendor/**（dexie/marked/purify/highlight/fuse + hljs 主题 css 进 SW 壳缓存；echarts/xlsx 大库按需加载 `U.loadScript`）——新增库要同步 sw.js 的 APP_SHELL；vendor 库无版本参数，缓存失效靠 SW VERSION 整体 bump
- 行尾是 CRLF：node 脚本批量改文件需归一化 `\r\n`，否则 diff 爆炸；优先用逐处编辑工具
- 数据源：`data/published.json`（发布数据，结构 `{questions:[...]}`）
- 静态分享页：`tools/gen-share-pages.js` 生成 264 个 `q/<id>.html`（内容型落地页：per-question OG + 题目/答案全文 + QAPage JSON-LD；**不自动跳转**，CTA 手动进 SPA；滚动近文末滑入「连刷同类题」引导条，可关闭）——**新增题目后需重跑一次**（脚本已同步桌面副本）
- 域名 `it-interview.is-a.dev`（is-a.dev 子域名，CNAME 已配）；百度统计 ID `856d2b08330e4b9f225cf101d6f14103`

## 3.5 后端开发（Cloudflare Worker + D1）⚠️ 本机 zcode 需要读这节

后端代码全在 `cloudflare/` 目录，是独立的一层，**改动它不走 GitHub Pages**，走 wrangler 部署：

- **文件**：`cloudflare/worker.js`（全部逻辑）+ `cloudflare/schema.sql`（建表语句）+ `cloudflare/wrangler.toml`（配置）+ `cloudflare/部署指南.md`（完整部署教程）
- **资源绑定**（wrangler.toml，勿改 id）：
  - Worker 名称：`it-interview-stats`
  - KV `STATS`（访问统计）id `ef5539a2537d417c83141dd771c98454`
  - D1 `USERS` 数据库 `it-interview-users`，database_id `111f4eda-55e2-475d-b199-27e962dec4fc`
  - 表：users / sessions / favorites / histories / weak（错题本）/ daily_done / mock_reports
- **线上 API 地址**（前端 `js/account.js:19` `API_DEFAULT` 写死）：`https://it-interview-stats.iti-interview.workers.dev`
  - 前端设置页（`js/app.js` stats-api 输入框）可覆盖默认地址
- **部署命令（铁律）**：必须 `wrangler deploy --config cloudflare/wrangler.toml`
  - 根目录曾有 `wrangler.jsonc` 元凶把静态站误部署成 worker（已进 .gitignore，勿动/勿提交）
- **本机环境**：wrangler 已全局安装（`C:\Users\Life\AppData\Roaming\npm\wrangler`）；Cloudflare OAuth 已登录过，若过期重新 `wrangler login --config cloudflare/wrangler.toml`（国内网络下可能需代理/重试）
- **D1 建表/查数据**：
  `wrangler d1 execute it-interview-users --remote --config cloudflare/wrangler.toml --command "SQL"`
- **改 worker.js 后**：不需要 bump 前端版本号（worker 独立部署即时生效）；但 CORS 在 worker 内自管，新增接口记得走 `corsHeaders`
- **容错约定**：D1 新表缺失时 worker 静默降级（返回空/跳过保存），不影响核心同步——新增表照此模式写
- **本地调试**：`wrangler dev --config cloudflare/wrangler.toml`（注意本地 dev 的 D1 是空库，登录功能要 `--remote` 或先建表）

## 4. 本机网络与 git 环境（在用户这台 Windows 机器上跑命令时）

- **本机未装系统级 git**（PATH 无 `git` 命令，勿浪费时间找）：用 WorkBuddy 便携版 `C:\Users\Life\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd\git.exe`
- **GitHub 连接已持久化**（2026-08-29）：PAT 已写入本仓库 `.git/config` 的 origin URL，代理已写入仓库级 `http.proxy`——在本目录内 fetch/push 直接跑即可（token 本体勿写进任何会被提交的文件）
- curl/wrangler 走代理正常：curl 加 `-x http://127.0.0.1:7897`；wrangler 前置 `set HTTPS_PROXY=http://127.0.0.1:7897`
- curl `-o` 落盘需写入工作目录（沙箱限制），不能写 /dev/null
- workers.dev 域名在国内 DNS 污染是常态——但带代理 curl 实测可达（2026-08-29 验证过 /stats 200）；判生死优先用 wrangler 部署输出 + 带代理 curl

## 5. 验证与回归（发版后必做）

- **发版前**：`node tools/smoke-test.js`（25 用例纯函数回归）+ `node tools/data-audit.js`（题库体检：缺字段/重复题/瘦分类/图片缺失）
- **上线新功能绝不允许覆盖/丢失原有功能**：发版后逐项 grep 旧功能标记词验证仍在（如 pageReview / todayFive / weakGrade / nav-pulse / review-banner / share-btn / beaconSync / uploadImageAsset 等）
- 用户反馈的问题必须追根修复，不做表面处理
- 微信环境认知（已实测确认）：
  1. 聊天框粘贴 URL 永远只是蓝字链接（微信产品规则，与 OG 无关）
  2. 链接卡片只在「点开链接 → ⋯ → 发送给朋友」路径出现；is-a.dev 免费域名缩略图可能被省略
  3. 微信 WebView 内 `navigator.share({files})` 不可用、a[download] 体验差 → 分享弹窗已做 `MicroMessenger` UA 检测，走「点图放大 → 长按发送给朋友」专属路径

## 6. 当前状态（⚠️ 实时更新区，每次开发后刷新）

- **最后更新**：2026-08-30 16:35
- **最新 commit**：本次提交（缓存版本 `20260829n`）——**第一性原理必读题**：19 域 ×4 题（诞生/本质/边界/演化）入库 265~340、分类页置顶必读机制（tags「第一性原理」识别）；题库 264→340 题，版本号随 editor 直写会回退为 1 属已知现象（同步按 publishedAt 判定）。上一条（m）：**在线手册补同步**——**在线手册补同步**：分享卡片（分层摘要排版）、独立分享页（单步直达 + 读完引导）、技术全景图（架构图/分支树双入口直达）三处说明与实际功能对齐；使用指南「文档最近更新」随每次功能更新必须同步（用户重申此纪律）。上一条（l）：**分支树节点点击直达分类**——**分支树节点点击直达分类**（末级节点导航、上层节点展开/收起；架构图方块此前已可点击）。上一条（k）：**人工架构图**——**人工架构图**：19 个重点技术域手绘分层架构图（data/tech-maps.json，173 节点 100% 可点击跳分类），分类页「架构图|分支树」双标签，叶子分类继承所属域全景；上一条（j）：**技术全景图自动树**（ECharts 按需加载、薄弱橙标、叶子显示同级位置）。上一条（i）：**分享卡片答案摘要重排**：旧版把答案整体去格式后硬折 7 行，编号/要点/分段全糊在一起（用户反馈：卡片排版乱到不想扫码）；现按编号/项目符号/空行切块、每块独立折行、块间留缝、行数用尽自动补省略号。同日：`9aa655a` 分享页读完引导条（滚动近文末滑入「连刷同类题」，可关闭）；`98e0795` 分享落地页取消 2.5s 自动跳转（单步直达，264 页重生成）；`c605519`（h）深链跳过开场动效；`31a61d3`（g）编辑端双推/Unicode 查重/吸收抑制/自愈；代码线 `aaf757b`/`73bd01c`
- **线上**：release = 264 题数据 + `20260829i`；main 镜像对齐；smoke-test 26/26；编辑端双推与自愈已在真实使用中验证；分享页单步直达 + 读完引导条已上线
- **扩充流水线注意**：自动化「题库定期自动扩充」**每天 10:00** 跑（08-29 起从每周一/三/五提频），**工作目录在 `C:\Users\Life\Desktop\iti-dedup2`**（独立副本，只 curl 同步数据不同步代码——改 tools/ 下脚本后必须手动同步过去）；脚本内已带质检闸门（答案<30字/图片缺失拒绝）+ 经典主题轮转（classic-topics.json，T001 云服务售后已跑）+ 分享页自动跟发（待推清单 `tools/.last-new-ids.json`，已 gitignore）；**合并基线读线上 release（is-a.dev 的 published.json），勿参考 main**；**FP 必读题常备任务（08-30 起）**：每轮先 curl 同步数据再跑 `node tools/fp-coverage.js --limit 5`，为题量最大的 1~2 个缺口分类各补 4 题成套（诞生/本质/边界/演化，tags 带「第一性原理」「必读」，批次命名 YYYY-MM-DD-fp.json）再走常规扩充——新增技术分支当周内自动获得必读题；指令已写入自动化 memory；Python 用 WorkBuddy 自带的 `binaries\python\versions\3.13.12`（3.11.4 已卸载），备选 uv 的 3.12.13
- **后端当前状态**：Worker `it-interview-stats` 已部署（D1 表齐全：users/sessions/favorites/histories/weak/daily_done/mock_reports + rl_auth 限流表），API `https://it-interview-stats.iti-interview.workers.dev`；已加 CORS 白名单/500 防泄漏/ADMIN_EMAIL secret（admin@iti.local）
- **已上线功能**：题库浏览/搜索/刷题/收藏/错题本（间隔复习）/模拟面试（报告云端+历次趋势）/学习周报/每日打卡上云/PWA 离线（第三方库已本地化，真离线可用）/无障碍/题目分享卡片（canvas 图片 + 264 个内容化 SEO 落地页（单步直达 + 读完引导条）+ 微信长按适配/技术全景图（19 域人工架构图 + 自动分支树，薄弱标记）/第一性原理必读题（19 域置顶 4 题））/sendBeacon 兜底同步/图片外置上传
- **进行中/待办**：
  - ~~P1：登录时顺手清理过期会话~~（已完成：worker.js handleLogin 内 DELETE 过期会话，线上已生效）
  - ~~P1：编辑端/流水线数据互踩修复~~（已完成 `31a61d3`：题库发布双推 release+main；absorbRemote 吸收期设 C._suppress；main 已镜像对齐 release，编辑端经 absorbNormVer 自愈到 264）
  - ~~P1：`cloud.js` `absorbRemote` 的 `norm` 中文标题查重失效~~（已完成 `31a61d3`：改 Unicode 感知 `/[\s\p{P}\p{S}_]+/gu` 保留 CJK；absorbNormVer 自愈重放已铺开）
  - P1：eu.org 自有域名审核中（automation 每天 10:00 检查）
  - P1：题目数据修补（体检报告：缺题干 10 题 #211~#233、未分类 3 题 #229/#233/#239、瘦分类 33 个——在管理端补数据后重新发布导出）
  - P2：题目查重机制仅覆盖 Excel/CSV 批量导入，手动新增与 AI 生成无查重（可用 data-audit.js 重复标题检查兜底）
  - P2：ima 知识库订阅内容作为题库数据源的探索
  - P2：可访问性补齐（卡片内图标按钮 aria-label）
  - P3：app.js 209KB 巨石渐进拆 ES modules（先有 smoke-test 兜底再动）
