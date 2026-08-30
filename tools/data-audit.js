/* =========================================================================
 *  tools/data-audit.js  —  题库数据体检（只读，不改任何数据）
 *  用法：node tools/data-audit.js [published.json 路径]
 *  检查维度：字段缺失 / 分类映射 / 瘦分类 / 重复题 / 短内容 / 图片引用 / 孤儿分享页
 *  发版前跑一遍，报告仅供参考，不自动修复数据。
 * ========================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SRC = process.argv[2] || path.join(ROOT, "data", "published.json");

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const qs = Array.isArray(data.questions) ? data.questions : [];
const issues = [];
const note = (level, msg) => issues.push({ level, msg });
const add = (msg) => note("warn", msg);
const info = (msg) => note("info", msg);

/* ---- 分类 id → 名称映射：复现 db.js seedCat 的 DFS 顺序（Dexie ++id 从 1 起） ---- */
function buildCatMap() {
  const map = new Map(); /* id -> {name, path} */
  try {
    const code = fs.readFileSync(path.join(ROOT, "data", "seed.js"), "utf8");
    const sandbox = { window: {} };
    sandbox.self = sandbox;
    vm.runInNewContext(code, sandbox);
    const tree = (sandbox.window.SEED || sandbox.SEED || {}).categoryTree || [];
    let id = 0;
    const walk = (nodes, parentPath) => {
      for (const n of nodes) {
        id += 1;
        const p = parentPath ? parentPath + " / " + n.name : n.name;
        map.set(id, { name: n.name, path: p });
        if (n.children) walk(n.children, p);
      }
    };
    walk(tree, "");
  } catch (e) {
    info("无法解析 seed.js 分类树（" + e.message + "），瘦分类按原始 id 展示");
  }
  return map;
}
const catMap = buildCatMap();
const catName = (q) => (q.catName && q.catName !== "-" ? q.catName : (catMap.get(q.categoryId) || {}).path || (catMap.get(q.categoryId) || {}).name || "");

/* ============================ 各项检查 ============================ */

/* 1) 总量与分布 */
const dist = (key) => {
  const m = {};
  qs.forEach(q => { const v = q[key] === undefined || q[key] === null || q[key] === "" ? "（空）" : (Array.isArray(q[key]) ? q[key].join("+") || "（空数组）" : String(q[key])); m[v] = (m[v] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};
console.log(`\n===== 题库体检报告（${path.relative(ROOT, SRC)}） =====`);
console.log(`题目总数：${qs.length}`);
console.log(`难度分布：${dist("difficulty").map(([k, v]) => k + " " + v).join("，")}`);
console.log(`题型分布：${dist("type").map(([k, v]) => k + " " + v).join("，")}`);
console.log(`状态分布：${dist("status").map(([k, v]) => k + " " + v).join("，")}`);
console.log(`来源分布：${dist("source").map(([k, v]) => (k.length > 24 ? k.slice(0, 24) + "…" : k) + " " + v).join("，")}`);

/* 2) 字段缺失 */
const noTitle = qs.filter(q => !q.title || !String(q.title).trim());
const noBody = qs.filter(q => !q.body || !String(q.body).trim());
const noAnswer = qs.filter(q => !q.answer || !String(q.answer).trim());
const noTags = qs.filter(q => !q.tags || !q.tags.length);
if (noTitle.length) add(`缺标题 ${noTitle.length} 题：${ids(noTitle)}`);
if (noBody.length) add(`缺题干（body）${noBody.length} 题：${ids(noBody)}`);
if (noAnswer.length) add(`缺参考答案 ${noAnswer.length} 题：${ids(noAnswer)}`);
if (noTags.length) info(`无标签 ${noTags.length} 题：${ids(noTags.slice(0, 20))}${noTags.length > 20 ? "…" : ""}`);

/* 3) 分类映射 */
const noCat = qs.filter(q => q.categoryId === null || q.categoryId === undefined);
const unknownCat = qs.filter(q => q.categoryId != null && !catMap.has(q.categoryId));
const emptyCatName = qs.filter(q => !q.catName || q.catName === "-");
if (noCat.length) add(`未分类（categoryId 为空）${noCat.length} 题：${ids(noCat)}`);
if (unknownCat.length) add(`categoryId 无法映射到 seed 分类树 ${unknownCat.length} 题：${ids(unknownCat)}`);
if (emptyCatName.length === qs.length) info(`catName 字段 100% 为空（${qs.length}/${qs.length}）——发布导出链路未写入分类名，SPA 端靠 seed.js 树兜底，但搜索索引的 catName 权重实际无效`);

/* 4) 瘦分类 */
const byCat = new Map();
qs.forEach(q => { const n = catName(q) || "#" + q.categoryId; byCat.set(n, (byCat.get(n) || 0) + 1); });
const thin = [...byCat.entries()].filter(([, v]) => v > 0 && v < 3).sort((a, b) => a[1] - b[1]);
if (thin.length) add(`瘦分类（<3 题）${thin.length} 个：${thin.map(([k, v]) => `${k}(${v})`).join("，")}`);

/* 5) 重复题 */
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, "").replace(/[？?。，,．.！!：:；;（）()\[\]【】]/g, "");
const titleMap = new Map();
qs.forEach(q => { const k = norm(q.title); if (!k) return; if (!titleMap.has(k)) titleMap.set(k, []); titleMap.get(k).push(q); });
const dups = [...titleMap.entries()].filter(([, v]) => v.length > 1);
if (dups.length) add(`疑似重复标题 ${dups.length} 组：${dups.slice(0, 8).map(([, v]) => `「${v[0].title}」×${v.length}`).join("，")}${dups.length > 8 ? "…" : ""}`);

/* 6) 短内容 */
const strip = (s) => String(s || "").replace(/```[\s\S]*?```/g, " ").replace(/[#>*`\-\|]/g, "").replace(/\s+/g, " ").trim();
const shortAns = qs.filter(q => q.answer && strip(q.answer).length < 30);
if (shortAns.length) add(`参考答案过短（<30 字）${shortAns.length} 题：${ids(shortAns.slice(0, 20))}${shortAns.length > 20 ? "…" : ""}`);

/* 7) 图片引用 */
const imgRe = /(?:!\[[^\]]*\]\(([^)\s]+)[^)]*\)|<img[^>]+src=["']([^"']+)["'])/g;
let imgBroken = 0, imgChecked = 0;
qs.forEach(q => {
  const hay = (q.body || "") + "\n" + (q.answer || "");
  let m;
  imgRe.lastIndex = 0;
  while ((m = imgRe.exec(hay))) {
    const src = m[1] || m[2];
    if (!src || /^https?:/i.test(src) || /^data:/i.test(src)) continue;
    imgChecked++;
    const rel = src.replace(/^\/+/, "").split("?")[0];
    if (!fs.existsSync(path.join(ROOT, rel))) { imgBroken++; if (imgBroken <= 5) add(`图片缺失：题目 ${q.id} 引用 ${src}`); }
  }
});
if (imgChecked) info(`本地图片引用 ${imgChecked} 处，缺失 ${imgBroken} 处（外链未校验）`);

/* 8) 孤儿分享页 */
const qDir = path.join(ROOT, "q");
if (fs.existsSync(qDir)) {
  const valid = new Set(qs.map(q => String(q.id)));
  const orphans = fs.readdirSync(qDir).filter(f => f.endsWith(".html") && !valid.has(f.replace(".html", "")));
  if (orphans.length) add(`孤儿分享页（题目已不存在）${orphans.length} 个：${orphans.slice(0, 8).join("，")}${orphans.length > 8 ? "…" : ""}`);
  const stale = qs.filter(q => {
    const f = path.join(qDir, q.id + ".html");
    if (!fs.existsSync(f)) return true;
    try { const html = fs.readFileSync(f, "utf8"); return !html.includes("application/ld+json"); } catch (_) { return true; }
  });
  if (stale.length) info(`分享页缺内容/JSON-LD（需重跑 gen-share-pages.js）：${stale.length} 个`);
}

/* 9) 第一性原理必读题覆盖（缺口的完整清单见 tools/fp-coverage.js） */
const fpSet = new Set(qs.filter(q => (q.tags || []).includes("第一性原理")).map(q => q.categoryId));
const catQ = new Map();
qs.forEach(q => { if (q.categoryId != null) catQ.set(q.categoryId, (catQ.get(q.categoryId) || 0) + 1); });
const fpMissing = [...catQ.entries()]
  .filter(([id, n]) => n >= 3 && !fpSet.has(id))
  .sort((a, b) => b[1] - a[1]);
if (fpMissing.length) info(`缺第一性原理必读题的分类 ${fpMissing.length} 个（题量 Top：${fpMissing.slice(0, 8).map(([id, n]) => `${(catMap.get(id) || {}).name || "#" + id}(${n})`).join("，")}）——全量清单跑 tools/fp-coverage.js`);

function ids(arr) { return arr.map(q => "#" + q.id).join("，"); }

/* ============================ 汇总 ============================ */
const warns = issues.filter(i => i.level === "warn");
const infos = issues.filter(i => i.level === "info");
console.log(`\n----- 发现 ${warns.length} 项待处理 -----`);
warns.forEach((i, idx) => console.log(`${idx + 1}. ${i.msg}`));
if (infos.length) {
  console.log(`\n----- ${infos.length} 项说明（非必改） -----`);
  infos.forEach((i, idx) => console.log(`${idx + 1}. ${i.msg}`));
}
console.log("");
