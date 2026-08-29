# 题库自动扩充 · 取材与轮转计划（intake-plan）

> 本文件驱动「定期自动扩充」自动化：每次运行按轮转表挑一个技术域，
> 从权威来源取材、整理成结构化题目，经 `enrich_questions.py` 合并入 `data/published.json`。
> 目标：优先填满 **235 个空叶子分类**，再对已有分类做深度补充。

## 一、取材来源白名单（仅限权威、可溯源）

| 来源 | 地址 | 擅长领域 |
|------|------|----------|
| CS-Notes | https://github.com/CyC2018/CS-Notes | 计基/网络/OS/DB/分布式基础 |
| JavaGuide | https://github.com/Snailclimb/JavaGuide | Java/后端/并发/ JVM/微服务 |
| 小林coding | https://www.xiaolincoding.com | 网络/OS/MySQL/Redis 图文 |
| 美团技术团队 | https://tech.meituan.com | 工程实践/稳定性/架构 |
| React 官方文档 | https://react.dev | 前端框架 |
| Vue 官方文档 | https://vuejs.org | 前端框架 |
| Spring 官方文档 | https://spring.io/projects/spring-boot | Java 后端框架 |
| MDN Web Docs | https://developer.mozilla.org | Web 标准/前端 |
| LeetCode 题库 | https://leetcode.cn | 算法/编码 |
| 各数据库官方文档 | PostgreSQL/MySQL/Redis/MongoDB 官网 | 数据存储 |

**硬性要求**：每题 `source` 必须为上表中的真实 URL（或等价的官方文档），禁止无出处编造。

## 二、轮转表（按周轮换，21 个顶层技术域）

自动化按 `周序号 % 21` 取对应行；已覆盖的行可顺延到下一个空分类最多的域。
每批建议 **6–10 题**，覆盖该行 3–4 个叶子分类，每分类 2–3 题，难度初中高搭配。

| # | 顶层域 | 优先填充的叶子分类（示例） | 推荐来源 |
|---|--------|----------------------------|----------|
| 0 | 计算机科学基础 | 数据结构、算法、复杂度分析 | CS-Notes |
| 1 | 编程语言与编程基础 | 语言特性、内存模型、并发基础 | JavaGuide / CS-Notes |
| 2 | 数据库与数据存储 | 关系型数据库、非关系型数据库、数据库设计与调优 | 小林coding / 官方文档 |
| 3 | 操作系统与系统运维 | Linux操作系统、存储与文件系统、系统调优 | CS-Notes / 小林coding |
| 4 | 计算机网络与协议 | TCP/IP协议、HTTP与HTTPS、DNS原理 | CS-Notes / 小林coding |
| 5 | Web前端开发 | 前端基础、前端框架、前端性能优化 | MDN / React / Vue 官方 |
| 6 | 后端开发与服务端框架 | Spring Boot、Web 框架、服务端架构 | Spring 官方 / JavaGuide |
| 7 | 软件工程与设计模式 | 设计模式、软件架构模式、重构技巧 | JavaGuide / Martin Fowler |
| 8 | 软件测试 | 功能测试、自动化测试、性能测试 | 测试岗内部知识库 |
| 9 | 分布式系统与微服务 | CAP理论、分布式事务、一致性算法、消息队列 | JavaGuide / 美团技术 |
| 10 | 云原生与DevOps | 容器与K8s、CI/CD、可观测性 | 官方文档 / 云厂商文档 |
| 11 | 大数据与数据工程 | 数据仓库、流处理、离线计算 | 官方文档 |
| 12 | 人工智能与机器学习 | 机器学习基础、深度学习、NLP/LLM | 课程/官方文档 |
| 13 | 信息安全与网络安全 |  Web安全、加密学基础、渗透基础 | OWASP / 官方文档 |
| 14 | 移动端与跨平台开发 | Android、iOS、Flutter/React Native | 官方文档 |
| 15 | 游戏开发与图形图像 | 渲染基础、游戏引擎、图形API | 官方文档 |
| 16 | 嵌入式与物联网 | 嵌入式C、RTOS、物联网协议 | 官方文档 |
| 17 | 音视频与流媒体 | 编解码、直播架构、WebRTC | 官方文档 |
| 18 | 区块链与Web3 | 共识机制、智能合约、密码学应用 | 官方文档 |
| 19 | 产品与项目管理 | 需求分析、敏捷、技术沟通 | 通用方法论 |
| 20 | 通用面试能力与软技能 | 行为面试、系统设计思路、沟通表达 | 通用方法论 |

## 三、运行规则（自动化必须遵守）

1. **先拉最新**：运行前先 `git pull`（或重新下载 `data/published.json`），避免基于旧数据生成导致 ID/去重重算错误。
2. **取材有源**：每题必须带真实 `source` URL；答案须准确、可直接发布（Markdown）。
3. **正确归类**：用 `category`（叶子分类名）与 `positions`（岗位名）引用，`enrich_questions.py` 自动解析 ID；名字写错脚本会给出近似建议并跳过该题。
4. **去重**：脚本按归一化标题去重；若某题已存在则跳过，不强行覆盖。
5. **合并与发布**：
   - 本地调试用 `--dry` 校验；
   - 正式合并后提交 git；
   - 若配置了 `GH_PUBLISH_TOKEN`，用 `--push` 推到 Pages 源分支（默认 `release,main` 双写）以更新线上；
   - **分享页自动跟发（2026-08-29 起）**：`--push` 在题库推送成功后自动重跑 `gen-share-pages.js`，并把本次新增题的 `q/<id>.html` 推上同样的两个分支；本地合并（不带 `--push`）也会重生成分享页但不推送。分享页生成/推送失败只告警，绝不影响题库发布主流程。
   - 本机 Python：用 uv 管理的 `C:\Users\Life\AppData\Roaming\uv\python\cpython-3.12.13-windows-x86_64-none\python.exe`（注册表里的 3.11.4 已卸载，只剩残留目录）。
6. **节奏**：每周一次，单批 6–10 题；空分类填满后转为「深度补充 + 校订已有题答案」。
7. **记录**：每次扩充后在 README 的「自动扩充记录」追加一行（日期 / 批号 / 域 / 题数）。

## 四、批次文件命名

`tools/batches/YYYY-MM-DD-<序号>.json`（如 `2026-08-27-a.json`），
与 `enrich_questions.py` 的 `--all` 模式兼容，可一次性补齐多批。
