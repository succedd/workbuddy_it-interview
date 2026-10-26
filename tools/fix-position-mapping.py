#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
tools/fix-position-mapping.py —— 修复「题目 × 岗位」关联中的已确认错配

背景
----
站点早期批量导入时，一批后端/数据库/云原生方向的题目被挂到了
「硬件工程师 / FPGA工程师 / 网络工程师 / 路由交换工程师」上，导致：

  · 岗位页出现与岗位完全无关的题目（如 Java GC 出现在硬件工程师下）
  · 同一题的 positionNames 出现重复项（多个岗位 id 指向同名岗位）
  · 部分岗位（如 #142 公有云售后技术支持）有题却没有任何技术栈

本脚本只做**可判定**的修复，不猜测边界情况：
  1. 只对白名单里的技术分类（Java / MySQL / Redis / Docker / Kubernetes /
     Spring Boot / Kafka）判定「挂到硬件·FPGA·路由交换 = 错配」。
     其余分类（如计算机网络、计算机组成原理）保持原样 —— 那些关联是合理的。
  2. 错配岗位一律摘除；摘除后若该题已无任何「方向相关」岗位，则补挂默认岗位。
  3. positionIds 去重，positionNames 按 id 重新生成并去重（保留顺序）。
  4. 补齐 #142 公有云售后技术支持 的技术栈（此前为空）。
  5. 修正岗位描述里已确认的拼写：EVA/AS/Azure → EVA/AWS/Azure、Kubemetes → Kubernetes。

用法
----
    python tools/fix-position-mapping.py            # 只检查（dry-run，打印将要改什么）
    python tools/fix-position-mapping.py --write    # 写回 data/published.json

⚠️ 改完 published.json 后，按仓库约定还要跑：
    python tools/split-published.py --write     # 重新分片 + manifest
    node   tools/gen-share-pages.js             # 重新生成静态分享页
"""

import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "published.json")

# 这些岗位与技术分类的组合 = 已确认错配（人工复核过样本）
BANNED_POSITIONS = ["硬件工程师", "FPGA工程师", "网络工程师", "路由交换工程师"]

# 分类名 -> (摘除后补挂的默认岗位, 视为「方向相关」的岗位集合)
# 只要题目还挂着相关集合里任意一个岗位，就不补挂，避免把题目硬塞到不相关岗位。
RULES = {
    "Java": (
        ["Java开发工程师", "Java后端工程师"],
        {"软件开发工程师(通用)", "Java开发工程师", "后端开发工程师", "Java后端工程师",
         "后端架构师", "全栈工程师", "Go后端工程师", "Python后端工程师"},
    ),
    "MySQL": (
        ["数据库工程师", "DBA数据库管理员", "数据库开发工程师"],
        {"数据库工程师", "DBA数据库管理员", "数据库开发工程师", "数据库架构师",
         "后端开发工程师", "Java开发工程师", "Java后端工程师", "后端架构师",
         "系统运维工程师", "Linux运维工程师"},
    ),
    "Redis": (
        ["DBA数据库管理员", "后端开发工程师", "Java后端工程师"],
        {"DBA数据库管理员", "数据库工程师", "数据库架构师", "后端开发工程师",
         "Java开发工程师", "Java后端工程师", "Go后端工程师", "后端架构师",
         "系统运维工程师", "SRE站点可靠性工程师"},
    ),
    "Docker": (
        ["系统运维工程师", "云计算工程师", "DevOps工程师"],
        {"系统运维工程师", "Linux运维工程师", "IT运维工程师", "云计算工程师",
         "云资源运维工程师", "DevOps工程师", "SRE站点可靠性工程师",
         "Java后端工程师", "Go后端工程师"},
    ),
    "Kubernetes": (
        ["系统运维工程师", "云计算工程师", "DevOps工程师"],
        {"系统运维工程师", "Linux运维工程师", "IT运维工程师", "云计算工程师",
         "云资源运维工程师", "DevOps工程师", "SRE站点可靠性工程师",
         "Java后端工程师", "Go后端工程师", "公有云售后技术支持", "技术型项目经理"},
    ),
    "Spring Boot": (
        ["Java开发工程师", "Java后端工程师"],
        {"Java开发工程师", "后端开发工程师", "Java后端工程师", "后端架构师",
         "全栈工程师", "软件开发工程师(通用)"},
    ),
    "Kafka": (
        ["大数据工程师", "后端开发工程师", "Java后端工程师"],
        {"大数据工程师", "大数据开发工程师", "实时计算工程师", "后端开发工程师",
         "Java开发工程师", "Java后端工程师", "Go后端工程师", "后端架构师",
         "DevOps工程师"},
    ),
}

# #142 公有云售后技术支持：此前有 100+ 题但技术栈为 0，按 JD 补齐
POSITION_142_SKILLS = [
    # (技术名, 星级, 掌握深度, 是否必考)
    ("腾讯云", 4, "熟悉", True),
    ("Linux操作系统", 4, "熟悉", True),
    ("网络基础", 4, "熟悉", True),
    ("Kubernetes", 3, "熟悉", True),
    ("Prometheus", 3, "熟悉", True),
    ("GPU", 3, "了解", False),
]

# 已确认的拼写错误（岗位描述 / 题目备注里从 JD 抄进来的原文）
TYPO_FIXES = [
    ("EVA/AS/Azure", "EVA/AWS/Azure"),
    ("Kubemetes", "Kubernetes"),
    ("昙备", "具备"),
]


def main():
    write = "--write" in sys.argv
    with io.open(DATA, encoding="utf-8") as f:
        d = json.load(f)

    questions = d.get("questions", [])
    positions = d.get("positions", [])
    categories = d.get("categories", [])
    skills = list(d.get("positionSkills", []))

    pos_by_id = {p["id"]: p for p in positions}
    pos_by_name = {}
    for p in positions:
        pos_by_name.setdefault(p["name"], []).append(p["id"])
    cat_by_id = {c["id"]: c["name"] for c in categories}
    cat_by_name = {c["name"]: c["id"] for c in categories}

    now = int(os.environ.get("NOW_MS") or 0)
    if not now:
        import time
        now = int(time.time() * 1000)

    changed = []
    for q in questions:
        cat = cat_by_id.get(q.get("categoryId"), "")
        if cat not in RULES:
            continue
        defaults, relevant = RULES[cat]
        original = list(q.get("positionIds") or [])
        ids = [i for i in original
               if pos_by_id.get(i, {}).get("name") not in BANNED_POSITIONS]
        if not any(pos_by_id.get(i, {}).get("name") in relevant for i in ids):
            for name in defaults:
                if pos_by_name.get(name):
                    ids.append(pos_by_name[name][0])
                    break
        ids = list(dict.fromkeys(ids))                     # 岗位 id 去重
        names = list(dict.fromkeys(                        # 显示名去重（保留顺序）
            pos_by_id[i]["name"] for i in ids if i in pos_by_id))
        if ids != original or names != (q.get("positionNames") or []):
            changed.append({
                "id": q["id"], "category": cat,
                "before": [pos_by_id.get(i, {}).get("name") for i in original],
                "after": names,
            })
            if write:
                q["positionIds"] = ids
                q["positionNames"] = names
                q["updatedAt"] = now

    # 岗位描述 / 题目备注里的拼写
    typo_hits = []
    for p in positions:
        desc = p.get("description") or ""
        fixed = desc
        for a, b in TYPO_FIXES:
            fixed = fixed.replace(a, b)
        if fixed != desc:
            typo_hits.append(("position", p["id"], p["name"]))
            if write:
                p["description"] = fixed
    for q in questions:
        remark = q.get("remark") or ""
        fixed = remark
        for a, b in TYPO_FIXES:
            fixed = fixed.replace(a, b)
        if fixed != remark:
            typo_hits.append(("question", q["id"], (q.get("title") or "")[:30]))
            if write:
                q["remark"] = fixed

    # 补齐 #142 技术栈
    if not any(s.get("positionId") == 142 for s in skills):
        next_id = max([s.get("id", 0) for s in skills] or [0]) + 1
        for tech, stars, depth, required in POSITION_142_SKILLS:
            skills.append({
                "id": next_id, "positionId": 142,
                "categoryId": cat_by_name.get(tech),
                "techName": tech, "stars": stars, "depth": depth, "required": required,
            })
            next_id += 1
        if write:
            d["positionSkills"] = skills

    print("MODE            : %s" % ("写入" if write else "只检查"))
    print("岗位错配修复     : %d 题" % len(changed))
    for c in changed:
        print("   #%-5s %-12s %s → %s" % (c["id"], c["category"], c["before"], c["after"]))
    print("拼写修复         : %d 处" % len(typo_hits))
    for t in typo_hits[:15]:
        print("   %s #%s %s" % t)
    print("#142 技术栈      : %d → %d" % (
        sum(1 for s in d.get("positionSkills", []) if s.get("positionId") == 142),
        sum(1 for s in skills if s.get("positionId") == 142)))

    if not write:
        print("\n（dry-run，未写盘。加 --write 才会修改 data/published.json）")
        return

    d["publishedAt"] = now
    with io.open(DATA, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
    print("\n已写入 %s" % DATA)


if __name__ == "__main__":
    main()
