/* =========================================================================
 *  cloud.js  —  云端共享题库：同步（访客端拉取）+ 发布（编辑端推送 GitHub）
 *  架构：data/published.json 是云端主库快照，随 GitHub Pages 一起发布；
 *        访客每次打开自动拉取最新版；配置了发布 Token 的浏览器视为编辑端
 *        （本地为主，不自动覆盖），编辑后自动/手动把本地题库推送到 GitHub。
 *
 *  v20260824c 修复：
 *   - 自动发布：编辑端题目增删改 10 秒后自动推送到 GitHub（可关闭），
 *     通过 Dexie 表钩子监听所有写入路径（含批量导入 / AI 出题）。
 *   - 顶栏状态徽章：未发布 / 发布中 / 失败。
 *   - putFile 通用上传助手（题库与加密备份共用）。
 * ========================================================================= */
(function () {
  "use strict";

  const LS_TOKEN = "gh_publish_token";
  const LS_REPO = "gh_publish_repo";
  const LS_BRANCH = "gh_publish_branch";
  const LS_AUTO = "gh_autopublish";
  const DEFAULT_REPO = "succedd/workbuddy_it-interview";
  const DEFAULT_BRANCH = "main";
  const FILE_PATH = "data/published.json";

  const AUTO_DELAY = 10000;      // 防抖：最后一次改动 10 秒后自动发布
  const RETRY_DELAY = 90000;     // 失败后重试间隔

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
  /* 编辑端：本机配置了发布 Token，本地数据为主 */
  C.isEditor = () => !!C.token();

  C.autoEnabled = function () {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(LS_AUTO) !== "0";   // 默认开启
  };
  C.setAutoEnabled = function (on) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_AUTO, on ? "1" : "0");
    if (!on) { C._dirty = false; clearTimeout(C._timer); C._emit(); }
    else if (C._dirty) C._schedule();
  };

  C.saveConfig = function (tok, repo, branch) {
    if (typeof localStorage === "undefined") return;
    const wasEditor = C.isEditor();
    localStorage.setItem(LS_TOKEN, (tok || "").trim());
    localStorage.setItem(LS_REPO, (repo || "").trim());
    localStorage.setItem(LS_BRANCH, (branch || "").trim());
    if (!wasEditor && C.isEditor()) C.installHooks();   // 首次配置 Token，立即开始监听
  };

  /* ---------- 工具 ---------- */
  function fetchT(url, opts, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 10000);
    return fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal }))
      .finally(() => clearTimeout(t));
  }

  /* ---------- 通用文件上传（GitHub Contents API，乐观锁重试） ---------- */
  C.putFile = async function (path, content, message) {
    const tok = C.token();
    if (!tok) throw new Error("尚未配置发布 Token");
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const api = "https://api.github.com/repos/" + C.repo() + "/contents/" + path;
    let lastErr = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      /* 每次尝试都重新取最新 sha，避免多标签页 / 并发提交造成的 stale sha */
      let sha = null;
      try {
        const r = await fetchT(api + "?ref=" + encodeURIComponent(C.branch()), {
          headers: { "Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json" }
        }, 10000);
        if (r.ok) { const j = await r.json(); sha = j.sha || null; }
      } catch (e) { /* 网络抖动：sha 为 null，下面走创建路径 */ }
      const body = { message: message, content: b64, branch: C.branch() };
      if (sha) body.sha = sha;   // 文件存在才带 sha，否则创建
      try {
        const r = await fetchT(api, {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + tok,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }, 30000);
        if (r.ok) return await r.json().catch(() => ({}));
        const j = await r.json().catch(() => ({}));
        const msg = (j && j.message) ? String(j.message) : ("HTTP " + r.status);
        lastErr = new Error("GitHub：" + msg);
        /* 仅冲突类错误重试：sha 不匹配 / 缺 sha（文件已存在但 GET 失败） / 分支问题 */
        const retryable = /does not match|sha.*(wasn't|was not) supplied|branch.*(not found|did not match)/i.test(msg);
        if (!retryable || attempt === 4) throw lastErr;
      } catch (e) {
        lastErr = e;
        if (attempt === 4) throw e;
      }
      await new Promise(res => setTimeout(res, 700 * (attempt + 1)));  // 退避后重取最新 sha
    }
    throw lastErr;
  };

  /* ---------- 拉取云端快照 ---------- */
  C.fetchRemote = async function () {
    try {
      const r = await fetchT(FILE_PATH + "?v=" + Date.now(), { cache: "no-store" }, 8000);
      if (!r.ok) return null;
      const j = await r.json();
      /* version 兼容：历史快照恒为 1；2026-08-27 起扩充流水线每次合并会递增，
         因此只要求是正整数，不再限定 ===1 */
      if (j && Number.isInteger(j.version) && j.version >= 1 && Array.isArray(j.questions)) return j;
      return null;
    } catch (e) { return null; }
  };

  /* ---------- 应用云端快照到本地（全量替换，保留收藏/历史/设置） ---------- */
  C._suppress = 0;   // >0 期间不触发脏标记（如手动从云端覆盖同步）
  C.applyRemote = async function (data) {
    const db = DB.db;
    C._suppress++;
    try {
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
    } finally { C._suppress--; }
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

  /* ---------- 编辑端增量吸收（2026-08-27） ----------
   * 编辑端不做全量覆盖（会冲掉本地未发布的改动），但云端自动扩充的新题
   * 也需要让编辑端及时看到——否则编辑端标题查重/发布统计都基于旧库。
   * 策略：启动时对比云端快照，只把「本机不存在的题目、分类、岗位」追加进来：
   * - 按 title 归一化判重 + ID 判重，双保险
   * - 已存在的题目/分类/岗位一概不动（保留本地编辑）
   * - 记录 absorbedRemoteAt，同一快照只吸一次
   */
  C.absorbRemote = async function (force) {
    const db = DB.db;
    const remote = await C.fetchRemote();
    if (!remote || !Array.isArray(remote.questions)) return { added: 0, reason: "noCloud" };
    const last = await DB.getSetting("absorbedRemoteAt") || 0;
    if (!force && (remote.publishedAt || 0) <= last) return { added: 0, reason: "upToDate" };

    const norm = s => String(s || "").toLowerCase().replace(/[\s\W_]+/g, "");
    let addedQ = 0;
    await db.transaction("rw", [db.categories, db.positions, db.positionSkills, db.questions], async () => {
      // 题目：title 归一化 + id 双重去重后追加
      const locals = await db.questions.toArray();
      const localIds = new Set(locals.map(q => q.id));
      const localTitles = new Set(locals.map(q => norm(q.title)));
      const newQuestions = remote.questions.filter(
        q => q && !localIds.has(q.id) && !localTitles.has(norm(q.title))
      );
      if (newQuestions.length) {
        await db.questions.bulkAdd(newQuestions);
        addedQ += newQuestions.length;
      }
      // 分类：按 id 追加缺失的（空壳分类也能补齐树结构）
      const localCatIds = new Set((await db.categories.toArray()).map(c => c.id));
      const newCats = (remote.categories || []).filter(c => c && !localCatIds.has(c.id));
      if (newCats.length) { await db.categories.bulkAdd(newCats); }
      // 岗位：按 id 追加缺失的
      const localPosIds = new Set((await db.positions.toArray()).map(p => p.id));
      const newPositions = (remote.positions || []).filter(p => p && !localPosIds.has(p.id));
      if (newPositions.length) {
        await db.positions.bulkAdd(newPositions);
        // 同步补岗位技能表（该岗位下无技能才补）
        const skills = remote.positionSkills || [];
        const localSkillKeys = new Set((await db.positionSkills.toArray()).map(s => s.positionId + ":" + s.categoryId));
        const newSkills = skills.filter(s => s && !localSkillKeys.has(s.positionId + ":" + s.categoryId));
        if (newSkills.length) await db.positionSkills.bulkAdd(newSkills);
      }
    });
    await DB.setSetting("absorbedRemoteAt", remote.publishedAt || Date.now());
    return { added: addedQ };
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
  /* 同标签页串行化：手动发布与自动发布可能同时触发，排队避免并发 PUT 同一文件 */
  C._publishChain = Promise.resolve();
  C._publishInner = async function () {
    const data = await C.exportAll();
    await C.putFile(FILE_PATH, JSON.stringify(data),
      "发布题库 " + new Date(data.publishedAt).toLocaleString("zh-CN") +
      "（" + data.questions.length + " 题 / " + data.positions.length + " 岗位）");
    await DB.setSetting("cloudSyncedAt", data.publishedAt);
    /* 顺带更新加密的本地数据备份（如已设置备份密码） */
    try {
      if (window.Backup && Backup.hasPassphrase()) await Backup.publishBackup();
    } catch (e) { console.warn("备份未完成", e); }
    return { count: data.questions.length, positions: data.positions.length };
  };
  C.publish = async function () {
    const task = C._publishChain.then(() => C._publishInner());
    C._publishChain = task.then(() => {}, () => {});   // 单个失败不阻断后续排队
    return task;
  };

  /* ================= 自动发布引擎（v20260824a） ================= */

  C._dirty = false;
  C._timer = 0;
  C._publishing = false;
  C._state = "idle";          // idle | dirty | publishing | error
  C._lastError = "";
  C._lastAutoAt = 0;
  C._listeners = [];

  C.state = () => C._state;
  C.isDirty = () => C._dirty;
  C.onChange = function (cb) { if (typeof cb === "function") C._listeners.push(cb); };
  C._emit = function () { C._listeners.slice().forEach(cb => { try { cb(C._state, C); } catch (e) {} }); C._renderChip(); };

  /* 脏标记：由 Dexie 表钩子或业务代码调用 */
  C.markDirty = function (reason) {
    if (!C.isEditor() || !C.autoEnabled()) return;
    if (C._suppress > 0) return;
    C._dirty = true;
    if (C._state !== "publishing") C._state = "dirty";
    C._schedule();
    C._emit();
  };

  C._schedule = function () {
    clearTimeout(C._timer);
    C._timer = setTimeout(() => C.autoPublish(), AUTO_DELAY);
  };

  C.autoPublish = async function () {
    if (!C._dirty || C._publishing || !C.isEditor() || !C.autoEnabled()) return;
    C._publishing = true;
    C._state = "publishing";
    C._emit();
    try {
      const r = await C.publish();
      C._dirty = false;
      C._state = "idle";
      C._lastAutoAt = Date.now();
      C._lastError = "";
      try { U.toast("已自动发布 " + r.count + " 题到云端", "success"); } catch (e) {}
    } catch (e) {
      C._state = "error";
      C._lastError = String((e && e.message) || e);
      console.warn("自动发布失败", e);
      try { U.toast("自动发布失败：" + C._lastError + "，稍后自动重试", "error"); } catch (_) {}
      clearTimeout(C._timer);
      C._timer = setTimeout(() => C.autoPublish(), RETRY_DELAY);   // 失败重试
    } finally {
      C._publishing = false;
      C._emit();
    }
  };

  /* Dexie 表钩子：监听题库核心表的所有写入（含导入/AI/管理端操作） */
  C.installHooks = function () {
    if (C._hooked || typeof Dexie === "undefined" || !DB || !DB.db) return;
    const db = DB.db;
    const hook = (t) => {
      if (!t || t.__autopub) return;
      t.__autopub = true;
      try {
        t.hook("creating", () => C.markDirty("create"));
        t.hook("updating", () => C.markDirty("update"));
        t.hook("deleting", () => C.markDirty("delete"));
      } catch (e) { console.warn("hook fail", e); }
    };
    [db.categories, db.positions, db.positionSkills, db.questions].forEach(hook);
    C._hooked = true;
  };

  /* 顶栏状态徽章 */
  C._renderChip = function () {
    const chip = document.getElementById("autopub-chip");
    if (!chip) return;
    if (!C.isEditor()) { chip.style.display = "none"; return; }
    chip.style.display = "";
    if (C._state === "publishing") { chip.className = "vis-chip autopub publishing"; chip.innerHTML = "⏳ 正在自动发布…"; }
    else if (C._state === "dirty") { chip.className = "vis-chip autopub dirty"; chip.innerHTML = "● 未发布 · 稍后自动上云"; }
    else if (C._state === "error") { chip.className = "vis-chip autopub error"; chip.title = C._lastError; chip.innerHTML = "⚠ 自动发布失败"; }
    else { chip.className = "vis-chip autopub ok"; chip.innerHTML = "✓ 已同步云端"; }
  };

  /* 初始化：编辑端启用钩子 + 关页前提醒 + 徽章轮询 */
  C.initAuto = function () {
    if (C.isEditor() && C.autoEnabled()) C.installHooks();
    window.addEventListener("beforeunload", (e) => {
      if (C._dirty && C.isEditor() && C.autoEnabled()) {
        e.preventDefault();
        e.returnValue = "题库有未发布的改动，关闭后将无法自动上云（下次打开会重试）。确定离开？";
        return e.returnValue;
      }
    });
    setInterval(() => C._renderChip(), 3000);   // topbar 重渲染后恢复徽章
    C._renderChip();
  };

  if (typeof window !== "undefined") window.Cloud = C;
})();
