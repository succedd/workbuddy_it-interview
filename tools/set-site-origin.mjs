#!/usr/bin/env node
/* =========================================================================
 *  tools/set-site-origin.mjs — 一条命令切换站点对外域名
 *
 *  用法：
 *    node tools/set-site-origin.mjs <new-origin>          # 预览（默认 dry-run）
 *    node tools/set-site-origin.mjs <new-origin> --apply  # 实际写入
 *
 *  例：node tools/set-site-origin.mjs https://it-interview-889.pages.dev --apply
 *
 *  为什么有这个脚本（2026-09-21）：
 *    is-a.dev 依据服务条款第 4 条第 16 项（Any website that is orientated to
 *    courses）下架了本站域名 it-interview.is-a.dev，原域名 302 到
 *    https://is-a.dev/available。站点因此落到 Cloudflare Pages 的
 *    it-interview-889.pages.dev，且**将来还会再换一次自定义域**。
 *    域名散落在 index.html / 404.html / sitemap.xml / robots.txt / 工具常量
 *    以及 1209 个 q/*.html 分享页里，手改必然漏。本脚本把它们收敛为一条命令。
 *
 *  ⚠️ 只处理「功能性引用」：
 *      - 浏览器真正会去解析、跳转、抓取的 URL（canonical / og:url / og:image /
 *        sitemap loc / robots Sitemap 行 / 分享页里的跳转与 JSON-LD / 工具里的常量）
 *    **不碰文档里的历史叙述**（HANDOVER.md、README.md、各 README、部署指南）。
 *    那些地方写的是「某域名被下架」这类事实，替换掉就变成假话了，由人工维护。
 *
 *  幂等：重复运行结果一致；已替换过的文件再跑会显示「0 处改动」。
 * ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* 历史上用过、需要被替换掉的站点域名（按长度降序，避免子串互相影响） */
const KNOWN_OLD_HOSTS = ["it-interview.is-a.dev"];

/* 功能性文件（相对仓库根） */
const TARGET_FILES = [
  "index.html",
  "404.html",
  "sitemap.xml",
  "robots.txt",
  "assets/og-cover-src.html",
  "tools/gen-share-pages.js",
  "tools/pages-guard-test.mjs",
  "netlify/public/index.html",
];

/* 整目录处理：q/*.html（每题一个 SEO 落地页） */
const TARGET_DIRS = ["q"];

function parseArgs() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const originArg = argv.find((a) => /^https?:\/\//i.test(a));
  if (!originArg) {
    console.error("用法: node tools/set-site-origin.mjs <new-origin> [--apply]");
    console.error("例  : node tools/set-site-origin.mjs https://it-interview-889.pages.dev --apply");
    process.exit(2);
  }
  let origin;
  try {
    origin = new URL(originArg);
  } catch {
    console.error(`新域名不是合法 URL: ${originArg}`);
    process.exit(2);
  }
  return { apply, origin: origin.origin, host: origin.host };
}

/* 把一段文本里的所有旧域名换成新域名；返回 [新文本, 改动数] */
function rewrite(text, newHost) {
  let out = text;
  let n = 0;
  for (const oldHost of KNOWN_OLD_HOSTS) {
    if (oldHost === newHost) continue;
    for (const proto of ["https", "http"]) {
      const from = `${proto}://${oldHost}`;
      const to = `https://${newHost}`;
      const parts = out.split(from);
      n += parts.length - 1;
      out = parts.join(to);
    }
    /* 剩余裸域名（如 JSON-LD 里、文案里的 "it-interview.is-a.dev"） */
    const parts = out.split(oldHost);
    n += parts.length - 1;
    out = parts.join(newHost);
  }
  return [out, n];
}

function collectTargets() {
  const files = [];
  for (const rel of TARGET_FILES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) files.push(abs);
    else console.warn(`  · 跳过（不存在）: ${rel}`);
  }
  for (const dir of TARGET_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const name of fs.readdirSync(absDir)) {
      if (name.endsWith(".html")) files.push(path.join(absDir, name));
    }
  }
  return files;
}

function main() {
  const { apply, origin, host } = parseArgs();
  console.log(`目标域名: ${origin}`);
  console.log(`模式    : ${apply ? "写入（--apply）" : "预览（dry-run，加 --apply 才落盘）"}`);
  console.log("");

  const files = collectTargets();
  let touched = 0;
  let total = 0;
  const samples = [];

  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch (e) {
      console.warn(`  ! 读取失败 ${rel}: ${e.message}`);
      continue;
    }
    const [next, n] = rewrite(text, host);
    if (n === 0) continue;
    touched++;
    total += n;
    if (samples.length < 6) samples.push(`${rel}  (${n} 处)`);
    if (apply) {
      try {
        fs.writeFileSync(abs, next, "utf8");
      } catch (e) {
        console.error(`  ! 写入失败 ${rel}: ${e.message}`);
        process.exitCode = 1;
      }
    }
  }

  console.log(`扫描文件: ${files.length} 个`);
  console.log(`命中文件: ${touched} 个，共 ${total} 处引用`);
  if (samples.length) {
    console.log("示例    :");
    for (const s of samples) console.log(`  · ${s}`);
  }
  console.log("");
  if (!apply && total > 0) {
    console.log("这是预览。确认无误后加 --apply 实际写入。");
  } else if (apply && total > 0) {
    console.log("已写入。下一步：");
    console.log("  1) node tools/gen-share-pages.js   （如题库有变动需要重建 q/*.html 时）");
    console.log("  2) 升 index.html 与 sw.js 的缓存版本号并推送 release，触发自动部署");
    console.log("  3) 记得同步 cloudflare/worker.js 的 CORS 白名单与 SITE_ORIGIN");
  } else {
    console.log("没有需要替换的引用（可能已切换过该域名）。");
  }
}

main();
