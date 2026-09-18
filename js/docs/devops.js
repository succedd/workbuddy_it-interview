/* =========================================================================
 *  js/docs/devops.js — 技术教程「云原生 / DevOps」方向数据
 *
 *  编写基线（目录骨架取自官方文档，正文按官方目录逐节展开）：
 *    · Docker Docs                   https://docs.docker.com/（Get Started / Guides / Reference）
 *    · OCI Image & Runtime Spec      https://opencontainers.org/（镜像规范 / 运行时规范）
 *    · Git 官方文档 / Pro Git        https://git-scm.com/doc
 *    · GitHub Actions Docs           https://docs.github.com/actions（Workflow syntax / Contexts / Reusable workflows）
 *    · GitLab CI/CD YAML Reference   https://docs.gitlab.com/ee/ci/yaml/
 *    · Kubernetes Docs               https://kubernetes.io/docs/（Concepts / Tasks / Reference）
 *    · Helm Docs                     https://helm.sh/docs/（Charts / Chart Template Guide / Best Practices）
 *    · Terraform Docs                https://developer.hashicorp.com/terraform（Language / State / Modules / CLI）
 *    · Argo CD / Flux Docs           https://argo-cd.readthedocs.io/ · https://fluxcd.io/docs/
 *    · OpenGitOps 原则               https://opengitops.dev/
 *    · Google SRE Book / Workbook    https://sre.google/books/（SLO / 错误预算 / 发布工程）
 *    · The Twelve-Factor App         https://12factor.net/
 *    · OpenTelemetry Docs            https://opentelemetry.io/docs/
 *    · CNCF Platforms White Paper    https://tag-app-delivery.cncf.io/whitepapers/platforms/
 *
 *  风格：原理 → 官方规范 → 实战（反例 vs 正解）→ 误区 → 自检清单 → 延伸阅读。
 *  正文为 Markdown，复用站点 marked + highlight.js。
 *  代码围栏用 ${F}、行内代码用 ${C} 表示反引号，避免与外层模板字符串冲突。
 *  ⚠ shell 变量必须写成 \${VAR}，GitHub Actions 表达式写成 \${{ }}，否则会被 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

  const DEVOPS = {
    id: "devops",
    name: "云原生 / DevOps",
    icon: "☁️",
    desc: "以 Docker / Kubernetes / Helm / Terraform / Argo CD 的官方文档目录为主线：从容器与流水线的基本功，到用 IaC 描述基础设施、用 GitOps 交付变更，再到多集群、发布策略与平台工程。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "打通交付的最小闭环：看懂 OCI 容器模型、会用 Git 提交可评审的改动、跑通一条 CI 流水线，并能定位基础网络与进程问题。",
        chapters: [
          {
            id: "devops-basic-1",
            title: "容器与 Docker 基础：镜像、容器、卷与网络",
            minutes: 24,
            updated: "2026-09-16",
            applies: "Docker Engine 20.10+ / Docker Desktop / Linux",
            tags: ["Docker", "容器", "OCI"],
            terms: ["Docker", "容器", "镜像", "数据卷"],
            body: `
> **官方文档基线**：[Docker Docs — Get Started](https://docs.docker.com/get-started/) · [Guides](https://docs.docker.com/guides/) · [Storage（Volumes / Bind mounts / tmpfs）](https://docs.docker.com/storage/) · [Networking](https://docs.docker.com/network/) · [OCI Image Spec](https://github.com/opencontainers/image-spec) · [OCI Runtime Spec](https://github.com/opencontainers/runtime-spec)

## 一、先建立心智模型：容器不是「小虚拟机」

Docker 官方文档把引擎拆成四块基础设施：**镜像（image）、容器（container）、卷（volume）、网络（network）**。先记住这个坐标系，后面所有命令都能归位。

容器与虚拟机的差别不在「大小」，而在**隔离的层次**：

| 维度 | 虚拟机 | 容器 |
|---|---|---|
| 隔离对象 | 硬件（Hypervisor 抽象 CPU/内存/磁盘） | 进程（内核直接提供隔离原语） |
| 内核 | 每台一个独立内核 | 与宿主机**共享内核** |
| 启动 | 秒级 ~ 分钟级 | 毫秒级 ~ 秒级 |
| 打包物 | 整机镜像（GB 起） | 应用 + 依赖的只读层（MB 起） |

容器之所以「轻」，是因为它不是「模拟一台机器」，而是**让一个进程以为自己独占这台机器**。支撑它的三个内核机制必须记住：

- **namespace**：隔离「看得见什么」——PID、网络、挂载、UTS、IPC、User、Cgroup。
- **cgroup**：限制「能用多少」——CPU、内存、IO、PIDs。
- **UnionFS（overlay2）**：叠加「文件长什么样」——镜像的只读层 + 容器可写层。

**推论**：共享内核意味着容器逃逸的后果比虚拟机严重（见「安全」方向的 4C 模型），也意味着**容器不是安全边界**，只是隔离手段。

## 二、官方的两层标准：OCI Image Spec 与 Runtime Spec

Docker 把镜像格式与运行时行为捐给了 **OCI（Open Container Initiative）**，这就是为什么 Kubernetes 里能跑 containerd、CRI-O、Podman 等不同运行时——它们都实现同一套规范。

${F}text
OCI Image Spec          OCI Runtime Spec
  manifest.json            config.json（rootfs + process + mounts）
  config（env/cmd/架构）    → 交给 runc / crun 真正创建进程
  layers（tar.gz 层列表）
${F}

**镜像 = 层的只读叠加**。每一层是「相对上一层的文件差异」，所以分层顺序直接决定构建效率和镜像体积——这也是中级「Dockerfile 最佳实践」一节的立论基础。

## 三、镜像：引用、分层与摘要

${F}bash
# 拉取与查看
docker pull nginx:1.27-alpine
docker image ls                       # 本地镜像清单
docker image inspect nginx:1.27-alpine | jq '.[0].Config.Env'   # 看镜像的环境变量
docker image history nginx:1.27-alpine                          # 看每层怎么来的

# 生产环境应锁定 digest，而不是只锁 tag
docker pull nginx@sha256:8a1e2b1c0f...   # digest 不可变，tag 会漂移
docker image ls --digests
${F}

**tag 是可变指针，digest 是内容哈希**。同一个 ${C}nginx:latest${C} 今天和下周可能指向不同内容；而 ${C}sha256:...${C} 永远指向同一份字节。生产环境固定 digest 是可复现构建的底线。

清理（注意这些命令会真删）：

${F}bash
docker image prune            # 删悬空镜像（<none>:<none>）
docker image prune -a         # 删所有未被容器引用的镜像
docker system df              # 先看磁盘被谁占了
docker system prune --volumes # 慎用：连匿名卷一起删
${F}

## 四、容器生命周期与常用命令

${F}bash
docker run -d --name web -p 8080:80 nginx:1.27-alpine   # 后台运行
docker ps                                                # 只看运行中
docker ps -a                                             # 含已退出
docker logs -f --tail 100 web                            # 跟踪日志（注意 stdout/stderr）
docker exec -it web sh                                   # 进容器调试
docker inspect -f '{{.State.ExitCode}}' web              # 看退出码
docker stop web && docker rm web                         # 先停后删
${F}

三个高频开关值得单独记：

- ${C}--rm${C}：一次性任务（如跑测试）用完自动删容器。
- ${C}--restart unless-stopped${C}：宿主机重启后自动拉起（生产应交给编排平台，别依赖这个）。
- ${C}-it${C}：分配伪终端并保持 stdin，交互式调试必备；后台服务不要加。

**退出码语义**：容器退出码 = 主进程（PID 1）退出码。${C}137${C} 通常是 ${C}SIGKILL${C}（多半是 OOM），${C}143${C} 是 ${C}SIGTERM${C}，${C}0${C} 才是正常结束。排障第一步永远是看退出码，而不是看日志尾巴。

## 五、数据持久化：官方三种挂载方式

Docker 文档明确给了三种挂载，别混用概念：

| 方式 | 声明 | 适用 | 谁来管 |
|---|---|---|---|
| **Volume** | ${C}-v myvol:/data${C} | 数据库、上传文件等**生产持久数据** | Docker 管理，存于 ${C}/var/lib/docker/volumes${C} |
| **Bind mount** | ${C}-v /host/path:/data${C} | 开发时挂源码、挂配置文件 | 你手动管，权限问题多 |
| **tmpfs** | ${C}--tmpfs /tmp${C} | 只需内存、不要落盘的临时数据 | 内存，容器停即失 |

${F}bash
docker volume create appdata
docker volume ls && docker volume inspect appdata
docker run -d --name db -v appdata:/var/lib/mysql mysql:8.4   # 命名卷
docker volume prune            # 清理未被引用的卷（数据会没，谨慎）
${F}

**判断标准很简单**：这份数据在容器删掉之后还要不要？
- 要 → 必须用 volume 或 bind mount。
- 不要 → 让它在可写层里，随容器一起删。

## 六、网络：默认 bridge 与容器间 DNS

${F}bash
docker network ls                      # 默认有 bridge / host / none
docker network create appnet           # 自定义 bridge 网络
docker run -d --name db  --network appnet mysql:8.4
docker run -d --name api --network appnet -p 3000:3000 myapi:1.0
# 同一自定义网络内，可直接用容器名当域名互访
docker exec api ping -c1 db
${F}

关键点：

- **默认 bridge 不提供自动 DNS**，只能用 IP 互访；**自定义网络提供内置 DNS**，可用容器名解析。这是「同一个网络却 ping 不通」的最常见原因。
- ${C}host${C} 模式不隔离网络命名空间（性能好，但端口直接占用宿主机）；${C}none${C} 只有 loopback。
- ${C}-p 8080:80${C} 是**宿主机端口:容器端口**，方向别写反。

## 七、实战：一个最小可交付应用栈

${F}bash
docker network create demo

docker run -d --name demo-db \\
  --network demo \\
  -e MYSQL_ROOT_PASSWORD=secret \\
  -v demo-db-data:/var/lib/mysql \\
  mysql:8.4

docker run -d --name demo-api \\
  --network demo \\
  -p 3000:3000 \\
  -e DB_HOST=demo-db \\
  myapi:1.0

docker run -d --name demo-web \\
  --network demo \\
  -p 8080:80 \\
  nginx:1.27-alpine

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
${F}

## ⚠ 踩坑与误区

1. **「我本地能跑」变成了「我容器里能跑」，但换台机器又不行**——根因往往是镜像里没锁版本（用了 ${C}latest${C}）或构建了平台相关二进制。用 ${C}--platform${C} + 固定 tag/digest 解决。
2. **数据不挂卷**：容器一重建，数据库、上传文件全没。这是最贵的一类事故。
3. **把密钥写进镜像**：${C}ENV PASSWORD=xxx${C} 会永久留在镜像层里，${C}docker history${C} 一眼可见。用运行时注入（${C}-e${C} / secret / 编排平台 Secret）。
4. **镜像一层层堆**：把所有 ${C}RUN${C} 写成十条独立指令，体积和构建时间一起爆。正确做法是合并 + 清理（见中级）。
5. **在容器里改代码**：${C}docker exec${C} 进去改完就以为改好了，容器一重建全部丢失。容器是不可变的，改动必须回到镜像构建流程。
6. **用容器当虚拟机**：一个容器里塞 systemd、ssh、cron、nginx。容器只该有一个主进程，其余能力交给编排层。

## ✅ 自检清单

- [ ] 能说清 namespace / cgroup / UnionFS 各解决什么问题
- [ ] 分得清镜像与容器，知道 tag 与 digest 的区别及生产为何用 digest
- [ ] 会用 ${C}run/ps/logs/exec/inspect/stop/rm${C}，看得懂退出码 137 / 143
- [ ] 知道 volume、bind mount、tmpfs 的差别与选择依据
- [ ] 能解释「同一自定义网络内可用容器名互访，默认 bridge 不行」
- [ ] 能独立起一个「DB + API + Web」三容器栈并让它们互通
- [ ] 清楚容器不是安全边界，密钥不写进镜像

<!--dd:devops-basic-1-->

## 🔬 深挖：镜像分层、联合文件系统与容器隔离

### 一、镜像为什么是「分层」的

Dockerfile 里每条会改变文件系统的指令（RUN / COPY / ADD）都会产生**一个新层**。层是**只读**的，最终容器看到的是这些层的叠加视图：

${C}${C}${C}
镜像 app:1.0
  Layer 4: COPY app.jar     ← 代码（每次发版变）
  Layer 3: RUN apk add ...   ← 依赖（偶尔变）
  Layer 2: ENV / WORKDIR     ← 元数据（不产生文件层）
  Layer 1: FROM alpine       ← 基础镜像（几乎不变）
        ↓ 运行时再加一个可写层
  Writable Layer（容器层）    ← 容器所有写操作都在这里
${C}${C}${C}

${F}bash
docker history app:1.0                                              # 看每层大小与来源指令
docker image inspect app:1.0 --format '{{len .RootFS.Layers}}'      # 层数
docker save app:1.0 -o app.tar && tar -tf app.tar | head            # 每层一个 tar
${F}

**三个直接推论**：
1. **层是共享的**：两台机器拉同一个基础镜像只下一次；改一行代码重新构建，只有最后一层变——这是镜像分发高效的根本；
2. **可写层的代价**：容器的所有写入（日志、临时文件、上传）都进可写层，删除容器即丢失；
3. **层数不宜过多**：每层有元数据开销，多步用 ${C}&&${C} 合并是常规优化。

### 二、overlay2：写时复制与「删文件反而没变小」

${C}${C}${C}
lowerdir（只读层，多个） + upperdir（可写层） → merged（容器看到的统一视图）

读文件：先找 upperdir，没有则逐层向下找
写文件：文件只在下层时，先复制到 upperdir（copy-up）再写
删文件：文件只在下层时，在 upperdir 建「白障标记（whiteout）」
        ★ 这解释了「在容器里删了大文件，镜像层并不会变小」
${C}${C}${C}

**关键工程含义**：下载、解压、编译、清理**必须在同一条 RUN 里**。分两条 RUN 时，第一层里的文件永远留在镜像中，第二层的删除只是加了个白障标记。

${F}dockerfile
# ❌ 两条 RUN：第一层的 400MB 永久留在镜像
RUN curl -o /tmp/sdk.tgz https://example.com/sdk.tgz
RUN tar -xzf /tmp/sdk.tgz -C /opt && make -C /opt/sdk && rm -rf /tmp/sdk.tgz

# ✅ 一条 RUN：中间产物在同一层内被清掉
RUN curl -o /tmp/sdk.tgz https://example.com/sdk.tgz \
 && tar -xzf /tmp/sdk.tgz -C /opt \
 && make -C /opt/sdk \
 && rm -rf /tmp/sdk.tgz /opt/sdk/*.o
${F}

### 三、卷：bind / volume / tmpfs

| 类型 | 写法 | 数据位置 | 适用 |
|---|---|---|---|
| bind mount | ${C}-v /host/path:/ctr/path${C} | 宿主机指定路径 | 挂配置、开发时挂代码 |
| **volume** | ${C}-v myvol:/data${C} | Docker 管理的 ${C}/var/lib/docker/volumes${C} | **生产持久化首选** |
| tmpfs | ${C}--tmpfs /tmp${C} | 内存 | 敏感临时数据 |

**为什么生产优先 volume**：由 Docker 管理生命周期（${C}volume ls/prune${C}）、跨平台一致、可用 volume driver 对接 NFS/云盘。

**卷必须显式备份**（不会随镜像分发）：

${F}bash
docker run --rm -v myvol:/data -v "$PWD":/backup alpine \
  tar czf /backup/myvol-$(date +%F).tar.gz -C /data .
${F}

### 四、网络四种模式与端口映射的真实机制

| 模式 | 说明 | 适用 |
|---|---|---|
| bridge（默认） | 接在 ${C}docker0${C} 网桥上，独立 IP，NAT 出网 | 单机多容器 |
| host | 直接用宿主机网络栈（无 NAT，性能最好） | 高性能场景（端口会冲突） |
| none | 无网络接口 | 完全隔离的计算任务 |
| container:${C}<id>${C} | 共享另一容器的网络命名空间 | 边车模式 |

**${C}-p 8080:80${C} 的本质是 iptables 的 DNAT 规则**，不是代理转发：

${F}bash
iptables -t nat -L DOCKER -n --line-numbers    # 宿主机 8080 → 容器 IP:80（DNAT）
                                               # 容器出网靠 MASQUERADE（SNAT）

docker network create mynet
docker run -d --name db  --network mynet postgres
docker run -d --name app --network mynet myapp  # app 里可直接连 db:5432
# ★ 默认 bridge 网络不支持容器名解析，这是「推荐自定义网络」的关键原因（内嵌 DNS）
${F}

### 五、容器隔离的真相：不是虚拟机

${C}${C}${C}
容器 = namespace（视图隔离）+ cgroup（资源限制）+ 联合文件系统
  命名空间：PID / NET / MNT / UTS / IPC / USER / CGROUP
  cgroup v2：CPU / 内存 / IO / PIDs 的限制与统计

与虚拟机的本质差别：
  虚拟机：独立内核 → 强隔离，启动秒级~分钟级
  容器：共享宿主内核 → 弱隔离，启动毫秒级
  => 内核漏洞可穿透容器；容器内看到的内核版本与宿主机一致
${C}${C}${C}

**三条安全实践**：① 非 root 运行 + 根文件系统只读；② 不用 ${C}--privileged${C}，只加具体 capability；③ 不把 ${C}/var/run/docker.sock${C} 挂进容器（等于给宿主 root）。

**PID 1 与信号**：容器里 PID 1 是应用本身，而 PID 1 未注册处理函数的信号会被**忽略**，导致 ${C}docker stop${C}（SIGTERM）杀不死应用，最终被 SIGKILL 硬杀、连接被硬切。解法：

${F}dockerfile
ENTRYPOINT ["/sbin/tini", "--", "java", "-jar", "app.jar"]   # tini 转发信号
# 或 docker run --init
# 或应用自身正确处理 SIGTERM（Spring Boot 支持优雅停机）
${F}

### 六、引擎架构：docker CLI 只是在「遥控」

${C}${C}${C}
docker CLI --REST/gRPC--> dockerd（网络/卷/构建/镜像）
                            └--> containerd（容器生命周期）
                                   └--> runc（真正创建 namespace/cgroup）
${C}${C}${C}

**实用价值**：K8s 早期通过 dockershim 对接 dockerd，1.24 起移除、直接对接 **containerd**——这就是「K8s 不再需要 Docker」的技术背景。**OCI 镜像格式才是通用标准**，符合 OCI 的运行时（containerd / CRI-O / gVisor / Kata）都能跑同一个镜像。

## 📚 延伸阅读

- Docker Docs · [Get Started](https://docs.docker.com/get-started/)：官方入门路线的 8 个模块，建议按顺序过一遍
- Docker Docs · [Storage](https://docs.docker.com/storage/)：三种挂载的官方对比与选型建议
- Docker Docs · [Networking](https://docs.docker.com/network/)：bridge / host / overlay 全覆盖
- [OCI Image Spec](https://github.com/opencontainers/image-spec)：想知道「镜像到底是什么文件」就读它
- [containerd](https://containerd.io/docs/)：Docker 之下真正干活的运行时，K8s 也用它
`
          },
          {
            id: "devops-basic-2",
            title: "Git 协作与代码评审：从提交到 Pull Request",
            minutes: 22,
            updated: "2026-09-16",
            applies: "Git 2.30+ / GitHub / GitLab",
            tags: ["Git", "协作", "代码评审"],
            terms: ["Git", "分支", "Pull Request", "代码评审"],
            body: `
> **官方文档基线**：[Git Reference](https://git-scm.com/docs) · [Pro Git（免费全书）](https://git-scm.com/book/zh/v2) · [GitHub Docs — Pull requests](https://docs.github.com/pull-requests) · [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hans/) · [GitHub Docs — CODEOWNERS](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

## 一、对象模型：理解 Git 才不会被 Git 折磨

Git 是**内容寻址的文件系统**，不是「文件差异记录器」。四个对象类型必须认识：

${F}text
blob    文件内容（不含文件名）
tree    目录（记录 名字 → blob/tree 的映射）
commit  一次快照（指向一个 tree，含 parent、author、message）
tag     给某个对象起的人类可读名字（annotated tag 才是正式版本）
${F}

${F}bash
git cat-file -t HEAD          # HEAD 指向的对象类型：commit
git cat-file -p HEAD          # 看 commit 内容（tree / parent / message）
git rev-parse HEAD            # 完整 SHA
git log --graph --oneline --decorate --all   # 历史全景图
${F}

**关键结论**：commit 一旦生成内容哈希就固定。所谓「改历史」（${C}rebase${C}、${C}commit --amend${C}）不是修改原 commit，而是**造一批新 commit**。所以「已推送的公共分支不要改历史」不是规矩洁癖，而是因为改历史会让所有人的引用失效。

## 二、三个区与状态流转

${F}text
工作区(working tree) --git add--> 暂存区(index/stage) --git commit--> 本地仓库 --git push--> 远端
${F}

${F}bash
git status -sb                 # 简短格式 + 分支信息
git diff                       # 工作区 vs 暂存区
git diff --staged              # 暂存区 vs HEAD（提交前必看！）
git add -p                     # 交互式按块挑选，避免把调试代码一起提交
git restore --staged file.txt  # 从暂存区撤回（不改工作区）
git restore file.txt           # 丢弃工作区改动（不可恢复）
${F}

**提交前看 ${C}git diff --staged${C} 是硬纪律**。80% 的「密钥被提交进仓库」「临时文件混进 PR」都是跳过这一步造成的。

## 三、分支：便宜且短命

Git 的分支只是一个 41 字节的指针文件，所以官方鼓励「频繁创建、用完即删」。

主流模型对比（官方与业界共识）：

| 模型 | 结构 | 适用 |
|---|---|---|
| **Trunk-Based**（主干开发） | 所有人近乎直推 main，短命特性分支（< 1 天） | 持续交付、CI 强、团队小；Google/Meta 实践 |
| **GitHub Flow** | main 永远可发布，一切改动走 PR | 大多数 Web 产品，最推荐起步 |
| **Git Flow** | main / develop / release / hotfix 多长命分支 | 有明确版本发布周期的客户端软件 |

**建议**：从 GitHub Flow 起步。它的规则只有五条——main 始终可部署、改动走描述性分支、开 PR、评审后合并、合并即部署。

${F}bash
git switch -c feature/export-csv        # 从最新 main 切出（新版命令，等价于 checkout -b）
git push -u origin feature/export-csv   # 首次推送并建立追踪
git fetch origin && git rebase origin/main   # 合入前先对齐主干，保持历史线性
git switch main && git merge --ff-only feature/export-csv
git branch -d feature/export-csv
${F}

## 四、rebase 还是 merge：官方给的判断

${C}git rebase${C} 官方文档有明确警告：**不要 rebase 已经推到公共仓库的提交**。判断标准：

- **本地未推送的历史** → 用 rebase 整理成线性、干净的提交序列。
- **已推送、别人可能基于它工作** → 用 merge，保留真实分叉（history 难看但真实）。

${F}bash
# 整理本地三个零散提交
git rebase -i HEAD~3          # pick/squash/reword 重排、压缩、改消息
# 注意：此命令会打开编辑器；非交互环境请勿使用
git rebase --abort            # 搞乱了随时退出，回到操作前
${F}

**黄金法则**：rebase 出错不要慌，${C}git reflog${C} 记录了所有 HEAD 移动，${C}git reset --hard HEAD@{n}${C} 能捞回来。

## 五、Pull Request / Merge Request：评审是流程不是仪式

GitHub 官方把 PR 定义为一个「讨论并审查一组改动」的容器。一次好评审包含四件事：

1. **范围小**：单 PR 改动建议 < 400 行。超过就拆——评审质量与改动规模成反比。
2. **描述清楚**：写「为什么改」+「怎么验证」+「有什么风险」，而不是只贴一句「修 bug」。
3. **自动化先行**：CI 必须全绿再叫人看。人只该花时间在 CI 查不出的问题上。
4. **明确归属**：用 ${C}CODEOWNERS${C} 自动指派评审人，用分支保护规则强制「至少 1 人批准 + CI 通过」才能合并。

${F}text
# .github/CODEOWNERS
*                       @team-lead
/infra/                 @ops-team
/js/docs/               @docs-owner
*.sql                   @dba
${F}

评审时**对人不对事**的表达习惯：

- 「这里如果 ${C}id${C} 不存在会 NPE，建议加空判断」✅
- 「你怎么连这都想不到」❌

## 六、提交信息规范：Conventional Commits

${F}text
<type>(<scope>): <subject>

feat(auth): 支持手机号验证码登录
fix(api): 修复分页参数为 0 时报错
docs(readme): 补充本地启动说明
refactor(core): 抽出统一的重试工具
chore(deps): 升级 spring-boot 到 3.3.4
${F}

好处很实在：${C}CHANGELOG${C} 可以自动生成、版本号可以按 type 自动推导（feat → minor，fix → patch，${C}!${C} → major），CI 也能按 type 决定是否跑重活。

## 七、别把不该提交的东西提交上去

${F}bash
# .gitignore 从第一行就写
node_modules/
.env
.env.*
!.env.example
*.log
dist/
.idea/
${F}

已经误提交了怎么办（按严重程度）：

${F}bash
# 1) 只是刚 add，还没 commit
git restore --staged .env

# 2) 已 commit 但没 push
git rm --cached .env && git commit --amend --no-edit

# 3) 已 push —— 立刻视为「密钥已泄露」
#    先轮换密钥/口令，再清理历史（git filter-repo 或 BFG），最后强推并通知所有协作者
${F}

**顺序不能反**：先轮换凭证，再清历史。历史清理再干净，泄露过的密钥也已经不可信了。

## ⚠ 踩坑与误区

1. **在主干上直接开发**：一旦需要紧急发版，半成品改动无法隔离。
2. **一个 PR 干三件事**：改 bug + 重构 + 加功能，评审人无法判断风险面。
3. **rebase 已推送分支**：别人的本地历史全部错位，团队被迫集体 reset。
4. **提交里带密钥**：即使后续删掉，它已存在于所有 clone 的历史里。
5. **用 ${C}git pull${C} 一把梭**：默认会造 merge commit 污染历史。团队应统一 ${C}pull --rebase${C} 或 ${C}fetch + rebase${C}。
6. **reflog 不知道**：误操作后第一反应是重新 clone，其实 ${C}git reflog${C} 几乎能救回一切。
7. **分支不删**：远程堆积几百个僵尸分支，没人知道哪个还有用。

## ✅ 自检清单

- [ ] 能画出 blob/tree/commit 的对象模型，并说清为什么「改历史 = 造新对象」
- [ ] 提交前会执行 ${C}git diff --staged${C} 自审
- [ ] 会用 ${C}add -p${C} 拆分提交，会写 Conventional Commits 格式的信息
- [ ] 清楚什么时候用 rebase、什么时候必须用 merge
- [ ] 能用 ${C}git reflog${C} 从误操作中恢复
- [ ] 会配 ${C}.gitignore${C} 与 ${C}CODEOWNERS${C}，知道分支保护规则怎么设
- [ ] 知道密钥误提交后的正确处置顺序（先轮换再清历史）

<!--dd:devops-basic-2-->

## 🔬 深挖：分支模型的取舍与「可评审性」

### 一、三种分支模型的真实差异

| 模型 | 形态 | 发布节奏 | 适用 |
|---|---|---|---|
| **GitHub Flow** | main + 短生命周期特性分支 + PR | 随时可发 | 大多数 Web 服务（推荐默认） |
| **Trunk-Based** | 直接/极短分支进 trunk，配合特性开关 | 一天多次 | 高频发布、成熟 CI/CD |
| **Git Flow** | main / develop / release / hotfix / feature | 有明确版本窗口 | 客户端软件、需长期维护多版本 |

**核心变量是「分支存活时间」**：活 1 天冲突少、评审快；活 3 周则合并要靠人工理解、评审变成「看一大坨 diff」、回归风险陡增。所以真正该优化的不是「选哪种模型」，而是**把分支压在几天内**。

**Git Flow 的代价**：${C}develop${C} 与 ${C}main${C} 长期并存 = 两个真相，修 bug 要往两边 cherry-pick，极易漏。只有「必须同时维护 1.x 与 2.x」的产品才值得付这个成本。

### 二、PR 的可评审性

${C}${C}${C}
PR 规模与评审效果（工程经验值）
  < 200 行     → 评审者能认真读完，缺陷发现率最高
  200~400 行   → 需 30 分钟以上专注，容易被「扫过」
  > 400 行     → 退化为「看起来没问题，approve」
  > 1000 行    → 几乎不可能有效评审
${C}${C}${C}

**把大改动拆小的四种手段**：
1. **按可独立合并的步骤拆**：先加字段与兼容逻辑 → 再加新功能 → 最后删旧逻辑（expand-contract）；
2. **纯重构单独一个 PR**（不含行为变更），否则 diff 里一半是格式调整，看不出真实改动；
3. **特性开关**：代码先合（开关关），再单独 PR 打开 —— 发布与合并解耦；
4. **格式化与逻辑分离**：先跑一次全量格式化单独提交。

### 三、评审者该看什么（按优先级）

${C}${C}${C}
① 正确性与边界：null / 空集合 / 并发 / 超时 / 重试路径是否覆盖？
② 安全：权限校验是否在服务端？输入是否进入 SQL/命令/模板？
③ 数据与兼容：改了字段/接口，旧客户端与旧数据怎么办？需要迁移或双写吗？
④ 可观测：出错能定位吗？失败模式是否可感知？
⑤ 测试：是否验证了行为而非实现？边界用例有没有？
⑥ 复杂度：有没有更简单的实现？是否引入不必要的依赖或抽象？
⑦ 命名与风格（最低优先级，尽量交给 linter/formatter）
${C}${C}${C}

**区分「阻塞」与「建议」**：会出故障或有安全风险的必须改；命名偏好类只作为建议。GitHub 的 Request changes / Comment / Approve 三档正是用来区分意图的。

**作者的三个义务**：写清上下文（为什么改、怎么验证、影响范围、回滚方式）、自查一遍 diff（调试代码/临时文件最容易在这里被发现）、把格式化与锁文件升级作为噪声单独说明。

### 四、分支保护：把约定变成强制

${C}${C}${C}
main 分支保护清单
  ☑ Require pull request before merging
  ☑ Require approvals ≥ 1（核心仓库 2，且需 CODEOWNERS 批准）
  ☑ Dismiss stale approvals（有新提交即作废旧批准）
  ☑ Require review from Code Owners
  ☑ Require status checks to pass（lint / test / build / scan）
  ☑ Require branches to be up to date
  ☑ Require linear history（禁 merge 提交）
  ☑ Do not allow bypassing（管理员也必须遵守）
${C}${C}${C}

**${C}CODEOWNERS${C} 是被低估的工具**：把「谁负责哪个目录」写进代码，PR 自动请求对应负责人评审，比口头约定可靠得多。

**注意一个陷阱**：${C}Require branches to be up to date${C} 遇到频繁变动的 main，会让 PR 反复需要同步（体验差）。折中用 **merge queue**：队列系统负责同步与串行验证，既保证 main 常绿，又不让开发者反复手动 rebase。

### 五、合并方式影响历史与回滚

| 方式 | 结果 | 影响 |
|---|---|---|
| Merge commit | 保留分支结构与每步提交 | 历史真实但 ${C}--graph${C} 很乱 |
| Squash merge | 压成 1 个提交 | main 线性清晰；丢失中间粒度（bisect 只能定位到整个 PR） |
| Rebase merge | 逐个重放到 main | 线性且保留粒度；SHA 变化，需注意协作者已拉取的分支 |

**回滚成本**：Squash 后回滚一个 PR = 一次 ${C}git revert${C}（最简单，**多数团队首选**）；revert 合并提交需要 ${C}-m 1${C}（易错）；Rebase 后可按单个中间提交精确 revert，但要求团队理解 rebase 纪律。

### 六、Commit 规范与自动 Changelog

**Conventional Commits 的价值在于可被机器消费**：

${F}
<type>(<scope>): <subject>

feat(auth): 支持手机号 + 验证码登录
fix(order): 修复并发下单导致库存超卖
refactor!: 移除 v1 用户接口

类型：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert
${F}

有了它，${C}semantic-release${C} / ${C}release-please${C} 可自动生成 CHANGELOG、按类型决定版本提升（${C}feat${C} → minor、${C}fix${C} → patch、${C}BREAKING CHANGE${C} → major）——这正是**语义化版本可自动化的前提**。

**提交钩子**（pre-commit / commit-msg）在本地就拦住不合格提交，比在 CI 里发现快得多。**但钩子可被 ${C}--no-verify${C} 绕过**，所以 CI 侧仍需一层兜底。

## 📚 延伸阅读

- [Pro Git 中文版](https://git-scm.com/book/zh/v2)：官方免费全书，第 2、3、7 章对应本节全部内容
- [Git Branching — 官方交互式教程](https://learngitbranching.js.org/?locale=zh_CN)：把 rebase / cherry-pick 练成肌肉记忆
- [GitHub Docs — About pull requests](https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)：官方推荐的 Git 历史重写工具（取代 filter-branch）
`
          },
          {
            id: "devops-basic-3",
            title: "CI 流水线入门：GitHub Actions 官方语法",
            minutes: 26,
            updated: "2026-09-16",
            applies: "GitHub Actions / GitLab CI",
            tags: ["CI", "GitHub Actions", "自动化"],
            terms: ["CI", "流水线", "GitHub Actions", "工作流"],
            body: `
> **官方文档基线**：[GitHub Actions — Workflow syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions) · [Events that trigger workflows](https://docs.github.com/actions/reference/events-that-trigger-workflows) · [Contexts](https://docs.github.com/actions/reference/context-and-expression-syntax-for-github-actions) · [Using secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions) · [GitLab CI/CD YAML reference](https://docs.gitlab.com/ee/ci/yaml/)

## 一、CI 到底解决什么问题

持续集成（Continuous Integration）的原意是**频繁把改动合回主干并立刻验证**。它解决的问题只有一个：**把「集成风险」从发版日摊销到每一天**。

没有 CI 的团队，集成问题在发版前集中爆发，且此时离代码写下的时间最远、上下文最模糊、修复成本最高。CI 的价值不是「自动化跑测试」，而是**把反馈延迟压到分钟级**。

第一个要建立的观念：**CI 必须快**。目标 10 分钟内出结果，超过 20 分钟的流水线会被人为绕过（先合并再说）。慢流水线等于没有流水线。

## 二、GitHub Actions 的四层模型

官方把模型拆成四层，务必分清：

${F}text
workflow  （.github/workflows/*.yml，一个文件 = 一条流水线）
  └─ job        （跑在哪个 runner 上，jobs 之间默认并行）
       └─ step  （串行执行；可以是 run: 命令，也可以是 uses: 复用动作）
            └─ action（可复用的最小单元，来自 marketplace 或你的仓库）
${F}

**关键规则**：

- **同一 workflow 的多个 job 默认并行**；要串行必须显式写 ${C}needs:${C}。
- **同一 job 的多个 step 顺序执行**，且**共享同一个 runner 文件系统**（这就是构建产物能被后续 step 用上的原因）。
- **不同 job 之间不共享文件系统**，要传文件必须用 artifact。

## 三、最小可用的 workflow

${F}yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:        # 允许手动触发，排障时很有用

permissions:
  contents: read            # 最小权限原则：默认不要给写权限

concurrency:                # 同一分支只保留最新一次运行，旧的自动取消
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
${F}

逐块解释：

- ${C}on${C}：触发条件。${C}push${C} + ${C}pull_request${C} 是标配；${C}workflow_dispatch${C} 加上手动按钮；${C}schedule${C} 走 cron 做定时任务。
- ${C}permissions${C}：**默认给得过宽**（历史原因）。显式写成 ${C}contents: read${C} 是安全基线。
- ${C}concurrency${C}：防止同一分支排队堆积（连推 5 次就白跑 4 次）。
- ${C}matrix${C}：一次定义多环境组合，官方会展开成 N 个并行 job。

## 四、缓存与制品：两个容易搞混的概念

官方文档里这是两个不同机制，用途完全不同：

| | **Cache（缓存）** | **Artifact（制品）** |
|---|---|---|
| 目的 | 加速重复构建 | 在 job 之间传递 / 长期留存 |
| 典型内容 | ${C}node_modules${C}、${C}~/.m2${C}、${C}.gradle${C} | 测试报告、构建产物 jar/dist、日志 |
| 生命周期 | 7 天未命中自动清理，可能被淘汰 | 默认 90 天，可永久 |
| 失败时的行为 | 缓存未命中只是慢，不影响正确性 | 缺失会直接导致后续 job 失败 |

${F}yaml
      - uses: actions/cache@v4
        with:
          path: ~/.m2/repository
          key: maven-\${{ hashFiles('**/pom.xml') }}
          restore-keys: maven-

      - run: mvn -B clean verify
      - uses: actions/upload-artifact@v4
        if: always()                     # 测试失败也要上传报告
        with:
          name: surefire-reports
          path: target/surefire-reports/
${F}

**缓存 key 的设计原则**：key 里必须包含依赖清单的哈希（${C}hashFiles${C}），这样依赖变了缓存自动失效；${C}restore-keys${C} 做前缀回退，能命中「旧一点的可用缓存」。

## 五、密钥与变量：三种机制别用混

| 机制 | 定义位置 | 是否加密 | 典型用途 |
|---|---|---|---|
| ${C}secrets${C} | 仓库/组织设置里定义 | ✅ 加密，日志自动打码 | Token、密码、私钥 |
| ${C}vars${C} | 仓库/组织设置里定义 | ❌ 明文 | 环境名、镜像仓库地址 |
| ${C}env${C} | YAML 里直接写 | ❌ 明文且进版本库 | 非敏感常量 |

${F}yaml
      - run: ./deploy.sh
        env:
          REGISTRY: \${{ vars.REGISTRY }}
          REGISTRY_TOKEN: \${{ secrets.REGISTRY_TOKEN }}
${F}

**三条纪律**：

1. 密钥只从 ${C}secrets${C} 取，绝不硬编码。（写成明文的那一刻，它已经进了 Git 历史。）
2. 用 **Environment**（如 ${C}production${C}）挂载生产密钥，并配置「需要人工批准」，让流水线无法自动推上生产。
3. **不要打印密钥**。即使用 ${C}echo${C} 调试，也要注意 GitHub 只对「完全匹配已注册值」的字符串打码，拼接后的值照样泄漏。

## 六、让流水线跑得快的五个官方建议

1. **并行化**：lint / test / build 拆成独立 job 并行跑（默认就是并行，别用 ${C}needs${C} 把它们串起来）。
2. **缓存依赖**：${C}setup-node${C} / ${C}setup-java${C} / ${C}setup-python${C} 都内建 ${C}cache:${C} 参数，一行开启。
3. **矩阵只跑必要的组合**：${C}node: [20, 22]${C} 够用就别列到 14；PR 上跑单一版本，主干再跑全矩阵。
4. **${C}concurrency${C} 取消旧运行**：连推场景下能省掉大半机器时间。
5. **用增量与并行测试**：如 Maven ${C}-T 1C${C}、Gradle 并行、pytest-xdist。

## 七、一个完整的三段式流水线

${F}yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  build-push:
    needs: [lint, test]              # 只有前两者都过了才构建
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
${F}

注意这里用 ${C}github.sha${C} 而不是 ${C}latest${C} 打标签——**镜像标签就是可追溯性的根**，回滚时你要能精确说出「上一版是哪个 sha」。

## ⚠ 踩坑与误区

1. **在 PR 上用 ${C}pull_request_target${C}**：这个事件的默认权限更大，配合 checkout 外部代码会有严重安全风险。需要时务必审查（见「安全」方向·供应链安全）。
2. **${C}secrets${C} 用在 ${C}if${C} 条件里泄漏**：表达式求值日志可能暴露信息；且 fork 的 PR 拿不到 secrets，导致「本地能过、PR 红」。
3. **把 CI 当部署用**：CI 只该产出可交付物，部署应交给 CD（见中级「CI/CD 流水线设计」）。
4. **没有超时**：默认单 job 6 小时。挂起的 job 会白烧额度，建议显式 ${C}timeout-minutes${C}。
5. **依赖 ${C}latest${C} 版 action**：${C}uses: actions/checkout@v4${C} 是正解，${C}@main${C} 会让上游改动随时弄挂你的流水线。
6. **只看最后一次运行**：flaky 测试要统计多次运行结果，别把「重跑就绿了」当正常。

## ✅ 自检清单

- [ ] 能说清 workflow / job / step / action 的层级与并行规则
- [ ] 会写 ${C}on${C} 的 push / pull_request / workflow_dispatch / schedule 四类触发
- [ ] 分清 cache 与 artifact 的用途和生命周期
- [ ] 会用 matrix 做多版本验证，并在 PR 上收敛矩阵规模
- [ ] 知道 secrets / vars / env 的区别，会用 Environment 做生产审批门禁
- [ ] 给工作流配了最小 ${C}permissions${C} 与 ${C}concurrency${C}
- [ ] 会用 ${C}github.sha${C} 而非 ${C}latest${C} 为制品打标签
- [ ] 流水线能在 10 分钟内给出反馈

<!--dd:devops-basic-3-->

## 🔬 深挖：GitHub Actions 的执行模型与安全边界

### 一、workflow 的组成与执行语义

${F}yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:
  schedule: [{ cron: "0 18 * * *" }]        # UTC！注意时区换算
concurrency:
  group: ci-\${{ github.ref }}                # 同分支只保留最新一次
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    outputs: { ver: "\${{ steps.v.outputs.ver }}" }
    steps:
      - uses: actions/checkout@v4
      - id: v
        run: echo "ver=$(date +%s)" >> "$GITHUB_OUTPUT"
  deploy:
    needs: [test]
    if: github.ref == 'refs/heads/main'
    environment: production                  # 可要求人工审批
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh "\${{ needs.test.outputs.ver }}"
${F}

**三个必须理解的语义**：
1. **每个 job 是一台全新机器**——文件系统与环境变量不共享，跨 job 传文件用 artifacts、传小数据用 outputs；
2. **job 内 step 共享文件系统与环境变量**——所以「装依赖 + 跑测试」应在同一 job；
3. **托管 runner 是临时的**——任务结束即销毁，任何状态都要显式保存（缓存或 artifacts）。

### 二、缓存 vs artifacts

| 维度 | cache | artifacts |
|---|---|---|
| 目的 | 加速（依赖、中间产物） | 保留产物（报告、构建输出） |
| 生命周期 | 短期（默认 7 天未访问即清） | 按 retention（默认 90 天） |
| 命中策略 | key 精确匹配 + restore-keys 前缀回退 | 按名字完全一致 |

${F}yaml
# 缓存 key 必须带依赖清单哈希，否则依赖改了还命中旧缓存
- uses: actions/cache@v4
  with:
    path: ~/.m2/repository
    key: maven-\${{ runner.os }}-\${{ hashFiles('**/pom.xml') }}
    restore-keys: maven-\${{ runner.os }}-
# 更好：用 setup-java 的 cache 参数（策略已调好）
- uses: actions/setup-java@v4
  with: { distribution: temurin, java-version: "21", cache: maven }
${F}

**两个反模式**：key 里没有依赖哈希（依赖升级仍用旧缓存 → 诡异编译错误）；把 cache 当 artifacts 用（需要长期保留的文件会被清）。

### 三、矩阵构建

${F}yaml
strategy:
  fail-fast: false            # 默认 true：一个失败就取消其他；调试时设 false 看全貌
  max-parallel: 4
  matrix:
    os: [ubuntu-latest, windows-latest]
    java: ["17", "21"]
    exclude:
      - { os: windows-latest, java: "17" }
    include:
      - { os: ubuntu-latest, java: "21", experimental: true }
${F}

注意成本 = 组合数 × 单 job 计费。用 ${C}continue-on-error: \${{ matrix.experimental }}${C} 让实验性组合失败不阻塞主流程。

### 四、权限最小化：GITHUB_TOKEN 与 OIDC

${F}yaml
permissions: {}                 # 顶层默认全关（推荐起点）
jobs:
  build:
    permissions: { contents: read }
  comment:
    permissions: { pull-requests: write }    # 只有这个 job 能评论 PR
${F}

**OIDC 免密钥上云**（替代长期 AK/SK）：

${F}yaml
permissions: { id-token: write, contents: read }
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/gh-actions-deploy
      aws-region: ap-east-1
      # 无长期密钥：GitHub 签发短期 OIDC token，云侧按仓库/分支 claim 校验
${F}

**OIDC 的三重收益**：无长期密钥可泄露、凭据分钟级失效、云侧可按「哪个仓库的哪个分支」精细授权。

### 五、十个高危配置（供应链视角）

| 风险 | 说明 | 修法 |
|---|---|---|
| ${C}pull_request_target${C} + checkout PR head | 在有 secrets 的上下文执行 PR 代码 → 泄密 | 禁该组合；需要时分离「读文件」与「执行」 |
| Action 未锁 SHA（${C}@v4${C} / ${C}@main${C}） | tag 可移动、分支可改 | 锁到 commit SHA（Dependabot 可代更新） |
| 打印 secrets | 日志泄露 | 平台脱敏 + 审查 + ${C}::add-mask::${C} |
| 自托管 runner 跑公开仓库 PR | 任意人可在你的内网机器执行代码 | 公开仓库禁用自托管 |
| ${C}curl ... | bash${C} | 执行远程可变脚本 | 下载后校验哈希/签名 |
| 密钥写进 workflow | 明文进 Git | 用 secrets / environment；开 secret scanning |
| 缓存投毒 | PR 可写主分支缓存 | 缓存 key 加 ref 维度隔离 |
| 构建可任意外联 | 源码/密钥可外传 | 出口白名单 |
| 缺 environment 审批 | 生产部署无人工卡点 | ${C}environment${C} + Required reviewers |
| 复用不可信仓库的工作流 | ${C}uses: org/repo/.github/workflows/x.yml@main${C} 被改 | 锁 SHA + 仅允许内部可信仓库 |

**一条底线**：**CI 就是生产环境**。它持有制品库写权限、生产部署凭据、全部仓库读权限——「谁的代码能在 CI 里跑」等价于「谁能操作生产」。

### 六、可复用工作流与 composite action

${F}yaml
# ① 可复用工作流：把一个完整流程做成「函数」
# .github/workflows/_build.yml
on:
  workflow_call:
    inputs:  { java-version: { type: string, default: "21" } }
    secrets: { registry-token: { required: true } }
jobs: { build: { runs-on: ubuntu-latest, steps: [] } }

# 调用方
jobs:
  build:
    uses: ./.github/workflows/_build.yml
    with: { java-version: "21" }
    secrets: inherit
${F}

${F}yaml
# ② composite action：把一组 step 封装成本地 action（更细粒度）
# .github/actions/setup/action.yml
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with: { node-version: "22", cache: npm }
    - run: npm ci
      shell: bash
${F}

**选择口径**：复用「整个 job 或流水线」→ reusable workflow；复用「几步环境准备」→ composite action。两者结合可让 10 个仓库共享一份 CI 实现（改一处全生效），这是多仓库组织降低维护成本的现实路径。

## 📚 延伸阅读

- [GitHub Actions 文档总入口](https://docs.github.com/actions)：Workflow syntax 那一页建议直接收藏
- [Events that trigger workflows](https://docs.github.com/actions/reference/events-that-trigger-workflows)：每个事件都标了「默认权限」，排查权限问题时必查
- [Actions Marketplace](https://github.com/marketplace?type=actions)：优先选官方（actions/、docker/、aws-actions/）且带版本号的
- [GitLab CI/CD YAML reference](https://docs.gitlab.com/ee/ci/yaml/)：换平台时对照 ${C}stages / needs / rules${C} 的映射
- [Security hardening for GitHub Actions](https://docs.github.com/actions/security-guides/security-hardening-for-github-actions)：把流水线本身当攻击面来加固
`
          },
          {
            id: "devops-basic-4",
            title: "Linux 与网络基础：进程、权限、排障四件套",
            minutes: 24,
            updated: "2026-09-16",
            applies: "Linux（RHEL/Ubuntu/Debian）",
            tags: ["Linux", "网络", "排障"],
            terms: ["Linux", "进程", "权限", "网络排障"],
            body: `
> **官方文档基线**：[Linux man-pages](https://man7.org/linux/man-pages/)（${C}man 7 signal${C} / ${C}man 5 proc${C} / ${C}man 8 ss${C}）· [systemd 官方文档](https://www.freedesktop.org/software/systemd/man/) · [man 5 systemd.service](https://www.freedesktop.org/software/systemd/man/systemd.service.html) · [man 8 iptables](https://man7.org/linux/man-pages/man8/iptables.8.html) · [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122)（分层与差错模型）

## 一、进程：Linux 里一切皆文件，除进程之外

Linux 上进程不是「程序」，而是**内核用一组数据结构描述的执行上下文**。运维视角只需要抓四件事：

${F}bash
ps -ef                          # 全量进程（BSD 风格 ps aux 也行）
ps -eo pid,ppid,%cpu,%mem,rss,etime,cmd --sort=-%cpu | head
pstree -p                       # 进程树，看父子关系
top -o %MEM -b -n1              # 一次性快照
cat /proc/<pid>/status          # 内核眼中的这个进程（VmRSS / Threads / State）
ls -l /proc/<pid>/fd | head     # 它开了哪些文件/套接字
cat /proc/<pid>/limits          # 它的 ulimit 限制（too many open files 看这里）
${F}

**信号（${C}man 7 signal${C}）是运维的日常动词**，必须记住这几个：

| 信号 | 编号 | 语义 | 可控？ |
|---|---|---|---|
| SIGTERM | 15 | 请你优雅退出（默认 kill） | ✅ 可捕获，用于收尾 |
| SIGKILL | 9 | 立即杀死，内核执行 | ❌ 不可捕获 |
| SIGHUP | 1 | 终端断开 / 重载配置 | ✅ |
| SIGINT | 2 | 中断（Ctrl-C） | ✅ |

${F}bash
kill -TERM <pid>        # 先礼
sleep 5; kill -KILL <pid>   # 后兵（进程不响应 TERM 时）
kill -HUP <pid>         # 让 nginx 之类重载配置，不断连接
kill -9 -1              # ⚠ 千万别在 root 下敲
${F}

**运维铁律**：先 ${C}TERM${C} 给应用收尾机会（关连接、刷缓冲、注销注册中心），超时再 ${C}KILL${C}。容器里这两步对应 K8s 的 ${C}terminationGracePeriodSeconds${C}。

## 二、文件权限：三个数字能解释大半事故

${F}bash
ls -l app.jar
# -rw-r--r-- 1 deploy ops 1024 Sep 16 10:00 app.jar
#  ↑↑↑        ↑↑↑↑↑ ↑↑↑
#  文件类型+权限  属主  属组
${F}

权限位 = ${C}r=4 w=2 x=1${C} 的八进制组合，三组分别是「属主 / 属组 / 其他人」：

- ${C}644${C}：属主可读写，其他人只读 → 普通文件默认
- ${C}755${C}：属主可读写执行，其他人可读执行 → 目录、可执行文件
- ${C}600${C}：只有属主可读写 → 私钥、${C}.env${C}、凭据文件
- ${C}700${C}：只有属主可进 → ${C}~/.ssh${C}

${F}bash
chmod 600 ~/.ssh/id_rsa        # 权限过宽 ssh 会直接拒绝使用密钥
chmod -R u+rwX,go-rwx /etc/myapp
chown -R deploy:ops /opt/myapp
umask                          # 默认 022 → 新建文件 644、目录 755
getfacl /data/shared           # ACL：需要比「属主/组/其他」更细时用
${F}

**高频事故清单**：

- 私钥权限 644 → SSH 拒绝加载（"UNPROTECTED PRIVATE KEY FILE"）
- 目录少了 ${C}x${C} 位 → 看得见文件名但进不去（这是「权限看着够却打不开」的经典原因）
- ${C}chmod -R 777${C} 治百病 → 埋安全债，正确做法是修属主/属组

## 三、systemd：现代 Linux 的服务管理器

${C}man systemd.service${C} 是运维必读。最小可用单元文件：

${F}ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My API Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/opt/myapp
EnvironmentFile=/etc/myapp/env        # 权限设 600
ExecStart=/usr/bin/java -Xmx512m -jar app.jar
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
# 资源与安全约束
LimitNOFILE=65535
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/myapp

[Install]
WantedBy=multi-user.target
${F}

${F}bash
systemctl daemon-reload              # 改完单元必须执行，否则不生效
systemctl enable --now myapp         # 开机自启 + 立刻启动
systemctl status myapp               # 概览（含最近日志）
journalctl -u myapp -f --since "10 min ago" -p warning
systemd-analyze blame | head -20     # 开机慢在哪
${F}

**${C}Restart=${C} 的选择**：${C}on-failure${C} 最常用；${C}always${C} 适合「无论如何都要活着」；**${C}no${C} 用于「失败就应该被发现」的批处理**。配 ${C}Restart=always${C} 却不看日志，会把「崩溃循环」藏起来。

## 四、网络排障四件套：分层定位

排障的核心方法是**按协议栈自下而上定位**，而不是凭感觉重启服务。

${F}text
① 链路层  ip link / ip addr      —— 网卡起来了吗？IP 对不对？
② 网络层  ip route / ping / traceroute —— 能到对端 IP 吗？路由对吗？
③ 传输层  ss -tulnp / nc / telnet —— 端口在听吗？能连上吗？
④ 应用层  curl -v / dig / openssl s_client —— HTTP/TLS 正常吗？
${F}

${F}bash
# ① 链路
ip -br addr                    # 简洁看所有网卡状态与地址
ip -br link

# ② 路由与可达性
ip route get 8.8.8.8           # 内核会走哪条路出去
ping -c2 10.0.0.5
traceroute -n 8.8.8.8

# ③ 端口与连接（取代过时的 netstat）
ss -tulnp                      # 所有监听中的 TCP/UDP + 进程
ss -tnp state established '( dport = :443 )'   # 谁在连 443
nc -vz db.internal 3306        # 只测端口通不通

# ④ 应用层
curl -v --max-time 5 https://api.internal/health
curl -w "dns=%{time_namelookup} conn=%{time_connect} tls=%{time_appconnect} total=%{time_total}\n" -o /dev/null -s https://x
dig +short api.internal
openssl s_client -connect api.internal:443 -servername api.internal </dev/null 2>/dev/null | openssl x509 -noout -dates -subject
${F}

${C}curl -w${C} 那行是**延迟归因的神器**：DNS 慢、建连慢、TLS 慢、服务处理慢，一眼分辨，不用猜。

**DNS 排障顺序**（最容易被误判为「网络抖」）：

${F}bash
cat /etc/resolv.conf           # 用的哪个 DNS
getent hosts api.internal      # 走系统解析链路（含 /etc/hosts 与 nsswitch）
resolvectl status              # systemd-resolved 场景
dig +trace api.internal        # 从根开始递归，定位是哪一级解析失败
${F}

## 五、日志与磁盘：两个必查项

${F}bash
journalctl --disk-usage                     # 日志占了多少
journalctl --vacuum-time=7d                 # 只留 7 天
journalctl -u myapp --since today -p err

df -h && df -i                              # 空间 和 inode（inode 满也会写不进去！）
du -xh --max-depth=1 / | sort -h | tail
lsof +L1                    # 已删除但仍被句柄占用的文件（df 满但 du 不大时的元凶）
${F}

**经典误导**：${C}df${C} 显示磁盘满，${C}du${C} 加起来却不大——八成是「进程删了文件但没关句柄」。用 ${C}lsof +L1${C} 找到后重启该进程即可。

## ⚠ 踩坑与误区

1. **一遇故障就重启**：重启会清掉现场（内存、连接、临时状态），等于放弃根因定位。先取证再重启。
2. **${C}kill -9${C} 当默认手段**：应用来不及落盘和注销，可能造成数据不一致。永远是 TERM → 等待 → KILL。
3. **只看 ${C}df -h${C} 不看 ${C}df -i${C}**：小文件海量场景 inode 先满。
4. **${C}netstat${C} 不显示进程**：现代内核上 netstat 已过时，用 ${C}ss -tulnp${C}；显不出进程通常是缺权限（非 root）。
5. **改了 unit 不 ${C}daemon-reload${C}**：服务行为与文件内容不一致，极难排查。
6. **用 ${C}ping${C} 通不通判断服务是否可用**：ICMP 通不代表端口听、不代表应用健康。分层逐级验证。
7. **把 DNS 问题当网络问题**：${C}ping IP 通、域名不通${C} ≈ 100% 是解析问题。

## ✅ 自检清单

- [ ] 能读懂 ${C}/proc/<pid>/${C} 下的 status / limits / fd
- [ ] 记得 SIGTERM(15) 与 SIGKILL(9) 的区别，并坚持「先礼后兵」
- [ ] 能手算 644 / 755 / 600 / 700 的含义，知道目录缺 ${C}x${C} 位的症状
- [ ] 能写一个带 ${C}Restart${C} / ${C}LimitNOFILE${C} / 安全约束的 systemd unit
- [ ] 会按「链路→网络→传输→应用」四层顺序排查，而不是乱试
- [ ] 会用 ${C}curl -w${C} 做延迟归因，会区分 DNS / 建连 / TLS / 服务处理耗时
- [ ] 知道 ${C}df${C} 满但 ${C}du${C} 不大时用 ${C}lsof +L1${C} 找句柄泄漏

<!--dd:devops-basic-4-->

## 🔬 深挖：Linux 排障的因果链与网络分层定位

### 一、进程、信号与 systemd

${F}bash
# 常用信号（kill -l 看全部）
SIGTERM(15)  优雅退出（可捕获做清理）★ 优先使用
SIGKILL(9)   强杀，不可捕获（最后手段，会丢数据）
SIGHUP(1)    传统上「重载配置」
SIGSTOP/SIGCONT  暂停/继续

ps -eo pid,ppid,stat,etime,rss,cmd --sort=-rss | head
# STAT 关键字符：S 可中断睡眠 / R 运行 / D 不可中断（IO 等待）★ D 多 = 磁盘瓶颈
#                Z 僵尸 / T 停止 / s 会话首进程 / l 多线程 / < 高优先级
${F}

**僵尸进程（Z）**：子进程已结束但父进程未 wait 收尸——不占 CPU/内存，但占 PID 表项；**要杀它的父进程**（杀僵尸本身无效）。孤儿进程则是父进程先退出、被 init/systemd 收养（PID 变 1）。

**systemd 是排障第一入口**：

${F}bash
systemctl status app.service                # 状态 + 最近日志 + 退出码 ★ 先看这个
systemctl list-units --failed               # 哪些单元失败
journalctl -u app -n 200 --no-pager
journalctl -u app --since "10 min ago" -p err
systemctl cat app.service                   # 看单元定义（含所有 override）
systemd-analyze blame | head                # 启动耗时排序（开机慢的排查）
${F}

**systemd 依赖与重启策略**：${C}After=network-online.target${C} 只保证顺序不保证网络可用，要配 ${C}Wants=${C}/${C}Requires=${C} 表达依赖；${C}Restart=on-failure${C} + ${C}RestartSec${C} 实现自动拉起，但要避免「配置错误导致无限重启风暴」（加 ${C}StartLimitBurst${C}）。

### 二、三率与资源瓶颈的判定

${C}${C}${C}
CPU：top/uptime 的 load average vs 核心数；us（用户态）/sy（内核态）/wa（IO 等待）/st（被虚拟化抢占）
  load 高但 CPU 不高 → 大量 D 状态进程（IO 瓶颈）或排队等锁
  sy 高 → 系统调用频繁（上下文切换 / 小包网络 / 频繁 IO）
  wa 高 → 磁盘或网络存储瓶颈
  上下文切换高 → vmstat 的 cs 列；线程过多或锁竞争

内存：free -h（available 才是可用内存）、/proc/meminfo
  缺内存特征：swap 使用增长 + 频繁 IO + 进程被 OOM Killer 杀（dmesg | grep -i oom）
  缓存占用高不等于内存不足（buff/cache 可回收）

IO：iostat -x 1 的 %util、await、r/s vs w/s、avgqu-sz
  %util 接近 100 且 await 上升 → 磁盘饱和
  await 高但 util 不高 → 可能被上层阻塞或队列调度问题
${C}${C}${C}

${F}bash
vmstat 1 5                       # r/b(运行/阻塞) si/so(swap) us/sy/id/wa cs(上下文切换)
iostat -x 1                      # 每设备的 util / await / 队列深度
pidstat -d 1                     # 按进程看 IO（谁在写盘）
ss -s                            # socket 汇总（TIME_WAIT 数量）
${F}

### 三、网络分层定位：从本机到对端

${F}bash
# ① 接口与地址（L2/L3）
ip -br addr                      # 简洁看接口与地址
ip -s link                       # 错误/丢包计数（errors/dropped 增长 = 物理或驱动问题）
ethtool eth0                     # 速率、双工（半双工会导致诡异性能问题）

# ② 路由（L3）
ip route get 8.8.8.8             # 实际会走哪条路由出（比 route -n 更准）

# ③ 监听与连接（L4）
ss -lntp                         # 监听端口与进程
ss -antp state established       # 已建立连接
ss -s                            # 汇总（TIME_WAIT 过多 → 短连接风暴）

# ④ 应用层
curl -v --max-time 5 https://target/    # 分阶段耗时（DNS/连接/TLS/首字节）
curl -w "@-" -o /dev/null -s https://target/ <<'EOF'
    dns=%{time_namelookup} conn=%{time_connect} tls=%{time_appconnect} \
    ttfb=%{time_starttransfer} total=%{time_total}\n
EOF

# ⑤ 抓包（终极手段，注意性能与隐私）
tcpdump -i eth0 -nn 'host 10.0.0.5 and port 3306' -c 100 -w /tmp/x.pcap
# 抓 TCP 重传（网络质量的直接证据）
tcpdump -i eth0 -nn 'tcp[tcpflags] & tcp-rst != 0' -c 20
${F}

**分阶段耗时的解读**：${C}dns${C} 高 → DNS 慢或解析失败；${C}conn${C} 高 → 网络延迟或目标端口不通；${C}tls${C} 高 → 握手慢（跨地域、证书链大）；${C}ttfb${C} 高 → 服务端处理慢；${C}total${C} − ${C}ttfb${C} 大 → 传输慢（带宽或大响应体）。

### 四、文件描述符与磁盘满

${F}bash
# FD 耗尽：「Too many open files」
ulimit -n                                # 当前限制（软限制）
cat /proc/<pid>/limits | grep "open files"
ls /proc/<pid>/fd | wc -l                # 该进程实际打开数
lsof -p <pid> | wc -l
# 注意：系统级上限也要够（fs.file-max），且 systemd 单元需单独设 LimitNOFILE

# 磁盘满：du 与 lsof 的经典组合
df -h                                    # 哪个挂载点满
du -xh --max-depth=1 / | sort -h | tail  # 逐层下钻找目录
# 更隐蔽的情况：文件已删但进程仍持有（空间未释放）
lsof +L1                                 # 列出所有「已删除但仍被占用」的文件 ★ 关键
# 修法：重启持有进程；或 : > /proc/<pid>/fd/<n> 清空内容
find / -xdev -size +1G -type f -exec ls -lh {} \; 2>/dev/null | head
${F}

**inode 满也会导致「磁盘没满但写不进去」**：${C}df -i${C} 查看 inode 使用率——大量小文件（如 session 文件、缓存碎片）是典型原因。

### 五、排障的方法论：先因果链，再工具

${C}${C}${C}
① 现象是什么？（哪个用户可见的功能坏了？影响面多大？）
② 最近做了什么变更？（发布、配置、容量、依赖升级 —— 80% 的问题由变更引起）
③ 是「全挂」还是「部分挂」？（全挂看入口与依赖；部分挂看单实例/单机房/特定参数）
④ 观测数据怎么说？（监控曲线、日志错误率、依赖的 RT —— 先看仪表盘再看日志）
⑤ 提出假设 → 用最小代价验证（不要在生产上做不可逆操作试错）
⑥ 定位后先止血（回滚/限流/扩容），再根因分析
${C}${C}${C}

**排障的两条纪律**：① **先止血后根因**——用户还在受损时不要在群里讨论原理，先回滚；② **每次变更只改一个变量**——同时改三处会让「哪个起了作用」永久未知，这也是很多「修好了但不知道为什么」的成因。

## 📚 延伸阅读

- [Linux man-pages 在线版](https://man7.org/linux/man-pages/)：${C}man 7 signal${C}、${C}man 5 proc${C}、${C}man 7 tcp${C} 建议精读
- [systemd.service 官方手册](https://www.freedesktop.org/software/systemd/man/systemd.service.html)：${C}Type${C}、${C}Restart${C}、沙箱选项全在其中
- [systemd.exec 沙箱与资源限制](https://www.freedesktop.org/software/systemd/man/systemd.exec.html)：把服务装进最小权限笼子
- [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122)：分层与差错模型的原始定义，理解「为什么这么排障」
- [Brendan Gregg — Linux Performance](https://www.brendangregg.com/linuxperf.html)：性能排障的地图式索引
`
          }
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "从「会敲命令」到「能设计交付链路」：把 Dockerfile 写到生产级、把流水线设计成有门禁的体系、用 K8s + Helm 描述工作负载、用 Terraform 管理基础设施、用制品仓库管住可追溯性。",
        chapters: [
          {
            id: "devops-mid-1",
            title: "Dockerfile 最佳实践与镜像瘦身（官方构建指南）",
            minutes: 26,
            updated: "2026-09-16",
            applies: "Docker BuildKit / Buildx",
            tags: ["Docker", "Dockerfile", "构建优化"],
            terms: ["Dockerfile", "多阶段构建", "镜像瘦身", "层缓存"],
            body: `
> **官方文档基线**：[Docker Docs — Building best practices](https://docs.docker.com/build/building/best-practices/) · [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) · [Build cache](https://docs.docker.com/build/cache/) · [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) · [.dockerignore](https://docs.docker.com/reference/dockerfile/#dockerignore-file)

## 一、先理解「层缓存」：Dockerfile 的写法完全由它决定

Docker 官方文档给出的缓存规则只有一句话，但决定了所有最佳实践：

> 构建某条指令时，如果**指令内容**与**它的所有父层**都和上次一致，则直接复用缓存，不再重新执行。

由此推出三条铁律：

1. **变的放后面，不变的放前面**。依赖清单（${C}package.json${C}、${C}pom.xml${C}、${C}requirements.txt${C}）必须先 COPY、先装依赖，最后才 COPY 源码。
2. **任何一条指令变了，它以及它之后的所有层缓存全部失效**。所以在 ${C}COPY . .${C} 之后不要再装依赖。
3. **${C}RUN${C} 命令字符串本身就是缓存 key**。改一个空格、换个顺序都会失效；反之，用 ${C}--mount=type=cache${C} 可以让「重复执行但不失效」。

反例与正解对照：

${F}dockerfile
# ❌ 反例：源码一改，依赖重装
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]
${F}

${F}dockerfile
# ✅ 正解：依赖清单单独一层，依赖不变则永久命中缓存
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]
${F}

效果差异很直观：前者改一行代码要重装全部依赖（分钟级），后者只重跑最后的 COPY（秒级）。

## 二、构建上下文与 .dockerignore

${C}docker build${C} 会把**构建上下文**（默认当前目录）整体打包送给 daemon。上下文里有什么，就有什么可能被打进镜像。

${F}text
# .dockerignore —— 与 .gitignore 语法相同，但服务于构建
.git
.github
node_modules
dist
*.log
.env
.env.*
!.env.example
Dockerfile*
docker-compose*.yml
**/*.test.js
${F}

**官方明确建议**：使用 ${C}COPY${C} 时优先**拷贝具体文件/目录**，而不是 ${C}COPY . .${C}。这样即使误留了敏感文件，也不会因为一条 COPY 而进镜像。

**一个必须知道的安全事实**：${C}COPY${C} 进镜像的文件会**永久留在镜像层里**。后面 ${C}RUN rm secret.txt${C} 只是在新层里「标记删除」，原层仍可被 ${C}docker save${C} 提取出来。密钥绝不能用「先拷贝再删除」的方式处理。

## 三、多阶段构建：把编译器和产物分开

官方 Multi-stage builds 的核心思想：**用多个 ${C}FROM${C}，只把最终需要的东西带进最后一个阶段**。

${F}dockerfile
# ---------- 阶段 1：构建 ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q clean package -DskipTests

# ---------- 阶段 2：运行时 ----------
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build --chown=app:app /src/target/app.jar ./app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]
${F}

效果：镜像从「JDK + Maven + 源码 + 缓存」（600MB+）降到「JRE + 一个 jar」（150MB 左右），**同时因为最终镜像里没有编译器和源码，攻击面也大幅缩小**。

${C}--mount=type=cache${C} 是 BuildKit 的关键特性：它让「依赖缓存」独立于镜像层，既提速又**不会把缓存内容打进最终镜像**。

## 四、基础镜像选型：三种取向

| 类型 | 示例 | 体积 | 适用与注意 |
|---|---|---|---|
| **Debian/Ubuntu 完整版** | ${C}node:22${C} | ~1GB | 需要 glibc、apt 装包时方便；体积大 |
| **slim / alpine** | ${C}node:22-alpine${C} | ~150MB | 主流选择；alpine 用 musl libc，**native 模块需重新编译** |
| **distroless** | ${C}gcr.io/distroless/java21${C} | ~50-100MB | 无 shell、无包管理器，最安全；**排障只能靠日志与 metrics** |

选型判断：

- 团队排障依赖 ${C}docker exec ... sh${C} → 别上 distroless，或用 debug 变体。
- 有 C 扩展 / native 依赖 → alpine 要装 ${C}build-base${C}，或改用 slim。
- 面向生产的无状态服务 → 优先 distroless / chiseled（Ubuntu）这类最小镜像。

**无论哪种，都必须固定到明确版本**（${C}node:22.11.0-alpine3.20${C}），不要 ${C}:latest${C}。

## 五、非 root 运行：容器安全的起手式

官方在 best practices 里明确要求「不要以 root 运行容器」。原因很简单：容器与宿主机共享内核，root 容器一旦逃逸就是宿主机 root。

${F}dockerfile
# 方式一：镜像已有非 root 用户，直接切
FROM node:22-alpine
USER node

# 方式二：自建用户（Debian 系）
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

# 方式三：自定义 UID/GID（K8s 的 runAsNonRoot 与 volume 权限更好对齐）
ARG UID=10001
RUN adduser --disabled-password --gecos "" --uid "\${UID}" app
USER 10001
${F}

配套注意：切了非 root 之后，**挂载目录的属主必须匹配**，否则会「读不了/写不了」。K8s 里用 ${C}securityContext.fsGroup${C} 或 ${C}initContainer${C} 修权限。

## 六、BuildKit 与多架构：现代构建方式

${F}bash
# 开启 BuildKit（Docker 23+ 默认已开）
export DOCKER_BUILDKIT=1

# 建一个多架构构建器并推送（amd64 + arm64）
docker buildx create --name multi --use --driver docker-container
docker buildx build \\
  --platform linux/amd64,linux/arm64 \\
  --tag registry.example.com/myapp:1.2.3 \\
  --cache-from type=registry,ref=registry.example.com/myapp:buildcache \\
  --cache-to   type=registry,ref=registry.example.com/myapp:buildcache,mode=max \\
  --push .

docker buildx imagetools inspect registry.example.com/myapp:1.2.3  # 验证是否双架构
${F}

**为什么要多架构**：本地 Mac（arm64）构建的镜像推到 amd64 服务器会无法运行或性能极差。CI 里统一用 ${C}buildx --platform${C} 一次产出多架构 manifest，是团队协作的基础设施。

## 七、镜像瘦身清单（按收益排序）

1. **多阶段构建** —— 收益最大，直接砍掉构建工具链。
2. **换小基础镜像** —— alpine / slim / distroless。
3. **合并 ${C}RUN${C} 并清理**：${C}apt-get update && apt-get install -y --no-install-recommends xxx && rm -rf /var/lib/apt/lists/*${C}。分开写会留下一层 apt 缓存。
4. **pnpm / npm ci 只装生产依赖**：${C}--omit=dev${C}。
5. **只 COPY 需要的文件**，配合 ${C}.dockerignore${C}。
6. **用 ${C}--mount=type=cache${C} 而不是把缓存层留下**。
7. **检查实际体积**：${C}docker image ls${C}；用 [dive](https://github.com/wagoodman/dive) 逐层看「谁在占空间」。

## ⚠ 踩坑与误区

1. **${C}COPY . .${C} 之后再装依赖**：缓存永远失效，构建时间翻几倍。
2. **把 ${C}.env${C} / 密钥 COPY 进镜像**：删了也在层里，必须改用时挂载或 secret。
3. **${C}RUN apt-get update${C} 与 ${C}install${C} 分开写**：留下过期的 apt 索引层，还可能装到旧版本包。
4. **用 alpine 却带了 glibc 编译的二进制**：报 "not found"（实际是找不到动态链接器）。改用 slim 或重新编译。
5. **${C}latest${C} 上生产**：无法回滚、无法复现，且构建缓存会意外命中旧内容。
6. **以 root 运行**：安全审计必扣分项。
7. **ENTRYPOINT 用 shell 形式**：${C}ENTRYPOINT java -jar app.jar${C} 会包一层 ${C}sh -c${C}，导致信号无法直达 Java 进程，优雅停机失效。**必须用 exec 形式（JSON 数组）**。
8. **没有 ${C}HEALTHCHECK${C} 也不做探针**：编排平台无从判断「起来了」还是「只是进程活着」。

## ✅ 自检清单

- [ ] 能解释「层缓存命中条件」，并按「不变在前、多变在后」重排 Dockerfile
- [ ] 维护了 ${C}.dockerignore${C}，且构建上下文不含密钥与 node_modules
- [ ] 用多阶段构建把构建工具链排除在最终镜像外
- [ ] 基础镜像固定到明确版本，不用 ${C}latest${C}
- [ ] 容器以非 root 用户运行（${C}USER${C} 或 K8s ${C}runAsNonRoot${C}）
- [ ] ${C}ENTRYPOINT${C} 使用 exec 形式（JSON 数组），确保信号可达
- [ ] 会用 ${C}--mount=type=cache${C} 与 ${C}buildx${C} 缓存加速 CI 构建
- [ ] 会用 ${C}dive${C} 或 ${C}docker history${C} 定位镜像里的体积与敏感层
- [ ] 需要多架构时能用 ${C}buildx --platform${C} 一次产出

<!--dd:devops-mid-1-->

## 🔬 深挖：多阶段构建与基础镜像的取舍

### 一、多阶段构建的三种用途

${F}dockerfile
# ---------- 阶段 1：构建（体积大、含工具链，不进最终镜像）----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B dependency:go-offline          # ★ 先只拷 pom 并下依赖：代码改动不会让依赖层失效
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- 阶段 2：运行（最小化）----------
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S -G app app       # 非 root 用户
WORKDIR /app
COPY --from=build --chown=app:app /src/target/app.jar ./app.jar
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
${F}

| 用途 | 做法 |
|---|---|
| **瘦身** | 构建阶段带 maven/gcc，运行阶段只留产物（镜像可小一个数量级） |
| **构建隔离** | 编译工具不进入运行时（减少攻击面与 CVE 面） |
| **多技术栈产物汇聚** | 前端构建产出静态文件 + 后端构建产出 jar，一起放进同一个运行镜像 |

### 二、层缓存失效的判定规则与顺序

**规则**：指令的「输入」变了，该层及其**之后所有层**都会失效重建。输入的构成：

| 指令 | 缓存输入 | 实践影响 |
|---|---|---|
| ${C}COPY x y${C} | 被拷文件的**内容哈希**（含权限） | 拷整个源码目录 → 改一行代码全量重建 |
| ${C}RUN cmd${C} | 命令字符串 + 基础层 | 命令不变则命中（但上游变了它也变） |
| ${C}ENV/ARG/WORKDIR${C} | 其值 | ARG 变化会导致后续层全失效 |
| ${C}FROM img${C} | 镜像 digest | 基础镜像更新 → 全量重建 |

**因此依赖安装的顺序是刻意设计的**：先 COPY 依赖清单（变化少）→ 装依赖 → 再 COPY 源码（变化频繁）。这样「只改代码」时依赖层命中缓存，构建时间从几分钟降到几十秒。

${F}dockerfile
# Node 项目的同一原理
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .                                   # 源码最后拷，改代码不触发重新装依赖
${F}

**必须配 ${C}.dockerignore${C}**：否则 ${C}COPY . .${C} 会把 ${C}node_modules${C}、${C}.git${C}、构建产物、本地配置全拷进去——既撑大上下文（构建变慢），又可能泄露密钥（${C}.env${C}），还会让缓存频繁失效（${C}.git${C} 每提交都变）。

### 三、基础镜像选择：把「体积/CVE/兼容」三角摆平

| 基础镜像 | 体积 | libc | 特点 |
|---|---|---|---|
| ${C}debian:bookworm-slim${C} | ~75MB | glibc | 兼容性最好，包管理可用，推荐默认 |
| ${C}alpine${C} | ~7MB | **musl** | 最小，但 musl 与 glibc 有差异：DNS 解析、locale、部分 native 库会出问题 |
| ${C}distroless${C} | ~20MB | glibc | 无 shell、无包管理、仅含运行时——攻击面最小，但排障困难（进不去容器） |
| ${C}scratch${C} | ~0 | —— | 只放静态编译的二进制（Go/Rust），最小 |
| ${C}ubuntu${C} | ~78MB | glibc | 与开发环境一致 |

**三个判断口径**：
1. **Java/Node/Python**：优先 ${C}slim${C}（glibc 兼容），除非对体积极度敏感且验证过 musl 兼容性；
2. **Go/Rust 静态二进制**：用 ${C}scratch${C} 或 ${C}distroless/static${C} 最好；
3. **选 distroless 前先想清楚排障方案**（无 shell 意味着不能用 ${C}kubectl exec${C} 进去看）——通常需要配套：镜像里加 debug 变体、用 ephemeral containers（K8s 1.23+）或 ${C}kubectl debug${C} 注入临时容器。

**关于 alpine 与 musl 的经典坑**：musl 的 DNS 解析不走 NSS（不读 ${C}/etc/nsswitch.conf${C}），在依赖内部 DNS 或 SRV 记录的环境里会解析失败；Java 在 alpine 上需要额外配 ${C}libc6-compat${C}。如果团队没有余力排查这类问题，**用 slim 是更省心的默认选择**。

### 四、构建期密钥：绝不能用 ARG/ENV

${F}dockerfile
# ❌ 错误：秘密进入层历史（docker history 可见，镜像可被拉到就泄露）
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc && npm ci

# ✅ 正确：BuildKit 的 secret mount（不落层、不出现在 history）
# syntax=docker/dockerfile:1.7
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
# 构建命令：
# DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=$HOME/.npmrc .
${F}

**同一原理适用于**：私有仓库凭据（maven settings.xml、pip.conf）、SSH 私钥（${C}--mount=type=ssh${C}）、许可证文件。**判断标准很简单：镜像分发出去后，这个值被看到是否有害？有害就不能用 ARG/ENV/COPY。**

### 五、非 root 运行与文件属主

${F}dockerfile
RUN groupadd -r app && useradd -r -g app -u 10001 app
COPY --chown=10001:0 app.jar /app/app.jar     # 用数字 UID（K8s 的 runAsNonRoot 只认数字）
USER 10001
# 需要写目录时显式创建并授权（不要 chmod 777）
RUN mkdir -p /app/logs && chown 10001:0 /app/logs
${F}

**注意两个坑**：① 用 ${C}adduser${C}（alpine 是 ${C}adduser -S${C}）时 UID 是动态分配的，镜像间不一致可能引发卷权限问题——**显式指定 UID** 更可控；② 非 root 后端口 <1024 无法绑定，所以应用应监听 8080 而非 80（或加 ${C}CAP_NET_BIND_SERVICE${C}）。

### 六、标签策略与多架构

${C}${C}${C}
镜像标签的四种形态（推荐组合使用）
  myapp:1.4.2            不可变（精确版本）        ★ 生产部署用它
  myapp:1.4.2-<git-sha>  不可变 + 构建溯源
  myapp:1.4              可移动（跟随补丁）
  myapp:latest           可移动（危险：同一名字不同内容，回滚会失真）
${C}${C}${C}

**${C}latest${C} 的致命问题**：它不符合「标签 → 内容」的固定映射，导致「昨天的 latest 与今天的不一样」。**生产部署必须用不可变标签或 digest**（${C}image:1.4.2@sha256:...${C} 最严格），否则回滚时你并不知道回到了什么。

**多架构构建**（ARM 服务器与 Mac 开发者都需要）：

${F}bash
docker buildx create --name multi --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myrepo/app:1.4.2 --push .
# 原理：QEMU 模拟跨架构构建（慢但可用），或原生 ARM 节点构建（快）
${F}

**别忽略这个细节**：本地开发（Mac M 系列 = arm64）与生产（x86 服务器）架构不同，如果本地用 ${C}docker build${C} 构建后推到生产，会出现 ${C}exec format error${C}。**统一用 buildx 多架构构建或在 CI（x86）里构建**是根本解法。

## 📚 延伸阅读

- [Building best practices（官方）](https://docs.docker.com/build/building/best-practices/)：本文全部结论的出处
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)：官方示例涵盖 Go / Java / Node
- [Build cache 官方说明](https://docs.docker.com/build/cache/)：含 cache mount、cache backend、失效规则
- [dive](https://github.com/wagoodman/dive)：逐层分析镜像体积的可视化工具
- [GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless)：最小运行时镜像的做法与取舍
`
          },
          {
            id: "devops-mid-2",
            title: "CI/CD 流水线设计：阶段、门禁与可复用编排",
            minutes: 28,
            updated: "2026-09-16",
            applies: "GitHub Actions / GitLab CI",
            tags: ["CI/CD", "流水线", "DORA"],
            terms: ["CI/CD", "流水线设计", "门禁", "部署"],
            body: `
> **官方文档基线**：[GitHub Actions — Reusing workflows](https://docs.github.com/actions/using-workflows/reusing-workflows) · [Deployment environments / protection rules](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment) · [GitLab CI — ${C}stages${C} / ${C}needs${C} / ${C}rules${C} / ${C}artifacts${C}](https://docs.gitlab.com/ee/ci/yaml/) · [DORA 研究与四指标](https://dora.dev/) · [SLSA 框架](https://slsa.dev/spec/)

## 一、CI 与 CD 的边界：先分清三个词

业界被混用得最厉害的一组概念，用官方定义拉齐：

| 缩写 | 全称 | 边界 |
|---|---|---|
| **CI** | Continuous Integration | 代码合并到主干**之前**：构建、测试、静态检查。产出「可信的候选版本」 |
| **CD（Delivery）** | Continuous Delivery | 每个通过 CI 的版本**都可随时部署**，但部署动作可由人点确认 |
| **CD（Deployment）** | Continuous Deployment | 每个通过全部门禁的版本**自动进生产**，无人值守 |

**关键区别**：Continuous Delivery 承诺「随时可发」，Continuous Deployment 承诺「已经发了」。多数团队应该先做到前者——它已经能拿到绝大部分收益（缩短交付周期、降低发布风险），而门槛低得多。

## 二、流水线的阶段划分（这是本节的核心设计）

把流水线想象成**一条由快到慢、由便宜到昂贵的漏斗**：让最便宜、最容易失败的检查先跑，尽早淘汰。

${F}text
① 静态检查（秒级）    lint / format / type-check / commit-lint
② 单元测试（分钟）    unit test + 覆盖率门槛
③ 构建与打包          build → 产出不可变制品（含 sha 版本号）
④ 安全与合规扫描      SAST / SCA 依赖漏洞 / 镜像扫描 / 密钥扫描 / SBOM
⑤ 集成与端到端测试    integration / e2e（可并行分片）
⑥ 部署到预发          deploy staging + 冒烟测试
⑦ 生产发布            审批门禁 → 灰度/蓝绿 → 验证 → 全量
⑧ 发布后验证          错误率/延迟/SLO 断言，失败自动回滚
${F}

**为什么必须「快检查在前」**：开发者的反馈延迟每增加一倍，修复成本约增加一个量级。把 3 秒能查出的格式问题压在 10 分钟之后报，是纯粹的浪费。

**并行化设计**：① ② ④ 可以并行；③ 依赖 ① ②；⑤ 依赖 ③；⑥ 依赖 ⑤。用 ${C}needs${C} 显式表达依赖，而不是把所有东西串成一条长链。

## 三、质量门禁：把「团队共识」变成「机器强制」

门禁（Quality Gate）的意义是**让规范不依赖人的自觉**。推荐的门禁组合：

${F}yaml
name: PR Gate
on: pull_request

jobs:
  static:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 依赖漏洞扫描
        run: npm audit --audit-level=high
      - name: 敏感信息扫描
        uses: gitleaks/gitleaks-action@v2
${F}

门禁设计的三条经验：

1. **只卡「可自动判定」的项**。主观项（命名风格偏好）交给人评审，机器卡死会引发对抗。
2. **覆盖率门槛要留增量空间**。老项目直接卡 80% 会让所有人无法提交；应改为「新增代码覆盖率 ≥ 80%」（diff coverage）。
3. **门禁必须在分支保护里设为 required status check**，否则可以绕过。

## 四、复用与参数化：别复制粘贴十条流水线

官方提供了两级复用机制（GitHub Actions）：

| 机制 | 形式 | 能复用什么 | 适用 |
|---|---|---|---|
| **Reusable workflow** | 整个 job 组成的一条流程 | 多 job、含 runner 选择 | 把「标准 CI 流程」抽成组织级模板 |
| **Composite action** | 一组 step | 若干步骤（可含 setup） | 把「装环境 + 跑命令」抽成小积木 |

${F}yaml
# .github/workflows/reusable-node-ci.yml（被复用方）
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "22"
      working-directory:
        type: string
        default: "."
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: \${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ inputs.node-version }}
          cache: npm
          cache-dependency-path: \${{ inputs.working-directory }}/package-lock.json
      - run: npm ci
      - run: npm run lint && npm test
${F}

${F}yaml
# 调用方
jobs:
  web-ci:
    uses: ./.github/workflows/reusable-node-ci.yml
    with:
      working-directory: packages/web
    secrets: inherit
${F}

**收益**：流水线逻辑集中一处，改进一次全体受益；新仓库接入只需 6 行。

## 五、环境与审批：让流水线「不能自己上生产」

官方 Environments 机制是 CD 安全的关键拼图：

${F}yaml
jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment:
      name: production          # 绑定生产环境
      url: https://app.example.com
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
        env:
          TOKEN: \${{ secrets.PROD_DEPLOY_TOKEN }}   # 只有 production 环境有这个 secret
${F}

在环境设置里可以配：

- **Required reviewers**：部署前必须有人点批准（Delivery 模式的落地方式）。
- **Wait timer**：延迟 N 分钟执行，留出「发现问题立刻取消」的窗口。
- **Deployment branches**：只允许特定分支部署到生产（如只允许 ${C}main${C}）。
- **Environment secrets**：生产密钥只在该环境可用，且**不会**被其他 job 读到。

**这套机制的价值**：密钥的可见范围、部署的准入条件、审计记录，全部由平台强制，而不是靠文档规范。

## 六、回滚：从流水线设计之初就要有

**没有回滚方案的发布不是发布，是赌博**。流水线必须内建：

1. **不可变制品**：每次构建产出带 ${C}git sha${C} 的镜像，已发布的版本**永不覆盖**。回滚 = 部署上一个已知良好的 sha。
2. **数据库变更向前兼容**：DDL 与代码解耦（先加列 → 发代码 → 再删列），保证「旧代码 + 新库」也能跑。这是回滚可行的前提。
3. **一键回滚入口**：${C}workflow_dispatch${C} 手动触发 + 传入目标版本号。
4. **自动回滚**：发布后 N 分钟内监控指标超阈值则自动切回（见高级「发布策略」）。

${F}yaml
on:
  workflow_dispatch:
    inputs:
      image-tag:
        description: "要部署的镜像 tag（git sha）"
        required: true
${F}

## 七、DORA 四指标：判断流水线好坏的标准

DORA（DevOps Research and Assessment）的研究给出了四个可量化的指标，是业界公认的效能标尺：

| 指标 | 定义 | 精英水平参考 |
|---|---|---|
| **部署频率** | 多久发布一次 | 按需（一天多次） |
| **变更前置时间** | 提交到上生产 | < 1 天 |
| **变更失败率** | 导致故障的发布占比 | 0–15% |
| **恢复时长（MTTR）** | 故障到恢复 | < 1 小时 |

**注意**：不要用「代码行数」「提交数」「故事点」衡量效能——DORA 研究明确否定了这类产出量指标。要衡量**结果**（交付速度与稳定性），不是**活动量**。

## ⚠ 踩坑与误区

1. **CI 里跑完整 e2e，每次提交都跑**：昂贵且 flaky。分层处理——PR 跑核心路径，主干/夜间跑全量。
2. **把部署脚本写在流水线 YAML 里**：超过 20 行动辄难维护。抽成脚本文件（可本地复现）或复用 workflow。
3. **没有制品不变量，部署时重新构建**：测试过的和部署的不是同一份产物，测试就白做了。（这是 SLSA 强调的核心问题。）
4. **生产密钥放在仓库级 secrets**：任何工作流都能读到。应放 Environment secrets。
5. **失败重试掩盖 flaky 测试**：把重试当解药会让真正的偶发 bug 永远不被修。
6. **流水线没人负责**：坏了三个月没人修，团队逐渐全体绕过。需要一个明确的 owner。
7. **只看部署频率不看失败率**：只追求快会让稳定性崩掉，四个指标必须一起看。

## ✅ 自检清单

- [ ] 能区分 CI / Continuous Delivery / Continuous Deployment 三者边界
- [ ] 流水线按「快→慢、便宜→昂贵」分层，最便宜的检查在最前
- [ ] 有并行化设计（lint/test/scan 并行而非串联）
- [ ] 制品不可变且带 sha 版本号，部署的是「测过的同一份」
- [ ] 安全扫描（SCA / 密钥扫描 / 镜像扫描）已进流水线并产生 SBOM
- [ ] 用 reusable workflow 或 composite action 消除重复编排
- [ ] 生产部署走 Environment + 审批，生产密钥仅该环境可见
- [ ] 有明确的一键回滚路径，且数据库变更向前兼容
- [ ] 用 DORA 四指标衡量流水线，而不是代码行数

<!--dd:devops-mid-2-->

## 🔬 深挖：流水线的门禁设计与「构建一次」原则

### 一、阶段划分与门禁

${C}${C}${C}
① 静态检查（秒级，最先跑，快速失败）
   lint / 格式化校验 / 类型检查 / 提交信息校验
② 单元测试（分钟级）+ 覆盖率门槛
③ 安全扫描（与测试并行）
   SAST（代码）、SCA（依赖）、secret 扫描、IaC 扫描
④ 构建 + 镜像扫描 + 签名（产出不可变制品）
⑤ 集成测试 / E2E（分钟到十几分钟）
⑥ 部署到测试环境 → 自动化验收
⑦ 部署到生产（人工审批 or 自动，取决于风险与成熟度）

门禁原则：越便宜的检查越靠前（lint 秒级，不该在编译之后才跑）
${C}${C}${C}

**并行化的收益计算**：把「测试 + 扫描 + 构建镜像」并行，流水线时长从「和」变成「最大值」。但要注意**并行会放大资源成本**，而且**只有真正独立的任务才能并行**（如扫描不依赖构建产物时）。

### 二、「构建一次，多处部署」与不可变制品

${C}${C}${C}
❌ 反模式：每个环境重新构建
   开发分支构建 → 测环境；main 构建 → 预发；tag 构建 → 生产
   → 三个产物内容不同（依赖解析、时间戳、构建缓存差异），
     测环境验证过的不是生产要跑的东西，「测试通过」失去意义

✅ 正确：一次构建，逐环境晋级
   构建一次 → 产物带上不可变版本号/Git SHA → 各环境部署同一 digest
   → 环境差异只体现在「配置」上（通过 ConfigMap/env/配置中心注入）
${C}${C}${C}

**这条原则是流水线设计的第一性原理**，它同时带来：可追溯（生产跑的 commit 是哪个一目了然）、可回滚（回退到上一个已验证的 digest）、可复现（不存在「重新构建后行为变了」）。

**配置必须与产物分离**：镜像里不放任何环境相关的值（数据库地址、密钥、开关），一律运行时注入。这是十二要素应用（12-Factor）的第三条（Config）——**混进镜像的配置，就是「同一产物在不同环境行为不同」的根源**。

### 三、环境晋级与审批的粒度

| 环境 | 部署方式 | 门禁 |
|---|---|---|
| dev | 每次推送自动 | 无（或只要 lint/test 过） |
| test/staging | 自动（main 分支） | 自动化测试 + 基础扫描 |
| pre-prod | 自动或半自动 | 完整回归 + 性能冒烟 |
| production | 手动触发 / 审批 | 环境审批 + 变更窗口（如避免周五晚） |

**审批不等于安全**：审批只是「有人签字」，真正降低风险的是**部署策略**（金丝雀、自动回滚、特性开关）与**快速回滚能力**。所以成熟团队的趋势是「**减少审批、增强自动化控制**」——用「自动金丝雀 + 指标自动回滚」替代「人工点确认」。

### 四、流水线即代码的可复用抽象

${C}${C}${C}
层级（从粗到细）
  ① 模板/可复用工作流：一条完整流水线（如「Java 服务标准流水线」）
  ② 复合 action / 共享步骤：一组环境准备（setup + cache + login）
  ③ 共享脚本/工具：仓库里的 scripts/ 或内部 CLI

最佳结构（多仓库组织）
  平台仓（shared-workflows）：
    .github/workflows/java-service.yml       ← 标准流水线模板
    .github/actions/setup-java/              ← 环境准备
  业务仓：
    uses: myorg/shared-workflows/.github/workflows/java-service.yml@v1  ← 只传参数
    （锁 tag 便于集中升级；安全要求高时锁 SHA）
${C}${C}${C}

**为什么必须抽公共层**：N 个仓库各自维护一份流水线，意味着「安全扫描升级」「缓存策略优化」要改 N 次，最终必然出现「有些仓库没有扫描」的不一致。**平台团队的职责之一就是把「正确的做法」变成「默认的做法」**。

### 五、流水线安全与凭据管理

| 项 | 做法 |
|---|---|
| 凭据来源 | 优先 **OIDC 联邦**（无长期密钥）；其次密钥管理服务（Vault/KMS）运行时注入 |
| 凭据范围 | 按环境隔离（测试环境密钥不能部署生产）、按 job 隔离（测试 job 拿不到部署凭据） |
| 制品写入 | 只有发布流水线能写制品库；禁止开发者个人凭据推送镜像 |
| 变更可审计 | 流水线定义走 PR 评审；部署记录关联 commit 与操作人 |
| 密钥扫描 | pre-commit + CI 双重扫描（防误提交） |

**一条重要的架构建议**：**部署凭据不要交给「测试/构建」阶段**。把流水线拆成「构建（无部署权限）」与「部署（最小权限，只对目标环境）」两个阶段，由受保护的环境门禁隔离——这样即使构建阶段被投毒，也拿不到生产权限。

### 六、用 DORA 指标度量流水线本身

| 指标 | 定义 | 目标方向 |
|---|---|---|
| **部署频率** | 单位时间上生产次数 | 越高越好（反映批量大小） |
| **变更前置时间** | commit 到生产运行的时长 | 越短越好 |
| **变更失败率** | 导致故障/回滚的部署占比 | 越低越好 |
| **恢复时长（MTTR）** | 故障到恢复的时长 | 越短越好 |

**四指标必须一起看**：只追求部署频率而失败率飙升，说明在裸奔；只追求低失败率而不部署，说明流程过重。**「高频 + 低失败率 + 快恢复」= 小批量 + 自动化验证 + 快速回滚**，这三者构成互相支撑的闭环。

**度量流水线自身的关键项**：排队时间（是否 runner 不足）、单次时长（缓存命中率）、flaky 测试比例（不稳定测试会让团队失去对红灯的信任——**flaky 测试必须被修复或隔离，否则门禁形同虚设**）、失败原因分布（环境/代码/依赖各占多少）。

## 📚 延伸阅读

- [DORA — DevOps 能力与四指标官方研究](https://dora.dev/)：每年《State of DevOps》报告的官方入口
- [GitHub Actions — Reusing workflows](https://docs.github.com/actions/using-workflows/reusing-workflows)：含 ${C}workflow_call${C} 的完整输入/密钥传递规则
- [Using environments for deployment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)：审批、等待、分支限制全在这里
- [GitLab CI/CD Pipeline architecture](https://docs.gitlab.com/ee/ci/pipelines/)：对照 ${C}needs${C} 的 DAG 依赖与 ${C}rules${C} 条件
- [SLSA 框架](https://slsa.dev/spec/)：理解「为什么部署的必须与测试的是同一制品」
`
          },
          {
            id: "devops-mid-3",
            title: "Kubernetes 核心对象与 Helm 包管理",
            minutes: 34,
            updated: "2026-09-16",
            applies: "Kubernetes 1.28+ / Helm 3",
            tags: ["Kubernetes", "Helm", "编排"],
            terms: ["Kubernetes", "Deployment", "Service", "Helm", "探针"],
            body: `
> **官方文档基线**：[Kubernetes Docs — Concepts](https://kubernetes.io/docs/concepts/)（Workloads / Services & Networking / Configuration / Storage / Scheduling） · [Tasks — Configure Liveness/Readiness/Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) · [Declaration & Imperative Management](https://kubernetes.io/docs/concepts/overview/working-with-objects/object-management/) · [Helm Docs — Charts](https://helm.sh/docs/topics/charts/) · [Chart Template Guide](https://helm.sh/docs/chart_template_guide/) · [Best Practices](https://helm.sh/docs/chart_best_practices/)

## 一、先建立心智模型：声明式 + 控制循环

Kubernetes 与传统运维最根本的区别：**你描述「想要的结果」，而不是「执行的步骤」**。

${F}text
你提交 desired state（YAML）
        ↓
API Server 持久化到 etcd
        ↓
Controller 持续对比 desired 与 actual
        ↓
发现偏差 → 采取动作（起 Pod / 重调度 / 重建）—— 循环往复
${F}

这个「对比—纠偏」的循环叫 **reconciliation（调谐）**。它带来两个必须理解的性质：

- **自我修复是内在的**：你删掉一个 Pod，Deployment 会立刻再起一个。所以「手动改 Pod」是无效操作。
- **所有对象都是声明式的**：${C}kubectl apply -f${C} 的语义是「让集群变成这个状态」，可反复执行。

**因此排障思路也不同**：不看「谁执行了什么命令」，而看「desired 与 actual 差在哪」。

## 二、最小可用工作负载：Deployment + Service + Ingress

${F}yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: { app: api }
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }      # 必须与 template.labels 匹配，写错就是「部署成功但无 Pod」
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                  # 最多多出 1 个
      maxUnavailable: 0            # 关键服务设为 0，保证容量不下降
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: registry.example.com/myapi:1.2.3   # 固定 tag，永不 latest
          ports:
            - containerPort: 8080
          resources:
            requests: { cpu: 200m, memory: 256Mi }   # 调度依据
            limits:   { cpu: 1000m, memory: 512Mi }  # 上限，超内存 = OOMKilled
          envFrom:
            - configMapRef: { name: api-config }
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: api-secret, key: db-password }
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector: { app: api }           # 靠 label 选 Pod，靠 Endpoints 转发
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port: { number: 80 }
${F}

**三个必须记住的「选择器陷阱」**：

- Deployment 的 ${C}spec.selector${C} 与 ${C}template.labels${C} 必须匹配，且**创建后不可改**。
- Service 的 ${C}selector${C} 选的是 **Pod 的 label**，不是 Deployment 的名字。
- Ingress 的 ${C}backend.service.name${C} 指的是 **Service 名字**，不是 Pod 或 Deployment。

90% 的「部署成功但访问 502」都出在这三处。

## 三、配置与密钥：ConfigMap / Secret

${F}bash
kubectl create configmap api-config --from-literal=LOG_LEVEL=info --from-file=app.yaml
kubectl create secret generic api-secret --from-literal=db-password='xxx'

# 或用 YAML（Secret 的 data 是 base64；stringData 可写明文，提交前注意别入库）
${F}

**关键认知**：**Kubernetes Secret 默认只是 base64 编码，不是加密**。任何能读该 namespace 的人都能解出明文。真正的加固手段：

1. 开启 **etcd 静态加密**（EncryptionConfiguration）。
2. 配 RBAC，严格限制 ${C}get secrets${C} 权限。
3. 生产用外部密钥管理：**External Secrets Operator** / **Secrets Store CSI Driver**（对接 Vault、云 KMS）。
4. 优先用 ${C}volume${C} 挂载而不是环境变量（环境变量会出现在 ${C}/proc${C}、崩溃转储与子进程里）。

## 四、存储：PV / PVC / StorageClass 三件套

${F}text
StorageClass  —— 「用哪种存储」（云盘类型 / NFS / local），由管理员定义
     ↓ 动态供给
PV（PersistentVolume）—— 实际的一块存储（由 provisioner 自动创建）
     ↑ 绑定
PVC（PersistentVolumeClaim）—— 应用提出的需求（多大、什么访问模式）
${F}

${F}yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes: [ReadWriteOnce]      # RWO/RWX/ROX：注意 ReadWriteMany 需要支持共享的文件存储
  storageClassName: standard
  resources:
    requests: { storage: 20Gi }
---
spec:
  containers:
    - name: db
      volumeMounts:
        - { name: data, mountPath: /var/lib/mysql }
  volumes:
    - name: data
      persistentVolumeClaim: { claimName: data }
${F}

**StatefulSet 与 PVC 的关系**：StatefulSet 用 ${C}volumeClaimTemplates${C} 为每个副本生成**独立 PVC**（${C}data-0${C}、${C}data-1${C}），这正是「有状态服务」与 Deployment 的本质差别——身份稳定、存储独立。

## 五、探针与资源：让平台能正确判断你的应用

**三种探针的语义完全不同，混用会导致严重故障**：

| 探针 | 回答的问题 | 失败后果 |
|---|---|---|
| **startupProbe** | 「启动完了吗」 | 未通过前不执行另两个；适合慢启动应用 |
| **readinessProbe** | 「能接流量吗」 | 从 Service Endpoints 摘除（**不重启**） |
| **livenessProbe** | 「还活着吗」 | **重启容器** |

${F}yaml
          startupProbe:
            httpGet: { path: /healthz, port: 8080 }
            failureThreshold: 30
            periodSeconds: 2            # 最多容忍 60s 启动
          readinessProbe:
            httpGet: { path: /ready, port: 8080 }
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /healthz, port: 8080 }
            periodSeconds: 10
            failureThreshold: 3
            timeoutSeconds: 2
${F}

**最容易出事的两条**：

- **liveness 探得太急**：应用只是 GC 停顿 3 秒就被判死重启，形成「重启雪崩」。liveness 应宽松（间隔 ≥ 10s、阈值 ≥ 3、只在真死锁时失败）。
- **readiness 与 liveness 用同一个端点**：依赖故障（如 DB 不可用）时 liveness 也失败 → 全体重启 → 更长时间不可用。**readiness 可以依赖下游，liveness 绝不能**。

## 六、调度、伸缩与可用性

${F}yaml
      # 让副本尽量散开到不同节点
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels: { app: api }
      # 或简单粗暴的反亲和
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector:
                  matchLabels: { app: api }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api
spec:
  minAvailable: 2
  selector:
    matchLabels: { app: api }
${F}

要点：

- **HPA 基于 requests 算利用率**。没设 requests 时 HPA 无法工作（会显示 ${C}<unknown>${C}）——这是「HPA 不生效」的第一原因。
- **PDB 保护自愿中断**（节点维护、集群升级）。没有 PDB，运维一次 drain 就可能把全部副本干掉。
- **QoS 等级**由 requests 与 limits 的关系决定：都设且相等 = Guaranteed（最不易被驱逐），都不设 = BestEffort（最先被驱逐）。

## 七、Helm：把一堆 YAML 变成可参数化的包

Helm 官方定位：**Kubernetes 的包管理器**。核心价值是「模板 + 值」的分离。

${F}text
mychart/
  Chart.yaml          元数据（name/version/appVersion）
  values.yaml         默认值（唯一的数据源）
  templates/
    _helpers.tpl      命名模板（命名约定、公共标签）
    deployment.yaml
    service.yaml
    ingress.yaml
    NOTES.txt         安装后提示
  charts/             子 chart 依赖
${F}

${F}yaml
{{/* templates/_helpers.tpl */}}
{{- define "mychart.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
${F}

${F}yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
${F}

${F}bash
helm lint ./mychart                       # 语法与最佳实践检查
helm template ./mychart -f values-prod.yaml   # 本地渲染出 YAML，部署前必看！
helm install api ./mychart -n prod --create-namespace -f values-prod.yaml
helm upgrade api ./mychart -n prod -f values-prod.yaml --atomic --timeout 5m
helm rollback api 3 -n prod               # 回滚到 revision 3
helm history api -n prod
helm diff upgrade api ./mychart -f values-prod.yaml   # 需 helm-diff 插件，强烈推荐
${F}

**values 分层的最佳实践**（官方 Best Practices 推荐）：

${F}text
values.yaml                # 默认值（开发可用）
values-staging.yaml        # 预发覆盖
values-prod.yaml           # 生产覆盖
${F}

用 ${C}--set${C} 覆盖只适合临时调试；**生产变更必须落到 values 文件并进 Git**，否则「集群里到底是什么配置」无法追溯。

## 八、排障命令速查

${F}bash
kubectl get pods -o wide                     # 看落在哪个节点、IP 多少
kubectl describe pod <pod>                   # Events 段是信息量最大的地方
kubectl logs <pod> --previous                # 看「崩溃前那个容器」的日志（关键！）
kubectl exec -it <pod> -- sh
kubectl get events --sort-by=.lastTimestamp | tail -30
kubectl get endpoints api                    # Service 有没有选到 Pod（空 = selector 错）
kubectl top pod                              # 需 metrics-server
kubectl auth can-i get secrets -n prod       # 验证 RBAC
kubectl explain deployment.spec.strategy     # 离线查字段文档
${F}

**Pod 状态语义速查**：

- ${C}Pending${C}：调度不上去——资源不足、亲和冲突、PVC 未绑定。
- ${C}ImagePullBackOff${C}：拉不到镜像——名字错、私有仓库缺 imagePullSecret、网络不通。
- ${C}CrashLoopBackOff${C}：启动就退——配置错、依赖不可达。**先看 ${C}--previous${C} 日志。**
- ${C}OOMKilled${C}：超 limits——${C}describe${C} 里看 Last State 的 Exit Code 137。
- ${C}Running${C} 但没流量：readiness 未通过 → ${C}describe${C} 看 Readiness 探针失败原因。

## ⚠ 踩坑与误区

1. **手动改 Pod**：改了立刻被调谐覆盖。任何变更必须改 Deployment/DaemonSet 等上层对象。
2. **不设 requests**：调度器无法合理放置（并影响 HPA、QoS）。**requests 是必须项，不是可选项。**
3. **limits 设得比 requests 高很多**：CPU 尚可（可压缩），**内存超限直接 OOMKilled**。Java 应用必须配 ${C}-XX:MaxRAMPercentage${C} 让 JVM 感知容器限制，否则仍按宿主机内存算堆。
4. **liveness 探针探依赖**：依赖抖动 → 全体重启 → 雪崩。liveness 只探自己。
5. **副本数为 1 上生产**：滚动更新期间必然中断。至少 2–3 副本 + PDB。
6. **Secret 当保险箱**：默认仅 base64。要看「安全」方向的密钥管理。
7. **${C}latest${C} 配合 ${C}imagePullPolicy: Always${C}**：无法复现、无法回滚。
8. **Helm 直接 ${C}upgrade${C} 不看渲染结果**：模板缩进错误会产出非法 YAML。养成先 ${C}helm template${C} / ${C}helm diff${C} 的习惯。

## ✅ 自检清单

- [ ] 能解释 reconciliation 循环，并据此设计排障思路
- [ ] 写得出手工可用的 Deployment + Service + Ingress，且清楚三处 selector 的区别
- [ ] 知道 Secret 只是 base64，并已规划静态加密 / External Secrets
- [ ] 分得清 PV / PVC / StorageClass，知道 RWO 与 RWX 的差别
- [ ] 三种探针语义清晰，liveness 不依赖下游、且有 startupProbe 兜慢启动
- [ ] 所有容器都设了 requests，内存 limits 与 JVM/运行时参数对齐
- [ ] HPA 生效（有 requests + metrics-server）、有 PDB 保护自愿中断
- [ ] 会用 ${C}describe${C} / ${C}logs --previous${C} / ${C}get endpoints${C} 三类命令定位故障
- [ ] Helm chart 的 values 分层进 Git，变更走 ${C}template${C} / ${C}diff${C} 预检，能 ${C}rollback${C}

<!--dd:devops-mid-3-->

## 🔬 深挖：控制器的协调循环与探针的误用

### 一、声明式与控制器模式：K8s 的灵魂

${C}${C}${C}
你提交 desired state（期望状态）：
  Deployment: replicas: 3, image: app:1.4.2

控制器（reconcile loop）不断做：
  observed = 读集群实际状态（有几个 Pod 在跑？镜像对不对？）
  if observed != desired:
      执行动作（创建/删除 Pod）让实际逼近期望
  （循环永不停止 —— 这就是「自愈」的来源）
${C}${C}${C}

**理解这一点能解释 K8s 的三个「怪现象」**：① 手动删掉一个 Pod，它会自动重建（因为期望 3 个）；② 改了 Deployment 的镜像，不是「修改现有 Pod」而是**创建新 Pod + 删旧 Pod**（Pod 不可变）；③ 你手动改 Pod 的标签，ReplicaSet 立刻把它「纠正」回去（标签是它认领 Pod 的依据）。

**声明式的代价**：状态收敛需要时间（不是瞬时），所以「提交后立刻验证」常常失败——必须等条件（${C}kubectl rollout status${C}、等待 Ready）而不是等待固定秒数。

### 二、探针三件套：误用会导致「连续重启」或「流量进不来」

| 探针 | 回答的问题 | 失败动作 | 误用后果 |
|---|---|---|---|
| **readinessProbe** | 现在能接流量吗？ | 从 Service 摘除（不重启） | 配得太严 → 实例频繁被摘除、容量抖动 |
| **livenessProbe** | 进程还活着吗？ | **重启容器** | 配了下游依赖检查 → 依赖抖动导致**全量重启雪崩** |
| **startupProbe** | 启动完成了吗？ | 在成功前抑制 liveness | 启动慢的应用不配 → 启动中被 liveness 杀掉，反复重启 |

${F}yaml
# 正确的分工示例
startupProbe:                       # 给慢启动应用（JVM 冷启动可能 60s）
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30              # 30 × 10s = 最多容忍 300s 启动
  periodSeconds: 10
livenessProbe:                      # ★ 只检查「进程自身」，绝不含下游依赖
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:                     # 可以包含「必要依赖是否就绪」
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 2
${F}

**一条铁律**：**liveness 绝不能检查数据库/缓存/下游服务**——下游抖动时所有实例的 liveness 同时失败，K8s 会把全部实例重启，把「部分降级」升级成「完全不可用」。依赖检查应该放在 **readiness**（临时摘流量，等依赖恢复自动回来）。

**还要配 ${C}initialDelaySeconds${C} / ${C}terminationGracePeriodSeconds${C}**：优雅停机的宽限期要大于应用处理完在途请求的时间，否则慢请求被硬切。

### 三、Service 与 kube-proxy：流量怎么到达 Pod

${C}${C}${C}
Service（ClusterIP）→ kube-proxy 在每个节点维护转发规则 → 后端 Endpoints（就绪的 Pod IP）
两种实现：
  iptables 模式：规则随 Service/Endpoint 数量线性增长 → 大规模下更新慢、查询 O(n)
  IPVS 模式：哈希表 O(1)，支持更多调度算法（rr/lc/wrr…）→ 大规模集群推荐
${C}${C}${C}

| Service 类型 | 作用 | 依赖 |
|---|---|---|
| ClusterIP | 集群内访问（默认） | 仅 kube-proxy |
| NodePort | 每节点开端口（30000-32767） | 节点 IP（易被滥用作为外部入口） |
| LoadBalancer | 云 LB 自动创建 | 云厂商实现 |
| ExternalName | DNS CNAME 到外部域 | 无 | 无 |

**Headless Service（${C}clusterIP: None${C}）**：不做负载均衡，直接用 DNS 返回所有 Pod IP——StatefulSet 与需要「客户端自己做负载均衡/发现全部实例」的场景（如 Kafka、ZooKeeper、自研一致性哈希）必须用它。

**K8s 网络模型的三条规则**：每个 Pod 一个 IP；Pod 间可直接通信（无 NAT）；Pod 与节点间可直接通信。**这也是为什么需要 NetworkPolicy**——默认全通，安全必须显式声明。

### 四、requests/limits 与 QoS 等级

${F}yaml
resources:
  requests: { cpu: 250m, memory: 512Mi }    # ★ 调度依据 + QoS 判定依据
  limits:   { memory: 1Gi }                 # 硬上限：超了 OOMKilled
  # CPU 通常不设 limits（或设较大）：CPU 可压缩，限得太死会因节流(throttling)拖慢响应
  # memory 必须设 limits：内存不可压缩，不设会拖垮节点
${F}

| QoS 等级 | 条件 | 被驱逐优先级 |
|---|---|---|
| **Guaranteed** | 每个容器 cpu/memory 的 request == limit | 最后（最安全） |
| **Burstable** | 有 request，但不等 | 中间 |
| **BestEffort** | 完全没设 | 最先被驱逐（最危险） |

**三个实践要点**：① **内存 request 必须接近真实用量**，否则节点会超卖、压力大时互相 OOM；② **CPU limits 慎设**——CPU 是可压缩资源，设了 limits 会导致 CFS 节流（${C}container_cpu_cfs_throttled${C} 指标飙升），表现为「CPU 没用满但延迟很高」；③ 关键服务（数据库、网关）一律 **Guaranteed**，避免被其他 Pod 挤掉。

**Java 在容器里的经典陷阱**：JVM 早期版本按**宿主机**内存算堆大小，导致容器 OOM。解法：用 ${C}-XX:MaxRAMPercentage=75${C}（JDK 10+ 已默认容器感知）或显式 ${C}-Xmx${C}；同时 ${C}ActiveProcessorCount${C} 也要注意（JVM 可能看到宿主机全部 CPU 而开过多 GC 线程）。**JVM 参数应按 limits 而非宿主机来配**。

### 五、调度控制：从「随便放」到「精确放置」

${F}yaml
# ① nodeSelector：最简单（按标签选节点）
nodeSelector: { disktype: ssd }

# ② 亲和/反亲和：表达「要和谁在一起 / 不要在一起」
affinity:
  podAntiAffinity:                       # ★ 同一 Deployment 的 Pod 尽量分散到不同节点
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector: { matchLabels: { app: api } }
          topologyKey: kubernetes.io/hostname
# ③ 污点与容忍：节点拒绝一般 Pod，只有声明容忍的才能上
#    kubectl taint node gpu-1 nvidia.com/gpu=true:NoSchedule
tolerations:
  - { key: nvidia.com/gpu, operator: Exists, effect: NoSchedule }

# ④ PDB：自愿中断（节点维护、驱赶）时保证最小可用数
--- 
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 2                        # 或 maxUnavailable: 1
  selector: { matchLabels: { app: api } }
${F}

**PDB 最容易被忽略但最关键**：没有 PDB，集群升级或节点缩容时可能**同时**驱逐某服务的全部 Pod，造成完全中断。**凡是「多副本 + 有可用性要求」的服务都应配置 PDB**。

**拓扑分布约束（topologySpreadConstraints）** 是比反亲和更现代的选择：能表达「跨可用区均匀分布」而不是「尽量不在一起」，适合 Zone 级容灾。

### 六、ConfigMap/Secret 与 Helm 的核心机制

${C}${C}${C}
ConfigMap/Secret 的两种挂载方式与更新行为差异（高频考点）
  ① 以卷挂载（volume）：内容更新后，Pod 内文件会「最终」同步更新（约 1 分钟）
     但应用需要自己 reload；subPath 挂载的文件不会更新
  ② 以环境变量注入（envFrom/valueFrom）：★ 容器启动后永不变更
     必须重启 Pod 才能生效（常用 checksum 注解触发滚动更新）
${C}${C}${C}

${F}yaml
# 用配置哈希注解强制「配置变了就滚动更新」（最常用的实用技巧）
spec:
  template:
    metadata:
      annotations:
        checksum/config: "{{ include (print $.Template.BasePath \"/configmap.yaml\") . | sha256sum }}"
${F}

**Helm 的四个核心概念**：Chart（包）、values（参数）、template（Go 模板）、Release（一次安装的实例）。几个必须知道的机制：
- **${C}helm upgrade${C} 是「三路合并」**：合并「旧 release 的 manifest」「新渲染的 manifest」「集群实际状态」——这解释了「为什么手动 kubectl 改过的资源在 upgrade 后可能被保留或改回」这类困惑；
- **hooks**（pre-install / post-upgrade / pre-delete 等）用于执行数据库迁移这类一次性任务，但注意失败时资源可能残留（需 ${C}hook-delete-policy${C}）；
- **状态存在 Secret 里**（${C}sh.helm.release.v1.*${C}），所以 Helm 依赖集群（不能离线渲染历史）；
- **${C}helm template${C} 与 ${C}--dry-run${C} 是排查渲染问题的第一手段**（比直接 upgrade 安全）；${C}helm diff${C} 插件能看变更内容。

**Helm 与 Kustomize 的分工**：Helm 适合分发「可配置的第三方组件」（社区生态丰富）；Kustomize 适合「自己的应用多环境差异」（无模板、纯覆盖、YAML 原生）。两者可组合（Helm 渲染基础，Kustomize 做覆盖），但**不要在一个组件上混用两套抽象**——那会让排障变得极其困难。

## 📚 延伸阅读

- [Kubernetes Concepts 官方目录](https://kubernetes.io/docs/concepts/)：Workloads 与 Services & Networking 两章是必读
- [Configure Probes 官方任务](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)：三种探针的官方语义与示例
- [Resource Management for Pods](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)：requests/limits 与 QoS 的权威说明
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)：values 命名、标签约定、模板组织的官方规范
- [kubectl 速查（官方）](https://kubernetes.io/docs/reference/kubectl/quick-reference/)
`
          },
          {
            id: "devops-mid-4",
            title: "基础设施即代码：Terraform 与十二要素",
            minutes: 30,
            updated: "2026-09-16",
            applies: "Terraform 1.6+ / OpenTofu",
            tags: ["Terraform", "IaC", "云基础设施"],
            terms: ["Terraform", "IaC", "状态管理", "12-Factor"],
            body: `
> **官方文档基线**：[Terraform — Language](https://developer.hashicorp.com/terraform/language)（Syntax / Resources / Data Sources / Variables / Outputs） · [State](https://developer.hashicorp.com/terraform/language/state) · [Modules](https://developer.hashicorp.com/terraform/language/modules) · [CLI](https://developer.hashicorp.com/terraform/cli) · [The Twelve-Factor App](https://12factor.net/zh_cn/) · [OpenTofu](https://opentofu.org/docs/)（Terraform 的开源继任分支）

## 一、IaC 解决什么问题：把「点出来的资源」变成「可评审的代码」

没有 IaC 的云上运维，最终都会变成：

- 控制台点出来的资源，**没人知道当时点了什么**。
- 环境无法复制，预发与生产「差不多但不完全一样」。
- 误删/误改无审计、无回滚。
- 有人离职，基础设施的「真实状态」跟着走。

IaC 的本质是**把基础设施的期望状态纳入版本控制**，从而获得软件工程的全部好处：评审、diff、回滚、复现、审计。

**两种流派必须分清**：

| 流派 | 代表 | 模型 | 适合 |
|---|---|---|---|
| **声明式（编排/供给）** | Terraform、Pulumi、CloudFormation | 描述「要什么」→ 工具算 diff | 创建/管理云资源、网络、集群 |
| **命令式（配置管理）** | Ansible、Chef、Puppet | 描述「做什么步骤」 | 机器内部配置、软件安装、批量操作 |

**推荐分工**：Terraform 负责「把机器和网络建出来」，Ansible 负责「把软件装进去」或直接让机器用不可变镜像（Packer + 容器），避免长期使用可变的配置管理。

## 二、HCL 核心语法：五个积木

${F}hcl
# 1) 变量：声明类型与默认值，运行时可用 -var / TF_VAR_ / tfvars 覆盖
variable "env" {
  description = "环境名"
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env 必须是 dev / staging / prod 之一"
  }
}

# 2) 数据源：读取已有资源的真实信息（只读）
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# 3) 本地值：给表达式起名字，避免重复
locals {
  name_prefix = "myapp-\${var.env}"
  common_tags = {
    Project = "myapp"
    Env     = var.env
    Managed = "terraform"
  }
}

# 4) 资源：真正要创建/管理的东西
resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.env == "prod" ? "m6i.large" : "t3.micro"
  subnet_id     = var.subnet_id
  tags          = merge(local.common_tags, { Name = "\${local.name_prefix}-app" })
  user_data     = file("\${path.module}/scripts/bootstrap.sh")
}

# 5) 输出：把结果暴露给调用方/给别的模块用
output "app_public_ip" {
  value       = aws_instance.app.public_ip
  description = "应用实例公网 IP"
}
${F}

**引用语法必须记牢**：${C}var.xxx${C} 变量、${C}local.xxx${C} 本地值、${C}data.TYPE.NAME.attr${C} 数据源、${C}RESOURCE_TYPE.NAME.attr${C} 资源属性、${C}module.NAME.output${C} 模块输出。**Terraform 靠这些引用自动推导依赖顺序**，不需要你手写顺序。

## 三、状态文件：Terraform 的「唯一真相」

这是 Terraform 最重要也最危险的部分。

${F}text
terraform.tfstate = 「我上次认为世界是什么样」
Terraform 的工作方式：state（上次认知） vs 真实云 API（现状） vs 代码（期望）
      → 计算出 增/改/删 计划
${F}

**三条铁律**：

1. **state 必须远端存储**（S3 + DynamoDB 锁 / GCS / Terraform Cloud / Azure Blob）。放本地意味着团队无法协作、丢失后无法管理已有资源。
2. **state 必须加锁**，防止两人同时 apply 造成资源错乱。
3. **state 里含明文敏感信息**（数据库密码、密钥都会写进去）。存储桶必须加密、严格限制访问，**绝不进 Git**。

${F}hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
  }
  backend "s3" {
    bucket         = "myapp-tfstate"
    key            = "prod/network/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
${F}

**${C}.gitignore${C} 必备**：

${F}text
.terraform/
*.tfstate
*.tfstate.*
crash.log
*.tfvars          # 若 tfvars 含敏感值
.terraform.lock.hcl   # ⚠ 这个要提交！它锁定 provider 版本
${F}

**注意 ${C}.terraform.lock.hcl${C} 必须提交**——它是 provider 版本的锁文件，保证所有人用同一版本的 provider（类似 ${C}package-lock.json${C}）。这是最容易搞错的一条。

## 四、模块化：官方推荐的目录结构

官方建议：**模块是「可复用的资源组合」，根模块是你的环境入口**。

${F}text
infra/
  modules/                      # 可复用模块（不直接部署）
    network/
      main.tf  variables.tf  outputs.tf  versions.tf
    eks/
      main.tf  variables.tf  outputs.tf
  envs/                         # 每个环境的根模块
    dev/
      main.tf        # 调用 modules
      terraform.tfvars
      backend.tf
    prod/
      main.tf
      terraform.tfvars
      backend.tf
${F}

${F}hcl
# envs/prod/main.tf
module "network" {
  source      = "../../modules/network"
  env         = "prod"
  cidr_block  = "10.0.0.0/16"
  az_count    = 3
}

module "eks" {
  source     = "../../modules/eks"
  env        = "prod"
  subnet_ids = module.network.private_subnet_ids   # 模块间用输出连接
  depends_on = [module.network]
}
${F}

**模块化的三条纪律**：

1. 每个模块必须有 ${C}variables.tf${C}（说明输入）与 ${C}outputs.tf${C}（说明输出），并写 ${C}description${C}。
2. 模块**不写 backend**（由根模块决定状态存哪）。
3. 固定的 provider 版本写在 ${C}versions.tf${C} 里，全仓库统一。

## 五、工作流：永远先看 plan

${F}bash
terraform init          # 下载 provider、初始化 backend（新环境第一步）
terraform fmt -recursive   # 格式化，CI 里用 -check 卡住未格式化的提交
terraform validate      # 语法与类型校验（不访问云）
terraform plan -out=tfplan    # 生成计划文件
#  ⚠ 仔细读 plan 里的每一个 -/+ 和 -destroy！
terraform apply tfplan  # 应用刚才评审过的那个计划（避免两次 plan 不一致）

terraform output
terraform state list                        # 列出被管理的资源
terraform state show aws_instance.app
terraform plan -refresh-only                # 只看漂移，不修
terraform import aws_instance.app i-0abc123 # 把已存在的资源纳入管理
terraform destroy                           # ⚠ 摧毁一切，生产慎用
${F}

**CI 集成方式（官方推荐）**：PR 阶段跑 ${C}init -backend=false && validate && plan${C} 并把 plan 输出作为 PR 评论；合并到主干后才 apply。这样**每一次基础设施变更都经过评审**，与代码走同一套流程。

**保护生产的两道闸**：

${F}hcl
# 1) 危险操作需显式确认
resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    prevent_destroy = true     # 防止误 destroy
    ignore_changes  = [tags["LastModified"]]   # 忽略外部系统频繁改的字段
  }
}
${F}

2）敏感资源（数据库、核心网络）用**独立 state + 独立审批**，避免一次 ${C}apply${C} 波及全局。

## 六、漂移与救援：state 错了怎么办

真实世界中总有人去控制台点了东西，于是 **state 与真实世界产生漂移**。

${F}bash
terraform plan -refresh-only     # ① 先看清漂移了什么
terraform apply -refresh-only   # ② 接受现实，把 state 更新为真实状态（不修改资源）

# ③ 资源被人删了，但 state 还记着
terraform state rm aws_instance.app     # 从 state 移除记录（资源已不存在）
terraform apply                          # 重新创建

# ④ 重命名资源地址（0.13+ 用 moved 块，避免删了重建！）
${F}

${F}hcl
# 用 moved 块安全重命名（比 terraform state mv 更可评审）
moved {
  from = aws_instance.app
  to   = aws_instance.web
}
${F}

**${C}moved${C} 块是很多人不知道的救命功能**：不做这一步，重命名资源会导致 Terraform「先删旧再建新」——数据库这种资源就是灾难。

## 七、十二要素应用（12-Factor）：IaC 之外的配置哲学

[Tweleve-Factor App](https://12factor.net/zh_cn/) 是云原生应用的经典方法论，与 IaC 互为补充。与运维最相关的五条：

| 要素 | 要求 | 反例 |
|---|---|---|
| **III. 配置** | 配置存在**环境变量**中，不写进代码 | 代码里 ${C}if (prod) url=...${C} |
| **IV. 后端服务** | 把 DB/缓存/MQ 当**可替换的附加资源** | 硬编码 IP、写死本地文件路径 |
| **VI. 进程** | 应用是**无状态进程**，状态外置到后端服务 | 会话存本地内存（多副本就失效） |
| **IX. 易处理** | 快速启动、优雅终止、能随时被杀 | 启动要 3 分钟、收到 TERM 直接死 |
| **XI. 日志** | 日志是**事件流**，输出到 stdout，由平台收集 | 自己写日志文件并轮转 |

**落地映射**：III → K8s ConfigMap/Secret；VI → 会话存 Redis；IX → readiness + preStop + 优雅停机；XI → 容器 stdout + Loki/ELK 收集。这套对应关系能把「十二要素」从口号变成可检查的清单。

## ⚠ 踩坑与误区

1. **state 放本地或进 Git**：团队协作直接崩，且可能泄露密钥。
2. **忘了提交 ${C}.terraform.lock.hcl${C}**：不同人拉到不同 provider 版本，plan 结果不一致。
3. **${C}apply${C} 前不看 plan**：${C}-/+${C} 是「替换」（先删后建）还是 ${C}~${C}（原地修改）必须逐行确认。数据库被替换就是数据丢失。
4. **一次性 one-shot 资源被反复管理**：如 ${C}random_password${C} 被重新生成会导致下游全量重建。用 ${C}lifecycle.ignore_changes${C} 或独立 state。
5. **在 ${C}module${C} 里写 ${C}backend${C}**：模块无法复用。
6. **手工改控制台后再跑 apply**：Terraform 会用 state 覆盖你的手工改动，可能造成意外。**要么全部纳入 IaC，要么用 ${C}ignore_changes${C} 显式声明不管**。
7. **用 ${C}--auto-approve${C} 在 CI 里全自动 apply 生产**：配合缺少审批，一次错误合并就是一次生产事故。
8. **把所有环境塞进一个 state**：爆炸半径太大，且 plan 越来越慢。

## ✅ 自检清单

- [ ] 能说清声明式（Terraform）与命令式（Ansible）的分工边界
- [ ] 会用 variable / data / locals / resource / output 五类积木，理解引用即依赖
- [ ] state 已远端化 + 加锁 + 加密，且 ${C}.gitignore${C} 排除 tfstate
- [ ] 提交了 ${C}.terraform.lock.hcl${C}，并锁定 provider 版本
- [ ] 目录按 ${C}modules/${C} + ${C}envs/<env>/${C} 组织，模块不含 backend
- [ ] 每次 apply 都基于评审过的 plan 文件，CI 里 plan 作为 PR 评论
- [ ] 关键资源配了 ${C}prevent_destroy${C}，重命名用 ${C}moved${C} 块
- [ ] 会用 ${C}plan -refresh-only${C} 检测漂移，会 ${C}import${C} 纳管存量资源
- [ ] 对照十二要素检查过配置外置、无状态进程、日志到 stdout

<!--dd:devops-mid-4-->

## 🔬 深挖：Terraform 的 state 与十二要素的工程解读

### 一、state 是 Terraform 的「真相」，也是最大的风险点

Terraform 不是「读现状再改」，而是**用 state 记录「我创建了什么」**，再与配置对比求出 diff：

${C}${C}${C}
配置（.tf）  ──┐
                ├──> plan（三方对比）──> apply
state（.tfstate）┘         ↑
集群/云实际状态 ────────────┘
${C}${C}${C}

**由此产生三个必知结论**：
1. **state 丢了就等于失控**：Terraform 不知道资源存在，会尝试重新创建（可能报「已存在」或产生重复资源）；所以 state 必须**远程存储 + 版本化 + 备份**；
2. **state 是敏感的**：数据库口令、私钥、证书都会**明文**存在 state 里（即使你在变量里标了 ${C}sensitive${C}，也只是不打印，state 里仍有）——所以 state 的存储桶必须加密 + 严格最小权限；
3. **多人协作必须有锁**：两个人同时 apply 会互相覆盖，造成「幽灵资源」。远程后端要开锁（S3+DynamoDB / Terraform Cloud / GitLab 托管 state）。

${F}hcl
terraform {
  backend "s3" {
    bucket         = "my-tf-state"
    key            = "prod/network/terraform.tfstate"   # 按「环境/组件」分 key，缩小爆炸半径
    region         = "ap-east-1"
    encrypt        = true
    dynamodb_table = "tf-lock"                          # ★ 状态锁，防并发 apply
  }
}
${F}

**state 拆分的粒度**是重要设计决策：全放一个 state 会「改安全组要重跑整个基础设施」（风险与耗时都放大）；拆成「网络 / 数据层 / 应用层」多个 state，用 ${C}data${C} 源互相引用，能让变更范围可控。**但拆得太细会让依赖关系难以表达**——以「变更频率 + 变更责任团队」为拆分依据是实践中最有效的口径。

### 二、plan / apply 的正确工作流

${F}bash
terraform fmt -recursive          # 格式化
terraform validate                # 语法与引用校验
terraform plan -out=tfplan        # ★ 保存计划（apply 时用同一份，避免「审查的」与「执行的」不一致）
terraform show -json tfplan | jq '.resource_changes[] | {addr:.address, act:.change.actions}'
terraform apply tfplan
# 漂移检测（别人在控制台手改过？）
terraform plan -detailed-exitcode  # 退出码 2 = 有差异
${F}

**三个纪律**：
1. **plan 必须被审查**（尤其出现 ${C}destroy${C} / ${C}replace${C}——「replace」意味着先删后建，对有状态资源可能是灾难）；
2. **apply 用保存的 plan 文件**，而不是重新 plan（否则中间若有变更，执行内容与评审内容不一致）；
3. **禁止在控制台手改**被 Terraform 管理的资源——会产生漂移，下次 apply 可能把你的手工修改「改回去」，或者更糟：${C}create${C} 与已存在资源冲突。

**${C}-target${C} 是应急手段而非日常工具**：它会跳过依赖图的部分检查，容易造成状态不一致（其他资源以为前置条件已满足）。用它之后应立刻跑一次完整 plan 确认无意外差异。

### 三、模块化与重构

${F}hcl
# 模块调用：把「一套经过验证的做法」封装复用
module "web_cluster" {
  source = "./modules/app-cluster"
  name   = "web"
  size   = 3
  image  = var.app_image
}

# 重构：资源地址变了（模块/名字改动）会导致「删旧建新」→ 用 moved 块告诉 Terraform
moved {
  from = aws_instance.web
  to   = module.web_cluster.aws_instance.this
}
${F}

**${C}moved${C} 块（1.1+）是重构的关键工具**：它让「重命名/搬进模块」不再产生 destroy/create。同理 ${C}terraform state mv${C} 是命令行的等价做法（但 moved 块可以被评审、留痕，更推荐）。

**导入已存在的资源**用 ${C}import${C} 块（1.5+）或 ${C}terraform import${C}：但导入后**必须逐项核对配置**，因为导入只带来 state、不带来配置——配置漏写字段会导致下次 apply 时把字段改回默认值（静默修改线上资源，很危险）。

### 四、防「误删」的四道保险

${C}${C}${C}
① 生命周期保护：prevent_destroy = true（对有状态资源：数据库、存储桶）
② 敏感资源保护：deletion_protection（云厂商侧也开一份）
③ 变更审查：CI 里 plan 输出 destroy 高危时人工确认
④ 权限隔离：日常开发账号无权 destroy 生产资源（分离 plan 与 apply 的权限）
${C}${C}${C}

${F}hcl
resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    prevent_destroy = true            # 有人 apply 删除时会直接报错
    ignore_changes  = [password]      # 密码由外部轮换，不让 Terraform 管
  }
}
${F}

**CI 中的 Terraform 门禁**：${C}terraform plan${C} 作为 PR 的必需检查 + 把 plan 结果评论到 PR（可见性）+ ${C}tflint${C} 做静态检查 + ${C}checkov${C}/${C}tfsec${C} 做安全扫描 + apply 只在 main 分支（且限制并发）。

### 五、十二要素（12-Factor）在容器时代的逐条对照

| 原则 | 含义 | 容器时代的落地 |
|---|---|---|
| 1 代码库 | 一份代码库，多次部署 | 一仓多环境部署（不是一环境一仓） |
| 2 依赖 | 显式声明并隔离 | lockfile + 镜像内自带运行时（不依赖宿主机） |
| 3 配置 | 存于环境 | **环境变量 / ConfigMap**；绝不烘焙进镜像 |
| 4 后端服务 | 当作附加资源 | DB/缓存/MQ 用地址连接，可随时替换（连接串来自配置） |
| 5 构建/发布/运行 | 严格分离 | **构建一次，多处部署**；镜像 = 发布产物 |
| 6 进程 | 无状态，共享无物 | 进程可随时被杀；状态放外部存储（含 session） |
| 7 端口绑定 | 自绑定端口对外服务 | 容器内监听端口，不对进程做守护化 |
| 8 并发 | 通过进程模型扩展 | 水平扩副本（不是靠线程调优）；Web 与 Worker 分离 |
| 9 易处理 | 快速启动、优雅终止 | 处理 SIGTERM + 优雅停机（在途请求跑完） |
| 10 环境等价 | 各环境尽量一致 | 同镜像同版本，差异只在配置；避免「只有生产装了 X」 |
| 11 日志 | 当作事件流 | **写 stdout/stderr**，不自己管理文件与轮转 |
| 12 管理进程 | 一次性任务 | 迁移/初始化任务用 Job / initContainer，不混在服务启动里 |

**最常被违反的两条**：**第 3 条（配置进镜像）**与**第 11 条（应用自己写文件日志）**。前者导致「同一镜像在不同环境行为不同」，后者在容器里会导致磁盘被撑满（可写层）与日志无法被采集。**把日志写 stdout 是云原生的硬要求**——采集交给平台（Fluent Bit / Vector / 日志采集 DaemonSet）。

### 六、IaC 的安全与合规

${C}${C}${C}
① 密钥不进代码：用 Vault / KMS / Variables（CI secrets），并启用 secret 扫描
   ★ 注意 state 里会有明文密钥 —— 所以 state 存储必须加密 + 权限最小化
② 静态扫描（IaC 层）：checkov / tfsec / trivy config
   检查项：S3 公开访问、安全组 0.0.0.0/0、未加密存储、日志未开启
③ 策略即代码：OPA / Sentinel / CloudFormation Guard 做「组织规范」强制
   例：禁止创建公网 ALB、必须打标签、实例类型白名单、必须加密
④ 合规即代码：把等保/审计要求写成策略，自动检查而不是人工核对
${C}${C}${C}

**一条实践建议**：**把「安全默认」做进模块**。团队用 ${C}module "s3_bucket"${C} 时，模块内部默认开启加密、版本化、禁止公开访问——这样「正确」是默认选项，「错误」需要显式声明。这比事后扫描有效得多（扫描只能发现问题，模块能避免问题）。

## 📚 延伸阅读

- [Terraform Language 官方文档](https://developer.hashicorp.com/terraform/language)：按 Syntax → State → Modules 顺序读
- [Terraform State 详解](https://developer.hashicorp.com/terraform/language/state)：含 remote state、locking、sensitive data 警告
- [Standard Module Structure](https://developer.hashicorp.com/terraform/language/modules/develop/structure)：官方对模块文件布局的规定
- [The Twelve-Factor App（中文）](https://12factor.net/zh_cn/)：一页读懂云原生应用设计原则
- [OpenTofu 文档](https://opentofu.org/docs/)：BUSL 许可变更后的开源继任实现，接口兼容
`
          },
          {
            id: "devops-mid-5",
            title: "制品与版本管理：语义化版本、SBOM 与不可变制品",
            minutes: 24,
            updated: "2026-09-16",
            applies: "OCI Registry / Harbor / Nexus / Artifactory",
            tags: ["制品管理", "SemVer", "SBOM", "供应链"],
            terms: ["制品", "语义化版本", "SBOM", "镜像仓库"],
            body: `
> **官方文档基线**：[Semantic Versioning 2.0.0](https://semver.org/lang/zh-CN/) · [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec) · [SLSA 框架](https://slsa.dev/spec/) · [CycloneDX](https://cyclonedx.org/specification/overview/) / [SPDX](https://spdx.dev/) · [Harbor Docs](https://goharbor.io/docs/) · [Sigstore/cosign](https://docs.sigstore.dev/)

## 一、制品（Artifact）是什么：交付的「原子单位」

**制品 = 经过构建、可被部署、且内容永不改变的那个东西**。

它可以是：

- 容器镜像（最常见）
- jar / war / 二进制
- npm / PyPI / Maven 包
- Helm chart
- 前端静态包（tar.gz）

**核心原则：制品不可变（Immutable）**。同一个版本号对应的内容永远不变，否则「测试通过的那份」和「上线的那份」就不再是同一个东西——这会让全部测试失去意义。

## 二、语义化版本 SemVer：MAJOR.MINOR.PATCH

官方规范（semver.org）定义得很精确：

${F}text
MAJOR.MINOR.PATCH       例：2.4.1
  ↑     ↑     ↑
  |     |     └─ 修 bug，向后兼容
  |     └─────── 加功能，向后兼容
  └───────────── 不兼容的破坏性变更
${F}

补充规则（官方规范原文要求）：

- 预发布版本：${C}1.0.0-alpha.1${C}、${C}1.0.0-rc.2${C}（**语义上小于** ${C}1.0.0${C}）
- 构建元数据：${C}1.0.0+20260916.sha.abc123${C}（不参与版本比较）
- **0.y.z 表示「初始开发阶段，任何东西都可能变」**，不享受兼容性承诺

**与提交规范的联动**：用 Conventional Commits，${C}feat:${C} → MINOR，${C}fix:${C} → PATCH，${C}feat!:${C} 或 ${C}BREAKING CHANGE:${C} → MAJOR。工具（semantic-release、release-please）可以全自动推导版本号，**彻底消除「版本号是拍脑袋定的」这个问题**。

**常见的错法**：把 SemVer 当成「发布次数」或「营销版本号」（${C}2.0${C} 大改版所以叫 2.0）。规范里 MAJOR 的含义是**破坏向后兼容**，不是「功能多」。

## 三、制品的标签策略：三层标识

一个生产级镜像应该同时带三到四个标签，各司其职：

| 标签 | 例 | 作用 | 稳定性 |
|---|---|---|---|
| **不可变唯一标识** | ${C}sha-9f3a2b1${C} | 精确回滚、可追溯 | 永久不变 |
| **语义化版本** | ${C}1.4.2${C} | 人读、发布说明对应 | 一版一次，永不覆盖 |
| **滚动标签** | ${C}1.4${C} | 取最新补丁 | 会移动 |
| **环境标签** | ${C}production${C} | 当前生产在用 | 会移动 |

${F}bash
# 一次构建、多个标签（关键：同一 digest，不是重建）
docker buildx build \\
  --tag registry.example.com/myapp:sha-\${GIT_SHA} \\
  --tag registry.example.com/myapp:1.4.2 \\
  --tag registry.example.com/myapp:1.4 \\
  --tag registry.example.com/myapp:production \\
  --push .

docker buildx imagetools inspect registry.example.com/myapp:1.4.2
# 验证：1.4.2 与 sha-xxx 指向同一 digest
${F}

**反模式**：在部署时用 ${C}docker build${C} 重新构建一份。这会让「上生产的制品」和「测试过的制品」的 digest 不同，也彻底破坏供应链可验证性。

**实际回滚操作**：把 ${C}production${C} 标签指向旧的 ${C}sha-xxx${C}（retag，不重建），或用 GitOps 改 manifest 里的 sha。

## 四、制品仓库：能力清单与选型

| 能力 | 说明 | 为什么需要 |
|---|---|---|
| 多格式支持 | OCI / Maven / npm / PyPI / Helm / 通用 | 一个入口管所有制品 |
| **不可变标签规则** | 已推送的 tag 禁止覆盖 | 从机制上保证「测过的就是上线的」 |
| 漏洞扫描 | 集成 Trivy / Clair | 引入制品前拦下带洞镜像 |
| 签名与验证 | cosign / Notary v2 | 只允许部署已签名的制品 |
| 保留策略 | 保留最近 N 个 / 按时间清理 | 控制存储成本 |
| 复制与代理 | 跨区域复制、上游代理缓存 | 多地部署与加速 |
| RBAC + 审计 | 按项目隔离、谁推谁拉可查 | 合规要求 |

**选型参考**：Harbor（开源自建，扫描/签名/复制齐全）、JFrog Artifactory（商业，格式最全）、云厂商 ACR/ECR/GAR（免运维）。**关键决策点：优先选择支持「标签不可变」的那一个。**

${F}bash
# 清理策略示例（保留策略要谨慎，别把回滚所需的版本清了）
crane ls registry.example.com/myapp | sort -V | head -n -10   # 预览要删哪些
${F}

## 五、SBOM：把「这个镜像里有什么」变成可查询的事实

SBOM（Software Bill of Materials，软件物料清单）是**制品所有组成成分的清单**——类似食品配料表。它的价值在 Log4Shell 这类事件中体现得淋漓尽致：**没有 SBOM 时，你要花几天去人肉确认哪些系统用了 Log4j；有 SBOM 时，一条查询就能列出受影响的所有制品**。

两种主流标准：

- **SPDX**（Linux Foundation）：ISO/IEC 5962 标准，法律与合规场景友好。
- **CycloneDX**（OWASP）：轻量、偏安全场景，原生支持漏洞关联。

${F}bash
# 生成 SBOM（Syft）
syft registry.example.com/myapp:1.4.2 -o cyclonedx-json > sbom.json
# 或用 Docker 内建
docker buildx build --sbom=true --provenance=true ...

# 用 SBOM 反查漏洞（Grype）
grype sbom:sbom.json --fail-on high    # 高危则 CI 失败

# 把 SBOM 作为制品一起推送（OCI artifact）
cosign attach sbom --sbom sbom.json registry.example.com/myapp:1.4.2
${F}

**落地建议**：在 CI 的构建步骤后自动生成 SBOM 并与镜像一起归档（${C}cosign attach sbom${C}），这样任何时间点都能回答「v1.4.2 里到底有哪些依赖、版本是多少」。

## 六、签名与来源证明：SLSA 与 cosign

**SLSA（Supply-chain Levels for Software Artifacts）** 定义了递进的供应链安全等级：

| 等级 | 要求 | 防什么 |
|---|---|---|
| L1 | 有构建过程文档、有出处信息 | 提高最低透明度 |
| L2 | 有**签名的构建来源**（provenance） | 防篡改 |
| L3 | 构建平台**强化且隔离**，来源不可伪造 | 防构建环境被入侵 |

配合 **Sigstore / cosign** 做签名与验证：

${F}bash
# 签名（密钥可用 OIDC 短期证书，无需长期私钥管理）
cosign sign --yes registry.example.com/myapp@sha256:abc...

# 验证：集群侧只允许部署已签名镜像
cosign verify registry.example.com/myapp@sha256:abc... \\
  --certificate-identity-regexp '^https://github.com/myorg/myapp/' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
${F}

**Kubernetes 侧强制**（准入控制）：用 **Kyverno** 或 **Sigstore Policy Controller** 配置策略，拒绝部署未签名或来源不明的镜像。这一步把「供应链安全」从「建议」变成「强制」：

${F}yaml
# Kyverno 策略片段：只允许来自可信仓库且已签名的镜像
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign
      match:
        any:
          - resources: { kinds: [Pod] }
      verifyImages:
        - imageReferences: ["registry.example.com/*"]
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/myorg/myapp/.github/workflows/*"
                    issuer: "https://token.actions.githubusercontent.com"
${F}

## 七、保留策略与依赖治理

**保留策略**（别把回滚路断掉）：

- 每个环境的**当前版本 + 最近 5 个版本**必须保留。
- 生产环境用到的版本**永久保留**（或至少一个季度）。
- 从未部署到任何环境的中间构建，7 天后清理。

**依赖治理**：

${F}text
直接依赖（你声明的）    → 明确版本，定期升级
传递依赖（依赖的依赖）  → 靠 SBOM + SCA 扫描发现
${F}

- 用 **SCA 工具**（Dependabot / Renovate / Trivy / OWASP Dependency-Check）持续扫描。
- **区分「可升级」与「必须升级」**：CVSS ≥ 7 且有可用利用的，走紧急通道；其余进常规升级批次。
- 关注 **EOL（生命周期终止）**：基础镜像、框架、语言版本的 EOL 时间表要纳入技术债跟踪（Node 18 已 EOL、CentOS 7 已 EOL 之类）。

## ⚠ 踩坑与误区

1. **部署时重建制品**：测过的和上线的是两个东西，全部测试白做。
2. **覆盖已发布的 tag**：${C}1.4.2${C} 今天一份明天另一份，回滚时无法确定回滚到了什么。
3. **没有 SBOM**：出事只能靠猜。这是 CISA 在 SBOM 指南里反复强调的。
4. **仓库允许覆盖 / 删除**：生产依赖的版本被误删，回滚路径直接断掉。
5. **把 latest 当版本用**：无法追溯、无法复现、无法回滚。
6. **只用 Tag 不用 digest**：tag 可变，部署时应固定 digest（${C}image@sha256:...${C}），这是 K8s 安全基线要求。
7. **签名只做一半**：签了但部署时不验证 = 没做。必须配合准入控制。

## ✅ 自检清单

- [ ] 能说清「不可变制品」为什么是交付正确性的前提
- [ ] 版本号遵循 SemVer，并能与 Conventional Commits 联动自动推导
- [ ] 每个制品同时带 sha / semver / 滚动 三类标签，且同 digest
- [ ] registry 开启「标签不可变」，禁止覆盖已发布版本
- [ ] CI 自动生成 SBOM（CycloneDX 或 SPDX）并与镜像一并归档
- [ ] 镜像已用 cosign 签名，集群准入门禁验证签名与来源
- [ ] 有明确的保留策略，且不会清掉回滚所需的版本
- [ ] 依赖持续扫描（SCA），并跟踪基础镜像/框架的 EOL 时间表
- [ ] 部署时用 digest 固定，而不是浮动 tag

<!--dd:devops-mid-5-->

## 🔬 深挖：语义化版本的解析行为与不可变制品

### 一、语义化版本不只是「约定」，它决定依赖解析结果

${C}${C}${C}
MAJOR.MINOR.PATCH
  MAJOR：不兼容的 API 变更（升级需改代码）
  MINOR：向后兼容的功能新增
  PATCH：向后兼容的问题修复

预发布与构建元数据（会被工具识别）：
  1.2.3-alpha.1 / 1.2.3-rc.2 / 1.2.3+build.5
  ★ 预发布版本的排序低于同版本正式版：1.2.3-rc.1 < 1.2.3
${C}${C}${C}

**范围修饰符（npm / semver 生态）的真实含义**：

| 写法 | 等价范围 | 风险 |
|---|---|---|
| ${C}1.2.3${C} | 精确 | 最安全，但无法自动拿补丁 |
| ${C}^1.2.3${C} | >=1.2.3 <2.0.0 | 允许 minor 升级——**可能引入行为变更**（提交者自认为兼容不等于真的兼容） |
| ${C}~1.2.3${C} | >=1.2.3 <1.3.0 | 只允许补丁升级（更保守） |
| ${C}1.2.x${C} / ${C}*${C} | 通配 | ${C}*${C} 极度危险（可能拉到大版本） |
| ${C}>=1.2.3${C} | 无上界 | 危险（可能跨大版本） |

**这就解释了「为什么 lockfile 是必须的」**：${C}package.json${C} 写 ${C}^1.2.3${C} 只表达意图，**真正的解析结果由 lockfile 固定**。没有 lockfile 时，今天装和明天装可能得到不同版本 —— 「本地能跑、CI 挂」的经典成因。**CI 必须用 ${C}npm ci${C} / ${C}mvn -o${C} 等以 lockfile 为准的命令，而不是 ${C}npm install${C}**。

### 二、不可变制品与「构建一次」

${C}${C}${C}
❌ 允许重新构建同一版本号：
   app:1.4.2 昨天构建一次、今天因为要修一个热修又构建一次并复用 1.4.2
   → 同名不同内容：回滚到 1.4.2 到底回到哪一份？无法回答
   → 不可复现：出问题时无法确定当时部署的是什么

✅ 不可变制品：
   版本号一旦发布，内容永不改变
   任何变更 → 新版本号（补丁版本 1.4.3）
   制品库开启「禁止覆盖」策略（大多仓库支持）
${C}${C}${C}

**如何保证「构建可复现」**（同一份源码 + 同一环境 → 字节一致或行为一致）：
- 锁依赖（lockfile / BOM）；
- 固定工具链版本（JDK/Node 版本在 CI 镜像里固定，不用 ${C}latest${C}）；
- 去掉时间戳与非确定性的元数据（或统一注入 ${C}SOURCE_DATE_EPOCH${C}）；
- 固定构建基础镜像的 digest（而不是 tag）。

### 三、制品仓库的职责划分

| 仓库类型 | 存什么 | 代表 |
|---|---|---|
| 依赖代理（Proxy） | 缓存公共仓库、防止外网依赖 | Nexus / Artifactory 的 proxy repo |
| 私有仓库（Hosted） | 自研包（jar/npm/pypi） | Nexus hosted |
| 镜像仓库 | 容器镜像（含多个 tag 与 manifest） | Harbor / ECR / ACR |
| 通用制品（Generic） | 二进制、安装包、SBOM 附件 | Artifactory generic |

**必须开启的三条策略**：① **禁止覆盖已发布版本**（不可变性）；② **保留策略 + 定期清理**（否则存储成本失控，但清理不能碰「正在被部署的版本」）；③ **访问审计**（谁拉了哪个版本，泄露溯源用）。

**${C}latest${C} 与 tag 复用的风险**（再强调一次，因为它是最常见的实践错误）：tag 可被覆盖时，K8s 的 ${C}imagePullPolicy: IfNotPresent${C} 会因「本地已有同名 tag」而不拉新镜像 —— 部署「成功了」但跑的还是旧代码。**根本解法：用不可变 tag 或 digest 部署，并配 ${C}Always${C}（或不指定，默认策略对非 latest 是 IfNotPresent）**。

### 四、SBOM、Provenance 与签名：把「不可变」升级为「可证明」

${C}${C}${C}
三件套一起发布（与镜像同 digest 绑定）：
  sbom.json          ← 里面有什么（依赖清单）
  provenance.json    ← 谁在什么环境用什么源码构建的（SLSA 里的 attestation）
  signature          ← 用构建者身份签名，并可验证（cosign / Notation）

部署侧强制校验（准入控制器）
  → 无签名 / 签名无效 / SBOM 有阻断级 CVE → 拒绝入集群
${C}${C}${C}

${F}bash
# 签名并附加证明（Sigstore keyless：用 OIDC 身份签名，无需自管私钥）
cosign sign  --yes myrepo/app@sha256:abc123...
cosign attest --yes --predicate provenance.json --type slsaprovenance myrepo/app@sha256:abc123...
cosign verify --certificate-identity-regexp 'https://github.com/myorg/.*' \
              --certificate-oidc-issuer https://token.actions.githubusercontent.com \
              myrepo/app@sha256:abc123...
${F}

**为什么必须用 digest 而不是 tag 签名/部署**：tag 可移动，签名只对「那一刻的那个内容」有效。用 digest 才能把「签名」与「内容」牢牢绑定——这是供应链安全从「靠约定」走向「靠密码学」的关键一步。

### 五、版本与制品的台账：出问题时的第一份答案

新 CVE 爆发时（如又一个 Log4Shell 级别的漏洞），团队要能在十分钟内回答三个问题：

${C}${C}${C}
① 我们有没有用这个组件？（→ SBOM 检索）
② 受影响的是哪些服务、哪些版本？（→ 制品台账 + SBOM 关联）
③ 现在线上跑的是不是受影响版本？（→ 部署记录 ↔ digest ↔ 版本号）
${C}${C}${C}

**建立这三条关联是「应急就绪」的基础设施**，很多团队在事件发生后才痛苦地手工翻找。落地要点：
- 每次构建产出 **SBOM 并入库**（与镜像同 digest）；
- 部署记录里**记录 digest 与版本号**（而不是只记 tag）；
- 部署记录与代码提交**关联**（哪个 commit、哪个 PR）。

**一个组织层面的实践**：把「漏洞响应演练」列为年度动作——发布一个「假 CVE」，计时从通告到确认「我们受影响的服务清单」。**演练结果通常会让团队发现台账不全**，而这个发现本身就是最大的收益。

## 📚 延伸阅读

- [Semantic Versioning 2.0.0（中文）](https://semver.org/lang/zh-CN/)：11 条规则，值得逐条读完
- [SLSA 规范](https://slsa.dev/spec/)：供应链安全的权威分级定义
- [CycloneDX 规范](https://cyclonedx.org/specification/overview/) / [SPDX](https://spdx.dev/)：两种 SBOM 标准的对照
- [Sigstore / cosign 文档](https://docs.sigstore.dev/)：无长期私钥的签名方案（keyless）
- [Harbor 文档](https://goharbor.io/docs/)：标签不可变、扫描、复制、签名的开源落地参考
`
          }
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "设计交付体系本身：用 GitOps 让 Git 成为唯一真相、用 Kustomize/Cluster API 管住多集群、用渐进式发布把风险降到可观测指标里、用 SRE 的错误预算做决策，并最终把能力沉淀成开发者平台。",
        chapters: [
          {
            id: "devops-adv-1",
            title: "GitOps 与持续交付（Argo CD / Flux）",
            minutes: 30,
            updated: "2026-09-16",
            applies: "Argo CD 2.10+ / Flux 2.x / Kubernetes 1.28+",
            tags: ["GitOps", "Argo CD", "持续交付"],
            terms: ["GitOps", "Argo CD", "声明式", "漂移"],
            body: `
> **官方文档基线**：[OpenGitOps 四原则](https://opengitops.dev/) · [Argo CD 文档](https://argo-cd.readthedocs.io/en/stable/)（Application / AppProject / Sync / Health） · [Argo CD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/) · [Flux 文档](https://fluxcd.io/flux/) · [CNCF GitOps 白皮书](https://github.com/cncf/tag-app-delivery/tree/main/gitops-wg)

## 一、GitOps 的四条定义（官方原文）

OpenGitOps 把 GitOps 收敛成四条原则，逐条理解才能避免「把 Jenkins 换成 Argo CD 就叫 GitOps」的误解：

1. **声明式（Declarative）**——整个系统的期望状态以声明方式表达。容器、网络、配置、策略都必须能用 YAML/代码描述。不可声明的东西（如人工在控制台点的按钮）不属于 GitOps 范畴。
2. **版本化且不可变（Versioned and Immutable）**——期望状态存在版本控制里，保留完整历史。**这就是回滚能力的来源**：回滚 = 回退一次 Git commit。
3. **自动拉取（Pulled Automatically）**——**集群内的代理主动从 Git 拉取**期望状态，而不是外部系统推。这一条是 GitOps 与「CI 脚本里跑 kubectl apply」的本质分界线。
4. **持续调谐（Continuously Reconciled）**——代理持续对比期望与实际，发现偏差就纠正，**并对外报告状态**。

**为什么「Pull」比「Push」更好**：

| | Push（CI 里 kubectl apply） | Pull（GitOps Agent） |
|---|---|---|
| 集群凭证 | 必须给 CI 生产集群凭证（高风险） | 集群自己拉，**CI 不需要集群凭证** |
| 漂移处理 | 只在下一次 push 时纠正 | 持续检测，随时自愈 |
| 谁能改集群 | 谁有凭证谁改 | 只有 Git（配合分支保护） |
| 网络方向 | CI 要能连到集群 API | 集群出网拉 Git 即可（更适配私有集群） |
| 审计 | 看 CI 日志 | 看 Git 历史（天然审计） |

## 二、Argo CD 核心模型

Argo CD 是「Kubernetes 的声明式 GitOps 控制器」，核心是三类对象：

${F}text
Application     —— 「哪个 Git 路径 → 部署到哪个集群的哪个 namespace」
AppProject      —— 「边界与权限」：限制 source repo、目标集群、可用资源类型（RBAC 的核心）
ApplicationSet  —— 「批量生成 Application」的模板（多集群/多环境场景）
${F}

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-prod
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io     # 删除 Application 时级联删除资源
spec:
  project: prod
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main                          # 或用 tag/commit sha 锁定
    path: overlays/prod/api
    kustomize:
      images:
        - registry.example.com/myapi=registry.example.com/myapi:1.4.2
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true        # 删掉 Git 里已移除的资源
      selfHeal: true     # 集群被手工改动时自动纠正
      allowEmpty: false  # 防止「渲染出空清单」把整套服务删光（重要防护！）
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 3
      backoff: { duration: 10s, factor: 2, maxDuration: 3m }
${F}

**${C}prune${C} 与 ${C}selfHeal${C} 是双刃剑**，开启前必须想清楚：

- ${C}prune: true${C}：Git 里删一个资源，集群里就真删。**必须配 ${C}allowEmpty: false${C}**，否则一次模板渲染失败（比如 ConfigMap 没找到）可能导致整套资源被判定为「都该删」。
- ${C}selfHeal: true${C}：有人手工改集群会被立刻覆盖。好处是防止「幽灵配置」，坏处是**应急时无法手工操作**——需要留一个「紧急通道」（临时暂停 sync）。

## 三、AppProject：把权限收进 GitOps 边界

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: prod
  namespace: argocd
spec:
  description: 生产环境
  sourceRepos:
    - https://github.com/myorg/k8s-manifests.git      # 只允许从这一个仓库拉
  destinations:
    - server: https://kubernetes.default.svc
      namespace: "prod-*"                             # 只能往这些 namespace 部署
  # 只允许创建这些类型（防止越权创建 ClusterRole 之类）
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
  namespaceResourceBlacklist:
    - group: ""
      kind: ResourceQuota
    - group: rbac.authorization.k8s.io
      kind: Role
  roles:
    - name: dev-team
      policies:
        - p, proj:prod:dev-team, applications, sync, prod/*, allow
      groups: [myorg:dev-team]
${F}

**这是 GitOps 的安全边界**：即使有人能改 manifest 仓库，他也无法越出 AppProject 允许的范围去创建特权资源。**权限从「谁有 kubectl」变成「谁有 Git 写权限 + 项目边界」**，审计链路清晰得多。

## 四、ApplicationSet：多环境多集群不复制 YAML

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: api
  namespace: argocd
spec:
  generators:
    - matrix:                                   # 集群 × 环境 的笛卡尔积
        generators:
          - clusters:
              selector:
                matchLabels: { tier: prod }
          - list:
              elements:
                - env: canary
                - env: stable
  template:
    metadata:
      name: 'api-{{cluster.name}}-{{env}}'
    spec:
      project: prod
      source:
        repoURL: https://github.com/myorg/k8s-manifests.git
        targetRevision: main
        path: 'overlays/{{env}}/api'
      destination:
        server: '{{cluster.server}}'
        namespace: 'api-{{env}}'
      syncPolicy:
        automated: { prune: true, selfHeal: true }
${F}

**收益**：新增一个集群只需给它打上 ${C}tier=prod${C} 标签，ApplicationSet 自动生成对应的 Application。**集群的注册动作与应用的部署动作彻底解耦。**

## 五、Flux 与 Argo CD 的取舍

两者都实现了 GitOps 四原则，差异在于架构哲学：

| 维度 | Argo CD | Flux |
|---|---|---|
| 形态 | 有 UI/API 的**应用**（含 Web 控制台） | 一组**控制器**（Kustomize/Helm/Notification/Source） |
| 上手 | 图形界面友好，直观 | 纯 CLI/CRD，更「云原生」 |
| 多租户 | AppProject 提供较强隔离 | 靠 K8s RBAC + 多实例 |
| 镜像自动更新 | Argo CD Image Updater | 内建 Image Automation |
| 渐进式发布 | Argo Rollouts | Flagger |
| 适合 | 需要可视化、团队多元 | 追求最小依赖、声明式到底 |

**选择建议**：需要给人看的操作界面、团队里不全是 SRE，选 Argo CD；追求「集群里只有控制器、没有额外服务」的极简哲学，选 Flux。二者都能做好 GitOps，**关键不在工具而在「Git 是唯一真相」的纪律**。

## 六、密钥怎么办：GitOps 的最大现实难题

「Git 是唯一真相」与「密钥不能进 Git」直接冲突。三种主流解法：

| 方案 | 原理 | 优点 | 缺点 |
|---|---|---|---|
| **Sealed Secrets** | 用集群公钥加密，只有集群能解密 | 简单、纯 GitOps | 换集群要重新加密、密钥轮换麻烦 |
| **SOPS + KMS/age** | 文件加密后进 Git，解密密钥在集群 | 支持多环境、可审计 | 需要 KMS 或 age key 管理 |
| **External Secrets Operator** | Git 里只放「引用」，真实值在 Vault/云 SM | **最推荐**：值根本不进 Git | 依赖外部密钥系统 |

${F}yaml
# ExternalSecrets 示例：Git 里只有「去哪里取」
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-secret
spec:
  refreshInterval: 1h
  secretStoreRef: { name: vault-backend, kind: ClusterSecretStore }
  target: { name: api-secret }              # 生成出来的 K8s Secret 名字
  data:
    - secretKey: db-password                 # K8s Secret 里的 key
      remoteRef:
        key: prod/api                            # Vault 里的路径
        property: db_password
${F}

**判断标准**：如果密钥轮换后需要「改 Git 里的加密文件」，说明方案还不够好（Sealed Secrets 的典型痛点）。理想状态是**轮换发生在密钥系统里，集群自动同步**——这正是 External Secrets 的思路。

## 七、与渐进式交付衔接

GitOps 负责「把期望状态同步到集群」，但它**不负责判断新版本好不好**。两者衔接方式：

${F}yaml
# Argo Rollouts 的 Rollout 对象同样由 GitOps 管理
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api
spec:
  replicas: 5
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: success-rate        # 引自 AnalysisTemplate
        - setWeight: 50
        - pause: { duration: 5m }
        - setWeight: 100
${F}

Argo CD 能识别 Rollout 的健康状态并展示在 UI 里；Argo Rollouts 负责按指标自动推进或回滚。**职责分离得很干净：GitOps 管「应该是什么」，Rollouts 管「怎么安全地变过去」。**

## 八、漂移检测与运维要点

${F}bash
# 查看同步状态与漂移
argocd app get api-prod
argocd app diff api-prod              # 显示 Git 与集群的实际差异
argocd app sync api-prod --dry-run
argocd app history api-prod
argocd app rollback api-prod 12       # 回滚到 deployment 12
argocd app list -o wide

# 应急通道：临时禁止自愈（改完记得恢复！）
argocd app set api-prod --sync-policy none
${F}

**必须做的三件事**：

1. **Sync 状态纳入监控与告警**。${C}OutOfSync${C} 持续超过 N 分钟应告警——这是「Git 与集群不一致」的信号，可能意味着有人在手工改集群，或 sync 一直失败。
2. **manifest 仓库与代码仓库分开**。代码仓库的 CI 只负责构建镜像并**提交一个新 commit 到 manifest 仓库**（更新 image tag）。这样「代码变更」与「部署变更」是两件事，可以独立回滚。
3. **分支保护 + PR 评审**：manifest 仓库必须走 PR，否则「Git 是唯一真相」会变成「谁都能直推生产」。

${F}text
代码仓库 (myapp)                     manifest 仓库 (k8s-manifests)
  改代码 → PR → CI 构建镜像             Pull Request 更新 image: 1.4.2
       → 推送 registry:1.4.2   ───────→  评审合并 → Argo CD 自动同步 → 集群
${F}

## ⚠ 踩坑与误区

1. **在 CI 里跑 kubectl apply 还叫它 GitOps**：这是 Push 模型，缺少持续调谐与自愈，且要把生产凭证交给 CI。
2. **${C}prune: true${C} 但没开 ${C}allowEmpty: false${C}**：模板渲染异常时可能批量删除资源。这是 Argo CD 实践中最惨烈的一类事故。
3. **manifest 仓库没有分支保护**：跳过 PR 直推生产，等于放弃了最后一道闸。
4. **把密钥加密后塞进 Git，且轮换要改 Git**：运维成本高，最终会退化成「密钥写在 values 里」。
5. **只靠 Argo CD 的 UI 看状态，不接告警**：${C}OutOfSync${C} 与 ${C}Degraded${C} 没人发现，等于没有 GitOps。
6. **应急时忘记关掉 selfHeal**：重启 Pod、临时扩容等操作会被立刻覆盖，排障时反复失效。
7. **一个 Application 管上百个资源**：sync 慢、失败难定位。按「应用 / 关注点」拆分。

## ✅ 自检清单

- [ ] 能复述 OpenGitOps 四原则，并说清 Pull 与 Push 模型的本质差异
- [ ] Application 配了 ${C}prune + selfHeal + allowEmpty:false${C}，并知道如何临时关闭自愈
- [ ] 用 AppProject 收敛了 source repo、目标 namespace 与资源类型白名单
- [ ] 多集群场景用 ApplicationSet 生成，而非复制 YAML
- [ ] 密钥走 External Secrets 或 SOPS，**真实值不进 Git**
- [ ] manifest 仓库有分支保护 + PR 评审，改动可追溯
- [ ] 代码仓库与 manifest 仓库分离，CI 通过提交 tag 触发部署
- [ ] Sync/Health 状态已接入监控告警，${C}OutOfSync${C} 有告警
- [ ] 渐进式发布用 Argo Rollouts / Flagger 衔接，而非纯 GitOps 全量替换

<!--dd:devops-adv-1-->

## 🔬 深挖：GitOps 的四原则与同步引擎

### 一、GitOps 的四条原则

${C}${C}${C}
① 声明式（Declarative）：期望状态全部以声明方式描述（YAML/HCL）
② 版本化且不可变（Versioned & Immutable）：唯一真相来源是 Git，历史可追溯、可回滚
③ 自动拉取（Pulled Automatically）：集群侧的 agent 主动拉取，不由外部推送
④ 持续协调（Continuously Reconciled）：agent 持续对比并修正漂移（自愈）
${C}${C}${C}

**Push 与 Pull 的对比**（这是 GitOps 最核心的架构选择）：

| 维度 | Push 模型（CI 直接 kubectl/helm apply） | Pull 模型（GitOps） |
|---|---|---|
| 凭据方向 | **CI 持有集群写凭据**（暴露面大） | 集群持有只读 Git 凭据（暴露面小） |
| 网络要求 | CI 需能访问集群 API | 集群需能访问 Git（内网出网可行） |
| 漂移检测 | 无（除非自己实现） | 内建（持续对比） |
| 自愈 | 无 | 有（可配置自动修正） |
| 审计 | CI 日志 | **Git 历史（谁改了什么，天然可审计）** |
| 集群不可达时 | 部署失败 | 恢复后自动补齐（最终一致） |

**Pull 模型最大的安全优势**：**「谁能改 Git（受 PR 与审批保护）」等价于「谁能改集群」**，而 CI 不再持有集群管理凭据——供应链攻击的收益大幅降低。这是 GitOps 在企业落地的首要理由（其次才是自愈与审计）。

### 二、Argo CD 的架构与同步机制

${C}${C}${C}
Argo CD 的四个关键组件
  API Server     ：UI/CLI 入口，鉴权与聚合
  Repo Server    ：拉 Git、渲染（helm template / kustomize build），缓存
  Application Controller ：对比 desired vs live，决定 sync 与 sync status
  ApplicationSet Controller：批量生成 Application（多集群/多环境模板化）

Application 的四个关键字段
  source     ：repoURL + path + targetRevision + (helm|kustomize|plain)
  destination：目标集群 + namespace
  syncPolicy ：自动同步 / 自动修剪 / 自愈 / 同步窗口
  ignoreDifferences：忽略某些字段的漂移（如 HPA 改的 replicas）
${C}${C}${C}

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests
    targetRevision: main
    path: apps/app/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: app
  syncPolicy:
    automated:
      prune: true        # ★ 删掉 Git 里的资源 → 集群里也删（危险，但保证「Git 是唯一真相」）
      selfHeal: true     # 有人手改 → 自动改回
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true      # 只 apply 有差异的资源（大规模下显著提速）
    retry:
      limit: 5
      backoff: { duration: 5s, factor: 2, maxDuration: 3m }
${F}

**${C}prune: true${C} 是需要谨慎决定的一项**：它让「删除 Git 里的 manifest」真正删除集群资源。好处是彻底消除「孤儿资源」，风险是一次误删（比如把整目录挪走）会连带删除线上资源。**常见折中**：生产环境先只开 ${C}selfHeal${C}，用 ${C}prune${C} 但配合「同步窗口 + 人工确认」（不自动 sync，只提示有差异）。

**${C}ignoreDifferences${C} 的典型用途**：HPA 修改了 ${C}spec.replicas${C}、云厂商 webhook 注入了默认字段（如 sidecar 注入）、证书控制器改了字段 —— 这些「合理的漂移」会让应用永远显示 ${C}OutOfSync${C}，必须显式忽略，否则告警会被麻木。

### 三、Sync Waves 与 Hooks：让「没人管顺序」变成「有顺序」

K8s 的 apply 顺序本身不可控（控制器异步），但有依赖的场景（命名空间 → CRD → 配置 → 应用）必须排序：

${F}yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"     # 数字越小越先执行（默认 0）
    argocd.argoproj.io/hook: PreSync       # PreSync / Sync / PostSync / SyncFail
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
${F}

**典型编排**：${C}wave=-1${C} 建 Namespace/CRD → ${C}wave=0${C} 建 Secret/ConfigMap → ${C}wave=1${C} 建 Deployment/Service → ${C}wave=2${C} 建 Ingress/HPA → ${C}PostSync${C} 跑冒烟测试 Job。

**数据库迁移的位置**：放在 ${C}PreSync${C} 还是 ${C}PostSync${C} 取决于兼容性策略——若采用 expand-contract（先加兼容字段，后删旧字段），迁移应在 ${C}PreSync${C}（新旧代码都能跑）；如果迁移会破坏旧版本（不可回滚的变更），必须单独设计（拆成多阶段发布）。

### 四、密钥管理与多环境仓库布局

**密钥绝不能明文进 Git**（即使私有仓库）。三种主流做法：

| 方案 | 原理 | 特点 |
|---|---|---|
| Sealed Secrets | 用集群公钥加密后提交（只有集群私钥能解） | 简单；但轮换与多集群共享麻烦 |
| External Secrets | Git 里只放「引用」，实际值从 Vault/云 KMS 拉 | **推荐**：密钥不在 Git，轮换由密钥服务负责 |
| SOPS + KMS | 文件级加密，Git 里是密文，解密需 KMS 权限 | 适合配置文件里混有少量敏感项 |

${F}yaml
# External Secrets：Git 里只有「去哪拿」，没有「值是多少」
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
spec:
  secretStoreRef: { name: vault-backend, kind: ClusterSecretStore }
  target: { name: app-secret }
  data:
    - secretKey: DB_PASSWORD
      remoteRef: { key: prod/app/db, property: password }
${F}

**仓库布局的两种主流选择**：

${C}${C}${C}
A. 每环境一仓（或一分支）
   优点：权限隔离清晰（prod 仓只允许少数人合并）
   缺点：同一变更要改多处，容易不一致

B. 单仓多目录（overlays/prod、overlays/staging）
   优点：一处变更、结构统一、便于对比
   缺点：需要目录级 CODEOWNERS 控制生产目录的审批权
${C}${C}${C}

**推荐 B（单仓多目录）**：配合 ${C}CODEOWNERS${C} 把 ${C}overlays/prod/**${C} 指定给 SRE 评审，既保持一致性，又有审批隔离。分支隔离（prod 分支）虽然直观，但容易产生长期分叉与 cherry-pick 地狱。

### 五、回滚：GitOps 下的正确姿势

${C}${C}${C}
① Git 回滚（推荐）
   git revert <commit> → 推送 → 控制器自动同步回旧状态
   优点：有审计、与其他变更是同一流程、状态不漂移
② Argo CD 的「历史回滚」按钮
   本质是回滚 Application 的 targetRevision 或参数，不改变 Git 内容
   ⚠ 会被下一次同步覆盖（因为 Git 还是新状态）→ 只能作为「临时止血」
③ 紧急情况（Git 不可用/集群不可达）
   允许 kubectl 手工回滚镜像，但必须在恢复后「把 Git 改回一致状态」
   否则 selfHeal 会立刻把它改回去（或用 ignoreDifferences 暂缓）
${C}${C}${C}

**最重要的一条纪律**：**GitOps 下不存在「手改线上」这种长期状态**。任何紧急手工操作都必须以「回写 Git」收尾，否则系统会自愈回旧状态（这可能恰好是你想要的，也可能造成二次故障）。所以应急预案里要写清「手工操作后 30 分钟内必须回写 Git」。

## 📚 延伸阅读

- [OpenGitOps 原则（官方）](https://opengitops.dev/)：四原则的原始定义，一页读完
- [Argo CD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)：官方给出的仓库拆分、目录组织、资源类型建议
- [Argo CD — Application Specification](https://argo-cd.readthedocs.io/en/stable/user-guide/application-specification/)：syncPolicy 全部字段
- [Flux 文档](https://fluxcd.io/flux/)：控制器架构与 Image Automation
- [CNCF GitOps 白皮书](https://github.com/cncf/tag-app-delivery)：GitOps 与平台工程、渐进式交付的全景关系
`
          },
          {
            id: "devops-adv-2",
            title: "多集群与多环境管理：Kustomize 分层与 Cluster API",
            minutes: 28,
            updated: "2026-09-16",
            applies: "Kustomize 5.x / Cluster API / Argo CD",
            tags: ["Kustomize", "多集群", "多环境"],
            terms: ["Kustomize", "多环境", "多集群", "配置管理"],
            body: `
> **官方文档基线**：[Kustomize 官方文档](https://kubectl.docs.kubernetes.io/references/kustomize/)（参考） · [Kustomize 指南 — 声明式配置管理](https://kubectl.docs.kubernetes.io/guides/introduction/kustomize/) · [Cluster API 文档](https://cluster-api.sigs.k8s.io/) · [Kubernetes — 版本偏差策略](https://kubernetes.io/releases/version-skew-policy/) · [Helm — Values 文件与子 chart](https://helm.sh/docs/chart_template_guide/values_files/)

## 一、先定隔离策略：三种粒度，成本差一个量级

「多环境」不等于「多集群」。先按需要选粒度：

| 粒度 | 做法 | 隔离强度 | 成本 | 适用 |
|---|---|---|---|---|
| **Namespace 隔离** | 同一集群里 ${C}dev${C} / ${C}staging${C} / ${C}prod${C} | 弱（共享控制面与节点） | 最低 | 小团队、非核心业务 |
| **集群隔离** | 每个环境一个集群 | 强（控制面、网络、故障域全隔离） | 中 | 生产与预发必须分开 |
| **账号/项目隔离** | 云账号或云项目级隔离 | 最强（计费、配额、合规独立） | 最高 | 强合规、多业务线 |

**最小安全线**：**生产与预发必须在不同集群**。原因不是「性能」，而是：

- 共享控制面时，一次 etcd 打满或 API Server 过载会同时影响生产和测试。
- 节点资源竞争（预发跑压测把生产节点打满）。
- 升级集群版本时无法分批验证。
- 权限边界模糊，误操作半径覆盖生产。

**Namespace 隔离的三件套**（即使同集群也要做）：

${F}yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: limit, namespace: staging }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    pods: "100"
---
apiVersion: v1
kind: LimitRange
metadata: { name: defaults, namespace: staging }
spec:
  limits:
    - type: Container
      default: { cpu: 500m, memory: 512Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: staging }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]     # 默认拒绝所有进出，再按需放行
${F}

## 二、Kustomize：官方推荐的「无模板」配置管理

Kustomize 已内建进 kubectl（${C}kubectl kustomize${C}）。它的哲学与 Helm 相反：**不做模板，用「叠加」表达差异**。

${F}text
base/                       公共部分（不含环境差异）
  deployment.yaml
  service.yaml
  kustomization.yaml
overlays/
  dev/    kustomization.yaml   # 引用 base，打补丁
  staging/kustomization.yaml
  prod/   kustomization.yaml
${F}

${F}yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
commonLabels:                 # 统一打标签（新版用 labels: 带 includeSelectors）
  app.kubernetes.io/part-of: myapp
${F}

${F}yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod                     # 统一注入 namespace，不用在每个文件写
resources:
  - ../../base
images:                             # 覆盖镜像 tag（CI 常改这一处）
  - name: registry.example.com/myapi
    newTag: 1.4.2
replicas:
  - name: api
    count: 5
patches:
  - path: patch-resources.yaml
    target: { kind: Deployment, name: api }
configMapGenerator:
  - name: api-config
    literals:
      - LOG_LEVEL=warn
      - FEATURE_X=true
    behavior: merge                 # create 会冲突，merge 更安全
secretGenerator:
  - name: api-secret
    envs: [secret.env]              # ⚠ 记得把 secret.env 加进 .gitignore
    behavior: merge
${F}

${F}yaml
# overlays/prod/patch-resources.yaml
- op: replace
  path: /spec/template/spec/containers/0/resources
  value:
    requests: { cpu: 500m, memory: 1Gi }
    limits:   { cpu: 2000m, memory: 2Gi }
${F}

${F}bash
kubectl kustomize overlays/prod            # 本地渲染，部署前必看
kubectl kustomize overlays/prod | kubectl diff -f -    # 与集群现状对比
kubectl apply -k overlays/prod
# 构建远程 base（Git 仓库 + 版本号）
# resources:
#   - https://github.com/myorg/base//k8s/base?ref=v1.2.0
${F}

**Kustomize 与 Helm 的分工（官方与社区共识）**：

| | Kustomize | Helm |
|---|---|---|
| 机制 | 叠加补丁，YAML 直接可读 | 模板渲染，支持逻辑分支 |
| 差异表达 | overlay 目录 | values 文件 |
| 复杂模板逻辑 | 不支持（刻意） | 支持（${C}if${C} / ${C}range${C}） |
| 第三方 chart | 需 ${C}helmCharts${C} 或转换 | 生态丰富 |
| 适合 | **自研应用的配置分层** | **分发复杂应用（如 Prometheus/MongoDB）** |

**实践建议**：自研应用用 Kustomize（overlay 一目了然）；引入社区组件（Ingress Controller、监控栈、数据库）用 Helm chart，再把 Helm 渲染结果作为 Kustomize 的输入（${C}helmCharts${C} inflator 或 ${C}helm template > 文件${C}）。**别用 Helm 管自己的应用，也别用 Kustomize 手写别人复杂的 chart。**

## 三、多集群拓扑与 Cluster API

**三种主流拓扑**：

${F}text
① Hub-Spoke（中心-边缘）    一个管理集群跑 GitOps 控制器，管 N 个工作集群  ← 最常用
② Standalone（独立）        每个集群各跑一套 GitOps 控制器，互不依赖
③ Federated（联邦）         用 Karmada/ClusterSet 做跨集群调度与故障转移（复杂度最高）
${F}

**Hub-Spoke 的真实风险是「单点」**：管理集群挂了，所有集群失去调谐能力。缓解手段：

- 集群本身**已有工作负载不受影响**（GitOps 控制器只负责变更，不是运行时依赖）。
- 管理集群做多副本 + 高可用，并定期演练「管理集群故障」。
- 关键集群可额外部署一套 Standalone 的备份控制器（平时 sync 到同一 Git，但设为手动同步）。

**Cluster API（CAPI）用 K8s 方式管 K8s**：

${F}yaml
apiVersion: cluster.x-k8s.io/v1beta1
kind: Cluster
metadata: { name: prod-1 }
spec:
  clusterNetwork:
    pods: { cidrBlocks: ["10.1.0.0/16"] }
    services: { cidrBlocks: ["10.101.0.0/16"] }
  topology:
    class: quick-start                    # ClusterClass：一份模板定义整个集群形态
    version: v1.30.0
    controlPlane:
      replicas: 3
    workers:
      machineDeployments:
        - class: default-worker
          name: md-0
          replicas: 6
${F}

**CAPI 的价值**：集群的创建、升级、扩缩容全部变成 CRD。于是「新建一套生产环境」= 提交一份 YAML + 等 controller 干活，与「部署一个应用」的操作模型完全一致。**ClusterClass 进一步把「集群应该长什么样」固化成可复用的类**，避免每个集群各写一遍。

**升级顺序（官方版本偏差策略要求）**：

${F}text
控制面必须先升，且不能跨 minor 跳版（1.28 → 1.29 → 1.30，不能 1.28 → 1.30）
kubelet 不能高于 API Server（可以低 2 个 minor）
kubectl 偏差 ±1 minor
${F}

**升级流程**：dev → staging → 一个生产集群的 10% 节点 → 全量生产。每步之间留观察窗口（至少覆盖一个业务高峰）。

## 四、配置一致性与漂移治理

多环境最大的敌人是「配置漂移」：**同一份代码在不同环境行为不同**。

**三条治理手段**：

1. **单一真相源**：所有环境的配置都在同一个 Git 仓库（按 overlay 分目录），**禁止控制台改集群**（用 GitOps 的 ${C}selfHeal${C} 强制）。
2. **环境差异最小化**：overlay 里只写**必须不同**的东西（副本数、资源、域名、密钥引用）。若 dev 与 prod 的 base 差异超过 5 行，说明设计有问题。
3. **差异可视化**：CI 里渲染所有环境并 diff：

${F}bash
for env in dev staging prod; do
  kubectl kustomize "overlays/\${env}" > "/tmp/\${env}.yaml"
done
diff -u /tmp/dev.yaml /tmp/prod.yaml | head -50   # 定期人工 review 这个 diff
${F}

**推荐的「环境差异清单」**（应当只有这些）：

| 项 | dev | staging | prod |
|---|---|---|---|
| replicas | 1 | 2 | 5+ |
| resources | 小 | 中 | 按压测定 |
| 域名 | *.dev.example.com | *.stg.example.com | *.example.com |
| TLS | 自签 | 正式（Let's Encrypt） | 正式（企业 CA） |
| 外部依赖 | 本地/模拟 | 预发依赖 | 生产依赖 |
| 日志级别 | debug | info | warn |
| HPA | 关 | 开（小范围） | 开 |
| PDB | 无 | 1 | minAvailable 按容量算 |

**清单之外的一切差异都是 bug**。

## 五、容量与成本：多集群的现实约束

- **预留容量必须够扛「一个可用区失效」**。3 AZ 部署、每 AZ 33% 容量是理论值，实际应保证「少一个 AZ 仍能承接全部流量」。
- **跨集群流量要走内网对等连接**（VPC Peering / Transit Gateway），走公网既贵又不稳。
- **镜像仓库需多区域复制**，否则跨区拉镜像可能拖慢启动几十秒（并触发启动探针失败）。
- **成本分摊按集群 + namespace 标签统计**（用 Kubecost 或云原生成本工具），否则多环境一上线，账单没人认领。
- **非生产集群要有「夜间缩容」策略**（定时把 replicas 降到 0 或用 KEDA 按时间伸缩），能省 30%–50%。

## ⚠ 踩坑与误区

1. **环境差异靠人记**：docs 里写「prod 的副本数是 5」而实际是 7，迟早出事。差异必须在 overlay 里可读。
2. **在 overlay 里重写整个 Deployment**：base 一改，overlay 立刻失效。**overlay 只放补丁，不放完整副本。**
3. **Kustomize 的 ${C}configMapGenerator${C} 用 ${C}create${C} 行为**：与已有 ConfigMap 冲突会报错。用 ${C}merge${C}。
4. **${C}secret.env${C} 忘了加 .gitignore**：明文密钥进 manifest 仓库，比代码仓库泄漏还严重（manifest 仓库常被更多人访问）。
5. **Hub 集群当单点且无演练**：管理集群故障后，谁也不敢动 GitOps，团队退回手工 kubectl。
6. **跨 minor 升级集群**：官方明确不支持，会留下难以清理的组件版本错配。
7. **用 Kustomize 管理第三方复杂 chart**：把别人几百行的 chart 转成 YAML 再打补丁，维护成本极高。该用 Helm 就用 Helm。
8. **dev 环境配得和生产完全不同**：dev 跑得通、prod 挂，因为 dev 没开探针、没设资源限制、没走 Ingress。「配置差异清单」越短越好。

## ✅ 自检清单

- [ ] 生产与预发已物理隔离（不同集群或不同云账号）
- [ ] 同集群多环境场景配了 ResourceQuota + LimitRange + NetworkPolicy 默认拒绝
- [ ] 使用 Kustomize base + overlay，overlay 里只有补丁、没有 base 的完整副本
- [ ] 镜像 tag 只通过 ${C}images:${C} 覆盖（CI 的改动点唯一）
- [ ] 环境差异能列成一张短清单，且每次变更都 review 过 diff
- [ ] 多集群用 Hub-Spoke + ApplicationSet，并演练过管理集群故障
- [ ] 集群创建/升级走 Cluster API + ClusterClass，升级不跨 minor
- [ ] 有跨集群网络与镜像复制的规划，成本按标签分摊
- [ ] 非生产集群有缩容策略

<!--dd:devops-adv-2-->

## 🔬 深挖：Kustomize 的覆盖机制与多集群治理

### 一、Kustomize 的核心：base + overlay

${C}${C}${C}
base/                     ← 共性（所有环境相同的部分）
  deployment.yaml
  service.yaml
  kustomization.yaml
overlays/
  dev/
    kustomization.yaml    ← 引用 base + 打补丁 + 改副本数/镜像/域名
    patch-replicas.yaml
  prod/
    kustomization.yaml
    patch-resources.yaml
    patch-ingress.yaml
${C}${C}${C}

${F}yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base
  - hpa.yaml
namePrefix: prod-                     # 资源名前缀（防跨环境同名冲突，尤其在共享集群时）
commonLabels: { env: prod }
images:
  - name: myrepo/app
    newTag: "1.4.2"                   # ★ 发布就是改这一行（配合 GitOps 的自动化）
patches:
  - path: patch-resources.yaml
    target: { kind: Deployment, name: app }
replicas:
  - { name: app, count: 6 }
configMapGenerator:
  - name: app-config
    literals: [ "LOG_LEVEL=info" ]    # 生成带内容哈希的 ConfigMap 名 → 自动触发滚动更新
${F}

**${C}configMapGenerator${C} 的隐藏价值**：它会生成带**内容哈希后缀**的 ConfigMap 名（如 ${C}app-config-8h7f56m2b${C}），Deployment 引用被同步更新——于是「配置变了 → Pod 模板变了 → 自动滚动更新」。这解决了「改了 ConfigMap 但应用没重启、配置没生效」的经典问题（K8s 原生的 ConfigMap 更新不会重启 Pod）。

### 二、两种补丁策略的选择

| 策略 | 写法 | 特点 |
|---|---|---|
| **strategic merge** | 直接写要覆盖的片段（YAML 结构化合并） | 可读性好，按 k8s 的合并语义（如 containers 按 name 合并） |
| **JSON 6902** | ${C}[{"op":"replace","path":"/spec/replicas"}]${C} | 精确（能做删除与数组下标操作），但不直观、易过期 |

${F}yaml
# strategic merge：只写差异部分（推荐默认）
apiVersion: apps/v1
kind: Deployment
metadata: { name: app }
spec:
  template:
    spec:
      containers:
        - name: app                      # ★ 必须带 name 才能正确合并到对应容器
          resources:
            limits: { memory: 2Gi }
---
# JSON 6902：需要「删除」或「精确改数组某元素」时用
# patch-delete-probe.yaml
- op: remove
  path: /spec/template/spec/containers/0/livenessProbe
${F}

**最常见的踩坑**：strategic merge 里忘了写 ${C}name${C}（容器/卷），结果 Kustomize 会**追加一个新容器**而不是合并——导致 Pod 里出现两个容器、启动失败。**规律记忆：凡是数组元素（containers / volumes / env），合并都要靠 ${C}name${C} 匹配。**

### 三、Kustomize 与 Helm 的取舍

| 维度 | Kustomize | Helm |
|---|---|---|
| 抽象方式 | 无模板，纯覆盖（YAML 原生） | Go template + values |
| 学习成本 | 低（会 YAML 就会） | 中（模板语法、函数、作用域） |
| 参数化能力 | 弱（无循环/条件，靠 overlay 的数量） | 强（循环、条件、函数） |
| 错误可见性 | 高（渲染结果就是 YAML 的叠加） | 低（模板渲染错误定位困难） |
| 生态 | 内置 kubectl，无额外依赖 | 社区 chart 生态庞大 |
| 复杂配置 | 需要大量 overlay 文件 | 一个 values.yaml 搞定 |

**实践口径**：
- **自己的应用**：Kustomize（无模板税，diff 清晰，配合 GitOps 直观）；
- **第三方组件**（Prometheus/Ingress/DB Operator）：Helm（复用社区 chart，不值得自己写）；
- **组合方式**：${C}kustomize build${C} 对 Helm 渲染结果再打补丁（Argo CD 支持 ${C}helmCharts${C}），或用渲染后提交（helm template 落盘到 Git，纯 GitOps）——但**不要在同一资源上混用两套抽象**。

### 四、Cluster API：把「集群本身」也声明化

${C}${C}${C}
传统流程：点控制台建集群 → 手工装插件 → 配置网络 → 记录在文档里（极易漂移）
Cluster API：集群本身也是 CRD（Cluster / MachineDeployment / MachinePool）
  → 集群的创建/升级/扩缩容都是声明式的
  → 集群的版本与节点池可被 GitOps 管理、可回滚
  → 多集群成为「声明一份 Cluster 清单」的事

典型能力：
  集群升级：改 version 字段 → 控制器滚动替换控制面与节点（带健康检查）
  节点池：MachineDeployment 的 replicas 声明式扩缩
  多集群：management cluster 统一管理一批 workload cluster
${C}${C}${C}

**Cluster API 的价值在「规模化之后」才显现**：管 2 个集群用不上；管 20 个以上、且需要「所有集群用同一套基线」时，声明式集群管理的收益（一致性、可审计、可复制）非常明显。**它的成本是引入了一个需要长期维护的控制面**，小团队应先用「模板 + 脚本 + 巡检」过渡。

### 五、多集群的划分依据与流量治理

${C}${C}${C}
划分维度（按需求选，不要全都要）
  ① 环境：dev / staging / prod（最常见，隔离最重要）
  ② 地域：多区域就近接入（合规 + 延迟）
  ③ 租户/业务线：强隔离（不同团队、不同合规要求）
  ④ 隔离等级：有状态/无状态分开；含敏感数据单独集群

★ 判断准则：需要「独立的爆炸半径」或「独立的权限边界」才拆集群
  仅仅为了「命名空间不够用」而拆集群，是自找运维成本
${C}${C}${C}

**多集群的流量入口**：

| 方案 | 说明 | 适用 |
|---|---|---|
| DNS/GSLB 权重 | 按地域或权重做解析 | 简单、跨云通用；切换有 TTL 延迟 |
| 全局负载均衡（云 LB + 多集群后端） | 云侧统一入口 | 同云多集群 |
| 服务网格多集群（东西向网关） | 跨集群服务发现与 mTLS | 需要跨集群调用的复杂场景 |
| GitOps 统一下发（Argo CD ApplicationSet） | 声明式生成多集群应用 | 所有场景的「管理面」 |

**ApplicationSet 是多集群 GitOps 的关键**：用生成器（list / cluster / git / matrix）批量生成 Application——例如「为 ${C}prod${C} 环境的所有已注册集群部署同一个应用」，一次配置、N 个集群生效。

${F}yaml
# ApplicationSet：集群生成器 + git 目录生成器（矩阵）
spec:
  generators:
    - matrix:
        generators:
          - clusters: { selector: { matchLabels: { env: prod } } }
          - git:
              repoURL: https://github.com/myorg/k8s-manifests
              revision: main
              directories: [{ path: apps/* }]
  template:
    metadata: { name: '{{path.basename}}-{{name}}' }
    spec:
      source: { repoURL: '{{url}}', path: '{{path}}', targetRevision: main }
      destination: { server: '{{server}}', namespace: '{{path.basename}}' }
${F}

### 六、多集群的一致性治理

三个必须统一的东西（否则「同一个应用在 A 集群正常、B 集群异常」会成为常态）：

1. **基线**：节点镜像、容器运行时版本、核心插件（CNI/CSI/指标）版本、内核参数——用「集群模板」或 Cluster API 统一；
2. **策略**：准入策略（Pod Security / 资源配额 / 镜像来源白名单）用**策略引擎集中下发**（如以 GitOps 方式同步同一套 Kyverno/Gatekeeper 策略到所有集群）；
3. **观测**：统一采集与查询入口（Prometheus 联邦/远端写入 + 统一 Grafana），否则排查要登录 N 个集群。

**成本提醒**：多集群的运维成本大致随集群数量**超线性**增长（版本偏差、凭据轮换、网络策略、监控盲区）。所以选型时务必自问「**这个拆分解决的是什么具体问题**」——答案通常是「隔离」「合规」「就近」，而不是「更先进」。

## 📚 延伸阅读

- [Kustomize 官方参考](https://kubectl.docs.kubernetes.io/references/kustomize/)：kustomization.yaml 的完整字段说明
- [Kustomize 使用指南](https://kubectl.docs.kubernetes.io/guides/)：base/overlay、patch 策略（strategic merge / JSON patch）
- [Cluster API 文档](https://cluster-api.sigs.k8s.io/)：ClusterClass、MachineDeployment、升级流程
- [Kubernetes 版本偏差策略](https://kubernetes.io/releases/version-skew-policy/)：升级前必读的官方约束
- [Helm — Values Files](https://helm.sh/docs/chart_template_guide/values_files/)：与 Kustomize overlay 的对照参考
`
          },
          {
            id: "devops-adv-3",
            title: "发布策略：滚动更新、蓝绿与金丝雀",
            minutes: 30,
            updated: "2026-09-16",
            applies: "Kubernetes / Argo Rollouts / Flagger / Istio",
            tags: ["发布策略", "金丝雀", "灰度", "Argo Rollouts"],
            terms: ["发布策略", "金丝雀发布", "蓝绿部署", "滚动更新"],
            body: `
> **官方文档基线**：[Kubernetes — Deployment（滚动更新参数）](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) · [Argo Rollouts 文档](https://argoproj.github.io/rollouts/)（Canary / BlueGreen / AnalysisTemplate） · [Flagger 文档](https://docs.flagger.app/) · [Istio — Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/) · [Google SRE Workbook — Canarying Releases](https://sre.google/workbook/canarying-releases/)

## 一、四种策略对比：先选对再谈优化

| 策略 | 机制 | 回滚速度 | 资源成本 | 风险控制 | 适用 |
|---|---|---|---|---|---|
| **重建（Recreate）** | 全停再起 | 慢 | 最低 | 差（有停机） | 有状态单实例、无法并存的版本 |
| **滚动更新（RollingUpdate）** | 逐步替换实例 | 中（需回滚一轮） | 低（1~2 个额外实例） | 中 | **默认选择**，无状态服务 |
| **蓝绿（Blue-Green）** | 新环境就绪后**整体切流量** | **秒级**（切回旧环境） | 高（双倍资源） | 好（切换即回滚） | 要求秒级回滚的核心服务 |
| **金丝雀（Canary）** | 按比例逐步放量 + 指标验证 | 快（把流量切回） | 中 | **最好**（真实流量验证） | 用户量大、变更风险高的服务 |

**决策树**：

${F}text
能接受短暂停机？ ──是──→ 又必须有状态且无法并存 → Recreate
      │
      否
      ↓
能否承受双倍资源 + 需要秒级回滚？ ──能──→ Blue-Green
      │
      不能
      ↓
有几个真实用户 + 有指标监控？ ──有──→ Canary（配自动化分析）
      │
      没有（内部服务/早期项目）
      ↓
      RollingUpdate（把 maxUnavailable 设成 0）
${F}

## 二、滚动更新：默认策略里的细节决定可靠性

${F}yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1            # 最多超出期望副本数 1 个（可以是数字或百分比）
      maxUnavailable: 0      # 关键服务必须为 0，保证容量不下降
  minReadySeconds: 10        # Pod Ready 后还要稳定 10s 才认为「可用」 ← 很重要
  progressDeadlineSeconds: 600
  revisionHistoryLimit: 10   # 保留的历史 ReplicaSet 数（支持回滚）
${F}

**${C}minReadySeconds${C} 是最容易被忽略的关键参数**。没有它时，Pod 一 Ready 就被算作可用并继续推进下一批——如果新版本的 bug 要 30 秒后才暴露（如连接池耗尽、缓存击穿），滚动更新会在故障显现前就把老版本全换掉。**设成 10–30 秒能让它「等一等」**。

**优雅停机三件套**（缺一个就会有请求失败）：

${F}yaml
    spec:
      terminationGracePeriodSeconds: 45      # ② 给足收尾时间（默认 30，常不够）
      containers:
        - name: api
          lifecycle:
            preStop:
              exec:
                command: ["sh","-c","sleep 10"]   # ③ 等 Endpoint 摘除传播完成
          readinessProbe:                          # ① 停止接收新流量
            httpGet: { path: /ready, port: 8080 }
${F}

**完整的停机顺序**（理解这个顺序就能理解为什么要 ${C}preStop sleep${C}）：

${F}text
① Pod 被标记 Terminating → 从 Service Endpoints 移除
   ⚠ 但 kube-proxy / Ingress 的转发规则更新是「异步」的，有几秒延迟
② preStop hook 执行（此时 Pod 仍在接收「旧规则」送来的流量）
③ preStop 结束后发送 SIGTERM 给主进程
④ 应用收到 SIGTERM → 停止接收新请求 → 处理完在途请求 → 退出
⑤ 超过 terminationGracePeriodSeconds 还没退出 → SIGKILL
${F}

**因此**：如果应用不支持优雅停机（收到 SIGTERM 直接死），就必须用 ${C}preStop sleep 10${C} 兜住「规则传播延迟」这段窗口，否则每次发布都会有一小批 502。

## 三、蓝绿：用 Service selector 做原子切换

${F}yaml
# 蓝（当前）：service 选中 track=blue
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api, track: blue }    # ← 只改这一个字段完成切换
  ports: [{ port: 80, targetPort: 8080 }]
---
# 绿（新版）
apiVersion: apps/v1
kind: Deployment
metadata: { name: api-green }
spec:
  replicas: 5
  selector:
    matchLabels: { app: api, track: green }
  template:
    metadata:
      labels: { app: api, track: green }
    spec:
      containers:
        - name: api
          image: registry.example.com/myapi:1.5.0
${F}

**切换流程**：

${F}bash
# 1) 部署 green 并等待全部 Ready
kubectl apply -f green.yaml
kubectl rollout status deployment/api-green --timeout=5m
# 2) 冒烟测试（直接用 green 的独立 service 或 port-forward）
kubectl run smoke --rm -it --image=curlimages/curl -- \\
  curl -sf http://api-green/healthz
# 3) 原子切换
kubectl patch svc api -p '{"spec":{"selector":{"app":"api","track":"green"}}}'
# 4) 观察一段时间，确认无异常
# 5) 保留 blue 一段时间以便回滚，之后才缩容到 0
kubectl scale deployment/api-blue --replicas=0
${F}

**回滚** = 把 selector 改回 ${C}track: blue${C}，**秒级完成**。这就是蓝绿的核心价值。

**代价与前提**：

- 资源翻倍（两套完整环境）。
- **有状态服务不适用**（数据库只有一份）。
- **数据库变更必须向前兼容**（新旧版本都能读同一份数据），否则切回去也白搭。
- 如果用了 Argo Rollouts，蓝绿可以更简单地用 ${C}Rollout${C} + ${C}activeService${C}/${C}previewService${C} 表达，并支持 ${C}autoPromotionEnabled: false${C} + 手动 promote。

## 四、金丝雀：让真实指标决定是否继续

**金丝雀的本质**：先用极小流量（1%–10%）把新版本暴露给真实用户，用指标判断它是否健康，再决定放量或回滚。

**三个层次的金丝雀**：

| 层次 | 流量切分依据 | 代表工具 | 精度 |
|---|---|---|---|
| L1：副本比例 | 新旧 Pod 数量比（如 1:9 = 10%） | K8s Deployment + Service（多副本） | 粗（受连接复用影响，不精确） |
| L2：网关权重 | Ingress/Gateway 按权重分流 | Nginx Ingress canary、Gateway API、Argo Rollouts | 准 |
| L3：服务网格 | Sidecar 按比例/按 Header 分流 | Istio VirtualService、Flagger | 最准（可按用户、地区、设备定向） |

**L1 的根本缺陷**：长连接（HTTP/2、gRPC、WebSocket）不会按 Pod 比例重新分配，一个客户端可能全程被粘在某个 Pod 上。所以**L1 只适合「快速看一眼」**，真正精细的金丝雀要用 L2/L3。

**Argo Rollouts 的自动化金丝雀（生产级做法）**：

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: api }
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: api-canary
      stableService: api-stable
      trafficRouting:
        nginx:                          # 精确流量切分交给 Ingress
          stableIngress: api
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 1                 # 从第一步就开始分析
        args:
          - name: service-name
            value: api-canary
      steps:
        - setWeight: 5
        - pause: { duration: 3m }        # 观察 3 分钟
        - setWeight: 20
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 5m }
        - setWeight: 100
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 1m
      count: 5                       # 连续观察 5 次
      successCondition: result[0] >= 0.99     # 成功率 ≥ 99%
      failureLimit: 1                # 连续 1 次不达标即失败
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",code!~"5.."}[2m]))
            /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[2m]))
${F}

**关键设计点**：

1. **successCondition 要基于业务指标，不只看 HTTP 5xx**。延迟 P99、业务成功率（下单成功率）、错误日志速率都应该纳入。
2. **failureLimit 不要设 0**：真实系统总有抖动，设 0 会导致频繁误回滚。设 1–2 更实用。
3. **观察窗口要覆盖真实流量周期**。3 分钟可能一个关键请求都没进来；至少覆盖一个业务高峰或几个完整用户会话。
4. **起点流量要足够小但又不能太小**。1% 在低流量系统里等于没有样本；实践中 5% 是常见起点。
5. **失败自动回滚**：${C}analysis${C} 失败时 Rollouts 自动把权重退回 stable，**无需人工介入**。这是金丝雀的最大收益。

**Flagger** 是另一个成熟选择（更偏「渐进式交付全家桶」）：它用 ${C}Canary${C} CRD 描述，支持 Istio/Linkerd/Nginx/Gateway API/App Mesh 多种流量提供方，并内置 webhook、负载测试、Prometheus 指标分析。**选型**：已经在用 Argo CD → 配 Argo Rollouts 更连贯；纯 Flux 用户 → Flagger 更自然。

## 五、数据库与配置变更：真正的难点在这里

**代码可以回滚，数据库变更往往不能**。所以发布策略必须包含数据变更策略。

**核心原则：Expand–Migrate–Contract（扩展—迁移—收缩）**

${F}text
第 1 次发布（Expand）   加新列/新表，代码同时兼容新旧结构（双写）
第 2 次发布（Migrate）  代码改读新结构，数据回填，双写继续
第 3 次发布（Contract） 确认无回滚需求后，删除旧列/双写逻辑
${F}

**反例（必然出事）**：

${F}sql
-- ❌ 与代码同一次发布中执行
ALTER TABLE orders DROP COLUMN old_status;
-- 此时如果应用需要回滚，旧代码会因缺列直接报错
${F}

**正解**：

${F}sql
-- ✅ 第一步：只加不删（向后兼容）
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(32);
CREATE INDEX CONCURRENTLY idx_orders_status_v2 ON orders(status_v2);

-- 第二步：代码双写并回填（后台任务，分批，避免锁表）
UPDATE orders SET status_v2 = map_status(status) WHERE status_v2 IS NULL;

-- 第三步：确认稳定后再删旧列（独立发布，且此时已无回滚需求）
-- ALTER TABLE orders DROP COLUMN status;
${F}

**其他数据相关注意**：

- **大表加索引用 ${C}CONCURRENTLY${C}**（PostgreSQL）或 Online DDL（MySQL 8 + gh-ost/pt-osc），避免长锁。
- **配置项先加后用**：新配置项在发布**前**就写入（否则新代码启动时读不到）。
- **特性开关（Feature Flag）**：把「发布」与「上线」解耦——代码可以先发，功能用开关控制开关，出问题关开关即可（秒级回滚，不需要重新部署）。

## 六、发布验证：自动化最后一公里

发布后的自动验证是「自助回滚」的前提：

${F}text
① 技术指标   错误率、P99 延迟、CPU/内存、重启次数
② 业务指标   下单成功率、支付成功率、登录成功率（比技术指标更早暴露问题）
③ 日志        ERROR 日志速率、新增异常类型（按异常指纹去重）
④ 依赖健康   下游调用成功率、DB 连接池使用率、队列堆积
⑤ 合成监控   关键路径的定时拨测（黑盒验证，独立于内部指标）
${F}

**建议**：把这五项做成一套「发布验证清单」，并在 ${C}analysis${C} 里至少覆盖 ①②③。**只看 5xx 是不够的**——很多严重故障表现为「请求成功但结果错误」（如金额算错、订单状态错），只能靠业务指标发现。

## ⚠ 踩坑与误区

1. **${C}maxUnavailable${C} 留默认值 25%**：副本数少时（如 4 副本）会同时干掉 1 个，容量下降 25% 可能触发级联超时。关键服务设 0。
2. **没有 ${C}minReadySeconds${C}**：新版本还没暴露问题就被全量替换。
3. **应用不处理 SIGTERM**：每次发布都有 502。用 ${C}preStop sleep${C} + 优雅停机。
4. **金丝雀只看流量比例不看连接复用**：用副本比例做 10% 金丝雀，实际可能 60% 流量都到了新版。
5. **分析窗口太短**：3 分钟可能一个样本都没有，等于没验证。
6. **没有自动回滚**：发现问题时已经全量，只能手动回滚——而手动回滚耗时正是 MTTR 的大头。
7. **数据库变更与代码同发**：这是「无法回滚」的头号原因。必须 Expand–Migrate–Contract。
8. **把「发布成功」等同于「功能正常」**：发布成功只说明进程起来了。业务正确性需要业务指标验证。
9. **蓝绿环境长期双份并存**：成本失控。切换确认后应及时缩容旧环境（但保留其 Deployment 定义以便快速重建）。

## ✅ 自检清单

- [ ] 能按决策树为不同服务选择合适的发布策略
- [ ] 滚动更新配了 ${C}maxUnavailable: 0${C} + ${C}minReadySeconds${C} + ${C}revisionHistoryLimit${C}
- [ ] 应用支持优雅停机，或至少配了 ${C}preStop${C} 等待期
- [ ] 蓝绿切换只需改一个 Service selector，且回滚为秒级
- [ ] 金丝雀的流量切分在网关或网格层（而非仅副本比例）
- [ ] 有基于真实指标（含业务指标）的自动化分析，失败能自动回滚
- [ ] 观察窗口覆盖真实流量周期，起点流量足以上统计
- [ ] 数据库变更遵循 Expand–Migrate–Contract，与代码发布解耦
- [ ] 有发布后验证清单（技术指标 + 业务指标 + 日志 + 依赖 + 合成监控）
- [ ] 高频变更功能用特性开关，做到「不发布即可调整」

<!--dd:devops-adv-3-->

## 🔬 深挖：发布策略的可用性数学与回滚姿态

### 一、滚动更新的可用性计算

${F}yaml
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1        # 更新期间最多 1 个不可用 → 最低 5 个可用
      maxSurge: 1              # 最多额外 1 个 → 峰值 7 个（需要节点有余量！）
  minReadySeconds: 10          # Pod Ready 后再观察 10 秒才算「成功」，别太短
  progressDeadlineSeconds: 600 # 超过则标记失败（要配告警，否则「卡住的发布」无人知）
${F}

**必须注意的三件事**：
1. **${C}maxSurge${C} 需要容量余量**：replicas 6 + surge 1 = 7，若节点资源刚好 6 份，新 Pod 会 Pending → 发布卡住。**在 K8s 上发布前要确认「集群有 surge 的余量」**（或配 Cluster Autoscaler + 节点就绪时间预算）；
2. **${C}readinessProbe${C} 决定发布速度与安全**：探针太松（启动就 Ready）会让流量打到未初始化完成的应用；太严（依赖检查）会导致发布长时间卡住。启动慢的服务必须配 ${C}startupProbe${C}；
3. **${C}progressDeadlineSeconds${C} 必须配告警**：它只是标记失败、**不会自动回滚**。要接告警或配合 Argo Rollouts 的自动回滚。

### 二、蓝绿：资源换简单，但数据是难点

${C}${C}${C}
蓝（当前版本）100% 流量
  ↓ 部署绿（新版本）→ 预热 → 切换全部流量到绿
绿 100% 流量（蓝保留作为回滚目标）
  ↓ 观察期内确认无异常 → 释放蓝

优点：切换瞬时、回滚瞬时（切回蓝）
代价：双倍资源（至少切换窗口内）；数据层兼容是最大难点
${C}${C}${C}

**数据层的三个问题**（决定蓝绿能否成立）：
1. **schema 变更要前后兼容**：绿版本需要新字段时，蓝版本仍在跑 → 新字段必须可空或有默认值（expand-contract：先加字段 → 双写 → 迁移 → 切换 → 清理）；
2. **不可逆的数据变更**（如数据格式转换、表结构重命名）会让「切回蓝」失败——这类变更必须拆成多阶段发布，或放弃蓝绿改用金丝雀+前滚；
3. **会话/缓存**：切流量后旧实例上的本地会话与缓存会失效，需要评估是否需要外部化（Redis 会话）。

**判断标准**：**「切回旧版本是否会读到不认识的数据」**——如果会，蓝绿的回滚能力就是假的，不能把它当安全网。

### 三、金丝雀：流量切分的四种实现

| 实现层 | 手段 | 精度 | 特点 |
|---|---|---|---|
| Ingress | 按权重注解（nginx canary annotations） | 粗（百分比） | 简单，不依赖额外组件 |
| 网关/Service Mesh | 按权重 + 按 header/用户/地域路由 | 细 | 能做「指定用户才走新版」（内部试用） |
| Service | 双 Deployment + 副本数比例 | 粗（受副本数限制） | 无额外组件，比例不精确（3:1 只能是 25%） |
| Argo Rollouts / Flagger | 声明式金丝雀 + 自动分析指标 + 自动回滚 | 细 | **完整闭环，推荐** |

${F}yaml
# Argo Rollouts：金丝雀 + 自动分析（指标不达标自动回滚）
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - analysis: { templates: [{ templateName: success-rate }] }   # ★ 自动判定
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis: { templates: [{ templateName: success-rate }] }
        - setWeight: 100
      # 分析用 Prometheus 查询：错误率 > 阈值 或 P99 > 阈值 → 自动中止并回滚
${F}

**自动分析是金丝雀的核心价值**：没有它，金丝雀只是「手动放量 + 人肉看监控」，而人的注意力无法持续 30 分钟盯曲线。**分析指标选择**：错误率（最关键）、P99 延迟、饱和度（CPU/连接池）、以及业务指标（下单成功率、支付转化）——**业务指标最能发现「技术指标正常但业务异常」的问题**。

### 四、特性开关：把「部署」与「发布」解耦

${C}${C}${C}
部署（deploy）  = 代码上了生产（对所有用户可见？不一定）
发布（release） = 功能对用户开放（由开关控制）

价值：
  ① 部署失败与功能问题解耦（代码上去了但开关关着，出问题不影响用户）
  ② 回滚不再需要重新部署（关开关即可，秒级）
  ③ 可以做 A/B 与灰度（按用户分桶）
  ④ trunk-based 开发的前提（未完成的功能也能进主干）
${C}${C}${C}

**开关的工程化管理**（否则会变成技术债）：
- **开关要有归属与生命周期**（谁负责、何时清理）——长期存在的开关会形成 2^N 组合的测试地狱；
- **默认值要安全**（异常时回退到「旧行为」而不是「新行为」）；
- **命名要表达语义**（${C}enable_new_checkout_flow${C}，而不是 ${C}flag_20260918${C}）；
- **开关上线前必须经过「关闭状态」的测试**（新功能上线后，开关关闭路径往往再也没人测）。

**「回滚」的三种姿态**（按速度与彻底性排序）：

| 姿态 | 手段 | 速度 | 局限 |
|---|---|---|---|
| 关开关 | 配置中心改一个值 | 秒级 | 只对「开关控制的行为」有效 |
| 镜像回退 | 回退 digest | 分钟级 | 依赖数据兼容（schema 不能已破坏） |
| 前滚修复 | 再发一版修好 | 十几分钟~小时 | 最彻底，但有窗口期 |

**成熟团队的标配是「三种都要有，且优先用最快的」**：能关开关就关开关；不能则回退镜像；数据已变更则前滚。**这套决策必须在事故前就写进预案并演练过**，而不是事发时讨论。

### 五、数据库变更的兼容性设计（expand-contract）

这是发布策略中最容易被忽视、也最容易造成事故的部分。四步法：

${C}${C}${C}
① Expand（扩展）：只加不删。新增字段/表/索引（可空、有默认值）
   → 新旧代码都能正常读写（旧代码忽略新字段）
② 双写/迁移：新代码同时写新旧结构；后台任务回填存量数据
③ Migrate（切换读）：读路径切到新结构；保留旧结构兼容旧版本（回滚窗口）
④ Contract（收缩）：确认新版本稳定、回滚窗口已过 → 删除旧字段/表
${C}${C}${C}

**四个必守规则**：
1. **绝不与发布同时执行破坏性 DDL**（删列/改类型/加非空约束）——一旦发布出问题要回滚，旧代码会遇到「不认识的 schema」；
2. **大表 DDL 要用在线工具**（gh-ost / pt-online-schema-change），避免长时间锁表；
3. **索引变更也要走 expand-contract**（先建新索引 → 切换 → 删旧索引），不要在同一次发布里「删旧建新」；
4. **迁移脚本要可重入且幂等**（失败重跑不能造成二次破坏），并记录执行状态。

**一条硬性纪律**：**发布顺序永远是「先兼容、后变更、再清理」**，任何「一步到位」的 schema 变更都是把回滚能力押上去赌——赢了省一次发布，输了就是一次无法快速恢复的故障。

## 📚 延伸阅读

- [Kubernetes Deployment 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)：${C}maxSurge${C}/${C}maxUnavailable${C}/${C}minReadySeconds${C} 的权威定义与滚动过程图解
- [Argo Rollouts — Canary 文档](https://argoproj.github.io/rollouts/main/features/canary/)：含 AnalysisTemplate 与多流量提供方示例
- [Flagger 文档](https://docs.flagger.app/)：渐进式交付的另一种实现，与 Flux 生态整合好
- [Google SRE Workbook — Canarying Releases](https://sre.google/workbook/canarying-releases/)：金丝雀的统计学要求与常见陷阱，强烈推荐
- [Istio Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)：按权重/Header/用户切流的原理
`
          },
          {
            id: "devops-adv-4",
            title: "SRE：SLI/SLO、错误预算与可观测性",
            minutes: 32,
            updated: "2026-09-16",
            applies: "Prometheus / OpenTelemetry / Grafana",
            tags: ["SRE", "SLO", "可观测性", "告警"],
            terms: ["SRE", "SLO", "错误预算", "可观测性"],
            body: `
> **官方文档基线**：[Google SRE Book](https://sre.google/sre-book/table-of-contents/)（SLO 章 / 监控分布式系统 / 发布工程） · [Google SRE Workbook](https://sre.google/workbook/table-of-contents/)（SLO 实现 / 告警） · [OpenTelemetry 文档](https://opentelemetry.io/docs/) · [Prometheus 文档](https://prometheus.io/docs/)（含 alerting 与 recording rules）

## 一、SRE 的本质：用工程手段管理可靠性

Google SRE 的核心论点只有一句：

> **可靠性是一个可以被量化和预算的工程指标，而不是一个「尽力而为」的态度问题。**

传统运维的做法是「把系统做到尽可能稳」，结果是：

- 可靠性目标没有上限，成本无上限。
- 开发与运维目标冲突：开发想快、运维想稳，靠政治协商而非数据决策。
- 出事之后靠「下次小心」而非机制改进。

SRE 的解法是把可靠性变成**可协商、可度量、有预算**的东西，从而让「快」与「稳」的取舍变成一个**数字问题**。

## 二、SLI / SLO / SLA：三个层级

${F}text
SLI（Indicator） 指标：「实际测出来的服务质量」，一个比率
      例：成功请求数 / 总请求数 = 99.95%

SLO（Objective）目标：「我们希望达到的程度」，内部目标
      例：30 天滚动窗口内，可用性 SLI ≥ 99.9%

SLA（Agreement）协议：对外承诺 + 违约后果（赔付）
      例：可用性 < 99.5% 则赔偿当月费用 10%
${F}

**三者的关键关系**：

1. **SLO 必须严于 SLA**。SLA 是「最后防线」，SLO 是「内部守住的线」。SLA 99.5% 时，SLO 应设 99.9%——**留出缓冲区**，否则一旦触发 SLO 就已经在赔付边缘。
2. **SLI 必须是「用户视角」的**。用户不关心你的 CPU 使用率，只关心「我这次请求成没成功、多快返回」。所以 SLI 应从**边缘**（负载均衡器、网关）采集，而不是从单个服务内部。
3. **SLO 不能设 100%**。100% 意味着零变更、零风险、零迭代——也不符合物理现实（网络本身就有丢包率）。

**好的 SLI 的四条标准**（Google SRE Workbook 给出）：

- **相关性**：与用户感知的「好/坏」直接相关。
- **可度量**：能被稳定的数据源量化。
- **可解释**：非技术人员看了也懂。
- **可行动**：指标恶化时团队知道该做什么。

**常见 SLI 类型**：

| 类型 | 定义 | 例 |
|---|---|---|
| **可用性** | 成功请求 / 总请求 | 非 5xx 占比 ≥ 99.9% |
| **延迟** | 快于阈值的请求占比 | P99 < 300ms 的占比 ≥ 99% |
| **吞吐** | 单位时间处理的量 | 每秒处理订单 ≥ 1000 |
| **正确性** | 结果正确的比例 | 金额计算正确的请求占比 |
| **新鲜度** | 数据更新延迟 | 数据滞后 < 5 分钟的占比 |

**延迟 SLI 的正确写法**是「阈值内的请求占比」，而不是「平均延迟」——平均值会被长尾掩盖，而用户恰恰是被长尾伤害的。

## 三、错误预算：把可靠性变成决策机制

**错误预算 = 1 − SLO**。若 SLO 是 99.9%，则 30 天窗口内允许不可用时间为：

${F}text
30 天 = 43200 分钟
不可用预算 = 43200 × (1 - 99.9%) = 43.2 分钟
若 SLO = 99.95% → 21.6 分钟
若 SLO = 99.99%  →  4.3 分钟
${F}

**错误预算是 SRE 最有威力的机制，因为它天然定义了团队的「行为规则」**：

| 预算状态 | 含义 | 团队应该做什么 |
|---|---|---|
| **充足**（消耗 < 50%） | 系统很稳，用户满意 | **加速发布**，承担更多风险，做实验 |
| **中等**（50%–100%） | 尚可 | 正常节奏，关注趋势 |
| **耗尽**（> 100%） | 稳定性已不达标 | **冻结功能发布**，全部精力转向可靠性改进 |

**这套机制解决的核心组织问题**：让「要不要现在发布」不再靠争论，而是看预算余额。开发团队自己也希望预算充足（因为充足才能发新功能），于是**可靠性与交付速度的利益被对齐了**——这是 SRE 最精妙的设计。

**落地要点**：

- **按服务设定，不搞一刀切**。核心支付链路可以 99.99%，内部报表 99% 就够。
- **窗口滚动**（如最近 30 天），而不是「自然月清零」。滚动窗口避免「月底清零后疯狂发版」。
- **多窗口告警**（见下节）。
- **预算耗尽的后果必须真的执行**，否则机制立刻失效。

## 四、告警设计：从「指标超阈值」到「燃烧率」

**传统告警的问题**：CPU > 80% 就告警 → 大量「不需要行动」的噪音 → 值班人员开始忽略告警（告警疲劳）→ 真故障被淹没。

Google SRE 提出的原则：**告警必须对应「用户正在受影响」且「需要人立即行动」**。落地方案是**基于 SLO 的多窗口燃烧率告警（Multi-window, Multi-burn-rate）**。

**燃烧率（Burn Rate）** = 错误预算消耗速度。

${F}text
燃烧率 = 1   → 按这个速度，预算刚好在窗口期末用完（30 天）
燃烧率 = 14.4 → 预算会在约 2 天内耗尽      ← 必须立刻处理
燃烧率 = 2   → 预算会在 15 天耗尽          ← 需要关注
${F}

**官方推荐的双窗口配置**（SRE Workbook 的经典方案）：

| 严重度 | 长窗口 | 短窗口 | 燃烧率 | 消耗预算 | 处理时效 |
|---|---|---|---|---|---|
| **紧急（page）** | 1h | 5m | 14.4 | 2% | **立刻** |
| **紧急（page）** | 6h | 30m | 6 | 5% | 立刻 |
| **工单（ticket）** | 1d | 2h | 3 | 10% | 上班时处理 |
| **工单（ticket）** | 3d | 6h | 1 | 10% | 上班时处理 |

**短窗口的作用是「快速复位」**：长窗口确认「这是持续问题」，短窗口确保「问题已经结束就停止告警」，避免问题恢复后告警仍响一小时。

**Prometheus 实现示例**：

${F}yaml
groups:
  - name: slo-burn-rate
    rules:
      # 记录规则：先算 SLI
      - record: sli:http_requests:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{code!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      # 紧急：1h 长窗口 + 5m 短窗口，燃烧率 > 14.4
      - alert: ErrorBudgetBurnCritical
        expr: |
          (
            sum(rate(http_requests_total{code=~"5.."}[1h]))
            / sum(rate(http_requests_total[1h]))
          ) > (14.4 * 0.001)
          and
          (
            sum(rate(http_requests_total{code=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m]))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: critical
          slo: availability-99.9
        annotations:
          summary: "错误预算 1 小时内燃烧率 > 14.4，约 2 天内耗尽"
          runbook: "https://runbook.example.com/availability"

      # 工单：1d 长窗口 + 2h 短窗口，燃烧率 > 3
      - alert: ErrorBudgetBurnTicket
        expr: |
          (
            sum(rate(http_requests_total{code=~"5.."}[1d]))
            / sum(rate(http_requests_total[1d]))
          ) > (3 * 0.001)
          and
          (
            sum(rate(http_requests_total{code=~"5.."}[2h]))
            / sum(rate(http_requests_total[2h]))
          ) > (3 * 0.001)
        for: 1h
        labels:
          severity: ticket
${F}

**注意 ${C}(14.4 * 0.001)${C} 中的 0.001**：它来自 SLO 99.9%（允许错误率 0.1%）。这里用的是**绝对错误率阈值**而不是直接算燃烧率，两种写法等价，实际中前者更易懂。

## 五、可观测性三支柱与 OpenTelemetry

| 支柱 | 回答的问题 | 成本 | 基数 |
|---|---|---|---|
| **Metrics（指标）** | 「整体趋势如何、是否异常」 | 低（可聚合） | 低 |
| **Logs（日志）** | 「具体发生了什么」 | 高（量大） | 高 |
| **Traces（链路）** | 「请求慢在哪个环节」 | 中 | 高 |

**正确的使用顺序**：**指标发现异常 → 链路定位环节 → 日志确认原因**。反过来（从海量日志里找问题）在分布式系统里几乎不可能。

**OpenTelemetry（OTel）** 是 CNCF 的可观测性标准，统一了三件事：

${F}text
① 数据模型    指标 / 日志 / 链路共用一套语义约定（Semantic Conventions）
② 采集协议    OTLP（用 Collector 统一接收、处理、转发）
③ SDK/API     各语言统一，避免供应商锁定
${F}

${F}yaml
# OTel Collector 配置骨架（应用只发 OTLP，后端可随时换）
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

processors:
  batch: {}
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
  resource:
    attributes:
      - key: deployment.environment
        value: prod
        action: upsert
  tail_sampling:                     # 链路采样：全留错误、慢请求，普通请求按 1% 留
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 500 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }

exporters:
  otlphttp/prometheus: { endpoint: http://mimir:9009/otlp }
  loki: { endpoint: http://loki:3100/loki/api/v1/push }

service:
  pipelines:
    metrics: { receivers: [otlp], processors: [batch], exporters: [otlphttp/prometheus] }
    traces:  { receivers: [otlp], processors: [memory_limiter, tail_sampling, batch], exporters: [otlphttp/traces] }
    logs:    { receivers: [otlp], processors: [batch], exporters: [loki] }
${F}

**${C}tail_sampling${C} 是成本控制的关键**：全量保留链路成本极高，而「错误 + 慢请求全留、正常请求采样」能在保留诊断能力的同时把成本降一个量级。

**四大黄金信号**（Google SRE Book）——监控任何分布式系统的最小集合：**延迟（Latency）、流量（Traffic）、错误（Errors）、饱和度（Saturation）**。

**两类补充方法论**：

- **RED**（面向服务）：Rate、Errors、Duration —— 适合微服务/API。
- **USE**（面向资源）：Utilization、Saturation、Errors —— 适合主机、磁盘、网卡、连接池。

## 六、值班与复盘：机制而非文化口号

**值班（On-call）的官方建议**：

- **告警必须可行动**。不可行动的告警应该删除或改成工单，绝不能进 page。
- **单次值班只设一个主要轮值**，避免多套系统各自叫人。
- **限制告警量**：一个班次收到 > 2 次 page 就说明告警质量有问题（SRE Book 明确给出这个数字）。
- **值班要有补偿与上限**，否则优秀工程师会流失。
- **Runbook 必须存在且可达**：告警注解里直接给链接。

**无责复盘（Blameless Postmortem）**：

${F}text
① 影响：影响了多少用户、多久、损失多少（用数字，不用「严重」这类形容词）
② 时间线：从「第一个异常信号」到「完全恢复」，精确到分钟
③ 根因：技术根因 + 为什么没被提前发现
④ 处置：做了什么、哪些有效、哪些是运气好
⑤ 改进项：每条必须有 owner 和截止日期，且分优先级
${F}

**核心纪律**：**复盘聚焦「系统为什么允许这个错误发生」，而不是「谁犯了错」**。否则下次大家都会隐藏故障，组织失去学习能力。改进项必须闭环跟踪——**没有 follow-up 的复盘等于没做**。

## ⚠ 踩坑与误区

1. **SLO 设成 100%**：等于要求零变更，且第一次抖动就「违约」，预算机制立刻失效。
2. **SLI 从服务内部采集**：漏掉网关层失败、重试导致的放大、边缘错误。应从最靠近用户的边界采集。
3. **用平均值做延迟 SLI**：平均 50ms 掩盖了 P99 是 3 秒的事实。
4. **告警基于资源阈值（CPU > 80%）**：产生大量无需行动的噪音，导致告警疲劳。
5. **错误预算耗尽却不冻结发布**：机制一旦不执行，就退化成一句口号。
6. **全量保留日志与链路**：成本爆炸。日志要分级+采样，链路要 tail sampling。
7. **复盘只输出「加强检查」这类空话**：必须有具体、可验证、有 owner 的改进项。
8. **值班 page 用于非紧急问题**：一次深夜误报消耗的信任，比十次真实故障还多。

## ✅ 自检清单

- [ ] 每个核心服务都有明确的 SLI / SLO，且 SLO 严于对外 SLA
- [ ] SLI 从用户视角、在边缘采集，且是「阈值内占比」而非平均值
- [ ] 错误预算按滚动窗口计算，并有明确的「预算耗尽 → 冻结发布」规则
- [ ] 告警基于 SLO 燃烧率，采用多窗口（长+短）设计
- [ ] 告警区分 page 与 ticket 两级，page 一定「需要立刻人工行动」
- [ ] 可观测性三支柱齐备，且用「指标→链路→日志」的顺序排障
- [ ] 用 OTel 统一采集，链路启用 tail sampling 控制成本
- [ ] 日志有分级与采样，不是全量堆积
- [ ] 有值班机制（含告警量上限与补偿），Runbook 可从告警直达
- [ ] 每次 P1/P2 事故都做无责复盘，改进项有 owner 与截止时间并闭环

<!--dd:devops-adv-4-->

## 🔬 深挖：SLO 的数学与可观测性的关联能力

### 一、SLI 的选取：从用户旅程出发

${C}${C}${C}
不要选「CPU 使用率」当 SLI（那是资源指标，不是用户体验）
按用户旅程选（四种黄金信号）：
  ① 延迟（Latency）：成功请求的 P50/P95/P99（★ 用成功请求，失败请求的延迟没意义）
  ② 流量（Traffic）：QPS（作为分母，用于完整性与容量）
  ③ 错误（Errors）：失败请求占比（明确「什么算失败」：5xx？还是包含 4xx 业务失败？）
  ④ 饱和度（Saturation）：最关键资源的利用率（预测容量瓶颈）

SLI 的两种口径（都要明确定义）
  基于请求：good_events / valid_events（适合请求型服务，最推荐）
  基于时间窗口的可用性：可接受延迟内的请求比例
${C}${C}${C}

**SLI 定义的三个必须澄清的边界**：① 分母是什么（所有请求？排除健康检查？排除内部调用？）；② 什么算「好」（HTTP 200？还是包含业务成功？）；③ 测点在哪（边缘网关测 → 包含网络；服务内部测 → 更准但漏掉网络问题）。**不澄清这三点的 SLI 无法被一致实现**，最终变成「各团队各算一套」。

### 二、错误预算与「烧完就冻结发布」的政策

${C}${C}${C}
SLO = 99.9% → 30 天内的错误预算 = 0.1% 的时间/请求
  30 天总分钟数 43200 → 允许不可用 43.2 分钟
  或按请求算：100 万请求 → 允许 1000 个失败

政策（把数学变成行动规则，这是 SLO 真正的价值）
  预算消耗 < 50%  ：正常发布
  预算消耗 50%~100%：谨慎发布（只发修复与小改动）
  预算耗尽          ：★ 冻结功能发布，全员优先做可靠性工作
  预算还剩很多      ：可以冒险（跑压测、做重构、加快发布节奏）
${C}${C}${C}

**错误预算改变的是「决策权分配」**：它把「要不要发版」从「产品与研发的博弈」变成「由数据自动决定」——这是 SRE 最有组织价值的部分，远超监控本身。

**SLO 的两条实践建议**：
1. **从一个服务、一个 SLO 开始**（别一开始就给所有服务定 SLO，会产生大量无人维护的 SLO）；
2. **SLO 要比「实际能力」略低**（对外宣传 99.9%，内部目标 99.95%）——留出缓冲，避免 SLO 频繁破线导致团队对指标麻木。

### 三、多窗口燃烧率告警：比「阈值告警」更聪明的做法

传统阈值告警（如「5 分钟错误率 > 1%」）的问题：慢速劣化（每小时 0.2% 错误）永远不会触发阈值，但一个月下来预算被烧光。**燃烧率（burn rate）**解决这个问题：

${C}${C}${C}
burn_rate = 实际错误率 / 允许错误率
  例：SLO 99.9% → 允许错误率 0.1%
      实际 1% → burn_rate = 10（预算以 10 倍速消耗，33.6 小时烧完 30 天预算）

多窗口多燃烧率（推荐配置，宽窄结合避免误报与漏报）
  窗口 1h + 燃烧率 14.4  → 严重（2 天烧完预算）→ 立即告警（page）
  窗口 6h + 燃烧率 6     → 中度（5 天烧完）→ 工单（ticket）
  窗口 3d + 燃烧率 1     → 缓慢劣化 → 记录/复盘
  （配长窗口做「确认」，短窗口做「快速发现」，两窗同时满足才告警）
${C}${C}${C}

**为什么必须「长窗口 + 短窗口」同时满足**：只用短窗口会对瞬时抖动误报（噪音导致告警疲劳）；只用长窗口则反应太慢（已经烧了 6 小时才发现）。「短窗快发现 + 长窗确认」是多窗口燃烧率告警的核心设计。

### 四、可观测性三支柱的「关联」才是关键

${C}${C}${C}
Metrics（指标）：聚合、便宜、适合告警与趋势 —— 但不知道「是哪次请求」
Logs（日志）    ：详细、能定位原因 —— 但量大、检索慢、成本高
Traces（链路）  ：能回答「慢在哪一跳」—— 但有采样、成本与埋点成本

★ 三者的价值在于「互相跳转」：
  指标告警（错误率上升）→ 点击进入 → 看该时刻的典型 Trace → 找到慢的那一跳
                       → 从 Span 跳到该服务的日志（同 trace_id）
  这才叫「可观测」，否则只是三个独立的数据源
${C}${C}${C}

**实现关联的三个技术要点**：
1. **统一的 trace_id 贯穿全链路**（含 MQ、异步线程、定时任务）——这是关联的前提；
2. **日志里带 trace_id**（MDC / 结构化日志字段），指标告警面板上能直接跳到日志查询；
3. **指标维度可下钻**（按服务、接口、实例、版本、租户）——**「按版本标注指标」是发布期最有用的维度**（能立刻看出「新版本错误率是否更高」）。

**采样与成本**：全量 Trace 成本极高，采用「头部采样（1~10%）+ 尾部采样（错误/超时 100%）」——**保证有问题的链路一定被记录**，这是可观测性的性价比关键。

### 五、告警质量：从「谁在响」到「该不该响」

${C}${C}${C}
告警分三类（处理方式完全不同）
  ① Page（立即叫人）：用户正在受损，必须立刻处理 → 燃烧率/可用性/关键业务指标
  ② Ticket（工单）：需要处理但不紧急 → 磁盘将满、证书将过期、配额接近上限
  ③ Log（仅记录）：用于复盘与趋势 → 单实例重启、非关键降级

告警质量的两个硬指标
  信噪比（可操作性）：每条告警响起时，看的人是否清楚「该做什么」
  准确率：误报率必须低（>20% 误报就会导致麻木，最终全部忽略）
${C}${C}${C}

**必须做的三件事**：
1. **每条告警都要有「处置手册」链接**（runbook：怎么确认、怎么止血、升级路径）——没有 runbook 的告警会让 on-call 陷入研究而不是恢复；
2. **压测/演练后的告警复盘**：哪些告警没响（漏报）、哪些响得没用（噪音），持续修剪；
3. **告警数量有上限意识**：一个 on-call 班次超过 2~3 次 page 就说明系统或告警需要改进（不是「值班的人不够努力」）。

### 六、Toil、On-call 与无责复盘

${C}${C}${C}
Toil（杂务）：手动、重复、可自动化、无长期价值、随规模线性增长的工作
  例：手工扩容、手工签发证书、手工清理磁盘、逐台重启
  SRE 的目标：把 Toil 控制在 50% 以下，把时间投入到工程性改进上

On-call 的三条纪律
  ① 有明确的响应时限（SLA）与升级路径
  ② 有交接机制与「上一个班次的状态」记录
  ③ 有补偿与休整（长期被打断会导致 burnout 与离职）
${C}${C}${C}

**无责复盘（Blameless Postmortem）的三个要点**：
1. **聚焦系统而不是人**：问「为什么这个操作会难以避免地导致这个结果」（设计缺陷、缺失的护栏），而不是「谁按错了」；
2. **产出可验证的改进项**：每个改进项有负责人与截止时间，并在下次复盘中检查完成情况（**不检查的改进项等于没有**）；
3. **共享**：复盘文档要能被其他团队检索（同类系统会踩同一个坑）。

**SRE 的最终衡量不是「指标好看」，而是「变化速度与可靠性同时提升」**：如果上线频率提高了但事故也同步增加，说明可靠性工作没跟上；如果事故少了但发布变成季度一次，说明靠「冻结变更」换来的稳定，代价是业务响应能力——**错误预算机制正是为了让这两者保持动态平衡**。

## 📚 延伸阅读

- [Google SRE Book — 目录](https://sre.google/sre-book/table-of-contents/)：第 3 章（拥抱风险）、第 4 章（SLO）、第 6 章（监控）为必读
- [Google SRE Workbook](https://sre.google/workbook/table-of-contents/)：第 2 章「实现 SLO」与第 5 章「告警」有可直接照抄的燃烧率配置
- [Prometheus — Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)：录制规则与告警规则语法
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)：Collector、Semantic Conventions、各语言 SDK
- [Brendan Gregg — The USE Method](https://www.brendangregg.com/usemethod.html)：资源型问题的系统化排查方法
`
          },
          {
            id: "devops-adv-5",
            title: "平台工程与开发者平台（IDP）",
            minutes: 28,
            updated: "2026-09-16",
            applies: "Backstage / Crossplane / Argo CD / K8s Operator",
            tags: ["平台工程", "IDP", "Backstage"],
            terms: ["平台工程", "开发者平台", "Backstage", "认知负荷"],
            body: `
> **官方文档基线**：[CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) · [CNCF 平台成熟度模型](https://tag-app-delivery.cncf.io/whitepapers/platform-eng-maturity-model/) · [Backstage 文档](https://backstage.io/docs/overview/what-is-backstage) · [Kubernetes — Operator 模式](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) · [Crossplane 文档](https://docs.crossplane.io/)

## 一、为什么需要平台工程：认知负荷是真正的瓶颈

先看一个真实的团队状态：

${F}text
开发者要交付一个服务，需要面对：
  · K8s 清单怎么写（Deployment / Service / Ingress / HPA / PDB）
  · CI 流水线怎么配（3 个平台 × 2 套语法）
  · 镜像仓库怎么推、权限怎么申请
  · 域名怎么申请、TLS 证书怎么签
  · 日志怎么接、指标怎么报、告警怎么配
  · 密钥怎么拿、配置怎么改
  · 数据库怎么申请、备份策略怎么定
  · 网络策略、RBAC、安全扫描……（每个都是一套独立知识）
${F}

结果：**开发者的认知带宽被基础设施吃掉了大半，真正写业务的时间被挤压**。而每个团队还各自踩一遍相同的坑、各自维护一份「祖传脚本」。

**平台工程的定位**：把上述「横向能力」**当成一个产品来建设**，让业务团队通过**自助服务**拿到一条已经铺好的「黄金路径」。CNCF 白皮书的定义很直接：

> 平台是「一组以自助服务方式提供的、经过策划的能力集合」。

**必须避免的两个误区**：

1. **平台 ≠ Kubernetes as a Service**。给一个集群不等于给了平台，反而把复杂度推给了开发者。真正的平台要**隐藏复杂度**，不是转移复杂度。
2. **平台 ≠ 运维团队新名字**。如果平台只负责「审批工单」，那它没有解决任何问题。**核心指标是「开发者自助完成的比例」和「从想法到生产的时间」**。

## 二、平台的四个核心属性（CNCF 白皮书的框架）

CNCF 白皮书把平台拆成四个视角，这是理解平台构成的好框架：

${F}text
① 平台即产品（Platform as a Product）
     有明确用户、需求调研、路线图、SLA、弃用策略
② 平台能力（Capabilities）
     门户 / 脚手架 / CI-CD / IaC / 可观测 / 密钥 / 成本 / 安全
③ 平台界面（Interfaces）
     门户 UI、CLI、API、Git 仓库模板、ChatOps
④ 平台团队与运营（Team & Ops）
     专职团队（建议 5–10 人起步，覆盖产品+工程+布道）
${F}

**关键洞察**：**「平台即产品」是最容易被忽略、也最决定成败的一条**。多数自建平台失败的原因不是技术，而是：

- 只在「平台团队觉得爽」的地方优化，没问开发者痛点。
- 强制推行，没有迁移路径与文档。
- 半年才发一次，开发者早就绕过去了。
- 没有弃用策略，老能力永远不淘汰，维护成本线性增长。

**正确做法**：像做产品一样——**先做用户访谈，找出「开发者最痛的三件事」，先解决这三件**，做到能自助、能两分钟内上手，然后再扩张。

## 三、黄金路径（Golden Path）：有主见但不强制

**黄金路径** = 平台官方推荐、已铺好、有完整支持的那条路。

**必须遵守的原则**：

| 原则 | 说明 |
|---|---|
| **有主见（Opinionated）** | 平台给出明确默认选项，避免「配置地狱」。默认值要能直接用。 |
| **可选而非强制** | 开发者可以走别的路（用别的 CI、别的语言），但**平台只对黄金路径提供完整支持与 SLA** |
| **渐进采用** | 老服务不被强制迁移，新服务默认走黄金路径 |
| **可逃逸（Escape Hatch）** | 需要特殊能力时有明确的申请路径，别逼人绕开平台 |

**为什么不能强制**：强制会诱发「影子平台」（团队私下搭一套），反而让治理更难。**用「体验更好」吸引采用，比用「规定」逼迫采用有效得多**。

**一条典型黄金路径的形态**（用户视角）：

${F}text
① 平台门户 → 「新建服务」
② 填写：服务名、语言/框架、暴露方式（HTTP/gRPC/后台任务）、是否需要数据库
③ 平台自动完成：
     · 在 Git 创建仓库（含 Dockerfile、CI 配置、K8s 清单、CODEOWNERS）
     · 配置 CI（构建 + 测试 + 扫描 + 推镜像）
     · 注册到 Argo CD（自动创建 Application，但设为不自动 sync）
     · 创建命名空间、ResourceQuota、NetworkPolicy 基线
     · 接入日志/指标/追踪（OTel 已预置在模板里）
     · 生成域名与 TLS 证书申请
     · 在软件目录（Catalog）里登记该服务及 owner
④ 开发者只需写业务代码 + 第一个 PR 即可部署到 dev
⑤ 要上生产：在门户提「上生产」→ 自动生成生产 overlay + 走审批
${F}

**目标量化**：**从「我想做一个服务」到「dev 环境有 URL 可访问」应 ≤ 30 分钟，且全程无需找平台团队**。这个指标比任何技术指标都能说明平台的价值。

## 四、能力构成：IDP 的参考架构

${F}text
┌───────────────────────────────────────────────────────┐
│ ① 开发者门户（Portal / Catalog）                       │
│    Backstage：服务目录、脚手架、文档、SLO 看板         │
├───────────────────────────────────────────────────────┤
│ ② 脚手架与模板（Scaffolding）                          │
│    Backstage Software Templates / cookiecutter        │
├───────────────────────────────────────────────────────┤
│ ③ 供应链与制品（CI + Artifacts）                       │
│    GitHub Actions / GitLab CI → OCI Registry（含签名/SBOM）│
├───────────────────────────────────────────────────────┤
│ ④ 交付与运行时（CD + Runtime）                         │
│    Argo CD / Flux → Kubernetes + Crossplane（云资源）   │
├───────────────────────────────────────────────────────┤
│ ⑤ 配置与密钥（Config & Secrets）                       │
│    External Secrets + Vault / 云 KMS                   │
├───────────────────────────────────────────────────────┤
│ ⑥ 可观测性与 SLO（Observability）                      │
│    OTel + Prometheus/Loki/Tempo + 自动生成的 SLO 看板   │
├───────────────────────────────────────────────────────┤
│ ⑦ 治理与成本（Governance & FinOps）                    │
│    Policy as Code（Kyverno/OPA）、成本分摊与预算告警    │
└───────────────────────────────────────────────────────┘
        ↑ 所有能力都通过「界面」暴露：门户 UI / CLI / API / Git 模板
${F}

**一个重要的架构原则**：**不要试图自研所有能力**。平台团队的定位应该是**集成者与体验设计者**，而不是每个组件都自己写。绝大多数组件的成熟开源方案已经足够好，平台的价值在于「把它们串成一条顺畅的路」。

## 五、Backstage 落地要点

Backstage 是 CNCF 的开发者门户框架（Spotify 开源），核心是三块：

**① Software Catalog（软件目录）**——所有权的唯一真相源：

${F}yaml
# catalog-info.yaml（放在每个服务仓库根目录）
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-api
  description: 支付核心 API
  annotations:
    backstage.io/techdocs-ref: dir:.
    argocd/app-name: payment-api-prod          # 关联 Argo CD
    grafana/dashboard-selector: "payment-api"   # 关联监控看板
    pagerduty.com/service-id: P123ABC           # 关联值班
  tags: [java, spring-boot, tier-1]
  links:
    - url: https://runbook.example.com/payment
      title: Runbook
spec:
  type: service
  lifecycle: production
  owner: group:default/payments-team            # ← 归属明确，出问题找得到人
  system: payment-platform
  dependsOn: [component:default/payment-db]
---
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: payment-api-spec
spec:
  type: openapi
  lifecycle: production
  owner: group:default/payments-team
  definition: { \$text: https://raw.githubusercontent.com/.../openapi.yaml }
${F}

**Catalog 的真正价值**：让「这个服务谁负责、部署在哪、健康吗、文档在哪」在一个页面回答完。**这是从「口头传说的架构」到「可查询的架构」的跃迁。**

**② Software Templates（脚手架）**——把「新建服务」变成一次表单提交：

${F}yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: java-service
  title: Java 微服务（黄金路径）
spec:
  parameters:
    - title: 基本信息
      required: [name, owner]
      properties:
        name:
          type: string
          pattern: '^[a-z][a-z0-9-]{2,30}$'
        owner:
          type: string
          ui:field: OwnerPicker
          ui:options: { catalogFilter: { kind: Group } }
    - title: 能力选择
      properties:
        needsDatabase:
          type: boolean
          default: false
        exposure:
          type: string
          enum: [http, grpc, worker]
          default: http
  steps:
    - id: fetch
      action: fetch:template
      input: { url: ./skeleton, values: { name: '\${{ parameters.name }}' } }
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=myorg&repo=\${{ parameters.name }}
        defaultBranch: main
    - id: register
      action: catalog:register
      input: { catalogInfoPath: /catalog-info.yaml }
${F}

**③ TechDocs（文档）**——文档与代码同仓库（docs-as-code），门户里直接读，避免「文档散落在各处、半年后过期」。

**落地建议（循序渐进）**：

${F}text
阶段 1：先把 Catalog 建起来（把所有服务登记完，明确 owner）
        → 这一步就能立刻产生价值：谁负责、部署在哪一目了然
阶段 2：再做「新建服务」模板（选 1–2 个最主流的栈）
阶段 3：再接 TechDocs 与 SLO 看板（把「查信息」的路径缩短到一个页面）
阶段 4：最后做治理与成本（策略门禁、成本分摊）
${F}

**不要一上来就追求「大而全的门户」**——半年不出成果的平台会被组织放弃。

## 六、用 Operator / CRD 扩展 Kubernetes

当平台能力需要「声明式地表达领域概念」时，Operator 模式是标准的扩展方式。

**Operator = CRD（自定义资源）+ 控制器（调谐循环）**。官方定义的核心是「把运维知识编码进软件」：

${F}yaml
# 一个平台自研的 CRD：让开发者用「业务语言」申请数据库
apiVersion: platform.example.com/v1
kind: AppDatabase
metadata:
  name: payment-db
  namespace: payments
spec:
  engine: postgres
  version: "16"
  size: medium
  highAvailability: true
  backup:
    schedule: "0 2 * * *"
    retentionDays: 30
${F}

控制器监听 ${C}AppDatabase${C}，然后自动创建：

${F}text
AppDatabase
   ↓ controller 调谐
├─ 云厂商 RDS 实例（通过 Crossplane 或云 SDK）
├─ K8s Secret（连接串，写入 Vault 再同步）
├─ NetworkPolicy（只允许 payments 命名空间访问）
├─ 备份策略（定时任务 + 保留策略）
└─ 状态回写到 .status（开发者 kubectl get 就能看到连接信息）
${F}

**这样开发者面对的接口从「20 个云控制台页面」变成一个 5 行的 YAML**。这就是平台工程「隐藏复杂度」的具体含义。

**Crossplane** 是「用 K8s API 管云资源」的成熟实现，提供 Composition 能力，能把「一套合规的云资源组合」固化成可复用的定义（与 ClusterClass 的思路一致）。**选型建议**：团队已有较强的 K8s 能力 → Crossplane + 自研 CRD；团队更偏云原生化 → 先用 Terraform + 平台层封装（在 CI 里跑 Terraform，开发者不直接接触）。

## 七、度量平台成效：别用「平台功能数」

平台工程的度量必须指向「开发者体验」，而不是「平台做了多少功能」。

**推荐的度量组合**：

| 维度 | 指标 | 目标方向 |
|---|---|---|
| **采用度** | 走黄金路径新建服务的比例 | ↑ |
| **自助率** | 无需平台团队介入即完成的变更比例 | ↑ |
| **前置时间** | 从「新建服务」到「dev 可访问」 | ≤ 30 分钟 |
| **交付效能** | DORA 四指标（部署频率/前置时间/失败率/MTTR） | 全面改善 |
| **开发者体验** | 定期 NPS / 满意度调查，含「最痛的下一步」开放题 | ↑ |
| **平台可靠性** | 平台自身 SLO（门户可用性、CI 成功率、Argo CD sync 成功率） | ≥ 99.9% |
| **维护成本** | 平台团队人力 / 服务数量（应逐步下降） | ↓ |

**必须避免的反模式**：

- 用「平台功能数量」「API 数量」当 KPI —— 会催生没人用的功能。
- 只看采用度不看满意度 —— 强制推行的采用度是假的。
- 不度量平台自身的可靠性 —— 平台挂了全公司阻塞，它必须自己有 SLO。

## ⚠ 踩坑与误区

1. **平台 ≠ 一堆工具堆在一起**：没有统一的入口与体验，等于把复杂度换了个地方。**集成与体验才是平台的核心工作。**
2. **强制推行**：催生影子平台，治理更难。用体验吸引，不用规定逼迫。
3. **没有 owner 机制**：平台没人负责，半年后无人维护，开发者被迫绕开。
4. **自研一切**：重复造 Backstage / Argo CD / Vault。平台团队应聚焦「集成与体验」，通用组件优先用成熟开源。
5. **一上来做大而全**：半年不出成果 → 失去信任 → 被砍。**先做最痛的三件事，快速交付可见价值。**
6. **黄金路径没有 Escape Hatch**：特殊需求无处安放，开发者必然绕开平台。
7. **忽略平台自身的可靠性**：平台是全公司的关键路径，它挂了比单个业务服务挂掉影响更大。
8. **门户只做展示不做操作**：Catalog 只能看不能做，开发者仍要去十几个系统里操作，价值大打折扣。
9. **不度量就宣称成功**：用「开发者等了多久」「找平台团队几次」这类可量化指标验证，而不是感觉。

## ✅ 自检清单

- [ ] 能说清「平台 ≠ K8s as a Service」「平台 ≠ 运维团队改名」两个误区
- [ ] 有明确的平台用户与需求来源（访谈、NPS、支持工单分析）
- [ ] 定义了黄金路径，做到「有主见、可选、可逃逸」
- [ ] 有可量化的目标：从零到 dev 可访问 ≤ 30 分钟、自助率提升
- [ ] 平台能力覆盖门户/脚手架/CI/CD/配置密钥/可观测/治理成本六大块
- [ ] 有软件目录（Catalog）且每个服务都有明确 owner
- [ ] 平台自身有 SLO，且有值班与降级方案
- [ ] 用 DORA + 开发者满意度度量成效，不用功能数量
- [ ] 需要领域抽象时用 Operator / Crossplane 把运维知识编码进 CRD
- [ ] 采用是「渐进」的：新服务默认走黄金路径，老服务不强制迁移

<!--dd:devops-adv-5-->

## 🔬 深挖：平台即产品与 Golden Path

### 一、平台工程的本质：把「组织知识」变成「默认路径」

${C}${C}${C}
平台解决的问题（按优先级）
  ① 认知负荷：开发者要懂 K8s/YAML/网络/安全/观测 → 太多非业务知识
  ② 一致性：每个团队各搭一套 → 安全与可靠性参差不齐（出事的那套拖累全部）
  ③ 交付速度：每上新服务要重做 CI/CD/监控/告警/日志
  ④ 合规与安全：要求靠人记 → 必然遗漏

平台的答案：Golden Path（黄金路径）
  一条「被铺好的、有支持的、默认正确」的路
  ★ 关键：「有支持的」——走出黄金路径要自担成本（但不禁止，保留灵活性）
${C}${C}${C}

**Golden Path 与「强制标准」的区别**：强制标准（只能用我们的方式）会引发绕过与对抗（尤其在快速迭代的业务压力下）；Golden Path 是「**默认最省事**」——用它 30 分钟上线一个带 CI/CD、监控、告警、日志、安全扫描的服务；不用它则要自己搭这一切。**用「省事」而不是「禁止」来驱动采纳，是平台成败的分水岭。**

### 二、平台的抽象层级：过度抽象与抽象不足

${C}${C}${C}
抽象层次（从低到高）
  L0：给 K8s 集群 + 文档（最灵活，认知负荷最高）
  L1：给 Helm Chart / Kustomize 模板（半自助）
  L2：给「应用 CRD」+ 平台控制器（如 kind: WebService，平台负责 Deployment+Service+Ingress+HPA+监控）
  L3：给「服务目录 + 一键创建」（如 Backstage 脚手架 + 平台托管）
  L4：完全黑盒 PaaS（最省事，但对特殊需求毫无办法）

抽象过度（L4）的代价
  业务需要「自定义探针 / 特殊调度 / sidecar」时无路可走
  → 最终逼业务绕过平台自己搞一套 → 平台失去意义

抽象不足（L0/L1）的代价
  每个团队重复解决同样的问题，安全与观测参差不齐
  → 平台团队沦为「答疑窗口」而不是「能力提供者」
${C}${C}${C}

**推荐策略：默认抽象到 L2，同时「保留逃生舱」（escape hatch）**——应用 CRD 里直接暴露底层的 ${C}podTemplate${C} 覆盖点，让特殊需求不必绕过平台。**判断抽象是否合适的标准：80% 的常见需求用默认值即可，20% 的特殊需求不需要走出平台。**

### 三、Backstage：软件目录与脚手架

${C}${C}${C}
Backstage 的三块能力（可分别采用）
  ① Software Catalog（软件目录）：catalog-info.yaml 描述「谁拥有什么服务、依赖谁、文档在哪」
     → 解决「服务台账散落在各团队 wiki」的问题
     → 打通「这个服务谁负责」的最后一公里（告警时能 @ 到人）
  ② Software Templates（脚手架）：一键生成项目（含 CI/CD、监控、告警、README、CODEOWNERS）
     → 把「新服务的正确做法」固化
  ③ TechDocs：文档即代码（Markdown 在仓库里，与代码同版本）
     → 文档不会过期（不会出现「wiki 说的是三年前的架构」）

★ 真正让平台「活」起来的是「目录 + 模板 + 自动化插件」三者的联动：
   从模板创建服务 → 自动注册到目录 → 自动开通仓库/流水线/监控 → 自动加告警与 owner
${C}${C}${C}

**落地顺序建议**：**先做「目录」（成本低、收益立刻可见，且是其他能力的基础）→ 再做「模板」→ 最后做「插件生态集成」**。很多团队一上来就做插件集成（看起来很酷），结果目录不全，所有能力都缺「主语」。

### 四、平台的度量：别用「平台功能数」衡量

${C}${C}${C}
无效指标（反模式）
  ✗ 平台有多少个功能 / 插件
  ✗ 平台团队交付了多少个 PR
  ✗ 有多少团队「必须」用平台

有效指标（结合 DORA）
  ✓ 采纳率：多少个服务/团队在用 Golden Path（目标：新服务 100% 默认走它）
  ✓ 自助率：常见操作（建环境、看日志、发布、回滚）有多少是自助完成的
  ✓ 交付前置时间：从代码提交到生产的时长（平台应让它下降）
  ✓ 认知负荷：新成员独立上线一个服务的耗时（平台应让它下降）
  ✓ 支持负担：平台团队每周处理的人工请求数（应随平台成熟而下降，而不是上升）
  ✓ 安全合规默认达成率：新服务自动满足基线的比例（如「100% 新服务默认有告警」）
${C}${C}${C}

**「支持负担」是最诚实的指标**：如果平台上线半年后平台团队还在疲于回答同样的临时请求，说明**能力没有真正沉淀为自助服务**，平台只是变成了新的瓶颈。

### 五、平台团队的组织与反模式

| 反模式 | 表现 | 后果 |
|---|---|---|
| **平台即瓶颈** | 所有变更要平台团队执行 | 交付变慢，业务绕过平台 |
| **平台即警察** | 只做审批与规范检查 | 业务对抗，走地下流程 |
| **平台即项目** | 一次性交付后无人维护 | 半年后平台与生态脱节，被弃用 |
| **无产品经理** | 平台团队按自己的技术偏好建设 | 做出来的东西没人用 |
| **不接触用户** | 从不访谈内部开发者 | 解决的是想象的问题 |

**正确的组织形态**：**平台团队 = 内部产品团队**，需要：产品经理（理解内部用户需求与优先级）、开发者体验（DX）角色、SRE/基础架构工程师、以及**定期的用户研究**（访谈、观测真实使用数据、跟踪「绕过平台」的行为——**绕过行为是最有价值的信号**，它直接告诉你痛点在哪）。

**平台与应用的边界**：平台负责「**横切能力**」（CI/CD、部署、观测、网络、密钥、安全基线、目录），应用团队负责「**业务逻辑与业务可用性**」。**边界模糊会导致双方都不负责**——例如「告警规则谁定」：平台提供机制与默认规则，应用负责业务告警的阈值。

**最后一点认知**：平台工程不是「买个工具装上」。Backstage 装起来一天，让目录真实完整需要一年（需要推动每个团队填 owner 与依赖）。**平台的成功 20% 靠技术、80% 靠组织推动与持续运营**——这也是为什么「平台团队要有产品思维」不是一句口号，而是落地成败的关键。

## 📚 延伸阅读

- [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)：平台的定义、属性、能力清单，本节框架的主要来源
- [CNCF 平台工程成熟度模型](https://tag-app-delivery.cncf.io/whitepapers/platform-eng-maturity-model/)：自查你的平台在哪个阶段，以及下一步该做什么
- [Backstage 官方文档](https://backstage.io/docs/overview/what-is-backstage)：Catalog / Templates / TechDocs 的实现细节
- [Kubernetes Operator 模式](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)：官方对 Operator 的定义与实现方式
- [Crossplane 文档](https://docs.crossplane.io/)：用 K8s API 管理云资源的 Composition 模型
`
          }
        ]
      }
    ]
  };

  window.DEVOPS = DEVOPS;
})();
