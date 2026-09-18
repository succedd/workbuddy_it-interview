/* =========================================================================
 *  js/docs/java.js — 技术教程「Java 后端」方向数据（官方文档目录重构版）
 *
 *  章节骨架严格取自官方文档真实目录：
 *    · Oracle Java Tutorials / JLS / JVMS（docs.oracle.com）
 *    · HotSpot GC Tuning Guide / Troubleshooting Guide / JEP
 *    · Spring Framework Reference（Core / Data Access）/ Spring Boot Reference
 *    · Maven POM Reference / Gradle User Manual / Pro Git
 *    · MySQL 8.0 Reference Manual / redis.io / RabbitMQ & Kafka 官方文档
 *    · microservices.io / Resilience4j / Sentinel / Google SRE Book
 *  正文为 Markdown，复用站点 marked + highlight.js。
 *  正文里的代码围栏用 ${F}、行内代码用 ${C} 表示反引号，避免与外层模板字符串冲突。
 *  ⚠ shell 里的 ${C}VAR${C} 必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ${F}
  const C = "\u0060";               // 行内代码 ${C}

  const JAVA = {
    id: "java",
    name: "Java 后端",
    icon: "☕",
    desc: "从「能写出能跑的代码」到「能扛住高并发、定位线上疑难杂症、做架构取舍」的完整路径。按 Oracle JLS/JVMS、Spring 官方 Reference、MySQL 8.0 手册、redis.io、microservices.io、SRE Book 的目录体系展开。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "能独立完成需求开发与调试：写出正确代码、用好集合、看懂异常、会用构建工具和版本控制。",
        chapters: [
          {
            id: "syntax-collection",
            title: "Java 语法核心与集合框架",
            minutes: 18,
            updated: "2026-09-17",
            applies: "JDK 8 / 11 / 17 / 21",
            tags: ["Java", "集合", "JLS"],
            terms: ["Java", "集合", "HashMap", "equals", "JLS"],
            body: `
> **官方文档基线**：[Oracle Java Tutorials · Collections](https://docs.oracle.com/javase/tutorial/collections/) · [Java SE 21 API · java.util](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html) · [JLS §10 Arrays](https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html) · [JLS §11 Exceptions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)

## 一、原理与底层机制

Java 集合框架（Java Collections Framework，JCF）的设计哲学在官方 Tutorials 里被拆成三条主线：**接口（interfaces）、实现（implementations）、算法（algorithms）**。接口定义行为契约（如 ${C}List${C}/${C}Set${C}/${C}Map${C}），实现提供具体数据结构（如 ${C}ArrayList${C}/${C}HashSet${C}/${C}HashMap${C}），算法以「对接口编程」的静态方法形式存在（${C}Collections.sort${C}、${C}Collections.binarySearch${C}）。这套分层的价值是：写业务代码只依赖接口，换实现零成本——这是面试里「为什么用 ${C}List${C} 接收 ${C}ArrayList${C}」的根。

${C}equals${C}/${C}hashCode${C} 是后面所有坑的总根，必须从 JVM 与 JLS 两个视角理解。JLS §4.3.1 规定对象同一性由 ${C}==${C} 表达，而逻辑相等由 ${C}equals${C} 约定；${C}Object${C} 的 API 文档给 ${C}hashCode${C} 定了三条契约（背下来，面试和排查都靠它）：

1. 同一对象多次调用 ${C}hashCode${C} 必须返回相同值（前提是 ${C}equals${C} 比较所用的信息没变）；
2. ${C}equals${C} 相等的两个对象，${C}hashCode${C} **必须**相等；
3. ${C}hashCode${C} 相等，${C}equals${C} 不必相等（哈希冲突是允许的）。

违反契约 2 的直接后果：对象放进 ${C}HashMap${C} 后「找不到了」——因为查找时先按 hash 分桶，桶都对不上，${C}equals${C} 根本没机会执行。更底层一点：对象默认的 ${C}hashCode${C} 来自对象头里的 **identity hash code**（与内存地址相关，但经扰动），所以只要重写了 ${C}equals${C} 就必须重写 ${C}hashCode${C}，否则逻辑相等的对象会被当成两个桶里的不同实体。

HashMap 的哈希不是直接拿 key 的 hash 当下标，而是经过一次**扰动函数**（JDK 8 是 ${C}(h = key.hashCode()) ^ (h >>> 16)${C}，把高位也掺入低位）再与表长取模。为什么要扰动？因为下标只用到 hash 的低几位，如果 key 的 hash 高位变化大、低位雷同，就会全挤进少数桶。扰动让高位参与运算，分布更均匀。冲突解决官方选的是「数组 + 链表 + 红黑树」的拉链法变体（而非开放寻址），因为拉链法在删除、扩容时更简单，且链表转红黑树后能兜住极端哈希攻击。

## 二、规范与标准

JLS 与 API 文档对集合的规范是「契约优先」：

- ${C}Collection${C}/${C}Map${C} 接口的 API 文档首页列了**通用约定（general contracts）**，例如「本接口的实现是否支持某操作由具体实现决定，不支持时抛 ${C}UnsupportedOperationException${C}」——这正是 ${C}Arrays.asList()${C} 的 ${C}add${C} 会抛异常的依据，不是 bug，是规范。
- ${C}Iterator${C} 的 fail-fast 在 Javadoc 里被明确定义为**尽力而为（best-effort）**：*fail-fast behavior ... should be used only to detect bugs*。它**不能**作为并发正确性保证。实现靠一个 ${C}modCount${C} 计数器，迭代期间结构被修改就抛 ${C}ConcurrentModificationException${C}，但文档明确说「不保证一定抛出」。
- 不可变集合规范：${C}List.of${C}/${C}Set.of${C}/${C}Map.of${C}（Java 9+）返回**真·不可变**集合，任何写操作抛 ${C}UnsupportedOperationException${C}；且它们的 ${C}equals${C}/${C}hashCode${C} 严格按元素/键值对定义，可安全作为 Map 的 key。对比 ${C}Collections.unmodifiableList${C} 只是「视图不可改」，底层集合仍可被原引用改动——这是两者最常踩的坑。
- 排序接口 ${C}Comparable${C}/${C}Comparator${C} 的约定：${C}compareTo${C} 必须与 ${C}equals${C} 一致（${C}sgn(compareTo(y))==-sgn(compareTo(x))${C} 等三定律），否则放进 ${C}TreeSet${C}/${C}TreeMap${C} 会出现「逻辑相等却被当不同元素」。

## 三、实战

**正确实现契约**（只比业务主键，且 ${C}equals${C}/${C}hashCode${C} 字段完全一致）：

${F}java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User)) return false;   // 兼容子类，优于 getClass()
    User u = (User) o;
    return id != null && id.equals(u.id);       // 只比业务主键
}
@Override
public int hashCode() {
    return Objects.hash(id);                     // 字段必须与 equals 完全一致
}
${F}

**错误范式对照**：❌ 只重写 ${C}equals${C} 不重写 ${C}hashCode${C}（违反契约 2）；❌ 用可变字段参与 ${C}hashCode${C} 后修改该字段，对象在 ${C}HashSet${C} 里「丢失」（桶位算错）；❌ 在 for-each 里 ${C}list.remove()${C} 触发 fail-fast。✅ 正确删除：

${F}java
list.removeIf(x -> x.score < 60);                 // 推荐
for (Iterator<Item> it = list.iterator(); it.hasNext(); ) {
    if (it.next().isStale()) it.remove();         // 显式迭代器删除
}
${F}

**预扩容**：已知大小时用 ${C}new ArrayList<>(expectedSize)${C}，避免底层 ${C}Object[]${C} 多次 1.5 倍扩容拷贝。流式分组一行顶十行：

${F}java
Map<String, List<Order>> byUser = orders.stream()
    .collect(Collectors.groupingBy(Order::getUserId));
${F}

## 四、覆盖广度

**选型决策表（官方 Implementations 页的决策版）**：

| 场景 | 选 | 为什么 |
| --- | --- | --- |
| 按键查值 | ${C}HashMap${C} | 平均 O(1)，默认答案 |
| 需要按 key 排序遍历 | ${C}TreeMap${C} | 红黑树，O(log n)，支持范围查询 |
| 需要插入顺序 | ${C}LinkedHashMap${C} | 额外链表维护顺序；也可做 LRU |
| 去重 | ${C}HashSet${C} / ${C}LinkedHashSet${C} | 元素需正确实现 equals/hashCode |
| 频繁头部操作 / 当栈 | ${C}ArrayDeque${C} | 官方明确推荐优先于 Stack（Stack 继承 Vector 是历史设计错误） |
| 多线程 map | ${C}ConcurrentHashMap${C} | CAS + 锁单桶头节点，读无锁 |
| 只读共享 | ${C}List.of(...)${C}（Java 9+） | 不可变，天然线程安全 |

**边界与进阶**：① 并发容器还有 ${C}CopyOnWriteArrayList${C}（读多写少、遍历期间允许写）、${C}ConcurrentSkipListMap${C}（并发有序）；② 海量原始类型用 Eclipse Collections / fastutil 的 primitive 集合，避免 ${C}Integer${C} 装箱的对象头开销（每个对象 12–16 字节头 + 4 字节值 + 对齐，比原生 int 数组胖一个数量级）；③ ${C}EnumMap${C}/${C}EnumSet${C} 用位数组/数组实现，极省内存且极快；④ ${C}BitSet${C} 做布尔标记比 ${C}boolean[]${C} 省 8 倍内存；⑤ ${C}LinkedHashMap${C} 重写 ${C}removeEldestEntry${C} 即可做 LRU 缓存；⑥ ${C}Collections${C} 工具类的 ${C}unmodifiable${C}/${C}synchronized${C}/${C}checked${C} 包装各有边界，包装后的同步集合迭代仍需手动加锁。

## 五、常见误区

1. **重写 ${C}equals${C} 不重写 ${C}hashCode${C}**：违反契约 2，HashSet/HashMap 行为未定义，是最经典的「偶发 bug」。
2. **用可变字段参与 ${C}hashCode${C}**：对象进集合后改字段，再 ${C}get${C} 找不到——桶位算错。
3. **在 for-each 里 ${C}list.remove()${C}**：触发 fail-fast；且 fail-fast 本身不可依赖（文档原话）。
4. **${C}Arrays.asList()${C} 当普通 List 用**：返回固定大小视图，${C}add/remove${C} 抛 ${C}UnsupportedOperationException${C}；底层还是原数组，改它改到源数组。
5. **拿 ${C}Stack${C} 当栈**：官方建议用 ${C}Deque${C} 代替（Stack 继承 Vector，同步且设计过时）。
6. **TreeMap 的 comparator 与 equals 不一致**：${C}compare${C} 返回 0 时元素被视为「同一个 key」，逻辑不同却相等的对象被覆盖。
7. **把 ${C}Collections.unmodifiableList${C} 当不可变**：底层集合仍可被原引用改动，防御性拷贝要 ${C}new ArrayList<>(src)${C}。
8. **parallel stream 里改外部状态**：非线程安全的 collector 直接数据错乱。

## 六、自检清单

- [ ] 能默写 ${C}hashCode${C} 三条契约，并解释违反契约 2 的后果与对象头 identity hash code 的关系
- [ ] 能画出 HashMap 结构，说清扰动函数、树化条件（8 / 64）与负载因子 0.75 的出处
- [ ] 知道 fail-fast 的官方定位是「探测 bug，非并发保证」，并发场景选对容器
- [ ] 能一眼判断业务场景该用哪种 Map/List/Set，并说清 ${C}List.of${C} 与 ${C}Arrays.asList${C} 的区别
- [ ] 重写 ${C}equals${C}/${C}hashCode${C} 时字段集合一致，且用不可变字段

## 七、延伸

- Java Tutorials · Collections trail（Interfaces / Implementations / Algorithms 三章）
- ${C}java.util${C} 包 API 文档首页：各接口的「通用约定」都写在这里
- Effective Java（第 3 版）Item 10–13、Item 45–48
- OpenJDK 源码 ${C}java.util.HashMap${C}：注释本身就是一篇设计文档
          `
          },
          {
            id: "exception-log",
            title: "异常与日志规范",
            minutes: 16,
            updated: "2026-09-17",
            applies: "JDK 8+ / SLF4J 2.x / Logback 1.4+",
            tags: ["Java", "异常", "日志"],
            terms: ["Java", "异常", "SLF4J", "Logback", "MDC"],
            body: `
> **官方文档基线**：[Java Tutorials · Exceptions](https://docs.oracle.com/javase/tutorial/essential/exceptions/) · [JLS §11 Exceptions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html) · [SLF4J Manual](https://www.slf4j.org/manual.html) · [Logback Manual](https://logback.qos.ch/manual/)

## 一、原理与底层机制

异常和日志是同一件事的两面：**异常决定程序怎么失败，日志决定人怎么理解失败**。线上排障 80% 的时间花在后者。JLS §11 把异常定义为「对方法正常返回路径的中断」——它是一条与返回值并列的控制流通道，由 JVM 的异常表（exception table）在字节码层实现：每个 ${C}try${C} 块在 class 文件里对应一张「范围 + 目标 handler + 捕获类型」的表，抛出时 JVM 线性匹配，匹配不到就沿调用栈向上展开（stack unwinding），每展开一层就执行相应的 ${C}finally${C}。理解这点就能明白：异常远不止 ${C}if/else${C}，它要填栈、要展开、要构造 ${C}StackTraceElement[]${C} 数组——这就是「异常贵」的硬件真相。

${C}Throwable${C} 的继承树是分层设计：

${F}
Throwable
├── Error              // JVM 级致命：OutOfMemoryError, StackOverflowError —— 不应捕获
└── Exception
    ├── RuntimeException  // unchecked：NPE, ISE, IndexOutOfBounds ...
    └── 其他              // checked：IOException, SQLException ...
${F}

${C}Error${C} 代表 JVM 自身出问题（如 ${C}OutOfMemoryError${C}），按规范**不应也不该**捕获；${C}RuntimeException${C} 代表程序缺陷（NPE、数组越界），属于 unchecked；其余 ${C}Exception${C} 是 checked，编译器强制你处理或声明。三者分工：Error 是「环境崩了」，RuntimeException 是「你代码写错」，checked 是「外部环境不可控但可恢复」。

## 二、规范与标准

checked 异常的设计意图是「**可恢复的、调用方必须面对的**」失败（Tutorials 原话：*recoverable conditions*）。JLS 规定 checked 异常必须被 ${C}catch${C} 或 ${C}throws${C} 声明，unchecked 则不强制。工程共识与规范之间的关系：

- **对外/跨层 API** 尽量抛 unchecked（自定义业务异常继承 ${C}RuntimeException${C}），避免 ${C}throws${C} 签名污染每一层；这是 Spring 等框架的官方推荐做法。
- **资源获取失败（IO/网络）**通常包装成业务异常再抛，不要让底层 ${C}SQLException${C} 直接穿透到 Controller。
- **绝不用异常做流程控制**：抛出并填充栈的成本远高于普通分支——JLS 把异常定义为「非正常路径」，JIT 也不会对异常路径做和正常分支同等的优化。

SLF4J 与 Logback 的规范：SLF4J 是门面（facade），Logback 是实现，两者通过 ${C}StaticLoggerBinder${C} 桥接；日志级别（TRACE < DEBUG < INFO < WARN < ERROR）语义由 Logback 官方定义，不是约定俗成。

## 三、实战

**try-with-resources：资源关闭的唯一正解**（JDK 7+，实现 ${C}AutoCloseable${C}，异常不会被吞）：

${F}java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(target)) {
    in.transferTo(out);
}
// 关闭顺序与声明相反；若 try 体和 close 都抛异常，
// close 的异常以 suppressed 挂在主异常上，一条不丢
${F}

对比手写 ${C}finally${C}：老代码在 ${C}finally${C} 里再抛异常会**覆盖**主异常，这是无数「日志里看不到真正原因」的根源。try-with-resources 把 close 异常挂到主异常的 ${C}getSuppressed()${C}，根因与清理异常都不丢。

**三条纪律**：① 包装必传 ${C}cause${C}——${C}throw new ServiceException("下单失败", e)${C}，丢了 cause 根因就断；② 消息给「现场」不给「结论」，${C}"order not found, id=" + id${C} 而非 ${C}"error"${C}，且不要把手机号/token 拼进消息；③ 同一异常只在一层处理。

**日志正确写法**：

${F}java
log.debug("user {} order {} total {}", userId, orderId, total);  // ✅ 占位符惰性求值
if (log.isDebugEnabled()) { /* 仅当还要做昂贵计算时才用 */ }
MDC.put("traceId", traceId);          // 入口处
try { log.info("order created"); }     // pattern 里 %X{traceId} 自动带出
finally { MDC.clear(); }              // 线程池复用，必须清理
log.error("handle order failed, id={}", orderId, e);   // ✅ 异常对象作最后参数，完整堆栈
${F}

## 四、覆盖广度

**级别语义决策表（Logback 官方定义）**：

| 级别 | 用途 | 判断标准 |
| --- | --- | --- |
| ERROR | 需要人立刻介入 | 线上 ERROR 告警必须有响应路径 |
| WARN | 自动恢复过/可降级 | 出现频率上升就是前兆指标 |
| INFO | 关键业务节点 | 一次请求 1–3 条封顶 |
| DEBUG | 排查细节 | 仅排障期开启 |

**边界与进阶**：① MDC 必须「有 put 必有 clear」，否则线程池复用会把上一个请求的 traceId 带到下一个请求；② 异常日志的唯一正确姿势是把异常对象作为最后一个参数，而不是拼 ${C}e.getMessage()${C}；③ 异步 Appender（${C}AsyncAppender${C}）能把日志 IO 从请求线程摘出去，但队列满时可能丢日志，要配 ${C}discardingThreshold${C}；④ 结构化日志（JSON + ${C}logstash-logback-encoder${C}）比文本更利于 ES 检索；⑤ 集中式采集（ELK / Loki）要做采样，全量在高 QPS 下会打爆带宽。

## 五、常见误区

1. **catch 后什么都不做**（空 catch / ${C}catch (Exception ignored)${C}）：bug 消失术，排障时连自己都骗。
2. **${C}catch (Exception e)${C} 兜一切**：连 ${C}InterruptedException${C} 都吞——正确做法是恢复中断标志 ${C}Thread.currentThread().interrupt()${C}。
3. **在循环里打 INFO**：压测时日志 IO 直接把服务打垮，写放大比 SQL 还猛。
4. **日志打印大对象**：对 DTO 不重写 ${C}toString${C} 就打印，会拖出全量字段（可能含密码）；Lombok ${C}@Data${C} + ${C}@Slf4j${C} 组合尤其要注意。
5. **用 System.out/err**：绕过级别控制与文件轮转，容器场景下还阻塞 stdout。
6. **异常用于业务分支**（如用 ${C}NumberFormatException${C} 判断是否数字）：性能差且语义混乱，该用正则或解析 API。
7. **finally 里再抛异常覆盖主异常**：用 try-with-resources 替代。

## 六、自检清单

- [ ] 所有资源都是 try-with-resources，全库 0 个手写 finally-close
- [ ] 包装异常必带 cause，抽查 10 条历史异常日志能看到根因
- [ ] ERROR 级别数量可控（每分钟个位数），且有告警订阅
- [ ] MDC 有 put 必有 clear，traceId 能贯穿一个请求的所有日志
- [ ] 代码里 grep 不到 ${C}printStackTrace${C} 和 ${C}System.out.println${C}
- [ ] catch ${C}InterruptedException${C} 的地方都恢复了中断标志

## 七、延伸

- Java Tutorials · Exceptions trail（What's an Exception / How to Throw / try-with-resources）
- JLS §11：编译器对异常传播的精确规定
- SLF4J User Manual、Logback Manual（Architecture / MDC / Appenders 章节）
- Effective Java Item 69–77（异常使用的所有细节）
          `
          },
          {
            id: "build-tool",
            title: "Maven / Gradle 与项目结构",
            minutes: 15,
            updated: "2026-09-17",
            applies: "Maven 3.9+ / Gradle 8+",
            tags: ["Maven", "Gradle", "工程化"],
            terms: ["Maven", "Gradle", "BOM", "依赖管理"],
            body: `
> **官方文档基线**：[Maven · Introduction to the POM](https://maven.apache.org/guides/introduction/introduction-to-the-pom.html) · [Maven · Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html) · [Maven · Build Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html) · [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html)

## 一、原理与底层机制

构建工具问题的本质是**依赖管理**：版本从哪来、冲突怎么裁决、传递依赖怎么控制。Maven 与 Gradle 只是用不同模型回答这三个问题。Maven 的模型是「**声明式 POM + 三段生命周期**」：你描述「要什么」，Maven 按固定流水线把「编译→测试→打包」串起来；Gradle 的模型是「**task 依赖图（DAG）+ 编程能力**」：构建脚本本身是 Groovy/Kotlin 程序，task 之间显式声明依赖，Gradle 据此做增量构建与 build cache。理解这个根本差异，就能解释为什么 Maven 配置简单但扩展死板，Gradle 灵活但学习曲线陡。

Maven 坐标 ${C}groupId:artifactId:version${C} 是仓库世界的唯一地址。版本解析不是「取最新」，而是按依赖树位置裁决（见第二节）。Gradle 的 configuration 则把「编译 classpath」「运行 classpath」建模成可组合的容器，比 Maven 的 scope 粒度的概念更灵活。

## 二、规范与标准

**Maven 依赖范围（scope）的官方语义**（编译期/运行期/传递三维度）：

| scope | 编译期 | 运行期 | 传递给下游 | 典型 |
| --- | --- | --- | --- | --- |
| compile | ✓ | ✓ | ✓ | 业务依赖（默认） |
| provided | ✓ | ✗ | ✗ | Lombok、Servlet API |
| runtime | ✗ | ✓ | ✓ | JDBC 驱动 |
| test | 测试期 | 测试期 | ✗ | JUnit |
| import | 仅 ${C}dependencyManagement${C} | — | — | 导入 BOM |

**传递依赖的冲突仲裁**：官方规则 **nearest wins（最近者胜）**——依赖树里路径最短的版本赢；路径等长时**先声明的赢**。这不是「最新版赢」，所以同一库的不同版本可能同时存在于树的不同分支（不同路径各自裁决）。

**生命周期**：Maven 有三套互不交叉的生命周期（clean / default / site），default 里最常用的是 ${C}validate → compile → test → package → verify → install → deploy${C}；阶段**有序且连带**，执行 ${C}mvn verify${C} 会先跑完前面所有阶段，插件 goal 通过 phase 绑定进生命周期。

## 三、实战

**版本统一的三件套（错误 vs 正确）**：

❌ 子模块里到处写死 ${C}<version>3.3.4</version>${C}，升级时漏改导致同一库多版本。✅ 用 BOM 集中管理：

${F}xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>3.3.4</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
${F}

**冲突定位**：永远从 ${C}mvn dependency:tree -Dincludes=com.google.guava${C} 开始，看「谁把哪个版本带进来」，再决定用 ${C}<exclusions>${C} 还是 ${C}dependencyManagement${C} 锁定。Gradle 对等命令是 ${C}./gradlew dependencies --configuration compileClasspath${C}。

**Wrapper 保证一致性**：

${F}bash
gradle wrapper --gradle-version 8.10     # 生成 gradlew + gradle-wrapper.properties
mvn -N io.takari:maven:wrapper           # Maven 对应 mvnw
${F}

## 四、覆盖广度

**多模块布局（官方推荐）**：

${F}
my-app/
├── pom.xml                    # 父 POM：dependencyManagement + 插件统一
├── my-app-common/             # 纯领域对象与工具，无框架依赖
├── my-app-dao/                # 数据访问
├── my-app-service/            # 业务逻辑
└── my-app-web/                # 入口（可执行 jar），依赖上面所有模块
${F}

原则：**依赖只能自上而下、禁止成环**；入口模块独立出来，打包产物与业务模块解耦。边界与进阶：① Gradle 的 ${C}platform()${C} / ${C}enforcedPlatform()${C} 对应 Maven 的 BOM 与强制版本；② ${C}dependency constraints${C} 可在不引入依赖的前提下钉死版本；③ 发布用 ${C}mvn deploy${C} 到 Nexus/Artifactory，禁止把 jar 手动拷进 ${C}lib/${C}（脱离依赖管理，安全扫描失效）；④ Gradle 的 configuration cache 能把配置阶段也缓存，二次构建秒级；⑤ 构建性能瓶颈多在测试与注解处理器，可用 ${C}build scan${C} 可视化分析。

## 五、常见误区

1. **SNAPSHOT 上生产**：SNAPSHOT 每次解析都可能变，构建不可重现；发布一律用 release 版。
2. **冲突解决靠本地试**：不跑 ${C}dependency:tree${C} 直接改版本，改完 A 冲突挪到 B。
3. **把依赖 jar 手动拷进 lib/ 目录**：脱离依赖管理，升级与安全扫描全部失效。
4. **父 POM 里 ${C}<dependencies>${C} 与 ${C}<dependencyManagement>${C} 混用**：前者让**所有**子模块无条件继承依赖，版本失控。
5. **Gradle 脚本里硬编码本地路径**：一进 CI 就炸。
6. **不看 Wrapper 版本**：本机 3.9、CI 3.6，行为差异排查半天。
7. **用 ${C}compile${C} 装 JDBC 驱动**：应为 ${C}runtime${C}，否则编译期耦合具体驱动。

## 六、自检清单

- [ ] 说得清 nearest wins 与「先声明者胜」两条仲裁规则
- [ ] 第三方全家桶一律通过 BOM/平台导入，项目中无散落硬编码版本
- [ ] 会用 ${C}mvn dependency:tree${C} / ${C}gradle dependencies${C} 定位依赖来源
- [ ] mvnw / gradlew 已提交，CI 与本地版本一致
- [ ] 生产依赖 0 个 SNAPSHOT，版本号符合 SemVer

<!--dd:build-tool-->

## 🔬 深挖：构建工具的依赖解析与增量机制

### 一、Maven 的三大生命周期与「命令行不能跳阶段」

Maven 有三套独立生命周期：**clean**（pre-clean→clean→post-clean）、**default**（validate→compile→test→package→verify→install→deploy）、**site**。执行 ${C}mvn package${C} 时，会**按顺序跑完它前面所有阶段**（validate→compile→test→package），这也是「执行 package 却触发了测试」的原因。

跳过测试的正确姿势：
${F}bash
mvn package -DskipTests          # 编译测试代码但不执行
mvn package -Dmaven.test.skip=true   # 连测试代码都不编译（更快，但可能漏编译错误）
${F}

### 二、依赖调解：Maven 的两条铁律

当多个路径引入同一个构件的不同版本，Maven 按两条规则裁决——**顺序不可颠倒**：

1. **最短路径优先**：A → B → C(1.0) 与 A → D(2.0)，选 D 的 2.0（路径更短）；
2. **同深度看声明顺序**：路径长度相同时，取 ${C}<dependencies>${C} 里**先声明**的那个。

这正是「明明没改代码，升级一个依赖后线上报 NoSuchMethodError」的根因。定位命令：

${F}bash
mvn dependency:tree -Dverbose -Dincludes=com.google.guava:guava
# -Dverbose 会打印被 omitted 的版本（for duplicate / for conflict），这是关键
${F}

**${C}dependencyManagement${C} 与 ${C}dependencies${C} 的区别**（面试高频）：

| 位置 | 作用 | 是否真正引入 |
|---|---|---|
| ${C}<dependencies>${C} | 直接引入依赖 | 是 |
| ${C}<dependencyManagement>${C} | 只统一版本号，子模块引用时生效 | 否 |

所以在父 POM 里用 ${C}dependencyManagement${C} 锁版本、子模块写 ${C}<dependency>${C} 不写 ${C}<version>${C}，是最推荐的工程实践——**版本只有一个真相来源**。

### 三、scope 的真实语义

| scope | 编译期 | 测试期 | 运行期 | 打包进产物 | 典型用途 |
|---|---|---|---|---|---|
| compile（默认） | ✅ | ✅ | ✅ | ✅ | 业务依赖 |
| provided | ✅ | ✅ | ❌ | ❌ | servlet-api（容器提供） |
| runtime | ❌ | ✅ | ✅ | ✅ | JDBC 驱动 |
| test | ❌ | ✅ | ❌ | ❌ | JUnit |
| system | ✅ | ✅ | ❌ | ❌ | 本地 jar（应避免） |
| import | —— | —— | —— | —— | 仅用于 ${C}dependencyManagement${C} 导入 BOM |

**易错点**：Lombok 用 ${C}provided${C}（其实更推荐 ${C}annotationProcessorPaths${C} 显式声明，避免打进产物）；${C}spring-boot-starter-web${C} 已传递 Tomcat，若用 ${C}provided${C} 覆盖要小心。

### 四、Gradle 的增量构建与构建缓存

Gradle 快的核心不是语言（Kotlin DSL），而是**任务级增量**：

${F}
inputs 未变（源文件哈希 + 类路径 + 参数）
  ├─ 命中本地增量 → 跳过任务（UP-TO-DATE）
  └─ 未命中 → 查构建缓存（--build-cache，本地或远端）
      └─ 命中 → 直接取产物（FROM-CACHE）
${F}

三个关键命令：

${F}bash
./gradlew build --build-cache        # 开启构建缓存
./gradlew build --scan               # 生成构建分析报告（耗时分布）
./gradlew dependencies --configuration runtimeClasspath  # 看依赖树
${F}

**Gradle 依赖冲突默认策略与 Maven 相反**：Gradle 默认取**最高版本**（不是最近路径），这常导致「本地好的，CI 上坏」。统一版本的正确工具是 ${C}platform${C}/${C}enforcedPlatform${C}（对齐 Maven 的 BOM）与 ${C}constraints${C}；排查用 ${C}resolutionStrategy.failOnVersionConflict()${C} 让冲突构建失败，而不是静默选一个。

### 五、构建可复现的清单

- 锁文件入库（Gradle）或 ${C}mvn versions:lock-snapshots${C} / 禁用 SNAPSHOT 依赖；
- ${C}mvn -o${C}（离线）在 CI 上验证「依赖真的全在私服」；
- 固定 JDK 版本（${C}maven.compiler.release${C} / Gradle toolchain），否则「本机 JDK17 编译、线上 JDK11 跑」；
- 关闭时间戳导致的不可复现：${C}<project.build.outputTimestamp>${C}，让同一份源码产出字节一致的 jar。

## 七、延伸

- Maven: Introduction to the POM / Dependency Mechanism / Build Lifecycle
- Gradle User Manual: Dependency Management / Authoring Tasks / The Build Environment
- SemVer 2.0.0：版本号语义是依赖管理的通用语言
          `
          },
          {
            id: "mysql-basic",
            title: "MySQL 基础与 SQL 编写",
            minutes: 17,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / 8.4 LTS",
            tags: ["MySQL", "SQL", "InnoDB"],
            terms: ["MySQL", "InnoDB", "SQL", "事务"],
            body: `
> **官方文档基线**：[MySQL 8.0 · Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html) · [MySQL 8.0 · SQL Syntax](https://dev.mysql.com/doc/refman/8.0/en/sql-statements.html) · [MySQL 8.0 · InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html) · [MySQL 8.0 · Transaction Isolation](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html)

## 一、原理与底层机制

新手与老手写 SQL 的差距不在「会多少语法」，而在**类型、NULL 语义、JOIN 语义**这三个基本功上。MySQL 是行存 + 聚簇索引（InnoDB）的架构：一行数据按主键物理有序存放，二级索引叶子存「索引列 + 主键」。理解「主键即数据、二级索引要回表」是理解一切索引优化的前提。事务靠 InnoDB 的 redo log（持久性）、undo log（回滚与 MVCC）、buffer pool（内存缓存）三者协作实现 ACID；隔离级别靠 MVCC 读视图 + 间隙锁实现。写 SQL 时脑子里的模型应该是「这行数据在哪个页、要走哪个索引、会不会回表、会不会加锁」。

## 二、规范与标准

**类型选择（Ch.11 的决策版）**：

| 业务 | 推荐 | 理由 |
| --- | --- | --- |
| 主键/计数 | ${C}BIGINT UNSIGNED${C} | 自增上限焦虑一次解决 |
| 金额 | ${C}DECIMAL(18,4)${C} | 精确小数；float/double 有舍入误差，**禁止**存钱 |
| 短文本 | ${C}VARCHAR(n)${C} | 行内存储，可设默认值 |
| 大文本 | ${C}TEXT${C}（并考虑拆表） | 行外存储，影响缓冲效率 |
| 时间 | ${C}DATETIME${C} 或 ${C}TIMESTAMP${C} | TIMESTAMP 带时区转换但上限 2038；一般业务用 DATETIME 更稳 |
| 状态 | ${C}TINYINT${C} + 字典表 | 别用 VARCHAR 存枚举字面量 |
| JSON | ${C}JSON${C} | 官方类型有校验与部分更新；查询频繁的字段请升为列 |

**NULL 语义**是三值逻辑（TRUE / FALSE / UNKNOWN）：${C}NULL = NULL${C} 结果是 UNKNOWN 而非 TRUE，判空只能用 ${C}IS NULL${C}；${C}NOT IN${C} 子查询里出现 NULL 时整个条件恒为 UNKNOWN——这是「为什么 NOT IN 查不出数据」的官方答案。

## 三、实战

**JOIN 语义（错误 vs 正确）**：LEFT JOIN 时过滤右表的条件必须写进 ON，写进 WHERE 会把 LEFT 退化成 INNER：

${F}sql
-- ✅ 左表全保留，右侧仅取 status=1 的匹配
SELECT o.id, p.amount
FROM orders o LEFT JOIN payments p ON p.order_id = o.id AND p.status = 1;

-- ❌ WHERE p.status=1 把 p 全为 NULL 的左表行过滤掉了
SELECT o.id, p.amount
FROM orders o LEFT JOIN payments p ON p.order_id = o.id
WHERE p.status = 1;
${F}

**深分页改写**：${C}LIMIT 1000000, 20${C} 要扫 100 万行再丢弃，改成游标：

${F}sql
SELECT * FROM orders WHERE id > :lastId ORDER BY id LIMIT 20;
${F}

**典型统计（覆盖索引 + 范围条件）**：

${F}sql
SELECT DATE(create_time) AS d, COUNT(*) AS cnt, SUM(amount) AS amt
FROM orders
WHERE create_time >= '2026-09-01' AND create_time < '2026-10-01'
  AND status = 1
GROUP BY DATE(create_time)
ORDER BY d;
${F}

## 四、覆盖广度

**事务与隔离级别（Ch.15 InnoDB + 官方隔离表）**：InnoDB 默认 **REPEATABLE READ**（多数数据库默认 READ COMMITTED，别记混）。

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| READ UNCOMMITTED | 会发生 | 会发生 | 会发生 |
| READ COMMITTED | 防住 | 会发生 | 会发生 |
| REPEATABLE READ（默认） | 防住 | 防住 | InnoDB 基本防住（MVCC+间隙锁） |
| SERIALIZABLE | 防住 | 防住 | 防住（代价是并发骤降） |

**写好查询的硬规范**：① 不写 ${C}SELECT *${C}（破坏覆盖索引、浪费传输）；② 索引列不做函数/运算，${C}WHERE DATE(create_time)=...${C} 让索引失效；③ 分页用游标；④ ${C}COUNT(*)${C} 与 ${C}COUNT(col)${C} 语义不同（前者数行含 NULL，后者数非 NULL）；⑤ 批量插入合并 ${C}INSERT ... VALUES (...),(...)${C}；⑥ 隐式类型转换是坑，${C}WHERE phone = 13800001111${C} 对 VARCHAR 列放弃索引。事务三纪律：**短**（不裹远程调用）、**小**（影响行数可控）、**明确**（显式 ${C}BEGIN${C}/${C}COMMIT${C}）。

## 五、常见误区

1. **用 float/double 存金额**：舍入误差在累加时爆发。
2. **WHERE 里对索引列套函数**：索引直接失效。
3. **LEFT JOIN 后在 WHERE 过滤右表**：悄悄变 INNER JOIN。
4. **不用事务包裹多表写**：进程崩了就出现半成品数据。
5. **TEXT 大字段和业务列混在一张热表**：缓冲池被大字段挤占，整体性能劣化。
6. **在生产直接跑无 LIMIT 的 UPDATE/DELETE**：先 ${C}SELECT${C} 确认影响面，再改写为 DML。
7. **以为 ${C}COUNT(*)${C} 慢而用 ${C}COUNT(1)${C}**：现代 InnoDB 两者基本等价，差异在语义不在性能。

## 六、自检清单

- [ ] 金额一律 DECIMAL，时间字段统一时区口径
- [ ] 能口头解释 NULL 的三值逻辑与 NOT IN 遇 NULL 的行为
- [ ] LEFT JOIN 的过滤条件写在 ON 里而不是 WHERE
- [ ] 知道当前库的隔离级别，并说得出它的并发异常面
- [ ] 所有 UPDATE/DELETE 都带精确 WHERE 且先验证影响行数

<!--dd:mysql-basic-->

## 🔬 深挖：InnoDB 的物理结构与 MVCC

### 一、页：InnoDB 的最小 IO 单位

InnoDB 以 **16KB 页**为基本单位（${C}innodb_page_size${C} 可设 4/8/16/32/64KB，建库后不可改）。一个索引页的内部布局：

${F}
┌────────────────────────────────────────────┐
│ File Header（38B：页号、前后页指针、LSN）      │
│ Page Header（56B：记录数、堆顶、槽数…）        │
│ Infimum + Supremum 两条虚拟记录               │
│ User Records（按主键有序的单向链表）           │
│ Free Space                                   │
│ Page Directory（稀疏目录：每 4~8 条一个槽）     │
│ File Trailer（8B：校验和，防半写）             │
└────────────────────────────────────────────┘
${F}

关键点：**页内是链表 + 稀疏目录**，所以页内查找是「目录二分 + 链内遍历」；**页间是双向链表**，层级之间是 B+ 树。**三层 B+ 树能存约 2000 万行**（16KB 页 / 约 1KB 行 → 每页 16 行？不对——非叶子节点只存键+指针，可容纳约 1170 个指针，1170 × 1170 × 16 ≈ 2190 万），这就是「一亿行数据 3 次 IO 定位」的来源。

### 二、聚簇索引与二级索引的代价

- **聚簇索引（主键索引）**：叶子节点直接存**整行数据**。所以「主键不宜过大」——每个二级索引的叶子都要存主键值；「主键不宜随机」——随机主键（UUID）导致页分裂与碎片。
- **二级索引**：叶子存「索引列 + 主键值」。查非索引列需要**回表**：二级索引找到主键 → 再去聚簇索引查一次。一次查询两次 B+ 树下降，这是「覆盖索引能显著提速」的原因。

${F}sql
-- 回表 2 次：先走 idx_name 拿到主键，再回聚簇索引取 age/addr
SELECT age, addr FROM user WHERE name = 'tom';

-- 覆盖索引：把要查的列加进联合索引，Extra 显示 Using index，零回表
ALTER TABLE user ADD INDEX idx_name_age_addr (name, age, addr);
SELECT age, addr FROM user WHERE name = 'tom';   -- Using index
${F}

### 三、MVCC：版本链 + ReadView

InnoDB 每行有**隐藏列**：${C}DB_TRX_ID${C}（最后修改它的事务 ID）、${C}DB_ROLL_PTR${C}（指向 undo log 的版本链）、${C}DB_ROW_ID${C}（无主键时才用）。

读操作按可见性规则遍历版本链：

${F}
当前行（trx_id=100） → undo: 上一版本（trx_id=90） → undo: 更早（trx_id=80）
ReadView = { m_ids（活跃事务集合）, min_trx_id, max_trx_id, creator_trx_id }
对于每个版本：
  trx_id < min_trx_id     → 已提交，可见
  trx_id >= max_trx_id    → 在我之后才开始，不可见
  trx_id ∈ m_ids          → 仍活跃，不可见
  trx_id == creator_trx_id→ 我自己改的，可见
${F}

**RR 与 RC 的唯一区别**：ReadView 的生成时机。RC **每次 SELECT 都重新生成**（所以能看到别人刚提交的）；RR **只在第一次 SELECT 时生成并复用**（所以整个事务看到同一快照）。这也解释了「RR 下无法读到别人已提交的新数据」——是快照读，不是锁。

⚠️ RR 并不能完全避免幻读：**当前读**（${C}SELECT ... FOR UPDATE${C}、${C}UPDATE${C}、${C}DELETE${C}）会读最新版本并用**间隙锁**防止插入，这是 InnoDB 用锁补齐快照读缺口的设计。

### 四、锁家族与死锁

| 锁 | 加在哪里 | 何时触发 |
|---|---|---|
| 记录锁 Record Lock | 单条索引记录 | ${C}WHERE id = 1 FOR UPDATE${C} |
| 间隙锁 Gap Lock | 两条记录之间的空隙 | RR 下范围查询（防插入） |
| 临键锁 Next-Key | 记录 + 前面的间隙 | RR 默认行为（左开右闭） |
| 插入意向锁 | 间隙内的插入意图 | INSERT 被间隙锁阻塞时 |

**加锁的是索引，不是行**：如果 ${C}WHERE${C} 命中不了索引，就退化为**锁全表所有记录 + 所有间隙**——这是「没加索引的 UPDATE 把整张表锁住」的经典事故。排查用：

${F}sql
SELECT * FROM performance_schema.data_locks\G   -- 8.0（5.7 用 information_schema.innodb_locks）
SHOW ENGINE INNODB STATUS\G                     -- 最近一次死锁的完整现场
${F}

**死锁是常态，不是异常**：InnoDB 检测到死锁会**回滚代价小的事务**并报 1213。应用侧必须：① 捕获 1213/1205 做**有限重试**；② 统一多表加锁顺序；③ 事务尽量短小、避免在事务里做 RPC。

### 五、字符集与时区：两个隐藏的坑

- **一律 ${C}utf8mb4${C}**：MySQL 的 ${C}utf8${C} 是**残缺的三字节 UTF-8**，存不了 emoji 与部分生僻字。同时注意连接层（${C}character_set_client/connection/results${C}）与列字符集三者要一致，否则出现「中文变问号」或「索引失效」（不同字符集的列做 JOIN 无法走索引）。
- **时间字段**：${C}DATETIME${C} 不存时区（字面值），${C}TIMESTAMP${C} 存 UTC 并按 ${C}time_zone${C} 转换且受 2038 限制。跨时区系统**统一用 DATETIME + 应用层存 UTC** 或统一用 TIMESTAMP 并在连接初始化时 ${C}SET time_zone='+00:00'${C}——最怕的是两者混用。

## 七、延伸

- MySQL 8.0 Reference Manual：Ch.3 Tutorial / Ch.11 Data Types / Ch.13 SQL Syntax / Ch.15 InnoDB
- 官方「Transaction Isolation Levels」表：并发异常与隔离级别的权威对照
- InnoDB 官方章节「InnoDB and ACID」
          `
          },
          {
            id: "springboot-first",
            title: "Spring Boot 第一个服务",
            minutes: 16,
            updated: "2026-09-17",
            applies: "Spring Boot 3.2+ / JDK 17+",
            tags: ["Spring Boot", "REST", "配置"],
            terms: ["Spring Boot", "Actuator", "starter", "配置"],
            body: `
> **官方文档基线**：[Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/) · [Spring Initializr](https://start.spring.io/) · [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html) · [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html)

## 一、原理与底层机制

Spring Boot 解决的是「装配」问题：自动配置（auto-configuration）+ starter 起步依赖 + 内嵌服务器，把「搭一个能上生产的 Web 服务」从半天缩短到五分钟。它不是新框架，是 Spring 的**观点化默认值（opinionated defaults）**。

${C}@SpringBootApplication${C} 是三合一注解（官方 Javadoc 明确列出）：${C}@SpringBootConfiguration${C}（本类是配置类）、${C}@EnableAutoConfiguration${C}（按 classpath 推断并启用自动配置）、${C}@ComponentScan${C}（扫描本包及子包——**启动类放根包，别放子包**，这是官方「Structuring Your Code」的原话建议）。

**自动配置原理**：启动时加载各 starter 里的 ${C}AutoConfiguration.imports${C} 清单（Spring Boot 2.7+ 的 SPI 机制，取代旧 spring.factories），按 ${C}@ConditionalOnClass${C}/${C}@ConditionalOnMissingBean${C} 等条件注解判断哪些配置生效。加了 starter-web 就有 MVC + Tomcat，加了 starter-data-jpa 就有 DataSource + EntityManager——**依赖即配置**。理解这点就能解释「引了某 starter 行为就变了」，以及为什么自定义 Bean 能覆盖自动配置（条件注解的优先级规则：用户 Bean 优先）。

## 二、规范与标准

**配置优先级（Externalized Configuration 章节，官方列出 17 级，工程记前六级就够了，从高到低）**：

1. 命令行参数（${C}--server.port=8081${C}）
2. ${C}SPRING_APPLICATION_JSON${C} 环境变量
3. JVM 系统属性（${C}-Dserver.port=8081${C}）
4. OS 环境变量
5. profile 专属的 ${C}application-{profile}.yml${C}
6. ${C}application.yml${C}

**类型安全配置**——官方推荐的绑定方式，比 ${C}@Value${C} 好在集中、可校验、IDE 可跳转、重构安全：

${F}java
@ConfigurationProperties(prefix = "order")
@Validated
public record OrderProps(
    @NotNull Duration timeout,          // order.timeout=3s 自动转换
    @Min(1) int maxRetry) {}
${F}

## 三、实战

**标准 REST 服务（错误 vs 正确）**：

${F}java
@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {
    private final OrderService orderService;      // ✅ 构造器注入，官方推荐
    public OrderController(OrderService orderService) { this.orderService = orderService; }

    @GetMapping("/{id}")
    public Order get(@PathVariable Long id) { return orderService.require(id); }

    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody CreateOrderReq req) {
        var order = orderService.create(req);
        return ResponseEntity.created(URI.create("/api/orders/" + order.id())).body(order); // ✅ 201 + Location
    }
}
${F}

❌ 字段注入（${C}@Autowired${C} 到字段）：无法声明 final、单测只能靠反射注入、易藏循环依赖。✅ 构造器注入让依赖不可变且可测试。

**错误响应**：Spring Boot 3 对 ${C}/error${C} 默认输出 **ProblemDetail**（RFC 7807/9457 结构），统一错误体不用自己发明，前端按 ${C}type/title/status/detail${C} 消费即可。

## 四、覆盖广度

**Actuator：生产可观测的官方答案**：

- ${C}/actuator/health${C}：健康检查（数据库/Redis/MQ 状态自动聚合），K8s 与 LB 探针直接用它；
- ${C}/actuator/metrics${C}：JVM/HTTP/连接池指标，经 Micrometer 接 Prometheus；
- ${C}/actuator/env, /actuator/beans${C}：排障利器，**生产必须收紧暴露面**。

**优雅停机 + 探针配置**：

${F}yaml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus   # 只开需要的
  endpoint:
    health:
      probes:
        enabled: true                           # 启用 k8s 探针专用端点
server:
  shutdown: graceful                            # 优雅停机
${F}

**边界与进阶**：① starter 的本质是「依赖描述 + 自动配置」的捆绑，自研中间件应提供自己的 starter；② ${C}@ConditionalOnMissingBean${C} 保证用户自定义 Bean 优先；③ 配置加密（如 jasypt）与配置中心（Nacos/Apollo）对接 Externalized Configuration 的相应优先级；④ 生产禁用 ${C}include: "*"${C}，否则 heapdump/env 裸奔公网等于泄露源码级信息；⑤ 出问题时用 ${C}/actuator/conditions${C}（或启动 ${C}--debug${C}）看哪些自动配置生效/未生效及原因，而不是猜。

## 五、常见误区

1. **启动类放子包**：默认扫描不到同包外的 Bean，出现「明明有 Bean 却注入失败」。
2. **业务逻辑写在 Controller**：Controller 只做参数转换与编排，业务进 Service 层。
3. **配置硬编码**：数据库地址写死在类里，跨环境必炸——一切环境差异走配置。
4. **Actuator 全量暴露**：${C}include: "*"${C} 把 env、heapdump 裸奔公网。
5. **字段注入**：无法声明 final，单测只能靠反射注入。
6. **忽略优雅停机**：官方一行配置，滚动发布不掉正在处理的请求。
7. **以为自动配置是黑箱**：不会用 ${C}/actuator/conditions${C} 或 ${C}--debug${C} 排查「为什么某个 starter 没生效」。

## 六、自检清单

- [ ] 启动类在根包，构造器注入，无字段注入
- [ ] 环境差异全部外置：profile + 环境变量，代码里 grep 不到硬编码地址
- [ ] @ConfigurationProperties + 校验，启动即发现配置错误
- [ ] health/metrics 已接入探针与监控，暴露面收紧到白名单
- [ ] graceful shutdown 已开启，发布验证过无请求中断

<!--dd:springboot-first-->

## 🔬 深挖：自动配置的完整机制

### 一、@SpringBootApplication 拆开看

${F}java
@SpringBootApplication
// 等价于下面三个注解之和
@SpringBootConfiguration      // 本质是 @Configuration，标记入口配置类
@EnableAutoConfiguration      // 开启自动配置（核心）
@ComponentScan                // 扫描当前包及子包（所以启动类要放最外层包）
${F}

**包结构铁律**：启动类必须在**所有业务包的父级**，否则 ${C}@ComponentScan${C} 扫不到，Bean 不存在但代码编译通过——这是初学者最常见的「找不到 Bean」。

### 二、自动配置的三段式：怎么找到、怎么过滤、怎么生效

${F}
① 找：@EnableAutoConfiguration → @Import(AutoConfigurationImportSelector)
      → 读 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
        （2.7 之前是 META-INF/spring.factories 的 EnableAutoConfiguration 键）
      → 得到 ~140 个候选自动配置类全名

② 滤：逐个评估类上的 @Conditional 家族，不满足则跳过
      @ConditionalOnClass      类路径存在才生效（如存在 DataSource 类）
      @ConditionalOnMissingBean 用户没自己定义才生效（★ 用户优先的机制）
      @ConditionalOnProperty   配置项存在/等值才生效
      @ConditionalOnWebApplication / OnBean / OnResource ...

③ 装：通过者自己就是个 @Configuration，注册其中的 @Bean
${F}

**记住 ${C}@ConditionalOnMissingBean${C} 这一条**，它解释了 Spring Boot 最重要的设计哲学：**约定优于配置，且用户定义永远覆盖自动配置**。这就是「加一个 ${C}@Bean DataSource${C} 就能接管数据源」的原理。

调试验证手段：
${F}bash
java -jar app.jar --debug
# 或在 application.yml：
# debug: true
# 控制台会打印 Positive matches（生效）与 Negative matches（未生效及原因）
${F}

这是排查「为什么我的自动配置没生效」的最快路径——不要猜，直接看条件评估报告。

### 三、自定义 Starter 的标准做法

一个规范的 starter 需两个模块（或至少一个）+ 自动配置声明：

${F}
my-spring-boot-starter/
├── pom.xml
└── src/main/java/com/x/MyAutoConfiguration.java
└── src/main/resources/META-INF/spring/
        org.springframework.boot.autoconfigure.AutoConfiguration.imports

# 文件内容只有一行：
com.x.MyAutoConfiguration
${F}

${F}java
@AutoConfiguration
@ConditionalOnClass(MyService.class)
@EnableConfigurationProperties(MyProperties.class)
public class MyAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean          // ★ 允许用户覆盖
    public MyService myService(MyProperties p) {
        return new MyService(p.getEndpoint(), p.getTimeout());
    }
}
${F}

配套的 ${C}MyProperties${C} 用 ${C}@ConfigurationProperties(prefix = "my")${C} + 构造器绑定（不可变、可校验），比逐个 ${C}@Value${C} 更好：支持 ${C}@Validated${C} 校验、IDE 提示（配合 ${C}spring-configuration-metadata.json${C}）、宽松绑定（${C}my-end-point${C} 与 ${C}myEndPoint${C} 等价）。

### 四、配置优先级：从上到下，越靠前越高

${F}
① 命令行参数 --server.port=9090
② SPRING_APPLICATION_JSON（环境变量里的 JSON）
③ OS 环境变量（SERVER_PORT）
④ java:comp/env 的 JNDI
⑤ application-{profile}.yml（jar 外部）
⑥ application-{profile}.yml（jar 内部）
⑦ application.yml
⑧ @PropertySource 指定的
⑨ 默认值（SpringApplication.setDefaultProperties / @Value 的默认）
${F}

**同名配置后者不覆盖前者**——优先级高的赢。这条规则解释了两个高频困惑：①「我在 yml 里改了端口没用」→ 一定是命令行或环境变量覆盖了；②「Docker 里配置没生效」→ 环境变量优先级高于 yml 文件。

要在运行时确认「这个值到底从哪来」，用 Spring Boot 3 的 actuator ${C}/actuator/configprops${C} 或启动时加 ${C}--debug${C} 打印条件报告，而不是靠猜。

### 五、启动流程的关键节点

${F}
SpringApplication.run()
 ├─ 推断应用类型（SERVLET / REACTIVE / NONE）→ 决定用哪种 ApplicationContext
 ├─ 加载 ApplicationContextInitializer 与 ApplicationListener（spring.factories）
 ├─ 准备 Environment（读取配置、激活 profile）
 ├─ 打印 Banner（这就是启动时那只猫）
 ├─ 创建 ApplicationContext
 ├─ refresh()：BeanDefinition 注册 → BeanFactory 后置处理 → 实例化单例 → 启动内嵌容器
 └─ 发布 ApplicationReadyEvent（此处才是「真的可以访问了」）
${F}

**三个实用扩展点**：${C}ApplicationRunner${C} / ${C}CommandLineRunner${C}（启动后执行初始化任务，注意它们**在端口就绪之后**）；${C}SmartLifecycle${C}（控制启动/停止顺序）；${C}@PostConstruct${C}（Bean 初始化回调，此时依赖已注入但容器未就绪）。

**健康检查的正确做法**：用 actuator 的 ${C}/actuator/health/liveness${C} 与 ${C}/actuator/health/readiness${C}（K8s 探针分别对应），而不要用「首页能打开」当健康检查——首页 200 而数据库断了，探针会误判为健康，流量打进来全报错。

## 七、延伸

- Spring Boot Reference：Getting Started → Using Spring Boot → Externalized Configuration → Production-ready Features
- Spring Initializr（start.spring.io）：官方脚手架
- RFC 9457（Problem Details for HTTP APIs）
          `
          },
          {
            id: "git-flow",
            title: "Git 与团队协作流程",
            minutes: 14,
            updated: "2026-09-17",
            applies: "Git 2.40+",
            tags: ["Git", "协作", "工程化"],
            terms: ["Git", "分支模型", "rebase", "Code Review"],
            body: `
## 官方文档基线

- **Pro Git**（git-scm.com/book，官方文档）第 2/3/7 章：分支模型、分布式工作流、rebase 与 reflog；
- **GitHub Flow / GitLab Flow 官方指南**：现代协作模型的出处；
- **Conventional Commits**：commit message 的事实标准。

Git 的核心心智模型只有一句话：**分支只是一个指向 commit 的可移动指针**。理解了这句，rebase、merge、reset 全都变成指针操作题。

## 一、对象模型（Pro Git Ch.10 的简版）

${F}
blob（文件内容快照）
 tree（目录 → 引用 blob 和子 tree）
commit（指向 tree + 父 commit + 作者/信息）
${F}

每次提交是**全量快照**（未变的文件复用旧 blob），不是 diff——所以 Git 切分支、看历史都极快。

三种状态对应三个区域：**工作区 → (add) → 暂存区 → (commit) → 仓库**。所有「改丢了」事故都发生在工作区，${C}git status${C} 永远先看它。

## 二、rebase vs merge：官方口径

Pro Git 原话总结：两种都行，区别是**历史叙事**——

- ${C}merge${C}：保留真实时间线，产生合并节点；
- ${C}rebase${C}：把提交「重放」到目标基线上，历史线性干净。

**铁律（Pro Git 用加粗强调的那句）**：*Do not rebase commits that exist outside your repository and that people may have based work on.*——**已推送到共享分支的提交，禁止 rebase**。私有 feature 分支在 push 前整理历史随便 rebase。

${F}
git switch -c feature/pay && ...             # 开分支干活
git fetch origin && git rebase origin/main   # 更新基线（私有分支 OK）
git push -u origin feature/pay               # 发起 PR/MR
${F}

## 三、协作模型对比

| 模型 | 分支结构 | 适合 |
| --- | --- | --- |
| Git Flow | main + develop + feature/release/hotfix | 版本化发布的产品（App、SDK） |
| GitHub Flow | main + 短命 feature 分支，PR 即发布 | 持续部署的 Web 服务 |
| Trunk-Based | 所有人小步提交 main，feature flag 控发布 | 高频发布 + 强 CI 团队 |

多数互联网后端团队的现实是 **GitHub Flow / Trunk-Based + 短命分支**：分支存活以「天」计，超过一周就该拆分。

## 四、commit message 与提交粒度

Conventional Commits 格式：${C}type(scope): subject${C}——

${F}
feat(order): 支持指定门店自提
fix(payment): 修复回调重复处理导致重复入账
refactor(user): 抽取鉴权过滤器
${F}

一次提交做一件事：**可独立 review、可单独 revert**。混着「顺手改了两处无关代码」的提交，是 review 质量低的头号原因。

## 五、误操作恢复三板斧

${F}
git reflog                        # 后悔药总入口：记录一切 HEAD 移动
git reset --soft HEAD~1          # 撤 commit，改动回暂存区
git reset --mixed HEAD~1         # 撤 commit+暂存，改动留工作区（默认）
git reset --hard HEAD~1          # 全部丢弃 —— 工作区改动不可恢复，慎用
git revert <sha>                  # 生成反向提交，共享分支安全撤销的标准做法
${F}

恢复共享分支上的错误提交用 ${C}revert${C}（新增反向提交），不用 ${C}reset${C}+force push（改写历史）。

## ⚠ 高频误区

1. **对共享分支 force push**：同事的提交直接人间蒸发；必须覆盖时用 ${C}--force-with-lease${C}，至少能探测别人是否已推进。
2. **长期不更新的大分支**：合并冲突滚雪球，最后没人敢动。
3. **在 main 直接开发**：没有 PR/MR 就没有 review 与回滚锚点。
4. **rebase 已推送的公共分支**：所有人本地历史分叉，团队集体救援。
5. **${C}git push -f${C} 代替 ${C}--force-with-lease${C}**：盲推，等于关掉了最后一道保护。
6. **commit message 写「修改」「fix bug」**：半年后 ${C}git log${C} 形同虚设。

## ✅ 自检清单

- [ ] 能画出 blob/tree/commit 对象模型，解释分支为何是指针
- [ ] 私有分支 rebase、公共分支 merge/revert 的边界清晰
- [ ] commit 符合 Conventional Commits，一次提交一件事
- [ ] 用过 reflog 找回误删提交，知道 hard reset 的不可逆边界
- [ ] force push 只发生在自己独占的分支上，且用 --force-with-lease

<!--dd:git-flow-->

## 🔬 深挖：Git 的对象模型与「撤销」的正确工具

### 一、一切皆对象：Git 的四个对象与 SHA

Git 不是保存「文件差异」，而是保存**快照**，全部落在 ${C}.git/objects${C}（压缩后的 zlib 文件）：

| 对象 | 内容 | 由什么生成 |
|---|---|---|
| blob | 文件内容（**不含文件名**） | ${C}git hash-object${C} / add |
| tree | 目录结构：文件名 → blob/tree 的 SHA | ${C}git write-tree${C} |
| commit | 一个 tree + 父提交 + 作者/时间 + message | ${C}git commit${C} |
| tag（附注标签） | 指向某个对象 + 标签信息 | ${C}git tag -a${C} |

两个深刻推论：
- **同名同内容的文件在所有提交里共享同一个 blob**——所以 Git 存相似版本不浪费空间；
- **改动历史会改 SHA**（因为父提交变了），这就是「rebase 后再推必须 force」的根本原因，也解释了为什么「rebase 公共分支」是禁忌。

常用探针：
${F}bash
git cat-file -t <sha>       # 看对象类型
git cat-file -p <sha>       # 看对象内容
git rev-parse HEAD          # 展开引用为 SHA
git ls-tree HEAD src/       # 看 tree
${F}

### 二、merge 与 rebase 的真实差异

${F}
        A---B---C  feature
       /
  D---E---F---G  main

# merge：产生一个新的合并提交 M（父为 C 与 G），历史真实但分叉
        A---B---C
       /         \
  D---E---F---G---M
# 运行期 M 上出现冲突要解决一次

# rebase：把 A/B/C 逐个「重放」到 G 之后，产生新 SHA（A' B' C'）
  D---E---F---G---A'---B'---C'
# 运行期每个提交都可能冲突（--rebase-merges 可保留合并结构）
${F}

**选择口径**：本地未推送的个人分支用 rebase（历史线性、易 review）；已推送的公共分支用 merge（不改写别人已拉取的历史）。**永远不要 rebase main/release**。

### 三、撤销：reselect 正确工具（最容易搞错的一节）

| 场景 | 正确命令 | 为什么 |
|---|---|---|
| 改错了工作区文件（未 add） | ${C}git restore <file>${C} | 只动工作区，安全 |
| 已 add 未 commit | ${C}git restore --staged <file>${C} | 撤出暂存区，内容仍保留 |
| 已 commit 未推送，想改内容 | ${C}git reset --soft HEAD~1${C} | 保留改动在暂存区 |
| 已 commit 未推送，想丢弃提交与改动 | ${C}git reset --hard HEAD~1${C} | ⚠️ 丢弃改动，不可逆 |
| 已推送 | ${C}git revert <sha>${C} | 生成反向提交，不改历史（协作安全） |
| 误删分支 / 误 reset | ${C}git reflog${C} + ${C}git reset --hard <sha>${C} | reflog 是本地「后悔药」 |
| 只想把某个提交搬到别处 | ${C}git cherry-pick <sha>${C} | 复制提交内容（生成新 SHA） |

三档 ${C}reset${C} 的记忆法：**soft 只动 HEAD（改动全留在暂存区）、mixed（默认）动 HEAD+暂存区、hard 三处全动（工作区也清）**。

**reflog 是最后的防线**：它记录 HEAD 的每次移动（默认保留 90 天），即便分支被删、reset 错的提交也还在。但注意 ${C}git gc${C} 后未引用的对象会被真正清理。

### 四、bisect：二分定位「哪个提交引入了 bug」

${F}bash
git bisect start
git bisect bad                 # 当前版本是坏的
git bisect good v1.2.0         # 已知好的版本
# Git 自动 checkout 中间的提交，你测一次后回答：
git bisect good                # 或 git bisect bad
# ... log2(N) 次后输出「first bad commit」
git bisect reset               # 结束，回到原分支
${F}

配合自动化脚本可全自动：${C}git bisect run ./test.sh${C}——脚本退出码 0 表示 good、非 0 表示 bad。1000 个提交只需约 10 轮，这是排查「不知何时引入的回归」最高效的手段。

### 五、commit 卫生与冲突的正确处理

- **小步提交、单一职责**：一个提交只做一件事，回滚时才可能精准（回滚一个混合提交往往要连带回滚不相关内容）；
- **message 写清「为什么」**而非「做了什么」（diff 已经说明了做了什么）；
- **冲突不要慌**：${C}git status${C} 会列出 both modified 的文件，冲突标记 <<<<<<< ======= >>>>>>> 之间是两方内容；解决后 ${C}git add${C} 标记已解决，${C}git rebase --continue${C} 或 ${C}git commit${C}；
- **rebase 中途想放弃**：${C}git rebase --abort${C} 回到起点（abort 不会丢你的提交，比手工解冲突安全）；
- **别在冲突时乱删标记**：先把文件读到完整，理解两边的意图，再合并；删掉 <<<< 但忘了 ====== 会留下语法错误。

## 📚 延伸阅读

- Pro Git Ch.2（基础）Ch.3（分支）Ch.7（工具：rebase/reflog/bisect）——官方免费在线全书
- GitHub Flow 官方指南（guides.github.com）
- Conventional Commits 1.0.0
          `
          }
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "能定位线上问题、做方案设计：懂 JVM 内存与 GC、会用线程池、理解 Spring 原理、能做 SQL 与缓存优化。",
        chapters: [
          {
            id: "jvm-gc",
            title: "JVM 内存模型与 GC 调优",
            minutes: 20,
            updated: "2026-09-17",
            applies: "HotSpot / JDK 17+（G1 默认）/ JDK 21（ZGC 分代）",
            tags: ["JVM", "GC", "G1", "ZGC"],
            terms: ["JVM", "GC", "G1", "ZGC", "调优"],
            body: `
## 官方文档基线

- **JVMS（Java Virtual Machine Specification）§2.5 Runtime Data Areas**：运行时数据区的权威定义；
- **HotSpot Virtual Machine Garbage Collection Tuning Guide**（Oracle 官方）：G1 及各收集器的调优手册；
- **JEP 333（ZGC）/ JEP 439（Generational ZGC）/ JEP 377（弃用 CMS）**：收集器演进的一手记录。

JVM 题在面试里最容易背成「名词解释」，正确的打开方式是：**先看官方怎么划内存，再看官方推荐怎么调，最后用线上数据验证**。

## 一、运行时数据区（JVMS §2.5 原文结构）

${F}
线程私有：
  PC Register          —— 当前执行指令地址
  Java Virtual Machine Stack  —— 栈帧（局部变量表/操作数栈）
  Native Method Stack —— 本地方法栈
线程共享：
  Heap                —— 对象实例 + 数组；GC 主战场
  Method Area         —— 类元信息（HotSpot 里是 Metaspace，堆外）
运行期概念：
  Runtime Constant Pool / Code Cache（JIT 编译产物，堆外）
${F}

三个容易踩的「堆外」内存：**Metaspace**（类元数据，动态生成类多会涨）、**Code Cache**、**Direct Memory**（NIO 的 ${C}ByteBuffer.allocateDirect${C}）。排查「堆没满但 OOM」时先想到它们。

**对象分配路径**：TLAB（Thread-Local Allocation Buffer）→ Eden → Survivor → Old，绝大多数对象在 TLAB 内指针碰撞式分配，无锁完成——这就是「Java 慢」的谣言破产之处。

## 二、GC 算法谱系（官方 Tuning Guide 的分类）

| 收集器 | 定位（官方原话） | 状态 |
| --- | --- | --- |
| Serial | 单线程，客户端小内存 | 保留 |
| Parallel | 吞吐量优先（throughput collector） | 保留 |
| CMS | 低停顿（已弃用） | **JEP 377 移除** |
| G1 | JDK 9+ **默认**，可预测停顿 | 主力 |
| ZGC / Generational ZGC | 亚毫秒停顿，TB 级堆 | JDK 21 分代化（JEP 439） |

**G1 核心机制**（Tuning Guide「Garbage-First Garbage Collector」章）：

- 堆划分为 ~2048 个等大 Region（1–32MB），物理上不再有连续的新生代/老年代，分代只是 Region 的角色标签；
- 以 **停顿时间目标**（${C}-XX:MaxGCPauseMillis=200${C}，默认 200ms）反推每轮回收多少 Region——优先回收「垃圾占比最高」的区域，这就是名字里 Garbage-First 的含义；
- 回收分两类：Young GC（纯新生代）与 **Mixed GC**（新生代 + 部分老年代 Region）；
- **Humongous 对象**：超过 Region 一半的对象直接进老年代 Region——大对象是 G1 的重要优化方向，代码里少造巨型 byte[]。

**ZGC**（JEP 333/439）：着色指针（colored pointers）+ 读屏障（load barriers），并发完成整理，停顿与堆大小无关（<1ms）；JDK 21 起分代化后吞吐大幅改善。大堆、低延迟诉求选它。

## 三、调优参数：官方推荐的最小集

${F}
-Xms4g -Xmx4g                    # 堆大小；服务端官方建议 Xms=Xmx，避免动态伸缩抖动
-XX:MaxGCPauseMillis=200         # G1 停顿目标（给了它会牺牲吞吐，别设 50 这种离谱值）
-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=20m   # 统一日志（JDK 9+ 语法）
-XX:MaxMetaspaceSize=512m        # 元空间上限，防类加载泄漏打爆机器
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/     # OOM 现场保全
${F}

JDK 17+ 别忘了容器感知（${C}UseContainerSupport${C} 默认开启），容器里用 ${C}-XX:MaxRAMPercentage=75${C} 替代写死 -Xmx。

## 四、一次真实的调优案例

**现象**：订单服务 P999 从 80ms 恶化到 800ms，CPU 不高。
**排查**：GC 日志显示 G1 Mixed GC 单次 600ms+，${C}to-space exhausted${C} 字样——并发标记跟不上分配速度，出现 Full GC 兜底。
**动作**：① 检查发现有大任务一次构建 200MB 的 List（Humongous 大量产生）→ 改分页处理；② ${C}InitiatingHeapOccupancyPercent${C} 45→30，提前启动并发标记；③ 堆从 4g 升 6g。
**结果**：P999 回到 120ms，两周无 to-space exhausted。

## ⚠ 高频误区

1. **背「CMS 三色标记」但没摸过 G1 日志**：CMS 已移除，面试聊它只能证明没跟进。
2. **把 ${C}System.gc()${C} 留在代码/SDK 里**：触发 Full GC；生产建议 ${C}-XX:+DisableExplicitGC${C}（注意会让 DirectMemory 的堆外回收变慢，NIO 重度场景要评估）。
3. **停顿目标设 20ms 又抱怨吞吐掉一半**：目标越激进，G1 频繁中断并发回收，两头不讨好。
4. **只看 CPU 看 GC**：GC 停顿期间 CPU 空转，监控上看不出来；P999 毛刺先查 GC 日志。
5. **OOM 只看堆**：Metaspace（动态代理/类加载器泄漏）、DirectMemory、线程栈都是 OOM 来源，报错信息会写明是哪区。
6. **Xms=Xmx 是「优化」**：它是稳定性的默认项，不是锦上添花——官方 Tuning Guide 对服务端的明确建议。

## ✅ 自检清单

- [ ] 能按 JVMS §2.5 画出运行时数据区，说出三个堆外内存的名字
- [ ] 说清 G1 的 Region 模型、Mixed GC、MaxGCPauseMillis 的工作方式
- [ ] 线上服务的 GC 日志接入了采集，能回答「每周多少次 Mixed GC、平均停顿多少」
- [ ] OOM 参数已配：dump 会自动落在指定目录
- [ ] 容器环境用 MaxRAMPercentage 而不是写死 -Xmx

<!--dd:jvm-gc-->

## 🔬 深挖：内存布局、分配路径与收集器选型

### 一、运行时数据区：哪些是线程私有、哪些共享

| 区域 | 共享性 | 存什么 | 会不会 OOM |
|---|---|---|---|
| 程序计数器 | 私有 | 下一条字节码地址 | 不会（唯一不会 OOM 的区域） |
| 虚拟机栈 | 私有 | 栈帧（局部变量表、操作数栈、返回地址） | StackOverflowError / OOM |
| 本地方法栈 | 私有 | native 方法栈帧 | 同上 |
| **堆** | 共享 | 对象实例、数组 | OOM: Java heap space |
| **方法区/元空间** | 共享 | 类元信息、常量、静态变量 | OOM: Metaspace |
| 直接内存 | 进程外 | NIO DirectByteBuffer | OOM: Direct buffer memory |

**重要纠偏**：JDK 8 起永久代（PermGen）被**元空间（Metaspace）**取代，元空间在**本地内存**（不再受 ${C}-XX:MaxPermSize${C} 控制，改用 ${C}-XX:MaxMetaspaceSize${C}）。所以「本地内存被吃光」时，除了堆还要查元空间、线程栈数量（${C}-Xss${C} × 线程数）、DirectMemory（${C}-XX:MaxDirectMemorySize${C}）和 JNI 泄漏——堆 dump 里看不到它们。

### 二、对象的一生：分配 → 晋升 → 回收

${F}
new → ① 栈上分配？（逃逸分析 + 标量替换，无逃逸才能栈分配/拆散为标量）
    → ② TLAB 分配（线程本地分配缓冲，避免多线程争抢 Eden 指针 → 这就是「分配不需要锁」的秘密）
    → ③ Eden 分配（TLAB 不够 → CAS 抢 Eden 指针）
    → ④ Minor GC 存活 → 复制到 Survivor（S0/S1，对象年龄 +1）
    → ⑤ 年龄达阈值（默认 15，-XX:MaxTenuringThreshold）或 Survivor 同年龄对象总和 > 一半 → 晋升老年代
    → ⑥ 大对象（-XX:PretenureSizeThreshold）直接进老年代
    → ⑦ Full GC 回收老年代
${F}

**动态年龄判定**是易漏的细节：不是只有「满 15 岁」才晋升——Survivor 中**相同年龄对象大小总和超过 Survivor 一半**时，该年龄及以上的对象直接晋升。这就是「新生代设置不当导致对象过早晋升」的常见原因。

### 三、收集算法与收集器的演进

| 收集器 | 算法 | 特点 | 适用 |
|---|---|---|---|
| Serial | 复制（新生） | 单线程、STW | 客户端、小内存 |
| ParNew | 复制 | Serial 的多线程版 | 已随 CMS 退役 |
| Parallel Scavenge | 复制 | **吞吐量优先**（${C}-XX:GCTimeRatio${C}） | 批处理、后台计算 |
| CMS | 标记-清除 | 低停顿、并发标记 | 已废弃（JDK 14 移除） |
| **G1** | 分区复制（Region） | 可预测停顿模型（${C}MaxGCPauseMillis${C}） | 通用默认（JDK 9+） |
| ZGC | 染色指针 + 读屏障 | 停顿 < 1ms、TB 级堆 | 大内存低延迟（JDK 15+ 生产就绪） |
| Shenandoah | Brooks 转发指针 | 低停顿 | 与 ZGC 定位相近 |

**G1 的两阶段**：并发标记（SATB 快照）后用「回收价值 + 停顿预测」选出**年轻代 Region + 高收益老年代 Region** 组成回收集（CSet）——名字里的 Garbage First 就是这个意思。所以 G1 天然是**分代 + 增量**的，JDK 10 起支持整堆并行 Full GC。

选型口诀（实践版）：**延迟敏感 + 大堆 → ZGC；通用服务 → G1（默认）；吞吐优先的离线计算 → Parallel**。不要盲目上 ZGC：它牺牲吞吐换停顿，且需要更大的堆余量。

### 四、GC 日志：看什么、怎么调

${F}bash
# 必开的日志参数（JDK 9+ 统一日志框架，不再是 -XX:+PrintGCDetails）
java -Xlog:gc*,gc+heap=info,gc+age=trace:file=gc.log:time,uptime,level,tags
${F}

三看：① **频率**（Full GC 是否频繁 → 内存泄漏或堆太小）；② **单次停顿**（是否超出 ${C}-XX:MaxGCPauseMillis${C}）；③ **回收后剩余**（老年代回收后仍高企 → 真有长生命周期对象/泄漏，不是 GC 参数问题）。

常见调参方向：

${F}bash
-Xms4g -Xmx4g                 # 固定堆，避免动态伸缩带来的抖动（线上必做）
-XX:MetaspaceSize=256m         # 元空间初始值（避免早期频繁 Full GC 用于扩容元空间）
-Xmn2g / -XX:NewRatio=1       # 新生代大小（短生命周期对象多则调大）
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump   # ★ 线上必备
-XX:+ExitOnOutOfMemoryError    # 内存耗尽直接退出，交给 K8s 重启，避免半死不活
${F}

### 五、六种 OOM 与它们的真实含义

| 报错 | 含义 | 首查方向 |
|---|---|---|
| Java heap space | 堆内存不足 | 内存泄漏 or 堆不够 or 一次性加载过量 |
| GC overhead limit exceeded | GC 回收效率 < 2% 且占用 98% 时间 | 同上（堆已被无效对象占满） |
| Metaspace | 类加载过多 | 动态代理/CGLIB/热部署/反射滥用 |
| Direct buffer memory | 直接内存不足 | NIO 未释放、Netty 泄漏检测 |
| unable to create new native thread | 线程过多 | ${C}ulimit -u${C} 限制或线程泄漏 |
| Requested array size exceeds VM limit | 数组过大 | 一次读入超大文件/查询无分页 |

**排查顺序**：先 ${C}jstat -gcutil <pid> 1000${C} 看堆趋势 → 若老年代只增不减则 ${C}jmap -dump:live,format=b,file=/tmp/h.hprof <pid>${C}（⚠️ 会 STW，线上先摘流量） → 用 MAT/Eclipse Memory Analyzer 看 **Dominator Tree**（谁真正持有了最多内存）与 **Leak Suspects** 报告。**不要**直接看 histogram 里的实例数量下结论，要去掉「不可达对象」再看。

## 📚 延伸阅读

- JVMS §2.5（Runtime Data Areas）
- HotSpot GC Tuning Guide：Factors Affecting GC Performance / Generational / Garbage-First 章节
- JEP 333（ZGC）· JEP 439（Generational ZGC）· JEP 377（CMS 弃用）
- 《深入理解 Java 虚拟机》第 3/4 章（配合官方文档食用）
          `
          },
          {
            id: "concurrency",
            title: "并发编程与线程池",
            minutes: 20,
            updated: "2026-09-17",
            applies: "JDK 17+（虚拟线程 JDK 21）",
            tags: ["并发", "JMM", "线程池", "虚拟线程"],
            terms: ["并发", "JMM", "ThreadPoolExecutor", "虚拟线程"],
            body: `
## 官方文档基线

- **JLS §17（Threads and Locks）**：Java 内存模型（JMM）与 happens-before 的语言级定义；
- **java.util.concurrent 包文档（package summary）**：Executor 框架、并发集合、同步器的官方总述；
- **JEP 444（Virtual Threads）**：JDK 21 正式落地的虚拟线程。

并发题的正确顺序：**内存模型（为什么可见性会出问题）→ 工具（j.u.c 提供了什么）→ 实践（线程池怎么配）**。跳过第一层直接背线程池参数，永远答不到点上。

## 一、JMM 与 happens-before（JLS §17.4）

问题根源：CPU 缓存 + 编译器重排序，让「写了一个变量」不等于「另一个线程能看到」。JMM 的答案是一组**先行发生（happens-before）**规则——满足任一条，前一个操作的结果对后一个可见：

1. **程序次序**：单线程内，前面的操作 hb 后面的；
2. **监视器锁**：解锁 hb 后续加锁；
3. **volatile**：写 hb 后续读；
4. **线程启动/终止**：${C}start()${C} hb 线程内操作；线程内操作 hb ${C}join()${C} 返回；
5. **传递性**。

**volatile 两个作用**：可见性（上述规则 3）+ 禁止相关重排序。经典正确用法——状态标志、双重检查锁里的实例引用。

**synchronized 三个语义**：互斥 + 可见性（规则 2）+ 有序性。JDK 15 后偏向锁已废弃（JEP 374），锁膨胀路径是：无锁 → 轻量级（CAS）→ 重量级（OS mutex）。

**final 的特殊保证**：构造函数里写的 final 字段，无需同步就能被其他线程安全看到（JLS §17.5）——不可变对象是并发设计的银弹。

## 二、ThreadPoolExecutor：七个参数与执行顺序（官方 Javadoc 顺序）

${F}java
new ThreadPoolExecutor(
    corePoolSize,        // 常驻线程数
    maximumPoolSize,     // 最大线程数
    keepAliveTime, unit, // 非核心线程空闲存活时间
    workQueue,           // 任务队列（必须显式指定容量！）
    threadFactory,       // 命名线程工厂（排障时线程名就是命）
    handler);            // 拒绝策略：Abort/CallerRuns/Discard/DiscardOldest
${F}

**执行顺序**（Javadoc 原文逻辑）：核心线程 → 队列 → 非核心线程 → 拒绝策略。**注意顺序是先入队再扩线程**——队列无界时 maximumPoolSize 永远不会生效，这就是 ${C}Executors.newFixedThreadPool${C} 内置无界 ${C}LinkedBlockingQueue${C} 被 Alibaba 规约禁用的原因（官方 ${C}Executors${C} 文档自己都标注 unbounded）。

**容量估算的工程口径**（不是公式是起点）：

- CPU 密集：线程数 ≈ 核数（或核数+1）；
- IO 密集：线程数 ≈ 核数 × (1 + 等待时间/计算时间)；准确值靠压测，这个公式只是定初值。

## 三、CompletableFuture：异步编排（官方 API 文档口径）

${F}java
// 三个下游并行查询，汇总后统一返回 —— 默认线程池是 ForkJoinPool.commonPool()，
// IO 任务务必传自定义线程池，别污染 commonPool
CompletableFuture<Price> p = CompletableFuture
    .supplyAsync(() -> priceRpc(sku), ioPool)
    .orTimeout(300, TimeUnit.MILLISECONDS)
    .exceptionally(e -> Price.fallback());

CompletableFuture.allOf(p, s, i).join();
${F}

记住三个组合语义：${C}thenApply${C}（变换）、${C}thenCompose${C}（扁平化异步链）、${C}thenCombine${C}（两路合并）；超时用 ${C}orTimeout${C}（JDK 9+）。

## 四、ThreadLocal 与虚拟线程

**ThreadLocal 泄漏原理**：条目存在 ${C}ThreadLocalMap${C} 里，key 是弱引用、value 是强引用。线程池线程长生不死，value 不 ${C}remove${C} 就一直挂着——用完必 ${C}remove${C}，包装成 try/finally。

**虚拟线程（JEP 444）**：

- 是「轻量级由 JVM 调度的线程」，阻塞 IO 时由 JVM 卸载（unmount），底层载体线程转去跑别的——**一个阻塞不再占用一个 OS 线程**；
- 官方定位：**大规模并发 IO 密集任务的答案**（百万级连接），不是计算提速工具；
- 官方警告：**不要池化虚拟线程**（它们便宜到用完即弃）；不要在 synchronized 块里做长时间 IO（pinning 问题，JDK 24 已大幅缓解）；CPU 密集任务继续用普通线程池。

${F}java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i ->
        executor.submit(() -> {                      // 十万并发任务毫无压力
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        }));
}
${F}

## ⚠ 高频误区

1. **用 Executors 快捷方法建线程池**：无界队列 / 无界线程数，生产必须手写 ${C}new ThreadPoolExecutor(...)${C}。
2. **双检锁忘加 volatile**：指令重排导致拿到半初始化对象。
3. **以为 ConcurrentHashMap 锁整个 map**：JDK 8 后是 CAS + synchronized 锁单桶头节点，读完全无锁。
4. **CompletableFuture 用默认 commonPool 跑 IO**：commonPool 线程数 = 核数-1，一个 IO 抖动全 JVM 的并行流和 future 一起堵。
5. **把虚拟线程当万能药**：CPU 密集没收益；${C}synchronized${C} 里长 IO 会 pinning。
6. **CountDownLatch 不 countDown 完就等待**：死等；或者复用 latch（它不可重置，需要就用 ${C}Phaser${C}）。

## ✅ 自检清单

- [ ] 能默写 happens-before 五条常用规则，解释 volatile 为什么能保证可见性
- [ ] 所有线程池显式构造：有界队列 + 命名线程工厂 + 明确拒绝策略
- [ ] CompletableFuture 全部传入自定义 IO 线程池，带超时与异常兜底
- [ ] ThreadLocal 全部 try/finally remove
- [ ] 能说出虚拟线程的适用边界（IO 密集、不池化、pinning）

<!--dd:concurrency-->

## 🔬 深挖：JMM、锁升级与线程池

### 一、JMM 的三条规则与 happens-before

Java 内存模型把「线程本地缓存 vs 主内存」的同步抽象为 **happens-before** 规则。只要满足，前一个操作的结果对后一个操作可见：

1. **程序顺序**：同一线程内，前面的操作 hb 后面的；
2. **监视器锁**：unlock hb 后续对同一锁的 lock；
3. **volatile 变量**：对 volatile 域的写 hb 后续对它的读；
4. **线程启动/终止**：${C}start()${C} hb 线程内所有操作；线程内所有操作 hb ${C}join()${C} 返回；
5. **传递性**：A hb B、B hb C ⇒ A hb C。

**关键认知**：happens-before 保证的是**可见性与有序性**，不是「禁止重排序」本身——底层仍可重排，只要不破坏 HB 语义。这解释了为什么「没加同步的双检锁」会拿到半初始化对象：

${F}java
// ❌ 经典错误：instance 非 volatile 时，可能发布未初始化完成的对象
public class Singleton {
    private static Singleton instance;        // 缺 volatile
    public static Singleton get() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();  // 可能重排为「分配→发布→初始化」
            }
        }
        return instance;
    }
}
// ✅ 正确：加 volatile（禁止该重排）；或者直接用静态内部类（类加载机制天然线程安全）
${F}

### 二、synchronized 的锁升级（理解它就能理解「为什么不要随便加锁」）

${F}
无锁 → 偏向锁 → 轻量级锁（自旋 CAS）→ 重量级锁（OS 互斥量，线程挂起）
       （JDK 15 起默认关闭偏向锁，JDK 18 移除相关代码）
${F}

- **偏向锁**：只有一个线程时，把线程 ID 记在对象头 Mark Word，之后进入同步块**零代价**；
- **轻量级锁**：出现竞争时，CAS 尝试把 Mark Word 设为指向栈上锁记录的指针，失败则**自旋**；
- **重量级锁**：自旋超过阈值仍失败 → 升级为 OS 级别互斥（用户态→内核态切换，代价最大）。

锁只能升不能降（除非 STW 时批量撤销偏向）。**实践推论**：避免在**长临界区**里竞争（自旋会白烧 CPU），临界区尽量短；读多写少用 ${C}ReentrantReadWriteLock${C} 或 ${C}StampedLock${C}（乐观读）；不要用 ${C}String${C} 常量或包装类型做锁对象（可能被复用/JIT 常量池共用）。

### 三、AQS：整个并发包的骨架

${C}ReentrantLock / Semaphore / CountDownLatch / ReentrantReadWriteLock${C} 都建立在 AQS 之上。AQS = **一个 volatile int state + 一个 CLH 双向队列 + CAS**：

${F}java
// AQS 的核心：tryAcquire 由子类实现（模板方法），state 语义由子类定义
// ReentrantLock：state 为 0 表示未占用，>0 表示重入次数，并记录 exclusiveOwnerThread
// Semaphore：state 为剩余许可数
// CountDownLatch：state 为计数（只能减）

// 自定义同步器示例：不可重入互斥锁
class Mutex extends AbstractQueuedSynchronizer {
    protected boolean tryAcquire(int arg) { return compareAndSetState(0, 1); }
    protected boolean tryRelease(int arg) { setState(0); return true; }
    protected boolean isHeldExclusively() { return getState() == 1; }
    void lock()   { acquire(1); }
    void unlock() { release(1); }
}
${F}

**CAS 的三个问题**：① **ABA**（值 A→B→A 看不出变化，用版本号 ${C}AtomicStampedReference${C} 解决）；② **自旋开销**（高竞争下大量 CPU 空转，故有 ${C}LongAdder${C} 分段累加）；③ **只能保证一个变量**（多变量原子性要靠锁，或封装成一个对象 + ${C}AtomicReference${C}）。

### 四、ThreadLocal：原理与内存泄漏的真相

每个 ${C}Thread${C} 有一个 ${C}ThreadLocalMap${C}（不是 ThreadLocal 存数据），key 是 ThreadLocal 对象的**弱引用**、value 是**强引用**：

${F}
Thread → ThreadLocalMap.Entry[] → { key: WeakRef(ThreadLocal), value: yourObject }
${F}

- key 用弱引用是为了让 **ThreadLocal 对象本身**能被回收，避免 key 泄漏；
- 但 **value 是强引用**，线程不结束（线程池！）则 value 永远活着 → **这才是 Entry 泄漏**；
- 修法：必须在 ${C}finally${C} 里 ${C}remove()${C}。线程池场景尤其致命——复用线程会把上一次请求的用户数据带给下一个请求，既是内存泄漏也是**数据串号**。

${F}java
try {
    MDC.put("traceId", id);            // MDC 内部就是 ThreadLocal
    doWork();
} finally {
    MDC.clear();                       // ★ 必须清理，否则线程复用会串号
}
${F}

### 五、线程池：七个参数与四条拒绝策略

${F}java
new ThreadPoolExecutor(
    corePoolSize,              // ① 核心线程数（常驻，默认不回收）
    maximumPoolSize,           // ② 最大线程数
    keepAliveTime, TimeUnit,   // ③ 空闲线程存活时间（只对 >core 的线程生效）
    workQueue,                 // ④ 工作队列（决定排队行为）
    threadFactory,             // ⑤ 线程工厂（★ 必须自定义命名，便于排查）
    handler                    // ⑥ 拒绝策略
);
// ⑦ 另外还有 allowCoreThreadTimeOut（核心线程也可回收）
${F}

**执行顺序是「核心 → 队列 → 非核心 → 拒绝」**，与直觉相反：先填满队列，队列满了才扩容到 max。所以用**无界队列**（${C}LinkedBlockingQueue${C} 默认容量 ${C}Integer.MAX_VALUE${C}）时，${C}maximumPoolSize${C} **永远用不上**，任务无限堆积 → OOM/超时。

| 拒绝策略 | 行为 | 适用 |
|---|---|---|
| AbortPolicy（默认） | 抛 RejectedExecutionException | 需要感知失败的核心任务 |
| CallerRunsPolicy | 由提交任务的线程自己执行 | 天然背压（拖慢上游） |
| DiscardPolicy | 静默丢弃 | 日志类可丢任务（危险，无从感知） |
| DiscardOldestPolicy | 丢队首、重试提交 | 只关心最新数据 |

**参数怎么定**（实践口径）：CPU 密集型 → ${C}N+1${C}；IO 密集型 → ${C}N × (1 + 等待时间/计算时间)${C}。但更可靠的做法是**按实测**：压测下观察队列水位与拒绝次数，而不是套公式。

**池化必配四件套**：线程命名（${C}业务名-thread-%d${C}）、有界队列、明确的拒绝策略、监控（活跃线程数/队列长度/拒绝计数上报到监控系统）。

## 📚 延伸阅读

- JLS §17.4（Memory Model）与 §17.5（final 语义）
- java.util.concurrent package summary：官方对 Executor/同步器/并发集合的总述
- JEP 444 + Oracle「Virtual Threads」官方指南（dev.java 上的实战篇）
- 《Java Concurrency in Practice》：概念全部有 JLS 出处，仍是最好的并发书
          `
          },
          {
            id: "spring-principle",
            title: "Spring 原理（IoC/AOP/事务）",
            minutes: 19,
            updated: "2026-09-17",
            applies: "Spring Framework 6.x",
            tags: ["Spring", "IoC", "AOP", "事务"],
            terms: ["Spring", "IoC", "AOP", "事务传播"],
            body: `
## 官方文档基线

全部取自 **Spring Framework Reference** 官方目录（docs.spring.io/spring-framework/reference）：

- **Core → IoC Container**：Bean 概念、容器职责、依赖注入、Bean 作用域与生命周期；
- **Core → Resources / Validation / AOP**；
- **Data Access → Transaction Management**：传播行为、隔离、回滚规则。

Spring 面试题的区分点在**「背注解」和「读得懂官方文档章节」之间**——下面按官方目录顺序讲清楚四个机制。

## 一、IoC 容器：Bean 生命周期（官方「Bean Overview / Lifecycle」链路）

${F}
实例化 Instantiation
  → 属性填充 Populate（@Autowired 就在这步解析）
  → Aware 回调（BeanNameAware / ApplicationContextAware ...）
  → BeanPostProcessor#postProcessBeforeInitialization
  → 初始化（@PostConstruct → InitializingBean#afterPropertiesSet → init-method）
  → BeanPostProcessor#postProcessAfterInitialization     ← AOP 代理在这步生成
  → 使用
  → 销毁（@PreDestroy → DisposableBean#destroy → destroy-method）
${F}

两个最重要的扩展点：**BeanFactoryPostProcessor**（改 Bean 定义，如占位符解析）、**BeanPostProcessor**（改 Bean 实例，如 ${C}@Autowired${C} 注入与 AOP 代理都是它实现的）。理解了 BPP，你就理解了 Spring 「注解魔法」的实现套路。

**循环依赖三级缓存**：singletonFactories（工厂）/ earlySingletonObjects（半成品）/ singletonObjects（成品）。为什么需要工厂这级？——因为 AOP 场景下要在被引用前**提前生成代理**，工厂保证「每次拿到的是同一个代理」。官方文档同时明确：**构造器注入的循环依赖无解**（官方建议改设计，或用 ${C}@Lazy${C}）。

## 二、AOP：动态代理两条路（官方「AOP」章）

- **JDK 动态代理**：目标实现了接口 → 基于接口生成代理；
- **CGLIB**：无接口 → 生成目标类的子类（**final 类/方法无法代理**）。

Spring Boot 默认 ${C}proxyTargetClass=true${C}（统一走 CGLIB）。切面表达式 ${C}execution(* com.x.service..*.*(..))${C} 读法：返回类型 包(含子包).类.方法(参数)。

**自调用失效的根因**：代理是包在外面的壳，${C}this.method()${C} 走的是原始对象，根本没经过代理——所以 ${C}@Transactional${C}、${C}@Cacheable${C} 同类自调用全部失效。解法：拆类，或注入自身代理（${C}AopContext.currentProxy()${C} 需开启 exposeProxy）。

## 三、事务传播行为（官方 Propagation 枚举的七种）

| 传播 | 行为 | 典型用途 |
| --- | --- | --- |
| REQUIRED（默认） | 有事务加入，没有新建 | 绝大多数业务 |
| REQUIRES_NEW | 挂起当前，新建独立事务 | 审计日志（主事务回滚日志也要留） |
| NESTED | 保存点，可部分回滚 | 子步骤允许失败 |
| SUPPORTS / NOT_SUPPORTED / MANDATORY / NEVER | 语义见名 | 边界约束 |

**回滚规则**（官方 Transaction Management 章）：默认只对 **RuntimeException 与 Error** 回滚；checked 异常**不回滚**——想回滚要么 ${C}@Transactional(rollbackFor = Exception.class)${C}，要么 ${C}TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()${C}。

**@Transactional 失效全场景**（每一条都是线上事故库常客）：

1. 自调用（走原始对象，未过代理）；
2. 方法非 public（代理拦截不到）；
3. 异常被 catch 吞掉，事务管理器不知道；
4. 抛 checked 异常且未配 rollbackFor；
5. 类没被 Spring 管理（new 出来的对象）；
6. 多线程：事务绑定 ThreadLocal，子线程不延续。

## 四、事务里发消息的正确姿势

事务未提交就发 MQ，消费者可能读到「不存在的数据」。官方 pattern 答案是 **Transactional Outbox**（详见本方向「分布式事务」篇）：业务与「待发消息表」同库同事务，提交后由中继投递。Spring 侧可以配合 ${C}TransactionSynchronization#afterCommit${C} 做「提交后回调」。

## ⚠ 高频误区

1. **以为 ${C}@Transactional${C} 万能**：自调用、非 public、吞异常三大失效场景年年在线上重演。
2. **大事务裹住 RPC 调用**：连接被长时间占用，连接池耗尽——远程调用移出事务边界。
3. **用二级缓存解决循环依赖当设计**：循环依赖本身是设计问题，官方建议从架构上解耦。
4. **@Async 与 @Transactional 混用不管传播**：异步线程丢事务上下文，误以为在同一事务里。
5. **CGLIB 代理 final 方法**：静默不生效，无报错，靠测试才能发现。
6. **Bean 依赖顺序敏感却依赖启动顺序**：用 ${C}@DependsOn${C} 显式声明，别赌容器初始化顺序。

## ✅ 自检清单

- [ ] 能按顺序讲出 Bean 生命周期 8 步，知道 AOP 代理在哪个环节生成
- [ ] 说清三级缓存为什么必须有一级「工厂」
- [ ] 新增事务方法默认带 ${C}rollbackFor = Exception.class${C}，或团队有明确约定
- [ ] 全库搜索过「同类自调用 + 事务/缓存注解」的组合并整改
- [ ] 审计/日志类写入用 REQUIRES_NEW，主流程回滚不影响留痕

<!--dd:spring-principle-->

## 🔬 深挖：IoC 容器的启动链路与循环依赖

### 一、容器启动的完整阶段

${F}
new AnnotationConfigApplicationContext(AppConfig.class)
 ├─ ① 构造 BeanFactory（DefaultListableBeanFactory）
 ├─ ② 注册配置类 → 解析 @ComponentScan / @Import / @Bean
 │     → 得到 BeanDefinition（不是 Bean 实例！只是「配方」）
 ├─ ③ 执行 BeanFactoryPostProcessor
 │     ★ ConfigurationClassPostProcessor 在此完成注解解析
 │     ★ PropertySourcesPlaceholderConfigurer 在此替换 \${...} 占位符
 ├─ ④ 注册 BeanPostProcessor（此时只注册，实例化时调用）
 ├─ ⑤ 实例化所有非懒加载单例（preInstantiateSingletons）
 │     ├─ 实例化（构造器）
 │     ├─ 属性填充（@Autowired 注入）  ← 循环依赖在此发生
 │     ├─ Aware 回调（BeanNameAware / ApplicationContextAware）
 │     ├─ BeanPostProcessor.postProcessBeforeInitialization
 │     ├─ 初始化（@PostConstruct → InitializingBean.afterPropertiesSet → initMethod）
 │     └─ BeanPostProcessor.postProcessAfterInitialization  ← ★ AOP 代理在此生成
 └─ ⑥ 发布 ContextRefreshedEvent
${F}

**关键区分**：${C}BeanFactoryPostProcessor${C} 操作「配方」（BeanDefinition），${C}BeanPostProcessor${C} 操作「成品/半成品」（Bean 实例）。名字只差一个词，作用时机差很远。

### 二、三级缓存与循环依赖的真相

${F}java
// DefaultSingletonBeanRegistry 的三个 Map
singletonObjects          // 一级：成品 Bean（完全初始化 + 可能已代理）
earlySingletonObjects     // 二级：早期引用（已实例化、属性未填充）
singletonFactories        // 三级：ObjectFactory（用于「需要时」提前生成代理）
${F}

A 依赖 B、B 依赖 A 的解决过程：

${F}
1. getBean(A) → 实例化 A → 把 A 的 ObjectFactory 放进三级缓存
2. 填充 A 的属性 → 发现依赖 B → getBean(B)
3. 实例化 B → 填充 B 的属性 → 发现依赖 A
4. getBean(A) 命中三级缓存 → 调用 ObjectFactory.getEarlyBeanReference()
   → 若 A 需要 AOP，此处提前生成 A 的代理 → 放入二级缓存
5. B 拿到（可能是代理的）A → B 初始化完成 → 放入一级缓存
6. A 拿到 B → A 完成初始化 → 放入一级缓存
${F}

**结论与边界**（面试最爱追问）：

| 问题 | 答案 |
|---|---|
| 为什么要三级而不是两级？ | 为了在「需要代理」时才提前创建代理；若没 AOP，二级就够。第三级是「延迟决策」的机制，保证最终暴露的引用与最终 Bean 一致 |
| 构造器注入的循环依赖能解决吗？ | **不能**。因为实例化都没完成，无从「提前暴露」，会直接抛 ${C}BeanCurrentlyInCreationException${C} |
| 原型（prototype）作用域呢？ | 不缓存，**不能**解决，同样抛异常 |
| ${C}@Async${C} 导致的循环依赖报错？ | ${C}@Async${C} 也会触发提前代理，与 ${C}@Transactional${C} 路径不同，可能报「与自身循环」——解法是提取接口、加 ${C}@Lazy${C}，或重构消除循环 |
| Spring Boot 2.6+ 为什么默认禁止？ | ${C}spring.main.allow-circular-references=false${C} 默认值变更——**官方明确不鼓励依赖循环依赖能力**，应重构 |

${C}@Lazy${C} 是应急手段：注入一个代理，真正调用时才去容器取，从而打破环。

### 三、AOP：JDK 动态代理 vs CGLIB

| 维度 | JDK 动态代理 | CGLIB |
|---|---|---|
| 原理 | 运行时生成 implements 接口的类 | 生成目标类的**子类**（字节码增强） |
| 前提 | 目标类**必须有接口** | 目标类不能是 final、方法不能是 final/private |
| 性能 | 创建稍慢、调用快（JDK 8 后差距很小） | 创建快、调用稍慢 |
| Spring Boot 默认 | —— | **默认全部用 CGLIB**（${C}proxyTargetClass=true${C}） |

**事务失效的五种场景**（几乎每次面试都问）：

1. **同类内部自调用**——${C}this.methodB()${C} 不走代理，所以 ${C}@Transactional${C} 不生效。解法：注入自己（${C}@Lazy${C}）、${C}AopContext.currentProxy()${C}、或拆分到另一个 Bean；
2. **方法非 public**（Spring 5 之前；其实 CGLIB 代理下 protected/包级也可能生效，但**不要依赖**）；
3. **异常被吞或类型不匹配**——默认只对 ${C}RuntimeException${C} 与 ${C}Error${C} 回滚，受检异常要写 ${C}@Transactional(rollbackFor = Exception.class)${C}；
4. **在 try-catch 里自己吃掉了异常**——代理收不到异常，自然不回滚；
5. **传播行为设置不当**——${C}NOT_SUPPORTED / NEVER${C} 会挂起或拒绝事务；${C}REQUIRES_NEW${C} 会新开事务（内层回滚不影响外层，但注意连接占用）。

**验证 AOP 是否真的生效**：看日志里启动时的代理提示（${C}Bean 'x' is not eligible for getting processed by all BeanPostProcessors${C}），或直接打印 ${C}bean.getClass().getName()${C}——带 ${C}$$EnhancerBySpringCGLIB${C} 后缀才是代理。

### 四、Bean 生命周期的六个可扩展点

${F}
① BeanDefinitionRegistryPostProcessor  → 动态注册 BeanDefinition
② BeanFactoryPostProcessor             → 改 BeanDefinition（如占位符替换）
③ InstantiationAwareBeanPostProcessor  → 实例化前后干预（AOP 代理候选在这里）
④ Aware 接口                            → 拿到容器/环境/BeanName
⑤ InitializingBean / @PostConstruct / initMethod → 初始化
⑥ DisposableBean / @PreDestroy / destroyMethod   → 销毁（仅单例）
${F}

执行顺序记忆：**${C}@PostConstruct${C} → ${C}afterPropertiesSet()${C} → ${C}initMethod${C}**（前者是 JSR-250 注解，由 ${C}CommonAnnotationBeanPostProcessor${C} 处理，在 ${C}InitializingBean${C} 之前）。

## 📚 延伸阅读

- Spring Framework Reference：Core Technologies → IoC Container / AOP；Data Access → Transaction Management
- 官方 Javadoc：${C}org.springframework.transaction.annotation.Propagation${C} 七种传播的原文定义
- Spring Boot Reference「AOP」一节（默认 CGLIB 的说明）
          `
          },
          {
            id: "mysql-index",
            title: "MySQL 索引与慢查询优化",
            minutes: 19,
            updated: "2026-09-17",
            applies: "MySQL 8.0 InnoDB",
            tags: ["MySQL", "索引", "EXPLAIN", "优化"],
            terms: ["MySQL", "B+Tree", "EXPLAIN", "慢查询"],
            body: `
## 官方文档基线

- **MySQL 8.0 Reference Manual Ch.8 Optimization**：优化总纲，其中「Optimizing Queries with EXPLAIN」「Multi-Range Read / Index Condition Pushdown」是索引优化的正文；
- **Ch.10 EXPLAIN Output Format**：EXPLAIN 每个字段的官方定义；
- **Ch.17 InnoDB「Index Structures」**：B+Tree 与聚簇索引的底层描述。

慢查询优化的套路是固定的：**看执行计划 → 定位访问方式 → 改索引或改写 SQL**。核心是读懂 EXPLAIN。

## 一、InnoDB 索引结构（官方 Index Structures 章）

- **聚簇索引**：表本身就是按主键组织的 B+Tree，叶子节点存整行数据——「主键即数据」；
- **二级索引**：叶子存「索引列 + 主键」，命中后需要**回表**（拿主键回聚簇索引取整行）；
- **覆盖索引**：查询列全部包含在二级索引里，无需回表，EXPLAIN 的 Extra 显示 ${C}Using index${C}——性能质变的分水岭；
- **最左前缀**：联合索引 ${C}(a,b,c)${C} 只能服务 ${C}a${C} / ${C}a,b${C} / ${C}a,b,c${C} 前缀条件的查找；
- **索引下推（ICP）**：把 WHERE 里能过滤的部分下推到存储引擎层，减少回表次数（Extra 显示 ${C}Using index condition${C}）。

**主键为什么用自增 BIGINT**：聚簇索引按主键物理有序，随机主键（如 UUID）导致每次插入都要在 B+Tree 中间找位置，频繁页分裂——这是官方文档明说的机制，不是习惯问题。

## 二、EXPLAIN 字段速查（Ch.10 官方定义）

| 字段 | 关注点 |
| --- | --- |
| type | 访问方式，从好到坏：const > eq_ref > ref > range > index > ALL（**ALL = 全表扫描**） |
| key / key_len | 实际用上的索引及其长度（判断联合索引用了几列） |
| rows | 预估扫描行数，数量级判断第一依据 |
| filtered | 条件过滤后剩余比例 |
| Extra | ${C}Using index${C}=覆盖；${C}Using filesort${C}=额外排序；${C}Using temporary${C}=临时表（都要警惕） |

${F}sql
EXPLAIN FORMAT=JSON
SELECT id, amount FROM orders
WHERE user_id = 10086 AND status = 1
ORDER BY create_time DESC LIMIT 20;
${F}

**filesort 消除法**：ORDER BY 列加入索引尾部并保持方向一致。上面这条 SQL 的理想索引是 ${C}(user_id, status, create_time)${C}——二级索引叶子天然带主键 ${C}id${C}，这条查询正好覆盖，无需回表。

## 三、慢查询定位流程（从监控到改写）

${F}
1. slow_query_log = ON，long_query_time = 0.5（生产抓到 0.5s 以上即可）
2. pt-query-digest / 官方 performance_schema.events_statements_summary_by_digest
   聚合 Top SQL —— 按总耗时排序，不是单次
3. EXPLAIN 分析 → type=ALL 或 rows 巨大 → 进入改写环节
4. 改写优先级：改索引 > 改 SQL 结构 > 改业务/缓存
${F}

**深分页三种改写**：

${F}sql
-- 原始：LIMIT 1000000, 20  → 扫描 100 万行再丢弃
-- ① 游标：记录上一页最大 id
SELECT * FROM orders WHERE id > :lastId ORDER BY id LIMIT 20;
-- ② 延迟关联：先在索引里取 20 个主键再回表
SELECT o.* FROM orders o
JOIN (SELECT id FROM orders WHERE user_id = 9 ORDER BY id LIMIT 1000000, 20) t
  ON o.id = t.id;
${F}

## 四、统计信息与优化器的「不智能」

- 优化器基于**统计信息**估算成本：${C}ANALYZE TABLE${C} 手动刷新；数据大量变更后执行计划突变常源于此；
- ${C}optimizer_trace${C}（${C}SET optimizer_trace="enabled=on"${C}）可以看到优化器对每个候选索引的成本估算，官方定位就是排查「为什么不用我建的索引」；
- 索引选择性 = ${C}COUNT(DISTINCT col)/COUNT(*)${C}，接近 1 才值得建；性别/状态这类低基数列单列索引基本无用（联合索引里做前导列除外）。

## ⚠ 高频误区

1. **索引越多越好**：每个索引都是一棵要同步维护的 B+Tree，写放大 + 优化器选择困难。
2. **WHERE 里对索引列套函数/隐式转换**：${C}DATE(t)${C}、字符串列传数字，索引直接失效。
3. **LIKE '%xx' 前缀模糊**：B+Tree 按前缀组织，后缀匹配只能全扫；必须模糊就上全文/搜索引擎。
4. **${C}OR${C} 两边不都是索引**：一边全表就整体全表，能改 ${C}UNION${C} 就改。
5. **ORDER BY 随机函数取样**：${C}ORDER BY RAND()${C} 全表排序，改成「随机 id 区间」或预生成。
6. **只加索引不看执行计划**：优化器可能因统计信息过时不用它，上线前必须 EXPLAIN 验证。

## ✅ 自检清单

- [ ] 新上线 SQL 全部 EXPLAIN 过，无 type=ALL 的大表查询
- [ ] 慢日志常开，有按「总耗时」聚合的 Top SQL 看板
- [ ] 联合索引列序 = 等值条件在前、范围/排序列在后
- [ ] 主键全部自增 BIGINT（或有序分布式 ID），无随机 UUID 主键
- [ ] 深分页已改游标或延迟关联，线上无 LIMIT 10w+ 的调用

<!--dd:mysql-index-->

## 🔬 深挖：从 B+ 树到执行计划

### 一、为什么是 B+ 树（而不是 B 树 / 红黑树 / 哈希）

| 结构 | 为什么不适合做 MySQL 索引 |
|---|---|
| 哈希 | 只支持等值，**不支持范围与排序**；哈希冲突退化 |
| 二叉/红黑树 | 树太高（百万行 ≈ 20 层），每层一次磁盘 IO，不可接受 |
| B 树 | 非叶子节点也存数据 → 单页容纳的键更少 → 树更高；且范围查询要中序遍历跳来跳去 |
| **B+ 树** | 非叶子只存「键 + 指针」（单页约 1170 个指针）→ 树极矮；叶子有**双向链表**且**数据全在叶子** → 范围扫描顺序 IO，天然有序 |

**磁盘友好性才是根本原因**：B+ 树把树高压到 3~4 层，一次查询最多 3~4 次页读取，而 InnoDB 的 Buffer Pool + 预读让根节点与非叶子节点几乎常驻内存，实际常常只需 1 次物理 IO。

### 二、最左前缀：不是「从左到右用」，而是「连续使用」

联合索引 ${C}(a, b, c)${C} 的键是**按 a、再按 b、再按 c 排序**的。判断能否走索引，看查询条件在排序维度上是否**连续**：

${F}sql
-- 索引 (a, b, c)
WHERE a=1                 -- ✅ 用 a
WHERE a=1 AND b=2         -- ✅ 用 a,b
WHERE a=1 AND b>2 AND c=3 -- ⚠️ 用 a,b；c 无法用于索引定位（b 是范围，c 全局无序）
WHERE b=2                 -- ❌ 跳过 a，用不上（除非索引跳过扫描/index skip scan，MySQL 8.0.13+ 才有，且代价高）
WHERE a=1 AND c=3         -- ⚠️ 只能用到 a，c 退化为回表后过滤
WHERE a=1 AND b=2 ORDER BY c -- ✅ 排序也能用索引（省掉 filesort）
${F}

**区分度与顺序设计**：把**区分度高**（基数大）的列放前面、等值查询的列放前面、范围查询的列放最后。但现实约束是「是否要覆盖排序」——如果业务固定按 ${C}create_time${C} 倒序分页，把时间放最后能省掉 filesort，这往往比区分度更重要。

### 三、索引下推（ICP）与覆盖索引

**ICP（Index Condition Pushdown，MySQL 5.6+）**：把 WHERE 中「能用索引列判断」的部分**下推到存储引擎层**过滤，减少回表次数。

${F}sql
-- 索引 (name, age)
SELECT * FROM user WHERE name LIKE '张%' AND age = 25;
-- 无 ICP：先在索引找到所有「张%」，逐条回表取整行，再在 Server 层过滤 age=25
-- 有 ICP：在索引层就判断 age=25（Extra 显示 Using index condition），只对命中的回表
${F}

**覆盖索引**：查询所需列全在索引里，Extra 显示 ${C}Using index${C}，**完全免回表**。这是分页优化的关键手段：

${F}sql
-- ❌ 深分页：扫描 1000010 行，丢弃 100万
SELECT * FROM t ORDER BY id LIMIT 1000000, 10;
-- ✅ 延迟关联：先用覆盖索引拿到 10 个主键，再回表取整行
SELECT t.* FROM t
JOIN (SELECT id FROM t ORDER BY id LIMIT 1000000, 10) AS x ON t.id = x.id;
-- ✅ 或用游标（记住上一页最后一个 id），彻底避免 OFFSET——推荐
SELECT * FROM t WHERE id > 1000000 ORDER BY id LIMIT 10;
${F}

### 四、EXPLAIN 关键列与坏味道

${F}sql
EXPLAIN ANALYZE SELECT ...\G    -- 8.0.18+：真实执行 + 实际行数（最有用）
EXPLAIN FORMAT=JSON SELECT ...\G -- 详细成本
${F}

| 列 | 好值 | 坏味道 |
|---|---|---|
| type | ${C}const > eq_ref > ref > range > index > ALL${C} | ${C}ALL${C}（全表）、${C}index${C}（全索引扫描） |
| key | 用到索引名 | ${C}NULL${C}（没走索引） |
| rows | 接近实际返回行数 | 估计几千却返回 5 行（统计信息过期 → ${C}ANALYZE TABLE${C}） |
| filtered | 高（接近 100） | 极低说明大量无效扫描 |
| Extra | Using index（覆盖）、Using where | Using filesort、Using temporary、Using join buffer (Block Nested Loop) |

**索引失效的六种典型**：

1. **对索引列做函数/运算**：${C}WHERE DATE(create_time) = '2026-01-01'${C} → 改成范围查询 ${C}create_time >= '2026-01-01' AND create_time < '2026-01-02'${C}；
2. **隐式类型转换**：${C}varchar_col = 123${C}（数字）→ 列被转成数字，索引失效；反之 ${C}int_col = '123'${C} 可以；
3. **前导模糊**：${C}LIKE '%abc'${C} 无法用索引（${C}'abc%'${C} 可以）；
4. **OR 连接非索引列**：一侧没索引 → 整体退化为全表；
5. **否定条件**：${C}!= / NOT IN / IS NOT NULL${C} 常常用不上（优化器判断回表不划算）；
6. **字符集/排序规则不一致的 JOIN**：${C}utf8${C} 列 JOIN ${C}utf8mb4${C} 列，无法走索引。

### 五、统计信息与优化器的误判

优化器基于**索引统计信息**（${C}innodb_stats_persistent${C} 持久化统计）估算成本。当数据分布突变（大批量导入/删除、长事务导致统计不更新）时会出现「明明有索引却选全表」或反之。

排查三连：${C}SHOW INDEX FROM t${C} 看 ${C}Cardinality${C}（应接近实际不同值数）；${C}ANALYZE TABLE t${C} 手动更新；${C}EXPLAIN ANALYZE${C} 看**估算行数 vs 实际行数**的偏差——偏差大就是统计问题。

必要时用索引提示：${C}SELECT ... FROM t FORCE INDEX (idx_a)${C}，但这只治标；根治要么更新统计，要么调整索引设计（如把两个单列索引合并成一个联合索引，让优化器少做选择）。

## 📚 延伸阅读

- MySQL 8.0 RM Ch.8 Optimization（重点：EXPLAIN、ICP、MRR、LIMIT Query Optimization）
- Ch.10 EXPLAIN Output Format：每个 type/Extra 值的官方释义
- InnoDB Ch.17「Index Structures」：B+Tree 与聚簇组织
          `
          },
          {
            id: "redis-cache",
            title: "Redis 缓存设计与一致性",
            minutes: 18,
            updated: "2026-09-17",
            applies: "Redis 7.x",
            tags: ["Redis", "缓存", "一致性"],
            terms: ["Redis", "缓存穿透", "RDB", "AOF"],
            body: `
## 官方文档基线

- **redis.io 官方文档「Data Types」**：String/List/Hash/Set/ZSet/Stream/Bitmap/HyperLogLog 的官方教程页；
- **「Persistence」**：RDB 与 AOF 的官方机制说明；
- **「Replication」**：主从复制官方文档。

缓存设计的三个层次：**选对数据结构 → 防住三大经典问题 → 想清楚与数据库的一致性**。

## 一、数据结构选型（官方 Data Types 目录）

| 结构 | 官方定位场景 |
| --- | --- |
| String | 缓存对象序列化、计数器（${C}INCR${C} 原子自增） |
| Hash | 对象字段级读写（${C}HSET/HMGET${C}，省整对象序列化） |
| List | 简单队列（新场景官方更推荐 Stream） |
| Set | 去重、交集并集（共同关注 = ${C}SINTER${C}） |
| ZSet | 排行榜、延时队列（score 排序，${C}ZRANGEBYSCORE${C}） |
| Stream | 消息队列：消费组、ACK、Pending 列表 |
| Bitmap/HLL | 签到、UV 估算（HLL 固定 12KB，误差 ~0.8%） |

**过期与淘汰**：过期删除 = 惰性（访问时检查）+ 定期抽样；内存满后按 ${C}maxmemory-policy${C} 淘汰——缓存场景选 ${C}allkeys-lru${C} 或 ${C}volatile-lru${C}，需要精确语义的存储场景别把 Redis 当唯一存储。

## 二、缓存三大问题（背也要按机制背）

**① 穿透**（查不存在的数据，绕过缓存直击 DB）：

- 空值缓存：查不到也写 ${C}key→null${C}，短 TTL；
- 布隆过滤器：前置判断「一定不存在」的请求直接拒绝（允许误判存在）；
- 参数校验：非法 id 在入口拦掉。

**② 击穿**（热点 key 过期瞬间，并发全打到 DB）：

- 互斥重建：${C}SET NX${C} 抢重建锁，其他线程短暂自旋读旧值；
- 逻辑过期：物理永不过期，value 里带过期时间，发现过期异步重建。

**③ 雪崩**（大量 key 同时过期 / Redis 整体不可用）：

- TTL 加随机抖动（${C}base + random(0, 300s)${C}）；
- 高可用（哨兵/集群）+ 服务端限流兜底 + 多级缓存（本地 Caffeine 挡一层）。

## 三、Cache-Aside 与一致性（争议最大的部分）

标准读写流程：

${F}
读：先缓存 → 命中返回；未命中查 DB → 回填缓存
写：先更新 DB → 再删除缓存（del，不是更新！）
${F}

**为什么是「删缓存」不是「更新缓存」**：并发写时更新缓存可能乱序落进旧值（A 先写 DB、B 后写 DB 但先写缓存，缓存最终是 A 的旧值）；删除是幂等的，下个读请求自然回填新值。

**为什么先 DB 后删**：反过来的窗口更大——删完缓存后、DB 提交前的读请求会把**旧 DB 数据**回填进缓存，且常驻到 TTL。先更新 DB 再删，最坏情况只是短暂不一致（需要配合「读请求回填时加短暂 TTL」兜底）。

**进一步加固**（按投入递增）：

1. **延迟双删**：写后删一次，延迟几百毫秒再删一次，覆盖并发读的回填；
2. **订阅 binlog 异步删**（Canal）：把「删缓存」从业务代码里解耦，可靠且可重试；
3. 设置**兜底 TTL**：任何缓存条目都必须有过期时间，一致性方案全挂时还有 TTL 兜底。

## 四、持久化与主从（官方 Persistence / Replication 章）

- **RDB**：定时全量快照，恢复快，但两次快照之间的数据会丢；
- **AOF**：追加写命令，官方推荐 ${C}appendfsync everysec${C}——最多丢 1 秒，性能损耗可接受；重写（rewrite）压缩体积；
- 两者可同时开启，恢复时优先 AOF；
- **主从复制**：初次全量（RDB + 缓冲）、后续命令传播；**哨兵（Sentinel）**负责故障自动转移与通知；
- 读从库要注意**复制延迟**：写后立刻读的场景读主库，或用官方 ${C}WAIT${C} 命令确认同步。

## ⚠ 高频误区

1. **线上用 ${C}KEYS *${C}**：O(N) 全量阻塞主线程，官方文档明确仅调试用；生产用 ${C}SCAN${C} 增量游标。
2. **大 key 不治理**：百 MB 的 Hash/List 一次 ${C}HGETALL${C}/删除就卡住整个实例；用 ${C}--bigkeys${C} 排查，业务上拆分。
3. **把 Redis 当强一致存储**：主从异步复制，故障转移可能丢最新写入——资金类数据必须落 DB。
4. **缓存永不过期又没有更新机制**：改了字段全靠发版清缓存。
5. **删除大 key 用 ${C}DEL${C}**：阻塞；用 ${C}UNLINK${C}（异步删除，官方 API）。
6. **更新缓存而不是删除**：并发写乱序写入旧值（本章第三节）。

## ✅ 自检清单

- [ ] 每个缓存 key 都有 TTL；热点 key 有互斥/逻辑过期保护
- [ ] 写路径是「先 DB 后删缓存」，关键场景配 binlog 订阅或延迟双删
- [ ] 生产禁用 KEYS，代码扫描里有这条规则
- [ ] bigkeys 常态化巡检，删除一律 UNLINK
- [ ] 说得清自己系统的缓存丢失窗口（everysec ≈ 1s）并确认业务可接受

<!--dd:redis-cache-->

## 🔬 深挖：底层结构、过期淘汰与缓存三兄弟

### 一、八种数据类型的底层编码

| 类型 | 底层编码 | 转换阈值 |
|---|---|---|
| String | int / embstr / raw | 整数用 int；≤44 字节用 embstr（一次分配），更长用 raw |
| List | listpack / quicklist | 元素少且小 → listpack；否则 quicklist（listpack 组成的双向链表） |
| Hash | listpack / hashtable | ${C}hash-max-listpack-entries 128${C} 且值 ≤64 字节 |
| Set | intset / listpack / hashtable | 全整数用 intset；大集合用 hashtable |
| ZSet | listpack / skiplist+dict | 跳表负责范围查询（O(logN)），字典负责按成员查分数（O(1)） |
| Stream | radix tree + listpack | 消息队列场景 |
| Bitmap / HLL / GEO | 基于 String 的位运算 / 概率 / 有序分数 | —— |

**为什么 ZSet 同时用跳表和字典**：单用跳表按成员查分数是 O(logN)，单用字典做范围查询要排序。两者组合各取所长、只额外存一份指针，是「用空间换双最优」的经典设计。

**SDS（简单动态字符串）相对于 C 字符串的三个改进**：① 记录 ${C}len${C}（O(1) 取长度）；② 预留空间（追加不必每次 realloc）；③ 二进制安全（不靠 ${C}\0${C} 结尾，能存图片/序列化数据）。这也是「Redis 能存任意二进制」的原因。

### 二、过期策略与淘汰策略（两件不同的事）

${F}
过期删除（对「已到期」的 key）：
  惰性删除：访问时才检查是否过期（省 CPU，可能漏）
  定期删除：每 100ms 随机抽查部分设置了 TTL 的 key 并删除
  → 两者配合：不保证「过期即释放」，所以内存可能被已过期的 key 短暂占用

内存淘汰（对「内存满了」时选谁删）：
  maxmemory-policy:
    noeviction        默认，写入报错 OOM command not allowed
    allkeys-lru       所有键里按最近最少使用淘汰  ← 纯缓存场景首选
    volatile-lru      只在设了 TTL 的键里淘汰（没设 TTL 的永不被淘汰，容易撑爆）
    allkeys-lfu       按访问频次淘汰（应对「偶发批量扫描污染 LRU」更稳，4.0+）
    volatile-ttl      优先淘汰剩余寿命短的
    allkeys-random / volatile-random
${F}

**实践口径**：纯缓存用 ${C}allkeys-lru${C}；Redis 同时存持久数据（如队列、锁、配置）时用 ${C}volatile-lru${C} 并**确保缓存键都设了 TTL**（否则内存满了会报错）。LFU 的两个参数要一起调：${C}lfu-log-factor${C}（计数器增速）与 ${C}lfu-decay-time${C}（衰减周期）。

⚠️ Redis 的 LRU 是**近似 LRU**：采样（默认 5 个）后挑最久未用的，而不是维护全局链表——为了省内存与 CPU。所以「刚写入的 key 被淘汰」是可能的，这也解释了为什么热点数据的 TTL 不宜过短。

### 三、持久化：RDB 与 AOF 的取舍

| 维度 | RDB | AOF |
|---|---|---|
| 形式 | 某时刻的**数据快照**（二进制） | **写命令追加**（文本，可读） |
| 触发 | ${C}save${C}（阻塞）/ ${C}bgsave${C}（fork 子进程）/ 自动阈值 | ${C}appendfsync${C} 策略 |
| 恢复速度 | 快（直接加载） | 慢（重放命令） |
| 数据安全性 | 差（可能丢两次快照间的数据） | 好（everysec 最多丢 1 秒） |
| 体积 | 小 | 大 |
| 代价 | fork 时 COW 复制页表，大内存下 fork 可能卡顿 | 重写时同样 fork；fsync 频繁伤盘 |

**bgsave 的 COW 陷阱**：fork 出的子进程与父进程**共享内存页**，父进程一旦写入某页就复制一份——所以「写操作越多，快照期间内存峰值越高」。经验值：预留 ${C}maxmemory${C} 的 50% 以上空闲内存，并把 ${C}vm.overcommit_memory=1${C} 打开，否则 fork 可能失败。

**混合持久化（4.0+，推荐）**：${C}aof-use-rdb-preamble yes${C}——AOF 文件前半是 RDB 格式的全量快照、后半是增量命令。兼得「恢复快」与「丢数据少」。

${C}appendfsync${C} 三档：${C}always${C}（每个写都 fsync，最安全、性能最差）、${C}everysec${C}（默认，最多丢 1 秒）、${C}no${C}（交给 OS，可能丢 30 秒）。

### 四、缓存三兄弟与热 key

| 问题 | 表现 | 解法 |
|---|---|---|
| **穿透** | 查不存在的 key，每次都打到 DB | ① 缓存空值（短 TTL）；② 布隆过滤器前置拦截；③ 参数校验 |
| **击穿** | 某个热点 key 过期瞬间，大量并发同时回源 | ① 互斥锁（只放一个线程回源，其余等待后重试）；② 逻辑过期（value 里带过期时间，异步更新，永不物理过期） |
| **雪崩** | 大量 key 同一时刻过期 / Redis 宕机 | ① TTL 加随机抖动；② 多级缓存（本地 Caffeine + Redis）；③ 熔断降级（Redis 挂了直接读 DB 并限流保护） |

**逻辑过期 vs 互斥锁**的选择：逻辑过期**不阻塞请求**（返回旧数据 + 异步刷新），适合对实时性容忍度高的展示型数据；互斥锁**阻塞但数据新鲜**，适合一致性要求高的场景。

**热 key 的发现与治理**：${C}redis-cli --hotkeys${C}（需 LFU）、${C}MONITOR${C}（仅短时诊断，对性能影响大）、客户端埋点统计。治理手段：**本地缓存**（JVM 内 Caffeine，穿透 Redis 层）、**key 加随机后缀拆分**（把 1 个热 key 拆成 N 个分散到不同分片）、读写分离（从节点分担读）。

### 五、单线程模型与「为什么还会慢」

Redis 的「单线程」特指**命令执行**是单线程的（6.0 起网络 IO 可多线程，但命令执行仍单线程）。好处是免锁、天然原子、可预测；代价是**任何慢命令都会阻塞所有后续请求**。

五个必须避开的慢命令/操作：

1. ${C}KEYS *${C} → 用 ${C}SCAN${C} 游标迭代（注意 SCAN 不保证返回全部，需循环到游标 0）；
2. 大集合的 ${C}SMEMBERS / HGETALL / LRANGE 0 -1${C} → 分页或 ${C}SSCAN/HSCAN${C}；
3. ${C}DEL${C} 一个百万元素的 key → 用 ${C}UNLINK${C}（异步释放）；
4. 大 key 的 ${C}ZADD/ZRANGE${C} → 拆分业务 key（按时间/用户分桶）；
5. 事务里塞多命令、Lua 脚本过长 → 拆小，或改用 pipeline 分摊 RTT。

**排查工具**：${C}SLOWLOG GET 10${C}（${C}slowlog-log-slower-than 10000${C} 即 10ms 记录）、${C}INFO commandstats${C}（按命令看平均耗时）、${C}LATENCY DOCTOR${C}。判断「大 key」用 ${C}redis-cli --bigkeys${C} 或 ${C}MEMORY USAGE <key>${C}。

## 📚 延伸阅读

- redis.io/topics：Data Types Tutorial / Persistence / Replication / Sentinel
- Redis 官方「Distributed Locks」页（下一章的主角）
- 《Redis 深度历险》：结构原理部分与官方文档互为印证
          `
          },
          {
            id: "mq-async",
            title: "消息队列与异步化",
            minutes: 18,
            updated: "2026-09-17",
            applies: "RabbitMQ 3.13 / Kafka 3.x",
            tags: ["MQ", "Kafka", "RabbitMQ", "可靠性"],
            terms: ["消息队列", "Kafka", "RabbitMQ", "幂等消费"],
            body: `
## 官方文档基线

- **RabbitMQ 官方「Reliability Guide」**：把可靠性按「发布 → 存储 → 消费」三段拆解，是本章主线；
- **Apache Kafka 官方「Design」/「Implementation」文档**：交付语义（delivery semantics）的官方定义。

MQ 的价值三件事：**解耦、削峰、异步**。但每件事的代价都是「把同步的确定性换成异步的复杂性」——可靠性设计就是为此买单的方式。

## 一、可靠性三段论（RabbitMQ Reliability Guide 原文结构）

**① 生产端不丢**：publisher confirm——broker 收到并落盘后回执；无法路由的消息用 ${C}mandatory${C} + return 回调感知。

**② 存储端不丢**：队列与消息都持久化（durable + persistent）；RabbitMQ 官方明确「fsync 刷盘窗口仍可能丢少量」，金融级要配合镜像/仲裁队列（quorum queue，官方现推荐）。

**③ 消费端不丢**：手动 ACK，处理成功才确认；失败进重试，多次失败进死信队列（DLX）人工介入。

Kafka 的对应物：

${F}java
producer.send(rec, (meta, e) -> { if (e != null) retryOrLog(meta, e); });  // 带回调
// 生产端不丢三件套：
props.put("acks", "all");                      // 所有 ISR 副本确认
props.put("enable.idempotence", "true");       // 幂等生产者，防 broker 重复
props.put("retries", Integer.MAX_VALUE);
// broker 端：min.insync.replicas=2 与 replication.factor=3 配套
// 消费端：手动位移提交，处理完再 commit
${F}

## 二、交付语义（Kafka 官方 Design 文档的定义）

| 语义 | 含义 | 实现方式 |
| --- | --- | --- |
| at-most-once | 可能丢，不重复 | 自动提交、失败不重试 |
| at-least-once | 不丢，可能重复 | 手动提交 + 重试（**最常用**） |
| exactly-once | 精确一次 | 幂等生产者 + 事务（Kafka 流内部），**跨系统仍需消费端幂等** |

**关键认知**：exactly-once 只在 Kafka 体系内成立。跨到 MySQL、ES 的最终落库，永远要靠消费端幂等兜底——这是官方文档的表述边界，也是面试的分水岭。

## 三、顺序性

Kafka 只保证**分区内有序**：

- 需要顺序的消息（同一订单）发到同一分区：按 ${C}orderId.hashCode() % 分区数${C} 指定 partition；
- 消费端注意：分区数扩容会破坏 key→分区映射，**有顺序诉求的 topic 提前规划分区数**；
- 消费线程内再并行会破坏顺序——顺序消费用单线程或按 key 二次哈希到内存队列。

## 四、重试、死信与积压治理

**重试设计**：重试队列分级（5s / 30s / 5min），指数退避；重试会**打破顺序**，顺序场景失败只能阻塞等待。

**死信（DLQ）**：超过最大重试进死信 + 告警，人工处理；没有 DLQ 的重试等于无限循环。

**积压处理**（线上必考）：

${F}
1. 定位：消费慢 or 生产暴增？
2. 消费慢 → 加消费者（受限于分区数）→ 扩分区 / 批量拉取批量处理
3. 暴增且可丢 → 降级非核心消费
4. 兜底 → 离线批量脚本直扫 DB 补偿 + 对账
${F}

**幂等消费三件套**（下一章展开）：唯一业务键唯一约束、状态机校验、去重表。

## ⚠ 高频误区

1. **自动 ACK + 异常崩溃**：消息还没处理完就确认，丢了。
2. **重试风暴**：下游故障时无限重试放大流量，拖垮整个链路；必须限次数 + 退避。
3. **以为开了事务就是全链路 exactly-once**：跨系统落库还是要幂等。
4. **顺序消息用了并行消费**：白设计顺序，还会乱序。
5. **把 MQ 当存储**：消息是有生命周期的中转站，核心数据必须有 DB 权威副本。
6. **生产端异步 send 不看回调**：broker 拒收了你都不知道，丢得悄无声息。

## ✅ 自检清单

- [ ] 生产端 confirm/回调 + 落库补偿，消息先落库再发送（或 outbox）
- [ ] 消费端手动 ACK，失败分级重试 + 死信 + 告警
- [ ] 顺序场景 key 路由到固定分区，消费端不并行破坏顺序
- [ ] 关键消费者幂等（唯一约束/去重表），重投 10 次结果不变
- [ ] 有积压监控与预案（扩分区/降级/补偿脚本）

<!--dd:mq-async-->

## 🔬 深挖：消息不丢的三段链路与顺序性

### 一、「消息不丢」必须端到端三段都成立

${F}
生产者 ──①──> Broker ──②──> 磁盘/副本 ──③──> 消费者
① 生产确认：acks=all + 重试 + 幂等生产者
② Broker 侧：刷盘策略 + 副本数 + min.insync.replicas
③ 消费确认：手动 ack + 处理成功后才提交位点
${F}

**任一环断裂都会丢消息**，所以要逐段核验：

| 环节 | 丢失场景 | 配置要点 |
|---|---|---|
| ① 生产 | ${C}acks=1${C}（leader 写完即回）、失败不重试、缓冲区满被丢弃 | Kafka：${C}acks=all${C} + ${C}retries${C} + ${C}enable.idempotence=true${C}；RabbitMQ：publisher confirm + mandatory |
| ② Broker | 异步刷盘（OS 缓存未落盘宕机）、副本未同步就切主 | Kafka：${C}min.insync.replicas >= 2${C} + ${C}replication.factor >= 3${C} + ${C}unclean.leader.election.enable=false${C}；RabbitMQ：镜像/仲裁队列 + persistent 消息 |
| ③ 消费 | 先提交位点后处理（处理失败就丢了）、先 ack 后业务入库 | Kafka：${C}enable.auto.commit=false${C}，处理完成再手动 commit；RabbitMQ：${C}basicAck${C} 放在业务成功之后 |

**关键权衡**：${C}acks=all + min.insync.replicas=2${C} 保证了不丢，但**可用性下降**——3 副本中挂 2 个就无法写入。这是 CAP 的真实代价，必须与业务确认「能接受写不可用还是能接受丢消息」。

### 二、至少一次 → 幂等消费

既然选了不丢（at-least-once），就必然**可能重复**（重试、rebalance、ack 丢失）。所以幂等不是可选项，而是必选项：

${F}java
// 方案 A：去重表（推荐，通用）
// message_id 建唯一索引，插入成功才处理，重复插入抛 DuplicateKeyException 直接 ack
@Transactional
public void consume(Msg msg) {
    try {
        dedupMapper.insert(new Dedup(msg.getId(), now()));   // 唯一索引兜底
    } catch (DuplicateKeyException e) {
        log.info("重复消息，跳过 {}", msg.getId());
        return;                                              // 视为处理成功，正常 ack
    }
    doBusiness(msg);
}

// 方案 B：业务唯一键 + 状态机（最优雅，无需额外表）
// UPDATE orders SET status='PAID' WHERE id=? AND status='UNPAID'
// 判断 affectedRows==1 才发后续动作 —— 天然幂等
${F}

**去重表的两个工程细节**：① 必须**与业务在同一事务**里（否则业务成功、去重记录失败 → 下次重复处理）；② 需要**定期清理**（按时间分区或定期删除 7 天前记录），否则表无界增长。

### 三、顺序性：Kafka 的保证边界

Kafka 只能保证**单分区内有序**，跨分区不保证。所以「同 key 的消息必须有序」的实现就是**用业务主键做分区键**：

${F}java
// 同一订单的所有事件必须进同一个分区
ProducerRecord<String, String> rec =
    new ProducerRecord<>("order-events", orderId, payload);   // key = orderId
// 默认分区器：hash(key) % numPartitions → 同 key 必同分区 → 分区内有序
${F}

**三个会破坏顺序的陷阱**：
1. ${C}max.in.flight.requests.per.connection > 1${C} 且未开幂等 → 重试导致乱序（开 ${C}enable.idempotence=true${C} 后 Kafka 会保证顺序）；
2. 生产者**自定义分区器**用了轮询 → 同 key 被分散；
3. 消费端**多线程处理**同一个分区内的消息 → 处理完成顺序不确定。要么单线程消费单分区（慢但有序），要么在应用层做「按 key 路由到固定线程/队列」（内存队列哈希分桶）。

**代价提醒**：为了让 key 有序，必须接受「热点 key 导致分区倾斜」——大客户一个分区、小客户挤在另一个。解法是给 key 加业务维度前缀（如 ${C}orderId + shardId${C}），但那样就不保证全局有序了，需回到业务确认「是否真的需要全局有序」。

### 四、RabbitMQ 的路由模型与死信

${F}
Producer → Exchange（按 type + routingKey 决定去哪）→ Queue → Consumer
Exchange 类型：
  direct  精确匹配 routingKey
  topic   通配匹配（order.*.paid、order.#）
  fanout  广播到所有绑定队列（忽略 routingKey）
  headers 按消息头匹配（少用）
${F}

**死信队列（DLX）** 是必配的兜底——消息进入死信的三条路径：① 被拒绝（${C}basicNack requeue=false${C}）或 ${C}basicReject${C}；② 消息 TTL 过期；③ 队列达到最大长度被丢弃。配置：

${F}java
// 业务队列绑定死信交换机，消费失败 nack 不带 requeue → 进死信队列人工排查
@Bean
public Queue orderQueue() {
    return QueueBuilder.durable("order.queue")
        .withArgument("x-dead-letter-exchange", "dlx.exchange")
        .withArgument("x-dead-letter-routing-key", "order.dead")
        .withArgument("x-message-ttl", 60000)         // 消息最长活 60s
        .withArgument("x-max-length", 100000)          // 队列上限
        .build();
}
${F}

**重试策略必须是「有限次 + 指数退避 + 最终进死信」**：无脑 ${C}requeue=true${C} 会让一条坏消息无限循环，把消费者 CPU 打满（消息毒丸）。

### 五、积压与容量

积压的三个成因与处置：

| 成因 | 现象 | 处置 |
|---|---|---|
| 消费能力不足 | 消费速率 < 生产速率，lag 持续增长 | 加消费者（**不超过分区数**，Kafka 一个分区只被组内一个消费者消费）→ 加分区 |
| 消费卡住 | lag 突然陡增且不动 | 查消费线程栈（下游 DB/HTTP 超时）、查是否死锁 |
| 突发流量 | 短时 lag 高但自动回落 | 无需处理，但要设告警阈值 |

**容量估算**：分区数 = ${C}目标吞吐 / 单分区吞吐${C}，并预留 2~3 倍余量（分区数只能增不能减，且增加会破坏 key 的顺序保证，需谨慎）。Kafka 单分区顺序写吞吐可观，但**分区过多**会拖慢 leader 选举与 rebalance（建议单 broker 不超过 2000~4000 分区）。

**积压时的应急消费**：把消息拉出来批量处理**跳过非关键逻辑**（但要记录跳过了什么）、增大 ${C}max.poll.records${C} 与并行度、必要时起临时消费组把消息搬到临时队列（避免阻塞主链路）。

## 📚 延伸阅读

- RabbitMQ 官方 Reliability Guide / Quorum Queues / Consumers Acknowledgement
- Kafka 官方 Design 文档（delivery semantics）与 javadoc：KafkaProducer 的 acks/idempotence 说明
- microservices.io「Transactional Outbox」「Idempotent Consumer」pattern 页
          `
          },
          {
            id: "distributed-lock-idempotent",
            title: "分布式锁与幂等设计",
            minutes: 18,
            updated: "2026-09-17",
            applies: "Redis 7.x / MySQL / Seata",
            tags: ["分布式锁", "幂等", "Redis"],
            terms: ["分布式锁", "Redlock", "幂等", "fencing token"],
            body: `
## 官方文档基线

- **Redis 官方「Distributed Locks」页**：正确实现、Redlock 算法、以及官方对争议的表述；
- **Martin Kleppmann《How to do distributed locking》**：对 Redlock 安全性的著名质疑与 fencing token 方案（Redis 官方页面直接回应过此文）；
- **Stripe API 文档「Idempotency」**：幂等键机制的工业级范例；
- **microservices.io「Idempotent Consumer」pattern**。

## 一、分布式锁的正确姿势（Redis 官方页逐条对应）

官方给出的单实例正确实现要点：

1. **加锁必须原子**：${C}SET lockKey uniqueValue NX PX 30000${C}——加锁 + 过期时间一条命令，分开写（SETNX 再 EXPIRE）在两步之间崩溃就留下死锁；
2. **value 必须唯一**（UUID/请求 ID）：释放时校验是不是自己的锁，防止 A 超时后误删 B 的锁；
3. **释放必须原子**：校验 + 删除用 Lua 脚本包裹（GET 比对后 DEL，两步不是原子就会误删）：

${F}lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
${F}

4. **看门狗续期**：业务没执行完锁先过期怎么办？Redisson 的 watchdog 线程定期延长持有中的锁——用成熟客户端而不是自己裸写。

**Redlock 与 fencing token（官方页 + Kleppmann 之争）**：Redlock 用多数派（≥N/2+1 个独立实例加锁成功）提高单点故障下的可用性。Kleppmann 的质疑核心：**进程 pauses（GC 停顿）可以让「持有有效锁」的客户端在锁过期后继续操作**，锁无法提供完全的正确性保证。工程结论：

- 锁用来做**效率优化**（防重复计算）：单实例 Redis 锁足够；
- 锁用来做**正确性保证**（不能出错的操作）：锁之外必须有 **fencing token**（单调递增令牌，存储侧校验令牌拒绝旧请求）或业务侧幂等兜底。

## 二、幂等：比锁更可靠的最终答案

**幂等 = 同一操作执行 N 次与执行 1 次结果相同**。重试普遍存在（网络超时 ≠ 失败），所以幂等是分布式系统的**必修课**，锁只是并发防线之一。

四种落地方式（从简单到完备）：

**① 数据库唯一约束**：${C}order_no${C} 建唯一索引，重复插入直接报错——最简单最可靠，一切方案的兜底。

**② 状态机**：${C}UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'unpaid'${C}，影响行数 = 0 就是重复请求，天然幂等。

**③ 幂等键（Stripe 模式）**：客户端生成唯一 ${C}Idempotency-Key${C} 头，服务端首次处理时把「key → 响应」存起来，重放直接返回上次响应（含错误响应，Stripe 连 5xx 都会重放）。

**④ Token 机制**：进入页面先领一次性 token，提交时校验并删除（原子操作），重复提交因 token 已删而失败。

## 三、秒杀减库存：锁 + 幂等协同的完整案例

${F}java
// ① 幂等：请求去重（userId+skuId 唯一约束）
// ② 锁：Redis 锁挡住并发（效率层）
Boolean locked = redis.setIfAbsent("lock:seckill:" + skuId, reqId, Duration.ofSeconds(3));
if (Boolean.FALSE.equals(locked)) return Result.busy();
try {
    // ③ 最终防线：DB 层原子扣减，防超卖
    int n = jdbc.update(
        "UPDATE stock SET num = num - 1 WHERE sku_id = ? AND num > 0", skuId);
    if (n == 0) return Result.soldOut();
    orderService.create(req);                       // 唯一约束兜底幂等
} finally {
    releaseLock("lock:seckill:" + skuId, reqId);    // Lua 校验后删
}
${F}

注意：即使 Redis 锁全部失效，第 ③ 步的原子 UPDATE 也保证了不超卖——**锁只是减少无效竞争，正确性永远在数据库的原子操作和唯一约束上**。

## ⚠ 高频误区

1. **SETNX 和 EXPIRE 分两步**：经典死锁现场。
2. **释放锁不校验 value**：超时后误删别人的锁，锁形同虚设。
3. **以为拿到锁就绝对安全**：GC pause / 时钟漂移可能让「持锁人」在锁过期后继续操作——正确性场景必须幂等兜底。
4. **幂等只做前端防抖**：双击挡得住，网络重试挡不住。
5. **幂等键有过期却无清理**：去重表无限膨胀，先想好清理策略。
6. **锁的粒度到全局**：所有请求抢同一把锁等于单线程；按业务键（skuId、orderId）加锁。

## ✅ 自检清单

- [ ] 加锁是单条 SET NX PX，释放走 Lua 校验，value 全局唯一
- [ ] 明确知道自己系统里每把锁是「效率锁」还是「正确性锁」，正确性锁有幂等兜底
- [ ] 每个写接口都有幂等方案：唯一约束 / 状态机 / 幂等键 至少其一
- [ ] 用过 Redisson watchdog，锁超时与业务耗时匹配过评估
- [ ] 锁粒度按业务键，压测验证过并发吞吐

<!--dd:distributed-lock-idempotent-->

## 🔬 深挖：分布式锁的正确姿势与幂等设计

### 一、Redis 锁的四个必备条件

${F}java
// ✅ 完整正确的 Redis 分布式锁
public boolean tryLock(String key, String requestId, long expireMs) {
    // ① SET NX PX 原子（不要用 SETNX + EXPIRE 两条命令！
    //    中间宕机会导致锁永不过期）
    String r = jedis.set(key, requestId, "NX", "PX", expireMs);
    return "OK".equals(r);
}

private static final String UNLOCK_LUA =
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +   // ② 校验持有者
    "  return redis.call('del', KEYS[1]) else return 0 end";

public boolean unlock(String key, String requestId) {
    // ③ Lua 脚本保证「比对 + 删除」原子性（不能用 get 后 del，两步之间锁可能已过期易主）
    Object r = jedis.eval(UNLOCK_LUA, Collections.singletonList(key),
                          Collections.singletonList(requestId));
    return Long.valueOf(1).equals(r);
}
// ④ value 必须是唯一 requestId（UUID），否则会误删别人的锁
${F}

**四个必备条件**：原子加锁（SET NX PX 一条命令）、唯一持有者标识、原子释放（Lua）、**过期时间**（防死锁）。少任何一条都有对应的事故场景。

### 二、锁续期（看门狗）与 Redlock 争议

TTL 设短了业务没跑完锁就过期（两个线程同时持锁）；设长了进程崩溃后要等很久才能恢复。**Redisson 的看门狗**机制：加锁成功后台起定时任务，每 ${C}TTL/3${C} 续期一次直到释放；只有不显式指定 ${C}leaseTime${C} 时看门狗才生效（指定了就不续期）。

**Redlock 的争议要点（面试常问）**：Redis 作者 Antirez 提出向 N 个独立 master 依次加锁、多数成功才算成功；分布式系统专家 Kleppner 指出它**依赖时钟假设**且无法防 GC 停顿/网络延迟导致的租约失效。结论口径：**对绝对正确性有要求的场景，锁应有「fencing token」兜底**（每次加锁拿到单调递增的版本号，写存储时带上版本号，存储侧拒绝更旧版本），或直接用 **ZooKeeper（临时顺序节点）+ etcd（Lease）** 这类共识系统。

### 三、锁的适用边界：锁 ≠ 事务

分布式锁只解决「同一时刻只有一个执行者」，**不解决**：锁内多个操作的原子性（需要事务）、锁过期的业务延续（需要 fencing/幂等）、以及性能瓶颈（串行化的吞吐上限）。

**最重要的实践结论**：能用**幂等 + 唯一约束**替代锁，就不要用锁。

${F}sql
-- 用数据库唯一索引兜底，比分布式锁更简单、更可靠（不依赖外部组件）
ALTER TABLE coupon_record ADD UNIQUE KEY uk_user_coupon (user_id, coupon_id);
-- 并发领取时只有一个成功，其余抛 DuplicateKeyException → 友好提示「已领取」
${F}

数据库唯一索引的优势：**不依赖时钟、不依赖网络、不依赖额外中间件**，且本身就在事务里。它的局限是「热点行写入」会串行化（高并发下用「唯一约束 + 分段队列异步落库」缓解）。

### 四、幂等设计的三种武器

| 武器 | 原理 | 适用 |
|---|---|---|
| **唯一约束** | 数据库唯一索引，插入冲突即重复 | 创建类操作（下单、领券、支付单） |
| **幂等键（业务唯一号）** | 客户端生成 requestId，服务端去重表/缓存判重 | 开放 API、支付回调、消息消费 |
| **状态机 + 乐观锁** | 只允许特定前置状态的流转 | 订单状态、审核流程、退款 |

${F}sql
-- 状态机 + 乐观锁：只允许 UNPAID → PAID，天然幂等
UPDATE orders SET status = 'PAID', paid_at = NOW(), version = version + 1
WHERE id = ? AND status = 'UNPAID';
-- affectedRows = 0 → 说明已被处理过（或状态非法）→ 直接返回成功，不报错
${F}

**幂等键的三个设计要点**：① 键的生成方是**发起方**（客户端或上游服务），服务端不生成；② 键必须**可复现**（重试时还是同一个键，否则等于没做）；③ 去重记录要有**足够的保留窗口**（至少覆盖最长重试周期，通常 24h~7d），窗口外重复则视为新请求。

### 五、一个完整的幂等接口骨架

${F}java
public Result pay(String requestId, PayCmd cmd) {
    // ① 前置校验：参数与权限
    validate(cmd);

    // ② 幂等表插入（唯一索引 uk_request_id）
    try {
        idempotentMapper.insert(new IdemRecord(requestId, "PAY", Status.PROCESSING, now()));
    } catch (DuplicateKeyException e) {
        IdemRecord old = idempotentMapper.selectByRequestId(requestId);
        if (old.getStatus() == Status.SUCCESS) return Result.ok(old.getResult());  // 已成功，直接回原结果
        if (old.getStatus() == Status.PROCESSING) return Result.of("处理中，请稍后查询"); // 不放行重复执行
        // FAILED 允许重试：更新为 PROCESSING 并继续
    }

    try {
        doPay(cmd);                                             // ③ 真实业务
        idempotentMapper.markSuccess(requestId, resultJson);     // ④ 记录结果
        return Result.ok(resultJson);
    } catch (Exception e) {
        idempotentMapper.markFailed(requestId, e.getMessage());   // ⑤ 标记失败，允许重试
        throw e;
    }
}
${F}

注意「PROCESSING 状态不放行」这一点——很多实现只做「查不到就执行」，导致并发重复请求同时穿透。必须**先占位、再执行**。

## 📚 延伸阅读

- redis.io「Distributed Locks」：官方实现要点与 Redlock 全文
- Martin Kleppmann《How to do distributed locking》（ fencing token 论证）
- Stripe API Reference：Idempotent Requests 章节
- microservices.io：Idempotent Consumer / Saga 相关 pattern
          `
          }
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "能做架构决策与技术攻坚：JVM 实战排查、分库分表、分布式事务、高并发设计与容量规划。",
        chapters: [
          {
            id: "jvm-troubleshoot",
            title: "JVM 调优实战与故障排查",
            minutes: 20,
            updated: "2026-09-17",
            applies: "HotSpot / JDK 17+",
            tags: ["JVM", "排障", "JFR", "OOM"],
            terms: ["JVM", "OOM", "jstack", "JFR"],
            body: `
## 官方文档基线

- **官方《Troubleshooting Guide for HotSpot VM》**：按故障类型（崩溃/OOM/挂起/泄漏）给标准排查路径；
- **${C}jcmd${C} / ${C}jmap${C} / ${C}jstack${C} / ${C}jstat${C} 工具文档**：JDK 自带排障工具的官方用法；
- **Java Flight Recorder (JFR) 与 Mission Control**：官方低开销持续诊断方案（JDK 11 起开源免费）。

排障的核心不是背工具，是**分类故障 → 沿官方给出的标准路径走**。

## 一、故障分类与第一动作

| 症状 | 第一动作 | 常见根因 |
| --- | --- | --- |
| OOM: Java heap space | 拿 dump 看支配树 | 泄漏 / 堆真的不够 / 大查询 |
| OOM: Metaspace | dump + 类加载统计 | 动态代理类膨胀、Groovy/反射滥用 |
| OOM: unable to create native thread | 数线程 ${C}ulimit -u${C} | 线程池泄漏、无界创建 |
| CPU 100% | top → jstack | 死循环 / 正则回溯 / GC 打满 |
| 频繁 Full GC | GC 日志 | to-space exhausted、大对象、内存不足 |
| 服务假死无响应 | jstack 看线程状态 | 死锁、连接池耗尽、下游无超时 |

## 二、CPU 100% 标准定位流程（五分钟版）

${F}
1. top -Hp <pid>                    # 找到最耗 CPU 的线程 TID（十进制）
2. printf '%x\\n' <TID>              # 转十六进制
3. jstack <pid> | grep -A 20 '0x<hex>'   # 定位线程栈帧
4. 栈指向业务代码 → 看循环/正则；指向 GC 线程 → 转 GC 排查
${F}

**正则回溯**是 CPU 打满的经典元凶：${C}(a+)+${C} 这类嵌套量词遇到 crafted 输入会指数级回溯。修复：改写正则或加输入长度上限。

## 三、堆转储与泄漏分析

${F}
jcmd <pid> GC.heap_dump /dumps/heap.hprof      # 推荐用 jcmd（比 jmap 参数更现代）
jmap -histo:live <pid> | head                   # 快速看实例数 Top（先触发 Full GC，注意影响）
jcmd <pid> VM.native_memory summary             # 需启动参数 NativeMemoryTracking
${F}

**MAT（Eclipse Memory Explorer）分析三步**：

1. **Leak Suspects** 报告：嫌疑最大的泄漏点；
2. **支配树（Dominator Tree）**：谁「扣住」了最多内存——按 Retained Heap 排序，第一名通常是答案；
3. **GC Roots 引用链**：这个大对象为什么没被回收——静态集合、ThreadLocal、缓存、监听器是四大来源。

**经典泄漏模式**：本地缓存自己实现不用过期（Map 越挂越大）、ThreadLocal 不 remove、类加载器泄漏（每次热部署生成新 Class）、连接/流未关闭。

## 四、JFR：现代排障的正确姿势（官方推荐）

JFR 开销 <1%，可以**常驻生产**：

${F}
-XX:StartFlightRecording=filename=start.jfr,maxsize=200m,dumponexit=true
jcmd <pid> JFR.start duration=120s filename=rec.jfr        # 按需录制
jcmd <pid> JFR.dump filename=snap.jfr                       # 事故现场导出
${F}

JMC 打开后直奔三个视图：**Allocation**（谁在分配最多）、**Method Profiling**（CPU 时间分布）、**GC Pause**（停顿分布）。相比 jstack 的瞬时快照，JFR 是「时间窗口内的行为录像」——定位间歇性毛刺的唯一利器。

## 五、GC 日志分析要点（G1 为例）

${F}
[info][gc] GC(412) Pause Young (Normal) 3072M->1024M(4096M) 45.2ms
[warn][gc] GC(430) Pause Full ...                     ← 出现 Full 就要警惕
[warn][gc] GC(431) To-space exhausted                 ← 并发标记失败信号，调优重点
${F}

关注三件事：**频率**（单位时间次数）、**停顿分布**（P99/P999，不是平均值）、**回收效率**（每次回收了多少、老年代涨速）。老年代稳定缓慢增长且 Full GC 后降不回基线 = 泄漏。

## ⚠ 高频误区

1. **生产直接 ${C}jmap -F${C} 或 dump 大堆**：会长时间停顿进程，等于制造一次事故；优先 ${C}jcmd${C}，且先摘流量。
2. **OOM 只调大内存**：泄漏调大堆只是延长复发周期，还把 dump 变大更难分析。
3. **看平均响应时间排障**：毛刺都在 P999 里，平均值是排障的最大谎言。
4. **线程栈只抓一次**：间歇性问题要隔几秒连抓 5–10 次对比，找「一直卡在同一帧」的线程。
5. **容器里 OOM 直接被杀却去查 JVM**：先看是不是 cgroup OOM（${C}dmesg | grep -i kill${C}）——是容器杀的进程，JVM 无辜。
6. **排障工具链没预装**：出事才装等于没装；基础工具与参数（OOM dump、JFR）要写在镜像里。

## ✅ 自检清单

- [ ] CPU 打满的定位五步法演练过（不是第一次现场学）
- [ ] dump/MAT 支配树分析流程跑通过，团队有人能看懂 Retained Heap
- [ ] JFR 常驻或按需录制方案已就位
- [ ] GC 日志接入了分析平台，关注 P999 而不是平均值
- [ ] 容器内存限制与 JVM 配置匹配（MaxRAMPercentage），区分过 cgroup OOM 与 JVM OOM

<!--dd:jvm-troubleshoot-->

## 🔬 深挖：线上排障的标准作业流程

### 一、工具矩阵：先分清「安全」与「高危」

| 工具 | 作用 | 是否 STW | 线上可用性 |
|---|---|---|---|
| ${C}jps -lvm${C} | 列出 Java 进程与启动参数 | 否 | ✅ 安全 |
| ${C}jstat -gcutil <pid> 1000${C} | 各代使用率与 GC 次数/耗时 | 否 | ✅ 安全，首选 |
| ${C}jstack <pid>${C} | 线程栈（锁、死锁、热点方法） | 短暂 | ✅ 基本安全 |
| ${C}jcmd <pid> <cmd>${C} | 官方统一入口（替代多数工具） | 视命令 | ✅ 推荐 |
| ${C}jmap -histo:live <pid>${C} | 类实例直方图 | **是**（触发 Full GC） | ⚠️ 慎用 |
| ${C}jmap -dump:live,...${C} | 堆快照 | **是** | ⚠️ 摘流量后再做 |
| ${C}arthas${C} | 在线诊断（trace/watch/ognl） | 部分命令会 | ✅ 强推，注意不滥用 trace 全量 |

${C}jcmd${C} 是 JDK 7+ 的推荐入口：${C}jcmd <pid> help${C} 可列出所有可用命令，比记忆一堆独立工具更好用。

### 二、CPU 飙高的标准定位流程

${F}bash
# ① 找出最耗 CPU 的进程
top -c                      # 记下 PID
# ② 找出该进程内最耗 CPU 的线程（-H 显示线程）
top -Hp <pid>               # 记下线程 TID，例如 12345
# ③ 转成 16 进制（jstack 的 nid 是 16 进制）
printf "%x\n" 12345         # → 3039
# ④ 抓线程栈并精确定位
jstack <pid> > /tmp/jstack.log
grep -A 30 "nid=0x3039" /tmp/jstack.log
# ⑤ 或一把梭（连续抓 10 次看同一线程是否霸榜）
for i in $(seq 1 10); do jstack <pid> | grep -A 12 "nid=0x3039"; sleep 1; done
${F}

常见三种结论：

| 线程栈特征 | 结论 | 处置 |
|---|---|---|
| ${C}RUNNABLE${C} + 业务方法 → 循环/正则/大计算 | 代码热点 | 优化算法或用 Arthas ${C}trace${C} 看耗时分布 |
| ${C}RUNNABLE${C} + ${C}HashMap.get${C}/链表遍历 | 哈希退化（hashCode 差） | 换 key 设计或数据结构 |
| 大量线程在 ${C}BLOCKED${C} 等待同一锁 | 锁竞争 | 缩小临界区、分段锁、异步化 |
| 频繁 Full GC（jstat 显示 FGC 高） | 内存问题伪装成 CPU 问题 | 走内存排查流程 |
| ${C}UNKNOWN${C} / 大量 native 帧 | JIT 编译线程或 GC 线程在干活 | 看 jstat 与 GC 日志确认 |

### 三、内存问题的定位：一定要看支配树

${F}bash
# ① 先看趋势（判断是泄漏还是单纯不够）
jstat -gcutil <pid> 1000 60     # 观察 60 秒，看 O 列（老年代）是否持续上升且 Full GC 后不降
# ② 导出堆（jmap -dump:live 会触发 Full GC，线上务必摘流量）
jmap -dump:format=b,file=/data/dump/heap_$(date +%s).hprof <pid>
# ③ 或用更轻量的一键脚本
jcmd <pid> GC.heap_dump /data/dump/heap.hprof
${F}

用 **MAT / Eclipse Memory Analyzer** 分析，顺序很重要：

1. **Leak Suspects** 报告（自动给出最可疑的持有链）；
2. **Dominator Tree**（按「支配内存量」排序，而不是实例数量）——这才代表「干掉它就释放多少内存」；
3. 看 **retained heap** 而不是 shallow heap；
4. 展开引用链（Path to GC Roots，排除弱引用/软引用）找到真正的持有者。

**高频泄漏模式**：静态集合只加不减、缓存无上限（缺 LRU）、ThreadLocal 未 remove、监听器注册未注销、连接/流未关闭、长生命周期对象持有短生命周期对象（如单例里存 Request）。

### 四、死锁与资源耗尽的识别

${F}bash
jstack <pid> | grep -A 30 "Found one Java-level deadlock"
jcmd <pid> Thread.print -l        # -l 会额外打印锁的持有关系
${F}

jstack 会**主动检测**并输出死锁回路（哪两个线程、各自持有/等待哪个锁）。修法是**统一加锁顺序**或用带超时的 ${C}tryLock(timeout)${C}（超时后放弃并释放已持有的锁）。

**「线程数暴涨」的排查**：${C}jstack <pid> | grep "^\\"" | wc -l${C} 数线程；按线程名前缀统计（${C}grep -o '"pool-[0-9]*'${C}）判断是哪个线程池在膨胀；常见原因是**线程池用了无界队列 + 上游超时未设**，或每次请求都 ${C}new Thread${C}。同时确认 ${C}ulimit -u${C}（最大线程数）与物理内存——**每个线程默认 1MB 栈**（${C}-Xss${C}），1000 个线程就是 1GB。

### 五、线上安全操作清单

- **任何会 STW 的操作（jmap dump、heap histogram）都先摘流量**，或在有冗余实例时逐个轮询操作；
- **先看日志与监控，再动工具**：GC 日志、应用日志的 OOM 上下文、监控的 QPS/RT/线程数曲线往往已经指出了方向；
- **保留现场**：不要急着重启（重启会丢掉所有现场），先 ${C}jstack${C} + ${C}jstat${C} + dump，再决定是否重启；
- **必须提前开启**：${C}-XX:+HeapDumpOnOutOfMemoryError${C}、GC 日志落盘轮转、${C}-XX:+ExitOnOutOfMemoryError${C}（避免半死不活）；
- **Arthas 的纪律**：${C}trace${C} 会拦截方法调用，高 QPS 方法上全量 trace 会拖慢应用，务必加 ${C}-n${C} 限制次数与 ${C}'#cost>100'${C} 条件。

## 📚 延伸阅读

- Oracle《Troubleshooting Guide for HotSpot VM》：Collectors/OOM/挂起各章节
- ${C}jcmd${C} 官方文档：${C}jcmd <pid> help${C} 列出全部子命令
- JFR Event Collection 官方文档（event 模型与内置事件清单）
- Brendan Gregg《Java Performance》（工具链部分）
          `
          },
          {
            id: "sharding-ha",
            title: "MySQL 分库分表与高可用",
            minutes: 19,
            updated: "2026-09-17",
            applies: "MySQL 8.0（Replication / Group Replication）/ ShardingSphere",
            tags: ["MySQL", "分库分表", "高可用"],
            terms: ["分库分表", "ShardingSphere", "MGR", "主从延迟"],
            body: `
## 官方文档基线

- **MySQL 8.0 Reference Manual Ch.19 Replication**：GTID、半同步、复制拓扑的官方定义；
- **Ch.20 Group Replication / InnoDB Cluster**：官方高可用方案；
- **ShardingSphere 官方文档**（shardingsphere.apache.org）：分片内核、弹性伸缩。

分库分表是「最后手段」——官方优化路径走完才轮到它：**索引/SQL 优化 → 读写分离 → 归档冷数据 → 缓存 → 才是分片**。

## 一、复制与高可用（官方两种方案）

**传统异步/半同步复制**（Ch.19）：

- 异步：主库提交即返回，从库可能滞后——主库宕机会**丢最新事务**；
- 半同步（${C}rpl_semi_sync_master${C}）：至少一个从库确认收到 binlog 才返回客户端——降低丢失窗口，但依然不是零丢失（官方文档明确了其边界）；
- **GTID**（Global Transaction Identifier）全局唯一事务号，主从切换和故障恢复不再依赖手动找 binlog 位点，官方推荐开启。

**Group Replication / InnoDB Cluster**（Ch.20）：

- 多数派协议（Paxos 变体）提交事务，保证不丢已确认事务；
- **InnoDB Cluster = Group Replication + MySQL Router + Shell**，官方的一体化方案：Router 自动路由读写、故障自动转移；
- 官方定位：单主模式（推荐）+ 多主模式（冲突处理复杂，慎用）。

## 二、主从延迟：读写分离的阿喀琉斯之踵

**成因**：从库单线程回放（8.0 有并行复制 ${C}replica_parallel_workers${C} 但受事务依赖限制）、大事务、大表 DDL。

**治理组合拳**：

1. 写后立刻读的场景**强制读主**（会话级路由或读写分离框架的 sticky 模式）；
2. 大事务拆小——一个 10 万行的 UPDATE 在从库回放就是一次全量阻塞；
3. DDL 用 ${C}gh-ost${C}/${C}pt-osc${C} 在线变更，避免锁表级延迟；
4. 监控 ${C}Seconds_Behind_Source${C} + binlog 位点差，超阈值摘掉该从库。

## 三、分库分表的决策与设计

**什么时候才分**：单表行数不是标准，**写入吞吐与磁盘/内存匹配度**才是——经验阈值（单表 1000 万级 + 写入瓶颈）只是提醒信号，先确认优化手段用尽。

**分片键选择（最重要的决定）**：

- 90% 的查询都带分片键（订单表用 ${C}user_id${C} 而不是 ${C}order_id${C}——用户查自己的订单是主路径）；
- 分片键不在查询条件里的 SQL 会**广播到所有分片**，聚合代价 O(分片数)；
- 用 ShardingSphere 时写清楚分片算法，避免随手 hash 导致的数据倾斜。

**跨片难题与对策**：

| 问题 | 对策 |
| --- | --- |
| 跨片 JOIN | 业务上反范式（冗余字段）或异构到 ES/宽表 |
| 跨片分页 | 游标（每片取 topN 合并归并排序） |
| 分布式事务 | 局部事务 + 最终一致（本方向「分布式事务」篇） |
| 全局唯一 ID | 雪花算法 / 号段模式，别依赖自增 |

**扩容**：预留足够分片数（如 16 库 × 64 表）；扩容走「双写迁移」——新旧库双写 → 历史数据搬迁 → 读切新 → 校验对账 → 停旧写。ShardingSphere 的「弹性伸缩」模块就是官方给的迁移工具。

## 四、容量与水位速查

- binlog 磁盘保留天数 × 每日增量 < 盘量 70%；
- 连接数：${C}max_connections${C} 按 ${C} cores × 2 + 磁盘数${C} 起步再压测定；
- 慢日志、${C}performance_schema${C} 常开（8.0 开销可控），出事才有现场。

## ⚠ 高频误区

1. **过早分片**：单表 300 万就慌，索引优化空间根本没吃完。
2. **分片键选了 order_id**：用户维度的查询全部广播，形同虚设。
3. **半同步当强一致**：官方文档明确它只保证「至少一个从库收到」，不是零丢失协议。
4. **主从延迟靠重试掩盖**：写后读不一致的业务 bug 应该在路由层解决。
5. **分片后忘记全局 ID**：各分片自增主键冲突。
6. **扩容无对账**：切流量前没有行数/抽样比对，切完才发现丢数据。

## ✅ 自检清单

- [ ] 分片键覆盖 90% 以上高频查询路径，并有倾斜监控
- [ ] GTID 已开启，切换演练过（不是纸上谈兵）
- [ ] 主从延迟有监控与告警，写后读场景路由到主库
- [ ] 全局 ID 方案独立于分片自增
- [ ] 扩容/迁移有双写 + 对账 + 可回退的完整预案

<!--dd:sharding-ha-->

## 🔬 深挖：分片路由、扩容与主从切换

### 一、分片键的选择：先看查询模式，再看数据分布

| 分片策略 | 路由方式 | 优点 | 缺点 |
|---|---|---|---|
| 范围（range） | 按值区间映射到库 | 范围查询高效、易扩容（追加新片） | 热点集中（如按时间分片，最新片被打爆） |
| 哈希（hash） | ${C}hash(key) % N${C} | 分布均匀 | 扩容要**全量重分布**（N 变了，几乎所有数据要搬） |
| 一致性哈希 | 环 + 虚拟节点 | 扩容只搬 1/N | 实现复杂，仍有轻微不均衡 |
| 查表/映射表 | 维护 key → 库的映射 | 灵活（可手动调度冷热） | 映射表本身是瓶颈与单点 |

**一致性哈希的本质**：把「库」和「key」都哈希到同一个 0~2³² 的环上，key 顺时针找到的第一个库就是它的归属。新增库时只影响它「后面一段」的 key，平均只搬 ${C}1/N${C} 数据。虚拟节点（每个物理库映射 100~1000 个环上点）解决数据倾斜。

**分片键选择三问**：① 业务查询 90% 以上是否都带这个字段？② 它的分布是否均匀（避免 80% 流量落在一片）？③ 是否会导致跨片 JOIN 与跨片事务？三个都过关才能定。举例：订单表用 ${C}user_id${C}（查询都以用户为中心）而不是 ${C}order_id${C}（看似均匀但业务查询要全片扫描）。

### 二、分片带来的四个新问题

| 问题 | 表现 | 解法 |
|---|---|---|
| 跨片查询 | 分页/排序/聚合要合并多片结果 | 冗余字段（把要过滤的字段带上）+ 内存归并；或上 ES 做查询侧 |
| 跨片 JOIN | 无法在库内 JOIN | 广播表（字典表每片一份）+ 字段冗余 + 应用层组装 |
| 全局唯一 ID | 自增主键在多片冲突 | 雪花算法（时间 + 机器位 + 序列）、号段模式（Leaf）、Redis INCR |
| 跨片事务 | 一个事务写多片无原子性 | 避免跨片事务（重新设计分片键）；必须跨片时用 Seata AT / 最终一致 |

**深分页在分片下的放大效应**：${C}LIMIT 100000, 10${C} 需要在 N 个片各取 100010 条再归并——成本是 N 倍。所以分片系统**必须禁用深分页**，改为游标分页或限制最大页码。

### 三、扩容重分片的两种路线

${F}
路线 A（双写迁移，推荐）
  ① 新建 2N 个片（翻倍，保证新旧映射是「一分为二」的关系）
  ② 开启双写（写新片 + 写老片，读仍走老片）
  ③ 后台按「只搬要迁移的那一半」搬存量（时间可控、可中断续传）
  ④ 校验一致性（pt-table-checksum / 自研比对）
  ⑤ 读切到新片（灰度：先 1% 流量，观察后再全量）
  ⑥ 停止双写、下线老片

路线 B（在线重分片，ShardingSphere 的 resharding）
  依赖框架的迁移能力，仍需业务侧配合双写与校验，本质与 A 相同
${F}

**绝对不要用「直接 %N 扩容」**：把 N 从 4 改成 5，几乎 100% 的数据归属都变了，等价于全量迁移且无法双写过渡。

### 四、读写分离与主从延迟

**主从延迟的三种成因**：① 主库并发写入而从库**单线程**回放（5.7+ 支持并行回放，但依赖组提交）→ 大事务会卡住；② 从库上有大查询/备份占用资源；③ 网络带宽或跨机房延迟。

**必须处理延迟的四类查询**：

${F}java
// ① 写后立刻读（读自己的写）——必须走主库
@Transactional
public void createAndQuery() {
    orderMapper.insert(o);
    orderMapper.selectById(o.getId());     // 同事务内，走主库（用 ThreadLocal 强制主库标记）
}

// ② 强一致校验（支付回调后查订单状态）——走主库
// ③ 幂等判断（判重查询）——走主库
// ④ 报表/统计——可容忍延迟，走从库且加超时
${F}

**实现手段**：AOP + 注解（${C}@Master${C}）+ ThreadLocal 上下文 + 动态数据源路由；或强制事务内的读都走主库（因为事务与主库连接绑定）。最简单可靠的规则是「**写操作之后 1 秒内的读走主库**」，但这需要按业务精细设计，不能一刀切。

### 五、高可用切换：MHA / Orchestrator / MGR

| 方案 | 原理 | 切换耗时 | 一致性风险 |
|---|---|---|---|
| MHA | 管理节点探测主库 + 选最接近的从库提升 | 10~30s | 异步复制下可能丢最后事务 |
| Orchestrator | 持续拓扑探测 + Raft 选主 + hooks | 秒级~10s | 同 MHA |
| MGR（组复制） | Paxos 变体，多数派确认才提交 | 秒级 | 不丢（多数派活着） |
| 云 RDS 高可用 | 底层共享存储/半同步 + 自动切换 | 常 <10s | 取决于半同步配置 |

**半同步复制（semi-sync）是降低丢数据风险的常用折中**：主库等至少一个从库 ack 后返回（${C}rpl_semi_sync_master_wait_for_slave_count=1${C}），配合 ${C}rpl_semi_sync_master_timeout${C}（超时后自动降级为异步，避免写不可用）。

**切换后必做的三件事**：① **应用重连**（连接池要能识别主库变更，否则旧连接仍指向老主库）——这是切换后「部分请求报错」的最常见原因，需要在 JDBC URL 配 ${C}autoReconnect${C} 或用支持 VIP/域名切换 + 连接池健康检查的方案；② **老主库回切为从**并重置 GTID/清理 relay log（否则双主脑裂）；③ **校验数据一致性**（pt-table-checksum 比对）。

## 📚 延伸阅读

- MySQL 8.0 RM Ch.19 Replication（GTID、Semi-Synchronous）、Ch.20 Group Replication
- InnoDB Cluster 官方文档（Router + Shell 架构）
- ShardingSphere 官方文档：Sharding / Scaling 模块
- gh-ost 官方 README（无锁 DDL 原理）
          `
          },
          {
            id: "dist-tx",
            title: "分布式事务与一致性",
            minutes: 19,
            updated: "2026-09-17",
            applies: "Seata 2.x / microservices.io patterns",
            tags: ["分布式事务", "Saga", "Seata", "一致性"],
            terms: ["Saga", "TCC", "Outbox", "最终一致"],
            body: `
## 官方文档基线

- **microservices.io（Chris Richardson）官方 pattern 目录**：Saga / Transactional Outbox / Idempotent Consumer——微服务事务模式的权威出处；
- **Seata 官方文档**：AT / TCC / Saga / XA 四种模式的官方定义；
- **Jepsen 系列分析**：分布式一致性验证的方法论参照。

跨服务事务没有银弹，只有**一致性与可用性的取舍**。本章按「官方 pattern 目录」给出每层的选择。

## 一、从 2PC 说起：它为什么不适合微服务

2PC（两阶段提交）：协调者先问所有参与者「能不能提交」，全同意才提交。

- **阻塞**：参与者在预备后持锁等待，协调者挂了就全体卡死；
- **单点**：协调者故障即故障；
- **吞吐差**：同步多轮网络往返 + 长持锁。

XA 是 2PC 的数据库实现（Seata 的 XA 模式）。适用面：**参与方少、时延不敏感、强一致刚需**的内部系统。互联网业务大多转向柔性事务。

## 二、Saga：长事务的行业标准答案（microservices.io 官方定义）

**Saga = 把长事务拆成一串本地事务，每步配一个补偿操作（compensating transaction），失败时反向执行补偿。**

两种协调方式（官方 pattern 页的定义）：

| 方式 | 做法 | 优劣 |
| --- | --- | --- |
| Choreography（协同） | 各服务订阅事件自行响应 | 简单解耦；但流程散落，复杂时看不清全局 |
| Orchestration（编排） | 中央编排器（状态机）驱动各步 | 流程集中可见；编排器本身要高可用 |

**关键工程问题**（官方页明确列出，也是面试高频）：

1. **补偿必须幂等**：补偿本身也可能重试；
2. **语义锁（semantic lock）**：预扣状态（如「处理中」）挡住脏读；
3. **不可补偿步骤的位置**：发短信、扣款这类不可逆操作放最后，前面的失败都不触发它；
4. **缺乏隔离性**：Saga 中间态对外可见，需要状态字段 + 业务校验配合。

## 三、TCC 与 Seata AT

**TCC（Try-Confirm-Cancel）**：业务层面的两阶段——Try 预留资源（冻结额度）、Confirm 确认（真扣）、Cancel 释放。三个坑（Seata 官方文档都有对应处理）：

- **空回滚**：Try 没到达，Cancel 先到——Cancel 需识别「无 Try 记录」场景并登记；
- **悬挂**：Cancel 执行后，迟到 Try 才到达——Try 前先检查是否已回滚；
- **幂等**：Confirm/Cancel 都可能重试。

**Seata AT 模式**（对业务最透明）：拦截 SQL 自动生成 **undo log**（前后镜像），一阶段本地提交 + 注册分支，二阶段全局提交时异步删除 undo log，回滚时用镜像逆向补偿。优点是侵入小，代价是**全局锁带来的并发限制**——热点行竞争激烈的场景要评估。

## 四、Transactional Outbox：本地事务与发消息的原子解（官方 pattern）

问题：更新 DB 与发 MQ 是两个系统，无法同一个事务。官方答案：

${F}
1. 业务变更与「消息表 outbox」同一本地事务写入
2. 独立中继（relay）轮询 outbox，把消息投递到 MQ
3. 消费端幂等（至少一次投递 → 幂等消费）
4. 对账任务兜底
${F}

这就是「最终一致性」的标配工程化实现。变体：CDC（Canal/Debezium 订阅 binlog）替代轮询，减少 DB 查询压力。

**对账**：最终一致体系的验收标准不是「大概率没丢」，而是**有对账任务能发现差异并修复**——没有对账的最终一致等于裸奔。

## ⚠ 高频误区

1. **追求跨服务强一致**：可用性直接牺牲掉（CAP），且大部分业务根本不需要强一致。
2. **补偿不幂等**：Saga 回滚时重复退款。
3. **Outbox 忘了「至少一次」的前提**：没有消费端幂等，等于漏了半套方案。
4. **TCC 没处理空回滚/悬挂**：三个坑全是线上真实资损来源。
5. **AT 模式用在热点竞争场景**：全局锁把并发打回解放前，热点行该走 Saga/异步。
6. **把「重试」当「事务」**：没有补偿与对账的重试，只是把不一致的概率分布拉长。

## ✅ 自检清单

- [ ] 每个跨服务流程都有明确的一致性等级标注（强/最终）与 chosen pattern
- [ ] Saga 补偿操作全部幂等且有测试覆盖
- [ ] TCC 三个坑（空回滚/悬挂/幂等）在代码里有显式处理
- [ ] Outbox + 消费幂等 + 对账三件套齐备
- [ ] 全局锁型方案（AT/XA）的使用范围有明确清单，热点路径不踩

<!--dd:dist-tx-->

## 🔬 深挖：分布式事务的六种方案与选型

### 一、先想清楚：真的需要分布式事务吗

分布式事务的代价极高（性能、复杂度、运维）。**90% 的场景可以用「单库事务 + 最终一致」替代**：

- 单库内多表 → 本地事务，不要上分布式事务；
- 跨库写 → 先考虑**合并到一个库**或**用消息驱动最终一致**；
- 只有「资金/库存这类必须原子的跨服务操作」才值得上强一致方案。

### 二、六种方案的能力对照

| 方案 | 一致性 | 性能 | 侵入性 | 适用 |
|---|---|---|---|---|
| 2PC/XA | 强一致 | 差（同步阻塞、锁持有到事务结束） | 低（数据库支持） | 内部少量跨库操作 |
| TCC | 强一致（业务层） | 中 | **高**（每个参与者写三个方法） | 资金、库存等强约束核心链路 |
| 本地消息表 | 最终一致 | 好 | 中 | 跨服务异步通知（最常见） |
| 事务消息（RocketMQ） | 最终一致 | 好 | 低 | 与 MQ 天然契合的场景 |
| Saga | 最终一致 | 好 | 中（需写补偿） | 长流程（订单 → 支付 → 履约） |
| Seata AT | 最终一致（读已提交近似） | 中 | **低**（加注解即可） | 快速接入、非极端一致要求 |

### 三、2PC 为什么慢

${F}
阶段一 Prepare：协调者问所有参与者「能提交吗」→ 各参与者写 undo/redo 并锁资源、回复 yes/no
阶段二 Commit：全部 yes → 提交；否则全部回滚
${F}

三个致命问题：① **同步阻塞**——Prepare 后资源（行锁）一直被持有到第二阶段，长事务拖垮并发；② **协调者单点**——协调者在 Prepare 后宕机，参与者会一直锁着资源（需要超时机制兜底）；③ **数据不一致**——阶段二部分参与者收到 Commit、部分没收到（需人工介入）。

**XA 的工程现状**：MySQL 的 XA 需要 ${C}XA START/END/PREPARE/COMMIT${C} 语义，与连接池（HikariCP）的兼容性一般，实践中不建议在核心链路用。

### 四、TCC 的三个必须处理的问题

${F}java
public interface OrderTccAction {
    @TwoPhaseBusinessAction(name = "orderTcc", commitMethod = "confirm", rollbackMethod = "cancel")
    boolean tryCreate(BusinessActionContext ctx, OrderCmd cmd);   // Try：预留资源（冻结而非扣减）

    boolean confirm(BusinessActionContext ctx);                   // Confirm：确认（真正扣减，必须幂等）
    boolean cancel(BusinessActionContext ctx);                    // Cancel：取消（释放预留，必须幂等）
}
${F}

| 问题 | 场景 | 解法 |
|---|---|---|
| **空回滚** | Try 没执行（网络超时未到达），但协调者仍调 Cancel | Cancel 里判断「Try 记录是否存在」，不存在则记一条「已空回滚」记录并直接返回成功 |
| **悬挂** | Cancel 先于 Try 到达（Try 因网络延迟后到），导致资源被预留却无人确认 | Try 执行前检查「是否已空回滚过」，是则拒绝执行 |
| **幂等** | 网络重试导致 Confirm/Cancel 被重复调用 | 每个阶段都有状态记录 + 唯一键去重 |

这三个问题是 TCC 面试的必考项，也是它「侵入性高」的真正原因——不是三个方法难写，而是这三个边界条件极易漏。

### 五、本地消息表与事务消息

**本地消息表（最实用的最终一致方案）**：

${F}sql
-- 业务表与消息表在同一个库、同一个本地事务里写入，保证「业务成功 ⇒ 消息一定被记录」
BEGIN;
INSERT INTO orders (id, user_id, amount) VALUES (...);
INSERT INTO local_message (id, biz_type, biz_id, status, payload)
       VALUES (UUID(), 'ORDER_CREATED', ?, 'PENDING', ?);
COMMIT;
-- 独立线程/定时任务扫描 PENDING 消息 → 发 MQ → 收到确认后置为 SENT
${F}

要点：① 消息表与业务表**必须同库同事务**（这是整个方案成立的前提）；② 发送侧**至少一次**投递（重试），消费侧靠幂等兜底；③ 状态流转 PENDING → SENT →（超时未确认则保留重试）；④ 表要按时间清理。

**RocketMQ 事务消息**把这个模式内置了：发送**半消息**（对消费者不可见）→ 执行本地事务 → 根据结果 **Commit/Rollback** 半消息 → 若长时间未收到结果，Broker 会**回查**本地事务状态（需要实现回查接口）。本质与本地消息表相同，但省掉了自建消息表与扫描线程。

**Saga** 适合长流程：把跨服务调用拆成 T1…Tn，每个 Ti 配一个补偿 Ci；失败时**反向执行** C(i-1)…C1。注意 Saga **没有隔离性**——中间态对外可见（订单已创建但库存已回滚），需要业务上用「状态标记 + 前置校验」来掩盖中间态。

### 六、选型决策树

${F}
跨服务操作是什么性质？
├─ 强一致 + 少量参与者 + 可接受低吞吐 → TCC（资金/库存）
├─ 强一致 + 同库不同表 → 本地事务（不要上分布式事务！）
├─ 最终一致 + 有 MQ → 事务消息 / 本地消息表
├─ 最终一致 + 已有长流程编排 → Saga
└─ 快速接入 + 非极端一致要求 → Seata AT（注意全局锁与 undo_log 的开销）
${F}

**反向决策提醒**：如果团队没有成熟的补偿/对账体系，宁可用「**最终一致 + 定时对账**」而不是硬上 TCC——TCC 写错反而比不一致更糟。**对账是分布式事务的最后防线**：每天定时把两边数据全量/增量比对，发现差异走人工或自动修复。

## 📚 延伸阅读

- microservices.io：Saga / Process Manager / Transactional Outbox / Domain Event pattern 页
- Seata 官方文档：AT / TCC / Saga 模式章节（含空回滚处理说明）
- Jepsen.io 各系统一致性分析（方法论训练）
- 《Designing Data-Intensive Applications》Ch.9（一致性与共识的理论底座）
          `
          },
          {
            id: "high-concurrency",
            title: "高并发系统设计与压测",
            minutes: 19,
            updated: "2026-09-17",
            applies: "通用后端架构",
            tags: ["高并发", "压测", "限流", "SRE"],
            terms: ["高并发", "限流", "压测", "过载保护"],
            body: `
## 官方文档基线

- **Google SRE Book**：Ch.22「Addressing Cascading Failures」与「Handling Overload」章节——过载保护的官方方法论；
- **Gatling / JMeter 官方文档**：压测方法论；
- **Little's Law**：排队论基础（${C}L = λ × W${C}），容量估算的数学起点。

高并发设计的本质：**在过载发生时，系统按预期方式降级，而不是随机崩溃**。

## 一、容量从哪来：推导演算（不是拍脑袋）

${F}
日活 500 万 × 人均下单 2 次 = 1000 万单/天 ≈ 116 单/秒（平均）
峰值系数 3–5 倍（午晚高峰）→ 下单峰值 ≈ 500 QPS
单接口放大系数：一次下单背后 8 个内部调用 → 热点内部接口 ≈ 4000 QPS
预留 30% 缓冲 → 目标容量 ≈ 5200 QPS
${F}

**Little's Law**：${C}并发数 = QPS × 平均响应时间${C}。5000 QPS × 0.1s = 500 个在途请求——这就是线程池/连接池的容量依据。响应时间翻倍，在途请求翻倍，资源瞬间翻倍：**延迟恶化是资源耗尽的加速器**。

## 二、读多写少三板斧

1. **多级缓存**：本地缓存（Caffeine，纳秒级）→ Redis（毫秒级）→ DB。热点商品/配置信息优先上本地缓存（注意失效广播）；
2. **CDN/边缘**：静态资源与可缓存的读接口外推到边缘；
3. **读扩散 vs 写扩散**：Feed 类系统按读写比选择——读多选写扩散（粉丝维度冗余），写多选读扩散（拉取聚合）。

## 三、写削峰

- **队列缓冲**：写请求入队，消费端按 DB 承受能力匀速落库（削峰填谷）；
- **批量合并**：攒 10ms 的写合并成 batch upsert，DB 写放大从 N 次变 1 次；
- **内存预扣 + 异步落库**：秒杀库存放 Redis 预扣（Lua 保证原子），MQ 异步生成订单——DB 只承受「匀速下单流」。

## 四、过载保护三件套（SRE 官方方法论）

**① 限流**——四种算法对比：

| 算法 | 特点 | 缺点 |
| --- | --- | --- |
| 固定窗口计数 | 最简单 | 窗口边界突刺（两倍流量瞬间通过） |
| 滑动窗口 | 平滑了边界 | 内存稍高 |
| 漏桶 | 整形输出恒速 | 无法应对合理突发 |
| 令牌桶 | 允许突发（桶容量） | 参数要压测标定 |

单机限流（Sentinel/Resilience4j）保单节点，集群限流（Sentinel cluster mode）保全局配额。

**② 熔断**：下游故障率超阈值就「跳闸」，直接失败或走降级，给下游喘息窗口；半开状态探测恢复。详见下一章。

**③ 负载丢弃（load shedding）**：SRE Book 核心观点——**过载时主动拒绝部分请求，好过全体超时**。按请求优先级丢弃（登录优先于推荐），配额随内存/CPU 自适应。

**⑤ 隔离舱（bulkhead）**：线程池/连接池按服务隔离，一个下游拖死全站的经典事故就是没有隔离。

## 五、压测方法论（Gatling 官方推荐的阶梯）

${F}
1. 基准：单接口低压力，拿到基线延迟与吞吐
2. 阶梯加压：每档稳定 5 分钟，找「拐点」（吞吐不涨延迟陡增）
3. 稳定性：目标容量 80% 连续跑 8h+，看内存泄漏与连接池
4. 突刺：瞬时 3 倍流量，验证限流与降级生效
5. 生产验证：影子流量 / 流量回放，压真实链路
${F}

**压测环境必须对等**：DB 数据量级、缓存命中率、下游依赖都要仿真——拿 10 万数据的环境压 1 亿数据的生产，结论全是错的。

## ⚠ 高频误区

1. **拿日均 QPS 当容量目标**：峰值系数与放大系数才是关键，两者都容易漏算。
2. **只压应用不压 DB**：应用层扛得住，连接池/慢查询先死。
3. **限流阈值拍脑袋**：不压测标定，设太高形同虚设，太低误杀正常流量。
4. **熔断无恢复探测**：OPEN 后永久熔断，下游恢复了也进不来流量。
5. **重试无上限**：故障时重试风暴把 1 倍故障放大成 10 倍流量——重试必须带预算与退避。
6. **压测忘掉中间件**：MQ、Redis、ES 的容量都按目标 QPS 推导过，不只是应用。

## ✅ 自检清单

- [ ] 核心接口有容量推导文档：日活 → 平均 → 峰值 → 放大 → 目标
- [ ] 所有跨服务调用有超时 + 限流 + 熔断 + 隔离，缺一不可
- [ ] 阶梯压测找过拐点，限流阈值由此标定
- [ ] 过载演练过：验证「拒绝部分请求」比「全体超时」的恢复速度快
- [ ] 重试全部有次数上限与指数退避，重试预算有监控

<!--dd:high-concurrency-->

## 🔬 深挖：从容量估算到限流降级

### 一、容量估算：从业务指标推到技术指标

${F}
DAU = 100 万
→ 日活用户的日均请求数 20 次 → 日请求量 2000 万
→ 高峰集中在 2 小时（占全天 30%）→ 峰值 QPS = 2000万 × 0.3 / (2 × 3600) ≈ 833
→ 加安全系数 3（防止突发）→ 设计目标 ≈ 2500 QPS

并发数 = QPS × 平均 RT（利特尔法则 Little's Law）
  RT = 100ms → 并发数 = 2500 × 0.1 = 250 个并发请求
→ 若单实例能承载 200 并发 → 至少 2 个实例，考虑 N+1 冗余 → 3 个
${F}

**利特尔法则（${C}L = λW${C}）**是并发估算的基石：系统中的平均请求数 = 到达率 × 平均停留时间。它解释了「为什么 RT 从 50ms 涨到 500ms 会让并发数暴涨 10 倍」——**降级优先降 RT，而不是只加机器**。

### 二、漏斗分层：每一层都要能挡

${F}
① CDN / 静态化      → 挡住 90% 静态请求（图片、JS、页面骨架）
② 网关层限流        → 全局限流 + 黑名单 + 鉴权（拒绝最廉价，放在最前面）
③ 应用层本地缓存     → Caffeine/LRU 挡热点（微秒级，零网络）
④ 分布式缓存 Redis  → 挡大部分读（亚毫秒级）
⑤ 数据库            → G1 保护自己：连接池上限 + 慢查询熔断
${F}

**核心原则：让请求在最早、最便宜的层被拒绝或满足**。反例是「所有请求都打到 DB 才判断权限失败」——把 DB 连接池打满，正常请求也一起挂。

### 三、限流四算法的真实差异

| 算法 | 原理 | 突发流量 | 实现要点 |
|---|---|---|---|
| 固定窗口 | 每单位时间计数 | 允许（边界双倍冲击） | 简单，有临界问题（0:59 与 1:00 各放 100） |
| 滑动窗口 | 按时间片加权统计 | 平滑 | Redis ZSet 或环形数组 |
| 漏桶 | 恒定速率流出，队列缓冲 | 不允许（整形） | 适合「必须匀速」的下游 |
| **令牌桶** | 恒定速率放令牌，桶可积累 | 允许（桶容量内） | **最常用**，Guava RateLimiter / Sentinel |

${F}java
// Guava 令牌桶：单机限流（注意：多实例要除以实例数，或改用 Redis 集中式）
RateLimiter limiter = RateLimiter.create(1000);        // 每秒 1000 个令牌
if (!limiter.tryAcquire(200, TimeUnit.MILLISECONDS)) { // 最多等 200ms
    throw new BizException("系统繁忙，请稍后重试");
}

// 平滑预热（冷启动保护）：预热 10s 后达到 1000 QPS
RateLimiter warm = RateLimiter.create(1000, 10, TimeUnit.SECONDS);
${F}

**分布式限流的取舍**：Redis + Lua 实现全局限流准确但每请求一次网络 RTT；单机限流便宜但总量是「实例数 × 单机阈值」（扩缩容时需跟着调）。**推荐混合**：网关做全局粗粒度限流（如总 QPS 上限），应用内做单机细粒度限流（保护自身资源）。

### 四、熔断与降级的三个状态

${F}
CLOSED（正常，放行）
  → 错误率/慢调用比例超阈值 → OPEN（熔断，直接失败，不发请求）
      → 等待 window（如 10s） → HALF_OPEN（试探，放少量请求）
          ├─ 试探成功 → CLOSED（恢复）
          └─ 试探失败 → OPEN（继续熔断）
${F}

${F}java
// Resilience4j / Sentinel：熔断配置的三个关键参数
CircuitBreakerConfig.custom()
    .slidingWindowSize(100)                // 统计窗口：最近 100 次调用 / 或按时间
    .failureRateThreshold(50)              // 错误率 > 50% 触发熔断
    .slowCallRateThreshold(80)             // 慢调用（>600ms）比例
    .waitDurationInOpenState(Duration.ofSeconds(10))
    .permittedNumberOfCallsInHalfOpenState(10)
    .build();
${F}

**降级的三个层次**（务必提前设计，不要等故障时想）：
1. **返回缓存/默认值**（推荐商品：实时推荐挂了就返回热销榜）；
2. **返回兜底静态内容**（无数据时展示「暂无数据」而不是白屏或错误页）；
3. **静默失败**（非核心链路：埋点、推荐、消息通知失败直接吞掉，绝不能影响主链路）。

**舱壁隔离（Bulkhead）**：不同下游用**独立线程池/信号量**，避免一个慢下游把全部线程占满。这是「A 服务挂了导致商品详情页也挂了」的标准解法。

### 五、压测：不要只压「单接口最高 QPS」

**有效的压测要做到三件事**：

1. **按真实链路压**：用户一次操作可能触发 5 个下游调用，要压「业务闭环」而不是单接口；
2. **给下游也配桩/容量**：压测时下游未扩容，得到的是「下游被打挂」的假瓶颈；
3. **找到「拐点」而非「最大值」**：TPS 上升而 RT 开始非线性上升的那个点才是容量上限——超过它系统会进入恶性循环（队列堆积 → 超时 → 重试 → 雪崩）。

**全链路压测的三个必备**：
- **流量标识（影子标识）**：请求打标后，链路各环节识别并走**影子库/影子表**，避免污染生产数据；
- **数据隔离**：影子库结构一致但数据独立，压测后清理；
- **降级开关关闭**：压测时必须关闭自动降级，否则测出来的是降级路径的性能。

**压测结论要落到三张表**：各接口容量（QPS/RT 拐点）、各层瓶颈（CPU/连接池/DB/缓存命中率）、以及**扩容单价**（每 1000 QPS 需要多少资源）——后者才让容量规划可算账。

## 📚 延伸阅读

- Google SRE Book：Ch.22 Addressing Cascading Failures / Handling Overload 章节
- Gatling 官方文档（Simulation 结构与注入模型）
- Little's Law 与排队论入门（容量估算的数学）
- Sentinel 官方 Wiki：流量整形（匀速排队）章节
          `
          },
          {
            id: "microservice-governance",
            title: "微服务治理（注册/限流/熔断）",
            minutes: 19,
            updated: "2026-09-17",
            applies: "Spring Cloud 2023+ / Sentinel / Resilience4j",
            tags: ["微服务", "熔断", "限流", "网关"],
            terms: ["微服务", "熔断器", "Sentinel", "Resilience4j"],
            body: `
## 官方文档基线

- **microservices.io 官方 pattern 目录**（Chris Richardson）：Service Registry / API Gateway / Circuit Breaker / Bulkhead——每个模式的标准定义与适用条件；
- **Resilience4j User Guide**：熔断器状态机与参数的官方定义；
- **Sentinel 官方 Wiki**：流控规则、熔断降级、热点参数限流。

微服务治理 = **让「调用别人」和「被别人调用」都可控**。模式全部有官方出处，不要凭感觉造词。

## 一、服务注册与发现（官方 pattern：Service Registry）

- 客户端发现（Eureka/Nacos 客户端模式）：服务自己拉注册表、自己负载均衡——少一跳，逻辑在客户端；
- 服务端发现（K8s Service/网关）：调用打到统一入口，由基础设施路由——客户端零感知；
- **CAP 取舍**：Eureka 选择 AP（网络分区下可用，可能拿到旧列表）；ZooKeeper/Consul 的 CP 路线在分区时不可用。注册中心短暂不一致可接受，**可用优先**是主流选择（Nacos 默认 AP，可切 CP）。

配置中心（Nacos/Apollo）：配置分环境隔离、灰度发布、变更审计；敏感配置加密存储。

## 二、API Gateway（官方 pattern）

统一入口承担：路由、认证鉴权（JWT 校验前置）、限流、灰度分流、协议转换。Spring Cloud Gateway 是反应式模型（Netty），线程模型是「少量 event loop」，**不要在过滤器里写阻塞代码**——一个 JDBC 调用就能堵死整个网关。

## 三、熔断器：Resilience4j 官方状态机

${F}
CLOSED ──失败率超阈值──→ OPEN ──等待窗口结束──→ HALF_OPEN ──探测成功──→ CLOSED
                                    └──探测失败──→ OPEN
${F}

官方参数（User Guide 原文语义）：

- ${C}failureRateThreshold${C}（默认 50%）：滑动窗口内失败率阈值；
- ${C}slowCallDurationThreshold${C}：慢调用判定线，慢调用占比独立计数——**响应慢也是故障**；
- ${C}slidingWindowSize${C}：统计窗口（按次数或时间）；
- ${C}waitDurationInOpenState${C}：OPEN 停留时长；
- ${C}permittedNumberOfCallsInHalfOpenState${C}：半开探测样本数。

${F}java
CircuitBreakerConfig.custom()
    .failureRateThreshold(50)
    .slowCallDurationThreshold(Duration.ofSeconds(2))
    .slowCallRateThreshold(80)              // 慢调用也算失败
    .slidingWindowSize(20)
    .waitDurationInOpenState(Duration.ofSeconds(30))
    .build();
${F}

**降级**：熔断后返回兜底（缓存旧值/默认值/友好错误），SRE 语义里叫 graceful degradation——**降级链路要有真实演练**，没演练过的降级代码等于没有。

## 四、限流与隔离（Sentinel 官方 Wiki）

Sentinel 三类规则：

1. **流控**：QPS 或并发线程数；流控效果支持快速失败、Warm Up（冷启动爬坡）、**匀速排队**（漏桶思想）；
2. **熔断降级**：慢调用比例 / 异常比例 / 异常数三种策略；
3. **热点参数限流**：对参数值粒度限流（如 skuId=123 单独限 100 QPS），秒杀场景标配。

**集群限流**：Token Server 统一发牌，解决「单机 100 × 100 台 = 万倍超额」的问题。

**隔离舱**：线程池隔离（Hystrix 遗产，成本高但硬隔离）vs 信号量隔离（Resilience4j 默认，轻量）。按下游重要程度分池，核心链路与边缘链路物理隔离。

## 五、超时与重试预算

- **超时必须分级**：网关总超时 > RPC 超时 > 连接超时，层层收窄；下游超时永远小于调用方的剩余预算；
- **重试预算**：全链路重试次数有上限（如总请求的 10%），防止重试风暴（SRE Book 的 retry budget 思想）；
- 只对**幂等操作**重试，非幂等重试 = 重复下单。

## ⚠ 高频误区

1. **服务拆分过细**：一个请求穿 8 层微服务，变成「分布式单体」——延迟叠加、排障地狱、发布互相锁。拆分粒度跟着团队与业务边界走（康威定律）。
2. **熔断阈值全局一刀切**：核心链路 50% 就该熔断，边缘链路可以更宽容，按重要性分级配置。
3. **重试无退避无预算**：故障放大器。
4. **网关里写阻塞逻辑**：反应式模型的禁区。
5. **配置中心只存不审计**：改错了没人知道谁改的。
6. **注册中心挂了就全站瘫痪**：客户端要有本地缓存快照（Eureka/Nacos 都支持），注册中心短暂不可用时用旧列表硬撑。

## ✅ 自检清单

- [ ] 每个跨服务调用：超时分级 + 熔断 + 限流 + 隔离四件套齐备
- [ ] 熔断配置区分核心/边缘链路，慢调用计入失败率
- [ ] 降级路径演练过（故障注入验证），兜底数据有更新机制
- [ ] 集群限流部署到位，单机限流不作为唯一防线
- [ ] 服务拆分边界有文档，单请求跨服务跳数有上限（如 ≤4）

<!--dd:microservice-governance-->

## 🔬 深挖：注册发现、网关与全链路灰度

### 一、服务注册发现的三次心跳

${F}
① 注册：服务启动 → 向注册中心写自己的 ip:port + 元数据（权重、版本、机房）
② 心跳/健康检查：客户端主动上报（Eureka 30s）或注册中心主动探测（Nacos 支持临时/持久两种）
③ 摘除：心跳超时（Eureka 90s 未续约）或被健康检查判死 → 从可用列表移除
${F}

**Eureka 与 Nacos 的模型差异**：

| 维度 | Eureka | Nacos |
|---|---|---|
| 一致性 | AP（各节点异步复制，可能读到旧列表） | 支持 AP（临时实例，Distro）与 CP（持久实例，Raft） |
| 健康检查 | 客户端心跳 + 服务端自我保护的「剔除阈值」 | 心跳 / 主动探测 / 也支持不健康即剔除 |
| 变更推送 | 客户端定时拉取（30s）+ 增量 | 长连接推送（秒级） |
| 服务端保护机制 | 自我保护模式（心跳丢失比例 > 85% 时不剔除） | 无同类机制 |

**宁可短暂读到旧列表，也不要全量摘除**——Eureka 的自我保护模式就是这个取舍：网络抖动时它选择「不摘除」，避免把健康实例全清空导致服务彻底不可用。

### 二、负载均衡：客户端 vs 服务端

| 方式 | 原理 | 代表 | 特点 |
|---|---|---|---|
| 服务端 LB | 独立代理转发 | Nginx、LVS、云 SLB | 集中控制，多一跳，客户端无感知 |
| 客户端 LB | SDK 拉取实例列表，本地选 | Ribbon、Spring Cloud LoadBalancer、gRPC | 少一跳、可按业务定制策略，但 SDK 侵入 |

**长连接下客户端 LB 的坑**：服务端实例下线后，客户端不知道，长连接仍指向死实例 → 请求报错。解法是「**主动健康检查 + 连接池剔除 + 重试**」：Spring Cloud LoadBalancer 配合 ${C}spring.cloud.loadbalancer.health-check${C} 或 gRPC 的 ${C}KeepAlive + 自动重连${C}。

**一致性哈希在某类场景比轮询好**：需要「同一用户请求落到同一实例」（本地缓存命中率、会话粘性）时用哈希。但要注意实例上下线会引起少量 key 重分布——虚拟节点可缓解。

### 三、网关的核心职责（别把它当纯转发）

${F}
① 路由            路径/域名/Host → 后端服务
② 鉴权            统一 JWT/签名校验，业务服务不再各自实现
③ 限流            全局 + 按租户/接口/IP 的细粒度限流
④ 熔断降级        下游故障时快速失败
⑤ 协议转换        HTTP ↔ gRPC / 外部 HTTPS ↔ 内部 HTTP
⑥ 灰度            按 header/用户/比例路由到不同版本
⑦ 日志与追踪      生成/透传 TraceId，记录访问日志
⑧ 请求/响应改写   去除敏感头、统一错误结构
${F}

**「网关别做重活」原则**：网关是所有流量的必经之路，任何同步阻塞的复杂逻辑（大报文解析、写库、调外部服务）都会成为全局瓶颈。业务逻辑放业务服务，网关只做「快、无状态、可缓存」的判断。

**路由配置与灰度**：Spring Cloud Gateway 用 Predicate（匹配条件）+ Filter（处理），把灰度逻辑放在自定义 Filter 里：

${F}java
// 按请求头 x-gray 路由到 gray 版本实例
@Bean
public RouteLocator routes(RouteLocatorBuilder b) {
    return b.routes()
        .route("svc-gray", r -> r.path("/api/order/**")
            .and().header("x-gray", "1")
            .uri("lb://order-service-gray"))
        .route("svc", r -> r.path("/api/order/**")
            .uri("lb://order-service"))
        .build();
}
${F}

### 四、全链路灰度：难点在「跨服务的上下文透传」

单跳灰度容易，难的是**调用链上所有服务都按同一个灰度标识选实例**：

${F}
入口网关（定灰度标识：用户 ID 尾号 / 请求头 / 比例）
 → 把标识写进请求上下文（ThreadLocal）
 → 出站时（拦截器/过滤器）把标识放进 header（x-gray-tag）
 → 下游服务读到标识 → 同样用 ThreadLocal 传递 → 同样透传到下一跳
 → 每个服务都按标识从注册中心选对应 tag 的实例
${F}

**必做的三件事**：① **元数据打标**（实例注册时带 ${C}tag: gray${C}）；② **透传组件**（Feign/RestTemplate/消息生产者都要拦截注入 header，这是最容易漏的——**异步线程与 MQ 会丢失上下文**，必须显式传递）；③ **兜底规则**（灰度实例不存在时回落默认实例，否则请求失败）。

**异步/线程池导致的上下文丢失**是最常见的灰度失效原因：ThreadLocal 不跨线程。解法是 ${C}TransmittableThreadLocal${C}（阿里 TTL）或手动在提交任务时捕获并恢复上下文。

### 五、链路追踪：TraceId 的生成与透传

${F}
TraceId（一次完整请求）→ SpanId（一个环节）
  ├─ Browser 生成 TraceId → 带在 header（traceparent, W3C 标准）
  ├─ 网关校验/生成 → 注入 MDC（日志自动带上）
  ├─ 服务调用：header 透传 traceparent + 生成新 span + 记录父子关系
  ├─ 消息：producer 把 traceId 写进消息头 → consumer 取出恢复上下文
  └─ 上报到 APM（SkyWalking / Jaeger / Zipkin）→ 拼成完整调用树
${F}

**「日志里能 grep 到 TraceId」是排障的底线能力**——没有它，一个报错你要手工在 5 个服务的日志里对时间戳。实现要点：${C}MDC.put("traceId", id)${C} + logback pattern 里加 ${C}%X{traceId}${C}，并确保**线程池与 MQ 场景都透传**（同上，用 TTL 或显式传递）。

**采样策略**：全量上报成本高，常见做法是「**头部采样**（按比例，如 1%）+ **尾部采样**（错误/慢请求强制采样）」——保证有问题的链路 100% 被记录，正常链路按比例。

## 📚 延伸阅读

- microservices.io：Service Registry / API Gateway / Circuit Breaker / Bulkhead / Saga
- Resilience4j User Guide：CircuitBreaker / RateLimiter / Bulkhead 章节
- Sentinel 官方 Wiki：流控规则 / 熔断降级规则 / 热点参数限流
- Spring Cloud Gateway 官方文档（反应式编程约束）
          `
          },
          {
            id: "capacity-planning",
            title: "性能工程与容量规划",
            minutes: 18,
            updated: "2026-09-17",
            applies: "通用后端架构",
            tags: ["容量规划", "性能工程", "SRE"],
            terms: ["容量规划", "USE 方法", "USL", "水位"],
            body: `
## 官方文档基线

- **Google SRE Book「Capacity Planning」与「Software Engineering in SRE」**：容量管理的官方流程；
- **USE Method（Brendan Gregg）**：系统资源排查的标准化方法；
- **Universal Scalability Law（Dr. Neil Gunther）**：扩展性建模的标准理论。

容量规划回答三个问题：**现在水位多少？什么时候到顶？到顶前要做什么？**——性能工程是回答它们的数据来源。

## 一、USE 方法：资源排查的标准框架

对**每一种资源**（CPU、内存、磁盘 IO、网络、连接池、线程池）问三个问题：

| 资源 | Utilization 利用率 | Saturation 饱和度 | Errors 错误 |
| --- | --- | --- | --- |
| CPU | 平均负载/核 | 运行队列长度 | SRC 错误、节流 |
| 内存 | 已用/总量 | swap、page scan | OOM kill |
| 磁盘 | IOPS/带宽占比 | 队列深度、await | IO error |
| 连接池 | 活跃/最大 | 等待获取连接数 | 获取超时 |

三个问题任何一个异常都是线索——这是「遍历资源不遗漏」的官方方法论，比「凭经验猜」可靠一个量级。

## 二、USL：为什么「加机器吞吐反而降」

${F}
C(N) = N / (1 + α(N-1) + βN(N-1))
N=节点数，α=争用系数（串行部分），β=一致性开销（跨节点协作成本）
${F}

线性扩展只在 α=β=0 成立。现实里 α 让收益打折，**β 让曲线过顶后下降**——加节点引入的协调成本（锁、广播、分布式事务）超过其算力贡献时，扩展变成负优化。工程含义：**扩容前先看瓶颈是不是「协调」造成的**，是就先拆分/降耦合，加机器无效。

## 三、容量规划的 SRE 流程（官方章节顺序）

1. **需求预测**：业务增长（DAU/GMV 目标）→ 技术指标（QPS、存储、带宽）的换算链路要有文档；
2. **容量测量**：全链路压测拿真实上限（估算都是错的，压测才是测量）；
3. **水位管理**：常规水位 ≤ 50%，峰值 ≤ 70%——SRE 的经验准则，给故障转移预留 1+1 余量；
4. **扩容计划**：按增长率倒推「还剩 N 个月」，提前排期采购/扩容，而不是等报警；
5. **验收复盘**：每次大促/事故后校准模型误差。

**水位报警的正确设置**：报「预计触顶时间」而不是「当前利用率」——按近 7 天增速线性外推，3 天内到 70% 就报警。利用率报警（如 CPU>80%）发现问题的时候往往已经晚了。

## 四、全链路压测与成本工程

**全链路压测**：

- 影子流量打标（header 标记）贯穿整条链路，数据写影子表/影子 topic；
- 压测前先做**依赖梳理**：不能压的下游（第三方支付）mock 掉；
- 压测中盯**全局瓶颈**：先死的往往不是应用，是 DB 连接、Redis 带宽、日志盘 IO。

**成本工程**（容量规划的财务面）：

- 单位成本：每万次请求/每 TB 存储/每千 DAU 的基础设施成本，按季度跟踪趋势；
- 冷热分层：日志/历史订单转对象存储与冷表，热数据保留期收敛；
- 按需 vs 包年：基线负载包年、弹性部分按需，混合比压到最优。

## 五、一次年度容量规划模板

${F}
1. 业务输入：明年 DAU 目标 + 大促峰值倍数
2. 换算：接口级 QPS 目标表（含放大系数）
3. 测量：全链路压测当前容量上限
4. 缺口：目标/上限 - 1 = 扩容倍数，按 USL 检查协调瓶颈
5. 排期：分季度扩容计划 + 预算
6. 演练：大促前 2 轮全链路压测验收
${F}

## ⚠ 高频误区

1. **线性外推**：当前 1000 QPS 用 10 台，明年 10 倍就买 100 台——USL 告诉你协调成本会先爆炸。
2. **只算应用不算中间件**：DB/Redis/MQ 的容量缺口往往比应用来得早。
3. **压测环境不等价**：数据量级、缓存命中率、网络拓扑不对齐，结论全废。
4. **容量数据拍脑袋**：「大概能扛 1w」不是规划，是许愿。
5. **忘记数据增长**：应用 QPS 规划了，表一年涨 3 倍带来的索引膨胀与慢查询没算。
6. **大促后不复盘校准**：压测模型与真实流量分布的误差永远存在，不复盘误差只会越滚越大。

## ✅ 自检清单

- [ ] 核心服务有容量推导文档，每年/每季度更新
- [ ] 全链路压测常态化（影子流量），知道当前真实上限
- [ ] 水位报警基于「触顶时间预测」而非瞬时利用率
- [ ] 关键资源的 USE 三项指标接入监控面板
- [ ] 大促后复盘过压测模型误差并校准

<!--dd:capacity-planning-->

## 🔬 深挖：容量规划的方法论与冗余度设计

### 一、容量规划的四步法

${F}
① 业务指标 → 技术指标
   DAU / 订单量 / 打开次数 → QPS / 并发数 / 存储量 / 带宽
② 单机能力测量（压测）
   单实例在 RT 达标前提下的最大 QPS —— 注意是「拐点」不是「峰值」
③ 冗余度与实例数
   实例数 = 峰值 QPS / 单机 QPS × (1 + 冗余系数)  冗余系数通常 0.3~1.0
④ 成本与弹性策略
   常备容量（保底）+ 弹性容量（应对峰值）+ 降级预案（极限情况）
${F}

**四个常见错误**：① 用「平均值」算容量（峰值是平均的 3~10 倍）；② 忽略放大系数（一次用户操作触发 N 个下游调用，容量要乘 N）；③ 用测试环境的单机能力推生产（硬件、数据量、并发模型都不同）；④ 只算 QPS 不算**连接数**（连接池上限往往是真正的瓶颈）。

### 二、存储容量的估算

${F}
单行大小估算（InnoDB）：
  业务字段 = 声明长度之和 × 平均填充率（通常 0.5~0.7）
  + 隐藏列 6B（DB_TRX_ID）+ 7B（DB_ROLL_PTR）
  + 行头 5B（变长字段长度列表 + NULL 位图 + 记录头）
  + 页开销 1/16（页目录与页头约占 6%~7%）
  + 二级索引（每个索引约为「索引列 + 主键」大小 × 行数）

示例：单行 500B 业务数据 → 实际约 600B
  1000 万行 → 约 6GB 数据 + 索引 2GB + undo/binlog 预留 30% → 约 11GB
  加 2 年增长与冗余 → 规划 40GB
${F}

**容易漏算的四项**：① 索引（常被忽略，有时比数据还大）；② undo log（长事务会急剧膨胀）；③ binlog（${C}binlog_row_image=full${C} 时很大，且保留天数决定占用）；④ **临时表与排序空间**（大查询会写磁盘临时表）。

### 三、压测模型：并发数、RPS 与思考时间

${F}
闭环压测（最接近真实）：N 个并发用户 → 循环「发请求 → 等响应 → 思考时间 → 再发」
  RPS = N / (RT + ThinkTime)

开环压测（测极限）：固定速率发请求（如 1000 RPS），不看响应
  适合测「上游不管下游死活」的真实场景（如 MQ 消费者、定时任务）

阶梯加压（推荐）：每 2 分钟提升 20% 负载 → 观察 RT 与错误率拐点 → 找到容量上限
${F}

**压测必须同时观测三类指标**：① 应用（QPS、RT 分位 P99/P999、错误率、线程池队列、GC）；② 中间件（DB 连接数与慢查询、Redis 命中率与 RT、MQ lag）；③ 系统（CPU、内存、网络、磁盘 IO util、上下文切换）。

**只看平均 RT 会骗人**：P99 才是用户真实体验——平均 50ms 而 P99 3s 的系统，1% 的用户在骂娘。压测报告必须给分位数。

### 四、瓶颈定位：先证伪，别猜

${F}
CPU 高 → 是业务计算？还是 GC？还是上下文切换？（top/us/vmstat -w）
  业务计算 → 火焰图（async-profiler）找热点方法
  GC → jstat -gcutil 看 FGC 频率与耗时
  上下文切换 → 线程数过多或锁竞争

CPU 不高但 RT 高 → 在等什么？
  等下游（看调用链各环节耗时占比）
  等锁（jstack 看 BLOCKED）
  等 IO（iostat 看 await/util）
  等连接（连接池 activeCount 打满 → 排队）

QPS 上不去但资源都没满 → 检查前置限制
  网关限流？连接池上限？DB 最大连接数？Redis 连接数？线程池队列满？
${F}

**Amdahl 定律的启示**：如果 50% 的时间花在不可并行化的部分（如单线程的 DB 写入、全局锁），那么无限加机器最多只能提速 2 倍。**优化前先算「理论加速比上限」**，避免在错的维度投入。

### 五、冗余度与高可用等级

| 等级 | 形态 | 可用性 | 成本 |
|---|---|---|---|
| 单机房单实例 | 有单点 | 99% 级 | 1x |
| 同机房多实例（N+1） | 抗单实例故障 | 99.9% | 1.3~2x |
| 同城双机房（双活/主备） | 抗机房级故障 | 99.95% | 2~2.5x |
| 异地多活 | 抗城市级故障 | 99.99% | 4x+ |

**「N+1 还是 N+2」的判断**：N+1 只能容忍 1 个实例故障；如果故障恢复需要 10 分钟以上（如需要人工介入、数据库主从切换），则要 N+2（容忍「一个已故障 + 一个在滚动发布中不可用」）。

**成本与可靠性的真实权衡**：每提升一个 9（99.9% → 99.99%），成本往往翻倍。所以容量规划的最后一步**不是追求极致，而是与业务确认「可接受的可用性等级」并据此投入**——把预算花在「用户真正会感知到的链路」上（下单、支付），而不是所有链路一刀切。

**降级预案是容量规划的一部分**：容量规划不只回答「需要多少机器」，还要回答「**机器不够时先牺牲什么**」。预案清单要提前定义：哪些接口限流、哪些功能可关闭、哪些数据可以返回缓存/默认值，以及**每个开关谁能拍板执行**。

## 📚 延伸阅读

- Google SRE Book：Capacity Planning / Load Balancing / Data Integrity 章节
- Brendan Gregg：USE Method（useMethod 官网页）与《Systems Performance》
- Neil Gunther：Universal Scalability Law（原始论文与 Arugmented 阐述）
- 《Designing Data-Intensive Applications》Ch.1（可靠、可扩展、可维护的系统）
          `
          }
        ]
      }
    ]
  };

  window.JAVA = JAVA;
})();
