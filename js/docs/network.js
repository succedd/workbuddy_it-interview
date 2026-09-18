/* =========================================================================
 *  js/docs/network.js — 技术教程「网络与操作系统」方向数据
 *
 *  编写基线（目录骨架取自官方文档，正文按官方目录逐节展开）：
 *    · RFC 1122 / 9293              Internet Hosts 要求 / TCP 规范
 *    · RFC 791 / 8200               IPv4 / IPv6
 *    · RFC 792 / 4443               ICMPv4 / ICMPv6
 *    · RFC 826                      ARP
 *    · RFC 1034 / 1035              DNS 概念与实现
 *    · RFC 9110 / 9111 / 9112 / 9113  HTTP 语义 / 缓存 / HTTP1.1 / HTTP2
 *    · RFC 9000 / 9001 / 9002       QUIC / TLS over QUIC / 丢包检测
 *    · RFC 8446                     TLS 1.3
 *    · RFC 2131 / 8415              DHCPv4 / DHCPv6
 *    · RFC 5681 / 6298 / 8312       TCP 拥塞控制 / RTO 计算 / CUBIC
 *    · Linux man-pages (man7.org)   socket(7) tcp(7) ip(7) epoll(7) pipe(7) signal(7) sched(7) proc(5)
 *    · CSAPP《深入理解计算机系统》 / TLPI《Linux/UNIX 系统编程手册》
 *
 *  风格：原理与底层机制 → 规范与标准 → 实战（脆弱 vs 正确）→ 覆盖广度 → 误区 → 自检 → 延伸。
 *  正文为 Markdown，复用站点 marked + highlight.js。
 *  代码围栏用 ${F}、行内代码用 ${C} 表示反引号，避免与外层模板字符串冲突。
 *  ⚠ shell 变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ${F}
  const C = "\u0060";               // 行内代码 ${C}

  const NETWORK = {
    id: "network",
    name: "网络与操作系统",
    icon: "🌐",
    desc: "所有技术方向的共同地基：数据怎么在网络上跑（TCP/IP、HTTP、TLS、DNS/CDN）、进程怎么被调度、内存怎么管、IO 怎么等待。这一层通透了，上层问题一眼看穿。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "建立完整的基础认知：分层模型与端到端原则、HTTP 语义与状态码、进程/线程/协程的区别、虚拟内存与用户态/内核态。",
        chapters: [
          {
            id: "tcp-ip-model",
            title: "计算机网络体系与 TCP/IP",
            minutes: 22,
            updated: "2026-09-17",
            applies: "TCP/IP 协议族（IPv4 / IPv6）",
            tags: ["网络", "TCP/IP", "模型", "分层"],
            terms: ["TCP", "IP", "网络", "协议"],
            body: `
> **官方文档基线**：[RFC 1122 Internet Hosts](https://www.rfc-editor.org/rfc/rfc1122) · [RFC 9293 TCP](https://www.rfc-editor.org/rfc/rfc9293) · [RFC 791 IPv4](https://www.rfc-editor.org/rfc/rfc791) · [RFC 8200 IPv6](https://www.rfc-editor.org/rfc/rfc8200) · [RFC 826 ARP](https://www.rfc-editor.org/rfc/rfc826) · [man7: ip(7)](https://man7.org/linux/man-pages/man7/ip.7.html)

## 一、原理与底层机制

### 1.1 分层的本质：关注点分离
网络通信要同时解决四类彼此独立的问题——**物理信号怎么传、跨网络怎么找路、丢了怎么补、应用怎么对话**。分层就是把这些问题分给不同层，每层只依赖下层提供的服务、只向上层暴露接口。这样「换链路技术（以太网 → Wi-Fi → 5G）不动上层」才成为可能。记住一句话：**层与层之间是契约关系，不是实现细节的堆叠**。

### 1.2 端到端原则（End-to-End Principle）
RFC 1122 的哲学内核：**凡是能放到两端实现的可靠性，就不要塞进网络中间层**。所以路由器只做「尽力而为（best-effort）」转发，不保证送达；不丢、不重、按序，全部由两端的 TCP 负责。正因网络核心足够「傻」，互联网才能从几台机器扩到几十亿设备——**智能在边缘，简单在核心**。

### 1.3 封装与解封装
发送时逐层加头，接收时逐层剥头，**每层的头只被同层解读**（路由器只看 IP 头，交换机只看 MAC 头）：

${F}text
应用数据   GET / HTTP/1.1
  +TCP 头  [源端口 50123 · 目的端口 80 · 序号/确认号 · 窗口]
= TCP 段
  +IP 头   [源 192.168.1.10 · 目的 93.184.216.34 · TTL 64 · 协议号 6]
= IP 包
  +以太网头 [源 MAC · 目的网关 MAC · 类型 0x0800]
= 帧  →  物理介质
${F}

### 1.4 IP 与端口：地址的两级定位
- **IP** 定位「哪台机器」，网络层；IPv4 共 32 位（约 43 亿，早已耗尽），IPv6 128 位。
- **端口** 定位「机器上的哪个进程」，传输层；0–1023 知名端口（22/80/443），1024–49151 注册端口，其余动态端口。
- **MAC** 定位「同一链路内的哪块网卡」，仅链路层有效，跨网段会被网关重写。

## 二、规范与标准

- **RFC 1122** 规定联网主机必须实现的协议行为，是主机的「合格线」。
- **CIDR（RFC 4632）**：用 ${C}192.168.1.0/24${C} 表示「地址 + 前缀长度」，取代有类地址。
- **私有地址（RFC 1918）**：${C}10.0.0.0/8${C}、${C}172.16.0.0/12${C}、${C}192.168.0.0/16${C} 仅限内网，出公网须 NAT。
- **特殊地址**：${C}127.0.0.1${C} 回环（走本机协议栈，不经网卡）；${C}0.0.0.0${C} 作监听地址=所有网卡、作目地址=本机/默认路由；${C}169.254.0.0/16${C} 链路本地（DHCP 失败时自分配）。
- **MTU（RFC 1191）**：以太网默认 1500 字节，超长则 IP 分片；分片显著伤性能且易被中间设备丢弃，现代做法是**路径 MTU 发现 + 不分片**。

## 三、实战

${F}bash
# 1) 本机监听了哪些端口（谁在听、绑在哪个地址）
ss -lntp

# 2) 路由表：数据包下一跳去哪（default via = 默认网关）
ip route

# 3) 网卡地址与状态（169.254.x.x 说明 DHCP 失败）
ip -4 addr show

# 4) 邻居表（ARP 解析结果）：IP ↔ MAC 映射
ip neigh

# 5) 逐跳看走了哪些路由器（定位跨网段问题）
traceroute -n 93.184.216.34

# 6) 连通性与抖动持续观测（看哪一跳开始丢包）
mtr -n 93.184.216.34
${F}

**服务绑地址的差异（最常翻车点）**：
${F}conf
# ❌ 只绑回环：只有本机能连，容器 / 远程 / 负载均衡都连不上
listen 127.0.0.1:8080;

# ✅ 绑所有网卡：容器、其他主机、LB 都能连（对外网关一般这样）
listen 0.0.0.0:8080;

# ✅ 更安全：只绑内网网卡，避免暴露在公网
listen 10.0.3.7:8080;
${F}

## 四、覆盖广度

- **NAT（RFC 3022）**：私网 ↔ 公网地址转换。SNAT 改写源（出网），DNAT 改写目的（端口映射）。NAT 让 IPv4 续命，但破坏了端到端透明性——外网主动连内网必须端口映射。
- **IPv4 → IPv6 过渡**：双栈（同跑两套）、隧道（6to4 / DS-Lite）、转换（NAT64 + DNS64）。IPv6 无 NAT、无广播、支持地址自配置（SLAAC）。
- **ICMP（RFC 792）**：网络层差错与控制报文，不是传输协议。${C}ping${C} 用 Echo，${C}traceroute${C} 靠 TTL 递减触发超时。很多云安全组默认禁 ICMP，造成「ping 不通但能连」。
- **ARP（RFC 826）**：同网段「已知 IP 求 MAC」。跨网段时你解析的不是目标主机的 MAC，而是**网关**的 MAC。

## 五、常见误区

1. **把 localhost / 127.0.0.1 / 0.0.0.0 混为一谈**：localhost 通常解析到 127.0.0.1（仅回环），0.0.0.0 是「所有网卡」。监听地址选错是「本地能连、别人连不上」的头号原因。
2. **以为 ping 通就等于服务可用**：ping 只验证 ICMP/网络可达，与端口、应用存活无关；反之禁 ICMP 会让人误判「网络不通」。
3. **把私网 IP 当公网用**：192.168 / 10 / 172.16 段出公网必须 NAT，直接绑无法被外网访问。
4. **以为 TCP「连接」是根实线**：IP 层无连接，TCP 连接只是两端状态机的共识；链路断了但双方未超时前不会「立刻感知」。
5. **查端口不通的顺序反了**：应先 ${C}ss -lntp${C} 确认进程真在听，再查安全组 / 防火墙，反过来会白折腾。

## 六、自检清单

- [ ] 能画出一次 HTTP 请求的分层封装路径，并说出每层头部
- [ ] 能解释「端到端原则」为什么让核心网络保持简单
- [ ] 能说清 127.0.0.1 / 0.0.0.0 / 192.168.x.x / 169.254.x.x 的区别
- [ ] 会按「DNS → 监听端口 → 路由 → 链路」的顺序定位连通性问题
- [ ] 知道 MTU 分片为何伤性能、路径 MTU 发现解决什么问题

## 七、延伸

- 精读 RFC 1122 第 1 章（分层模型与设计哲学），理解分层不是教条而是权衡。
- CSAPP 第 11 章「网络编程」：从 socket 视角重看这一层。
- 进阶：读 Linux ${C}net/ipv4/${C} 源码，跟一个包从 ${C}ip_rcv${C} 到 socket 队列的真实路径。
`
          },
          {
            id: "http-detail",
            title: "HTTP 协议详解",
            minutes: 24,
            updated: "2026-09-17",
            applies: "HTTP/1.1 · HTTP/2 · HTTP/3",
            tags: ["HTTP", "协议", "Web", "缓存"],
            terms: ["HTTP", "状态码", "请求", "Web"],
            body: `
> **官方文档基线**：[RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) · [RFC 9111 HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111) · [RFC 9112 HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112) · [RFC 9113 HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) · [RFC 9000 QUIC](https://www.rfc-editor.org/rfc/rfc9000) · [MDN HTTP](https://developer.mozilla.org/docs/Web/HTTP)

## 一、原理与底层机制

### 1.1 请求-响应模型与「无状态」的真意
HTTP 是请求-响应式的**无状态**协议：服务端不记得上一次请求。这不是缺陷而是**可扩展性的前提**——正因为无状态，一台服务器扛不住时，加机器就能水平扩展，任何一台都能处理任意请求。会话状态由客户端自己携带（Cookie / Token），服务端只做校验。

### 1.2 方法语义：安全性与幂等性
RFC 9110 给每个方法规定了两个正交属性：
- **安全性（safe）**：不改变服务端状态（GET/HEAD/OPTIONS/TRACE）。安全方法可被爬虫、预取、缓存随意调用。
- **幂等性（idempotent）**：执行一次与执行 N 次效果相同（GET/PUT/DELETE/HEAD）。幂等方法可以**安全重试**；POST 不幂等，重试可能重复下单。

### 1.3 报文结构
${F}http
GET /api/orders/42 HTTP/1.1\r\n     ← 起始行：方法 + 目标 + 版本
Host: shop.example.com\r\n          ← 头字段（大小写不敏感）
Accept: application/json\r\n
\r\n                                 ← 空行分隔头与体
（GET 无体；POST/PUT 的体在这里）
${F}

### 1.4 连接管理与三代演进
| 版本 | 传输层 | 关键机制 | 遗留问题 |
|---|---|---|---|
| HTTP/1.0 | TCP | 每请求一连接 | 建连开销大 |
| HTTP/1.1 | TCP | keep-alive 复用、流水线 | **应用层队头阻塞**（前一个响应不发完，后面排队） |
| HTTP/2 | TCP | 二进制分帧、多路复用、HPACK 头压缩、服务端推送 | **TCP 层队头阻塞**（一个丢包卡住所有流） |
| HTTP/3 | QUIC(UDP) | 流独立、0-RTT 恢复、连接迁移 | 部署复杂度、部分中间设备不识别 |

## 二、规范与标准

- **状态码五大类**：1xx 信息（100 Continue、101 Switching Protocols）、2xx 成功、3xx 重定向、4xx 客户端错、5xx 服务端错。
- **缓存语义（RFC 9111）**：${C}Cache-Control: max-age / no-store / no-cache / private / public / must-revalidate${C}；${C}ETag${C} + ${C}If-None-Match${C} → 304；${C}Last-Modified${C} + ${C}If-Modified-Since${C}。
- **条件请求与范围请求**：${C}If-None-Match${C} 命中返回 304（不传体，省带宽）；${C}Range: bytes=0-1023${C} 支持断点续传与视频拖动。
- **内容协商**：${C}Accept${C} / ${C}Accept-Encoding${C} / ${C}Accept-Language${C} 决定表示形式；${C}Content-Type: application/json; charset=utf-8${C} 明确体格式。
- **Cookie 安全属性（RFC 6265）**：${C}HttpOnly${C}（禁 JS 读取，防 XSS 窃取）、${C}Secure${C}（仅 HTTPS）、${C}SameSite=Lax/Strict${C}（防 CSRF）、${C}Path${C}/${C}Domain${C} 作用域。

## 三、实战

${F}bash
# 完整看一次请求的过程（分段、头、状态码）
curl -v https://example.com/

# 只看响应头（关注 Cache-Control / ETag / Content-Encoding）
curl -sI https://example.com/

# 带条件请求（模拟缓存命中 → 期待 304）
curl -sI -H "If-None-Match: \\"abc123\\"" https://example.com/

# 断点续传
curl -r 0-1023 -o part.bin https://example.com/big.iso
${F}

**正确的缓存策略（脆弱 vs 正确）**：
${F}http
# ❌ 只靠默认：接口被中间代理乱缓存，串数据
HTTP/1.1 200 OK
Content-Type: application/json

# ✅ 接口：显式不缓存
Cache-Control: no-store, no-cache, must-revalidate
# ✅ 静态资源带指纹：长缓存 + immutable
Cache-Control: public, max-age=31536000, immutable
ETag: "v3-abc"
${F}

**HTTP 客户端必须设超时**（否则下游慢会拖死整个线程池）：
${F}java
RequestConfig cfg = RequestConfig.custom()
    .setConnectTimeout(1000)          // 建连超时
    .setConnectionRequestTimeout(500) // 从连接池取连接超时
    .setSocketTimeout(3000)           // 读超时（响应间隔）
    .build();
${F}

## 四、覆盖广度

- **重试与幂等**：只有幂等方法（GET/PUT/DELETE）可无脑重试；POST 要重试必须用**幂等键（Idempotency-Key）**或去重表。
- **压缩**：${C}Accept-Encoding: gzip, br, zstd${C}；Brotli 通常比 gzip 小 15%–20%，对文本资源显著。
- **CORS 预检**：跨域且非简单请求会先发 ${C}OPTIONS${C}，服务端必须回 ${C}Access-Control-Allow-Origin/Methods/Headers${C}，否则浏览器拦截。
- **状态码运维语义**：401 = 未认证（该带凭据），403 = 已认证但无权限，404 = 资源不存在，429 = 限流（看 ${C}Retry-After${C}），502 = 网关连不上后端，503 = 过载/维护，504 = 上游超时。
- **HTTP/2 关键点**：一个 TCP 连接承载多个流（stream），流有优先级；头用 HPACK 压缩（首部表 + 哈夫曼），但**一个 TCP 丢包会阻塞所有流**——这正是 HTTP/3 改用 QUIC 的动机。

## 五、常见误区

1. **GET 带体 / 用 GET 做变更**：GET 可能被缓存、预取、记入日志，绝不可做写操作或传敏感数据。
2. **分不清 401 与 403**：401 是「没证明你是谁」，403 是「证明了但你没权限」；401 应带 ${C}WWW-Authenticate${C}。
3. **把 502/504 当业务异常处理**：它们多数是网关/依赖问题（后端挂、上游慢），应先查依赖，别只改业务代码。
4. **客户端不设超时**：没有 connect/read timeout，下游慢时线程被占满，故障从下游蔓延到上游。
5. **忽视 304 / 缓存**：做好的缓存本可 304 省掉整包，结果每次 200 全量返回，带宽和延迟双输。
6. **改静态资源不加版本**：同名文件被缓存后改了不生效，必须用「文件名带 hash」或版本 query 破缓存。

## 六、自检清单

- [ ] 能说出 GET/POST/PUT/PATCH/DELETE 的安全性与幂等性
- [ ] 能区分 401/403 与 502/503/504 并给出排查方向
- [ ] 会给接口与静态资源分别设计合理的 Cache-Control
- [ ] 知道 HTTP/1.1→2→3 各解决了什么、又留下什么
- [ ] 每次写 HTTP 客户端都强制设置 connect/read 超时

## 七、延伸

- 通读 RFC 9110 的「Methods」与「Status Codes」两章，建立权威语义认知。
- 阅读「HTTP/2 中的 TCP 队头阻塞」相关分析，理解 HTTP/3 的设计动机。
- 实践：用 ${C}curl --http2${C} / ${C}curl --http3${C} 对比同站点在不同版本下的握手与耗时。
`
          },
          {
            id: "process-thread",
            title: "进程与线程",
            minutes: 22,
            updated: "2026-09-17",
            applies: "Linux / POSIX 通用概念",
            tags: ["进程", "线程", "OS", "并发"],
            terms: ["进程", "线程", "并发"],
            body: `
> **官方文档基线**：[man7: fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) · [clone(2)](https://man7.org/linux/man-pages/man2/clone.2.html) · [pthreads(7)](https://man7.org/linux/man-pages/man7/pthreads.7.html) · [sched(7)](https://man7.org/linux/man-pages/man7/sched.7.html) · [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html) · [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) · CSAPP 第 8/12 章 · TLPI

## 一、原理与底层机制

### 1.1 进程是资源容器，线程是调度单位
- **进程**：拥有独立虚拟地址空间、文件描述符表、信号处理表、进程 ID。进程之间默认互不可见，通信必须走 IPC，成本高。
- **线程**：同一进程内的执行流，**共享地址空间与文件描述符**，只各自持有栈、寄存器、线程局部存储（TLS）。切换便宜，但一处崩溃可能拖垮整个进程。

一句话：**进程是「分资源」的单位，线程是「抢 CPU」的单位**。

### 1.2 进程的内存布局
${F}text
高地址  ┌──────────────┐
       │  栈 stack     │ ← 局部变量、返回地址（向下增长，默认 8MB）
       ├──────────────┤
       │  mmap 区      │ ← 动态库、文件映射、大块 malloc
       ├──────────────┤
       │  堆 heap      │ ← malloc/new（向上增长）
       ├──────────────┤
       │  BSS / Data   │ ← 全局/静态变量
       ├──────────────┤
       │  Text (代码)   │ ← 只读、可共享
低地址  └──────────────┘
${F}

### 1.3 线程共享什么、独享什么
| 共享（进程级） | 独享（线程级） |
|---|---|
| 地址空间、堆、全局变量 | 栈、寄存器、程序计数器 |
| 文件描述符表 | 线程 ID、errno |
| 信号处理函数 | 信号屏蔽字、优先级 |
| 当前工作目录 | 线程局部存储 TLS |

### 1.4 上下文切换的真实成本
线程切换要保存/恢复寄存器与栈指针；进程切换还要**换页表（CR3）**，导致 TLB 失效、CPU 缓存污染。所以**线程不是越多越好**：超过核数后，大量时间耗在切换与锁等待上，吞吐反而下降——这正是线程池存在的理由。

### 1.5 并发 vs 并行
- **并发（concurrent）**：多个任务交替推进，宏观同时、微观分时；单核即可实现。
- **并行（parallel）**：多个任务真正同时执行，必须多核。

写代码时**不要把「并发」当「并行」假设**，否则会出现只在单核上偶现的竞态。

## 二、规范与标准

- **进程创建（POSIX）**：${C}fork()${C} 复制当前进程（COW），${C}execve()${C} 替换映像，${C}wait()/waitpid()${C} 回收子进程。Linux 上创建线程其实也是 ${C}clone()${C}，只是共享标志不同。
- **调度策略（sched(7)）**：${C}SCHED_OTHER${C}（CFS 默认，按权重公平）、${C}SCHED_FIFO${C}/${C}SCHED_RR${C}（实时，抢占普通任务）、${C}SCHED_IDLE/BATCH${C}。
- **信号（signal(7)）**：异步通知机制，${C}SIGTERM${C}（可捕获，优雅退出）、${C}SIGKILL${C}（不可捕获，强杀）、${C}SIGSEGV${C}（段错误）、${C}SIGPIPE${C}（写已关闭管道）。
- **线程库**：${C}pthread_create/join${C}，同步原语互斥量、条件变量、读写锁、屏障。

## 三、实战

${F}bash
# 查看进程与线程：-T 显示线程，-eLf 列出所有线程
ps -eLf | grep myapp
top -H -p <pid>            # 按线程看 CPU（找出哪个线程吃满）
htop                       # 交互式，可按 H 切到线程视图

# 单进程的线程数（Threads 行）
grep -E "Threads|VmRSS" /proc/<pid>/status

# 观察线程创建：clone 系统调用
strace -f -e trace=clone,execve ./app

# 绑核运行（减少跨核缓存同步开销）
taskset -c 0-3 ./app

# 统计上下文切换
vmstat 1                   # cs 列 = 每秒上下文切换次数
${F}

**正确的并发写法（脆弱 vs 正确）**：
${F}java
// ❌ 竞态：多线程自增不是原子操作（读-改-写）
class Bad { int n = 0; void inc() { n++; } }

// ✅ 原子类 / 加锁
class Good { AtomicInteger n = new AtomicInteger(); void inc() { n.incrementAndGet(); } }

// ✅ IO 密集用虚拟线程（JEP 444），海量并发而不耗线程
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var task : tasks) exec.submit(task);
}
${F}

## 四、覆盖广度

- **僵尸与孤儿进程**：子进程退出但父进程未 ${C}wait${C} → 僵尸（占 PID 表项）；父进程先死 → 孤儿进程被 init/systemd 收养。大量僵尸说明父进程没回收。
- **IPC 方式对比**：
| 方式 | 特点 | 适用 |
|---|---|---|
| 管道 / FIFO | 半双工、字节流 | 父子进程简单通信 |
| 共享内存 | 最快，需自行同步 | 高频大数据量 |
| 消息队列 | 有边界、内核缓冲 | 解耦、异步 |
| 信号 | 异步、信息量极小 | 通知 |
| socket | 可跨主机 | 通用，网络/本机均可 |
- **协程/虚拟线程**：Go goroutine、Java 虚拟线程（Project Loom）、Python asyncio，都是**用户态调度**，栈小（KB 级）、切换不进内核，单进程可跑数十万；写法仍是同步风格，心智负担低。
- **cgroup 限制**：容器里 ${C}nproc${C}、CPU quota、线程数上限都会影响并发能力，别只看核数。

## 五、常见误区

1. **以为多线程必然更快**：单核 + 激烈锁竞争下，多线程反而更慢（切换 + 等待锁）。
2. **共享可变状态不加同步**：竞态导致结果随机错乱，且往往只在生产高并发时偶现。
3. **线程数不设上限**：无脑 ${C}new Thread${C}，上下文切换把 CPU 吃满、内存被栈撑爆。
4. **混淆并发与并行**：按并行假设写逻辑，在单核容器里出错。
5. **跨进程当共享内存读**：进程间不能直接读对方内存，必须走 IPC。
6. **用 SIGKILL 代替优雅退出**：${C}SIGKILL${C} 不给清理机会，可能丢数据或留下不一致状态。

## 六、自检清单

- [ ] 能说清进程与线程在资源上的差别（共享/独享）
- [ ] 能画出进程地址空间布局并定位栈溢出/OOM 各发生在哪
- [ ] 线程数设定能区分 CPU 密集（≈核数）与 IO 密集（适当放大）
- [ ] 会用 ${C}top -H${C} / ${C}vmstat${C} 观察线程与上下文切换
- [ ] 知道僵尸进程的成因与处置，会捕获 SIGTERM 优雅退出

## 七、延伸

- 精读 TLPI 第 24–33 章（进程创建、线程、同步）与第 20–22 章（信号）。
- 阅读 JEP 444（虚拟线程）与 Go 调度器 GMP 模型，理解用户态调度的取舍。
- 实践：写一个多线程计数器，用 ${C}ab/wrk${C} 压测对比「加锁 / 原子 / 单线程协程」三种实现的吞吐。
`
          },
          {
            id: "memory-basics",
            title: "内存管理基础",
            minutes: 22,
            updated: "2026-09-17",
            applies: "Linux 虚拟内存子系统",
            tags: ["内存", "OS", "虚拟内存", "页缓存"],
            terms: ["内存", "虚拟内存", "OS"],
            body: `
> **官方文档基线**：[man7: mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html) · [brk(2)](https://man7.org/linux/man-pages/man2/brk.2.html) · [proc(5) / meminfo](https://man7.org/linux/man-pages/man5/proc.5.html) · [CSAPP 第 9 章「虚拟内存」](https://csapp.cs.cmu.edu/) · [TLPI 第 49 章](https://man7.org/tlpi/)

## 一、原理与底层机制

### 1.1 虚拟内存：每个进程都以为自己独占内存
进程发出的是**虚拟地址**，由 MMU 经多级页表翻译成物理地址。好处有三：① **隔离**——进程无法越界访问他者内存；② **抽象**——程序不必关心物理位置；③ **超售**——可用「虚拟地址总和」大于物理内存，靠 swap 兜底。

### 1.2 TLB：地址翻译的加速器
页表在内存里，每次访存都查表太慢，于是有 **TLB（页表缓存）** 缓存最近翻译。**进程切换要换页表（写 CR3）→ TLB 失效**，这是进程切换比线程切换贵得多的核心原因。

### 1.3 用户态 vs 内核态
CPU 分特权级（x86 的 ring0/ring3）：
- **用户态**：普通程序运行，不能直接操作硬件、不能改页表。
- **内核态**：执行系统调用（read/write/open/mmap）时通过 ${C}syscall${C} 指令陷入内核。

每次陷入都要保存/恢复上下文，**频繁系统调用是隐形性能杀手**（批量读写、缓冲、批量提交可显著降低开销）。

### 1.4 堆与栈
| | 栈 stack | 堆 heap |
|---|---|---|
| 分配/释放 | 随函数进出自动，指针移动 | 手动/${C}free${C}/GC 管理 |
| 速度 | 极快 | 较慢（分配器/GC） |
| 大小 | 有限（默认 8MB） | 大（受物理+swap 限制） |
| 碎片 | 无 | 有（外部碎片） |
| 典型故障 | 栈溢出（无限递归） | 内存泄漏、OOM |

### 1.5 缺页、写时复制与 swap
- **缺页中断**：访问的页不在物理内存 → 从磁盘/swap 载入。适量的「主缺页」正常，过量则说明内存不足。
- **写时复制（COW）**：${C}fork()${C} 后父子进程共享物理页，任一方写入才真正复制。这让 fork 廉价，但**大内存进程 fork 后仍可能因写触发大量复制**。
- **swap**：物理内存不足时把冷页换到磁盘。一旦频繁换入换出（si/so 飙高），**性能断崖式下跌**（磁盘比内存慢上万倍）。

## 二、规范与标准

- **mmap（POSIX）**：把文件或匿名内存映射进地址空间；${C}MAP_SHARED${C} 共享回写、${C}MAP_PRIVATE${C} 私有 COW、${C}PROT_READ/WRITE${C} 权限。
- **/proc/meminfo**：${C}MemTotal/MemFree/MemAvailable/Buffers/Cached/SwapTotal/SwapFree${C}；判断内存是否吃紧应看 **MemAvailable**，而不是 MemFree。
- **overcommit 策略**：${C}vm.overcommit_memory${C}（0 启发式、1 总是允许、2 严格）；严格模式可防「申请成功但用时不 OOM 触发」，但可能让正常 malloc 失败。
- **cgroup v2 memory**：${C}memory.max${C} / ${C}memory.current${C} / ${C}memory.high${C}，容器内存限额的实际执行者。

## 三、实战

${F}bash
# 全局内存与 swap 概况（重点看 available 与 swap 使用量）
free -h

# 每秒内存/换页/上下文切换（si/so 非 0 说明在换页）
vmstat 1

# 单进程内存细节（VmRSS 物理占用，VmSize 虚拟大小）
grep -E "VmSize|VmRSS|VmSwap|Threads" /proc/<pid>/status

# 进程内存映射（谁占了地址空间：堆、映射文件、动态库）
pmap -x <pid>

# 找出大内存进程（按 RSS 排序）
ps -eo pid,rss,vsz,comm --sort=-rss | head

# 触发一次 GC/释放观察（Java 用 jcmd，通用看 /proc）
${F}

**mmap 的正确用法（脆弱 vs 正确）**：
${F}c
// ❌ 写了就算落盘？没有 msync，数据可能只在内核脏页里，宕机即丢
memcpy(map + off, data, len);

// ✅ 需要持久化时显式刷盘（或接受 OS 延迟回写 + 文件系统日志配合）
memcpy(map + off, data, len);
msync(map + off, len, MS_SYNC);   // MS_SYNC 同步写回
${F}

## 四、覆盖广度

- **OOM Killer**：物理内存 + swap 耗尽时，内核按 ${C}oom_score${C} 杀进程。容器里常表现为「进程莫名消失」，需看 ${C}dmesg${C}。设置 ${C}oom_score_adj${C} 可保护关键进程。
- **Page Cache 不是泄漏**：${C}free${C} 里的 ${C}buff/cache${C} 是可回收的页缓存，紧张时自动释放；真正要关注的是 ${C}available${C}。
- **大页（HugePage）**：用 2MB / 1GB 大页替代 4KB 页可大幅减少 TLB miss；JVM 用 ${C}-XX:+UseLargePages${C}，数据库一般用 ${C}huge_pages${C} 配置项配合 ${C}vm.nr_hugepages${C}。
- **NUMA**：多路 CPU 各有本地内存，跨节点访问延迟高；用 ${C}numactl${C} 绑核绑内存可提升吞吐。
- **内存泄漏的排查路径**：RSS 持续上涨 → /proc 或 pmap 定位段 → 堆分析（Valgrind / JVM heap dump）。

## 五、常见误区

1. **看 MemFree 判断内存不足**：应看 ${C}MemAvailable${C}，Page Cache 随时可回收。
2. **以为 write 返回就是落盘**：默认只写页缓存，宕机丢数据；重要写入要 ${C}fsync${C} 或 ${C}O_DIRECT${C}。
3. **把虚拟内存当物理占用**：VmSize 申请 4G 不代表真占 4G；看 VmRSS。
4. **忽略 swap 换页**：内存紧张初期只是变慢，频繁 swap 后服务「假死」，要监控 si/so。
5. **大对象放栈**：超大局部数组直接撑爆栈，崩溃现场难查。
6. **在容器里猛写内存不看 cgroup 限额**：触发容器 OOM，进程被秒杀且无 Java 异常栈。

## 六、自检清单

- [ ] 能解释虚拟内存如何实现进程隔离与内存超售
- [ ] 会区分 VmSize / VmRSS / Page Cache / swap 的含义
- [ ] 判断内存是否吃紧优先看 MemAvailable 而非 MemFree
- [ ] 知道 COW 的收益与「大内存进程 fork 仍可能爆内存」的成因
- [ ] 能按 RSS → /proc 段 → 堆分析 的路径排查内存泄漏

## 七、延伸

- 精读 CSAPP 第 9 章，理解页表、TLB、缺页、COW 的硬件支撑。
- 阅读 TLPI 第 49 章「内存映射」与第 6 章「进程内存布局」。
- 实践：用 ${C}/proc/<pid>/smaps${C} 逐段分析一个 Java 进程的内存构成（堆、元空间、线程栈、映射文件）。
`
          },
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "能解释现象、定位问题：TCP 可靠传输与拥塞控制、TLS/HTTPS 握手、DNS 与 CDN、IO 多路复用、文件系统与磁盘 IO。",
        chapters: [
          {
            id: "tcp-reliable",
            title: "TCP 可靠传输与拥塞控制",
            minutes: 26,
            updated: "2026-09-17",
            applies: "TCP（RFC 9293 / 5681 / 6298）",
            tags: ["TCP", "拥塞控制", "可靠传输", "重传"],
            terms: ["TCP", "三次握手", "拥塞", "网络"],
            body: `
> **官方文档基线**：[RFC 9293 TCP](https://www.rfc-editor.org/rfc/rfc9293) · [RFC 5681 Congestion Control](https://www.rfc-editor.org/rfc/rfc5681) · [RFC 6298 RTO 计算](https://www.rfc-editor.org/rfc/rfc6298) · [RFC 7323 窗口缩放/SACK/时间戳](https://www.rfc-editor.org/rfc/rfc7323) · [RFC 8312 CUBIC](https://www.rfc-editor.org/rfc/rfc8312) · [man7: tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html)

## 一、原理与底层机制

### 1.1 TCP 凭什么「可靠」——四件套
UDP 发出去就不管；TCP 承诺**不丢、不乱、不重、按序到**，靠四套机制：
1. **序号 + 确认（ACK）**：每个字节都有序号，接收方告诉发送方「我已连续收到到第 N 字节」。
2. **超时重传（RTO）**：超过阈值没收到 ACK 就重发，RTO 由 RTT 动态估算（RFC 6298）。
3. **滑动窗口**：接收方通告「还能收多少」，做**流量控制**，防止压垮接收方。
4. **拥塞控制**：探测网络容量，主动减速，防止压垮网络。

### 1.2 三次握手与四次挥手
${F}text
握手（建立连接）              挥手（断开连接）
C: SYN  seq=x        →        A: FIN  →  B: ACK
S: SYN+ACK seq=y,ack=x+1 ←     B: FIN  ←  A: ACK（进 TIME_WAIT，等 2MSL）
C: ACK  ack=y+1      →        （被动方先 ACK，数据发完再 FIN → 故四次）
${F}
为什么握手要三次？两次的话服务端无法确认「客户端收到了我的 SYN+ACK」，无法确认双向都通。为什么挥手要四次？被动方收到 FIN 只能先 ACK，自己可能还有数据要发，发完才 FIN——收发是两件独立的事。

### 1.3 状态机里的两个「坑位」
- **TIME_WAIT**：主动关闭方最后停留 2MSL，作用有二：① 若最后一个 ACK 丢了，还能重发；② 让旧连接的残留报文在网络中消散，避免污染新连接。**它是正常设计，不是故障**。
- **CLOSE_WAIT**：被动方收到 FIN 后进入，等应用调用 close。**大量 CLOSE_WAIT 说明应用没关连接**（代码漏 close / 连接池泄漏），是真正的 bug 信号。

### 1.4 拥塞控制的四阶段
发送方维护拥塞窗口 **cwnd**，实际可发送量 = min(cwnd, 接收方通告窗口 rwnd)。
| 阶段 | 触发 | 窗口变化 |
|---|---|---|
| 慢启动 | 连接开始 | 每收到 ACK，cwnd +1 MSS → **指数增长** |
| 拥塞避免 | cwnd ≥ ssthresh | 每 RTT，cwnd +1 → **线性增长** |
| 快速重传 | 收到 3 个重复 ACK | 立即重传丢失段，不等超时 |
| 快速恢复 | 快速重传后 | ssthresh 减半，cwnd 降半，线性恢复 |
| 超时丢包 | RTO 超时 | cwnd 直接回到 1，重回慢启动（最重惩罚） |

### 1.5 现代算法：CUBIC 与 BBR
- **CUBIC（Linux 默认）**：用三次函数控制窗口增长，在高带宽长延迟（LFN）网络上比传统 Reno 更稳。
- **BBR（Google）**：不再「丢包=拥塞」，而是**建模瓶颈带宽与最小 RTT**，主动把发送速率卡在「带宽 × RTT」附近。在有一定丢包的弱网/跨国链路上，吞吐常显著优于丢包驱动算法。

## 二、规范与标准

- **RFC 5681** 定义四阶段与 ssthresh 更新规则，是拥塞控制的标准基线。
- **RFC 6298** 规定 RTO 计算：${C}SRTT${C} 平滑 RTT、${C}RTTVAR${C} 方差，${C}RTO = SRTT + 4×RTTVAR${C}，且有最小 1s（Linux 内部更小）与指数退避。
- **RFC 7323 关键扩展**：窗口缩放（突破 64KB 窗口上限）、SACK（选择性确认，只重传真正丢的那段）、时间戳（精确测 RTT、防回绕）。
- **Nagle + 延迟确认**：Nagle 攒小包，延迟 ACK 攒确认，两者叠加会造成**请求-应答型小包交互的额外延迟**，游戏/即时通信要开 ${C}TCP_NODELAY${C}。

## 三、实战

${F}bash
# 看连接的拥塞状态：cwnd / rtt / retrans（-i 显示 TCP 内部信息）
ss -ti dst 1.1.1.1

# 抓握手与挥手（关注 seq/ack 与标志位）
tcpdump -i eth0 -nn 'tcp port 443' -c 20

# 统计各状态的连接数：TIME_WAIT / CLOSE_WAIT 各多少
ss -tan | awk 'NR>1{print $1}' | sort | uniq -c | sort -rn

# 只有 CLOSE_WAIT 很多 → 应用没关连接（查代码/连接池）
ss -tan state close-wait | head

# 短连接客户端端口耗尽时：调大端口范围并复用
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sysctl -w net.ipv4.tcp_tw_reuse=1     # 仅客户端有效
${F}

**应用层分包（脆弱 vs 正确）**：
${F}java
// ❌ 假设一次 read 就能拿到一条完整消息（TCP 是字节流，会粘包/拆包）
int n = in.read(buf); handle(new String(buf, 0, n));

// ✅ 定长头声明长度，循环读满为止（或按分隔符切分）
while ((len = readFully(in, head, 4)) == 4) {
    int bodyLen = ByteBuffer.wrap(head).getInt();
    readFully(in, body, bodyLen);      // 读到正好 bodyLen 字节
    handle(body);
}
${F}

## 四、覆盖广度

- **粘包 / 拆包是必然**：TCP 只保证字节流有序，不保留消息边界。方案：定长、长度前缀（最通用）、分隔符（如 \\r\\n）、应用层协议。
- **TIME_WAIT 端口耗尽**：高并发短连接客户端的常见问题。优先级：**用连接池复用连接 > 调大端口范围 > 开 tcp_tw_reuse**。服务端一般无需处理（服务端是被动方，不产生大量 TIME_WAIT）。
- **MSS / MTU**：MSS = MTU − IP 头 − TCP 头，以太网下通常 1460。隧道/overlay 会减小 MTU，不调 MSS 会导致大包被丢。
- **SYN Flood 防护**：${C}net.ipv4.tcp_syncookies=1${C} + 合理 ${C}tcp_max_syn_backlog${C}，防止半连接队列被打满。
- **重传率是健康指标**：${C}netstat -s | grep retrans${C} 或监控系统的 TCP Retransmission 曲线，持续升高说明链路或对端有问题。

## 五、常见误区

1. **把 TCP 当「消息」协议**：忘了字节流没有边界，导致偶发「半条消息」解析错误。
2. **忽视 Nagle + 延迟 ACK 的叠加延迟**：小包交互场景不加 ${C}TCP_NODELAY${C}，往返延迟莫名偏高。
3. **把 TIME_WAIT 当故障清掉**：它是正常设计；真正要查的是 CLOSE_WAIT 堆积。
4. **混淆流量控制与拥塞控制**：前者防「压垮接收方」（rwnd），后者防「压垮网络」（cwnd）。
5. **以为丢包一定等于网络差**：也可能是接收方处理慢（窗口打满）或中间设备限速。
6. **超时丢包后立刻重传风暴**：正确做法是依赖快速重传 + 合理 RTO，避免无谓重传加剧拥塞。

## 六、自检清单

- [ ] 能说明三次握手/四次挥手的必要性
- [ ] 能区分 TIME_WAIT（正常）与 CLOSE_WAIT（应用 bug）
- [ ] 能画出四阶段拥塞控制窗口变化曲线
- [ ] 会用 ${C}ss -ti${C} 看 cwnd/RTT/重传，会统计连接状态分布
- [ ] 知道应用层必须自行处理粘包/拆包，并给出至少两种方案

## 七、延伸

- 精读 RFC 9293 的「连接建立/关闭」与「重传」章节。
- 阅读 BBR 论文与 Linux ${C}tcp_bbr${C} 实现说明，对比丢包驱动与带宽建模的差异。
- 实践：用 ${C}tc netem${C} 模拟丢包/延迟，观察 cwnd 与吞吐在不同算法下的变化。
`
          },
          {
            id: "https-tls",
            title: "HTTPS / TLS 握手",
            minutes: 24,
            updated: "2026-09-17",
            applies: "TLS 1.2 / TLS 1.3",
            tags: ["HTTPS", "TLS", "安全", "证书"],
            terms: ["HTTPS", "TLS", "证书", "加密"],
            body: `
> **官方文档基线**：[RFC 8446 TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) · [RFC 5280 X.509 证书](https://www.rfc-editor.org/rfc/rfc5280) · [RFC 6797 HSTS](https://www.rfc-editor.org/rfc/rfc6797) · [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) · [man7: openssl-s_client](https://www.openssl.org/docs/man1.1.1/man1/openssl-s_client.html)

## 一、原理与底层机制

### 1.1 TLS 要同时解决三件事
HTTP 明文传输，中间人可窃听、篡改、冒充。TLS 提供：
- **机密性**：内容加密，窃听者看不懂；
- **完整性**：MAC/AEAD 校验，篡改会被发现；
- **身份认证**：用证书证明「你确实是我要访问的站点」，而不是冒充者。

### 1.2 非对称 + 对称的混合设计
- **非对称（RSA / ECDHE）**：公钥加密、私钥解密，慢，只用来**协商**。
- **对称（AES-GCM / ChaCha20-Poly1305）**：双方同钥，快，用来**传输正文**。

TLS 的精妙处：**握手段用非对称安全地协商出一把「会话密钥」，之后全程对称加密**——兼顾安全与性能。

### 1.3 证书与信任链
服务器证书包含公钥、域名（SAN）、有效期，并由 CA 私钥签名。客户端用**内置信任库里的根 CA 公钥**逐级验证签名链：
${F}text
根 CA（内置信任锚）
  └─ 中间 CA（证书里携带，需补全服务端发送）
        └─ 服务器证书（SAN 必须匹配访问域名）
${F}
任何一环缺失（**没发中间证书**）、域名不匹配、过期、CA 不受信，浏览器都会报警。

### 1.4 TLS 1.2 vs 1.3 握手差异
- **TLS 1.2**：2-RTT，客户端等 ServerHello 后才发密钥材料；支持大量历史算法（含不安全的 RSA 密钥交换、CBC）。
- **TLS 1.3**：**1-RTT**（客户端直接带上密钥共享），支持 **0-RTT** 会话恢复；只保留**前向安全**的密钥交换（ECDHE）与少量 AEAD 套件，砍掉 RC4/CBC/静态 RSA，攻击面大幅缩小。

**前向安全（PFS）**：会话密钥由临时 ECDHE 生成，**即使服务器私钥日后泄露，也无法解密历史流量**。

## 二、规范与标准

- **RFC 8446**：TLS 1.3 只允许 AEAD 密码套件（如 ${C}TLS_AES_128_GCM_SHA256${C}、${C}TLS_CHACHA20_POLY1305_SHA256${C}）。
- **证书要求**：SAN 必须包含访问域名（现代浏览器已不看 CN）；有效期（CA/B 论坛强制 ≤398 天）；必须完整下发中间证书。
- **HSTS（RFC 6797）**：${C}Strict-Transport-Security: max-age=31536000; includeSubDomains; preload${C}，强制浏览器只用 HTTPS，防降级劫持。
- **OCSP / CT**：在线吊销检查与证书透明日志；OCSP Stapling 由服务器代为获取并随握手下发，兼顾隐私与性能。
- **SNI**：一个 IP 承载多域名时，客户端在 ClientHello 里带上目标域名，服务器据此选证书。ECH/加密 SNI 是新一代隐私增强方向。

## 三、实战

${F}bash
# 检查证书链、有效期、协议版本（最关键的一行命令）
openssl s_client -connect example.com:443 -servername example.com -showcerts </dev/null 2>/dev/null | openssl x509 -noout -dates -subject -issuer

# 只看协商到的协议与套件
openssl s_client -connect example.com:443 -tls1_3 </dev/null 2>/dev/null | grep -E "Protocol|Cipher"

# 模拟 TLS 1.0（应被拒绝，验证已关闭老协议）
openssl s_client -connect example.com:443 -tls1 </dev/null

# 批量检查证书剩余天数（监控用）
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -enddate
${F}

**Nginx 现代 TLS 配置（脆弱 vs 正确）**：
${F}nginx
# ❌ 允许老协议 + 弱套件
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_ciphers ALL:!aNULL;

# ✅ 只留 TLS 1.2/1.3，现代套件，开 HSTS 与 OCSP Stapling
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
${F}

## 四、覆盖广度

- **0-RTT 的重放风险**：TLS 1.3 的 0-RTT 早期数据可能被攻击者重放，**只应对幂等的 GET 使用 0-RTT**，支付/下单等写操作不要用。
- **证书类型**：DV（仅验证域名归属，最便宜最快）、OV（验证组织）、EV（扩展验证，浏览器 UI 已弱化）。Let's Encrypt / acme.sh / cert-manager 可自动化 DV 证书签发与续期。
- **会话恢复**：TLS 1.2 用 Session ID / Session Ticket，TLS 1.3 用 PSK，减少完整握手开销；集群下需共享 ticket key，否则恢复失败回退全握手。
- **mTLS（双向认证）**：服务端也校验客户端证书，常用于服务网格、支付、IoT，是零信任的基石之一。
- **内网是否加密**：按合规与威胁模型决定；微服务间可用 mTLS 或服务网格自动加密，避免「入口加密、内网裸奔」。

## 五、常见误区

1. **证书过期导致全站 HTTPS 失败**：必须做有效期监控 + 自动续期，并留续期失败的告警。
2. **中间证书没下发**：部分客户端（尤其 Android/老终端）无法构建完整链而报错，服务器必须发送中间 CA。
3. **自签证书不做信任分发**：客户端不信任就报错，内网需把自建 CA 加进信任库或改用受信 CA。
4. **只在入口加密**：网关解密后内网明文，内网被渗透照样泄露。
5. **Mixed Content**：HTTPS 页面嵌 HTTP 资源会被浏览器拦截，需全站 HTTPS。
6. **没开 HSTS**：首次访问仍可能被劫持到 HTTP，配 HSTS 可强制后续走 HTTPS。

## 六、自检清单

- [ ] 能解释 TLS 为何「非对称协商 + 对称传输」
- [ ] 能画出证书信任链并指出「缺中间证书」的后果
- [ ] 会用 ${C}openssl s_client${C} 检查证书链、有效期、协议版本
- [ ] 能写出只允许 TLS 1.2/1.3 的 Nginx 配置
- [ ] 知道 0-RTT 的重放风险，只对幂等请求启用

## 七、延伸

- 通读 RFC 8446 第 1–2 章，理解 1.3 移除不安全算法与前向安全的设计取舍。
- 阅读 OWASP TLS Cheat Sheet，对照生产配置逐项加固。
- 实践：用 ${C}testssl.sh${C} 对一个站点做完整 TLS 体检，解读每一项评级。
`
          },
          {
            id: "dns-cdn",
            title: "DNS 与 CDN",
            minutes: 22,
            updated: "2026-09-17",
            applies: "DNS（RFC 1034/1035）/ CDN",
            tags: ["DNS", "CDN", "网络", "解析"],
            terms: ["DNS", "CDN", "域名解析"],
            body: `
> **官方文档基线**：[RFC 1034 DNS 概念](https://www.rfc-editor.org/rfc/rfc1034) · [RFC 1035 DNS 实现](https://www.rfc-editor.org/rfc/rfc1035) · [RFC 8484 DoH](https://www.rfc-editor.org/rfc/rfc8484) · [RFC 7858 DoT](https://www.rfc-editor.org/rfc/rfc7858) · [man7: resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html)

## 一、原理与底层机制

### 1.1 DNS 是一棵分布式、分层、带缓存的数据库
DNS 把「域名 → IP」的映射分散到全球成千上万台服务器上，用**分层委派**避免单点：
${F}text
        .（根）  → 告诉你 .com 的权威
      .com       → 告诉你 example.com 的权威
   example.com   → 给出最终 A / AAAA 记录
${F}

### 1.2 递归 vs 迭代
- **递归查询**：客户端问本地 resolver（如 8.8.8.8），resolver 负责一路问到答案再回复——客户端只问一次。
- **迭代查询**：resolver 之间是迭代的，挨个问根、顶级、权威，逐级拿到「下一步该问谁」。
- **缓存**：每级都有缓存，命中就直接返回，这是 DNS 能扛住全球查询量的根本。

### 1.3 TTL：缓存与变更的矛盾
每条记录带 **TTL（生存时间）**，期内下游缓存不再回源。TTL 大 → 解析快、源压力小，但**改解析后全网生效慢**；TTL 小 → 变更快，但查询量大。**变更前先把 TTL 调小（如 60s）**，变更完成后再调大，是切割/迁移的标准动作。

### 1.4 记录类型
| 类型 | 作用 | 备注 |
|---|---|---|
| A | 域名 → IPv4 | 最常用 |
| AAAA | 域名 → IPv6 | 双栈必需 |
| CNAME | 域名别名 → 另一域名 | 根域通常不可用 |
| MX | 邮件服务器 | 带优先级 |
| TXT | 文本 | SPF / DKIM / 域名验证 |
| NS | 该域的权威服务器 | 委派的关键 |
| SOA | 域的管理信息 | 主从/序列号 |
| SRV | 服务发现 | 带端口与优先级 |

## 二、规范与标准

- **RFC 1034/1035** 定义 DNS 的数据模型、报文格式与查询流程，是全部 DNS 实现的基础。
- **resolv.conf(5)**：${C}nameserver${C}（可多个，按序尝试）、${C}search${C}、${C}options timeout:1 attempts:2 rotate${C}——配置不当会造成「每次都等超时」的整体变慢。
- **EDNS0（RFC 6891）**：扩展 UDP 报文大小、携带客户端子网（ECS，用于 CDN 精准调度）。
- **DNS 传输加密**：DoT（RFC 7858，853 端口）、DoH（RFC 8484，走 HTTPS）防窃听与劫持；DoH 与浏览器结合可绕过部分网络策略。
- **DNSSEC**：用签名链验证解析结果真实，防止缓存投毒；与「加密」是两件事，需分别部署。

## 三、实战

${F}bash
# 完整看一次递归解析路径（从根一路问到权威，定位是哪一级错了）
dig +trace example.com

# 指定某类记录与指定 DNS 服务器
dig @8.8.8.8 example.com A +short
dig example.com MX +short
dig example.com NS +short

# 看 TTL（第 2 列）与是否命中缓存
dig example.com A

# 反向解析
dig -x 93.184.216.34 +short

# 临时指定解析（排查 DNS 问题最快的手段）
dig @1.1.1.1 example.com +short
${F}

**TTL 切流的标准流程（迁移不中断）**：
${F}bash
# 1) 提前把 TTL 调小（例如 60s），等待旧 TTL 全部过期（通常几小时）
# 2) 切换到新 IP
# 3) 观察新 IP 流量正常、旧 IP 流量归零
# 4) 把 TTL 调回较大值（如 3600）
${F}

## 四、覆盖广度

- **CDN 调度**：多数靠 **DNS 智能解析**（按来源 IP 返回最近边缘节点），也有 **Anycast**（同一 IP 多地广播，由 BGP 就近路由）与 HTTP-DNS（客户端主动上报）。
- **负载均衡策略**：轮询、加权、地理就近、故障摘除；结合健康检查剔除异常节点。
- **缓存策略与破缓存**：静态资源用「文件名带内容 hash」实现长缓存（${C}max-age=31536000${C}），更新时换文件名，天然破缓存；也可以加版本 query。
- **回源保护**：CDN 大面积失效时会「回源风暴」压垮源站，源站需限流 + 分层缓存 + 设置回源并发上限。
- **通配符与泛解析**：${C}*.example.com${C} 用于多子域；注意别把内部域名也暴露成公网泛解析。

## 五、常见误区

1. **改了解析「半天不生效」**：TTL 未过期，全世界仍用旧缓存；紧急变更前必须先降 TTL。
2. **resolv.conf 配了不可达 DNS**：每次解析都等超时，接口整体变慢，且难定位——这是很隐蔽的性能问题。
3. **CNAME 冲突**：根域名或与同名记录共存会导致解析失败或行为不确定。
4. **CDN 回源把源站打挂**：没做回源限流与缓存策略，CDN 抖动直接变成源站雪崩。
5. **静态资源改内容不换名**：CDN 与浏览器缓存旧版，用户看到的还是老文件。
6. **把 DNS 当配置中心频繁改**：DNS 传播有延迟，不适合毫秒级、频繁变更的策略控制。

## 六、自检清单

- [ ] 能画出 DNS 分层委派与递归/迭代查询流程
- [ ] 能说出常见记录类型的用途与 CNAME 的限制
- [ ] 迁移/切流前会先降 TTL，完成后再调回
- [ ] 会用 ${C}dig +trace${C} 定位解析链路中出问题的那一级
- [ ] 知道 CDN 调度原理与回源保护的必要性

## 七、延伸

- 精读 RFC 1034 第 2 章（名称空间与资源记录）与 RFC 1035 第 4 章（报文格式）。
- 了解 DNSSEC 签名链与 DoH/DoT 的部署差异。
- 实践：用 ${C}mtr${C} + ${C}dig +trace${C} 组合排查一次「某地区访问慢」的问题（区分解析问题与路由问题）。
`
          },
          {
            id: "io-multiplexing",
            title: "IO 多路复用",
            minutes: 24,
            updated: "2026-09-17",
            applies: "Linux epoll / select / poll / io_uring",
            tags: ["IO", "epoll", "多路复用", "高并发"],
            terms: ["IO", "epoll", "多路复用", "网络"],
            body: `
> **官方文档基线**：[man7: epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html) · [select(2)](https://man7.org/linux/man-pages/man2/select.2.html) · [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html) · [io_uring(7)](https://man7.org/linux/man-pages/man7/io_uring.7.html) · [select_tut(2)](https://man7.org/linux/man-pages/man2/select_tut.2.html)

## 一、原理与底层机制

### 1.1 问题的起点：一个线程如何管上万连接
最朴素的模型是「一连接一线程（BIO）」：1 万连接 = 1 万线程，仅线程栈就要 8 万 MB，上下文切换把机器拖死。

**IO 多路复用**的思想：**一个线程同时监视一大批 fd，谁就绪就处理谁**，不为每个连接配线程。注意它是「多路复用器」，本身**不异步**——仍是「就绪通知 + 自己读写」。

### 1.2 select → poll → epoll 的演进
| 机制 | 内核实现 | 瓶颈 |
|---|---|---|
| select | 位图传 fd 集合，返回后全量遍历 | fd 上限 1024、每次全量拷贝 + O(n) 遍历 |
| poll | 数组代替位图，去掉 1024 限制 | 仍全量拷贝 + O(n) 遍历 |
| **epoll** | 内核红黑树管理 fd + 就绪链表 | 只返回就绪 fd，**O(1) 获取就绪**，与总连接数无关 |

**epoll 三大优势**：① fd 用红黑树管理，增删改 O(log n)，且只注册一次；② 事件就绪放入链表，${C}epoll_wait${C} 只返回就绪项，不必遍历全部；③ 支持 ET/LT 两种触发模式，天然适合海量连接。

### 1.3 LT 与 ET
- **LT（水平触发，默认）**：只要 fd 仍可读，每次 ${C}epoll_wait${C} 都通知。稳妥，但可能重复通知。
- **ET（边缘触发）**：状态**变化**时只通知一次，效率更高，但**必须一次读到 ${C}EAGAIN${C}**，否则剩余数据不会再有事件，连接会「假死」。ET 用错的坑最多。

### 1.4 就绪 vs 异步：io_uring
epoll 属「就绪通知」，读写仍需应用自己做系统调用。Linux 5.1 引入的 **io_uring** 提供真正的**异步 IO**：提交环形队列（SQ）+ 完成环形队列（CQ），可批量提交、共享内存零拷贝、支持 ${C}IORING_OP_READV${C} 等，配合 ${C}IORING_SETUP_SQPOLL${C} 还能内核线程轮询，几乎消除每次 IO 的 syscall 开销。

## 二、规范与标准

- **fd 必须非阻塞**：多路复用配合的 socket 要设 ${C}O_NONBLOCK${C}，否则读到无数据时线程会阻塞，监视其他 fd 的能力就失效。
- **epoll API**：${C}epoll_create1${C} → ${C}epoll_ctl(ADD/MOD/DEL)${C} → ${C}epoll_wait${C}；ET 模式必须搭配非阻塞并循环读写至 ${C}EAGAIN${C}。
- **accept 队列**：${C}listen(fd, backlog)${C} 与 ${C}net.core.somaxconn${C} 决定全连接队列上限，太小会在高并发瞬时丢连接。
- **零拷贝**：${C}sendfile(2)${C}、${C}splice(2)${C} 让数据在内核内直接从文件传到 socket，避免用户态来回复制，Nginx 静态文件服务默认受益。

## 三、实战

${F}c
// epoll 骨架（伪代码，体现正确顺序）
int ep = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN | EPOLLET, .data.fd = listen_fd };
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &ev);

for (;;) {
    int n = epoll_wait(ep, events, MAX_EVENTS, -1);   // 只返回就绪的
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == listen_fd) {
            // ET 模式下 accept 要循环到 EAGAIN，否则新连接漏事件
            for (;;) {
                int c = accept4(listen_fd, ..., SOCK_NONBLOCK);
                if (c < 0 && errno == EAGAIN) break;
                add_to_epoll(ep, c, EPOLLIN | EPOLLET);
            }
        } else {
            // ET 读也必须循环读到 EAGAIN
            while (read_fd_until_eagain(events[i].data.fd)) { /* handle */ }
        }
    }
}
${F}

${F}bash
# 看进程打开了多少 fd、上限是多少
ls /proc/<pid>/fd | wc -l
cat /proc/<pid>/limits | grep "open files"

# 调大 fd 上限（Nginx/网关类服务必需）
ulimit -n 65535
sysctl -w fs.file-max=1000000
${F}

## 四、覆盖广度

- **Reactor vs Proactor**：Reactor 是「就绪后应用自己读」（epoll/Nginx/Netty），Proactor 是「内核读完通知你」（Windows IOCP / Linux io_uring）。Go 的 netpoller 在底层用 epoll，但给上层的仍是「同步风格」。
- **谁在用 epoll**：Nginx（多 worker + epoll）、Redis（单线程 + epoll，纯内存无锁）、Node.js（libuv）、Netty（Java NIO）。理解它就懂了**为什么 Redis 单线程能扛高并发**。
- **C10K → C10M**：万级连接靠 epoll + 事件驱动；千万级要内核旁路（DPDK / XDP / eBPF）与用户态协议栈。
- **sendfile / splice**：静态文件与代理场景用零拷贝减少数据搬运，显著降低 CPU 与内存带宽占用。

## 五、常见误区

1. **ET 模式没读干净**：只读了一部分就不管，剩余数据永不再触发事件，连接表现成「卡住/假死」。
2. **事件循环里放阻塞调用**：任何一次同步阻塞（慢 SQL、阻塞读文件）都会卡住整个循环，所有连接一起等。
3. **忘了设非阻塞**：多路复用配阻塞 fd，读不到就阻塞，多路复用形同虚设。
4. **select 硬撑大并发**：上千连接就该换 epoll（或直接用 NIO 框架）。
5. **以为多路复用 = 多线程**：它解决的是「一个线程管多连接」，CPU 密集任务仍要丢线程池。
6. **不调 fd 上限**：高并发时 ${C}EMFILE: too many open files${C}，是线上高频故障。

## 六、自检清单

- [ ] 能说清 select/poll/epoll 的复杂度差异与 epoll 的三点优势
- [ ] 能解释 LT 与 ET 的区别，以及 ET 为什么必须读到 EAGAIN
- [ ] 知道多路复用是「就绪通知」而非「异步 IO」，并了解 io_uring 的定位
- [ ] 会用 epoll 的 fd 上限 / somaxconn 排查「连接上不来」
- [ ] 理解 Redis/Nginx/Node 高并发背后的共同底层

## 七、延伸

- 精读 man7 的 ${C}epoll(7)${C} 与 ${C}select_tut(2)${C}，写一个最小可运行的 epoll echo server。
- 阅读 io_uring 官方设计与「io_uring 与 epoll 对比」分析，理解下一代异步 IO。
- 实践：用 ${C}wrk${C} 压测同一服务的 BIO 与 epoll 实现，对比连接数与延迟曲线。
`
          },
          {
            id: "fs-disk-io",
            title: "文件系统与磁盘 IO",
            minutes: 22,
            updated: "2026-09-17",
            applies: "Linux VFS（ext4 / XFS / overlayfs）",
            tags: ["文件系统", "磁盘", "IO", "inode"],
            terms: ["磁盘", "IO", "文件系统", "inode"],
            body: `
> **官方文档基线**：[man7: filesystems(5)](https://man7.org/linux/man-pages/man5/filesystems.5.html) · [inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html) · [fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html) · [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) · [proc(5) / diskstats](https://man7.org/linux/man-pages/man5/proc.5.html) · TLPI 第 13/14 章

## 一、原理与底层机制

### 1.1 VFS：屏蔽底层的统一接口
Linux 用**虚拟文件系统（VFS）**把 ext4 / XFS / Btrfs / overlayfs / tmpfs 统一成 ${C}open/read/write/close${C} 一套接口。应用不关心底层实现，「一切皆文件」的基础正在这里——${C}/proc${C}、${C}/dev${C}、socket 都挂在 VFS 之下。

### 1.2 inode 与 dentry：文件的真身
- **inode** 保存文件的元数据：权限、大小、时间戳、数据块指针、链接计数——**唯独不含文件名**。
- **目录项（dentry）** 才是「文件名 → inode」的映射。硬链接就是多个 dentry 指向同一 inode。

这解释了一个经典现象：**删了文件空间却不释放**——只要还有进程持有该文件的 fd（inode 引用计数 > 0），inode 与数据块就不回收。

### 1.3 页缓存：读写很快的真相
读文件时内核把内容缓存进 **Page Cache**，下次直接命中内存；写默认也是**先写页缓存（write-back）**，由内核异步刷盘。所以：
- ${C}write()${C} 返回快 ≠ 数据已落盘；
- 要持久化必须 ${C}fsync()${C}（或 ${C}O_SYNC${C} / ${C}O_DIRECT${C}，代价是慢）。

### 1.4 一次 IO 的完整路径
${F}text
应用 read/write
  → VFS（文件系统抽象）
  → 页缓存（命中直接返回；未命中触发磁盘读）
  → 具体文件系统（ext4/XFS：inode 到块映射）
  → 块层（合并、排序、调度）
  → 设备驱动 → 磁盘
${F}
每一层都可能成为瓶颈：页缓存未命中、ext4 元数据锁、块层队列积压、磁盘 IOPS 打满。

### 1.5 顺序写 vs 随机写
机械盘随机 IO 要寻道，吞吐可能只有顺序的百分之一；SSD 没有寻道但仍受擦写放大影响。因此工程上的普适原则是**把随机写转成顺序写**——这就是 WAL（预写日志）、LSM-Tree 的价值所在。

## 二、规范与标准

- **POSIX 语义**：${C}read/write${C} 不保证落盘；${C}fsync${C} 同步数据与元数据，${C}fdatasync${C} 只同步数据；${C}O_DIRECT${C} 绕过页缓存（数据库常用）。
- **/proc/meminfo dirty 页**：${C}Dirty${C} / ${C}Writeback${C} 反映待写回数据量；脏页过多时写压力集中爆发，表现为周期性卡顿。
- **挂载选项**：${C}noatime${C}（减少 atime 更新写）、${C}data=ordered${C}、${C}discard/trim${C}（SSD）、${C}nosuid/noexec/nodev${C}（安全加固）。
- **文件系统选择**：ext4 通用稳妥；XFS 大文件与高并发元数据操作更好；overlayfs 用于容器镜像分层；tmpfs 纯内存（重启即失）。

## 三、实战

${F}bash
# 空间与 inode 双查（有空间但写不进 → 多半 inode 耗尽）
df -h
df -i

# 找出「已删除但仍占空间」的文件（进程仍持有 fd）
lsof +L1
lsof | grep deleted

# 磁盘 IO 实时观测：tps / await / %util（await 高 = 排队严重）
iostat -xz 1

# 进程级 IO 排行
iotop -oPa

# 定位到底是谁在写
dmesg -T | tail            # 看内核是否有 IO 错误/掉盘
${F}

**破坏性操作前后必须 sync（脆弱 vs 正确）**：
${F}bash
# ❌ 扩容/迁移前不刷盘，页缓存里的数据可能丢失或元数据不一致
umount /data

# ✅ 先刷盘再操作，确保数据落盘
sync
umount /data
${F}

**写日志的正确姿势**：
${F}java
// ❌ 每条日志都 fsync：吞吐崩到个位数
for (String line : lines) { write(line); fsync(); }

// ✅ 批量写 + 定时/定量刷盘（多数场景足够安全，性能高一个量级）
BufferedWriter w = new BufferedWriter(new FileWriter(f));
for (String line : lines) w.write(line);
w.flush();
channel.force(false);   // 批量结束统一刷盘
${F}

## 四、覆盖广度

- **inode 耗尽**：海量小文件（会话、缓存碎片、邮件队列）会把 inode 用光，${C}df -h${C} 有空间但 ${C}df -i${C} 已满。解决要靠减少小文件或重建时调大 inode 密度。
- **overlayfs 写放大**：容器在可写层修改文件会先复制整个文件（copy-up），频繁写会显著放大 IO 并占满节点磁盘；日志与数据必须挂 volume。
- **WAL**：数据库把随机写转为「顺序追加日志 + 后台刷盘」，是性能与持久性的平衡术（见 DBA 方向的 redo/undo）。
- **RAID 与冗余**：RAID0 提速无冗余、RAID1 镜像、RAID5/6 校验；写惩罚与重建窗口要纳入容量规划。
- **SSD 特性**：无寻道但需 TRIM 回收、有擦写寿命（DWPD/TBW）；写放大与对齐影响寿命与性能。

## 五、常见误区

1. **以为 write 成功就持久**：没 ${C}fsync${C}，宕机即丢数据；重要数据必须显式刷盘。
2. **空间写不进只查 df -h**：忘了 ${C}df -i${C}，inode 耗尽照样写不进。
3. **删大文件不释放空间**：进程仍持 fd，需重启进程或 ${C}> file${C} 截断。
4. **在容器可写层猛写**：overlay 写放大 + 占满节点磁盘，影响同节点其他容器。
5. **到处 fsync**：每条日志都刷盘，性能断崖；应按业务重要性分级。
6. **把 tmpfs 当持久存储**：重启即丢，误用会丢数据。

## 六、自检清单

- [ ] 能解释 inode 与 dentry 的分工，以及「删文件不释放空间」的原因
- [ ] 知道 write 与 fsync 的语义差别，能为不同数据选择持久化策略
- [ ] 空间异常时会同时看 ${C}df -h${C} 与 ${C}df -i${C}
- [ ] 会用 ${C}iostat${C} / ${C}iotop${C} / ${C}lsof +L1${C} 定位 IO 瓶颈与残留句柄
- [ ] 知道 overlayfs 写放大与容器必须挂 volume 的原因

## 七、延伸

- 精读 TLPI 第 13/14 章（文件 IO 缓冲）与第 15 章（文件属性）。
- 阅读 ext4 / XFS 官方文档的「日志与一致性」章节。
- 实践：用 ${C}fio${C} 对比同一块盘上顺序写与随机写的 IOPS/带宽，再用 ${C}iostat${C} 观察 await 与 %util。
`
          },
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "能解决复杂底层问题：内核网络栈调优、高并发网络模型、容器网络原理、系统调用与性能剖析。",
        chapters: [
          {
            id: "kernel-net-tune",
            title: "内核网络栈与调优",
            minutes: 24,
            updated: "2026-09-17",
            applies: "Linux 内核网络栈 / sysctl",
            tags: ["内核", "网络调优", "参数", "中断"],
            terms: ["网络", "内核", "TCP", "调优"],
            body: `
> **官方文档基线**：[man7: tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html) · [man7: socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html) · [Linux kernel: Scaling](https://www.kernel.org/doc/Documentation/networking/scaling.txt) · [NAPI](https://www.kernel.org/doc/Documentation/networking/napi.txt) · [/proc/sys/net 文档](https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt)

## 一、原理与底层机制

### 1.1 一个包进入内核的完整旅程
${F}text
网卡收到帧
 → DMA 写入内核环形缓冲区（RX ring）
 → 触发硬中断（上半部：极简，仅记录）
 → 软中断 NET_RX_SOFTIRQ（NAPI：批量轮询收包）
 → 链路上送：以太网 → IP（校验、路由）→ TCP（重组、找 socket）
 → 写入该 socket 的接收缓冲区
 → 唤醒等待的应用（epoll 通知）→ 应用 read 拷贝到用户态
${F}
**每一步都可能成为瓶颈**：硬中断风暴（小包）、软中断挤在单核、协议栈处理开销、接收缓冲区不足丢包、应用读得太慢。

### 1.2 中断与 NAPI
早期每个包一次硬中断，高 PPS 下 CPU 全耗在中断上。**NAPI（New API）** 改为「第一个包触发硬中断，随后关闭中断、由软中断轮询批量收包」，大幅降低高负载下的中断开销。

### 1.3 多队列与 RSS / RPS / RFS
- **RSS（Receive Side Scaling）**：网卡硬件把不同流按哈希分到多个 RX 队列，各队列对应不同 CPU 核，避免单核软中断打满。
- **RPS**：软件模拟 RSS，把包分发给多个核（网卡不支持多队列时用）。
- **RFS**：把包直接投递到「应用正在运行的核」，提升缓存命中率。
- **中断亲和**：用 ${C}irqbalance${C} 或手动把队列中断绑到固定核。

### 1.4 队列与缓冲区：连接被拒的隐蔽元凶
一次握手要通过两个队列：
- **半连接队列（SYN queue）**：收到 SYN、未完成握手。
- **全连接队列（accept queue）**：握手完成、等待应用 accept。上限由 ${C}listen(fd, backlog)${C} 与 ${C}net.core.somaxconn${C} 的**较小值**决定。

队列溢出时：新连接被丢弃（客户端表现为超时/重传），或服务端回 RST。**网关/Proxy 类服务在高并发下「偶发连不上」，十有八九是队列太小**。

## 二、规范与标准

- **/proc/sys/net 参数**（用 ${C}sysctl -w${C} 临时改，写 ${C}/etc/sysctl.conf${C} 或 ${C}/etc/sysctl.d/*.conf${C} 持久化）。
- **TCP 内存**：${C}net.ipv4.tcp_rmem${C} / ${C}tcp_wmem${C} 各三个值 = min / default / max；长肥管道（高带宽高延迟）需调大 max 才能跑满带宽（BDP = 带宽 × RTT）。
- **拥塞算法**：${C}net.ipv4.tcp_congestion_control${C} 可切 cubic / bbr；${C}net.ipv4.tcp_available_congestion_control${C} 看可用列表。
- **Fast Open**：${C}net.ipv4.tcp_fastopen=3${C} 允许 SYN 携带数据（TFO），减少一次 RTT。
- **完整连接队列**：${C}net.core.somaxconn${C}；半连接：${C}net.ipv4.tcp_max_syn_backlog${C}。

## 三、实战

${F}bash
# —— 队列与端口 ——
sysctl -w net.core.somaxconn=65535            # accept 队列上限
sysctl -w net.ipv4.tcp_max_syn_backlog=65535  # 半连接队列上限
sysctl -w net.ipv4.ip_local_port_range="1024 65535"  # 短连接客户端端口范围

# —— TIME_WAIT（仅客户端有效；NAT 环境不要开 tw_recycle）——
sysctl -w net.ipv4.tcp_tw_reuse=1

# —— 缓冲区：长肥管道吞吐 ——
sysctl -w net.ipv4.tcp_rmem="4096 87380 67108864"
sysctl -w net.ipv4.tcp_wmem="4096 65536 67108864"

# —— 拥塞算法与 TFO ——
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.ipv4.tcp_fastopen=3

# 查看是否发生「全连接队列溢出」（Send-Q 含义随状态而变，配合内核计数看）
ss -lnt
nstat -az | grep -iE "ListenOverflows|ListenDrops|TCPBacklogDrop"
${F}

**观测瓶颈的工具组合**：
${F}bash
# 软中断分布：看 NET_RX 是否集中在单个核
mpstat -P ALL 1
cat /proc/net/softnet_stat                 # 第 2 列增长 = 包被丢弃

# 网卡队列与丢包统计
ethtool -S eth0 | grep -iE "drop|error|miss"
ethtool -l eth0                            # 队列数
ethtool -L eth0 combined 8                 # 调大队列数

# 协议栈级别统计（重传、错误、丢弃）
nstat -az | head -40
ss -s
${F}

## 四、覆盖广度

- **GRO/GSO/TSO**：TSO 把大块数据交给网卡分段（减 CPU），GRO 把收到的包合并成大的（减协议栈开销）。虚拟化/overlay 下如果 GRO 合并了不同流的包会造成误解，故有 ${C}tx-*${C} 关闭的场景（如 K8s overlay 常见调优）。
- **XDP / eBPF**：在网卡驱动最早阶段处理包（XDP），可实现线速 DDoS 过滤、负载均衡（如 Cilium 的部分能力），绕过部分协议栈开销。
- **RPS/RFS 配置**：${C}/sys/class/net/eth0/queues/rx-0/rps_cpus${C}，把软中断分散到多核。
- **中断合并（interrupt coalescing）**：${C}ethtool -C${C} 调整合并参数，在延迟与 CPU 之间权衡（低延迟场景关合并）。
- **调优方法论**：**先量化、再单点改动、改完复测**。不要抄一份「通用内核参数」无脑套——别人的瓶颈不是你的瓶颈。

## 五、常见误区

1. **盲开 tcp_tw_recycle**：NAT 环境下会随机丢连接，内核 4.12 已移除；用 ${C}tcp_tw_reuse${C} 即可。
2. **somaxconn 没调，高并发丢连接**：网关/Proxy 尤甚，且现象是「偶发超时」，很难查。
3. **参数改了没持久化**：${C}sysctl -w${C} 重启即失效，必须写配置文件。
4. **单核软中断打满**：没开多队列 / RSS，小包流量就能把一核吃满，其他核闲着。
5. **buffer 一味调大**：${C}rmem/wmem${C} 过大会增加缓冲延迟（bufferbloat），按业务权衡。
6. **只看带宽不看 PPS**：小包场景下 PPS 才是瓶颈，带宽远未打满但 CPU 已满。

## 六、自检清单

- [ ] 能画出包从网卡到应用的内核路径，并指出各阶段瓶颈
- [ ] 能解释 RSS/RPS/RFS 与中断亲和分别解决什么问题
- [ ] 能区分半连接队列与全连接队列，并知道对应的 sysctl
- [ ] 会用 ${C}nstat${C} / ${C}ss -lnt${C} / ${C}/proc/net/softnet_stat${C} 观测队列溢出与软中断
- [ ] 坚持「先量化后调优、一次改一处、改完复测」

## 七、延伸

- 阅读 Linux 内核文档 ${C}Documentation/networking/scaling.txt${C} 与 ${C}napi.txt${C}。
- 精读 ${C}ip-sysctl.txt${C} 中 TCP 相关条目，理解每个参数的语义与默认值。
- 实践：用 ${C}tcpdump${C} + ${C}nstat${C} + ${C}mpstat${C} 组合，压测定位一次「连接偶发超时」的根因。
`
          },
          {
            id: "high-conn-model",
            title: "高并发网络模型",
            minutes: 24,
            updated: "2026-09-17",
            applies: "C10K / C10M · Reactor · 协程",
            tags: ["高并发", "网络模型", "架构", "Reactor"],
            terms: ["高并发", "epoll", "网络模型", "IO"],
            body: `
> **官方文档基线**：[C10K 问题（Dan Kegel）](http://www.kegel.com/c10k.html) · [C10M 问题](http://c10m.robertgraham.com/) · [Netty 线程模型](https://netty.io/wiki/user-guide-for-4.x.html) · [Go netpoller 设计](https://go.dev/src/runtime/netpoll.go) · [DPDK](https://www.dpdk.org/)

## 一、原理与底层机制

### 1.1 从 C10K 到 C10M
- **C10K**（单机 1 万并发连接）：传统「一连接一线程」撑不住，催生**事件驱动 + epoll**（Nginx、Node、Redis）。
- **C10M**（1 千万）：内核协议栈本身成为瓶颈，要在**内核旁路（DPDK / XDP / eBPF）**、用户态协议栈、批量 syscall、零拷贝上做文章。

### 1.2 主流并发模型对比
| 模型 | 代表 | 思路 | 适用 |
|---|---|---|---|
| 多进程 | 早期 Apache prefork | 一连接一进程 | 稳定但重、隔离好 |
| 多线程阻塞 | 传统 BIO 服务 | 一连接一线程 | 连接少、实现直观 |
| 事件驱动（Reactor） | Nginx / Node / Redis | 少线程 + epoll | 高并发 IO |
| 协程（用户态） | Go / Java 虚拟线程 | 海量轻量协程 | 高并发 + 同步写法 |
| 内核旁路 | DPDK / XDP | 绕开内核协议栈 | 极致吞吐（NFV/网关） |

### 1.3 Reactor 模式
${F}text
         ┌──────────────┐
事件源 → │ 多路复用器    │ → 事件分发器 → Handler（读/解码/业务/编码/写）
(epoll)  │ (Reactor)    │
         └──────────────┘
${F}
- **单 Reactor 单线程**：Redis 主线程，纯内存无锁、极简，但单核上限。
- **单 Reactor 多线程**：IO 在主线程，业务丢线程池（避免 compute 阻塞 IO）。
- **主从 Reactor**：主 Reactor 只 accept，子 Reactor 各管一组连接做 IO——**Netty 的 boss/worker 模型**。

### 1.4 协程：把「同步写法」还给高并发
Go 的 goroutine 是**用户态调度**，每个初始栈仅几 KB，单进程跑几十万协程；上层写的是「一行行同步调用」，由运行时（GMP 模型）自动映射到 OS 线程并在阻塞点让出。Java 虚拟线程（JEP 444）思路相同：**用同步的代码风格获得异步的伸缩性**，大幅降低心智负担。

## 二、规范与标准

- **背压（backpressure）**：上游生产速率 > 下游消费速率时必须限流/缓冲/丢弃，否则内存被冲爆。手段：有界队列、令牌桶、响应式流的 ${C}request(n)${C}。
- **连接与线程池**：用连接池复用（避免 TIME_WAIT 与建连开销）；线程/协程池上限按「IO 密集放大、CPU 密集≈核数」设定。
- **超时与熔断**：每一层调用都要有超时；下游持续失败要熔断，避免线程被拖死形成雪崩。
- **限流算法**：固定窗口、滑动窗口、漏桶、令牌桶；网关层做全局限流，服务层做实例级限流。

## 三、实战

**Netty 主从 Reactor（生产常用骨架）**：
${F}java
EventLoopGroup boss = new NioEventLoopGroup(1);      // 只管 accept
EventLoopGroup worker = new NioEventLoopGroup();      // 管 IO 读写
ServerBootstrap b = new ServerBootstrap();
b.group(boss, worker)
 .channel(NioServerSocketChannel.class)
 .option(ChannelOption.SO_BACKLOG, 1024)              // 全连接队列
 .childOption(ChannelOption.TCP_NODELAY, true)        // 关 Nagle，降小包延迟
 .childOption(ChannelOption.SO_KEEPALIVE, true)
 .childHandler(new ChannelInitializer<SocketChannel>() {
     protected void initChannel(SocketChannel ch) {
         ch.pipeline().addLast(new HttpServerCodec(), new HttpObjectAggregator(1 << 20), new BizHandler());
     }
 });
b.bind(8080).sync();
${F}

**Go 高并发服务（同步写法 + 运行时调度）**：
${F}go
// 每个连接一个 goroutine，写法同步，运行时自动调度到有限 OS 线程
ln, _ := net.Listen("tcp", ":8080")
for {
    conn, err := ln.Accept()
    if err != nil { continue }
    go func(c net.Conn) {     // 几十万连接也能扛，无需手写 epoll
        defer c.Close()
        handle(c)
    }(conn)
}
${F}

## 四、覆盖广度

- **Reactor vs Proactor**：Reactor 是「就绪后应用自己读写」，Proactor 是「内核完成 IO 后通知你」（Windows IOCP、Linux io_uring）。Go netpoller 底层用 epoll，但给上层呈现的是同步风格。
- **Netty 线程模型要点**：boss 只 accept；worker 数量默认 = 2×核数；**严禁在 EventLoop 里执行耗时阻塞操作**，重活丢业务线程池。
- **服务网格 sidecar 开销**：每个 Pod 一个代理，网络多一跳，需评估延迟与资源成本；eBPF 数据面（如 Cilium）可减少跳数。
- **内核旁路**：DPDK 用轮询替代中断、用户态驱动、零拷贝，适合 NFV/负载均衡；代价是独占核、复杂度高。
- **容量规划**：连接数 ≠ 吞吐。要按「并发连接 × 每连接内存 + PPS + 带宽」三个维度分别估算。

## 五、常见误区

1. **在高并发服务里用阻塞 IO**：一次同步调用卡住整个事件循环，所有连接跟着等。
2. **EventLoop 里跑慢任务**：慢 SQL / 大文件读写在 IO 线程里执行，直接拖垮该线程上的所有连接。
3. **忘记背压**：上游猛灌、下游慢，内存被冲爆后被 OOM Kill。
4. **把单线程 Reactor 当万能**：单线程只适合纯内存快操作（Redis），compute 密集必须配线程池。
5. **盲目追求 C10M**：绝大多数业务到不了那个量级，epoll + 合理架构足够，先别过度设计。
6. **协程无脑起**：协程虽轻，但无上限地起仍会耗尽内存（每个仍有栈与对象），要用有界并发。

## 六、自检清单

- [ ] 能对比多进程/多线程/Reactor/协程/内核旁路五种模型的取舍
- [ ] 能画出主从 Reactor 结构并说明 boss 与 worker 的分工
- [ ] 能解释协程为何能「同步写法、异步伸缩」
- [ ] 知道背压的必要性与至少三种限流手段
- [ ] 会为高并发服务设定合理的超时、熔断与线程池上限

## 七、延伸

- 阅读 Dan Kegel 的 C10K 原文，理解问题演进的历史脉络。
- 精读 Netty 官方线程模型文档与 Go netpoller 源码注释。
- 实践：用同一台机器压测「BIO 线程池 / Netty / Go goroutine」三种实现，对比 QPS 与 P99 延迟。
`
          },
          {
            id: "container-net",
            title: "容器网络原理",
            minutes: 24,
            updated: "2026-09-17",
            applies: "Docker / Kubernetes 网络",
            tags: ["容器", "网络", "CNI", "K8s"],
            terms: ["容器", "网络", "Docker", "CNI"],
            body: `
> **官方文档基线**：[man7: network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html) · [veth(4)](https://man7.org/linux/man-pages/man4/veth.4.html) · [Docker 网络文档](https://docs.docker.com/network/) · [CNI 规范](https://github.com/containernetworking/cni) · [Kubernetes 网络模型](https://kubernetes.io/docs/concepts/services-networking/)

## 一、原理与底层机制

### 1.1 网络命名空间：容器网络的起点
每个容器拥有独立的**网络命名空间（netns）**——自己的网卡、IP、路由表、arp 表、iptables、端口空间。所以「两个容器监听同一端口」不冲突，因为它们在各自的命名空间里。

### 1.2 veth pair + 网桥：把容器接出去
- **veth pair** 是一对「虚拟网线」，一端在容器 netns（如 eth0），另一端在宿主机的网桥（如 docker0）。**从一端发出的帧从另一端出来**。
- **网桥（bridge）** 在宿主机上做二层转发，把多个容器的 veth 接在一起，并按需转发到外部网卡。

${F}text
容器 netns                宿主机
  eth0  ──veth pair──▶  veth-abc ┐
  eth0  ──veth pair──▶  veth-def ┼─ docker0（网桥）──▶ eth0 ──▶ 外网
                                  ┘
${F}

### 1.3 出网靠 NAT
容器访问外网：源 IP 是容器私网地址，经宿主机的 **SNAT（MASQUERADE）** 改写成宿主机 IP 出网。这正是 iptables 在容器网络里举足轻重的原因。

### 1.4 Docker 网络模式
| 模式 | 说明 | 典型用途 |
|---|---|---|
| bridge（默认） | 连 docker0，NAT 出网 | 常规应用 |
| host | 共享宿主机 netns，端口直接用 | 性能敏感、需裸端口 |
| none | 无网络 | 离线计算 |
| container:xxx | 共享指定容器的 netns | 边车 / 调试 |
| overlay | 跨主机虚拟网络（Swarm/K8s CNI） | 集群 |

### 1.5 K8s 网络模型与 CNI
K8s 的网络「三约法」：① **所有 Pod 可直接互通**（无需 NAT，扁平网络）；② **Pod 重建 IP 可变，但命名空间内所有容器共享同一 IP**；③ **Service 有稳定虚拟 IP**。实现靠 **CNI 插件**在 Pod 沙箱（pause 容器）的 netns 上插 veth、分配 IP、写路由。

## 二、规范与标准

- **CNI 规范**：定义容器运行时如何调用插件（ADD/DEL/CHECK），输入输出为标准 JSON；插件负责 veth 创建、IPAM、路由。
- **Service 负载均衡**：kube-proxy 有 **iptables 模式**（规则随 Service 数线性膨胀，大规模下匹配变慢）与 **IPVS 模式**（哈希表，O(1)，大规模更稳）。
- **NetworkPolicy**：默认「全通」，需显式声明入/出白名单；**这要求 CNI 支持策略**（Calico/Cilium 支持，Flannel 默认不支持）。
- **MTU**：overlay 封装（如 VXLAN）会额外占用字节，Pod MTU 必须相应调小（常见 1450/1440），否则大包被丢或分片。

## 三、实战

${F}bash
# 列举 Docker 网络与容器地址
docker network ls
docker network inspect bridge
docker inspect -f '{{.NetworkSettings.IPAddress}}' <container>

# 直接在宿主机的 netns 里操作容器网络命名空间（调试绝招）
pid=$(docker inspect -f '{{.State.Pid}}' <container>)
nsenter -t $pid -n ip addr
nsenter -t $pid -n ss -lntp

# 抓容器网卡上的包
nsenter -t $pid -n tcpdump -i eth0 -nn

# K8s：查 Pod IP、Service、Endpoints 与 DNS
kubectl get pod -o wide
kubectl get endpoints <svc>          # 为空 = 没有就绪后端
kubectl exec -it <pod> -- nslookup my-svc
${F}

**排查容器「连不上」的标准顺序**：
${F}text
1) Pod 是否 Running/Ready？→ kubectl get pod
2) 目标 Service 有 Endpoints 吗？→ keep-alive 的 readinessProbe 是否通过
3) 从源 Pod 直连目标 Pod IP 通吗？→ 通 = 网络/CNI 正常，问题在 Service 层
4) DNS 能解析吗？→ nslookup，查 CoreDNS
5) 跨节点才不通？→ 查 MTU / NetworkPolicy / 路由
${F}

## 四、覆盖广度

- **CNI 插件选型**：**Flannel**（简单 VXLAN，性能一般，适合小集群）、**Calico**（BGP 路由或 VXLAN，支持 NetworkPolicy，性能好）、**Cilium**（基于 eBPF，可观测性与安全强，新项目常见首选）。
- **overlay vs underlay**：overlay（VXLAN/Geneve）跨三层网络封装，部署简单但有封装开销；underlay（BGP 直连路由）性能好但需网络设备配合。
- **Service 类型**：ClusterIP（内部）、NodePort（节点端口）、LoadBalancer（云 LB）、ExternalName（CNAME）。Ingress 提供七层路由与 TLS 卸载。
- **CoreDNS**：集群内服务发现的解析器，Pod 的 ${C}/etc/resolv.conf${C} 指向它；解析失败常见于 CoreDNS 副本不足或网络策略拦截。
- **eBPF 数据面**：Cilium 用 eBPF 替代大量 iptables 规则，减少规则膨胀与跳数，提升可观测性。

## 五、常见误区

1. **两个容器端口冲突**：在 host / container 模式下会冲突，bridge 模式各占命名空间才不冲突。
2. **MTU 不匹配导致偶发大包丢失**：overlay 下没调小 MTU，小请求正常、大响应超时——疑难网络问题先查 MTU。
3. **NetworkPolicy 以为默认拒绝**：实际默认**全通**，不写策略等于不设防。
4. **Service 没 Endpoints 就访问**：readsinessProbe 未通过则 Endpoints 为空，访问 Service IP 必然失败。
5. **硬编码 Pod IP**：Pod 重建 IP 会变，必须用 Service / DNS 名字访问。
6. **只在客户端容器抓包**：跨节点问题要在两端 + 网桥/隧道分别抓，单点抓包容易误判。

## 六、自检清单

- [ ] 能画出 veth pair + 网桥 + NAT 的容器出网路径
- [ ] 能解释 K8s 网络三约法与 CNI 插件的角色
- [ ] 会用 ${C}nsenter${C} 进入容器 netns 做 ip/ss/tcpdump 调试
- [ ] 知道 kube-proxy 的 iptables 与 IPVS 模式差异及适用规模
- [ ] 排查容器网络遵循「Pod 就绪 → Endpoints → Pod 直连 → DNS → 跨节点 MTU/策略」

## 七、延伸

- 精读 man7 的 ${C}network_namespaces(7)${C} 与 ${C}veth(4)${C}，手动用 ${C}ip${C} 命令搭一个容器网络。
- 阅读 CNI 规范与 Calico / Cilium 官方架构文档，理解 overlay 与 eBPF 数据面的差异。
- 实践：在一个多节点集群里故意把 Pod MTU 调错，用 ${C}ping -M do -s${C} 复现并定位「小包通、大包断」。
`
          },
          {
            id: "syscall-profiling",
            title: "系统调用与性能剖析",
            minutes: 22,
            updated: "2026-09-17",
            applies: "perf / strace / eBPF（bcc / bpftrace）",
            tags: ["性能", "剖析", "syscall", "eBPF"],
            terms: ["性能", "syscall", "strace", "perf"],
            body: `
> **官方文档基线**：[man7: perf](https://man7.org/linux/man-pages/man1/perf.1.html) · [strace(1)](https://man7.org/linux/man-pages/man1/strace.1.html) · [syscall(2)](https://man7.org/linux/man-pages/man2/syscall.2.html) · [bcc 工具集](https://github.com/iovisor/bcc) · [bpftrace](https://github.com/bpftrace/bpftrace) · Brendan Gregg《Systems Performance》

## 一、原理与底层机制

### 1.1 系统调用：用户态与内核态的边界
你写的 ${C}read/write/open/connect/mmap${C} 并不会直接碰硬件，而是通过 ${C}syscall${C} 指令**陷入内核**由内核代办。每次陷入都要：切换特权级、保存/恢复寄存器、可能切换栈与地址空间校验，**成本远超普通函数调用**。频繁或无谓的 syscall 是隐形性能杀手。

### 1.2 采样式剖析（CPU 火焰图）
${C}perf${C} 以固定频率（如 99Hz）中断并记录当前调用栈，统计后生成**火焰图**：
- 纵轴 = 调用栈（谁调用了谁），横轴 = 采样占比（宽度 = 耗时占比）；
- 找**最宽的平顶**就是最耗时的路径，别被最顶端的小尖迷惑；
- 采样开销低（~1%），可在生产短时使用。

### 1.3 eBPF：不改代码看清内核态
eBPF 允许在**内核事件点**（syscall 入口/出口、调度、IO、TCP 状态机）安全挂载沙箱程序，做低开销观测与统计。工具层：${C}bcc${C}（Python 封装，${C}execsnoop/biostack/tcpretrans${C} 等）、${C}bpftrace${C}（一行式 DSL）。**这是现代 Linux 性能分析的主力**。

### 1.4 CPU 型 vs 延迟型问题
- **CPU 型**：热在 CPU 上跑，用 ${C}perf${C} + 火焰图找热点函数。
- **延迟/等待型**：线程在等（锁、IO、网络），CPU 不高但慢，需要 **off-CPU 分析**（${C}offcputime${C} / ${C}wakeuptime${C}），看「被谁阻塞、等了多久」。

## 二、规范与标准

- **syscall 语义**：了解常见 syscall 的代价——${C}read/write${C}（可批量减少次数）、${C}stat${C}（元数据查询最频繁）、${C}mmap${C}（替代大量小 read）、${C}futex${C}（锁的底层）。
- **/proc 与 /sys**：进程态（${C}/proc/<pid>/status${C}）、IO（${C}io${C}）、调度（${C}schedstat${C}）、网络（${C}/proc/net/*${C}）都是零依赖观测源。
- **perf 权限**：${C}perf_event_paranoid${C} 控制非 root 可用的采样能力；容器内 perf 需挂载与权限配合。
- **符号问题**：程序 strip 后火焰图全是问号，需保留 debug 符号或单独存 ${C}.debug${C} 文件。

## 三、实战

${F}bash
# —— strace：看程序到底在调什么 ——
strace -p <pid>                         # 实时跟踪
strace -c -p <pid>                      # 按 syscall 汇总次数/耗时（先看这个）
strace -f -e trace=network ./app        # 只跟网络相关，含子进程
strace -T -tt -p <pid>                  # 打时间戳与耗时，找慢调用
# 经典发现：CPU 不高却慢 → 每秒几万次 stat/open（无谓的文件探测）

# —— perf：CPU 热点与火焰图 ——
perf top -p <pid>                                  # 实时热点
perf record -F 99 -g -p <pid> -- sleep 30          # 采样 30s
perf report                                        # 文本报告
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg   # 火焰图

# —— eBPF：低开销内核态观测 ——
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { @[comm] = count(); }'
execsnoop-bpfcc                 # 看有没有进程被频繁拉起
biolatency-bpfcc                # 块设备 IO 延迟分布
tcpretrans-bpfcc                # TCP 重传

# —— 等待/阻塞分析 ——
offcputime-bpfcc -p <pid> 5     # 看线程被谁阻塞（延迟型问题）
${F}

**先分清问题类型，再选工具**：
${F}text
CPU 高吗？
 ├─ 高  → perf + 火焰图（CPU 型，找热点函数）
 └─ 不高但慢 → 看 IO/锁/网络等待
               ├─ offcputime（被谁阻塞）
               ├─ biolatency（IO 延迟）
               └─ strace -c / tcpretrans（syscall 与网络）
${F}

## 四、覆盖广度

- **perf 常用子命令**：${C}perf stat${C}（总体计数）、${C}perf top${C}、${C}perf record/report${C}、${C}perf trace${C}（类 strace）、${C}perf sched${C}（调度延迟）。
- **Brendan Gregg 的 60 秒检查清单**：${C}uptime / dmesg / vmstat / mpstat / pidstat / iostat / free / sar / top${C} 一轮快速体检，先看全局再钻细节。
- **eBPF 工具矩阵**：CPU（${C}profile${C}）、内存（${C}memleak${C}）、IO（${C}biolatency/fileslower${C}）、网络（${C}tcpretrans/tcpconnect${C}）、调度（${C}runqlat/offcputime${C}）。
- **容器的观测**：容器内 perf/eBPF 需权限与内核版本支持；宿主机侧用 ${C}cgroup${C} 过滤目标容器更可靠。
- **持续剖析（continuous profiling）**：把采样常态化（如 Parca、Pyroscope），按版本/时间段对比，定位回归。

## 五、常见误区

1. **strace 上生产忘了关**：${C}strace${C} 会显著拖慢目标进程（尤其 ${C}-f${C} 多线程），用完立即停。
2. **只盯用户态 CPU**：慢其实在内核态（syscall 多、锁、IO 等待），要看 ${C}perf${C} 的 [kernel] 符号与 syscall 维度。
3. **忽略无谓 syscall**：循环里 stat/open、重复 gettimeofday，攒起来相当可观，应批量或缓存。
4. **火焰图看错方向**：纵轴是「谁调谁」、横轴是「占比」，找最宽的平顶，不要只看栈顶。
5. **perf 没符号**：strip 后全是问号，编译保留 debug 符号。
6. **拿采样当精确计数**：采样有统计误差，精确计数要用 ${C}perf stat${C} 或 eBPF 计数。

## 六、自检清单

- [ ] 能解释一次 syscall 的完整开销与「无谓 syscall」的危害
- [ ] 会先用 ${C}strace -c${C} 看 syscall 分布，再用 ${C}perf${C} 定位 CPU 热点
- [ ] 能区分 CPU 型与延迟型问题，并选对工具（火焰图 vs off-CPU）
- [ ] 能写一条 ${C}bpftrace${C} 一行命令观测某类事件
- [ ] 知道生产上 strace/perf 的开销边界与符号要求

## 七、延伸

- 精读 Brendan Gregg《Systems Performance》第 4–6 章（工具方法论）。
- 浏览 bcc 的 tools 目录，逐个了解每个小工具的适用场景。
- 实践：对同一个「CPU 不高但请求慢」的服务，用 ${C}offcputime${C} + ${C}biolatency${C} 定位到真实的等待来源。
`
          }
        ]
      }
    ]
  };

  window.NETWORK = NETWORK;
})();
