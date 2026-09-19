/* =========================================================================
 *  submit.js  —  用户投稿 / AI 质检结果 / 投稿审核（管理员 + 专家）/ 专家群组
 *  后端：Cloudflare Worker
 *        POST   /submit                        投稿（登录 → 限额 → 预筛 → AI 质检 → 入库待审）
 *        GET    /me/submissions                我的投稿 + 剩余违规机会
 *        GET    /admin/submissions?status=     审核队列（open / done / nonit，nonit 仅 admin）
 *        POST   /admin/submissions/:id/claim   抢单认领（乐观锁）
 *        POST   /admin/submissions/:id/review  通过 / 打回 / 存改动 / 释放
 *        GET|POST /admin/groups, DELETE /admin/groups/:id, POST /admin/groups/:id/members
 *  设计要点：
 *   1. AI 质检在**服务端**完成（DeepSeek），前端只负责提交与展示结论；
 *   2. 「非 IT」与「质量不达标」是两条独立通道 —— 只有前者计违规次数并最终封号，
 *      AI 判质量只是「参考意见」，质量有疑问的稿子照样进人工队列（人工有最终决定权），
 *      这样 AI 误杀不会把好题丢掉，AI 的理由也不会悄悄消失；
 *   3. 审核用「抢单锁 + 乐观并发」：两个人同时点同一条，后到的那位会拿到 409；
 *   4. 审核者**不能审自己提交的题** —— 前端直接不给按钮，服务端再拦一次。
 * ========================================================================= */
(function () {
  "use strict";
  /* app.js 是 IIFE，setMain/route/refreshNav 在其闭包内，通过 App._internals 取用 */
  const _i = (window.App && window.App._internals) || {};
  const $ = _i.$ || U.qs;
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const setMain = _i.setMain || window.setMain;
  const refreshNav = _i.refreshNav || function () {};
  const acc = function () { return window.Account; };

  const S = {};
  window.Submit = S;

  /* ==================== 共用小件 ==================== */

  /* AI 质检结论 → 标签样式与文案（与 Worker 里的取值一一对应） */
  const VERDICT = {
    pass:             { cls: "tag-success", txt: "AI 通过" },
    reject_quality:   { cls: "tag-warning", txt: "AI 质量存疑" },
    reject_duplicate: { cls: "tag-warning", txt: "AI 疑似重复" },
    reject_non_it:    { cls: "tag-danger",  txt: "非 IT 内容" },
    error:            { cls: "tag-outline", txt: "AI 未判定" },
    pending:          { cls: "tag-outline", txt: "未质检" },
  };
  const REVIEW = {
    pending:   { cls: "tag-outline", txt: "待审核" },
    reviewing: { cls: "tag-ai",      txt: "审核中" },
    approved:  { cls: "tag-success", txt: "已通过" },
    rejected:  { cls: "tag-danger",  txt: "已打回" },
  };
  const ACCENT = { pass: "#16A34A", reject_quality: "#D97706", reject_duplicate: "#D97706", reject_non_it: "#DC2626", error: "#64748B" };

  function esc(s) { return U.esc(s == null ? "" : s); }
  function vTag(v) { const m = VERDICT[v] || VERDICT.pending; return '<span class="tag ' + m.cls + '">' + m.txt + "</span>"; }
  function rTag(v) { const m = REVIEW[v] || REVIEW.pending; return '<span class="tag ' + m.cls + '">' + m.txt + "</span>"; }
  function fmt(ts) { return ts ? U.fmtDate(ts) : "—"; }
  function num(v) { const n = parseInt(v); return isNaN(n) ? 0 : Math.max(0, Math.min(100, n)); }
  function bar(v) {
    const c = v >= 80 ? "#16A34A" : v >= 60 ? "#D97706" : "#DC2626";
    return '<span style="display:inline-block;flex:1;height:7px;border-radius:4px;background:rgba(128,128,128,.22);overflow:hidden;vertical-align:middle">' +
      '<span style="display:block;height:100%;width:' + v + '%;background:' + c + '"></span></span>';
  }
  function authorName(r) { return r.authorNick || r.authorEmail || ("用户 #" + r.user_id); }

  /* 全站技术分类平铺表（供 datalist 搜索用）。缓存一次 —— 分类是静态数据，不用每次重建。
     ⚠️ 空结果**绝不能缓存**（2026-09-19 实测踩到）：`if (_flat)` 对 `[]` 是真值，所以只要在
        `Services.reload()` 完成前被调用一次（例如从 hashchange 路由过来、而分类还没装载），
        就会把空数组永久钉住 —— 之后所有页面都渲染出 0 个分类候选，且看不出任何报错。
        现在的契约：categories 为空时**照常返回空数组但不写缓存**，下次调用自然重算。 */
  let _flat = null;
  function flatCats() {
    if (_flat && _flat.length) return _flat;
    const cats = Services.categories || [];
    if (!cats.length) return [];              // 尚未装载：给空结果，但不污染缓存
    const built = cats.map(function (c) {
      const path = Services.categoryPath(c.id);
      return { id: c.id, name: c.name, path: (path && path.length ? path.join(" / ") : c.name) };
    }).filter(function (c) { return c.path; });
    built.sort(function (a, b) { return a.path.localeCompare(b.path, "zh"); });
    if (!built.length) return [];             // 全是空 path 的退化情况：同样不缓存
    _flat = built;
    return _flat;
  }

/* ---------- AI 报告（只读）—— 审核面板与「待入库」面板共用 ---------- */
function aiReportHtml(ai, row) {
  if (!ai || !ai.verdict) return '<div class="note" style="margin-top:12px">这条没有可展示的 AI 报告（AI 当时不可用，或数据已被清理）。</div>';
  const score = num(ai.qualityScore != null ? ai.qualityScore : ai.score);
  const dims = (ai.dimensions && typeof ai.dimensions === "object") ? ai.dimensions : {};
  const DIM_LABEL = { clarity: "表述清晰度", depth: "技术深度", answerAccuracy: "答案准确性", usefulness: "实用性", uniqueness: "独特性" };
  const dimRows = Object.keys(DIM_LABEL).filter(function (k) { return dims[k] != null; }).map(function (k) {
    const v = num(dims[k]);
    return '<div style="display:flex;align-items:center;gap:8px;margin:3px 0">' +
      '<span class="muted" style="font-size:12px;width:80px;flex:none">' + DIM_LABEL[k] + "</span>" + bar(v) +
      '<span class="muted" style="font-size:12px;width:30px;text-align:right">' + v + "</span></div>";
  }).join("");
  const ul = function (arr) {
    if (!arr || !arr.length) return "";
    return '<ul style="margin:4px 0 0;padding-left:20px;font-size:13.5px">' + arr.map(function (x) {
      return '<li style="margin:2px 0">' + esc(x) + "</li>";
    }).join("") + "</ul>";
  };
  return '<div style="margin-top:14px;padding:12px;border-radius:10px;background:rgba(128,128,128,.08)">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      vTag(ai.verdict) +
      (score ? '<span class="muted" style="font-size:13px">质检分 <b>' + score + "</b> / 100</span>" : "") +
      (ai.isIT === false ? '<span class="tag tag-danger">AI 认为不属于 IT</span>' : "") +
      (ai.inScope === false ? '<span class="tag tag-warning">AI 认为不在本站体系内</span>' : "") +
    "</div>" +
    (score ? '<div style="display:flex;align-items:center;gap:8px;margin-top:8px">' + bar(score) + "</div>" : "") +
    (dimRows ? '<div style="margin-top:8px">' + dimRows + "</div>" : "") +
    ((ai.categoryPath && ai.categoryPath.length) ? '<div class="pill-row" style="margin-top:10px"><span class="muted" style="font-size:13px">建议归入：</span>' + ai.categoryPath.map(function (p) { return '<span class="tag tag-outline">' + esc(p) + "</span>"; }).join("") + "</div>" : "") +
    ((ai.reasons && ai.reasons.length) ? '<div style="margin-top:10px"><div style="font-size:13px;font-weight:600;color:var(--muted)">AI 判断依据</div>' + ul(ai.reasons) + "</div>" : "") +
    ((ai.improvements && ai.improvements.length) ? '<div style="margin-top:10px"><div style="font-size:13px;font-weight:600;color:var(--muted)">AI 改进建议</div>' + ul(ai.improvements) + "</div>" : "") +
    /* AI 不可用时给出「为什么」，否则运维只能去翻 D1。仅在审核面板可见，不暴露给投稿人。 */
    ((ai.verdict === "error" && row && row.ai_error)
      ? '<div style="margin-top:10px;padding:8px 10px;border-radius:8px;background:rgba(220,130,0,.12);font-size:12.5px;line-height:1.6">' +
        "<b>AI 未参与质检</b>（本条已照常进入人工队列，不影响投稿人）<br>" +
        '<span class="muted" style="word-break:break-all">' + esc(String(row.ai_error).slice(0, 300)) + "</span></div>"
      : "") +
    ((ai._usage && ai._usage.total)
      ? '<div class="muted" style="font-size:12px;margin-top:8px">本次质检 token ' + num(ai._usage.total) +
        "（模型 " + esc(String(ai._usage.model || "?")) + "）</div>"
      : "") +
    "</div>";
}
  function catIdToPath(id) {
    if (id == null || id === "") return "";
    const f = flatCats().filter(function (c) { return String(c.id) === String(id); })[0];
    return f ? f.path : "";
  }
  function catPathToId(path) {
    const p = String(path || "").trim();
    if (!p) return "";
    const f = flatCats().filter(function (c) { return c.path === p; })[0];
    return f ? String(f.id) : "";
  }
  function catDatalist(idAttr) {
    return '<datalist id="' + idAttr + '">' + flatCats().map(function (c) {
      return '<option value="' + esc(c.path) + '"></option>';
    }).join("") + "</datalist>";
  }
  /* AI 给的 categoryPath（形如 ["计算机网络与协议","HTTP与HTTPS"]）→ 本地分类 id。
     ⚠️ 不能直接 join(" / ") 去查表就完事：AI 只看到**前两级**（Worker 喂给它的技术体系
     只列 depth 0/1），而本地路径可能是三级（"网络 / 协议 / HTTP"）。所以按「由长到短
     逐级前缀」试，命中即返回；再退化到「末级名字在全站唯一」时才认。两级都匹配不上、
     或末级重名（如多个方向下都有「基础」）就返回空串 —— 宁可让管理员手选，也不填错。 */
  function aiCatPathToId(path) {
    const want = (Array.isArray(path) ? path : []).map(function (x) { return String(x || "").trim(); }).filter(Boolean);
    if (!want.length) return "";
    for (let n = want.length; n >= 1; n--) {
      const id = catPathToId(want.slice(0, n).join(" / "));
      if (id) return id;
    }
    const last = want[want.length - 1];
    const hits = flatCats().filter(function (c) { return c.name === last; });
    return hits.length === 1 ? String(hits[0].id) : "";
  }

  /* ---------- 本地重复候选（投稿前在浏览器里算，不额外花 AI 额度） ----------
   * 用「二元组 Dice 系数」粗筛标题：1132 道题全量比对约 10ms 级，
   * 结果随投稿一起送服务端，交给 AI 做最终判定（AI 只做判断，不负责检索）。 */
  function bigrams(s) { const out = []; for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2)); return out; }
  function dice(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const A = bigrams(a), B = bigrams(b);
    if (!A.length || !B.length) return 0;
    const m = Object.create(null);
    for (let i = 0; i < A.length; i++) m[A[i]] = (m[A[i]] || 0) + 1;
    let hit = 0;
    for (let i = 0; i < B.length; i++) { const c = m[B[i]] || 0; if (c > 0) { m[B[i]] = c - 1; hit++; } }
    return (2 * hit) / (A.length + B.length);
  }
  function normalizeTitle(s) {
    return String(s || "").toLowerCase()
      .replace(/[\s,，.。、；;：:？！?!"'“”‘’()（）\[\]【】<>《》/\\|+\-*_~`]/g, "");
  }
  /* pool / threshold 可选：「投稿前预筛」只在已发布题里比（给 AI 当线索）；
     「收录进库」要连草稿一起比 —— 草稿重复同样是重复。 */
  function dupCandidates(title, pool, threshold) {
    try {
      const t = normalizeTitle(title);
      if (t.length < 4) return [];
      const src = pool || (Services.published ? Services.published() : Services.questions) || [];
      const lim = threshold == null ? 0.5 : threshold;
      const scored = [];
      for (let i = 0; i < src.length; i++) {
        const d = dice(t, normalizeTitle(src[i].title));
        if (d >= lim) scored.push({ d: d, title: String(src[i].title || "").slice(0, 120) });
      }
      scored.sort(function (a, b) { return b.d - a.d; });
      return scored.slice(0, 6).map(function (x) { return x.title; });
    } catch (e) { return []; }
  }

  /* ==================== 登录 / 权限 门禁页 ==================== */

  function crumb(tail) {
    return '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>' + esc(tail) + "</span></div>";
  }
  function gate(icon, title, desc, btnText, onClick) {
    setMain(crumb(title) + '<div class="empty"><div class="em-ic">' + U.icon(icon) + "</div><h3>" + esc(title) + "</h3><p>" + esc(desc) + "</p>" +
      '<button class="btn btn-primary" id="gate-btn">' + U.icon("user") + " " + esc(btnText) + "</button></div>");
    const b = $("#gate-btn");
    if (b) b.onclick = onClick;
  }
  function requireLogin() {
    if (acc() && acc().isLoggedIn()) return true;
    gate("user", "投稿前请先登录",
      "投稿要落到一个具体帐号上：审核结果、违规次数都需要有归属，你也能在「我的投稿」里看到每一条的进度。",
      "去登录 / 注册", function () { App.go("/account"); });
    return false;
  }
  function requireReviewer() {
    const A = acc();
    if (A && A.isReviewer()) return true;
    const logged = !!(A && A.isLoggedIn());
    gate("shield", "需要审核权限",
      logged ? "当前帐号还没有审核权限。请联系管理员把你的角色设为「专家」，并分配负责的技术分类。"
             : "请先用管理员或专家帐号登录。",
      logged ? "切换到其它帐号" : "前往登录",
      function () {
        if (logged) { A.logout(); refreshNav(); }
        App.go("/account");
      });
    return false;
  }
  function requireServerAdmin(desc) {
    const A = acc();
    if (A && A.isServerAdmin()) return true;
    gate("shield", "需要管理员权限",
      desc || "专家群组管理会直接分配审核范围，仅管理员可用。",
      "前往登录", function () { App.go("/account"); });
    return false;
  }

  /* ==================== ① 投稿页 ==================== */

  S.renderSubmitPage = function () {
    document.title = "投稿面试题 · IT面试题库";
    if (!requireLogin()) return;
    const A = acc();
    const diffs = ["初级", "中级", "高级", "专家"];
    const types = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];

    setMain(crumb("投稿题目") + `
      <div class="section-head"><h2>投稿面试题</h2></div>
      <div class="note">
        <b>投稿规则</b>：① 需要登录，每个帐号每天最多 <b>5 条</b>；
        ② 提交后会先由 AI 质检，再进入人工审核，通过后才会进题库，<b>不会立刻上线</b>；
        ③ <b>与 IT 技术无关</b>的内容会被退回并计 1 次违规，累计 <b>3 次</b>帐号将被永久禁用；
        ④ 质量、重复的判读由审核员最终决定，AI 意见仅供参考，<b>不计违规次数</b>。
      </div>
      <div class="card">
        <label class="field"><span>题目标题 *</span>
          <input id="s-title" maxlength="200" placeholder="如：MySQL 为什么用 B+ 树而不是 B 树？" />
          <div class="field-hint">一句话说清考什么。标题既是查重依据、也决定审核员的第一眼判断 ——
            别写「一道 MySQL 题」这种笼统标题，把<b>具体考点</b>写进标题。</div></label>
        <div class="grid grid-cols-2" style="gap:16px">
          <label class="field"><span>技术分类（输入关键词后从下拉里选一个）</span>
            <input id="s-cat" list="s-cat-opts" autocomplete="off" placeholder="输入关键词后点选" />
            <div class="field-hint">必须从下拉候选里点选，不能自己造分类名。拿不准也没关系，AI 与审核员会帮你归位。</div>
            ${catDatalist("s-cat-opts")}</label>
          <label class="field"><span>难度</span>
            <select id="s-diff" class="full">${diffs.map(function (d) { return "<option" + (d === "中级" ? " selected" : "") + ">" + d + "</option>"; }).join("")}</select>
            <div class="field-hint">按「大多数候选人答不上来」的程度估。</div></label>
          <label class="field"><span>题型</span>
            <select id="s-type" class="full">${types.map(function (t) { return "<option" + (t === "简答题" ? " selected" : "") + ">" + t + "</option>"; }).join("")}</select>
            <div class="field-hint">面试里最常以哪种形式被问出来就选哪种。</div></label>
          <label class="field"><span>技术标签（逗号分隔）</span>
            <input id="s-tags" maxlength="200" placeholder="如：MySQL,索引,B+树" />
            <div class="field-hint">3～6 个最相关的关键词，方便别人搜到这道题。</div></label>
        </div>
        <label class="field"><span>题目正文 *（Markdown）</span>
          <textarea id="s-body" style="min-height:150px" placeholder="背景、约束、具体问什么"></textarea>
          <div class="field-hint">把题干写清楚三件事：<b>背景</b>（什么场景下遇到）、<b>约束</b>（数据规模 / 版本 / 硬件限制）、
            <b>具体问什么</b>（要候选人回答哪一个点）。</div></label>
        <label class="field"><span>参考答案（Markdown，写得越完整越容易通过）</span>
          <textarea id="s-answer" style="min-height:190px" placeholder="建议分点作答：是什么 → 为什么"></textarea>
          <div class="field-hint">分点写，每点讲清「是什么 + 为什么」。<b>追问的深度决定这道题的价值</b>；
            没把握的地方直接写「待确认」，不要编。</div></label>
        <label class="field"><span>来源备注（可选）</span>
          <input id="s-note" maxlength="200" placeholder="如：2024 某厂三面真题" />
          <div class="field-hint">写出处有助于审核员判断可信度；不填也能提交。</div></label>
        <div class="row" style="gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="s-go">${U.icon("sparkles")} 提交并接受 AI 质检</button>
          <a class="btn" href="#/me/submissions">${U.icon("fileText")} 我的投稿</a>
          <span id="s-quota" class="muted" style="font-size:13px"></span>
        </div>
      </div>
      <div id="s-result"></div>`);

    function paintQuota(r) {
      const el = $("#s-quota");
      if (!el || !r) return;
      const left = (r.strikesLeft == null) ? null : r.strikesLeft;
      const limit = r.limit || 3;
      if (left == null) { el.innerHTML = ""; return; }
      el.innerHTML = "非 IT 违规累计 <b>" + (r.strikes || 0) + "</b> / " + limit + " 次" +
        (left > 0 ? '　<span class="tag tag-success">还有 ' + left + " 次机会</span>"
                  : '　<span class="tag tag-danger">已用尽</span>');
    }

    /* 顺带把剩余违规次数拉回来（同一个接口也供「我的投稿」用），失败静默 */
    A.mySubmissions().then(function (r) { S._quota = r; paintQuota(r); }).catch(function () {});

    function resetForm() {
      ["#s-title", "#s-body", "#s-answer", "#s-tags", "#s-note", "#s-cat"].forEach(function (s) { const el = $(s); if (el) el.value = ""; });
      $("#s-result").innerHTML = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
      const t = $("#s-title"); if (t) t.focus();
    }

    function renderResult(r) {
      const out = $("#s-result");
      const ai = r.ai || {};
      const v = ai.verdict || "error";
      const meta = VERDICT[v] || VERDICT.error;
      const accent = ACCENT[v] || ACCENT.error;
      const score = num(ai.score);
      const reasons = ai.reasons || [], imps = ai.improvements || [], path = ai.categoryPath || [];

      let head = "";
      if (r.banned) {
        head = "账号已被永久禁用";
      } else if (v === "reject_non_it") {
        head = "这条内容与 IT 技术无关，已退回";
      } else if (v === "reject_quality") {
        head = "AI 认为质量偏弱，已转人工复核";
      } else if (v === "reject_duplicate") {
        head = "AI 认为可能与已有题目重复，已转人工确认";
      } else if (v === "error") {
        head = "已提交，AI 质检暂时不可用";
      } else {
        head = "已提交，等待人工审核";
      }

      const list = function (arr, icon, cls) {
        if (!arr.length) return "";
        return '<ul style="margin:6px 0 0;padding-left:20px;font-size:13.5px">' + arr.map(function (x) {
          return '<li style="margin:2px 0">' + esc(x) + "</li>";
        }).join("") + "</ul>";
      };

      out.innerHTML = `
        <div class="card" style="margin-top:16px;border-left:4px solid ${accent}">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="tag ${meta.cls}">${meta.txt}</span>
            ${score > 0 ? '<span class="muted" style="font-size:13px">质检分 <b style="font-size:15px;color:' + accent + '">' + score + "</b> / 100</span>" : ""}
            ${r.strikesLeft != null && !r.banned ? '<span class="tag ' + (r.strikesLeft > 0 ? "tag-outline" : "tag-danger") + '">非 IT 违规剩 ' + r.strikesLeft + " 次机会</span>" : ""}
          </div>
          <h3 style="margin:10px 0 0">${esc(head)}</h3>
          <p style="margin:6px 0 0">${esc(r.message || "")}</p>
          ${score > 0 ? '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">' + bar(score) + "</div>" : ""}
          ${path.length ? '<div class="pill-row" style="margin-top:12px"><span class="muted" style="font-size:13px">AI 建议归入：</span>' + path.map(function (p) { return '<span class="tag tag-outline">' + esc(p) + "</span>"; }).join("") + "</div>" : ""}
          ${reasons.length ? '<div style="margin-top:12px"><div style="font-size:13px;font-weight:600;color:var(--muted)">AI 判断依据</div>' + list(reasons) + "</div>" : ""}
          ${imps.length ? '<div style="margin-top:12px"><div style="font-size:13px;font-weight:600;color:var(--muted)">可以这样改得更好</div>' + list(imps) + "</div>" : ""}
          <div class="row" style="gap:10px;margin-top:16px;flex-wrap:wrap">
            ${r.banned
              ? '<button class="btn btn-danger" id="s-logout">' + U.icon("x") + " 退出登录</button>"
              : '<button class="btn btn-primary" id="s-again">' + U.icon("plus") + " 再投一题</button>" +
                '<a class="btn" href="#/me/submissions">' + U.icon("fileText") + " 查看我的投稿</a>"}
          </div>
          ${r.banned ? '<div class="note" style="margin-top:12px">同一帐号累计 3 次投稿与 IT 技术无关的内容，账号已被永久禁用。如有异议请联系站点管理员。</div>' : ""}
        </div>`;

      const again = $("#s-again");
      if (again) again.onclick = resetForm;
      const lo = $("#s-logout");
      if (lo) lo.onclick = function () { A.logout(); refreshNav(); App.go("/"); };
      if (r.banned) { A.logout(); refreshNav(); }
      if (r.strikesLeft != null) paintQuota({ strikesLeft: r.strikesLeft, strikes: (S._quota && S._quota.strikes) || 0, limit: (S._quota && S._quota.limit) || 3 });
    }

    function renderFail(e) {
      const st = e && e.status;
      const msg = (e && e.message) || "未知错误";
      let extra = "";
      if (st === 429) extra = "投稿限额或频率限制，等一会儿再试。";
      else if (st === 401) extra = "登录已过期，请重新登录后重试（内容还在，不会丢）。";
      else if (st === 400) extra = "多半是格式问题（标题太短、正文太短或含推广词），按提示改一下再提交。";
      else if (e && e.network) extra = "网络不通，稍后重试即可；内容保留在表单里。";
      $("#s-result").innerHTML = '<div class="card" style="margin-top:16px;border-left:4px solid #DC2626">' +
        '<div><span class="tag tag-danger">提交失败</span> ' + esc(msg) + "</div>" +
        (extra ? '<div class="muted" style="font-size:13px;margin-top:8px">' + esc(extra) + "</div>" : "") +
        (st === 401 ? '<div style="margin-top:10px"><a class="btn btn-sm btn-primary" href="#/account">去登录</a></div>' : "") +
        "</div>";
      if (st === 401) { A.logout(); refreshNav(); }
    }

    $("#s-go").onclick = async function () {
      const btn = $("#s-go"), old = btn.innerHTML;
      const title = $("#s-title").value.trim();
      const body = $("#s-body").value.trim();
      const catPath = $("#s-cat").value.trim();
      const catId = catPath ? catPathToId(catPath) : "";

      if (title.length < 6) { U.toast("标题太短，至少 6 个字", "warn"); $("#s-title").focus(); return; }
      if (body.length < 10) { U.toast("题目正文太短，至少 10 个字", "warn"); $("#s-body").focus(); return; }
      if (catPath && !catId) { U.toast("技术分类请从下拉候选里点选一个，或先清空", "warn"); $("#s-cat").focus(); return; }

      btn.disabled = true;
      btn.innerHTML = U.icon("refresh") + " AI 质检中（约 5–15 秒），请勿关闭页面…";
      const out = $("#s-result");
      out.innerHTML = '<div class="card" style="margin-top:16px"><div class="muted">正在提交：AI 正在检查这条内容是否属于本站技术体系、以及质量是否达标…</div></div>';
      try { out.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) {}

      try {
        const r = await A.submitQuestion({
          title: title,
          body: $("#s-body").value,
          answer: $("#s-answer").value,
          difficulty: $("#s-diff").value,
          type: $("#s-type").value,
          tags: $("#s-tags").value.split(/[,，\s]+/).filter(Boolean).slice(0, 12),
          categoryId: catId,
          categoryName: catPath,
          sourceNote: $("#s-note").value.trim(),
          dupCandidates: dupCandidates(title),
        });
        renderResult(r);
        if (!r.banned) {
          /* 保留分类/难度/题型（连投同方向的题更省事），清掉正文类内容 */
          ["#s-title", "#s-body", "#s-answer", "#s-tags", "#s-note"].forEach(function (s) { const el = $(s); if (el) el.value = ""; });
        }
        U.toast(r.banned ? "账号已被永久禁用" : "已提交", r.banned ? "error" : "success");
      } catch (e) {
        renderFail(e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    };
  };

  /* ==================== ② 我的投稿 ==================== */

  S.renderMine = function () {
    document.title = "我的投稿 · IT面试题库";
    if (!requireLogin()) return;
    const A = acc();

    setMain(crumb("我的投稿") + `
      <div class="section-head"><h2>我的投稿</h2></div>
      <div class="toolbar">
        <span id="my-quota" class="muted" style="font-size:13px">加载中…</span>
        <span style="flex:1"></span>
        <button class="btn" id="my-refresh">${U.icon("refresh")} 刷新</button>
        <a class="btn btn-primary" href="#/submit">${U.icon("plus")} 投稿新题</a>
      </div>
      <div class="card" style="padding:0"><table class="data">
        <thead><tr><th style="width:140px">提交时间</th><th>标题</th><th style="width:150px">AI 质检</th><th style="width:110px">审核状态</th><th style="width:240px">审核意见 / 入库编号</th></tr></thead>
        <tbody id="my-tb"><tr><td colspan="5">加载中…</td></tr></tbody></table></div>
      <div class="note" style="margin-top:10px">审核通过只代表「内容可用」，还需要管理员在题目管理里把它加入题库才会正式上线。</div>`);

    function load() {
      const tb = $("#my-tb");
      tb.innerHTML = '<tr><td colspan="5">加载中…</td></tr>';
      A.mySubmissions().then(function (r) {
        const q = $("#my-quota");
        const left = r.strikesLeft == null ? 0 : r.strikesLeft;
        const limit = r.limit || 3;
        q.innerHTML = "非 IT 违规累计 <b>" + (r.strikes || 0) + "</b> / " + limit + " 次" +
          (left > 0 ? '　<span class="tag tag-success">还有 ' + left + " 次机会</span>"
                    : '　<span class="tag tag-danger">已用尽，再投非 IT 内容将被永久禁用</span>');
        const rows = r.submissions || [];
        tb.innerHTML = rows.length ? rows.map(function (s) {
          return "<tr>" +
            '<td class="muted" style="font-size:12px;white-space:nowrap">' + fmt(s.at) + "</td>" +
            '<td><div style="font-weight:600">' + esc(s.title) + "</div>" +
              (s.strike ? '<span class="tag tag-danger" style="margin-top:4px;display:inline-block">计 1 次违规</span>' : "") + "</td>" +
            "<td>" + vTag(s.aiVerdict) + (s.aiScore ? ' <span class="muted" style="font-size:12px">' + s.aiScore + "</span>" : "") + "</td>" +
            "<td>" + rTag(s.reviewStatus) + "</td>" +
            '<td class="muted" style="font-size:12px">' +
              esc(s.reviewNote || "") +
              (s.bankId ? '<div style="margin-top:2px">已入库题目 #' + esc(s.bankId) + "</div>" : "") +
              (!s.reviewNote && !s.bankId ? "—" : "") + "</td>" +
          "</tr>";
        }).join("") : '<tr><td colspan="5">还没有投稿记录。<a href="#/submit">去投第一题</a></td></tr>';
      }).catch(function (e) {
        tb.innerHTML = '<tr><td colspan="5"><span class="tag tag-danger">加载失败</span> ' + esc((e && e.message) || "") +
          ' <button class="btn btn-sm" id="my-retry" style="margin-left:8px">重试</button></td></tr>';
        const b = $("#my-retry");
        if (b) b.onclick = load;
      });
    }
    $("#my-refresh").onclick = load;
    load();
  };

  /* ==================== ③ 审核队列（管理员 + 专家） ==================== */

  const STATUS_LABEL = { open: "待审核", done: "已处理", nonit: "违规记录" };

  S.renderReview = function () {
    document.title = "投稿审核 · IT面试题库";
    if (!requireReviewer()) return;
    const A = acc();
    const isAdmin = A.isServerAdmin();
    S._status = "open";
    S._rows = [];

    setMain(crumb("投稿审核") + `
      <div class="section-head"><h2>投稿审核
        <span class="tag ${isAdmin ? "tag-primary" : "tag-ai"}" style="vertical-align:middle">${isAdmin ? "管理员 · 可审全部" : "专家 · 仅本组 + 未分配"}</span>
      </h2></div>
      <div class="tabs" id="rv-tabs">
        <button class="btn btn-sm btn-primary" data-st="open">待审核</button>
        <button class="btn btn-sm" data-st="done">已处理</button>
        ${isAdmin ? '<button class="btn btn-sm" data-st="nonit">违规记录</button>' : ""}
      </div>
      <div class="toolbar">
        <span id="rv-info" class="muted" style="font-size:13px"></span>
        <span style="flex:1"></span>
        <button class="btn" id="rv-refresh">${U.icon("refresh")} 刷新</button>
      </div>
      <div class="card" style="padding:0"><table class="data"><thead id="rv-head"></thead>
        <tbody id="rv-tb"><tr><td>加载中…</td></tr></tbody></table></div>
      <div id="rv-panel"></div>`);

    const HEAD = {
      open: "<tr><th style='width:56px'>编号</th><th>标题</th><th style='width:150px'>投稿者</th><th style='width:150px'>AI 质检</th><th style='width:130px'>状态</th><th style='width:130px'>提交时间</th><th style='width:110px'>操作</th></tr>",
      done: "<tr><th style='width:56px'>编号</th><th>标题</th><th style='width:150px'>投稿者</th><th style='width:150px'>AI 质检</th><th style='width:110px'>结果</th><th style='width:130px'>处理时间</th><th></th></tr>",
      nonit: "<tr><th style='width:56px'>编号</th><th>标题</th><th style='width:220px'>投稿者</th><th style='width:130px'>账号状态</th><th style='width:130px'>提交时间</th></tr>",
    };

    function load(status) {
      S._status = status || S._status;
      $("#rv-head").innerHTML = HEAD[S._status] || HEAD.open;
      const cols = S._status === "nonit" ? 5 : 7;
      const tb = $("#rv-tb");
      tb.innerHTML = '<tr><td colspan="' + cols + '">加载中…</td></tr>';
      $$("#rv-tabs button").forEach(function (b) {
        b.className = "btn btn-sm" + (b.dataset.st === S._status ? " btn-primary" : "");
      });
      A.adminListSubmissions(S._status).then(function (r) {
        const rows = r.submissions || [];
        S._rows = rows;
        $("#rv-info").textContent = STATUS_LABEL[S._status] + "：" + rows.length + " 条" + (rows.length >= 100 ? "（只显示最近 100 条）" : "");
        const myId = (A.getUser() || {}).id;
        tb.innerHTML = rows.length ? rows.map(function (s) {
          if (S._status === "nonit") {
            return "<tr>" +
              "<td>" + s.id + "</td>" +
              '<td><div style="font-weight:600">' + esc(s.title) + "</div></td>" +
              '<td class="muted" style="font-size:12px">' + esc(s.authorNick || "") + "<br>" + esc(s.authorEmail || "") + "</td>" +
              "<td>" + (s.authorStatus === 1 ? '<span class="tag tag-outline">正常</span>' : '<span class="tag tag-danger">已禁用</span>') + "</td>" +
              '<td class="muted" style="font-size:12px">' + fmt(s.created_at) + "</td>" +
            "</tr>";
          }
          const self = s.user_id === myId;
          let act;
          if (S._status === "done") act = '<span class="muted" style="font-size:12px">' + (s.review_by ? "人工处理" : "AI 自动退回") + "</span>";
          else if (self) act = '<span class="muted" style="font-size:12px">自己的投稿</span>';
          else if (s.review_status === "reviewing" && s.locked_by !== myId) act = '<span class="muted" style="font-size:12px">他人审核中</span>';
          else act = '<button class="btn btn-sm' + (s.ai_verdict === "pass" ? " btn-primary" : "") + '" data-act="claim" data-id="' + s.id + '">' + (s.review_status === "reviewing" ? "继续审核" : "开始审核") + "</button>";
          return "<tr>" +
            "<td>" + s.id + "</td>" +
            '<td><div style="font-weight:600">' + esc(s.title) + "</div>" +
              '<div class="muted" style="font-size:12px">' + esc(s.category_id || "未选分类") + " · " + esc(s.difficulty || "—") + " · " + esc(s.type || "—") +
              (s.groupName ? ' · 分组：' + esc(s.groupName) : "") + "</div></td>" +
            '<td class="muted" style="font-size:12px">' + esc(authorName(s)) + (self ? ' <span class="tag tag-outline">自己</span>' : "") + "</td>" +
            "<td>" + vTag(s.ai_verdict) + (s.ai_score ? ' <span class="muted" style="font-size:12px">' + s.ai_score + "</span>" : "") + "</td>" +
            "<td>" + rTag(s.review_status) + (s.review_note ? '<div class="muted" style="font-size:12px">' + esc(String(s.review_note).slice(0, 40)) + "</div>" : "") + "</td>" +
            '<td class="muted" style="font-size:12px;white-space:nowrap">' + fmt(S._status === "done" ? s.review_at : s.created_at) + "</td>" +
            "<td>" + act + "</td>" +
          "</tr>";
        }).join("") : '<tr><td colspan="' + cols + '">' + STATUS_LABEL[S._status] + "：暂时没有内容</td></tr>";

        $$("#rv-tb button[data-act='claim']").forEach(function (b) {
          b.onclick = function () { claim(parseInt(b.dataset.id, 10), b); };
        });
        /* 顺手更新侧栏/顶栏的待审角标（省掉一次重复请求） */
        if (S._status === "open") {
          const n = rows.filter(function (s) { return s.review_status === "pending"; }).length;
          if (n !== (window.App.reviewPending || 0)) { window.App.reviewPending = n; refreshNav(); }
        }
      }).catch(function (e) {
        const st = e && e.status;
        tb.innerHTML = '<tr><td colspan="' + cols + '">' +
          (st === 403
            ? '<span class="tag tag-danger">没有审核权限</span> ' + esc((e && e.message) || "") +
              '<div class="muted" style="font-size:12px;margin-top:6px">你的角色可能是「普通用户」，或登录会话已失效。可以让管理员在「帐号管理」里把角色设为专家。</div>' +
              '<div style="margin-top:8px"><button class="btn btn-sm btn-primary" id="rv-relogin">' + U.icon("user") + " 重新登录</button></div>"
            : '<span class="tag tag-danger">加载失败</span> ' + esc((e && e.message) || "") +
              '<div style="margin-top:8px"><button class="btn btn-sm btn-primary" id="rv-retry">' + U.icon("refresh") + " 重试</button></div>") +
          "</td></tr>";
        const rl = $("#rv-relogin");
        if (rl) rl.onclick = function () { A.logout(); refreshNav(); App.go("/account"); };
        const rt = $("#rv-retry");
        if (rt) rt.onclick = function () { load(S._status); };
      });
    }

    async function claim(id, btn) {
      const old = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.innerHTML = "认领中…"; }
      try {
        const r = await A.adminClaimSubmission(id);
        const row = S._rows.filter(function (x) { return x.id === id; })[0];
        openPanel(row, r.ai_json);
        load(S._status);      // 让列表同步显示「审核中」
      } catch (e) {
        U.toast((e && e.message) || "认领失败", "error");
        if (e && e.status === 409) load(S._status);
        else if (btn) { btn.disabled = false; btn.innerHTML = old; }
      }
    }

    /* ---------- 审核面板 ---------- */
    function openPanel(row, aiJson) {
      if (!row) { U.toast("找不到这条投稿的数据，请刷新列表", "warn"); return; }
      let ai = {};
      try { ai = JSON.parse(aiJson || "{}") || {}; } catch (_) {}
      let edited = {};
      try { edited = JSON.parse(row.edited_json || "{}") || {}; } catch (_) {}
      const pick = function (k, fallback) { return (edited[k] != null && edited[k] !== "") ? edited[k] : (fallback == null ? "" : fallback); };
      const myId = (A.getUser() || {}).id;
      const self = row.user_id === myId;
      const diffs = ["初级", "中级", "高级", "专家"];
      const types = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];
      const curCat = pick("categoryId", row.category_id);

      $("#rv-panel").innerHTML = `
        <div class="card" style="margin-top:16px;border-left:4px solid ${ACCENT[row.ai_verdict] || "#64748B"}">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
              <h3 style="margin:0 0 4px">#${row.id} ${esc(row.title)}</h3>
              <div class="muted" style="font-size:12px">
                投稿者：${esc(authorName(row))} · 提交于 ${fmt(row.created_at)}
                ${row.groupName ? " · 分组：" + esc(row.groupName) : ""}
                ${row.edited_by_reviewer ? ' · <span class="tag tag-ai">已有审核改动</span>' : ""}
              </div>
            </div>
            <button class="btn btn-sm" id="rv-close">关闭</button>
          </div>
          ${aiReportHtml(ai, row)}

          <div class="grid grid-cols-2" style="gap:16px;margin-top:16px">
            <label class="field"><span>题目标题</span><input id="rv-title" value="${esc(pick("title", row.title))}" /></label>
            <label class="field"><span>技术分类（从下拉里选）</span>
              <input id="rv-cat" list="rv-cat-opts" autocomplete="off" value="${esc(catIdToPath(curCat))}" />
              <input type="hidden" id="rv-cat-id" value="${esc(curCat)}" />
              ${catDatalist("rv-cat-opts")}</label>
            <label class="field"><span>难度</span><select id="rv-diff" class="full">${diffs.map(function (d) { const v = pick("difficulty", row.difficulty) || "中级"; return "<option" + (v === d ? " selected" : "") + ">" + d + "</option>"; }).join("")}</select></label>
            <label class="field"><span>题型</span><select id="rv-type" class="full">${types.map(function (t) { const v = pick("type", row.type) || "简答题"; return "<option" + (v === t ? " selected" : "") + ">" + t + "</option>"; }).join("")}</select></label>
          </div>
          <label class="field"><span>题目正文（Markdown，可直接改）</span>
            <textarea id="rv-body" style="min-height:150px">${esc(pick("body", row.body))}</textarea></label>
          <label class="field"><span>参考答案（Markdown，可直接改）</span>
            <textarea id="rv-answer" style="min-height:200px">${esc(pick("answer", row.answer))}</textarea></label>
          <label class="field"><span>审核意见（会显示给投稿者）</span>
            <input id="rv-note" maxlength="300" value="${esc(row.review_note || "")}" placeholder="可选。打回时会被要求填写理由。" /></label>

          <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:6px">
            ${self
              ? '<span class="tag tag-warning">这是你自己提交的题目，不能自审</span>'
              : '<button class="btn btn-primary" id="rv-pass">' + U.icon("check") + " 通过（可以入库）</button>" +
                '<button class="btn" id="rv-edit">' + U.icon("edit") + " 只保存改动</button>" +
                '<button class="btn btn-danger" id="rv-reject">' + U.icon("x") + " 打回</button>"}
            <button class="btn" id="rv-release">${U.icon("refresh")} 释放认领</button>
            <button class="btn" id="rv-preview">${U.icon("eye")} 预览 Markdown</button>
          </div>
          <div id="rv-preview-box" class="md" style="display:none;margin-top:14px;padding:14px;border-radius:10px;background:rgba(128,128,128,.08)"></div>
          <div class="note" style="margin-top:12px">「通过」只是标记内容可用；正式上线还需要管理员在「题目管理」里把它加进题库。</div>
        </div>`;

      try { $("#rv-panel").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}

      $("#rv-cat").addEventListener("input", function () {
        const id = catPathToId(this.value);
        if (id) $("#rv-cat-id").value = id;
      });
      $("#rv-close").onclick = function () { $("#rv-panel").innerHTML = ""; };
      $("#rv-preview").onclick = function () {
        const box = $("#rv-preview-box");
        if (box.style.display === "none") {
          box.innerHTML = "<h4>题目正文</h4>" + U.md($("#rv-body").value) + "<h4>参考答案</h4>" + U.md($("#rv-answer").value);
          U.highlightAll(box);
          box.style.display = "";
          this.innerHTML = U.icon("eyeOff") + " 收起预览";
        } else {
          box.style.display = "none";
          this.innerHTML = U.icon("eye") + " 预览 Markdown";
        }
      };

      function collectEdited() {
        return {
          title: $("#rv-title").value.trim(),
          body: $("#rv-body").value,
          answer: $("#rv-answer").value,
          difficulty: $("#rv-diff").value,
          type: $("#rv-type").value,
          categoryId: $("#rv-cat-id").value,
        };
      }
      function changed(ed) {
        return ed.title !== (row.title || "") || ed.body !== (row.body || "") || ed.answer !== (row.answer || "") ||
          ed.difficulty !== (row.difficulty || "") || ed.type !== (row.type || "") ||
          String(ed.categoryId || "") !== String(row.category_id || "");
      }

      let payload = null, ed = null;
      async function doReview(action) {
        const note = ($("#rv-note") && $("#rv-note").value.trim()) || "";
        payload = { action: action, note: note };
        ed = collectEdited();
        if (action === "reject") {
          const reason = await U.prompt("打回理由（会显示给投稿者，写清哪里不足更有帮助）", note || "");
          if (reason == null) return;
          payload.note = reason.slice(0, 1000);
        } else if (action === "edit") {
          if (!changed(ed)) { U.toast("内容没有变化，不用保存", "warn"); return; }
          if (ed.title.length < 6) { U.toast("标题至少 6 个字", "warn"); return; }
          payload.edited = ed;
        } else if (action === "approve") {
          if (ed.title.length < 6) { U.toast("标题至少 6 个字，请先补全再通过", "warn"); return; }
          if (!(await U.confirm("确认通过这条投稿？通过后它就可以被加入题库了。", { okText: "确认通过" }))) return;
          if (changed(ed)) payload.edited = ed;
        }
        const btns = $$("#rv-panel .btn");
        btns.forEach(function (b) { b.disabled = true; });
        try {
          await A.adminReviewSubmission(row.id, payload);
          U.toast(action === "approve" ? "已通过" : action === "reject" ? "已打回" : action === "edit" ? "改动已保存" : "已释放", "success");
          $("#rv-panel").innerHTML = "";
          load(S._status);
          S.refreshPending();
        } catch (e) {
          U.toast((e && e.message) || "操作失败", "error");
          if (e && (e.status === 409 || e.status === 403)) load(S._status);
          btns.forEach(function (b) { b.disabled = false; });
        }
      }
      const pass = $("#rv-pass"); if (pass) pass.onclick = function () { doReview("approve"); };
      const edb = $("#rv-edit"); if (edb) edb.onclick = function () { doReview("edit"); };
      const rj = $("#rv-reject"); if (rj) rj.onclick = function () { doReview("reject"); };
      $("#rv-release").onclick = function () { doReview("release"); };
    }

    $$("#rv-tabs button").forEach(function (b) {
      b.onclick = function () { $("#rv-panel").innerHTML = ""; load(b.dataset.st); };
    });
    $("#rv-refresh").onclick = function () { load(S._status); };
    load("open");
  };

  /* ==================== ④ 专家群组（仅管理员） ==================== */

  S.renderGroups = function () {
    document.title = "专家群组 · IT面试题库";
    if (!requireServerAdmin()) return;
    const A = acc();
    S._groups = { groups: [], members: [] };

    setMain(crumb("专家群组") + `
      <div class="section-head"><h2>专家群组</h2></div>
      <div class="note">
        群组用来把审核任务按技术方向分派：<b>投稿里选的分类命中某组负责的分类，就会派给该组</b>；
        没有命中任何组的投稿归「未分配」，所有专家都能看到（避免没人管的分组把投稿卡死）。
        成员只有角色为「专家」时才真的能进审核队列 —— 角色在<a href="#/admin/users">帐号管理</a>里设置。
      </div>
      <div class="card">
        <h3 style="margin-top:0">新建群组</h3>
        <div class="grid grid-cols-2" style="gap:16px">
          <label class="field"><span>群组名称 *</span><input id="g-name" maxlength="60" placeholder="如：后端组 / 数据库组 / 前端组" /></label>
          <label class="field"><span>负责范围说明（可空）</span><input id="g-scope" maxlength="200" placeholder="如：Java、Spring、MySQL、Redis 方向" /></label>
        </div>
        <label class="field"><span>负责的技术分类（可多选：按住 Ctrl / Cmd 点选，Shift 可连选）</span>
          <select id="g-cats" multiple size="10" class="full" style="min-height:200px">
            ${flatCats().map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.path) + "</option>"; }).join("")}
          </select></label>
        <div class="row" style="gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="g-create">${U.icon("plus")} 创建群组</button>
          <span id="g-picked" class="muted" style="font-size:13px">已选 0 个分类</span>
        </div>
      </div>
      <div class="card" style="padding:0"><table class="data">
        <thead><tr><th style="width:56px">ID</th><th style="width:180px">群组</th><th>负责分类</th><th style="width:280px">成员</th><th style="width:100px">操作</th></tr></thead>
        <tbody id="g-tb"><tr><td colspan="5">加载中…</td></tr></tbody></table></div>`);

    const sel = $("#g-cats");
    sel.addEventListener("change", function () {
      $("#g-picked").textContent = "已选 " + $$("#g-cats option:checked").length + " 个分类";
    });

    function catNames(ids) {
      return ids.map(function (id) {
        const f = flatCats().filter(function (c) { return String(c.id) === String(id); })[0];
        return f ? f.path : ("#" + id);
      });
    }

    function load() {
      const tb = $("#g-tb");
      tb.innerHTML = '<tr><td colspan="5">加载中…</td></tr>';
      A.adminGroups().then(function (r) {
        S._groups = { groups: r.groups || [], members: r.members || [] };
        const gs = S._groups.groups;
        tb.innerHTML = gs.length ? gs.map(function (g) {
          let ids = [];
          try { ids = JSON.parse(g.category_ids || "[]"); } catch (_) {}
          const paths = catNames(ids);
          const ms = S._groups.members.filter(function (m) { return m.groupId === g.id; });
          return "<tr>" +
            "<td>" + g.id + "</td>" +
            '<td><div style="font-weight:600">' + esc(g.name) + "</div>" +
              (g.scope ? '<div class="muted" style="font-size:12px">' + esc(g.scope) + "</div>" : "") + "</td>" +
            '<td>' + (paths.length
              ? '<div class="pill-row" style="flex-wrap:wrap;gap:4px">' + paths.slice(0, 12).map(function (p) { return '<span class="tag tag-outline">' + esc(p) + "</span>"; }).join("") +
                (paths.length > 12 ? '<span class="muted" style="font-size:12px">等 ' + paths.length + " 个分类</span>" : "") + "</div>"
              : '<span class="muted" style="font-size:12px">未指定（该组只审「未分配」的投稿）</span>') + "</td>" +
            '<td>' + (ms.length
              ? '<div class="pill-row" style="flex-wrap:wrap;gap:4px">' + ms.map(function (m) {
                  return '<span class="chip">' + esc(m.nick || m.email) + '<span class="x" data-g="' + g.id + '" data-u="' + m.userId + '" title="移出群组">' + U.icon("x") + "</span></span>";
                }).join("") + "</div>"
              : '<span class="muted" style="font-size:12px">暂无成员</span>') +
              '<div style="margin-top:6px"><button class="btn btn-sm" data-act="member" data-id="' + g.id + '">' + U.icon("plus") + " 管理成员</button></div></td>" +
            '<td><button class="btn btn-sm btn-danger" data-act="del" data-id="' + g.id + '">删除</button></td>' +
          "</tr>";
        }).join("") : '<tr><td colspan="5">还没有群组。不建群组也能审核：所有专家都会看到全部「未分配」的投稿。</td></tr>';

        $$("#g-tb button[data-act='member']").forEach(function (b) {
          b.onclick = function () { openMembers(parseInt(b.dataset.id, 10)); };
        });
        $$("#g-tb button[data-act='del']").forEach(function (b) {
          b.onclick = async function () {
            const g = S._groups.groups.filter(function (x) { return x.id === parseInt(b.dataset.id, 10); })[0];
            if (!g) return;
            if (!(await U.confirm('删除群组「' + g.name + '」？其成员关系会一并清除（不影响用户本身的专家角色）。', { okText: "删除", danger: true }))) return;
            try { await A.adminGroupDelete(g.id); U.toast("已删除", "success"); load(); }
            catch (e) { U.toast((e && e.message) || "删除失败", "error"); }
          };
        });
        $$("#g-tb .chip .x").forEach(function (x) {
          x.onclick = async function () {
            try { await A.adminGroupMember(parseInt(x.dataset.g, 10), parseInt(x.dataset.u, 10), true); U.toast("已移出", "success"); load(); }
            catch (e) { U.toast((e && e.message) || "操作失败", "error"); }
          };
        });
      }).catch(function (e) {
        tb.innerHTML = '<tr><td colspan="5"><span class="tag tag-danger">加载失败</span> ' + esc((e && e.message) || "") +
          ' <button class="btn btn-sm" id="g-retry" style="margin-left:8px">重试</button></td></tr>';
        const b = $("#g-retry");
        if (b) b.onclick = load;
      });
    }

    /* 成员选择器：搜用户 → 加入 / 移出。复用管理员用户列表接口（仅 admin 可调）。 */
    function openMembers(groupId) {
      const g = S._groups.groups.filter(function (x) { return x.id === groupId; })[0];
      if (!g) return;
      const m = U.modal({ title: "「" + g.name + "」成员", wide: true });
      m.body.innerHTML = '<label class="field"><span>搜索用户（邮箱或昵称，留空列出最近 200 个）</span>' +
        '<input id="mp-q" placeholder="输入关键词后回车" /></label>' +
        '<div class="row" style="margin:10px 0"><button class="btn btn-primary btn-sm" id="mp-go">搜索</button></div>' +
        '<div id="mp-list" class="muted" style="font-size:13px">输入关键词开始搜索，或直接点「搜索」列出全部</div>';

      function inGroup(uid) {
        return S._groups.members.some(function (x) { return x.groupId === groupId && x.userId === uid; });
      }
      function render(users) {
        const box = $("#mp-list");
        if (!users.length) { box.innerHTML = '<span class="muted">没有匹配的用户</span>'; return; }
        box.innerHTML = '<table class="data" style="width:100%"><thead><tr><th>ID</th><th>邮箱</th><th>昵称</th><th>角色</th><th style="width:110px">操作</th></tr></thead><tbody>' +
          users.map(function (u) {
            const yes = inGroup(u.id);
            return "<tr><td>" + u.id + "</td><td>" + esc(u.email) + "</td><td>" + esc(u.nick || "-") + "</td>" +
              "<td>" + (u.role === "admin" ? '<span class="tag tag-primary">管理员</span>' : u.role === "expert" ? '<span class="tag tag-ai">专家</span>' : '<span class="muted">普通用户</span>') + "</td>" +
              '<td><button class="btn btn-sm' + (yes ? "" : " btn-primary") + '" data-u="' + u.id + '" data-rm="' + (yes ? "1" : "0") + '">' + (yes ? "移出" : "加入") + "</button></td></tr>";
          }).join("") + "</tbody></table>" +
          '<div class="muted" style="font-size:12px;margin-top:8px">只有角色为「专家」的成员才会真的进审核队列；普通用户加进来也不会有审核入口。</div>';
        $$("button[data-u]", box).forEach(function (b) {
          b.onclick = async function () {
            b.disabled = true;
            try {
              await A.adminGroupMember(groupId, parseInt(b.dataset.u, 10), b.dataset.rm === "1");
              const r = await A.adminGroups();
              S._groups = { groups: r.groups || [], members: r.members || [] };
              U.toast(b.dataset.rm === "1" ? "已移出" : "已加入", "success");
              render(users);
              load();
            } catch (e) { U.toast((e && e.message) || "操作失败", "error"); b.disabled = false; }
          };
        });
      }
      async function search() {
        $("#mp-list").innerHTML = "加载中…";
        try { const r = await A.adminListUsers($("#mp-q").value.trim()); render(r.users || []); }
        catch (e) { $("#mp-list").innerHTML = '<span class="tag tag-danger">加载失败</span> ' + esc((e && e.message) || ""); }
      }
      $("#mp-go").onclick = search;
      $("#mp-q").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); search(); } });
      search();
    }

    $("#g-create").onclick = async function () {
      const btn = $("#g-create"), old = btn.innerHTML;
      const name = $("#g-name").value.trim();
      if (!name) { U.toast("请填写群组名称", "warn"); $("#g-name").focus(); return; }
      const ids = $$("#g-cats option:checked").map(function (o) { return o.value; });
      btn.disabled = true; btn.innerHTML = "创建中…";
      try {
        await A.adminGroupCreate(name, $("#g-scope").value.trim(), ids);
        U.toast("群组已创建", "success");
        $("#g-name").value = ""; $("#g-scope").value = "";
        $$("#g-cats option").forEach(function (o) { o.selected = false; });
        $("#g-picked").textContent = "已选 0 个分类";
        load();
      } catch (e) { U.toast((e && e.message) || "创建失败", "error"); }
      finally { btn.disabled = false; btn.innerHTML = old; }
    };

    load();
  };

  /* ==================== ⑤ 待入库（审核通过 → 收进本机题库） ====================
   * 这是「审核」与「发布」之间的最后一道人工闸门，也是投稿变成题目的**唯一**出口：
   *   审核通过（approved）只说明内容可用、可以收，题还没进库；
   *   收录 = ① 写进本机 IndexedDB（Services.addQuestion）→ ② 把新题号回写服务端（bank_id）。
   * 两步分开是有意的：① 失败不会动服务端；② 失败也不丢题 —— 这条投稿仍留在「待入库」，
   * 刷新再点一次即可（本地已有同标题会被收录前的查重拦下，不会重复入库）。
   * 反向的「撤销入库」把 bank_id 写回空串，条目自动回到「待入库」，用于分类选错或本地误删。
   */
  const IB_LABEL = { inbox: "待入库", inbanked: "已入库" };

  S.renderInbox = function () {
    document.title = "待入库投稿 · IT面试题库";
    if (!requireServerAdmin("「待入库」是审核与发布之间的最后一道闸门 —— 把审核通过的投稿收进本机题库。这一步只有管理员能操作。")) return;
    const A = acc();
    S._ibStatus = "inbox";
    S._ibRows = [];

    setMain(crumb("待入库") + `
      <div class="section-head"><h2>待入库
        <span class="tag tag-primary" style="vertical-align:middle">管理员 · 审核通过待收录</span>
      </h2></div>
      <div class="note ai" style="margin-bottom:14px">
        <b>审核通过 ≠ 已进题库。</b>专家判过的题在这里等你最后确认一次：点「收录」把它写进<b>本机题库</b>，
        并把题号回写服务端，这条就离开本列表。默认存为<b>草稿</b>，想直接上线就用「收录并发布」。
      </div>
      <div class="tabs" id="ib-tabs">
        <button class="btn btn-sm btn-primary" data-st="inbox">待入库</button>
        <button class="btn btn-sm" data-st="inbanked">已入库</button>
      </div>
      <div class="toolbar">
        <span id="ib-info" class="muted" style="font-size:13px"></span>
        <span style="flex:1"></span>
        <a class="btn" href="#/admin/questions">${U.icon("layers")} 题目管理</a>
        <button class="btn" id="ib-refresh">${U.icon("refresh")} 刷新</button>
      </div>
      <div class="card" style="padding:0"><table class="data"><thead id="ib-head"></thead>
        <tbody id="ib-tb"><tr><td>加载中…</td></tr></tbody></table></div>
      <div id="ib-panel"></div>`);

    const HEAD = {
      inbox: "<tr><th style='width:56px'>编号</th><th>标题</th><th style='width:150px'>投稿者</th><th style='width:140px'>审核人</th><th style='width:130px'>AI 质检</th><th style='width:130px'>通过时间</th><th style='width:120px'>操作</th></tr>",
      inbanked: "<tr><th style='width:56px'>编号</th><th>标题</th><th style='width:170px'>本机题库</th><th style='width:140px'>审核人</th><th style='width:130px'>通过时间</th><th style='width:140px'>操作</th></tr>",
    };

    /* 已入库列表里的「本地题号」是否真的存在于本机题库 —— 本地可能已被删/被清库，
       那种情况必须显眼提示，否则管理员会以为题还在。 */
    function localQuestion(bankId) {
      return (Services.questions || []).filter(function (q) { return String(q.id) === String(bankId); })[0];
    }

    function rowInbox(s) {
      let ai = {};
      try { ai = JSON.parse(s.ai_json || "{}") || {}; } catch (_) {}
      const cat = catIdToPath(aiCatPathToId(ai.categoryPath)) || catIdToPath(s.category_id);
      return "<tr>" +
        "<td>" + s.id + "</td>" +
        '<td><div style="font-weight:600">' + esc(s.title) + "</div>" +
          '<div class="muted" style="font-size:12px">' + esc(cat || "未选分类") + " · " + esc(s.difficulty || "—") + " · " + esc(s.type || "—") +
          (s.groupName ? " · 分组：" + esc(s.groupName) : "") + "</div>" +
          (s.edited_by_reviewer ? '<div style="font-size:12px"><span class="tag tag-ai">审核时改过</span></div>' : "") +
        "</td>" +
        '<td class="muted" style="font-size:12px">' + esc(authorName(s)) + "</td>" +
        '<td class="muted" style="font-size:12px">' + esc(s.reviewerNick || "—") + "</td>" +
        "<td>" + vTag(s.ai_verdict) + (s.ai_score ? ' <span class="muted" style="font-size:12px">' + s.ai_score + "</span>" : "") + "</td>" +
        '<td class="muted" style="font-size:12px;white-space:nowrap">' + fmt(s.review_at) + "</td>" +
        '<td><button class="btn btn-sm btn-primary" data-act="collect" data-id="' + s.id + '">' + U.icon("plus") + " 收录</button></td>" +
      "</tr>";
    }

    function rowInbanked(s) {
      const bid = String(s.bank_id || "");
      const local = localQuestion(bid);
      const canOpen = window.Auth && Auth.isAdmin();          // 题目管理走本地密码门禁
      let cell;
      if (!local) {
        cell = '<span class="tag tag-warning">本机已无此题</span><div class="muted" style="font-size:12px">#' + esc(bid) + "</div>";
      } else if (canOpen) {
        cell = '<a class="btn btn-sm" href="#/admin/question/' + esc(bid) + '">#' + esc(bid) + "</a> " +
          (local.status === "published" ? '<span class="tag tag-success">已发布</span>' : '<span class="tag tag-outline">' + esc(local.status || "draft") + "</span>");
      } else {
        cell = "<span>#" + esc(bid) + '</span> <span class="tag tag-outline">' + esc(local.status || "draft") + '</span>' +
          '<div class="muted" style="font-size:12px">解锁管理密码后可点开</div>';
      }
      return "<tr>" +
        "<td>" + s.id + "</td>" +
        '<td><div style="font-weight:600">' + esc(s.title) + "</div>" +
          '<div class="muted" style="font-size:12px">' + esc(catIdToPath(s.category_id) || "未选分类") + " · " + esc(s.difficulty || "—") + "</div></td>" +
        "<td>" + cell + "</td>" +
        '<td class="muted" style="font-size:12px">' + esc(s.reviewerNick || "—") + "</td>" +
        '<td class="muted" style="font-size:12px;white-space:nowrap">' + fmt(s.review_at) + "</td>" +
        '<td><button class="btn btn-sm" data-act="undo" data-id="' + s.id + '">' + U.icon("refresh") + " 撤销入库</button></td>" +
      "</tr>";
    }

    function load(status) {
      S._ibStatus = status || S._ibStatus;
      const st = S._ibStatus;
      $("#ib-head").innerHTML = HEAD[st] || HEAD.inbox;
      const cols = st === "inbox" ? 7 : 6;
      const tb = $("#ib-tb");
      tb.innerHTML = '<tr><td colspan="' + cols + '">加载中…</td></tr>';
      $$("#ib-tabs button").forEach(function (b) {
        b.className = "btn btn-sm" + (b.dataset.st === st ? " btn-primary" : "");
      });
      A.adminListSubmissions(st).then(function (r) {
        const rows = r.submissions || [];
        S._ibRows = rows;
        $("#ib-info").textContent = IB_LABEL[st] + "：" + rows.length + " 条" + (rows.length >= 100 ? "（只显示最近 100 条）" : "");
        tb.innerHTML = rows.length
          ? rows.map(function (s) { return st === "inbox" ? rowInbox(s) : rowInbanked(s); }).join("")
          : '<tr><td colspan="' + cols + '">' + IB_LABEL[st] + "：暂时没有内容。" +
            (st === "inbox" ? "所有审核通过的投稿都已收录。" : "还没有收录过任何投稿。") + "</td></tr>";
        $$("#ib-tb button[data-act='collect']").forEach(function (b) {
          b.onclick = function () {
            const id = parseInt(b.dataset.id, 10);
            openCollector(S._ibRows.filter(function (x) { return x.id === id; })[0]);
          };
        });
        $$("#ib-tb button[data-act='undo']").forEach(function (b) {
          b.onclick = function () { undo(parseInt(b.dataset.id, 10), b); };
        });
        if (st === "inbox") {
          const n = rows.length;
          if (n !== (window.App.inboxPending || 0)) { window.App.inboxPending = n; refreshNav(); }
        }
      }).catch(function (e) {
        const code = e && e.status;
        tb.innerHTML = '<tr><td colspan="' + cols + '">' +
          (code === 403
            ? '<span class="tag tag-danger">没有管理员权限</span> ' + esc((e && e.message) || "") +
              '<div class="muted" style="font-size:12px;margin-top:6px">待入库涉及「发布链路」，只对管理员开放。若你的角色是专家，请走「投稿审核」。</div>'
            : '<span class="tag tag-danger">加载失败</span> ' + esc((e && e.message) || "") +
              '<div style="margin-top:8px"><button class="btn btn-sm btn-primary" id="ib-retry">' + U.icon("refresh") + " 重试</button></div>") +
          "</td></tr>";
        const rt = $("#ib-retry");
        if (rt) rt.onclick = function () { load(S._ibStatus); };
      });
    }

    /* ---------- 收录面板：把投稿「翻译」成一道本地题目 ---------- */
    function openCollector(row) {
      if (!row) { U.toast("找不到这条投稿的数据，请刷新列表", "warn"); return; }
      let ai = {};
      try { ai = JSON.parse(row.ai_json || "{}") || {}; } catch (_) {}
      let edited = {};
      try { edited = JSON.parse(row.edited_json || "{}") || {}; } catch (_) {}
      /* 取值优先级：审核员的改动 > 投稿原文。审核员改过的版本才是被通过的那一版。 */
      const pick = function (k, fallback) { return (edited[k] != null && edited[k] !== "") ? edited[k] : (fallback == null ? "" : fallback); };
      const aiCatId = aiCatPathToId(ai.categoryPath);
      const curCat = pick("categoryId", row.category_id) || aiCatId;
      let tagList = [];
      try { tagList = JSON.parse(pick("tags", row.tags) || "[]"); } catch (_) { tagList = []; }
      if (!Array.isArray(tagList)) tagList = String(tagList || "").split(/[,，]/);
      tagList = tagList.map(function (t) { return String(t || "").trim(); }).filter(Boolean);
      const diffs = ["初级", "中级", "高级", "专家"];
      const types = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];
      const curDiff = pick("difficulty", row.difficulty) || "中级";
      const curType = pick("type", row.type) || "简答题";

      $("#ib-panel").innerHTML = `
        <div class="card" style="margin-top:16px;border-left:4px solid ${ACCENT[row.ai_verdict] || "#64748B"}">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
              <h3 style="margin:0 0 4px">#${row.id} ${esc(pick("title", row.title))}</h3>
              <div class="muted" style="font-size:12px">
                投稿者：${esc(authorName(row))} · 通过于 ${fmt(row.review_at)}
                ${row.reviewerNick ? " · 审核：" + esc(row.reviewerNick) : ""}
                ${row.groupName ? " · 分组：" + esc(row.groupName) : ""}
                ${row.edited_by_reviewer ? ' · <span class="tag tag-ai">审核时改过</span>' : ""}
              </div>
            </div>
            <button class="btn btn-sm" id="ib-close">关闭</button>
          </div>
          ${row.review_note ? '<div class="note" style="margin-top:10px">审核意见：' + esc(String(row.review_note).slice(0, 300)) + "</div>" : ""}
          ${aiReportHtml(ai, row)}
          ${((ai.categoryPath && ai.categoryPath.length) && !aiCatId)
            ? '<div class="note" style="margin-top:10px">AI 建议的分类「' + esc(ai.categoryPath.join(" / ")) +
              '」在本站技术体系里没有完全对应的节点，已置空 —— 请手动从下拉里点选一个。</div>'
            : ""}

          <div class="grid grid-cols-2" style="gap:16px;margin-top:16px">
            <label class="field"><span>题目标题</span><input id="ib-title" value="${esc(pick("title", row.title))}" /></label>
            <label class="field"><span>技术分类（必选，从下拉里点选）</span>
              <input id="ib-cat" list="ib-cat-opts" autocomplete="off" value="${esc(catIdToPath(curCat))}" />
              <input type="hidden" id="ib-cat-id" value="${esc(curCat)}" />
              ${catDatalist("ib-cat-opts")}</label>
            <label class="field"><span>难度</span><select id="ib-diff" class="full">${diffs.map(function (d) { return "<option" + (d === curDiff ? " selected" : "") + ">" + d + "</option>"; }).join("")}</select></label>
            <label class="field"><span>题型</span><select id="ib-type" class="full">${types.map(function (t) { return "<option" + (t === curType ? " selected" : "") + ">" + t + "</option>"; }).join("")}</select></label>
          </div>
          <label class="field"><span>标签（逗号分隔，可留空）</span>
            <input id="ib-tags" value="${esc(tagList.join("，"))}" placeholder="如：索引优化，执行计划" /></label>
          <label class="field"><span>题目正文（Markdown）</span>
            <textarea id="ib-body" style="min-height:150px">${esc(pick("body", row.body))}</textarea></label>
          <label class="field"><span>参考答案（Markdown）</span>
            <textarea id="ib-answer" style="min-height:200px">${esc(pick("answer", row.answer))}</textarea></label>

          <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:6px">
            <button class="btn btn-primary" id="ib-draft">${U.icon("check")} 收录（存草稿）</button>
            <button class="btn" id="ib-pub">${U.icon("upload")} 收录并发布</button>
            <button class="btn" id="ib-preview">${U.icon("eye")} 预览 Markdown</button>
          </div>
          <div id="ib-preview-box" class="md" style="display:none;margin-top:14px;padding:14px;border-radius:10px;background:rgba(128,128,128,.08)"></div>
          <div class="note" style="margin-top:12px">
            「收录」只写<b>本机题库</b>（这台浏览器），题号会回写服务端以免重复收录；
            题目来源记为 <code>submission</code>，备注里留了投稿编号、投稿者与审核人。
            云端发布仍走原有流程，可在「备份恢复」页查看云端状态。
          </div>
        </div>`;

      try { $("#ib-panel").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}

      $("#ib-cat").addEventListener("input", function () {
        const id = catPathToId(this.value);
        if (id) $("#ib-cat-id").value = id;
      });
      $("#ib-close").onclick = function () { $("#ib-panel").innerHTML = ""; };
      $("#ib-preview").onclick = function () {
        const box = $("#ib-preview-box");
        if (box.style.display === "none") {
          box.innerHTML = "<h4>题目正文</h4>" + U.md($("#ib-body").value) + "<h4>参考答案</h4>" + U.md($("#ib-answer").value);
          U.highlightAll(box);
          box.style.display = "";
          this.innerHTML = U.icon("eyeOff") + " 收起预览";
        } else {
          box.style.display = "none";
          this.innerHTML = U.icon("eye") + " 预览 Markdown";
        }
      };

      async function doCollect(publish) {
        const title = $("#ib-title").value.trim();
        const body = $("#ib-body").value;
        const catId = $("#ib-cat-id").value;
        const tags = $("#ib-tags").value.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 12);

        if (title.length < 6) { U.toast("标题至少 6 个字", "warn"); return; }
        if (!catId) { U.toast("请从下拉候选里点选一个技术分类", "warn"); $("#ib-cat").focus(); return; }
        if (String(body || "").trim().length < 10) { U.toast("题目正文太短（至少 10 个字）", "warn"); return; }

        /* 收录前的最后一道查重：连草稿一起比 —— 这一步是防「同一篇稿子被收两次」的关键。
           提示里不放换行（U.confirm 会把文本转义进 <p>，换行不生效）。 */
        const dups = dupCandidates(title, Services.questions || [], 0.55);
        if (dups.length) {
          const names = dups.map(function (t) { return "「" + String(t).slice(0, 30) + "」"; }).join("、");
          if (!(await U.confirm("本机题库里已有 " + dups.length + " 道标题高度相似的题：" + names + "。仍要收录吗？",
            { okText: "仍要收录", note: "若确认是同一道题，请关掉本面板，去题目管理里处理已有的那一道。" }))) return;
        }
        if (publish && !(await U.confirm("收录后直接发布到题库（所有人可见）？",
          { okText: "收录并发布", note: "内容已经过人工审核；发布前最好再核对一遍分类与答案。" }))) return;

        const btns = $$("#ib-panel .btn");
        btns.forEach(function (b) { b.disabled = true; });
        const first = $("#ib-draft"); if (first) first.innerHTML = "写入本机题库…";

        let newId = null;
        try {
          newId = await Services.addQuestion({
            categoryId: catId ? parseInt(catId, 10) : null,
            title: title, body: body, answer: $("#ib-answer").value,
            difficulty: $("#ib-diff").value, type: $("#ib-type").value,
            tags: tags, years: "",
            positionIds: [], positionNames: [],
            source: "submission",
            aiScore: num(row.ai_score),
            status: publish ? "published" : "draft",
            remark: "投稿 #" + row.id + " · 投稿者 " + authorName(row) + (row.reviewerNick ? " · 审核 " + row.reviewerNick : ""),
          });
          await Services.reload();
        } catch (e) {
          U.toast("写入本机题库失败：" + ((e && e.message) || e), "error");
          if (first) first.innerHTML = U.icon("check") + " 收录（存草稿）";
          btns.forEach(function (b) { b.disabled = false; });
          return;
        }

        /* 第 ② 步：回写题号。**失败也不回滚本地题** —— 题已经写进去了，删掉才是真丢数据；
           只提示这条还会留在「待入库」，刷新后别重复点。 */
        try {
          await A.adminInbank(row.id, String(newId));
          U.toast("已收录为题目 #" + newId + (publish ? "（已发布）" : "（草稿）"), "success");
          $("#ib-panel").innerHTML = "";
          load(S._ibStatus);
          S.refreshInboxBadge();
        } catch (e) {
          U.toast("题目已写进本机题库（#" + newId + "），但题号回写服务端失败：" + ((e && e.message) || e) +
            "。这条仍会留在「待入库」，请勿重复收录。", "error", 9000);
          load(S._ibStatus);
        }
      }
      $("#ib-draft").onclick = function () { doCollect(false); };
      $("#ib-pub").onclick = function () { doCollect(true); };
    }

    async function undo(id, btn) {
      const row = S._ibRows.filter(function (x) { return x.id === id; })[0];
      if (!row) return;
      const local = localQuestion(row.bank_id);
      if (!(await U.confirm("撤销投稿 #" + id + " 的入库记录？", {
        okText: "撤销入库",
        note: local
          ? "本机题目 #" + row.bank_id + " 不会被删除 —— 撤销只是让这条投稿回到「待入库」，方便换个分类重收。要删题请去题目管理。"
          : "本机题库里已经没有对应题目了，撤销后这条投稿回到「待入库」，可以重新收录。",
      }))) return;
      if (btn) btn.disabled = true;
      try {
        await A.adminInbank(id, "");
        U.toast("已撤销入库，该投稿回到「待入库」", "success");
        load(S._ibStatus);
        S.refreshInboxBadge();
      } catch (e) {
        U.toast((e && e.message) || "撤销失败", "error");
        if (btn) btn.disabled = false;
      }
    }

    $$("#ib-tabs button").forEach(function (b) {
      b.onclick = function () { $("#ib-panel").innerHTML = ""; load(b.dataset.st); };
    });
    $("#ib-refresh").onclick = function () { load(S._ibStatus); };
    load("inbox");
  };

  /* ==================== 待审角标 ==================== */

  /* 只有审核角色才真的发请求；条数变化才重渲染导航，避免无谓的 DOM 抖动。 */
  S.refreshPending = async function () {
    const A = acc();
    if (!A || !A.isReviewer()) {
      if (window.App && App.reviewPending) { App.reviewPending = 0; refreshNav(); }
      return 0;
    }
    try {
      const r = await A.adminListSubmissions("open");
      const n = (r.submissions || []).filter(function (s) { return s.review_status === "pending"; }).length;
      if (n !== (window.App.reviewPending || 0)) { window.App.reviewPending = n; refreshNav(); }
      return n;
    } catch (e) { return 0; }
  };

  /* 侧栏「待入库」角标：只有管理员才真的发请求。与 refreshPending 同构，
     但**必须分开请求** —— "open" 与 "inbox" 是两个不同的 status，
     拼在一起会多跑一次全表扫描（列表都是 LIMIT 100 的查询）。 */
  S.refreshInboxBadge = async function () {
    const A = acc();
    if (!A || !A.isServerAdmin()) {
      if (window.App && App.inboxPending) { App.inboxPending = 0; refreshNav(); }
      return 0;
    }
    try {
      const r = await A.adminListSubmissions("inbox");
      const n = (r.submissions || []).length;
      if (n !== (window.App.inboxPending || 0)) { window.App.inboxPending = n; refreshNav(); }
      return n;
    } catch (e) { return 0; }
  };

  try {
    /* 启动时先按本地缓存的角色判断（不用等 /auth/me 回来），有 token 就拉一次。
       两个角标各拉各的：待审（open）给 admin+expert，待入库（inbox）只给 admin —— 各自内部
       都先判角色再发请求，非管理员不会白跑一次网络。 */
    if (window.Account && Account.getToken()) { S.refreshPending(); S.refreshInboxBadge(); }
    /* 登录 / 退出 / 提权 / 降级后 account.js 会回调 App.onAccountRefreshed，这里包一层补刷角标 */
    if (window.App && typeof App.onAccountRefreshed === "function") {
      const orig = App.onAccountRefreshed;
      App.onAccountRefreshed = function () {
        try { orig.apply(this, arguments); } catch (_) {}
        try { S.refreshPending(); } catch (_) {}
        try { S.refreshInboxBadge(); } catch (_) {}
      };
    }
  } catch (e) {}
})();
