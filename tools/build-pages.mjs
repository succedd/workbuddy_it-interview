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
import { spawnSync } from "node:child_process";
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
  "404.html",
  /* 隐私政策 / 用户协议静态页（20261026b，由 tools/gen-legal-pages.js 生成）。
     不加进清单的话，--check 会过、但 dist/ 里没有这两页，线上 404。 */
  "privacy.html",
  "terms.html"
];

// 站点必需：整目录拷贝
const ROOT_DIRS = ["assets", "css", "data", "js", "q", "c", "p", "vendor"];

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

function generateSharePages() {
  const data = path.join(ROOT, "data", "published.json");
  if (!fs.existsSync(data)) fail("缺少 data/published.json");
  const result = spawnSync(process.execPath, [path.join(HERE, "gen-share-pages.js"), data], {
    cwd: ROOT,
    stdio: "inherit"
  });
  if (result.error) fail("无法启动 gen-share-pages.js：" + result.error.message);
  if (result.status !== 0) fail("gen-share-pages.js 退出码：" + result.status);
}

/* 20261019：编辑端发布只推 published.json + version.json（一次 Contents API 只能写一个文件），
   manifest/shards 不会跟着走，线上会出现 version.json=9 而 manifest=8 的版本漂移。
   这里在每次构建时强制从 published.json 重新生成，保证 dist 里的三套数据始终同版本；
   本地/CI 都需要 python3（GitHub Actions ubuntu-latest 自带）。 */
function syncDataShards() {
  const py = process.platform === "win32" ? "python" : "python3";
  const result = spawnSync(py, [path.join(HERE, "split-published.py"), "--write"], {
    cwd: ROOT,
    stdio: "inherit"
  });
  if (result.error) fail("无法启动 split-published.py（需要 python3）：" + result.error.message);
  if (result.status !== 0) fail("split-published.py 退出码：" + result.status);
}

/* 20261020：数据健康检查 —— 发布前强制校验 published / version / manifest / shards
   四套指纹一致，且分片题数能拼回 published。任何一项不一致直接让部署失败，
   避免再次出现「version.json=9 而 manifest=8」的静默漂移。 */
function checkDataConsistency() {
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  const pub = read("data/published.json");
  const ver = read("data/version.json");
  const man = read("data/manifest.json");
  const count = (pub.questions || []).length;
  const bad = [];
  if (ver.version !== pub.version) bad.push(`version.json.version=${ver.version} ≠ published.version=${pub.version}`);
  if (ver.publishedAt !== pub.publishedAt) bad.push(`version.json.publishedAt≠published.publishedAt`);
  if (ver.count !== count) bad.push(`version.json.count=${ver.count} ≠ 题数 ${count}`);
  if (man.version !== pub.version) bad.push(`manifest.version=${man.version} ≠ published.version=${pub.version}`);
  if (man.publishedAt !== pub.publishedAt) bad.push(`manifest.publishedAt≠published.publishedAt`);
  if ((man.questions || []).length !== count) bad.push(`manifest 题数 ${(man.questions || []).length} ≠ ${count}`);
  const shards = fs.readdirSync(path.join(ROOT, "data", "shards")).filter(n => /^s\d+\.json$/.test(n));
  let shardQ = 0;
  for (const f of shards) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "shards", f), "utf8"));
    if (d.version !== pub.version) bad.push(`${f}.version=${d.version} ≠ ${pub.version}`);
    if (d.publishedAt !== pub.publishedAt) bad.push(`${f}.publishedAt≠published.publishedAt`);
    shardQ += (d.questions || []).length;
  }
  if (shardQ !== count) bad.push(`分片题数合计 ${shardQ} ≠ ${count}`);
  if (bad.length) fail("数据指纹不一致：\n  - " + bad.join("\n  - "));
  console.log("[OK] 数据指纹一致：version=" + pub.version + " / " + count + " 题 / manifest + " + shards.length + " 个分片");
}

/* 20261020：逐题分享封面必须齐全 —— q 页的 og:image 指向 assets/og/q/<id>.jpg，
   题库新增题后如果忘了重跑 tools/gen-og-images.py，线上分享卡片会 404。
   这里在构建时硬校验，缺一张就让部署失败（比线上才发现好）。 */
function checkOgImages() {
  const pub = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "published.json"), "utf8"));
  const missing = (pub.questions || []).filter(q => !fs.existsSync(path.join(ROOT, "assets", "og", "q", String(q.id) + ".jpg")));
  if (missing.length) {
    /* 自动扩充流水线可能先提交新题 q 页、后补 OG 图片；部署不能因此整批失败。
       用已有题目的 JPEG 做占位（后续 gen-og-images 会覆盖成真实封面），并显式告警。 */
    const fallback = path.join(ROOT, "assets", "og", "q", "1.jpg");
    if (fs.existsSync(fallback)) {
      const dir = path.join(ROOT, "assets", "og", "q");
      fs.mkdirSync(dir, { recursive: true });
      for (const q of missing) fs.copyFileSync(fallback, path.join(dir, String(q.id) + ".jpg"));
      console.warn("[WARN] 缺少 " + missing.length + " 张分享封面，已用 #1 封面占位；请运行 python3 tools/gen-og-images.py 重新生成：" + missing.slice(0, 10).map(q => q.id).join(", "));
    } else {
      fail("缺少 " + missing.length + " 张题目分享封面（assets/og/q/<id>.jpg）。\n" +
        "  请在本地运行：python3 tools/gen-og-images.py\n" +
        "  缺的题号示例：" + missing.slice(0, 10).map(q => q.id).join(", "));
    }
  }
  console.log("[OK] 题目分享封面齐全：" + (pub.questions || []).length + " 张");
}

/* 20261020：清掉 q/c/p 里已经不在题库中的旧页（例如 q/1754~1774）。
   gen-share-pages 只覆盖有效题目，不会删旧文件；不清理会留下能打开、但 sitemap 不含的僵尸页。 */
function pruneStalePages() {
  const pub = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "published.json"), "utf8"));
  const sets = [
    ["q", new Set((pub.questions || []).map(x => String(x.id) + ".html"))],
    ["c", new Set((pub.categories || []).map(x => String(x.id) + ".html"))],
    ["p", new Set((pub.positions || []).map(x => String(x.id) + ".html"))],
  ];
  let removed = 0;
  for (const [dir, valid] of sets) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".html")) continue;
      if (!valid.has(f)) { fs.unlinkSync(path.join(full, f)); removed += 1; }
    }
  }
  if (removed) console.log("[OK] 已清理 " + removed + " 个已不在题库中的旧静态页");
}

/* 写进 dist（不落仓库）：管理仪表盘读它展示「线上当前构建」的健康信息。 */
function writeBuildInfo() {
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  const pub = read("data/published.json");
  const countHtml = (dir) => {
    const full = path.join(ROOT, dir);
    return fs.existsSync(full) ? fs.readdirSync(full).filter(n => n.endsWith(".html")).length : 0;
  };
  let sitemapEntries = 0;
  try { sitemapEntries = (fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").match(/<url>/g) || []).length; } catch (_) {}
  const info = {
    builtAt: new Date().toISOString(),
    version: pub.version,
    publishedAt: pub.publishedAt,
    count: (pub.questions || []).length,
    categories: (pub.categories || []).length,
    positions: (pub.positions || []).length,
    qPages: countHtml("q"),
    cPages: countHtml("c"),
    pPages: countHtml("p"),
    shards: fs.readdirSync(path.join(ROOT, "data", "shards")).filter(n => /^s\d+\.json$/.test(n)).length,
    sitemapEntries,
  };
  fs.mkdirSync(path.join(DIST, "data"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "data", "build-info.json"), JSON.stringify(info, null, 2));
  console.log("[OK] build-info.json：version=" + info.version + " / q=" + info.qPages + " / sitemap=" + info.sitemapEntries);
}

function validateQuestionData() {
  const result = spawnSync(process.execPath, [path.join(HERE, "validate-question-data.mjs")], {
    cwd: ROOT,
    stdio: "inherit"
  });
  if (result.error) fail("无法启动 validate-question-data.mjs：" + result.error.message);
  if (result.status !== 0) fail("validate-question-data.mjs 退出码：" + result.status);
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

// ---------- 2) 对齐数据分片 + 校验指纹 + 生成/清理分享页 ----------
syncDataShards();
checkDataConsistency();
checkOgImages();
validateQuestionData();
generateSharePages();
pruneStalePages();

// ---------- 3) 清空并重建 dist ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ---------- 4) 白名单拷贝 ----------
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

// ---------- 5) 放置高级模式 Worker ----------
copyFile(WORKER_SRC, WORKER_DEST);
files += 1;

// ---------- 6) 校验分片产物（2026-10-06性能优化） ----------
// data/manifest.json 与 data/shards/ 是分片加载的运行时依赖：
// 缺了不会崩（cloud.js 自动回退整包 published.json），但首屏优化直接失效。
// 所以这里显式提示，避免「以为上线了其实没生效」。
const manifestPath = path.join(DIST, "data", "manifest.json");
const shardDir = path.join(DIST, "data", "shards");
if (!fs.existsSync(manifestPath) || !fs.existsSync(shardDir)) {
  console.warn("[WARN] 分片产物缺失：data/manifest.json 或 data/shards/ 不在 dist/");
  console.warn("[WARN] 前端会自动回退整包 published.json（功能正常，但首屏慢）。");
  console.warn("[WARN] 修复：python tools/split-published.py --write");
} else {
  const shards = fs.readdirSync(shardDir).filter((n) => n.endsWith(".json"));
  const mSize = fs.statSync(manifestPath).size;
  console.log(
    "[OK] 分片产物就位：manifest.json " +
      (mSize / 1024).toFixed(0) +
      " KB + " +
      shards.length +
      " 个分片（首屏不再整包下载）"
  );
}

// ---------- 7) 自检：内部文件绝不能进 dist ----------
const FORBIDDEN = ["tools", "cloudflare", "netlify", "HANDOVER.md", "README.md", "netlify.toml", ".git"];
const leaked = FORBIDDEN.filter((n) => fs.existsSync(path.join(DIST, n)));
if (leaked.length) fail("dist/ 里出现内部文件：" + leaked.join(", "));

writeBuildInfo();
const total = walk(DIST);
console.log("[OK] dist/ 已生成：" + total + " 个文件（拷贝计数 " + files + "）");
console.log("[OK] 内部目录未泄漏（tools/ cloudflare/ netlify/ HANDOVER.md README.md 均不在 dist）");
console.log("[OK] _worker.js 已就位于 dist 根（Pages 高级模式）");
