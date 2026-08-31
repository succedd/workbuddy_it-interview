#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""题库抽检回测工具（质量闸门 3）
=================================

随机抽取 N 道题生成「复核清单」，供人工或 AI 逐题复核答案是否准确、
是否答非所问、来源是否靠谱。机器只负责抽样与初筛，判断交给人。

设计原则
--------
- 抽样可复现（--seed 固定随机种子），方便周与周之间对齐。
- 优先抽新题：新扩充的题风险最高，--new / --since 可直接锁定范围。
- 机器指标只做「疑似不合格」提示，不自动下架任何题。

用法
----
  python tools/audit-sample.py                      # 随机抽 20 题
  python tools/audit-sample.py --n 30 --new         # 抽最新的 30 题
  python tools/audit-sample.py --since 2026-08-24   # 抽 8-24 之后新增的题
  python tools/audit-sample.py --seed 42            # 固定抽样结果
  python tools/audit-sample.py --source-check       # 顺带探测来源是否可达
  python tools/audit-sample.py --brief              # 只出指标表，不贴答案全文
  python tools/audit-sample.py --json               # 机器可读输出

退出码：0 = 无疑似问题；1 = 存在疑似不合格题（供自动化告警）
"""
import argparse
import json
import os
import random
import re
import sys
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enrich_questions import (  # noqa: E402
    PUBLISHED, struct_points, plain_len, code_ratio, _curl_status,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 疑似不合格的机器初筛线（只是提示，不是判决）
WARN_POINTS = 2
WARN_PLAIN = 200
WARN_CODE_RATIO = 0.7


def load():
    with open(PUBLISHED, encoding="utf-8") as f:
        return json.load(f)


def iso(ms):
    try:
        return datetime.datetime.fromtimestamp(int(ms) / 1000).strftime("%Y-%m-%d")
    except Exception:
        return "?"


def pick(qs, n, mode, since, seed):
    if mode == "new":
        pool = sorted(qs, key=lambda q: q.get("createdAt") or 0, reverse=True)
        return pool[:n]
    if since:
        try:
            ts = datetime.datetime.strptime(since, "%Y-%m-%d").timestamp() * 1000
        except ValueError:
            raise SystemExit("--since 需为 YYYY-MM-DD")
        pool = [q for q in qs if (q.get("createdAt") or 0) >= ts]
    else:
        pool = list(qs)
    rnd = random.Random(seed)
    return rnd.sample(pool, min(n, len(pool)))


def is_url(s):
    return bool(re.match(r"^https?://", (s or "").strip(), re.I))


def audit(q, check_source=False):
    a = q.get("answer") or ""
    pts, pl, cr = struct_points(a), plain_len(a), code_ratio(a)
    src = (q.get("source") or "").strip()
    flags = []
    if pts < WARN_POINTS and pl < WARN_PLAIN:
        flags.append("要点少且偏短")
    if cr > WARN_CODE_RATIO and pl < 80:
        flags.append("几乎纯代码")
    if not is_url(src):
        flags.append("来源为占位符(%s)" % (src or "空"))
    row = {
        "id": q.get("id"),
        "title": q.get("title", ""),
        "type": q.get("type", ""),
        "difficulty": q.get("difficulty", ""),
        "source": src,
        "points": pts,
        "plain": pl,
        "codeRatio": round(cr, 2),
        "created": iso(q.get("createdAt") or 0),
        "flags": flags,
        "answer": a,
    }
    if check_source and is_url(src):
        row["httpStatus"] = _curl_status(src)
        if row["httpStatus"] in (404, 410):
            flags.append("来源失效(%s)" % row["httpStatus"])
    return row


def main():
    ap = argparse.ArgumentParser(description="题库抽检回测")
    ap.add_argument("--n", type=int, default=20, help="抽样题数（默认 20）")
    ap.add_argument("--new", action="store_true", help="抽最新入库的 N 题")
    ap.add_argument("--since", help="只抽该日期（YYYY-MM-DD）之后新增的题")
    ap.add_argument("--seed", type=int, default=None, help="随机种子，固定抽样结果")
    ap.add_argument("--source-check", action="store_true", help="逐题探测来源可达性")
    ap.add_argument("--brief", action="store_true", help="只出指标表，不贴答案全文")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    data = load()
    qs = data.get("questions", [])
    rows = [audit(q, args.source_check) for q in pick(qs, args.n, "new" if args.new else ("since" if args.since else "random"), args.since, args.seed)]
    bad = [r for r in rows if r["flags"]]

    if args.json:
        print(json.dumps({"picked": len(rows), "suspect": len(bad), "rows": rows},
                         ensure_ascii=False, indent=1))
        return 1 if bad else 0

    print("# 题库抽检清单")
    print()
    print("- 抽样时间：%s" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("- 题库总量：%d 题；本次抽 %d 题；机器初筛疑似 %d 题" % (len(qs), len(rows), len(bad)))
    print("- 复核要点：答案是否准确、是否答非所问、来源是否真的支撑该结论")
    print()
    print("| id | 要点 | 文字 | 代码% | 来源 | 初筛 |")
    print("|---|---|---|---|---|---|")
    for r in rows:
        s = r["source"]
        s = (s[:42] + "…") if len(s) > 44 else (s or "—")
        print("| %s | %d | %d | %.0f%% | %s | %s |"
              % (r["id"], r["points"], r["plain"], r["codeRatio"] * 100, s,
                 "、".join(r["flags"]) if r["flags"] else "—"))
    if args.brief:
        return 1 if bad else 0

    print()
    for r in rows:
        print("---")
        print()
        print("### #%s %s" % (r["id"], r["title"]))
        print()
        print("- 分类/题型/难度：%s / %s / %s；入库：%s" % (r["type"], r["difficulty"], r["type"], r["created"]))
        print("- 来源：%s" % (r["source"] or "—"))
        if r["flags"]:
            print("- **初筛提示**：%s" % "、".join(r["flags"]))
        print()
        print(r["answer"])
        print()
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
