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
  const LS_AUTORESTORE = "iti_autorestore_degraded";   /* 2026-09-09：本机答案为降质短版时自动恢复云端完整版 */
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

  /* 自动恢复降质答案：默认开启 */
  C.autoRestoreEnabled = function () {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(LS_AUTORESTORE) !== "0";
  };
  C.setAutoRestore = function (on) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_AUTORESTORE, on ? "1" : "0");
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
  C.putFile = async function (path, content, message, branch) {
    const tok = C.token();
    if (!tok) throw new Error("尚未配置发布 Token");
    const br = branch || C.branch();
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const api = "https://api.github.com/repos/" + C.repo() + "/contents/" + path;
    let lastErr = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      /* 每次尝试都重新取最新 sha，避免多标签页 / 并发提交造成的 stale sha */
      let sha = null;
      try {
        const r = await fetchT(api + "?ref=" + encodeURIComponent(br), {
          headers: { "Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json" }
        }, 10000);
        if (r.ok) { const j = await r.json(); sha = j.sha || null; }
      } catch (e) { /* 网络抖动：sha 为 null，下面走创建路径 */ }
      const body = { message: message, content: b64, branch: br };
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
  C.fetchRemote = async function (noCache) {
    try {
      const r = await fetchT(FILE_PATH + (noCache ? "?v=" + Date.now() : ""), noCache ? { cache: "no-store" } : undefined, 8000);
      if (!r.ok) return null;
      const j = await r.json();
      /* version 兼容：历史快照恒为 1；2026-08-27 起扩充流水线每次合并会递增，
         因此只要求是正整数，不再限定 ===1 */
      if (j && Number.isInteger(j.version) && j.version >= 1 && Array.isArray(j.questions)) return j;
      return null;
    } catch (e) { return null; }
  };

  /* ---------- 重复题清理（2026-09-10） ----------
     云端把同一道题的重复收录合并掉了（published.json 顶层 removedQuestions = {旧题号: 保留题号}）。
     只删云端不够：本机若还留着，编辑端下次自动发布会把它整包推回（题数没变少，发布守卫不会拦）；
     普通浏览器的本地收藏/浏览/错题记录也会变成指向不存在题目的死记录。
     这里做两件事：① 删掉本机的重复题；② 把 favorites / histories / weakBank 重定向到保留题号。
     幂等：同一份映射重复执行结果一致，失败不阻断启动流程。 */
  C.applyRemovedQuestions = async function (map) {
    const db = DB.db;
    const out = { removed: 0, remapped: 0 };
    if (!map || typeof map !== "object") return out;
    const pairs = Object.keys(map)
      .map(k => [parseInt(k, 10), parseInt(map[k], 10)])
      .filter(p => p[0] && p[1] && p[0] !== p[1]);
    if (!pairs.length) return out;
    try { await DB.setSetting("removedMap", map); } catch (_) {}   /* 缓存映射，供账号云同步合并后再次清理 */
    try {
      await db.transaction("rw", [db.questions, db.questionVersions, db.favorites, db.histories, db.weakBank], async () => {
        for (const pair of pairs) {
          const from = pair[0], to = pair[1];
          if (await db.questions.get(from)) { await db.questions.delete(from); out.removed++; }
          const vers = await db.questionVersions.where("questionId").equals(from).toArray();
          for (const v of vers) await db.questionVersions.delete(v.id);
          for (const store of [db.favorites, db.histories, db.weakBank]) {
            const olds = await store.where("questionId").equals(from).toArray();
            if (!olds.length) continue;
            let keepExists = !!(await store.where("questionId").equals(to).first());
            for (const rec of olds) {
              if (keepExists) await store.delete(rec.id);          /* 保留题已有同类记录，旧的直接去重 */
              else { await store.update(rec.id, { questionId: to }); keepExists = true; }
              out.remapped++;
            }
          }
        }
      });
    } catch (e) { /* 清理失败只影响去重，不阻断同步 */ }
    C._lastRemoved = out;
    return out;
  };

  /* 已缓存的「被删题号 → 保留题号」映射（账号云同步合并后用它再清理一次，
     否则云端用户数据里残留的旧题号会被重新拉回本机，形成指向不存在题目的死记录） */
  C.getRemovedMap = async function () {
    try {
      const v = await DB.getSetting("removedMap");
      return (v && typeof v === "object") ? v : {};
    } catch (e) { return {}; }
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
      /* 题目已整包替换，被合并的重复题自然消失；这里只需把用户本地数据重定向到保留题 */
      await C.applyRemovedQuestions(data.removedQuestions);
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
    const data = await C.fetchRemote(true);
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
    /* NORM_VER：norm 规则变更（v2 改 Unicode 感知）后对老本地库强制重放一次吸收，
       修复旧版把中文标题剥空导致漏吸收的题 */
    const NORM_VER = 2;
    let run = !!force;
    try { if ((await DB.getSetting("absorbNormVer")) !== NORM_VER) run = true; } catch (_) {}
    const last = await DB.getSetting("absorbedRemoteAt") || 0;
    /* 重复题清理标记：云端 removedQuestions 条数与本机已应用的不一致时，即使快照时间戳没变也要跑一次 */
    const remoteRmCount = (remote.removedQuestions && typeof remote.removedQuestions === "object")
      ? Object.keys(remote.removedQuestions).length : 0;
    let rmApplied = 0;
    try { rmApplied = (await DB.getSetting("removedApplied")) || 0; } catch (_) {}
    if (!run && remoteRmCount !== rmApplied) run = true;
    if (!run && (remote.publishedAt || 0) <= last) return { added: 0, reason: "upToDate" };

    const norm = s => String(s || "").toLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, "");   /* 保留 CJK 等文字与数字，仅剥空白/标点/符号 */
    let addedQ = 0;
    let restoredQ = 0;   /* 降质答案已自动恢复的题数 */
    /* 吸收期间抑制自动发布：吸收的内容本就来自云端，不能又整包推回去覆盖流水线数据 */
    C._suppress++;
    try {
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
        /* 降质答案自动恢复（2026-09-09）：本机某题的答案明显短于云端时，
           几乎只剩两种可能——① 本机是历史的降级/截断版本；② 用户刻意精简。
           默认按①处理（可用设置项关闭），取云端的完整版并把本机更大的浏览计数带过去。
           没有这一步，编辑端只能靠「手动从云端拉取」才能修复答案，十分反直觉。 */
        restoredQ = 0;
        if (C.autoRestoreEnabled()) {
          const localById = new Map(locals.map(q => [q.id, q]));
          const fixes = [];
          for (const rq of remote.questions) {
            const lq = localById.get(rq.id);
            if (!lq) continue;
            const la = String(lq.answer || "").length;
            const ra = String(rq.answer || "").length;
            if (ra > Math.max(la * 1.3, la + 120)) {
              const merged = Object.assign({}, rq);
              merged.views = Math.max(Number(rq.views) || 0, Number(lq.views) || 0);
              fixes.push(merged);
            }
          }
          if (fixes.length) {
            await db.questions.bulkPut(fixes);
            restoredQ = fixes.length;
          }
        }
        /* 岗位关联自动补齐（2026-09-09）：云端某题配的岗位比本机全时，按「并集」合并。
           没有这一步，流水线回填的岗位会在编辑端下次自动发布时被整包冲掉——
           题数没变少，发布守卫不会拦截。并集合并可保住本机人工配的岗位不被删。 */
        let posFixed = 0;
        if (C.autoRestoreEnabled()) {
          const rposName = {};
          (remote.positions || []).forEach(p => { if (p && p.id != null) rposName[p.id] = p.name; });
          const localById2 = new Map(locals.map(q => [q.id, q]));
          const posFixes = [];
          for (const rq of remote.questions) {
            const lq = localById2.get(rq.id);
            if (!lq) continue;
            const rIds = Array.isArray(rq.positionIds) ? rq.positionIds : [];
            if (!rIds.length) continue;
            const lIds = Array.isArray(lq.positionIds) ? lq.positionIds : [];
            /* 名称优先取云端岗位表，其次云端/本机题目上带的 positionNames */
            const nameOf = {};
            (rq.positionNames || []).forEach((n, idx) => { if (rIds[idx] != null) nameOf[rIds[idx]] = n; });
            (lq.positionNames || []).forEach((n, idx) => { if (lIds[idx] != null && !nameOf[lIds[idx]]) nameOf[lIds[idx]] = n; });
            const missing = rIds.filter(i => lIds.indexOf(i) < 0);
            const merged = lIds.concat(missing).filter(i => rposName[i] || nameOf[i]);
            const mergedNames = merged.map(i => rposName[i] || nameOf[i]);
            /* ids 与 names 都没变化才跳过（本机 names 为空的历史数据也要顺带补齐） */
            if (merged.join(",") === lIds.join(",") &&
                mergedNames.join(",") === (lq.positionNames || []).join(",")) continue;
            posFixes.push(Object.assign({}, lq, {
              positionIds: merged,
              positionNames: merged.map(i => rposName[i] || nameOf[i])
            }));
          }
          if (posFixes.length) {
            await db.questions.bulkPut(posFixes);
            posFixed = posFixes.length;
          }
        }
        C._lastPosFixed = posFixed;
        /* 同名分类就地合并（2026-09-10）：本地库对分类只做「并集吸收」，云端清理掉的
           重名重复分类不会被删，编辑端下次自动发布又会把整包推回云端，让清理白做。
           这里以云端为权威就地合并：题改挂保留项、技能关联重定向、移除多余条目。
           只在本地确实存在重名分类时执行，任何异常都不影响后续吸收。 */
        let catMerged = 0;
        try {
          const localCats = await db.categories.toArray();
          const byName = new Map();
          for (const c of localCats) {
            const k = String(c.name || "").trim();
            if (!k) continue;
            if (!byName.has(k)) byName.set(k, []);
            byName.get(k).push(c);
          }
          const dupGroups = [...byName.values()].filter(g => g.length > 1);
          if (dupGroups.length) {
            const skills = await db.positionSkills.toArray();
            const inCloud = new Set((remote.categories || []).map(c => c.id));
            const qCnt = {}, sCnt = {};
            for (const q of locals) { if (q.categoryId != null) qCnt[q.categoryId] = (qCnt[q.categoryId] || 0) + 1; }
            for (const s of skills) { if (s.categoryId != null) sCnt[s.categoryId] = (sCnt[s.categoryId] || 0) + 1; }
            const drop2keep = new Map();
            for (const group of dupGroups) {
              /* 保留优先级：云端仍在 > 被技能表引用 > 题多 > id 小 */
              const rank = c => [inCloud.has(c.id) ? 1 : 0, sCnt[c.id] ? 1 : 0, qCnt[c.id] || 0, -c.id];
              const sorted = group.slice().sort((a, b) => {
                const ra = rank(a), rb = rank(b);
                for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return rb[i] - ra[i];
                return 0;
              });
              for (let i = 1; i < sorted.length; i++) drop2keep.set(sorted[i].id, sorted[0].id);
            }
            if (drop2keep.size) {
              const movedQ = locals.filter(q => q.categoryId != null && drop2keep.has(q.categoryId))
                .map(q => Object.assign({}, q, { categoryId: drop2keep.get(q.categoryId) }));
              if (movedQ.length) await db.questions.bulkPut(movedQ);
              const movedS = skills.filter(s => s.categoryId != null && drop2keep.has(s.categoryId))
                .map(s => Object.assign({}, s, { categoryId: drop2keep.get(s.categoryId) }));
              if (movedS.length) await db.positionSkills.bulkPut(movedS);
              await db.categories.bulkDelete([...drop2keep.keys()]);
              catMerged = drop2keep.size;
            }
          }
        } catch (e) { catMerged = 0; }
        C._lastCatMerged = catMerged;
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
      /* 重复题清理：云端已合并的重复题，本机同样删掉并把用户本地数据重定向（在抑制发布期间执行，
         避免清理动作触发一次携带旧数据的自动发布） */
      const rmRes = await C.applyRemovedQuestions(remote.removedQuestions);
      await DB.setSetting("absorbedRemoteAt", remote.publishedAt || Date.now());
      await DB.setSetting("absorbNormVer", NORM_VER);
      await DB.setSetting("removedApplied", remoteRmCount);
      C._lastRemoved = rmRes;
    } finally { C._suppress--; }
    return { added: addedQ, restored: restoredQ, posFixed: C._lastPosFixed || 0, catMerged: C._lastCatMerged || 0,
             removed: (C._lastRemoved && C._lastRemoved.removed) || 0,
             remapped: (C._lastRemoved && C._lastRemoved.remapped) || 0 };
  };

  /* ---------- 本地 vs 云端 题量比对（2026-09-09） ----------
     用途：编辑端判断本机是否落后于云端快照，登录后人不用猜「怎么少了几百题」 */
  C.localVsRemote = async function () {
    const local = await DB.db.questions.count();
    let remote = null;
    try { remote = await C.fetchRemote(); } catch (e) {}
    return {
      local: local,
      remote: remote && Array.isArray(remote.questions) ? remote.questions.length : null,
      publishedAt: remote ? (remote.publishedAt || 0) : 0
    };
  };

  /* ---------- 发布保护：禁止用更少的旧数据反向覆盖云端（2026-09-09） ----------
     事故复盘：本机题库停留在旧快照（834 题，且答案是降质短版）时，编辑端的
     自动/手动发布会把云端已恢复的 874 题整体砍回去，全程零提示。
     因此每次发布前先与云端快照比对题量：
       - 本地 < 云端 → 抛错拒绝发布，提示先「从云端拉取到本机」
       - 确实是删题场景 → 先拉取、在本地删，再发布（拉到本地再删不会触发本保护）
       - 例外：C.forceOnce() 可放行一次（保留给明确的强行覆盖场景） */
  C._forceOnce = false;
  C.forceOnce = function () { C._forceOnce = true; };
  C.guardAgainstShrink = async function (localCount) {
    if (C._forceOnce) { C._forceOnce = false; return null; }
    let remote = null;
    try { remote = await C.fetchRemote(true); } catch (e) {}
    if (!remote || !Array.isArray(remote.questions)) return null;   // 云端不可达时不阻断本地发布
    const rc = remote.questions.length;
    if (rc > localCount) {
      return "本机 " + localCount + " 题 < 云端 " + rc + " 题（少 " + (rc - localCount) +
        " 题），已拒绝发布——直接用本机覆盖会把云端这些题删掉。" +
        "请先点「从云端拉取到本机」；确属删题场景，请先拉取，再在本机删除后发布。";
    }
    return null;
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
    /* 发布前保护：本机题量少于云端时直接拒绝，避免又一次「874 → 834」式砍库 */
    const guard = await C.guardAgainstShrink(data.questions.length);
    if (guard) { const ge = new Error(guard); ge.guardBlocked = true; throw ge; }
    const msg = "发布题库 " + new Date(data.publishedAt).toLocaleString("zh-CN") +
      "（" + data.questions.length + " 题 / " + data.positions.length + " 岗位）";
    /* 题库双推 release+main（与扩充流水线一致）：Pages 发布源是 release，
       此前编辑端默认只推 main，导致管理端的发布/删除从未出现在线上站点 */
    const branches = [...new Set(["release", "main", C.branch()])];
    for (const br of branches) {
      await C.putFile(FILE_PATH, JSON.stringify(data), msg, br);
    }
    await DB.setSetting("cloudSyncedAt", data.publishedAt);
    /* 不再在此显式调 Backup.publishBackup：cloudSyncedAt 落库会经 settings 表
       钩子让备份引擎 12 秒后自动接手，显式调用等于同一次改动备份两遍 */
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
      try { U.toast("自动发布失败：" + C._lastError + (e && e.guardBlocked ? "（本机落后于云端，请先拉取）" : "，稍后自动重试"), "error"); } catch (_) {}
      clearTimeout(C._timer);
      /* 保护性拒绝不重试：本机落后必须人工拉取，自动重试只会反复弹同一条错 */
      if (e && e.guardBlocked) { C._dirty = false; }
      else C._timer = setTimeout(() => C.autoPublish(), RETRY_DELAY);
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
