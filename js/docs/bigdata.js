/* =========================================================================
 *  js/docs/bigdata.js — 技术教程「大数据」方向数据
 *
 *  章节骨架参考：
 *    · Apache Hadoop / Hive / Spark / Kafka / Flink 官方文档
 *    · 《大数据之路：阿里巴巴大数据实践》的数仓分层与建模方法
 *    · ClickHouse、Apache Doris、Apache Iceberg、Apache Paimon 官方文档
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 *  ⚠ shell 里的变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const BIGDATA = {
    id: "bigdata",
    name: "大数据",
    icon: "📊",
    desc: "从 Hadoop 生态和 Hive SQL 入门，到数仓分层建模、Spark 批处理、Kafka 消息队列、Flink 实时计算，再到 ClickHouse/Doris 实时分析和 Iceberg/Paimon 湖仓一体。按各项目官方文档和国内大厂数仓实践组织。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "理解大数据生态全景，会写 Hive SQL，掌握数仓分层与维度建模。",
        chapters: [
          // <bd-basic>
          {
            id: "bd-overview",
            title: "大数据生态全景：Hadoop、HDFS 与 YARN",
            minutes: 14,
            updated: "2026-11-20",
            applies: "Hadoop 3.x",
            tags: ["大数据", "Hadoop", "HDFS"],
            terms: ["Hadoop", "HDFS", "YARN", "MapReduce"],
            body: `
> **官方文档基线**：[Apache Hadoop 文档](https://hadoop.apache.org/docs/stable/) · [HDFS Architecture](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html) · [Apache Hadoop YARN](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/YARN.html)

## 一、为什么需要大数据技术

单台 MySQL 处理几千万行没问题，但当日志、埋点、交易流水每天新增 TB 级别时，单机的磁盘、内存和 CPU 都不够用。大数据技术的核心思路只有一条：**把数据切开，分散到很多台普通机器上存储和计算**。

## 二、生态全景

| 层次 | 解决什么问题 | 主流组件 |
| --- | --- | --- |
| 采集 | 把业务库、日志、埋点搬进来 | Flume、Canal、Flink CDC、DataX、Kafka |
| 存储 | 海量数据可靠落盘 | HDFS、对象存储（S3/OSS/BOS）、HBase |
| 资源调度 | 给计算任务分配 CPU 和内存 | YARN、Kubernetes |
| 计算 | 批处理与流处理 | MapReduce、Hive、Spark、Flink |
| 查询分析 | 秒级交互查询 | ClickHouse、Doris、StarRocks、Trino |
| 表格式 | 让数据湖支持更新和事务 | Iceberg、Paimon、Hudi、Delta Lake |
| 调度治理 | 任务依赖、元数据、血缘 | DolphinScheduler、Airflow、Atlas |

一条典型链路：业务库通过 CDC 进入 Kafka，Flink 实时清洗写入数仓，Spark/Hive 每天跑批汇总，结果导入 Doris 给 BI 报表查询。

## 三、HDFS：分布式文件系统

- **NameNode**：管理元数据，记录每个文件由哪些块组成、块在哪些机器上。
- **DataNode**：实际存放数据块，默认块大小 128MB，每块默认 **3 副本**。
- 写入时客户端按管道（pipeline）依次写三个副本；读取时就近选一个副本。
- NameNode 是单点，生产环境用 HA 方案：Active/Standby 两个 NameNode，加 JournalNode 同步编辑日志，ZooKeeper 负责故障切换。

${F}bash
hdfs dfs -mkdir -p /warehouse/ods
hdfs dfs -put access.log /warehouse/ods/
hdfs dfs -ls -h /warehouse/ods
hdfs fsck /warehouse/ods/access.log -files -blocks -locations
${F}

HDFS 适合**一次写入、多次读取的大文件**，不适合大量小文件（每个文件都占 NameNode 内存），也不支持随机修改。

## 四、YARN：资源调度

| 角色 | 职责 |
| --- | --- |
| ResourceManager | 全局资源管理和调度 |
| NodeManager | 每台机器上的代理，启动和监控容器 |
| ApplicationMaster | 每个作业一个，向 RM 申请资源并管理任务 |
| Container | 资源分配单位（CPU + 内存） |

调度器常用 Capacity Scheduler（按队列划分资源比例）和 Fair Scheduler（公平分配）。

## 五、MapReduce 的思想

MapReduce 把计算拆成 Map（按 key 打散处理）、Shuffle（相同 key 汇聚到同一节点）、Reduce（聚合）三步。它本身已经很少直接使用，但 **Shuffle 是所有分布式计算的性能瓶颈**，理解它对学习 Spark 和 Flink 很重要。

## ⚠ 误区

- **「Hadoop 已经过时」**：MapReduce 用得少了，但 HDFS 和 YARN 仍广泛存在；云上则越来越多用对象存储加 Kubernetes 替代它们。
- **小文件问题被忽视**：几千万个小文件会拖垮 NameNode，入库时要合并。

## ✅ 自检清单

- 能画出采集、存储、计算、查询的分层，并给每层举出两个组件。
- 能解释 NameNode、DataNode 和三副本写入流程。
- 能说清 YARN 各角色的职责和 Shuffle 的含义。

## 📚 延伸阅读

- Google 论文：The Google File System、MapReduce
- 《Hadoop 权威指南》
`
          },
          {
            id: "bd-hive",
            title: "Hive SQL：分区、分桶、文件格式与常用函数",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Hive 3.x / 4.x · Spark SQL 兼容",
            tags: ["大数据", "Hive", "SQL"],
            terms: ["Hive", "分区", "HiveSQL", "窗口函数"],
            body: `
> **官方文档基线**：[Apache Hive Language Manual](https://cwiki.apache.org/confluence/display/Hive/LanguageManual) · [Hive DDL](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL) · [Hive Windowing and Analytics](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics)

## 一、Hive 是什么

Hive 把 HDFS 上的文件映射成表，让人用 SQL 做离线分析。SQL 会被翻译成 MapReduce、Tez 或 Spark 任务执行。元数据（表名、字段、分区、文件位置）存在 **Hive Metastore** 里，Spark、Trino、Flink 也都复用这套元数据，所以它是离线数仓的事实标准。

## 二、建表：内部表、外部表与分区

${F}sql
CREATE EXTERNAL TABLE IF NOT EXISTS ods.ods_order_di (
    order_id    BIGINT  COMMENT '订单 ID',
    user_id     BIGINT  COMMENT '用户 ID',
    amount      DECIMAL(16,2),
    status      STRING,
    create_time STRING
)
COMMENT '订单增量表'
PARTITIONED BY (dt STRING)
STORED AS ORC
LOCATION '/warehouse/ods/ods_order_di'
TBLPROPERTIES ('orc.compress'='SNAPPY');
${F}

| 概念 | 说明 |
| --- | --- |
| 内部表 | DROP 时数据一起删除 |
| 外部表 | DROP 只删元数据，数据保留，ODS 层通常用外部表 |
| 分区 | 按目录切分，如 ${C}dt=2026-11-20${C}；查询带分区条件时只扫对应目录 |
| 分桶 | 按字段哈希切成固定数量文件，用于抽样和分桶 Join |

**分区裁剪**是 Hive 最重要的优化：查询忘了写 ${C}WHERE dt = ...${C} 会扫全表。

## 三、文件格式

| 格式 | 存储方式 | 特点 |
| --- | --- | --- |
| TextFile | 行式文本 | 可读，体积大，查询慢 |
| ORC | 列式 | Hive 首选，自带索引和统计信息 |
| Parquet | 列式 | 跨引擎通用，Spark 默认 |

列式存储只读查询用到的列，并且同列数据压缩率高，分析场景通常比行式快数倍。

## 四、高频 SQL 写法

${F}sql
-- 每个用户最近一笔订单（窗口函数取 Top 1）
SELECT order_id, user_id, amount
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY create_time DESC) AS rn
    FROM dwd.dwd_order_di
    WHERE dt = '2026-11-20'
) t
WHERE rn = 1;

-- 连续登录 3 天的用户：日期减去行号，连续的日期结果相同
SELECT user_id
FROM (
    SELECT user_id, dt,
           DATE_SUB(dt, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY dt)) AS grp
    FROM dws.dws_user_login_1d
) t
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;

-- 动态分区写入
SET hive.exec.dynamic.partition.mode=nonstrict;
INSERT OVERWRITE TABLE dwd.dwd_order_di PARTITION (dt)
SELECT order_id, user_id, amount, status, create_time, dt FROM ods.ods_order_di;
${F}

| 函数 | 区别 |
| --- | --- |
| ${C}ROW_NUMBER${C} | 1,2,3,4，不并列 |
| ${C}RANK${C} | 1,2,2,4，并列后跳号 |
| ${C}DENSE_RANK${C} | 1,2,2,3，并列不跳号 |
| ${C}LAG / LEAD${C} | 取前一行或后一行，算环比、间隔 |

## ⚠ 踩坑

- 小表放 Join 右边并开启 ${C}hive.auto.convert.join${C}，走 Map Join，避免 Shuffle。
- ${C}COUNT(DISTINCT)${C} 在大表上只有一个 Reducer，改写为先 GROUP BY 再 COUNT。
- ${C}INSERT OVERWRITE${C} 写错分区会覆盖历史数据，执行前确认分区值。

## ✅ 自检清单

- 能写出带分区、ORC 格式的外部表 DDL。
- 能用窗口函数解决 Top N 和连续登录问题。
- 能说出 ROW_NUMBER、RANK、DENSE_RANK 的区别。

## 📚 延伸阅读

- Hive 官方文档：LanguageManual Joins
- Spark SQL 文档：Hive Tables
`
          },
          {
            id: "bd-warehouse",
            title: "数仓分层与维度建模：ODS、DWD、DWS、ADS",
            minutes: 15,
            updated: "2026-11-20",
            applies: "通用方法论",
            tags: ["大数据", "数仓", "建模"],
            terms: ["数仓", "维度建模", "事实表", "拉链表"],
            body: `
> **官方文档基线**：[Kimball Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) · 《大数据之路：阿里巴巴大数据实践》 · [阿里云 DataWorks 数仓分层规范](https://help.aliyun.com/zh/dataworks/)

## 一、为什么要分层

![数仓分层](/assets/diagrams/docs/dw-layers.svg)

如果每个报表都直接从业务库原始表算起，同一个「GMV」会被十个人用十种口径算出十个数。分层的目的是：**清洗一次、复用多次，口径统一，问题可追溯**。

| 层 | 全称 | 做什么 | 示例表 |
| --- | --- | --- | --- |
| ODS | 操作数据层 | 原样接入业务数据，保留历史 | ${C}ods_order_di${C} |
| DWD | 明细数据层 | 清洗、去重、统一编码，按业务过程建事实表 | ${C}dwd_trade_order_detail_di${C} |
| DWS | 汇总数据层 | 按主题和粒度轻度汇总 | ${C}dws_trade_user_order_1d${C} |
| ADS | 应用数据层 | 面向具体报表和接口的结果 | ${C}ads_gmv_by_city${C} |
| DIM | 公共维度层 | 用户、商品、地区等维度表 | ${C}dim_user_zip${C} |

表名一般按「层_主题域_内容_更新方式」命名，di 表示每日增量，df 表示每日全量。

## 二、维度建模：事实表与维度表

Kimball 维度建模是互联网数仓最常用的方法，四步走：**选择业务过程 → 声明粒度 → 确定维度 → 确定事实**。

- **事实表**：记录业务事件和度量值，如订单金额、数量，行数多、字段窄。
- **维度表**：描述事件的上下文，如用户的城市、商品的类目，行数少、字段宽。
- **星型模型**：事实表直接关联各维度表，查询简单，最常用。雪花模型把维度再规范化拆分，Join 更多，用得少。

| 事实表类型 | 特点 | 例子 |
| --- | --- | --- |
| 事务型 | 每个事件一行，最常见 | 下单明细 |
| 周期快照 | 定期记录状态 | 每日账户余额 |
| 累积快照 | 一行记录完整生命周期，多次更新 | 订单从下单到签收各时间点 |

## 三、缓慢变化维与拉链表

用户的城市会变，但历史订单要按当时的城市统计。**拉链表**（SCD Type 2）为每个版本记录生效区间：

| user_id | city | start_date | end_date |
| --- | --- | --- | --- |
| 1001 | 北京 | 2025-01-01 | 2026-06-30 |
| 1001 | 上海 | 2026-07-01 | 9999-12-31 |

${F}sql
-- 查询 2026-03-01 时用户所在城市
SELECT user_id, city FROM dim.dim_user_zip
WHERE start_date <= '2026-03-01' AND end_date >= '2026-03-01';
${F}

## 四、指标体系

- **原子指标**：业务过程 + 度量，如「支付金额」。
- **派生指标**：原子指标 + 时间周期 + 修饰词，如「最近 7 天 iOS 端支付金额」。
- 每个指标在指标字典里登记唯一口径，避免同名不同义。

## ⚠ 误区

- **层越多越好**：小团队 ODS、DWD、ADS 三层就够，过度分层只会拉长链路。
- **ADS 直接读 ODS**：跳层开发会让口径再次分散。
- **全量快照存所有历史**：大维度表每天全量存储成本很高，用拉链表压缩。

## ✅ 自检清单

- 能说出 ODS、DWD、DWS、ADS 各层职责并给出表名示例。
- 能用维度建模四步设计一张订单事实表。
- 能解释拉链表的结构和查询方式。

## 📚 延伸阅读

- Ralph Kimball《The Data Warehouse Toolkit》
- 《大数据之路》第 9~11 章：数据模型
`
          },
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "掌握 Spark 批处理调优、Kafka 消息系统和 Flink 实时计算。",
        chapters: [
          // <bd-mid>
          {
            id: "bd-spark",
            title: "Spark：RDD、DataFrame、Shuffle 与数据倾斜",
            minutes: 17,
            updated: "2026-11-20",
            applies: "Spark 3.5 / 4.0",
            tags: ["大数据", "Spark", "调优"],
            terms: ["Spark", "RDD", "Shuffle", "数据倾斜"],
            body: `
> **官方文档基线**：[Spark SQL, DataFrames and Datasets Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html) · [RDD Programming Guide](https://spark.apache.org/docs/latest/rdd-programming-guide.html) · [Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)

## 一、Spark 为什么比 MapReduce 快

MapReduce 每一步都把中间结果写回磁盘；Spark 把多个步骤组成一个 **DAG**，中间结果尽量放在内存里，迭代计算和交互查询能快几倍到几十倍。现在离线数仓的大部分任务都跑在 Spark SQL 上。

## 二、核心概念

| 概念 | 含义 |
| --- | --- |
| Driver | 运行 main 函数，生成执行计划、调度任务 |
| Executor | 集群上的工作进程，执行 Task 并缓存数据 |
| RDD | 不可变的分布式数据集，记录血缘，丢失分区可重新计算 |
| DataFrame | 带 Schema 的分布式表，经过 Catalyst 优化器，**优先使用** |
| 转换（Transformation） | map、filter、join 等，惰性执行 |
| 行动（Action） | count、collect、write 等，触发真正计算 |
| Job / Stage / Task | 一个 Action 生成一个 Job；按 Shuffle 切分 Stage；每个分区一个 Task |

## 三、PySpark 示例

${F}python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("gmv").enableHiveSupport().getOrCreate()

orders = spark.table("dwd.dwd_order_di").where(F.col("dt") == "2026-11-20")
users = spark.table("dim.dim_user")

result = (orders.join(F.broadcast(users), "user_id")   # 小表广播，避免 Shuffle
                .groupBy("city")
                .agg(F.sum("amount").alias("gmv"),
                     F.countDistinct("user_id").alias("buyers")))

result.write.mode("overwrite").saveAsTable("ads.ads_gmv_by_city")
${F}

## 四、窄依赖、宽依赖与 Shuffle

- **窄依赖**：父分区只被一个子分区使用（map、filter），可以在同一个 Stage 里流水线执行。
- **宽依赖**：父分区被多个子分区使用（groupBy、join、distinct），需要 **Shuffle**：上游把数据按 key 写到本地磁盘，下游通过网络拉取。

Shuffle 涉及磁盘 IO、序列化和网络传输，是 Spark 作业最慢的部分。调优的第一原则就是减少 Shuffle 次数和数据量。

## 五、数据倾斜

现象：大部分 Task 几秒完成，个别 Task 跑几十分钟，原因是某几个 key 的数据量远大于其他 key（比如 user_id 为空值、某个大客户）。

| 方案 | 做法 |
| --- | --- |
| 开启 AQE | Spark 3 的 ${C}spark.sql.adaptive.skewJoin.enabled=true${C}，自动拆分倾斜分区 |
| 过滤异常 key | 空值、测试账号先过滤或单独处理 |
| 广播 Join | 一侧是小表时直接广播，彻底消除 Shuffle |
| 加盐打散 | 给倾斜 key 加随机前缀分散聚合，再去掉前缀二次聚合 |

${F}sql
-- 两阶段聚合：先加盐局部聚合，再全局聚合
SELECT key, SUM(cnt) FROM (
    SELECT key, salt, COUNT(*) AS cnt
    FROM (SELECT key, CAST(RAND() * 10 AS INT) AS salt FROM t) a
    GROUP BY key, salt
) b GROUP BY key;
${F}

## 六、常用参数

| 参数 | 建议 |
| --- | --- |
| ${C}spark.sql.shuffle.partitions${C} | 默认 200，按数据量调整，或交给 AQE 自动合并 |
| ${C}spark.executor.memory / cores${C} | 每个 Executor 4~8 核较常见 |
| ${C}spark.sql.autoBroadcastJoinThreshold${C} | 默认 10MB，可适当调大 |

## ⚠ 踩坑

- 对大表 ${C}collect()${C}，数据全部拉到 Driver，直接 OOM。
- 输出大量小文件：写入前用 ${C}repartition${C} 或 ${C}coalesce${C} 控制文件数。
- 同一个 DataFrame 被多次使用却没 cache，会重复计算。

## ✅ 自检清单

- 能解释 Job、Stage、Task 的划分依据。
- 能说出宽依赖为什么产生 Shuffle，以及 Shuffle 的代价。
- 能给出至少三种数据倾斜的处理方法。

## 📚 延伸阅读

- Spark 官方文档：Adaptive Query Execution
- 论文：Resilient Distributed Datasets（NSDI 2012）
`
          },
          {
            id: "bd-kafka",
            title: "Kafka：Topic、分区、副本与消息可靠性",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Kafka 3.x / 4.x（KRaft）",
            tags: ["大数据", "Kafka", "消息队列"],
            terms: ["Kafka", "消息队列", "分区", "消费者组"],
            body: `
> **官方文档基线**：[Apache Kafka Documentation](https://kafka.apache.org/documentation/) · [Kafka Design](https://kafka.apache.org/documentation/#design) · [KRaft](https://kafka.apache.org/documentation/#kraft)

## 一、Kafka 是什么

Kafka 是分布式的**提交日志**：消息按顺序追加到磁盘，可以被多个下游反复读取。它是实时数仓的数据总线，也常用作业务系统的消息队列，单集群可以支撑每秒百万级消息。

## 二、架构

![Kafka 架构](/assets/diagrams/docs/kafka-arch.svg)

| 概念 | 说明 |
| --- | --- |
| Broker | 一台 Kafka 服务器 |
| Topic | 消息的逻辑分类，如 ${C}order_events${C} |
| Partition | Topic 的物理分片，**分区内有序**，分区之间无序 |
| Offset | 消息在分区内的序号 |
| Replica | 分区的副本，分 Leader 和 Follower，读写都走 Leader |
| ISR | 与 Leader 保持同步的副本集合 |
| Consumer Group | 同组消费者分摊分区，一个分区同一时刻只被组内一个消费者消费 |

Kafka 4.0 起完全移除 ZooKeeper，元数据由内置的 **KRaft** 控制器管理。

## 三、为什么这么快

1. **顺序写磁盘**：只追加不修改，顺序 IO 接近内存速度。
2. **页缓存**：读写依赖操作系统 Page Cache，不在 JVM 堆里缓存数据。
3. **零拷贝**：消费时用 sendfile 把数据从页缓存直接发到网卡。
4. **批量和压缩**：生产者攒批发送，支持 lz4、zstd 压缩。

## 四、常用命令

${F}bash
kafka-topics.sh --bootstrap-server localhost:9092 --create \\
  --topic order_events --partitions 12 --replication-factor 3

kafka-console-producer.sh --bootstrap-server localhost:9092 --topic order_events
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic order_events --from-beginning

# 查看消费积压（LAG 列）
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group order-etl
${F}

## 五、消息可靠性

| 环节 | 防丢配置 |
| --- | --- |
| 生产者 | ${C}acks=all${C}，${C}enable.idempotence=true${C}，配合重试 |
| Broker | ${C}replication.factor=3${C}，${C}min.insync.replicas=2${C}，${C}unclean.leader.election.enable=false${C} |
| 消费者 | 关闭自动提交，**业务处理成功后再提交 offset** |

三种投递语义：

- **至多一次**：先提交 offset 再处理，可能丢消息。
- **至少一次**：先处理再提交，可能重复，是最常见的选择，下游要做幂等。
- **精确一次**：幂等生产者 + 事务，配合 Flink 两阶段提交实现端到端 Exactly-Once。

## 六、分区与顺序

- 需要同一订单的消息有序时，用订单 ID 作为消息 key，同一 key 总会进入同一分区。
- 分区数决定消费并行度上限：12 个分区最多 12 个消费者同时工作。
- 消费者加入或退出会触发 **Rebalance**，期间暂停消费；处理过慢超过 ${C}max.poll.interval.ms${C} 也会被踢出组。

## ⚠ 踩坑

- **消费积压**：先看 LAG，再判断是消费逻辑慢还是分区太少；扩消费者数不能超过分区数。
- **消息重复**：至少一次语义下重复是必然的，按业务主键去重或用 upsert 写入。
- **分区数随意调大**：分区只能增不能减，增加后 key 的分区映射会改变，影响顺序。

## ✅ 自检清单

- 能画出 Broker、Topic、Partition、Consumer Group 的关系。
- 能说出 Kafka 高吞吐的四个原因。
- 能从生产者、Broker、消费者三端配置不丢消息。

## 📚 延伸阅读

- Kafka 官方文档：Semantics 与 Replication 章节
- Confluent Developer：Kafka 101
`
          },
          {
            id: "bd-flink",
            title: "Flink 实时计算：时间、窗口、状态与 Exactly-Once",
            minutes: 18,
            updated: "2026-11-20",
            applies: "Flink 1.20 / 2.x",
            tags: ["大数据", "Flink", "实时计算"],
            terms: ["Flink", "Watermark", "Checkpoint", "实时计算"],
            body: `
> **官方文档基线**：[Apache Flink Documentation](https://nightlies.apache.org/flink/flink-docs-stable/) · [Timely Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/) · [Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/)

## 一、为什么是 Flink

Spark Streaming 把流切成小批处理，延迟通常在秒级。Flink 是**真正的逐条流处理**，延迟可到毫秒级，同时提供完善的状态管理和精确一次语义，是国内实时数仓、实时风控、实时大屏的主流引擎。

## 二、运行架构

![Flink 架构](/assets/diagrams/docs/flink-arch.svg)

| 组件 | 职责 |
| --- | --- |
| JobManager | 把作业转成执行图，调度任务，协调 Checkpoint |
| TaskManager | 工作进程，提供若干 Task Slot 执行算子 |
| Slot | 资源隔离单位；作业并行度受总 Slot 数限制 |

部署模式常用 **Application 模式**跑在 YARN 或 Kubernetes 上，每个作业独立集群，互不影响。

## 三、时间语义与 Watermark

| 时间 | 含义 |
| --- | --- |
| 事件时间 | 事件实际发生的时间，写在数据里，**结果可复现，最常用** |
| 处理时间 | 数据到达 Flink 机器的时间，简单但结果不确定 |

网络延迟会让数据乱序到达。**Watermark** 是一个随数据推进的时间戳，含义是「早于这个时间的数据基本到齐了」。窗口在 Watermark 越过窗口结束时间时触发计算。

${F}sql
CREATE TABLE orders (
    order_id   BIGINT,
    user_id    BIGINT,
    amount     DECIMAL(16,2),
    order_time TIMESTAMP(3),
    WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND  -- 容忍 5 秒乱序
) WITH (
    'connector' = 'kafka',
    'topic' = 'order_events',
    'properties.bootstrap.servers' = 'kafka:9092',
    'format' = 'json',
    'scan.startup.mode' = 'latest-offset'
);

-- 每分钟成交额（滚动窗口）
SELECT window_start, window_end, SUM(amount) AS gmv
FROM TABLE(TUMBLE(TABLE orders, DESCRIPTOR(order_time), INTERVAL '1' MINUTE))
GROUP BY window_start, window_end;
${F}

## 四、窗口类型

| 窗口 | 特点 | 场景 |
| --- | --- | --- |
| 滚动 TUMBLE | 固定大小，不重叠 | 每分钟 PV |
| 滑动 HOP | 固定大小，有重叠 | 每 10 秒统计最近 1 分钟 |
| 会话 SESSION | 按活动间隔切分 | 用户一次访问的行为 |
| 累积 CUMULATE | 窗口逐步扩大 | 当天从零点起的累计 GMV |

## 五、状态与 Checkpoint

去重、聚合、Join 都需要记住历史数据，这就是**状态**。状态后端常用 RocksDB，可以存放远超内存的数据。

**Checkpoint** 定期把所有算子的状态和 Kafka 消费位点一起做快照存到 HDFS 或对象存储。作业失败后从最近的 Checkpoint 恢复，状态和位点一致，实现**精确一次**。原理是 Chandy-Lamport 算法：JobManager 向数据源注入 barrier，barrier 随数据流动，每个算子收到 barrier 时保存自己的状态。

端到端精确一次还需要下游配合：Kafka Sink 用事务两阶段提交，数据库 Sink 用主键 upsert 实现幂等。

## 六、Flink CDC

Flink CDC 直接读取 MySQL binlog，把业务库变更实时同步到 Kafka、Doris、Paimon，省去 Canal 加 Kafka 的中间环节，是实时数仓入湖的常用方案。

## ⚠ 踩坑

- **反压**：下游写入慢会逐级向上游传导，Web UI 里看 BackPressure，先定位最慢的算子。
- **状态无限增长**：流式去重和 Join 不设 ${C}table.exec.state.ttl${C}，状态会撑爆磁盘。
- **Watermark 不推进**：某个 Kafka 分区没有数据，全局 Watermark 卡住，窗口不触发；设置 ${C}scan.watermark.idle-timeout${C}。

## ✅ 自检清单

- 能区分事件时间和处理时间，并解释 Watermark 的作用。
- 能用 Flink SQL 写出滚动窗口聚合。
- 能说清 Checkpoint 如何保证精确一次。

## 📚 延伸阅读

- Flink 官方文档：Flink SQL 与 Table API
- 论文：Lightweight Asynchronous Snapshots for Distributed Dataflows
`
          },
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "用 ClickHouse/Doris 做实时分析，用 Iceberg/Paimon 搭建湖仓一体架构。",
        chapters: [
          // <bd-adv>
          {
            id: "bd-olap",
            title: "实时 OLAP：ClickHouse 与 Doris",
            minutes: 15,
            updated: "2026-11-20",
            applies: "ClickHouse 24.x+ · Apache Doris 2.1 / 3.x",
            tags: ["大数据", "OLAP", "ClickHouse"],
            terms: ["ClickHouse", "Doris", "OLAP", "StarRocks"],
            body: `
> **官方文档基线**：[ClickHouse Docs](https://clickhouse.com/docs) · [MergeTree 引擎](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree) · [Apache Doris 文档](https://doris.apache.org/docs/gettingStarted/what-is-apache-doris)

## 一、OLAP 与 OLTP

| 对比 | OLTP（MySQL） | OLAP（ClickHouse/Doris） |
| --- | --- | --- |
| 典型操作 | 按主键读写少量行 | 扫描大量行，聚合少数列 |
| 存储 | 行式 | 列式 + 压缩 |
| 并发 | 高并发小查询 | 中低并发复杂查询 |
| 更新 | 频繁 | 批量写入，更新代价较高 |

Hive/Spark 跑一次要几分钟，报表和自助分析需要**秒级甚至亚秒级**返回，这就是 OLAP 引擎的位置。

## 二、ClickHouse

ClickHouse 以单表查询速度极快著称，靠的是列式存储、向量化执行和稀疏索引。

${F}sql
CREATE TABLE events (
    event_date Date,
    event_time DateTime,
    user_id    UInt64,
    event      LowCardinality(String),
    duration   UInt32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event, user_id, event_time)   -- 排序键即主键索引
TTL event_date + INTERVAL 180 DAY;

SELECT event, uniq(user_id) AS uv, avg(duration)
FROM events
WHERE event_date >= today() - 7
GROUP BY event
ORDER BY uv DESC;
${F}

| 引擎 | 用途 |
| --- | --- |
| MergeTree | 基础引擎，后台合并数据片段 |
| ReplacingMergeTree | 合并时按排序键去重，保留最新版本 |
| AggregatingMergeTree | 配合物化视图做预聚合 |
| Distributed | 分布式表，把查询分发到各分片 |

**排序键设计**：把最常用于过滤、基数较低的列放前面，查询才能利用稀疏索引跳过大量数据块。

## 三、Apache Doris

Doris（以及同源的 StarRocks）的特点是 **MySQL 协议兼容、多表 Join 能力强、运维简单**，只有 FE（元数据和查询规划）和 BE（存储和计算）两种进程。

| 数据模型 | 特点 | 场景 |
| --- | --- | --- |
| Duplicate | 保留所有明细 | 日志、明细分析 |
| Unique | 按主键更新，支持部分列更新 | 订单状态同步 |
| Aggregate | 写入时按 key 预聚合 | 指标汇总 |

${F}sql
CREATE TABLE orders (
    order_id BIGINT,
    user_id  BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(16,2),
    dt       DATE
)
UNIQUE KEY(order_id)
PARTITION BY RANGE(dt) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "3"
);
${F}

数据导入常用 Stream Load（HTTP 推送）、Routine Load（订阅 Kafka）和 Flink Doris Connector。

## 四、怎么选

| 场景 | 推荐 |
| --- | --- |
| 超大宽表、日志和行为分析，单表聚合为主 | ClickHouse |
| 多表 Join、需要主键更新、团队熟悉 MySQL | Doris / StarRocks |
| 直接查询数据湖上的 Iceberg/Hive 表 | Trino、Doris/StarRocks 外表 |

## ⚠ 踩坑

- **ClickHouse 高频小批量写入**：每次写入生成一个数据片段，太多会报 Too many parts；应攒批到每次至少几千行，或用异步插入。
- **ClickHouse 当 OLTP 用**：频繁的 UPDATE/DELETE 代价很高。
- **Doris 分桶数不合理**：单个 tablet 建议 1~10GB，过多过少都影响性能。

## ✅ 自检清单

- 能说清 OLAP 和 OLTP 的差异，以及列式存储为什么适合分析。
- 能设计 ClickHouse MergeTree 的分区键和排序键。
- 能根据场景在 ClickHouse 和 Doris 之间做选择。

## 📚 延伸阅读

- ClickHouse 文档：Choosing a primary key
- Doris 文档：Data Model
`
          },
          {
            id: "bd-lakehouse",
            title: "湖仓一体：Iceberg、Paimon 与流批一体架构",
            minutes: 14,
            updated: "2026-11-20",
            applies: "Iceberg 1.x · Paimon 1.x",
            tags: ["大数据", "数据湖", "湖仓一体"],
            terms: ["数据湖", "Iceberg", "Paimon", "湖仓一体"],
            body: `
> **官方文档基线**：[Apache Iceberg Docs](https://iceberg.apache.org/docs/latest/) · [Iceberg Table Spec](https://iceberg.apache.org/spec/) · [Apache Paimon Docs](https://paimon.apache.org/docs/master/)

## 一、为什么需要表格式

Hive 表本质是「目录 + 文件」，存在几个硬伤：不支持行级更新、没有事务（写入一半失败会留下脏数据）、改分区要重写数据、列出大量文件很慢。

**开放表格式**在文件之上加了一层元数据，让对象存储上的 Parquet 文件拥有数据库一样的能力：ACID 事务、行级更新删除、时间旅行、Schema 演进。这种「数据湖的低成本 + 数仓的管理能力」就是**湖仓一体**（Lakehouse）。

## 二、Iceberg 的元数据结构

${F}text
Catalog（表名 → 当前 metadata 文件位置）
  └─ metadata.json（Schema、分区规则、快照列表）
       └─ manifest list（某个快照包含哪些 manifest）
            └─ manifest file（数据文件清单 + 每列的最小最大值）
                 └─ data files（Parquet / ORC）
${F}

每次提交生成新快照，通过原子替换 metadata 指针完成，读写互不阻塞。查询时利用 manifest 里的列统计信息直接跳过无关文件。

${F}sql
-- Spark SQL
CREATE TABLE lake.db.orders (
    order_id BIGINT, amount DECIMAL(16,2), ts TIMESTAMP
) USING iceberg
PARTITIONED BY (days(ts));          -- 隐藏分区，查询无需写分区列

MERGE INTO lake.db.orders t
USING updates s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

SELECT * FROM lake.db.orders TIMESTAMP AS OF '2026-11-19 00:00:00';  -- 时间旅行
CALL lake.system.expire_snapshots('db.orders', TIMESTAMP '2026-11-13 00:00:00');
${F}

## 三、Paimon：为流式更新而生

Paimon 起源于 Flink 社区，采用 **LSM 树**结构，擅长高频的主键更新和流式读取，可以直接作为实时数仓的中间层：Flink CDC 写入 Paimon，下游 Flink 订阅 Paimon 的变更继续加工，同时 Spark、Doris 也能批量查询同一张表。

| 对比 | Iceberg | Paimon | Hudi |
| --- | --- | --- | --- |
| 强项 | 批处理、多引擎生态最广 | 流式主键更新、Flink 集成 | 增量更新，起步早 |
| 更新方式 | Copy-on-Write / Merge-on-Read | LSM 合并 | COW / MOR |
| 典型用户 | 海外云厂商、Netflix、Apple | 阿里等国内实时数仓 | Uber |

## 四、流批一体架构演进

| 架构 | 做法 | 问题 |
| --- | --- | --- |
| Lambda | 离线一套、实时一套，结果合并 | 两套代码，口径容易不一致 |
| Kappa | 全部用流处理，重算靠回放 Kafka | Kafka 保留时间有限，回溯成本高 |
| 湖仓一体 | 统一存在湖表里，Flink 流写，Spark 批算，OLAP 引擎直查 | 小文件合并和元数据维护需要运维 |

## ⚠ 踩坑

- **小文件爆炸**：流式写入每次 Checkpoint 都产生新文件，需要定期 compaction。
- **快照不清理**：历史快照引用的文件无法删除，存储持续上涨，要定期过期快照和清理孤儿文件。
- **Catalog 不统一**：不同引擎各用各的 Catalog，会出现看不到对方写入的表，选定 Hive Metastore、REST Catalog 等统一方案。

## ✅ 自检清单

- 能说出 Hive 表的局限和开放表格式解决的问题。
- 能画出 Iceberg 的元数据层级。
- 能比较 Lambda、Kappa 与湖仓一体架构。

## 📚 延伸阅读

- Databricks 论文：Lakehouse（CIDR 2021）
- Paimon 文档：Primary Key Table
`
          },
        ]
      }
    ]
  };

  window.BIGDATA = BIGDATA;
})();
