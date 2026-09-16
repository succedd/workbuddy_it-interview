#!/usr/bin/env bash
# 部署 Netlify 国内直连桥（workers.dev 在国内被 DNS 投毒 + SNI 阻断，此桥给手机/无代理环境用）
#
# 用法：
#   export NETLIFY_AUTH_TOKEN=<你的 Personal Access Token>
#   bash tools/deploy-netlify-bridge.sh              # 建站（已存在则复用）+ 部署到生产 + 国内可达性自检
#   SITE_NAME=other-name bash tools/deploy-netlify-bridge.sh
#
# 令牌申请：https://app.netlify.com/user/applications#personal-access-tokens （GitHub 登录后可秒建）
set -euo pipefail

NODE="C:/Users/Life/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
NETLIFY="C:/Users/Life/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js"
export NODE_PATH="C:/Users/Life/.workbuddy/binaries/node/workspace/node_modules"

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "❌ 缺少 NETLIFY_AUTH_TOKEN 环境变量" >&2
  exit 1
fi
if [ ! -f "$NETLIFY" ]; then
  echo "❌ 未找到 netlify-cli：$NETLIFY" >&2
  echo "   安装：cd C:/Users/Life/.workbuddy/binaries/node/workspace && $NODE -e \"require('child_process')\" ; npm i netlify-cli" >&2
  exit 1
fi

SITE_NAME="${SITE_NAME:-iti-api}"
SITE_ID_FILE="netlify/.site-id"

SITE_ARG=(--site-name "$SITE_NAME")
if [ -f "$SITE_ID_FILE" ]; then
  SAVED="$(tr -d '[:space:]' < "$SITE_ID_FILE")"
  if [ -n "$SAVED" ]; then
    SITE_ARG=(--site "$SAVED")
    echo "=== 复用已记录站点：$SAVED ==="
  fi
fi

echo "=== 部署到生产（--prod --json）==="
JSON_FILE="$(mktemp)"
"$NODE" "$NETLIFY" deploy --prod --json \
  --dir netlify/public \
  --functions netlify/functions \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --message "ITI API bridge deploy" \
  "${SITE_ARG[@]}" > "$JSON_FILE"

# 解析关键字段（stdout 只有 JSON；进度日志都在 stderr）
"$NODE" -e '
const fs = require("fs");
const raw = fs.readFileSync(process.argv[1], "utf8");
let j;
try { j = JSON.parse(raw); } catch (e) {
  console.error("❌ 无法解析部署输出（前 500 字）：\n" + raw.slice(0, 500));
  process.exit(1);
}
const url = j.ssl_url || j.url || j.deploy_ssl_url || "";
const out = {
  site_id: j.site_id || "",
  site_name: j.name || "",
  url,
  deploy_id: j.deploy_id || j.id || "",
  functions: (j.functions || []).map(f => f.name || f),
};
console.log(JSON.stringify(out, null, 2));
if (!url) { console.error("❌ 未拿到站点 URL"); process.exit(1); }
if (out.site_id) require("fs").writeFileSync("netlify/.site-id", out.site_id + "\n");
require("fs").writeFileSync("netlify/.site-url", url + "\n");
' "$JSON_FILE"

rm -f "$JSON_FILE"

URL="$(tr -d '[:space:]' < netlify/.site-url)"

echo
echo "=== 站点地址 ==="
echo "  $URL"

echo
echo "=== 国内直连自检（绕过代理，真实网络）==="
for p in "/" "/stats"; do
  printf "  %-8s " "$p"
  curl -s -m 25 --noproxy '*' -o /tmp/_br.out -w "http=%{http_code} time=%{time_total}s size=%{size_download}\n" "$URL$p" || echo "❌ 直连失败"
done
echo "  /stats 返回体前 300 字："
head -c 300 /tmp/_br.out 2>/dev/null; echo

echo
echo "=== 下一步 ==="
echo "  1) 把 '$URL' 写进仓库根 api-endpoints.json 的 endpoints 数组（放第一位）"
echo "  2) 推送后访客 6 小时内自动切换；设置页点「自动选择可用入口」可立即生效"
