/*
 * 题库全景图（panorama）
 * 视图：
 *   - all : 技术演进轨道图（由内到外：基石 → 系统开发 → 架构工程 → 数据与领域前沿）
 *   - cat : 同上，但把每个技术体系下的「细分技术点」作为卫星节点收进同一张网
 *   - pos : 岗位演进轨道图（按 8 个时代阶段由内到外环绕）
 *   - ai  : 来源构成 + AI 生成题清单
 * 设计目标：层次清晰（同心环）、按技术/岗位演进逻辑组织（由内到外）、立体（渐变背景 + 节点辉光）、不乱（固定极坐标布局，非力导向随机）
 * 依赖：utils.js(U) / services.js(Services) / app.js(App)，echarts 按需加载
 */
(function () {
  const S = window.Services, U = window.U, App = window.App;

  /* 注册饼图图标（若尚未存在） */
  if (U && U.ICONS && !U.ICONS.pieChart) {
    U.ICONS.pieChart = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12 2.1 5.3a10 10 0 0 0 0 13.4L12 12z"/><path d="M12 12l8 5.7A10 10 0 0 0 22 12a10 10 0 0 0-2-5.7L12 12z"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg>';
  }

  /* 四个技术演进层（由内到外） */
  const LAYERS = [
    { name: "基石技术", color: "#3b82f6", desc: "一切的地基：组成原理、编程语言、操作系统、计算机网络" },
    { name: "系统与应用开发", color: "#10b981", desc: "把能力落成系统：数据库、前后端、移动端" },
    { name: "架构与工程", color: "#f59e0b", desc: "让系统可扩展可交付：分布式、云原生、工程化与测试" },
    { name: "数据与智能 · 领域前沿", color: "#8b5cf6", desc: "当下与未来：AI、大数据、安全、IoT、图形、区块链等" }
  ];
  /* 一级分类名 → 层号（数据稳定，按名映射更稳妥） */
  const LAYER_BY_NAME = {
    "计算机科学基础": 0, "编程语言与编程基础": 0, "操作系统与系统运维": 0, "计算机网络与协议": 0,
    "数据库与数据存储": 1, "后端开发与服务端框架": 1, "Web前端开发": 1, "移动端与跨平台开发": 1,
    "分布式系统与微服务": 2, "云原生与DevOps": 2, "软件工程与设计模式": 2, "软件测试": 2,
    "人工智能与机器学习": 3, "大数据与数据工程": 3, "信息安全与网络安全": 3, "嵌入式与物联网": 3,
    "游戏开发与图形图像": 3, "音视频与流媒体": 3, "区块链与Web3": 3, "产品与项目管理": 3, "通用面试能力与软技能": 3
  };
  /* 8 个时代阶段的配色（由内到外） */
  const STAGE_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#a855f7", "#6366f1", "#14b8a6", "#64748b"];

  function layerOf(name) { return LAYER_BY_NAME[name] != null ? LAYER_BY_NAME[name] : 3; }
  function pct(n, t) { return t ? Math.round((n / t) * 100) + "%" : "0%"; }
  function esc(s) { return U && U.esc ? U.esc(s) : String(s == null ? "" : s); }
  function cssVar(n) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(n);
      return (v && v.trim()) || getComputedStyle(document.body).getPropertyValue(n).trim();
    } catch (e) { return ""; }
  }
  function hexA(hex, a) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return hex;
    return "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + "," + a + ")";
  }
  function sizeFor(count, k) {
    k = k || 3.2;
    return Math.max(16, Math.min(70, 12 + Math.sqrt(count || 0) * k));
  }

  /* ============================ 对外接口 ============================ */
  const VIEWS = [
    { id: "all", label: "题库全景", icon: "pieChart", desc: "按技术演进由内到外展开的轨道图" },
    { id: "cat", label: "技术分类", icon: "layers", desc: "21 个技术体系 + 细分技术点，按演进分层" },
    { id: "pos", label: "覆盖岗位", icon: "briefcase", desc: "岗位按时代阶段由内到外环绕" },
    { id: "ai", label: "AI 生成题", icon: "sparkles", desc: "来源构成与 AI 生成题清单" }
  ];

  function tabsHtml(active) {
    return '<div class="panorama-tabs">' + VIEWS.map(v =>
      '<a class="panorama-tab' + (v.id === active ? " active" : "") + '" href="#/panorama?view=' + v.id + '">' +
      (U.icon ? U.icon(v.icon) : "") + "<span>" + esc(v.label) + "</span></a>"
    ).join("") + "</div>";
  }

  function breadcrumb(view) {
    const v = VIEWS.filter(x => x.id === view)[0] || VIEWS[0];
    return '<div class="breadcrumb"><a href="#/">' + U.icon("home") + " 首页</a><span>/</span><span>题库全景</span><span>/</span><b>" + esc(v.label) + "</b></div>";
  }

  P_html();

  function P_html() {
    window.Panorama = {
      html: function (view) {
        view = VIEWS.some(v => v.id === view) ? view : "all";
        return breadcrumb(view) +
          '<h1 class="page-title">题库全景</h1>' +
          '<p class="muted" style="margin:-6px 0 14px">一眼看全 ' + (S.questions ? S.questions.length : "") + ' 道题都分布在哪些技术、哪些岗位；点击任意节点直达题目列表。</p>' +
          tabsHtml(view) +
          '<div class="panorama-body" id="panorama-body"></div>';
      },
      afterRender: function (view) {
        const box = document.getElementById("panorama-body");
        if (!box) return;
        view = VIEWS.some(v => v.id === view) ? view : "all";
        if (view === "all") renderAll(box);
        else if (view === "cat") renderCat(box);
        else if (view === "pos") renderPos(box);
        else renderAI(box);
      }
    };
  }

  /* ============================ 通用：轨道图绘制 ============================ */
  function drawOrbit(box, nodes, links, opt) {
    opt = opt || {};
    const holder = document.createElement("div");
    holder.className = "panorama-chart pan-orbit-chart";
    const wrap = document.createElement("div");
    wrap.className = "pan-orbit-wrap";
    wrap.innerHTML = '<div class="pan-orbit-rings"><span></span><span></span><span></span><span></span></div>';
    wrap.appendChild(holder);
    box.appendChild(wrap);

    U.loadScript("echarts", U.ECHARTS_URL).then(function () {
      if (!holder || !window.echarts) return;
      const chart = echarts.init(holder, null, { renderer: "canvas" });
      if (App && App.registerChart) App.registerChart(chart);
      const labelColor = cssVar("--text") || "#334155";
      const edgeColor = cssVar("--border") || "#cbd5e1";
      chart.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15,23,42,.92)",
          borderWidth: 0,
          padding: [8, 12],
          textStyle: { color: "#e5e7eb", fontSize: 12 },
          formatter: function (p) {
            const d = p.data || {};
            if (d._hub) return "<b>IT 技术全景</b><br/>21 个技术体系 · " + (S.questions ? S.questions.length : "") + " 道题";
            if (d._stage) return "<b>" + esc(d.short) + "</b><br/>该时代的岗位簇";
            const nm = d.short || d.name || "";
            const c = d.count != null ? d.count : "";
            const tag = d._posId != null ? "岗位" : (d._sub ? (d.layer != null ? LAYERS[d.layer].name + " · 细分" : "细分技术") : (d.layer != null ? LAYERS[d.layer].name : "技术体系"));
            return "<b>" + esc(nm) + "</b><br/>" + esc(tag) + " · " + c + " 题";
          }
        },
        series: [{
          type: "graph",
          layout: "none",
          roam: true,
          data: nodes,
          links: links,
          edgeSymbol: ["none", "none"],
          lineStyle: { color: edgeColor, opacity: 0.32, width: 1, curveness: 0 },
          label: {
            show: true, position: "bottom", fontSize: 11, color: labelColor,
            formatter: function (p) { return p.data.short || p.data.name; }
          },
          labelLayout: { hideOverlap: true },
          emphasis: { focus: "adjacency", label: { show: true }, lineStyle: { width: 2, opacity: 0.85 } },
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          symbolSize: function (d) { return d.symbolSize || 20; }
        }]
      });
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      } else {
        window.addEventListener("resize", function () { try { chart.resize(); } catch (e) {} });
      }
      chart.on("click", function (params) {
        const d = params.data || {};
        if (d._catId != null) App.go("/category?cat=" + d._catId);
        else if (d._posId != null) App.go("/position/" + d._posId);
      });
    });
  }

  function legendHtml(layers, note) {
    return '<div class="pan-legend">' +
      layers.map(function (l) {
        return '<span class="pan-legend-item"><i style="background:' + l.color + '"></i><b>' + esc(l.name) + "</b><em>" + esc(l.desc) + "</em></span>";
      }).join("") +
      (note ? '<div class="pan-legend-note">' + esc(note) + "</div>" : "") +
      "</div>";
  }

  /* ============================ 数据收集 ============================ */
  function collectTops() {
    const tree = (S.categoryTree && S.categoryTree()) || [];
    return tree.map(function (t) {
      return {
        id: t.id, name: t.name, count: t.count || 0, layer: layerOf(t.name),
        children: (t.children || []).map(function (c) { return { id: c.id, name: c.name, count: c.count || 0 }; })
      };
    });
  }

  /* ============================ 视图：题库全景 / 技术分类 ============================ */
  function ringRadius(layer) { return [34, 64, 94, 124][layer]; }

  function buildTechNodes(includeSubs) {
    const tops = collectTops();
    const nodes = [], links = [];
    nodes.push({
      id: "__hub__", name: "IT 技术全景", x: 0, y: 0, symbolSize: 46,
      itemStyle: { color: "#64748b", shadowBlur: 20, shadowColor: "rgba(100,116,139,.5)" },
      label: { show: true, position: "inside", color: "#fff", fontWeight: 700, fontSize: 12 },
      _hub: true, short: "IT 技术全景"
    });
    const byLayer = [[], [], [], []];
    tops.forEach(function (t) { byLayer[t.layer].push(t); });
    byLayer.forEach(function (grp, L) {
      const n = grp.length, step = 360 / n, off = L * 16;
      grp.forEach(function (t, k) {
        const ang = (off + k * step) * Math.PI / 180;
        const r = ringRadius(L);
        const x = +(r * Math.cos(ang)).toFixed(2), y = +(r * Math.sin(ang)).toFixed(2);
        const color = LAYERS[L].color;
        nodes.push({
          id: "top" + t.id, name: t.name, x: x, y: y, symbolSize: sizeFor(t.count),
          itemStyle: { color: color, shadowBlur: 14, shadowColor: hexA(color, 0.45) },
          _catId: t.id, short: t.name, count: t.count, layer: L, label: { show: true }
        });
        links.push({ source: "__hub__", target: "top" + t.id, lineStyle: { opacity: 0.4, width: 1.2 } });
      });
    });
    if (includeSubs) {
      tops.forEach(function (t) {
        const parent = nodes.filter(function (n) { return n._catId === t.id; })[0];
        if (!parent) return;
        const subs = (t.children || []).filter(function (s) { return s.count > 0; });
        const m = subs.length;
        if (!m) return;
        const ang0 = Math.atan2(parent.y, parent.x);
        const pr = ringRadius(t.layer);
        const totalArc = 34, stepArc = m > 1 ? totalArc / (m - 1) : 0;
        subs.forEach(function (s, k) {
          const a = ang0 + (-totalArc / 2 + k * stepArc) * Math.PI / 180;
          const rr = pr + 16 + (k % 3) * 7;
          const x = +(rr * Math.cos(a)).toFixed(2), y = +(rr * Math.sin(a)).toFixed(2);
          const color = LAYERS[t.layer].color;
          nodes.push({
            id: "sub" + s.id, name: s.name, x: x, y: y,
            symbolSize: Math.max(7, Math.min(24, 8 + Math.sqrt(s.count) * 1.7)),
            itemStyle: { color: color, opacity: 0.82, shadowBlur: 6, shadowColor: hexA(color, 0.3) },
            _catId: s.id, short: s.name, count: s.count, layer: t.layer, label: { show: false }, _sub: true
          });
          links.push({ source: "top" + t.id, target: "sub" + s.id, lineStyle: { opacity: 0.16, width: 0.8 } });
        });
      });
    }
    return { nodes: nodes, links: links };
  }

  function summaryHtml() {
    const tops = collectTops();
    const total = S.questions ? S.questions.length : 0;
    const topsWithQ = tops.filter(function (t) { return t.count > 0; }).length;
    let subWithQ = 0;
    tops.forEach(function (t) { (t.children || []).forEach(function (c) { if (c.count > 0) subWithQ++; }); });
    const cards = [
      { n: total, l: "题目总数" },
      { n: topsWithQ, l: "有题技术体系" },
      { n: subWithQ, l: "有题细分技术" },
      { n: (S.positionsByStage ? S.positionsByStage().reduce(function (a, s) { return a + (s.positions ? s.positions.length : 0); }, 0) : 0), l: "覆盖岗位" }
    ];
    return '<div class="panorama-summary">' + cards.map(function (c) {
      return '<div class="pan-sum"><div class="pan-sum-num">' + c.n + '</div><div class="pan-sum-label">' + esc(c.l) + "</div></div>";
    }).join("") + "</div>";
  }

  function renderAll(box) {
    box.innerHTML = summaryHtml() +
      legendHtml(LAYERS, "由内到外 = 技术演进：基石 → 系统开发 → 架构工程 → 数据与智能/领域前沿。点击节点看该方向的全部题目。") +
      '<div class="pan-loading">轨道图加载中…</div>';
    const g = buildTechNodes(false);
    drawOrbit(box, g.nodes, g.links, {});
  }

  function renderCat(box) {
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">每个技术体系（大节点）周围聚集其细分技术点（小节点），同色即同属一个演进层。点击任意节点直达题目列表。</p>' +
      legendHtml(LAYERS, "大节点 = 21 个技术体系，小节点 = 细分技术点；由内到外为技术演进层次。") +
      '<div class="pan-loading">轨道图加载中…</div>';
    const g = buildTechNodes(true);
    drawOrbit(box, g.nodes, g.links, {});
  }

  /* ============================ 视图：覆盖岗位（按时代阶段） ============================ */
  function renderPos(box) {
    const stages = (S.positionsByStage && S.positionsByStage()) || [];
    const nodes = [], links = [];
    nodes.push({
      id: "__hub__", name: "岗位全景", x: 0, y: 0, symbolSize: 44,
      itemStyle: { color: "#64748b", shadowBlur: 20, shadowColor: "rgba(100,116,139,.5)" },
      label: { show: true, position: "inside", color: "#fff", fontWeight: 700, fontSize: 12 },
      _hub: true, short: "岗位全景"
    });
    const n = stages.length, step = 360 / n, R1 = 66, R2 = 118;
    stages.forEach(function (st, i) {
      const ang = (i * step - 90) * Math.PI / 180;
      const ax = +(R1 * Math.cos(ang)).toFixed(2), ay = +(R1 * Math.sin(ang)).toFixed(2);
      const color = STAGE_COLORS[i % STAGE_COLORS.length];
      const anchorId = "stage" + i;
      nodes.push({
        id: anchorId, name: st.stage, x: ax, y: ay, symbolSize: 36,
        itemStyle: { color: color, shadowBlur: 14, shadowColor: hexA(color, 0.4) },
        short: st.stage, label: { show: true }, _stage: true
      });
      links.push({ source: "__hub__", target: anchorId, lineStyle: { opacity: 0.4, width: 1.2 } });
      const positions = (st.positions || []).filter(function (p) { return !(S.isHiddenPosition && S.isHiddenPosition(p)); });
      const m = positions.length, totalArc = Math.min(46, 360 / n * 0.85), stepArc = m > 1 ? totalArc / (m - 1) : 0;
      positions.forEach(function (p, k) {
        const a = ang + (-totalArc / 2 + k * stepArc) * Math.PI / 180;
        const x = +(R2 * Math.cos(a)).toFixed(2), y = +(R2 * Math.sin(a)).toFixed(2);
        const cnt = (S.questionCountForPosition ? S.questionCountForPosition(p) : 0) || 0;
        const nm = S.posFullName ? S.posFullName(p) : (p.name || p.id);
        nodes.push({
          id: "pos" + p.id, name: nm, x: x, y: y,
          symbolSize: Math.max(8, Math.min(26, 8 + Math.sqrt(cnt) * 2)),
          itemStyle: { color: color, opacity: 0.85, shadowBlur: 6, shadowColor: hexA(color, 0.3) },
          _posId: p.id, short: nm, count: cnt, label: { show: false }, _sub: true
        });
        links.push({ source: anchorId, target: "pos" + p.id, lineStyle: { opacity: 0.16, width: 0.8 } });
      });
    });
    const stageLegend = stages.map(function (st, i) {
      return { name: st.stage, color: STAGE_COLORS[i % STAGE_COLORS.length], desc: (st.positions ? st.positions.length : 0) + " 个岗位" };
    });
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">岗位按「时代阶段」由内到外环绕：中心出发，越往外越是 newer 的方向。</p>' +
      legendHtml(stageLegend, "由内到外 = 技术时代演进：计算机基础 → 软件开发 → 互联网 → 移动互联网 → 云与大数据 → AI/大模型 → 新兴技术 → 综合管理。") +
      '<div class="pan-loading">轨道图加载中…</div>';
    drawOrbit(box, nodes, links, {});
  }

  /* ============================ 视图：AI 生成题 ============================ */
  function renderAI(box) {
    const qs = (S.questions || []).filter(function (q) { return q.status === "published" || q.status == null; });
    const ai = qs.filter(function (q) { return q.source === "ai"; });
    const groups = {};
    ai.forEach(function (q) {
      const key = q.catName || (q.catPath && q.catPath[0]) || "未分类";
      (groups[key] = groups[key] || []).push(q);
    });
    const keys = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    box.innerHTML =
      '<div class="panorama-summary"><div class="pan-sum"><div class="pan-sum-num">' + ai.length + '</div><div class="pan-sum-label">AI 生成题</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + keys.length + '</div><div class="pan-sum-label">涉及技术体系</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + qs.length + '</div><div class="pan-sum-label">题库总量</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + (qs.length ? Math.round(ai.length / qs.length * 100) : 0) + '%</div><div class="pan-sum-label">AI 占比</div></div></div>' +
      '<div class="panorama-ai">' +
      keys.map(function (k) {
        const list = groups[k].map(function (q) {
          return '<a class="q-card" href="#/question/' + q.id + '"><span class="q-title">' + esc(q.title) + "</span>" +
            '<span class="q-meta">AI评分 ' + (q.aiScore || 0) + " · " + esc(q.difficulty || "中等") + "</span></a>";
        }).join("");
        return '<div class="ai-group"><div class="ai-group-title">' + (U.icon ? U.icon("layers") : "") + "<span>" + esc(k) + " (" + groups[k].length + ")</span></div>" + list + "</div>";
      }).join("") +
      "</div>";
    const cards = box.querySelectorAll(".q-card");
    Array.prototype.forEach.call(cards, function (c) {
      c.onclick = function (e) { e.preventDefault(); App.go(c.getAttribute("href").slice(1)); };
    });
  }
})();
