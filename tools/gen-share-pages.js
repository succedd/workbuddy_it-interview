/* =========================================================================
 *  tools/gen-share-pages.js  —  为每道题生成静态微信分享页 /q/<id>.html
 *  用法：node tools/gen-share-pages.js [published.json 路径或 URL]
 *  默认：优先读取 ./data/published.json，若不含 questions 则从线上拉取
 *  输出：q/<id>.html（含 og:title/description/image/url + 跳转脚本）
 * ========================================================================= */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const OUT_DIR = path.join(__dirname, "..", "q");
const SITE = "https://it-interview.is-a.dev";
const OG_IMAGE = `${SITE}/assets/og-cover.png`;
const DEFAULT_DESC = "IT 面试题库 · 按岗位/年限/难度刷题 · 答案解析 · 收藏与错题重练";

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripMd(s) {
  return String(s || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(q) {
  let txt = stripMd(q.answer || q.body || "");
  if (!txt) return DEFAULT_DESC;
  txt = txt.replace(/\s+/g, " ");
  if (txt.length > 160) txt = txt.slice(0, 157) + "…";
  return txt;
}

function page(q) {
  const title = esc(`${q.title} · IT面试题库`);
  const desc = esc(excerpt(q));
  const qUrl = `${SITE}/q/${q.id}.html`;
  const hashUrl = `/#/question/${q.id}`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:url" content="${qUrl}">
  <meta property="og:site_name" content="IT面试题库">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="canonical" href="${qUrl}">
  <style>body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#475569;text-align:center;padding:60px 20px 40px;line-height:1.6}</style>
  <script>location.replace("${hashUrl}");</script>
</head>
<body>
  <h1>${esc(q.title)}</h1>
  <p>正在跳转至 IT 面试题库…</p>
  <p>若未自动跳转，<a href="${hashUrl}">请点击此处</a>。</p>
</body>
</html>
`;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    lib.get(url, res => {
      if (res.statusCode >= 300 && res.headers.location) return fetchJson(res.headers.location).then(resolve, reject);
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    }).on("error", reject);
  });
}

async function main() {
  const arg = process.argv[2];
  let data;
  if (arg) {
    if (/^https?:\/\//.test(arg)) data = await fetchJson(arg);
    else data = JSON.parse(fs.readFileSync(arg, "utf8"));
  } else {
    const localPath = path.join(__dirname, "..", "data", "published.json");
    if (fs.existsSync(localPath)) data = JSON.parse(fs.readFileSync(localPath, "utf8"));
    else data = await fetchJson(`${SITE}/data/published.json`);
  }
  const questions = Array.isArray(data.questions) ? data.questions : [];
  if (!questions.length) throw new Error("published.json 中没有 questions 字段或为空");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  let written = 0;
  for (const q of questions) {
    if (!q.id || !q.title) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${q.id}.html`), page(q), "utf8");
    written++;
  }
  console.log(`已生成 ${written} 个分享页：${path.relative(process.cwd(), OUT_DIR)}/<id>.html`);
}

main().catch(e => { console.error(e); process.exit(1); });
