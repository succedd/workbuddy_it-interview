/* =========================================================================
 *  js/docs-loader.js —— 技术教程文档数据「按需加载」（2026-10-06 性能优化）
 * =========================================================================
 * 背景
 * ----
 * 实测首页要等46 个资源、合计约 981 KB(gzip) 才算「加载完」，而TTFB 因为
 * Cloudflare 免费版把大陆访客调度到境外节点（实测 colo 恒为 LAX），
 * 本就在 1.0~6.5 秒浮动。每个资源都要各自付一次这段延迟。
 *
 *   其中 js/docs/*.js + js/docs-data.js 合计约 **547 KB(gzip)** ——占了首屏的
 *   一半以上，可它们只在用户点进「学 › 技术教程」时才真正被用到。
 *   （`js/docs.js` 的侧栏与统计确实要读这些数据，但那是**用户点进去之后**的事，
 *首屏根本不需要。）
 *
 *   于是把它们从 index.html 的阻塞 script 里摘出来，改成：
 *   ① 首屏只留一个 ~1 KB 的 loader；
 *   ② loader 在「空闲时」静默预热（requestIdleCallback，回退 setTimeout），
 *      所以正常情况下用户点进文档页时数据已经在内存里，体感零变化；
 *   ③ 用户真的点了但还没预热完 → 走await 同一个Promise，不会重复请求；
 *   ④ 任何失败都只是「文档页显示为空」，绝不影响首页与其它功能。
 *
 * 为什么不用 <script defer>
 * ------------------------
 * defer 仍然会在首屏解析阶段下载并执行这些文件（只是不阻塞 HTML 解析），
 * 下载本身的开销一分不少。而这里要的是「首屏根本不发起这7 个请求」。
 *
 * 离线
 * ----
 * 这 7 个文件仍在 Service Worker 的 APP_SHELL 预缓存清单里，
 * 离线时照常可用（见 sw.js 的注释）。
 * ========================================================================= */
(function () {
  "use strict";

  /* 版本号不能硬编码：本文件在 index.html 的内联脚本之前执行，
     那时 window.PAGE_VER 还没被赋值；而一旦写死一个字面量，
     下次发版 bump-version.py 只改 index.html/sw.js，这里就会一直请求旧 URL
     （发版后表现为「教程页数据没更新」或 404）。
     所以在真正发起加载时才取版本：优先用页面注入的 PAGE_VER，
     取不到就退到本文件被引入时带的 ?v=（URL 里那串）。 */
  var SELF_VER = (function () {
    try {
      var me = document.currentScript || document.querySelector('script[src*="docs-loader.js"]');
      if (me) {
        var m = String(me.src || "").match(/[?&]v=([^&]+)/);
        if (m) return m[1];
      }
    } catch (_) {}
    return "";
  })();
  var FILE_PATHS = [
    "js/docs/java.js",
    "js/docs/network.js",
    "js/docs/dba.js",
    "js/docs/frontend.js",
    "js/docs/security.js",
    "js/docs/devops.js",
    "js/docs-data.js"
  ];
  function fileUrls() {
    var v = window.PAGE_VER || SELF_VER;
    return FILE_PATHS.map(function (p) { return p + (v ? "?v=" + v : ""); });
  }
  /* 顺序必须与 index.html 原先一致：各方向数据先挂 window，
     docs-data.js 再读它们组装 window.DOCS。 */

  var loading = null;      /* 同一个 Promise 并发复用，避免重复请求 */
  var done = false;

  /* 单文件加载超时（秒）。
     ⚠️ 为什么必须要有：onload / onerror 都不触发的情况真实存在——
     网络挂起、连接被重置、Service Worker 卡住等。此时若只等两个事件，
     `await load()` 会永远挂起，用户点进技术教程页就一直停在空页面（连
     「加载失败可重试」的提示都出不来，比直接报错还糟）。
     超时后按「该文件失败」处理，继续下一个，最终由 ensureDocs 给出重试入口。 */
  var FILE_TIMEOUT = 8;

  function loadScript(src) {
    return new Promise(function (resolve) {
      var settled = false;
      var s = document.createElement("script");
      function finish(ok) {
        if (settled) return;        /* 防止 onload 与超时竞态导致重复 resolve */
        settled = true;
        clearTimeout(timer);
        resolve(ok);
      }
      var timer = setTimeout(function () { finish(false); }, FILE_TIMEOUT * 1000);
      s.src = src;
      s.async = false;      /* 保持执行顺序：后一个依赖前一个挂的全局变量 */
      s.onload = function () { finish(true); };
      /* 失败也 resolve —— 让后续文件继续尝试，最终由调用方判断 DOCS 是否就绪。
         单个方向文件挂掉不该让整个技术教程页变成白屏。 */
      s.onerror = function () { finish(false); };
      document.head.appendChild(s);
    });
  }

  /* 失败后的静默期：这一次全挂（或挂了几秒）之后，别再自动预热了。
     没有这个闸门时，弱网用户每次进首页都会在空闲回调里重试 7 个文件 ×8秒，
     既耗流量又抢带宽，反而让首页更慢（越慢越失败，越失败越重试）。
     静默期内用户**手动点进**教程页仍会真重试（走 load(true)）。*/
  var RETRY_COOLDOWN = 60000;   /* 1 分钟 */
  var lastFailAt = 0;

  function load(force) {
    if (done) return Promise.resolve(true);
    if (loading) return loading;
    if (!force && lastFailAt && (Date.now() - lastFailAt) < RETRY_COOLDOWN) {
      /* 刚失败过且非用户主动触发：直接放弃预热，把资源留给首屏其它内容 */
      return Promise.resolve(false);
    }
    loading = (async function () {
      var allOk = true;
      var files = fileUrls();      /* 到这一刻才取版本号，确保拿到页面注入的 PAGE_VER */
      for (var i = 0; i < files.length; i++) {
        if (!(await loadScript(files[i]))) allOk = false;
      }
      var ready = !!(window.DOCS && Array.isArray(window.DOCS.dirs) &&
                     window.DOCS.dirs.filter(Boolean).length);
      if (ready) {
        done = true;
        lastFailAt = 0;
        /* 数据到位后主动广播：docs.js 若已在等这个信号会立刻渲染 */
        try {
          document.dispatchEvent(new CustomEvent("docs:ready"));
        } catch (_) { /* 老浏览器无 CustomEvent，忽略即可 */ }
      } else {
        lastFailAt = Date.now();
      }
      loading = null;
      return ready;
    })();
    return loading;
  }

  /* 供 docs.js 主动调用：确保数据已就绪。
     force=true 表示这是用户点击触发的，必须真重试（无视上面的静默期）。 */
  window.DocsLoader = {
    load: function () { return load(true); },
    warmup: function () { return load(false); },
    isReady: function () { return !!(window.DOCS && Array.isArray(window.DOCS.dirs)); }
  };

  /* 首屏空闲时静默预热。用 requestIdleCallback 是因为此刻主线程空闲，
     下载与解析不与首屏渲染抢带宽；不支持时退回 setTimeout(…, 1200)。 */
  function warmup() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(function (idle) {
        if (idle && idle.timeRemaining && idle.timeRemaining < 8) {
          setTimeout(warmup, 1500);      /* 剩余时间太少，留到下一轮 */
          return;
        }
        load(false);                     /* 非强制：失败后进入静默期，不反复重试 */
      }, { timeout: 3000 });
    } else {
      setTimeout(function () { load(false); }, 1200);
    }
  }

  if (document.readyState === "complete") warmup();
  else window.addEventListener("load", warmup);
})();