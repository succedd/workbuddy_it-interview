/* Netlify Functions 反向代理：国内直连桥（workers.dev 在国内被 DNS 投毒 + SNI 阻断，
   手机/无代理环境连不上 Cloudflare Worker；netlify.app 域名国内可直连，
   Netlify 的海外函数服务器可以正常访问 workers.dev，在此转发即可）。
   全路径透传：/auth/login → 上游 /auth/login，方法/头/体/查询串原样转发，
   前端把 API 入口从 workers.dev 换成本站域名即可，零改动。 */

const UPSTREAM = "https://it-interview-stats.iti-interview.workers.dev";

/* 不转发给上游的逐跳头（host 由 fetch 重算，content-length 按新体重算）。
   注意请求侧必须去掉 accept-encoding：让上游按默认压缩策略回。
   响应侧必须额外去掉 content-encoding / content-length（见 RESP_STRIP_HEADERS）。 */
const HOP_HEADERS = new Set([
  "host", "connection", "keep-alive", "transfer-encoding", "upgrade",
  "content-length", "accept-encoding", "cf-connecting-ip", "cf-ipcountry",
  "cf-ray", "cf-visitor", "x-forwarded-for", "x-forwarded-proto", "x-nf-*",
]);

/* 响应侧必须剔除的头：undici 的 resp.arrayBuffer() 已自动解压 body，
   若把上游的 content-encoding 一并抄回，响应就「声称 br/gzip、实际是明文」，
   浏览器解码失败报 net::ERR_CONTENT_DECODING_FAILED，fetch 表现为
   "Failed to fetch"——症状极像 CORS 挂了，实际是压缩头与 body 不匹配。
   （curl 不发 Accept-Encoding 所以拿到未压缩响应，curl 测试完全正常，
   这正是此前「curl 通、浏览器不通」假象的根源。） */
const RESP_STRIP_HEADERS = new Set([
  "content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive",
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
      if (HOP_HEADERS.has(lk) || RESP_STRIP_HEADERS.has(lk) || lk === "set-cookie") return;
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
      headers: {
        "content-type": "application/json",
        /* 桥自身错误（未到上游）也要放行浏览器读取：回显请求 Origin，无 Origin 时兜底 "*" */
        "access-control-allow-origin": event.headers && (event.headers.origin || event.headers.Origin) || "*",
      },
      body: JSON.stringify({ error: "bridge_upstream_error", detail: String(e && e.message || e) }),
    };
  }
};
