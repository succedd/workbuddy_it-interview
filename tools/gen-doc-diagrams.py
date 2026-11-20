#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成技术教程配图 -> assets/diagrams/docs/*.svg

风格沿用 assets/diagrams/mysql-icp.svg：浅底、圆角浅色框、蓝/青箭头。
所有图由数据驱动（flow / seq / tree / cols / stack 五种版式 + 少量定制图），
改文案只需改下方 DIAGRAMS 里的数据，然后重跑：python3 tools/gen-doc-diagrams.py
"""
import html, os, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "diagrams", "docs")
W = 900
FONT = "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif"
INK, BODY, MUTED = "#0f172a", "#334155", "#64748b"
BLUE, TEAL, RED = "#2563eb", "#0f766e", "#dc2626"
PAL = {
    "b": ("#eff6ff", "#93c5fd"), "g": ("#ecfdf5", "#6ee7b7"), "r": ("#fef2f2", "#fca5a5"),
    "o": ("#fff7ed", "#fdba74"), "l": ("#f0fdf4", "#86efac"), "p": ("#f5f3ff", "#c4b5fd"),
    "y": ("#fefce8", "#fde047"), "s": ("#f1f5f9", "#cbd5e1"),
}


def esc(s):
    return html.escape(str(s))


def tw(s, fs):
    """估算文本宽度：全角字符按 1em，半角按 0.58em。"""
    w = 0
    for ch in str(s):
        w += fs if unicodedata.east_asian_width(ch) in "WF" else fs * 0.58
    return w


def wrap(s, maxw, fs):
    out = []
    for para in str(s).split("\n"):
        cur = ""
        for ch in para:
            if cur and tw(cur + ch, fs) > maxw:
                # 尽量在空格处断开英文
                if " " in cur and ch != " ":
                    i = cur.rfind(" ")
                    out.append(cur[:i]); cur = cur[i + 1:] + ch
                    continue
                out.append(cur); cur = ch.lstrip()
            else:
                cur += ch
        out.append(cur)
    return out


def svg(h, title, sub, body):
    head = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" font-family="%s">\n'
            '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker>'
            '<marker id="t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker>'
            '<marker id="r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker></defs>\n'
            '<rect width="%d" height="%d" fill="#f8fafc"/>\n'
            '<text x="40" y="38" font-size="22" font-weight="700" fill="%s">%s</text>\n'
            % (W, h, FONT, BLUE, TEAL, RED, W, h, INK, esc(title)))
    if sub:
        head += '<text x="40" y="64" font-size="15" fill="%s">%s</text>\n' % (MUTED, esc(sub))
    return head + "\n".join(body) + "\n</svg>\n"


def text(x, y, s, fs=14, color=BODY, anchor="middle", weight="400"):
    return '<text x="%.1f" y="%.1f" font-size="%s" fill="%s" text-anchor="%s" font-weight="%s">%s</text>' % (
        x, y, fs, color, anchor, weight, esc(s))


def rect(x, y, w, h, c="b", rx=12, dash=False):
    fc, sc = PAL[c]
    d = ' stroke-dasharray="6 5"' if dash else ""
    return '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%d" fill="%s" stroke="%s" stroke-width="1.6"%s/>' % (
        x, y, w, h, rx, fc, sc, d)


def box(x, y, w, h, head, desc="", c="b", hfs=16, dfs=13, anchor="middle"):
    """带标题与说明的框；文本按宽度自动换行并垂直居中。"""
    pad = 12
    hl = wrap(head, w - 2 * pad, hfs) if head else []
    dl = wrap(desc, w - 2 * pad, dfs) if desc else []
    total = len(hl) * (hfs + 4) + (6 if hl and dl else 0) + len(dl) * (dfs + 5)
    cy = y + (h - total) / 2
    tx = x + w / 2 if anchor == "middle" else x + pad
    out = [rect(x, y, w, h, c)]
    for ln in hl:
        cy += hfs + 4
        out.append(text(tx, cy - 4, ln, hfs, INK, anchor, "700"))
    if hl and dl:
        cy += 6
    for ln in dl:
        cy += dfs + 5
        out.append(text(tx, cy - 5, ln, dfs, BODY, anchor))
    return "\n".join(out)


def arrow(x1, y1, x2, y2, color="a", dash=False, w=2):
    col = {"a": BLUE, "t": TEAL, "r": RED}[color]
    d = ' stroke-dasharray="6 5"' if dash else ""
    return '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%s"%s marker-end="url(#%s)"/>' % (
        x1, y1, x2, y2, col, w, d, color)


def path(d, color="a", dash=False, end=True):
    col = {"a": BLUE, "t": TEAL, "r": RED}[color]
    ds = ' stroke-dasharray="6 5"' if dash else ""
    me = ' marker-end="url(#%s)"' % color if end else ""
    return '<path d="%s" fill="none" stroke="%s" stroke-width="2"%s%s/>' % (d, col, ds, me)


def line(x1, y1, x2, y2, color=MUTED, w=1.5, dash=False):
    d = ' stroke-dasharray="5 5"' if dash else ""
    return '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%s"%s/>' % (x1, y1, x2, y2, color, w, d)


def note(y, s, fs=13):
    """底部说明，可多行。返回 (元素列表, 占用高度)。"""
    ls = wrap(s, W - 80, fs)
    return [text(40, y + (i + 1) * (fs + 7), ln, fs, MUTED, "start") for i, ln in enumerate(ls)], len(ls) * (fs + 7) + 6


# ---------------------------------------------------------------- 版式
# 每个版式返回 (元素列表, 底部 y)
TOP = 92


def need_h(w, head, desc, hfs=16, dfs=13, minh=60):
    hl = len(wrap(head, w - 24, hfs)) if head else 0
    dl = len(wrap(desc, w - 24, dfs)) if desc else 0
    return max(minh, hl * (hfs + 4) + dl * (dfs + 5) + (6 if hl and dl else 0) + 26)


def flow(items, per_row=4, gap=36, y=TOP, minh=78, labels=None):
    """横向步骤流，超过 per_row 自动换行（折回行首）。items: [(head, desc, c)]"""
    n = min(per_row, len(items))
    bw = (W - 80 - gap * (n - 1)) / n
    rows = [items[i:i + per_row] for i in range(0, len(items), per_row)]
    out, cy = [], y
    prev = None
    for r, row in enumerate(rows):
        bh = max(need_h(bw, h, d, minh=minh) for h, d, _ in row)
        for i, (h, d, c) in enumerate(row):
            x = 40 + i * (bw + gap)
            out.append(box(x, cy, bw, bh, h, d, c))
            k = r * per_row + i
            if i > 0:
                out.append(arrow(x - gap + 3, cy + bh / 2, x - 3, cy + bh / 2))
                if labels and labels.get(k):
                    out.append(text(x - gap / 2, cy + bh / 2 - 8, labels[k], 11, BLUE))
            elif prev:
                px, py = prev
                out.append(path("M%.1f %.1f V%.1f H%.1f V%.1f" % (px, py + 2, py + 18, 40 + bw / 2, cy - 3)))
        last_x = 40 + (len(row) - 1) * (bw + gap)
        prev = (last_x + bw / 2, cy + bh)
        cy += bh + 40
    return out, cy - 40


def seq(actors, msgs, y=TOP, step=46):
    """时序图。actors: [(name, c)]；msgs: (i, j, label[, kind, dash]) 或 ("--", 分隔文字)"""
    n = len(actors)
    span = (W - 80) / n
    xs = [40 + span * (i + 0.5) for i in range(n)]
    aw = min(190, span - 20)
    out = []
    for (nm, c), x in zip(actors, xs):
        out.append(box(x - aw / 2, y, aw, 46, nm, "", c, hfs=15))
    cy = y + 46 + 30
    body = []
    for m in msgs:
        if m[0] == "--":
            body.append(line(40, cy - 10, W - 40, cy - 10, "#cbd5e1", 1.2, True))
            body.append('<rect x="%.1f" y="%.1f" width="%.1f" height="22" rx="11" fill="#f8fafc"/>' % (
                W / 2 - tw(m[1], 13) / 2 - 12, cy - 21, tw(m[1], 13) + 24))
            body.append(text(W / 2, cy - 5, m[1], 13, TEAL, weight="700"))
            cy += 30
            continue
        i, j, lab = m[0], m[1], m[2]
        kind = m[3] if len(m) > 3 else "a"
        dash = m[4] if len(m) > 4 else False
        if i == j:
            sh = max(34, len(wrap(lab, aw - 44, 12)) * 17 + 12)
            body.append(box(xs[i] - aw / 2 + 10, cy - 24, aw - 20, sh, "", lab, "y", dfs=12))
            cy += sh - 34
        else:
            d = 1 if j > i else -1
            body.append(arrow(xs[i] + 4 * d, cy, xs[j] - 4 * d, cy, kind, dash))
            col = {"a": BLUE, "t": TEAL, "r": RED}[kind]
            body.append(text((xs[i] + xs[j]) / 2, cy - 8, lab, 13, col))
        cy += step
    for x in xs:
        out.append(line(x, y + 46, x, cy - step + 20, "#94a3b8", 1.4, True))
    return out + body, cy - step + 20


def stack(layers, y=TOP, lw=190, rh=None, side=None):
    """分层堆叠。layers: [(name, desc, c)]；side: 右侧竖向标注 [(起层, 止层, 文字)]"""
    out, cy = [], y
    right = W - 40 - (150 if side else 0)
    pos = []
    for nm, desc, c in layers:
        h = rh or max(56, need_h(right - 40 - lw - 20, "", desc, minh=56))
        out.append(rect(40, cy, right - 40, h, c))
        out.append(line(40 + lw, cy + 10, 40 + lw, cy + h - 10, PAL[c][1], 1.2))
        for k, ln in enumerate(wrap(nm, lw - 24, 15)):
            nl = len(wrap(nm, lw - 24, 15))
            out.append(text(40 + lw / 2, cy + h / 2 - nl * 10 + 15 + k * 20, ln, 15, INK, weight="700"))
        dl = wrap(desc, right - 40 - lw - 30, 13)
        ty = cy + h / 2 - (len(dl) * 18) / 2 + 13
        for k, ln in enumerate(dl):
            out.append(text(40 + lw + 18, ty + k * 18, ln, 13, BODY, "start"))
        pos.append((cy, cy + h))
        cy += h + 8
    for a, b, s in side or []:
        y1, y2 = pos[a][0], pos[b][1]
        x = right + 24
        out.append(path("M%.1f %.1f H%.1f V%.1f H%.1f" % (x - 14, y1 + 6, x, y2 - 6, x - 14), "t", end=False))
        sl = wrap(s, 110, 13)
        for k, ln in enumerate(sl):
            out.append(text(x + 12, (y1 + y2) / 2 - len(sl) * 9 + 14 + k * 18, ln, 13, TEAL, "start", "700"))
    return out, cy - 8


def cols(columns, y=TOP, gap=24, ih=None):
    """并列对比栏。columns: [(head, c, [item, ...])]，item 可为 'a' 或 ('a', 'desc')"""
    n = len(columns)
    cw = (W - 80 - gap * (n - 1)) / n
    out, bottom = [], y
    hh = max(need_h(cw, h, "", minh=50) for h, _, _ in columns)
    for k, (head, c, items) in enumerate(columns):
        x = 40 + k * (cw + gap)
        out.append(box(x, y, cw, hh, head, "", c, hfs=16))
        cy = y + hh + 12
        for it in items:
            h_, d_ = (it, "") if isinstance(it, str) else it
            bh = ih or need_h(cw, h_, d_, hfs=14, dfs=12, minh=44)
            out.append(box(x, cy, cw, bh, h_, d_, "s", hfs=14, dfs=12))
            cy += bh + 10
        bottom = max(bottom, cy - 10)
    return out, bottom


def tree(root, children, y=TOP, ch=64):
    """层级树。root: (head, desc, c)；children: [(head, desc, c, [leaf, ...])]"""
    out = []
    rw = min(380, W - 80)
    rh = need_h(rw, root[0], root[1], minh=56)
    out.append(box(W / 2 - rw / 2, y, rw, rh, root[0], root[1], root[2]))
    n = len(children)
    gap = 16
    cw = (W - 80 - gap * (n - 1)) / n
    bus = y + rh + 22
    cy = bus + 24
    out.append(line(W / 2, y + rh, W / 2, bus, BLUE, 2))
    xs = [40 + k * (cw + gap) + cw / 2 for k in range(n)]
    out.append(line(xs[0], bus, xs[-1], bus, BLUE, 2))
    hh = max(need_h(cw, h, d, hfs=15, minh=ch) for h, d, _, _ in children)
    bottom = cy + hh
    for x, (h, d, c, leaves) in zip(xs, children):
        out.append(arrow(x, bus, x, cy - 2))
        out.append(box(x - cw / 2, cy, cw, hh, h, d, c, hfs=15))
        ly = cy + hh + 12
        for lf in leaves:
            lh, ld = (lf, "") if isinstance(lf, str) else lf
            bh = need_h(cw - 16, lh, ld, hfs=13, dfs=12, minh=36)
            out.append(line(x, ly - 12, x, ly, "#94a3b8", 1.4))
            out.append(box(x - cw / 2 + 8, ly, cw - 16, bh, lh, ld, "s", hfs=13, dfs=12))
            ly += bh + 12
        bottom = max(bottom, ly - 12)
    return out, bottom


def bars(rows, y=TOP, rh=40, lw=150):
    """封装/字段条。rows: [(左侧标签, [(段文字, 宽度权重, c)])]，各行右对齐"""
    out, cy = [], y
    full = W - 80 - lw
    total = max(sum(s[1] for s in segs) for _, segs in rows)
    unit = full / total
    for lab, segs in rows:
        out.append(text(40, cy + rh / 2 + 5, lab, 14, INK, "start", "700"))
        x = W - 40 - sum(s[1] for s in segs) * unit
        for s, wgt, c in segs:
            w = wgt * unit
            out.append(box(x, cy, w - 4, rh, s, "", c, hfs=13))
            x += w
        cy += rh + 14
    return out, cy - 14


# ---------------------------------------------------------------- 图定义
DIAGRAMS = {}


def diagram(name):
    def deco(fn):
        DIAGRAMS[name] = fn
        return fn
    return deco


def done(title, sub, built, tip=""):
    els, bottom = built
    els = list(els)
    if tip:
        ns, nh = note(bottom + 14, tip)
        els += ns
        bottom += 14 + nh
    return svg(int(bottom + 28), title, sub, els)


# ---- 网络与操作系统
@diagram("tcpip-encapsulation")
def _():
    return done("TCP/IP 封装：每往下一层就多一个头", "发送方自上而下加头，接收方自下而上剥头", bars([
        ("应用层", [("应用数据 GET / HTTP/1.1", 6, "b")]),
        ("传输层 TCP", [("TCP 头 20B", 2, "g"), ("应用数据", 6, "b")]),
        ("网络层 IP", [("IP 头 20B", 2, "o"), ("TCP 头", 2, "g"), ("应用数据", 6, "b")]),
        ("链路层 以太网", [("帧头 14B", 2, "p"), ("IP 头", 2, "o"), ("TCP 头", 2, "g"), ("应用数据", 6, "b"), ("FCS", 1, "p")]),
    ]), "路由器只看 IP 头，交换机只看以太网头；每层的头只被对端的同一层解读。以太网 MTU 1500 字节 = IP 头 + TCP 头 + 最多 1460 字节数据（MSS）。")


@diagram("tcp-handshake")
def _():
    return done("TCP 三次握手与四次挥手", "双方各自确认「我能发、你能收」，再各自关闭自己的发送方向", seq(
        [("客户端", "b"), ("服务端", "g")], [
            ("--", "建立连接"),
            (0, 1, "SYN  seq=x"),
            (1, 0, "SYN+ACK  seq=y, ack=x+1", "t"),
            (0, 1, "ACK  ack=y+1"),
            ("--", "传输数据（ESTABLISHED）"),
            (0, 1, "数据 / ACK 往返", "a", True),
            ("--", "关闭连接"),
            (0, 1, "FIN  客户端不再发送"),
            (1, 0, "ACK", "t"),
            (1, 0, "FIN  服务端也发完了", "t"),
            (0, 1, "ACK  然后等待 2MSL（TIME_WAIT）"),
        ], step=42), "第三次握手防止「失效的旧 SYN」建立连接；主动关闭方进入 TIME_WAIT，确保最后一个 ACK 丢了还能重发，并让旧报文在网络中消失。")


@diagram("tcp-cwnd")
def _():
    return done("TCP 拥塞控制四个阶段", "cwnd（拥塞窗口）决定一次最多能发多少未确认数据", flow([
        ("慢启动", "cwnd 从 10 个 MSS 起步，每个 RTT 翻倍（指数增长）", "b"),
        ("拥塞避免", "超过 ssthresh 后每个 RTT 只加 1 个 MSS（线性增长）", "g"),
        ("快速重传", "收到 3 个重复 ACK，不等超时立即重传丢失段", "o"),
        ("快速恢复", "ssthresh = cwnd/2，cwnd 减半后继续线性增长", "p"),
    ], gap=64, labels={1: "到阈值", 2: "丢包", 3: "重传后"}), "如果是超时（RTO）才发现丢包，说明网络很差：cwnd 直接降到 1，重新慢启动。Linux 默认算法是 CUBIC，生产上也常换成 BBR。")


@diagram("tls13-handshake")
def _():
    return done("TLS 1.3 握手（1-RTT）", "一个往返完成密钥协商和身份验证，之后全部加密", seq(
        [("客户端", "b"), ("服务端", "g")], [
            (0, 1, "ClientHello：支持的套件 + key_share（ECDHE 公钥）"),
            (1, 0, "ServerHello：选定套件 + key_share", "t"),
            ("--", "双方各自算出握手密钥，以下加密传输"),
            (1, 0, "EncryptedExtensions、Certificate", "t"),
            (1, 0, "CertificateVerify（证明持有私钥）、Finished", "t"),
            (0, 0, "校验证书链、域名、有效期"),
            (0, 1, "Finished"),
            ("--", "应用数据（HTTP 请求 / 响应）"),
            (0, 1, "GET /  ⇄  200 OK", "a", True),
        ], step=44), "TLS 1.2 需要 2-RTT；1.3 删掉了 RSA 密钥交换和不安全套件，只保留前向安全的 (EC)DHE。会话恢复可用 0-RTT，但 0-RTT 数据可被重放，只能用于幂等请求。")


@diagram("dns-resolve")
def _():
    return done("DNS 解析全过程", "浏览器问一次，递归解析器替你跑完整条链", seq(
        [("浏览器 / 系统", "b"), ("递归解析器", "g"), ("根服务器", "o"), (".com 顶级域", "p"), ("权威服务器", "y")], [
            (0, 0, "查浏览器、系统缓存、hosts"),
            (0, 1, "www.example.com ?"),
            (1, 2, "问根"),
            (2, 1, "去问 .com", "t"),
            (1, 3, "问 .com"),
            (3, 1, "去问 example.com 的 NS", "t"),
            (1, 4, "问权威"),
            (4, 1, "A 93.184.216.34  TTL 300", "t"),
            (1, 0, "返回结果并按 TTL 缓存", "t"),
        ], step=40), "客户端到递归解析器是「递归查询」，解析器到各级服务器是「迭代查询」。CDN 就是在权威服务器这一步，根据解析器位置返回离用户最近的节点 IP。")


@diagram("io-multiplexing")
def _():
    return done("select / poll / epoll 对比", "都是「一个线程等很多连接」，差别在怎么告诉你谁就绪", cols([
        ("select", "s", [("fd 上限 1024", "FD_SETSIZE 固定"), ("每次调用全量拷贝", "用户态 → 内核态"), ("返回后遍历全部 fd", "O(n) 找就绪"), ("可移植性最好", "POSIX 标准")]),
        ("poll", "o", [("无数量上限", "pollfd 数组"), ("每次仍全量拷贝", "和 select 一样"), ("返回后仍需遍历", "O(n)"), ("解决了上限问题", "没解决效率问题")]),
        ("epoll（Linux）", "g", [("epoll_ctl 注册一次", "内核红黑树保存"), ("就绪 fd 进就绪链表", "回调驱动"), ("epoll_wait 只返回就绪", "O(就绪数)"), ("支持 LT / ET", "ET 必须非阻塞读到 EAGAIN")]),
    ]), "连接数少时三者差别不大；上万连接、活跃比例低时 epoll 优势明显。Nginx、Redis、Netty 在 Linux 上都基于 epoll。")


@diagram("write-path")
def _():
    return done("一次 write() 的数据落盘路径", "write 返回成功 ≠ 数据已在磁盘上", stack([
        ("应用程序", "调用 write(fd, buf, n)，数据从用户缓冲区拷进内核", "b"),
        ("VFS", "统一接口，按 inode 找到具体文件系统（ext4 / xfs）", "s"),
        ("Page Cache", "数据写进页缓存并标记为脏页，write 到这里就返回了", "o"),
        ("文件系统 + 块层", "日志（journal）、IO 调度、合并请求", "g"),
        ("磁盘 / SSD", "设备自身还有易失缓存，需要 FLUSH 才算真正持久", "p"),
    ], side=[(0, 2, "很快，可能丢"), (3, 4, "fsync() 才保证到这里")]), "脏页由内核按 dirty_ratio / dirty_expire 定期回写；数据库在提交事务时调用 fsync 或使用 O_DIRECT，就是为了不依赖这个时机。")


@diagram("virtual-memory")
def _():
    return done("虚拟内存：每个进程都以为自己独占内存", "CPU 发出虚拟地址，MMU 查页表换成物理地址", flow([
        ("进程 A 虚拟地址", "0x7f..1000（只在本进程有意义）", "b"),
        ("TLB", "页表缓存，命中直接得到物理页号，约 1 个时钟周期", "y"),
        ("页表（多级）", "TLB 未命中时由 MMU 逐级查表（x86-64 为 4/5 级）", "o"),
        ("物理内存页", "4KB 一页；未分配或被换出则触发缺页中断", "g"),
    ], gap=56, labels={1: "查", 2: "未命中", 3: "得到"}), "缺页分两种：minor（页在内存里，只是没建映射，很快）和 major（要从磁盘读，很慢）。两个进程的同一虚拟地址可以映射到不同物理页，这就是隔离。")


@diagram("process-states")
def _():
    return done("Linux 进程状态与转换", "ps / top 的 STAT 列看到的就是这些字母", flow([
        ("新建", "fork() / clone() 创建 task_struct", "s"),
        ("R 就绪 / 运行", "在 CPU 运行队列里，等待或正在占用 CPU", "g"),
        ("S / D 睡眠", "S 可被信号唤醒；D 不可中断，多为等磁盘或 NFS", "o"),
        ("Z 僵尸", "已退出，等父进程 wait() 回收退出码", "r"),
    ], gap=56, labels={1: "调度", 2: "等 IO", 3: "exit"}), "S/D 在等待的事件完成后回到 R。D 状态进程 kill -9 也杀不掉，它会推高 load average；大量 Z 说明父进程没有调用 wait()，要处理的是父进程。")


@diagram("container-net")
def _():
    els = []
    els.append(box(40, TOP, 250, 150, "容器 A（netns）", "eth0  172.17.0.2\n独立的网卡、路由表和防火墙规则", "b"))
    els.append(box(610, TOP, 250, 150, "容器 B（netns）", "eth0  172.17.0.3\n同样独立的网络栈", "b"))
    els.append(box(300, TOP + 230, 300, 70, "docker0 网桥  172.17.0.1", "二层交换机，连接所有 veth", "g"))
    els.append(box(300, TOP + 360, 300, 70, "宿主机 eth0  10.0.0.5", "iptables MASQUERADE 做 SNAT 出网", "o"))
    els.append(box(330, TOP + 40, 240, 70, "veth pair", "一对虚拟网线：一端在容器，一端插网桥", "y"))
    els.append(path("M165 %d V%d H300" % (TOP + 150, TOP + 265)))
    els.append(path("M735 %d V%d H600" % (TOP + 150, TOP + 265)))
    els.append(arrow(450, TOP + 300, 450, TOP + 357, "t"))
    els.append(arrow(450, TOP + 430, 450, TOP + 480, "t"))
    els.append(text(450, TOP + 500, "外部网络", 14, TEAL, weight="700"))
    els.append(text(470, TOP + 340, "NAT", 12, TEAL, "start"))
    return done("容器网络：netns + veth + 网桥 + NAT", "Docker 默认 bridge 模式的数据路径", (els, TOP + 505),
                "同一网桥上的容器直接二层互通；访问外网时源地址被改写为宿主机 IP；-p 8080:80 本质是一条 DNAT 规则。Kubernetes 的 CNI 插件把这套模型扩展到跨主机。")


# ---- 数据库
@diagram("bplus-index")
def _():
    return done("InnoDB 索引：聚簇索引与二级索引", "二级索引叶子只存主键，查其他列要「回表」", tree(
        ("根节点（非叶子页）", "只存键值 + 子页指针，一页 16KB 能放上千个指针", "b"), [
            ("聚簇索引（主键）", "叶子节点存整行数据", "g", ["id=1 · 张三 · 25 · 北京", "id=2 · 李四 · 30 · 上海", "叶子之间双向链表 → 范围扫描快"]),
            ("二级索引 idx_name", "叶子节点存「索引列 + 主键」", "o", ["李四 → id=2", "张三 → id=1", "要 age 列？拿 id 回聚簇索引再查一次"]),
            ("覆盖索引", "查询列都在索引里", "p", ["SELECT id,name WHERE name=?", "不回表，EXPLAIN 显示 Using index"]),
        ]), "三层 B+ 树就能存约 2000 万行，所以主键查询一般只要 1~3 次磁盘 IO。主键用自增整数可以避免页分裂；二级索引越多，写入越慢。")


@diagram("mvcc-readview")
def _():
    return done("MVCC：版本链 + ReadView 决定「我能看到哪个版本」", "快照读不加锁，靠 undo log 里的历史版本实现", flow([
        ("当前行  trx_id=300", "name='王五'，roll_ptr 指向上一版", "r"),
        ("undo 版本  trx_id=200", "name='李四'", "o"),
        ("undo 版本  trx_id=100", "name='张三'", "g"),
    ], per_row=3, gap=56, labels={1: "roll_ptr", 2: "roll_ptr"}), "ReadView 记录：创建时的活跃事务列表 m_ids、最小活跃 id、下一个将分配的 id。从最新版本往回找，第一个「已提交且不在 m_ids 中」的版本就是你看到的。RC 每条语句新建 ReadView，RR 整个事务只建一次，所以 RR 可重复读。")


@diagram("replication")
def _():
    return done("MySQL 主从复制：三个线程", "主库写 binlog，从库拉取后重放", flow([
        ("主库提交事务", "写 binlog（ROW 格式记录行变更）", "b"),
        ("Binlog Dump 线程", "主库上，把新的 binlog 事件推给从库", "g"),
        ("从库 IO 线程", "接收事件写入本地 relay log", "o"),
        ("从库 SQL 线程", "读取 relay log 重放（可多线程并行）", "p"),
    ], gap=48), "延迟通常卡在 SQL 线程：大事务、无主键表、单线程重放。用 GTID 定位复制位点，用 semi-sync 保证至少一个从库收到才返回提交成功。")


@diagram("backup-pitr")
def _():
    return done("全量备份 + binlog = 恢复到任意时间点（PITR）", "例：周日全备，周三 14:05 误删表，恢复到 14:04:59", flow([
        ("还原全量备份", "周日 02:00 的 xtrabackup / mysqldump", "b"),
        ("找到备份位点", "备份文件里记录的 binlog 文件名 + 位置 / GTID", "g"),
        ("重放 binlog", "mysqlbinlog\n--stop-datetime\n截到误操作前", "o"),
        ("校验后切换", "核对行数与关键数据，再让业务接入", "p"),
    ], gap=48), "没有连续的 binlog，就只能恢复到全备那一刻。备份必须定期做恢复演练：「备份成功」不代表「能恢复」。")


@diagram("migration-phases")
def _():
    return done("数据迁移七阶段（双写方案）", "每一步都可回退，切读之前旧库始终是权威数据源", flow([
        ("1 建新库", "表结构、索引、账号", "s"),
        ("2 开双写", "写旧库为主，异步写新库", "b"),
        ("3 迁存量", "按主键分批搬历史数据", "b"),
        ("4 校验", "全量 + 增量对比，修差异", "o"),
        ("5 灰度切读", "按比例把读流量切到新库", "g"),
        ("6 切写", "新库为主，旧库反向同步兜底", "g"),
        ("7 下线旧库", "观察期结束后停双写", "p"),
    ], per_row=4, gap=40), "最危险的是第 6 步：要有明确的回切开关和数据对账。存量迁移要限速，避免把线上库打满。")


@diagram("ha-topology")
def _():
    return done("数据库高可用方案光谱", "RPO = 最多丢多少数据，RTO = 多久恢复服务", cols([
        ("主从 + 手动切换", "s", [("RPO：秒级~分钟", "异步复制可能丢"), ("RTO：十几分钟", "靠人"), ("适合：内部系统", "")]),
        ("半同步 + 自动切换", "o", [("RPO：接近 0", "至少一个从库确认"), ("RTO：30 秒内", "Orchestrator / MHA"), ("适合：大多数业务", "")]),
        ("MGR / 分布式数据库", "g", [("RPO：0", "Paxos 多数派提交"), ("RTO：秒级", "自动选主"), ("适合：核心交易", "")]),
        ("同城双活 + 异地灾备", "p", [("防机房级故障", "两地三中心"), ("成本最高", "要定期演练"), ("适合：金融级", "")]),
    ], gap=16), "方案没有最好，只有和业务可承受损失匹配的。切换后一定要防「脑裂」：旧主恢复后不能再接受写入。")


# ---- Java
@diagram("jvm-runtime")
def _():
    return done("JVM 运行时数据区", "按 JVM 规范划分：线程私有 vs 线程共享", stack([
        ("程序计数器", "线程私有。记录当前执行到哪条字节码，唯一不会 OOM 的区域", "s"),
        ("虚拟机栈", "线程私有。每次方法调用压一个栈帧：局部变量表、操作数栈、返回地址；递归太深 → StackOverflowError", "b"),
        ("本地方法栈", "线程私有。服务 native 方法（HotSpot 与虚拟机栈合并实现）", "b"),
        ("堆 Heap", "线程共享。几乎所有对象都在这里；分新生代（Eden + 2 个 Survivor）和老年代，GC 的主战场", "g"),
        ("元空间 Metaspace", "线程共享。类的元数据、方法信息，JDK 8 起放在本地内存，取代永久代", "o"),
    ], side=[(0, 2, "线程私有，随线程生灭"), (3, 4, "线程共享，需要 GC")]),
        "常见 OOM 对应关系：Java heap space → 堆；Metaspace → 类太多（动态代理 / 热部署）；unable to create native thread → 线程数或系统限制。")


@diagram("thread-pool")
def _():
    return done("ThreadPoolExecutor 提交任务的判断顺序", "execute(task) 时依次检查，任何一步满足就停", flow([
        ("核心线程未满？", "线程数 < corePoolSize：新建核心线程直接执行", "g"),
        ("队列未满？", "放进 workQueue 排队，等空闲线程来取", "b"),
        ("最大线程未满？", "线程数 < maximumPoolSize：新建非核心线程执行", "o"),
        ("执行拒绝策略", "Abort 抛异常 / CallerRuns 调用者执行 / Discard / DiscardOldest", "r"),
    ], gap=56, labels={1: "已满", 2: "已满", 3: "已满"}),
        "注意顺序：先排队、后扩线程。用无界队列（LinkedBlockingQueue 默认）时 maximumPoolSize 形同虚设，任务堆积直到 OOM，所以生产上要用有界队列并显式命名线程。")


@diagram("bean-lifecycle")
def _():
    return done("Spring Bean 生命周期", "从 BeanDefinition 到销毁，扩展点都挂在这条链上", flow([
        ("1 实例化", "反射调用构造器创建对象", "s"),
        ("2 属性注入", "@Autowired / setter 填充依赖", "b"),
        ("3 Aware 回调", "BeanNameAware 等\n各类 *Aware 接口", "b"),
        ("4 前置处理", "BeanPostProcessor\n初始化前方法", "o"),
        ("5 初始化", "@PostConstruct → afterPropertiesSet → init-method", "g"),
        ("6 后置处理", "BeanPostProcessor\n初始化后方法，AOP 代理在这里生成", "o"),
        ("7 使用", "放入单例池，被其他 Bean 引用", "g"),
        ("8 销毁", "@PreDestroy → destroy()，容器关闭时", "p"),
    ], per_row=4, gap=36), "所以在构造器里拿不到被注入的依赖，在 @PostConstruct 里可以；同类内部方法互调不经过代理，@Transactional 会失效。")


@diagram("maven-lifecycle")
def _():
    return done("Maven default 生命周期（常用阶段）", "执行某个阶段时，它之前的所有阶段都会先执行", flow([
        ("validate", "检查 pom 是否正确", "s"),
        ("compile", "编译 src/main/java", "b"),
        ("test", "运行单元测试", "b"),
        ("package", "打成 jar / war", "g"),
        ("verify", "集成测试、质量检查", "o"),
        ("install", "装进本地仓库 ~/.m2", "o"),
        ("deploy", "上传到远程私服 Nexus", "p"),
    ], per_row=4, gap=36), "mvn package 会自动跑 compile 和 test；-DskipTests 跳过运行测试。依赖冲突用 mvn dependency:tree 查看，Maven 默认「最短路径优先，同长度先声明优先」。")


@diagram("collections")
def _():
    return done("Java 集合框架主干", "先选接口（要什么语义），再选实现（要什么性能）", tree(
        ("Collection / Map", "java.util 两棵根接口树", "b"), [
            ("List 有序可重复", "", "g", [("ArrayList", "数组，随机访问 O(1)"), ("LinkedList", "双向链表，也实现 Deque"), ("CopyOnWriteArrayList", "读多写少并发")]),
            ("Set 不重复", "", "o", [("HashSet", "基于 HashMap"), ("LinkedHashSet", "保留插入顺序"), ("TreeSet", "红黑树，有序")]),
            ("Queue / Deque", "", "p", [("ArrayDeque", "栈和队列首选"), ("PriorityQueue", "二叉堆"), ("BlockingQueue", "线程池用")]),
            ("Map 键值对", "", "y", [("HashMap", "数组+链表/红黑树"), ("LinkedHashMap", "可做 LRU"), ("ConcurrentHashMap", "CAS + synchronized")]),
        ]), "HashMap 默认容量 16、负载因子 0.75，链表长度 ≥ 8 且容量 ≥ 64 时转红黑树。遍历时修改集合会触发 fail-fast 的 ConcurrentModificationException。")


@diagram("exception-tree")
def _():
    return done("Java 异常体系", "编译器只强制处理受检异常", tree(
        ("Throwable", "所有错误和异常的父类", "s"), [
            ("Error", "JVM 级严重问题，一般不捕获", "r", ["OutOfMemoryError", "StackOverflowError", "NoClassDefFoundError"]),
            ("受检异常 Exception", "必须 throws 或 try-catch", "o", ["IOException", "SQLException", "InterruptedException"]),
            ("RuntimeException", "非受检，多是代码 bug", "y", ["NullPointerException", "IllegalArgumentException", "IndexOutOfBoundsException"]),
        ]), "日志里看根因要找最底下的 Caused by；捕获 InterruptedException 后要恢复中断标志 Thread.currentThread().interrupt()。")


# ---- 前端
@diagram("box-model")
def _():
    els = []
    layers = [("margin 外边距", "s", 0), ("border 边框", "o", 50), ("padding 内边距", "g", 100), ("content 内容", "b", 150)]
    for nm, c, d in layers:
        x, y, w, h = 120 + d, TOP + d * 0.8, 660 - 2 * d, 380 - 1.6 * d
        els.append(rect(x, y, w, h, c))
        if c == "b":
            els.append(text(450, y + h / 2 - 4, nm, 16, INK, weight="700"))
            els.append(text(450, y + h / 2 + 18, "width × height（content-box 时）", 13, BODY))
        else:
            els.append(text(x + 14, y + 26, nm, 14, INK, "start", "700"))
    return done("CSS 盒模型", "每个元素都是一个矩形盒子，从外到内四层", (els, TOP + 380),
                "box-sizing: content-box（默认）时 width 只算内容；border-box 时 width 包含 padding 和 border，布局更好算，所以大多数项目全局设 *{box-sizing:border-box}。上下相邻块的 margin 会合并（取较大值）。")


@diagram("dom-event")
def _():
    return done("DOM 事件三个阶段", "点击 button 时，事件从 window 出发再回到 window", flow([
        ("1 捕获阶段", "window → document → body → div\n第三个参数为 true 的监听在这里触发", "b"),
        ("2 目标阶段", "到达真正被点击的 button（event.target）", "o"),
        ("3 冒泡阶段", "button → div → body → window\n默认监听在这里触发", "g"),
    ], per_row=3, gap=56, labels={1: "向下", 2: "向上"}),
        "事件委托就是利用冒泡：在父元素上监听一次，用 event.target 判断是哪个子元素。stopPropagation() 阻止继续传播，preventDefault() 阻止默认行为（如链接跳转），两者不是一回事。")


@diagram("event-loop")
def _():
    return done("浏览器事件循环", "JS 单线程：一次只做一件事，做完再从队列里取下一件", flow([
        ("执行一个宏任务", "script 整体\nsetTimeout\nI/O、UI 事件", "b"),
        ("清空微任务队列", "Promise.then\nqueueMicrotask\n新增的也一并清空", "g"),
        ("需要时渲染", "rAF 回调\n样式 → 布局 → 绘制\n约 16.7ms 一帧", "o"),
        ("取下一个宏任务", "回到第一步，循环往复", "s"),
    ], gap=48, labels={1: "然后", 2: "然后", 3: "然后"}),
        "经典题：console.log(1); setTimeout(()=>log(2)); Promise.resolve().then(()=>log(3)); log(4) 输出 1 4 3 2。一个长任务超过 50ms 就会卡住渲染和点击响应。")


@diagram("http-cache")
def _():
    return done("HTTP 缓存判断流程", "先看强缓存（不发请求），再走协商缓存（发请求问一句）", flow([
        ("有缓存且未过期？", "Cache-Control: max-age / Expires", "b"),
        ("强缓存命中", "直接用本地副本\n不发请求", "g"),
        ("带条件请求", "If-None-Match\nIf-Modified-Since", "o"),
        ("304 或 200", "没变返回 304 用本地副本；变了返回 200 + 新内容", "p"),
    ], gap=56, labels={1: "是", 2: "过期", 3: "比对"}),
        "最佳实践：HTML 用 no-cache（每次协商），带哈希的 JS/CSS 用 max-age=31536000, immutable。no-store 才是完全不缓存；no-cache 是「可以缓存但用前要验证」。")


@diagram("render-pipeline")
def _():
    return done("浏览器渲染流水线", "从 HTML 文本到屏幕像素", flow([
        ("解析 HTML", "生成 DOM 树；遇到同步 script 会暂停", "b"),
        ("解析 CSS", "生成 CSSOM，会阻塞渲染", "b"),
        ("样式计算", "DOM + CSSOM 合成渲染树", "g"),
        ("布局 Layout", "计算每个盒子的位置和大小", "o"),
        ("绘制 Paint", "生成绘制指令，分图层", "o"),
        ("合成 Composite", "GPU 合成图层显示到屏幕", "p"),
    ], per_row=3, gap=48),
        "改 width/top 会触发重排（布局之后全部重来）；改 color 只重绘；改 transform/opacity 只走合成，最省。读 offsetHeight 等属性会强制同步布局，循环里读写交替会导致布局抖动。")


# ---- 运维 / DevOps / 安全
@diagram("fhs-tree")
def _():
    return done("Linux 目录结构（FHS）", "一切从根目录 / 开始，每个目录有约定好的用途", tree(
        ("/  根目录", "", "b"), [
            ("系统程序", "", "g", [("/bin /sbin", "基础命令（多为 /usr 的链接）"), ("/usr", "绝大多数软件和库"), ("/lib", "共享库、内核模块")]),
            ("配置与启动", "", "o", [("/etc", "系统和服务配置"), ("/boot", "内核与引导"), ("/dev", "设备文件")]),
            ("可变数据", "", "p", [("/var/log", "日志"), ("/var/lib", "数据库等状态数据"), ("/tmp", "临时文件，重启清空")]),
            ("用户与运行时", "", "y", [("/home /root", "用户目录"), ("/proc /sys", "内核信息虚拟文件"), ("/opt /srv", "第三方软件、服务数据")]),
        ]), "磁盘满了先看 /var/log 和 /var/lib；/proc 下的文件不占磁盘，是内核实时生成的。")


@diagram("use-method")
def _():
    return done("USE 方法：对每种资源问三个问题", "Brendan Gregg 提出，适合快速定位性能瓶颈", cols([
        ("CPU", "b", [("使用率", "top、mpstat -P ALL"), ("饱和度", "load average、vmstat r 列"), ("错误", "dmesg 看 MCE")]),
        ("内存", "g", [("使用率", "free -h 看 available"), ("饱和度", "vmstat si/so 换页"), ("错误", "dmesg 看 OOM killer")]),
        ("磁盘", "o", [("使用率", "iostat -x 看 %util"), ("饱和度", "aqsize / await"), ("错误", "smartctl、dmesg")]),
        ("网络", "p", [("使用率", "sar -n DEV 带宽"), ("饱和度", "ss -s、重传、丢包"), ("错误", "ip -s link 看 errors")]),
    ], gap=16), "U = Utilization 忙的时间占比，S = Saturation 排队等待的程度，E = Errors 出错次数。先把四类资源过一遍，再深入看可疑的那一项。")


@diagram("log-pipeline")
def _():
    return done("日志采集链路", "从应用打印到能被检索，经过四个环节", flow([
        ("应用输出", "JSON 结构化日志写 stdout 或文件，带 trace_id", "b"),
        ("采集", "Filebeat / Fluent Bit / Vector 读取并打标签", "g"),
        ("缓冲与加工", "Kafka 削峰；Logstash 解析、脱敏、过滤", "o"),
        ("存储与检索", "Elasticsearch / Loki，Kibana / Grafana 查询告警", "p"),
    ], gap=48), "日志量大时先在采集端过滤和采样；按天建索引并设置保留期（ILM）；密码、手机号、身份证号要在进入存储前脱敏。")


@diagram("k8s-arch")
def _():
    return done("Kubernetes 架构", "控制面负责「想要什么」，工作节点负责「让它发生」", cols([
        ("控制面 Control Plane", "b", [("kube-apiserver", "唯一入口，所有组件都和它通信"), ("etcd", "保存全部集群状态"), ("kube-scheduler", "决定 Pod 放哪个节点"), ("controller-manager", "不断把实际状态调整为期望状态")]),
        ("工作节点 Node", "g", [("kubelet", "按 PodSpec 启停容器、上报状态"), ("容器运行时", "containerd 拉镜像、跑容器"), ("kube-proxy", "把 Service 转成 iptables/IPVS 规则"), ("CNI 插件", "给 Pod 分配 IP、打通网络")]),
    ], gap=40), "kubectl apply 的过程：apiserver 写入 etcd → scheduler 绑定节点 → 该节点 kubelet 发现新 Pod → 调运行时创建容器 → 上报 Running。")


@diagram("slo-budget")
def _():
    return done("SLI → SLO → 错误预算", "用数字约定「多可靠才够」，并据此决定发版节奏", flow([
        ("SLI 指标", "例：成功请求数 / 总请求数", "b"),
        ("SLO 目标", "例：30 天可用性 ≥ 99.9%", "g"),
        ("错误预算", "100% − 99.9% = 0.1%，约 43 分钟 / 30 天", "o"),
        ("决策", "预算充足照常发版；快耗尽时冻结变更、优先修稳定性", "p"),
    ], gap=48), "告警建议按「预算消耗速度」（burn rate）配置：1 小时内烧掉 2% 预算就要立即处理。SLA 是对外合同，通常比内部 SLO 更宽松。")


@diagram("incident-timeline")
def _():
    return done("故障处理时间线", "目标是缩短每一段：发现、响应、止血、恢复", flow([
        ("发现", "告警或用户反馈，记录开始时间", "r"),
        ("响应", "值班确认、拉群、指定指挥人", "o"),
        ("止血", "回滚、切流、降级、扩容，先恢复服务", "y"),
        ("恢复", "确认指标回到正常，宣布结束", "g"),
        ("复盘", "时间线、根因、改进项，每项有负责人", "b"),
    ], per_row=5, gap=28), "MTTD 平均发现时间，MTTR 平均恢复时间。止血优先于查根因；复盘对事不对人，改进项要能被跟踪验收。")


@diagram("cicd-stages")
def _():
    return done("CI/CD 流水线典型阶段", "每次提交自动走完，任一步失败就停下", flow([
        ("代码提交", "push / MR 触发", "s"),
        ("构建", "编译、依赖缓存、生成制品", "b"),
        ("测试", "单元测试、代码扫描、覆盖率", "b"),
        ("制品", "镜像打标签推仓库，签名", "g"),
        ("部署预发", "自动部署 + 冒烟测试", "o"),
        ("生产发布", "审批后灰度 / 蓝绿，可一键回滚", "p"),
    ], per_row=3, gap=48), "同一个制品从测试环境一路晋级到生产，不要每个环境重新构建；配置和密钥通过环境变量或密钥管理注入。")


@diagram("oauth-pkce")
def _():
    return done("OAuth 2.0 授权码 + PKCE", "前端和移动端的推荐流程，防止授权码被截获后冒用", seq(
        [("用户浏览器", "b"), ("客户端应用", "g"), ("授权服务器", "o"), ("资源服务器", "p")], [
            (1, 1, "生成随机 code_verifier，算出 code_challenge = SHA256"),
            (1, 2, "跳转 /authorize + code_challenge"),
            (0, 2, "用户登录并同意授权"),
            (2, 1, "回调 redirect_uri?code=...", "t"),
            (1, 2, "/token：code + code_verifier"),
            (2, 2, "校验 SHA256(verifier) == challenge"),
            (2, 1, "access_token（+ refresh_token）", "t"),
            (1, 3, "Authorization: Bearer token"),
            (3, 1, "受保护资源", "t"),
        ], step=42), "攻击者即使截获 code，没有 code_verifier 也换不到 token。state 参数防 CSRF；access_token 要短期有效，refresh_token 要能吊销。")


@diagram("stride")
def _():
    return done("STRIDE 威胁建模", "对每个组件和数据流逐项提问：会不会出现这类威胁", cols([
        ("S 仿冒", "r", [("冒充他人身份", "对策：认证、MFA")]),
        ("T 篡改", "o", [("修改数据或代码", "对策：签名、完整性校验")]),
        ("R 抵赖", "y", [("否认做过某操作", "对策：审计日志")]),
        ("I 信息泄露", "p", [("看到不该看的", "对策：加密、最小权限")]),
        ("D 拒绝服务", "b", [("让服务不可用", "对策：限流、弹性")]),
        ("E 权限提升", "g", [("获得更高权限", "对策：授权校验、隔离")]),
    ], gap=10), "做法：先画数据流图（外部实体、进程、存储、数据流、信任边界），再对跨越信任边界的每条数据流过一遍 STRIDE，记录威胁、等级和缓解措施。")


# ---- AI 大模型
@diagram("llm-stack")
def _():
    return done("大模型应用技术栈", "从下往上：模型能力 → 调用方式 → 应用形态", stack([
        ("应用层", "智能客服、知识库问答、代码助手、数据分析 Agent", "p"),
        ("编排层", "Prompt 模板、RAG 检索、Agent 循环、工具调用 / MCP", "o"),
        ("调用层", "Chat Completions / Messages API，流式输出、结构化输出", "g"),
        ("推理服务", "vLLM / TGI / Ollama，KV Cache、批处理、量化", "b"),
        ("基础模型", "Transformer 解码器：GPT、Claude、Qwen、DeepSeek、Llama", "s"),
    ], side=[(0, 1, "业务团队主要工作区"), (3, 4, "平台 / 算法团队")]), "大多数业务问题先用 Prompt 解决，不够再加 RAG 补知识，再不够才考虑微调；Agent 适合多步骤、要调用外部系统的任务。")


@diagram("rag-pipeline")
def _():
    return done("RAG 检索增强生成流程", "离线建索引，在线检索后把资料塞进 Prompt", flow([
        ("文档切分", "按标题 / 段落切块，300~800 字，块间重叠 10%", "b"),
        ("向量化", "Embedding 模型把文本变成向量", "b"),
        ("入库", "向量库（Milvus / pgvector）+ 原文 + 元数据", "g"),
        ("用户提问", "问题同样向量化，可先做改写", "o"),
        ("检索与重排", "向量 + 关键词混合召回 Top-K，再用 Rerank 精排", "o"),
        ("生成", "资料 + 问题拼进 Prompt，要求标注出处", "p"),
    ], per_row=3, gap=48), "答不准时先查检索：正确资料有没有被召回（召回率），再查生成：模型有没有照着资料答（忠实度）。")


@diagram("agent-loop")
def _():
    return done("Agent 工具调用循环", "模型负责决策，程序负责执行，循环直到任务完成", seq(
        [("用户", "b"), ("应用程序", "g"), ("大模型", "o"), ("工具 / API", "p")], [
            (0, 1, "提问：查一下北京明天天气，适合跑步吗"),
            (1, 2, "问题 + 工具清单（JSON Schema）"),
            (2, 1, "tool_call: get_weather(city=北京)", "t"),
            (1, 3, "执行函数"),
            (3, 1, "{temp: 8, rain: false}", "t"),
            (1, 2, "把工具结果追加进对话"),
            (2, 1, "最终回答（不再调用工具）", "t"),
            (1, 0, "明天 8 度无雨，适合跑步", "t"),
        ], step=42), "模型从不直接执行代码，只输出「想调用哪个工具、参数是什么」。要设最大循环次数，危险操作（删数据、转账）必须人工确认。")


@diagram("ai-family")
def _():
    return done("AI、机器学习、深度学习与大模型的关系", "从外到内一层包含一层，越往里越具体", stack([
        ("人工智能 AI", "让机器表现出智能的所有方法，包括规则系统、搜索、专家系统", "s"),
        ("机器学习 ML", "不写死规则，让程序从数据里自己学规律：决策树、SVM、XGBoost", "b"),
        ("深度学习 DL", "用多层神经网络学习，擅长图像、语音、文本：CNN、RNN、Transformer", "g"),
        ("大模型 LLM", "参数数十亿以上、海量数据预训练的 Transformer：GPT、Claude、Qwen", "o"),
        ("生成式 AI 应用", "基于大模型生成文字、图片、代码：ChatGPT、Copilot、Midjourney", "p"),
    ], side=[(0, 1, "传统方法"), (2, 4, "当前主流")]), "大模型是深度学习的一个分支，深度学习又是机器学习的一个分支。说「AI」时，现在大多指的是生成式 AI 和大模型。")


@diagram("nn-training")
def _():
    return done("神经网络训练一轮在做什么", "前向算结果，比较误差，反向求梯度，更新参数", flow([
        ("前向传播", "输入一批数据（batch），逐层计算得到预测值", "b"),
        ("计算损失", "损失函数衡量预测和正确答案差多少", "o"),
        ("反向传播", "从输出往回算每个参数对损失的影响（梯度）", "g"),
        ("更新参数", "优化器按 学习率 × 梯度 调整参数，如 AdamW", "p"),
    ], gap=48, labels={1: "预测", 2: "误差", 3: "梯度"}), "把全部训练数据过一遍叫一个 epoch。训练集损失一直降、验证集损失开始升，说明过拟合了，应该早停或加正则。")


@diagram("llm-lifecycle")
def _():
    return done("一个大模型从训练到上线", "前三步由模型厂商完成，后两步是应用团队的日常", flow([
        ("预训练", "万亿 Token 文本上学「预测下一个词」，得到基座模型", "b"),
        ("指令微调 SFT", "用问答对教模型按指令回答", "g"),
        ("偏好对齐", "RLHF / DPO 让回答更有用、更安全；推理模型再加强化学习", "o"),
        ("压缩部署", "量化、蒸馏后用 vLLM 等引擎提供 API", "p"),
        ("应用开发", "Prompt、RAG、Agent、评测与监控", "s"),
    ], per_row=5, gap=28), "基座模型（Base）只会续写，聊天模型（Instruct / Chat）才会按指令回答。开源权重模型可以自己下载、量化、微调。")


@diagram("ai-precision")
def _():
    return done("数值精度与显存", "每个参数占几个字节，决定模型要多大显存", cols([
        ("FP32", "s", [("4 字节", "传统训练精度"), ("7B 模型", "约 28 GB")]),
        ("BF16 / FP16", "b", [("2 字节", "当前训练和推理主流"), ("7B 模型", "约 14 GB")]),
        ("FP8 / INT8", "g", [("1 字节", "H100 支持 FP8，精度损失小"), ("7B 模型", "约 7 GB")]),
        ("INT4", "o", [("0.5 字节", "GPTQ / AWQ / GGUF 量化"), ("7B 模型", "约 3.5 GB")]),
    ], gap=16), "估算公式：权重显存 ≈ 参数量 × 每参数字节数。推理还要加上 KV Cache 和运行开销，一般再预留 20%~50%。")


@diagram("ai-interview-map")
def _():
    return done("AI 应用岗面试题知识地图", "按四个板块准备，每题先结论、再原理、再经验", cols([
        ("大模型基础", "b", [("Transformer", "自注意力、位置编码"), ("Token", "分词、上下文窗口"), ("采样", "Temperature、Top-p"), ("幻觉", "成因与缓解")]),
        ("Prompt 工程", "g", [("结构", "角色、任务、格式、示例"), ("技巧", "Few-shot、思维链"), ("输出", "JSON 结构化输出"), ("安全", "提示注入防护")]),
        ("RAG", "o", [("切分", "块大小与重叠"), ("检索", "向量 + 关键词混合"), ("重排", "Rerank 提升精度"), ("评测", "召回率、忠实度")]),
        ("Agent", "p", [("工具调用", "Function Calling"), ("规划", "ReAct、计划执行"), ("记忆", "短期上下文与长期存储"), ("协议", "MCP 连接外部工具")]),
    ], gap=12), "面试官最看重落地经验：遇到过什么问题、怎么定位、指标提升了多少。")


@diagram("ai-interview-adv-map")
def _():
    return done("AI 进阶面试题地图", "原理题考深度，场景题考取舍", cols([
        ("微调", "b", [("何时微调", "先 Prompt、RAG，再微调"), ("LoRA / QLoRA", "低秩适配、4 位量化")]),
        ("对齐", "g", [("SFT", "指令数据监督训练"), ("RLHF / DPO", "偏好数据对齐")]),
        ("推理优化", "o", [("KV Cache", "以显存换速度"), ("vLLM", "PagedAttention、连续批处理")]),
        ("评测与安全", "r", [("评测", "基准集 + LLM 裁判 + 人工"), ("安全", "注入、越权、数据泄露")]),
        ("场景设计", "p", [("客服 / 知识库", "RAG + 兜底转人工"), ("成本", "模型路由、缓存")]),
    ], gap=10), "场景题按系统设计四步答：澄清需求、估算量级、给出架构、深挖一到两个难点。")


# ---- Python
@diagram("py-asyncio")
def _():
    return done("asyncio 事件循环", "单线程里轮流推进多个协程，遇到 await IO 就让出", flow([
        ("创建任务", "asyncio.create_task(coro) 放进就绪队列", "b"),
        ("运行到 await", "协程执行到 await 网络 / 磁盘 IO 时挂起", "g"),
        ("切换协程", "事件循环取下一个就绪任务继续执行", "o"),
        ("IO 完成", "selector 通知，挂起的协程重新变为就绪", "p"),
    ], gap=48, labels={1: "挂起", 2: "等待", 3: "唤醒"}), "协程里调用 time.sleep 或同步 requests 会卡住整个循环；CPU 密集任务要交给 run_in_executor 或多进程。")


@diagram("py-gil")
def _():
    return done("GIL 对并发方式的影响", "CPython 同一时刻只有一个线程执行字节码", cols([
        ("多线程 threading", "b", [("IO 密集", "等待 IO 时释放 GIL，有效"), ("CPU 密集", "抢 GIL，几乎不加速")]),
        ("多进程 multiprocessing", "g", [("CPU 密集", "每个进程独立 GIL，能用满多核"), ("代价", "进程启动和数据序列化开销")]),
        ("协程 asyncio", "o", [("高并发 IO", "单线程上万连接"), ("限制", "整条调用链都要是 async")]),
    ], gap=20), "Python 3.13 起提供实验性的 free-threaded 构建（python3.13t）可关闭 GIL，生产使用前要确认依赖库兼容。")


# ---- Go
@diagram("go-gmp")
def _():
    return done("Go 调度器 GMP 模型", "G 是任务，M 是系统线程，P 是执行资格", cols([
        ("G goroutine", "b", [("初始栈 2KB", "按需增长"), ("go func()", "创建后放入 P 的本地队列")]),
        ("P Processor", "g", [("数量 = GOMAXPROCS", "默认等于 CPU 核数"), ("本地队列", "最多 256 个 G，满了放全局队列")]),
        ("M Machine", "o", [("绑定一个 P", "才能执行 G"), ("系统调用阻塞", "P 会被转交给其他 M")]),
    ], gap=20), "P 的本地队列空了会去全局队列取，再不行就从别的 P 偷一半（work stealing）。Go 1.14 起支持基于信号的异步抢占，死循环不会卡住调度。")


@diagram("go-channel")
def _():
    return done("channel 的三种状态", "无缓冲是同步交接，有缓冲是队列", cols([
        ("nil channel", "s", [("发送 / 接收", "永久阻塞"), ("close", "panic")]),
        ("正常 channel", "g", [("无缓冲", "收发双方同时就绪才完成"), ("有缓冲", "满了阻塞发送，空了阻塞接收")]),
        ("已关闭 channel", "r", [("接收", "读完剩余数据后返回零值, ok=false"), ("发送 / 再 close", "panic")]),
    ], gap=20), "原则：由发送方关闭 channel，接收方用 for range 读到关闭为止；多个发送方时用 sync.WaitGroup 等全部结束再关。")


# ---- 大数据
@diagram("kafka-arch")
def _():
    return done("Kafka 核心架构", "Topic 拆成多个分区，分区是并行和有序的最小单位", flow([
        ("Producer", "按 key 哈希选分区，acks=all 保证不丢", "b"),
        ("Broker 集群", "每个分区一个 Leader + 多个 Follower 副本（ISR）", "g"),
        ("分区日志", "顺序追加写，按 offset 定位，按时间或大小保留", "o"),
        ("Consumer Group", "组内每个分区只给一个消费者，提交 offset 记录进度", "p"),
    ], gap=48), "同一个 key 进同一个分区才能保证顺序；消费者数量超过分区数，多出来的会空闲。Kafka 3.x 起可用 KRaft 模式去掉 ZooKeeper。")


@diagram("dw-layers")
def _():
    return done("数据仓库分层", "每层只做一类事，问题能定位到层", stack([
        ("ADS 应用层", "报表、接口直接用的指标结果", "p"),
        ("DWS 汇总层", "按主题和粒度轻度汇总，例如用户日活跃宽表", "o"),
        ("DWD 明细层", "清洗、去重、统一口径后的事实明细", "g"),
        ("DIM 维度层", "用户、商品、地区等维度表，可做拉链表记录历史", "s"),
        ("ODS 原始层", "业务库、日志原样同步，保留原始数据便于回溯", "b"),
    ], side=[(0, 1, "面向需求"), (2, 4, "面向数据")]), "指标口径在 DWD/DWS 统一定义一次，上层复用；不要让 ADS 直接读 ODS，否则同一个指标会出现多个数字。")


@diagram("flink-arch")
def _():
    return done("Flink 流处理与 Checkpoint", "有状态计算 + 定期快照，故障后从快照恢复", flow([
        ("Source", "Kafka 读取，记录消费 offset", "b"),
        ("算子 + 状态", "keyBy 后窗口聚合，状态存 RocksDB", "g"),
        ("Checkpoint", "JobManager 定期注入 barrier，各算子快照状态", "o"),
        ("Sink", "两阶段提交写 Kafka / 数据库，实现端到端精确一次", "p"),
    ], gap=48), "事件时间 + Watermark 处理乱序数据；Watermark 表示「早于这个时间的数据基本到齐了」，迟到数据可用 allowedLateness 或侧输出处理。")


# ---- 算法
@diagram("algo-complexity")
def _():
    return done("常见时间复杂度对比（n = 100 万）", "数据量上来后，复杂度决定能不能跑完", bars([
        ("O(1)", [("哈希查找 1 次", 3.2, "g")]),
        ("O(log n)", [("二分查找 约 20 次", 4.5, "g")]),
        ("O(n)", [("遍历 100 万次", 6.5, "b")]),
        ("O(n log n)", [("排序 约 2000 万次", 9, "o")]),
        ("O(n^2)", [("双重循环 1 万亿次，超时", 14, "r")]),
    ]), "经验值：C++/Java 每秒约 1 亿次基本运算。n ≤ 10^5 时一般要 O(n log n) 以内，n ≤ 1000 才能接受 O(n^2)。")


@diagram("dp-steps")
def _():
    return done("动态规划解题四步", "把大问题拆成重叠的子问题，记录结果不重复算", flow([
        ("定义状态", "dp[i] 表示什么，例如前 i 个物品的最大价值", "b"),
        ("状态转移", "dp[i] 由哪些更小的状态推出", "g"),
        ("初始化", "dp[0] 等边界值", "o"),
        ("遍历顺序", "保证用到的子状态已经算好，最后取答案", "p"),
    ], gap=48), "能用 DP 的两个信号：问「最多 / 最少 / 方案数」，并且做选择时只依赖之前的结果。先写出暴力递归，再加备忘录，最后改成递推表。")


@diagram("tree-traversal")
def _():
    return done("二叉树遍历方式", "前中后序是深度优先，层序是广度优先", cols([
        ("前序", "b", [("根 → 左 → 右", "复制树、序列化")]),
        ("中序", "g", [("左 → 根 → 右", "BST 得到有序序列")]),
        ("后序", "o", [("左 → 右 → 根", "先算子树再算自己，如树高")]),
        ("层序", "p", [("一层一层", "队列实现，求最短深度")]),
    ], gap=16), "递归写法三种只是「处理根节点」那一行的位置不同。迭代写法用栈模拟递归，层序用队列，每轮先记下当前层的节点数。")


# ---- 系统设计
@diagram("sd-four-steps")
def _():
    return done("系统设计四步答题法", "45 分钟面试的时间分配，先问清再动手", flow([
        ("澄清需求", "功能、非功能、约束，约 5 分钟", "b"),
        ("估算量级", "QPS、存储、带宽，约 5 分钟", "g"),
        ("高层设计", "API、数据模型、主流程，约 15 分钟", "o"),
        ("深入设计", "挑 1~2 个难点讲方案与取舍，约 15 分钟", "p"),
    ], gap=48), "最后留 3~5 分钟总结瓶颈、单点和监控。每个设计决定都要能回到第一步确认的需求上。")


@diagram("sd-scale-evolution")
def _():
    return done("从单机到百万用户的架构演进", "每一步解决上一步的瓶颈", flow([
        ("单机", "应用和数据库在一台机器", "s"),
        ("应用与数据库分离", "各自独立扩容", "b"),
        ("负载均衡 + 多实例", "应用无状态，水平扩展", "b"),
        ("主从复制", "写主库、读从库", "g"),
        ("缓存 + CDN", "热点数据进 Redis，静态资源上 CDN", "o"),
        ("分库分表 + 消息队列", "数据拆分，异步解耦", "p"),
    ], per_row=3, gap=48), "不要一开始就上最终架构。先找到当前瓶颈（CPU、连接数、磁盘、单表行数），再加对应的组件。")


@diagram("sd-cache-aside")
def _():
    return done("旁路缓存（Cache-Aside）读写流程", "最常用的缓存模式：读时回填，写时删缓存", seq(
        [("应用", "b"), ("Redis 缓存", "o"), ("数据库", "g")], [
            (0, 1, "读：GET key"),
            (1, 0, "未命中", "t"),
            (0, 2, "查数据库"),
            (2, 0, "返回数据", "t"),
            (0, 1, "SET key 并设过期时间"),
            (0, 2, "写：先更新数据库"),
            (0, 1, "再删除缓存 DEL key"),
        ], step=42), "写操作删缓存而不是更新缓存，避免并发写导致脏数据。缓存穿透用空值缓存或布隆过滤器，击穿用互斥锁，雪崩用随机过期时间。")


@diagram("sd-shorturl")
def _():
    return done("短链系统架构", "写少读多，跳转路径要尽量短", flow([
        ("客户端", "POST 长链 / GET 短码", "s"),
        ("负载均衡", "分发到无状态应用", "b"),
        ("短链服务", "发号器取 ID，Base62 编码成短码", "g"),
        ("Redis 缓存", "热点短码直接命中", "o"),
        ("数据库", "code → long_url，按 code 分片", "p"),
    ], per_row=5, gap=28), "7 位 Base62 约 3.5 万亿个短码。跳转用 302 能统计点击，用 301 能减少服务端压力。")


@diagram("sd-consistent-hash")
def _():
    return done("分片路由：取模哈希 vs 一致性哈希", "扩容时要迁移多少数据", cols([
        ("取模哈希 hash % N", "o", [("路由", "简单，分布均匀"), ("扩容 N→N+1", "大部分数据要迁移"), ("适用", "分片数固定或可预先规划")]),
        ("一致性哈希", "g", [("路由", "节点和 key 映射到环上，顺时针找节点"), ("扩容", "只迁移相邻一段数据"), ("虚拟节点", "每台机器多个点，解决倾斜")]),
        ("范围分片", "b", [("路由", "按 ID 或时间区间"), ("扩容", "新增区间即可"), ("风险", "新数据集中在最后一片")]),
    ], gap=16), "数据库分库分表常用取模加预分配（例如一开始就分 1024 张表），缓存集群常用一致性哈希。")


@diagram("sd-mq")
def _():
    return done("消息队列的三大作用", "生产者和消费者之间加一层缓冲", cols([
        ("异步", "b", [("下单后", "发消息即返回，积分、通知异步处理"), ("效果", "接口响应从秒级降到毫秒级")]),
        ("解耦", "g", [("新增下游", "订阅主题即可，上游不改代码"), ("效果", "一个下游挂了不影响其他")]),
        ("削峰", "o", [("流量洪峰", "先堆积在队列里"), ("效果", "下游按自己的能力匀速消费")]),
    ], gap=16), "代价：可能重复（消费端要幂等）、可能乱序（同一业务 key 发到同一分区）、可能丢失（生产确认 + 持久化 + 消费后提交位点）。")


@diagram("sd-dist-tx")
def _():
    return done("分布式事务方案对比", "一致性越强，性能和复杂度代价越高", cols([
        ("2PC / XA", "r", [("一致性", "强一致"), ("代价", "同步阻塞，协调者单点")]),
        ("TCC", "o", [("一致性", "最终一致，业务可控"), ("代价", "每个操作写 Try/Confirm/Cancel")]),
        ("本地消息表", "g", [("一致性", "最终一致"), ("代价", "业务表和消息表同库同事务")]),
        ("Saga", "b", [("一致性", "最终一致"), ("代价", "每步要有补偿操作")]),
    ], gap=12), "大多数互联网业务选最终一致：本地消息表或事务消息最常见，资金类强一致场景才考虑 TCC。")


@diagram("sd-rate-limit")
def _():
    return done("常见限流算法", "按允许突发和实现复杂度选择", cols([
        ("固定窗口", "s", [("做法", "每个时间窗口计数"), ("问题", "窗口边界可能翻倍")]),
        ("滑动窗口", "b", [("做法", "按时间戳记录或分小格"), ("特点", "更平滑，耗内存")]),
        ("令牌桶", "g", [("做法", "匀速放令牌，取到才放行"), ("特点", "允许一定突发")]),
        ("漏桶", "o", [("做法", "请求排队，匀速流出"), ("特点", "输出绝对平滑")]),
    ], gap=12), "分布式限流把计数放 Redis，用 Lua 保证原子性。被限流的请求返回 429 和 Retry-After。")


@diagram("sd-snowflake")
def _():
    return done("雪花算法 64 位 ID 组成", "按时间递增，单机每毫秒可生成 4096 个", bars([
        ("符号位", [("0", 1, "s")]),
        ("时间戳", [("41 位毫秒，可用约 69 年", 41, "b")]),
        ("机器 ID", [("10 位，最多 1024 台", 10, "g")]),
        ("序列号", [("12 位，0~4095", 12, "o")]),
    ]), "风险是时钟回拨：回拨很小就等待，回拨较大就报错或切换备用机器 ID。")


@diagram("sd-leaderboard")
def _():
    return done("实时排行榜架构", "数据库保证不丢，Redis 有序集合负责排序", flow([
        ("游戏服务", "一局结束上报得分", "s"),
        ("消息队列", "加分事件持久化", "b"),
        ("积分服务", "写数据库，再 ZINCRBY", "g"),
        ("Redis ZSET", "按月一个 key，跳表排序", "o"),
        ("查询接口", "前 N 名、我的名次、附近名次", "p"),
    ], per_row=5, gap=28), "ZSET 只存用户 ID 和分数，昵称头像另外批量取。Redis 数据丢失时可从数据库重建。")


@diagram("sd-flash-sale")
def _():
    return done("秒杀系统分层削流", "越靠前拦掉的请求越多，数据库只承受真实成交", flow([
        ("前端 / CDN", "页面静态化，按钮防重复点击", "s"),
        ("网关限流", "令牌桶 + 黑名单 + 验证码", "b"),
        ("Redis 预扣库存", "Lua 原子判断并扣减", "o"),
        ("消息队列", "抢到资格的请求异步下单", "g"),
        ("订单服务 + 数据库", "乐观锁扣库存，超时未付回补", "p"),
    ], per_row=5, gap=28), "库存不超卖靠 Redis 原子扣减加数据库条件更新（stock > 0）兜底；同一用户限购靠唯一索引。")


@diagram("sd-feed-push-pull")
def _():
    return done("Feed 流：推模式 vs 拉模式", "写扩散还是读扩散", cols([
        ("推模式（写扩散）", "g", [("发帖时", "写入每个粉丝的收件箱"), ("读", "直接读自己收件箱，很快"), ("问题", "大 V 千万粉丝，写入放大")]),
        ("拉模式（读扩散）", "o", [("发帖时", "只写自己的发件箱"), ("读", "合并所有关注者的发件箱"), ("问题", "关注多时读取慢")]),
        ("推拉结合", "b", [("普通用户", "推给粉丝"), ("大 V", "粉丝读时再拉"), ("活跃度", "只推给近期活跃粉丝")]),
    ], gap=16), "主流方案是推拉结合：收件箱用 Redis ZSET 按时间排序，只保留最近几百条，更早的回源查询。")


@diagram("sd-chat")
def _():
    return done("即时聊天消息投递", "长连接下行，消息先落库再推送，客户端回 ACK", seq(
        [("发送方", "b"), ("接入层", "s"), ("消息服务", "g"), ("接收方", "o")], [
            (0, 1, "发消息（带 msg_id）"),
            (1, 2, "转发"),
            (2, 2, "生成递增序号，落库"),
            (2, 0, "回执：发送成功", "t"),
            (2, 3, "按路由推送"),
            (3, 2, "ACK 已收到", "t"),
        ], step=42), "接收方离线时只存离线消息，上线后按序号拉取缺失部分。msg_id 去重保证不重复，序号保证有序。")


@diagram("sd-notification")
def _():
    return done("通知系统架构", "统一入口，按渠道拆分队列，失败重试", flow([
        ("业务服务", "调用通知 API", "s"),
        ("通知服务", "鉴权、模板渲染、用户偏好与频控", "b"),
        ("渠道队列", "短信 / 邮件 / App 推送各一个", "g"),
        ("渠道 Worker", "调用第三方，失败按退避重试", "o"),
        ("通知日志", "记录状态，支持去重和查询", "p"),
    ], per_row=5, gap=28), "按渠道拆队列，一个第三方变慢不拖累其他渠道。用通知 ID 做幂等，避免重试导致重复发送。")


@diagram("sd-trie")
def _():
    return done("搜索自动补全", "离线统计热词，在线按前缀查 Top K", flow([
        ("搜索日志", "收集用户输入的查询词", "s"),
        ("离线聚合", "按周期统计词频", "b"),
        ("构建 Trie", "每个节点缓存该前缀的 Top K 热词", "g"),
        ("补全服务", "按前缀找节点，直接返回 Top K", "o"),
        ("浏览器 / CDN 缓存", "相同前缀短时间内不再请求", "p"),
    ], per_row=5, gap=28), "在节点上预存 Top K，查询复杂度只和前缀长度有关。前端加防抖，减少每敲一个字就请求一次。")


@diagram("sd-file-upload")
def _():
    return done("大文件分片上传", "秒传、断点续传、直传对象存储", seq(
        [("客户端", "b"), ("文件服务", "g"), ("对象存储", "o")], [
            (0, 1, "初始化：文件哈希 + 大小"),
            (1, 0, "已存在则秒传，否则返回 uploadId", "t"),
            (0, 2, "按预签名 URL 并发上传各分片"),
            (0, 1, "通知全部分片完成"),
            (1, 2, "合并分片，校验哈希"),
            (1, 0, "返回文件地址", "t"),
        ], step=42), "文件数据直传对象存储，不经过应用服务器。下载走 CDN，按文件哈希去重节省存储。")


@diagram("sd-ha")
def _():
    return done("高可用的常用手段", "冗余、隔离、降级、快速恢复", cols([
        ("冗余", "b", [("多实例", "无状态服务多副本"), ("多机房", "同城双活、异地容灾")]),
        ("隔离与保护", "g", [("超时与重试", "设置上限，退避重试"), ("熔断", "下游异常时快速失败")]),
        ("降级", "o", [("非核心功能", "关闭推荐、评论等"), ("兜底数据", "返回缓存或默认值")]),
        ("快速恢复", "p", [("监控告警", "SLO 驱动告警"), ("发布", "灰度、一键回滚")]),
    ], gap=12), "可用性 99.9% 对应每年约 8.8 小时停机，99.99% 约 53 分钟。每加一个 9，成本都会明显上升。")


# ---------------------------------------------------------------- 输出
if __name__ == "__main__":
    import sys
    from xml.dom import minidom
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    for name, fn in DIAGRAMS.items():
        if only and name not in only:
            continue
        s = fn()
        minidom.parseString(s.encode("utf-8"))
        with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
            f.write(s)
    print("generated", len(DIAGRAMS), "->", os.path.relpath(OUT, ROOT))
