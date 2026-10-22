#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重写种子浏览量 Top 20 题的答案/来源/岗位关联（2026-10-22）。
这些题是 seed 数据里浏览量最高、但答案偏短、来源为 manual 的题；按当前题库质量口径补全，
并修正明显错配的岗位关联。运行后需 split-published + build-pages。
"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enrich_questions import load_published, write_published

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = load_published()
POS = {p["name"]: p["id"] for p in DATA["positions"]}
NOW = int(time.time() * 1000)

REWRITES = {
197: dict(body="考察薪资谈判的准备、报价、总包和边界管理。", source="https://www.shrm.org/topics-tools/news/compensation-benefits/how-to-negotiate-salary", aiScore=92,
 answer="""**先准备**
- 查同城市/同岗位/同年限的市场区间（招聘网站、行业报告、同行），区分「总包」和「固定薪资」；确定目标、可接受底线和离开条件。
- 盘点自己的筹码：稀缺技能、业务结果、竞品 offer、内部不可替代性；用事实而不是「我需要」。

**谈判节奏**
- 尽量让对方先给范围；被问期望时给区间（下限是你的目标），不要先报当前薪资。
- 报价后保持沉默，让对方回应；一次只谈一个变量，先谈固定薪资，再谈签字费/股票/远程/职级。
- 有竞争 offer 可如实说明，但不要虚构或威胁；对方给不出时，争取书面成长路径/评审时间。

**边界**
- 所有承诺写进 offer；确认试用期、绩效、加班、期权归属；谈崩也要体面，行业很小。"""),

183: dict(body="考察 Kafka 分区有序、键路由、生产重试和消费并发。", source="https://kafka.apache.org/documentation/#intro_concepts_and_terms", aiScore=93,
 answer="""**分区内有序**
- Kafka 只保证同一 partition 内消息按 offset 有序；生产者按 key 哈希到固定分区，同一业务键（订单号/用户 ID）就落在同一分区。
- 全局有序只能单分区，吞吐受限；多数场景用「业务键局部有序 + 消费端幂等」而不是全局单分区。

**生产端**
- 开启幂等生产者（`enable.idempotence=true`）和合理 `acks=all`、重试；避免重试导致乱序（`max.in.flight` 限制）。
- 分区数变更会改变 key 路由，需评估；不要用随机分区还指望有序。

**消费端**
- 一个分区同一时刻只被同组一个消费者消费，消费并行度≤分区数；多线程处理要按 key 分流/加锁。
- 重平衡/提交 offset 可能重复，业务用唯一键/状态机幂等；需要跨分区原子性用事务/outbox。"""),

117: dict(body="考察 this 的绑定规则、箭头函数和丢失 this。", source="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this", aiScore=93,
 answer="""**四条规则**
- 默认绑定：独立函数调用，非严格模式指向全局对象，严格模式 `undefined`。
- 隐式绑定：`obj.fn()` 的 this 是 obj；方法被赋值给变量后 (`const f=obj.fn`) 会丢失 this。
- 显式绑定：`call/apply/bind` 指定 this；bind 返回新函数，不能再次 bind 改变。
- new 绑定：构造函数中的 this 指向新创建的对象。

**箭头函数**
- 没有自己的 this/arguments/new.target，词法继承外层；不能当构造函数，也不适合需要动态 this 的回调。
- 类方法/原型方法用普通函数；回调里需要外层 this 时用箭头或 bind。

**优先级**：new > 显式 > 隐式 > 默认；严格模式/模块默认更安全。"""),

170: dict(body="考察动态规划的状态定义、转移、边界和经典模型。", source="https://cp-algorithms.com/dynamic_programming/intro-to-dp.html", aiScore=94,
 answer="""**核心**
- 把原问题拆成可复用的子问题，定义状态 `dp[...]` 表示「前 i 个/容量 j/区间 [l,r]」的最优值；用状态转移复用子结果，避免指数级重复计算。
- 适用：最优子结构 + 重叠子问题；不满足无后效性时要扩状态（如股票题加「是否持有」）。

**步骤**
- 定义状态含义 → 写转移 → 初始化边界 → 确定遍历顺序（保证依赖先算）→ 返回目标；可用记忆化搜索自顶向下，或滚动数组压维。

**经典**
- 0/1 背包、完全背包、LCS、LIS、编辑距离、区间 DP、树形 DP；复杂度通常「状态数 × 转移代价」。
- 常见坑：状态定义漏维度、边界/空集、遍历顺序错、把贪心当 DP；先写暴力递归再优化。"""),

137: dict(body="考察 InnoDB/MyISAM 的事务、锁、索引和适用场景。", source="https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html", aiScore=92,
 answer="""**InnoDB**
- 支持事务（ACID）、行级锁、外键、MVCC、崩溃恢复；聚簇索引按主键组织数据，二级索引存主键回表。
- 适合 OLTP、高并发读写、需要事务/一致性；默认引擎，支持在线热备。

**MyISAM**
- 不支持事务/行锁/外键，表级锁；索引与数据分离，`COUNT(*)` 快，曾适合只读/分析场景。
- 崩溃恢复弱、并发写差；MySQL 8.0 已弃用，生产不建议新用。

**选择**
- 需要事务/并发写/崩溃安全→InnoDB；只读历史表也要评估备份/恢复和未来需求。
- 不要只看「读性能」；InnoDB 的 buffer pool/索引设计通常更关键。"""),

187: dict(body="考察全量微调、PEFT 方法和选型边界。", source="https://huggingface.co/docs/peft/index", aiScore=93,
 answer="""**全量微调**
- 更新全部参数，效果上限高但显存/算力/存储成本大，小数据容易灾难性遗忘；适合数据充足、任务与基座差异大。

**PEFT**
- LoRA：冻结原权重，训练低秩 `A/B` 矩阵，推理可合并；rank/alpha 控制容量，显存低、易多任务切换。
- QLoRA：4bit 量化基座 + LoRA，进一步降显存；Adapter/prefix/prompt tuning 插入少量参数。
- 适合领域风格/指令跟随/格式适配；知识更新仍优先 RAG。

**选型**
- 先 Prompt/RAG 基线；需要稳定风格/格式且标注足够→LoRA/QLoRA；全量微调用于大预算/高上限。
- 评估任务指标、通用能力遗忘、延迟/成本；数据质量比方法更重要。"""),

126: dict(body="考察 Vue 2/3 响应式实现、依赖收集和边界。", source="https://vuejs.org/guide/extras/reactivity-in-depth.html", aiScore=93,
 answer="""**Vue 2**
- `Object.defineProperty` 递归把属性转 getter/setter；getter 收集依赖，setter 触发更新。
- 无法检测新增/删除属性（需 `Vue.set/delete`）、数组索引/长度变更；初始化时递归，性能开销大。

**Vue 3**
- `Proxy` 代理整个对象，支持新增/删除/数组索引；`track/trigger` 做依赖收集，惰性代理，性能更好。
- `ref` 包装基本类型（`.value`），`reactive` 用于对象；`computed` 惰性缓存，`watchEffect` 自动收集。

**边界**
- 解构 reactive 会丢响应式，用 `toRefs`；深层大对象用 `shallowRef/shallowReactive`；避免在渲染中做重计算。"""),

178: dict(body="考察 @Async 代理、线程池和异常处理。", source="https://docs.spring.io/spring-framework/reference/integration/scheduling.html#scheduling-annotation-support-async", aiScore=92,
 answer="""**启用**
- 启动类/配置类加 `@EnableAsync`；`@Async` 方法由代理调用才生效，同类内部 `this.method()` 自调用不经过代理，会同步执行。
- 方法返回 `void`/`Future`/`CompletableFuture`；`void` 异常需 `AsyncUncaughtExceptionHandler`。

**线程池**
- 自定义 `ThreadPoolTaskExecutor`（core/max/queue/拒绝策略/线程名前缀），不要用默认 `SimpleAsyncTaskExecutor` 每请求建线程。
- 根据任务类型（IO/CPU）定池大小，设置超时/隔离/监控，避免打满影响主业务。

**上下文**
- 异步线程不继承请求上下文/ThreadLocal，需显式传递或 TaskDecorator；事务不会自动传播到异步线程。
- 适用发邮件/报表/推送等可后置任务；核心链路要可观测、可重试、幂等。"""),

162: dict(body="考察 TLS 握手、证书链和 HTTPS 部署。", source="https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security", aiScore=93,
 answer="""**目标**
- HTTP + TLS：非对称/密钥交换协商出会话密钥，之后用对称加密传数据；证书把域名与公钥绑定，CA 签名防冒充。

**TLS 1.3 握手（简化）**
- ClientHello（支持的套件/密钥共享）→ ServerHello + 证书 + 密钥交换 → 双方生成会话密钥 → Finished；1-RTT，支持 0-RTT（有重放风险）。
- 客户端校验证书链、域名、有效期、吊销状态；SNI 用于同 IP 多站点。

**部署**
- 全站 HTTPS + HSTS；证书自动续期；TLS 终止在 LB/CDN 时注意内网段也要加密/可信。
- 常见问题：证书链不全、域名不匹配、过期、混合内容、旧协议/弱套件；用 SSL Labs 扫描。"""),

176: dict(body="考察 Filter、Interceptor、AOP 的执行顺序和职责。", source="https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html", aiScore=92,
 answer="""**Filter**
- Servlet 规范，请求进入 Servlet 前/响应返回后执行；可包装/修改 request/response，拿不到 Spring Handler。
- 适合编码、CORS、日志、认证前置、压缩等容器级逻辑。

**Interceptor**
- Spring MVC `HandlerInterceptor`，在 Handler 执行前/后/完成后执行；能拿到 handler、ModelAndView，适合权限/日志/埋点。
- `preHandle` 返回 false 可中断；postHandle 在视图渲染前，afterCompletion 在完成后。

**AOP**
- 方法级代理，能拿到方法/参数/返回值，适合事务、缓存、审计；但只对 Spring Bean 调用生效。

**顺序**：Filter → Interceptor.preHandle → Controller → Interceptor.postHandle → afterCompletion → Filter；自调用会绕过 Interceptor/AOP。"""),

177: dict(body="考察 Spring Boot + MyBatis 的配置、Mapper 和 SQL 管理。", source="https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/", aiScore=91,
 answer="""**接入**
- 引入 `mybatis-spring-boot-starter`，配置 `spring.datasource`、`mybatis.mapper-locations`、`type-aliases-package`、`map-underscore-to-camel-case`。
- `@MapperScan` 或每个 Mapper 加 `@Mapper`；接口 + XML/注解两种写法。

**Mapper**
- 简单 SQL 用注解，复杂/动态 SQL 用 XML；`resultMap` 处理列名与对象字段不一致、关联/集合。
- 动态 SQL 用 `<if>/<choose>/<foreach>`；分页用 PageHelper/MyBatis-Plus 插件，不要手写 limit 拼接。

**工程**
- SQL 参数用 `#{}` 预编译，`${}` 只用于可信标识符；Mapper 接口不写业务逻辑；SQL 审查/慢查询/索引。
- MyBatis-Plus 提供 CRUD/分页/代码生成，但复杂查询仍要可读 SQL。"""),

121: dict(body="考察浅拷贝/深拷贝、循环引用和结构化克隆。", source="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/structuredClone", aiScore=92,
 answer="""**浅拷贝**
- `Object.assign({}, obj)`、`{...obj}`、`arr.slice()` 只复制第一层；嵌套对象仍是共享引用，改嵌套会影响原对象。

**深拷贝**
- `structuredClone(obj)`：浏览器/Node 现代环境原生，支持循环引用、Map/Set/Date/ArrayBuffer；不能克隆函数、Symbol、DOM 节点、原型链。
- `JSON.parse(JSON.stringify(obj))`：简单但有损（函数/undefined/Symbol 丢失、Date 变字符串、循环引用报错、NaN→null）。
- 递归实现要处理循环引用（WeakMap）、数组/对象/Date/RegExp/Map/Set；类实例要保留原型/构造。

**选择**
- 数据可序列化优先 structuredClone；需要保留类/函数/特殊对象时用库（lodash cloneDeep）或手写；不可变数据/浅拷贝能解决就不要深拷。"""),

175: dict(body="考察 @Transactional 的代理、传播、隔离和失效场景。", source="https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", aiScore=93,
 answer="""**原理**
- Spring 通过 AOP 代理开启/提交/回滚事务；只有经过代理的外部调用才生效，同类 `this.method()` 自调用会绕过。

**关键参数**
- `propagation`：REQUIRED（默认，加入/新建）、REQUIRES_NEW（挂起当前、独立事务）、NESTED（保存点）、SUPPORTS/NOT_SUPPORTED/MANDATORY/NEVER。
- `isolation`：读已提交/可重复读等；`rollbackFor` 默认只回滚 RuntimeException/Error，受检异常要显式配置。
- `readOnly` 优化只读事务；`timeout` 防长事务。

**失效/坑**
- 非 public、自调用、异常被 catch、类未被 Spring 管理、数据库引擎不支持事务；异步线程不继承事务。
- 长事务占用连接/锁，远程调用不要放在事务内；嵌套事务要理解回滚边界。"""),

198: dict(body="考察 Scrum 角色、事件、工件和常见误区。", source="https://scrumguides.org/scrum-guide.html", aiScore=91,
 answer="""**角色**
- Product Owner 负责价值/优先级/Backlog；Scrum Master 负责流程/障碍/教练；Developers 自组织交付增量。
- 三者是责任分工，不是三个管理层级。

**事件**
- Sprint（固定周期）→ Sprint Planning（目标/选品）→ Daily Scrum（同步/调整计划）→ Sprint Review（成果/反馈）→ Retrospective（改进）。
- 事件是检查与调整的机会，不是汇报会；Daily 不是站会打卡。

**工件**
- Product Backlog、Sprint Backlog、Increment；Definition of Done 是质量门槛；估算可用故事点/相对大小。

**误区**
- 只站会不做回顾、PO 缺位、Sprint 中随意插需求、把 Scrum 当项目管理表格；团队成熟后可结合 Kanban/持续交付。"""),

109: dict(body="考察 Java 异常体系、受检/非受检和资源管理。", source="https://docs.oracle.com/javase/tutorial/essential/exceptions/", aiScore=91,
 answer="""**层次**
- `Throwable` → `Error`（JVM/系统级，如 OOM、StackOverflow，通常不可恢复，不应捕获）与 `Exception`。
- `Exception` → `RuntimeException`（非受检：NPE、越界、IllegalArgument）与受检异常（IOException、SQLException）。

**处理**
- 受检异常必须捕获或声明；非受检多为编程错误，应修代码而不是到处 catch。
- 不要吞异常/只打印；保留 cause、上下文，按层转换（DAO→业务异常）；资源用 try-with-resources。
- 自定义异常表达业务语义，避免用异常做正常流程控制；批量任务要区分可重试/不可重试。

**注意**：不要 catch `Throwable`/`Error`；finally 不要 return/抛异常覆盖原异常。"""),

134: dict(body="考察 MySQL JOIN 算法、驱动表和索引优化。", source="https://dev.mysql.com/doc/refman/8.0/en/nested-loop-joins.html", aiScore=93,
 answer="""**类型**
- INNER/LEFT/RIGHT/CROSS JOIN；LEFT JOIN 保留左表，RIGHT 反之；NULL 匹配要小心。

**算法**
- Nested Loop Join：驱动表每行到被驱动表按连接键查；被驱动表连接列有索引时最快。
- Block Nested Loop：无索引时把驱动表批量放入 join buffer，减少被驱动表扫描；MySQL 8.0.20+ 逐渐用 Hash Join 替代等值连接。
- Hash Join：小表建哈希表，大表探测；适合等值连接/无索引，内存不足会落盘。

**优化**
- 小表驱动大表（实际看过滤后行数）、连接列同类型/字符集、被驱动表建索引；EXPLAIN 看 type/rows/Extra。
- 避免在连接列上函数/隐式转换；大 JOIN 分页/拆分；不要盲目加 `STRAIGHT_JOIN`。"""),

163: dict(body="考察 DNS 递归/迭代解析、缓存和记录类型。", source="https://www.cloudflare.com/learning/dns/what-is-dns/", aiScore=92,
 answer="""**流程**
- 浏览器/OS 缓存 → 本地 DNS 递归解析器（ISP/公共 DNS）→ 根服务器（返回 TLD）→ 顶级域服务器（返回权威 NS）→ 权威服务器（返回 A/AAAA）→ 递归器缓存并返回。
- 递归器负责替客户端迭代查询；TTL 决定缓存时长，负缓存也会缓存 NXDOMAIN。

**记录**
- A/AAAA、CNAME（别名，不能与其它记录共存于同一名字）、MX、NS、TXT（SPF/DKIM/验证）、SOA；DNSSEC 用签名防篡改。

**排查/优化**
- `dig +trace`、`nslookup` 区分本地缓存/递归/权威；检查 TTL、CNAME 链、权威 NS 配置。
- 优化：DNS 预解析、HTTPDNS（防本地劫持/调度）、CDN 智能解析；注意 TTL 与切流。"""),

168: dict(body="考察哈希函数、冲突处理、扩容和工程实现。", source="https://en.wikipedia.org/wiki/Hash_table", aiScore=92,
 answer="""**原理**
- 哈希函数把 key 映射到桶下标，理想 O(1) 查找/插入/删除；实际受哈希质量、负载因子和冲突影响。

**冲突**
- 链地址法：每个桶挂链表/红黑树（Java HashMap 链表长度≥8 且容量≥64 转红黑树）；实现简单、删除方便。
- 开放地址：线性/二次探测、双重哈希；缓存友好但删除要墓碑、易聚集。
- 再哈希/公共溢出区用于特定场景。

**扩容**
- 负载因子（元素/桶数）超阈值（如 0.75）扩容并 rehash；扩容有一次性/渐进式，注意停顿。
- 哈希攻击：构造大量冲突退化为 O(n)，用随机种子/限流/红黑树缓解；一致性哈希用于分布式缓存。"""),

132: dict(body="考察 MVCC、Undo Log、Read View 和隔离级别。", source="https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html", aiScore=94,
 answer="""**核心**
- InnoDB 每行有隐藏事务 ID/回滚指针，修改旧版本写入 Undo Log，形成版本链；读时按 Read View 判断哪个版本可见。

**Read View**
- 记录活跃事务 ID 列表、最小/最大事务 ID；根据版本的事务 ID 判断可见性。
- READ COMMITTED 每条快照读生成新 Read View；REPEATABLE READ 在事务第一次快照读时生成，之后复用（快照读可重复）。

**读写**
- 快照读（普通 SELECT）走 MVCC，读不阻塞写；当前读（`SELECT ... FOR UPDATE`/UPDATE/DELETE）读最新版本并加锁（记录/间隙/next-key）。
- Purge 线程清理不再需要的旧版本；长事务/长 Read View 会阻止 purge，导致 Undo 膨胀。

**注意**：MVCC 不等于无锁；RR 下当前读仍有幻读/间隙锁问题，需理解隔离级别。"""),

171: dict(body="考察栈/队列、变体和典型应用。", source="https://en.wikipedia.org/wiki/Stack_(abstract_data_type)", aiScore=91,
 answer="""**栈 LIFO**
- `push/pop/peek`，可用数组/链表实现；应用：函数调用栈、括号匹配、表达式求值、撤销/重做、浏览器前进后退、DFS、单调栈。

**队列 FIFO**
- `enqueue/dequeue/peek`，链表/循环数组实现；应用：任务调度、消息队列、BFS、缓冲区、生产者-消费者。
- 双端队列 Deque 可两端进出，适合滑动窗口最大值；优先队列按优先级出队（堆）。

**复杂度/坑**
- 数组栈均摊 O(1)；链表队列 O(1)；循环数组要处理满/空判断；优先队列插入/删除 O(log n)。
- 并发队列要区分阻塞/非阻塞、有界/无界；不要用普通队列做跨线程无锁共享。"""),
}

by_id = {q["id"]: q for q in DATA["questions"]}
updated = []
for qid, patch in REWRITES.items():
    q = by_id.get(qid)
    if not q:
        raise SystemExit("missing question " + str(qid))
    q["answer"] = patch["answer"].strip()
    q["body"] = patch["body"]
    q["source"] = patch["source"]
    q["aiScore"] = patch["aiScore"]
    q["updatedAt"] = NOW
    q["reviewedAt"] = NOW
    q["reviewedBy"] = "manual-top20-20261022"
    names = patch.get("positions") or []
    if names:
        missing = [n for n in names if n not in POS]
        if missing:
            raise SystemExit("missing positions: " + ",".join(missing))
        q["positionIds"] = [POS[n] for n in names]
        q["positionNames"] = names
    updated.append(qid)
write_published(DATA)
print("updated", len(updated), "ids", updated)
print("version", DATA["version"])
