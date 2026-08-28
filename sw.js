/* IT面试题库 Service Worker —— 离线可用（PWA）
 * 策略：
 *  - 同源静态资源（带版本号）：cache-first + 运行时补缓存
 *  - 导航请求（HTML）：network-first，离线时回退到缓存的 index.html（SPA 照常工作）
 *  - 跨域资源（jsdelivr CDN、百度统计、API worker）：不拦截，交由浏览器正常处理
 * 版本号变更即清理旧缓存，保证更新生效。
 */
const VERSION = "20260827t";
const CACHE = "iti-pwa-v" + VERSION;
const APP_SHELL = [
  "/", "/index.html",
  "/css/variables.css?v=" + VERSION, "/css/style.css?v=" + VERSION,
  "/css/animations.css?v=" + VERSION, "/css/responsive.css?v=" + VERSION,
  "/css/loader.css?v=" + VERSION,
  "/js/utils.js?v=" + VERSION, "/js/db.js?v=" + VERSION, "/js/auth.js?v=" + VERSION,
  "/js/search.js?v=" + VERSION, "/js/aiprompts.js?v=" + VERSION, "/js/api.js?v=" + VERSION,
  "/js/services.js?v=" + VERSION, "/js/cloud.js?v=" + VERSION, "/js/backup.js?v=" + VERSION,
  "/js/importexport.js?v=" + VERSION, "/js/app.js?v=" + VERSION, "/js/account.js?v=" + VERSION,
  "/data/seed.js?v=" + VERSION
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(APP_SHELL); } catch (_) { /* 部分资源暂不可达时忽略，运行时再补 */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 跨域（CDN / 统计 / 帐号 API）不拦截
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        /* cache:"reload" 强制绕过 HTTP 缓存（GitHub Pages HTML 固定 max-age=600），
           否则 network-first 的 fetch 仍会命中 10 分钟缓存，发版后用户要等 10 分钟才能拿到新版 */
        const net = await fetch(req, { cache: "reload" });
        const cache = await caches.open(CACHE);
        cache.put("/", net.clone()).catch(() => {});
        cache.put("/index.html", net.clone()).catch(() => {});
        return net;
      } catch (_) {
        return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }

  // 同源静态资源：cache-first + 运行时补缓存
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok) { const cache = await caches.open(CACHE); cache.put(req, net.clone()).catch(() => {}); }
      return net;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
