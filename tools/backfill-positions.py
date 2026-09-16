# -*- coding: utf-8 -*-
"""
给「无岗位关联」的题回填相关岗位。

策略（并集，宁全勿窄）：
  - HR/软技能类：只用主流岗位集合 GENERIC（不做并集，避免被绑到某个具体技术岗）
  - 其他分类   ：人工映射表 MAP  ∪  positionSkills（岗位<->技术分类 权威表）
只写 positionIds / positionNames 两个字段，不改动题目其他任何内容。

用法：
  python tools/backfill-positions.py --dry    预览
  python tools/backfill-positions.py --apply  落盘
"""
import io, json, sys, argparse
from collections import defaultdict

DATA = "data/published.json"

# HR / 软技能：全岗通用，绑定到覆盖各方向的主流岗位
GENERIC = [
    "软件开发工程师(通用)", "前端开发工程师", "后端开发工程师", "算法工程师",
    "测试工程师", "大数据工程师", "嵌入式软件工程师", "网络工程师",
    "云计算工程师", "技术经理",
]

# 只用 GENERIC、不参与并集的分类
HR_CATS = [
    "常见HR面试题", "自我介绍技巧", "职业规划问答", "冲突处理",
    "薪资谈判", "通用面试能力与软技能",
]

MAP = {
    # --- 具体技术 ---
    "C++": ["C/C++开发工程师", "系统软件工程师", "游戏客户端工程师"],
    "C语言": ["C/C++开发工程师", "嵌入式软件工程师", "系统软件工程师"],
    "C#": [".NET开发工程师", "游戏客户端工程师"],
    "Go": ["Go开发工程师", "Go后端工程师", "后端开发工程师"],
    "Rust": ["C/C++开发工程师", "系统软件工程师", "新兴方向工程师"],
    "TypeScript": ["前端开发工程师", "HTML/CSS/JS工程师", "Web全栈工程师"],
    "Kafka数据": ["大数据工程师", "大数据开发工程师", "实时计算工程师"],
    "分布式锁": ["后端开发工程师", "后端架构师", "Java后端工程师", "Go后端工程师"],
    "分布式缓存": ["后端开发工程师", "后端架构师", "数据库工程师"],
    "嵌入式C开发": ["嵌入式软件工程师", "嵌入式与物联网工程师", "固件工程师", "驱动开发工程师"],
    "SQL注入": ["信息安全工程师", "安全开发工程师", "渗透测试工程师", "后端开发工程师"],
    "CSRF跨站请求伪造": ["信息安全工程师", "安全开发工程师", "前端开发工程师", "Web全栈工程师"],
    "Web安全": ["信息安全工程师", "安全开发工程师", "后端开发工程师", "Web全栈工程师"],
    "网络安全基础": ["网络工程师", "网络运维工程师", "信息安全工程师"],
    "Socket编程": ["网络工程师", "C/C++开发工程师", "后端开发工程师"],
    "机器学习基础": ["算法工程师", "机器学习工程师", "深度学习工程师"],
    "数学基础": ["算法工程师", "机器学习工程师", "数据科学家"],
    "离散数学": ["算法工程师", "机器学习工程师", "数据科学家"],
    "Git版本控制": ["软件开发工程师(通用)", "后端开发工程师", "前端开发工程师", "DevOps工程师"],
    "重构技巧": ["软件开发工程师(通用)", "后端开发工程师", "应用架构师"],
    "测试理论基础": ["测试工程师", "功能测试工程师", "自动化测试工程师"],
    "产品与项目管理": ["技术型项目经理", "技术经理", "互联网产品经理"],

    # --- 大领域（绑该领域核心岗位）---
    "计算机网络基础": ["网络工程师", "网络规划工程师", "网络架构师", "后端开发工程师"],
    "计算机网络与协议": ["网络工程师", "网络规划工程师", "网络架构师", "后端开发工程师"],
    "前端基础": ["前端开发工程师", "HTML/CSS/JS工程师", "页面重构工程师"],
    "Web前端开发": ["前端开发工程师", "前端架构师", "Web全栈工程师"],
    "后端开发与服务端框架": ["后端开发工程师", "Java后端工程师", "后端架构师", "Python后端工程师"],
    "数据库与数据存储": ["数据库工程师", "DBA数据库管理员", "数据库开发工程师", "后端开发工程师"],
    "关系型数据库": ["数据库工程师", "DBA数据库管理员", "数据库开发工程师", "后端开发工程师"],
    "SQL基础": ["数据库工程师", "数据库开发工程师", "后端开发工程师"],
    "非关系型数据库": ["数据库工程师", "后端开发工程师", "大数据工程师"],
    "操作系统与系统运维": ["系统软件工程师", "操作系统开发工程师", "Linux运维工程师", "系统运维工程师"],
    "软件工程与设计模式": ["软件开发工程师(通用)", "后端开发工程师", "应用架构师"],
    "软件测试": ["测试工程师", "自动化测试工程师", "性能测试工程师", "测试开发工程师"],
    "分布式系统与微服务": ["后端架构师", "后端开发工程师", "架构师", "云架构师"],
    "云原生与DevOps": ["云计算工程师", "云平台开发工程师", "DevOps工程师", "SRE站点可靠性工程师"],
    "大数据与数据工程": ["大数据工程师", "数据仓库工程师", "大数据架构师", "大数据开发工程师"],
    "人工智能与机器学习": ["算法工程师", "机器学习工程师", "AI应用开发工程师", "深度学习工程师"],
    "信息安全与网络安全": ["信息安全工程师", "安全运营工程师SOC", "网络工程师", "安全架构师"],
    "移动端与跨平台开发": ["移动端开发工程师", "iOS开发工程师", "Android开发工程师", "Flutter开发工程师"],
    "游戏开发与图形图像": ["游戏开发工程师", "游戏客户端工程师", "Unity游戏开发工程师", "游戏引擎工程师"],
    "嵌入式与物联网": ["嵌入式与物联网工程师", "嵌入式软件工程师", "IoT开发工程师", "边缘计算工程师"],
    "音视频与流媒体": ["音视频与流媒体工程师", "音视频开发工程师", "WebRTC工程师", "流媒体架构师"],
    "区块链与Web3": ["区块链工程师", "智能合约开发工程师", "Web3开发工程师", "区块链后端工程师"],
    "计算机组成原理": ["硬件工程师", "系统软件工程师", "嵌入式软件工程师"],
    "编译原理": ["编译器工程师", "系统软件工程师"],
    "计算机科学基础": ["软件开发工程师(通用)", "系统软件工程师"],
    "编程语言与编程基础": ["软件开发工程师(通用)"],
}
MAP.update({k: GENERIC for k in HR_CATS})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    if not (a.dry or a.apply):
        print("需指定 --dry 或 --apply"); sys.exit(1)

    d = json.load(io.open(DATA, encoding="utf-8"))
    qs = d["questions"]
    positions = d["positions"]
    ps = d.get("positionSkills") or []
    cats = d.get("categories") or []

    pname = {p["id"]: p["name"] for p in positions}
    name2id = {p["name"]: p["id"] for p in positions}
    cname = {c["id"]: c["name"] for c in cats}

    cat2pos = defaultdict(set)
    for s in ps:
        if s.get("categoryId") is not None and s.get("positionId") is not None:
            cat2pos[s["categoryId"]].add(s["positionId"])

    missing = sorted({n for v in MAP.values() for n in v if n not in name2id})
    if missing:
        print("!! 映射表中岗位名不存在，请先修正：", missing); sys.exit(1)

    nop = [q for q in qs if not (q.get("positionIds") or [])]
    plan, skipped = [], []
    for q in nop:
        cid = q.get("categoryId")
        nm = cname.get(cid)
        ids = set(name2id[n] for n in MAP.get(nm, []))
        src = "映射表"
        # 非 HR 分类才吸收 positionSkills
        if nm not in HR_CATS and cid in cat2pos:
            ids |= cat2pos[cid]
        if not ids:
            skipped.append((q["id"], nm)); continue
        plan.append((q, sorted(ids), src))

    print("无岗位题总数: %d" % len(nop))
    print("  合计将回填  : %d" % len(plan))
    print("  未命中(跳过): %d %s" % (len(skipped), skipped[:10]))
    print("  平均每题岗位数: %.1f" % (sum(len(i) for _, i, _ in plan) / max(1, len(plan))))

    print("\n=== 按分类聚合预览（每类 1 题代表）===")
    seen = {}
    for q, ids, src in plan:
        nm = cname.get(q.get("categoryId"))
        if nm in seen: continue
        seen[nm] = 1
        print("  %-20s -> %s" % (str(nm)[:20], "、".join(pname[i] for i in ids)[:78]))

    if a.dry:
        print("\n[dry-run] 未写盘"); return

    for q, ids, src in plan:
        q["positionIds"] = ids
        q["positionNames"] = [pname[i] for i in ids]

    # ---- 第二步：全库 positionIds / positionNames 对齐（修历史脏数据）----
    # 规则：ids = ids ∪ {names 中能反查到 id 的岗位}；names 由 ids 重算
    # 修两类历史 bug：A 有 ids 无 names（详情页岗位标签不显示）、
    #                 C 两边不等（names 里混进分类名等脏值）
    name2ids = defaultdict(list)
    for p in positions:
        name2ids[p["name"]].append(p["id"])
    fixed_a = fixed_c = 0
    for q in qs:
        ids = list(q.get("positionIds") or [])
        names = list(q.get("positionNames") or [])
        exp = [pname.get(i) for i in ids]
        if exp == names:
            continue
        if ids and not names:
            fixed_a += 1
        else:
            fixed_c += 1
        idset = set(ids)
        for n in names:
            cands = name2ids.get(n) or []
            # 该岗位名对应的 id 若已在 ids 中（重名岗位如「公有云售后技术支持」），不重复加
            if cands and not (idset & set(cands)):
                idset.add(cands[0])
        new_ids = sorted(idset)
        q["positionIds"] = new_ids
        q["positionNames"] = [pname.get(i) for i in new_ids]
    print("规范化：补 names(A 类) %d 题，纠正不一致(C 类) %d 题" % (fixed_a, fixed_c))

    # 仅在确有改动时提升 version
    if plan or fixed_a or fixed_c:
        d["version"] = (d.get("version") or 0) + 1
    # 与仓库原有格式保持一致：单行紧凑 JSON、无末尾换行。
    # 切勿改 indent 美化——会把 1.5MB 的文件撑到 1.8MB 并制造数万行假 diff。
    io.open(DATA, "w", encoding="utf-8", newline="").write(
        json.dumps(d, ensure_ascii=False, separators=(",", ":")))

    chk = json.load(io.open(DATA, encoding="utf-8"))
    left = sum(1 for q in chk["questions"] if not (q.get("positionIds") or []))
    print("\n已落盘：回填 %d 题，version %s" % (len(plan), chk["version"]))
    print("剩余无岗位题: %d / %d" % (left, len(chk["questions"])))


if __name__ == "__main__":
    main()
