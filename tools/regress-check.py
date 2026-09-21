#!/usr/bin/env python3
"""换域名后「旧功能零回归」核对（用户硬性要求）

以线上 tip 的 index.html 为基线，逐项 grep 关键函数 / 文案 / 资源，
确认切换域名没有顺手删掉任何既有功能。

用法：python tools/regress-check.py
退出码 0 = 全部仍在。
"""
import re
import subprocess
import sys

SITE = "https://itinterview.com.cn"
PROXY = "http://127.0.0.1:7897"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")

# 关键 JS 模块（index.html 必须全部加载）
MODULES = [
    "js/utils.js", "js/db.js", "js/auth.js", "js/search.js", "js/aiprompts.js",
    "js/api.js", "js/services.js", "js/cloud.js", "js/backup.js",
    "js/importexport.js", "js/panorama.js", "js/sharecard.js", "js/app.js",
]
# 关键 CSS
CSSS = ["css/variables.css", "css/style.css", "css/animations.css",
        "css/responsive.css", "css/loader.css"]
# 关键功能关键词（前端源码里必须仍能找到）
FEATURES = [
    ("艾宾浩斯/复习", ["ebbinghaus", "revieW", "weakBank"]),
    ("错题本", ["weakBank"]),
    ("收藏", ["favorites"]),
    ("历史记录", ["histories"]),
    ("云同步", ["absorbRemote", "syncIfNeeded"]),
    ("发布守卫", ["guardAgainstShrink"]),
    ("登录注册", ["login", "register"]),
    ("分享卡", ["sharecard", "Share"]),
    ("模拟面试", ["interview", "模拟面试"]),
    ("岗位筛选", ["positionIds", "positionNames"]),
    ("AI 生成", ["aiprompts", "generateQuestion"]),
    ("导入导出", ["importexport", "Excel", "CSV"]),
    ("PWA/ServiceWorker", ["serviceWorker", "sw.js"]),
    ("统计上报", ["/visit", "/view"]),
    ("题目重定向清理", ["applyRemovedQuestions", "removedQuestions"]),
]
# 关键分享页资源
ASSETS = ["/manifest.json", "/sw.js", "/api-endpoints.json",
          "/data/tech-maps.json", "/assets/og-cover.png"]


def curl(url, extra=None):
    cmd = ["curl", "-s", "-k", "-L", "-o", "-", "-w", "\n__HTTP__%{http_code}",
           "-x", PROXY, "-A", UA]
    if extra:
        cmd += extra
    cmd.append(url)
    p = subprocess.run(cmd, capture_output=True, timeout=60)
    out = p.stdout.decode("utf-8", "replace")
    m = re.search(r"__HTTP__(\d{3})$", out)
    return (m.group(1) if m else "000"), (out[:m.start()] if m else out)


def main():
    fails = []
    print(f"\n{'='*62}\n  旧功能零回归核对：{SITE}\n{'='*62}\n")

    code, home = curl(SITE + "/")
    print(f"首页 http={code}  bytes={len(home)}\n")

    # 关键功能关键词散布在 js/*.js 里，必须把这些 JS 全量拉下来再 grep
    print("--- 0. 拉取全部 JS 模块 ---")
    bundle = home
    for m in MODULES:
        c, body = curl(SITE + "/" + m)
        print(f"   {m:22s} http={c} bytes={len(body)}")
        if c != "200":
            fails.append(f"JS 不可达: {m} -> {c}")
        bundle += body
    print(f"   => 合并文本 {len(bundle)} 字节\n")

    print("--- 1. JS 模块全部被 index.html 引用 ---")
    for m in MODULES:
        ok = m in home
        print(f"   {'OK ' if ok else 'MISS'} {m}")
        if not ok:
            fails.append(f"JS 未被引用: {m}")
    print("\n--- 2. CSS 全部被引用 ---")
    for c in CSSS:
        ok = c in home
        print(f"   {'OK ' if ok else 'MISS'} {c}")
        if not ok:
            fails.append(f"CSS 未被引用: {c}")
    print("\n--- 3. 关键功能关键词（在合并 JS 文本中查找）---")
    for name, kws in FEATURES:
        hit = [k for k in kws if k.lower() in bundle.lower()]
        ok = len(hit) > 0
        print(f"   {'OK ' if ok else 'MISS'} {name:16s} 命中 {hit}")
        if not ok:
            fails.append(f"功能关键词缺失: {name} {kws}")
    print("\n--- 4. 静态资源可达 ---")
    for a in ASSETS:
        if a == "/data/tech-maps.json":
            # 与 published.json 同受守卫保护，需带同源信号
            c, _ = curl(SITE + a, extra=["-H", "Sec-Fetch-Site: same-origin",
                                         "-H", f"Referer: {SITE}/"])
            note = "(需同源信号)"
        else:
            c, _ = curl(SITE + a)
            note = ""
        ok = c == "200"
        print(f"   {'OK ' if ok else 'MISS'} {a}  http={c} {note}")
        if not ok:
            fails.append(f"资源不可达: {a} -> {c}")
    print("\n--- 5. 题库数据完整性 ---")
    c, body = curl(SITE + "/data/published.json", extra=[
        "-H", "Sec-Fetch-Site: same-origin", "-H", f"Referer: {SITE}/"])
    import json
    try:
        j = json.loads(body)
        nq = len(j.get("questions") or [])
        print(f"   OK   同源取题库 http={c}  version={j.get('version')}  questions={nq}")
        if nq < 1000:
            fails.append(f"题数异常偏少: {nq}")
    except Exception as e:
        print(f"   MISS 题库解析失败: {e}")
        fails.append("题库不可解析")

    print(f"\n{'-'*62}")
    if fails:
        print(f"  ❌ 发现 {len(fails)} 项回归：")
        for f in fails:
            print(f"     - {f}")
    else:
        print("  ✅ 全部通过：旧功能零回归")
    print(f"{'-'*62}\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
