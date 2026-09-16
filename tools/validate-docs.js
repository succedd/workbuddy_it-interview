/* =========================================================================
 *  tools/validate-docs.js  —  技术教程数据装配校验（纯 Node，无需浏览器）
 *
 *  用法：node tools/validate-docs.js
 *  校验项：
 *    1. 6 个方向独立文件 + docs-data.js 能装配出 window.DOCS
 *    2. 侧栏顺序为 ops → java → network → dba → frontend → devops → security
 *    3. 无重复章节 ID、无空正文、无过短正文
 *    4. 每章都有 terms（章末挂题依赖它）；本轮重构方向须带「官方文档基线」块
 *    5. 源码里无裸反引号（会破坏模板字符串）
 *  发版前跑一遍，任何 FAIL 都阻断发版。
 * ========================================================================= */
global.window = {};
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const base = path.join(ROOT, "js", "docs");

// 加载顺序与 index.html 一致：方向文件在前，docs-data.js 在后
const order = ["java", "network", "dba", "frontend", "security", "devops"];
for (const id of order) require(path.join(base, id + ".js"));
require(path.join(ROOT, "js", "docs-data.js"));

const DOCS = global.window.DOCS;
let ok = true;
const fail = (m) => { console.log("  x " + m); ok = false; };

if (!DOCS) { console.log("FAIL: window.DOCS 未定义"); process.exit(1); }

const wantOrder = ["ops", "java", "network", "dba", "frontend", "devops", "security"];
const gotOrder = DOCS.dirs.map((d) => d.id);
console.log("方向数:", DOCS.dirs.length);
console.log("顺序:", gotOrder.join(" -> "));
if (gotOrder.join(",") !== wantOrder.join(",")) fail("侧栏顺序与预期不一致");

const ids = new Set();
let totalCh = 0, dupId = 0, emptyBody = 0, shortBody = 0, noTerms = 0, noBaseline = 0;

for (const d of DOCS.dirs) {
  if (!d || !d.levels) { fail("方向对象缺失或缺少 levels"); continue; }
  const lv = [];
  for (const lvl of d.levels) {
    lv.push(`${lvl.name}:${lvl.chapters.length}`);
    for (const ch of lvl.chapters) {
      totalCh++;
      if (ids.has(ch.id)) { dupId++; console.log("    重复 ID:", ch.id); }
      ids.add(ch.id);
      const b = ch.body || "";
      if (!b.trim()) { emptyBody++; console.log("    空正文:", ch.id); }
      else if (b.length < 800) { shortBody++; console.log("    正文过短(" + b.length + "):", ch.id); }
      if (!Array.isArray(ch.terms) || ch.terms.length === 0) { noTerms++; console.log("    缺 terms:", ch.id); }
      if (["devops", "security"].includes(d.id) && !b.includes("官方文档基线")) {
        noBaseline++; console.log("    缺官方文档基线块:", ch.id);
      }
    }
  }
  const bytes = d.levels.reduce(
    (a, l) => a + l.chapters.reduce((b, c) => b + Buffer.byteLength(c.body || "", "utf8"), 0), 0);
  console.log(`  ${(d.icon || " ")} ${d.name.padEnd(16)} ${String(d.levels.reduce((a, l) => a + l.chapters.length, 0)).padStart(3)} 篇  (${lv.join(", ")})  ${(bytes / 1024).toFixed(1)}KB`);
}

console.log("---");
console.log("总篇数:", totalCh, "| 唯一 ID:", ids.size);
if (dupId) fail("存在重复章节 ID: " + dupId);
if (emptyBody) fail("存在空正文: " + emptyBody);
if (shortBody) fail("存在过短正文: " + shortBody);
if (noTerms) fail("存在缺 terms 的章节: " + noTerms);
if (noBaseline) fail("本轮重构方向存在缺官方文档基线的章节: " + noBaseline);

// 扫描源码里是否有会破坏模板字符串的裸反引号
const BT = String.fromCharCode(96);
const scanFiles = [...order.map((i) => path.join(base, i + ".js")), path.join(ROOT, "js", "docs-data.js")];
for (const f of scanFiles) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((ln, i) => {
    if (!ln.includes(BT)) return;
    const t = ln.trim();
    if (/body:\s*`$/.test(t) || t === "`" || t === "`,") return;
    if (/^const [FC] = /.test(t)) return;   // const F = \u0060... / const C = \u0060
    if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return;
    fail(`${path.relative(ROOT, f)}:${i + 1} 出现裸反引号 -> ${ln.slice(0, 90)}`);
  });
}

console.log(ok ? "ASSEMBLE_OK" : "ASSEMBLE_HAS_ISSUES");
process.exit(ok ? 0 : 1);
