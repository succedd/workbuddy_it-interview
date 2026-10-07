#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
tools/build-home-snap.py —— 把「首页渲染所需数据」内联进 index.html

⛔⛔⛔ **2026-10-07 结论：此方案已验证不划算，保留代码仅作记录，勿启用！** ⛔⛔⛔
实施后实测：快照注入使 index.html 从 13KB 膨胀到 379KB，而 HTML 是浏览器
**第一个**到达的资源——FCP 反而从约 1.5s 恶化到 7.7s。
更根本的：首屏渲染依赖 app.js（bundle 260KB br），快照只省掉 manifest 的 123KB br
（约 8% 总传输），却让首包膨胀 37 倍，纯属净伤害。
首访传输的硬底线 = bundle(260KB br) + manifest(123KB br) ≈ 383KB br，
再想快只能换线路（Argo / 国内 CDN），或等 app.js 拆分（需先建 E2E）。

为什么需要（2026-10-07 实测驱动）
--------------------------------
限速实测首访的启动阶段分布：脚本加载 4.5s、**云端同步（拉 manifest + 写 1561 题
入库）6.2s**，首屏要 11.8s 才出现内容。而 HTML 是浏览器**最先**拿到的资源——
把首页数据直接内联进去，页面可以**不等任何 JS 与网络同步**就渲染出真实内容，
同步全部挪到后台。

快照体积约 250KB 原文（br 约 50KB），换来的是：首访体感从「转圈十几秒」
变成「1~2 秒看到完整首页」；**离线首访也能看题库列表**（HTML 从 SW 缓存出，快照就在里面）。

快照的 questions 是**精简版**（无 body/answer，带 _sh 分片号）：
  · 列表/统计/侧栏只需要元数据；
  · 详情页的题干与答案由既有的 ensureQuestionBody 按分片懒加载补齐；
  · 后台同步完成后 Services.reload() 会用完整数据替换。

用法
----
    python tools/build-home-snap.py --write    # 生成快照并注入 index.html

⚠️ 与 split-published.py / bundle-js.py 同一套约定：**题库变更后必须重跑**，
   否则线上首屏展示的是旧数据（后台同步会纠正，但首屏会先闪一下旧内容）。
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISHED = os.path.join(ROOT, "data", "published.json")
MANIFEST = os.path.join(ROOT, "data", "manifest.json")
INDEX = os.path.join(ROOT, "index.html")

OPEN_MARK = '<script type="application/json" id="HOME_SNAP">'
CLOSE_MARK = "</script>"

# 快照里 questions 的编码：**列式**（字段表 + 行数组）。
# 对象式编码会把 "title": 这类键名重复 1561 遍（实测键名开销 265KB，比数据本身还大）；
# 列式把键名只存一次，questions 从 592KB 降到约 270KB。
# status / type / positionIds 不进快照：adoptSnapshot 会补默认值，
# 详情页完整字段由分片懒加载 / 后台同步补齐。
Q_FIELDS = [
    "id", "categoryId", "title", "difficulty",
    "views", "favorites", "aiScore", "tags", "updatedAt", "_sh",
]


def pick(obj, fields):
    out = {}
    for k in fields:
        if k in obj and obj[k] is not None:
            out[k] = obj[k]
    return out


def compact_question(q, sh_map):
    """产出与 Q_FIELDS 对齐的「行数组」（列式编码，见 Q_FIELDS 注释）"""
    row = []
    for k in Q_FIELDS:
        v = q.get(k)
        row.append(v if v is not None else ("" if k == "_sh" else (0 if k in ("views","favorites","aiScore","categoryId","id") else "")))
    return row


CAT_FIELDS = ["id", "parentId", "name", "icon", "era", "sort", "depth", "status"]
POS_FIELDS = ["id", "name", "stage", "tag", "category", "direction", "demand", "sort", "status"]
SKILL_FIELDS = ["positionId", "categoryId", "techName", "stars", "depth", "required"]


def pick(obj, fields):
    out = {}
    for k in fields:
        if k in obj and obj[k] is not None:
            out[k] = obj[k]
    return out


def json_for_inline(obj):
    """内联进 <script type="application/json"> 的安全序列化。
    必须把 </ 转义掉：JSON 正文若出现 </script> 会提前终止标签。"""
    t = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return t.replace("</", "<\\/")


def main():
    write = "--write" in sys.argv

    pub = json.load(io.open(PUBLISHED, encoding="utf-8"))
    man = json.load(io.open(MANIFEST, encoding="utf-8"))

    # id -> 分片号（manifest 生成时给每题标了 _sh）
    sh_map = {}
    for q in man.get("questions", []):
        if q.get("_sh"):
            sh_map[q["id"]] = q["_sh"]

    questions = []
    for q in pub.get("questions", []):
        if (q.get("status") or "published") != "published":
            continue
        questions.append(compact_question(q, sh_map))

    snap = {
        "generatedAt": pub.get("publishedAt", 0),
        "categories": [pick(c, CAT_FIELDS) for c in pub.get("categories", [])],
        "positions": [pick(p, POS_FIELDS) for p in pub.get("positions", [])],
        "positionSkills": [pick(s, SKILL_FIELDS) for s in pub.get("positionSkills", [])],
        "questions": questions,
    }
    text = json_for_inline(snap)

    html = io.open(INDEX, encoding="utf-8", newline="").read()
    block = OPEN_MARK + text + CLOSE_MARK

    if OPEN_MARK in html:
        # 替换旧快照
        pat = re.compile(re.escape(OPEN_MARK) + ".*?" + re.escape(CLOSE_MARK), re.S)
        new_html = pat.sub(lambda _: block, html, count=1)
        action = "已替换旧快照"
    else:
        # 插在 </body> 之前（越早被解析越好，放 body 末尾不影响首屏样式加载）
        idx = html.rindex("</body>")
        new_html = html[:idx] + block + "\n" + html[idx:]
        action = "已注入新快照"

    size = len(text.encode("utf-8"))
    print("  快照：categories %d / positions %d / skills %d / questions %d"
          % (len(snap["categories"]), len(snap["positions"]),
             len(snap["positionSkills"]), len(snap["questions"])))
    print("  体积：%0.1f KB 原文（brotli 后预计约 %0.0f KB）"
          % (size / 1024.0, size * 0.2 / 1024.0))

    if not write:
        print("（预览模式，未写入。加 --write 注入 index.html）")
        return 0

    io.open(INDEX, "w", encoding="utf-8", newline="").write(new_html)
    print("[OK] %s 到 index.html" % action)
    return 0


if __name__ == "__main__":
    sys.exit(main())
