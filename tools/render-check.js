/* =========================================================================
 *  tools/render-check.js  —  用真实 Chrome 渲染技术教程页面并核验
 *  用法：node tools/render-check.js [--live <baseUrl>] [--shot <out.png>] [--stub-api]
 *  默认对本地 http://127.0.0.1:8199 做检查（脚本内起静态服务）。
 *
 *  --stub-api：把「站点自身以外的所有请求」直接应答 200 {}，用于在沙箱/受限网络里
 *              核验页面渲染。原因：app.js 的启动链会 await 第三方统计与云端接口
 *              （iti-api.netlify.app / *.workers.dev）。网络被阻断时这些请求会一直挂起，
 *              启动链停在中途 → 整页空白。此时不是站点代码有问题，而是环境不可达。
 * ========================================================================= */
const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = path.join(__dirname, "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 8199;

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
      if (p === "/") p = "/index.html";
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404");
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

const args = process.argv.slice(2);
const liveIdx = args.indexOf("--live");
const BASE = liveIdx >= 0 ? args[liveIdx + 1].replace(/\/$/, "") : `http://127.0.0.1:${PORT}`;
const STUB = args.includes("--stub-api");
const SHOT = args.includes("--shot") ? args[args.indexOf("--shot") + 1] : null;
const SITE_HOST = BASE.replace(/^https?:\/\//, "").split("/")[0];

// 待验证的（方向 / 分级 / 章节）
const TARGETS = [
  ["devops", "basic", "devops-basic-1", "容器与 Docker 基础"],
  ["devops", "basic", "devops-basic-4", "Linux 与网络基础"],
  ["devops", "mid", "devops-mid-3", "Kubernetes 核心对象与 Helm"],
  ["devops", "adv", "devops-adv-3", "发布策略"],
  ["devops", "adv", "devops-adv-5", "平台工程"],
  ["security", "basic", "security-basic-1", "OWASP Top 10"],
  ["java", "basic", "syntax-collection", "集合"],
  ["java", "basic", "springboot-first", "Spring Boot"],
  ["java", "mid", "jvm-gc", "JVM"],
  ["java", "mid", "spring-principle", "Spring"],
  ["java", "adv", "jvm-troubleshoot", "JVM"],
  ["java", "adv", "high-concurrency", "并发"],
];

(async () => {
  let srv = null;
  if (liveIdx < 0) srv = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  let bad = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    if (STUB) {
      // 站点自身以外的请求一律快速应答，避免第三方接口挂起拖死启动链
      await page.setRequestInterception(true);
      page.on("request", (r) => {
        let host = "";
        try { host = new URL(r.url()).host; } catch (_) { return r.continue(); }
        if (host === SITE_HOST || r.url().startsWith("data:")) return r.continue();
        r.respond({ status: 200, contentType: "application/json", body: "{}" });
      });
    }
    const errs = [];
    // 本地跑时，访客统计接口（iti-api.netlify.app）会被 CORS 拦掉，属预期，不计入
    const isNoise = (t) => /iti-api\.netlify\.app|Access to fetch at|ERR_FAILED|Failed to load resource/.test(t);
    const push = (t) => { if (!isNoise(t)) errs.push(t); };
    page.on("console", (m) => { if (m.type() === "error") push(m.text()); });
    page.on("pageerror", (e) => push("PAGEERROR: " + e.message));

    // 方向页（首屏需加载 seed.js，多给点时间）
    await page.goto(`${BASE}/#/docs/devops`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));
    const dirInfo = await page.evaluate(() => {
      const m = document.querySelector("#main, main, .main") || document.body;
      const txt = m.innerText || "";
      return {
        hasDevops: txt.includes("云原生"),
        chapters: (txt.match(/Docker|Kubernetes|GitOps|Terraform|Helm|SRE|平台工程/g) || []).length,
        width: Math.round(m.getBoundingClientRect().width),
      };
    });
    console.log("[方向页] #/docs/devops", JSON.stringify(dirInfo));

    for (const [dir, lv, ch, expect] of TARGETS) {
      errs.length = 0;
      await page.goto(`${BASE}/#/docs/${dir}/${lv}/${ch}`, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      const info = await page.evaluate(() => {
        const m = document.querySelector("#main, main, .main") || document.body;
        const cs = getComputedStyle(m);
        return {
          width: Math.round(m.getBoundingClientRect().width),
          maxWidth: cs.maxWidth,
          opacity: cs.opacity,
          h2: [...m.querySelectorAll("h2")].length,
          tables: m.querySelectorAll("table").length,
          pre: m.querySelectorAll("pre").length,
          bodyLen: (m.innerText || "").length,
          hasBaseline: (m.innerText || "").includes("官方文档基线"),
          badTokens: (m.innerText || "").match(/\$\{C\}|\$\{F\}|\$C\}|\$F\}/g) || [],
        };
      });
      const ok = info.bodyLen > 1500 && info.h2 >= 5 && info.hasBaseline &&
        info.opacity === "1" && info.badTokens.length === 0 && errs.length === 0 &&
        Math.abs(info.width - 1180) < 40;      if (!ok) bad++;
      console.log(
        `${ok ? "OK  " : "FAIL"} ${ch.padEnd(20)} 宽=${String(info.width).padStart(4)} h2=${String(info.h2).padStart(2)} 表=${info.tables} 码块=${String(info.pre).padStart(2)} 正文字数=${String(info.bodyLen).padStart(5)} 基线=${info.hasBaseline} 残留占位=${info.badTokens.length} 控制台错误=${errs.length}`
      );
      if (errs.length) console.log("      错误:", errs.slice(0, 3));
      if (info.badTokens.length) console.log("      残留:", [...new Set(info.badTokens)].slice(0, 5));
    }

    if (SHOT) {
      await page.goto(`${BASE}/#/docs/devops/mid/devops-mid-3`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: SHOT, fullPage: false });
      console.log("截图:", SHOT);
    }
  } finally {
    await browser.close();
    if (srv) srv.close();
  }
  console.log(bad === 0 ? "RENDER_OK" : `RENDER_ISSUES(${bad})`);
  process.exit(bad === 0 ? 0 : 1);
})();
