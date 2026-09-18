#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bump-version.py —— 统一升级站点版本号（index.html 全部 ?v= + PAGE_VER + SWV，sw.js VERSION）。

用法:
    python tools/bump-version.py <旧版本> <新版本>
    python tools/bump-version.py --check        # 只检查各文件版本号是否一致

作用文件: index.html, sw.js（保留原行尾，不做 CRLF 转换）
"""
import io
import re
import sys

FILES = ["index.html", "sw.js"]


def read(p):
    return io.open(p, encoding="utf-8", newline="").read()


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        found = {}
        for p in FILES:
            s = read(p)
            vers = set(re.findall(r"2026\d{4}[a-z]", s))
            found[p] = sorted(vers)
        for p, v in found.items():
            print("%s: %s" % (p, v))
        allv = set()
        for v in found.values():
            allv |= set(v)
        print("consistent:", "YES" if len(allv) <= 1 else "NO -> " + str(sorted(allv)))
        return 0

    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    old, new = sys.argv[1], sys.argv[2]
    total = 0
    for p in FILES:
        s = read(p)
        n = s.count(old)
        if n:
            io.open(p, "w", encoding="utf-8", newline="").write(s.replace(old, new))
        print("%-12s replaced %d" % (p, n))
        total += n
    print("total:", total)
    # 回读校验
    for p in FILES:
        s = read(p)
        print("%-12s old_left=%d new=%d" % (p, s.count(old), s.count(new)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
