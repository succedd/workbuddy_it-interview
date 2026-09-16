#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""对比远端 release 分支各文件与本地工作区的「行尾风格」与「真实差异」。
用途：部署前发现「本地 CRLF / 远端 LF」这类行尾不一致——
直接推会把 1 行修改放大成整文件 diff（仓库历史噪音）。
用法：python tools/eol-check.py <本地仓库根> <文件...>
Token：GH_PUBLISH_TOKEN 环境变量，或 git credential fill。
"""
import base64, json, os, subprocess, sys, urllib.request

REPO = "succedd/workbuddy_it-interview"
BRANCH = "release"
API = "https://api.github.com"


def token():
    t = os.environ.get("GH_PUBLISH_TOKEN", "").strip()
    if t:
        return t
    git = os.environ.get("GIT_EXE", r"C:\Users\Life\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd\git.exe")
    p = subprocess.run([git, "credential", "fill"], input="protocol=https\nhost=github.com\n\n",
                       capture_output=True, text=True, encoding="utf-8")
    for line in (p.stdout or "").splitlines():
        if line.startswith("password="):
            return line[9:].strip()
    return ""


def get(path):
    req = urllib.request.Request(API + path)
    req.add_header("Authorization", "Bearer " + token())
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "wb-eol-check")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def style(b):
    crlf = b.count(b"\r\n")
    lf = b.count(b"\n") - crlf
    if crlf and lf:
        return "MIXED"
    return "CRLF" if crlf else "LF"


def main():
    root = sys.argv[1]
    files = sys.argv[2:]
    ref = get("/repos/%s/git/ref/heads/%s" % (REPO, BRANCH))
    base = ref["object"]["sha"]
    tree = get("/repos/%s/git/trees/%s?recursive=1" % (REPO, get("/repos/%s/git/commits/%s" % (REPO, base))["tree"]["sha"]))
    remote_sha = {e["path"]: e["sha"] for e in tree["tree"] if e["type"] == "blob"}
    print("远端 %s = %s" % (BRANCH, base[:10]))
    bad = 0
    for f in files:
        lp = os.path.join(root, f.replace("/", os.sep))
        if not os.path.exists(lp):
            print("  %-30s 本地缺文件" % f); continue
        lb = open(lp, "rb").read()
        blob = get("/repos/%s/git/blobs/%s" % (REPO, remote_sha[f])) if f in remote_sha else None
        if blob is None:
            print("  %-30s 远端不存在（新文件）  本地风格=%s" % (f, style(lb))); continue
        rb = base64.b64decode(blob["content"])
        ls, rs = style(lb), style(rb)
        # 忽略行尾后的真实差异行数
        ln = lb.replace(b"\r\n", b"\n").split(b"\n")
        rn = rb.replace(b"\r\n", b"\n").split(b"\n")
        real = sum(1 for a, b in zip(ln, rn) if a != b) + abs(len(ln) - len(rn))
        flag = ""
        if ls != rs:
            flag = "  <<< 行尾不一致"
            bad += 1
        print("  %-30s 本地=%-5s 远端=%-5s 忽略行尾后真实差异=%d 行%s" % (f, ls, rs, real, flag))
    print("行尾不一致文件数:", bad)
    return 0


if __name__ == "__main__":
    sys.exit(main())
