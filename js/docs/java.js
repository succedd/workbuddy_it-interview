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
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

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
## 官方文档基线

本章按 Oracle 官方文档目录展开，权威出处只有两个：

- **Java Tutorials「Collections」trail**（docs.oracle.com/javase/tutorial/collections）：官方把集合划分为 *interfaces / implementations / algorithms* 三条主线，这是本章的骨架。
- **Java Language Specification §10（Arrays）、§4.3、§8** 与 **API 文档 ${C}java.util${C} 包页**：${C}equals${C}/${C}hashCode${C} 契约写在 ${C}Object${C} 的 API doc 里，不是坊间经验。

面试问「集合」，本质是考三件事：**契约（specification）、实现（implementation）、选型（which to use）**。顺序不能乱。

## 一、${C}equals${C} / ${C}hashCode${C} 契约：后面所有坑的根

${C}Object${C} 的 API 文档给 ${C}hashCode${C} 定了三条契约（背下来，面试和排查都靠它）：

1. 同一对象多次调用 ${C}hashCode${C} 必须返回相同值（前提是 ${C}equals${C} 比较所用的信息没变）；
2. ${C}equals${C} 相等的两个对象，${C}hashCode${C} **必须**相等；
3. ${C}hashCode${C} 相等，${C}equals${C} 不必相等（哈希冲突是允许的）。

违反契约 2 的直接后果：对象放进 ${C}HashMap${C} 后「找不到了」——因为查找时先按 hash 分桶，桶都对不上，${C}equals${C} 根本没机会执行。

${F}java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User)) return false;
    User u = (User) o;
    return id != null && id.equals(u.id);   // 只比业务主键
}
@Override
public int hashCode() {
    return Objects.hash(id);                 // 字段必须与 equals 完全一致
}
${F}

**两个细节**：① 用 ${C}instanceof${C} 而不是 ${C}getClass()${C}，才兼容子类语义（JLS 对两者都合法，工程上前者更常用）；② hash 用到的字段集合必须是 ${C}equals${C} 字段集合的**子集**，反过来不成立。

## 二、HashMap 的实现原理（官方实现 + OpenJDK 源码口径）

按「API 文档承诺 → 实现怎么做」的顺序讲：

- **API 承诺**：${C}get${C}/${C}put${C} 平均 O(1)（假设 hash 分散）；**不保证顺序**，且「顺序可能随扩容改变」——文档原话 *the order ... may change*，所以任何依赖遍历顺序的代码都是错的。
- **实现结构**：数组 + 链表 + 红黑树。链表长度 ≥ 8 **且**表长 ≥ 64 时树化；低于 6 退化回链表。
- **负载因子 0.75**：API 文档明确说这是「时间与空间成本的折中推荐值」，默认别改。
- **扩容**：超过 ${C}capacity × 0.75${C} 就翻倍 rehash。JDK 8 起用「高位拆分」：扩容后元素要么留在原下标 ${C}i${C}，要么去 ${C}i + oldCap${C}，不用重算 hash。
- **null 键**：HashMap 允许一个 null 键；Hashtable 和 ConcurrentHashMap 不允许——并发容器拒绝 null 是为了「歧义不可判定」：${C}get${C} 返回 null 到底是「没有」还是「值就是 null」，无法区分。

## 三、ArrayList 与并发修改

- 底层是 ${C}Object[]${C}，默认容量 10，扩容为 **1.5 倍**（${C}oldCap + (oldCap >> 1)${C}）；已知大小时**必须**用 ${C}new ArrayList<>(expectedSize)${C}，避免多次拷贝。
- **fail-fast**：迭代时结构被修改，抛 ${C}ConcurrentModificationException${C}。注意官方口径：这是**尽力而为（best-effort）**的机制，Javadoc 原话——*fail-fast behavior ... should be used only to detect bugs*。它**不能**作为并发正确性保证，并发场景该用 ${C}CopyOnWriteArrayList${C} 或 ${C}ConcurrentHashMap${C}。
- 正确的单线程删除姿势：

${F}java
list.removeIf(x -> x.score < 60);                 // 推荐
// 或显式 Iterator
for (Iterator<Item> it = list.iterator(); it.hasNext(); ) {
    if (it.next().isStale()) it.remove();
}
${F}

## 四、集合选型表（Tutorials「Implementations」页的决策版）

| 场景 | 选 | 为什么 |
| --- | --- | --- |
| 按键查值 | ${C}HashMap${C} | 平均 O(1)，默认答案 |
| 需要按 key 排序遍历 | ${C}TreeMap${C} | 红黑树，O(log n)，支持范围查询 |
| 需要插入顺序 | ${C}LinkedHashMap${C} | 额外链表维护顺序；也可做 LRU |
| 去重 | ${C}HashSet${C} / ${C}LinkedHashSet${C} | 元素需正确实现 equals/hashCode |
| 频繁头部操作 / 当栈 | ${C}ArrayDeque${C} | 官方明确推荐优先于 Stack（Stack 继承 Vector 是历史设计错误） |
| 多线程 map | ${C}ConcurrentHashMap${C} | 分段细粒度锁；读无锁 |
| 只读共享 | ${C}List.of(...)${C}（Java 9+） | 不可变，天然线程安全 |

${F}java
Map<String, List<Order>> byUser = orders.stream()
    .collect(Collectors.groupingBy(Order::getUserId));   // 一行顶十行
${F}

## ⚠ 高频误区

1. **重写 ${C}equals${C} 不重写 ${C}hashCode${C}**：违反契约 2，HashSet/HashMap 行为未定义。
2. **在 for-each 里 ${C}list.remove()${C}**：触发 fail-fast；且 fail-fast 本身不可依赖。
3. **${C}Arrays.asList()${C} 当普通 List 用**：返回的是固定大小的视图，${C}add/remove${C} 抛 ${C}UnsupportedOperationException${C}；底层还是原数组，改它会改到源数组。
4. **拿 ${C}Stack${C} 当栈**：官方文档原话建议用 ${C}Deque${C} 代替。
5. **TreeMap 的 comparator 与 equals 不一致**：${C}compare${C} 返回 0 时元素会被视为「同一个 key」，逻辑上不同却相等的对象会被覆盖。
6. **stream 里修改外部状态**：parallel stream 下非线程安全的 collector 直接数据错乱。

## ✅ 自检清单

- [ ] 能默写 ${C}hashCode${C} 三条契约，并解释违反契约 2 的后果
- [ ] 能画出 HashMap 结构，说清树化条件（8 / 64）与负载因子 0.75 的出处
- [ ] 知道 fail-fast 的官方定位是「探测 bug」，不是并发保证
- [ ] 能一眼判断业务场景该用哪种 Map/List/Set
- [ ] 知道 ${C}List.of${C} 不可变、${C}Arrays.asList${C} 定长的区别

## 📚 延伸阅读

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
## 官方文档基线

- **Java Tutorials「Exceptions」trail**：把异常分为 *checked* 与 *unchecked* 并给出官方建议；
- **JLS §11（Exceptions）**：异常抛出与传播的语言级定义；
- **SLF4J User Manual** + **Logback Manual**：日志门面与实现的事实标准。

异常和日志是同一件事的两面：**异常决定程序怎么失败，日志决定人怎么理解失败**。线上排障 80% 的时间花在后者。

## 一、异常体系与 checked 的取舍

${F}
Throwable
├── Error              // JVM 级致命：OutOfMemoryError, StackOverflowError —— 不应捕获
└── Exception
    ├── RuntimeException  // unchecked：NPE, ISE, IndexOutOfBounds ...
    └── 其他              // checked：IOException, SQLException ...
${F}

checked 异常的设计意图是「**可恢复的、调用方必须面对的**」失败（Tutorials 原话：*recoverable conditions*）。工程共识：

- **对外/跨层 API** 尽量抛 unchecked，避免 ${C}throws${C} 签名污染每一层；
- **资源获取失败（IO/网络）**通常包装成业务异常再抛；
- **绝不用异常做流程控制**——抛出并填充栈的成本远高于普通分支，这是 JVM 层面的事实而非风格偏好。

## 二、try-with-resources：资源关闭的唯一正解

JDK 7 起官方推荐，实现 ${C}AutoCloseable${C} 的资源自动关闭，且异常不会被吞：

${F}java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(target)) {
    in.transferTo(out);
}
// in/out 关闭顺序与声明相反；若 try 体和 close 都抛异常，
// close 的异常以 suppressed 挂在主异常上，一条不丢
${F}

对比手写 ${C}finally${C}：老代码在 ${C}finally${C} 里再抛异常会**覆盖**主异常，这是无数「日志里看不到真正原因」的根源。

## 三、异常信息的三条纪律

1. **保留因果链**：包装时必须传 ${C}cause${C}——${C}throw new ServiceException("下单失败", e)${C}，而不是 ${C}new ServiceException("下单失败")${C}。丢了 cause，根因就断了。
2. **异常消息给「现场」不给「结论」**：写 ${C}"order not found, id=" + id${C}，不写 ${C}"error"${C}；也不要把敏感信息（手机号、token）拼进消息。
3. **同一异常只在一层处理**：每层都 catch-log-rethrow 的结果是同一条栈在日志里出现 5 次，排障时互相污染。

## 四、日志：SLF4J 门面 + Logback 实现

**用占位符，不用拼接**（SLF4J User Manual 的第一条建议）：

${F}java
log.debug("user {} order {} total {}", userId, orderId, total);  // ✅ 惰性求值
log.debug("user " + userId + " ...");                              // ❌ debug 关闭也照样拼串
if (log.isDebugEnabled()) { /* 仅当还要做昂贵计算时才用 */ }
${F}

**级别语义**（Logback 官方定义）：

| 级别 | 用途 | 判断标准 |
| --- | --- | --- |
| ERROR | 需要人立刻介入 | 线上 ERROR 告警必须有响应路径 |
| WARN | 自动恢复过/可降级 | 出现频率上升就是前兆指标 |
| INFO | 关键业务节点 | 一次请求 1–3 条封顶 |
| DEBUG | 排查细节 | 仅排障期开启 |

**链路追踪用 MDC**（Mapped Diagnostic Context，Logback 官方章节）：

${F}java
MDC.put("traceId", traceId);          // 入口处
try {
    log.info("order created");        // pattern 里 %X{traceId} 自动带出
} finally {
    MDC.clear();                      // 线程池复用，必须清理
}
${F}

**异常日志唯一正确写法**——把异常对象作为最后一个参数：

${F}java
log.error("handle order failed, id={}", orderId, e);   // ✅ 完整堆栈
log.error("handle order failed: " + e.getMessage());   // ❌ 只有 message，栈没了
e.printStackTrace();                                   // ❌ 绕过日志体系，无时间无级别
${F}

## ⚠ 高频误区

1. **catch 后什么都不做**（空 catch）：bug 消失术，排障时连自己都骗。
2. **${C}catch (Exception e)${C} 兜一切**：连 ${C}InterruptedException${C} 都吞——正确做法是恢复中断标志 ${C}Thread.currentThread().interrupt()${C}。
3. **在循环里打 INFO**：压测时日志 IO 直接把服务打垮，日志的写放大比 SQL 还猛。
4. **日志打印大对象**：对 DTO 不重写 ${C}toString${C} 就打印，会拖出全量字段（可能含密码）；Lombok ${C}@Data${C} + ${C}@Slf4j${C} 组合尤其要注意。
5. **用 System.out/err**：绕过级别控制与文件轮转，容器场景下还阻塞 stdout。
6. **异常用于业务分支**（如用 NumberFormatException 判断是否数字）：性能差且语义混乱，该用正则或解析 API。

## ✅ 自检清单

- [ ] 所有资源都是 try-with-resources，全库 0 个手写 finally-close
- [ ] 包装异常必带 cause，抽查 10 条历史异常日志能看到根因
- [ ] ERROR 级别数量可控（每分钟个位数），且有告警订阅
- [ ] MDC 有 put 必有 clear，traceId 能贯穿一个请求的所有日志
- [ ] 代码里 grep 不到 ${C}printStackTrace${C} 和 ${C}System.out.println${C}
- [ ] catch ${C}InterruptedException${C} 的地方都恢复了中断标志

## 📚 延伸阅读

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
## 官方文档基线

- **Maven 官方文档**：「Introduction to the POM」「Dependency Mechanism」「Build Lifecycle」——POM 的每个元素、依赖范围、生命周期阶段都在这三页里定义；
- **Gradle User Manual**：以「task graph」为核心构建模型。

构建工具问题的本质是**依赖管理**：版本从哪来、冲突怎么裁决、传递依赖怎么控制。

## 一、Maven 的三大核心概念（官方文档顺序）

**1. POM（Project Object Model）**：项目坐标 + 依赖 + 插件 + 继承关系的全量描述。坐标 ${C}groupId:artifactId:version${C} 是仓库世界的地址。

**2. 依赖机制**——先记住范围（scope）：

| scope | 编译期 | 运行期 | 传递给下游 | 典型 |
| --- | --- | --- | --- | --- |
| compile | ✓ | ✓ | ✓ | 业务依赖（默认） |
| provided | ✓ | ✗ | ✗ | Lombok、Servlet API |
| runtime | ✗ | ✓ | ✓ | JDBC 驱动 |
| test | 测试期 | 测试期 | ✗ | JUnit |
| import | 仅 ${C}dependencyManagement${C} | — | — | 导入 BOM |

**传递依赖的冲突仲裁**：官方规则是 **nearest wins（最近者胜）**——依赖树里路径最短的那个版本赢；路径一样长时**先声明的赢**。注意：这不是「最新版赢」，所以同一个库的不同版本可能同时存在于树的不同分支。

**3. 生命周期**：三套生命周期（clean / default / site），default 里最常用的是

${F}
validate → compile → test → package → verify → install → deploy
${F}

阶段是**有序且连带执行**的：执行 ${C}mvn verify${C} 会先跑完前面所有阶段；插件 goal 通过 phase 绑定进生命周期。

## 二、版本统一的三种正规姿势

**① 父 POM ${C}<dependencyManagement>${C}**：只声明版本不下依赖，子模块引用时免写版本号。

**② BOM（Bill of Materials）**：官方推荐的第三方集成方式——

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

**③ ${C}mvn dependency:tree -Dincludes=com.google.guava${C}**：排查「谁把哪个版本带进来」的唯一利器，冲突解决永远从它开始。

## 三、Gradle 的心智模型

Maven 是「**生命周期 + 约定**」，Gradle 是「**task 依赖图 + 编程能力**」：

- 构建脚本就是 Kotlin/Groovy 程序，task 之间声明依赖组成 DAG，Gradle 只执行受影响的 task（增量构建、build cache）；
- 官方明确建议：**优先用内置约定（java 插件）而不是自己写 task**，兼容 Maven 的目录布局与坐标体系；
- 版本管理对等物是 ${C}platform()${C}（对应 BOM）与 dependency constraints；
- 团队一致性靠 **Wrapper**：${C}gradle wrapper --gradle-version 8.10${C} 生成 ${C}gradlew${C} 提交进仓库，CI 与所有人共用同一版本。Maven 对应 ${C}mvnw${C}，同样是官方标准实践。

## 四、多模块项目结构（官方推荐布局）

${F}
my-app/
├── pom.xml                    # 父 POM：dependencyManagement + 插件统一
├── my-app-common/             # 纯领域对象与工具，无框架依赖
├── my-app-dao/                # 数据访问
├── my-app-service/            # 业务逻辑
└── my-app-web/                # 入口（可执行 jar），依赖上面所有模块
${F}

原则：**依赖只能自上而下，禁止成环**；「入口模块」独立出来，打包产物与业务模块解耦。

## ⚠ 高频误区

1. **SNAPSHOT 上生产**：SNAPSHOT 每次解析都可能变，构建不可重现；发布版本一律用 release 版。
2. **冲突解决靠本地试**：不跑 ${C}dependency:tree${C} 直接改版本，改完 A 冲突挪到 B。
3. **把依赖 jar 手动拷进 lib/ 目录**：脱离依赖管理，升级与安全扫描全部失效。
4. **父 POM 里 ${C}<dependencies>${C} 与 ${C}<dependencyManagement>${C} 混用**：前者会让**所有**子模块无条件继承依赖。
5. **Gradle 脚本里硬编码本地路径**：${C}/Users/xxx/lib${C} 一进 CI 就炸。
6. **不看 Wrapper 版本**：本机 3.9、CI 3.6，行为差异排查半天。

## ✅ 自检清单

- [ ] 说得清 nearest wins 与「先声明者胜」两条仲裁规则
- [ ] 第三方全家桶一律通过 BOM 导入，项目中无散落的硬编码版本
- [ ] 会用 ${C}mvn dependency:tree -Dincludes=...${C} 定位依赖来源
- [ ] mvnw / gradlew 已提交，CI 与本地版本一致
- [ ] 生产依赖 0 个 SNAPSHOT

## 📚 延伸阅读

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
## 官方文档基线

本章骨架取自 **MySQL 8.0 Reference Manual** 的官方目录：

- **Ch.3 Tutorial**：入门操作与基本查询；
- **Ch.11 Data Types**：类型选择的权威依据；
- **Ch.13 SQL Statement Syntax**：DDL/DML 语法；
- **Ch.15 InnoDB**：事务与锁的底层实现。

新手与老手写 SQL 的差距不在「会多少语法」，而在**类型、NULL 语义、JOIN 语义**这三个基本功上。

## 一、数据类型选择（Ch.11 的决策版）

| 业务 | 推荐 | 理由 |
| --- | --- | --- |
| 主键/计数 | ${C}BIGINT UNSIGNED${C} | 自增上限焦虑一次解决 |
| 金额 | ${C}DECIMAL(18,4)${C} | 精确小数；float/double 有舍入误差，**禁止**存钱 |
| 短文本 | ${C}VARCHAR(n)${C} | 行内存储，可设默认值 |
| 大文本 | ${C}TEXT${C}（并考虑拆表） | 行外存储，影响缓冲效率 |
| 时间 | ${C}DATETIME${C} 或 ${C}TIMESTAMP${C} | TIMESTAMP 带时区转换但上限 2038；一般业务用 DATETIME 更稳 |
| 状态 | ${C}TINYINT${C} + 字典表 | 别用 VARCHAR 存枚举字面量 |
| JSON | ${C}JSON${C} | 官方类型有校验与部分更新；查询频繁的字段请升为列 |

**NULL 语义**是三值逻辑（TRUE / FALSE / UNKNOWN）：${C}NULL = NULL${C} 结果是 UNKNOWN 而不是 TRUE，所以判空只能用 ${C}IS NULL${C}；${C}NOT IN${C} 子查询里出现 NULL 时整个条件恒为 UNKNOWN——这是「为什么 NOT IN 查不出数据」的官方答案。

## 二、JOIN 语义（最容易「以为懂了」的地方）

- ${C}INNER JOIN${C}：两表都匹配的行；
- ${C}LEFT JOIN${C}：左表全保留，右表无匹配补 NULL——**过滤右表的条件要写进 ON，不能写进 WHERE**，写进 WHERE 会把 LEFT 退化成 INNER：

${F}sql
-- ✅ 左表全保留，右侧仅取 status=1 的匹配
SELECT o.id, p.amount
FROM orders o LEFT JOIN payments p ON p.order_id = o.id AND p.status = 1;

-- ❌ WHERE p.status=1 把 p 全为 NULL 的左表行过滤掉了
SELECT o.id, p.amount
FROM orders o LEFT JOIN payments p ON p.order_id = o.id
WHERE p.status = 1;
${F}

## 三、事务与隔离级别（Ch.15 InnoDB + 官方事务隔离表）

InnoDB 默认 **REPEATABLE READ**（多数数据库默认 READ COMMITTED，别记混）。四种隔离级别对应三类并发异常：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| READ UNCOMMITTED | 会发生 | 会发生 | 会发生 |
| READ COMMITTED | 防住 | 会发生 | 会发生 |
| REPEATABLE READ（默认） | 防住 | 防住 | InnoDB 基本防住（MVCC+间隙锁） |
| SERIALIZABLE | 防住 | 防住 | 防住（代价是并发骤降） |

事务使用三纪律：**短**（不裹远程调用）、**小**（影响行数可控）、**明确**（显式 ${C}BEGIN${C}/${C}COMMIT${C}，不用自动提交裸奔）。

## 四、写好查询的六条硬规范

1. **不写 ${C}SELECT *${C}**：多取列破坏覆盖索引可能，网络传输白耗；
2. **索引列不做函数/运算**：${C}WHERE DATE(create_time) = '2026-09-17'${C} 让索引失效，改写成范围条件；
3. **分页用游标**：深分页 ${C}LIMIT 1000000, 20${C} 要扫 100 万行，改 ${C}WHERE id > :lastId LIMIT 20${C}；
4. **${C}COUNT(*)${C} 与 ${C}COUNT(col)${C} 语义不同**：前者数行（含 NULL 行），后者数该列非 NULL 的行——官方文档明确区分；
5. **批量插入合并**：${C}INSERT ... VALUES (...),(...),(...)${C} 远快于循环单条；
6. **隐式类型转换是坑**：${C}WHERE phone = 13800001111${C}（数字）对 ${C}VARCHAR${C} 列查询会放弃索引并做全表转换，字符串条件必须带引号。

${F}sql
-- 典型统计：按天订单量（覆盖索引 + 范围条件）
SELECT DATE(create_time) AS d, COUNT(*) AS cnt, SUM(amount) AS amt
FROM orders
WHERE create_time >= '2026-09-01' AND create_time < '2026-10-01'
  AND status = 1
GROUP BY DATE(create_time)
ORDER BY d;
${F}

## ⚠ 高频误区

1. **用 float/double 存金额**：舍入误差在累加时爆发。
2. **WHERE 里对索引列套函数**：索引直接失效。
3. **LEFT JOIN 后在 WHERE 过滤右表**：悄悄变 INNER JOIN。
4. **不用事务包裹多表写**：进程崩了就出现半成品数据。
5. **TEXT 大字段和业务列混在一张热表**：缓冲池被大字段挤占，整体性能劣化。
6. **在生产直接跑无 LIMIT 的 UPDATE/DELETE**：先 ${C}SELECT${C} 确认影响面，再改写为 DML。

## ✅ 自检清单

- [ ] 金额一律 DECIMAL，时间字段统一时区口径
- [ ] 能口头解释 NULL 的三值逻辑与 NOT IN 遇 NULL 的行为
- [ ] LEFT JOIN 的过滤条件写在 ON 里而不是 WHERE
- [ ] 知道当前库的隔离级别，并说得出它的并发异常面
- [ ] 所有 UPDATE/DELETE 都带精确 WHERE 且先验证影响行数

## 📚 延伸阅读

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
## 官方文档基线

全部取自 **Spring Boot Reference**（docs.spring.io/spring-boot）官方目录：

- **Getting Started**：第一个应用；
- **Using Spring Boot**：Build Systems / Structuring Your Code / Configuration / Beans and Dependency Injection；
- **Externalized Configuration**：配置加载的完整优先级表；
- **Production-ready Features**：Actuator。

Spring Boot 解决的问题是**装配**：自动配置（auto-configuration）+ starter 起步依赖 + 内嵌服务器，把「搭一个能上生产的 Web 服务」从半天缩短到五分钟。它不是新框架，是 Spring 的**观点化默认值**。

## 一、@SpringBootApplication 拆开是什么

它是一个三合一注解（官方 Javadoc 明确列出）：

- ${C}@SpringBootConfiguration${C}：本类是配置类；
- ${C}@EnableAutoConfiguration${C}：按 classpath 推断并启用自动配置；
- ${C}@ComponentScan${C}：扫描本包及子包——**所以启动类放根包，别放子包**，这是官方「Structuring Your Code」一节的原话建议。

**自动配置原理一句话**：Spring Boot 启动时加载各 starter 里的 ${C}AutoConfiguration.imports${C} 清单，按条件注解（${C}@ConditionalOnClass${C} 等）判断哪些配置生效。加了 spring-boot-starter-web 就有 MVC + Tomcat，加了 starter-data-jpa 就有 DataSource + EntityManager——**依赖即配置**。

## 二、配置体系（Externalized Configuration 章节）

Spring Boot 官方给出了**17 级配置优先级**，工程上记住前六级就够用（从高到低）：

1. 命令行参数（${C}--server.port=8081${C}）
2. ${C}SPRING_APPLICATION_JSON${C} 环境变量
3. JVM 系统属性（${C}-Dserver.port=8081${C}）
4. OS 环境变量
5. profile 专属的 ${C}application-{profile}.yml${C}
6. ${C}application.yml${C}

**类型安全配置**——官方推荐的绑定方式：

${F}java
@ConfigurationProperties(prefix = "order")
@Validated
public record OrderProps(
    @NotNull Duration timeout,          // order.timeout=3s 自动转换
    @Min(1) int maxRetry) {}
${F}

比逐个 ${C}@Value${C} 好在：集中、可校验、IDE 可跳转、重构安全。

## 三、一个标准的 REST 服务（官方风格）

${F}java
@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {

    private final OrderService orderService;      // 构造器注入，官方推荐
    public OrderController(OrderService orderService) { this.orderService = orderService; }

    @GetMapping("/{id}")
    public Order get(@PathVariable Long id) {
        return orderService.require(id);
    }

    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody CreateOrderReq req) {
        var order = orderService.create(req);
        return ResponseEntity.created(URI.create("/api/orders/" + order.id())).body(order);
    }
}
${F}

要点：**构造器注入**（官方文档明确推荐，字段注入无法做 final 与单测隔离）；${C}record${C} 做 DTO；返回 201 + Location 头。

**错误响应**：Spring Boot 3 对 ${C}/error${C} 默认输出 **ProblemDetail**（RFC 7807 结构，后被 RFC 9457 更新但格式兼容），统一错误体不用自己发明。

## 四、Actuator：生产可观测的官方答案

引入 ${C}spring-boot-starter-actuator${C} 后获得：

- ${C}/actuator/health${C}：健康检查（数据库/Redis/MQ 状态自动聚合），K8s 与 LB 探针直接用它；
- ${C}/actuator/metrics${C}：JVM/HTTP/连接池指标，可接 Micrometer → Prometheus；
- ${C}/actuator/env, /actuator/beans${C}：排障利器，**生产必须收紧暴露面**：

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

## ⚠ 高频误区

1. **启动类放子包**：默认扫描不到同包外的 Bean，出现「明明有 Bean 却注入失败」。
2. **业务逻辑写在 Controller**：Controller 只做参数转换与编排，业务进 Service 层。
3. **配置硬编码**：数据库地址写死在类里，跨环境必炸——一切环境差异走配置。
4. **Actuator 全量暴露**：${C}include: "*"${C} 把 env、heapdump 裸奔公网，等于泄露源码级信息。
5. **字段注入（@Autowired 到字段）**：无法声明 final，单测只能靠反射注入。
6. **忽略优雅停机**：官方配置一行 ${C}server.shutdown: graceful${C}，滚动发布不掉正在处理的请求。

## ✅ 自检清单

- [ ] 启动类在根包，构造器注入，无字段注入
- [ ] 环境差异全部外置：profile + 环境变量，代码里 grep 不到硬编码地址
- [ ] @ConfigurationProperties + 校验，启动即发现配置错误
- [ ] health/metrics 已接入探针与监控，暴露面收紧到白名单
- [ ] graceful shutdown 已开启，发布验证过无请求中断

## 📚 延伸阅读

- Spring Boot Reference：Getting Started → Using Spring Boot → Externalized Configuration → Production-ready Features（按此顺序读一遍胜过十篇博客）
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
