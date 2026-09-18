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

<!--dd:tcp-ip-model-->

## 🔬 深挖：分层模型的工程映射与协议栈收包路径

### 一、OSI 七层 vs TCP/IP 四层：把抽象落到代码上

| OSI | TCP/IP | 实际载体 | 你写的代码在哪一层 |
|---|---|---|---|
| 应用/表示/会话 | 应用层 | HTTP、DNS、gRPC、自定义协议 | 业务代码 |
| 传输 | 传输层 | TCP、UDP、QUIC | Socket API（send/recv） |
| 网络 | 网际层 | IP、ICMP、路由 | 基本不碰 |
| 数据链路/物理 | 网络接口层 | 以太网、Wi-Fi、驱动、网卡 | 完全不碰 |

**分层的真实价值是「依赖倒置」**：应用只依赖 socket 抽象，不关心下面是以太网还是 Wi-Fi。但分层也带来代价 —— 每一层都要加头部：

${F}text
以太网帧头 14 字节 + IP 头 20 字节 + TCP 头 20 字节 = 54 字节
加上帧尾 FCS 4 字节 = 58 字节
一个 100 字节的 HTTP 请求体，实际线上传输 158 字节 -> 开销 58%
这就是小包场景要关注 Nagle、批量合并、HTTP/2 多路复用的原因
${F}

### 二、MTU 与分片：最经典的性能陷阱

${F}text
MTU（最大传输单元）以太网默认 1500 字节
MSS = MTU - IP头(20) - TCP头(20) = 1460 字节（TCP 单段最大数据量）
问题来源：
  1) 应用写 4000 字节 -> TCP 拆成 3 段（1460+1460+1080），正常
  2) 路径中某跳 MTU 更小（如 VPN/隧道 1400）且 DF 位置位
     -> 路由器回 ICMP "需要分片"，若 ICMP 被防火墙拦截
     -> 表现为"小请求正常、大请求卡死"，极难排查

诊断与规避：
  ping -M do -s 1472 <ip>    # 1472+28=1500，试着逐步减小找真实路径 MTU
  ip link show               # 看本机 MTU
  内核参数：net.ipv4.tcp_mtu_probing = 1（自动探测，缓解黑洞问题）
${F}

**容器与隧道环境必须显式下调 MTU**（常见 1400 或 1450），否则表现为「偶发大包超时」。这是 K8s 集群里最常见的网络故障之一。

### 三、四元组与「连接」的本质

一条 TCP 连接在内核里由**四元组**唯一标识：

${F}text
(源IP, 源端口, 目的IP, 目的端口)
含义：
  - 同一个客户端可以在不同源端口上建立多条到同一服务的连接
  - 服务端监听 socket 只绑定 (目的IP, 目的端口)，不含源信息
  - 服务端的端口上限由 ip_local_port_range 决定（默认约 32768 个）
  - accept() 返回的新 socket 才是完整的四元组
${F}

${F}bash
# 观察真实连接状态分布（比 netstat 快得多）
ss -s                                  # 汇总统计
ss -tan state established | wc -l      # 已建立连接数
ss -tan state time-wait | wc -l        # TIME_WAIT 数量
ss -tlnp                               # 监听端口与进程
ss -tanp 'dport = :3306'               # 按条件过滤（SS 的过滤器语法很强）
${F}

### 四、Linux 收包全路径（为什么高并发要调软中断）

${F}text
1) 网卡收到帧 -> DMA 写入内存环形缓冲区（Ring Buffer）
2) 网卡发起硬件中断 -> 内核中断处理程序（上半部）只做最少的事
3) 触发软中断 NET_RX_SOFTIRQ -> ksoftirqd 或 NAPI 轮询
4) NAPI 批量轮询收包（避免每包一中断），构建 skb
5) 协议栈处理：链路层 -> IP 层（路由、分片重组）-> TCP 层（查找四元组、序号校验、滑动窗口）
6) 数据放入 socket 接收缓冲区（tcp_rmem 控制）
7) 唤醒等待该 socket 的进程（epoll 就绪）
8) 应用 recv() 拷贝到用户态
${F}

关键洞察：**步骤 1-4 的成本与「包数量」成正比，而不是与「字节数」成正比**。所以：

| 现象 | 含义 | 对策 |
|---|---|---|
| softirq 占用某个 CPU 极高 | 网卡中断集中在一个核 | 开启 RPS/RFS 或调整中断亲和 |
| netstat 有 drops in Ring Buffer | 网卡环形缓冲不够 | 增大 rx/tx ring（ethtool -G） |
| netstat 有 drops in Socket Buffer | 应用读得太慢 | 增大 tcp_rmem；优化应用消费 |
| 大量 retrans | 丢包或拥塞 | 看 tcp_retrans_segs、排查链路 |

### 五、把分层模型用于排障：自下而上定位

${F}text
排查网络问题的固定顺序（每层都通过才往上走）：
  L1 物理/链路  -> ip link 是否 UP、ethtool 是否有错包、光模块告警
  L2 网络层     -> ip addr / ip route、ping、traceroute、能否直达
  L3 传输层     -> ss 看是否有连接、是否 SYN-SENT 卡住（多为防火墙/端口未监听）
  L4 应用层     -> curl -v、看响应码与头部、看证书
  L5 应用逻辑   -> 日志、链路追踪、SQL
经验：按这个顺序走，能在几分钟内排除 80% 的"网络问题"，
      其中大量其实是 L3（安全组/防火墙）或 L5（应用自身超时）。
${F}

### 六、常见误区

1. **「分层是纯粹的抽象，性能与层无关」**。每一次跨层拷贝、每个头部、每次中断都有成本；零拷贝、GSO、GRO 这些优化恰恰是「打破分层」的产物。
2. **「MTU 是固定 1500」**。隧道/容器/PPPoE 场景常常更小，写死 1500 会踩 MTU 黑洞。
3. **「ping 通就说明网络没问题」**。ICMP 通不代表 TCP 端口可达（防火墙可能只放行 ICMP），也不代表带宽/延迟达标。
4. **「连接数就是端口数」**。可用端口受 ${C}ip_local_port_range${C} 与四元组组合限制，且服务端监听端口不消耗客户端端口。
5. **「软中断是内核的事，应用不用管」**。软中断跑满某个 CPU 会直接表现为应用延迟抖动，容器场景下更明显（CPU 限流加剧）。

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

<!--dd:http-detail-->

## 🔬 深挖：HTTP 版本演进、缓存语义与代理行为

### 一、三个版本的性能模型差异

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| 传输层 | TCP | TCP | **QUIC（UDP）** |
| 并发 | 每连接一个请求（需多连接） | 单连接多路复用（Stream） | 单连接多路复用，无 TCP 队头阻塞 |
| 头部 | 文本、重复传输 | HPACK 压缩 + 动态表 | QPACK |
| 队头阻塞 | 应用层严重 | TCP 层仍有（丢包阻塞所有流） | 基本消除 |
| 建连 | TCP 1RTT + TLS 2RTT | 同上（可用 TLS1.3 降到 1RTT） | QUIC 1RTT，0-RTT 复用 |
| 服务端推送 | 无 | 有（Push，实际多被弃用） | 有（同 H2） |

**HTTP/2 并没有解决 TCP 层的队头阻塞**：一个 TCP 段丢失，所有 Stream 都要等它重传。这才是 HTTP/3 换用 QUIC 的根本动机 —— QUIC 在用户态实现流控与重传，各 Stream 独立。

${F}text
HTTP/2 的关键概念：
  Stream   逻辑流，有唯一 ID（客户端发起的为奇数）
  Frame    最小传输单位（HEADERS/DATA/SETTINGS/WINDOW_UPDATE/RST_STREAM）
  流控     连接级 + 流级双窗口，避免单个大流饿死其他流
  优先级   已在新草案中简化，实际浏览器与服务端支持不一
${F}

### 二、缓存语义：把 Cache-Control 指令用对

| 指令 | 作用 | 易错点 |
|---|---|---|
| ${C}max-age=N${C} | 客户端（浏览器）缓存 N 秒 | 只影响浏览器，不影响 CDN |
| ${C}s-maxage=N${C} | 共享缓存（CDN/代理）缓存 N 秒 | 覆盖 max-age，必须与 public 一起才可靠 |
| ${C}no-cache${C} | **可以缓存，但每次必须校验** | 名字有误导性：不是「不缓存」 |
| ${C}no-store${C} | 完全不缓存（含不落盘） | 敏感数据用这个 |
| ${C}private${C} | 只允许浏览器缓存 | CDN 不缓存 |
| ${C}public${C} | 允许共享缓存 | 配合 s-maxage |
| ${C}must-revalidate${C} | 过期后必须校验，不许用陈旧副本 | 与 stale-* 互斥 |
| ${C}immutable${C} | N 秒内绝不校验（即使刷新） | 适合带哈希的静态资源 |
| ${C}stale-while-revalidate=N${C} | 过期后 N 秒内先返旧值并后台更新 | 大幅降低用户等待 |

强缓存 vs 协商缓存的实际流程：

${F}text
强缓存未过期       -> 直接用本地副本，不发请求（最快）
强缓存已过期       -> 发条件请求：
     If-None-Match: <ETag>      -> 服务端比对，未变返 304（无 body）
     If-Modified-Since: <时间>   -> 秒级精度，弱校验
     两者都存在时 ETag 优先
返回 200           -> 用新内容覆盖
${F}

${F}text
# 推荐的静态资源策略（内容哈希命名 + 长缓存 + immutable）
Cache-Control: public, max-age=31536000, immutable

# HTML 入口文件必须短缓存或协商缓存，否则发版不生效
Cache-Control: no-cache

# 接口：默认不缓存；可短暂缓存的用 s-maxage 只缓存在 CDN
Cache-Control: private, no-store
Cache-Control: public, s-maxage=10, stale-while-revalidate=60

# CDN 缓存键要显式声明，否则 Vary/query 会导致命中率暴跌
Vary: Accept-Encoding
${F}

### 三、代理与 hop-by-hop 头

${F}text
端到端头（会被代理转发）：Authorization、Content-Type、Cache-Control...
逐跳头（代理必须消费掉、不再转发）：
  Connection、Keep-Alive、Proxy-Authenticate、Proxy-Authorization、
  TE、Trailer、Transfer-Encoding、Upgrade
实际影响：
  - 自己实现网关时若把 Connection 原样转发，可能引发后端连接异常
  - Transfer-Encoding: chunked 不应同时出现 Content-Length
  - Upgrade 是 WebSocket 握手的核心，网关必须显式支持转发
${F}

### 四、状态码的语义边界（用错会造成重试事故）

| 码 | 语义 | 幂等性含义 | 使用要点 |
|---|---|---|---|
| 200 | 成功 | 是 | 不要用它表达业务失败 |
| 201 | 已创建 | 是 | 应带 Location |
| 202 | 已接受（异步） | 是 | 适合异步任务提交 |
| 204 | 成功但无内容 | 是 | 不要带 body |
| 301/308 | 永久重定向 | 是 | 308 保留方法与 body（301 历史上会改为 GET） |
| 302/307 | 临时重定向 | 是 | 307 保留方法 |
| 400 | 请求错误 | 是（客户端问题） | 重试无意义 |
| 401 / 403 | 未认证 / 无权限 | 是 | 401 应带 WWW-Authenticate；不要混用 |
| 404 | 资源不存在 | 是 | 不要用它表达「参数校验失败」 |
| 409 | 冲突 | 是 | 并发写冲突（如版本号不匹配） |
| 422 | 语义错误 | 是 | 请求格式对但业务校验失败 |
| 429 | 限流 | 是 | 应带 Retry-After |
| 500 | 服务端错误 | **否（不确定）** | 客户端重试可能造成重复写入 |
| 502/504 | 网关/超时 | **否** | 超时不代表未执行 —— 重试必须幂等 |
| 503 | 暂不可用 | 否 | 应带 Retry-After，配合熔断 |

**最关键的一条**：${C}500${C} 与 ${C}504${C} 都**不能**假定服务端「一定没执行」。客户端对这类响应的自动重试，必须配合幂等键（Idempotency-Key）或业务唯一约束，否则就会出现重复下单。

### 五、幂等性与安全方法的严格定义

${F}text
安全（Safe）   ：不改变服务端状态 —— GET、HEAD、OPTIONS、TRACE
幂等（Idempotent）：执行 1 次与 N 次效果相同 —— GET、HEAD、PUT、DELETE、OPTIONS
非幂等         ：POST、PATCH（取决于实现）
工程含义：
  - 用 GET 做「删除/扣款」是严重违规（会被预取、被重试、被 CDN 缓存）
  - PUT 天然幂等 -> 适合「整体替换」语义的资源更新
  - POST 做创建时，用 Idempotency-Key 头 + 服务端去重表实现幂等
${F}

${F}text
POST /v1/orders
Idempotency-Key: 3f9d2c1a-...

服务端处理：
  INSERT INTO idempotency (key, biz_id, status, created_at)
  VALUES (?, ?, 'PROCESSING', NOW())
  唯一键冲突 -> 直接返回上次的结果（不重复创建）
${F}

### 六、常见误区

1. **「no-cache 等于不缓存」**。它表示「必须校验」，${C}no-store${C} 才是完全不缓存。用错会导致每次请求都回源，或者该缓存的没缓存。
2. **「HTTP/2 就没有队头阻塞」**。TCP 层仍有；只有 HTTP/3（QUIC）才在传输层解决。
3. **「304 不需要 ETag」**。没有 ETag 就只能靠 Last-Modified，精度只有秒级，一秒内的多次修改无法区分。
4. **「Transfer-Encoding 与 Content-Length 都写上更保险」**。这是协议禁止的组合，会被代理拒绝（400）。
5. **「GET 请求可以有 body」**。协议未禁止但语义未定义，代理与缓存会忽略它，任何依赖它的设计都是隐患。

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

<!--dd:process-thread-->

## 🔬 深挖：task_struct、上下文切换与调度观测

### 一、进程、线程、协程在内核里的真实差异

${F}text
进程：独立地址空间 + 独立 task_struct + 独立页表
线程：共享地址空间（同一 mm_struct），但各自有独立 task_struct 与内核栈
      -> 所以「线程也只是一个 task」，Linux 不区分进程与线程
协程：完全在用户态，不进内核，切换不涉及系统调用
${F}

${F}c
// Linux 创建线程本质就是 clone() 带一组共享标志
clone(CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND | CLONE_THREAD, ...);
// 共享 VM（地址空间）、文件系统信息、fd 表、信号处理器
// 这和 fork() 的差异就是「共享 vs 复制」的一组位
${F}

关键开销对比（量级，供估算，实际与硬件/内核版本相关）：

| 操作 | 开销量级 | 说明 |
|---|---|---|
| 空函数调用 | 数纳秒 | 基线 |
| 用户态线程切换 | 数十纳秒 | 协程（如 Go goroutine、Java 虚拟线程） |
| 系统调用（如 getpid） | 数百纳秒 | 含特权级切换 |
| 线程上下文切换 | 1~10 微秒 | 含内核态切换、TLB 影响 |
| 进程上下文切换 | 10~100 微秒 | 页表切换，TLB 大面积失效 |

**这解释了为什么高并发网络服务要走「事件驱动 + 少量线程」或「协程」**：C10K 场景若用「一连接一线程」，切换开销本身就吃掉大半 CPU。

### 二、task_struct 里有什么（挑关键字段）

${F}text
state         运行状态：R（运行/就绪）、S（可中断睡眠）、D（不可中断，如等 IO）、
              T（停止，被 SIGSTOP）、Z（僵尸，已退出但未被 wait）
pid / tgid    进程组 ID —— getpid() 返回的是 tgid，同一进程的所有线程 tgid 相同
mm / active_mm 地址空间（线程共享 mm）
fs / files    工作目录与打开的文件表（CLONE_FILES 决定是否共享）
signal        信号处理
sched_class   调度类：CFS（普通）、RT（实时）、DL（deadline）
prio / nice   调度优先级
cputime       累计 CPU 时间（用于统计与 cgroup 限制）
${F}

*D 状态的进程是最难处理的一种*：不可中断睡眠意味着它不响应信号（连 ${C}kill -9${C} 也杀不掉），通常是卡在磁盘 IO 或 NFS。出现大量 D 进程往往意味着存储层故障。

${F}bash
# 查看进程状态分布（D 状态多 -> 存储问题）
ps -eo state | sort | uniq -c
ps -eo pid,ppid,stat,wchan:25,comm | awk '$3 ~ /D/'
# wchan 显示进程当前睡在哪个内核函数上 —— 定位 IO 阻塞的关键
${F}

### 三、上下文切换的成本与测量

${F}bash
# 1) 系统级切换频率
vmstat 1
#   cs    每秒上下文切换次数（含线程与进程）
#   in    每秒中断次数
#   经验：cs 持续 > 10 万/秒 且 CPU 使用率不高 -> 切换本身成为瓶颈

# 2) 看是谁在切换
pidstat -w 1
#   cswch/s    自愿切换（等 IO、等锁 -> 通常是正常的）
#   nvcswch/s  非自愿切换（时间片用完被抢占 -> 说明 CPU 争抢严重）

# 3) 内核态与用户态占比
mpstat -P ALL 1
#   %sys 高 -> 系统调用/内核处理多；%soft 高 -> 网络软中断忙
${F}

**判读要点**：${C}nvcswch/s${C} 高才是问题（说明线程数远超 CPU 能提供的并行度）。${C}cswch/s${C} 高但 CPU 空闲，说明大量时间花在等 IO 或等锁上 —— 应该去优化 IO 而不是加 CPU。

### 四、CFS 调度与 CPU 亲和/NUMA

${F}text
CFS（完全公平调度）：用红黑树按 vruntime 排序，vruntime 增长慢的优先运行
  nice 值：-20（最高优先级）到 19，每级约 1.25 倍 CPU 份额差异
  时间片不是固定值，而是由「目标延迟 / 可运行任务数」推导
  调度粒度参数：sched_min_granularity_ns、sched_latency_ns

实时调度（SCHED_FIFO/SCHED_RR）：抢占普通任务，误用会导致系统「假死」
批量调度（SCHED_BATCH）：降低唤醒频率，适合离线计算
${F}

${F}bash
# CPU 亲和：把进程/线程绑定到指定核，减少缓存与 TLB 抖动
taskset -cp 2,3 <pid>              # 把已运行进程绑到 CPU 2、3
taskset -c 0-3 ./server            # 启动时绑定
# 中断亲和：把网卡中断分散到多核（配合 RPS 使用）
cat /proc/interrupts | grep eth
echo 2 > /proc/irq/<irq>/smp_affinity_list

# NUMA：跨节点访问内存延迟高 1.5~2 倍
numactl --hardware
numactl --cpunodebind=0 --membind=0 ./server   # 绑定 CPU 与内存在同一节点
numastat -p <pid>                              # 看是否发生跨节点访问
${F}

### 五、CPU 使用率的三种口径（别被 top 骗了）

${F}text
%us    用户态
%sy    内核态（系统调用、内核逻辑）
%wa    IO 等待（进程在 D 状态，CPU 其实空闲）
%hi/%si 硬中断/软中断
%st   被宿主机/其他虚拟机偷走的时间（容器与云主机场景务必看这一项）

关键判读：
  %wa 高、%us 低 -> 存储/IO 是瓶颈，加 CPU 没用
  %st 高        -> 资源被邻居抢走，需要换宿主机或申请独占资源
  %us 高且单核打满 -> 应用存在串行化热点（单线程瓶颈或锁竞争）
  %si 高        -> 网络包处理压力大，考虑 RSS/RPS 或多队列
${F}

### 六、常见误区

1. **「线程越多并发越高」**。线程是重资源（默认栈 8MB 虚拟地址空间、内核栈、task_struct）；线程数远超核数后，切换与管理开销会让吞吐下降。
2. **「进程比线程安全所以都该用多进程」**。多进程隔离性好但共享数据要靠 IPC，且内存开销成倍（不共享页缓存之外的数据）；选型要看共享状态的需求。
3. **「CPU 使用率低说明系统不忙」**。可能是大量时间在等 IO（%wa）或等锁；也可能被 CPU 限流（cgroup throttling）压制。
4. **「kill -9 一定能杀死」**。D 状态进程不响应任何信号，只能等 IO 超时或重启。
5. **「协程一定比线程快」**。协程快在切换与内存，但一旦调用阻塞式系统调用就会占住底层线程；必须配合非阻塞 IO 才能真正发挥。

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

<!--dd:memory-basics-->

## 🔬 深挖：虚拟内存、缺页与内存指标的真实含义

### 一、虚拟地址到物理地址：多级页表与 TLB

${F}text
x86-64 四级页表：
  虚拟地址 48 位有效 -> 拆成 5 段：
    [47:39] PGD 索引（9 位）
    [38:30] PUD 索引（9 位）
    [29:21] PMD 索引（9 位）
    [20:12] PTE 索引（9 位）
    [11:0]  页内偏移（12 位 = 4KB 页）
  一次地址翻译理论上要访问 5 次内存（4 级页表 + 数据本身）

TLB（旁路转换缓冲）：缓存"虚拟页 -> 物理页"的映射
  TLB 命中 -> 几乎零成本
  TLB 未命中 -> 页表遍历（page walk），几十到上百纳秒
  大页（HugePage 2MB）可让一个 TLB 项覆盖 512 倍内存 -> 数据库/JVM 常用
${F}

**这就是「大量随机访问于大内存」性能骤降的原因**：TLB 覆盖不住工作集，每次访问都要走页表遍历。优化手段是提升局部性（数据结构紧凑、顺序访问）或使用大页。

### 二、缺页（Page Fault）：内存性能的核心机制

| 类型 | 触发条件 | 成本 | 处理 |
|---|---|---|---|
| Minor Fault（次要缺页） | 页在内存中，但未建立当前进程的映射（如 COW、首次访问堆） | 微秒级 | 只更新页表 |
| Major Fault（主要缺页） | 页不在内存，需从磁盘/swap 读入 | 毫秒级（比 minor 慢 3 个数量级） | **触发磁盘 IO** |
| Invalid Fault | 访问非法地址 | 极高 | 触发 SIGSEGV，进程崩溃 |

${F}bash
# 观察缺页速率 —— 判断内存压力最直接的信号
/usr/bin/time -v ./app        # 结束后输出 Minor/Major page faults 总数
pidstat -r 1                  # 每秒 minflt/s 与 majflt/s

# 系统级
sar -B 1
#   fault/s   总缺页
#   majflt/s  主要缺页 —— 持续非 0 说明内存在换出换入（性能杀手）
#   pgfree/s、pgscank/s、pgscand/s  内存回收行为
${F}

**${C}majflt/s${C} 持续大于 0 就是要立刻处理的事故信号**：意味着内存不足开始依赖磁盘。容器里常见于 JVM 堆设得过大 + 未设置容器内存限制，导致宿主或 cgroup 层面反复换出。

### 三、内存映射的两条路径：mmap 与缺页填充

${F}c
// 1) 匿名映射（堆内存分配、malloc 大块）
void *p = mmap(NULL, size, PROT_READ|PROT_WRITE,
               MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
// 只分配虚拟地址空间，不分配物理页；首次写入才触发缺页分配物理页

// 2) 文件映射（读文件、共享库、持久化内存）
void *q = mmap(NULL, len, PROT_READ|PROT_WRITE,
               MAP_SHARED, fd, 0);
// 读写直接命中页缓存，省一次用户态/内核态拷贝
// 这对大文件随机读性能提升显著（也是很多数据库自研存储的基础）
${F}

${F}bash
# 查看进程的内存映射构成
pmap -x <pid>            # 每个映射段的 RSS/Dirty
cat /proc/<pid>/smaps    # 更详细：Rss、Pss、Shared_Clean、Private_Dirty
cat /proc/<pid>/status | grep -E "VmRSS|VmSize|VmSwap"
#   VmSize（虚拟内存）= 申请的地址空间总和，可能远大于物理内存，不代表占用
#   VmRSS（常驻内存）= 真正占用的物理内存
#   VmSwap           = 被换出的量 —— 非 0 就说明存在内存压力
${F}

### 四、页缓存与脏页回写

${F}text
所有文件读写都经过页缓存（Page Cache），除非使用 O_DIRECT：
  读：先从页缓存找 -> 未命中才读磁盘并填充缓存（readahead 预读）
  写：先写页缓存 -> 标为脏页 -> 由内核回写线程周期性刷盘

关键参数：
  vm.dirty_ratio            脏页占内存比例上限，超过则写进程自己同步刷盘（阻塞！）
  vm.dirty_background_ratio 后台刷盘启动阈值
  vm.dirty_expire_centisecs 脏页最长存活时间
  典型调优：dirty_background_ratio=5, dirty_ratio=20（大内存机器）
${F}

**如果 ${C}dirty_ratio${C} 打满，会看到「写入突然卡住」**：此时进程被迫自己刷盘，表现为周期性 IO 尖峰与响应抖动。降低 ${C}dirty_ratio${C} 或改用 ${C}fsync${C} 主动控制节奏，效果通常优于加磁盘。

${F}bash
# 观察脏页与回写
vmstat 1
#   bi/bo  块设备读入/写出（块/秒）
#   free/buff/cache  内存分布
grep -E "Dirty|Writeback" /proc/meminfo
${F}

### 五、内存指标的正确判读

${F}text
free 命令里最该看的是 available，不是 free：
  total      总内存
  used       已用（= total - free - buff/cache）
  free       **完全未使用** —— 通常很小，这是正常的！空闲内存会被用作缓存
  buff/cache 可回收的缓存
  available  预估还能分配给新应用的量（含可回收缓存）—— 判断内存是否紧张的真正依据

常见误解：
  "free 只剩 1GB，内存要爆了"   -> 错，看 available
  "cache 很大需要清理"          -> 不需要，cache 是可回收的，drop_caches 只在测试时用
${F}

OOM Killer 的选择逻辑：

${F}text
当内存彻底不足且无法回收时，内核按 oom_score 挑进程杀掉：
  oom_score 与进程内存占用正相关，可调 /proc/<pid>/oom_score_adj（-1000 到 1000）
  -1000 表示永不被杀（慎用，可能让系统整体挂掉）
  容器场景：cgroup 内存限制触发的 OOM 只会杀该 cgroup 内的进程
  排查：dmesg | grep -i "killed process" 能看到被杀进程与当时的完整内存快照
${F}

### 六、常见误区

1. **「虚拟内存大 = 占用内存大」**。${C}VmSize${C} 只是地址空间；JVM 常常预留几百 GB 虚拟地址但 RSS 只有几 GB。
2. **「swap 开着会拖慢系统，所以一律关掉」**。关掉能避免延迟抖动，但极端情况下会直接 OOM 杀进程。正确做法是把 ${C}vm.swappiness${C} 调低（如 1~10）而不是完全禁用，并监控 ${C}majflt/s${C}。
3. **「cache 占内存需要定期清理」**。页缓存是最有价值的内存用途；只有做压测对比时才手工 drop。
4. **「内存泄漏看 RSS 就够了」**。短期抖动会误导；要看长期趋势（如 24 小时 RSS 斜率）并结合堆分析/对象统计。
5. **「容器里有内存限制就够了」**。JVM/Go 等运行时若不感知 cgroup 限制（老版本），会按宿主机总量规划堆，直接触发 OOM。必须显式设置（如 ${C}-XX:MaxRAMPercentage${C}）。

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

<!--dd:tcp-reliable-->

## 🔬 深挖：可靠传输的实现细节与拥塞控制

### 一、可靠传输的四个机制如何协作

${F}text
1) 序号（Sequence Number）
   每个字节都有序号，不是每个包。这样重传可以精确到字节区间，
   接收端也能对乱序到达的段做重组。

2) 确认（ACK）+ 累积确认
   ACK=n 表示"n 之前的所有字节都收到了"（累积语义）。
   问题：丢了一个中间段，后面的都收到了也只能重复 ACK=n -> 发送端误判拥塞

3) 重传
   超时重传（RTO）：兜底，慢
   快速重传：收到 3 个重复 ACK 立即重传，不等超时

4) 滑动窗口（流量控制）
   接收端通过窗口字段告诉发送端"我还能收多少"，
   发送端据此限制未确认的在途数据量。
${F}

### 二、SACK：让重传不盲目

累积确认的致命缺陷：**一次只能告诉发送端"哪一段丢了"，无法表达"后面哪些收到了"**，导致发送端可能重传一大片已收到的数据。

${F}text
SACK（选择性确认，RFC 2018）：
  接收端在 TCP 选项里列出已收到的离散区间，如：
    SACK: [4000-8000], [12000-16000]   -> 说明 8000-12000 丢了
  发送端只重传 8000-12000，不重传其他
  Linux 默认开启，协商期在 SYN 的选项里声明

DSACK（重复 SACK）：告知"我收到了重复数据"，
  用于判断是重传多余了还是网络有重复包，辅助拥塞控制判断
${F}

### 三、RTO 的计算：Karn 算法与 RTT 抖动

${F}text
平滑 RTT 估计（Jacobson/Karels 算法）：
  SRTT    <- (1 - alpha) * SRTT + alpha * RTT          alpha = 1/8
  RTTVAR  <- (1 - beta) * RTTVAR + beta * |SRTT - RTT| beta  = 1/4
  RTO     <- SRTT + max(G, K * RTTVAR)                 K = 4，G 为时钟粒度

为什么是 4 倍偏差：
  覆盖 99% 以上的正常 RTT 波动，避免「假超时 -> 无效重传 -> 加剧拥塞」的雪崩

Karn 算法要解决的问题：
  重传后的 ACK 无法区分是确认原始传输还是重传传输
  -> 不把重传样本计入 RTT 估计（除非用时间戳选项消除歧义）

最小 RTO：Linux 下限 200ms（TCP_RTO_MIN），上限 120 秒
指数退避：每次超时 RTO 翻倍，直到上限 —— 这是"网络断了之后恢复很慢"的原因
${F}

${F}bash
# 观察重传与 RTT
ss -tin                              # 每个连接的 cwnd、rtt、retrans
nstat -az TcpRetransSegs TcpExtTCPTimeouts TcpExtTCPFastRetrans
# 或在 /proc/net/netstat 里找 TCPExt 段
${F}

### 四、拥塞控制：从 Reno 到 BBR 的思路演进

| 算法 | 核心思路 | 优点 | 缺点 |
|---|---|---|---|
| Reno | 丢包即减半（AIMD） | 简单稳定 | 高带宽长肥管道下利用率差 |
| CUBIC（Linux 默认） | 用三次函数增长 cwnd，与 RTT 解耦 | 高带宽场景友好、公平性好 | 仍以丢包为信号 |
| BBR（Google） | **基于带宽与 RTT 建模**，不以丢包为唯一信号 | 高丢包链路上吞吐大幅提升 | 与 CUBIC 共存时可能不公平 |
| DCTCP / ECN | 利用 ECN 显式拥塞通知 | 低延迟、低排队 | 需全链路支持 ECN |

${F}text
拥塞窗口（cwnd）的演化：
  慢启动：cwnd 指数增长（每 RTT 翻倍），直到 ssthresh 或丢包
  拥塞避免：进入线性增长（每 RTT +1 MSS）—— 这就是"慢启动不慢、拥塞避免不快"的由来
  快速重传/恢复：收到 3 个重复 ACK -> ssthresh 减半 -> cwnd 降到 ssthresh，进入快速恢复
  超时：ssthresh 减半 -> cwnd 回到 1 -> 重新慢启动（惩罚最重）

实际可用吞吐 ≈ cwnd / RTT
所以「带宽延迟积（BDP）= 带宽 × RTT」决定了需要多大的窗口才能跑满链路：
  1Gbps × 100ms = 100Mbit = 12.5MB 在途数据
  窗口不够（受 rwnd 或 cwnd 限制）就永远跑不满带宽
${F}

${F}bash
# 切换/查看拥塞控制算法
sysctl net.ipv4.tcp_congestion_control
sysctl net.ipv4.tcp_available_congestion_control
sysctl -w net.ipv4.tcp_congestion_control=bbr
# 查看单个连接的 cwnd 与拥塞算法
ss -tin | grep -E "cwnd|bbr|cubic"
${F}

### 五、Nagle 与延迟确认的「40ms 之谜」

这是最经典的 TCP 性能陷阱，两个机制单独都很合理，叠加后产生灾难：

${F}text
Nagle 算法（发送端）：
  有未确认的小数据时不发新的小包，攒够 MSS 或收到 ACK 才发
  目的：避免大量小包（避免"愚蠢窗口综合征"）

延迟确认（接收端）：
  收到数据不立刻回 ACK，等一小段（Linux 通常 40ms）看能否捎带数据

叠加后的死锁式等待：
  发送端：在等我上一个包的 ACK（Nagle 拦住新小包）
  接收端：在等 40ms 到点才发 ACK
  -> 每次小交互都白白多等一个延迟确认周期

修复：
  1) 应用层合并写（write 一次而不是多次小写）
  2) 设置 TCP_NODELAY（禁用 Nagle）—— 交互式协议（Redis、gRPC、HTTP/2）必开
  3) 让接收端不用延迟确认（不可控，不推荐作为方案）
${F}

${F}c
int flag = 1;
setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));   // 交互式协议必备
// 反之，批量传输（如大文件）保持 Nagle 开启反而更好：减少小包数量
${F}

### 六、TIME_WAIT：不是 bug，是设计

${F}text
TIME_WAIT 存在的两个理由：
  1) 让最后的 ACK 有机会重传（若对端没收到 FIN 的 ACK 会重发 FIN）
  2) 让本次连接的迟到报文在网络中消亡，避免污染使用相同四元组的新连接
时长：2 * MSL（Linux 固定 60 秒，不可通过配置改短）

危害场景：
  主动关闭方（通常是反向代理/客户端）大量 TIME_WAIT -> 源端口耗尽
  表现：Cannot assign requested address

缓解手段（由轻到重）：
  1) 使用连接池，减少短连接数量（最根本）
  2) net.ipv4.tcp_tw_reuse = 1（仅对主动发起的连接生效，安全）
  3) 扩大 net.ipv4.ip_local_port_range
  4) 增加对端 IP 数量（连接数 = 端口数 × 对端IP数）
  5) 【不要】tcp_tw_recycle —— 在 NAT 环境下会随机丢包，新内核已移除
${F}

### 七、粘包与拆包：TCP 是字节流，不是消息流

${F}text
根本原因：TCP 只保证字节顺序，不保留"写边界"。
  应用 write 100 字节 -> 接收端 recv 可能返回 1 次 100 字节，
  也可能返回 40 + 60，甚至和下一个消息合并成 180 字节

三种标准解法：
  1) 固定长度：每条消息定长（简单但浪费）
  2) 长度前缀：先 4 字节大端长度，再读 body（最通用，gRPC/Redis 都用）
  3) 分隔符：以特殊字符结尾（如 HTTP 的 CRLF，需处理转义）
${F}

${F}java
// 长度前缀解包的要点：必须用「读满」循环，不能假设一次读全
DataInputStream in = new DataInputStream(socket.getInputStream());
while (true) {
    int len = in.readInt();                 // 阻塞直到读满 4 字节
    byte[] body = new byte[len];
    in.readFully(body);                     // 关键：readFully 而非 read
    handle(body);
}
// 用 read() 时返回的字节数可能小于 len，必须循环累积，否则数据被截断
${F}

### 八、conntrack 表满：容器与高并发场景的隐形杀手

${F}text
Linux 的 netfilter 会为每条连接记录一条 conntrack 条目
  默认上限 net.netfilter.nf_conntrack_max（常为 65536 或按内存推算）
  每条条目约 300 字节，且需定期扫描超时条目

打满后的症状：
  内核打印 "nf_conntrack: table full, dropping packet"
  新建连接随机失败（已建立的连接通常还能用）—— 极难定位

调优：
  sysctl -w net.netfilter.nf_conntrack_max=1048576
  sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=3600   # 从默认 5 天缩短
  # 提高哈希桶减少冲突
  sysctl -w net.netfilter.nf_conntrack_buckets=262144
根治：把不需要追踪的流量标记为 NOTRACK（raw 表），或使用无 netfilter 的转发路径
${F}

### 九、常见误区

1. **「关了 Nagle 一定更快」**。批量传输场景下禁用 Nagle 会产生大量小包，反而拉低吞吐。要按协议特性决定。
2. **「TIME_WAIT 应该彻底消灭」**。它承担着保证连接语义正确的职责；正确方向是减少短连接，而不是关掉保护。
3. **「重传一定是网络丢包」**。也可能是对端应用读得太慢导致接收窗口为 0，或本机拥塞窗口受限。
4. **「设置了 TCP keepalive 就能检测断链」**。默认 keepalive 是 2 小时，等于没有；必须显式调小，或在应用层做心跳（更可控）。
5. **「BBR 开了就一定快」**。BBR 在低丢包链路上与 CUBIC 差别不大，且与 CUBIC 共存时可能抢占带宽；跨团队共用链路时要评估公平性。

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

<!--dd:https-tls-->

## 🔬 深挖：TLS 1.3 握手、证书链与握手排障

### 一、TLS 1.3 握手：为什么只要 1 个 RTT

${F}text
TLS 1.2（完整握手）：2-RTT
  ClientHello -> ServerHello + Certificate + ServerKeyExchange + ServerHelloDone
  ClientKeyExchange + ChangeCipherSpec + Finished
  ChangeCipherSpec + Finished

TLS 1.3（完整握手）：1-RTT
  ClientHello + key_share（客户端预先猜好密钥交换参数）
  ServerHello + key_share + {EncryptedExtensions + Certificate + CertVerify + Finished}
  {Finished} + 应用数据
  关键优化：客户端在第一个包里就把 key_share 发出去，省掉一轮协商

TLS 1.3 + PSK 会话复用：0-RTT
  客户端用上次的 PSK 直接加密并发送应用数据
  风险：0-RTT 数据可被重放 -> 只应对幂等请求使用（GET），不可用于支付等写操作
${F}

${F}text
TLS 1.3 精简掉的东西（安全原因）：
  RSA 密钥交换      -> 改为 (EC)DHE，具备前向保密
  静态 DH 套件      -> 同上
  CBC 模式套件      -> 只保留 AEAD（AES-GCM、ChaCha20-Poly1305）
  RC4、3DES        -> 全部移除
  renegotiation    -> 移除（历史上多次漏洞来源）
  compression      -> 移除（CRIME 攻击）
结果：TLS 1.3 的套件远少于 1.2，配置反而更简单
${F}

### 二、密钥派生：HKDF 与密钥分离

${F}text
TLS 1.3 用 HKDF（RFC 5869）从共享密钥派生出多层密钥：
  1) 早期密钥（Early Secret）   <- PSK（若使用）
  2) 握手密钥（Handshake Secret） <- (EC)DHE 共享密钥
  3) 主密钥（Master Secret）      <- 握手完成后的密钥
每一层再派生出：
  client_application_traffic_secret / server_application_traffic_secret（方向分离）
  + 独立的 IV 与密钥（由 traffic secret 再派生）
意义：一个密钥泄露不会连带其他方向的密钥，且支持密钥更新（KeyUpdate）
${F}

### 三、证书链校验的完整逻辑

客户端验证书不是「看有没有过期」，而是六步：

${F}text
1) 链完整性：服务器不应只发叶子证书，还要发中间 CA 证书
   （漏发中间证书是"浏览器正常、Java/curl 报错"的最常见原因）
2) 签名验证：用上一级公钥验证下一级的签名，逐级向上直到受信任根
3) 有效期：NotBefore / NotAfter，且要注意客户端时钟是否准确
4) 域名匹配：Subject Alternative Name（SAN）必须含目标域名
   CN 字段已被主流浏览器忽略 —— 只填 CN 是无效配置
5) 用途：Extended Key Usage 必须包含 serverAuth
6) 吊销检查：CRL 或 OCSP（在线检查会泄露隐私且增加延迟 -> 用 OCSP Stapling）
${F}

${F}bash
# 看服务端发的证书链（是否含中间证书）
openssl s_client -connect example.com:443 -servername example.com -showcerts </dev/null 2>/dev/null | grep -E "s:|i:"

# 只验证链（不校验域名，用于区分"链不全"与"域名不匹配"）
openssl s_client -connect example.com:443 -servername example.com -CAfile /etc/ssl/certs/ca-certificates.crt </dev/null 2>&1 | grep -E "Verify return code|verify error"

# 看证书详情（SAN、有效期、密钥类型）
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject Alternative Name"

# 测试 TLS 1.3 是否可用
openssl s_client -connect example.com:443 -tls1_3 </dev/null 2>&1 | head -5
${F}

### 四、SNI 与 ALPN：一个 IP 托管多站点的关键

${F}text
SNI（Server Name Indication）：
  客户端在 ClientHello 里明文告知目标域名，
  服务端据此选择对应证书 —— 这是"一个 IP 部署多个 HTTPS 站点"的基础。
  问题：域名明文暴露（隐私）-> 引出 ECH（Encrypted Client Hello），部署尚不普及。

ALPN（Application-Layer Protocol Negotiation）：
  在同一端口协商后续用 h2 / http/1.1 / h3。
  没有 ALPN，服务端无法知道客户端想用 HTTP/2。
  排查："客户端支持 h2 但协商成 http/1.1" -> 通常是服务端未开 h2 或 ALPN 配置缺失。
${F}

### 五、会话复用：两种机制的区别

| 机制 | 存储位置 | 恢复方式 | 注意 |
|---|---|---|---|
| Session ID（1.2） | 服务端 | 客户端带 Session ID，服务端查表 | 多机部署需共享存储或粘性会话 |
| Session Ticket（1.2） | 客户端 | 服务端用票据密钥加密状态，客户端保存 | 票据密钥必须多机一致，轮换要平滑 |
| PSK（1.3） | 客户端 | 0-RTT 或 1-RTT 恢复 | 0-RTT 有重放风险 |

**多机部署的经典坑**：负载均衡后有多台服务器，各机票据密钥不同，客户端复用到另一台时票据解密失败 —— 表现为「复用率很低、握手开销一直很大」。解法是统一票据密钥轮换策略（如用共享密钥 + 定时轮换，保留旧密钥一段时间）。

### 六、mTLS（双向认证）的落地要点

${F}text
服务端要求客户端也出示证书：
  ssl_verify_client on;                     # Nginx
  ssl_client_certificate /path/ca.crt;      # 用于验证客户端证书的 CA 链
  ssl_verify_depth 2;

工程要点：
  1) 客户端证书也要在有效期管理内 —— 证书过期会导致整批服务调用失败
  2) 客户端证书吊销同样需要机制（CRL/OCSP），否则离职人员证书仍可用
  3) 服务网格（Istio 等）默认自动做证书签发与轮换，自建时要自己解决
  4) 报错信息差异大：verify error:num=19 表示链不完整；self signed certificate 表示未受信 CA
${F}

### 七、常见错误码与定位路径

| 报错 | 含义 | 定位 |
|---|---|---|
| ${C}unable to get local issuer certificate${C} | 链不完整（服务端漏发中间证书） | ${C}openssl s_client -showcerts${C} 看链长度 |
| ${C}certificate has expired${C} | 证书过期 | 检查 NotAfter 与服务端时钟 |
| ${C}hostname mismatch${C} | SAN 不含该域名 | 检查 SAN，别只看 CN |
| ${C}sslv3 alert handshake failure${C} | 套件协商失败 | ${C}openssl s_client -tls1_2${C} 逐版本试；看密码套件交集 |
| ${C}unsupported protocol${C} | 版本不匹配（如客户端只支持 TLS1.3，服务端只开 1.2） | 显式指定版本测试 |
| ${C}connection reset by peer${C} | 服务端主动断（常见于 SNI 未匹配到证书、或 WAF 阻断） | 看服务端日志 |
| ${C}wrong version number${C} | 客户端在与 HTTP 端口说 TLS | 端口搞错了 |

### 八、性能优化清单

${F}text
1) 优先 TLS 1.3：1-RTT 握手 + 更少套件
2) 开启会话复用（Session Ticket），并保证多机密钥一致
3) 用 ECDSA 证书替代 RSA：握手计算量小、体积小（但需客户端支持）
4) 开启 OCSP Stapling：避免客户端自己去查 OCSP
5) 会话票据密钥定期轮换（保持前向保密），轮换期保留旧密钥
6) 在负载均衡/Nginx 层做 TLS 卸载时，注意内网段也应加密（否则内部明文）
7) 不要在网关后继续做多层 TLS 解密（每层都有 CPU 与延迟成本）
8) 使用 HTTP/2 或 HTTP/3 摊薄握手成本（一次握手多路复用）
${F}

### 九、常见误区

1. **「证书只发叶子证书就行」**。必须带中间证书，否则部分客户端（尤其 Java/老 curl）无法构建信任链，而浏览器因有 AIA 自动补链可能看不出问题。
2. **「配置了 CN 就够了」**。现代实现只认 SAN；只配 CN 的证书会被判定为域名不匹配。
3. **「内网不用加密」**。零信任与合规要求内网也加密；且内网一旦被突破，明文流量即被完全掌控。
4. **「0-RTT 越快越好，全量开启」**。0-RTT 可重放，只应对幂等的 GET 使用；开启写操作等于给了重放攻击的机会。
5. **「TLS 开销可忽略」**。握手期（尤其 RSA 2048）在一些低配设备上是可观的 CPU 成本；高 QPS 网关应实测握手 QPS 上限，并做好复用。

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

<!--dd:dns-cdn-->

## 🔬 深挖：DNS 解析链路与 CDN 缓存的真实行为

### 一、一次 DNS 解析的完整链路

${F}text
递归解析器（local DNS / 8.8.8.8）代为查询的迭代过程：
  1) 查本地缓存，命中即返回（由 TTL 决定有效期）
  2) 未命中 -> 问根服务器（13 组根，Anycast 就近）
     根只回答："去问 .com 的权威服务器"
  3) 问 TLD 服务器（.com）
     TLD 回答："example.com 的权威服务器是 ns1.example.com"
  4) 问权威服务器（ns1.example.com）
     权威回答最终记录：A 记录（IP）或 CNAME（别名）
  5) 递归解析器缓存并按 TTL 返回给客户端

关键认知：中间任何一层都可能有缓存，而缓存由 TTL 控制。
所以"改了 DNS 立刻生效"是不可能的 —— 必须等各层 TTL 过期。
${F}

${F}bash
# 完整追踪解析链路（从根开始）
dig +trace example.com

# 只问指定权威服务器（绕开缓存，验证权威配置）
dig @ns1.example.com example.com A +norecurse

# 看 TTL 与完整回答段
dig example.com +noall +answer

# 查看本机使用的解析器与缓存
cat /etc/resolv.conf
resolvectl status 2>/dev/null || systemd-resolve --status
${F}

### 二、记录类型与常见误用

| 类型 | 用途 | 关键要点 |
|---|---|---|
| A | IPv4 地址 | 多条 A 记录可做轮询，但无健康检查 |
| AAAA | IPv6 地址 | 客户端双栈时可能优先 AAAA，若 IPv6 不通会拖慢 |
| CNAME | 别名 | **不能与 MX/NS 共存**；根域通常不允许 CNAME |
| NS | 权威服务器 | 授权委派 |
| MX | 邮件 | 与 CNAME 互斥 |
| TXT | 验证/SPF/DKIM | SPF 过长会有解析失败风险 |
| SRV | 服务发现 | 带端口与权重，K8s 与 gRPC 常用 |
| CAA | 限制可签发该域的 CA | 合规与防误签发 |

**CNAME 链的代价**：A -> CNAME B -> CNAME C -> A 记录，每级都要额外解析一次，直接放大首屏延迟。CDN 接入时常见的「CNAME 到厂商域名」就是这类结构，尽量控制在两级以内。

### 三、CDN 调度的两种范式

| 方式 | 原理 | 优点 | 缺点 |
|---|---|---|---|
| DNS 调度 | 权威 DNS 根据解析器 IP 返回就近节点 | 实现简单、无额外设备 | 精度受限于解析器位置（递归服务器可能远离用户）；受 ECS 支持影响 |
| Anycast | 多节点宣告同一 IP，由 BGP 选路 | 就近接入精准、天然容灾 | 需自有 AS 与 IP 段，成本高 |

**EDNS Client Subnet（ECS）**的作用：解析器把用户网段（通常 /24）附带在查询里，让权威 DNS 能按用户位置而非解析器位置返回节点。但 ECS 有隐私争议，且 Google 8.8.8.8 等公共 DNS 默认不带 ECS —— 这是「自建 DNS 与公共 DNS 命中不同节点、速度差异明显」的根因。

### 四、CDN 缓存：命中率才是核心指标

${F}text
缓存键（Cache Key）由什么组成？
  默认：URL（含 scheme + host + path + query） + Vary 指定的头
  常见错误：把不影响内容的参数也放进缓存键 -> 每个用户一个副本 -> 命中率暴跌

典型命中率参考：
  静态资源（图片/JS/CSS）   > 95%
  动态接口（短缓存）         30%~70%（视业务）
  个性化接口（private）      0%（本就不该缓存）

提升命中率的四件事：
  1) 归一化 query 参数顺序与无用参数（如 utm_*、时间戳）
  2) 用 Vary 精确声明（只声明真正影响内容的首部，不要写 Vary: *）
  3) 静态资源用内容哈希命名 -> 可以设超长缓存，命中率接近 100%
  4) 回源合并（Collapsed Forwarding）：同一资源并发回源只放一个请求到源站
${F}

### 五、缓存策略的组合拳

${F}text
# 静态资源：内容哈希 + 一年强缓存 + immutable
location ~* \\.(js|css|png|jpg|woff2)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML 入口：不缓存或极短缓存，保证发版立刻生效
location = /index.html {
    add_header Cache-Control "no-cache";
}

# 接口：CDN 短缓存 + 允许陈旧回源，兼顾性能与新鲜度
location /api/config {
    add_header Cache-Control "public, s-maxage=60, stale-while-revalidate=300";
    add_header CDN-Cache-Control "max-age=60";     # 只作用于 CDN，不传给浏览器
}
${F}

**${C}CDN-Cache-Control${C} 与 ${C}Cache-Control${C} 分离**是很有用的技巧：CDN 侧短暂缓存以吸收回源压力，而浏览器侧完全不缓存，保证用户每次刷新看到最新数据。

### 六、预热与刷新：上线流程的一部分

${F}text
发布静态资源时的正确顺序（避免"缓存雪崩式回源"）：
  1) 上传新文件到源站（文件名含哈希，不会覆盖旧文件）
  2) 预热：主动请求 CDN 节点，把新资源拉进缓存
  3) 切换入口引用（HTML 里指向新哈希文件名）
  4) 旧文件保留一段时间（避免用户拿着旧 HTML 请求已删除的资源 -> 404）

若必须覆盖同名文件（如 favicon），则用刷新：
  刷新（Purge）有速率限制，且不是瞬时全局生效 —— 各节点是异步失效的
${F}

### 七、多级缓存的层次与穿透风险

${F}text
浏览器 -> 边缘节点（CDN）-> 中间层（区域缓存/网关）-> 源站
每一层都需要独立的缓存策略，且要考虑：
  1) 缓存穿透：查询不存在的 key，每次都打到源站
     -> 缓存空值（短 TTL）+ 布隆过滤器前置
  2) 缓存击穿：热点 key 过期瞬间大量并发回源
     -> 互斥重建（只放一个请求去加载）+ 逻辑过期（不设物理过期）
  3) 缓存雪崩：大量 key 同时过期
     -> TTL 加随机抖动
  4) 缓存一致性：源站更新后各层如何失效
     -> 主动 purge 边缘节点 + 短 TTL 兜底
${F}

### 八、常见误区

1. **「改 DNS 立即生效」**。受各层 TTL 与客户端缓存约束，通常需要数分钟到数小时；迁移前应先把 TTL 调小（如 60 秒）再切。
2. **「CNAME 随便用」**。CNAME 不能与 MX/NS 共存，根域 CNAME 在部分注册商不被支持；CNAME 链过长会显著增加解析延迟。
3. **「CDN 一切都能加速」**。动态、个性化、需要鉴权的请求往往无法缓存，CDN 只能优化链路（骨干网接入、协议优化），不能提升命中率。
4. **「命中率低就调大 TTL」**。若缓存键不合理（如把用户 ID 放进 query），再长的 TTL 也没有帮助。
5. **「只监控 CDN 整体命中率」**。必须按资源类型、按目录、按状态码细分；整体命中率会被少数超大文件拉高，掩盖真实问题。

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

<!--dd:io-multiplexing-->

## 🔬 深挖：epoll 内部实现、触发模式与 Reactor 模型

### 一、三种多路复用的实现差异

| 机制 | 数据结构 | 每次调用复杂度 | 返回值 | 局限 |
|---|---|---|---|---|
| select | 位图（fd_set） | O(n) 扫描 + 每次全量拷贝 | 修改位图 | fd 上限 1024；线性扫描 |
| poll | 数组 | O(n) 扫描 + 每次全量拷贝 | 修改 revents | 无 fd 上限，但仍线性扫描 |
| epoll | 红黑树 + 就绪链表 | O(1) 获取就绪（只需遍历就绪链表） | 填充就绪数组 | 仅 Linux |

**核心差异不在「扫描方式」，而在「内核是否维护状态」**：

${F}text
select/poll：
  应用每次调用都要把整个 fd 集合从用户态拷到内核态，
  内核再逐个检查每个 fd 是否就绪 -> O(n) 拷贝 + O(n) 检查
  即使 10000 个连接里只有 1 个活跃，也要检查 10000 次

epoll：
  epoll_ctl 时把 fd 注册进内核的红黑树（只注册一次），
  同时在该 fd 的等待队列上挂回调；
  数据到达时由内核回调把 fd 挂到「就绪链表」；
  epoll_wait 只需检查就绪链表是否为空 -> O(1)（不含拷贝就绪项）
  这是 C10K 到 C10M 的关键
${F}

${F}c
// epoll 的三个调用
int ep = epoll_create1(0);
struct epoll_event ev;
ev.events = EPOLLIN | EPOLLET;      // 关注可读，使用边沿触发
ev.data.fd = listen_fd;
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &ev);       // 注册（只做一次）

struct epoll_event events[1024];
int n = epoll_wait(ep, events, 1024, -1);            // 阻塞等待，返回就绪数
for (int i = 0; i < n; i++) { handle(events[i].data.fd); }
${F}

### 二、LT 与 ET：最容易出 bug 的地方

${F}text
水平触发（LT，Level Triggered，默认）：
  只要缓冲区还有数据，每次 epoll_wait 都会返回该 fd
  优点：编程简单，允许一次只读一部分
  代价：数据量大时会被反复唤醒（系统调用次数多）

边沿触发（ET，Edge Triggered，需显式 EPOLLET）：
  只在状态"变化"时通知一次（从无数据变为有数据）
  优点：通知次数最少，性能更好
  要求：必须循环读到 EAGAIN 为止，否则剩余数据不会再触发通知 -> 连接"卡死"
  注意：ET 必须配非阻塞 fd，否则最后一次 read 会永久阻塞
${F}

${F}c
// ET 模式的正确读法（关键：循环 + 处理 EAGAIN）
while (1) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n > 0) { process(buf, n); continue; }
    if (n == 0) { close_conn(fd); break; }                 // 对端关闭
    if (n < 0) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) break; // 读干净了，正常退出
        if (errno == EINTR) continue;                       // 被信号打断，重试
        close_conn(fd); break;
    }
}
${F}

### 三、惊群（Thundering Herd）与 EPOLLEXCLUSIVE

${F}text
问题场景：多个进程/线程在同一个 epoll 实例（或同一个 listen fd）上等待
  新连接到来 -> 内核唤醒全部等待者 -> 只有一个成功 accept，其余白白被唤醒
  结果：大量无效上下文切换，高峰期吞吐骤降

三种解法：
  1) EPOLLEXCLUSIVE（4.5+）：epoll_ctl 时带上该标志，
     内核只唤醒一个等待者
  2) SO_REUSEPORT：每个进程各自 listen 同一个端口，
     内核按四元组哈希分流 —— 现在最常用的方案，天然负载均衡
  3) 只让一个线程 accept，然后派发给 worker（单 acceptor 模式）
${F}

${F}c
// SO_REUSEPORT：多进程/多线程各自独立 listen，内核负责分流
int on = 1;
setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof(on));
// 配合 SO_REUSEADDR 一起用；注意：连接分布由内核哈希决定，
// 若各 worker 处理能力不同，可能出现不均衡
${F}

### 四、Reactor 与 Proactor：两条不同的 I/O 完成路径

${F}text
Reactor（同步 I/O，就绪通知）：
  内核告我"可以读了" -> 我自己调用 read 把数据从内核拷到用户态
  代表：Nginx、Netty、Redis、libevent
  变体：
    单 Reactor 单线程     —— 简单，Redis 属于此类（命令执行单线程）
    单 Reactor 多线程     —— 主线程收连接，worker 线程处理
    主从 Reactor 多线程   —— 主 Reactor 只 accept，子 Reactor 各自处理 I/O（Netty 默认）

Proactor（异步 I/O，完成通知）：
  我提交 read 请求并附带缓冲区 -> 内核读完后告我"已经读好了"
  代表：Windows IOCP、Linux io_uring
  优势：应用层不参与数据拷贝的等待，理论上更高效
${F}

**io_uring 的意义**：Linux 5.1 引入，用两个共享内存环形队列（提交队列 SQ + 完成队列 CQ）实现「零系统调用」的批量提交，既支持文件 I/O 也支持网络 I/O，且天然支持真正的异步。它是当前 Linux 高性能 I/O 的方向，但生态（驱动、库、内核版本要求）仍在完善中。

### 五、fd 上限与相关调优

${F}bash
# 三层限制，都要调（取最小值生效）
ulimit -n                                   # 进程级（软限制）
ulimit -Hn                                  # 进程级（硬限制）
cat /proc/sys/fs/file-max                   # 系统级总上限
cat /proc/<pid>/limits | grep files         # 某进程的实际限制

# 临时提升（当前 shell）
ulimit -n 1048576
# 永久：/etc/security/limits.conf
#   * soft nofile 1048576
#   * hard nofile 1048576
# systemd 服务还需单独设置：
#   [Service] LimitNOFILE=1048576

# 查看当前系统的 fd 使用情况
cat /proc/sys/fs/file-nr        # 已分配 / 未使用 / 上限
lsof -p <pid> | wc -l           # 某进程打开的 fd 数
ls /proc/<pid>/fd | wc -l       # 更快的方式
${F}

### 六、常见误区

1. **「epoll 一定比 select 快」**。连接数少且都很活跃时，select 反而可能更快（没有红黑树与回调开销）。epoll 的优势在「连接多但活跃少」。
2. **「ET 模式性能一定更好」**。ET 的确减少通知次数，但要求应用严格读到 EAGAIN，实现复杂易错；很多框架默认仍用 LT。
3. **「多线程 + 一个 epoll 就是高性能」**。多线程共享一个 epoll 会引发锁竞争与惊群，通常应「每线程一个 epoll 实例 + SO_REUSEPORT」。
4. **「非阻塞 + epoll 就不用管 fd 上限」**。fd 是硬约束，达到上限后 accept 会失败并返回 EMFILE，必须提前调优并监控。
5. **「异步 I/O 一定优于同步 I/O」**。取决于场景：小消息高频交互下，Reactor 的开销与 Proactor 相当甚至更优；大文件传输才是异步 I/O 的主场（zero-copy、真正的 DMA 参与）。

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

<!--dd:fs-disk-io-->

## 🔬 深挖：VFS 层、页缓存回写与磁盘性能判读

### 一、一次文件写的完整路径

${F}text
应用 write()
  -> VFS（虚拟文件系统层）：统一接口，决定走哪个具体文件系统
  -> 具体文件系统（ext4 / XFS）：分配块、更新元数据
  -> 页缓存（Page Cache）：写入缓存页并标记为脏（dirty）
  -> 返回给应用（**此时数据还没落盘！**）
  ...稍后...
  -> 内核回写线程（writeback）：把脏页提交到块设备层
  -> IO 调度器（mq-deadline / none）：合并、排序请求
  -> 块设备驱动 -> 磁盘/SSD 控制器
  -> 最终持久化（若未 fsync，落盘时间不可控）

关键结论：不调用 fsync 的写入，进程崩溃会丢，机器断电更会丢；
         数据库必须通过 fsync/fdatasync 明确控制持久化时机。
${F}

### 二、fsync、fdatasync、O_SYNC 的区别

| 调用 | 保证的内容 | 代价 |
|---|---|---|
| ${C}sync()${C} | 刷新所有文件系统的脏页（全局） | 最重，生产慎用 |
| ${C}fsync(fd)${C} | 刷新该文件的数据 + 元数据（大小、mtime、块映射） | 重（元数据可能要额外 IO） |
| ${C}fdatasync(fd)${C} | 刷新数据 + 必要元数据（不刷 mtime 等无关项） | 略轻 |
| ${C}O_SYNC${C} 打开 | 每次 write 都同步落盘 | 最慢，但语义最明确 |
| ${C}O_DSYNC${C} | 每次 write 保证数据落盘（不保证无关元数据） | 次慢 |
| ${C}O_DIRECT${C} | 绕过页缓存，直接与设备交互 | 需对齐、丧失缓存收益（数据库常用） |

**数据库为什么爱用 O_DIRECT**：自己管理缓存（Buffer Pool）比依赖 OS 页缓存更可控，避免「双缓存」导致的内存浪费与一致性复杂度。代价是必须自己实现预读（readahead）与合并。

${F}bash
# 观察脏页与回写（判断是否因刷盘造成卡顿）
grep -E "^(Dirty|Writeback|WritebackTmp)" /proc/meminfo
vmstat 1        # bi/bo 列是块设备读写速率
cat /sys/block/sda/queue/scheduler                 # 当前 IO 调度器
ls /sys/block/sda/queue/rotational                 # 1=机械盘 0=SSD
${F}

### 三、顺序 vs 随机：数量级差异的来源

${F}text
机械硬盘（HDD）：
  顺序读   约 100~200 MB/s（受限于主轴转速与磁头移动方式）
  随机 IO  约 75~200 IOPS（每次要移动磁头 + 等待旋转）
  -> 随机与顺序差 2~3 个数量级，这是"随机 IO 是性能杀手"的物理根源

SSD：
  顺序读   数百 MB/s ~ 数 GB/s（取决接口：SATA / NVMe）
  随机 IO  数万 ~ 数十万 IOPS
  -> 随机与顺序的差距缩小到 1 个数量级以内
  -> 但仍有代价：写放大、GC 停顿、寿命（TBW）

对应用设计的含义：
  HDD 时代必须"顺序化"（B+Tree 就是为减少随机 IO 而生）
  SSD 时代可以接受更多随机，但依旧要避免"每次写一个小块"
${F}

### 四、IO 调度器的选择

| 调度器 | 适用 | 特点 |
|---|---|---|
| none（noop） | NVMe SSD、虚拟化环境 | 不做重排，交给设备；SSD 自身有调度能力 |
| mq-deadline | 通用、单队列与多队列 | 保证读延迟上限（deadline），默认推荐 |
| kyber | 低延迟场景 | 按目标延迟调节 |
| bfq | 桌面/交互式 | 公平性最好，服务器不推荐（开销大） |

${F}bash
# 查看与切换（多队列设备用 /sys/block/<dev>/queue/scheduler）
cat /sys/block/nvme0n1/queue/scheduler
echo mq-deadline > /sys/block/nvme0n1/queue/scheduler
# 持久化：内核启动参数 elevator=mq-deadline，或 udev 规则
${F}

### 五、iostat：读懂磁盘真实压力

${F}bash
iostat -x 1
${F}

| 列 | 含义 | 判读 |
|---|---|---|
| ${C}r/s, w/s${C} | 每秒读写次数（IOPS） | 与设备上限对比 |
| ${C}rkB/s, wkB/s${C} | 每秒读写字节 | 吞吐是否接近接口上限 |
| ${C}await${C} | 平均 IO 等待时间（含排队） | **最关键**：持续 > 10ms（HDD）/ > 2ms（SSD）需关注 |
| ${C}r_await vs w_await${C} | 读/写分别的等待 | 区分是读还是写造成瓶颈 |
| ${C}aqu-sz${C}（旧版 avgqu-sz） | 平均请求队列长度 | > 1 说明有排队 |
| ${C}%util${C} | 设备繁忙时间占比 | **注意**：SSD 并行度高，100% 不等于饱和；要看 await |
| ${C}rareq-sz${C} | 平均请求大小 | 过小说明随机多，合并效果差 |

**最常见误判**：看到 ${C}%util = 100%${C} 就断言磁盘饱和。对 NVMe 而言，${C}%util${C} 高但 ${C}await${C} 很低说明设备并行能力被充分利用，并未饱和。真正的饱和信号是 ${C}await${C} 显著上升 + ${C}aqu-sz${C} 持续 > 1。

### 六、用 fio 量化设备能力

${F}bash
# 随机读（4K，模拟数据库索引访问）
fio --name=randread --ioengine=libaio --direct=1 --rw=randread \\
    --bs=4k --iodepth=32 --numjobs=4 --size=4G --runtime=60 --group_reporting

# 顺序写（1M，模拟日志/大文件）
fio --name=seqwrite --ioengine=libaio --direct=1 --rw=write \\
    --bs=1M --iodepth=16 --numjobs=1 --size=8G --runtime=60 --group_reporting

# 混合读写（7:3，接近真实业务）
fio --name=mix --ioengine=libaio --direct=1 --rw=randrw --rwmixread=70 \\
    --bs=4k --iodepth=64 --numjobs=8 --size=4G --runtime=60 --group_reporting
# 关键参数：--iodepth 决定并发深度，--direct=1 绕过缓存才能测出真实设备性能
${F}

测出来的 IOPS 与延迟应该记录为**容量基线**，用于容量规划与故障对比。

### 七、SSD 特有问题的排查

${F}text
1) 写放大（WAU）：实际写入量 / 应用写入量
   原因：4K 随机写触发整块擦除（GC）
   缓解：对齐写、批量写、TRIM、保留足够空闲空间（op 空间）

2) GC 停顿：SSD 内部垃圾回收导致延迟尖刺
   观察：await 的 p99 远高于均值
   缓解：over-provisioning、避免写满（建议使用率 < 80%）

3) 寿命：TBW（总写入字节）耗尽后进入只读模式
   监控：smartctl -a /dev/nvme0n1 看 Percentage_Used、Data_Units_Written

4) 坏块与介质错误：dmesg 里出现 I/O error、medium error
   立即：更换设备（不要依赖 RAID 重建）
${F}

${F}bash
# NVMe 健康状态
smartctl -a /dev/nvme0n1 | grep -E "Percentage_Used|Data_Units|Available_Spare|Critical_Warning"
# 机械盘 SMART
smartctl -H /dev/sda
${F}

### 八、常见误区

1. **「write 成功返回就等于落盘」**。只写到页缓存；持久化必须 fsync，否则断电会丢。
2. **「页缓存越多越好」**。写场景下脏页过多会导致回写风暴与写延迟尖刺；要调 ${C}dirty_ratio${C} 平衡。
3. **「%util 到 100% 就是磁盘瓶颈」**。对 SSD 不成立，必须结合 ${C}await${C} 与 ${C}aqu-sz${C}。
4. **「SSD 不需要 TRIM」**。缺失 TRIM 会显著加剧写放大与性能衰减；确保挂载时开启 ${C}discard${C} 或定期执行 ${C}fstrim${C}。
5. **「RAID 就一定更快更安全」**。RAID 5/6 的写惩罚（写要 4 次 IO）会严重拖慢随机写；且 RAID 不是备份，无法防误删。

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

<!--dd:kernel-net-tune-->

## 🔬 深挖：内核网络参数全景与丢包定位

### 一、参数按「解决什么问题」分类

调参最容易犯的错是「抄一份 sysctl 清单」而不理解在解决什么。正确做法是按问题分类：

| 问题类别 | 关键参数 | 典型场景 |
|---|---|---|
| 连接建立能力 | ${C}somaxconn${C}、${C}tcp_max_syn_backlog${C} | 高并发短连接、SYN 洪水 |
| 端口资源 | ${C}ip_local_port_range${C}、${C}tcp_tw_reuse${C} | 大量主动外连 |
| 缓冲区 | ${C}tcp_rmem${C}、${C}tcp_wmem${C}、${C}netdev_max_backlog${C} | 大带宽高延迟（长肥管道） |
| 时间等待 | ${C}tcp_fin_timeout${C}、${C}tcp_max_tw_buckets${C} | TIME_WAIT 堆积 |
| 拥塞与重传 | ${C}tcp_congestion_control${C}、${C}tcp_retries2${C}、${C}tcp_syn_retries${C} | 弱网、跨境 |
| 中断与软中断 | ${C}net.core.busy_poll${C}、RPS/RFS 配置 | 小包高 PPS |
| 连接追踪 | ${C}nf_conntrack_max${C}、${C}nf_conntrack_buckets${C} | 容器、NAT 网关 |
| 内存与回收 | ${C}tcp_mem${C}、${C}tcp_moderate_rcvbuf${C} | 大量连接并存 |

### 二、最常需要改的参数（附安全取值范围）

${F}ini
# /etc/sysctl.d/99-network.conf

# --- 队列与连接建立 ---
net.core.somaxconn = 65535
# accept 队列上限；应用 listen() 的 backlog 会被此值截断
net.ipv4.tcp_max_syn_backlog = 65535
# 半连接队列（收到 SYN 但未完成三次握手）

# --- 网络设备层 ---
net.core.netdev_max_backlog = 65535
# 内核收包队列；高 PPS 场景不足会导致 "netdev backlog drops"
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
# SO_RCVBUF/SO_SNDBUF 的硬上限，应用 setsockopt 不能超过它
net.ipv4.tcp_rmem = 4096 131072 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
# 三个值：最小值 / 默认值 / 最大值，内核会按需自动调优

# --- 端口与 TIME_WAIT ---
net.ipv4.ip_local_port_range = 10240 65535
net.ipv4.tcp_tw_reuse = 1
# 仅对"主动发起连接"复用 TIME_WAIT，安全；不要用 tcp_tw_recycle
net.ipv4.tcp_fin_timeout = 30
# FIN_WAIT_2 超时（注意：不等于 TIME_WAIT 的 60 秒，后者固定）

# --- 拥塞与重传 ---
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
# BBR 建议搭配 fq 队列调度，效果更佳
net.ipv4.tcp_syn_retries = 3
net.ipv4.tcp_retries2 = 10
# 建立与传输阶段的重试次数，过大导致"卡很久才报错"

# --- 缓解 SYN 洪水 ---
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_synack_retries = 2
${F}

${F}bash
# 应用并校验
sysctl -p /etc/sysctl.d/99-network.conf
sysctl net.core.somaxconn net.ipv4.tcp_congestion_control
${F}

**注意 ${C}tcp_max_syn_backlog${C} 与 ${C}somaxconn${C} 的关系**：前者管半连接队列（SYN 收到但未完成握手），后者管全连接队列（握手完成等待 accept）。应用代码里 ${C}listen(fd, backlog)${C} 的 backlog 会被 ${C}somaxconn${C} 截断 —— 这就是「明明调了 backlog 但连接还是被丢」的原因。

### 三、软中断、RPS/RFS 与中断亲和

${F}text
单队列网卡的问题：
  所有收包中断都落在 CPU0 -> CPU0 的 %si（软中断）打满 -> 其他核空闲
  表现：整体 CPU 使用率不高，但延迟抖动严重、吞吐上不去

解法一：多队列网卡 + 中断亲和
  网卡按流哈希把包分散到多个硬件队列，每个队列绑定不同 CPU

解法二：RPS（Receive Packet Steering，软件层模拟多队列）
  在软件层面把包分发给其他 CPU 处理（增加一次 IPI 中断，但均衡了负载）

解法三：RFS（Receive Flow Steering）
  按"处理该连接的进程所在 CPU"分发，提升缓存命中率

RPS 配置示例：
  echo f > /sys/class/net/eth0/queues/rx-0/rps_cpus        # CPU 0-3
  echo 32768 > /sys/class/net/eth0/queues/rx-0/rps_flow_cnt
  echo 32768 > /proc/sys/net/core/rps_sock_flow_entries
${F}

${F}bash
# 查看中断分布是否均衡
cat /proc/interrupts | grep -E "eth0|nvme"
# %si 高的具体核
mpstat -P ALL 1 | head -20
# 软中断统计
cat /proc/softirqs
${F}

### 四、GRO / GSO / TSO：减少每包开销的三件套

| 机制 | 方向 | 作用 |
|---|---|---|
| ${C}TSO${C} | 发送 | 网卡负责把大块数据切分成 MTU 大小的段，减少 CPU 参与 |
| ${C}GSO${C} | 发送（软件） | 内核层的通用分段卸载，TSO 的软件版 |
| ${C}GRO${C} | 接收 | 把多个小段合并成大块再交给协议栈，减少上层处理次数 |
| ${C}LRO${C} | 接收（网卡） | 网卡硬件合并，可能导致重传时行为异常，一般不用 |

${F}bash
# 查看与开关（ethtool -K 可关，-k 可查）
ethtool -k eth0 | grep -E "tso|gso|gro"
ethtool -K eth0 gro on tso on gso on
# 抓包时的经典问题：开启 GRO/TSO 后 tcpdump 看到"超大包"
# 这是正常现象（合并后的包），不是链路异常
${F}

### 五、丢包的分类与定位（最容易搞混的一步）

丢包发生在不同层，症状与解法都不同：

| 丢包位置 | 观测指标 | 原因 | 对策 |
|---|---|---|---|
| 网卡环形缓冲 | ${C}ethtool -S eth0${C} 里的 ${C}rx_dropped${C} / ${C}rx_no_buffer${C} | 收包速度超过内核处理 | 增大 ring：${C}ethtool -G eth0 rx 4096${C} |
| 内核收包队列 | ${C}/proc/net/softnet_stat${C} 第 2 列 | ${C}netdev_max_backlog${C} 不足 | 调大 backlog + 开 RPS |
| socket 接收缓冲 | ${C}ss -ti${C} 的 drops | 应用读得太慢 | 增大 ${C}tcp_rmem${C}；优化应用消费 |
| 全连接队列 | ${C}ss -lnt${C} 的 Send-Q（Listen 溢出） | accept 太慢或 backlog 满 | 调大 backlog、提升 accept 线程数 |
| conntrack | 内核日志 table full | 连接数超过表容量 | 调大 conntrack max 或缩短超时 |
| 网络设备本身 | ${C}ethtool -S${C} 的 ${C}tx_dropped${C} | 发送队列满、链路协商问题 | 检查链路速率与双工、QoS |

${F}bash
# 综合诊断一条命令
nstat -az | grep -Ei "drop|retrans|error|listen|overflow"
# 或看协议栈统计（含 ListenOverflows / ListenDrops）
netstat -s | grep -iE "drop|overflow|retrans|reset"
# 关键几项
#   ListenOverflows / ListenDrops  -> 全连接队列溢出，accept 跟不上
#   TCPSynRetrans                  -> SYN 重传（对端未响应，可能被防火墙丢）
#   TCPBacklogDrop                 -> netdev backlog 溢出
#   TCPRcvCollapsed                -> 接收合并
${F}

### 六、eBPF / XDP：把处理下沉到内核

${F}text
传统路径：网卡 -> 中断 -> 协议栈 -> socket -> 应用
XDP 路径：网卡驱动层直接执行 eBPF 程序
  XDP_DROP   在最早的位置丢弃（DDoS 清洗，几乎零成本）
  XDP_PASS   交给协议栈（默认）
  XDP_TX     直接回发（反射）
  XDP_REDIRECT 重定向到其他网卡/CPU
适用与边界：
  优点：在包进入协议栈前处理，开销极低，可线速处理
  限制：驱动必须支持（主流万兆/25G 网卡多已支持）；
        编程复杂；调试困难
典型应用：Cilium（K8s 网络）、Facebook Katran（L4 负载均衡）、DDoS 防护
${F}

### 七、常见误区

1. **「抄一份大厂 sysctl 清单就能提速」**。参数与业务形态强相关；照抄可能把 ${C}tcp_tw_recycle${C} 之类的危险参数带到生产（NAT 环境下随机丢包）。
2. **「somaxconn 调大就够了」**。应用 listen backlog 与 accept 速度同样关键；只调内核参数而 accept 循环慢，队列照样溢出。
3. **「%util / CPU 高才是瓶颈」**。网络瓶颈常表现为「CPU 不高但延迟抖动」，根因在软中断集中或 ring buffer 丢弃。
4. **「B 开了 BBR 就能跑满带宽」**。还需接收窗口（${C}tcp_rmem${C}）与发送窗口足够大，否则带宽延迟积限制吞吐。
5. **「netstat -s 里的 drops 都是丢包」**。不同计数含义完全不同（backlog drop 与 socket drop 的解法相反），必须先分类再动手。

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

<!--dd:high-conn-model-->

## 🔬 深挖：C10K 到 C10M 的瓶颈分解与零拷贝

### 一、并发模型的演进脉络

| 模型 | 结构 | 瓶颈 | 代表 |
|---|---|---|---|
| 阻塞式多进程 | fork per connection | 进程创建与切换成本 | 早期 Apache prefork |
| 阻塞式多线程 | thread per connection | 线程栈内存 + 切换 | Apache worker |
| 事件驱动（Reactor） | 少量线程 + epoll | 单线程 CPU 上限、回调复杂度 | Nginx、Redis、Node.js |
| 协程 | 用户态调度 + 非阻塞 IO | 语言运行时成熟度 | Go netpoller、Java 虚拟线程 |
| 内核旁路 | 用户态协议栈 | 需专门网卡与团队 | DPDK、Solarflare |

**为什么"一连接一线程"撑不到 C10K**：默认线程栈 8MB（虚拟地址，但栈上页在用到时才分配） + 内核栈 + task_struct，再算上切换成本。1 万连接意味着 1 万次潜在的上下文切换竞争 —— 即使每个连接只有少量数据，调度开销也已吞掉大部分 CPU。

### 二、单机连接数的四大约束（必须逐个核算）

${F}text
约束 1：文件描述符
  fs.file-max（系统级）与 ulimit -n（进程级）
  每连接消耗 1 个 fd，加上日志/配置/事件等额外 fd
  例：目标 100 万连接 -> ulimit -n 至少 110 万，fs.file-max 更大

约束 2：内存（最容易低估）
  每连接内存 = socket 结构 + 发送缓冲 + 接收缓冲 + 应用侧对象
  若 tcp_rmem/wmem 各允许 256KB，而内核实际按需增长：
    实测经验值：每连接 8KB ~ 40KB（取决于流量与应用对象）
  100 万连接 × 20KB = 20GB —— 这就是"连接数上限 = 内存 / 每连接内存"

约束 3：端口（仅影响主动外连方）
  可用源端口数 × 对端 IP 数
  服务端被动接收连接时不消耗源端口，因此"服务端端口耗尽"是误解

约束 4：conntrack 与内核表
  nf_conntrack_max 默认 65536 量级，远超此数会丢包
  此外还有 tcp_mem（TCP 整体内存限制）、tcp_max_tw_buckets 等

经验总结：单机 100 万连接在现代服务器上可行，
  但必须同时调 fd、内存、conntrack，并接受每连接内存被压到很低。
${F}

${F}bash
# 逐项核算当前系统的理论上限
ulimit -n                                       # 进程 fd 上限
cat /proc/sys/fs/file-max                       # 系统 fd 上限
cat /proc/sys/net/netfilter/nf_conntrack_max    # conntrack 上限
free -g                                         # 内存总量
sysctl net.ipv4.ip_local_port_range             # 可用端口范围（仅主动外连相关）
${F}

### 三、零拷贝：消除用户态与内核态之间的数据搬移

${F}text
传统发送一个文件（4 次拷贝 + 4 次上下文切换）：
  1) read()  : 磁盘 -> 内核页缓存（DMA 拷贝）
  2) read()  : 内核页缓存 -> 用户缓冲区（CPU 拷贝）
  3) write() : 用户缓冲区 -> socket 发送缓冲（CPU 拷贝）
  4) write() : socket 缓冲 -> 网卡（DMA 拷贝）

sendfile（3 次拷贝，2 次上下文切换）：
  sendfile(out_fd, in_fd, ...) 直接在内核内完成文件到 socket 的搬移
  跳过用户态，省掉 2 次 CPU 拷贝与 2 次切换
  限制：不能修改内容（无法做压缩/加密），需硬件支持 SG-DMA 才能做到真正的零 CPU 拷贝

splice：在两个 fd 之间建立管道式搬运，支持 socket <-> pipe
mmap + write：把文件映射进用户态，省掉 read 的拷贝，但仍有 write 拷贝
${F}

${F}java
// Java 的 FileChannel.transferTo 底层就是 sendfile(2)
try (FileChannel in = FileChannel.open(path);
     FileChannel out = FileChannel.open(socketPath, WRITE)) {
    long pos = 0, size = in.size();
    while (pos < size) {
        pos += in.transferTo(pos, size - pos, out);   // 循环直到搬完
    }
}
// 注意：单次调用可能只搬部分数据（尤其 socket 缓冲满时），必须循环
${F}

**Nginx 静态文件服务快的核心原因之一就是 sendfile**；但若开启了 gzip 或 TLS，数据必须经过用户态处理，零拷贝就失效了 —— 这也解释了「开 gzip 后吞吐下降」的部分原因。

### 四、内核旁路（DPDK/XDP）的适用边界

${F}text
DPDK：完全绕过内核协议栈，在用户态实现 TCP/IP（或直接用 UDP）
  优点：单机可达数千万 PPS，延迟微秒级
  代价：
    - 独占 CPU 核（轮询模式，不能与业务共享）
    - 独占网卡（需绑定 VFIO/UIO 驱动，失去常规网络工具能力）
    - 需要自研或引入成熟用户态协议栈（复杂度极高）
  适用：专用负载均衡、网关、高性能存储网络

XDP：不完全旁路，在驱动层做初步处理后再决定是否进协议栈
  适合：DDoS 清洗、简单转发、采样统计
  成本远低于 DPDK，是更务实的起点

判断标准：只有当 PPS（包速率）而非带宽成为瓶颈，
  且现有架构已无优化空间时，才考虑内核旁路。
${F}

### 五、压测与定位：如何找出单机瓶颈

${F}bash
# 1) 先确认瓶颈层次（CPU / 内存 / 网络 / fd / conntrack）
sar -n DEV 1            # 网卡吞吐与包速率
sar -n EDEV 1           # 网卡错误与丢包
sar -n SOCK 1           # socket 使用情况（tw/s、tcp使用量）
mpstat -P ALL 1         # 各核使用，看 %soft/%sys 分布
vmstat 1                # cs（上下文切换）、in（中断）
cat /proc/net/sockstat  # sockets: used / TCP: inuse / orphan / tw

# 2) 压测工具选择
wrk -t12 -c4000 -d60s http://target/         # HTTP 层，支持长连接
ab -n 1000000 -c 1000 http://target/         # 简单但功能弱
h2load -n 1000000 -c 1000 -m 100 https://... # HTTP/2 压测
# 关键：压测客户端本身的 fd 与端口也要调够，否则是客户端先到上限
${F}

定位顺序建议：**先看 error/drop（网络）→ 再看 fd/conntrack（资源）→ 最后看 CPU 分布（计算）**。大多数「连不上」或「吞吐上不去」的问题，根源在前两类。

### 六、单机容量的量级参考

${F}text
（现代 16~32 核服务器，万兆网卡，经验量级，非绝对上限）
长连接（每连接流量小、消息稀疏）  50 万 ~ 200 万连接
短连接（HTTP 请求-响应）          数万 ~ 数十万 QPS（取决于业务耗时）
小包吞吐（UDP 转发类）            100 万 ~ 1000 万 PPS
大带宽传输                        接近网卡线速（受零拷贝与 TLS 影响）

判断自己的场景属于哪一类，比抄别人的数字更重要：
  - 长连接多但空闲 -> 瓶颈在内存与 fd
  - 短连接高频    -> 瓶颈在握手开销、TIME_WAIT、accept 队列
  - 大包高带宽    -> 瓶颈在零拷贝与 TLS 加密
${F}

### 七、常见误区

1. **「连接数上限由端口决定」**。服务端监听端口不消耗客户端端口；真正的约束是 fd 与内存。
2. **「加了 epoll 就能上百万连接」**。还需要 fd、内存、conntrack "三件套"一起调，缺一不可。
3. **「零拷贝一定更快」**。小文件（小于 MTU）走 sendfile 反而多一次调用开销；大文件才是主战场，且开启 TLS/gzip 后会退化。
4. **「多线程就是高并发」**。线程数超过 CPU 并行度后，切换与锁竞争会让性能下降；关键是让每个核都处于有效计算状态。
5. **「压测到了瓶颈就是系统上限」**。常见的是压测机先到上限（fd、端口、CPU），必须同时监控压测端与被压端。

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

<!--dd:container-net-->

## 🔬 深挖：namespace、veth、CNI 与 K8s Service 的数据通路

### 一、容器网络的三块砖

${F}text
1) network namespace：独立的网络栈
   每个 netns 有自己的网卡、路由表、iptables 规则、socket 表
   容器"看起来像一台独立主机"的本质就是它

2) veth pair：一对虚拟网线
   一端插在容器 netns（如 eth0），另一端插在宿主 netns（如 vethXXX）
   从一端进入的包会从另一端出来 —— 这是"跨 namespace 通信"的实现

3) bridge：虚拟交换机
   宿主上的 docker0 / cni0 把多个 veth 连在一起
   同宿主容器互通走二层转发，不需要经过物理网卡
${F}

${F}bash
# 手工复现"Docker 网络"的全过程（理解这套机制的最好方式）
ip netns add ns1
ip link add veth1 type veth peer name veth1-br
ip link set veth1 netns ns1
ip addr add 172.18.0.1/24 dev veth1-br
ip link set veth1-br up
# 在 ns1 里配地址与路由（默认路由指向宿主）
ip netns exec ns1 ip addr add 172.18.0.2/24 dev veth1
ip netns exec ns1 ip link set veth1 up
ip netns exec ns1 ip route add default via 172.18.0.1
# 宿主开启转发（容器访问外网的前提）
sysctl -w net.ipv4.ip_forward=1
${F}

### 二、出网与 DNAT：为什么需要 iptables

${F}text
容器访问外网：内网地址 172.18.0.2 -> 需转成宿主的外网 IP
  iptables -t nat -A POSTROUTING -s 172.18.0.0/16 ! -o docker0 -j MASQUERADE
  这就是 SNAT/MASQUERADE

外部访问容器端口：DNAT
  iptables -t nat -A DOCKER -p tcp --dport 8080 -j DNAT --to-destination 172.18.0.2:80

由此带来的副作用：
  1) 每条 NAT 规则都依赖 conntrack 记录连接状态 -> conntrack 表成为瓶颈
  2) SNAT 后服务端看到的源 IP 是宿主，容器内需要真实 IP 时要额外处理
  3) iptables 规则随 Pod/Service 数量线性增长 -> 大规模集群下匹配开销显著
${F}

### 三、跨主机通信：Overlay 与 Underlay

| 方案 | 原理 | 优点 | 缺点 |
|---|---|---|---|
| Overlay（VXLAN） | 把二层帧封装进 UDP 包，跨主机传输 | 不依赖底层网络、易部署 | 封装开销（50 字节头部）、MTU 减少、排障复杂 |
| Underlay（BGP） | Pod IP 直接可路由，不封装 | 无封装开销、性能最好 | 需底层网络配合（BGP 对等） |
| 混合 | 同子网走二层，跨子网走 Overlay | 折中 | 配置复杂 |

${F}text
VXLAN 的 MTU 算术（最常见的故障源头）：
  物理网卡 MTU 1500
  - IPv4 头 20
  - UDP 头 8
  - VXLAN 头 8
  = 容器内可用 MTU 1464，实际配置常用 1450 或 1400

若不调整：小包正常、大包（如 gRPC 默认 4MB 消息、HTTP/2 大帧）超时或卡死
症状：应用日志显示"请求超时"，但 ping 与 curl 小请求都正常
${F}

### 四、CNI 插件对比

| 插件 | 数据面 | 特点 | 适用 |
|---|---|---|---|
| Flannel | VXLAN（默认） | 简单、够用 | 中小集群、重易用性 |
| Calico | BGP / IPIP / VXLAN | 支持 NetworkPolicy、性能好、可 Underlay | 需要网络策略与性能 |
| Cilium | eBPF | 性能极佳、可观测性强、替代 kube-proxy | 新集群、追求性能与可观测 |
| 云厂商 CNI | 弹性网卡/VPC 路由 | 与云网络打通、Pod 直接用 VPC IP | 公有云环境 |

### 五、K8s Service 的三种实现

${F}text
Service 只是一个"虚拟 IP + 端口"的抽象，后端由不同机制实现：

1) iptables 模式（默认）
   ClusterIP 用 iptables 的 DNAT 规则把请求随机转发到某个 Pod IP
   问题：规则数随 Service × Endpoint 数量线性增长
        每次变更要全量重写规则表（大规模集群下变更慢、CPU 抖动）
        负载均衡是随机的，不是"最少连接"

2) IPVS 模式
   用内核 IPVS 做四层负载均衡，支持 rr/wrr/lc 等多种调度算法
   用哈希表存储，规则数量增长时性能稳定
   缺点：需要内核模块；某些场景下 iptables 规则仍需保留（如 NodePort）

3) eBPF 模式（Cilium 等）
   用 eBPF 程序在 socket 层直接完成转发，绕过 iptables/IPVS
   性能最好、可观测性最强，可完全替代 kube-proxy
   缺点：依赖较新内核，生态相对新
${F}

### 六、故障排查的标准路径

${F}text
按"包走到哪一步断掉"逐层排查（容器网络问题的万能顺序）：
  1) 容器内：ip addr / ip route 是否正确？DNS 能否解析？
  2) 容器内：能否 ping 通网关（宿主 bridge IP）？
  3) 宿主上：ip link 看 veth 是否成对、是否 UP
  4) 宿主上：iptables -t nat -L -n -v 看规则与计数器是否命中
  5) 跨主机：宿主间能否直接通（物理网络）？VXLAN 端口 4789/UDP 是否放行？
  6) DNS：CoreDNS Pod 是否正常？/etc/resolv.conf 是否指向正确？
  7) MTU：大包是否被丢？用 ping -M do -s 逐步试探
${F}

${F}bash
# 容器内抓包（在宿主上用 nsenter 进入容器 netns）
PID=$(docker inspect -f '{{.State.Pid}}' <container>)
nsenter -t $PID -n tcpdump -i eth0 -nn port 80
# 或直接在容器里（若镜像包含 tcpdump）

# 检查 VXLAN 接口与邻居表
ip link show type vxlan
ip neigh show dev flannel.1

# 检查 conntrack 是否接近上限
sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max

# 用 mtr 分段定位丢包在哪一跳（比 traceroute 更直观）
mtr -n -T -P 443 <target>
${F}

### 七、性能损耗来源清单

| 损耗来源 | 量级 | 缓解 |
|---|---|---|
| VXLAN 封装/解封装 | 每包数十微秒 CPU | 用 Underlay/BGP，或开启硬件卸载（VXLAN offload） |
| iptables 规则链过长 | 随规则数线性增长 | 换 IPVS 或 eBPF |
| conntrack 查询 | 每包一次哈希查找 | 减少 NAT，或用 eBPF 旁路 |
| MTU 减少导致分片 | 显著（分片重组昂贵） | 正确设置 MTU，让应用不发超大包 |
| 用户态代理（如早期 kube-proxy userspace） | 极高 | 不要用 userspace 模式 |
| 网络策略（NetworkPolicy）实现方式 | 视实现而定 | 优先选 eBPF 实现 |

### 八、常见误区

1. **「容器网络慢是 Docker 的锅」**。VXLAN + iptables 的组合才是主因；同宿主 bridge 转发几乎无损耗。
2. **「ping 通就说明网络没问题」**。MTU 问题只在大包上显现，小包 ping 完全正常 —— 必须测大包。
3. **「Service 是真实存在的 IP」**。ClusterIP 是虚拟的，只在 iptables/IPVS/eBPF 规则里存在，任何主机上都不存在这个网卡。
4. **「改了 iptables 规则只影响新连接」**。移除 conntrack 相关规则会让已有连接失联；变更应通过 K8s API 而非手工改规则。
5. **「所有跨主机通信都要走 VXLAN」**。同节点通信走 bridge，根本不出宿主；这也是"同节点 Pod 通信比跨节点快很多"的原因。

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

<!--dd:syscall-profiling-->

## 🔬 深挖：观测工具全景与延迟分解方法

### 一、工具选择：先分类问题，再选工具

| 问题类型 | 首选工具 | 说明 |
|---|---|---|
| CPU 忙在哪 | ${C}perf top${C} / ${C}perf record${C} + 火焰图 | 采样分析，开销低 |
| 等待在哪（off-CPU） | ${C}perf sched${C} / bpftrace offcputime | 找出"不占 CPU 但很慢"的原因 |
| 系统调用行为 | ${C}strace${C} / ${C}perf trace${C} / bpftrace | 定位失败调用与超时调用 |
| IO 压力 | ${C}iostat${C} / ${C}biolatency${C} / ${C}biosnoop${C} | 区分"应用慢"与"磁盘慢" |
| 网络 | ${C}ss${C} / ${C}sar -n${C} / ${C}tcpdump${C} / ${C}tcplife${C} | 连接状态与流量 |
| 内存 | ${C}vmstat${C} / ${C}pidstat -r${C} / ${C}slabtop${C} / ${C}pmap${C} | 缺页、泄漏、缓存 |
| 锁与调度 | ${C}perf lock${C} / ${C}perf sched${C} | 锁竞争与调度延迟 |
| 全局一屏 | ${C}dstat${C} / ${C}sar${C} | 快速判断瓶颈层次 |

**核心原则：先用低开销工具缩小范围，再用高开销工具精确定位。** 反过来做（一上来就 strace）会把问题本身拖慢甚至掩盖。

### 二、USE 方法：系统性排查的骨架

${F}text
对每一个资源（CPU、内存、磁盘、网络接口、控制器），问三个问题：
  Utilization（使用率）—— 该资源有多少时间在忙？
  Saturation（饱和度） —— 有多少工作在排队等待？
  Errors（错误）       —— 有多少错误事件？

示例对照：
  CPU    %us+%sy / runqueue 长度 / -（一般无错误）
  内存   available 占比 / major fault、swap 换入换出 / OOM 事件
  磁盘   %util / aqu-sz、await / 介质错误（dmesg、smartctl）
  网络   带宽占用 / ring buffer drop、backlog drop / CRC 错误、重传
逐项填完这张表，瓶颈一定在其中某一行。这是避免"凭直觉猜"的最有效方法。
${F}

### 三、perf 与火焰图：CPU 分析的标准流程

${F}bash
# 1) 快速看热点函数（实时，适合先摸底）
perf top -p <pid>

# 2) 采样记录（-g 采集调用栈，频率 99Hz 开销可忽略）
perf record -F 99 -p <pid> -g -- sleep 30

# 3) 生成火焰图
perf script > out.perf
# 用 FlameGraph 工具链（github.com/brendangregg/FlameGraph）
./stackcollapse-perf.pl out.perf > out.folded
./flamegraph.pl out.folded > flame.svg

# 4) 直接看报告（无需图纸）
perf report --stdio | head -50
${F}

**火焰图读法（三个最容易误读的点）**：

${F}text
1) 宽度 = 该函数占用的采样比例（不是耗时绝对值）
2) 上下 = 调用栈层次（根在底部，叶子在顶部）
3) 找"平台"而不是"尖塔"：
   一个很宽但很平的栈，意味着该函数自身消耗大量 CPU（真正的热点）
   一个很窄但很深的栈，通常只是调用路径，不是问题所在
常见形态：
   宽平台在 libc 的 memcpy -> CPU 花在数据拷贝上（考虑零拷贝/减少拷贝）
   宽平台在 spin_lock / futex -> 锁竞争（考虑减小临界区或无锁结构）
   宽平台在 malloc/free -> 分配器压力（考虑对象池）
${F}

### 四、off-CPU 分析：找出「明明没占 CPU 却很慢」的原因

这是最容易被忽略的一类性能问题：CPU 空闲但请求很慢，因为线程在等锁、等 IO、等网络。

${F}bash
# 用 bpftrace 统计进程的 off-CPU 时间分布（需要 root，内核支持 BPF）
bpftrace -e '
tracepoint:sched:sched_switch /args->prev_comm == "java"/
{
  @start[args->prev_pid] = nsecs;
}
tracepoint:sched:sched_switch /@start[args->next_pid]/
{
  $d = nsecs - @start[args->next_pid];
  @offcpu = hist($d / 1000000);
  delete(@start[args->next_pid]);
}'
# 结果为毫秒级直方图：能看到等待分布是"几十毫秒"还是"几秒"
${F}

${F}bash
# 直接看谁在等谁（阻塞栈）
perf record -e sched:sched_stat_sleep -e sched:sched_switch -a -g -- sleep 10
perf script | stackcollapse-perf.pl | flamegraph.pl > offcpu.svg

# 或者追踪"谁调用了 fsync 且耗时多久"（最常见的长尾来源）
bpftrace -e '
kprobe:vfs_fsync { @s[tid] = nsecs; }
kretprobe:vfs_fsync /@s[tid]/ { @ms = hist((nsecs - @s[tid]) / 1000000); delete(@s[tid]); }'
${F}

### 五、bpftrace 常用「一行命令」工具箱

${F}bash
# 按进程统计系统调用次数（找最"闹"的进程）
bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'

# 统计每个进程的读写字节（找 IO 大户）
bpftrace -e 'tracepoint:syscalls:sys_exit_read { @[comm] = sum(args->ret); }'

# 追踪超过 10ms 的磁盘 IO（定位 IO 抖动）
bpftrace -e 'kprobe:blk_account_io_start { @s[arg0] = nsecs; }
             kretprobe:blk_account_io_done /@s[arg0]/ {
               $d = (nsecs - @s[arg0]) / 1000000;
               if ($d > 10) { printf("%s %dms\\n", comm, $d); }
               delete(@s[arg0]); }'

# 找出哪些 TCP 连接在重传
bpftrace -e 'kprobe:tcp_retransmit_skb { @[comm, pid] = count(); }'

# 追踪进程启动（回答"这个进程是谁拉起来的"）
bpftrace -e 'tracepoint:sched:sched_process_exec { printf("%s -> %s\\n", comm, str(args->filename)); }'
${F}

### 六、strace：强但危险，必须知道它的代价

${F}text
strace 的两种模式与开销差异巨大：
  ptrace 模式（默认）：每个系统调用都要两次上下文切换 + 一次寄存器读写
    开销可达原程序的 10~100 倍 —— 在生产上可能直接把服务拖死
  seccomp-bpf / perf trace 模式：开销低得多（部分支持）

安全的替代方案（按优先级）：
  1) perf trace       —— 基于采样，开销低
  2) bpftrace 追踪具体 syscall —— 精准且开销可控
  3) strace -p 短时间附加 + -e 限定 syscall + -f 谨慎使用

若必须用 strace：
  - 加上 -e trace=<只关心的 syscall> 缩小范围
  - 用 -T 显示每个调用的耗时，快速找出慢调用
  - 用 -c 做统计汇总而非打印全部（输出量小很多）
  - 绝不要在高峰期对核心进程长时间附加
${F}

${F}bash
# 统计模式（输出小，适合初步定位）
strace -c -p <pid>
# 只看慢调用（显示每个调用的耗时）
strace -T -e trace=network -p <pid>
# 看文件相关调用失败原因
strace -e trace=openat,read,write -f ./app 2>&1 | grep -E "= -1"
${F}

### 七、延迟分解：把"慢"拆成可测量的段

${F}text
方法：在关键路径埋时间戳，逐段测量，而不是看总耗时。
示例（一次 RPC 处理）：
  t0 收到请求
  t1 完成参数校验
  t2 拿到 DB 连接（连接池等待）
  t3 完成 DB 查询
  t4 完成序列化
  t5 发出响应

由此可得到：
  连接池等待 = t2 - t1     <- 常见的大头，且不体现在 SQL 耗时里
  DB 执行     = t3 - t2
  序列化      = t4 - t3
  网络写      = t5 - t4
没有这套分解，"接口慢"永远只能靠猜；有了它，一眼看出是哪一段。
这也是链路追踪（Tracing）的核心价值：把各段耗时自动采集并可视化。
${F}

### 八、常见性能问题的归因速查表

| 现象 | 先看 | 常见根因 |
|---|---|---|
| CPU 高、吞吐低 | perf 火焰图 | 锁竞争、过度序列化、O(n²) 算法、频繁 GC |
| CPU 不高但请求慢 | off-CPU 分析 | 等锁、等 DB/HTTP、等磁盘 fsync |
| 延迟周期性尖刺 | ${C}biolatency${C} / ${C}vfs_fsync${C} | 脏页回写风暴、SSD GC、快照/备份任务 |
| 吞吐上不去、连接排队 | ${C}ss -lnt${C} 的 Send-Q | accept 队列溢出、backlog 太小、accept 线程少 |
| 内存持续增长 | ${C}pmap${C} / ${C}pidstat -r${C} | 泄漏、缓存无上限、对象池未回收 |
| 网络重传多 | ${C}nstat${C} / ${C}ss -ti${C} | 丢包、链路拥塞、MTU 黑洞 |
| 系统调用耗时异常 | ${C}perf trace${C} | 文件系统元数据锁、NFS 卡顿、审计日志 |

### 九、观测自身的纪律

${F}text
1) 观测是有成本的：先估开销再上，能用低开销工具就别上高开销的
2) 先看全局再钻细节：dstat/sar 一屏判断层次，再针对性深挖
3) 采样优于追踪：perf 采样对生产几乎无感，全量追踪可能拖垮服务
4) 一次只改一个变量：同时改多个参数无法判断哪个起了作用
5) 留证据：采样数据、火焰图、命令输出都存档，作为复盘与基线对比的材料
6) 别在生产上"试试看"：所有追踪脚本先在预发验证过再上生产
${F}

### 十、常见误区

1. **「CPU 使用率高就是性能问题」**。CPU 高但延迟正常、吞吐达标，说明资源被有效利用，不是问题。
2. **「加了监控就能定位问题」**。指标只能告诉你"哪里不对"，定位到代码行还需要火焰图、追踪与日志的配合。
3. **「strace 是万能工具」**。它的开销极为可观，且只覆盖系统调用层，看不到用户态热点与阻塞原因。
4. **「平均延迟达标就没事」**。p99 才是用户感知；平均值会掩盖长尾，而长尾往往才是事故的起点。
5. **「问题解决就不需要再看」**。性能基线与火焰图应定期存档并对比，才能发现"缓慢劣化"型问题（每次发布慢一点点，几个月后才发现）。

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
