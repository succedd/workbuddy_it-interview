#!/usr/bin/env node
/* =========================================================================
 *  tools/mobile-perf.mjs —— 移动端首屏性能实测（真实 Chrome + CDP，零外部依赖）
 * =========================================================================
 * 为什么需要它
 * ------------
 * 用户反馈「移动端首次加载有点慢」。但「慢」必须量化才能改对地方：
 * 桌面有线环境下 TTFB 1~6 秒由跨太平洋延迟主导，移动端则完全不同 ——
 * 4G 的 RTT 只有 50~150ms，真正的瓶颈变成了 **CPU 解析/执行 + 请求数量**。
 * 拿桌面数据猜移动端会改错方向，所以这里用真实 Chrome 模拟移动端测。
 *
 * 怎么模拟
 * --------
 * · 网络：CDP Network.emulateNetworkConditions，4G 档（下行 4Mbps / 上行 3Mbps / RTT 100ms）
 * · CPU ：CDP Emulation.setCPUThrottlingRate，降速 4 倍（约等于中端手机的算力）
 * · 设备：移动端 UA + 375×812 视口 + touch
 * 这三项叠加后测出来的才是移动端体感。
 *
 * 采集什么
 * --------
 * · FCP（首次内容绘制）—— 用户「看到东西」的时刻，最接近体感
 * · DCL / load
 * · 首屏脚本总数与总字节（按实际网络传输量，即压缩后）
 * · 请求完成时刻表，找出「谁在拖后腿」
 *
 * 用法
 * ----
 *   node tools/mobile-perf.mjs                 # 测 dist/（先用 build-pages.mjs 生成）
 *   node tools/mobile-perf.mjs --dir .         # 测仓库根目录
 *   node tools/mobile-perf.mjs --live          # 直接测线上站点
 *   node tools/mobile-perf.mjs --no-throttle   # 不降速（看重启后的绝对速度）
 * ========================================================================= */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const args = process.argv.slice(2);
const argOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const LIVE = args.includes("--live");
const NO_THROTTLE = args.includes("--no-throttle");
/* --block <pat,pat> ：按子串拦截这些请求，用来验证「某脚本对首屏是否真的必需」。
   做法是先拦掉再打开首页，若健康检查仍全绿，说明该脚本可以延后加载。 */
const BLOCK = (argOf("--block") || "").split(",").map((s) => s.trim()).filter(Boolean);
const SERVE_DIR = path.resolve(ROOT, argOf("--dir") || "dist");
const PORT = 8231;

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
];
const CHROME = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
if (!CHROME && !LIVE) { console.error("[FAIL] 未找到 Chrome"); process.exit(1); }

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain",
};

/* ---------- 1) 静态服务 ---------- */
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p === "/") p = "/index.html";
      const fp = path.join(SERVE_DIR, p);
      if (!fp.startsWith(SERVE_DIR) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end("404"); return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

/* ---------- 2) CDP 极简客户端 ---------- */
async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  });
  return {
    send(method, params) {
      const mid = ++id;
      return new Promise((res, rej) => {
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
        setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error("CDP timeout: " + method)); } }, 60000);
      });
    },
    on(fn) { listeners.push(fn); },
    close() { try { ws.close(); } catch (_) {} },
  };
}

/* ---------- 3) 主流程 ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let srv = null;
  let base = "https://itinterview.com.cn";
  if (!LIVE) { srv = await serve(); base = `http://127.0.0.1:${PORT}`; }

  const userDataDir = path.join(process.env.TEMP || "/tmp", "iti-perf-profile-" + Date.now());
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--remote-debugging-port=9333",
    "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-background-networking",
    "--user-data-dir=" + userDataDir,
    "about:blank",
  ], { stdio: "ignore" });

  /* 等 CDP 端口就绪 */
  let version = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const r = await fetch("http://127.0.0.1:9333/json/version");
      if (r.ok) { version = await r.json(); break; }
    } catch (_) {}
  }
  if (!version) { chrome.kill(); if (srv) srv.close(); console.error("[FAIL] Chrome CDP 未就绪"); process.exit(1); }

  const tab = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
  const cdp = await connectCdp(tab.webSocketDebuggerUrl);

  /* 收集网络与渲染数据 */
  const requests = new Map();
  const renderTimes = {};
  const jsErrors = [];
  const consoleErrors = [];
  cdp.on((msg) => {
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails || {};
      jsErrors.push((d.exception && (d.exception.description || d.exception.value)) || d.text || "unknown");
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push((msg.params.args || []).map((a) => a.value || a.description || "").join(" ").slice(0, 200));
    } else if (msg.method === "Network.requestWillBeSent") {
      const { requestId, request, type } = msg.params;
      requests.set(requestId, {
        url: request.url, type: type || "Other",
        start: msg.params.timestamp, encoded: 0, end: null, fromCache: false,
      });
    } else if (msg.method === "Network.responseReceived") {
      const r = requests.get(msg.params.requestId);
      if (r) {
        r.status = msg.params.response.status;
        r.mime = msg.params.response.mimeType;
        r.fromCache = !!msg.params.response.fromDiskCache;
        r.encoded = msg.params.response.encodedDataLength || 0;
      }
    } else if (msg.method === "Network.loadingFinished") {
      const r = requests.get(msg.params.requestId);
      if (r) { r.end = msg.params.timestamp; if (!r.encoded) r.encoded = msg.params.encodedDataLength || 0; }
    } else if (msg.method === "Page.loadEventFired") {
      renderTimes.load = Date.now();
    } else if (msg.method === "Page.domContentEventFired") {
      renderTimes.dcl = Date.now();
    }
  });

  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");

  /* 移动端模拟 */
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await cdp.send("Network.setUserAgentOverride", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  if (!NO_THROTTLE) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 100,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (3 * 1024 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  /* 拦截（用于「这个脚本首屏是否必需」的验证） */
  if (BLOCK.length) {
    await cdp.send("Network.setBlockedURLs", { urls: BLOCK.map((p) => "*" + p + "*") });
  }

  /* FCP 通过 PerformanceObserver 采集（在页面里注入，避免依赖 trace 解析） */
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__perf = { fcp: null, longTasks: 0 };
      try {
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) {
            if (e.name === "first-contentful-paint") window.__perf.fcp = Math.round(e.startTime);
          }
        }).observe({ type: "paint", buffered: true });
        new PerformanceObserver((l) => { window.__perf.longTasks += l.getEntries().length; })
          .observe({ type: "longtask", buffered: true });
      } catch (e) {}
    `,
  });

  /* 等首屏出现「实质内容」。
     ⚠️ 判定必须同时满足两个条件（2026-10-07 修正）：
     ① #boot-loader 开场动画已结束（done class 或已隐藏）——
        这个动画首访强制播 3.2s，上面的职业名滚动文字 + 进度文本加起来
        就有 600+ 字符，曾经把「内容就绪」判定骗成「动画出现」的时间；
     ② #main 里出现了真实的卡片/链接（不是转圈空壳）。 */
  async function waitForContent(maxMs) {
    const t = Date.now();
    while (Date.now() - t < maxMs) {
      try {
        const r = await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const loader = document.getElementById("boot-loader");
            const loaderDone = !loader || loader.classList.contains("done") || loader.style.display === "none";
            const txt = (document.body.innerText || "").replace(/\\s+/g, "");
            const cards = document.querySelectorAll("#main .card, #main a[href^='#/'], #main .docs-dir-card, #main a[href^='#/question/']").length;
            return JSON.stringify({ loaderDone: loaderDone, len: txt.length, cards: cards, head: txt.slice(0, 120) });
          })()`, returnByValue: true,
        });
        const d = JSON.parse(r.result.value || "{}");
        if (d.loaderDone && d.cards > 5) return { ms: Date.now() - t, ...d };
      } catch (_) {}
      await sleep(300);
    }
    /* 超时：取当前状态用于诊断 */
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `(() => { const t=(document.body.innerText||"").replace(/\\s+/g,"");
          const loader=document.getElementById("boot-loader");
          return JSON.stringify({loaderDone: !loader || loader.classList.contains("done") || loader.style.display==="none",
            len:t.length,cards:document.querySelectorAll("#main .card,#main a[href^='#/']").length,head:t.slice(0,150)}); })()`,
        returnByValue: true,
      });
      return { ms: -1, ...JSON.parse(r.result.value || "{}") };
    } catch (_) { return { ms: -1, len: 0, cards: 0, head: "" }; }
  }

  const t0 = Date.now();
  await cdp.send("Page.navigate", { url: base + "/" });

  /* 等 load 或最多 45 秒 */
  const deadline = Date.now() + 45000;
  let loaded = false;
  while (Date.now() < deadline) {
    await sleep(250);
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: "document.readyState", returnByValue: true,
      });
      if (r.result.value === "complete") { loaded = true; break; }
    } catch (_) {}
  }
  const tLoad = Date.now() - t0;

  /* 关键体感指标：从导航到「首屏真的出现内容」用了多久 */
  const content = await waitForContent(25000);

  /* 再等一会，让 FCP / longtask 收集完 */
  await sleep(1200);
  let fcp = null, longTasks = 0, scriptCount = 0, totalBytes = 0, scriptBytes = 0;
  try {
    const r = await cdp.send("Runtime.evaluate", {
      expression: "JSON.stringify(window.__perf || {})", returnByValue: true,
    });
    const p = JSON.parse(r.result.value || "{}");
    fcp = p.fcp; longTasks = p.longTasks || 0;
  } catch (_) {}

  /* 渲染后统计：DOM 里 script 标签数、以及网络层的脚本字节 */
  try {
    const r = await cdp.send("Runtime.evaluate", {
      expression: "document.querySelectorAll('script[src]').length", returnByValue: true,
    });
    scriptCount = r.result.value || 0;
  } catch (_) {}

  const rows = [...requests.values()].filter((r) => !/^data:/.test(r.url));
  for (const r of rows) {
    totalBytes += r.encoded || 0;
    if (/\.js(\?|$)/.test(r.url) || r.type === "Script") scriptBytes += r.encoded || 0;
  }


  /* 启动阶段打点（app.js 里的 performance.mark），把「等待」定位到具体阶段 */
  let marks = [];
  try {
    const r = await cdp.send("Runtime.evaluate", {
      expression: `JSON.stringify(performance.getEntriesByType("mark")
        .filter(m => /^boot:/.test(m.name))
        .map(m => ({ n: m.name, t: Math.round(m.startTime) })))`,
      returnByValue: true,
    });
    marks = JSON.parse(r.result.value || "[]");
  } catch (_) {}

  /* 按耗时排序，找最慢的请求 */
  const dur = (r) => (r.end && r.start ? (r.end - r.start) * 1000 : 0);
  const slowest = rows.slice().sort((a, b) => dur(b) - dur(a)).slice(0, 12);

  /* ---------- 输出 ---------- */
  const short = (u) => {
    try { const x = new URL(u); return (x.pathname + x.search).replace(/^\//, "") || "/"; }
    catch (_) { return u; }
  };
  const fmt = (ms) => (ms == null ? "  n/a" : (ms / 1000).toFixed(2) + "s");

  console.log("=".repeat(74));
  console.log("移动端首屏实测" + (NO_THROTTLE ? "（未限速）" : "（4G + CPU×4 降速 / 375×812）"));
  console.log("目标:", LIVE ? base : base + "  ← " + SERVE_DIR);
  console.log("=".repeat(74));
  console.log("");
  console.log("  FCP（首次内容绘制）  :", fmt(fcp));
  console.log("  长任务数（>50ms）    :", longTasks);
  console.log("  页面 load 完成       :", fmt(tLoad));
  console.log("  首屏内容就绪         :", content.ms < 0
    ? "❌ 25 秒内未出现实质内容（正文仅 " + content.len + " 字，卡片 " + content.cards + " 个）"
    : fmt(content.ms) + "  （" + content.len + " 字 / " + content.cards + " 卡片）");
  if (content.ms < 0) console.log("      正文开头片段: " + JSON.stringify(content.head || ""));
  console.log("");
  console.log("  DOM 中 script[src]   :", scriptCount);
  console.log("  请求总数             :", rows.length);
  console.log("  总传输量             :", (totalBytes / 1024).toFixed(0), "KB");
  console.log("  其中 JS              :", (scriptBytes / 1024).toFixed(0), "KB");
  console.log("");
  console.log("  最慢的 12 个请求：");
  for (const r of slowest) {
    console.log("    " + fmt(dur(r)).padStart(7) + "  " +
      String(r.encoded || 0).padStart(7) + "B  " + (r.type || "").padEnd(10) + " " + short(r.url).slice(0, 62));
  }
  console.log("");

  /* 按类型汇总，指出最大的那块 */
  const byType = {};
  for (const r of rows) {
    const k = r.type || "Other";
    byType[k] = byType[k] || { n: 0, b: 0 };
    byType[k].n++; byType[k].b += r.encoded || 0;
  }
  console.log("  按类型汇总：");
  for (const [k, v] of Object.entries(byType).sort((a, b) => b[1].b - a[1].b)) {
    console.log("    " + k.padEnd(14) + String(v.n).padStart(4) + " 个  " + (v.b / 1024).toFixed(0).padStart(6) + " KB");
  }
  console.log("");

  /* 启动阶段分解 —— 直接指出「首屏那段空等」属于哪个环节 */
  if (marks.length > 1) {
    console.log("  启动阶段分解（performance.mark）：");
    let prev = marks[0];
    console.log("    " + (marks[0].t / 1000).toFixed(2).padStart(7) + "s  " + marks[0].n);
    for (let i = 1; i < marks.length; i++) {
      const d = marks[i].t - prev.t;
      console.log("    " + (marks[i].t / 1000).toFixed(2).padStart(7) + "s  " +
        marks[i].n + (d > 300 ? "   ← 耗时 " + (d / 1000).toFixed(2) + "s" : ""));
      prev = marks[i];
    }
    console.log("");
  }

/* 页面级健康检查函数：同一套断言用于首页与内页。
     为什么必须查内页 —— 本次改动会把「详情页/教程页才用到的脚本」延后，
     只验首页会漏掉「页面能开但功能坏了」这类回归。 */
  async function healthOf(label) {
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const g = (n) => typeof window[n] !== "undefined";
          const q = (s) => document.querySelectorAll(s).length;
          return JSON.stringify({
            title: document.title,
            globals: { App: g("App"), Services: g("Services"), DB: g("DB"),
                       Cloud: g("Cloud"), U: g("U"), DocsLoader: g("DocsLoader") },
            导航链接: q("a[href^='#/']"),
            卡片: q(".q-card, .stat, .card, .docs-dir-card"),
            可见文本长度: (document.body.innerText || "").replace(/\\s+/g, "").length,
          });
        })()`,
        returnByValue: true,
      });
      const h = JSON.parse(r.result.value || "{}");
      h._label = label;
      return h;
    } catch (e) { return { _label: label, _error: e.message }; }
  }

  function reportHealth(h, extra) {
    const gl = h.globals || {};
    const missing = Object.keys(gl).filter((k) => !gl[k]);
    const textLen = h.可见文本长度 || 0;
    const nav = h.导航链接 || 0;
    console.log("  【" + h._label + "】");
    console.log("    标题         :", h.title || "(空)");
    console.log("    关键全局对象 :", missing.length ? "缺失 " + missing.join(",") + "  ❌" : "全部就绪 ✅");
    console.log("    导航链接     :", nav, nav > 5 ? "✅" : "❌");
    console.log("    可见文本长度 :", textLen, textLen > 200 ? "✅" : "❌ 疑似空白");
    if (extra) console.log("    " + extra.k + " :", extra.v, extra.ok ? "✅" : "❌");
    console.log("");
    return { ok: missing.length === 0 && textLen > 200 && nav > 5, missing, textLen, nav };
  }

  const checks = [];

  /* 路由到内页（hash 路由，SPA 不重新加载） */
  async function goto(hash, waitMs) {
    try {
      await cdp.send("Runtime.evaluate", { expression: `location.hash = ${JSON.stringify(hash)}` });
      await sleep(waitMs || 3500);
    } catch (_) {}
  }

  /* ---------- 首页 ---------- */
  const homeH = await healthOf("首页");
  checks.push(reportHealth(homeH));

  /* ---------- 题目详情页（验证 marked/purify/highlight 是否被误伤） ---------- */
  const firstQid = await (async () => {
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const a = document.querySelector("a[href^='#/question/']");
          return a ? a.getAttribute("href").split("/").pop() : "";
        })()`, returnByValue: true,
      });
      return r.result.value || "";
    } catch (_) { return ""; }
  })();
  if (firstQid) {
    await goto("#/question/" + firstQid);
    /* 答案正文轮询等待：首访只拉了元数据，答案靠「详情页懒加载 + 后台补齐」补上，
       需要给它一点时间。这里最多等 10 秒，用来验证「答案最终一定会到」，
       而不是卡在「点开的那一瞬间还没到」——后者是设计上的渐进加载，不是缺陷。 */
    let ansLen = 0, waited = 0;
    while (waited < 10000) {
      try {
        const r = await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const el = document.querySelector(".qd-answer, #answer-box, .answer, .md");
            return el ? (el.innerText || "").replace(/\\s+/g, "").length : 0;
          })()`, returnByValue: true,
        });
        ansLen = r.result.value || 0;
        /* 「答案正在从云端载入…」这句占位文案约 30 字，真答案远不止 */
        if (ansLen > 60) break;
      } catch (_) {}
      await sleep(500); waited += 500;
    }
    const qh = await healthOf("题目详情页 #" + firstQid);
    checks.push(reportHealth(qh, { k: "答案正文长度", v: ansLen, ok: ansLen > 60 }));
  } else {
    console.log("  【题目详情页】跳过：首页未找到题目链接\n");
  }

  /* ---------- 技术教程页（验证 docs-loader 按需加载真的生效） ---------- */
  await goto("#/docs", 6000);
  const docsH = await healthOf("技术教程页");
  let docDirs = 0;
  try {
    const r = await cdp.send("Runtime.evaluate", {
      expression: `(() => { window.__docsReady = !!window.DOCS; return window.DOCS && window.DOCS.dirs ? window.DOCS.dirs.length : 0; })()`,
      returnByValue: true,
    });
    docDirs = r.result.value || 0;
  } catch (_) {}
  checks.push(reportHealth(docsH, { k: "加载出的技术方向数", v: docDirs, ok: docDirs >= 6 }));

  /* ---------- 第二次访问（同一 profile，IndexedDB 已有数据） ----------
     这一轮很关键：分片/指纹机制的价值几乎全在回访者身上
     （「指纹没变 → 不下载」「分片已缓存 → 不重复取」）。
     只测首访会看不出这些改动到底有没有用，也测不出「回访反而变慢」的回归。 */
  const before2 = requests.size;
  const t2 = Date.now();
  await cdp.send("Page.navigate", { url: base + "/" });
  const content2 = await waitForContent(25000);
  const t2Load = Date.now() - t2;
  /* 第二次访问期间新发出的请求 */
  const newReqs = [...requests.values()].slice(before2).filter((r) => !/^data:/.test(r.url));
  const newBytes = newReqs.reduce((a, r) => a + (r.encoded || 0), 0);

  console.log("  ── 第二次访问（同一个浏览器配置，本机已有数据）──");
  console.log("    首屏内容就绪 :", content2.ms < 0 ? "❌ 未出现" : fmt(content2.ms));
  console.log("    load 完成    :", fmt(t2Load));
  console.log("    本轮新请求数 :", newReqs.length, " 传输量 " + (newBytes / 1024).toFixed(0) + " KB");
  const dataNew = newReqs.filter((r) => /data\/(published|manifest|shards)/.test(r.url));
  console.log("    题库数据请求 :", dataNew.length === 0
    ? "0 个（指纹没变，直接跳过下载 ✅）"
    : dataNew.length + " 个  " + dataNew.map((r) => r.url.split("/").pop().split("?")[0]).join(", "));
  console.log("");

  const errs = jsErrors.length + consoleErrors.length;
  console.log("  运行时报错总数 :", errs === 0 ? "无 ✅" : errs + " 条 ❌");
  for (const e of jsErrors.slice(0, 4)) console.log("      [JS] " + String(e).split("\n")[0].slice(0, 110));
  for (const e of consoleErrors.slice(0, 4)) console.log("      [console] " + e.slice(0, 110));
  console.log("");

  const allOk = checks.every((c) => c.ok) && errs === 0;
  if (!allOk) {
    console.log("  ⚠️ 健康检查未通过 —— 性能数字再好看也说明页面是坏的。");
    console.log("");
  }

  cdp.close();
  chrome.kill();
  if (srv) srv.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  if (!allOk) process.exit(2);
}

main().catch((e) => { console.error("[ERROR]", e.message); process.exit(1); });
