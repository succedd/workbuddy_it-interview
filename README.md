# IT 面试题库管理系统

[![Site](https://img.shields.io/badge/在线访问-it--interview.is--a.dev-2563EB)](https://it-interview.is-a.dev)
[![GitHub](https://img.shields.io/badge/GitHub-succedd/workbuddy__it--interview-181717?logo=github)](https://github.com/succedd/workbuddy_it-interview)

纯静态、无后端的 IT 各岗位面试题库管理与刷题平台。前端全部使用原生 HTML/CSS/JS 实现，数据默认存在浏览器 IndexedDB 中；题库快照通过 GitHub Pages 分发，支持"访客自动同步云端题库 + 管理员一键发布到 GitHub"。

## 主要功能

### 访客端
- **首页仪表盘**：展示技术体系、岗位体系、面试路线、最近更新等快捷入口。
- **技术体系**：279 个分类的树状目录，支持按分类浏览题目。
- **岗位体系**：141 个岗位、146 条岗位技术栈，支持按岗位查看对应技能与题目。
- **题目详情**：Markdown 渲染答案 + 代码高亮，支持收藏、浏览计数、相关题推荐。
- **搜索**：全局搜索题目、技术、岗位、标签。
- **刷题模式**：`#/practice` 按分类/岗位/收藏随机抽题。
- **模拟面试**：`#/mock` 模拟真实面试流程抽题。
- **收藏与历史**：本地保存个人收藏与浏览历史。
- **暗色/亮色/跟随系统**主题切换。

### 管理端
> 管理员密码与权限只保存在**当前浏览器本地**，不会同步到云端。换一台设备需要重新设置。

- **管理员登录/首次设置密码**：基于 Web Crypto PBKDF2 哈希，登录态保存在 `sessionStorage`。
- **仪表盘**：题目数量、分类分布、岗位覆盖、访问统计等图表。
- **题目管理**：增删改查题目，字段包含标题、题干、答案、难度、题型、分类、适用岗位、工作年限、标签。
- **标题查重提示**：新增/编辑题目保存时、AI 批量入库前，自动按**标题规范化匹配**（忽略大小写、空白与全半角标点）扫描既有题库与本批次，发现疑似重复即弹窗列出冲突题目（ID、标题、状态），确认后才入库——只提示不拦截，避免误存重复题。
- **编辑器支持直接粘贴图片**：在「题目正文」「参考答案」编辑框中直接 `Ctrl/Cmd+V` 粘贴截图，自动压缩（长边 ≤1400px、JPEG 质量 0.85，超 500KB 自动降档重压）并以 Markdown 图片（data URL）插入光标处，右侧预览即时可见；图片随题目保存，并随题库发布到 `data/published.json`，所有访客可见。单图压缩后上限 500KB，超限会提示。Markdown 内容区图片自适应（`max-width:100%`）。
- **分类管理**：维护技术分类树。
- **岗位管理**：维护岗位体系与岗位方向。
- **AI 出题**：可配置 OpenAI API Key，通过大模型按分类/岗位/难度批量生成题目。
- **批量导入**：支持 JSON / Excel 导入题库。
- **备份恢复**：导出/导入完整本地题库 JSON。
- **系统设置**：
  - 配置 GitHub 发布 Token、仓库、分支；
  - 配置 Cloudflare Worker 访问统计接口；
  - 配置 AI 服务地址、模型与 API Key；
  - 手动同步云端题库。

### 云端共享题库
- 云端主库：`data/published.json`，随 GitHub Pages 一起发布。
- **访客**：首次打开自动拉取云端题库并覆盖本地种子数据；之后若云端有更新自动同步。
- **编辑端**：在管理后台配置了 GitHub 发布 Token 的浏览器被视为编辑端，本地数据不会自动被云端覆盖；编辑完成后点"发布"即可把本地题库推送到 GitHub 仓库，所有访客下一次打开自动获取最新题库。
- **自动发布**（v20260824a）：编辑端开启后（默认开启），题目/分类/岗位的任何增删改（含 AI 出题、批量导入）停止 10 秒后自动推送到 GitHub，顶栏徽章实时显示「未发布 / 发布中 / 已同步 / 失败」状态，失败自动重试；关闭页面前若有未发布改动会弹出提醒。
- **本地数据加密云备份**（v20260825a）：设置页可配置备份密码，把只存本机的数据（发布 Token、AI 配置与 Key、管理员密码、统计配置、收藏、浏览历史）以 AES-256-GCM（PBKDF2-SHA256 派生密钥，**迭代次数 600,000**）加密后备份到 `data/local-backup.json`（公开仓库上只有密文），随每次自动发布同步更新；清缓存/换设备后凭备份密码一键恢复。密文 payload 内含 `iter` 字段记录派生迭代次数，旧备份（无 `iter`、按 150,000 回退）仍可正常解密，升级不破坏历史备份。
- **数据保护**：本机已有历史数据但从未同步过的用户，不会自动覆盖，会提示手动同步（避免误删个人数据）。

### Token 安全（发布 PAT 最小权限原则）
- **代码实际用到的 API 只有一个**：GitHub Contents API 的 `GET`（取文件 sha 做乐观锁）和 `PUT`（写入 `data/published.json` / `data/local-backup.json`），无任何 DELETE 或跨仓库操作。
- **推荐 Token 配置**（Fine-grained PAT）：
  - Repository access：**Only select repositories** → 只选 `workbuddy_it-interview`
  - Repository permissions：只开 **Contents: Read and Write**，其余（Administration / Issues / PR / Workflows 等）一律 No access
  - 过期时间建议 ≤ 90 天，到期前到 GitHub Settings → Developer settings → Personal access tokens 轮换
- **切勿用 Classic PAT（带 `repo` scope）充当发布 Token**：Classic PAT 的 `repo` scope 对**所有仓库**都有完整读写权限，一旦泄露（如备份密码被破解）风险范围远超本仓库。创建入口：<https://github.com/settings/personal-access-tokens/new>
- **泄露影响评估**：即使 Fine-grained PAT 泄露，攻击者也只能改本仓库的题库内容（`data/*.json`），碰不到你其他仓库、也拿不到仓库 Settings/Administration 权限。

### 统计
- **百度统计**：`index.html` 内联百度统计代码，Tracking ID 为 `856d2b08330e4b9f225cf101d6f14103`。
- **Cloudflare Worker 访问统计**（可选）：
  - 接口：`/visit`、`/view?id=123`、`/stats`
  - 功能：全局访问计数、当日访问、访客国家地理分布、热门城市、热门题目。
  - 代码在 `cloudflare/worker.js`，需绑定 KV `STATS`。
  - 前端对接已就绪（设置页「Cloudflare Worker」填接口地址即启用）；**部署步骤见 [`cloudflare/部署指南.md`](cloudflare/部署指南.md)**。

## 题库自动扩充（定期取材）

为解决「题量偏少、人工补充慢」的问题，项目内置一套**定期自动扩充流水线**：按轮转计划从权威来源取材、整理成无错误的结构化面试题，自动合并进 `data/published.json` 并发布到线上。

- **取材来源白名单**：仅限 CS-Notes、JavaGuide、小林coding、各技术官方文档等权威、可溯源站点（`tools/intake-plan.md`），每题必须带真实 `source` URL，**禁止无出处编造**。
- **轮转计划**：21 个顶层技术域按周轮换（`ISO 周号 % 21`），优先填满 235 个空叶子分类，再对已有分类做深度补充；每批 6–10 题，难度初中高搭配。
- **合并引擎 `tools/enrich_questions.py`**：
  - 批次文件用「分类名 / 岗位名」引用，脚本自动解析为 `categoryId` / `positionIds`；名字写错会给出近似建议并跳过该题，不会脏写；
  - 严格字段校验 + 按归一化标题（去空白/小写/全半角标点）去重，保证「整理无错误」；
  - ID 顺序自增（`max(id)+1`），不与现有题目冲突；
  - 支持 `--dry` 只校验不落盘、`--all` 批量处理、`--push` 通过 GitHub Contents API（与线上编辑端同源）推到 Pages 源分支（`release,main` 双写）。
- **定期自动化**：WorkBuddy 定时任务「题库定期自动扩充」每周一 10:00 运行——下载线上最新题库 → 按轮转表联网取材 → 写批次 → 校验合并 → 提交并发布（配置 `GH_PUBLISH_TOKEN` 环境变量后自动推送到 `main`/`release`）。
- **手动运行**：`python tools/enrich_questions.py tools/batches/2026-08-27-a.json`

> 说明：流水线只改动 `data/published.json`；真正的「发布到线上」由 GitHub Pages（源分支 `main`）分发，访客下次打开即见新题。若未配置 `GH_PUBLISH_TOKEN` 且无 git 凭据，自动化会保留本地提交并提示手动推送 / 用编辑器发布。

### 自动扩充记录

| 日期 | 批号 | 技术域 | 新增题数 |
|------|------|--------|----------|
| 2026-08-27 | 2026-08-27-a | 分布式 / 数据库 / 网络 / 设计模式 | +10 |

## 部署与自定义域名

- **托管**：本站为纯静态站点，托管于 **GitHub Pages**（仓库 `succedd/workbuddy_it-interview` 的 `main` 分支）；推送到 `main` 即触发 Pages 重新构建发布，约 1 分钟全站生效。
- **自定义域名（非跳转）**：线上域名为 `it-interview.is-a.dev`，是 GitHub Pages 的**自定义域名**（在仓库 Settings → Pages 中配置），**并非跳转到 `github.io`**——浏览器地址栏始终显示 `it-interview.is-a.dev`，内容由 GitHub 直接以该域名返回。仓库根目录 `CNAME` 文件声明该域名，DNS 层 `it-interview.is-a.dev` CNAME 指向 `succedd.github.io`。
- **CDN 分发**：GitHub Pages 内容经 **Fastly 全球边缘节点**分发（响应头 `X-Fastly-Request-ID` / `Via: varnish` 为证），访客就近访问、不回源；云端题库 `data/published.json` 同样走 CDN，并带 `Cache-Control: max-age=600`（边缘缓存 10 分钟）。
- **域名来源**：`is-a.dev` 为免费域名服务申请的子域名。

### 部署 Cloudflare Worker（可选·访问统计）
- 仓库 `cloudflare/` 目录含 `worker.js`（统计后端）+ `wrangler.toml`（配置模板，KV id 待填）+ **[`部署指南.md`](cloudflare/部署指南.md)**。
- 概览：注册 Cloudflare 免费账号 → 本机 `wrangler login` → `wrangler kv namespace create STATS` 建 KV → 把 id 填进 `wrangler.toml` → `wrangler deploy` → 把 `*.workers.dev` 地址填进站点设置页即生效。
- 该 Worker 与百度统计并存：百度统计负责地域/来源/趋势，Worker 额外提供「全站累计访问数」与「跨访客热门题目榜」。
- 免费额度足够（Worker 10 万请求/天、KV 10 万读/1 千写/天）。

## 项目结构

```
.
├── index.html              # 入口页（百度统计、资源引用、加载动效）
├── CNAME                   # 自定义域名 it-interview.is-a.dev
├── data/
│   ├── seed.js             # 种子数据：分类树、岗位、岗位技能、示例题
│   └── published.json      # 云端题库快照（GitHub Pages 分发）
├── js/
│   ├── app.js              # 路由、顶部栏、侧边栏、全部页面渲染
│   ├── auth.js             # 管理员密码哈希与登录态
│   ├── db.js               # IndexedDB 封装（Dexie）与种子写入
│   ├── cloud.js            # 云端同步 + 发布/自动发布到 GitHub
│   ├── backup.js           # 本地数据 AES-256-GCM 加密云备份/恢复
│   ├── search.js           # 搜索与 Fuse.js 索引
│   ├── services.js         # 题目/岗位/分类的 CRUD 服务层
│   ├── api.js              # AI 接口调用与流式输出
│   ├── aiprompts.js        # AI 出题 Prompt 模板
│   ├── importexport.js     # JSON/Excel 导入导出
│   └── utils.js            # 通用工具函数与图标
├── css/                    # 样式文件
├── tools/
│   ├── gen-published.js    # 由 seed.js 生成初始 published.json
│   ├── enrich_questions.py # 题库自动扩充流水线：校验/去重/归并批次到 published.json
│   ├── coverage_report.py  # 覆盖度统计：各技术域题量、空叶子分类 → tools/coverage.md
│   ├── intake-plan.md      # 取材来源白名单 + 21 域轮转表（驱动定期自动化）
│   └── batches/            # 各批次题目 JSON（YYYY-MM-DD-a.json）
└── cloudflare/
    ├── worker.js           # 访问统计 Cloudflare Worker
    └── wrangler.toml       # Wrangler 配置示例
```

## 快速开始

### 1. 本地预览
本项目是纯静态站点，无需构建：

```bash
# 方式一：直接打开 index.html

# 方式二：用任意静态服务器
npx serve .
```

### 2. 初始化管理员
首次进入管理页（`#/admin/dashboard`）会提示设置管理员密码。密码经 PBKDF2 哈希后存在浏览器 IndexedDB，**不会上传到任何服务器**。

### 3. 配置 AI 出题（可选）
进入 `#/admin/settings`：
- 设置 OpenAI 兼容的 API 地址、模型名、API Key。
- 之后可在 `#/admin/ai` 按分类/岗位/难度生成题目。

### 4. 配置云端发布（可选）
如果你是题库维护者，进入 `#/admin/settings`：
- 填入 GitHub Personal Access Token（推荐 Fine-grained PAT，仅授权本仓库 Contents 读写，详见上方「Token 安全」）。
- 仓库默认 `succedd/workbuddy_it-interview`，分支默认 `main`。
- 本地编辑后点击"发布"即可推送 `data/published.json` 到 GitHub。

### 5. 生成新的 published.json
如果 `data/seed.js` 有改动，执行：

```bash
node tools/gen-published.js
```

生成后的 `data/published.json` 可手动提交，也可通过管理后台发布。

## 重要说明：别人访问网站也需要设置管理员密码吗？

**不需要。**

- 管理员密码是**本地功能**，只控制当前浏览器能否进入管理后台。
- 普通访客打开网站后，只要第一次拉取到云端 `data/published.json`，就能直接浏览 200+ 道题、搜索、刷题、收藏。
- 每个浏览器都有自己独立的管理员密码（以及收藏、历史等个人数据），互不影响。
- 只有当你想"编辑题库并发布到 GitHub"时，才需要配置 GitHub Token（这个 Token 也只存在当前浏览器 localStorage）。

## 更新日志

### 2026-08-24

- feat: 自动发布——编辑端题目/分类/岗位增删改（含 AI 出题、批量导入，经 Dexie 表钩子全路径监听）停止 10 秒后自动推送 GitHub，失败自动重试，关页前未发布提醒，顶栏新增状态徽章（可关闭）。
- feat: 本地数据加密云备份——新增 `js/backup.js`，发布 Token、AI 配置、管理员密码、统计配置、收藏、历史经 AES-256-GCM（PBKDF2 派生密钥）加密后备份到 `data/local-backup.json`，设置页支持设置备份密码、立即备份、凭密码一键恢复。
- refactor: `cloud.js` 抽出通用 `putFile` 上传助手供题库发布与加密备份共用。

### 2026-08-25
- feat: 新增**标题查重提示**——手动新增/编辑题目保存时、AI 生成批量入库前，按标题规范化匹配（去空白、转小写、全半角标点归一化）扫描既有题库与本批次，命中即弹确认框列出冲突题目（ID / 标题 / 状态），取消可中止保存，仅提示不强制拦截（`js/app.js` 新增 `normTitleKey / findTitleDups / confirmTitleDups`）。批量导入（Excel/CSV）原有查重策略不变。
- feat: 题目编辑器（题目正文 / 参考答案）支持**直接粘贴图片**——`Ctrl/Cmd+V` 粘贴剪贴板截图，自动压缩为 JPEG data URL（长边 ≤1400px、质量 0.85，超 500KB 自动降档），以 Markdown 图片插入光标处并即时预览；图片随题目保存、随题库发布同步到云端，所有访客可见。新增 `.md img` 自适应样式防止大图撑破布局（`js/app.js` + `css/style.css`）。
- security: 加密备份密钥派生 PBKDF2-SHA256 迭代次数由 150,000 提升至 600,000（`js/backup.js` v20260825a）；`deriveKey` 新增 `iterations` 参数，加密 payload 写入 `iter` 字段、解密按 `payload.iter` 读取（缺失回退 150,000），保证仓库内既有旧备份向后兼容、升级不会导致历史备份无法解密。
- docs: README 新增「Token 安全（发布 PAT 最小权限原则）」章节——代码实际仅调用 Contents API（GET sha + PUT 文件），推荐 Fine-grained PAT 只限本仓库 + Contents 读写，明确禁用 Classic PAT（`repo` scope 全仓库可写）作为发布 Token，附泄露影响评估与轮换建议。
- docs: 新增「部署与自定义域名」章节，说明站点托管于 GitHub Pages（`main` 分支）、`it-interview.is-a.dev` 为自定义域名（CNAME 指向 `succedd.github.io`、非跳转）、内容经 Fastly CDN 分发、域名来自 is-a.dev 免费服务。
- docs: 新增 `cloudflare/部署指南.md`（注册 Cloudflare → 建 KV → deploy → 前端接入全流程），README 统计与部署章节同步指向。

### 2026-08-27
- feat: **题库定期自动扩充流水线**——新增 `tools/enrich_questions.py`（批次校验 / 标题去重 / 分类·岗位名自动解析为 ID / 顺序 ID 自增 / `--dry`·`--all`·`--push` 推送 Pages 分支）、`tools/intake-plan.md`（权威来源白名单 + 21 域周轮换表）、`tools/batches/` 批次目录；首批 `2026-08-27-a.json` 入库 10 题（CAP/索引/三次握手/单例/HTTP 缓存/微服务/消息队列/事务隔离/进程线程/一致性哈希），题库总数 239 → 249。
- feat: **定期自动化「题库定期自动扩充」**——按轮转表联网取材、合并、发布，实现用户提出的「定期自动抓取权威面试题并归档到各类别及岗位」。
- feat: **扩充流水线增强**——① 合并时自动递增 `published.json` 的 `version`/`publishedAt`，前端与编辑端可感知云端更新；② 模糊去重：归一化标题相似度 ≥0.85 判为疑似重复直接跳过，杜绝跨批次近似题；③ 新增 `tools/coverage_report.py` 覆盖度报告（各域题量、空叶子分类统计 → `tools/coverage.md`）；④ 自动化频率提升至每周一/三/五 10:00 三次，取材前参考覆盖度优先补空置分类。
- fix: **云端同步不拉新**——`fetchRemote` 版本校验从 `===1` 放宽为正整数（兼容流水线递增 version）；线上快照补递增 `version`/`publishedAt` 触发全量访客重新同步。
- feat: **编辑端自动增量吸收云端新题**——启动时自动拉云端快照，按 id + 标题归一化双重去重只追加本机缺失的题目/分类/岗位（不改动本地已有内容与收藏记录），同一快照只吸收一次；管理员无需再到设置页手动「从云端拉取」。手动全量覆盖按钮保留。
- feat: **Cloudflare Worker 访问统计上线并默认接入**——部署 `it-interview-stats`（KV 绑定 STATS）至 `https://it-interview-stats.iti-interview.workers.dev`，提供全局访问计数、当日访问、访客国家/城市分布、热门题目榜；前端 Stats 模块内置该地址（开箱即用，管理员仍可在系统设置覆盖），首页访问与题目浏览自动上报，管理后台仪表盘显示地域分布饼图。
- feat: **用户帐号系统（D1）**——新增 D1 数据库 `it-interview-users` 绑定 Worker（binding `USERS`）：开放注册/登录/退出（PBKDF2-SHA256 10 万次迭代加盐哈希，Bearer token 会话 30 天，IP 限流防刷，首个注册用户自动成为管理员）；个人数据云同步——收藏、刷题历史、错题本按用户存储，登录自动合并云端与本机数据，换设备登录即恢复；顶部栏「登录」入口 → `#/account`；**管理员帐号管理页** `#/admin/users`：用户列表/搜索、禁用（即时踢下线）/启用、重置密码。密码字段永不返回前端。
- fix: **恢复被帐号系统部署覆盖丢失的功能**（`55a15ec`，基于线上 release 基线 `b1aa1ba` 移植）：
  - **今日 5 题**——首页卡片按日期确定性抽样（FNV-1a + mulberry32）当天固定 5 题、次日自动更换，完成打勾、进度 x/5；
  - **随机一题**——侧边栏入口 + 首页 Hero「随机一题」按钮（`#/random` 随机跳转已发布题目）；
  - **错题重练**——新增 `#/review` 页面，汇总练习中标记「不会 / 不熟悉」的题目，支持「会了 / 移出错题本」，侧边栏显示待练数量角标；
  - **最近搜索下拉**——顶栏全局搜索、首页 Hero 搜索、题目列表筛选框聚焦时展示最近搜索（可删单条/清空）或热门搜索词，回车自动记入历史（localStorage `search_history`，上限 10 条）;
  - **搜索无结果建议**——题目列表空态显示「没有匹配的题目：xxx」+ 热门关键词一键重搜按钮；
  - **学习打卡热力图 & 继续上次**——首页基于本地统计渲染近 35 天打卡热力图与连续天数；详情页浏览自动记录「继续上次」恢复入口。

### 2026-08-23
- `5ef58ec` analytics: 百度统计切换为 it-interview.is-a.dev 新站点 Tracking ID `856d2b...`。
- `333a3c3` restore: 从旧浏览器 IndexedDB WAL 抢救恢复 126 道历史题目，题库总数 225 道。
- `6fb7f71` 恢复 CNAME：旧浏览器数据导出完成，正式域名重新上线。
- `37b0a2d` 添加 CNAME 文件，绑定正式域名 `it-interview.is-a.dev`。

### 2026-08-22
- `a51d7f5` feat: 云端共享题库——访客自动同步 + 管理员一键发布到 GitHub。
- `0fa80d2` feat: 集成百度统计。
- `8a0af25` feat: 接入 Cloudflare Worker 访客统计，支持实时人数、地理分布、题目热度。
- `a756d93` feat: 首次进入加载动效（进度条 + 代码雨 + IT 岗位名飘动）。
- `6e47a4e` feat: 编辑题目技术分类改为可搜索组合框。
- `1f210de` feat: 岗位支持细分方向（direction）。
- `172f920` feat: 岗位与分类/题目关联改造。
- 大量 AI 出题体验优化：实时日志、进度动画、生成提速、JSON 解析健壮化、取消按钮等。

### 2026-08-21
- `3c7c807` feat: IT 面试题库管理系统纯静态站点完整实现。

## 技术栈

- 原生 HTML5 / CSS3 / ES6+（无框架）
- [Dexie.js](https://dexie.org/)：IndexedDB 封装
- [marked](https://marked.js.org/)：Markdown 渲染
- [highlight.js](https://highlightjs.org/)：代码高亮
- [Fuse.js](https://fusejs.io/)：模糊搜索
- [ECharts](https://echarts.apache.org/)：图表
- [SheetJS](https://sheetjs.com/)：Excel 导入导出
- GitHub Pages + GitHub Contents API：静态托管与题库发布
- Cloudflare Workers + KV：可选访问统计后端

## 许可证

MIT License — 开源可自由使用与修改。
