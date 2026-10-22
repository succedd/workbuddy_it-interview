#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第三批质量修复：30 道高浏览短答案/无来源题（2026-10-22）。"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enrich_questions import load_published, write_published
D=load_published(); NOW=int(time.time()*1000)
R={
119:("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",92,"""**原型链**
- 每个对象有内部 `[[Prototype]]`（`__proto__`/`Object.getPrototypeOf`），访问属性时先找自身，找不到沿原型链向上查，直到 `null`。
- 构造函数 `Fn.prototype` 是实例的原型；`new Fn()` 让实例的原型指向 `Fn.prototype`，实现方法与共享。

**继承**
- `class` 本质是原型继承的语法糖；`extends` 设置原型链/构造器；`super` 调用父类。
- 修改原型会影响所有实例；不要随意改内置原型（污染）。

**排查**
- `instanceof` 检查原型链；`hasOwnProperty` 只查自身；原型链过深有查找开销。"""),
142:("https://redis.io/docs/latest/develop/reference/eviction/",93,"""**过期删除**
- Redis 同时用惰性删除（访问时检查过期）和定期删除（抽样清理），不是到点立即删除；过期 key 可能仍占内存。
- `EXPIRE/PEXPIRE`、`TTL`；主从过期由主节点驱动，从节点读到过期 key 返回空。

**内存淘汰**
- 达到 `maxmemory` 后按 `maxmemory-policy` 淘汰：noeviction、allkeys-lru/lfu、volatile-lru/lfu/ttl、random 等。
- LRU/LFU 是近似算法（采样）；volatile 只淘汰有过期时间的 key；noeviction 写入会报错。

**实践**
- 缓存用 allkeys-lru/lfu + 合理 maxmemory；持久化/队列不要被淘汰；监控 evicted_keys/内存碎片。"""),
149:("https://www.gnu.org/software/bash/manual/bash.html",91,"""**变量**
- `name=value`（等号无空格），`$name`/`${name}` 引用；`export` 导出给子进程；`local` 函数内局部变量。
- 特殊变量：`$?` 上条退出码、`$#` 参数个数、`$@` 参数列表、`$$` PID；引用加引号防空格/通配。

**条件**
- `if [ "$x" = "y" ]; then ...; fi`；数值 `-eq/-lt`，文件 `-f/-d/-x`；`[[ ]]` 支持正则/逻辑且更安全。
- `case` 多分支；`&&/||` 短路；`set -euo pipefail` 提升健壮性（注意兼容）。

**坑**
- 未加引号导致 word splitting；`[` 两侧空格；变量为空时 `[ -f $f ]` 报错；用 shellcheck。"""),
194:("https://www.iiba.org/business-analysis-body-of-knowledge/",91,"""**先定问题**
- 和业务方确认目标、成功指标、范围/不做什么、角色与约束；区分「需求」与「方案」。
- 识别干系人：决策者、使用者、运维/安全/合规，分别访谈/观察。

**方法**
- 访谈+跟岗+数据分析+竞品；画流程/用户旅程/上下文图；把需求写成用户故事/用例+验收标准。
- 非功能需求（性能/安全/可用性/合规）单独列；冲突需求回到业务目标排序。

**输出**
- 需求文档/ backlog：背景、目标、范围、流程、字段/权限、异常、验收；评审确认，变更走版本；避免只做「传话筒」。"""),
158:("https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",92,"""**资源限制**
- requests 用于调度（保证最少资源），limits 限制上限；CPU 超限被节流，内存超限 OOMKill。
- 设置合理 requests/limits；QoS：Guaranteed（requests=limits）、Burstable、BestEffort；关键服务用 Guaranteed/PDB。

**HPA**
- 基于 CPU/内存/自定义指标扩缩 Pod 副本；需要 metrics-server/自定义 metrics adapter；`minReplicas/maxReplicas/target`。
- 扩容有延迟，配合 cluster autoscaler；缩容要防抖动（stabilization window）。

**坑**
- 只设 limits 不设 requests 导致调度/驱逐问题；HPA 与 VPA 冲突；指标不准/冷启动；资源配额/命名空间限制。"""),
152:("https://docs.docker.com/compose/",91,"""**作用**
- 用 YAML 定义多容器应用（服务/网络/卷/环境/依赖），一条 `docker compose up` 启动整套；适合本地开发/测试/小型部署。
- `services` 定义镜像/构建/端口/环境/依赖；`volumes` 持久化；`networks` 服务发现；`depends_on` 控制启动顺序（不保证就绪）。

**常用**
- `up -d`、`down`、`logs -f`、`ps`、`exec`、`build`；`--profile` 可选服务；`.env` 变量。
- 生产编排通常用 K8s/Swarm；Compose 不擅长跨主机/自动扩缩/滚动升级。

**坑**
- 数据未挂载丢失；depends_on 不等于健康检查；端口冲突；镜像版本漂移；敏感信息别写进 compose。"""),
192:("https://google.github.io/eng-practices/review/",92,"""**目标**
- Code Review 是保证正确性/可维护性/知识共享，不是挑刺或炫技；先看设计/边界/测试，再看风格。
- 小 PR（<400 行）更容易审；作者写清背景/验证方式/风险。

**评审**
- 正确性：边界/错误/并发/安全；可读性/命名/重复；测试覆盖；性能/兼容性。
- 评论分级：blocking / suggestion / nit；给具体改法，不只说「不好」；尊重作者，讨论代码不讨论人。

**流程**
- 及时响应；至少一人（关键模块两人）；作者解决/回复；合并前 CI 绿；事后复盘缺陷，更新规范/自动化。"""),
174:("https://docs.spring.io/spring-framework/reference/core/aop.html",92,"""**原理**
- Spring AOP 基于动态代理：JDK 接口代理或 CGLIB 子类代理；在方法调用前后插入通知（Advice），实现横切逻辑。
- 切点（Pointcut）匹配方法，连接点（JoinPoint）是执行点；通知类型：Before/After/AfterReturning/AfterThrowing/Around。

**应用**
- 事务、日志、权限、缓存、监控、重试；注解驱动 `@Aspect` + `@Around`。
- 只对 Spring Bean 的外部调用生效；同类自调用绕过代理；final/private 方法 CGLIB 不能代理。

**注意**
- 切点范围过宽影响性能/可读性；通知里别吞异常；AOP 不是万能，业务逻辑仍显式。"""),
188:("https://www.anthropic.com/research/building-effective-agents",91,"""**组成**
- LLM 负责规划/决策，工具（搜索/代码/API）负责执行，记忆/上下文保存状态，编排层控制循环、重试、权限和人工接管。
- 常见模式：ReAct（推理+行动）、Plan-and-Execute、多 Agent 分工；不是所有任务都需要 Agent。

**设计**
- 工具 schema 清晰、幂等、最小权限；限制最大步数/超时/成本；失败可恢复；关键动作人工确认。
- 评估任务成功率/步骤/成本/延迟；做故障注入和红队，防止死循环/工具滥用。

**边界**
- 简单固定流程用 workflow/规则更可靠；Agent 适合开放、多步、工具丰富的任务；要可观测/可回滚。"""),
125:("https://vuejs.org/guide/extras/composition-api-faq.html",91,"""**Options API**
- 按 data/methods/computed/watch 选项组织，结构直观、上手快；适合小中型组件/团队熟悉 Vue2。
- 逻辑分散在多个选项，复杂组件复用/类型推导较弱。

**Composition API**
- 用 setup/组合式函数按逻辑组织，ref/reactive/computed/watchEffect 可抽成 composable；类型推导好、逻辑复用强。
- 适合复杂组件/大型项目/TS；需要理解响应式细节（解构丢响应式、ref .value）。

**选择**
- 不是替代关系，可混用；新项目/复杂逻辑优先 Composition；简单页面 Options 也可；团队规范统一。"""),
135:("https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html",92,"""**聚簇索引**
- InnoDB 主键索引即聚簇索引，叶子节点存整行数据；表数据按主键组织，一张表只有一个。
- 主键查询快；主键过长/随机插入会导致页分裂/碎片。

**非聚簇（二级）索引**
- 叶子存索引列+主键值；查非覆盖列要回表（再按主键查聚簇索引）。
- 联合索引/覆盖索引可避免回表；二级索引过多增加写放大/空间。

**选择**
- 主键用短、递增、稳定列；高频查询建合适联合索引；用 EXPLAIN 看是否回表；不要盲目加索引。"""),
124:("https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling",90,"""**原理**
- 事件从目标元素向上冒泡到父级；把监听器挂在父容器，利用 `event.target` 判断实际点击元素，减少监听器数量。
- 适合列表/表格/动态新增元素；新增子元素无需重新绑定。

**写法**
- `container.addEventListener('click', e => { const btn=e.target.closest('[data-action]'); ... })`；`closest` 处理嵌套。
- 需要阻止冒泡用 `stopPropagation`（慎用）；事件委托对不冒泡事件（focus/blur）用捕获或 focusin/out。

**注意**
- 动态 DOM 销毁时移除监听；大量委托注意性能；`event.target` 可能是文本节点/子元素。"""),
190:("https://www.shrm.org/topics-tools/news/talent-acquisition/answering-why-are-you-leaving-your-job",90,"""**原则**
- 诚实但建设性：说「寻求成长/更匹配的方向」，不要抱怨前公司/领导/同事；不透露机密/敏感冲突。
- 结构：肯定过去收获 → 说明职业目标 → 为什么这个岗位匹配；把离职原因和应聘动机连起来。

**表达**
- 避免只说「钱少/加班多」；可讲发展空间、技术栈/业务方向、团队规模、通勤等客观因素。
- 不甩锅、不贬低；如果被裁员，简洁说明业务调整，重点说下一步准备。

**边界**
- 不撒谎（背调可能核实）；不泄露前公司数据；对敏感原因准备中性说法；保持积极、面向未来。"""),
189:("https://www.indeed.com/career-advice/interviewing/self-introduction",90,"""**结构（60秒）**
- 我是谁：姓名/年限/方向（10秒）；核心能力：2–3 个与岗位匹配的技能/项目（25秒）；代表成果：量化结果/难点（15秒）；为什么应聘：动机+匹配（10秒）。

**表达**
- 用「岗位语言」：看 JD 关键词，选相关经历；用 STAR 简版讲一个亮点；不要背简历流水账。
- 自信、简洁、有重点；语速适中；结尾可抛一个钩子（「这段经历让我对贵司的 XX 很感兴趣」）。

**准备**
- 写 3 版（30/60/90 秒）；录音回听；准备追问（项目细节/失败/为什么选我们）；不要复述简历全部。"""),
144:("https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/",92,"""**分片**
- Redis Cluster 把 key 空间分为 16384 个 hash slot；`CRC16(key) mod 16384` 决定 slot，slot 分配到主节点。
- 客户端缓存 slot→节点映射，MOVED/ASK 重定向；多 key 操作要求同 slot（hash tag `{}`）。

**高可用**
- 每个主节点带从节点，主故障由集群投票提升从；`cluster-enabled yes`、`cluster-config-file`。
- 扩容/缩容迁移 slot；迁移中 ASK 重定向；集群总线/ gossip 传播状态。

**限制**
- 跨 slot 事务/批量受限；大 key/热 key 仍会倾斜；需要客户端支持集群；脑裂/网络分区要配置合理。"""),
166:("https://en.wikipedia.org/wiki/Tree_traversal",90,"""**深度优先**
- 前序：根→左→右；中序：左→根→右（BST 得有序）；后序：左→右→根（释放/表达式求值）。
- 递归简洁；迭代用显式栈；Morris 可 O(1) 空间（改变树结构，需恢复）。

**广度优先**
- 层序：队列逐层访问；适合按层统计/最短路径（无权图）。

**选择**
- 需要排序/验证 BST→中序；复制/序列化→前序+中序；释放/依赖→后序；层信息→BFS。
- 复杂度 O(n)，空间 O(h) 或 O(w)；注意空树/单节点/递归深度。"""),
120:("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",92,"""**本质**
- async 函数返回 Promise；遇到 await 暂停执行，把后续代码注册为微任务，等 Promise settled 后恢复；不是阻塞线程。
- await 一个非 Promise 会包装成 resolved Promise；异常变成 rejected Promise，用 try/catch 捕获。

**执行顺序**
- async 函数同步执行到第一个 await；await 后代码进微任务；多个 await 串行，除非 Promise.all 并行。
- 忘记 await 会得到 Promise 而不是结果；在循环里 await 串行，需并行用 map+Promise.all。

**错误处理**
- try/catch 捕获 await 的 rejection；未处理的 rejection 要全局监控；不要混用 `.then` 和 await 导致顺序混乱。"""),
167:("https://cp-algorithms.com/sorting/merge_sort.html",91,"""**快排**
- 选 pivot 分区，左小右大，递归；平均 O(n log n)，最坏 O(n²)（已排序/极端 pivot），原地但不稳定。
- 适合内存排序/平均性能；随机 pivot/三数取中缓解最坏；小数组可切插入排序。

**归并**
- 分治合并两个有序子数组；稳定 O(n log n)，需要 O(n) 额外空间；适合链表/外部排序/要求稳定。
- 递归/迭代自底向上；合并时比较取小，稳定性靠先取左。

**选择**
- 要稳定/最坏可控→归并；内存敏感/平均快→快排；工程中常混合（Timsort/内省排序）。"""),
195:("https://www.whatmatters.com/faqs/okr-meaning-examples",91,"""**OKR**
- Objective 是定性的、有野心的方向；Key Results 是 2–5 个可量化结果，衡量是否达成，不是任务清单。
- 典型周期季度；公开透明、对齐上下级；评分 0–1，鼓励挑战（0.7 已不错），不与绩效简单挂钩。

**制定**
- O 回答「我们要去哪里/为什么」；KR 用指标/里程碑，避免「完成 X 功能」这种产出；有基线/目标/时间。
- 区分承诺型（必须达成）和挑战型；每周 check-in，季度复盘；避免 KR 太多/不可衡量。

**常见坑**
- 把 OKR 当 KPI/任务列表；目标太多；只定不跟踪；与奖金强绑导致保守。"""),
127:("https://react.dev/learn/preserving-and-resetting-state",92,"""**虚拟 DOM**
- React 用 JS 对象描述 UI（React element），在内存中形成树；状态变化时重新 render 生成新树，与旧树 diff，计算最小 DOM 更新。
- 批量更新/协调（reconciliation）减少直接 DOM 操作；key 帮助识别列表项身份。

**不是更快**
- 虚拟 DOM 本身有 diff 开销；优势是可声明式/跨平台/可预测，不是「一定比原生 DOM 快」。
- 频繁大列表要 memo/虚拟化；React 18 并发/自动批处理优化调度。

**注意**
- 不要直接改 state；key 稳定；避免不必要 render（memo/useMemo/useCallback 按需）。"""),
148:("https://man7.org/linux/man-pages/man8/ip.8.html",91,"""**查看**
- `ip addr`/`ip link` 看网卡/IP；`ip route` 看路由；`ss -tulnp` 看端口/连接；`ping`/`traceroute` 通断。
- `curl -v`/`dig` 看 HTTP/DNS；`tcpdump -i any port 80` 抓包；`nstat`/`sar -n DEV` 看统计。

**配置**
- `ip addr add`、`ip route add`（临时）；持久化用 NetworkManager/netplan；`ethtool` 看链路/速率。
- 防火墙 `nft/iptables`；`ss` 替代 netstat；`nc -zv host port` 测端口。

**排查**
- 先链路（link）→IP/路由→DNS→端口→应用；区分本机/网络/服务；抓包确认请求/响应。"""),
118:("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",92,"""**状态**
- Promise 有 pending/fulfilled/rejected，状态不可逆；`then` 返回新 Promise，可链式；`catch` 捕获 rejection，`finally` 清理。
- 执行器同步执行；resolve/reject 只第一次生效；then 回调进微任务。

**组合**
- `Promise.all` 全部成功才成功（一个失败即失败）；`allSettled` 等全部；`race` 第一个 settled；`any` 第一个成功。
- 错误处理：链末尾 catch；避免忘记 return 导致链断裂；未处理 rejection 要监控。

**手写**
- 维护状态/回调队列，resolve/reject 时异步清空；then 要处理返回值/抛错并返回新 Promise；注意 thenable 递归。"""),
153:("https://kubernetes.io/docs/concepts/workloads/controllers/",92,"""**Pod**
- 最小调度单元，一个或多个容器共享网络/存储/生命周期；通常不直接创建裸 Pod，而由控制器管理。
- 生命周期 phase/conditions/探针；重启策略 Always/OnFailure/Never。

**控制器**
- Deployment：无状态应用，滚动更新/回滚/副本；ReplicaSet 保证副本数。
- StatefulSet：有状态，稳定网络标识/有序部署/持久卷；DaemonSet：每节点一个（日志/监控）；Job/CronJob：批处理。
- 选择按是否有状态/任务类型/节点覆盖；配合 Service/Ingress/HPA/PDB。"""),
173:("https://docs.spring.io/spring-framework/reference/core/beans/introduction.html",92,"""**IoC**
- 控制反转：对象的创建/依赖装配交给 Spring 容器，而不是在代码里 new；容器管理 Bean 生命周期/作用域。
- DI 是 IoC 的实现方式：构造器/Setter/字段注入；推荐构造器注入（不可变、易测试、依赖明确）。

**容器**
- BeanDefinition 注册/扫描，实例化/属性填充/初始化/销毁；作用域 singleton/prototype/request/session。
- 循环依赖：单例 setter 可三级缓存解决，构造器循环依赖报错；优先重构。

**价值**
- 解耦/可测试/统一配置；但别滥用字段注入/服务定位器；理解代理/AOP 与 Bean 生命周期。"""),
165:("https://en.wikipedia.org/wiki/Array_(data_structure)",90,"""**数组**
- 连续内存、随机访问 O(1)；插入/删除中间 O(n)（搬移）；大小固定/扩容复制；缓存友好。
- 适合频繁按索引读、遍历、大小可预估。

**链表**
- 节点+指针，插入/删除已知位置 O(1)（找位置 O(n)）；不支持随机访问；额外指针内存/缓存不友好。
- 适合频繁插入删除、大小动态、队列/栈/LRU。

**选择**
- 读多写少/随机访问→数组；频繁中间增删/动态→链表；工程中动态数组（ArrayList/vector）常优于链表；考虑缓存局部性。"""),
185:("https://platform.openai.com/docs/guides/prompt-engineering",91,"""**原则**
- 指令清晰具体：角色/目标/输入/输出格式/约束/示例；把「做什么、不做什么、怎么判断成功」写清。
- 提供上下文/证据，要求引用/不确定时拒答；复杂任务拆步骤/让模型先计划再执行。

**迭代**
- 用评测集/失败样本迭代，不靠单次感觉；版本化 Prompt，A/B/回归；控制变量。
- 输出结构化（JSON schema）、给示例、限制长度/风格；安全上防注入/隐私/越权。

**误区**
- 堆「魔法词」、过长无关上下文、只加「请仔细」；不评估就上线；把模型当数据库。"""),
112:("https://docs.python.org/3/c-api/init.html#thread-state-and-the-global-interpreter-lock",92,"""**GIL**
- CPython 的全局解释器锁：同一进程内同一时刻只有一个线程执行 Python 字节码；多线程不能并行 CPU 密集任务。
- I/O 等待会释放 GIL，所以多线程适合 I/O 密集；CPU 密集用多进程/原生扩展。

**解决**
- `multiprocessing`/进程池；C 扩展/NumPy 在计算时释放 GIL；Cython/Numba；换解释器（Jython/无 GIL 的实验版本）需评估生态。
- 异步 I/O 适合高并发 I/O，不是 CPU 并行。

**注意**
- GIL 不代表线程安全，共享可变数据仍需锁；多进程有序列化/内存开销。"""),
193:("https://www.shrm.org/topics-tools/news/employee-relations/managing-conflict",90,"""**先降温**
- 私下沟通，先听双方事实/感受/诉求，不站队；区分立场（我要 X）和利益（为什么需要 X）。
- 对事不对人，明确共同目标/边界；避免在群里公开指责。

**解决**
- 找共同点/可交换条件，提出 2–3 个方案；明确责任/时间/复盘；必要时升级但先告知。
- 建立机制：职责边界/决策权/例会/文档，减少重复冲突；跨团队冲突找共同上级/架构委员会。

**长期**
- 复盘冲突根因（目标/资源/信息/性格），调整流程；培养反馈文化；不把冲突当「谁赢」。"""),
31:("https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html",93,"""**B+ 树**
- 非叶子只存键/指针，叶子存数据并链表连接；树高更低、磁盘 I/O 少，范围/排序/最左前缀都友好。
- 所有查询到叶子，性能稳定；叶子链表适合范围扫描。

**为什么不是 B 树/哈希**
- B 树非叶子也存数据，单页键少、树更高；哈希只支持等值，不支持范围/排序/最左前缀。
- InnoDB 二级索引叶子存主键，非覆盖查询回表；B+ 树让回表/范围更可控。

**设计**
- 联合索引最左前缀、区分度高的列靠前；主键短；EXPLAIN 看 type/key/rows/Extra；索引不是越多越好。"""),
101:("https://docs.oracle.com/en/java/javase/17/gctuning/",92,"""**分代**
- 堆分年轻代（Eden/Survivor）和老年代；新对象在 Eden，Minor GC 复制存活对象到 Survivor/老年代；老年代满触发 Major/Full GC。
- 对象年龄/大对象直接晋升；不同收集器（G1/ZGC）实现不同。

**收集器**
- Serial/Parallel：吞吐优先；CMS 低延迟但已废弃；G1 分区/可预测停顿；ZGC/Shenandoah 超低停顿。
- 选择看堆大小/延迟/吞吐/CPU；不要只看 GC 日志。

**调优**
- 先测量（GC 日志/GCViewer/JFR），看停顿/频率/晋升失败；调堆/新生代/收集器，不要盲目设参数。"""),
}
by={q['id']:q for q in D['questions']}; updated=[]
for qid,(src,score,ans) in R.items():
 q=by.get(qid)
 if not q: raise SystemExit('missing '+str(qid))
 q['answer']=ans.strip(); q['source']=src; q['aiScore']=score; q['updatedAt']=NOW; q['reviewedAt']=NOW; q['reviewedBy']='manual-quality30-20261022'; updated.append(qid)
write_published(D); print('updated',len(updated),'version',D['version'])
