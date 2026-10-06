/* =========================================================================
 *  cloud.js  —  云端共享题库：同步（访客端拉取）+ 发布（编辑端推送 GitHub）
 *  架构：data/published.json 是云端主库快照，随 Cloudflare Pages 一起发布（源文件在 GitHub）；
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

  /* ---- 访客端题库拉取可靠性（2026-09-13 P1 修复）----
     published.json 约 1.5MB，弱网下 8 秒很可能拉不完；而此前 fetchT 无重试、
     fetchRemote 超时直接返回 null，访客会**静默停在 seed 的 99 道题**且毫无提示。
     现在：单次超时提到 25s + 最多 3 次退避重试，失败原因留在 C._lastFetch，
     由 app.js 决定是否提示用户并安排重试。 */
  const FETCH_MS = 8000;         // 非关键调用（发布守卫/对比/导出）单次超时
  const FETCH_MS_FULL = 25000;   // 首次全量题库单次超时
  const FETCH_TRIES = 3;         // 同步关键路径尝试次数
  const FETCH_TRIES_QUICK = 2;   // 非关键路径尝试次数
  const SEED_ONLY_MAX = 400;     // 本机题数 ≤ 此值且从未同步过 => 视为「只有种子库」

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
    if (!on) { C._dirty = false; unbindUnload(); clearTimeout(C._timer); C._emit(); }
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

  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

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

  /* ---------- 拉取云端快照 ----------
     契约不变：失败仍 return null（调用方都按 falsy 处理），但会把最近一次结果
     写入 C._lastFetch，让上层能区分「云端确实没有这个文件」与「网络失败/超时」。
     opts.timeout / opts.attempts 可控重试策略，默认走「首次全量」档（25s × 3）。 */
  C._lastFetch = { ok: false, reason: "", attempts: 0, at: 0 };
  C.lastFetch = function () { return C._lastFetch; };

  C.fetchRemote = async function (noCache, opts) {
    const o = opts || {};
    const attempts = Math.max(1, o.attempts || FETCH_TRIES);
    const timeout = o.timeout || FETCH_MS_FULL;
    const url = FILE_PATH + (noCache ? "?v=" + Date.now() : "");
    const init = noCache ? { cache: "no-store" } : undefined;
    let reason = "", tries = 0;
    for (let i = 0; i < attempts; i++) {
      tries = i + 1;
      try {
        const r = await fetchT(url, init, timeout);
        if (r.ok) {
          const j = await r.json();
          /* version 兼容：历史快照恒为 1；2026-08-27 起扩充流水线每次合并会递增，
             因此只要求是正整数，不再限定 ===1 */
          if (j && Number.isInteger(j.version) && j.version >= 1 && Array.isArray(j.questions)) {
            C._lastFetch = { ok: true, reason: "", attempts: i + 1, at: Date.now(), count: j.questions.length };
            return j;
          }
          reason = "badPayload";
        } else {
          reason = "http" + r.status;
          /* 404/403：云端确实没有这个文件，重试无意义 */
          if (r.status === 404 || r.status === 403) break;
        }
      } catch (e) {
        reason = (e && e.name === "AbortError") ? "timeout" : ((e && e.message) || "network");
      }
      if (i < attempts - 1) await sleep(900 * (i + 1));   // 退避 0.9s / 1.8s
    }
    C._lastFetch = { ok: false, reason: reason || "unknown", attempts: attempts, at: Date.now() };
    return null;
  };

  /* ---------- 分片加载（2026-10-06 性能优化） ----------
   * 背景：published.json 单文件约 2.9MB（brotl 后约 780KB），访客首屏必须整包拉完。
   * 实测国内访问 CF 全部命中 LAX 机房，TTFB 1.1~6s，弱网下常常拉不完 → 白屏。
   *
   * 方案（只动读路径，写路径一行不改）：
   *   data/manifest.json  —— 全部题目的**元数据**（无answer/body）+ 每题的 _sh 分片号
   *   data/shards/sNN.json —— 答案正文，按 categoryId 分桶、6 片、每片约 137KB br
   * 首屏只拉 manifest（约 123KB br，降 84%），答案在**打开题目时**按需补齐。
   *
   * 三条必须守住的安全线：
   *  ① manifest 缺失 / 版本不符 / 拉取失败 → 静默回退 C.fetchRemote() 整包，功能不降级；
   *  ② published.json **继续正常发布、继续是权威**，编辑端发布、发布守卫、
   *     absorbRemote、verify-publish.py 的语义完全不变；
   *  ③ 分片只影响「本机题目表怎么被填满」，不改变 publishedAt 指纹语义，
   *     所以 version.json 的「指纹没变就跳过」逻辑依旧成立。 */
  const MANIFEST_PATH = "data/manifest.json";
  const SHARD_PATH = "data/shards/";
  const SHARD_TIMEOUT = 12000;
  C._shardCache = {};        /* 分片名 -> questions数组（内存，供同片多题复用） */
  C._shardFailed = {};       /* 分片名 -> true，本次会话内不再重试（避免反复超时拖慢） */

  /* 取一片答案正文。失败返回 null，调用方负责降级。 */
  C.fetchShard = async function (name) {
    if (!name) return null;
    if (C._shardCache[name]) return C._shardCache[name];
    if (C._shardFailed[name]) return null;
    try {
      const r = await fetchT(SHARD_PATH + name + ".json", { cache: "no-cache" }, SHARD_TIMEOUT);
      if (!r.ok) { C._shardFailed[name] = true; return null; }
      const j = await r.json();
      if (!j || !Array.isArray(j.questions)) { C._shardFailed[name] = true; return null; }
      C._shardCache[name] = j.questions;
      return j.questions;
    } catch (e) {
      C._shardFailed[name] = true;
      return null;
    }
  };

  /* 按题号取出该题：先看分片缓存，miss 则拉整片。取不到返回 null。
     分片号来源有三个层次（可靠性递减）：
       ① 调用方直接给的 meta._sh
       ② 本次会话缓存的 manifest 索引（C._manifestById）
       ③ 持久化在 settings 里的 shardMap —— **刷新页面后靠它**。
     ③ 是必需的：metaOnly 首访写入本机的题目不带 _sh（那是内部字段，不该进题库数据），
     若只靠内存索引，用户一刷新就再也定位不到答案所在的分片，永远补不回来。 */
  C.ensureQuestionBody = async function (qid, optMeta) {
    const id = Number(qid);
    if (!id) return null;
    let shard = null;
    const meta = optMeta || (C._manifestById && C._manifestById[id]);
    if (meta && meta._sh) shard = meta._sh;
    if (!shard) {
      try {
        if (!C._shardMap) C._shardMap = (await DB.getSetting("shardMap")) || {};
        shard = C._shardMap[id];
      } catch (_) { /* 取不到就返回 null，调用方按「没答案」渲染 */ }
    }
    if (!shard) return null;
    const arr = await C.fetchShard(shard);
    if (!arr) return null;
    for (let i = 0; i < arr.length; i++) {
      if (Number(arr[i].id) === id) return arr[i];
    }
    return null;
  };

  /* 用 manifest + 分片组装出一个「与 fetchRemote 同构」的快照对象。
     这样 applyRemote / absorbRemote 等下游函数一行都不用改。 */
  C.fetchManifestSnapshot = async function (noCache, opt) {
    const o = opt || {};
    const mb = o.manifestBytes || 20000;   /* manifest 约 123KB br，给足 20s */
    const url = MANIFEST_PATH + (noCache ? "?v=" + Date.now() : "");
    let m;
    try {
      const r = await fetchT(url, noCache ? { cache: "no-store" } : undefined, mb);
      if (!r.ok) return null;
      m = await r.json();
    } catch (e) { return null; }
    if (!m || m.schema !== "manifest-v1" || !Array.isArray(m.questions)) return null;
    /* ⚠️ 这里曾经用 version.json 的 count 做硬校验（题数必须严格相等），
       结果是**分片功能线上从未生效过**：线上 version.json 报 1519 题、
       而题库实际 1540 题（两个发布流程各写各的，天然会漂移），
       校验永远失败 → 每次都静默回退整包 published.json（2.9MB）。
       教训：不要用「另一个可独立变化的文件」去校验本文件的正确性。

       现在改为校验 manifest 与分片的**自洽性**（见下面拉完分片后的题数比对）——
       manifest 与 shards 由 tools/split-published.py 一次产出，它们之间必须一致，
       这个约束才是真正有意义的。外部指纹只用于「要不要重新下载」的判断，
       不该拿来决定「这份数据能不能用」。 */
    if (!Array.isArray(m.shards) || !m.shards.length) return null;
    C._shardNames = m.shards.slice();      /* 记下来，供后台补齐答案时用 */

    /* ---- metaOnly：首访专用，只拿元数据不拿答案 ----
       为什么首访要这样：实测首访若把 manifest + 全部 6 片都拉下来要 3.4MB 原文，
       比整包 published.json(1.64MB) **还多**（分片的价值在回访者的「指纹没变就跳过」，
       对首访反而是负优化）。而首屏真正需要的只是「有哪些题、标题/分类/难度」——
       列表、筛选、统计全靠元数据就能渲染。
       所以首访只拉 manifest（br 约 123KB），答案改成：
         · 打开某道题时按片懒加载（C.ensureQuestionBody，已有）
         · 首屏渲染完成后在后台静默补齐（C.hydrateAnswers）
       这样首访传输量从 3.4MB 降到约 0.9MB 原文（br 约 123KB）。 */
    if (o.metaOnly) {
      C._manifestById = {};
      for (const q of m.questions) C._manifestById[Number(q.id)] = q;
      const metaQuestions = m.questions.map(meta => {
        const c = Object.assign({}, meta);
        delete c._sh;
        /* answer 留空：由懒加载 / 后台补齐填上。绝不能留 undefined，
           否则下游 `(q.answer || "")` 之外的原地拼接会产出 "undefined"。 */
        if (c.answer == null) c.answer = "";
        if (c.body == null) c.body = "";
        return c;
      });
      return {
        version: m.version,
        publishedAt: m.publishedAt,
        categories: m.categories || [],
        positions: m.positions || [],
        positionSkills: m.positionSkills || [],
        questions: metaQuestions,
        removedQuestions: m.removedQuestions || {},
        _fromManifest: true,
        _metaOnly: true
      };
    }

    /* 并发拉全部答案分片。6 片各约 137KB br，并发比串行快得多。 */
    const names = Array.isArray(m.shards) ? m.shards : [];
    const got = await Promise.all(names.map(n => C.fetchShard(n).catch(() => null)));

    /* ⚠️ 严格的一票否决：只要有**任何一片**没拉下来，整个 manifest 快照直接作废，
       回退整包 published.json。
       为什么不能「部分接受」——applyRemote 是整包替换本机题库，编辑端还会把它
       推回云端。若带着「部分题目 answer 为空」的快照做替换，等于用空答案覆盖了
       云端的好答案，而且题数没减少，guardAgainstShrink 拦不住。
       宁可多下一次 780KB，也不能出现这种静默降质。 */
    const missShards = names.filter((n, i) => !got[i]);
    if (names.length && missShards.length) return null;

    /* 自洽校验：所有分片的题目数之和必须等于 manifest 声明的题数。
       两者由同一次 split-published.py 产出，对不上就说明 manifest 与 shards
       不是同一批（例如只重发了其中一个），此时拼出来的快照会缺题 —— 弃用。 */
    let shardTotal = 0;
    for (const g of got) shardTotal += g ? g.length : 0;
    if (shardTotal !== m.questions.length) {
      console.warn("[cloud] manifest 与分片题数不一致，回退整包：manifest=" +
        m.questions.length + " shards=" + shardTotal);
      return null;
    }

    /* 以 manifest 元数据为骨架，叠加分片里的 answer/body 字段。
       合并策略：manifest 打底（保证 id/title/categoryId 等一定在），
       分片里同id 的对象用它的 answer/body/firstPrinciples 覆盖。 */
    const byId = {};
    names.forEach((n, i) => {
      const arr = got[i];
      if (!arr) return;
      for (const q of arr) byId[Number(q.id)] = q;
    });
    const questions = m.questions.map(meta => {
      const body = byId[Number(meta.id)];
      if (!body) return null;               /* 理论到不了这里（一票否决已拦），留作兜底 */
      const merged = Object.assign({}, meta, body);
      delete merged._sh;
      /* 分片里的 remark 是本机批注，不该从云端来（历史行为就是不带 remark 的） */
      if (merged.remark == null) delete merged.remark;
      return merged;
    }).filter(Boolean);

    C._manifestById = {};
    for (const q of m.questions) C._manifestById[Number(q.id)] = q;

    return {
      version: m.version,
      publishedAt: m.publishedAt,
      categories: m.categories || [],
      positions: m.positions || [],
      positionSkills: m.positionSkills || [],
      questions: questions,
      removedQuestions: m.removedQuestions || {},
      _fromManifest: true,
      _missShards: missShards
    };
  };

  /* fetchRemote 的分片版：优先走 manifest，失败自动回退整包。
     这是所有读路径的唯一入口。 */
  C.fetchSnapshot = async function (noCache, opts) {
    if (!(opts && opts.forceFull)) {
      const snap = await C.fetchManifestSnapshot(noCache, opts);
      if (snap) {
        C._lastFetch = { ok: true, reason: "", attempts: 1, at: Date.now(), count: snap.questions.length, viaManifest: true };
        return snap;
      }
      /* manifest 不可用 → 落到整包，绝不因此让访客停在种子库 */
      C._manifestMiss = (C._manifestMiss || 0) + 1;
    }
    return C.fetchRemote(noCache, opts);
  };

  /* ---------- 后台补齐答案（2026-10-06 首访优化配套） ----------
   * 首访只拉了 manifest（元数据），答案为空。等首屏渲染完之后，在后台把 6 个分片
   * 依次拉回来写进本机表，让后续的详情页/搜索/离线都有完整内容。
   *
   * 安全约束（重要）：
   *  ① 只在「刚刚 metaOnly 写入过」的情况下调用一次，由 _needHydrate 标记控制。
   *     这样它面对的必然是刚写入的干净元数据，不会覆盖用户自己的改动。
   *  ② 用 update 而不是 bulkPut：只动 answer/body，绝不触碰用户可能改过的
   *     其他字段（remark 本机批注、views/favorites 等计数）。
   *  ③ 单片失败不影响其余片，也不重试（弱网下重试只会更慢）；失败的片留给
   *     详情页懒加载兜底（C.ensureQuestionBody 会现场去取）。
   *  ④ 全程静默：不弹 toast。用户没点任何东西，不该被打扰。 */
  C._needHydrate = false;
  C.hydrateAnswers = async function () {
    if (!C._needHydrate) return { hydrated: 0, reason: "notNeeded" };
    const names = C._shardNames || [];
    if (!names.length) { C._needHydrate = false; return { hydrated: 0, reason: "noShards" }; }
    const db = DB.db;
    let updated = 0, failed = 0;
    for (const name of names) {
      const arr = await C.fetchShard(name);
      if (!arr || !arr.length) { failed++; continue; }
      try {
        /* ⚠️ 这里必须「先读本机记录 → 合并 answer/body → bulkPut」，不能逐条 update。
           初版写成 `for (q of arr) await db.questions.update(q.id, {...})`，
           1540 条就是 1540 次索引查找+写入，实测把主线程压死（首屏内容就绪从
           8.6s 恶化到 13.7s，长任务 19→45 个）——后台任务抢占了前台渲染。
           现在改成一次 bulkGet + 一次 bulkPut：
             · 保留本机其余字段（用户批注 remark、views/favorites 计数等）不被覆盖；
             · 一个事务写完整片，主线程占用降到可忽略。 */
        const ids = arr.map(q => Number(q.id)).filter(Boolean);
        const locals = await db.questions.bulkGet(ids);
        const localMap = new Map();
        for (const rec of locals) if (rec) localMap.set(Number(rec.id), rec);
        const merged = arr.map(q => {
          const id = Number(q.id);
          const local = localMap.get(id);
          if (!local) return q;                       /* 本机没有就整条写入 */
          return Object.assign({}, local, {           /* 有则只覆盖答案正文两字段 */
            answer: q.answer == null ? "" : q.answer,
            body: q.body == null ? "" : q.body
          });
        });
        await db.questions.bulkPut(merged);
        updated += merged.length;
      } catch (e) {
        failed++;
        console.warn("[cloud] 分片补齐失败:", name, e && e.message);
      }
      /* 让出一帧再做下一片，避免长时间占住主线程影响用户操作 */
      await new Promise(r => setTimeout(r, 0));
    }
    C._needHydrate = false;
    if (updated) {
      try { await Services.reload(); } catch (_) {}
      try { if (C._emit) C._emit(); } catch (_) {}
    }
    C._lastHydrate = { updated, failed, at: Date.now() };
    return { hydrated: updated, failed };
  };

  /* ---------- 版本指纹（20261005a 数据瘦身） ----------
   * data/version.json 是 ~120B 的轻量指纹 {version, publishedAt, count, rmCount}，
   * 与 published.json 同步发布（编辑端 _publishInner 与扩充流水线都会写）。
   * 启动同步 / 增量吸收 / 发布守卫先取它：指纹没变 → 跳过全量下载；
   * 指纹缺失或解析失败 → 回退全量拉取（完全兼容旧快照，不会因缺指纹而失灵）。
   * 判定用「严格相等」而非 <=：万一某次 version.json 发布失败停留在旧值，
   * 本地较新时会走全量拉取自愈，绝不会因 stale 指纹漏更新。 */
  C.META_PATH = "data/version.json";
  C.fetchMeta = async function () {
    try {
      const r = await fetchT(C.META_PATH + "?v=" + Date.now(), { cache: "no-store" }, 6000);
      if (!r.ok) return null;
      const j = await r.json();
      if (j && Number.isInteger(j.publishedAt) && j.publishedAt >= 0 && Number.isInteger(j.count)) return j;
      return null;
    } catch (e) { return null; }
  };
  /* 由快照对象构造指纹文本（发布侧复用，保证两端字段一致） */
  C.metaOf = function (data) {
    return JSON.stringify({
      version: data.version || 1,
      publishedAt: data.publishedAt || 0,
      count: (data.questions || []).length,
      rmCount: (data.removedQuestions && typeof data.removedQuestions === "object") ? Object.keys(data.removedQuestions).length : 0
    });
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
    /* 数据瘦身（20261005a）：指纹与本地一致时直接跳过，不下载 2.8MB 全量快照。
       仅在「曾同步过」时可用此捷径；首次访客仍走全量流程 */
    try {
      const local0 = await DB.getSetting("cloudSyncedAt");
      if (local0 != null) {
        const meta0 = await C.fetchMeta();
        if (meta0 && (meta0.publishedAt || 0) === (local0 || 0)) {
          return { skipped: true, reason: "upToDate", light: true };
        }
      }
    } catch (e) { /* 指纹判定失败不阻断，走原全量流程 */ }
    /* 首访（justSeeded）走 metaOnly：只拿题目元数据，答案交给懒加载 + 后台补齐。
       非首访（指纹变了的老访客）仍取完整数据——他们本机已有答案，缺一块反而不好。 */
    const data = await C.fetchSnapshot(false, justSeeded ? { metaOnly: true } : undefined);
    if (!data) {
      const st = C._lastFetch || {};
      /* 区分「云端没有快照」与「网络失败」：后者意味着访客可能只拿到本机种子库，
         必须让上层能感知（提示用户 + 安排重试），而不是静默按「无云端」处理 */
      if (!st.ok && st.reason !== "http404" && st.reason !== "http403") {
        return { failed: true, reason: "fetchFailed", detail: st.reason, attempts: st.attempts };
      }
      return { skipped: true, reason: "noCloud" };
    }
    const local = await DB.getSetting("cloudSyncedAt");
    const hasSynced = local != null;
    if ((data.publishedAt || 0) <= (local || 0)) return { skipped: true, reason: "upToDate" };
    if (!hasSynced && !justSeeded) {
      /* 上次全量拉取失败过的话，本机就是「清一色种子题」——没有需要保护的用户数据，
         直接采用云端版本（否则访客刷新多少次都停在 99 题，还得自己找到设置页）；
         确实存在用户自己的数据时才走 pending，让用户手动确认 */
      if (!(await C.looksUnseeded())) return { pending: true, count: (data.questions || []).length };
      await C.applyRemote(data);
      if (data._metaOnly) await C._markMetaOnly();   /* 答案待后台补齐 */
      return { applied: true, count: (data.questions || []).length, recovered: true, metaOnly: !!data._metaOnly };
    }
    await C.applyRemote(data);
    if (data._metaOnly) await C._markMetaOnly();     /* 答案待后台补齐 */
    return { applied: true, count: (data.questions || []).length, metaOnly: !!data._metaOnly };
  };

  /* metaOnly 写入后要做的两件事：标记待补齐 + 持久化「题号→分片」映射。
     映射必须落盘，否则刷新页面后懒加载找不到分片（详见 ensureQuestionBody 注释）。 */
  C._markMetaOnly = async function () {
    C._needHydrate = true;
    try {
      const map = {};
      for (const q of (C._manifestById ? Object.values(C._manifestById) : [])) {
        if (q && q._sh) map[q.id] = q._sh;
      }
      if (Object.keys(map).length) {
        await DB.setSetting("shardMap", map);
        C._shardMap = map;
      }
    } catch (e) { console.warn("[cloud] shardMap 持久化失败（详情页懒加载将退回后台补齐结果）", e && e.message); }
  };

  /* 手动立即同步（设置页按钮）：强制采用云端版本，覆盖本地题库 */
  C.syncNow = async function () {
    const data = await C.fetchSnapshot(true);
    if (!data) throw new Error("云端题库不存在或无法访问（" + ((C._lastFetch || {}).reason || "未知原因") + "）");
    await C.applyRemote(data);
    return data;
  };

  /* ---------- 首次访客题库不完整的判定与恢复（2026-09-13 P1 修复） ----------
     弱网下首次全量拉取失败，访客会停在本机 seed 的 99 道题却毫无察觉。
     判定「疑似只有种子库」：非编辑端 + 从未成功同步过（cloudSyncedAt 缺失）
     + 本机题数 ≤ SEED_ONLY_MAX 且**所有题的 source 都是 seed**。
     最后一条是关键护栏：只有「清一色种子题」才允许静默覆盖，用户自己导入/AI 生成的
     题目（source 为 import/ai/manual/URL…）一律视为真实数据，仍走 pending 让用户确认。 */
  C.looksUnseeded = async function () {
    if (C.isEditor()) return false;
    try {
      if ((await DB.getSetting("cloudSyncedAt")) != null) return false;
      const n = await DB.db.questions.count();
      if (!(n > 0 && n <= SEED_ONLY_MAX)) return false;
      const foreign = await DB.db.questions.filter(q => (q.source || "") !== "seed").count();
      return foreign === 0;
    } catch (e) { return false; }
  };

  C.recoverIncompleteSync = async function () {
    if (!(await C.looksUnseeded())) return { skipped: true, reason: "notSeedOnly" };
    const data = await C.fetchSnapshot(true);
    if (!data) return { failed: true, detail: (C._lastFetch || {}).reason || "" };
    await C.applyRemote(data);
    return { applied: true, count: (data.questions || []).length };
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
    /* NORM_VER：norm 规则变更（v2 改 Unicode 感知）后对老本地库强制重放一次吸收，
       修复旧版把中文标题剥空导致漏吸收的题 */
    const NORM_VER = 2;
    let run = !!force;
    try { if ((await DB.getSetting("absorbNormVer")) !== NORM_VER) run = true; } catch (_) {}
    const last = await DB.getSetting("absorbedRemoteAt") || 0;
    let rmApplied = 0;
    try { rmApplied = (await DB.getSetting("removedApplied")) || 0; } catch (_) {}
    /* 数据瘦身（20261005a）：指纹（publishedAt + rmCount 双字段严格相等）没变时，
       编辑端启动不再下载 2.8MB 全量快照。任一条件不确定 → 回退全量拉取走原逻辑 */
    if (!run && last > 0) {
      const meta0 = await C.fetchMeta();
      if (meta0 && (meta0.publishedAt || 0) === last && (meta0.rmCount || 0) === rmApplied) {
        return { added: 0, reason: "upToDate", light: true };
      }
    }
    const remote = await C.fetchRemote(false, { attempts: 2, timeout: 15000 });
    if (!remote || !Array.isArray(remote.questions)) return { added: 0, reason: "noCloud" };
    /* 重复题清理标记：云端 removedQuestions 条数与本机已应用的不一致时，即使快照时间戳没变也要跑一次 */
    const remoteRmCount = (remote.removedQuestions && typeof remote.removedQuestions === "object")
      ? Object.keys(remote.removedQuestions).length : 0;
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
    try { remote = await C.fetchRemote(false, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS }); } catch (e) {}
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
    /* 数据瘦身（20261005a）：优先用指纹里的 count 比对，省一次 2.8MB 全量拉取；
       指纹不可用时回退全量快照（旧版行为） */
    const meta = await C.fetchMeta();
    if (meta && Number.isInteger(meta.count)) {
      if (meta.count > localCount) {
        return "本机 " + localCount + " 题 < 云端 " + meta.count + " 题（少 " + (meta.count - localCount) +
          " 题），已拒绝发布——直接用本机覆盖会把云端这些题删掉。" +
          "请先点「从云端拉取到本机」；确属删题场景，请先拉取，再在本机删除后发布。";
      }
      return null;
    }
    let remote = null;
    try { remote = await C.fetchRemote(true, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS }); } catch (e) {}
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
    /* 重复题映射必须随快照一起发布（2026-09-11 修复）：
       读取侧（applyRemovedQuestions / absorbRemote）一直都认这个字段，唯独发布侧漏了，
       于是编辑端每自动发布一次就把云端的映射整体抹掉。映射一没：被合并的重复题会被
       其它编辑端整包推回「题数不减、发布守卫拦不住」，用户本地的收藏/错题记录也会
       重新变成指向不存在题目的死记录。
       合并策略与 guardAgainstShrink 同源：以云端为底、叠加本机累积的 removedMap，
       只增不减；两端都读不到来源时干脆不写这个键，避免凭空造空对象覆盖云端。 */
    let merged = {};
    let haveSource = false;
    try {
      const remote = await C.fetchRemote(true, { attempts: FETCH_TRIES_QUICK, timeout: FETCH_MS });
      if (remote && remote.removedQuestions && typeof remote.removedQuestions === "object") {
        merged = Object.assign(merged, remote.removedQuestions);
        haveSource = true;   /* 云端可达即以其为权威基线（含「确实为空」的情形） */
      }
    } catch (e) { /* 云端不可达：退化为只用本机累积，不阻断发布 */ }
    try {
      const local = await C.getRemovedMap();
      if (local && typeof local === "object" && Object.keys(local).length) {
        merged = Object.assign(merged, local);
        haveSource = true;
      }
    } catch (e) {}
    const out = {
      version: 1,
      publishedAt: Date.now(),
      categories: categories,
      positions: positions,
      positionSkills: positionSkills,
      questions: questions
    };
    if (haveSource) out.removedQuestions = merged;
    return out;
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
      /* 同步发布 ~120B 版本指纹（20261005a 数据瘦身）：访客/编辑端启动据此跳过全量下载。
         失败不阻断发布主流程——指纹缺失时读取端自动回退全量拉取 */
      try { await C.putFile(C.META_PATH, C.metaOf(data), msg, br); }
      catch (e) { console.warn("version.json 发布失败（下次发布会重试）:", e); }
    }
    /* ⚠️ 2026-10-06新增：data/manifest.json 与 data/shards/*.json 是首屏优化的运行时依赖，
       它们由仓库侧 `python tools/split-published.py --write` 从 published.json 生成，
       **不会**被这里推送（一次 Contents API PUT 只能写一个文件，分片有6 个）。
       所以本机题库一旦发布，仓库里的分片就落后了。
       好在读取端有两道兜底：manifest 题数与 version.json 的 count 不一致即弃用 manifest，
       任一分片缺失也直接回退整包 —— 表现为「功能正常但首屏慢」，不会出错题。
       要恢复优化效果，在仓库执行：
         python tools/split-published.py --write && git add -A data/ && git commit -m "同步题库分片"
       详见 docs/性能诊断-20261006.md。 */
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
  unbindUnload();
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
    bindUnload();
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
      unbindUnload();
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
      if (e && e.guardBlocked) { C._dirty = false; unbindUnload(); }
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

  /* 初始化：编辑端启用钩子 + 徽章轮询（关页提醒改为按需绑定，见下） */
  C.initAuto = function () {
    if (C.isEditor() && C.autoEnabled()) C.installHooks();
    setInterval(() => C._renderChip(), 3000);   // topbar 重渲染后恢复徽章
    C._renderChip();
  };

  /* 关页前提醒：仅在「编辑端 + 自动发布已开 + 有未发布改动」时才挂 beforeunload 监听。
     之前无条件注册，会让每个访客（尤其是未登录用户）都触发 Chrome 的
     "[Violation] Permissions policy violation: unload is not allowed in this document" 告警。
     改为脏标记产生时才绑定、清理后立即解绑，正常访客与登录但未改动的访客都不会挂监听。 */
  /* 用 C._unloadBound 记录监听是否挂载（避免用外层 let 触发 TDZ：
     initAuto 定义在先，而 C._dirty 初始化时就会调用 unbindUnload） */
  function onBeforeUnload(e) {
    if (C._dirty && C.isEditor() && C.autoEnabled()) {
      e.preventDefault();
      e.returnValue = "题库有未发布的改动，关闭后将无法自动上云（下次打开会重试）。确定离开？";
      return e.returnValue;
    }
  }
  function bindUnload() {
    if (C._unloadBound || !C.isEditor() || !C.autoEnabled()) return;
    C._unloadBound = true;
    window.addEventListener("beforeunload", onBeforeUnload);
  }
  function unbindUnload() {
    if (!C._unloadBound) return;
    C._unloadBound = false;
    window.removeEventListener("beforeunload", onBeforeUnload);
  }

  if (typeof window !== "undefined") window.Cloud = C;
})();
