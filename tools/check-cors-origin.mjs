#!/usr/bin/env node
/* 静态审计：cloudflare/worker.js 里所有 jsonResp(...) 调用是否都传了 origin。
 *
 * 为什么需要它（2026-09-13/14 两次事故的共同根因）：
 *   jsonResp 的签名是 jsonResp(obj, origin = "", status = 200)。origin 决定响应是否带
 *   Access-Control-Allow-Origin。漏传 → 响应没有 ACAO → 浏览器判 CORS 失败
 *   （net::ERR_FAILED，用户看到「连不上服务器」），而 **curl 完全不报错**（curl 不做 CORS
 *   检查），所以命令行验证会误判「一切正常」。已踩两次：
 *     ① 27 处参数顺序错位 jsonResp(obj, status, origin)：状态码位置收到 origin 字符串；
 *     ② /auth/login、/auth/me 两处完全没传 origin：登录成功响应无 ACAO → 登录必失败。
 *   本脚本把这类问题变成一次 <1s 的静态检查，发布前跑一遍即可。
 *
 * 用法：node tools/check-cors-origin.mjs [worker.js 路径]
 *   退出码 0 = 全部通过；1 = 存在缺 origin 的调用（列出文件:行号）。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] || resolve(here, "../cloudflare/worker.js"));
const src = readFileSync(file, "utf8");

/* 逐个 jsonResp( 提取完整实参串（按括号配平），再按顶层逗号拆参数 */
const calls = [];
for (const m of src.matchAll(/jsonResp\(/g)) {
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") depth--;
    i++;
  }
  const args = src.slice(m.index + m[0].length, i - 1);
  const line = src.slice(0, m.index).split("\n").length;
  calls.push({ line, args, argText: args.replace(/\s+/g, " ").trim().slice(0, 100) });
}

/* 定义本身（function jsonResp(obj, origin = "", status = 200)）不算调用点 */
const isDefinition = (c) => /^obj\s*,/.test(c.argText) && /status\s*=\s*200/.test(c.argText);
const bad = [];
for (const c of calls) {
  if (isDefinition(c)) continue;
  /* 顶层逗号拆分（忽略括号/对象/数组内的逗号） */
  const parts = [];
  let d = 0, cur = "";
  for (const ch of c.args) {
    if ("([{".includes(ch)) d++;
    if (")]}".includes(ch)) d--;
    if (ch === "," && d === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  const hasOrigin = parts.slice(1).some((p) => p.trim() === "origin");
  /* 也接受显式字面量 origin 变体（如 corsOrigin），避免误报 */
  const hasOriginVar = parts.slice(1).some((p) => /^(origin|corsOrigin)$/.test(p.trim()));
  if (!hasOrigin && !hasOriginVar) bad.push(c);
}

console.log(`审计 ${file}`);
console.log(`  jsonResp 调用点（不含定义）：${calls.filter((c) => !isDefinition(c)).length}`);
console.log(`  缺 origin 的调用：${bad.length}`);
for (const c of bad) console.log(`    ✗ L${c.line}  jsonResp(${c.argText}…)`);
if (bad.length) {
  console.log("\n❌ 存在漏传 origin 的 jsonResp 调用：这些响应不会带 ACAO，浏览器会判 CORS 失败（curl 测不出来）。");
  process.exit(1);
}
console.log("✅ 全部 jsonResp 调用均带 origin（响应会正确回显 ACAO）。");
