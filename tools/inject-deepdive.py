#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inject-deepdive.py —— 按章节 id 向 docs 数据文件注入「深挖」段落（只增不删、幂等）。

用法:
    python tools/inject-deepdive.py <js文件> <md文件>

md 文件格式（分节）:
    任意前言（忽略）
    <!--CH:chapter-id-->
    ...该章节要插入的 markdown...
    <!--CH:next-chapter-id-->
    ...

插入位置: 章节 span 内最后一个以 "## " 开头且含 "延伸" 的标题行之前；
若无此标题，则插入到 body 结束反引号行之前。
注入的段落首尾各加一个换行，避免与相邻内容粘连。
幂等标记: <!--dd:<id>--> —— 已存在则跳过该章节。
"""
import io
import os
import re
import sys


def main():
    if len(sys.argv) < 3:
        print("usage: inject-deepdive.py <jsfile> <mdfile>")
        return 2
    js_path, md_path = sys.argv[1], sys.argv[2]
    src = io.open(js_path, encoding="utf-8", newline="").read()
    md = io.open(md_path, encoding="utf-8", newline="").read()

    parts = re.split(r"<!--CH:([A-Za-z0-9_\-]+)-->", md)
    sections = {}
    order = []
    for i in range(1, len(parts), 2):
        cid = parts[i]
        body = parts[i + 1].strip("\r\n")
        sections[cid] = body
        order.append(cid)

    # 文件内所有章节 id 的位置（用于界定 span）
    id_re = re.compile(r'id:\s*"([A-Za-z0-9_\-]+)"')
    marks = [(m.start(), m.group(1)) for m in id_re.finditer(src)]

    injected, skipped, missing = [], [], []
    # 从后往前处理，避免位置偏移
    plan = []
    for cid, body in sections.items():
        pos = None
        for idx, (p, name) in enumerate(marks):
            if name == cid:
                end = marks[idx + 1][0] if idx + 1 < len(marks) else len(src)
                pos = (p, end)
                break
        if pos is None:
            missing.append(cid)
            continue
        plan.append((pos[0], pos[1], cid, body))
    plan.sort(key=lambda x: -x[0])

    for start, end, cid, body in plan:
        span = src[start:end]
        marker = "<!--dd:%s-->" % cid
        if marker in span:
            skipped.append(cid)
            continue
        block = "%s\n\n%s\n\n" % (marker, body)
        # 找 span 内最后一个含「延伸」的 ## 标题
        m = None
        for mm in re.finditer(r"(?m)^[ \t]*##[ \t]+[^\n]*延伸[^\n]*$", span):
            m = mm
        if m:
            at = start + m.start()
        else:
            # 回退：body 结束反引号行（span 内最后一个仅含反引号的行）
            m2 = None
            for mm in re.finditer(r"(?m)^[ \t]*`[ \t]*$", span):
                m2 = mm
            if m2:
                at = start + m2.start()
            else:
                at = end
        src = src[:at] + block + src[at:]
        injected.append(cid)

    out = src
    io.open(js_path, "w", encoding="utf-8", newline="").write(out)
    print("injected: %d -> %s" % (len(injected), ", ".join(injected) if injected else "-"))
    if skipped:
        print("skipped(already): %s" % ", ".join(skipped))
    if missing:
        print("MISSING_CHAPTERS: %s" % ", ".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
