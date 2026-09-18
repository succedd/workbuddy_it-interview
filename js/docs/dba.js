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
