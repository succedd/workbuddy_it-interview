/* =========================================================================
 *  importexport.js  —  批量导入 / 备份导出 / 恢复
 * ========================================================================= */
(function () {
  "use strict";
  const IE = {};
  const db = DB.db;
  const DIFFS = ["初级", "中级", "高级", "专家"];
  const TYPES = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];

  const ALIAS = {
    title: ["题目标题", "标题", "title", "name"],
    body: ["题目内容", "题目正文", "题目", "body", "content", "question"],
    answer: ["参考答案", "答案", "answer", "solution"],
    c1: ["一级技术分类", "一级分类", "技术分类1", "category1", "cat1"],
    c2: ["二级技术分类", "二级分类", "技术分类2", "category2", "cat2"],
    c3: ["三级技术分类", "三级分类", "技术分类3", "category3", "cat3"],
    difficulty: ["难度", "difficulty", "level"],
    type: ["题型", "type"],
    positions: ["适用岗位", "岗位", "positions", "jobs"],
    years: ["工作年限", "年限", "years", "experience"],
    tags: ["技术标签", "标签", "tags", "labels"],
    status: ["状态", "status"],
    remark: ["管理员备注", "备注", "remark", "note"]
  };
  function matchKey(header) {
    const h = (header || "").trim().toLowerCase();
    for (const k in ALIAS) if (ALIAS[k].some(a => a.toLowerCase() === h)) return k;
    return null;
  }

  /* 读取文件 -> {headers, rows} */
  IE.parseFile = function (file) {
    return new Promise((resolve, reject) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.onload = async (e) => {
        try {
          const buf = e.target.result;
          if (ext === "json") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            const j = JSON.parse(text);
            resolve({ kind: "json", raw: j });
          } else if (ext === "csv") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            resolve({ kind: "csv", ...csvToRows(text) });
          } else if (ext === "xlsx" || ext === "xls") {
            const wb = XLSX.read(buf, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
            const headers = rows.length ? Object.keys(rows[0]) : [];
            resolve({ kind: "excel", headers, rows });
          } else if (ext === "md" || ext === "txt") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            resolve({ kind: "md", raw: text });
          } else {
            reject(new Error("不支持的文件格式：" + ext));
          }
        } catch (err) { reject(err); }
      };
      if (ext === "json" || ext === "csv" || ext === "md" || ext === "txt") reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  };

  function csvToRows(text) {
    const lines = text.split(/\r?\n/).filter(l => l.length);
    if (!lines.length) return { headers: [], rows: [] };
    const split = (line) => {
      const out = []; let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (ch === "," && !q) { out.push(cur); cur = ""; }
        else cur += ch;
      }
      out.push(cur); return out;
    };
    const headers = split(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(l => { const c = split(l); const o = {}; headers.forEach((h, i) => o[h] = (c[i] || "").trim()); return o; });
    return { headers, rows };
  }

  IE.autoMap = function (headers) {
    const map = {};
    headers.forEach(h => { const k = matchKey(h); if (k && !map[k]) map[k] = h; });
    return map;
  };

  function resolveCat(c1, c2, c3) {
    const nameToCat = new Map(); Services.categories.forEach(c => nameToCat.set(c.name, c.id));
    const tryName = (n) => n && nameToCat.get(n.trim());
    return tryName(c3) || tryName(c2) || tryName(c1) || null;
  }
  function splitList(s) { return (s || "").split(/[,，、]/).map(x => x.trim()).filter(Boolean); }

  IE.buildRecord = function (row, map) {
    const get = k => (map[k] ? (row[map[k]] || "") : "");
    const diff = get("difficulty").trim();
    const type = get("type").trim();
    const status = get("status").trim() || "published";
    const c1 = get("c1"), c2 = get("c2"), c3 = get("c3");
    const categoryId = resolveCat(c1, c2, c3);
    const posNames = splitList(get("positions"));
    const tags = splitList(get("tags"));
    const errors = [];
    if (!get("title")) errors.push("题目标题为空");
    if (DIFFS.indexOf(diff) < 0 && diff) errors.push("难度非法：" + diff);
    if (TYPES.indexOf(type) < 0 && type) errors.push("题型非法：" + type);
    if (["published", "draft", "offline"].indexOf(status) < 0) errors.push("状态非法：" + status);
    return {
      ok: errors.length === 0,
      errors,
      data: {
        categoryId,
        title: get("title").trim(),
        body: get("body"),
        answer: get("answer"),
        difficulty: DIFFS.indexOf(diff) >= 0 ? diff : "中级",
        type: TYPES.indexOf(type) >= 0 ? type : "简答题",
        positionNames: posNames,
        years: get("years").trim(),
        tags: tags,
        status: ["published", "draft", "offline"].indexOf(status) >= 0 ? status : "published",
        remark: get("remark"),
        source: "import"
      }
    };
  };

  IE.importRows = async function (rows, map, opts) {
    opts = opts || {};
    let success = 0, fail = 0, skip = 0;
    const errors = [];
    const seen = new Set();
    for (let i = 0; i < rows.length; i++) {
      const r = IE.buildRecord(rows[i], map);
      if (!r.ok) { fail++; errors.push("第" + (i + 2) + "行：" + r.errors.join("；")); continue; }
      const title = r.data.title;
      const dup = await db.questions.where("title").equals(title).first();
      if (dup) {
        if (opts.dup === "skip") { skip++; continue; }
        if (opts.dup === "overwrite") { await db.questions.update(dup.id, r.data); success++; continue; }
        // new
      }
      await db.questions.add(Object.assign({ createdAt: Date.now(), updatedAt: Date.now(), views: 0, favorites: 0, aiScore: 0, positionIds: [], relatedIds: [] }, r.data));
      success++;
    }
    await Services.reload();
    return { success, fail, skip, errors: errors.slice(0, 50) };
  };

  /* 备份导出 */
  IE.exportBackup = async function () {
    const [categories, positions, positionSkills, questions, versions, favorites, histories, aiLogs, importLogs] = await Promise.all([
      db.categories.toArray(), db.positions.toArray(), db.positionSkills.toArray(), db.questions.toArray(),
      db.questionVersions.toArray(), db.favorites.toArray(), db.histories.toArray(),
      db.aiGenerateLogs.toArray(), db.importLogs.toArray()
    ]);
    const payload = {
      app: "it-interview-hub", version: 1, exportedAt: Date.now(),
      categories, positions, positionSkills, questions, questionVersions: versions,
      favorites, histories, aiGenerateLogs: aiLogs, importLogs
    };
    const d = new Date();
    const p = n => (n < 10 ? "0" + n : n);
    const name = `it-interview-bank-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.json`;
    U.download(name, JSON.stringify(payload, null, 2), "application/json");
    await db.backups.add({ name, type: "full", size: JSON.stringify(payload).length, createdAt: Date.now() });
    return name;
  };

  IE.exportExcel = async function () {
    const qs = Services.questions;
    /* Excel 单元格上限 32767 字符：内嵌 base64 图片的答案会超限，截断并标注（完整数据走 JSON 备份） */
    const clip = v => typeof v === "string" && v.length > 32000 ? v.slice(0, 32000) + "\n…（内容过长已截断，图片等完整数据请用 JSON 导出）" : v;
    const rows = qs.map(q => ({
      "题目标题": clip(q.title), "题目内容": clip(q.body), "参考答案": clip(q.answer),
      "一级技术分类": (q.catPath && q.catPath[0]) || "", "二级技术分类": (q.catPath && q.catPath[1]) || "",
      "三级技术分类": (q.catPath && q.catPath[2]) || "", "难度": q.difficulty, "题型": q.type,
      "适用岗位": (q.positionNames || []).join(","), "工作年限": q.years, "技术标签": (q.tags || []).join(","),
      "状态": q.status, "管理员备注": q.remark || ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "题目");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    U.download("it-interview-questions.xlsx", new Blob([out]), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  };

  IE.exportMarkdown = async function () {
    const tree = Services.categoryTree();
    let md = "# IT面试题库导出\n\n";
    const walk = (nodes, level) => {
      nodes.forEach(c => {
        md += `${"#".repeat(level + 2)} ${c.name}（${c.count}）\n\n`;
        const qs = Services.questions.filter(q => q.categoryId === c.id);
        qs.forEach(q => {
          md += `## ${q.title}\n\n- 难度：${q.difficulty}　题型：${q.type}　来源：${q.source}\n- 标签：${(q.tags || []).join(", ")}\n- 岗位：${(q.positionNames || []).join(", ")}\n\n**题目**\n\n${q.body}\n\n**参考答案**\n\n${q.answer}\n\n---\n\n`;
        });
        if (c.children && c.children.length) walk(c.children, level + 1);
      });
    };
    walk(tree, 0);
    U.download("it-interview-questions.md", md, "text/markdown");
  };

  /* 恢复备份 */
  IE.parseBackup = function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取失败"));
      reader.onload = (e) => {
        try {
          const text = new TextDecoder().decode(e.target.result);
          const j = JSON.parse(text);
          if (!j.app && !j.categories && !j.questions) throw new Error("不是有效的备份文件");
          resolve(j);
        } catch (err) { reject(new Error("备份文件格式验证失败，无法读取：" + err.message)); }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  IE.restore = async function (payload, mode) {
    if (mode === "overwrite") {
      await Promise.all([db.categories.clear(), db.positions.clear(), db.positionSkills.clear(), db.questions.clear(), db.questionVersions.clear(), db.favorites.clear(), db.histories.clear(), db.aiGenerateLogs.clear(), db.importLogs.clear()]);
    }
    const add = async (table, arr) => { if (Array.isArray(arr)) { for (const r of arr) { delete r.id; await db[table].add(r); } } };
    await add("categories", payload.categories);
    await add("positions", payload.positions);
    await add("positionSkills", payload.positionSkills);
    await add("questions", payload.questions);
    await add("questionVersions", payload.questionVersions);
    await add("favorites", payload.favorites);
    await add("histories", payload.histories);
    await add("aiGenerateLogs", payload.aiGenerateLogs);
    await add("importLogs", payload.importLogs);
    await Services.reload();
  };

  window.IE = IE;
})();
