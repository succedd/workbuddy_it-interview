/* =========================================================================
 *  js/docs/java.js — 技术教程「Java 后端」方向数据（标准实战篇）
 *
 *  风格：原理 → 实战 → 踩坑 → 排障清单，10 年+ 老鸟实战口吻。
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
    desc: "从「能写出能跑的代码」到「能扛住高并发、定位线上疑难杂症、做架构取舍」的完整路径。覆盖语法集合、JVM/GC、并发、Spring 全家桶、MySQL、Redis 到分布式。",
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
            minutes: 16,
            updated: "2026-09-15",
            applies: "JDK 8 / 11 / 17",
            tags: ["Java", "集合", "基础"],
            terms: ["Java", "集合", "HashMap", "ArrayList"],
            body: `
## 为什么先吃透集合

面试和实际开发里，**80% 的业务代码本质是在操作集合**：查列表、去重、分组、排序、按条件过滤。集合用错了，轻则多写一百行，重则并发下直接炸。

## 一、相等与哈希：这是后面所有坑的根

${C}==${C} 和 ${C}equals${C} 的区别是面试题常客，但真正要懂的是**为什么**：

- ${C}==${C} 比的是「是不是同一个对象（引用）」
- ${C}equals${C} 比的是「逻辑上是不是相等」
- ${C}hashCode${C} 是给 HashMap / HashSet 分桶用的

**铁律**：**重写了 ${C}equals${C} 必须重写 ${C}hashCode${C}**，否则放进 HashMap 就找不到了。

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
    return Objects.hash(id);                 // 与 equals 用的字段一致
}
${F}

## 二、最常用的集合，以及它们的脾气

| 集合 | 底层 | 适用 | 典型坑 |
|---|---|---|---|
| ${C}ArrayList${C} | 动态数组 | 随机读多、尾部增删 | 中间插入 ${C}O(n)${C}，扩容拷数组 |
| ${C}LinkedList${C} | 双向链表 | 头尾增删 | 随机读慢，实际很少用 |
| ${C}HashMap${C} | 数组 + 链表/红黑树 | KV 查找 | 线程不安全、key 要正确实现哈希 |
| ${C}ConcurrentHashMap${C} | 分段/桶锁 | 并发 KV | 别用 ${C}HashMap${C} 当共享缓存 |
| ${C}HashSet${C} | 基于 HashMap | 去重 | 同上 |
| ${C}TreeMap${C} | 红黑树 | 需要有序/范围 | 比 HashMap 慢 |

**迭代时删除**：必须用迭代器的 ${C}remove()${C}，直接 ${C}list.remove()${C} 会抛 ${C}ConcurrentModificationException${C}（fail-fast 机制）。

${F}java
// 正确：删掉所有偶数
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) it.remove();
}
// Java 8+ 更省事
list.removeIf(n -> n % 2 == 0);
${F}

## 三、字符串：不可变带来的那些事

String 在 Java 里是**不可变**的，每次 ${C}+${C} 都会新建对象。循环里拼字符串用 ${C}StringBuilder${C}：

${F}java
StringBuilder sb = new StringBuilder();
for (String s : list) sb.append(s).append(",");  // 不新建大量中间对象
String result = sb.toString();
${F}

⚠ 单条 SQL / 日志拼接用 ${C}+${C} 没事，但**循环内**一定要 ${C}StringBuilder${C}，我见过有人在一个大循环里用 ${C}+${C} 拼 JSON，QPS 一高 CPU 直接打满。

## 四、Integer 缓存：一个隐蔽的坑

${F}java
Integer a = 127, b = 127;
System.out.println(a == b);   // true（IntegerCache 缓存 -128~127）
Integer c = 128, d = 128;
System.out.println(c == d);   // false！超出缓存，是两个对象
${F}

**结论**：包装类型比较一律用 ${C}equals${C}，别用 ${C}==${C}。这条栽过的人比你想象的多。

## ⚠ 踩坑与经验

1. **把 ArrayList 当队列用**：${C}list.remove(0)$C} 是 ${C}O(n)$C}，高并发下用 ${C}ArrayDeque${C} 或 ${C}LinkedBlockingQueue${C}。
2. **HashMap 当全局缓存**：并发 put 可能死循环（JDK7）或数据错乱（JDK8+ 也不安全），共享状态用 ${C}ConcurrentHashMap${C}。
3. **foreach 里改集合**：要么 ${C}Iterator.remove()${C}，要么先收集再批量删，否则 ${C}CME${C} 异常。
4. **equals/hashCode 只重写一个**：放进 HashSet/HashMap 后「明明相等却查不到」。
5. **用 == 比包装类型**：见上面的 Integer 缓存坑。

## ✅ 排障清单

- [ ] 对象当 key / 放 Set：equals 和 hashCode 成对重写且字段一致
- [ ] 并发场景：KV 用 ConcurrentHashMap，队列用 BlockingQueue
- [ ] 循环中拼字符串：StringBuilder
- [ ] 包装类型比较：一律 equals
- [ ] 迭代中删除：Iterator.remove() 或 removeIf
`
          },
          {
            id: "exception-log",
            title: "异常与日志规范",
            minutes: 14,
            updated: "2026-09-15",
            applies: "JDK 8+ / SLF4J + Logback",
            tags: ["Java", "异常", "日志"],
            terms: ["异常", "日志", "Exception"],
            body: `
## 一、Checked / Unchecked 别再背概念，看「谁来兜底」

- **Checked（Exception）**：编译期强制你处理（IOException）。意思是「这件事可能失败，调用方必须表态怎么处理」。
- **Unchecked（RuntimeException）**：不强制，通常是**程序 bug**（空指针、越界、非法参数）。

经验法则：**能合理恢复用受检异常；是 bug 用运行时异常**。别图省事全包成 RuntimeException 然后吞掉。

## 二、try-catch 的三种坏味道

**1. 吞异常（最致命）**：

${F}java
try {
    doSomething();
} catch (Exception e) {
    // 啥也不做 —— 线上出问题你连现场都没有
}
${F}

**2. 打异常却丢了堆栈**：

${F}java
catch (Exception e) {
    log.error("出错了: " + e.getMessage());  // 只打了 message，堆栈没了！
}
// 正确：把异常对象传给日志框架
log.error("doSomething 失败, orderId={}", orderId, e);
${F}

**3. 一把大 try 包住整个方法**：分不清是哪一步出错，排查时只能靠猜。

## 三、该抛还是该捕获？

一句话：**你处理不了就往上抛，在能决定的那一层统一处理。** 典型分层：

- DAO 层：抛出原始异常（保留堆栈）
- Service 层：转成业务异常（${C}OrderNotFoundException${C}），附上下文
- Controller / 全局拦截器：统一捕获，转成标准错误响应

${F}java
// 自定义业务异常，带错误码
public class BizException extends RuntimeException {
    private final String code;
    public BizException(String code, String msg) { super(msg); this.code = code; }
}
${F}

## 四、日志：别人靠它还原你的事故

${F}java
// 好的日志：带关键上下文，能定位到具体哪笔单子
log.info("开始创建订单 orderId={} userId={} sku={}", orderId, userId, sku);
// 坏的日志：log.debug("here"); —— 没有任何信息量
${F}

**SLF4J 占位符 ${C}{}${C} 而不是 ${C}"a"+b${C}**：后者即使不打印也会做字符串拼接，高并发下是隐性性能损耗。

## ⚠ 踩坑与经验

1. **catch 了大异常又没处理**：一个 ${C}catch (Exception)${C} 把 NPE、OOM 全吞了，问题被掩盖成「偶发」。
2. **finally 里 return**：会覆盖 try 的返回值，且吞掉异常，极难排查。
3. **日志打敏感信息**：身份证、密码、token 进日志 = 合规事故。务必脱敏。
4. **ERROR 满天飞**：把可预期的业务失败（余额不足）也打 ERROR，告警系统天天响，真出事反而被淹没。
5. **日志级别不懂分**：INFO 记关键节点、WARN 记需关注、ERROR 记要人处理的。

## ✅ 排障清单

- [ ] 不吞异常：至少 ${C}log.error(msg, e)${C} 带上堆栈
- [ ] 不在 finally 写 return
- [ ] 业务异常带 code + 上下文，在统一层转响应
- [ ] 用 ${C}{}${C} 占位符，不拼接字符串
- [ ] 日志脱敏，级别区分准确
`
          },
          {
            id: "build-tool",
            title: "Maven / Gradle 与项目结构",
            minutes: 13,
            updated: "2026-09-15",
            applies: "Maven 3.6+ / Gradle 7+",
            tags: ["Maven", "构建", "工程"],
            terms: ["Maven", "依赖", "构建"],
            body: `
## 一、依赖为什么总出幺蛾子

Maven 的依赖是**传递**的：A 依赖 B，B 依赖 C，你不用写 C 就能用。麻烦也来自这里——**版本冲突**。

${F}xml
<dependency>
  <groupId>org.apache.commons</groupId>
  <artifactId>commons-lang3</artifactId>
  <version>3.12.0</version>
</dependency>
${F}

查冲突最直接：

${F}bash
mvn dependency:tree | grep -B3 -A3 "commons-lang"   # 看谁引入了哪个版本
mvn dependency:tree -Dverbose -Dincludes=commons-lang3
${F}

## 二、依赖仲裁：谁说了算

Maven 两条规则：**最短路径优先** + **先声明优先**。所以同一个库出现多个版本时，离你近的（直接依赖）赢。想强制版本，用 ${C}<dependencyManagement>${C} 或 ${C}exclusions${C} 踢掉传递依赖。

${F}xml
<dependency>
  <groupId>com.example</groupId><artifactId>b</artifactId><version>1.0</version>
  <exclusions>
    <exclusion><groupId>commons-lang</groupId><artifactId>commons-lang</artifactId></exclusion>
  </exclusions>
</dependency>
${F}

## 三、scope：依赖的「生命周期边界」

| scope | 含义 | 典型 |
|---|---|---|
| compile | 编译+运行都要（默认） | 业务库 |
| provided | 编译需要，运行由容器给 | ${C}servlet-api${C} |
| runtime | 编译不需要，运行才要 | JDBC 驱动 |
| test | 只测试用 | JUnit |

⚠ **servlet-api / jakarta 用 provided**：打进 WAR 会和容器里的冲突，经典的 ${C}ClassNotFoundException${C} / ${C}NoSuchMethodError${C} 来源。

## 四、多模块：别把所有代码塞一个 pom

${F}xml
<modules>
  <module>order-api</module>      <!-- 接口/契约 -->
  <module>order-service</module>  <!-- 实现 -->
  <module>order-common</module>   <!-- 公共常量/工具 -->
</modules>
${F}

接口和实现分离，是后面做微服务、做 SDK 的基础。

## ⚠ 踩坑与经验

1. **Snapshot 依赖上线**：${C}-SNAPSHOT${C} 会变，生产环境一律用固定版本，否则「我本地是好的」就来了。
2. **依赖全写 provided/compile 乱来**：打包体积爆炸、类冲突。按生命周期选 scope。
3. **根 pom 不锁版本**：${C}dependencyManagement${C} 不统一，A 模块用 3.9、B 用 3.12，行为不一致。
4. **仓库没配 mirror**：每次都去中央仓库拉，慢且不稳定，内网一定要配私服（Nexus/Artifactory）。
5. **target 不清理就打包**：偶尔遇到诡异问题先 ${C}mvn clean${C}。

## ✅ 排障清单

- [ ] ${C}dependency:tree${C} 看清版本来源
- [ ] 冲突版本用 dependencyManagement / exclusions 锁死
- [ ] servlet-api 等用 provided
- [ ] 生产不用 SNAPSHOT
- [ ] 打包前先 clean
`
          },
          {
            id: "mysql-basic",
            title: "MySQL 基础与 SQL 编写",
            minutes: 15,
            updated: "2026-09-15",
            applies: "MySQL 8.0",
            tags: ["MySQL", "SQL", "基础"],
            terms: ["MySQL", "SQL", "数据库"],
            body: `
## 一、先建立「存储引擎」的概念

MySQL 8 默认 ${C}InnoDB${C}。它和老 MyISAM 最大的区别：**事务 + 行级锁 + 外键**。现在几乎无脑选 InnoDB，除非你明确知道自己在做什么。

## 二、建表时这几件事决定你后面的命

${F}sql
CREATE TABLE orders (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no  VARCHAR(32)  NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  status    TINYINT      NOT NULL DEFAULT 0,
  amount    DECIMAL(12,2) NOT NULL,          -- 金额用 DECIMAL，别用 FLOAT！
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
${F}

**几条血泪经验**：

- **金额永远 DECIMAL**：${C}FLOAT${C}/${C}DOUBLE${C} 有精度误差，算钱会出 0.1 不等于 0.1 的离谱事。
- **字符集 utf8mb4**：MySQL 的 ${C}utf8${C} 是假 utf8（最多 3 字节），存不了 emoji 和某些生僻字，用 ${C}utf8mb4${C}。
- **主键用自增 BIGINT**：有序插入，页分裂少；别用 UUID 当主键（离散写入，索引碎片严重）。
- **时间用 DATETIME/TIMESTAMP**：别用字符串存时间，没法比较和计算。

## 三、SELECT 的书写顺序 vs 执行顺序

新手容易混淆。你写的顺序：

${F}sql
SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT ...
${F}

数据库**真正执行**的顺序：

${C}FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT${C}

这就是为什么 ${C}WHERE${C} 里不能用 ${C}SELECT${C} 里起的别名——别名在 SELECT 才生成。

## 四、JOIN 与子查询怎么选

${F}sql
-- 用 JOIN 把两表关联（驱动表放左边，小表驱动大表）
SELECT o.order_no, u.name
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 1;

-- IN 适合子查询结果集小；EXISTS 适合「存在即返回」，子查询大时更优
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.vip = 1);
${F}

## ⚠ 踩坑与经验

1. **${C}SELECT *${C}**：返回多余字段，浪费 IO 和带宽；且索引覆盖失效。明确列名。
2. **在列上套函数导致索引失效**：${C}WHERE DATE(created_at)=...${C} 用不上索引，改成范围查询 ${C}created_at >= ... AND created_at < ...${C}。
3. **LIMIT 深分页慢**：${C}LIMIT 100000, 20${C} 要扫 10 万行，用「游标分页」${C}WHERE id > last_id LIMIT 20${C}。
4. **隐式类型转换**：${C}WHERE phone = 13800000000${C} 而 phone 是 varchar，会转数字再比，索引失效。
5. **NULL 判断用 IS NULL**：${C}= NULL${C} 永远为假，必须用 ${C}IS NULL${C} / ${C}IS NOT NULL${C}。

## ✅ 排障清单

- [ ] 金额 DECIMAL、字符集 utf8mb4、主键自增 BIGINT
- [ ] 不用 SELECT *，不用 FLOAT 存钱
- [ ] WHERE 不对列套函数，避免索引失效
- [ ] 深分页用游标而非 LIMIT offset
- [ ] NULL 用 IS NULL 判断
`
          },
          {
            id: "springboot-first",
            title: "Spring Boot 第一个服务",
            minutes: 14,
            updated: "2026-09-15",
            applies: "Spring Boot 2.7 / 3.x",
            tags: ["Spring", "Boot", "Web"],
            terms: ["Spring", "Spring Boot", "依赖注入"],
            body: `
## 一、为什么是「约定优于配置」

Spring Boot 帮你把 90% 的样板配置（数据源、Web 容器、序列化）按约定默认配好，你只写业务。新人最大的误区是**一上来就堆配置**，其实大部分可以默认。

## 二、最小可跑的结构

${F}java
@SpringBootApplication          // = @Configuration + @EnableAutoConfiguration + @ComponentScan
@RestController
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello(@RequestParam String name) {
        return "hello, " + name;
    }
}
${F}

## 三、分层：别把所有逻辑写进 Controller

真实项目至少分三层，职责清晰、好测试：

| 层 | 职责 | 注解 |
|---|---|---|
| Controller | 收参数、校验、转响应 | ${C}@RestController${C} |
| Service | 业务逻辑 | ${C}@Service${C} |
| Repository / Mapper | 数据访问 | ${C}@Repository${C} / MyBatis Mapper |

${F}java
@Service
public class OrderService {
    private final OrderMapper mapper;
    public OrderService(OrderMapper mapper) { this.mapper = mapper; }  // 构造注入
    public OrderDTO get(Long id) { return mapper.selectById(id); }
}
${F}

⚠ **用构造注入（@RequiredArgsConstructor + final）而不是字段 @Autowired**：后者对单元测试不友好，且隐藏了依赖。

## 四、配置：application.yml 与多环境

${F}yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useUnicode=true&characterEncoding=utf8mb4
    username: ${C}DB_USER${C}        # 从环境变量读，别把密码写死在仓库
    password: ${C}DB_PWD${C}
---
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: jdbc:mysql://prod-db:3306/demo
${F}

**配置优先级**：命令行参数 > 环境变量 > application-prod.yml > application.yml。

## ⚠ 踩坑与经验

1. **密码写进仓库**：用环境变量或配置中心，别提交明文，Git 历史擦不干净。
2. **循环依赖**：A 注入 B、B 注入 A，Spring 会报 ${C}BeanCurrentlyInCreationException${C}（Spring Boot 2.6+ 默认禁止）。重构拆出公共逻辑，别靠 @Lazy 打补丁。
3. **Controller 里写业务**：无法单测、无法复用，后期一团乱。
4. **@Transactional 加在 private / 内部调用的方法上不生效**：事务靠代理，自调用绕过了代理。
5. **启动慢/依赖冲突**：${C}spring-boot-starter${C} 有一堆传递依赖，版本要统一，用 ${C}dependencyManagement${C} 锁。

## ✅ 排障清单

- [ ] 分层清晰：Controller 薄、Service 厚、Mapper 只管数据
- [ ] 用构造注入，不写死密码
- [ ] 多环境用 profile，敏感配置走环境变量
- [ ] @Transactional 在 public 外部调用的方法上才生效
- [ ] 依赖版本统一，避免 jar 冲突
`
          },
          {
            id: "git-flow",
            title: "Git 与团队协作流程",
            minutes: 12,
            updated: "2026-09-15",
            applies: "Git 2.x",
            tags: ["Git", "协作", "流程"],
            terms: ["Git", "分支", "合并"],
            body: `
## 一、先搞懂三个区

工作区 → 暂存区（index）→ 本地仓库 → 远程仓库。很多人 ${C}git add${C} / ${C}git commit${C} 机械敲，出了事不会救，就是没建立这个心智模型。

## 二、日常最高频的命令

${F}bash
git status                      # 先看现在在哪、改了什么——比什么都重要
git add -p                      # 交互式暂存，只 add 想提交的部分（避免把调试代码带进去）
git commit -m "fix: 订单状态机漏了取消态"   # 约定式提交，见名知意
git fetch origin                # 只拉元数据，不自动合并，安全
git rebase origin/main          # 把本地提交「挪」到最新 main 之上，历史线性干净
git push -u origin feat/order   # 首次推送建立跟踪
${F}

⚠ **merge 和 rebase 的区别**：merge 保留分叉历史，rebase 改写历史让线变直。团队协作里：**本地未推送的提交可以 rebase 整理；已推送的提交不要 rebase**（会改写公共历史，坑队友）。

## 三、分支模型：feature / main / release

- ${C}main${C}：稳定可发布
- ${C}feat/xxx${C}：功能分支，从 main 拉，合回 main
- ${C}hotfix/xxx${C}：线上紧急修复

走 PR/MR 做代码评审，是质量底线。我见过太多「直接 push main」导致的线上事故。

## 四、救火命令（关键时刻能救命）

${F}bash
git stash                       # 手头改了一半要去修别的，先暂存
git stash pop                  # 回来接着干
git restore <file>             # 丢弃某个文件的改动（未提交）
git commit --amend             # 改最近一次提交（未推送时）
git reflog                     # 查看 HEAD 去过哪，误操作后能找回来
git revert <commit>            # 安全地「反做」某次提交（不改写历史）
${F}

## ⚠ 踩坑与经验

1. **${C}git reset --hard${C} 后以为没了**：先 ${C}git reflog${C} 找回来，再 ${C}reset${C} 回去。
2. **强推公共分支 ${C}git push -f${C}**：把别人的提交冲掉了。除非你完全清楚后果，否则用 ${C}git revert${C}。
3. **一次提交塞一万个改动**：review 没人看得动，回滚也难。小步提交、单一职责。
4. **不拉就推**：先 ${C}fetch${C} + ${C}rebase${C}，再 push，避免冲突堆到别人头上。
5. **提交信息写「fix bug」**：半年后你也不知道改了啥。用「动词+对象+原因」。

## ✅ 排障清单

- [ ] 改动前先 ${C}git status${C} 确认状态
- [ ] 用 ${C}add -p${C} 精确暂存，避免夹带
- [ ] 未推送可 rebase，已推送用 revert
- [ ] 误删用 ${C}reflog${C} 找回
- [ ] 走 PR/MR 评审，不直推 main
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
            minutes: 18,
            updated: "2026-09-15",
            applies: "JDK 8 / 11 / 17（G1/ZGC）",
            tags: ["JVM", "GC", "内存"],
            terms: ["JVM", "GC", "垃圾回收", "内存"],
            body: `
## 一、内存分代：为什么对象分代

JVM 把堆分成**年轻代（Young）**和**老年代（Old）**。依据是「弱分代假说」：绝大多数对象朝生夕死。所以年轻代用复制算法（快），老年代用标记整理（慢但省空间）。

${C}堆 = 年轻代(Eden + S0 + S1) + 老年代 + (JDK8 前的)永久代/元空间${C}

## 二、一次对象从生到死的旅程

1. new 对象先放 ${C}Eden${C}
2. Eden 满了 → **Minor GC**：存活对象复制到 S0，年龄+1
3. 下次 Minor GC：Eden + S0 存活的复制到 S1，年龄再+1
4. 年龄到阈值（默认 15）→ **晋升老年代**
5. 老年代满了 → **Major/Full GC**：全局回收，慢且会 Stop-The-World

⚠ **Full GC 是性能杀手**：一次 Full GC 可能停顿几百毫秒到几秒，高并发下直接超时。调优目标就是**减少 Full GC 的频率和耗时**。

## 三、常见 GC 与怎么选（JDK 版本相关，别背错）

| 收集器 | 特点 | 适用 |
|---|---|---|
| **G1**（JDK9+ 默认） |  Region 化、可预测停顿 | 大堆（4G~几十 G）通用首选 |
| **ZGC**（JDK15+ 生产） | 停顿 < 10ms，并发几乎全阶段 | 超大堆、低延迟敏感 |
| CMS（已废弃） | 老年代并发，但碎片+停顿不可控 | 别用 |

## 四、关键参数（G1 为例）

${F}bash
java -Xms4g -Xmx4g \\                 # 堆初始=最大，避免动态扩容抖动
     -XX:+UseG1GC \\
     -XX:MaxGCPauseMillis=200 \\       # 目标停顿，只是「目标」不是保证
     -XX:InitiatingHeapOccupancyPercent=45 \\  # 老年代占用到这比例启动并发标记
     -Xlog:gc*:file=gc.log:time,level,tags   # 一定要开 GC 日志，排障靠它
${F}

⚠ **容器里必须让 JVM 感知 cgroup**：JDK 8u191+ / 11+ 默认支持，用 ${C}-XX:MaxRAMPercentage=70.0${C} 而非写死 ${C}-Xmx${C}，否则按宿主机内存算，必被 OOMKilled。

## 五、怎么判断「GC 有问题」

看 GC 日志里的三件事：**停顿总时长、Full GC 频率、晋升失败（Promotion Failed）**。

${F}bash
# 实时看 GC 概况
jstat -gcutil <pid> 1s
# 关键列：E(Eden) O(Old) YGC/YGCT(年轻代次数/耗时) FGC/FGCT(全量次数/耗时)
${F}

## ⚠ 踩坑与经验

1. **-Xmx 和 -Xms 不一致**：堆在运行时动态扩缩，扩的时候有停顿抖动。生产设成一样。
2. **堆设太大**：Full GC 一次扫几十 G，停顿几秒。不是越大越好，按业务压测定。
3. **大对象/大集合长期引用**：撑爆老年代，频繁 Full GC。用完及时置 null 或缩范围。
4. **没开 GC 日志**：出事只能盲猜。日志成本极低，必须开。
5. **误用 CMS**：已废弃且坑多，新项目直接用 G1/ZGC。

## ✅ 排障清单

- [ ] 容器里用 MaxRAMPercentage 让 JVM 感知 cgroup
- [ ] -Xms = -Xmx，避免扩缩抖动
- [ ] 开启 GC 日志（jstat / -Xlog）
- [ ] 关注 Full GC 频率与停顿、晋升失败
- [ ] 新项目用 G1/ZGC，别碰 CMS
`
          },
          {
            id: "concurrency",
            title: "并发编程与线程池",
            minutes: 18,
            updated: "2026-09-15",
            applies: "JDK 8+",
            tags: ["并发", "线程池", "多线程"],
            terms: ["并发", "线程池", "线程", "锁"],
            body: `
## 一、线程池：为什么不能直接 new Thread

每次请求 new 一个线程，创建/销毁开销大，且无法控制总量——流量一高，线程爆炸把机器拖死。**线程池复用线程、限流、统一管理**，是后端基本功。

## 二、ThreadPoolExecutor 的 7 个参数（必须背下来）

${F}java
new ThreadPoolExecutor(
    corePoolSize,      // 核心线程数，常驻
    maximumPoolSize,   // 最大线程数
    keepAliveTime,     // 多余线程空闲存活时间
    TimeUnit.SECONDS,
    workQueue,         // 任务队列
    threadFactory,     // 线程命名（排查时能看到业务名，很重要）
    rejectedExecutionHandler // 拒绝策略
);
${F}

**任务提交后的流转**：核心线程满 → 进队列 → 队列满 → 开到最大线程 → 还满 → 触发拒绝策略。

⚠ **最经典的坑：${C}newFixedThreadPool${C} / ${C}newCachedThreadPool${C} 的队列/线程无界**，任务积压会 OOM。直接用 ${C}ThreadPoolExecutor${C} 明确指定有界队列和拒绝策略。

## 三、队列与拒绝策略怎么选

| 队列 | 行为 | 注意 |
|---|---|---|
| ${C}ArrayBlockingQueue${C} | 有界，指定容量 | 安全，推荐 |
| ${C}LinkedBlockingQueue${C}(无参) | 无界 | 会撑爆内存 |
| ${C}SynchronousQueue${C} | 不缓存，直接交线程 | 配合大 maximumPoolSize |

拒绝策略：${C}AbortPolicy${C}（抛异常，默认）、${C}CallerRunsPolicy${C}（调用者线程自己跑，天然限流，推荐）、Discard。

## 四、线程安全：别只记得 synchronized

${F}java
// 1. synchronized：简单，但锁粒度粗
// 2. ReentrantLock：可中断、可超时、可公平
private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try { /* 临界区 */ } finally { lock.unlock(); }

// 3. 高并发计数：AtomicLong（CAS，比锁轻）
private final AtomicLong counter = new AtomicLong();
counter.incrementAndGet();

// 4. 并发容器：ConcurrentHashMap 分段锁，读基本无锁
${F}

## 五、可见性与重排序：volatile 不是万能药

${C}volatile${C} 保证**可见性**（一个线程改了，别的立刻看到）和**禁止指令重排**，但**不保证原子性**（${C}i++${C} 仍非线程安全）。需要原子复合操作请用 ${C}Atomic${C} 或锁。

## ⚠ 踩坑与经验

1. **用完即弃的线程**：没用线程池，流量高峰创建几千线程，Context Switch 把 CPU 吃完。
2. **无界队列 OOM**：用 ${C}Executors${C} 快捷方法却不知底层无界，任务积压爆内存。
3. **线程没命名**：出事时 ${C}jstack${C} 里全是 pool-1-thread-3，根本分不清谁干的。
4. **锁里做 IO / 远程调用**：持锁时间长，别人全阻塞。锁只包必要计算。
5. **volatile 当计数器**：${C}i++${C} 非原子，结果偏小。

## ✅ 排障清单

- [ ] 用 ThreadPoolExecutor 显式配置，不用无界快捷方法
- [ ] 队列有界 + 合适拒绝策略（CallerRuns 兜底限流）
- [ ] 线程命名，便于 jstack 定位
- [ ] 锁粒度要小，锁内不 IO
- [ ] 复合原子操作上 Atomic / 锁，volatile 只管可见性
`
          },
          {
            id: "spring-principle",
            title: "Spring 原理（IoC/AOP/事务）",
            minutes: 17,
            updated: "2026-09-15",
            applies: "Spring 5 / Spring Boot 2.7+",
            tags: ["Spring", "IoC", "AOP", "事务"],
            terms: ["Spring", "IOC", "AOP", "事务", "依赖注入"],
            body: `
## 一、IoC / DI：控制反转到底反转了啥

传统是你 ${C}new${C} 依赖；IoC 把「创建和装配对象」交给容器，你只声明「我需要什么」。好处：**解耦、易测试、配置集中**。

${C}@Component${C} 标注的 Bean 由 Spring 扫描进容器，按类型/名字注入。

## 二、AOP：把横切逻辑从业务里抽出来

日志、鉴权、事务、监控都是「横切关注点」。AOP 用**代理**在方法前后织入逻辑，业务代码保持干净。

${F}java
@Aspect
@Component
public class LogAspect {
    @Around("execution(* com.x..service..*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.currentTimeMillis();
        try { return pjp.proceed(); }
        finally { log.info("{} 耗时 {}ms", pjp.getSignature(), System.currentTimeMillis() - t); }
    }
}
${F}

⚠ **AOP 靠代理实现，所以「自调用」不生效**：类内部方法 A 调 B，B 上的切面不会触发（绕过了代理）。要生效要么拆到另一个 Bean，要么用 AspectJ 编译期织入。

## 三、声明式事务 @Transactional 的坑（高频面试点）

这是最容易翻车的地方：

1. **非 public 方法不生效**：Spring 默认只对 public 代理。
2. **自调用不生效**：同类内方法互调，事务切面没介入。
3. **异常被吞**：默认只对 ${C}RuntimeException${C} 回滚；你 catch 了没抛出，事务提交；或抛了受检异常没配 ${C}rollbackFor${C}，也不回滚。
4. **事务传播行为理解错**：${C}REQUIRED${C}（默认，加入现有事务）vs ${C}REQUIRES_NEW${C}（挂起现有、开新事务）。

${F}java
@Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)
public void createOrder(Order o) {
    // 任何 RuntimeException 或指定异常都会回滚
}
${F}

## 四、Bean 生命周期（知道关键节点即可）

实例化 → 属性填充（DI）→ ${C}@PostConstruct${C} → InitializingBean → 就绪 → 销毁前 ${C}@PreDestroy${C}。理解这个，你才知道「为什么 @Autowired 的对象在构造器里还是 null」（构造阶段 DI 还没发生）。

## ⚠ 踩坑与经验

1. **循环依赖**：A↔B，Spring Boot 2.6+ 默认禁止，靠 @Lazy 是治标；根治是拆公共逻辑。
2. **事务方法 catch 空**：异常没抛出，脏数据已落库却「成功」返回。
3. **自调用让 AOP/事务失效**：最常见的「我明明加了注解为啥没用」。
4. **@Async 同理不生效于自调用**：异步也是代理织入。
5. **构造器里用注入对象**：DI 在构造之后，得用 @PostConstruct 或构造注入。

## ✅ 排障清单

- [ ] @Transactional 用在 public、被外部调用的方法
- [ ] 需要回滚的异常配 rollbackFor；别吞异常
- [ ] 分清 REQUIRED / REQUIRES_NEW 传播
- [ ] AOP/事务/异步别指望自调用生效
- [ ] 循环依赖靠拆模块，不靠 @Lazy 硬撑
`
          },
          {
            id: "mysql-index",
            title: "MySQL 索引与慢查询优化",
            minutes: 18,
            updated: "2026-09-15",
            applies: "MySQL 8.0（InnoDB）",
            tags: ["MySQL", "索引", "性能"],
            terms: ["MySQL", "索引", "慢查询", "执行计划"],
            body: `
## 一、索引的本质：一本排好序的目录

没有索引，查一条数据要全表扫（${C}ALL${C}）；有索引，InnoDB 用 **B+ 树**定位，复杂度从 ${C}O(n)${C} 降到 ${C}O(log n)${C}。但索引是「用空间换时间」，还拖慢写入，不能无脑加。

## 二、最左前缀：联合索引的铁律

建了 ${C}(a, b, c)${C} 的联合索引，查询**必须从最左列开始连续使用**才能走索引：

| 查询条件 | 能否走索引 |
|---|---|
| ${C}WHERE a=1 AND b=2${C} | ✅ 走 a,b |
| ${C}WHERE a=1 AND b=2 AND c=3${C} | ✅ 全走 |
| ${C}WHERE b=2${C} | ❌ 跳过最左 a |
| ${C}WHERE a=1 AND c=3${C} | ⚠ 只走 a，c 用不上 |

⚠ 所以联合索引的**列顺序**很讲究：区分度高、常作为过滤条件的放前面。

## 三、EXPLAIN：优化的眼睛

${F}sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100 AND status = 1;
${F}

重点看几列：

| 列 | 看什么 | 好值 |
|---|---|---|
| type | 访问类型 | ${C}ref${C}/${C}range${C} 好；${C}ALL${C} 是全表扫（坏） |
| key | 实际用了哪个索引 | 非空 |
| rows | 预估扫描行数 | 越小越好 |
| Extra | 额外信息 | 出现 ${C}Using filesort${C}/${C}Using temporary${C} 要警惕 |

## 四、索引失效的常见写法

${F}sql
WHERE DATE(created_at) = '2026-09-15'   -- 列上套函数，失效
WHERE amount + 1 = 100                  -- 列参与运算，失效
WHERE name LIKE '%明'                   -- 前模糊，失效（'张%' 能用）
WHERE phone = 13800000000               -- phone 是 varchar，隐式转数字，失效
WHERE a = 1 OR b = 2                    -- 若 a/b 只有一个有索引，常整条失效
${F}

## 五、覆盖索引：select 只取索引列

如果索引里已经包含了要查的字段，MySQL 不用回表（不用再去主键索引取数据），极快。

${F}sql
-- idx_user(user_id, status) 已建；只查这两列 → 覆盖索引，不回表
SELECT user_id, status FROM orders WHERE user_id = 100;
${F}

## ⚠ 踩坑与经验

1. **索引越多越好**：写入变慢、磁盘占用大，且优化器选错索引。按需建。
2. **在低区分度列上建索引**：如性别，建了也几乎不走。
3. **order by 没走索引导致 filesort**：排序字段尽量覆盖在索引里。
4. **长字段直接建索引**：用前缀索引 ${C}INDEX(col(20))${C} 或哈希列。
5. **迷信 EXPLAIN 的 rows 是精确值**：rows 是估算，结合实际耗时判断。

## ✅ 排障清单

- [ ] 联合索引遵守最左前缀，列序按区分度+过滤频率排
- [ ] 改完用 EXPLAIN 看 type/key/rows/Extra
- [ ] 不在索引列上套函数/运算/隐式转换
- [ ] 高频查询争取覆盖索引，避免回表
- [ ] 前模糊 %x 无法走索引，慎用
`
          },
          {
            id: "redis-cache",
            title: "Redis 缓存设计与一致性",
            minutes: 17,
            updated: "2026-09-15",
            applies: "Redis 6 / 7",
            tags: ["Redis", "缓存", "一致性"],
            terms: ["Redis", "缓存", "一致性", "穿透"],
            body: `
## 一、为什么用缓存：挡在数据库前面

数据库扛不住高并发读，Redis 内存读写（十万级 QPS）做缓冲。典型读路径：**先查缓存，命中直接返回；未命中查库，回写缓存**。

## 二、三大经典问题

**1. 缓存穿透**：查不存在的数据（如 id=-1），缓存和库都没有 → 每次都打到库。
- 解决：① 缓存空值（短 TTL）；② **布隆过滤器**拦截无效 key。

**2. 缓存击穿**：某个热点 key 过期瞬间，大量请求同时打到库。
- 解决：① 热点 key 不过期或逻辑过期；② 互斥锁（只放一个请求回源，其余等待）。

**3. 缓存雪崩**：大量 key 同一时刻失效 / Redis 宕机 → 数据库被冲垮。
- 解决：① TTL 加随机抖动，错开失效；② 多级缓存；③ Redis 高可用（哨兵/集群）。

## 三、一致性：缓存和数据库怎么对齐

没有「完美一致」，只有「业务可接受的折中」。

**推荐方案：Cache Aside（旁路缓存）**

${F}text
写：先更新数据库 → 再删除缓存（不是更新缓存）
读：先读缓存，未命中读库 → 回写缓存
${F}

⚠ **为什么是「删缓存」而不是「更新缓存」**：并发写时，先更新缓存可能因顺序问题导致脏数据；删缓存更简单，下次读自然重建。且「先库后删」比「先删后库」更安全（极端并发下仍有小窗口不一致，但概率低，多数业务可接受）。

**延迟双删**进一步降低不一致窗口：写库前删一次、写库后隔几百 ms 再删一次。

## 四、踩坑：这些写法会出事

${F}java
// 反例：先删缓存再更新库，期间读请求把旧值又写回缓存 → 脏数据
// 正例：先更新库，再删除缓存
public void updatePrice(Long id, int price) {
    db.update(id, price);          // 1. 先落库
    redis.del("price:" + id);      // 2. 再删缓存
}
${F}

## ⚠ 踩坑与经验

1. **缓存和库双写不删**：更新数据库后忘了删缓存，读到的全是旧值，用户投诉「改了没生效」。
2. **大 key / 热 key**：一个 key 几十 MB 或某 key QPS 极高，单线程的 Redis 被拖死。拆 key、本地缓存兜底。
3. **缓存当数据库用**：Redis 宕机数据没了（除非开持久化且接受丢失窗口）。重要数据以库为准。
4. **不设 TTL**：缓存永远不更新也不过期，数据陈旧。
5. **KEY 设计混乱**：${C}user:100:profile${C} 这种有语义、可管理的命名，别用 ${C}a1${C} 这类。

## ✅ 排障清单

- [ ] 读：缓存命中优先；未命中回源并写回
- [ ] 写：先更库，再删缓存（Cache Aside）
- [ ] 穿透→布隆/空值；击穿→互斥锁；雪崩→TTL 抖动+高可用
- [ ] 避免大 key / 热 key，KEY 有语义命名
- [ ] 明确缓存是「加速层」，库才是真相源
`
          },
          {
            id: "mq-async",
            title: "消息队列与异步化",
            minutes: 16,
            updated: "2026-09-15",
            applies: "Kafka / RocketMQ / RabbitMQ",
            tags: ["消息队列", "异步", "解耦"],
            terms: ["消息队列", "Kafka", "异步", "削峰"],
            body: `
## 一、为什么要引入 MQ

三个核心价值：**解耦**（A 不直接调 B）、**异步**（主流程快速返回，重活后做）、**削峰**（突发流量进队列，下游按能力消费）。

典型场景：下单后发短信、加积分、推风控——这些不必阻塞在「下单」主链路里。

## 二、消息可靠性：别让消息丢了

以 Kafka 为例，丢消息可能发生在三处：

| 环节 | 风险 | 对策 |
|---|---|---|
| 生产端 | 网络抖动产没发出去 | ${C}acks=all${C} + 重试 + 回调确认 |
| Broker | 没落盘就挂 | ${C}min.insync.replicas${C} ≥ 2 |
| 消费端 | 处理前就提交 offset | **先处理业务，再提交 offset** |

⚠ **消费端「先提交后处理」是灾难**：处理崩了，offset 已提交，消息永远丢了。正确是处理成功再提交，失败就不提交（会重投，所以要**幂等**）。

## 三、幂等：消息会被重复消费

网络重试、重投都会让同一条消息来多次。消费逻辑必须幂等：

${F}java
// 用唯一键去重：消息带 bizId，消费前先查/INSERT IGNORE
public void consume(OrderEvent e) {
    if (consumed.contains(e.getBizId())) return;  // 或数据库唯一索引兜底
    doBusiness(e);
}
${F}

## 四、顺序性：某些业务必须有序

Kafka 单个 partition 内有序。要保证订单「创建→支付→完成」顺序，就**按订单 id 路由到同一 partition**。代价是牺牲了并行度，按需使用。

## ⚠ 踩坑与经验

1. **消费逻辑不幂等**：重试导致重复发券、重复扣款，用户白赚或资损。
2. **先提交 offset 后处理**：崩一次丢一批消息。
3. **消息体过大**：Kafka 不适合塞几 MB 的报文，存对象存储、队列里只放引用。
4. **消费者处理太慢**：lag 堆积，监控 ${C}consumer lag${C}，该扩容扩消费者。
5. **死信队列没配**：处理 N 次仍失败的消息应有去处（死信 topic），别无限重试。

## ✅ 排障清单

- [ ] 生产 acks=all + 重试；Broker 副本数够
- [ ] 消费：先业务后提交 offset
- [ ] 消费逻辑幂等（唯一键/去重表）
- [ ] 监控 consumer lag，及时处理堆积
- [ ] 失败消息进死信队列，配告警
`
          },
          {
            id: "distributed-lock-idempotent",
            title: "分布式锁与幂等设计",
            minutes: 16,
            updated: "2026-09-15",
            applies: "Redis / ZooKeeper",
            tags: ["分布式锁", "幂等", "并发"],
            terms: ["分布式锁", "幂等", "Redis", "并发"],
            body: `
## 一、为什么单机锁不够

${C}synchronized${C} / 单机锁只锁住**一个 JVM**。多实例部署时，两个节点同时跑「扣库存」，各锁各的，超卖照样发生。**分布式锁锁的是「跨进程」的同一资源**。

## 二、Redis 分布式锁的正确姿势

最土的 ${C}SETNX${C} 有致命缺陷：加锁后进程挂了，锁永不释放。必须**加锁时带过期时间**，且**设置值和过期要原子**：

${F}bash
# NX=不存在才设，EX=过期秒数，原子操作，避免 SETNX 后崩溃没来得及 EXPIRE
SET lock:order:100 customer_abc NX EX 10
${F}

但还有个坑：**锁过期了业务还没跑完**，别的线程拿到锁，出现「两把锁同时有效」。解决：① 用**看门狗**自动续期（Redisson 已实现）；② 业务尽量快，锁粒度细。

释放锁要用 **Lua 脚本保证「只删自己的锁」**，不能 ${C}if value==mine then DEL${C} 分两步（并发下会误删别人的锁）：

${F}lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
end
${F}

## 三、幂等：比锁更根本的防护

很多场景其实不需要锁，需要的是**幂等**——同一个请求来多次，结果一致、副作用只发生一次。

常见手段：

| 手段 | 适用 |
|---|---|
| 唯一索引（订单号唯一） | 防重复插入，最简单有效 |
| 防重表 / 去重缓存 | 记录已处理 bizId |
| 状态机（已支付不能再支付） | 业务层防重 |
| Token 机制（提交前发 token，用后即焚） | 防表单重复提交 |

## 四、锁 vs 幂等怎么选

- **并发争抢同一资源**（扣库存）：分布式锁 + 兜底幂等
- **重复请求/重试**（支付回调）：优先幂等，不一定要锁
- 二者常配合：**锁保证串行，幂等保证重试安全**

## ⚠ 踩坑与经验

1. **锁没设过期时间**：进程崩了锁永驻，功能永久卡死。
2. **del 不看归属**：把别人的锁删了，多线程同时持锁，等于没锁。
3. **锁过期业务未完**：大事务长时间持锁，或过期后别人进来，数据错乱。用看门狗/缩短临界区。
4. **只在网关层防重，业务层不幂等**：回调重发照样重复处理。
5. **锁粒度太粗**：锁整个方法不如锁「订单 id」，并发度直接掉。

## ✅ 排障清单

- [ ] 加锁原子 SET NX EX，且只删自己的锁（Lua）
- [ ] 用看门狗续期，或缩短业务持锁时间
- [ ] 锁粒度到资源（如 orderId），别锁全方法
- [ ] 关键写操作业务层幂等兜底（唯一索引/状态机）
- [ ] 重试安全 = 幂等，不靠运气
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
            updated: "2026-09-15",
            applies: "JDK 8 / 11 / 17",
            tags: ["JVM", "排障", "故障"],
            terms: ["JVM", "OOM", "dump", "排查"],
            body: `
## 一、先准备「案发工具箱」

线上排查不是临时找命令，而是**提前装好、知道怎么用**：

- ${C}jps${C}：看 Java 进程 PID
- ${C}jstat${C}：GC 统计（前面用过）
- ${C}jstack${C}：线程快照（查死锁、查哪个线程 CPU 高）
- ${C}jmap${C}：堆转储（查内存泄漏）
- ${C}arthas${C}：阿里开源，线上神器，能 watch / trace / 改日志级别，不用重启

## 二、CPU 飙到 100% 怎么定位

${F}bash
top -Hp <pid>                     # 找出最耗 CPU 的线程 TID（十进制）
printf "%x\n" <tid>               # 转十六进制
jstack <pid> | grep -A 30 <hex>   # 直接看到是哪行代码在死循环/疯狂计算
${F}

常见真凶：死循环、正则灾难性回溯、序列化大对象、GC 本身（${C}GC overhead limit${C}）。

## 三、OOM / 内存泄漏怎么查

${F}bash
# 1. 先看是哪种 OOM
dmesg | grep -i "killed process"  # 被 OS OOM Killer 杀？还是 JVM 自己抛？
# 2. 自动留档：启动时加参数，OOM 时自动 dump
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump.hprof ...
# 3. 事后用 MAT / VisualVM 分析 hprof，看哪个类的实例最多、谁引用着它
${F}

**泄漏特征**：堆内存曲线周期性涨上去、GC 后下不来，最后崩。典型是**缓存没上限 / 静态 Map 只增不删 / 线程池队列无限积压**。

## 四、用 Arthas 在线诊断（不用重启）

${F}bash
# 监控某个方法耗时
trace com.x.OrderService createOrder
# 看某个方法的入参/返回值
watch com.x.OrderService getOrder '{params,returnObj}' -x 2
# 实时改日志级别，不用发版
logger --name com.x.OrderService --level DEBUG
${F}

## 五、调优的正确姿势：先量化再动

别上来就调参数。流程：**压测 → 看指标（吞吐/延迟/GC 停顿）→ 找瓶颈 → 改一处 → 再压测对比**。盲目调 GC 参数，十次有九次没用甚至更差。

## ⚠ 踩坑与经验

1. **重启解决后不查根因**：重启只是把内存清了，泄漏还在，几天后又崩。
2. **没留堆 dump**：OOM 后没 ${C}HeapDumpOnOutOfMemoryError${C}，现场没了，只能等下次。
3. **容器 cgroup 限制没给 JVM**：按宿主机内存算堆，必被 Killed。
4. **把 CPU 高归咎于 GC 却没验证**：先看 ${C}top${C} 的 ${C}sy/us/wa${C} 再下结论。
5. **频繁 Full GC 只调 -Xmx**：可能是老年代有长生命周期大对象，调堆没用，要查引用。

## ✅ 排障清单

- [ ] 提前装 arthas，JVM 加 OOM 自动 dump 参数
- [ ] CPU 高：top -Hp → 转十六进制 → jstack 定位代码行
- [ ] OOM：区分 OS Killer 还是 JVM，查 hprof 找泄漏源
- [ ] 调优前先压测量化，改一处对比一次
- [ ] 容器里让 JVM 感知 cgroup 上限
`
          },
          {
            id: "sharding-ha",
            title: "MySQL 分库分表与高可用",
            minutes: 20,
            updated: "2026-09-15",
            applies: "MySQL 8.0 / ShardingSphere",
            tags: ["MySQL", "分库分表", "高可用"],
            terms: ["分库分表", "MySQL", "主从", "高可用"],
            body: `
## 一、什么时候才需要分库分表

**先别分**。单表几百万、加好索引、读写分离能扛住，就别引入分片——分片带来跨片查询、分布式事务、运维复杂度三大难题。

触发信号：单表 **超千万行**、或单机写入到瓶颈、或磁盘/连接数到上限。

## 二、垂直 vs 水平

- **垂直分库**：按业务拆（订单库 / 用户库），解决耦合和连接数。
- **垂直分表**：一张宽表拆成「常用字段表 + 不常用字段表」，减少单行体积。
- **水平分表（最常用）**：同一张表按分片键切成 N 份，如按 ${C}user_id % 64${C}。

## 三、分片键怎么选（决定你后半年的命）

分片键选错 = 灾难。原则：**选大多数查询都带的高基数字段**（通常是 user_id / order_id）。

${F}text
按 user_id 分 64 片：
  查 某用户的订单  → 直接路由到单片，快
  查 全局订单列表（不带 user_id） → 要扫所有 64 片，慢（广播查询）
${F}

教训：如果业务里有大量「不带分片键的查询」，分片键就选错了，或者需要冗余维度表。

## 四、高可用：主从复制 + 读写分离

${C}主库写、从库读${C}，从库异步复制主库的 binlog。读写分离能把读压力分摊。

⚠ **主从延迟**：从库数据落后主库几秒。刚写完立刻读从库，可能读不到（「读己之写」失败）。对策：① 写后强读走主库；② 关键路径忽略延迟。

## 五、高可用架构演进

| 方案 | 说明 |
|---|---|
| 主从 + 手动切换 | 简单，但故障要人切，RTO 长 |
| MHA / Orchestrator | 自动故障转移 |
| MGR（MySQL Group Replication） | 多主/单主，自带选主，8.0 推荐 |
| 云 RDS | 托管主从+自动切换，小团队首选 |

## ⚠ 踩坑与经验

1. **过早分库分表**：复杂度爆炸，其实加索引就能解决。
2. **分片键选成「状态」这类低基数字段**：数据严重倾斜，某些片巨胖。
3. **跨片 JOIN / 分布式事务**：能避免就避免，业务上用「冗余+最终一致」代替。
4. **忽略主从延迟**：写完即读从库拿到旧值，用户看到「刚才的操作没保存」。
5. **分片数定太小**：后期数据再涨没法扩，分片数建议一次留足余量（如 64/128）。

## ✅ 排障清单

- [ ] 先优化索引和读写分离，确认到瓶颈再分片
- [ ] 分片键选高基数、查询常带字段
- [ ] 读写分离处理主从延迟（写后强读走主）
- [ ] 避免跨片 JOIN / 分布式事务，必要时冗余维度
- [ ] 分片数留足余量，高可用用 MGR 或云 RDS
`
          },
          {
            id: "dist-tx",
            title: "分布式事务与一致性",
            minutes: 19,
            updated: "2026-09-15",
            applies: "Seata / 消息最终一致",
            tags: ["分布式事务", "一致性", "Seata"],
            terms: ["分布式事务", "一致性", "Seata", "最终一致"],
            body: `
## 一、为什么本地事务不够

单体里 ${C}@Transactional${C} 一个事务搞定「扣库存+创建订单」。拆成微服务后，库存服务和订单服务是**两个数据库**，本地事务管不到对方。要么都成功，要么都失败——这就是分布式事务问题。

## 二、CAP 的清醒认知

**网络分区（P）必然存在**，所以只能在 C（强一致）和 A（可用）之间取舍。多数互联网系统选 **AP + 最终一致**（短暂不一致，但最终对齐），而不是强一致牺牲可用性。

## 三、主流方案怎么选

**1. 两阶段提交（2PC，如 XA / Seata AT）**
- 优点：强一致
- 缺点：全程锁资源、性能差、协调者单点。高并发场景慎用。

**2. TCC（Try-Confirm-Cancel）**
- 每个服务实现 try/confirm/cancel 三个接口，业务侵入大，但性能好、可控。
- 适合强一致要求的资金类场景。

**3. 本地消息表 / 事务消息（最终一致，最常用）**
- 核心思想：**本地事务 + 可靠消息**。先本地写业务+写消息表（同一事务），再异步发 MQ，消费方保证幂等。

${F}text
下单服务：
  1. 本地事务：创建订单 + 插入「待发送消息」(同库同事务)
  2. 后台任务把消息发给 MQ
  3. 库存服务消费，扣库存（幂等）
  4. 消息确认；失败重试，最终一致
${F}

**4. Saga**：长流程用一系列本地事务 + 补偿动作，一步失败就反向补偿。

## 四、选型一句话

- 资金/强一致 → TCC 或 2PC
- 大多数业务 → **事务消息 + 最终一致 + 幂等**，简单可靠
- 能不用分布式事务就别用：用「幂等 + 重试 + 对账」兜底往往更稳

## ⚠ 踩坑与经验

1. **滥用 2PC**：锁资源太久，并发一上来全卡住。
2. **消息发了但本地事务回滚**：顺序错了。必须先本地事务落库（含消息），再发。
3. **消费不幂等**：重试导致重复扣款/重复发券。
4. **没有对账兜底**：最终一致也可能因 bug 长期不一致，定期对账发现差异。
5. **误以为 MQ 保证不丢就万事大吉**：消费失败、业务异常也要处理，否则「发了等于做了」。

## ✅ 排障清单

- [ ] 优先最终一致（消息+幂等+对账），非必要不上 2PC
- [ ] 本地事务与消息表同库，保证原子
- [ ] 消费端幂等，失败重试安全
- [ ] 资金类用 TCC / 强一致，配补偿
- [ ] 跑定时对账，兜底长期不一致
`
          },
          {
            id: "high-concurrency",
            title: "高并发系统设计与压测",
            minutes: 19,
            updated: "2026-09-15",
            applies: "通用后端架构",
            tags: ["高并发", "架构", "压测"],
            terms: ["高并发", "限流", "降级", "压测"],
            body: `
## 一、高并发的底层逻辑：分层削峰

请求从进来到落库，每一层都能「拦一道」：

${C}客户端(防重提交) → 网关(限流/鉴权) → 缓存(Redis 挡读) → 队列(异步削峰) → 服务(线程池) → 数据库(连接池/读写分离)${C}

目标：**让真正打到数据库的请求尽量少、且可控**。

## 二、三板斧：限流、降级、熔断

**限流**：控制单位时间通过的请求数，保护下游。算法：
- **令牌桶**：允许突发（桶里有余量就放），常用
- **漏桶**：恒定速率，平滑
- **计数器/滑动窗口**：简单

${F}text
// 网关/接口层常见配置
sentinel: 单实例 QPS 限流 2000，超了直接快速失败或排队
${F}

**降级**：依赖挂了就返回兜底（缓存值/默认值/「稍后再试」），保住主流程。

**熔断**：依赖错误率过高，直接「断开」一段时间不再调用，给下游喘息，半开试探恢复。

## 三、池化：连接/线程都要复用

数据库连不上来就建、用完就关？No。用**连接池**（HikariCP）控制最大连接，避免把数据库打爆。线程池同理。池大小不是越大越好——DB 连接数超了，反而竞争加剧、整体更慢。

## 四、压测：别拍脑袋定容量

${F}bash
# 用 wrk / jmeter 模拟真实流量
wrk -t12 -c400 -d60s -s post.lua http://order.svc/create
# 观察：QPS、P99 延迟、错误率、CPU/内存/GC、DB 连接数
${F}

压测要逐步加压，找到**拐点**（QPS 还能涨但延迟陡增的点），那就是容量上限。再据此定限流阈值和扩容策略。

## ⚠ 踩坑与经验

1. **限流只配在文档里**：从来没真触发过，大促一来直接被打挂。
2. **连接池配太大**：应用 50 实例 × 20 连接 = 1000，超过 DB 承受能力，全超时。
3. **降级开关没预案**：依赖挂了不知道切哪个兜底，只能干等恢复。
4. **压测用单实例、生产多实例**：容量估算差十倍，上线即翻车。
5. **只看平均延迟**：P99/P999 才是用户体验，平均 50ms 可能藏着 3s 长尾。

## ✅ 排障清单

- [ ] 分层防护：网关限流 → 缓存 → 队列 → 池化 → DB
- [ ] 限流/降级/熔断三件套齐备且演练过
- [ ] 连接池/线程池大小按 DB 承受力设，非越大越好
- [ ] 压测逐步加压找拐点，按 P99 定容量
- [ ] 限流阈值和降级预案大促前真实验证
`
          },
          {
            id: "microservice-governance",
            title: "微服务治理（注册/限流/熔断）",
            minutes: 18,
            updated: "2026-09-15",
            applies: "Spring Cloud / Dubbo / Sentinel",
            tags: ["微服务", "治理", "限流"],
            terms: ["微服务", "限流", "熔断", "注册中心"],
            body: `
## 一、从单体到微服务：得到了什么，失去了什么

得到：独立开发部署、技术异构、故障隔离。失去：一次调用变多次网络调用、分布式事务、链路追踪难度。

## 二、注册中心：服务怎么互相发现

服务启动时把自己的地址注册到**注册中心**（Nacos / Eureka / ZooKeeper / Consul），调用方从中拉取可用实例。

⚠ **注册中心的可用性 = 整个系统的生命线**。用 AP 型的 Nacos（最终一致、高可用）还是 CP 型的 ZK（强一致、分区时可能不可用），按业务容忍度选。注册中心挂了，新实例上不来、老实例地址拿不到。

## 三、负载均衡与优雅上下线

- **客户端负载均衡**（Ribbon / Dubbo）：调用方自己选实例
- **优雅下线**：实例收到停止信号先**从注册中心摘掉**，等存量请求处理完再退出，否则正在处理的请求被切断（「滚动发布 502」的根因之一）

## 四、限流 / 熔断 / 降级在微服务里的落地

前面讲过三板斧，微服务里更关键的是**在哪个点做**：
- **入口（网关）**：全局限流，挡住总量
- **服务间（Sentinel / Hystrix）**：单接口限流、对下游熔断

${F}text
调用链：网关 → 订单服务 → 库存服务 → 用户服务
任一层都能熔断：库存服务挂，订单服务对其熔断，返回「降级：稍后重试」
${F}

## 五、可观测性：没有它你就是瞎子

- **链路追踪（TraceId）**：一次请求跨多个服务，靠 TraceId 串起来（SkyWalking / Jaeger）
- **Metrics**：QPS、延迟、错误率（Prometheus）
- **日志**：结构化 + 集中（前面日志篇讲过）

## ⚠ 踩坑与经验

1. **注册中心挂了全站雪崩**：没做本地缓存兜底，注册中心抖一下服务互调全失败。
2. **优雅下线没做**：发布期间 502，用户感知到「刷新偶发失败」。
3. **熔断阈值拍脑袋**：太敏感一抖就断、太迟钝不起作用，要压测+演练定。
4. **没有 TraceId**：一个慢请求跨 8 个服务，没法定位是哪段慢。
5. **服务粒度过细**：10 人的团队拆 50 个服务，光治理成本就拖垮交付。

## ✅ 排障清单

- [ ] 注册中心高可用，客户端缓存兜底
- [ ] 发布走优雅下线（先摘流量再停）
- [ ] 网关 + 服务双层限流熔断，阈值经演练
- [ ] 全链路 TraceId + Metrics + 集中日志
- [ ] 服务粒度匹配团队规模，避免过度拆分
`
          },
          {
            id: "capacity-planning",
            title: "性能工程与容量规划",
            minutes: 18,
            updated: "2026-09-15",
            applies: "通用后端",
            tags: ["性能", "容量", "架构"],
            terms: ["性能", "容量", "架构", "压测"],
            body: `
## 一、容量规划不是算数题，是权衡

核心问题：**为了扛住 X 流量，要多少机器、多大 DB、什么架构？** 答案来自「压测数据 + 业务增长预期 + 成本预算」三者博弈，不是拍脑袋。

## 二、从单实例容量推导整体

${F}text
已知：单台应用 instance 在 P99<200ms 下能扛 1500 QPS
目标：大促峰值 30000 QPS
→ 至少 30000 / 1500 = 20 实例（再留 30% 余量 → 26 实例）
DB：单主写上限约 8000 TPS，若写占比 30% → 写 QPS 上限 ~2400，不够就加从/分片
${F}

⚠ 别用**平均**算容量，用**峰值 + 余量**。大促峰值往往是日常的 10~50 倍。

## 三、常见的容量杀手（按出现频率）

1. **慢 SQL / 没索引**：一个全表扫把 DB 连接池占满，整站变慢
2. **N+1 查询**：循环里查库，10 次变 1000 次
3. **同步远程调用进核心链路**：下单里同步调 5 个下游，一个慢全慢
4. **缓存击穿/雪崩**：瞬间压到 DB
5. **锁竞争**：大事务持锁，并发上不去

## 四、性能工程的闭环

${C}监控发现指标异常 → 定位瓶颈（trace/火焰图）→ 优化 → 压测验证 → 容量重算 → 预案/扩容${C}

**火焰图（Flame Graph）**是定位 CPU 热点的利器：横轴是采样，竖轴是调用栈，最宽的「平顶」就是最耗时的函数。async-profiler 生成，比瞎猜强百倍。

## 五、预案比扩容更重要

容量总有算错的时候。**降级预案 + 弹性扩容 + 限流兜底**三位一体：
- 弹性扩容：HPA / 云自动伸缩，流量来自动加实例
- 预案：明确「什么指标触发降级哪块功能」

## ⚠ 踩坑与经验

1. **按日常流量备机器**：大促一来直接挂，峰值差几十倍。
2. **只加机器不查慢 SQL**：加 10 台也救不了全表扫，DB 还是瓶颈。
3. **没有容量红线**：不知道什么时候该扩容，等挂了才知道。
4. **优化后不复测**：以为改了就好，实际 P99 没变化。
5. **预案写在文档没人演练**：真出事手忙脚乱，预案等于没有。

## ✅ 排障清单

- [ ] 容量按峰值 + 余量算，非日常平均
- [ ] 用压测数据推导实例/DB 数，非拍脑袋
- [ ] 优先干掉慢 SQL / N+1 / 同步重调用
- [ ] 火焰图定位 CPU 热点，优化后复压测
- [ ] 弹性扩容 + 降级预案 + 限流兜底，且演练过
`
          }
        ]
      }
    ]
  };

  window.JAVA = JAVA;
})();
