/* =========================================================================
 *  panorama.js — 题库全景图
 *  入口：首页 4 个统计卡片 → #/panorama?view=all | cat | pos | ai
 *    all  题库全景：力导向星云图，节点大小 = 题目数量，颜色分属 21 个技术体系
 *    cat  技术分类：所有有题分类收进一张网状图，颜色按一级体系分组
 *    pos  覆盖岗位：岗位按 8 个时代阶段聚成星簇，节点大小 = 题目数量
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
    { id: "all", label: "题库全景", icon: "pieChart", desc: "节点网状漂浮，大小 = 题目数量，颜色分属 21 个技术体系；拖拽可旋转、滚轮可缩放，点击任意节点直达对应题目列表。" },
    { id: "cat", label: "技术分类", icon: "layers", desc: "所有有题目的技术分类收进一张网状图，颜色按一级体系分组，点击节点查看该分类（含子分类）下的题目。" },
    { id: "pos", label: "覆盖岗位", icon: "briefcase", desc: "岗位按 8 个时代阶段聚成星簇，节点大小 = 题目数量，点击岗位进入岗位题库。" },
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
  /* 8 个时代阶段配色 */
  const STAGE_COLORS = ["#2563EB", "#059669", "#D97706", "#DB2777", "#7C3AED", "#0891B2", "#DC2626", "#65A30D"];
  /* 题数 → 节点直径（sqrt 缩放，避免大头挤压） */
  function sizeOf(n) { const v = Math.max(n || 0, 1); return Math.round(12 + Math.sqrt(v) * 5.4); }
  function catsWithColor(names) { return names.map((n, i) => ({ name: n, itemStyle: { color: palette(i) } })); }

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

  /* ---------------- 力导向图通用装配 ---------------- */
  function setupGraph(chart, opt) {
    const dark = !!opt.dark;
    const labelColor = dark ? "#e2e8f0" : "#334155";
    const borderColor = dark ? "#0b1220" : "#ffffff";
    const cats = opt.categories || [];
    chart.setOption({
      tooltip: {
        confine: true,
        backgroundColor: dark ? "#1e293b" : "#ffffff",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#e2e8f0" : "#334155", fontSize: 12 },
        formatter: function (p) {
          const d = p.data || {};
          if (d.value == null) return esc(d.name || "");
          return "<b>" + esc(d.name) + "</b><br/>" + d.value + " 题";
        }
      },
      legend: {
        show: true, type: "scroll", orient: "horizontal", bottom: 2, left: "center",
        itemWidth: 10, itemHeight: 10, itemGap: 10,
        textStyle: { color: labelColor, fontSize: 11 }, inactiveColor: "#94a3b8",
        data: cats.map(c => c.name)
      },
      series: [{
        type: "graph", layout: "force", roam: true, draggable: true,
        data: opt.nodes, links: opt.links, categories: cats,
        force: {
          repulsion: opt.repulsion || 200,
          edgeLength: opt.edgeLength || [55, 130],
          gravity: 0.05, friction: 0.12, layoutAnimation: true
        },
        scaleLimit: { min: 0.35, max: 4 },
        label: { show: true, position: "right", fontSize: 10, color: labelColor, formatter: p => p.data.name },
        lineStyle: { color: "source", opacity: 0.18, curveness: 0.08, width: 1 },
        emphasis: { focus: "adjacency", label: { fontSize: 13, fontWeight: "bold" }, lineStyle: { width: 2.5, opacity: 0.5 } },
        itemStyle: { borderColor: borderColor, borderWidth: 1.2, shadowBlur: 10, shadowColor: "rgba(15,23,42,0.20)" }
      }]
    });
    chart.on("click", function (params) {
      const d = params.data || {};
      if (d._goto) { App.go(d._goto); return; }
      if (d._catId != null) { App.go("/category?cat=" + d._catId); return; }
      if (d._posId != null) { App.go("/position/" + d._posId); return; }
    });
  }

  function mountForce(box, build) {
    U.loadScript("echarts", U.ECHARTS_URL).then(() => {
      const holder = document.getElementById("panorama-chart");
      if (!holder || !window.echarts) return;
      const dark = isDark();
      if (dark) holder.classList.add("theme-dark");
      const chart = echarts.init(holder);
      if (App && App.registerChart) App.registerChart(chart);
      build(chart, dark);
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      }
    }).catch(() => {
      const holder = document.getElementById("panorama-chart");
      if (holder) holder.innerHTML = `<div class="pan-loading muted">图表库加载失败，可使用上方速览卡片</div>`;
    });
  }

  /* =======================================================================
   *  视图一：题库全景（力导向星云图）
   * ===================================================================== */
  function renderAll(box) {
    const qs = S.questions || [];
    const tree = S.categoryTree();
    const total = qs.length;
    const published = qs.filter(q => q.status === "published").length;
    const topWithQ = tree.filter(c => (c.count || 0) > 0);
    let subCount = 0;
    topWithQ.forEach(c => { subCount += (c.children || []).filter(k => (k.count || 0) > 0).length; });
    const orphan = qs.filter(q => q.categoryId == null);

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num">${total}</div><div class="pan-sum-label">题目总数</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-success)">${published}</div><div class="pan-sum-label">已发布</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${topWithQ.length}</div><div class="pan-sum-label">技术体系（一级）</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${subCount}</div><div class="pan-sum-label">细分技术点（有题）</div></div>
      </div>

      <div class="card panorama-chart-card">
        <div class="panorama-chart-head">
          <div><b>技术体系分布全景（力导向星云图）</b>
            <div class="muted" style="font-size:12px;line-height:1.5">
              节点大小 = 题目数量，颜色 = 21 个技术体系；拖拽旋转、滚轮缩放，点击任意节点直达题目列表${orphan.length ? "；灰色「未归类」为尚未挂到任何分类的题目" : ""}。
            </div>
          </div>
        </div>
        <div id="panorama-chart" class="panorama-chart"></div>
      </div>

      <div class="section-head"><h2>技术体系速览</h2><a class="more" href="#/panorama?view=cat">查看分类星云 →</a></div>
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

    mountForce(box, function (chart, dark) {
      const cats = catsWithColor(topWithQ.map(c => c.name));
      const nodes = [], links = [];
      topWithQ.forEach((c, i) => {
        nodes.push({ id: "c" + c.id, name: c.name, value: c.count, symbolSize: sizeOf(c.count), category: i, _catId: c.id, itemStyle: { borderWidth: 2.4, shadowBlur: 18 } });
        (c.children || []).filter(k => (k.count || 0) > 0).forEach(sub => {
          nodes.push({ id: "c" + sub.id, name: sub.name, value: sub.count, symbolSize: sizeOf(sub.count), category: i, _catId: sub.id });
          links.push({ source: "c" + c.id, target: "c" + sub.id });
        });
      });
      if (orphan.length) {
        cats.push({ name: "未归类", itemStyle: { color: "#94A3B8" } });
        nodes.push({ id: "orphan", name: "未归类", value: orphan.length, symbolSize: sizeOf(orphan.length), category: cats.length - 1, _goto: "/questions?nocat=1" });
      }
      setupGraph(chart, { nodes: nodes, links: links, categories: cats, dark: dark, repulsion: 210, edgeLength: [60, 140] });
    });
  }

  /* =======================================================================
   *  视图二：技术分类（力导向星云图）
   * ===================================================================== */
  function renderCat(box) {
    const tree = S.categoryTree();
    let total = 0, withQ = 0;
    (function walk(ns) { ns.forEach(n => { total++; if ((n.count || 0) > 0) withQ++; walk(n.children || []); }); })(tree);

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num">${total}</div><div class="pan-sum-label">分类总数</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-success)">${withQ}</div><div class="pan-sum-label">已有题目</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${tree.length}</div><div class="pan-sum-label">一级技术体系</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${total - tree.length}</div><div class="pan-sum-label">细分技术点</div></div>
      </div>
      <div class="card panorama-chart-card">
        <div class="panorama-chart-head">
          <div><b>技术分类星云图</b>
            <div class="muted" style="font-size:12px;line-height:1.5">所有有题目的分类收进一张网，颜色按一级体系分组；点击节点查看该分类（含子分类）下的题目。底部图例可单独显隐某个体系。</div>
          </div>
        </div>
        <div id="panorama-chart" class="panorama-chart"></div>
      </div>
    `;

    mountForce(box, function (chart, dark) {
      const cats = catsWithColor(tree.map(c => c.name));
      const nodes = [], links = [];
      function rec(n, rootIdx, parentId) {
        if ((n.count || 0) <= 0) return;
        const isTop = parentId == null;
        nodes.push({ id: "c" + n.id, name: n.name, value: n.count, symbolSize: sizeOf(n.count), category: rootIdx, _catId: n.id, itemStyle: isTop ? { borderWidth: 2.2, shadowBlur: 16 } : {} });
        if (parentId) links.push({ source: parentId, target: "c" + n.id });
        (n.children || []).forEach(c => rec(c, rootIdx, "c" + n.id));
      }
      tree.forEach((c, i) => rec(c, i, null));
      setupGraph(chart, { nodes: nodes, links: links, categories: cats, dark: dark, repulsion: 180, edgeLength: [45, 120] });
    });
  }

  /* =======================================================================
   *  视图三：覆盖岗位（力导向星云图）
   * ===================================================================== */
  function renderPos(box) {
    const stages = S.positionsByStage();
    const all = S.positions || [];
    const visible = all.filter(p => !S.isHiddenPosition(p));
    let covered = 0;
    visible.forEach(p => { if (S.questionCountForPosition(p) > 0) covered++; });

    box.innerHTML = `
      <div class="panorama-summary">
        <div class="pan-sum"><div class="pan-sum-num">${all.length}</div><div class="pan-sum-label">岗位总数</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-success)">${covered}</div><div class="pan-sum-label">已有题目</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:var(--c-ai)">${stages.length}</div><div class="pan-sum-label">时代阶段</div></div>
        <div class="pan-sum"><div class="pan-sum-num" style="color:#F59E0B">${visible.length}</div><div class="pan-sum-label">可进入岗位</div></div>
      </div>
      <div class="card panorama-chart-card">
        <div class="panorama-chart-head">
          <div><b>岗位星云图</b>
            <div class="muted" style="font-size:12px;line-height:1.5">岗位按 8 个时代阶段聚成星簇，节点大小 = 题目数量；点击岗位进入岗位题库。灰色占位岗位已隐藏入口。</div>
          </div>
        </div>
        <div id="panorama-chart" class="panorama-chart"></div>
      </div>
    `;

    mountForce(box, function (chart, dark) {
      const cats = stages.map((s, i) => ({ name: s.stage, itemStyle: { color: STAGE_COLORS[i % STAGE_COLORS.length] } }));
      const nodes = [], links = [];
      stages.forEach((s, i) => {
        let sum = 0;
        s.list.forEach(p => { if (!S.isHiddenPosition(p)) sum += S.questionCountForPosition(p); });
        nodes.push({ id: "stage" + i, name: s.stage, value: sum, symbolSize: 34, category: i, itemStyle: { borderWidth: 2.4, shadowBlur: 16 } });
        s.list.forEach(p => {
          if (S.isHiddenPosition(p)) return;
          const n = S.questionCountForPosition(p);
          nodes.push({ id: "p" + p.id, name: S.posFullName(p), value: n, symbolSize: sizeOf(n), category: i, _posId: p.id });
          links.push({ source: "stage" + i, target: "p" + p.id });
        });
      });
      setupGraph(chart, { nodes: nodes, links: links, categories: cats, dark: dark, repulsion: 240, edgeLength: [50, 150] });
    });
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
