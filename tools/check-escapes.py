#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-escapes.py —— 检查 it-interview 教程 JS 文件的转义与结构完整性。

用法:
    python tools/check-escapes.py js/docs/dba.js [js/docs/xxx.js ...]

检查项:
  1) 残缺插值 $C} / $F}（少左花括号）—— 页面上会渲染出裸文本 "$C}"
  2) 裸反引号（会截断 body 模板字符串，导致整文件语法崩溃）
  3) 非法插值 ${x}（只允许 ${C} 与 ${F}）
  4) 每章代码围栏 ${F} 计数是否为偶数（奇数说明围栏未闭合）

背景：body 内容是反引号模板字符串，行内代码写成 ${C}code${C}，
代码围栏写成 ${F}lang ... ${F}。源码里除了"结构性反引号"（body 起止定界符）
和注释，不应出现任何真实反引号字符。
"""
import io
import re
import sys

STRUCTURAL_OK = re.compile(r"^\s*(body:\s*)?`\s*,?\s*$")   # body 起止定界符行（含 body: ` 与行尾逗号）
CONST_DEF = re.compile(r"^\s*const\s+[FC]\s*=")             # const F / const C 定义行（注释里可能举例反引号）
COMMENT_LINE = re.compile(r"^\s*(//|\*|/\*)")      # 注释行（允许出现反引号说明）


def check(path: str) -> int:
    src = io.open(path, encoding="utf-8", newline="").read()
    lines = src.splitlines()
    problems = 0

    # 1) 残缺插值
    for m in re.finditer(r"\$[CF]\}", src):
        ln = src.count("\n", 0, m.start()) + 1
        print("  [1] 残缺插值 %s  第 %d 行" % (m.group(0), ln))
        problems += 1

    # 2) 裸反引号
    for i, line in enumerate(lines, 1):
        if (COMMENT_LINE.match(line) or STRUCTURAL_OK.match(line)
                or CONST_DEF.match(line)):
            continue
        # 去掉 body 起止定界符形态（行尾只有反引号，如 "          `" 已由上面过滤）
        if "`" in line:
            print("  [2] 裸反引号  第 %d 行: %s" % (i, line.strip()[:90]))
            problems += 1

    # 3) 非法插值
    for m in re.finditer(r"(?<!\\)\$\{(?!C\}|F\})", src):
        ln = src.count("\n", 0, m.start()) + 1
        print('  [3] 非法插值 "${%s"  第 %d 行' % (
            src[m.end():m.end() + 10].split("}")[0], ln))
        problems += 1

    # 4) 每章 ${F} 配平
    marks = [(m.start(), m.group(1))
             for m in re.finditer(r'id:\s*"([A-Za-z0-9_\-]+)"', src)]
    for idx, (pos, name) in enumerate(marks):
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(src)
        span = src[pos:end]
        n = span.count("${F}")
        if n % 2:
            print("  [4] 代码围栏奇数（%d 个 ${F}）  章节 %s" % (n, name))
            problems += 1

    print("  %s -> %s" % (path, "OK" if problems == 0 else "%d 个问题" % problems))
    return problems


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    total = 0
    for p in sys.argv[1:]:
        total += check(p)
    print("TOTAL_PROBLEMS: %d" % total)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
