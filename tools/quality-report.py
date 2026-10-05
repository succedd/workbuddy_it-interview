#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""题库质量周检报告（20261005a）
=================================
对全库做结构化体检 + 抽样初筛，把结果**追加**写入 docs/quality-report.md（每周一节，
只保留最近 12 节）。供 WorkBuddy 定时任务（每周一 10:00）自动运行。

体检项（机器可判定的全做，判断不出来的交人工）
----------------------------------------------
1. 总量与分布：题数 / 分类数 / 岗位数 / published 占比
2. 标题重复：归一化后完全相同 + difflib ≥0.85 的近重复对（前 10 对）
3. 字段一致性：positionIds 与 positionNames 数量一致；categoryId 存在于分类表
4. 答案质量初筛：有效文字 <30（硬伤）/ <200 且要点 <2（疑似）/ 纯代码充数
5. 来源检查：source 非法或非 URL（不联网探测，网络探测用 audit-sample.py --source-check）
6. 抽样清单：随机 20 题机器初筛（复用 audit-sample 的闸门指标，seed=当周 ISO 周号，周内可复现）

用法
----
  python tools/quality-report.py            # 跑体检，追加写 docs/quality-report.md
  python tools/quality-report.py --stdout   # 只打印不落盘
  python tools/quality-report.py --push     # 落盘后通过 GitHub Contents API 推送报告文件
                                            # （需环境变量 GH_PUBLISH_TOKEN；release,main 双写）

退出码：0 = 全库无硬伤；1 = 存在硬伤（重复标题/字段不一致/答案过短），供自动化告警
"""
import argparse
import datetime
import difflib
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enrich_questions import (  # noqa: E402
    PUBLISHED, norm_title, struct_points, plain_len, code_ratio, github_put,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT = os.path.join(ROOT, "docs", "quality-report.md")
MAX_SECTIONS = 12
NEAR_DUP_CUTOFF = 0.85
SAMPLE_N = 20


def load():
    with open(PUBLISHED, encoding="utf-8") as f:
        return json.load(f)


def audit_all(d):
    qs = d.get("questions", [])
    cat_ids = {c.get("id") for c in d.get("categories", [])}
    issues_hard, issues_warn = [], []

    # 1) 标题重复
    by_norm = {}
    for q in qs:
        by_norm.setdefault(norm_title(q.get("title", "")), []).append(q)
    dup_exact = {k: v for k, v in by_norm.items() if len(v) > 1}
    for k, v in dup_exact.items():
        issues_hard.append("标题重复：%s ← #%s" % (v[0]["title"][:40], "/".join(str(x["id"]) for x in v)))
    # 近重复（同分类内比对，控制复杂度）
    by_cat = {}
    for q in qs:
        by_cat.setdefault(q.get("categoryId"), []).append(q)
    near_pairs = []
    for cid, group in by_cat.items():
        titles = [(q["id"], norm_title(q["title"])) for q in group]
        for i in range(len(titles)):
            for j in range(i + 1, len(titles)):
                if not titles[i][1] or not titles[j][1]:
                    continue
                r = difflib.SequenceMatcher(None, titles[i][1], titles[j][1]).ratio()
                if r >= NEAR_DUP_CUTOFF:
                    near_pairs.append((round(r, 2), titles[i][0], titles[j][0]))
    near_pairs.sort(reverse=True)
    for r, a, b in near_pairs[:10]:
        issues_warn.append("近重复(%.2f)：#%s ↔ #%s" % (r, a, b))

    for q in qs:
        pid, pnames = q.get("positionIds") or [], q.get("positionNames") or []
        if len(pid) != len(pnames):
            issues_hard.append("#%s positionIds/Names 数量不一致（%d vs %d）" % (q["id"], len(pid), len(pnames)))
        if q.get("categoryId") not in cat_ids:
            issues_hard.append("#%s categoryId=%s 不在分类表" % (q["id"], q.get("categoryId")))
        a = q.get("answer") or ""
        pl, pts, cr = plain_len(a), struct_points(a), code_ratio(a)
        if pl < 30:
            issues_hard.append("#%s 答案有效文字 %d 字（<30）：%s" % (q["id"], pl, q.get("title", "")[:30]))
        elif pl < 200 and pts < 2:
            issues_warn.append("#%s 答案偏短且要点少（%d 字 / %d 要点）：%s" % (q["id"], pl, pts, q.get("title", "")[:30]))
        if cr > 0.7 and pl < 80:
            issues_warn.append("#%s 疑似纯代码充数" % q["id"])
        src = (q.get("source") or "").strip()
        if not re.match(r"^https?://|^(manual|seed|web|principles|ai|import)$", src, re.I):
            issues_warn.append("#%s 来源不规范（%s）" % (q["id"], src[:40] or "空"))

    from collections import Counter
    by_diff = Counter(q.get("difficulty") for q in qs)
    summary = {
        "total": len(qs),
        "published": sum(1 for q in qs if q.get("status") == "published"),
        "categories": len(d.get("categories", [])),
        "positions": len(d.get("positions", [])),
        "rmCount": len(d.get("removedQuestions") or {}),
        "byDiff": dict(by_diff),
    }
    return summary, issues_hard, issues_warn, near_pairs


def sample_rows(seed):
    """随机 20 题机器初筛（seed=ISO 周号，同周可复现）。"""
    data = load()
    qs = data.get("questions", [])
    rnd = __import__("random").Random(seed)
    pool = rnd.sample(qs, min(SAMPLE_N, len(qs)))
    rows = []
    for q in pool:
        a = q.get("answer") or ""
        rows.append({
            "id": q.get("id"),
            "title": (q.get("title") or "")[:44],
            "points": struct_points(a),
            "plain": plain_len(a),
            "cr": round(code_ratio(a), 2),
            "ok": not (plain_len(a) < 30 or (plain_len(a) < 200 and struct_points(a) < 2)),
        })
    return rows


def build_section():
    d = load()
    summary, hard, warn, near = audit_all(d)
    week = datetime.date.today().isocalendar()[1]
    rows = sample_rows("2026-W%02d" % week)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    L = []
    L.append("## %s（第 %d 周）" % (now, week))
    L.append("")
    L.append("**总量**：%d 题（published %d）· %d 分类 · %d 岗位 · removedQuestions %d 条" % (
        summary["total"], summary["published"], summary["categories"], summary["positions"], summary["rmCount"]))
    L.append("")
    L.append("**难度分布**：" + " · ".join("%s %d" % (k, v) for k, v in sorted(summary["byDiff"].items(), key=lambda x: -x[1])))
    L.append("")
    L.append("**硬伤：%d 项%s**" % (len(hard), "，前 15 条如下" if len(hard) > 15 else ""))
    L.append("")
    if hard:
        for s in hard[:15]:
            L.append("- %s" % s)
        if len(hard) > 15:
            L.append("- …共 %d 项，略" % len(hard))
    else:
        L.append("- 无 ✅")
    L.append("")
    L.append("**疑似（人工复核）：%d 项**，其中近重复对 %d（阈值 %.2f）。前 10 条：" % (len(warn), len(near), NEAR_DUP_CUTOFF))
    L.append("")
    if warn:
        for s in warn[:10]:
            L.append("- %s" % s)
    else:
        L.append("- 无 ✅")
    L.append("")
    L.append("**抽样初筛（%d 题，seed=本周期）**：" % len(rows))
    L.append("")
    L.append("| id | 题目 | 要点 | 文字 | 代码% | 初筛 |")
    L.append("|---|---|---|---|---|---|")
    for r in rows:
        L.append("| %s | %s | %d | %d | %.0f%% | %s |" % (
            r["id"], r["title"], r["points"], r["plain"], r["cr"] * 100,
            "—" if r["ok"] else "⚠ 疑似"))
    L.append("")
    L.append("> 复核要点：答案是否准确、是否答非所问、来源是否支撑结论。机器只初筛，不下架。")
    L.append("")
    return "\n".join(L), (len(hard) == 0)


def write_report(section):
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    header = "# 题库质量周检报告\n\n> 由 tools/quality-report.py 自动生成并追加，每周一节；只保留最近 %d 节。\n\n" % MAX_SECTIONS
    old = ""
    if os.path.exists(REPORT):
        old = open(REPORT, encoding="utf-8").read()
    body = old if old.startswith("# ") else (header if old == "" else header + old)
    # 追加新节到表头之后（最新在上）
    lines = body.split("\n")
    # 找到表头之后的插入点：跳过前导 # 与 > 行和空行
    idx = 0
    while idx < len(lines) and (lines[idx].startswith("#") or lines[idx].startswith(">") or not lines[idx].strip()):
        if lines[idx].strip():
            idx += 1
        else:
            break
    # 更稳妥：直接在第一个 "## " 前插入；没有旧节就放到文件末尾
    content = body
    first_sec = body.find("\n## ")
    new_block = section + "\n\n"
    if first_sec >= 0:
        content = body[:first_sec + 1] + new_block + body[first_sec + 1:]
    else:
        content = body.rstrip() + "\n\n" + new_block
    # 截断到最近 MAX_SECTIONS 节
    parts = content.split("\n## ")
    head = parts[0]
    secs = parts[1:]
    if len(secs) > MAX_SECTIONS:
        secs = secs[:MAX_SECTIONS]
    content = head + "".join("## " + s if not s.startswith("## ") else s for s in secs)
    with open(REPORT, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    return REPORT


def main():
    ap = argparse.ArgumentParser(description="题库质量周检报告")
    ap.add_argument("--stdout", action="store_true", help="只打印不落盘")
    ap.add_argument("--push", action="store_true", help="报告落盘后推送 GitHub（需 GH_PUBLISH_TOKEN）")
    args = ap.parse_args()

    section, healthy = build_section()
    if args.stdout:
        print(section)
    else:
        p = write_report(section)
        print("报告已写入：%s" % p)
    print("硬伤结论：%s" % ("全部通过 ✅" if healthy else "存在问题 ⚠（见报告）"))
    if args.push and not args.stdout:
        token = os.environ.get("GH_PUBLISH_TOKEN") or ""
        if not token:
            print("! 未配置 GH_PUBLISH_TOKEN，报告仅本地保存")
            return 0 if healthy else 1
        content = open(REPORT, encoding="utf-8").read()
        msg = "docs: 题库质量周检报告 %s" % datetime.date.today().isoformat()
        for b in ("release", "main"):
            try:
                os.environ["GH_PUBLISH_TOKEN"] = token
                github_put("docs/quality-report.md", content, b, msg)
                print("  ✓ quality-report.md → %s" % b)
            except Exception as e:
                print("  ! 推送失败 %s：%s" % (b, e))
    return 0 if healthy else 1


if __name__ == "__main__":
    sys.exit(main())
