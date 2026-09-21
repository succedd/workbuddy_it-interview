// Cloudflare Pages 高级模式 Worker（_worker.js）—— 反爬守卫 v2
// ---------------------------------------------------------------
// 为什么需要它：本站原先在 GitHub Pages 上是纯静态托管，没有任何边缘计算能力，
// 于是 data/published.json（整库题目+答案，约 2MB）只要一条 curl 就能整包拿走；
// q/*.html 又是 1228 个把「完整答案」写进 ld+json 的分享页，沿公开的 sitemap
// 走一遍同样等于整库下载。迁移到 Cloudflare Pages 后，终于有一层可编程边缘，
// 于是把「数据 / 分享页」两条出口收在这里。
//
// 技术约束：wrangler pages deploy 不支持 functions/ 目录（那是 Dashboard
// 直传才有的能力），只认高级模式 _worker.js，故本文件即全部守卫逻辑；
// 非受保护路径一律原样透传给静态资源（env.ASSETS）。
//
// 三道闸门：
//   ① 仓库内部文件（tools/ cloudflare/ netlify/ HANDOVER.md …）→ 404，不出面
//   ② /data/*  → 必须先过 UA 过滤，再要求「浏览器信号」
//                （Sec-Fetch-Site: same-origin/same-site 或同源 Referer）
//   ③ /q/*    → 放行搜索引擎（保 SEO），拦 AI 训练爬虫与批量采集工具
//
// ⚠️ 诚实边界（别高估这层防护）：
//   这是「应用层」防护，能挡掉 99% 的随意采集（curl 一把梭、现成爬虫框架、
//   AI 训练抓取），但挡不住「自己会改请求头、还肯花钱租代理池」的定向攻击——
//   伪造 UA + 手工补 Sec-Fetch-Site 仍可拿到 data/published.json。
//   ✅ 2026-09-21 起域名换为自购的 itinterview.com.cn，zone 就在本账号下
//   （id 48961f3585fdc652af950bd2163c0382），**因此现在可以叠加 Zone 级防护**：
//   Security Level / Bot Fight Mode / WAF 自定义规则（免费版 5 条）/ Rate Limiting /
//   HSTS。这些在旧的 is-a.dev 时代做不到（当时 DNS 归属 is-a.dev 项目、不在本账号）。
//   建议：Cloudflare 后台开 Bot Fight Mode + Security Level=High，
//   把这里从「应用层」升级为「网络层」防护。
//   要再进一步只能改产品形态：把答案从分享页/静态 JSON 里挪到需要登录的接口。

const BOT_RE = new RegExp(
  [
    // AI / 训练型爬虫
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-Web",
    "Claude-User",
    "anthropic-ai",
    "CCBot",
    "Bytespider",
    "Amazonbot",
    "PerplexityBot",
    "Perplexity-User",
    "FacebookBot",
    "Diffbot",
    "Omgilibot",
    "ImagesiftBot",
    "YouBot",
    "Timpibot",
    "cohere-ai",
    // SEO / 批量采集工具
    "MJ12bot",
    "AhrefsBot",
    "SemrushBot",
    "DotBot",
    "DataForSeoBot",
    "Barkrowler",
    "serpstatbot",
    "MegaIndex",
    "ZoominfoBot",
    "Screaming Frog",
    // 通用脚本 / 无头客户端
    "Scrapy",
    "python-requests",
    "python-urllib",
    "aiohttp",
    "httpx",
    "Go-http-client",
    "okhttp",
    "libwww-perl",
    "curl/",
    "Wget/",
    "httpclient",
    "node-fetch",
    "undici",
    "HeadlessChrome",
    "PhantomJS",
    "Selenium",
    "Playwright",
    "Puppeteer"
  ].join("|"),
  "i"
);

// AI 厂商的「扩展 / 训练」变体必须先于搜索引擎白名单判断，
// 否则 Applebot-Extended 会被 Applebot 的子串匹配误放行（这个坑真的踩过）。
const AI_EXCLUSION_RE = new RegExp(
  [
    "Applebot-Extended",
    "Google-Extended",
    "Meta-ExternalAgent",
    "cohere-training-data-crawler"
  ].join("|"),
  "i"
);

// 搜索引擎白名单：命中即放行，保证 SEO 不受伤
const SEARCH_BOTS = new RegExp(
  [
    "Googlebot",
    "Google-InspectionTool",
    "Storebot-Google",
    "AdsBot-Google",
    "Mediapartners-Google",
    "Bingbot",
    "msnbot",
    "BingPreview",
    "Baiduspider",
    "YisouSpider",
    "Sogou web spider",
    "Sogou inst spider",
    "Sogou News Spider",
    "360Spider",
    "HaosouSpider",
    "YandexBot",
    "YandexImages",
    "DuckDuckBot",
    "Applebot",
    "Slurp",
    "Naver",
    "PetalBot",
    "Bravebot",
    "Qwantify",
    "SeznamBot",
    "ShenmaBot",
    "ToutiaoSpider"
  ].join("|"),
  "i"
);

// 搜索引擎自有 ASN 的组织名特征（用于识破「UA 自称 Googlebot、IP 却在某云主机」）。
// 取的是「包含即匹配」的粗粒度词，宁可放宽也不能误伤真实收录。
const SEARCH_ORG_RE = new RegExp(
  [
    "google",
    "microsoft",
    "bing",
    "baidu",
    "yandex",
    "duckduckgo",
    "amazon",
    "apple",
    "yahoo",
    "oath",
    "verizon",
    "naver",
    "huawei",
    "brave",
    "seznam",
    "qwant",
    "sogou",
    "tencent",
    "qihoo",
    "bytedance",
    "toutiao",
    "alibaba",
    "chinamobile",
    "unicom",
    "telecom"
  ].join("|"),
  "i"
);

// 仓库内部文件：本来就不该出现在发布目录，命中即 404（防目录探测拿源码/流水线）
const INTERNAL_RE =
  /^\/(tools|cloudflare|netlify|functions|\.git|\.github)(\/|$)|^\/(HANDOVER\.md|README\.md|netlify\.toml|package\.json|package-lock\.json|wrangler\.(toml|jsonc|json))$|^\/\./i;

function isCrawlerBlocked(ua) {
  if (!ua) return "empty-ua";
  if (AI_EXCLUSION_RE.test(ua)) return "ai-variant-ua";
  if (BOT_RE.test(ua)) return "bot-ua";
  return null;
}

/**
 * 统一判定一个 UA 的身份，返回三类结果：
 *   search  : 确认为搜索引擎（白名单 UA + 来源 ASN 对得上）
 *   spoof   : UA 自称搜索引擎，但来源网络完全不是 —— 典型的采集者伪装
 *   reason  : 非空表示「按普通爬虫规则应当拦截」的原因
 * 拿不到 request.cf 时（本地 wrangler pages dev）对搜索引擎**放行**，
 * 避免把「环境缺数据」误判成「伪造」而伤到真实收录。
 */
function classifyUa(ua, cf) {
  const claimsSearch = SEARCH_BOTS.test(ua) && !AI_EXCLUSION_RE.test(ua);
  const reason = isCrawlerBlocked(ua);

  if (!claimsSearch) return { search: false, spoof: false, reason: reason };

  const org = cf && cf.asOrganization ? String(cf.asOrganization) : "";
  const asn = cf ? cf.asn : undefined;
  if (!org && (asn === undefined || asn === null)) {
    return { search: true, spoof: false, reason: null };
  }
  if (SEARCH_ORG_RE.test(org)) return { search: true, spoof: false, reason: null };
  return { search: false, spoof: true, reason: "spoofed-search-bot-ua" };
}

function jsonDeny(reason, path) {
  return new Response(
    JSON.stringify({ error: "forbidden", reason: reason, path: path }),
    {
      status: 403,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow"
      }
    }
  );
}

const HTML_DENY =
  '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
  '<meta name="robots" content="noindex, nofollow"><title>403 · 禁止采集</title></head>' +
  '<body style="font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;color:#334155;' +
  'text-align:center;padding:72px 20px;line-height:1.8">' +
  '<div style="font-size:15px;letter-spacing:.08em;color:#94a3b8">403</div>' +
  '<h1 style="font-size:19px;font-weight:500;margin:14px 0 10px">本站不向自动化采集开放</h1>' +
  '<p style="color:#64748b;margin:0">题库内容仅供个人学习使用，禁止批量抓取与再分发。<br>' +
  '如果你是人类访客，请使用浏览器正常访问。</p></body></html>';

const HTML_404 =
  '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
  '<meta name="robots" content="noindex"><title>404 · 页面不存在</title></head>' +
  '<body style="font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;color:#334155;' +
  'text-align:center;padding:72px 20px;line-height:1.8">' +
  '<div style="font-size:15px;letter-spacing:.08em;color:#94a3b8">404</div>' +
  '<h1 style="font-size:19px;font-weight:500;margin:14px 0 10px">页面不存在</h1>' +
  '<p style="margin:0"><a href="/" style="color:#2563EB;text-decoration:none">返回题库首页</a></p>' +
  '</body></html>';

function denyHtml(reason) {
  return new Response(HTML_DENY, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "x-deny-reason": reason
    }
  });
}

function notFound() {
  return new Response(HTML_404, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ua = request.headers.get("user-agent") || "";

    // ① 仓库内部文件一律不出面
    if (INTERNAL_RE.test(path)) return notFound();

    const isData = path === "/data" || path.indexOf("/data/") === 0;

    // ② 先认人：脚本 / 爬虫 / 无头浏览器、AI 训练抓取，以及
    //    「UA 自称搜索引擎但来源网络完全对不上」的伪装者 —— 全站一律拒绝。
    //    这里放行的是：真实搜索引擎（白名单 UA + 来源 ASN 对得上）与普通浏览器。
    //    注意微信 / 微博 / QQ 的链接预览抓取器都不在 BOT_RE 里，所以分享卡片不受影响。
    const cls = classifyUa(ua, request.cf);
    if (cls.reason) {
      return isData ? jsonDeny(cls.reason, path) : denyHtml(cls.reason);
    }

    // ③ 题库数据：UA 过关还不算完，必须再带「浏览器信号」
    //    （App 自身的 fetch 会带 Sec-Fetch-Site: same-origin；老浏览器退化为同源 Referer）
    if (isData) {
      // 搜索引擎白名单在这里**不生效**：这份 JSON 只有本站 App 自己会取，
      // 搜索引擎没有任何理由读原始数据集（robots.txt 同样写着 Disallow: /data/）。
      // 不加这一条，「伪造/借用搜索引擎 UA」就等于绕过了整层 UA 过滤。
      if (cls.search) return jsonDeny("search-bot-on-data", path);

      const secFetchSite = request.headers.get("sec-fetch-site") || "";
      const referer = request.headers.get("referer") || "";
      const sameOriginReferer =
        referer === url.origin || referer.indexOf(url.origin + "/") === 0;
      const browserSignal =
        secFetchSite === "same-origin" ||
        secFetchSite === "same-site" ||
        sameOriginReferer;

      if (!browserSignal) return jsonDeny("missing-browser-signal", path);
    }

    // ④ /q/* 分享页不需要单独判断：搜索引擎已在 ② 放行（SEO 不受影响），
    //    其余爬虫已在 ② 拦掉，人类访客用的普通浏览器 UA 本来就不在 BOT_RE 里。
    const res = await env.ASSETS.fetch(request);

    if (isData) {
      const out = new Response(res.body, res);
      out.headers.set("x-robots-tag", "noindex, nofollow");
      return out;
    }
    return res;
  }
};
