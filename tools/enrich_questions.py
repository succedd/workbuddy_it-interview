#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
题库自动扩充流水线 (enrich_questions.py)
=========================================
把一批「结构化、可溯源」的面试题合并进 data/published.json。

设计要点
--------
1. 批次文件用「分类名 / 岗位名」引用，而不是裸 ID —— 更不易写错，流水线自动解析成 ID。
2. 严格的字段校验 + 题目去重（按归一化标题），保证「整理无错误」。
3. ID 顺序自增（max(id)+1），不会与现有题目冲突。
4. 可选 --push：通过 GitHub Contents API（与线上编辑端同一套机制）把新题库推到
   Pages 源分支（默认 release,main 双写），无需 git 凭据，只需一个 PAT。
5. --dry 只校验不落盘，用于 CI / 提交前自检。

用法
----
  python tools/enrich_questions.py tools/batches/2026-08-27-a.json
  python tools/enrich_questions.py tools/batches/2026-08-27-a.json --dry
  python tools/enrich_questions.py --all --push
  python tools/enrich_questions.py tools/batches/x.json --push --branches release

批次文件格式 (tools/batches/<name>.json)
----------------------------------------
{
  "batch": "2026-08-27-a",
  "note": "分布式与微服务专题",
  "questions": [
    {
      "title": "CAP 定理是什么？分布式系统如何取舍？",
      "body": "",                       // 可选，缺省等于 title
      "answer": "## 结论\\n...markdown...",
      "category": "分布式系统与微服务",  // 顶层或叶子分类名，自动解析为 categoryId
      "positions": ["后端开发工程师"],   // 岗位名列表，自动解析为 positionIds/Names
      "difficulty": "中级",             // 初级|中级|高级，缺省 中级
      "type": "简答题",                 // 缺省 简答题
      "tags": ["CAP", "分布式"],
      "years": "1-3年",                 // 缺省 不限
      "source": "https://github.com/CyC2018/CS-Notes"  // 必填：权威出处 URL
    }
  ]
}
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import difflib
import urllib.request
import urllib.error
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISHED = os.path.join(ROOT, "data", "published.json")
BATCHES_DIR = os.path.join(ROOT, "tools", "batches")

# 推送目标分支（Pages 源分支，双写保险）。可用环境变量 PUSH_BRANCHES 覆盖。
DEFAULT_BRANCHES = (os.environ.get("PUSH_BRANCHES") or "release,main").split(",")
DEFAULT_REPO = os.environ.get("GH_REPO") or "succedd/workbuddy_it-interview"
TOKEN = os.environ.get("GH_PUBLISH_TOKEN") or ""


def log(msg):
    print(msg, flush=True)


def norm_title(s):
    """归一化标题：转小写、去空白与标点（保留中文与字母数字），用于去重。"""
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r"[\s\W_]+", "", s)  # \W 在 Python3 unicode 模式下不含中文，故中文保留
    return s


# 模糊去重阈值：归一化标题相似度 ≥ 该值视为疑似重复，直接跳过（宁可漏收，不可重复）
FUZZY_DUP_CUTOFF = float(os.environ.get("FUZZY_DUP_CUTOFF") or "0.85")


def find_similar(nt, exist_norm):
    """在现有题库中找与 nt 相似度最高的标题，返回 (标题, 相似度)；无匹配返回 None。"""
    best, best_ratio = None, 0.0
    for t in exist_norm:
        if not t:
            continue
        r = difflib.SequenceMatcher(None, nt, t).ratio()
        if r > best_ratio:
            best, best_ratio = t, r
    return (best, best_ratio) if best and best_ratio >= FUZZY_DUP_CUTOFF else None


def load_published():
    with open(PUBLISHED, encoding="utf-8") as f:
        return json.load(f)


def build_index(data):
    """构建 name->id 映射，便于按名字解析分类/岗位。"""
    cat_by_name = {}
    for c in data.get("categories", []):
        cat_by_name[c["name"].strip()] = c["id"]
    pos_by_name = {}
    for p in data.get("positions", []):
        pos_by_name[p["name"].strip()] = p["id"]
    return cat_by_name, pos_by_name


def suggest(target, options, n=3):
    """对未命中的名字给出最接近的候选，降低手误成本。"""
    if not target:
        return []
    return difflib.get_close_matches(target, options, n=n, cutoff=0.4)


def resolve_category(item, cat_by_name):
    """返回 categoryId；若显式给了 categoryId 则校验存在，否则按名字解析。"""
    if "categoryId" in item and item["categoryId"]:
        return int(item["categoryId"])
    name = (item.get("category") or "").strip()
    if not name:
        raise ValueError("题目缺少 category/categoryId：%s" % item.get("title", "")[:40])
    if name in cat_by_name:
        return cat_by_name[name]
    opts = list(cat_by_name.keys())
    near = suggest(name, opts)
    raise ValueError("找不到分类「%s」。接近的：%s" % (name, "、".join(near) if near else "（请检查分类名）"))


def resolve_positions(item, pos_by_name):
    ids, names = [], []
    if "positionIds" in item and item["positionIds"]:
        return [int(x) for x in item["positionIds"]], ["" for _ in item["positionIds"]]
    for p in item.get("positions", []) or []:
        p = p.strip()
        if p in pos_by_name:
            ids.append(pos_by_name[p])
            names.append(p)
        else:
            opts = list(pos_by_name.keys())
            near = suggest(p, opts)
            raise ValueError("找不到岗位「%s」。接近的：%s" % (p, "、".join(near) if near else "（请检查岗位名）"))
    return ids, names


def build_question(item, next_id, now, cat_by_name, pos_by_name, exist_norm):
    """校验单题并构造完整对象（字段与线上 schema 对齐）。"""
    title = (item.get("title") or "").strip()
    answer = (item.get("answer") or "").strip()
    source = (item.get("source") or "").strip()
    if not title:
        raise ValueError("存在题目缺少 title")
    if not answer:
        raise ValueError("题目缺少 answer：%s" % title[:40])
    if not source:
        raise ValueError("题目缺少 source（权威出处）：%s" % title[:40])
    nt = norm_title(title)
    if nt in exist_norm:
        raise ValueError("与现有题目重复（标题归一化相同）：%s" % title[:40])
    similar = find_similar(nt, exist_norm)
    if similar:
        raise ValueError("与现有题目疑似重复（相似度 %.2f）：%s ≈《%s》"
                         % (similar[1], title[:30], similar[0][:30]))

    cat_id = resolve_category(item, cat_by_name)
    pos_ids, pos_names = resolve_positions(item, pos_by_name)

    body = (item.get("body") or "").strip() or title
    difficulty = item.get("difficulty") or "中级"
    q_type = item.get("type") or "简答题"
    years = item.get("years") or "不限"
    tags = item.get("tags") or []

    return {
        "id": next_id,
        "title": title,
        "body": body,
        "answer": answer,
        "categoryId": cat_id,
        "positionIds": pos_ids,
        "positionNames": pos_names,
        "difficulty": difficulty,
        "tags": tags,
        "type": q_type,
        "source": source,
        "status": "published",
        "years": years,
        "aiScore": int(item.get("aiScore", 0) or 0),
        "createdAt": now,
        "updatedAt": now,
        "favorites": 0,
        "views": 0,
        "relatedIds": [],
        "remark": "",
    }


def process_batch(path, data, cat_by_name, pos_by_name, exist_norm, next_id, dry, stats):
    with open(path, encoding="utf-8") as f:
        batch = json.load(f)
    added, skipped = [], []
    for item in batch.get("questions", []):
        try:
            q = build_question(item, next_id, int(time.time() * 1000),
                               cat_by_name, pos_by_name, exist_norm)
            if not dry:
                data["questions"].append(q)
                exist_norm.add(norm_title(q["title"]))
            added.append(q["title"])
            stats.setdefault("new_ids", []).append(q["id"])
            next_id += 1
        except ValueError as e:
            skipped.append(str(e))
            stats["skipped"] += 1
    stats["added"] += len(added)
    return added, skipped


def write_published(data):
    # 与线上一致：minified、ensure_ascii=False。
    # 每次真实合并都递增 version 并刷新 publishedAt —— 前端/编辑端据此感知「云端有更新」，
    # 避免旧快照一直停留在访客本地。
    data["version"] = int(data.get("version", 1)) + 1
    data["publishedAt"] = int(time.time() * 1000)
    with open(PUBLISHED, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def github_put(path, content, branch, message):
    """通过 Contents API 推送单文件（乐观锁重试），与线上编辑端同源。"""
    if not TOKEN:
        raise RuntimeError("未配置 GH_PUBLISH_TOKEN，无法推送。请设置环境变量后重试。")
    api = "https://api.github.com/repos/%s/contents/%s" % (DEFAULT_REPO, path)
    b64 = base64.b64encode(content.encode("utf-8")).decode("ascii")
    headers = {
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    }
    sha = None
    try:
        req = urllib.request.Request(api + "?ref=" + urllib.parse.quote(branch),
                                     headers={k: v for k, v in headers.items() if k != "Content-Type"})
        with urllib.request.urlopen(req, timeout=10) as r:
            sha = json.loads(r.read().decode("utf-8")).get("sha")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
    body = {"message": message, "content": b64, "branch": branch}
    if sha:
        body["sha"] = sha
    req = urllib.request.Request(api, data=json.dumps(body).encode("utf-8"),
                                 headers=headers, method="PUT")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def push_all(data, branches):
    content = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    msg = "自动扩充题库：%d 题（%s）" % (len(data["questions"]),
                                    time.strftime("%Y-%m-%d", time.localtime()))
    for b in branches:
        st = github_put("data/published.json", content, b, msg)
        log("  ✓ 已推送至 %s 分支 (HTTP %s)" % (b, st))


def regen_and_push_share_pages(new_ids, branches):
    """新题合并后：重生成静态分享页 q/<id>.html 并推送新增页面。

    - 分享页是 SEO 增强，任何失败都只告警，绝不让题库发布主流程翻车；
    - 页面内容由 published.json 确定性生成，存量页不变，只需推送本次新增 id；
    - node 不可用 / 未配 Token 时降级为「仅本地生成」或「跳过」。
    """
    if not new_ids:
        return
    script = os.path.join(ROOT, "tools", "gen-share-pages.js")
    try:
        subprocess.run(["node", script], cwd=ROOT, check=True, timeout=180,
                       stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        log("✓ 已重生成分享页（q/<id>.html，含 %d 个新题页面）" % len(new_ids))
    except Exception as e:
        log("  ! 分享页生成失败（跳过，不影响题库）：%s" % e)
        return
    if not branches:
        return
    if not TOKEN:
        log("  ! 未配置 GH_PUBLISH_TOKEN，分享页仅在本地生成未推送")
        return
    msg = "自动扩充：补充 %d 个新题分享页" % len(new_ids)
    pushed = 0
    for qid in new_ids:
        p = os.path.join(ROOT, "q", "%s.html" % qid)
        if not os.path.exists(p):
            log("  ! 分享页缺失：q/%s.html" % qid)
            continue
        with open(p, encoding="utf-8") as f:
            content = f.read()
        ok = True
        for b in branches:
            try:
                github_put("q/%s.html" % qid, content, b, msg)
            except Exception as e:
                ok = False
                log("  ! 分享页推送失败 q/%s.html → %s：%s" % (qid, b, e))
        if ok:
            pushed += 1
    log("✓ 新题分享页推送完成：%d/%d" % (pushed, len(new_ids)))


def main():
    ap = argparse.ArgumentParser(description="题库自动扩充流水线")
    ap.add_argument("batch", nargs="?", help="批次 JSON 路径；与 --all 二选一")
    ap.add_argument("--all", action="store_true", help="处理 tools/batches/ 下全部 .json")
    ap.add_argument("--dry", action="store_true", help="只校验不落盘")
    ap.add_argument("--push", action="store_true", help="合并后通过 API 推送到 Pages 分支")
    ap.add_argument("--branches", default=",".join(DEFAULT_BRANCHES),
                    help="推送目标分支，逗号分隔（默认 release,main）")
    args = ap.parse_args()

    if not args.batch and not args.all:
        ap.error("需指定批次文件或使用 --all")

    data = load_published()
    cat_by_name, pos_by_name = build_index(data)
    exist_norm = set(norm_title(q.get("title", "")) for q in data["questions"])
    next_id = max((q.get("id", 0) for q in data["questions"]), default=0) + 1

    stats = {"added": 0, "skipped": 0}
    files = []
    if args.all:
        files = sorted(os.path.join(BATCHES_DIR, f)
                       for f in os.listdir(BATCHES_DIR) if f.endswith(".json"))
    else:
        files = [args.batch]

    log("当前题库：%d 题；起始 ID=%d；批次数=%d" % (len(data["questions"]), next_id, len(files)))
    for fp in files:
        log("→ 处理 %s" % os.path.relpath(fp, ROOT))
        added, skipped = process_batch(fp, data, cat_by_name, pos_by_name,
                                       exist_norm, next_id, args.dry, stats)
        for t in added:
            log("  + 新增：%s" % t[:50])
        for s in skipped:
            log("  ! 跳过：%s" % s)

    log("统计：新增 %d，跳过 %d，校验后总计 %d 题" %
        (stats["added"], stats["skipped"], len(data["questions"])))

    if args.dry:
        log("[dry] 未写入文件。")
        return

    write_published(data)
    log("✓ 已写入 %s" % os.path.relpath(PUBLISHED, ROOT))

    if args.push:
        branches = [b.strip() for b in args.branches.split(",") if b.strip()]
        push_all(data, branches)
        regen_and_push_share_pages(stats.get("new_ids") or [], branches)
    else:
        # 本地合并（未开 --push）：也顺手生成分享页，保持工作区完整
        regen_and_push_share_pages(stats.get("new_ids") or [], [])


if __name__ == "__main__":
    main()
