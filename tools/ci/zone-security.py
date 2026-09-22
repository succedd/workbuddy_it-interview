#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cloudflare Zone 安全基线（幂等，可反复执行）
================================================================
把 itinterview.com.cn 的「传输层安全」一次性调到推荐值，并在改完后用 API 复查、
逐项打印 PASS/FAIL（有 FAIL 就 exit 1，便于 CI 标红）。

为什么需要它（⚠️ 截至 2026-09-22：本脚本仍是「休眠」状态，一次都没在 CI 里跑通过）：
  站点从 GitHub Pages 迁到 Cloudflare Pages 后，域名 zone 就在本账号下
  （zone id 48961f3585fdc652af950bd2163c0382），终于可以叠加 zone 级防护。
  但两条通道都缺权限：本机 wrangler 的 OAuth 只有 zone:read —— 读设置报 9109、
  写设置更不行；仓库 Secret `CLOUDFLARE_API_TOKEN` 虽然凭据本身有效
  （/user/tokens/verify 通过），但权限组实际只有 `Account.Cloudflare Pages`，
  在 CI 里读 zone settings 同样报 9109。
  ⇒ 要跑通本脚本，必须先在 Dashboard 给该 token 加一条
    「Zone → Zone Settings → Edit」（Zone Resources: Include → Specific zone
    → itinterview.com.cn），再 push 到 cf-zone-setup 分支触发
    .github/workflows/zone-security.yml。

【要不要为它去改 token？2026-09-22 实测结论：不值得 —— 多数项已经是现状】
  · min_tls_version：**已满足**。Python ssl 用 `ALL:@SECLEVEL=0` 逐版本尝试
      TLS1.0/1.1，服务端回 `tlsv1 alert protocol version`（注意这是**服务端**拒绝
      的告警；openssl CLI 报的 `no protocols available` 是本机限制、不构成证据）
      ⇒ 边缘最低 TLS 已是 1.2+。别拿 openssl CLI 的失败当依据，会得出假结论。
  · tls_1_3：**已开**（/cdn-cgi/trace 实测 tls=TLSv1.3、kex=X25519MLKEM768）。
  · always_use_https / HSTS：**效果已在应用层达成**，见 cloudflare/pages/_worker.js
      第四道闸门（301 + Strict-Transport-Security 响应头）。浏览器视角与面板开关
      产物一致，唯一差别是面板开关能顺带提交 HSTS preload —— 而本站刻意不用 preload。
  · opportunistic_encryption：80 端口 h2c（前置知识与 Upgrade 两种方式）实测都不
      升级、直接 301；站内 0 处 http:// 子资源 ⇒「自动 HTTPS 重写」也无需开启。
  ⇒ 真正剩下的只有「关掉随机加密」这一条（且其影响已被 301 覆盖）。

开什么（零风险、纯收益）：
  always_use_https         on     http 请求一律 301 到 https，防协议降级
  min_tls_version          1.2    淘汰 TLS 1.0/1.1
  tls_1_3                  on     启用 TLS 1.3
  opportunistic_encryption off    ⚠️ 百度爬虫不兼容「随机加密」，必须关闭
  security_header          HSTS   max-age=15552000(180d) + includeSubDomains + nosniff
                                 不开 preload：preload 列表不可逆，且本站无此必要

刻意不开（网上那些「一键全面加固」教程会让你踩坑）：
  security_level = High
      国内访客大量走代理 / 共享出口 IP，威胁评分天然偏高。开 High 会频繁弹
      人机验证甚至直接 403 —— 对「给国内程序员用的题库站」是负收益。
      默认的 Medium 足够；真被打了再临时调，别常开。
  bot_management（Bot Fight Mode）
      实测会误伤 Baiduspider / YandexBot（它们虽在 Cloudflare verified 名单里，
      但免费版这条规则长期有误杀报告）。本站百度流量是主力，而 _worker.js
      里已经做了精准的 UA + ASN 白名单（真蜘蛛放行、伪装者拦掉），
      再叠一层粗粒度的 Bot Fight Mode 属于「花钱买风险」。

用法：
  CF_TOKEN=xxx python3 tools/ci/zone-security.py            # 只看现状，不改任何设置
  CF_TOKEN=xxx python3 tools/ci/zone-security.py --apply    # 应用基线并复查
  CF_ZONE_ID 可覆盖默认 zone；CF_TOKEN 也可用 CLOUDFLARE_API_TOKEN。
"""

import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.cloudflare.com/client/v4"
ZONE = os.environ.get("CF_ZONE_ID", "48961f3585fdc652af950bd2163c0382")
TOKEN = (os.environ.get("CF_TOKEN") or os.environ.get("CLOUDFLARE_API_TOKEN") or "").strip()

# ── 想开的基线（顺序即执行顺序，均幂等）────────────────────────────
TARGETS = [
    # (端点, 目标值, 说明)
    ("always_use_https", "on", "始终使用 HTTPS（http→301）"),
    ("min_tls_version", "1.2", "最低 TLS 1.2"),
    ("tls_1_3", "on", "启用 TLS 1.3"),
    ("opportunistic_encryption", "off", "关闭「随机加密」（百度爬虫不兼容）"),
]

HSTS = {
    "strict_transport_security": {
        "enabled": True,
        "max_age": 15552000,        # 180 天：达 iOS WebView 强制 HTTPS 门槛，同时留退路
        "include_subdomains": True,
        "preload": False,           # 刻意不开
        "nosniff": True,            # 附带 X-Content-Type-Options: nosniff
    }
}

# ── 只读观察项（不做修改，仅报告现状，避免误改）────────────────────
OBSERVE = [
    ("security_level", "安全级别（威胁评分门槛）"),
    ("ssl", "SSL 模式（回源握手）"),
    ("http2", "HTTP/2"),
    ("bot_management", "Bot Fight Mode（独立端点）"),
]


def api(method, path, payload=None):
    """调 Cloudflare API，成功失败都返回解析后的 dict。"""
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            return json.loads(raw)
        except ValueError:
            return {"success": False, "errors": [{"code": exc.code, "message": raw[:200]}]}
    except Exception as exc:  # 网络层错误
        return {"success": False, "errors": [{"code": -1, "message": repr(exc)}]}


def errs(res):
    return "; ".join(
        "{} {}".format(e.get("code", "?"), e.get("message", "")) for e in (res.get("errors") or [])
    )


def get_setting(name):
    """读 zone setting，返回 (ok, value) 或 (False, 错误文本)。"""
    res = api("GET", "/zones/{}/settings/{}".format(ZONE, name))
    if res.get("success"):
        return True, (res.get("result") or {}).get("value")
    return False, errs(res)


def get_bot_management():
    res = api("GET", "/zones/{}/bot_management".format(ZONE))
    if res.get("success"):
        return True, (res.get("result") or {}).get("fight_mode")
    return False, errs(res)


def fmt(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value)


def hsts_matches(value):
    """HSTS 是嵌套结构，逐字段比对关键项。"""
    sts = (value or {}).get("strict_transport_security") or {}
    return (
        sts.get("enabled") is True
        and int(sts.get("max_age") or 0) == HSTS["strict_transport_security"]["max_age"]
        and sts.get("include_subdomains") is True
        and sts.get("preload") is False
    )


def banner(text):
    print("\n" + "=" * 62)
    print(text)
    print("=" * 62)


def main():
    apply_mode = "--apply" in sys.argv

    if not TOKEN:
        print("✗ 缺少凭据：请设置 CF_TOKEN（或 CLOUDFLARE_API_TOKEN）环境变量")
        return 2

    print("zone   : {}".format(ZONE))
    print("模式   : {}".format("APPLY（会修改设置）" if apply_mode else "DRY-RUN（只读）"))

    # 0) token 自检 —— 顺手确认凭据有效
    verify = api("GET", "/user/tokens/verify")
    print("凭据   : {}".format("有效 ✓" if verify.get("success") else "无效 ✗ " + errs(verify)))

    # 1) 现状
    banner("① 当前状态")
    before = {}
    permission_errors = []
    for name, label in [("security_level", "安全级别"), ("always_use_https", "始终HTTPS"),
                        ("min_tls_version", "最低TLS"), ("tls_1_3", "TLS1.3"),
                        ("opportunistic_encryption", "随机加密"), ("security_header", "HSTS"),
                        ("ssl", "SSL模式"), ("http2", "HTTP/2")]:
        ok, val = get_setting(name)
        if ok:
            before[name] = val
            print("  {:<24} = {}".format(label, fmt(val)))
        else:
            permission_errors.append("{}: {}".format(name, val))
            print("  {:<24} = ✗ 读取失败 → {}".format(label, val))

    ok_bot, bot_val = get_bot_management()
    if ok_bot:
        print("  {:<24} = {}".format("Bot Fight Mode", bot_val))
    else:
        permission_errors.append("bot_management: {}".format(bot_val))
        print("  {:<24} = ✗ 读取失败 → {}".format("Bot Fight Mode", bot_val))

    if permission_errors:
        banner("✗ 权限不足：这个 token 没有 Zone Settings 读权限")
        for line in permission_errors:
            print("  - {}".format(line))
        print(
            "\n把 GitHub Secret `CLOUDFLARE_API_TOKEN` 对应那个 token 加两条权限即可：\n"
            "  Zone → Zone Settings → Edit\n"
            "  Zone → Zone → Edit（可省，仅用于读安全级别）\n"
            "路径：dash.cloudflare.com → 右上头像 → My Profile → API Tokens → 编辑该 token\n"
            "权限组名：Zone Settings:Edit / Zone:Edit，Zone Resources 选 Include → Specific zone → itinterview.com.cn"
        )
        return 3

    # 2) 应用
    if apply_mode:
        banner("② 应用基线")
        for name, target, label in TARGETS:
            res = api("PATCH", "/zones/{}/settings/{}".format(ZONE, name), {"value": target})
            if res.get("success"):
                print("  ✓ {:<24} → {}".format(label, target))
            else:
                print("  ✗ {:<24} → {} 失败：{}".format(label, target, errs(res)))

        res = api("PATCH", "/zones/{}/settings/security_header".format(ZONE), {"value": HSTS})
        if res.get("success"):
            print("  ✓ {:<24} → max-age={} includeSubDomains preload=off".format(
                "HSTS", HSTS["strict_transport_security"]["max_age"]))
        else:
            print("  ✗ {:<24} → 失败：{}".format("HSTS", errs(res)))

    # 3) 复查
    banner("③ 复查（PASS/FAIL）")
    failures = []
    for name, target, label in TARGETS:
        ok, val = get_setting(name)
        good = ok and str(val).lower() == target.lower()
        print("  [{}] {:<24} 期望 {} / 实际 {}".format(
            "PASS" if good else "FAIL", label, target, fmt(val) if ok else "读取失败"))
        if not good:
            failures.append(label)

    ok, val = get_setting("security_header")
    good = ok and hsts_matches(val)
    print("  [{}] {:<24} 期望 max-age=15552000 includeSubDomains preload=off / 实际 {}".format(
        "PASS" if good else "FAIL", "HSTS", fmt(val) if ok else "读取失败"))
    if not good:
        failures.append("HSTS")

    print("\n  刻意不动（列出来是为了让你知道它们是「有意为之」，不是漏了）：")
    ok, val = get_setting("security_level")
    print("    · 安全级别           = {}（保持默认，不开 High：会误伤国内访客）".format(fmt(val) if ok else "?"))
    ok_bot, bot_val = get_bot_management()
    print("    · Bot Fight Mode      = {}（保持关闭：会误伤 Baiduspider，_worker.js 已做精准白名单）".format(
        bot_val if ok_bot else "?"))

    if failures:
        banner("✗ {} 项未达标：{}".format(len(failures), "、".join(failures)))
        return 1

    banner("✓ 全部达标（{} 项）".format(len(TARGETS) + 1))
    print("下一步：curl -I https://itinterview.com.cn/ 应能看到 strict-transport-security 响应头；")
    print("        curl -I http://itinterview.com.cn/ 应返回 301 到 https。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
