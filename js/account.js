/* =========================================================================
 *  account.js  —  用户帐号系统（前端）
 *  后端：Cloudflare Worker /auth/*、/me/data（D1）。
 *  能力：注册/登录/退出；收藏、刷题历史、错题本按用户云同步（换设备不丢）；
 *        管理员帐号管理（列表/搜索/禁用/重置密码）。
 * ========================================================================= */
(function () {
  "use strict";
  const A = {};
  const LS = { token: "acc_token", user: "acc_user", syncAt: "acc_sync_at" };
  const API_DEFAULT = "https://it-interview-stats.iti-interview.workers.dev";

  function ls(k, v) {
    if (v === undefined) return localStorage.getItem(k);
    v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
  }
  const apiBase = () => (localStorage.getItem("stats_api") || API_DEFAULT).replace(/\/+$/, "");

  A.getUser = () => { try { return JSON.parse(ls(LS.user) || "null"); } catch (e) { return null; } };
  A.getToken = () => ls(LS.token) || "";
  A.isLoggedIn = () => !!(A.getToken() && A.getUser());

  async function call(method, path, body) {
    const h = { "Content-Type": "application/json" };
    if (A.getToken()) h["Authorization"] = "Bearer " + A.getToken();
    const r = await fetch(apiBase() + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
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
    const [fav, his, weak] = await Promise.all([
      db.favorites.toArray(), db.histories.toArray(), db.weakBank.toArray(),
    ]);
    return {
      favorites: fav.map(x => ({ id: x.questionId, at: x.createdAt })),
      histories: his.map(x => ({ id: x.questionId, views: x.views || 1, at: x.viewedAt || x.createdAt || Date.now() })),
      weak: weak.map(x => ({ id: x.questionId, at: x.createdAt })),
    };
  }

  A.syncUp = syncUp;
  async function syncUp() {
    if (!A.isLoggedIn()) return { applied: 0 };
    const payload = await collectLocal();
    return call("PUT", "/me/data", payload);
  }

  A.mergeFromCloud = mergeFromCloud;
  async function mergeFromCloud() {
    if (!A.isLoggedIn()) return;
    const remote = await call("GET", "/me/data");
    const db = DB.db;
    const now = Date.now();
    await db.transaction("rw", [db.favorites, db.histories, db.weakBank], async () => {
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
        tb.innerHTML = `<tr><td colspan="7">加载失败：${U.esc(e.message)}</td></tr>`;
      }
    };
    $("#u-refresh").onclick = () => load("");
    $("#u-q").addEventListener("keydown", e => { if (e.key === "Enter") load($("#u-q").value.trim()); });
    load("");
  };

  window.Account = A;
})();
