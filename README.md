# IT 面试题库管理系统

[![Site](https://img.shields.io/badge/在线访问-itinterview.com.cn-2563EB)](https://itinterview.com.cn)
[![GitHub](https://img.shields.io/badge/GitHub-succedd/workbuddy__it--interview-181717?logo=github)](https://github.com/succedd/workbuddy_it-interview)

纯静态、无后端的 IT 各岗位面试题库管理与刷题平台。前端全部使用原生 HTML/CSS/JS 实现，数据默认存在浏览器 IndexedDB 中；题库快照由 Cloudflare Pages 分发（源文件托管在 GitHub），支持"访客自动同步云端题库 + 管理员一键发布到 GitHub"。

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
- **题库全景图**（`v20260831a`）：首页 4 个统计卡片（技术分类 / 题目总数 / 覆盖岗位 / AI 生成题）均可点击进入 `#/panorama`，像思维导图一样展开全库结构，点击任意节点直达对应题目：
  - **题库全景**：ECharts 旭日图，圆环面积 = 题目数量。内圈 21 个一级技术体系，外圈为细分技术点；直接挂在体系下的题目归为「综合题」，尚未归类的题目单列「未归类」环，环上题数合计与「题目总数」严格一致。
  - **技术分类**：276 个分类的可折叠树（一级默认展开），支持「只看有题目的分类」过滤，点击节点进入该分类（含子分类）题目列表。
  - **覆盖岗位**：142 个岗位按「时代阶段 → 岗位族 → 具体岗位」三级展开，每行显示题目数，点岗位进岗位题库；与分类同名的占位岗位灰显不可点。
  - **AI 生成题**：全库题目来源构成条形图（AI / 人工 / 种子 / 原理整理 / 外部文档 / 其他，可点击筛选）+ AI 生成题按技术分类归组的完整清单。
- **岗位刷题计划**（`v20260913a`，原名「学习路线图」，`v20260915a` 改名）：把某个岗位已关联的题目**按技术分类聚合成 4–8 周的学习计划**，解决「142 个岗位、1000+ 道题，不知道该从哪开始、学到哪算完」的问题。入口 `#/roadmap`（侧栏「刷题计划」）：
  - **周计划怎么生成**：按分类分组 → 按题量做贪心装箱（每周题量尽量拉平，实测线上 8 周为 34/37/35/35/35/37/37/36 题）→ 周内按平均难度由浅入深排序。单个超大分类会按周容量切成「（续 N）」多段，避免一个巨型分类独占好几周、把其它分类全挤到最后。题少的岗位保底 4 周（29 题 → 4 周）。
  - **每周卡片**：主题名、题量、预计时长（每题 ≈6 分钟）、按 7 天分摊的每日题量、分类标签（超过 8 个折叠为计数）、难度分布、进度条。展开后是题目清单，行首圆圈可直接勾「已掌握」，点标题进详情页。题目行**按需渲染**（只渲染展开的那一周），286 题的大岗位首屏也不卡。
  - **进度怎么记**：写入 IndexedDB `settings` 表的 `roadmapMastered`，是一个**扁平集合** `{题号: 时间戳}` —— 同一道题属于多个岗位时自动对所有路线图生效，不需要按岗位分别记、也不会在岗位被删后留下孤儿数据。随个人加密云备份与账号同步走，换设备不丢。在「刷题练习」里点「已掌握」也会自动回写路线图进度。
  - **从计划直接开练**：`#/practice?scope=roadmap&pos=<岗位 id>&week=<周次>`，题池由 `js/roadmap.js` 统一计算，与计划页**完全同源**（不会出现「计划说这周 33 题、练习里只有 12 题」的错位）；在练习页切难度/模式时会保留岗位与周次，并显示「来自 XX 刷题计划第 N 周」的上下文与返回入口。
  - 只列出**题量 ≥20 道**且不是「与分类同名」的占位岗位，当前 **39 个岗位**可生成路线图；其余岗位仍可在岗位体系里正常浏览。
- **关于本站**（`v20260913b`）：`#/about`。站点与站长介绍、联系入口（微信 / 公众号二维码，二维码图片 `assets/qrcode-yueji-shuyu.png`）、题库实时统计（题目数 / 技术体系数 / 岗位数 / 最近更新时间全部从 `Services` 实时读取，每日扩充跑完自动更新，**无需手动维护**）。侧栏与页脚均有入口。
- **投稿题目**（`v20260919f`，入口在侧栏搜索框下方第一项）：`#/submit`。注册登录后即可向题库投稿题目，**必须先登录**。提交链路：每帐号每日 5 条限额 → IP 限流 → 本地预筛（格式类，不判内容）→ **服务端 AI 质检**（DeepSeek，判「是否属于本站技术体系」+ 质量打分）→ 进入人工审核队列。与 IT 无关的内容累计 **3 次**则帐号永久禁用；质量/重复的判读只作参考、**不计违规**，最终由人工定夺。「我的投稿」页（`#/me/submissions`）可随时看自己的投稿状态与剩余机会。提交前会在浏览器本地做一次标题查重（二元组 Dice 相似度），把疑似重复的既有题目一并交给 AI 参考。
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
- **用户投稿审核**（`v20260919f`）：`#/admin/submissions`。管理员与「专家」角色可审投稿 —— 抢单式认领（乐观锁，被抢会提示）、**不能审自己提交的题**、30 分钟未处理自动释放。审核面板可直接改标题/正文/答案/难度/题型/分类，原文留档、改动单独存；页面会展示 AI 质检报告（结论 / 质检分 / 五维分项 / 依据 / 改进建议），AI 不可用时显示具体原因。
- **专家群组**（`v20260919f`）：`#/admin/groups`（仅管理员）。按技术分类建组并分配成员，投稿命中某组负责的分类就派给该组；没命中任何组的归「未分配」，所有专家可见（避免没人管的分组把投稿卡死）。
- **待入库**（`v20260919h`）：`#/admin/inbox`（仅管理员）。审核通过的投稿在这里一键收录进本机题库，可「仅存草稿」或「收录并发布」，收录后题号回写投稿记录。「已入库」tab 支持撤销收录（分类选错、或本地题被删时可反悔）。收录会优先采用审核员改过的版本，并在收录前再做一次本地查重。
- **备份恢复**：导出/导入完整本地题库 JSON。
- **系统设置**：
  - 配置 GitHub 发布 Token、仓库、分支；
  - 配置 Cloudflare Worker 访问统计接口；
  - 配置 AI 服务地址、模型与 API Key；
  - 手动同步云端题库。

### 云端共享题库
- 云端主库：`data/published.json`，随 Cloudflare Pages 一起发布（源文件在 GitHub 仓库，推送即由 Actions 自动部署）。
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

> 说明：流水线只改动 `data/published.json`；真正的「发布到线上」由 Cloudflare Pages 分发 —— 部署源分支是 `release`，推送到该分支即经 GitHub Actions 自动构建部署，访客下次打开即见新题。若未配置 `GH_PUBLISH_TOKEN` 且无 git 凭据，自动化会保留本地提交并提示手动推送 / 用编辑器发布。

### 自动扩充记录

| 日期 | 批号 | 技术域 | 新增题数 |
|------|------|--------|----------|
| 2026-08-27 | 2026-08-27-a | 分布式 / 数据库 / 网络 / 设计模式 | +10 |
| 2026-08-28 | 2026-08-28-a | 移动端与跨平台开发 | +9 |
| 2026-08-30 | 2026-08-30-a | 云服务售后报障全流程（经典主题 T001） | +6 |
| 2026-08-31 | 2026-08-31-a | 云监控告警响应与故障定位（经典主题 T002） | +6 |
| 2026-08-31 | 2026-08-31-b | 大客户答疑与投诉升级处理（经典主题 T003，腾讯云版） | +6 |
| 2026-08-31 | 2026-08-31-c | Java HashMap 追问链（经典主题 T007，按域轮转首题·非云） | +6 |
| 2026-09-01 | 2026-09-01-a | TCP 深入追问链（经典主题 T024，网络域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-b | 进程线程追问链（经典主题 T029，操作系统域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-c | Linux 高频命令追问链（经典主题 T031，Linux 运维域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-d | Docker 追问链（经典主题 T035，云原生域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-e | CAP/BASE 追问链（经典主题 T040，分布式域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-f | JS 核心追问链（经典主题 T046，前端域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-g | 数组/字符串高频题追问链（经典主题 T053，算法域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-h | 设计模式追问链（经典主题 T057，软件工程域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-i | Transformer 入门追问链（经典主题 T059，大模型域·按域轮转） | +6 |
| 2026-09-01 | 2026-09-01-j | 线上故障排查追问链（经典主题 T063，场景与软技能域：CPU飙高/内存泄漏/OOM） | +6 |
| 2026-09-01 | 2026-09-01-k | 云服务器 CVM 运维追问链（经典主题 T004，公有云售后域：镜像/快照/重置/安全组/密钥/授权） | +6 |
| 2026-09-01 | 2026-09-01-l | Java 并发基础追问链（经典主题 T008，Java 后端域：线程状态/锁升级/CAS/死锁/并发工具） | +6 |
| 2026-09-03 | 2026-09-03-a | MySQL 索引追问链（经典主题 T017，数据库域：B+树/聚簇二级索引/最左前缀/失效/覆盖索引/EXPLAIN/设计权衡） | +7 |
| 2026-09-03 | 2026-09-03-b | HTTP 演进追问链（经典主题 T025，网络域：1.0→1.1→2→3/状态码/缓存/队头阻塞） | +7 |
| 2026-09-03 | 2026-09-03-c | 内存管理追问链（经典主题 T030，操作系统域：虚拟内存/分页/缺页/置换/零拷贝/抖动OOM） | +7 |
| 2026-09-04 | 2026-09-04-a | Linux 性能排查追问链（经典主题 T032，Linux 运维域：USE/top→vmstat→iostat→sar/perf/火焰图） | +7 |
| 2026-09-04 | 2026-09-04-b | K8s 核心追问链（经典主题 T036，云原生域：Pod→Deployment→Service→Ingress） | +7 |
| 2026-09-04 | 2026-09-04-c | 分布式事务追问链（经典主题 T041，分布式域：2PC→TCC→本地消息表→最终一致） | +7 |
| 2026-09-05 | 2026-09-05-a | 事件循环追问链（经典主题 T047，前端域：调用栈→宏微任务→Promise→async/await→微任务饥饿） | +7 |
| 2026-09-05 | 2026-09-05-b | 链表/栈/队列高频题追问链（经典主题 T054，算法域：206→21→25→20→155→739→84 单调栈） | +7 |
| 2026-09-05 | 2026-09-05-c | Git 协作追问链（经典主题 T058，软件工程域：三层模型→分支→冲突→rebase 与 merge→reflog 找回） | +7 |
| 2026-09-06 | 2026-09-06-a | RAG 追问链（经典主题 T060，大模型域：为什么需要→切片向量化→检索→混合检索+重排→评估→生产级架构） | +7 |
| 2026-09-06 | 2026-09-06-b | 系统设计入门追问链（经典主题 T064，场景与软技能域：容量估算→短链→秒杀→feed推拉→权衡） | +7 |
| 2026-09-06 | 2026-09-06-c | 云安全日常追问链（经典主题 T005，公有云售后域：安全组有状态→收敛高危端口→CAM→勒索处置→账号隔离） | +7 |
| 2026-09-07 | 2026-09-07-a | JUC 追问链（经典主题 T009，Java 后端域：volatile 场景→CAS 原子性→ABA→AQS→线程池参数与调优） | +7 |
| 2026-09-07 | 2026-09-07-b | MySQL 事务追问链（经典主题 T018，数据库域：ReadView 可见性→RC/RR→幻读快照读/当前读→next-key lock→MDL 故障→扣减设计→RC 选型） | +7 |
| 2026-09-07 | 2026-09-07-c | DNS/CDN 追问链（经典主题 T027，网络域：递归迭代→缓存层级→CNAME 调度→回源缓存→发布不生效排查→加速方案设计） | +6 |
| 2026-09-09 | 2026-09-09-a | Shell 脚本追问链（经典主题 T033，Linux 运维域：变量/引号/单词分割→参数展开→流程控制→函数返回值→cron 环境差异） | +7 |
| 2026-09-09 | 2026-09-09-b | K8s 排查追问链（经典主题 T037，云原生域：kubectl 四步法/OOMKilled→Endpoints 空→imagePullSecrets/资源隔离→探针误配→Terminating） | +7 |
| 2026-09-09 | 2026-09-09-c | 分布式锁与分布式 ID 追问链（经典主题 T042，分布式域：Redis 可重入锁/雪花时钟回拨/Redisson 看门狗/号段模式/双层 ID/选型） | +7 |
| 2026-09-10 | 2026-09-10-a | ES6+ 高频追问链（经典主题 T048，前端域：let/const 与 TDZ→解构→箭头函数→ES Module→Proxy） | +7 |
| 2026-09-10 | 2026-09-10-b | 二叉树高频题追问链（经典主题 T055，算法域：遍历→最大深度→翻转→LCA→层序/之字形） | +7 |
| 2026-09-10 | 2026-09-10-c | Prompt Engineering 追问链（经典主题 T061，大模型域：结构化提示→少样本→思维链→幻觉抑制/注入防护） | +7 |
| 2026-09-11 | 2026-09-11-a | 自我介绍与项目表达追问链（经典主题 T065，场景与软技能域：一分钟自我介绍→STAR 法则与配比→单选辨析→项目表达改写→深挖防守→量化数据→面试官视角） | +7 |
| 2026-09-11 | 2026-09-11-b | 负载均衡 CLB 与高可用架构追问链（经典主题 T006，公有云售后域：四层vs七层→健康检查时间窗→会话保持单选→登录态丢失排查→健康检查异常/灰度下线→99.99% 接入层设计） | +7 |
| 2026-09-11 | 2026-09-11-c | Spring 追问链（经典主题 T012，Java 后端域：BeanFactory vs ApplicationContext→初始化回调顺序→singleton 注入 prototype→自调用失效→JDK/CGLIB→构造器循环依赖→三级缓存设计论证） | +7 |
| 2026-09-13 | 2026-09-13-a | 对象存储与备份容灾追问链（经典主题 T070，公有云售后域：COS 核心概念→存储类型→生命周期→跨区复制排查→误删恢复演练→分块上传→容灾架构设计） | +7 |
| 2026-09-13 | 2026-09-13-b | Spring 事务追问链（经典主题 T013，Java 后端域：7 种传播行为→REQUIRED vs REQUIRES_NEW 单选→自调用失效→事务失效归类→隔离级别→声明式 vs 编程式→与分布式事务衔接） | +7 |
| 2026-09-13 | 2026-09-13-c | Redis 数据结构追问链（经典主题 T021，数据库域：五大结构→SDS→ZSet 跳表→排行榜/计数器/集合运算→大 Key 热 Key 治理→quicklist 队列栈→去重/基数统计/布隆过滤器） | +7 |
| 2026-09-14 | 2026-09-14-a | 浏览器导航与渲染追问链（经典主题 T028，网络域：多进程架构→渲染阻塞 defer/async/preload→二次访问白屏排查→HTTP 缓存 304/强缓存→curl 阶段耗时定位 504→Service Worker 离线秒开→弱网 HTTP2/3+preconnect） | +7 |
| 2026-09-14 | 2026-09-14-b | 系统服务与日志追问链（经典主题 T034，Linux 运维域：systemd 单元类型→.service 编写/WantedBy→启动失败 journalctl 排查→target 与开机自启→journald 膨胀清理/SystemMaxUse→故障自愈+资源限制+看门狗→systemd vs SysVinit） | +7 |
| 2026-09-14 | 2026-09-14-c | CI/CD 发布可靠性追问链（经典主题 T038，云原生域：流水线门禁→不可变制品/artifacts vs cache→flaky 隔离→多环境晋级与发布卡点→构建提速三件套→可回滚数据库迁移→发布系统四件套） | +7 |
| 2026-09-15 | 2026-09-15-a | Kafka 追问链（经典主题 T043，分布式域：架构→单分区顺序性→重复消费→可靠性三端→高吞吐→Exactly-Once→offset 管理） | +7 |
| 2026-09-15 | 2026-09-15-b | 浏览器追问链（经典主题 T049，前端域：CRP→重排/重绘→白屏排查→CORS→HTTP 缓存→存储对比→多进程架构） | +7 |
| 2026-09-15 | 2026-09-15-c | 动态规划入门高频题（经典主题 T056，算法域：爬楼梯→打家劫舍→DP 思想→零钱兑换→LIS→背包对比→选型） | +7 |
| 2026-09-20 | 2026-09-20-a | Spring Boot 自动配置→启动流程→Starter（经典主题 T014） | +6 |
| 2026-09-20 | 2026-09-20-b | Redis 缓存三大问题：穿透→击穿→雪崩→一致性（经典主题 T022） | +7 |
| 2026-09-20 | 2026-09-20-c | 监控告警：指标体系→Prometheus 原理→告警规则→Grafana 看板（经典主题 T039） | +6 |
| 2026-09-21 | 2026-09-21-a | 微服务架构：拆分原则→注册发现→网关→配置中心（经典主题 T044） | +6 |
| 2026-09-21 | 2026-09-21-b | React：虚拟 DOM→Hooks→Fiber→状态管理（经典主题 T051） | +7 |
| 2026-09-21 | 2026-09-21-c | Redis 高可用：持久化→主从→哨兵→集群（经典主题 T023） | +6 |

## 部署与自定义域名

- **托管**：本站为纯静态站点，托管于 **Cloudflare Pages**（项目 `it-interview`，与域名同属一个 Cloudflare 账号）。
- **部署链路**：**GitHub → GitHub Actions → Cloudflare Pages**。推送到 `release` 分支即触发 `.github/workflows/deploy-pages.yml`（组装 `dist/` → 跑反爬守卫回归 → 部署到 Pages），约 1 分钟全站生效。**日常发版只需推 `release`。**
- **正式入口**：**https://itinterview.com.cn**（自购域名，`www.itinterview.com.cn` 同域可用）。DNS 托管在 Cloudflare，两条 CNAME（`@` / `www` → `it-interview-889.pages.dev`，Proxied 橙云）。
- **备用预览域**：**https://it-interview-889.pages.dev**（Pages 默认域，始终可用；后端 CORS 白名单中保留它，旧链接不失效）。
- **反爬守卫**：Pages 的 **Advanced Mode `_worker.js`**（源码 `cloudflare/pages/_worker.js`，构建时由 `tools/build-pages.mjs` 组装进 `dist/`）在边缘拦截 —— `/data/published.json` 等数据文件对**非站内请求**返回 403，仓库内部文件（`tools/`、`cloudflare/`、`HANDOVER.md` 等）一律 404 不出面。
- **⚠️ 2026-09-21 域名变更（以此条为准）**：原域名 `it-interview.is-a.dev` 已被 is-a.dev 官方依服务条款第 4 条第 16 项（`Any website that is orientated to courses`，任何面向课程的网站）**下架**，域名已释放。**不要再向 is-a.dev 申请。** 同时 **GitHub Pages 已关闭**（根 `CNAME` 文件也已从 `release` / `main` 两分支删除），因此 `succedd.github.io/workbuddy_it-interview/` 入口已不存在。
- **历史记录（已不成立，仅供追溯）**：本站曾托管于 GitHub Pages，以 `it-interview.is-a.dev` 为自定义域名（`CNAME` 指向 `succedd.github.io`），内容经 Fastly 边缘节点分发、题库带 `Cache-Control: max-age=600`。该方案已整体弃用。

### 部署 Cloudflare Worker（可选·访问统计）
- 仓库 `cloudflare/` 目录含 `worker.js`（统计后端）+ `wrangler.toml`（配置模板，KV id 待填）+ **[`部署指南.md`](cloudflare/部署指南.md)**。
- 概览：注册 Cloudflare 免费账号 → 本机 `wrangler login` → `wrangler kv namespace create STATS` 建 KV → 把 id 填进 `wrangler.toml` → `wrangler deploy` → 把 `*.workers.dev` 地址填进站点设置页即生效。
- 该 Worker 与百度统计并存：百度统计负责地域/来源/趋势，Worker 额外提供「全站累计访问数」与「跨访客热门题目榜」。
- 免费额度足够（Worker 10 万请求/天、KV 10 万读/1 千写/天）。

## 项目结构

```
.
├── index.html              # 入口页（百度统计、资源引用、加载动效）
├── data/
│   ├── seed.js             # 种子数据：分类树、岗位、岗位技能、示例题
│   └── published.json      # 云端题库快照（Cloudflare Pages 分发，源文件在 GitHub）
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
    ├── worker.js           # 后端 Worker（访问统计 / 账号登录 / 云同步 / 数据回读）
    ├── wrangler.toml       # Wrangler 配置示例
    └── pages/              # Pages 反爬守卫（_worker.js）与部署说明
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
- 普通访客打开网站后，只要第一次拉取到云端 `data/published.json`，就能直接浏览全部题目（1000+ 道）、搜索、刷题、收藏。
- 每个浏览器都有自己独立的管理员密码（以及收藏、历史等个人数据），互不影响。
- 只有当你想"编辑题库并发布到 GitHub"时，才需要配置 GitHub Token（这个 Token 也只存在当前浏览器 localStorage）。

## 更新日志

> 按时间**逆序**记录（最新在最上方）。

### 2026-09-22 · security: Cloudflare Turnstile 人机验证全量启用（前端挂载层，缓存版本 `20260922c → 20260922d`）

- **覆盖范围**：`/auth/register`、`/auth/login`、`/submit` 三个**写入口**。`/visit`、`/view` 两个高频统计接口**刻意不校验**（否则打断正常浏览）。目的是抬高批量注册 / 机器人刷稿的成本，顺带护住 D1 每日写入额度与 AI 质检开销。
- **开关式（前后端一致）**：后端 `verifyTurnstile()` 在无 `env.TURNSTILE_SECRET` 时返回 `skipped`；前端 `js/turnstile.js` 在无 sitekey 时 `TS.enabled()` 为 false、`TS.mount()` 返回 null。⇒ 任一环节缺失都不影响登录/投稿，因此可以「先发版、后开开关」，出问题也能一键关停（删掉 secret 即恢复旧行为）。
- **前端新增 `js/turnstile.js`**（`window.TS`）：单例加载 `challenges.cloudflare.com/turnstile/v0/api.js`，挂载点 = 账号页登录/注册表单、投稿页表单；token 以 `turnstileToken` 字段随请求体传给后端。
- **两个关键取舍**：① 用 **`execution:"execute"`（点提交时才换取令牌）而不是挂载即取** —— 投稿表单可能写十几分钟，挂载时取的令牌早超过 **300 秒**有效期，提交必然失败且报错看不懂；② **`appearance:"interaction-only"`** —— 正常情况组件完全隐形、无需任何点击，风控认为可疑时才浮出确认框。另：令牌**一次性**，失败后必须 `reset()` 重新挑战，否则再点一次必报 `timeout-or-duplicate`；主题读站内自己的 `html[data-theme]`（站内主题不跟随系统，故不用 `auto`）。
- ⚠️ **刻意不传 `remoteip`**：国内访客走 Netlify 中转桥，桥会把 `cf-connecting-ip` / `x-forwarded-for` 全部剥掉，Worker 看到的 `cf-connecting-ip` 是**桥的出口 IP**，报给 siteverify 只会制造随机失败。`remoteip` 可选，不传不影响校验强度。
- **启用后实测**（走国内 Netlify 桥）：登录不带 token → `403 请先完成人机验证`；登录/注册带假 token → `403 人机验证未通过`（⇒ 证明 Worker 真的调通了 siteverify —— 若调不通会 fail open 退化成 401 密码错误）；`/submit` 无会话 → `401 请先登录后再投稿`（校验顺序在登录之后）；`/stats` 仍 200。浏览器端用 CDP 驱动真实 Chrome 打开线上 `#/account`：`TS.status=ready`、widget 成功创建、点击提交有过程提示且无 JS 报错。
- **依赖与排障**：需能访问 `challenges.cloudflare.com`（script + iframe）；当前 CSP 只有 `frame-ancestors 'self'`，不拦 script-src，无需改动（将来若加严格 CSP，必须把该域加进 `script-src` 与 `frame-src`）。提示「人机验证组件加载失败」= 浏览器拉不到验证组件，刷新或换网络即可，表单内容不丢。
- **sitekey / secret 边界**：sitekey（公开值）写死在 `js/turnstile.js`，支持用 `api-endpoints.json` 的 `turnstileSiteKey` 远程覆盖（best-effort）；**secret 只存在于 Worker 环境变量 `TURNSTILE_SECRET`**，绝不出现在前端（已核实线上产物不含它）。
  ⚠️ Turnstile 的 widget API（`/accounts/{id}/challenges/widgets`）**不接受 wrangler 的 OAuth 令牌**（实测稳定回 `10000 Authentication error`，尽管 scope 里有 `challenge-widgets.write`）⇒ 换 widget / 改域名白名单必须走面板。

### 2026-09-22 · ops: Cloudflare 用量巡检脚本（`tools/cf-quota-check.py`）

- GraphQL 查独立 Worker 的每日请求/错误（`workersInvocationsAdaptive`）+ zone 级整站真实请求量、按 host/端口分组（`httpRequestsAdaptiveGroups`）；阈值告警 = 单日 ≥5 万 / errors>0 / 非标准端口请求 ≥200。**已知限制**：该 dataset 不含 Pages 项目的 Functions，`_worker.js` 的调用数查不到，只能看 Dashboard Metrics。
- **实测基线（可作后续对照）**：Pages Metrics 24h ≈ **8.3k** 请求（zone 级实测 24h 约 7.8k，两者吻合）、**Errors 全 0**（含 Exceeded CPU / Memory 均为 0）、Median CPU Time p99.9 = **4.0ms**（上限 10ms）⇒ 配额余量约 12 倍，**不必为配额改 `_worker.js` 高级模式架构**，日请求破 5 万时再评估。
- **运维提示**：zone 24h 内实测约 **568 次非标准端口请求**（`:8443` / `:2087` / `:2083` / `:2096` / `:8080` 等 cPanel/代理端口），属端口扫描。免费计划有 5 条 WAF 自定义规则额度，可用其中一条挡掉非 443/80 的请求。

### 2026-09-22 · 域名切换收尾 + 审核规则修补（缓存版本 `20260921c → 20260922a → 20260922b → 20260922c`）

#### fix: 新增「撤回我的投稿」（`20260922b → 20260922c`）

- **动机**：上一轮放开「管理员可自审」只解决 admin 自己投稿卡死；普通用户/专家投稿人发现投错、投重时，仍只能等审核者处理。补一个**投稿人自助撤回**的口子。
- **后端**：新增 `POST /submissions/:id/withdraw` → `handleWithdrawSubmission`。规则：① 必须登录；② 不是自己的投稿 → **403「只能撤回自己的投稿」**；③ 只在 `review_status='pending'` 且 `locked_by=0` 时可撤 —— 已被认领返回 **400「已经有审核者在处理这条投稿了，不能撤回」**，已通过/已打回返回 **400「这条已经审完，不能撤回」**（翻案属于审核动作，不给投稿人自己改结论）；④ 幂等，已是 `withdrawn` 直接返回成功。
- **软删除而非 DELETE**：写 `review_status='withdrawn'`，行保留。**关键好处 = 零 SQL 改动** —— 审核队列 `open` 只取 `IN ('pending','reviewing')`、`done` 只取 `IN ('approved','rejected')`，撤回后自动从队列消失，不用碰任何列表查询；「我的投稿」照常返回并显示「已撤回」。
- **并发安全**：UPDATE 带 `AND user_id=? AND review_status='pending' AND locked_by=0` 条件 + 判 `meta.changes`（与审核抢单同一套乐观锁），撤回与认领同时发生必有一方失败，失败方回 **409「这条投稿状态刚变了，请刷新后再试」**；`logReview(...,'withdraw','')` 留痕。
- **前端**：`js/account.js` 加 `A.withdrawSubmission(id)`；`js/submit.js` 的 `REVIEW` 表加 `withdrawn: 已撤回`，「我的投稿」表加第 6 列「操作」——仅 `pending` 行渲染「撤回」按钮，点击走二次确认（明确提示「当日投稿次数不退还」），400/409 时自动刷新显示真实状态。
- **未做（有意）**：撤回后**不退还当日投稿次数** —— 该计数按 `created_at` 统计，退还需额外状态位与配额口径改动；已在界面与《使用指南》里写明。

#### fix: 管理员可自审自己的投稿 —— 修掉「唯一管理员投稿永久卡死」（`20260922a → 20260922b`）

- **用户反馈**：「我自己投的稿无法操作嘛」—— 审核队列里自己投的 #4（`mysql为什么用B+树`）操作列只有灰字「自己的投稿」，没有任何按钮。
- **根因（前后端各一处硬拦）**：① 前端 `js/submit.js` 列表渲染处 `s.user_id === myId` ⇒ 直接渲染灰字、不给按钮；审核面板同样只显示「这是你自己提交的题目，不能自审」。② 后端 `cloudflare/worker.js#handleReview` 有 `if (row.user_id === u.id) return 403 "不能审核自己提交的题目"`。设计初衷 = 防专家自审开后门，这个初衷是对的。
- **但它踩到一个设计漏洞**：生产 D1 实测全站只有 2 个 `role=admin` —— `admin@iti.local`（**status=0 已禁用**，占位号）和 `2416217174@qq.com`（站长本人）；`role=expert` 用户 **0 个**，`group_members` 全空。⇒ 站长的投稿**无人可审、自己也审不了，永久卡在待审队列**。
- **改法（最小面，不动审核链语义）**：后端把自审拦截收窄为 `if (row.user_id === u.id && u.role !== "admin")` ⇒ **只有 `admin` 放行自审，`expert` 仍然严格禁自审**。理由是 admin 本来就能在「题目管理」里直接入库，放行自审不是新增权力；而 expert 自审会让整条审核链形同虚设。前端 `js/submit.js` 列表与审核面板都改为 `selfBlocked = self && !isAdmin`：管理员看到正常按钮 + `自己 · 可自审` 标签，专家仍是灰字「自己的投稿」。
- **验证**：用 D1 直插临时会话做免密探针（调 `review` 传非法 action，自审拦截发生在解析 action 之前 ⇒ **不写库**即可读出拦截与否）——管理员审自己的投稿 **400（已放行）**、临时专家审自己的投稿 **403（仍禁自审）**、管理员审他人 **400**；探针数据全部清理，残留 0。

#### feat(security): Zone 传输层加固 —— HSTS + 强制 HTTPS + 安全响应头（`20260921c → 20260922a`）

- **背景**：域名迁移后遗留唯一待办「Cloudflare Zone 级防护需去面板手动开」。用户要求「这项得你动手，想办法搞定」。
- **权限硬边界**：本机 wrangler OAuth 只有 `zone:read`；仓库 Secret `CLOUDFLARE_API_TOKEN`（凭据本身有效）也只挂了 `Account.Cloudflare Pages` —— 两条通道读/写 zone settings 都是 **9109**。⇒ 改走「**能靠响应头等效实现的一律下沉到应用层**」。
- **`cloudflare/pages/_worker.js` 新增第四道闸门**：`http → https 301`（本地 dev / `[::1]` 除外）+ `Strict-Transport-Security: max-age=15552000; includeSubDomains`（刻意不开 preload）+ `nosniff` + `frame-ancestors 'self'` + `SAMEORIGIN` + `Referrer-Policy`。统一走 `harden()` 包装 —— **必须新建 Response**（`env.ASSETS.fetch()` 与 `Response.redirect()` 返回对象的 headers guard 是 `immutable`）；**304 时 body 必须传 null**，否则 `new Response(res.body, res)` 抛 TypeError（顺手修掉的既有隐患）。
- **刻意不开两项（有实测副作用）**：`security_level=High`（国内访客大量走代理/共享出口 IP，会频繁人机验证）、Bot Fight Mode（**实测挡 Baiduspider**，而本站百度流量是主力，且 `_worker.js` 已有精准 UA+ASN 白名单）。
- **「无遗留待办」实测定论（commit `ec680ed`）**：最低 TLS 已是 1.2+（用 Python `ssl` 逐版本握手，服务端回 `tlsv1 alert protocol version`；⚠️ 别用 `openssl s_client -tls1` 的失败当依据，那报的是本机限制，会得出**假结论**）；TLS1.3 已开；机会加密影响已被 301 覆盖且站内 0 处 `http://` 子资源。
- **验证**：部署 run `35671364583` success；线上 HSTS + 4 个安全头齐全、`http→https` 301、备用域同样带 HSTS；`tools/pages-guard-test.mjs` **44/44**（较此前 41 条新增 3 条）；`accept-switch.py` 10/10；`regress-check.py` 零回归。

#### ops: 迁移遗留审计 + 文档校准（`20260921b → 20260921c`，无功能改动）

- **审计范围**：域名 + 托管方式变更后的全部引用 —— PWA manifest、Service Worker 缓存、CSP、重定向配置、环境变量覆盖项、**服务端回读路径**、工具脚本、文档指引。
- **结论：代码侧没有失效项**。其中最高危的静默失效点是 `worker.js#getCategorySnapshot` 从 `SITE_ORIGIN + /data/published.json` 拉分类树（**失败会被 try/catch 吞掉**，表现为分类快照恒空、AI 质检失去上下文）——实测 Worker 未被设过 `SITE_ORIGIN` 覆盖项，代码常量生效，回读 200 / 2,167,247 字节 / 276 个分类。
- **真正过时的是 README**：「题库快照通过 GitHub Pages 分发」「CDN 经 Fastly」等 7 处 + 技术栈 2 行 → 全部改为 **Cloudflare Pages + GitHub Actions**；「部署与自定义域名」章节整段重写；旧 GitHub Pages 段落降级为「历史记录（已不成立）」。
- **刻意保留不动**：`## 更新日志` 等历史章节（日志性质）；`js/docs/*.js` 里的 `*.github.io` 是外部技术文档链接；`js/account.js` 与 `netlify/functions/proxy.js` 里的 Netlify 是**仍在运行**的国内直连反代桥。

### 2026-09-21 · 站点切换到自购域名 `https://itinterview.com.cn`（缓存版本 `20260920c → 20260921a → 20260921b`）

- **起因（重大事故）**：`it-interview.is-a.dev` 被 is-a.dev 官方**零预警下架** —— 维护者先 APPROVE 了 CNAME 迁移 PR #53221（只核了 JSON 格式、没看站点），打开站点后判 `The website's content violates the terms of service` 并关掉该 PR，3 分钟后自开并合并 PR **#53294「taking down it-interview.is-a.dev」**，`domains/it-interview.json` 被整文件删除。**违规条款定位 = is-a.dev ToS 第 4 条禁止清单第 16 项「Any website that is orientated to courses」（任何面向课程的网站）**，原文写明 `Violation of this section may result in immediate termination without notice.` ⛔ **结论：不要再向 is-a.dev 及任何同类免费子域申请域名来放这个站。**
- **抢救与切换**：先全量迁到备用预览域 `https://it-interview-889.pages.dev`（缓存版本 `20260920c → 20260921a`），随后自购 **`itinterview.com.cn` @ 腾讯云首年 ¥33 / 续费 ¥38** 并完成全量切换（`20260921a → 20260921b`）。域名选型依据：`itinterview.com` 被 HugeDomains 挂售 $3,995、`it-interview.com` 被 Afternic 一口价 $31,976、`itinterview.cn` 由个人持有要等到 2026-11-07 才可能到期。
- **Cloudflare 侧（全部 active）**：zone `48961f3585fdc652af950bd2163c0382` status=active；NS `joyce/kyle.ns.cloudflare.com`；DNS 两条 CNAME `@` 与 `www` → `it-interview-889.pages.dev`（Proxied）；Pages 自定义域 root + www 均 active。
- **后端**：`cloudflare/worker.js`（已 `wrangler deploy`）CORS 白名单 = `itinterview.com.cn` + `www` + 旧的 `pages.dev`（兼容历史标签页），`SITE_ORIGIN = "https://itinterview.com.cn"`；实测新域/www/pages.dev 均发放 CORS、`evil.example.com` **不发放**。
- **站内域名全量替换**：新增 `tools/set-site-origin.mjs`（幂等，`KNOWN_OLD_HOSTS` 长的在前避免子串互扰），实际替换 **1236 文件 / 10884 处**，复跑 0 处；残留 17 处经逐一核查全在「文档历史叙述 + 脚本注释」，刻意保留。顺手修掉 `tools/verify-publish.py`、`tools/merge-dup-questions.py` 里仍指向**已下架域名**的 `SITE` 常量。
- **OG 封面图重渲染（像素级）**：图里的域名是**烤进像素**的，脚本改源文件不够，必须用无头 Chrome 重出 `assets/og-cover.png` 并比对线上 sha256。
- **换域名必查清单（本次踩全）**：① 前端硬编码 → ② 静态/SEO 文件（sitemap/canonical/robots）→ ③ `worker.js` CORS 白名单 → ④ **服务端回读路径 `SITE_ORIGIN`** → ⑤ **OG 图（像素级）** → ⑥ **Worker 环境变量覆盖项**（`SITE_ORIGIN`/`ALLOWED_ORIGIN` 若被设错且失败被 try/catch 吞掉，会静默失效）。后三处之外的故障都是静默的。
- **验收**：部署 run `35612690196` success；`tools/accept-switch.py`（本次新增的 10 项换域名验收脚本）**10/10 通过**；`tools/regress-check.py` **旧功能零回归**；线上 OG 图 sha256 与本地一致。切换期间不断站（`pages.dev` 全程可用）。

### 2026-09-20 · ops: 域名切换 PR 已提交 + Cloudflare 自定义域已登记（前端未改，缓存版本仍 `20260920c`）

- **is-a.dev PR #53221** 已提交：`domains/it-interview.json` 的 `CNAME` 由 `succedd.github.io` 改为 `it-interview-889.pages.dev`（仅 +1/−1 行，等维护者合并，通常 1–3 天）。→ https://github.com/is-a-dev/register/pull/53221
- **is-a.dev 的 PR 模板是硬校验**（`util/check-pr-template.cjs`）：7 个复选框必须写成 `- [x] <!-- MARKER -->`，且 Website Preview / Website Purpose 两个标记之间必须有内容；**不能自造正文结构**。首次提交因此被机器人打上 `incomplete pr`，改为原文照搬模板并勾选后复检通过。
- **Cloudflare 自定义域已登记**：`it-interview.is-a.dev` 已通过 API 加为 Pages 项目 `it-interview` 的自定义域（`status=initializing`）。⚠️ is-a.dev 已进 Public Suffix List，**自定义域只能在 API 加，Dashboard 加不了**。
- **⚠️ 自动部署待人工授权一次**：该项目是**直传（Direct Upload）项目**，实测**无法转为 Git 连接**（`8000069`）；新建 Git 连接项目又被 `8000011 Cloudflare Pages Git installation` 挡住 = 账号未装 Cloudflare 的 GitHub App。授权后即可建成「推 `release` → 自动构建部署」。
- **⚠️ GitHub Actions 兜底也不通**：本机 PAT 缺 `workflow` scope，`Contents API` 与 `Git Data API` 两条路写 `.github/workflows/*` 都被拒。
- **⛔ 仓库转私有必须排在最后**：私有仓库在 GitHub Free 下没有 Pages，转私有会让当前线上后端失效。顺序：PR 合并 → 域名切 Cloudflare 并验收 → 再转私有。
### 2026-09-20 · ops: 反爬层落地 —— 站点迁 Cloudflare Pages + 高级模式 Worker 守卫（前端未改，缓存版本仍 `20260920c`，release=`29cb7226939ea4c9caf0e144aaa8f25078133416` / main 同 tip）

- **起因**：GitHub Pages 是纯静态托管，**没有任何边缘计算能力** —— `data/published.json`（整库 1172 题 + 答案，2.1MB）一条 `curl` 即可整包拿走；`q/*.html` 是 1209 个把完整答案写进 `ld+json` 的分享页，沿公开 `sitemap.xml` 走一遍同样等于整库下载。robots.txt 对不读它的采集器没有约束力。
- **做法**：站点前端迁移到 **Cloudflare Pages**（免费版原生支持私有仓库 + 高级模式 Worker），在静态资源之上加一层会真正拒绝请求的守卫（`cloudflare/pages/_worker.js`）。
- **守卫三道闸门**：① 仓库内部文件（`tools/` `cloudflare/` `netlify/` `HANDOVER.md` `README.md` …）→ 404；② `/data/*` 先过 UA 过滤，**再**要求「浏览器信号」（`Sec-Fetch-Site: same-origin|same-site` 或同源 `Referer`）；③ 全站拦脚本 / 爬虫 / 无头浏览器 / AI 训练 UA，但搜索引擎白名单（Googlebot / Bingbot / Baiduspider / Yandex / Applebot / PetalBot …）放行以保 SEO。
- **额外堵一条路**：UA 自称搜索引擎、但来源网络（`request.cf.asOrganization`）完全对不上 → 403，堵掉「伪造 Googlebot 沿 sitemap 扒 1209 个分享页」这条最省事的绕过。
- **两个自测抓出来的错**：`Applebot-Extended` 含 `Applebot` 子串会被白名单**误放行**（改为独立先判）；搜索引擎白名单在 `/data/*` 上**不能生效**，否则「借一个搜索引擎 UA + 手补 `Sec-Fetch-Site: same-origin`」就整层绕过了（实测确为 200，已改为 403）。
- **新增文件**：`cloudflare/pages/_worker.js`、`tools/build-pages.mjs`（白名单组装 `dist/`，内部文件不进发布目录）、`tools/pages-guard-test.mjs`（**41 条回归全过**）、`cloudflare/pages/README.md`（部署 + 验证清单）、根 `404.html`；根 `robots.txt` 补约 30 个 AI 训练 / SEO 采集 UA 的 `Disallow: /`（**对现有 GitHub Pages 也立即生效**）。
- **⚠️ 尚未切换生产域名**：`it-interview.is-a.dev` 的 CNAME 仍指 `succedd.github.io`，**线上仍是 GitHub Pages**，守卫目前只在预览地址 `https://it-interview-889.pages.dev` 生效。切换需人工两步：`is-a-dev/register` 提 PR 改 CNAME → Cloudflare 加自定义域。该域名 DNS 不在本账号下，**用不了 WAF / Bot Fight Mode**。**这层防护挡得住随意采集，挡不住会改请求头 + 租代理池的定向攻击。**

### 2026-09-20 · fix: 登录失败根因更正 —— 不是手机输入问题，而是库内密码与手敲密码不一致（缓存版本 `20260919m→20260920a→20260920b→20260920c`，release=`e84712fd3b0214224dd94833a5dd91e54913ba21`）

- **结论先行**：手机 / 平板登录报「邮箱或密码不正确」**不是手机输入的问题**（此前推测的自动填充 / 键盘大小写已被实测推翻）。真因是**库里存的密码哈希，和你手敲的密码不是同一个**。
- **「电脑端能登」是假象**：登录成功后浏览器会保存约 30 天的会话凭证，只要没退出，那台设备一直是拿着旧凭证进门、**根本没再核对过密码**；只有换到没有凭证的新设备（手机 / 平板）才第一次真正比对，问题才在这里暴露。
- **一分钟自测**：在**已经能登录的那台电脑**上开一个**无痕 / 隐私窗口**（不带已保存凭证）再登一次 —— 同样报错，就是密码本身对不上（去「站点 → 账号」改密码，或请管理员重置）；能登进去，才是输入层面的问题（删掉系统里本站保存的旧密码、切英文键盘重打、注意首尾空格与中文全角）。
- 排查手段：本机 `wrangler` 已带凭证，可直连生产 D1 查 `users` 表；另建临时账号在生产入口实测「注册 / 正确密码 / 错误密码」三连，**先证明后端鉴权链路健康，再怀疑凭证**。该管理员账号已重置并实测登录通过，`last_login_at` 已刷新。
- 站内「使用指南 → 👤 账号与数据」的自检清单已按上述结论改写，`❓ 常见问题`指路同步修正。
- 同日早前的登录输入加固（登录框加 `autocapitalize/autocorrect/spellcheck` 防护 + 登录 / 注册密码 `.trim()`）保留，对「误带首尾空格」的输入仍有吸收作用。

### 2026-09-19 · feat: 手动新增题目标题实时相似题提示（缓存版本 `20260919l→20260919m`，release=`651f3b2e28d9ac8b758a51d2664738e2de376698` / main=`a7ebe02fd5e25a1d53b4ca56b15915acdfab4aa0`）

- 查重防线补口：此前手动新增只有**保存时**的精确标题比对，输入过程中毫无提示。现在编辑页标题输入防抖 250ms 后实时展示「⚠️ 题库里有 N 道相似题：《…》85%（保存前会再拦一次）」，相似度阈值 Dice 0.6、最多 3 条、标题可点击跳转、编辑已有题时排除自身。**只提示不拦截**，保存时精确比对仍兜底。
- `submit.js` 导出富版 `dupMatches`（含题目状态），供编辑页与投稿页共用。
- 冒烟新增阶段 I（2 条断言），113 → 115 条 `SMOKE_OK`。

### 2026-09-19 · style: 侧栏分区标题放大提亮（缓存版本 `20260919k→20260919l`，release=`d3bd9c7ca7b7f8e97bfe13c1a8e95c35b76bfed6` / main=`601454f6110280d9095b7a88085de84a3f78b7a9`）

- 用户反馈分区标题「又小又暗」：`11px + 浅灰` 改为 **`13px + 次级文字色 + 字重 600`**，去掉对中文无效的 `uppercase / .08em` 字距；层次靠字重与右侧箭头区分，不再靠小和灰。padding 左右保持 10px，不给 `overflow-y:auto` 的侧栏任何横向溢出机会（实测 239/239）。

### 2026-09-19 · fix: 使用指南补齐投稿 / 审核 / 待入库 / 侧栏折叠条目（缓存版本 `20260919j→20260919k`，release=`02a0225e29461f5f0894d131f7303dd716f78faf` / main=`9ff32626df2a307d01170242b5f3e8fae7829009`）

- 「使用指南」（`#/help`）此前漏了四轮功能：投稿（`20260919f`）、待入库（`20260919h`）、脉冲动效、侧栏分区折叠。本轮新增「📥 投稿与审核」分区（投稿题目 / 投稿前查重 / 我的投稿 / 审核与入库）与「侧栏分区可折叠」条目，页脚更新日期刷新为 2026-09-19。
- **纪律落为执行点**：`js/guide.js` 纳入线上逐字节比对 + 5 条标记；冒烟新增 `#/help` 6 条断言（含指南更新日期戳）。**以后再有功能没同步进指南，发版前就会 FAIL**。

### 2026-09-19 · feat: 侧栏分区折叠 —— 管理/审核/站点默认收起，点击标题展开（缓存版本 `20260919i→20260919j`，release=`5411b6236350b96eabae39d762960458d6b384d0` / main=`0251fa418987df02f677b2c71fc33e8c8bc58679`，Worker 未改动）

- **交互**：侧栏每个分区标题（投稿 / 导航 / 技术分类 / 管理 / 审核 / 站点）都变成可点击的折叠头（右侧带旋转箭头，`aria-expanded` 同步）。**投稿 / 导航 / 技术分类默认展开**（核心入口），**管理 / 审核 / 站点默认折叠**（后台类分区，正是「全部展开很乱」的来源）。选择存 `localStorage`，跨会话记住。
- **不会把自己藏丢**：当前所在页面若属于某个折叠分区，路由切进去时会**自动展开**它（之后手动收起不会被弹回，离开再回来才重新自动展开）。
- **实现**：折叠用 `display:none`（不用 max-height 动画——侧栏内容高度差异极大，写死必溢出）；标题按钮 `box-sizing:border-box` 且左右 padding 与旧标题完全一致，**不给 `overflow-y:auto` 的侧栏任何横向溢出的机会**（上一轮脉冲动效刚踩过的同源坑）。
- **验证**：四件套全绿（`node --check` / `ASSEMBLE_OK` 101 篇 / `TOTAL_PROBLEMS: 0` / `RENDER_OK`）；**真实 Chrome 冒烟 93 → 107 条全绿（`SMOKE_OK`）**，新增阶段 H（分区随角色渲染 / 默认开合 / 点击展开与持久化 / 连点收起 / 路由自动展开 / 无横向溢出 / 分类树完好）；**零回退纯增量 diff 合计 64 行**（`js/app.js` +128/−27 全是分区构建行原样迁入 `navSec`、`css/style.css` +32/−1、`index.html` +35/−35 纯版本号、`sw.js` +1/−1）；线上 6 文件**逐字节一致**、82 条标记齐全；**线上真机 `LIVE_FOLD_OK`**。

### 2026-09-19 · feat: 「投稿」入口脉冲动效 —— 一大一小在闪动（缓存版本 `20260919h→20260919i`，release=`072b0ff0a445a815ac19faaae8fd904f19b02d7b` / main=`496130a1cb333da16ab29650ed77bc8aad5563d1`，Worker 未改动）

- **用户诉求**：「投稿能不能做个闪动的动效，一大一小在闪动，可参照网上做得好的」。原先的「呼吸」只动描边透明度，太含蓄。
- **四层叠加**（周期 2.6s，参照 iOS 聚焦环 / antd 徽标脉冲的**间隔性**节奏，而不是持续高频闪 —— 持续闪会让人想关掉它）：
  1. 侧栏整块缩放 `scale(1 ⇄ 1.04)`，峰值 34%；
  2. 图标心跳 `1 → 1.3 → 1 → 1.18 → 1`，峰值 20% / 48%（幅度最大，「一大一小」的主力）；
  3. 描边光环向外扩散后淡出（10% 最亮 → 45% 散尽）；
  4. 内发光闪动（`inset` 阴影，峰值 34% —— 最大的一刻也最亮）。
  四个峰值刻意错开，于是任何一刻都有东西在放大或变亮，观感是「一闪一闪」而不是平铺的呼吸。
- 底部标签栏的「投稿」同源：实心圆底图标做同样的心跳，外加一圈围绕它的光环（SVG 是替换元素、伪元素挂不上，光环只能由 `.tab-cta` 绝对定位到圆底上）。
- **两个踩到的坑（都已实测拦住并写进 CSS 注释）**：
  1. **伪元素的 `scale` 会与外层 `scale` 相乘**：整块 1.06 时 `::after` 自己的 1.06 叠加成 1.123 → 219px 的项撑到 246px → 侧栏（`overflow-y:auto` 使 `overflow-x` 计算为 auto）**真的长出横向滚动条**；倍数收紧到 1.04 × 1.015 = 1.056（外扩 6.1px / 内边距 10px）。
  2. **内发光只能用 `inset`**：外发光会画到盒子外面，同样会撑出横向滚动条。
- **无障碍**：`prefers-reduced-motion: reduce` 下四层动效全部停止，静态的主色底与描边保留（信息不丢，只是不闪）。
- **验证**：四件套全绿（`node --check` / `ASSEMBLE_OK` 101 篇 / `TOTAL_PROBLEMS: 0` / `RENDER_OK`）；**真实 Chrome 冒烟 93 条全绿（`SMOKE_OK`）** —— 新增的阶段 G 不只断言「声明了动画」，还**在一个完整周期内用 rAF 连续采样取宽度的最大/最小值**，证明它真的在动（侧栏整块 219 → 227.8px、图标 17 → 22.9px、底部图标 26 → 33.8px），并同时守住「侧栏无横向溢出」「移动端 390px 无横向溢出」「reduced-motion 下全停」；**线上真机复验** `LIVE_CTA_OK`（线上 `PAGE_VER=20260919i`、三层动画均在活动态、整块缩放 219 → 227.8px）；线上 6 个文件逐字节一致（`css/style.css` 88948 B）。
- **「零回退」纯增量 diff**：合计 **47 行**被删/改 = `index.html` 35（全是 `?v=`/`PAGE_VER`/`SWV`）+ `sw.js` 1（`VERSION`）+ `css/style.css` 11（**全部是旧的 `.nav-cta` / `.tab-cta` 强调样式块**）—— 无一处意外删除。

### 2026-09-19 · feat: 「待入库」面板（审核通过 → 一键收录进题库）+ 投稿页提示词与侧栏入口整改（缓存版本 `20260919g→20260919h`，release=`879cdd4f6d8fdc0616045e8c7bacf0d70b561e3d` / main=`74874b614ac0cc3161bfeab0eb291f096c1d1004`，Worker 版本 `fb6ec123-592f-46e2-8796-edcd40950118`）

- **补齐了投稿链路的最后一环**。原先「人工审核通过」之后还要管理员自己去题目管理里手动加题，现在改成一键收录：`登录投稿 → AI 质检 → 专家/管理员审核 → 管理员「待入库」认领 → 收录进题库`。
- **⭐ 概念上分清两件事：审核通过 ≠ 入库。** `review_status='approved'` 只是拿到「候选资格」，`bank_id=''` 才表示「审过了但还没进题库」。分开是刻意的，为了**审核权与发布权分离** —— 专家可以审，但只有管理员能把题真正写进题库（专家即使账号被盗也发不了题、进不了库）。
- **新增 `#/admin/inbox`「待入库」页**（侧栏「站点」区 + 桌面顶栏下载图标，带角标）：两个 tab「待入库 / 已入库」。收录时**优先采用审核员改过的版本**（`edited_json`），分类自动从 AI 给的路径预填（AI 只给到二级，本地是三级分类时会逐级前缀回退匹配）；收录前用与投稿同一套 Dice 算法查重（**连草稿一起比**），命中会弹窗二次确认；可选「仅存草稿」或「收录并发布」。
- **「已入库」tab 的价值是「可反悔」**：分类选错了、或者本地那道题后来被删了，都能在这里看到 `bank_id` 并**撤销收录**（条目自动回到待入库）；列表还会检查本机是否真的还有这道题，没有就标「本机已无此题」。
- **顺手挖出并修掉一个影响面很大的真 bug**：分类扁平化的缓存 `flatCats()` 原来写的是 `if (_flat) return _flat;` —— **空数组在 JS 里也是真值**，于是只要在题库装载完成前被调用一次，**空数组就被永久钉住**，此后整个会话（含投稿表单、题库筛选）的分类联想全是 0 项，而且不报任何错。现在改为「空结果不写缓存」。（通用教训：懒加载缓存必须区分「空结果」与「已装载」。）
- **投稿页三处体验整改**（用户反馈「框里的提示词看不全」「投稿侧边栏不醒目、容易忽略」）：
  - 8 个字段的 placeholder 压到 **≤30 字**，长说明移到新增的灰字提示 `.field-hint`，单行输入框里不再被截断；
  - 侧栏「投稿题目 / 我的投稿」整块**提到搜索框下方成为第一个落点**（原来埋在「技术分类」之后），并加主色底 + 呼吸描边；底部标签栏对应项加实心圆底；
  - 「待入库」入口同时在侧栏与顶栏出现，带待审角标。
- **配套**：题目来源新增一类 `submission`（「题库全景图」的来源构成图随之增加「用户投稿」一类，来源筛选下拉与 `?source=` 预筛选同步支持）。
- **验证**：`node --check` 全绿、`validate-docs.js` 101 篇 `ASSEMBLE_OK`、`check-escapes.py` `TOTAL_PROBLEMS: 0`、`render-check.js --stub-api` `RENDER_OK`、真实 Chrome 冒烟 **86/86**、线上接口 **14/14**、真机端到端 `e2e-inbox.py` **21/21**（含测试数据精确清理复核）、线上 6 个文件**逐字节一致**。**「零回退」纯增量 diff** 合计 118 行被删/改，逐条核对全是本轮有意改动。
- **工具升级**：线上核验脚本 `pages-byte-verify.py` 的标记清单从 34 条扩到 **67 条**，把历轮改动过的旧功能标记词全部纳入 —— **「上线不许弄丢旧功能」从此由工具自动执行**，不再依赖人工 grep。

### 2026-09-19 · ops: 配置 `DEEPSEEK_API_KEY`，AI 质检正式生效（仅运维/文档变更，无代码改动、版本号不变，仍为 `20260919g`）

- **`DEEPSEEK_API_KEY` 已写入 Worker**（`wrangler secret put`，走 stdin）—— AI 质检从「一律未判定」变成真正在工作。**未重新部署**（secret 立即生效），密钥**未落进仓库任何文件**。
- **直连探针**（`tools/deepseek-probe.py`）：`deepseek-flash` → HTTP 200、`finish_reason=stop`、404 token、JSON 正常解析；对照请求错名 `deepseek-v4.1-flash` → **HTTP 400**「The supported API model names are deepseek-flash, deepseek-v4-pro」。
- **端到端真机验证**：一次性账号经 Netlify 桥投稿一道 HTTP/HTTPS 题 → `ai.verdict="pass"`、`ai.score=88`、reasons/improvements/categoryPath 均为真实内容 → 证明 Worker 确实取到密钥并完成调用与入库。
- **测试数据已彻底清理并复核**：submissions 1→0、users 6→5、测试 uid 计数 0，5 个真实账号完好。（清理时踩坑：错题本表真名是 `weak_bank` 而非 `weak`，写错会让整批 SQL 原子回滚。）

### 2026-09-19 · fix: AI 质检模型校正为 `deepseek-flash`（= DeepSeek-V4.1-Flash）+ 关闭思考模式（缓存版本 `20260919f→20260919g`，release=`273dd1f7c761785e09a068281ba68746278776e2` / main=`44d83c7cb9e1e50fc2178812baaa0bbac26cc167`，Worker 版本 `08596f73-c8ed-4102-af12-de942efb72c4`）

- **模型 ID 校正**：查 DeepSeek 官方文档确认，**`deepseek-flash` 的模型版本正是 `DeepSeek-V4.1-Flash`**；原代码用的 `deepseek-chat` 是 V3 时代旧 ID（已不在官方模型表内），而 `deepseek-v4.1-flash` 是第三方网关（EmpirioLabs / Venice 等）的命名，**官方 `api.deepseek.com` 不接受、会报 400 Model Not Exist**。现默认 `deepseek-flash`，并加 `AI_MODEL_ALIASES` 把各种叫法收敛到官方 ID、支持 `DEEPSEEK_MODEL` 环境变量覆盖（换模型不用改代码）。
- **关闭思考模式（关键修复）**：官方 thinking **默认开启**且 effort 默认 `high`，**思考 token 也计入 `max_tokens`**。质检输出只有几百 token，开着思考会把 1500 的额度烧在推理上 → `finish_reason=length` → 每条投稿都变成「AI 未判定」，功能等于白做。改为 `thinking: { type: "disabled" }` 并把 `max_tokens` 提到 2048；附带好处是**只有非思考模式下 `temperature` 才生效**（思考模式下会被官方静默忽略）。
- **可运维性**：AI 失败时把 401 / 402 / 429 / 「模型 ID 不接受」直接翻成可动手的中文提示；token 用量记入 `submissions.ai_json._usage` 便于核对账单；**审核面板**现在会显示 AI 不可用的具体原因与本次 token/模型（仅审核端可见，不暴露给投稿人）。
- **验证**：`node --check` 全绿、`validate-docs.js` 101 篇 `ASSEMBLE_OK`、`check-escapes.py` `TOTAL_PROBLEMS: 0`、`render-check.js --stub-api` `RENDER_OK`、真实 Chrome 冒烟（mock API）`SMOKE_OK`、推送后 4 文件指纹复核通过。
- **待办**：`DEEPSEEK_API_KEY` 尚未配置（`wrangler secret list` 仅 `ADMIN_EMAIL`）——充值 `https://platform.deepseek.com/top_up`，建 Key `https://platform.deepseek.com/api_keys`，然后 `wrangler secret put DEEPSEEK_API_KEY`（**不需重新部署**）。

### 2026-09-19 · feat: 用户投稿 + AI 质检 + 管理员/专家审核 + 专家群组（缓存版本 `20260919e→20260919f`，release=`4064c3b7a386dc9f1d1286dc50146a5d5fb2ad30` / main=`77b9378efe98fc95e09f149e936d6f70ee311122`，Worker 版本 `2223cb69-bb09-4f55-a40b-21fe3d6a39a8`）

- **为什么**：用户想「让别人也能录题」，同时要防住乱投 ——「加个 AI 质检，检查通过再管理员审核再入库；与 IT 无关的累计 3 次就永久禁用；投稿必须先登录」。随后又提「有时候投稿多了我一个人审核不过来，做个专家群组，只有群组里的人也能审核」。
- **完整链路**：`登录 → 每帐号每日 5 条限额 → IP 限流 → 本地预筛 → DeepSeek AI 质检 → 人工审核（管理员或对应技术方向的专家）→ 通过 → 管理员「加入题库」`。**AI 质检与人工审核是两道独立关卡，通过后也不会自动上线**。
- **AI 质检（服务端，DeepSeek `deepseek-flash`）**：一次判定两件事 ——「是不是本站技术体系里的分支」+「题目本身质量如何」。返回 `pass` / `reject_non_it` / `reject_quality` / `reject_duplicate` + 0–100 质检分 + 五维分项（表述清晰度 / 技术深度 / 答案准确性 / 实用性 / 独特性）+ 判断依据与改进建议。（本条目原先记作 `deepseek-chat`，已于 `20260919g` 校正为官方 ID `deepseek-flash` = DeepSeek-V4.1-Flash。）
- **违规与封禁**：只有**「非 IT 内容」计违规次数**，累计 **3 次**帐号永久禁用并踢下线。质量、重复的判读由审核员最终决定（AI 意见仅供参考），**不计违规次数** —— AI 判质量容易误杀，人工兜底才不丢好题。AI 服务不可用时也**不计次、照常进人工队列**，绝不让服务故障惩罚投稿人。
- **投稿前本地查重**：提交时在浏览器里用二元组 Dice 系数粗筛标题（1132 题全量约 10ms 级），把相似度 ≥0.5 的前 6 条随投稿一起送服务端交给 AI 判定重复 —— **AI 只做判断、不负责检索**。
- **专家群组**：管理员在「专家群组」里按技术分类建组并分配成员，投稿命中某组负责的分类就派给该组；**没有命中任何组的投稿归「未分配」，所有专家都能看到**（避免没人管的分组把投稿卡死）。成员只有角色为「专家」时才真的能进审核队列，角色在「帐号管理」里设置。
- **审核防冲突**：抢单式认领（乐观锁），两人同时点同一条后到的那位会收到「已被其他人认领」；**审核者不能审自己提交的题目**（前端不给按钮，服务端再拦一次）；30 分钟未处理会自动释放，一直没审完的条目别人可以接。
- **审核员可以直接改题**：题目面版里可改标题 / 正文 / 答案 / 难度 / 题型 / 分类，改完可以「只保存改动」或「改完直接通过」；原文保留，改动单独存档，列表上会标「已有审核改动」。
- **新增 `js/submit.js`**（`#/submit` 投稿、`#/me/submissions` 我的投稿、`#/admin/submissions` 审核队列、`#/admin/groups` 专家群组），侧栏与移动端底部标签栏都加了入口，审核入口在桌面顶栏有待审角标。
- **顺手修掉一个历史遗漏**：`js/daily-quote.js` 一直挂在页面上，却漏在 Service Worker 的离线预缓存清单里（首次离线启动会缺这个脚本）。
- **⚠️ 需要一步手动配置**：AI 质检依赖 Worker 密钥 `DEEPSEEK_API_KEY`。**未配置时 AI 一律返回「未判定」，投稿照常进人工队列、不会误封号** —— 但也就没有 AI 质检了。配置命令：`wrangler secret put DEEPSEEK_API_KEY`。

### 2026-09-19 · fix: 移动端系统性体检后的 6 项修复（缓存版本 `20260919d→20260919e`，release=`9dc832d7b9078c464363666046f1dde9e9614656` / main=`3e50e4f4e1b57f5f60fa7e59f7cb218614d468b7`）

- **为什么**：用户问「你觉得移动端，还有哪些需要调整的」。这次不再凭印象列清单，而是**在真实 Chromium 里用 CDP 模拟手机**（`setDeviceMetricsOverride({mobile:true})` + `setTouchEmulationEnabled`）把 8 条路由 × 多档宽度逐个量了一遍，拿数值和截图说话。
- **P0-1 顶栏在竖屏手机上溢出（最严重，全机型命中）**：390px 下顶栏**溢出 172px**（360→202px、430→132px，临界点约 **562px**，即**所有竖屏手机**）。原因是 `.topbar-actions` 宽 364px 且 `min-width:auto`，它所在的 `#topbar` 是 `flex-start` 又不裁剪，于是整条从 `left=198` 一路跑到屏外 —— 实测**主题切换图标被切掉一半、「登录」（left=408）和「管理员」（left=482）整块在屏幕外**，等于手机上少了三个入口。
  - **改法**：那 4 个导航图标（技术体系 / 岗位体系 / 模拟面试 / 收藏夹）在 ≤720px 用新增的 `.desktop-only` 隐藏 —— 它们**在侧栏和底部标签栏里都有**，属于重复入口，删掉零损失；「管理员」入口**移到抽屉里**（`.mobile-only` 的「管理员登录」项，插在「技术分类」标题之前、首屏可见，点它自动关抽屉并弹出登录框）；昵称用 `.acct-name` 包一层，限宽 56px + 省略号。
- **P0-2 文档页表格被压成一列一个字**：`#/docs/ops/basic/fs-basics` 那张 4 列表格，最小列**只剩 35px** → 一个汉字一行，完全没法读。`U.md` 现在把 `<table>` 包进 `.md-table-wrap` 并让单元格 `white-space:nowrap`，表格改为**容器内横向滚动**；最小列宽从 35px 回到 **153px**（容器 328px / 表格 819px，可滚）。
- **P1-1 iOS 聚焦缩放（输入框 <16px）**：iPhone Safari 在字号 <16px 的输入框聚焦时会**自动放大整页**，缩放后不还原。实测 7 处踩线：抽屉搜索 14px、首页 hero 搜索 15px、题库页搜索 13.3px、3 个筛选下拉 13px、笔记框 13px、计划页两个日期框 14px —— 现全部 ≥16px。**⚠️ 下拉那 3 个必须写 `font-size:16px !important`**：`.select-mini`（0,1,0）的类选择器优先级高于元素选择器（0,0,1），不加 `!important` 压不住。
- **P1-2 点击区偏小（<44px）**：汉堡按钮 28×36、`.icon-btn`/主题按钮 36×36、侧栏导航项高 39px、翻页按钮 32×32 —— 统一抬到 **44 / 44 / 44 / 40**（翻页一排 5 个按钮，44 会撑爆，取 40 折中）。
- **P1-3 触屏全局行为**：`-webkit-tap-highlight-color` 原为 `rgba(51,181,229,.4)`（点哪都闪一块蓝）→ 改 `transparent`；`overscroll-behavior-y` 由 `auto` 改 `contain`（防下拉时整页橡皮筋带动背景滚动）。
- **修完顶栏后新暴露的两个溢出（一并修掉）**：① 首页搜索行 4 个元素**不换行**，390px 下溢出 45px 且把 hero 输入框挤到只剩 26px 宽 → `.hero-search` 加 `flex-wrap`，输入框独占一行；② 4 张统计卡片的 `[data-tooltip]::after` 气泡（`nowrap` + `left:50%` + 长文案）即使 `opacity:0` 也**照样撑出 92px 横向溢出** → 触屏（`(hover:none),(pointer:coarse)`）直接 `display:none`。**这两个是「假溢出」的典型**：元素本身看不见（透明），却真实参与布局。
- **「零回退」纯增量 diff（对比上一线上代码 commit `a6fef6ca`）**（下列计数**只算非空行**；另有新增空行 `js/app.js` 2 条、`css/responsive.css` 8 条未计）：`js/app.js` **+29/−11** —— 11 条被删行**逐条核对正是本次改的顶栏 4 图标 + 管理员按钮 + 昵称行 + `navItem` 签名 + 侧栏「技术分类」标题**，无一多余；`js/utils.js` **+8/−0**、`css/responsive.css` **+48/−0** 为纯新增；`css/style.css` **+14/−2**（2 条是 ≤640px 的翻页按钮覆盖，桌面规则一字未动）；`index.html` **+34/−34** 全是 `?v=`/`PAGE_VER`/`SWV`；`sw.js` **+1/−1** 仅 `VERSION`。
- **验证**：本地 CDP 全量复测 **9/9 组合「无横向溢出」+ 0 个 <16px 输入框**；抽屉实测手机端显示「管理员登录」（首屏 777–821px 处、高 44px）且点击后弹登录框并自动关抽屉，桌面端隐藏它并正常显示 4 个图标；`node --check` / `validate-docs.js`（101 篇 `ASSEMBLE_OK`）/ `check-escapes.py`（`TOTAL_PROBLEMS: 0`）/ `render-check.js --stub-api`（`RENDER_OK`，console 0 错，表格仍正常解析）全过。
- **刻意未改**：底部标签栏、iOS 安全区、移动端 Toast、滑动手势导航（边缘避让 / 方向门控 / 弹窗守卫）、抽屉遮罩与自动关闭、`.icon-btn` 的全局尺寸（改它会连带弄坏后台表格和弹窗关闭按钮）。

### 2026-09-19 · fix: 手机端不再显示键盘快捷键提示（缓存版本 `20260919c→20260919d`，release=`a6fef6ca6fac7833cf0642af2e9d62ea79e422ab` / main=`d48dd0fe197f430dc0d13e1368cb5d6eb8c3e1f2`）

- **为什么**：用户反馈「手机端出现空格键/展开收起答案，这个移动端没必要出现」。手机上根本没有实体键盘，这类提示是纯噪音；更要紧的是**触屏的 `:hover` 会「粘住」**——详情页「查看答案」按钮上那行 `[data-tooltip]:hover::after` 的气泡点一次就**一直挂着不消失**，看起来像页面坏了。
- **改法**：新增能力探测 `U.canHover()`（判据 `(hover: hover) and (pointer: fine)`；探测不到时**按桌面处理**，宁可多显示也不误藏）。三处键盘提示改为**只在「有指针 + 能悬浮」的设备上渲染**：
  1. 题目详情页那行「快捷键：Space 翻答案 · S 收藏」（`#kb-hint`）；
  2. 题目详情页「查看答案」按钮上的「空格键：展开/收起答案」气泡；
  3. 错题重练页底部「快捷键：回车 确认「会了」· Esc 关闭弹窗」。
- **双保险**：同时给提示打上 `.kbd-hint` / `data-tooltip-kbd` 标记，并在 `css/responsive.css` 加了一条 `@media (hover: none), (pointer: coarse)` 兜底规则 —— 将来若有人新增提示忘了走 JS 判据，只要挂上类名也藏得住。
- **刻意保留**：**快捷键本身不变**（外接蓝牙键盘的平板照旧可用）；「使用指南」页那句已经写明「电脑上：…」，属于文档而非界面提示，未动。
- **验证**（本地真实 Chrome，通过 CDP 打开触摸模拟后才 `reload`，真实复现手机首屏）：
  - 手机首屏：`canHover=false`、`#kb-hint` **根本没被创建**、按钮上**没有** tooltip 属性（气泡无从出现）；
  - 还原桌面：`canHover=true`、`#kb-hint` 创建且 `display:block`、tooltip 属性回来（证明规则**有选择性**，不是一刀切）；
  - 兜底 CSS 单独验证：触摸模拟下，真实 `#kb-hint` 与合成探针的计算样式均为 `display:none`，`[data-tooltip-kbd]::after` 也是 `none`；桌面下同为 `block`；
  - 错题重练页**伪造一条到期项**后：`canHover=true` → 提示出现；`canHover=false` → 提示消失、而「待复习」列表与「会了」按钮**照旧在**（功能未受影响）；恢复后又出现。
  - `node --check` `js/app.js` + `js/utils.js` 通过；**「零回退」纯增量 diff**（对比上一线上代码 commit `64dc33a6`）：`js/utils.js` **+11/−0**、`css/responsive.css` **+11/−0**（都是纯新增），`js/app.js` **+22/−16**（16 条被改行逐条核对**正是上面那三处提示**），`index.html` **+34/−34**（全是 `?v=`/`PAGE_VER`/`SWV`），`sw.js` **+1/−1**（仅 `VERSION`）；线上 5 文件**逐字节一致**。

### 2026-09-19 · fix: 手机端补上搜索入口（抽屉搜索框）+ 修掉搜索下拉监听的累积（缓存版本 `20260919b→20260919c`，release=`4db1c31011d2da4521c1f8fefcb6b96e150c7fa2` / main=`8ef89bf28745b29a0438e5d473e514759f8e4eae`）

- **为什么**：修上面那个抽屉问题时**顺带发现** —— 窄屏样式会把顶栏搜索整块隐藏（`.topbar-search { display:none }`），而本该顶上来的抽屉搜索框（`.drawer-search`）**只有样式、没有标记**（全仓库只有 CSS 提到这个名字），于是**手机端一个搜索入口都没有**。经确认后本次补上。
- **改法**：在侧栏最上方（13 个导航项之前）加入搜索框，行为和顶栏搜索**完全一致** —— 回车即搜、写入**同一份**「最近搜索」历史、复用同一套历史下拉，搜索完**自动收起抽屉**（搜同一个词时地址不变、不会触发路由兜底，所以这里必须显式关闭）。桌面端继续由 CSS 隐藏，不受影响。
- **顺带修一处隐患**：搜索历史下拉的「点空白关闭」监听原先挂在每个渲染点（首页 / 题库页 / 顶栏 / 抽屉四处），而 SPA 每次路由变化都会重渲染 → 监听器**只增不减**。已改成全局单例，只装一次。
- **验证**：线上真实浏览器（390×844）实测抽屉搜索框可见（宽 224px），输入 `kafka` 回车后**抽屉自动收起**并跳到 `#/questions?q=kafka`（20 条结果，页面搜索框同步为 `kafka`）；点遮罩、点导航项也都能关抽屉；桌面端回归正常（顶栏搜索、分页均无变化）；线上 5 个文件逐字节一致，`index.html` 32 处 `?v=20260919c`、`sw.js VERSION=20260919c`；旧功能标记零丢失。

### 2026-09-19 · fix: 移动端抽屉点完菜单项不自动收起（缓存版本 `20260919a→20260919b`，release=`7ca6567d9508cf5f0e14a07c60bd67c6c780adcd` / main=`4383605bcbdce5f054771f5407e9e0d705cce1d9`）

- **为什么**：用户反馈「手机端点开侧边栏菜单，侧边栏不隐藏，还要再点上面三个横线才可以，体验不好」。
- **根因①：抽屉里只有「技术分类树」会关抽屉。** 关闭逻辑只写在 `#side-tree .tree-row` 的点击处理里，而侧栏那 13 个主导航项（首页 / 技术教程 / 技术体系 / 岗位体系 / 刷题计划 / 模拟面试 / 随机一题 / 刷题练习 / 收藏夹 / 浏览历史 / 错题重练 / 使用指南 / 关于本站）**一个都没写关闭代码**，点完菜单抽屉照旧挂在屏幕上。
- **根因②：遮罩是死代码。** `index.html` 上 `<div id="drawer-mask" class="drawer-mask hidden">` 把 `hidden`（`display:none !important`）写死在标签里，CSS 也从没有规则去解除它 —— 于是**遮罩永远不显示**，点侧栏外面也没反应。
- **改法**：统一抽出 `drawerOpen / closeDrawer / toggleDrawer / syncDrawerA11y` 四个助手（顺带给三条横线按钮同步 `aria-expanded`），在 `init()` 里**只绑一次**委托监听，给抽屉提供三条「自助关闭」通道 —— ① 点抽屉里任意站内链接；② 点遮罩；③ `Esc` 键 / 路由变化兜底。**技术分类树的展开/收起是 `div` 不是链接，所以展开时抽屉保持打开**。CSS 侧把 `.drawer-mask` 改为基础 `display:none` + `body.drawer-open .drawer-mask { display:block }`，并加 `body.drawer-open { overflow:hidden }` 锁住背景滚动。
- **验证**：真实浏览器（本地 + 线上各一遍，390×844）6 项断言全绿：遮罩正常显示、点「技术教程」后抽屉自动收起、点遮罩可关、展开分类树不被误关、Esc 可关、路由变化兜底可关；线上文件逐字节一致；旧功能标记零丢失。

### 2026-09-19 · fix: 题目列表分页重做（窗口式页码）+ 修复筛选越界空白（缓存版本 `20260918b→20260919a`，release=`1a49bfeda74b42b4749576d77d4ca61c92b5acd9` / main=`aae91b94369aeaf4372979b5b3a5c149c2755fde`）

- **为什么**：用户反馈「最新题目 → 更多，下面的分页数字一字排开不好看」，并贴出 1…58。
- **根因①：页码没有窗口化。** `renderPager` 会把 `Math.ceil(题数/20)` 个页码**全部渲染出来**（线上 1153 题 → 58 个按钮），而 `.pager` 是 `display:flex` 且**没有 `flex-wrap`**，58 个按钮 ≈ 2.3k px 远超版心，于是整条铺开。
- **改法**：改成**窗口式分页** —— `‹ 上一页` + 首末页 + 当前页 ±2 + 断档折成 `…` + `下一页 ›` + `跳至 [n] / N 页` 输入框。任何位置最多 **11 个元素**（旧实现 58 个）；断档只差 1 个数时直接补上，不出多余省略号。CSS 加 `flex-wrap:wrap`、hover/disabled/active 态，窄屏（≤640px）隐藏跳页框、按钮缩到 32px。
- **根因②：筛选/搜索不重置页码（连带 bug，原先会渲染成空白）。** `apply()` 从不重置 `page`：停在末页时输入关键词，`arr.slice((page-1)*20, page*20)` 取到空数组，于是 **`#q-grid` 一片空白、但标题旁的题数还显示真实值**（因为 `arr.length > 0`，不会走「没有匹配的题目」空状态）。现在筛选 / 搜索 / 来源一变就回第 1 页，并在 `renderGrid`、`renderPager` 两处夹取 `page ≤ 总页数`；空结果时同步清掉分页残留。
- **顺带修掉 URL 同步 bug，并新增页码深链。** 原排序按钮写 URL 用的是 `url.searchParams.set("sort", s)` + `url.pathname + url.search`，但本站路由参数**在 hash 里**（`#/questions?sort=…`），这样写会得到 `/?sort=updated` 这种**没有 hash 的地址，等于把整条路由抹掉**（刷新就回首页）。已抽出 `syncRouteParams()` 统一按 hash 读写；同时给分页加了 `?page=` 深链 —— 刷新 / 前进后退不丢页，填了越界页码会自动夹到末页并把 URL 纠正回来。
- **验证**：离线桩测 8 组用例全过；**真实浏览器（本地 + 线上）**实测线上 1153 题 / **58 页** → 分页 6 个按钮、`1 2 3 … 58`、单行、无横向溢出，`&page=30` 正确高亮、`&page=999` 自动夹到 58 页；`node --check` / `validate-docs.js`（101 篇）/ `check-escapes.py`（0 问题）全过；线上 4 个文件逐字节一致；旧功能标记词零丢失。

### 2026-09-18 · feat: 技术教程 7 个方向「全维度加厚」全部完成（缓存版本 `20260916i→20260918a`，release=`196e7a9361296cf1e659853bfaa6fed57a9dff98` / main=`ce749bba3ba250c266823ad0cbf7648a95c718ee`）

- **为什么**：用户反馈「教程写的感觉还是有点太粗略了」——要求所有方向统一加深，不只是补新方向。
- **本次范围**：**7 个方向 101 篇全部加厚**，正文 1.4×~2.8×。

  | 方向 | 加厚前 | 现在 | 倍率 | 篇数 |
  |---|---|---|---|---|
  | 运维 / SRE | 40.4KB | **111.2KB** | 2.75× | 9 |
  | Java 后端 | 95.3KB | **191.6KB** | 2.01× | 19 |
  | 网络与操作系统 | 29.8KB | **80.4KB** | 2.70× | 13 |
  | 数据库 / DBA | 60.9KB | **84.1KB** | 1.38× | 17（含 3 篇新增） |
  | 前端 Web | 65.8KB | **116.3KB** | 1.77× | 15 |
  | 云原生 / DevOps | 157.1KB | **248.9KB** | 1.58× | 14 |
  | 安全 | 106.5KB | **186.5KB** | 1.75× | 14 |

- **做法**：**保留全部原章节 ID**（已分享的链接与阅读进度不受影响）。每章统一为八段式：官方文档基线 → 原理与底层机制 → 规范与标准 → 实战（错误 vs 正确对照）→ 覆盖广度（对比表 / 决策指引）→ 常见误区 → 自检清单 → 延伸；加厚采取在章末「延伸阅读」前插入「🔬 深挖」整段的方式，**只增不删**。
- **网络与操作系统**是唯一此前仍是「标准实战篇」的方向（37KB），本次**全量重写**：骨架取自 RFC 1122 / 9293 / 791 / 8200 / 826 / 1034·1035 / 9110–9113 / 9000–9002 / 8446 / 5681 / 6298 / 8312 与 Linux man-pages（man7.org），并参考 CSAPP / TLPI。
- **运维 / SRE** 内联在 `js/docs-data.js` 的 `const OPS` 中（第 7 个方向），本次一并加厚，侧栏 7 个方向深度统一。
- **顺带修复工程债**：① `js/docs/java.js` 4 处 `$C}` 占位符残缺（少左花括号，页面上会渲染成裸文本），`syntax-collection` 章节线上实测确认；② `tools/render-check.js` TARGETS 由 24 章扩至 **32 章**，补入网络 5 章 + 运维 3 章。
- **验证**：`node --check`（9 文件）+ `validate-docs.js`（**101 篇唯一 ID**、官方基线块齐全）+ `smoke-test.js` 26/26 + 本地真实 Chrome 渲染 **32/32 OK** + 线上（it-interview.is-a.dev）**32/32 OK**；行尾一致性检查 0 项差异；线上 `index.html` 34 处 `?v=20260918a`、`sw.js` `20260918a`、19 项既有功能标记词全部在位。
- **教训**：本轮先尝试用 6 个并行子代理改写，**全部因调用频率限制（429）中断**，且其中两个方向的产出反而比原文件更薄、一个方向写入被截断导致语法损坏——已全部回滚改由主流程手动完成。**同类大批量改写不宜并行派发**；收工前须逐章比对字节数，避免「语法合法但内容缩水」蒙混过关。
- **同日补充（21:20）· 教程「补齐最薄方向」：DBA 与网络 / 操作系统 逐章深挖（缓存版本 `20260918a→20260918b`）**

  上一轮 7 方向加厚后做了**逐章字节体检**，发现方向之间深浅严重不齐：**数据库 / DBA 平均仅 5065 字节/章（全站最薄，最薄的 14 章里有 13 章属于 DBA）**、网络与操作系统平均 6334，而运维 / SRE 已达 12656、云原生 / DevOps 18205。本轮对其余两个最薄方向**全部 30 章逐章深挖**：

  | 方向 | 本轮前 | 本轮后 | 倍率 | 最薄章节（字节） |
  |---|---|---|---|---|
  | 数据库 / DBA | 84.1KB | **197.0KB** | 2.34× | 4389 → **10018** |
  | 网络与操作系统 | 80.4KB | **170.5KB** | 2.12× | 5538 → **11725** |

  - **深挖基准**：每条「🔬 深挖」都写到**内核实现 / 协议规范 / 生产故障**一级。DBA 侧覆盖 MVCC 的 undo 版本链与 Read View 判断、InnoDB 三条加锁规则、`data_lock_waits` 阻塞链定位、EXPLAIN 逐列精读与 `key_len` 反推、pt-query-digest 四列判读、并行复制与大事务延迟、Redis 编码不可逆转换、连接池 `max-lifetime` 与 `wait_timeout` 的关系、预分片扩容与双写六阶段、pt-table-checksum 原理、对账双轨设计；网络侧覆盖 Linux 收包八步路径与软中断/RPS、MTU 黑洞与容器 VXLAN 的 MTU 算术、TLS 1.3 密钥派生与六步证书链校验、epoll 实现与 ET 必须读到 EAGAIN、C10K→C10M 四大约束核算、sendfile 零拷贝的失效条件、CNI 三种 Service 实现、USE 方法与 off-CPU 分析。
  - **新增工具**：`tools/escape-md.py`（把期望渲染的原文安全转义成模板字符串形式）、`tools/check-escapes.py`（残缺插值 / 裸反引号 / 非法插值 / 围栏配平四项检查），根治「注入 Markdown 打崩模板字符串」这类反复出现的失误。
  - **验证**：`validate-docs.js` **101 篇唯一 ID**、`check-escapes.py` 6 文件 0 问题、`eol-check.py` 0 差异、本地真实 Chrome 渲染 **32/32 OK**（残留占位 0、控制台错误 0）。
  - **篇幅现状**：全站 7 个方向 101 篇，**每章正文均 ≥ 10018 字节，已无薄章**。

### 2026-09-17 · feat: 「前端 Web」方向教程按官方文档目录重写并大幅深化（缓存版本 `20260916h→20260916i`，release=`3c9d62bb1734039a5806ebdb161398fb53bbbe83` / main=`885b49225cf9dff186d5eb085fc697f58f0fdb9c`）

- **为什么**：延续前四个方向的做法——按技术官网文档目录为骨架完整详细地展开，本次轮到「前端 Web」。
- **本次范围**：15 章（初级 5 / 中级 5 / 高级 5）全部重写，正文 40.5KB → **约 66KB**（约 4.4k 字符/章）。**保留全部 15 个原章节 ID**，分享链接与阅读进度不受影响。
- **官方目录基线**：MDN（HTML elements / CSS Layout / JavaScript Guide / Events / HTTP Caching / CSP / Performance API）/ WHATWG（HTML·DOM Standard / Event loops）/ RFC 9110·9111 / react.dev 新官方文档（Managing State / Render and Commit）/ Vue 3（Reactivity in Depth·Rendering Mechanism）/ Vite（Why Vite·Dep Pre-Bundling）/ Rollup / TypeScript Handbook（Narrowing·Generics）/ web.dev（Rendering Performance·Core Web Vitals）/ Sentry / micro-frontends.org / Module Federation / qiankun / React Native / Electron Security / 小程序官方文档 / OWASP Cheat Sheet（XSS·CSRF）。
- **工程面**：版本 `20260916h→20260916i`；`tools/render-check.js` TARGETS 扩充 6 个前端章节（渲染核验目标累计 24 章）。验证：`validate-docs.js` 98 篇唯一、`smoke-test.js` 26/26、本地真实 Chrome 渲染 24/24 OK（两轮复跑稳定）。
- **待重构**：网络与操作系统 共 1 个方向。

### 2026-09-17 · feat: 「数据库 / DBA」方向教程按官方文档目录重写并大幅深化（缓存版本 `20260916g→20260916h`，release=`327a8ed604b9d84595c5584640fd7e50fee351c1` / main=`e3afaa3f5a78049dfdefdbe8c9c9c096c2060d24`）

- **为什么**：延续前三个方向的做法——按技术官网文档目录为骨架完整详细地展开，本次轮到「数据库 / DBA」。
- **本次范围**：14 章（初级 4 / 中级 5 / 高级 5）全部重写，正文 38.1KB → **60.9KB**（约 4.4k 字符/章）。**保留全部 14 个原章节 ID**，分享链接与阅读进度不受影响。
- **官方目录基线**：MySQL 8.0 RM（Backup and Recovery / Security·ACL / Data Types / Character Sets / Partitioning / Replication·GTID·半同步 / Group Replication·InnoDB Cluster / EXPLAIN Output Format / InnoDB Locking / Online DDL）/ PostgreSQL Documentation（Queries / Concurrency Control·MVCC / Backup·PITR）/ redis.io（Data Types / Persistence·混合持久化 / ACL / Latency / Sentinel / Cluster）/ ShardingSphere（分片、弹性伸缩）/ Vitess / gh-ost / pt-online-schema-change / Percona Toolkit（pt-query-digest / pt-table-checksum / pt-table-sync）/ sysbench / Canal CDC / Google SRE Book（SLO / Data Integrity）/ USE Method。
- **工程面**：版本 `20260916g→20260916h`；`tools/render-check.js` TARGETS 扩充 6 个 DBA 章节。验证：`validate-docs.js` 98 篇唯一、`smoke-test.js` 26/26、本地真实 Chrome 渲染 18/18 OK（含 6 个 DBA 章节）。
- **待重构**：网络与操作系统 / 前端 Web 共 2 个方向。

### 2026-09-17 · feat: 「Java 后端」方向教程按官方文档目录重写并大幅深化（缓存版本 `20260916f→20260916g`，release=`fece518d5c` / main=`2afaac3acd`）

- **为什么**：延续「安全」「云原生/DevOps」两个方向的做法——按技术官网文档的目录为骨架完整详细地展开，本次轮到最大的「Java 后端」方向。
- **本次范围**：19 章（初级 6 / 中级 7 / 高级 6）全部重写，正文由平均 **1511 字/章 → 约 5.7k 字符/章**（合计 108.6KB，原 61.6KB）。**保留全部 19 个原章节 ID**，分享链接与阅读进度不受影响。
- **官方目录基线**：Oracle Java Tutorials / JLS §10·§11·§17（JMM）/ JVMS §2.5 / HotSpot GC Tuning Guide 与 Troubleshooting Guide / JEP 333·377·439·444（ZGC、CMS 移除、分代 ZGC、虚拟线程）/ Spring Framework Reference（IoC 生命周期与三级缓存、AOP、七种事务传播）/ Spring Boot Reference（自动配置、17 级配置优先级、Actuator）/ Maven POM Reference 与 Dependency Mechanism（nearest wins）/ Gradle User Manual / Pro Git（对象模型、rebase 铁律）/ MySQL 8.0 RM（数据类型、EXPLAIN 输出格式、InnoDB 索引结构、复制与 Group Replication）/ redis.io（Data Types、Persistence、Replication、Distributed Locks）/ RabbitMQ Reliability Guide / Kafka Design（三种交付语义）/ Kleppmann fencing token 论证 / Stripe Idempotency / microservices.io（Saga、Transactional Outbox、Idempotent Consumer、Circuit Breaker、Bulkhead）/ Resilience4j User Guide（熔断状态机参数）/ Sentinel Wiki / Google SRE Book（过载保护、容量规划）/ USE Method / USL 扩展律。
- **工程面**：版本 `20260916f→20260916g`（`index.html` 34 处 + `sw.js`）；`tools/render-check.js` 的 TARGETS 扩充 6 个 Java 章节（注意 Java 方向章节路由用真实 ID 如 `syntax-collection`，与 devops 的序号式 ID 两套命名并存）。验证：`validate-docs.js` 98 篇唯一、`smoke-test.js` 26/26、本地真实 Chrome 渲染 12/12 OK（含 6 个 Java 章节）。
- **待重构**：网络与操作系统 / 数据库·DBA / 前端 Web 共 3 个方向。

### 2026-09-16 · feat: 「云原生 / DevOps」方向教程按官方文档目录重写并大幅深化（缓存版本 `20260916e→20260916f`，release=`d50514322d` / main=`0004fdf886`）

- **为什么**：延续上一轮「安全」方向的做法——用户希望技术教程**以技术官网文档的目录为骨架**、完整详细有条理地展开。
- **本次范围**：「云原生 / DevOps」方向，14 章（初级 4 / 中级 5 / 高级 5）全部重写。正文由平均 **1094 字/章 → 约 11.2k 字符/章**（合计 157KB）。
- **结构**：新增 `js/docs/devops.js`（与 `security.js` / `java.js` 同样的独立文件架构，`docs-data.js` 里移除内联 DEVOPS，改为引用 `window.DEVOPS`），`docs-data.js` 由 52KB 降到 30KB。
- **官方目录基线**：Docker Docs（Get Started / Storage / Networking）、OCI 镜像与运行时规范、Dockerfile reference + Building best practices + Multi-stage builds、Git 官方文档 + GitHub Actions（Workflow syntax / Events / Secrets / Reusable workflows）、GitLab CI YAML reference、Kubernetes Docs（Workloads / Services & Networking / Configuration / Storage / Scheduling + 探针官方任务）、Helm（Charts / Chart Template Guide / Best Practices）、Terraform（Language / State / Modules / CLI）、Argo CD + Flux + OpenGitOps 四原则、Kustomize + Cluster API + 官方版本偏差策略、Argo Rollouts / Flagger + SRE Workbook 金丝雀章、Google SRE Book（SLI/SLO / 错误预算 / 多窗口燃烧率告警）、The Twelve-Factor App、CNCF Platforms White Paper + Backstage + Kubernetes Operator 模式。
- **章节变化**：保留全部 14 个原章节 ID（不破坏已分享链接与阅读进度），只重写正文；每章开头新增「官方文档基线」链接块，章末统一为「⚠ 踩坑与误区 + ✅ 自检清单 + 📚 延伸阅读」。
- **顺手修的两处工程债**：`sw.js` 预缓存清单此前**漏掉了 `js/docs/security.js`**（离线模式下安全方向会取不到数据），本次补上并加入 `devops.js`；`tools/validate-docs.js` 原先按「devops/security 仍是空骨架」的旧假设断言，已重写为按当前「6 个独立方向文件 + docs-data 组装」架构校验。
- **新增校验工具**：`tools/render-check.js` 用真实 Chrome 渲染 6 个教程 URL，校验版心 1180px、console 零错误、正文无残留占位符；本地运行会自动过滤访客统计接口的 CORS 噪声。
- **验证**：`node --check` 全部通过；`node tools/validate-docs.js` → `ASSEMBLE_OK`（7 方向 / 98 章 / 0 重复 / terms 100%）；`node tools/smoke-test.js` 26/26；`node tools/render-check.js` → `RENDER_OK`（6 个 URL 全部 1180px、0 控制台错误、0 残留占位）；线上核验见下方部署记录。
- **剩余计划**：Java 后端、网络与操作系统、数据库·DBA、前端 Web 共 4 个方向仍偏薄，后续按同样方式重构（预告：Java=Oracle Tutorials / Spring Reference / JVMS；网络与OS=RFC 9110-9113 / 8446 / 9293 + Linux man-pages；DBA=MySQL 8.0 / PostgreSQL / Redis 官方手册；前端 Web=MDN / React / Vite / WHATWG）。

### 2026-09-16 · feat: 「安全」方向教程按 OWASP 官方目录重写并大幅深化（缓存版本 `20260916d→20260916e`）

- **为什么**：用户反馈技术教程「写得有点简单」，希望**以技术官网文档的目录为骨架**、完整详细有条理地展开。
- **本次范围**：「安全」方向（其余方向后续跟进）。正文由平均 **872 字/章 → 4546 字/章**（11 章 → 14 章，63.6k 字符）。
- **结构**：新增 `js/docs/security.js`（与 `java.js` / `frontend.js` 同样的独立文件架构，`docs-data.js` 里移除内联 SECURITY，改为引用 `window.SECURITY`）。
- **官方目录基线**：OWASP Top 10:2021 / ASVS 4.0 / WSTG / Cheat Sheet Series、NIST SP 800-61r2 与 SP 800-63B、CIS Benchmarks、RFC 6749/7636/7519（OAuth 2.0 系列）、RFC 8446（TLS 1.3）、GB/T 22239-2019（等保 2.0）、《数据安全法》《个人信息保护法》。每章开头给出「官方文档基线」，正文按官方目录逐节展开。
- **章节变化**：保留原 11 个章节 ID（不破坏已分享链接与阅读进度），新增 3 章——`security-basic-3` 认证与会话安全（口令存储 / MFA / 会话 / JWT）、`security-mid-5` 安全编码与供应链安全（SCA / SBOM / SLSA）、`security-adv-4` 云原生与容器安全（4C 模型 / PSA / NetworkPolicy / Kyverno）。
- **顺手修的渲染 bug**：`js/docs/java.js` 第 111 行 `${C}list.remove(0)$C}` 占位符残缺（少一个左花括号），会把后面的反引号渲染成裸文本。
- **文案改为动态计算**：`js/guide.js`「使用指南 → 技术教程 → 内容覆盖」与 `js/docs.js` 教程索引页脚的方向数/篇数不再硬编码，改为从 `window.DOCS` 实时统计（本次显示「7 个技术方向、98 篇」），以后增删章节不必再手改文案。同步更新了「每篇文档的结构」与教程首页文案，说明目录取自官方文档。

### 2026-09-16 · style: 「技术教程」模块回归 1180px 居中宽度（缓存版本 `20260916c→20260916d`）

- **为什么**：用户反馈从侧栏点进「技术教程」的页面明显比其它页面宽——方向列表页 7 张卡片横拉满整屏，与题库、模拟面试等页面的居中版心不一致。
- **改动**：`js/docs.js` 移除**方向列表 / 方向目录 / 章节阅读页**三处 `setMain(` 开头的 `<!-- wide -->` 满宽标记，整个教程模块回到 `.container` 的 1180px 居中宽度；`js/app.js` 的 `<!-- wide -->` → `.container-wide` 逃生舱机制保留备用（注释更新为「全站统一 1180px，暂无页面使用」）。
- **效果**：方向卡片网格由「1 行 7 列横拉」变为 **4 列 × 284px**（末行 3 张）；阅读页为 248px 目录 + 910px 正文，与其它页面版心一致。
- **验证**：本地 Chromium(1680×950) 实测 `#/questions`、`#/docs`、`#/docs/ops`、`#/docs/ops/basic/fs-basics` 四页 `.container` 宽度均为 **1180px**（`.container-wide` 不再出现）、`opacity:1`、正文/表格/代码块渲染正常。

### 2026-09-16 · doc: 修正「技术教程」引导文案与文档页脚注（缓存版本 `20260916b→20260916c`）

- **为什么**：上轮补全「云原生/DevOps」「安全」后，两处用户可见文案未同步——`js/guide.js` 的「📘 技术教程」一节仍写「仅运维/SRE 上线、其余方向标注建设中」；`js/docs.js` 文档索引页脚注仍提示「灰色『建设中』的方向已规划目录」。现已 7 个方向、95 篇教程全部上线，这些措辞已不准确。
- **改动**：
  - `js/guide.js:61`「内容覆盖」bullet 改为列出 7 个方向及其篇数（运维/SRE 9、Java 后端 19、网络与操作系统 13、数据库/DBA 14、前端 Web 15、云原生/DevOps 14、安全 11），并说明「初级→中级→高级连续读到最后一章即一条成长路线」。
  - `js/docs.js:157` 页脚注去掉「建设中」误导，改为「当前 7 个技术方向、95 篇教程已全部上线；学习进度会随阅读自动累积」。
  - 侧栏/首页入口由 `window.DOCS` 自动生成，新方向已自动出现；`sitemap.xml` 历来不含 hash 路由章节页，本次无需改动。
- **验证**：本地真实浏览器 CDP 验收文档页与指南页渲染正常、文案已更新、零控制台错误。

### 2026-09-16 · feat: 补全「云原生/DevOps」与「安全」两大技术教程方向（缓存版本 `20260916a→20260916b`）

- **内容**：将原先仅占位骨架的 `devops`（云原生/DevOps）与 `security`（安全）两个方向补齐为完整实战教程，与「运维/SRE」「Java 后端」等方向同结构（侧栏顺序：`ops → java → network → dba → frontend → devops → security`）。
  - **云原生/DevOps（14 章）**：初级（Docker 镜像与容器操作、Git 与代码评审、CI 流水线基本配置、Linux 与网络基础）→ 中级（Dockerfile 最佳实践与镜像瘦身、CI/CD 流水线设计、K8s 部署与 Helm、基础设施即代码 Terraform、制品与版本管理）→ 高级（GitOps 与持续交付、多集群与多环境管理、发布策略蓝绿/金丝雀、工程效能度量 DORA、平台化建设）。
  - **安全（11 章）**：初级（Web 安全基础 OWASP Top 10、常见漏洞原理 SQLi/XSS/CSRF、Linux 安全基线）→ 中级（渗透测试流程与工具、认证与授权设计、加密与密钥管理、日志审计与入侵排查）→ 高级（安全开发生命周期 SDL、WAF 与风控体系、应急响应与取证、合规与数据安全治理）。
  - 每章含 `minutes`/`updated`/`applies`/`tags`/`terms` 与带代码块、踩坑清单、排障清单的实战正文，沿用 `${C}`/`${F}` 模板占位符与 marked 渲染（GitHub Actions 的 `${{ }}` 已做转义，按字面显示）。
- **改动面**：`js/docs-data.js`（新增 25 章正文，移除不再使用的 `skeleton()` 死代码）、`index.html`、`sw.js` 缓存版本升 `20260916a→20260916b`。
- **验证**：`node --check js/docs-data.js` 通过；require 后 `window.DOCS.dirs` 顺序正确，devops 14 章 / security 11 章全部正文非空、字段完整；模板占位符运行时已正确转为反引号。

### 2026-09-16 · fix: 修复发版后「技术教程」页偶发整页空白（Service Worker 旧缓存未失效，缓存版本 `20260915c→20260916a`）

- **现象**：`20260915c` 热修后，部分访客打开「技术教程」任意页（索引 / 方向 / 阅读）整页空白（`#main` 为空、标题回退为首页标题），而站内点击跳转又正常。本地起静态服务 + Chromium 实测确认：**关掉 Service Worker 后三个页面全部正常渲染（满宽、`opacity:1`、内容完整）**——说明代码本身没问题，是 SW 缓存了上一次 messy 部署期间的不完整资源组合（`iti-pwa-v20260915c`），且因版本号未变、SW 不重新安装，一直继续服务损坏缓存。
- **根因**：`sw.js` 的 `VERSION` 在「修正 `PAGE_VER`/`SWV` 与 `VERSION` 不一致」那次也停在了 `20260915c`，与线上混乱期的缓存键同名；SW `activate` 只在「新版本号」时才清旧缓存，版本号没变就不会重抓，于是旧缓存被永久服务。
- **修复**：将缓存版本整体升到 `20260916a`（`index.html` 全部 `?v=`、`PAGE_VER`、`SWV` 与 `sw.js` 的 `VERSION` 同步），使 SW 重新 `install` → `skipWaiting` → `activate` 删掉 `iti-pwa-v20260915c` 旧缓存、重新拉取干净资源；保留 `20260915c` 已做好的「宽屏满宽」布局（它本就正确，也顺带解决了之前「宽屏右侧大片留白」的诉求）。另在 `.container` 加 `opacity:1` 基线，作为 `page-enter` 动画兜底，杜绝任何「内容存在但不可见」的边缘情况。
- **改动面**：`index.html`、`sw.js`、`css/style.css`。
- **验证**：本地静态服务 + Chromium（1600×900）实测 `#/docs`、`#/docs/ops`、`#/docs/ops/basic/fs-basics` 三页均正常（满宽 ~1308px、`opacity:1`、正文/目录树完整）；`node --check` 全过。

### 2026-09-15 · fix: 修复控制台 `unload` 权限告警 + 技术教程宽屏右侧大片留白（缓存版本 `20260915b→20260915c`）

- **① 控制台 `[Violation] Permissions policy violation: unload is not allowed in this document`**：`js/cloud.js` 原先在 `initAuto()` 里**无条件**注册 `beforeunload`，任何访客一加载页面就会被现代 Chrome 报此告警。改为**按需绑定**——仅当「编辑端 + 已开启自动发布 + 产生了未发布的改动」时，`markDirty` 才挂上监听；自动发布成功或关闭自动发布即**立即解绑**。普通访客与登录但未改动的访客都不再挂监听，告警消失。
- **② 宽屏（约 ≥1600px）下「技术教程」页右侧大片空白**：`setMain` 把所有页面统一包进 `.container{max-width:1180px;margin:0 auto}`，而文档阅读页本是「左目录栏 248px + 右正文」的满宽布局，被限宽后在宽屏两侧（尤其右侧）留出大片空白。新增 `.container-wide{max-width:100%}`，`setMain` 检测 HTML 开头的 `<!-- wide -->` 标记即切换为满宽；教程**索引页 / 方向页 / 阅读页**三处已加标记，其余页面（首页、题库等）行为完全不变。
- **顺带修正**：`index.html` 内 `PAGE_VER` / `SWV` 长期停留在旧值 `20260913k`（与 `sw.js` 的 `VERSION` 不一致，会让「有新版本，点击刷新」胶囊的比对逻辑错乱），本次随发版一并升到 `20260915c`。
- **改动面**：`js/cloud.js`（beforeunload 动态绑定）、`js/app.js`（setMain 支持宽屏模式）、`js/docs.js`（三处加 `<!-- wide -->` 标记）、`css/style.css`（新增 `.container-wide`）、`index.html`（`?v=` 与 `PAGE_VER`/`SWV`）、`sw.js`（`VERSION`）。
- **验证**：`node --check` 三文件语法通过；本地起静态服务用 Chromium（1600×900）实测——阅读页 `.container` 类名含 `container-wide`、实测宽度 1293px（占满 `.main` 可用宽，修复前被限制在 1180px 居中），`.doc-body` 正文正常渲染；首页仍为限宽 `container`（未受影响）；页面 `console` / `errors` 均为空，`unload` 告警消失。

### 2026-09-15 · feat: 技术教程补全 Java后端 / 网络与OS / 数据库(DBA) / 前端 四大方向实战正文（缓存版本 `20260915a→20260915b`）

- **为什么**：09-14k 搭了「学」版块与 6 个方向的目录骨架，但 Java后端、网络与操作系统、数据库/DBA、前端 Web 四大方向一直只有「建设中」占位。本次按用户要求——**详细、完整、有条理、通俗易懂，像 10 年以上老 IT 人写的实战经验教程**——一次性补全为 61 篇标准实战篇。
- **规模**：Java 19 章（基础6/中级7/高级6）、网络 13（4/5/4）、DBA 14（4/5/5）、前端 15（5/5/5），共 **61 篇**；每篇统一按 ①原理讲解 → ②实战案例（可复用命令/代码/配置）→ ③⚠ 踩坑与经验 → ④✅ 可勾选排障清单 结构撰写，并强制标注 `applies`（适用版本/技术版本，防过时）与 `updated`（最后更新）；`terms` 关键词用于章末自动挂本知识点的题库题，实现学练闭环。
- **架构改动（关键点）**：4 个方向从 `js/docs-data.js` 内联骨架拆为独立文件 `js/docs/{java,network,dba,frontend}.js`，各自 `window.JAVA / window.NETWORK / window.DBA / window.FRONTEND` 全局暴露；`docs-data.js` 仅保留 devops/security 两个骨架并排到末尾，组装时 `concat([window.JAVA, window.NETWORK, window.DBA, window.FRONTEND])`。顺带修掉旧 `docs-data.js` 把未建设方向排到已建成方向之前的排序 bug，侧栏顺序固定为 **运维/SRE → Java → 网络与OS → DBA → 前端 → 云原生/DevOps → 安全**。
- **改动面（保持最小、不丢功能）**：`index.html` 在 `docs-data.js` 之前挂载 4 个新 script（均带 `?v=20260915b`）；`sw.js` `VERSION="20260915b"` 预缓存新增 4 文件；正文 Markdown 代码围栏用 `${F}`、行内代码用 `${C}` 占位（避免与 JS 模板字符串冲突），shell 变量写成 `\${VAR}` 防插值报错。
- **验证**：`node tools/validate-docs.js` → ASSEMBLE_OK（7 方向、95 章、顺序正确、0 空骨架、0 缺失 terms）；4 文件 `node --check` 语法全过；单文件加载测试 61 篇 `termsLinked` 全满；线上 fetch 实测 `index.html / docs-data.js / java.js / network.js / dba.js / frontend.js / sw.js` 全部 200 且含 `20260915b`，旧功能标记词（`share-btn` / `review-banner` / `weakGrade` / `pageReview` / `todayFive` 等）齐全、无功能丢失。
- **待办**：云原生/DevOps、安全 两个方向仍是目录骨架（章节占位、正文待补），后续按同规范直接改 `js/docs/*.js` 即可，无需动组装逻辑。

### 2026-09-15 · refactor: 侧栏「学习文档 / 学习路线图」更名「技术教程 / 刷题计划」（缓存版本 `20260913k→20260915a`）

- **为什么改**：两个入口原名都以「学习」开头并排挂在侧栏，用户分不清该点哪个。两者定位本就不同——「学习文档」是**看文章学知识**（方向 × 初/中/高级成套教程），「学习路线图」是**排计划去刷题**（岗位题库自动拆成 4–8 周计划）。新名字直接把「读」和「练」区分开。
- **改动面**：纯显示文案更名，**路由不变**（`#/docs`、`#/roadmap` 照旧，收藏夹/分享链接均不受影响）。涉及 `js/app.js`（侧栏、首页 CTA、计划页标题/面包屑/空态/练习页上下文条）、`js/docs.js`（页面标题/面包屑）、`js/guide.js`（使用指南两节）、`README.md`。
- 冒烟测试 26/26 通过。

### 2026-09-14k · feat: 新增「学」版块 —— 技术学习文档（方向 × 初级/中级/高级，缓存版本 `20260913j→k`）

- **定位**：站点从「面试题库」向「IT 学习与成长平台」演进的第一块。文档按**技术方向 × 分级**组织，一个方向一套文档，从初级第一章顺序读到高级最后一章 = 一条完整成长路线。与题库互补：文档负责系统地学，题库负责练和面。
- **新增文件**：
  - `js/docs-data.js` —— 文档数据。运维/SRE 方向**初/中/高共 9 篇完整正文**（Markdown）；Java 后端、前端 Web、数据库/DBA、云原生/DevOps、网络与操作系统、安全共 6 个方向先放**目录骨架**（标「建设中」，既是给用户看全貌，也是内容待办清单）。
  - `js/docs.js` —— 阅读器。三个页面：`#/docs`（方向列表 + 进度）、`#/docs/<dir>`（分级目录 + 进度条）、`#/docs/<dir>/<level>/<chapter>`（左侧 sticky 目录树 + 正文 + 上一章/下一章 + 标记已学完 + 章末挂题）。样式以内联 `<style>` 注入，未改全局 `style.css`。
- **文档正文规范**（后续补内容统一照此执行）：① 原理讲解 → ② 实战案例 → ③ ⚠ 踩坑与经验 → ④ ✅ 可勾选排障清单；每篇强制标注 `updated` 与 `applies`（适用版本，防过时）；`terms` 关键词用于章末自动挂本知识点的题。
- **改动面（刻意保持最小）**：`js/app.js` 仅加 1 条路由 case + 1 行侧栏入口 + 1 个首页按钮；`js/utils.js` 加 `bookOpen` 图标；`index.html` 加 2 个 script 引用；`sw.js` 预缓存加 2 个文件。现有页面零改动。
- **进度存储**：`localStorage` 键 `docs_progress`（本机，暂未并入云端同步体系）。
- **验证**：本地真实浏览器 CDP 验收 **22/22 通过**、零页面异常（方向列表/分级目录/阅读页渲染、代码块与表格、踩坑区、排障清单、上下章、章末挂题自动匹配到 Linux 相关题、标记已学完并同步目录打勾、骨架方向显示「建设中」）。
- **使用指南**：`js/guide.js` 同步新增「📘 学习文档（「学」版块）」整节（硬性规则：用户可见功能必须同步指南）。

### 2026-09-14j · docs: 站内「使用指南」同步最近三版更新（缓存版本 `20260913i→j`）

- **为什么**：h/i 两版加了新的用户可见机制，但 `js/guide.js` 自 09-13 起未同步 —— 用户按指南操作会踩不到新入口，也看不到新提示的含义。
- **补入内容**：
  - 「👤 账号与数据」新增「**修改自己的密码**」——说明入口在「站点 → 账号」页，改完本机不掉线、只踢其它设备。
  - 「🛠️ 管理员」新增「**账号管理（服务器端）**」——说明可查看/启禁用用户、给他人重置密码；明确「重置密码会清空该用户全部登录状态、不能对自己使用，系统会拦下并指路『账号』页」。
  - 「❓ 常见问题」新增 3 条：**右下角「有新版本，点击刷新」胶囊**（点一下即可，无需手动清缓存）；**点登录报「连不上服务器」**（报错已带页面版本号 → 先 Ctrl+F5 刷新，再试「自动选择可用入口」）；**提示「需要管理员权限」**（登录态已失效，重新登录即可）。
  - 页脚「文档最近更新」改为 2026-09-14。
- **验证**：`node --check js/guide.js` 通过；逐处 `grep` 复核 4 处改动全部落盘；版本统一 `20260913i→j`（`index.html` 26 处 `?v=` + `PAGE_VER` + `SWV`、`sw.js` `VERSION`）。

### 2026-09-14i · fix: 自锁治理 —— 禁止「重置密码」改自己 + 新增自助改密码（缓存版本 `20260913h→i`）

- **现象**：管理员登录后打开「帐号管理」，页面显示「加载失败 / 需要管理员权限」。
- **根因（数据侧实证）**：D1 里该帐号 `last_login_at` = 当天 08:53:54（登录确实成功过），但 `sessions` 表里**没有它的任何会话**，且 `pass_hash` 已不是原密码的哈希。全库能同时造成「改哈希 + 清会话」的只有一处 —— `POST /admin/users/:id/reset`。也就是说：用户在帐号管理页对**自己那一行**点了「重置密码」，于是把自己踢下线、且新密码未知；再登录必然 401，重进帐号管理则 403 → 前端渲染成「加载失败 需要管理员权限」。
- **设计缺陷**：账号页此前**没有「修改自己的密码」入口**，唯一改密途径就是帐号管理里的管理员重置 —— 对自己执行即自锁（上一版我还建议用户走这条路，教训）。
- **修复**：
  - `cloudflare/worker.js`：`handleAdminResetPassword` 加**自锁守卫**（`targetId === admin.id` → 400 并指引去「帐号」页）；新增 **`POST /auth/password {oldPassword,newPassword}`** 自助改密 —— 校验旧密码、新密码 8-72 位且不等于旧密码，**保留当前会话**、删掉其它设备会话。
  - `js/account.js`：账号页登录态新增「修改密码」表单（旧密码/新密码/确认）；帐号管理页对自己的行不再渲染「禁用/重置密码」，改为提示「当前登录帐号」；403 分支不再只显示「加载失败」+权限文案，而是给出「重新登录」按钮与「会话可能已被重置密码/禁用」的说明。
- **验证（线上真机 11/11）**：重置自己→400 守卫文案；重置他人(999)→404（证明守卫只拦自己）；旧密码错→401；新密码过短→400；改密成功→200；**改密后原会话仍 200（不自锁）**；旧密码登录→401；新密码登录→200；改回后登录→200。Worker 版本 `276a2a8d`。
- **过程教训**：同一文件的多处改动**不要在一次消息里并行 edit** —— 本次并行编辑 worker.js 的守卫与路由时两次编辑被静默覆盖，导致「代码已改、部署成功、线上仍是旧逻辑」（部署版本号正常，但行为不对）。正确做法：逐处串行编辑 + 每次 `grep` 复核落盘，再部署。

### 2026-09-14 · fix: 登录必失败的真凶 —— `/auth/login`、`/auth/me` 响应漏传 `origin`（CORS 缺 ACAO）

- **现象**：用户在已升级到 `20260913h` 的页面点「登录」→ 报「连不上服务器（API 暂不可达）（页面版本 20260913h）」。**curl 直连一切正常**（登录 200、/stats 200），极易误判为「用户环境问题／缓存问题」。
- **定位方法（关键）**：在真实浏览器里复刻登录路径并抓 CDP 网络事件，得到决定性证据 —— `POST https://iti-api.netlify.app/auth/login` 在 `OPTIONS` 预检 200 之后，本体请求以 **`net::ERR_FAILED`** 结束；而 `GET /stats` 正常。
  原因：**GET 是「简单请求」不触发 CORS 预检，POST + `Content-Type: application/json` 会触发预检，且响应本体必须自带 ACAO**。两个响应缺 ACAO：
  - `handleLogin` 成功响应 `jsonResp({ token, user: publicUser(u, origin) })` —— 漏传 `origin` → 登录成功响应无 ACAO → 浏览器判 CORS 失败 → 用户侧表现就是「连不上服务器」；
  - `handleMe` 响应同类问题 → 启动时 `refreshMe()` 静默刷新也会失败。
  **curl 永远测不出来**（curl 不做 CORS 检查），这是本次排查绕远路的根因。
- **修复**：两处补传 `origin`；Worker 部署版本 `91b4c162`。浏览器复验：`Account.login()` → `{ok:true, ms:2711}`，`isServerAdmin() === true`，`/me/data` 同步也正常。
- **永久防线**：新增 `tools/check-cors-origin.mjs` —— 静态扫描 `cloudflare/worker.js` 全部 `jsonResp()` 调用是否都带 `origin`（含反向测试验证：故意去参时正确报 L270）。已确认 39 个调用点全部合规。
- **测试基线补强**：`_live_domestic.mjs` 新增 2e「页面内 POST 登录链路可用（预检通过 + 响应带 ACAO 可读）」；1a 改为轮询等待（避免冷启动下误报）。

### 2026-09-13h · fix: 长超时跟「桥」走而不是跟「第一位」走（缓存版本 `20260913f→g`）

- **现象**：用户真机再次出现「连不上服务器（API 暂不可达）」。桥实测正常（冷启动 13.9s、热态 1.3s），但 `20260913e` 的 20s 长超时**只给调用顺序第一位的入口**——一旦 pick 记住了别的入口（如 workers.dev，DNS 被墙秒失败）排在首位，Netlify 桥落到第二位只有 8s 预算，冷启动 13s+ 必被误判「不可达」。
- **修复**：`account.js` 探测与调用两侧均改为**按入口特征给超时**——`/netlify\.app/` 命中的入口无论排第几都给 20s（`probeLim`/`callLim`），其余候选维持 6s/8s 快速失败。
- **回归**：`node --check` 通过；启动自动择优 26/26（含慢端点冷启动专项）。

### 2026-09-13h · fix: 旧标签页自愈 —— SPA 页面版本自检 + 报错带版本号（缓存版本 `20260913g→h`）

- **根因确诊（用户第 4 次报「连不上服务器」后）**：本站是 SPA（哈希路由），**整页从不刷新**——当天早些时候打开的标签页会一直跑内存里的旧 JS（如 8s 超时旧版），新版修复对它无效，且 SW 的每小时 `reg.update()` 只更新 Service Worker 本身、**不会刷新页面 JS**。无头 Chrome 全新 profile 复测 g 版 20/20（含 14.7s 冷启动），后端与新前端均正常，坐实「旧标签页」是唯一残因。
- **修复**：① `index.html` 补上漏改的 SW 注册戳 `SWV`（`20260913e→h`）；② 新增**页面版本自检**：每 5 分钟 `fetch("sw.js", {cache:"reload"})` 比对 `VERSION` 与 `window.PAGE_VER`，不一致立即弹「有新版本」胶囊（比每小时 SW 检查快 12 倍，不依赖 SW 安装事件）；③ `account.js` 的「连不上服务器」报错**带上 `window.PAGE_VER`**——以后用户贴报错即可直接判断是否旧标签页，并把「先刷新页面」写进用户文案。
- **回归**：`node --check` 通过；启动自动择优 26/26。

### 2026-09-13g · fix: 管理权限体系统一（第一步）—— 帐号管理页改服务端角色鉴权（缓存版本 `20260913e→f`）

- **背景**：① 前端管理入口门禁一直是旧单机时代的本地密码（`auth.js` 的 `Auth.isAdmin`，sessionStorage 标记），与服务端 D1 `role` 完全脱节——role=user 也能看到管理入口，点进「帐号管理」被后端 403；② 用户账号在 D1 切换重建时 role 丢失（库里唯一 admin 是种子账号），已在库内提权；③ 上一轮 `jsonResp` 签名重构（`eec5a04b`）没同步调用点，27 处参数错位 + 1 处逗号表达式 + `/me/data` 漏传 origin，导致管理列表/注册/全部错误分支 500（CF 版本 `5762292d` 已修复上线）。
- **本版改动**：`account.js` 新增 `isServerAdmin()`（读登录响应缓存的 role + token）与 `refreshMe()`（启动时静默 `GET /auth/me` 刷新本地用户缓存——库内提权/禁用无需重新登录即生效，401 自动清会话）；`app.js` 路由给 `#/admin/users` 单独加 `requireServerAdmin()` 守卫（其余管理页维持本地密码门禁，本地密码仅保留给题目编辑端）；顶栏「帐号管理」入口与服务侧栏「站点」区均按服务端角色显隐，`onAccountRefreshed` 回调在刷新后重渲染导航。
- **回归**：`node --check` 全过；smoke 26/26、启动自动择优 26/26、本地回归 62/62。

### 2026-09-13f · fix: 桥「浏览器跨域失败」追根 —— 根因是代理复制了 `content-encoding` 头（ERR_CONTENT_DECODING_FAILED，伪装成 CORS 故障）

- **现象**：`20260913e` 后真机复测发现——curl 直连桥一切正常（含正确的 ACAO 回显），但**浏览器页面内跨域 `fetch` 必挂**：响应状态 200 可见、body 读取抛 `TypeError: Failed to fetch`，症状极像 CORS 配置错误。同源请求正常、curl 正常、CDP 抓包显示响应头里 ACAO 明明存在，极具迷惑性。
- **根因（两层）**：
  1. **主因：内容编码错乱**。`netlify/functions/proxy.js` 把上游响应头**原样拷回**，其中包括 `content-encoding: br`；但 Node fetch（undici）的 `resp.arrayBuffer()` **已经把 body 解压成明文**了——响应「声称 br 编码、实际是明文」，Chrome 解码失败报 `net::ERR_CONTENT_DECODING_FAILED`，body 管道被渲染进程关闭。**curl 为什么一直正常**：curl 默认不发 `Accept-Encoding`，上游返回未压缩响应、无 `content-encoding` 头可拷——这就是「curl 通、浏览器不通」假象的根源。Chrome 控制台的 `net::ERR_CONTENT_DECODING_FAILED`（`Log.entryAdded` 才能看到）是唯一直指真相的日志。
  2. **次因：worker.js CORS 并发竞态**。模块级 `let _corsOrigin` 被并发请求相互覆盖，高并发下可能给请求 A 回了请求 B 的来源（或空）。已改为**纯函数式** `corsHeadersFor(origin)`，`origin` 沿调用链显式传递（Cloudflare Worker 版本 `eec5a04b` 已上线）。
- **修复**：① `proxy.js` 新增 `RESP_STRIP_HEADERS`，响应侧剔除 `content-encoding` / `content-length` / `transfer-encoding` / `connection` / `keep-alive`（Netlify 边缘会按 `Vary: Accept-Encoding` 自己正确压缩）；② 移除排查用的 `ACAO=*` 强制覆盖与 `x-debug-*` 调试头，ACAO 恢复 worker 的精确回显（fail-closed 白名单不受影响）。
- **验收（成都，绕代理）**：线上真机验收 **20/20 全部通过**（`_live_domestic.mjs`）——页面内跨域 `fetch /stats` 拿到真实统计（body 可读）、**题库从云端加载 1090 题**（此前停在 99 道种子题）、无「连不上服务器」文案、侧栏 12 项、0 条 JS 异常；br 编码 body 用 node `zlib.brotliDecompressSync` 解码验证为合法 JSON。
- **规范知识点（排查记录）**：按 Fetch 规范，`cors` 响应的 JS 可见头 = safelisted 集合（`cache-control`/`content-type` 等）+ `Access-Control-Expose-Headers` 列名，**`Access-Control-Allow-Origin` 本来就对 JS 隐藏**——「JS 里读不到 ACAO」不能作为 CORS 失败的判据；CORS 是否通过要看 body 可读性 + CDP 网络层 + Chrome 控制台错误。

### 2026-09-13e · feat: 后端国内可达（Netlify 直连桥）+ 入口启动自动择优（缓存版本 `20260913d→e`）

- **问题**：站点在**国内网络**下登录/云同步全部失败，提示「加载失败 连不上服务器（API 暂不可达）」，切 Wi-Fi / 4G 都无效、只能挂代理。根因不是服务器挂了，而是 **Cloudflare 的 `*.workers.dev` 域名在国内被 DNS 投毒**——实测 `it-interview-stats.iti-interview.workers.dev` 解析到 `104.244.46.208`（Twitter 的 IP 段）、泛域名解析到 `31.13.71.19`（Facebook 段），TCP 直接超时。
- **为什么不直接绑自有域名**：唯一可用的 CF zone 是 `itinterview.eu.org`，状态仍是 **pending**（eu.org 尚未批准、NS 未委派），Cloudflare 侧**暂时绑不上自定义域名**；`pages.dev` 更差——国内**直接 DNS 解析失败**（实测），所以「换 Cloudflare Pages」不是出路。
- **国内可达性实测结论（成都，绕代理真实网络）**：`netlify.app` ✅ / `deno.dev` ✅ / `onrender.com` ✅ / `railway.app` ✅ / `vercel.app` ❌污染 / `workers.dev` ❌污染 / `pages.dev` ❌解析失败 / `fly.dev` ❌解析失败。据此选了 **Netlify**（`app.netlify.com`、`api.netlify.com`、`www.netlify.com` 国内也均可直连，建号取令牌无需代理）。
- **新增：Netlify 国内直连桥**（仓库 `netlify/` 目录，代码为既有设计，本次正式上线）——`netlify/functions/proxy.js` 把方法/头/体/查询串**原样透传**到上游 Worker，逐跳头（`host`/`content-length`/`accept-encoding`/`cf-*`）剥离。已部署到 **`https://iti-api.netlify.app`**。
  - 全路径重写：`netlify/public/_redirects`（`/ → index.html`、`/* → /.netlify/functions/proxy`，**不带 `!`** 所以有同名静态文件时优先用文件，`/` 仍显示说明页）；`netlify.toml` 同步去掉 `force = true`（原本会把首页也吞进代理）。
  - **不削弱安全边界**：上游 Worker 的 CORS 白名单是 fail-closed（未知来源拿不到 `Access-Control-Allow-Origin`），桥原样透传 `Origin`，实测非白名单来源经桥后**依然没有 ACAO**。
- **新增：入口「启动自动择优」**（`js/account.js` `Account.autoProbe`）——此前 UI 里写着「桥接入口上线后会自动命中」，但 `probeEndpoints()` **只在手动点按钮时才跑**，承诺是假的。现在每次打开页面都会：先刷新同源 `api-endpoints.json`，再**后台静默**探测候选入口并写下第一个可用的。
  - **候选优先级刻意与调用顺序不同**：自动择优按「手动指定 → 远程配置 → 上次成功 → 内置兜底」，而 `A.endpoints()`（真正发请求的顺序）**保持原样不变**。原因：本机存的旧入口如果排在远程配置之前，就会一直压住刚发布的新入口，表现为「明明改了 `api-endpoints.json` 却还是连不上」——这正是本次要根治的坑。
  - **不会打扰用户**：手填过地址 → 完全不干预；上次成功入口还在 30 分钟内新鲜期 → 跳过不重复探测；全部不可达 → 静默失败、不清空原有 pick、页面照常可用。
- **报错文案瘦身**：原来那段「后端部署在 Cloudflare 的 workers.dev 域名上，该域名在国内被拦截，切换 Wi-Fi / 4G 都无效，只能挂代理访问…」对普通访客毫无帮助，改为一行可执行的提示（并保留完整信息在控制台 `console.warn` 供维护者排查）。
- **改了 `api-endpoints.json` 无需发版**：该文件同源、由 Service Worker 走 **network-first**（专为此留的应急通道），前端每次加载都会拉取，改它即可全量切换后端地址。
- **运维踩坑（重要）**：Netlify 新版免费套餐建站后 **`sso_login` 默认是 `true`**，任何访客都会被 401 重定向到 `app.netlify.com/edge-access` 登录页——表现为「桥部署成功了但访问不了」。需 `netlify api updateSite --data '{"site_id":"...","body":{"sso_login":false}}'` 关掉。`tools/deploy-netlify-bridge.sh` 已重写（旧脚本的 node 路径 `22.22.2-2` 已失效；改用 `--site-name` 自动建站，比手写 `api createSite` + `customDomain` 稳），并把站点 ID / URL 落地到 `netlify/.site-id` / `netlify/.site-url`。
- **冷启动追根修复（`20260913e`）**：桥上线后真机复测发现——**探针 6s / 正式调用 8s 的超时都扛不住 Netlify Functions 冷启动（实测 13~19s）**，表现为「首次访问仍报连不上，刷新一次（桥已热）才好」。这不是偶发，是超时参数必然踩雷。修复：**候选首位入口给 20s 长超时**（`PROBE_FIRST_MS` / `CALL_FIRST_MS`，探针与正式调用一致），其余入口维持 6s / 8s 快速切换不拖慢故障转移；测试基建新增「慢端点 8773（9s 延迟）」专项回归，断言**慢但活着的首位入口能被正确选中**。
- **版本**：`20260913c` → `20260913d` → `20260913e`（`index.html` 25 处 `?v=` + 1 处 SW 轮询版本；`sw.js` `VERSION`）。
- **验收**：① 桥逻辑本地 mock 上游 **19/19**（路径+查询串透传、POST/Auth/Origin 头透传、JSON 体不被破坏、OPTIONS 预检、CORS 白名单不被削弱、逐跳头剥离、上游挂掉降级 `502 bridge_upstream_error`、带 `/.netlify/functions/proxy` 前缀的路径还原）；② 「启动自动择优」真机回归 **26 项**（`_probe_test.mjs` + `_probe_server.py`：两个可用假端点 + 一个死端点 + 一个慢端点，覆盖启动切换、配置优先于旧 pick、新鲜跳过、手动不干预、force 重测、全不可达不崩、**首位慢入口（冷启动）长超时选中**、`A.endpoints()` 顺序无回归、后台设置页按钮可用）；③ **线上端到端实测（成都、绕代理）**：`GET /stats` 200 返回真实数据、`OPTIONS /auth/login` CORS 三头齐全、`POST /auth/login` 返回 Worker 真实错误体 `{"error":"邮箱或密码不正确"}`、非白名单 Origin 无 ACAO。

### 2026-09-13d · fix: 弱网下「静默只有 99 道种子题」的加载可靠性修复（缓存版本 `20260913c`）

- **问题**：`js/cloud.js` 的 `fetchT` **没有重试**，`fetchRemote` 超时直接返回 `null`，启动时 `syncIfNeeded` 也不重试 —— 而首次拉取 **1.5MB** 的 `data/published.json` 只给 **8 秒**超时。超时后访客就停在 `data/seed.js` 的 **99 道示例题**，界面**没有任何提示、也不会再自动重试**，用户只会以为「这站题库怎么这么少」（真机与无头环境均已复现）。
- **拉取层**：`fetchRemote` 重写为「**单次超时 25s（首次全量档）+ 最多 3 次退避重试（0.9s / 1.8s）**」，最近一次结果记在 `Cloud.lastFetch()` = `{ok, reason, attempts}`，让上层能区分「云端确实没有这个文件」与「网络失败/超时」；`404/403` 视为「云端无快照」**不重试**（省掉无谓等待）。非关键调用改走短档 —— 发布守卫 / 本地对比 / 导出 2 次 × 8s，编辑端启动吸收 2 次 × 15s，**不拖慢发布链路**。
- **启动层**：`syncIfNeeded` 返回 `{failed:true, detail, attempts}` 后，`app.js` 调 `armSyncRecovery()`：① 弹**常驻**警告提示（`timeout:0`）+「**立即重试**」按钮；② 监听 `online` / `visibilitychange`，**网络恢复或页面回到前台自动重试**；③ 启动完成后 20 秒再自动补一次（应对「刚打开那几个请求都慢」）；④ 补全成功**原位刷新**（`Services.reload()` → 侧栏/顶栏/当前路由重渲染，异常则整页刷新）。
- **刷新也不卡住**：`syncIfNeeded` 里「本机有数据但从未同步」原本一律返回 `pending` 让用户自己去设置页手动同步；现在若本机是**清一色种子题**，直接采用云端版本 —— 否则访客**刷新多少次都还是 99 题**。
- **防护栏（绝不覆盖用户数据）**：`Cloud.looksUnseeded()` 的判定是「非编辑端 + 从未同步过 + 题数 ≤ 400 + **所有题的 `source` 都是 `seed`**」。本机只要存在任意一道 `import` / `ai` / `manual` / URL 来源的题，就仍走 `pending` 由用户确认，自动覆盖不生效（有独立回归项专门隔离验证这条）。
- **`U.toast` 增强**：新增第 4 个参数 `opts.action = { label, onClick }`（提示右侧操作按钮）与 `timeout = 0`（常驻不自动关闭），并返回元素便于调用方主动关闭；既有调用全部向后兼容（`css/style.css` 追加 `.t-act` 样式）。
- **版本**：`20260913b` → `20260913c`（`index.html` 24 处 `?v=` + 1 处 SW 轮询版本；`sw.js` `VERSION`）。
- **验收**：新增 `_sync_test.mjs`（CDP）+ `_sync_server.py`（可按开关对 `data/published.json` 注入 503 / 延迟）。**A 段 12 项**直测重试成功 / 持续失败 / 超时 / 404 不重试 / `pending` 语义 / toast 操作按钮与常驻；**B 段 13 项**在真机跑完整链路：注入 503 → 首页仍可用且只剩 99 题 → 出现常驻警告与「立即重试」→ 移除故障 → 点按钮 → 补全到完整题库（线上 1090 题）+ 成功提示 + 原位刷新 → 刷新后不退化、路线图 39 个岗位卡正常。另有既有 62 项全量回归 + 指南 9 项 + smoke 26 项确认零退化。
### 2026-09-13b · fix: 恢复「关于本站」页（`#/about`，缓存版本 `20260913b`）

- **问题**：`#/about`「关于本站」页自 **2026-09-05** 起从线上消失。逐提交核对确认：`b6690b90` / `c5980c7e`（09-01）**存在**，`62b62304`（09-05 03:07「首页统计卡片加圆环」）起**丢失** —— 路由 `case "about"`、侧栏 `navItem`、页脚链接、`pageAbout()` 函数、以及 `css/style.css` 里 **71 处 `.about-*`** 样式被一次「用陈旧副本覆盖」整块抹掉，但 `assets/qrcode-yueji-shuyu.png` 还在。与本次路线图改动无关（改动前本地 `js/app.js` 与线上**逐字节相同**）。
- **修复**：从 git 历史 `c5980c7e` **原样取回** `pageAbout()`（114 行）与 CSS 块（182 行），**增量插入**当前仓库的实际落点 —— 路由 `case "about"` 在 `help` 之后、侧栏 `navItem` 在「使用指南」之后、页脚链接在「使用指南」与 GitHub 之间，**未改动任何既有函数体**。侧栏 11 → **12 项**。用到的 14 个图标（`info` `sparkles` `layers` `grid` `briefcase` `clock` `database` `search` `barChart` `star` `shield` `fileText` `user` `link`）在 `js/utils.js` 中**均已存在**，无需补。
- **版本**：`20260913a` → `20260913b`（`index.html` 24 处 `?v=` + 1 处 SW 轮询版本；`sw.js` `VERSION`）。
- **验收**：本地无头回归 48 项 + 15 个既有页面逐页未退化，另加 `#/about` 专项（标题 / 统计卡 / 三个板块 / 二维码图片 / 侧栏高亮）；指南页 9/9、`smoke-test` 26/26、`node --check` 全通。
- **恢复脚本**：`_restore_about.py`（默认 dry-run，`--apply` 落盘；含「已存在则不重复插入」「锚点唯一」等幂等断言）。

### 2026-09-13c · fix: 自动化「同步元文件」把 README/HANDOVER 回退的根因修复

- **现象**：2026-09-13 10:47，每日扩充流水线以提交「自动扩充：同步元文件（README.md / HANDOVER.md）」把线上这两个文档**整份覆盖成旧版本** —— README 的 `### 2026-09-11` 整节消失、HANDOVER 第 1 节路径退回旧值。**同一个病根在 09-05 抹掉了「关于本站」页**：凡是「拿陈旧副本整份覆盖线上」的操作，都会静默丢掉别人后加的内容。
- **根因**：自动化 `automation-1787794568568`「题库定期自动扩充」的工作目录是旧副本 `C:\Users\Life\Desktop\iti-dedup2`（branch `restore-features`，HEAD 停在 2026-09-01）。它第 2 步只 `curl` 覆盖 `tools/` 下的脚本，**README.md / HANDOVER.md 用的是自己磁盘上的陈旧副本**；第 8 步再通过 GitHub API **按文件整份 PUT**，线上因此被旧内容覆盖。已核对：回退提交 `86dcea4f` 的 README blob 与 `iti-dedup2/README.md` **逐字节相同**。
- **本次修复**：① 把 `iti-dedup2` 的 `README.md` / `HANDOVER.md` 换成当前正确版本（消除陈旧副本这个隐患本身）；② 自动化提示词第 2 步新增**带护栏的** README/HANDOVER 同步（先下载到临时文件，校验**体积 > 20000 字节且含 `## 更新日志`**才覆盖，否则保留本地并**跳过该文档推送**），第 8 步加硬闸门「推送前必须确认文件含已上线功能条目（`岗位学习路线图` / `关于本站` / `移动端体验三件套`），缺任一即视为旧副本、禁止推送」。
- **影响面核对**：2026-09-13 当天 `main` 上该自动化的提交里，只有 `README.md` / `HANDOVER.md` 属「整份覆盖」型风险；`tools/classic-topics.json`（第 2 步已 `curl` 保护）、`tools/batches/*`、`q/*.html`、`data/published.json`（走 Contents API，内容来自线上同步）均为正常产物。
### 2026-09-13 · feat: 岗位学习路线图（缓存版本 `20260913a`）
- **新功能：把岗位题库变成 4–8 周的学习计划。** 站点已有 142 个岗位、1090 道题（2026-09-13 线上实测），但用户面对的是一棵 239 个叶子分类的树 —— 不知道从哪开始、学到哪算完。新路由 `#/roadmap`（列表）+ `#/roadmap/<岗位 id>`（详情），侧栏在「岗位体系」下方新增「学习路线图」入口。
- **周计划算法**（`js/roadmap.js`）：按 `categoryId` 分组 → 计算每组题量与平均难度 → 按「简单优先」顺序对每组做贪心装箱、每次放进当前题量最少的那一周 → 周内按难度由浅入深、同难度按热度排序 → 各周按平均难度升序编号。**超大分类先按周容量切片**（标题带「（续 N）」），否则「后端开发」这类岗位会被一个巨型分类吃掉好几周。题量少时保底 4 周、多时封顶 8 周（线上实测：`#41 后端开发工程师` 286 题 → 8 周，每周 34/37/35/35/35/37/37/36 题；`#2 数字电路工程师` 20 题 → 保底 4 周，每周 4/4/8/4 题；29 题按同规则为 4 周 5/8/8/8）。
- **每周卡片**：主题名（主分类过半直接用分类名，占三分之一以上标「为主」，再碎叫「综合强化」—— 刻意不做「A + B」并列，装箱拼出来的组合往往是凑数结果，读起来莫名其妙）、题量、预计时长（每题 ≈6 分钟）、每日题量（按 7 天分摊）、分类标签（>8 个折叠为「其余 N 个技术点」）、难度分布、进度条。展开后列出题目行，行首圆圈勾「已掌握」，点标题进详情页。
- **性能**：题目行**按需渲染** —— 只渲染当前展开的那一周，切周时才补渲染；286 题的大岗位首屏只有 1 周的 DOM，不会因为一次性铺开 286 行而卡顿。
- **进度存储**：IndexedDB `settings` 表的 `roadmapMastered`，值为**扁平集合** `{题号: 时间戳}`（250ms 合并写入）。选扁平集合而非「按岗位记」的原因是：同一道题可能同时属于多个岗位，扁平集合天然对所有路线图生效，也不用在岗位被删后清理孤儿数据。它落在既有 `settings` 表里，因此**自动随个人加密云备份与账号同步走**，换设备不丢。
- **与刷题页打通**：`#/practice?scope=roadmap&pos=<id>&week=<n>`。题池由 `Roadmap.weekQuestionIds()` 计算，与路线图页**完全同源**（实测练习页题池数与路线图该周题量逐项相等）；练习页显示「来自「XX」学习路线图第 N 周」上下文与返回入口，切难度/模式时保留岗位与周次。反向也通了：在刷题页点「已掌握」会自动 `Roadmap.markMastered()` 记入路线图。
- **本轮改动清单**：新增 `js/roadmap.js`；`js/app.js` 加路由分支、侧栏入口（侧栏 10 → 11 项）、`pageRoadmap`/`pageRoadmapDetail` 两个页面、`runPractice` 的 `mark("master")` 处一行回写调用、`pagePractice` 的 `scope=roadmap` 题池分支（均为增量插入，未改动任何既有函数体逻辑）；`js/utils.js` 图标表新增 `map`；`css/style.css` 末尾追加 `.rm-*` 样式块；`index.html` 版本号 24 处（唯一版本值）+ 新增脚本标签 + SW 轮询版本；`sw.js` `VERSION` 与 `APP_SHELL`（**必须**加 `js/roadmap.js`，否则离线时该页白屏）；`js/guide.js` 站内使用指南新增「🗺️ 学习路线图」章节（TOC 同步，且顺手把过时的「279 个分类」更正为 276），「文档最近更新」改为 2026-09-13；`HANDOVER.md` 第 6 节刷新。
- **验收**：本地无头浏览器（headless Chrome + CDP）回归 **48 项全绿** —— 列表页 39 张岗位卡、周数落在 4–8、默认展开「继续学习」那一周、懒渲染确实只渲染 1 周、单题勾选后行样式/周计数/顶部总数/进度条/IndexedDB 五处同步、刷新后进度仍在、返回列表页进度条同步（构建缓存失效生效）、整周批量标记与回退、练习页题池与路线图该周数量完全一致、刷题「已掌握」自动回写、以及 **15 个既有页面逐页未退化**（首页/技术体系/岗位体系/岗位详情/题目列表/题目详情/刷题/模拟面试/收藏/历史/错题/全景/指南/岗位题目/路线图，侧栏均为 11 项）；另有站内指南页专项校验 **9/9**（TOC 含新章节、`#help-roadmap` 锚点与正文、锚点可点、更新日期、数字更正、无 `undefined/NaN` 泄漏）；`node --check` 全部通过、`smoke-test` **26/26**。
- 顺带记录一个**本次未修**的既有问题：`#/questions` 的分页条在窄屏不换行，`document.scrollWidth` 会涨到 1320px 造成整页横向滚动（首页/岗位/路线图等页面实测为 0 个溢出元素，基线 562px 是无头 Chrome 的最小窗宽所致，非本页问题）。

### 2026-09-11 · fix: 发布链路抹掉 `removedQuestions`；fix: sitemap 漏收 21 个分享页；feat: 移动端体验三件套（缓存版本 `20260911b`）
- fix: **`sitemap.xml` 补回 21 条遗漏的分享页收录**（题号 `1086–1106`，`1053 → 1074` 条）。今天「自动扩充：补充 21 个新题分享页」那批任务把 21 个页面生成好也推上去了（站内与两个分支实测都是 200），但**漏了更新站点地图** —— 页面存在、只是搜索引擎发现不到。已补齐，条数恢复「静态 5 条 + 题数 1069」的规律；`verify-publish.py` 的「sitemap 条数 < 题数」告警随之消除。
- fix: **云端题库快照里的 `removedQuestions` 整个字段不见了**（本应有 37 条映射）——它一旦缺失，被合并掉的重复题会被编辑端下次自动发布**整包推回**（题数不减，发布守卫拦不住），用户本地的收藏 / 浏览 / 错题记录也会重新变成指向不存在题目的死记录。
- fix: **根因是发布链路缺字段，而不是「忘了写」**。`js/cloud.js` 的读取侧一直是完整的（`C.applyRemovedQuestions` 清理本机 + 重定向用户数据、`absorbRemote` 里的条数比对、`C.getRemovedMap` 缓存本机 `removedMap`），但**发布侧 `C.exportAll()` 构造快照时不带这个键**，于是编辑端每自动发布一次就把云端映射抹掉一次。
  - 现在 `C.exportAll()` 按 **`云端 ∪ 本机 removedMap`** 合并后随快照发布，**只增不减**（与发布守卫 `guardAgainstShrink` 同源：以云端为权威基线、叠加本机累积）；两端都读不到来源时不写这个键，避免凭空造空对象反过来覆盖云端。
- feat: 工具 `tools/merge-dup-questions.py` 新增 **`--rebuild-removed`**：合并已完成、映射却丢失时的恢复模式（此时 `--apply` 已跑不动，`validate` 会因「被删题既不在库中、映射里也没有记录」直接报错退出）。只补映射、不动任何题目内容、不重复累加热度，幂等，映射冲突即报错不写盘。
  - 已补回 **37 条**映射（37 个被删题号 → 34 道保留题，其中 `43+139→906`、`4+100→929`、`140+42→907` 为三版合一），`version 4 → 5`，题数**仍 1069**，数据文件仍是**单行紧凑 JSON**。
- 验证：`removedQuestions` 与 `tools/dup-merge-plan.json` 逐条一致；被删题 0 条仍在库、保留题 0 条缺失；37 个被删题号的静态分享页全部已是跳转页、`sitemap.xml` 无残留。
- 缓存版本 **`20260911a`**（`index.html` 23 处 + `sw.js` `VERSION`）。已打开的旧标签页会看到右下角「有新版本」胶囊，点一下即生效。
- feat: **移动端体验三件套（缓存版本 `20260911b`）** —— 手机上刷题以前要「够」按钮，这次把操作挪到拇指区：
  - **底部 tab 栏**：`≤720px` 时在屏幕底部固定「首页 / 题库 / 刷题 / 错题 / 收藏」，错题项带待复习角标（与侧边栏同源计数）。桌面端由 CSS 完全隐藏，零影响。层级 `z-index:60` —— 高于顶栏、低于抽屉遮罩与弹窗，不压任何浮层；抽屉展开时自动隐藏，避免叠在半透明遮罩下产生「还能点」的错觉。同时把主内容底部留白（`50px → 102px`）、Toast 与新版本胶囊一起抬高，确保没有任何元素被 tab 栏压住。
  - **左右滑切题**：题目详情页与刷题练习页支持「右滑上一题 / 左滑下一题」。刻意**不重新实现导航** —— 滑动直接触发页面上已有的上一题/下一题按钮，与键盘快捷键走同一出口，顺序、同分类循环、练习进度与完成判定全部与手动点击一致。仅触摸设备生效；纵向意图明显、位移不足 60px、从屏幕边缘 28px 内起滑（系统返回手势区）、起点落在输入框/代码块内均不响应；`#/mock` 的「提交面试」不会被误滑触发。
  - **「我的批注」**：题目详情页新增批注卡片，写下自己的想法 / 踩过的坑 / 面试时打算怎么讲。**展开答案时，你自己的话会显示在标准答案上方**（先想自己的、再对标准答案）；错题重练页的复习卡片也带一行批注摘要。数据落在新增的 IndexedDB `notes` 表（`db.version(4)`），**只存本机、不随题库快照发布上云**，并已纳入加密云备份与自动备份钩子（`backup.js`，清缓存/换设备可恢复；旧备份无此字段时不会清空现有批注）。
- fix: 批注卡片插入后，详情页快捷键提示原来用 `$(".pill-row")` 挂载，会命中**批注卡片内的按钮行**（文档顺序靠前）导致「快捷键：Space 翻答案」错位显示 —— 改为明确挂到「上一题 / 下一题」那一行。
- 站内「使用指南」同步新增「手机滑动切题 / 底部快捷导航 / 我的批注」三条，并把过时的「手机长按无此烦恼」改写为电脑端快捷键说明。
- 验收：无头浏览器实测 **25 项全绿**（移动端断点命中、tab 栏 5 项 5 图标贴底满宽且当前页高亮、主内容底部留白 102px、侧栏 10 项仍完整、批注保存与退出重进后持久、滑动切题成功、纵向滚动/微位移/边缘起滑/输入框内滑动均不误触、6 个页面 tab 栏共存），`node --check` 全部通过。

### 2026-09-02 · 「关于本站」页视觉升级（缓存版本 `20260902b`）
参考主流 about 页重做视觉，解决「样式单调、颜色寡淡」：品牌渐变 Hero 横幅（蓝→靛→紫 + 青/粉柔光斑 + 玻璃质感 chip）；4 张统计卡悬浮叠在横幅下沿，各带蓝/紫/青/橙彩色图标底，hover 上浮 3px；卡片标题改「彩色图标方块 + 主标题 + 副标题」双行头；三宫格 tile 加图标 + hover 浮起；适用人群改带图标胶囊；站长区新增渐变头像「阅」+ 5 个领域标签；信条改渐变底引用条；联系卡淡蓝渐变底，二维码 172px 圆角 + 大阴影 + hover 放大；收尾标语改渐变文字。颜色全部走 CSS 变量 + `--accent` 内联变量，深色模式自动适配（`color-mix` 不支持时回退 `--bg-subtle`）。

### 2026-09-01 · 新增「关于本站」页（缓存版本 `20260902a`）
介绍站点定位、站长公众号「阅己书语」、联系方式（含公众号二维码绿底引导卡）。三段卡片：关于本站（三大价值点用「四字标题 + 一句说明」、信条作引用条）/ 关于站长 / 联系我（公众号绿底引导卡原图直接放、点击放大）。4 个动态统计卡片（题目/技术体系/岗位/最近更新）从 Services 实时读取，每天 10:00 自动扩充后数字自动涨。侧边导航与 footer 同步加「关于本站」入口，路由 `#/about`。

### 2026-09-01 · 全景图点击直达题单 + AI 视图聚焦（缓存版本 `20260901g`）
- fix: **点分类/岗位/题目「回不到对应题」**——根因 `onNodeClick` 把带 `_catId/_posId` 的**分支节点**先判 `children` 走「展开/收起」，永远不跳，只有叶子才跳。改为**先判 id**：带 id 的实体节点（题 / 分类 / 岗位）点击直接 `App.go` 直达对应页；仅无 id 的纯结构节点（中心 / 演进层 / 时代阶段 / 来源支 / 体系支）保留点击展开/收起。岗位视图同此规则，点击岗位节点即直达其题单。
- fix: **AI 视图名不副实**——标签为「AI 生成题」却画出全部 7 类来源。重写为 `buildAITree()`：只取 `source==='ai'` 的题目按一级技术体系归类，点体系直达该体系题单、点具体题目直达详情。
- fix: **「展开全部」在左右逻辑图下被错写成收起**——改为统一 `walkClear(root)` 全展开，四视图均生效。

### 2026-09-01 · 全景图左右逻辑图重叠二次修复（缓存版本 `20260901f`）
- fix: **左右逻辑图仍交叠（v20260901e 未根治）**——根因：`maxPerLevelVisible()×26` 假设「整层节点均分高度」，但 ECharts tree 正交布局实际按「子树叶子数比例」分配高度，且一上来铺开 185 个子类会局部极密（某体系下挂 30+ 子类被压进父节点分到的一小段）。重构：去掉 `initialTreeDepth`，折叠统一由节点 `collapsed` 控制；新增 `effDepth()` 让左右图默认比径向图**少展开一层**（技术树只到体系层 21 节点，不再一上来铺 185 个）；`resizeHolder()` 改为按 `visibleNodeCount()` 动态设高 `max(640, min(6000, 可见节点×32))`，每个叶子 ≥32px 纵向间距，彻底不交叠；切换布局 / 展开全部 / 只看主干 / 复位均重算折叠 + `chart.resize()`，左右图「展开全部」只到子类层（点具体体系/子类再逐级下钻）。

### 2026-09-01 · 全景图左右逻辑图重叠修复（缓存版本 `20260901e`）
- fix: **切「左右逻辑图」标签交叉重叠**——根因：orthogonal 布局下同一层兄弟节点竖向堆叠，而画布高度仅 640–900px，技术树某层多达 185 个节点挤在一起。改为按「当前展开后单层最大节点数」动态设画布高度（`max(640, min(3600, 每层节点数*26+60))`），每次切换布局 / 展开 / 收起 / 复位都 `chart.resize()` 重排，纵向间距足够不再交叠；同时修复全屏 CSS 冲突（`:fullscreen .pan-orbit-chart` 的 `!important` 高度会覆盖动态高度），改为 `:not(.pan-mm-chart)` 排除思维导图，`.pan-mm-tall` 兜底高度 900→1600px。

### 2026-09-01 · 全景图交互修复（缓存版本 `20260901d`）
- fix: **思维导图三个交互 bug 修复**——① 复位 / 展开全部 / 只看主干按钮点了树没反应：根因 `apply()` 复用同一 `root` 对象，`initialTreeDepth` 在 data 引用不变时 ECharts 不重算折叠；改为直接操作节点 `collapsed` 属性（展开全部 = 清除 collapsed、只看主干 = 折叠 depth>1 节点、复位 = 恢复初始展开层级并重置布局为径向）；② 点节点不跳转：四视图共用的 `drawMindMap` 漏了 `chart.on('click')` 跳转（旧轨道图有、思维导图版丢失），已补——分支节点点击展开/收起下级、叶子或带 `_catId/_posId/_qid` 的节点点击直达题单/岗位/题目；③ 上述修复在 AI 视图（来源 → 体系 → 题目）同样生效，展开全部可一路铺到具体题。

### 2026-09-01 · 全景图改为思维导图（缓存版本 `20260901c`）
- feat: **(v20260901c) 技术分类 / 岗位均向下钻更深一层，节点直接标出题数、连线加粗按分组着色**——技术体系 → 子类（如「关系型数据库」）→ 具体技术（如「MySQL / PostgreSQL / Redis」），岗位阶段 → 父岗位（如「硬件工程师」）→ 子岗位（如「数字电路工程师」），按真实三层分类树（279 分类）与岗位父子（142 岗 / 29 父岗）组织；每个节点标签直接带题数（如「MySQL 16 题」，题数=子树题数，与 /category?cat= 点击结果一致），点节点直达题单/岗位/题目；连线默认线宽 2、强调 3.6、按演进层 / 时代阶段着色，解决「线条太淡看不清」。
- feat: **题库全景图四个视图全部改为 ECharts 思维导图（tree 系列）**——用户反馈轨道图/力导向节点一多就挤、连线缠成一团、没逻辑从属：改用树状思维导图后，数量再多也只先画主干、按需逐级展开，天然不挤。支持：① 径向（radial）/ 左右逻辑图（orthogonal）两种布局一键切换；② 逐级下钻与折叠（点击节点展开收起 + 工具条「只看主干 / 展开全部 / 复位」），`view=pos` 默认只展开到 8 个时代阶段、避免 151 个岗位节点一次性铺满；③ 节点=圆点、大小∝题量、颜色按演进层 / 时代阶段 / 来源分组，悬停出 tooltip、点「查看题目 →」直达 `#/category` / `#/position` / `#/question`；④ 四视图沿用 `attachFullscreen` 均可一键全屏。
  - **题库全景**（`view=all`）：4 演进层 → 21 技术体系 → 细分技术点。
  - **技术分类**（`view=cat`）：21 技术体系 + 细分技术点全展开。
  - **覆盖岗位**（`view=pos`）：岗位全景 → 8 时代阶段 → 具体岗位。
  - **AI 生成题**（`view=ai`）：改为「题目来源」思维导图——全库 358 题按 6 类来源 → 技术体系 → 题目三级下钻，AI 那一支可一路点进具体题目。

### 2026-09-01 · 全景图可全屏查看（缓存版本 `20260901a`）
- feat: **题库全景图四个视图全部支持全屏**——`js/panorama.js` 抽出公共 `attachFullscreen(wrap, getChart)`，轨道图右上角新增「⛶ 全屏」按钮：优先原生 Fullscreen API，浏览器不支持时（如 iOS Safari）自动降级为 `fixed` 伪全屏；Esc 退出、点节点跳转前自动退出全屏、全屏时节点标签字号 11 → 14 并重新 `resize()`；全屏内保留图例浮层（普通态隐藏，不占版面）。`view=ai` 视图同样支持全屏滚动浏览。
- feat: **非全屏状态也更大**——全景图页容器放宽到 1440px（`.container:has(.panorama-body)`，不支持 `:has()` 的浏览器保持原宽度，无副作用），轨道图高度 560 → 640px（移动端 420 → 460px）。
- fix: **根治「改完要 Ctrl+F5 才看到新版」的缓存不一致**——此前 `index.html` 里资源的 `?v=` 与 `sw.js` 的 `VERSION` 不同步，Service Worker 预缓存的 URL 与页面实际请求的 URL 对不上，新文件常被旧缓存挡住；现把全部资源 `?v=` 与 SW `VERSION` 统一为 `20260901a`，此后每次改动同步升版本即可即时生效。

### 2026-08-31 · 题库全景图（首页统计卡片可钻取，缓存版本 `20260831a`）
- feat: **题库全景图**——新增 `js/panorama.js` 与路由 `#/panorama?view=all|cat|pos|ai`，首页 4 个统计卡片由 `<div class="stat">` 改为 `<a class="stat">`，点击即可钻取：
  - **题库全景**（`view=all`）：ECharts 旭日图，圆环面积 = 题目数量，内圈 21 个一级技术体系、外圈细分技术点；点任意色块跳 `#/category?cat=<id>`。父节点不设 value、由子节点累加，保证比例精确；体系自身直挂的题目单独成「综合题」环。
  - **技术分类**（`view=cat`）：279 个分类的折叠树，一级默认展开，「展开全部 / 折叠全部 / 只看有题目的分类」三档控制，点节点进分类题目列表。
  - **覆盖岗位**（`view=pos`）：142 个岗位按「时代阶段 → 岗位族 → 具体岗位」三级展开，每行带题目数，点岗位进 `#/position/<id>`；`Services.isHiddenPosition`（与技术分类同名的占位岗位）灰显且不可点。
  - **AI 生成题**（`view=ai`）：全库来源构成条形图（AI / 人工 / 内置种子 / 原理整理 / 外部文档 / 其他）+ AI 题目按分类归组的完整清单。
- fix: **全景图题数与「题目总数」对不齐**——有 3 道题（id 229 / 233 / 239）`categoryId` 为 `null`，不在任何分类下，旭日图会漏掉；现单列「未归类」环（点进去走 `#/questions?nocat=1`），环上题数合计经校验 = 全库 358，误差 0。
- feat: **题目列表页筛选参数补两个**——`?source=ai|manual|import|seed|principles|url|other`（来源构成条跳转；`url` 按「来源是 http(s) 链接」筛，`other` 按「不属于已知来源」筛，命中 `ai|manual|import` 时同步选中来源下拉框）、`?nocat=1`（未归类题目）。均为纯加法，不影响原有筛选。
- fix: **轨道图永久卡"加载中…"紧急修复（缓存版本 `20260831d`）**——`#/panorama` 的 all/cat/pos 三视图上线后一直停在"轨道图加载中…"不渲染；根因同 HANDOVER 第 6 节：`drawOrbit` 的 `symbolSize` 回调首参在 echarts graph 系列里是数据项的 `value` 字段而非数据项本身，节点用 `x,y` 极坐标无 `value` → `undefined.symbolSize` 抛 TypeError 使 `setOption` 失败；修复后回调读 `params.data.symbolSize`，并把"加载中"移入图表内 `showLoading`、渲染失败显示红色错误兜底。
- chore: 缓存版本 `20260829x` → `20260831a`（index.html 全部资源 + sw.js `VERSION` + APP_SHELL 新增 `js/panorama.js`）；`.gitignore` 追加 `.workbuddy/`、`*.bak*`。

### 2026-08-31 · 自动备份死循环修复 + 再面一次按钮修复（缓存版本 `20260829x`）
- fix: **sitemap.xml 被写成「一整行」且漏收新题**——`tools/gen-share-pages.js` 生成 sitemap 的模板串里把换行写成了 `\\n`（转义成字面反斜杠+n），结果整份文件只有 1 行、夹着 2073 个字面 `\n`，且停在 `q/340`（08-31 新增的 341–346 未被收录）；换行改用 `NL` 变量拼接后重跑，现 **351 条**标准多行 XML，`ElementTree` 解析校验通过，已随脚本修复一并双推 release+main。
- data: **今日自动扩充（10:00 定时任务）**——经典主题 **T002 云监控告警响应与故障定位** 追问链 +6 题（id 341–346），覆盖告警产生机制/第一响应流程/CPU 告警定位/磁盘打满应急/服务不可用判定/告警规则配置，relatedIds 已互串；线上题库 340 → **346 题**，6 个新题分享页全部上线且含 `application/ld+json` 结构化数据；经典主题总进度 **2/70**。
- fix: **模拟面试结束点「再面一次」没反应**——根因是 hash 路由盲区：报告页本身就渲染在 `#/mock` 下，按钮链接 `href="#/mock"` 点击后 hash 无变化、不触发 `hashchange`、路由不重渲染，等于没点；刷题结果页「再来一轮」等同类自指链接同病。现全局兜底：点击「目标 hash 与当前 hash 相同」的站内链接时补一次与 hashchange 完全一致的重渲染。
- fix: **「本地数据已自动备份到云端」时不时弹出**——根因是自触发死循环：备份完成后把「备份时间」写入 IndexedDB settings 表，而备份引擎自己正监听着 settings 表的任何写入，于是「备份 → 写时间戳 → 被当成数据变化 → 12 秒后再次备份」无限循环（main 分支曾出现 10 分钟内 6 笔纯备份提交）；现备份自身写时间戳时临时压制钩子，断开循环。
- fix: **备份文件分支漂移**——此前备份只写单一分支（默认 main），而「恢复备份」是从 Pages 发布分支同源拉取，分支一旦不一致恢复就会读到过期文件或 404；现备份与题库发布一致双推 release+main。
- fix: **同一次改动备份两遍**——题库发布流程内置了一次显式备份调用，写完「发布时间」后 settings 钩子又会拉起一次自动备份；现去掉显式调用，统一由钩子接手。
- UX: **自动备份成功不再弹 toast**——顶栏徽章已示「✓ 已备云端」，高频弹窗纯属打扰（手动备份仍保留提示）。

### 2026-08-30 · 批量优化（缓存版本 `20260829u`）
- feat: **sitemap 自动化**——`gen-share-pages.js` 每次重跑自动重生成 sitemap.xml（首页+主要路由+全部分享页，当前 345 条），新题不再漏收录；
- feat: **题目纠错反馈**——题目详情页新增「⚠ 报错」按钮，一键跳转预填题号/标题的 GitHub Issue，内容有误可随时反馈；
- feat: **周报历史归档**——每周周报自动存本机（近 26 周），周报卡片点「历史」回看过往努力；
- perf: **题库数据缓存策略**——访客端拉取题库改走 HTTP 缓存（≤10 分钟新鲜度，手动同步仍强制刷新），不再每次打开都全量重下 450KB+；
- perf: **模块化第一刀**——使用指南拆分至 `js/guide.js`，app.js 瘲身 5KB 并验证拆分模式；
- fix: **题库数据还债**——10 道缺题干题补齐引导性题干、3 道未分类题归位（#229/#233→华为云、#239→通用面试软技能），体检报告清零；
- chore: 顶栏无障碍复查（菜单/主题按钮已有 aria-label，其余按钮均带可见文字，无需改动）。

### 2026-08-30 · 学习周报三件套（缓存版本 `20260829p`）
- fix: **柱子零值不可见问题**——数量为 0 的周/天此前柱高 4% 且不显示数字，数据少的用户看起来就是一片空白；现 0 值也显示数字并保留可见小柱根，非今日柱色加深（去掉 0.45 透明度）。无头测试确认周报代码运行正常。
- fix: **热力图 → 近 8 周柱状对比**——日历热力图用户反馈不直观，改为与每日柱状图同款的 8 根柱子（每周一根，柱上方标该周不同题数，深色为本周，悬停看日期区间），纯 HTML/CSS 实现，周报卡片不再依赖 ECharts。
- fix: **周报图表可读性**——柱状图每根柱子上方直接标注当天题数（此前只有悬停可见，手机上等于没有）；热力图增加图例刻度（浅→深四档）与点击/悬停详情（某天刷了几题）；两处标题改为大白话（「每天刷了几题」「每格 = 一天」）。
- feat: **近 8 周刷题热力图**——周报卡片新增 GitHub 贡献墙式日历热力图（ECharts calendar，按需加载），颜色越深代表当日刷题越多，深色模式适配；
- feat: **周目标彩带庆祝**——本周打卡 ≥5 天或刷题 ≥15 题时首页撒彩带（canvas-confetti，按需加载，每周期一次），手机微信内不触发；
- feat: **周报分享图**——周报卡片新增「📸 分享周报」：生成竖版周报卡（激励语 + 三列统计 + 每日柱状 + 薄弱 Top + 二维码），手机长按发给朋友、电脑复制图片后微信 Ctrl+V 粘贴，复用现有卡片管线与弹窗交互。

### 2026-08-30 · 电脑端分享修复（缓存版本 `20260829o`）
- fix: **电脑上分享题给微信朋友失败**——两个根因：① 电脑微信内置浏览器（WindowsWechat）被误判成手机微信，分享/保存按钮被隐藏；② Windows Chrome/Edge 的系统分享面板可用但微信不是合法分享目标，被拒后静默返回，看起来就是「点了没反应」。
  - 修复：区分手机/电脑微信（仅手机微信走「长按图片发送」专属路径）；新增**「复制图片」按钮**——卡片图进剪贴板，到微信聊天框 Ctrl+V 粘贴即可发送（电脑端最顺滑路径）；系统分享不可用时自动降级为「保存图片」并明示提示，绝不空手而归；用户主动取消分享面板不算失败。

### 2026-08-30 · 第一性原理必读题上线（缓存版本 `20260829n`）
- feat: **第一性原理必读题自动化**——新增 `tools/fp-coverage.js` 覆盖检测（按含子分类题量排优先级）并接入 `data-audit.js` 体检；每日扩题流水线常备任务新增：每轮为题量最大的缺口分类自动补 4 题成套必读题（约定已写入自动化 memory），新增技术分支当周内自动获得必读题。
- feat: **每个技术域新增 4 道「第一性原理必读题」并强制置顶**——按「诞生由来（这技术为什么出现、之前痛在哪）→ 核心思想（用什么本质思路解决）→ 局限边界（什么时候不该用 / 解决不了什么）→ 演化动力（每次大版本在还什么债）」四问成套，覆盖 19 个技术域共 76 题（id 265~340）直接入库（可收藏 / 标记薄弱 / 参与搜索）；分类页题目列表置顶显示，带「🧬 第一性原理 · 必读」横幅，置顶按 tags 标记识别、不受排序切换影响。工具：`tools/add-first-principles.js`（幂等，后续可扩展叶子分类）。

### 2026-08-30 · 人工架构图上线（缓存版本 `20260829k`）
- fix: **分支树节点可点击进入分类**——此前树图节点只展示不可跳转；现末级节点（无子分类、有题目的技术）点击直达对应分类页，上层节点保留展开/收起；提示文案同步说明。
- feat: **19 个重点技术域的「人工架构图」**——在自动分支树之上，为计算机基础/编程语言/数据库/操作系统运维/计算机网络/Web前端/服务端/软件工程/软件测试/分布式微服务/云原生DevOps/大数据/AI/信息安全/移动端/游戏/嵌入式IoT/音视频/区块链逐域手绘分层架构图（`data/tech-maps.json`，173 个节点全部可点击跳转对应分类刷题，薄弱橙标继承）。分类页升级为「架构图 | 分支树」双标签：有架构图的域默认显示架构图；叶子分类自动继承所属域的全景并在同级树中高亮自己。

### 2026-08-30 · 技术全景图（分类知识地图，缓存版本 `20260829j`）
- feat: **技术体系分类页新增「技术全景图」**——点开任一分类，以该分类为根渲染交互式树图（ECharts tree，按需加载）：每个节点 = 子技术 + 题量，可展开/收起/拖拽/缩放；**错题本里有薄弱题的分类自动标橙**，哪里薄弱一眼可见；叶子分类自动切换为「同级技术位置图」（父分类 + 兄弟技术，当前项高亮）；深色模式适配、图表可收起。

### 2026-08-30 · 分享卡片答案摘要重排（缓存版本 `20260829i`）
- fix: **分享卡片上的「参考答案」不再糊成一团**——旧版把答案整体去格式后硬折 7 行，编号/要点/分段全部堆在一起；现按编号、项目符号、空行切块，每块独立折行、块间留缝，行数预算用尽自动补省略号。卡片第一观感恢复层次感（用户反馈：卡片排版乱到不想扫码）。

### 2026-08-30 · 分享落地页改为单步直达（缓存版本不变 `20260829h`）
- feat: **分享页读完引导条**——滚动接近文末（约还剩 0.8 屏）时底部滑入引导：「这道题看完了？连刷同类题」→ `#/practice?scope=cat&cat=<分类ID>`（含子分类；无分类的题退回题目页）；可关闭（✕，会话内不再出现），`prefers-reduced-motion` 下无动画，深色模式适配。读题过程零打扰，只在真正读完时出现。
- feat: **`q/<id>.html` 取消 2.5s 自动跳转**——分享页本身就是完整内容（题目+参考答案），扫码/点卡直接读完，想刷题、收藏或进错题本时点页面 CTA 手动进入 SPA；消除「看题目 → 跳转/重载 → 又看一遍题目」的两段式绕圈（手机扫码首访反馈）。264 个分享页已全部按新模板重新生成；SEO（正文可抓取、QAPage JSON-LD、og 卡片）不受影响。

### 2026-08-30 · 分享链接首访体验修复（缓存版本 `20260829h`）
- fix: **深链进入跳过首访开场动效**——扫码/点开分享卡时先落地 `q/<id>.html`（含题目全文），2.5s 后跳进 SPA，而 SPA 首访会再播 ≥3.2s 的加载动效才进同一道题，形成「看题目 → 开场动效 → 又回题目」的绕圈体验；现在带 hash 深链（`#/question/…` 等）进入时直接进正题，开场动效仅在从首页空路径首次进入时播放，并标记本会话不再补播。

### 2026-08-30 · 编辑端发布/吸收链路修复（缓存版本 `20260829g`）
- fix: **编辑端题库发布改为双推 `release` + `main`**（与扩充流水线一致）——此前编辑端（配置发布 Token 的浏览器）默认只推 `main`，而 Pages 发布源是 `release`，导致管理端「发布题库 / 自动发布」的增删改从未出现在线上站点；`C.putFile` 支持指定分支，按 `release`/`main`/自配分支去重依次推送。
- fix: **`absorbRemote` 中文标题查重修复**——norm 由 `/[\\s\\W_]+/g`（会把中文字符全部剥掉：纯中文标题归一为空串、混合标题只剩 ASCII 碎片，查重对中文题基本失效）改为 Unicode 感知 `/[\\s\\p{P}\\p{S}_]+/gu`（保留中日韩文字与数字，仅剥空白/标点/符号）。
- fix: **吸收期间抑制自动发布**——`absorbRemote` 全程 `C._suppress`，杜绝「从云端吸收新题 → Dexie 钩子 → 10 秒后整包自动发布」把流水线刚推的数据回踩（08-30 上午 main/release 数据分叉的成因之一）。
- feat: **吸收规则自愈**——新增 `absorbNormVer` 标记（当前 v2）：norm 规则变更后各端下次启动会对既有本地库强制重放一次吸收，自动补回此前因查重失效漏吸收的题（如 08-30 的 #258/#263/#264）。

### 2026-08-30 · 自动化扩题每日首跑成功 + 数据链路排查（文档登记，无站点代码变更）
- ✅ **自动化扩题（每日频次首跑）成功**：云服务售后报障全流程（经典主题 T001）+6 题，线上题库 258 → **264**（version 5），分享页 `q/259~264.html` 自动跟发（全部验证 200）；「自动扩充记录」表已登记。
- 📋 **排查：编辑端与流水线数据链路分叉（已定位，待修复）**
  - 编辑端浏览器发布（`cloud.js`）默认推 **`main`** 分支，而 Pages 发布源是 **`release`** → 管理端「发布题库 / 自动发布」目前**不会出现在线上站点**（今早 09:20 发布的 257 题从未上线；自动化 11:04 以 release 侧 258 基线 +6 覆盖发布 264，把管理端此前删除的 1 题也带了回来）。
  - 编辑端启动时 `absorbRemote` 吸收线上新题（本地 257→261）后会把本地整包自动发布回 `main`，导致 `main`（261 题）与 `release`（264 题）数据分叉；吸收过程未设 `C._suppress`。
  - 待修复：编辑端发布分支改 `release`（或与流水线一致双推）；`absorbRemote` 期间抑制自动发布；两端 lineage 对账。
- 🐛 **`cloud.js` `absorbRemote` 中文标题查重失效**：`norm` 的 `/[\s\W_]+/g` 把中文字符全部剥掉——纯中文标题归一为空串、混合标题只剩 ASCII 碎片（如 `sla`/`cpu`），对中文题基本不设防；待改 Unicode 感知归一化（保留中日韩字符）。
- 📝 恢复被流水线记录提交（077227a，基于桌面副本旧 README）误删的 2026-08-29 更新日志段。


### 2026-08-29

**浏览历史分组标题增强（缓存版本 `20260829f`）**
- 用户反馈「今天 / 昨天」分组标题颜色过淡易被划过：由浅灰 12px 文字改为**蓝色胶囊标签 + 横线延伸 + 该组题数**（如「今天 ─────── 8 题」），扫读定位一目了然。

**新增站内「使用指南」（缓存版本 `20260829e`）**
- 新路由 `#/help`：面向访客的完整使用文档——快速上手、找题与浏览、日常学习、复习与错题、模拟面试、账号与数据、分享、管理员、常见问题（FAQ）九大节，顶部锚点导航平滑滚动。
- 入口：侧边栏「使用指南」+ 页脚链接（页脚同时上线：GitHub 仓库链接 + 数据说明，此前页脚为空）。
- 维护规则：用户可见功能变更时同步更新指南内容与「文档最近更新」日期。

**修复学习打卡永远 0 天（缓存版本 `20260829d`）**
- **根因**：`getLocalStats()` 返回值漏掉了 `daily` 字段，而打卡卡的连续/累计/热力图全部从该字段推导——数据一直在记（localStorage），但读取时被丢弃，所以打卡卡**上线以来永远显示 0**。
- **顺带修正**：打卡日期统一改用本地时区（原用 UTC，早 8 点前的访问会记到「昨天」，导致热力图错位、跨日连续天数误断）；看题也计入当日活跃，热力图更完整。

**周报布局精修（缓存版本 `20260829c`）**
- 周报卡由「渐变大杂烩」改为紧凑三段式：三列统计（分隔线隔开、趋势徽章内联到数字旁、等高对齐）→ 薄柱状图 → 薄弱分类行；「本周标记不会的题」收进默认折叠的 `<details>` 明细，不再撑长卡片；去掉渐变底与其他卡片风格统一；样式收敛为 `wk-*` 类 + 窄屏（≤480px）字号自适应。

**本周学习周报重做（缓存版本 `20260829b`）**
- **口径修正**：「刷题次数」→「刷题数（不同题）」（浏览历史按题去重，原名不副实）；「打卡天数」→「完成5题天数」（dailyDone 口径，与打卡卡的「打开即打卡」区分）；右上角难懂的「N 天前起算本周」→ 日期区间「本周 MM-DD ~ MM-DD」；「薄弱分类 Top3」原先混用累计数据，现在优先「本周新增薄弱分类」，无则回退累计并明确标注。
- **环比上周**：三个指标各带 ↑/↓/持平 徽章（新增薄弱越少越好，绿色语义自动反转；上周基数为 0 时显示「新增」）。
- **一周迷你柱状图**：周一至周日每天刷题数（不同题），今天高亮。
- **行动入口**：薄弱分类标签可点击跳转对应分类刷题；新增「本周标记不会的题」最近 5 道可点列表 + 「全部都在错题重练 →」入口。
- **空态鼓励**：本周全 0 时显示「本周还没开始，随时可以出发 💪」+ 随机来一题 / 进入刷题按钮。
- **样式**：数字颜色改用主题令牌（暗色模式协调）。

**浏览历史升级为学习工具（缓存版本 `20260829a`，版本戳改用日期前缀，字母已用尽）**
- **实用四件套**：单条删除（卡片右上 ×）；按「今天 / 昨天 / 本周更早 / 更早」分组；历史内关键词搜索（标题/标签）；显示「看过 N 次」重访计数（反复回看的题就是薄弱信号），历史上限 100 → 300。
- **状态标注**：卡片上显示当前掌握状态——📅 复习中（在错题本）/ ★ 已收藏，一眼区分「已拿下」和「看过还是不会」。
- **🔁 重刷历史**：一键把浏览历史作为题池开始刷题（`#/practice?scope=hist`），历史从流水账变成复习入口。
- **清空可撤销**：清空后 8 秒内可一键恢复（防手滑）。
- **温故知新（默认关）**：今日 5 题卡片内开关开启后，3–30 天前浏览过、未进错题本、今日未打卡的题自动混入清单前 2 位（最久未看优先），与打卡判定共用同一清单。

**浏览历史修复（缓存版本 `20260827z`）**
- **根因**：题目详情页把路由里的字符串 id（如 `"10"`）直接传给 `incViews` / `addHistory`，而 IndexedDB 的键区分类型——字符串 `questionId` 写入后，浏览历史页读取时按数字主键 `bulkGet` 全部 miss，**浏览历史永远为空**；同因导致本地浏览计数从未生效；且去重失效，重复访问同一题会堆积重复行。
- **修复**：传参改用数字 `q.id`；新增一次性数据修复 `repairHistoryIds()`（启动时把字符串 questionId 转数字并去重，已修复的行自动清理）。

**样式与动效体验优化（缓存版本 `20260827y`）**
- **全局「减弱动态效果」守卫**：`prefers-reduced-motion: reduce` 时静止全站 13 处循环动画（无障碍 + 省电）；复习横幅去掉无限发光，消除同屏多重强调。
- **弹窗滚动锁**：`U.modal` 打开时锁定背景滚动（计数支持嵌套弹窗），`scrollbar-gutter` 防桌面端宽度跳动。
- **键盘焦点可见**：全局 `:focus-visible` 主色焦点环（输入框自有 ring 不受影响）；触屏按压反馈：题目卡/侧栏/技能卡/树节点 `:active` 轻缩放。
- **暗色修正**：`--c-primary-50` 保持主色相（答案卡片恢复蓝色调）；`.md pre` 代码块暗色加深 + 描边。
- `chart-fade` 接线三处图表懒加载入口；移动端 toast 移至底部居中（上/下滑出场）。

**前端体验修正（缓存版本 `20260827x`）**
- **首页文案用户化**：页面内 H1/副文案/底部提示去掉「管理系统」开发者口吻（站点改名漏网处）。
- **详情页上一题/下一题**：同分类随机跳转 → 按 id 顺序循环，与刷题页行为一致（键盘 ←/→ 同步）。
- **iOS 适配三件套**：`viewport-fit=cover` + safe-area（PWA 独立窗口顶栏让出刘海、底部弹窗/主内容避开 home 条）；新增 `apple-touch-icon`（180×180 PNG，添加到主屏幕显示 logo 而非截图）；`theme-color` 暗色变体。
- 顶栏新增「⚡ 离线 · 本地缓存」徽章（online/offline 监听）；`U.md` 题内图片自动 `loading=lazy`。

**安全 + 性能 + SEO 三线升级（缓存版本 `20260827w`）**
- **P0 安全**：加载 DOMPurify（`vendor/purify.min.js`）——修复 Markdown 渲染不过滤的 XSS 缺口。
- **P0 可用性/PWA**：6 个第三方库全部本地化 `vendor/`（字节级对齐现用版本），核心库进 SW APP_SHELL——真离线可用，不再依赖 jsdelivr；echarts/xlsx（约 1.6MB）改 `U.loadScript` 按需加载，移动端首屏约减 2MB。
- **P0 体验**：开场动画回访跳过（sessionStorage 标记），首访保留完整动效。
- **SEO**：258 个 `q/<id>.html` 由「跳转壳」升级为内容落地页（题目+答案全文、QAPage JSON-LD、2.5s 延迟跳回 SPA）。
- **文案**：站点更名「IT 面试题库 · 刷题 / 模拟面试」（title/OG/Twitter）；统一百度统计 ID 消除双账号重复上报。
- **Worker 加固**：CORS 白名单、500 防内部信息泄漏、注册 admin 授予加 `ADMIN_EMAIL` 门槛（已部署 `85b4abca`）。
- **工具**：新增 `tools/data-audit.js` 题库体检、`tools/smoke-test.js` 纯函数回归（26 用例）。

**扩充流水线增强（工具链）**
- **分享页自动跟发**：`--push` 推完题库后自动重生成 `q/<id>.html` 并推送待推清单（`tools/.last-new-ids.json` 跨「先合并、后 --push」两步调用持久化），失败只告警、绝不影响题库发布主流程。
- **`--next` 数据驱动选域**：按空叶子分类数输出推荐域 + 优先叶子分类 + 推荐来源。
- **合并质检闸门**：答案有效内容 <30 字、引用缺失本地图片直接拒绝入库；批次题型/难度单一时打配额提醒。
- 修复 `--push` 重复自增 `version`（本批无新增时不再写文件）；`.gitignore` 补 `__pycache__`。

**微信内分享适配（缓存版本 `20260827v`）**
- 微信内置浏览器中「分享图片」按钮（`navigator.share`）不可用、「保存图片」下载体验差 → 检测 `MicroMessenger` UA 后改为**微信专属路径**：点击预览图放大为全屏大图，**长按图片 → 发送给朋友/保存图片**（微信原生菜单），符合微信用户习惯。
- 非微信环境保持原有「分享图片 / 保存图片 / 复制链接」三按钮不变。

**题目分享卡片（缓存版本 `20260827u`）**
- 题目详情页「分享」改为弹窗预览：自动生成精美题目卡片图（品牌头 + 标题 + 分类/难度/年限标签 + 参考答案摘要 + 网址/二维码）。
- 移动端优先 `navigator.share({files})` 直接分享图片到微信；桌面端降级为保存 PNG；同时保留「复制链接」按钮。
- `U.icon` 的 SVG 图标带 `width="16" height="16"` 属性兜底，SW 仅缓存首页避免分享页污染离线首页。

### 2026-08-28 · 复习提醒增强 + 题目分享 + 面试报告云端趋势（缓存版本 `20260827o`）
- feat: **到期复习提醒三层强化**（此前只有侧边栏 6px 小圆点，用户反馈不明显）：
  - **首页顶部复习横幅**——有到期题时，首页最顶部显示醒目卡片「今天有 N 道题到复习时间了 · 立即复习 →」，带呼吸光晕动画 + 图标跳动，打开站点第一眼就能看到。
  - **侧边栏徽章强化**——「错题重练」右侧改为橙色数字徽章（上下跳动），整行加呼吸背景色；圆点脉冲从单纯缩放升级为**光晕扩散（ripple）**，远看也明显。
  - **数字实时更新**——轮询发现到期数量变化时自动刷新侧边栏徽章，用户停留在任意页面都能看到最新待复习数量。
- feat: **详情页分享/复制链接**——新增「分享」按钮：手机优先调起系统分享面板（`navigator.share`），桌面降级为复制题目绝对链接并 toast 提示；用户主动取消分享时不降级。同步新增通用工具 `U.copyText`（Clipboard API + `execCommand` 双重降级）。
- feat: **模拟面试报告云端保存 + 历次趋势对比**：
  - 登录后每次面试结束自动把成绩（岗位/年限/题目数/掌握·不熟悉·不会/用时/技术覆盖）存入 D1 新增的 `mock_reports` 表，换设备也能回看。
  - 结果页新增「历次成绩趋势」：最近 6 次掌握率横条 + 首尾对比徽章（↑提升 N% / ↓下降 N% / 持平）。
  - Worker 新增 `GET/POST /me/reports` 接口，**表未建时静默降级**（返回空 / 跳过保存），绝不影响收藏、历史、错题等核心同步，也不打断面试流程。
- chore: **`.gitignore` 屏蔽 `wrangler.jsonc` / `.wrangler/` / `tools/batches/`**——`wrangler.jsonc` 是此前把静态站误部署成 worker 的元凶，屏蔽后 `git add -A` 永不误带。

### 2026-08-28 · P2 体验增强（缓存版本 `20260827n`）
- feat: **学习周报卡片**——首页新增「本周学习周报」：本周刷题次数、打卡天数、新增薄弱题数，以及薄弱分类 Top3（按错题本分类聚合），让学习数据产生回访动力。
- feat: **今日 5 题打卡上云**——打卡记录从 `localStorage` 迁移到 IndexedDB `dailyDone` 表，并随个人数据云同步（Worker `/me/data` 扩展 `daily` 字段、D1 新增 `daily_done` 表，按天并集合并，换设备不丢）；旧 `localStorage` 当日记录首次运行自动迁移。
- feat: **PWA 离线化**——新增 `manifest.json` + `sw.js`：导航请求 network-first（离线回退缓存首页）、同源静态资源 cache-first + 运行时补缓存；可「添加到主屏幕」、断网照常刷题（题库本就在 IndexedDB）。Service Worker 版本化，更新自动生效。
- feat: **SEO 补强**——`index.html` 增加 canonical + Open Graph / Twitter Card 分享卡片（链接分享到微信/QQ 有标题与描述）；`sitemap.xml` 扩充首页 + 主要栏目锚点、更新日期。
- feat: **无障碍标注**——`#toast-root` 加 `role="status" aria-live="polite"`（屏幕阅读器播报提示）、modal 加 `role="dialog" aria-modal`、顶栏与侧边栏加 `role="navigation"`/`banner`/`main`、图标按钮（菜单/主题）加 `aria-label`、toast 关闭按钮可键盘操作。

### 2026-08-28
- feat: **复习闭环补全 + 体验优化一批**（缓存版本 `20260827m`）：
  - **模拟面试标「不会/不熟悉」的题自动进错题本**——此前只写进报告文本，记忆曲线闭环在模拟面试断裂；现在与练习页行为一致（首次标记入错题本，再次「不会」重置复习间隔）。
  - **详情页显示复习状态**——已在错题本的题目在「不太会」按钮旁显示「📅 复习中 · 待复习 / N 后」徽标（记忆曲线第 x/8 阶段）；已在错题本时点击按钮不再静默重置进度，改为提示当前阶段。
  - **到期复习提醒**——启动 + 每 5 分钟轮询艾宾浩斯到期题；会话内新到期的题 toast 提醒（启动时已到期的静默不打扰），侧边栏「错题重练」入口加脉冲圆点动画。
  - **动态 document.title**——详情页显示题目标题、各功能页显示页面名，浏览器多标签/历史/收藏可区分；无效路由不再静默回首页，改为渲染 404 页（返回首页/浏览题目按钮）。
  - **性能修复**——收藏/历史查询从逐条 `get` 的 N+1 改为 `bulkGet` 批量；清空收藏从逐条 `toggleFavorite` 循环改为 `bulkDelete`；收藏页/浏览历史页加「加载更多」分页（每页 40）。
- feat: **页面关闭/隐藏时 sendBeacon 兜底上传个人数据**（`4683f47`，缓存版本 `20260827l`）：
  - **兜底触发**——登录用户在标签页隐藏（`visibilitychange` → hidden）或关闭（`pagehide`）时，自动用 `navigator.sendBeacon` 上传收藏/刷题历史/错题本到 `/me/data`；此前这些场景下常规 fetch 可能被浏览器取消，导致最后一次学习数据丢失。
  - **降级链路**——sendBeacon 不可用或返回失败时，降级为 `keepalive: true` 的 fetch PUT；上传数据使用最近一次 `collectLocal` 缓存的快照（`A._rememberSnapshot`），不在关闭瞬间重读 IndexedDB（异步读库在页面卸载时不可靠）。
  - **Worker 配套**——`sessionUser` 兼容 `?token=` 查询参数（sendBeacon 无法携带自定义 header；64 位 hex 白名单校验防注入）；CORS 放行 `PUT` 方法与 `Authorization` header。

### 2026-08-27
- fix: **恢复薄弱练习完整版（艾宾浩斯记忆曲线）+ 刷题键盘快捷键 + 图片外置迁移**（`c8f8374`，全量函数对比已与旧版对齐，缓存版本 `20260827j`）：
  - **错题重练页升级为艾宾浩斯双列**——「📌 待复习」与「🕒 已排程」分区；待复习卡片提供「会了」（间隔按记忆曲线顺延：5分钟→30分钟→12小时→1天→2天→4天→7天→15天）、「还不会，稍后再来」（5 分钟后重新提醒）、「移出」三个操作；已排程卡片显示下次复习倒计时标签与排期时间。
  - **题目详情页补「不太会」按钮**——一键加入错题重练、按记忆曲线排期，已在错题本中时给出提示；侧边栏角标实时 +1。
  - **刷题详情页键盘快捷键**——← / → 切换上一题/下一题、空格展开或收起答案、S 收藏；输入框聚焦或弹窗打开时不响应；按钮下方附快捷键提示行。页面级监听随路由切换自动清理，避免泄漏。
  - **练习页「已掌握」对接记忆曲线**——若该题已在错题本中则顺延复习间隔而非直接移出。
  - **启动预载待复习数**——供侧边栏「错题重练」角标显示。
  - **题目图片外置恢复**——编辑器粘贴图片在配置发布 Token 后自动上传到仓库 `assets/q/` 并以 URL 引用（失败回退内嵌 data URL）；管理后台系统设置补回「题目图片外置」扫描 / 一键迁移卡片，可将历史存量 base64 图片批量外置。
- fix: 恢复首页空分类卡片置灰 + 「即将上线」角标（`0f3ad3b`；CSS 尚在、JS 渲染逻辑被覆盖丢失）：
  - 无题目的技术分类卡片降低不透明度并显示「即将上线」chip 与「题目录入中」文案，有题分类不受影响。
- docs: README 更新日志重排为时间逆序（最新在上），新增排序说明（`d6e8f3b`）；日期内条目同样按时间逆序（`7a5998c`）。
- fix: **恢复被帐号系统部署覆盖丢失的功能**（`55a15ec`，基于线上 release 基线 `b1aa1ba` 移植）：
  - **今日 5 题**——首页卡片按日期确定性抽样（FNV-1a + mulberry32）当天固定 5 题、次日自动更换，完成打勾、进度 x/5；
  - **随机一题**——侧边栏入口 + 首页 Hero「随机一题」按钮（`#/random` 随机跳转已发布题目）；
  - **错题重练**——新增 `#/review` 页面，汇总练习中标记「不会 / 不熟悉」的题目，支持「会了 / 移出错题本」，侧边栏显示待练数量角标；
  - **最近搜索下拉**——顶栏全局搜索、首页 Hero 搜索、题目列表筛选框聚焦时展示最近搜索（可删单条/清空）或热门搜索词，回车自动记入历史（localStorage `search_history`，上限 10 条）;
  - **搜索无结果建议**——题目列表空态显示「没有匹配的题目：xxx」+ 热门关键词一键重搜按钮；
  - **学习打卡热力图 & 继续上次**——首页基于本地统计渲染近 35 天打卡热力图与连续天数；详情页浏览自动记录「继续上次」恢复入口。
- feat: **用户帐号系统（D1）**——新增 D1 数据库 `it-interview-users` 绑定 Worker（binding `USERS`）：开放注册/登录/退出（PBKDF2-SHA256 10 万次迭代加盐哈希，Bearer token 会话 30 天，IP 限流防刷，首个注册用户自动成为管理员）；个人数据云同步——收藏、刷题历史、错题本按用户存储，登录自动合并云端与本机数据，换设备登录即恢复；顶部栏「登录」入口 → `#/account`；**管理员帐号管理页** `#/admin/users`：用户列表/搜索、禁用（即时踢下线）/启用、重置密码。密码字段永不返回前端。
- feat: **Cloudflare Worker 访问统计上线并默认接入**——部署 `it-interview-stats`（KV 绑定 STATS）至 `https://it-interview-stats.iti-interview.workers.dev`，提供全局访问计数、当日访问、访客国家/城市分布、热门题目榜；前端 Stats 模块内置该地址（开箱即用，管理员仍可在系统设置覆盖），首页访问与题目浏览自动上报，管理后台仪表盘显示地域分布饼图。
- feat: **编辑端自动增量吸收云端新题**——启动时自动拉云端快照，按 id + 标题归一化双重去重只追加本机缺失的题目/分类/岗位（不改动本地已有内容与收藏记录），同一快照只吸收一次；管理员无需再到设置页手动「从云端拉取」。手动全量覆盖按钮保留。
- fix: **云端同步不拉新**——`fetchRemote` 版本校验从 `===1` 放宽为正整数（兼容流水线递增 version）；线上快照补递增 `version`/`publishedAt` 触发全量访客重新同步。
- feat: **扩充流水线增强**——① 合并时自动递增 `published.json` 的 `version`/`publishedAt`，前端与编辑端可感知云端更新；② 模糊去重：归一化标题相似度 ≥0.85 判为疑似重复直接跳过，杜绝跨批次近似题；③ 新增 `tools/coverage_report.py` 覆盖度报告（各域题量、空叶子分类统计 → `tools/coverage.md`）；④ 自动化频率提升至每周一/三/五 10:00 三次，取材前参考覆盖度优先补空置分类。
- feat: **定期自动化「题库定期自动扩充」**——按轮转表联网取材、合并、发布，实现用户提出的「定期自动抓取权威面试题并归档到各类别及岗位」。
- feat: **题库定期自动扩充流水线**——新增 `tools/enrich_questions.py`（批次校验 / 标题去重 / 分类·岗位名自动解析为 ID / 顺序 ID 自增 / `--dry`·`--all`·`--push` 推送 Pages 分支）、`tools/intake-plan.md`（权威来源白名单 + 21 域周轮换表）、`tools/batches/` 批次目录；首批 `2026-08-27-a.json` 入库 10 题（CAP/索引/三次握手/单例/HTTP 缓存/微服务/消息队列/事务隔离/进程线程/一致性哈希），题库总数 239 → 249。

### 2026-08-25
- docs: 新增 `cloudflare/部署指南.md`（注册 Cloudflare → 建 KV → deploy → 前端接入全流程），README 统计与部署章节同步指向。
- docs: 新增「部署与自定义域名」章节，说明站点托管于 GitHub Pages（`main` 分支）、`it-interview.is-a.dev` 为自定义域名（CNAME 指向 `succedd.github.io`、非跳转）、内容经 Fastly CDN 分发、域名来自 is-a.dev 免费服务。
- docs: README 新增「Token 安全（发布 PAT 最小权限原则）」章节——代码实际仅调用 Contents API（GET sha + PUT 文件），推荐 Fine-grained PAT 只限本仓库 + Contents 读写，明确禁用 Classic PAT（`repo` scope 全仓库可写）作为发布 Token，附泄露影响评估与轮换建议。
- security: 加密备份密钥派生 PBKDF2-SHA256 迭代次数由 150,000 提升至 600,000（`js/backup.js` v20260825a）；`deriveKey` 新增 `iterations` 参数，加密 payload 写入 `iter` 字段、解密按 `payload.iter` 读取（缺失回退 150,000），保证仓库内既有旧备份向后兼容、升级不会导致历史备份无法解密。
- feat: 题目编辑器（题目正文 / 参考答案）支持**直接粘贴图片**——`Ctrl/Cmd+V` 粘贴剪贴板截图，自动压缩为 JPEG data URL（长边 ≤1400px、质量 0.85，超 500KB 自动降档），以 Markdown 图片插入光标处并即时预览；图片随题目保存、随题库发布同步到云端，所有访客可见。新增 `.md img` 自适应样式防止大图撑破布局（`js/app.js` + `css/style.css`）。
- feat: 新增**标题查重提示**——手动新增/编辑题目保存时、AI 生成批量入库前，按标题规范化匹配（去空白、转小写、全半角标点归一化）扫描既有题库与本批次，命中即弹确认框列出冲突题目（ID / 标题 / 状态），取消可中止保存，仅提示不强制拦截（`js/app.js` 新增 `normTitleKey / findTitleDups / confirmTitleDups`）。批量导入（Excel/CSV）原有查重策略不变。

### 2026-08-24
- refactor: `cloud.js` 抽出通用 `putFile` 上传助手供题库发布与加密备份共用。
- feat: 本地数据加密云备份——新增 `js/backup.js`，发布 Token、AI 配置、管理员密码、统计配置、收藏、历史经 AES-256-GCM（PBKDF2 派生密钥）加密后备份到 `data/local-backup.json`，设置页支持设置备份密码、立即备份、凭密码一键恢复。
- feat: 自动发布——编辑端题目/分类/岗位增删改（含 AI 出题、批量导入，经 Dexie 表钩子全路径监听）停止 10 秒后自动推送 GitHub，失败自动重试，关页前未发布提醒，顶栏新增状态徽章（可关闭）。

### 2026-08-23
- `37b0a2d` 添加 CNAME 文件，绑定正式域名 `it-interview.is-a.dev`。
- `6fb7f71` 恢复 CNAME：旧浏览器数据导出完成，正式域名重新上线。
- `333a3c3` restore: 从旧浏览器 IndexedDB WAL 抢救恢复 126 道历史题目，题库总数 225 道。
- `5ef58ec` analytics: 百度统计切换为 it-interview.is-a.dev 新站点 Tracking ID `856d2b...`。

### 2026-08-22
- 大量 AI 出题体验优化：实时日志、进度动画、生成提速、JSON 解析健壮化、取消按钮等。
- `172f920` feat: 岗位与分类/题目关联改造。
- `1f210de` feat: 岗位支持细分方向（direction）。
- `6e47a4e` feat: 编辑题目技术分类改为可搜索组合框。
- `a756d93` feat: 首次进入加载动效（进度条 + 代码雨 + IT 岗位名飘动）。
- `8a0af25` feat: 接入 Cloudflare Worker 访客统计，支持实时人数、地理分布、题目热度。
- `0fa80d2` feat: 集成百度统计。
- `a51d7f5` feat: 云端共享题库——访客自动同步 + 管理员一键发布到 GitHub。

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
- Cloudflare Pages + GitHub Actions：静态托管与自动部署（推送 `release` 即部署）
- Cloudflare Workers + D1 / KV：后端（账号登录、云同步、访问统计）

## 质量抽检记录

> 每周随机抽 20 道题复核答案准确性、是否答非所问、来源是否支撑结论；只报告不修改。不合格题号与具体原因见当周自动化执行报告。

| 日期 | 抽检数 | 不合格 | 主要问题 |
|---|---|---|---|
| 2026-09-07 | 20 | 0 | 本轮无事实错误/答非所问/来源失效；#412「注意力沉没→MoE 优化」表述偏松（MoE 并非针对注意力的优化，建议人工复核）；全库仍有 325 题来源为占位符（历史欠账，待补） |
| 2026-09-21 | 20 | 4 | **事实错误**：#1178 称 AWQ「不量化显著权重、只量化其余权重」——错，AWQ 明确反对混合精度（硬件不友好），改用 per-channel scaling 保护显著权重，所有权重仍量化到低比特，且答案内部自相矛盾；**来源不支撑**：#1178 来源 arXiv 2210.17323 是 GPTQ 论文，只覆盖 GPTQ 不覆盖 AWQ（AWQ 论文为 arXiv 2306.00978）；**答非所问**：#1140 题干要「可靠开机自启＋故障自愈」，答案只讲 Restart/资源限制/看门狗/依赖排序，完全缺 [Install]/WantedBy=/systemctl enable（开机自启未答），来源 man5/systemd.resource-control 也不覆盖 Restart/WatchdogSec；**题型不符**：#1155、#1161 标注单选题但题干与答案均无 A/B/C/D 选项，无法作答（全库 24 道单选题中 20 道同病，83.3%）。轻微瑕疵（未计入不合格）：#1153「RabbitMQ 随机写」对比句过度简化、#1147 来源 evodb.html 未覆盖 expand-contract、#1169 回溯判据措辞不严谨。来源 19/20 可达（#1141 freedesktop 返回 418 系反爬非 404）；本次抽样 0 题来源为占位符 |

## 许可证

MIT License — 开源可自由使用与修改。
