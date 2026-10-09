/* =========================================================================
 *  js/bundle/bundle-core.js  —— **自动生成，请勿直接编辑**
 * =========================================================================
 *  由 tools/bundle-js.py 按依赖顺序拼接以下 10 个文件（基础设施：工具 / 数据库 / 服务 / 云端）：
 *    · js/utils.js
 *    · js/turnstile.js
 *    · js/db.js
 *    · js/auth.js
 *    · js/search.js
 *    · js/aiprompts.js
 *    · js/api.js
 *    · js/services.js
 *    · js/cloud.js
 *    · js/backup.js

 *
 *  为什么合并：实测 Cloudflare 到中国大陆链路约一半请求会卡死，请求数直接决定
 *  首屏能否加载成功（27 个文件全成功概率约 2.7%，4 个约 88%，详见脚本注释）。
 *
 *  ⚠️ 修改上述任一源文件后，必须重跑：python tools/bundle-js.py --write
 * ========================================================================= */

;/* ===== >> js/utils.js ===== */
/* =========================================================================
 *  utils.js  —  通用工具与 UI 基础组件（图标 / Toast / Modal）
 * ========================================================================= */
(function () {
  "use strict";
  const U = {};

  /* ---------- 图标（内联 SVG，stroke 用 currentColor） ---------- */
  /* width/height 属性直接写在 svg 上：无 CSS 或 CSS 异常时也不会撑满容器渲染成巨型图形（比纯 CSS 兜底更彻底），
     实际尺寸仍由 CSS .btn .ic 等规则覆盖，此处仅为默认保底值 */
  const P = 'width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  U.ICONS = {
    search: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
    home: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    bookmark: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M6 4h12v16l-6-4-6 4z"/></svg>`,
    bookmarkFill: `<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4z"/></svg>`,
    history: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>`,
    dice: `<svg class="ic" viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.3" cy="8.3" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.7" cy="15.7" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    grid: `<svg class="ic" viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    briefcase: `<svg class="ic" viewBox="0 0 24 24" ${P}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>`,
    user: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
    shield: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>`,
    sun: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    moon: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
    monitor: `<svg class="ic" viewBox="0 0 24 24" ${P}><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`,
    menu: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
    plus: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 5v14M5 12h14"/></svg>`,
    edit: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
    trash: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>`,
    copy: `<svg class="ic" viewBox="0 0 24 24" ${P}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
    download: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>`,
    upload: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/></svg>`,
    chevronRight: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="m9 6 6 6-6 6"/></svg>`,
    chevronDown: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="m6 9 6 6 6-6"/></svg>`,
    arrowDown: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 5v14M6 13l6 6 6-6"/></svg>`,
    x: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M6 6l12 12M18 6 6 18"/></svg>`,
    eye: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.4 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.1 6.1A13 13 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.3-.6"/></svg>`,
    sparkles: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>`,
    check: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M20 6 9 17l-5-5"/></svg>`,
    alert: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/></svg>`,
    info: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`,
    layers: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>`,
    database: `<svg class="ic" viewBox="0 0 24 24" ${P}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>`,
    barChart: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>`,
    play: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M7 4v16l13-8z"/></svg>`,
    clock: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    star: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M12 3l2.6 5.7L21 9.6l-4.5 4.3 1.1 6.1L12 17.8 6.4 20l1.1-6.1L3 9.6l6.4-.9z"/></svg>`,
    refresh: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/></svg>`,
    fileText: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
    /* 技术教程（翻开的书，2026-09-14 新增，供「学」版块侧栏入口使用） */
    bookOpen: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"/></svg>`,
    link: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>`,
    /* 岗位路线图（地图/路径） */
    map: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M9 3 3 5.4v15.8L9 19l6 2.2 6-2.2V3.2L15 5.4z"/><path d="M9 3v16M15 5.4v15.8"/></svg>`,
    /* 筛选（漏斗，2026-09-24 题目列表移动端折叠筛选按钮） */
    filter: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>`
  };
  U.icon = function (name) { return U.ICONS[name] || ""; };

  /* 复制文本到剪贴板：优先 Clipboard API，失败降级 textarea + execCommand，返回是否成功 */
  U.copyText = async function (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* 权限被拒或非安全上下文，继续降级 */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.top = "-9999px"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch (e2) { return false; }
  };

  /* ---------- DOM 与字符串 ---------- */
  U.qs = (s, r) => (r || document).querySelector(s);
  U.qsa = (s, r) => Array.from((r || document).querySelectorAll(s));
  U.esc = function (s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  };
  U.debounce = function (fn, wait) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait); };
  };
  U.fmtDate = function (ts) {
    if (!ts) return "";
    const d = (ts instanceof Date) ? ts : new Date(ts);
    const p = n => (n < 10 ? "0" + n : "" + n);
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  };
  U.fmtSize = function (bytes) {
    if (!bytes) return "0 B";
    const u = ["B", "KB", "MB", "GB"]; let i = 0;
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
    return bytes.toFixed(1) + " " + u[i];
  };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  U.stars = function (n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += i <= n ? "★" : '<span class="off">★</span>';
    return '<span class="stars">' + s + "</span>";
  };

  /* ---------- Markdown 渲染 ---------- */
  U.md = function (text) {
    if (!text) return "";
    try {
      marked.setOptions({ breaks: true, gfm: true });
      var html = marked.parse(text);
      html = window.DOMPurify ? DOMPurify.sanitize(html) : html;
      /* 表格包一层可横向滚动的容器（2026-09-19）：手机上 4 列表格会被压到窄列只有
         30~40px，「日志」这种两字词被拆成「一列一个字」，完全没法读。
         包一层 overflow-x:auto 后，表格保持自然列宽、超出部分横向滚动。
         全站 markdown 只有这一个出口，改这里即覆盖题目答案 / 教程正文 / AI 输出。
         注意顺序：先过 DOMPurify 再包，包出来的 div 是我们自己的、不含用户输入。 */
      html = html
        .replace(/<table(\s[^>]*)?>/g, '<div class="md-table-wrap"><table$1>')
        .replace(/<\/table>/g, "</table></div>");
      /* 题内图片懒加载（innerHTML 注入无法依赖浏览器原生的 loading 属性来源） */
      return html.replace(/<img /g, '<img loading="lazy" ');
    } catch (e) { return U.esc(text); }
  };
  U.highlightAll = function (root) {
    if (window.hljs) {
      U.qsa("pre code", root || document).forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
    }
    U.addCodeCopy(root);
  };
  /* ---------- 代码块一键复制：pre 右上角悬浮复制钮（幂等，随 highlightAll 自动挂载） ---------- */
  U.addCodeCopy = function (root) {
    U.qsa("pre", root || document).forEach(pre => {
      if (pre.querySelector(".code-copy")) return;
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.className = "code-copy";
      btn.type = "button";
      btn.textContent = "复制";
      btn.onclick = async () => {
        const text = ((pre.querySelector("code") || pre).innerText || "").replace(/\n+$/, "");
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; }
        catch (e) {
          try {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            ok = document.execCommand("copy"); ta.remove();
          } catch (_) {}
        }
        btn.textContent = ok ? "已复制" : "失败";
        setTimeout(() => { btn.textContent = "复制"; }, 1500);
      };
      pre.appendChild(btn);
    });
  };
  /* ---------- 图片灯箱（点击 Markdown 内容图片全屏预览） ---------- */
  U.initLightbox = function () {
    if (document.getElementById("lightbox")) return;
    const mask = document.createElement("div");
    mask.id = "lightbox";
    mask.className = "lightbox-mask";
    mask.innerHTML = '<img alt="图片预览" />';
    mask.addEventListener("click", () => { mask.classList.remove("open"); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") mask.classList.remove("open"); });
    document.body.appendChild(mask);
  };
  U.openLightbox = function (src, alt) {
    const mask = document.getElementById("lightbox");
    if (!mask || !src) return;
    const img = mask.querySelector("img");
    img.src = src; img.alt = alt || "图片预览";
    mask.classList.add("open");
  };

  /* ---------- Toast ----------
     opts.action = { label, onClick } → 右侧一个操作按钮（点了先关提示再回调）
     timeout = 0 → 不自动关闭（常驻，直到用户关闭或点了操作按钮） */
  U.toast = function (msg, type, timeout, opts) {
    type = type || "info";
    opts = opts || {};
    const root = document.getElementById("toast-root");
    if (!root) return null;
    const ic = type === "success" ? U.icon("check") : type === "warn" ? U.icon("alert") : type === "error" ? U.icon("alert") : U.icon("info");
    const hasAct = !!(opts.action && opts.action.label);
    const el = document.createElement("div");
    el.className = "toast " + type + (hasAct ? " has-act" : "");
    el.setAttribute("role", "status");
    el.innerHTML = `<span class="t-ic">${ic}</span><span class="t-msg">${U.esc(msg)}</span>${hasAct ? `<button class="t-act" type="button">${U.esc(opts.action.label)}</button>` : ""}<span class="t-close" role="button" tabindex="0" aria-label="关闭提示">${U.icon("x")}</span>`;
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 250); };
    const tclose = el.querySelector(".t-close");
    tclose.onclick = close;
    tclose.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); } };
    if (hasAct) {
      const btn = el.querySelector(".t-act");
      btn.onclick = () => { close(); try { opts.action.onClick && opts.action.onClick(); } catch (e) { console.warn("toast action error", e); } };
    }
    root.appendChild(el);
    if (timeout !== 0) setTimeout(close, timeout || 3000);
    return el;
  };

  /* ---------- Modal ---------- */
  U.modal = function (opts) {
    opts = opts || {};
    const root = document.getElementById("modal-root");
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    const wide = opts.wide ? " wide" : "";
    mask.innerHTML = `<div class="modal${wide}" role="dialog" aria-modal="true"${opts.title ? ` aria-label="${U.esc(opts.title)}"` : ""}>
      <div class="modal-head"><h3>${U.esc(opts.title || "")}</h3><button class="icon-btn" data-close aria-label="关闭对话框">${U.icon("x")}</button></div>
      <div class="modal-body">${opts.body || ""}</div>
      ${opts.footer !== false ? '<div class="modal-foot"></div>' : ""}
    </div>`;
    root.appendChild(mask);
    /* 滚动锁：弹窗打开时锁住背景滚动（计数支持嵌套弹窗），关闭时按计数恢复 */
    U._openModals = (U._openModals || 0) + 1;
    document.body.classList.add("modal-open");
    const modalEl = mask.querySelector(".modal");
    const focusables = () => Array.prototype.filter.call(
      modalEl.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"),
      el => !el.disabled && el.offsetParent !== null
    );
    const previousFocus = document.activeElement;
    const focusFirst = () => {
      const list = focusables();
      if (list.length) try { list[0].focus(); } catch (e) {}
    };
    const trapKey = e => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); try { last.focus(); } catch (e2) {} }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); try { first.focus(); } catch (e2) {} }
    };
    const close = () => {
      mask.remove();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", trapKey);
      U._openModals = Math.max(0, (U._openModals || 1) - 1);
      if (!U._openModals) document.body.classList.remove("modal-open");
      try { if (previousFocus && previousFocus.focus) previousFocus.focus(); } catch (e) {}
    };
    const onKey = e => { if (e.key === "Escape" && opts.closable !== false) close(); };
    mask.querySelector("[data-close]").onclick = () => { if (opts.closable !== false) close(); };
    mask.addEventListener("click", e => { if (e.target === mask && opts.closable !== false) close(); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("keydown", trapKey);
    setTimeout(focusFirst, 0);
    return {
      el: modalEl,
      body: modalEl.querySelector(".modal-body"),
      foot: modalEl.querySelector(".modal-foot"),
      close
    };
  };
  U.confirm = function (message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const m = U.modal({ title: opts.title || "确认操作", closable: true });
      m.body.innerHTML = `<p style="margin:0">${U.esc(message)}</p>${opts.note ? `<div class="note">${U.esc(opts.note)}</div>` : ""}`;
      const ok = document.createElement("button");
      ok.className = "btn " + (opts.danger ? "btn-danger" : "btn-primary");
      ok.textContent = opts.okText || "确定";
      const cancel = document.createElement("button");
      cancel.className = "btn"; cancel.textContent = opts.cancelText || "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      cancel.onclick = () => { m.close(); resolve(false); };
      ok.onclick = () => { m.close(); resolve(true); };
    });
  };
  U.prompt = function (message, def) {
    return new Promise(resolve => {
      const m = U.modal({ title: message, closable: true });
      m.body.innerHTML = `<input type="text" id="prompt-input" value="${U.esc(def || "")}" />`;
      const ok = document.createElement("button"); ok.className = "btn btn-primary"; ok.textContent = "确定";
      const cancel = document.createElement("button"); cancel.className = "btn"; cancel.textContent = "取消";
      m.foot.appendChild(cancel); m.foot.appendChild(ok);
      const input = m.body.querySelector("#prompt-input");
      setTimeout(() => input.focus(), 50);
      const done = v => { m.close(); resolve(v); };
      ok.onclick = () => done(input.value.trim());
      cancel.onclick = () => done(null);
      input.onkeydown = e => { if (e.key === "Enter") done(input.value.trim()); };
    });
  };

  /* 数字滚动动画 */
  U.rollNumber = function (el, target, dur) {
    dur = dur || 1200; const start = performance.now(); const from = 0;
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(from + (target - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  };

  U.download = function (filename, content, mime) {
    const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ---- 第三方大库按需加载（echarts / xlsx 首屏不再全量下载） ----
     鲁棒性：失败自动重试（每次加 ?_t= 时间戳破 Service Worker / HTTP 缓存）+ CDN 兜底，
     确保即便本地 vendor 被拦截或 SW 缓存了损坏响应，全景图也能恢复。 */
  const _scriptCache = {};
  const _scriptRetries = {};          // 每个 name 已重试次数
  const RETRY_LIMIT = 3;              // 单 URL 重试上限（含首次）
  const RETRY_DELAY_MS = 400;         // 重试退避基数
  /* 全局 CDN 兜底（jsdelivr 同步命中 GitHub，1MB 大库也能稳定加载） */
  const FALLBACKS = {
    echarts: [
      "/vendor/echarts.min.js",
      "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"
    ],
    xlsx: [
      "/vendor/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
    ]
  };
  function _tryLoad(name, url, attempt) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      /* ?_t= 时间戳仅破缓存，对 Vite/相对路径无副作用；外链 CDN 自带 ?v= 不再加 */
      s.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "_t=" + Date.now() + "_" + attempt;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = () => { if (window[name]) resolve(window[name]); else reject(new Error("loaded but " + name + " 未挂载到 window")); };
      s.onerror = () => reject(new Error("脚本加载失败：" + name + " @ " + url));
      document.head.appendChild(s);
    });
  }
  U.loadScript = function (name, url) {
    if (window[name]) return Promise.resolve(window[name]);
    if (_scriptCache[name]) return _scriptCache[name];
    const candidates = FALLBACKS[name] ? FALLBACKS[name].slice() : [url];
    if (url && candidates.indexOf(url) < 0) candidates.unshift(url);
    _scriptCache[name] = (async () => {
      let lastErr;
      for (const u of candidates) {
        _scriptRetries[name] = 0;
        for (let i = 0; i < RETRY_LIMIT; i++) {
          _scriptRetries[name] = i + 1;
          try {
            const v = await _tryLoad(name, u, i + 1);
            if (window[name]) return v;
          } catch (e) { lastErr = e; }
          /* 退避后重试：400 / 800 / 1200ms */
          if (i < RETRY_LIMIT - 1) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
        }
      }
      delete _scriptCache[name];
      throw lastErr || new Error("脚本加载失败：" + name);
    })();
    return _scriptCache[name];
  };
  U.CONFETTI_URL = "/vendor/canvas-confetti.min.js";
  U.ECHARTS_URL = "/vendor/echarts.min.js";
  U.XLSX_URL = "/vendor/xlsx.full.min.js";
  /* 暴露给用户/调试：当前累计重试次数，0 表示首次 */
  U.loadRetries = name => _scriptRetries[name] || 0;
  /* 手动作废某个 name 的脚本缓存，让下次 U.loadScript(name) 走网络重抓（含新的 ?_t= 破缓存） */
  U.invalidateCache = function (name) { delete _scriptCache[name]; delete _scriptRetries[name]; };

  /* ---- 能力探测：设备是否具备「能悬浮的指针」（鼠标 / 触控板）----
   * 触屏手机 / 平板返回 false。用于**只在桌面上才有意义的提示**：
   *   ① 键盘快捷键文案（手机上没实体键盘，纯噪音）；
   *   ② hover 气泡（触屏的 :hover 会「粘住」→ 气泡一直挂在按钮上不消失）。
   * 探测不到（老浏览器 / 无 matchMedia）时**按桌面处理**——宁可多显示，也不要误藏掉桌面提示。 */
  U.canHover = function () {
    try {
      return !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    } catch (e) { return true; }
  };

  /* ---- Tooltip 浮层（JavaScript 控制，支持多行 / 动态更新 / 自动跟随） ---- */
  let _tooltipEl = null;
  let _tooltipTarget = null;
  let _tooltipTimer = null;
  U.tooltip = function (el, text, opts) {
    opts = opts || {};
    const multiline = !!opts.multiline;
    const dir = opts.dir || "top";
    if (!el) return;
    /* 给元素加 data-tooltip 属性（CSS :hover 也生效），同时用 JS 控制动态内容 */
    el.setAttribute("data-tooltip", multiline ? "" : text);
    el.setAttribute("data-tooltip-multiline", multiline ? "1" : "");
    if (dir === "bottom") el.classList.add("tip-bottom");
    else el.classList.remove("tip-bottom");
    /* JS 兜底：支持鼠标进入时更新文案（如动态计数） */
    el.addEventListener("mouseenter", () => {
      clearTimeout(_tooltipTimer);
      _tooltipTimer = setTimeout(() => _showTooltip(el, text, opts), 200);
    });
    el.addEventListener("mouseleave", () => { clearTimeout(_tooltipTimer); _hideTooltip(); });
  };
  U.updateTooltip = function (el, newText) {
    if (!el) return;
    el.setAttribute("data-tooltip", newText);
  };
  function _showTooltip(el, text, opts) {
    _hideTooltip();
    const t = document.createElement("div");
    t.className = "js-tooltip";
    t.style.cssText = `position:fixed;z-index:9999;background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 9px;font-size:12px;line-height:1.4;white-space:${opts.multiline ? "normal" : "nowrap"};max-width:${opts.multiline ? "220px" : "none"};pointer-events:none;box-shadow:var(--shadow-sm);opacity:0;transition:opacity .15s;`;
    t.textContent = text;
    document.body.appendChild(t);
    const rect = el.getBoundingClientRect();
    const isBottom = opts.dir === "bottom";
    const top = isBottom ? (rect.bottom + 6) : (rect.top - 6 - t.offsetHeight);
    const left = Math.min(Math.max(rect.left + rect.width / 2 - t.offsetWidth / 2, 4), window.innerWidth - t.offsetWidth - 4);
    t.style.top = top + "px"; t.style.left = left + "px";
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    _tooltipEl = t; _tooltipTarget = el;
    const hide = () => { clearTimeout(_tooltipTimer); _hideTooltip(); };
    el.addEventListener("mouseleave", hide, { once: true });
  }
  function _hideTooltip() {
    if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; _tooltipTarget = null; }
  }

  window.U = U;
})();

;/* ===== << js/utils.js ===== */

;/* ===== >> js/turnstile.js ===== */
/* =========================================================================
 *  turnstile.js — Cloudflare Turnstile 人机验证（前端挂载层，开关式）
 * =========================================================================
 *  和后端 cloudflare/worker.js 的 verifyTurnstile() 是一对：
 *    未配置 => 两边都整段跳过，行为与旧版一模一样；配置了才真正启用。
 *
 *  三条设计取舍（都是踩过/想过才这么定的）：
 *   1) 提交时才执行（execution:"execute"），不在页面加载时就换 token。
 *      投稿表单可能写了十几分钟，若挂载时就换取 token，提交时早超过
 *      Turnstile 的 300 秒有效期，用户会看到「人机验证未通过」这种
 *      完全看不懂、也无从自救的报错。
 *   2) appearance:"interaction-only" —— 不需要人工点选时组件完全隐形，
 *      表单观感与以前一致；真要人工确认时才浮出来。
 *   3) 失败一律不阻塞表单：拿不到 token 时把原因交回调用方，由调用方
 *      给出人话提示；后端仍会 403，属于双保险。
 *
 *  主题：站内是 html[data-theme] 自管主题（不跟随系统），所以这里读
 *  站点当前主题传给 widget，而不是用 "auto"。
 * ========================================================================= */
(function () {
  "use strict";
  const TS = {};

  /* sitekey 是公开值（会出现在前端源码里），必须与 Cloudflare 面板里
     那个 widget 的 Site Key 一致；改动它等于换 widget。
     secret 绝不能出现在前端，它只存在于 Worker 的环境变量 TURNSTILE_SECRET。 */
  const SITEKEY = "0x4AAAAAAE__jtzqP599LSsj";

  /* 可选远程覆盖：api-endpoints.json 里若写了 turnstileSiteKey，就用它。
     纯 best-effort —— 读不到/格式不对一律退回内置常量，避免「配置拉取失败
     导致登录入口整体不可用」这种本末倒置的故障。 */
  function remoteSitekey() {
    try {
      const raw = localStorage.getItem("stats_api_cfg");
      if (!raw) return "";
      const o = JSON.parse(raw);
      const k = o && o.turnstileSiteKey;
      return (typeof k === "string" && /^[0-9a-zA-Z_-]{10,}$/.test(k.trim())) ? k.trim() : "";
    } catch (e) { return ""; }
  }

  TS.status = "idle";              /* idle | loading | ready | failed */

  TS.sitekey = function () { return remoteSitekey() || SITEKEY; };
  TS.enabled = function () { return !!TS.sitekey(); };

  /* ---------- 单例加载 api.js ---------- */
  let loadP = null;
  function load() {
    if (window.turnstile && window.turnstile.render) { TS.status = "ready"; return Promise.resolve(true); }
    if (loadP) return loadP;
    TS.status = "loading";
    loadP = new Promise(function (resolve, reject) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__tsOnload";
      s.async = true;
      s.defer = true;
      const timer = setTimeout(function () { TS.status = "failed"; reject(new Error("timeout")); }, 12000);
      window.__tsOnload = function () { clearTimeout(timer); TS.status = "ready"; resolve(true); };
      s.onerror = function () { clearTimeout(timer); TS.status = "failed"; reject(new Error("network")); };
      document.head.appendChild(s);
    });
    /* 失败后放开单例，允许用户再点一次提交时重试（网络抖动常常只差一次） */
    loadP.catch(function () { loadP = null; });
    return loadP;
  }

  /* ---------- 挂载 ---------- */
  /* 把 widget 渲染进 el；未启用/挂了都返回 null，调用方据 TS.status 提示。 */
  TS.mount = function (el) {
    if (!el || !TS.enabled()) return Promise.resolve(null);
    return load().then(function () {
      if (el.__tsWid != null) {
        try { turnstile.reset(el.__tsWid); } catch (e) {}
        return el.__tsWid;
      }
      el.__tsTok = "";
      const theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "dark" : "light";
      const wid = turnstile.render(el, {
        sitekey: TS.sitekey(),
        execution: "execute",
        appearance: "interaction-only",
        theme: theme,
        "refresh-expired": "auto",
        "refresh-timeout": "auto",
        callback: function (t) { el.__tsTok = t || ""; settle(el, el.__tsTok); },
        "error-callback": function () { settle(el, ""); },
        "timeout-callback": function () { settle(el, ""); }
      });
      el.__tsWid = wid;
      return wid;
    }).catch(function () { return null; });
  };

  /* 等待中的调用方（一次只有一个：用户点一次提交等一次） */
  function settle(el, token) {
    el.__tsTok = token || "";
    const f = el.__tsWait;
    el.__tsWait = null;
    if (f) f(el.__tsTok);
  }

  /* ---------- 取 token（点提交时调） ----------
     已有令牌直接复用；否则执行挑战并等回调。超时/出错返回 ""。 */
  TS.token = function (el, ms) {
    if (!el || el.__tsWid == null) return Promise.resolve("");
    let cur = "";
    try { cur = turnstile.getResponse(el.__tsWid) || ""; } catch (e) { cur = ""; }
    if (cur) return Promise.resolve(cur);
    el.__tsTok = "";
    return new Promise(function (resolve) {
      let done = false;
      const fin = function (v) {
        if (done) return;
        done = true;
        el.__tsWait = null;
        resolve(v || "");
      };
      el.__tsWait = fin;
      setTimeout(function () { fin(""); }, ms || 25000);
      try { turnstile.execute(el.__tsWid); }
      catch (e) { fin(""); }
    });
  };

  /* ---------- 复位（一次提交后必须调） ----------
     Turnstile 令牌是一次性的：提交过一次（哪怕服务端判失败）后再拿旧令牌
     去验必然报 timeout-or-duplicate，所以失败后要 reset 才能重新挑战。 */
  TS.reset = function (el) {
    if (!el || el.__tsWid == null) return;
    el.__tsTok = "";
    el.__tsWait = null;
    try { turnstile.reset(el.__tsWid); } catch (e) {}
  };

  /* ---------- 给人看的提示文案 ---------- */
  TS.statusText = function () {
    if (TS.status === "failed") {
      return "人机验证组件加载失败（多为网络拦截 challenges.cloudflare.com）。请刷新页面重试，或换个网络。";
    }
    return "人机验证未通过。若上方刚刚出现过确认框，请先点掉它，再点一次提交。";
  };

  window.TS = TS;
})();

;/* ===== << js/turnstile.js ===== */

;/* ===== >> js/db.js ===== */
/* =========================================================================
 *  db.js  —  Dexie/IndexedDB 封装 + 初始数据写入
 * ========================================================================= */
(function () {
  "use strict";

  if (typeof Dexie === "undefined") {
    console.error("Dexie 未加载");
  }
  const db = new Dexie("it_interview_hub");
  db.version(1).stores({
    categories: "++id, parentId, name, depth, status",
    positions: "++id, name, stage",
    positionSkills: "++id, positionId, categoryId, techName",
    questions: "++id, categoryId, difficulty, type, status, source, aiScore, createdAt, updatedAt, title",
    questionVersions: "++id, questionId, version",
    favorites: "++id, questionId, createdAt",
    histories: "++id, questionId, createdAt",
    aiGenerateLogs: "++id, createdAt",
    importLogs: "++id, createdAt",
    backups: "++id, createdAt",
    settings: "key"
  });
  db.version(2).stores({
    categories: "++id, parentId, name, depth, status",
    positions: "++id, name, stage",
    positionSkills: "++id, positionId, categoryId, techName",
    questions: "++id, categoryId, difficulty, type, status, source, aiScore, createdAt, updatedAt, title",
    questionVersions: "++id, questionId, version",
    favorites: "++id, questionId, createdAt",
    histories: "++id, questionId, createdAt",
    aiGenerateLogs: "++id, createdAt",
    importLogs: "++id, createdAt",
    backups: "++id, createdAt",
    settings: "key",
    weakBank: "++id, questionId, createdAt"
  });

  /* v3：每日打卡表（今日5题完成记录），随个人数据云同步，换设备不丢 */
  db.version(3).stores({
    categories: "++id, parentId, name, depth, status",
    positions: "++id, name, stage",
    positionSkills: "++id, positionId, categoryId, techName",
    questions: "++id, categoryId, difficulty, type, status, source, aiScore, createdAt, updatedAt, title",
    questionVersions: "++id, questionId, version",
    favorites: "++id, questionId, createdAt",
    histories: "++id, questionId, createdAt",
    aiGenerateLogs: "++id, createdAt",
    importLogs: "++id, createdAt",
    backups: "++id, createdAt",
    settings: "key",
    weakBank: "++id, questionId, createdAt",
    dailyDone: "++id, day"
  });

  /* v4：个人题目批注（详情页「我的批注」）。只在本机与个人加密备份中流转，
     不随题库快照发布上云，也不会改动 questions 表本身。 */
  db.version(4).stores({
    categories: "++id, parentId, name, depth, status",
    positions: "++id, name, stage",
    positionSkills: "++id, positionId, categoryId, techName",
    questions: "++id, categoryId, difficulty, type, status, source, aiScore, createdAt, updatedAt, title",
    questionVersions: "++id, questionId, version",
    favorites: "++id, questionId, createdAt",
    histories: "++id, questionId, createdAt",
    aiGenerateLogs: "++id, createdAt",
    importLogs: "++id, createdAt",
    backups: "++id, createdAt",
    settings: "key",
    weakBank: "++id, questionId, createdAt",
    dailyDone: "++id, day",
    notes: "++id, questionId, updatedAt"
  });

  const DB = { db };

  DB.getSetting = async function (key) {
    const r = await db.settings.get(key);
    return r ? r.value : undefined;
  };
  DB.setSetting = async function (key, value) {
    await db.settings.put({ key, value });
  };
  DB.isInitialized = async function () { return !!(await DB.getSetting("initialized")); };

  /* ---------- 写入初始数据 ----------
     性能说明（2026-10-06 移动端优化）：
     原实现每写一条就 `await db.xxx.add()`，也就是**每条记录一个 IndexedDB 事务**。
     实测首次访问时这段要 3.8 秒（脚本 1.13s 全部就绪，下一个网络请求 4.93s 才出现，
     中间全是这段的等待）——而移动端 IO 更慢，是首屏「一直转圈」的主因。
     现改为「收集成数组 + bulkAdd 一次性写入」：
       · 分类/岗位/技能/题目各自一个事务，而不是几百个；
       · 用 bulkAdd 的 allKeys 选项拿回自增主键，语义与原逐条 add 完全一致
         （nameToCat 深层覆盖、nameToPos 只记首个同名 都保持不变）。
     这样既没有改变写入结果的顺序（数组顺序即原循环顺序），也没有改变任何映射。 */
  DB.seed = async function (onProgress) {
    if (await DB.isInitialized()) return false;
    const S = window.SEED;
    const nameToCat = new Map();   // 分类名 -> id（深层覆盖）
    const nameToPos = new Map();   // 岗位名 -> id
    const now = Date.now();

    /* 1) 分类树：按「同层一次性 bulkAdd」写，再递归下一层。
       必须先拿到本层所有 id 才能建子层，所以分层批量而不是全树一把写。 */
    const seedCat = async (nodes, parentId, depth) => {
      if (!nodes || !nodes.length) return;
      const recs = nodes.map((n, i) => ({
        parentId: parentId || 0,
        name: n.name,
        icon: n.icon || "📁",
        era: n.era || "",
        description: "",
        sort: i,
        depth: depth,
        status: "active"
      }));
      const keys = await db.categories.bulkAdd(recs, { allKeys: true });
      const nextLayer = [];
      nodes.forEach((n, i) => {
        nameToCat.set(n.name, keys[i]);
        if (n.children) nextLayer.push([n.children, keys[i], depth + 1]);
      });
      for (const job of nextLayer) await seedCat(job[0], job[1], job[2]);
    };
    if (onProgress) onProgress("写入技术分类…");
    await seedCat(S.categoryTree, 0, 0);

    // 2) 岗位（树中所有节点都建记录，便于引用；支持细分方向 direction）
    const flatPos = [];
    const walkPos = (nodes, stage, tag, parentName) => {
      nodes.forEach(n => {
        const isObj = typeof n === "object";
        const nm = isObj ? n.name : n;
        const dir = isObj ? (n.direction || "") : "";
        flatPos.push({ name: nm, stage, tag, category: parentName || "", direction: dir, description: "", demand: "中" });
        if (isObj && n.children) walkPos(n.children, stage, tag, nm);
      });
    };
    S.positionStages.forEach(st => walkPos(st.children, st.stage, st.tag, ""));
    if (onProgress) onProgress("写入岗位体系…");
    const seenPosKeys = new Set();
    const posRecs = [];
    for (const p of flatPos) {
      const key = (p.name || "") + "|" + (p.direction || "");
      if (seenPosKeys.has(key)) continue; // 同名且同方向只写入一次
      seenPosKeys.add(key);
      posRecs.push({
        name: p.name, stage: p.stage, tag: p.tag, category: p.category,
        direction: p.direction || "", description: p.description, demand: p.demand, sort: 0, status: "active"
      });
    }
    if (posRecs.length) {
      const posKeys = await db.positions.bulkAdd(posRecs, { allKeys: true });
      posRecs.forEach((p, i) => {
        if (!nameToPos.has(p.name)) nameToPos.set(p.name, posKeys[i]); // 首条同名岗位供技术栈关联使用
      });
    }

    // 3) 岗位技术栈（一次收集后批量写）
    if (onProgress) onProgress("写入岗位技术栈…");
    const skillRecs = [];
    for (const posName in S.positionSkills) {
      const pid = nameToPos.get(posName);
      if (pid == null) continue;
      const grp = S.positionSkills[posName];
      const collect = (list, required) => {
        for (const s of (list || [])) {
          skillRecs.push({
            positionId: pid,
            categoryId: nameToCat.get(s.tech) || null,
            techName: s.tech,
            stars: s.stars || 3,
            depth: s.depth || "了解",
            required: required
          });
        }
      };
      collect(grp.required, true);
      collect(grp.bonus, false);
    }
    if (skillRecs.length) await db.positionSkills.bulkAdd(skillRecs);

    // 4) 示例题目（一次收集后批量写）
    const resolveCat = (path) => {
      if (!path) return null;
      for (const name of path) { if (nameToCat.has(name)) return nameToCat.get(name); }
      for (const name of path.slice().reverse()) { if (nameToCat.has(name)) return nameToCat.get(name); }
      return null;
    };
    const total = S.questions.length;
    const qRecs = S.questions.map(q => {
      const posIds = (q.positionNames || []).map(n => nameToPos.get(n)).filter(x => x != null);
      return {
        categoryId: resolveCat(q.catPath),
        title: q.title,
        body: q.body,
        answer: q.answer,
        difficulty: q.difficulty,
        type: q.type,
        positionIds: posIds,
        positionNames: q.positionNames || [],
        years: q.years || "",
        tags: q.tags || [],
        source: q.source || "seed",
        aiScore: q.aiScore || 80,
        status: q.status || "published",
        views: q.views || 0,
        favorites: q.favorites || 0,
        relatedIds: [],
        remark: "",
        createdAt: now,
        updatedAt: now
      };
    });
    if (onProgress) onProgress("写入题目 0/" + total);
    if (qRecs.length) await db.questions.bulkAdd(qRecs);
    if (onProgress) onProgress("写入题目 " + total + "/" + total);

    await DB.setSetting("initialized", true);
    await DB.setSetting("seedAt", now);
    if (onProgress) onProgress("初始化完成");
    return true;
  };

  /* 恢复示例数据（追加合并，不覆盖） */
  DB.resetSeedAppend = async function () {
    const S = window.SEED;
    const nameToCat = new Map();
    (await db.categories.toArray()).forEach(c => nameToCat.set(c.name, c.id));
    const nameToPos = new Map();
    (await db.positions.toArray()).forEach(p => { if (!nameToPos.has(p.name)) nameToPos.set(p.name, p.id); });
    let added = 0;
    const resolveCat = (path) => { if (!path) return null; for (const n of path) if (nameToCat.has(n)) return nameToCat.get(n); return null; };
    for (const q of S.questions) {
      const exists = await db.questions.where("title").equals(q.title).first();
      if (exists) continue;
      const posIds = (q.positionNames || []).map(n => nameToPos.get(n)).filter(x => x != null);
      await db.questions.add({
        categoryId: resolveCat(q.catPath), title: q.title, body: q.body, answer: q.answer,
        difficulty: q.difficulty, type: q.type, positionIds: posIds, positionNames: q.positionNames || [],
        years: q.years || "", tags: q.tags || [], source: "seed", aiScore: q.aiScore || 80,
        status: "published", views: 0, favorites: 0, relatedIds: [], remark: "",
        createdAt: Date.now(), updatedAt: Date.now()
      });
      added++;
    }
    return added;
  };

  /* 迁移：清理重复岗位记录（同名岗位只保留 id 最小的一条） */
  DB.migrateDedupPositions = async function () {
    const MIGRATION_KEY = "migrated_dedup_positions_v2";
    if (await DB.getSetting(MIGRATION_KEY)) return 0;
    const all = await db.positions.toArray();
    const byKey = new Map();
    for (const p of all) {
      // 去重 key 同时看名字与细分方向：同名但方向不同的岗位视为不同岗位，保留
      const key = (p.name || "") + "|" + (p.direction || "");
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(p);
    }
    let removed = 0;
    for (const [key, list] of byKey) {
      if (list.length <= 1) continue;
      // 按 id 升序，保留第一条，删除其余（仅删除真正同名字同方向的重复）
      list.sort((a, b) => a.id - b.id);
      const dupIds = list.slice(1).map(p => p.id);
      for (const did of dupIds) {
        await db.positions.delete(did);
        await db.positionSkills.where("positionId").equals(did).delete();
        removed++;
      }
    }
    if (removed > 0) await DB.setSetting(MIGRATION_KEY, true);
    return removed;
  };

  /* 迁移：清理与分类同名的伪岗位（如把“腾讯云”误建成岗位）
     注意：此清理每次启动都会执行（不做一次性开关），确保任何时期误建的空岗位都能被及时清除。
     仅删除「名字与分类冲突 + 无题目 + 无技术栈」的岗位，已有关联内容的岗位不会被误删（仅在前端隐藏）。 */
  DB.migrateRemoveFakePositions = async function () {
    // 分类名同时以 IndexedDB 和当前 seed.js 的 categoryTree 为准，防止 DB 分类表过旧
    const cats = await db.categories.toArray();
    const catNameSet = new Set(cats.map(c => c.name));
    if (typeof window !== "undefined" && window.SEED && Array.isArray(window.SEED.categoryTree)) {
      const walk = (nodes) => {
        for (const n of nodes || []) {
          if (n.name) catNameSet.add(n.name);
          if (n.children) walk(n.children);
        }
      };
      walk(window.SEED.categoryTree);
    }
    const allPositions = await db.positions.toArray();

    /* 短路（2026-10-06 移动端优化）：本函数只为清理「名字与分类同名的空岗位」。
       第一步只对着岗位表和分类名集合筛候选——若一个候选都没有（正常情况就是没有），
       就不必再读 questions / positionSkills 这两张大表。
       实测 1540 题时 `db.questions.toArray()` 是启动链里最重的一次全表读，
       而本函数在**每次启动**都会跑、且刻意没有一次性开关。
       逻辑等价：岗位名不与任何分类同名时，下面的循环一个都不会命中，结果必然是 0。 */
    if (!allPositions.some(p => catNameSet.has(p.name))) return 0;

    const allQuestions = await db.questions.toArray();
    const allSkills = await db.positionSkills.toArray();

    /* 性能（2026-10-06 移动端优化）：原实现对每个岗位都做
       `allQuestions.some(q => q.positionNames.includes(p.name) || ...)`，
       即 O(岗位数 × 题数)。1540 题 / 142 岗位时约 22 万次数组比较，
       且这段在**每次启动**都跑（本函数刻意没有一次性开关）。
       改为先各扫一遍建立索引，判定降到 O(1) 查表。语义完全等价：
       原来问的是「是否存在某题引用了该岗位名/id」，现在问的是同一件事。 */
    const qPosNames = new Set();
    const qPosIds = new Set();
    for (const q of allQuestions) {
      for (const n of (q.positionNames || [])) qPosNames.add(n);
      for (const i of (q.positionIds || [])) qPosIds.add(i);
    }
    const skillPosIds = new Set();
    for (const s of allSkills) skillPosIds.add(s.positionId);
    const catNameById = new Map();
    for (const c of cats) catNameById.set(c.id, c.name);

    let removed = 0;
    for (const p of allPositions) {
      if (!catNameSet.has(p.name)) continue;                 // 名字不与分类冲突
      if (p.categoryId && catNameById.has(p.categoryId) && catNameById.get(p.categoryId) !== p.name) continue; // 已关联到其它分类
      const hasQ = qPosNames.has(p.name) || qPosIds.has(p.id);
      if (hasQ) continue;
      if (skillPosIds.has(p.id)) continue;
      await db.positions.delete(p.id);
      removed++;
    }
    return removed;
  };

  /* 迁移：为“公有云售后技术支持”预置细分方向示例岗位（大客户答疑 / 监控运维 / 售前技术咨询 / 驻场交付）
     仅针对已有该基础岗位的用户库追加方向细分，方便直接看到“一岗多向”效果；已存在同名同方向的岗位则跳过（幂等）。 */
  DB.migrateSeedDirectionExamples = async function () {
    const MIGRATION_KEY = "migrated_direction_examples_v1";
    if (await DB.getSetting(MIGRATION_KEY)) return 0;
    const baseName = "公有云售后技术支持";
    const dirs = [
      { d: "大客户答疑", tag: "售后支持", desc: "纯解答大客户的产品售后问题、工单处理与客情维护" },
      { d: "监控运维", tag: "售后支持", desc: "盯监控、告警响应、稳定性保障与故障排查" },
      { d: "售前技术咨询", tag: "售后支持", desc: "技术方案咨询、POC 支持，配合销售打单" },
      { d: "驻场交付", tag: "售后支持", desc: "驻客户现场实施交付、环境部署与培训" }
    ];
    const all = await db.positions.toArray();
    const base = all.find(p => p.name === baseName && (!p.direction || p.direction === ""));
    if (!base) { await DB.setSetting(MIGRATION_KEY, true); return 0; }
    const existKeys = new Set(
      all.filter(p => p.name === baseName && p.direction)
         .map(p => p.name + "|" + p.direction)
    );
    let added = 0;
    for (const item of dirs) {
      const key = baseName + "|" + item.d;
      if (existKeys.has(key)) continue;
      const id = await db.positions.add({
        name: baseName,
        stage: base.stage || "大数据与云计算时代",
        tag: item.tag,
        category: base.category || "",
        categoryId: base.categoryId != null ? base.categoryId : null,
        direction: item.d,
        description: item.desc,
        demand: base.demand || "中",
        sort: 0,
        status: "active"
      });
      // 复制基础岗位的技术栈，方便直接看到结构
      const skills = await db.positionSkills.where("positionId").equals(base.id).toArray();
      for (const sk of skills) {
        await db.positionSkills.add({
          positionId: id, categoryId: sk.categoryId != null ? sk.categoryId : null,
          techName: sk.techName, stars: sk.stars || 3, depth: sk.depth || "了解", required: sk.required
        });
      }
      added++;
    }
    if (added > 0) await DB.setSetting(MIGRATION_KEY, true);
    return added;
  };

  /* ---------- 个人批注（题目详情页「我的批注」） ---------- */
  DB.noteGet = async function (questionId) {
    const rows = await db.notes.where("questionId").equals(questionId).toArray();
    return rows.length ? rows[rows.length - 1] : null;
  };
  DB.noteSet = async function (questionId, text) {
    const val = (text == null ? "" : String(text));
    const rows = await db.notes.where("questionId").equals(questionId).toArray();
    if (!val.trim()) {                     // 内容清空 = 删除该题批注
      for (const r of rows) await db.notes.delete(r.id);
      return null;
    }
    const now = Date.now();
    if (rows.length) {
      const keep = rows[0];
      await db.notes.update(keep.id, { text: val, updatedAt: now });
      for (const r of rows.slice(1)) await db.notes.delete(r.id);   // 清理历史重复记录
      return { id: keep.id, questionId, text: val, updatedAt: now };
    }
    const id = await db.notes.add({ questionId, text: val, updatedAt: now });
    return { id, questionId, text: val, updatedAt: now };
  };
  DB.notesAll = async function () {        // 全部批注（按更新时间倒序）
    const all = await db.notes.toArray();
    return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  };

  window.DB = DB;
})();

;/* ===== << js/db.js ===== */

;/* ===== >> js/auth.js ===== */
/* =========================================================================
 *  auth.js  —  管理员密码哈希（Web Crypto PBKDF2）与登录态
 * ========================================================================= */
(function () {
  "use strict";
  const A = {};

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function hexToBuf(hex) {
    const a = new Uint8Array(hex.length / 2);
    for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
    return a.buffer;
  }
  async function derive(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: hexToBuf(saltHex), iterations: 100000, hash: "SHA-256" },
      keyMaterial, 256
    );
    return bufToHex(bits);
  }

  A.hasAdmin = async function () { return !!(await DB.getSetting("adminHash")); };

  A.setup = async function (password) {
    const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await derive(password, salt);
    await DB.setSetting("adminHash", { salt, hash });
  };

  A.verify = async function (password) {
    const rec = await DB.getSetting("adminHash");
    if (!rec) return false;
    const hash = await derive(password, rec.salt);
    return hash === rec.hash;
  };

  A.changePassword = async function (newPassword) { return A.setup(newPassword); };

  /* 登录态用 sessionStorage（关闭网页失效）；提供持久标志可选 localStorage */
  const SKEY = "it_hub_admin";
  A.login = function () { try { sessionStorage.setItem(SKEY, "1"); } catch (e) {} };
  A.logout = function () { try { sessionStorage.removeItem(SKEY); } catch (e) {} };
  A.isAdmin = function () { try { return sessionStorage.getItem(SKEY) === "1"; } catch (e) { return false; } };

  window.Auth = A;
})();

;/* ===== << js/auth.js ===== */

;/* ===== >> js/search.js ===== */
/* =========================================================================
 *  search.js  —  Fuse 模糊搜索 + 筛选 + 排序
 * ========================================================================= */
(function () {
  "use strict";
  const S = {};

  S.SYNONYMS = {
    "缓存一致性": "Redis MySQL 分布式缓存 cache",
    "缓存": "cache Redis",
    "数据库": "DB MySQL",
    "消息队列": "MQ Kafka RabbitMQ RocketMQ",
    "微服务": "Spring Cloud Dubbo",
    "容器": "Docker Kubernetes K8s",
    "部署": "DevOps CI CD",
    "前端": "Vue React 浏览器 Web",
    "后端": "Java Spring 服务端",
    "大模型": "LLM AI RAG Agent",
    "检索增强": "RAG 向量检索",
    "认证": "JWT OAuth 登录",
    "并发": "线程 锁 多线程",
    "事务": "ACID 隔离级别"
  };
  S.PINYIN = {
    "缓存": "huancun",
    "数据库": "shujuku",
    "消息队列": "xiaoxiduilie",
    "微服务": "weifuwu",
    "容器": "rongqi",
    "部署": "bushu",
    "前端": "qianduan",
    "后端": "houduan",
    "大模型": "damoxing",
    "事务": "shiwu",
    "并发": "bingfa",
    "线程": "xiancheng",
    "锁": "suo"
  };

  S.aliases = function (q) {
    const hay = [q.title, q.body, q.answer, q.catName, (q.tags || []).join(" "), (q.positionNames || []).join(" ")].join(" ");
    let out = [];
    Object.keys(S.SYNONYMS).forEach(k => { if (hay.indexOf(k) >= 0) out.push(k, S.SYNONYMS[k]); });
    Object.keys(S.PINYIN).forEach(k => { if (hay.indexOf(k) >= 0) out.push(S.PINYIN[k]); });
    return out.join(" ");
  };

  S.build = function (questions) {
    const docs = questions.map(q => ({
      ref: q.id,
      title: q.title || "",
      body: q.body || "",
      answer: q.answer || "",
      tags: (q.tags || []).join(" "),
      positions: (q.positionNames || []).join(" "),
      cat: q.catName || "",
      alias: S.aliases(q)
    }));
    return new Fuse(docs, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "tags", weight: 0.2 },
        { name: "body", weight: 0.15 },
        { name: "positions", weight: 0.12 },
        { name: "answer", weight: 0.08 },
        { name: "cat", weight: 0.05 },
        { name: "alias", weight: 0.18 }
      ],
      includeMatches: true,
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 1
    });
  };

  S.run = function (fuse, term) {
    if (!term || !term.trim()) return null;
    const res = fuse.search(term.trim());
    const map = new Map();
    res.forEach(r => map.set(r.item.ref, r.matches || []));
    return map; // id -> matches
  };

  /* 高亮：把匹配子串包 <mark> */
  S.highlight = function (text, matches, key) {
    if (!text) return "";
    const ms = (matches || []).filter(m => m.key === key);
    if (!ms.length) return U.esc(text);
    let out = "";
    let idx = 0;
    ms.forEach(m => {
      const v = m.value || "";
      const i = v.toLowerCase().indexOf(m.key ? "" : "");
      // Fuse match.indices 给出 [start,end] 区间
      (m.indices || []).forEach(([s, e]) => {
        if (s < idx) return;
        out += U.esc(v.slice(idx, s));
        out += "<mark>" + U.esc(v.slice(s, e + 1)) + "</mark>";
        idx = e + 1;
      });
      if (idx < v.length) out += U.esc(v.slice(idx));
    });
    return out || U.esc(text);
  };

  /* 筛选 */
  S.filter = function (questions, f) {
    f = f || {};
    return questions.filter(q => {
      if (f.categoryId != null) {
        // 含子分类：调用方已展开，这里直接比较
        if (q.categoryId !== f.categoryId) return false;
      }
      if (f.difficulty && f.difficulty.length && f.difficulty.indexOf(q.difficulty) < 0) return false;
      if (f.type && f.type.length && f.type.indexOf(q.type) < 0) return false;
      if (f.source && f.source.length && f.source.indexOf(q.source) < 0) return false;
      if (f.status && f.status.length && f.status.indexOf(q.status) < 0) return false;
      if (f.positions && f.positions.length) {
        const inter = (q.positionNames || []).filter(n => f.positions.indexOf(n) >= 0);
        if (!inter.length) return false;
      }
      if (f.tags && f.tags.length) {
        const inter = (q.tags || []).filter(t => f.tags.indexOf(t) >= 0);
        if (!inter.length) return false;
      }
      if (f.years && f.years.length && f.years.indexOf(q.years) < 0) return false;
      if (f.aiMin != null && (q.aiScore || 0) < f.aiMin) return false;
      if (f.aiMax != null && (q.aiScore || 0) > f.aiMax) return false;
      if (f.q && f.q.trim()) {
        const t = f.q.toLowerCase();
        const hay = ((q.title || "") + " " + (q.body || "") + " " + (q.tags || []).join(" ") + " " + (q.positionNames || []).join(" ") + " " + S.aliases(q)).toLowerCase();
        if (hay.indexOf(t) < 0) return false;
      }
      if (f.predicates && f.predicates.length && !f.predicates.every(p => p(q))) return false;
      return true;
    });
  };

  S.sort = function (arr, by) {
    const a = arr.slice();
    switch (by) {
      case "views": a.sort((x, y) => (y.views || 0) - (x.views || 0)); break;
      case "favorites": a.sort((x, y) => (y.favorites || 0) - (x.favorites || 0)); break;
      case "aiScore": a.sort((x, y) => (y.aiScore || 0) - (x.aiScore || 0)); break;
      case "updated":
      default: a.sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0)); break;
    }
    return a;
  };

  window.Search = S;
})();

;/* ===== << js/search.js ===== */

;/* ===== >> js/aiprompts.js ===== */
/* =========================================================================
 *  aiprompts.js  —  AI Prompt 模板（DeepSeek Harness）
 * ========================================================================= */
(function () {
  "use strict";
  const P = {};

  P.SYSTEM = `你是一名资深IT技术面试官和IT技术体系专家。请根据提供的岗位名称、工作年限和岗位JD，生成高质量、可用于真实技术面试的题目。要求优先覆盖岗位JD中明确要求的技术栈，题目难度应匹配目标工作年限，题目需覆盖基础理论、实际场景、故障排查、设计思路等多个维度，每道题必须提供专业准确结构化的参考答案，避免重复题目和过于简单的问题，为每道题提供建议技术分类路径，如果现有技术体系中没有对应分类则在指定字段中说明，必须按照指定JSON结构返回不要输出JSON以外的解释文字，编程题应给出题目要求和考察点和参考解法和示例代码，系统设计题应给出架构思路和关键组件和风险点和扩展追问。`;

  P.analyzeJD = function (jd, years) {
    return `请解析以下岗位JD，提取结构化信息并以JSON返回，不要输出JSON以外的任何文字。
要求返回格式：
{
  "positionName": "识别到的岗位名称",
  "years": "工作年限要求",
  "required": ["必备技术栈列表"],
  "bonus": ["加分技术栈列表"],
  "soft": ["软技能要求列表"]
}
岗位JD原文：
"""
${jd}
"""
目标工作年限：${years || "未指定"}

 只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头、以 } 结尾。`;
  };

  P.generate = function (spec) {
    const diffPart = spec.diffRatio && Object.keys(spec.diffRatio).length
      ? `\n各难度题目数量比例（仅供参考，自行合理分配）：${JSON.stringify(spec.diffRatio)}` : "";
    const typePart = spec.typeRatio && Object.keys(spec.typeRatio).length
      ? `\n各题型数量比例：${JSON.stringify(spec.typeRatio)}` : "";
    const jdPart = spec.jd ? `\n岗位JD原文：\n"""\n${spec.jd}\n"""` : "";
    const techPart = spec.techList && spec.techList.length
      ? `\n必须覆盖的技术栈及建议题量：${JSON.stringify(spec.techList)}` : "";
    return `请根据以下信息生成面试题，并以JSON返回，不要输出JSON以外的任何文字。
岗位名称：${spec.positionName}
工作年限：${spec.years || "未指定"}
生成题目总数：${spec.count || 10}${jdPart}${techPart}${diffPart}${typePart}
${spec.answer !== false ? "为每道题生成标准答案。" : "不生成答案。"}
${spec.followup ? "为每道题生成2-3个面试追问问题。" : ""}

重要输出顺序要求：必须先输出完整的 questions 数组（这是核心内容），再输出其他字段。如果输出长度接近上限，优先保证 questions 完整，missingCategories 可省略。

返回JSON结构（按此顺序输出）：
{
  "positionName": "岗位名称",
  "techStack": ["识别到的技术栈"],
  "questions": [
    {
      "title": "题目标题",
      "body": "题目正文（Markdown）",
      "answer": "参考答案（Markdown，含代码示例）",
      "categoryPath": ["建议技术分类路径"],
      "difficulty": "初级|中级|高级|专家",
      "type": "单选题|多选题|判断题|填空题|简答题|编程题|场景题|故障排查题|系统设计题|开放讨论题",
      "tags": ["技术标签"],
      "years": "工作年限要求",
      "followups": ["追问问题"]
    }
  ],
  "missingCategories": [
    { "name": "建议新增的分类名称", "parentPath": "建议父级分类路径", "reason": "缺失原因" }
  ]
}

只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头。`;
  };

  P.optimize = function (question, action) {
    const map = {
      "optimize": "请优化以下题目的表述，指出表述是否清晰、有无歧义或不专业之处，并给出优化后的完整题目正文（Markdown）。",
      "answer": "请为以下题目补充或完善更详细专业的参考答案（Markdown，必要时含代码）。",
      "followup": "请基于以下题目生成3-5个适合深入追问的问题。",
      "similar": "请基于以下题目生成2-3道考查相同知识点但表述不同的相似题（含答案）。",
      "difficulty": "请评估以下题目的实际难度，给出建议难度等级（初级/中级/高级/专家）及修改意见。",
      "check": "请检查以下参考答案中是否存在技术性错误，逐条指出并给出修正。",
      "rubric": "请为以下题目生成面试官评分参考标准（按要点给分）。"
    };
    return `${map[action] || map.optimize}
请以JSON返回：{"result": "你的输出内容"}，不要输出JSON以外的文字，严禁使用 markdown 代码块围栏，必须直接以 { 开头、以 } 结尾。

题目：
标题：${question.title}
正文：${question.body}
参考答案：${question.answer || "（无）"}`;
  };

  P.completeness = function (categories, questionsCount) {
    return `我是IT面试题库管理员。当前技术分类体系如下（格式：分类名(题目数)）：
${categories.map(c => `- ${c.name}(${c.count})`).join("\n")}

请分析该技术体系与主流IT技术栈相比缺少哪些内容、哪些分类题目数量严重不足、是否存在命名不规范和分类层级不合理、是否存在内容重复。

以JSON返回：
{
  "gaps": [{"name":"建议新增分类","parentPath":"建议父级分类路径","reason":"缺失原因"}],
  "insufficient": [{"name":"题目不足的分类","count":当前数量,"suggest":建议数量}],
  "issues": [{"name":"分类名","problem":"规范性问题说明"}]
}
只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头、以 } 结尾。`;
  };

  window.AIPrompts = P;
})();

;/* ===== << js/aiprompts.js ===== */

;/* ===== >> js/api.js ===== */
/* =========================================================================
 *  api.js  —  DeepSeek Harness API 调用（流式）
 * ========================================================================= */
(function () {
  "use strict";
  const API = {};
  const LS = {
    key: "it_hub_ai_key", base: "it_hub_ai_base", model: "it_hub_ai_model",
    store: "it_hub_ai_store", timeout: "it_hub_ai_timeout",
    temp: "it_hub_ai_temp", max: "it_hub_ai_max"
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} }

  API.defaults = { base: "https://api.deepseek.com/v1", model: "deepseek-chat", timeout: 300, temp: 0.7, max: 20, store: "local" };

  API.getConfig = function () {
    return {
      base: lsGet(LS.base) || API.defaults.base,
      model: lsGet(LS.model) || API.defaults.model,
      store: lsGet(LS.store) || API.defaults.store,
      timeout: parseInt(lsGet(LS.timeout)) || API.defaults.timeout,
      temp: parseFloat(lsGet(LS.temp)) || API.defaults.temp,
      max: parseInt(lsGet(LS.max)) || API.defaults.max
    };
  };
  API.saveConfig = function (cfg) {
    lsSet(LS.base, cfg.base); lsSet(LS.model, cfg.model); lsSet(LS.store, cfg.store);
    lsSet(LS.timeout, cfg.timeout); lsSet(LS.temp, cfg.temp); lsSet(LS.max, cfg.max);
  };
  API.getKey = function () {
    const store = lsGet(LS.store) || API.defaults.store;
    return store === "session" ? ssGet(LS.key) : lsGet(LS.key);
  };
  API.setKey = function (key) {
    const store = lsGet(LS.store) || API.defaults.store;
    if (store === "session") { ssSet(LS.key, key); lsSet(LS.key, null); }
    else { lsSet(LS.key, key); ssSet(LS.key, null); }
  };
  API.clearKey = function () { lsSet(LS.key, null); ssSet(LS.key, null); };

  /* 流式对话，返回完整文本。
   * opts:
   *   onToken(delta, full) — 每收到一个 token 回调
   *   onEvent(type, payload) — 生命周期事件：connecting/connected/first/done/error/tick
   *   maxTokens            — 传给 API 的 max_tokens（不传则不设）
   *   timeout              — 本次请求覆盖超时（秒），不传用配置值
   * 返回 AbortController（调用方可 .abort() 取消），以及完整文本。
   */
  API.streamChat = async function (messages, opts) {
    opts = opts || {};
    const ev = opts.onEvent;
    const cfg = API.getConfig();
    const key = API.getKey();
    if (!key) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const url = (cfg.base || API.defaults.base).replace(/\/$/, "") + "/chat/completions";
    if (ev) ev("connecting", { model: cfg.model || "deepseek-chat" });
    const ctrl = new AbortController();
    const effectiveTimeout = (opts.timeout || cfg.timeout || 300) * 1000;
    const timer = setTimeout(() => ctrl.abort(), effectiveTimeout);
    // 心跳：每 15 秒发一次 tick（含已耗时），让 UI 显示"仍在工作中"
    let t0 = Date.now(), heartbeat;
    const startHeartbeat = () => {
      heartbeat = setInterval(() => {
        if (ev) ev("tick", { elapsed: Math.round((Date.now() - t0) / 1000), chars: full.length });
      }, 15000);
    };
    const stopHeartbeat = () => { if (heartbeat) { clearInterval(heartbeat); heartbeat = null; } };
    let res;
    try {
      const body = { model: cfg.model || "deepseek-chat", messages: messages, stream: true, temperature: cfg.temp ?? 0.7 };
      if (opts.maxTokens) body.max_tokens = opts.maxTokens;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(timer); stopHeartbeat();
      if (e && e.name === "AbortError") {
        if (ev) ev("error", { code: "CANCELLED" });
        const err = new Error("CANCELLED"); err.code = "CANCELLED"; throw err;
      }
      if (ev) ev("error", { code: "CORS" });
      const err = new Error("CORS"); err.code = "CORS"; err.raw = e; throw err;
    }
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) {
      stopHeartbeat();
      if (ev) ev("error", { code: "INVALID_KEY" });
      const err = new Error("INVALID_KEY"); err.code = "INVALID_KEY"; throw err;
    }
    if (!res.ok) {
      stopHeartbeat();
      if (ev) ev("error", { code: "HTTP", status: res.status });
      const err = new Error("HTTP_" + res.status); err.code = "HTTP"; err.status = res.status; throw err;
    }
    if (ev) ev("connected", { model: cfg.model || "deepseek-chat" });
    startHeartbeat();

    if (!res.body) {
      stopHeartbeat();
      const j = await res.json();
      const content = j.choices && j.choices[0] && j.choices[0].message.content;
      if (ev) ev("done", { chars: (content || "").length, elapsed: Math.round((Date.now() - t0) / 1000) });
      return content;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", full = "", first = true;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          const c = j.choices && j.choices[0];
          if (c && c.delta && c.delta.content) {
            if (first) { first = false; if (ev) ev("first", {}); }
            full += c.delta.content; if (opts.onToken) opts.onToken(c.delta.content, full);
          }
        } catch (_) {}
      }
    }
    stopHeartbeat();
    if (ev) ev("done", { chars: full.length, elapsed: Math.round((Date.now() - t0) / 1000) });
    // 暴露控制器供外部取消（挂在 opts 对象上，避免对字符串基本类型赋值报错）
    opts._ctrl = ctrl;
    return full;
  };

  /* 解析 AI 返回：尽可能容错地把"非标准 JSON"解析成对象。
   * 处理的常见故障：
   *   - markdown 代码围栏（```json / ``` 等）及前后多余解释文字
   *   - 字符串值内含真实换行符 / 制表符（JSON 只允许 \n / \t 转义）
   *   - 行内 // 或 /* *\/ 注释
   *   - 未加引号的对象键
   *   - 尾随逗号
   *   - 顶层直接是数组而非 {questions:[...]} 对象（配合 opts.asQuestions 自动包装）
   * 成功返回解析对象；彻底失败返回 { raw: text } 供上层降级展示。
   */
  const _UNSET = Symbol("unset");

  function _tryParseFull(s) {
    try { return JSON.parse(s); } catch (e) { return _UNSET; }
  }

  // 从文本中截取出最外层平衡括号包裹的区域。
  // 策略：优先尝试 {（对象），其次 [（数组）；取能配平且跨度最大的那个。
  function _extractBalanced(s) {
    let best = null;
    // 按优先级尝试：先 { 后 [
    const attempts = [];
    const bi = s.indexOf("{");
    if (bi >= 0) attempts.push({ start: bi, openCh: "{", closeCh: "}" });
    const ai = s.indexOf("[");
    if (ai >= 0) attempts.push({ start: ai, openCh: "[", closeCh: "]" });
    for (const { start, openCh, closeCh } of attempts) {
      let depth = 0, inStr = false, escaped = false, end = -1;
      for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === openCh) depth++;
        else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end >= 0) {
        const region = s.slice(start, end + 1);
        // 对象类型优先（同样大小时优先选 { 开头的）
        const isObj = openCh === "{";
        if (!best || (region.length > best.length) || (region.length === best.length && isObj)) best = region;
      }
    }
    return best;
  }

  // 字符级容错清洗：转义字符串内的控制符、删除注释、修尾逗号、补未加引号的键
  function _cleanJSON(s) {
    let out = "", i = 0, inStr = false, escaped = false;
    while (i < s.length) {
      const c = s[i];
      if (escaped) { out += c; escaped = false; i++; continue; }
      if (c === "\\") { out += c; escaped = true; i++; continue; }
      if (c === '"') { out += c; inStr = !inStr; i++; continue; }
      if (inStr) {
        if (c === "\n") { out += "\\n"; i++; continue; }
        if (c === "\r") { i++; continue; }       // 丢弃回车
        if (c === "\t") { out += "\\t"; i++; continue; }
        out += c; i++; continue;
      }
      // 仅字符串外才处理注释
      if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
      if (c === "/" && s[i + 1] === "*") { i += 2; while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++; i += 2; continue; }
      out += c; i++;
    }
    // 尾随逗号：{,} 或 [,]
    out = out.replace(/,(\s*[}\]])/g, "$1");
    // 未加引号的对象键（仅 ASCII 标识符，降低误伤中文正文的风险）
    out = out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*):/g, '$1"$2"$3:');
    return out;
  }

  API.parseJSON = function (text, opts) {
    opts = opts || {};
    if (typeof text !== "string") text = String(text);
    if (!text || !text.trim()) return null;
    let s = text.trim();

    // 1) 剥离 markdown 代码围栏（json / javascript / js / jsonc 等）
    const fence = s.match(/```(?:json|javascript|js|jsonc)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();

    // 2) 直接解析（模型听话时）
    let obj = _tryParseFull(s);
    if (obj === _UNSET) {
      // 3) 截取最外层平衡括号区域再解析
      const region = _extractBalanced(s);
      if (region) {
        obj = _tryParseFull(region);
        if (obj === _UNSET) obj = _tryParseFull(_cleanJSON(region)); // 容错清洗后重试
      }
    }
    // 4) 尽力提取：当 asQuestions 但结果中没有 questions 数组时，尝试从原始文本中暴力提取
    if (opts.asQuestions && (obj === _UNSET || !Array.isArray(obj.questions))) {
      const extracted = _extractQuestions(s);
      if (extracted !== _UNSET) obj = extracted;
    }
    if (obj === _UNSET) return { raw: text };

    // 顶层为数组时，按需包装成 { questions: [...] }
    if (opts.asQuestions && Array.isArray(obj)) obj = { questions: obj };
    return obj;
  };

  /* 从可能残缺的文本中尽力提取 questions 数组。
   * 策略：
   *   a) 找 "questions": [ ... ] 并尝试解析为对象数组
   *   b) 如果 a 失败，找每个独立的 { "title": ... } 对象块逐个解析
   * 返回 { questions: [...] } 或 _UNSET
   */
  function _extractQuestions(text) {
    // 策略 a：提取 "questions" 键值对应的数组内容
    const qMatch = text.match(/"questions"\s*:\s*\[/);
    if (qMatch) {
      const start = qMatch.index + qMatch[0].length - 1; // [ 的位置
      // 从 [ 开始向前找匹配的 ]
      let depth = 0, inStr = false, escaped = false, end = -1;
      for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "[") depth++;
        else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end > start) {
        let arrText = text.slice(start, end + 1);
        // 先尝试直接解析
        let arr = _tryParseFull(arrText);
        if (arr === _UNSET) arr = _tryParseFull(_cleanJSON(arrText));
        if (arr !== _UNSET && Array.isArray(arr)) return { questions: arr, _extracted: true };
      }
    }

    // 策略 b：逐个提取 { "title": "..." } 对象块
    const objs = [];
    const re = /\{\s*"title"\s*:\s*"[^"]*"/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const objStart = m.index;
      // 从这个 { 开始找配平的 }
      let depth = 0, inStr2 = false, escaped2 = false, objEnd = -1;
      for (let i = objStart; i < text.length; i++) {
        const c = text[i];
        if (escaped2) { escaped2 = false; continue; }
        if (c === "\\") { escaped2 = true; continue; }
        if (c === '"') { inStr2 = !inStr2; continue; }
        if (inStr2) continue;
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) { objEnd = i; break; } }
      }
      if (objEnd > objStart) {
        const chunk = text.slice(objStart, objEnd + 1);
        let o = _tryParseFull(chunk);
        if (o === _UNSET) o = _tryParseFull(_cleanJSON(chunk));
        if (o !== _UNSET && typeof o === "object" && !Array.isArray(o)) objs.push(o);
      }
    }
    if (objs.length > 0) return { questions: objs, _extracted: true };

    return _UNSET;
  }

  API.testConnection = async function () {
    const r = await API.streamChat([{ role: "user", content: "ping，只回复 OK" }]);
    return { ok: !!r, sample: (r || "").slice(0, 50) };
  };

  API.analyzeJD = async function (jd, years, onToken, onEvent) {
    const opts = { onToken, onEvent };
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.analyzeJD(jd, years) }],
      opts
    );
    const parsed = API.parseJSON(text) || { raw: text };
    parsed._ctrl = opts._ctrl;
    return parsed;
  };

  API.generate = async function (spec, onToken, onEvent, extra) {
    // 每道题预估 2000 token（含正文+答案+追问+元数据），给足空间避免截断
    const estTokens = Math.max(4000, (spec.count || 10) * 2000);
    const opts = { onToken, onEvent, maxTokens: estTokens };
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.generate(spec) }],
      opts
    );
    if (extra && extra.onCtrl) extra.onCtrl(opts._ctrl);
    const parsed = API.parseJSON(text, { asQuestions: true });
    parsed._ctrl = opts._ctrl;
    return parsed;
  };

  API.optimize = async function (question, action, onToken, onEvent) {
    const opts = { onToken, onEvent };
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.optimize(question, action) }],
      opts
    );
    const parsed = API.parseJSON(text) || { raw: text };
    parsed._ctrl = opts._ctrl;
    return parsed;
  };

  API.completeness = async function (categories, onToken, onEvent) {
    const opts = { onToken, onEvent };
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.completeness(categories) }],
      opts
    );
    const parsed = API.parseJSON(text) || { raw: text };
    parsed._ctrl = opts._ctrl;
    return parsed;
  };

  window.API = API;
})();

;/* ===== << js/api.js ===== */

;/* ===== >> js/services.js ===== */
/* =========================================================================
 *  services.js  —  业务查询 / 题目增删改 / 版本 / 收藏历史 / 统计
 * ========================================================================= */
(function () {
  "use strict";
  const S = {};
  const db = DB.db;

  /* 内存缓存 */
  S.categories = [];
  S.positions = [];
  S.positionSkills = [];
  S.questions = [];
  S.catMap = new Map();
  S.posMap = new Map();
  S.catCounts = {};      // categoryId -> 含子孙的题目数
  S.catDirect = {};      // categoryId -> 直接题目数
  S.fuse = null;

  S.reload = async function () {
    S.categories = await db.categories.toArray();
    S.positions = await db.positions.toArray();
    S.positionSkills = await db.positionSkills.toArray();
    S.questions = await db.questions.toArray();
    S.catMap = new Map(S.categories.map(c => [c.id, c]));
    S.posMap = new Map(S.positions.map(p => [p.id, p]));
    S._computeCounts();
    S.questions.forEach(q => { q.catName = S.catName(q.categoryId); q.catPath = S.categoryPath(q.categoryId); });
    S.fuse = Search.build(S.questions);
    S.weakCount = await db.weakBank.count();
  };

  S._computeCounts = function () {
    S.catCounts = {}; S.catDirect = {};
    S.questions.forEach(q => {
      if (q.categoryId != null) { S.catDirect[q.categoryId] = (S.catDirect[q.categoryId] || 0) + 1; }
    });
    // 自底向上累加到祖先
    const byDepth = S.categories.slice().sort((a, b) => b.depth - a.depth);
    byDepth.forEach(c => {
      const d = S.catDirect[c.id] || 0;
      S.catCounts[c.id] = (S.catCounts[c.id] || 0) + d;
      if (c.parentId) S.catCounts[c.parentId] = (S.catCounts[c.parentId] || 0) + (S.catCounts[c.id] || 0);
    });
  };

  /* 分类辅助 */
  S.catName = function (id) { const c = S.catMap.get(id); return c ? c.name : ""; };
  S.categoryPath = function (id) {
    const path = []; let cur = S.catMap.get(id);
    while (cur) { path.unshift(cur.name); cur = S.catMap.get(cur.parentId); }
    return path;
  };
  S.getCategory = id => S.catMap.get(id);
  S.childrenOf = function (parentId) { return S.categories.filter(c => c.parentId === (parentId || 0)).sort((a, b) => a.sort - b.sort); };
  S.descendantIds = function (id) {
    const out = []; const stack = [id];
    while (stack.length) { const cur = stack.pop(); S.categories.forEach(c => { if (c.parentId === cur) { out.push(c.id); stack.push(c.id); } }); }
    return out;
  };

  /* 构建用于前端的分类树（含题目数） */
  S.categoryTree = function () {
    const build = (parentId) => S.childrenOf(parentId).map(c => ({
      ...c, count: S.catCounts[c.id] || 0, children: build(c.id)
    }));
    return build(0);
  };

  /* 岗位 */
  S.positionsByStage = function () {
    const map = new Map();
    S.positions.forEach(p => {
      if (!map.has(p.stage)) map.set(p.stage, []);
      map.get(p.stage).push(p);
    });
    return Array.from(map.entries()).map(([stage, list]) => ({ stage, list }));
  };
  S.getPosition = id => S.posMap.get(id);
  /* 岗位完整显示名：含细分方向时为「岗位名·方向」，否则为岗位名 */
  S.posFullName = function (p) { if (!p) return ""; return p.direction ? (p.name || "") + "·" + p.direction : (p.name || ""); };
  /* 去重 key：名字 + 细分方向，同名异方向视为不同岗位 */
  S.posKey = function (p) { return (p.name || "") + "|" + (p.direction || ""); };
  S.skillsOf = function (positionId) { return S.positionSkills.filter(s => s.positionId === positionId); };
  S.matchPosition = function (q, pos) {
    if (!pos) return false;
    // 优先按 id 精确匹配（方向岗位各自独立题库）
    const ids = q.positionIds || [];
    if (pos.id != null && ids.indexOf(pos.id) >= 0) return true;
    // 名字匹配仅在岗位无细分方向时生效，避免同名异方向岗位互相串题
    const names = q.positionNames || [];
    if (!pos.direction && pos.name != null && names.indexOf(pos.name) >= 0) return true;
    return false;
  };
  S.questionCountForPosition = function (pos) {
    if (!pos) return 0;
    const target = typeof pos === "string" ? { name: pos } : pos;
    return S.questions.filter(q => S.matchPosition(q, target)).length;
  };
  S.getCategoryByName = function (name) { return S.categories.find(c => c.name === name); };
  /* 从当前 seed.js 的 categoryTree 展开出所有分类名（兜底，防止 IndexedDB 分类表过旧未包含新增叶子） */
  S.categoryNamesFromSeed = function () {
    if (typeof window === "undefined" || !window.SEED || !window.SEED.categoryTree) return new Set();
    const names = new Set();
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n.name) names.add(n.name);
        if (n.children) walk(n.children);
      }
    };
    walk(window.SEED.categoryTree);
    return names;
  };
  /* 判断一个名字是否对应任何分类（DB 中已有或当前 seed 中存在） */
  S.isCategoryName = function (name) {
    if (!name) return false;
    return !!S.getCategoryByName(name) || S.categoryNamesFromSeed().has(name);
  };
  /* 隐藏岗位：岗位名与某个分类名相同，就不应该在岗位体系/岗位管理里显示（它是分类，不是岗位） */
  S.isHiddenPosition = function (p) {
    if (!p || !p.name) return false;
    return S.isCategoryName(p.name);
  };
  /* 伪岗位检测：岗位名与某个分类名相同，且没有实质关联内容（无题目、无技术栈），可安全删除 */
  S.isFakePosition = function (p) {
    if (!S.isHiddenPosition(p)) return false;
    if (S.questionCountForPosition(p) > 0) return false;
    if (S.skillsOf(p.id).length > 0) return false;
    return true;
  };

  /* 题目查询 */
  S.getQuestion = async function (id) { return await db.questions.get(id); };
  S.allQuestions = () => S.questions;
  S.published = () => S.questions.filter(q => q.status === "published");

  /* 收藏 / 历史 */
  S.isFavorite = async function (qid) { const r = await db.favorites.where("questionId").equals(qid).first(); return !!r; };
  S.toggleFavorite = async function (qid) {
    const r = await db.favorites.where("questionId").equals(qid).first();
    const q = await db.questions.get(qid);
    if (r) {
      await db.favorites.delete(r.id);
      if (q) await db.questions.update(qid, { favorites: Math.max(0, (q.favorites || 0) - 1) });
      await S.reload();
      return false;
    }
    await db.favorites.add({ questionId: qid, createdAt: Date.now() });
    if (q) await db.questions.update(qid, { favorites: (q.favorites || 0) + 1 });
    await S.reload();
    return true;
  };
  S.getFavorites = async function () {
    const fs = await db.favorites.orderBy("createdAt").reverse().toArray();
    /* bulkGet 一次取全部题目，替代逐条 await get 的 N+1 查询 */
    const qs = await db.questions.bulkGet(fs.map(f => f.questionId));
    const qmap = new Map(); qs.forEach(q => { if (q) qmap.set(q.id, q); });
    return fs.filter(f => qmap.has(f.questionId)).map(f => qmap.get(f.questionId));
  };
  S.addHistory = async function (qid) {
    const existing = await db.histories.where("questionId").equals(qid).first();
    if (existing) await db.histories.delete(existing.id);
    /* views：重访计数（第 1 次访问记 1），「看过 N 次」是薄弱信号 */
    await db.histories.add({ questionId: qid, createdAt: Date.now(), views: ((existing && existing.views) || 0) + 1 });
    const all = await db.histories.toArray();
    if (all.length > 300) { all.sort((a, b) => a.createdAt - b.createdAt); for (const h of all.slice(0, all.length - 300)) await db.histories.delete(h.id); }
  };
  S.removeHistory = async function (qid) {
    await db.histories.where("questionId").equals(qid).delete();
  };
  S.getHistories = async function () {
    const hs = await db.histories.orderBy("createdAt").reverse().toArray();
    /* bulkGet 一次取全部题目，替代逐条 await get 的 N+1 查询 */
    const qs = await db.questions.bulkGet(hs.map(h => h.questionId));
    const qmap = new Map(); qs.forEach(q => { if (q) qmap.set(q.id, q); });
    return hs.filter(h => qmap.has(h.questionId)).map(h => ({ q: qmap.get(h.questionId), at: h.createdAt, views: h.views || 1 }));
  };
  /* 一次性修复：历史上路由字符串 id 被直接写入 histories（questionId 为字符串），
     导致读取时 bulkGet 数字主键全部 miss（浏览历史页永远为空）。
     把字符串 questionId 转为数字并去重（已存在数字行只保留最早/既有行，删字符串行）。 */
  S.repairHistoryIds = async function () {
    const rows = await db.histories.toArray();
    const bad = rows.filter(h => typeof h.questionId !== "number" && /^\d+$/.test(String(h.questionId)));
    if (!bad.length) return 0;
    const numIds = new Set(rows.filter(h => typeof h.questionId === "number").map(h => h.questionId));
    let fixed = 0;
    for (const b of bad) {
      await db.histories.delete(b.id);
      const nid = parseInt(b.questionId);
      if (!numIds.has(nid)) { numIds.add(nid); await db.histories.add({ questionId: nid, createdAt: b.createdAt }); fixed++; }
    }
    return fixed;
  };

  /* 薄弱题本：标记「不熟悉 / 不会」的题目持久化收集
     关联键同时存 questionId 与 title 双重冗余：题目以 Dexie 自增主键(id)入库，
     云端同步 clear+bulkAdd 或本地重建都可能让 id 错位于"另一道题"，
     因此取回时若按 id 找不到（或题目已被删除），用 title 兜底定位原题。 */
  /* ---------- 错题重练（艾宾浩斯记忆曲线调度） ----------
     间隔序列：5分钟 → 30分钟 → 12小时 → 1天 → 2天 → 4天 → 7天 → 15天
     会了：box+1 并按新间隔排期；还不会：回到 box=0，5分钟后重来。 */
  S.EBBS = [5 * 60e3, 30 * 60e3, 12 * 3600e3, 864e5, 2 * 864e5, 4 * 864e5, 7 * 864e5, 15 * 864e5];
  S.EBBS_LABEL = ["5分钟", "30分钟", "12小时", "1天", "2天", "4天", "7天", "15天"];
  S.addWeak = async function (qid, marked) {
    const q = await db.questions.get(qid);
    const title = q ? (q.title || "") : "";
    const now = Date.now();
    const existing = await db.weakBank.where("questionId").equals(qid).first();
    if (existing) await db.weakBank.update(existing.id, { marked, title, updatedAt: now });
    else await db.weakBank.add({ questionId: qid, title, marked, createdAt: now, updatedAt: now, box: 0, dueAt: now + S.EBBS[0] });
    S.weakCount = await db.weakBank.count();
  };
  S.removeWeak = async function (qid) {
    const existing = await db.weakBank.where("questionId").equals(qid).first();
    if (existing) { await db.weakBank.delete(existing.id); S.weakCount = await db.weakBank.count(); }
  };
  S.isWeak = async function (qid) { const r = await db.weakBank.where("questionId").equals(qid).first(); return !!r; };
  /* 单题复习详情：详情页展示记忆曲线状态用（box 阶段 / 下次到期时间） */
  S.weakInfo = async function (qid) {
    const w = await db.weakBank.where("questionId").equals(qid).first();
    if (!w) return null;
    if (!w.dueAt) { w.box = 0; w.dueAt = (w.createdAt || Date.now()) + S.EBBS[0]; }
    return { box: w.box || 0, dueAt: w.dueAt, marked: w.marked || "" };
  };
  S.getWeakQuestions = async function () {
    const ws = await db.weakBank.orderBy("updatedAt").reverse().toArray();   // 最近标记的在最前
    const out = [], seen = new Set();
    for (const w of ws) {
      let q = null;
      if (w.questionId != null) q = await db.questions.get(w.questionId);     // 主关联：稳定 id
      if (!q && w.title) q = await db.questions.where("title").equals(w.title).first();  // 兜底：title
      if (q && q.status === "published") {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        q._weakMarked = w.marked;   // 标记类型（familiar/unknown），供前端展示
        out.push(q);
      }
    }
    return out;
  };
  S.clearWeak = async function () { await db.weakBank.clear(); S.weakCount = 0; };
  S.weakList = async function () {
    const ws = await db.weakBank.toArray();
    const now = Date.now(); const due = [], upcoming = [];
    for (const w of ws) {
      if (!w.dueAt) { w.box = 0; w.dueAt = (w.createdAt || now) + S.EBBS[0]; db.weakBank.update(w.id, { box: 0, dueAt: w.dueAt }); }
      let q = null;
      if (w.questionId != null) q = await db.questions.get(w.questionId);
      if (!q && w.title) q = await db.questions.where("title").equals(w.title).first();
      if (!q || q.status !== "published") continue;
      w._q = q;
      (w.dueAt <= now ? due : upcoming).push(w);
    }
    due.sort((a, b) => a.dueAt - b.dueAt);
    upcoming.sort((a, b) => a.dueAt - b.dueAt);
    return { due, upcoming };
  };
  S.weakGrade = async function (qid, ok) {
    const w = await db.weakBank.where("questionId").equals(qid).first();
    if (!w) return;
    const now = Date.now();
    if (ok) { const nb = Math.min((w.box || 0) + 1, S.EBBS.length - 1); await db.weakBank.update(w.id, { box: nb, dueAt: now + S.EBBS[nb], lastOkAt: now, updatedAt: now }); }
    else await db.weakBank.update(w.id, { box: 0, dueAt: now + S.EBBS[0], updatedAt: now });
  };
  S.incViews = async function (qid) { const q = await db.questions.get(qid); if (q) await db.questions.update(qid, { views: (q.views || 0) + 1 }); };

  /* 题目版本与 CRUD */
  S.addQuestion = async function (data) {
    const now = Date.now();
    const id = await db.questions.add({
      categoryId: data.categoryId ?? null,
      title: data.title || "未命名题目",
      body: data.body || "",
      answer: data.answer || "",
      difficulty: data.difficulty || "中级",
      type: data.type || "简答题",
      positionIds: data.positionIds || [],
      positionNames: data.positionNames || [],
      years: data.years || "",
      tags: data.tags || [],
      source: data.source || "manual",
      aiScore: data.aiScore || 0,
      status: data.status || "draft",
      views: 0, favorites: 0,
      relatedIds: data.relatedIds || [],
      remark: data.remark || "",
      createdAt: now, updatedAt: now
    });
    return id;
  };
  S.updateQuestion = async function (id, data) {
    const old = await db.questions.get(id);
    if (old) {
      const v = (await db.questionVersions.where("questionId").equals(id).count()) + 1;
      await db.questionVersions.add({ questionId: id, version: v, snapshot: old, createdAt: Date.now() });
    }
    await db.questions.update(id, Object.assign({}, data, { updatedAt: Date.now() }));
  };
  S.deleteQuestion = async function (id) {
    await db.questions.delete(id);
    await db.questionVersions.where("questionId").equals(id).delete();
  };
  S.duplicateQuestion = async function (id) {
    const q = await db.questions.get(id);
    if (!q) return null;
    const now = Date.now();
    const copy = Object.assign({}, q);
    delete copy.id;
    copy.title = q.title + "（副本）";
    copy.status = "draft";
    copy.views = 0; copy.favorites = 0;
    copy.createdAt = now; copy.updatedAt = now;
    return await db.questions.add(copy);
  };
  S.versionsOf = function (id) { return db.questionVersions.where("questionId").equals(id).reverse().sortBy("version"); };
  S.restoreVersion = async function (versionId) {
    const v = await db.questionVersions.get(versionId);
    if (!v) return;
    const snap = v.snapshot;
    const { id, createdAt } = snap;
    await db.questions.update(v.questionId, Object.assign({}, snap, { id: v.questionId, updatedAt: Date.now() }));
  };

  /* 分类 / 岗位 管理 */
  S.addCategory = async function (parentId, data) {
    const siblings = S.childrenOf(parentId);
    return await db.categories.add({
      parentId: parentId || 0, name: data.name, icon: data.icon || "📁", era: data.era || "",
      description: data.description || "", sort: siblings.length, depth: parentId ? (S.catMap.get(parentId).depth + 1) : 0, status: "active"
    });
  };
  S.updateCategory = async function (id, data) { await db.categories.update(id, data); };
  S.deleteCategory = async function (id) {
    const cnt = S.catCounts[id] || 0;
    if (cnt > 0) return { error: "hasQuestions", count: cnt };
    // 递归删子分类
    const kids = S.childrenOf(id);
    for (const k of kids) { const r = await S.deleteCategory(k.id); if (r && r.error) return r; }
    await db.categories.delete(id);
    return { ok: true };
  };
  S.addPosition = async function (data) {
    const categoryId = data.categoryId != null ? data.categoryId : null;
    const category = categoryId != null ? (S.catName(categoryId) || data.category || "") : (data.category || "");
    return await db.positions.add({ name: data.name, direction: data.direction || "", stage: data.stage || "未分类", tag: data.tag || "", category: category, categoryId: categoryId, description: data.description || "", demand: data.demand || "中", sort: 0, status: "active" });
  };
  S.updatePosition = async function (id, data) {
    if (data.categoryId != null) data.category = S.catName(data.categoryId) || data.category || "";
    await db.positions.update(id, data);
  };
  S.deletePosition = async function (id) { await db.positions.delete(id); await db.positionSkills.where("positionId").equals(id).delete(); };
  S.addPositionSkill = async function (data) { return await db.positionSkills.add(data); };
  S.deletePositionSkill = async function (id) { await db.positionSkills.delete(id); };

  /* 统计 */
  S.stats = async function () {
    const qs = S.questions;
    const byDiff = {}, byType = {}, bySource = {}, byAiBand = { "0-59": 0, "60-79": 0, "80-89": 0, "90-100": 0 };
    qs.forEach(q => {
      byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
      byType[q.type] = (byType[q.type] || 0) + 1;
      bySource[q.source] = (bySource[q.source] || 0) + 1;
      const s = q.aiScore || 0;
      if (s < 60) byAiBand["0-59"]++; else if (s < 80) byAiBand["60-79"]++; else if (s < 90) byAiBand["80-89"]++; else byAiBand["90-100"]++;
    });
    // 分类题目数分布（仅一级）
    const byCat = {};
    S.childrenOf(0).forEach(c => { byCat[c.name] = S.catCounts[c.id] || 0; });
    // 岗位题目数 top
    const byPos = {};
    qs.forEach(q => (q.positionNames || []).forEach(n => byPos[n] = (byPos[n] || 0) + 1));
    // 不足/空分类
    const insufficient = [], empty = [];
    S.childrenOf(0).forEach(c => {
      const n = S.catCounts[c.id] || 0;
      if (n === 0) empty.push(c.name); else if (n < 5) insufficient.push({ name: c.name, count: n });
    });
    const aiLogs = await db.aiGenerateLogs.orderBy("createdAt").reverse().limit(10).toArray();
    const importLogs = await db.importLogs.orderBy("createdAt").reverse().limit(10).toArray();
    const recent = qs.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 10);
    const topFav = qs.slice().sort((a, b) => (b.favorites || 0) - (a.favorites || 0)).slice(0, 10);
    return {
      total: qs.length, published: qs.filter(q => q.status === "published").length,
      draft: qs.filter(q => q.status === "draft").length, offline: qs.filter(q => q.status === "offline").length,
      ai: qs.filter(q => q.source === "ai").length, manual: qs.filter(q => q.source === "manual").length,
      import: qs.filter(q => q.source === "import").length,
      categories: S.categories.length, positions: S.positions.length,
      byDiff, byType, bySource, byAiBand, byCat, byPos, insufficient, empty, aiLogs, importLogs, recent, topFav
    };
  };

  /* 备份日志 */
  S.logAI = async function (rec) { await db.aiGenerateLogs.add(Object.assign({ createdAt: Date.now() }, rec)); };
  S.logImport = async function (rec) { await db.importLogs.add(Object.assign({ createdAt: Date.now() }, rec)); };

  window.Services = S;
})();

;/* ===== << js/services.js ===== */

;/* ===== >> js/cloud.js ===== */
/* =========================================================================
 *  cloud.js  —  云端共享题库：同步（访客端拉取）+ 发布（编辑端推送 GitHub）
 *  架构：data/published.json 是云端主库快照，随 Cloudflare Pages 一起发布（源文件在 GitHub）；
 *        访客每次打开自动拉取最新版；配置了发布 Token 的浏览器视为编辑端
 *        （本地为主，不自动覆盖），编辑后自动/手动把本地题库推送到 GitHub。
 *
 *  v20260824c 修复：
 *   - 自动发布：编辑端题目增删改 10 秒后自动推送到 GitHub（可关闭），
 *     通过 Dexie 表钩子监听所有写入路径（含批量导入 / AI 出题）。
 *   - 顶栏状态徽章：未发布 / 发布中 / 失败。
 *   - putFile 通用上传助手（题库与加密备份共用）。
 * ========================================================================= */
(function () {
  "use strict";

  const LS_TOKEN = "gh_publish_token";
  const LS_REPO = "gh_publish_repo";
  const LS_BRANCH = "gh_publish_branch";
  const LS_AUTO = "gh_autopublish";
  const LS_AUTORESTORE = "iti_autorestore_degraded";   /* 2026-09-09：本机答案为降质短版时自动恢复云端完整版 */
  const DEFAULT_REPO = "succedd/workbuddy_it-interview";
  const DEFAULT_BRANCH = "main";
  const FILE_PATH = "data/published.json";
  const FILE_URL = "/" + FILE_PATH;

  const AUTO_DELAY = 10000;      // 防抖：最后一次改动 10 秒后自动发布
  const RETRY_DELAY = 90000;     // 失败后重试间隔

  /* ---- 访客端题库拉取可靠性（2026-09-13 P1 修复）----
     published.json 约 1.5MB，弱网下 8 秒很可能拉不完；而此前 fetchT 无重试、
     fetchRemote 超时直接返回 null，访客会**静默停在 seed 的 99 道题**且毫无提示。
     现在：单次超时提到 25s + 最多 3 次退避重试，失败原因留在 C._lastFetch，
     由 app.js 决定是否提示用户并安排重试。 */
  const FETCH_MS = 8000;         // 非关键调用（发布守卫/对比/导出）单次超时
  const FETCH_MS_FULL = 25000;   // 首次全量题库单次超时
  const FETCH_TRIES = 3;         // 同步关键路径尝试次数
  const FETCH_TRIES_QUICK = 2;   // 非关键路径尝试次数
  const SEED_ONLY_MAX = 400;     // 本机题数 ≤ 此值且从未同步过 => 视为「只有种子库」

  const C = {};

  /* ---------- 配置 ---------- */
  C.token = () => (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_TOKEN) || "") : "");
  C.repo = () => {
    const v = (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_REPO) || "") : "");
    return v || DEFAULT_REPO;
  };
  C.branch = () => {
    const v = (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_BRANCH) || "") : "");
    return v || DEFAULT_BRANCH;
  };
  /* 编辑端：本机配置了发布 Token，本地数据为主 */
  C.isEditor = () => !!C.token();

  C.autoEnabled = function () {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(LS_AUTO) !== "0";   // 默认开启
  };
  C.setAutoEnabled = function (on) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_AUTO, on ? "1" : "0");
    if (!on) { C._dirty = false; unbindUnload(); clearTimeout(C._timer); C._emit(); }
    else if (C._dirty) C._schedule();
  };

  /* 自动恢复降质答案：默认开启 */
  C.autoRestoreEnabled = function () {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(LS_AUTORESTORE) !== "0";
  };
  C.setAutoRestore = function (on) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_AUTORESTORE, on ? "1" : "0");
  };

  C.saveConfig = function (tok, repo, branch) {
    if (typeof localStorage === "undefined") return;
    const wasEditor = C.isEditor();
    localStorage.setItem(LS_TOKEN, (tok || "").trim());
    localStorage.setItem(LS_REPO, (repo || "").trim());
    localStorage.setItem(LS_BRANCH, (branch || "").trim());
    if (!wasEditor && C.isEditor()) C.installHooks();   // 首次配置 Token，立即开始监听
  };

  /* ---------- 工具 ---------- */
  function fetchT(url, opts, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 10000);
    return fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal }))
      .finally(() => clearTimeout(t));
  }

  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  /* ---------- 通用文件上传（GitHub Contents API，乐观锁重试） ---------- */
  C.putFile = async function (path, content, message, branch) {
    const tok = C.token();
    if (!tok) throw new Error("尚未配置发布 Token");
    const br = branch || C.branch();
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const api = "https://api.github.com/repos/" + C.repo() + "/contents/" + path;
    let lastErr = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      /* 每次尝试都重新取最新 sha，避免多标签页 / 并发提交造成的 stale sha */
      let sha = null;
      try {
        const r = await fetchT(api + "?ref=" + encodeURIComponent(br), {
          headers: { "Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json" }
        }, 10000);
        if (r.ok) { const j = await r.json(); sha = j.sha || null; }
      } catch (e) { /* 网络抖动：sha 为 null，下面走创建路径 */ }
      const body = { message: message, content: b64, branch: br };
      if (sha) body.sha = sha;   // 文件存在才带 sha，否则创建
      try {
        const r = await fetchT(api, {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + tok,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }, 30000);
        if (r.ok) return await r.json().catch(() => ({}));
        const j = await r.json().catch(() => ({}));
        const msg = (j && j.message) ? String(j.message) : ("HTTP " + r.status);
        lastErr = new Error("GitHub：" + msg);
        /* 仅冲突类错误重试：sha 不匹配 / 缺 sha（文件已存在但 GET 失败） / 分支问题 */
        const retryable = /does not match|sha.*(wasn't|was not) supplied|branch.*(not found|did not match)/i.test(msg);
        if (!retryable || attempt === 4) throw lastErr;
      } catch (e) {
        lastErr = e;
        if (attempt === 4) throw e;
      }
      await new Promise(res => setTimeout(res, 700 * (attempt + 1)));  // 退避后重取最新 sha
    }
    throw lastErr;
  };

  /* ---------- 拉取云端快照 ----------
     契约不变：失败仍 return null（调用方都按 falsy 处理），但会把最近一次结果
     写入 C._lastFetch，让上层能区分「云端确实没有这个文件」与「网络失败/超时」。
     opts.timeout / opts.attempts 可控重试策略，默认走「首次全量」档（25s × 3）。 */
  C._lastFetch = { ok: false, reason: "", attempts: 0, at: 0 };
  C.lastFetch = function () { return C._lastFetch; };

  C.fetchRemote = async function (noCache, opts) {
    const o = opts || {};
    const attempts = Math.max(1, o.attempts || FETCH_TRIES);
    const timeout = o.timeout || FETCH_MS_FULL;
    const url = FILE_URL + (noCache ? "?v=" + Date.now() : "");
    const init = noCache ? { cache: "no-store" } : undefined;
    let reason = "", tries = 0;
    for (let i = 0; i < attempts; i++) {
      tries = i + 1;
      try {
        const r = await fetchT(url, init, timeout);
        if (r.ok) {
          const j = await r.json();
          /* version 兼容：历史快照恒为 1；2026-08-27 起扩充流水线每次合并会递增，
             因此只要求是正整数，不再限定 ===1 */
          if (j && Number.isInteger(j.version) && j.version >= 1 && Array.isArray(j.questions)) {
            C._lastFetch = { ok: true, reason: "", attempts: i + 1, at: Date.now(), count: j.questions.length };
            return j;
          }
          reason = "badPayload";
        } else {
          reason = "http" + r.status;
          /* 404/403：云端确实没有这个文件，重试无意义 */
          if (r.status === 404 || r.status === 403) break;
        }
      } catch (e) {
        reason = (e && e.name === "AbortError") ? "timeout" : ((e && e.message) || "network");
      }
      if (i < attempts - 1) await sleep(900 * (i + 1));   // 退避 0.9s / 1.8s
    }
    C._lastFetch = { ok: false, reason: reason || "unknown", attempts: attempts, at: Date.now() };
    return null;
  };

  /* ---------- 分片加载（2026-10-06 性能优化） ----------
   * 背景：published.json 单文件约 2.9MB（brotl 后约 780KB），访客首屏必须整包拉完。
   * 实测国内访问 CF 全部命中 LAX 机房，TTFB 1.1~6s，弱网下常常拉不完 → 白屏。
   *
   * 方案（只动读路径，写路径一行不改）：
   *   data/manifest.json  —— 全部题目的**元数据**（无answer/body）+ 每题的 _sh 分片号
   *   data/shards/sNN.json —— 答案正文，按 categoryId 分桶、6 片、每片约 137KB br
   * 首屏只拉 manifest（约 123KB br，降 84%），答案在**打开题目时**按需补齐。
   *
   * 三条必须守住的安全线：
   *  ① manifest 缺失 / 版本不符 / 拉取失败 → 静默回退 C.fetchRemote() 整包，功能不降级；
   *  ② published.json **继续正常发布、继续是权威**，编辑端发布、发布守卫、
   *     absorbRemote、verify-publish.py 的语义完全不变；
   *  ③ 分片只影响「本机题目表怎么被填满」，不改变 publishedAt 指纹语义，
   *     所以 version.json 的「指纹没变就跳过」逻辑依旧成立。 */
  const MANIFEST_PATH = "/data/manifest.json";
  const SHARD_PATH = "/data/shards/";
  const SHARD_TIMEOUT = 12000;
  C._shardCache = {};        /* 分片名 -> questions数组（内存，供同片多题复用） */
  C._shardFailed = {};       /* 分片名 -> true，本次会话内不再重试（避免反复超时拖慢） */

  /* 取一片答案正文。失败返回 null，调用方负责降级。 */
  C.fetchShard = async function (name) {
    if (!name) return null;
    if (C._shardCache[name]) return C._shardCache[name];
    if (C._shardFailed[name]) return null;
    try {
      const r = await fetchT(SHARD_PATH + name + ".json", { cache: "no-cache" }, SHARD_TIMEOUT);
      if (!r.ok) { C._shardFailed[name] = true; return null; }
      const j = await r.json();
      if (!j || !Array.isArray(j.questions)) { C._shardFailed[name] = true; return null; }
      C._shardCache[name] = j.questions;
      return j.questions;
    } catch (e) {
      C._shardFailed[name] = true;
      return null;
    }
  };

  /* 按题号取出该题：先看分片缓存，miss 则拉整片。取不到返回 null。
     分片号来源有三个层次（可靠性递减）：
       ① 调用方直接给的 meta._sh
       ② 本次会话缓存的 manifest 索引（C._manifestById）
       ③ 持久化在 settings 里的 shardMap —— **刷新页面后靠它**。
     ③ 是必需的：metaOnly 首访写入本机的题目不带 _sh（那是内部字段，不该进题库数据），
     若只靠内存索引，用户一刷新就再也定位不到答案所在的分片，永远补不回来。 */
  C.ensureQuestionBody = async function (qid, optMeta) {
    const id = Number(qid);
    if (!id) return null;
    let shard = null;
    const meta = optMeta || (C._manifestById && C._manifestById[id]);
    if (meta && meta._sh) shard = meta._sh;
    if (!shard) {
      try {
        if (!C._shardMap) C._shardMap = (await DB.getSetting("shardMap")) || {};
        shard = C._shardMap[id];
      } catch (_) { /* 取不到就返回 null，调用方按「没答案」渲染 */ }
    }
    if (!shard) return null;
    const arr = await C.fetchShard(shard);
    if (!arr) return null;
    for (let i = 0; i < arr.length; i++) {
      if (Number(arr[i].id) === id) return arr[i];
    }
    return null;
  };

  /* 用 manifest + 分片组装出一个「与 fetchRemote 同构」的快照对象。
     这样 applyRemote / absorbRemote 等下游函数一行都不用改。 */
  C.fetchManifestSnapshot = async function (noCache, opt) {
    const o = opt || {};
    const mb = o.manifestBytes || 20000;   /* manifest 约 123KB br，给足 20s */
    const url = MANIFEST_PATH + (noCache ? "?v=" + Date.now() : "");
    let m;
    try {
      const r = await fetchT(url, noCache ? { cache: "no-store" } : undefined, mb);
      if (!r.ok) return null;
      m = await r.json();
    } catch (e) { return null; }
    if (!m || m.schema !== "manifest-v1" || !Array.isArray(m.questions)) return null;
    /* ⚠️ 这里曾经用 version.json 的 count 做硬校验（题数必须严格相等），
       结果是**分片功能线上从未生效过**：线上 version.json 报 1519 题、
       而题库实际 1540 题（两个发布流程各写各的，天然会漂移），
       校验永远失败 → 每次都静默回退整包 published.json（2.9MB）。
       教训：不要用「另一个可独立变化的文件」去校验本文件的正确性。

       现在改为校验 manifest 与分片的**自洽性**（见下面拉完分片后的题数比对）——
       manifest 与 shards 由 tools/split-published.py 一次产出，它们之间必须一致，
       这个约束才是真正有意义的。外部指纹只用于「要不要重新下载」的判断，
       不该拿来决定「这份数据能不能用」。 */
    if (!Array.isArray(m.shards) || !m.shards.length) return null;
    C._shardNames = m.shards.slice();      /* 记下来，供后台补齐答案时用 */

    /* ---- metaOnly：首访专用，只拿元数据不拿答案 ----
       为什么首访要这样：实测首访若把 manifest + 全部 6 片都拉下来要 3.4MB 原文，
       比整包 published.json(1.64MB) **还多**（分片的价值在回访者的「指纹没变就跳过」，
       对首访反而是负优化）。而首屏真正需要的只是「有哪些题、标题/分类/难度」——
       列表、筛选、统计全靠元数据就能渲染。
       所以首访只拉 manifest（br 约 123KB），答案改成：
         · 打开某道题时按片懒加载（C.ensureQuestionBody，已有）
         · 首屏渲染完成后在后台静默补齐（C.hydrateAnswers）
       这样首访传输量从 3.4MB 降到约 0.9MB 原文（br 约 123KB）。 */
    if (o.metaOnly) {
      C._manifestById = {};
      for (const q of m.questions) C._manifestById[Number(q.id)] = q;
      const metaQuestions = m.questions.map(meta => {
        const c = Object.assign({}, meta);
        delete c._sh;
        /* answer 留空：由懒加载 / 后台补齐填上。绝不能留 undefined，
           否则下游 `(q.answer || "")` 之外的原地拼接会产出 "undefined"。 */
        if (c.answer == null) c.answer = "";
        if (c.body == null) c.body = "";
        return c;
      });
      return {
        version: m.version,
        publishedAt: m.publishedAt,
        categories: m.categories || [],
        positions: m.positions || [],
        positionSkills: m.positionSkills || [],
        questions: metaQuestions,
        removedQuestions: m.removedQuestions || {},
        _fromManifest: true,
        _metaOnly: true
      };
    }

    /* 并发拉全部答案分片。6 片各约 137KB br，并发比串行快得多。 */
    const names = Array.isArray(m.shards) ? m.shards : [];
    const got = await Promise.all(names.map(n => C.fetchShard(n).catch(() => null)));

    /* ⚠️ 严格的一票否决：只要有**任何一片**没拉下来，整个 manifest 快照直接作废，
       回退整包 published.json。
       为什么不能「部分接受」——applyRemote 是整包替换本机题库，编辑端还会把它
       推回云端。若带着「部分题目 answer 为空」的快照做替换，等于用空答案覆盖了
       云端的好答案，而且题数没减少，guardAgainstShrink 拦不住。
       宁可多下一次 780KB，也不能出现这种静默降质。 */
    const missShards = names.filter((n, i) => !got[i]);
    if (names.length && missShards.length) return null;

    /* 自洽校验：所有分片的题目数之和必须等于 manifest 声明的题数。
       两者由同一次 split-published.py 产出，对不上就说明 manifest 与 shards
       不是同一批（例如只重发了其中一个），此时拼出来的快照会缺题 —— 弃用。 */
    let shardTotal = 0;
    for (const g of got) shardTotal += g ? g.length : 0;
    if (shardTotal !== m.questions.length) {
      console.warn("[cloud] manifest 与分片题数不一致，回退整包：manifest=" +
        m.questions.length + " shards=" + shardTotal);
      return null;
    }

    /* 以 manifest 元数据为骨架，叠加分片里的 answer/body 字段。
       合并策略：manifest 打底（保证 id/title/categoryId 等一定在），
       分片里同id 的对象用它的 answer/body/firstPrinciples 覆盖。 */
    const byId = {};
    names.forEach((n, i) => {
      const arr = got[i];
      if (!arr) return;
      for (const q of arr) byId[Number(q.id)] = q;
    });
    const questions = m.questions.map(meta => {
      const body = byId[Number(meta.id)];
      if (!body) return null;               /* 理论到不了这里（一票否决已拦），留作兜底 */
      const merged = Object.assign({}, meta, body);
      delete merged._sh;
      /* 分片里的 remark 是本机批注，不该从云端来（历史行为就是不带 remark 的） */
      if (merged.remark == null) delete merged.remark;
      return merged;
    }).filter(Boolean);

    C._manifestById = {};
    for (const q of m.questions) C._manifestById[Number(q.id)] = q;

    return {
      version: m.version,
      publishedAt: m.publishedAt,
      categories: m.categories || [],
      positions: m.positions || [],
      positionSkills: m.positionSkills || [],
      questions: questions,
      removedQuestions: m.removedQuestions || {},
      _fromManifest: true,
      _missShards: missShards
    };
  };

  /* fetchRemote 的分片版：优先走 manifest，失败自动回退整包。
     这是所有读路径的唯一入口。 */
  C.fetchSnapshot = async function (noCache, opts) {
    if (!(opts && opts.forceFull)) {
      const snap = await C.fetchManifestSnapshot(noCache, opts);
      if (snap) {
        C._lastFetch = { ok: true, reason: "", attempts: 1, at: Date.now(), count: snap.questions.length, viaManifest: true };
        return snap;
      }
      /* manifest 不可用 → 落到整包，绝不因此让访客停在种子库 */
      C._manifestMiss = (C._manifestMiss || 0) + 1;
    }
    return C.fetchRemote(noCache, opts);
  };

  /* ---------- 后台补齐答案（2026-10-06 首访优化配套） ----------
   * 首访只拉了 manifest（元数据），答案为空。等首屏渲染完之后，在后台把 6 个分片
   * 依次拉回来写进本机表，让后续的详情页/搜索/离线都有完整内容。
   *
   * 安全约束（重要）：
   *  ① 只在「刚刚 metaOnly 写入过」的情况下调用一次，由 _needHydrate 标记控制。
   *     这样它面对的必然是刚写入的干净元数据，不会覆盖用户自己的改动。
   *  ② 用 update 而不是 bulkPut：只动 answer/body，绝不触碰用户可能改过的
   *     其他字段（remark 本机批注、views/favorites 等计数）。
   *  ③ 单片失败不影响其余片，也不重试（弱网下重试只会更慢）；失败的片留给
   *     详情页懒加载兜底（C.ensureQuestionBody 会现场去取）。
   *  ④ 全程静默：不弹 toast。用户没点任何东西，不该被打扰。 */
  C._needHydrate = false;
  C.hydrateAnswers = async function () {
    if (!C._needHydrate) return { hydrated: 0, reason: "notNeeded" };
    const names = C._shardNames || [];
    if (!names.length) { C._needHydrate = false; return { hydrated: 0, reason: "noShards" }; }
    const db = DB.db;
    let updated = 0, failed = 0;
    for (const name of names) {
      const arr = await C.fetchShard(name);
      if (!arr || !arr.length) { failed++; continue; }
      try {
        /* ⚠️ 这里必须「先读本机记录 → 合并 answer/body → bulkPut」，不能逐条 update。
           初版写成 `for (q of arr) await db.questions.update(q.id, {...})`，
           1540 条就是 1540 次索引查找+写入，实测把主线程压死（首屏内容就绪从
           8.6s 恶化到 13.7s，长任务 19→45 个）——后台任务抢占了前台渲染。
           现在改成一次 bulkGet + 一次 bulkPut：
             · 保留本机其余字段（用户批注 remark、views/favorites 计数等）不被覆盖；
             · 一个事务写完整片，主线程占用降到可忽略。 */
        const ids = arr.map(q => Number(q.id)).filter(Boolean);
        const locals = await db.questions.bulkGet(ids);
        const localMap = new Map();
        for (const rec of locals) if (rec) localMap.set(Number(rec.id), rec);
        const merged = arr.map(q => {
          const id = Number(q.id);
          const local = localMap.get(id);
          if (!local) return q;                       /* 本机没有就整条写入 */
          return Object.assign({}, local, {           /* 有则只覆盖答案正文两字段 */
            answer: q.answer == null ? "" : q.answer,
            body: q.body == null ? "" : q.body
          });
        });
        await db.questions.bulkPut(merged);
        updated += merged.length;
      } catch (e) {
        failed++;
        console.warn("[cloud] 分片补齐失败:", name, e && e.message);
      }
      /* 让出一帧再做下一片，避免长时间占住主线程影响用户操作 */
      await new Promise(r => setTimeout(r, 0));
    }
    C._needHydrate = false;
    if (updated) {
      try { await Services.reload(); } catch (_) {}
      try { if (C._emit) C._emit(); } catch (_) {}
    }
    C._lastHydrate = { updated, failed, at: Date.now() };
    return { hydrated: updated, failed };
  };

  /* ---------- 版本指纹（20261005a 数据瘦身） ----------
   * data/version.json 是 ~120B 的轻量指纹 {version, publishedAt, count, rmCount}，
   * 与 published.json 同步发布（编辑端 _publishInner 与扩充流水线都会写）。
   * 启动同步 / 增量吸收 / 发布守卫先取它：指纹没变 → 跳过全量下载；
   * 指纹缺失或解析失败 → 回退全量拉取（完全兼容旧快照，不会因缺指纹而失灵）。
   * 判定用「严格相等」而非 <=：万一某次 version.json 发布失败停留在旧值，
   * 本地较新时会走全量拉取自愈，绝不会因 stale 指纹漏更新。 */
  C.META_PATH = "data/version.json";
  C.META_URL = "/" + C.META_PATH;
  C.fetchMeta = async function () {
    try {
      const r = await fetchT(C.META_URL + "?v=" + Date.now(), { cache: "no-store" }, 6000);
      if (!r.ok) return null;
      const j = await r.json();
      if (j && Number.isInteger(j.publishedAt) && j.publishedAt >= 0 && Number.isInteger(j.count)) return j;
      return null;
    } catch (e) { return null; }
  };
  /* 由快照对象构造指纹文本（发布侧复用，保证两端字段一致） */
  C.metaOf = function (data) {
    return JSON.stringify({
      version: data.version || 1,
      publishedAt: data.publishedAt || 0,
      count: (data.questions || []).length,
      rmCount: (data.removedQuestions && typeof data.removedQuestions === "object") ? Object.keys(data.removedQuestions).length : 0
    });
  };

  /* ---------- 重复题清理（2026-09-10） ----------
     云端把同一道题的重复收录合并掉了（published.json 顶层 removedQuestions = {旧题号: 保留题号}）。
     只删云端不够：本机若还留着，编辑端下次自动发布会把它整包推回（题数没变少，发布守卫不会拦）；
     普通浏览器的本地收藏/浏览/错题记录也会变成指向不存在题目的死记录。
     这里做两件事：① 删掉本机的重复题；② 把 favorites / histories / weakBank 重定向到保留题号。
     幂等：同一份映射重复执行结果一致，失败不阻断启动流程。 */
  C.applyRemovedQuestions = async function (map) {
    const db = DB.db;
    const out = { removed: 0, remapped: 0 };
    if (!map || typeof map !== "object") return out;
    const pairs = Object.keys(map)
      .map(k => [parseInt(k, 10), parseInt(map[k], 10)])
      .filter(p => p[0] && p[1] && p[0] !== p[1]);
    if (!pairs.length) return out;
    try { await DB.setSetting("removedMap", map); } catch (_) {}   /* 缓存映射，供账号云同步合并后再次清理 */
    try {
      await db.transaction("rw", [db.questions, db.questionVersions, db.favorites, db.histories, db.weakBank], async () => {
        for (const pair of pairs) {
          const from = pair[0], to = pair[1];
          if (await db.questions.get(from)) { await db.questions.delete(from); out.removed++; }
          const vers = await db.questionVersions.where("questionId").equals(from).toArray();
          for (const v of vers) await db.questionVersions.delete(v.id);
          for (const store of [db.favorites, db.histories, db.weakBank]) {
            const olds = await store.where("questionId").equals(from).toArray();
            if (!olds.length) continue;
            let keepExists = !!(await store.where("questionId").equals(to).first());
            for (const rec of olds) {
              if (keepExists) await store.delete(rec.id);          /* 保留题已有同类记录，旧的直接去重 */
              else { await store.update(rec.id, { questionId: to }); keepExists = true; }
              out.remapped++;
            }
          }
        }
      });
    } catch (e) { /* 清理失败只影响去重，不阻断同步 */ }
    C._lastRemoved = out;
    return out;
  };

  /* 已缓存的「被删题号 → 保留题号」映射（账号云同步合并后用它再清理一次，
     否则云端用户数据里残留的旧题号会被重新拉回本机，形成指向不存在题目的死记录） */
  C.getRemovedMap = async function () {
    try {
      const v = await DB.getSetting("removedMap");
      return (v && typeof v === "object") ? v : {};
    } catch (e) { return {}; }
  };

  /* ---------- 应用云端快照到本地（全量替换，保留收藏/历史/设置） ---------- */
  C._suppress = 0;   // >0 期间不触发脏标记（如手动从云端覆盖同步）
  C.applyRemote = async function (data) {
    const db = DB.db;
    C._suppress++;
    try {
      await db.transaction("rw", [db.categories, db.positions, db.positionSkills, db.questions], async () => {
        await db.categories.clear();
        await db.positions.clear();
        await db.positionSkills.clear();
        await db.questions.clear();
        if (data.categories && data.categories.length) await db.categories.bulkAdd(data.categories);
        if (data.positions && data.positions.length) await db.positions.bulkAdd(data.positions);
        if (data.positionSkills && data.positionSkills.length) await db.positionSkills.bulkAdd(data.positionSkills);
        if (data.questions && data.questions.length) await db.questions.bulkAdd(data.questions);
      });
      /* 题目已整包替换，被合并的重复题自然消失；这里只需把用户本地数据重定向到保留题 */
      await C.applyRemovedQuestions(data.removedQuestions);
      await DB.setSetting("cloudSyncedAt", data.publishedAt || 0);
    } finally { C._suppress--; }
  };

  /* ---------- 启动时自动同步（仅非编辑端） ----------
     规则：
     - 编辑端（有 Token）：跳过，本地为主
     - 曾同步过（cloudSyncedAt 存在）：云端有新版就自动更新
     - 全新访客（本次刚种入种子）：直接采用云端版本
     - 本机已有历史数据但从未同步：不自动覆盖（保护本地数据），
       返回 pending，由设置页/提示引导手动同步 */
  C.syncIfNeeded = async function (justSeeded) {
    if (C.isEditor()) return { skipped: true, reason: "editor" };
    /* 数据瘦身（20261005a）：指纹与本地一致时直接跳过，不下载 2.8MB 全量快照。
       仅在「曾同步过」时可用此捷径；首次访客仍走全量流程 */
    try {
      const local0 = await DB.getSetting("cloudSyncedAt");
      if (local0 != null) {
        const meta0 = await C.fetchMeta();
        if (meta0 && (meta0.publishedAt || 0) === (local0 || 0)) {
          return { skipped: true, reason: "upToDate", light: true };
        }
      }
    } catch (e) { /* 指纹判定失败不阻断，走原全量流程 */ }
    /* 首访（justSeeded）走 metaOnly：只拿题目元数据，答案交给懒加载 + 后台补齐。
       非首访（指纹变了的老访客）仍取完整数据——他们本机已有答案，缺一块反而不好。 */
    const data = await C.fetchSnapshot(false, justSeeded ? { metaOnly: true } : undefined);
    if (!data) {
      const st = C._lastFetch || {};
      /* 区分「云端没有快照」与「网络失败」：后者意味着访客可能只拿到本机种子库，
         必须让上层能感知（提示用户 + 安排重试），而不是静默按「无云端」处理 */
      if (!st.ok && st.reason !== "http404" && st.reason !== "http403") {
        return { failed: true, reason: "fetchFailed", detail: st.reason, attempts: st.attempts };
      }
      return { skipped: true, reason: "noCloud" };
    }
    const local = await DB.getSetting("cloudSyncedAt");
    const hasSynced = local != null;
    if ((data.publishedAt || 0) <= (local || 0)) return { skipped: true, reason: "upToDate" };
    if (!hasSynced && !justSeeded) {
      /* 上次全量拉取失败过的话，本机就是「清一色种子题」——没有需要保护的用户数据，
         直接采用云端版本（否则访客刷新多少次都停在 99 题，还得自己找到设置页）；
         确实存在用户自己的数据时才走 pending，让用户手动确认 */
      if (!(await C.looksUnseeded())) return { pending: true, count: (data.questions || []).length };
      await C.applyRemote(data);
      if (data._metaOnly) await C._markMetaOnly();   /* 答案待后台补齐 */
      return { applied: true, count: (data.questions || []).length, recovered: true, metaOnly: !!data._metaOnly };
    }
    await C.applyRemote(data);
    if (data._metaOnly) await C._markMetaOnly();     /* 答案待后台补齐 */
    return { applied: true, count: (data.questions || []).length, metaOnly: !!data._metaOnly };
  };

  /* metaOnly 写入后要做的两件事：标记待补齐 + 持久化「题号→分片」映射。
     映射必须落盘，否则刷新页面后懒加载找不到分片（详见 ensureQuestionBody 注释）。 */
  C._markMetaOnly = async function () {
    C._needHydrate = true;
    try {
      const map = {};
      for (const q of (C._manifestById ? Object.values(C._manifestById) : [])) {
        if (q && q._sh) map[q.id] = q._sh;
      }
      if (Object.keys(map).length) {
        await DB.setSetting("shardMap", map);
        C._shardMap = map;
      }
    } catch (e) { console.warn("[cloud] shardMap 持久化失败（详情页懒加载将退回后台补齐结果）", e && e.message); }
  };

  /* 手动立即同步（设置页按钮）：强制采用云端版本，覆盖本地题库 */
  C.syncNow = async function () {
    const data = await C.fetchSnapshot(true);
    if (!data) throw new Error("云端题库不存在或无法访问（" + ((C._lastFetch || {}).reason || "未知原因") + "）");
    await C.applyRemote(data);
    return data;
  };

  /* ---------- 首次访客题库不完整的判定与恢复（2026-09-13 P1 修复） ----------
     弱网下首次全量拉取失败，访客会停在本机 seed 的 99 道题却毫无察觉。
     判定「疑似只有种子库」：非编辑端 + 从未成功同步过（cloudSyncedAt 缺失）
     + 本机题数 ≤ SEED_ONLY_MAX 且**所有题的 source 都是 seed**。
     最后一条是关键护栏：只有「清一色种子题」才允许静默覆盖，用户自己导入/AI 生成的
     题目（source 为 import/ai/manual/URL…）一律视为真实数据，仍走 pending 让用户确认。 */
  C.looksUnseeded = async function () {
    if (C.isEditor()) return false;
    try {
      if ((await DB.getSetting("cloudSyncedAt")) != null) return false;
      const n = await DB.db.questions.count();
      if (!(n > 0 && n <= SEED_ONLY_MAX)) return false;
      const foreign = await DB.db.questions.filter(q => (q.source || "") !== "seed").count();
      return foreign === 0;
    } catch (e) { return false; }
  };

  C.recoverIncompleteSync = async function () {
    if (!(await C.looksUnseeded())) return { skipped: true, reason: "notSeedOnly" };
    const data = await C.fetchSnapshot(true);
    if (!data) return { failed: true, detail: (C._lastFetch || {}).reason || "" };
    await C.applyRemote(data);
    return { applied: true, count: (data.questions || []).length };
  };

  /* ---------- 编辑端增量吸收（2026-08-27） ----------
   * 编辑端不做全量覆盖（会冲掉本地未发布的改动），但云端自动扩充的新题
   * 也需要让编辑端及时看到——否则编辑端标题查重/发布统计都基于旧库。
   * 策略：启动时对比云端快照，只把「本机不存在的题目、分类、岗位」追加进来：
   * - 按 title 归一化判重 + ID 判重，双保险
   * - 已存在的题目/分类/岗位一概不动（保留本地编辑）
   * - 记录 absorbedRemoteAt，同一快照只吸一次
   */
  C.absorbRemote = async function (force) {
    const db = DB.db;
    /* NORM_VER：norm 规则变更（v2 改 Unicode 感知）后对老本地库强制重放一次吸收，
       修复旧版把中文标题剥空导致漏吸收的题 */
    const NORM_VER = 2;
    let run = !!force;
    try { if ((await DB.getSetting("absorbNormVer")) !== NORM_VER) run = true; } catch (_) {}
    const last = await DB.getSetting("absorbedRemoteAt") || 0;
    let rmApplied = 0;
    try { rmApplied = (await DB.getSetting("removedApplied")) || 0; } catch (_) {}
    /* 数据瘦身（20261005a）：指纹（publishedAt + rmCount 双字段严格相等）没变时，
       编辑端启动不再下载 2.8MB 全量快照。任一条件不确定 → 回退全量拉取走原逻辑 */
    if (!run && last > 0) {
      const meta0 = await C.fetchMeta();
      if (meta0 && (meta0.publishedAt || 0) === last && (meta0.rmCount || 0) === rmApplied) {
        return { added: 0, reason: "upToDate", light: true };
      }
    }
    const remote = await C.fetchRemote(false, { attempts: 2, timeout: 15000 });
    if (!remote || !Array.isArray(remote.questions)) return { added: 0, reason: "noCloud" };
    /* 重复题清理标记：云端 removedQuestions 条数与本机已应用的不一致时，即使快照时间戳没变也要跑一次 */
    const remoteRmCount = (remote.removedQuestions && typeof remote.removedQuestions === "object")
      ? Object.keys(remote.removedQuestions).length : 0;
    if (!run && remoteRmCount !== rmApplied) run = true;
    if (!run && (remote.publishedAt || 0) <= last) return { added: 0, reason: "upToDate" };

    const norm = s => String(s || "").toLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, "");   /* 保留 CJK 等文字与数字，仅剥空白/标点/符号 */
    let addedQ = 0;
    let restoredQ = 0;   /* 降质答案已自动恢复的题数 */
    /* 吸收期间抑制自动发布：吸收的内容本就来自云端，不能又整包推回去覆盖流水线数据 */
    C._suppress++;
    try {
      await db.transaction("rw", [db.categories, db.positions, db.positionSkills, db.questions], async () => {
        // 题目：title 归一化 + id 双重去重后追加
        const locals = await db.questions.toArray();
        const localIds = new Set(locals.map(q => q.id));
        const localTitles = new Set(locals.map(q => norm(q.title)));
        const newQuestions = remote.questions.filter(
          q => q && !localIds.has(q.id) && !localTitles.has(norm(q.title))
        );
        if (newQuestions.length) {
          await db.questions.bulkAdd(newQuestions);
          addedQ += newQuestions.length;
        }
        /* 降质答案自动恢复（2026-09-09）：本机某题的答案明显短于云端时，
           几乎只剩两种可能——① 本机是历史的降级/截断版本；② 用户刻意精简。
           默认按①处理（可用设置项关闭），取云端的完整版并把本机更大的浏览计数带过去。
           没有这一步，编辑端只能靠「手动从云端拉取」才能修复答案，十分反直觉。 */
        restoredQ = 0;
        if (C.autoRestoreEnabled()) {
          const localById = new Map(locals.map(q => [q.id, q]));
          const fixes = [];
          for (const rq of remote.questions) {
            const lq = localById.get(rq.id);
            if (!lq) continue;
            const la = String(lq.answer || "").length;
            const ra = String(rq.answer || "").length;
            if (ra > Math.max(la * 1.3, la + 120)) {
              const merged = Object.assign({}, rq);
              merged.views = Math.max(Number(rq.views) || 0, Number(lq.views) || 0);
              fixes.push(merged);
            }
          }
          if (fixes.length) {
            await db.questions.bulkPut(fixes);
            restoredQ = fixes.length;
          }
        }
        /* 岗位关联自动补齐（2026-09-09）：云端某题配的岗位比本机全时，按「并集」合并。
           没有这一步，流水线回填的岗位会在编辑端下次自动发布时被整包冲掉——
           题数没变少，发布守卫不会拦截。并集合并可保住本机人工配的岗位不被删。 */
        let posFixed = 0;
        if (C.autoRestoreEnabled()) {
          const rposName = {};
          (remote.positions || []).forEach(p => { if (p && p.id != null) rposName[p.id] = p.name; });
          const localById2 = new Map(locals.map(q => [q.id, q]));
          const posFixes = [];
          for (const rq of remote.questions) {
            const lq = localById2.get(rq.id);
            if (!lq) continue;
            const rIds = Array.isArray(rq.positionIds) ? rq.positionIds : [];
            if (!rIds.length) continue;
            const lIds = Array.isArray(lq.positionIds) ? lq.positionIds : [];
            /* 名称优先取云端岗位表，其次云端/本机题目上带的 positionNames */
            const nameOf = {};
            (rq.positionNames || []).forEach((n, idx) => { if (rIds[idx] != null) nameOf[rIds[idx]] = n; });
            (lq.positionNames || []).forEach((n, idx) => { if (lIds[idx] != null && !nameOf[lIds[idx]]) nameOf[lIds[idx]] = n; });
            const missing = rIds.filter(i => lIds.indexOf(i) < 0);
            const merged = lIds.concat(missing).filter(i => rposName[i] || nameOf[i]);
            const mergedNames = merged.map(i => rposName[i] || nameOf[i]);
            /* ids 与 names 都没变化才跳过（本机 names 为空的历史数据也要顺带补齐） */
            if (merged.join(",") === lIds.join(",") &&
                mergedNames.join(",") === (lq.positionNames || []).join(",")) continue;
            posFixes.push(Object.assign({}, lq, {
              positionIds: merged,
              positionNames: merged.map(i => rposName[i] || nameOf[i])
            }));
          }
          if (posFixes.length) {
            await db.questions.bulkPut(posFixes);
            posFixed = posFixes.length;
          }
        }
        C._lastPosFixed = posFixed;
        /* 同名分类就地合并（2026-09-10）：本地库对分类只做「并集吸收」，云端清理掉的
           重名重复分类不会被删，编辑端下次自动发布又会把整包推回云端，让清理白做。
           这里以云端为权威就地合并：题改挂保留项、技能关联重定向、移除多余条目。
           只在本地确实存在重名分类时执行，任何异常都不影响后续吸收。 */
        let catMerged = 0;
        try {
          const localCats = await db.categories.toArray();
          const byName = new Map();
          for (const c of localCats) {
            const k = String(c.name || "").trim();
            if (!k) continue;
            if (!byName.has(k)) byName.set(k, []);
            byName.get(k).push(c);
          }
          const dupGroups = [...byName.values()].filter(g => g.length > 1);
          if (dupGroups.length) {
            const skills = await db.positionSkills.toArray();
            const inCloud = new Set((remote.categories || []).map(c => c.id));
            const qCnt = {}, sCnt = {};
            for (const q of locals) { if (q.categoryId != null) qCnt[q.categoryId] = (qCnt[q.categoryId] || 0) + 1; }
            for (const s of skills) { if (s.categoryId != null) sCnt[s.categoryId] = (sCnt[s.categoryId] || 0) + 1; }
            const drop2keep = new Map();
            for (const group of dupGroups) {
              /* 保留优先级：云端仍在 > 被技能表引用 > 题多 > id 小 */
              const rank = c => [inCloud.has(c.id) ? 1 : 0, sCnt[c.id] ? 1 : 0, qCnt[c.id] || 0, -c.id];
              const sorted = group.slice().sort((a, b) => {
                const ra = rank(a), rb = rank(b);
                for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return rb[i] - ra[i];
                return 0;
              });
              for (let i = 1; i < sorted.length; i++) drop2keep.set(sorted[i].id, sorted[0].id);
            }
            if (drop2keep.size) {
              const movedQ = locals.filter(q => q.categoryId != null && drop2keep.has(q.categoryId))
                .map(q => Object.assign({}, q, { categoryId: drop2keep.get(q.categoryId) }));
              if (movedQ.length) await db.questions.bulkPut(movedQ);
              const movedS = skills.filter(s => s.categoryId != null && drop2keep.has(s.categoryId))
                .map(s => Object.assign({}, s, { categoryId: drop2keep.get(s.categoryId) }));
              if (movedS.length) await db.positionSkills.bulkPut(movedS);
              await db.categories.bulkDelete([...drop2keep.keys()]);
              catMerged = drop2keep.size;
            }
          }
        } catch (e) { catMerged = 0; }
        C._lastCatMerged = catMerged;
        // 分类：按 id 追加缺失的（空壳分类也能补齐树结构）
        const localCatIds = new Set((await db.categories.toArray()).map(c => c.id));
        const newCats = (remote.categories || []).filter(c => c && !localCatIds.has(c.id));
        if (newCats.length) { await db.categories.bulkAdd(newCats); }
        // 岗位：按 id 追加缺失的
        const localPosIds = new Set((await db.positions.toArray()).map(p => p.id));
        const newPositions = (remote.positions || []).filter(p => p && !localPosIds.has(p.id));
        if (newPositions.length) {
          await db.positions.bulkAdd(newPositions);
          // 同步补岗位技能表（该岗位下无技能才补）
          const skills = remote.positionSkills || [];
          const localSkillKeys = new Set((await db.positionSkills.toArray()).map(s => s.positionId + ":" + s.categoryId));
          const newSkills = skills.filter(s => s && !localSkillKeys.has(s.positionId + ":" + s.categoryId));
          if (newSkills.length) await db.positionSkills.bulkAdd(newSkills);
        }
      });
      /* 重复题清理：云端已合并的重复题，本机同样删掉并把用户本地数据重定向（在抑制发布期间执行，
         避免清理动作触发一次携带旧数据的自动发布） */
      const rmRes = await C.applyRemovedQuestions(remote.removedQuestions);
      await DB.setSetting("absorbedRemoteAt", remote.publishedAt || Date.now());
      await DB.setSetting("absorbNormVer", NORM_VER);
      await DB.setSetting("removedApplied", remoteRmCount);
      C._lastRemoved = rmRes;
    } finally { C._suppress--; }
    return { added: addedQ, restored: restoredQ, posFixed: C._lastPosFixed || 0, catMerged: C._lastCatMerged || 0,
             removed: (C._lastRemoved && C._lastRemoved.removed) || 0,
             remapped: (C._lastRemoved && C._lastRemoved.remapped) || 0 };
  };

  /* ---------- 本地 vs 云端 题量比对（2026-09-09） ----------
     用途：编辑端判断本机是否落后于云端快照，登录后人不用猜「怎么少了几百题」 */
  C.localVsRemote = async function () {
    const local = await DB.db.questions.count();
    let remote = null;
    try { remote = await C.fetchRemote(false, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS }); } catch (e) {}
    return {
      local: local,
      remote: remote && Array.isArray(remote.questions) ? remote.questions.length : null,
      publishedAt: remote ? (remote.publishedAt || 0) : 0
    };
  };

  /* ---------- 发布保护：禁止用更少的旧数据反向覆盖云端（2026-09-09） ----------
     事故复盘：本机题库停留在旧快照（834 题，且答案是降质短版）时，编辑端的
     自动/手动发布会把云端已恢复的 874 题整体砍回去，全程零提示。
     因此每次发布前先与云端快照比对题量：
       - 本地 < 云端 → 抛错拒绝发布，提示先「从云端拉取到本机」
       - 确实是删题场景 → 先拉取、在本地删，再发布（拉到本地再删不会触发本保护）
       - 例外：C.forceOnce() 可放行一次（保留给明确的强行覆盖场景） */
  C._forceOnce = false;
  C.forceOnce = function () { C._forceOnce = true; };
  C.guardAgainstShrink = async function (localCount) {
    if (C._forceOnce) { C._forceOnce = false; return null; }
    /* 数据瘦身（20261005a）：优先用指纹里的 count 比对，省一次 2.8MB 全量拉取；
       指纹不可用时回退全量快照（旧版行为） */
    const meta = await C.fetchMeta();
    if (meta && Number.isInteger(meta.count)) {
      if (meta.count > localCount) {
        return "本机 " + localCount + " 题 < 云端 " + meta.count + " 题（少 " + (meta.count - localCount) +
          " 题），已拒绝发布——直接用本机覆盖会把云端这些题删掉。" +
          "请先点「从云端拉取到本机」；确属删题场景，请先拉取，再在本机删除后发布。";
      }
      return null;
    }
    let remote = null;
    try { remote = await C.fetchRemote(true, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS }); } catch (e) {}
    if (!remote || !Array.isArray(remote.questions)) return null;   // 云端不可达时不阻断本地发布
    const rc = remote.questions.length;
    if (rc > localCount) {
      return "本机 " + localCount + " 题 < 云端 " + rc + " 题（少 " + (rc - localCount) +
        " 题），已拒绝发布——直接用本机覆盖会把云端这些题删掉。" +
        "请先点「从云端拉取到本机」；确属删题场景，请先拉取，再在本机删除后发布。";
    }
    return null;
  };

  /* ---------- 导出本地全量题库 ---------- */
  C.exportAll = async function () {
    const db = DB.db;
    const [categories, positions, positionSkills, questions] = await Promise.all([
      db.categories.toArray(), db.positions.toArray(), db.positionSkills.toArray(), db.questions.toArray()
    ]);
    /* 重复题映射必须随快照一起发布（2026-09-11 修复）：
       读取侧（applyRemovedQuestions / absorbRemote）一直都认这个字段，唯独发布侧漏了，
       于是编辑端每自动发布一次就把云端的映射整体抹掉。映射一没：被合并的重复题会被
       其它编辑端整包推回「题数不减、发布守卫拦不住」，用户本地的收藏/错题记录也会
       重新变成指向不存在题目的死记录。
       合并策略与 guardAgainstShrink 同源：以云端为底、叠加本机累积的 removedMap，
       只增不减；两端都读不到来源时干脆不写这个键，避免凭空造空对象覆盖云端。 */
    let merged = {};
    let haveSource = false;
    try {
      const remote = await C.fetchRemote(true, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS });
      if (remote && remote.removedQuestions && typeof remote.removedQuestions === "object") {
        merged = Object.assign(merged, remote.removedQuestions);
        haveSource = true;   /* 云端可达即以其为权威基线（含「确实为空」的情形） */
      }
    } catch (e) { /* 云端不可达：退化为只用本机累积，不阻断发布 */ }
    try {
      const local = await C.getRemovedMap();
      if (local && typeof local === "object" && Object.keys(local).length) {
        merged = Object.assign(merged, local);
        haveSource = true;
      }
    } catch (e) {}
    const out = {
      version: 1,
      publishedAt: Date.now(),
      categories: categories,
      positions: positions,
      positionSkills: positionSkills,
      questions: questions
    };
    if (haveSource) out.removedQuestions = merged;
    return out;
  };

  /* ---------- 发布到 GitHub（编辑端） ---------- */
  /* 同标签页串行化：手动发布与自动发布可能同时触发，排队避免并发 PUT 同一文件 */
  C._publishChain = Promise.resolve();
  C._publishInner = async function () {
    const data = await C.exportAll();
    /* 发布前保护：本机题量少于云端时直接拒绝，避免又一次「874 → 834」式砍库 */
    const guard = await C.guardAgainstShrink(data.questions.length);
    if (guard) { const ge = new Error(guard); ge.guardBlocked = true; throw ge; }
    const msg = "发布题库 " + new Date(data.publishedAt).toLocaleString("zh-CN") +
      "（" + data.questions.length + " 题 / " + data.positions.length + " 岗位）";
    /* 题库双推 release+main（与扩充流水线一致）：Pages 发布源是 release，
       此前编辑端默认只推 main，导致管理端的发布/删除从未出现在线上站点 */
    const branches = [...new Set(["release", "main", C.branch()])];
    for (const br of branches) {
      await C.putFile(FILE_PATH, JSON.stringify(data), msg, br);
      /* 同步发布 ~120B 版本指纹（20261005a 数据瘦身）：访客/编辑端启动据此跳过全量下载。
         失败不阻断发布主流程——指纹缺失时读取端自动回退全量拉取 */
      try { await C.putFile(C.META_PATH, C.metaOf(data), msg, br); }
      catch (e) { console.warn("version.json 发布失败（下次发布会重试）:", e); }
    }
    /* ⚠️ 2026-10-06新增：data/manifest.json 与 data/shards/*.json 是首屏优化的运行时依赖，
       它们由仓库侧 `python tools/split-published.py --write` 从 published.json 生成，
       **不会**被这里推送（一次 Contents API PUT 只能写一个文件，分片有6 个）。
       所以本机题库一旦发布，仓库里的分片就落后了。
       好在读取端有两道兜底：manifest 题数与 version.json 的 count 不一致即弃用 manifest，
       任一分片缺失也直接回退整包 —— 表现为「功能正常但首屏慢」，不会出错题。
       要恢复优化效果，在仓库执行：
         python tools/split-published.py --write && git add -A data/ && git commit -m "同步题库分片"
       详见 docs/性能诊断-20261006.md。 */
    await DB.setSetting("cloudSyncedAt", data.publishedAt);
    /* 不再在此显式调 Backup.publishBackup：cloudSyncedAt 落库会经 settings 表
       钩子让备份引擎 12 秒后自动接手，显式调用等于同一次改动备份两遍 */
    return { count: data.questions.length, positions: data.positions.length };
  };
  C.publish = async function () {
    const task = C._publishChain.then(() => C._publishInner());
    C._publishChain = task.then(() => {}, () => {});   // 单个失败不阻断后续排队
    return task;
  };

  /* ================= 自动发布引擎（v20260824a） ================= */

  C._dirty = false;
  unbindUnload();
  C._timer = 0;
  C._publishing = false;
  C._state = "idle";          // idle | dirty | publishing | error
  C._lastError = "";
  C._lastAutoAt = 0;
  C._listeners = [];

  C.state = () => C._state;
  C.isDirty = () => C._dirty;
  C.onChange = function (cb) { if (typeof cb === "function") C._listeners.push(cb); };
  C._emit = function () { C._listeners.slice().forEach(cb => { try { cb(C._state, C); } catch (e) {} }); C._renderChip(); };

  /* 脏标记：由 Dexie 表钩子或业务代码调用 */
  C.markDirty = function (reason) {
    if (!C.isEditor() || !C.autoEnabled()) return;
    if (C._suppress > 0) return;
    C._dirty = true;
    bindUnload();
    if (C._state !== "publishing") C._state = "dirty";
    C._schedule();
    C._emit();
  };

  C._schedule = function () {
    clearTimeout(C._timer);
    C._timer = setTimeout(() => C.autoPublish(), AUTO_DELAY);
  };

  C.autoPublish = async function () {
    if (!C._dirty || C._publishing || !C.isEditor() || !C.autoEnabled()) return;
    C._publishing = true;
    C._state = "publishing";
    C._emit();
    try {
      const r = await C.publish();
      C._dirty = false;
      unbindUnload();
      C._state = "idle";
      C._lastAutoAt = Date.now();
      C._lastError = "";
      try { U.toast("已自动发布 " + r.count + " 题到云端", "success"); } catch (e) {}
    } catch (e) {
      C._state = "error";
      C._lastError = String((e && e.message) || e);
      console.warn("自动发布失败", e);
      try { U.toast("自动发布失败：" + C._lastError + (e && e.guardBlocked ? "（本机落后于云端，请先拉取）" : "，稍后自动重试"), "error"); } catch (_) {}
      clearTimeout(C._timer);
      /* 保护性拒绝不重试：本机落后必须人工拉取，自动重试只会反复弹同一条错 */
      if (e && e.guardBlocked) { C._dirty = false; unbindUnload(); }
      else C._timer = setTimeout(() => C.autoPublish(), RETRY_DELAY);
    } finally {
      C._publishing = false;
      C._emit();
    }
  };

  /* Dexie 表钩子：监听题库核心表的所有写入（含导入/AI/管理端操作） */
  C.installHooks = function () {
    if (C._hooked || typeof Dexie === "undefined" || !DB || !DB.db) return;
    const db = DB.db;
    const hook = (t) => {
      if (!t || t.__autopub) return;
      t.__autopub = true;
      try {
        t.hook("creating", () => C.markDirty("create"));
        t.hook("updating", () => C.markDirty("update"));
        t.hook("deleting", () => C.markDirty("delete"));
      } catch (e) { console.warn("hook fail", e); }
    };
    [db.categories, db.positions, db.positionSkills, db.questions].forEach(hook);
    C._hooked = true;
  };

  /* 顶栏状态徽章 */
  C._renderChip = function () {
    const chip = document.getElementById("autopub-chip");
    if (!chip) return;
    if (!C.isEditor()) { chip.style.display = "none"; return; }
    chip.style.display = "";
    if (C._state === "publishing") { chip.className = "vis-chip autopub publishing"; chip.innerHTML = "⏳ 正在自动发布…"; }
    else if (C._state === "dirty") { chip.className = "vis-chip autopub dirty"; chip.innerHTML = "● 未发布 · 稍后自动上云"; }
    else if (C._state === "error") { chip.className = "vis-chip autopub error"; chip.title = C._lastError; chip.innerHTML = "⚠ 自动发布失败"; }
    else { chip.className = "vis-chip autopub ok"; chip.innerHTML = "✓ 已同步云端"; }
  };

  /* 初始化：编辑端启用钩子 + 徽章轮询（关页提醒改为按需绑定，见下） */
  C.initAuto = function () {
    if (C.isEditor() && C.autoEnabled()) C.installHooks();
    setInterval(() => C._renderChip(), 3000);   // topbar 重渲染后恢复徽章
    C._renderChip();
  };

  /* 关页前提醒：仅在「编辑端 + 自动发布已开 + 有未发布改动」时才挂 beforeunload 监听。
     之前无条件注册，会让每个访客（尤其是未登录用户）都触发 Chrome 的
     "[Violation] Permissions policy violation: unload is not allowed in this document" 告警。
     改为脏标记产生时才绑定、清理后立即解绑，正常访客与登录但未改动的访客都不会挂监听。 */
  /* 用 C._unloadBound 记录监听是否挂载（避免用外层 let 触发 TDZ：
     initAuto 定义在先，而 C._dirty 初始化时就会调用 unbindUnload） */
  function onBeforeUnload(e) {
    if (C._dirty && C.isEditor() && C.autoEnabled()) {
      e.preventDefault();
      e.returnValue = "题库有未发布的改动，关闭后将无法自动上云（下次打开会重试）。确定离开？";
      return e.returnValue;
    }
  }
  function bindUnload() {
    if (C._unloadBound || !C.isEditor() || !C.autoEnabled()) return;
    C._unloadBound = true;
    window.addEventListener("beforeunload", onBeforeUnload);
  }
  function unbindUnload() {
    if (!C._unloadBound) return;
    C._unloadBound = false;
    window.removeEventListener("beforeunload", onBeforeUnload);
  }

  if (typeof window !== "undefined") window.Cloud = C;
})();

;/* ===== << js/cloud.js ===== */

;/* ===== >> js/backup.js ===== */
/* =========================================================================
 *  backup.js  —  本地数据加密云备份（v20260825a）
 *  作用：把「只存在本机、清缓存即丢」的数据完整加密备份到 GitHub 仓库：
 *    - localStorage：发布 Token / 仓库分支 / AI Key 与配置 / 统计配置 / 主题
 *    - IndexedDB settings 表：管理员密码哈希等
 *    - IndexedDB favorites / histories / weakBank：收藏、浏览历史、薄弱题本
 *    - IndexedDB notes：题目「我的批注」（用户自己的理解笔记）
 *  安全：文件以 AES-256-GCM 加密（PBKDF2-SHA256 派生密钥，默认 600,000 迭代，
 *        旧备份 iter 字段缺失时回退 150,000 以保证向后兼容），仓库公开也只有密文；
 *        备份密码只存在本机 localStorage，清缓存后需凭记忆的密码恢复。
 *  位置：data/local-backup.json（与题库快照 data/published.json 并列）
 * ========================================================================= */
(function () {
  "use strict";

  const LS_PASS = "backup_passphrase";
  const FILE_PATH = "data/local-backup.json";
  const FILE_URL = "/" + FILE_PATH;

  /* 需要备份的 localStorage 键（云端发布 + AI + 统计 + 主题） */
  const LS_KEYS = [
    "gh_publish_token", "gh_publish_repo", "gh_publish_branch", "gh_autopublish",
    "stats_api", "stats_key",
    "it_hub_theme",
    "it_hub_ai_key", "it_hub_ai_base", "it_hub_ai_model", "it_hub_ai_store",
    "it_hub_ai_timeout", "it_hub_ai_temp", "it_hub_ai_max"
  ];

  const B = {};
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* ---------- base64 工具（Uint8Array <-> string） ---------- */
  function b64enc(u8) { let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function b64dec(str) { const s = atob(str); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; }

  /* ---------- 密钥派生：PBKDF2 -> AES-256-GCM ---------- */
  // iterations 默认 150000 以保证旧备份（无 iter 字段）向后兼容；新加密传 600000
  async function deriveKey(pass, salt, iterations = 150000) {
    const km = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  /* ---------- 备份密码 ---------- */
  B.hasPassphrase = () => !!(typeof localStorage !== "undefined" && localStorage.getItem(LS_PASS));
  B.getPassphrase = () => (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_PASS) || "") : "");
  B.setPassphrase = function (p) {
    if (typeof localStorage === "undefined") return;
    if (p) localStorage.setItem(LS_PASS, p);
    else localStorage.removeItem(LS_PASS);
  };

  /* ---------- 收集本地数据 ---------- */
  B.collect = async function () {
    const db = DB.db;
    const ls = {};
    LS_KEYS.forEach(k => {
      const v = (typeof localStorage !== "undefined") ? localStorage.getItem(k) : null;
      if (v != null) ls[k] = v;
    });
    const [settings, favorites, histories, weakBank, notes] = await Promise.all([
      db.settings.toArray(), db.favorites.toArray(), db.histories.toArray(), db.weakBank.toArray(),
      db.notes ? db.notes.toArray() : Promise.resolve([])
    ]);
    return {
      version: 1, savedAt: Date.now(),
      localStorage: ls,
      settings: settings, favorites: favorites, histories: histories, weakBank: weakBank,
      notes: notes
    };
  };

  /* ---------- 加密 / 解密 ---------- */
  B.encrypt = async function (plainObj, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ITER = 600000;
    const key = await deriveKey(pass, salt, ITER);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(plainObj)));
    return {
      v: 1, alg: "AES-256-GCM/PBKDF2-SHA256-600k",
      savedAt: plainObj.savedAt || Date.now(),
      iter: ITER,
      salt: b64enc(salt), iv: b64enc(iv), ciphertext: b64enc(new Uint8Array(ct))
    };
  };

  B.decrypt = async function (payload, pass) {
    if (!payload || payload.v !== 1 || !payload.ciphertext) throw new Error("备份文件格式不正确");
    const key = await deriveKey(pass, b64dec(payload.salt), payload.iter || 150000);
    let plain;
    try {
      plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64dec(payload.iv) }, key, b64dec(payload.ciphertext));
    } catch (e) { throw new Error("解密失败：备份密码不正确"); }
    return JSON.parse(dec.decode(plain));
  };

  /* ---------- 发布加密备份到 GitHub ----------
   * 双推 release + main + 配置分支（与题库发布一致）：恢复端 fetch 的是
   * 站点同源（Pages 发布分支）的副本，只写单一分支会让恢复读到过期或 404。 */
  B.publishBackup = async function () {
    if (!Cloud || !Cloud.token()) throw new Error("尚未配置发布 Token");
    const pass = B.getPassphrase();
    if (!pass) throw new Error("尚未设置备份密码");
    const payload = await B.encrypt(await B.collect(), pass);
    const branches = [...new Set(["release", "main", Cloud.branch()])];
    for (const br of branches) {
      await Cloud.putFile(FILE_PATH, JSON.stringify(payload),
        "备份本地数据（加密） " + new Date(payload.savedAt).toLocaleString("zh-CN"), br);
    }
    /* 写「备份时间」本身也是一次 settings 写入：不压制会被本模块自己的
       settings 表钩子当作数据变化再次拉起备份，形成自触发死循环 */
    B._suppress++;
    try { await DB.setSetting("backupAt", payload.savedAt); } catch (e) {} finally { B._suppress--; }
    return { savedAt: payload.savedAt };
  };

  /* ---------- 从云端恢复 ---------- */
  B.fetchBackup = async function () {
    const r = await fetch(FILE_URL + "?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("云端没有备份文件（HTTP " + r.status + "）");
    return await r.json();
  };

  B.restore = async function (pass) {
    const payload = await B.fetchBackup();
    const data = await B.decrypt(payload, pass);
    /* 1) localStorage */
    if (typeof localStorage !== "undefined" && data.localStorage) {
      Object.keys(data.localStorage).forEach(k => localStorage.setItem(k, data.localStorage[k]));
    }
    /* 2) IndexedDB：settings / favorites / histories / weakBank */
    const db = DB.db;
    B._suppress++;
    try {
    /* 批注表可能不存在（本模块先于 DB v4 升级加载的极端情况）→ 动态纳入事务表清单 */
    const rwTables = [db.settings, db.favorites, db.histories, db.weakBank];
    if (db.notes) rwTables.push(db.notes);
    await db.transaction("rw", rwTables, async () => {
      if (Array.isArray(data.settings)) await db.settings.bulkPut(data.settings);
      if (Array.isArray(data.favorites)) {
        await db.favorites.clear();
        if (data.favorites.length) await db.favorites.bulkAdd(data.favorites);
      }
      if (Array.isArray(data.histories)) {
        await db.histories.clear();
        if (data.histories.length) await db.histories.bulkAdd(data.histories);
      }
      if (Array.isArray(data.weakBank)) {
        await db.weakBank.clear();
        if (data.weakBank.length) await db.weakBank.bulkAdd(data.weakBank);
      }
      /* 批注：仅当备份里确实带了这个字段才覆盖，避免旧备份把现有批注清空 */
      if (db.notes && Array.isArray(data.notes)) {
        await db.notes.clear();
        if (data.notes.length) await db.notes.bulkAdd(data.notes);
      }
    });
    } finally { B._suppress--; }
    return {
      savedAt: data.savedAt || payload.savedAt || 0,
      settings: (data.settings || []).length,
      favorites: (data.favorites || []).length,
      histories: (data.histories || []).length,
      weakBank: (data.weakBank || []).length,
      notes: Array.isArray(data.notes) ? data.notes.length : 0,
      hasToken: !!(data.localStorage && data.localStorage.gh_publish_token)
    };
  };

  /* ---------- 自动备份引擎（v20260824b）：不依赖题目发布 ---------- */
  B._timer = 0; B._backing = false; B._suppress = 0;
  B._state = "idle";        // idle | dirty | backing | error
  B._lastError = ""; B._lastAt = 0;
  B._hooked = false; B._lsWrapped = false;
  const BACKUP_DELAY = 12000, BACKUP_RETRY = 90000;

  B.scheduleBackup = function () {
    if (!B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    B._state = "dirty"; B._emit();
    clearTimeout(B._timer);
    B._timer = setTimeout(() => B._runBackup(), BACKUP_DELAY);
  };

  B._emit = function () {
    try {
      const chip = document.getElementById("bk-chip");
      if (!chip) return;
      chip.style.display = "";
      if (B._state === "backing") { chip.textContent = "⏳ 备份中"; chip.className = "vis-chip bk backing"; }
      else if (B._state === "dirty") { chip.textContent = "● 待备份"; chip.className = "vis-chip bk dirty"; }
      else if (B._state === "error") { chip.textContent = "⚠ 备份失败"; chip.className = "vis-chip bk error"; chip.title = B._lastError; }
      else { chip.textContent = "✓ 已备云端"; chip.className = "vis-chip bk ok"; }
    } catch (e) {}
  };

  B._runBackup = async function () {
    if (B._backing || !B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    B._backing = true; B._state = "backing"; B._emit();
    try {
      await B.publishBackup();
      B._state = "idle"; B._lastAt = Date.now(); B._lastError = "";
      /* 成功不弹 toast：顶栏徽章已示「✓ 已备云端」，自动备份高频触发时弹窗纯属打扰 */
    } catch (e) {
      B._state = "error"; B._lastError = String((e && e.message) || e);
      console.warn("自动备份失败", e);
      clearTimeout(B._timer);
      B._timer = setTimeout(() => B._runBackup(), BACKUP_RETRY);
    } finally { B._backing = false; B._emit(); }
  };

  B.initAuto = function () {
    if (!B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    /* Dexie 钩子：设置 / 收藏 / 历史 任意增删改 */
    if (!B._hooked && typeof Dexie !== "undefined" && DB && DB.db) {
      const db = DB.db;
      const hook = (t) => {
        if (!t) return;
        try {
          t.hook("creating", () => { if (B._suppress <= 0) B.scheduleBackup(); });
          t.hook("updating", () => { if (B._suppress <= 0) B.scheduleBackup(); });
          t.hook("deleting", () => { if (B._suppress <= 0) B.scheduleBackup(); });
        } catch (e) {}
      };
      [db.settings, db.favorites, db.histories, db.weakBank, db.notes].filter(Boolean).forEach(hook);
      B._hooked = true;
    }
    /* 包装 localStorage.setItem：配置类键被写入时顺带备份 */
    if (!B._lsWrapped && typeof localStorage !== "undefined" && localStorage.setItem) {
      try {
        const _set = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (k, v) {
          const ret = _set(k, v);
          if (B._suppress <= 0 && LS_KEYS.indexOf(k) >= 0) B.scheduleBackup();
          return ret;
        };
        B._lsWrapped = true;
      } catch (e) { console.warn("无法包装 localStorage", e); }
    }
    B._emit();
  };

  if (typeof window !== "undefined") window.Backup = B;
})();

;/* ===== << js/backup.js ===== */
