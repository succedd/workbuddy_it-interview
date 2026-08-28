// IT面试题库 — 后端（Cloudflare Worker + KV 统计 + D1 用户系统）
// 功能 A（KV）：全局访问计数（总/当日）、访客国家地理、题目浏览计数。
// 功能 B（D1）：用户注册/登录、个人数据云同步（收藏/历史/错题本）、管理员帐号管理。
//
// 接口：
//   POST /visit           记录一次访问（自动按 request.cf 记录国家）
//   POST /view?id=123     记录一次题目浏览
//   GET  /stats           返回聚合 JSON：{ total, today, byCountry, topCities, topQuestions, updatedAt }
// 可选环境变量 STATS_KEY：若设置，则上述接口需带 ?k= 一致才接受（防刷）。
//
// 用户系统接口（D1，无需 STATS_KEY）：
//   POST /auth/register   {email, password, nick?}          -> {token, user}
//   POST /auth/login      {email, password}                 -> {token, user}
//   POST /auth/logout     （Authorization: Bearer token）
//   GET  /auth/me         -> {user}
//   GET  /me/data         -> {favorites, histories, weak}    （登录后整包拉取）
//   PUT  /me/data         {favorites, histories, weak}       （整包覆盖式合并上传）
// 管理员接口（role=admin）：
//   GET  /admin/users                       -> 用户列表
//   POST /admin/users/:id/status  {status}   -> 1 启用 / 0 禁用
//   POST /admin/users/:id/reset   {password} -> 重置密码

const MAX_TOP = 20;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

async function inc(env, key, by = 1) {
  const cur = parseInt((await env.STATS.get(key)) || "0", 10) || 0;
  const next = cur + by;
  await env.STATS.put(key, String(next));
  return next;
}

async function handleVisit(env, request) {
  await inc(env, "total");
  await inc(env, "daily:" + dayKey());
  const cf = request.cf || {};
  const country = (cf.country || "XX").toUpperCase();
  await inc(env, "geo:" + country);
  if (cf.city) await inc(env, "city:" + country + ":" + cf.city);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

async function handleView(env, request) {
  const url = new URL(request.url);
  let id = url.searchParams.get("id");
  if (!id) {
    try { const b = await request.json(); id = b && b.id; } catch (_) {}
  }
  if (!id) return new Response("missing id", { status: 400, headers: corsHeaders() });
  const n = await inc(env, "views:" + id);
  return new Response(JSON.stringify({ ok: true, views: n }), {
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

async function handleStats(env) {
  const total = parseInt((await env.STATS.get("total")) || "0", 10) || 0;
  const today = parseInt((await env.STATS.get("daily:" + dayKey())) || "0", 10) || 0;

  const byCountry = {};
  const geoList = await env.STATS.list({ prefix: "geo:" });
  for (const k of geoList.keys) {
    const code = k.name.slice(4);
    byCountry[code] = parseInt((await env.STATS.get(k.name)) || "0", 10) || 0;
  }

  const cities = [];
  const cityList = await env.STATS.list({ prefix: "city:" });
  for (const k of cityList.keys) {
    cities.push({ name: k.name.slice(5), views: parseInt((await env.STATS.get(k.name)) || "0", 10) || 0 });
  }
  cities.sort((a, b) => b.views - a.views);

  const views = [];
  const viewList = await env.STATS.list({ prefix: "views:" });
  for (const k of viewList.keys) {
    views.push({ id: k.name.slice(6), views: parseInt((await env.STATS.get(k.name)) || "0", 10) || 0 });
  }
  views.sort((a, b) => b.views - a.views);

  return new Response(JSON.stringify({
    total, today, byCountry,
    topCities: cities.slice(0, 15),
    topQuestions: views.slice(0, MAX_TOP),
    updatedAt: Date.now(),
  }), { headers: { "content-type": "application/json", ...corsHeaders() } });
}

async function authOk(env, request) {
  if (!env.STATS_KEY) return true;
  return new URL(request.url).searchParams.get("k") === env.STATS_KEY;
}

/* ============================ 用户系统（D1） ============================ */

const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;   // token 有效期 30 天
const PBKDF2_ITER = 100000;

function b64ToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function hashPassword(password, saltHex) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: PBKDF2_ITER, hash: "SHA-256" },
    keyMaterial, 256);
  return b64ToHex(bits);
}

function randomHex(nBytes) { return b64ToHex(crypto.getRandomValues(new Uint8Array(nBytes))); }

function validEmail(s) { return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 120; }
function validPassword(s) { return typeof s === "string" && s.length >= 8 && s.length <= 72; }

/* 简易 IP 限流：同一 IP 每 60 秒最多 20 次 auth 请求（D1 计数，窗口自清理） */
async function rateLimitOk(db, ip) {
  const now = Date.now();
  const row = await db.prepare(
    "SELECT cnt, window_start FROM rl_auth WHERE ip = ?").bind(ip).first();
  if (!row || now - row.window_start > 60000) {
    await db.prepare(
      "INSERT INTO rl_auth (ip, cnt, window_start) VALUES (?, 1, ?) " +
      "ON CONFLICT(ip) DO UPDATE SET cnt=1, window_start=?")
      .bind(ip, now, now).run();
    return true;
  }
  if (row.cnt >= 20) return false;
  await db.prepare("UPDATE rl_auth SET cnt = cnt + 1 WHERE ip = ?").bind(ip).run();
  return true;
}

function publicUser(u) {
  return { id: u.id, email: u.email, nick: u.nick, role: u.role, status: u.status,
           createdAt: u.created_at, lastLoginAt: u.last_login_at };
}

/* 解析会话 token：优先 Authorization: Bearer（64 位 hex），
   兼容 ?token= 查询参数（sendBeacon 无法携带自定义 header，兜底上传用）。
   两处均用 64 位 hex 白名单校验，杜绝注入风险。 */
function extractToken(request) {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+([0-9a-f]{64})$/i.exec(h.trim());
  if (m) return m[1];
  const t = new URL(request.url).searchParams.get("token") || "";
  return /^[0-9a-f]{64}$/i.test(t) ? t : null;
}

/* 从 Authorization/查询参数解析会话，返回 user 行或 null */
async function sessionUser(db, request) {
  const token = extractToken(request);
  if (!token) return null;
  const now = Date.now();
  const row = await db.prepare(
    "SELECT u.* , s.expires_at AS sess_exp FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?")
    .bind(token).first();
  if (!row || row.sess_exp < now || row.status !== 1) return null;
  return row;
}

async function requireAdmin(db, request) {
  const u = await sessionUser(db, request);
  if (!u || u.role !== "admin") return null;
  return u;
}

/* ---------- 注册 / 登录 / 会话 ---------- */

async function handleRegister(env, request) {
  const db = env.USERS;
  const ip = (request.headers.get("cf-connecting-ip") || "x");
  if (!await rateLimitOk(db, ip)) return jsonResp({ error: "请求过于频繁，稍后再试" }, 429);

  let body;
  try { body = await request.json(); } catch (_) { return jsonResp({ error: "参数错误" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = body.password;
  const nick = String(body.nick || "").trim().slice(0, 40);
  if (!validEmail(email)) return jsonResp({ error: "邮箱格式不正确" }, 400);
  if (!validPassword(password)) return jsonResp({ error: "密码需 8-72 位" }, 400);

  const exists = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (exists) return jsonResp({ error: "该邮箱已注册" }, 409);

  const salt = randomHex(16);
  const passHash = await hashPassword(password, salt);
  const now = Date.now();

  /* 首个注册用户自动成为管理员，方便开局 */
  const any = await db.prepare("SELECT id FROM users LIMIT 1").first();
  const role = any ? "user" : "admin";

  const res = await db.prepare(
    "INSERT INTO users (email, nick, pass_hash, salt, role, status, created_at, last_login_at) " +
    "VALUES (?, ?, ?, ?, ?, 1, ?, ?)")
    .bind(email, nick, passHash, salt, role, now, now).run();

  const uid = res.meta.last_row_id;
  const token = randomHex(32);
  await db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(token, uid, now + SESSION_TTL_MS, now).run();

  return jsonResp({ token, user: { id: uid, email, nick, role } }, 201);
}

async function handleLogin(env, request) {
  const db = env.USERS;
  const ip = (request.headers.get("cf-connecting-ip") || "x");
  if (!await rateLimitOk(db, ip)) return jsonResp({ error: "请求过于频繁，稍后再试" }, 429);

  let body;
  try { body = await request.json(); } catch (_) { return jsonResp({ error: "参数错误" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const u = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  /* 统一报错文案，避免枚举邮箱 */
  if (!u) return jsonResp({ error: "邮箱或密码不正确" }, 401);
  if (u.status !== 1) return jsonResp({ error: "帐号已被禁用，请联系管理员" }, 403);
  const calc = await hashPassword(password, u.salt);
  if (calc !== u.pass_hash) return jsonResp({ error: "邮箱或密码不正确" }, 401);

  const now = Date.now();
  const token = randomHex(32);
  await db.batch([
    db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(token, u.id, now + SESSION_TTL_MS, now),
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now, u.id),
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),   // 顺手清过期会话
  ]);
  return jsonResp({ token, user: publicUser(u) });
}

async function handleLogout(env, request) {
  const m = /^Bearer\s+([0-9a-f]{64})$/i.exec((request.headers.get("Authorization") || "").trim());
  if (m) await env.USERS.prepare("DELETE FROM sessions WHERE token = ?").bind(m[1]).run();
  return jsonResp({ ok: true });
}

async function handleMe(env, request) {
  const u = await sessionUser(env.USERS, request);
  if (!u) return jsonResp({ error: "未登录或登录过期" }, 401);
  return jsonResp({ user: publicUser(u) });
}

/* ---------- 个人数据云同步：favorites / histories / weak / daily（每日打卡） ---------- */

async function handleGetMyData(env, request) {
  const db = env.USERS;
  const u = await sessionUser(db, request);
  if (!u) return jsonResp({ error: "未登录或登录过期" }, 401);
  const [fav, his, weak] = await db.batch([
    db.prepare("SELECT question_id AS id, created_at AS at FROM favorites WHERE user_id = ?").bind(u.id),
    db.prepare("SELECT question_id AS id, views, viewed_at AS at FROM histories WHERE user_id = ?").bind(u.id),
    db.prepare("SELECT question_id AS id, created_at AS at FROM weak_bank WHERE user_id = ?").bind(u.id),
  ]);
  let daily = [];
  try {
    const dr = await db.prepare("SELECT day, question_ids AS ids FROM daily_done WHERE user_id = ?").bind(u.id).all();
    daily = (dr.results || []).map(r => ({ day: r.day, ids: (() => { try { return JSON.parse(r.ids || "[]"); } catch (_) { return []; } })() }));
  } catch (_) { /* daily_done 表尚未建立时静默降级 */ }
  return jsonResp({
    favorites: fav.results || [], histories: his.results || [], weak: weak.results || [],
    daily, syncedAt: Date.now(),
  });
}

async function handlePutMyData(env, request) {
  const db = env.USERS;
  const u = await sessionUser(db, request);
  if (!u) return jsonResp({ error: "未登录或登录过期" }, 401);
  let body;
  try { body = await request.json(); } catch (_) { return jsonResp({ error: "参数错误" }, 400); }

  const now = Date.now();
  const stmts = [];
  const normArr = (v) => Array.isArray(v) ? v.slice(0, 2000) : [];

  for (const f of normArr(body.favorites)) {
    const qid = parseInt(f.id ?? f.questionId); if (!qid) continue;
    stmts.push(db.prepare(
      "INSERT INTO favorites (user_id, question_id, created_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(user_id, question_id) DO NOTHING").bind(u.id, qid, parseInt(f.at) || now));
  }
  for (const h of normArr(body.histories)) {
    const qid = parseInt(h.id ?? h.questionId); if (!qid) continue;
    const views = Math.max(1, Math.min(9999, parseInt(h.views) || 1));
    const at = parseInt(h.at) || now;
    stmts.push(db.prepare(
      "INSERT INTO histories (user_id, question_id, views, viewed_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(user_id, question_id) DO UPDATE SET views = MAX(views, excluded.views), viewed_at = MAX(viewed_at, excluded.viewed_at)")
      .bind(u.id, qid, views, at));
  }
  for (const w of normArr(body.weak)) {
    const qid = parseInt(w.id ?? w.questionId); if (!qid) continue;
    stmts.push(db.prepare(
      "INSERT INTO weak_bank (user_id, question_id, created_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(user_id, question_id) DO NOTHING").bind(u.id, qid, parseInt(w.at) || now));
  }
  if (stmts.length) await db.batch(stmts.slice(0, 1500));   // D1 单批上限保险；核心同步（收藏/历史/错题）独立成批
  /* 每日打卡：独立批处理 + 按天并集，即使 daily_done 表缺失也不影响上面核心同步 */
  let dailyApplied = 0;
  try {
    const dayRe = /^\d{4}-\d{2}-\d{2}$/;
    const existing = await db.prepare("SELECT day, question_ids AS ids FROM daily_done WHERE user_id = ?").bind(u.id).all();
    const map = {};
    for (const r of (existing.results || [])) { try { map[r.day] = JSON.parse(r.ids || "[]"); } catch (_) { map[r.day] = []; } }
    for (const d of (Array.isArray(body.daily) ? body.daily.slice(0, 400) : [])) {
      const day = String(d.day || "");
      if (!dayRe.test(day)) continue;
      const set = new Set([...(map[day] || []), ...(Array.isArray(d.ids) ? d.ids : []).map(v => parseInt(v)).filter(v => v > 0)]);
      map[day] = Array.from(set).slice(0, 50);
    }
    const dStmts = Object.keys(map).map(day => db.prepare(
      "INSERT INTO daily_done (user_id, day, question_ids, updated_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(user_id, day) DO UPDATE SET question_ids = excluded.question_ids, updated_at = excluded.updated_at")
      .bind(u.id, day, JSON.stringify(map[day]), now));
    if (dStmts.length) { await db.batch(dStmts.slice(0, 500)); dailyApplied = dStmts.length; }
  } catch (e) { console.warn("daily sync skipped:", e.message); }
  return jsonResp({ ok: true, applied: stmts.length, dailyApplied });
}

/* ---------- 管理员接口 ---------- */

async function handleAdminUsers(env, request) {
  const db = env.USERS;
  const admin = await requireAdmin(db, request);
  if (!admin) return jsonResp({ error: "需要管理员权限" }, 403);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  let rows;
  if (q) {
    rows = await db.prepare(
      "SELECT * FROM users WHERE lower(email) LIKE ? OR lower(nick) LIKE ? ORDER BY created_at DESC LIMIT 200")
      .bind("%" + q + "%", "%" + q + "%").all();
  } else {
    rows = await db.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT 200").all();
  }
  return jsonResp({ users: (rows.results || []).map(publicUser) });
}

async function handleAdminUserStatus(env, request, targetId) {
  const db = env.USERS;
  const admin = await requireAdmin(db, request);
  if (!admin) return jsonResp({ error: "需要管理员权限" }, 403);
  let body;
  try { body = await request.json(); } catch (_) { return jsonResp({ error: "参数错误" }, 400); }
  const status = parseInt(body.status) === 1 ? 1 : 0;
  if (targetId === admin.id && status === 0)
    return jsonResp({ error: "不能禁用自己" }, 400);
  const r = await db.prepare("UPDATE users SET status = ? WHERE id = ?").bind(status, targetId).run();
  if (!r.meta.changes) return jsonResp({ error: "用户不存在" }, 404);
  if (status === 0) await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(targetId).run();
  return jsonResp({ ok: true, status });
}

async function handleAdminResetPassword(env, request, targetId) {
  const db = env.USERS;
  const admin = await requireAdmin(db, request);
  if (!admin) return jsonResp({ error: "需要管理员权限" }, 403);
  let body;
  try { body = await request.json(); } catch (_) { return jsonResp({ error: "参数错误" }, 400); }
  const password = String(body.password || "");
  if (!validPassword(password)) return jsonResp({ error: "新密码需 8-72 位" }, 400);
  const salt = randomHex(16);
  const passHash = await hashPassword(password, salt);
  const r = await db.prepare("UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?")
    .bind(passHash, salt, targetId).run();
  if (!r.meta.changes) return jsonResp({ error: "用户不存在" }, 404);
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(targetId).run();  // 踢下线
  return jsonResp({ ok: true });
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
    try {
      if (!authOk(env, request)) return new Response("forbidden", { status: 403, headers: corsHeaders() });
      if (p === "/visit" && request.method === "POST") return await handleVisit(env, request);
      if (p === "/view" && request.method === "POST") return await handleView(env, request);
      if (p === "/stats" && request.method === "GET") return await handleStats(env);

      /* ---- 用户系统（D1）---- */
      const db = env.USERS;
      if (db) {
        let m;
        if (p === "/auth/register" && request.method === "POST") return await handleRegister(env, request);
        if (p === "/auth/login" && request.method === "POST") return await handleLogin(env, request);
        if (p === "/auth/logout" && request.method === "POST") return await handleLogout(env, request);
        if (p === "/auth/me" && request.method === "GET") return await handleMe(env, request);
        if (p === "/me/data" && request.method === "GET") return await handleGetMyData(env, request);
        if (p === "/me/data" && request.method === "PUT") return await handlePutMyData(env, request);
        if ((m = /^\/admin\/users\/(\d+)\/status$/.exec(p)) && request.method === "POST")
          return await handleAdminUserStatus(env, request, parseInt(m[1]));
        if ((m = /^\/admin\/users\/(\d+)\/reset$/.exec(p)) && request.method === "POST")
          return await handleAdminResetPassword(env, request, parseInt(m[1]));
        if (p === "/admin/users" && request.method === "GET") return await handleAdminUsers(env, request);
      }
    } catch (e) {
      return new Response("error: " + e.message, { status: 500, headers: corsHeaders() });
    }
    return new Response("not found", { status: 404, headers: corsHeaders() });
  },
};
