#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""题库内容质量体检（2026-10-21）
输出 data/quality-report.json，供管理端「内容质量」页读取。

检查：
1. 标题精确/近重复（同分类内 difflib >= 0.82）；
2. 来源 URL 健康（并发 HEAD/GET，404/410 记为 broken；超时/403 记为 unknown）；
3. 答案偏短（有效文字 <200）；
4. 无来源（source 不是 http(s)）；
5. 未复核（reviewedAt 为空）与 AI 0 分统计。

用法：
  python3 tools/content-audit.py            # 生成 data/quality-report.json
  python3 tools/content-audit.py --no-net   # 跳过来源网络探测（快速）
"""
from __future__ import annotations
import argparse, datetime, difflib, json, os, re, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISHED = os.path.join(ROOT, "data", "published.json")
OUT = os.path.join(ROOT, "data", "quality-report.json")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from enrich_questions import norm_title, plain_len
except Exception:
    def norm_title(s):
        return re.sub(r"[\s\W_]+", "", str(s or "").lower())
    def plain_len(s):
        return len(re.sub(r"\s+", "", str(s or "")))

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) it-interview-quality-audit"

def load():
    with open(PUBLISHED, encoding="utf-8") as f:
        return json.load(f)

def category_paths(cats):
    by = {c["id"]: c for c in cats}
    out = {}
    def path(cid):
        if cid in out: return out[cid]
        names, seen = [], set()
        while cid in by and cid not in seen:
            seen.add(cid); names.append(by[cid].get("name", "")); cid = by[cid].get("parentId")
        out[cid] = " / ".join(reversed([x for x in names if x]))
        return out[cid]
    for c in cats: path(c["id"])
    return out

def check_url(url):
    if not re.match(r"^https?://", url or "", re.I):
        return "invalid"
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=5) as r:
                return "ok" if r.status < 400 else "http_%d" % r.status
        except urllib.error.HTTPError as e:
            if e.code in (404, 410): return "broken_%d" % e.code
            if method == "HEAD" and e.code in (403, 405, 500, 501): continue
            return "http_%d" % e.code
        except Exception:
            if method == "HEAD": continue
            return "unknown"
    return "unknown"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-net", action="store_true")
    args = ap.parse_args()
    data = load(); qs = data.get("questions", []); cats = data.get("categories", [])
    paths = category_paths(cats)
    # 1) duplicates
    exact = {}
    for q in qs:
        k = norm_title(q.get("title"))
        if k: exact.setdefault(k, []).append(q)
    duplicates = []
    for k, group in exact.items():
        if len(group) > 1:
            for i in range(1, len(group)):
                duplicates.append({"similarity": 1.0, "category": paths.get(group[0].get("categoryId"), ""), "a": {"id": group[0]["id"], "title": group[0]["title"]}, "b": {"id": group[i]["id"], "title": group[i]["title"]}})
    by_cat = {}
    for q in qs: by_cat.setdefault(q.get("categoryId"), []).append(q)
    for cid, group in by_cat.items():
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                x, y = norm_title(a.get("title")), norm_title(b.get("title"))
                if not x or not y: continue
                r = difflib.SequenceMatcher(None, x, y).ratio()
                if r >= 0.82:
                    duplicates.append({"similarity": round(r, 2), "category": paths.get(cid, ""), "a": {"id": a["id"], "title": a["title"]}, "b": {"id": b["id"], "title": b["title"]}})
    # 去重（同一对可能由 exact+近重复重复）
    seen = set(); dups = []
    for d in sorted(duplicates, key=lambda x: -x["similarity"]):
        key = tuple(sorted((d["a"]["id"], d["b"]["id"])))
        if key in seen: continue
        seen.add(key); dups.append(d)
    # 2) sources
    urls = sorted({str(q.get("source") or "").strip() for q in qs if re.match(r"^https?://", str(q.get("source") or "").strip())})
    status = {}
    if not args.no_net:
        with ThreadPoolExecutor(max_workers=24) as ex:
            futs = {ex.submit(check_url, u): u for u in urls}
            for f in as_completed(futs):
                status[futs[f]] = f.result()
    # 3) short/no source
    short, no_source = [], []
    for q in qs:
        a = q.get("answer") or ""
        n = plain_len(a)
        if n < 200:
            short.append({"id": q["id"], "title": q.get("title", ""), "category": paths.get(q.get("categoryId"), ""), "length": n})
        src = str(q.get("source") or "").strip()
        if not re.match(r"^https?://", src, re.I):
            no_source.append({"id": q["id"], "title": q.get("title", ""), "source": src[:80]})
    broken, unknown = [], []
    for q in qs:
        src = str(q.get("source") or "").strip()
        st = status.get(src)
        if st and st.startswith("broken_"):
            broken.append({"id": q["id"], "title": q.get("title", ""), "url": src, "status": st})
        elif st and st not in ("ok", "invalid"):
            unknown.append({"id": q["id"], "title": q.get("title", ""), "url": src, "status": st})
    unverified = sum(1 for q in qs if not q.get("reviewedAt"))
    ai_zero = sum(1 for q in qs if not (q.get("aiScore") or 0))
    report = {
        "generatedAt": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "summary": {
            "total": len(qs), "published": sum(1 for q in qs if q.get("status") == "published"),
            "categories": len(cats), "positions": len(data.get("positions", [])),
            "nearDuplicates": len(dups), "brokenSources": len(broken), "unknownSources": len(unknown),
            "shortAnswers": len(short), "noSource": len(no_source),
            "unverified": unverified, "aiZero": ai_zero,
        },
        "duplicates": dups[:120],
        "brokenSources": broken[:120],
        "unknownSources": unknown[:120],
        "shortAnswers": sorted(short, key=lambda x: x["length"])[:120],
        "noSource": no_source[:120],
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print("[OK] 写入", OUT)

if __name__ == "__main__":
    main()
