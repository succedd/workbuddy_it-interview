/* =========================================================================
 *  tools/gen-legal-pages.js  —  生成隐私政策 / 用户协议的静态页
 *  用法：node tools/gen-legal-pages.js
 *  输出：privacy.html、terms.html（站点根目录）
 *
 *  为什么要静态页：站内正文是 SPA 渲染的，爬虫（尤其百度）不执行 JS，
 *  纯路由页面在搜索结果里几乎是空的；而这两页恰恰是「信任类」页面，
 *  必须能被直接抓到、能分享、能被搜索引擎收录。
 *  正文从 js/legal.js 里读（与 SPA 共用同一份数据），不在这里二次编写，
 *  避免日后改了网页忘了改静态页。
 * ========================================================================= */
const fs = require("fs");
const path = require("path");

const SITE = "https://itinterview.com.cn";
const SRC = path.join(__dirname, "..", "js", "legal.js");
const OUT_DIR = path.join(__dirname, "..");

/* legal.js 是浏览器 IIFE（往 window 上挂 LEGAL_DOCS）。这里造一个最小
   window 环境执行它，只为拿到数据；它内部的渲染函数不会被调用。 */
function loadDocs() {
  const src = fs.readFileSync(SRC, "utf8");
  const sandbox = { window: {}, document: { title: "" } };
  const fn = new Function("window", "document", src + "\n;return window;");
  const w = fn(sandbox.window, sandbox.document);
  if (!w || !w.LEGAL_DOCS) throw new Error("未能从 js/legal.js 读取 LEGAL_DOCS");
  return w.LEGAL_DOCS;
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function page(doc) {
  const url = `${SITE}/${doc.file}`;
  const other = doc.key === "privacy"
    ? { name: "用户协议", url: `${SITE}/terms.html` }
    : { name: "隐私政策", url: `${SITE}/privacy.html` };
  const body = doc.sections.map(s => {
    const ps = (s.p || []).map(t => `<p>${t}</p>`).join("\n      ");
    const ul = (s.ul || []).length
      ? `\n      <ul>${(s.ul || []).map(t => `<li>${t}</li>`).join("")}</ul>` : "";
    return `      <section class="sec">
        <h2>${esc(s.h)}</h2>
      ${ps}${ul}
      </section>`;
  }).join("\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${doc.title} · IT面试题库`,
    description: doc.desc,
    url,
    inLanguage: "zh-CN",
    dateModified: doc.updated,
    isPartOf: { "@type": "WebSite", name: "IT面试题库", url: `${SITE}/` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: doc.title, item: url },
      ],
    },
  };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(doc.title)} · IT面试题库</title>
  <meta name="description" content="${esc(doc.desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(doc.title)} · IT面试题库">
  <meta property="og:description" content="${esc(doc.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="IT面试题库">
  <meta name="robots" content="index,follow">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
  <style>
    body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;margin:0;background:#f8fafc;color:#334155;line-height:1.85}
    .wrap{max-width:760px;margin:0 auto;padding:22px 18px 60px}
    .brand{color:#2563eb;font-weight:700;text-decoration:none;font-size:15px}
    h1{font-size:25px;color:#0f172a;margin:14px 0 6px}
    .meta{color:#94a3b8;font-size:13px;margin:0 0 18px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px 22px 26px}
    .lead{font-size:15px;margin:0 0 6px}
    .sec{margin-top:22px}
    .sec h2{font-size:17px;color:#0f172a;margin:0 0 8px}
    .sec p{margin:8px 0}
    .sec ul{margin:8px 0;padding-left:22px}
    .sec li{margin:6px 0}
    .foot{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0}
    .foot a{color:#2563eb;text-decoration:none;font-size:14px}
    .cta{display:block;text-align:center;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;padding:13px;margin-top:22px;font-weight:600}
    .cta.sub{background:#fff;color:#2563eb;border:1px solid #bfdbfe}
  </style>
</head>
<body><div class="wrap">
  <a class="brand" href="${SITE}/">IT面试题库</a>
  <h1>${esc(doc.title)}</h1>
  <p class="meta">最后更新：${esc(doc.updated)} · 生效日期：${esc(doc.updated)}</p>
  <div class="card">
    <p class="lead">${doc.intro}</p>
${body}
    <div class="foot">
      <a href="${other.url}">阅读${esc(other.name)} →</a>
      <a href="${SITE}/about">关于本站</a>
      <a href="${SITE}/account">我的帐号 · 数据与隐私</a>
    </div>
  </div>
  <a class="cta" href="${SITE}/questions">开始刷题 →</a>
  <a class="cta sub" href="${doc.route}">在站内打开本页</a>
</div></body>
</html>`;
}

function main() {
  const docs = loadDocs();
  for (const key of Object.keys(docs)) {
    const doc = docs[key];
    const out = path.join(OUT_DIR, doc.file);
    fs.writeFileSync(out, page(doc), "utf8");
    console.log(`已生成 ${doc.file}（${Object.keys(docs).length ? "" : ""}${doc.sections.length} 节）`);
  }
  console.log("提示：sitemap 由 tools/gen-share-pages.js 统一重生成，它会把这两页带上。");
}

main();
