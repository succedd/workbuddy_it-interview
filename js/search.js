/* =========================================================================
 *  search.js  —  Fuse 模糊搜索 + 筛选 + 排序
 * ========================================================================= */
(function () {
  "use strict";
  const S = {};

  S.build = function (questions) {
    const docs = questions.map(q => ({
      ref: q.id,
      title: q.title || "",
      body: q.body || "",
      answer: q.answer || "",
      tags: (q.tags || []).join(" "),
      positions: (q.positionNames || []).join(" "),
      cat: q.catName || ""
    }));
    return new Fuse(docs, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "tags", weight: 0.2 },
        { name: "body", weight: 0.15 },
        { name: "positions", weight: 0.12 },
        { name: "answer", weight: 0.08 },
        { name: "cat", weight: 0.05 }
      ],
      includeMatches: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1
    });
  };

  S.run = function (fuse, term) {
    if (!term || !term.trim()) return null;
    const res = fuse.search(term.trim());
    const map = new Map();
    res.forEach(r => map.set(r.item.ref, r.matches || []));
    return map; // id -> matches
  };

  /* 高亮：把匹配子串包 <mark> */
  S.highlight = function (text, matches, key) {
    if (!text) return "";
    const ms = (matches || []).filter(m => m.key === key);
    if (!ms.length) return U.esc(text);
    let out = "";
    let idx = 0;
    ms.forEach(m => {
      const v = m.value || "";
      const i = v.toLowerCase().indexOf(m.key ? "" : "");
      // Fuse match.indices 给出 [start,end] 区间
      (m.indices || []).forEach(([s, e]) => {
        if (s < idx) return;
        out += U.esc(v.slice(idx, s));
        out += "<mark>" + U.esc(v.slice(s, e + 1)) + "</mark>";
        idx = e + 1;
      });
      if (idx < v.length) out += U.esc(v.slice(idx));
    });
    return out || U.esc(text);
  };

  /* 筛选 */
  S.filter = function (questions, f) {
    f = f || {};
    return questions.filter(q => {
      if (f.categoryId != null) {
        // 含子分类：调用方已展开，这里直接比较
        if (q.categoryId !== f.categoryId) return false;
      }
      if (f.difficulty && f.difficulty.length && f.difficulty.indexOf(q.difficulty) < 0) return false;
      if (f.type && f.type.length && f.type.indexOf(q.type) < 0) return false;
      if (f.source && f.source.length && f.source.indexOf(q.source) < 0) return false;
      if (f.status && f.status.length && f.status.indexOf(q.status) < 0) return false;
      if (f.positions && f.positions.length) {
        const inter = (q.positionNames || []).filter(n => f.positions.indexOf(n) >= 0);
        if (!inter.length) return false;
      }
      if (f.tags && f.tags.length) {
        const inter = (q.tags || []).filter(t => f.tags.indexOf(t) >= 0);
        if (!inter.length) return false;
      }
      if (f.years && f.years.length && f.years.indexOf(q.years) < 0) return false;
      if (f.aiMin != null && (q.aiScore || 0) < f.aiMin) return false;
      if (f.aiMax != null && (q.aiScore || 0) > f.aiMax) return false;
      if (f.q && f.q.trim()) {
        const t = f.q.toLowerCase();
        const hay = ((q.title || "") + " " + (q.body || "") + " " + (q.tags || []).join(" ") + " " + (q.positionNames || []).join(" ")).toLowerCase();
        if (hay.indexOf(t) < 0) return false;
      }
      return true;
    });
  };

  S.sort = function (arr, by) {
    const a = arr.slice();
    switch (by) {
      case "views": a.sort((x, y) => (y.views || 0) - (x.views || 0)); break;
      case "favorites": a.sort((x, y) => (y.favorites || 0) - (x.favorites || 0)); break;
      case "aiScore": a.sort((x, y) => (y.aiScore || 0) - (x.aiScore || 0)); break;
      case "updated":
      default: a.sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0)); break;
    }
    return a;
  };

  window.Search = S;
})();
