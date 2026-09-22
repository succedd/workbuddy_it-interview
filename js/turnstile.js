/* =========================================================================
 *  turnstile.js — Cloudflare Turnstile 人机验证（前端挂载层，开关式）
 * =========================================================================
 *  和后端 cloudflare/worker.js 的 verifyTurnstile() 是一对：
 *    未配置 => 两边都整段跳过，行为与旧版一模一样；配置了才真正启用。
 *
 *  三条设计取舍（都是踩过/想过才这么定的）：
 *   1) 提交时才执行（execution:"execute"），不在页面加载时就换 token。
 *      投稿表单可能写了十几分钟，若挂载时就换取 token，提交时早超过
 *      Turnstile 的 300 秒有效期，用户会看到「人机验证未通过」这种
 *      完全看不懂、也无从自救的报错。
 *   2) appearance:"interaction-only" —— 不需要人工点选时组件完全隐形，
 *      表单观感与以前一致；真要人工确认时才浮出来。
 *   3) 失败一律不阻塞表单：拿不到 token 时把原因交回调用方，由调用方
 *      给出人话提示；后端仍会 403，属于双保险。
 *
 *  主题：站内是 html[data-theme] 自管主题（不跟随系统），所以这里读
 *  站点当前主题传给 widget，而不是用 "auto"。
 * ========================================================================= */
(function () {
  "use strict";
  const TS = {};

  /* sitekey 是公开值（会出现在前端源码里），必须与 Cloudflare 面板里
     那个 widget 的 Site Key 一致；改动它等于换 widget。
     secret 绝不能出现在前端，它只存在于 Worker 的环境变量 TURNSTILE_SECRET。 */
  const SITEKEY = "0x4AAAAAAE__jtzqP599LSsj";

  /* 可选远程覆盖：api-endpoints.json 里若写了 turnstileSiteKey，就用它。
     纯 best-effort —— 读不到/格式不对一律退回内置常量，避免「配置拉取失败
     导致登录入口整体不可用」这种本末倒置的故障。 */
  function remoteSitekey() {
    try {
      const raw = localStorage.getItem("stats_api_cfg");
      if (!raw) return "";
      const o = JSON.parse(raw);
      const k = o && o.turnstileSiteKey;
      return (typeof k === "string" && /^[0-9a-zA-Z_-]{10,}$/.test(k.trim())) ? k.trim() : "";
    } catch (e) { return ""; }
  }

  TS.status = "idle";              /* idle | loading | ready | failed */

  TS.sitekey = function () { return remoteSitekey() || SITEKEY; };
  TS.enabled = function () { return !!TS.sitekey(); };

  /* ---------- 单例加载 api.js ---------- */
  let loadP = null;
  function load() {
    if (window.turnstile && window.turnstile.render) { TS.status = "ready"; return Promise.resolve(true); }
    if (loadP) return loadP;
    TS.status = "loading";
    loadP = new Promise(function (resolve, reject) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__tsOnload";
      s.async = true;
      s.defer = true;
      const timer = setTimeout(function () { TS.status = "failed"; reject(new Error("timeout")); }, 12000);
      window.__tsOnload = function () { clearTimeout(timer); TS.status = "ready"; resolve(true); };
      s.onerror = function () { clearTimeout(timer); TS.status = "failed"; reject(new Error("network")); };
      document.head.appendChild(s);
    });
    /* 失败后放开单例，允许用户再点一次提交时重试（网络抖动常常只差一次） */
    loadP.catch(function () { loadP = null; });
    return loadP;
  }

  /* ---------- 挂载 ---------- */
  /* 把 widget 渲染进 el；未启用/挂了都返回 null，调用方据 TS.status 提示。 */
  TS.mount = function (el) {
    if (!el || !TS.enabled()) return Promise.resolve(null);
    return load().then(function () {
      if (el.__tsWid != null) {
        try { turnstile.reset(el.__tsWid); } catch (e) {}
        return el.__tsWid;
      }
      el.__tsTok = "";
      const theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "dark" : "light";
      const wid = turnstile.render(el, {
        sitekey: TS.sitekey(),
        execution: "execute",
        appearance: "interaction-only",
        theme: theme,
        "refresh-expired": "auto",
        "refresh-timeout": "auto",
        callback: function (t) { el.__tsTok = t || ""; settle(el, el.__tsTok); },
        "error-callback": function () { settle(el, ""); },
        "timeout-callback": function () { settle(el, ""); }
      });
      el.__tsWid = wid;
      return wid;
    }).catch(function () { return null; });
  };

  /* 等待中的调用方（一次只有一个：用户点一次提交等一次） */
  function settle(el, token) {
    el.__tsTok = token || "";
    const f = el.__tsWait;
    el.__tsWait = null;
    if (f) f(el.__tsTok);
  }

  /* ---------- 取 token（点提交时调） ----------
     已有令牌直接复用；否则执行挑战并等回调。超时/出错返回 ""。 */
  TS.token = function (el, ms) {
    if (!el || el.__tsWid == null) return Promise.resolve("");
    let cur = "";
    try { cur = turnstile.getResponse(el.__tsWid) || ""; } catch (e) { cur = ""; }
    if (cur) return Promise.resolve(cur);
    el.__tsTok = "";
    return new Promise(function (resolve) {
      let done = false;
      const fin = function (v) {
        if (done) return;
        done = true;
        el.__tsWait = null;
        resolve(v || "");
      };
      el.__tsWait = fin;
      setTimeout(function () { fin(""); }, ms || 25000);
      try { turnstile.execute(el.__tsWid); }
      catch (e) { fin(""); }
    });
  };

  /* ---------- 复位（一次提交后必须调） ----------
     Turnstile 令牌是一次性的：提交过一次（哪怕服务端判失败）后再拿旧令牌
     去验必然报 timeout-or-duplicate，所以失败后要 reset 才能重新挑战。 */
  TS.reset = function (el) {
    if (!el || el.__tsWid == null) return;
    el.__tsTok = "";
    el.__tsWait = null;
    try { turnstile.reset(el.__tsWid); } catch (e) {}
  };

  /* ---------- 给人看的提示文案 ---------- */
  TS.statusText = function () {
    if (TS.status === "failed") {
      return "人机验证组件加载失败（多为网络拦截 challenges.cloudflare.com）。请刷新页面重试，或换个网络。";
    }
    return "人机验证未通过，请再点一次提交重试。";
  };

  window.TS = TS;
})();
