#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""逐题生成 1200x630 分享封面（JPEG），输出 assets/og/q/<id>.jpg。

为什么是静态图：微信/Google/Twitter 等爬虫不会执行页面里的 Canvas 分享卡，
必须有可直接抓取的 og:image。1713 道题一次生成、随 Pages 一起发布；
题库更新后重跑本脚本即可（仅新增/改标题的题会变，全量重生成也很便宜）。

用法：
  python3 tools/gen-og-images.py            # 全量
  python3 tools/gen-og-images.py --only 62  # 只生成某一题
  python3 tools/gen-og-images.py --limit 5  # 冒烟
"""
from __future__ import annotations
import argparse, json, os, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "published.json"
OUT = ROOT / "assets" / "og" / "q"
W, H = 1200, 630

# macOS 自带中文字体；Linux/CI 上若只生成一次可换成 Noto Sans CJK。
FONT_PATHS = [
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
]

def find_font():
    for p in FONT_PATHS:
        if os.path.exists(p):
            return p
    raise SystemExit("找不到中文字体，请安装 Noto Sans CJK 或改 FONT_PATHS")

FONT = find_font()

def font(size):
    return ImageFont.truetype(FONT, size, index=0)

def strip_md(s):
    s = str(s or "")
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"[`*_>#|]", "", s)
    return re.sub(r"\s+", " ", s).strip()

def text_w(draw, s, f):
    b = draw.textbbox((0, 0), s, font=f)
    return b[2] - b[0]

def wrap(draw, text, f, max_w, max_lines):
    """按字符/单词粗略断行；中文逐字，英文尽量在空格处断。"""
    text = strip_md(text)
    if not text:
        return [""]
    lines, cur = [], ""
    for ch in text:
        trial = cur + ch
        if text_w(draw, trial, f) <= max_w:
            cur = trial
            continue
        if not cur:
            cur = ch
            continue
        # 英文单词尽量整体换行
        if re.search(r"[A-Za-z0-9]", ch) and " " in cur:
            head, _, tail = cur.rpartition(" ")
            lines.append(head)
            cur = tail + ch
        else:
            lines.append(cur)
            cur = ch
        if len(lines) >= max_lines:
            break
    if cur:
        lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1][:-1] + "…"
    elif len(lines) == max_lines:
        # 还有剩余内容但已达上限
        consumed = "".join(lines)
        if len(consumed) < len(text):
            lines[-1] = lines[-1][:-1] + "…"
    return lines

def make_image(q, cat_path):
    # 纯色底 + 少量大色块：JPEG 压缩率比逐像素渐变好得多（40KB → ~20KB）
    img = Image.new("RGB", (W, H), "#0b1220")
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([W - 520, -300, W + 220, 360], fill=(37, 99, 235, 72))
    d.ellipse([W - 340, 140, W + 260, 620], fill=(14, 165, 233, 40))
    d.rounded_rectangle([0, 0, W, 8], radius=0, fill=(37, 99, 235, 255))
    for i in range(8):
        x = 940 + i * 38
        d.line([(x, 0), (x - 300, H)], fill=(255, 255, 255, 9), width=1)
    # 顶部品牌
    f_brand = font(30)
    d.rounded_rectangle([64, 52, 250, 106], radius=14, fill=(37, 99, 235, 235))
    d.text((88, 61), "IT 面试题库", font=f_brand, fill="#ffffff")
    f_id = font(28)
    d.text((W - 72 - text_w(d, "#%s" % q.get("id"), f_id), 64), "#%s" % q.get("id"), font=f_id, fill=(147, 197, 253, 255))
    # 分类 / 难度 / 题型
    f_meta = font(25)
    meta = " · ".join([x for x in [cat_path, q.get("difficulty"), q.get("type")] if x])
    d.text((66, 148), "  ".join(meta[:2]) if False else meta[:56], font=f_meta, fill=(191, 219, 254, 255))
    # 标题：自动选字号 / 行数
    title = strip_md(q.get("title"))
    for size, max_lines in [(52, 3), (46, 3), (40, 4), (34, 4)]:
        f_title = font(size)
        lines = wrap(d, title, f_title, W - 132, max_lines)
        if len(lines) <= 3 or size <= 34:
            break
    y = 208
    line_h = int(size * 1.42)
    for line in lines:
        d.text((66, y), line, font=f_title, fill="#f8fafc")
        y += line_h
    # 强调线
    d.rounded_rectangle([66, 500, 210, 507], radius=4, fill=(56, 189, 248, 255))
    # 底部
    f_foot = font(24)
    d.text((66, 548), "面试题 · 参考答案", font=f_foot, fill=(203, 213, 225, 255))
    f_url = font(22)
    url = "itinterview.com.cn"
    d.text((W - 66 - text_w(d, url, f_url), 550), url, font=f_url, fill=(148, 163, 184, 255))
    # 右下角小标签
    src = q.get("source") or ""
    host = ""
    m = re.match(r"https?://([^/]+)", str(src))
    if m:
        host = m.group(1).replace("www.", "")[:34]
    if host:
        f_src = font(18)
        d.text((W - 66 - text_w(d, "来源 " + host, f_src), 590), "来源 " + host, font=f_src, fill=(100, 116, 139, 255))
    return img

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=int, default=0)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    data = json.loads(SRC.read_text(encoding="utf-8"))
    cats = {c["id"]: c for c in data.get("categories", [])}
    def cat_path(cid):
        out, seen = [], set()
        while cid in cats and cid not in seen:
            seen.add(cid); out.append(cats[cid].get("name", "")); cid = cats[cid].get("parentId")
        return " / ".join(reversed([x for x in out if x]))
    OUT.mkdir(parents=True, exist_ok=True)
    qs = data.get("questions", [])
    if args.only:
        qs = [q for q in qs if int(q.get("id", 0)) == args.only]
    if args.limit:
        qs = qs[:args.limit]
    total = 0
    for i, q in enumerate(qs, 1):
        img = make_image(q, cat_path(q.get("categoryId")))
        # 1200x630 排版后缩到 1000x525：社交卡片仍清晰，单张 ~23KB（1713 张约 39MB）
        img = img.resize((900, 472), Image.LANCZOS)
        p = OUT / (str(q.get("id")) + ".jpg")
        img.save(p, "JPEG", quality=72, optimize=True, progressive=True)
        total += p.stat().st_size
        if i % 100 == 0 or i == len(qs):
            print("  %d/%d  %.1f KB/张" % (i, len(qs), total / i / 1024))
    print("[OK] 生成 %d 张，合计 %.1f MB" % (len(qs), total / 1024 / 1024))

if __name__ == "__main__":
    main()
