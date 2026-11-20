/* =========================================================================
 *  js/docs/sysdesign.js — 技术教程「系统设计」方向数据
 *
 *  章节骨架参考：
 *    · Alex Xu《System Design Interview》第 1、2 卷的章节顺序（方法论 → 估算 → 经典题）
 *    · donnemartin/system-design-primer 的主题索引（扩展性、缓存、数据库、异步、一致性）
 *    · ByteByteGo 的系统设计专题与 AWS Well-Architected 可靠性支柱
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 *  ⚠ shell 里的变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const SYSDESIGN = {
    id: "sysdesign",
    name: "系统设计",
    icon: "🏗️",
    desc: "后端面试和架构工作都绕不开的系统设计：先学四步答题法和容量估算，掌握负载均衡、缓存、分库分表、消息队列、一致性这些基础组件，再逐个拆解短链、限流器、分布式 ID、排行榜、秒杀、Feed 流、IM 聊天、通知推送、搜索联想、文件存储等经典题。按《System Design Interview》、system-design-primer 与 ByteByteGo 的目录组织。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "掌握系统设计的答题方法和容量估算，理解一个系统从单机扩展到百万用户要经过哪些组件，会用缓存。",
        chapters: [
          // <sd-basic>
          {
            id: "sd-method",
            title: "系统设计四步答题法：需求、估算、架构、深挖",
            minutes: 15,
            updated: "2026-11-20",
            applies: "后端 / 架构面试通用",
            tags: ["系统设计", "面试", "方法论"],
            terms: ["功能需求", "非功能需求", "QPS", "高层设计", "深入设计", "取舍"],
            body: `
> **官方文档基线**：[system-design-primer · How to approach a system design interview question](https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question) · Alex Xu《System Design Interview》第 3 章 A Framework for System Design Interviews · [ByteByteGo](https://bytebytego.com/)

## 一、系统设计题在考什么

面试官说「设计一个短链系统」，不是想要一份标准答案。题目本身是开放的，考察的是四件事：**会不会先问清楚需求、能不能估出量级、能不能画出合理的架构、遇到瓶颈知不知道怎么取舍**。一个 45 分钟的面试，如果你一上来就画 Redis 和 Kafka，基本已经失分了。

![系统设计四步答题法](/assets/diagrams/docs/sd-four-steps.svg)

## 二、第一步：澄清需求（约 5 分钟）

需求分两类，都要问：

| 类型 | 要问的问题 | 以短链为例 |
| --- | --- | --- |
| 功能需求 | 用户能做什么？哪些功能本次不做？ | 长链生成短链、短链跳转；不做自定义域名 |
| 非功能需求 | 用户量多大？读多还是写多？延迟、可用性要求？ | 日活 1 亿，读写比 10:1，跳转延迟 < 50ms |
| 约束 | 数据保留多久？是否需要统计？ | 保留 5 年，需要点击统计 |

把确认好的需求写在白板角落。后面所有设计都要能回到这几条上：**设计是为需求服务的**。

## 三、第二步：估算量级（约 5 分钟）

估算不要求精确，要求数量级正确，用来判断「单机够不够」「要不要分库」。常用换算：一天约 10⁵ 秒，日请求 1 亿 ≈ 平均 1200 QPS，峰值按平均的 2~5 倍算。具体方法见下一章《容量估算》。

## 四、第三步：高层设计（约 15 分钟）

先画出能跑通核心流程的最简架构，再逐步加组件：

1. 定义 API：${C}POST /api/shorten {longUrl}${C} 返回短码，${C}GET /{code}${C} 返回 302 跳转。
2. 定义数据模型：一张表 ${C}(code, long_url, created_at)${C}，code 为主键。
3. 画出主流程：客户端 → 负载均衡 → 应用服务 → 缓存 → 数据库。
4. 和面试官确认：「这个架构能满足功能需求，接下来我重点讲短码生成和高并发读，可以吗？」

## 五、第四步：深入设计（约 15 分钟）

挑 1~2 个最关键的点深挖，通常就是题目的难点：

- 短链：短码怎么生成才不冲突？
- 秒杀：库存怎么扣才不超卖？
- Feed 流：大 V 发帖后怎么推给千万粉丝？

每个点都要讲**至少两种方案和它们的取舍**，例如「哈希截断简单但会冲突，发号器无冲突但多一个依赖，我选发号器，因为……」。最后留 3~5 分钟总结：瓶颈在哪、单点在哪、监控看什么、如果流量再涨 10 倍改哪里。

## 六、常用的取舍维度

| 维度 | 一边 | 另一边 |
| --- | --- | --- |
| 一致性 vs 可用性 | 强一致，故障时拒绝服务 | 最终一致，故障时仍可读写 |
| 延迟 vs 吞吐 | 单条立即处理 | 攒批处理，吞吐高但慢 |
| 推 vs 拉 | 写时扩散，读快 | 读时聚合，写快 |
| 空间 vs 时间 | 预计算、缓存 | 实时计算 |
| 简单 vs 灵活 | 单体 | 微服务 |

## ⚠ 常见失分点

- **不问需求直接画图**：面试官会认为你在背答案。
- **一上来就上全家桶**：日活 1 万的系统画了 Kafka、ES、分库分表，说明没有量级概念。
- **只讲一种方案**：没有取舍就看不出判断力。
- **全程自说自话**：每一步结束都和面试官确认方向，他给的提示往往就是考点。

## ✅ 自检清单

- 能说出四个步骤和每步大概用时。
- 能针对任意一道题列出 3 条功能需求和 3 条非功能需求。
- 能在白板上先画出最简架构，再说明下一步加什么。
- 讲任何方案时，能同时说出它的缺点。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 1、3 章
- system-design-primer：Study guide 与 Interview questions 部分
`
          },
          {
            id: "sd-estimation",
            title: "容量估算：QPS、存储、带宽和机器数",
            minutes: 12,
            updated: "2026-11-20",
            applies: "系统设计面试 / 容量规划",
            tags: ["系统设计", "估算"],
            terms: ["QPS", "峰值", "日活 DAU", "存储估算", "带宽", "延迟数字"],
            body: `
> **官方文档基线**：[system-design-primer · Back-of-the-envelope calculations](https://github.com/donnemartin/system-design-primer#appendix) · Jeff Dean《Latency Numbers Every Programmer Should Know》 · Alex Xu《System Design Interview》第 2 章

## 一、为什么要估算

估算决定架构。日请求 100 万，一台 MySQL 就够；日请求 100 亿，就必须考虑缓存、分库和多机房。面试官要看的是你**能不能用几个简单数字推出量级**，而不是算到小数点后几位。

## 二、必须背下来的数字

| 项目 | 近似值 |
| --- | --- |
| 一天的秒数 | 86400 ≈ 10⁵ |
| 2 的 10 / 20 / 30 / 40 次方 | 千 KB / 百万 MB / 十亿 GB / 万亿 TB |
| 内存随机读 | 约 100 ns |
| SSD 随机读 | 约 100 µs |
| 同机房网络往返 | 约 0.5 ms |
| 跨地域网络往返 | 30~150 ms |
| 单台 Redis | 约 10 万 QPS |
| 单台 MySQL（简单查询） | 几千到 1 万 QPS |
| 单台应用服务（Java/Go） | 几千 QPS，视业务而定 |

记住结论：**内存比磁盘快约 1000 倍，跨机房比机房内慢约 100 倍**。这就是为什么要加缓存、为什么要就近部署。

## 三、四类估算公式

**1. QPS**

${F}text
平均 QPS = 日活 × 每人每天请求数 ÷ 86400
峰值 QPS = 平均 QPS × 2~5（秒杀、春晚可到 10 倍以上）
${F}

**2. 存储**

${F}text
每天新增存储 = 每天新增条数 × 单条大小
总存储 = 每天新增 × 365 × 保留年数 × 副本数（通常 3）
${F}

**3. 带宽**

${F}text
入口带宽 = 写 QPS × 单次请求大小
出口带宽 = 读 QPS × 单次响应大小
${F}

**4. 机器数**

${F}text
机器数 = 峰值 QPS ÷ 单机能力 × 冗余系数（1.5~2）
${F}

## 四、完整例子：估算一个类微博系统

假设：日活 1 亿，每人每天发 1 条、刷 100 条，每条 300 字节文本，10% 带图片，图片平均 200KB。

| 项目 | 计算 | 结果 |
| --- | --- | --- |
| 写 QPS | 1 亿 × 1 ÷ 10⁵ | 约 1000，峰值 5000 |
| 读 QPS | 1 亿 × 100 ÷ 10⁵ | 约 10 万，峰值 50 万 |
| 文本存储/天 | 1 亿 × 300B | 30 GB |
| 图片存储/天 | 1000 万 × 200KB | 2 TB |
| 5 年图片 | 2TB × 365 × 5 | 约 3.6 PB |
| 读出口带宽 | 10 万 × 每次 10 条 × 300B | 约 300 MB/s（不含图片） |

从表里马上能得出三个设计结论：读是写的 100 倍，**必须重缓存**；图片是存储大头，**要放对象存储 + CDN**；50 万峰值读，Redis 集群也要几台起步。

## 五、估算时的表达技巧

- 主动说假设：「我假设日活 1 亿，平均每人请求 10 次，您看可以吗？」
- 取整再算：86400 直接当 10⁵，1024 当 1000，结果差不了一个数量级。
- 算完说结论：「写 QPS 才 1000，单库能扛；读 QPS 10 万，需要缓存。」数字本身不重要，**数字推出的结论才是得分点**。

## ⚠ 踩坑

- 忘了峰值：按平均值设计，大促当天必然出事。
- 忘了副本：数据库和对象存储一般存 3 份，存储要乘 3。
- 单位混乱：bit 和 byte 差 8 倍，网卡 1Gbps ≈ 125MB/s。

## ✅ 自检清单

- 能背出一天的秒数和单台 Redis、MySQL 的大致 QPS。
- 能在 2 分钟内估出一个系统的读写 QPS、存储和带宽。
- 能从估算结果推出「要不要缓存、要不要分库、要不要 CDN」。

## 📚 延伸阅读

- Jeff Dean：Latency Numbers Every Programmer Should Know
- Alex Xu《System Design Interview》第 1 卷第 2 章 Back-of-the-envelope Estimation
`
          },
          {
            id: "sd-scale-basics",
            title: "从单机到百万用户：负载均衡、无状态与 CDN",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Web 后端通用",
            tags: ["系统设计", "扩展性", "负载均衡"],
            terms: ["垂直扩展", "水平扩展", "负载均衡", "无状态", "CDN", "反向代理", "读写分离"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 章 Scale from Zero to Millions of Users · [system-design-primer · Scalability / Load balancer / CDN](https://github.com/donnemartin/system-design-primer#index-of-system-design-topics) · [NGINX · HTTP Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)

## 一、一个系统是怎么长大的

几乎所有互联网系统都沿着同一条路线演进。每一步都是为了解决上一步暴露出来的瓶颈，而不是一开始就设计好。

![从单机到百万用户的架构演进](/assets/diagrams/docs/sd-scale-evolution.svg)

## 二、垂直扩展和水平扩展

| 方式 | 做法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 垂直扩展（Scale Up） | 换更大的机器：更多 CPU、内存 | 简单，代码不用改 | 有上限，单点故障 |
| 水平扩展（Scale Out） | 加更多机器分担流量 | 理论无上限，能容错 | 要处理分发、状态、一致性 |

早期用垂直扩展最划算；流量上来后，必须水平扩展。

## 三、负载均衡

负载均衡器（LB）站在应用服务器前面，把请求分发到多台机器，并把故障机器摘掉。

| 层级 | 代表 | 能看到什么 |
| --- | --- | --- |
| 四层（L4） | LVS、云厂商 NLB | IP + 端口，转发快 |
| 七层（L7） | Nginx、Envoy、云厂商 ALB | URL、Header、Cookie，可按路径分流 |

常见分发算法：轮询、加权轮询、最少连接、IP 哈希、一致性哈希。LB 自己也要做主备，否则它就成了新的单点。

${F}nginx
upstream app {
    least_conn;                       # 最少连接
    server 10.0.0.11:8080 weight=2;
    server 10.0.0.12:8080;
    server 10.0.0.13:8080 backup;     # 备用机
}
server {
    location / { proxy_pass http://app; }
}
${F}

## 四、无状态服务

水平扩展的前提是**应用服务器无状态**：任何一台机器都能处理任何用户的请求。做法是把会话、购物车这类状态从本机内存挪到共享存储（Redis），或者放进客户端的 JWT 里。

如果会话存在本机内存，就只能用「粘性会话」把同一用户钉在同一台机器上，这台机器一挂，用户就掉线，扩缩容也很难做。

## 五、CDN 与静态资源

图片、JS、CSS、视频这类静态内容占了大部分带宽。把它们放到 CDN，用户从最近的边缘节点拿，源站只处理动态请求。要点：

- 文件名带版本号或哈希（${C}app.3f9a.js${C}），更新时换名字，缓存可以设很长。
- 设好 ${C}Cache-Control${C}，动态接口一般不进 CDN。
- 大文件上传直传对象存储，不经过应用服务器。

## 六、数据库这一层

应用层扩开后，瓶颈很快落到数据库。顺序一般是：**加缓存 → 读写分离（一主多从）→ 垂直拆库 → 水平分片**。后面两章分别讲缓存和分库分表。

## ⚠ 踩坑

- 加了多台机器但会话还在本机，用户请求换一台就被登出。
- LB 健康检查只查端口不查业务，进程卡死了流量还在打过去。
- 静态资源不带版本号又设了长缓存，发版后用户拿到旧文件。

## ✅ 自检清单

- 能画出从单机到「LB + 多应用 + 缓存 + 主从库 + CDN」的演进图。
- 能说出四层和七层负载均衡的区别。
- 能解释为什么水平扩展要求服务无状态。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 1 章
- system-design-primer：Load balancer、Reverse proxy、CDN 三节
`
          },
          {
            id: "sd-cache",
            title: "缓存设计：旁路缓存、穿透、击穿、雪崩与一致性",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Redis 7.x / 本地缓存通用",
            tags: ["系统设计", "缓存", "Redis"],
            terms: ["Cache Aside", "缓存穿透", "缓存击穿", "缓存雪崩", "布隆过滤器", "TTL", "延迟双删", "多级缓存"],
            body: `
> **官方文档基线**：[Redis Docs · Client-side caching](https://redis.io/docs/latest/develop/reference/client-side-caching/) · [AWS · Caching Best Practices](https://aws.amazon.com/caching/best-practices/) · [system-design-primer · Cache](https://github.com/donnemartin/system-design-primer#cache)

## 一、缓存为什么有效

大部分系统读远多于写，而且热点集中：20% 的数据承担 80% 的访问。把热点数据放在内存里，Redis 一次读约 0.1ms，MySQL 一次查询往往 1~10ms，**缓存命中率 95% 时数据库压力只剩 1/20**。

## 二、四种读写模式

| 模式 | 读 | 写 | 适用 |
| --- | --- | --- | --- |
| Cache Aside（旁路缓存） | 先读缓存，没有再读库并回填 | 先写库，再**删**缓存 | 最常用，业务自己控制 |
| Read/Write Through | 应用只和缓存交互，缓存负责读写库 | 同左 | 有缓存中间件支持时 |
| Write Behind（回写） | 同上 | 只写缓存，异步批量落库 | 计数、点赞，允许丢少量 |
| Refresh Ahead | 快过期前主动刷新 | — | 热点、读取模式稳定 |

![Cache Aside 读写流程](/assets/diagrams/docs/sd-cache-aside.svg)

${F}java
// Cache Aside 读
public User getUser(long id) {
    String key = "user:" + id;
    User u = redis.get(key);
    if (u != null) return u;
    u = userMapper.selectById(id);
    // 空值也缓存短时间，防穿透；TTL 加随机数，防雪崩
    redis.set(key, u == null ? NULL_USER : u, 600 + random.nextInt(120));
    return u;
}
// Cache Aside 写：先更新数据库，再删除缓存
public void updateUser(User u) {
    userMapper.updateById(u);
    redis.del("user:" + u.getId());
}
${F}

## 三、为什么是「删缓存」而不是「更新缓存」

- 两个并发写，更新缓存的顺序可能和写库顺序相反，缓存里留下旧值。
- 有些缓存值是多张表计算出来的，每次写都重算很浪费，删掉等下次读再算更省。

为什么是「先写库再删缓存」？如果先删缓存，另一个读请求会在写库完成前把旧值读回缓存。先写库再删，只在极小的时间窗口内可能不一致。要求更高时用**延迟双删**（写库后删一次，隔几百毫秒再删一次），或者订阅 binlog（Canal）异步删缓存，删除失败就重试。

## 四、三大经典问题

| 问题 | 现象 | 解决方案 |
| --- | --- | --- |
| 缓存穿透 | 查**不存在**的数据，每次都打到库，常见于恶意请求 | 缓存空值（短 TTL）；布隆过滤器拦截；参数校验 |
| 缓存击穿 | **一个**热点 key 过期瞬间，大量请求同时打库 | 互斥锁只让一个请求回源；热点 key 逻辑过期、后台刷新 |
| 缓存雪崩 | **大批** key 同时过期，或 Redis 整体宕机 | TTL 加随机值；Redis 集群高可用；限流降级；多级缓存 |

击穿的互斥锁写法：

${F}text
SET lock:user:42 1 NX EX 5     # 抢到锁的请求去查库并回填
没抢到的请求 sleep 50ms 后重读缓存
${F}

## 五、多级缓存与热点

超大流量下，Redis 单个 key 也会被打爆（单分片约 10 万 QPS 上限）。常见做法是**本地缓存（Caffeine）+ Redis + 数据库**三级：本地缓存存极热数据，TTL 只有几秒；热点 key 也可以复制成 ${C}key#1${C}…${C}key#N${C} 分散到多个分片。

## 六、淘汰策略

Redis 内存满了按 ${C}maxmemory-policy${C} 淘汰：缓存场景一般用 ${C}allkeys-lru${C} 或 ${C}allkeys-lfu${C}；既存缓存又存持久数据用 ${C}volatile-lru${C}，只淘汰设置了过期时间的 key。

## ⚠ 踩坑

- 大 key：一个 hash 存几十万字段，读一次阻塞 Redis，要拆分。
- 缓存没设过期：数据越积越多，最后靠淘汰策略乱删。
- 把缓存当数据库：Redis 宕机重启后数据丢失，业务直接不可用。

## ✅ 自检清单

- 能写出 Cache Aside 的读写流程，并解释为什么先写库再删缓存。
- 能区分穿透、击穿、雪崩，并各给出两种方案。
- 能说出布隆过滤器的原理和它「会误判存在、不会误判不存在」的特点。

## 📚 延伸阅读

- AWS：Caching Best Practices
- Facebook 论文：Scaling Memcache at Facebook（NSDI 2013）
`
          },
          {
            id: "sd-shorturl",
            title: "实战：设计一个短链系统",
            minutes: 15,
            updated: "2026-11-20",
            applies: "经典入门设计题",
            tags: ["系统设计", "短链", "面试题"],
            terms: ["短链", "Base62", "发号器", "301", "302", "布隆过滤器"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 8 章 Design a URL Shortener · [system-design-primer · Design Pastebin.com (or Bit.ly)](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md)

## 一、澄清需求

- **功能**：输入长链返回短链；访问短链跳转到长链；可选：过期时间、访问统计。
- **非功能**：每天新增 1 亿条，读写比 10:1；跳转延迟低；短链不能被轻易猜出连续值；高可用。

## 二、估算

| 项目 | 结果 |
| --- | --- |
| 写 QPS | 1 亿 ÷ 10⁵ ≈ 1000，峰值 3000 |
| 读 QPS | 约 1 万，峰值 3 万 |
| 10 年总条数 | 1 亿 × 365 × 10 ≈ 3650 亿 |
| 单条大小 | 约 500 字节 |
| 10 年存储 | 约 180 TB |

短码长度：用 Base62（0-9、a-z、A-Z）编码，62⁷ ≈ 3.5 万亿，**7 位足够**。

## 三、高层设计

![短链系统架构](/assets/diagrams/docs/sd-shorturl.svg)

API：

${F}http
POST /api/v1/shorten
{"longUrl": "https://example.com/a/very/long/path?x=1"}
→ {"shortUrl": "https://s.cn/3fK9aZx"}

GET /3fK9aZx
→ 302 Found, Location: https://example.com/a/very/long/path?x=1
${F}

**301 还是 302？** 301 是永久重定向，浏览器会缓存，后续访问不再经过我们的服务，能减轻压力但**统计不到点击**；302 每次都会回到服务端，便于统计。需要统计就用 302。

## 四、深入：短码怎么生成

| 方案 | 做法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 哈希截断 | 对长链做 MD5，取前 7 位 | 同一长链得到同一短码 | 会冲突，要查库重试 |
| 自增 ID + Base62 | 发号器给一个全局唯一整数，再转 62 进制 | 不冲突，长度可控 | 值连续，可被遍历 |
| 预生成码池 | 离线生成随机码放进表，用时取一个 | 生成快，不可猜 | 要维护码池 |

推荐：**分布式发号器（号段模式）+ Base62**，再对 ID 做一次简单的可逆混淆，避免连续。

${F}python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def base62(n: int) -> str:
    s = []
    while n:
        n, r = divmod(n, 62)
        s.append(ALPHABET[r])
    return "".join(reversed(s)) or "0"

print(base62(125_000_000_000))   # 2cBfmtu，7 位
${F}

同一个长链要不要返回同一个短码？如果要，就加一张 ${C}long_url_hash → code${C} 的索引表，写之前先查。

## 五、深入：高并发跳转

- 读 QPS 是写的 10 倍，**短码 → 长链**的映射放 Redis，命中率可到 99% 以上。
- 不存在的短码用布隆过滤器拦截，防止恶意扫描穿透到数据库。
- 数据库按短码哈希分片，3650 亿条数据可分成 64~256 个分片。
- 点击统计不要同步写库，发到消息队列，异步聚合。

## ⚠ 常见失分点

- 只说「MD5 取前 7 位」，被追问冲突时答不上来。
- 不区分 301 和 302。
- 忘了限流：有人用脚本批量生成短链，会把码池和存储撑爆。

## ✅ 自检清单

- 能算出 7 位 Base62 的容量。
- 能对比三种短码生成方案。
- 能说出跳转链路上缓存和布隆过滤器各自的作用。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 8 章
- system-design-primer：Pastebin / Bit.ly 解答
`
          },
          // </sd-basic>
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "会做数据库扩展和异步解耦，理解一致性取舍，能独立完成限流器、分布式 ID、短链、排行榜这类中等难度设计题。",
        chapters: [
          // <sd-mid>
          {
            id: "sd-sharding",
            title: "数据库扩展：读写分离、分库分表与一致性哈希",
            minutes: 16,
            updated: "2026-11-20",
            applies: "MySQL 8.x / ShardingSphere / 通用",
            tags: ["系统设计", "分库分表", "数据库"],
            terms: ["读写分离", "主从延迟", "垂直拆分", "水平分片", "分片键", "一致性哈希", "虚拟节点"],
            body: `
> **官方文档基线**：[MySQL 8.0 · Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html) · [Apache ShardingSphere · 数据分片](https://shardingsphere.apache.org/document/current/cn/features/sharding/) · Alex Xu《System Design Interview》第 5 章 Design Consistent Hashing

## 一、扩展数据库的顺序

数据库是最难扩展的一层，因为它有状态。顺序从易到难：**SQL 与索引优化 → 加缓存 → 读写分离 → 垂直拆分 → 水平分片**。能在前一步解决的，就不要进入下一步，分片会让开发和运维复杂度上一个台阶。

## 二、读写分离

一主多从：写走主库，读走从库，主库通过 binlog 把变更复制给从库。

**主从延迟**是最大的坑：用户刚改完昵称，刷新页面读从库，看到的还是旧的。处理方法：

- 写后短时间内的读强制走主库（例如在会话里记一个标记，3 秒内读主）。
- 关键读（支付结果、库存）始终走主库。
- 监控 ${C}Seconds_Behind_Source${C}，延迟过大时把从库摘掉。

## 三、垂直拆分与水平分片

| 方式 | 怎么拆 | 解决什么 |
| --- | --- | --- |
| 垂直分库 | 按业务拆：用户库、订单库、商品库 | 单库连接数、业务耦合 |
| 垂直分表 | 大字段拆出去：商品基本信息和详情分开 | 单行过宽、缓存效率低 |
| 水平分片 | 同一张表按分片键拆到多个库表 | 单表数据量和写入压力 |

单表一般在 **2000 万行或 10GB** 左右开始考虑水平分片，这只是经验值，和行宽、索引、硬件都有关。

## 四、分片键怎么选

分片键决定数据落在哪个分片，选错了后面很难改：

- 选**查询最频繁的维度**：订单按 ${C}user_id${C} 分，「查我的订单」只落一个分片。
- **分布要均匀**：按日期分，所有新数据都写最新分片，形成热点。
- 商家要按商家查订单怎么办？建一份按 ${C}merchant_id${C} 分片的冗余表，或者同步到 ES 查询。
- 订单号里嵌入用户 ID 的后几位（基因法），按订单号查也能定位到分片。

## 五、分片算法与一致性哈希

| 算法 | 规则 | 问题 |
| --- | --- | --- |
| 范围 | id 1~1000 万在分片 0 | 新数据集中在最后一片 |
| 取模 | ${C}user_id % 16${C} | 扩容到 17 片时几乎所有数据都要迁移 |
| 一致性哈希 | 节点和 key 都映射到哈希环上，key 顺时针找最近节点 | 加节点只影响一段区间 |

![一致性哈希环](/assets/diagrams/docs/sd-consistent-hash.svg)

一致性哈希配合**虚拟节点**：每台物理节点在环上放 100~200 个虚拟点，数据分布才均匀。实践中数据库更常见的做法是「预分片」：一开始就分 1024 个逻辑分片，映射到少量物理库，扩容时只搬逻辑分片，不改路由规则。

## 六、分片之后的代价

- **跨分片查询**：分页、排序、聚合要在多个分片查完再合并，深分页很慢。
- **跨分片事务**：需要分布式事务或改成最终一致（见《一致性》章节）。
- **全局唯一 ID**：不能再用自增主键（见《分布式 ID》章节）。
- **扩容迁移**：双写 → 数据迁移 → 校验 → 切读 → 切写，要有回滚方案。

## ⚠ 踩坑

- 分片键用了会变化的字段，用户改了城市数据就找不到了。
- 先分表不分库：单机 IO 和连接数的瓶颈还在。
- 没有提前规划，扩容时只能停机迁移。

## ✅ 自检清单

- 能说出扩展数据库的五个步骤及先后原因。
- 能为订单表选择分片键，并解决按商家查询的问题。
- 能画出一致性哈希环并解释虚拟节点的作用。

## 📚 延伸阅读

- ShardingSphere 官方文档：数据分片、分布式事务
- Karger 等：Consistent Hashing and Random Trees（1997）
`
          },
          {
            id: "sd-mq",
            title: "消息队列与异步：削峰、解耦和可靠投递",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Kafka 3.x / RocketMQ 5.x / RabbitMQ",
            tags: ["系统设计", "消息队列", "异步"],
            terms: ["削峰填谷", "解耦", "至少一次", "幂等", "死信队列", "顺序消息", "消息积压"],
            body: `
> **官方文档基线**：[Apache Kafka · Design](https://kafka.apache.org/documentation/#design) · [RocketMQ 5.x · 领域模型](https://rocketmq.apache.org/zh/docs/domainModel/01main) · [system-design-primer · Asynchronism](https://github.com/donnemartin/system-design-primer#asynchronism)

## 一、什么时候需要消息队列

| 用途 | 场景 | 没有 MQ 会怎样 |
| --- | --- | --- |
| 异步 | 下单后发短信、加积分、写日志 | 接口串行调用 5 个服务，耗时叠加 |
| 解耦 | 订单服务不需要知道谁关心「订单已支付」 | 每加一个下游，订单服务都要改代码 |
| 削峰 | 秒杀瞬间 10 万请求，库存服务只能扛 5000 | 下游被打垮 |
| 广播 | 一条变更同步到缓存、搜索、数仓 | 多处双写，容易不一致 |

![消息队列削峰与解耦](/assets/diagrams/docs/sd-mq.svg)

代价也要讲：系统多了一个组件，链路变长，问题从「调用失败」变成「消息丢了、重了、乱序了、积压了」。

## 二、主流产品怎么选

| 产品 | 特点 | 适合 |
| --- | --- | --- |
| Kafka | 吞吐极高，按分区顺序追加写，消息可回溯 | 日志、埋点、流计算 |
| RocketMQ | 事务消息、延时消息、消息过滤，Java 生态 | 电商交易链路 |
| RabbitMQ | 路由灵活，延迟低，吞吐中等 | 中小规模业务消息 |
| Redis Stream | 轻量，复用已有 Redis | 小规模、可容忍丢失 |

## 三、消息不丢：三个环节都要管

1. **生产端**：同步发送并检查结果，失败重试；Kafka 设 ${C}acks=all${C}。
2. **Broker**：多副本，Kafka 设 ${C}min.insync.replicas=2${C}，刷盘策略按业务选。
3. **消费端**：**业务处理成功后再提交位点**，不要先提交再处理。

关键链路还可以用「本地消息表」：业务写库的同一个事务里插一条待发送消息，后台任务扫描并投递，投递成功再标记完成。

## 四、消息重复：消费端必须幂等

网络重试、消费者重启都会造成重复投递。主流 MQ 提供的是**至少一次**语义，「恰好一次」要靠业务幂等：

${F}sql
-- 方法一：唯一约束，重复插入直接失败
CREATE TABLE consumed_msg (msg_id VARCHAR(64) PRIMARY KEY, created_at DATETIME);

-- 方法二：状态机，只有「待支付」才能变成「已支付」
UPDATE orders SET status = 'PAID' WHERE id = 123 AND status = 'UNPAID';
${F}

## 五、顺序与积压

- **顺序**：只保证同一分区（队列）内有序。把同一订单的消息用订单号做 key 发到同一分区，就能保证这个订单的状态变更有序。
- **积压**：先看消费者是不是卡在某条消息上（如下游超时）；临时扩容消费者数量（不能超过分区数）；必要时把消息转储到新的大分区 Topic 快速消化。
- **失败**：重试若干次仍失败的消息进入**死信队列**，人工或定时任务处理，不要无限重试阻塞后面的消息。

## ⚠ 踩坑

- 消费者自动提交位点，处理到一半进程崩了，消息丢失。
- 用 MQ 传大对象（几 MB 的文件），应只传 ID，消费者再去取。
- 把 MQ 当成同步调用：生产者发完消息就轮询等结果。

## ✅ 自检清单

- 能说出 MQ 的四种用途和带来的四类新问题。
- 能从生产、存储、消费三个环节说清怎么不丢消息。
- 能给出两种消费幂等的实现。

## 📚 延伸阅读

- Kafka 官方文档：Design 章节（持久化、副本、消费者位点）
- RocketMQ 官方文档：事务消息、顺序消息
`
          },
          {
            id: "sd-consistency",
            title: "一致性与分布式事务：CAP、BASE、TCC 与 Saga",
            minutes: 16,
            updated: "2026-11-20",
            applies: "微服务 / 分布式系统通用",
            tags: ["系统设计", "一致性", "分布式事务"],
            terms: ["CAP", "BASE", "最终一致性", "两阶段提交", "TCC", "Saga", "本地消息表", "幂等"],
            body: `
> **官方文档基线**：[system-design-primer · CAP theorem / Consistency patterns](https://github.com/donnemartin/system-design-primer#cap-theorem) · [Seata 文档 · AT / TCC / Saga 模式](https://seata.apache.org/zh-cn/docs/overview/what-is-seata) · [microservices.io · Saga pattern](https://microservices.io/patterns/data/saga.html)

## 一、CAP：网络出问题时选什么

CAP 说的是：分布式系统发生**网络分区（P）**时，只能在**一致性（C）**和**可用性（A）**之间选一个。分区在真实网络里一定会发生，所以真正的选择是 CP 还是 AP。

| 选择 | 分区时的表现 | 例子 |
| --- | --- | --- |
| CP | 宁可拒绝请求，也不返回旧数据 | ZooKeeper、etcd、银行核心账务 |
| AP | 继续服务，数据之后再对齐 | Cassandra、DNS、商品详情、点赞数 |

同一个系统里不同数据可以有不同选择：订单金额要 CP，商品浏览量 AP 就够了。

## 二、BASE 与一致性级别

BASE（基本可用、软状态、最终一致）是 AP 思路的工程化：允许中间状态，保证一段时间后数据一致。常见一致性级别从强到弱：

- **强一致**：写完立刻所有人都读到新值。
- **读己之写**：自己写的自己马上能看到，别人可以晚一点。
- **最终一致**：不保证什么时候，但最终会一致。

## 三、分布式事务五种方案

下单要同时「创建订单、扣库存、扣余额」，三者在不同服务、不同数据库里，本地事务管不住。

![分布式事务方案对比](/assets/diagrams/docs/sd-dist-tx.svg)

| 方案 | 原理 | 一致性 | 侵入性 | 适用 |
| --- | --- | --- | --- | --- |
| 2PC / XA | 协调者先问所有参与者能否提交，都同意再提交 | 强 | 低 | 单体内多库，并发不高 |
| TCC | 每个服务实现 Try（预留）、Confirm（确认）、Cancel（取消） | 最终 | 高 | 资金、库存等核心链路 |
| Saga | 一串本地事务，失败时倒序执行补偿 | 最终 | 中 | 长流程：订票、审批 |
| 本地消息表 | 业务和消息在同一事务落库，异步投递 | 最终 | 中 | 最常用，简单可靠 |
| 事务消息 | RocketMQ 半消息 + 回查 | 最终 | 中 | 有 RocketMQ 时 |

TCC 扣库存示例：

${F}text
Try     : 库存 100 → 可用 99，冻结 1      （资源预留，可撤销）
Confirm : 冻结 1 → 0，真正扣减          （所有服务 Try 成功后）
Cancel  : 冻结 1 → 0，可用 99 → 100     （任一服务 Try 失败时）
${F}

TCC 必须处理三个细节：**幂等**（Confirm 可能被重复调用）、**空回滚**（Try 没执行就收到 Cancel）、**悬挂**（Cancel 执行后迟到的 Try 又来了）。

## 四、怎么选

1. 先想能不能**避免分布式事务**：把强相关的数据放在同一个服务、同一个库。
2. 能接受最终一致的，用**本地消息表或事务消息**。
3. 资金类、要求可预留的，用 **TCC**。
4. 流程长、步骤多、调用外部系统的，用 **Saga**。
5. 无论哪种方案，都要有**对账**兜底：定时比对各方数据，发现不一致就告警或自动修复。

## ⚠ 踩坑

- 以为 2PC 能解决所有问题：协调者故障时参与者会一直锁着资源。
- 补偿操作不幂等，重试一次退了两次款。
- 没有对账，靠用户投诉才发现数据不一致。

## ✅ 自检清单

- 能用一句话说清 CAP，并举出 CP、AP 的例子。
- 能对比 2PC、TCC、Saga、本地消息表的一致性和侵入性。
- 能说出 TCC 的空回滚和悬挂是什么。

## 📚 延伸阅读

- Martin Kleppmann《数据密集型应用系统设计》第 7、9 章
- microservices.io：Saga、Transactional outbox 模式
`
          },
          {
            id: "sd-rate-limiter",
            title: "实战：设计一个限流器",
            minutes: 14,
            updated: "2026-11-20",
            applies: "网关 / 微服务通用",
            tags: ["系统设计", "限流", "面试题"],
            terms: ["限流", "令牌桶", "漏桶", "固定窗口", "滑动窗口", "429", "分布式限流"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 4 章 Design a Rate Limiter · [Stripe · Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters) · [NGINX · Limiting Access to Proxied HTTP Resources](https://docs.nginx.com/nginx/admin-guide/security-controls/controlling-access-proxied-http/)

## 一、澄清需求

- 按什么限：用户 ID、IP、API Key，还是接口？
- 规则：例如每个用户每秒 10 次、每天 1 万次。
- 部署：单机还是集群？限流放在网关还是服务内？
- 被限流时：返回 ${C}429 Too Many Requests${C}，带上 ${C}Retry-After${C} 头。
- 非功能：限流本身延迟要低（< 1ms），限流组件挂了**不能影响主业务**（失败放行）。

## 二、五种算法

![限流算法对比](/assets/diagrams/docs/sd-rate-limit.svg)

| 算法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 固定窗口 | 每个自然秒一个计数器 | 最简单 | 窗口边界突刺：59.9 秒和 60.1 秒各来 10 个，0.2 秒内 20 个 |
| 滑动窗口日志 | 记录每次请求时间戳，统计最近 1 秒内的条数 | 精确 | 内存大 |
| 滑动窗口计数 | 当前窗口计数 + 上一窗口计数 × 重叠比例 | 平滑，省内存 | 近似值 |
| 令牌桶 | 按固定速率放令牌，请求拿到令牌才能过 | **允许一定突发**，最常用 | 两个参数要调 |
| 漏桶 | 请求进队列，按固定速率流出 | 输出绝对平滑 | 突发请求要排队 |

令牌桶的两个参数：**速率**（每秒放几个令牌）和**容量**（桶最多存几个，决定能容忍多大的突发）。Guava ${C}RateLimiter${C}、Nginx ${C}limit_req${C}（漏桶思想 + burst）、Sentinel 都基于这两类算法。

## 三、单机实现：令牌桶

${F}python
import time

class TokenBucket:
    def __init__(self, rate: float, capacity: int):
        self.rate, self.capacity = rate, capacity
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        # 不用定时器，按距离上次的时间差补令牌
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
${F}

## 四、集群限流：Redis + Lua

多台网关各自计数会导致总量超标，要把计数放到 Redis。读和改必须原子，用 Lua 脚本：

${F}lua
-- 滑动窗口：KEYS[1]=限流 key，ARGV: 当前毫秒、窗口毫秒、上限、请求唯一 ID
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
if redis.call('ZCARD', KEYS[1]) < tonumber(ARGV[3]) then
  redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
  return 1
end
return 0
${F}

性能优化：热点用户的限流可以「本地预取」，每台网关一次从 Redis 拿 100 个配额，用完再取，减少 Redis 访问。

## 五、架构

限流通常放在**网关层**统一做（按用户、IP、接口），服务内部再做一层保护自己的限流（按接口总 QPS）。规则存配置中心，热更新；被限流的请求打日志、出监控，方便判断是否误杀。

## ⚠ 常见失分点

- 只会固定窗口，说不出边界突刺问题。
- 用「先 GET 再 INCR」两条命令，并发下不准。
- 限流组件挂了导致全站不可用：Redis 超时要降级为本地限流或直接放行。

## ✅ 自检清单

- 能画出令牌桶和漏桶的区别。
- 能写出单机令牌桶的代码。
- 能说明集群限流为什么要用 Lua，以及 Redis 故障时怎么办。

## 📚 延伸阅读

- Stripe 工程博客：Scaling your API with rate limiters
- Alibaba Sentinel 官方文档：流量控制
`
          },
          {
            id: "sd-unique-id",
            title: "实战：设计分布式唯一 ID 生成器",
            minutes: 13,
            updated: "2026-11-20",
            applies: "分库分表 / 订单号 / 消息 ID",
            tags: ["系统设计", "分布式 ID", "面试题"],
            terms: ["UUID", "雪花算法", "号段模式", "时钟回拨", "趋势递增", "Leaf"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 7 章 Design a Unique ID Generator · [Twitter · Announcing Snowflake](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake) · [美团 Leaf 分布式 ID 生成系统](https://tech.meituan.com/2017/04/21/mt-leaf.html)

## 一、需求

分库分表后，自增主键会重复，需要一个全局唯一 ID。一般要求：

- **全局唯一**，这是底线。
- **趋势递增**：MySQL InnoDB 主键递增时插入是顺序写，B+ 树不会频繁分裂。
- **高性能高可用**：每秒几十万个，生成服务挂了不能影响下单。
- 有时还要求**不能暴露业务量**：别人下两单就能算出你一天卖多少。

## 二、方案对比

| 方案 | 唯一 | 递增 | 性能 | 问题 |
| --- | --- | --- | --- | --- |
| UUID | 是 | 否 | 本地生成，极快 | 128 位太长，无序，做主键写入性能差 |
| 数据库自增 | 是 | 是 | 每个 ID 一次写库 | 单点，性能受限 |
| 多库步长 | 是 | 趋势 | 中 | 库 1 生成 1,3,5，库 2 生成 2,4,6，难以扩容 |
| Redis INCR | 是 | 是 | 高 | 依赖 Redis 持久化，重启可能重复 |
| 号段模式 | 是 | 趋势 | 高 | 依赖数据库，但每次取一批 |
| 雪花算法 | 是 | 趋势 | 本地生成，极快 | 依赖时钟，机器 ID 要分配 |

## 三、雪花算法（Snowflake）

一个 64 位整数，按位拼起来：

![雪花算法位结构](/assets/diagrams/docs/sd-snowflake.svg)

- 41 位毫秒时间戳：可用约 69 年（从自定义纪元开始算）。
- 10 位机器 ID：最多 1024 台。
- 12 位序列号：每毫秒每台机器 4096 个，单机每秒约 400 万。

${F}java
public synchronized long nextId() {
    long now = System.currentTimeMillis();
    if (now < lastTs) {                          // 时钟回拨
        throw new IllegalStateException("clock moved backwards");
    }
    if (now == lastTs) {
        seq = (seq + 1) & 4095;                  // 12 位序列号
        if (seq == 0) now = waitNextMillis(lastTs);  // 本毫秒用完，等下一毫秒
    } else {
        seq = 0;
    }
    lastTs = now;
    return ((now - EPOCH) << 22) | (workerId << 12) | seq;
}
${F}

**时钟回拨**是雪花算法的核心难题（NTP 同步可能让时间倒退）。处理：回拨几毫秒就等待；回拨较多就报错并摘除节点；或者用「上次时间戳」继续递增，不依赖当前时间。**机器 ID** 可以用 ZooKeeper / etcd 的顺序节点在启动时分配，K8s 环境下要注意 Pod 重建后不能和其他实例撞号。

## 四、号段模式（美团 Leaf-segment）

${F}sql
CREATE TABLE id_segment (biz_tag VARCHAR(64) PRIMARY KEY, max_id BIGINT, step INT);
-- 每次取一段：把 max_id 加 1000，本机内存里发放 [旧 max_id+1, 新 max_id]
UPDATE id_segment SET max_id = max_id + step WHERE biz_tag = 'order';
SELECT max_id FROM id_segment WHERE biz_tag = 'order';
${F}

一次写库发 1000 个 ID，数据库压力降低 1000 倍。**双缓冲**：当前号段用到 10% 时就异步取下一段，切换时不卡顿。数据库短暂故障，手里的号段还能撑一段时间。

## 五、订单号的额外要求

订单号常用「时间 + 用户 ID 后几位 + 序列」组成，既方便人工排查，又能用用户 ID 定位分片（基因法）。不想暴露单量，就不要用连续递增的整数。

## ⚠ 常见失分点

- 推荐 UUID 做 MySQL 主键，说不出性能问题。
- 讲雪花算法不提时钟回拨。
- 号段模式不说双缓冲，被追问号段用完时的毛刺。

## ✅ 自检清单

- 能画出雪花算法 64 位的组成并算出单机上限。
- 能给出时钟回拨的两种处理办法。
- 能比较雪花算法和号段模式各自依赖什么。

## 📚 延伸阅读

- 美团技术团队：Leaf——美团点评分布式 ID 生成系统
- 百度 UidGenerator、滴滴 Tinyid 开源实现
`
          },
          {
            id: "sd-leaderboard",
            title: "实战：设计实时排行榜",
            minutes: 12,
            updated: "2026-11-20",
            applies: "Redis 7.x 有序集合",
            tags: ["系统设计", "排行榜", "Redis"],
            terms: ["有序集合", "ZSET", "跳表", "分桶", "同分排序", "Top-K"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 2 卷第 10 章 Real-time Gaming Leaderboard · [Redis Docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/) · [AWS · Leaderboard with ElastiCache](https://aws.amazon.com/blogs/database/building-a-real-time-gaming-leaderboard-with-amazon-elasticache-for-redis/)

## 一、需求

- 游戏每局结束给用户加分，排行榜实时更新。
- 查询：前 10 名；我的分数和名次；我前后各 5 名。
- 规模：日活 500 万，峰值每秒 2500 次加分、几万次查询。
- 按月重置，历史榜单要保留。

## 二、为什么数据库不行

${C}SELECT COUNT(*) FROM scores WHERE score > ?${C} 算名次，每次都要扫大量行，百万用户时一次查询几百毫秒。排行榜要的是「有序 + 快速按分数和名次双向查找」，这正是 Redis 有序集合（ZSET）的强项，底层是**跳表 + 哈希表**，增改和查名次都是 O(log n)。

## 三、核心命令

${F}bash
ZINCRBY lb:2026-11 30 user:1001                  # 加 30 分
ZREVRANGE lb:2026-11 0 9 WITHSCORES              # 前 10 名
ZREVRANK lb:2026-11 user:1001                    # 我的名次（从 0 开始）
ZSCORE   lb:2026-11 user:1001                    # 我的分数
ZREVRANGE lb:2026-11 37 47 WITHSCORES            # 名次 42 前后各 5 名
${F}

![排行榜架构](/assets/diagrams/docs/sd-leaderboard.svg)

## 四、深入问题

**同分怎么排？** 先达到这个分数的排前面。把分数编码成「分数 × 10¹⁰ + (最大时间戳 − 达成时间)」，同分时达成越早的值越大。注意 ZSET 分数是 double，有效精度约 15~16 位十进制，组合时不要超出。

**用户的昵称头像放哪？** ZSET 只存用户 ID 和分数，展示信息放在 hash 或用户服务缓存里，批量取。

**持久化与恢复**：加分事件先写数据库（或 MQ），再更新 Redis。Redis 丢了可以从数据库重建。月底把榜单快照写回数据库，旧 key 设过期。

**一亿用户怎么办？** 单个 ZSET 太大，可以按分数区间分桶：0~1000 分在桶 1，1000~2000 在桶 2……查名次 = 比我高的所有桶的人数之和 + 我在本桶内的名次。只关心前 100 名时更简单：大部分用户只显示「超过了 xx% 的玩家」，用分数分布直方图估算。

## 五、好友榜

好友榜不适合给每个人维护一个 ZSET。好友数一般有上限（几百），查询时取出好友分数，在内存里排序即可。

## ⚠ 常见失分点

- 用数据库 ${C}ORDER BY${C} 实时算名次。
- 不考虑同分排序。
- 把整个用户对象塞进 ZSET 的 member 里，改个昵称就成了新成员。

## ✅ 自检清单

- 能写出加分、查前 N、查我的名次三条命令。
- 能说出 ZSET 底层为什么用跳表。
- 能给出亿级用户排行榜的分桶思路。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 2 卷第 10 章
- Redis 源码：t_zset.c 跳表实现
`
          },
          // </sd-mid>
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "能应对高并发、海量数据和实时性要求高的综合设计题：秒杀、Feed 流、IM、通知推送、搜索联想、文件存储，并能讲清高可用与容灾方案。",
        chapters: [
          // <sd-adv>
          {
            id: "sd-flash-sale",
            title: "实战：设计秒杀系统",
            minutes: 18,
            updated: "2026-11-20",
            applies: "Redis 7.x / 主流消息队列",
            tags: ["系统设计", "秒杀", "高并发"],
            terms: ["秒杀", "超卖", "库存预扣", "Lua 脚本", "削峰填谷", "幂等", "热点数据"],
            body: `
> **官方文档基线**：[Redis Docs · Scripting with Lua](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/) · [阿里云 · 秒杀场景最佳实践](https://help.aliyun.com/) · Alex Xu《System Design Interview》第 2 卷第 13 章 Stock Exchange（撮合与削峰思路）

## 一、需求和难点

- 某商品 1000 件库存，晚上 8 点开抢，预计 100 万人同时点击。
- 不能超卖，不能少卖；每人限购 1 件；下单后 15 分钟未支付释放库存。

难点集中在一个瞬间：**读写都集中在同一行库存上**，数据库一行记录每秒只能扛几百次带锁更新。100 万请求里真正能成交的只有 1000 个，设计的核心思路是**层层过滤，让无效请求尽早失败**。

![秒杀系统漏斗架构](/assets/diagrams/docs/sd-flash-sale.svg)

## 二、分层拦截

| 层 | 做法 | 拦掉多少 |
| --- | --- | --- |
| 前端 | 按钮倒计时置灰、点击后置灰、答题或验证码 | 重复点击、脚本 |
| 网关 | 按用户和 IP 限流、黑名单、令牌校验 | 刷子流量 |
| 秒杀服务 | Redis 原子扣减库存，库存为 0 直接返回「已抢完」 | 绝大部分请求 |
| 消息队列 | 抢到资格的请求进队列，下游按能力消费 | 削峰 |
| 订单服务 | 创建订单、扣数据库库存 | 只剩约 1000 个 |

活动页面本身做成静态页放 CDN，秒杀接口地址在开抢前才下发，防止提前刷接口。

## 三、库存扣减：为什么用 Lua

先 ${C}GET${C} 再 ${C}DECR${C} 是两步操作，并发时会超卖。把「检查限购 + 检查库存 + 扣减 + 记录用户」写成一个 Lua 脚本，Redis 单线程执行脚本，整个过程是原子的：

${F}lua
-- KEYS[1]=库存 key  KEYS[2]=已购用户集合  ARGV[1]=用户ID
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return -1 end  -- 已买过
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
if stock <= 0 then return 0 end                                       -- 抢完
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 1                                                              -- 成功
${F}

返回 1 的请求带上用户 ID、商品 ID、请求号发到消息队列，前端进入「排队中」页面轮询结果。

## 四、数据库这一层怎么保证不超卖

Redis 是第一道闸，数据库仍要兜底：

${F}sql
UPDATE stock SET count = count - 1
WHERE item_id = 42 AND count > 0;   -- 影响行数为 0 说明已卖完
${F}

订单表对 ${C}(user_id, activity_id)${C} 建唯一索引，消息重复消费时插入失败即可，实现**幂等**。

## 五、深入问题

**Redis 扣了，下单失败怎么办？** 订单服务失败时发补偿消息把 Redis 库存加回去；再加一个定时对账任务，比较 Redis 剩余库存、数据库库存和订单数。

**超时未支付？** 下单时投递 15 分钟延迟消息，到期检查订单状态，未支付则关单并回补库存。

**热点 key 扛不住？** 单个 Redis key 每秒能处理约 10 万次简单命令。再高就把库存拆成 N 份放到不同分片（${C}stock:42:0${C} ~ ${C}stock:42:9${C}），请求随机打到一份上，某份扣完再尝试其他份。

**秒杀会不会拖垮主站？** 秒杀服务、Redis、队列独立部署，和普通交易链路隔离，挂了也只影响活动。

## ⚠ 常见失分点

- 让所有请求直接打数据库，或用 ${C}SELECT ... FOR UPDATE${C} 排队。
- Redis 先查后减，没有原子性。
- 只讲 Redis，不讲数据库兜底和对账。
- 忘记限购和幂等，同一用户抢到多件。

## ✅ 自检清单

- 能画出前端、网关、Redis、MQ、订单服务的漏斗图并说出每层作用。
- 能写出原子扣库存的 Lua 逻辑。
- 能解释超时关单和库存回补流程。

## 📚 延伸阅读

- Redis 官方文档：Lua 脚本与原子性
- 各大电商技术博客的「双 11 / 618 大促保障」系列文章
`
          },
          {
            id: "sd-feed",
            title: "实战：设计 Feed 流（朋友圈 / 微博时间线）",
            minutes: 16,
            updated: "2026-11-20",
            applies: "社交、内容类产品通用",
            tags: ["系统设计", "Feed 流", "推拉模型"],
            terms: ["Feed 流", "推模式", "拉模式", "推拉结合", "写扩散", "读扩散", "收件箱", "大V"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 11 章 Design a News Feed System · [system-design-primer · Design the Twitter timeline and search](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md) · [Instagram Engineering 博客](https://instagram-engineering.com/)

## 一、需求

- 用户发帖；用户打开首页看到关注的人发的帖子，按时间倒序。
- 日活 1 亿，人均关注 200 人，每天发帖 1000 万条，刷首页 10 亿次。
- 首页加载 < 200ms；发帖后几秒内粉丝能看到即可，不要求强一致。

读远多于写（约 100:1），这决定了后面的取舍。

## 二、两种基本模型

![Feed 流推拉模型](/assets/diagrams/docs/sd-feed-push-pull.svg)

**拉模式（读扩散）**：每人只有一个「发件箱」。刷首页时取所有关注者的最近帖子，合并排序。写入便宜，读取贵：关注 200 人就要查 200 个发件箱。

**推模式（写扩散）**：每人还有一个「收件箱」。发帖时把帖子 ID 写进每个粉丝的收件箱。读取只查自己的收件箱，非常快；但一个有 1000 万粉丝的大 V 发一条，就要写 1000 万次。

| 对比 | 拉模式 | 推模式 |
| --- | --- | --- |
| 发帖成本 | 1 次写 | 粉丝数次写 |
| 刷首页成本 | 关注数次读 + 合并 | 1 次读 |
| 存储 | 小 | 大（每人一份 ID 列表） |
| 大 V 问题 | 无 | 严重 |
| 不活跃用户 | 无浪费 | 推了也没人看 |

## 三、推拉结合：主流方案

- **普通用户**（粉丝 < 1 万）发帖：推模式，异步写进粉丝收件箱。
- **大 V** 发帖：只写自己的发件箱，不推。
- **刷首页**：读自己的收件箱 + 拉取自己关注的少量大 V 的发件箱，合并后返回。
- 只给最近活跃的粉丝推，长期不登录的用户回来时再走拉模式重建。

## 四、存储设计

${F}text
帖子表 post(post_id, user_id, content, created_at)   -> 分库分表，按 post_id
关注表 follow(user_id, follower_id)                   -> 两个方向各存一份
收件箱 Redis: feed:{uid}  ZSET(score=时间, member=post_id)，只保留最近 800 条
${F}

收件箱只存帖子 ID，不存内容。返回时批量从帖子缓存取内容、点赞数、作者信息，这一步叫**补全（hydration）**。

## 五、发帖流程

1. 写帖子表，写作者的发件箱。
2. 发消息到 MQ，返回成功。
3. 分发服务消费消息：查粉丝列表（分批），判断是否大 V、粉丝是否活跃，批量写收件箱。

## 六、深入问题

**翻页怎么做？** 用游标而不是页码：客户端带上一页最后一条的时间戳和 ID，${C}ZREVRANGEBYSCORE feed:uid (ts -inf LIMIT 0 20${C}。页码翻页在新帖不断插入时会重复或漏条。

**删帖或取关？** 收件箱不用立即清理，补全时过滤掉已删除和已取关的帖子。

**要按推荐排序？** 时间线之外加排序服务：先召回候选，再用模型打分。这已经是推荐系统的范畴，可提一句不展开。

## ⚠ 常见失分点

- 只说一种模型，不讨论大 V。
- 在收件箱里存完整帖子内容，改一次内容要改千万份。
- 用 offset 翻页。

## ✅ 自检清单

- 能对比推、拉两种模型的读写成本。
- 能说出推拉结合如何区分大 V 和活跃用户。
- 能解释游标翻页为什么比页码好。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 11 章
- Twitter 工程博客：时间线架构演进
`
          },
          {
            id: "sd-chat",
            title: "实战：设计 IM 聊天系统（微信 / Slack）",
            minutes: 18,
            updated: "2026-11-20",
            applies: "WebSocket（RFC 6455）/ 移动端长连接",
            tags: ["系统设计", "IM", "WebSocket"],
            terms: ["WebSocket", "长连接", "心跳", "消息序号", "离线消息", "已读回执", "写扩散", "在线状态"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 12 章 Design a Chat System · [RFC 6455 · The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455) · [MDN · WebSocket API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API)

## 一、需求

- 单聊和群聊（群上限 500 人），文字消息为主，图片视频走文件存储。
- 日活 5000 万，同时在线 1000 万，每天 200 亿条消息。
- 消息不丢、不重、同一会话内有序；离线用户上线后能收到；支持多端同步和已读。

## 二、为什么要长连接

HTTP 是客户端问、服务端答。聊天需要服务端随时把消息推给客户端，几种办法：

| 方式 | 原理 | 问题 |
| --- | --- | --- |
| 短轮询 | 每隔几秒问一次 | 大量空请求，延迟高 |
| 长轮询 | 请求挂起直到有消息或超时 | 每条消息后要重新建连 |
| WebSocket | 一次握手升级为全双工长连接 | 需要有状态的连接层 |

主流选择 WebSocket（移动端也常用基于 TCP 的私有协议）。1000 万在线连接，单台网关维持 10~50 万连接，需要几十到上百台。

![IM 聊天系统架构](/assets/diagrams/docs/sd-chat.svg)

## 三、整体架构

- **连接网关**：只管维持长连接、心跳、鉴权，不放业务逻辑。网关有状态，用户连在哪台要记到 Redis：${C}conn:{uid} -> gateway-17${C}。
- **消息服务**：无状态，负责生成序号、存储、路由。
- **消息存储**：写多读少、按会话和时间查询，适合 HBase、Cassandra 这类宽列存储，按 ${C}(会话ID, 序号)${C} 做主键。
- **离线推送**：用户不在线时调用厂商推送（APNs、FCM、国内各手机厂商通道）。

## 四、发一条消息的完整流程

1. A 通过长连接发消息，带客户端生成的 ${C}client_msg_id${C}。
2. 消息服务按会话分配递增序号 ${C}seq${C}，落库，回 ACK 给 A。A 收到 ACK 前显示「发送中」，超时重发。
3. 查 B 的连接位置。在线：转发到 B 所在网关推下去；离线：写离线队列并触发手机推送。
4. B 收到后回 ACK；未 ACK 的消息由服务端重推。

**不丢**靠 ACK + 重发；**不重**靠 ${C}client_msg_id${C} 去重；**有序**靠会话内 seq，客户端按 seq 排序展示，发现空洞就主动拉取缺失区间。

## 五、离线和多端同步

每个用户维护一个「同步位点」：每台设备记录自己收到的最大 seq。上线时带上位点，服务端返回之后的所有消息。这种**拉取补齐**的方式同时解决了离线消息和多端同步，比服务端为每台设备维护离线队列更简单。

## 六、群聊

- **小群（几百人）**：写扩散。一条消息为每个成员写一条收件索引，读取简单，已读未读好统计。
- **大群 / 频道（上万人）**：读扩散。消息只存一份，成员读取时按群 seq 拉取，避免一条消息写一万次。

**已读回执**：单聊记录对方已读到的 seq 即可；群聊每人一个已读位点，「几人已读」异步统计，不阻塞发送。

## 七、在线状态

客户端每 30 秒发心跳，网关刷新 Redis 中 ${C}presence:{uid}${C} 的过期时间，超过 60 秒没心跳视为离线。状态变化只推给正在聊天的好友，不要广播给全部好友，否则一个人上下线会引发大量推送。

## ⚠ 常见失分点

- 用轮询实现实时消息。
- 用服务器时间戳给消息排序，多台机器时钟不一致会乱序。
- 网关里写业务逻辑，扩容和发布时大量断连。
- 大群仍用写扩散。

## ✅ 自检清单

- 能讲清 ACK、去重、seq 分别解决什么问题。
- 能解释同步位点如何处理离线和多端。
- 能说出小群和大群为什么选不同的扩散方式。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 12 章
- 微信后台团队公开分享：消息同步与存储架构
- Discord 工程博客：How Discord Stores Trillions of Messages
`
          },
          {
            id: "sd-notification",
            title: "实战：设计通知推送系统",
            minutes: 14,
            updated: "2026-11-20",
            applies: "APNs / FCM / 短信与邮件网关",
            tags: ["系统设计", "推送", "消息队列"],
            terms: ["APNs", "FCM", "设备令牌", "推送通道", "重试", "去重", "频控", "免打扰"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 10 章 Design a Notification System · [Apple · Sending notification requests to APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns) · [Firebase Cloud Messaging 文档](https://firebase.google.com/docs/cloud-messaging)

## 一、需求

- 支持 App 推送（iOS、Android）、短信、邮件三种渠道。
- 业务方有订单状态、营销活动、安全验证码等多种通知；每天 1000 万条推送、100 万条短信、500 万封邮件。
- 允许秒级延迟；验证码类要快且必达，营销类可以慢但不能骚扰用户。

## 二、各渠道怎么发

| 渠道 | 发给谁 | 需要什么 |
| --- | --- | --- |
| iOS 推送 | Apple 的 APNs 服务 | 设备令牌（device token）+ 证书或密钥 |
| Android 推送 | Google FCM，国内用各厂商通道 | 注册令牌 |
| 短信 | 短信服务商 | 手机号 + 审核过的模板 |
| 邮件 | 邮件服务或自建 SMTP | 邮箱地址 + 发信域名配置（SPF、DKIM） |

App 每次启动把最新令牌上报到服务端，存在 ${C}device(user_id, platform, token, updated_at)${C}，一个用户可有多台设备。

![通知推送系统架构](/assets/diagrams/docs/sd-notification.svg)

## 三、架构

1. **通知服务（API）**：业务方调用 ${C}POST /notify {user_id, template, params, priority}${C}。做鉴权、参数校验、模板渲染。
2. **过滤**：查用户的订阅设置、免打扰时段、频控（例如营销通知每人每天最多 3 条）。
3. **按渠道分队列**：iOS、Android、短信、邮件各一个队列；验证码这类高优先级再单独一个队列，避免被营销大批量任务堵住。
4. **渠道工作进程**：从队列取任务，调用第三方接口，记录结果。
5. **发送日志**：记录每条通知的状态（已入队、已发送、送达、点击），用于排查和统计。

## 四、可靠性

**不丢**：先落库或入持久化队列再返回成功。工作进程调用第三方成功后才确认消息。

**重试**：第三方超时或返回可重试错误时，按指数退避重试（1s、2s、4s……），超过次数进死信队列人工处理。令牌失效这类不可重试错误直接删除该令牌。

**不重**：业务方传入幂等键，或由服务端生成 ${C}notification_id${C}，发送前查一下是否已发。推送渠道本身只保证「至少一次」，系统层面只能尽量去重。

**第三方挂了**：短信可以配置多家服务商，按成功率和成本自动切换。

## 五、营销群发

给 1000 万用户发活动通知，不要一次性塞进队列：

- 先按条件分批圈出用户 ID，每批几千个。
- 控制发送速率，避免第三方限流，也避免用户同时点开把服务打挂。
- 支持按时区在当地合适时间发送。

## ⚠ 常见失分点

- 所有通知共用一个队列，验证码被营销消息堵住。
- 不做频控和免打扰，被用户关掉通知权限。
- 同步调用第三方接口，第三方一慢整个业务接口就慢。

## ✅ 自检清单

- 能说出 iOS、Android 推送分别经过谁。
- 能讲清重试、死信、去重如何配合。
- 能设计营销群发的分批和限速方案。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 10 章
- Apple 开发者文档：APNs 错误码说明
`
          },
          {
            id: "sd-autocomplete",
            title: "实战：设计搜索联想（输入提示 Top-K）",
            minutes: 14,
            updated: "2026-11-20",
            applies: "搜索框输入提示通用",
            tags: ["系统设计", "搜索", "Trie"],
            terms: ["搜索联想", "Trie", "前缀树", "Top-K", "离线构建", "防抖", "热词"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 13 章 Design a Search Autocomplete System · [Elasticsearch · Completion suggester](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html) · [system-design-primer](https://github.com/donnemartin/system-design-primer)

## 一、需求

- 用户每输入一个字，返回 5 条以当前输入为前缀、最热门的搜索词。
- 日活 1000 万，人均每天搜索 10 次、每次输入约 20 个字符，峰值约 5 万 QPS。
- 响应 < 100ms；热度可以按天更新，不要求实时。

## 二、数据结构：前缀树

前缀树（Trie）的每个节点代表一个前缀，从根走到某个节点就得到对应的字符串。查以「tr」开头的词，从根走 t、r 两步，再遍历子树即可。

![带 Top-K 缓存的前缀树](/assets/diagrams/docs/sd-trie.svg)

直接遍历子树太慢（「a」下面可能有几百万个词）。优化办法是**在每个节点上缓存该前缀的 Top-5 结果**：

- 查询：走到前缀节点，直接返回缓存，时间只和前缀长度有关。
- 代价：存储变大，更新时要沿路径修改祖先节点的缓存。
- 限制前缀最大长度（例如 50 个字符），超过的不提示。

## 三、整体架构：读写分离

${F}text
查询链路：浏览器 -> CDN/浏览器缓存 -> 联想服务 -> 内存中的 Trie（或 Redis）
构建链路：搜索日志 -> 按天聚合词频 -> 构建新 Trie -> 发布到所有联想服务
${F}

搜索日志每天写入数据仓库，离线任务统计「搜索词 → 次数」（可按时间衰减，近期权重更高），然后整棵树重建。新树构建好后替换旧树，查询链路完全不受写入影响。

树太大放不下一台机器时，按首字母或前缀哈希分片，例如 a~m 一组、n~z 一组。中文场景可以按拼音首字母或首字分片，注意热门前缀可能不均匀，要按数据量切分。

## 四、前端优化

- **防抖**：用户停止输入 100~200ms 后再发请求，打字快时能省掉大部分请求。
- **浏览器缓存**：响应带 ${C}Cache-Control: max-age=3600${C}，同一前缀一小时内不重复请求。
- 取消过期请求，避免旧结果覆盖新结果。

## 五、深入问题

**要实时热词（突发新闻）？** 在离线全量树之外加一个实时层：流处理统计最近 10 分钟的热词，查询时合并两份结果。

**过滤违规词？** 构建树时过滤，查询结果再过一遍黑名单，黑名单更新可以立即生效。

**拼音、错别字？** 把拼音全拼、首字母也作为前缀插入树中，指向同一个词；纠错一般放在搜索结果页而不是联想。

**直接用现成的？** Elasticsearch 的 completion suggester 就是基于类似结构的前缀查询，中小规模直接用即可。

## ⚠ 常见失分点

- 用数据库 ${C}LIKE 'xx%'${C} 加 ${C}ORDER BY${C} 实时查。
- 每次查询遍历整棵子树。
- 查询和更新共用一棵树还要加锁。

## ✅ 自检清单

- 能画出带 Top-K 缓存的前缀树并说清查询复杂度。
- 能讲清离线构建、发布替换的流程。
- 能说出前端防抖和缓存各省掉多少请求的思路。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 13 章
- Elasticsearch 官方文档：Suggesters
`
          },
          {
            id: "sd-file-storage",
            title: "实战：设计文件存储 / 网盘（Google Drive、百度网盘）",
            minutes: 16,
            updated: "2026-11-20",
            applies: "S3 兼容对象存储",
            tags: ["系统设计", "对象存储", "网盘"],
            terms: ["对象存储", "分块上传", "断点续传", "秒传", "去重", "元数据", "预签名 URL", "同步冲突"],
            body: `
> **官方文档基线**：Alex Xu《System Design Interview》第 1 卷第 15 章 Design Google Drive · [AWS S3 · Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) · [AWS S3 · Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)

## 一、需求

- 上传、下载、分享文件；多设备同步；单文件最大 10GB；保留历史版本。
- 注册用户 5000 万，日活 1000 万，人均存 10GB，总量约 500PB。
- 文件绝对不能丢（可靠性 11 个 9），上传中断后能续传。

## 二、文件内容和元数据分开存

| 部分 | 内容 | 存哪里 |
| --- | --- | --- |
| 文件内容 | 二进制数据块 | 对象存储（S3、OSS、COS、BOS 等） |
| 元数据 | 文件名、目录、大小、版本、块列表、权限 | 关系型数据库，按用户分库 |

自建 PB 级存储成本很高，对象存储已经提供多副本或纠删码、跨可用区冗余，是首选。

![分块上传与秒传流程](/assets/diagrams/docs/sd-file-upload.svg)

## 三、分块上传

大文件切成固定大小的块（例如 4MB 或 8MB），每块单独计算哈希、单独上传：

1. 客户端切块，计算每块的 SHA-256 和整个文件的哈希。
2. 调用 ${C}POST /upload/init${C}，上报文件哈希和块哈希列表。
3. 服务端返回哪些块已经存在、哪些需要上传，以及每块的**预签名 URL**。
4. 客户端直接把块传到对象存储，不经过应用服务器，省带宽。
5. 全部完成后调用 ${C}POST /upload/complete${C}，服务端校验后写入元数据，生成新版本。

**断点续传**：中断后重新 init，服务端只返回缺失的块。**并行上传**：多个块同时传，速度更快。

## 四、秒传和去重

如果整个文件的哈希已存在（别人传过同一部电影），直接在元数据里引用已有的块，不用上传，这就是**秒传**。块级去重还能让修改了一小部分的文件只上传变化的块。

去重后一个块可能被多个文件引用，删除时要用**引用计数**，计数为 0 才真正删除。为防止通过哈希探测别人的文件，服务端可以随机要求客户端提供文件某段内容做校验。

## 五、同步与冲突

- 客户端监听本地文件变化，上传变化的块；其他设备通过长轮询或推送得知「有新版本」，再下载变化的块。
- 两台设备同时修改同一文件：先提交的成为新版本，后提交的发现基础版本已变，保存为「文件名（冲突副本）」，交给用户选择。这比自动合并更安全。

## 六、下载与分享

下载同样返回对象存储的预签名 URL，热门文件走 CDN。分享链接生成随机令牌，记录权限和有效期；访问时校验令牌再签发下载地址。

## 七、成本优化

冷数据（90 天未访问）自动转低频或归档存储；历史版本只保留最近 N 个或 30 天内的；块压缩后再存。

## ⚠ 常见失分点

- 文件内容存数据库，或所有上传都经过应用服务器中转。
- 不分块，10GB 文件中断后从头再来。
- 去重了却不做引用计数，删一个文件把别人的也删了。

## ✅ 自检清单

- 能画出分块上传加预签名 URL 的流程。
- 能解释秒传原理和它的安全风险。
- 能说出多端冲突时的处理策略。

## 📚 延伸阅读

- Alex Xu《System Design Interview》第 1 卷第 15 章
- Dropbox 工程博客：Magic Pocket 存储系统
`
          },
          {
            id: "sd-high-availability",
            title: "高可用与容灾：冗余、熔断降级、多活与 SLO",
            minutes: 18,
            updated: "2026-11-20",
            applies: "云上与自建机房通用",
            tags: ["系统设计", "高可用", "容灾"],
            terms: ["可用性", "SLA", "SLO", "冗余", "熔断", "降级", "多活", "RTO", "RPO", "故障演练"],
            body: `
> **官方文档基线**：[AWS Well-Architected · Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html) · [Google SRE Book · Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) · [Resilience4j · CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker)

## 一、可用性怎么量化

| 可用性 | 每年最多停机 | 每月最多停机 |
| --- | --- | --- |
| 99%（2 个 9） | 3.65 天 | 7.2 小时 |
| 99.9%（3 个 9） | 8.76 小时 | 43 分钟 |
| 99.99%（4 个 9） | 52.6 分钟 | 4.3 分钟 |
| 99.999%（5 个 9） | 5.26 分钟 | 26 秒 |

- **SLI**：实际测量的指标，如「成功请求占比」「P99 延迟」。
- **SLO**：内部目标，如「30 天成功率 ≥ 99.95%」。
- **SLA**：对客户的承诺，达不到要赔偿，通常比 SLO 宽松。
- **错误预算**：1 − SLO。预算用完就暂停发布新功能，先修稳定性。

串联依赖会降低可用性：三个 99.9% 的服务串联，整体约 99.7%。所以要减少强依赖，或给依赖加冗余。

![高可用分层设计](/assets/diagrams/docs/sd-ha.svg)

## 二、冗余：消除单点

逐层检查每个组件挂一台会怎样：

- 接入层：DNS 多条记录、负载均衡主备。
- 应用层：无状态服务至少 3 个实例，分布在不同可用区。
- 数据层：数据库主从加自动切换，Redis 哨兵或集群，消息队列多副本。
- 依赖的第三方：关键服务（短信、支付）接两家以上。

## 三、熔断、限流、降级、超时

一个下游变慢，调用方线程全卡住，再拖垮上游，这叫**雪崩**。四个手段配合使用：

1. **超时**：所有远程调用都设超时，超时时间小于上游的超时时间。
2. **限流**：入口处保护自己，超出容量的请求快速失败（见《限流器》一章）。
3. **熔断**：下游错误率超过阈值（如 50%）就「断开」，一段时间内直接返回失败或默认值；之后放少量请求「半开」试探，恢复了再闭合。
4. **降级**：大促时关闭推荐、评论等非核心功能，把资源留给下单和支付。降级开关要提前准备好、演练过。

另外，**重试**要配合退避和次数上限，否则会放大故障。

## 四、容灾：机房挂了怎么办

两个指标：**RTO**（多久恢复服务）和 **RPO**（最多丢多少数据）。

| 方案 | 做法 | RTO / RPO | 成本 |
| --- | --- | --- | --- |
| 冷备 | 定期备份到异地 | 小时到天 / 小时 | 低 |
| 同城双活 | 两个可用区同时服务，数据同步复制 | 分钟 / 接近 0 | 中 |
| 两地三中心 | 同城双活加异地灾备 | 分钟到小时 / 秒级 | 高 |
| 异地多活 | 多个城市都承接写流量，按用户分区（单元化） | 秒到分钟 / 秒级 | 很高 |

异地多活的难点是数据：跨城网络延迟几十毫秒，不能每次写都同步。常见做法是**按用户 ID 划分单元**，一个用户的读写都在自己所在单元完成，单元间异步复制；只有库存这类全局数据走中心单元。

## 五、发布和演练

- 线上故障大多来自变更。发布要灰度（1% → 10% → 100%）、可快速回滚。
- 定期做故障演练：随机杀实例、断网、切主库，验证告警和切换真的有效。
- 每次故障写复盘，关注「为什么没提前发现」，不追究个人。

## ⚠ 常见失分点

- 只说「加机器」，不讲单点在哪、切换要多久。
- 远程调用不设超时，重试不加退避。
- 把异地多活说得很轻松，不讲数据一致性的代价。

## ✅ 自检清单

- 能算出 99.99% 每月允许停机多久，解释 SLO 和 SLA 的区别。
- 能说出熔断器三个状态的切换条件。
- 能对比冷备、同城双活、异地多活的 RTO、RPO 和成本。

## 📚 延伸阅读

- Google《SRE: Google 运维解密》第 3、4、22 章
- AWS Well-Architected 可靠性支柱白皮书
`
          },
          // </sd-adv>
        ]
      }
    ]
  };

  window.SYSDESIGN = SYSDESIGN;
})();
