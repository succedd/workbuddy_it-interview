# Netlify 国内直连桥

`workers.dev` 在国内被 DNS 投毒 + SNI 阻断（手机/无代理必失败），本目录把
Cloudflare Worker 后端反代到 `*.netlify.app`（国内实测可直连）。

## 工作原理

- `netlify.toml`：`/*` 全路径重定向到 `netlify/functions/proxy.js`
- `proxy.js`：方法/头/体/查询串原样转发到 `it-interview-stats.iti-interview.workers.dev`
- 前端 `api-endpoints.json` 把本站域名排第一即可全量切换，无需发版
  （该文件由前端运行时拉取、缓存 6 小时）

## 部署（CLI + Personal Access Token）

```bash
npm i -g netlify-cli
netlify deploy --prod --dir netlify/public --functions netlify/functions \
  --auth <NETLIFY_TOKEN> --site <SITE_ID>
```

首次部署先建站：

```bash
netlify sites:create --name iti-api --auth <NETLIFY_TOKEN>
```

## 安全

- 透传代理仅指向上游固定域名，不接受任意目标（防开放代理滥用）
- 上游 Worker 自带 CORS 白名单（默认仅 https://it-interview.is-a.dev）与
  可选 STATS_KEY 防刷，桥不削弱这两层
