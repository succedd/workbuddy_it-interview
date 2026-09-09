# -*- coding: utf-8 -*-
"""第 3 批：Java + JVM + Spring + 消息队列（来源：JavaGuide Java 基础/集合/并发/JVM 篇 + 面试鸭热门榜）"""
BATCH = "java-jvm-spring-mq"

QUESTIONS = [
# ============ Java [12] ============
dict(cat=12, title="HashMap 的底层实现原理？JDK 1.8 做了哪些改动？",
     body="请说明 HashMap 的数组+链表+红黑树结构、put 流程、扩容机制，以及 JDK 1.8 相比 1.7 的变化。",
     diff="中级", years="1-3年", tags=["Java","HashMap","集合","源码"],
     pos=["Java开发工程师","Java后端工程师","后端开发工程师"],
     answer="""**底层结构**（JDK 1.8）：数组（Node[] table，容量恒为 2 的幂）+ 链表 + **红黑树**。哈希冲突的元素挂成链表（用 `(n-1) & hash` 定位桶，n 为容量，等效取模但更快）。

**put 流程**：计算 hash → 定位桶 → 空桶直接放 → 是红黑树按树插入 → 是链表尾插（1.7 是头插，并发扩容会成环死循环，1.8 改尾插）→ 链表长度 ≥8 且数组容量 ≥64 时**树化**（否则先扩容）→ size 超过 `容量×0.75`（负载因子）触发扩容翻倍，元素重新分布。

**1.8 的主要改动**：
1. 引入**红黑树**：冲突严重时查询从 O(n) 降到 O(logn)；
2. **头插改尾插**：修复并发扩容链表成环；
3. 扩容优化：新位置要么在**原下标**、要么在**原下标+旧容量**（利用 hash 高位 bit），无需重算 hash。

**常识追问**：HashMap 非线程安全（并发用 ConcurrentHashMap）；key 的对象须正确实现 equals/hashCode；容量设 2 的幂是为了位运算取模与扩容重分布。""",),
dict(cat=12, title="ConcurrentHashMap 是如何保证线程安全的？1.7 和 1.8 有什么区别？",
     body="请对比 JDK 1.7 分段锁与 1.8 CAS+synchronized 的实现，并说明 size 统计等细节。",
     diff="高级", years="3-5年", tags=["Java","ConcurrentHashMap","并发","集合"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""**JDK 1.7**：**分段锁 Segment**（继承 ReentrantLock），默认 16 段，锁粒度是"段"，并发度最高 16，两重 hash 定位（先段后桶），实现复杂、内存浪费。

**JDK 1.8**：抛弃分段锁，改为 **CAS + synchronized**，锁粒度细化到**单个桶头节点**：
- 桶为空：**CAS** 直接插入头节点（无锁）；
- 桶非空：**synchronized 锁头节点**后链表/树插入（锁只有一个桶，竞争概率极低）；
- 扩容：支持**多线程协助迁移**（每个线程认领一段桶区间转移，ForwardingNode 标记）。

**size 统计**：1.8 用 `baseCount + CounterCell[]` 分散计数（类似 LongAdder 思想），避免单点 CAS 热点；size 是近似值（弱一致）。

**其他**：1.8 的 get 全程无锁（Node.val 和 next 用 volatile 保证可见性）；key/value 都不允许 null。

一句话：锁粒度从"段"细化到"桶"+无锁 CAS，并发度从 16 变成实质上的无限。"""),
dict(cat=12, title="String 为什么设计成不可变的？",
     body="请说明 String 不可变的实现方式与设计原因（常量池、hash 缓存、线程安全、安全性）。",
     diff="初级", years="0-1年", tags=["Java","String","不可变"],
     pos=["Java开发工程师","Java后端工程师","后端开发工程师"],
     answer="""**实现**：String 内部用 `final char[]`（JDK 9 后是 byte[]）存储，类本身 final 不可继承，且不提供任何修改内部数组的方法——每次"修改"（concat/replace 等）都返回新对象。

**设计原因**：
1. **字符串常量池**：字面量共享同一对象，不可变才能安全共享，省内存（`"a"=="a"` 为 true 的前提）；
2. **hashCode 缓存**：hash 首次计算后缓存到成员变量，String 作 HashMap/HashSet 的 key 时重复查询极快——若可变，缓存会失效且容器里 key 会"丢"；
3. **线程安全**：不可变对象天然线程安全，可随便共享；
4. **安全性**：文件路径、URL、类名、数据库连接参数等大量以 String 传递，若可变，中途被恶意修改会引发严重安全问题；方法调用者也不必防御性拷贝。

**代价**：频繁拼接产生大量临时对象——循环拼字符串用 StringBuilder（非线程安全）或 StringBuffer（线程安全）替代。"""),
dict(cat=12, title="Java 的异常体系是怎样的？受检异常与非受检异常的区别？",
     body="请说明 Throwable→Error/Exception 的结构、checked 与 unchecked 异常的划分及实践建议。",
     diff="初级", years="0-1年", tags=["Java","异常","基础"],
     pos=["Java开发工程师","Java后端工程师","后端开发工程师"],
     answer="""**体系**：所有异常的根是 `Throwable`，下分：
- **Error**：严重错误，程序无法处理，不该捕获——`OutOfMemoryError`、`StackOverflowError`、`NoClassDefFoundError`；
- **Exception**：
  - **受检异常（Checked）**：编译器强制 try-catch 或 throws 声明。发生在**编译期可预见**的外部问题——IOException、SQLException、ClassNotFoundException；
  - **非受检异常（Unchecked，RuntimeException 及其子类）**：多为**程序 bug**——NullPointerException、IndexOutOfBoundsException、IllegalArgumentException、ArithmeticException。不强制捕获。

**实践建议**：
1. 不要捕获 Throwable/Error；不要用异常做流程控制（性能差）；
2. 捕获后要么处理要么转译再抛，**禁止空 catch 吞异常**；
3. 自定义业务异常继承 RuntimeException，配合全局异常处理器（Spring @RestControllerAdvice）统一返回；
4. finally 中不要 return（会吞掉异常）；优先 try-with-resources 管理资源。"""),
dict(cat=12, title="接口和抽象类有什么区别？如何选择？",
     body="请从语法、设计语义（能否实例化、成员限制、多继承）等角度对比接口与抽象类。",
     diff="初级", years="0-1年", tags=["Java","面向对象","接口","抽象类"],
     pos=["Java开发工程师","Java后端工程师","后端开发工程师"],
     answer="""| 维度 | 抽象类 | 接口 |
|---|---|---|
| 语义 | "**是什么**"（is-a），抽取共性实现 | "**能做什么**"（can-do），定义能力契约 |
| 继承 | 单继承（一个类只能 extends 一个） | 多实现（implements 多个） |
| 成员变量 | 任意（可有状态） | 只能 `public static final` 常量 |
| 方法 | 可含具体实现与抽象方法 | Java 8 前只能抽象方法；8+ 有 default/static 方法 |
| 构造器 | 有（供子类调用） | 无 |

**如何选择**：
- 需要复用**公共实现**、维护**状态字段**、模板方法模式（父类定骨架，子类填细节）→ **抽象类**，如 `AbstractList`；
- 定义**行为规范**、解耦调用方与实现、需要多继承效果（如 Comparable+Serializable）→ **接口**，如 `List`、`Runnable`。

**典型组合**：接口定义契约 + 抽象类提供骨架实现（`List` 接口 ↔ `AbstractList` 骨架类），调用方面向接口编程。"""),
dict(cat=12, title="线程池的核心参数有哪些？工作流程和拒绝策略是什么？",
     body="请说明 ThreadPoolExecutor 的 7 个核心参数、任务提交的处理流程与四种拒绝策略。",
     diff="中级", years="1-3年", tags=["Java","线程池","并发"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""**七大核心参数**：corePoolSize（常驻核心线程数）、maximumPoolSize（最大线程数）、keepAliveTime+unit（非核心线程空闲存活时间）、workQueue（任务队列）、threadFactory（线程工厂，命名/守护设置）、handler（拒绝策略）。

**提交流程（execute）**：
1. 线程数 < core → **新建核心线程**执行；
2. 达到 core → 任务**入队列**排队；
3. 队列满 → 创建**非核心线程**（直到 max）执行；
4. 达到 max 且队列满 → 执行**拒绝策略**。

> 注意顺序：先入队再扩容，所以用无界队列（如默认 LinkedBlockingQueue）时 maximumPoolSize 形同虚设——这是"配了 max 却不生效"的常见坑。

**四种拒绝策略**：AbortPolicy（默认，抛 RejectedExecutionException）、CallerRunsPolicy（提交线程自己跑，天然削峰降速）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢最老的再入队）。

**实践**：禁用 Executors 快捷方法（无界队列/无限线程隐患），手动 new ThreadPoolExecutor；按任务类型定线程数——CPU 密集≈N+1，IO 密集≈2N 或 N×(1+等待/计算比）；用有界队列+合理拒绝策略兜底。"""),

# ============ JVM [85] ============
dict(cat=85, title="JVM 运行时数据区包括哪些部分？哪些是线程私有的？",
     body="请说明程序计数器、虚拟机栈、本地方法栈、堆、方法区的作用与线程归属，并说明各区域可能的异常。",
     diff="中级", years="1-3年", tags=["JVM","内存模型","运行时数据区"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""**线程私有**（随线程生灭）：
1. **程序计数器**：记录当前线程执行的字节码行号，线程切换后能恢复到正确位置；执行 native 方法时值为 undefined。**唯一不会 OOM 的区域**。
2. **虚拟机栈**：Java 方法执行的栈帧载体（局部变量表、操作数栈、动态链接、返回地址）。栈深度超限抛 `StackOverflowError`（典型：无限递归）；扩展失败抛 `OutOfMemoryError`。
3. **本地方法栈**：为 native 方法服务（HotSpot 与虚拟机栈合二为一）。

**线程共享**：
4. **堆**：对象实例的主要分配地，GC 的主战场，分新生代（Eden+2 Survivor）与老年代；空间不足抛 OOM。注意"所有对象都在堆上"不准确——逃逸分析后可能栈上分配/标量替换。
5. **方法区**（JDK 8+ 由**元空间 Metaspace** 实现，使用本地内存）：类元信息、运行时常量池。类加载过多会 OOM:Metaspace。
另外还有**直接内存**（NIO DirectBuffer 使用，不属于运行时数据区，但受机器内存限制，也可能 OOM）。"""),
dict(cat=85, title="如何判断对象可以被回收？哪些对象可以作为 GC Roots？",
     body="请对比引用计数法与可达性分析，并列举 GC Roots 的常见来源。",
     diff="中级", years="1-3年", tags=["JVM","GC","可达性分析"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""**引用计数法**：对象被引用+1、失效-1，为 0 即回收。实现简单，但**无法解决循环引用**（A↔B 互相引用但都不再使用），主流 JVM 不采用。

**可达性分析（JVM 实际采用）**：从 **GC Roots** 出发沿引用链遍历，**不可达**的对象即可回收。为修正"对象正在使用中却恰好无引用"的误判，还有**三次标记**机制（finalize 自救已被废弃，不必深究）。

**GC Roots 常见来源**：
1. 虚拟机栈（栈帧局部变量表）中引用的对象——正在执行的方法里的局部变量；
2. 方法区中**类的静态变量**引用的对象；
3. 方法区中**常量**引用的对象（如字符串常量池）；
4. JNI（native 方法）引用的对象；
5. JVM 内部引用：基本类型 Class 对象、常驻异常对象、系统类加载器等；
6. 所有**被 synchronized 持有的锁对象**；JMXBean、JVMTI 回调等。

**追问**：判断"无引用"不等于"立刻回收"——还要看引用类型（软/弱/虚）与 GC 类型。"""),
dict(cat=85, title="强引用、软引用、弱引用、虚引用有什么区别？",
     body="请说明四种引用类型的回收时机与典型应用场景。",
     diff="中级", years="1-3年", tags=["JVM","引用类型","GC"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""1. **强引用**（`Object o = new Object()`）：普通赋值。**只要强引用存在，GC 绝不回收**——哪怕 OOM 也不回收，宁可抛异常。内存泄漏多因"该断的强引用没断"（如静态 Map 一直往里塞）。
2. **软引用 SoftReference**：内存**不足时**才回收（GC 后内存仍不够则回收）。适合**内存敏感的缓存**——图片缓存、网页缓存；回收前会尽量保留，OOM 前的最后防线。
3. **弱引用 WeakReference**：下次 GC **必然回收**（无论内存是否充足）。典型：`ThreadLocalMap` 的 Entry 的 key 就是弱引用（线程存活时 key 可被回收防止泄漏，value 需手动 remove）；WeakHashMap。
4. **虚引用 PhantomReference**：**形同虚设**——get 永远返回 null，唯一作用是配合**引用队列（ReferenceQueue）**在对象被回收时收到通知，用于**管理堆外/直接内存**的释放（NIO 的 Cleaner 机制）。

**记忆**：强度递减——强（永不回收）> 软（内存不足回收）> 弱（GC 就回收）> 虚（只做回收通知）。"""),
dict(cat=85, title="常见的垃圾回收算法有哪些？各有什么优缺点？",
     body="请说明标记-清除、标记-复制、标记-整理三种算法的原理与取舍，以及分代收集的组合策略。",
     diff="中级", years="1-3年", tags=["JVM","GC算法","垃圾回收"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""1. **标记-清除**：先标记存活对象，再清除垃圾。缺点：①标记/清除效率都不高；②产生**内存碎片**——大对象放不下连续空间会提前触发 GC。CMS 的底层算法。
2. **标记-复制**：内存分两块，只用一块；GC 时把存活对象**整体复制**到另一块再一次性清空。优点：无碎片、分配快（指针碰撞）；缺点：**浪费一半空间**、存活对象多时复制开销大。适合**朝生夕死的新生代**（HotSpot 优化为 Eden:Survivor=8:1:1，只浪费 10%）。
3. **标记-整理**：标记后把存活对象**向一端移动**，再清理边界外内存。无碎片、不浪费空间，但移动对象要**停顿（STW）**并更新引用，成本高。适合**存活率高的老年代**。

**分代收集**：按对象寿命分代组合——新生代用复制算法（GC 频繁但快），老年代用标记-清除或标记-整理（GC 少但慢）。**没有万能算法，只有按对象存活特性的取舍**——这句话是标准答案的题眼。"""),
dict(cat=85, title="G1 垃圾收集器的工作原理与特点是什么？",
     body="请说明 G1 的 Region 划分、回收价值优先、Mixed GC 与停顿预测模型。",
     diff="高级", years="3-5年", tags=["JVM","G1","垃圾回收器"],
     pos=["Java后端工程师","后端架构师","系统运维工程师"],
     answer="""**定位**：JDK 9 起的默认收集器，面向**大堆（数 GB~数十 GB）+ 可预测停顿**，目标是在吞吐与延迟间取得平衡。

**核心设计**：
1. **Region 化布局**：堆划分为 2048 个左右等大 Region（1~32MB），每个 Region 动态扮演 Eden/Survivor/Old/Humongous（大对象）角色——**不再物理连续分代**，物理碎片化但逻辑分代。
2. **回收价值优先**：跟踪每个 Region 的回收价值（回收所得空间/所需时间），优先收集"垃圾最多"的 Region——这也是名字 **Garbage First** 的由来。
3. **停顿预测模型**：用户设定目标停顿（`-XX:MaxGCPauseMillis`，默认 200ms），G1 据此选择本轮收集哪些 Region，**宁可少收也不超时**。
4. **Mixed GC**：Young GC 正常发生；老年代占比超阈值（IHOP 默认 45%）启动并发标记，随后 Mixed GC 同时回收部分新生代+老年代 Region。
5. 记忆集（RSet）记录跨 Region 引用，避免全堆扫描；SATB 算法保证并发标记正确性。

**与 CMS 对比**：G1 整体标记整理（Region 间复制），**无内存碎片**；CMS 并发收集但有碎片和并发失败风险。JDK 14 已移除 CMS。"""),
dict(cat=85, title="线上服务 CPU 飙高如何排查？",
     body="请描述从进程定位到线程、再到具体代码行的完整排查步骤与常用命令。",
     diff="高级", years="3-5年", tags=["JVM","线上排查","CPU"],
     pos=["Java后端工程师","后端架构师","系统运维工程师"],
     answer="""**标准五步法**：
1. **定位高 CPU 的 Java 进程**：`top`（按 P 排序）找到进程 PID；
2. **定位进程内的高 CPU 线程**：`top -Hp <pid>` 显示该进程所有线程的 CPU 占用，记录线程 ID（十进制）；
3. **转换为十六进制**：`printf '%x' <tid>`——线程栈中 nid 是十六进制；
4. **导出线程栈并搜索**：`jstack <pid> | grep -A 30 <nid_hex>`，查看该线程正在执行的代码栈；
5. **分析根因**：
   - **业务线程**狂转 → 死循环、低效算法（如正则回溯灾难、大集合循环查询）；
   - **GC 线程**（GC Thread/GC task）占满 → 频繁 GC，转查内存：`jstat -gcutil <pid> 1000` 看各代占用与 GC 频率，`jmap -histo` 看对象直方图；
   - 大量线程在 RUNNING → 线程数失控/上下文切换过高（`vmstat` 看 cs 列）。

**注意事项**：连续多次抓栈（间隔 1~2s）对比，确认热点稳定在同一个位置；生产环境 `jmap -dump` 会 STW，先评估影响。jstack/jcmd 抓栈本身很轻，可放心用。"""),

# ============ Spring [81] ============
dict(cat=81, title="Spring IOC 和 AOP 的理解与实现原理？",
     body="请说明控制反转/依赖注入的设计思想与 Bean 生命周期，以及 AOP 动态代理的实现方式。",
     diff="中级", years="1-3年", tags=["Spring","IOC","AOP","动态代理"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""**IOC（控制反转）**：对象的创建与依赖关系的管理交给 Spring 容器，我们只**声明**需要什么（@Autowired），不用自己 new——控制权从程序员"反转"给了容器。好处：解耦（依赖面向接口）、便于单测（可注入 Mock）、统一管理生命周期。
**实现**：容器启动时扫描 BeanDefinition → 实例化 → **依赖注入**（反射按类型/名称装配）→ 初始化（Aware、BeanPostProcessor 前置、InitializingBean/@PostConstruct、后置）→ 使用 → 销毁回调。

**AOP（面向切面编程）**：把日志、事务、权限等**横切逻辑**从业务代码中抽离，通过动态代理织入目标方法前后。核心概念：切点 Pointcut（在哪里切）、通知 Advice（做什么：@Before/@After/@Around）、切面 Aspect。
**实现方式**：运行期动态代理——目标实现了接口用 **JDK 动态代理**（Proxy+InvocationHandler，基于反射实现接口）；无接口用 **CGLIB**（生成目标类的子类字节码，方法拦截）。Spring Boot 默认全用 CGLIB。
**注意**：自调用（同类内 this.method()）不走代理，@Transactional/@Async 失效的经典原因。"""),
dict(cat=81, title="Spring 是如何解决循环依赖的？三级缓存是什么？",
     body="请说明 A 依赖 B、B 又依赖 A 时 Spring 的处理流程，以及三级缓存各自的作用与无法解决的情况。",
     diff="高级", years="3-5年", tags=["Spring","循环依赖","三级缓存"],
     pos=["Java后端工程师","后端架构师","Java开发工程师"],
     answer="""**三级缓存**（DefaultSingletonBeanRegistry）：
1. 一级 `singletonObjects`：成品单例池；
2. 二级 `earlySingletonObjects`：**提前曝光**的半成品（已实例化未填充属性）；
3. 三级 `singletonFactories`：能产出半成品的**ObjectFactory**（含 SmartInstantiationAwareBeanPostProcessor，AOP 时提前生成代理）。

**流程（A↔B 循环）**：实例化 A（构造器跑完，属性未填）→ 把 A 的工厂放入三级缓存 → 填充属性发现依赖 B → 创建 B → B 填属性时需要 A → 从三级缓存拿到 A 的工厂，**提前得到 A 的引用**（若 A 需要 AOP，此处提前生成代理）放入二级缓存 → B 完成初始化进一级缓存 → 回头 A 注入 B，完成。

**为什么需要第三级而不是两级**：保证**正常情况下代理只在初始化后生成一次**；只有发生循环依赖时才提前生成代理，且确保全局只有一份代理。

**解决不了的循环依赖**：①**构造器注入**循环依赖（实例化阶段就卡死，Spring 直接报错）；②**prototype** 作用域（不使用缓存）；③Spring Boot 2.6+ **默认禁止**循环依赖（`spring.main.allow-circular-references=false`），鼓励通过重构（抽取中间类）消除设计坏味道。"""),
dict(cat=81, title="@Transactional 事务在哪些情况下会失效？",
     body="请列举自调用、方法非 public、异常被吞、传播行为设置错误等常见事务失效场景与原因。",
     diff="中级", years="1-3年", tags=["Spring","事务","Transactional"],
     pos=["Java开发工程师","Java后端工程师","后端架构师"],
     answer="""@Transactional 基于 **AOP 代理**实现，一切让"调用没经过代理"或"异常没被感知"的情况都会失效：

1. **同类自调用**：`this.update()` 内部调用带注解的方法——this 是原对象不是代理，事务不生效。**最高频事故**。解法：拆类、注入自身代理（AopContext.currentProxy()）。
2. **方法非 public**：代理只拦截 public 方法（CGLIB 也无法覆写 private/final）。
3. **异常被 try-catch 吞掉**：代理感知不到异常就不回滚。
4. **抛受检异常但没配置**：默认只对 RuntimeException 和 Error 回滚——`@Transactional(rollbackFor = Exception.class)` 是良好习惯。
5. **数据库引擎不支持事务**：MyISAM 无事务。
6. **传播行为配错**：NOT_SUPPORTED 会挂起事务、SUPPORTS 无事务时非事务运行。
7. **多线程**：事务绑定 ThreadLocal 连接，子线程的数据库操作不在同一事务内。
8. **类没被 Spring 管理**：没加 @Service 等，容器里根本没有代理对象。"""),

# ============ 消息队列 [126/127/128] ============
dict(cat=126, title="消息队列有什么作用？会带来哪些问题？",
     body="请说明消息队列的三大作用（异步、解耦、削峰）以及引入 MQ 后需要面对的一致性、可靠性问题。",
     diff="初级", years="0-1年", tags=["消息队列","架构","异步"],
     pos=["后端开发工程师","Java后端工程师","后端架构师"],
     answer="""**三大作用**：
1. **异步**：非核心链路（发短信、记积分）投递消息后立即返回，接口 RT 从串行累加变为主导步骤耗时；
2. **解耦**：生产者不关心谁消费，新增订阅方不用改生产者代码（下单事件：库存、物流、风控各自订阅）；
3. **削峰**：秒杀等瞬时流量先入队，消费端按自己的能力匀速处理，保护下游数据库。

**代价（面试要主动说出）**：
1. **系统复杂度上升**：要处理消息丢失、重复消费、顺序性等问题；
2. **一致性变弱**：异步意味着短暂不一致，需要最终一致性方案（本地消息表/事务消息）；
3. **可用性风险**：MQ 挂了影响主链路，需集群高可用与降级预案；
4. **运维成本**：堆积监控、扩容、版本升级。

选型：日志采集/大数据吞吐选 Kafka，金融级事务消息选 RocketMQ，轻量级/延迟队列场景选 RabbitMQ。"""),
dict(cat=127, title="Kafka 如何保证消息不丢失？",
     body="请分别从生产者、Broker、消费者三个环节说明 Kafka 的可靠性配置与机制。",
     diff="高级", years="3-5年", tags=["Kafka","消息不丢失","可靠性"],
     pos=["大数据开发工程师","后端架构师","Java后端工程师"],
     answer="""**丢消息只可能发生在三个环节，逐一设防**：

**生产者端**：
- `acks=all`（或 -1）：Leader 等所有 ISR 副本落盘才确认，不等就回是 -1 丢；
- `retries` 调大 + `enable.idempotence=true`（幂等，防重试导致的重复写入）；
- 发送失败回调里记录补偿（本地消息表/重试）。

**Broker 端**：
- `replication.factor ≥ 3`（多副本）；
- `min.insync.replicas ≥ 2`（至少 2 副本同步成功才算写入成功，与 acks=all 配合）；
- 禁用 unclean 选举：`unclean.leader.election.enable=false`——落后太多的副本不得当选 Leader，防止已确认消息被截断；
- 别用"单分区+单副本"图省事。

**消费者端**：
- **先处理业务，后提交位移**（手动提交 enable.auto.commit=false），避免"先提交后处理"宕机丢消息；
- 提交位移失败/异常时重试或投死信队列。

**代价**：可靠性拉满会牺牲吞吐与延迟（acks=all 更慢），按业务分级配置；同时 acks=all+幂等会有重复可能，消费端仍需**幂等**设计（唯一键/去重表）。"""),
dict(cat=128, title="RabbitMQ 如何实现延迟队列？死信队列是什么？",
     body="请说明基于 TTL+死信交换机（DLX）与延迟插件两种方案实现延迟消息，并解释死信进入交换机的条件。",
     diff="中级", years="1-3年", tags=["RabbitMQ","延迟队列","死信队列"],
     pos=["后端开发工程师","Java后端工程师","后端架构师"],
     answer="""**死信交换机 DLX**：消息变成"死信"后，被重新投递到绑定的死信交换机，路由到死信队列由消费者处理。成为死信的三个条件：①消息被**拒绝**（basic.reject/nack 且 requeue=false）；②消息 **TTL 过期**；③队列达到**最大长度**，队首消息被挤掉。

**方案一：TTL + DLX（经典组合，无需插件）**：
1. 建一个普通队列 A，**不设消费者**，设置消息 TTL=延迟时长，绑定死信交换机；
2. 消息投到 A，等 TTL 过期变成死信，流转到死信队列；
3. 消费者监听死信队列，此时消息已"延迟"到达。
缺点：**队头阻塞**——RabbitMQ 只检查队首消息，前面的 10 分钟消息没过期，后面的 1 分钟消息即使过期也出不来（不同延迟时长需多个队列）；配合"多级延迟队列"或改用插件。

**方案二：rabbitmq_delayed_message_exchange 插件**：声明 `x-delayed-message` 类型交换机，消息头带 `x-delay`，交换机内部定时投递——**精确到每条消息的延迟**，无队头阻塞，推荐。"""),
]
