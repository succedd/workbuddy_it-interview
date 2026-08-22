// IT面试题库 — 访问统计后端（Cloudflare Worker + KV）
// 功能：全局访问计数（总/当日）、访客国家地理、题目浏览计数。
// 部署见同目录 wrangler.toml 与说明。KV 绑定名必须为 STATS。
//
// 接口：
//   POST /visit           记录一次访问（自动按 request.cf 记录国家）
//   POST /view?id=123     记录一次题目浏览
//   GET  /stats           返回聚合 JSON：{ total, today, byCountry, topCities, topQuestions, updatedAt }
// 可选环境变量 STATS_KEY：若设置，则上述接口需带 ?k= 一致才接受（防刷）。

const MAX_TOP = 20;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    } catch (e) {
      return new Response("error: " + e.message, { status: 500, headers: corsHeaders() });
    }
    return new Response("not found", { status: 404, headers: corsHeaders() });
  },
};
