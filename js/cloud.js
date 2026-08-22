/* =========================================================================
 *  cloud.js  —  云端共享题库：同步（访客端拉取）+ 发布（编辑端推送 GitHub）
 *  架构：data/published.json 是云端主库快照，随 GitHub Pages 一起发布；
 *        访客每次打开自动拉取最新版；配置了发布 Token 的浏览器视为编辑端
 *        （本地为主，不自动覆盖），点「发布」把本地题库推送到 GitHub 仓库。
 * ========================================================================= */
(function () {
  "use strict";

  const LS_TOKEN = "gh_publish_token";
  const LS_REPO = "gh_publish_repo";
  const LS_BRANCH = "gh_publish_branch";
  const DEFAULT_REPO = "succedd/workbuddy_it-interview";
  const DEFAULT_BRANCH = "main";
  const FILE_PATH = "data/published.json";

  const C = {};

  /* ---------- 配置 ---------- */
  C.token = () => (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_TOKEN) || "") : "");
  C.repo = () => {
    const v = (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_REPO) || "") : "");
    return v || DEFAULT_REPO;
  };
  C.branch = () => {
    const v = (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_BRANCH) || "") : "");
    return v || DEFAULT_BRANCH;
  };
  /* 编辑端：本机配置了发布 Token，本地数据为主，不自动同步 */
  C.isEditor = () => !!C.token();

  C.saveConfig = function (tok, repo, branch) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_TOKEN, (tok || "").trim());
    localStorage.setItem(LS_REPO, (repo || "").trim());
    localStorage.setItem(LS_BRANCH, (branch || "").trim());
  };

  /* ---------- 工具 ---------- */
  function fetchT(url, opts, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 10000);
    return fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal }))
      .finally(() => clearTimeout(t));
  }

  /* ---------- 拉取云端快照 ---------- */
  C.fetchRemote = async function () {
    try {
      const r = await fetchT(FILE_PATH + "?v=" + Date.now(), { cache: "no-store" }, 8000);
      if (!r.ok) return null;
      const j = await r.json();
      if (j && j.version === 1 && Array.isArray(j.questions)) return j;
      return null;
    } catch (e) { return null; }
  };

  /* ---------- 应用云端快照到本地（全量替换，保留收藏/历史/设置） ---------- */
  C.applyRemote = async function (data) {
    const db = DB.db;
    await db.transaction("rw", [db.categories, db.positions, db.positionSkills, db.questions], async () => {
      await db.categories.clear();
      await db.positions.clear();
      await db.positionSkills.clear();
      await db.questions.clear();
      if (data.categories && data.categories.length) await db.categories.bulkAdd(data.categories);
      if (data.positions && data.positions.length) await db.positions.bulkAdd(data.positions);
      if (data.positionSkills && data.positionSkills.length) await db.positionSkills.bulkAdd(data.positionSkills);
      if (data.questions && data.questions.length) await db.questions.bulkAdd(data.questions);
    });
    await DB.setSetting("cloudSyncedAt", data.publishedAt || 0);
  };

  /* ---------- 启动时自动同步（仅非编辑端） ----------
     规则：
     - 编辑端（有 Token）：跳过，本地为主
     - 曾同步过（cloudSyncedAt 存在）：云端有新版就自动更新
     - 全新访客（本次刚种入种子）：直接采用云端版本
     - 本机已有历史数据但从未同步：不自动覆盖（保护本地数据），
       返回 pending，由设置页/提示引导手动同步 */
  C.syncIfNeeded = async function (justSeeded) {
    if (C.isEditor()) return { skipped: true, reason: "editor" };
    const data = await C.fetchRemote();
    if (!data) return { skipped: true, reason: "noCloud" };
    const local = await DB.getSetting("cloudSyncedAt");
    const hasSynced = local != null;
    if ((data.publishedAt || 0) <= (local || 0)) return { skipped: true, reason: "upToDate" };
    if (!hasSynced && !justSeeded) {
      return { pending: true, count: (data.questions || []).length };
    }
    await C.applyRemote(data);
    return { applied: true, count: (data.questions || []).length };
  };

  /* 手动立即同步（设置页按钮）：强制采用云端版本，覆盖本地题库 */
  C.syncNow = async function () {
    const data = await C.fetchRemote();
    if (!data) throw new Error("云端题库不存在或无法访问");
    await C.applyRemote(data);
    return data;
  };

  /* ---------- 导出本地全量题库 ---------- */
  C.exportAll = async function () {
    const db = DB.db;
    const [categories, positions, positionSkills, questions] = await Promise.all([
      db.categories.toArray(), db.positions.toArray(), db.positionSkills.toArray(), db.questions.toArray()
    ]);
    return {
      version: 1,
      publishedAt: Date.now(),
      categories: categories,
      positions: positions,
      positionSkills: positionSkills,
      questions: questions
    };
  };

  /* ---------- 发布到 GitHub（编辑端） ---------- */
  C.publish = async function () {
    const tok = C.token();
    if (!tok) throw new Error("尚未配置发布 Token");
    const data = await C.exportAll();
    const json = JSON.stringify(data);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const api = "https://api.github.com/repos/" + C.repo() + "/contents/" + FILE_PATH;

    // 1) 取现有文件 sha（用于更新；404 视为新建）
    let sha = null;
    try {
      const r = await fetchT(api + "?ref=" + encodeURIComponent(C.branch()), {
        headers: { "Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json" }
      }, 10000);
      if (r.ok) { const j = await r.json(); sha = j.sha || null; }
    } catch (e) { /* 网络问题继续尝试提交 */ }

    // 2) 提交
    const body = {
      message: "发布题库 " + new Date(data.publishedAt).toLocaleString("zh-CN") +
        "（" + data.questions.length + " 题 / " + data.positions.length + " 岗位）",
      content: b64,
      branch: C.branch()
    };
    if (sha) body.sha = sha;
    const r = await fetchT(api, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + tok,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }, 30000);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j && j.message) ? ("GitHub：" + j.message) : ("HTTP " + r.status));
    await DB.setSetting("cloudSyncedAt", data.publishedAt);
    return { count: data.questions.length, positions: data.positions.length };
  };

  if (typeof window !== "undefined") window.Cloud = C;
})();
