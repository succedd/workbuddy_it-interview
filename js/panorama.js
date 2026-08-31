/* =========================================================================
 *  panorama.js — 题库全景图
 *  入口：首页 4 个统计卡片 → #/panorama?view=all | cat | pos | ai
 *    all  题库全景：ECharts 旭日图，圆环大小 = 题目数量，点色块直达题目
 *    cat  技术分类：可折叠的分类树（思维导图式），点节点看该分类题目
 *    pos  覆盖岗位：阶段 → 岗位族 → 具体岗位，点岗位进岗位题库
 *    ai   AI 生成题：来源构成 + AI 题目清单（按技术分类归组）
 *  依赖：utils.js(U) / services.js(Services) / app.js(App)，echarts 按需加载
 * ========================================================================= */
(function () {
  "use strict";

  const U = window.U;
  const S = window.Services;
  const App = window.App;

  /* ---------------- 图标：pieChart 为全景图专用，缺失时才补 ---------------- */
  if (U && U.ICONS && !U.ICONS.pieChart) {
    U.ICONS.pieChart = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3v9h9a9 9 0 0 0-9-9z"/><path d="M21 15.5A9 9 0 1 1 8.5 3.4"/>' +
      '<path d="M12 12v9a9 9 0 0 0 9-9h-9z"/></svg>';
  }

  const VIEWS = [
    { id: "all", label: "题库全景", icon: "pieChart", desc: "圆环大小 = 题目数量。内圈是技术体系，外圈是细分技术点，点任意色块直达题目列表。" },
    { id: "cat", label: "技术分类", icon: "layers", desc: "全部技术分类逐层展开（思维导图式），点击任意节点查看该分类下的题目。" },
    { id: "pos", label: "覆盖岗位", icon: "briefcase", desc: "岗位按「时代阶段 → 岗位族 → 具体岗位」展开，点击进入岗位题库。" },
    { id: "ai", label: "AI 生成题", icon: "sparkles", desc: "AI 生成的题目按技术分类归组，并给出全库题目的来源构成。" }
  ];

  const P = {};
  window.Panorama = P;

  /* ---------------- 小工具 ---------------- */
  function norm(v) { return VIEWS.some(x => x.id === v) ? v : "all"; }
  function esc(s) { return U.esc(s == null ? "" : String(s)); }
  function pct(n, total) { return total ? (n / total * 100).toFixed(1) + "%" : "0%"; }
  function isDark() {
    const t = (App && App.getTheme) ? App.getTheme() : "system";
    if (t === "dark") return true;
    if (t === "light") return false;
    try { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; }
  }
  /* 23 色调色板：保证 21 个一级分类颜色区分明显 */
  const PALETTE = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#16A34A", "#0891B2", "#CA8A04",
    "#DC2626", "#4F46E5", "#059669", "#D97706", "#9333EA", "#0D9488", "#E11D48", "#65A30D",
    "#1D4ED8", "#BE185D", "#B45309", "#0F766E", "#6D28D9", "#A16207", "#475569", "#9CA3AF"];
  function palette(i) { return PALETTE[i % PALETTE.length]; }

  /* ---------------- 页面骨架 ---------------- */
  function tabsHtml(cur) {
    return `<div class="panorama-tabs">${VIEWS.map(v =>
      `<a class="panorama-tab${v.id === cur ? " active" : ""}" href="#/panorama?view=${v.id}">${U.icon(v.icon)}<span>${esc(v.label)}</span></a>`
    ).join("")}</div>`;
  }

  P.html = function (view) {
    const v = norm(view);
    const cur = VIEWS.find(x => x.id === v) || VIEWS[0];
    return `
      <div class="breadcrumb">
        <a href="#/">首页</a><span class="sep">/</span><span>题库全景</span><span class="sep">/</span><span>${esc(cur.label)}</span>
      </div>
      <h1>${U.icon(cur.icon)} 题库全景 · ${esc(cur.label)}</h1>
      <p class="secondary">${esc(cur.desc)}</p>
      ${tabsHtml(v)}
      <div class="panorama-body" id="panorama-body"><div class="pan-loading">正在生成全景图…</div></div>
    `;
  };

  P.afterRender = function (view) {
    const box = document.getElementById("panorama-body");
    if (!box) return;
    const v = norm(view);
    try {
      if (v === "cat") renderCat(box);
      else if (v === "pos") renderPos(box);
      else if (v === "ai") renderAI(box);
      else renderAll(box);
    } catch (e) {
      box.innerHTML = `<div class="empty"><h3>全景图渲染失败</h3><p class="secondary">${esc(e && e.message || e)}</p></div>`;
      if (window.console) console.error("[panorama]", e);
    }
  };

  /* =======================================================================
   *  视图一：题库全景（旭日图）
   * ===================================================================== */
  function renderAll(box) {
    const qs = S.questions || [];
    const tree = S.categoryTree();
    const total = qs.length;
    const published = qs.filter(q => q.status === "published").length;
    const topWithQ = tree.filter(c => (c.count || 0) > 0);
    let allWithQ = 0;
    (function walk(ns) { ns.forEach(n => { if ((n.count || 0) > 0) allWithQ++; walk(n.children || []); }); })(tree);
    /* 未挂在任何分类下的题目（历史数据残留），单独成环，保证「题目总数」对得上 */
    const orphan = qs.filter(q => q.categoryId == null);

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num">${total}</div><div class="pan-sum-label">题目总数</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-success)">${published}</div><div class="pan-sum-label">已发布</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${topWithQ.length}</div><div class="pan-sum-label">技术体系（一级）</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${Math.max(allWithQ - topWithQ.length, 0)}</div><div class="pan-sum-label">细分技术点（有题）</div></div>
      </div>

      <div class="card panorama-chart-card">
        <div class="panorama-chart-head">
          <div>
            <b>技术体系分布全景</b>
            <div class="muted" style="font-size:12px;line-height:1.5">
              内圈 = 一级技术体系，外圈 = 细分技术点；「综合题」指直接挂在该体系下、不属于任何细分技术点的题目${orphan.length ? "；「未归类」指尚未挂到任何分类的题目" : ""}。点击任意色块直达题目列表。
            </div>
          </div>
        </div>
        <div id="panorama-chart" class="panorama-chart"></div>
      </div>

      <div class="section-head"><h2>技术体系速览</h2><a class="more" href="#/panorama?view=cat">树形展开 →</a></div>
      <div class="grid grid-cols-auto">
        ${topWithQ.sort((a, b) => b.count - a.count).map(c => `
          <a class="card card-hover pan-chip" href="#/category?cat=${c.id}">
            <div class="pan-chip-ic">${c.icon ? esc(c.icon) : "📁"}</div>
            <div class="pan-chip-name">${esc(c.name)}</div>
            <div class="pan-chip-num">${c.count} 题 · ${pct(c.count, total)}</div>
          </a>`).join("")}
        ${orphan.length ? `
          <a class="card card-hover pan-chip" href="#/questions?nocat=1">
            <div class="pan-chip-ic">🗃️</div>
            <div class="pan-chip-name">未归类</div>
            <div class="pan-chip-num">${orphan.length} 题 · ${pct(orphan.length, total)}</div>
          </a>` : ""}
      </div>
    `;

    /* echarts 大库按需加载；加载失败时上方速览区依然可用 */
    U.loadScript("echarts", U.ECHARTS_URL).then(() => {
      const holder = document.getElementById("panorama-chart");
      if (!holder || !window.echarts) return;
      holder.classList.add("chart-fade");
      const dark = isDark();
      const chart = echarts.init(holder);
      if (App && App.registerChart) App.registerChart(chart);
      const data = buildSunburst(topWithQ.slice().sort((a, b) => b.count - a.count));
      if (orphan.length) {
        data.push({
          name: "未归类", value: orphan.length, realCount: orphan.length,
          goto: "/questions?nocat=1",
          itemStyle: { color: "#94A3B8" },
          label: { color: dark ? "#cbd5e1" : "#475569" }
        });
      }
      chart.setOption({
        tooltip: {
          trigger: "item",
          confine: true,
          backgroundColor: dark ? "#1e293b" : "#fff",
          borderColor: dark ? "#334155" : "#e2e8f0",
          textStyle: { color: dark ? "#e2e8f0" : "#334155", fontSize: 12 },
          formatter: function (p) {
            const c = (p.data && p.data.realCount != null) ? p.data.realCount : (p.value || 0);
            const path = (p.treePathInfo || []).slice(1).map(x => x.name).join(" › ");
            return "<b>" + esc(p.name) + "</b><br/>" + esc(path) + "<br/>" + c + " 题 · 占全库 " + pct(c, total);
          }
        },
        series: [{
          type: "sunburst",
          data: data,
          radius: [0, "96%"],
          center: ["50%", "50%"],
          sort: null,
          nodeClick: false,
          emphasis: { focus: "ancestor" },
          levels: [
            {},
            {
              r0: "16%", r: "50%",
              label: { rotate: "tangential", fontSize: 11, minAngle: 12 },
              itemStyle: { borderWidth: 2, borderColor: dark ? "#0f172a" : "#ffffff" }
            },
            {
              r0: "51%", r: "84%",
              label: { rotate: "radial", fontSize: 10, minAngle: 18 },
              itemStyle: { borderWidth: 1.5, borderColor: dark ? "#0f172a" : "#ffffff" }
            },
            {
              r0: "85%", r: "92%",
              label: { position: "outside", fontSize: 9 },
              itemStyle: { borderWidth: 1, borderColor: dark ? "#0f172a" : "#ffffff" }
            }
          ]
        }]
      });
      chart.on("click", function (params) {
        const d = params.data || {};
        if (d.goto) { App.go(d.goto); return; }
        if (d.id != null) { App.go("/category?cat=" + d.id); return; }
        /* 兜底：按名字反查分类 */
        const c = S.getCategoryByName(String(params.name).replace(/（综合）$/, ""));
        if (c) App.go("/category?cat=" + c.id);
      });
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      }
    }).catch(() => {
      const holder = document.getElementById("panorama-chart");
      if (holder) holder.innerHTML = `<div class="pan-loading muted">图表库加载失败，可直接使用上方「技术体系速览」</div>`;
    });
  }

  /* 旭日图数据：父节点不设 value，由子节点累加，保证比例精确 */
  function buildSunburst(tree) {
    function toNode(c, depth, color) {
      const kids = (c.children || []).filter(k => (k.count || 0) > 0);
      const direct = S.catDirect[c.id] || 0;
      const node = { name: c.name, id: c.id, realCount: c.count || 0 };
      if (!kids.length) {
        node.value = Math.max(c.count || 0, 1);
        if (color) node.itemStyle = { color: color };
        return node;
      }
      node.children = kids.map(k => toNode(k, depth + 1));
      if (direct > 0) {
        node.children.push({
          name: "综合题", id: c.id, value: direct, realCount: direct,
          itemStyle: { color: color ? shade(color, 34) : undefined, opacity: .72 }
        });
      }
      if (color) node.itemStyle = { color: color };
      return node;
    }
    return tree.map((c, i) => toNode(c, 0, palette(i)));
  }

  function shade(hex, percent) {
    const n = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 255) + amt);
    const b = Math.min(255, (n & 255) + amt);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* =======================================================================
   *  视图二：技术分类树
   * ===================================================================== */
  function renderCat(box) {
    const tree = S.categoryTree();
    let total = 0, withQ = 0;
    (function walk(ns) { ns.forEach(n => { total++; if ((n.count || 0) > 0) withQ++; walk(n.children || []); }); })(tree);

    box.innerHTML = `
      <div class="panorama-toolbar">
        <button class="btn btn-sm" id="pan-expand-all">${U.icon("plus")} 展开全部</button>
        <button class="btn btn-sm" id="pan-collapse-all">${U.icon("x")} 折叠全部</button>
        <label class="pan-check"><input type="checkbox" id="pan-only-q"> 只看有题目的分类</label>
        <span class="muted" style="font-size:12px">共 ${total} 个分类，其中 ${withQ} 个已有题目；点击节点查看该分类下的全部题目（含子分类）</span>
      </div>
      <div class="panorama-tree" id="pan-cat-tree">${tree.map(n => catNodeHtml(n, 0)).join("")}</div>
    `;

    const root = document.getElementById("pan-cat-tree");
    /* 一级分类默认展开，更利于「一概全貌」 */
    Array.prototype.forEach.call(root.querySelectorAll(":scope > .pan-node > .pan-row"), row => openRow(row, true));

    root.addEventListener("click", function (e) {
      const twist = e.target.closest(".twist");
      if (twist && !twist.classList.contains("twist-empty")) {
        e.stopPropagation();
        toggleRow(twist.closest(".pan-row"));
        return;
      }
      const row = e.target.closest(".pan-row");
      if (row && row.dataset.id) App.go("/category?cat=" + row.dataset.id);
    });
    document.getElementById("pan-expand-all").onclick = () => setTreeOpen(root, true);
    document.getElementById("pan-collapse-all").onclick = () => setTreeOpen(root, false);
    document.getElementById("pan-only-q").onchange = e => root.classList.toggle("pan-only-q", !!e.target.checked);
  }

  function catNodeHtml(n, depth) {
    const kids = n.children || [];
    const cnt = n.count || 0;
    const hasKids = kids.length > 0;
    return `<div class="pan-node">
      <div class="tree-row pan-row${cnt ? "" : " pan-empty"}" data-id="${n.id}" title="${esc(n.name)}${cnt ? "：" + cnt + " 题" : "：暂无题目"}" style="padding-left:${8 + depth * 20}px">
        ${hasKids
          ? `<span class="twist">${U.icon("chevronRight")}</span>`
          : `<span class="twist twist-empty"></span>`}
        <span class="tree-icon">${n.icon ? esc(n.icon) : (hasKids ? "📁" : "🏷️")}</span>
        <span class="tree-label">${esc(n.name)}</span>
        ${cnt
          ? `<span class="tree-count">${cnt} 题</span>`
          : `<span class="tree-count tree-count-zero">待补充</span>`}
      </div>
      ${hasKids ? `<div class="pan-children hidden">${kids.map(k => catNodeHtml(k, depth + 1)).join("")}</div>` : ""}
    </div>`;
  }

  /* 展开/折叠一行：open 类挂在 .pan-row 上（复用侧边栏 .tree-row.open .twist 的旋转样式） */
  function openRow(row, open) {
    if (!row) return;
    const wrap = row.parentElement.querySelector(":scope > .pan-children");
    if (wrap) wrap.classList.toggle("hidden", !open);
    row.classList.toggle("open", open);
  }
  function toggleRow(row) { if (row) openRow(row, !row.classList.contains("open")); }

  function setTreeOpen(root, open) {
    Array.prototype.forEach.call(root.querySelectorAll(".pan-row"), row => {
      if (row.querySelector(":scope > .twist:not(.twist-empty)")) openRow(row, open);
    });
  }

  /* =======================================================================
   *  视图三：覆盖岗位
   * ===================================================================== */
  function renderPos(box) {
    const stages = S.positionsByStage();
    const all = S.positions || [];
    const visible = all.filter(p => !S.isHiddenPosition(p));
    let covered = 0;
    visible.forEach(p => { if (S.questionCountForPosition(p) > 0) covered++; });

    const html = stages.map(s => {
      /* 阶段内按 category（岗位族）归组；category 为空的直接挂在阶段下 */
      const groups = [];
      const map = new Map();
      s.list.forEach(p => {
        const key = p.category || "";
        if (!map.has(key)) { map.set(key, []); groups.push(key); }
        map.get(key).push(p);
      });
      const stageCount = s.list.length;
      return `<div class="pan-node">
        <div class="tree-row pan-row stage-row">
          <span class="twist">${U.icon("chevronRight")}</span>
          <span class="tree-icon">🗂️</span>
          <span class="tree-label">${esc(s.stage)}</span>
          <span class="tree-tag">${esc(s.list[0] && s.list[0].tag || "")}</span>
          <span class="tree-count">${stageCount} 个岗位</span>
        </div>
        <div class="pan-children hidden">
          ${groups.map(g => {
            const list = map.get(g);
            return g
              ? `<div class="pan-node">
                   <div class="tree-row pan-row group-row" style="padding-left:28px">
                     <span class="twist">${U.icon("chevronRight")}</span>
                     <span class="tree-icon">📂</span>
                     <span class="tree-label">${esc(g)}</span>
                     <span class="tree-count">${list.length} 个</span>
                   </div>
                   <div class="pan-children hidden">${list.map(p => posLeafHtml(p, 48)).join("")}</div>
                 </div>`
              : list.map(p => posLeafHtml(p, 28)).join("");
          }).join("")}
        </div>
      </div>`;
    }).join("");

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num">${all.length}</div><div class="pan-sum-label">岗位总数</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-success)">${covered}</div><div class="pan-sum-label">已有题目的岗位</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${stages.length}</div><div class="pan-sum-label">时代阶段</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${visible.length}</div><div class="pan-sum-label">可进入的岗位</div></div>
      </div>
      <div class="panorama-toolbar">
        <button class="btn btn-sm" id="pan-pos-expand">${U.icon("plus")} 展开全部</button>
        <button class="btn btn-sm" id="pan-pos-collapse">${U.icon("x")} 折叠全部</button>
        <span class="muted" style="font-size:12px">点击岗位进入岗位题库；灰色岗位为与技术分类同名的占位项，已隐藏入口</span>
      </div>
      <div class="panorama-tree" id="pan-pos-tree">${html}</div>
    `;

    const root = document.getElementById("pan-pos-tree");
    Array.prototype.forEach.call(root.querySelectorAll(":scope > .pan-node > .pan-row"), row => openRow(row, true));

    root.addEventListener("click", function (e) {
      const twist = e.target.closest(".twist");
      if (twist && !twist.classList.contains("twist-empty")) {
        e.stopPropagation();
        toggleRow(twist.closest(".pan-row"));
      }
    });
    document.getElementById("pan-pos-expand").onclick = () => setTreeOpen(root, true);
    document.getElementById("pan-pos-collapse").onclick = () => setTreeOpen(root, false);
  }

  function posLeafHtml(p, pad) {
    const n = S.questionCountForPosition(p);
    const hidden = S.isHiddenPosition(p);
    const name = S.posFullName(p);
    const inner = `
      <span class="twist twist-empty"></span>
      <span class="tree-icon">💼</span>
      <span class="tree-label">${esc(name)}</span>
      ${p.demand ? `<span class="tree-tag">需求${esc(p.demand)}</span>` : ""}
      <span class="tree-count">${n} 题</span>`;
    if (hidden) {
      return `<div class="tree-row pan-row leaf-row hidden-pos" style="padding-left:${pad}px" title="${esc(name)}：该名称与技术分类同名，已隐藏入口">${inner}</div>`;
    }
    return `<a class="tree-row pan-row leaf-row" href="#/position/${p.id}" style="padding-left:${pad}px" title="${esc(name)}：${n} 题">${inner}</a>`;
  }

  /* =======================================================================
   *  视图四：AI 生成题
   * ===================================================================== */
  function renderAI(box) {
    const all = S.questions || [];
    const aiQs = all.filter(q => q.source === "ai");

    /* 来源归桶：真实 URL 统一算「外部文档」 */
    const bucketOf = s => {
      if (!s) return "other";
      if (/^https?:\/\//i.test(s)) return "url";
      if (s === "ai" || s === "manual" || s === "seed" || s === "principles") return s;
      if (s === "import") return "other";
      return "other";
    };
    const B = [
      { k: "ai", label: "AI 生成", color: "var(--c-ai)", desc: "由 AI 按主题自动产出" },
      { k: "manual", label: "人工录入", color: "var(--c-primary)", desc: "手工整理录入" },
      { k: "seed", label: "内置种子", color: "#10B981", desc: "随站点内置的初始题库" },
      { k: "principles", label: "原理整理", color: "#8B5CF6", desc: "按技术原理体系化整理" },
      { k: "url", label: "外部文档", color: "#F59E0B", desc: "来源为可访问的官方文档链接" },
      { k: "other", label: "其他 / 未标注", color: "#94A3B8", desc: "导入或未标注来源" }
    ];
    const cnt = {};
    all.forEach(q => { const k = bucketOf(q.source); cnt[k] = (cnt[k] || 0) + 1; });
    const max = Math.max.apply(null, B.map(b => cnt[b.k] || 0).concat([1]));

    /* AI 题目按技术分类归组 */
    const groups = [];
    const gmap = new Map();
    aiQs.forEach(q => {
      const key = q.catName || (q.catPath && q.catPath[0]) || "未分类";
      if (!gmap.has(key)) { gmap.set(key, []); groups.push(key); }
      gmap.get(key).push(q);
    });

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${aiQs.length}</div><div class="pan-sum-label">AI 生成题</div></div>
        <div class="pan-sum"><div class="pan-sum-num">${pct(aiQs.length, all.length)}</div><div class="pan-sum-label">占全库比例</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-primary)">${groups.length}</div><div class="pan-sum-label">覆盖技术体系</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${all.length - aiQs.length}</div><div class="pan-sum-label">其他来源题目</div></div>
      </div>

      <div class="card" style="padding:18px">
        <b>全库题目来源构成</b>
        <div class="pan-src-list">
          ${B.map(b => {
            const n = cnt[b.k] || 0;
            return `<a class="pan-src" href="#/questions?source=${encodeURIComponent(b.k === "url" ? "url" : b.k)}" title="${esc(b.desc)}">
              <span class="pan-src-dot" style="background:${b.color}"></span>
              <span class="pan-src-label">${esc(b.label)}</span>
              <span class="pan-src-bar"><i style="width:${(n / max * 100).toFixed(1)}%;background:${b.color}"></i></span>
              <span class="pan-src-num">${n}</span>
            </a>`;
          }).join("")}
        </div>
        <div class="muted" style="font-size:12px;margin-top:10px">点击来源可查看对应题目（外部文档来源按「有链接」筛出）</div>
      </div>

      <div class="section-head" style="margin-top:22px"><h2>AI 生成题目清单</h2><span class="muted" style="font-size:12px">共 ${aiQs.length} 题</span></div>
      ${aiQs.length
        ? groups.map(g => `
            <div class="panorama-ai">
              <div class="ai-group">
                <div class="ai-group-title">${U.icon("layers")} ${esc(g)} <span class="muted">(${gmap.get(g).length})</span></div>
                <div class="grid grid-cols-2">
                  ${gmap.get(g).map(q => `
                    <a class="card card-hover q-card" href="#/question/${q.id}">
                      <div class="q-title">${esc(q.title)}</div>
                      <div class="q-excerpt">${esc(String(q.body || "").replace(/[#*`>]/g, "").slice(0, 80))}</div>
                      <div class="q-meta">
                        <span class="tag diff-${esc(q.difficulty)}">${esc(q.difficulty)}</span>
                        ${q.catName ? `<span class="tag tag-primary">${esc(q.catName)}</span>` : ""}
                        ${(q.positionNames || []).slice(0, 2).map(p => `<span class="tag">${esc(p)}</span>`).join("")}
                      </div>
                    </a>`).join("")}
                </div>
              </div>
            </div>`).join("")
        : `<div class="empty"><h3>暂无 AI 生成的题目</h3><p class="secondary">可在管理后台用 AI 生成题目后回到这里查看。</p></div>`}
    `;
  }
})();
