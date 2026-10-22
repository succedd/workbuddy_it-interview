#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第二批质量修复：重写剩余高浏览短答案/无来源题 Top 30（2026-10-22）。"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enrich_questions import load_published, write_published
DATA=load_published(); NOW=int(time.time()*1000)
R={
184:("https://arxiv.org/abs/1706.03762",92,"""**核心**
- Transformer 用自注意力替代 RNN 的循环结构，让序列中任意两个位置直接交互，路径长度 O(1)，可并行训练。
- 多头注意力在不同子空间学习关系；位置编码补充顺序信息；残差+LayerNorm 稳定深层训练。

**结构**
- Encoder：多头自注意力 + FFN；Decoder：掩码自注意力 + 编码器-解码器交叉注意力 + FFN。
- 训练用 teacher forcing/并行化；推理自回归逐 token 生成，可用 KV Cache 加速。

**意义/边界**
- 长序列注意力 O(n²) 成本；后续有稀疏/线性注意力、FlashAttention 等优化；理解时必须区分「自注意力」与「Transformer 整体」。"""),
196:("https://www.nngroup.com/articles/presentation-skills/",91,"""**先定目标**
- 技术分享不是「把知识倒出来」，而是让听众带走 1–3 个可行动结论；先问听众是谁、已有认知、听完要做什么。
- 结构：问题/背景 → 核心观点 → 证据/案例 → 取舍/坑 → 结论与 Q&A；开头 30 秒给结论。

**表达**
- 一页一个观点，图>表>文字；代码只放关键片段并高亮；用真实故障/数据讲故事，避免堆 API。
- 控制节奏：每 10 分钟一个互动/问题；提前演练，准备 backup slides 应对追问。

**复盘**
- 收集反馈（哪页难懂/哪点有用），录屏回看；把 Q&A 沉淀成文档；分享材料版本化，方便后来人。"""),
147:("https://man7.org/linux/man-pages/man1/ps.1.html",91,"""**查看**
- `ps aux` / `ps -ef` 看进程与父进程；`pgrep -af name` 按名找；`pstree -p` 看进程树。
- `top`/`htop` 看 CPU/内存实时；`pidstat -p PID 1` 看单进程；`/proc/PID/{status,cmdline,fd}` 看详情。

**管理**
- `kill -15` 优雅终止，`-9` 强杀（最后手段）；`nice/renice` 调优先级；`nohup ... &`/`setsid` 后台运行。
- `systemctl status/start/stop/restart` 管理服务；`journalctl -u` 看日志。

**排查**
- 僵尸进程看父进程回收；D 状态看 I/O；OOM 看 dmesg；不要盲目 kill -9 数据库/中间件。"""),
182:("https://kafka.apache.org/documentation/#replication",92,"""**ISR**
- In-Sync Replicas：与 leader 保持同步的副本集合（含 leader）；落后太多的 follower 被移出 ISR。
- `acks=all` 时，leader 等 ISR 中所有副本写入才确认；`min.insync.replicas` 保证最少副本数，否则写入失败。

**HW/LEO**
- LEO 是日志末端偏移；HW 是已提交/对消费者可见的位置；follower 追上 leader 后更新 ISR。
- leader 故障时从 ISR 选新 leader，避免选到落后副本丢数据；unclean leader election 可能丢数据，生产慎用。

**运维**
- 副本数≥3、`min.insync.replicas=2`、机架感知；监控 ISR 收缩/under-replicated；避免频繁 rebalance。"""),
129:("https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key",92,"""**作用**
- key 帮助 React 识别列表项的身份，在 diff 时复用/移动/删除对应节点；没有 key 或 key 不稳定会导致错位复用。
- key 只需在同级列表唯一，不必全局唯一；不要用数组下标做 key（插入/排序/删除会错位）。

**选择**
- 用业务稳定 ID（数据库 id/ uuid）；纯静态列表可用内容哈希；避免每次 render 生成随机 key。
- key 变化会让组件卸载重建，丢失输入/滚动/动画状态；不要为了「强制刷新」滥用 key。

**常见坑**
- 用 index 导致受控输入串行；key 重复导致警告/渲染异常；把 key 传给子组件当 prop（key 不参与 props）。"""),
115:("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",92,"""**定义**
- 闭包是函数与其词法作用域的组合：内部函数引用外部变量，即使外部函数已返回，变量仍被保留。
- 用途：私有状态、函数工厂、回调保存上下文、防抖/节流、模块模式。

**注意**
- 闭包持有外部变量，长生命周期/大对象可能内存泄漏；不再需要时置空/移除监听。
- 循环中 var 共享同一变量，用 let/IIFE 捕获每次迭代；`this` 不是闭包，箭头函数才继承外层 this。

**例子**
- `function counter(){let n=0;return ()=>++n}` 每次调用共享 n；多个 counter 各自独立。
- 闭包是 JS 模块/React hooks 的基础，但 hooks 依赖数组要正确声明。"""),
146:("https://man7.org/linux/man-pages/man1/ls.1.html",90,"""**查看/导航**
- `ls -lah`、`pwd`、`cd`、`tree -L 2`；`find . -name '*.log' -mtime +7` 按名/时间找。
- `cat/less/head/tail -f` 看文件；`grep -RIn` 搜内容；`stat` 看元数据。

**操作**
- `cp -a`、`mv`、`rm -rf`（危险，先确认路径）、`mkdir -p`、`touch`；`ln -s` 软链。
- `tar -czf`/`-xzf` 打包解压；`rsync -av --delete` 同步（慎用 delete）；`chmod/chown` 权限。

**安全**
- 删除前 `ls`/`realpath` 确认；避免 `rm -rf $VAR/` 变量为空；重要操作先备份；用 `find ... -delete` 要限范围。"""),
130:("https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html",93,"""**结构**
- InnoDB 用 B+ 树：非叶子只存键/指针，叶子存数据/主键并链表连接；树高低、范围查询友好，磁盘 I/O 少。
- 聚簇索引：主键索引叶子存整行；二级索引叶子存主键值，查询非覆盖列要回表。

**为什么不是 B 树/哈希**
- B 树非叶子也存数据，单页能放的键少、树更高；哈希只支持等值，不支持范围/排序/最左前缀。
- B+ 树叶子链表适合 `range/order by`，且所有查询都到叶子，性能稳定。

**设计**
- 联合索引遵循最左前缀；区分度高/选择性好的列靠前；避免过长主键（二级索引都存）；用 EXPLAIN 看是否回表/覆盖。"""),
116:("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",93,"""**模型**
- JS 单线程执行调用栈；异步任务完成后，回调进入任务队列，由事件循环在栈空时取出执行。
- 宏任务（script/setTimeout/setInterval/IO）与微任务（Promise.then/MutationObserver/queueMicrotask）；每轮宏任务后清空微任务队列。

**顺序**
- 同步代码 → 当前宏任务结束 → 所有微任务 → 下一个宏任务；`await` 后面的代码相当于微任务。
- `setTimeout(fn,0)` 不是立即执行；渲染时机在宏任务/微任务之间，长任务会阻塞渲染。

**实践**
- 避免长同步任务/死循环；大量计算用 Worker；理解 Promise/async 顺序，不要依赖 setTimeout 做精确时序。"""),
113:("https://docs.python.org/3/reference/datamodel.html#context-managers",91,"""**协议**
- `with` 依赖 `__enter__`/`__exit__`；进入时返回值可 `as` 绑定，退出时 `__exit__` 负责释放资源。
- 异常会传给 `__exit__`，返回 True 可吞掉异常（慎用）；适合文件/锁/连接/事务。

**实现**
- 类实现两个方法；或用 `contextlib.contextmanager` + `yield`（yield 前是 enter，后是 exit，需 try/finally）。
- 异步用 `async with` / `__aenter__`/`__aexit__`。

**价值**
- 保证异常/提前 return 也能释放资源，比手写 try/finally 更清晰；不要用它隐藏异常/做复杂业务分支。"""),
102:("https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html",92,"""**原理**
- synchronized 基于对象监视器（monitor）：进入时获取锁，退出/异常时释放；保证临界区互斥和内存可见性。
- 修饰实例方法锁 this，静态方法锁 Class 对象，代码块锁指定对象；可重入。

**优化**
- JDK 6+ 有偏向锁/轻量级锁/重量级锁升级（具体随版本），减少无竞争开销；锁粗化/消除由 JIT 做。
- 不要锁字符串/包装类等共享对象；锁范围尽量小，避免在锁内做 I/O/远程调用。

**对比**
- 与 ReentrantLock 比：synchronized 简单、自动释放；需要超时/公平/条件变量/可中断时用 Lock。"""),
106:("https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html",92,"""**核心参数**
- corePoolSize、maximumPoolSize、keepAliveTime、workQueue、threadFactory、handler；任务先填核心线程，再入队，队列满才扩到 max，最后拒绝。
- 无界队列会让 max 失效、内存膨胀；有界队列+拒绝策略更可控。

**状态/流程**
- RUNNING/SHUTDOWN/STOP/TIDYING/TERMINATED；`shutdown` 不再接新任务、等已提交完成；`shutdownNow` 中断。
- 线程复用降低创建开销；空闲线程按 keepAlive 回收（核心线程可 allowCoreThreadTimeOut）。

**实践**
- 按任务类型（CPU/IO）定池大小；不同业务隔离线程池；监控队列/活跃/拒绝；拒绝策略要可观测，不要静默丢弃。"""),
157:("https://docs.docker.com/network/",91,"""**模式**
- bridge：默认，容器通过 docker0/自定义桥接网络通信；自定义 bridge 支持 DNS 服务发现。
- host：共享宿主网络栈，性能好但端口冲突/隔离弱；none：无网络；container：复用另一容器网络。
- overlay：跨主机（Swarm）；macvlan：容器直接拿 MAC/IP；ipvlan 类似。

**选择**
- 单机多容器用自定义 bridge；需要高性能/大量端口用 host；跨主机集群用 overlay；需要二层接入用 macvlan。
- 生产注意网络隔离/策略、DNS、MTU、端口映射、防火墙；不要用默认 bridge 做服务发现。"""),
133:("https://dev.mysql.com/doc/refman/8.0/en/optimization.html",93,"""**先定位**
- 慢查询日志/`EXPLAIN`/`EXPLAIN ANALYZE` 看 type、rows、key、Extra；区分全表扫描、回表、临时表/文件排序。
- 监控 CPU/IO/锁等待；不要一上来加索引。

**SQL/索引**
- 只查必要列，避免 `SELECT *`；联合索引最左前缀，覆盖索引减少回表；避免列上函数/隐式转换。
- 大分页用游标/延迟关联；子查询改 JOIN/EXISTS 视情况；减少 N+1。

**架构**
- 读写分离/缓存/分库分表/归档；但先优化 SQL/索引/表结构；用压测验证，避免过度设计。
- 索引不是越多越好：写放大/空间/优化器选择；定期清理无用索引。"""),
161:("https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP",92,"""**HTTP/1.1**
- 文本协议、持久连接/管道化，但队头阻塞；浏览器并发 6 个连接/域；头部冗余。

**HTTP/2**
- 二进制分帧、多路复用（一个连接并发流）、头部压缩 HPACK、服务器推送（已弱化）；解决 HTTP 队头阻塞，但 TCP 层仍可能队头阻塞。

**HTTP/3**
- 基于 QUIC/UDP，内置 TLS 1.3、0-RTT、流级独立，解决 TCP 队头阻塞；连接迁移（网络切换）更好。
- 选型：HTTP/2 已普及；HTTP/3 适合移动/弱网，需 CDN/客户端支持；注意 UDP 被限速/阻断的降级。"""),
110:("https://docs.python.org/3/tutorial/datastructures.html",90,"""**列表 list**
- 可变、有序、可重复；支持 append/pop/切片/排序；内存有指针数组开销，适合频繁增删/修改。

**元组 tuple**
- 不可变、有序、可重复；可哈希（元素都可哈希）时可作 dict key/set 元素；创建/访问更轻量，适合固定结构/返回值。

**选择**
- 需要修改→list；固定记录/字典键/多返回值→tuple；大量数值计算→array/numpy；需要唯一→set。
- 注意 tuple 内可变元素仍可变；`(1)` 不是元组，`(1,)` 才是。"""),
114:("https://docs.python.org/3/tutorial/classes.html#generators",91,"""**迭代器**
- 实现 `__iter__`/`__next__`，一次遍历，耗尽后 StopIteration；可被 for 消费；自身就是迭代器。

**生成器**
- 用 `yield` 的函数，调用返回生成器（也是迭代器）；惰性求值、节省内存，适合大文件/流式数据。
- 生成器只能遍历一次；可用 `send/throw/close` 做协程；`yield from` 委托子生成器。

**区别**
- 迭代器是协议，生成器是创建迭代器的语法；列表推导是立即求值，生成器表达式是惰性。
- 注意生成器中的异常/资源释放，用 try/finally 或 contextlib。"""),
191:("https://www.atlassian.com/software/confluence/templates/technical-design",91,"""**结构**
- 背景/目标/非目标 → 现状与约束 → 方案选项与取舍 → 详细设计（架构/数据/接口/流程）→ 容量/性能/安全 → 迁移/回滚 → 里程碑/风险。
- 先写「为什么」和「不做什么」，避免方案跑偏；用图+关键接口，不堆代码。

**评审**
- 拉相关方（产品/研发/运维/安全/数据）评审；列出假设/依赖/开放问题；记录决策（ADR）。
- 方案要可验证：指标、压测/灰度、验收标准；对高风险点做 PoC。

**落地**
- 任务拆解/owner/排期；上线计划/回滚；事后复盘，文档持续更新，不写「一次性 PPT」。"""),
123:("https://developer.mozilla.org/en-US/docs/Web/HTML",90,"""**常用 API**
- 语义化标签（header/nav/main/section/article/footer）、音视频（audio/video）、canvas/SVG、拖放、地理定位、Web Storage（localStorage/sessionStorage）、History、Fetch/WebSocket（常与 HTML5 一起提）。
- 表单增强：email/url/number/date、required/pattern、datalist、progress/meter。

**注意**
- HTML5 是 HTML 标准演进，不是单一“API 集合”；浏览器支持/降级要查 caniuse。
- 语义化影响 SEO/无障碍；API 使用要考虑权限/隐私（定位/存储/摄像头）。

**回答**
- 挑 3–5 个你真正用过的 API，说明场景和坑，比背清单更加分。"""),
155:("https://kubernetes.io/docs/concepts/configuration/configmap/",92,"""**ConfigMap**
- 存非敏感配置（key-value/文件），通过环境变量、命令行参数或 volume 挂载；更新后 Pod 不会自动重启（subPath 挂载不更新）。
- 适合应用配置/配置文件；不要存密钥。

**Secret**
- 存敏感数据（base64 不是加密），挂载/环境变量；启用 etcd 加密、RBAC、最小权限；敏感值可用外部 Secret Manager。
- `stringData` 方便写明文，`data` 需 base64；注意 Pod 环境变量不会热更新。

**实践**
- 配置与镜像分离；版本化/灰度；用 `immutable` 防误改；Secret 不要提交 Git；审计访问。"""),
150:("https://man7.org/linux/man-pages/man1/top.1.html",91,"""**CPU/负载**
- `top/htop` 看 load average、%CPU、运行队列；`vmstat 1` 看 r/b、si/so、us/sy/id/wa；`mpstat -P ALL 1` 看每核。
- 负载高但 CPU 低看 D 状态/I/O；sy 高看系统调用/中断；steal 高看虚拟化。

**内存**
- `free -h`、`vmstat`、`/proc/meminfo`；看 available 而非 free；OOM 看 dmesg；cache/buffer 可回收。
- 进程级 `pidstat -r`、`smem`、`pmap`。

**磁盘/网络**
- `iostat -x 1` 看 await/util、`iotop`；`ss -s`/`sar -n DEV` 看连接/流量；`df -h`/`du`。
- 先定位资源瓶颈，再看应用；保留基线/时间线。"""),
141:("https://redis.io/docs/manual/patterns/distributed-locks/",93,"""**基本做法**
- `SET lock_key unique_value NX PX 30000` 原子加锁；value 用随机 token，释放时用 Lua 比对 token 再删，防误删。
- 锁过期要大于业务执行时间；看门狗/续期（Redisson）解决长任务；重试要有退避/超时。

**边界**
- 单 Redis 主从异步复制：主挂后锁可能丢失；Redlock 多节点也有争议（时钟/网络分区）。
- 强一致场景用 ZooKeeper/etcd 或数据库唯一约束/乐观锁；锁只是降低并发，不是事务替代。

**实践**
- 锁粒度尽量小；可重入要记录；释放必须原子；监控锁等待/超时/续期失败；业务操作要幂等。"""),
136:("https://en.wikipedia.org/wiki/Database_normalization",90,"""**1NF**
- 每列原子、不可再分；不要在一列存逗号分隔的多值；有主键。

**2NF**
- 在 1NF 基础上，非主属性完全依赖候选键，消除部分依赖；复合主键场景尤其注意。

**3NF**
- 在 2NF 基础上，非主属性不传递依赖候选键；例如部门地址不要重复存在员工表（员工→部门→地址）。

**实践**
- 范式减少冗余/更新异常；但报表/高并发查询可适度反范式（冗余/宽表）换性能；用约束/事务保证一致性。
- BCNF/4NF 处理更复杂依赖；面试先讲清 1/2/3NF + 例子。"""),
160:("https://www.rfc-editor.org/rfc/rfc5681",92,"""**流量控制**
- 端到端：接收方通过窗口（rwnd）告诉发送方还能收多少，防止接收缓冲溢出；滑动窗口/零窗口探测。
- 关注接收方处理能力，是「别发太快」。

**拥塞控制**
- 网络侧：发送方根据丢包/延迟估计拥塞，调整拥塞窗口（cwnd）；慢启动、拥塞避免、快重传/快恢复。
- 关注网络容量，是「网络扛不住」。

**实际**
- 发送窗口=min(rwnd,cwnd)；BBR 等基于带宽/延迟；高丢包/长肥管道要调参；监控重传/RTT/窗口。"""),
154:("https://kubernetes.io/docs/concepts/services-networking/service/",92,"""**类型**
- ClusterIP：集群内虚拟 IP，默认；Headless（clusterIP: None）返回 Pod IP，适合 StatefulSet/服务发现。
- NodePort：每个节点开端口，外部可通过 NodeIP:Port 访问；端口范围限制/安全风险。
- LoadBalancer：云厂商 LB，外部访问；ExternalName：CNAME 到外部域名。

**选择**
- 集群内→ClusterIP；临时外部→NodePort；生产外部→LoadBalancer/Ingress；需要直连 Pod→Headless。
- 配合 Ingress 做七层路由/TLS；NetworkPolicy 限制流量；Service 只做四层负载均衡。"""),
186:("https://arxiv.org/abs/2005.11401",93,"""**流程**
- 检索：把问题/文档向量化，从知识库召回 Top-K 相关片段（向量/关键词/混合检索）；重排提高相关性。
- 增强：把片段+问题组装进 Prompt，要求模型基于证据回答并引用；生成后做引用/一致性校验。

**价值**
- 知识可更新、可溯源、减少幻觉；不用重训模型；适合企业知识库/客服/文档问答。

**难点**
- 切块/召回质量、上下文长度、冲突信息、权限隔离；检索不到时拒答；评估检索命中+答案正确+引用。
- RAG 不是万能：推理/多跳/表格/实时数据要结合工具/微调。"""),
108:("https://docs.oracle.com/javase/tutorial/reflect/",91,"""**原理**
- 运行时通过 Class 对象获取类结构（字段/方法/构造器/注解），可动态创建实例、调用方法、修改字段；突破编译期类型限制。
- 来源：`Class.forName`、`obj.getClass()`、`类.class`；`setAccessible(true)` 可访问私有成员（模块系统下受限）。

**应用**
- 框架（Spring DI、MyBatis、Jackson）、动态代理、注解处理、测试工具；插件/扩展点。

**代价**
- 性能开销（检查/装箱/无法内联）、破坏封装/安全、混淆后名字失效；频繁调用可缓存 Method/Field。
- 生产慎用反射改私有字段；优先接口/注解处理器。"""),
172:("https://docs.spring.io/spring-boot/index.html",91,"""**核心**
- 自动配置（根据 classpath/属性条件装配）、起步依赖（starter 聚合依赖）、内嵌容器（Tomcat/Jetty/Undertow）、外部化配置（application.yml/env）、Actuator 监控。
- 约定优于配置，减少 XML/样板；`@SpringBootApplication` = 配置+自动配置+组件扫描。

**与 Spring**
- Spring 是基础框架/IOC/AOP；Spring Boot 是快速构建独立应用的脚手架，不是替代 Spring。
- 可排除自动配置/自定义 starter；复杂场景仍可写 @Configuration。

**注意**
- 自动配置魔法要懂条件装配/调试（`--debug`）；版本兼容/依赖冲突；生产配 Actuator/健康检查。"""),
145:("https://redis.io/docs/latest/develop/use/patterns/",91,"""**做法**
- 登录后生成 sessionId，把用户会话写入 Redis（key `session:<id>`，TTL 与登录有效期一致）；Cookie 只存 sessionId（HttpOnly/Secure/SameSite）。
- 多实例共享 Redis，任意节点可读；更新/退出删除 key；续期 TTL。

**安全**
- sessionId 随机/足够长；防会话固定（登录后重建）；敏感数据加密/最小化；Redis 访问控制/网络隔离。
- Redis 持久化/主从故障要考虑会话丢失/降级；可用集群/哨兵。

**对比**
- 比 sticky session 更易扩展；比数据库 session 性能好；注意 Redis 成为关键依赖，需高可用。"""),
156:("https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",92,"""**滚动更新**
- Deployment 用 `strategy.rollingUpdate`（maxUnavailable/maxSurge）逐步替换 Pod；readinessProbe 通过才接流量，避免 502。
- `kubectl rollout status` 看进度；`kubectl set image` 或改 manifest 触发；revisionHistoryLimit 保留历史。

**回滚**
- `kubectl rollout undo deployment/name [--to-revision=N]`；`rollout history` 查看；回滚也是滚动过程，需验证。
- 数据库迁移要兼容新旧版本（expand-contract），否则回滚代码不兼容数据。

**实践**
- 配合 PDB/优雅下线/健康检查；灰度可用多 Deployment/Service 权重或渐进式发布；监控错误率/延迟。"""),
}
by={q['id']:q for q in DATA['questions']}; updated=[]
for qid,(src,score,ans) in R.items():
 q=by.get(qid)
 if not q: raise SystemExit('missing '+str(qid))
 q['answer']=ans.strip(); q['source']=src; q['aiScore']=score; q['updatedAt']=NOW; q['reviewedAt']=NOW; q['reviewedBy']='manual-top30-20261022'; updated.append(qid)
write_published(DATA)
print('updated',len(updated),'version',DATA['version'])
