/* =========================================================================
 *  db.js  —  Dexie/IndexedDB 封装 + 初始数据写入
 * ========================================================================= */
(function () {
  "use strict";

  if (typeof Dexie === "undefined") {
    console.error("Dexie 未加载");
  }
  const db = new Dexie("it_interview_hub");
  db.version(1).stores({
    categories: "++id, parentId, name, depth, status",
    positions: "++id, name, stage",
    positionSkills: "++id, positionId, categoryId, techName",
    questions: "++id, categoryId, difficulty, type, status, source, aiScore, createdAt, updatedAt, title",
    questionVersions: "++id, questionId, version",
    favorites: "++id, questionId, createdAt",
    histories: "++id, questionId, createdAt",
    aiGenerateLogs: "++id, createdAt",
    importLogs: "++id, createdAt",
    backups: "++id, createdAt",
    settings: "key"
  });

  const DB = { db };

  DB.getSetting = async function (key) {
    const r = await db.settings.get(key);
    return r ? r.value : undefined;
  };
  DB.setSetting = async function (key, value) {
    await db.settings.put({ key, value });
  };
  DB.isInitialized = async function () { return !!(await DB.getSetting("initialized")); };

  /* ---------- 写入初始数据 ---------- */
  DB.seed = async function (onProgress) {
    if (await DB.isInitialized()) return false;
    const S = window.SEED;
    const nameToCat = new Map();   // 分类名 -> id（深层覆盖）
    const nameToPos = new Map();   // 岗位名 -> id
    const now = Date.now();

    // 1) 分类树
    const seedCat = async (nodes, parentId, depth) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const id = await db.categories.add({
          parentId: parentId || 0,
          name: n.name,
          icon: n.icon || "📁",
          era: n.era || "",
          description: "",
          sort: i,
          depth: depth,
          status: "active"
        });
        nameToCat.set(n.name, id);
        if (n.children) await seedCat(n.children, id, depth + 1);
      }
    };
    if (onProgress) onProgress("写入技术分类…");
    await seedCat(S.categoryTree, 0, 0);

    // 2) 岗位（树中所有节点都建记录，便于引用）
    const flatPos = [];
    const walkPos = (nodes, stage, tag, parentName) => {
      nodes.forEach(n => {
        flatPos.push({ name: n.name, stage, tag, category: parentName || "", description: "", demand: "中" });
        if (n.children) walkPos(n.children, stage, tag, n.name);
      });
    };
    S.positionStages.forEach(st => walkPos(st.children, st.stage, st.tag, ""));
    if (onProgress) onProgress("写入岗位体系…");
    for (const p of flatPos) {
      if (nameToPos.has(p.name)) continue; // 同名岗位只写入一次（防止树中重名或重复 seed）
      const id = await db.positions.add({
        name: p.name, stage: p.stage, tag: p.tag, category: p.category,
        description: p.description, demand: p.demand, sort: 0, status: "active"
      });
      nameToPos.set(p.name, id);
    }

    // 3) 岗位技术栈
    if (onProgress) onProgress("写入岗位技术栈…");
    for (const posName in S.positionSkills) {
      const pid = nameToPos.get(posName);
      if (pid == null) continue;
      const grp = S.positionSkills[posName];
      const addSkills = async (list, required) => {
        for (const s of (list || [])) {
          await db.positionSkills.add({
            positionId: pid,
            categoryId: nameToCat.get(s.tech) || null,
            techName: s.tech,
            stars: s.stars || 3,
            depth: s.depth || "了解",
            required: required
          });
        }
      };
      await addSkills(grp.required, true);
      await addSkills(grp.bonus, false);
    }

    // 4) 示例题目
    const resolveCat = (path) => {
      if (!path) return null;
      for (const name of path) { if (nameToCat.has(name)) return nameToCat.get(name); }
      for (const name of path.slice().reverse()) { if (nameToCat.has(name)) return nameToCat.get(name); }
      return null;
    };
    let cnt = 0;
    const total = S.questions.length;
    for (const q of S.questions) {
      const posIds = (q.positionNames || []).map(n => nameToPos.get(n)).filter(x => x != null);
      await db.questions.add({
        categoryId: resolveCat(q.catPath),
        title: q.title,
        body: q.body,
        answer: q.answer,
        difficulty: q.difficulty,
        type: q.type,
        positionIds: posIds,
        positionNames: q.positionNames || [],
        years: q.years || "",
        tags: q.tags || [],
        source: q.source || "seed",
        aiScore: q.aiScore || 80,
        status: q.status || "published",
        views: q.views || 0,
        favorites: q.favorites || 0,
        relatedIds: [],
        remark: "",
        createdAt: now,
        updatedAt: now
      });
      cnt++;
      if (onProgress && cnt % 20 === 0) onProgress("写入题目 " + cnt + "/" + total);
    }

    await DB.setSetting("initialized", true);
    await DB.setSetting("seedAt", now);
    if (onProgress) onProgress("初始化完成");
    return true;
  };

  /* 恢复示例数据（追加合并，不覆盖） */
  DB.resetSeedAppend = async function () {
    const S = window.SEED;
    const nameToCat = new Map();
    (await db.categories.toArray()).forEach(c => nameToCat.set(c.name, c.id));
    const nameToPos = new Map();
    (await db.positions.toArray()).forEach(p => { if (!nameToPos.has(p.name)) nameToPos.set(p.name, p.id); });
    let added = 0;
    const resolveCat = (path) => { if (!path) return null; for (const n of path) if (nameToCat.has(n)) return nameToCat.get(n); return null; };
    for (const q of S.questions) {
      const exists = await db.questions.where("title").equals(q.title).first();
      if (exists) continue;
      const posIds = (q.positionNames || []).map(n => nameToPos.get(n)).filter(x => x != null);
      await db.questions.add({
        categoryId: resolveCat(q.catPath), title: q.title, body: q.body, answer: q.answer,
        difficulty: q.difficulty, type: q.type, positionIds: posIds, positionNames: q.positionNames || [],
        years: q.years || "", tags: q.tags || [], source: "seed", aiScore: q.aiScore || 80,
        status: "published", views: 0, favorites: 0, relatedIds: [], remark: "",
        createdAt: Date.now(), updatedAt: Date.now()
      });
      added++;
    }
    return added;
  };

  /* 迁移：清理重复岗位记录（同名岗位只保留 id 最小的一条） */
  DB.migrateDedupPositions = async function () {
    const MIGRATION_KEY = "migrated_dedup_positions_v1";
    if (await DB.getSetting(MIGRATION_KEY)) return 0;
    const all = await db.positions.toArray();
    const byName = new Map();
    for (const p of all) {
      if (!byName.has(p.name)) byName.set(p.name, []);
      byName.get(p.name).push(p);
    }
    let removed = 0;
    for (const [name, list] of byName) {
      if (list.length <= 1) continue;
      // 按 id 升序，保留第一条，删除其余
      list.sort((a, b) => a.id - b.id);
      const keepId = list[0].id;
      const dupIds = list.slice(1).map(p => p.id);
      for (const did of dupIds) {
        await db.positions.delete(did);
        await db.positionSkills.where("positionId").equals(did).delete();
        removed++;
      }
    }
    if (removed > 0) await DB.setSetting(MIGRATION_KEY, true);
    return removed;
  };

  /* 迁移：清理与分类同名的伪岗位（如把“腾讯云”误建成岗位）
     注意：此清理每次启动都会执行（不做一次性开关），确保任何时期误建的空岗位都能被及时清除。
     仅删除「名字与分类冲突 + 无题目 + 无技术栈」的岗位，已有关联内容的岗位不会被误删（仅在前端隐藏）。 */
  DB.migrateRemoveFakePositions = async function () {
    // 分类名同时以 IndexedDB 和当前 seed.js 的 categoryTree 为准，防止 DB 分类表过旧
    const cats = await db.categories.toArray();
    const catNameSet = new Set(cats.map(c => c.name));
    if (typeof window !== "undefined" && window.SEED && Array.isArray(window.SEED.categoryTree)) {
      const walk = (nodes) => {
        for (const n of nodes || []) {
          if (n.name) catNameSet.add(n.name);
          if (n.children) walk(n.children);
        }
      };
      walk(window.SEED.categoryTree);
    }
    const allPositions = await db.positions.toArray();
    const allQuestions = await db.questions.toArray();
    const allSkills = await db.positionSkills.toArray();
    let removed = 0;
    for (const p of allPositions) {
      if (!catNameSet.has(p.name)) continue;                 // 名字不与分类冲突
      if (p.categoryId && cats.some(c => c.id === p.categoryId && c.name !== p.name)) continue; // 已关联到其它分类
      const hasQ = allQuestions.some(q =>
        (q.positionNames || []).indexOf(p.name) >= 0 ||
        (q.positionIds || []).indexOf(p.id) >= 0
      );
      if (hasQ) continue;
      const hasSkill = allSkills.some(s => s.positionId === p.id);
      if (hasSkill) continue;
      await db.positions.delete(p.id);
      removed++;
    }
    return removed;
  };

  window.DB = DB;
})();
