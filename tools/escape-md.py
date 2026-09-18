#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
escape-md.py —— 把「期望在页面上看到的确切 markdown 文本」转义成可安全注入
it-interview 教程 JS 模板字符串的形式。

契约：输入 md 里写的就是最终要渲染出来的文字（原样）。
工具做三件事：
  1) ${C} / ${F} 占位符原样保留 —— 这是模板里唯一允许的插值
  2) 字面 ${ 转义为 \\${     —— 否则会被当成模板插值
  3) 每个反斜杠加倍          —— 否则 \\G 会渲染成 G，行尾 \\ 会吞掉换行

用法:
    python tools/escape-md.py in.md            # 原地转换
    python tools/escape-md.py in.md out.md     # 输出到 out.md
"""
import io
import re
import sys

PLACEHOLDER = re.compile(r"(\$\{[CF]\})")


def esc_segment(seg: str) -> str:
    return seg.replace("\\", "\\\\").replace("${", "\\${")


def escape_md(text: str) -> str:
    parts = PLACEHOLDER.split(text)
    out = []
    for i, p in enumerate(parts):
        # split 后奇数位置是捕获到的占位符
        if i % 2 == 1 and PLACEHOLDER.fullmatch(p):
            out.append(p)
        else:
            out.append(esc_segment(p))
    return "".join(out)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    raw = io.open(src, encoding="utf-8", newline="").read()
    fixed = escape_md(raw)
    io.open(dst, "w", encoding="utf-8", newline="").write(fixed)
    n_bs = raw.count("\\")
    n_ph = len(PLACEHOLDER.findall(raw))
    print("escaped: %s -> %s  (backslashes: %d, placeholders kept: %d)"
          % (src, dst, n_bs, n_ph))
    return 0


if __name__ == "__main__":
    sys.exit(main())
