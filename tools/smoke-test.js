/* =========================================================================
 *  tools/smoke-test.js  —  纯函数回归测试（node 直接跑，无需浏览器/构建）
 *  用法：node tools/smoke-test.js
 *  覆盖：utils.js 的 esc/stars/fmtBytes/md（含 DOMPurify 降级链路）、
 *        search.js 的 filter/sort/highlight。
 *  发版前跑一遍，任何 FAIL 都阻断发版。
 * ========================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;

function assert(name, cond, extra) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name + (extra ? "  —— " + extra : "")); }
}

function loadInSandbox(file, extraGlobals) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  const sandbox = Object.assign({
    window: {},
    document: { createElement: () => ({ style: {} }), querySelectorAll: () => [], head: { appendChild() {} } },
    navigator: { clipboard: undefined },
    location: { hash: "" },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    console,
  }, extraGlobals || {});
  sandbox.self = sandbox;
  sandbox.window = sandbox;   /* 浏览器里 window 即全局对象，沙箱保持一致（window.U = U 后 bare U 可见） */
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox;
}

/* ---------- utils.js ---------- */
console.log("\n[utils.js]");
const markedCalls = [];
const utilsSbx = loadInSandbox("js/utils.js", {
  marked: { setOptions() {}, parse: (t) => { markedCalls.push(t); return "<p>" + t + "</p>"; } },
});
const U = utilsSbx.window.U;
assert("U 存在", !!U);

assert("esc 转义 <script>", U.esc('<script>alert(1)<\/script>') === "&lt;script&gt;alert(1)&lt;/script&gt;", U.esc("<script>alert(1)<\/script>"));
assert("esc 处理引号", U.esc('a"b\'c&d') === "a&quot;b&#39;c&amp;d");
assert("esc 空值安全", U.esc(null) === "" && U.esc(undefined) === "");

const s3 = U.stars(3);
assert("stars 含 3 实 2 虚", (s3.match(/★/g) || []).length === 5 && s3.includes('<span class="off">★</span>'));

assert("fmtSize KB", U.fmtSize(2048).startsWith("2.0 KB"), U.fmtSize(2048));

const uid1 = U.uid(), uid2 = U.uid();
assert("uid 不重复", uid1 !== uid2 && uid1.length >= 8);

/* md：有 DOMPurify → 必须过 sanitize；无 DOMPurify → 原样（此时 marked stub 输出 <p>…</p>） */
{
  const sbx = loadInSandbox("js/utils.js", {
    marked: { setOptions() {}, parse: (t) => "<p>" + t + "</p>" },
    DOMPurify: { sanitize: (h) => h.replace(/<script[\s\S]*?<\/script>/gi, "") },
  });
  const out = sbx.window.U.md('hello<script>alert(1)<\/script>');
  assert("md 走 DOMPurify 清洗", !out.includes("<script>"), out);
}
{
  const sbx = loadInSandbox("js/utils.js", {
    marked: { setOptions() {}, parse: (t) => "<p>" + t + "</p>" },
  });
  const out = sbx.window.U.md("**bold**");
  assert("md 无 DOMPurify 时降级不报错", out.includes("bold"), out);
}
{
  const sbx = loadInSandbox("js/utils.js", {
    marked: { setOptions() { throw new Error("boom"); }, parse: () => { throw new Error("boom"); } },
  });
  const out = sbx.window.U.md("<b>x</b>");
  assert("md marked 异常时回退为转义文本", out === "&lt;b&gt;x&lt;/b&gt;", out);
}

/* ---------- search.js（与 utils.js 同一沙箱，模拟浏览器共享全局） ---------- */
console.log("\n[search.js]");
function runIn(sbx, file) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInNewContext(code, sbx, { filename: file });
}
const FIX = [
  { id: 1, title: "HashMap 底层实现", body: "数组+链表+红黑树", answer: "put 过程", tags: ["Java", "集合"], positionNames: ["Java后端工程师"], catName: "Java后端", categoryId: 12, difficulty: "中级", type: "简答题", source: "seed", status: "published", views: 10, favorites: 2, aiScore: 88, updatedAt: 100 },
  { id: 2, title: "React Hooks 原理", body: "fiber 架构", answer: "链表结构", tags: ["React"], positionNames: ["前端开发工程师"], catName: "前端", categoryId: 13, difficulty: "初级", type: "场景题", source: "manual", status: "published", views: 30, favorites: 5, aiScore: 70, updatedAt: 300 },
  { id: 3, title: "MySQL 索引失效", body: "最左前缀", answer: "隐式转换", tags: ["MySQL"], positionNames: ["Java后端工程师", "DBA"], catName: "数据库", categoryId: 14, difficulty: "高级", type: "编程题", source: "ai", status: "published", views: 20, favorites: 0, aiScore: 95, updatedAt: 200 },
];
const searchSbx = loadInSandbox("js/utils.js", { Fuse: function () {} });
runIn(searchSbx, "js/search.js");
const S = searchSbx.Search;
assert("Search 存在", !!S);

assert("filter difficulty", S.filter(FIX, { difficulty: ["中级"] }).map(x => x.id).join() === "1");
assert("filter type 多值", S.filter(FIX, { type: ["编程题", "场景题"] }).length === 2);
assert("filter positions 交集", S.filter(FIX, { positions: ["Java后端工程师"] }).length === 2);
assert("filter tags 交集", S.filter(FIX, { tags: ["React"] }).map(x => x.id).join() === "2");
assert("filter 关键词子串", S.filter(FIX, { q: "索引" }).map(x => x.id).join() === "3");
assert("filter 组合为 AND", S.filter(FIX, { positions: ["Java后端工程师"], difficulty: ["初级"] }).length === 0);
assert("filter aiScore 区间", S.filter(FIX, { aiMin: 90 }).map(x => x.id).join() === "3");

assert("sort views", S.sort(FIX, "views").map(x => x.id).join() === "2,3,1");
assert("sort favorites", S.sort(FIX, "favorites").map(x => x.id).join() === "2,1,3");
assert("sort updated 默认", S.sort(FIX).map(x => x.id).join() === "2,3,1");
assert("sort 不改原数组", (FIX.map(x => x.id).join() === "1,2,3"));

{
  const html = S.highlight("MySQL 索引失效", [{ key: "title", value: "MySQL 索引失效", indices: [[0, 4]] }], "title");
  assert("highlight 包 <mark>", html.includes("<mark>MySQL</mark>") || html.includes("<mark>"), html);
}
{
  const html = S.highlight("普通文本", [], "title");
  assert("highlight 无匹配原样转义", html === "普通文本", html);
}
{
  const html = S.highlight("<b>x</b>", [{ key: "title", value: "<b>x</b>", indices: [[0, 3]] }], "title");
  assert("highlight 先转义再标记", !html.includes("<b>") && html.includes("&lt;b&gt;"), html);
}

/* ---------- 汇总 ---------- */
console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
