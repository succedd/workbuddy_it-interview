#!/usr/bin/env node
/* =========================================================================
 *  tools/profile-startup.mjs —— 定位「首屏内容就绪」慢在哪个函数（CDP 采样 profiler）
 * =========================================================================
 * 为什么需要它
 * ------------
 * 实测：移动端限速下首屏内容 23.8s 才出现，**不限速也要 11.7s** ——
 * 说明瓶颈不在网络下载，而在 JS 执行。但「JS 慢」太笼统，改错地方会白费功夫。
 * 这里用 V8 的采样 profiler 把 CPU 时间按函数聚合，直接指出热点。
 *
 * 用法
 *   node tools/profile-startup.mjs            # 测 dist/
 *   node tools/profile-startup.mjs --no-throttle
 * ========================================================================= */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SERVE_DIR = path.resolve(ROOT, "dist");
const PORT = 8233;
const NO_THROTTLE = process.argv.includes("--no-throttle");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error("[FAIL] 未找到 Chrome"); process.exit(1); }

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".xml": "application/xml", ".txt": "text/plain",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    } else if (m.method) {
      for (const h of handlers) h(m);
    }
  });
  return {
    on(fn) { handlers.push(fn); },
    send(method, params) {
      const mid = ++id;
      return new Promise((res, rej) => {
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
        setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error("timeout " + method)); } }, 90000);
      });
    },
  };
}

async function main() {
  const srv = await serve();
  const userDataDir = path.join(process.env.TEMP || "/tmp", "iti-prof-" + Date.now());
  const chrome = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=9335",
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--user-data-dir=" + userDataDir, "about:blank",
  ], { stdio: "ignore" });

  let ver = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try { const r = await fetch("http://127.0.0.1:9335/json/version"); if (r.ok) { ver = await r.json(); break; } } catch (_) {}
  }
  if (!ver) { chrome.kill(); srv.close(); console.error("[FAIL] CDP 未就绪"); process.exit(1); }

  const tab = await (await fetch("http://127.0.0.1:9335/json/new?about:blank", { method: "PUT" })).json();
  const cdp = await connectCdp(tab.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Profiler.enable");

  /* 网络时间线：定位「等待」发生在哪个请求。CPU 只占 1.1s 而墙钟 11.5s，
     说明绝大部分时间在等 I/O —— 必须看清是等网络还是等 IndexedDB。 */
  const netReq = new Map();
  const timeline = [];
  const tNav = { t: 0 };
  cdp.on((m) => {
    if (!tNav.t) return;
    const rel = (Date.now() - tNav.t) / 1000;
    if (m.method === "Network.requestWillBeSent") {
      const u = m.params.request.url.replace(/^https?:\/\/[^/]+/, "");
      if (/^\/($|index\.html)/.test(u)) return;
      netReq.set(m.params.requestId, u);
      timeline.push({ t: rel, k: "req", s: u });
    } else if (m.method === "Network.loadingFinished") {
      const u = netReq.get(m.params.requestId);
      if (u) timeline.push({ t: rel, k: "fin", s: u, bytes: m.params.encodedDataLength });
    }
  });

  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  if (!NO_THROTTLE) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 100,
      downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  /* 采样精度：100µs，能看清细碎函数 */
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  await cdp.send("Profiler.start");

  const t0 = Date.now();
  tNav.t = t0;
  await cdp.send("Page.navigate", { url: "http://127.0.0.1:" + PORT + "/" });

  /* 等到首屏内容真的出现（与 mobile-perf 同一判据） */
  let contentMs = -1;
  while (Date.now() - t0 < 40000) {
    await sleep(300);
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `(() => { const t=(document.body.innerText||"").replace(/\\s+/g,"");
          return JSON.stringify({len:t.length,cards:document.querySelectorAll(".q-card,.stat,.card").length}); })()`,
        returnByValue: true,
      });
      const d = JSON.parse(r.result.value || "{}");
      if (d.len > 600 || d.cards > 3) { contentMs = Date.now() - t0; break; }
    } catch (_) {}
  }

  const prof = await cdp.send("Profiler.stop");

  /* ---------- 聚合：按「函数名 @ 文件:行」累计命中次数（≈CPU 时间占比） ---------- */
  const nodes = new Map();
  for (const n of prof.profile.nodes) nodes.set(n.id, n);

  const selfHits = new Map();
  for (const id of prof.profile.samples || []) {
    const n = nodes.get(id);
    if (!n) continue;
    const cf = n.callFrame || {};
    const url = (cf.url || "").replace(/^https?:\/\/[^/]+/, "");
    const key = (cf.functionName || "(anonymous)") + " @ " + url + ":" + (cf.lineNumber + 1);
    selfHits.set(key, (selfHits.get(key) || 0) + 1);
  }

  const total = [...selfHits.values()].reduce((a, b) => a + b, 0) || 1;
  const sorted = [...selfHits.entries()].sort((a, b) => b[1] - a[1]);

  console.log("=".repeat(78));
  console.log("启动性能采样剖析" + (NO_THROTTLE ? "（未限速）" : "（4G + CPU×4）"));
  console.log("首屏内容就绪:", contentMs < 0 ? "❌ 40 秒未出现" : (contentMs / 1000).toFixed(2) + "s");
  console.log("采样总命中:", total, "（≈" + total + " × 100µs ≈ " + (total / 10000).toFixed(1) + "s CPU）");
  console.log("=".repeat(78));
  console.log("");
  console.log("CPU 占比最高的 25 个函数（自身耗时，不含子调用）：");
  console.log("");
  for (const [k, v] of sorted.slice(0, 25)) {
    const pct = (v / total * 100).toFixed(1).padStart(5);
    console.log("  " + pct + "%  " + k.slice(0, 92));
  }
  console.log("");

  /* 按文件汇总，指出「哪个文件最该动」 */
  const byFile = new Map();
  for (const [k, v] of selfHits) {
    const m = k.match(/ @ (.*?):(\d+)$/);
    const f = m ? m[1].replace(/:\d+$/, "") : "(native)";
    byFile.set(f, (byFile.get(f) || 0) + v);
  }
  console.log("按文件汇总：");
  for (const [f, v] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log("  " + (v / total * 100).toFixed(1).padStart(5) + "%  " + (f || "(native)").slice(0, 70));
  }
  console.log("");

  /* ---------- 网络时间线：看「等待」落在哪一段 ---------- */
  console.log("=".repeat(78));
  console.log("网络时间线（相对导航，秒）——用于定位「等待」发生在哪");
  console.log("=".repeat(78));
  const dataReqs = timeline.filter((e) => e.k === "req" && /\.(json|js)(\?|$)/.test(e.s));
  for (const e of timeline.slice(0, 60)) {
    const mark = e.k === "req" ? "→ 请求" : "← 完成";
    const extra = e.bytes != null ? "  " + e.bytes + "B" : "";
    console.log("  " + e.t.toFixed(2).padStart(6) + "s  " + mark + "  " + e.s.slice(0, 58) + extra);
  }
  if (timeline.length > 60) console.log("  …（省略 " + (timeline.length - 60) + " 条）");
  console.log("");

  /* 数据类请求（题库/指纹/分片）单独列出 —— 首屏最可能的等待源 */
  console.log("数据类请求（题库 / 指纹 / 分片）：");
  const dreq = timeline.filter((e) => e.k === "fin" && /data\//.test(e.s));
  if (!dreq.length) console.log("  （无）");
  for (const e of dreq) console.log("  " + e.t.toFixed(2).padStart(6) + "s  完成  " + e.s.slice(0, 60) + "  " + (e.bytes || 0) + "B");
  console.log("");

  cdp.close?.();
  chrome.kill(); srv.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
}

main().catch((e) => { console.error("[ERROR]", e.message); process.exit(1); });
