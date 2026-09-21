#!/usr/bin/env node
/**
 * 组装 Cloudflare Pages 的发布目录 dist/
 * ---------------------------------------------------------------
 * 为什么需要这个脚本：
 *   本仓库根目录同时住着「站点」和「开发流水线」两类东西 —— 前者要被发布
 *   （index.html / js / css / data / q / …），后者绝不能上网（tools/ 里有
 *   大量运维脚本、cloudflare/ 里有后端 Worker 与建表语句、还有 HANDOVER.md
 *   这种内部交接卡）。Cloudflare Pages 若直接用仓库根做输出目录，这些内部
 *   文件会一并被上传（虽然 _worker.js 的 INTERNAL_RE 会在运行时把它们 404
 *   掉，但那是「上传后再挡」，不如根本不传）。
 *
 *   所以改成「白名单拷贝」：只把站点必需的东西复制进 dist/，
 *   再把 cloudflare/pages/_worker.js 放到 dist 根（Pages 只认根目录的
 *   _worker.js 作为高级模式 Worker）。
 *
 * 用法：
 *   node tools/build-pages.mjs            # 生成 dist/
 *   node tools/build-pages.mjs --check    # 只校验源文件是否齐备，不写盘
 *
 * Cloudflare Pages 构建设置：
 *   构建命令   node tools/build-pages.mjs
 *   输出目录   dist
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DIST = path.join(ROOT, "dist");

// 站点必需：根目录散装文件
const ROOT_FILES = [
  "index.html",
  "manifest.json",
  "sw.js",
  "robots.txt",
  "sitemap.xml",
  "api-endpoints.json",
  "404.html"
];

// 站点必需：整目录拷贝
const ROOT_DIRS = ["assets", "css", "data", "js", "q", "vendor"];

// 高级模式 Worker：必须落在 dist 根（Pages 只认部署目录根的 _worker.js）
const WORKER_SRC = path.join(ROOT, "cloudflare", "pages", "_worker.js");
const WORKER_DEST = path.join(DIST, "_worker.js");

const CHECK_ONLY = process.argv.includes("--check");

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function walk(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += walk(p);
    else n += 1;
  }
  return n;
}

// ---------- 1) 校验 ----------
if (!fs.existsSync(WORKER_SRC)) fail("缺少 cloudflare/pages/_worker.js");
const missing = [];
for (const f of ROOT_FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) missing.push(f);
}
for (const d of ROOT_DIRS) {
  if (!fs.existsSync(path.join(ROOT, d))) missing.push(d + "/");
}
if (missing.length) fail("缺少站点文件：" + missing.join(", "));

console.log("[OK] 源文件齐备（" + ROOT_FILES.length + " 个根文件 + " + ROOT_DIRS.length + " 个目录）");

if (CHECK_ONLY) {
  console.log("[OK] --check 模式，未写盘");
  process.exit(0);
}

// ---------- 2) 清空并重建 dist ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ---------- 3) 白名单拷贝 ----------
let files = 0;
for (const f of ROOT_FILES) {
  copyFile(path.join(ROOT, f), path.join(DIST, f));
  files += 1;
}
for (const d of ROOT_DIRS) {
  const src = path.join(ROOT, d);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.isFile()) {
      copyFile(path.join(src, e.name), path.join(DIST, d, e.name));
      files += 1;
    }
  }
  // q/ 下可能有子目录（正常情况下没有），兜底递归
  for (const sub of fs.readdirSync(src, { withFileTypes: true })) {
    if (sub.isDirectory()) {
      const subSrc = path.join(src, sub.name);
      const subDest = path.join(DIST, d, sub.name);
      fs.mkdirSync(subDest, { recursive: true });
      const cp = (from, to) => {
        for (const e of fs.readdirSync(from, { withFileTypes: true })) {
          const fp = path.join(from, e.name);
          const tp = path.join(to, e.name);
          if (e.isDirectory()) {
            fs.mkdirSync(tp, { recursive: true });
            cp(fp, tp);
          } else {
            fs.copyFileSync(fp, tp);
            files += 1;
          }
        }
      };
      cp(subSrc, subDest);
    }
  }
}

// ---------- 4) 放置高级模式 Worker ----------
copyFile(WORKER_SRC, WORKER_DEST);
files += 1;

// ---------- 5) 自检：内部文件绝不能进 dist ----------
const FORBIDDEN = ["tools", "cloudflare", "netlify", "HANDOVER.md", "README.md", "netlify.toml", ".git"];
const leaked = FORBIDDEN.filter((n) => fs.existsSync(path.join(DIST, n)));
if (leaked.length) fail("dist/ 里出现内部文件：" + leaked.join(", "));

const total = walk(DIST);
console.log("[OK] dist/ 已生成：" + total + " 个文件（拷贝计数 " + files + "）");
console.log("[OK] 内部目录未泄漏（tools/ cloudflare/ netlify/ HANDOVER.md README.md 均不在 dist）");
console.log("[OK] _worker.js 已就位于 dist 根（Pages 高级模式）");
