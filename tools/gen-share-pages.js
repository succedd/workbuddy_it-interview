/* =========================================================================
 *  tools/gen-share-pages.js  —  为每道题生成静态分享/SEO 落地页 /q/<id>.html
 *  用法：node tools/gen-share-pages.js [published.json 路径或 URL]
 *  默认：优先读取 ./data/published.json，若不含 questions 则从线上拉取
 *  输出：q/<id>.html（og 标签 + 题目正文/答案全文 + QAPage JSON-LD + 自动跳回 SPA）
 *
 *  2026-08-29 重构：由「OG 卡片 + 立即跳转」的壳页升级为可被搜索引擎收录的
 *  内容页——正文/答案在 HTML 源码里真实可抓（百度不执行 JS），同时保留
 *  微信分享卡片所需的 og 标签。
 *  2026-08-30 体验修正：取消 2.5s 自动跳转——扫码/点卡用户先完整读到题目与答案，
 *  想刷题/收藏时再点 CTA 手动进入 SPA；消除「看题目→动效/重载→又看一遍题目」的
 *  绕圈体验（反馈来源：手机扫码首访）。
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

/* ---- 极简安全 Markdown → HTML：先整体转义，再基于已转义文本加标签，
        因此题目内容里即使混入 <script>/onerror 也只会原样显示，不会执行 ---- */
function mdToHtml(src) {
  const text = esc(String(src || "").replace(/\r\n/g, "\n"));
  const blocks = [];
  /* 先摘出围栏代码块，避免其中内容被后续规则改写 */
  const withPlaceholders = text.replace(/```([a-zA-Z0-9+#-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre><code${lang ? ` class="language-${lang.toLowerCase()}"` : ""}>${code.replace(/\n$/, "")}</code></pre>`);
    return `\u0000BLOCK${blocks.length - 1}\u0000`;
  });

  const inline = (s) => s
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  const lines = withPlaceholders.split("\n");
  const out = [];
  let list = null; /* "ul" | "ol" | null */
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^[-*+]\s+(.*)$/.exec(line);
    const ol = /^\d+[.、)]\s+(.*)$/.exec(line);
    const quote = /^&gt;\s?(.*)$/.exec(line);
    if (/^\u0000BLOCK\d+\u0000$/.test(line.trim())) { closeList(); out.push(line.trim()); continue; }
    if (h) { closeList(); out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); continue; }
    if (ul) { if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(ul[1])}</li>`); continue; }
    if (ol) { if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(ol[1])}</li>`); continue; }
    if (quote) { closeList(); out.push(`<blockquote>${inline(quote[1])}</blockquote>`); continue; }
    if (!line.trim()) { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n").replace(/\u0000BLOCK(\d+)\u0000/g, (_, i) => blocks[+i] || "");
}

function metaChips(q) {
  const chips = [];
  if (q.difficulty) chips.push(`<span class="chip diff">${esc(q.difficulty)}</span>`);
  if (q.type) chips.push(`<span class="chip">${esc(q.type)}</span>`);
  (q.positionNames || []).slice(0, 4).forEach(p => chips.push(`<span class="chip">${esc(p)}</span>`));
  (q.tags || []).slice(0, 6).forEach(t => chips.push(`<span class="chip tag">${esc(t)}</span>`));
  return chips.join("");
}

function jsonLd(q) {
  const data = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: String(q.title || ""),
      text: stripMd(q.body || q.title || ""),
      answerCount: q.answer ? 1 : 0,
      datePublished: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
      author: { "@type": "Organization", name: "IT面试题库" },
      acceptedAnswer: q.answer ? {
        "@type": "Answer",
        text: stripMd(q.answer),
        url: `${SITE}/#/question/${q.id}`,
      } : undefined,
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function page(q) {
  const title = esc(`${q.title} · IT面试题库`);
  const desc = esc(excerpt(q));
  const qUrl = `${SITE}/q/${q.id}.html`;
  const hashUrl = `${SITE}/#/question/${q.id}`;
  const bodyHtml = q.body ? mdToHtml(q.body) : "";
  const answerHtml = q.answer ? mdToHtml(q.answer) : "";
  /* 读完引导条：有分类的题连刷同类（含子分类），无分类的退回题目页 */
  const catId = parseInt(q.categoryId, 10);
  const guideUrl = catId ? `${SITE}/#/practice?scope=cat&cat=${catId}&mode=random` : hashUrl;
  const guideText = catId
    ? "这道题看完了？<b>连刷同类题</b>，趁热打铁效果最好"
    : "这道题看完了？<b>去刷题模式</b>练起来，趁热打铁效果最好";
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
  <script type="application/ld+json">${jsonLd(q)}</script>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#334155;margin:0;background:#f8fafc;line-height:1.75; }
    .wrap { max-width:760px;margin:0 auto;padding:20px 16px 48px; }
    .brand { display:inline-flex;align-items:center;gap:8px;margin:18px 0 10px;color:#2563EB;font-weight:700;text-decoration:none;font-size:15px; }
    .brand .logo { display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#2563EB,#38bdf8);color:#fff;font-family:monospace;font-weight:800; }
    h1 { font-size:22px;line-height:1.45;color:#0f172a;margin:6px 0 10px; }
    .chips { margin:0 0 16px; }
    .chip { display:inline-block;background:#e2e8f0;color:#475569;border-radius:999px;padding:2px 10px;font-size:12px;margin:0 6px 6px 0; }
    .chip.diff { background:#dbeafe;color:#1d4ed8; }
    .chip.tag { background:#ecfdf5;color:#047857; }
    .card { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:14px 0; }
    .card h2 { font-size:13px;letter-spacing:2px;color:#94a3b8;margin:0 0 10px;font-weight:600; }
    .card img { max-width:100%;height:auto; }
    pre { background:#0f172a;color:#e2e8f0;border-radius:8px;padding:14px;overflow:auto;font-size:13px;line-height:1.6; }
    code { font-family:ui-monospace,Consolas,"JetBrains Mono",monospace; }
    p code, li code { background:#eef2f7;border-radius:4px;padding:1px 5px;font-size:.92em; }
    blockquote { margin:8px 0;padding:6px 12px;border-left:3px solid #93c5fd;background:#eff6ff;border-radius:0 8px 8px 0;color:#475569; }
    .cta { display:block;text-align:center;background:#2563EB;color:#fff;text-decoration:none;font-weight:600;border-radius:10px;padding:13px 16px;margin:22px 0 10px;font-size:15px; }
    .cta:active { background:#1d4ed8; }
    .jumpnote { text-align:center;color:#94a3b8;font-size:12px;margin-top:8px; }
    /* 底部读完引导条：默认藏在屏幕外，滚动接近文末时滑入（可关闭） */
    .guide { position:fixed;left:0;right:0;bottom:0;z-index:9;transform:translateY(110%);transition:transform .35s ease;background:#fff;border-top:1px solid #e2e8f0;box-shadow:0 -6px 24px rgba(15,23,42,.12);padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px; }
    .guide.show { transform:translateY(0); }
    .guide .g-text { flex:1;font-size:13px;color:#475569;line-height:1.5;min-width:0; }
    .guide .g-text b { color:#0f172a; }
    .guide .g-btn { flex-shrink:0;background:#2563EB;color:#fff;text-decoration:none;font-weight:600;font-size:13px;border-radius:999px;padding:9px 14px;white-space:nowrap; }
    .guide .g-btn:active { background:#1d4ed8; }
    .guide .g-x { flex-shrink:0;border:none;background:none;color:#94a3b8;font-size:18px;line-height:1;padding:6px 4px;cursor:pointer;font-family:inherit; }
    .guide .g-x:active { color:#475569; }
    .guide-on .wrap { padding-bottom:120px; }
    @media (prefers-reduced-motion: reduce) { .guide { transition:none; } }
    @media (prefers-color-scheme: dark) {
      :root { color-scheme: dark; }
      body { background:#0b1220;color:#cbd5e1; }
      h1 { color:#f1f5f9; }
      .card { background:#111a2c;border-color:#1e293b; }
      .card h2 { color:#64748b; }
      .chip { background:#1e293b;color:#94a3b8; }
      .chip.diff { background:#1e3a8a;color:#bfdbfe; }
      .chip.tag { background:#064e3b;color:#a7f3d0; }
      p code, li code { background:#1e293b; }
      blockquote { background:#0f1a2e;border-left-color:#1d4ed8; }
      .guide { background:#111a2c;border-top-color:#1e293b;box-shadow:0 -6px 24px rgba(0,0,0,.45); }
      .guide .g-text { color:#94a3b8; }
      .guide .g-text b { color:#f1f5f9; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="brand" href="${SITE}/"><span class="logo">I</span> IT 面试题库</a>
    <h1>${esc(q.title)}</h1>
    <div class="chips">${metaChips(q)}</div>
    ${bodyHtml ? `<div class="card"><h2>题目</h2>${bodyHtml}</div>` : ""}
    ${answerHtml ? `<div class="card"><h2>参考答案</h2>${answerHtml}</div>` : ""}
    <a class="cta" href="${hashUrl}">在线刷题 · 收藏与错题重练 →</a>
    <p class="jumpnote">题目与答案就在本页；想刷题、收藏或进错题本，点上方按钮即可</p>
  </div>
  <div class="guide" id="guide">
    <span class="g-text">${guideText}</span>
    <a class="g-btn" href="${guideUrl}">进入刷题</a>
    <button class="g-x" id="guide-x" type="button" aria-label="关闭引导">✕</button>
  </div>
  <script>(function(){try{if(sessionStorage.getItem("iti_share_guide_done")==="1")return;var bar=document.getElementById("guide");if(!bar)return;var off=function(){try{sessionStorage.setItem("iti_share_guide_done","1");}catch(e){}bar.classList.remove("show");document.body.classList.remove("guide-on");};var x=document.getElementById("guide-x");if(x)x.addEventListener("click",off);var check=function(){var d=document.documentElement;var bottom=(d.scrollHeight||document.body.scrollHeight)-(window.innerHeight+(window.scrollY||d.scrollTop||0));if(bottom<=window.innerHeight*0.8){bar.classList.add("show");document.body.classList.add("guide-on");window.removeEventListener("scroll",check);}};window.addEventListener("scroll",check,{passive:true});}catch(e){}})();</script>
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
  /* 同步重生成 sitemap.xml：首页 + 主要路由 + 全部分享页，SEO 不再漏新页 */
  const today = new Date().toISOString().slice(0, 10);
  const sitemapUrls = [
    { loc: `${SITE}/`, priority: "1.0", freq: "daily" },
    { loc: `${SITE}/#/category`, priority: "0.8", freq: "weekly" },
    { loc: `${SITE}/#/position`, priority: "0.8", freq: "weekly" },
    { loc: `${SITE}/#/questions`, priority: "0.8", freq: "daily" },
    { loc: `${SITE}/#/help`, priority: "0.6", freq: "weekly" },
    ...questions.filter(q => q.id && q.title).map(q => ({ loc: `${SITE}/q/${q.id}.html`, priority: "0.7", freq: "weekly", lastmod: q.updatedAt }))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n` +
    sitemapUrls.map(u => `  <url>\\n    <loc>${u.loc}</loc>\\n    <lastmod>${u.lastmod ? new Date(u.lastmod).toISOString().slice(0, 10) : today}</lastmod>\\n    <changefreq>${u.freq}</changefreq>\\n    <priority>${u.priority}</priority>\\n  </url>`).join("\\n") +
    `\\n</urlset>\\n`;
  fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), xml, "utf8");
  console.log(`sitemap.xml 已更新（${sitemapUrls.length} 条）`);
}

main().catch(e => { console.error(e); process.exit(1); });
