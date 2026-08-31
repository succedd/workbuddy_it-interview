# HANDOVER — 开发交接卡

> 本文件供 AI 编码工具（zcode 等）无缝接入开发使用。
> **维护规则：在 WorkBuddy 内每次完成开发/部署后，必须同步刷新第 6 节「当前状态」并更新时间戳，同时在 README.md「更新日志」顶部追加本次变更（时间逆序，含缓存版本号）；同一天的变更合并在同一天条目下，不单开新日期标题。用户可见功能有变化时，还必须同步更新站内「使用指南」（app.js 的 pageHelp 函数，#/help 路由），并更新指南底部的「文档最近更新」日期。**

## 1. 仓库与分支

- 仓库：`https://github.com/succedd/workbuddy_it-interview.git`（GitHub 账号 `succedd`）
- 本地路径（WorkBuddy 侧）：`C:/Users/Life/WorkBuddy/2026-08-24-14-31-52/workbuddy_it-interview`
- **分支模型（部署安全铁律，2026-08-31 修正）：**
  - ⚠️ **实测修正：GitHub Pages 发布源实际是 `main`**（08-31 验证：线上 index.html 版本号与 main 一致、release 当时落后一个版本）——**发版必须 main 与 release 都推**，线上验收以 main 为准
  - `release` = 开发基线分支（每日扩充流水线的合并基线读它），所有提交推它
  - 推 release **必须 fast-forward**：push 前 `git ls-remote origin release` 核对线上 tip；若历史分叉，禁止 force push，必须把新代码移植到线上基线之上再推
  - main 若与本地分叉（浏览器端备份/发布经 GitHub API 直推 main 会产生本地没有的提交），**优先 `git merge origin/main` 吸收后再推**，不要盲目 force
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

- **最后更新**：2026-08-31 16:40
- **最新 commit（本地 `restore-features` `5830b1c`，已双推 release+main）**：**sitemap.xml 格式修复**：`tools/gen-share-pages.js` 生成 sitemap 时模板串误写 `\\n`（转义成字面反斜杠+n），整份 sitemap 被写成单行、2073 个字面 `\n`，且只到 q/340（新题 341–346 漏收）；修复 = 改用 `NL = "\n"` 变量拼真换行并重跑生成，现 351 条、XML 可解析、`ElementTree` 校验通过，已随 `gen-share-pages.js` / `.gitignore` 一并双推。**同步确认今日自动扩充成功**：批次 `2026-08-31-a`、经典主题 **T002 云监控告警响应与故障定位** +6 题（id 341–346，10:48 落库），分享页 6 个全部 200 且含 `application/ld+json`，追问链 relatedIds 已互串，README 自动扩充记录已追加，线上 346 题；经典主题进度 2/70。上一条（x）：**「再面一次」按钮修复**：hash 路由盲区——面试报告页本就渲染在 #/mock 下，「再面一次」链接 href="#/mock" 点击后 hash 无变化不触发 hashchange，路由不重渲染等于没点（刷题「再来一轮」等同病）；修复 = init() 里加全局 click 委托，点击目标 hash 与当前 hash 相同的站内 a[href^="#/"] 时补一次与 hashchange 一致的重渲染（renderTopbar+route；setMain 自带回顶）。上一条（w）：**自动备份死循环修复**：备份完成写 backupAt 时间戳被自家 settings 表钩子当成数据变化，12 秒后再次备份无限循环（main 曾 10 分钟 6 笔纯备份提交、每次弹 toast）；修复 = backupAt 写入时 `B._suppress++` 压制钩子 + 自动备份成功不再弹 toast（徽章已有状态）+ 去掉题库发布内置的显式备份调用（cloudSyncedAt 落库后钩子自动接手，此前同一次改动会备两遍）+ 备份文件双推 release+main（此前只写 main，恢复端从 Pages 发布分支拉取，分支不一致会 404/过期）。**⚠️ 重要漂移发现：GitHub Pages 实际发布源是 main 不是 release**（08-31 证实：线上 index.html 版本号与 main 一致、release 落后一个版本；但题库数据双分支仍保持一致）——推代码必须 main 和 release 都推。上一条（v）：**使用指南打不开修复**（guide.js 补 setMain/$/$$ 闭包依赖）。上一条（u）：**批量优化**——sitemap 自动化+题目报错按钮+周报历史归档+题库缓存策略+guide.js 模块化第一刀+数据还债
- **线上**：main（Pages 实际发布源）= release = **358 题**数据 + 经典主题进度 **3/70**（T001 华为云、T002 华为云、T003 腾讯云、T007 Java 均完成）；sitemap.xml 363 条（含 353–358）；**取题策略已改为按域轮转**（enrich_questions.py `--topic-next`）：13 个技术域轮流取题，云（公有云售后）只占 1/13，约每 4–5 天轮到一次，解决此前云题扎堆问题；smoke-test 26/26
- **本地 git 分支现状（08-31 记录）**：本地仅有 `restore-features` 分支（tip `5830b1c`），与线上 `release`/`main`（`ba00d12`）**已分叉**；自动扩充流水线用 `--push`（Contents API）直接提交到线上 tip，本地 commit 不 push，故两边 hash 不同属常态。**后续改动 tools/ 或根目录文件时，务必沿用 Contents API 双推 release+main，禁止 force push**
- **扩充流水线注意**：自动化「题库定期自动扩充」**每天 10:00** 跑（08-29 起从每周一/三/五提频），**工作目录在 `C:\Users\Life\Desktop\iti-dedup2`**；⚠️ **自动化运行时会先 `curl` 把 `enrich_questions.py`/`gen-share-pages.js`/`classic-topics.json`/`intake-plan.md` 从线上 release 覆盖回本地**——故改了 `tools/` 下脚本后**必须 Contents API 双推 release+main，否则下次自动跑会用回旧脚本**；取题改为**按域轮转**（`--topic-next` 读 `tools/.topic_rotation.json` 记上一轮域，跨进程/跨天延续；无状态文件时从最近完成域之后起步）；脚本内已带三道质检闸门（来源 URL 可达性 / 答案结构 / 每周抽检）+ 分享页自动跟发（`tools/.last-new-ids.json`，已 gitignore）；**合并基线读线上 release（is-a.dev 的 published.json），勿参考 main**；**FP 必读题常备任务（08-30 起）**：每轮先 curl 同步数据再跑 `node tools/fp-coverage.js --limit 5`，为题量最大的 1~2 个缺口分类各补 4 题成套（诞生/本质/边界/演化，tags 带「第一性原理」「必读」，批次命名 YYYY-MM-DD-fp.json）再走常规扩充——新增技术分支当周内自动获得必读题；指令已写入自动化 memory；Python 用 WorkBuddy 自带的 `binaries\python\versions\3.13.12`（3.11.4 已卸载），备选 uv 的 3.12.13
- **后端当前状态**：Worker `it-interview-stats` 已部署（D1 表齐全：users/sessions/favorites/histories/weak/daily_done/mock_reports + rl_auth 限流表），API `https://it-interview-stats.iti-interview.workers.dev`；已加 CORS 白名单/500 防泄漏/ADMIN_EMAIL secret（admin@iti.local）
- **已上线功能**：题库浏览/搜索/刷题/收藏/错题本（间隔复习）/模拟面试（报告云端+历次趋势）/学习周报/每日打卡上云/PWA 离线（第三方库已本地化，真离线可用）/无障碍/题目分享卡片（canvas 图片 + 264 个内容化 SEO 落地页（单步直达 + 读完引导条）+ 微信长按适配/技术全景图（19 域人工架构图 + 自动分支树，薄弱标记）/第一性原理必读题（19 域置顶 4 题）/学习周报三件套（热力图+彩带+分享图））/sendBeacon 兜底同步/图片外置上传
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
