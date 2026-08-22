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

  async function route() {
    clearCharts();
    const r = parseHash();
    renderSidebar(r);
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
      case "practice": return pagePractice(r.q);
      case "mock": return pageMock();
      default: return pageHome();
    }
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
           <a href="#/admin/settings">${U.icon("settings")||U.icon("user")} 系统设置</a>
           <div class="sep"></div>
           <a href="#" id="admin-logout">${U.icon("x")} 退出管理</a>
         </div></div>`
      : `<button class="btn btn-ghost btn-sm" id="admin-login-btn">${U.icon("user")} 管理员</button>`;
    topbar.innerHTML = `
      <button class="icon-btn menu-toggle" id="menu-toggle">${U.icon("menu")}</button>
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
        <button class="icon-btn" id="theme-btn" title="${themeLabel}">${U.icon(themeIcon)}</button>
        ${adminHtml}
      </div>`;
    const gs = $("#global-search");
    gs.addEventListener("keydown", e => { if (e.key === "Enter" && gs.value.trim()) App.go("/questions?q=" + encodeURIComponent(gs.value.trim())); });
    $("#theme-btn").onclick = cycleTheme;
    $("#menu-toggle").onclick = () => { document.body.classList.toggle("drawer-open"); };
    if (Auth.isAdmin()) {
      const ab = $("#admin-btn"); const menu = $("#admin-menu");
      ab.onclick = (e) => { e.stopPropagation(); menu.style.display = menu.style.display === "none" ? "block" : "none"; };
      document.addEventListener("click", () => { menu.style.display = "none"; });
      $("#admin-logout").onclick = (e) => { e.preventDefault(); Auth.logout(); U.toast("已退出管理员模式", "info"); renderTopbar(); renderSidebar(parseHash()); };
    } else {
      $("#admin-login-btn").onclick = openAdminLogin;
    }
  }

  /* ============================ 侧边栏 ============================ */
  function renderSidebar(r) {
    const navItem = (href, icon, label, active) =>
      `<a class="side-nav-item ${active ? "active" : ""}" href="${href}">${U.icon(icon)}<span>${label}</span></a>`;
    const p0 = r.parts[0] || "home";
    let html = `
      <div class="nav-section-title">导航</div>
      ${navItem("#/", "home", "首页", p0 === "home")}
      ${navItem("#/category", "layers", "技术体系", p0 === "category")}
      ${navItem("#/position", "briefcase", "岗位体系", p0 === "position")}
      ${navItem("#/mock", "play", "模拟面试", p0 === "mock")}
      ${navItem("#/practice", "refresh", "刷题练习", p0 === "practice")}
      ${navItem("#/favorites", "bookmark", "收藏夹", p0 === "favorites")}
      ${navItem("#/history", "history", "浏览历史", p0 === "history")}
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
  async function pageHome() {
    const stats = await Services.stats();
    const tree = Services.categoryTree();
    const posByStage = Services.positionsByStage();
    const hotTags = ["Java", "MySQL", "Redis", "Spring Boot", "Vue3", "React", "Docker", "Kubernetes", "TCP", "算法", "Python", "AI大模型"];
    const recent = stats.recent.slice(0, 6);
    const best = Services.questions.slice().sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)).slice(0, 6);
    const catCards = tree.map(c => `<a class="card card-hover" href="#/category?cat=${c.id}" style="text-decoration:none">
        <div style="font-size:24px">${U.esc(c.icon || "📁")}</div>
        <div style="font-weight:600;margin-top:6px">${U.esc(c.name)}</div>
        <div class="muted" style="font-size:12px">${c.count} 题 · ${c.era || ""}</div>
      </a>`).join("");
    const stageCards = posByStage.map(s => { const seen = new Set(); const uniq = s.list.filter(p => { if (Services.isHiddenPosition(p)) return false; if (seen.has(Services.posKey(p))) return false; seen.add(Services.posKey(p)); return true; }); return `<div class="card"><div class="tag tag-ai" style="margin-bottom:8px">${U.esc(s.stage)}</div>
        <div class="pill-row">${uniq.slice(0, 8).map(p => `<a class="tag tag-outline" href="#/position/${p.id}" style="text-decoration:none">${U.esc(Services.posFullName(p))}</a>`).join("")}${uniq.length > 8 ? `<span class="muted">+${uniq.length - 8}</span>` : ""}</div></div>`; }).join("");
    const qlist = arr => arr.map(q => qCard(q)).join("");
    setMain(`
      <section class="hero">
        <h1>IT 面试题库管理系统</h1>
        <p>覆盖完整技术体系与岗位体系，支持本地浏览、搜索、收藏、刷题、模拟面试与 AI 智能出题。纯静态 · 数据存于本机浏览器。</p>
        <div class="hero-search">
          <input id="hero-search" type="text" placeholder="输入关键词，如 Redis 缓存穿透、Spring 事务…" />
          <button class="btn btn-primary btn-lg" id="hero-go">${U.icon("search")} 搜索</button>
        </div>
        <div class="hot-tags">${hotTags.map(t => `<span class="tag" data-tag="${U.esc(t)}">${U.esc(t)}</span>`).join("")}</div>
      </section>

      <section class="stat-grid" style="margin-top:28px">
        <div class="stat"><div class="num" data-roll="${tree.length}">0</div><div class="label">技术分类</div></div>
        <div class="stat"><div class="num" data-roll="${stats.total}">0</div><div class="label">题目总数</div></div>
        <div class="stat"><div class="num" data-roll="${stats.positions}">0</div><div class="label">覆盖岗位</div></div>
        <div class="stat ai"><div class="num" data-roll="${stats.ai}">0</div><div class="label">AI 生成题</div></div>
      </section>

      <div class="section-head"><h2>技术体系</h2><a class="more" href="#/category">查看全部 →</a></div>
      <div class="grid grid-cols-auto">${catCards}</div>

      <div class="section-head"><h2>岗位体系</h2><a class="more" href="#/position">查看全部 →</a></div>
      <div class="grid grid-cols-2">${stageCards}</div>

      <div class="section-head"><h2>最新题目</h2><a class="more" href="#/questions?sort=updated">更多 →</a></div>
      <div class="grid grid-cols-2">${qlist(recent)}</div>

      <div class="section-head"><h2>精选题目（AI 评分最高）</h2><a class="more" href="#/questions?sort=aiScore">更多 →</a></div>
      <div class="grid grid-cols-2">${qlist(best)}</div>

      <div class="note" style="margin-top:24px">提示：本项目为纯静态本地版，所有数据保存在当前浏览器（IndexedDB）。首次使用可在「系统设置」配置 AI（DeepSeek Harness）以启用智能出题。管理员密码仅用于本机权限隔离，非服务端安全认证。</div>
    `);
    $("#hero-search").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.value.trim()) App.go("/questions?q=" + encodeURIComponent(e.target.value.trim())); });
    $("#hero-go").onclick = () => { const v = $("#hero-search").value.trim(); if (v) App.go("/questions?q=" + encodeURIComponent(v)); };
    $$(".hot-tags .tag").forEach(t => t.onclick = () => App.go("/questions?q=" + encodeURIComponent(t.dataset.tag)));
    $$("#main .num[data-roll]").forEach(el => U.rollNumber(el, parseInt(el.dataset.roll)));
  }

  /* ============================ 技术体系页 ============================ */
  async function pageCategory(q) {
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
    `);
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
      const chart = echarts.init($("#pos-chart"));
      charts.push(chart);
      chart.setOption({
        tooltip: { trigger: "item" },
        series: [{ type: "pie", radius: ["40%", "70%"], data: Object.keys(dist).map(k => ({ name: k, value: dist[k], itemStyle: { color: { "初级": "#10B981", "中级": "#3B82F6", "高级": "#F59E0B", "专家": "#EF4444" }[k] } })), label: { color: App.getTheme() === "dark" ? "#e2e8f0" : "#0f172a" } }]
      });
    });
  }

  /* ============================ 题目列表页 ============================ */
  async function pageQuestions(q) {
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
      if (!arr.length) { grid.innerHTML = `<div class="empty">${U.icon("search")}<p>没有匹配的题目</p></div>`; $("#q-count").textContent = "0"; return; }
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
    await Services.incViews(id); await Services.reload();
    await Services.addHistory(id);
    const fav = await Services.isFavorite(q.id);
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
    if (Auth.isAdmin()) {
      $("#del-btn").onclick = async () => {
        if (await U.confirm("确定删除该题？此操作不可逆。", { danger: true, okText: "删除" })) {
          await Services.deleteQuestion(q.id); U.toast("已删除", "success"); App.go("/questions");
        }
      };
      $("#opt-btn").onclick = () => openOptimizeModal(q);
    }
    // 上/下一题（同类随机）
    const siblings = Services.questions.filter(x => x.categoryId === q.categoryId && x.id !== q.id);
    if (siblings.length) {
      $("#next-btn").onclick = () => App.go("/question/" + siblings[Math.floor(Math.random() * siblings.length)].id);
      $("#prev-btn").onclick = () => App.go("/question/" + siblings[Math.floor(Math.random() * siblings.length)].id);
    } else { $("#prev-btn").style.display = "none"; $("#next-btn").style.display = "none"; }
  }

  /* ============================ 收藏夹 ============================ */
  async function pageFavorites() {
    const favs = await Services.getFavorites();
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>收藏夹</span></div>
      <div class="section-head"><h2>我的收藏（${favs.length}）</h2>
        <div><button class="btn btn-sm" id="exp-md">${U.icon("download")} 导出MD</button>
        <button class="btn btn-sm btn-danger" id="clear-fav">${U.icon("trash")} 清空</button></div></div>
      <div class="grid grid-cols-2">${favs.length ? favs.map(q => qCard(q)).join("") : '<div class="empty">还没有收藏任何题目</div>'}</div>`);
    $("#exp-md").onclick = () => exportFavMarkdown(favs);
    $("#clear-fav").onclick = async () => { if (await U.confirm("确定清空全部收藏？", { danger: true })) { for (const f of favs) await Services.toggleFavorite(f.id); U.toast("已清空收藏", "success"); pageFavorites(); } };
  }
  function exportFavMarkdown(favs) {
    let md = "# 我的收藏题目\n\n";
    favs.forEach(q => { md += `## ${q.title}\n\n**难度**：${q.difficulty} **题型**：${q.type}\n\n${q.body}\n\n**答案**\n\n${q.answer}\n\n---\n\n`; });
    U.download("我的收藏题目.md", md, "text/markdown");
  }

  /* ============================ 浏览历史 ============================ */
  async function pageHistory() {
    const hs = await Services.getHistories();
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>浏览历史</span></div>
      <div class="section-head"><h2>浏览历史（${hs.length}）</h2>
        <button class="btn btn-sm btn-danger" id="clear-h">${U.icon("trash")} 清空</button></div>
      <div class="grid grid-cols-2">${hs.length ? hs.map(({ q, at }) => `<div class="card card-hover" style="cursor:pointer" onclick="location.hash='/question/${q.id}'">${qCard(q).replace('href="#/question/' + q.id + '"', '').replace('class="card card-hover q-card"', 'class="q-card"')}<div class="muted" style="font-size:12px;margin-top:6px">浏览于 ${U.fmtDate(at)}</div></div>`).join("") : '<div class="empty">暂无浏览记录</div>'}</div>`);
    $("#clear-h").onclick = async () => { if (await U.confirm("确定清空浏览历史？", { danger: true })) { await DB.db.histories.clear(); U.toast("已清空", "success"); pageHistory(); } };
  }

  /* ============================ 刷题练习 ============================ */
  async function pagePractice(q) {
    const mode = q.mode || "random";
    const diffs = ["初级", "中级", "高级", "专家"];
    let pool = Services.published().slice();
    if (q.cat) { const id = parseInt(q.cat); const ids = [id].concat(Services.descendantIds(id)); pool = pool.filter(x => ids.indexOf(x.categoryId) >= 0); }
    if (q.diff) pool = pool.filter(x => x.difficulty === q.diff);
    const start = (order) => {
      let list = pool.slice();
      if (order === "random") list.sort(() => Math.random() - 0.5);
      if (order === "seq") list.sort((a, b) => (a.categoryId || 0) - (b.categoryId || 0));
      runPractice(list);
    };
    setMain(`<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>刷题练习</span></div>
      <h1>刷题练习</h1>
      <p class="secondary">共 ${pool.length} 道可用题目。选择模式开始。</p>
      <div class="card" style="max-width:520px">
        <label class="field"><span>刷题模式</span>
          <select id="pm" class="full">
            <option value="random" ${mode === "random" ? "selected" : ""}>随机刷题</option>
            <option value="seq" ${mode === "seq" ? "selected" : ""}>顺序刷题（按分类）</option>
          </select></label>
        <label class="field"><span>难度筛选（可选）</span>
          <select id="pd" class="full"><option value="">全部</option>${diffs.map(d => `<option ${q.diff === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        <button class="btn btn-primary btn-lg full" id="start-p">${U.icon("play")} 开始刷题</button>
      </div>`);
    $("#pd").onchange = e => App.go("/practice?mode=" + $("#pm").value + (e.target.value ? "&diff=" + e.target.value : ""));
    $("#pm").onchange = e => App.go("/practice?mode=" + e.target.value + ($("#pd").value ? "&diff=" + $("#pd").value : ""));
    $("#start-p").onclick = () => start($("#pm").value);
  }

  function runPractice(list) {
    if (!list.length) { U.toast("没有可用题目", "warn"); return; }
    let i = 0, mastered = 0, weak = 0;
    const show = () => {
      const q = list[i];
      setMain(`<div class="breadcrumb"><a href="#/practice">刷题练习</a><span class="sep">/</span><span>第 ${i + 1}/${list.length} 题</span></div>
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
      const mark = (m) => { if (m === "master") mastered++; else weak++; next(); };
      $$("#mark button").forEach(b => b.onclick = () => mark(b.dataset.m));
      $("#next").onclick = next; $("#prev").onclick = () => { if (i > 0) { i--; show(); } };
      function next() { if (i < list.length - 1) { i++; show(); } else { finishPractice(list.length, mastered, weak); } }
    };
    show();
  }
  function finishPractice(total, mastered, weak) {
    setMain(`<div class="empty"><div class="em-ic">${U.icon("check")}</div>
      <h2>刷题完成</h2><p>共 ${total} 题 · 掌握 ${mastered} · 待加强 ${weak}</p>
      <a class="btn btn-primary" href="#/practice">${U.icon("refresh")} 再来一轮</a></div>`);
  }

  /* ============================ 模拟面试 ============================ */
  async function pageMock() {
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
      const mk = (m) => { mastery[m]++; if (m === "unknown") unknownList.push(q.title); clearInterval(tick); next(); };
      $$("#mark button").forEach(b => b.onclick = () => mk(b.dataset.m));
      const next = () => { clearInterval(tick); if (i < pool.length - 1) { i++; show(); } else finishMock(pos, years, pool, mastery, unknownList, cov, t0); };
      $("#next").onclick = next;
    };
    show();
  }
  function finishMock(pos, years, pool, mastery, unknownList, cov, t0) {
    const sec = Math.floor((Date.now() - t0) / 1000);
    const covKeys = Object.keys(cov);
    let md = `# 模拟面试报告\n\n- 岗位：${pos ? pos.name : "通用"}\n- 年限：${years}\n- 题目数：${pool.length}\n- 用时：${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}\n- 掌握：${mastery.master} 不熟悉：${mastery.familiar} 不会：${mastery.unknown}\n- 技术覆盖：${covKeys.join("、")}\n\n## 需加强的题目\n${unknownList.length ? unknownList.map(t => "- " + t).join("\n") : "（无）"}\n`;
    setMain(`<div class="empty" style="text-align:left">
      <h2>${U.icon("check")} 面试完成</h2>
      <div class="grid grid-cols-2" style="max-width:520px;margin:16px auto">
        <div class="card"><div class="num">${pool.length}</div><div class="label">题目</div></div>
        <div class="card"><div class="num">${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}</div><div class="label">用时</div></div>
        <div class="card"><div class="num" style="color:var(--c-success)">${mastery.master}</div><div class="label">掌握</div></div>
        <div class="card"><div class="num" style="color:var(--c-danger)">${mastery.unknown}</div><div class="label">不会</div></div>
      </div>
      <p class="secondary">技术方向覆盖：${covKeys.join("、") || "—"}</p>
      <div class="pill-row" style="justify-content:center">
        <button class="btn btn-primary" id="exp">${U.icon("download")} 导出报告(MD)</button>
        <a class="btn" href="#/mock">${U.icon("refresh")} 再面一次</a>
      </div></div>`);
    $("#exp").onclick = () => U.download("模拟面试报告.md", md, "text/markdown");
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
    `, () => {
      const axisColor = App.getTheme() === "dark" ? "#aeb9c9" : "#475569";
      const mk = (id, type, data, name) => { const c = echarts.init($(id)); charts.push(c); c.setOption({ tooltip: { trigger: type === "pie" ? "item" : "axis" }, legend: type === "pie" ? { textStyle: { color: axisColor } } : undefined, xAxis: type === "bar" ? { type: "category", data: data.map(d => d[0]), axisLabel: { color: axisColor, rotate: 30 } } : undefined, yAxis: type === "bar" ? { type: "value", axisLabel: { color: axisColor } } : undefined, series: [{ type, data: type === "pie" ? data.map(d => ({ name: d[0], value: d[1] })) : data.map(d => d[1]), name, itemStyle: { color: type === "pie" ? undefined : "#2563EB" }, label: { color: axisColor } }] }); };
      mk("#c1", "bar", Object.entries(s.byCat).filter(([, v]) => v > 0).slice(0, 12), "题目数");
      mk("#c2", "pie", Object.entries(s.byDiff), "难度");
      mk("#c3", "bar", Object.entries(s.byType), "题型");
      mk("#c4", "pie", Object.entries(s.byAiBand), "AI评分");
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

  /* ============================ 管理员：题目编辑 ============================ */
  async function pageAdminQuestionEdit(id) {
    const isNew = !id || id === "new";
    const q = isNew ? { title: "", body: "", answer: "", difficulty: "中级", type: "简答题", status: "draft", tags: [], positionNames: [], years: "", remark: "", categoryId: null } : await Services.getQuestion(parseInt(id));
    if (!q) { setMain(`<div class="empty">未找到题目</div>`); return; }
    const catOpts = (sel) => { const build = (pid, depth) => Services.childrenOf(pid).map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${"　".repeat(depth)}${U.esc(c.name)}</option>` + build(c.id, depth + 1)).join(""); return `<option value="">未分类</option>` + build(0, 0); };
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
        <label class="field"><span>技术分类</span><select id="f-cat" class="full">${catOpts(q.categoryId)}</select></label>
        <label class="field"><span>难度</span><select id="f-diff" class="full">${diffs.map(d => `<option ${q.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        <label class="field"><span>题型</span><select id="f-type" class="full">${types.map(t => `<option ${q.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="field"><span>工作年限</span><input id="f-years" value="${U.esc(q.years || "")}" placeholder="如 1-3年" /></label>
        <label class="field"><span>状态</span><select id="f-status" class="full"><option value="draft" ${q.status === "draft" ? "selected" : ""}>草稿</option><option value="published" ${q.status === "published" ? "selected" : ""}>已发布</option><option value="offline" ${q.status === "offline" ? "selected" : ""}>下线</option></select></label>
        <label class="field"><span>技术标签</span>${tagInput(q.tags || [])}</label>
      </div>
      <label class="field"><span>适用岗位</span>${posInput()}</label>
      <div class="grid grid-cols-2" style="gap:16px">
        <div class="field"><span>题目正文（Markdown）</span><div class="editor-split">
          <div class="editor-pane"><div class="pane-head"><span>编辑</span></div><textarea id="f-body">${U.esc(q.body || "")}</textarea></div>
          <div class="editor-pane"><div class="pane-head"><span>预览</span></div><div class="preview-pane md" id="prev-body"></div></div>
        </div></div>
        <div class="field"><span>参考答案（Markdown）</span><div class="editor-split">
          <div class="editor-pane"><div class="pane-head"><span>编辑</span></div><textarea id="f-answer">${U.esc(q.answer || "")}</textarea></div>
          <div class="editor-pane"><div class="pane-head"><span>预览</span></div><div class="preview-pane md" id="prev-answer"></div></div>
        </div></div>
      </div>
      <label class="field"><span>管理员备注</span><input id="f-remark" value="${U.esc(q.remark || "")}" /></label>
      <div class="note">每次保存会自动创建版本记录，可在题目详情页恢复历史版本。</div>
    `, () => {
      const upd = () => { $("#prev-body").innerHTML = U.md($("#f-body").value); $("#prev-answer").innerHTML = U.md($("#f-answer").value); U.highlightAll($("#prev-answer")); };
      $("#f-body").addEventListener("input", upd); $("#f-answer").addEventListener("input", upd); upd();
      wireTagInput("#tag-box", "#tag-add");
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
      if (isNew) { const nid = await Services.addQuestion(Object.assign(data, { source: "manual" })); await Services.reload(); U.toast("已保存", "success"); App.go("/admin/question/" + nid); }
      else { await Services.updateQuestion(q.id, data); await Services.reload(); U.toast("已保存并生成版本", "success"); }
    }
    $("#save-draft").onclick = () => save("draft");
    $("#save-pub").onclick = () => save($("#f-status").value || "published");
    $("#ai-opt").onclick = () => openOptimizeModal(q, true);
  }
  function wireTagInput(boxSel, inputSel) {
    const box = $(boxSel); const input = $(inputSel);
    box.querySelectorAll(".x").forEach(x => x.onclick = () => x.parentElement.remove());
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && input.value.trim()) {
        const v = input.value.trim(); e.preventDefault();
        const chip = document.createElement("span"); chip.className = "chip"; chip.dataset.t = v;
        chip.innerHTML = U.esc(v) + `<span class="x">${U.icon("x")}</span>`;
        chip.querySelector(".x").onclick = () => chip.remove();
        box.insertBefore(chip, input); input.value = "";
      }
    });
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
        [["#req-box"], ["#bon-box"], ["#soft-box"]].forEach(([sel]) => { $(sel).querySelectorAll(".x").forEach(x => x.onclick = () => x.parentElement.remove()); });
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
          let okN = 0;
          const total = rows.filter(r => r.selected).length;
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
  function downloadTemplateXlsx() {
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
    $("#restore-seed").onclick = async () => {
      if (await U.confirm("将初始示例题目追加合并到当前题库（不覆盖现有数据）？", { okText: "追加" })) {
        const n = await DB.resetSeedAppend(); await Services.reload(); U.toast("已追加 " + n + " 道示例题目", "success"); renderSidebar(parseHash());
      }
    };
  }

  /* ============================ 启动 ============================ */
  async function init() {
    applyTheme();
    if (!window.indexedDB) {
      document.body.innerHTML = `<div class="empty" style="padding:80px"><div class="em-ic">${U.icon("alert")}</div><h3>当前浏览器不支持 IndexedDB</h3><p>请使用 Chrome / Firefox / Edge 等现代浏览器。</p></div>`;
      return;
    }
    main = $("#main"); sidebar = $("#sidebar"); topbar = $("#topbar");
    renderTopbar();
    try { await DB.seed(); } catch (e) { console.error("seed error", e); U.toast("初始化数据出错", "error"); }
    try { const n = await DB.migrateDedupPositions(); if (n > 0) console.log("已清理", n, "条重复岗位记录"); } catch (_) {}
    try { const n = await DB.migrateRemoveFakePositions(); if (n > 0) { console.log("已清理", n, "条伪岗位记录"); U.toast("已自动清理 " + n + " 条与分类同名的空岗位", "info"); } } catch (_) {}
    await Services.reload();
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (App.getTheme() === "system") applyTheme(); });
    window.addEventListener("hashchange", () => { renderTopbar(); route(); });
    if (!location.hash) location.hash = "/";
    route();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.App = App;
})();