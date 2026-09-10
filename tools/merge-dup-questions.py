#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重复题合并工具（同一道题被不同批次重复收录时的清理）

背景：题库由多个批次累积而成，早期 seed/manual 批次与后来的 web 批次之间存在
大量「同一问题、两版答案」的重复（例：`Redis 为什么快？` 与 `Redis 为什么这么快？`），
另有少量字面副本（标题带「（副本）」）。

处理原则（比直接删掉更保守）：
  - 保留方 = 由 tools/dup-merge-plan.json 显式指定（人工核对过内容更全的那一版）；
  - 浏览数 / 收藏数 **累加** 到保留方，不丢真实热度；
  - tags、positionIds/positionNames、relatedIds 取**并集**，不丢人工配置；
  - 被删题号写进顶层 `removedQuestions`（{旧id: 保留id}），前端据此：
    ① 清理本机残留、② 把本地收藏/浏览/错题记录重定向到保留题；
    不写这个映射，编辑端下次自动发布会把删掉的题整包推回云端。
  - 被删题号的分享页由 tools/gen-share-pages.js 之后改为跳转页（见 --print-drops）。

用法：
  python tools/merge-dup-questions.py --scan                 # 全库扫描疑似重复（只报告）
  python tools/merge-dup-questions.py --dry                  # 按 plan 报告将执行的合并
  python tools/merge-dup-questions.py --apply                # 写入 data/published.json
  python tools/merge-dup-questions.py --apply --push         # 并推送 release + main
  python tools/merge-dup-questions.py --apply --push --print-drops   # 输出被删题号（供分享页跳转）
  python tools/merge-dup-questions.py --write-redirects      # 为被删题号生成跳转分享页
  python tools/merge-dup-questions.py --prune-sitemap        # 从 sitemap.xml 移除被删题号条目

完整发版链（2026-09-10 实战）：
  --dry → --apply --write-redirects --prune-sitemap → bump 版本号 → 刷 README/HANDOVER
  → 精确 git add（含 q/）→ push release + main → 线上核对题数与跳转页
"""
import argparse
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from difflib import SequenceMatcher

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISHED = os.path.join(ROOT, "data", "published.json")
PLAN_PATH = os.path.join(ROOT, "tools", "dup-merge-plan.json")
LAST_DROPS = os.path.join(ROOT, "tools", ".dup-merge-last.json")
sys.path.insert(0, os.path.join(ROOT, "tools"))


def log(msg):
    print(msg, flush=True)


def load():
    with open(PUBLISHED, encoding="utf-8") as f:
        return json.load(f)


def save(data):
    """单行紧凑 JSON，不写末尾换行（前端要下载的数据文件）。"""
    content = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(PUBLISHED, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    return len(content.encode("utf-8"))


def load_plan():
    if not os.path.exists(PLAN_PATH):
        return []
    with open(PLAN_PATH, encoding="utf-8") as f:
        p = json.load(f)
    return p.get("merges", p if isinstance(p, list) else [])


# ---------------------------------------------------------------- 扫描
def norm(s):
    return re.sub(r"[^\w\u4e00-\u9fff]+", "", (s or "").lower())


def scan(data, min_title=0.6, min_answer=0.85):
    """同分类内两两比对，输出疑似重复对（标题像 + 答案像）。"""
    cmap = {c["id"]: c.get("name") for c in data.get("categories", [])}
    bycat = defaultdict(list)
    for q in data.get("questions", []):
        bycat[q.get("categoryId")].append(q)
    high, med = [], []
    for cid, arr in bycat.items():
        for i in range(len(arr)):
            for j in range(i + 1, len(arr)):
                a, b = arr[i], arr[j]
                rt = SequenceMatcher(None, norm(a.get("title")), norm(b.get("title"))).ratio()
                ra = SequenceMatcher(None, norm(a.get("answer")), norm(b.get("answer"))).ratio()
                if rt < min_title and ra < min_answer:
                    continue
                rec = {"rt": round(rt, 2), "ra": round(ra, 2), "a": a["id"], "b": b["id"],
                       "cat": cmap.get(cid), "ta": a.get("title"), "tb": b.get("title"),
                       "la": len(a.get("answer") or ""), "lb": len(b.get("answer") or ""),
                       "va": a.get("views") or 0, "vb": b.get("views") or 0}
                (high if (rt >= min_title and ra >= min_answer) else med).append(rec)
    return high, med


def show_scan(data):
    high, med = scan(data)
    log("题数 %d，扫描完成：\n" % len(data.get("questions", [])))
    log("=== 字面重复（标题像 且 答案像 ≥0.85）: %d 对 ===" % len(high))
    for r in sorted(high, key=lambda x: -x["ra"]):
        log("  [%s vs %s] %s · %s" % (r["a"], r["b"], r["cat"], r["ta"][:34]))
    log("\n=== 同题不同答案（标题像，需人工核对保留方）: %d 对 ===" % len(med))
    for r in sorted(med, key=lambda x: -x["rt"]):
        log("  标题%s 答案%s [%s(%d字,v%d) vs %s(%d字,v%d)] %s"
            % (r["rt"], r["ra"], r["a"], r["la"], r["va"], r["b"], r["lb"], r["vb"], r["cat"]))
        log("      A: %s" % r["ta"][:60])
        log("      B: %s" % r["tb"][:60])
    return high, med


# ---------------------------------------------------------------- 合并
def validate(data, merges):
    """返回 (qmap, problems, pending)。pending = 题目仍在库中、需要真正执行合并的条目；
    drop 已不在库中且 removedQuestions 已记录同一映射的条目视为「已合并」，静默跳过（幂等）。"""
    qmap = {q["id"]: q for q in data.get("questions", [])}
    rm = data.get("removedQuestions") if isinstance(data.get("removedQuestions"), dict) else {}
    problems, pending, already = [], [], []
    drops = [m.get("drop") for m in merges]
    keeps = [m.get("keep") for m in merges]
    for m in merges:
        d, k = m.get("drop"), m.get("keep")
        if d is None or k is None:
            problems.append("条目缺少 drop/keep：%s" % m)
        elif d == k:
            problems.append("drop 与 keep 相同：%s" % d)
        elif k not in qmap:
            problems.append("保留题不存在：%s" % k)
        elif d in qmap:
            pending.append(m)
        elif str(d) in rm and int(rm[str(d)]) == k:
            already.append(m)
        else:
            problems.append("被删题既不在库中、removedQuestions 里也没有记录：%s" % d)
    dup_drop = [i for i, c in Counter(drops).items() if c > 1]
    if dup_drop:
        problems.append("同一题被多次列为 drop：%s" % dup_drop)
    bad_keep = sorted(set(keeps) & set(drops))
    if bad_keep:
        problems.append("某题既是要删的又是保留方：%s" % bad_keep)
    return qmap, problems, pending, already


def show_plan(qmap, merges):
    log("计划合并 %d 对重复题：" % len(merges))
    for m in merges:
        d, k = m["drop"], m["keep"]
        dq, kq = qmap[d], qmap[k]
        log("  ● [%s] %s" % (kq.get("categoryId"), kq["title"][:52]))
        log("      保留 %s（%d 字答案，views %s，fav %s）" % (k, len(kq.get("answer") or ""), kq.get("views") or 0, kq.get("favorites") or 0))
        log("      删除 %s（%d 字答案，views %s，fav %s）→ 热度累加、标签/岗位并集"
            % (d, len(dq.get("answer") or ""), dq.get("views") or 0, dq.get("favorites") or 0))
        if m.get("note"):
            log("      说明：%s" % m["note"])


def merge_one(keep, drop, m):
    """把 drop 并入 keep（原地修改 keep），返回变更摘要。"""
    info = {}
    kv, dv = int(keep.get("views") or 0), int(drop.get("views") or 0)
    kf, df = int(keep.get("favorites") or 0), int(drop.get("favorites") or 0)
    keep["views"] = kv + dv
    keep["favorites"] = kf + df
    info["views"] = dv
    info["favorites"] = df

    # 标签并集
    tags = list(keep.get("tags") or [])
    for t in (drop.get("tags") or []):
        if t not in tags:
            tags.append(t)
    keep["tags"] = tags

    # 岗位并集（ids 与 names 必须对齐）
    kIds = list(keep.get("positionIds") or [])
    kNames = list(keep.get("positionNames") or [])
    dIds = list(drop.get("positionIds") or [])
    dNames = list(drop.get("positionNames") or [])
    added = 0
    for idx, pid in enumerate(dIds):
        if pid in kIds:
            continue
        kIds.append(pid)
        kNames.append(dNames[idx] if idx < len(dNames) else "")
        added += 1
    keep["positionIds"] = kIds
    keep["positionNames"] = kNames
    info["positions"] = added

    # 关联题并集
    rel = list(keep.get("relatedIds") or [])
    for r in (drop.get("relatedIds") or []):
        if r != keep["id"] and r not in rel:
            rel.append(r)
    keep["relatedIds"] = rel

    # 答案/正文：显式指定 answerFrom == drop 时替换（保留方答案明显更弱的情况）
    if m.get("answerFrom") == drop["id"]:
        keep["answer"] = drop.get("answer")
        if drop.get("body"):
            keep["body"] = drop["body"]
        info["answerFrom"] = drop["id"]

    # 答案：显式给出合并后的正文（两版各有独占内容、需要拼成一份时使用）
    if m.get("answerText"):
        keep["answer"] = m["answerText"]
        info["answerText"] = True

    keep["updatedAt"] = max(int(keep.get("updatedAt") or 0), int(drop.get("updatedAt") or 0),
                            int(time.time() * 1000))
    return info


def apply_merges(data, merges):
    qs = data.get("questions", [])
    qmap = {q["id"]: q for q in qs}
    drop2keep = {m["drop"]: m["keep"] for m in merges}
    total_views = total_fav = 0
    for m in merges:
        info = merge_one(qmap[m["keep"]], qmap[m["drop"]], m)
        total_views += info["views"]
        total_fav += info["favorites"]

    before = len(qs)
    data["questions"] = [q for q in qs if q["id"] not in drop2keep]
    removed = before - len(data["questions"])

    # 其他题目的 relatedIds 改写指向保留题（避免指向已删题）
    fixed_rel = 0
    for q in data["questions"]:
        rel = q.get("relatedIds") or []
        if not rel:
            continue
        new = []
        for r in rel:
            nr = drop2keep.get(r, r)
            if nr == q["id"] or nr in new:
                continue
            new.append(nr)
            if nr != r:
                fixed_rel += 1
        if new != rel:
            q["relatedIds"] = new

    # 顶层映射：前端据此清理本机残留并重定向用户本地数据
    rm = data.get("removedQuestions")
    if not isinstance(rm, dict):
        rm = {}
    for d, k in drop2keep.items():
        rm[str(d)] = k
    data["removedQuestions"] = rm

    data["version"] = int(data.get("version") or 0) + 1
    data["publishedAt"] = int(time.time() * 1000)

    # ---- 自检 ----
    ids = [q["id"] for q in data["questions"]]
    assert len(ids) == len(set(ids)), "出现重复题目 id，已中止"
    assert not (set(ids) & set(drop2keep)), "被删题仍在库中，已中止"
    dangling = [q["id"] for q in data["questions"] if any(r not in set(ids) for r in (q.get("relatedIds") or []))]
    assert not dangling, "relatedIds 仍指向不存在的题：%s" % dangling[:5]

    log("✓ 移除 %d 题（题数 %d → %d）| 累加热度 views+%d fav+%d | 修正关联 %d 处 | version→%s"
        % (removed, before, len(data["questions"]), total_views, total_fav, fixed_rel, data["version"]))
    return drop2keep


SITE = "https://it-interview.is-a.dev"
REDIRECT_TPL = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>题目已合并 · IT面试题库</title>
  <link rel="canonical" href="%(target)s">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url=%(target)s">
  <script>location.replace("%(target)s");</script>
</head>
<body>
  <p>这道题与另一道重复题已合并，正在跳转…</p>
  <p><a href="%(target)s">如果没有自动跳转，请点这里</a></p>
</body>
</html>
"""


def write_redirects(data, drop2keep):
    """把被删题号的静态分享页改成跳转页（保留 SEO 权重与外部链接可用性）。"""
    qmap = {q["id"]: q for q in data.get("questions", [])}
    out_dir = os.path.join(ROOT, "q")
    n = 0
    for old, keep in sorted(drop2keep.items()):
        target = "%s/#/question/%s" % (SITE, keep)
        p = os.path.join(out_dir, "%s.html" % old)
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(REDIRECT_TPL % {"target": target})
        n += 1
        log("  ↗ q/%s.html → %s（%s）" % (old, target, (qmap.get(keep, {}).get("title") or "")[:30]))
    log("✓ 已生成 %d 个跳转页" % n)
    return n


def all_pairs(data):
    """当前库中记录过的全部「被删题 → 保留题」映射（供生成跳转页，可反复执行）。"""
    rm = data.get("removedQuestions")
    if not isinstance(rm, dict):
        return {}
    return {int(k): int(v) for k, v in rm.items() if str(k).isdigit() and str(v).isdigit()}


def prune_sitemap(dropped, nl=None):
    """从 sitemap.xml 移除全部「已被合并」题号对应的 <url> 条目，保留原换行风格。

    注意：遍历删除块时必须在两个分支都推进游标 pos，否则下一轮
    text[pos:m.start()] 会把刚删掉的块原样拼回去（曾经出现「删除 33 条但总数反而变多」）。
    """
    p = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(p):
        log("! 未找到 sitemap.xml，跳过")
        return 0
    text = open(p, encoding="utf-8").read()
    eol = nl if nl is not None else ("\r\n" if "\r\n" in text else "\n")
    pat = re.compile(r"[ \t]*<url>(?:(?!</url>).)*?</url>" + re.escape(eol) + "?", re.S)
    out, pos, removed = [], 0, 0
    for m in pat.finditer(text):
        out.append(text[pos:m.start()])
        pos = m.end()                      # ← 关键：两个分支都要推进
        blk = m.group(0)
        lm = re.search(r"<loc>([^<]+)</loc>", blk)
        qm = re.search(r"/q/(\d+)\.html$", lm.group(1)) if lm else None
        if qm and int(qm.group(1)) in dropped:
            removed += 1
            continue
        out.append(blk)
    out.append(text[pos:])
    new = "".join(out)
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(new)
    total = len(re.findall(r"<url>", new))
    pages = len(re.findall(r"/q/\d+\.html</loc>", new))
    leftover = sorted(i for i in dropped if ("/q/%d.html</loc>" % i) in new)
    log("✓ sitemap 移除 %d 条（剩余 %d 条，其中分享页 %d 条）" % (removed, total, pages))
    if leftover:
        log("! 以下已删题号仍残留在 sitemap：%s" % leftover)
    return removed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan", action="store_true", help="扫描疑似重复，只报告")
    ap.add_argument("--dry", action="store_true", help="按 plan 报告计划")
    ap.add_argument("--apply", action="store_true", help="写入本地 data/published.json")
    ap.add_argument("--push", action="store_true", help="推送 release + main")
    ap.add_argument("--print-drops", action="store_true", help="输出被删题号（供分享页跳转处理）")
    ap.add_argument("--write-redirects", action="store_true", help="为被删题号生成跳转分享页")
    ap.add_argument("--prune-sitemap", action="store_true",
                    help="从 sitemap.xml 移除全部「已被合并」题号的条目（依据 removedQuestions，可反复执行）")
    args = ap.parse_args()

    data = load()
    log("当前：%d 题 / %d 分类 / version %s"
        % (len(data.get("questions", [])), len(data.get("categories", [])), data.get("version")))

    if args.scan:
        show_scan(data)
        return 0

    merges = load_plan()
    qmap, problems, pending, already = validate(data, merges) if merges else ({}, [], [], [])
    if problems:
        for p in problems:
            log("✗ %s" % p)
        return 2
    if already:
        log("· %d 条已在之前执行过（跳过）：%s" % (len(already), sorted(m["drop"] for m in already)))
    if pending:
        show_plan(qmap, pending)
    elif merges:
        log("✓ 计划中的 %d 条重复题合并均已完成，无需执行" % len(merges))

    if args.apply and pending:
        drop2keep = apply_merges(data, pending)
        size = save(data)
        log("✓ 已写入 %s（%.2f MB，单行紧凑）" % (PUBLISHED, size / 1048576.0))
        with open(LAST_DROPS, "w", encoding="utf-8") as f:
            json.dump(drop2keep, f, ensure_ascii=False)
        if args.print_drops:
            log("被删题号：%s" % ",".join(str(k) for k in drop2keep))
    elif args.apply:
        log("（无待执行合并，未改动数据文件）")
    else:
        log("\n（--dry 模式，未写入。加 --apply 执行）")

    if args.write_redirects:
        pairs = all_pairs(data)
        if not pairs:
            log("! 没有 removedQuestions 记录，无法生成跳转页")
        else:
            write_redirects(data, pairs)

    if args.prune_sitemap:
        pairs = all_pairs(data)
        if not pairs:
            log("! 没有 removedQuestions 记录，无法清理 sitemap")
        else:
            prune_sitemap(set(pairs.keys()))

    if args.push:
        # --push 始终推送当前本地 data/published.json（合并已在本地完成时可直接重试推送）
        import enrich_questions as eq
        if not eq.TOKEN:
            eq.TOKEN = os.environ.get("GH_PUBLISH_TOKEN", "")
        if not eq.TOKEN:
            log("✗ 未配置 GH_PUBLISH_TOKEN，无法推送")
            return 2
        eq.push_all(data, ["release", "main"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
