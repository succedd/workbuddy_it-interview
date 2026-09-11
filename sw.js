/* IT面试题库 Service Worker —— 离线可用（PWA）
 * 策略：
 *  - 同源静态资源（带版本号）：cache-first + 运行时补缓存
 *  - 导航请求（HTML）：network-first，离线时回退到缓存的 index.html（SPA 照常工作）
 *  - 跨域资源（jsdelivr CDN、百度统计、API worker）：不拦截，交由浏览器正常处理
 *  - echarts / xlsx 大库：缓存前校验 content-length，避免 SW 写入不完整响应后
 *    永远 cache-first 命中损坏脚本（用户表现为「全景图脚本加载失败：echarts」且 Ctrl+F5 无效）
 * 版本号变更即清理旧缓存，保证更新生效。
 */
const VERSION = "20260911a";
const CACHE = "iti-pwa-v" + VERSION;
/* 大库期望字节数：与 vendor/ 实际文件一致；命中缓存但长度不符时自动回源重抓 */
const LARGE_ASSETS = {
  "/vendor/echarts.min.js": 1030855,
  "/vendor/xlsx.full.min.js": 881749
};
const APP_SHELL = [
  "/", "/index.html",
  "/css/variables.css?v=" + VERSION, "/css/style.css?v=" + VERSION,
  "/css/animations.css?v=" + VERSION, "/css/responsive.css?v=" + VERSION,
  "/css/loader.css?v=" + VERSION, "/data/tech-maps.json",
  /* 第三方库已本地化（vendor/），必须随壳缓存，否则离线时 Dexie/Marked 等加载失败整站不可用；
     echarts / xlsx 大库按需加载，由 fetch 运行时缓存补收，不进壳 */
  "/vendor/dexie.min.js", "/vendor/purify.min.js", "/vendor/marked.min.js",
  "/vendor/highlight.min.js", "/vendor/fuse.min.js",
  "/vendor/github.min.css", "/vendor/github-dark.min.css",
  "/js/guide.js?v=" + VERSION, "/js/utils.js?v=" + VERSION, "/js/db.js?v=" + VERSION, "/js/auth.js?v=" + VERSION,
  "/js/search.js?v=" + VERSION, "/js/aiprompts.js?v=" + VERSION, "/js/api.js?v=" + VERSION,
  "/js/services.js?v=" + VERSION, "/js/cloud.js?v=" + VERSION, "/js/backup.js?v=" + VERSION,
  "/js/importexport.js?v=" + VERSION, "/js/panorama.js?v=" + VERSION, "/js/sharecard.js?v=" + VERSION, "/js/app.js?v=" + VERSION, "/js/account.js?v=" + VERSION,
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

/* 调试入口：postMessage({type:"CLEAR_CACHE"}) 清空当前 SW 缓存（包含损坏响应） */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    /* 页面点「有新版本，点击刷新」时请求立即接管 */
    self.skipWaiting();
    return;
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil((async () => {
      await caches.delete(CACHE);
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      try { await self.registration.update(); } catch (_) {}
      if (event.source && event.source.postMessage) event.source.postMessage({ type: "CLEAR_CACHE_DONE" });
    })());
  }
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
        /* 只缓存首页：否则 /q/<id>.html 等分享页会被写进 "/" 缓存键，污染离线首页 */
        const p = new URL(req.url).pathname;
        if (p === "/" || p === "/index.html") {
          const cache = await caches.open(CACHE);
          cache.put("/", net.clone()).catch(() => {});
          cache.put("/index.html", net.clone()).catch(() => {});
        }
        return net;
      } catch (_) {
        return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }

  /* 远程 API 入口配置：必须 network-first。
     同源资源默认是 cache-first，若把 api-endpoints.json 缓存住，
     "改一份 JSON 就能全量切换后端入口" 的应急通道会失效。 */
  if (url.pathname.endsWith('/api-endpoints.json')) {
    event.respondWith((async () => {
      try { return await fetch(req, { cache: 'reload' }); }
      catch (_) { return (await caches.match(req)) || Response.error(); }
    })());
    return;
  }

  // 同源静态资源：cache-first + 运行时补缓存
  event.respondWith((async () => {
    const cached = await caches.match(req);
    /* 大库损坏缓存自愈：缓存存在但字节数对不上，丢弃缓存回源重抓 */
    if (cached) {
      const expected = LARGE_ASSETS[url.pathname];
      if (expected && cached.headers) {
        const len = Number(cached.headers.get("content-length") || 0);
        if (len && len !== expected) {
          try { const cache = await caches.open(CACHE); await cache.delete(req); } catch (_) {}
        } else {
          return cached;
        }
      } else {
        return cached;
      }
    }
    try {
      const net = await fetch(req);
      if (net && net.ok) {
        /* 校验大库字节数，不完整响应不写入缓存 */
        const expected = LARGE_ASSETS[url.pathname];
        if (expected) {
          const len = Number(net.headers.get("content-length") || 0);
          if (len && len !== expected) return net;
        }
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone()).catch(() => {});
      }
      return net;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
