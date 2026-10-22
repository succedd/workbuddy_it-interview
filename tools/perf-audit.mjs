#!/usr/bin/env node
/**
 * 首屏性能实测（2026-10-22）
 * 用本机 Chrome + CDP 在移动端 4G / 4x CPU 降速下测首页、题目列表、题目详情。
 * 指标：FCP / LCP / CLS / TBT(>50ms longtask 总和) / DCL / Load / 资源传输量 / 最大资源。
 *
 * 用法：
 *   node tools/perf-audit.mjs                 # 每页 1 次，移动端 4G
 *   node tools/perf-audit.mjs --runs=3        # 每页 3 次，输出中位数
 *   node tools/perf-audit.mjs --desktop       # 桌面视口，不降 CPU
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const RUNS = Math.max(1, parseInt((process.argv.find(a => a.startsWith("--runs=")) || "").split("=")[1] || "1", 10));
const DESKTOP = process.argv.includes("--desktop");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9388 + Math.floor(Math.random() * 100);
const OUT = path.join(ROOT, "docs", "perf-audit.json");
const BASE = (process.env.PERF_BASE || "https://itinterview.com.cn").replace(/\/$/, "");
const cases = [
  { name: "home", url: BASE + "/?perf=1" },
  { name: "questions", url: BASE + "/#/questions" },
  { name: "question-detail", url: BASE + "/#/question/1" },
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function chromeLaunch() {
  return spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-crash-reporter",
    "--disable-breakpad", "--remote-debugging-port=" + PORT, "--remote-allow-origins=*",
    "--no-first-run", "--no-default-browser-check",
    "--user-data-dir=/tmp/perf-chrome-" + Date.now(),
  ], { stdio: "ignore" });
}
async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      if (v) break;
    } catch (_) { await sleep(200); }
  }
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
    setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error("timeout " + method)); } }, 90000);
  });
  return { ws, send };
}
const observer = `window.__perf = { lcp: null, cls: 0, longtasks: [], events: [], fcp: 0 };
try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.lcp = { start: e.startTime, size: e.size, tag: e.element && e.element.tagName, id: e.element && e.element.id, text: e.element && (e.element.innerText || "").slice(0, 80) }; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) {}
try { new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.longtasks.push(e.duration); }).observe({ type: "longtask", buffered: true }); } catch (e) {}
try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.events.push(e.duration); }).observe({ type: "event", buffered: true }); } catch (e) {}
try { new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.name === "first-contentful-paint") window.__perf.fcp = e.startTime; }).observe({ type: "paint", buffered: true }); } catch (e) {}`;
async function measure(url) {
  const chrome = chromeLaunch();
  const { ws, send } = await connect();
  try {
    await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Performance.enable");
    /* 线上 Worker 会拦截 HeadlessChrome UA，测速必须伪装成正常 Chrome */
    await send("Network.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8", platform: "MacIntel" });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: observer });
    if (!DESKTOP) {
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
      await send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, connectionType: "cellular4g" });
      await send("Emulation.setCPUThrottlingRate", { rate: 4 });
    } else {
      await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    }
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    const t0 = Date.now();
    await send("Page.navigate", { url });
    /* 等到 #main 有内容或 20s；避免只测到 boot/403 页 */
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        const ok = await send("Runtime.evaluate", { expression: `!!document.querySelector("#main") && (document.querySelector("#main").innerText || "").length > 20`, returnByValue: true });
        if (ok.result && ok.result.value) break;
      } catch (_) {}
    }
    await sleep(2000);
    const raw = await send("Runtime.evaluate", { expression: `(() => {
      const nav = performance.getEntriesByType("navigation")[0] || {};
      const res = performance.getEntriesByType("resource").map(r => ({ name: r.name, type: r.initiatorType, transfer: r.transferSize || 0, duration: Math.round(r.duration), start: Math.round(r.startTime) }));
      const lcp = window.__perf && window.__perf.lcp;
      const lt = (window.__perf && window.__perf.longtasks) || [];
      const ev = (window.__perf && window.__perf.events) || [];
      const paints = performance.getEntriesByType("paint");
      return { nav: { ttfb: Math.round(nav.responseStart || 0), dcl: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), transfer: nav.transferSize || 0 }, fcp: Math.round((window.__perf && window.__perf.fcp) || (paints.find(p => p.name === "first-contentful-paint") || {}).startTime || 0), lcp: lcp ? { start: Math.round(lcp.start), size: lcp.size, tag: lcp.tag, id: lcp.id, text: lcp.text } : null, cls: +(window.__perf && window.__perf.cls || 0).toFixed(3), tbt: Math.round(lt.filter(x => x > 50).reduce((a, b) => a + (b - 50), 0)), longTasks: lt.length, eventDurations: ev.slice(-20), resources: res, totalTransfer: res.reduce((a, r) => a + r.transfer, 0), jsTransfer: res.filter(r => /\\.js(\\?|$)/.test(r.name)).reduce((a, r) => a + r.transfer, 0), largest: res.slice().sort((a, b) => b.transfer - a.transfer).slice(0, 8), hasMain: !!document.querySelector("#main") && (document.querySelector("#main").innerText || "").length > 20, title: document.title, ready: document.readyState };
    })()`, returnByValue: true });
    return { url, wallMs: Date.now() - t0, ...raw.result.value };
  } finally { try { ws.close(); } catch (_) {} try { chrome.kill(); } catch (_) {} }
}
(async () => {
  const results = [];
  for (const c of cases) {
    for (let i = 0; i < RUNS; i++) {
      console.log("→", c.name, i + 1 + "/" + RUNS);
      try { results.push({ case: c.name, ...(await measure(c.url)) }); } catch (e) { results.push({ case: c.name, error: e.message }); }
    }
  }
  const byCase = {};
  for (const r of results) {
    if (!r || r.error) continue;
    (byCase[r.case] = byCase[r.case] || []).push(r);
  }
  const summary = {};
  for (const [k, arr] of Object.entries(byCase)) {
    const med = key => { const v = arr.map(x => typeof key === "function" ? key(x) : x[key]).filter(x => typeof x === "number").sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
    summary[k] = { runs: arr.length, fcp: med("fcp"), lcp: med(x => x.lcp && x.lcp.start), cls: med("cls"), tbt: med("tbt"), dcl: med(x => x.nav.dcl), load: med(x => x.nav.load), totalTransfer: med("totalTransfer"), jsTransfer: med("jsTransfer") };
  }
  const report = { generatedAt: new Date().toISOString(), device: DESKTOP ? "desktop" : "mobile-4g-4xcpu", runs: RUNS, summary, results };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log("写入", OUT);
})().catch(e => { console.error(e); process.exit(1); });
