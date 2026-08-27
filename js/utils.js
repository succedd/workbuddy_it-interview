/* =========================================================================
 *  utils.js  —  通用工具与 UI 基础组件（图标 / Toast / Modal）
 * ========================================================================= */
(function () {
  "use strict";
  const U = {};

  /* ---------- 图标（内联 SVG，stroke 用 currentColor） ---------- */
  const P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  U.ICONS = {
    search: `<svg class="ic" viewBox="0 0 24 24" ${P}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
    home: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    bookmark: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M6 4h12v16l-6-4-6 4z"/></svg>`,
    bookmarkFill: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4z"/></svg>`,
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
    link: `<svg class="ic" viewBox="0 0 24 24" ${P}><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>`
  };
  U.icon = function (name) { return U.ICONS[name] || ""; };

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
      return window.DOMPurify ? DOMPurify.sanitize(html) : html;
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

  /* ---------- Toast ---------- */
  U.toast = function (msg, type, timeout) {
    type = type || "info";
    const root = document.getElementById("toast-root");
    if (!root) return;
    const ic = type === "success" ? U.icon("check") : type === "warn" ? U.icon("alert") : type === "error" ? U.icon("alert") : U.icon("info");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `<span class="t-ic">${ic}</span><span class="t-msg">${U.esc(msg)}</span><span class="t-close">${U.icon("x")}</span>`;
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 250); };
    el.querySelector(".t-close").onclick = close;
    root.appendChild(el);
    setTimeout(close, timeout || 3000);
  };

  /* ---------- Modal ---------- */
  U.modal = function (opts) {
    opts = opts || {};
    const root = document.getElementById("modal-root");
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    const wide = opts.wide ? " wide" : "";
    mask.innerHTML = `<div class="modal${wide}">
      <div class="modal-head"><h3>${U.esc(opts.title || "")}</h3><button class="icon-btn" data-close>${U.icon("x")}</button></div>
      <div class="modal-body">${opts.body || ""}</div>
      ${opts.footer !== false ? '<div class="modal-foot"></div>' : ""}
    </div>`;
    root.appendChild(mask);
    const modalEl = mask.querySelector(".modal");
    const close = () => { mask.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape" && opts.closable !== false) close(); };
    mask.querySelector("[data-close]").onclick = () => { if (opts.closable !== false) close(); };
    mask.addEventListener("click", e => { if (e.target === mask && opts.closable !== false) close(); });
    document.addEventListener("keydown", onKey);
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

  /* ---- 第三方大库按需加载（echarts / xlsx 首屏不再全量下载） ---- */
  const _scriptCache = {};
  U.loadScript = function (name, url) {
    if (window[name]) return Promise.resolve(window[name]);
    if (_scriptCache[name]) return _scriptCache[name];
    _scriptCache[name] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url; s.async = true;
      s.onload = () => resolve(window[name]);
      s.onerror = () => { delete _scriptCache[name]; reject(new Error("脚本加载失败：" + name)); };
      document.head.appendChild(s);
    });
    return _scriptCache[name];
  };
  U.ECHARTS_URL = "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js";
  U.XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

  window.U = U;
})();
