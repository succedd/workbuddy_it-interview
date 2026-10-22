#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把首屏 7 个 CSS 合并成 css/bundle.css（2026-10-22 性能优化）。
顺序与 index.html 原顺序一致：variables → style → animations → responsive → loader → festival → home。
用法：
  python3 tools/bundle-css.py            # 只检查
  python3 tools/bundle-css.py --write    # 生成 css/bundle.css
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["variables.css", "style.css", "animations.css", "responsive.css", "loader.css", "festival.css", "home.css"]
OUT = os.path.join(ROOT, "css", "bundle.css")

def build():
    parts = []
    for name in FILES:
        p = os.path.join(ROOT, "css", name)
        with open(p, encoding="utf-8") as f:
            parts.append("/* ===== %s ===== */\n%s\n" % (name, f.read().rstrip()))
    return "\n".join(parts) + "\n"

def main():
    content = build()
    if "--write" in sys.argv:
        with open(OUT, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        print("[OK] 写入 css/bundle.css（%d bytes）" % len(content.encode("utf-8")))
        return
    old = ""
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            old = f.read()
    if old == content:
        print("[OK] css/bundle.css 已是最新")
    else:
        print("[DIFF] css/bundle.css 需要重新生成：python3 tools/bundle-css.py --write")
        sys.exit(1)

if __name__ == "__main__":
    main()
