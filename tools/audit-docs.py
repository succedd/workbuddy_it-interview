#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""校验每个方向文件的章节体：
  1. ${F} 出现次数是否为偶数（围栏配平）
  2. 每章正文字节数
  3. 章节 id 列表
用法: python tools/audit-docs.py [file.js ...]
"""
import io
import re
import subprocess
import sys
import os

NODE = r"C:/Users/Life/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
files = sys.argv[1:] or ["security", "devops", "java", "dba", "frontend", "network"]

for f in files:
    path = "js/docs/%s.js" % f if not f.endswith(".js") else f
    src = io.open(path, encoding="utf-8", newline="").read()
    # 用 node 执行以拿到真实 body（避免模板字符串解析差异）
    js = (
        'global.window={};require("./%s");const d=global.window[Object.keys(global.window)[0]];'
        "d.levels.forEach(l=>l.chapters.forEach(c=>console.log(JSON.stringify([c.id,c.title,(c.body||'').length,(c.body||'').split('${F}').length-1]))));" % path
    )
    out = subprocess.run([NODE, "-e", js], capture_output=True, text=True, encoding="utf-8").stdout
    rows = [__import__("json").loads(l) for l in out.strip().split("\n") if l.strip()]
    odd = [r for r in rows if r[3] % 2 != 0]
    total = sum(r[2] for r in rows)
    print("===== %s : %d chapters, body %d chars =====" % (path, len(rows), total))
    if odd:
        for r in odd:
            print("   ⚠ ODD-FENCES %s (%s) fences=%d" % (r[0], r[1], r[3]))
    else:
        print("   fences balanced OK")
    for r in rows:
        print("   %-34s %6d chars  fences=%d" % (r[0], r[2], r[3]))
