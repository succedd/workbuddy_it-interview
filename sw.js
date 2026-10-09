/* IT面试题库 Service Worker —— 离线可用（PWA）
 * 策略：
 *  - 同源静态资源（带版本号）：cache-first + 运行时补缓存
 *  - 导航请求（HTML）：network-first，离线时回退到缓存的 index.html（SPA 照常工作）
 *  - 跨域资源（jsdelivr CDN、百度统计、API worker）：不拦截，交由浏览器正常处理
 *  - echarts / xlsx 大库：缓存前校验 content-length，避免 SW 写入不完整响应后
 *    永远 cache-first 命中损坏脚本（用户表现为「全景图脚本加载失败：echarts」且 Ctrl+F5 无效）
 * 版本号变更即清理旧缓存，保证更新生效。
 */
const VERSION = "20261009f";
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
  "/css/loader.css?v=" + VERSION, "/css/festival.css?v=" + VERSION, "/css/home.css?v=" + VERSION, "/data/tech-maps.json",
  /* 27 个源文件已合并为 4 个 bundle（tools/bundle-js.py 生成），
     预缓存清单同步换成这 4 个 —— 否则会去缓存一批 index.html 根本不再引用的文件，
     既浪费安装期带宽，又让离线清单名不副实。
     bundle-extra 虽然由加载器延迟加载，但也要缓存：离线时点进教程/指南同样要用。 */
  "/js/bundle/bundle-vendor.js?v=" + VERSION,
  "/js/bundle/bundle-core.js?v=" + VERSION,
  "/js/bundle/bundle-app.js?v=" + VERSION,
  "/js/bundle/bundle-extra.js?v=" + VERSION,
  /* vendor 的两个代码高亮主题 CSS 仍单独使用（不在 bundle 里） */
  "/vendor/github.min.css", "/vendor/github-dark.min.css",
  /* js/docs/*.js 与 docs-data.js 交给运行时缓存（见下方分支）：
     它们是按需加载的教程正文，合计约 547KB gzip，不进壳。
     js/docs-loader.js 已并入 bundle-app，此处无需单列。 */
  "/offline.html",
  /* data/seed.js 保留在预缓存清单里（2026-10-06 的取舍）：
     它已从 index.html 摘出、改成「走 seed 兜底时才动态加载」，所以**不在首屏关键路径上**；
     但 SW 安装发生在首屏渲染完之后，预缓存它不拖慢首屏。
     而如果这里也去掉，就会出现「联网访问过一次 → 之后离线打开 → 云端探测失败 →
     想走 seed 兜底却发现本地没这份文件」的死角，离线首访直接空库。
     两害相权，保留。 */
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
        /* cache:"reload" 强制绕过 HTTP 缓存（Cloudflare Pages 的 HTML 同样会被边缘缓存），
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
        /* 离线兜底链（20261005a）：SPA 首页 → 兜底 offline 页，不再直接 Response.error() 白屏 */
        return (await caches.match("/index.html")) || (await caches.match("/"))
          || (await caches.match("/offline.html")) || Response.error();
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

  /* 题库数据文件：network-first（2026-10-06 改用「边缘友好」写法）。
   ⚠️ 这里曾长期写着 fetch(req, { cache: "reload" }) —— reload 会同时击穿
   **浏览器缓存与 Cloudflare 边缘缓存**，导致 /data/published.json 的
   cf-cache-status 恒为 DYNAMIC：每一个访客请求都真的回源计算，
   实测 TTFB 1.1～6 秒（国内还全部命中 LAX 洛杉矶机房），首屏极慢。

   改成"普通的no-cache 语义"后：
     · no-cache = 每次都校验（发版能生效），但**允许边缘用缓存响应**（校验走 304，不回源）；
     · 指纹没变 → 上层cloud.js 直接跳过全量下载，本来就不该发这个请求；
     · 指纹变了/缺失 → 发一次 no-cache 请求，边缘命中则 304、miss 才回源。
   配合 _worker.js 给 /data/*.json（不带 ?v= 的）下发的 s-maxage，热门访客几乎不再回源。 */
  const isDataJson = url.pathname === "/data/version.json" ||
    url.pathname === "/data/published.json" ||
    url.pathname === "/data/manifest.json" ||
    url.pathname.startsWith("/data/shards/");
  if (isDataJson) {
    event.respondWith((async () => {
      try {
        /* cache: "no-cache" 而非 "reload"：前者仍会走协商缓存（304），
           后者才是硬性绕过所有缓存、强制回源。 */
        const net = await fetch(req, { cache: "no-cache" });
        /* 离线兜底：缓存最近一份好数据。
           version.json 永不缓存 —— 它是「要不要重新下载」的判据，必须实时，
           一旦被缓存就会一直误判成「没更新」。
           published / manifest / shards 都缓存：离线时仍能看题库与答案。
           （2026-10-07 修正：原先只缓存 published.json，导致离线打开题目拿不到分片。） */
        if (net && net.ok && url.pathname !== "/data/version.json") {
          const cache = await caches.open(CACHE);
          cache.put(req, net.clone()).catch(() => {});
        }
        return net;
      } catch (_) {
        /* 离线：version.json 失败让上层走全量兜底；published.json 回退最近缓存 */
        return (await caches.match(req)) || Response.error();
      }
    })());
    return;
  }

  /* ⚠️ 这里原本还有一段「分片 cache-first」的分支，2026-10-07 删掉了：
     上面 isDataJson 的判定里已经包含 `/data/shards/`（走 network-first），
     所以那段代码永远执行不到 —— 是死代码。
     更要紧的是它的存在会误导人以为分片走的是 cache-first：
     分片 URL **不带版本号**，若真按 cache-first 走，题库更新后用户会一直拿到旧答案。
     现在分片统一由上面的 network-first 处理（内容始终新鲜），
     同时在那里做了离线缓存兜底。 */

  /* 文档方向数据（2026-10-06）：从 APP_SHELL 移到运行时缓存。
   这 7 个文件合计约 547KB gzip，占首屏总量一半以上，改由 js/docs-loader.js
   在空闲时预热 / 点进教程页时按需加载。走 cache-first：
   进过一次技术教程页后即长期缓存，离线照常可看。 */
  if (url.pathname === "/js/docs-data.js" || url.pathname.indexOf("/js/docs/") === 0) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, net.clone()).catch(() => {});
        }
        return net;
      } catch (_) {
        return Response.error();
      }
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
