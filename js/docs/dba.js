/* =========================================================================
 *  js/docs/dba.js — 技术教程「数据库 / DBA」方向数据（官方文档目录重构版）
 *  骨架取自：MySQL 8.0 Reference Manual / PostgreSQL Documentation /
 *  redis.io Docs / ShardingSphere / Percona Toolkit / Google SRE Book。
 *  正文代码围栏用 ${F}、行内代码用 ${C}；shell/SQL 里 ${C}VAR${C} 写成 \${VAR}。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ${F}
  const C = "\u0060";               // 行内代码 ${C}

  const DBA = {
    id: "dba",
    name: "数据库 / DBA",
    icon: "🗄️",
    desc: "以 MySQL 8.0 Reference Manual、PostgreSQL Documentation、redis.io 官方文档目录为骨架，覆盖 SQL 与索引、事务与锁、复制与高可用、Redis 原理、分库分表、在线迁移与数据一致性校验的完整 DBA 知识体系。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "对应官方手册「Tutorial + SQL Statements + Data Types + Backup and Recovery + Account Management」前几章：会写会查、懂范式、会备份恢复、管好账号权限。",
        chapters: [
          {
            id: "sql-basics",
            title: "SQL 基础与查询优化入门",
            minutes: 24,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16",
            tags: ["SQL", "查询", "执行顺序"],
            terms: ["SQL", "查询", "MySQL", "索引"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 13.2 DML Statements](https://dev.mysql.com/doc/refman/8.0/en/select.html) · [MySQL RM → 13.2.11 WITH (Common Table Expressions)](https://dev.mysql.com/doc/refman/8.0/en/with.html) · [PostgreSQL → Ch.7 Queries](https://www.postgresql.org/docs/current/queries.html) · [PostgreSQL → Ch.4 SQL Syntax](https://www.postgresql.org/docs/current/sql-syntax.html)

## 一、原理与底层机制

SQL 是声明式语言：你描述**结果集长什么样**，优化器决定**怎么拿、按什么顺序拿**。写 SQL 与做优化前，先在心里装下这条几乎所有关系库（MySQL / PG / Oracle）通用的逻辑流水线——它解释了大量「为什么我的写法不生效」：

${F}text
FROM / JOIN     → 确定数据源（先做笛卡尔积，再按 ON 连接）
  → WHERE        → 行级过滤（此时 SELECT 还没执行，列别名尚未诞生）
  → GROUP BY     → 按分组键聚拢
  → HAVING       → 组级过滤（WHERE 之后，可用聚合函数）
  → SELECT       → 计算输出列 / 聚合（此时才诞生别名）
  → DISTINCT     → 去重
  → ORDER BY     → 排序（唯一能用 SELECT 别名的阶段）
  → LIMIT/OFFSET → 截取结果行
${F}

两个高频推论直接决定线上事故概率：

1. **WHERE 里不能直接用 SELECT 的别名**——别名在 SELECT 阶段才诞生，而 WHERE 更早执行。MySQL 8.0 会直接报 ${C}Unknown column${C}。需要复用计算列时用子查询或 CTE（${C}WITH${C}）。
2. **JOIN 的物理算法决定性能上限**，与语义（INNER/LEFT）是两回事：
   - **Nested Loop**：外层每行去内层找匹配。内层有索引时是 ${C}O(N·logM)${C}，是 OLTP 最理想的形态。
   - **Hash Join**：小表建哈希表、大表探测，适合无索引可用的一次性大表关联（MySQL 8.0.18+ 支持，PG 一直支持）。
   - **Merge Join**（PG 常见）：两表连接键都已有序时归并，省去建哈希的开销。

## 二、规范与标准

- **SQL 标准（ISO/IEC 9075）语义**：INNER/LEFT/RIGHT/FULL JOIN 的语义由标准定义，对应 MySQL RM 13.2.9.2。实践中 ${C}RIGHT JOIN${C} 一律改写成 ${C}LEFT JOIN${C}，可读性更好。
- **GROUP BY 语义**：开启 ${C}ONLY_FULL_GROUP_BY${C}（8.0 默认）后，SELECT 中的非聚合列必须全部出现在 GROUP BY 中或被聚合函数包裹，否则直接报错。这是反「薛定谔的查询结果」的硬约束。
- **NULL 的三值逻辑**：SQL 里 ${C}NULL${C} 既不是 TRUE 也不是 FALSE，而是 UNKNOWN。${C}WHERE col = NULL${C} 永远不成立，必须用 ${C}col IS NULL${C}。这是新手丢数据的头号来源。
- **LIMIT / OFFSET 语义**：OFFSET 越大越慢——它要先读出并丢弃前 N 行；所以「深分页」不能用 OFFSET，要用键集分页。

## 三、实战

错误写法与正确写法对照（可直接复制到测试库运行）：

${F}sql
-- ❌ 错误 1：SELECT * 吃掉覆盖索引、浪费网络带宽、无法利用索引下推
SELECT * FROM orders WHERE user_id = 10086;

-- ✅ 正确 1：只取需要的列，便于走覆盖索引
SELECT id, user_id, amount, created_at
FROM orders
WHERE user_id = 10086 AND status = 'PAID'
  AND created_at >= '2026-01-01'
ORDER BY created_at DESC
LIMIT 20;

-- ❌ 错误 2：深分页 OFFSET 1000000，越翻越慢（要先扫出前 100 万行再丢弃）
SELECT id, amount FROM orders ORDER BY id LIMIT 20 OFFSET 1000000;

-- ✅ 正确 2：键集分页（Keyset Pagination），用上一页最后一条 id 定位起点
SELECT id, amount FROM orders
WHERE id > 1000000          -- 要求排序键单调
ORDER BY id LIMIT 20;

-- ❌ 错误 3：隐式类型转换，phone 是 VARCHAR 却传数字，索引直接失效
SELECT * FROM user WHERE phone = 13800138000;

-- ✅ 正确 3：按列类型传参
SELECT * FROM user WHERE phone = '13800138000';

-- ✅ 推荐：复杂计算用 CTE（MySQL 8.0 / PG 通用），可读性远胜多层嵌套子查询
WITH paid AS (
  SELECT user_id, SUM(amount) AS total
  FROM orders WHERE created_at >= '2026-09-01' AND status = 'PAID'
  GROUP BY user_id
)
SELECT u.name, p.total
FROM paid p JOIN users u ON u.id = p.user_id
ORDER BY p.total DESC LIMIT 10;
${F}

## 四、覆盖广度

| 子主题 | 关键点 | 决策指引 |
|---|---|---|
| 窗口函数 ${C}ROW_NUMBER()/RANK()/SUM() OVER(PARTITION BY ...)${C} | 保留明细行做组内排序/累计 | 取每组 TopN、累计求和时用它，而非自连接 |
| 递归 CTE ${C}WITH RECURSIVE${C} | 处理树形结构（组织树、评论楼） | 替代笨重的邻接表自连接循环 |
| ${C}IN${C} vs ${C}EXISTS${C} | EXISTS 命中即停，不展开大列表 | 存在性判断优先用 EXISTS |
| ${C}UNION${C} vs ${C}UNION ALL${C} | UNION 隐含去重（排序/哈希代价） | 能确定无重复时一律 UNION ALL |
| ${C}LEFT JOIN ... WHERE t2.col IS NULL${C} | 经典「反连接」写法 | 与 NOT EXISTS 语义相同，建议统一用语义更清晰的 NOT EXISTS |

边界场景：聚合后过滤必须用 HAVING 而非 WHERE；ORDER BY 多列的方向（ASC/DESC）要与索引方向匹配，否则无法消除 filesort（MySQL 8.0 起支持降序索引，见索引篇）。

## 五、常见误区

1. **LEFT JOIN 时 ON 与 WHERE 混用不区分**：对 INNER JOIN 两者等价；对 LEFT JOIN，右表过滤条件放 ON 是「过滤右表」、放 WHERE 是「过滤结果集」，语义完全不同——这是线上「数据变多/变少」的高频事故源。
2. **${C}COUNT(col)${C} 与 ${C}COUNT(*)${C} 混为一谈**：${C}COUNT(col)${C} 不统计 col 为 NULL 的行，${C}COUNT(*)${C} 统计行数。统计行数一律 ${C}COUNT(*)${C}。
3. **认为 LIMIT 能「加速」**：LIMIT 只减少返回行，不减少扫描；无索引排序时照样全表扫（PG Ch.7.6 明确说明）。
4. **隐式类型转换**：${C}WHERE phone = 13800138000${C}（phone 为 VARCHAR）触发转换导致索引失效。一律按列类型写字面量。
5. **${C}NULL${C} 当空字符串**：${C}''${C} 与 ${C}NULL${C} 不同；${C}NULL = NULL${C} 结果是 UNKNOWN，去重/连接时行为诡异。

## 六、自检清单

- [ ] 新 SQL 都跑过 EXPLAIN，能说出预期索引与扫描行数
- [ ] 深分页已改键集分页或「延迟关联」
- [ ] LEFT JOIN 的过滤条件清楚放在 ON 还是 WHERE 及其语义
- [ ] 查询条件与列类型严格一致，无隐式转换
- [ ] 生产 SQL 无 SELECT *，复杂查询优先用 CTE / 窗口函数
- [ ] 分组查询在 ONLY_FULL_GROUP_BY 下能通过

<!--dd:sql-basics-->

## 🔬 深挖：一条 SELECT 的完整生命链路与优化器内幕

### 一、从网络字节到结果集：九个阶段

很多人把「写 SQL」当成写自然语言，其实服务端是一条固定流水线，每一段都有它的失败模式：

| 阶段 | 组件 | 干什么 | 典型故障 |
|---|---|---|---|
| 1 | 连接层 | TCP 握手、认证插件校验、读取账号权限快照 | 连接风暴、认证失败、超出 max_connections |
| 2 | 解析器 Parser | 词法 + 语法分析，产出解析树 | 语法错误、SQL 过长超 max_allowed_packet |
| 3 | 预处理 Preprocessor | 表/列存在性、视图展开、别名解析、权限检查、常量折叠 | Unknown column、权限不足 |
| 4 | 优化器 Optimizer | 逻辑重写 + 物理计划枚举 + 代价比较，输出执行计划 | 选错索引、错估行数 |
| 5 | 执行器 Executor | 按计划调用存储引擎接口，做过滤/连接/排序/聚合 | Using temporary 落盘、filesort |
| 6 | 存储引擎 InnoDB | 缓冲池命中、B+Tree 定位、行锁/MVCC 可见性判断 | 锁等待、缓冲池击穿 |
| 7 | 返回层 | 结果集编码、按 net_buffer_length 分批发包 | 大结果集打满网络 |
| 8 | 收尾 | 释放锁与临时表、写慢日志、更新统计 | 长事务未提交 |

要点：**MySQL 8.0 已经彻底移除了查询缓存（Query Cache）**。老文章里「关掉 query_cache」的优化手段在 8.0 上属于无效操作 —— 那条路已经不存在了。

### 二、代价模型：优化器到底在算什么

优化器不做「对错」判断，只做**代价最小化**。代价由两张系统表里的常数决定：

${F}sql
-- 引擎无关的代价常数（节选）
SELECT cost_name, cost_value, default_value FROM mysql.server_cost;
-- io_block_read_cost 默认 1.0，memory_block_read_cost 默认 0.25
SELECT * FROM mysql.engine_cost;
${F}

估算行数的公式是：

${F}text
预计扫描行数 = 表总行数 × 过滤条件选择率
选择率 ≈ 1 / cardinality（该列不同值个数，来自统计信息）
${F}

所以**统计信息不准 = 计划必错**。这是「昨天还快今天就慢」的头号原因：数据分布变了（比如某状态值从 1% 涨到 60%），但统计信息还是三天前采样的一百来页。

${F}sql
-- 看统计信息是否新鲜
SHOW INDEX FROM orders;
-- Cardinality 列明显偏离真实值，就重新采样
ANALYZE TABLE orders;
-- 8.0 增强：为列建直方图，改善倾斜数据的选择率估算
ANALYZE TABLE orders UPDATE HISTOGRAM ON status, city WITH 64 BUCKETS;
SELECT * FROM information_schema.COLUMN_STATISTICS;
${F}

### 三、优化器到底做了哪些「重写」

理解这些重写，才能看懂 EXPLAIN 里那个「和我写的完全不一样」的 SQL：

1. **子查询转半连接**。${C}WHERE id IN (SELECT ...)${C} 会被尝试改写为半连接，候选策略有 FirstMatch、LooseScan、Materialize-lookup、DuplicateWeedout，由代价决定用哪个。
2. **派生表合并（derived merge）**。${C}FROM (SELECT ...) t${C} 若不含聚合/去重/窗口函数，会被拍平进外层，于是外层谓词能下推。含 ${C}GROUP BY${C} 或 ${C}LIMIT${C} 则必须物化，性能差别巨大。
3. **条件下推**。外层的过滤条件下推到视图、派生表、甚至下推到存储引擎（InnoDB 层的索引条件下推 ICP）。
4. **等价类传播**。${C}a.x = b.x AND a.x = 5${C} 会自动推出 ${C}b.x = 5${C}，于是 b 表也能用上索引。
5. **索引合并（Index Merge）**。${C}x = 1 OR y = 2${C} 可能变成「两个索引各扫一部分再求并集」。它比全表扫强，但通常**不如一个合适的联合索引**。
6. **Hash Join（8.0.18+）**。等值连接且驱动表无可用索引时，不再退化成嵌套循环，而是建哈希表。执行计划里会看到 ${C}Using join buffer (hash join)${C}。

### 四、观察工具的正确用法

${F}sql
-- 1) 基础执行计划：type / key / rows / Extra
EXPLAIN SELECT o.id, o.amount, c.name
FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'PAID' AND o.created_at >= '2026-01-01'
ORDER BY o.created_at DESC LIMIT 20;

-- 2) 树形：能看出每一步的代价与数据流方向
EXPLAIN FORMAT=TREE <同样的 SQL>;

-- 3) 真实执行统计（8.0.18+）：把「估算 rows」和「实际 rows」并排看，一眼看出估算错误
EXPLAIN ANALYZE <同样的 SQL>;

-- 4) 看优化器重写后的 SQL 与舍弃过的候选计划
SET optimizer_trace = 'enabled=on';
<查询>
SELECT * FROM information_schema.OPTIMIZER_TRACE\\G
SET optimizer_trace = 'enabled=off';

-- 5) 语句级真实耗时分解（替代已废弃的 SHOW PROFILE）
SELECT * FROM performance_schema.events_statements_history_long
ORDER BY TIMER_START DESC LIMIT 10;
${F}

**EXPLAIN ANALYZE 是排查的第一杠杆**：估算 ${C}rows=10${C} 而实际 ${C}actual rows=1200000${C}，那不用再看别的了 —— 先修统计信息或改写条件。

### 五、实战：三分钟把一个慢查询压到毫秒

场景：订单列表页，表 800 万行。

${F}sql
-- 原始（1.8s）
SELECT * FROM orders
WHERE customer_id = 12345 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;

-- EXPLAIN 显示：type=ref, key=idx_customer, rows=18000, Extra=Using filesort
-- 含义：索引只用到 customer_id，status 与排序全靠回表后过滤 + 文件排序
${F}

改法一（加联合索引，让过滤与排序都在索引里完成）：

${F}sql
ALTER TABLE orders ADD INDEX idx_cust_status_time (customer_id, status, created_at DESC);
-- 索引列顺序遵循：等值条件列在前 → 排序列在后，且方向一致
-- 再 EXPLAIN：Extra 变成 Using index condition，filesort 消失
${F}

改法二（覆盖索引，把回表也省掉）：

${F}sql
-- 若列表页只需要几个字段，把返回列拼进索引末尾即可走「覆盖索引」
ALTER TABLE orders ADD INDEX idx_cover (customer_id, status, created_at DESC, amount);
-- Extra 出现 Using index 即为覆盖索引，不再回表
${F}

改法三（深翻页改造，见下方 8.1）。

### 六、覆盖广度：SQL 写法对照表

| 脆弱写法 | 问题 | 正确做法 |
|---|---|---|
| ${C}WHERE phone = 13800000000${C}（列是 varchar） | 隐式转换，索引失效 | 加引号 ${C}'13800000000'${C} |
| ${C}WHERE DATE(created_at) = '2026-01-01'${C} | 列被函数包裹，索引失效 | ${C}created_at >= '2026-01-01' AND created_at < '2026-01-02'${C} |
| ${C}WHERE a = 1 OR b = 2${C} | 常见走索引合并或全表 | 拆两条 ${C}UNION ALL${C}，或建联合索引 |
| ${C}WHERE name LIKE '%张%'${C} | 前缀通配无法走 B+Tree | 改前缀匹配 ${C}'张%'${C}，或上全文索引 |
| ${C}WHERE id NOT IN (SELECT ...)${C} | NOT IN 遇 NULL 返回空集，且难优化 | ${C}NOT EXISTS${C} 或 ${C}LEFT JOIN ... IS NULL${C} |
| ${C}SELECT *${C} | 破坏覆盖索引、放大网络与内存 | 明确列清单 |
| ${C}LIMIT 1000000, 20${C} | 深翻页要扫 100 万行再丢弃 | 游标分页（见下） |
| 在 WHERE 里对列做运算 ${C}amount+1 > 100${C} | 无法用索引 | 移项 ${C}amount > 99${C} |

### 7. 深翻页（Deep Pagination）的标准解法

${F}sql
-- 脆弱：扫描并丢弃 100 万行，越翻越慢
SELECT id, title FROM articles ORDER BY id LIMIT 1000000, 20;

-- 正确 1：游标（keyset）分页 —— 记住上一页最后一个 id，走索引等值定位
SELECT id, title FROM articles WHERE id > 1000000 ORDER BY id LIMIT 20;

-- 正确 2：延迟关联 —— 先用覆盖索引拿到主键，再回表取字段
SELECT a.id, a.title
FROM (SELECT id FROM articles ORDER BY id LIMIT 1000000, 20) t
JOIN articles a ON a.id = t.id
ORDER BY a.id;
${F}

游标分页的代价是**不能跳页**，但换来的是 O(1) 定位；后台列表、日志流、无限滚动场景应当首选。

### 8. NULL 的三值逻辑与聚合陷阱

${F}sql
-- NULL 参与比较的结果是 UNKNOWN，不是 FALSE
SELECT NULL = NULL;        -- NULL
SELECT NULL <> NULL;       -- NULL
-- 危险：NOT IN 子查询里含 NULL，整体恒不成立，结果为空集
SELECT * FROM a WHERE id NOT IN (SELECT id FROM b);  -- b.id 有 NULL 时永远返回 0 行
-- 安全写法
SELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.id = a.id);

-- 聚合函数忽略 NULL，但 COUNT(*) 不忽略
SELECT COUNT(*), COUNT(col) FROM t;  -- 两者常不相等
-- AVG 同样忽略 NULL，需要「把 NULL 当 0」时必须显式写
SELECT AVG(IFNULL(score, 0)) FROM t;
${F}

### 9. 别踩这些坑

1. **只看 EXPLAIN 的 key 列就下结论**。key 有值不等于高效 —— 还要看 ${C}rows${C}（估算扫多少行）与 ${C}filtered${C}（过滤后剩余百分比）。${C}key${C} 命中但 ${C}rows=2000000${C} 照样慢。
2. **用 ${C}SELECT *${C} 却在抱怨回表慢**。覆盖索引的前提是「需要的列都在索引里」，${C}*${C} 直接毁掉这个前提。
3. **以为 ORDER BY 有索引就一定不 filesort**。只有当排序序列在索引中**连续且顺序一致**时才能复用索引；一旦中间夹了范围条件，后面的排序就失效。
4. **在事务里做分页查询还指望结果稳定**。默认 RR 隔离级别下，快照是事务第一次读时建立的，翻页期间他人插入的数据看不到 —— 这是特性不是 bug，但做「导出全量」时要意识到。
5. **把 AUTO_INCREMENT 当成严格连续**。并发插入、回滚、批量插入都会造成空洞；它只保证单调递增，不保证连续。

### 10. 自检清单补充

- [ ] 关心慢查询时先跑 ${C}EXPLAIN ANALYZE${C}，比对估算与实际行数
- [ ] 统计信息有定期 ${C}ANALYZE${C}，倾斜列建了直方图
- [ ] 深翻页接口已改游标分页或延迟关联
- [ ] 所有字符串列比较都带引号，无隐式类型转换
- [ ] 返回列已显式列出，核心查询走覆盖索引
- [ ] 知道 8.0 无查询缓存，优化手段不照搬旧文

## 七、延伸

- MySQL 8.0 Reference Manual → 13.2.9 SELECT / 13.2.11 WITH / 13.2.10 Subqueries
- PostgreSQL Documentation → Ch.7 Queries / Ch.11 Indexes
- Use The Index, Luke（免费在线索引教程）
          `
          },
          {
            id: "schema-normalization",
            title: "库表设计与范式",
            minutes: 28,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16",
            tags: ["范式", "设计", "数据类型"],
            terms: ["范式", "数据库", "设计", "建模"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.11 Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html) · [MySQL RM → Ch.10 Character Sets](https://dev.mysql.com/doc/refman/8.0/en/charset.html) · [PostgreSQL → Ch.5 Data Definition](https://www.postgresql.org/docs/current/ddl.html) · [PostgreSQL → Ch.8 Data Types](https://www.postgresql.org/docs/current/datatype.html)

## 一、原理与底层机制

范式理论出自 Codd 1971 年论文，其本质是**用「结构约束」消除数据冗余带来的更新异常**（插入异常、删除异常、修改异常）。但范式不是越高的越好——过高的范式在小表上带来无意义的 JOIN 开销。官方手册不展开范式，本篇按通用设计教材口径落地：

| 范式 | 一句话 | 违反的典型例子 |
|---|---|---|
| 1NF | 每列原子性，不可再分 | address 列里「省市区详址」混存 |
| 2NF | 非主键列完全依赖主键（消除部分依赖） | 订单明细表存商品名（只依赖商品 id） |
| 3NF | 消除传递依赖 | 学生表存「班级名、班主任」（班主任依赖班级） |
| BCNF | 每个决定因素都含候选键 | 联合主键下某非键列能决定另一非键列 |

实操判断法：**一张表只描述一个实体**，描述其他实体的信息用外键关联而非重复存储。每多一份冗余，就多一个「改了 A 忘了 B」的不一致风险点。

## 二、规范与标准

- **主键选择规范**：优先无意义代理主键（自增 BIGINT 或雪花 ID），业务列作唯一键。业务主键（如手机号）一旦需要变更，所有外键引用都要跟着动。
- **命名规范**：表名/列名用小写下划线（snake_case），见名知义；布尔用 is_/has_ 前缀；外键用 ${C}表名_关联字段${C}。
- **约束规范**：非空、唯一、外键、CHECK 在 DDL 阶段声明，让数据库做最后一道防线（见「用户与权限」与「约束与默认值」周边实践）。
- **官方 Data Types 章**是字段选型的事实依据：金额、时间、字符集的选型都有明确官方建议。

## 三、实战

字段类型选择的落地 DDL（对照官方规范逐条说明见下）：

${F}sql
CREATE TABLE orders (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  amount        DECIMAL(12,2)   NOT NULL DEFAULT 0.00 COMMENT '金额一律 DECIMAL，禁用 FLOAT/DOUBLE',
  status        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态用整数枚举，不用 VARCHAR',
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_user_status_time (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='订单表';
${F}

官方依据逐条对应：

- **金额用 DECIMAL**：FLOAT/DOUBLE 是 IEEE 754 近似值，${C}0.1+0.2 != 0.3${C}；MySQL RM 11.3 与 PG Ch.8.1 均如此建议。金融场景绝不能用浮点。
- **主键 BIGINT UNSIGNED**：INT 最大约 21 亿，热点表两年就危险。
- **时间用 DATETIME(3) 或 TIMESTAMP**：TIMESTAMP 占 4 字节但上限 2038 年且随时区转换；「绝对时刻」用 TIMESTAMP，「业务时间」用 DATETIME，毫秒精度用 ${C}(3)${C}。
- **字符集统一 utf8mb4**：MySQL 的 ${C}utf8${C} 实为 utf8mb3（3 字节），存不了 emoji；官方 Ch.10 明确推荐 utf8mb4。注意 8.0 默认排序规则 ${C}utf8mb4_0900_ai_ci${C} 与 5.7 的 ${C}utf8mb4_general_ci${C} 不同，**跨版本主从/迁移会导致比较行为不一致**。

## 四、覆盖广度

**什么时候故意违反范式（受控反范式）**：互联网业务在读多写少 + 数据量巨大的场景下做受控反范式：

- 订单表冗余「下单时的商品快照」——不是省 JOIN，而是商品后来改价，订单必须保留**历史价格**（本质是时间维度的事实记录，不算冗余）；
- 用户表冗余 ${C}order_count${C} 计数——用「写时更新或定时对账」换取高频读少一次聚合。

原则：**冗余必须登记在案**（哪个字段是冗余、由谁维护一致性），否则日后没人敢动它。

| 方案 | 一致性保障 | 适用 |
|---|---|---|
| 纯范式（外键关联） | 强，无冗余 | 写多、数据量小、强一致要求 |
| 受控反范式 | 应用层/定时对账 | 读多写少、聚合频繁的热点表 |

## 五、常见误区

1. **VARCHAR(255) 满天飞**：长度按业务实际约束（如 ${C}VARCHAR(64)${C}）；utf8mb4 下索引单列上限 3072 字节，${C}VARCHAR(768)${C} 恰好占满，超长列只能前缀索引。
2. **ON DELETE CASCADE 当随手选项**：大表上是「隐形删除风暴」，生产慎用。
3. **一个字段存多种含义**（remark 既存备注又塞 JSON 扩展）：无法走索引、无法建约束。扩展信息用 JSON 类型（MySQL 11.5 / PG jsonb）配合生成列建索引。
4. **索引当外键用导致索引泛滥**：每多一个索引，写放大多一分；高频写表保持「每表索引 ≤ 5」意识。
5. **用 TEXT/BLOB 当普通列**：TEXT 字段在 InnoDB 中存溢出页，排序/临时表代价高，能定长就别用 TEXT。

## 六、自检清单

- [ ] 每张表能一句话说清它描述哪个实体
- [ ] 金额 DECIMAL、状态整数枚举、时间 DATETIME(3)、字符集 utf8mb4
- [ ] 所有冗余字段有登记与一致性维护方案
- [ ] 每张表都有 COMMENT，关键列有 COMMENT
- [ ] 主键选型支持未来数据量级
- [ ] 大表无物理外键时有应用层校验 + 对账兜底

<!--dd:schema-normalization-->

## 🔬 深挖：范式、反范式与线上 DDL 的工程取舍

### 一、范式不是教条，是「写放大 vs 读放大」的调节旋钮

| 范式 | 约束 | 消除的问题 | 引入的代价 |
|---|---|---|---|
| 1NF | 列不可再分、无重复组 | 数组塞进一个字段 | 拆表后需 JOIN |
| 2NF | 非主键列完全依赖整个主键 | 复合主键下的部分依赖冗余 | 拆表 |
| 3NF | 非主键列不传递依赖 | 冗余字段不一致 | JOIN 变多 |
| BCNF | 每个决定因子都是候选键 | 主键内的异常依赖 | 进一步拆表 |

工程上的真实答案是：**核心交易表尽量 3NF，读模型按查询形态反范式**。判断标准很简单 —— 「这条冗余字段会不会被独立修改？」会，就不要冗余；不会（如订单里的商品快照价格），就大胆冗余。

${F}sql
-- 典型的「有意反范式」：订单行冗余下单时的商品名与单价
CREATE TABLE order_item (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT UNSIGNED NOT NULL,
  sku_id        BIGINT UNSIGNED NOT NULL,
  sku_name      VARCHAR(128) NOT NULL COMMENT '下单时快照，不做外键关联',
  unit_price    DECIMAL(12,2) NOT NULL COMMENT '成交价快照',
  qty           INT UNSIGNED NOT NULL,
  KEY idx_order (order_id)
);
-- 理由：商品改名/改价后，历史订单必须保持原样 —— 这是业务要求，不是冗余错误
${F}

### 二、数据类型选择：体积即性能

| 场景 | 常见错选 | 正确选择 | 说明 |
|---|---|---|---|
| 金额 | ${C}FLOAT${C} / ${C}DOUBLE${C} | ${C}DECIMAL(12,2)${C} 或整数分 | 浮点有舍入误差，对账必崩 |
| 布尔 | ${C}VARCHAR(1)${C} | ${C}TINYINT(1)${C} / ${C}BIT${C} | 省空间、语义清晰 |
| 状态 | ${C}VARCHAR(20)${C} | ${C}TINYINT UNSIGNED${C} + 字典表 | 索引小、比较快 |
| 主键 | ${C}INT${C}（21 亿上限） | ${C}BIGINT UNSIGNED${C} | 提前用大类型，避免日后改主键 |
| 短文本 | ${C}TEXT${C} | ${C}VARCHAR(255)${C} | VARCHAR 可索引、可入行内 |
| 时间 | ${C}VARCHAR(19)${C} | ${C}DATETIME(3)${C} / ${C}TIMESTAMP${C} | 能比较、能范围查、能索引 |
| IP | ${C}VARCHAR(15)${C} | ${C}INT UNSIGNED${C} + ${C}INET_ATON${C}/${C}INET_NTOA${C} | 4 字节 vs 15 字节 |
| 大 JSON | 拆成列 | ${C}JSON${C} + 生成列索引 | 8.0 支持多值索引 |

**为什么不建议用 TEXT 做业务字段**：TEXT/BLOB 的溢出页机制会让行内只留 20 字节指针，每次读取都可能多一次随机 IO；而且 TEXT 列无法直接建索引（只能前缀索引），排序时会强制落盘。

### 三、行格式与溢出页（很多人不知道的一层）

${F}sql
SHOW TABLE STATUS LIKE 'article'\\G   -- 看 Row_format
-- DYNAMIC（8.0 默认）：变长列完全溢出到 off-page，行内只存 20 字节指针
-- COMPACT：前 768 字节留在行内，其余溢出
-- COMPRESSED：额外压缩，读放大换取存储
${F}

理解这一层的意义在于：**一张有多个长 VARCHAR 的表，改成 DYNAMIC 后单页能放更多行，索引扫描效率会明显提升**。反之，如果业务大量按长文本前缀查询，DYNAMIC 反而增加溢出页读次数。

### 四、主键设计的两种路线（以及代价）

${F}sql
-- 路线 A：自增 BIGINT —— 顺序写入，页内追加，几乎不产生页分裂
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY

-- 路线 B：业务主键 / UUID —— 写入随机，页分裂 + 缓冲池命中率下降
id CHAR(36) PRIMARY KEY   -- 极度不推荐
${F}

若真的需要全局唯一且不想暴露自增 ID，推荐**雪花 ID（BIGINT）**：

${F}text
64 bit = 1 bit 符号位 + 41 bit 毫秒时间戳 + 10 bit 机器号 + 12 bit 序列号
优点：趋势递增（写入仍近似顺序）、8 字节、可解析出时间
缺点：依赖时钟回拨处理；机器号需集中分配
${F}

### 五、线上 DDL：为什么「加个字段」能搞垮生产

MySQL 8.0 的 DDL 算法有三种，执行前必须确认：

${F}sql
-- 关键：ALGORITHM 与 LOCK 会决定这次 DDL 是「瞬间完成」还是「锁表重建」
ALTER TABLE t ADD COLUMN c INT, ALGORITHM=INSTANT;  -- 8.0.12+ 支持，秒级完成
ALTER TABLE t ADD INDEX idx_a (a), ALGORITHM=INPLACE, LOCK=NONE; -- 不阻塞读写
-- 不支持的组合会直接报错，这正是你想要的：宁可报错也不要偷偷锁表

-- 查看当前操作是否支持 INSTANT
SELECT * FROM information_schema.INNODB_TABLES WHERE NAME LIKE '%t';
${F}

**INSTANT 的边界（8.0）**：只能在**表末尾追加列**、改列默认值、重命名列、设置列可见性；不能改列类型、不能删除列（8.0.29+ 才支持部分场景）、不能加在中间。这才是「先规划字段顺序，再上线」的现实理由。

对于必须重建表的变更（改类型、加分区、改字符集），用工具在线做：

| 工具 | 原理 | 适用 | 注意 |
|---|---|---|---|
| gh-ost | 建影子表 + binlog 抓增量 + 原子改名 | 高写入负载主库 | 需要 binlog_format=ROW；无触发器 |
| pt-online-schema-change | 触发器同步增量 | 通用、老版本 | 触发器与业务触发器冲突 |
| native INPLACE | 引擎内重建 | 多数索引变更 | 仍需磁盘空间与新表空间 |

### 六、分区的真实价值与陷阱

${F}sql
-- 典型场景：日志/流水表按月分区，删除旧数据变成瞬间操作
CREATE TABLE event_log (
  id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  payload JSON,
  PRIMARY KEY (id, created_at)   -- 分区键必须包含在主键里
) PARTITION BY RANGE COLUMNS(created_at) (
  PARTITION p202601 VALUES LESS THAN ('2026-02-01'),
  PARTITION p202602 VALUES LESS THAN ('2026-03-01'),
  PARTITION pmax VALUES LESS THAN (MAXVALUE)
);
-- 归档：秒级，不产生大事务、不膨胀 undo
ALTER TABLE event_log DROP PARTITION p202601;
${F}

**陷阱**：分区并不会让查询变快，它只让「按分区键裁剪」和「快速删除」变快。如果查询条件不带分区键，优化器要扫全部分区，性能反而不如普通表。

### 七、常见误区

1. **「范式越高越好」**。读多写少的报表/列表页盲目 3NF，换来十几个 JOIN，性能全丢在连接上。
2. **「反范式就是冗余错误」**。快照语义的冗余是正确设计，关键是明确它与源数据的**一致性边界**（永不回改 vs 需要同步）。
3. **「ALTER TABLE 一定锁表」**。8.0 上追加列是 INSTANT 的；不确认 ALGORITHM 就动手，与确认后动手，风险差一个数量级。
4. **「加字段不加默认值也没事」**。列允许 NULL 且无默认值时，旧代码的 INSERT 不报错，但新代码读到 NULL 就崩 —— 与之相比，明确的 ${C}NOT NULL DEFAULT${C} 才是安全起点。
5. **「分区表能解决大表慢查询」**。分区的收益在运维（归档/清理），不在查询。

## 七、延伸

- MySQL 8.0 Reference Manual → Ch.11 Data Types / Ch.10 Character Sets / 13.1.20 CREATE TABLE
- PostgreSQL Documentation → Ch.5 Data Definition / Ch.8 Data Types
- 《Database Design for Mere Mortals》（范式与反范式决策框架）
          `
          },
          {
            id: "backup-restore",
            title: "备份与恢复基本操作",
            minutes: 30,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16 / Redis 7",
            tags: ["备份", "恢复", "PITR"],
            terms: ["备份", "恢复", "容灾", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.7 Backup and Recovery](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html) · [MySQL RM → Ch.19 The Binary Log](https://dev.mysql.com/doc/refman/8.0/en/binary-log.html) · [PostgreSQL → Ch.25 Backup and Recovery](https://www.postgresql.org/docs/current/backup.html) · [redis.io → Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## 一、原理与底层机制

备份的本质是**把「数据 + 重放日志」组合成可恢复的状态**。两条技术路线（MySQL RM 7.2 分类）的底层差异在于「恢复时能恢复到哪个时间点」：

| 路线 | 代表工具 | 特点 | 适用 |
|---|---|---|---|
| 逻辑备份 | mysqldump / MySQL Shell dump / pg_dump | 输出 SQL 文本，跨版本、可读、慢 | 中小库、迁移、日常全量 |
| 物理备份 | XtraBackup（Percona）/ pg_basebackup / MySQL Shell clone | 直接拷数据文件，快 | 大库、全量基线 |

**PITR（时间点恢复）的底层逻辑**：全量基线给出「某个时刻的整库快照」，binlog / WAL 给出「快照之后每一笔变更」。恢复 = 基线 + 重放增量日志到指定时间点。所以**没有增量日志归档，就不可能做 PITR**。

## 二、规范与标准

官方推荐的组合拳（MySQL RM 7.3 Example Backup and Recovery Strategy）：

${F}text
每周日 02:00  → 全量物理备份（基线）
每天 02:00    → 全量逻辑备份（双保险 / 可读 / 跨版本）
持续          → binlog 实时归档到远端对象存储
恢复粒度      → 全量基线 + 重放 binlog 到指定时间点 = PITR
${F}

PostgreSQL 同构机制：${C}pg_basebackup${C} 取全量基线 + WAL 归档重放（${C}recovery_target_time${C}），见文档 25.3。**思想一致：全量基线 + 增量日志重放 = 任意时间点恢复**。

## 三、实战

mysqldump 的正确姿势（InnoDB 一致性快照导出，不锁表）：

${F}bash
# 全库逻辑备份（InnoDB 单事务一致性快照，不锁表）
mysqldump --single-transaction \\
  --routines --triggers --events \\
  --set-gtid-purged=ON \\
  --source-data=2 \\          # 8.0.26 前为 --master-data=2
  --all-databases > full_\$(date +%F).sql

# 恢复
mysql -u root -p < full_2026-09-17.sql
${F}

PITR 完整链路：

${F}bash
# 1. 恢复全量基线
mysql < full.sql

# 2. 重放基线位点之后的 binlog，停在事故前一秒
mysqlbinlog --start-position=154 \\
  --stop-datetime='2026-09-17 03:59:59' \\
  binlog.000101 binlog.000102 | mysql
${F}

关键参数（官方 7.4 节）：${C}--single-transaction${C}（InnoDB 一致性快照导出不锁表，前提导出期间无 DDL）、${C}--source-data=2${C}（binlog 位点写入注释，PITR 起点）、${C}--set-gtid-purged=ON${C}（携带 GTID，便于复制拓扑下恢复）。

Redis 备份（redis.io → Persistence）：RDB 定时 fork 全量快照、AOF 追加每条写命令（${C}appendonly yes${C} / ${C}appendfsync everysec${C} 性能安全平衡点），7.x 支持 AOF-RDB 混合持久化。**备份必须异地多副本**：${C}COPY${C} 出 ${C}dump.rdb${C} 上传对象存储才叫备份，本机拷贝不防机器故障。

## 四、覆盖广度

| 场景 | 推荐工具 | 备注 |
|---|---|---|
| 中小库日常全量 | mysqldump / pg_dump | 可读、跨版本，慢 |
| 大库基线 | XtraBackup / pg_basebackup | 物理拷贝，快，需专线 |
| 跨小版本迁移 | MySQL Shell dump utilities | 官方新一代逻辑导出 |
| 增量恢复 | binlog / WAL 归档 | PITR 必备 |
| K8s/云上 | 云厂商快照 + binlog 归档 | 托管方案优先 |

边界：逻辑备份在大表上锁 DDL 风险（即使单事务，DDL 仍会破坏快照一致性）；物理备份恢复粒度粗（只能到备份时刻，再靠 binlog 补）；备份文件本身要加密（含 PII 的数据）。

## 五、常见误区

1. **以为 ${C}--single-transaction${C} 万事大吉**：只对 InnoDB 有效；MyISAM 仍需 ${C}--lock-all-tables${C}（这也是 8.0 全面 InnoDB 的原因之一）。
2. **备份从不做恢复演练**：文件损坏、字符集丢失、版本不兼容，只在真恢复时才发现。SRE 纪律：**每月一次恢复演练并记录耗时（决定 RTO）**。
3. **binlog 与备份同机存放**：机器炸了全没，必须落远端对象存储 / 另一机房。
4. **只备份数据不备份权限与配置**：${C}mysql${C} 系统库、${C}my.cnf${C}、GTID 拓扑同样要备，否则恢复后服务起不来。
5. **把「有备份文件」当「能恢复」**：文件在但恢复命令没演练过、位点记错，等于没有。演练要跑通「基线 + 增量 + 应用起来」全流程。

## 六、自检清单

- [ ] 全量 + 增量 + binlog 归档三级策略在跑，有成功/失败告警
- [ ] 备份加密且异地存储，保留策略明确（如 30 天）
- [ ] 最近 30 天做过真实恢复演练，耗时 < RTO 承诺
- [ ] PITR 精确到秒的恢复演练过
- [ ] 权限库（mysql）/ 配置文件一并纳入备份
- [ ] Redis RDB+AOF 双开且快照异地化

<!--dd:backup-restore-->

## 🔬 深挖：备份的三条正交维度与恢复演练

### 一、先分清「备份」的三个维度

任何一份备份方案，都是这三个选择的组合：

| 维度 | 选项 | 影响 |
|---|---|---|
| 形态 | 逻辑（SQL 文本） / 物理（数据文件） | 逻辑可跨版本可挑表；物理快、可增量 |
| 范围 | 全量 / 增量 / 差异 | 决定恢复耗时与存储成本 |
| 一致性 | 冷备（停机） / 温备（只读锁） / 热备（在线） | 决定对业务的影响 |

**核心指标只有两个**：RPO（能接受丢多少数据）和 RTO（能接受停多久）。先和业务把这两个数字定下来，再选工具 —— 反过来做，一定会做出「备份了但恢复不了」的方案。

### 二、物理热备：XtraBackup 的关键机制

${F}bash
# 全量备份（对 InnoDB 在线、不阻塞写入）
xtrabackup --backup --target-dir=/backup/full \\
  --user=backup --password=*** --parallel=4 --compress

# 增量备份：基于上一次的 LSN 只拷贝变化页
xtrabackup --backup --target-dir=/backup/inc1 \\
  --incremental-basedir=/backup/full

# 关键步骤：prepare（把 redo 应用成一致状态，否则恢复出来的库不可用）
xtrabackup --prepare --apply-log-only --target-dir=/backup/full
xtrabackup --prepare --target-dir=/backup/full   # 最后一次不加 --apply-log-only

# 恢复
xtrabackup --copy-back --target-dir=/backup/full --datadir=/var/lib/mysql
chown -R mysql:mysql /var/lib/mysql
${F}

为什么必须有 ${C}--prepare${C}？因为热备过程中数据文件和 redo 是**不同时刻**的拷贝，不 apply redo 就是「撕裂」的库。**没 prepare 的备份等于没有备份**，这是事故里最常见的一条。

### 三、逻辑备份的隐藏陷阱

${F}bash
# 正确的单库一致性快照（InnoDB）
mysqldump --single-transaction --source-data=2 \\
  --routines --triggers --events --set-gtid-purged=OFF \\
  --hex-blob --default-character-set=utf8mb4 \\
  dbname > dbname.sql
${F}

| 参数 | 作用 | 不写会怎样 |
|---|---|---|
| ${C}--single-transaction${C} | 用 REPEATABLE READ 快照保证一致 | 备份期间数据前后不一致（InnoDB 表） |
| ${C}--source-data=2${C} | 记录 binlog 位点（8.0.26 前叫 ${C}--master-data${C}） | 无法做 PITR |
| ${C}--routines --triggers --events${C} | 含存储过程/触发器/事件 | 恢复后业务逻辑缺失，功能诡异报错 |
| ${C}--hex-blob${C} | 二进制按十六进制导出 | blob/中文乱码 |
| ${C}--set-gtid-purged=OFF${C} | 不写入 GTID 信息 | 恢复到有数据的实例上 GTID 冲突 |
| ${C}--default-character-set=utf8mb4${C} | 明确字符集 | 表情符号被截断 |

**重要提醒**：${C}--single-transaction${C} **只对 InnoDB 有效**。若库里有 MyISAM 表（比如某些老系统表），备份期间它仍会被写入，一致性就破了 —— 这是混杂引擎库做逻辑备份失败的根本原因。

### 四、PITR：把恢复点精确到秒

完整可恢复能力 = **全量备份 + 全量之后的 binlog 序列**。

${F}bash
# 1) 从全量备份恢复
mysql < full.sql

# 2) 找到误操作前的位点，用 binlog 补齐
mysqlbinlog --start-datetime="2026-09-01 00:00:00" \\
            --stop-datetime="2026-09-18 21:00:00" \\
            /var/lib/mysql/binlog.000123 | mysql

# 3) 或按 GTID 区间重放
mysqlbinlog --skip-gtids=false --include-gtids='uuid:1-5000' binlog.000123 | mysql

# 4) 反向解析：从 binlog 里找出被误删的数据
mysqlbinlog --base64-output=DECODE-ROWS -v binlog.000123 | grep -A 30 "DELETE FROM orders"
${F}

**前置条件**：${C}binlog_format=ROW${C}、${C}log_bin=ON${C}、${C}binlog_row_image=FULL${C}。如果是 STATEMENT 格式，某些函数（如 ${C}NOW()${C}、${C}UUID()${C}）在重放时会产生与主库不同的结果，恢复就不可靠了。

### 五、恢复演练：不做演练的备份不算备份

${F}bash
# 最低成本的做法：定期在隔离实例上恢复，并做行数与校验和比对
# 1) 恢复
mysql < dbname.sql
# 2) 逐表比对行数与校验和（用 pt-table-checksum 或自建）
mysql -e "SELECT COUNT(*) FROM dbname.orders" > after.txt
diff before.txt after.txt
# 3) 记录恢复耗时（这是 RTO 的真实值，不是估算值）
${F}

| 检查项 | 不检查的后果 |
|---|---|
| 恢复耗时 | 事故时才发现要 6 小时，业务无法接受 |
| 行数/校验和 | 备份文件损坏、被截断未被发现 |
| 应用可用性 | 库恢复了但账号权限、存储过程缺失，服务起不来 |
| 跨版本兼容 | 5.7 备份恢复进 8.0 报字符集错误 |

### 六、常见误区

1. **「主从复制就是备份」**。${C}DROP TABLE${C}、${C}DELETE${C} 会立刻同步到从库；逻辑错误类故障复制毫无抵抗力。
2. **「备份成功 = 日志无报错」**。mysqldump 中途连接断开可能只写半截文件，必须以**恢复演练**为准。
3. **「备份文件存在本地磁盘」**。同一台机器上的备份不叫备份，至少要落到与库物理隔离的存储，并做加密（备份文件含全部业务数据，是最高的数据泄露风险点）。
4. **「增量备份可以一直叠」**。链越长，恢复越慢、任一层损坏则整链失效。工程上建议「每周全量 + 每日增量」，并定期重做全量。
5. **「大表用 mysqldump 也还行」**。几百 GB 的库用逻辑备份，恢复时要重建索引，耗时是物理备份的数倍，且会长时间占满 IO。

## 七、延伸

- MySQL 8.0 Reference Manual → Ch.7 Backup and Recovery（全章精读）· Ch.19 The Binary Log
- PostgreSQL Documentation → Ch.25 Backup and Recovery
- Percona XtraBackup 8.0 Documentation（大库物理备份事实标准）
          `
          },
          {
            id: "user-privilege",
            title: "用户与权限管理",
            minutes: 22,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis 6+",
            tags: ["权限", "账号", "安全"],
            terms: ["权限", "账号", "MySQL", "安全"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.8 Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)（8.2 Access Control and Account Management / 8.4 Using Encrypted Connections）· [PostgreSQL → Ch.21 Database Roles](https://www.postgresql.org/docs/current/user-manag.html) · [redis.io → ACL](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)

## 一、原理与底层机制

MySQL 的访问控制是**两级验证**（官方 8.2.7），理解它就能理解为什么「host 限定」是第一条防线：

- **Stage 1 连接核实**：校验 ${C}user@host${C} 与密码。${C}'app'@'10.0.%'${C} 的 host 部分决定「从哪里能连」——这是最常被忽略的防线：**生产账号绝不允许 ${C}'%'${C}**。
- **Stage 2 请求核实**：每条语句按「全局 → 库 → 表 → 列 → 例程」层级检查。权限向下生效，**最小权限原则要求授到够用的最低层级**。

Redis 6.0 前的单用户模型没有任何访问控制；6.0 引入 ACL，按「用户 + 命令 + 键前缀」做细粒度控制。

## 二、规范与标准

- **账号分级规范**：应用账号、运维账号、只读报表账号、备份账号必须分离，各自最小权限。
- **认证插件规范**：8.0 默认 ${C}caching_sha2_password${C}，比 5.7 的 ${C}mysql_native_password${C} 更安全。
- **密码策略规范**（官方 8.2.8）：通过 ${C}validate_password${C} 组件强制长度/复杂度；账号属性 ${C}PASSWORD EXPIRE${C} / ${C}PASSWORD HISTORY${C} / ${C}FAILED_LOGIN_ATTEMPTS${C} 是服务器强制策略，比脚本自觉强。
- **角色规范**：8.0 用 ROLE 聚合权限再授予账号，避免散授导致的权限失控。

## 三、实战

账号管理标准操作：

${F}sql
-- 1) 创建账号：host 限定 + 明确认证插件 + 声明式密码策略
CREATE USER 'app_rw'@'10.0.%'
  IDENTIFIED WITH caching_sha2_password BY '复杂密码'
  PASSWORD EXPIRE INTERVAL 90 DAY
  PASSWORD HISTORY 5
  FAILED_LOGIN_ATTEMPTS 5 PASSWORD_LOCK_TIME 1;

-- 2) 用角色聚合权限（8.0+），授角色而非散授
CREATE ROLE 'role_app_rw';
GRANT SELECT, INSERT, UPDATE, DELETE ON shop.* TO 'role_app_rw';
GRANT 'role_app_rw' TO 'app_rw'@'10.0.%';
SET DEFAULT ROLE 'role_app_rw' TO 'app_rw'@'10.0.%';

-- 3) 密码策略组件
INSTALL COMPONENT 'file://component_validate_password';
SET GLOBAL validate_password.policy = STRONG;
SET GLOBAL validate_password.length = 16;
${F}

Redis ACL：

${F}bash
# 只读账号：仅 GET/MGET shop:* 前缀，禁用危险命令
ACL SETUSER report_ro on >'RoPa55' ~shop:* +get +mget -@dangerous

# 业务读写账号
ACL SETUSER app_rw on >'WrPa55' ~shop:* ~cache:* +@read +@write -@dangerous -flushall
ACL SAVE    # 持久化 ACL
${F}

## 四、覆盖广度

| 对象 | 巡检 SQL | 目的 |
|---|---|---|
| 空密码账号 | ${C}SELECT user,host FROM mysql.user WHERE authentication_string=''${C} | 封堵裸奔账号 |
| 通配 host | ${C}... WHERE host='%'${C} | 防止任意来源连入 |
| 权限全景 | ${C}SELECT * FROM mysql.tables_priv${C} | 清理僵尸授权 |
| 锁定状态 | ${C}... account_locked='N'${C} | 确认无异常解锁 |

边界场景：root 账号禁止应用直连；从库读账号应与主库账号分离；临时账号用后必须回收；权限变更必须入版本库（SQL 迁移脚本）或工单，否则出事件无法回溯「谁何时给了谁什么」。

## 五、常见误区

1. **root 直接连应用**：应用被拖库等于全库沦陷。应用账号只拿业务库的 ${C}SELECT/INSERT/UPDATE/DELETE${C}。
2. **僵尸授权无人清**：账号删了授权残留。季度巡检 ${C}mysql.db${C} / ${C}mysql.tables_priv${C}，对照工单清理。
3. **Redis 关 protected-mode 又不设密码**：公网裸奔，历史上大量挖矿劫持由此而来（写 SSH key / 计划任务）。
4. **权限变更无记录**：出事件无法回溯。权限变更必须入版本库或工单。
5. **只在出事后才审计**：把 ${C}mysql.general_log${C} / 审计插件当摆设，真正需要溯源时一片空白。

## 六、自检清单

- [ ] 生产账号 host 全部限定网段，无 '%' 账号
- [ ] 业务账号无 DDL / GRANT / SUPER / FILE 权限
- [ ] 密码过期、历史、失败锁定策略已启用
- [ ] Redis 已启用 ACL 或至少 requirepass + protected-mode
- [ ] 权限变更全量可追溯
- [ ] 季度权限巡检脚本在跑（空密码 / 通配 host / 僵尸账号）

<!--dd:user-privilege-->

## 🔬 深挖：从权限表结构到最小权限落地

### 一、权限存储的六张表（以及为什么不能直接改用户表）

MySQL 把权限分两级存储：**内存中的 ACL 缓存** + **磁盘上的授权表**。

| 表 | 粒度 | 说明 |
|---|---|---|
| ${C}mysql.user${C} | 全局 | 账号、认证插件、全局权限、资源限制 |
| ${C}mysql.db${C} | 库 | 库级权限 |
| ${C}mysql.tables_priv${C} | 表 | 表级权限 + 列权限掩码 |
| ${C}mysql.columns_priv${C} | 列 | 列级权限 |
| ${C}mysql.procs_priv${C} | 存储过程/函数 | 例程权限 |
| ${C}mysql.global_grants${C} | 全局（8.0 新增） | 动态权限的宿主表 |

**禁止直接 ${C}UPDATE mysql.user${C}** 的原因：磁盘表变了但内存 ACL 缓存不会自动刷新，必须 ${C}FLUSH PRIVILEGES${C} 才生效；而用 ${C}GRANT${C}/${C}REVOKE${C}/${C}CREATE USER${C} 语句是「内存 + 磁盘」同时更新，天然一致。

${F}sql
-- 看某个账号的全部有效权限
SHOW GRANTS FOR 'app_rw'@'10.0.%';
-- 8.0 新增：查看某个账号对具体对象的权限（含通过角色继承来的）
SHOW GRANTS FOR 'app_rw'@'10.0.%' USING 'role_readonly';
${F}

### 二、8.0 认证插件的切换与代价

${F}sql
-- 8.0 默认插件是 caching_sha2_password（更安全，但有兼容成本）
CREATE USER 'app_rw'@'10.0.%'
  IDENTIFIED WITH caching_sha2_password BY 'Str0ng!Pass'
  REQUIRE SSL
  PASSWORD EXPIRE INTERVAL 90 DAY
  FAILED_LOGIN_ATTEMPTS 5
  PASSWORD_LOCK_TIME 1;

-- 老客户端（如某些老版本驱动/PHP）不认新插件，需要显式降级
ALTER USER 'legacy'@'%' IDENTIFIED WITH mysql_native_password BY '***';
${F}

安全与兼容的取舍很明确：**新代码一律走 caching_sha2_password + TLS；对确实升级不了的老客户端，单独开一个 native_password 账号并限制来源网段**，不要为了省事把全局 ${C}default_authentication_plugin${C} 降级 —— 那等于让所有账号一起降安全等级。

### 三、角色（Role）：把「权限」变成可版本化的资产

${F}sql
-- 建角色（角色本身不是账号，不能登录）
CREATE ROLE 'role_readonly', 'role_app_rw', 'role_dba_readonly';

-- 给角色授权
GRANT SELECT ON appdb.* TO 'role_readonly';
GRANT SELECT, INSERT, UPDATE, DELETE ON appdb.* TO 'role_app_rw';
GRANT SELECT ON performance_schema.*, SELECT ON sys.* TO 'role_dba_readonly';

-- 授予账号角色，并设定默认激活的角色
GRANT 'role_app_rw' TO 'app_rw'@'10.0.%';
SET DEFAULT ROLE 'role_app_rw' TO 'app_rw'@'10.0.%';

-- 会话内临时切换角色
SET ROLE 'role_readonly';
SELECT CURRENT_ROLE();
SET ROLE DEFAULT;
${F}

**角色的真正价值是「环境一致性」**：把 ${C}GRANT ... TO 'role_app_rw'${C} 写成 SQL 文件纳入代码仓库，测试/预发/生产用同一份定义，避免「生产少了个 SELECT 权限导致上线才发现」。

### 四、最小权限的正确落地姿势

${F}sql
-- 反例 1：应用账号拥有全库全权
GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';            -- 灾难起点

-- 反例 2：允许从任意网段连入
CREATE USER 'app'@'%';                                -- 攻击面最大化

-- 正确示范：按「功能 + 网段 + 最小语句集」建账号
CREATE USER 'svc_order_rw'@'10.20.%' IDENTIFIED WITH caching_sha2_password BY '***' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE ON orderdb.orders     TO 'svc_order_rw'@'10.20.%';
GRANT SELECT, INSERT         ON orderdb.order_item TO 'svc_order_rw'@'10.20.%';
-- 注意：没有 DELETE。删除走状态位由另一条受控通道做
GRANT SELECT ON orderdb.v_order_summary TO 'svc_order_rw'@'10.20.%';

-- 只读报表账号：限定来源 + 限定库 + 限制单次资源
CREATE USER 'bi_ro'@'10.30.%' IDENTIFIED BY '***';
GRANT SELECT ON appdb.* TO 'bi_ro'@'10.30.%';
ALTER USER 'bi_ro'@'10.30.%' WITH MAX_QUERIES_PER_HOUR 20000 MAX_USER_CONNECTIONS 10;
${F}

### 五、绕过权限评估的三种高危路径

| 机制 | 风险 | 缓解 |
|---|---|---|
| ${C}DEFINER${C} 存储过程/视图 | 调用者以 DEFINER 身份执行，可能提权（类似 SUID） | 限定 DEFINER 账号权限，禁用 ${C}SQL SECURITY INVOKER${C} 之外的不必要对象 |
| ${C}FILE${C} 权限 | 可读写服务器文件系统，配合任意文件读写可提权 | 业务账号绝不授予 ${C}FILE${C}；${C}secure_file_priv${C} 指到专用目录 |
| ${C}GRANT OPTION${C} | 持权者可把权限再转授他人 | 业务账号一律不带 ${C}WITH GRANT OPTION${C} |

${F}sql
-- 检查是否有账号带 GRANT OPTION 或高危权限
SELECT user, host, Grant_priv, Super_priv, File_priv, Process_priv
FROM mysql.user WHERE Grant_priv='Y' OR Super_priv='Y' OR File_priv='Y';
-- 检查空密码账号（8.0 里可用但绝对不该有）
SELECT user, host, plugin FROM mysql.user WHERE authentication_string='' ;
${F}

### 六、审计与追溯

${F}sql
-- 8.0 自带审计日志（企业版）与「登录失败」记录（社区版可用 general log 兜底）
SELECT * FROM performance_schema.events_statements_summary_by_account_by_event_name
ORDER BY COUNT_STAR DESC LIMIT 10;   -- 哪个账号在狂跑语句

-- 开启连接失败日志，便于发现暴力破解
-- my.cnf: log_error_verbosity=3
${F}

对于合规场景（等保、SOX），通用做法是开启**独立审计插件**（企业版 audit_log，或 Percona/MariaDB 的审计插件），把「谁、何时、从哪、对哪张表做了什么」落到与数据库分离的存储上 —— 绝不能只落在被审计的这台库上。

### 七、常见误区

1. **「先用 root 跑起来，以后再收权限」**。收权限比给权限难得多，往往要跑通全部用例才能确定最小集合。正确顺序是：开发期就按功能拆账号。
2. **「改了 mysql.user 再 FLUSH 就行」**。字段结构随版本变化（8.0 拆出了 ${C}global_grants${C}），手写 UPDATE 极易造成权限表不一致。
3. **「角色授权后立即生效」**。角色需要 ${C}SET DEFAULT ROLE${C} 或显式 ${C}SET ROLE${C}，否则新会话里角色是未激活状态 —— 这常表现为「明明授了权限却 Access denied」。
4. **「% 通配只是方便」**。${C}'%'${C} 让账号可从任意 IP 尝试，等同把攻击面暴露到公网。内网也应按网段收窄。
5. **「超级账号密码复杂就够了」**。root 不应允许远程登录；${C}root@localhost${C} 之外不应有第二个超级账号。

## 七、延伸

- MySQL 8.0 Reference Manual → Ch.8 Security（8.1–8.5 全读）
- PostgreSQL Documentation → Ch.21 Database Roles / Ch.5.7 Privileges
- redis.io → Docs → Security → ACL
          `
          },
          {
            id: "charset-collation",
            title: "字符集、排序规则与时区",
            minutes: 22,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16",
            tags: ["字符集", "排序规则", "时区"],
            terms: ["字符集", "排序规则", "时区", "utf8mb4"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.10 Character Sets, Collations, Unicode](https://dev.mysql.com/doc/refman/8.0/en/charset.html) · [MySQL RM → 10.9 Unicode Support (utf8mb4)](https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-utf8mb4.html) · [MySQL RM → 5.1.15 Server Time Zone Support](https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html) · [PostgreSQL → Ch.23 Locale & Collation](https://www.postgresql.org/docs/current/collation.html)

## 一、原理与底层机制

字符集决定「字节如何映射成字符」，排序规则（collation）决定「两个字符怎么比大小 / 是否相等」。二者一旦不一致，JOIN、唯一索引、ORDER BY 都会出现诡异行为——这是 DBA 最容易踩却最难定位的坑。

- **utf8mb3 vs utf8mb4**：MySQL 的 ${C}utf8${C} 别名实为 utf8mb3，最多 3 字节，存不了 emoji 和某些生僻字（如 𠮷）。${C}utf8mb4${C} 才是完整 UTF-8（4 字节）。官方 Ch.10.9 明确要求新库用 utf8mb4。
- **collation 三段式命名**：${C}utf8mb4_0900_ai_ci${C} = 字符集_Unicode 9.0.0 版本_ai(口音不敏感)_ci(大小写不敏感)。${C}_bin${C} 是二进制比较（区分大小写、区分口音）。

时区的底层：MySQL 存 ${C}TIMESTAMP${C} 时按会话时区转成 UTC 存储、读取时再转回会话时区；${C}DATETIME${C} 原样存储不做转换。这决定了「跨时区部署时 TIMESTAMP 会自动换算，DATETIME 不会」。

## 二、规范与标准

- **统一规范**：全库、全表、全列、连接串四处的字符集与排序规则必须一致，避免「列 A 是 utf8mb4_general_ci、列 B 是 utf8mb4_0900_ai_ci」导致 JOIN 报 ${C}Illegal mix of collations${C}。
- **版本一致性**：8.0 默认 ${C}utf8mb4_0900_ai_ci${C}，5.7 默认 ${C}utf8mb4_general_ci${C}；跨版本主从/迁移要显式指定排序规则，否则比较行为不一致。
- **时区规范**：服务器 ${C}time_zone${C} 设为具体时区（如 ${C}+08:00${C} 或 ${C}Asia/Shanghai${C}）而非 SYSTEM；JDBC 连接串加 ${C}serverTimezone${C}，避免 JDBC 与服务器时区不一致造成 TIMESTAMP 漂移。

## 三、实战

${F}sql
-- 1) 建库显式指定字符集与排序规则（不要依赖服务器默认）
CREATE DATABASE shop
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- 2) 查看当前会话/服务器字符集与时区
SHOW VARIABLES LIKE 'character_set_%';
SHOW VARIABLES LIKE 'collation_%';
SELECT @@global.time_zone, @@session.time_zone;
SELECT @@system_time_zone;

-- 3) 转换已存在列的字符集（大表注意锁与重放，见迁移篇）
ALTER TABLE user MODIFY COLUMN nickname VARCHAR(64)
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL;

-- 4) 连接串显式时区（JDBC 示例）
-- jdbc:mysql://host:3306/shop?serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4
${F}

恢复时点时特别留意：**PITR 的时间参数依赖服务器时区**，binlog 里的 ${C}--stop-datetime${C} 按服务器时区解释，跨时区恢复前先确认 ${C}@@global.time_zone${C}。

## 四、覆盖广度

| 问题 | 现象 | 根因 | 对策 |
|---|---|---|---|
| 乱码 | 读出 ??? 或方块 | 连接字符集与服务端不一致 | 连接串设 characterEncoding=utf8mb4 |
| JOIN 报错 | Illegal mix of collations | 两列排序规则不同 | 统一排序规则或显式 COLLATE |
| 唯一索引冲突 | 视觉相同却插得进 | 用了 _ci 大小写不敏感 | 敏感场景用 _bin 或业务校验 |
| 时间漂移 | 写入时间与本地差 8 小时 | TIMESTAMP 时区换算 | 统一 serverTimezone |

边界：emoji 存储必须用 utf8mb4；_ci 排序下 'A' 与 'a' 相等，可能影响唯一约束与分区键；国家化业务考虑按语言选 collation。

## 五、常见误区

1. **用 ${C}utf8${C} 当 utf8mb4**：5.7 时代遗留习惯，遇到 emoji/生僻字直接写入失败或截断。
2. **只在库级设字符集**：表、列、连接串未统一，连接串不一致照样乱码。
3. **用 TIMESTAMP 存业务时间**：TIMESTAMP 有时区换算且 2038 年溢出，业务时间（生日、下单时间）应用 DATETIME。
4. **忽略排序规则差异**：跨版本迁移后 _general_ci 与 _0900_ai_ci 比较结果不同，导致排序/去重结果「悄悄变了」。
5. **服务器时区用 SYSTEM 又没同步 OS 时区**：OS 时区一改，数据库时间表现跟着变，PITR 时间参数全乱。

## 六、自检清单

- [ ] 库/表/列/连接串四处字符集与排序规则一致
- [ ] 全库使用 utf8mb4，无 utf8(utf8mb3) 残留
- [ ] 服务器 time_zone 与 JDBC serverTimezone 一致且不为 SYSTEM
- [ ] 业务时间用 DATETIME，绝对时刻才用 TIMESTAMP
- [ ] 跨版本迁移前核对默认排序规则差异
- [ ] 存在 emoji/生僻字列已验证可正常写入

<!--dd:charset-collation-->

## 🔬 深挖：字符集、排序规则与时区的端到端链路

### 一、四个字符集变量必须同时正确

乱码从来不是「一个设置错了」，而是链路上多个环节不一致：

| 变量 | 作用域 | 说明 |
|---|---|---|
| ${C}character_set_server${C} | 实例 | 新建库/表的默认字符集 |
| ${C}character_set_database${C} | 库 | 库级默认 |
| ${C}character_set_client${C} | 会话 | 客户端发来的字节按此解释 |
| ${C}character_set_connection${C} | 会话 | 会话内的转换中转站 |
| ${C}character_set_results${C} | 会话 | 返回给客户端时的编码 |
| ${C}character_set_filesystem${C} | 实例 | 文件名编码，影响 LOAD DATA 等 |
| ${C}collation_connection${C} | 会话 | 会话内比较/排序规则 |
| ${C}collation_server${C} | 实例 | 默认排序规则 |

${F}sql
-- 一次看清全部环节
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- 客户端连接时一次性对齐（比逐个 SET 可靠）
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 连接串里也要写清楚（JDBC 示例）
-- jdbc:mysql://host:3306/db?useUnicode=true&characterEncoding=utf8mb4
${F}

### 二、utf8mb4 / utf8mb3 与排序规则后缀的含义

MySQL 里 ${C}utf8${C} 是 ${C}utf8mb3${C} 的别名 —— **最多 3 字节，存不了 emoji 和大部分生僻字**（如 𠮷、𡃁）。这是「存了 emoji 变成问号」的根本原因。

${F}sql
-- 8.0 里 utf8 已明确等价于 utf8mb3（并给出弃用警告）
SHOW CHARACTER SET LIKE 'utf8%';
-- 建表时明确写 utf8mb4
CREATE TABLE t (name VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci);
${F}

排序规则名字里的后缀是有语义的：

| 后缀 | 含义 | 影响 |
|---|---|---|
| ${C}_ci${C} | case insensitive | 'A' = 'a' 为真，唯一索引会拦 ${C}'a'${C}/${C}'A'${C} |
| ${C}_cs${C} | case sensitive | 'A' ≠ 'a' |
| ${C}_ai${C} | accent insensitive | 'e' 与 'é' 视为相同 |
| ${C}_as${C} | accent sensitive | 区分重音 |
| ${C}_0900_${C} | Unicode 9.0（8.0 新增） | 默认；比 ${C}general_ci${C} 更符合 Unicode 规范 |
| ${C}_bin${C} | 按字节比较 | 大小写敏感、最严格，适合 token/哈希列 |

${F}sql
-- 经典踩坑：用户名唯一索引在 utf8mb4_general_ci 下，'Admin' 与 'admin' 冲突
-- 若业务需要区分大小写，必须显式指定 _bin 或 _cs
CREATE TABLE sys_user (
  username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
  UNIQUE KEY uk_username (username)
);
${F}

**排序规则不一致还会让 JOIN 走不了索引**：两表的列 collation 不同时，比较需要转换，索引失效。

${F}sql
-- 找出全库 collation 不一致的列（迁移前的必查项）
SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE CHARACTER_SET_NAME IS NOT NULL
  AND COLLATION_NAME <> 'utf8mb4_0900_ai_ci'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
${F}

### 三、字符集转换的「二次编码」事故

最恶心的一类乱码：数据本身已经是双重编码的错误字节（如 UTF-8 的中文被当成 latin1 再转一次 UTF-8）。修复要逆向走一遍：

${F}sql
-- 症状：页面显示「ä½ å¥½」这种（UTF-8 字节被 latin1 解释后又存成 UTF-8）
-- 诊断：确认原始字节流
SELECT HEX(name) FROM t WHERE id = 1;
-- E4BDA0E5A5BD 是 UTF-8 的「你好」
-- E4C3A4C2BD... 这种就是二次编码

-- 修复（务必先备份，先在从库/测试库演练）
ALTER TABLE t MODIFY name VARCHAR(64) CHARACTER SET latin1;      -- 回到被误解释的状态
ALTER TABLE t MODIFY name VARCHAR(64) CHARACTER SET utf8mb4;     -- 再按正确编码转回
${F}

更安全的生产做法是**新建列 + 转换写入 + 校验 + 换列**，而不是原地 MODIFY。原地 MODIFY 一旦判断错方向，数据会被永久破坏。

### 四、列长度语义：VARCHAR(64) 的 64 是什么

${F}sql
-- utf8mb4 下 VARCHAR(N) 的 N 是「字符数」，不是字节数
-- 但索引长度限制是按字节算的：InnoDB 单列索引前缀上限 3072 字节（DYNAMIC/COMPRESSED）
-- 所以 utf8mb4 下 VARCHAR 最多能整列索引约 768 个字符
-- utf8mb4_0900_ai_ci 下每个字符最多占 4 字节 → 3072/4 = 768
CREATE TABLE t (a VARCHAR(768) CHARACTER SET utf8mb4, KEY idx_a (a));      -- 刚好
CREATE TABLE t2 (a VARCHAR(1000) CHARACTER SET utf8mb4);                    -- 建索引会报 1071
-- 解决：前缀索引（但要接受无法覆盖、无法用于 ORDER BY 全序）
ALTER TABLE t2 ADD KEY idx_a (a(255));
${F}

### 五、时区：TIMESTAMP 与 DATETIME 的本质差异

| 类型 | 存储 | 转换 | 范围 | 时区变更影响 |
|---|---|---|---|---|
| ${C}TIMESTAMP${C} | 4 字节，UTC 时间戳 | 写入按 session 时区转 UTC，读取按 session 转回 | 1970-01-01 ~ 2038-01-19 | 会变（这是特性） |
| ${C}DATETIME${C} | 8 字节（5.6+），字面量 | 不做任何转换 | 1000-01-01 ~ 9999-12-31 | 不变 |

${F}sql
-- 会话时区
SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();
-- 建议：实例统一 UTC 存储 + 应用层按用户时区展示
-- my.cnf: default-time-zone='+00:00'
SET time_zone = '+08:00';

-- 常见事故：跨时区部署时 NOW() 存进 DATETIME，运维改服务器时区后历史数据全偏 8 小时
-- 结论：DATETIME 字段必须由应用显式写入带时区语义的 UTC 值，不要依赖 NOW()
${F}

**2038 问题**：${C}TIMESTAMP${C} 上限是 2038-01-19 03:14:07 UTC。存放未来时间（如优惠券到期、订阅到期）的字段**必须用 ${C}DATETIME${C}**，否则到期日超过 2038 的数据写不进去。

### 六、常见误区

1. **「改成 utf8mb4 只要一条 ALTER」**。改列字符集只改了「以后怎么解释字节」，已有数据需要同时用 ${C}CONVERT TO CHARACTER SET${C} 才能真正转换，两者含义完全不同。
2. **「客户端 SET NAMES 就够了」**。若连接池在拿到连接后没执行初始化 SQL，SET NAMES 会被下个使用者继承成错误状态；应在连接串/连接池配置里声明。
3. **「排序规则只是排序」**。它还决定唯一索引判重、${C}GROUP BY${C} 分组、${C}DISTINCT${C} 去重 —— ${C}_ci${C} 会把不同大小写视作同一值。
4. **「VARCHAR(255) 就是 255 字节」**。utf8mb4 下最长占 1020 字节，影响行大小与索引前缀预算。
5. **「emoji 存不了是客户端问题」**。根因几乎总是在数据库侧仍是 utf8mb3。

## 七、延伸

- MySQL 8.0 RM → Ch.10 Character Sets / 10.9 Unicode Support
- MySQL RM → 5.1.15 Server Time Zone Support（TIMESTAMP 转换原理）
- PostgreSQL → Ch.23 Locale and Collation
          `
          }
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "对应官方手册「Optimization + InnoDB Transaction Model + Replication + redis.io Persistence」核心章节：索引与执行计划、锁与 MVCC、慢查询治理、复制、Redis 原理。",
        chapters: [
          {
            id: "index-execplan",
            title: "索引原理与执行计划",
            minutes: 38,
            updated: "2026-09-17",
            applies: "MySQL 8.0 InnoDB",
            tags: ["索引", "EXPLAIN", "B+树"],
            terms: ["索引", "执行计划", "B+树", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.10.3 Optimizer and Index Statistics](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html) · [MySQL RM → 8.8.2 EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html) · [InnoDB → 17.6.2.1 Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html) · [InnoDB → 17.6.2.3 Invisible / Descending Indexes](https://dev.mysql.com/doc/refman/8.0/en/descending-indexes.html)

## 一、原理与底层机制

InnoDB 的索引本质是 **B+ 树**，两类索引的差异决定了一切查询行为（官方 17.6.2.1）：

- **聚集索引（主键）**：整张表本身就是一棵按主键组织的 B+ 树，**叶子节点存完整行数据**。这就是「按主键查最快」的根源。
- **二级索引（辅助索引）**：叶子节点存「索引列值 + 主键值」。用二级索引找到主键后，若还需要其他列，必须**回表**——拿主键回聚集索引再查一次。

由此推出三个核心概念：

- **覆盖索引**：查询所需列全部包含在二级索引里，无需回表。EXPLAIN 的 Extra 出现 ${C}Using index${C}。
- **最左前缀**：联合索引 ${C}(a,b,c)${C} 只能命中 ${C}a${C}、${C}a,b${C}、${C}a,b,c${C} 前缀条件；${C}WHERE b=1${C} 用不上（除非索引跳跃扫描 ICP/skip-scan）。
- **索引下推 ICP**：MySQL 5.6+ 把 ${C}WHERE${C} 中能用的条件下推到存储引擎层过滤，减少回表次数（Extra 出现 ${C}Using index condition${C}）。

**B+ 树的关键数字**：InnoDB 页 16KB；BIGINT 主键 + 指针约 12 字节 → 非叶节点约 1300 分支；树高 3 层可索引约 **2000 万行**（业界估算口径）。这意味着：**单表千万级本身不是问题，问题是你的查询走不走索引**。「数据量大了必须分库分表」是过度设计，先看执行计划。

## 二、规范与标准

- **基数与选择性**：索引适合高区分度列；${C}gender${C} 这类低基数列建索引优化器大概率不用，还白付写放大。
- **联合索引列顺序规范**：等值条件列在前，范围/排序列在后；最左前缀原则要求排序列连续紧跟等值列。
- **官方 8.3.13 降序索引**：ASC/DESC 混合排序需要 8.0 的降序索引，否则无法消除 filesort。
- **不可见索引（Invisible Index）**：8.0 支持把索引设为 invisible 观察影响后再删，避免「删了才发现慢」。

## 三、实战

从 filesort 到覆盖索引的改造：

${F}sql
-- 现状：type=ALL, Extra=Using filesort
SELECT id, user_id, amount, created_at FROM orders
WHERE user_id = 10086 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;

-- 建联合索引（等值列在前、排序列在后，符合最左前缀 + 排序连续）
ALTER TABLE orders ADD INDEX idx_user_status_time (user_id, status, created_at);

-- 复查：type=ref, key=idx_user_status_time, Extra=Using index condition
-- 若只 SELECT 索引内列还能变成 Using index（覆盖索引）

-- 上线前用 EXPLAIN ANALYZE（8.0.18+）看真实执行耗时，而非仅估算
EXPLAIN ANALYZE
SELECT id, amount FROM orders
WHERE user_id = 10086 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;
${F}

## 四、覆盖广度

**EXPLAIN 输出逐列精读**（官方 8.8.2）：

| 列 | 看什么 | 优劣序 |
|---|---|---|
| type | 访问类型 | system > const > eq_ref > ref > **range** > index > **ALL**（全表扫，重点消灭） |
| key | 实际用到的索引 | NULL = 没用上 |
| rows | 预估扫描行数 | 越小越好；与实际差一个数量级说明统计信息过期 |
| filtered | 条件过滤比例 | 结合 rows 估算最终行数 |
| Extra | 附加动作 | 见下 |

Extra 速查：${C}Using index${C}（覆盖 ✅）、${C}Using index condition${C}（ICP ✅）、${C}Using where${C}（server 层过滤，中性）、${C}Using filesort${C}（排序没走索引 ⚠）、${C}Using temporary${C}（建了临时表 ⚠）。

**索引失效的六种姿势**：① 对索引列做函数/运算（${C}WHERE DATE(created_at)='...'${C}）；② 隐式类型转换；③ 前导模糊（${C}LIKE '%abc'${C}）；④ OR 混合无索引列；⑤ 优化器判定走索引更慢（回表太多，用 EXPLAIN ANALYZE 看真实）；⑥ 统计信息过期（${C}ANALYZE TABLE${C}）。

## 五、常见误区

1. **索引越多越好**：每个索引都是一棵要维护的 B+ 树，写放大 + 优化器选择困难。高频写表索引 ≤ 5。
2. **拿 ${C}rows${C} 当真实值**：那是统计估算；用 ${C}EXPLAIN ANALYZE${C}（8.0.18+）看真实耗时分布。
3. **在低区分度列上建索引**（如 gender）：优化器大概率不用，还白付写放大。联合索引里作为等值条件的一员才有意义。
4. **ORDER BY 列与索引顺序不一致还想消除 filesort**：索引对排序生效要求「等值条件列在前 + 排序列连续在后」，方向混排需要 8.0 降序索引。
5. **删索引前不观察**：用 invisible 索引先观察再删，避免误删热索引导致线上雪崩。

## 六、自检清单

- [ ] 核心查询的 EXPLAIN 无 ALL / Using filesort / Using temporary
- [ ] 每张表的索引都能对应到具体查询，无「孤儿索引」
- [ ] 联合索引按「等值列在前、排序列在后」设计
- [ ] 统计信息有定期 ANALYZE / 采样页数配置
- [ ] 上线前用 EXPLAIN ANALYZE 验证过真实执行耗时
- [ ] 删索引前先用 invisible 观察一个业务周期

<!--dd:index-execplan-->

## 🔬 深挖：B+Tree 的物理结构与执行计划逐列精读

### 一、索引的物理结构（为什么是 B+Tree 而不是别的）

${F}text
InnoDB 页大小 16KB（innodb_page_size）
B+Tree 三层足以支撑千万级：
  根页 + 非叶页：每页约存 1000+ 个 (key, 子页号) 指针（BIGINT 主键 8 字节 + 6 字节页号）
  叶页：存完整行或 (主键, 索引列)
  1000 × 1000 × 16 行 ≈ 1600 万行，只需 3 次页访问
关键性质：
  1) 所有数据在叶子层，叶间双向链表 → 范围扫描与 ORDER BY 友好
  2) 树高恒定 → 等值查询代价稳定，不像二叉树会退化成 O(n)
  3) 非叶页常驻内存（根与中间层被反复访问，几乎不会淘汰）
${F}

**聚簇索引 vs 二级索引**：InnoDB 表数据本身就按主键组织（聚簇索引就是表）。二级索引的叶子存的是 ${C}(索引列, 主键值)${C}，所以二级索引查到后还要**回表**去聚簇索引再查一次 —— 这就是「覆盖索引」存在的原因：需要的列都在二级索引里时，可以直接返回，省掉回表。

${F}sql
-- 查看聚簇索引与各二级索引
SELECT INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, CARDINALITY
FROM information_schema.STATISTICS WHERE TABLE_NAME='orders' ORDER BY INDEX_NAME, SEQ_IN_INDEX;
${F}

### 二、EXPLAIN 逐列精读

| 列 | 含义 | 判读要点 |
|---|---|---|
| ${C}id${C} | 查询块编号 | 同号从上往下执行；子查询编号更大先执行 |
| ${C}select_type${C} | 查询类型 | SIMPLE / PRIMARY / SUBQUERY / DERIVED / UNION |
| ${C}table${C} | 访问的表 | ${C}<derived2>${C} 表示物化的派生表 |
| ${C}type${C} | 访问方式（**最重要**） | 优劣序：system > const > eq_ref > ref > range > index > ALL |
| ${C}possible_keys${C} | 候选索引 | 有值但 key 为 NULL，说明代价评估后放弃 |
| ${C}key${C} | 实际选用 | NULL = 未用索引 |
| ${C}key_len${C} | 使用的索引字节数 | 可反推用了联合索引的几列（见下） |
| ${C}ref${C} | 与索引比较的对象 | const / 列名 / func |
| ${C}rows${C} | 估算扫描行数 | 与 filtered 一起看，估算错就要修统计 |
| ${C}filtered${C} | 过滤后剩余百分比 | 太低说明索引选择性差 |
| ${C}Extra${C} | 附加信息 | 见下表 |

**Extra 出现即需警惕**：

| Extra | 含义 | 是否要处理 |
|---|---|---|
| ${C}Using index${C} | 覆盖索引，不回表 | 好，保持 |
| ${C}Using index condition${C} | ICP，索引层已过滤 | 好 |
| ${C}Using where${C} | 取回行后再过滤 | 中性，看 rows |
| ${C}Using filesort${C} | 排序无法用索引 | **要处理** |
| ${C}Using temporary${C} | 用了临时表（常为 GROUP BY/DISTINCT） | **要处理** |
| ${C}Using join buffer${C} | 被驱动表无索引，走连接缓冲 | **要处理** |
| ${C}Using MRR${C} | 多范围读，减少随机 IO | 好 |

### 三、用 key_len 反推索引使用情况

${F}text
key_len 是「实际使用的索引列字节长度之和」，可用来验证联合索引用到第几列。
常用列类型的字节数：
  TINYINT 1 / SMALLINT 2 / INT 4 / BIGINT 8
  DATETIME 5（8.0 默认精度，无小数秒）+ 小数秒部分
  允许 NULL 时 +1 字节
  变长字符：utf8mb4 每字符最多 4 字节，VARCHAR(N) → 4N + 2（长度前缀）

例：索引 (a INT, b VARCHAR(10) utf8mb4, c DATETIME)，均 NOT NULL
  仅用 a            → key_len = 4
  a + b             → 4 + (4*10+2) = 46
  a + b + c         → 46 + 5 = 51
EXPLAIN 里 key_len=46 说明 c 没被用上（可能是范围条件或顺序不对）
${F}

### 四、索引失效的完整清单（含原理）

| 失效写法 | 原因 |
|---|---|
| 列上做函数/运算 | 索引按原值排序，变换后无法定位 |
| 隐式类型转换（int 列传字符串） | 相当于对列做 CAST，变成函数 |
| ${C}LIKE '%x'${C} | 前缀无法通配定位，只能扫全索引再过滤 |
| ${C}OR${C} 连接不同列 | 单索引无法同时满足，只能合并或全表 |
| 联合索引跳过最左列 | B+Tree 按「最左列」全局有序，跳过就无法二分 |
| 中间列用范围条件 | 范围之后的有序列无法再用于定位 |
| ${C}NOT IN${C} / ${C}!=${C} / ${C}NOT LIKE${C} | 否定条件通常需扫描大量行 |
| 排序方向不一致（8.0 前） | 8.0 支持降序索引，混排仍可能触发 filesort |
| 字符集/排序规则不一致 | JOIN 时需转换，索引失效 |

${F}sql
-- 8.0 函数索引：让「列上做函数」重新可用
ALTER TABLE t ADD INDEX idx_lower_name ((LOWER(name)));
-- 或生成列 + 索引（兼容写法）
ALTER TABLE t ADD COLUMN name_lc VARCHAR(64) GENERATED ALWAYS AS (LOWER(name)) STORED;
ALTER TABLE t ADD INDEX idx_name_lc (name_lc);
${F}

### 五、JOIN 与排序的执行计划判读

${F}sql
-- 让驱动表走小表：被驱动表必须有可用索引，否则 Nested Loop 会退化成 O(N*M)
EXPLAIN SELECT ...
FROM big_table b JOIN small_table s ON s.id = b.small_id
WHERE s.type = 'A';

-- EXPLAIN FORMAT=TREE 能直接看出驱动顺序与连接算法
-- 看到 hash join 说明无索引等值连接走了 8.0.18+ 的哈希连接
${F}

排序的三种情况：

${F}text
1) 索引天然有序（ORDER BY 列是索引连续性前缀且方向一致）→ Extra 无 filesort
2) 走 filesort，数据量小 → 内存排序（sort_buffer_size 内）
3) 走 filesort，数据量大 → 归并排序落盘（+ 临时表），此时磁盘 IO 是瓶颈
${F}

### 六、常见误区

1. **「索引越多查询越快」**。每个索引都是写放大的来源（INSERT 需维护所有索引），并占用缓冲池。索引数量应「按查询清单反推」。
2. **「EXPLAIN 的 rows 是真实扫描行数」**。它是基于统计的估算，偏差可达几个数量级；要真实值只能 ${C}EXPLAIN ANALYZE${C}。
3. **「加了索引优化器就一定用」**。代价模型可能认为全表扫更便宜（小表、选择率差、表已大量缓存），这时它是对的 —— 用 ${C}FORCE INDEX${C} 强扭通常更慢。
4. **「联合索引列顺序随便」**。顺序由查询形态决定：等值条件列在前、范围列与排序列在后；顺序错了等于没建。
5. **「删索引是零风险清理」**。先用 ${C}ALTER TABLE ... ALTER INDEX ... INVISIBLE${C} 观察一个业务周期，确认无计划回归再删。

## 七、延伸

- MySQL 8.0 RM → 8.3 Optimization and Indexes / 8.8.2 EXPLAIN Output Format / 8.2.1 Optimizing SELECT
- InnoDB Manual → 17.6.2.1 Clustered and Secondary Indexes
- Use The Index, Luke → Executing Plans
          `
          },
          {
            id: "tx-isolation-lock",
            title: "锁与事务隔离级别",
            minutes: 40,
            updated: "2026-09-17",
            applies: "MySQL 8.0 InnoDB",
            tags: ["事务", "锁", "MVCC"],
            terms: ["事务", "锁", "隔离级别", "死锁"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 17.7 InnoDB Locking and Transaction Model](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)（17.7.2 Lock Types / 17.7.2.3 Record / Gap / Next-Key Locks / 17.7.3 Transaction Isolation Levels / 17.7.5 Deadlocks in InnoDB）· [PostgreSQL → Ch.13 Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)

## 一、原理与底层机制

**MVCC（多版本并发控制）** 是 InnoDB 并发能力的根基。每行有两个隐藏列：${C}DB_TRX_ID${C}（最后修改事务号）与 ${C}DB_ROLL_PTR${C}（指向 undo log 旧版本链）。

- **快照读**（普通 ${C}SELECT${C}）：沿 undo 链找到「对自己可见」的版本，**不加锁**。可见性判断用 ReadView（RC 每条语句新建；RR 事务开始后第一条快照读时创建并复用——这就是 RC 与 RR 的本质区别）。
- **当前读**（${C}SELECT ... FOR UPDATE${C} / ${C}FOR SHARE${C} / UPDATE / DELETE）：读最新版本并加锁。

**三种行级锁**（官方 17.7.2.3）：

| 锁 | 锁什么 | 何时使用 |
|---|---|---|
| Record Lock | 单条索引记录 | 唯一索引等值命中 |
| Gap Lock | 索引记录之间的**间隙** | RC 不用；RR 下防幻读 |
| Next-Key Lock | Record + 前面的 Gap | RR 默认的行锁形态 |

**锁的载体是索引**：${C}WHERE col = 5${C} 若 col 无索引，InnoDB 只能全表扫并给**所有扫过的记录加锁**（接近锁全表）。这是「无索引的 UPDATE 引发雪崩」的原理。

## 二、规范与标准

四种隔离级别与三种并发异常（官方 17.7.3）：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---|---|---|---|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED（RC） | 不可能 | 可能 | 可能 |
| **REPEATABLE READ（默认）** | 不可能 | 不可能 | InnoDB 基本防住* |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 |

*SQL 标准里 RR 不防幻读，但 InnoDB 通过 **MVCC + Next-Key Lock** 在快照读与当前读两个通道都大幅抑制了幻读，这是面试与实战都常考的点。

规范：业务默认用 RR；高并发写冲突场景可降 RC 配合「乐观锁版本号 / 唯一索引」防幻读；SERIALIZABLE 吞吐断崖，几乎不用。

## 三、实战

死锁定位与解除：

${F}bash
# 1) 看最近的死锁（err log 里 LATEST DETECTED DEADLOCK）
SHOW ENGINE INNODB STATUS\\G

# 2) 8.0 专属：数据字典里的锁等待视图
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM performance_schema.data_locks;
${F}

典型死锁：事务 A 先锁行 1 再要行 2；事务 B 先锁行 2 再要行 1。预防铁律：多行操作按同一顺序访问（如按主键升序）；事务尽量短；RR 下大范围更新（如 ${C}WHERE status=0${C} 无索引）会锁住大量间隙——先补索引，或该场景降 RC。

乐观锁（不依赖数据库锁的并发修改保护）：

${F}sql
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 5;   -- 影响 0 行说明被并发修改，重试
${F}

## 四、覆盖广度

| 异常 | RR 下是否发生 | RC 下是否发生 | 业务影响 |
|---|---|---|---|
| 脏读 | 否 | 否 | 读到未提交数据 |
| 不可重复读 | 否 | 是 | 同一事务两次读不一致 |
| 幻读（当前读） | 基本否 | 是 | 范围查询多出/少了行 |

边界：长事务会拖长 undo 链、阻塞 purge、放大死锁概率；InnoDB 自动检测死锁并回滚代价小的事务（官方 17.7.5），应用捕获 ${C}1213${C} 错误重试即可，**不重试才是故障**。PG 的 MVCC 实现不同（无回滚链、靠 xmin/xmax 标记），但没有 undo 膨胀问题却有表膨胀问题（需 VACUUM）。

## 五、常见误区

1. **「InnoDB 行锁就是锁行」**：锁在索引记录上；无索引时退化成锁全表扫描路径。给 UPDATE/DELETE 的 WHERE 列建索引是锁粒度优化的第一课。
2. **RC 没有幻读问题的错觉**：RC 下当前读不锁间隙，幻读真实存在；只是 RR 下业务感知不到。
3. **长事务无感知**：${C}information_schema.innodb_trx${C} 里 TIME 巨大的事务会拖长 undo 链、阻塞 purge、放大死锁概率。监控 ${C}SELECT * FROM innodb_trx WHERE TIME > 60${C} 告警。
4. **死锁当成故障**：InnoDB 自动检测并回滚代价小的事务，应用捕获 1213 错误重试即可；**不重试才是故障**。
5. **用 SERIALIZABLE 追求「绝对安全」**：吞吐断崖式下跌，且仍不解决应用层并发写冲突，性价比极低。

## 六、自检清单

- [ ] 所有 UPDATE/DELETE 的 WHERE 列有索引（锁粒度可控）
- [ ] 应用对死锁错误 1213 / 锁等待 1205 有重试逻辑
- [ ] 多行操作按固定顺序（主键序）访问
- [ ] 有长事务监控与告警（> 60s）
- [ ] 团队明确当前隔离级别及其并发异常边界
- [ ] 大范围更新场景评估过 Gap Lock 影响

<!--dd:tx-isolation-lock-->

## 🔬 深挖：MVCC 的内部实现与 InnoDB 加锁规则

### 一、MVCC 到底存了什么：三件套

| 组件 | 位置 | 作用 |
|---|---|---|
| 隐藏列 ${C}DB_TRX_ID${C} | 每行 6 字节 | 最后修改该行的事务 ID |
| 隐藏列 ${C}DB_ROLL_PTR${C} | 每行 7 字节 | 指向 undo log 中的旧版本链 |
| undo log 版本链 | 回滚段 | 每次更新把旧值串起来，形成该行的历史版本链 |
| Read View | 事务内（仅 RR 首次读时建立） | 快照集合：{活跃事务列表, 最小活跃 ID, 下一个待分配 ID} |

读取一行时的判断逻辑（简化）：

${F}text
for 版本 in 该行版本链（从最新往回）:
    if 版本.trx_id == 当前事务:        -> 可见（自己的修改自己看得到）
    elif 版本.trx_id < 视图.最小活跃ID: -> 可见（已提交的旧事务）
    elif 版本.trx_id >= 视图.下一个待分配ID: -> 不可见（未来事务）
    else:                               -> 不可见（当时还活跃）
        沿 roll_ptr 找更早版本，重复判断
${F}

**RC 与 RR 的唯一实现差异就在这里**：RC 每条语句都重建 Read View，RR 只在事务内第一次读时建一次并复用。所以 RR 下同一个事务里两次查询结果一致（可重复读），而 RC 下会看到别人新提交的数据。

### 二、四种隔离级别与它们真实解决的异常

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | InnoDB 的实现手段 |
|---|---|---|---|---|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 直接读最新版本，不加锁 |
| READ COMMITTED | 不可能 | 可能 | 可能 | 每语句建 Read View（推荐互联网业务） |
| REPEATABLE READ（默认） | 不可能 | 不可能 | **InnoDB 用间隙锁基本消除** | 事务级 Read View + next-key lock |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 | 所有读加共享锁 |

注意两点常被误解：

1. **标准 RR 允许幻读**；InnoDB 的 RR 是靠**间隙锁**把幻读也挡住了 —— 这是实现增强，不是标准要求。
2. **RR 下也要用「当前读」才能看到最新数据**。加锁读（${C}FOR UPDATE${C} / ${C}LOCK IN SHARE MODE${C}）总是读最新已提交版本，不走快照。

${F}sql
-- 当前读 vs 快照读
SELECT * FROM account WHERE id = 1;                     -- 快照读（走 MVCC）
SELECT * FROM account WHERE id = 1 FOR UPDATE;          -- 当前读 + 排他行锁
SELECT * FROM account WHERE id = 1 FOR SHARE;           -- 当前读 + 共享行锁（8.0 语法）
SELECT * FROM account WHERE id = 1 FOR UPDATE SKIP LOCKED;  -- 跳过已锁行（做队列消费利器）
${F}

### 三、InnoDB 的锁类型与「加锁规则」

| 锁 | 粒度 | 解决的问题 |
|---|---|---|
| Record Lock | 单条索引记录 | 阻止他人更新/删除这一行 |
| Gap Lock | 索引区间（不含记录） | 阻止区间内插入 → 防幻读 |
| Next-Key Lock | 记录 + 前面的间隙 | **RR 默认行为** |
| Insert Intention Lock | 插入意向 | 多个插入到不同位置互不阻塞 |
| AUTO-INC Lock | 自增 | 8.0 默认改为轻量互斥（innodb_autoinc_lock_mode=2） |
| MDL（元数据锁） | 表结构 | DDL 与 DML 互斥（长事务会阻塞 DDL 的元凶） |

RR 下加锁的三条经验规则（记住这三条能解释绝大多数锁现象）：

${F}text
1) 等值命中唯一索引（且记录存在）      -> 只加 Record Lock（退化为行锁）
2) 等值未命中 或 非唯一索引等值         -> 加 Next-Key Lock，并向后多锁一个区间
3) 范围查询                             -> 扫描到的记录全部加 Next-Key Lock
   特例：WHERE 有索引但条件不满足时仍会锁住扫过的区间（这是"锁住了不存在的行"的原因）
${F}

${F}sql
-- 复现"锁住不存在的行"
-- 表 t 有索引 idx_a，现有 a 值 1, 5, 10
BEGIN;
SELECT * FROM t WHERE a = 7 FOR UPDATE;   -- 未命中，但锁住了 (5,10) 这个间隙
-- 另一会话执行下面这句会被阻塞（插入到该间隙）
INSERT INTO t (a) VALUES (8);             -- 等待中
${F}

### 四、观察锁：performance_schema 是唯一可靠手段

${F}sql
-- 当前持有与等待的锁（8.0：按引擎分区）
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
-- 谁在等谁（可直接定位阻塞源头）
SELECT w.REQUESTING_ENGINE_TRANSACTION_ID AS waiter,
       w.BLOCKING_ENGINE_TRANSACTION_ID   AS blocker,
       l.OBJECT_NAME, l.LOCK_TYPE, l.LOCK_MODE, l.LOCK_DATA
FROM performance_schema.data_lock_waits w
JOIN performance_schema.data_locks l
  ON l.ENGINE_TRANSACTION_ID = w.REQUESTING_ENGINE_TRANSACTION_ID;

-- 找出长事务（>60 秒未提交，是锁堆积与 undo 膨胀的共同根源）
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_rows_locked, trx_rows_modified, trx_mysql_thread_id
FROM information_schema.INNODB_TRX ORDER BY age_sec DESC;

-- 查看最近一次死锁的现场（关键排查依据）
SHOW ENGINE INNODB STATUS\\G    -- 看 LATEST DETECTED DEADLOCK 段
${F}

### 五、死锁：成因、检测与工程解法

死锁的四个必要条件都满足才会发生，工程上能做的是**打破「循环等待」**：

| 手段 | 做法 | 效果 |
|---|---|---|
| 统一加锁顺序 | 所有事务按主键升序更新 | 消除循环等待，最有效 |
| 缩短事务 | 把非 DB 操作（RPC、文件、邮件）移到事务外 | 减少持锁时间 |
| 降隔离级别到 RC | RC 无间隙锁 | 大幅降低间隙锁死锁 |
| 精确命中主键 | 让等值更新的锁退化为 Record Lock | 缩小锁定范围 |
| 应用层重试 | 捕获 1213 后随机退避重试 | 兜底 |
| 死锁检测 | ${C}innodb_deadlock_detect=ON${C}（默认） | 自动回滚代价小的一方 |

${F}sql
-- 反例：事务 A 先锁 1 再锁 2，事务 B 先锁 2 再锁 1 —— 必然可能死锁
-- 正确：所有事务都按 id 升序处理
BEGIN;
SELECT * FROM account WHERE id = 1 FOR UPDATE;
SELECT * FROM account WHERE id = 2 FOR UPDATE;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- 若是批量转账，先对 id 集合排序再逐个加锁
${F}

**一个反直觉的事实**：死锁并不是 bug，而是并发系统在高负载下的正常现象。生产系统的正确姿态不是「消灭死锁」，而是「监控死锁率 + 应用层可重试」。把 ${C}innodb_deadlock_detect${C} 关掉（为了省 CPU）只在极端高并发且能接受超时回滚时使用，且必须同时把 ${C}innodb_lock_wait_timeout${C} 调小。

### 六、乐观锁 vs 悲观锁：选型不是性格问题

| 方案 | 实现 | 适用 | 代价 |
|---|---|---|---|
| 悲观锁 | ${C}SELECT ... FOR UPDATE${C} | 冲突率高、临界区短 | 锁等待、死锁、连接占用 |
| 乐观锁 | 版本号/CAS：${C}UPDATE t SET v=v+1 WHERE id=? AND v=?${C} | 冲突率低、读多写少 | 失败要重试，重试风暴风险 |
| 无锁原子 | ${C}UPDATE t SET stock=stock-1 WHERE id=? AND stock>0${C} | 扣减类、可合并 | 无法处理复杂约束 |

${F}sql
-- 乐观锁：判断影响行数而不是先查再改（避免 TOCTOU）
UPDATE product SET stock = stock - 1, version = version + 1
WHERE id = 100 AND version = 7 AND stock >= 1;
-- 受影响行数 = 0 说明版本冲突或库存不足，按业务决定重试或失败
${F}

### 七、常见误区

1. **「RR 就是完全无锁」**。RR 的读（快照读）无锁，但 RR 的写与加锁读会加 next-key lock，**锁范围比 RC 更大**，反而更容易死锁。这是很多系统把隔离级别降到 RC 的真实原因。
2. **「用了索引就不会锁表」**。若查询最终仍扫到了大量记录（选择率差），加锁范围实际接近全表；而且 MDL 与表级意向锁是绕不开的。
3. **「长事务只是占内存」**。长事务让 undo 无法 purge，回滚段持续膨胀、历史版本链变长导致快照读变慢，还会阻塞 DDL —— 是性能问题链的源头。
4. **「先 SELECT 查库存再 UPDATE」**。两步之间库存可能已被改，必须用「条件更新 + 判断行数」或加锁读。
5. **「死锁靠加锁顺序就能完全避免」**。只在单表批量操作时成立；多表、外键级联、唯一索引冲突场景仍可能死锁，兜底重试不可省。

## 七、延伸

- MySQL 8.0 RM → 17.7 InnoDB Locking and Transaction Model（全章精读）
- PostgreSQL Documentation → Ch.13 Concurrency Control（MVCC 的另一种实现：无回滚链、靠 xmin/xmax）
- 《High Performance MySQL》第 8 章（锁与隔离的实战视角）
          `
          },
          {
            id: "slow-query",
            title: "慢查询治理",
            minutes: 34,
            updated: "2026-09-17",
            applies: "MySQL 8.0",
            tags: ["慢查询", "优化", "pt-query-digest"],
            terms: ["慢查询", "SQL", "优化", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 8.5 Optimizing for Slow Query Log](https://dev.mysql.com/doc/refman/8.0/en/slow-query-log.html) · [MySQL RM → 8.9 Understanding the Query Execution Plan](https://dev.mysql.com/doc/refman/8.0/en/execution-plan-information.html) · [Percona Toolkit → pt-query-digest](https://docs.percona.com/percona-toolkit/pt-query-digest.html)

## 一、原理与底层机制

慢查询治理不是一次性运动，而是「发现 → 归因 → 修复 → 防回归」的循环。其底层逻辑是：**慢日志是优化器实际行为的采样，EXPLAIN 是优化器的计划声明，optimizer trace 是优化器的决策推理**。三者结合才能从「现象」追到「为什么」。

治理流程：

${F}text
① 开慢日志采集 → ② 聚合分析找 TOP SQL → ③ EXPLAIN 归因
    → ④ 改 SQL/索引/结构 → ⑤ 上线比对 → ⑥ 回归监控
${F}

## 二、规范与标准

慢日志配置（官方 8.5 节）：

${F}ini
[mysqld]
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5          # 8.0 支持微秒；按业务 P99 目标定
log_queries_not_using_indexes = ON
log_slow_admin_statements = ON
log_slow_extra = ON            # 8.0.14+ 记录更完整的执行指标
${F}

注意：${C}log_queries_not_using_indexes${C} 可能刷爆日志（全表扫的高频小查询），有此风险时关闭，靠 pt-query-digest 抓全量。阈值 ${C}long_query_time${C} 的设定应与业务 P99 目标对齐，过小则日志无价值，过大则漏掉真凶。

## 三、实战

聚合分析用 pt-query-digest（事实标准）：

${F}bash
pt-query-digest /var/log/mysql/slow.log > slow_report.txt

# 实时抓最慢的 5 条
pt-query-digest --processlist h=127.0.0.1,P=3306,u=monitor \\
  --interval=0.5 --run-time=5m
${F}

报告重点看：**Query 分布（按总耗时排序而非单次最长）**、P95/P99 延迟、Rows examined/Rows sent 比值——**扫描行数是返回行数的成百上千倍 = 典型缺索引或错误计划**。

进阶：optimizer trace（官方 8.9.2）给推理过程：

${F}sql
SET optimizer_trace = 'enabled=on';
SELECT ... ;   -- 你的慢 SQL
SELECT * FROM information_schema.OPTIMIZER_TRACE\\G
-- 看 "considered_execution_plans"：优化器考虑过哪些计划、成本各多少
SET optimizer_trace = 'enabled=off';
${F}

## 四、覆盖广度

| 现象 | 归因 | 对策 |
|---|---|---|
| type=ALL | 无索引 | 建索引 |
| type=ref 但 rows 巨大 | 索引区分度不足 | 换/加前导列 |
| Extra=Using filesort | 排序未走索引 | 联合索引尾列承载排序 |
| Extra=Using temporary | GROUP BY/DISTINCT 无索引 | 索引或改写查询 |

系统层兜底排查（SQL 层面全对还慢，往上查）：

- **Buffer Pool 命中率**：${C}SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read%'${C}；物理读占比高 = 内存不足。
- **IoWait**：${C}iostat -x 1${C} 看 %util 与 await；数据库是最吃 IO 的应用，慢常是宿主机资源问题。
- **MDL 锁等待**：${C}performance_schema.metadata_locks${C}——一个长事务能阻塞后续所有 DDL 与查询。

## 五、常见误区

1. **按单次最长耗时排序优化**：一条每小时跑一次的 10s 查询，危害可能远小于每秒百次的 200ms 查询。**按「总耗时 × 频率」排序**。
2. **只优化不改监控**：没有基线对比，无法证明优化有效。上线前后各留 P95/P99。
3. **在从库上看到主库没有的慢查询就恐慌**：主从数据/负载不同，计划可能不同；在问题发生的实例上复现。
4. **用 ${C}FORCE INDEX${C} 当长期方案**：那是绕过优化器误判的止血贴，根因（统计信息/版本 bug）要修。
5. **只看 SQL 不看系统**：慢可能是 Buffer Pool 命中率低、磁盘 IO 饱和、连接池打满，而非 SQL 本身。

## 六、自检清单

- [ ] 慢日志开启且阈值与业务 P99 目标一致
- [ ] pt-query-digest 定期跑，TOP SQL 有治理看板
- [ ] 每个优化都有优化前后 EXPLAIN 与 P95/P99 对比
- [ ] optimizer trace 会用，能解释优化器的选择
- [ ] Buffer Pool 命中率与 MDL 等待有监控
- [ ] 优化上线后有回归监控防止反弹

<!--dd:slow-query-->

## 🔬 深挖：慢查询治理的闭环方法论

### 一、慢日志：先把数据采准

${F}ini
# my.cnf 关键参数
slow_query_log            = 1
slow_query_log_file       = /var/log/mysql/slow.log
long_query_time           = 0.5          # 生产建议 0.2~1s，别设 10s（漏掉大量次慢查询）
log_queries_not_using_indexes = 1        # 记录未走索引的语句
log_throttle_queries_not_using_indexes = 60   # 防止刷爆日志（每分钟上限）
min_examined_row_limit    = 100          # 扫描行数小于此值不记录，过滤噪音
log_slow_admin_statements = 1
log_slow_slave_statements = 1
${F}

**动态开关（无需重启）**：

${F}sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 0.5;   -- 注意：对已有连接不生效，需重连
SET GLOBAL log_queries_not_using_indexes = ON;
${F}

### 二、从日志到「Top SQL」：指纹化聚合

慢日志是逐条记录，人工看没有意义，必须按**归一化指纹**聚合：

${F}bash
# 官方自带：简单但够用
mysqldumpslow -s t -t 20 /var/log/mysql/slow.log      # 按总耗时排序 Top20
mysqldumpslow -s c -t 20 /var/log/mysql/slow.log      # 按出现次数排序

# Percona 工具链：报告更完整（推荐）
pt-query-digest --since=24h --limit=20 \\
  --filter '$event->{db} ne "information_schema"' \\
  /var/log/mysql/slow.log > digest.txt
${F}

pt-query-digest 报告必须重点看的四列：

| 列 | 含义 | 判读 |
|---|---|---|
| Response time | 总耗时与占比 | 占比 >10% 的语句优先处理 |
| Calls | 执行次数 | 次数多但单次短 → 优化收益也很大 |
| Rows examine / Rows sent | 扫描行数 / 返回行数 | 比值远大于 1 说明索引选择性差 |
| Query_time pct 95/99 | 长尾分布 | 关注 p99，均值会掩盖尖刺 |

**只看均值是典型错误**。一条 p99=8s、均值 20ms 的语句，在高峰期就是雪崩起点。

### 三、归因：把慢查询分到 6 个抽屉里

| 抽屉 | 典型特征 | 修法 |
|---|---|---|
| 缺少合适索引 | type=ALL / rows 巨大 / Rows examine ≫ Rows sent | 加联合索引 / 覆盖索引 |
| 索引用不上 | possible_keys 有值但 key=NULL，或列被函数包裹 | 改写条件、用函数索引 |
| 排序/分组落盘 | Extra 有 Using filesort / Using temporary | 让排序走入索引；减少分组列 |
| 深翻页 | LIMIT 偏移极大 | 游标分页 / 延迟关联 |
| 连接放大 | 嵌套循环 rows 相乘 | 补被驱动表索引；必要时改写为 JOIN 顺序更优的形式 |
| 大事务/锁等待 | 语句本身不慢但等待久 | 缩短事务、统一加锁顺序 |

### 四、实战：一次完整的治理

${F}sql
-- 步骤 1：定位。慢日志显示下面这条占总耗时 34%，单次 p99 = 6.2s
SELECT COUNT(*) FROM orders
WHERE merchant_id = 88 AND status IN (1,2,3) AND created_at >= '2026-01-01';
-- EXPLAIN: type=ref, key=idx_merchant, rows=4200000, Extra=Using where
-- 说明：索引只用了 merchant_id，剩下全在 server 层过滤

-- 步骤 2：归因。merchant_id 选择率太差（该商家订单占全表一半）
SELECT COUNT(DISTINCT merchant_id), COUNT(*) FROM orders;   -- 比率极低

-- 步骤 3：修复。把范围列与过滤列组织成联合索引，让过滤下沉到索引层
ALTER TABLE orders ADD INDEX idx_m_status_time (merchant_id, status, created_at);
-- 重跑 EXPLAIN: key_len 覆盖三列，rows 从 420 万降到 1.2 万，Extra 无 Using where

-- 步骤 4：验证回归。压测同一语句，比对 p50/p99 与扫描行数
-- 步骤 5：上线。先建 INVISIBLE 观察，再放开（见索引章节）
${F}

### 五、把治理做成常设机制

单次治理会退化，必须形成闭环：

${F}text
每周/每日：
  1) 采集      慢日志 + performance_schema.events_statements_summary_by_digest
  2) 聚合      pt-query-digest 或按 DIGEST 聚合（8.0 原生推荐）
  3) 排序      按 (总耗时, 次数, p99) 三维排序，取 Top N
  4) 归因      对照上面 6 个抽屉分类，指定 owner 与时限
  5) 修复      改索引/改 SQL/改代码
  6) 回归      同一语句在预发压测比对，避免"修好一条退化三条"
  7) 沉淀      把新规则写进开发规范与 CI（拦截全表扫、拦截 SELECT *）
${F}

${F}sql
-- 8.0 原生聚合视图比解析慢日志更高效
SELECT DIGEST_TEXT, COUNT_STAR, AVG_TIMER_WAIT/1e9 AS avg_ms,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT,
       SUM_ROWS_EXAMINED/NULLIF(SUM_ROWS_SENT,0) AS examined_per_row
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC LIMIT 20;
-- 比值 examined_per_row 大于 100 的，基本都是缺索引
${F}

### 六、常见误区

1. **「long_query_time 设 10 秒就够了」**。这样只能抓到已经炸掉的查询；设 0.5s 甚至 0.2s，才能抓到「正在变慢」的。
2. **「优化单条 SQL 就够了」**。真正要处理的是**指纹**：一条 p99 慢的语句，往往是被成千上万次调用放大出来的。
3. **「慢日志开久了影响性能」**。日志写入本身有成本，但可接受；真正有成本的是 ${C}log_queries_not_using_indexes${C} 不加限速，会把日志写爆。用 ${C}log_throttle_queries_not_using_indexes${C} 限流。
4. **「加索引就解决了」**。写入放大、缓冲池占用、DDL 成本都要一起算；一个表 20 个索引本身就是新问题。
5. **「压测通过就能上线」**。压测的数据分布常与线上不同（统计数据倾斜时优化器会选不同计划），上线后要用真实分布的统计信息复验。

## 七、延伸

- MySQL 8.0 RM → 8.5 Optimizing for Slow Query Log / 8.9 Understanding the Query Execution Plan
- Percona Toolkit Documentation → pt-query-digest
- 《High Performance MySQL》Ch.4 Optimizing Schema and Data Types
          `
          },
          {
            id: "replication",
            title: "主从复制与读写分离",
            minutes: 40,
            updated: "2026-09-17",
            applies: "MySQL 8.0",
            tags: ["复制", "读写分离", "GTID"],
            terms: ["主从", "读写分离", "复制", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.19 Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)（19.2 Replication Sources / 19.2.1 Binary Log File Position Based / 19.4.11 Semisynchronous Replication / 19.3 GTID-Based Replication）· [MySQL RM → 19.2.5 Replication Channels](https://dev.mysql.com/doc/refman/8.0/en/replication-channels.html) · [MySQL RM → 19.4.3 Replication Threads](https://dev.mysql.com/doc/refman/8.0/en/replication-implementation-details.html)

## 一、原理与底层机制

复制的物理链路由三个线程构成（官方 19.4.3）：

${F}text
主库                          从库
────                          ────
写事务 → binlog（顺序追加）
              │ dump 线程推送
              ▼
                          IO 线程 → relay log（中继日志）
                                    │
                                    ▼
                          SQL 线程重放 → 数据
${F}

**主从延迟 = 网络传输 + relay log 落盘 + SQL 线程重放** 三段之和；生产中绝大多数延迟来自第三段（从库单线程重放追不上主库并发写）。理解这一点才能正确选优化手段（并行复制）。

## 二、规范与标准

binlog 三种格式（官方 19.2.1.1）：

| 格式 | 内容 | 优点 | 风险 |
|---|---|---|---|
| STATEMENT | 记录 SQL 语句 | 体积小 | ${C}NOW()${C}/${C}UUID()${C} 等不确定函数从库重放结果不一致 |
| **ROW（8.0 默认）** | 记录每行变更前后镜像 | 数据一致性最强 | 体积大（批量 UPDATE 千行 = 千条事件） |
| MIXED | 自动切换 | 折中 | 行为不可预期，不建议 |

生产推荐 **ROW + binlog_row_image=FULL**：一致性与审计（Canal/Flink CDC 依赖 ROW 格式解析行变更）。

## 三、实战

GTID 复制（官方 19.3）：GTID = ${C}source_uuid:transaction_id${C}，给全局每个事务一个唯一编号，**换主从拓扑不再需要手找 binlog 位点**：

${F}ini
# 主从都要配
gtid_mode = ON
enforce_gtid_consistency = ON
${F}

${F}sql
-- 建立复制（GTID 模式，8.0.22+ 语法）
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='10.0.0.11', SOURCE_USER='repl', SOURCE_PASSWORD='...',
  SOURCE_AUTO_POSITION=1,          -- GTID 自动定位
  SOURCE_HEARTBEAT_PERIOD=0.01;    -- 心跳，快速感知断连
START REPLICA;
SHOW REPLICA STATUS\\G            -- 8.0.22 前为 SHOW SLAVE STATUS
${F}

关注两个字段：${C}Replica_IO_Running${C} / ${C}Replica_SQL_Running${C} 双 Yes、${C}Seconds_Behind_Source${C} 接近 0。

半同步复制（官方 19.4.11）：主库等**至少一个从库收到 binlog（relay log 落盘）**再向客户端返回成功。

${F}sql
INSTALL PLUGIN rpl_semi_sync_source SONAME 'rpl_semi_sync_source.so';   -- 8.0.26+ 命名
SET GLOBAL rpl_semi_sync_source_enabled = 1;
SET GLOBAL rpl_semi_sync_source_timeout = 1000;   -- 1s 超时降级为异步
${F}

## 四、覆盖广度

**读写分离的正确姿势**：

1. **路由层**：应用内组件（ShardingSphere-JDBC）或独立代理（ProxySQL / MySQL Router）。
2. **延迟容忍分流**：写后立读强制走主（同会话）；报表/列表类走从。
3. **从库延迟告警**：${C}Seconds_Behind_Source${C} > 30s 告警；从库可开并行重放（${C}replica_parallel_workers${C}，基于 WRITESET 的组提交并行）。
4. **GTID 等待写后读一致性**：${C}WAIT_FOR_EXECUTED_GTID_SET${C} 可让主库等待从库追平特定 GTID 再返回读请求，实现会话级一致。

边界：多源复制（multi-source）、双主互备、级联复制各有适用场景；从库上**禁止手动跑 DDL**，否则复制冲突。

## 五、常见误区

1. **以为 ${C}Seconds_Behind_Source=0${C} 就没延迟**：它只比较 binlog 时间戳，大事务卡住时并不真实。更可靠：GTID 集差（${C}SELECT RECEIVED_TRANSACTION_SET vs EXECUTED_TRANSACTION_SET${C}）或心跳表方案。
2. **写后读不做主从一致性处理**：用户改完昵称刷新看不到——写后同会话读主，或用 GTID 等待。
3. **从库当灾备但不演练切换**：切换脚本没跑过 = 没有灾备。MHA/Orchestrator 的 failover 每季度演练。
4. **在从库上跑 DDL**：复制会把主库 DDL 同步过来，从库手动 DDL 会造成表结构冲突、复制中断。
5. **并行复制没开**：单 SQL 线程重放是从库延迟主因，8.0 的 WRITESET 并行复制能大幅提升从库追平速度。

## 六、自检清单

- [ ] ROW 格式 + GTID 开启，SOURCE_AUTO_POSITION=1
- [ ] 双 Yes + 延迟监控告警在跑
- [ ] 写后读有主从路由策略（同会话读主 / GTID 等待）
- [ ] 半同步或等价方案决策有明确记录
- [ ] 从库并行复制已开且参数合理
- [ ] 每季度切换演练通过

<!--dd:replication-->

## 🔬 深挖：复制的内部线程模型与延迟治理

### 一、binlog 三种格式：不是「选一个」而是「看场景」

| 格式 | 记录内容 | 优点 | 代价 |
|---|---|---|---|
| STATEMENT | 原始 SQL | 日志小 | 函数不确定性（NOW/UUID/RAND）、触发器/存储过程可能不一致 |
| ROW | 每行变更前后镜像 | **确定性最强**，可解析 | 日志大（大事务可能放大几十倍） |
| MIXED | 智能切换 | 折中 | 仍有不确定性残留 |

${F}sql
-- 8.0 默认就是 ROW，且强烈建议保持
SHOW VARIABLES LIKE 'binlog_format';
-- ROW 模式下的两个关键细节
-- binlog_row_image=FULL   记录变更前后完整镜像（推荐，便于闪回）
-- binlog_row_image=MINIMAL 只记录变更列（省空间，但无法做完整闪回）
SET GLOBAL binlog_row_image = 'FULL';
-- ROW 模式也能在客户端看到 SQL：用 mysqlbinlog -v 解码
${F}

### 二、复制的线程模型与关键状态

${F}text
主库：
  dump thread       —— 每个从库一个，负责推 binlog
从库：
  IO thread         —— 拉 binlog 写入本地 relay log
  SQL thread        —— 读 relay log 重放（8.0 可多线程）
  Coordinator+Worker（并行复制）—— 8.0 的 applier 由一个 coordinator 分派给多个 worker
${F}

${F}sql
-- 从库状态：一定要看这三个，不能只看 Seconds_Behind_Master
SHOW REPLICA STATUS\\G
--   Replica_IO_Running / Replica_SQL_Running 都必须 Yes
--   Seconds_Behind_Master 的坑：SQL 线程空闲时显示 0，即使落后很久也可能显示 NULL/0
--   更可靠：比较 GTID 集合与实际最新事务的等待时间
SELECT * FROM performance_schema.replication_applier_status_by_worker\\G
SELECT WAIT_FOR_EXECUTED_GTID_SET('uuid:1-9999', 5);   -- 5 秒内追平返回 0
${F}

**${C}Seconds_Behind_Master${C} 不可信的三种情形**：主库长时间无写入（显示 0 但实际可能落后）、从库 SQL 线程被大事务卡住、GTID 模式下 relay log 有空洞。

### 三、并行复制：为什么大事务是延迟的头号元凶

${F}ini
# 8.0 推荐配置
binlog_transaction_dependency_tracking = WRITESET    # 基于行冲突判定并行度（比 COMMIT_ORDER 更激进）
replica_parallel_type = LOGICAL_CLOCK
replica_parallel_workers = 8                          # 与 CPU 核数匹配，过多反而上下文切换
slave_preserve_commit_order = ON                      # 保证提交顺序，GTID 模式必需
${F}

即使配了 8 个 worker，**单个大事务仍然只能由一个 worker 串行重放**。所以：

${F}text
延迟曲线常见形态：
  平稳  ->  突然拉高  ->  缓慢回落
原因：主库跑了一个 200 万行的 UPDATE/DELETE（单事务）
修法：把大事务拆成批（每批 1000~5000 行），并在批间 sleep 让从库追上
${F}

${F}sql
-- 分批删除的标准写法（避免单事务过大 + 避免长锁）
-- 不要：DELETE FROM log WHERE created_at < '2026-01-01';   -- 可能删千万行
-- 而是每批限量，循环直到影响行数为 0
DELETE FROM log WHERE created_at < '2026-01-01' ORDER BY id LIMIT 2000;
SELECT SLEEP(0.2);
${F}

### 四、复制一致性与读写分离的真实风险

读写分离最危险的不是延迟本身，而是**「写后立刻读」读到旧数据**。

| 场景 | 症状 | 解法 |
|---|---|---|
| 用户改昵称后立刻刷新 | 还显示旧昵称 | 该请求强制走主库（按业务标记） |
| 下单后查订单列表 | 查不到刚下的单 | 下单后的 N 秒内该用户走主库 |
| 分布式事务 | 部分数据在从库 | 用 GTID 等待：${C}WAIT_FOR_EXECUTED_GTID_SET${C} |
| 后台导出 | 数据前后不一致 | 固定在一个从库上、单连接、RR 快照 |

${F}sql
-- 精确的「等待指定事务在从库重放完成」
SELECT @@global.gtid_executed;                 -- 主库提交后拿到 GTID 集合
SELECT WAIT_FOR_EXECUTED_GTID_SET('3f9d...:1001', 1.0);  -- 在从库等它，超时 1s
-- 应用层封装：写后读强制走主，或带上 GTID 等待
${F}

### 五、半同步复制：after_sync 与 after_commit 的区别

${F}sql
-- 安装并启用半同步（默认是异步，主库提交不等从库）
INSTALL PLUGIN rpl_semi_sync_source SONAME 'semisync_source.so';
SET GLOBAL rpl_semi_sync_source_enabled = ON;
SET GLOBAL rpl_semi_sync_source_timeout = 1000;      -- 超时后自动退化为异步
SET GLOBAL rpl_semi_sync_source_wait_point = AFTER_SYNC;   -- 8.0 默认且推荐
${F}

| 等待点 | 含义 | 风险 |
|---|---|---|
| ${C}AFTER_COMMIT${C}（旧默认） | 引擎提交后才等从库 ACK | 主库已提交但对客户端未返回，此时主库挂了，客户端可能以为失败而重试 → 重复写入 |
| ${C}AFTER_SYNC${C}（8.0 默认） | 等从库 ACK 后才在引擎提交 | 主库崩溃时事务未提交，客户端明确失败，语义干净 |

**半同步解决的是「不丢数据」，不是「强一致」**：它保证至少一个从库收到 binlog，但读操作仍可能读到旧值。要强一致得用 MGR（组复制）或共识层。

### 六、常见误区

1. **「有从库就等于有备份」**。逻辑错误（误删、误更新）会同步到从库。备份必须是独立的物理/逻辑副本。
2. **「从库拿来跑报表没问题」**。大报表会把从库 SQL 线程拖住，导致复制延迟，进而影响依赖从库的业务读 —— 报表流量必须与复制从库隔离。
3. **「加从库能提升写入能力」**。从库只分担读；写能力仍受主库单点限制，且从库越多主库 dump 线程与网络开销越大。
4. **「复制过滤可以随意用」**（如 ${C}replicate-do-table${C}）。过滤后 relay log 与 GTID 集合会出现空洞，故障切换时数据不一致，官方明确不推荐在生产使用。
5. **「GTID 换了就万事大吉」**。GTID 解决了位点漂移，但 ${C}gtid_executed${C} 集合膨胀、${C}gtid_purged${C} 误清、跨版本复制仍有约束（5.7→8.0 单向兼容）。

## 七、延伸

- MySQL 8.0 RM → Ch.19 Replication（19.2–19.5 全读）
- MySQL 8.0 RM → 19.3.3 GTID 复制的运维操作
- ProxySQL / MySQL Router 官方文档（读写分离路由层）
          `
          },
          {
            id: "redis-internals",
            title: "Redis 数据结构与持久化",
            minutes: 38,
            updated: "2026-09-17",
            applies: "Redis 7.x",
            tags: ["Redis", "持久化", "RDB", "AOF"],
            terms: ["Redis", "持久化", "RDB", "AOF"],
            body: `
> **官方文档基线**：[redis.io → Data Types](https://redis.io/docs/latest/develop/data-types/) · [redis.io → Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) · [redis.io → Latency 诊断](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/) · [redis.io → Key Eviction](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)

## 一、原理与底层机制

Redis 命令执行是**单线程**（6.0+ 仅网络 IO 多线程），**任何一条慢命令都会阻塞所有请求**。理解这点就理解了所有延迟问题的根源。其数据结构采用**多态编码**：同一逻辑类型根据数据量自动在多种底层编码间切换，以平衡内存与性能：

| 类型 | 底层编码（自动转换） | 高频场景 |
|---|---|---|
| String | int / embstr / raw | 计数器（${C}INCR${C}）、缓存 JSON、分布式锁 |
| Hash | listpack / hashtable | 对象字段级读写（用户资料） |
| List | listpack / quicklist | 消息队列简版（LPUSH+BRPOP）、时间线 |
| Set | intset / listpack / hashtable | 标签、共同关注（SINTER）、去重 |
| Sorted Set | listpack / skiplist | 排行榜（ZREVRANGE）、延迟队列（score=时间戳） |

补充三个高频进阶类型：**Bitmap**（签到、活跃统计）、**HyperLogLog**（UV 估算，误差 0.81%）、**Stream**（正式的消息队列，消费组支持）。

## 二、规范与标准

**RDB（快照）**：${C}SAVE${C}/定时触发时 **fork 子进程**，利用操作系统的 **COW（写时复制）** 保证快照一致性——主进程继续服务，子进程遍历内存写 ${C}dump.rdb${C}。

${F}conf
save 3600 1 300 100 60 10000   # 1h 内 1 次改动 / 5min 内 100 次 / 1min 内 1 万次
dbfilename dump.rdb
${F}

**AOF（追加日志）**：每条写命令追加到 AOF：

${F}conf
appendonly yes
appendfsync everysec      # always=不丢 | everysec=最多丢 1 秒 | no=交给 OS
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
${F}

**混合持久化（7.x 默认 aof-use-rdb-preamble=yes）**：AOF 重写时前半段是 RDB 全量、后半段是增量命令——**恢复快 + 丢得少**，生产标配。

⚠ fork 的代价：内存越大 fork 越慢（拷贝页表），10GB+ 实例在高峰期做 RDB 可能造成数百 ms 停顿——这是官方 Latency 文档专门列出的延迟来源之一。

## 三、实战

内存淘汰配置：

${F}conf
maxmemory 4gb
maxmemory-policy allkeys-lru    # 常用选项见下
${F}

| 策略 | 语义 |
|---|---|
| noeviction（默认） | 写满报错——**缓存场景必须改掉默认值** |
| allkeys-lru | 全键 LRU——纯缓存首选 |
| volatile-lru / volatile-ttl | 仅对设了过期时间的键 |
| allkeys-lfu（4.0+） | 按访问频率淘汰——热点不均场景优于 LRU |

缓存三件套（与 MySQL 组合）：

- **Cache Aside**：读 → 缓存未命中查库回填；写 → 更新库后**删缓存**（不是更新缓存）。
- **穿透**：查不存在的 key 每次打到库 → 空值缓存（短 TTL）或布隆过滤器。
- **雪崩**：大量 key 同 TTL 过期 → TTL 加随机抖动；热点 key 突然过期 → 逻辑过期 + 异步刷新。

## 四、覆盖广度

**单线程延迟红线**（官方 Latency 文档按优先排查）：

1. **大 Key**：单个 String > 10KB、集合元素 > 5000 的读删都是慢操作。排查：${C}redis-cli --bigkeys${C} / ${C}MEMORY USAGE key${C}。
2. **慢命令**：${C}KEYS *${C}、大集合的 ${C}SMEMBERS${C}、${C}SLOWLOG GET${C} 查元凶；${C}O(N)${C} 命令用 ${C}SCAN${C} 系列替代 ${C}KEYS${C}。
3. **fork**：RDB/AOF 重写期间；监控 ${C}latest_fork_usec${C}。
4. **Swap**：宿主机内存不足导致 Redis 进程被换出，性能断崖。${C}vm.swappiness=1${C}。

边界：Redis 是内存库，数据可丢；分布式锁正确姿势 ${C}SET key val NX EX 30${C}，释放用 Lua 校验持有者（RedLock 争议下推荐 Redisson）；生产禁用 ${C}KEYS${C}/${C}FLUSHALL${C}（用 rename-command）。

## 五、常见误区

1. **RDB 与 AOF 只开一个**：只开 AOF 恢复慢（重放全部命令），只开 RDB 丢得多。混合持久化两个问题都解决。
2. **把 Redis 当主存储**：它是内存库，淘汰与故障都意味着数据可丢；主数据必须在 MySQL，Redis 只是加速层。
3. **分布式锁用 ${C}SETNX${C} 没有过期时间**：客户端崩溃锁永久卡死。正确姿势 ${C}SET key val NX EX 30${C}。
4. **用 ${C}KEYS${C} 做运维巡检**：生产禁用；用 ${C}SCAN${C} 增量遍历。
5. **不设 maxmemory-policy**：默认 noeviction，缓存写满直接报错，击穿到数据库。

## 六、自检清单

- [ ] RDB + AOF（混合持久化）双开，appendfsync=everysec
- [ ] maxmemory 与淘汰策略按场景明确设置（缓存 = allkeys-lru/lfu）
- [ ] 有大 Key 与慢命令的定期巡检（--bigkeys + SLOWLOG）
- [ ] latest_fork_usec 与宿主 swap 有监控
- [ ] 缓存穿透/雪崩/击穿三场景有明确对策
- [ ] 生产 ${C}KEYS${C} / ${C}FLUSHALL${C} 已通过 rename-command 禁用

<!--dd:redis-internals-->

## 🔬 深挖：编码转换、持久化与内存治理

### 一、底层编码与转换阈值（决定内存与延迟的关键）

Redis 每种逻辑类型都有多种底层编码，**会在超过阈值时自动转换，且通常不可逆**：

| 类型 | 小数据编码 | 大数据编码 | 转换阈值 |
|---|---|---|---|
| String | int（可解析为整数时） | embstr（≤44 字节）→ raw | 长度 > 44 字节转 raw |
| List | listpack | quicklist（多 listpack 节点） | 元素 > 128 或元素 > 64 字节 |
| Hash | listpack | hashtable | 字段 > 128 或任一值 > 64 字节 |
| Set | intset（全整数）/ listpack | hashtable | 元素 > 128 或非整数字符串 |
| ZSet | listpack | skiplist + dict | 元素 > 128 或成员长度 > 64 |

${F}bash
# 观察真实编码（比猜内存更准）
redis-cli OBJECT ENCODING myhash        # listpack / hashtable
redis-cli OBJECT REFCOUNT mykey
redis-cli MEMORY USAGE mykey            # 单 key 实际内存占用
redis-cli --bigkeys                     # 扫描各大 key（会阻塞，生产用 SCAN 版脚本）
redis-cli --hotkeys                     # 需要 LFU 淘汰策略才有效
${F}

**转换不可逆是设计选择**：hashtable → listpack 需要重新分配连续内存，会引发阻塞；Redis 选择不回退，用内存换稳定。所以「先灌 10 万字段再删除到 100 个」，这个 hash 依然占 hashtable 的内存 —— 必须删 key 重建。

阈值可以调，但代价要知道：

${F}
# 调大阈值可以省内存（尤其小 hash/小 zset 场景）
hash-max-listpack-entries 128
hash-max-listpack-value   64
zset-max-listpack-entries 128
list-max-listpack-size    128
# 注意：调大后，某些 O(n) 操作（如遍历 listpack）的单次阻塞时间会变长
${F}

### 二、持久化：RDB、AOF 与混合持久化

| 维度 | RDB | AOF | 混合（4.0+，推荐） |
|---|---|---|---|
| 内容 | 某时刻数据快照（二进制） | 每条写命令（文本） | RDB 头 + 增量 AOF |
| 恢复速度 | 快 | 慢（要重放全部命令） | 快 |
| 数据安全 | 丢失最后一次快照后的数据 | 取决于 appendfsync | 兼顾 |
| 文件大小 | 小 | 大 | 中 |
| fork 成本 | 有（COW） | 有（rewrite 时） | 有 |

${F}ini
# 推荐配置：开启混合持久化
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec                  # 每秒钟 fsync，最多丢 1 秒（默认且均衡）
aof-use-rdb-preamble yes              # 混合持久化
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
# RDB 作为兜底与备份载体
save 900 1
save 300 10
save 60 10000
${F}

${C}appendfsync${C} 三档的真实取舍：

${F}text
always   ：每条命令 fsync -> 最安全，吞吐可能掉到 1/100（SSD 也扛不住）
everysec ：后台每秒 fsync -> 生产默认；最坏丢 1 秒数据
no       ：交给 OS 决定 -> 性能最好，可能丢 30 秒
${F}

### 三、fork 与 COW：延迟尖刺的真正来源

${F}bash
# fork 在 64GB 实例上可能耗时上百毫秒（阻塞主线程）
redis-cli INFO stats | grep latest_fork_usec
redis-cli INFO memory | grep -E "used_memory_human|used_memory_rss_human|mem_fragmentation_ratio"

# 降低 fork 成本的工程手段
# 1) 单实例内存不要超过 10~16GB（大内存拆多个实例）
# 2) 避免 THP（透明大页），会显著放大 COW 拷贝
#    echo never > /sys/kernel/mm/transparent_hugepage/enabled
# 3) 关闭自动重写的高峰期触发，把 rewrite 放到低峰（或用主从，在从库做）
# 4) 开启 repl-diskless-sync，全量同步走网络不落盘
${F}

**COW 的记忆负担**：fork 后父子进程共享内存页，任一页被写就复制一份。如果 fork 期间写入量很大（页被大量修改），内存可能膨胀接近 2 倍 —— 这是「Redis 内存莫名翻倍」的常见原因。

### 四、内存淘汰与过期策略

${F}ini
maxmemory 8gb
maxmemory-policy allkeys-lru      # 8 种策略见下表
maxmemory-samples 5               # LRU/LFU 采样数，越大越准也越耗 CPU
${F}

| 策略 | 淘汰范围 | 适用 |
|---|---|---|
| noeviction | 不淘汰，写入报错 | 持久化数据存储（当作 DB 用） |
| allkeys-lru | 所有 key | **通用缓存首选** |
| allkeys-lfu | 所有 key，按访问频率 | 有明显热点长尾（4.0+） |
| allkeys-random | 所有 key | 访问分布均匀 |
| volatile-lru / lfu / random / ttl | 仅设置了过期时间的 key | 同一实例混合持久与缓存，需谨慎 |

过期删除是**双策略**：

${F}text
惰性删除：访问 key 时检查是否过期 -> 保证不返回过期数据，但内存不主动释放
定期删除：每秒 10 次（hz 可调）随机抽样 20 个带过期时间的 key，删除过期的；
          若过期比例 > 25% 则立刻再来一轮 -> 控制内存回收速度
后果：即使 key 已过期，内存也可能迟迟不释放（尤其大量 key 同一时刻过期）
解法：给过期时间加随机抖动（如 3600 + rand(0,300)），错峰过期
${F}

### 五、集群：槽、MOVED/ASK 与跨槽限制

${F}text
16384 个 hash slot，slot = CRC16(key) % 16384
MOVED  ：槽永久迁移到别的节点，客户端应更新本地槽映射
ASK    ：槽正在迁移中，本次临时去目标节点查，不要更新映射
CROSSSLOT：多 key 命令的 key 不在同一槽 -> 直接报错
解法：hash tag —— 用 {} 指定参与计算的部分，如 user:{1001}:name 与 user:{1001}:age 同槽
${F}

${F}bash
redis-cli -c -p 7000 CLUSTER SLOTS
redis-cli -c -p 7000 CLUSTER KEYSLOT user:{1001}:name
# 集群模式不支持跨槽的 MGET/MSET/事务/Lua 多 key 操作
# 需要原子多 key 时，用 hash tag 把相关 key 固定到同槽
${F}

### 六、常见误区

1. **「用 KEYS 做线上排查」**。${C}KEYS pattern${C} 是 O(N) 且阻塞单线程；用 ${C}SCAN${C} 游标迭代。
2. **「Redis 单线程所以不需要考虑并发」**。单线程指的是命令执行，网络 IO 在 6.0+ 已是多线程；而且单线程意味着**一个慢命令阻塞所有人**（大 key 删除、全量遍历、Lua 长脚本）。
3. **「设了过期时间内存就会及时释放」**。惰性 + 定期删除的组合意味着可能有大量「已过期未回收」的内存，需要监控 ${C}expired_keys${C} 与内存曲线。
4. **「把所有数据都放 Redis 就快了」**。Redis 是内存系统，成本远高于磁盘；用 LRU 策略时应明确「缓存可丢」的业务语义。
5. **「主从复制不会丢数据」**。Redis 主从默认是**异步**复制，主库写入成功即返回，故障切换可能丢最近若干条；用 ${C}WAIT${C} 命令可要求至少 N 个副本确认，代价是延迟。

## 七、延伸

- redis.io → Persistence（官方对两种方案取舍的权威论述）
- redis.io → Latency 诊断指南（一篇讲完所有延迟元凶）
- redis.io → Distributed Locks（官方对锁实现的说明与警告）
          `
          },
          {
            id: "connection-management",
            title: "连接管理与连接池",
            minutes: 24,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis / PgBouncer",
            tags: ["连接", "连接池", "最大连接数"],
            terms: ["连接", "连接池", "max_connections", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 5.1.8 Server System Variables (max_connections)](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_max_connections) · [MySQL RM → 5.1.14 Wait Timeout](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_wait_timeout) · [PostgreSQL → Ch.27 Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html) · [PgBouncer Docs](https://www.pgbouncer.org/)

## 一、原理与底层机制

数据库连接是**有成本的资源**：每个连接对应一个后端线程/进程、占用内存（MySQL 每连接默认约数 MB 的 buffer）、持有事务与锁。连接数失控是「数据库突然挂掉」的头号非 SQL 原因。

- **MySQL 的连接模型**：每连接一个独立线程（one-thread-per-connection）。${C}max_connections${C} 是硬上限，超过报 ${C}Too many connections${C}；还有 ${C}max_user_connections${C} 按账号限流。
- **连接池的本质**：用「少量长连接 + 复用」替代「每次请求新建/销毁短连接」。新建 TCP + 认证 + 握手开销在高频调用下不可忽略。
- **Redis 的连接**：单线程处理，大量并发连接本身不慢，但每个连接占内存，且 ${C}MONITOR${C} / 大 pipeline 会阻塞。

## 二、规范与标准

- **max_connections 设定规范**：按「应用连接池上限之和 + 运维/监控余量」设定，而不是拍脑袋。预留 10%~20% 给运维，避免连不上无法排查。
- **超时规范**：${C}wait_timeout${C} / ${C}interactive_timeout${C} 控制空闲连接回收（默认 8 小时太长，建议 300~600s）；连接池的 maxIdle 与之对齐，避免「连接被服务端回收后客户端还在用」的 ${C}MySQL server has gone away${C}。
- **连接池参数规范**：最大池大小按「并发峰值 / 单连接处理能力」估算；${C}maxWait${C} 控制获取连接超时，避免线程无限堆积。
- **PgBouncer 模式规范**：PostgreSQL 短连接成本极高，生产必须用连接池；transaction 模式复用率最高但要求应用不依赖会话级状态（如临时表、SET 变量）。

## 三、实战

MySQL 侧关键参数与排查：

${F}sql
-- 查看连接上限与当前使用
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Threads_running';     -- 真正在跑的，比 connected 更关键
SHOW PROCESSLIST;                        -- 看连接来源与状态（Sleep 过多 = 泄漏）

-- 紧急回收空闲连接（不能直接 KILL 全部，按来源筛选）
SELECT CONCAT('KILL ', id, ';') FROM information_schema.processlist
WHERE command='Sleep' AND time > 3600;
${F}

Java 侧 HikariCP 示例配置：

${F}ini
spring.datasource.hikari.maximum-pool-size=20      # 按单实例并发估算，不是越大越好
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000       # 5 分钟空闲回收，对齐 wait_timeout
spring.datasource.hikari.max-lifetime=1800000      # 连接最大存活，小于 wait_timeout 防服务端先断
spring.datasource.hikari.connection-timeout=3000   # 获取连接超时
${F}

## 四、覆盖广度

| 问题 | 现象 | 根因 | 对策 |
|---|---|---|---|
| Too many connections | 应用报错连不上 | 池上限 × 实例数 > max_connections | 调大 max_connections / 缩池 / 加 Proxy |
| 连接泄漏 | Sleep 连接持续增长 | 用完没 close（异常分支漏） | 用 try-with-resources / 池归还 |
| gone away | 偶发报错 | 连接空闲超时被服务端回收 | idle 时间 < wait_timeout |
| 慢但没慢 SQL | Threads_running 飙 | 连接被长事务/锁占满 | 查锁、拆事务 |

边界：连接池过大反而拖垮数据库（每个连接占 buffer，大量并发查询互相抢资源）；K8s 多副本下池大小 × 副本数要纳入 max_connections 核算。

## 五、常见误区

1. **连接池越大越好**：池过大 = 数据库并发连接爆炸，每个连接占内存与线程，反而降低吞吐。按实测拐点设定。
2. **不设 idle/timeout 对齐**：应用 idle 时间比 ${C}wait_timeout${C} 长，连接被服务端静默回收，下次用就 ${C}gone away${C}。
3. **连接泄漏无监控**：异常分支忘记 close，Sleep 连接缓慢增长直到打满，典型「运行几天后突然挂」。
4. **max_connections 直接调到几千**：掩盖了连接泄漏/池过大问题，且每连接占内存，数据库内存被吃光。
5. **PostgreSQL 不上连接池**：PG 每连接一个进程，短连接成本极高，不上 PgBouncer 在高并发下必崩。

## 六、自检清单

- [ ] max_connections 按「应用池上限之和 + 运维余量」设定
- [ ] 连接池 idle/maxLifetime 与 wait_timeout 对齐
- [ ] 应用用 try-with-resources / 确保连接归还，无泄漏
- [ ] Threads_running 与连接数有告警
- [ ] PostgreSQL 已用 PgBouncer 等连接池
- [ ] 有连接泄漏的监控（Sleep 连接增长趋势）

<!--dd:connection-management-->

## 🔬 深挖：连接生命周期、连接池配置与故障应急

### 一、一个 MySQL 连接的完整生命周期

${F}text
1) TCP 三次握手                      —— 约 0.1ms（内网）
2) 握手包（协议版本、能力位、salt）    —— 1 RTT
3) 认证（插件：caching_sha2_password 首次需 RSA/TLS）—— 1~2 RTT，冷启动最贵
4) 权限加载（读权限表建 ACL）          —— 有缓存，thread_cache 命中时更快
5) 设置会话变量（字符集/时区/隔离级别） —— 每条 SQL 前的小成本，量大后不可忽略
6) 执行语句
7) 断开（可 wait_timeout 被动断开）
${F}

**关键结论**：建连成本远高于执行一条简单 SQL。所以必须复用连接 —— 这就是连接池存在的全部理由。

${F}sql
-- 观察连接现状
SHOW STATUS LIKE 'Threads_connected';       -- 当前连接数
SHOW STATUS LIKE 'Threads_running';         -- 正在执行（不含 Sleep）—— 真正的负载指标
SHOW STATUS LIKE 'Max_used_connections';    -- 历史峰值
SHOW STATUS LIKE 'Threads_created';         -- 新建线程次数
SHOW VARIABLES LIKE 'thread_cache_size';    -- 线程缓存
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'wait_timeout';         -- 空闲连接被服务端断开的秒数（默认 28800）
SHOW VARIABLES LIKE 'interactive_timeout';
-- 连接来源分布：定位谁在猛开连接
SELECT USER, HOST, COUNT(*) c FROM information_schema.PROCESSLIST GROUP BY USER, HOST ORDER BY c DESC;
${F}

### 二、${C}too many connections${C} 的应急处理

连不上库时，标准救援套路是**预留一个管理连接**：

${F}ini
# my.cnf：预留 1 个仅供 SUPER 用户使用的额外连接
extra_max_connections = 3
extra_port = 33062
${F}

${F}bash
# 应急：从额外端口连进去，杀掉空闲连接或调大上限
mysql -u root -p -P 33062 -h 127.0.0.1
${F}

${F}sql
-- 杀掉长时间 Sleep 的连接（先看清楚再杀：确认不是长事务持有者）
SELECT id, user, host, db, command, time, state, LEFT(info,60)
FROM information_schema.PROCESSLIST
WHERE command = 'Sleep' AND time > 600 ORDER BY time DESC;
-- 批量生成 KILL（人工复核后再执行）
SELECT CONCAT('KILL ', id, ';') FROM information_schema.PROCESSLIST
WHERE command='Sleep' AND time > 600;
-- 临时调大上限（重启失效，仅用于止损）
SET GLOBAL max_connections = 2000;
${F}

**注意**：${C}max_connections${C} 不是越大越好。每个连接都会分配线程栈 + 会话缓冲（sort_buffer、join_buffer 等按需分配）。几千连接时会话级内存会吃掉大量物理内存，且线程上下文切换开销剧增。真实容量应该由「连接数 × 单连接内存」与 CPU 核数共同决定。

### 三、连接池核心参数与常见误配

以 HikariCP（Spring Boot 默认，性能最好的 Java 池之一）为例：

${F}yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20            # 关键：不是越大越好
      minimum-idle: 5
      connection-timeout: 3000         # 从池拿连接的超时（ms），必须小于上游超时
      idle-timeout: 600000             # 空闲连接回收（10 分钟）
      max-lifetime: 1740000            # 连接最大存活 29 分钟 —— 必须小于 DB 的 wait_timeout
      keepalive-time: 300000           # 每 5 分钟探活，防止被中间设备静默断开
      validation-timeout: 3000
      connection-test-query: SELECT 1  # JDBC4 驱动可省
      pool-name: order-db-pool
${F}

**${C}max-lifetime${C} 必须小于 DB 的 ${C}wait_timeout${C}**，否则连接会被服务端单方面断开，而池还认为它可用 —— 表现为随机出现 ${C}Communications link failure${C}。经验值：DB ${C}wait_timeout=1800${C}（30 分钟），池 ${C}max-lifetime=1740000${C}（29 分钟）。

### 四、池大小怎么算：不要凭感觉

推荐用**利特尔法则（Little's Law）**反推：

${F}text
所需连接数 ≈ 并发请求数 × 单请求平均持有时长 / 请求总时长
更实用的经验公式：
  连接数 ≈ CPU核数 × 2 + 磁盘数
例如 8 核 SSD：8 × 2 + 1 = 17，取 20 左右
${F}

**反直觉但正确的结论**：连接池从 20 加到 200，吞吐通常不升反降。因为 DB 侧的并行度受限于 CPU 与 IO，连接数超过临界点后，只是让更多线程排队等锁、等 IO，上下文切换成本上升。

${F}sql
-- 用数据验证池大小是否合理：
-- 若 Threads_running 长期远小于池上限 -> 池开太大了（浪费）
-- 若 Threads_running 经常顶到池上限 -> 要么加池，要么先查是不是慢 SQL 占着连接
SELECT VARIABLE_NAME, VARIABLE_VALUE FROM performance_schema.global_status
WHERE VARIABLE_NAME IN ('Threads_running','Threads_connected','Threads_created');
${F}

### 五、连接泄漏：最难查的一类故障

典型症状：**运行几小时后连接池耗尽，重启即恢复**。

${F}java
// 脆弱写法：任一跳异常就泄漏连接
Connection c = dataSource.getConnection();
Statement s = c.createStatement();
s.execute(u);          // 抛异常 -> close 永远不执行 -> 连接泄漏
c.close();

// 正确写法 1：try-with-resources（编译期保证关闭，逆序释放）
try (Connection c = dataSource.getConnection();
     PreparedStatement ps = c.prepareStatement(SQL)) {
    ps.setLong(1, id);
    ps.executeUpdate();
} catch (SQLException e) {
    log.error("update failed, id={}", id, e);
    throw new BizException(e);
}
${F}

排查泄漏的手段：

${F}sql
-- 看哪些连接长时间不释放（Sleep 且 time 很大）
SELECT id, user, host, db, command, time, state FROM information_schema.PROCESSLIST
WHERE command='Sleep' ORDER BY time DESC LIMIT 20;
-- 若同一个应用主机出现大量 Sleep 连接，基本可判定池泄漏
SELECT SUBSTRING_INDEX(host,':',1) AS ip, COUNT(*) FROM information_schema.PROCESSLIST
GROUP BY ip ORDER BY 2 DESC;
${F}

### 六、中间件的价值与代价

| 方案 | 能力 | 代价 |
|---|---|---|
| 直连 DB | 简单、无额外跳数 | 无法统一治理、故障切换需改配置 |
| ProxySQL | 读写分离、连接复用、查询缓存、限流、防火墙 | 多一跳；需自建高可用 |
| 云数据库代理 | 托管、自动故障切换 | 能力受限、按量计费 |

**ProxySQL 的核心收益是「连接收敛」**：1000 个应用连接收敛成 50 个 DB 连接，DB 侧的线程与内存压力大幅下降。代价是引入新的单点，必须自身做多副本 + Keepalived/VIP。

### 七、常见误区

1. **「池越大并发越高」**。超过临界点后吞吐下降、延迟上升。正确做法是先测「Threads_running 与响应时间曲线」，找到拐点。
2. **「max-lifetime 不用设」**。不设就会撞上 DB 的 ${C}wait_timeout${C} 与防火墙/负载均衡的空闲回收，产生随机连接失效。
3. **「用连接池就不会有连接泄漏」**。池只是容器，占着不还照样耗尽。
4. **「每个请求开一个新连接更简单」**。单次建连成本 + 会话变量初始化可能比查询本身贵十倍，HTTP 短连接 + 无池化是压垮 DB 的常见组合。
5. **「只监控连接数就够」**。${C}Threads_connected${C} 高但 ${C}Threads_running${C} 低只是池开大了；只有 ${C}Threads_running${C} 高才是真的负载压力。

## 七、延伸

- MySQL 8.0 RM → 5.1.8 Server System Variables（max_connections / wait_timeout）
- PostgreSQL → Ch.27 Client Connection Defaults / PgBouncer 文档
- HikariCP Wiki（连接池参数调优指南）
          `
          }
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "对应官方与一线实践资料「Partitioning / Group Replication / Online DDL / Percona Toolkit」等章节：分库分表、高可用容灾、容量压测、在线迁移与一致性校验。",
        chapters: [
          {
            id: "sharding-middleware",
            title: "分库分表与中间件",
            minutes: 42,
            updated: "2026-09-17",
            applies: "MySQL 8.0 + ShardingSphere / Vitess",
            tags: ["分库分表", "ShardingSphere", "分区"],
            terms: ["分库分表", "ShardingSphere", "中间件", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.15 Partitioning](https://dev.mysql.com/doc/refman/8.0/en/partitioning.html) · [ShardingSphere → Concepts](https://shardingsphere.apache.org/document/current/en/concepts/) · [Vitess Concepts](https://vitess.io/docs/) · [Google F1 论文](https://research.google/pubs/pub41344/)（分库分表的鼻祖场景）

## 一、原理与底层机制

先分清三个常被混用的概念：

| 方案 | 谁来做 | 数据仍在一个实例吗 |
|---|---|---|
| **Partitioning（分区）** | MySQL 引擎内置 | 是（单实例内拆文件） |
| **Sharding（分片）** | 中间件 / 应用 | 否（跨实例跨库） |
| **NoSQL** | 换存储 | 否 |

**分区**解决单表文件与查询范围问题：${C}PARTITION BY RANGE${C}（时间序列归档）、${C}HASH${C}（打散热点）。原理是表数据按分区键落到不同物理文件，范围查询可「剪枝」掉无关分区。限制：分区键必须是主键/唯一键的子集、跨分区查询仍单实例、单实例仍有容量上限。

**分片**解决单实例容量与吞吐天花板：数据散到 N 个 MySQL 实例。**先分区后分片**——大多数业务走到分区就够了。

## 二、规范与标准

**分片键选择：几乎不可逆的决策**，好分片键的三个条件：

${F}text
1. 高基数（user_id ✓ / 性别 ✗）
2. 高频查询都带它（带 user_id 查订单 ✓ / 运营全表扫 ✗）
3. 分布均匀（自增取模可以，但热点用户仍可能倾斜）
${F}

主流选择：**user_id 取模 / 一致性哈希**。代价：**跨片查询**（运营后台按订单号查 → 引入异构索引表或 ES）、**扩容再平衡**（取模方案扩容要迁移大量数据 → 用一致性哈希或翻倍扩容法）。

## 三、实战

ShardingSphere 两种形态（官方 Concepts）：

| 形态 | 部署 | 适用 |
|---|---|---|
| **ShardingSphere-JDBC** | 应用内 jar | 性能无代理损耗，Java 技术栈首选 |
| **ShardingSphere-Proxy** | 独立进程 | 语言无关、DBA 直接用 SQL 客户端管理 |

${F}yaml
# ShardingSphere-JDBC 分片配置示例（简化）
rules:
  sharding:
    tables:
      orders:
        actual-data-nodes: ds_\${0..7}.orders_\${0..63}     # 8 库 64 表
        table-strategy:
          standard:
            sharding-column: user_id
            sharding-algorithm-name: orders-mod
    sharding-algorithms:
      orders-mod:
        type: INLINE
        props:
          algorithm-expression: ds_\${user_id % 8}.orders_\${user_id % 8}
${F}

## 四、覆盖广度

**分片后立刻失去的能力（提前想清楚）**：

1. **跨片事务**：XA 太慢，落地是「本地事务 + 消息最终一致」（关联 Java 方向 Saga/Outbox 篇）。
2. **跨片 JOIN**：绑定表（同分片键的表）可以；广播表（小字典表）全片冗余；其他跨片 JOIN 基本要重设计。
3. **全局唯一 ID**：自增主键各片重复 → 雪花算法（Snowflake）或号段模式。
4. **COUNT/SUM 全局聚合**：汇总到中间件内存聚合，或异构到 ClickHouse。

**Vitess 的不同思路**：把分片做在**数据库代理 + VSchema** 层，应用完全无感，且内置 **Resharding** 工作流（在线迁移分片数）。如果你不想让业务代码感知分片，Vitess 或 TiDB（NewSQL，天然分片）是比手搭 ShardingSphere 更工程化的路线。

## 五、常见误区

1. **上来就分 64 库 512 表**：过度设计。分区 + 读写分离 + 归档能撑到远超预期；分片的运维复杂度是数量级上升。
2. **分片键选成时间**：新数据全部打到最新的一个片，热点倾斜；时间只适合做分区键或二级路由。
3. **以为中间件能解决跨片 JOIN**：它只是把 JOIN 拆成多次查询再聚合，性能随片数恶化。数据模型要按分片重新设计。
4. **忘记录入再平衡方案**：取模分片从 8 扩到 16 = 90% 数据要迁移。翻倍扩容法（每片拆两半）能省一半迁移量。
5. **分片键选错再改**：分片键嵌入了所有数据与查询路径，改分片键 = 全量数据迁移 + 全量代码改造，几乎不可逆。

## 六、自检清单

- [ ] 分区/读写分离/归档先做足，分片是最后手段
- [ ] 分片键经过三条件评审，跨片查询路径已设计
- [ ] 全局 ID 方案（雪花/号段）上线且单调趋势验证
- [ ] 绑定表/广播表策略明确成文
- [ ] 扩容再平衡方案（翻倍法/一致性哈希）有演练
- [ ] 跨片事务与跨片聚合方案明确

<!--dd:sharding-middleware-->

## 🔬 深挖：分片的决策模型、路由算法与扩容路径

### 一、先量化「要不要分」

不要凭感觉分片。先算四个硬指标：

| 指标 | 阈值参考 | 说明 |
|---|---|---|
| 单表行数 | > 2000 万~5000 万 | 更关键的是索引深度与 B+Tree 高度 |
| 单表数据量 | > 50~100 GB | 超过后备份/DDL 窗口不可接受 |
| 单库写入 QPS | 接近单实例上限 | 与硬件和事务大小强相关 |
| 备份/DDL 耗时 | > 业务允许的窗口 | 运维成本才是真实的分片触发点 |

**优先尝试的中间手段**（比直接分片便宜得多）：归档冷数据、垂直拆分业务表、读写分离、加缓存、优化索引。分片是最后一张牌，因为它引入了分布式复杂度。

### 二、分片键选择：决定了 80% 的成败

| 分片键 | 优点 | 风险 |
|---|---|---|
| user_id | 用户维度查询天然单分片 | 商家/运营维度查询要广播 |
| order_id | 均匀、写入分散 | 按用户查必须带 user_id 或建映射表 |
| merchant_id | 商家维度聚合快 | 大商家造成**数据倾斜/热点分片** |
| 时间 | 便于按时间归档与删除 | 最新分片必然是写热点 |
| 复合（gen 因子） | 同时满足多维度 | 需要额外维护映射 |

**「基因法」解决 ID 与分片键不匹配**：订单要按 user_id 分片，但列表页按 order_id 查询，于是把 user_id 的低位比特「遗传」给 order_id：

${F}text
order_id 生成时：order_id = (snowflake << 3) | (user_id & 0b111)
路由时：shard = (order_id & 0b111)   -- 直接由 order_id 反推分片，无需额外查询
共享位数 = log2(分片数)，分片数必须是 2 的幂
${F}

### 三、路由算法对比

| 算法 | 扩容影响 | 实现 | 适用 |
|---|---|---|---|
| hash 取模 | **灾难**：几乎全量搬迁 | 最简单 | 分片数固定不再变 |
| range | 只搬迁相邻段 | 简单 | 时间/ID 有序，可预分片 |
| 一致性哈希 | 只影响相邻节点约 1/N | 需虚拟节点 | 缓存类、节点动态增减 |
| 预分片 + 映射表 | 扩容时只改映射 | 需维护元数据 | **生产首选**（如 1024 个逻辑分片映射到 N 个物理库） |

**预分片是唯一「扩容不需搬迁」的设计**：一开始就按 1024 个逻辑分片建表，物理上先放 4 个库、每库 256 张表；未来扩到 8 个库，只需把部分逻辑分片整体迁移 —— 单次迁移量可控、可灰度、可回滚。

### 四、ShardingSphere 配置骨架

${F}yaml
spring:
  shardingsphere:
    datasource:
      names: ds0,ds1
      ds0: { type: HikariDataSource, jdbc-url: jdbc:mysql://db0:3306/order, username: app, password: *** }
      ds1: { type: HikariDataSource, jdbc-url: jdbc:mysql://db1:3306/order, username: app, password: *** }
    rules:
      sharding:
        tables:
          t_order:
            actual-data-nodes: ds$->{0..1}.t_order_$->{0..15}
            database-strategy:                      # 库分片：user_id 后 1 位决定库
              standard:
                sharding-column: user_id
                sharding-algorithm-name: db-inline
            table-strategy:                         # 表分片：user_id 后 4 位决定表
              standard:
                sharding-column: user_id
                sharding-algorithm-name: tbl-inline
        sharding-algorithms:
          db-inline:
            type: INLINE
            props: { algorithm-expression: ds$->{user_id % 2} }
          tbl-inline:
            type: INLINE
            props: { algorithm-expression: t_order_$->{user_id % 16} }
    props:
      sql-show: false
${F}

（配置里 ${C}$->{...}${C} 是 ShardingSphere 的 Groovy 行表达式，**必须写 ${C}$->${C} 转义**，否则会被当成模板变量。）

### 五、跨片查询的四种形态与代价

| 类型 | 例子 | 代价 | 解法 |
|---|---|---|---|
| 聚合 | ${C}COUNT(*)${C} 全量统计 | 广播到所有分片再合并 | 预聚合表 + 定时任务；或走 ES |
| 排序分页 | ${C}ORDER BY created_at LIMIT 100000,20${C} | 各分片取前 N 再归并，深翻页爆炸 | 禁止深翻页；按时间范围约束 |
| JOIN | 订单 JOIN 用户 | 跨库无法直接 JOIN | 冗余字段（把常用用户字段写进订单）；或绑定表（同分片键的表在同一库） |
| 分布式事务 | 跨片转账 | 需 2PC/Seata/TCC | 尽量避免跨片写；用本地消息表 + 最终一致 |

${F}yaml
# 绑定表：分片规则一致的父子表，JOIN 会被下推到单库执行，避免笛卡尔广播
binding-tables:
  - t_order, t_order_item     # 二者都用 order_id 分片，可本地 JOIN
# 广播表：小字典表在每个库都有全量副本，JOIN 无需跨库
broadcast-tables:
  - t_dict, t_region
${F}

### 六、扩容与数据迁移：双写方案

${F}text
目标：从 2 库扩到 4 库，业务不中断、可回滚
阶段 1  双写：写入同时写旧分片（权威）+ 新分片（影子），读仍走旧
阶段 2  存量迁移：按分片分批把历史数据搬到新分片（限速、可暂停）
阶段 3  校验：逐分片比对行数与校验和（pt-table-checksum 思路），差异行修复
阶段 4  灰度读：按用户白名单切读新分片，观察错误率与延迟
阶段 5  全量切读 + 停双写：确认无差异后读全部走新，写入只写新
阶段 6  保留旧分片一段时间（可回滚窗口），之后归档
${F}

关键纪律：**双写必须是「旧库成功才算成功」**（旧库是权威），新库写入失败只记录告警不阻断业务；阶段 5 之前任何时刻都可以停止迁移并回到旧库。

### 七、常见误区

1. **「分片后性能自然变好」**。分片只提升容量与写入并行度；若查询不带分片键，会退化成广播 N 库再归并，**比不分片更慢**。
2. **「用 hash 取模，以后加机器就行」**。取模扩容需要全量搬迁，且搬迁期间的数据一致性极难保证。要么预分片，要么一致性哈希。
3. **「分片后不用考虑全局唯一 ID」**。自增主键在分片后会冲突，必须上雪花 ID/号段模式（数据库号段 + 双 buffer 预取）。
4. **「跨片事务交给中间件就没事」**。2PC 有性能与协调者单点问题，且对业务错误（如超卖）并无帮助；能设计成单分片事务就不要跨片。
5. **「分片键可以随时改」**。改分片键等于全量数据重分布，成本与重新分片同级；上线前必须把分片键和主要查询形态一起评审。

## 七、延伸

- MySQL 8.0 RM → Ch.15 Partitioning（先读通分区限制）
- ShardingSphere → Concepts / Features（分片、弹性伸缩、分布式事务）
- Vitess → Resharding Workflow（在线扩容的参考实现）
          `
          },
          {
            id: "ha-dr",
            title: "高可用与容灾方案",
            minutes: 42,
            updated: "2026-09-17",
            applies: "MySQL 8.0 MGR / Redis Sentinel",
            tags: ["高可用", "容灾", "MGR"],
            terms: ["高可用", "容灾", "MGR", "主从"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.20 Group Replication](https://dev.mysql.com/doc/refman/8.0/en/group-replication.html) · [MySQL 8.0 RM → Ch.21 InnoDB Cluster](https://dev.mysql.com/doc/refman/8.0/en/mysql-innodb-cluster-introduction.html) · [redis.io → Replication / Sentinel / Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) · [Google SRE Workbook → Ch.5 Eliminating Toil](https://sre.google/workbook/eliminating-toil/)

## 一、原理与底层机制

高可用的度量本质是**用成本换 RTO/RPO**：

${F}text
可用性 A = MTBF / (MTBF + MTTR)
RTO（Recovery Time Objective）：故障后多久恢复服务
RPO（Recovery Point Objective）：最多丢多少数据（时间度量）
${F}

方案选型本质：异步复制便宜但 RPO>0（可能丢数据），同步复制 RPO=0 但写延迟与吞吐上升。理解这个权衡，才能对业务解释「为什么这个库用 MGR 而那个库用异步」。

**MGR 核心机制**（官方 Ch.20）：事务提交经 Paxos 广播到多数派成员 → 多数派 prepare → 提交。读任意成员可读（注意读旧数据问题）；写必须写入多数派 → 少数派分区自动只读；故障检测成员 5s 无响应剔除。

## 二、规范与标准

MySQL 高可用方案光谱：

| 方案 | 原理 | RPO | 适用 |
|---|---|---|---|
| 异步复制 + 手动切换 | binlog 重放 | >0 | 非核心、读扩展 |
| 半同步 + MHA | 选主脚本 | ≈0（半同步不丢） | 传统虚拟机时代主流 |
| **Group Replication (MGR)** | Paxos 多数派提交 | =0（多数派） | 官方新一代方案 |
| **InnoDB Cluster** | MGR + Router + Shell | =0 | 官方全家桶，推荐起点 |
| 云 RDS 多可用区 | 云厂商托管 | =0 | 云上直接用 |

MGR 约束：仅 InnoDB、每表必须有主键、集群 ≤ 9 节点；两种模式——单主模式（推荐）与多主模式（写冲突高发，慎用）。

## 三、实战

最小可用集群配置（每节点）：

${F}sql
plugin_load_add = 'group_replication.so'
group_replication_group_name = 'UUID'
group_replication_single_primary_mode = ON
group_replication_enforce_update_everywhere_checks = OFF
${F}

**InnoDB Cluster** = MGR（存储层）+ MySQL Router（应用接入，自动感知主库）+ AdminAPI（一键部署）。比 MGR 原生方案多的是**接入层自动化**——手工改连接串是切换慢的元凶。

Redis 高可用三级（redis.io 官方文档）：

| 方案 | 原理 | 切换 |
|---|---|---|
| 主从复制 | replicaof，异步 | 手动 |
| **Sentinel** | 3+ 节点哨兵探测，自动选主 | 自动（客户端走 Sentinel 发现） |
| **Cluster** | 16384 slot 分片 + 主从自动迁移 | 自动 |

## 四、覆盖广度

**容灾：两地三中心与演练**：

- **同机房**：防单机故障（MGR/半同步即可）。
- **同城两机房**：延迟 < 2ms，半同步跨机房可行，RPO=0。
- **异地（两地三中心）**：延迟大，只能异步复制 / binlog 归档，RPO>0（分钟级）。数据走「异步灾备 + 关键业务降级预案」。

SRE 纪律（Workbook Ch.5）：**故障切换必须自动化 + 定期演练**。人肉切换的 MTTR 以小时计，自动化以秒计；每季度一次「拔网线演习」。Redis 的 Sentinel 至少 3 节点跨机器部署（奇数防脑裂）；Cluster 每个主节点至少配 1 从。

## 五、常见误区

1. **从库 = 高可用**：异步复制的数据可能落后，直接提升从库可能丢最后几秒数据。核心库用 MGR/半同步。
2. **MGR 三节点当万能**：多数派要求 2/3 存活，同机房三节点在机房级故障下全部失效——跨机房部署才真容灾。
3. **脑裂认知缺失**：网络分区时两「主」并存，双写数据分叉。仲裁（third-party / 多数派）与 STONITH 机制是防线。
4. **只演练正常切换，不演练「带病切换」**：真故障时主库不是干净下线，而是假死/半死。演练脚本必须包含「主库 hang 住」场景。
5. **忘了接入层自动化**：只做存储层高可用，切换后应用连接串没改，RTO 被拉到分钟级甚至小时级。

## 六、自检清单

- [ ] 方案有明确的 RTO/RPO 承诺并写入文档
- [ ] 接入层（Router/Proxy/VIP）自动感知主库切换
- [ ] 每季度真实故障演练（拔电源/拔网线/hang 住三种）
- [ ] 异地灾备链路监控（复制延迟、binlog 积压）
- [ ] 切换 Runbook 有图文步骤，新人可照做
- [ ] MGR/Redis 集群节点跨故障域部署

<!--dd:ha-dr-->

## 🔬 深挖：可用性量化、故障域与切换的工程细节

### 一、把「高可用」换算成数字

| 可用性 | 年停机 | 月停机 | 典型架构代价 |
|---|---|---|---|
| 99% | 3.65 天 | 7.2 小时 | 单机 + 定期备份 |
| 99.9% | 8.76 小时 | 43.2 分钟 | 主从 + 自动切换 |
| 99.95% | 4.38 小时 | 21.6 分钟 | 半同步 + 多副本 + 演练 |
| 99.99% | 52.6 分钟 | 4.3 分钟 | 同城双活 + 秒级切换 |
| 99.999% | 5.26 分钟 | 26 秒 | 异地多活 + 全链路容灾 |

**关键认知**：每提升一个 9，成本大致翻一个数量级。所以第一步不是「上多活」，而是**把 RTO/RPO 与业务对齐**：财务报表可以容忍 5 分钟 RTO 吗？支付链路可以容忍丢 1 秒数据吗？答案不同，架构选择完全不同。

### 二、故障域：从内到外逐层设防

| 层级 | 故障 | 缓解手段 |
|---|---|---|
| 进程 | mysqld crash、OOM | 自动拉起、MHA/orchestrator、健康检查 |
| 主机 | 磁盘坏、网卡故障、内核 panic | 主从切换、VIP 漂移 |
| 机架 | 交换机断电 | 副本跨机架 |
| 机房 | 断电、光缆中断 | 同城双机房、半同步到异地 |
| 地域 | 区域性灾害 | 异地备份、异地只读、多活 |

**一个常见的设计缺陷**：主库与所有从库在同一机柜 —— 机柜断电，整个集群一起没。副本的物理分布必须与故障域对齐。

### 三、切换：最难的不是切，是「不脑裂」

脑裂的本质是**两个节点都认为自己是主库**，都接受写入，导致数据分叉。

${F}text
脑裂的典型触发链：
  1) 主库与从库之间网络抖动（主库本身没死）
  2) 仲裁/探活误判主库下线
  3) 从库提升为新主库，开始接受写入
  4) 网络恢复，旧主库也有新写入 —— 两份互不相容的历史
${F}

防脑裂的三道闸门：

${F}sql
-- 闸门 1：旧主库自我隔离（fencing）。半同步下旧主库因等不到 ACK 而阻塞写入
SET GLOBAL rpl_semi_sync_source_timeout = 1000;   -- 1 秒无 ACK 退化为异步（可调大以提高一致性）
-- 更彻底：检测到异常时主动 SET GLOBAL super_read_only = ON 或直接重启
SET GLOBAL read_only = ON;
SET GLOBAL super_read_only = ON;   -- 连 SUPER 用户也只能读，防止人工误写

-- 闸门 2：切换必须由具备仲裁的组件执行，而不是各节点自决
--   主流的 orchestrator / MHA / 云 RDS 都由中心控制面探测并执行
-- 闸门 3：切换后强制校验数据位点，差异过大就拒绝提升
SHOW REPLICA STATUS\\G   -- 检查 Replica_SQL_Running_State 与已执行的 GTID 集合
${F}

### 四、切换流程：把操作写成可执行的剧本

${F}text
【计划内切换（如变更、缩容）】
 1) 选目标从库，确认延迟为 0（WAIT_FOR_EXECUTED_GTID_SET 追平）
 2) 应用侧摘流量（读流量先摘，写流量暂停或进入队列）
 3) 从库 SET read_only=OFF / super_read_only=OFF，提升为主
 4) 其余从库重新指向新主（GTID 模式下 CHANGE REPLICATION SOURCE TO ... SOURCE_AUTO_POSITION=1）
 5) 应用切换连接串 / VIP 漂移 / 中间件改路由
 6) 校验：新主可写、从库复制正常、业务回归
 7) 旧主降级为从库，重新加入复制集群

【故障切换（自动）】
 1) 探活失败连续 N 次（避免误判，通常 3 次 / 间隔 1~3 秒）
 2) 挑选数据最新的从库（比较 GTID/Exec_Master_Log_Pos）
 3) fencing 旧主（关掉写入能力或强制重启）
 4) 提升 + 重定向 + 告警
 5) 人工介入恢复旧主、检查数据差异
${F}

**「挑选数据最新的从库」是核心**：不能按顺序挑第一个，也不能随机挑。GTID 模式下比较 ${C}gtid_executed${C} 的包含关系；位点模式下比较 ${C}Read_Master_Log_Pos${C} 与 ${C}Relay_Master_Log_File${C}。

### 五、容灾演练：唯一的验收方式

${F}text
演练清单（每季度至少一次）：
  [ ] 单副本 kill -9：验证自动切换是否在 RTO 内完成
  [ ] 模拟网络分区（iptables DROP 掉主从端口）：验证不脑裂
  [ ] 主库磁盘满：验证告警是否触发、是否有只读兜底
  [ ] 误删表：验证 PITR 能否恢复到指定时间点，实测 RTO
  [ ] 机房断电演练：验证异地副本可用性与数据差异
  [ ] 记录每次演练的真实 RTO/RPO，与承诺值对照并写进报告
${F}

**演练必须做「能改数据的真操作」**，只走流程不实际切换的演练毫无价值 —— 真正的坑永远在「应用连不上新主」「账号权限没同步」「DNS 缓存没刷新」这些环节。

### 六、常见误区

1. **「有主从就是高可用」**。没有自动探活与切换，主库挂了就是纯人工介入，RTO 以小时计。
2. **「半同步就万无一失」**。${C}rpl_semi_sync_source_timeout${C} 一超时就退化为异步，此时主库挂掉仍会丢数据。要更高保证需要 MGR（多数派提交）。
3. **「切完就没事了」**。应用连接池里全是旧连接、缓存里的路由映射过期、DNS TTL 未生效 —— 这些「切换后的次生故障」往往比切换本身造成更长的停机。
4. **「多活就是到处都能写」**。多地域双写会带来写冲突（同一主键两边都改），必须有冲突解决策略（如按地域分片、最后写入获胜、业务层冲突合并）。没有策略的多活等于制造数据事故。
5. **「容灾机房平时不用管」**。长期不验证的容灾环境，一定会在真用时发现复制断了、磁盘满了、版本不一致。

## 七、延伸

- MySQL 8.0 RM → Ch.20 Group Replication / Ch.21 InnoDB Cluster / Ch.19.7 Switching Sources and Replicas（failover 流程）
- redis.io → Sentinel Documentation / Cluster Tutorial
- Google SRE Book → Ch.6 Distributed System Scheduling（故障域思维）
          `
          },
          {
            id: "capacity-bench",
            title: "容量规划与压测",
            minutes: 38,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis",
            tags: ["容量", "压测", "sysbench"],
            terms: ["容量", "压测", "规划", "性能"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.8 Optimization](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)（8.12 Measuring Performance / 8.12.2 Using Sysbench）· [Percona → Sysbench MySQL](https://www.percona.com/blog/using-sysbench-with-mysql/) · [Google SRE Book → Ch.4 SLO](https://sre.google/sre-book/service-level-objectives/) · [USE Method](http://www.brendangregg.com/usemethod.html)

## 一、原理与底层机制

容量规划不是拍数字，而是回答四个问题（SRE 口径）：

${F}text
1. 什么资源会先到顶？（CPU / 内存 / IO / 连接数 / Buffer Pool）
2. 现在离到顶还有多久？（按增长曲线外推）
3. 到顶前要做什么？（扩容 / 优化 / 降级）
4. 到顶时系统怎么死？（雪崩还是优雅降级）
${F}

MySQL 的资源画像：**OLTP 先顶内存（Buffer Pool）与连接数，批量报表先顶 IO**。理解「哪个资源先到顶」决定了扩容方向——加内存还是加磁盘还是加只读副本。

## 二、规范与标准

**Buffer Pool 与内存规划**（官方 Ch.17 InnoDB）：专用 MySQL 服务器，物理内存的 60~75% 给 Buffer Pool；容量指标是**热数据集能否装进 Buffer Pool**，装不进则大量磁盘随机读，QPS 天花板断崖。

${F}ini
innodb_buffer_pool_size = 24G     # 32G 机器示例
innodb_buffer_pool_instances = 8
innodb_log_file_size = 2G         # redo 大小影响写入吞吐
${F}

评估：${C}Innodb_buffer_pool_reads${C}（物理读）对比 ${C}Innodb_buffer_pool_read_requests${C}（逻辑读），命中率 < 99% 警戒。

## 三、实战

sysbench（官方 8.12.2 指定）压测：

${F}bash
# 准备：8 张 100 万行表
sysbench /usr/share/sysbench/oltp_common.lua \\
  --mysql-host=10.0.0.11 --mysql-user=bench --mysql-password=... \\
  --mysql-db=bench --tables=8 --table-size=1000000 prepare

# 混合读写压测（压出真实容量）
sysbench /usr/share/sysbench/oltp_read_write.lua \\
  --mysql-host=10.0.0.11 ... \\
  --threads=64 --time=600 --report-interval=10 run

# 结果关键字段：transactions (QPS) / latency (P95) / errors
${F}

压测纪律：① **梯度加压**（16→32→64→128 线程）找 QPS 拐点；② **数据量对齐生产**（空表压测无意义）；③ 只读和读写分开压。

## 四、覆盖广度

**USE 方法**：对每个资源问三问（Utilization / Saturation / Errors）：

${F}bash
CPU    : vmstat 1（us 高 = SQL 吃 CPU；wa 高 = IO 等待）
内存   : free -m + sar -B（swap in/out > 0 = 已饱和）
磁盘   : iostat -x 1（%util 接近 100 = 饱和；await > 10ms = 慢盘）
网络   : sar -n DEV（带宽 + retrans 重传）
连接   : SHOW STATUS LIKE 'Threads_%'（Threads_running 飙升 = 突发并发）
${F}

容量红线参考值：

| 指标 | 黄线 | 红线 |
|---|---|---|
| CPU 使用率（5min 均值） | 60% | 80% |
| Buffer Pool 命中率 | 99% | 98% |
| 磁盘空间 | 70% | 85%（预留 binlog 膨胀） |
| Threads_running | 核数×2 | 核数×4 |
| 慢查询数/分钟 | 环比 +50% | 基线×3 |

## 五、常见误区

1. **压测环境与生产配置不同档**：本地 NVMe 压出的数字对云端 SATA 盘毫无参考。配置差异（CPU 型号 / 磁盘类型 / 网络）逐一记录。
2. **只压一次不建基线**：容量是过程量——每次大促前复压，与基线对比退化。
3. **不压「故障态」**：主库宕机切从后，从库容量是否扛得住全量流量？这是最真实的容量考验。
4. **把峰值当稳态**：促销日 5 倍流量持续 4 小时 ≠ 全年可承受 5 倍；配合降级预案（关闭非核心写入）一起设计。
5. **只看 QPS 不看延迟**：QPS 高但 P99 暴涨，用户体验已崩。容量评估必须同时看吞吐与长尾延迟。

## 六、自检清单

- [ ] sysbench 基线建立，QPS 拐点已知并成档
- [ ] Buffer Pool 命中率 / Threads_running / 磁盘有红线告警
- [ ] 数据增长模型（月增量）与到顶时间有外推表
- [ ] 大促前复压并演练故障态容量
- [ ] 降级预案（非核心功能开关）与容量一起设计
- [ ] 压测环境与生产配置差异已记录

<!--dd:capacity-bench-->

## 🔬 深挖：从业务指标到资源水位的容量推演

### 一、容量规划的四步推导链

${F}text
第一步：业务量  ->  DAU、订单量、峰值倍数（通常按日均峰值的 3~5 倍预留）
第二步：访问量  ->  QPS/TPS = 业务量 × 每单请求数 / 时间窗口 × 峰值系数
第三步：资源量  ->  CPU 核数、内存、IOPS、连接数、存储容量
第四步：安全水位 ->  每项资源留出余量（见下表），并设定扩容触发线
${F}

**最容易错的是第二步**：一个下单动作可能对应 20 次 DB 访问（查库存、查优惠、插订单、插明细、更新账户……），按「订单 QPS」算资源会低估一个数量级。必须从**慢日志/监控里拿到真实的 SQL 调用量**。

${F}sql
-- 用原生统计拿到真实的语句调用量排行（比估算可靠）
SELECT DIGEST_TEXT, COUNT_STAR,
       ROUND(SUM_TIMER_WAIT/1e9,1) AS total_ms,
       ROUND(AVG_TIMER_WAIT/1e6,3) AS avg_ms,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
ORDER BY COUNT_STAR DESC LIMIT 20;
-- COUNT_STAR 就是调用次数，可直接换算成 QPS 与资源占用
${F}

### 二、必须盯住的指标与安全水位

| 类别 | 指标 | 安全水位 | 超线后果 |
|---|---|---|---|
| CPU | 使用率 | < 70%（突发可上 80%） | 出现排队，延迟非线性上升 |
| 内存 | 缓冲池命中率 | > 99% | 命中率下降直接变成随机 IO |
| 内存 | 缓冲池占用 / 物理内存 | ≤ 70%（留 OS 与连接开销） | OOM Killer 杀进程 |
| 磁盘 | 使用率 | < 80% | 写满即不可用；且膨胀风险 |
| 磁盘 | IOPS / 吞吐余量 | < 70% 上限 | 双十一类峰值写不进去 |
| 磁盘 | 单次 fsync 延迟 | < 5ms（SSD） | 提交延迟直接传导到业务 |
| 连接 | Threads_connected / max_connections | < 60% | 撞上限即拒绝服务 |
| 连接 | Threads_running | 与 CPU 核数同量级 | 大量线程争抢，上下文切换 |
| 复制 | 从库延迟 | < 1s（或按业务容忍度） | 读到旧数据 |
| 事务 | 长事务数量 | 0（>60s 视为异常） | undo 膨胀、锁堆积、DDL 阻塞 |

${F}sql
-- 一次性采集核心水位（可直接喂给监控系统）
SELECT
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_connected') AS conn,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_running')  AS running,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_read_requests') AS bp_req,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_reads')          AS bp_disk,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_row_lock_waits')             AS lock_waits,
  (SELECT COUNT(*) FROM information_schema.INNODB_TRX WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 60)             AS long_trx;
-- 缓冲池命中率 = 1 - bp_disk / bp_req，低于 0.99 就要关注
${F}

### 三、压测工具选型

| 工具 | 特点 | 适用 |
|---|---|---|
| sysbench | 轻量、参数直观、OLTP 脚本成熟 | 单机基准、回归对比（首选） |
| mysqlslap | MySQL 自带，无需安装 | 快速冒烟 |
| HammerDB | TPROC-C（类 TPC-C）标准负载 | 复杂事务模型、选型对比 |
| go-tpc | 支持 TPC-C/TPC-H，可分布式 | 大规模、分布式压测 |
| 应用层压测（JMeter/wrk/k6） | 贴近真实业务链路 | 端到端验证 |

${F}bash
# sysbench 标准三步：prepare -> run -> cleanup
sysbench oltp_read_write \\
  --mysql-host=127.0.0.1 --mysql-user=bench --mysql-password=*** \\
  --mysql-db=bench --tables=16 --table-size=2000000 \\
  --threads=32 --time=300 --report-interval=10 \\
  --rand-type=zipfian \\
  prepare

sysbench oltp_read_write \\
  --mysql-host=127.0.0.1 --mysql-user=bench --mysql-password=*** \\
  --mysql-db=bench --tables=16 --table-size=2000000 \\
  --threads=32 --time=300 --report-interval=10 --rand-type=zipfian \\
  run

sysbench oltp_read_write --mysql-db=bench cleanup
${F}

**${C}--rand-type=zipfian${C} 不能省**：均匀分布（uniform）会让索引访问过于平均，压不出真实的热点效应；线上访问几乎总是幂律分布，zipfian 更接近现实。

### 四、压测的正确姿势（八条纪律）

${F}text
1) 数据量要与线上同量级：空表的 8 万 TPS 毫无参考价值（索引全在内存、无回表成本）
2) 并发要梯度递增：32 -> 64 -> 128 -> 256，找到吞吐拐点与延迟拐点
3) 压测机不能成为瓶颈：压测客户端 CPU、网络、连接数都要监控
4) 观察点要全：不只 QPS/TPS，还要看 p99、Threads_running、缓冲池命中、磁盘 await
5) 预热：冷启动的第一次访问会读磁盘，先跑 1~2 分钟预热再统计
6) 压测环境要与生产同规格：CPU 核数、磁盘类型（SSD vs HDD）差异会改变结论的数量级
7) 只压 DB 不等于压业务：中间件、连接池、网络 RTT 都在链路里
8) 记录基线：把每次压测结果存档，作为后续版本与配置变更的对比基准
${F}

### 五、从压测结果读出容量结论

${F}text
典型输出解读：
  threads=32   TPS=8200   p99=12ms    <- 线性区
  threads=64   TPS=15400  p99=18ms    <- 接近线性
  threads=128  TPS=17200  p99=95ms    <- 吞吐趋平，延迟上升 -> 拐点
  threads=256  TPS=16900  p99=340ms   <- 吞吐下降，延迟暴涨 -> 已过饱和
结论：该实例的安全工作区间是 64 并发上下，容量上限约 17000 TPS，
      按 70% 水位预留 -> 生产长期承载 12000 TPS，超过即扩容或限流
${F}

**只看 TPS 峰值是危险的**：TPS 从 17200 到 16900 看似只降 2%，但 p99 从 95ms 涨到 340ms —— 用户体验已经崩了。容量结论必须以「延迟可接受时的最大吞吐」为准。

### 六、常见误区

1. **「按 CPU 使用率扩容」**。CPU 不到 50% 但磁盘 IOPS 打满、连接数撞顶、从库延迟破表的情况很常见。容量是**多资源的短板**，不是单项。
2. **「压测一次就够」**。数据分布、索引、SQL 都在变；容量基线要定期（如每季度）重测。
3. **「平均延迟达标就行」**。p99 才是用户感知；均值会被大量快请求稀释。
4. **「扩容就能解决」**。若是慢 SQL 或缺索引导致饱和，扩容只是把问题推迟，且成本线性增长。先做 SQL 治理，再加容量。
5. **「sysbench 分数高就代表业务能扛」**。sysbench 是简单点查/点更新，不含业务 JOIN、大事务、跨表写；业务压测必须用真实 SQL 或真实链路。

## 七、延伸

- MySQL 8.0 RM → 8.12 Measuring Performance / 8.12.2 Using Sysbench
- Google SRE Book → Ch.4 Service Level Objectives（容量规划与 SLO 的关系）
- Brendan Gregg → USE Method（系统资源排查方法论）
          `
          },
          {
            id: "migration-doublewrite",
            title: "数据迁移与双写",
            minutes: 44,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / gh-ost / Canal",
            tags: ["迁移", "双写", "Online DDL"],
            terms: ["迁移", "双写", "数据", "一致性"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 15.12 Online DDL](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl.html) · [gh-ost](https://github.com/github/gh-ost) · [pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html) · [Alibaba Canal](https://github.com/alibaba/canal)（binlog 异构迁移）

## 一、原理与底层机制

先分清两类「迁移」，二者原理完全不同：

| 场景 | 问题本质 | 工具 |
|---|---|---|
| **表结构变更**（加列/改索引） | 大表 DDL 锁表 | Online DDL / gh-ost / pt-osc |
| **跨库跨实例搬迁** | 数据量大 + 不可停服 | 全量 + 增量 binlog + 双写切换 |

**Online DDL 的底层**：8.0 的 ALGORITHM=INPLACE 允许在变更索引/列时继续接受 DML，其原理是「边建新结构边把增量变更同步过去」，最后原子切换。但 COPY 类操作（改列类型、改字符集）无法 INPLACE，只能锁写。

**影子表方案（gh-ost/pt-osc）**：建影子表（新结构）→ 分批拷贝存量 → 通过 binlog 捕获增量同步到影子表 → 原子 RENAME 切换 → 删除旧表。gh-ost 的核心优势是**可暂停、可限流、不使用触发器**（pt-osc 用触发器，对写放大明显）。

## 二、规范与标准

Online DDL 能力矩阵（官方 15.12）：

- **加列**：INSTANT（8.0.12+，秒级，只改元数据）✅
- **加索引**：INPLACE，允许 DML ✅
- **改列类型**：只能 COPY（锁写）❌
- **改字符集**：COPY ❌

规范：所有 DDL 显式声明 ${C}ALGORITHM${C} 与 ${C}LOCK${C}，宁可报错也不意外锁表。

${F}sql
ALTER TABLE orders ADD COLUMN remark VARCHAR(255) DEFAULT '',
  ALGORITHM=INSTANT;
ALTER TABLE orders ADD INDEX idx_status (status),
  ALGORITHM=INPLACE, LOCK=NONE;
${F}

## 三、实战

跨实例迁移：全量 + 增量 + 双写切换七阶段：

${F}text
阶段① 全量迁移     : 快照导出导入（mysqldump / XtraBackup / DTS）
阶段② 增量同步     : binlog CDC（Canal/Debezium）追平
阶段③ 双写         : 应用同时写新旧库，以旧库为准
阶段④ 一致性校验   : pt-table-checksum 比对（下一篇）
阶段⑤ 灰度切读     : 按比例把读流量切到新库，比对结果
阶段⑥ 切写         : 新库为准，旧库降为只读
阶段⑦ 下线旧库     : 观察一个业务周期后回收
${F}

双写实现要点：先写旧库成功，再写新库（新库失败仅告警不影响主流程）；CDC 重放可能重复，目标端按主键 UPSERT 保证幂等；两库写不追求分布式事务，靠「以谁为准 + 对账修复」收敛。

## 四、覆盖广度

COPY 类操作在亿级表上 = 数小时锁写，此时用 **gh-ost / pt-osc**（影子表方案）：

${F}bash
# gh-ost 示例（可暂停、可限流，不使用触发器）
gh-ost \\
  --table=orders --database=shop \\
  --alter="ADD COLUMN remark VARCHAR(255) DEFAULT ''" \\
  --allow-on-master \\
  --max-load=Threads_running=50 \\
  --critical-load=Threads_running=100 \\
  --throttle-control-replicas='10.0.0.12,10.0.0.13' \\
  --execute
${F}

边界：迁移 Runbook 必须含回滚方案（新库异常 → 切回旧库，旧库在双写期数据完整）；灰度切读必须比对结果；切回旧库前确认旧库还能重新开放写入（演练过才算有回滚）。

## 五、常见误区

1. **直接 ALTER 亿级大表**：COPY 类 DDL 锁写数小时；先看 15.12 表格确认 ALGORITHM，再决定是否上 gh-ost。
2. **双写期间旧库还能直连变更**：双写期「以旧为准」的窗口内，任何绕过双写入口的写入都会造成分叉。冻结期明确到表级。
3. **切读不做比对**：读流量切过去不看结果对不对，等于裸奔。灰度期抽样比对响应数据。
4. **回滚方案只写在文档里没演练过**：切回旧库时旧库已只读数小时，能否秒级重新开放写入？演练过才算有回滚。
5. **gh-ost 不限流直接跑**：大表变更在高峰期跑仍会推高主库负载，必须配 ${C}--max-load${C} / ${C}--critical-load${C} 限流与熔断。

## 六、自检清单

- [ ] 所有 DDL 明确 ALGORITHM 与 LOCK 策略
- [ ] 大表结构变更有 gh-ost/pt-osc 操作记录（含限流参数）
- [ ] 迁移按七阶段推进，每阶段有验收标准
- [ ] 双写顺序与幂等设计成文
- [ ] 回滚方案演练过，旧库可秒级重新开放写入
- [ ] 灰度切读有结果比对与观察指标

<!--dd:migration-doublewrite-->

## 🔬 深挖：迁移六阶段与双写的失败处理

### 一、迁移的六个阶段与退出条件

| 阶段 | 动作 | 退出条件（不满足不放行） |
|---|---|---|
| 1 评估 | 数据量、表结构、依赖、SQL 兼容性盘点 | 有不兼容项已列清单并有对策 |
| 2 准备 | 新库建表、账号权限、网络连通、监控就位 | 新库可读写、监控可见 |
| 3 存量迁移 | 分批搬迁历史数据（限速、可暂停） | 行数与校验和一致 |
| 4 增量同步 | binlog 订阅/触发器/Canal 追平 | 延迟稳定在秒级以内 |
| 5 双写 + 灰度读 | 写入双写，按白名单切读 | 差异率 0，延迟与错误率达标 |
| 6 切流 | 读全量切新，写入以新库为权威 | 观察期无异常，旧库可下线 |

**每个阶段都必须可回滚**，这是迁移方案评审的核心问题：「做到第 3 阶段发现不对，怎么退回？」

### 二、存量迁移：按主键分块 + 限速

${F}bash
# 反例：一条语句搬完，会长时间锁表、打满 IO、产生巨大 binlog
INSERT INTO newdb.t SELECT * FROM olddb.t;

# 正确：按主键范围分块，每块独立事务，块间限速
# 用 pt-archiver 可自动化（支持 --limit、--sleep、--max-lag）
pt-archiver --source h=old_host,D=olddb,t=orders \\
  --dest h=new_host,D=newdb,t=orders \\
  --where "created_at < '2026-01-01'" \\
  --limit 2000 --sleep 0.3 --max-lag 2 \\
  --bulk-insert --no-delete --progress 10000
${F}

${F}sql
-- 或者自建分块搬运（更可控，便于断点续跑）
-- 每批按主键区间 [lo, hi] 搬运
INSERT INTO newdb.t (id, c1, c2)
SELECT id, c1, c2 FROM olddb.t
WHERE id >= 1000000 AND id < 1020000
ON DUPLICATE KEY UPDATE c1 = VALUES(c1), c2 = VALUES(c2);
-- ON DUPLICATE KEY 保证幂等：重跑同一批次不会产生重复行
-- 记录每批已完成的 hi 值，故障后可精确断点续跑
${F}

**在从库做存量搬迁**能避免影响主库写入；若必须从主库读，务必限速并监控主库的 IO 与从库延迟。

### 三、增量同步方案对比

| 方案 | 原理 | 延迟 | 对源库影响 | 适用 |
|---|---|---|---|---|
| Canal | 伪装从库拉 binlog | 秒级 | 小（一个 dump 连接） | 自建、可控 |
| 云 DTS | 托管 binlog 订阅 + 迁移 | 秒级 | 小 | 上云迁移、省人力 |
| 触发器 | 在源表上写触发器同步 | 毫秒 | **大**（每个写都多一次同步写） | 低写入量、老版本无 binlog 订阅 |
| 双写（应用层） | 业务代码同时写两边 | 毫秒 | 中（多一次写 + 失败处理） | 应用可改、需要精确控制 |

**触发器是最后手段**：它会把源库写入延迟放大、与业务自身的触发器冲突，且源库为 MyISAM 时不可用。能用 binlog 就别用触发器。

### 四、双写的正确姿势：旧库权威 + 单项幂等

${F}java
// 核心原则：旧库是权威，旧库成功才算成功；新库失败只告警不阻断
public void saveOrder(Order o) {
    // 1) 先写旧库（权威）
    oldOrderMapper.insert(o);

    // 2) 再写新库，失败不影响主流程，但必须留痕以便补偿
    try {
        newOrderMapper.insert(o);
    } catch (Exception e) {
        // 关键：记录到补偿表，由后台任务重试，绝不可只打日志
        compensationMapper.save(Compensation.of("order", o.getId(), e.getMessage()));
        log.error("double-write failed, orderId={}", o.getId(), e);
    }
}
${F}

双写要处理的五种异常：

${F}text
1) 新库写失败      -> 落补偿表，后台重试（幂等）
2) 新库写超时      -> 可能已写入成功（超时不等于失败）-> 重试必须幂等
3) 部分字段不一致  -> 字段映射/默认值/类型转换要单测覆盖
4) 自增主键冲突    -> 新库不要用自增，统一写入业务主键（雪花 ID）
5) 旧库回滚新库已提交 -> 反向补偿：按业务主键删除新库对应行
${F}

**「超时不等于失败」是双写最容易被忽略的一点**。若重试不具备幂等性（如自增计数、追加日志），会直接造成数据翻倍。所以双写的每次重试都必须用「业务主键 + 覆盖写」或「条件更新」。

### 五、数据校验：从抽样到全量

| 层次 | 方法 | 成本 | 能发现的问题 |
|---|---|---|---|
| L1 行数 | ${C}SELECT COUNT(*)${C} 比对 | 低 | 漏搬、重复 |
| L2 聚合 | 分块 ${C}SUM/COUNT${C} 比对 | 低 | 部分字段不一致 |
| L3 内容 | ${C}CHECKSUM TABLE${C} / 逐行比对 | 中 | 任意字段差异 |
| L4 全字段 | 按主键抽样 N 万行做全字段 diff | 高 | 类型/精度/字符集差异 |
| L5 双写期 | 实时比对（写入时对称读取校验） | 高 | 双写逻辑缺陷 |

${F}sql
-- L2：分块聚合比对，快速定位差异区间（比全表 CHECKSUM 更快收敛）
SELECT FLOOR(id/100000) AS blk, COUNT(*) c, SUM(CRC32(CONCAT_WS('#', id, status, amount))) s
FROM t GROUP BY blk ORDER BY blk;
-- 两个库各跑一次，diff 输出文件即可定位到具体块，再对该块做逐行比对
${F}

${F}bash
# pt-table-checksum 用于主从一致性（也适用于两个结构相同的库，通过 --databases 指定）
pt-table-checksum --host=... --databases=appdb --tables=orders \\
  --chunk-size=1000 --max-load="Threads_running=30" --replicate=percona.checksums
# 差异行同步（先 --dry-run 查看，再实跑）
pt-table-sync --replicate=percona.checksums --print h=... D=appdb t=orders
${F}

### 六、切流与回滚

${F}text
切流顺序（降低风险）：
  1) 只读流量：按用户/租户白名单 -> 1% -> 10% -> 50% -> 100%
  2) 写流量：必须在新库完全追平且校验通过后才能切
  3) 切写后旧库进入只读（保留可回滚窗口，通常 1~7 天）
  4) 观察期内随时可回滚：把读切回旧库（旧库仍在同步，数据不丢）

回滚的前提条件（必须提前准备）：
  - 旧库保持双向同步或至少保持可写（否则新库期间产生的数据无法回到旧库）
  - 补偿表清空/对账无差异
  - 回滚脚本已演练过，且知道确切的回滚时间点
${F}

**最危险的状态是「停掉旧库同步但还在双写」**：此时旧库落后、新库有增量，一旦想回滚就要做反向数据补齐，成本极高。要么保持双向同步，要么早点决定不回头。

### 七、常见误区

1. **「迁移就是导数据」**。真正的难点是增量追平、双向一致性与回滚能力。
2. **「双写足够了，不用增量同步」**。双写只能保证双写开始之后的数据；存量与双写期间的间隙必须靠增量同步或批量补齐。
3. **「新库沿用自增主键」**。两边各自自增会产生主键冲突与语义漂移，异构迁移应统一使用业务主键或雪花 ID。
4. **「校验行数一致就放心了」**。行数一致但字段值不一致（精度截断、字符集转换、时区偏移）极其常见，必须做到 L3 以上。
5. **「一次迁移做完就删旧库」**。旧库是最后的回滚手段，保留期应由业务与合规共同确定，通常不少于一个完整账期。

## 七、延伸

- MySQL 8.0 RM → 15.12 InnoDB Online DDL Operations（ALGORITHM 能力矩阵）
- gh-ost README（设计理念与可暂停性）
- Debezium Documentation（开源 CDC 生态，跨库通用）
          `
          },
          {
            id: "consistency-check",
            title: "数据一致性校验",
            minutes: 36,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Percona Toolkit",
            tags: ["一致性", "对账", "校验"],
            terms: ["一致性", "校验", "对账", "数据"],
            body: `
> **官方文档基线**：[Percona Toolkit → pt-table-checksum](https://docs.percona.com/percona-toolkit/pt-table-checksum.html) · [pt-table-sync](https://docs.percona.com/percona-toolkit/pt-table-sync.html) · [MySQL 8.0 RM → 19.5.1.30 Replication and Transaction Inconsistencies](https://dev.mysql.com/doc/refman/8.0/en/replication-features-transactions.html) · [Google SRE Book → Ch.26 Data Integrity](https://sre.google/sre-book/data-integrity/)

## 一、原理与底层机制

复制是「尽力而为」的传输：网络闪断、从库磁盘坏块、人为在从库改数据、版本差异的 SQL 行为不同——都可能导致主从数据悄悄分叉。**分叉不会自己告警**，只会某天以「用户余额对不上」的形式爆发。所以一致性校验是 DBA 的例行体检，不是事故后的补救。

**pt-table-checksum 原理**：在**主库**上按表分块（chunk）计算 CRC32 校验和写入 ${C}percona.checksums${C} 表，校验动作本身通过复制传到从库**重放**，从库算出的值与主库不同即分叉。这样天然规避了「主库算完再单独连从库算」的时间窗不一致问题。

## 二、规范与标准

- **校验频率规范**：主从环境每周例行 pt-table-checksum；双写/迁移期间 T+0 与 T+1 双轨对账。
- **chunk 规范**：${C}--chunk-size${C} 控制每块行数（自动调节），太大则单块锁/负载高，太小则 overhead 大。
- **权威侧规范**：每类数据明确谁是 Source of Truth（资金类通常以银行流水为准，而非任一数据库）。
- **Redis 一致性规范**：任何缓存 key 都必须设 TTL，否则成为一致性黑洞（无法自然收敛）。

## 三、实战

${F}bash
pt-table-checksum \\
  --host=主库IP --user=dba --password=... \\
  --databases=shop \\
  --chunk-size=1000 \\          # 每块行数，自动调节
  --no-check-binlog-format \\   # ROW 格式时需要
  --replicate=percona.checksums

# 结果：DIFFS 列 > 0 的表即分叉
${F}

修复（谨慎使用，先备份）：

${F}bash
# 只修复分叉的分块，以主库为准（会把数据写回主库再同步到从库）
pt-table-sync --replicate=percona.checksums \\
  --tables=shop.orders h=主库IP,u=dba,p=... --print   # 先 --print 预览
${F}

**双写/迁移场景的业务对账**（pt-table-checksum 只解决主从复制一致性，跨库需自建）：

${F}text
对账系统三件套：
1. 定时对账（T+1 全量）：按主键范围分批，比关键字段 checksum
2. 实时对账（T+0 抽样）：对关键写路径（支付/库存）双写后立即比对
3. 差异处理：登记 → 自动修复（以权威侧为准）→ 人工复核不可自动修复的
${F}

全量比对用 checksum 而非逐字段下载：${C}CRC32(CONCAT_WS('#', col1, col2, ...))${C} 分块聚合，网络开销小两个数量级。

## 四、覆盖广度

| 场景 | 工具 | 说明 |
|---|---|---|
| 主从复制一致性 | pt-table-checksum + pt-table-sync | 以主库为准修复 |
| 跨库双写对账 | 自建定时+实时对账 | 需明确权威侧 |
| Redis 与 MySQL 一致 | TTL + 删除补偿 | 最终一致即可 |
| 字符集/版本差异分叉 | 校验仍必需 | ROW 格式不消除坏块/人为改动 |

边界：主从延迟大时跑 pt-table-checksum 误报剧增，先确认 ${C}Seconds_BehindSource ≈ 0${C}；pt-table-sync 会改主库数据，先 ${C}--print${C} 预览、备份目标表、选低峰执行；对账差异必须进工单/告警有 owner 有 SLA，否则对账白做。

## 五、常见误区

1. **主从延迟大时跑 pt-table-checksum**：校验和依赖复制传输，延迟大时误报剧增。先确认 ${C}Seconds_BehindSource ≈ 0${C}。
2. **pt-table-sync 直接 --execute**：它会改主库数据；先 ${C}--print${C} 预览、备份目标表、选低峰执行。
3. **对账系统只报差异不闭环**：差异无人修复 = 对账白做。差异必须进工单/告警，有 owner 有 SLA。
4. **以为 ROW 格式复制不会分叉**：ROW 只是消除不确定函数问题；磁盘坏块、人为改动、字符集差异仍会分叉。校验仍是必需。
5. **只在出事后才校验**：分叉是慢性病，等用户举报时往往已影响大量数据，修复成本指数级上升。

## 六、自检清单

- [ ] pt-table-checksum 每周例行，DIFFS 有告警
- [ ] 双写/迁移有对账三件套（定时/实时/差异闭环）
- [ ] 每类数据的权威侧（Source of Truth）明确成文
- [ ] 所有 Redis key 都设 TTL
- [ ] 对账差异的修复 SLA 与 owner 落实
- [ ] pt-table-sync 操作前必 --print 预览并备份

<!--dd:consistency-check-->

## 🔬 深挖：一致性的四个层次与对账系统设计

### 一、先分清「哪种一致性」

| 层次 | 范围 | 典型问题 | 校验手段 |
|---|---|---|---|
| L1 单库内 | 同一实例的多表 | 交易与流水不匹配、余额与明细不符 | 业务规则校验（SQL 自检） |
| L2 主从 | 主库 vs 从库 | 复制中断、跳过事务、手工写入 | pt-table-checksum |
| L3 分片 | 分片之间 | 汇总口径不一致、跨片数据缺失 | 分片聚合比对 |
| L4 跨系统 | DB vs 缓存 vs 消息 vs 下游 | 缓存脏数据、消息丢投、下游未收到 | 对账系统（T+1 全量 + 实时增量） |

**不同层次要用不同工具，用错层会白干**。例如用 pt-table-checksum 去查缓存与 DB 的不一致，方向就错了。

### 二、单库内一致性：用 SQL 自证

${F}sql
-- 账户余额 = 明细流水之和（找出不平的账户）
SELECT a.user_id, a.balance, SUM(d.amount) AS detail_sum,
       a.balance - SUM(d.amount) AS diff
FROM account a
JOIN account_detail d ON d.user_id = a.user_id
GROUP BY a.user_id, a.balance
HAVING diff <> 0
ORDER BY ABS(diff) DESC LIMIT 100;

-- 订单主表与明细表金额不符
SELECT o.id, o.total_amount, SUM(i.unit_price * i.qty) AS item_sum
FROM orders o JOIN order_item i ON i.order_id = o.id
GROUP BY o.id, o.total_amount
HAVING o.total_amount <> item_sum;

-- 孤儿行：明细找不到主表（外键缺失导致的悬挂数据）
SELECT i.order_id, COUNT(*) FROM order_item i
LEFT JOIN orders o ON o.id = i.order_id
WHERE o.id IS NULL GROUP BY i.order_id;
${F}

这类校验应该**固化成定时任务**（如每小时跑一次），把「数据已经不一致」从被动发现变成主动监控。

### 三、主从一致性：pt-table-checksum 的原理

它不只是「比对行数」，而是**在主库上分块计算校验和，并通过复制把校验和带到从库比对**：

${F}text
原理链条：
  1) 按索引把表切成 chunk（默认 1000 行一块）
  2) 对每块计算校验和：SUM(CRC32(CONCAT_WS('#', col1, col2, ...)))
  3) 把结果 INSERT 到主库的 percona.checksums 表
  4) 该 INSERT 通过复制传播到从库 -> 两边都有了主库算出的值
  5) 在每个从库上本地重算同样区块的校验和，与传播来的值比对
  6) 不一致的行记入 percona.checksums（diffs 列 = 1）
  -- 关键：整个过程不改业务数据，且用 --max-load 自动降速
${F}

${F}bash
pt-table-checksum --host=primary --user=checker --password=*** \\
  --databases=appdb \\
  --chunk-size=1000 --chunk-time=0.5 \\
  --max-load="Threads_running=25" --critical-load="Threads_running=60" \\
  --replicate=percona.checksums --no-check-binlog-format

# 只显示有差异的表
pt-table-checksum --replicate=percona.checksums --databases=appdb ... 2>/dev/null
# 差异行的定位
SELECT db, tbl, chunk, this_cnt, master_cnt, this_crc, master_crc
FROM percona.checksums WHERE master_cnt <> this_cnt OR master_crc <> this_crc;
${F}

**重要限制**：${C}binlog_format${C} 必须是 ROW（否则校验和语句会以 STATEMENT 形式复制，产生误判）；且表必须有唯一索引或主键用于分块。

### 四、漂移的成因清单

| 成因 | 症状 | 缓解 |
|---|---|---|
| 复制中断后手工跳过事务 | 从库缺行/多行 | 禁止 ${C}sql_slave_skip_counter${C}；用 GTID 精确重放 |
| 从库被写入（有人改了 read_only） | 主从值不同 | 强制 ${C}super_read_only=ON${C} |
| 双写失败未补偿 | 新库缺行 | 补偿表 + 定时重试 |
| 缓存与 DB 不一致 | 页面显示旧值 | 延迟双删、订阅 binlog 失效缓存 |
| 消息丢弃/重复消费 | 下游少算/多算 | 幂等消费 + 对账兜底 |
| 并发写覆盖 | 计数类字段偏小 | 用原子更新（${C}SET c = c + 1${C}）而非读改写 |

### 五、对账系统：T+1 全量 + 实时增量

${F}text
【T+1 全量对账】每日低峰期
  1) 双方各自导出对账文件：业务主键 + 关键金额字段（避免全字段）
  2) 按主键排序后做归并 diff（比 hash join 更省内存，可流式处理）
  3) 差异分类：仅一方有（漏/多）、两边都有但金额不同（值漂移）
  4) 生成差异工单，按金额阈值分级：大额差异立即人工介入，小额自动补偿

【实时增量对账】准实时
  1) 订阅双方变更流，维护一个「待核对池」（带超时）
  2) 两边都到达且一致 -> 出池
  3) 超时仍单边到达 -> 产生疑似差异告警
  4) 优点：发现快（分钟级）；缺点：状态管理复杂，需处理乱序
${F}

${F}sql
-- 对账结果表设计（关键是可追溯、可重跑、可分级）
CREATE TABLE recon_diff (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  biz_date      DATE NOT NULL,
  biz_type      VARCHAR(32) NOT NULL,
  biz_key       VARCHAR(64) NOT NULL,
  src_value     VARCHAR(128),
  dst_value     VARCHAR(128),
  diff_type     TINYINT NOT NULL COMMENT '1=仅源方 2=仅目标方 3=值不一致',
  severity      TINYINT NOT NULL COMMENT '1=致命 2=严重 3=轻微',
  status        TINYINT NOT NULL DEFAULT 0 COMMENT '0待处理 1已修复 2已忽略',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_run (biz_date, biz_type, biz_key, diff_type),
  KEY idx_status (status, severity)
);
-- 唯一键保证重跑对账时幂等（不会因为重跑而重复生成差异单）
${F}

### 六、修复策略：以谁为准

${F}text
决策树：
  1) 有明确权威方（如交易库）-> 以权威方为准，向另一方补齐
  2) 双方都可能正确（多活）-> 按业务规则合并（如取金额较大者并告警）
  3) 无法判断 -> 冻结该笔，人工介入（不要自动「猜」）
  4) 修复必须幂等且留审计：谁、何时、依据哪条差异单、改了什么
${F}

**修复切忌「直接 UPDATE 覆盖」**：一定要走与被修复系统一致的业务接口或补偿流程，否则会绕过业务校验、产生新的不一致（例如绕过库存扣减校验直接改库存数字）。

### 七、常见误区

1. **「事务能保证跨系统一致」**。本地事务管不到缓存、消息队列和下游服务；跨系统只能靠「本地消息表 + 重试 + 对账」逼近最终一致。
2. **「对账就是比对行数」**。金额、状态、时间字段的漂移才是主要损失来源，行数一致完全可能账不平。
3. **「发现差异就自动修」**。无差别自动修复可能掩盖系统性问题（每天都有差异，说明链路有 bug），必须分级：系统性差异要修代码，偶发差异才自动补。
4. **「对账跑一次全量就行」**。全量对账窗口长、成本高；实时增量对账才能把发现时间从「一天」压到「分钟」。
5. **「忽略了时间边界」**。T+1 对账必须明确「哪一天的交易」的口径（按创建时间还是完成时间、是否含跨日退款），口径不一致会产生大量假差异。

## 七、延伸

- Percona Toolkit → pt-table-checksum / pt-table-sync 全文档（含原理图）
- Google SRE Book → Ch.26 Data Integrity（对账哲学：不仅比数据，还比「不变量」）
- MySQL 8.0 RM → Ch.19.5 Replication Notes and Tips（哪些场景天生不一致）
          `
          },
          {
            id: "db-observability",
            title: "数据库可观测性与监控告警",
            minutes: 28,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis / Prometheus",
            tags: ["监控", "可观测性", "Prometheus", "告警"],
            terms: ["可观测性", "监控", "Prometheus", "告警"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 5.1.6 Server Status Variables](https://dev.mysql.com/doc/refman/8.0/en/server-status-variables.html) · [Prometheus Docs](https://prometheus.io/docs/introduction/overview/) · [mysqld_exporter](https://github.com/prometheus/mysqld_exporter) · [redis_exporter](https://github.com/oliver006/redis_exporter) · [Google SRE Book → Ch.4 SLO](https://sre.google/sre-book/service-level-objectives/)

## 一、原理与底层机制

可观测性的三大支柱是 **Metrics（指标）/ Logs（日志）/ Traces（链路）**。数据库层面：

- **Metrics**：量化的时间序列（QPS、连接数、命中率），用于趋势与告警，是 SLO 的数据源。
- **Logs**：慢查询日志、错误日志、复制错误，用于事后归因。
- **Traces**：跨服务调用链，定位「这一次慢请求经过了哪些库、各花多久」。

与「性能排障」篇的 USE 方法呼应：监控指标应覆盖每一类资源的 Utilization / Saturation / Errors，才能把「哪里不对」变成可量化信号。

## 二、规范与标准

**指标采集规范**：用 mysqld_exporter / redis_exporter 暴露 Prometheus 指标，Grafana 做面板。关键指标分四类：

| 类别 | MySQL 指标 | 含义 |
|---|---|---|
| 吞吐 | ${C}mysql_global_status_queries${C} / ${C}Threads_running${C} | QPS / 真正在跑的连接 |
| 容量 | ${C}Innodb_buffer_pool_read_requests${C} vs ${C}reads${C} | Buffer Pool 命中率 |
| 复制 | ${C}mysql_slave_status_seconds_behind_master${C} | 主从延迟 |
| 质量 | 慢查询数 / 锁等待 | 体验与风险 |

**RED 方法**（Requests / Errors / Duration）适用于数据库服务的 SLI 设计；告警用「多窗口多燃烧率」（见 SLO 篇），避免告警疲劳。

## 三、实战

mysqld_exporter 部署与关键查询：

${F}bash
# 启动 exporter（读取 my.cnf 的 client 段或环境变量）
export DATA_SOURCE_NAME='exporter:password@(10.0.0.11:3306)/'
mysqld_exporter --collect.info_schema.innodb_metrics \\
  --collect.info_schema.processlist
${F}

Grafana 常用 PromQL 示例：

${F}text
# Buffer Pool 命中率（应 > 99%）
100 * (1 - rate(Innodb_buffer_pool_reads[5m])
        / rate(Innodb_buffer_pool_read_requests[5m]))

# 主从延迟（秒）
mysql_slave_status_seconds_behind_master

# QPS
rate(mysql_global_status_queries[1m])
${F}

Redis 侧用 redis_exporter 采集命中率（${C}redis_keyspace_hits/(hits+misses)${C}）、内存使用率、连接数、fork 耗时（${C}latest_fork_usec${C}）。

## 四、覆盖广度

**告警分级**：

| 级别 | 触发 | 响应 |
|---|---|---|
| P0（Page） | 主库不可用 / Buffer Pool 命中率 < 98% / 主从延迟 > 300s | 立即 |
| P1 | QPS 异常抖动 / 慢查询数环比 ×3 / 连接数逼近上限 | 30 分钟内 |
| P2 | 磁盘 > 85% / 复制中断但已降级 | 工作时间 |

边界：监控要覆盖「隐性故障」——长事务（${C}innodb_trx TIME > 60${C}）、MDL 锁等待（${C}metadata_locks${C}）、复制 IO/SQL 线程断；日志需要集中收集（ELK/Loki）并带 traceId；告警必须有人认领、有升级路径，否则告警噪声化。

## 五、常见误区

1. **只监控 CPU/磁盘，不监控数据库特有指标**：连接数打满、Buffer Pool 命中率掉、主从延迟飙升，这些才是数据库特有的「猝死前兆」。
2. **告警阈值一拍脑袋**：固定绝对值在非业务高峰也狂叫，导致告警疲劳。应结合基线 + 燃烧率。
3. **有监控没面板没人看**：指标采了却不建可检索的 Dashboard，出事还是靠盲猜。
4. **只监控主库不监控从库**：从库延迟、从库复制中断往往悄悄发生，切读/切灾备时才发现从库早已不可用。
5. **日志不采集慢查询**：慢查询日志是优化的第一现场，不进集中日志就永远在「事后才想起来」。

## 六、自检清单

- [ ] mysqld_exporter/redis_exporter 已接入 Prometheus
- [ ] Buffer Pool 命中率 / 主从延迟 / 连接数 / 慢查询有告警
- [ ] Grafana 面板可检索，关键指标有趋势图
- [ ] 告警分级（P0/P1/P2）与升级路径明确
- [ ] 慢查询日志接入集中日志并带 traceId
- [ ] 长事务 / MDL 锁等待有监控

<!--dd:db-observability-->

## 🔬 深挖：可观测性三支柱与告警降噪

### 一、三支柱与黄金信号

| 支柱 | 数据库侧的具体内容 | 用途 |
|---|---|---|
| Metrics（指标） | QPS/TPS、连接数、缓冲池命中、锁等待、复制延迟、磁盘 IO | 趋势、容量、告警 |
| Logs（日志） | 错误日志、慢日志、审计日志、binlog | 归因、审计、复盘 |
| Traces（链路） | 应用中 DB span（SQL 指纹、耗时、影响行数） | 定位到具体接口与 SQL |

数据库监控最实用的两个框架：

${F}text
RED（面向服务，适合看"用户受影响程度"）：
  Rate     —— QPS / TPS
  Errors   —— 错误数、失败比例
  Duration —— p50 / p95 / p99 延迟

USE（面向资源，适合看"瓶颈在哪"）：
  Utilization —— CPU、磁盘、缓冲池使用率
  Saturation  —— 排队长度、锁等待数、Threads_running
  Errors      —— 磁盘错误、复制错误、连接拒绝
${F}

**告警应该建在 RED 上，排障时才展开到 USE**。反过来建（只盯 CPU、磁盘）会导致「CPU 高就告警」的噪音，因为 CPU 高未必影响用户。

### 二、必看的 20 个 MySQL 指标

| 组 | 指标 | 关键阈值 |
|---|---|---|
| 吞吐 | Queries / Com_select / Com_insert / Com_update | 基线偏离 ±30% |
| 延迟 | p95 / p99 语句耗时（来自 performance_schema 聚合） | 按接口 SLO |
| 连接 | Threads_connected / Threads_running / Aborted_connects | 连接 < 60% 上限 |
| 缓冲池 | Hit Rate = 1 - Innodb_buffer_pool_reads/read_requests | > 99% |
| 脏页 | Innodb_buffer_pool_pages_dirty / 脏页比例 | < 20% |
| 刷盘 | Innodb_data_pending_fsyncs / fsync 平均耗时 | 持续 > 5ms 告警 |
| 日志 | Innodb_os_log_written 写入速率 | redo 写不动即阻塞 |
| 锁 | Innodb_row_lock_waits / Innodb_row_lock_time_avg | 等待数突增 |
| 事务 | Trx 长事务数、活跃事务数 | 长事务 > 60s 告警 |
| 复制 | 从库延迟秒数、IO/SQL 线程状态 | 延迟 > 业务容忍度 |
| 空间 | 磁盘使用率、表空间增长速率、binlog 留存 | 磁盘 < 80% |
| 错误 | 错误日志中 ERROR 计数、死锁数 | 死锁率突增 |

${F}sql
-- 缓冲池命中率（低于 0.99 需关注）
SELECT ROUND(1 - (
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_reads') /
  NULLIF((SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_read_requests'),0)
), 5) AS bp_hit_rate;

-- 脏页比例（过高意味着刷盘压力大，可能触发强制刷盘阻塞）
SELECT
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_pages_dirty') AS dirty,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_pages_total') AS total;

-- 死锁与锁等待速率
SELECT VARIABLE_NAME, VARIABLE_VALUE FROM performance_schema.global_status
WHERE VARIABLE_NAME IN ('Innodb_deadlocks','Innodb_row_lock_waits','Innodb_row_lock_time_avg');
${F}

### 三、采集与可视化：Prometheus + mysqld_exporter

${F}yaml
# docker-compose 片段
services:
  mysqld-exporter:
    image: prom/mysqld-exporter:latest
    command:
      - "--mysqld.address=mysql:3306"
      - "--mysqld.username=exporter"
    environment:
      MYSQLD_EXPORTER_PASSWORD: "\${MYSQL_EXPORTER_PASSWORD}"
    ports: ["9104:9104"]
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]
${F}

${F}yaml
# prometheus.yml：抓取配置 + 最小告警规则
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: mysql
    static_configs:
      - targets: ["mysqld-exporter:9104"]
rule_files: ["alerts.yml"]
${F}

${F}yaml
# alerts.yml：好告警的三要素 —— 有影响、可行动、可归因
groups:
  - name: mysql
    rules:
      - alert: MySQLReplicationLagHigh
        expr: mysql_slave_status_seconds_behind_master > 10
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: "从库复制延迟 > 10s（2 分钟）"
          description: "instance {{ $labels.instance }} 延迟 {{ $value }}s，请检查大事务与从库负载"
      - alert: MySQLTooManyConnections
        expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.85
        for: 5m
        labels: { severity: warning }
      - alert: MySQLSlowQueriesSpike
        expr: rate(mysql_global_status_slow_queries[5m]) > 5
        for: 5m
        labels: { severity: warning }
${F}

（注意：告警规则里的模板变量必须转义为 ${C}$labels${C} / ${C}$value${C}，否则会被当成模板插值。）

### 四、告警降噪：从「告警风暴」到「可行动告警」

| 反模式 | 问题 | 正确做法 |
|---|---|---|
| 只给单指标阈值 | CPU 一高就告警，噪音大且无意义 | 多条件与：CPU 高 **且** p99 上升 **且** Threads_running 高 |
| 无持续时长 | 瞬时抖动触发告警 | 加 ${C}for: 2m${C}（指标需持续满足） |
| 无分级 | 所有告警都打电话 | critical（影响用户）/ warning（趋势）/ info（记录） |
| 无抑制 | 主库挂了引发 50 条关联告警 | 上游告警触发时抑制下游（inhibit rules） |
| 无聚合 | 100 个分片 100 条告警 | 按服务/集群聚合计数，只报「N 个实例异常」 |
| 阈值拍脑袋 | 超出即告警但业务无感 | 由 SLO 反推阈值（如「p99 > 200ms 持续 5 分钟」） |

**好告警的定义**：收到它的人**知道该做什么**。做不到这一点的告警应该被删除或改成看板。

### 五、链路追踪中的 DB span 怎么读

${F}text
一个典型的 DB span 包含：
  db.system=mysql  db.statement 或 db.statement.digest  db.operation=SELECT
  net.peer.name=mysql-primary  db.name=orderdb
  rows_affected / rows_returned
  duration

排查时的三种典型形态：
  1) 单 span 很长，且是慢 SQL     -> 去优化 SQL（缺索引/大表扫）
  2) 单 span 不长但数量极多        -> N+1 查询，看应用代码的循环调用
  3) span 本身不长但等待久         -> 连接池获取连接耗时，看池配置与泄漏
${F}

**DB span 的 ${C}duration${C} 不包含连接池排队时间**，所以要区分「SQL 慢」还是「拿不到连接」——后者要加连接池的等待时长指标，否则会误判成 SQL 问题。

### 六、从告警到根因的标准动作

${F}text
1) 确认影响面：哪些接口、多少用户、开始时间（先止血再定位）
2) 看 RED：是延迟上升、错误率上升，还是吞吐下降
3) 看 USE：CPU / 磁盘 / 连接 / 缓冲池，定位瓶颈资源
4) 看锁与事务：INNODB_TRX 长事务、data_lock_waits 阻塞链
5) 看慢日志与 DIGEST 聚合：找出新出现的或耗时突增的语句
6) 看变更：最近的发布、DDL、配置变更、数据量突变
7) 止血：限流、回滚、杀长事务、临时加索引
8) 复盘：把根因写成可执行的检查项（进入预案或 CI 规则）
${F}

### 七、常见误区

1. **「指标越多越好」**。采集成本与看板复杂度都会失控；关键是**每个指标都能对应到一个决策或动作**。
2. **「只看实时看板，不做趋势」**。容量类问题必须看周/月趋势（磁盘增长速率、连接数增长速率），实时看板看不出来。
3. **「告警阈值固定不变」**。业务量增长后旧阈值必然误报；阈值应随容量基线定期校准。
4. **「监控只覆盖 DB 自身」**。连接池等待、应用侧 SQL 耗时、网络 RTT 都在链路上，缺一环就无法区分「DB 慢」与「网络/应用慢」。
5. **「日志只留不查」**。错误日志与慢日志必须被采集到集中日志系统并建立查询入口，否则出事时只能上机器 grep，慢一个数量级。

## 七、延伸

- Prometheus Docs → Overview / Exporters（指标采集体系）
- mysqld_exporter / redis_exporter README（暴露的指标清单）
- Google SRE Book → Ch.4 SLO（指标如何转化为服务质量目标）
          `
          }
        ]
      }
    ]
  };

  window.DBA = DBA;
})();
