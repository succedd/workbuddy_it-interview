/* Netlify Functions 反向代理：国内直连桥（workers.dev 在国内被 DNS 投毒 + SNI 阻断，
   手机/无代理环境连不上 Cloudflare Worker；netlify.app 域名国内可直连，
   Netlify 的海外函数服务器可以正常访问 workers.dev，在此转发即可）。
   全路径透传：/auth/login → 上游 /auth/login，方法/头/体/查询串原样转发，
   前端把 API 入口从 workers.dev 换成本站域名即可，零改动。 */

const UPSTREAM = "https://it-interview-stats.iti-interview.workers.dev";

/* 不转发给上游的逐跳头（host 由 fetch 重算，content-length 按新体重算） */
const HOP_HEADERS = new Set([
  "host", "connection", "keep-alive", "transfer-encoding", "upgrade",
  "content-length", "accept-encoding", "cf-connecting-ip", "cf-ipcountry",
  "cf-ray", "cf-visitor", "x-forwarded-for", "x-forwarded-proto", "x-nf-*",
]);

exports.handler = async function (event) {
  /* /:splat 形式的路径（若经 redirect 带前缀）先归一化 */
  let path = event.path || "/";
  path = path.replace(/^\/\.netlify\/functions\/proxy/, "");
  if (!path.startsWith("/")) path = "/" + path;
  const qs = event.rawQuery ? "?" + event.rawQuery : "";
  const url = UPSTREAM + path + qs;

  const headers = {};
  for (const k of Object.keys(event.headers || {})) {
    const lk = k.toLowerCase();
    if (HOP_HEADERS.has(lk)) continue;
    if (lk.startsWith("x-nf-")) continue;
    headers[lk] = event.headers[k];
  }
  /* Netlify 环境里可能注入的标识头也去掉，避免上游困惑 */
  delete headers["client-ip"];

  let body;
  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body != null) {
    body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body, "utf-8");
  }

  try {
    const resp = await fetch(url, { method: event.httpMethod, headers, body, redirect: "manual" });
    const buf = Buffer.from(await resp.arrayBuffer());
    const out = {};
    resp.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (HOP_HEADERS.has(lk) || lk === "set-cookie") return;
      out[k] = v;
    });
    return {
      statusCode: resp.status,
      headers: out,
      body: buf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      body: JSON.stringify({ error: "bridge_upstream_error", detail: String(e && e.message || e) }),
    };
  }
};
