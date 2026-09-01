/*
 * 题库全景图（panorama）
 * 视图：
 *   - all : 技术演进思维导图（中心 → 4 个演进层 → 21 个技术体系）
 *   - cat : 同上，并展开到每个技术体系下的细分技术点
 *   - pos : 岗位思维导图（中心 → 8 个时代阶段 → 具体岗位）
 *   - ai  : AI 生成题思维导图（中心 → 技术体系 → 具体题目）
 * 设计目标：逻辑直观（树形从属关系，一眼看出谁属于谁）、按技术/岗位演进组织（由内到外）、
 *           数量再多也不乱（默认只展开主干，逐级下钻；径向 / 左右两种布局可切换）
 * 依赖：utils.js(U) / services.js(Services) / app.js(App)，echarts 按需加载
 */
(function () {
  /* App 不能在此快照：本脚本先于 app.js 加载，window.App 尚未定义（否则点击跳转全部失效），必须运行时经 window.App 取用 */
  const S = window.Services, U = window.U;

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
    { id: "all", label: "题库全景", icon: "pieChart", desc: "按技术演进由内到外展开的思维导图（可下钻到具体技术）" },
    { id: "cat", label: "技术分类", icon: "layers", desc: "21 个技术体系 → 子类（如关系型数据库）→ 具体技术（如 MySQL），每节点标题数" },
    { id: "pos", label: "覆盖岗位", icon: "briefcase", desc: "岗位按时代阶段 → 父岗位 → 子岗位三级组织，每节点标题数" },
    { id: "ai", label: "AI 生成题", icon: "sparkles", desc: "仅 AI 生成题，按技术体系组织的思维导图（点体系看题单、点题看详情）" }
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
          '<p class="muted" style="margin:-6px 0 14px">一张思维导图看全 ' + (S.questions ? S.questions.length : "") + ' 道题都分布在哪些技术、哪些岗位：由内到外是技术演进，逐级展开是从属关系；悬停节点点「查看题目」直达。</p>' +
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

  /* ============================ 思维导图（ECharts tree） ============================ */
  /* 以「从属关系」组织：中心主题 → 主干（演进层 / 时代阶段）→ 分支（技术体系 / 岗位）→ 叶（细分技术点 / 题目）。
     折叠下钻天然解决节点过多：默认只展开主干，点分支再展开下一级。支持径向与左右两种布局。 */

  /* 技术分类思维导图：递归整棵分类树（体系 → 子类如「关系型数据库」→ 具体技术如「MySQL」），
     每节点题数 = 子树题数（与分类页 /category?cat= 点击后的结果一致）；标签直接带题数，连线按分组着色。 */
  function buildTechTree() {
    const tree = (S.categoryTree && S.categoryTree()) || [];
    const direct = {};
    (S.questions || []).forEach(function (q) { if (q.categoryId != null) direct[q.categoryId] = (direct[q.categoryId] || 0) + 1; });
    function subCount(node) {
      let n = direct[node.id] || 0;
      (node.children || []).forEach(function (c) { n += subCount(c); });
      node._sub = n;
      return n;
    }
    tree.forEach(subCount);

    function mk(node, layer, depth) {
      const color = LAYERS[layer].color;
      const sub = node._sub || 0;
      const out = {
        name: node.name,
        short: node.name + (sub ? "  " + sub + " 题" : ""),
        count: sub,
        symbolSize: Math.max(10, Math.min(66, 12 + Math.sqrt(sub) * 3.4)),
        itemStyle: { color: color, opacity: depth >= 2 ? 0.85 : 1, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(color, 0.6), width: 2 },
        label: { fontSize: depth === 0 ? 13 : (depth === 1 ? 12 : 11) },
        _catId: node.id,
        tip: LAYERS[layer].name + " · 共 " + sub + " 题"
      };
      if (node.children && node.children.length) {
        out.children = node.children.map(function (c) { return mk(c, layer, depth + 1); });
      }
      return out;
    }

    const layerNodes = LAYERS.map(function (L, li) {
      const tops = tree.filter(function (t) { return layerOf(t.name) === li; });
      const total = tops.reduce(function (s, t) { return s + (t._sub || 0); }, 0);
      return {
        name: L.name, short: L.name + "  " + total + " 题",
        count: total, symbolSize: 24,
        itemStyle: { color: L.color, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(L.color, 0.65), width: 2.4 },
        label: { color: L.color, fontWeight: "bold", fontSize: 13 },
        _layer: true, tip: L.desc,
        children: tops.map(function (t) { return mk(t, li, 0); })
      };
    });
    return {
      name: "IT 技术全景", short: "IT 技术全景  " + (S.questions ? S.questions.length : 0) + " 题",
      count: (S.questions || []).length, symbolSize: 46,
      itemStyle: { color: "#64748b", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: LAYERS.length + " 个演进层 · " + tree.length + " 个技术体系",
      children: layerNodes
    };
  }

  /* 岗位思维导图：时代阶段 → 父岗位（category 为空）→ 子岗位（category = 父岗位名），
     每节点题数 = 该岗位题目数；标签直接带题数，连线按阶段着色。 */
  function buildPosTree() {
    const stages = (S.positionsByStage && S.positionsByStage()) || [];
    const totalQ = (S.questions || []).filter(function (q) { return q.positionIds && q.positionIds.length; }).length;
    function mkPos(p, depth, color) {
      const cnt = (S.questionCountForPosition ? S.questionCountForPosition(p) : 0) || 0;
      const nm = S.posFullName ? S.posFullName(p) : (p.name || p.id);
      return {
        name: nm, short: nm + (cnt ? "  " + cnt + " 题" : ""),
        count: cnt,
        symbolSize: Math.max(9, Math.min(30, 9 + Math.sqrt(cnt) * 3)),
        itemStyle: { color: color, opacity: depth >= 1 ? 0.85 : 1, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(color, 0.6), width: 2 },
        label: { fontSize: depth === 0 ? 12 : 11 },
        _posId: p.id, tip: (p.stage || "") + " · 共 " + cnt + " 题"
      };
    }
    return {
      name: "岗位全景", short: "岗位全景  " + totalQ + " 题",
      count: totalQ, symbolSize: 42,
      itemStyle: { color: "#64748b", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: stages.length + " 个时代阶段",
      children: stages.map(function (st, i) {
        const color = STAGE_COLORS[i % STAGE_COLORS.length];
        let positions = (st.list || []).filter(function (p) { return !(S.isHiddenPosition && S.isHiddenPosition(p)); });
        const byName = {};
        positions.forEach(function (p) { byName[p.name] = p; });
        const parents = positions.filter(function (p) { return !p.category; });
        const kidsOf = function (p) { return positions.filter(function (c) { return c.category === p.name; }); };
        return {
          name: st.stage, short: st.stage + "  " + positions.length + " 岗",
          symbolSize: 26,
          itemStyle: { color: color, borderColor: "#fff", borderWidth: 1 },
          lineStyle: { color: hexA(color, 0.65), width: 2.4 },
          label: { color: color, fontWeight: "bold", fontSize: 13 },
          _stage: true, tip: positions.length + " 个岗位",
          children: parents.map(function (p) {
            const node = mkPos(p, 0, color);
            const kids = kidsOf(p);
            if (kids.length) node.children = kids.map(function (c) { return mkPos(c, 1, color); });
            return node;
          })
        };
      })
    };
  }

  /* 分类 id → 所属一级技术体系名（用于把题目归到体系下） */
  function buildCatTopMap() {
    const map = {};
    const tops = collectTops();
    tops.forEach(function (t) {
      map[t.id] = t.name;
      if (S.descendantIds) {
        (S.descendantIds(t.id) || []).forEach(function (id) { map[id] = t.name; });
      } else {
        (t.children || []).forEach(function (c) { map[c.id] = t.name; });
      }
    });
    return map;
  }

  function srcBranch(name, color, list, topMap, total) {
    const groups = {};
    list.forEach(function (q) {
      const k = topMap[q.categoryId] || "未分类";
      (groups[k] = groups[k] || []).push(q);
    });
    const keys = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    return {
      name: name, short: name, count: list.length,
      symbolSize: Math.max(16, Math.min(48, 14 + Math.sqrt(list.length) * 2.2)),
      itemStyle: { color: color },
      label: { color: color, fontWeight: "bold", fontSize: 13 },
      tip: list.length + " 题 · 占全库 " + pct(list.length, total),
      children: keys.map(function (k) {
        return {
          name: k, short: k, count: groups[k].length,
          symbolSize: Math.max(12, Math.min(30, 12 + Math.sqrt(groups[k].length) * 3)),
          itemStyle: { color: color, opacity: 0.85 },
          label: { fontSize: 12 },
          tip: k + " · " + groups[k].length + " 题",
          children: groups[k].map(function (q) {
            const t = q.title || "";
            return {
              name: t, short: t.length > 16 ? t.slice(0, 16) + "…" : t,
              symbolSize: 10, itemStyle: { color: color, opacity: 0.7 },
              label: { fontSize: 10 },
              _qid: q.id, tip: (q.difficulty || "中等") + " · 来源 " + (q.source || "—")
            };
          })
        };
      })
    };
  }

  /* 题目来源思维导图：中心 = 全库，主干 = 来源类型，分支 = 技术体系，叶 = 具体题目 */
  function buildSourceTree() {
    const qs = (S.questions || []).filter(function (q) { return q.status === "published" || q.status == null; });
    const topMap = buildCatTopMap();
    const SRC = [
      { name: "AI 生成", color: "#8b5cf6", test: function (q) { return q.source === "ai"; } },
      { name: "人工录入", color: "#3b82f6", test: function (q) { return q.source === "manual"; } },
      { name: "内置种子", color: "#10b981", test: function (q) { return q.source === "seed"; } },
      { name: "原理整理", color: "#f59e0b", test: function (q) { return q.source === "principles"; } },
      { name: "批量导入", color: "#ec4899", test: function (q) { return q.source === "import"; } },
      { name: "外部文档", color: "#06b6d4", test: function (q) { return /^https?:\/\//i.test(q.source || ""); } }
    ];
    const used = {};
    const nodes = SRC.map(function (s) {
      const list = qs.filter(function (q) { if (s.test(q)) { used[q.id] = 1; return true; } return false; });
      return srcBranch(s.name, s.color, list, topMap, qs.length);
    });
    const rest = qs.filter(function (q) { return !used[q.id]; });
    if (rest.length) nodes.push(srcBranch("其他", "#94a3b8", rest, topMap, qs.length));
    return {
      name: "题目来源", short: "题目来源", count: qs.length, symbolSize: 46,
      itemStyle: { color: "#475569" },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: qs.length + " 道题按来源归类",
      children: nodes.filter(function (n) { return n.count > 0; })
    };
  }

  /* AI 生成题思维导图：只取 source==="ai" 的题目，按一级技术体系归类。
     中心 = AI 题总量，分支 = 技术体系（点击直达该体系题单），叶 = 具体 AI 题（点击直达详情）。
     与「题目来源」全景不同，本视图专指 AI 生成题，避免把全部来源混在一起。 */
  function buildAITree() {
    const qs = (S.questions || []).filter(function (q) { return (q.status === "published" || q.status == null) && q.source === "ai"; });
    const topMap = buildCatTopMap();
    const tops = S.categoryTree() || [];
    const topNameToId = {};
    tops.forEach(function (t) { topNameToId[t.name] = t.id; });
    const groups = {};
    qs.forEach(function (q) { const k = topMap[q.categoryId] || "未分类"; (groups[k] = groups[k] || []).push(q); });
    const keys = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    return {
      name: "AI 生成题", short: "AI 生成题  " + qs.length + " 题",
      count: qs.length, symbolSize: 46,
      itemStyle: { color: "#8b5cf6", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: qs.length + " 道 AI 生成题 · 按技术体系归类",
      children: keys.map(function (k) {
        const list = groups[k];
        return {
          name: k, short: k + "  " + list.length + " 题",
          count: list.length,
          symbolSize: Math.max(14, Math.min(44, 14 + Math.sqrt(list.length) * 2.6)),
          itemStyle: { color: "#8b5cf6", opacity: 0.9, borderColor: "#fff", borderWidth: 1 },
          label: { fontSize: 12 },
          _catId: topNameToId[k] != null ? topNameToId[k] : undefined,
          tip: k + " · " + list.length + " 道 AI 题",
          children: list.map(function (q) {
            const t = q.title || "";
            return {
              name: t, short: t.length > 18 ? t.slice(0, 18) + "…" : t,
              symbolSize: 10, itemStyle: { color: "#a78bfa", opacity: 0.85 },
              label: { fontSize: 10 },
              _qid: q.id, tip: (q.difficulty || "中等") + " · 点击查看题目"
            };
          })
        };
      })
    };
  }

  function drawMindMap(box, root, opt) {
    opt = opt || {};
    const wrap = document.createElement("div");
    wrap.className = "pan-orbit-wrap pan-mm-wrap";
    wrap.innerHTML = '<div class="pan-orbit-rings"><span></span><span></span><span></span><span></span></div>';
    const holder = document.createElement("div");
    holder.className = "panorama-chart pan-orbit-chart pan-mm-chart";
    holder.innerHTML = '<div class="pan-loading">思维导图加载中…</div>';
    wrap.appendChild(holder);

    const bar = document.createElement("div");
    bar.className = "pan-mm-bar";
    bar.innerHTML =
      '<button type="button" class="pan-mm-btn" data-act="layout">切为左右逻辑图</button>' +
      '<button type="button" class="pan-mm-btn" data-act="expand">展开全部</button>' +
      '<button type="button" class="pan-mm-btn" data-act="collapse">只看主干</button>' +
      '<button type="button" class="pan-mm-btn" data-act="fit">复位</button>' +
      (opt.note ? '<span class="pan-mm-note">' + esc(opt.note) + "</span>" : "");
    wrap.appendChild(bar);
    if (opt.legendHtml) {
      const fsLegend = document.createElement("div");
      fsLegend.className = "pan-fs-legend";
      fsLegend.innerHTML = opt.legendHtml;
      wrap.appendChild(fsLegend);
    }
    box.appendChild(wrap);

    let chart = null;
    let layout = "radial";
    let depth = opt.depth != null ? opt.depth : 2;
    const maxDepth = opt.maxDepth != null ? opt.maxDepth : 3;
    const fs = attachFullscreen(wrap, function () { return chart; }, [12, 14]);

    /* 用节点 collapsed 属性控制展开/收起：initialTreeDepth 在 data 引用不变时
       ECharts 不会重算折叠状态，故展开/收起/复位改为直接改 collapsed（可靠生效）。 */
    function walkClear(n) { if (!n) return; delete n.collapsed; (n.children || []).forEach(walkClear); }
    function walkDepth(n, limit, cur) {
      if (!n || !n.children || !n.children.length) return;
      if (cur >= limit) n.collapsed = true; else delete n.collapsed;
      n.children.forEach(function (c) { walkDepth(c, limit, cur + 1); });
    }
    /* ECharts tree 事件里的 params.data 是副本而非原引用，直接改它的 collapsed 不会影响原树；
       故给每个节点发唯一 _nid，点击时按 _nid 在原树上找到真节点再切换折叠。 */
    let nidSeq = 0;
    (function tagNid(n) { n._nid = ++nidSeq; (n.children || []).forEach(tagNid); })(root);
    function findNodeByNid(n, id) {
      if (!n) return null;
      if (n._nid === id) return n;
      for (let i = 0; i < (n.children || []).length; i++) {
        const hit = findNodeByNid(n.children[i], id);
        if (hit) return hit;
      }
      return null;
    }
    function onNodeClick(params) {
      const d = (params && params.data) || {};
      /* 带 id 的实体节点（题目 / 分类 / 岗位）：点击直达对应题单或题目详情。
         注意顺序：先判 id，带 children 的「数据库」「关系型数据库」等分类/岗位节点
         也直接跳题单，不再被下面的「展开/收起」吞掉 —— 这是「点节点回不到对应题」的根因。 */
      if (d._qid != null) { fs.exit(); window.App.go("/question/" + d._qid); return; }
      if (d._catId != null) { fs.exit(); window.App.go("/category?cat=" + d._catId); return; }
      if (d._posId != null) { fs.exit(); window.App.go("/position/" + d._posId); return; }
      /* 纯结构节点（中心 / 演进层 / 时代阶段 / 来源支 / 体系支，无 id）：点击展开或收起下级 */
      if (d.children && d.children.length) {
        const target = findNodeByNid(root, d._nid);
        if (target) {
          if (target.collapsed) delete target.collapsed; else target.collapsed = true;
          apply();
        }
      }
    }

    function fail(msg) {
      holder.innerHTML = '<div class="pan-loading" style="color:#ef4444">思维导图加载失败：' + esc(msg || "未知错误") + "</div>";
    }
    function buildOption() {
      const labelColor = cssVar("--text") || "#334155";
      const edgeColor = cssVar("--border") || "rgba(71,85,105,.5)";
      const isRadial = layout === "radial";
      return {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item", enterable: true, hideDelay: 240,
          backgroundColor: "rgba(15,23,42,.94)", borderWidth: 0, padding: [9, 13],
          textStyle: { color: "#e5e7eb", fontSize: 12 },
          formatter: function (p) {
            const d = p.data || {};
            const out = ["<b>" + esc(d.short || d.name) + "</b>"];
            if (d.tip) out.push('<span style="color:#cbd5e1">' + esc(d.tip) + "</span>");
            const href = d._catId != null ? "/category?cat=" + d._catId
              : d._posId != null ? "/position/" + d._posId
                : d._qid != null ? "/question/" + d._qid : null;
            if (href) out.push('<a class="pan-tip-link" data-goto="' + esc(href) + '">查看题目 →</a>');
            else if (d.children && d.children.length) out.push('<span style="color:#94a3b8">点击节点展开 / 收起下级</span>');
            return out.join("<br/>");
          }
        },
        series: [{
          type: "tree",
          data: [root],
          left: "6%", right: "14%", top: "4%", bottom: "4%",
          layout: layout,
          orient: "LR",
          edgeShape: "curve",
          edgeForkPosition: "58%",
          roam: true,
          expandAndCollapse: false,
          animationDuration: 420,
          animationDurationUpdate: 420,
          symbol: "circle",
          symbolSize: function (val, params) { return (params && params.data && params.data.symbolSize) || 14; },
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          lineStyle: { color: edgeColor, width: 2, curveness: isRadial ? 0.5 : 0.45 },
          label: {
            show: true, position: isRadial ? "outside" : "right", color: labelColor, fontSize: 12,
            formatter: function (p) { return p.data.short || p.data.name; }
          },
          leaves: { label: { position: isRadial ? "outside" : "right" } },
          emphasis: { focus: "descendant", lineStyle: { width: 3.6, opacity: 1 } }
        }]
      };
    }
    /* 左右逻辑图（orthogonal）下，同一层兄弟节点竖向堆叠，且 ECharts 按「子树叶子数比例」
       分配高度——若画布不够高，叶子密集的体系下标签必然交叠。故：① 左右图默认比径向图
       少展开一层（effDepth），避免一上来就 185 个节点铺开；② 画布高度按「当前可见节点数」
       动态给（≈每节点 32px），ECharts 按叶子比例分配后每个叶子都有足够纵向间距。 */
    function effDepth() { return layout === "radial" ? depth : Math.max(1, depth - 1); }
    function visibleNodeCount() {
      let cnt = 0;
      (function rec(n) {
        if (!n) return;
        cnt++;
        if (n.collapsed) return;
        (n.children || []).forEach(rec);
      })(root);
      return cnt;
    }
    function resizeHolder() {
      if (!holder) return;
      const n = visibleNodeCount();
      if (layout === "orthogonal") {
        const h = Math.max(640, Math.min(6000, n * 32));
        holder.style.height = h + "px";
      } else {
        /* 径向图：节点多时也加高画布，让圆更大、放大拖动有空间、页面可滚动看全图；
           否则固定 640px 视口下放大后内容超出 canvas 被裁，下面看不到 */
        const h = Math.max(640, Math.min(2400, Math.round(n * 6 + 400)));
        holder.style.height = h + "px";
      }
    }
    function apply() {
      if (!chart) return;
      resizeHolder();
      /* 先 resize 同步画布尺寸，再 setOption(notMerge) 重建：setOption 内部按新画布布局并读取
         data.collapsed；若先 setOption 再 resize，resize 触发的重布局会忽略 collapsed 导致全展开 */
      try { chart.resize(); chart.setOption(buildOption(), true); } catch (e) {}
    }
    bar.addEventListener("click", function (e) {
      const b = e.target && e.target.closest ? e.target.closest(".pan-mm-btn") : null;
      if (!b) return;
      const act = b.getAttribute("data-act");
      if (act === "layout") {
        layout = layout === "radial" ? "orthogonal" : "radial";
        b.textContent = layout === "radial" ? "切为左右逻辑图" : "切为径向图";
        /* 左右逻辑图是纵向堆叠，默认收一层 + 更高画布才不挤 */
        wrap.classList.toggle("pan-mm-tall", layout === "orthogonal");
        walkDepth(root, effDepth(), 0);   /* 左右图默认收一层，避免一上来就挤成一团 */
        apply();
      } else if (act === "expand") {
        walkClear(root);   /* 展开全部：清除所有 collapsed，一路铺到叶子（含具体题目） */
        apply();
      }
      else if (act === "collapse") { walkDepth(root, 1, 0); apply(); }
      else if (act === "fit") {
        layout = "radial";
        b.parentNode.querySelector('[data-act="layout"]').textContent = "切为左右逻辑图";
        wrap.classList.remove("pan-mm-tall");
        walkDepth(root, opt.depth != null ? opt.depth : 2, 0);
        apply();
      }
    });
    holder.addEventListener("click", function (e) {
      const a = e.target && e.target.closest ? e.target.closest(".pan-tip-link") : null;
      if (!a) return;
      const to = a.getAttribute("data-goto");
      if (to) { fs.exit(); window.App.go(to); }
    });

    U.loadScript("echarts", U.ECHARTS_URL).then(function () {
      if (!holder || !window.echarts) { fail("echarts 未就绪"); return; }
      try { chart = echarts.init(holder, null, { renderer: "canvas" }); }
      catch (e) { fail(e.message); return; }
      if (window.App && window.App.registerChart) window.App.registerChart(chart);
      chart.showLoading({ text: "思维导图加载中…", color: "#3b82f6", textColor: "#334155", maskColor: "rgba(255,255,255,.55)", fontSize: 13 });
      walkDepth(root, effDepth(), 0);   /* 按当前布局设初始展开层级（左右图默认收一层） */
      resizeHolder();
      try { chart.setOption(buildOption(), true); chart.resize(); chart.hideLoading(); chart.on("click", onNodeClick); }
      catch (e) { try { chart.hideLoading(); } catch (e2) {} fail(e.message); return; }
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      } else {
        window.addEventListener("resize", function () { try { chart.resize(); } catch (e) {} });
      }
    }).catch(function (e) { fail(e && e.message); });
  }

  /* ============================ 通用：全屏查看 ============================ */
  /* 优先用原生 Fullscreen API；浏览器不支持（如 iOS Safari）时降级为 fixed 伪全屏。
     返回 { exit } ，跳转前调用可自动退出全屏。 */
  function attachFullscreen(wrap, getChart, labelFs) {
    labelFs = labelFs || [11, 14];
    const fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.className = "pan-fs-btn";
    fsBtn.title = "全屏查看（Esc 退出）";
    fsBtn.innerHTML = '<span class="pan-fs-ic">&#9974;</span><span class="pan-fs-txt">全屏</span>';
    wrap.appendChild(fsBtn);

    function isNativeFs() {
      return document.fullscreenElement === wrap || document.webkitFullscreenElement === wrap;
    }
    function isFs() { return isNativeFs() || wrap.classList.contains("pan-pseudo-fs"); }
    function syncFs() {
      const on = isFs();
      fsBtn.classList.toggle("on", on);
      const ic = fsBtn.querySelector(".pan-fs-ic"), tx = fsBtn.querySelector(".pan-fs-txt");
      if (ic) ic.innerHTML = on ? "&#10005;" : "&#9974;";
      if (tx) tx.textContent = on ? "退出全屏" : "全屏";
    }
    function afterFsChange() {
      syncFs();
      const chart = getChart ? getChart() : null;
      if (chart) {
        try { chart.setOption({ series: [{ label: { fontSize: isFs() ? labelFs[1] : labelFs[0] } }] }); } catch (e) {}
        try { chart.resize(); } catch (e) {}
      }
    }
    function exitFs() {
      if (!isFs()) return;
      if (isNativeFs()) {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex) { try { ex.call(document); } catch (e) {} }
      }
      /* 无论原生是否可用，一并清理伪全屏残留状态，避免两种状态叠加 */
      if (wrap.classList.contains("pan-pseudo-fs")) {
        wrap.classList.remove("pan-pseudo-fs");
        document.body.classList.remove("pan-fs-lock");
      }
      afterFsChange();
    }
    function enterPseudoFs() {
      wrap.classList.add("pan-pseudo-fs");
      document.body.classList.add("pan-fs-lock");
      afterFsChange();
    }
    fsBtn.addEventListener("click", function () {
      if (isFs()) { exitFs(); return; }
      const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
      if (req) {
        try {
          const p = req.call(wrap);
          if (p && p.catch) p.catch(function () { enterPseudoFs(); });
        } catch (e) { enterPseudoFs(); return; }
        setTimeout(function () { if (!isFs()) enterPseudoFs(); }, 400);
      } else {
        enterPseudoFs();
      }
    });
    function onFsChangeGlobal() {
      if (!document.body.contains(wrap)) {
        document.removeEventListener("fullscreenchange", onFsChangeGlobal);
        document.removeEventListener("webkitfullscreenchange", onFsChangeGlobal);
        document.removeEventListener("keydown", onEsc);
        return;
      }
      afterFsChange();
    }
    function onEsc(e) {
      if (e.key === "Escape" && wrap.classList.contains("pan-pseudo-fs")) exitFs();
    }
    document.addEventListener("fullscreenchange", onFsChangeGlobal);
    document.addEventListener("webkitfullscreenchange", onFsChangeGlobal);
    document.addEventListener("keydown", onEsc);
    return { exit: exitFs };
  }

  /* ============================ 旧版：分层同心轨道图 ============================
   * v20260901a 及之前的实现，已被上方「思维导图」取代（用户反馈轨道图节点一多就挤、连线缠成一团）。
   * 当前四个视图都不再调用它，保留在此便于日后若要切回径向轨道图时直接复用。
   */
  function drawOrbit(box, nodes, links, opt) {
    opt = opt || {};
    const holder = document.createElement("div");
    holder.className = "panorama-chart pan-orbit-chart";
    holder.innerHTML = '<div class="pan-loading">轨道图加载中…</div>';
    const wrap = document.createElement("div");
    wrap.className = "pan-orbit-wrap";
    wrap.innerHTML = '<div class="pan-orbit-rings"><span></span><span></span><span></span><span></span></div>';
    wrap.appendChild(holder);
    if (opt.legendHtml) {
      const fsLegend = document.createElement("div");
      fsLegend.className = "pan-fs-legend";
      fsLegend.innerHTML = opt.legendHtml;
      wrap.appendChild(fsLegend);
    }
    box.appendChild(wrap);

    let chart = null;
    const fs = attachFullscreen(wrap, function () { return chart; });

    function fail(msg) {
      holder.innerHTML = '<div class="pan-loading" style="color:#ef4444">轨道图加载失败：' + esc(msg || "未知错误") + '</div>';
    }
    U.loadScript("echarts", U.ECHARTS_URL).then(function () {
      if (!holder || !window.echarts) { fail("echarts 未就绪"); return; }
      try { chart = echarts.init(holder, null, { renderer: "canvas" }); }
      catch (e) { fail(e.message); return; }
      if (window.App && window.App.registerChart) window.App.registerChart(chart);
      chart.showLoading({ text: "轨道图加载中…", color: "#3b82f6", textColor: "#334155", maskColor: "rgba(255,255,255,.55)", fontSize: 13 });
      const labelColor = cssVar("--text") || "#334155";
      const edgeColor = cssVar("--border") || "#cbd5e1";
      try {
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
            symbolSize: function (val, params) { return (params && params.data && params.data.symbolSize) || 20; }
          }]
        });
        chart.hideLoading();
      } catch (e) {
        chart.hideLoading();
        fail(e.message);
        return;
      }
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      } else {
        window.addEventListener("resize", function () { try { chart.resize(); } catch (e) {} });
      }
      chart.on("click", function (params) {
        const d = params.data || {};
        if (d._catId != null) { fs.exit(); window.App.go("/category?cat=" + d._catId); }
        else if (d._posId != null) { fs.exit(); window.App.go("/position/" + d._posId); }
      });
    }).catch(function (e) { fail(e && e.message); });
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
      { n: (S.positionsByStage ? S.positionsByStage().reduce(function (a, s) { return a + (s.list ? s.list.length : 0); }, 0) : 0), l: "覆盖岗位" }
    ];
    return '<div class="panorama-summary">' + cards.map(function (c) {
      return '<div class="pan-sum"><div class="pan-sum-num">' + c.n + '</div><div class="pan-sum-label">' + esc(c.l) + "</div></div>";
    }).join("") + "</div>";
  }

  function renderAll(box) {
    const lg = legendHtml(LAYERS, "由内到外 = 技术演进：基石 → 系统开发 → 架构工程 → 数据与智能/领域前沿。节点上的「N 题」即该方向全部题目数，点节点直达题单。");
    box.innerHTML = summaryHtml() + lg;
    drawMindMap(box, buildTechTree(), {
      legendHtml: lg, depth: 2, maxDepth: 4,
      note: "点技术体系节点直达该体系题单；结构节点（中心 / 演进层）点击展开下一级；滚轮缩放、拖拽平移"
    });
  }

  function renderCat(box) {
    const lg = legendHtml(LAYERS, "主干 = 4 个演进层，分支 = 21 个技术体系，再下钻 = 细分技术点（如 数据库→关系型数据库→MySQL）。节点标注「N 题」即该分类题数。");
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">技术分类已细分到底：比如「数据库」下能看到「关系型数据库」「非关系型数据库」，再点开就能看到 MySQL / PostgreSQL / Redis 等具体技术，每个都标了题数。点节点直达题目列表。</p>' + lg;
    drawMindMap(box, buildTechTree(), {
      legendHtml: lg, depth: 3, maxDepth: 4,
      note: "点任一技术节点直达该分类题单（含其下所有题目）；点「展开全部」铺开结构，再点具体题目直达详情"
    });
  }

  /* ============================ 视图：覆盖岗位（按时代阶段） ============================ */
  function renderPos(box) {
    const stages = (S.positionsByStage && S.positionsByStage()) || [];
    const stageLegend = stages.map(function (st, i) {
      return { name: st.stage, color: STAGE_COLORS[i % STAGE_COLORS.length], desc: (st.list ? st.list.length : 0) + " 个岗位" };
    });
    const lg = legendHtml(stageLegend, "由内到外 = 技术时代演进：计算机基础 → 软件开发 → 互联网 → 移动互联网 → 云与大数据 → AI/大模型 → 新兴技术 → 综合管理。节点标注「N 题」即该岗位题数。");
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">岗位按「时代阶段」归组，再细分成父子岗位（如「硬件工程师」→「数字电路工程师 / 嵌入式硬件工程师」）。每个岗位都标了题数，点节点直达对应岗位题库。</p>' + lg;
    drawMindMap(box, buildPosTree(), {
      legendHtml: lg, depth: 2, maxDepth: 3,
      note: "点任一岗位节点直达该岗位题单；结构节点（中心 / 时代阶段）点击展开下一级"
    });
  }

  /* ============================ 视图：AI 生成题 ============================ */
  function renderAI(box) {
    const qs = (S.questions || []).filter(function (q) { return q.status === "published" || q.status == null; });
    const ai = qs.filter(function (q) { return q.source === "ai"; });
    const topMap = buildCatTopMap();
    const aiTops = {};
    ai.forEach(function (q) { aiTops[topMap[q.categoryId] || "未分类"] = 1; });
    const aiTopCount = Object.keys(aiTops).length;
    box.innerHTML =
      '<div class="panorama-summary"><div class="pan-sum"><div class="pan-sum-num">' + ai.length + '</div><div class="pan-sum-label">AI 生成题</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + aiTopCount + '</div><div class="pan-sum-label">涉及技术体系</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + qs.length + '</div><div class="pan-sum-label">题库总量</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + (qs.length ? Math.round(ai.length / qs.length * 100) : 0) + '%</div><div class="pan-sum-label">AI 占比</div></div></div>' +
      '<p class="muted" style="margin:0 0 12px">仅展示 <b>AI 生成</b> 的题目（已与其他来源分开），按技术体系归类成思维导图：中心是 AI 题总量，往外一层是技术体系，再点开就是具体题目。点体系直达该体系题单，点题目直达详情。</p>';
    drawMindMap(box, buildAITree(), {
      depth: 2, maxDepth: 3,
      note: "点技术体系节点直达该体系题单；点具体题目直达详情；结构节点（中心）点击展开/收起"
    });
  }
})();
