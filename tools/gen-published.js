/* 生成初始 data/published.json（云端题库快照）
   用法：node tools/gen-published.js
   复刻 js/db.js 中 DB.seed 的写入逻辑（纯 JS，无 Dexie） */
(function () {
  global.window = {};
  require("../data/seed.js");
  const S = global.window.SEED;

  const categories = [];
  const positions = [];
  const positionSkills = [];
  const questions = [];
  const nameToCat = new Map();
  const nameToPos = new Map();
  const now = Date.now();

  // 1) 分类树
  let catId = 0;
  const seedCat = (nodes, parentId, depth) => {
    nodes.forEach((n, i) => {
      const id = ++catId;
      categories.push({
        id: id, parentId: parentId || 0, name: n.name, icon: n.icon || "📁",
        era: n.era || "", description: "", sort: i, depth: depth, status: "active"
      });
      nameToCat.set(n.name, id);
      if (n.children) seedCat(n.children, id, depth + 1);
    });
  };
  seedCat(S.categoryTree, 0, 0);

  // 2) 岗位
  let posId = 0;
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
  const seenPosKeys = new Set();
  for (const p of flatPos) {
    const key = (p.name || "") + "|" + (p.direction || "");
    if (seenPosKeys.has(key)) continue;
    seenPosKeys.add(key);
    const id = ++posId;
    positions.push({
      id: id, name: p.name, stage: p.stage, tag: p.tag, category: p.category,
      direction: p.direction || "", description: p.description, demand: p.demand,
      sort: 0, status: "active"
    });
    if (!nameToPos.has(p.name)) nameToPos.set(p.name, id);
  }

  // 3) 岗位技术栈
  let skId = 0;
  for (const posName in S.positionSkills) {
    const pid = nameToPos.get(posName);
    if (pid == null) continue;
    const grp = S.positionSkills[posName];
    const addSkills = (list, required) => {
      (list || []).forEach(s => {
        positionSkills.push({
          id: ++skId, positionId: pid, categoryId: nameToCat.get(s.tech) || null,
          techName: s.tech, stars: s.stars || 3, depth: s.depth || "了解", required: required
        });
      });
    };
    addSkills(grp.required, true);
    addSkills(grp.bonus, false);
  }

  // 4) 示例题目
  let qId = 0;
  const resolveCat = (path) => {
    if (!path) return null;
    for (const name of path) { if (nameToCat.has(name)) return nameToCat.get(name); }
    for (const name of path.slice().reverse()) { if (nameToCat.has(name)) return nameToCat.get(name); }
    return null;
  };
  for (const q of S.questions) {
    const posIds = (q.positionNames || []).map(n => nameToPos.get(n)).filter(x => x != null);
    questions.push({
      id: ++qId,
      categoryId: resolveCat(q.catPath),
      title: q.title, body: q.body, answer: q.answer,
      difficulty: q.difficulty, type: q.type,
      positionIds: posIds, positionNames: q.positionNames || [],
      years: q.years || "", tags: q.tags || [],
      source: q.source || "seed", aiScore: q.aiScore || 80,
      status: q.status || "published",
      views: q.views || 0, favorites: q.favorites || 0,
      relatedIds: [], remark: "",
      createdAt: now, updatedAt: now
    });
  }

  const out = {
    version: 1,
    publishedAt: now,
    categories: categories,
    positions: positions,
    positionSkills: positionSkills,
    questions: questions
  };
  const fs = require("fs");
  const path = require("path");
  const dest = path.resolve(__dirname, "../data/published.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 1), "utf8");
  console.log("OK ->", dest);
  console.log("categories:", categories.length, "| positions:", positions.length,
    "| skills:", positionSkills.length, "| questions:", questions.length);
})();
