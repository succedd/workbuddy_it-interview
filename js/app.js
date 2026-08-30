/* =========================================================================
 *  app.js  —  路由 / 顶部栏 / 侧边栏 / 主题 / 全部页面
 * ========================================================================= */
(function () {
  "use strict";
  const App = {};
  const $ = U.qs, $$ = U.qsa;
  let main, sidebar, topbar;
  let curCatOpen = {};      // 侧边树展开状态
  let charts = [];

  /* ============================ 主题 ============================ */
  const THEME_KEY = "it_hub_theme";
  App.getTheme = () => { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } };
  App.setTheme = function (mode) {
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    applyTheme();
  };
  function applyTheme() {
    const mode = App.getTheme();
    let eff = mode;
    if (mode === "system") eff = (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", eff);
    const light = document.getElementById("hljs-light");
    const dark = document.getElementById("hljs-dark");
    if (light) light.disabled = (eff === "dark");
    if (dark) dark.disabled = (eff !== "dark");
  }
  function cycleTheme() {
    const order = ["light", "dark", "system"];
    const i = order.indexOf(App.getTheme());
    App.setTheme(order[(i + 1) % order.length]);
    renderTopbar();
  }

  /* ============================ 路由 ============================ */
  function parseHash() {
    const h = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = h.split("?");
    const q = {};
    if (qs) qs.split("&").forEach(p => { const [k, v] = p.split("="); q[decodeURIComponent(k)] = decodeURIComponent(v || ""); });
    const parts = path.split("/").filter(Boolean);
    return { path, parts, q };
  }

  App.go = function (hash) { location.hash = hash; };

  App.requireAdmin = function () {
    if (Auth.isAdmin()) return true;
    main.innerHTML = `<div class="empty"><div class="em-ic">${U.icon("shield")}</div>
      <h3>需要管理员权限</h3><p>该功能仅管理员可用，请先登录管理员模式。</p>
      <button class="btn btn-primary" id="to-login">${U.icon("user")} 管理员登录</button></div>`;
    $("#to-login").onclick = openAdminLogin;
    return false;
  };

  function clearCharts() { charts.forEach(c => { try { c.dispose(); } catch (e) {} }); charts = []; }

  /* 页面级键盘快捷键：每次路由切换自动清理，避免监听器泄漏 */
  let pageKeyHandler = null;
  function setPageKeys(handler) {
    if (pageKeyHandler) document.removeEventListener("keydown", pageKeyHandler);
    pageKeyHandler = handler || null;
    if (handler) document.addEventListener("keydown", handler);
  }
  function typingInField(e) {
    const t = e.target;
    return !!(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable));
  }

  async function route() {
    clearCharts();
    setPageKeys(null);
    const r = parseHash();
    renderSidebar(r);
    /* 动态 document.title：浏览器标签/历史/收藏可区分页面（404 与详情页会再覆盖） */
    document.title = "IT面试题库管理系统";
    if (r.parts[0] === "admin") {
      if (!App.requireAdmin()) return;
      const sub = r.parts[1] || "dashboard";
      if (sub === "dashboard") return pageAdminDashboard();
      if (sub === "questions") return pageAdminQuestions();
      if (sub === "question") return pageAdminQuestionEdit(r.parts[2]);
      if (sub === "categories") return pageAdminCategories();
      if (sub === "positions") return pageAdminPositions();
      if (sub === "ai") return pageAdminAI();
      if (sub === "import") return pageAdminImport();
      if (sub === "backup") return pageAdminBackup();
      if (sub === "settings") return pageAdminSettings();
      if (sub === "users") return window.Account ? Account.renderAdminPage() : pageAdminDashboard();
      return pageAdminDashboard();
    }
    switch (r.parts[0]) {
      case undefined: case "": case "home": return pageHome();
      case "category": return pageCategory(r.q);
      case "position": return r.parts[1] ? pagePositionDetail(r.parts[1]) : pagePositions();
      case "questions": return pageQuestions(r.q);
      case "question": return pageQuestionDetail(r.parts[1]);
      case "favorites": return pageFavorites();
      case "history": return pageHistory();
      case "help": return pageHelp();
      case "practice": return pagePractice(r.q);
      case "review": return pageReview();
      case "random": {
        const pool = Services.questions.filter(x => x.status === "published");
        return pool.length ? App.go("/question/" + pool[Math.floor(Math.random() * pool.length)].id) : pageHome();
      }
      case "mock": return pageMock();
      case "account": return window.Account ? Account.renderLoginPage() : pageHome();
      default: return page404(r.parts.join("/"));
    }
  }

  /* ============================ 404 页 ============================ */
  function page404(path) {
    document.title = "页面不存在 · IT面试题库";
    setMain(`<div class="empty" style="padding:60px 0">
      <div style="font-size:56px;font-weight:700;color:var(--c-primary);opacity:.25">404</div>
      <h2>页面不存在</h2>
      <p class="secondary">访问的地址 <code>${U.esc("#/" + (path || ""))}</code> 不存在或已被移动。</p>
      <div class="pill-row" style="justify-content:center;margin-top:16px">
        <a class="btn btn-primary" href="#/">${U.icon("home")} 返回首页</a>
        <a class="btn" href="#/questions">${U.icon("layers")} 浏览题目</a>
      </div></div>`);
  }

  /* ============================ 顶部栏 ============================ */
  function renderTopbar() {
    const theme = App.getTheme();
    const themeIcon = theme === "dark" ? "sun" : theme === "system" ? "monitor" : "moon";
    const themeLabel = theme === "dark" ? "暗色" : theme === "system" ? "跟随系统" : "亮色";
    const adminHtml = Auth.isAdmin()
      ? `<div class="dropdown-wrap"><button class="btn btn-ghost btn-sm" id="admin-btn">${U.icon("shield")} 管理</button>
         <div class="dropdown" id="admin-menu" style="display:none">
           <a href="#/admin/dashboard">${U.icon("barChart")} 仪表盘</a>
           <a href="#/admin/questions">${U.icon("fileText")} 题目管理</a>
           <a href="#/admin/categories">${U.icon("layers")} 分类管理</a>
           <a href="#/admin/positions">${U.icon("briefcase")} 岗位管理</a>
           <a href="#/admin/ai">${U.icon("sparkles")} AI 出题</a>
           <a href="#/admin/import">${U.icon("upload")} 批量导入</a>
           <a href="#/admin/backup">${U.icon("database")} 备份恢复</a>
           <a href="#/admin/users">${U.icon("users")||U.icon("user")} 帐号管理</a>
           <a href="#/admin/settings">${U.icon("settings")||U.icon("user")} 系统设置</a>
           <div class="sep"></div>
           <a href="#" id="admin-logout">${U.icon("x")} 退出管理</a>
         </div></div>`
      : `<button class="btn btn-ghost btn-sm" id="admin-login-btn">${U.icon("user")} 管理员</button>`;
    topbar.innerHTML = `
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="打开菜单">${U.icon("menu")}</button>
      <a class="brand" href="#/"><span class="logo">I</span> IT面试题库</a>
      <div class="topbar-search">
        <span class="icon">${U.icon("search")}</span>
        <input id="global-search" type="text" placeholder="搜索题目、技术、岗位、标签…" />
      </div>
      <div class="topbar-actions">
        <a class="icon-btn" href="#/category" title="技术体系">${U.icon("layers")}</a>
        <a class="icon-btn" href="#/position" title="岗位体系">${U.icon("briefcase")}</a>
        <a class="icon-btn" href="#/mock" title="模拟面试">${U.icon("play")}</a>
        <a class="icon-btn" href="#/favorites" title="收藏夹">${U.icon("bookmark")}</a>
        <button class="icon-btn" id="theme-btn" title="${themeLabel}" aria-label="切换主题（当前${themeLabel}）">${U.icon(themeIcon)}</button>
        ${Cloud.isEditor() ? `<span id="autopub-chip" class="vis-chip autopub" style="display:none"></span>` : ""}
        <span id="net-chip" class="vis-chip net-off" style="display:none" title="当前无网络连接，展示的是本地缓存的数据">⚡ 离线 · 本地缓存</span>
        ${(window.Account && Account.isLoggedIn()) ? (() => { const u = Account.getUser(); return `<a class="btn btn-ghost btn-sm" href="#/account" title="我的帐号" style="gap:6px">${U.icon("user")} ${U.esc((u.nick || u.email).split("@")[0].slice(0, 10))}</a>`; })() : `<a class="btn btn-ghost btn-sm" href="#/account">${U.icon("user")} 登录</a>`}
        ${adminHtml}
        ${`<span class="vis-chip" title="本机访问统计（当前浏览器）">${U.icon("eye")}<span class="vic">今日访问 <b id="vis-today" class="vis-num">–</b></span><span class="vic">累计访问 <b id="vis-total" class="vis-num">–</b></span></span>`}
      </div>`;
    const gs = $("#global-search");
    gs.addEventListener("keydown", e => { if (e.key === "Enter" && gs.value.trim()) { shPush(gs.value.trim()); App.go("/questions?q=" + encodeURIComponent(gs.value.trim())); } });
    attachHistory(gs, t => { shPush(t); App.go("/questions?q=" + encodeURIComponent(t)); });
    $("#theme-btn").onclick = cycleTheme;
    $("#menu-toggle").onclick = () => { document.body.classList.toggle("drawer-open"); };
    updateNetChip();
    if (Auth.isAdmin()) {
      const ab = $("#admin-btn"); const menu = $("#admin-menu");
      ab.onclick = (e) => { e.stopPropagation(); menu.style.display = menu.style.display === "none" ? "block" : "none"; };
      document.addEventListener("click", () => { menu.style.display = "none"; });
      $("#admin-logout").onclick = (e) => { e.preventDefault(); Auth.logout(); U.toast("已退出管理员模式", "info"); renderTopbar(); renderSidebar(parseHash()); };
    } else {
      $("#admin-login-btn").onclick = openAdminLogin;
    }
    refreshVisitorStats();
  }

  /* 离线提示：断网时顶栏常驻「离线」徽章（PWA 离线可用，但需告知数据是本地缓存） */
  function updateNetChip() {
    const el = document.getElementById("net-chip");
    if (el) el.style.display = navigator.onLine ? "none" : "";
  }
  window.addEventListener("online", updateNetChip);
  window.addEventListener("offline", updateNetChip);

  /* ============================ 侧边栏 ============================ */
  function renderSidebar(r) {
    const navItem = (href, icon, label, active, badge) =>
      `<a class="side-nav-item ${active ? "active" : ""}${badge ? " has-due" : ""}" href="${href}">${U.icon(icon)}<span>${label}</span>${badge ? `<span class="due-badge">${badge}</span>` : ""}</a>`;
    const p0 = r.parts[0] || "home";
    let html = `
      <div class="nav-section-title">导航</div>
      ${navItem("#/", "home", "首页", p0 === "home")}
      ${navItem("#/category", "layers", "技术体系", p0 === "category")}
      ${navItem("#/position", "briefcase", "岗位体系", p0 === "position")}
      ${navItem("#/mock", "play", "模拟面试", p0 === "mock")}
      ${navItem("#/random", "dice", "随机一题", p0 === "random")}
      ${navItem("#/practice", "refresh", "刷题练习", p0 === "practice")}
      ${navItem("#/favorites", "bookmark", "收藏夹", p0 === "favorites")}
      ${navItem("#/history", "history", "浏览历史", p0 === "history")}
      ${navItem("#/review", "alert", "错题重练", p0 === "review", App.reviewDue || 0)}
      ${navItem("#/help", "fileText", "使用指南", p0 === "help")}
      <div class="nav-section-title">技术分类</div>
      <div id="side-tree">${renderTree(0, r)}</div>`;
    if (Auth.isAdmin()) {
      html += `<div class="nav-section-title">管理</div>
        ${navItem("#/admin/dashboard", "barChart", "仪表盘", p0 === "admin" && r.parts[1] === "dashboard")}
        ${navItem("#/admin/ai", "sparkles", "AI 出题", p0 === "admin" && r.parts[1] === "ai")}
        ${navItem("#/admin/import", "upload", "批量导入", p0 === "admin" && r.parts[1] === "import")}
        ${navItem("#/admin/backup", "database", "备份恢复", p0 === "admin" && r.parts[1] === "backup")}`;
    }
    sidebar.innerHTML = html;
    $$("#side-tree .tree-row").forEach(row => {
      row.onclick = (e) => {
        if (e.target.closest(".twist")) {
          const id = row.dataset.id; curCatOpen[id] = !curCatOpen[id];
          renderSidebar(parseHash()); return;
        }
        App.go("/category?cat=" + row.dataset.id);
        document.body.classList.remove("drawer-open");
      };
    });
  }

  function renderTree(parentId, r) {
    const kids = Services.childrenOf(parentId);
    if (!kids.length) return "";
    return kids.map(c => {
      const open = curCatOpen[c.id];
      const active = (r.q && r.q.cat && String(r.q.cat) === String(c.id));
      const grand = Services.childrenOf(c.id);
      return `<div class="tree-node">
        <div class="tree-row ${open ? "open" : ""} ${active ? "active" : ""}" data-id="${c.id}">
          ${grand.length ? `<span class="twist">${U.icon("chevronRight")}</span>` : `<span class="twist" style="visibility:hidden">${U.icon("chevronRight")}</span>`}
          <span>${U.esc(c.icon || "📁")} ${U.esc(c.name)}</span>
          <span class="tree-count">${Services.catCounts[c.id] || 0}</span>
        </div>
        ${open ? `<div class="tree-children">${renderTree(c.id, r)}</div>` : ""}
      </div>`;
    }).join("");
  }

  /* ============================ 通用组件 ============================ */
  function qCard(q, matches) {
    const hl = (t, k) => matches ? Search.highlight(t, matches, k) : U.esc(t);
    const diffCls = "diff-" + q.difficulty;
    const tags = (q.tags || []).slice(0, 4).map(t => `<span class="tag">${U.esc(t)}</span>`).join("");
    const pos = (q.positionNames || []).slice(0, 3).map(p => `<span class="tag tag-outline" style="cursor:pointer" onclick="event.preventDefault();event.stopPropagation();location.href='#/questions?pos=${encodeURIComponent(p)}'">${U.esc(p)}</span>`).join("");
    return `<a class="card card-hover q-card" href="#/question/${q.id}">
      <div class="q-title">${hl(q.title, "title")}</div>
      <div class="q-excerpt">${hl((q.body || "").replace(/[#*`>]/g, "").slice(0, 100), "body")}</div>
      <div class="q-meta">
        <span class="tag ${diffCls}">${q.difficulty}</span>
        <span class="tag">${U.esc(q.type)}</span>
        ${q.catName ? `<span class="tag tag-primary">${U.esc(q.catName)}</span>` : ""}
        ${pos}${tags}
      </div>
      <div class="q-foot">
        <span>${U.icon("eye")} ${(q.views || 0)}</span>
        <span>${U.icon("bookmark")} ${(q.favorites || 0)}</span>
        <span>${U.icon("star")} ${q.aiScore || 0}</span>
        <span class="muted">${U.fmtDate(q.updatedAt)}</span>
      </div>
    </a>`;
  }

  function setMain(html, after) {
    main.innerHTML = `<div class="container page-enter">${html}</div>`;
    window.scrollTo(0, 0);
    if (after) after();
    U.highlightAll(main);
  }

  /* ============================ 首页 ============================ */
  /* ============================ 今日5题 & 学习打卡 & 最近搜索 ============================ */
  const SH_KEY = "search_history";
  const HOT_TERMS = ["Redis", "MySQL 索引", "消息队列", "JVM", "TCP 三次握手", "分布式事务", "操作系统", "算法"];
  function shGet() { try { return JSON.parse(localStorage.getItem(SH_KEY) || "[]"); } catch (e) { return []; } }
  function shPush(q) { if (!q) return; const arr = shGet().filter(x => x.q !== q); arr.unshift({ q, t: Date.now() }); localStorage.setItem(SH_KEY, JSON.stringify(arr.slice(0, 10))); }
  function attachHistory(input, onGo) {
    if (!input) return;
    let dd = null;
    const close = () => { if (dd) { dd.remove(); dd = null; } };
    const open = () => {
      close();
      const hist = shGet();
      dd = document.createElement("div");
      dd.className = "search-dd";
      let h;
      if (hist.length) {
        h = `<div class="sd-head"><span>最近搜索</span><button type="button" class="sd-clear">清空</button></div>`
          + hist.map(x => `<div class="sd-item" data-q="${U.esc(x.q)}"><span class="sd-ic">${U.icon("history")}</span><span class="sd-q">${U.esc(x.q)}</span><button type="button" class="sd-del" data-del="${U.esc(x.q)}" title="删除这条">×</button></div>`).join("");
      } else {
        h = `<div class="sd-head"><span>热门搜索</span></div><div class="sd-hot">${HOT_TERMS.map(t => `<button type="button" class="tag tag-link" data-q="${U.esc(t)}">${U.esc(t)}</button>`).join("")}</div>`;
      }
      dd.innerHTML = h;
      input.parentNode.appendChild(dd);
      dd.addEventListener("click", (e) => {
        const del = e.target.closest(".sd-del");
        if (del) { e.stopPropagation(); localStorage.setItem(SH_KEY, JSON.stringify(shGet().filter(x => x.q !== del.dataset.del))); open(); return; }
        if (e.target.closest(".sd-clear")) { localStorage.removeItem(SH_KEY); open(); return; }
        const it = e.target.closest("[data-q]");
        if (it && it.dataset.q != null) { input.value = it.dataset.q; close(); onGo(it.dataset.q); }
      });
    };
    input.addEventListener("focus", open);
    input.addEventListener("input", close);
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    document.addEventListener("click", (e) => { if (dd && !e.target.closest(".search-dd") && e.target !== input) close(); });
  }

  function dateKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* 今日5题：以日期字符串为种子的确定性抽样——当天固定，次日自动更换 */
  function todayFive() {
    const pool = Services.questions.filter(q => q.status === "published").map(q => q.id);
    const dk = dateKey();
    let h = 2166136261;
    for (let i = 0; i < dk.length; i++) { h ^= dk.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = mulberry32(h >>> 0);
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr.slice(0, Math.min(5, arr.length));
  }
  /* 温故知新：3-30 天前浏览过、未进错题本、今日未打卡的题，混入今日清单前 2 位
     （设置开关 review_stale，默认关；候选按「最久未看优先」，同日内稳定） */
  async function buildDailyList() {
    const base = todayFive();
    try {
      if (localStorage.getItem("review_stale") === "1" && DB.db) {
        const [rows, weakRows, done] = await Promise.all([
          DB.db.histories.toArray(), DB.db.weakBank.toArray(), dailyDoneGet()
        ]);
        const weakIds = new Set(weakRows.map(w => w.questionId));
        const doneSet = new Set(done);
        const now = Date.now();
        const stale = rows
          .filter(h => typeof h.questionId === "number" && now - h.createdAt >= 3 * 864e5 && now - h.createdAt <= 30 * 864e5
            && !weakIds.has(h.questionId) && !doneSet.has(h.questionId))
          .sort((a, b) => a.createdAt - b.createdAt || a.questionId - b.questionId)
          .map(h => Services.questions.find(q => q.id === h.questionId && q.status === "published"))
          .filter(Boolean)
          .map(q => q.id)
          .filter(id => base.indexOf(id) < 0);
        return stale.slice(0, 2).concat(base);
      }
    } catch (e) {}
    return base;
  }
  /* —— 今日5题完成记录：IndexedDB dailyDone 表（随个人数据云同步，换设备不丢） ——
   * 兼容：首次运行时把旧版 localStorage 的当日记录迁移进 IDB。 */
  async function dailyDoneGet(day) {
    day = day || dateKey();
    try {
      const rows = await DB.db.dailyDone.where("day").equals(day).toArray();
      if (rows.length) return rows[0].ids || [];
      /* 迁移：旧数据在 localStorage daily_done_<day>，只迁今天这一天（历史记录无从补齐） */
      let legacy = [];
      try { legacy = JSON.parse(localStorage.getItem("daily_done_" + day) || "[]"); } catch (e) {}
      if (legacy.length) await DB.db.dailyDone.add({ day, ids: legacy, updatedAt: Date.now() });
      return legacy;
    } catch (e) { return []; }
  }
  async function dailyDoneAdd(id) {
    try {
      const day = dateKey();
      const rows = await DB.db.dailyDone.where("day").equals(day).toArray();
      const row = rows[0];
      const ids = (row && row.ids) || [];
      if (ids.indexOf(id) < 0) {
        ids.push(id);
        if (row) await DB.db.dailyDone.update(row.id, { ids, updatedAt: Date.now() });
        else await DB.db.dailyDone.add({ day, ids, updatedAt: Date.now() });
      }
    } catch (e) {}
  }
  async function markDailyDone(id) {
    const five = (App.dailyList && App.dailyList.length) ? App.dailyList : todayFive();
    if (five.indexOf(Number(id)) < 0 && five.indexOf(id) < 0) return false;
    const v = Number(id);
    await dailyDoneAdd(v);
    return true;
  }
  /* 打卡：基于本地统计的每日访问记录推导连续天数与热力图 */
  function streakInfo() {
    const st = Stats.getLocalStats(); const daily = st.daily || {};
    const total = Object.keys(daily).length;
    const has = k => !!daily[k];
    let streak = 0;
    const d = new Date();
    if (!has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (has(dateKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    const cells = [];
    const c = new Date(); c.setDate(c.getDate() - 34);
    for (let i = 0; i < 35; i++) { const k = dateKey(c); cells.push({ k, n: daily[k] || 0 }); c.setDate(c.getDate() + 1); }
    return { streak, total, cells };
  }

  async function pageHome() {
    const stats = await Services.stats();
    const tree = Services.categoryTree();
    const posByStage = Services.positionsByStage();
    const hotTags = ["Java", "MySQL", "Redis", "Spring Boot", "Vue3", "React", "Docker", "Kubernetes", "TCP", "算法", "Python", "AI大模型"];
    const recent = stats.recent.slice(0, 6);
    const best = Services.questions.slice().sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)).slice(0, 6);
    const catCards = tree.map(c => {
      const empty = !c.count;
      return `<a class="card card-hover${empty ? " cat-empty" : ""}" href="#/category?cat=${c.id}" style="text-decoration:none">
        ${empty ? `<span class="soon-chip">即将上线</span>` : ""}
        <div style="font-size:24px">${U.esc(c.icon || "📁")}</div>
        <div style="font-weight:600;margin-top:6px">${U.esc(c.name)}</div>
        <div class="muted" style="font-size:12px">${empty ? "题目录入中" : c.count + " 题 · " + (c.era || "")}</div>
      </a>`;
    }).join("");
    const stageCards = posByStage.map(s => { const seen = new Set(); const uniq = s.list.filter(p => { if (Services.isHiddenPosition(p)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; }); return `<div class="card"><div class="tag tag-ai" style="margin-bottom:8px">${U.esc(s.stage)}</div>
        <div class="pill-row">${uniq.slice(0, 8).map(p => `<a class="tag tag-outline" href="#/position/${p.id}" style="text-decoration:none">${U.esc(Services.posFullName(p))}</a>`).join("")}${uniq.length > 8 ? `<span class="muted">+${uniq.length - 8}</span>` : ""}</div></div>`; }).join("");
    const qlist = arr => arr.map(q => qCard(q)).join("");
    /* —— 今日5题 & 学习打卡 & 继续上次 —— */
    const five = (App.dailyList && App.dailyList.length) ? App.dailyList : todayFive(); const doneSet = await dailyDoneGet();
    const fiveLeft = five.filter(id => doneSet.indexOf(id) < 0);
    const qById = id => Services.questions.find(x => x.id === id);
    let fiveHtml = "";
    if (five.length) {
      const rows = five.map(id => {
        const q = qById(id); if (!q) return "";
        const ok = doneSet.indexOf(id) >= 0;
        return `<a href="#/question/${id}" style="text-decoration:none;display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--border)">
          <span>${ok ? "✅" : "⬜"}</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(q.title)}</span></a>`;
      }).join("");
      fiveHtml = `<div class="card" style="padding:16px 18px">
        <div style="display:flex;align-items:center;margin-bottom:10px"><span style="font-size:20px">🎯</span><b style="margin-left:8px">今日 5 题</b>
          <span class="tag ${fiveLeft.length ? "tag-primary" : "tag-success"}" style="margin-left:auto">${doneSet.filter(id => five.indexOf(id) >= 0).length}/${five.length}</span></div>
        <div class="daily-list">${rows}</div>
        ${fiveLeft.length ? `<a class="btn btn-primary btn-sm" style="margin-top:10px" href="#/question/${fiveLeft[0]}">开始刷题 →</a>`
                          : `<div class="note" style="margin-top:10px;background:rgba(16,185,129,.08)">🎉 今日 5 题已完成，明天见！</div>`}
        <label style="margin-top:10px;font-size:12px;color:var(--text-muted);cursor:pointer;display:flex;gap:6px;align-items:center"><input type="checkbox" id="stale-toggle" ${localStorage.getItem("review_stale") === "1" ? "checked" : ""}> 温故知新：把 3 天前浏览过的题混进来</label>
      </div>`;
    }
    const sk = streakInfo();
    const heatHtml = sk.cells.map(c => `<span class="heat-cell h${c.n === 0 ? 0 : c.n <= 2 ? 1 : c.n <= 4 ? 2 : c.n <= 8 ? 3 : 4}" title="${c.k} · ${c.n} 次"></span>`).join("");
    const streakHtml = `<div class="card" style="padding:16px 18px">
      <div style="display:flex;align-items:center;margin-bottom:10px"><span style="font-size:20px">🔥</span><b style="margin-left:8px">学习打卡</b>
        <span class="muted" style="margin-left:auto;font-size:12px">累计 ${sk.total} 天</span></div>
      <div style="font-size:26px;font-weight:700;color:#f59e0b">连续 ${sk.streak} 天</div>
      <div class="heat-grid" style="margin-top:10px">${heatHtml}</div>
      <div class="muted" style="font-size:11px;margin-top:6px">最近 35 天 · 打开即打卡</div>
    </div>`;
    let resumeHtml = "";
    try {
      const lq = JSON.parse(localStorage.getItem("last_question") || "null");
      if (lq && lq.id && lq.title && Services.questions.some(x => x.id === lq.id)) {
        resumeHtml = `<a class="card card-hover" href="#/question/${lq.id}" style="text-decoration:none;display:flex;align-items:center;gap:12px;padding:14px 18px">
          <span style="font-size:22px">📖</span>
          <span style="flex:1;min-width:0"><b>继续上次</b><span class="muted" style="margin-left:10px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:70%;vertical-align:bottom">${U.esc(lq.title)}</span></span>
          <span class="tag tag-primary">继续 →</span></a>`;
      }
    } catch (e) {}
    /* —— 学习周报：口径修正（真实可解释）+ 环比上周 + 一周柱状图 + 行动入口 ——
       口径说明：
       - 刷题数 = 本周浏览的不同题数（浏览历史按题去重，createdAt=最后一次浏览时间）
       - 完成5题天数 = dailyDone 记录天数（做完当日 5 题才算，与打卡卡的「打开即打卡」不同口径）
       - 新增薄弱 = 本周新进错题本的题数；薄弱分类 Top 优先本周，无则回退累计并标注 */
    let weekHtml = "";
    try {
      const db = DB.db;
      const now = new Date();
      const dow = (now.getDay() + 6) % 7;   // 0=周一
      const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).setHours(0, 0, 0, 0);
      const ws = day0 - dow * 864e5;             // 本周一 0 点
      const wPrev = ws - 7 * 864e5;              // 上周一 0 点
      const we = day0 + 864e5;                   // 本周区间终点（明天 0 点）
      const mmdd = t => { const d = new Date(t); return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      const [hisAll, weakAll, dailyRows] = await Promise.all([db.histories.toArray(), db.weakBank.toArray(), db.dailyDone.toArray()]);

      const weekViewsRows = hisAll.filter(h => (h.createdAt || 0) >= ws && (h.createdAt || 0) < we);
      const prevViewsRows = hisAll.filter(h => (h.createdAt || 0) >= wPrev && (h.createdAt || 0) < ws);
      const weekQs = new Set(weekViewsRows.map(h => h.questionId)).size;
      const prevQs = new Set(prevViewsRows.map(h => h.questionId)).size;
      const weekWeakNew = weakAll.filter(w => (w.createdAt || 0) >= ws && (w.createdAt || 0) < we).length;
      const prevWeakNew = weakAll.filter(w => (w.createdAt || 0) >= wPrev && (w.createdAt || 0) < ws).length;
      const weekDays = new Set(dailyRows.filter(r => Date.parse(r.day + "T00:00:00") >= ws && Date.parse(r.day + "T00:00:00") < we).map(r => r.day)).size;
      const prevDays = new Set(dailyRows.filter(r => { const t = Date.parse(r.day + "T00:00:00"); return t >= wPrev && t < ws; }).map(r => r.day)).size;

      /* 环比徽章：goodWhenDown 用于「新增薄弱」这类越少越好的指标 */
      const trendBadge = (cur, prev, goodWhenDown) => {
        if (!prev) return cur > 0 ? '<span class="wk-trend good">新增</span>' : "";
        const pct = Math.round((cur - prev) / prev * 100);
        if (pct === 0) return '<span class="wk-trend flat">持平</span>';
        const up = pct > 0;
        const good = goodWhenDown ? !up : up;
        return `<span class="wk-trend ${good ? "good" : "bad"}">${up ? "↑" : "↓"} ${Math.abs(pct)}%</span>`;
      };

      /* 一周迷你柱状图：每天刷题数（不同题，按最后浏览时间计） */
      const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
      const perDay = Array.from({ length: 7 }, (_, i) => {
        const a = ws + i * 864e5, b = a + 864e5;
        return { i, n: i <= dow ? hisAll.filter(h => (h.createdAt || 0) >= a && (h.createdAt || 0) < b).length : -1, future: i > dow };
      });
      const maxN = Math.max(1, ...perDay.map(d => d.n));
      const bars = perDay.map(d => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
        <div class="bar-track">${d.future ? "" : `<div class="bar-fill${d.i === dow ? " today" : ""}" style="height:${d.n ? Math.max(12, Math.round(d.n / maxN * 100)) : 0}%" title="${d.n} 题"></div>`}</div>
        <span class="muted" style="font-size:11px">${d.future ? "" : (d.i === dow ? "今" : dayNames[d.i])}</span>
      </div>`).join("");

      /* 薄弱分类：优先本周新增，无则回退累计；标签可点击跳分类刷题 */
      const weakCatsWeek = {}, weakCatsAll = {};
      for (const w of weakAll) {
        const q = Services.questions.find(x => x.id === w.questionId);
        if (!q || q.categoryId == null) continue;
        weakCatsAll[q.categoryId] = (weakCatsAll[q.categoryId] || 0) + 1;
        if ((w.createdAt || 0) >= ws) weakCatsWeek[q.categoryId] = (weakCatsWeek[q.categoryId] || 0) + 1;
      }
      const catTag = ([cid, n]) => { const c = Services.catMap.get(parseInt(cid)) || Services.catMap.get(cid); const name = c ? c.name : ("#" + cid); return `<a class="tag tag-outline" href="#/questions?cat=${cid}">${U.esc(name)} <b>${n}</b></a>`; };
      const weekTop = Object.entries(weakCatsWeek).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const allTop = Object.entries(weakCatsAll).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const catLine = weekTop.length
        ? '<span class="muted" style="font-size:12px">本周新增薄弱：</span>' + weekTop.map(catTag).join(" ")
        : (allTop.length ? '<span class="muted" style="font-size:12px">本周无新增 · 累计薄弱：</span>' + allTop.map(catTag).join(" ")
                         : '<span class="muted">暂无，保持住！</span>');

      /* 本周标记不会的题：默认折叠进明细，避免撑长卡片 */
      const weekWeakQs = weakAll.filter(w => (w.createdAt || 0) >= ws && (w.createdAt || 0) < we)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5)
        .map(w => Services.questions.find(x => x.id === w.questionId)).filter(Boolean);
      const weakDetails = weekWeakQs.length
        ? `<details class="wk-sec">
            <summary><b>本周标记不会的题</b> <span class="muted" style="font-size:12px">（${weekWeakNew} 道）</span></summary>
            <div style="margin-top:4px">${weekWeakQs.map(q => `<a href="#/question/${q.id}" style="text-decoration:none;display:flex;gap:8px;padding:5px 0;border-bottom:1px dashed var(--border)"><span>❌</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(q.title)}</span></a>`).join("")}
            <a href="#/review" class="muted" style="font-size:12px;display:inline-block;margin-top:6px">全部都在错题重练 →</a></div>
          </details>`
        : "";

      const allZero = weekQs === 0 && weekDays === 0 && weekWeakNew === 0;
      const rangeLabel = `本周 ${mmdd(ws)} ~ ${mmdd(day0)}`;
      weekHtml = `<div class="card" style="padding:16px 18px;margin-top:20px">
        <div style="display:flex;align-items:center;margin-bottom:12px"><span style="font-size:20px">📊</span><b style="margin-left:8px">学习周报</b>
          <span class="muted" style="margin-left:auto;font-size:12px">${rangeLabel}</span></div>
        ${allZero
          ? `<div style="text-align:center;padding:6px 0 2px"><div style="font-size:15px">本周还没开始，随时可以出发 💪</div><div style="margin-top:10px"><a class="btn btn-primary btn-sm" href="#/random">随机来一题 →</a> <a class="btn btn-sm" href="#/practice">进入刷题</a></div></div>`
          : `<div class="wk-stats">
              <div class="wk-stat"><div class="wk-num" style="color:var(--c-primary)">${weekQs}${trendBadge(weekQs, prevQs, false)}</div><div class="wk-label">刷题数 · 不同题</div></div>
              <div class="wk-stat"><div class="wk-num" style="color:var(--c-warning)">${weekDays}${trendBadge(weekDays, prevDays, false)}</div><div class="wk-label">完成5题天数</div></div>
              <div class="wk-stat"><div class="wk-num" style="color:var(--c-danger)">${weekWeakNew}${trendBadge(weekWeakNew, prevWeakNew, true)}</div><div class="wk-label">新增薄弱</div></div>
            </div>
            <div class="wk-sec">
              <div class="muted" style="font-size:11px;margin-bottom:6px">每日刷题（不同题）</div>
              <div class="wk-bars">${bars}</div>
            </div>
            <div class="wk-sec" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${catLine}</div>
            ${weakDetails}`}
      </div>`;
    } catch (e) { weekHtml = ""; }
    /* —— 到期复习横幅：有到期题时在首页最顶部醒目提醒（比侧边栏小圆点显眼得多） —— */
    let dueBannerHtml = "";
    try {
      const wl = await Services.weakList();
      const dn = (wl.due || []).length;
      App.reviewDue = dn;
      if (dn > 0) {
        dueBannerHtml = `<a class="card card-hover review-banner" href="#/review" style="margin-top:20px">
          <span class="rb-ic">📚</span>
          <span class="rb-txt"><b style="font-size:16px">今天有 ${dn} 道题到复习时间了</b>
            <div class="muted" style="font-size:13px;margin-top:3px">趁还记得赶紧巩固，错过这次复习间隔会拉得更长</div></span>
          <span class="tag tag-warning" style="white-space:nowrap">立即复习 →</span></a>`;
      }
    } catch (e) {}
    setMain(`
      <section class="hero">
        <h1>IT 面试题库 · 刷题 / 模拟面试</h1>
        <p>覆盖完整技术体系与岗位体系的高频面试题库：在线刷题、错题间隔复习、模拟面试与学习周报，支持云端同步与离线使用。</p>
        <div class="hero-search">
          <input id="hero-search" type="text" placeholder="输入关键词，如 Redis 缓存穿透、Spring 事务…" />
          <button class="btn btn-primary btn-lg" id="hero-go">${U.icon("search")} 搜索</button>
          <a class="btn btn-lg" href="#/random">${U.icon("dice")} 随机一题</a>
        </div>
        <div class="hot-tags">${hotTags.map(t => `<span class="tag" data-tag="${U.esc(t)}">${U.esc(t)}</span>`).join("")}</div>
      </section>

      <section class="stat-grid" style="margin-top:28px">
        <div class="stat"><div class="num" data-roll="${tree.length}">0</div><div class="label">技术分类</div></div>
        <div class="stat"><div class="num" data-roll="${stats.total}">0</div><div class="label">题目总数</div></div>
        <div class="stat"><div class="num" data-roll="${stats.positions}">0</div><div class="label">覆盖岗位</div></div>
        <div class="stat ai"><div class="num" data-roll="${stats.ai}">0</div><div class="label">AI 生成题</div></div>
      </section>

      ${dueBannerHtml}
      ${resumeHtml ? `<div style="margin-top:20px">${resumeHtml}</div>` : ""}
      ${(fiveHtml || streakHtml) ? `<div class="grid grid-cols-2" style="margin-top:20px">${streakHtml}${fiveHtml}</div>` : ""}
      ${weekHtml}

      <div class="section-head"><h2>技术体系</h2><a class="more" href="#/category">查看全部 →</a></div>
      <div class="grid grid-cols-auto">${catCards}</div>

      <div class="section-head"><h2>岗位体系</h2><a class="more" href="#/position">查看全部 →</a></div>
      <div class="grid grid-cols-2">${stageCards}</div>

      <div class="section-head"><h2>最新题目</h2><a class="more" href="#/questions?sort=updated">更多 →</a></div>
      <div class="grid grid-cols-2">${qlist(recent)}</div>

      <div class="section-head"><h2>精选题目（AI 评分最高）</h2><a class="more" href="#/questions?sort=aiScore">更多 →</a></div>
      <div class="grid grid-cols-2">${qlist(best)}</div>

      <div class="note" style="margin-top:24px">提示：题目与学习记录默认保存在本机浏览器，登录后可云端同步；支持离线使用，安装到主屏幕体验更佳。</div>
    `);
    const heroGo = t => { const v = (t || $("#hero-search").value).trim(); if (v) { shPush(v); App.go("/questions?q=" + encodeURIComponent(v)); } };
    $("#hero-search").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.value.trim()) heroGo(); });
    $("#hero-go").onclick = () => heroGo();
    attachHistory($("#hero-search"), heroGo);
    const staleToggle = $("#stale-toggle");
    if (staleToggle) staleToggle.onchange = async () => {
      try { localStorage.setItem("review_stale", staleToggle.checked ? "1" : "0"); } catch (e) {}
      App.dailyList = await buildDailyList();
      U.toast(staleToggle.checked ? "已开启温故知新：3 天前看过的题会混入今日清单" : "已关闭温故知新", "info");
      pageHome();
    };
    $$(".hot-tags .tag").forEach(t => t.onclick = () => App.go("/questions?q=" + encodeURIComponent(t.dataset.tag)));
    $$("#main .num[data-roll]").forEach(el => U.rollNumber(el, parseInt(el.dataset.roll)));
  }

  /* ============================ 技术体系页 ============================ */
  let _catMapChart = null;
  window.addEventListener("resize", () => { if (_catMapChart) _catMapChart.resize(); });
  /* 人工精选的域级架构图（data/tech-maps.json），整个会话只拉一次 */
  let _techMapsP = null, _techMapsCache = null;
  function loadTechMaps() {
    if (!_techMapsP) _techMapsP = fetch("data/tech-maps.json").then(r => r.ok ? r.json() : null).catch(() => null);
    return _techMapsP;
  }

  async function pageCategory(q) {
    document.title = "技术体系 · IT面试题库";
    const catId = q.cat ? parseInt(q.cat) : null;
    const tree = Services.categoryTree();
    const childrenOfId = id => Services.childrenOf(id);
    const listHtml = async (id) => {
      const ids = [id].concat(Services.descendantIds(id));
      let qs = Services.questions.filter(x => ids.indexOf(x.categoryId) >= 0);
      qs = Search.sort(qs, "updated");
      return qs;
    };
    const treeHtml = (nodes) => nodes.map(c => {
      const kids = childrenOfId(c.id);
      const open = catId === c.id || (catId != null && Services.descendantIds(catId).indexOf(c.id) >= 0);
      return `<div class="tree-node"><div class="tree-row ${open ? "open" : ""} ${catId === c.id ? "active" : ""}" data-id="${c.id}">
        ${kids.length ? `<span class="twist">${U.icon("chevronRight")}</span>` : `<span class="twist" style="visibility:hidden">${U.icon("chevronRight")}</span>`}
        <span>${U.esc(c.icon || "📁")} ${U.esc(c.name)}</span><span class="tree-count">${c.count}</span></div>
        ${kids.length ? `<div class="tree-children" ${open ? "" : 'style="display:none"'}>${treeHtml(kids)}</div>` : ""}</div>`;
    }).join("");

    let selected = catId != null ? Services.getCategory(catId) : null;
    let qs = catId != null ? await listHtml(catId) : Services.questions.slice();
    if (!catId) qs = Search.sort(qs, "updated");

    const renderList = (arr) => {
      const grid = $("#cat-list-grid");
      if (!arr.length) { grid.innerHTML = `<div class="empty">${U.icon("fileText")}<p>该分类下暂无题目</p></div>`; return; }
      grid.innerHTML = arr.slice(0, 40).map(q => qCard(q)).join("");
    };

    /* 技术全景图：有「架构图 | 分支树」双标签——人工精选的域级架构图优先，
       分支树为自动生成的以当前分类为根的 ECharts 树（子技术 + 题量 + 薄弱标记） */
    function initCatMap() {
      const box = $("#catmap-box");
      if (!box) return;
      const toggle = $("#catmap-toggle");
      if (toggle) toggle.onclick = () => {
        const open = box.style.display !== "none";
        box.style.display = open ? "none" : "";
        toggle.textContent = open ? "展开" : "收起";
        if (!open && _catMapChart) _catMapChart.resize();
      };
      Services.getWeakQuestions().then(wq => {
        const weakMap = new Map();
        (wq || []).forEach(w => { if (w.categoryId) weakMap.set(w.categoryId, (weakMap.get(w.categoryId) || 0) + 1); });
        return weakMap;
      }).catch(() => new Map()).then(weakMap => {
        const dark = App.getTheme() === "dark";
        const findNode = (nodes, id) => { for (const n of nodes) { if (n.id === id) return n; if (n.children && n.children.length) { const r = findNode(n.children, id); if (r) return r; } } return null; };
        const renderTree = () => {
          box.style.height = "min(58vh,480px)";
          box.style.overflowY = "hidden";
          box.innerHTML = `<div style="width:100%;height:100%"></div>`;
          U.loadScript("echarts", U.ECHARTS_URL).then(() => {
            const holder = box.firstElementChild;
            if (!holder || !window.echarts) return;
            const toData = (node, hlId) => ({
              id: node.id,
              name: node.name + " · " + (node.count || 0) + "题",
              count: node.count || 0,
              weak: weakMap.get(node.id) || 0,
              itemStyle: { color: (weakMap.get(node.id) || 0) > 0 ? "#F59E0B" : (node.id === hlId ? "#1D4ED8" : (node.count ? "#3B82F6" : "#CBD5E1")) },
              label: { color: dark ? "#e2e8f0" : "#334155", fontWeight: node.id === hlId ? 700 : 400 },
              children: (node.children || []).map(c => toData(c, hlId))
            });
            let data, depth = 2;
            const selfNode = findNode(tree, catId);
            if (selfNode && selfNode.children && selfNode.children.length) {
              data = toData(selfNode, catId);
              data.name = selected.name + " · " + qs.length + "题";   // 根节点显示含子分类的总题数
            } else {
              /* 叶子分类：展示它在同级技术中的位置 */
              const pNode = selected.parentId ? findNode(tree, selected.parentId) : null;
              data = pNode ? toData(pNode, catId) : { name: "技术体系 · " + qs.length + "题", count: qs.length, weak: 0, itemStyle: { color: "#1D4ED8" }, label: { color: dark ? "#e2e8f0" : "#334155" }, children: tree.map(c => toData(c, catId)) };
              depth = 1;
            }
            if (_catMapChart) { try { _catMapChart.dispose(); } catch (e) {} }
            _catMapChart = echarts.init(holder);
            _catMapChart.setOption({
              tooltip: { trigger: "item", triggerOn: "mousemove", formatter: p => (p.data && p.data.count != null) ? U.esc(String(p.name).replace(/ · \d+题$/, "")) + "：" + p.data.count + " 题" + (p.data.weak ? " · 薄弱 " + p.data.weak + " 题" : "") : "" },
              series: [{
                type: "tree", data: [data], orient: "LR", roam: true,
                left: "1%", right: "22%", top: "2%", bottom: "2%",
                initialTreeDepth: depth, expandAndCollapse: true, animationDuration: 300,
                symbol: "circle", symbolSize: 12,
                lineStyle: { color: dark ? "#334155" : "#BFDBFE", width: 1.3, curveness: 0.5 },
                label: { position: "left", verticalAlign: "middle", align: "right", fontSize: 12, distance: 5 },
                leaves: { label: { position: "right", verticalAlign: "middle", align: "left", distance: 5 } },
                emphasis: { focus: "descendant" }
              }]
            });
            /* 点击末级节点直达对应分类；上层节点保留展开/收起 */
            _catMapChart.on("click", params => {
              const d = params.data;
              if (d && d.id && (!d.children || !d.children.length)) App.go("/category?cat=" + d.id);
            });
          }).catch(() => {});
        };
        const renderTechMap = (key) => {
          const map = _techMapsCache && _techMapsCache[String(key)];
          if (!map || !map.layers || !map.layers.length) { renderTree(); return; }
          box.style.height = "auto";
          box.style.overflowY = "visible";
          const PAL = [["rgba(37,99,235,.07)", "#2563EB"], ["rgba(16,185,129,.08)", "#059669"], ["rgba(139,92,246,.08)", "#7C3AED"], ["rgba(245,158,11,.09)", "#D97706"], ["rgba(236,72,153,.07)", "#DB2777"], ["rgba(6,182,212,.08)", "#0891B2"]];
          const resolveCat = (name) => {
            if (!name) return 0;
            const sub = new Set([Number(key)].concat(Services.descendantIds(Number(key))));
            const hit = Services.categories.find(c => c.name === name && sub.has(c.id)) || Services.categories.find(c => c.name === name);
            return hit ? hit.id : 0;
          };
          const host = $("#catmap-body") || box;
          host.innerHTML = map.layers.map((L, i) => {
            const pal = PAL[i % PAL.length];
            const chips = (L.items || []).map(it => {
              const cid = resolveCat(it);
              if (!cid) return `<span class="tm-chip">${U.esc(it)}</span>`;
              const cnt = Services.catCounts[cid] || 0;
              const wk = weakMap.get(cid) || 0;
              return `<span class="tm-chip link${wk ? " has-weak" : ""}" data-cat="${cid}" title="查看「${U.esc(it)}」分类题目">${U.esc(it)}<i>${cnt}题</i>${wk ? `<i class="tm-weak">薄弱${wk}</i>` : ""}</span>`;
            }).join("");
            return `<div class="tm-layer" style="background:${pal[0]};border-left-color:${pal[1]}"><div class="tm-name" style="color:${pal[1]}">${U.esc(L.name || "")}</div><div class="tm-items">${chips}</div></div>${i < map.layers.length - 1 ? '<div class="tm-arrow">▼</div>' : ""}`;
          }).join("") + (map.note ? `<p class="muted" style="font-size:12px;margin:12px 0 0">${U.esc(map.note)}</p>` : "");
          host.querySelectorAll(".tm-chip.link").forEach(ch => { ch.onclick = () => App.go("/category?cat=" + ch.dataset.cat); });
        };
        loadTechMaps().then(maps => {
          _techMapsCache = maps || {};
          /* 从当前分类向上找最近的有人工架构图的域（叶子分类也能看到所属域的全景） */
          let mapKey = null, p = catId, guard = 0;
          while (p && guard++ < 10) { if (_techMapsCache[String(p)]) { mapKey = String(p); break; } const c = Services.getCategory(p); p = c ? (c.parentId || 0) : 0; }
          const wireSeg = (active) => {
            $$("#catmap-seg button").forEach(b => {
              b.classList.toggle("active", b.dataset.t === active);
              b.onclick = () => {
                if (b.classList.contains("active")) return;
                frame(b.dataset.t);
                if (b.dataset.t === "map") { if (_catMapChart) { try { _catMapChart.dispose(); } catch (e) {} _catMapChart = null; } renderTechMap(mapKey); }
                else renderTree();
              };
            });
          };
          const frame = (active) => {
            box.innerHTML = `<div class="seg" id="catmap-seg" style="margin-bottom:10px"><button data-t="map"${active === "map" ? ' class="active"' : ""}>架构图</button><button data-t="tree"${active === "tree" ? ' class="active"' : ""}>分支树</button></div><div id="catmap-body"></div>`;
            wireSeg(active);
          };
          if (mapKey) { frame("map"); renderTechMap(mapKey); }
          else renderTree();
        });
      });
    }

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>技术体系</span></div>
      <div class="layout" style="display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:start">
        <aside class="card" style="position:sticky;top:80px;max-height:80vh;overflow:auto">
          <div class="nav-section-title" style="padding-left:0">分类树（按技术演进）</div>
          <div id="page-tree">${treeHtml(tree)}</div>
        </aside>
        <div>
          <div class="section-head" style="margin-top:0"><h2>${selected ? U.esc(selected.name) : "全部题目"}</h2>
            <span class="muted">${qs.length} 题</span></div>
          ${selected ? `
          <div class="card" id="catmap-card" style="margin:0 0 16px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <div class="nav-section-title" style="padding-left:0;margin:0">🗺️ 技术全景图</div>
              <span class="muted" style="font-size:12px">架构图/分支树：点击末级节点直达分类 · <span style="color:#F59E0B">橙</span>=有薄弱题（来自错题本）</span>
              <span class="spacer"></span>
              <button id="catmap-toggle" class="btn btn-sm btn-secondary">收起</button>
            </div>
            <div id="catmap-box" class="chart-fade" style="height:min(58vh,480px);margin-top:8px"></div>
          </div>` : ""}
          <div class="toolbar">
            <div class="seg" id="sort-seg">
              <button data-s="updated" class="active">最新</button>
              <button data-s="views">最热</button>
              <button data-s="favorites">收藏最多</button>
              <button data-s="aiScore">AI评分</button>
            </div>
            <span class="spacer"></span>
            ${Auth.isAdmin() ? `<a class="btn btn-ai btn-sm" href="#/admin/question/new?cat=${catId || ""}">${U.icon("plus")} 新增题目</a>` : ""}
          </div>
          <div class="grid grid-cols-2" id="cat-list-grid"></div>
        </div>
      </div>
    `, selected ? () => initCatMap() : null);
    renderList(qs);
    $$("#page-tree .tree-row").forEach(row => {
      row.onclick = (e) => {
        const id = parseInt(row.dataset.id);
        if (e.target.closest(".twist")) { row.classList.toggle("open"); const ch = row.parentElement.querySelector(".tree-children"); if (ch) ch.style.display = ch.style.display === "none" ? "block" : "none"; return; }
        App.go("/category?cat=" + id);
      };
    });
    $$("#sort-seg button").forEach(b => b.onclick = () => {
      $$("#sort-seg button").forEach(x => x.classList.remove("active")); b.classList.add("active");
      renderList(Search.sort(qs, b.dataset.s));
    });
  }

  /* ============================ 岗位体系页 ============================ */
  async function pagePositions() {
    document.title = "岗位体系 · IT面试题库";
    const byStage = Services.positionsByStage();
    const hiddenIds = new Set(Services.positions.filter(p => Services.isHiddenPosition(p)).map(p => p.id));
    const fakeIds = new Set(Services.positions.filter(p => Services.isFakePosition(p)).map(p => p.id));
    const hasFake = fakeIds.size > 0;
    const html = byStage.map(s => {
      // 按名字去重：同名岗位只显示第一个（防止 seed 重复写入或树节点重名）
      const seen = new Set();
      const uniq = s.list.filter(p => {
        if (hiddenIds.has(p.id)) return false;        // 隐藏与分类同名的岗位（它是分类，不是岗位）
        if (seen.has(Services.posKey(p))) return false;
        seen.add(Services.posKey(p));
        return true;
      });
      if (!uniq.length) return "";
      return `<div class="section-head" style="margin-top:24px"><h2>${U.esc(s.stage)}</h2><span class="tag tag-ai">${U.esc(s.list[0] ? s.list[0].tag : "")}</span></div>
      <div class="grid grid-cols-auto">${uniq.map(p => {
        const qn = Services.questionCountForPosition(p);
        const skillN = Services.skillsOf(p.id).length;
        const demand = p.demand || "中";
        const catLink = p.categoryId ? `<a href="#/category?cat=${p.categoryId}">${U.esc(p.category || "")}</a>` : U.esc(p.category || "");
        return `<a class="card card-hover" href="#/position/${p.id}" style="text-decoration:none">
          <div style="font-weight:700">${U.esc(Services.posFullName(p))}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">${catLink}</div>
          <div class="q-meta" style="margin-top:10px">
            <span class="tag">${qn} 题</span>
            <span class="tag tag-outline">${skillN} 技术栈</span>
            <span class="tag ${demand === "高" ? "tag-success" : demand === "低" ? "tag-warning" : ""}">热度 ${U.esc(demand)}</span>
          </div>
        </a>`;
      }).join("")}</div>`;
    }).join("");
    const cleanBtn = hasFake ? `<button id="clean-fake-pos" class="btn btn-secondary" style="margin-left:auto">清理 ${fakeIds.size} 条无效岗位</button>` : "";
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>岗位体系</span></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><h1 style="margin:0">岗位体系</h1>${cleanBtn}</div>
      <p class="secondary">按 IT 行业岗位出现的先后顺序组织，点击岗位查看必考/加分技术栈与题目。</p>${html}`);
    if (hasFake) {
      $("#clean-fake-pos").onclick = async () => {
        const n = await DB.migrateRemoveFakePositions();
        await Services.reload();
        U.toast("已清理 " + n + " 条无效岗位", "success");
        pagePositions();
      };
    }
  }

  /* ============================ 岗位详情页 ============================ */
  async function pagePositionDetail(id) {
    const p = Services.getPosition(parseInt(id));
    if (!p) { setMain(`<div class="empty">未找到该岗位</div>`); return; }
    const skills = Services.skillsOf(p.id);
    const required = skills.filter(s => s.required);
    const bonus = skills.filter(s => !s.required);
    const qn = Services.questionCountForPosition(p);
    // 难度分布
    const posQs = Services.questions.filter(q => Services.matchPosition(q, p));
    const dist = { "初级": 0, "中级": 0, "高级": 0, "专家": 0 };
    posQs.forEach(q => { if (dist[q.difficulty] != null) dist[q.difficulty]++; });
    const skillCard = (s) => {
      const onClick = s.categoryId != null ? `onclick="location.hash='/category?cat=${s.categoryId}'"` : `onclick="location.hash='/questions?q=${encodeURIComponent(s.techName)}'"`;
      return `<div class="skill-card ${s.required ? "" : "bonus"}" style="cursor:pointer" ${onClick}>
        <div class="sk-name">${U.esc(s.techName)} ${s.required ? "" : '<span class="tag tag-ai" style="font-size:10px">加分</span>'}</div>
        <div class="sk-depth">掌握深度：${U.esc(s.depth)}</div>
        <div>${U.stars(s.stars)}</div>
        <div class="muted" style="font-size:12px;margin-top:4px">题库相关题：${Services.questions.filter(q => (q.tags || []).indexOf(s.techName) >= 0 || (q.catName === s.techName)).length}</div>
      </div>`;
    };
    const hot = posQs.slice().sort((a, b) => (b.views || 0) + (b.favorites || 0) - (a.views || 0) - (a.favorites || 0)).slice(0, 6);
    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/position">岗位体系</a><span class="sep">/</span><span>${U.esc(Services.posFullName(p))}</span></div>
      <h1>${U.esc(Services.posFullName(p))} <span class="tag tag-ai">${U.esc(p.stage)}</span></h1>
      <p class="secondary">${U.esc(p.description || (p.category ? "隶属「" + p.category + "」方向" : "该岗位共关联 " + qn + " 道题目"))}</p>
      <div class="grid grid-cols-2" style="margin:16px 0">
        <div class="card"><div class="stat"><div class="num">${qn}</div><div class="label">岗位题目数</div></div></div>
        <div class="card"><div class="stat ai"><div class="num">${skills.length}</div><div class="label">技术栈数量</div></div></div>
      </div>
      <div class="section-head"><h2>必考技术栈</h2></div>
      <div class="grid grid-cols-3">${required.length ? required.map(skillCard).join("") : '<div class="muted">暂无配置</div>'}</div>
      <div class="section-head"><h2>加分技术栈</h2></div>
      <div class="grid grid-cols-3">${bonus.length ? bonus.map(skillCard).join("") : '<div class="muted">暂无配置</div>'}</div>
      <div class="section-head"><h2>题目难度分布</h2></div>
      <div class="card"><div id="pos-chart" style="height:260px"></div></div>
      <div class="section-head"><h2>热门题目</h2></div>
      <div class="grid grid-cols-2">${hot.length ? hot.map(q => qCard(q)).join("") : '<div class="muted">暂无题目</div>'}</div>
      <div class="pill-row" style="margin-top:20px">
        <a class="btn btn-primary" href="#/mock?pos=${p.id}">${U.icon("play")} 一键模拟面试</a>
        <a class="btn" href="#/questions?posid=${p.id}">${U.esc("按技术分类刷题")}</a>
        <a class="btn" href="#/questions?posid=${p.id}">查看全部题目</a>
      </div>
    `, () => {
      /* echarts 大库按需加载（加载失败静默，图表区留白不影响页面） */
      U.loadScript("echarts", U.ECHARTS_URL).then(() => {
        const posBox = $("#pos-chart");
        posBox.classList.add("chart-fade");
        const chart = echarts.init(posBox);
        charts.push(chart);
        chart.setOption({
          tooltip: { trigger: "item" },
          series: [{ type: "pie", radius: ["40%", "70%"], data: Object.keys(dist).map(k => ({ name: k, value: dist[k], itemStyle: { color: { "初级": "#10B981", "中级": "#3B82F6", "高级": "#F59E0B", "专家": "#EF4444" }[k] } })), label: { color: App.getTheme() === "dark" ? "#e2e8f0" : "#0f172a" } }]
        });
      }).catch(() => {});
    });
  }

  /* ============================ 题目列表页 ============================ */
  async function pageQuestions(q) {
    document.title = "题目列表 · IT面试题库";
    const diffs = ["初级", "中级", "高级", "专家"];
    const types = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];
    let base = Services.questions.slice();
    if (q.cat) { const id = parseInt(q.cat); const ids = [id].concat(Services.descendantIds(id)); base = base.filter(x => ids.indexOf(x.categoryId) >= 0); }
    if (q.posid) {
      const pos = Services.getPosition(parseInt(q.posid));
      if (pos) base = base.filter(x => Services.matchPosition(x, pos));
    }
    if (q.pos) {
      const posName = decodeURIComponent(q.pos);
      const pos = Services.positions.find(x => x.name === posName) || { name: posName };
      base = base.filter(x => Services.matchPosition(x, pos));
    }

    const filters = { difficulty: [], type: [], source: [], status: [], tags: [], aiMin: null, aiMax: null, q: q.q || "" };
    const sortBy = q.sort || "updated";

    const apply = () => {
      let arr = Search.filter(base, filters);
      const fuseMap = (filters.q && Services.fuse) ? Search.run(Services.fuse, filters.q) : null;
      if (fuseMap) arr = arr.filter(x => fuseMap.has(x.id));
      arr = Search.sort(arr, sortBy);
      renderGrid(arr);
    };
    const renderGrid = (arr) => {
      const grid = $("#q-grid");
      if (!arr.length) {
        const term = filters.q;
        const hot = term ? `<div class="sd-hot" style="margin-top:10px;justify-content:flex-start">${HOT_TERMS.map(t => `<button type="button" class="tag tag-link" data-sug="${U.esc(t)}">${U.esc(t)}</button>`).join("")}</div>` : "";
        grid.innerHTML = `<div class="empty" style="text-align:left;align-items:flex-start"><div style="display:flex;gap:8px;align-items:center">${U.icon("search")}<b>没有匹配的题目${term ? `：${U.esc(term)}` : ""}</b></div>${term ? `<p class="muted" style="margin-top:8px">换个关键词试试，或看看热门：</p>${hot}` : `<p class="muted" style="margin-top:8px">换个筛选条件看看</p>`}</div>`;
        $$("#q-grid [data-sug]").forEach(b => b.onclick = () => { $("#q-search").value = b.dataset.sug; filters.q = b.dataset.sug; apply(); });
        $("#q-count").textContent = "0"; return;
      }
      $("#q-count").textContent = arr.length;
      const fuseMap = (filters.q && Services.fuse) ? Search.run(Services.fuse, filters.q) : null;
      grid.innerHTML = arr.slice((page - 1) * 20, page * 20).map(x => qCard(x, fuseMap ? fuseMap.get(x.id) : null)).join("");
      renderPager(arr.length);
    };
    let page = 1;
    const renderPager = (total) => {
      const pages = Math.ceil(total / 20); const pg = $("#q-pager"); if (pages <= 1) { pg.innerHTML = ""; return; }
      let h = "";
      for (let i = 1; i <= pages; i++) h += `<button class="${i === page ? "active" : ""}" data-p="${i}">${i}</button>`;
      pg.innerHTML = h;
      $$("#q-pager button").forEach(b => b.onclick = () => { page = parseInt(b.dataset.p); renderGrid(Search.sort(Search.filter(base, filters), sortBy)); });
    };

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>题目列表</span>${q.cat ? `<span class="sep">/</span><span>${U.esc(Services.catName(parseInt(q.cat)))}</span>` : ""}${q.pos ? `<span class="sep">/</span><span>${U.esc(decodeURIComponent(q.pos))}</span>` : ""}</div>
      <h1 style="margin-bottom:6px">题目列表 <span class="muted" id="q-count" style="font-size:16px"></span></h1>
      <div class="toolbar">
        <input id="q-search" class="full" style="max-width:280px" placeholder="关键词筛选…" value="${U.esc(q.q || "")}" />
        <select id="f-diff" class="select-mini"><option value="">难度</option>${diffs.map(d => `<option ${q.diff === d ? "selected" : ""}>${d}</option>`).join("")}</select>
        <select id="f-type" class="select-mini"><option value="">题型</option>${types.map(t => `<option>${t}</option>`).join("")}</select>
        <select id="f-source" class="select-mini"><option value="">来源</option><option value="manual">手动</option><option value="ai">AI</option><option value="import">导入</option></select>
        ${Auth.isAdmin() ? `<select id="f-status" class="select-mini"><option value="">状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="offline">下线</option></select>` : ""}
        <span class="spacer"></span>
        <div class="seg" id="sort-seg">
          <button data-s="updated" class="${sortBy === "updated" ? "active" : ""}">最新</button>
          <button data-s="views" class="${sortBy === "views" ? "active" : ""}">最热</button>
          <button data-s="favorites" class="${sortBy === "favorites" ? "active" : ""}">收藏</button>
          <button data-s="aiScore" class="${sortBy === "aiScore" ? "active" : ""}">AI评分</button>
        </div>
      </div>
      <div class="grid grid-cols-2" id="q-grid"></div>
      <div class="pager" id="q-pager"></div>
    `);
    const reSort = (s) => { Object.keys({ updated: 1, views: 1, favorites: 1, aiScore: 1 }).forEach(k => {}); };
    $("#q-search").addEventListener("input", U.debounce(e => { filters.q = e.target.value.trim(); apply(); }, 300));
    attachHistory($("#q-search"), t => { $("#q-search").value = t; filters.q = t; apply(); });
    $("#f-diff").onchange = e => { filters.difficulty = e.target.value ? [e.target.value] : []; apply(); };
    $("#f-type").onchange = e => { filters.type = e.target.value ? [e.target.value] : []; apply(); };
    $("#f-source").onchange = e => { filters.source = e.target.value ? [e.target.value] : []; apply(); };
    if (Auth.isAdmin()) $("#f-status").onchange = e => { filters.status = e.target.value ? [e.target.value] : []; apply(); };
    $$("#sort-seg button").forEach(b => b.onclick = () => {
      $$("#sort-seg button").forEach(x => x.classList.remove("active")); b.classList.add("active");
      const s = b.dataset.s; const url = new URL(location.href); url.searchParams.set("sort", s); history.replaceState(null, "", url.pathname + url.search);
      renderGrid(Search.sort(Search.filter(base, filters), s));
    });
    apply();
  }

  /* ============================ 题目详情页 ============================ */
  async function pageQuestionDetail(id) {
    const q = await Services.getQuestion(parseInt(id));
    if (!q) { setMain(`<div class="empty">未找到该题目</div>`); return; }
    document.title = q.title + " · IT面试题库";   // 详情页 title 用题目标题
    await Services.incViews(q.id); await Services.reload();
    await Services.addHistory(q.id);   // 必须用数字 id：路由里的字符串 id 写进 IndexedDB 后类型不匹配，读取永远查不到
    Stats.recordView(id);
    markDailyDone(q.id);
    try { localStorage.setItem("last_question", JSON.stringify({ id: q.id, title: q.title })); } catch (e) {}
    const fav = await Services.isFavorite(q.id);
    const weakInfo = await Services.weakInfo(q.id);   // 该题的复习状态（null=不在错题本）
    const related = (q.relatedIds || []).map(rid => Services.questions.find(x => x.id === rid)).filter(Boolean);
    if (!related.length) related.push(...Services.questions.filter(x => x.id !== q.id && x.categoryId === q.categoryId).slice(0, 4));
    const posByName = new Map(); Services.positions.forEach(p => { posByName.set(p.name, p); if (p.direction) posByName.set(Services.posFullName(p), p); });
    const posTags = (q.positionNames || []).map(n => {
      const pos = posByName.get(n);
      return pos ? `<a class="tag tag-outline" href="#/position/${pos.id}">${U.esc(n)}</a>` : `<a class="tag tag-outline" href="#/questions?pos=${encodeURIComponent(n)}">${U.esc(n)}</a>`;
    }).join("");
    const techTags = (q.tags || []).map(t => `<span class="tag">${U.esc(t)}</span>`).join("");
    const path = (q.catPath && q.catPath.length) ? q.catPath : (q.categoryId != null ? Services.categoryPath(q.categoryId) : []);
    const pathHtml = path.map((n, i) => `<a href="#/category?cat=${i === path.length - 1 ? q.categoryId : ''}">${U.esc(n)}</a>${i < path.length - 1 ? '<span class="sep">/</span>' : ""}`).join("");
    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span>${pathHtml}<span class="sep">/</span><span>题目</span></div>
      <div class="qd-head">
        <h1>${U.esc(q.title)}</h1>
        <div class="q-meta" style="margin:10px 0">
          <span class="tag diff-${q.difficulty}">${q.difficulty}</span>
          <span class="tag">${U.esc(q.type)}</span>
          ${q.catName ? `<span class="tag tag-primary">${U.esc(q.catName)}</span>` : ""}
          ${q.years ? `<span class="tag tag-outline">${U.esc(q.years)}</span>` : ""}
          ${posTags}${techTags}
        </div>
        <div class="muted" style="font-size:12px">更新：${U.fmtDate(q.updatedAt)} · 浏览 ${q.views} · 收藏 ${q.favorites} · 来源 ${U.esc(q.source)} · AI评分 ${q.aiScore}</div>
      </div>
      <div class="qd-body md">${U.md(q.body)}</div>
      <div style="margin-top:14px"><button class="btn btn-primary" id="show-answer">${U.icon("eye")} 查看答案</button>
        <button class="btn ${fav ? "btn-danger" : ""}" id="fav-btn">${fav ? U.icon("bookmarkFill") + " 取消收藏" : U.icon("bookmark") + " 收藏"}</button>
        <button class="btn" id="weak-btn" title="加入错题重练，按记忆曲线安排复习">${U.icon("alert")} 不太会</button>
        <button class="btn" id="share-btn" title="分享这道题（手机调起分享面板，电脑复制链接）">${U.icon("link")} 分享</button>
        ${weakInfo ? `<span class="tag tag-warning" id="weak-status" title="该题在错题重练中，按记忆曲线第 ${weakInfo.box + 1}/8 阶段循环">📅 复习中 · ${weakInfo.dueAt <= Date.now() ? "待复习" : Services.EBBS_LABEL[weakInfo.box] + " 后"}</span>` : ""}
        ${Auth.isAdmin() ? `<a class="btn btn-sm" href="#/admin/question/${q.id}">${U.icon("edit")} 编辑</a>
          <button class="btn btn-sm" id="del-btn">${U.icon("trash")} 删除</button>
          <button class="btn btn-sm btn-ai" id="opt-btn">${U.icon("sparkles")} AI优化</button>` : ""}
      </div>
      <div class="qd-answer md" id="answer-box" style="display:none">${U.md(q.answer)}</div>
      <div class="section-head"><h2>相关推荐</h2></div>
      <div class="grid grid-cols-2">${related.map(x => qCard(x)).join("")}</div>
      <div class="pill-row" style="margin-top:16px">
        <button class="btn" id="prev-btn">← 上一题</button>
        <button class="btn" id="next-btn">下一题 →</button>
      </div>
    `, () => { U.highlightAll(main); });
    $("#show-answer").onclick = () => { const b = $("#answer-box"); b.style.display = b.style.display === "none" ? "block" : "none"; U.highlightAll(b); };
    $("#fav-btn").onclick = async () => {
      const nowFav = await Services.toggleFavorite(q.id);
      $("#fav-btn").className = "btn " + (nowFav ? "btn-danger" : "");
      $("#fav-btn").innerHTML = nowFav ? U.icon("bookmarkFill") + " 取消收藏" : U.icon("bookmark") + " 收藏";
      U.toast(nowFav ? "已收藏" : "已取消收藏", "success");
    };
    $("#weak-btn").onclick = async () => {
      if (weakInfo) { U.toast("该题已在错题重练（第 " + (weakInfo.box + 1) + "/8 阶段），到「错题重练」页复习即可", "info"); return; }
      await Services.addWeak(q.id, "unknown");
      App.reviewDue = (App.reviewDue || 0) + 1;
      renderSidebar(parseHash());
      U.toast("已加入错题重练，到期会提醒复习", "warn");
      const info = await Services.weakInfo(q.id);
      if (info) { const st = $("#weak-status"); if (!st) { const b = $("#weak-btn"); b.insertAdjacentHTML("afterend", `<span class="tag tag-warning" id="weak-status">📅 复习中 · ${Services.EBBS_LABEL[info.box]} 后</span>`); } }
    };
    /* 分享：弹窗预览精美卡片图 → 可直接分享到微信；同时提供复制链接（用户主动取消分享时不降级） */
    $("#share-btn").onclick = () => openShareDialog(q);

    /* 分享弹窗：生成题目卡片预览，支持「分享/保存图片」与「复制链接」 */
    async function openShareDialog(q) {
      /* 优先分享 /q/<id>.html：含 per-question og:title/description/image，微信会渲染成带缩略图的链接卡片 */
      const url = location.origin + "/q/" + q.id + ".html";
      const m = U.modal({ title: "分享这道题", closable: true });
      m.body.innerHTML = `<div id="sc-preview" class="muted" style="text-align:center;padding:30px 0">正在生成卡片…</div>
        <div class="muted" style="font-size:12px;margin-top:10px;text-align:center">手机上点「分享图片」可直接发到微信；电脑点「保存图片」下载后发送</div>`;
      const btnShare = document.createElement("button");
      btnShare.className = "btn btn-primary"; btnShare.textContent = "分享图片"; btnShare.disabled = true;
      const btnSave = document.createElement("button");
      btnSave.className = "btn"; btnSave.textContent = "保存图片"; btnSave.disabled = true;
      const btnCopy = document.createElement("button");
      btnCopy.className = "btn"; btnCopy.textContent = "复制链接";
      /* 微信内置浏览器：navigator.share 文件分享不可用、a[download] 也不可靠；
         正确姿势是长按预览大图 →「发送给朋友/保存图片」，全屏大图点击可关闭 */
      const isWx = /MicroMessenger/i.test(navigator.userAgent);
      if (isWx) {
        btnSave.style.display = "none"; btnShare.style.display = "none";
      }
      m.foot.appendChild(btnCopy);
      m.foot.appendChild(btnSave);
      m.foot.appendChild(btnShare);

      btnCopy.onclick = async () => {
        const ok = await U.copyText(url);
        U.toast(ok ? "链接已复制，粘贴即可分享给朋友" : "复制失败，请手动复制地址栏链接", ok ? "success" : "error");
      };

      let file = null;
      try {
        const { canvas } = await window.ShareCard.render(q, url);
        const box = m.body.querySelector("#sc-preview");
        box.innerHTML = "";
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.alt = "题目分享卡片预览";
        img.style.cssText = "width:100%;max-width:300px;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,.18)";
        box.appendChild(img);
        file = await window.ShareCard.toFile(canvas, "IT面试题库-" + (q.title || "题目").slice(0, 20) + ".png");
        if (isWx) {
          /* 微信环境：点击预览图放大为全屏图（长按即可发送给朋友/保存到相册） */
          const hint = document.createElement("div");
          hint.className = "muted"; hint.style.cssText = "font-size:13px;margin-top:6px;text-align:center";
          hint.textContent = "👆 点击图片放大后，长按选择「发送给朋友」直接分享到微信";
          box.appendChild(hint);
          img.style.cursor = "zoom-in";
          img.onclick = () => {
            const ov = document.createElement("div");
            ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.92);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:16px;cursor:zoom-out";
            const big = document.createElement("img");
            big.src = img.src;
            big.style.cssText = "max-width:94vw;max-height:82vh;border-radius:12px";
            const tip = document.createElement("div");
            tip.style.cssText = "color:#e2e8f0;font-size:14px;margin-top:12px;text-align:center";
            tip.innerHTML = "长按图片 → <b>发送给朋友</b> 或 <b>保存图片</b><br><span style='font-size:12px;opacity:.75'>点击任意处关闭</span>";
            ov.appendChild(big); ov.appendChild(tip);
            ov.onclick = () => ov.remove();
            document.body.appendChild(ov);
          };
        } else {
          btnSave.disabled = false; btnShare.disabled = false;
        }
      } catch (e) {
        m.body.querySelector("#sc-preview").innerHTML = `<div class="muted">卡片生成失败，可直接复制链接分享。</div>`;
      }

      btnSave.onclick = () => {
        if (!file) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file); a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        U.toast("图片已保存", "success");
      };
      btnShare.onclick = async () => {
        if (!file) return;
        const payload = { files: [file], title: q.title + " · IT面试题库", text: q.title };
        if (navigator.canShare && navigator.canShare(payload)) {
          try { await navigator.share(payload); return; }
          catch (e) { if (e && (e.name === "AbortError" || e.name === "NotAllowedError")) return; }
        }
        // 不支持文件分享（多数桌面浏览器）→ 降级为保存
        btnSave.click();
      };
    }
    if (Auth.isAdmin()) {
      $("#del-btn").onclick = async () => {
        if (await U.confirm("确定删除该题？此操作不可逆。", { danger: true, okText: "删除" })) {
          await Services.deleteQuestion(q.id); U.toast("已删除", "success"); App.go("/questions");
        }
      };
      $("#opt-btn").onclick = () => openOptimizeModal(q);
    }
    // 上/下一题（同分类内按 id 顺序循环；与刷题页的顺序行为一致）
    const siblings = Services.questions.filter(x => x.categoryId === q.categoryId).sort((a, b) => a.id - b.id);
    const sibIdx = siblings.findIndex(x => x.id === q.id);
    if (sibIdx >= 0 && siblings.length > 1) {
      $("#next-btn").onclick = () => App.go("/question/" + siblings[(sibIdx + 1) % siblings.length].id);
      $("#prev-btn").onclick = () => App.go("/question/" + siblings[(sibIdx - 1 + siblings.length) % siblings.length].id);
    } else { $("#prev-btn").style.display = "none"; $("#next-btn").style.display = "none"; }
    /* 键盘快捷键：←/→ 切题 · 空格 翻答案 · S 收藏（输入框聚焦或弹窗打开时不响应） */
    const kbHint = document.createElement("div");
    kbHint.className = "muted";
    kbHint.style.cssText = "font-size:12px;margin-top:8px";
    kbHint.textContent = "快捷键：← / → 切换题目 · 空格 展开或收起答案 · S 收藏";
    $(".pill-row").appendChild(kbHint);
    setPageKeys(e => {
      if (typingInField(e)) return;
      if (document.querySelector("#modal-root .modal-mask") || document.querySelector("#modal-root .modal")) return;
      if (e.key === "ArrowLeft" && $("#prev-btn").style.display !== "none") { $("#prev-btn").click(); }
      else if (e.key === "ArrowRight" && $("#next-btn").style.display !== "none") { $("#next-btn").click(); }
      else if (e.key === " " || e.code === "Space") { e.preventDefault(); $("#show-answer").click(); }
      else if (e.key === "s" || e.key === "S") { $("#fav-btn").click(); }
    });
  }

  /* ============================ 错题重练（艾宾浩斯记忆曲线） ============================ */
  async function pageReview() {
    document.title = "错题重练 · IT面试题库";
    const { due, upcoming } = await Services.weakList();
    App.reviewDue = due.length;
    renderSidebar(parseHash());
    const ivlLabel = w => Services.EBBS_LABEL[Math.min(w.box || 0, Services.EBBS_LABEL.length - 1)];
    const fmtTime = ts => { const d = new Date(ts); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    const cardOf = (w, isDue) => {
      const q = w._q;
      return `<div class="card rv-card" data-qid="${q.id}">
        <div style="display:flex;align-items:center;gap:10px">
          <a href="#/question/${q.id}" style="text-decoration:none;flex:1;min-width:0"><b>${U.esc(q.title)}</b></a>
          <span class="tag ${isDue ? "tag-warning" : ""}">${isDue ? "第 " + ((w.box || 0) + 1) + " 次 · 待复习" : ivlLabel(w) + "后"}</span>
        </div>
        <div class="muted" style="font-size:12px;margin-top:4px">${w.marked === "unknown" ? "不会" : "不熟悉"} · 排期 ${fmtTime(w.dueAt)}${w.lastOkAt ? " · 上次会了 " + fmtTime(w.lastOkAt) : ""}</div>
        <div class="pill-row" style="margin-top:10px">
          ${isDue ? `<button class="btn btn-success btn-sm" data-act="ok">${U.icon("check")} 会了</button>
          <button class="btn btn-warning btn-sm" data-act="again">还不会，稍后再来</button>` : ""}
          <button class="btn btn-sm" data-act="del">${U.icon("x")} 移出</button>
        </div>
      </div>`;
    };
    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>错题重练</span></div>
      <div class="section-head"><h2>🧠 错题重练</h2><span class="muted">艾宾浩斯记忆曲线 · 会了拉长间隔 / 还不会 5 分钟后重来</span></div>
      ${due.length
        ? `<h3 style="margin:14px 0 10px">📌 待复习（${due.length}）</h3><div style="display:grid;gap:10px">${due.map(w => cardOf(w, true)).join("")}</div>`
        : `<div class="note" style="margin-top:14px">🎉 当前没有到期的复习任务。在题目详情点「不太会」，或在刷题练习里标「不会 / 不熟悉」，就会进入这里按记忆曲线排期。</div>`}
      ${upcoming.length ? `<h3 style="margin:22px 0 10px">🕒 已排程（${upcoming.length}）</h3><div style="display:grid;gap:10px">${upcoming.map(w => cardOf(w, false)).join("")}</div>` : ""}
    `);
    $$("#main .rv-card [data-act]").forEach(b => b.onclick = async () => {
      const qid = parseInt(b.closest(".rv-card").dataset.qid);
      const act = b.dataset.act;
      if (act === "del") { await Services.removeWeak(qid); U.toast("已移出错题本", "info"); }
      else {
        await Services.weakGrade(qid, act === "ok");
        U.toast(act === "ok" ? "👍 已掌握，下次复习时间已顺延" : "好的，5 分钟后再次提醒", act === "ok" ? "success" : "warn");
      }
      pageReview();
    });
  }

  /* ============================ 收藏夹 ============================ */
  async function pageFavorites() {
    document.title = "收藏夹 · IT面试题库";
    const favs = await Services.getFavorites();
    const PAGE = 40; let shown = Math.min(PAGE, favs.length);
    const renderGrid = () => {
      $("#fav-grid").innerHTML = favs.length
        ? favs.slice(0, shown).map(q => qCard(q)).join("") + (shown < favs.length ? `<div class="pill-row" style="grid-column:1/-1;justify-content:center"><button class="btn" id="fav-more">加载更多（${favs.length - shown}）</button></div>` : "")
        : '<div class="empty">还没有收藏任何题目</div>';
      const mb = $("#fav-more");
      if (mb) mb.onclick = () => { shown = Math.min(shown + PAGE, favs.length); renderGrid(); };
    };
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>收藏夹</span></div>
      <div class="section-head"><h2>我的收藏（${favs.length}）</h2>
        <div><button class="btn btn-sm" id="exp-md">${U.icon("download")} 导出MD</button>
        <button class="btn btn-sm btn-danger" id="clear-fav">${U.icon("trash")} 清空</button></div></div>
      <div class="grid grid-cols-2" id="fav-grid"></div>`);
    renderGrid();
    $("#exp-md").onclick = () => exportFavMarkdown(favs);
    $("#clear-fav").onclick = async () => { if (await U.confirm("确定清空全部收藏？", { danger: true })) { await db.favorites.clear(); await Services.reload(); U.toast("已清空收藏", "success"); pageFavorites(); } };
  }
  function exportFavMarkdown(favs) {
    let md = "# 我的收藏题目\n\n";
    favs.forEach(q => { md += `## ${q.title}\n\n**难度**：${q.difficulty} **题型**：${q.type}\n\n${q.body}\n\n**答案**\n\n${q.answer}\n\n---\n\n`; });
    U.download("我的收藏题目.md", md, "text/markdown");
  }

  /* ============================ 浏览历史 ============================ */
  async function pageHistory() {
    document.title = "浏览历史 · IT面试题库";
    const all = await Services.getHistories();   /* [{q, at, views}] 按浏览时间倒序 */
    const [weakRows, favRows] = await Promise.all([DB.db.weakBank.toArray(), DB.db.favorites.toArray()]);
    const weakSet = new Set(weakRows.map(w => w.questionId));
    const favSet = new Set(favRows.map(f => f.questionId));
    const PAGE = 40; let shown = Math.min(PAGE, all.length);
    let term = "";

    const hisCard = ({ q, at, views }) => {
      const badges = [];
      if (weakSet.has(q.id)) badges.push('<span class="tag tag-warning">📅 复习中</span>');
      if (favSet.has(q.id)) badges.push('<span class="tag tag-primary">★ 已收藏</span>');
      if ((views || 1) > 1) badges.push(`<span class="tag">看过 ${views} 次</span>`);
      return `<div class="card card-hover" style="position:relative;cursor:pointer" onclick="location.hash='/question/${q.id}'">
        <button class="icon-btn" data-del="${q.id}" title="删除这条记录" aria-label="删除这条浏览记录" style="position:absolute;top:10px;right:10px;z-index:2">${U.icon("x")}</button>
        ${qCard(q).replace('href="#/question/' + q.id + '"', '').replace('class="card card-hover q-card"', 'class="q-card"')}
        <div class="muted" style="font-size:12px;margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span>浏览于 ${U.fmtDate(at)}</span>${badges.join("")}</div>
      </div>`;
    };
    const groupOf = (at) => {
      const now = new Date();
      const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (at >= day0) return "今天";
      if (at >= day0 - 86400000) return "昨天";
      if (at >= day0 - 6 * 86400000) return "本周更早";
      return "更早";
    };
    const renderGrid = () => {
      const t = term.trim().toLowerCase();
      const view = !t ? all : all.filter(({ q }) => ((q.title || "") + " " + (q.tags || []).join(" ")).toLowerCase().indexOf(t) >= 0);
      const gCounts = {};
      view.forEach(item => { const g = groupOf(item.at); gCounts[g] = (gCounts[g] || 0) + 1; });
      let html = "";
      if (!view.length) {
        html = term
          ? '<div class="empty" style="grid-column:1/-1">没有匹配的浏览记录</div>'
          : `<div class="empty" style="grid-column:1/-1"><div class="em-ic">${U.icon("history")}</div>暂无浏览记录<div style="margin-top:12px"><a class="btn btn-primary" href="#/questions">去看几道题试试 →</a></div></div>`;
      } else {
        let last = null;
        view.slice(0, shown).forEach(item => {
          const g = groupOf(item.at);
          if (g !== last) {
            html += `<div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;margin-top:10px">
              <span class="tag tag-primary" style="font-weight:700;font-size:13px;padding:3px 12px">${g}</span>
              <span style="flex:1;height:1px;background:var(--border)"></span>
              <span class="muted" style="font-size:11px;flex:none">${gCounts[g] || 0} 题</span>
            </div>`;
            last = g;
          }
          html += hisCard(item);
        });
        if (shown < view.length) html += `<div class="pill-row" style="grid-column:1/-1;justify-content:center"><button class="btn" id="his-more">加载更多（${view.length - shown}）</button></div>`;
      }
      $("#his-grid").innerHTML = html;
      const mb = $("#his-more");
      if (mb) mb.onclick = () => { shown = Math.min(shown + PAGE, view.length); renderGrid(); };
      $$("#his-grid [data-del]").forEach(b => b.onclick = async (e) => {
        e.stopPropagation();
        await Services.removeHistory(parseInt(b.dataset.del));
        U.toast("已删除该条记录", "info");
        pageHistory();
      });
    };
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>浏览历史</span></div>
      <div class="section-head"><h2>浏览历史（${all.length}）</h2>
        <div style="display:flex;gap:8px">
          <a class="btn btn-sm btn-primary" href="#/practice?scope=hist" title="把历史题目作为题池开始刷题">${U.icon("play")} 重刷历史</a>
          <button class="btn btn-sm btn-danger" id="clear-h">${U.icon("trash")} 清空</button></div></div>
      <input id="his-q" class="full" style="max-width:280px;margin-bottom:12px" placeholder="在历史中搜索标题 / 标签…" />
      <div class="grid grid-cols-2" id="his-grid"></div>`);
    $("#his-q").addEventListener("input", U.debounce(e => { term = e.target.value; shown = PAGE; renderGrid(); }, 250));
    $("#clear-h").onclick = async () => {
      if (!all.length) return;
      if (!(await U.confirm("确定清空全部浏览历史？（8 秒内可撤销）", { danger: true }))) return;
      const backup = await DB.db.histories.toArray();
      await DB.db.histories.clear();
      U.toast("已清空浏览历史（8 秒内可撤销）", "info", 8000);
      const root = document.getElementById("toast-root");
      if (root && backup.length) {
        const el = document.createElement("div");
        el.className = "toast";
        el.style.borderLeftColor = "var(--c-warning)";
        el.innerHTML = '<span style="flex:1">误删了？点这撤销</span><button class="btn btn-sm" type="button">撤销清空</button>';
        el.querySelector("button").onclick = async () => {
          try { await DB.db.histories.bulkAdd(backup); } catch (e) {}
          el.remove();
          U.toast("已恢复 " + backup.length + " 条浏览记录", "success");
          if (location.hash === "#/history" || location.hash === "") pageHistory();
        };
        root.appendChild(el);
        setTimeout(() => { el.remove(); }, 8000);
      }
      pageHistory();
    };
    renderGrid();
  }

  /* ============================ 使用指南 ============================ */
  async function pageHelp() {
    document.title = "使用指南 · IT面试题库";
    const toc = [
      ["quick", "🚀 快速上手"], ["find", "🔍 找题与浏览"], ["daily", "📚 日常学习"],
      ["review", "🔁 复习与错题"], ["mock", "🎙️ 模拟面试"], ["account", "👤 账号与数据"],
      ["share", "📤 分享"], ["admin", "🛠️ 管理员"], ["faq", "❓ 常见问题"],
    ];
    const sec = (id, title, body) => `<div class="card" id="help-${id}" style="margin-top:14px"><h2 style="font-size:16px;margin-bottom:10px">${title}</h2>${body}</div>`;
    const li = (t, d) => `<div style="display:flex;gap:8px;padding:5px 0;line-height:1.65"><span style="flex:none">•</span><span><b>${t}</b>${d ? `<span class="muted"> —— ${d}</span>` : ""}</span></div>`;
    setMain(`
      <div class="hero" style="padding:28px 16px 20px">
        <h1 style="font-size:22px">📖 使用指南</h1>
        <p>5 分钟了解全部功能。数据存于本机浏览器，登录后云端同步，支持离线使用。</p>
        <div class="hot-tags">${toc.map(([id, label]) => `<span class="tag" style="cursor:pointer" data-go="help-${id}">${label}</span>`).join("")}</div>
      </div>
      ${sec("quick", "🚀 快速上手", `
        ${li("打开就能用", "无需注册登录，首次打开自动加载题库，直接刷题")}
        ${li("三种开始方式", "顶部搜索框直接搜 · 「技术体系 / 岗位体系」分类浏览 · 「随机一题」随缘学习")}
        ${li("数据在哪", "学习记录默认存在本机浏览器；注册登录后自动云端同步，换设备不丢")}
        ${li("装到手机桌面", "浏览器菜单选「添加到主屏幕」，之后像 App 一样打开，断网也能刷题")}
      `)}
      ${sec("find", "🔍 找题与浏览", `
        ${li("搜索", "顶栏 / 首页搜索框支持标题、标签、岗位、分类名；输入框聚焦会弹出最近搜索和热门词")}
        ${li("技术体系", "279 个分类的树状目录，逐层展开找题；点开任一分类有「技术全景图」：重点域配有人工分层架构图（节点可点击直达分类），其余显示自动分支树，薄弱分类橙色标记")}
        ${li("岗位体系", "142 个岗位及细分方向，每个岗位页有必考技术栈、难度分布图和热门题")}
        ${li("题目列表筛选", "按难度、题型、来源筛选，可按最新 / 最热 / AI 评分排序")}
      `)}
      ${sec("daily", "📚 日常学习", `
        ${li("刷题练习", "选分类 / 岗位 / 难度开一局，支持随机与顺序两种模式")}
        ${li("键盘快捷键", "详情页里 ← → 切换上下一题，空格展开 / 收起答案，S 收藏（手机长按无此烦恼，直接点按钮）")}
        ${li("今日 5 题", "每天固定 5 道题，做完自动打勾；打开「温故知新」还会混入 3 天前看过但没掌握的题")}
        ${li("学习打卡", "打开网站即打卡，热力图展示最近 35 天；连续天数看着数字涨很有成就感")}
        ${li("学习周报", "首页底部的周报统计本周刷题数、完成 5 题天数、新增薄弱，带上周环比和每日柱状图；薄弱分类可直接点击去刷")}
      `)}
      ${sec("review", "🔁 复习与错题（艾宾浩斯记忆曲线）", `
        ${li("怎么进错题本", "刷题或模拟面试中点「不太会 / 不会」，或在题目详情页点「不太会」按钮")}
        ${li("复习节奏", "系统按记忆曲线安排：5 分钟 → 30 分钟 → 12 小时 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天，到期自动提醒")}
        ${li("错题重练页", "「📌 待复习」放到期题，「🕒 已排程」看未来安排；答对点「会了」顺延间隔，答错重新来")}
        ${li("浏览历史", "按今天 / 昨天 / 本周分组，支持单条删除、关键词搜索；「看过 N 次」多的题往往就是没吃透的题；顶部「重刷历史」一键把看过的题再刷一遍")}
        ${li("状态角标", "历史卡片上的 📅 复习中 = 已在错题本，★ = 已收藏，帮你区分看懂的和没看懂的")}
      `)}
      ${sec("mock", "🎙️ 模拟面试", `
        ${li("流程", "选岗位 + 工作年限 → 系统抽题逐题提问 → 每题自评「掌握 / 不熟悉 / 不会」→ 生成报告")}
        ${li("报告内容", "掌握率、用时、技术覆盖度；登录后自动存云端，并可看历次成绩趋势对比")}
        ${li("与错题本联动", "标「不熟悉 / 不会」的题自动进错题本，按记忆曲线安排复习")}
      `)}
      ${sec("account", "👤 账号与数据", `
        ${li("注册 / 登录", "邮箱 + 密码即可，密码加密存储；登录后收藏、浏览历史、错题本、今日打卡、面试报告全部云端同步")}
        ${li("换设备", "新设备登录同一账号，学习记录自动合并恢复")}
        ${li("关闭页面也不丢", "关闭标签页时自动兜底上传一次，最大程度保护学习数据")}
        ${li("加密备份", "系统设置里可开启备份密码，本机配置（Token、AI Key 等）加密后存云端，凭密码一键恢复")}
      `)}
      ${sec("share", "📤 分享", `
        ${li("分享卡片", "题目详情页点「分享」，自动生成精美卡片图（标题 + 标签 + 答案摘要 + 二维码）")}
        ${li("微信里分享", "微信内点图片放大后长按 → 「发送给朋友」；每道题还有独立分享页，聊天里发链接直接显示题卡")}
        ${li("复制链接", "桌面端可直接复制题目链接发给同学同事")}
      `)}
      ${sec("admin", "🛠️ 管理员（可选）", `
        ${li("本地密码", "首次进入管理页设置密码，只保存在当前浏览器，换浏览器需重设；访客完全不需要管这个")}
        ${li("题目管理", "增删改查、直接粘贴截图进题干和答案、标题查重提示")}
        ${li("AI 出题", "配置 API Key 后按分类 / 岗位 / 难度批量生成题目")}
        ${li("批量导入 / 备份", "支持 Excel / CSV / JSON / Markdown 导入；本地数据可加密备份到云端")}
        ${li("发布", "配置 GitHub Token 后，题目改动 10 秒自动发布到线上题库，所有访客同步更新")}
      `)}
      ${sec("faq", "❓ 常见问题", `
        ${li("需要注册吗？", "不需要，打开就能刷；注册只是为了多设备同步学习记录")}
        ${li("别人访问要设管理员密码吗？", "不用，管理员是本地概念，只管「你这个人」能不能编辑题库")}
        ${li("换电脑 / 浏览器数据还在吗？", "登录用户自动恢复；未登录用户的数据只在本机浏览器里，建议注册或用备份功能")}
        ${li("离线能用吗？", "能。安装到主屏幕后断网照常刷题（联网时会自动同步数据）")}
        ${li("页面显示异常 / 数据不对？", "先强制刷新（电脑 Ctrl+Shift+R，手机清一下浏览器缓存）；仍有问题联系管理员")}
        ${li("题目答案有误？", "欢迎反馈给管理员纠错，题库会持续迭代")}
      `)}
      <div class="muted" style="text-align:center;font-size:12px;margin-top:18px">文档最近更新：2026-08-30 · 更详细的开发文档见 GitHub 仓库 README</div>
    `);
    $$("#main .hot-tags .tag").forEach(t => t.onclick = () => {
      const el = document.getElementById(t.dataset.go);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ============================ 刷题练习 ============================ */
  async function pagePractice(q) {
    document.title = "刷题练习 · IT面试题库";
    const mode = q.mode || "random";
    const diffs = ["初级", "中级", "高级", "专家"];
    const scope = q.scope || (q.cat ? "cat" : q.pos ? "pos" : "all");
    if (scope === "weak" && !q.mode) mode = "seq";   // 薄弱题本默认按「最近标记优先」顺序

    /* 构建分类树 options */
    const buildCatOpts = (nodes, depth = 0) => nodes.map(c =>
      `<option value="${c.id}" ${q.cat == c.id ? "selected" : ""}>${"　".repeat(depth)}${U.esc(c.name)} (${c.count || 0})</option>` +
      buildCatOpts(c.children || [], depth + 1)
    ).join("");
    const catOpts = buildCatOpts(Services.categoryTree());

    /* 构建岗位 options（按 stage 分组，排除隐藏/伪岗位，同名去重） */
    const byStage = Services.positionsByStage();
    const posSeen = new Set();
    const posOpts = byStage.map(s => {
      const uniq = s.list.filter(p => {
        if (Services.isHiddenPosition(p)) return false;
        const key = Services.posKey(p);
        if (posSeen.has(key)) return false;
        posSeen.add(key);
        return true;
      });
      if (!uniq.length) return "";
      return `<optgroup label="${U.esc(s.stage)}">${uniq.map(p => `<option value="${p.id}" ${q.pos == p.id ? "selected" : ""}>${U.esc(Services.posFullName(p))} (${Services.questionCountForPosition(p)})</option>`).join("")}</optgroup>`;
    }).join("");

    /* 计算题目池 */
    let pool = [];
    if (scope === "weak") {
      pool = await Services.getWeakQuestions();
    } else if (scope === "hist") {
      /* 浏览历史作为题池：最近看过的在前，重刷温故 */
      pool = (await Services.getHistories()).map(h => h.q);
    } else {
      pool = Services.published().slice();
      if (scope === "cat" && q.cat) { const id = parseInt(q.cat); const ids = [id].concat(Services.descendantIds(id)); pool = pool.filter(x => ids.indexOf(x.categoryId) >= 0); }
      if (scope === "pos" && q.pos) { const pos = Services.getPosition(parseInt(q.pos)); pool = pool.filter(x => Services.matchPosition(x, pos)); }
    }
    if (q.diff) pool = pool.filter(x => x.difficulty === q.diff);

    const start = (order) => {
      let list = pool.slice();
      if (scope === "weak") {
        // 薄弱题本：保持「最近标记优先」原序（getWeakQuestions 已按 updatedAt 倒序），
        // 仅随机模式打乱；顺序模式不按分类重排，确保刚标记的题立即可见
        if (order === "random") list.sort(() => Math.random() - 0.5);
      } else {
        if (order === "random") list.sort(() => Math.random() - 0.5);
        if (order === "seq") list.sort((a, b) => (a.categoryId || 0) - (b.categoryId || 0));
      }
      runPractice(list);
    };

    const scopeUrl = (s) => {
      const p = new URLSearchParams();
      p.set("mode", $("#pm").value);
      if ($("#pd").value) p.set("diff", $("#pd").value);
      if (s !== "all") p.set("scope", s);
      if (s === "cat" && $("#pcat").value) p.set("cat", $("#pcat").value);
      if (s === "pos" && $("#ppos").value) p.set("pos", $("#ppos").value);
      return "/practice?" + p.toString();
    };

    const weakN = Services.weakCount || 0;

    const selectedCatLabel = scope === "cat" && q.cat ? U.esc(Services.catName(parseInt(q.cat))) : "";
    const selectedPosLabel = scope === "pos" && q.pos ? U.esc(Services.posFullName(Services.getPosition(parseInt(q.pos)))) : "";

    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>刷题练习</span></div>
      <h1>刷题练习</h1>
      <p class="secondary">共 ${pool.length} 道可用题目。选择模式开始。</p>
      <div class="card" style="max-width:560px">
        <label class="field"><span>刷题模式</span>
          <select id="pm" class="full">
            <option value="random" ${mode === "random" ? "selected" : ""}>随机刷题</option>
            <option value="seq" ${mode === "seq" ? "selected" : ""}>顺序刷题（按分类）</option>
          </select></label>

        <div class="field" style="margin-bottom:14px"><span>练习范围</span>
          <div class="scope-seg" id="psc">
            <button type="button" class="btn btn-sm ${scope === "all" ? "btn-primary" : "btn-secondary"}" data-scope="all">全部题目</button>
            <button type="button" class="btn btn-sm ${scope === "cat" ? "btn-primary" : "btn-secondary"}" data-scope="cat">${U.icon("layers")} 技术体系</button>
            <button type="button" class="btn btn-sm ${scope === "pos" ? "btn-primary" : "btn-secondary"}" data-scope="pos">${U.icon("briefcase")} 岗位体系</button>
            <button type="button" class="btn btn-sm ${scope === "weak" ? "btn-primary" : "btn-secondary"}" data-scope="weak">${U.icon("alert")} 薄弱题本 (${weakN})</button>
          </div>
          ${scope === "weak" ? `<div class="row" style="margin-top:10px"><span class="muted" style="font-size:12px">仅练习标记为「不熟悉」或「不会」的题目。${weakN ? "" : " 当前为空，去全部题目里标记吧。"}</span>${weakN ? `<button class="btn btn-sm btn-danger" id="clear-weak" style="margin-left:auto">清空薄弱题本</button>` : ""}</div>` : ""}
        </div>

        <div id="cat-panel" class="field ${scope === "cat" ? "" : "hidden"}">
          <span>选择技术分类 ${selectedCatLabel ? `<span class="tag tag-primary">${selectedCatLabel}</span>` : ""}</span>
          <input id="pcat-search" class="full" type="search" placeholder="搜索分类名称…" style="margin-bottom:8px">
          <select id="pcat" class="full" size="6">${catOpts}</select>
        </div>

        <div id="pos-panel" class="field ${scope === "pos" ? "" : "hidden"}">
          <span>选择岗位 ${selectedPosLabel ? `<span class="tag tag-primary">${selectedPosLabel}</span>` : ""}</span>
          <input id="ppos-search" class="full" type="search" placeholder="搜索岗位名称或方向…" style="margin-bottom:8px">
          <select id="ppos" class="full" size="6">${posOpts}</select>
        </div>

        <label class="field"><span>难度筛选（可选）</span>
          <select id="pd" class="full"><option value="">全部</option>${diffs.map(d => `<option ${q.diff === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        <button class="btn btn-primary btn-lg full" id="start-p">${U.icon("play")} 开始刷题</button>
      </div>`);

    /* 范围切换 */
    $$("#psc button").forEach(b => b.onclick = () => App.go(scopeUrl(b.dataset.scope)));

    /* 分类/岗位选择后更新 URL */
    const $cat = $("#pcat"), $pos = $("#ppos");
    if ($cat) $cat.onchange = () => App.go(scopeUrl("cat"));
    if ($pos) $pos.onchange = () => App.go(scopeUrl("pos"));

    /* 搜索过滤 select 选项（不影响已选值） */
    function bindSearch(inputId, selectId) {
      const input = $(inputId), sel = $(selectId);
      if (!input || !sel) return;
      input.oninput = () => {
        const v = input.value.trim().toLowerCase();
        Array.from(sel.options).forEach(opt => {
          if (opt.disabled) return;
          opt.style.display = !v || opt.textContent.toLowerCase().includes(v) ? "" : "none";
        });
        Array.from(sel.getElementsByTagName("optgroup")).forEach(g => {
          const visible = Array.from(g.querySelectorAll("option")).some(o => o.style.display !== "none");
          g.style.display = visible ? "" : "none";
        });
      };
    }
    bindSearch("#pcat-search", "#pcat");
    bindSearch("#ppos-search", "#ppos");

    const $clearWeak = $("#clear-weak");
    if ($clearWeak) $clearWeak.onclick = async () => {
      if (!(await U.confirm("确定清空薄弱题本？所有「不熟悉 / 不会」标记将移除", { danger: true }))) return;
      await Services.clearWeak();
      U.toast("已清空薄弱题本", "success");
      pagePractice({ mode: $("#pm").value, scope: "all" });
    };

    $("#pd").onchange = e => App.go(scopeUrl(scope));
    $("#pm").onchange = e => App.go(scopeUrl(scope));
    $("#start-p").onclick = () => start($("#pm").value);
  }

  function runPractice(list) {
    if (!list.length) { U.toast("没有可用题目", "warn"); return; }
    let i = 0, mastered = 0, weak = 0;
    const show = () => {
      const q = list[i];
      const weakTag = q._weakMarked ? `<div class="tag tag-warning" style="margin:0 0 10px">${q._weakMarked === "unknown" ? "不会" : "不熟悉"} · 来自薄弱题本</div>` : "";
      setMain(`<div class="breadcrumb"><a href="#/practice">刷题练习</a><span class="sep">/</span><span>第 ${i + 1}/${list.length} 题</span></div>
        ${weakTag}
        <div class="card qd-body md">${U.md(q.body)}</div>
        <div style="margin:12px 0"><button class="btn btn-primary" id="sa">${U.icon("eye")} 显示答案</button></div>
        <div class="qd-answer md" id="ab" style="display:none">${U.md(q.answer)}</div>
        <div id="mark" style="display:none;margin-top:12px" class="pill-row">
          <button class="btn btn-success" data-m="master">${U.icon("check")} 已掌握</button>
          <button class="btn btn-warning" data-m="familiar">不熟悉</button>
          <button class="btn btn-danger" data-m="unknown">不会</button>
        </div>
        <div class="pill-row" style="margin-top:14px"><button class="btn" id="prev">← 上一题</button><button class="btn btn-primary" id="next">下一题 →</button></div>`);
      U.highlightAll(main);
      $("#sa").onclick = () => { const b = $("#ab"); b.style.display = "block"; $("#mark").style.display = "flex"; U.highlightAll(b); };
      const mark = async (m) => {
        try {
          if (m === "master") {
            mastered++;
            if (await Services.isWeak(q.id)) { await Services.weakGrade(q.id, true); U.toast("已掌握 · 复习间隔已拉长", "success"); }
            else U.toast("已标记为掌握", "success");
          }
          else { weak++; await Services.addWeak(q.id, m); U.toast("已加入错题重练 · 按记忆曲线安排复习", "warn"); }
        } catch (e) { console.warn("mark error", e); U.toast("标记失败：" + (e && e.message), "error"); }
        next();
      };
      $$("#mark button").forEach(b => b.onclick = () => mark(b.dataset.m));
      $("#next").onclick = next; $("#prev").onclick = () => { if (i > 0) { i--; show(); } };
      function next() { if (i < list.length - 1) { i++; show(); } else { finishPractice(list.length, mastered, weak); } }
    };
    show();
  }
  function finishPractice(total, mastered, weak) {
    setMain(`<div class="empty"><div class="em-ic">${U.icon("check")}</div>
      <h2>刷题完成</h2><p>共 ${total} 题 · 掌握 ${mastered} · 待加强 ${weak}</p>
      ${weak ? `<p class="muted">${weak} 道已加入薄弱题本，<a href="#/practice">返回练习页</a>选择「薄弱题本」可专练这些题。</p>` : ""}
      <a class="btn btn-primary" href="#/practice">${U.icon("refresh")} 再来一轮</a></div>`);
  }

  /* ============================ 模拟面试 ============================ */
  async function pageMock() {
    document.title = "模拟面试 · IT面试题库";
    const byStage = Services.positionsByStage();
    const posOpts = byStage.map(s => { const seen = new Set(); const uniq = s.list.filter(p => { if (Services.isHiddenPosition(p)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; }); return `<optgroup label="${U.esc(s.stage)}">${uniq.map(p => `<option value="${p.id}">${U.esc(Services.posFullName(p))}</option>`).join("")}</optgroup>`; }).join("");
    const years = ["校招/实习", "0-1年", "1-3年", "3-5年", "5年以上"];
    const url = new URL(location.href);
    const posId = url.searchParams.get("pos");
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>模拟面试</span></div>
      <h1>模拟面试</h1><p class="secondary">选择目标岗位与年限，系统按技术栈权重随机抽取题目，隐藏答案计时作答。</p>
      <div class="card" style="max-width:560px">
        <label class="field"><span>目标岗位</span><select id="m-pos" class="full">${posOpts}</select></label>
        <label class="field"><span>工作年限</span><select id="m-year" class="full">${years.map(y => `<option>${y}</option>`).join("")}</select></label>
        <label class="field"><span>题目数量</span><select id="m-num" class="full"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></label>
        <button class="btn btn-ai btn-lg full" id="m-start">${U.icon("play")} 开始模拟面试</button>
      </div>`);
    if (posId) $("#m-pos").value = posId;
    $("#m-start").onclick = () => startMock(parseInt($("#m-pos").value), $("#m-year").value, parseInt($("#m-num").value));
  }

  async function startMock(posId, years, num) {
    const pos = Services.getPosition(posId);
    let pool;
    if (pos) {
      const skills = Services.skillsOf(posId);
      // 按技术栈权重抽取
      const weighted = [];
      skills.forEach(s => { const w = s.stars * (s.required ? 2 : 1); for (let k = 0; k < w; k++) weighted.push(s.techName); });
      const matched = Services.questions.filter(q => Services.matchPosition(q, pos));
      if (matched.length >= num) pool = matched;
      else {
        pool = matched.slice();
        // 用技术栈补充
        weighted.forEach(t => { const extra = Services.questions.filter(q => (q.tags || []).indexOf(t) >= 0 && pool.indexOf(q) < 0); pool = pool.concat(extra); });
        if (pool.length < num) pool = pool.concat(Services.published().filter(q => pool.indexOf(q) < 0));
      }
      pool = pool.slice(0, Math.max(num, pool.length));
      pool.sort(() => Math.random() - 0.5);
      pool = pool.slice(0, num);
    } else { pool = Services.published().sort(() => Math.random() - 0.5).slice(0, num); }
    if (!pool.length) { U.toast("题库题目不足", "warn"); return; }
    let i = 0, t0 = Date.now(), unknownList = [], mastery = { master: 0, familiar: 0, unknown: 0 }, cov = {};
    const show = () => {
      const q = pool[i];
      (q.tags || []).forEach(t => cov[t] = (cov[t] || 0) + 1);
      setMain(`<div class="breadcrumb"><a href="#/mock">模拟面试</a><span class="sep">/</span><span>${U.esc(pos ? pos.name : "通用")} · 第 ${i + 1}/${pool.length} 题</span></div>
        <div class="card"><div class="row" style="justify-content:space-between"><span class="tag diff-${q.difficulty}">${q.difficulty}</span>
          <span class="muted" id="timer">${U.icon("clock")} 00:00</span></div>
          <div class="qd-body md" style="margin-top:10px">${U.md(q.body)}</div>
          <div style="margin-top:12px"><button class="btn btn-primary" id="sa">${U.icon("eye")} 查看答案</button></div>
          <div class="qd-answer md" id="ab" style="display:none">${U.md(q.answer)}</div>
          <div id="mark" style="display:none;margin-top:12px" class="pill-row">
            <button class="btn btn-success" data-m="master">${U.icon("check")} 掌握</button>
            <button class="btn btn-warning" data-m="familiar">不熟悉</button>
            <button class="btn btn-danger" data-m="unknown">不会</button>
          </div>
          <div class="pill-row" style="margin-top:14px"><button class="btn btn-primary" id="next">${i === pool.length - 1 ? "提交面试" : "下一题 →"}</button></div>
        </div>`);
      U.highlightAll(main);
      const tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $("#timer").innerHTML = U.icon("clock") + " " + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }, 1000);
      $("#sa").onclick = () => { const b = $("#ab"); b.style.display = "block"; $("#mark").style.display = "flex"; U.highlightAll(b); };
      const mk = async (m) => {
        mastery[m]++;
        /* 标「不会/不熟悉」的题同步进错题本，纳入艾宾浩斯复习闭环（与练习页行为一致） */
        if (m === "unknown" || m === "familiar") {
          try {
            if (!(await Services.isWeak(q.id))) await Services.addWeak(q.id, m === "unknown" ? "不会" : "不熟悉");
            else if (m === "unknown") await Services.weakGrade(q.id, false);   // 再次不会：复习间隔重置
          } catch (_) {}
        }
        if (m === "unknown") unknownList.push(q.title);
        clearInterval(tick); next();
      };
      $$("#mark button").forEach(b => b.onclick = () => mk(b.dataset.m));
      const next = () => { clearInterval(tick); if (i < pool.length - 1) { i++; show(); } else finishMock(pos, years, pool, mastery, unknownList, cov, t0); };
      $("#next").onclick = next;
    };
    show();
  }
  async function finishMock(pos, years, pool, mastery, unknownList, cov, t0) {
    const sec = Math.floor((Date.now() - t0) / 1000);
    const covKeys = Object.keys(cov);
    let md = `# 模拟面试报告\n\n- 岗位：${pos ? pos.name : "通用"}\n- 年限：${years}\n- 题目数：${pool.length}\n- 用时：${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}\n- 掌握：${mastery.master} 不熟悉：${mastery.familiar} 不会：${mastery.unknown}\n- 技术覆盖：${covKeys.join("、")}\n\n## 需加强的题目\n${unknownList.length ? unknownList.map(t => "- " + t).join("\n") : "（无）"}\n`;
    /* 云端保存：登录后写入，失败静默，绝不打断面试结果展示 */
    let saved = false;
    try {
      if (window.Account && Account.isLoggedIn()) {
        saved = await Account.saveReport({
          position: pos ? pos.name : "通用", years: String(years || ""),
          total: pool.length, master: mastery.master, familiar: mastery.familiar,
          unknown: mastery.unknown, duration: sec, coverage: covKeys.join("、"),
        });
      }
    } catch (e) { saved = false; }
    /* 历次成绩趋势：拉取云端历史做对比（未登录或接口不可用时静默跳过） */
    let histHtml = "";
    try {
      const all = (window.Account && Account.isLoggedIn()) ? (await Account.getReports()) : [];
      const pct = r => (r.total ? Math.round(r.master / r.total * 100) : 0);
      if (all.length > 1) {
        const rowHtml = r => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span class="muted" style="font-size:12px;min-width:84px">${U.fmtDate(r.at)}</span>
            <span style="flex:1;height:7px;border-radius:4px;background:rgba(128,128,128,.18);overflow:hidden"><span style="display:block;height:100%;width:${pct(r)}%;background:var(--c-success,#16A34A)"></span></span>
            <b style="min-width:40px;text-align:right">${pct(r)}%</b>
            <span class="muted" style="font-size:12px;min-width:70px;text-align:right">${r.master}/${r.total}</span>
          </div>`;
        const collapsed = all.length > 6;
        const rows = all.slice(0, 6).map(rowHtml).join("");
        const delta = pct(all[0]) - pct(all[all.length - 1]);
        histHtml = `<div style="max-width:520px;margin:20px auto 0;text-align:left">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <b style="font-size:15px">历次成绩趋势</b>
            <span class="tag ${delta > 0 ? "tag-success" : delta < 0 ? "tag-danger" : "tag-warning"}">${delta > 0 ? "↑ 提升 " + delta + "%" : delta < 0 ? "↓ 下降 " + Math.abs(delta) + "%" : "持平"}</span>
          </div>
          ${rows}
          ${collapsed ? `<div id="hist-extra" style="display:none">${all.slice(6).map(rowHtml).join("")}</div>` : ""}
          <div class="muted" style="font-size:12px;margin-top:8px">共 ${all.length} 次记录${saved ? " · 本次已存云端" : ""}${collapsed ? ` · <a href="#" id="hist-more" style="color:var(--c-primary)">查看全部</a>` : ""}</div>
        </div>`;
      } else if (saved) {
        histHtml = `<div style="max-width:520px;margin:16px auto 0;padding:12px 14px;border:1px solid var(--c-primary,#2563EB);background:rgba(37,99,235,.08);border-radius:10px;font-size:14px;line-height:1.6"><b style="color:var(--c-primary,#2563EB)">账户提示 · </b>本次成绩已存到云端，再面一次就能看到趋势对比</div>`;
      } else {
        /* 未登录：结果页云端功能处原本「隐身」，补引导避免用户困惑；升级为醒目提示条，避免低调灰字被忽略 */
        histHtml = `<div style="max-width:520px;margin:16px auto 0;padding:12px 14px;border:1px solid var(--c-primary,#2563EB);background:rgba(37,99,235,.08);border-radius:10px;font-size:14px;line-height:1.6"><b style="color:var(--c-primary,#2563EB)">账户提示 · </b>登录后可保存成绩到云端，并留存历次趋势对比 · <a href="#/account" style="color:var(--c-primary,#2563EB);font-weight:600">去登录 →</a></div>`;
      }
    } catch (e) {}
    setMain(`<div class="empty" style="text-align:left">
      <h2>${U.icon("check")} 面试完成</h2>
      <div class="grid grid-cols-2" style="max-width:520px;margin:16px auto">
        <div class="card"><div class="num">${pool.length}</div><div class="label">题目</div></div>
        <div class="card"><div class="num">${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}</div><div class="label">用时</div></div>
        <div class="card"><div class="num" style="color:var(--c-success)">${mastery.master}</div><div class="label">掌握</div></div>
        <div class="card"><div class="num" style="color:var(--c-danger)">${mastery.unknown}</div><div class="label">不会</div></div>
      </div>
      <p class="secondary">技术方向覆盖：${covKeys.join("、") || "—"}</p>
      ${histHtml}
      <div class="pill-row" style="justify-content:center">
        <button class="btn btn-primary" id="exp">${U.icon("download")} 导出报告(MD)</button>
        <a class="btn" href="#/mock">${U.icon("refresh")} 再面一次</a>
      </div></div>`);
    $("#exp").onclick = () => U.download("模拟面试报告.md", md, "text/markdown");
    const histMore = $("#hist-more");
    if (histMore) histMore.onclick = (e) => {
      e.preventDefault();
      const ex = $("#hist-extra");
      const open = ex.style.display === "none";
      ex.style.display = open ? "block" : "none";
      histMore.textContent = open ? "收起" : "查看全部";
    };
  }

  /* ============================ 管理员：登录 ============================ */
  async function openAdminLogin() {
    if (!(await Auth.hasAdmin())) {
      const m = U.modal({ title: "设置管理员密码", closable: true });
      m.body.innerHTML = `<div class="note">首次使用，请设置管理员密码。该密码仅用于当前浏览器本地权限隔离，使用浏览器 Crypto API 哈希后保存，不会以明文存储，也非服务端安全认证。</div>
        <label class="field"><span>管理员密码</span><input type="password" id="pw1" /></label>
        <label class="field"><span>确认密码</span><input type="password" id="pw2" /></label>`;
      const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "设置并登录";
      const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      const doSetup = async () => {
        const a = $("#pw1").value, b = $("#pw2").value;
        if (a.length < 6) { U.toast("密码至少 6 位", "warn"); return; }
        if (a !== b) { U.toast("两次输入不一致", "error"); return; }
        await Auth.setup(a); Auth.login(); m.close(); U.toast("管理员已设置并登录", "success"); renderTopbar(); renderSidebar(parseHash());
      };
      ok.onclick = doSetup; cancel.onclick = m.close;
      return;
    }
    const m = U.modal({ title: "管理员登录", closable: true });
    m.body.innerHTML = `<label class="field"><span>管理员密码</span><input type="password" id="pw" /></label>
      <div class="note">提示：管理员密码仅用于本机权限隔离。忘记密码可在浏览器开发者工具清除 IndexedDB 中 settings 表的 adminHash 后重新设置。</div>`;
    const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "登录";
    const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
    m.foot.appendChild(cancel); m.foot.appendChild(ok);
    const login = async () => {
      const okv = await Auth.verify($("#pw").value);
      if (!okv) { U.toast("密码错误", "error"); return; }
      Auth.login(); m.close(); U.toast("登录成功", "success"); renderTopbar(); renderSidebar(parseHash());
    };
    ok.onclick = login; $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
  }

  /* ============================ 管理员：仪表盘 ============================ */
  async function pageAdminDashboard() {
    const s = await Services.stats();
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>仪表盘</span></div>
      <h1>管理员仪表盘</h1>
      <div class="stat-grid">
        <div class="stat"><div class="num">${s.total}</div><div class="label">题目总数</div></div>
        <div class="stat"><div class="num" style="color:var(--c-success)">${s.published}</div><div class="label">已发布</div></div>
        <div class="stat"><div class="num" style="color:var(--c-warning)">${s.draft}</div><div class="label">草稿</div></div>
        <div class="stat ai"><div class="num">${s.ai}</div><div class="label">AI 生成</div></div>
      </div>
      <div class="grid grid-cols-2" style="margin-top:20px">
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">技术体系分布</h2></div><div id="c1" style="height:280px"></div></div>
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">难度分布</h2></div><div id="c2" style="height:280px"></div></div>
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">题型分布</h2></div><div id="c3" style="height:280px"></div></div>
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">AI 评分分布</h2></div><div id="c4" style="height:280px"></div></div>
      </div>
      <div class="grid grid-cols-2" style="margin-top:20px">
        <div class="card"><h2 style="font-size:16px">题目不足的分类（<5题）</h2>${s.insufficient.length ? `<table class="data">${s.insufficient.map(x => `<tr><td>${U.esc(x.name)}</td><td>${x.count}</td></tr>`).join("")}</table>` : '<div class="muted">无</div>'}</div>
        <div class="card"><h2 style="font-size:16px">空分类</h2>${s.empty.length ? `<div class="pill-row">${s.empty.map(n => `<span class="tag tag-warning">${U.esc(n)}</span>`).join("")}</div>` : '<div class="muted">无</div>'}</div>
      </div>
      <div class="grid grid-cols-2" style="margin-top:20px">
        <div class="card"><h2 style="font-size:16px">最近 AI 生成</h2>${s.aiLogs.length ? `<table class="data">${s.aiLogs.map(l => `<tr><td>${U.esc(l.positionName || "-")}</td><td>${l.genCount || 0}题</td><td class="muted">${U.fmtDate(l.createdAt)}</td></tr>`).join("")}</table>` : '<div class="muted">暂无</div>'}</div>
        <div class="card"><h2 style="font-size:16px">收藏排行</h2>${s.topFav.length ? `<table class="data">${s.topFav.map(q => `<tr><td><a href="#/question/${q.id}">${U.esc(q.title)}</a></td><td>${q.favorites}</td></tr>`).join("")}</table>` : '<div class="muted">暂无</div>'}</div>
      </div>
      <div class="grid grid-cols-2" style="margin-top:20px">
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">访问统计</h2></div>
          ${Stats.baiduId()
            ? `<div style="text-align:center;padding:24px 16px"><div style="font-size:48px;margin-bottom:8px">${U.icon("barChart")}</div><p class="muted" style="margin-bottom:16px">访客地域分布、来源分析、趋势报表</p><a class="btn btn-primary" href="https://tongji.baidu.com" target="_blank" rel="noopener">查看百度统计后台 →</a></div>`
            : `<div style="text-align:center;padding:24px 16px"><div class="muted" style="margin-bottom:12px">配置「百度统计」后可查看访客地域分布、来源分析、趋势报表</div><a class="btn" href="#/admin/settings">前往配置 →</a></div>`}
          ${Stats.cfEnabled() ? `<div id="c-geo" style="height:240px;margin-top:12px"></div>` : ""}
        </div>
        <div class="card"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">本机浏览最多题目 Top</h2></div><div id="c-topq"></div></div>
      </div>
    `, () => {
      const axisColor = App.getTheme() === "dark" ? "#aeb9c9" : "#475569";
      /* 本地浏览最多题目（不依赖 echarts，同步渲染） */
      const localStats = Stats.getLocalStats();
      const tq = localStats.topQuestions || [];
      const topBox = document.getElementById("c-topq");
      if (topBox) {
        if (!tq.length) topBox.innerHTML = '<div class="muted">暂无浏览记录</div>';
        else topBox.innerHTML = `<table class="data"><thead><tr><th>#</th><th>题目</th><th>浏览</th></tr></thead><tbody>${tq.slice(0, 15).map((x, i) => { const q = Services.questions.find(z => z.id === parseInt(x.id)); return `<tr><td>${i + 1}</td><td>${q ? `<a href="#/question/${q.id}">${U.esc(q.title)}</a>` : "题目#" + U.esc(x.id)}</td><td>${x.views}</td></tr>`; }).join("")}</tbody></table>`;
      }
      /* 图表区统一走按需加载的 echarts（失败静默，不影响面板其余内容） */
      U.loadScript("echarts", U.ECHARTS_URL).then(() => {
        const mk = (id, type, data, name) => { const box = $(id); box.classList.add("chart-fade"); const c = echarts.init(box); charts.push(c); c.setOption({ tooltip: { trigger: type === "pie" ? "item" : "axis" }, legend: type === "pie" ? { textStyle: { color: axisColor } } : undefined, xAxis: type === "bar" ? { type: "category", data: data.map(d => d[0]), axisLabel: { color: axisColor, rotate: 30 } } : undefined, yAxis: type === "bar" ? { type: "value", axisLabel: { color: axisColor } } : undefined, series: [{ type, data: type === "pie" ? data.map(d => ({ name: d[0], value: d[1] })) : data.map(d => d[1]), name, itemStyle: { color: type === "pie" ? undefined : "#2563EB" }, label: { color: axisColor } }] }); };
        mk("#c1", "bar", Object.entries(s.byCat).filter(([, v]) => v > 0).slice(0, 12), "题目数");
        mk("#c2", "pie", Object.entries(s.byDiff), "难度");
        mk("#c3", "bar", Object.entries(s.byType), "题型");
        mk("#c4", "pie", Object.entries(s.byAiBand), "AI评分");
        /* 可选 Cloudflare Worker 地域分布 */
        if (Stats.cfEnabled()) {
          Stats.cfGetStats(true).then(st => {
            const geo = (st && st.byCountry) || {};
            const geoArr = Object.entries(geo).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 12);
            const geoBox = document.getElementById("c-geo");
            if (geoBox) {
              if (geoArr.length) { geoBox.classList.add("chart-fade"); const c = echarts.init(geoBox); charts.push(c); c.setOption({ tooltip: { trigger: "item" }, series: [{ type: "pie", radius: ["42%", "70%"], data: geoArr.map(([k, v]) => ({ name: countryName(k), value: v })), label: { color: axisColor } }] }); }
              else geoBox.innerHTML = '<div class="muted" style="text-align:center;padding:40px 0">暂无访客数据</div>';
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    });
  }

  /* ============================ 管理员：题目管理 ============================ */
  async function pageAdminQuestions() {
    const qs = Services.questions.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>题目管理</span></div>
      <div class="section-head"><h2>题目管理（${qs.length}）</h2>
        <div><a class="btn btn-ai" href="#/admin/question/new">${U.icon("plus")} 新增题目</a>
        <a class="btn" href="#/admin/ai">${U.icon("sparkles")} AI 出题</a></div></div>
      <div class="toolbar"><input id="f" class="full" style="max-width:300px" placeholder="筛选标题…" /></div>
      <div class="card" style="padding:0"><table class="data"><thead><tr><th>标题</th><th>分类</th><th>难度</th><th>题型</th><th>状态</th><th>来源</th><th>AI</th><th>操作</th></tr></thead><tbody id="tb"></tbody></table></div>`);
    const render = (filter) => {
      const tb = $("#tb");
      const arr = qs.filter(q => !filter || q.title.indexOf(filter) >= 0).slice(0, 100);
      tb.innerHTML = arr.map(q => `<tr>
        <td><a href="#/question/${q.id}">${U.esc(q.title)}</a></td>
        <td>${U.esc(q.catName || "-")}</td>
        <td><span class="tag diff-${q.difficulty}">${q.difficulty}</span></td>
        <td>${U.esc(q.type)}</td>
        <td><span class="tag ${q.status === "published" ? "tag-success" : q.status === "draft" ? "tag-warning" : "tag-danger"}">${q.status === "published" ? "已发布" : q.status === "draft" ? "草稿" : "下线"}</span></td>
        <td>${U.esc(q.source)}</td><td>${q.aiScore || 0}</td>
        <td class="row">
          <a class="btn btn-sm" href="#/admin/question/${q.id}">${U.icon("edit")}</a>
          <button class="btn btn-sm" data-dup="${q.id}">${U.icon("copy")}</button>
          <button class="btn btn-sm btn-danger" data-del="${q.id}">${U.icon("trash")}</button>
        </td></tr>`).join("");
      $$("#tb [data-del]").forEach(b => b.onclick = async () => { if (await U.confirm("删除该题？不可逆。", { danger: true })) { await Services.deleteQuestion(parseInt(b.dataset.del)); await Services.reload(); U.toast("已删除", "success"); render($("#f").value); } });
      $$("#tb [data-dup]").forEach(b => b.onclick = async () => { const nid = await Services.duplicateQuestion(parseInt(b.dataset.dup)); await Services.reload(); U.toast("已复制为草稿", "success"); App.go("/admin/question/" + nid); });
    };
    $("#f").addEventListener("input", U.debounce(e => render(e.target.value.trim()), 300));
    render("");
  }

  /* ============================ 标题查重（新增/AI生成入库前提示，不强制拦截） ============================ */
  function normTitleKey(t) { return String(t || "").replace(/\s+/g, "").replace(/[？?！!，,。．.；;：:、·\-—＿_（）()\[\]【】"]/g, "").toLowerCase(); }
  function findTitleDups(titles, excludeId) {
    const lib = new Map();
    Services.questions.forEach(q => { const k = normTitleKey(q.title); if (!lib.has(k)) lib.set(k, []); lib.get(k).push(q); });
    const statusText = s => s === "published" ? "已发布" : (s === "draft" ? "草稿" : "已下线");
    const seen = new Set();
    const dups = [];
    titles.forEach(t => {
      const k = normTitleKey(t);
      const reasons = [];
      (lib.get(k) || []).forEach(q => { if (q.id !== excludeId) reasons.push("题库已有 ID " + q.id + "《" + q.title + "》（" + statusText(q.status) + "）"); });
      if (seen.has(k)) reasons.push("与本批次其它题目重复");
      seen.add(k);
      if (reasons.length) dups.push({ title: t, reasons: reasons });
    });
    return dups;
  }
  async function confirmTitleDups(dups, okText) {
    if (!dups || !dups.length) return true;
    const lines = dups.slice(0, 8).map(d => "·《" + d.title + "》" + d.reasons.map(r => " → " + r).join("；"));
    const more = dups.length > 8 ? "（其余 " + (dups.length - 8) + " 条略）" : "";
    return U.confirm("发现 " + dups.length + " 个疑似重复标题" + (dups.length > 8 ? "（仅列前 8 条）" : "") + "：", { okText: okText || "仍要保存", note: lines.join("；") + more });
  }

  /* ============================ 管理员：题目编辑 ============================ */
  async function pageAdminQuestionEdit(id) {
    const isNew = !id || id === "new";
    const q = isNew ? { title: "", body: "", answer: "", difficulty: "中级", type: "简答题", status: "draft", tags: [], positionNames: [], years: "", remark: "", categoryId: null } : await Services.getQuestion(parseInt(id));
    if (!q) { setMain(`<div class="empty">未找到题目</div>`); return; }
    const catOpts = (sel) => { const build = (pid, depth) => Services.childrenOf(pid).map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${"　".repeat(depth)}${U.esc(c.name)}</option>` + build(c.id, depth + 1)).join(""); return `<option value="">未分类</option>` + build(0, 0); };
    const flatCats = []; (function walk(nodes, prefix) { nodes.forEach(n => { const path = prefix ? prefix + " / " + n.name : n.name; flatCats.push({ id: n.id, name: n.name, path: path }); if (n.children && n.children.length) walk(n.children, path); }); })(Services.categoryTree(), "");
    const diffs = ["初级", "中级", "高级", "专家"];
    const types = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];
    const allPos = Services.positions;
    const tagInput = (arr) => `<div class="tag-input" id="tag-box">${arr.map(t => `<span class="chip">${U.esc(t)}<span class="x" data-t="${U.esc(t)}">${U.icon("x")}</span></span>`).join("")}<input id="tag-add" placeholder="输入标签回车添加" /></div>`;
    const posByName = new Map(); allPos.forEach(p => { posByName.set(p.name, p); if (p.direction) posByName.set(Services.posFullName(p), p); });
    const posSelIds = (q.positionIds || []).slice();
    (q.positionNames || []).forEach(n => { const pos = posByName.get(n); if (pos && posSelIds.indexOf(pos.id) < 0) posSelIds.push(pos.id); });
    const posInput = () => {
      const byStage = Services.positionsByStage();
      return byStage.map(s => {
        const seen = new Set();
        const uniq = s.list.filter(p => { if (Services.isHiddenPosition(p)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; });
        if (!uniq.length) return "";
        return `<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:6px">${U.esc(s.stage)}</div><div class="row" style="flex-wrap:wrap;gap:8px">${uniq.map(p => `<label class="chip" style="cursor:pointer;user-select:none"><input type="checkbox" name="f-pos" value="${p.id}" ${posSelIds.indexOf(p.id) >= 0 ? "checked" : ""} style="margin-right:4px">${U.esc(Services.posFullName(p))}</label>`).join("")}</div></div>`;
      }).join("");
    };

    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/admin/questions">题目管理</a><span class="sep">/</span><span>${isNew ? "新增" : "编辑"}</span></div>
      <div class="row" style="justify-content:space-between;margin-bottom:12px">
        <h1>${isNew ? "新增题目" : "编辑题目"}</h1>
        <div class="pill-row">
          <button class="btn" id="save-draft">保存草稿</button>
          <button class="btn btn-primary" id="save-pub">发布/保存</button>
          <button class="btn btn-ai" id="ai-opt">${U.icon("sparkles")} AI辅助</button>
        </div>
      </div>
      <label class="field"><span>题目标题</span><input id="f-title" value="${U.esc(q.title)}" /></label>
      <div class="grid grid-cols-2" style="gap:16px">
        <label class="field"><span>技术分类（可搜索）</span>
          <div class="combo" id="cat-combo">
            <input id="f-cat-text" class="full" placeholder="输入关键词搜索分类…" autocomplete="off" />
            <input type="hidden" id="f-cat" value="${q.categoryId != null ? q.categoryId : ""}" />
            <div class="combo-list" id="cat-list" style="display:none"></div>
          </div></label>
        <label class="field"><span>难度</span><select id="f-diff" class="full">${diffs.map(d => `<option ${q.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        <label class="field"><span>题型</span><select id="f-type" class="full">${types.map(t => `<option ${q.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="field"><span>工作年限</span><input id="f-years" value="${U.esc(q.years || "")}" placeholder="如 1-3年" /></label>
        <label class="field"><span>状态</span><select id="f-status" class="full"><option value="draft" ${q.status === "draft" ? "selected" : ""}>草稿</option><option value="published" ${q.status === "published" ? "selected" : ""}>已发布</option><option value="offline" ${q.status === "offline" ? "selected" : ""}>下线</option></select></label>
        <label class="field"><span>技术标签</span>${tagInput(q.tags || [])}</label>
      </div>
      <label class="field"><span>适用岗位</span>${posInput()}</label>
      <div class="grid grid-cols-2" style="gap:16px">
        <div class="field"><span>题目正文（Markdown，支持直接粘贴图片）</span><div class="editor-split">
          <div class="editor-pane"><div class="pane-head"><span>编辑（可直接粘贴图片）</span></div><textarea id="f-body">${U.esc(q.body || "")}</textarea></div>
          <div class="editor-pane"><div class="pane-head"><span>预览</span></div><div class="preview-pane md" id="prev-body"></div></div>
        </div></div>
        <div class="field"><span>参考答案（Markdown，支持直接粘贴图片）</span><div class="editor-split">
          <div class="editor-pane"><div class="pane-head"><span>编辑（可直接粘贴图片）</span></div><textarea id="f-answer">${U.esc(q.answer || "")}</textarea></div>
          <div class="editor-pane"><div class="pane-head"><span>预览</span></div><div class="preview-pane md" id="prev-answer"></div></div>
        </div></div>
      </div>
      <label class="field"><span>管理员备注</span><input id="f-remark" value="${U.esc(q.remark || "")}" /></label>
      <div class="note">每次保存会自动创建版本记录，可在题目详情页恢复历史版本。</div>
    `, () => {
      const upd = () => { $("#prev-body").innerHTML = U.md($("#f-body").value); $("#prev-answer").innerHTML = U.md($("#f-answer").value); U.highlightAll($("#prev-answer")); };
      $("#f-body").addEventListener("input", upd); $("#f-answer").addEventListener("input", upd); upd();
      wireImagePaste("#f-body"); wireImagePaste("#f-answer");
      wireTagInput("#tag-box", "#tag-add");
      wireCombo("#f-cat-text", "#f-cat", "#cat-list", flatCats);
    });

    async function save(status) {
      const tags = $$("#tag-box .chip").map(c => c.dataset.t);
      const posBoxes = $$("input[name='f-pos']:checked");
      const posIds = posBoxes.map(cb => parseInt(cb.value));
      const posNames = posBoxes.map(cb => { const pos = Services.getPosition(parseInt(cb.value)); return pos ? Services.posFullName(pos) : ""; }).filter(Boolean);
      const data = {
        title: $("#f-title").value.trim() || "未命名题目",
        body: $("#f-body").value, answer: $("#f-answer").value,
        categoryId: $("#f-cat").value ? parseInt($("#f-cat").value) : null,
        difficulty: $("#f-diff").value, type: $("#f-type").value, years: $("#f-years").value.trim(),
        status: status, tags: tags, positionIds: posIds, positionNames: posNames, remark: $("#f-remark").value.trim()
      };
      const dup = findTitleDups([data.title], isNew ? null : q.id);
      if (dup.length && !(await confirmTitleDups(dup))) { U.toast("已取消保存，请检查重复题目", "warn"); return; }
      if (isNew) { const nid = await Services.addQuestion(Object.assign(data, { source: "manual" })); await Services.reload(); U.toast("已保存", "success"); App.go("/admin/question/" + nid); }
      else { await Services.updateQuestion(q.id, data); await Services.reload(); U.toast("已保存并生成版本", "success"); }
    }
    $("#save-draft").onclick = () => save("draft");
    $("#save-pub").onclick = () => save($("#f-status").value || "published");
    $("#ai-opt").onclick = () => openOptimizeModal(q, true);
  }
  /* ---------- 编辑器粘贴图片：压缩为 JPEG data URL，以 Markdown 图片插入光标处 ---------- */
  function pasteLoadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("图片文件无法读取")); };
      img.src = url;
    });
  }
  function pasteCompress(file, maxDim, quality) {
    return pasteLoadImage(file).then(img => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      return { dataUrl: c.toDataURL("image/jpeg", quality), w: w, h: h };
    });
  }
  function pasteInsert(ta, text) {
    const s = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    const e = ta.selectionEnd == null ? ta.value.length : ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    const pos = s + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  /* ---------- 图片外置助手：data URL → 二进制 → 仓库文件 assets/q/ ---------- */
  function dataUrlToBytes(dataUrl) {
    const b64 = dataUrl.split(",")[1] || "";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const IMG_EXT = { "jpeg": "jpg", "jpg": "jpg", "png": "png", "webp": "webp", "gif": "gif", "svg+xml": "svg" };
  async function uploadImageAsset(dataUrl, qId) {
    const m = /^data:image\/([a-z+.-]+);/i.exec(dataUrl);
    const ext = IMG_EXT[(m && m[1] || "jpeg").toLowerCase()] || "jpg";
    const name = (qId ? "q" + qId + "-" : "") + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6) + "." + ext;
    const path = "assets/q/" + name;
    await Cloud.putFile(path, dataUrlToBytes(dataUrl), "外置题目图片 " + name);
    return path;   // 站内相对路径，GitHub Pages 根路径部署下即线上 URL
  }
  function wireImagePaste(sel) {
    const ta = $(sel); if (!ta) return;
    ta.addEventListener("paste", e => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      let file = null;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && it.type && it.type.indexOf("image/") === 0) { file = it.getAsFile(); if (file) break; }
      }
      if (!file) return;  // 纯文本粘贴走默认行为
      e.preventDefault();
      pasteCompress(file, 1400, 0.85)
        .then(r => r.dataUrl.length > 500 * 1024 ? pasteCompress(file, 1000, 0.7) : r)
        .then(r => {
          if (r.dataUrl.length > 500 * 1024) { U.toast("图片过大（" + U.fmtSize(r.dataUrl.length) + "），已尝试压缩仍超 500KB，请缩小后再粘贴", "warn"); return null; }
          return r;
        })
        .then(async r => {
          if (!r) return;
          /* 编辑端（已配置发布 Token）：图片外置为仓库文件，Markdown 引用 URL，
             避免快照膨胀且可被浏览器缓存；上传失败或非编辑端回退内嵌 data URL（与旧版一致） */
          if (Cloud.isEditor()) {
            try {
              U.toast("正在上传图片到仓库 assets/q/…", "info");
              const url = await uploadImageAsset(r.dataUrl);
              pasteInsert(ta, "\n![粘贴图片](" + url + ")\n");
              U.toast("已外置插入 " + r.w + "×" + r.h + "（" + U.fmtSize(r.dataUrl.length) + " → " + url + "）", "success");
              return;
            } catch (err) {
              console.warn("图片外置失败，回退内嵌 data URL", err);
              U.toast("图片上传失败，已回退内嵌模式：" + (err.message || err), "warn");
            }
          }
          pasteInsert(ta, "\n![粘贴图片](" + r.dataUrl + ")\n");
          U.toast("已插入图片 " + r.w + "×" + r.h + "（" + U.fmtSize(r.dataUrl.length) + "）", "success");
        })
        .catch(err => U.toast("图片处理失败：" + err.message, "error"));
    });
  }
  function wireTagInput(boxSel, inputSel) {
    const box = $(boxSel); if (!box) return;
    // 事件委托：无论初始渲染还是动态添加的标签，点击 .x 即可删除对应 chip（覆盖 SVG 命中/穿透问题）
    box.addEventListener("click", e => {
      const x = e.target.closest(".x");
      if (x) { const chip = x.closest(".chip"); if (chip) chip.remove(); }
    });
    const input = inputSel ? $(inputSel) : null;
    if (input) input.addEventListener("keydown", e => {
      if (e.key === "Enter" && input.value.trim()) {
        const v = input.value.trim(); e.preventDefault();
        const chip = document.createElement("span"); chip.className = "chip"; chip.dataset.t = v;
        chip.innerHTML = U.esc(v) + `<span class="x">${U.icon("x")}</span>`;
        box.insertBefore(chip, input); input.value = "";
      }
    });
  }

  // 可搜索分类组合框：input 显示路径（父/子/孙），隐藏 input 存 categoryId
  function wireCombo(inputSel, hiddenSel, listSel, items) {
    const input = $(inputSel), hidden = $(hiddenSel), list = $(listSel);
    if (!input || !hidden || !list) return;
    let picked = hidden.value ? parseInt(hidden.value) : null;
    const dataOf = (id) => items.find(it => String(it.id) === String(id));
    function render(q) {
      q = (q || "").trim().toLowerCase();
      const filtered = items.filter(it => !q || it.name.toLowerCase().indexOf(q) >= 0 || it.path.toLowerCase().indexOf(q) >= 0);
      const head = `<div class="combo-item ${picked == null ? "active" : ""}" data-id="">未分类</div>`;
      const body = filtered.length
        ? filtered.map(it => `<div class="combo-item ${it.id === picked ? "active" : ""}" data-id="${it.id}">${U.esc(it.path)}</div>`).join("")
        : `<div class="combo-item muted" style="cursor:default">无匹配分类</div>`;
      list.innerHTML = head + body;
      list.querySelectorAll(".combo-item[data-id]").forEach(el => {
        el.onclick = () => {
          const id = el.dataset.id;
          if (id === "") { picked = null; hidden.value = ""; input.value = ""; }
          else { picked = parseInt(id); hidden.value = id; input.value = el.textContent; }
          list.style.display = "none";
        };
      });
    }
    input.addEventListener("focus", () => { render(""); list.style.display = "block"; });
    input.addEventListener("input", () => { picked = null; render(input.value); list.style.display = "block"; });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        list.style.display = "none";
        const it = dataOf(hidden.value);
        input.value = it ? it.path : "";
      }, 150);
    });
    const init = dataOf(hidden.value);
    if (init) input.value = init.path;
  }

  /* AI 优化弹窗（题目详情/编辑通用） */
  function openOptimizeModal(q, fromEdit) {
    const actions = [["optimize", "优化题目表述"], ["answer", "补充标准答案"], ["followup", "生成面试追问"], ["similar", "生成相似题"], ["difficulty", "评估难度"], ["check", "检查答案准确性"], ["rubric", "生成评分标准"]];
    const m = U.modal({ title: "AI 题目优化", wide: true });
    m.body.innerHTML = `<div class="note ai">${U.icon("sparkles")} 调用 DeepSeek Harness 对题目进行优化。请确保已在「系统设置」填写可用的 API Key。</div>
      <div class="pill-row" id="acts">${actions.map(a => `<button class="btn btn-ai btn-sm" data-a="${a[0]}">${a[1]}</button>`).join("")}</div>
      <div class="ai-log" id="opt-log"></div>
      <div class="ai-stream" id="out" style="margin-top:12px;min-height:120px">选择上方操作开始…</div>`;
    m.foot.innerHTML = `<button class="btn" id="apply" style="display:none">${U.icon("check")} 应用到编辑区</button>`;
    let lastResult = null;
    function normalizeResult(v) {
      if (Array.isArray(v)) {
        return v.map((item, i) => {
          if (typeof item === "string") return (i + 1) + ". " + item;
          const lines = [];
          if (item.title) lines.push("**" + (i + 1) + ". " + item.title + "**");
          if (item.body) lines.push(item.body);
          if (item.question && !item.body) lines.push(item.question);
          if (item.answer) lines.push("**参考答案：**\n" + item.answer);
          return lines.join("\n\n");
        }).join("\n\n---\n\n");
      }
      return String(v);
    }
    $$("#acts button", m.body).forEach(b => b.onclick = async () => {
      if (!API.getKey()) { U.toast("请先到系统设置填写 API Key", "warn"); App.go("/admin/settings"); return; }
      const out = $("#out"); out.classList.add("cursor-blink"); out.textContent = "生成中…";
      const olog = makeLog($("#opt-log"));
      olog("info", "开始执行：" + (b.textContent || b.dataset.a));
      try {
        const parsed = await API.optimize(q, b.dataset.a,
          (delta, full) => { out.textContent = full; out.scrollTop = out.scrollHeight; },
          (ev, p) => aiEvent(olog, ev, p)
        );
        lastResult = parsed && parsed.result ? parsed.result : (parsed && parsed.raw ? parsed.raw : String(parsed));
        const displayText = normalizeResult(lastResult);
        out.classList.remove("cursor-blink"); out.innerHTML = U.md(displayText);
        olog("ok", "优化完成");
        const apply = $("#apply"); apply.style.display = fromEdit ? "inline-flex" : "none";
      } catch (e) {
        out.classList.remove("cursor-blink");
        olog("err", errMsg(e));
        out.innerHTML = `<span class="tag tag-danger">出错</span> ` + errMsg(e);
        if (e.code === "CORS") out.innerHTML += `<div class="note">当前 API 服务不允许浏览器跨域直接调用，纯静态项目无法绕过该限制，请确认接口支持 CORS 或使用本地代理。</div>`;
      }
    });
    const apply = $("#apply"); if (apply) apply.onclick = () => {
      if (lastResult == null) return;
      if (b && 0) {}
      // 仅编辑模式可写回：尝试更新 body/answer 文本域
      const ta = document.getElementById("f-body"), aa = document.getElementById("f-answer");
      if (ta && aa) { aa.value = normalizeResult(lastResult); aa.dispatchEvent(new Event("input")); }
      m.close(); U.toast("已应用到参考答案", "success");
    };
  }
  /* ============================ AI 实时进度日志 ============================ */
  // 创建一个写入指定容器的日志函数：log(type, msg)，type ∈ info|ok|warn|err|spin
  function makeLog(el) {
    const label = { info: "信息", ok: "完成", warn: "警告", err: "错误", spin: "进行" };
    let autoScroll = true;
    if (el && el.parentNode) {
      const bar = document.createElement("div");
      bar.className = "ai-log-toolbar";
      bar.innerHTML = `<button type="button" class="log-btn" data-act="copy">${U.icon("copy")} 复制日志</button>
        <button type="button" class="log-btn active" data-act="auto">${U.icon("arrowDown")} 自动滚动</button>`;
      el.parentNode.insertBefore(bar, el);
      const copyBtn = bar.querySelector('[data-act="copy"]');
      const autoBtn = bar.querySelector('[data-act="auto"]');
      autoBtn.onclick = () => {
        autoScroll = !autoScroll;
        autoBtn.classList.toggle("active", autoScroll);
        if (autoScroll && el) el.scrollTop = el.scrollHeight;
      };
      copyBtn.onclick = () => {
        const text = Array.prototype.map.call(el.querySelectorAll(".log-line"), l => l.textContent).join("\n");
        const done = () => { copyBtn.classList.add("copied"); copyBtn.innerHTML = U.icon("check") + " 已复制"; setTimeout(() => { copyBtn.classList.remove("copied"); copyBtn.innerHTML = U.icon("copy") + " 复制日志"; }, 1400); };
        const fallback = () => { try { const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.top = "-9999px"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); done(); } catch (e2) { U.toast("复制失败，请手动选择文本", "error"); } };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
          else fallback();
        } catch (e) { fallback(); }
      };
    }
    return function log(type, msg) {
      if (!el) return;
      const line = document.createElement("div");
      line.className = "log-line" + (type && type !== "info" ? " " + type : "");
      const ts = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      const tsEl = document.createElement("span"); tsEl.className = "log-ts"; tsEl.textContent = ts;
      const dotEl = document.createElement("span"); dotEl.className = "log-dot";
      const msgEl = document.createElement("span"); msgEl.className = "log-msg";
      if (label[type]) msgEl.textContent = "[" + label[type] + "] " + (msg || ""); else msgEl.textContent = msg || "";
      line.appendChild(tsEl); line.appendChild(dotEl); line.appendChild(msgEl);
      el.appendChild(line);
      if (autoScroll) el.scrollTop = el.scrollHeight;
    };
  }
  function errCodeLabel(code) {
    const m = { NO_KEY: "未配置 API Key", INVALID_KEY: "API Key 无效", TIMEOUT: "请求超时", CORS: "跨域被拒绝", HTTP: "接口返回错误" };
    return m[code] || code;
  }
  function aiEvent(log, ev, p) {
    if (!log) return;
    p = p || {};
    if (ev === "connecting") log("info", "正在连接 DeepSeek Harness API（模型 " + (p.model || "默认") + "）…");
    else if (ev === "connected") log("ok", "API 连接成功，开始生成");
    else if (ev === "first") log("info", "已收到首个响应片段，开始流式输出");
    else if (ev === "tick") log("muted", "仍在生成中… 已耗时 " + (p.elapsed || 0) + " 秒，已接收 " + (p.chars || 0) + " 字符");
    else if (ev === "done") log("ok", "流式输出完成，共接收 " + (p.chars || 0) + " 字符" + (p.elapsed ? "，耗时 " + p.elapsed + " 秒" : ""));
    else if (ev === "error") log("err", "请求出错（" + errCodeLabel(p.code) + (p.status ? " " + p.status : "") + "）");
  }
  function errMsg(e) { const map = { NO_KEY: "未配置 API Key", INVALID_KEY: "API Key 无效，请检查是否正确填写", TIMEOUT: "请求超时，请检查网络或增大超时时间", CORS: "跨域请求被拒绝（CORS）", HTTP: "接口返回错误 " + (e.status || "") }; return map[e.code] || ("请求失败：" + (e.message || e.code || "")); }

  /* ============================ 管理员：分类管理 ============================ */
  async function pageAdminCategories() {
    const tree = Services.categoryTree();
    const render = () => {
      const node = (c) => `<div class="tree-node"><div class="tree-row open" data-id="${c.id}">
        <span>${U.esc(c.icon || "📁")} ${U.esc(c.name)}</span><span class="tree-count">${c.count}</span>
        <span class="row" style="margin-left:auto;gap:4px">
          <button class="icon-btn" data-add="${c.id}" title="新增子分类">${U.icon("plus")}</button>
          <button class="icon-btn" data-edit="${c.id}" title="编辑">${U.icon("edit")}</button>
          <button class="icon-btn" data-del="${c.id}" title="删除">${U.icon("trash")}</button>
        </span></div>
        ${c.children.length ? `<div class="tree-children">${c.children.map(node).join("")}</div>` : ""}</div>`;
      setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>分类管理</span></div>
        <div class="section-head"><h2>技术分类管理</h2><button class="btn btn-primary btn-sm" id="add-root">${U.icon("plus")} 新增一级分类</button></div>
        <div class="card" id="cat-tree">${tree.map(node).join("")}</div>
        <div class="note">支持多级分类；删除含题目的分类会先提示题目数量，需先移动或删除题目。AI 补全技术体系请前往「AI 出题 → 检查题库完整度」。</div>`);
      $("#add-root").onclick = () => editCat(null);
      $$("#cat-tree [data-add]").forEach(b => b.onclick = e => { e.stopPropagation(); editCat(null, parseInt(b.dataset.add)); });
      $$("#cat-tree [data-edit]").forEach(b => b.onclick = e => { e.stopPropagation(); editCat(parseInt(b.dataset.edit)); });
      $$("#cat-tree [data-del]").forEach(b => b.onclick = async e => {
        e.stopPropagation();
        const r = await Services.deleteCategory(parseInt(b.dataset.del));
        if (r && r.error === "hasQuestions") { U.toast(`该分类下还有 ${r.count} 道题目，无法删除`, "error"); return; }
        await Services.reload(); U.toast("已删除分类", "success"); render(); renderSidebar(parseHash());
      });
    };
    function editCat(id, parentId) {
      const c = id != null ? Services.getCategory(id) : null;
      const m = U.modal({ title: c ? "编辑分类" : "新增分类" });
      m.body.innerHTML = `<label class="field"><span>分类名称</span><input id="cn" value="${c ? U.esc(c.name) : ""}" /></label>
        <label class="field"><span>图标（emoji）</span><input id="ci" value="${c ? U.esc(c.icon || "📁") : "📁"}" style="max-width:80px" /></label>
        <label class="field"><span>年代/说明</span><input id="ce" value="${c ? U.esc(c.era || "") : ""}" placeholder="如 1990s-至今" /></label>
        <label class="field"><span>描述</span><textarea id="cd">${c ? U.esc(c.description || "") : ""}</textarea></label>`;
      const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "保存";
      const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      ok.onclick = async () => {
        const data = { name: $("#cn").value.trim(), icon: $("#ci").value.trim() || "📁", era: $("#ce").value.trim(), description: $("#cd").value.trim() };
        if (!data.name) { U.toast("请输入名称", "warn"); return; }
        if (c) await Services.updateCategory(c.id, data); else await Services.addCategory(parentId != null ? parentId : (id != null ? c.parentId : 0), data);
        await Services.reload(); m.close(); U.toast("已保存", "success"); render(); renderSidebar(parseHash());
      };
      cancel.onclick = m.close;
    }
    render();
  }

  /* ============================ 管理员：岗位管理 ============================ */
  async function pageAdminPositions() {
    const byStage = Services.positionsByStage();
    const hiddenIds = new Set(Services.positions.filter(p => Services.isHiddenPosition(p)).map(p => p.id));
    const fakeIds = new Set(Services.positions.filter(p => Services.isFakePosition(p)).map(p => p.id));
    const totalHidden = hiddenIds.size;
    const notice = totalHidden > 0 ? `<div style="margin-bottom:12px;padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;color:#0369a1;font-size:13px">已隐藏 ${totalHidden} 条与分类同名的无效岗位（其中 ${fakeIds.size} 条可安全清理），可在「岗位体系」页点击清理。</div>` : "";
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>岗位管理</span></div>
      <div class="section-head"><h2>岗位管理</h2><button class="btn btn-primary btn-sm" id="add-pos">${U.icon("plus")} 新增岗位</button></div>${notice}
      <div id="pos-wrap">${byStage.map(s => { const seen = new Set(); const uniq = s.list.filter(p => { if (hiddenIds.has(p.id)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; }); if (!uniq.length) return ""; return `<div class="section-head" style="margin:18px 0 8px"><h2 style="font-size:16px">${U.esc(s.stage)}</h2></div>
        <div class="grid grid-cols-auto">${uniq.map(p => `<div class="card"><div class="row" style="justify-content:space-between"><b>${U.esc(Services.posFullName(p))}</b>
          <span class="row" style="gap:4px"><button class="icon-btn" data-sk="${p.id}" title="技术栈">${U.icon("star")}</button><button class="icon-btn" data-edit="${p.id}">${U.icon("edit")}</button><button class="icon-btn" data-del="${p.id}">${U.icon("trash")}</button></span></div>
          <div class="muted" style="font-size:12px">${U.esc(p.category || "")} · 题目 ${Services.questionCountForPosition(p)} · 技术栈 ${Services.skillsOf(p.id).length}</div></div>`).join("")}</div>`;
    }).join("")}</div>`);
    $("#add-pos").onclick = () => editPos(null);
    $$("[data-edit]").forEach(b => b.onclick = () => editPos(parseInt(b.dataset.edit)));
    $$("[data-del]").forEach(b => b.onclick = async () => { if (await U.confirm("删除该岗位？关联技术栈也会删除。", { danger: true })) { await Services.deletePosition(parseInt(b.dataset.del)); await Services.reload(); U.toast("已删除", "success"); pageAdminPositions(); renderSidebar(parseHash()); } });
    $$("[data-sk]").forEach(b => b.onclick = () => editSkills(parseInt(b.dataset.sk)));
    function editPos(id) {
      const p = id != null ? Services.getPosition(id) : null;
      const m = U.modal({ title: p ? "编辑岗位" : "新增岗位" });
      const catOptions = (sel) => { const build = (pid, depth) => Services.childrenOf(pid).map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${"　".repeat(depth)}${U.esc(c.name)}</option>` + build(c.id, depth + 1)).join(""); return build(0, 0); };
      m.body.innerHTML = `<label class="field"><span>岗位名称</span><input id="pn" value="${p ? U.esc(p.name) : ""}" /></label>
        <label class="field"><span>细分方向</span><input id="pdir" value="${p ? U.esc(p.direction || "") : ""}" placeholder="可选，如 大客户答疑 / 监控运维" /></label>
        <label class="field"><span>所属阶段</span><input id="ps" value="${p ? U.esc(p.stage) : ""}" placeholder="如 互联网时代" /></label>
        <label class="field"><span>分类/方向</span><select id="pcat" class="full"><option value="">未选择</option>${catOptions(p && p.categoryId)}</select></label>
        <label class="field"><span>市场需求热度</span><select id="pdmd" class="full"><option value="高" ${p && p.demand === "高" ? "selected" : ""}>高</option><option value="中" ${p && p.demand !== "高" && p.demand !== "低" ? "selected" : ""}>中</option><option value="低" ${p && p.demand === "低" ? "selected" : ""}>低</option></select></label>
        <label class="field"><span>描述</span><textarea id="pdesc">${p ? U.esc(p.description || "") : ""}</textarea></label>`;
      const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "保存";
      const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      ok.onclick = async () => {
        const categoryId = $("#pcat").value ? parseInt($("#pcat").value) : null;
        const data = { name: $("#pn").value.trim(), direction: $("#pdir").value.trim(), stage: $("#ps").value.trim() || "未分类", categoryId: categoryId, demand: $("#pdmd").value, description: $("#pdesc").value.trim() };
        if (!data.name) { U.toast("请输入名称", "warn"); return; }
        const conflictCat = Services.getCategoryByName(data.name);
        if (conflictCat) {
          const linkedToItself = data.categoryId === conflictCat.id;
          if (!linkedToItself || !p) {
            U.toast(`「${data.name}」是技术分类名称，不能作为岗位名。请改为具体岗位（如「公有云售后技术支持」）`, "warn");
            return;
          }
        }
        if (p) await Services.updatePosition(p.id, data); else await Services.addPosition(data);
        await Services.reload(); m.close(); U.toast("已保存", "success"); pageAdminPositions(); renderSidebar(parseHash());
      };
      cancel.onclick = m.close;
    }
    function editSkills(posId) {
      const p = Services.getPosition(posId);
      const skills = Services.skillsOf(posId);
      const m = U.modal({ title: p.name + " · 技术栈", wide: true });
      const row = (s) => `<tr data-id="${s.id || ""}"><td><input class="full sk-tech" value="${U.esc(s.techName || "")}" /></td>
        <td><select class="full sk-req"><option value="1" ${s.required ? "selected" : ""}>必考</option><option value="0" ${!s.required ? "selected" : ""}>加分</option></select></td>
        <td><select class="full sk-stars">${[1,2,3,4,5].map(n => `<option ${s.stars === n ? "selected" : ""}>${n}</option>`).join("")}</select></td>
        <td><select class="full sk-depth"><option ${s.depth === "了解" ? "selected" : ""}>了解</option><option ${s.depth === "熟悉" ? "selected" : ""}>熟悉</option><option ${s.depth === "精通" ? "selected" : ""}>精通</option></select></td>
        <td><button class="icon-btn sk-del">${U.icon("trash")}</button></td></tr>`;
      m.body.innerHTML = `<div class="note">技术名称尽量与系统分类名一致，便于自动关联题目。</div>
        <table class="data"><thead><tr><th>技术名称</th><th>类型</th><th>重要度</th><th>掌握深度</th><th></th></tr></thead><tbody id="sk-tb">${skills.map(row).join("")}</tbody></table>
        <button class="btn btn-sm" id="sk-add">${U.icon("plus")} 添加一行</button>`;
      const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "保存";
      const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      const refresh = () => { $$("#sk-tb tr").forEach(tr => { const del = tr.querySelector(".sk-del"); del.onclick = () => { tr.remove(); }; }); };
      refresh();
      $("#sk-add").onclick = () => { const tb = $("#sk-tb"); const tmp = document.createElement("tbody"); tmp.innerHTML = row({ required: true, stars: 3, depth: "了解" }); tb.appendChild(tmp.firstChild); refresh(); };
      ok.onclick = async () => {
        const existing = Services.skillsOf(posId); await Promise.all(existing.map(s => DB.db.positionSkills.delete(s.id)));
        $$("#sk-tb tr").forEach(tr => {
          const tech = tr.querySelector(".sk-tech").value.trim(); if (!tech) return;
          DB.db.positionSkills.add({ positionId: posId, categoryId: null, techName: tech, required: tr.querySelector(".sk-req").value === "1", stars: parseInt(tr.querySelector(".sk-stars").value), depth: tr.querySelector(".sk-depth").value });
        });
        await Services.reload(); m.close(); U.toast("已保存技术栈", "success"); pageAdminPositions();
      };
      cancel.onclick = m.close;
    }
  }

  /* ============================ 管理员：AI 出题 ============================ */
  async function pageAdminAI() {
    const byStage = Services.positionsByStage();
    const posOpts = byStage.map(s => { const seen = new Set(); const uniq = s.list.filter(p => { if (Services.isHiddenPosition(p)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; }); return `<optgroup label="${U.esc(s.stage)}">${uniq.map(p => `<option value="${p.id}">${U.esc(Services.posFullName(p))}</option>`).join("")}</optgroup>`; }).join("");
    const steps = ["粘贴JD", "AI解析", "配置参数", "生成中", "预览入库"];
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>AI 出题</span></div>
      <div class="steps" id="steps">${steps.map((s, i) => `<div class="step" data-i="${i}"><span class="dot">${i + 1}</span>${s}</div>`).join("")}</div>
      <div class="card" id="ai-main"></div>`);
    function setStep(i) {
      const steps = $$("#steps .step");
      const total = steps.length || 1;
      const prog = total > 1 ? (i / (total - 1)) * 100 : 0;
      const wrap = $("#steps");
      if (wrap) wrap.style.setProperty("--step-progress", prog + "%");
      steps.forEach(s => { const n = parseInt(s.dataset.i); s.classList.toggle("active", n === i); s.classList.toggle("done", n < i); });
    }
    const main = $("#ai-main");
    if (!API.getKey()) {
      main.innerHTML = `<div class="note ai">${U.icon("sparkles")} 尚未配置 DeepSeek Harness API Key。请先在系统设置填写后使用 AI 功能。</div>
        <a class="btn btn-primary" href="#/admin/settings">前往系统设置</a>`;
      return;
    }
    // Step 1
    setStep(0);
    main.innerHTML = `<h2>方式一：粘贴岗位 JD 生成</h2>
      <label class="field"><span>岗位名称</span><input id="jd-name" placeholder="如 Java后端工程师" /></label>
      <label class="field"><span>工作年限</span><select id="jd-year" class="full">${["校招/实习","0-1年","1-3年","3-5年","5年以上"].map(y => `<option>${y}</option>`).join("")}</select></label>
      <label class="field"><span>岗位 JD 原文</span><textarea id="jd-text" style="min-height:160px" placeholder="粘贴招聘 JD 全文…"></textarea></label>
      <div class="pill-row"><button class="btn btn-ai" id="jd-parse">${U.icon("sparkles")} 开始 AI 解析</button>
      <span style="align-self:center">— 或 —</span>
      <button class="btn" id="by-pos">${U.icon("briefcase")} 按已有岗位生成</button></div>`;
    $("#jd-parse").onclick = () => doParse($("#jd-name").value.trim(), $("#jd-year").value, $("#jd-text").value.trim());
    $("#by-pos").onclick = () => {
      main.innerHTML = `<h2>方式二：按岗位生成</h2><label class="field"><span>选择岗位</span><select id="sel-pos" class="full">${posOpts}</select></label>
        <label class="field"><span>工作年限</span><select id="sel-year" class="full">${["0-1年","1-3年","3-5年","5年以上"].map(y => `<option>${y}</option>`).join("")}</select></label>
        <label class="field"><span>生成数量</span><select id="sel-num" class="full"><option>5</option><option selected>10</option><option>20</option><option>30</option></select></label>
        <button class="btn btn-ai" id="gen-pos">${U.icon("sparkles")} 生成题目</button>`;
      $("#gen-pos").onclick = () => generateByPos(parseInt($("#sel-pos").value), $("#sel-year").value, parseInt($("#sel-num").value));
    };

    async function doParse(name, years, jd) {
      if (!jd) { U.toast("请粘贴岗位 JD", "warn"); return; }
      setStep(1);
      main.innerHTML = `<h2>AI 解析中…</h2><div class="ai-log" id="parse-log"></div><details class="ai-raw"><summary>查看流式原始输出</summary><div class="ai-stream" id="parse-out">调用 DeepSeek Harness 解析 JD…</div></details>`;
      const plog = makeLog($("#parse-log"));
      plog("info", "开始解析岗位 JD（工作年限：" + years + "）");
      try {
        const res = await API.analyzeJD(jd, years,
          (d, f) => { const o = $("#parse-out"); if (o) { o.textContent = f; o.scrollTop = o.scrollHeight; } },
          (ev, p) => aiEvent(plog, ev, p)
        );
        if (!res || res.raw) throw new Error("解析失败");
        setStep(2);
        plog("ok", "JD 解析完成，已提取技术栈与软技能标签");
        const tagsHtml = (arr, key) => (arr || []).map(t => `<span class="chip" data-k="${key}" data-v="${U.esc(t)}">${U.esc(t)}<span class="x">${U.icon("x")}</span></span>`).join("");
        main.innerHTML = `<h2>解析结果（可增删标签）</h2>
          <div class="field"><span>岗位名称</span><input id="p-name" value="${U.esc(res.positionName || name)}" /></div>
          <div class="field"><span>工作年限</span><input id="p-years" value="${U.esc(res.years || years)}" /></div>
          <div class="field"><span>必备技术栈</span><div class="tag-input" id="req-box">${tagsHtml(res.required, "req")}</div></div>
          <div class="field"><span>加分技术栈</span><div class="tag-input" id="bon-box">${tagsHtml(res.bonus, "bon")}</div></div>
          <div class="field"><span>软技能</span><div class="tag-input" id="soft-box">${tagsHtml(res.soft, "soft")}</div></div>
          <div class="field"><span>生成总数</span><select id="p-num" class="full"><option>5</option><option selected>10</option><option>20</option><option>30</option><option>自定义</option></select></div>
          <button class="btn btn-ai" id="gen">${U.icon("sparkles")} 立即生成</button>`;
        [["#req-box"], ["#bon-box"], ["#soft-box"]].forEach(([sel]) => {
          const box = $(sel); if (!box) return;
          box.addEventListener("click", e => { const x = e.target.closest(".x"); if (x) { const c = x.closest(".chip"); if (c) c.remove(); } });
        });
        $("#gen").onclick = () => {
          const pname = $("#p-name").value.trim();
          const matchedPos = Services.positions.find(p => p.name === pname);
          const spec = {
            positionName: pname, positionId: matchedPos ? matchedPos.id : null,
            years: $("#p-years").value.trim(),
            count: parseInt($("#p-num").value) || 10,
            techList: $$("#req-box .chip").map(c => c.dataset.v).concat($$("#bon-box .chip").map(c => c.dataset.v)),
            answer: true, followup: true
          };
          generate(spec, jd);
        };
      } catch (e) {
        plog("err", errMsg(e));
        $("#parse-out").innerHTML = `<span class="tag tag-danger">解析出错</span> ` + errMsg(e) + (e.code === "CORS" ? `<div class="note">当前 API 服务不允许浏览器跨域直接调用，纯静态项目无法绕过该限制，请确认接口支持 CORS 或使用本地代理。</div>` : "");
      }
    }

    async function generateByPos(posId, years, num) {
      const pos = Services.getPosition(posId);
      const skills = Services.skillsOf(posId);
      const techList = skills.map(s => ({ tech: s.techName, n: s.stars }));
      setStep(3);
      main.innerHTML = `<h2>生成中…</h2><div class="progress"><span id="pg" style="width:0%"></span></div><div class="progress-text" id="pg-t">准备中</div><div class="ai-log" id="gen-log"></div><details class="ai-raw"><summary>查看流式原始输出</summary><div class="ai-stream" id="gen-out"></div></details>`;
      try {
        await runGenerate({ positionName: Services.posFullName(pos), positionId: pos.id, years, count: num, techList, answer: true, followup: true }, null);
      } catch (e) { $("#gen-out").innerHTML = `<span class="tag tag-danger">出错</span> ` + errMsg(e); }
    }

    async function generate(spec, jd) {
      setStep(3);
      main.innerHTML = `<h2>生成中…</h2><div class="progress"><span id="pg" style="width:0%"></span></div><div class="progress-text" id="pg-t">准备中</div><div class="ai-log" id="gen-log"></div><details class="ai-raw"><summary>查看流式原始输出</summary><div class="ai-stream" id="gen-out"></div></details>`;
      try { await runGenerate(spec, jd); }
      catch (e) { $("#gen-out").innerHTML = `<span class="tag tag-danger">出错</span> ` + errMsg(e) + (e.code === "CORS" ? `<div class="note">跨域受限：请确认 DeepSeek Harness 接口支持 CORS，或使用本地代理。</div>` : ""); }
    }

    async function runGenerate(spec, jd) {
      const log = makeLog($("#gen-log"));
      log("info", "准备生成：岗位「" + (spec.positionName || "-") + "」，目标 " + (spec.count || 10) + " 题");
      const out = $("#gen-out");
      let qCount = 0, cancelled = false;
      // 取消按钮
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-sm btn-danger";
      cancelBtn.id = "gen-cancel";
      cancelBtn.textContent = U.icon("x") + " 取消生成";
      cancelBtn.style.cssText = "margin-top:8px";
      const toolbar = out ? out.previousElementSibling : null;
      if (toolbar && toolbar.classList.contains("ai-log-toolbar")) toolbar.appendChild(cancelBtn);
      // 已耗时计时器
      let t0 = Date.now(), elapsedTimer = null;
      const startElapsed = () => {
        elapsedTimer = setInterval(() => {
          if (cancelled) return;
          const el = Math.round((Date.now() - t0) / 1000);
          const pt = $("#pg-t"); if (pt) pt.textContent = "流式接收中 " + (out ? out.textContent.length : 0) + " 字符 · 已耗时 " + el + "s";
        }, 1000);
      };
      const stopElapsed = () => { if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; } };
      let ctrlRef = null;
      cancelBtn.onclick = () => {
        cancelled = true;
        if (ctrlRef) ctrlRef.abort();
        stopElapsed();
        log("warn", "用户取消了生成操作");
        U.toast("已取消生成", "warning");
        cancelBtn.disabled = true;
        cancelBtn.textContent = "已取消";
      };
      startElapsed();
      let res;
      try {
        res = await API.generate(Object.assign({ jd }, spec),
          (d, f) => {
            if (cancelled) return;
            if (out) { out.textContent = f; out.scrollTop = out.scrollHeight; }
            const pct = Math.min(95, Math.floor((f.length / Math.max(50, (spec.count || 10) * 120)) * 100));
            const pg = $("#pg"); if (pg) pg.style.width = pct + "%";
            const n = (f.match(/标题/g) || []).length;
            if (n !== qCount) { qCount = n; log("info", "已检测到 " + n + " 个题目…"); }
          },
          (ev, p) => { if (!cancelled) aiEvent(log, ev, p); },
          { onCtrl: c => { ctrlRef = c; } }
        );
      } catch (e) {
        stopElapsed();
        if (cancelBtn.parentNode) cancelBtn.remove();
        if (cancelled || (e && e.code === "CANCELLED")) {
          out.innerHTML = `<span class="tag tag-warning">生成已取消</span><div class="note">已接收部分内容，可复制后手动保存。</div><pre style="white-space:pre-wrap">${U.esc(out ? out.textContent : "")}</pre>`;
          return;
        }
        log("err", errMsg(e));
        out.innerHTML = `<span class="tag tag-danger">生成失败</span><div class="note">${U.esc(errMsg(e))}</div>`;
        return;
      }
      stopElapsed();
      if (cancelBtn.parentNode) cancelBtn.remove();
      const pg = $("#pg"); if (pg) pg.style.width = "100%";
      log("ok", "正在解析返回内容…");
      // 尽力提取成功（但可能不完整）
      if (res && res._extracted && Array.isArray(res.questions) && res.questions.length) {
        log("ok", "通过尽力提取恢复 " + res.questions.length + " 道题目（原始 JSON 可能被截断）");
        setStep(4);
        showResult(res, spec, log);
        return;
      }
      if (!res || res.raw || !Array.isArray(res.questions) || !res.questions.length) {
        log("warn", "AI 未返回有效题目，已展示原始内容");
        const dump = res && res.raw ? res.raw : (res ? JSON.stringify(res, null, 2) : "");
        const head = dump.slice(0, 500);
        const tail = dump.length > 500 ? " …（共 " + dump.length + " 字符，尾部省略）" : "";
        out.innerHTML = `<span class="tag tag-warning">AI 未返回有效题目</span>
          <div class="note">已展示原始内容（前500字符），您可复制后手动编辑保存为题目。如果内容被截断，可尝试减少题目数量后重新生成。</div>
          <details open><summary style="cursor:pointer;font-weight:600;margin-bottom:6px">查看原始输出 (${dump.length} 字符)</summary><pre style="white-space:pre-wrap;max-height:400px;overflow:auto">${U.esc(head)}${U.esc(tail)}</pre></details>`;
        return;
      }
      log("ok", "解析成功，共 " + ((res.questions || []).length) + " 道题目");
      setStep(4);
      showResult(res, spec, log);
    }

    function showResult(res, spec, log) {
      const questions = res.questions || [];
      const missing = res.missingCategories || [];
      const nameToCat = new Map(); Services.categories.forEach(c => nameToCat.set(c.name, c.id));
      const resolvePath = (path) => { if (!path || !path.length) return null; for (let i = path.length - 1; i >= 0; i--) if (nameToCat.has(path[i])) return nameToCat.get(path[i]); for (const n of path) if (nameToCat.has(n)) return nameToCat.get(n); return null; };
      // 初始化每行状态
      const rows = questions.map((q, i) => {
        const catId = resolvePath(q.categoryPath);
        return { q, catId, chosen: catId, selected: true, status: catId != null ? "matched" : "missing" };
      });
      const renderRows = () => {
        main.innerHTML = `<h2>生成结果（${rows.length} 题）</h2>
          <div class="pill-row" style="margin-bottom:10px">
            <button class="btn btn-sm" id="sel-all">全选</button>
            <button class="btn btn-sm" id="sel-inv">反选</button>
            <button class="btn btn-sm" id="sel-matched">仅已归类</button>
          </div>
          <div id="rows">${rows.map((r, i) => `<div class="card" style="margin-bottom:10px">
            <div class="row" style="justify-content:space-between">
              <label class="checkbox"><input type="checkbox" data-i="${i}" ${r.selected ? "checked" : ""}/> <b>${U.esc(r.q.title)}</b></label>
              <span class="tag ${r.status === "matched" ? "tag-success" : "tag-warning"}">${r.status === "matched" ? "已归类" : "待分类"}</span>
            </div>
            <div class="muted" style="font-size:12px">难度 ${U.esc(r.q.difficulty || "-")} · 题型 ${U.esc(r.q.type || "-")} · ${U.esc((r.q.tags || []).join(","))}</div>
            <details style="margin-top:6px"><summary style="cursor:pointer">查看内容</summary><div class="qd-body md" style="margin-top:8px">${U.md((r.q.body || "") + "\n\n**答案**\n" + (r.q.answer || ""))}</div></details>
            ${r.status === "missing" ? `<div class="note">系统未发现匹配分类，请手动选择：<select class="sel-cat" data-i="${i}">${catOptions()}</select></div>` : ""}
          </div>`).join("")}</div>
          ${missing.length ? `<div class="note ai"><b>发现缺失技术分类建议：</b>${missing.map(m => `<div>· ${U.esc(m.name)}（父：${U.esc(m.parentPath || "-")}）— ${U.esc(m.reason || "")} <button class="btn btn-sm" data-miss="${U.esc(m.name)}">一键新增</button></div>`).join("")}</div>` : ""}
          <div class="pill-row" style="margin-top:14px"><button class="btn btn-success btn-lg" id="batch">${U.icon("check")} 批量入库选中题目</button></div>`;
        U.highlightAll(main);
        $$("#rows input[type=checkbox]").forEach(c => c.onchange = () => { rows[parseInt(c.dataset.i)].selected = c.checked; });
        $$(".sel-cat").forEach(s => s.onchange = () => { const i = parseInt(s.dataset.i); rows[i].chosen = s.value ? parseInt(s.value) : null; rows[i].status = s.value ? "matched" : "missing"; });
        $$("[data-miss]").forEach(b => b.onclick = async () => { await Services.addCategory(0, { name: b.dataset.miss, icon: "🆕" }); await Services.reload(); U.toast("已新增分类", "success"); showResult(res, spec, log); });
        $("#sel-all").onclick = () => { rows.forEach(r => r.selected = true); renderRows(); };
        $("#sel-inv").onclick = () => { rows.forEach(r => r.selected = !r.selected); renderRows(); };
        $("#sel-matched").onclick = () => { rows.forEach(r => r.selected = r.status === "matched"); renderRows(); };
        $("#batch").onclick = async () => {
          const sel = rows.filter(r => r.selected);
          const dups = findTitleDups(sel.map(r => r.q.title), null);
          if (dups.length && !(await confirmTitleDups(dups, "仍要全部入库"))) { if (log) log("warn", "已取消入库：存在 " + dups.length + " 个疑似重复标题"); return; }
          let okN = 0;
          const total = sel.length;
          if (log) log("info", "开始批量入库，共选中 " + total + " 题");
          for (const r of rows) {
            if (!r.selected) continue;
            const q = r.q;
            const posNames = spec.positionName ? [spec.positionName] : (res.positionName ? [res.positionName] : (q.tags || []).slice(0, 3));
            const posIds = spec.positionId ? [spec.positionId] : [];
            await Services.addQuestion({
              categoryId: r.chosen, title: q.title, body: q.body, answer: q.answer,
              difficulty: ["初级", "中级", "高级", "专家"].indexOf(q.difficulty) >= 0 ? q.difficulty : "中级",
              type: q.type || "简答题", positionNames: posNames, positionIds: posIds,
              years: q.years || (spec && spec.years) || "", tags: q.tags || [], source: "ai", aiScore: 85, status: "published"
            });
            okN++;
            if (log && (okN % 5 === 0 || okN === total)) log("ok", "已入库 " + okN + " / " + total + " 题");
          }
          await Services.reload();
          await Services.logAI({ positionName: res.positionName, genCount: okN, techStack: (res.techStack || []).join(",") });
          if (log) log("ok", "全部完成，成功入库 " + okN + " 道题目");
          U.toast(`成功入库 ${okN} 道题目`, "success");
          App.go("/admin/questions");
        };
      };
      const catOptions = () => `<option value="">（待分类）</option>` + Services.childrenOf(0).map(c => `<option value="${c.id}">${U.esc(c.name)}</option>`).join("");
      renderRows();
    }
  }

  /* ============================ 管理员：批量导入 ============================ */
  async function pageAdminImport() {
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>批量导入</span></div>
      <h1>批量导入题目</h1>
      <div class="card"><div class="section-head" style="margin:0 0 10px"><h2 style="font-size:16px">步骤一：下载模板</h2></div>
        <p class="secondary">支持 Excel(xlsx)、CSV、JSON、Markdown 导入。先下载标准模板填写。</p>
        <div class="pill-row">
          <button class="btn" id="dl-xlsx">${U.icon("download")} 下载Excel模板</button>
          <button class="btn" id="dl-md">${U.icon("download")} 下载Markdown示例</button>
        </div></div>
      <div class="card" style="margin-top:16px"><div class="section-head" style="margin:0 0 10px"><h2 style="font-size:16px">步骤二：上传文件</h2></div>
        <div class="dropzone" id="dz">${U.icon("upload")}<div style="margin-top:8px">点击或拖拽文件到此处（xlsx / csv / json / md）</div><input type="file" id="file" accept=".xlsx,.xls,.csv,.json,.md,.txt" style="display:none" /></div>
        <div id="map-area"></div>
      </div>`);
    $("#dl-xlsx").onclick = downloadTemplateXlsx;
    $("#dl-md").onclick = () => U.download("题目导入示例.md", sampleMd(), "text/markdown");
    const dz = $("#dz"), fileInput = $("#file");
    dz.onclick = () => fileInput.click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add("drag"); };
    dz.ondragleave = () => dz.classList.remove("drag");
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove("drag"); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
    fileInput.onchange = () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); };

    async function handleFile(file) {
      try {
        const parsed = await IE.parseFile(file);
        let rows = [], headers = [];
        if (parsed.kind === "excel" || parsed.kind === "csv") { rows = parsed.rows; headers = parsed.headers; }
        else if (parsed.kind === "json") {
          const j = parsed.raw; const arr = Array.isArray(j) ? j : (j.questions || []);
          // 把对象数组转成带表头行
          const map = { title: "题目标题", body: "题目内容", answer: "参考答案", c1: "一级技术分类", c2: "二级技术分类", c3: "三级技术分类", difficulty: "难度", type: "题型", positions: "适用岗位", years: "工作年限", tags: "技术标签", status: "状态", remark: "管理员备注" };
          rows = arr.map(o => { const r = {}; for (const k in map) r[map[k]] = Array.isArray(o[k]) ? o[k].join(",") : (o[k] != null ? o[k] : ""); if (o.categoryPath) { r["一级技术分类"] = o.categoryPath[0] || ""; r["二级技术分类"] = o.categoryPath[1] || ""; r["三级技术分类"] = o.categoryPath[2] || ""; } return r; });
          headers = Object.values(map);
        } else if (parsed.kind === "md") { rows = parseMd(parsed.raw); headers = ["题目标题", "题目内容", "参考答案", "难度", "题型", "适用岗位", "技术标签"]; }
        if (!rows.length) { U.toast("未解析到任何数据行", "warn"); return; }
        const map = IE.autoMap(headers);
        showMapping(rows, map);
      } catch (e) { U.toast("解析失败：" + e.message, "error"); }
    }

    function showMapping(rows, map) {
      const fields = ["title", "body", "answer", "c1", "c2", "c3", "difficulty", "type", "positions", "years", "tags", "status", "remark"];
      const labels = { title: "题目标题", body: "题目内容", answer: "参考答案", c1: "一级分类", c2: "二级分类", c3: "三级分类", difficulty: "难度", type: "题型", positions: "适用岗位", years: "工作年限", tags: "技术标签", status: "状态", remark: "备注" };
      const sel = (f) => `<select class="sel-f" data-f="${f}"><option value="">（不映射）</option>${headers.map(h => `<option ${map[f] === h ? "selected" : ""}>${U.esc(h)}</option>`).join("")}</select>`;
      const preview = rows.slice(0, 10).map((r, i) => `<tr>${fields.map(f => `<td>${U.esc(String(r[map[f] || ""] || "").slice(0, 40))}</td>`).join("")}</tr>`).join("");
      const valid = rows.filter(r => IE.buildRecord(r, map).ok).length;
      const invalid = rows.length - valid;
      $("#map-area").innerHTML = `<div class="card" style="margin-top:16px"><div class="section-head" style="margin:0 0 8px"><h2 style="font-size:16px">步骤三：字段映射与预览</h2></div>
        <div class="note">有效数据 ${valid} 条 · 格式错误 ${invalid} 条</div>
        <table class="data"><thead><tr>${fields.map(f => `<th>${labels[f]}<br/>${sel(f)}</th>`).join("")}</tr></thead><tbody>${preview}</tbody></table>
        <div class="field" style="margin-top:12px"><span>重复题处理</span><select id="dup" class="full"><option value="skip">跳过重复题</option><option value="overwrite">覆盖已有</option><option value="new">导入为新题</option></select></div>
        <label class="field"><span>默认技术分类（题目未填分类时使用）</span><select id="def-cat" class="full"><option value="">未分类</option>${Services.childrenOf(0).map(c => `<option value="${c.id}">${U.esc(c.name)}</option>`).join("")}</select></label>
        <button class="btn btn-primary btn-lg" id="do-import">${U.icon("upload")} 执行导入（${rows.length} 行）</button>
        <div id="import-result"></div></div>`;
      $$(".sel-f").forEach(s => s.onchange = () => { const f = s.dataset.f; if (s.value) map[f] = s.value; else delete map[f]; });
      $("#do-import").onclick = async () => {
        const btn = $("#do-import"); btn.disabled = true; btn.textContent = "导入中…";
        const res = await IE.importRows(rows, map, { dup: $("#dup").value });
        await Services.logImport({ fileName: "import", total: rows.length, success: res.success, fail: res.fail });
        let html = `<div class="note ${res.fail ? "tag-warning" : "tag-success"}" style="margin-top:12px">成功 ${res.success} · 跳过 ${res.skip} · 失败 ${res.fail}</div>`;
        if (res.errors.length) html += `<details><summary>错误明细（${res.errors.length}）</summary><div class="note">${res.errors.map(e => U.esc(e)).join("<br/>")}</div></details>`;
        if (res.fail) html += `<button class="btn btn-sm" id="dl-fail">下载失败数据</button>`;
        $("#import-result").innerHTML = html;
        U.toast(`导入完成：成功 ${res.success}`, "success");
        renderSidebar(parseHash());
        if (res.fail) { const fails = rows.filter((r, i) => !IE.buildRecord(r, map).ok); $("#dl-fail").onclick = () => U.download("导入失败数据.json", JSON.stringify(fails, null, 2), "application/json"); }
      };
    }
  }
  async function downloadTemplateXlsx() {
    await U.loadScript("XLSX", U.XLSX_URL).catch(() => {});   /* xlsx 大库按需加载 */
    const headers = ["题目标题", "题目内容", "参考答案", "一级技术分类", "二级技术分类", "三级技术分类", "难度", "题型", "适用岗位", "工作年限", "技术标签", "状态", "管理员备注"];
    const ws = XLSX.utils.aoa_to_sheet([headers, ["示例：什么是索引", "请解释数据库索引的作用", "索引用于加速查询…", "数据库与数据存储", "关系型数据库", "MySQL", "初级", "简答题", "Java后端工程师", "0-1年", "MySQL,索引", "published", ""]]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "题目");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    U.download("it-interview-import-template.xlsx", new Blob([out]), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  function sampleMd() {
    return `# 题目导入示例（Markdown）

## 什么是 Redis 缓存穿透？
标签: Redis,缓存
难度: 中级
题型: 简答题

缓存穿透是指查询不存在的数据…

**答案**
使用布隆过滤器或缓存空值…

## 简述 TCP 三次握手
标签: TCP,网络
难度: 中级
题型: 简答题

**答案**
第一次…`;
  }
  function parseMd(text) {
    const blocks = text.split(/^##\s+/m).slice(1);
    return blocks.map(b => {
      const lines = b.split("\n"); const title = lines.shift().trim();
      let body = [], answer = [], tags = [], diff = "中级", type = "简答题";
      let inAns = false;
      for (const ln of lines) {
        if (/^标签\s*[:：]/.test(ln)) tags = ln.split(/[:：]/)[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
        else if (/^难度\s*[:：]/.test(ln)) diff = ln.split(/[:：]/)[1].trim();
        else if (/^题型\s*[:：]/.test(ln)) type = ln.split(/[:：]/)[1].trim();
        else if (/^\*\*?答案\*?/.test(ln)) { inAns = true; const t = ln.replace(/^\*\*?答案\*?\s*[:：]?/, "").trim(); if (t) answer.push(t); }
        else if (inAns) answer.push(ln);
        else body.push(ln);
      }
      return { "题目标题": title, "题目内容": body.join("\n").trim(), "参考答案": answer.join("\n").trim(), "难度": diff, "题型": type, "适用岗位": "", "技术标签": tags.join(","), "工作年限": "", "状态": "published", "管理员备注": "" };
    }).filter(r => r["题目标题"]);
  }

  /* ============================ 管理员：备份恢复 ============================ */
  async function pageAdminBackup() {
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>备份恢复</span></div>
      <h1>备份与恢复</h1>
      <div class="grid grid-cols-2">
        <div class="card"><h2 style="font-size:16px">导出备份</h2>
          <p class="secondary">导出全部数据（不含 API Key）为 JSON，便于迁移与恢复；也可导出 Excel / Markdown 便于查看编辑。</p>
          <div class="pill-row">
            <button class="btn btn-primary" id="bk-json">${U.icon("download")} 全量备份(JSON)</button>
            <button class="btn" id="bk-xlsx">${U.icon("download")} 导出Excel</button>
            <button class="btn" id="bk-md">${U.icon("download")} 导出Markdown</button>
          </div></div>
        <div class="card"><h2 style="font-size:16px">恢复备份</h2>
          <p class="secondary">上传此前导出的 JSON 备份文件，支持合并导入或全量覆盖。</p>
          <div class="dropzone" id="rz-dz">${U.icon("upload")}<div style="margin-top:8px">点击或拖拽备份 JSON 到此处</div><input type="file" id="rz-file" accept=".json" style="display:none" /></div>
          <div id="rz-area"></div></div>
      </div>`);
    $("#bk-json").onclick = async () => { const n = await IE.exportBackup(); U.toast("已备份：" + n, "success"); };
    $("#bk-xlsx").onclick = () => IE.exportExcel();
    $("#bk-md").onclick = () => IE.exportMarkdown();
    const dz = $("#rz-dz"), fi = $("#rz-file");
    dz.onclick = () => fi.click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add("drag"); };
    dz.ondragleave = () => dz.classList.remove("drag");
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove("drag"); if (e.dataTransfer.files[0]) handleRestore(e.dataTransfer.files[0]); };
    fi.onchange = () => { if (fi.files[0]) handleRestore(fi.files[0]); };
    async function handleRestore(file) {
      let payload;
      try { payload = await IE.parseBackup(file); } catch (e) { U.toast(e.message, "error"); return; }
      const info = `备份时间：${U.fmtDate(payload.exportedAt)} · 分类 ${payload.categories ? payload.categories.length : 0} · 岗位 ${payload.positions ? payload.positions.length : 0} · 题目 ${payload.questions ? payload.questions.length : 0}`;
      $("#rz-area").innerHTML = `<div class="card" style="margin-top:12px"><div class="note">${U.esc(info)}</div>
        <label class="field"><span>恢复方式</span><select id="rz-mode" class="full"><option value="merge">合并导入（保留现有，追加备份）</option><option value="overwrite">全量覆盖（清除现有再导入）</option></select></label>
        <button class="btn btn-primary" id="rz-do">${U.icon("database")} 执行恢复</button></div>`;
      $("#rz-do").onclick = async () => {
        const mode = $("#rz-mode").value;
        if (mode === "overwrite") {
          const ok = await U.confirm("全量覆盖将清除当前所有数据！系统会先导出一份临时备份供您保存。确认继续？", { danger: true, okText: "确认覆盖", note: "此操作不可逆，建议先手动下载上面的全量备份。" });
          if (!ok) return;
          try { await IE.exportBackup(); } catch (e) {}
        }
        const btn = $("#rz-do"); btn.disabled = true; btn.textContent = "恢复中…";
        try { await IE.restore(payload, mode); U.toast("恢复完成", "success"); renderSidebar(parseHash()); App.go("/admin/dashboard"); }
        catch (e) { U.toast("恢复失败：" + e.message, "error"); btn.disabled = false; btn.textContent = "执行恢复"; }
      };
    }
  }

  /* ============================ 管理员：系统设置 ============================ */
  async function pageAdminSettings() {
    const cfg = API.getConfig();
    const theme = App.getTheme();
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>管理</span><span class="sep">/</span><span>系统设置</span></div>
      <h1>系统设置</h1>
      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">外观主题</h2>
        <div class="seg" id="theme-seg">
          <button data-t="light" class="${theme === "light" ? "active" : ""}">${U.icon("sun")} 亮色</button>
          <button data-t="dark" class="${theme === "dark" ? "active" : ""}">${U.icon("moon")} 暗色</button>
          <button data-t="system" class="${theme === "system" ? "active" : ""}">${U.icon("monitor")} 跟随系统</button>
        </div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("sparkles")} AI 设置（DeepSeek Harness）</h2>
        <div class="note ai">请使用个人或权限受控的 API Key。本系统为纯静态网页，API Key 保存在您的浏览器本地（sessionStorage 或 localStorage），请勿在公共设备上使用。若接口不支持 CORS，纯静态项目无法绕过，请确认接口支持跨域或使用本地代理。</div>
        <label class="field"><span>API Key</span>
          <div class="input-with-action"><input type="password" id="ai-key" value="${API.getKey() ? "************" : ""}" placeholder="粘贴 DeepSeek Harness API Key" />
          <button class="icon-btn trail" id="ai-show">${U.icon("eye")}</button></div></label>
        <label class="field"><span>接口地址 BaseURL</span><input id="ai-base" value="${U.esc(cfg.base)}" /></label>
        <label class="field"><span>模型名称</span><input id="ai-model" value="${U.esc(cfg.model)}" /></label>
        <div class="grid grid-cols-3">
          <label class="field"><span>超时(秒)</span><input id="ai-timeout" type="number" value="${cfg.timeout}" /></label>
          <label class="field"><span>温度</span><input id="ai-temp" type="number" step="0.1" value="${cfg.temp}" /></label>
          <label class="field"><span>单次最大题数</span><input id="ai-max" type="number" value="${cfg.max}" /></label>
        </div>
        <label class="field"><span>API Key 存储方式</span><select id="ai-store" class="full"><option value="local" ${cfg.store === "local" ? "selected" : ""}>本机长期保存(localStorage)</option><option value="session" ${cfg.store === "session" ? "selected" : ""}>仅本次会话(sessionStorage)</option></select></label>
        <div class="pill-row">
          <button class="btn btn-primary" id="ai-save">${U.icon("check")} 保存配置</button>
          <button class="btn" id="ai-test">${U.icon("play")} 测试连接</button>
          <button class="btn btn-danger" id="ai-clear">${U.icon("trash")} 清除 Key</button>
        </div>
        <div id="ai-test-out" class="muted" style="margin-top:8px"></div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("barChart")} 百度统计</h2>
        <p class="secondary">配置百度统计 Tracking ID 后，网站自动上报页面浏览与题目浏览数据。详细的地域分布、来源分析、趋势报表请在 <a href="https://tongji.baidu.com" target="_blank" rel="noopener">tongji.baidu.com</a> 查看。</p>
        <label class="field"><span>Tracking ID</span><input id="baidu-tid" value="${U.esc(Stats.baiduId())}" placeholder="格式如 a1b2c3d4e5f6g7h8（百度统计后台获取）" /></label>
        <div class="pill-row">
          <button class="btn btn-primary" id="baidu-save">${U.icon("check")} 保存并生效</button>
        </div>
        <div id="baidu-out" class="muted" style="margin-top:8px"></div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("upload")} 云端共享题库（发布）</h2>
        <p class="secondary">所有访客共享同一份题库：配置发布 Token 后，点「发布题库」将当前本机题库推送到 GitHub，约 1-2 分钟后所有访客自动看到最新版。仅持有仓库写权限的 Token 才能发布，访客为只读。</p>
        <div class="note ai">Token 请使用 GitHub Fine-grained Token，仅授权本仓库的 Contents 读写权限，保存在当前浏览器本地，请勿在公共设备使用。创建步骤见仓库 README 或询问管理员。</div>
        <label class="field"><span>发布 Token（GitHub Fine-grained PAT）</span>
          <div class="input-with-action"><input type="password" id="pub-token" value="${Cloud.token() ? "************" : ""}" placeholder="github_pat_ 开头，仅授权本仓库 Contents 读写" />
          <button class="icon-btn trail" id="pub-show">${U.icon("eye")}</button></div></label>
        <div class="grid grid-cols-2">
          <label class="field"><span>仓库（owner/repo）</span><input id="pub-repo" value="${U.esc(Cloud.repo())}" /></label>
          <label class="field"><span>分支</span><input id="pub-branch" value="${U.esc(Cloud.branch())}" /></label>
        </div>
        <div class="pill-row">
          <button class="btn btn-primary" id="pub-save">${U.icon("check")} 保存配置</button>
          <button class="btn" id="pub-publish">${U.icon("upload")} 发布题库到线上</button>
          <button class="btn" id="pub-sync">${U.icon("refresh")} 从云端拉取到本机</button>
        </div>
        <div id="pub-out" class="muted" style="margin-top:8px"></div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("refresh")} 自动发布</h2>
        <p class="secondary">开启后，题目/分类/岗位的任何增删改（含 AI 出题、批量导入）在停止操作 10 秒后自动推送到 GitHub，无需手动点「发布」。关闭或刷新页面前请留意顶栏状态徽章，确保显示「已同步云端」再离开。</p>
        <div class="pill-row">
          <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="auto-pub-toggle" ${Cloud.autoEnabled() ? "checked" : ""} style="width:16px;height:16px" />
            <span>改动后自动发布到云端</span>
          </label>
        </div>
        <div id="auto-pub-out" class="muted" style="margin-top:8px">${Cloud.isEditor() ? "" : "提示：需先在上方配置发布 Token 后生效。"}</div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("fileText")} 题目图片外置</h2>
        <p class="secondary">把题目里内嵌的 base64 图片（data URL）迁移为仓库独立文件 <code>assets/q/</code>，Markdown 改为 URL 引用：显著减小 data/published.json 体积，图片可被浏览器缓存。新粘贴的图片在配置发布 Token 后会自动外置，此工具用于迁移<strong>历史存量</strong>图片。迁移可重复执行，已迁移的自动跳过。</p>
        <div class="pill-row">
          <button class="btn" id="img-scan">${U.icon("search")} 扫描内嵌图片</button>
          <button class="btn btn-primary" id="img-migrate" style="display:none">${U.icon("upload")} 一键迁移</button>
        </div>
        <div id="img-out" class="muted" style="margin-top:8px">${Cloud.isEditor() ? "" : "提示：迁移需先在上方配置发布 Token。"}</div></div>

      <div class="card" style="margin-bottom:16px"><h2 style="font-size:16px">${U.icon("shield")} 本地数据加密云备份 <span id="bk-chip" class="vis-chip bk ok" style="display:none"></span></h2>
        <p class="secondary">把只存在本机、清缓存即丢的数据——发布 Token、AI 配置与 Key、管理员密码、统计配置、收藏、浏览历史——用密码加密后备份到仓库 <code>data/local-backup.json</code>。仓库是公开的，但文件为 AES-256-GCM 密文，无密码无法解密。清缓存/换设备后，凭<strong>备份密码</strong>即可一键恢复全部配置。<strong>设好密码后完全自动</strong>：题目改动、设置修改、收藏/历史更新都会在 12 秒后自动加密备份，无需手动。顶栏/标题处的徽章显示备份状态。</p>
        <div class="note ai"><strong>请牢记备份密码</strong>：密码只存在本机，不随备份上传（密文由它解开）。忘记密码 = 备份无法恢复。建议同时把密码记到密码管理器。</div>
        <label class="field"><span>备份密码（至少 6 位）</span>
          <div class="input-with-action"><input type="password" id="bk-pass" value="${Backup.hasPassphrase() ? "************" : ""}" placeholder="用于加密本地数据备份" />
          <button class="icon-btn trail" id="bk-show">${U.icon("eye")}</button></div></label>
        <div class="pill-row">
          <button class="btn btn-primary" id="bk-save">${U.icon("check")} 保存备份密码</button>
          <button class="btn" id="bk-now">${U.icon("upload")} 立即备份到云端</button>
          <button class="btn" id="bk-restore">${U.icon("refresh")} 从云端恢复到本机</button>
        </div>
        <div id="bk-out" class="muted" style="margin-top:8px"></div></div>

      <div class="card"><h2 style="font-size:16px">${U.icon("shield")} Cloudflare Worker（可选·高级）</h2>
        <p class="secondary">可选：配置 Worker 后端后，仪表盘可显示云端访客地域分布。顶栏人数为本地计数，不依赖此接口。Worker 代码见仓库 cloudflare/ 目录。</p>
        <label class="field"><span>Worker 接口地址</span><input id="stats-api" value="${U.esc(Stats.cfApi())}" placeholder="https://your-worker.xxx.workers.dev" /></label>
        <label class="field"><span>访问密钥(可选)</span><input id="stats-key" value="${U.esc((typeof localStorage !== "undefined" && localStorage.getItem("stats_key")) || "")}" placeholder="与 Worker 的 STATS_KEY 一致" /></label>
        <div class="pill-row">
          <button class="btn" id="stats-save">${U.icon("check")} 保存</button>
          <button class="btn" id="stats-test">${U.icon("play")} 测试连接</button>
        </div>
        <div id="stats-out" class="muted" style="margin-top:8px"></div></div>

      <div class="card"><h2 style="font-size:16px">数据管理</h2>
        <p class="secondary">首次初始化已写入示例数据。可追加恢复初始示例题目（不会覆盖现有数据）。</p>
        <button class="btn" id="restore-seed">${U.icon("refresh")} 恢复初始示例数据（追加）</button>
        <span class="muted" style="margin-left:10px">题目总数：${Services.questions.length}</span></div>`);
    $$("#theme-seg button").forEach(b => b.onclick = () => { App.setTheme(b.dataset.t); $$("#theme-seg button").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
    const keyInput = $("#ai-key"); let keyTouched = false;
    keyInput.addEventListener("input", () => keyTouched = true);
    $("#ai-show").onclick = () => { keyInput.type = keyInput.type === "password" ? "text" : "password"; };
    $("#ai-save").onclick = () => {
      API.saveConfig({ base: $("#ai-base").value.trim() || API.defaults.base, model: $("#ai-model").value.trim() || API.defaults.model, timeout: parseInt($("#ai-timeout").value) || 60, temp: parseFloat($("#ai-temp").value) || 0.7, max: parseInt($("#ai-max").value) || 20, store: $("#ai-store").value });
      if (keyTouched && keyInput.value && keyInput.value !== "************") API.setKey(keyInput.value.trim());
      else if (!keyTouched && API.getKey()) { API.setKey(API.getKey()); }
      U.toast("AI 配置已保存", "success");
    };
    $("#ai-clear").onclick = async () => { if (await U.confirm("清除当前 API Key？", { danger: true })) { API.clearKey(); keyInput.value = ""; U.toast("已清除", "success"); } };
    $("#ai-test").onclick = async () => {
      const out = $("#ai-test-out"); out.textContent = "测试中…";
      if (keyTouched && keyInput.value && keyInput.value !== "************") API.setKey(keyInput.value.trim());
      if (!API.getKey()) { out.innerHTML = `<span class="tag tag-warning">未填写 API Key</span>`; return; }
      const t0 = Date.now();
      try { const r = await API.testConnection(); out.innerHTML = `<span class="tag tag-success">连接成功</span> 响应 ${Date.now() - t0}ms`; }
      catch (e) { out.innerHTML = `<span class="tag tag-danger">失败</span> ` + errMsg(e) + (e.code === "CORS" ? `<div class="note">接口未开启 CORS 跨域，纯静态无法绕过，请用支持 CORS 的接口或本地代理。</div>` : ""); }
    };
    $("#baidu-save").onclick = () => { if (typeof localStorage !== "undefined") { localStorage.setItem("baidu_tid", $("#baidu-tid").value.trim()); } U.toast("百度统计已保存，刷新页面后生效", "success"); };
    /* 云端共享题库 */
    const pubTokenInput = $("#pub-token"); let pubTokenTouched = false;
    pubTokenInput.addEventListener("input", () => pubTokenTouched = true);
    $("#pub-show").onclick = () => { pubTokenInput.type = pubTokenInput.type === "password" ? "text" : "password"; };
    $("#pub-save").onclick = () => {
      const tok = pubTokenTouched && pubTokenInput.value && pubTokenInput.value !== "************" ? pubTokenInput.value.trim() : Cloud.token();
      Cloud.saveConfig(tok, $("#pub-repo").value.trim(), $("#pub-branch").value.trim());
      U.toast("发布配置已保存", "success");
    };
    $("#pub-publish").onclick = async () => {
      const out = $("#pub-out");
      if (!Cloud.token()) { out.innerHTML = '<span class="tag tag-warning">请先填写并保存发布 Token</span>'; return; }
      if (!(await U.confirm("将当前本机题库发布到线上？发布后约 1-2 分钟所有访客可见（以本机数据为准覆盖云端）。", { okText: "发布" }))) return;
      out.textContent = "正在导出并提交到 GitHub…";
      try {
        const r = await Cloud.publish();
        out.innerHTML = `<span class="tag tag-success">发布成功</span> ${r.count} 题 / ${r.positions} 岗位已上线，约 1-2 分钟后对所有访客生效`;
        U.toast("题库已发布", "success");
      } catch (e) {
        out.innerHTML = `<span class="tag tag-danger">发布失败</span> ` + U.esc(String(e && e.message || e)) +
          `<div class="note">请确认 Token 有效（Fine-grained，勾选本仓库 Contents: Read and write）、仓库名与分支正确。</div>`;
      }
    };
    $("#pub-sync").onclick = async () => {
      const out = $("#pub-out");
      if (!(await U.confirm("用云端题库覆盖本机题库？本机的题目改动将丢失（收藏与浏览历史保留）。", { danger: true, okText: "覆盖同步" }))) return;
      out.textContent = "正在拉取云端题库…";
      try {
        const d = await Cloud.syncNow();
        await Services.reload();
        renderSidebar(parseHash());
        out.innerHTML = `<span class="tag tag-success">同步成功</span> 云端版本（${(d.questions || []).length} 题）已覆盖本机`;
        U.toast("已从云端同步题库", "success");
      } catch (e) {
        out.innerHTML = `<span class="tag tag-danger">同步失败</span> ` + U.esc(String(e && e.message || e));
      }
    };
    $("#stats-save").onclick = () => { if (typeof localStorage !== "undefined") { localStorage.setItem("stats_api", $("#stats-api").value.trim()); localStorage.setItem("stats_key", $("#stats-key").value.trim()); } U.toast("Worker 接口已保存", "success"); renderTopbar(); };
    /* 自动发布开关 */
    $("#auto-pub-toggle").onchange = function () {
      Cloud.setAutoEnabled(this.checked);
      $("#auto-pub-out").textContent = this.checked ? "已开启：改动停止 10 秒后自动发布。" : "已关闭：请手动点「发布题库到线上」。";
      U.toast(this.checked ? "自动发布已开启" : "自动发布已关闭", "success");
      Cloud._renderChip();
    };
    /* ---------- 题目图片外置：扫描 + 迁移 ---------- */
    const IMG_INLINE_RE = /!\[[^\]]*\]\(data:image\/([a-zA-Z+.-]+);base64,([A-Za-z0-9+/=]+)\)/g;
    const scanInlineImages = () => {
      const found = [];
      Services.questions.forEach(q => {
        ["body", "answer"].forEach(k => {
          const text = q[k] || "";
          IMG_INLINE_RE.lastIndex = 0;
          let m;
          while ((m = IMG_INLINE_RE.exec(text))) {
            found.push({ q, field: k, full: m[0], mime: m[1], b64: m[2], size: Math.round(m[2].length * 0.75) });
          }
        });
      });
      return found;
    };
    $("#img-scan").onclick = () => {
      const out = $("#img-out"), btn = $("#img-migrate");
      if (!Cloud.isEditor()) { out.innerHTML = "<span class='tag tag-warning'>尚未配置发布 Token</span> 请先在上方「云端共享题库」配置 Token 再扫描迁移。"; return; }
      const list = scanInlineImages();
      if (!list.length) {
        out.innerHTML = "<span class='tag tag-success'>未发现内嵌 base64 图片</span> 题库很干净。";
        btn.style.display = "none"; return;
      }
      const total = list.reduce((s, x) => s + x.size, 0);
      out.innerHTML = "发现 <b>" + list.length + "</b> 张内嵌图片（约 " + U.fmtSize(total) + "），将逐张上传到 <code>assets/q/</code> 并替换为 URL 引用。";
      btn.style.display = "";
    };
    $("#img-migrate").onclick = async () => {
      const out = $("#img-out"), btn = $("#img-migrate");
      if (!Cloud.isEditor()) { U.toast("请先配置发布 Token", "warn"); return; }
      if (!(await U.confirm("确认迁移内嵌图片？将逐张上传到仓库 assets/q/ 并更新对应题目，完成后自动发布。", { okText: "开始迁移" }))) return;
      const list = scanInlineImages();
      if (!list.length) { out.textContent = "没有需要迁移的图片。"; btn.style.display = "none"; return; }
      btn.disabled = true;
      let done = 0;
      for (const item of list) {
        out.textContent = "迁移中… " + (done + 1) + "/" + list.length;
        try {
          const url = await uploadImageAsset("data:image/" + item.mime + ";base64," + item.b64, item.q.id);
          const patch = {};
          patch[item.field] = (item.q[item.field] || "").split(item.full).join("![图片](" + url + ")");
          await Services.updateQuestion(item.q.id, patch);
          done++;
        } catch (e) {
          console.warn("图片迁移失败", e);
          out.innerHTML = "<span class='tag tag-danger'>迁移中断</span> 第 " + (done + 1) + " 张失败：" + U.esc(String(e && e.message || e)) +
            "。已完成 " + done + " 张；稍后可重试，已迁移的会自动跳过。";
          btn.disabled = false;
          return;
        }
      }
      btn.disabled = false;
      const pubTip = Cloud.autoEnabled() ? "稍后自动发布生效" : "请手动点「发布题库到线上」生效";
      out.innerHTML = "<span class='tag tag-success'>迁移完成</span> 共 " + done + " 张图片外置到 assets/q/，" + pubTip + "。";
      U.toast("图片外置迁移完成：" + done + " 张", "success");
    };
    /* 本地数据加密备份 */
    const bkPassInput = $("#bk-pass"); let bkPassTouched = false;
    bkPassInput.addEventListener("input", () => bkPassTouched = true);
    $("#bk-show").onclick = () => { bkPassInput.type = bkPassInput.type === "password" ? "text" : "password"; };
    $("#bk-save").onclick = () => {
      const v = bkPassTouched && bkPassInput.value && bkPassInput.value !== "************" ? bkPassInput.value : (Backup.hasPassphrase() ? Backup.getPassphrase() : "");
      if (v && v.length < 6) { U.toast("备份密码至少 6 位", "error"); return; }
      const firstSet = v && !Backup.hasPassphrase();
      Backup.setPassphrase(v);
      U.toast(v ? "备份密码已保存：本机数据改动将自动加密备份到云端" : "已清除备份密码", "success");
      if (firstSet && Cloud.isEditor()) Backup.scheduleBackup();   // 首次设密码立即备一份当前状态
    };
    $("#bk-now").onclick = async () => {
      const out = $("#bk-out");
      if (!Cloud.token()) { out.innerHTML = '<span class="tag tag-warning">请先在上方配置发布 Token</span>'; return; }
      if (!Backup.hasPassphrase()) { out.innerHTML = '<span class="tag tag-warning">请先填写并保存备份密码</span>'; return; }
      out.textContent = "正在加密并上传备份…";
      try {
        const r = await Backup.publishBackup();
        out.innerHTML = `<span class="tag tag-success">备份成功</span> ${new Date(r.savedAt).toLocaleString("zh-CN")} 的本机数据已加密上传`;
        U.toast("本地数据已加密备份到云端", "success");
      } catch (e) { out.innerHTML = `<span class="tag tag-danger">备份失败</span> ` + U.esc(String(e && e.message || e)); }
    };
    $("#bk-restore").onclick = async () => {
      const out = $("#bk-out");
      let pass = Backup.hasPassphrase() ? Backup.getPassphrase() : "";
      pass = prompt("请输入备份密码（恢复云端加密备份到本机）", pass);
      if (pass == null || pass === "") return;
      if (!(await U.confirm("从云端解密备份并覆盖本机配置（Token、AI 配置、管理员密码、收藏、历史）？", { okText: "恢复" }))) return;
      out.textContent = "正在拉取并解密云端备份…";
      try {
        const r = await Backup.restore(pass);
        Backup.setPassphrase(pass);
        out.innerHTML = `<span class="tag tag-success">恢复成功</span> ${new Date(r.savedAt).toLocaleString("zh-CN")} 的备份：${r.settings} 项设置 / ${r.favorites} 收藏 / ${r.histories} 历史${r.hasToken ? "（含发布 Token，刷新后本机即恢复为编辑端）" : ""}。<b>3 秒后自动刷新页面…</b>`;
        U.toast("本地数据已从云端恢复", "success");
        setTimeout(() => location.reload(), 3000);
      } catch (e) { out.innerHTML = `<span class="tag tag-danger">恢复失败</span> ` + U.esc(String(e && e.message || e)); }
    };
    $("#stats-test").onclick = async () => { const out = $("#stats-out"); if (!Stats.cfApi()) { out.innerHTML = '<span class="tag tag-warning">请先填写接口地址</span>'; return; } out.textContent = "测试中…"; const j = await Stats.cfGetStats(true); out.innerHTML = j ? `<span class="tag tag-success">连接成功</span> 累计 ${j.total || 0} · 今日 ${j.today || 0}` : `<span class="tag tag-danger">连接失败</span>`; };
    $("#restore-seed").onclick = async () => {
      if (await U.confirm("将初始示例题目追加合并到当前题库（不覆盖现有数据）？", { okText: "追加" })) {
        const n = await DB.resetSeedAppend(); await Services.reload(); U.toast("已追加 " + n + " 道示例题目", "success"); renderSidebar(parseHash());
      }
    };
  }

  /* ============================ 启动 ============================ */
  /* ============================ 首次进入加载动效 ============================ */
  const Boot = (() => {
    let started = 0, target = 0, raf = 0, rainRaf = 0, finished = false, readyResolve;
    const ready = new Promise(r => readyResolve = r);
    const el = id => document.getElementById(id);
    const NAMES = ["前端工程师","后端工程师","全栈工程师","测试工程师","测试开发工程师","运维工程师","SRE工程师","DevOps工程师","数据分析师","算法工程师","机器学习工程师","深度学习工程师","数据科学家","产品经理","网络安全工程师","渗透测试工程师","大数据开发工程师","云架构师","解决方案架构师","数据库管理员","人工智能工程师","移动端开发","iOS开发","Android开发","游戏开发工程师","嵌入式工程师","区块链工程师","爬虫工程师","推荐算法工程师","搜索算法工程师","音视频开发","性能测试工程师","自动化测试工程师","UI设计师","交互设计师","售前工程师","技术项目经理","视觉算法工程师","鸿蒙开发工程师","Go开发工程师","Java开发工程师","Python开发工程师","C++开发工程师","前端架构师","后端架构师","数据工程师","ETL工程师","BI工程师","运维开发工程师","大模型应用工程师","AIGC工程师"];
    function start() {
      const ov = el("boot-loader"); if (!ov) return;
      /* 回访（本会话已看过开场动画）直接跳过，不再强制等待 3.2s */
      let seen = false;
      try { seen = sessionStorage.getItem("iti_boot_seen") === "1"; } catch (_) {}
      /* 深链进入（分享卡/扫码经 q/<id>.html 跳转 #/question/<id> 等）直接进正题：
         用户带着明确目的而来，再播 3.2s 开场会形成「题目→动效→又回题目」的绕圈体验；
         同样按已看过标记，本会话内不再补播 */
      let deepLink = false;
      try { deepLink = !!location.hash && location.hash !== "#/" && location.hash !== "#"; } catch (_) {}
      if (seen || deepLink) {
        try { sessionStorage.setItem("iti_boot_seen", "1"); } catch (_) {}
        ov.style.display = "none";
        finished = true;
        if (readyResolve) readyResolve();
        return;
      }
      try { sessionStorage.setItem("iti_boot_seen", "1"); } catch (_) {}
      ov.style.display = "flex"; started = Date.now();
      try { initRain(); initNames(); } catch (e) { console.warn("boot fx", e); }
      loop();
    }
    function initRain() {
      const c = el("boot-rain"); if (!c) return;
      const ctx = c.getContext("2d");
      const resize = () => { c.width = innerWidth; c.height = innerHeight; };
      resize();
      const chars = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ{}[]<>+=*/;constfunctionreturnimportexportclassasyncawait".split("");
      const fontSize = 14;
      let drops = [];
      const reset = () => { const cols = Math.floor(c.width / fontSize); drops = new Array(cols).fill(1); };
      reset();
      const draw = () => {
        ctx.fillStyle = "rgba(6,10,16,0.10)"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#1fae74"; ctx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
          const t = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(t, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > c.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
        rainRaf = requestAnimationFrame(draw);
      };
      draw();
      addEventListener("resize", reset);
    }
    function initNames() {
      const box = el("boot-names"); if (!box) return;
      const N = Math.min(24, Math.max(12, Math.floor(innerWidth / 88)));
      for (let i = 0; i < N; i++) {
        const s = document.createElement("span");
        s.className = "boot-name";
        s.textContent = NAMES[Math.floor(Math.random() * NAMES.length)];
        s.style.top = (Math.random() * 100) + "vh";
        s.style.animationDuration = (13 + Math.random() * 18) + "s";
        s.style.animationDelay = (-Math.random() * 26) + "s";
        s.style.fontSize = (12 + Math.random() * 18) + "px";
        s.style.opacity = (0.16 + Math.random() * 0.30).toFixed(2);
        box.appendChild(s);
      }
    }
    function set(pct, status) {
      target = Math.max(target, pct);
      const s = el("boot-status"); if (s && status) s.textContent = status;
    }
    function loop() {
      const fill = el("boot-bar-fill"); const pctEl = el("boot-pct");
      const cur = parseFloat((fill && fill.dataset.v) || "0");
      const next = cur + (target - cur) * 0.09;
      if (fill) { fill.dataset.v = next; fill.style.width = next + "%"; }
      if (pctEl) pctEl.textContent = Math.round(next) + "%";
      raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (finished) return; finished = true;
      const ov = el("boot-loader");
      const skip = el("boot-skip"); if (skip) skip.style.opacity = "1";
      const elapsed = Date.now() - started;
      const MIN = 3200; // 最短展示时长，确保动效能看完
      const wait = Math.max(0, MIN - elapsed);
      target = Math.min(target, 92); // 加载期间进度停在 ~92%，结束瞬间补满，避免早早钉在 100%
      let revealed = false;
      const reveal = () => {
        if (revealed) return; revealed = true;
        target = 100;
        setTimeout(() => {
          const fill = el("boot-bar-fill"); const pctEl = el("boot-pct");
          if (fill) fill.style.width = "100%"; if (pctEl) pctEl.textContent = "100%";
          const o = el("boot-loader");
          cancelAnimationFrame(raf); cancelAnimationFrame(rainRaf);
          if (o) { o.classList.add("done"); setTimeout(() => { o.style.display = "none"; }, 600); }
          if (readyResolve) readyResolve();
        }, 520);
      };
      setTimeout(reveal, wait);
      if (ov) ov.addEventListener("click", reveal);
    }
    return { start, set, finish, ready };
  })();

  /* ============================ 访客统计（本地计数 + 百度统计 + 可选 Cloudflare Worker） ============================ */
  const Stats = (() => {
    /* --- 百度统计 --- */
    const DEFAULT_TID = "856d2b08330e4b9f225cf101d6f14103";   /* 与 index.html 的 hm.js ID 保持一致，避免双账号重复上报 */
    const baiduId = () => (typeof localStorage !== "undefined" ? (localStorage.getItem("baidu_tid") || DEFAULT_TID) : DEFAULT_TID);
    function trackBaidu(url) {
      if (baiduId() && typeof _hmt !== "undefined" && _hmt) {
        try { _hmt.push(["_trackPageview", url]); } catch (e) {}
      }
    }
    function loadBaiduScript() {
      const tid = baiduId(); if (!tid) return;
      if (tid === DEFAULT_TID && typeof _hmt !== "undefined" && _hmt.length >= 0) return;
      window._hmt = window._hmt || [];
      (function () {
        var hm = document.createElement("script");
        hm.async = true;
        hm.src = "https://hm.baidu.com/hm.js?" + tid;
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
    }
    /* --- 本地计数（localStorage） --- */
    function readLocal() {
      try { return JSON.parse(localStorage.getItem("local_stats") || '{"total":0,"daily":{},"views":{}}'); }
      catch (e) { return { total: 0, daily: {}, views: {} }; }
    }
    function writeLocal(d) {
      try { localStorage.setItem("local_stats", JSON.stringify(d)); } catch (e) {}
    }
    function recordVisit() {
      const today = dateKey();   /* 本地日期（原 UTC 会导致早 8 点前记到昨天） */
      const d = readLocal();
      d.total = (d.total || 0) + 1;
      d.daily[today] = (d.daily[today] || 0) + 1;
      writeLocal(d);
      trackBaidu(location.hash || "/");
      cfPost("/visit");   /* 上报全局访问到 Cloudflare Worker（fire-and-forget） */
    }
    function recordView(id) {
      if (id == null) return;
      const d = readLocal();
      const k = String(id);
      const today = dateKey();
      d.daily[today] = (d.daily[today] || 0) + 1;   /* 看题也算当日活跃，保证打卡/热力图完整 */
      d.views[k] = (d.views[k] || 0) + 1;
      writeLocal(d);
      trackBaidu("/question/" + id);
      cfPost("/view", { id });   /* 上报题目浏览到 Cloudflare Worker（fire-and-forget） */
    }
    function getLocalStats() {
      const today = dateKey();
      const d = readLocal();
      const views = Object.entries(d.views || {})
        .map(([id, n]) => ({ id, views: n }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);
      /* daily 必须返回：streakInfo（学习打卡卡）依赖它推导连续/累计/热力图 */
      return { total: d.total || 0, todayCount: d.daily[today] || 0, topQuestions: views, daily: d.daily || {} };
    }
    /* --- 可选 Cloudflare Worker（2026-08-27 起已部署，默认启用） ---
       默认地址指向本站官方 Worker（it-interview-stats.iti-interview.workers.dev）；
       管理员仍可在系统设置里用自己的地址覆盖（localStorage.stats_api）。 */
    const DEFAULT_STATS_API = "https://it-interview-stats.iti-interview.workers.dev";
    const cfApi = () => (typeof localStorage !== "undefined"
      ? (localStorage.getItem("stats_api") || DEFAULT_STATS_API) : DEFAULT_STATS_API);
    function cfEnabled() { return !!cfApi(); }
    function fetchWithTimeout(url, opts = {}, ms = 3000) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
    }
    async function cfPost(path, params) {
      const b = cfApi().replace(/\/+$/, ""); if (!b) return null;
      try {
        const u = new URL(b + path);
        const k = localStorage.getItem("stats_key") || "";
        if (k) u.searchParams.set("k", k);
        if (params) for (const kk in params) u.searchParams.set(kk, String(params[kk]));
        const r = await fetchWithTimeout(u.toString(), { method: "POST", mode: "cors" });
        return await r.json().catch(() => null);
      } catch (e) { return null; }
    }
    let cfCache = null, cfCacheAt = 0;
    async function cfGetStats(force) {
      const b = cfApi().replace(/\/+$/, ""); if (!b) return null;
      if (!force && cfCache && Date.now() - cfCacheAt < 60000) return cfCache;
      try {
        const u = new URL(b + "/stats");
        const k = localStorage.getItem("stats_key") || "";
        if (k) u.searchParams.set("k", k);
        const r = await fetchWithTimeout(u.toString(), { mode: "cors" });
        const j = await r.json();
        cfCache = j; cfCacheAt = Date.now();
        return j;
      } catch (e) { return cfCache; }
    }
    function enabled() { return true; }
    return { enabled, recordVisit, recordView, getLocalStats, baiduId, loadBaiduScript, cfEnabled, cfApi, cfPost, cfGetStats };
  })();

  const COUNTRY_NAMES = { CN: "中国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门", US: "美国", JP: "日本", KR: "韩国", SG: "新加坡", GB: "英国", DE: "德国", FR: "法国", IN: "印度", CA: "加拿大", AU: "澳大利亚", RU: "俄罗斯", BR: "巴西", NL: "荷兰", ES: "西班牙", IT: "意大利", TH: "泰国", MY: "马来西亚", VN: "越南", ID: "印度尼西亚", PH: "菲律宾", NZ: "新西兰", SE: "瑞典", CH: "瑞士", AE: "阿联酋", ZA: "南非", XX: "未知地区" };
  function countryName(code) { return COUNTRY_NAMES[code] || code; }

  function flashVis(el) { if (!el) return; el.classList.remove("vis-flash"); void el.offsetWidth; el.classList.add("vis-flash"); }
  async function refreshVisitorStats() {
    const j = Stats.getLocalStats();
    const t = document.getElementById("vis-today"); const tot = document.getElementById("vis-total");
    const tv = (j.todayCount || 0).toLocaleString();
    const tt = (j.total || 0).toLocaleString();
    if (t && t.textContent !== tv) { t.textContent = tv; flashVis(t); }
    if (tot && tot.textContent !== tt) { tot.textContent = tt; flashVis(tot); }
  }

  async function init() {
    applyTheme();
    Stats.loadBaiduScript();
    if (!window.indexedDB) {
      document.body.innerHTML = `<div class="empty" style="padding:80px"><div class="em-ic">${U.icon("alert")}</div><h3>当前浏览器不支持 IndexedDB</h3><p>请使用 Chrome / Firefox / Edge 等现代浏览器。</p></div>`;
      return;
    }
    main = $("#main"); sidebar = $("#sidebar"); topbar = $("#topbar");
    renderTopbar();
    /* 页脚：使用指南入口 + 仓库链接（首次填充，之后静态） */
    const footEl = document.getElementById("footer");
    if (footEl && !footEl.dataset.filled) {
      footEl.dataset.filled = "1";
      footEl.innerHTML = `<a href="#/help">${U.icon("fileText")} 使用指南</a><span class="sep">·</span><a href="https://github.com/succedd/workbuddy_it-interview" target="_blank" rel="noopener">GitHub</a><span class="sep">·</span><span>数据存于本机浏览器 · 登录后云端同步</span>`;
    }
    /* 待复习数预载（供侧边栏角标） */
    Services.weakList().then(r => { App.reviewDue = r.due.length; }).catch(() => {});
    /* 标签点击即搜（事件委托；首页热词区有独立处理，跳过） */
    document.getElementById("main").addEventListener("click", (e) => {
      const tg = e.target.closest(".tag[data-tag]");
      if (tg && !e.target.closest(".hot-tags")) { e.preventDefault(); e.stopPropagation(); shPush(tg.dataset.tag); App.go("/questions?q=" + encodeURIComponent(tg.dataset.tag)); }
    });
    Boot.start();
    let cloudPending = null;
    try {
      let justSeeded = false;
      try { justSeeded = await DB.seed(); } catch (e) { console.error("seed error", e); U.toast("初始化数据出错", "error"); }
      Boot.set(35, "加载岗位与技术体系…");
      try { const n = await DB.migrateDedupPositions(); if (n > 0) console.log("已清理", n, "条重复岗位记录"); } catch (_) {}
      try { const n = await DB.migrateRemoveFakePositions(); if (n > 0) { console.log("已清理", n, "条伪岗位记录"); U.toast("已自动清理 " + n + " 条与分类同名的空岗位", "info"); } } catch (_) {}
      try { const n = await DB.migrateSeedDirectionExamples(); if (n > 0) console.log("已为公有云售后技术支持预置", n, "个细分方向示例岗位"); } catch (_) {}
      Boot.set(55, "检查云端题库更新…");
      try {
        const r = await Cloud.syncIfNeeded(justSeeded);
        if (r && r.applied) U.toast("已同步云端题库最新版（共 " + r.count + " 题）", "success");
        if (r && r.pending) cloudPending = r;
        /* 编辑端（配置过 Token）：不做全量同步，但增量吸收云端自动扩充的新题，
           避免本地题库落后于线上而不自知。失败不影响启动。 */
        if (r && r.skipped && r.reason === "editor") {
          try {
            const a = await Cloud.absorbRemote();
            if (a && a.added > 0) {
              U.toast("已从云端自动吸收 " + a.added + " 道新题（不改动本地已有题目）", "success");
              console.log("absorbRemote: +" + a.added + " questions from cloud snapshot");
            }
          } catch (e2) { console.warn("absorbRemote error", e2); }
        }
      } catch (e) { console.warn("cloud sync error", e); }
      Boot.set(60, "迁移与预置数据…");
      try { const n = await Services.repairHistoryIds(); if (n > 0) console.log("已修复", n, "条字符串 id 的浏览历史记录"); } catch (_) {}
      await Services.reload();
      App.dailyList = await buildDailyList();   /* 今日清单（含可选的温故知新混入），供首页与打卡判定共用 */
      Boot.set(85, "渲染界面…");
      if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (App.getTheme() === "system") applyTheme(); });
      window.addEventListener("hashchange", () => { renderTopbar(); route(); });
      if (!location.hash) location.hash = "/";
      route();
      if (cloudPending) U.toast("检测到云端共享题库（" + cloudPending.count + " 题）。本机已有数据未自动覆盖，如需使用共享题库请到「系统设置 → 云端共享题库」手动同步", "info");
      Stats.recordVisit();
      refreshVisitorStats();
      setInterval(refreshVisitorStats, 60000);
      try { Cloud.initAuto(); } catch (e) { console.warn("autopub init error", e); }
      try { Backup.initAuto(); } catch (e) { console.warn("auto backup init error", e); }
      try { Account.autoSyncIfDue(); } catch (e) { console.warn("account autosync error", e); }   // 登录用户静默云同步个人数据
      try { startReviewWatcher(); } catch (e) { console.warn("review watcher error", e); }   // 艾宾浩斯到期复习提醒
    } catch (e) {
      console.error("init error", e);
      U.toast("页面初始化出错，请刷新重试", "error");
    } finally {
      Boot.finish();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ============================ 到期复习提醒 ============================
   * 艾宾浩斯到期题目前只是侧边栏角标数字，用户不点开就不知道该复习了。
   * 启动 + 每 5 分钟轮询：发现新到期题（相对上次提醒增量）时 toast 提醒，
   * 并给侧边栏「错题重练」角标加脉冲动画。会话内同题只提醒一次，避免打扰。 */
  let reviewWatchTimer = null;
  function startReviewWatcher() {
    if (reviewWatchTimer) return;
    const notified = new Set();   // 本会话已提醒过的 questionId
    let firstRun = true;
    const check = async () => {
      try {
        if (!Services.questions || !Services.questions.length) return;
        const { due } = await Services.weakList();
        if (!due.length) { firstRun = false; return; }
        due.forEach(w => notified.add(w.questionId));   // 启动时已有的一律静默，不打扰打开页面
        const fresh = firstRun ? [] : due.filter(w => !notified.has(w.questionId));
        firstRun = false;
        if (fresh.length) {
          U.toast("📚 有 " + fresh.length + " 道题到复习时间了，去「错题重练」巩固记忆", "info", 6000);
          fresh.forEach(w => notified.add(w.questionId));
        }
        const item = document.querySelector('.side-nav-item[href="#/review"]');
        if (item && due.length) item.classList.add("nav-pulse");
        /* 徽章数字实时更新：用户停留在任意页面时，新到期的题也能反映到侧边栏 */
        if (App.reviewDue !== due.length) { App.reviewDue = due.length; renderSidebar(parseHash()); }
      } catch (_) {}
    };
    check();
    reviewWatchTimer = setInterval(check, 5 * 60 * 1000);
  }

  /* ---- 暴露给 account.js 等兄弟模块的内部函数（app.js 是 IIFE，默认不外泄） ---- */
  App._internals = { $, setMain, route, renderTopbar, refreshVisitorStats };
  window.App = App;
})();