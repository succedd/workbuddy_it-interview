#!/usr/bin/env bash
# 部署 Netlify 国内直连桥（workers.dev 在国内被封，此桥给手机/无代理环境用）
# 用法：
#   export NETLIFY_AUTH_TOKEN=<你的 Personal Access Token>
#   bash tools/deploy-netlify-bridge.sh            # 建站 + 首次部署
#   bash tools/deploy-netlify-bridge.sh <SITE_ID>  # 后续更新部署
set -euo pipefail

NETLIFY="C:/Users/Life/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js"
NODE="C:/Users/Life/.workbuddy/binaries/node/versions/22.22.2-2/node.exe"
cd "$(dirname "$0")/.."

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "缺少 NETLIFY_AUTH_TOKEN 环境变量" >&2; exit 1
fi
export NODE_PATH="C:/Users/Life/.workbuddy/binaries/node/workspace/node_modules"

SITE_ID="${1:-}"
if [ -z "$SITE_ID" ]; then
  echo "=== 建站（iti-api.netlify.app）==="
  SITE_ID=$("$NODE" "$NETLIFY" api createSite \
    --data '{"name":"iti-api","custom_domain":"iti-api.netlify.app"}' \
    2>/dev/null | "$NODE" -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).id)}catch(e){console.error(s.slice(0,300));process.exit(1)}})")
  echo "站点 ID: $SITE_ID"
fi

echo "=== 部署函数 ==="
"$NODE" "$NETLIFY" deploy --prod \
  --dir netlify/public \
  --functions netlify/functions \
  --site "$SITE_ID" 2>&1 | tail -8

echo "=== 站点地址 ==="
"$NODE" "$NETLIFY" api getSite --site-id "$SITE_ID" 2>/dev/null \
  | "$NODE" -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log('url:',j.ssl_url||j.url)}catch(e){}})"
echo "SITE_ID=$SITE_ID"
