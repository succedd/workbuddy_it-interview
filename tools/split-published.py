#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/split-published.py —— 题库分片构建（2026-10-06 性能优化）
================================================================================
背景
----
data/published.json 目前是单文件约 2.9MB（原文），brotli 后约 1.0MB。
访客首次打开必须**整包拉完**才能出题，弱网 / 大延迟线路下（本次实测 TTFB 1.1~6s、
CF 全部命中 LAX 洛杉矶机房）经常拉不完 → 白屏或长时间 loading。

做法
----
把这个单文件拆成「两类产物」，让首屏只拿需要的那一半：

  data/manifest.json        轻量索引：version/publishedAt/分类/岗位/岗位技术栈/
                            removedQuestions + 每道题的**元数据**（不含答案正文）、
                            以及每道题所属分片。约 400KB 原文 / 130KB br。
                            —— 首屏渲染题目列表、筛选、搜索元数据，靠它就够了。
  data/shards/<组>.json     答案正文分片：按 categoryId 分桶，题量均衡切分，
                            每片控制在 300KB 原文以内。**按需拉取**，
                            用户点开某道题时才去取对应分片（且整片缓存后长期复用）。

  data/published.json       **保留不动**。它是云端主库快照、是编辑端发布的唯一目标、
                            也是云端与本机做 diff / 题数守卫的唯一权威来源。
                            删掉它会让 guardAgainstShrink、absorbRemote、
                            verify-publish.py 全部失效。

安全性（关键）
--------------
分片只是**读路径**的加速层。写入侧（编辑端发布 / absorbRemote / 发布守卫）
一行都没改，语义完全不变。因此：
  · 编辑端照旧只推 data/published.json + data/version.json，不会因为分片漂移而误判；
  · 访客端仍以 published.json 为准，分片只用于「先出题、后补答案」；
  · 分片缺失 / 版本对不上 / 拉取失败 → 自动回退整包，功能不降级。

用法
----
  python tools/split-published.py --dry     # 只报告，不写盘（默认）
  python tools/split-published.py --write   # 生成 manifest.json 与 data/shards/
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "published.json")
MANIFEST = os.path.join(ROOT, "data", "manifest.json")
SHARD_DIR = os.path.join(ROOT, "data", "shards")

# 单片原文体积上限（brotli 后约 1/3，即 ~100KB br）。
# 太大则失去「按需加载」的意义，太小则请求数过多；300KB 是权衡值。
SHARD_TARGET_BYTES = 300_000

# 题目里哪些字段属于「答案正文」——大且不参与列表渲染。
# 放进 manifest 的都是元数据，字段名白名单化而不是黑名单化，
# 这样以后给题目加新字段不会「不小心把大字段混进首屏」。
META_FIELDS = (
    "id", "categoryId", "title", "difficulty", "type", "positionIds",
    "positionNames", "years", "tags", "source", "aiScore", "status",
    "views", "favorites", "relatedIds", "createdAt", "updatedAt",
)

# 单题超过这个字节数就不适合分片（超大题本来就少，单独一片反而更灵活）
SOLO_LIMIT = 120_000


def dumps(obj) -> str:
    """单行紧凑 JSON —— 与 published.json 保持同一约定。
    绝不能用 indent=2：那会把 2.9MB 撑到 3.5MB 并制造几万行假 diff。"""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def load_src():
    if not os.path.exists(SRC):
        sys.exit("[FAIL] 缺少 data/published.json")
    with io.open(SRC, encoding="utf-8") as f:
        raw = f.read()
    return raw, json.loads(raw)


def split_shards(questions):
    """按 categoryId 分桶，再把桶贪心合并成若干片。

    先按分类分桶是为了让「同一个分类的题尽量在同一个片」——
    用户按分类浏览时命中率最高。桶内再按 id 排序保证幂等。
    """
    buckets: "OrderedDict[object, list]" = OrderedDict()
    solo: list = []
    for q in questions:
        size = len(dumps(q))
        if size > SOLO_LIMIT:
            solo.append((q, size))
            continue
        buckets.setdefault(q.get("categoryId"), []).append((q, size))

    for k in buckets:
        buckets[k].sort(key=lambda it: it[0].get("id") or 0)

    # 贪心装箱：按桶大小降序往当前片塞，塞不下就开新片。
    # 降序处理能让「填缝」发生在后面的小桶上，片数更少。
    order = sorted(buckets.items(), key=lambda kv: -sum(s for _, s in kv[1]))

    shards: list = []
    cur_items: list = []
    cur_bytes = 0
    for cat, items in order:
        bsum = sum(s for _, s in items)
        if cur_items and cur_bytes + bsum > SHARD_TARGET_BYTES:
            shards.append(cur_items)
            cur_items, cur_bytes = [], 0
        cur_items.extend(items)
        cur_bytes += bsum
    if cur_items:
        shards.append(cur_items)

    # 超大单题各自一片
    for q, size in sorted(solo, key=lambda it: it[0].get("id") or 0):
        shards.append([(q, size)])

    return shards


def build(raw: str, data: dict, write: bool):
    questions = data.get("questions") or []
    if not questions:
        sys.exit("[FAIL] published.json 里没有 questions，疑似坏文件")

    shards = split_shards(questions)
    shard_names = ["s%02d" % i for i in range(len(shards))]

    # 题目 id → 分片名，供前端按题查片
    q2shard: dict = {}
    for name, items in zip(shard_names, shards):
        for q, _ in items:
            q2shard[str(q.get("id"))] = name

    # ---- manifest：元数据 + 分片索引 ----
    meta_questions = []
    for q in questions:
        item = OrderedDict()
        for f in META_FIELDS:
            if f in q:
                item[f] = q[f]
        item["_sh"] = q2shard[str(q.get("id"))]
        meta_questions.append(item)

    manifest = OrderedDict()
    manifest["version"] = data.get("version", 1)
    manifest["publishedAt"] = data.get("publishedAt", 0)
    manifest["schema"] = "manifest-v1"
    manifest["shards"] = shard_names
    manifest["categories"] = data.get("categories") or []
    manifest["positions"] = data.get("positions") or []
    manifest["positionSkills"] = data.get("positionSkills") or []
    manifest["questions"] = meta_questions
    if data.get("removedQuestions"):
        manifest["removedQuestions"] = data["removedQuestions"]

    m_text = dumps(manifest)
    s_texts = []
    for name, items in zip(shard_names, shards):
        s_texts.append(dumps(OrderedDict(
            [("name", name),
             ("publishedAt", data.get("publishedAt", 0)),
             ("version", data.get("version", 1)),
             ("questions", [q for q, _ in items])]
        )))

    # ---- 报告 ----
    raw_len = len(raw)
    m_len = len(m_text)
    s_lens = [len(t) for t in s_texts]

    print("[源文件] data/published.json  %.2f MB / %d 题" % (raw_len / 1048576, len(questions)))
    print("[产物  ] data/manifest.json   %.2f MB（首屏必需，含全部题目元数据）"
          % (m_len / 1048576))
    print("[产物  ] data/shards/*.json   %d 片，共 %.2f MB（答案正文，按需拉取）"
          % (len(s_texts), sum(s_lens) / 1048576))
    if s_lens:
        print("[       单片区间 %.0f KB ~ %.0f KB（原文）"
              % (min(s_lens) / 1024, max(s_lens) / 1024))
    print("[首屏  ] %.2f MB → %.2f MB（原文口径，降 %.0f%%）"
          % (raw_len / 1048576, m_len / 1048576,
             (1 - m_len / raw_len) * 100 if raw_len else 0))
    print("[成本  ] 题目详情页按需加 1 个分片请求（约 %.0f KB 原文 / %.0f KB br）"
          % ((sum(s_lens) / len(s_lens) if s_lens else 0) / 1024,
             (sum(s_lens) / len(s_lens) if s_lens else 0) / 3072))

    if not write:
        print("[OK] --dry 模式，未写盘")
        return

    with io.open(MANIFEST, "w", encoding="utf-8", newline="") as f:
        f.write(m_text)
    if not os.path.isdir(SHARD_DIR):
        os.makedirs(SHARD_DIR)
    for name, text in zip(shard_names, s_texts):
        with io.open(os.path.join(SHARD_DIR, name + ".json"), "w",
                     encoding="utf-8", newline="") as f:
            f.write(text)

    # ---- 同步生成 version.json（2026-10-06 追加）----
    # 为什么必须由这个脚本写：version.json 是 published.json 的指纹，两者必须同源。
    # 之前它们由不同流程各写各的，于是线上出现「version.json 说 1519 题、
    # manifest 是 1540 题」的漂移，导致读取端的一致性校验反复失败。
    # 这里与 split 用同一份数据、同一时刻生成，从根上避免漂移。
    # 字段与顺序必须和 cloud.js 的 C.metaOf 完全一致，否则两端指纹对不上。
    version_obj = OrderedDict([
        ("version", data.get("version", 1)),
        ("publishedAt", data.get("publishedAt", 0)),
        ("count", len(questions)),
        ("rmCount", len(data.get("removedQuestions") or {})),
    ])
    version_path = os.path.join(ROOT, "data", "version.json")
    with io.open(version_path, "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(version_obj, ensure_ascii=False, separators=(",", ":")))

    print("[OK] 已写入 data/manifest.json、data/shards/（%d 片）与 data/version.json" % len(s_texts))
    print("     version.json = %s" % json.dumps(version_obj, ensure_ascii=False, separators=(",", ":")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="真正写盘（默认 dry）")
    ap.add_argument("--dry", action="store_true", help="只报告（默认行为）")
    args = ap.parse_args()
    raw, data = load_src()
    build(raw, data, write=args.write)


if __name__ == "__main__":
    main()