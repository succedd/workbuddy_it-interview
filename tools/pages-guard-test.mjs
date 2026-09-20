#!/usr/bin/env node
/**
 * Cloudflare Pages 反爬守卫（cloudflare/pages/_worker.js）回归测试
 * ---------------------------------------------------------------
 * 纯本地跑，不联网、不部署。把 _worker.js 当模块加载，喂进构造好的
 * 「请求 + Cloudflare 元数据」组合，断言放行 / 拒绝结果。
 *
 * 用法：node tools/pages-guard-test.mjs
 *
 * 为什么要有它：这层守卫的规则是「白名单 + 黑名单 + 来源 ASN 三方交叉」，
 * 很容易改一条正则就顺手把搜索引擎或人类访客误伤（历史上 Applebot-Extended
 * 就被 Applebot 的子串匹配误放行过）。发版前跑一遍，比手工 curl 靠谱。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const WORKER = path.join(ROOT, "cloudflare", "pages", "_worker.js");

// 仓库根没有 package.json，.js 会被 Node 当 CommonJS；用 data URL 动态导入 ESM 源码
const src = fs.readFileSync(WORKER, "utf8");
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(src, "utf8").toString("base64")
);
const worker = mod.default;

const ORIGIN = "https://it-interview.is-a.dev";

function makeRequest(p, opts = {}) {
  const h = new Map();
  if (opts.ua !== undefined) h.set("user-agent", opts.ua);
  for (const [k, v] of Object.entries(opts.headers || {})) {
    h.set(k.toLowerCase(), v);
  }
  return {
    url: ORIGIN + p,
    headers: { get: (k) => (h.has(String(k).toLowerCase()) ? h.get(String(k).toLowerCase()) : null) },
    cf: opts.cf
  };
}

const ASSET = "<html>ASSET-OK</html>";
const env = {
  ASSETS: {
    fetch: async () =>
      new Response(ASSET, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      })
  }
};

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const GOOGLE_CF = { asn: 15169, asOrganization: "Google LLC" };
const BAIDU_CF = { asn: 55967, asOrganization: "Beijing Baidu Netcom Science Technology Co., Ltd." };
const APPLE_CF = { asn: 714, asOrganization: "Apple Inc." };
const DO_CF = { asn: 14061, asOrganization: "DigitalOcean, LLC" };
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

// [名称, 请求参数, 期望 status, 期望响应体里包含的 reason（可选）]
const CASES = [
  // ---- 题库数据：UA 过滤 ----
  ["data · curl", { p: "/data/published.json", ua: "curl/8.4.0" }, 403, "bot-ua"],
  ["data · 空 UA", { p: "/data/published.json", ua: "" }, 403, "empty-ua"],
  ["data · python-requests", { p: "/data/published.json", ua: "python-requests/2.31.0" }, 403, "bot-ua"],
  ["data · Scrapy", { p: "/data/published.json", ua: "Scrapy/2.11 (+https://scrapy.org)" }, 403, "bot-ua"],
  ["data · GPTBot", { p: "/data/published.json", ua: "GPTBot/1.2" }, 403, "bot-ua"],
  ["data · Wget", { p: "/data/published.json", ua: "Wget/1.21.4" }, 403, "bot-ua"],
  ["data · 无头 Chrome", { p: "/data/published.json", ua: "Mozilla/5.0 HeadlessChrome/152.0.0.0 Safari/537.36" }, 403, "bot-ua"],

  // ---- 题库数据：浏览器信号 ----
  ["data · 浏览器 UA 但无信号", { p: "/data/published.json", ua: CHROME }, 403, "missing-browser-signal"],
  ["data · 只有 cross-site", { p: "/data/published.json", ua: CHROME, headers: { "sec-fetch-site": "cross-site" } }, 403, "missing-browser-signal"],
  ["data · Sec-Fetch-Site: same-origin", { p: "/data/published.json", ua: CHROME, headers: { "sec-fetch-site": "same-origin" } }, 200],
  ["data · Sec-Fetch-Site: same-site", { p: "/data/published.json", ua: CHROME, headers: { "sec-fetch-site": "same-site" } }, 200],
  ["data · 同源 Referer", { p: "/data/published.json", ua: CHROME, headers: { referer: ORIGIN + "/" } }, 200],
  ["data · 异源 Referer", { p: "/data/published.json", ua: CHROME, headers: { referer: "https://evil.example/" } }, 403, "missing-browser-signal"],
  ["data · 伪造 Googlebot（真 ASN）也拿不到", { p: "/data/published.json", ua: GOOGLEBOT_UA, headers: { "sec-fetch-site": "same-origin" }, cf: GOOGLE_CF }, 403, "search-bot-on-data"],

  // ---- 分享页：人类访客 / 微信 / 搜索引擎 ----
  ["share · 普通浏览器", { p: "/q/1.html", ua: CHROME }, 200],
  ["share · 微信内嵌", { p: "/q/1.html", ua: "Mozilla/5.0 MicroMessenger/8.0.40" }, 200],
  ["share · facebookexternalhit（链接预览）", { p: "/q/1.html", ua: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" }, 200],
  ["share · 真实 Googlebot", { p: "/q/1.html", ua: GOOGLEBOT_UA, cf: GOOGLE_CF }, 200],
  ["share · 真实 Baiduspider", { p: "/q/1.html", ua: "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)", cf: BAIDU_CF }, 200],
  ["share · 真实 Applebot", { p: "/q/1.html", ua: "Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)", cf: APPLE_CF }, 200],
  ["share · 本地无 cf 数据时搜索 UA 放行", { p: "/q/1.html", ua: GOOGLEBOT_UA }, 200],

  // ---- 伪装搜索引擎：UA 对、来源网络不对 ----
  ["share · 伪造 Googlebot（VPS ASN）", { p: "/q/1.html", ua: GOOGLEBOT_UA, cf: DO_CF }, 403, "spoofed-search-bot-ua"],
  ["share · 伪造 Bingbot（VPS ASN）", { p: "/q/1.html", ua: "Mozilla/5.0 (compatible; bingbot/2.0)", cf: DO_CF }, 403, "spoofed-search-bot-ua"],

  // ---- AI 厂商变体必须先于白名单判定 ----
  ["share · Applebot-Extended（含 Applebot 子串）", { p: "/q/1.html", ua: "Mozilla/5.0 AppleWebKit/605.1.15; compatible; Applebot-Extended/1.0", cf: APPLE_CF }, 403, "ai-variant-ua"],
  ["share · Google-Extended", { p: "/q/1.html", ua: "Mozilla/5.0 (compatible; Google-Extended/1.0)", cf: GOOGLE_CF }, 403, "ai-variant-ua"],
  ["share · Meta-ExternalAgent", { p: "/q/1.html", ua: "meta-externalagent/1.1", cf: { asn: 32934, asOrganization: "Meta Platforms, Inc." } }, 403, "ai-variant-ua"],

  // ---- 全站：脚本 / SEO 采集工具 ----
  ["root · Scrapy", { p: "/", ua: "Scrapy/2.11" }, 403, "bot-ua"],
  ["root · 空 UA", { p: "/", ua: "" }, 403, "empty-ua"],
  ["sitemap · AhrefsBot", { p: "/sitemap.xml", ua: "Mozilla/5.0 (compatible; AhrefsBot/7.0)" }, 403, "bot-ua"],
  ["sitemap · SemrushBot", { p: "/sitemap.xml", ua: "Mozilla/5.0 (compatible; SemrushBot/7~bl)" }, 403, "bot-ua"],
  ["root · 普通浏览器", { p: "/", ua: CHROME }, 200],
  ["robots · 普通浏览器", { p: "/robots.txt", ua: CHROME }, 200],
  ["sitemap · 真实 Googlebot", { p: "/sitemap.xml", ua: GOOGLEBOT_UA, cf: GOOGLE_CF }, 200],

  // ---- 仓库内部文件：永不出面 ----
  ["internal · tools/", { p: "/tools/build-pages.mjs", ua: CHROME }, 404],
  ["internal · cloudflare/", { p: "/cloudflare/pages/_worker.js", ua: CHROME }, 404],
  ["internal · netlify/", { p: "/netlify/functions/proxy.js", ua: CHROME }, 404],
  ["internal · HANDOVER.md", { p: "/HANDOVER.md", ua: CHROME }, 404],
  ["internal · README.md", { p: "/README.md", ua: CHROME }, 404],
  ["internal · netlify.toml", { p: "/netlify.toml", ua: CHROME }, 404],
  ["internal · .git 探测", { p: "/.git/config", ua: CHROME }, 404]
];

let pass = 0;
const fails = [];

for (const [name, opts, wantStatus, wantReason] of CASES) {
  const res = await worker.fetch(makeRequest(opts.p, opts), env);
  const body = await res.text();
  // JSON 拒绝把 reason 写在 body 里；HTML 拒绝把 reason 写在 x-deny-reason 头里
  const denyHeader = res.headers.get("x-deny-reason") || "";
  let ok = res.status === wantStatus;
  let detail = "";
  if (ok && wantReason) {
    ok = body.includes(wantReason) || denyHeader.includes(wantReason);
    detail = ok ? "" : ` · 缺 reason「${wantReason}」（头：${denyHeader || "无"}）`;
  }
  if (ok) {
    pass += 1;
    console.log(`  ok   ${name}  → ${res.status}${wantReason ? " " + wantReason : ""}`);
  } else {
    fails.push(`${name}: 期望 ${wantStatus}${wantReason ? " + " + wantReason : ""}，实得 ${res.status} · ${body.slice(0, 120)}`);
    console.log(`  FAIL ${name}  → ${res.status}${detail} · ${body.slice(0, 80)}`);
  }
}

// 额外：放行的 /data 必须带 noindex 头
{
  const res = await worker.fetch(
    makeRequest("/data/published.json", { ua: CHROME, headers: { "sec-fetch-site": "same-origin" } }),
    env
  );
  const tag = res.headers.get("x-robots-tag") || "";
  if (tag.includes("noindex")) {
    pass += 1;
    console.log(`  ok   data · 放行响应带 x-robots-tag: ${tag}`);
  } else {
    fails.push("data 放行响应缺 x-robots-tag noindex，实得：" + JSON.stringify(tag));
    console.log("  FAIL data · 放行响应缺 x-robots-tag noindex");
  }
}

console.log("");
console.log(`PAGES_GUARD_TEST: ${pass}/${CASES.length + 1} 通过`);
if (fails.length) {
  console.log("失败明细：");
  for (const f of fails) console.log("  - " + f);
  process.exit(1);
}
console.log("PAGES_GUARD_OK");
