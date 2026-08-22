/* =========================================================================
 *  seed.js  —  初始数据（技术分类树 / 岗位体系 / 岗位技术栈 / 示例题目）
 *  全部挂到 window.SEED，供 db.initSeed() 使用。
 * ========================================================================= */
(function () {
  "use strict";

  /* ---------------- 技术分类树（按技术演进顺序，21 个一级） ---------------- */
  const categoryTree = [
    { name: "计算机科学基础", era: "1950s-1970s", icon: "🧮", children: [
      { name: "数据结构" }, { name: "算法" }, { name: "操作系统原理" },
      { name: "计算机组成原理" }, { name: "计算机网络基础" }, { name: "编译原理" }, { name: "离散数学" }
    ]},
    { name: "编程语言与编程基础", era: "1970s-1990s", icon: "💻", children: [
      { name: "C语言" }, { name: "C++" }, { name: "Java" }, { name: "Python" }, { name: "JavaScript" },
      { name: "TypeScript" }, { name: "Go" }, { name: "Rust" }, { name: "PHP" }, { name: "C#" },
      { name: "Kotlin" }, { name: "Swift" }, { name: "Dart" }, { name: "Scala" }, { name: "Ruby" }
    ]},
    { name: "数据库与数据存储", era: "1970s-2000s", icon: "🗄️", children: [
      { name: "关系型数据库", children: [
        { name: "SQL基础" }, { name: "MySQL" }, { name: "PostgreSQL" }, { name: "Oracle" }, { name: "SQL Server" }
      ]},
      { name: "非关系型数据库", children: [
        { name: "Redis" }, { name: "MongoDB" }, { name: "HBase" }, { name: "Cassandra" }
      ]},
      { name: "新型数据库", children: [ { name: "Elasticsearch" }, { name: "ClickHouse" }, { name: "TiDB" } ] },
      { name: "数据库设计与调优" }
    ]},
    { name: "操作系统与系统运维", era: "1980s-2000s", icon: "⚙️", children: [
      { name: "Linux操作系统" }, { name: "Windows Server" }, { name: "Shell脚本" }, { name: "系统调优" }, { name: "存储与文件系统" }
    ]},
    { name: "计算机网络与协议", era: "1970s-1990s", icon: "🌐", children: [
      { name: "网络基础" }, { name: "TCP/IP协议" }, { name: "HTTP与HTTPS" }, { name: "DNS原理" }, { name: "网络安全基础" }, { name: "Socket编程" }
    ]},
    { name: "Web前端开发", era: "1990s-至今", icon: "🎨", children: [
      { name: "前端基础", children: [ { name: "HTML" }, { name: "CSS" }, { name: "JavaScript基础" }, { name: "浏览器原理" } ] },
      { name: "前端框架", children: [ { name: "Vue2" }, { name: "Vue3" }, { name: "React" }, { name: "Angular" }, { name: "Next.js" }, { name: "Nuxt" } ] },
      { name: "前端工程化", children: [ { name: "Webpack" }, { name: "Vite" }, { name: "Babel" }, { name: "ESLint" }, { name: "npm" }, { name: "yarn" } ] },
      { name: "TypeScript前端" }, { name: "小程序开发" }, { name: "前端性能优化" }, { name: "微前端" }
    ]},
    { name: "后端开发与服务端框架", era: "1990s-至今", icon: "🖥️", children: [
      { name: "Java后端", children: [ { name: "Spring" }, { name: "Spring Boot" }, { name: "Spring MVC" }, { name: "MyBatis" }, { name: "JVM调优" } ] },
      { name: "Python后端", children: [ { name: "Django" }, { name: "Flask" }, { name: "FastAPI" } ] },
      { name: "Node.js后端", children: [ { name: "Express" }, { name: "Koa" }, { name: "NestJS" } ] },
      { name: "API设计与RESTful规范" }, { name: "GraphQL" }
    ]},
    { name: "软件工程与设计模式", era: "1980s-2000s", icon: "📐", children: [
      { name: "设计模式" }, { name: "软件架构模式" }, { name: "Git版本控制" }, { name: "代码规范" },
      { name: "重构技巧" }, { name: "敏捷开发" }, { name: "技术文档写作" }
    ]},
    { name: "软件测试", era: "1980s-至今", icon: "🧪", children: [
      { name: "测试理论基础" }, { name: "功能测试" }, { name: "接口测试" }, { name: "自动化测试" },
      { name: "性能测试" }, { name: "安全测试基础" }, { name: "测试开发" }, { name: "Selenium" }, { name: "Playwright" }, { name: "JMeter" }, { name: "Appium" }
    ]},
    { name: "分布式系统与微服务", era: "2000s-至今", icon: "🔗", children: [
      { name: "分布式理论" }, { name: "CAP理论" }, { name: "分布式事务" }, { name: "一致性算法" },
      { name: "微服务架构" }, { name: "Spring Cloud" }, { name: "Spring Cloud Alibaba" }, { name: "Dubbo" }, { name: "gRPC" },
      { name: "消息队列", children: [ { name: "Kafka" }, { name: "RabbitMQ" }, { name: "RocketMQ" } ] },
      { name: "服务注册与发现Nacos" }, { name: "API网关" }, { name: "服务治理" }, { name: "分布式缓存" }, { name: "分布式锁" }
    ]},
    { name: "云原生与DevOps", era: "2013-至今", icon: "☁️", children: [
      { name: "Docker" }, { name: "Kubernetes" }, { name: "Helm" }, { name: "Jenkins" }, { name: "GitLab CI/CD" },
      { name: "GitHub Actions" }, { name: "ArgoCD" }, { name: "Prometheus" }, { name: "Grafana" }, { name: "ELK日志体系" },
      { name: "SkyWalking" }, { name: "Terraform" }, { name: "Ansible" }, { name: "AWS" }, { name: "阿里云" },
      { name: "腾讯云" }, { name: "华为云" }, { name: "混沌工程" }, { name: "FinOps" }
    ]},
    { name: "大数据与数据工程", era: "2010s-至今", icon: "📊", children: [
      { name: "Hadoop生态" }, { name: "HDFS" }, { name: "MapReduce" }, { name: "Hive" }, { name: "Spark" }, { name: "Flink" },
      { name: "Kafka数据" }, { name: "数仓建模理论" }, { name: "数据湖" }, { name: "实时数仓" }, { name: "DataX" },
      { name: "Sqoop" }, { name: "Flume" }, { name: "ClickHouse数仓" }, { name: "Doris" }, { name: "数据治理" }
    ]},
    { name: "人工智能与机器学习", era: "2012-至今", icon: "🤖", children: [
      { name: "ML基础", children: [ { name: "机器学习基础" }, { name: "数学基础" }, { name: "特征工程" }, { name: "模型评估" } ] },
      { name: "深度学习", children: [ { name: "神经网络原理" }, { name: "PyTorch" }, { name: "TensorFlow" } ] },
      { name: "AI应用方向", children: [ { name: "自然语言处理NLP" }, { name: "计算机视觉CV" }, { name: "推荐系统" }, { name: "搜索系统" } ] },
      { name: "大模型", children: [ { name: "Transformer架构" }, { name: "BERT" }, { name: "GPT系列" }, { name: "LLM原理" },
        { name: "Prompt Engineering" }, { name: "RAG检索增强生成" }, { name: "AI Agent" }, { name: "LangChain" },
        { name: "模型微调" }, { name: "模型部署优化" }, { name: "MLOps" }, { name: "向量数据库" } ] }
    ]},
    { name: "信息安全与网络安全", era: "贯穿始终", icon: "🛡️", children: [
      { name: "网络安全基础" }, { name: "Web安全" }, { name: "OWASP Top 10" }, { name: "SQL注入" }, { name: "XSS跨站脚本" },
      { name: "CSRF跨站请求伪造" }, { name: "文件上传漏洞" }, { name: "渗透测试" }, { name: "密码学基础" }, { name: "内网渗透" },
      { name: "逆向工程基础" }, { name: "安全开发规范" }, { name: "等保合规" }, { name: "应急响应" }, { name: "威胁情报" }, { name: "零信任架构" }
    ]},
    { name: "移动端与跨平台开发", era: "2007-至今", icon: "📱", children: [
      { name: "iOS开发", children: [ { name: "Swift" }, { name: "Objective-C" }, { name: "UIKit" }, { name: "SwiftUI" } ] },
      { name: "Android开发", children: [ { name: "Kotlin" }, { name: "Android Java" }, { name: "Android Jetpack" }, { name: "Jetpack Compose" } ] },
      { name: "Flutter" }, { name: "React Native" }, { name: "uni-app" }, { name: "移动端性能优化" }
    ]},
    { name: "游戏开发与图形图像", era: "1980s-至今", icon: "🎮", children: [
      { name: "Unity开发" }, { name: "Unreal Engine开发" }, { name: "游戏客户端开发" }, { name: "游戏服务端开发" },
      { name: "OpenGL" }, { name: "图形学基础" }, { name: "Shader编程" }, { name: "物理引擎" }
    ]},
    { name: "嵌入式与物联网", era: "1970s-至今", icon: "🔌", children: [
      { name: "嵌入式C开发" }, { name: "嵌入式Linux" }, { name: "RTOS实时操作系统" }, { name: "STM32" }, { name: "物联网协议MQTT" }, { name: "边缘计算" }, { name: "IoT平台开发" }
    ]},
    { name: "音视频与流媒体", era: "2000s-至今", icon: "🎬", children: [
      { name: "音视频基础编解码" }, { name: "FFmpeg" }, { name: "WebRTC" }, { name: "流媒体协议RTMP和HLS" }, { name: "音视频SDK开发" }, { name: "直播技术架构" }
    ]},
    { name: "区块链与Web3", era: "2009-至今", icon: "⛓️", children: [
      { name: "区块链基础" }, { name: "以太坊" }, { name: "智能合约Solidity" }, { name: "Web3开发" }, { name: "DeFi基础" }, { name: "NFT技术" }
    ]},
    { name: "产品与项目管理", era: "行业通用", icon: "📋", children: [
      { name: "产品经理必备能力" }, { name: "需求分析与文档" }, { name: "用户研究" }, { name: "数据分析基础" },
      { name: "项目管理PMP" }, { name: "敏捷Scrum" }, { name: "技术管理能力" }, { name: "OKR与绩效管理" }
    ]},
    { name: "通用面试能力与软技能", era: "行业通用", icon: "💬", children: [
      { name: "自我介绍技巧" }, { name: "职业规划问答" }, { name: "冲突处理" }, { name: "团队协作" },
      { name: "技术方案表达" }, { name: "薪资谈判" }, { name: "常见HR面试题" }
    ]}
  ];

  /* ---------------- 岗位体系（按行业发展阶段） ---------------- */
  const positionStages = [
    { stage: "计算机基础时代", tag: "1950s-1980s", children: [
      { name: "硬件工程师", children: ["数字电路工程师", "嵌入式硬件工程师", "PCB设计工程师", "FPGA工程师", "芯片设计工程师(IC设计)"] },
      { name: "系统软件工程师", children: ["操作系统开发工程师", "编译器工程师", "驱动开发工程师", "固件工程师"] },
      { name: "网络工程师", children: ["网络规划工程师", "网络运维工程师", "路由交换工程师", "网络架构师"] }
    ]},
    { stage: "软件开发时代", tag: "1980s-1990s", children: [
      { name: "软件开发工程师(通用)", children: ["C/C++开发工程师", "Java开发工程师", "Python开发工程师", ".NET开发工程师", "Go开发工程师"] },
      { name: "数据库工程师", children: ["DBA数据库管理员", "数据库开发工程师", "数据库架构师"] },
      { name: "测试工程师", children: ["功能测试工程师", "自动化测试工程师", "性能测试工程师", "测试开发工程师", "测试架构师"] },
      { name: "系统运维工程师", children: ["Linux运维工程师", "Windows运维工程师", "IT运维工程师"] }
    ]},
    { stage: "互联网时代", tag: "1990s-2005", children: [
      { name: "前端开发工程师", children: ["HTML/CSS/JS工程师", "页面重构工程师", "前端架构师"] },
      { name: "后端开发工程师", children: ["Java后端工程师", "Python后端工程师", "PHP后端工程师", "Node.js工程师", "Go后端工程师", "后端架构师"] },
      { name: "全栈开发工程师", children: ["Web全栈工程师", "小程序全栈工程师"] },
      { name: "UI/UX设计师", children: ["UI设计师", "UX交互设计师", "视觉设计师"] },
      { name: "产品经理", children: ["互联网产品经理", "企业软件产品经理", "B端产品经理", "C端产品经理"] }
    ]},
    { stage: "移动互联网时代", tag: "2007-2015", children: [
      { name: "移动端开发工程师", children: ["iOS开发工程师", "Android开发工程师", "Flutter开发工程师", "React Native开发工程师", "移动端架构师"] },
      { name: "游戏开发工程师", children: ["Unity游戏开发工程师", "Unreal Engine开发工程师", "游戏客户端工程师", "游戏服务端工程师", "游戏引擎工程师"] }
    ]},
    { stage: "大数据与云计算时代", tag: "2010-2018", children: [
      { name: "大数据工程师", children: ["大数据开发工程师", "数据仓库工程师", "实时计算工程师", "数据采集工程师", "大数据架构师"] },
      { name: "数据分析师", children: ["业务数据分析师", "量化分析师", "商业智能分析师BI"] },
      { name: "云计算工程师", children: ["云平台开发工程师", "云解决方案架构师", "云资源运维工程师"] },
      { name: "DevOps工程师", children: ["DevOps工程师", "CI/CD工程师", "SRE站点可靠性工程师", "平台工程师"] },
      { name: "信息安全工程师", children: ["安全开发工程师", "渗透测试工程师", "安全运营工程师SOC", "应急响应工程师", "安全架构师"] },
      { name: "公有云售后技术支持", direction: "大客户答疑", tag: "售后支持" },
      { name: "公有云售后技术支持", direction: "监控运维", tag: "售后支持" },
      { name: "公有云售后技术支持", direction: "售前技术咨询", tag: "售后支持" },
      { name: "公有云售后技术支持", direction: "驻场交付", tag: "售后支持" }
    ]},
    { stage: "AI与大模型时代", tag: "2015-至今", children: [
      { name: "算法工程师", children: ["机器学习工程师", "深度学习工程师", "推荐算法工程师", "搜索算法工程师", "计算机视觉工程师CV", "自然语言处理工程师NLP", "强化学习工程师"] },
      { name: "AI应用开发工程师", children: ["LLM应用开发工程师", "RAG工程师", "AI Agent开发工程师", "Prompt工程师", "AI产品工程师"] },
      { name: "数据科学家", children: ["数据科学家", "研究科学家"] },
      { name: "MLOps工程师", children: ["MLOps工程师", "模型部署工程师"] }
    ]},
    { stage: "新兴技术方向", tag: "2018-至今", children: [
      { name: "区块链工程师", children: ["智能合约开发工程师", "区块链后端工程师", "Web3开发工程师"] },
      { name: "嵌入式与物联网工程师", children: ["嵌入式软件工程师", "IoT开发工程师", "边缘计算工程师"] },
      { name: "音视频与流媒体工程师", children: ["音视频开发工程师", "流媒体架构师", "WebRTC工程师"] },
      { name: "新兴方向工程师", children: ["低代码平台开发工程师", "AR/VR开发工程师", "数字孪生开发工程师"] }
    ]},
    { stage: "综合管理", tag: "不限时代", children: [
      { name: "技术经理" }, { name: "技术总监CTO" },
      { name: "架构师", children: ["应用架构师", "解决方案架构师", "企业架构师", "云架构师"] },
      { name: "技术型项目经理" }
    ]}
  ];

  /* ---------------- 主要岗位技术栈（必考 / 加分） ----------------
     tech: 技术名称（尽量与分类名一致，便于自动关联）；stars:1-5；depth:了解/熟悉/精通
  */
  const positionSkills = {
    "Java后端工程师": {
      required: [
        { tech: "Java", stars: 5, depth: "精通" }, { tech: "JVM调优", stars: 5, depth: "精通" },
        { tech: "Spring Boot", stars: 5, depth: "精通" }, { tech: "MyBatis", stars: 4, depth: "熟悉" },
        { tech: "MySQL", stars: 5, depth: "精通" }, { tech: "Redis", stars: 5, depth: "精通" },
        { tech: "算法", stars: 4, depth: "熟悉" }, { tech: "计算机网络基础", stars: 4, depth: "熟悉" },
        { tech: "Linux操作系统", stars: 3, depth: "了解" }
      ],
      bonus: [
        { tech: "Spring Cloud", stars: 4, depth: "熟悉" }, { tech: "Kafka", stars: 4, depth: "熟悉" },
        { tech: "RocketMQ", stars: 4, depth: "熟悉" }, { tech: "Elasticsearch", stars: 3, depth: "了解" },
        { tech: "Docker", stars: 3, depth: "了解" }, { tech: "Kubernetes", stars: 3, depth: "了解" },
        { tech: "分布式事务", stars: 4, depth: "熟悉" }
      ]
    },
    "前端开发工程师": {
      required: [
        { tech: "HTML", stars: 5, depth: "精通" }, { tech: "CSS", stars: 5, depth: "精通" },
        { tech: "JavaScript", stars: 5, depth: "精通" }, { tech: "TypeScript", stars: 4, depth: "熟悉" },
        { tech: "Vue3", stars: 5, depth: "精通" }, { tech: "React", stars: 5, depth: "精通" },
        { tech: "浏览器原理", stars: 4, depth: "熟悉" }, { tech: "HTTP与HTTPS", stars: 4, depth: "熟悉" },
        { tech: "Webpack", stars: 4, depth: "熟悉" }, { tech: "Vite", stars: 4, depth: "熟悉" },
        { tech: "前端性能优化", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "React Native", stars: 3, depth: "了解" }, { tech: "Node.js", stars: 3, depth: "了解" },
        { tech: "小程序开发", stars: 3, depth: "了解" }, { tech: "Next.js", stars: 3, depth: "了解" },
        { tech: "Nuxt", stars: 3, depth: "了解" }, { tech: "微前端", stars: 3, depth: "了解" },
        { tech: "WebGL", stars: 3, depth: "了解" }
      ]
    },
    "Python后端工程师": {
      required: [
        { tech: "Python", stars: 5, depth: "精通" }, { tech: "Django", stars: 5, depth: "精通" },
        { tech: "FastAPI", stars: 5, depth: "精通" }, { tech: "MySQL", stars: 4, depth: "熟悉" },
        { tech: "Redis", stars: 4, depth: "熟悉" }, { tech: "Flask", stars: 4, depth: "熟悉" },
        { tech: "API设计与RESTful规范", stars: 4, depth: "熟悉" }, { tech: "Linux操作系统", stars: 3, depth: "了解" }
      ],
      bonus: [
        { tech: "Celery", stars: 3, depth: "了解" }, { tech: "数据分析基础", stars: 3, depth: "了解" },
        { tech: "Docker", stars: 3, depth: "了解" }
      ]
    },
    "Go后端工程师": {
      required: [
        { tech: "Go", stars: 5, depth: "精通" }, { tech: "Gin", stars: 4, depth: "熟悉" },
        { tech: "Gorm", stars: 4, depth: "熟悉" }, { tech: "MySQL", stars: 4, depth: "熟悉" },
        { tech: "Redis", stars: 4, depth: "熟悉" }, { tech: "gRPC", stars: 4, depth: "熟悉" },
        { tech: "微服务架构", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "Kafka", stars: 3, depth: "了解" }, { tech: "Kubernetes", stars: 3, depth: "了解" },
        { tech: "分布式锁", stars: 4, depth: "熟悉" }
      ]
    },
    "DevOps工程师": {
      required: [
        { tech: "Linux操作系统", stars: 5, depth: "精通" }, { tech: "Shell脚本", stars: 5, depth: "精通" },
        { tech: "Docker", stars: 5, depth: "精通" }, { tech: "Kubernetes", stars: 5, depth: "精通" },
        { tech: "Jenkins", stars: 5, depth: "精通" }, { tech: "Git版本控制", stars: 4, depth: "熟悉" },
        { tech: "Prometheus", stars: 4, depth: "熟悉" }, { tech: "Grafana", stars: 4, depth: "熟悉" },
        { tech: "网络基础", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "Terraform", stars: 4, depth: "熟悉" }, { tech: "Ansible", stars: 3, depth: "了解" },
        { tech: "AWS", stars: 4, depth: "熟悉" }, { tech: "阿里云", stars: 4, depth: "熟悉" },
        { tech: "Python", stars: 4, depth: "熟悉" }, { tech: "混沌工程", stars: 3, depth: "了解" },
        { tech: "ELK日志体系", stars: 4, depth: "熟悉" }
      ]
    },
    "大数据工程师": {
      required: [
        { tech: "Hadoop生态", stars: 4, depth: "熟悉" }, { tech: "Spark", stars: 5, depth: "精通" },
        { tech: "Flink", stars: 5, depth: "精通" }, { tech: "Hive", stars: 4, depth: "熟悉" },
        { tech: "Kafka", stars: 4, depth: "熟悉" }, { tech: "MySQL", stars: 4, depth: "熟悉" },
        { tech: "数仓建模理论", stars: 5, depth: "精通" }, { tech: "Scala", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "ClickHouse", stars: 4, depth: "熟悉" }, { tech: "Doris", stars: 3, depth: "了解" },
        { tech: "数据湖", stars: 3, depth: "了解" }, { tech: "实时数仓", stars: 4, depth: "熟悉" }
      ]
    },
    "算法工程师": {
      required: [
        { tech: "Python", stars: 5, depth: "精通" }, { tech: "机器学习基础", stars: 5, depth: "精通" },
        { tech: "深度学习", stars: 5, depth: "精通" }, { tech: "PyTorch", stars: 5, depth: "精通" },
        { tech: "数学基础", stars: 5, depth: "精通" }, { tech: "特征工程", stars: 4, depth: "熟悉" },
        { tech: "模型评估", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "模型微调", stars: 4, depth: "熟悉" }, { tech: "RAG检索增强生成", stars: 4, depth: "熟悉" },
        { tech: "MLOps", stars: 3, depth: "了解" }, { tech: "模型部署优化", stars: 4, depth: "熟悉" }
      ]
    },
    "测试工程师": {
      required: [
        { tech: "测试理论基础", stars: 5, depth: "精通" }, { tech: "功能测试", stars: 5, depth: "精通" },
        { tech: "接口测试", stars: 5, depth: "精通" }, { tech: "Python", stars: 4, depth: "熟悉" },
        { tech: "Selenium", stars: 4, depth: "熟悉" }, { tech: "JMeter", stars: 4, depth: "熟悉" },
        { tech: "MySQL", stars: 4, depth: "熟悉" }, { tech: "Linux操作系统", stars: 3, depth: "了解" }
      ],
      bonus: [
        { tech: "Playwright", stars: 4, depth: "熟悉" }, { tech: "Appium", stars: 3, depth: "了解" },
        { tech: "安全测试基础", stars: 3, depth: "了解" }, { tech: "Docker", stars: 3, depth: "了解" }
      ]
    },
    "信息安全工程师": {
      required: [
        { tech: "网络安全基础", stars: 5, depth: "精通" }, { tech: "Web安全", stars: 5, depth: "精通" },
        { tech: "SQL注入", stars: 5, depth: "精通" }, { tech: "XSS跨站脚本", stars: 5, depth: "精通" },
        { tech: "CSRF跨站请求伪造", stars: 5, depth: "精通" }, { tech: "Linux操作系统", stars: 5, depth: "精通" },
        { tech: "渗透测试", stars: 4, depth: "熟悉" }, { tech: "密码学基础", stars: 4, depth: "熟悉" },
        { tech: "Python", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "逆向工程基础", stars: 3, depth: "了解" }, { tech: "内网渗透", stars: 4, depth: "熟悉" },
        { tech: "安全开发规范", stars: 4, depth: "熟悉" }, { tech: "等保合规", stars: 3, depth: "了解" }
      ]
    },
    "iOS开发工程师": {
      required: [
        { tech: "Swift", stars: 5, depth: "精通" }, { tech: "UIKit", stars: 5, depth: "精通" },
        { tech: "SwiftUI", stars: 4, depth: "熟悉" }, { tech: "内存管理和ARC", stars: 5, depth: "精通" },
        { tech: "多线程GCD", stars: 4, depth: "熟悉" }, { tech: "网络请求URLSession", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "Flutter", stars: 3, depth: "了解" }, { tech: "App性能优化", stars: 4, depth: "熟悉" }
      ]
    },
    "Android开发工程师": {
      required: [
        { tech: "Kotlin", stars: 5, depth: "精通" }, { tech: "Android Jetpack", stars: 5, depth: "精通" },
        { tech: "Jetpack Compose", stars: 4, depth: "熟悉" }, { tech: "多线程与协程", stars: 5, depth: "精通" },
        { tech: "性能优化", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "Flutter", stars: 3, depth: "了解" }, { tech: "NDK和C++", stars: 3, depth: "了解" },
        { tech: "音视频开发", stars: 3, depth: "了解" }
      ]
    },
    "AI应用开发工程师": {
      required: [
        { tech: "Python", stars: 5, depth: "精通" }, { tech: "LLM原理", stars: 5, depth: "精通" },
        { tech: "Prompt Engineering", stars: 5, depth: "精通" }, { tech: "LangChain", stars: 5, depth: "精通" },
        { tech: "RAG检索增强生成", stars: 5, depth: "精通" }, { tech: "向量数据库", stars: 4, depth: "熟悉" },
        { tech: "AI Agent", stars: 4, depth: "熟悉" }
      ],
      bonus: [
        { tech: "模型微调", stars: 4, depth: "熟悉" }, { tech: "模型部署优化", stars: 3, depth: "了解" },
        { tech: "FastAPI", stars: 4, depth: "熟悉" }, { tech: "知识图谱", stars: 3, depth: "了解" }
      ]
    }
  };

  /* ---------------- 示例题目（约 100 道） ----------------
     字段：title, body, answer, cat(分类路径数组), diff, type, positions, years, tags, aiScore
     cat 取最深层分类名，初始化时按名称解析为分类 id。
  */
  const Q = [];
  function q(title, body, answer, cat, diff, type, positions, years, tags, aiScore) {
    Q.push({ title, body, answer, cat, diff, type, positions, years, tags, aiScore: aiScore || 80 });
  }

  /* Java 基础 x10 */
  q("Java 中 == 和 equals 的区别是什么？", "请说明基本类型与引用类型在使用 `==` 与 `equals()` 时的行为差异，并解释为什么 String 的等值比较要用 equals。",
    "**`==`** 比较的是**值**：\n- 对于基本类型（int、double 等），比较的是字面量是否相等；\n- 对于引用类型，比较的是**对象的内存地址**（是否为同一个对象）。\n\n**`equals()`** 是 Object 类的方法，默认实现等价于 `==`（比较地址）。但很多类（如 `String`、`Integer`、`List`）重写了它来比较**逻辑内容**。\n\n**为什么 String 用 equals**：字符串常量池会导致不同方式创建的字符串地址不同，但内容可能相同。例如 `new String(\"a\") == \"a\"` 为 false，而 `.equals(\"a\")` 为 true。因此判断字符串内容相等必须用 `equals()`，且建议写为 `\"常量\".equals(变量)` 以规避空指针。",
    ["Java", "编程语言与编程基础"], "初级", "简答题", ["Java开发工程师","Java后端工程师"], "0-1年", ["Java基础","equals","对象"], 88);
  q("String、StringBuffer、StringBuilder 有什么区别？", "在拼接字符串的场景下，三者如何选型？为什么 StringBuilder 比 StringBuffer 快？",
    "1. **String** 不可变（final char[]），每次拼接都会生成新对象，频繁拼接会产生大量垃圾。\n2. **StringBuffer** 可变、线程安全（方法加 `synchronized`）。\n3. **StringBuilder** 可变、非线程安全（JDK5 引入）。\n\n**选型**：单线程拼接用 `StringBuilder`；多线程共享且需安全用 `StringBuffer`；少量固定拼接用 `String` + 字面量（编译器会优化为 StringBuilder）。\n\n**为什么 StringBuilder 更快**：StringBuffer 的方法有同步锁开销，StringBuilder 去掉了锁，因此在单线程下效率更高。",
    ["Java", "编程语言与编程基础"], "初级", "简答题", ["Java开发工程师","Java后端工程师"], "0-1年", ["String","线程安全"], 90);
  q("Java 集合框架中 ArrayList 与 LinkedList 的区别？", "从底层结构、随机访问、插入删除、内存占用等维度对比，并说明各自适用场景。",
    "- **底层**：ArrayList 基于动态数组；LinkedList 基于双向链表。\n- **随机访问**：ArrayList `get(i)` 为 O(1)；LinkedList 为 O(n)。\n- **插入删除**：ArrayList 在尾部 amortized O(1)，中间/头部需搬移元素 O(n)；LinkedList 已知节点时插入 O(1)，但查找节点仍 O(n)。\n- **内存**：LinkedList 每个节点额外存储前后指针，开销更大。\n\n**场景**：读多写少、需要下标访问 → ArrayList；频繁在头部/中间增删且迭代访问 → LinkedList。实际中 ArrayList 绝大多数情况更优（CPU 缓存友好）。",
    ["Java", "编程语言与编程基础"], "初级", "简答题", ["Java开发工程师","Java后端工程师"], "0-1年", ["集合","ArrayList","LinkedList"], 87);
  q("HashMap 的底层原理（JDK8）是什么？", "说明 JDK8 中 HashMap 的数据结构、哈希扰动、扩容机制以及为什么链表转红黑树的阈值是 8。",
    "**结构**：数组（桶）+ 链表 + 红黑树。\n**哈希**：`(h = key.hashCode()) ^ (h >>> 16)` 让高位也参与运算，减少碰撞。\n**定位**：`(n - 1) & hash` 取桶下标。\n**put 流程**：算 hash → 定位桶 → 空则直接放；链表则尾插并计数，达到 8 且数组长度≥64 转红黑树；红黑树则按 key 比较插入。\n**扩容**：容量翻倍，元素重新分散到新桶（lo/hi 两条链），避免整体 rehash。\n**为什么阈值 8**：泊松分布下链表长度达到 8 的概率极小（约千万分之6），转为红黑树是为了极端冲突时的查询兜底（树查找 O(log n)）。",
    ["Java", "编程语言与编程基础"], "中级", "简答题", ["Java开发工程师","Java后端工程师"], "1-3年", ["HashMap","红黑树","哈希"], 92);
  q("volatile 关键字的作用是什么？它能保证原子性吗？", "说明 volatile 的可见性与有序性语义，并举一个它不能保证原子性的例子。",
    "**volatile 的两层语义**：\n1. **可见性**：写操作立即刷新主内存，读操作从主内存读取，绕过线程工作内存缓存。\n2. **有序性（禁止指令重排）**：通过内存屏障，保证 volatile 写之前的代码不会被重排到写之后。\n\n**不保证原子性**：例如 `i++` 实际是读-改-写三步，volatile 无法保证这三步不被其他线程打断。多个线程同时 `i++` 仍会丢更新，必须用 `AtomicInteger` 或 `synchronized`/`Lock`。\n\n典型正确用法：状态标志位（如 `volatile boolean running`）、双重检查单例的实例字段。",
    ["Java", "编程语言与编程基础"], "中级", "简答题", ["Java开发工程师","Java后端工程师"], "1-3年", ["volatile","并发","可见性"], 90);
  q("synchronized 与 ReentrantLock 的区别？", "从实现机制、功能特性、性能三方面对比。",
    "- **实现**：synchronized 是 JVM 内置关键字（监视器锁），自动加解锁；ReentrantLock 是 JDK 的 API 锁，需手动 `lock()/unlock()`（推荐 try-finally）。\n- **功能**：ReentrantLock 支持可中断（`lockInterruptibly`）、超时获取、公平锁、多条件 `Condition`；synchronized 不支持。\n- **性能**：早期 synchronized 重量级较慢，JDK6 引入偏向锁/轻量级锁（自旋、锁升级）后两者差距不大；高竞争下 ReentrantLock 更可控。\n\n**选型**：简单互斥用 synchronized（不易出错）；需要高级特性（公平、超时、可中断）用 ReentrantLock。",
    ["Java", "编程语言与编程基础"], "中级", "简答题", ["Java开发工程师","Java后端工程师"], "1-3年", ["锁","并发","synchronized"], 89);
  q("Java 反射是什么？有哪些应用场景与风险？", "请解释反射机制及其典型用途，并说明为何在框架中大量使用以及安全隐患。",
    "**反射** 是在运行时动态获取类信息并操作类成员（构造器、方法、字段）的机制，核心类为 `Class`、`Method`、`Field`、`Constructor`。\n\n**应用**：框架（Spring IOC 实例化 Bean、MyBatis 映射结果集）、注解处理器、序列化/反序列化、动态代理。\n\n**风险**：\n1. 破坏封装（可访问 private）；\n2. 性能开销（相比直接调用有校验与方法调用开销）；\n3. 安全（攻击者可借反序列化+反射执行恶意代码，如 Fastjson 漏洞）。\n**缓解**：模块化限制、禁止危险反序列化、使用白名单。",
    ["Java", "编程语言与编程基础"], "高级", "简答题", ["Java后端工程师"], "3-5年", ["反射","框架"], 85);
  q("讲讲 Java 的四种引用类型及其用途。", "强引用、软引用、弱引用、虚引用分别是什么？在什么场景下使用？",
    "1. **强引用** `Object o = new Object()`：永不回收，OOM 也不回收，最常见的引用。\n2. **软引用** SoftReference：内存不足时回收，适合做内存敏感的缓存（如图片缓存）。\n3. **弱引用** WeakReference：下次 GC 必定回收，适合避免内存泄漏的映射（如 `WeakHashMap`、ThreadLocal 的 key）。\n4. **虚引用** PhantomReference：随时可能回收，必须配合 `ReferenceQueue` 使用，用于跟踪对象被回收的时刻（如堆外内存清理，Netty 的 DirectBuffer）。",
    ["Java", "编程语言与编程基础"], "高级", "简答题", ["Java后端工程师"], "3-5年", ["引用","GC","内存"], 84);
  q("什么是 Java 内存模型（JMM）？happens-before 原则是什么？", "解释 JMM 要解决什么问题，并列举几条 happens-before 规则。",
    "**JMM**（Java Memory Model）定义了多线程下变量的可见性规则与重排序约束，屏蔽了不同硬件的内存一致性差异，目标是让开发者能预测并发行为。\n\n**happens-before** 是一组偏序规则，若 A happens-before B，则 A 的结果对 B 可见。常见规则：\n- 程序顺序规则：单线程内前面的操作 hb 后面的；\n- 监视器锁规则：unlock hb 后续 lock；\n- volatile 规则：写 hb 后续读；\n- 线程启动/终止规则；\n- 传递性。\n它让 `volatile`/`synchronized` 的语义有了形式化保证。",
    ["Java", "编程语言与编程基础"], "专家", "简答题", ["Java后端工程师"], "5年以上", ["JMM","happens-before","并发"], 82);
  q("设计一个线程安全的单例（双重检查锁）。", "写出双重检查锁单例代码，并解释为什么 instance 要用 volatile。",
    "```java\npublic class Singleton {\n    private static volatile Singleton instance;\n    private Singleton() {}\n    public static Singleton getInstance() {\n        if (instance == null) {            // 第一次检查（避免每次加锁）\n            synchronized (Singleton.class) {\n                if (instance == null) {    // 第二次检查（防止重复创建）\n                    instance = new Singleton();\n                }\n            }\n        }\n        return instance;\n    }\n}\n```\n**volatile 的必要性**：`instance = new Singleton()` 实际分三步（分配内存→初始化对象→赋值引用）。没有 volatile 时编译器/CPU 可能重排为 分配→赋值→初始化，导致其他线程拿到**未初始化完成**的对象。volatile 禁止该重排，保证可见且有序。",
    ["Java", "编程语言与编程基础"], "中级", "编程题", ["Java后端工程师"], "1-3年", ["单例","并发","volatile"], 91);

  /* Python 基础 x5 */
  q("Python 中 list 与 tuple 的区别？什么场景用 tuple？", "从可变性、性能、语义三方面说明，并解释 why tuple 可作为 dict 的 key。",
    "- **可变性**：list 可变（可增删改）；tuple 不可变。\n- **性能**：tuple 更轻量，创建/遍历略快，内存占用更小。\n- **语义**：tuple 表达“一组相关数据/记录”（如坐标、配置），list 表达“同构集合”。\n\n**可作 dict key**：因为 tuple 不可变且可哈希；list 可变不可哈希，不能作 key。\n\n场景：函数返回多个值（本质返回 tuple）、不想被修改的配置项、需要作为集合/字典键的数据。",
    ["Python", "编程语言与编程基础"], "初级", "简答题", ["Python开发工程师","Python后端工程师"], "0-1年", ["Python基础","tuple","list"], 88);
  q("解释 Python 的 GIL 是什么，对多线程有什么影响？", "说明 GIL 的成因、对 CPU 密集与 IO 密集任务的不同影响，以及绕过方式。",
    "**GIL**（全局解释器锁）是 CPython 的一把全局锁，保证同一时刻只有一个线程执行字节码，源于早期单核时代简化内存管理的设计。\n\n**影响**：\n- **CPU 密集**：多线程无法利用多核，反而因上下文切换变慢；应改用 `multiprocessing`（多进程，各自有独立 GIL）或 C 扩展（释放 GIL）。\n- **IO 密集**：线程在等待 IO 时会释放 GIL，多线程仍有效，可用 `threading` 或 `asyncio`。\n\n**绕过**：多进程、`asyncio` 协程、Cython/Numba 释放 GIL 的计算。",
    ["Python", "编程语言与编程基础"], "中级", "简答题", ["Python后端工程师","算法工程师"], "1-3年", ["GIL","并发","Python"], 89);
  q("Python 装饰器原理与示例。", "解释装饰器本质，写一个统计函数耗时的装饰器（支持带参）。",
    "**本质**：装饰器是高阶函数，接收函数作为参数并返回新函数，利用闭包保存原函数为变量。语法糖 `@dec` 等价于 `f = dec(f)`。\n\n```python\nimport time\nfrom functools import wraps\n\ndef timing(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        t = time.time()\n        res = func(*args, **kwargs)\n        print(f\"{func.__name__} 耗时 {time.time()-t:.3f}s\")\n        return res\n    return wrapper\n\n@timing\ndef work():\n    time.sleep(0.5)\n```\n`@wraps` 用于保留原函数元信息（name、doc）。带参装饰器则是三层嵌套：先接收参数，再返回真正的装饰器。",
    ["Python", "编程语言与编程基础"], "中级", "编程题", ["Python后端工程师"], "1-3年", ["装饰器","闭包","Python"], 90);
  q("Python 中深拷贝与浅拷贝的区别？", "说明 copy.copy 与 copy.deepcopy，并用可变对象嵌套举例。",
    "- **赋值** `b = a`：b 与 a 指向同一对象。\n- **浅拷贝** `copy.copy`：创建新容器，但内部元素仍是原对象的引用（嵌套可变对象共享）。\n- **深拷贝** `copy.deepcopy`：递归复制所有层级，完全独立。\n\n```python\nimport copy\na = [[1,2],3]\nb = copy.copy(a)     # b[0] 与 a[0] 是同一列表\nc = copy.deepcopy(a) # 完全独立\nb[0][0] = 9          # a 也会变\nc[0][0] = 0          # a 不变\n```\n注意：深拷贝会处理循环引用，但对打开了的文件句柄等不可 pickle 的对象需自定义 `__deepcopy__`。",
    ["Python", "编程语言与编程基础"], "初级", "简答题", ["Python后端工程师"], "0-1年", ["拷贝","Python"], 86);
  q("解释 Python 的迭代器与生成器。", "说明 iter/next、可迭代对象，以及 yield 生成器的优势。",
    "- **可迭代对象**（Iterable）：实现了 `__iter__` 的对象（list、dict、str 等）。\n- **迭代器**（Iterator）：实现了 `__iter__` + `__next__`，`next()` 返回下一个值，耗尽抛 `StopIteration`。\n- **生成器**（Generator）：用 `yield` 的函数，自动实现迭代器协议，状态挂起/恢复，惰性产出。\n\n**优势**：生成器边迭代边计算，内存占用 O(1)，适合处理大文件/无限序列。\n```python\ndef fib():\n    a,b = 0,1\n    while True:\n        yield a\n        a,b = b,a+b\n```",
    ["Python", "编程语言与编程基础"], "中级", "简答题", ["Python后端工程师","算法工程师"], "1-3年", ["生成器","迭代器","Python"], 88);

  /* JavaScript / 前端基础 x10 */
  q("var、let、const 的区别？", "从作用域、变量提升、重复声明、可变性说明。",
    "- **作用域**：var 是函数作用域；let/const 是块级作用域。\n- **提升**：var 提升并初始化为 undefined（可先使用后声明）；let/const 存在“暂时性死区”，声明前访问报错。\n- **重复声明**：var 允许；let/const 不允许。\n- **可变性**：const 绑定不可重新赋值（但对象内部属性可改）；let 可重新赋值。\n\n实践中默认用 const，需要重新赋值时用 let，避免使用 var。",
    ["JavaScript", "编程语言与编程基础"], "初级", "简答题", ["前端开发工程师","Web全栈工程师"], "0-1年", ["JS基础","作用域"], 89);
  q("什么是闭包？有什么应用场景和陷阱？", "给出闭包定义、示例，并说明内存泄漏风险。",
    "**闭包** 是函数与其词法作用域的组合，使内部函数可以访问外部函数作用域的变量，即使外部函数已返回。\n\n```javascript\nfunction counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst c = counter();\nc(); // 1\n```\n**应用**：数据私有化、函数工厂、节流防抖、React hooks 原理、模块化（IIFE）。\n**陷阱**：闭包长期持有外部变量引用，可能导致**内存泄漏**；循环中用 `var` 创建闭包常拿到同一变量，需用 `let` 或 IIFE 解决。",
    ["JavaScript", "编程语言与编程基础"], "初级", "简答题", ["前端开发工程师","Web全栈工程师"], "0-1年", ["闭包","JS基础"], 90);
  q("事件冒泡与事件委托是什么？", "解释捕获/冒泡阶段，并说明事件委托的实现与好处。",
    "DOM 事件流分三阶段：捕获（根→目标）、目标、冒泡（目标→根）。\n\n**事件冒泡**：事件从触发元素向上层父元素传播。\n**事件委托**：利用冒泡，在父元素上统一监听，通过 `event.target` 判断来源处理子元素事件。\n\n```javascript\ndocument.querySelector('ul').addEventListener('click', e => {\n  if (e.target.matches('li')) handle(e.target);\n});\n```\n**好处**：动态增删子元素无需重新绑定、减少监听器数量、提升性能。注意 `stopPropagation()` 会阻断委托。",
    ["JavaScript", "编程语言与编程基础"], "初级", "简答题", ["前端开发工程师"], "0-1年", ["事件","事件委托"], 88);
  q("Promise 与 async/await 的区别与联系？", "说明回调地狱、Promise 状态、async/await 错误处理。",
    "- **回调地狱**：多层嵌套回调导致可读性差、错误处理困难。\n- **Promise**：表示一个异步最终完成/失败的对象，状态 pending→fulfilled/rejected，通过 `.then/.catch` 链式调用解决嵌套。\n- **async/await**：基于 Promise 的语法糖，`async` 函数返回 Promise，`await` 暂停等待结果，代码像同步一样直观。\n\n**错误处理**：Promise 用 `.catch`；async 用 `try/catch`。`Promise.all` 并发、任一失败即失败；`Promise.allSettled` 全部结算；`Promise.race` 取最快。",
    ["JavaScript", "编程语言与编程基础"], "中级", "简答题", ["前端开发工程师","Node.js工程师"], "1-3年", ["Promise","异步","async"], 90);
  q("什么是防抖（debounce）和节流（throttle）？", "给出定义与实现，并说明搜索输入用哪个。",
    "- **防抖**：事件触发后延迟执行，期间再次触发则重新计时，只执行最后一次。适合搜索输入、窗口 resize。\n- **节流**：固定时间间隔内只执行一次，适合滚动、拖拽、按钮连点。\n\n```javascript\nfunction debounce(fn, wait) {\n  let t;\n  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };\n}\nfunction throttle(fn, wait) {\n  let last = 0;\n  return (...a) => {\n    const now = Date.now();\n    if (now - last >= wait) { last = now; fn(...a); }\n  };\n}\n```",
    ["JavaScript", "编程语言与编程基础"], "中级", "编程题", ["前端开发工程师"], "1-3年", ["防抖","节流","性能"], 89);
  q("CSS 盒模型与 BFC 是什么？", "说明标准盒模型与 IE 盒模型，以及 BFC 的触发与用途。",
    "**盒模型**：每个元素由 content + padding + border + margin 组成。\n- 标准盒模型 `box-sizing: content-box`：width 仅指 content。\n- IE 盒模型 `box-sizing: border-box`：width 包含 content+padding+border（更直观，推荐全局设置）。\n\n**BFC**（块级格式化上下文）：独立的渲染区域，内部布局不影响外部。\n**触发**：`overflow≠visible`、`float`、`position:absolute/fixed`、`display:flex/grid/inline-block` 等。\n**用途**：清除浮动（包含浮动元素）、阻止外边距合并、防止文字环绕浮动。",
    ["CSS", "Web前端开发"], "初级", "简答题", ["前端开发工程师"], "0-1年", ["CSS","盒模型","BFC"], 87);
  q("Flex 布局常用属性与两端对齐怎么写？", "列出容器与项目的关键属性，并实现水平垂直居中。",
    "**容器**：`display:flex`；`flex-direction`（主轴方向）；`justify-content`（主轴对齐）；`align-items`（交叉轴对齐）；`flex-wrap`（换行）；`gap`（间距）。\n**项目**：`flex: grow shrink basis`；`align-self`；`order`。\n\n**水平垂直居中**：\n```css\n.parent { display:flex; justify-content:center; align-items:center; }\n```\n或 `margin:auto` 在 flex 子项上也生效。Grid 方案：`place-items:center`。",
    ["CSS", "Web前端开发"], "初级", "简答题", ["前端开发工程师"], "0-1年", ["Flex","布局"], 86);
  q("浏览器从输入 URL 到页面展示发生了什么？", "描述关键步骤：DNS、TCP、HTTP、渲染。",
    "1. **URL 解析**与缓存检查（强缓存命中直接返回）。\n2. **DNS 解析**：域名→IP（递归+迭代查询，含 hosts、本地缓存）。\n3. **TCP 连接**：三次握手（HTTPS 还有 TLS 握手）。\n4. **发送 HTTP 请求**，服务器响应（状态码、HTML）。\n5. **解析渲染**：构建 DOM 树、CSSOM 树→渲染树→布局（Layout）→绘制（Paint）→合成（Composite）。\n6. **加载子资源**（JS/CSS/图片），JS 可能阻塞解析（defer/async 优化）。\n期间涉及回流（Reflow）与重绘（Repaint），应减少强制同步布局。",
    ["浏览器原理", "Web前端开发"], "中级", "简答题", ["前端开发工程师","Web全栈工程师"], "1-3年", ["浏览器","渲染","性能"], 91);
  q("什么是跨域？如何解决？", "解释同源策略，列举 CORS、代理、JSONP 等方案及适用场景。",
    "**同源策略**：协议、域名、端口三者相同才同源，用于隔离恶意文档。跨域即不同源请求被限制。\n\n**解决方案**：\n1. **CORS**（主流）：服务端设置 `Access-Control-Allow-Origin` 等响应头，分简单请求与预检（OPTIONS）请求。\n2. **反向代理**：开发用 Vite/webpack proxy，生产用 Nginx，把跨域变成同源。\n3. **JSONP**：利用 `<script>` 不受同源限制，仅支持 GET，已淘汰。\n4. **postMessage / WebSocket**：特殊通道。\n\n注意：CORS 是服务端策略，纯前端无法单方面绕过（这正是本项目 AI 调用可能遇到 CORS 的原因）。",
    ["HTTP与HTTPS", "计算机网络与协议"], "中级", "简答题", ["前端开发工程师","Web全栈工程师"], "1-3年", ["跨域","CORS","同源"], 90);
  q("localStorage、sessionStorage、cookie 的区别？", "从生命周期、容量、请求携带、安全性对比。",
    "- **生命周期**：localStorage 永久（手动清除）；sessionStorage 仅当前标签页会话；cookie 可设过期时间。\n- **容量**：localStorage/sessionStorage 约 5MB；cookie 约 4KB。\n- **请求携带**：cookie 每次同源请求自动带（有性能/安全风险）；storage 不随请求发送。\n- **安全**：cookie 可设 HttpOnly（防 XSS 读取）、Secure、SameSite。\n\n**本项目用法**：主题/登录态/API Key 用 localStorage 或 sessionStorage；敏感 token 优先 HttpOnly cookie（但静态站只能用 storage）。",
    ["JavaScript基础", "Web前端开发"], "初级", "简答题", ["前端开发工程师"], "0-1年", ["存储","cookie"], 85);

  /* Vue / React 框架 x5 */
  q("Vue3 的响应式原理是什么？与 Vue2 有何不同？", "说明 Proxy 与 Object.defineProperty 的差异及优势。",
    "**Vue2**：基于 `Object.defineProperty` 劫持属性 get/set，需递归遍历、对新增/删除属性需用 `Vue.set`/`delete`，数组通过重写方法实现。\n\n**Vue3**：基于 `Proxy` 代理整个对象，懒代理（访问才递归），天然支持新增/删除属性、数组索引与 length 变化，性能更好、代码更简洁。配合 `Reflect` 操作。\n\n**心智模型**：`reactive()` 返回 Proxy，`ref()` 用对象包 `.value`（模板自动解包），`effect`/`track`/`trigger` 完成依赖收集与触发。",
    ["Vue3", "Web前端开发"], "中级", "简答题", ["前端开发工程师","Web全栈工程师"], "1-3年", ["Vue","响应式","Proxy"], 92);
  q("Vue 中 key 的作用是什么？为什么列表要用 key？", "解释 diff 算法中 key 的作用与乱用 index 作为 key 的风险。",
    "**key** 是虚拟 DOM diff 时识别节点的**唯一标识**，用于判断节点是否可复用，从而正确执行移动/更新/删除，而非就地复用。\n\n**用 index 作 key 的风险**：列表增删/排序时，index 会错位，导致状态错乱（如输入框内容串位、复选框错配）。应优先使用**稳定唯一 id**。\n\n**结论**：列表渲染必给 key，且用业务主键而非数组下标。",
    ["Vue3", "Web前端开发"], "初级", "简答题", ["前端开发工程师"], "0-1年", ["Vue","key","diff"], 88);
  q("React 中 useEffect 的依赖数组怎么用？", "说明空数组、带依赖、不带依赖的区别，以及清理函数的作用。",
    "`useEffect(fn, deps)`：\n- **不传 deps**：每次渲染后都执行（含挂载和更新）。\n- **空数组 `[]`**：仅挂载时执行一次（类似 componentDidMount）。\n- **带依赖 `[a,b]`**：a/b 变化时执行。\n\n**清理函数**：return 的函数在下次执行前/卸载时调用，用于取消订阅、清除定时器，避免内存泄漏。\n\n**常见坑**：依赖缺失导致闭包拿到旧值；解决办法是把依赖写全或用 `useRef`/`useCallback` 稳定引用。React 18 严格模式下会故意双调用 effect 以暴露副作用问题。",
    ["React", "Web前端开发"], "中级", "简答题", ["前端开发工程师"], "1-3年", ["React","Hooks","useEffect"], 89);
  q("Vue 与 React 的核心差异有哪些？", "从响应式、模板、状态管理、生态等维度对比。",
    "- **响应式**：Vue 自动依赖追踪（Proxy）；React 需手动 `setState`/`useState` 触发，函数组件+Hooks。\n- **模板**：Vue 用单文件组件模板（HTML 风格）；React 用 JSX（JS 即 UI）。\n- **状态更新**：Vue 直接改响应式对象；React 强调不可变数据、返回新状态。\n- **心智负担**：Vue 约定优于配置、上手快；React 更灵活、需自行组织。\n- **生态**：Vue 官方全家桶（Router/Pinia）；React 生态更分散（Redux/Zustand 等）。\n两者都能构建大型应用，选型看团队偏好与项目需求。",
    ["Vue3", "Web前端开发"], "中级", "开放讨论题", ["前端开发工程师","Web全栈工程师"], "1-3年", ["Vue","React","框架对比"], 87);
  q("什么是虚拟 DOM？它一定比直接操作 DOM 快吗？", "解释 vdom 的初衷、diff 流程，并澄清性能认知误区。",
    "**虚拟 DOM**：用 JS 对象描述 UI 结构，状态变化时生成新 vdom，与旧 vdom diff 出最小变更再批量更新真实 DOM。\n\n**diff 流程**：同层比较、key 复用、类型不同整体替换。\n\n**误区**：vdom 不是为了“比原生 DOM 操作更快”，而是为了**跨平台、可预测、开发友好**。极端细粒度高频更新下，手动精准操作 DOM 可能更快；vdom 的价值在于避免开发者手写低效的重排重绘与复杂 diff。现代框架（Vue3/Facebook）还配合编译期优化（静态提升）进一步减少运行时开销。",
    ["Vue3", "Web前端开发"], "高级", "开放讨论题", ["前端架构师","前端开发工程师"], "3-5年", ["虚拟DOM","diff","性能"], 85);

  /* MySQL x8 */
  q("MySQL 索引为什么用 B+ 树而不是 B 树或 Hash？", "说明 B+ 树结构特点及相比其他结构的优势。",
    "**B+ 树特点**：\n- 所有数据存于**叶子节点**，且叶子间用链表相连；非叶子节点只存 key，扇出大、树矮（3 层可存千万级）。\n- 范围查询只需沿叶子链表扫描，无需回上层。\n\n**对比**：\n- **B 树**：数据分布各层，范围查询需中序遍历，缓存命中率低。\n- **Hash**：等值查询 O(1) 极快，但**不支持范围/排序/前缀**，且需处理哈希冲突。\n\n因此 B+ 树兼顾等值、范围、有序，最契合关系型查询；Memory 引擎可用 Hash 索引作补充。",
    ["MySQL", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Python后端工程师","Go后端工程师"], "1-3年", ["索引","B+树","MySQL"], 92);
  q("什么是回表？什么是覆盖索引？", "解释二级索引回表过程，以及如何用覆盖索引优化。",
    "**二级索引**叶子节点存的是**索引列 + 主键值**。通过二级索引查到主键后，还需用主键去聚簇索引再查一次完整行，这就是**回表**。\n\n**覆盖索引**：查询所需的所有列都包含在索引中，无需回表。例如 `INDEX(a,b)` 且查询 `SELECT a,b WHERE a=?`，直接命中索引即返回。\n\n**优化**：把常用查询列加入联合索引（遵循最左前缀）、避免 `SELECT *`、用 `EXPLAIN` 看 `Extra: Using index` 判断是否覆盖。",
    ["MySQL", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Go后端工程师"], "1-3年", ["覆盖索引","回表","MySQL"], 90);
  q("MySQL 事务的 ACID 与隔离级别？", "说明 ACID 含义及四种隔离级别，以及各级别解决什么问题。",
    "**ACID**：原子性（Atomicity，undo log）、一致性（Consistency，业务约束）、隔离性（Isolation）、持久性（Durability，redo log + 双写缓冲）。\n\n**隔离级别**（并发问题：脏读/不可重复读/幻读）：\n- 读未提交：都有；\n- 读已提交（RC）：解决脏读；\n- 可重复读（RR，MySQL 默认）：解决脏读+不可重复读，靠 MVCC + 间隙锁解决大部分幻读；\n- 串行化：完全隔离，性能差。\n\nMVCC 通过 undo log 版本链 + ReadView 实现快照读，写加锁保证一致性。",
    ["MySQL", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","数据库开发工程师"], "1-3年", ["事务","隔离级别","ACID"], 91);
  q("什么是最左前缀原则？", "举例联合索引 (a,b,c) 哪些查询能命中。",
    "联合索引 `(a,b,c)` 按 a→b→c 排序，**必须从最左列开始且连续**才能充分利用索引：\n- `WHERE a=?` ✅ 命中 a\n- `WHERE a=? AND b=?` ✅ 命中 a,b\n- `WHERE a=? AND b=? AND c=?` ✅ 全命中\n- `WHERE b=?` ❌ 跳过 a，无法命中（除非索引跳跃扫描）\n- `WHERE a=? AND c=?` ⚠️ 命中 a，c 无法用索引过滤（范围后失效）\n- 范围查询（>、<、like 'x%'）之后的列失效。\n\n**设计**：高频等值列放左，范围列放右。",
    ["MySQL", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Go后端工程师"], "1-3年", ["最左前缀","联合索引","MySQL"], 89);
  q("如何排查慢 SQL？", "给出从 EXPLAIN 到优化的完整思路。",
    "1. **定位**：开启慢查询日志（`slow_query_log`），或用 `SHOW PROCESSLIST` 看长事务。\n2. **分析**：`EXPLAIN` 看执行计划，重点 `type`（all<index<range<ref<eq_ref<const）、`key`（是否用索引）、`rows`（扫描行数）、`Extra`（Using filesort/index/where）。\n3. **常见原因**：缺失索引、索引失效（函数/隐式转换/`%`前模糊）、选错索引、大表 JOIN、返回列过多、锁等待。\n4. **优化**：建/调整索引、改写 SQL（避免 `SELECT *`、分页优化）、减少锁范围、必要时分库分表。\n5. **验证**：复跑 EXPLAIN 与真实耗时。",
    ["MySQL", "数据库与数据存储"], "高级", "故障排查题", ["Java后端工程师","数据库架构师"], "3-5年", ["慢SQL","调优","EXPLAIN"], 88);
  q("MySQL 死锁是怎么产生的？如何避免？", "解释死锁条件、MySQL 的处理机制与预防策略。",
    "**死锁**：两个事务互相持有对方需要的锁并等待，形成循环等待。InnoDB 用**等待图**检测，发现死锁后回滚代价较小的事务并报错 `1213`。\n\n**常见原因**：不同事务以不同顺序更新多行（T1 先 A 后 B，T2 先 B 后 A）。\n\n**避免**：\n- 约定统一的**加锁顺序**；\n- 缩小事务、尽快提交，减少锁持有时间；\n- 降低隔离级别（RC 减少间隙锁）；\n- 为更新加合理索引，避免锁升级为表锁；\n- 应用层捕获 1213 重试。",
    ["MySQL", "数据库与数据存储"], "高级", "简答题", ["Java后端工程师","数据库架构师"], "3-5年", ["死锁","锁","MySQL"], 86);
  q("limit 深度分页为什么慢？如何优化？", "解释大偏移量的性能问题并给出方案。",
    "`SELECT * FROM t ORDER BY id LIMIT 1000000, 20` 需先扫描并丢弃前 100 万行，再取 20 行，越翻越慢。\n\n**优化方案**：\n1. **游标分页（延迟关联）**：`WHERE id > 上次最大id LIMIT 20`，利用主键索引，避免扫描丢弃。\n2. **覆盖索引 + 子查询**：先查索引拿 id，再 JOIN 回表取所需列。\n3. **业务限制**：禁止跳到过深页（如只允许前 100 页）。\n\n前提是有稳定有序键（如自增 id 或时间戳）。",
    ["MySQL", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Go后端工程师"], "1-3年", ["分页","深度分页","MySQL"], 87);
  q("char 与 varchar 的区别？怎么选？", "从存储、性能、适用场景对比。",
    "- **CHAR(n)**：定长，不足补空格，适合长度固定的数据（如 MD5、手机号、性别码）；读取快但浪费空间。\n- **VARCHAR(n)**：变长，存 1-2 字节长度前缀 + 实际内容，适合不定长文本（用户名、地址）。\n\n**注意**：VARCHAR 最大 65535 字节受行大小限制；超长用 TEXT（外部存储）。\n**选型**：长度固定且较短 → CHAR；长度变化大 → VARCHAR；不要盲目给 VARCHAR(255) 撑满，合理即可（影响临时表与索引选择）。",
    ["MySQL", "数据库与数据存储"], "初级", "简答题", ["Java后端工程师"], "0-1年", ["char","varchar","MySQL"], 84);

  /* Redis x8 */
  q("Redis 为什么快？", "从内存、数据结构、IO 模型等方面说明。",
    "1. **纯内存操作**：数据在内存，纳秒级访问，远快于磁盘。\n2. **高效数据结构**：SDS、跳表、字典、压缩列表等针对性实现，操作多为 O(1)/O(log n)。\n3. **单线程模型**：6.0 前网络读写与命令执行单线程，避免锁竞争与上下文切换（执行命令仍是单线程）；6.0 引入多线程 IO 处理网络读写，命令执行仍单线程。\n4. **IO 多路复用**（epoll）+ 非阻塞，单线程支撑高并发。\n5. **渐进式 rehash、惰性删除**等细节优化。\n注意：单线程不意味并发低，瓶颈在内存带宽而非 CPU。",
    ["Redis", "数据库与数据存储"], "初级", "简答题", ["Java后端工程师","Go后端工程师","Python后端工程师"], "0-1年", ["Redis","性能"], 90);
  q("Redis 常见数据类型及使用场景？", "列出 string/hash/list/set/zset 及其典型用途。",
    "- **String**：缓存、计数器（INCR）、分布式锁、限流。\n- **Hash**：对象存储（用户信息、购物车）。\n- **List**：队列、最新列表、消息流（LPUSH+LRANGE）。\n- **Set**：去重、共同关注/点赞、随机抽奖（SRANDMEMBER）。\n- **ZSet（有序集合）**：排行榜（ZADD+ZREVRANGE）、延迟队列（score=执行时间）、范围统计。\n- 还有 Bitmap（签到）、HyperLogLog（UV 估算）、Geo（附近的人）、Stream（消息队列）。\n\n选型核心：是否需要排序、去重、结构化。",
    ["Redis", "数据库与数据存储"], "初级", "简答题", ["Java后端工程师","Go后端工程师"], "0-1年", ["Redis","数据类型"], 89);
  q("如何用 Redis 实现分布式锁？有什么坑？", "说明 SET NX、过期时间、误删问题与 Redlock。",
    "**基本实现**：`SET lock:key value NX PX 30000`——原子地“不存在才设+带过期”，避免 `SETNX` 与 `EXPIRE` 分两步的竞态。\n\n**坑**：\n1. **误删**：A 锁过期，B 拿到锁，A 执行完删了 B 的锁 → 用唯一 value（UUID），删除时 `Lua` 脚本校验归属。\n2. **过期时间内未执行完**：锁提前失效 → 看门狗自动续期（Redisson）。\n3. **主从切换丢锁**：master 宕机前未同步 → Redlock（多节点多数派）提升可靠性但仍有争议（Martin Kleppmann 批评），非强一致场景常用单实例+续期已足够。",
    ["Redis", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Go后端工程师"], "1-3年", ["Redis","分布式锁"], 91);
  q("缓存穿透、击穿、雪崩是什么？如何应对？", "分别解释三者并给出解决方案。",
    "- **穿透**：查不存在的数据，缓存与 DB 都没有，请求直击 DB。→ 布隆过滤器、缓存空值（短 TTL）。\n- **击穿**：某热点 key 过期瞬间，大量并发同时回源。→ 热点 key 不过期/逻辑过期、互斥锁（只放一个回源）、singleflight。\n- **雪崩**：大量 key 同一时间过期，或 Redis 宕机，DB 被打垮。→ 过期时间加随机抖动、多级缓存、Redis 高可用（集群）+ 限流降级、预热。\n共同思想：限流、降级、错峰、兜底。",
    ["Redis", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","Go后端工程师"], "1-3年", ["缓存","穿透","击穿","雪崩"], 92);
  q("Redis 的持久化 RDB 与 AOF 区别？", "说明两种机制、优缺点及生产建议。",
    "- **RDB**：定时把内存快照写入 `.rdb`。优点：文件紧凑、恢复快、对性能影响小；缺点：可能丢失最后一次快照后的数据，大数据集 fork 有延迟。\n- **AOF**：记录每条写命令（append-only），可配置每秒 fsync。优点：数据更安全（最多丢 1 秒）；缺点：文件大、恢复慢。AOF 重写（bgrewriteaof）压缩命令。\n\n**生产建议**：同时开启（混合持久化，Redis 4+ 默认 AOF 含 RDB 头），兼顾安全与恢复速度；根据可接受的数据丢失窗口调 `appendfsync`。",
    ["Redis", "数据库与数据存储"], "中级", "简答题", ["Java后端工程师","数据库架构师"], "1-3年", ["Redis","持久化","RDB","AOF"], 88);
  q("什么是缓存与数据库一致性问题？如何保证？", "解释先更新 DB 还是先删缓存，及延迟双删。",
    "**经典顺序争议**：\n- 先更新 DB 再删缓存（Cache-Aside 推荐）：并发下偶发不一致（读在更新前命中旧缓存），但概率低，且靠“删缓存”兜底。\n- 先删缓存再更新 DB：更新期间读会回源旧值并写入缓存，造成长期不一致。\n\n**增强方案**：\n- **延迟双删**：更新 DB 后删缓存，延迟几百 ms 再删一次，清除回源写入的旧值。\n- **订阅 binlog**（Canal）异步删缓存，解耦且可靠。\n- 强一致要求极高时，用分布式锁或读时校验版本。绝大多数业务“最终一致”即可。",
    ["Redis", "数据库与数据存储"], "高级", "场景题", ["Java后端工程师","Go后端工程师"], "3-5年", ["缓存一致性","Cache-Aside"], 87);
  q("Redis 跳表（zset）的原理？", "说明跳表结构、查询复杂度与为何不用平衡树。",
    "**跳表（Skip List）** 是有序集合 ZSet 的底层之一（元素多时用跳表+字典）。它在有序链表上建多层索引：底层全量有序，往上每层随机跳过部分节点（概率 1/2），形成“高速公路”。\n\n- **查询/插入/删除**平均 O(log n)，最坏 O(n)，但实现简单、无旋转。\n- **范围查询**优秀：定位起点后沿底层链表顺序遍历。\n\n**为何不用平衡树**：跳表范围遍历更自然、实现与调试更简单、并发下锁粒度更细；内存略高但可接受。ZSet 同时用 dict 存 member→score 以 O(1) 查分。",
    ["Redis", "数据库与数据存储"], "高级", "简答题", ["Java后端工程师"], "3-5年", ["跳表","zset","Redis"], 84);
  q("如何使用 Redis 做限流？", "给出计数器/滑动窗口/令牌桶的实现思路。",
    "1. **固定窗口计数器**：`INCR` + `EXPIRE`，超过阈值拒绝。简单但有临界突刺。\n2. **滑动窗口**：用 ZSet 存时间戳（score=时间），统计窗口内数量并移除过期，精确但耗内存。\n3. **令牌桶**：用 List/ZSet 模拟令牌补充，或 Redis-Cell 模块的 `CL.THROTTLE`。\n4. **漏桶**：匀速处理，平滑但无突发。\n\n**实践**：简单接口用固定窗口即可；需要平滑用滑动窗口或令牌桶；集群环境注意多实例共享计数（集中到同一 Redis）。",
    ["Redis", "数据库与数据存储"], "中级", "场景题", ["Go后端工程师","Java后端工程师"], "1-3年", ["限流","Redis"], 85);

  /* Linux 基础 x5 */
  q("如何查看 Linux 系统的 CPU、内存、磁盘使用情况？", "列出常用命令及其关注点。",
    "- **CPU**：`top`/`htop`（实时）、`mpstat -P ALL`、`cat /proc/cpuinfo`、`uptime`（负载）。\n- **内存**：`free -h`、`cat /proc/meminfo`、`top`（RES/SHR）。注意 buffer/cache 可回收。\n- **磁盘**：`df -h`（分区用量）、`du -sh *`（目录大小）、`iostat -x`（IO 等待）。\n- **进程**：`ps aux`、`lsof -i:端口`、`netstat -tunlp`。\n排查思路：先看负载/CPU 利用率，再看内存是否 OOM，再看磁盘 IO 与剩余空间。",
    ["Linux操作系统", "操作系统与系统运维"], "初级", "简答题", ["Linux运维工程师","DevOps工程师","Java后端工程师"], "0-1年", ["Linux","运维","排查"], 87);
  q("chmod 755 是什么含义？", "解释数字权限与 rwx 位，并说明 umask。",
    "`chmod` 数字法三位分别对应 **属主/属组/其他**，每位是 r(4)+w(2)+x(1) 之和。\n- `7=4+2+1` → rwx（读+写+执行）\n- `5=4+1` → r-x（读+执行）\n- `755`：属主可读写执行，组和其他只读执行。\n\n**目录的 x** 表示可进入（cd），**文件的 x** 表示可执行。\n**umask**：创建文件/目录时的默认权限掩码（如 022 表示去掉组/其他的写），实际权限 = 默认 - umask。",
    ["Linux操作系统", "操作系统与系统运维"], "初级", "简答题", ["Linux运维工程师","系统运维工程师"], "0-1年", ["chmod","权限","Linux"], 86);
  q("如何排查一个端口被占用、服务起不来的问题？", "给出逐步定位思路（以 8080 为例）。",
    "1. 确认监听：`ss -tlnp | grep 8080` 或 `netstat -tunlp | grep 8080`、Windows `netstat -ano`。\n2. 找占用进程 PID，再 `ps -fp <pid>` 看是什么程序。\n3. 若确需释放：`kill <pid>`（优雅）/ `kill -9`（强制）；容器场景检查是否端口映射冲突。\n4. 服务起不来还需看日志：`journalctl -u 服务名`、`/var/log/...`、`docker logs`。\n5. 防火墙：`iptables -L` / `firewall-cmd --list-ports`、`telnet ip 端口` 测连通。\n常见根因：旧进程未退出、配置端口写错、云安全组未放行。",
    ["Linux操作系统", "操作系统与系统运维"], "中级", "故障排查题", ["Linux运维工程师","DevOps工程师"], "1-3年", ["端口","排查","Linux"], 85);
  q("grep / awk / sed 的常见用法？", "各举一个实用例子。",
    "- **grep**：`grep -rn \"error\" /var/log --include=*.log` 递归按关键字查；`-v` 反选，`-i` 忽略大小写，`-C3` 上下文。\n- **awk**：`awk -F',' '{sum+=$3} END{print sum}' data.csv` 按列求和；`awk '$1>100' access.log` 过滤。\n- **sed**：`sed -i 's/old/new/g' file` 替换；`sed -n '10,20p'` 取行；流编辑不改源（去掉 -i）。\n三者配合管道是日志分析的利器：`cat app.log | grep ERROR | awk '{print $5}' | sort | uniq -c | sort -rn`。",
    ["Shell脚本", "操作系统与系统运维"], "中级", "简答题", ["Linux运维工程师","DevOps工程师"], "1-3年", ["grep","awk","sed","Shell"], 84);
  q("如何用 crontab 定时执行脚本？", "写一条每天凌晨备份的示例并说明注意点。",
    "**格式**：`分 时 日 月 周 命令`。\n\n示例（每天 2:30 执行备份）：\n```bash\n30 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1\n```\n\n**注意点**：\n- 环境变量可能与交互 shell 不同，脚本里用绝对路径或先 `source` 环境。\n- 输出重定向到日志，否则邮件告警刷屏。\n- 用 `crontab -e` 编辑，`crontab -l` 查看。\n- 容器/K8s 中通常不用 cron，改用 Job/CronJob。\n- 关键任务加监控，避免静默失败。",
    ["Shell脚本", "操作系统与系统运维"], "初级", "简答题", ["Linux运维工程师","DevOps工程师"], "0-1年", ["crontab","定时任务","Shell"], 83);

  /* Docker / Kubernetes x8 */
  q("Docker 镜像与容器的区别？", "解释 Image/Container 关系及分层机制。",
    "**镜像（Image）** 是只读模板，由多层只读层（Layer）叠加而成（COPY、RUN 等指令各生成一层），通过联合文件系统（overlayfs）呈现统一视图。\n\n**容器（Container）** 是镜像的运行实例：在镜像层之上加一层**可写层**（容器层），所有修改发生在此层；删除容器后该层丢失（除非 commit 成新镜像/用 volume 持久化）。\n\n**分层优势**：共享基础层、节省空间、构建缓存加速。\n镜像存仓库（Registry），容器由 `docker run` 基于镜像启动。",
    ["Docker", "云原生与DevOps"], "初级", "简答题", ["DevOps工程师","Java后端工程师","Go后端工程师"], "0-1年", ["Docker","镜像","容器"], 90);
  q("Dockerfile 最佳实践有哪些？", "从镜像体积、安全、缓存角度说明。",
    "1. **小基础镜像**：`alpine`、`distroless`，减少体积与攻击面。\n2. **多阶段构建**：编译阶段与运行阶段分离，最终镜像只留产物。\n3. **利用缓存**：变动少的指令（依赖安装）放前，源码拷贝放后。\n4. **精简层**：合并 RUN，清理 apt/yum 缓存。\n5. **非 root 运行**：`USER` 指定普通用户。\n6. **明确 CMD/ENTRYPOINT**，不写死 secrets（用环境变量/secret）。\n7. **.dockerignore** 排除无关文件。\n8. 固定基础镜像版本，避免 `latest` 漂移。",
    ["Docker", "云原生与DevOps"], "中级", "简答题", ["DevOps工程师","云架构师"], "1-3年", ["Dockerfile","最佳实践","Docker"], 89);
  q("Kubernetes 的核心组件有哪些？", "列出控制平面与工作节点关键组件及职责。",
    "**控制平面（Master）**：\n- **API Server**：唯一入口，所有操作经它。\n- **etcd**：集群唯一可靠状态存储（KV）。\n- **Scheduler**：把 Pod 调度到合适节点。\n- **Controller Manager**：维持期望状态（副本数等）。\n- **cloud-controller-manager**：对接云厂商。\n\n**工作节点（Node）**：\n- **kubelet**：管理本节点 Pod 生命周期，与 API Server 通信。\n- **kube-proxy**：维护网络规则（Service→Pod 转发）。\n- **容器运行时**：containerd / CRI-O。\n\n**附加**：CNI（网络）、CoreDNS、Ingress Controller。",
    ["Kubernetes", "云原生与DevOps"], "中级", "简答题", ["DevOps工程师","云架构师","SRE站点可靠性工程师"], "1-3年", ["K8s","组件","云原生"], 91);
  q("Pod、Deployment、Service 的关系？", "说明三者职责与典型用法。",
    "- **Pod**：最小调度单位，包含一个或多个共享网络的容器，通常一个 Pod 跑一个主容器。\n- **Deployment**：管理 Pod 副本与滚动更新，通过 ReplicaSet 维持期望副本数，支持回滚。\n- **Service**：为一组 Pod 提供**稳定虚拟 IP 与负载均衡**，通过 Label Selector 关联 Pod，屏蔽 Pod IP 变化。\n\n**典型链路**：Deployment 创建 Pod → Service 暴露 Pod → Ingress 对外路由。访问经 Service（ClusterIP）→ 轮询到某 Pod。",
    ["Kubernetes", "云原生与DevOps"], "中级", "简答题", ["DevOps工程师","云架构师"], "1-3年", ["K8s","Pod","Service"], 90);
  q("K8s 中 Pod 一直处于 Pending/ImagePullBackOff 怎么排查？", "给出定位步骤。",
    "`kubectl describe pod <p>` 看 **Events** 是关键。\n\n**Pending**：\n- 资源不足（CPU/内存 requests 超过节点剩余）→ 看 `kubectl get nodes` 与资源配额。\n- 节点有 taint 但 Pod 无对应 toleration。\n- 挂载 PVC 未绑定（StorageClass 问题）。\n\n**ImagePullBackOff**：\n- 镜像名/标签错、私有仓库未配 `imagePullSecrets`、仓库网络不通、节点无拉取权限。\n- `kubectl describe` 能看到 `Failed to pull image ... not found / unauthorized`。\n\n**CrashLoopBackOff**：容器启动即退出，看 `kubectl logs <p>` 与退出码（如配置错误、依赖缺失）。",
    ["Kubernetes", "云原生与DevOps"], "高级", "故障排查题", ["DevOps工程师","SRE站点可靠性工程师"], "3-5年", ["K8s","排查","Pod"], 88);
  q("K8s 的 liveness 与 readiness 探针区别？", "说明两种探针的作用与配置建议。",
    "- **livenessProbe（存活探针）**：检测容器是否**活着**。失败则 kubelet 重启该容器。用于死锁、假死场景（如健康检查接口卡住）。\n- **readinessProbe（就绪探针）**：检测容器是否**准备好接收流量**。失败则从 Service 的 endpoints 中摘除，不接受请求，但**不重启**。用于启动慢、依赖未就绪（如未连上 DB）。\n\n**建议**：就绪用“能处理业务”的轻量检查；存活用“进程健康”检查，避免把短暂未就绪误判为死循环而频繁重启。探针类型：httpGet / exec / tcpSocket，配 initialDelay、periodSeconds、failureThreshold。",
    ["Kubernetes", "云原生与DevOps"], "中级", "简答题", ["DevOps工程师","SRE站点可靠性工程师"], "1-3年", ["K8s","探针","liveness"], 87);
  q("什么是 Helm？解决什么问题？", "解释 Helm 在 K8s 中的角色与核心概念。",
    "**Helm** 是 Kubernetes 的**包管理器**，类似 yum/apt。\n\n**核心概念**：\n- **Chart**：一组 YAML 模板 + values.yaml，描述一组 K8s 资源（一个应用）。\n- **Release**：Chart 在集群中的一次部署实例（同一 Chart 可部署多份）。\n- **Repository**：Chart 仓库。\n\n**解决的问题**：\n- 把多份 YAML 参数化、模板化，避免复制粘贴；\n- 版本化、可回滚（`helm rollback`）；\n- 依赖管理（subchart）；\n- 一条命令部署复杂应用（如 `helm install mysql bitnami/mysql`）。\n\n配合 GitOps（ArgoCD）实现声明式发布。",
    ["Helm", "云原生与DevOps"], "中级", "简答题", ["DevOps工程师","云架构师"], "1-3年", ["Helm","K8s","包管理"], 85);
  q("如何实现 K8s 的滚动更新与回滚？", "说明 strategy 配置、健康检查与回滚命令。",
    "**滚动更新**：Deployment 默认 `strategy: RollingUpdate`，配 `maxSurge`（超出期望副本数）/ `maxUnavailable`（不可用上限），逐批替换 Pod，保证服务不中断。\n\n**关键**：就绪探针（readinessProbe）必须正确，否则新 Pod 未就绪就切流量会报错。\n\n**回滚**：\n```bash\nkubectl rollout status deployment/<name>   # 观察\nkubectl rollout undo deployment/<name>      # 回滚到上一版\nkubectl rollout history deployment/<name>   # 查看历史\nkubectl rollout undo deployment/<name> --to-revision=2\n```\n配合 ArgoCD/GitOps 可由 Git 触发、自动同步与一键回退。",
    ["Kubernetes", "云原生与DevOps"], "高级", "场景题", ["DevOps工程师","云架构师"], "3-5年", ["K8s","滚动更新","回滚"], 86);

  /* 计算机网络基础 x5 */
  q("TCP 三次握手与四次挥手的过程？", "说明每步的作用及为什么握手三次、挥手四次。",
    "**三次握手**（建立连接）：\n1. 客户端 SYN（seq=x）→ 服务端；\n2. 服务端 SYN+ACK（seq=y, ack=x+1）→ 客户端；\n3. 客户端 ACK（ack=y+1）→ 服务端。\n目的：双方确认彼此的**发送与接收能力**正常，并同步初始序列号。两次不够（无法确认服务端收能力），四次多余。\n\n**四次挥手**（断开）：因 TCP 全双工，两端各自关闭。\n1. 主动方 FIN → 被动方；\n2. 被动方 ACK（半关闭，还能发数据）；\n3. 被动方 FIN → 主动方；\n4. 主动方 ACK（进入 TIME_WAIT）。\n被动方 ACK 与 FIN 通常分两次（中间可能还有数据要发），故四次。",
    ["TCP/IP协议", "计算机网络与协议"], "中级", "简答题", ["Java后端工程师","网络工程师"], "1-3年", ["TCP","握手","网络"], 91);
  q("TIME_WAIT 的作用与过多怎么办？", "解释为什么需要 TIME_WAIT 及优化手段。",
    "**TIME_WAIT**（主动关闭方在发完最后 ACK 后等待 2MSL）：\n1. 确保最后 ACK 到达对方（丢失则对方重发 FIN，本方还能响应）；\n2. 让本连接的迟到报文在网络中消逝，避免被新连接（同四元组）误收。\n\n**过多的危害**：占用端口（高并发短连接服务端），可用端口耗尽。\n\n**优化**：\n- 服务端尽量**被动关闭**（让客户端 TIME_WAIT）；\n- 开启端口复用 `net.ipv4.tcp_tw_reuse`（客户端安全）；\n- 用长连接/连接池减少频繁建连；\n- 谨慎使用 `tcp_tw_recycle`（NAT 下已废弃）。",
    ["TCP/IP协议", "计算机网络与协议"], "高级", "简答题", ["后端架构师","网络架构师"], "3-5年", ["TIME_WAIT","TCP","网络"], 84);
  q("HTTP 与 HTTPS 的区别？HTTPS 的握手过程？", "说明加密、证书与 TLS 握手。",
    "- **HTTP**：明文传输，端口 80，无身份验证，易被窃听/篡改。\n- **HTTPS** = HTTP + TLS/SSL：加密传输、服务器身份认证、完整性校验，端口 443。\n\n**TLS 握手（简化，ECDHE 为例）**：\n1. 客户端 Hello（支持的套件、随机数）；\n2. 服务端 Hello + **证书**（含公钥、CA 签发）；\n3. 客户端验证证书链（信任 CA）→ 生成预主密钥用证书公钥加密发送（或 ECDHE 交换参数）；\n4. 双方算出**对称会话密钥**；\n5. 之后用对称加密通信（快），握手用非对称（安全）。\n**关键点**：证书防止中间人；非对称仅用于协商密钥，数据用对称加密。",
    ["HTTP与HTTPS", "计算机网络与协议"], "中级", "简答题", ["前端开发工程师","Java后端工程师"], "1-3年", ["HTTPS","TLS","HTTP"], 90);
  q("GET 与 POST 的区别？", "澄清常见误解，区分语义、缓存、幂等。",
    "**语义（REST）**：GET 获取资源（安全/幂等），POST 提交处理（可能改变状态）。\n\n**常见差异**：\n- 参数位置：GET 在 URL（query），POST 在 body（更隐私、体积大）。\n- 缓存：GET 可缓存、可被收藏/重试无害；POST 一般不可缓存。\n- 历史/日志：GET 参数进浏览器历史、服务器日志；POST 不。\n- 编码/长度：GET 受 URL 长度限制；POST 无硬限制。\n\n**误解澄清**：GET 也能带 body（不推荐）、POST 也不绝对比 GET 安全（都明文，安全靠 HTTPS）；“POST 比 GET 安全”只在“不出现在 URL”层面成立。",
    ["HTTP与HTTPS", "计算机网络与协议"], "初级", "简答题", ["前端开发工程师","Web全栈工程师"], "0-1年", ["HTTP","GET","POST"], 87);
  q("浏览器同源策略下，如何解决跨域资源共享？", "从预检请求与凭据角度说明 CORS。",
    "**CORS** 由服务端通过响应头授权：\n- `Access-Control-Allow-Origin: https://a.com`（或 `*`）；\n- 带凭据（`cookie`）时不能用 `*`，且需 `Access-Control-Allow-Credentials: true`，前端 `withCredentials=true`。\n- **预检（OPTIONS）**：当请求为“非简单请求”（如带自定义头、Content-Type 为 application/json、PUT/DELETE），浏览器先发 OPTIONS 询问，服务端需响应 `Allow-Methods/Allow-Headers`，通过后才发真实请求。\n\n**本项目**：纯静态站点调 DeepSeek API，若对方未开启 CORS 则浏览器拦截，需确认服务端支持或用本地代理。",
    ["HTTP与HTTPS", "计算机网络与协议"], "中级", "简答题", ["前端开发工程师","Web全栈工程师"], "1-3年", ["CORS","跨域","同源"], 86);

  /* 数据结构与算法 x8 */
  q("数组与链表的区别？各自适合什么场景？", "从内存、随机访问、插入删除、缓存友好度对比。",
    "- **数组**：连续内存，支持 O(1) 随机访问；插入/删除需搬移 O(n)；缓存命中率高（空间局部性）。适合读多、定长、需下标。\n- **链表**：节点离散，靠指针串联，插入/删除 O(1)（已知节点）；随机访问 O(n)；缓存不友好。适合频繁增删、不确定长度（如 LRU、邻接表）。\n\n**补充**：链表更费内存（指针开销）；数组扩容有拷贝成本。工程中多用动态数组（vector/ArrayList）折中。",
    ["数据结构", "计算机科学基础"], "初级", "简答题", ["Java开发工程师","算法工程师"], "0-1年", ["数组","链表","数据结构"], 88);
  q("什么是时间复杂度与空间复杂度？", "解释大 O 表示法，并举常见复杂度例子。",
    "**复杂度** 描述算法随输入规模 n 增长的**趋势**（忽略常数与低阶项）。\n- **时间复杂度 O()**：基本操作次数上限。常见：O(1) 查数组下标、O(log n) 二分、O(n) 遍历、O(n log n) 快排/归并、O(n²) 冒泡/双重循环、O(2ⁿ) 暴力递归。\n- **空间复杂度**：额外内存随 n 的增长。\n\n**大 O**：关注最坏/渐进，如 `3n²+5n+2` → O(n²)。\n**意义**：用于比较算法在不同规模下的可扩展性，而非绝对快慢（小数据常数因子也重要）。",
    ["算法", "计算机科学基础"], "初级", "简答题", ["算法工程师","Java开发工程师"], "0-1年", ["复杂度","大O","算法"], 87);
  q("快速排序的思想与最坏情况？", "说明分治、partition 与最坏 O(n²) 的成因及优化。",
    "**思想（分治）**：选基准 pivot，partition 把数组分为“小于 pivot”和“大于 pivot”两部分，递归排序两段。平均 O(n log n)。\n\n**最坏 O(n²)**：每次 pivot 都是最值（数组已序且总选首/尾），退化成 n 次 O(n) 划分。\n\n**优化**：\n- 随机选 pivot / 三数取中；\n- 小数组切到插入排序；\n- 尾递归/迭代减少栈深；\n- 三路快排处理大量重复元素。\n\n**不稳定**（相等元素可能换位）；需要原地则快排，要求稳定可用归并。",
    ["算法", "计算机科学基础"], "中级", "简答题", ["算法工程师","Java开发工程师"], "1-3年", ["快排","分治","算法"], 89);
  q("哈希表冲突的解决方法？", "说明开放寻址与链地址，及负载因子。",
    "**冲突**：不同 key 哈希到同一桶。\n\n**解决**：\n1. **链地址法（拉链）**：桶挂链表/红黑树（Java HashMap、Redis 字典），简单、删除易；负载高时退化为树。\n2. **开放寻址**：冲突后按探测序列找下一个空位（线性/二次/双重哈希），如 ThreadLocalMap 用线性探测；缓存友好但易聚集、删除需墓碑。\n3. **再哈希**：换哈希函数再算。\n\n**负载因子** = 元素数/桶数，越大冲突越多；超过阈值（如 0.75）扩容 rehash。选好哈希函数（均匀分布）是关键。",
    ["数据结构", "计算机科学基础"], "中级", "简答题", ["算法工程师","Java后端工程师"], "1-3年", ["哈希","冲突","数据结构"], 88);
  q("二叉树、二叉搜索树、平衡二叉树、红黑树的关系？", "自底向上说明演进动机。",
    "- **二叉树**：每个节点最多两子，通用结构。\n- **BST**：左<根<右，查找 O(h)（h 为树高），但有序插入会退化成链表（O(n)）。\n- **平衡二叉树（AVL）**：左右子树高度差 ≤1，严格平衡，查找极快但插入删除旋转多。\n- **红黑树**：弱平衡（黑高平衡，最长路径≤2倍最短），插入删除旋转少，综合更优，是工程首选（Java TreeMap/HashMap 树化、C++ map、 epoll）。\n\n**演进动机**：在“查找快”与“增删代价”间取舍，红黑树折中最实用。",
    ["数据结构", "计算机科学基础"], "高级", "简答题", ["Java后端工程师","算法工程师"], "3-5年", ["二叉树","红黑树","数据结构"], 85);
  q("什么是递归？写阶乘并说明栈溢出风险。", "解释递归要素、基线条件，以及尾递归与迭代替代。",
    "**递归**：函数调用自身，须有**基线条件**（终止）与**递推关系**。\n\n```python\ndef fact(n):\n    if n <= 1: return 1      # 基线\n    return n * fact(n-1)     # 递推\n```\n**风险**：每次调用压栈，深度过大（如 n 很大）会栈溢出（RecursionError/StackOverflow）。\n\n**优化**：\n- **尾递归**：递归调用在末尾且返回值直接返回，部分语言（如开启优化的 Scheme）可复用栈帧；Python/Java 默认不优化，仍需迭代。\n- **改迭代**：用循环+累加变量，空间 O(1)。\n- 记忆化（memoization）避免重复子问题（如斐波那契）。",
    ["算法", "计算机科学基础"], "初级", "编程题", ["算法工程师","Java开发工程师"], "0-1年", ["递归","栈","算法"], 86);
  q("如何判断链表是否有环？", "给出快慢指针（Floyd）解法与原理。",
    "**Floyd 快慢指针**：慢指针一次走 1 步，快指针一次走 2 步。若有环，二者必在环内相遇；若无环，快指针先到 null。\n\n```python\ndef hasCycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast: return True\n    return False\n```\n**相遇原理**：入环后快指针相对慢指针每步追 1，差距逐步缩小必追上。时间 O(n)、空间 O(1)。\n**进阶**：相遇点再从头与慢指针同步走，交点即环入口（数学可证）。",
    ["数据结构", "计算机科学基础"], "中级", "编程题", ["算法工程师","Java开发工程师"], "1-3年", ["链表","快慢指针","算法"], 90);
  q("Top K 问题（最大 K 个数）有哪些解法？", "对比排序、最小堆、快速选择。",
    "1. **全排序** O(n log n)：简单但浪费（只需 K 个）。\n2. **最小堆（优先队列）** O(n log K)：维护大小为 K 的最小堆，遍历时比堆顶大就替换，最终堆内即 Top K。适合流式/海量数据。\n3. **快速选择（BFPRT）** 平均 O(n)：类似快排 partition，每次只递归含第 K 大的那一侧，不全局排序。\n4. **计数/桶排序**：数据范围有限时 O(n)。\n\n**工程选型**：内存够且需稳定 → 堆；追求理论最优 → 快速选择；分布式 → MapReduce 分桶。",
    ["算法", "计算机科学基础"], "高级", "简答题", ["算法工程师","大数据开发工程师"], "3-5年", ["TopK","堆","算法"], 86);

  /* Spring Boot x8 */
  q("Spring Boot 自动配置原理（@SpringBootApplication）？", "解释 @EnableAutoConfiguration 与 spring.factories / AutoConfiguration.imports。",
    "`@SpringBootApplication` = `@SpringBootConfiguration` + `@ComponentScan` + **`@EnableAutoConfiguration`**。\n\n**自动配置核心**：\n1. `@EnableAutoConfiguration` 借助 `AutoConfigurationImportSelector`，读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（旧版 `spring.factories`）。\n2. 每个 `XxxAutoConfiguration` 用 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解，**按需**装配 Bean（类路径有某 jar、用户没自定义 Bean 时才生效）。\n3. 绑定 `application.yml` 到 `@ConfigurationProperties` 配置类。\n\n**结论**：约定优于配置，starter 提供依赖+自动配置，用户只需覆盖需要的 Bean。",
    ["Spring Boot", "后端开发与服务端框架"], "中级", "简答题", ["Java后端工程师"], "1-3年", ["SpringBoot","自动配置","条件注解"], 92);
  q("Spring 的 IOC 与 DI 是什么？", "解释控制反转、依赖注入及其实现方式。",
    "**IOC（控制反转）**：对象的创建与依赖管理交给 Spring 容器，而非在代码里 new，控制权反转。\n\n**DI（依赖注入）**：容器在运行时把依赖对象“注入”到组件，常见方式：\n- **构造器注入**（推荐，不可变、易测、必填清晰）；\n- **Setter 注入**（可选依赖）；\n- **字段注入** `@Autowired`（方便但有隐藏依赖、难测，不推荐）。\n\n**Bean 生命周期**：实例化→属性填充→Aware→BeanPostProcessor 前置→InitializingBean/`@PostConstruct`→可用→`@PreDestroy`/DisposableBean 销毁。容器用单例池缓存 Bean。",
    ["Spring", "后端开发与服务端框架"], "中级", "简答题", ["Java后端工程师"], "1-3年", ["IOC","DI","Spring"], 90);
  q("Spring Bean 的作用域与生命周期？", "列出作用域并简述生命周期回调。",
    "**作用域**：\n- `singleton`（默认）：容器级单例；\n- `prototype`：每次获取新建；\n- `request`/`session`/`application`：Web 作用域；\n- `websocket`。\n\n**生命周期**：实例化（构造）→ 属性注入 → `BeanNameAware`/`BeanFactoryAware` 等 → `BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct`/`InitializingBean.afterPropertiesSet` → `postProcessAfterInitialization`（AOP 常在此织入代理）→ 使用中 → `@PreDestroy`/`DisposableBean.destroy`。\n\n注意：prototype 销毁回调容器不负责，需手动清理。",
    ["Spring", "后端开发与服务端框架"], "中级", "简答题", ["Java后端工程师"], "1-3年", ["Bean","生命周期","Spring"], 88);
  q("Spring 事务传播行为有哪些？", "列举 REQUIRED、REQUIRES_NEW 等并举例。",
    "**传播行为** 定义方法间事务如何传播，常用：\n- **REQUIRED**（默认）：有则加入，无则新建。\n- **REQUIRES_NEW**：挂起当前事务，新建独立事务，提交/回滚互不影响（如日志入库不随主事务回滚）。\n- **SUPPORTS**：有则加入，无则以非事务运行。\n- **NOT_SUPPORTED**：挂起事务，非事务执行。\n- **MANDATORY**：必须在事务中，否则抛异常。\n- **NEVER**：必须非事务，否则抛异常。\n- **NESTED**：嵌套事务（保存点，内层回滚不影响外层）。\n\n**坑**：同类方法内部调用 `@Transactional` 不生效（自调用绕过代理）；异常需是 RuntimeException 才回滚（或指定 rollbackFor）。",
    ["Spring", "后端开发与服务端框架"], "高级", "简答题", ["Java后端工程师"], "3-5年", ["事务","传播","Spring"], 89);
  q("@Transactional 失效的常见场景？", "列举并解释原因。",
    "1. **自调用**：同类方法 A 调 B（@Transactional），因走 this 而非代理，事务不生效 → 抽 Service 或用 AopContext/注入自身代理。\n2. **非 public 方法**：Spring AOP 默认只对 public 代理（CGLIB 可绕过但规范上不建议）。\n3. **异常被吞**：catch 后未抛出，或抛出受检异常未配 `rollbackFor` → 不回滚。\n4. **数据库引擎不支持**：MyISAM 不支持事务。\n5. **数据源未配置事务管理器**或多了 DataSource 没指定。\n6. **Propagation 设置不当**（如 NOT_SUPPORTED）。\n调试：`@Transactional(rollbackFor=Exception.class)` + 确认由 Spring 代理调用。",
    ["Spring Boot", "后端开发与服务端框架"], "高级", "简答题", ["Java后端工程师"], "3-5年", ["事务","失效","Spring"], 87);
  q("Spring Boot 中如何处理全局异常？", "说明 @ControllerAdvice / @ExceptionHandler 与统一响应。",
    "用 **`@RestControllerAdvice`**（= @ControllerAdvice + @ResponseBody）配合 **`@ExceptionHandler`** 统一拦截异常：\n\n```java\n@RestControllerAdvice\npublic class GlobalEx {\n    @ExceptionHandler(BizException.class)\n    public Result<Void> handle(BizException e) {\n        return Result.fail(e.getCode(), e.getMessage());\n    }\n    @ExceptionHandler(Exception.class)\n    public Result<Void> handleAll(Exception e) {\n        log.error(\"err\", e);\n        return Result.fail(500, \"系统异常\");\n    }\n}\n```\n**要点**：就近精确异常优先；返回统一 `Result` 结构；配合 HTTP 状态码（@ResponseStatus）；校验异常用 `MethodArgumentNotValidException`。",
    ["Spring Boot", "后端开发与服务端框架"], "中级", "简答题", ["Java后端工程师"], "1-3年", ["异常处理","全局异常","Spring"], 88);
  q("MyBatis 中 #{} 与 ${} 的区别？", "说明预编译与注入风险。",
    "- **`#{}`**：预编译占位符，生成 `?` 并由 PreparedStatement 设参，**自动转义/防 SQL 注入**，绝大多数场景用这个。\n- **`${}`**：字符串直接拼接，不做转义，常用于动态表名/列名/排序字段（如 `ORDER BY ${column}`）。\n\n**风险**：`${}` 拼接用户输入 → SQL 注入。只应在变量来自**可信白名单**（如枚举列名）时使用，并对值进行严格校验后再使用。例如排序方向只允许 `ASC/DESC`，用白名单判断后再拼接，绝不接收任意用户输入。`#{}` 是默认且安全的写法。",
    ["MyBatis", "后端开发与服务端框架"], "中级", "简答题", ["Java后端工程师"], "1-3年", ["MyBatis","SQL注入","#{}"], 89);

  /* Kafka x5 */
  q("Kafka 的核心概念有哪些？", "说明 Producer/Consumer/Broker/Topic/Partition/Consumer Group 的作用。",
    "- **Broker**：Kafka 服务节点，多台组成集群。\n- **Topic**：逻辑消息主题，按业务划分。\n- **Partition**：Topic 的物理分片，是并行与有序的单位；每条消息在分区内按 offset 有序。\n- **Producer**：生产者，按 key 哈希或轮询发到分区。\n- **Consumer**：消费者，按 offset 拉取；**Consumer Group** 内一条消息只被一个消费者消费，分区数决定最大并行度（消费者数 ≤ 分区数）。\n- **Offset**：消费位移，存于内部 topic（`__consumer_offsets`）或外部（如外部存储做精确一次）。\n- **Zookeeper/KRaft**：早期用 ZK 管元数据，新版本用 KRaft 去 ZK。",
    ["Kafka", "分布式系统与微服务"], "初级", "简答题", ["Java后端工程师","大数据工程师","DevOps工程师"], "0-1年", ["Kafka","消息队列","概念"], 89);
  q("Kafka 如何保证消息不丢失？", "从生产端、服务端、消费端三方说明。",
    "**生产端**：`acks=all`（leader 等待 ISR 副本都写入才返回）+ 重试 `retries` + 关闭异步丢弃；可配 `enable.idempotence=true` 防重。\n**服务端**：副本因子 `replication.factor≥3`，`min.insync.replicas≥2`，leader 切换时数据不丢。\n**消费端**：先处理业务再**手动提交 offset**（`enable.auto.commit=false`），避免“消费中崩溃但 offset 已提交”导致丢消息。\n\n权衡：高可靠会牺牲一点吞吐与延迟，按业务要求调参。",
    ["Kafka", "分布式系统与微服务"], "中级", "简答题", ["Java后端工程师","大数据工程师"], "1-3年", ["Kafka","可靠性","消息队列"], 90);
  q("Kafka 消费组重平衡（rebalance）是什么？", "解释触发原因、stop-the-world 影响与优化。",
    "**重平衡**：Consumer Group 内成员变化时，重新分配分区给消费者的过程（基于协调者 + 组协议）。\n\n**触发**：消费者加入/离开（崩溃、超时 `session.timeout`、心跳 `heartbeat.interval`）、订阅主题分区数变化、消费者超过 `max.poll.interval` 未 poll。\n\n**影响**：重平衡期间**整个组暂停消费**（stop-the-world），大 group 影响明显。\n\n**优化**：合理设超时、避免在消费逻辑里做重活（超过 `max.poll.interval.ms`）、升级到支持**增量协作重平衡**（Cooperative Sticky）的版本减少停顿、控制 group 规模。",
    ["Kafka", "分布式系统与微服务"], "高级", "简答题", ["Java后端工程师","大数据工程师"], "3-5年", ["Kafka","重平衡","消费组"], 87);
  q("Kafka 为什么吞吐高、速度快？", "说明顺序写、零拷贝、批量与压缩。",
    "1. **顺序磁盘 I/O**：消息只追加写（append-only log），远快于随机写；利用 OS 页缓存（page cache）。\n2. **零拷贝（sendfile）**：消费时 broker 用 `sendfile` 直接把文件从内核缓冲区送到 socket，省去用户态拷贝与上下文切换。\n3. **批量与异步**：Producer 批量发送、批量压缩（gzip/snappy/lz4），减少网络往返与体积。\n4. **分区并行**：多分区多磁盘多消费者并行，水平扩展。\n5. **稀疏索引**：用 offset 二分定位 segment，读高效。",
    ["Kafka", "分布式系统与微服务"], "中级", "简答题", ["Java后端工程师","大数据工程师"], "1-3年", ["Kafka","性能","零拷贝"], 88);
  q("Kafka 与 RabbitMQ 如何选型？", "从模型、场景、可靠性对比。",
    "- **Kafka**：分区日志模型，超高吞吐、持久化、重放、流式处理（配合 Flink/Spark）；适合日志、埋点、事件流、高并发解耦。消费后消息仍在，可回放。\n- **RabbitMQ**：AMQP 路由模型（exchange+binding），灵活路由（direct/topic/fanout）、低延迟、成熟的事务/确认；适合业务异步、任务队列、需要复杂路由的场景。\n\n**选型**：大数据/日志/流 → Kafka；业务消息/复杂路由/低延迟任务队列 → RabbitMQ。也常二者并存。",
    ["Kafka", "分布式系统与微服务"], "中级", "开放讨论题", ["Java后端工程师","后端架构师"], "1-3年", ["Kafka","RabbitMQ","选型"], 85);

  /* AI 大模型 x5 */
  q("Transformer 的 Self-Attention 原理是什么？", "解释 Q/K/V、注意力分数与多头机制。",
    "**Self-Attention** 让序列中每个 token 关注其他 token 并加权聚合信息。\n\n**步骤**：\n1. 每个输入 token 映射为 Query(Q)、Key(K)、Value(V) 三个向量。\n2. 计算相似度：`score = Q·Kᵀ / √d_k`（√d_k 防止点积过大导致 softmax 梯度消失）。\n3. softmax 归一化得到注意力权重。\n4. 权重对 V 加权求和得输出。\n\n**多头（Multi-Head）**：并行多组 Q/K/V 投影，各自捕捉不同子空间关系（语法、语义、位置），拼接后线性融合，增强表达能力。\n**位置编码**：因 attention 本身无序，需加入位置信息（正弦编码或可学习编码/RoPE）。",
    ["Transformer架构", "人工智能与机器学习"], "高级", "简答题", ["算法工程师","AI应用开发工程师"], "3-5年", ["Transformer","注意力","大模型"], 91);
  q("什么是 RAG（检索增强生成）？典型流程？", "说明为什么需要 RAG 及其关键组件。",
    "**RAG** = Retrieval-Augmented Generation：先**检索**外部知识，再让 LLM 基于检索内容**生成**答案，缓解幻觉、注入私有/实时知识。\n\n**离线（建库）**：文档切片 → 向量化（Embedding 模型）→ 存入**向量数据库**。\n**在线（问答）**：用户问题向量化 → 向量库**相似检索** Top-K 片段 → 拼进 Prompt（上下文）→ LLM 生成带引用的回答。\n\n**关键**：切片策略、Embedding 质量、检索召回率、重排（rerank）、上下文裁剪、引用溯源。RAG 适合企业知识库、客服、合规问答。",
    ["RAG检索增强生成", "人工智能与机器学习"], "高级", "简答题", ["AI应用开发工程师","算法工程师"], "3-5年", ["RAG","检索","向量库"], 92);
  q("什么是 Prompt Engineering？常用技巧有哪些？", "列举并解释几种提示工程方法。",
    "**提示工程**：通过精心设计输入上下文，引导 LLM 稳定产出期望结果，无需改模型权重。\n\n**技巧**：\n- **明确角色与任务**：`你是一名资深Java面试官...`；\n- **Few-shot**：给示例让模型模仿格式；\n- **Chain-of-Thought（CoT）**：`一步步思考`，提升推理；\n- **结构化输出**：要求返回 JSON/固定格式便于解析；\n- **约束与格式**：限定长度、语气、禁止内容；\n- **思维树/ReAct**：多步推理+工具调用。\n\n**要点**：迭代优化、给出评价标准、避免歧义；复杂任务可拆子问题。",
    ["Prompt Engineering", "人工智能与机器学习"], "中级", "简答题", ["AI应用开发工程师","Prompt工程师"], "1-3年", ["Prompt","提示工程","大模型"], 90);
  q("模型微调（Fine-tuning）与 RAG 如何选？", "说明二者定位、优劣与组合。",
    "- **RAG**：不改模型，外接知识库，知识可实时更新、可溯源、成本低；适合**知识型/问答**场景，但受上下文窗口与检索质量限制。\n- **微调**：用领域数据继续训练，把风格/能力“内化”进权重，适合**特定风格、结构化输出、小模型提效**；但训练成本高、知识更新需重训、可能遗忘、难溯源。\n\n**经验**：先 RAG（快、准、可追溯）；若 RAG 达不到风格/格式/低延迟要求，再考虑微调（如 LoRA/SFT）。生产常**RAG+微调**组合。",
    ["模型微调", "人工智能与机器学习"], "高级", "开放讨论题", ["AI应用开发工程师","算法工程师"], "3-5年", ["微调","RAG","选型"], 87);
  q("向量数据库在 AI 应用中起什么作用？", "说明 Embedding、相似检索与典型产品。",
    "**作用**：把文本/图片等转为**向量（Embedding）**后，按**余弦相似度**做近邻检索，支撑 RAG 的“知识召回”。\n\n**核心能力**：高维向量索引（HNSW、IVF 等近似检索）、混合检索（向量+关键词 BM25）、元数据过滤、规模化与低延迟。\n\n**典型产品**：Milvus、Chroma、Qdrant、Weaviate、PGVector（PostgreSQL 扩展）、Redis 向量检索。\n\n**流程**：建库时 Embedding+写入；查询时问题 Embedding+ANN 检索 Top-K+（可选 rerank）+ 送 LLM。选型看规模、性能、是否需与现有库集成。",
    ["向量数据库", "人工智能与机器学习"], "中级", "简答题", ["AI应用开发工程师","算法工程师"], "1-3年", ["向量数据库","Embedding","RAG"], 88);

  /* 通用面试软技能 x10 */
  q("请做一下自我介绍。", "考察表达与重点提炼，给出结构建议与避坑。",
    "**结构（1-2 分钟）**：\n1. 基本信息与现状（岗位/年限）；\n2. 核心技能栈与最匹配岗位的方向；\n3. 代表项目/成果（用数据说话，如“负责 X，QPS 提升 3 倍”）；\n4. 与应聘岗位的契合点 + 简短收尾。\n\n**避坑**：不要背简历全文、不要流水账、不谈与岗位无关的隐私；控制在时间盒内；技术岗突出技术深度与影响力。提前演练到自然流畅。",
    ["自我介绍技巧", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["自我介绍","软技能","HR"], 80);
  q("你未来三年的职业规划是什么？", "说明回答原则：与岗位绑定、可落地。",
    "**原则**：具体、与应聘岗位一致、体现成长意愿，避免“三年当管理”等空话或频繁跳槽信号。\n\n**示例（后端）**：一年内夯实分布式与高并发实战、独立负责模块；两年深入某一领域（如存储/稳定性）成为团队骨干；三年具备跨团队协作与设计能力，能主导中型系统。\n\n**要点**：展示学习路径（考证/源码/项目）、对齐公司业务方向，让面试官觉得“留下你能成长、公司也能受益”。",
    ["职业规划问答", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["职业规划","软技能"], 80);
  q("你最大的优点和缺点是什么？", "给出 STAR 化优点与“成长型缺点”的回答策略。",
    "**优点**：用 STAR（情境-任务-行动-结果）佐证，选与岗位相关的（如“强结果导向”），配真实案例与量化结果。\n\n**缺点**：选**真实但可改进、且不影响核心职责**的，并说明你在改：如“过去不擅长向上同步进展，现在坚持周报+主动同步”；避免致命缺点（如“粗心”对应财务岗）或把优点伪装成缺点（易被识破）。\n\n**核心**：展现自我认知与成长性，而非完美。",
    ["常见HR面试题", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["优缺点","HR","软技能"], 80);
  q("遇到与同事/领导的技术分歧怎么处理？", "考察沟通与协作，给出处理步骤。",
    "1. **对事不对人**：先确认分歧点是方案、工期还是风险，避免情绪化。\n2. **用数据与依据说话**：列方案对比（复杂度、性能、可维护性、风险），必要时小实验/POC 验证。\n3. **倾听与对齐目标**：理解对方约束（ deadline、历史包袱），目标是项目成功而非“赢了争辩”。\n4. **升级决策**：僵持时请相关方（技术负责人）拍板，接受决定并全力执行。\n5. **复盘**：无论谁对，事后记录决策理由，沉淀为团队规范。\n体现：理性、协作、结果导向。",
    ["冲突处理", "通用面试能力与软技能"], "中级", "场景题", ["通用面试能力与软技能"], "1-3年", ["冲突处理","协作","软技能"], 82);
  q("如何向非技术同事解释一个复杂技术方案？", "考察表达与共情能力。",
    "**方法**：\n1. **从对方关心的结果出发**（能解决什么业务问题、省多少成本），而非技术细节。\n2. **类比**：用生活化比喻（如“缓存像笔记本，省得每次翻书柜”）。\n3. **分层沟通**：先结论与影响，再按需展开；用图而非代码。\n4. **确认理解**：用提问验证对方是否懂，避免单向输出。\n5. **控制术语**：必要术语首次出现即解释。\n\n目标：让产品/运营能做出正确决策，而不是听懂实现。",
    ["技术方案表达", "通用面试能力与软技能"], "中级", "场景题", ["通用面试能力与软技能","技术经理"], "1-3年", ["表达","沟通","软技能"], 82);
  q("你为什么想离开上一家公司？", "说明回答边界：正向表达、不抱怨。",
    "**边界**：不抱怨前公司/领导/同事，不谈钱是唯一原因（可提但非主因），避免显得不稳定。\n\n**正向表达**：业务遇到天花板、想接触更大规模/更前沿技术（如从单体到云原生）、岗位与职业规划更匹配、希望在前沿方向深耕。\n\n**示例**：“上一段经历让我在 CRUD 与基础架构上打牢了底，但我想在分布式与高并发方向更进一步，贵司的 X 业务正好提供这样的场景。”\n体现：有追求、理性、对机会有判断。",
    ["常见HR面试题", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["离职原因","HR","软技能"], 80);
  q("你期望的薪资是多少？如何谈薪？", "给出谈薪策略与时机。",
    "**策略**：\n1. **先探后报**：先问预算范围/薪酬结构，避免先报低价或过高。\n2. **基于市场与价值**：用职级、地区、同类岗位行情、自身稀缺技能定价，给区间而非死数。\n3. **看总包**：base+绩效+期权+福利+成长，不只看月薪。\n4. **时机**：等拿到意向/对方显兴趣后再谈，避免 early 阶段谈钱减分。\n5. **礼貌坚定**：可表示“更看重平台，但希望薪酬与价值匹配”，留出协商空间。\n避免：一上来问钱、撒谎现薪资、情绪化。",
    ["薪资谈判", "通用面试能力与软技能"], "中级", "开放讨论题", ["通用面试能力与软技能"], "1-3年", ["薪资","谈判","软技能"], 81);
  q("项目中你遇到的最大困难是什么？怎么解决的？", "用 STAR 展示解决问题能力。",
    "**结构（STAR）**：\n- **Situation**：项目背景与难点（如大促流量翻 10 倍导致接口超时）。\n- **Task**：你的职责与目标。\n- **Action**：你做了什么——定位（监控/链路追踪）、方案（缓存预热+限流+异步化）、验证（压测）。\n- **Result**：量化结果（RT 从 800ms 降到 120ms，平稳度过峰值）。\n\n**要点**：选真实、有技术含量、你主导的；突出分析链路与权衡，而非“靠同事”。体现闭环与复盘意识。",
    ["常见HR面试题", "通用面试能力与软技能"], "中级", "场景题", ["通用面试能力与软技能"], "1-3年", ["项目难点","STAR","软技能"], 83);
  q("你如何看待加班？", "给出平衡且务实的回答。",
    "**务实表达**：认同关键节点（版本发布、线上故障、业务大促）需要投入与担当，也重视平日效率与优先级管理，尽量减少低效加班。\n\n**体现**：结果导向而非工时导向；会用自动化/流程优化降低重复劳动；在紧急时愿意冲，但更相信可持续节奏才能长期产出。避免两个极端：一概拒绝（显得不担当）或无限加班（易被当成默认）。对齐团队实际文化更稳妥。",
    ["常见HR面试题", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["加班","价值观","软技能"], 79);
  q("你有什么想问我们的？", "说明反问的重要性与可问方向。",
    "**为什么重要**：这是你评估公司是否值得加入的机会，也能展现思考深度。\n\n**可问方向**：\n- 团队当前最核心的技术挑战是什么？\n- 这个岗位的 6 个月目标与成长路径？\n- 技术栈演进方向（如是否在迁云原生/引入 AI）？\n- 团队协作与Code Review/Oncall 机制？\n- 新人 onboarding 与导师制？\n\n**避免**：只问钱/假大空；优先问与业务、技术成长相关的问题，体现你认真对待这份工作。",
    ["常见HR面试题", "通用面试能力与软技能"], "初级", "开放讨论题", ["通用面试能力与软技能"], "0-1年", ["反问","HR","软技能"], 79);

  /* ---------------- 收尾：补充字段并暴露给 window.SEED ---------------- */
  const questions = Q.map((it) => ({
    title: it.title,
    body: it.body,
    answer: it.answer,
    catPath: it.cat,
    difficulty: it.diff,
    type: it.type,
    positionNames: it.positions,
    years: it.years,
    tags: it.tags,
    source: "seed",
    aiScore: it.aiScore,
    status: "published",
    views: 0,
    favorites: 0
  }));
  window.SEED = { categoryTree, positionStages, positionSkills, questions };
})();