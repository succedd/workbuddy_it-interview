/* =========================================================================
 *  js/docs.js — 「学」版块：技术教程（#/docs）
 *
 *  定位：按「方向 × 初级/中级/高级」组织的成套技术教程，按顺序读即可。
 *  与题库的关系：章末按关键词自动挂本知识点的题，学完就能练（学练闭环）。
 *
 *  路由：
 *    #/docs                          方向列表
 *    #/docs/<dir>                    方向页（分级目录 + 进度）
 *    #/docs/<dir>/<level>/<chapter>  阅读页（目录树 + 正文 + 上下章 + 挂题）
 *
 *  依赖：全局 U（utils） / setMain（app.js 暴露） / App.go / DB（可选，用于挂题）
 *  数据：window.DOCS（js/docs-data.js）
 * ========================================================================= */
(function () {
  "use strict";
  const $ = U.qs, $$ = U.qsa;

  /* ---------------- 样式（页面级，不动全局 style.css，避免影响其它页面） ---------------- */
  const CSS = `
.docs-wrap{display:flex;gap:22px;align-items:flex-start}
.docs-toc{flex:none;width:248px;position:sticky;top:74px;max-height:calc(100vh - 110px);overflow:auto;
  background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:12px 10px}
.docs-body{flex:1;min-width:0}
.dt-dir{font-size:14px;font-weight:700;padding:2px 8px 8px;border-bottom:1px solid var(--border);margin-bottom:6px}
.dt-level{font-size:12px;font-weight:700;color:var(--text-muted);padding:10px 8px 4px;display:flex;justify-content:space-between;align-items:center}
.dt-level .dt-cnt{font-weight:600;color:var(--text-secondary)}
.dt-item{display:block;font-size:13px;line-height:1.5;padding:6px 8px;border-radius:6px;color:var(--text-secondary);text-decoration:none;margin:1px 0}
.dt-item:hover{background:var(--bg-hover);color:var(--text)}
.dt-item.active{background:var(--c-primary-50);color:var(--c-primary);font-weight:600}
.dt-item.done{color:var(--c-success)}
.dt-item .dt-ck{flex:none;margin-right:4px}
.docs-dir-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px;margin-top:14px}
/* 卡片改 flex 列 + 等高（2026-09-24 评审 P2-17）：描述文字行数不同会让同排卡片高矮不齐，
   进度条位置也跟着飘。现在描述统一截断 3 行、进度条用 margin-top:auto 压到底、卡片吃满行高。 */
.docs-dir-card{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:16px;
  text-decoration:none;color:inherit;transition:box-shadow .15s,transform .15s;display:flex;flex-direction:column;height:100%}
.docs-dir-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.docs-dir-card h3{margin:0 0 6px;font-size:16px}
.docs-dir-card p{margin:0;font-size:13px;color:var(--text-secondary);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.docs-dir-card .docs-bar{margin-top:auto}
.docs-bar{height:6px;border-radius:999px;background:var(--bg-subtle);overflow:hidden;margin-top:10px}
.docs-bar>i{display:block;height:100%;background:var(--c-primary);border-radius:999px;transition:width .3s}
.lv-card{margin-top:14px}
.lv-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.lv-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.lv-item{display:flex;align-items:center;gap:8px;padding:11px 13px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--bg-elevated);text-decoration:none;color:inherit;font-size:14px;transition:border-color .15s,background .15s}
.lv-item:hover{border-color:var(--c-primary);background:var(--c-primary-50)}
.lv-item .lv-no{flex:none;width:26px;height:26px;border-radius:50%;background:var(--bg-subtle);color:var(--text-secondary);
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.lv-item.done .lv-no{background:var(--c-success);color:#fff}
.lv-meta{margin-left:auto;font-size:12px;color:var(--text-muted);flex:none}
.doc-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--text-muted);margin:8px 0 4px}
.doc-meta .tag{cursor:default}
.doc-body{font-size:15px;line-height:1.85;color:var(--text)}
.doc-body h2{font-size:18px;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.doc-body h3{font-size:15px;margin:18px 0 8px}
.doc-body p{margin:10px 0}
.doc-body ul,.doc-body ol{padding-left:22px;margin:10px 0}
.doc-body li{margin:5px 0}
.doc-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13.5px}
.doc-body th,.doc-body td{border:1px solid var(--border);padding:7px 10px;text-align:left}
.doc-body th{background:var(--bg-subtle);font-weight:600}
.doc-body blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid var(--c-warning);background:var(--bg-subtle);color:var(--text-secondary)}
.doc-body code{background:var(--bg-subtle);padding:1px 5px;border-radius:4px;font-size:13px}
.doc-body pre{background:var(--bg-subtle);padding:12px;border-radius:var(--radius-sm);overflow:auto;margin:12px 0}
.doc-body pre code{background:none;padding:0}
.doc-body input[type=checkbox]{margin-right:6px}
.doc-nav{display:flex;gap:10px;justify-content:space-between;margin-top:18px;flex-wrap:wrap}
.doc-nav a{flex:1;min-width:140px;display:block;padding:11px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);
  text-decoration:none;color:inherit;background:var(--bg-elevated);font-size:14px}
.doc-nav a:hover{border-color:var(--c-primary)}
.doc-nav a.next{text-align:right}
.doc-nav .dn-t{display:block;font-size:12px;color:var(--text-muted);margin-bottom:3px}
.doc-done-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}
.q-mini{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);font-size:13.5px;text-decoration:none;color:inherit}
.q-mini:hover{background:var(--bg-hover)}
.q-mini:last-child{border-bottom:none}
@media (max-width:900px){
  .docs-wrap{flex-direction:column}
  .docs-toc{width:100%;position:static;max-height:none}
  .docs-body{width:100%}
}`;

  function ensureCss() {
    if (document.getElementById("docs-style")) return;
    const s = document.createElement("style");
    s.id = "docs-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------------- 进度（本机存储，后续可并入云端同步体系） ---------------- */
  const P_KEY = "docs_progress";
  function progress() {
    try { return JSON.parse(localStorage.getItem(P_KEY) || "{}"); } catch (e) { return {}; }
  }
  function isDone(dirId, lvId, chId) { return !!progress()[dirId + "/" + lvId + "/" + chId]; }
  function toggleDone(dirId, lvId, chId) {
    const p = progress();
    const k = dirId + "/" + lvId + "/" + chId;
    if (p[k]) delete p[k]; else p[k] = Date.now();
    try { localStorage.setItem(P_KEY, JSON.stringify(p)); } catch (e) {}
    return !!p[k];
  }
  function dirStat(dir) {
    let total = 0, done = 0;
    (dir.levels || []).forEach(lv => (lv.chapters || []).forEach(ch => {
      total++; if (isDone(dir.id, lv.id, ch.id)) done++;
    }));
    return { total, done };
  }

  /* ---------------- 数据辅助 ---------------- */
  function flat(dir) {
    const out = [];
    (dir.levels || []).forEach(lv => (lv.chapters || []).forEach(ch => out.push({ lv, ch })));
    return out;
  }
  function findDir(id) { return (window.DOCS.dirs || []).find(d => d.id === id) || null; }
  function findChapter(dir, lvId, chId) {
    const lv = (dir.levels || []).find(l => l.id === lvId);
    if (!lv) return null;
    const ch = (lv.chapters || []).find(c => c.id === chId);
    return ch ? { lv, ch } : null;
  }

  /* ============================ 页面一：方向列表 ============================ */
  function pageDocs() {
    ensureCss();
    document.title = "技术教程 · IT面试题库";
    const dirs = (window.DOCS.dirs || []).filter(Boolean);
    /* 页脚的方向数/篇数从数据实时统计，避免增删章节后文案不同步 */
    const allChapters = dirs.reduce((a, d) => a + dirStat(d).total, 0);
    const allDirs = dirs;
    setMain(`
      <div class="hero" style="padding:26px 16px 18px">
        <h1 style="font-size:22px">📘 技术教程</h1>
        <p>按「技术方向 × 初级 / 中级 / 高级」组织的成套文档，<b>目录骨架取自官方文档</b>（OWASP、RFC、Docker / K8s / Terraform 官方文档、MySQL / Redis 手册、MDN、Oracle / Spring 参考等），按官方目录逐节展开讲解。
           每篇开头的「官方文档基线」告诉你可以对照哪份权威文档；实战案例与踩坑记录来自真实现场，读完记得做章末的练习题巩固。</p>
      </div>
      <div class="docs-dir-grid">
        ${dirs.map(d => {
          const st = dirStat(d);
          const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
          const chs = flat(d).filter(x => x.ch.body);
          return `
          <a class="docs-dir-card" href="#/docs/${d.id}">
            <h3>${d.icon || "📄"} ${U.esc(d.name)}${d.skeleton ? ' <span class="tag" style="font-size:11px">建设中</span>' : ""}</h3>
            <p>${U.esc(d.desc || "")}</p>
            <div class="doc-meta" style="margin-top:10px">
              <span class="tag">${d.levels.length} 个级别</span>
              <span class="tag">${st.total} 章</span>
              <!-- 「N 篇已上线」只在尚未全部上线时才有信息量（2026-09-24 评审 P2-17）：
                   全部上线时它会和「N 章」完全同值，同一张卡上写两遍同一个数字。 -->
              ${chs.length < st.total ? `<span class="tag">${chs.length} 篇已上线</span>` : ""}
            </div>
            <div class="docs-bar"><i style="width:${pct}%"></i></div>
            <div class="muted" style="font-size:12px;margin-top:6px">学习进度 ${st.done}/${st.total}${pct ? `（${pct}%）` : ""}</div>
          </a>`;
        }).join("")}
      </div>
      <div class="muted" style="text-align:center;font-size:12px;margin-top:20px">
        文档最近更新：${U.esc(window.DOCS.updated || "")} · 当前 ${allDirs.length} 个技术方向、${allChapters} 篇教程已全部上线；学习进度会随阅读自动累积
      </div>
    `);
  }

  /* ============================ 页面二：方向页（分级目录） ============================ */
  function pageDocsDir(dirId) {
    ensureCss();
    const dir = findDir(dirId);
    if (!dir) { setMain(`<div class="empty">未找到该方向</div>`); return; }
    document.title = dir.name + " · 技术教程";
    const st = dirStat(dir);
    const pct = st.total ? Math.round(st.done / st.total * 100) : 0;

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/docs">技术教程</a><span class="sep">/</span><span>${U.esc(dir.name)}</span></div>
      <div class="hero" style="padding:20px 16px 16px">
        <h1 style="font-size:20px">${dir.icon || "📄"} ${U.esc(dir.name)}</h1>
        <p>${U.esc(dir.desc || "")}</p>
        <div class="docs-bar" style="max-width:420px"><i style="width:${pct}%"></i></div>
        <div class="muted" style="font-size:12px;margin-top:6px">总进度 ${st.done}/${st.total}（${pct}%）· 建议按 初级 → 中级 → 高级 顺序阅读</div>
      </div>
      ${dir.levels.map(lv => {
        const done = lv.chapters.filter(c => isDone(dir.id, lv.id, c.id)).length;
        return `
        <div class="card lv-card">
          <div class="lv-head">
            <h2 style="font-size:16px;margin:0">${U.esc(lv.name)}</h2>
            <span class="tag">${done}/${lv.chapters.length}</span>
            <span class="muted" style="font-size:13px">${U.esc(lv.desc || "")}</span>
          </div>
          <div class="lv-list">
            ${lv.chapters.map((c, i) => {
              const d = isDone(dir.id, lv.id, c.id);
              return `
              <a class="lv-item${d ? " done" : ""}" href="#/docs/${dir.id}/${lv.id}/${c.id}">
                <span class="lv-no">${d ? "✓" : (i + 1)}</span>
                <span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${U.esc(c.title)}</span>
                <span class="lv-meta">${c.body ? (c.minutes ? c.minutes + " 分钟" : "可读") : "待写"}</span>
              </a>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    `);
  }

  /* ============================ 页面三：阅读页 ============================ */
  async function pageDocsChapter(dirId, lvId, chId) {
    ensureCss();
    const dir = findDir(dirId);
    if (!dir) { setMain(`<div class="empty">未找到该方向</div>`); return; }
    const hit = findChapter(dir, lvId, chId);
    if (!hit) { setMain(`<div class="empty">未找到该章节</div>`); return; }
    const { lv, ch } = hit;

    const list = flat(dir);
    const idx = list.findIndex(x => x.lv.id === lv.id && x.ch.id === ch.id);
    const prev = idx > 0 ? list[idx - 1] : null;
    const next = idx < list.length - 1 ? list[idx + 1] : null;
    const done = isDone(dirId, lvId, chId);
    document.title = ch.title + " · " + dir.name;

    const toc = `
      <div class="docs-toc">
        <div class="dt-dir">${dir.icon || "📄"} ${U.esc(dir.name)}</div>
        ${dir.levels.map(l => `
          <div class="dt-level"><span>${U.esc(l.name)}</span><span class="dt-cnt">${l.chapters.filter(c => isDone(dir.id, l.id, c.id)).length}/${l.chapters.length}</span></div>
          ${l.chapters.map(c => {
            const active = (l.id === lv.id && c.id === ch.id);
            const d = isDone(dir.id, l.id, c.id);
            return `<a class="dt-item${active ? " active" : ""}${d ? " done" : ""}" href="#/docs/${dir.id}/${l.id}/${c.id}">${d ? "✓ " : ""}${U.esc(c.title)}</a>`;
          }).join("")}
        `).join("")}
      </div>`;

    const bodyHtml = ch.body
      ? `<div class="doc-body">${U.md(ch.body)}</div>`
      : `<div class="empty" style="padding:40px 0"><div class="em-ic">✍️</div><h3>内容建设中</h3>
           <p>这一章的目录已规划，正文正在整理。可以先看同级的其它章节，或去「技术体系」里刷这个方向的题。</p>
           <a class="btn btn-primary" href="#/docs/${dir.id}">返回目录</a></div>`;

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/docs">技术教程</a><span class="sep">/</span>
        <a href="#/docs/${dir.id}">${U.esc(dir.name)}</a><span class="sep">/</span><span>${U.esc(lv.name)}</span></div>
      <div class="docs-wrap">
        ${toc}
        <div class="docs-body">
          <div class="card">
            <h1 style="font-size:20px;margin:0">${U.esc(ch.title)}</h1>
            <div class="doc-meta">
              <span class="tag">${U.esc(lv.name)}</span>
              ${ch.minutes ? `<span class="tag">约 ${ch.minutes} 分钟</span>` : ""}
              ${ch.updated ? `<span class="tag">更新 ${U.esc(ch.updated)}</span>` : ""}
              ${ch.applies ? `<span class="tag">适用 ${U.esc(ch.applies)}</span>` : ""}
              ${(ch.tags || []).map(t => `<span class="tag">${U.esc(t)}</span>`).join("")}
            </div>
            ${ch.body ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">⚠ 技术文档会过时，请以「适用版本」为准，并结合官方文档核对。</div>` : ""}
            ${bodyHtml}
            <div class="doc-done-bar">
              <button class="btn ${done ? "" : "btn-primary"}" id="doc-done">${done ? "✓ 已学完（点击取消）" : "标记本章已学完"}</button>
              ${next ? `<a class="btn" href="#/docs/${dir.id}/${next.lv.id}/${next.ch.id}">继续下一章 →</a>` : `<span class="muted" style="font-size:13px">🎉 本方向已读到最后一章</span>`}
            </div>
          </div>
          <div class="doc-nav">
            ${prev ? `<a href="#/docs/${dir.id}/${prev.lv.id}/${prev.ch.id}"><span class="dn-t">← 上一章（${U.esc(prev.lv.name)}）</span>${U.esc(prev.ch.title)}</a>`
                   : `<a style="opacity:.5;pointer-events:none"><span class="dn-t">← 上一章</span>已经是第一章</a>`}
            ${next ? `<a class="next" href="#/docs/${dir.id}/${next.lv.id}/${next.ch.id}"><span class="dn-t">下一章（${U.esc(next.lv.name)}）→</span>${U.esc(next.ch.title)}</a>`
                   : `<a class="next" style="opacity:.5;pointer-events:none"><span class="dn-t">下一章 →</span>已经是最后一章</a>`}
          </div>
          <div class="card" id="doc-qs" style="margin-top:14px${ch.body ? "" : ";display:none"}">
            <h3 style="font-size:15px;margin:0 0 8px">🎯 本章相关练习</h3>
            <div id="doc-qs-body"><div class="muted" style="font-size:13px">加载中…</div></div>
          </div>
        </div>
      </div>
    `);

    /* 标记已学完 */
    const btn = $("#doc-done");
    if (btn) btn.onclick = () => {
      const now = toggleDone(dirId, lvId, chId);
      btn.textContent = now ? "✓ 已学完（点击取消）" : "标记本章已学完";
      btn.className = "btn" + (now ? "" : " btn-primary");
      if (window.U && U.toast) U.toast(now ? "已标记学完，进度已记录" : "已取消标记", "info");
      /* 左侧目录与进度同步刷新（不整页重载，保住阅读位置） */
      const tocEl = document.querySelector(".docs-toc");
      if (tocEl) {
        tocEl.querySelectorAll(".dt-item").forEach(a => {
          const m = a.getAttribute("href").match(/^#\/docs\/[^/]+\/[^/]+\/(.+)$/);
          if (m && m[1] === chId) { a.classList.toggle("done", now); a.textContent = (now ? "✓ " : "") + ch.title; }
        });
        dir.levels.forEach(l => {
          const cnt = l.chapters.filter(c => isDone(dir.id, l.id, c.id)).length;
          const els = tocEl.querySelectorAll(".dt-level");
          for (const e of els) if (e.firstElementChild && e.firstElementChild.textContent === l.name) e.querySelector(".dt-cnt").textContent = cnt + "/" + l.chapters.length;
        });
      }
    };

    /* 章末挂题：按关键词匹配题库标题 */
    if (ch.body && (ch.terms || []).length) await renderQuestions(ch);
  }

  async function renderQuestions(ch) {
    const box = $("#doc-qs-body");
    if (!box) return;
    try {
      if (!window.DB || !DB.db || !DB.db.questions) throw new Error("no db");
      const all = await DB.db.questions.toArray();
      const terms = (ch.terms || []).filter(Boolean);
      const hits = all.filter(q => {
        const t = (q.title || "");
        return terms.some(k => t.indexOf(k) >= 0);
      }).slice(0, 6);
      if (!hits.length) {
        box.innerHTML = `<div class="muted" style="font-size:13px">题库中暂无本章相关的题，可到「技术体系」里按分类浏览。</div>`;
        return;
      }
      box.innerHTML = hits.map(q => `
        <a class="q-mini" href="#/question/${q.id}">
          <span style="flex:none">📝</span>
          <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(q.title)}</span>
          <span class="tag" style="margin-left:auto;flex:none">${U.esc(q.difficulty || "—")}</span>
        </a>`).join("");
    } catch (e) {
      box.innerHTML = `<div class="muted" style="font-size:13px">练习题暂不可用（题库未加载完成）。</div>`;
    }
  }

  window.pageDocs = pageDocs;
  window.pageDocsDir = pageDocsDir;
  window.pageDocsChapter = pageDocsChapter;
})();
