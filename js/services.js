/* =========================================================================
 *  services.js  —  业务查询 / 题目增删改 / 版本 / 收藏历史 / 统计
 * ========================================================================= */
(function () {
  "use strict";
  const S = {};
  const db = DB.db;

  /* 内存缓存 */
  S.categories = [];
  S.positions = [];
  S.positionSkills = [];
  S.questions = [];
  S.catMap = new Map();
  S.posMap = new Map();
  S.catCounts = {};      // categoryId -> 含子孙的题目数
  S.catDirect = {};      // categoryId -> 直接题目数
  S.fuse = null;

  S.reload = async function () {
    S.categories = await db.categories.toArray();
    S.positions = await db.positions.toArray();
    S.positionSkills = await db.positionSkills.toArray();
    S.questions = await db.questions.toArray();
    S.catMap = new Map(S.categories.map(c => [c.id, c]));
    S.posMap = new Map(S.positions.map(p => [p.id, p]));
    S._computeCounts();
    S.questions.forEach(q => { q.catName = S.catName(q.categoryId); q.catPath = S.categoryPath(q.categoryId); });
    S.fuse = Search.build(S.questions);
    S.weakCount = await db.weakBank.count();
  };

  S._computeCounts = function () {
    S.catCounts = {}; S.catDirect = {};
    S.questions.forEach(q => {
      if (q.categoryId != null) { S.catDirect[q.categoryId] = (S.catDirect[q.categoryId] || 0) + 1; }
    });
    // 自底向上累加到祖先
    const byDepth = S.categories.slice().sort((a, b) => b.depth - a.depth);
    byDepth.forEach(c => {
      const d = S.catDirect[c.id] || 0;
      S.catCounts[c.id] = (S.catCounts[c.id] || 0) + d;
      if (c.parentId) S.catCounts[c.parentId] = (S.catCounts[c.parentId] || 0) + (S.catCounts[c.id] || 0);
    });
  };

  /* 分类辅助 */
  S.catName = function (id) { const c = S.catMap.get(id); return c ? c.name : ""; };
  S.categoryPath = function (id) {
    const path = []; let cur = S.catMap.get(id);
    while (cur) { path.unshift(cur.name); cur = S.catMap.get(cur.parentId); }
    return path;
  };
  S.getCategory = id => S.catMap.get(id);
  S.childrenOf = function (parentId) { return S.categories.filter(c => c.parentId === (parentId || 0)).sort((a, b) => a.sort - b.sort); };
  S.descendantIds = function (id) {
    const out = []; const stack = [id];
    while (stack.length) { const cur = stack.pop(); S.categories.forEach(c => { if (c.parentId === cur) { out.push(c.id); stack.push(c.id); } }); }
    return out;
  };

  /* 构建用于前端的分类树（含题目数） */
  S.categoryTree = function () {
    const build = (parentId) => S.childrenOf(parentId).map(c => ({
      ...c, count: S.catCounts[c.id] || 0, children: build(c.id)
    }));
    return build(0);
  };

  /* 岗位 */
  S.positionsByStage = function () {
    const map = new Map();
    S.positions.forEach(p => {
      if (!map.has(p.stage)) map.set(p.stage, []);
      map.get(p.stage).push(p);
    });
    return Array.from(map.entries()).map(([stage, list]) => ({ stage, list }));
  };
  S.getPosition = id => S.posMap.get(id);
  /* 岗位完整显示名：含细分方向时为「岗位名·方向」，否则为岗位名 */
  S.posFullName = function (p) { if (!p) return ""; return p.direction ? (p.name || "") + "·" + p.direction : (p.name || ""); };
  /* 去重 key：名字 + 细分方向，同名异方向视为不同岗位 */
  S.posKey = function (p) { return (p.name || "") + "|" + (p.direction || ""); };
  S.skillsOf = function (positionId) { return S.positionSkills.filter(s => s.positionId === positionId); };
  S.matchPosition = function (q, pos) {
    if (!pos) return false;
    // 优先按 id 精确匹配（方向岗位各自独立题库）
    const ids = q.positionIds || [];
    if (pos.id != null && ids.indexOf(pos.id) >= 0) return true;
    // 名字匹配仅在岗位无细分方向时生效，避免同名异方向岗位互相串题
    const names = q.positionNames || [];
    if (!pos.direction && pos.name != null && names.indexOf(pos.name) >= 0) return true;
    return false;
  };
  S.questionCountForPosition = function (pos) {
    if (!pos) return 0;
    const target = typeof pos === "string" ? { name: pos } : pos;
    return S.questions.filter(q => S.matchPosition(q, target)).length;
  };
  S.getCategoryByName = function (name) { return S.categories.find(c => c.name === name); };
  /* 从当前 seed.js 的 categoryTree 展开出所有分类名（兜底，防止 IndexedDB 分类表过旧未包含新增叶子） */
  S.categoryNamesFromSeed = function () {
    if (typeof window === "undefined" || !window.SEED || !window.SEED.categoryTree) return new Set();
    const names = new Set();
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n.name) names.add(n.name);
        if (n.children) walk(n.children);
      }
    };
    walk(window.SEED.categoryTree);
    return names;
  };
  /* 判断一个名字是否对应任何分类（DB 中已有或当前 seed 中存在） */
  S.isCategoryName = function (name) {
    if (!name) return false;
    return !!S.getCategoryByName(name) || S.categoryNamesFromSeed().has(name);
  };
  /* 隐藏岗位：岗位名与某个分类名相同，就不应该在岗位体系/岗位管理里显示（它是分类，不是岗位） */
  S.isHiddenPosition = function (p) {
    if (!p || !p.name) return false;
    return S.isCategoryName(p.name);
  };
  /* 伪岗位检测：岗位名与某个分类名相同，且没有实质关联内容（无题目、无技术栈），可安全删除 */
  S.isFakePosition = function (p) {
    if (!S.isHiddenPosition(p)) return false;
    if (S.questionCountForPosition(p) > 0) return false;
    if (S.skillsOf(p.id).length > 0) return false;
    return true;
  };

  /* 题目查询 */
  S.getQuestion = async function (id) { return await db.questions.get(id); };
  S.allQuestions = () => S.questions;
  S.published = () => S.questions.filter(q => q.status === "published");

  /* 收藏 / 历史 */
  S.isFavorite = async function (qid) { const r = await db.favorites.where("questionId").equals(qid).first(); return !!r; };
  S.toggleFavorite = async function (qid) {
    const r = await db.favorites.where("questionId").equals(qid).first();
    const q = await db.questions.get(qid);
    if (r) {
      await db.favorites.delete(r.id);
      if (q) await db.questions.update(qid, { favorites: Math.max(0, (q.favorites || 0) - 1) });
      await S.reload();
      return false;
    }
    await db.favorites.add({ questionId: qid, createdAt: Date.now() });
    if (q) await db.questions.update(qid, { favorites: (q.favorites || 0) + 1 });
    await S.reload();
    return true;
  };
  S.getFavorites = async function () {
    const fs = await db.favorites.orderBy("createdAt").reverse().toArray();
    const out = [];
    for (const f of fs) { const q = await db.questions.get(f.questionId); if (q) out.push(q); }
    return out;
  };
  S.addHistory = async function (qid) {
    const existing = await db.histories.where("questionId").equals(qid).first();
    if (existing) await db.histories.delete(existing.id);
    await db.histories.add({ questionId: qid, createdAt: Date.now() });
    const all = await db.histories.toArray();
    if (all.length > 100) { all.sort((a, b) => a.createdAt - b.createdAt); for (const h of all.slice(0, all.length - 100)) await db.histories.delete(h.id); }
  };
  S.getHistories = async function () {
    const hs = await db.histories.orderBy("createdAt").reverse().toArray();
    const out = [];
    for (const h of hs) { const q = await db.questions.get(h.questionId); if (q) out.push({ q, at: h.createdAt }); }
    return out;
  };

  /* 薄弱题本：标记「不熟悉 / 不会」的题目持久化收集 */
  S.addWeak = async function (qid, marked) {
    const existing = await db.weakBank.where("questionId").equals(qid).first();
    if (existing) await db.weakBank.update(existing.id, { marked, updatedAt: Date.now() });
    else await db.weakBank.add({ questionId: qid, marked, createdAt: Date.now(), updatedAt: Date.now() });
    S.weakCount = await db.weakBank.count();
  };
  S.removeWeak = async function (qid) {
    const existing = await db.weakBank.where("questionId").equals(qid).first();
    if (existing) { await db.weakBank.delete(existing.id); S.weakCount = await db.weakBank.count(); }
  };
  S.isWeak = async function (qid) { const r = await db.weakBank.where("questionId").equals(qid).first(); return !!r; };
  S.getWeakQuestions = async function () {
    const ws = await db.weakBank.orderBy("updatedAt").reverse().toArray();
    const out = [];
    for (const w of ws) { const q = await db.questions.get(w.questionId); if (q && q.status === "published") out.push(q); }
    return out;
  };
  S.clearWeak = async function () { await db.weakBank.clear(); S.weakCount = 0; };
  S.incViews = async function (qid) { const q = await db.questions.get(qid); if (q) await db.questions.update(qid, { views: (q.views || 0) + 1 }); };

  /* 题目版本与 CRUD */
  S.addQuestion = async function (data) {
    const now = Date.now();
    const id = await db.questions.add({
      categoryId: data.categoryId ?? null,
      title: data.title || "未命名题目",
      body: data.body || "",
      answer: data.answer || "",
      difficulty: data.difficulty || "中级",
      type: data.type || "简答题",
      positionIds: data.positionIds || [],
      positionNames: data.positionNames || [],
      years: data.years || "",
      tags: data.tags || [],
      source: data.source || "manual",
      aiScore: data.aiScore || 0,
      status: data.status || "draft",
      views: 0, favorites: 0,
      relatedIds: data.relatedIds || [],
      remark: data.remark || "",
      createdAt: now, updatedAt: now
    });
    return id;
  };
  S.updateQuestion = async function (id, data) {
    const old = await db.questions.get(id);
    if (old) {
      const v = (await db.questionVersions.where("questionId").equals(id).count()) + 1;
      await db.questionVersions.add({ questionId: id, version: v, snapshot: old, createdAt: Date.now() });
    }
    await db.questions.update(id, Object.assign({}, data, { updatedAt: Date.now() }));
  };
  S.deleteQuestion = async function (id) {
    await db.questions.delete(id);
    await db.questionVersions.where("questionId").equals(id).delete();
  };
  S.duplicateQuestion = async function (id) {
    const q = await db.questions.get(id);
    if (!q) return null;
    const now = Date.now();
    const copy = Object.assign({}, q);
    delete copy.id;
    copy.title = q.title + "（副本）";
    copy.status = "draft";
    copy.views = 0; copy.favorites = 0;
    copy.createdAt = now; copy.updatedAt = now;
    return await db.questions.add(copy);
  };
  S.versionsOf = function (id) { return db.questionVersions.where("questionId").equals(id).reverse().sortBy("version"); };
  S.restoreVersion = async function (versionId) {
    const v = await db.questionVersions.get(versionId);
    if (!v) return;
    const snap = v.snapshot;
    const { id, createdAt } = snap;
    await db.questions.update(v.questionId, Object.assign({}, snap, { id: v.questionId, updatedAt: Date.now() }));
  };

  /* 分类 / 岗位 管理 */
  S.addCategory = async function (parentId, data) {
    const siblings = S.childrenOf(parentId);
    return await db.categories.add({
      parentId: parentId || 0, name: data.name, icon: data.icon || "📁", era: data.era || "",
      description: data.description || "", sort: siblings.length, depth: parentId ? (S.catMap.get(parentId).depth + 1) : 0, status: "active"
    });
  };
  S.updateCategory = async function (id, data) { await db.categories.update(id, data); };
  S.deleteCategory = async function (id) {
    const cnt = S.catCounts[id] || 0;
    if (cnt > 0) return { error: "hasQuestions", count: cnt };
    // 递归删子分类
    const kids = S.childrenOf(id);
    for (const k of kids) { const r = await S.deleteCategory(k.id); if (r && r.error) return r; }
    await db.categories.delete(id);
    return { ok: true };
  };
  S.addPosition = async function (data) {
    const categoryId = data.categoryId != null ? data.categoryId : null;
    const category = categoryId != null ? (S.catName(categoryId) || data.category || "") : (data.category || "");
    return await db.positions.add({ name: data.name, direction: data.direction || "", stage: data.stage || "未分类", tag: data.tag || "", category: category, categoryId: categoryId, description: data.description || "", demand: data.demand || "中", sort: 0, status: "active" });
  };
  S.updatePosition = async function (id, data) {
    if (data.categoryId != null) data.category = S.catName(data.categoryId) || data.category || "";
    await db.positions.update(id, data);
  };
  S.deletePosition = async function (id) { await db.positions.delete(id); await db.positionSkills.where("positionId").equals(id).delete(); };
  S.addPositionSkill = async function (data) { return await db.positionSkills.add(data); };
  S.deletePositionSkill = async function (id) { await db.positionSkills.delete(id); };

  /* 统计 */
  S.stats = async function () {
    const qs = S.questions;
    const byDiff = {}, byType = {}, bySource = {}, byAiBand = { "0-59": 0, "60-79": 0, "80-89": 0, "90-100": 0 };
    qs.forEach(q => {
      byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
      byType[q.type] = (byType[q.type] || 0) + 1;
      bySource[q.source] = (bySource[q.source] || 0) + 1;
      const s = q.aiScore || 0;
      if (s < 60) byAiBand["0-59"]++; else if (s < 80) byAiBand["60-79"]++; else if (s < 90) byAiBand["80-89"]++; else byAiBand["90-100"]++;
    });
    // 分类题目数分布（仅一级）
    const byCat = {};
    S.childrenOf(0).forEach(c => { byCat[c.name] = S.catCounts[c.id] || 0; });
    // 岗位题目数 top
    const byPos = {};
    qs.forEach(q => (q.positionNames || []).forEach(n => byPos[n] = (byPos[n] || 0) + 1));
    // 不足/空分类
    const insufficient = [], empty = [];
    S.childrenOf(0).forEach(c => {
      const n = S.catCounts[c.id] || 0;
      if (n === 0) empty.push(c.name); else if (n < 5) insufficient.push({ name: c.name, count: n });
    });
    const aiLogs = await db.aiGenerateLogs.orderBy("createdAt").reverse().limit(10).toArray();
    const importLogs = await db.importLogs.orderBy("createdAt").reverse().limit(10).toArray();
    const recent = qs.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 10);
    const topFav = qs.slice().sort((a, b) => (b.favorites || 0) - (a.favorites || 0)).slice(0, 10);
    return {
      total: qs.length, published: qs.filter(q => q.status === "published").length,
      draft: qs.filter(q => q.status === "draft").length, offline: qs.filter(q => q.status === "offline").length,
      ai: qs.filter(q => q.source === "ai").length, manual: qs.filter(q => q.source === "manual").length,
      import: qs.filter(q => q.source === "import").length,
      categories: S.categories.length, positions: S.positions.length,
      byDiff, byType, bySource, byAiBand, byCat, byPos, insufficient, empty, aiLogs, importLogs, recent, topFav
    };
  };

  /* 备份日志 */
  S.logAI = async function (rec) { await db.aiGenerateLogs.add(Object.assign({ createdAt: Date.now() }, rec)); };
  S.logImport = async function (rec) { await db.importLogs.add(Object.assign({ createdAt: Date.now() }, rec)); };

  window.Services = S;
})();
