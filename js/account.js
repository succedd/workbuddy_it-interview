/* =========================================================================
 *  account.js  —  用户帐号系统（前端）
 *  后端：Cloudflare Worker /auth/*、/me/data（D1）。
 *  能力：注册/登录/退出；收藏、刷题历史、错题本按用户云同步（换设备不丢）；
 *        管理员帐号管理（列表/搜索/禁用/重置密码）。
 * ========================================================================= */
(function () {
  "use strict";
  /* app.js 是 IIFE，setMain/route/renderTopbar 等在其闭包内。
     通过 App._internals 取用（app.js 末尾挂载）；U/DB/Services 本身就是 window 全局。 */
  const _i = (window.App && window.App._internals) || {};
  const $ = _i.$ || U.qs;
  const setMain = _i.setMain;
  const route = _i.route || (() => { location.hash = "#/"; });
  const renderTopbar = _i.renderTopbar;

  const A = {};
  const LS = { token: "acc_token", user: "acc_user", syncAt: "acc_sync_at" };

  /* ---------------- API 入口解析（2026-09-08 重构） ----------------
   * 背景：Cloudflare 的 *.workers.dev 域名在中国大陆被 DNS 投毒 + SNI 复位，
   *       手机（无代理）访问必然失败，表现为「API 暂不可达」。根治办法是给
   *       Worker 绑自有域名（api.itinterview.eu.org，eu.org 审核通过后生效）。
   * 设计：入口不再写死单点，改成「候选列表 + 自动择优 + 远程可覆盖」：
   *   1) 用户在设置里手填的地址（localStorage.stats_api）优先级最高；
   *   2) 上一次探测成功的入口（localStorage.stats_api_pick）；
   *   3) 同源远程配置 api-endpoints.json（改入口无需重新发版，可绕过 SW 缓存）；
   *   4) 内置兜底列表 BUILTIN_ENDPOINTS。
   * 只有网络层失败（fetch 抛错 / 超时）才换下一个入口；HTTP 4xx/5xx 说明这个
   * 入口是通的（比如密码错误），不切换，避免把真实错误掩盖成"网络问题"。
   * ---------------------------------------------------------------- */
  const BUILTIN_ENDPOINTS = [
    "https://it-interview-stats.iti-interview.workers.dev"
  ];
  const CFG_URL = "api-endpoints.json";
  const CFG_TTL = 6 * 3600 * 1000;
  const API_DEFAULT = BUILTIN_ENDPOINTS[0];

  function ls(k, v) {
    if (v === undefined) return localStorage.getItem(k);
    v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
  }

  function dedup(list) {
    const out = [];
    (list || []).forEach(function (u) {
      const s = String(u || "").trim().replace(/\/+$/, "");
      if (s && /^https?:\/\//i.test(s) && out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }
  /* 远程配置：同源 JSON，形如 {"endpoints":["https://api.example.com", ...]}。
     读取失败/格式错误一律静默忽略并退回内置列表，绝不影响主流程。 */
  function readCfg() {
    try {
      const raw = localStorage.getItem("stats_api_cfg");
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || !o.at || Date.now() - o.at > CFG_TTL) return null;
      return dedup(o.endpoints);
    } catch (e) { return null; }
  }
  A.refreshEndpoints = async function () {
    try {
      const r = await fetch(CFG_URL + "?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return null;
      const o = await r.json();
      const list = dedup(o && o.endpoints);
      if (!list.length) return null;
      try { localStorage.setItem("stats_api_cfg", JSON.stringify({ at: Date.now(), endpoints: list })); } catch (e) {}
      return list;
    } catch (e) { return null; }
  };
  A.endpoints = function () {
    const manual = localStorage.getItem("stats_api") || "";
    const pick = localStorage.getItem("stats_api_pick") || "";
    return dedup([manual, pick].concat(readCfg() || [], BUILTIN_ENDPOINTS));
  };
  /* 逐个探测候选入口，选中第一个可用的记下来（设置页「自动选择可用入口」用）。 */
  A.probeEndpoints = async function () {
    const eps = A.endpoints();
    const out = [];
    for (let i = 0; i < eps.length; i++) {
      const base = eps[i];
      const ctl = ("AbortController" in window) ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => { try { ctl.abort(); } catch (e) {} }, 6000) : null;
      const t0 = Date.now();
      let ok = false;
      try {
        const r = await fetch(base + "/stats", { signal: ctl && ctl.signal });
        ok = r.status < 500;
      } catch (e) { ok = false; }
      if (timer) clearTimeout(timer);
      out.push({ base: base, ok: ok, ms: Date.now() - t0 });
      if (ok) { ls("stats_api_pick", base); break; }
    }
    return out;
  };
  const apiBase = () => (A.endpoints()[0] || API_DEFAULT);
  A.apiBase = apiBase;

  A.getUser = () => { try { return JSON.parse(ls(LS.user) || "null"); } catch (e) { return null; } };
  A.getToken = () => ls(LS.token) || "";
  A.isLoggedIn = () => !!(A.getToken() && A.getUser());

  async function call(method, path, body) {
    const h = { "Content-Type": "application/json" };
    if (A.getToken()) h["Authorization"] = "Bearer " + A.getToken();
    /* 按候选入口顺序尝试：每个入口 8s 超时，网络层失败才换下一个；
       最后一个入口再补一次重试（吸收偶发丢包）。全部失败才报"不可达"。 */
    const once = (base) => {
      const ctl = ("AbortController" in window) ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => { try { ctl.abort(); } catch (e) {} }, 8000) : null;
      const p = fetch(base + path, {
        method, headers: h, body: body ? JSON.stringify(body) : undefined, signal: ctl && ctl.signal,
      });
      const clear = () => { if (timer) clearTimeout(timer); };
      p.then(clear, clear);
      return p;
    };
    const eps = A.endpoints();
    let r = null, usedEp = null;
    for (let i = 0; i < eps.length; i++) {
      const base = eps[i];
      try {
        r = await once(base);
        usedEp = base;
        break;                                   // 拿到响应（含 4xx/5xx）即停止换入口
      } catch (e1) {
        if (i < eps.length - 1) { await new Promise(res => setTimeout(res, 300)); continue; }
        try { r = await once(base); usedEp = base; } catch (e2) { /* 最后入口也失败 */ }
      }
    }
    if (!r) {
      const err = new Error("连不上服务器（API 暂不可达）。后端部署在 Cloudflare 的 workers.dev 域名上，该域名在国内被拦截，" +
        "切换 Wi-Fi / 4G 都无效，只能挂代理访问；也可到「设置 → Cloudflare Worker」点「自动选择可用入口」（桥接入口上线后会自动命中）。");
      err.network = true;
      throw err;
    }
    if (usedEp) ls("stats_api_pick", usedEp);
    let j = null; try { j = await r.json(); } catch (_) {}
    if (!r.ok) { const e = new Error((j && j.error) || ("HTTP " + r.status)); e.status = r.status; throw e; }
    return j;
  }

  /* ---------------- 注册 / 登录 / 退出 ---------------- */
  A.register = async (email, password, nick) => {
    const j = await call("POST", "/auth/register", { email, password, nick });
    _saveSession(j);
    await syncUp();       // 注册即把本机已有数据带上云端
    return j.user;
  };
  A.login = async (email, password) => {
    const j = await call("POST", "/auth/login", { email, password });
    _saveSession(j);
    await mergeFromCloud();   // 登录后拉取该用户云端数据并合并进本机
    return j.user;
  };
  A.logout = () => { ls(LS.token, null); ls(LS.user, null); };

  async function _saveSession(j) {
    ls(LS.token, j.token);
    ls(LS.user, JSON.stringify(j.user));
    ls(LS.syncAt, String(Date.now()));
  }

  /* ---------------- 个人数据同步 ----------------
   * 本机数据源：Dexie 表 favorites/histories/weakBank。
   * 上传（syncUp）：整包 PUT，服务端 ON CONFLICT DO NOTHING / MAX 合并，幂等安全。
   * 下载（mergeFromCloud）：把云端条目与本机条目做并集写入本地。
   ----------------------------------------------- */
  async function collectLocal() {
    const db = DB.db;
    let dailyRows = [];
    try { dailyRows = await db.dailyDone.toArray(); } catch (_) { /* 旧版 DB 尚未升级时跳过 */ }
    const [fav, his, weak] = await Promise.all([
      db.favorites.toArray(), db.histories.toArray(), db.weakBank.toArray(),
    ]);
    const snap = {
      favorites: fav.map(x => ({ id: x.questionId, at: x.createdAt })),
      histories: his.map(x => ({ id: x.questionId, views: x.views || 1, at: x.viewedAt || x.createdAt || Date.now() })),
      weak: weak.map(x => ({ id: x.questionId, at: x.createdAt })),
      daily: dailyRows.map(r => ({ day: r.day, ids: r.ids || [] })),
    };
    A._rememberSnapshot(snap);   // 缓存快照，供关闭页面时 sendBeacon 兜底使用
    return snap;
  }

  A.syncUp = syncUp;
  async function syncUp() {
    if (!A.isLoggedIn()) return { applied: 0 };
    const payload = await collectLocal();
    return call("PUT", "/me/data", payload);
  }

  /* ---------------- 关闭/隐藏页面时的兜底上传（sendBeacon） ----------------
   * 场景：用户刷完题直接关标签页/切后台，常规 fetch 可能被浏览器取消，
   * 导致最后一次学习数据没传上去。sendBeacon 专为这种场景设计，
   * 失败时降级为 keepalive fetch。token 走查询参数（sendBeacon 无法带自定义 header）。
   ----------------------------------------------- */
  let lastLocalSnapshot = null;
  A._rememberSnapshot = function (snap) { lastLocalSnapshot = snap; };

  A.beaconSync = function () {
    try {
      if (!A.isLoggedIn() || !lastLocalSnapshot) return;
      const payload = JSON.stringify(lastLocalSnapshot);
      const url = apiBase() + "/me/data?token=" + encodeURIComponent(A.getToken());
      let ok = false;
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        ok = navigator.sendBeacon(url, blob);
      }
      if (!ok) {
        fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) { /* 兜底逻辑，任何异常静默 */ }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") A.beaconSync();
  });
  window.addEventListener("pagehide", () => A.beaconSync());

  /* 模拟面试报告：保存一条到云端（登录后），失败静默，绝不打断面试流程 */
  A.saveReport = async function (r) {
    if (!A.isLoggedIn()) return false;
    try { const res = await call("POST", "/me/reports", r); return !!(res && res.ok); }
    catch (e) { return false; }
  };

  /* 拉取历次模拟面试报告（最近 20 次），未登录或接口不可用时返回空数组 */
  A.getReports = async function () {
    if (!A.isLoggedIn()) return [];
    try { const res = await call("GET", "/me/reports"); return (res && res.reports) || []; }
    catch (e) { return []; }
  };

  A.mergeFromCloud = mergeFromCloud;
  async function mergeFromCloud() {
    if (!A.isLoggedIn()) return;
    const remote = await call("GET", "/me/data");
    const db = DB.db;
    const now = Date.now();
    await db.transaction("rw", [db.favorites, db.histories, db.weakBank, db.dailyDone], async () => {
      // favorites
      const favKeys = new Set((await db.favorites.toArray()).map(x => x.questionId));
      const newFav = (remote.favorites || []).filter(f => !favKeys.has(f.id))
        .map(f => ({ questionId: f.id, createdAt: f.at || now }));
      if (newFav.length) await db.favorites.bulkAdd(newFav);
      // histories：取较大者
      const hisMap = new Map((await db.histories.toArray()).map(x => [x.questionId, x]));
      const newHis = [];
      for (const h of remote.histories || []) {
        const cur = hisMap.get(h.id);
        if (!cur) { newHis.push({ questionId: h.id, views: h.views || 1, viewedAt: h.at || now, createdAt: h.at || now }); }
        else if ((h.views || 0) > (cur.views || 0)) { cur.views = h.views; cur.viewedAt = Math.max(cur.viewedAt || 0, h.at || 0); await db.histories.put(cur); }
      }
      if (newHis.length) await db.histories.bulkAdd(newHis);
      // weak bank
      const weakKeys = new Set((await db.weakBank.toArray()).map(x => x.questionId));
      const newWeak = (remote.weak || []).filter(w => !weakKeys.has(w.id))
        .map(w => ({ questionId: w.id, createdAt: w.at || now }));
      if (newWeak.length) await db.weakBank.bulkAdd(newWeak);
      // 每日打卡：按天并集，不丢任一设备的记录
      const dayRe = /^\d{4}-\d{2}-\d{2}$/;
      const dMap = new Map((await db.dailyDone.toArray()).map(x => [x.day, x]));
      const newDaily = [];
      for (const d of (remote.daily || [])) {
        const day = String(d.day || "");
        if (!dayRe.test(day)) continue;
        const ids = new Set([...(dMap.get(day) ? (dMap.get(day).ids || []) : []), ...(Array.isArray(d.ids) ? d.ids : [])]);
        const arr = Array.from(ids).filter(v => v > 0);
        if (dMap.has(day)) { const row = dMap.get(day); row.ids = arr; await db.dailyDone.put(row); }
        else newDaily.push({ day, ids: arr, updatedAt: now });
      }
      if (newDaily.length) await db.dailyDone.bulkAdd(newDaily);
    });
    await Services.reload();
    ls(LS.syncAt, String(now));
  }

  /* 自动定期上报：登录状态下每次进入站点静默同步一次（失败不打扰） */
  A.autoSyncIfDue = async function () {
    try {
      if (!A.isLoggedIn()) return;
      const last = parseInt(ls(LS.syncAt) || "0");
      if (Date.now() - last < 10 * 60 * 1000) return;   // 10 分钟内不重复
      await syncUp();
      ls(LS.syncAt, String(Date.now()));
    } catch (_) { /* 静默失败 */ }
  };

  /* ---------------- 管理员接口 ---------------- */
  A.adminListUsers = (q) => call("GET", "/admin/users" + (q ? "?q=" + encodeURIComponent(q) : ""));
  A.adminSetStatus = (id, status) => call("POST", "/admin/users/" + id + "/status", { status });
  A.adminResetPassword = (id, password) => call("POST", "/admin/users/" + id + "/reset", { password });

  /* ---------------- UI：登录/注册页 ---------------- */
  A.renderLoginPage = function () {
    const user = A.getUser();
    setMain(`
      <div class="section-head"><h2>${user ? "我的帐号" : "登录 / 注册"}</h2></div>
      <div class="card" style="max-width:440px;margin:0 auto">
        ${user ? `
          <p>当前用户：<b>${U.esc(user.nick || user.email)}</b>${user.role === "admin" ? ' <span class="tag tag-success">管理员</span>' : ""}</p>
          <p class="muted" style="font-size:13px">登录后，你的收藏、刷题历史与错题本会自动云同步——换设备也能接着刷。</p>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-primary" id="acc-sync">立即同步</button>
            <button class="btn btn-danger" id="acc-logout">退出登录</button>
          </div>
          <div id="acc-out" class="muted" style="margin-top:12px;font-size:13px"></div>
        ` : `
          <div class="tabs" style="margin-bottom:16px">
            <button class="btn btn-sm" id="tab-login">登录</button>
            <button class="btn btn-sm btn-primary" id="tab-reg">注册新帐号</button>
          </div>
          <label class="field"><span>邮箱</span><input id="acc-email" type="email" placeholder="you@example.com" /></label>
          <label class="field"><span>密码（至少 8 位）</span><input id="acc-pass" type="password" placeholder="••••••••" /></label>
          <label class="field" id="nick-row" style="display:none"><span>昵称（可选）</span><input id="acc-nick" type="text" /></label>
          <button class="btn btn-primary full" id="acc-go" style="margin-top:8px">注 册</button>
          <div id="acc-out" style="margin-top:12px;color:#DC2626;font-size:13px"></div>
          <p class="muted" style="font-size:12px;margin-top:14px">帐号仅用于云同步你的学习数据；邮箱不对外展示。</p>
        `}
      </div>`);

    if (user) {
      $("#acc-sync").onclick = async () => {
        const out = $("#acc-out"); out.textContent = "正在同步…";
        try { const r = await syncUp(); out.textContent = "已上传本机数据（应用 " + (r.applied || 0) + " 条变更）";
              await mergeFromCloud(); Services.reload(); route(); }
        catch (e) { out.textContent = "同步失败：" + e.message; }
      };
      $("#acc-logout").onclick = () => { A.logout(); U.toast("已退出登录", "info"); renderTopbar(); route(); };
      return;
    }

    let mode = "reg";
    const nickRow = $("#nick-row"), goBtn = $("#acc-go"), out = $("#acc-out");
    $("#tab-login").onclick = () => { mode = "login"; nickRow.style.display = "none"; goBtn.textContent = "登 录"; };
    $("#tab-reg").onclick   = () => { mode = "reg";   nickRow.style.display = "";     goBtn.textContent = "注 册"; };
    goBtn.onclick = async () => {
      const email = $("#acc-email").value.trim(), pass = $("#acc-pass").value, nick = ($("#acc-nick") && $("#acc-nick").value.trim()) || "";
      if (!email || !pass) { out.textContent = "请填写邮箱和密码"; return; }
      goBtn.disabled = true; out.style.color = "#64748B"; out.textContent = mode === "reg" ? "注册中…" : "登录中…";
      try {
        if (mode === "reg") await A.register(email, pass, nick);
        else await A.login(email, pass);
        U.toast("欢迎，" + email, "success");
        renderTopbar(); route();
      } catch (e) {
        out.style.color = "#DC2626"; out.textContent = e.message;
      } finally { goBtn.disabled = false; }
    };
  };

  /* ---------------- UI：管理员帐号管理页 ---------------- */
  A.renderAdminPage = function () {
    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/admin/dashboard">管理</a><span class="sep">/</span><span>帐号管理</span></div>
      <div class="section-head"><h2>帐号管理</h2></div>
      <div class="toolbar"><input id="u-q" class="full" style="max-width:280px" placeholder="搜索邮箱或昵称…" />
        <button class="btn" id="u-refresh">${U.icon("refresh")} 刷新</button></div>
      <div class="card" style="padding:0"><table class="data">
        <thead><tr><th>ID</th><th>邮箱</th><th>昵称</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
        <tbody id="u-tb"><tr><td colspan="7">加载中…</td></tr></tbody></table></div>
      <div class="note" style="margin-top:10px">禁用会立即踢掉该用户的全部登录会话；重置密码同样使其下线。</div>`);

    const load = async (q) => {
      const tb = $("#u-tb");
      try {
        const r = await A.adminListUsers(q);
        tb.innerHTML = (r.users || []).map(u => `
          <tr>
            <td>${u.id}</td><td>${U.esc(u.email)}</td><td>${U.esc(u.nick || "-")}</td>
            <td>${u.role === "admin" ? '<span class="tag tag-success">admin</span>' : "user"}</td>
            <td>${u.status === 1 ? '<span class="tag tag-success">正常</span>' : '<span class="tag tag-danger">禁用</span>'}</td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm" data-act="toggle" data-id="${u.id}" data-s="${u.status}">${u.status === 1 ? "禁用" : "启用"}</button>
              <button class="btn btn-sm" data-act="reset" data-id="${u.id}">重置密码</button>
            </td>
          </tr>`).join("") || '<tr><td colspan="7">暂无用户</td></tr>';
        tb.querySelectorAll("button[data-act]").forEach(b => {
          b.onclick = async () => {
            const id = parseInt(b.dataset.id), act = b.dataset.act;
            if (act === "toggle") {
              const s = b.dataset.s === "1" ? 0 : 1;
              if (!(await U.confirm(s === 0 ? "禁用该用户？其所有会话将失效。" : "重新启用该用户？", { okText: "确定" }))) return;
              try { await A.adminSetStatus(id, s); U.toast("已更新", "success"); load($("#u-q").value.trim()); }
              catch (e) { U.toast(e.message, "error"); }
            } else {
              const pw = prompt("为该用户设置新密码（至少 8 位）：");
              if (!pw) return;
              try { await A.adminResetPassword(id, pw); U.toast("已重置并强制下线", "success"); }
              catch (e) { U.alert(e.message); }
            }
          };
        });
      } catch (e) {
        tb.innerHTML = `<tr><td colspan="7">
          <div style="padding:10px 4px">
            <span class="tag tag-danger">加载失败</span> ${U.esc(e.message || "未知错误")}
            <div style="margin-top:8px"><button class="btn btn-sm btn-primary" id="u-retry">${U.icon("refresh")} 重试</button></div>
          </div></td></tr>`;
        const rb = tb.querySelector("#u-retry");
        if (rb) rb.onclick = () => { tb.innerHTML = '<tr><td colspan="7">加载中…</td></tr>'; load(q); };
      }
    };
    $("#u-refresh").onclick = () => load("");
    $("#u-q").addEventListener("keydown", e => { if (e.key === "Enter") load($("#u-q").value.trim()); });
    load("");
  };

  /* 启动后异步拉取一次远程入口配置，下次调用即生效（eu.org 通过后改 JSON 即可全量切换） */
  try { A.refreshEndpoints(); } catch (e) {}

  window.Account = A;
})();
