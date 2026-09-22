#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudflare 用量巡检（配额守护）

用途：查 Workers 每日请求 / 错误量，判断离免费额度（10 万请求/天）还有多远。
数据源：Cloudflare GraphQL Analytics API。

用法：
    python tools/cf-quota-check.py              # 最近 3 天
    python tools/cf-quota-check.py --days 7
    python tools/cf-quota-check.py --json       # 机器可读，供自动化判读

凭据：自动读 C:/Users/Life/.wrangler/config/default.toml 的 oauth_token
      （约 12h 过期；失败先跑 `wrangler.cmd whoami` 续期）。

阈值（脚本会自己判读并给出 status）：
    单日 requests >= 50000（免费 10 万/天的一半） -> warn
    任意 errors > 0                              -> warn
    取数失败                                      -> error

已知限制（很重要，别据此下错结论）：
    workersInvocationsAdaptive **不包含 Cloudflare Pages 项目的 Functions**。
    本站 Pages 项目 it-interview 用的是 `_worker.js` 高级模式，它的调用数在本脚本里
    查不到（实测 dataset 只列出独立 Worker `it-interview-stats`）。
    Pages 的请求量只能看 Dashboard → Workers & Pages → it-interview → Metrics。
    所以：本脚本数字小 ≠ 整站配额宽裕。
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

ACCOUNT_ID = "6e7bbb8c6002ed51eabf4fd5c1f3e066"
ZONE_ID = "48961f3585fdc652af950bd2163c0382"        # itinterview.com.cn
TOML = os.path.expanduser("~/.wrangler/config/default.toml")
TOML = os.environ.get("WRANGLER_CONFIG", TOML)
API = "https://api.cloudflare.com/client/v4/graphql"

WARN_REQUESTS = 50000        # 免费 10 万/天的一半
FREE_LIMIT = 100000


def read_token():
    """从 wrangler 配置读 oauth_token。不打印明文。"""
    try:
        with open(TOML, encoding="utf-8") as f:
            s = f.read()
    except OSError as e:
        return None, "读不到 wrangler 配置 %s (%s)" % (TOML, e)
    m = re.search(r'^oauth_token\s*=\s*"([^"]+)"', s, re.M)
    if not m:
        return None, "配置里没有 oauth_token 字段"
    return m.group(1), None


def gql(token, query):
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def fetch(token, start, end):
    """查独立 Worker 的调用量；返回 ({script: {date: {...}}}, err)。"""
    q = """
    query { viewer { accounts(filter: {accountTag: "%s"}) {
      workersInvocationsAdaptive(limit: 100,
        filter: {date_geq: "%s", date_leq: "%s"}) {
        sum { requests errors subrequests }
        dimensions { scriptName date }
      } } } }
    """ % (ACCOUNT_ID, start, end)
    try:
        r = gql(token, q)
    except urllib.error.HTTPError as e:
        return None, "HTTP %s: %s" % (e.code, e.read().decode("utf-8", "ignore")[:200])
    except Exception as e:                                  # noqa: BLE001
        return None, "%s: %s" % (type(e).__name__, e)
    if r.get("errors"):
        return None, "GraphQL: " + json.dumps(r["errors"], ensure_ascii=False)[:300]
    agg = {}
    for acc in ((r.get("data") or {}).get("viewer") or {}).get("accounts", []):
        for w in acc.get("workersInvocationsAdaptive", []) or []:
            name = w["dimensions"].get("scriptName")
            day = w["dimensions"].get("date")
            s = w.get("sum") or {}
            slot = agg.setdefault(name, {}).setdefault(
                day, {"requests": 0, "errors": 0, "subrequests": 0})
            for k in slot:
                slot[k] += s.get(k, 0)
    return agg, None


def is_odd_port(host):
    """True = 带非标准端口。Cloudflare 会代理 8443/2087/2083/2096/2053/2082/2086/2095/8080/8880，
    所以这类请求是真打到边缘的（多为端口扫描），不是脏数据。"""
    h = host or ""
    if h.endswith(":443") or h.endswith(":80"):
        return False
    return ":" in h


def fetch_zone(token, days):
    """zone 级 CDN 全部请求（含静态资源，按 host 分组）。这是唯一能反映整站真实请求量的通道：
    Pages 项目的 Function 调用数不在 workersInvocationsAdaptive 里，查不到。
    注意：本 dataset 用 datetime_geq/leq（ISO），与 workersInvocationsAdaptive 的 date 不同。"""
    q = """
    query { viewer { zones(filter: {zoneTag: "%s"}) {
      httpRequestsAdaptiveGroups(limit: 200,
        filter: {datetime_geq: "%sT00:00:00Z", datetime_leq: "%sT23:59:59Z"}) {
        count dimensions { clientRequestHTTPHost } } } } }
    """ % (ZONE_ID, days[0], days[-1])
    try:
        r = gql(token, q)
    except Exception as e:                              # noqa: BLE001
        return None, "%s: %s" % (type(e).__name__, e)
    if r.get("errors"):
        return None, "GraphQL: " + json.dumps(r["errors"], ensure_ascii=False)[:200]
    tot = {}
    for z in ((r.get("data") or {}).get("viewer") or {}).get("zones", []) or []:
        for g in z.get("httpRequestsAdaptiveGroups", []) or []:
            h = g["dimensions"].get("clientRequestHTTPHost") or "?"
            tot[h] = tot.get(h, 0) + g["count"]
    return tot, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    # Cloudflare GraphQL 只认 YYYY-MM-DD（写 ISO datetime 会报 date format should be '2006-01-02'）
    import datetime
    today = datetime.datetime.now(datetime.timezone.utc).date()
    days = [(today - datetime.timedelta(days=i)).isoformat() for i in range(args.days - 1, -1, -1)]
    start, end = days[0], days[-1]

    token, err = read_token()
    if err:
        return report({"status": "error", "reason": err, "days": days}, args.json)

    agg, err = fetch(token, start, end)
    if err:
        return report({"status": "error", "reason": err, "days": days}, args.json)

    warn = []
    zone, zerr = fetch_zone(token, days)
    if zone:
        ztot = sum(zone.values())
        zodd = sum(c for h, c in zone.items() if is_odd_port(h))
        if ztot >= WARN_REQUESTS:
            warn.append("zone 窗口内总请求 %d 已过 5 万（免费上限 %d）" % (ztot, FREE_LIMIT))
        if zodd >= 200:
            warn.append("zone 窗口内 %d 次非标准端口请求（疑似端口扫描），建议加 WAF 规则挡掉" % zodd)

    for name, byday in sorted(agg.items()):
        for day, s in sorted(byday.items()):
            if s["requests"] >= WARN_REQUESTS:
                warn.append("%s %s 请求 %d 已过 5 万（免费上限 %d）" % (name, day, s["requests"], FREE_LIMIT))
            if s["errors"] > 0:
                warn.append("%s %s 有 %d 次错误" % (name, day, s["errors"]))

    out = {
        "status": "warn" if warn else "ok",
        "days": days,
        "scripts": agg,
        "zone": zone,
        "zone_error": zerr,
        "warnings": warn,
        "note": "本数据集不含 Pages 项目的 Functions；it-interview 的 _worker.js 调用数请查 Dashboard Metrics",
    }
    return report(out, args.json)


def report(out, as_json):
    if as_json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 1 if out.get("status") == "error" else 0
    st = out.get("status")
    if st == "error":
        print("[cf-quota] 取数失败：%s" % out.get("reason"))
        return 1
    print("[cf-quota] 窗口 %s ~ %s" % (out["days"][0], out["days"][-1]))
    zone = out.get("zone")
    if zone:
        ztot = sum(zone.values())
        zodd = sum(c for h, c in zone.items() if is_odd_port(h))
        print("  == zone itinterview.com.cn 合计 %d 次请求  非标准端口 %d 次" % (ztot, zodd))
        for h, c in sorted(zone.items(), key=lambda x: -x[1])[:6]:
            print("     %-34s %d" % (h, c))
    elif out.get("zone_error"):
        print("  == zone 查询失败：%s" % out["zone_error"])
    if not out.get("scripts"):
        print("  （没有数据：可能 token 刚续期、或该窗口确实零调用）")
    for name, byday in sorted((out.get("scripts") or {}).items()):
        print("  == %s" % name)
        for day, s in sorted(byday.items()):
            print("     %s  requests=%-8d errors=%-3d subrequests=%-8d  (%.1f%% of %d)"
                  % (day, s["requests"], s["errors"], s["subrequests"],
                     s["requests"] * 100.0 / FREE_LIMIT, FREE_LIMIT))
    for w in out.get("warnings") or []:
        print("  [WARN] " + w)
    print("  note: %s" % out.get("note"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
