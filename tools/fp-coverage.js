/* =========================================================================
 *  tools/fp-coverage.js  —  第一性原理必读题覆盖检查（只读）
 *  用法：node tools/fp-coverage.js [--json] [--limit N]
 *  逻辑：分类「含子分类总题数 > 0」且「该分类下没有带『第一性原理』标签的题」
 *        即视为缺口；按总题数降序输出（补题优先级从高到低）。
 *  自动化约定：每日扩题任务先跑本工具，取前 1~2 个缺口分类各补 4 题
 *  （诞生/本质/边界/演化，tags 带「第一性原理」「必读」），走常规合并发布。
 * ========================================================================= */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = process.argv.find(a => a.endsWith(".json")) || path.join(ROOT, "data", "published.json");
const jsonMode = process.argv.includes("--json");
const limIdx = process.argv.indexOf("--limit");
const LIMIT = limIdx >= 0 ? parseInt(process.argv[limIdx + 1], 10) || 20 : 20;

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const qs = data.questions || [];
const cats = data.categories || [];

const FP_TAG = "第一性原理";
const direct = new Map();          // categoryId -> 直属题数
const hasFp = new Set();           // 已有 FP 题的分类
qs.forEach(q => {
  if (q.categoryId == null) return;
  direct.set(q.categoryId, (direct.get(q.categoryId) || 0) + 1);
  if ((q.tags || []).includes(FP_TAG)) hasFp.add(q.categoryId);
});

const childrenOf = new Map();
cats.forEach(c => {
  const p = c.parentId || 0;
  if (!childrenOf.has(p)) childrenOf.set(p, []);
  childrenOf.get(p).push(c.id);
});
const totalMemo = new Map();
function totalQ(id) {
  if (totalMemo.has(id)) return totalMemo.get(id);
  let t = direct.get(id) || 0;
  (childrenOf.get(id) || []).forEach(kid => { t += totalQ(kid); });
  totalMemo.set(id, t);
  return t;
}
const nameOf = id => { const c = cats.find(x => x.id === id); return c ? c.name : "#" + id; };

const missing = cats
  .filter(c => totalQ(c.id) > 0 && !hasFp.has(c.id))
  .map(c => ({ id: c.id, name: c.name, total: totalQ(c.id), direct: direct.get(c.id) || 0 }))
  .sort((a, b) => b.total - a.total);

if (jsonMode) {
  console.log(JSON.stringify({ generatedAt: Date.now(), missingCount: missing.length, missing: missing.slice(0, LIMIT) }, null, 2));
  process.exit(0);
}

console.log(`\n===== 第一性原理必读题覆盖（${path.relative(ROOT, SRC)}） =====`);
console.log(`已有 FP 题的分类：${hasFp.size} 个；缺口分类：${missing.length} 个（按含子分类题量降序，前 ${Math.min(LIMIT, missing.length)} 个）`);
missing.slice(0, LIMIT).forEach((m, i) => {
  console.log(`${i + 1}. ${m.name}（id=${m.id}）—— 含子分类 ${m.total} 题 / 直属 ${m.direct} 题`);
});
if (missing.length > LIMIT) console.log(`… 其余 ${missing.length - LIMIT} 个见 --json 输出`);
console.log(`\n补题约定：每分类 4 题（诞生/本质/边界/演化），tags 含「${FP_TAG}」「必读」，type=开放讨论题，走 enrich_questions.py 常规合并发布。`);
console.log("");
