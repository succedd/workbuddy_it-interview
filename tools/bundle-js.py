#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
tools/bundle-js.py —— 把 27 个 JS 按依赖顺序合并成 4 个 bundle

为什么合并（2026-10-07 实测驱动）
--------------------------------
实测 Cloudflare 到中国大陆链路**约一半请求会卡死**（同一文件连测 6 次，3 次 0 B/s
完全超时；成功的速度差 6 倍：16 / 17 / 97 KB/s）。在这种链路上，
「请求数」直接决定首屏能不能加载成功：

    设单文件失败率 0.5、每个文件重试到 3 次尝试（0.5³=12.5% 仍失败）：
      27 个文件 → 全部成功概率 0.875²⁷ ≈ **2.7%**（几乎必然缺脚本）
       4 个文件 → 0.875⁴ ≈ 58.6%
       4 个文件 + 重试到 5 次尝试（0.5⁵=3.1%）→ 0.969⁴ ≈ **88%**

所以「合并 + 多重试」是这套链路上唯一有效的组合拳。
（代价：单文件变大、传输时间变长，撞上慢窗口的概率上升；所以不做成 1 个文件，
 4 个是「请求数」与「单文件体积」的折中。）

用法
----
    python tools/bundle-js.py            # 只检查（比对 bundle 是否与源码同步）
    python tools/bundle-js.py --write    # 生成/更新 js/bundle/*.js

⚠️ 改过任何被合并的源码后，必须重跑 --write，否则线上跑的还是旧代码。
   （与 tools/split-published.py 同一套约定。）
"""

import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "js", "bundle")

# 分组 = 合并边界。组内顺序 = 依赖顺序（必须与 index.html 原来的一致）。
#
# 拆成「首屏 3 组 + 非首屏 1 组」而不是 1 组：单文件越大传输时间越长，
# 越容易在慢窗口里被掐断；而 extra 那一组全是路由/交互才用到的，
# 可以等首屏 3 组出齐之后再加载，不进关键路径。
#
# 关键路径请求数 = 3 → 配 5 次尝试（0.5⁵=3.1% 失败）后全成功概率约 91%。
GROUPS = [
    ("vendor", "第三方库（全部为首屏立即需要）", [
        "vendor/dexie.min.js",
        "vendor/purify.min.js",
        "vendor/marked.min.js",
        "vendor/fuse.min.js",
    ]),
    ("core", "基础设施：工具 / 数据库 / 服务 / 云端", [
        "js/utils.js",
        "js/turnstile.js",
        "js/db.js",
        "js/auth.js",
        "js/search.js",
        "js/aiprompts.js",
        "js/api.js",
        "js/services.js",
        "js/cloud.js",
        "js/backup.js",
    ]),
    ("app", "应用主体：路由 / 首屏页面", [
        "js/daily-quote.js",
        "js/docs-loader.js",   # 必须先于 app.js（app.js 启动时用它预热）
        "js/app.js",
    ]),
    # ↓ 非首屏：由加载器在关键路径出齐之后再拉，失败也不影响首屏
    ("extra", "非首屏（路由 / 交互触发时才用）", [
        "vendor/highlight.min.js",
        "js/roadmap.js",
        "js/account.js",
        "js/submit.js",
        "js/panorama.js",
        "js/sharecard.js",
        "js/guide.js",
        "js/docs.js",
        "js/festival.js",
        "js/importexport.js",
    ]),
]

# 哪些组必须先出（关键路径）；其余组由加载器延迟加载
CRITICAL_GROUPS = ["vendor", "core", "app"]

HEADER = """/* =========================================================================
 *  js/bundle/bundle-{NAME}.js  —— **自动生成，请勿直接编辑**
 * =========================================================================
 *  由 tools/bundle-js.py 按依赖顺序拼接以下 {N} 个文件（{DESC}）：
{LIST}
 *
 *  为什么合并：实测 Cloudflare 到中国大陆链路约一半请求会卡死，请求数直接决定
 *  首屏能否加载成功（27 个文件全成功概率约 2.7%，4 个约 88%，详见脚本注释）。
 *
 *  ⚠️ 修改上述任一源文件后，必须重跑：python tools/bundle-js.py --write
 * ========================================================================= */
"""


def read_src(rel):
    p = os.path.join(ROOT, rel.replace("/", os.sep))
    if not os.path.exists(p):
        raise SystemExit("[缺少源文件] %s" % rel)
    s = io.open(p, encoding="utf-8", newline="").read()
    # 去掉 sourceMappingURL：源文件名对不上，留着会让浏览器去请求不存在的 .map（404）
    out = []
    for line in s.split("\n"):
        if line.strip().startswith("//# sourceMappingURL=") or line.strip().startswith("//@ sourceMappingURL="):
            continue
        out.append(line)
    return "\n".join(out)


def build_one(name, desc, files):
    parts = []
    for rel in files:
        body = read_src(rel)
        # ⚠️ 只做「加分号 + 边界注释」，**绝不额外包一层 IIFE**。
        # 项目自己的 js/*.js 都是 IIFE，包一层没事；但 vendor/ 下的 dexie、marked、
        # fuse、highlight 是 UMD / 经典库，靠**顶层 var 或 this 挂到 window**。
        # 再包一层会让 "use strict" 作用域与 this 绑定都变掉，把库直接搞坏。
        # 前置分号是必需的：上一个文件末尾没写分号、下一个以 ( 开头时，
        # 会被拼成函数调用（a()(...)）而报错。
        parts.append("\n;/* ===== >> %s ===== */\n%s\n;/* ===== << %s ===== */\n" % (rel, body, rel))
    listtxt = "".join(" *    · %s\n" % f for f in files)
    # 用 replace 而不是 % 格式化：HEADER 正文里有「2.7%」「88%」这类百分号，
    # 走 % 格式化会被当成占位符直接抛 TypeError。
    head = (HEADER
            .replace("{NAME}", name)
            .replace("{N}", str(len(files)))
            .replace("{DESC}", desc)
            .replace("{LIST}", listtxt))
    return head + "".join(parts)


def main():
    write = "--write" in sys.argv
    if not os.path.isdir(OUT_DIR):
        os.makedirs(OUT_DIR)

    total_src = 0
    total_out = 0
    stale = []

    for name, desc, files in GROUPS:
        text = build_one(name, desc, files)
        out_path = os.path.join(OUT_DIR, "bundle-%s.js" % name)
        total_src += len(files)

        old = None
        if os.path.exists(out_path):
            old = io.open(out_path, encoding="utf-8", newline="").read()

        src_bytes = sum(
            os.path.getsize(os.path.join(ROOT, f.replace("/", os.sep))) for f in files
        )
        out_bytes = len(text.encode("utf-8"))
        total_out += out_bytes

        status = "同步" if old == text else ("待生成" if old is None else "⚠️ 已过期")
        if old != text:
            stale.append(name)
        print("  bundle-%-7s %2d 个源文件  %7.1f KB → %7.1f KB  %s"
              % (name, len(files), src_bytes / 1024.0, out_bytes / 1024.0, status))

        if write:
            io.open(out_path, "w", encoding="utf-8", newline="").write(text)

    print("")
    print("合计：%d 个源文件 → 4 个 bundle（%.1f KB 源码 → %.1f KB 产物，无压缩）"
          % (total_src, total_src and sum(
              os.path.getsize(os.path.join(ROOT, f.replace("/", os.sep)))
              for _, _, fs in GROUPS for f in fs) / 1024.0, total_out / 1024.0))
    print("请求数：27 → 4")
    print("")

    if write:
        print("[OK] 已写入 js/bundle/（记得一并提交）")
    elif stale:
        print("[!!] 以下 bundle 与源码不一致，需重跑 --write：%s" % ", ".join(stale))
        return 1
    else:
        print("[OK] bundle 与源码一致")
    return 0


if __name__ == "__main__":
    sys.exit(main())
