#!/usr/bin/env node
/**
 * 一键配置 Resend 发件域名 + Cloudflare DNS（2026-10-21）
 *
 * 前置（不要把 key 写进仓库）：
 *   ../.resend-key  Resend API Key（Sending access 即可）
 *   ../.cf-token    Cloudflare API Token：
 *                   Account → Workers Scripts:Edit / Workers KV Storage:Edit / D1:Edit
 *                   Zone → DNS:Edit / Zone:Read
 *                   Account → Account Settings:Read
 *
 * 用法：
 *   node tools/setup-resend.mjs                 # 只创建/读取 Resend 域名并打印 DNS 记录（dry）
 *   node tools/setup-resend.mjs --apply          # 自动把记录写入 Cloudflare 并触发验证
 *   node tools/setup-resend.mjs --domain example.com --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DOMAIN = (() => {
  const i = process.argv.indexOf("--domain");
  return i >= 0 ? process.argv[i + 1] : "itinterview.com.cn";
})();
const APPLY = process.argv.includes("--apply");
const RESEND_KEY = (process.env.RESEND_API_KEY || readIf(path.join(ROOT, "..", ".resend-key")) || "").trim();
const CF_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || readIf(path.join(ROOT, "..", ".cf-token")) || "").trim();
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "6e7bbb8c6002ed51eabf4fd5c1f3e066";

function readIf(p) { try { return fs.readFileSync(p, "utf8"); } catch (_) { return ""; } }
function die(msg) { console.error("[FAIL] " + msg); process.exit(1); }
async function req(url, opts = {}, label = "") {
  const res = await fetch(url, opts);
  let j = null; try { j = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(`${label || url} HTTP ${res.status}: ${JSON.stringify(j).slice(0, 500)}`);
  return j;
}
const R = (path, method = "GET", body) => req("https://api.resend.com" + path, {
  method, headers: { authorization: "Bearer " + RESEND_KEY, "content-type": "application/json" },
  body: body ? JSON.stringify(body) : undefined,
}, "Resend " + path);
const CF = (path, method = "GET", body) => req("https://api.cloudflare.com/client/v4" + path, {
  method, headers: { authorization: "Bearer " + CF_TOKEN, "content-type": "application/json" },
  body: body ? JSON.stringify(body) : undefined,
}, "Cloudflare " + path);

async function main() {
  if (!RESEND_KEY) die("缺少 Resend API Key：写到 ../.resend-key（不要提交）");
  if (APPLY && !CF_TOKEN) die("--apply 需要 Cloudflare Token：写到 ../.cf-token（Zone.DNS:Edit + Zone:Read）");
  // 1) Resend domain
  const list = await R("/domains");
  let dom = (list.data || []).find(x => x.name === DOMAIN);
  if (!dom) {
    console.log("→ 在 Resend 创建域名", DOMAIN);
    dom = await R("/domains", "POST", { name: DOMAIN });
  } else {
    console.log("→ Resend 已有域名", DOMAIN, "status=" + dom.status);
  }
  /* /domains 列表不带 records，必须再取详情 */
  const detail = await R(`/domains/${dom.id}`);
  const records = detail.records || [];
  console.log("\n需要在 DNS 添加的记录：");
  for (const r of records) console.log(`  ${r.type.padEnd(5)} ${r.name}  ${r.value}${r.priority ? "  priority=" + r.priority : ""}`);
  if (!APPLY) {
    console.log("\n当前是 dry-run；确认后执行：node tools/setup-resend.mjs --apply");
    return;
  }
  // 2) Cloudflare zone
  const z = await CF(`/zones?name=${encodeURIComponent(DOMAIN)}`);
  const zone = (z.result || [])[0];
  if (!zone) die("Cloudflare 找不到域名 " + DOMAIN + "（或 token 没有 Zone:Read）");
  console.log("\n→ Cloudflare zone", zone.id);
  // 3) create missing records
  for (const r of records) {
    const fqdn = String(r.name || "").includes(DOMAIN) ? r.name : `${r.name || "@"}.${DOMAIN}`.replace(/^@\./, "");
    const body = { type: r.type, name: fqdn, content: r.value, ttl: 1 };
    if (r.priority) body.priority = Number(r.priority);
    const existing = await CF(`/zones/${zone.id}/dns_records?type=${encodeURIComponent(r.type)}&name=${encodeURIComponent(fqdn)}`);
    if ((existing.result || []).length) {
      console.log("  = 已存在，跳过", r.type, fqdn);
      continue;
    }
    await CF(`/zones/${zone.id}/dns_records`, "POST", body);
    console.log("  + 已添加", r.type, fqdn);
  }
  // 4) verify
  console.log("\n→ 触发 Resend 验证…");
  try { await R(`/domains/${dom.id}/verify`, "POST"); } catch (e) { console.log("  ! verify 调用失败，稍后可在 Resend 后台点 Verify：" + e.message); }
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const d = await R(`/domains/${dom.id}`);
    console.log("  status:", d.status);
    if (d.status === "verified") { console.log("[OK] 域名已验证，可以发信"); return; }
  }
  console.log("[WARN] 还没 verified：DNS 传播可能需要几分钟，稍后在 Resend 后台点 Verify。");
}
main().catch(e => die(e.message));
