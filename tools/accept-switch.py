#!/usr/bin/env python3
"""换域名后全量验收（2026-09-21：it-interview-889.pages.dev -> itinterview.com.cn）

覆盖 10 项：
  1  首页可达 200
  2  首页版本号
  3  sw.js 可达 + VERSION
  4  sitemap.xml 可达 + 全为新域名
  5  robots.txt 可达 + Sitemap 指向新域名
  6  分享页 /q/<某题>.html 可达 + canonical 新域名
  7  题库 published.json 同源信号 200 / 无信号 403
  8  反爬：裸 curl 403、GPTBot 403、敏感文件 404
  9  旧域名 is-a.dev 零残留（页面源码中）
 10  www 子域可达

用法：python tools/accept-switch.py
退出码 0 = 全通过。
"""
import json
import os
import re
import subprocess
import sys
import urllib.request

SITE = "https://itinterview.com.cn"
WWW = "https://www.itinterview.com.cn"
BAD_HOSTS = ["it-interview.is-a.dev", "succedd.github.io"]
PROXY = "http://127.0.0.1:7897"


def _proxy_alive(host="127.0.0.1", port=7897):
    """本机代理时有时无（2026-09-22 实测 7897 已关，GitHub 与本站均可直连）。
    探一次：活着才套代理，否则一律直连，避免脚本因代理失效而整体误报。"""
    import socket
    try:
        s = socket.create_connection((host, port), timeout=1)
        s.close()
        return True
    except OSError:
        return False


USE_PROXY = _proxy_alive()

BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")

results = []


def rec(no, name, ok, detail=""):
    results.append((no, name, ok, detail))
    print(f"  [{no:2d}] {'PASS' if ok else 'FAIL'}  {name}" + (f"  | {detail}" if detail else ""))


def curl(url, extra=None, proxy=True, ua=None):
    """返回 (http_code, body_text_or_None, headers_text)"""
    cmd = ["curl", "-s", "-k", "-o", "-", "-w", "\n__HTTP__%{http_code}"]
    if proxy and USE_PROXY:
        cmd += ["-x", PROXY]
    if ua:
        cmd += ["-A", ua]
    if extra:
        cmd += extra
    cmd.append(url)
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=60)
        out = p.stdout.decode("utf-8", "replace")
    except Exception as e:
        return "000", None, f"ERR {e}"
    m = re.search(r"__HTTP__(\d{3})$", out)
    code = m.group(1) if m else "000"
    body = out[:m.start()] if m else out
    return code, body, ""


def main():
    print(f"\n{'='*62}\n  换域名验收：{SITE}\n{'='*62}\n")

    # 1 首页
    code, body, _ = curl(SITE + "/", ua=BROWSER_UA)
    rec(1, "首页可达", code == "200", f"http={code}")

    # 2 首页版本号
    ver = None
    if body:
        m = re.search(r"\?v=(\d{8}[a-z]?)", body)
        ver = m.group(1) if m else None
    rec(2, "首页缓存版本号", bool(ver), f"v={ver}")

    # 3 sw.js
    code, swb, _ = curl(SITE + "/sw.js", ua=BROWSER_UA)
    swver = None
    if swb:
        m = re.search(r'VERSION\s*=\s*["\']([^"\']+)', swb)
        swver = m.group(1) if m else None
    rec(3, "sw.js 可达 + 版本一致", code == "200" and swver == ver,
        f"http={code} swVERSION={swver}")

    # 4 sitemap.xml
    code, sm, _ = curl(SITE + "/sitemap.xml", ua=BROWSER_UA)
    n_new = sm.count(SITE) if sm else 0
    n_old = sum(sm.count(h) for h in BAD_HOSTS) if sm else 0
    rec(4, "sitemap.xml 全为新域名", code == "200" and n_new > 1000 and n_old == 0,
        f"http={code} new={n_new} old={n_old}")

    # 5 robots.txt
    code, rb, _ = curl(SITE + "/robots.txt", ua=BROWSER_UA)
    ok5 = code == "200" and rb and "Sitemap:" in rb and SITE in rb
    rec(5, "robots.txt 指向新域名", bool(ok5), f"http={code}")

    # 6 分享页
    qurl = SITE + "/q/1.html"
    code, qb, _ = curl(qurl, ua=BROWSER_UA)
    canon = None
    if qb:
        m = re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', qb)
        canon = m.group(1) if m else None
    # 308 视为路径规范化（Pages 会把 /q/1.html 规整），跟随重定向再测
    if code in ("301", "308", "307", "302"):
        code2, qb2, _ = curl(qurl, extra=["-L"], ua=BROWSER_UA)
        if code2 == "200":
            code = "200(-L)"
            if qb2:
                m = re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', qb2)
                canon = m.group(1) if m else canon
    rec(6, "分享页可达 + canonical 新域名",
        str(code).startswith("200") and canon and SITE in canon and canonical_ok(canon),
        f"http={code} canonical={canon}")

    # 7 题库同源信号
    dpath = "/data/published.json"
    c_bare, _, _ = curl(SITE + dpath, proxy=False, ua="curl/8.4.0")
    c_ok, bd, _ = curl(SITE + dpath, extra=[
        "-H", "Sec-Fetch-Site: same-origin",
        "-H", f"Referer: {SITE}/",
    ], ua=BROWSER_UA)
    ver_q = n_q = None
    if c_ok == "200" and bd:
        try:
            j = json.loads(bd)
            ver_q = j.get("version")
            n_q = len(j.get("questions") or [])
        except Exception:
            pass
    rec(7, "题库守卫：无信号 403 / 同源 200",
        c_bare == "403" and c_ok == "200",
        f"bare={c_bare} sameorigin={c_ok} version={ver_q} questions={n_q}")

    # 8 反爬 + 敏感文件
    c_gpt, _, _ = curl(SITE + "/q/1.html", ua="GPTBot/1.2")
    c_h, _, _ = curl(SITE + "/HANDOVER.md", ua=BROWSER_UA)
    c_b, _, _ = curl(SITE + "/tools/build-pages.mjs", ua=BROWSER_UA)
    rec(8, "反爬：GPTBot 403 + 敏感文件 404",
        c_gpt == "403" and c_h == "404" and c_b == "404",
        f"gptbot={c_gpt} HANDOVER={c_h} build-pages={c_b}")

    # 9 旧域名零残留
    leftovers = []
    for h in BAD_HOSTS:
        if (body and h in body) or (swb and h in swb) or (sm and h in sm):
            leftovers.append(h)
    rec(9, "前端文件内旧域名零残留", not leftovers, f"残留={leftovers or '无'}")

    # 10 www 子域
    code, wb, _ = curl(WWW + "/", ua=BROWSER_UA)
    rec(10, "www 子域可达", code == "200", f"http={code}")

    # 汇总
    bad = [r for r in results if not r[2]]
    print(f"\n{'-'*62}\n  结果：{len(results)-len(bad)}/{len(results)} 通过")
    if bad:
        print("  失败项：")
        for no, name, _, detail in bad:
            print(f"    #{no} {name}  {detail}")
    print(f"{'-'*62}\n")
    return 1 if bad else 0


def canonical_ok(canon):
    return "pages.dev" not in canon and "is-a.dev" not in canon


if __name__ == "__main__":
    sys.exit(main())
