/* =========================================================================
 *  js/docs/dba.js — 技术教程「数据库 / DBA」方向数据（官方文档目录重构版）
 *  骨架取自：MySQL 8.0 Reference Manual / PostgreSQL Documentation /
 *  redis.io Docs / ShardingSphere / Percona Toolkit / Google SRE Book。
 *  正文代码围栏用 ${F}、行内代码用 ${C}；shell/SQL 里 ${C}VAR${C} 写成 \${VAR}。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

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
            minutes: 18,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16",
            tags: ["SQL", "查询", "执行顺序"],
            terms: ["SQL", "查询", "MySQL", "索引"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 13.2 DML Statements](https://dev.mysql.com/doc/refman/8.0/en/select.html) · [MySQL RM → 13.2.11 WITH](https://dev.mysql.com/doc/refman/8.0/en/with.html) · [PostgreSQL → Ch.7 Queries](https://www.postgresql.org/docs/current/queries.html)

## 一、一条 SELECT 的逻辑执行顺序

SQL 是声明式语言：你描述**结果集长什么样**，优化器决定怎么拿。写 SQL 与做优化前，先在心里装下这条几乎所有关系库（MySQL / PG / Oracle）通用的逻辑流水线：

${F}text
FROM / JOIN     →  确定数据源（笛卡尔积）
  → WHERE        →  行级过滤（此时尚未执行 SELECT，列别名还不存在）
  → GROUP BY     →  分组
  → HAVING       →  组级过滤
  → SELECT       →  计算输出列 / 聚合
  → DISTINCT     →  去重
  → ORDER BY     →  排序
  → LIMIT/OFFSET →  截取
${F}

两个高频推论：

1. **WHERE 里不能直接用 SELECT 的别名**——别名在 SELECT 阶段才诞生，而 WHERE 更早。MySQL 8.0 会直接报 ${C}Unknown column${C}。需要复用计算列时用子查询或 CTE（${C}WITH${C}）。
2. **LIMIT 前 ORDER BY 必须有索引兜底**，否则排序发生在完整结果集上，数据量一大就是灾难（「慢查询治理」篇展开）。

## 二、JOIN 的三种语义与两种物理算法

语义（SQL 标准定义，对应 MySQL RM 13.2.9.2 JOIN Clause）：

| 类型 | 语义 | 官方章节 |
|---|---|---|
| INNER JOIN | 两表都存在的行 | MySQL 13.2.9.2 |
| LEFT JOIN | 左表全保留，右侧缺失补 NULL | 同上 |
| RIGHT JOIN | 右表全保留 | 同上（实践中一般改写成 LEFT，可读性更好） |

物理算法（优化器二选一，PG 的 EXPLAIN 会直接显示）：

- **Nested Loop**：外层每行去内层找匹配。**内层有索引时是 O(N·logM)**，OLTP 最理想形态。
- **Hash Join**：小表建哈希表、大表探测。适合无索引可用的一次性大表关联。MySQL 8.0.18 起支持，PG 一直支持。

${C}LEFT JOIN ... WHERE t2.col IS NULL${C} 是经典的「反连接」写法（找左表中无匹配的行），与 ${C}NOT EXISTS${C} 语义相同；新版优化器对两者计划已趋同，建议统一用语义更清晰的 ${C}NOT EXISTS${C}。

## 三、写好第一层 SQL 的清单

${F}sql
-- 1) 永远别 SELECT *：多余列吃掉覆盖索引，也浪费网络带宽
SELECT id, user_id, amount, created_at
FROM orders
WHERE user_id = 10086
  AND status = 'PAID'
  AND created_at >= '2026-01-01'
ORDER BY created_at DESC
LIMIT 20;

-- 2) 深分页用键集分页（Keyset Pagination），别 OFFSET 1000000
SELECT id, amount FROM orders
WHERE id > 1000000          -- 上一页最后一条的 id（要求排序键单调）
ORDER BY id LIMIT 20;

-- 3) 复杂计算用 CTE（MySQL 8.0 / PG 通用），可读性远胜多层嵌套
WITH paid AS (
  SELECT user_id, SUM(amount) AS total
  FROM orders WHERE created_at >= '2026-09-01' AND status = 'PAID'
  GROUP BY user_id
)
SELECT u.name, p.total
FROM paid p JOIN users u ON u.id = p.user_id
ORDER BY p.total DESC LIMIT 10;
${F}

## ⚠ 常见误区

1. **LEFT JOIN 时 ON 与 WHERE 混用不区分**：对 INNER JOIN 两者等价；对 LEFT JOIN，右表过滤条件放 ON 是「过滤右表」、放 WHERE 是「过滤结果集」，语义完全不同——这是线上「数据变多/变少」的高频事故源。
2. **${C}COUNT(col)${C} 与 ${C}COUNT(*)${C} 混为一谈**：${C}COUNT(col)${C} 不统计 col 为 NULL 的行，${C}COUNT(*)${C} 统计行数。统计行数一律 ${C}COUNT(*)${C}。
3. **认为 LIMIT 能「加速」**：LIMIT 只减少返回行，不减少扫描；无索引排序时照样全表扫（PG Ch.7.6 明确说明）。
4. **隐式类型转换**：${C}WHERE phone = 13800138000${C}（phone 为 VARCHAR）触发转换导致索引失效。一律按列类型写字面量。

## ✅ 自检清单

- [ ] 新 SQL 都跑过 EXPLAIN，能说出预期索引与扫描行数
- [ ] 深分页已改键集分页或「延迟关联」
- [ ] LEFT JOIN 的过滤条件清楚放在 ON 还是 WHERE 及其语义
- [ ] 查询条件与列类型严格一致，无隐式转换
- [ ] 生产 SQL 无 SELECT *

## 📚 延伸阅读

- MySQL 8.0 Reference Manual → 13.2.9 SELECT / 13.2.11 WITH / 13.2.10 Subqueries
- PostgreSQL Documentation → Ch.7 Queries / Ch.11 Indexes
- Use The Index, Luke（免费在线索引教程）
          `
          },
          {
            id: "schema-normalization",
            title: "库表设计与范式",
            minutes: 20,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16",
            tags: ["范式", "设计", "数据类型"],
            terms: ["范式", "数据库", "设计", "建模"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.11 Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html) · [MySQL RM → Ch.10 Character Sets](https://dev.mysql.com/doc/refman/8.0/en/charset.html) · [PostgreSQL → Ch.5 Data Definition](https://www.postgresql.org/docs/current/ddl.html)

## 一、三大范式的实操化表述

范式理论出自 Codd 1971 年论文，官方手册不展开，本篇按通用设计教材口径落地：

| 范式 | 一句话 | 违反的典型例子 |
|---|---|---|
| 1NF | 每列原子性，不可再分 | address 列里「省市区详址」混存 |
| 2NF | 非主键列完全依赖主键（消除部分依赖） | 订单明细表存商品名（只依赖商品 id） |
| 3NF | 消除传递依赖 | 学生表存「班级名、班主任」（班主任依赖班级） |

实操判断法：**一张表只描述一个实体**，描述其他实体的信息用外键关联而非重复存储。每多一份冗余，就多一个「改了 A 忘了 B」的不一致风险点。

## 二、什么时候故意违反范式（反范式）

互联网业务在读多写少 + 数据量巨大的场景下做**受控反范式**：

- 订单表冗余「下单时的商品快照」——不是省 JOIN，而是商品后来改价，订单必须保留**历史价格**（本质是时间维度的事实记录，不算冗余）；
- 用户表冗余 ${C}order_count${C} 计数——用「写时更新或定时对账」换取高频读少一次聚合。

原则：**冗余必须登记在案**（哪个字段是冗余、由谁维护一致性），否则日后没人敢动它。

## 三、字段类型选择（官方 Data Types 章的落地）

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

- **金额用 DECIMAL**：FLOAT/DOUBLE 是 IEEE 754 近似值，${C}0.1+0.2 != 0.3${C}；MySQL RM 11.3 与 PG Ch.8.1 均如此建议。
- **主键 BIGINT UNSIGNED**：INT 最大约 21 亿，热点表两年就危险。
- **时间用 DATETIME(3) 或 TIMESTAMP**：TIMESTAMP 占 4 字节但上限 2038 年且随时区转换；「绝对时刻」用 TIMESTAMP，「业务时间」用 DATETIME，毫秒精度用 ${C}(3)${C}。
- **字符集统一 utf8mb4**：MySQL 的 ${C}utf8${C} 实为 utf8mb3（3 字节），存不了 emoji；官方 Ch.10 明确推荐 utf8mb4。注意 8.0 默认排序规则 ${C}utf8mb4_0900_ai_ci${C} 与 5.7 的 ${C}utf8mb4_general_ci${C} 不同，**跨版本主从/迁移会导致比较行为不一致**。

## 四、约束：让数据库做最后一道防线

${F}sql
ALTER TABLE order_items
  ADD CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT uk_item UNIQUE KEY (order_id, sku_id),
  ADD CONSTRAINT ck_qty CHECK (quantity > 0);   -- MySQL 8.0.16 起真正强制 CHECK
${F}

互联网大表实践中常**不建物理外键**（分库分表后无法建、写入损耗、锁传播），改为「应用层校验 + 定期一致性对账」；单库小表与内部系统应当建——数据库约束是应用层 bug 的最后防线。

## ⚠ 常见误区

1. **VARCHAR(255) 满天飞**：长度按业务实际约束（如 ${C}VARCHAR(64)${C}）；utf8mb4 下索引单列上限 3072 字节，${C}VARCHAR(768)${C} 恰好占满，超长列只能前缀索引。
2. **ON DELETE CASCADE 当随手选项**：大表上是「隐形删除风暴」，生产慎用。
3. **一个字段存多种含义**（remark 既存备注又塞 JSON 扩展）：无法走索引、无法建约束。扩展信息用 JSON 类型（MySQL 11.5 / PG jsonb）配合生成列建索引。
4. **索引当外键用导致索引泛滥**：每多一个索引，写放大多一分；高频写表保持「每表索引 ≤ 5」意识。

## ✅ 自检清单

- [ ] 每张表能一句话说清它描述哪个实体
- [ ] 金额 DECIMAL、状态整数枚举、时间 DATETIME(3)、字符集 utf8mb4
- [ ] 所有冗余字段有登记与一致性维护方案
- [ ] 大表无物理外键时有应用层校验 + 对账兜底
- [ ] 字段与表都有 COMMENT

## 📚 延伸阅读

- MySQL 8.0 Reference Manual → Ch.11 Data Types / Ch.10 Character Sets / 13.1.20 CREATE TABLE
- PostgreSQL Documentation → Ch.5 Data Definition / Ch.8 Data Types
- 《Database Design for Mere Mortals》（范式与反范式决策框架）
          `
          },
          {
            id: "backup-restore",
            title: "备份与恢复基本操作",
            minutes: 20,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / PostgreSQL 16 / Redis 7",
            tags: ["备份", "恢复", "PITR"],
            terms: ["备份", "恢复", "容灾", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.7 Backup and Recovery](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html) · [MySQL RM → Ch.19 The Binary Log](https://dev.mysql.com/doc/refman/8.0/en/binary-log.html) · [PostgreSQL → Ch.25 Backup and Recovery](https://www.postgresql.org/docs/current/backup.html) · [redis.io → Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## 一、备份的两条技术路线（MySQL RM 7.2 分类）

| 路线 | 代表工具 | 特点 | 适用 |
|---|---|---|---|
| 逻辑备份 | mysqldump / MySQL Shell dump utilities / pg_dump | 输出 SQL 文本，跨版本、可读、慢 | 中小库、迁移、日常全量 |
| 物理备份 | XtraBackup（Percona）/ pg_basebackup / MySQL Shell clone | 直接拷数据文件，快 | 大库、全量基线 |

官方推荐的组合拳（MySQL RM 7.3 Example Backup and Recovery Strategy）：

${F}text
每周日 02:00  → 全量物理备份（基线）
每天 02:00    → 全量逻辑备份（双保险）
持续          → binlog 实时归档到远端对象存储
恢复粒度      → 全量基线 + 重放 binlog 到指定时间点 = PITR
${F}

## 二、mysqldump 的正确姿势

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

关键参数（官方 7.4 节）：

- ${C}--single-transaction${C}：InnoDB 上一致性快照导出，**不锁表**。前提：导出期间无 DDL——DDL 会破坏快照一致性。
- ${C}--source-data=2${C}：把 binlog 位点以注释形式写入 dump，PITR 的起点。
- ${C}--set-gtid-purged=ON${C}：携带 GTID 信息，便于复制拓扑下恢复。

## 三、PITR（时间点恢复）完整链路

${F}bash
# 1. 恢复全量基线
mysql < full.sql

# 2. 重放基线位点之后的 binlog，停在事故前一秒
mysqlbinlog --start-position=154 \\
  --stop-datetime='2026-09-17 03:59:59' \\
  binlog.000101 binlog.000102 | mysql
${F}

PostgreSQL 同构机制：${C}pg_basebackup${C} 取全量基线 + WAL 归档重放（${C}recovery_target_time${C}），见文档 25.3。思想一致：**全量基线 + 增量日志重放 = 任意时间点恢复**。

## 四、Redis 备份（redis.io → Persistence）

- **RDB**：定时 fork 子进程做全量快照（${C}save 900 1${C} 等配置）。文件小、恢复快，但丢最后一次快照后的数据。
- **AOF**：追加每条写命令（${C}appendonly yes${C}，${C}appendfsync everysec${C} 是性能/安全平衡点），最多丢 1 秒。
- **官方推荐两者同开**（7.x 支持 AOF-RDB 混合持久化）：RDB 做快速恢复基线，AOF 补增量。
- 备份必须**异地多副本**：${C}COPY${C} 出 ${C}dump.rdb${C} 上传对象存储才叫备份，本机拷贝不防机器故障。

## ⚠ 常见误区

1. **以为 ${C}--single-transaction${C} 万事大吉**：只对 InnoDB 有效；MyISAM 仍需 ${C}--lock-all-tables${C}（这也是 8.0 全面 InnoDB 的原因之一）。
2. **备份从不做恢复演练**：文件损坏、字符集丢失、版本不兼容，只在真恢复时才发现。SRE 纪律：**每月一次恢复演练并记录耗时（决定 RTO）**。
3. **binlog 与备份同机存放**：机器炸了全没，必须落远端对象存储 / 另一机房。
4. **只备份数据不备份权限与配置**：${C}mysql${C} 系统库、${C}my.cnf${C}、GTID 拓扑同样要备，否则恢复后服务起不来。

## ✅ 自检清单

- [ ] 全量 + 增量 + binlog 归档三级策略在跑，有成功/失败告警
- [ ] 备份加密且异地存储，保留策略明确（如 30 天）
- [ ] 最近 30 天做过真实恢复演练，耗时 < RTO 承诺
- [ ] PITR 精确到秒的恢复演练过
- [ ] Redis RDB+AOF 双开且快照异地化

## 📚 延伸阅读

- MySQL 8.0 Reference Manual → Ch.7 Backup and Recovery（全章精读）· Ch.19 The Binary Log
- PostgreSQL Documentation → Ch.25 Backup and Recovery
- Percona XtraBackup 8.0 Documentation（大库物理备份事实标准）
          `
          },
          {
            id: "user-privilege",
            title: "用户与权限管理",
            minutes: 16,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis 6+",
            tags: ["权限", "账号", "安全"],
            terms: ["权限", "账号", "MySQL", "安全"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.8 Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)（8.2 Access Control and Account Management / 8.4 Using Encrypted Connections）· [PostgreSQL → Ch.21 Database Roles](https://www.postgresql.org/docs/current/user-manag.html) · [redis.io → ACL](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)

## 一、MySQL 的两级访问控制（官方 8.2.7）

**Stage 1：连接核实**——校验 ${C}user@host${C} 与密码。${C}'app'@'10.0.%'${C} 的 host 部分决定「从哪里能连」，这是最常被忽略的防线：**生产账号绝不允许 ${C}'%'${C}**。

**Stage 2：请求核实**——每条语句按「全局 → 库 → 表 → 列 → 例程」层级检查。权限向下生效，**最小权限原则要求授到够用的最低层级**。

## 二、账号管理标准操作（官方 8.2.3）

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
${F}

8.0 的账号属性是**服务器强制执行的安全策略**：${C}PASSWORD EXPIRE${C}（过期）、${C}PASSWORD HISTORY${C}（不得与最近 N 次重复）、${C}FAILED_LOGIN_ATTEMPTS${C}（连续失败锁定），比 5.7 时代靠脚本自觉强得多。

## 三、密码策略组件（官方 8.2.8）

${F}sql
INSTALL COMPONENT 'file://component_validate_password';
SET GLOBAL validate_password.policy = STRONG;   -- LOW / MEDIUM / STRONG
SET GLOBAL validate_password.length = 16;
${F}

## 四、Redis ACL（Redis 6.0+）

默认单用户模式在共享环境是大隐患。ACL 支持按用户限定「命令 + 键前缀」：

${F}bash
# 只读账号：仅 GET/MGET shop:* 前缀，禁用危险命令
ACL SETUSER report_ro on >'RoPa55' ~shop:* +get +mget -@dangerous

# 业务读写账号
ACL SETUSER app_rw on >'WrPa55' ~shop:* ~cache:* +@read +@write -@dangerous -flushall

ACL SAVE    # 持久化 ACL
${F}

## 五、审计与巡检

${F}sql
-- 谁有权限、从哪连：季度巡检必查
SELECT user, host, account_locked, password_last_changed
FROM mysql.user WHERE account_locked = 'N';

-- 检查空密码与通配 host（安全基线）
SELECT user, host FROM mysql.user
WHERE authentication_string = '' OR host = '%';

-- 权限全景（谁在哪个库有什么）
SELECT user, host, db, table_name, table_priv
FROM mysql.tables_priv LIMIT 50;
${F}

## ⚠ 常见误区

1. **root 直接连应用**：应用被拖库等于全库沦陷。应用账号只拿业务库的 ${C}SELECT/INSERT/UPDATE/DELETE${C}。
2. **僵尸授权无人清**：账号删了授权残留。季度巡检 ${C}mysql.db${C} / ${C}mysql.tables_priv${C}，对照工单清理。
3. **Redis 关 protected-mode 又不设密码**：公网裸奔，历史上大量挖矿劫持由此而来（写 SSH key / 计划任务）。
4. **权限变更无记录**：出事件无法回溯「谁何时给了谁什么」。权限变更必须入版本库（SQL 迁移脚本）或工单。

## ✅ 自检清单

- [ ] 生产账号 host 全部限定网段，无 '%' 账号
- [ ] 业务账号无 DDL / GRANT / SUPER / FILE 权限
- [ ] 密码过期、历史、失败锁定策略已启用
- [ ] Redis 已启用 ACL 或至少 requirepass + protected-mode
- [ ] 权限变更全量可追溯
- [ ] 季度权限巡检脚本在跑（空密码 / 通配 host / 僵尸账号）

## 📚 延伸阅读

- MySQL 8.0 Reference Manual → Ch.8 Security（8.1–8.5 全读）
- PostgreSQL Documentation → Ch.21 Database Roles / Ch.5.7 Privileges
- redis.io → Docs → Security → ACL
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
            minutes: 26,
            updated: "2026-09-17",
            applies: "MySQL 8.0 InnoDB",
            tags: ["索引", "EXPLAIN", "B+树"],
            terms: ["索引", "执行计划", "B+树", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.10.3 Optimizer and Index Statistics](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html) · [MySQL RM → 8.8.2 EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html) · [InnoDB → 17.6.2.1 Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html)

## 一、InnoDB 的两类索引（官方 17.6.2.1）

**聚集索引（主键）**：整张表本身就是一棵按主键组织的 B+ 树，**叶子节点存完整行数据**。这就是「按主键查最快」的根源。

**二级索引（辅助索引）**：叶子节点存「索引列值 + 主键值」。用二级索引找到主键后，若还需要其他列，必须**回表**——拿主键回聚集索引再查一次。

由此推出三个核心概念：

- **覆盖索引**：查询所需列全部包含在二级索引里，无需回表。EXPLAIN 的 Extra 出现 ${C}Using index${C}。
- **最左前缀**：联合索引 ${C}(a,b,c)${C} 只能命中 ${C}a${C}、${C}a,b${C}、${C}a,b,c${C} 前缀条件；${C}WHERE b=1${C} 用不上（除非索引跳跃扫描 ICP）。
- **索引下推 ICP**：MySQL 5.6+ 把 ${C}WHERE${C} 中能用的条件下推到存储引擎层过滤，减少回表次数（Extra 出现 ${C}Using index condition${C}）。

## 二、B+ 树的关键数字

InnoDB 页 16KB；BIGINT 主键 + 指针约 12 字节 → 非叶节点约 1300 分支；树高 3 层可索引约 **2000 万行**（业界估算口径）。这意味着：**单表千万级本身不是问题，问题是你的查询走不走索引**。「数据量大了必须分库分表」是过度设计，先看执行计划。

## 三、EXPLAIN 输出逐列精读（官方 8.8.2）

${F}sql
EXPLAIN SELECT id, amount FROM orders
WHERE user_id = 10086 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;
${F}

| 列 | 看什么 | 优劣序 |
|---|---|---|
| type | 访问类型 | system > const > eq_ref > ref > **range** > index > **ALL**（全表扫，重点消灭） |
| key | 实际用到的索引 | NULL = 没用上 |
| rows | 预估扫描行数 | 越小越好；与实际差一个数量级说明统计信息过期 |
| filtered | 条件过滤比例 | 结合 rows 估算最终行数 |
| Extra | 附加动作 | 见下 |

Extra 常见值速查：

- ${C}Using index${C}：覆盖索引 ✅
- ${C}Using index condition${C}：ICP 生效 ✅
- ${C}Using where${C}：server 层过滤（中性）
- ${C}Using filesort${C}：**排序没走索引，内存/磁盘排序** ⚠ 深查
- ${C}Using temporary${C}：**建了临时表**（常见于 GROUP BY / DISTINCT 无索引）⚠ 深查

## 四、实战：从 filesort 到覆盖索引

${F}sql
-- 现状：type=ALL, Extra=Using filesort
SELECT id, user_id, amount, created_at FROM orders
WHERE user_id = 10086 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;

-- 建联合索引（等值列在前、排序列在后，符合最左前缀 + 排序连续）
ALTER TABLE orders ADD INDEX idx_user_status_time (user_id, status, created_at);

-- 复查：type=ref, key=idx_user_status_time, Extra=Using index condition
-- 若只 SELECT 索引内列还能变成 Using index（覆盖索引）
${F}

## 五、索引失效的六种姿势

1. **对索引列做函数/运算**：${C}WHERE DATE(created_at) = '2026-09-17'${C} → 改写为范围 ${C}WHERE created_at >= '...' AND created_at < '...'+1 day${C}（官方 8.2.1.3 专门讲此优化）。
2. **隐式类型转换**：VARCHAR 列对数字比较。
3. **前导模糊**：${C}LIKE '%abc'${C}；${C}'abc%'${C} 可以走索引。
4. **OR 混合无索引列**：改 UNION 或都建索引。
5. **优化器判定走索引更慢**（回表太多）：合理，用 ${C}EXPLAIN ANALYZE${C}（8.0.18+）看真实执行而非猜测。
6. **统计信息过期**：${C}ANALYZE TABLE${C} 更新；8.0 支持 ${C}innodb_stats_persistent_sample_pages${C} 调采样。

## ⚠ 常见误区

1. **索引越多越好**：每个索引都是一棵要维护的 B+ 树，写放大 + 优化器选择困难。高频写表索引 ≤ 5。
2. **拿 ${C}rows${C} 当真实值**：那是统计估算；用 ${C}EXPLAIN ANALYZE${C}（8.0.18+）看真实耗时分布。
3. **在低区分度列上建索引**（如 gender）：优化器大概率不用，还白付写放大。联合索引里作为等值条件的一员才有意义。
4. **ORDER BY 列与索引顺序不一致还想消除 filesort**：索引对排序生效要求「等值条件列在前 + 排序列连续在后」，方向混排（ASC/DESC 混合）需要 8.0 的降序索引（官方 8.3.13 Descending Indexes）。

## ✅ 自检清单

- [ ] 核心查询的 EXPLAIN 无 ALL / Using filesort / Using temporary
- [ ] 每张表的索引都能对应到具体查询，无「孤儿索引」
- [ ] 联合索引按「等值列在前、排序列在后」设计
- [ ] 统计信息有定期 ANALYZE / 采样页数配置
- [ ] 上线前用 EXPLAIN ANALYZE 验证过真实执行耗时

## 📚 延伸阅读

- MySQL 8.0 RM → 8.3 Optimization and Indexes / 8.8.2 EXPLAIN Output Format / 8.2.1 Optimizing SELECT
- InnoDB Manual → 17.6.2.1 Clustered and Secondary Indexes
- Use The Index, Luke → Executing Plans
          `
          },
          {
            id: "tx-isolation-lock",
            title: "锁与事务隔离级别",
            minutes: 28,
            updated: "2026-09-17",
            applies: "MySQL 8.0 InnoDB",
            tags: ["事务", "锁", "MVCC"],
            terms: ["事务", "锁", "隔离级别", "死锁"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 17.7 InnoDB Locking and Transaction Model](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)（17.7.2 Lock Types / 17.7.2.3 Record / Gap / Next-Key Locks / 17.7.3 Transaction Isolation Levels / 17.7.5 Deadlocks in InnoDB）· [PostgreSQL → Ch.13 Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)

## 一、四种隔离级别与三种并发异常（官方 17.7.3）

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---|---|---|---|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED（RC） | 不可能 | 可能 | 可能 |
| **REPEATABLE READ（默认）** | 不可能 | 不可能 | InnoDB 基本防住* |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 |

*SQL 标准里 RR 不防幻读，但 InnoDB 通过 **MVCC + Next-Key Lock** 在快照读与当前读两个通道都大幅抑制了幻读，这是面试与实战都常考的点。

## 二、MVCC（多版本并发控制）如何工作

InnoDB 每行有两个隐藏列：${C}DB_TRX_ID${C}（最后修改事务号）与 ${C}DB_ROLL_PTR${C}（指向 undo log 旧版本链）。

- **快照读**（普通 ${C}SELECT${C}）：沿 undo 链找到「对自己可见」的版本，**不加锁**。可见性判断用 ReadView（RC 每条语句新建；RR 事务开始后第一条快照读时创建并复用——这就是 RC 与 RR 的本质区别）。
- **当前读**（${C}SELECT ... FOR UPDATE${C} / ${C}FOR SHARE${C} / UPDATE / DELETE）：读最新版本并加锁。

## 三、三种行级锁（官方 17.7.2.3）

| 锁 | 锁什么 | 何时使用 |
|---|---|---|
| Record Lock | 单条索引记录 | 唯一索引等值命中 |
| Gap Lock | 索引记录之间的**间隙** | RC 不用；RR 下防幻读 |
| Next-Key Lock | Record + 前面的 Gap | RR 默认的行锁形态 |

**锁的载体是索引**：${C}WHERE col = 5${C} 若 col 无索引，InnoDB 只能全表扫并给**所有扫过的记录加锁**（接近锁全表）。这是「无索引的 UPDATE 引发雪崩」的原理。

## 四、实战：死锁定位与解除

${F}bash
# 1) 看最近的死锁（err log 里 LATEST DETECTED DEADLOCK）
SHOW ENGINE INNODB STATUS\\G

# 2) 8.0 专属：数据字典里的锁等待视图
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM performance_schema.data_locks;
${F}

典型死锁：事务 A 先锁行 1 再要行 2；事务 B 先锁行 2 再要行 1。预防铁律：

1. **多行操作按同一顺序访问**（如按主键升序）。
2. **事务尽量短**，交互式事务不抱锁等人。
3. RR 下大范围更新（如 ${C}WHERE status=0${C} 无索引）会锁住大量间隙——先补索引，或该场景降 RC。

## 五、隔离级别选型（互联网实践）

- 默认 **RR** 适合大多数场景；But 阿里等主流实践在 RC 下运行核心交易库：锁更少（无 Gap Lock）、并发更好，业务用「乐观锁版本号 / 唯一索引」防幻读。
- **选型判据是并发异常是否影响业务正确性**，不是「越高越好」。SERIALIZABLE 吞吐断崖，几乎不用。

${F}sql
-- 乐观锁：不依赖数据库锁的并发修改保护
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 5;   -- 影响 0 行说明被并发修改，重试
${F}

## ⚠ 常见误区

1. **「InnoDB 行锁就是锁行」**：锁在索引记录上；无索引时退化成锁全表扫描路径。给 UPDATE/DELETE 的 WHERE 列建索引是锁粒度优化的第一课。
2. **RC 没有幻读问题的错觉**：RC 下当前读不锁间隙，幻读真实存在；只是 RR 下业务感知不到。
3. **长事务无感知**：${C}information_schema.innodb_trx${C} 里 TIME 巨大的事务会拖长 undo 链、阻塞 purge、放大死锁概率。监控 ${C}SELECT * FROM innodb_trx WHERE TIME > 60${C} 告警。
4. **死锁当成故障**：InnoDB 自动检测并回滚代价小的事务（官方 17.7.5），应用捕获 ${C}1213${C} 错误重试即可；**不重试才是故障**。

## ✅ 自检清单

- [ ] 所有 UPDATE/DELETE 的 WHERE 列有索引（锁粒度可控）
- [ ] 应用对死锁错误 1213 / 锁等待 1205 有重试逻辑
- [ ] 多行操作按固定顺序（主键序）访问
- [ ] 有长事务监控与告警（> 60s）
- [ ] 团队明确当前隔离级别及其并发异常边界

## 📚 延伸阅读

- MySQL 8.0 RM → 17.7 InnoDB Locking and Transaction Model（全章精读）
- PostgreSQL Documentation → Ch.13 Concurrency Control（MVCC 的另一种实现：无回滚链、靠 xmin/xmax）
- 《High Performance MySQL》第 8 章（锁与隔离的实战视角）
          `
          },
          {
            id: "slow-query",
            title: "慢查询治理",
            minutes: 24,
            updated: "2026-09-17",
            applies: "MySQL 8.0",
            tags: ["慢查询", "优化", "pt-query-digest"],
            terms: ["慢查询", "SQL", "优化", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 8.5 Optimizing for Slow Query Log](https://dev.mysql.com/doc/refman/8.0/en/slow-query-log.html) · [MySQL RM → 8.9 Understanding the Query Execution Plan](https://dev.mysql.com/doc/refman/8.0/en/execution-plan-information.html) · [Percona Toolkit → pt-query-digest](https://docs.percona.com/percona-toolkit/pt-query-digest.html)

## 一、治理流程：先量化、再归因、后优化

${F}text
① 开慢日志采集 → ② 聚合分析找 TOP SQL → ③ EXPLAIN 归因
    → ④ 改 SQL/索引/结构 → ⑤ 上线比对 → ⑥ 回归监控
${F}

慢查询治理不是一次性运动，而是「发现 → 归因 → 修复 → 防回归」的循环。

## 二、慢日志的正确配置

${F}ini
[mysqld]
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5          # 8.0 支持微秒；按业务 P99 目标定
log_queries_not_using_indexes = ON
log_slow_admin_statements = ON
log_slow_extra = ON            # 8.0.14+ 记录更完整的执行指标
${F}

注意：${C}log_queries_not_using_indexes${C} 可能刷爆日志（全表扫的高频小查询），有此风险时关闭，靠 pt-query-digest 抓全量。

## 三、聚合分析：pt-query-digest（事实标准）

${F}bash
pt-query-digest /var/log/mysql/slow.log > slow_report.txt

# 实时抓最慢的 5 条
pt-query-digest --processlist h=127.0.0.1,P=3306,u=monitor \\
  --interval=0.5 --run-time=5m
${F}

报告重点看：**Query 分布（按总耗时排序而非单次最长）**、P95/P99 延迟、Rows examined/Rows sent 比值——**扫描行数是返回行数的成百上千倍 = 典型缺索引或错误计划**。

## 四、归因四象限

| 现象 | 归因 | 对策 |
|---|---|---|
| type=ALL | 无索引 | 建索引 |
| type=ref 但 rows 巨大 | 索引区分度不足 | 换/加前导列 |
| Extra=Using filesort | 排序未走索引 | 联合索引尾列承载排序 |
| Extra=Using temporary | GROUP BY/DISTINCT 无索引 | 索引或改写查询 |

## 五、进阶工具：optimizer trace

EXPLAIN 只给结论，trace 给推理过程（官方 8.9.2）：

${F}sql
SET optimizer_trace = 'enabled=on';
SELECT ... ;   -- 你的慢 SQL
SELECT * FROM information_schema.OPTIMIZER_TRACE\\G
-- 看 "considered_execution_plans"：优化器考虑过哪些计划、成本各多少
SET optimizer_trace = 'enabled=off';
${F}

典型发现：优化器因统计信息误判走错索引 → ${C}ANALYZE TABLE${C} 或 ${C}FORCE INDEX${C} 应急。

## 六、系统层兜底排查

SQL 层面全对还慢，往上查：

- **Buffer Pool 命中率**：${C}SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read%'${C}；物理读占比高 = 内存不足。
- **IoWait**：${C}iostat -x 1${C} 看 %util 与 await；数据库是最吃 IO 的应用，慢常是宿主机资源问题。
- **MDL 锁等待**：${C}performance_schema.metadata_locks${C}——一个长事务能阻塞后续所有 DDL 与查询。

## ⚠ 常见误区

1. **按单次最长耗时排序优化**：一条每小时跑一次的 10s 查询，危害可能远小于每秒百次的 200ms 查询。**按「总耗时 × 频率」排序**。
2. **只优化不改监控**：没有基线对比，无法证明优化有效。上线前后各留 P95/P99。
3. **在从库上看到主库没有的慢查询就恐慌**：主从数据/负载不同，计划可能不同；在问题发生的实例上复现。
4. **用 ${C}FORCE INDEX${C} 当长期方案**：那是绕过优化器误判的止血贴，根因（统计信息/版本 bug）要修。

## ✅ 自检清单

- [ ] 慢日志开启且阈值与业务 P99 目标一致
- [ ] pt-query-digest 定期跑，TOP SQL 有治理看板
- [ ] 每个优化都有优化前后 EXPLAIN 与 P95/P99 对比
- [ ] optimizer trace 会用，能解释优化器的选择
- [ ] Buffer Pool 命中率与 MDL 等待有监控

## 📚 延伸阅读

- MySQL 8.0 RM → 8.5 Optimizing for Slow Query Log / 8.9 Understanding the Query Execution Plan
- Percona Toolkit Documentation → pt-query-digest
- 《High Performance MySQL》Ch.4 Optimizing Schema and Data Types
          `
          },
          {
            id: "replication",
            title: "主从复制与读写分离",
            minutes: 26,
            updated: "2026-09-17",
            applies: "MySQL 8.0",
            tags: ["复制", "读写分离", "GTID"],
            terms: ["主从", "读写分离", "复制", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.19 Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)（19.2 Replication Sources / 19.2.1 Binary Log File Position Based / 19.4.11 Semisynchronous Replication / 19.3 GTID-Based Replication）· [MySQL RM → 19.2.5 Replication Channels](https://dev.mysql.com/doc/refman/8.0/en/replication-channels.html)

## 一、复制的物理原理

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

三个线程构成完整链路。**主从延迟 = 网络传输 + relay log 落盘 + SQL 线程重放** 三段之和；生产中绝大多数延迟来自第三段（从库单线程重放追不上主库并发写）。

## 二、binlog 三种格式（官方 19.2.1.1）

| 格式 | 内容 | 优点 | 风险 |
|---|---|---|---|
| STATEMENT | 记录 SQL 语句 | 体积小 | ${C}NOW()${C}/${C}UUID()${C} 等不确定函数从库重放结果不一致 |
| **ROW（8.0 默认）** | 记录每行变更前后镜像 | 数据一致性最强 | 体积大（批量 UPDATE 千行 = 千条事件） |
| MIXED | 自动切换 | 折中 | 行为不可预期，不建议 |

生产推荐 **ROW + binlog_row_image=FULL**：一致性与审计（Canal/Flink CDC 依赖 ROW 格式解析行变更）。

## 三、GTID 复制（官方 19.3）

GTID = ${C}source_uuid:transaction_id${C}，给全局每个事务一个唯一编号，**换主从拓扑不再需要手找 binlog 位点**：

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

## 四、半同步复制（官方 19.4.11）

异步复制下主库宕机可能丢「已提交但未传到从库」的事务。半同步：主库等**至少一个从库收到 binlog（relay log 落盘）**再向客户端返回成功。

${F}sql
-- 主库
INSTALL PLUGIN rpl_semi_sync_source SONAME 'rpl_semi_sync_source.so';   -- 8.0.26+ 命名
SET GLOBAL rpl_semi_sync_source_enabled = 1;
SET GLOBAL rpl_semi_sync_source_timeout = 1000;   -- 1s 超时降级为异步
${F}

代价：每次提交多一个 RTT。平衡点：**核心库半同步 + 超时自动降级异步**（可用性优先时）或 **${C}AFTER_SYNC${C}（无损模式）+ 不降级**（一致性优先时）。

## 五、读写分离的正确姿势

1. **路由层**：应用内组件（ShardingSphere-JDBC）或独立代理（ProxySQL / MySQL Router）。
2. **延迟容忍分流**：写后立读强制走主（同会话）；报表/列表类走从。
3. **从库延迟告警**：${C}Seconds_Behind_Source${C} > 30s 告警；从库可开并行重放（${C}replica_parallel_workers${C}，基于 WRITESET 的组提交并行）。

## ⚠ 常见误区

1. **以为 ${C}Seconds_Behind_Source=0${C} 就没延迟**：它只比较 binlog 时间戳，大事务卡住时并不真实。更可靠：GTID 集差（${C}SELECT RECEIVED_TRANSACTION_SET vs EXECUTED_TRANSACTION_SET${C}）或心跳表方案。
2. **写后读不做主从一致性处理**：用户改完昵称刷新看不到——写后同会话读主，或用 GTID 等待（${C}WAIT_FOR_EXECUTED_GTID_SET${C}）。
3. **从库当灾备但不演练切换**：切换脚本没跑过 = 没有灾备。MHA/Orchestrator/Orch 的 failover 每季度演练。
4. **在从库上跑 DDL**：复制会把主库 DDL 同步过来，从库手动 DDL 会造成表结构冲突、复制中断。

## ✅ 自检清单

- [ ] ROW 格式 + GTID 开启，SOURCE_AUTO_POSITION=1
- [ ] 双 Yes + 延迟监控告警在跑
- [ ] 写后读有主从路由策略（同会话读主 / GTID 等待）
- [ ] 半同步或等价方案决策有明确记录
- [ ] 每季度切换演练通过

## 📚 延伸阅读

- MySQL 8.0 RM → Ch.19 Replication（19.2–19.5 全读）
- MySQL 8.0 RM → 19.3.3 GTID 复制的运维操作
- ProxySQL / MySQL Router 官方文档（读写分离路由层）
          `
          },
          {
            id: "redis-internals",
            title: "Redis 数据结构与持久化",
            minutes: 26,
            updated: "2026-09-17",
            applies: "Redis 7.x",
            tags: ["Redis", "持久化", "RDB", "AOF"],
            terms: ["Redis", "持久化", "RDB", "AOF"],
            body: `
> **官方文档基线**：[redis.io → Data Types](https://redis.io/docs/latest/develop/data-types/) · [redis.io → Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) · [redis.io → Scalinha/Latency 诊断](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/) · [redis.io → Key Eviction](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)

## 一、五大基础数据结构与其「真实」场景（redis.io → Data Types）

| 类型 | 底层编码（自动转换） | 高频场景 |
|---|---|---|
| String | int / embstr / raw | 计数器（${C}INCR${C}）、缓存 JSON、分布式锁 |
| Hash | listpack / hashtable | 对象字段级读写（用户资料） |
| List | listpack / quicklist | 消息队列简版（LPUSH+BRPOP）、时间线 |
| Set | intset / listpack / hashtable | 标签、共同关注（SINTER）、去重 |
| Sorted Set | listpack / skiplist | 排行榜（ZREVRANGE）、延迟队列（score=时间戳） |

补充三个高频进阶类型：**Bitmap**（签到、活跃统计）、**HyperLogLog**（UV 估算，误差 0.81%）、**Stream**（正式的消息队列，消费组支持）。

## 二、持久化：RDB 与 AOF 的官方口径

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

## 三、内存淘汰（Key Eviction）

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

## 四、单线程模型与延迟红线

Redis 命令执行是单线程（6.0+ 仅网络 IO 多线程），**任何一条慢命令都会阻塞所有请求**。官方 Latency 文档列出的延迟元凶按优先排查：

1. **大 Key**：单个 String > 10KB、集合元素 > 5000 的读删都是慢操作。排查：${C}redis-cli --bigkeys${C} / ${C}MEMORY USAGE key${C}。
2. **慢命令**：${C}KEYS *${C}、大集合的 ${C}SMEMBERS${C}、${C}SLOWLOG GET${C} 查元凶；${C}O(N)${C} 命令用 ${C}SCAN${C} 系列替代 ${C}KEYS${C}。
3. **fork**：RDB/AOF 重写期间；监控 ${C}latest_fork_usec${C}。
4. **Swap**：宿主机内存不足导致 Redis 进程被换出，性能断崖。${C}vm.swappiness=1${C}。

## 五、与 MySQL 组合的缓存三件套

- **Cache Aside**：读 → 缓存未命中查库回填；写 → 更新库后**删缓存**（不是更新缓存）。
- **穿透**：查不存在的 key 每次打到库 → 空值缓存（短 TTL）或布隆过滤器。
- **雪崩**：大量 key 同 TTL 过期 → TTL 加随机抖动；热点 key 突然过期 → 逻辑过期 + 异步刷新。

## ⚠ 常见误区

1. **RDB 与 AOF 只开一个**：只开 AOF 恢复慢（重放全部命令），只开 RDB 丢得多。混合持久化两个问题都解决。
2. **把 Redis 当主存储**：它是内存库，淘汰与故障都意味着数据可丢；主数据必须在 MySQL，Redis 只是加速层。
3. **分布式锁用 ${C}SETNX${C} 没有过期时间**：客户端崩溃锁永久卡死。正确姿势 ${C}SET key val NX EX 30${C}，释放时用 Lua 校验持有者，或直接用官方 RedLock 争议下的成熟方案（如 Redisson）。
4. **用 ${C}KEYS${C} 做运维巡检**：生产禁用；用 ${C}SCAN${C} 增量遍历。

## ✅ 自检清单

- [ ] RDB + AOF（混合持久化）双开，appendfsync=everysec
- [ ] maxmemory 与淘汰策略按场景明确设置（缓存 = allkeys-lru/lfu）
- [ ] 有大 Key 与慢命令的定期巡检（--bigkeys + SLOWLOG）
- [ ] latest_fork_usec 与宿主 swap 有监控
- [ ] 缓存穿透/雪崩/击穿三场景有明确对策
- [ ] 生产 ${C}KEYS${C} / ${C}FLUSHALL${C} 已通过 rename-command 禁用

## 📚 延伸阅读

- redis.io → Persistence（官方对两种方案取舍的权威论述）
- redis.io → Latency 诊断指南（一篇讲完所有延迟元凶）
- redis.io → Distributed Locks（官方对锁实现的说明与警告）
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
            minutes: 30,
            updated: "2026-09-17",
            applies: "MySQL 8.0 + ShardingSphere / Vitess",
            tags: ["分库分表", "ShardingSphere", "分区"],
            terms: ["分库分表", "ShardingSphere", "中间件", "MySQL"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.15 Partitioning](https://dev.mysql.com/doc/refman/8.0/en/partitioning.html) · [ShardingSphere → Concepts](https://shardingsphere.apache.org/document/current/en/concepts/) · [Vitess Concepts](https://vitess.io/docs/) · [Google F1 论文](https://research.google/pubs/pub41344/)（分库分表的鼻祖场景）

## 一、先分清三个概念

| 方案 | 谁来做 | 数据仍在一个实例吗 |
|---|---|---|
| **Partitioning（分区）** | MySQL 引擎内置 | 是（单实例内拆文件） |
| **Sharding（分片）** | 中间件 / 应用 | 否（跨实例跨库） |
| **NoSQL** | 换存储 | 否 |

**分区**解决单表文件与查询范围问题：${C}PARTITION BY RANGE${C}（时间序列归档）、${C}HASH${C}（打散热点）。限制：分区键必须是主键/唯一键的子集、跨分区查询仍单实例。

**分片**解决单实例容量与吞吐天花板：数据散到 N 个 MySQL 实例。**先分区后分片**——大多数业务走到分区就够了。

## 二、分片键选择：几乎不可逆的决策

${F}text
好分片键的三个条件：
1. 高基数（用户 id ✓ / 性别 ✗）
2. 高频查询都带它（带 user_id 查订单 ✓ / 运营全表扫 ✗）
3. 分布均匀（自增取模可以，但热点用户仍可能倾斜）
${F}

主流选择：**user_id 取模 / 一致性哈希**。代价：**跨片查询**（运营后台按订单号查 → 引入异构索引表或 ES）、**扩容再平衡**（取模方案扩容要迁移大量数据 → 用一致性哈希或翻倍扩容法）。

## 三、ShardingSphere 两种形态（官方 Concepts）

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

## 四、分片后立刻失去的能力（提前想清楚）

1. **跨片事务**：XA 太慢，落地是「本地事务 + 消息最终一致」（关联 Java 方向 Saga/Outbox 篇）。
2. **跨片 JOIN**：绑定表（同分片键的表）可以；广播表（小字典表）全片冗余；其他跨片 JOIN 基本要重设计。
3. **全局唯一 ID**：自增主键各片重复 → 雪花算法（Snowflake）或号段模式。
4. **COUNT/SUM 全局聚合**：汇总到中间件内存聚合，或异构到 ClickHouse。

## 五、Vitess 的不同思路

Vitess（YouTube 起家、CNCF 毕业项目）把分片做在**数据库代理 + VSchema** 层，应用完全无感，且内置 **Resharding** 工作流（在线迁移分片数）。如果你不想让业务代码感知分片，Vitess 或 TiDB（NewSQL，天然分片）是比手搭 ShardingSphere 更工程化的路线。

## ⚠ 常见误区

1. **上来就分 64 库 512 表**：过度设计。分区 + 读写分离 + 归档能撑到远超预期；分片的运维复杂度是数量级上升。
2. **分片键选成时间**：新数据全部打到最新的一个片，热点倾斜；时间只适合做分区键或二级路由。
3. **以为中间件能解决跨片 JOIN**：它只是把 JOIN 拆成多次查询再聚合，性能随片数恶化。数据模型要按分片重新设计。
4. **忘记录入再平衡方案**：取模分片从 8 扩到 16 = 90% 数据要迁移。翻倍扩容法（每片拆两半）能省一半迁移量。

## ✅ 自检清单

- [ ] 分区/读写分离/归档先做足，分片是最后手段
- [ ] 分片键经过三条件评审，跨片查询路径已设计
- [ ] 全局 ID 方案（雪花/号段）上线且单调趋势验证
- [ ] 绑定表/广播表策略明确成文
- [ ] 扩容再平衡方案（翻倍法/一致性哈希）有演练

## 📚 延伸阅读

- MySQL 8.0 RM → Ch.15 Partitioning（先读通分区限制）
- ShardingSphere → Concepts / Features（分片、弹性伸缩、分布式事务）
- Vitess → Resharding Workflow（在线扩容的参考实现）
          `
          },
          {
            id: "ha-dr",
            title: "高可用与容灾方案",
            minutes: 28,
            updated: "2026-09-17",
            applies: "MySQL 8.0 MGR / Redis Sentinel",
            tags: ["高可用", "容灾", "MGR"],
            terms: ["高可用", "容灾", "MGR", "主从"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.20 Group Replication](https://dev.mysql.com/doc/refman/8.0/en/group-replication.html) · [MySQL 8.0 RM → Ch.21 InnoDB Cluster](https://dev.mysql.com/doc/refman/8.0/en/mysql-innodb-cluster-introduction.html) · [redis.io → Replication / Sentinel / Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) · [Google SRE Workbook → Ch.5 Eliminating Toil（自动化的故障切换）](https://sre.google/workbook/eliminating-toil/)

## 一、高可用的度量：MTBF / MTTR / RTO / RPO

${F}text
可用性 A = MTBF / (MTBF + MTTR)
RTO（Recovery Time Objective）：故障后多久恢复服务
RPO（Recovery Point Objective）：最多丢多少数据（时间度量）
${F}

方案选型本质是**用成本换 RTO/RPO**：异步复制便宜但 RPO>0（可能丢数据），同步复制 RPO=0 但写延迟与吞吐上升。

## 二、MySQL 高可用方案光谱

| 方案 | 原理 | RPO | 适用 |
|---|---|---|---|
| 异步复制 + 手动切换 | binlog 重放 | >0 | 非核心、读扩展 |
| 半同步 + MHA | 选主脚本 | ≈0（半同步不丢） | 传统虚拟机时代主流 |
| **Group Replication (MGR)** | Paxos 多数派提交 | =0（多数派） | 官方新一代方案 |
| **InnoDB Cluster** | MGR + Router + Shell | =0 | 官方全家桶，推荐起点 |
| 云 RDS 多可用区 | 云厂商托管 | =0 | 云上直接用 |

## 三、MGR 核心机制（官方 Ch.20）

${F}text
事务提交 → 经 Paxos 广播到多数派成员 → 多数派 prepare → 提交
读：任意成员可读（注意读旧数据问题）
写：必须写入多数派 → 少数派分区自动只读
故障检测：成员 5s 无响应剔除
${F}

两种模式：**单主模式**（推荐，自动选主，应用无感切换）与多主模式（写冲突高发，慎用）。约束：仅 InnoDB、每表必须有主键、集群 ≤ 9 节点。

${F}sql
-- 最小可用集群配置（每节点）
plugin_load_add = 'group_replication.so'
group_replication_group_name = 'UUID'
group_replication_single_primary_mode = ON
group_replication_enforce_update_everywhere_checks = OFF
${F}

**InnoDB Cluster** = MGR（存储层）+ MySQL Router（应用接入，自动感知主库）+ AdminAPI（一键部署）。比 MGR 原生方案多的是**接入层自动化**——手工改连接串是切换慢的元凶。

## 四、Redis 高可用三级（redis.io 官方文档）

| 方案 | 原理 | 切换 |
|---|---|---|
| 主从复制 | replicaof，异步 | 手动 |
| **Sentinel** | 3+ 节点哨兵探测，自动选主 | 自动（客户端走 Sentinel 发现） |
| **Cluster** | 16384 slot 分片 + 主从自动迁移 | 自动 |

生产默认：**Sentinel（数据可全内存）**或 **Cluster（数据超单机容量）**。Sentinel 至少 3 节点跨机器部署（奇数防脑裂）；Cluster 每个主节点至少配 1 从。

## 五、容灾：两地三中心与演练

- **同机房**：防单机故障（MGR/半同步即可）。
- **同城两机房**：延迟 < 2ms，半同步跨机房可行，RPO=0。
- **异地（两地三中心）**：延迟大，只能异步复制 / binlog 归档，RPO>0（分钟级）。数据走「异步灾备 + 关键业务降级预案」。

SRE 纪律（Workbook Ch.5）：**故障切换必须自动化 + 定期演练**。人肉切换的 MTTR 以小时计，自动化以秒计；每季度一次「拔网线演习」。

## ⚠ 常见误区

1. **从库 = 高可用**：异步复制的数据可能落后，直接提升从库可能丢最后几秒数据。核心库用 MGR/半同步。
2. **MGR 三节点当万能**：多数派要求 2/3 存活，同机房三节点在机房级故障下全部失效——跨机房部署才真容灾。
3. **脑裂认知缺失**：网络分区时两「主」并存，双写数据分叉。仲裁（third-party / 多数派）与 STONITH 机制是防线。
4. **只演练正常切换，不演练「带病切换」**：真故障时主库不是干净下线，而是假死/半死。演练脚本必须包含「主库 hang 住」场景。

## ✅ 自检清单

- [ ] 方案有明确的 RTO/RPO 承诺并写入文档
- [ ] 接入层（Router/Proxy/VIP）自动感知主库切换
- [ ] 每季度真实故障演练（拔电源/拔网线/hang 住三种）
- [ ] 异地灾备链路监控（复制延迟、binlog 积压）
- [ ] 切换 Runbook 有图文步骤，新人可照做

## 📚 延伸阅读

- MySQL 8.0 RM → Ch.20 Group Replication / Ch.21 InnoDB Cluster / Ch.19.7 Switching Sources and Replicas（failover 流程）
- redis.io → Sentinel Documentation / Cluster Tutorial
- Google SRE Book → Ch.6 Distributed System Scheduling（故障域思维）
          `
          },
          {
            id: "capacity-bench",
            title: "容量规划与压测",
            minutes: 26,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Redis",
            tags: ["容量", "压测", "sysbench"],
            terms: ["容量", "压测", "规划", "性能"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → Ch.8 Optimization](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)（8.12 Measuring Performance / 8.12.2 Using Sysbench）· [Percona → Sysbench MySQL](https://www.percona.com/blog/using-sysbench-with-mysql/) · [Google SRE Book → Ch.4 SLO](https://sre.google/sre-book/service-level-objectives/) · [USE Method](http://www.brendangregg.com/usemethod.html)

## 一、容量规划的问题清单（SRE 口径）

规划不是拍数字，是回答四个问题：

1. **什么资源会先到顶？**（CPU / 内存 / IO / 连接数 / Buffer Pool）
2. **现在离到顶还有多久？**（按增长曲线外推）
3. **到顶前要做什么？**（扩容 / 优化 / 降级）
4. **到顶时系统怎么死？**（雪崩还是优雅降级）

MySQL 的资源画像：**OLTP 先顶内存（Buffer Pool）与连接数，批量报表先顶 IO**。

## 二、Buffer Pool 与内存规划（官方 Ch.17 InnoDB）

${F}ini
# 专用 MySQL 服务器：物理内存的 60~75% 给 Buffer Pool
innodb_buffer_pool_size = 24G     # 32G 机器示例
innodb_buffer_pool_instances = 8
innodb_log_file_size = 2G         # redo 大小影响写入吞吐
${F}

容量指标：**热数据集（活跃数据 + 热索引）能否装进 Buffer Pool**。装不进则大量磁盘随机读，QPS 天花板断崖。评估：${C}Innodb_buffer_pool_reads${C}（物理读）对比 ${C}Innodb_buffer_pool_read_requests${C}（逻辑读），命中率 < 99% 警戒。

## 三、压测工具：sysbench（官方 8.12.2 指定）

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

压测纪律：

1. **梯度加压**（16→32→64→128 线程），找到 QPS 拐点——拐点后延迟飙升而吞吐不再涨，那就是容量。
2. **数据量对齐生产**：空表压测的结果毫无意义（索引层级、缓存命中率全不同）。
3. **只读和读写分开压**：只读 QPS 反映缓存与索引能力，读写 QPS 反映磁盘与锁能力。

## 四、USE 方法：系统层资源排查

对每个资源问三问（Utilization 使用率 / Saturation 饱和度 / Errors 错误）：

${F}bash
CPU    : vmstat 1（us 高 = SQL 吃 CPU；wa 高 = IO 等待）
内存   : free -m + sar -B（swap in/out > 0 = 已饱和）
磁盘   : iostat -x 1（%util 接近 100 = 饱和；await > 10ms = 慢盘）
网络   : sar -n DEV（带宽 + retrans 重传）
连接   : SHOW STATUS LIKE 'Threads_%'（Threads_running 飙升 = 突发并发）
${F}

## 五、容量红线与告警基线（参考值）

| 指标 | 黄线 | 红线 |
|---|---|---|
| CPU 使用率（5min 均值） | 60% | 80% |
| Buffer Pool 命中率 | 99% | 98% |
| 磁盘空间 | 70% | 85%（预留 binlog 膨胀） |
| Threads_running | 核数×2 | 核数×4 |
| 慢查询数/分钟 | 环比 +50% | 基线×3 |

## ⚠ 常见误区

1. **压测环境与生产配置不同档**：本地 NVMe 压出的数字对云端 SATA 盘毫无参考。配置差异（CPU 型号 / 磁盘类型 / 网络）逐一记录。
2. **只压一次不建基线**：容量是过程量——每次大促前复压，与基线对比退化。
3. ** forgetting 压「故障态」**：主库宕机切从后，从库容量是否扛得住全量流量？这是最真实的容量考验。
4. **把峰值当稳态**：促销日 5 倍流量持续 4 小时 ≠ 全年可承受 5 倍；配合降级预案（关闭非核心写入）一起设计。

## ✅ 自检清单

- [ ] sysbench 基线建立，QPS 拐点已知并成档
- [ ] Buffer Pool 命中率 / Threads_running / 磁盘有红线告警
- [ ] 数据增长模型（月增量）与到顶时间有外推表
- [ ] 大促前复压并演练故障态容量
- [ ] 降级预案（非核心功能开关）与容量一起设计

## 📚 延伸阅读

- MySQL 8.0 RM → 8.12 Measuring Performance / 8.12.2 Using Sysbench
- Google SRE Book → Ch.4 Service Level Objectives（容量规划与 SLO 的关系）
- Brendan Gregg → USE Method（系统资源排查方法论）
          `
          },
          {
            id: "migration-doublewrite",
            title: "数据迁移与双写",
            minutes: 30,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / gh-ost / Canal",
            tags: ["迁移", "双写", "Online DDL"],
            terms: ["迁移", "双写", "数据", "一致性"],
            body: `
> **官方文档基线**：[MySQL 8.0 RM → 15.12 Online DDL](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl.html) · [gh-ost](https://github.com/github/gh-ost) · [pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html) · [Alibaba Canal](https://github.com/alibaba/canal)（binlog 异构迁移）

## 一、先分清两类「迁移」

| 场景 | 问题本质 | 工具 |
|---|---|---|
| **表结构变更**（加列/改索引） | 大表 DDL 锁表 | Online DDL / gh-ost / pt-osc |
| **跨库跨实例搬迁** | 数据量大 + 不可停服 | 全量 + 增量 binlog + 双写切换 |

## 二、Online DDL 的能力与边界（官方 15.12）

8.0 的 Online DDL 大多数操作 ALGORITHM=INPLACE 且允许并发 DML，但有硬边界：

- **加列**：INSTANT（8.0.12+，秒级，只改元数据）✅
- **加索引**：INPLACE，允许 DML ✅
- **改列类型**：只能 COPY（锁写）❌
- **改字符集**：COPY ❌

${F}sql
-- 显式声明算法与锁策略：宁可报错也不意外锁表
ALTER TABLE orders ADD COLUMN remark VARCHAR(255) DEFAULT '',
  ALGORITHM=INSTANT;
ALTER TABLE orders ADD INDEX idx_status (status),
  ALGORITHM=INPLACE, LOCK=NONE;
${F}

COPY 类操作在亿级表上 = 数小时锁写，此时用 **gh-ost / pt-osc**（影子表方案）：

${F}text
1. 建影子表 _orders_new（新结构）
2. 拷贝存量数据（分批）
3. 通过 binlog 捕获增量同步到影子表（gh-ost 核心优势）
4. 原子 RENAME 切换（瞬间完成）
5. 删除旧表
${F}

gh-ost 优势：**可暂停、可限流、不使用触发器**（pt-osc 用触发器，对写放大明显）。

## 三、跨实例迁移：全量 + 增量 + 双写切换

${F}text
阶段① 全量迁移     : 快照导出导入（mysqldump / XtraBackup / DTS）
阶段② 增量同步     : binlog CDC（Canal/Debezium）追平
阶段③ 双写         : 应用同时写新旧库，以旧库为准
阶段④ 一致性校验   : pt-table-checksum 比对（下一篇）
阶段⑤ 灰度切读     : 按比例把读流量切到新库，比对结果
阶段⑥ 切写         : 新库为准，旧库降为只读
阶段⑦ 下线旧库     : 观察一个业务周期后回收
${F}

双写的实现要点：

- **顺序**：先写旧库成功，再写新库（新库失败仅告警不影响主流程）——保证旧库数据完整，新库可重建。
- **幂等**：CDC 重放可能重复，目标端按主键 UPSERT。
- **事务边界**：两库写不追求分布式事务，靠「以谁为准 + 对账修复」收敛。

## 四、迁移 Runbook 模板（照抄可用）

${F}text
[ ] 冻结窗口申报（影响面评估）
[ ] 全量导出耗时实测（决定窗口时长）
[ ] 增量延迟监控（< 1s 才可进入切读）
[ ] 回滚方案：新库异常 → 切回旧库（旧库保持双写期间的数据完整）
[ ] 灰度比例与观察指标（错误率 / 延迟 / 数据比对）
[ ] 切换后 24h 值守（慢查询 / 容量 / 一致性抽样）
${F}

## ⚠ 常见误区

1. **直接 ALTER 亿级大表**：COPY 类 DDL 锁写数小时；先看 15.12 表格确认 ALGORITHM，再决定是否上 gh-ost。
2. **双写期间旧库还能直连变更**：双写期「以旧为准」的窗口内，任何绕过双写入口的写入都会造成分叉。冻结期明确到表级。
3. **切读不做比对**：读流量切过去不看结果对不对，等于裸奔。灰度期抽样比对响应数据。
4. **回滚方案只写在文档里没演练过**：切回旧库时旧库已只读数小时，能否秒级重新开放写入？演练过才算有回滚。

## ✅ 自检清单

- [ ] 所有 DDL 明确 ALGORITHM 与 LOCK 策略
- [ ] 大表结构变更有 gh-ost/pt-osc 操作记录（含限流参数）
- [ ] 迁移按七阶段推进，每阶段有验收标准
- [ ] 双写顺序与幂等设计成文
- [ ] 回滚方案演练过

## 📚 延伸阅读

- MySQL 8.0 RM → 15.12 InnoDB Online DDL Operations（ALGORITHM 能力矩阵）
- gh-ost README（设计理念与可暂停性）
- Debezium Documentation（开源 CDC 生态，跨库通用）
          `
          },
          {
            id: "consistency-check",
            title: "数据一致性校验",
            minutes: 24,
            updated: "2026-09-17",
            applies: "MySQL 8.0 / Percona Toolkit",
            tags: ["一致性", "对账", "校验"],
            terms: ["一致性", "校验", "对账", "数据"],
            body: `
> **官方文档基线**：[Percona Toolkit → pt-table-checksum](https://docs.percona.com/percona-toolkit/pt-table-checksum.html) · [pt-table-sync](https://docs.percona.com/percona-toolkit/pt-table-sync.html) · [MySQL 8.0 RM → 19.5.1.30 Replication and Transaction Inconsistencies](https://dev.mysql.com/doc/refman/8.0/en/replication-features-transactions.html) · [Google SRE Book → Ch.26 Data Integrity](https://sre.google/sre-book/data-integrity/)

## 一、为什么需要主动校验

复制是「尽力而为」的传输：网络闪断、从库磁盘坏块、人为在从库改数据、版本差异的 SQL 行为不同——都可能导致主从数据悄悄分叉。**分叉不会自己告警**，只会某天以「用户余额对不上」的形式爆发。所以一致性校验是 DBA 的例行体检，不是事故后的补救。

## 二、pt-table-checksum：主从一致性标准工具

原理：在**主库**上按表分块（chunk）计算 CRC32 校验和写入 ${C}percona.checksums${C} 表，校验动作本身通过复制传到从库**重放**，从库算出的值与主库不同即分叉。这样天然规避了「主库算完再单独连从库算」的时间窗不一致问题。

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

## 三、双写/迁移场景的业务对账

pt-table-checksum 只解决主从复制一致性；双写与迁移的**跨库对账**需要自建：

${F}text
对账系统三件套：
1. 定时对账（T+1 全量）：按主键范围分批，比关键字段 checksum
2. 实时对账（T+0 抽样）：对关键写路径（支付/库存）双写后立即比对
3. 差异处理：登记 → 自动修复（以权威侧为准）→ 人工复核不可自动修复的
${F}

设计要点：

- **权威侧明确**：每类数据谁是 Source of Truth（资金类通常以银行流水为准，而不是任一数据库）。
- **对账幂等且可重跑**：按日期分片，失败可单日重跑。
- **全量比对用 checksum 而非逐字段下载**：${C}CRC32(CONCAT_WS('#', col1, col2, ...))${C} 分块聚合，网络开销小两个数量级。

## 四、Redis 与 MySQL 的一致性

缓存场景追求**最终一致**即可：

1. 写库成功 → 删缓存（Cache Aside）。
2. 删除失败 → 消息队列重试 / binlog 订阅（Canal）补偿删除。
3. 兜底：TTL 到期自动失效——**任何缓存最终会自然收敛，前提是所有 key 都设了 TTL**（没有 TTL 的 key 是一致性黑洞）。

## ⚠ 常见误区

1. **主从延迟大时跑 pt-table-checksum**：校验和依赖复制传输，延迟大时误报剧增。先确认 ${C}Seconds_BehindSource ≈ 0${C}。
2. **pt-table-sync 直接 --execute**：它会改主库数据；先 ${C}--print${C} 预览、备份目标表、选低峰执行。
3. **对账系统只报差异不闭环**：差异无人修复 = 对账白做。差异必须进工单/告警，有 owner 有 SLA。
4. **以为 ROW 格式复制不会分叉**：ROW 只是消除不确定函数问题；磁盘坏块、人为改动、字符集差异仍会分叉。校验仍是必需。

## ✅ 自检清单

- [ ] pt-table-checksum 每周例行，DIFFS 有告警
- [ ] 双写/迁移有对账三件套（定时/实时/差异闭环）
- [ ] 每类数据的权威侧（Source of Truth）明确成文
- [ ] 所有 Redis key 都设 TTL
- [ ] 对账差异的修复 SLA 与 owner 落实

## 📚 延伸阅读

- Percona Toolkit → pt-table-checksum / pt-table-sync 全文档（含原理图）
- Google SRE Book → Ch.26 Data Integrity（对账哲学：不仅比数据，还比「不变量」）
- MySQL 8.0 RM → Ch.19.5 Replication Notes and Tips（哪些场景天生不一致）
          `
          }
        ]
      }
    ]
  };

  window.DBA = DBA;
})();
