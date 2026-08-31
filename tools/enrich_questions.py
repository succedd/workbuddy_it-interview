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
MARKER = os.path.join(ROOT, "tools", ".last-new-ids.json")
TOPICS = os.path.join(ROOT, "tools", "classic-topics.json")

# 轮转域 → 推荐来源（与 tools/intake-plan.md 轮转表对应，供 --next 输出）
DOMAIN_SOURCES = {
    "计算机科学基础": "https://github.com/CyC2018/CS-Notes",
    "编程语言与编程基础": "https://github.com/Snailclimb/JavaGuide",
    "数据库与数据存储": "https://www.xiaolincoding.com",
    "操作系统与系统运维": "https://www.xiaolincoding.com",
    "计算机网络与协议": "https://www.xiaolincoding.com",
    "Web前端开发": "https://developer.mozilla.org/zh-CN/",
    "后端开发与服务端框架": "https://github.com/Snailclimb/JavaGuide",
    "软件工程与设计模式": "https://github.com/Snailclimb/JavaGuide",
    "分布式系统与微服务": "https://tech.meituan.com/",
    "云原生与DevOps": "https://kubernetes.io/zh-cn/docs/home/",
    "信息安全与网络安全": "https://owasp.org/",
    "移动端与跨平台开发": "https://developer.android.com/guide",
}

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


# ==================== 质量闸门（2026-08-31 新增） ====================
# 闸门 1：来源 URL 可达性 —— 404/410 直接拒；网络异常/反爬降级放行，绝不因抖动卡死流水线
# 闸门 2：答案结构 —— 只拦「又短又没条理」和「纯代码充数」，不干涉格式自由
# 闸门 3：抽检回测 —— 独立脚本 tools/audit-sample.py，不在此处执行
#
# 阈值由存量 346 题实测标定：要点<2 且有效文字<200 时误伤率 3.8%，
# 且命中的确实是 56~190 字的敷衍答案。只认 markdown 列表项会误伤 41%（存量主流是
# 「**要点**：」加粗分段），故列表/加粗/小标题三种形式都计入要点。

MIN_STRUCT_POINTS = int(os.environ.get("MIN_STRUCT_POINTS") or "2")
STRUCT_PLAIN_TH = int(os.environ.get("STRUCT_PLAIN_TH") or "200")
CODE_RATIO_TH = float(os.environ.get("CODE_RATIO_TH") or "0.7")
CODE_PLAIN_TH = int(os.environ.get("CODE_PLAIN_TH") or "80")

# 来源占位符（存量题大量使用：seed/manual/principles/ai），非 URL 时只告警
# 自动化子进程常不继承 https_proxy，故以项目既定本机代理兜底
DEFAULT_PROXY = os.environ.get("ITI_PROXY") or "http://127.0.0.1:7897"
NET_CHECK = os.environ.get("SKIP_NET_CHECK") != "1"
STRICT_SOURCE = os.environ.get("STRICT_SOURCE") == "1"

RE_BULLET = re.compile(r"^([-*+]|\d+[.、)]|[一二三四五六七八九十]+[、.]"
                       r"|[①②③④⑤⑥⑦⑧⑨⑩]|第[一二三四五六七八九十]+[、章])\s")
RE_BOLD_HEAD = re.compile(r"^\*\*[^*]{1,24}\*\*\s*[：:]")
RE_MD_HEAD = re.compile(r"^#{1,4}\s")

_net_cache = {}


def struct_points(answer):
    """统计答案的结构化要点行数（加粗分段 / 列表项 / 小标题）。"""
    n = 0
    for line in answer.split("\n"):
        s = line.strip()
        if not s:
            continue
        if RE_BULLET.match(s) or RE_BOLD_HEAD.match(s) or RE_MD_HEAD.match(s):
            n += 1
    return n


def plain_len(answer):
    """去掉代码块与 markdown 记号后的有效文字长度。"""
    return len(re.sub(r"```[\s\S]*?```|[#>*`\-|]", " ", answer).strip())


def code_ratio(answer):
    blocks = re.findall(r"```[\s\S]*?```", answer)
    if not answer or not blocks:
        return 0.0
    return sum(len(b) for b in blocks) / len(answer)


def check_answer_structure(answer, title):
    """闸门 2：答案结构。拦「又短又没条理」+「纯代码充数」。"""
    pl = plain_len(answer)
    pts = struct_points(answer)
    if pts < MIN_STRUCT_POINTS and pl < STRUCT_PLAIN_TH:
        raise ValueError(
            "答案缺乏结构化要点（要点 %d 个 < %d，有效文字 %d 字 < %d）：%s"
            % (pts, MIN_STRUCT_POINTS, pl, STRUCT_PLAIN_TH, title[:40]))
    if code_ratio(answer) > CODE_RATIO_TH and pl < CODE_PLAIN_TH:
        raise ValueError(
            "答案几乎全是代码、缺少讲解（代码块占比 > %.0f%%，讲解仅 %d 字）：%s"
            % (CODE_RATIO_TH * 100, pl, title[:40]))


def _proxy():
    """取 curl 代理参数。

    注意：本脚本常在自动化环境里跑，子进程不一定继承 https_proxy（实测为 None，
    直连返回 000）。故以项目既定的本机代理 7897 作为兜底，可用 ITI_PROXY 覆盖。
    """
    p = (os.environ.get("ITI_PROXY")
         or os.environ.get("https_proxy")
         or os.environ.get("HTTPS_PROXY")
         or DEFAULT_PROXY)
    return ["-x", p] if p else []


def _curl_status(url):
    """用 curl 取 HTTP 状态码，失败返回 0。

    必须用 curl 而非 urllib：urllib 走本机代理访问部分站点会返回异常状态码
    （实测华为云文档全线 567），会制造大量假阳性把流水线卡死。
    """
    import tempfile
    proxy = _proxy()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".out")
    tmp.close()
    try:
        cmd = ["curl", "-s", "-L", "--max-time", "12", "-o", tmp.name,
               "-w", "%{http_code}", "-A",
               "Mozilla/5.0 (Windows NT 10.0; Win64; x64) it-interview-bot"]
        cmd += proxy   # _proxy() 已返回 ["-x", <url>] 或 []
        cmd.append(url)
        out = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                             timeout=25, text=True)
        code = (out.stdout or "").strip()
        return int(code) if code.isdigit() else 0
    except Exception:
        return 0
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def check_source(source, title):
    """闸门 1：来源校验。URL 失活（404/410）直接拒；占位符或网络异常只告警。"""
    src = (source or "").strip()
    if not re.match(r"^https?://", src, re.I):
        msg = "来源不是可溯源 URL（%s）：%s" % (src or "空", title[:40])
        if STRICT_SOURCE:
            raise ValueError(msg + " —— STRICT_SOURCE=1，已拒绝")
        log("  ! " + msg + "（设 STRICT_SOURCE=1 可改为拒绝）")
        return
    if not NET_CHECK:
        return
    if src not in _net_cache:
        _net_cache[src] = _curl_status(src)
    code = _net_cache[src]
    if code in (404, 410):
        raise ValueError("来源 URL 已失效（HTTP %s）：%s —— %s"
                         % (code, src[:70], title[:36]))
    if code == 0:
        log("  ! 来源可达性探测失败，放行：%s" % src[:70])
    elif code >= 400:
        log("  ! 来源返回 HTTP %s（多为反爬/需登录），放行：%s" % (code, src[:70]))


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

    # ---- 质检闸门：答案有效内容过短 / 引用不存在的本地图片，直接拒绝 ----
    if len(re.sub(r"```[\s\S]*?```|[#>*`\-\|]", " ", answer).strip()) < 30:
        raise ValueError("参考答案过短（有效内容 < 30 字）：%s" % title[:40])
    for m in re.finditer(r"!\[[^\]]*\]\(([^)\s]+)[^)]*\)|<img[^>]+src=[\"']([^\"']+)[\"']", body + "\n" + answer):
        src = m.group(1) or m.group(2)
        if not src or re.match(r"^(https?:|data:)", src, re.I):
            continue
        rel = src.lstrip("/").split("?")[0]
        if not os.path.exists(os.path.join(ROOT, rel)):
            raise ValueError("引用的本地图片不存在（%s）：%s" % (src, title[:40]))

    # ---- 质检闸门（2026-08-31 新增）：来源可达性 + 答案结构 ----
    check_source(source, title)
    check_answer_structure(answer, title)

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
    added_objs = []
    for item in batch.get("questions", []):
        try:
            q = build_question(item, next_id, int(time.time() * 1000),
                               cat_by_name, pos_by_name, exist_norm)
            if not dry:
                data["questions"].append(q)
                exist_norm.add(norm_title(q["title"]))
            added.append(q["title"])
            added_objs.append(q)
            stats.setdefault("new_ids", []).append(q["id"])
            stats.setdefault("added_meta", []).append((q["difficulty"], q["type"]))
            next_id += 1
        except ValueError as e:
            skipped.append(str(e))
            stats["skipped"] += 1
    # 追问链：chain 批次内的题互相关联（relatedIds 指向同批其他题），详情页「相关题」直接成链
    if batch.get("chain") and len(added_objs) >= 2:
        for q in added_objs:
            q["relatedIds"] = [x["id"] for x in added_objs if x["id"] != q["id"]]
    stats["added"] += len(added)
    return added, skipped


def quota_warnings(stats):
    """软性配额提醒：题型/难度过度单一时提示，不阻断。"""
    meta = stats.get("added_meta") or []
    if len(meta) < 3:
        return
    types = set(t for _, t in meta)
    diffs = set(d for d, _ in meta)
    if types == {"简答题"}:
        log("! 配额提醒：本批全部为简答题，建议下批补充编程/场景/故障排查类题目")
    for need in ("初级", "中级", "高级"):
        if need not in diffs:
            log("! 配额提醒：本批缺少「%s」难度题目" % need)
            break


def write_published(data):
    # 与线上一致：minified、ensure_ascii=False。
    # 每次真实合并都递增 version 并刷新 publishedAt —— 前端/编辑端据此感知「云端有更新」，
    # 避免旧快照一直停留在访客本地。
    data["version"] = int(data.get("version", 1)) + 1
    data["publishedAt"] = int(time.time() * 1000)
    with open(PUBLISHED, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def load_marker():
    """待推送分享页的题目 id 集合（跨两次调用的持久化：先合并、后 --push 是两步流程）。"""
    try:
        with open(MARKER, encoding="utf-8") as f:
            return set(int(x) for x in json.load(f).get("ids", []) or [])
    except Exception:
        return set()


def save_marker(ids):
    with open(MARKER, "w", encoding="utf-8") as f:
        json.dump({"ids": sorted(ids), "updatedAt": int(time.time() * 1000)}, f)


def clear_marker():
    try:
        os.remove(MARKER)
    except OSError:
        pass


def load_topics():
    with open(TOPICS, encoding="utf-8") as f:
        return json.load(f)


def save_topics(t):
    """把更新后的经典主题清单写回 tools/classic-topics.json（保持 2 空格缩进）。"""
    t["updated"] = time.strftime("%Y-%m-%d", time.localtime())
    with open(TOPICS, "w", encoding="utf-8") as f:
        json.dump(t, f, ensure_ascii=False, indent=2)


# 取题轮转状态：记录上一轮命中的领域，保证跨域均匀铺开（避免云题扎堆）
ROTATION_STATE = os.path.join(ROOT, "tools", ".topic_rotation.json")


def _domain_order(t):
    """领域轮转顺序：按在清单中首次出现的位置稳定排序。"""
    seen = []
    for x in t.get("topics", []):
        d = x.get("domain") or "未分类"
        if d not in seen:
            seen.append(d)
    return seen


def _load_rotation():
    try:
        with open(ROTATION_STATE, encoding="utf-8") as f:
            return json.load(f).get("last_domain")
    except Exception:
        return None


def _save_rotation(domain):
    try:
        with open(ROTATION_STATE, "w", encoding="utf-8") as f:
            json.dump({"last_domain": domain}, f, ensure_ascii=False)
    except Exception:
        pass


def cmd_topic_next():
    """按领域轮转输出下一个未完成经典主题（JSON），使各技术体系均匀铺开。

    轮转规则：从「上一轮命中领域」的下一个域开始，选第一个仍有未完成题的域，
    取该域内列表顺序的第一道未完成题。状态持久化到 ROTATION_STATE，跨进程/跨天延续。
    """
    t = load_topics()
    todo = [x for x in t.get("topics", []) if not x.get("done")]
    log("经典主题进度：%d/%d 已完成" % (len(t.get("topics", [])) - len(todo), len(t.get("topics", []))))
    if not todo:
        log("🎉 全部完成！可对已 done 主题做深度补充，或扩充 classic-topics.json")
        return
    order = _domain_order(t)
    last = _load_rotation()
    # 无状态文件时（含自动化首次/状态丢失），从「最近完成主题的域」之后起步，避免回退重做
    if last is None or last not in order:
        done_domains = [x.get("domain") or "未分类" for x in t.get("topics", []) if x.get("done")]
        last = done_domains[-1] if done_domains else order[0]
    start = (order.index(last) + 1) % len(order) if last in order else 0
    chosen = None
    for i in range(len(order)):
        d = order[(start + i) % len(order)]
        if any((x.get("domain") or "未分类") == d for x in todo):
            chosen = d
            break
    if chosen is None:
        chosen = order[start]
    pick = next(x for x in todo if (x.get("domain") or "未分类") == chosen)
    _save_rotation(chosen)
    log("本轮命中域：%s（轮转序：%s）" % (chosen, " → ".join(order)))
    log(json.dumps(pick, ensure_ascii=False, indent=2))


def cmd_topic_done(tid, batch):
    t = load_topics()
    for x in t.get("topics", []):
        if x.get("id") == tid:
            x["done"] = True
            x["batch"] = batch or ""
            save_topics(t)
            log("✓ 已标记主题 %s 完成（批次：%s）" % (tid, batch or "-"))
            return
    log("! 未找到主题 %s" % tid)


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
    - 页面内容由 published.json 确定性生成，存量页不变，只需推送待推清单里的 id；
    - node 不可用 / 未配 Token 时降级为「仅本地生成」或「跳过」。
    - 返回 True 表示待推清单全部推送成功（或无需推送）。
    """
    if not new_ids:
        return True
    script = os.path.join(ROOT, "tools", "gen-share-pages.js")
    try:
        subprocess.run(["node", script], cwd=ROOT, check=True, timeout=180,
                       stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        log("✓ 已重生成分享页（q/<id>.html，含 %d 个新题页面）" % len(new_ids))
    except Exception as e:
        log("  ! 分享页生成失败（跳过，不影响题库）：%s" % e)
        return False
    if not branches:
        return True
    if not TOKEN:
        log("  ! 未配置 GH_PUBLISH_TOKEN，分享页仅在本地生成未推送")
        return False
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
    return pushed == len(new_ids)


def cmd_next(data):
    """数据驱动选域：按空叶子分类数排序推荐本轮扩充域。"""
    cats = {c["id"]: c for c in data.get("categories", []) if c.get("id") is not None}
    children = {}
    for c in cats.values():
        children.setdefault(c.get("parentId") or 0, []).append(c["id"])
    count = {}
    for q in data.get("questions", []):
        cid = q.get("categoryId")
        count[cid] = count.get(cid, 0) + 1

    def top_ancestor(cid):
        seen = set()
        while cid in cats:
            p = cats[cid].get("parentId") or 0
            if p == 0 or p not in cats or cid in seen:
                return cid
            seen.add(cid)
            cid = p
        return cid

    leaves = [cid for cid in cats if cid not in children]
    agg = {}
    for cid in leaves:
        root = top_ancestor(cid)
        n = count.get(cid, 0)
        a = agg.setdefault(root, {"empty": 0, "thin": 0, "empty_names": []})
        if n == 0:
            a["empty"] += 1
            a["empty_names"].append(cats[cid]["name"])
        elif n < 3:
            a["thin"] += 1
    rows = sorted(agg.items(), key=lambda kv: (-kv[1]["empty"], -kv[1]["thin"]))[:3]
    log("覆盖度概览（按空叶子数排序，当前共 %d 题）：" % len(data.get("questions", [])))
    for root, a in rows:
        name = cats.get(root, {}).get("name", "#" + str(root))
        log("  %s —— 空叶子 %d 个，瘦叶子（<3题）%d 个" % (name, a["empty"], a["thin"]))
    if not rows:
        return
    root, a = rows[0]
    name = cats.get(root, {}).get("name", "#" + str(root))
    log("")
    log("建议本轮扩充域：%s" % name)
    if a["empty_names"]:
        log("优先填充叶子分类：%s" % "、".join(a["empty_names"][:8]))
    src = DOMAIN_SOURCES.get(name)
    if src:
        log("推荐来源：%s" % src)


def main():
    ap = argparse.ArgumentParser(description="题库自动扩充流水线")
    ap.add_argument("batch", nargs="?", help="批次 JSON 路径；与 --all 二选一")
    ap.add_argument("--all", action="store_true", help="处理 tools/batches/ 下全部 .json")
    ap.add_argument("--dry", action="store_true", help="只校验不落盘")
    ap.add_argument("--push", action="store_true", help="合并后通过 API 推送到 Pages 分支")
    ap.add_argument("--branches", default=",".join(DEFAULT_BRANCHES),
                    help="推送目标分支，逗号分隔（默认 release,main）")
    ap.add_argument("--next", action="store_true",
                    help="数据驱动选域：按空叶子分类数输出推荐扩充域，不合并不推送")
    ap.add_argument("--topic-next", action="store_true",
                    help="输出第一个未完成的经典主题（classic-topics.json），供追问链批次生成")
    ap.add_argument("--topic-done", metavar="TID",
                    help="把指定主题标记为已完成（如 --topic-done T001）")
    ap.add_argument("--topic-batch", default="", help="配合 --topic-done 记录批次号")
    args = ap.parse_args()

    if args.topic_next:
        cmd_topic_next()
        return
    if args.topic_done:
        cmd_topic_done(args.topic_done, args.topic_batch)
        return

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
    quota_warnings(stats)

    if args.dry:
        log("[dry] 未写入文件。")
        return

    # 两步流程兼容：自动化先「合并」再「--push 同一批次」。
    # --push 时批次已全部去重跳过（added=0），此时不重复写文件/不重复自增 version，
    # 直接推送第 8 步已合并的 published.json。
    if stats["added"] > 0:
        write_published(data)
        log("✓ 已写入 %s" % os.path.relpath(PUBLISHED, ROOT))
    else:
        log("本批次无新增（已全部合并过），直接推送现有题库文件")

    # 待推分享页清单：跨调用持久化（合并步写入，推送步消费），避免新题 id 在两次调用间丢失
    pending = load_marker() | set(stats.get("new_ids") or [])

    if args.push:
        branches = [b.strip() for b in args.branches.split(",") if b.strip()]
        push_all(data, branches)
        if regen_and_push_share_pages(sorted(pending), branches):
            if pending:
                clear_marker()
        else:
            save_marker(pending)   # 保留待推清单，下次 --push 重试
    else:
        save_marker(pending)       # 本地合并：记录待推，等下一次 --push 一起发
        regen_and_push_share_pages(sorted(pending) if pending else [], [])


if __name__ == "__main__":
    main()
