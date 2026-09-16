#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
题库覆盖度报告 (coverage_report.py)
====================================
统计 data/published.json 的题量分布，输出 tools/coverage.md：
- 总览：总题数、已填/空叶子分类、岗位覆盖
- 各顶层技术域题量（含空叶子分类数），按题量升序 —— 帮自动化/人工优先补最缺的域

用法：
  python tools/coverage_report.py            # 生成 tools/coverage.md 并打印摘要
"""
import json
import os
import time
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISHED = os.path.join(ROOT, "data", "published.json")
OUT = os.path.join(ROOT, "tools", "coverage.md")


def main():
    with open(PUBLISHED, encoding="utf-8") as f:
        data = json.load(f)
    qs = data.get("questions", [])
    cats = {c["id"]: c for c in data.get("categories", [])}
    positions = data.get("positions", [])

    filled_ids = set(q["categoryId"] for q in qs if q.get("categoryId"))

    # children index: parentId -> [catId]
    children = defaultdict(list)
    for cid, c in cats.items():
        children[c.get("parentId")].append(cid)

    roots = [c for c in cats.values() if c.get("parentId") == 0]

    def is_leaf(cid):
        return not children.get(cid)

    leaf_total = sum(1 for c in cats.values() if is_leaf(c["id"]))
    leaf_filled = sum(1 for cid, c in cats.items()
                      if is_leaf(cid) and cid in filled_ids)

    # per-root stats
    rows = []
    for r in sorted(roots, key=lambda x: x["name"]):
        # collect all descendant leaves
        stack, leaves = [r["id"]], []
        while stack:
            cur = stack.pop()
            kids = children.get(cur, [])
            if kids:
                stack.extend(kids)
            else:
                leaves.append(cur)
        cnt = sum(1 for q in qs if q.get("categoryId") in leaves)
        empty = sum(1 for l in leaves if l not in filled_ids)
        rows.append((r["name"], len(leaves), empty, cnt))

    pos_covered = set()
    for q in qs:
        for pid in q.get("positionIds", []):
            pos_covered.add(pid)

    lines = [
        "# 题库覆盖度报告",
        "",
        "> 生成时间：%s · 共 **%d** 题" % (time.strftime("%Y-%m-%d %H:%M"), len(qs)),
        "",
        "| 指标 | 数值 |",
        "|------|------|",
        "| 总题数 | %d |" % len(qs),
        "| 分类总数 | %d（叶子 %d） |" % (len(cats), leaf_total),
        "| 已有题目的叶子分类 | %d / %d |" % (leaf_filled, leaf_total),
        "| 空叶子分类 | %d |" % (leaf_total - leaf_filled),
        "| 岗位总数 | %d（已有题目覆盖 %d） |" % (len(positions), len(pos_covered)),
        "",
        "## 各顶层技术域（按题量升序，越靠前越需补充）",
        "",
        "| 技术域 | 叶子分类 | 空叶子 | 题数 |",
        "|--------|----------|--------|------|",
    ]
    for name, lv, empty, cnt in sorted(rows, key=lambda x: x[3]):
        lines.append("| %s | %d | %d | %d |" % (name, lv, empty, cnt))

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print("\n".join(lines[:12]))
    print("... 完整报告 → tools/coverage.md")


if __name__ == "__main__":
    main()
