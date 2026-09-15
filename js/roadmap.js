/* =========================================================================
 *  roadmap.js  —  岗位刷题计划
 *  把某个岗位已关联的题目，按「技术分类」聚合成 4–8 周的学习计划。
 *  本模块只做纯计算与进度存取，不操作 DOM；页面渲染在 app.js 的
 *  pageRoadmap / pageRoadmapDetail，周计划练习复用现有 pagePractice。
 * ========================================================================= */
(function () {
  "use strict";
  const R = {};

  /* ---------- 进度存储 ----------
     存在 settings 表（随个人加密备份 / 账号云同步，换设备不丢）。
     结构是**扁平集合** { "<questionId>": <markedAt> }：
     同一道题可能同时属于多个岗位，扁平集合天然对所有路线图生效，
     不需要按岗位分别记进度，也不会因为岗位被删而留下孤儿数据。 */
  const KEY = "roadmapMastered";
  let cache = null;          // 内存缓存，避免每次渲染都读 IndexedDB
  let writeTimer = null;
  const buildCache = new Map();   // posId -> 路线图对象（勾选后由 invalidateBuild 清空）

  R.load = async function () {
    if (cache) return cache;
    let raw = null;
    try { raw = await DB.getSetting(KEY); } catch (e) { raw = null; }
    cache = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
    return cache;
  };
  R.ready = function () { return cache !== null; };
  /* 合并写入：连续勾选时只落盘一次，避免大批量点击打爆 IndexedDB */
  function persist() {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(function () {
      writeTimer = null;
      try { DB.setSetting(KEY, cache); } catch (e) {}
    }, 250);
  }
  R.isMastered = function (qid) { return !!(cache && cache[qid]); };
  /* 勾选会改变构建结果里的 mastered 汇总值，必须让构建缓存失效，
     否则从详情页返回列表页时进度条还停在旧数字 */
  function invalidateBuild() { buildCache.clear(); }
  R.setMastered = function (qid, on) {
    if (!cache) cache = {};
    if (on) cache[qid] = Date.now(); else delete cache[qid];
    persist();
    invalidateBuild();
  };
  R.toggle = function (qid) { R.setMastered(qid, !R.isMastered(qid)); return R.isMastered(qid); };
  /* 刷题页标记「已掌握」时同步记入路线图进度（题目未在任何路线图里也无害） */
  R.markMastered = async function (qid) {
    await R.load();
    if (!cache[qid]) { cache[qid] = Date.now(); persist(); invalidateBuild(); }
  };
  R.masteredCount = function (ids) {
    const c = cache || {};
    let n = 0;
    for (let i = 0; i < ids.length; i++) if (c[ids[i]]) n++;
    return n;
  };
  R.clearAll = async function () {
    cache = {};
    try { await DB.setSetting(KEY, cache); } catch (e) {}
    invalidateBuild();
  };

  /* ---------- 周计划生成 ---------- */
  const MIN_WEEKS = 4, MAX_WEEKS = 8;
  const PER_WEEK = 28;                                  // 每周目标题量（每题 ≈ 6 分钟 → 约 3 小时/周）
  const MINUTE_PER_Q = 6;                               // 单题预估耗时（分钟），含读题 + 理解答案
  const DIFF_W = { "初级": 1, "中级": 2, "高级": 3, "专家": 4 };

  R.invalidate = function () { buildCache.clear(); };

  /* 返回 { pos, total, mastered, minutes, weeks: [...] }；参数非法或无题时 weeks 为空数组 */
  R.build = function (pos) {
    const empty = { pos: pos || null, total: 0, mastered: 0, minutes: 0, weeks: [] };
    if (!pos || pos.id == null || typeof Services === "undefined") return empty;
    const cached = buildCache.get(pos.id);
    if (cached) return cached;

    const S = Services;
    const qs = S.questions.filter(function (q) { return q.status === "published" && S.matchPosition(q, pos); });
    if (!qs.length) return empty;

    /* ① 按分类分组 */
    const groups = new Map();
    qs.forEach(function (q) {
      const key = q.categoryId != null ? q.categoryId : 0;
      if (!groups.has(key)) {
        groups.set(key, {
          catId: q.categoryId != null ? q.categoryId : null,
          name: q.categoryId != null ? (S.catName(q.categoryId) || "未分类") : "综合练习",
          path: q.categoryId != null ? S.categoryPath(q.categoryId).join(" / ") : "岗位综合",
          questions: []
        });
      }
      groups.get(key).questions.push(q);
    });
    const list = Array.from(groups.values());
    list.forEach(function (g) {
      const sum = g.questions.reduce(function (s, q) { return s + (DIFF_W[q.difficulty] || 2); }, 0);
      g.avgDiff = sum / g.questions.length;
      /* 组内由浅入深，同难度按热度（浏览 + 收藏）降序 */
      g.questions.sort(function (a, b) {
        return (DIFF_W[a.difficulty] || 2) - (DIFF_W[b.difficulty] || 2) ||
          ((b.views || 0) + (b.favorites || 0)) - ((a.views || 0) + (a.favorites || 0));
      });
    });

    /* ② 周数：按总量估算后夹在 4–8 周（题少也要有结构感，题多也不能长到劝退） */
    const n = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, Math.round(qs.length / PER_WEEK)));
    const cap = Math.ceil(qs.length / n);

    /* ③ 超大分类先切片，否则「后端开发」这类岗位会被一个巨型分类（如 Spring）
          一次性吃掉好几周，其余分类全挤到最后 */
    const chunks = [];
    list.forEach(function (g) {
      if (g.questions.length <= cap * 1.6) { chunks.push(g); return; }
      const rest = g.questions.slice();
      let part = 0;
      while (rest.length) {
        part++;
        chunks.push({
          catId: g.catId,
          name: g.name + (part > 1 ? "（续 " + part + "）" : ""),
          path: g.path,
          avgDiff: g.avgDiff,
          questions: rest.splice(0, cap)
        });
      }
    });

    /* ④ 贪心装箱：按「简单优先」顺序，把每块放进当前题量最少的那一周。
          既保证整体由浅入深，又让每周题量尽量拉平 */
    chunks.sort(function (a, b) { return a.avgDiff - b.avgDiff || b.questions.length - a.questions.length; });
    const weeks = [];
    for (let i = 0; i < n; i++) weeks.push({ topics: [], questions: [] });
    chunks.forEach(function (g) {
      let best = 0;
      for (let i = 1; i < weeks.length; i++) if (weeks[i].questions.length < weeks[best].questions.length) best = i;
      weeks[best].topics.push({ catId: g.catId, name: g.name, path: g.path, count: g.questions.length });
      Array.prototype.push.apply(weeks[best].questions, g.questions);
    });

    /* ⑤ 由浅入深排序，编号 1..N（空周丢弃） */
    const kept = weeks.filter(function (w) { return w.questions.length > 0; });
    kept.forEach(function (w) {
      const ids = w.questions.map(function (q) { return q.id; });
      const sum = w.questions.reduce(function (s, q) { return s + (DIFF_W[q.difficulty] || 2); }, 0);
      w.avgDiff = sum / w.questions.length;
      w.count = w.questions.length;
      w.minutes = w.count * MINUTE_PER_Q;
      w.daily = Math.max(1, Math.ceil(w.count / 7));     // 按一周 7 天分摊的每日题量
      w.mastered = R.masteredCount(ids);
      w.ids = ids;
      const dist = { "初级": 0, "中级": 0, "高级": 0, "专家": 0 };
      w.questions.forEach(function (q) { if (dist[q.difficulty] != null) dist[q.difficulty]++; });
      w.diffDist = dist;
      /* 标题只表达「这一周的主导方向」：主分类过半就直接用它，占三分之一以上标「为主」，
         再碎就叫综合强化。刻意不做「A + B」并列 —— 装箱是按题量分配的，
         两个分类被拼在一起往往是凑数的结果（如「Java + 常见HR面试题」），读起来莫名其妙。
         具体包含哪些分类，交给你下面那排分类标签表达。 */
      const sorted = w.topics.slice().sort(function (a, b) { return b.count - a.count; });
      if (!sorted.length) w.title = "综合强化";
      else if (sorted[0].count >= w.count * 0.6) w.title = sorted[0].name;
      else if (sorted[0].count >= w.count * 0.35) w.title = sorted[0].name + " 为主";
      else w.title = "综合强化";
    });
    kept.sort(function (a, b) { return a.avgDiff - b.avgDiff; });
    kept.forEach(function (w, i) { w.n = i + 1; });

    const out = {
      pos: pos,
      total: qs.length,
      minutes: qs.length * MINUTE_PER_Q,
      mastered: R.masteredCount(qs.map(function (q) { return q.id; })),
      weeks: kept
    };
    buildCache.set(pos.id, out);
    return out;
  };

  /* 供 pagePractice 用：某岗位第 N 周的题目 id 列表 */
  R.weekQuestionIds = function (posId, weekNo) {
    const pos = (typeof Services !== "undefined") ? Services.getPosition(parseInt(posId)) : null;
    if (!pos) return [];
    const r = R.build(pos);
    const w = r.weeks[parseInt(weekNo) - 1];
    return w ? w.ids.slice() : [];
  };

  /* 某一周在整条路线里的位置（用于「继续学习」定位下一周） */
  R.nextWeek = function (roadmap) {
    if (!roadmap || !roadmap.weeks.length) return 1;
    for (let i = 0; i < roadmap.weeks.length; i++) {
      const w = roadmap.weeks[i];
      /* 边缘情况：勾选状态变化后 w.mastered 可能过期，这里实时算一次 */
      if (R.masteredCount(w.ids) < w.count) return w.n;
    }
    return roadmap.weeks.length;
  };

  window.Roadmap = R;
})();
