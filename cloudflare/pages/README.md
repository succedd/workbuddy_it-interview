# Cloudflare Pages 反爬层（`cloudflare/pages/`）

这个目录不是后端 Worker（后端在 `cloudflare/worker.js`，是另一回事），
而是**站点前端的托管层**：把本站从 GitHub Pages 迁到 Cloudflare Pages 之后，
用一层可编程边缘（Pages 高级模式 Worker）挡住爬虫。

## 为什么迁

GitHub Pages 是纯静态托管，**没有任何边缘计算能力**，所以：

- `data/published.json`（整库题目+答案，约 2MB）一条 `curl` 就能整包拿走；
- `q/*.html` 是 1209 个把**完整答案**写进 `ld+json` 的分享页，
  沿公开的 `sitemap.xml` 走一遍，同样等于整库下载。

robots.txt 只是「君子协定」，对不看 robots 的采集器毫无约束力。

Cloudflare Pages 免费版就支持：私有仓库部署 + 高级模式 Worker（`_worker.js`），
于是能在静态资源之上加一层真正会拒绝请求的守卫。

## 文件

| 文件 | 作用 |
| --- | --- |
| `_worker.js` | 高级模式 Worker，全部反爬逻辑（五道闸门，见文件头注释） |
| （仓库根）`robots.txt` | 明确拒绝 AI 训练 / SEO 采集工具的声明式兜底 |
| （仓库根）`404.html` | 自定义 404（Pages 会把未命中的路径交给它） |
| `tools/build-pages.mjs` | 组装发布目录 `dist/`（白名单拷贝 + 放置 `_worker.js`） |

> ⚠️ `_worker.js` **故意不放在仓库根**：Cloudflare Pages 只认根目录的 `_worker.js`，
> 但 GitHub Pages 会把根目录的它当成普通静态文件公开出去。放在这里，
> 由构建脚本拷进 `dist/`，两边都干净。

## 部署方式

### 方式 A：Git 集成（推荐，配一次就自动）

Cloudflare Dashboard → Workers & Pages → 创建 → Pages → 连接到 Git →
选 `succedd/workbuddy_it-interview`，然后：

| 设置项 | 值 |
| --- | --- |
| 生产分支 | `release` |
| 构建命令 | `node tools/build-pages.mjs` |
| 构建输出目录 | `dist` |

这样**站点自动发布会连带触发重新部署**（前端把题库推到 `release` 后，
Cloudflare 自动重建），不需要任何人工动作。

支持私有仓库——这正是当初想把仓库设为私有的前提条件。

### 方式 B：本地直接上传（改完立刻看效果）

```bash
node tools/build-pages.mjs
npx wrangler pages deploy dist --project-name it-interview
```

本机网络需要代理时：

```bash
export HTTPS_PROXY=http://127.0.0.1:7897
```

> `wrangler pages deploy` **不支持 `functions/` 目录**（那是 Dashboard 直传的能力），
> 只认高级模式 `_worker.js`。所以守卫逻辑全写在 `_worker.js` 里 —— 别改回 `functions/`。

## 自定义域名 `itinterview.com.cn` 与 Zone 级防护

> 本节 2026-09-24 重写。旧内容讲的是 `it-interview.is-a.dev`（域名 DNS 归属
> is-a.dev 项目、用不了 WAF）—— **该域名已于 2026-09-21 下架释放，勿再引用**。

- 2026-09-21 起正式域名为自购的 **`itinterview.com.cn`**，zone 就在本账号下
  （id `48961f3585fdc652af950bd2163c0382`，status active）⇒
  **技术上可以用 Zone 级防护**：Security Level / Bot Fight Mode / WAF 自定义规则
  / Rate Limiting / HSTS。
- ⚠️ **但套餐是免费版**（2026-09-24 实测：`GET /zones?name=itinterview.com.cn` →
  `plan.legacy_id = "free"`、`plan.name = "Free Website"`、`is_subscribed = false`）。
  **不少能力有套餐门槛，不能默认「能开」** —— 典型反例就是下面的端口拦截
  （官方归在「paid plans」）。动手前先把套餐和字段可用性查清。
- ⚠️ **令牌权限至今没拿到**（2026-09-24 实测复核）：本机 wrangler OAuth 只有
  `zone:read`（读 zone 信息 200；读 rulesets 报 `10000 Authentication error`；
  读 zone settings 报 `9109`），仓库 Secret `CLOUDFLARE_API_TOKEN` 同样只挂了
  `Account.Cloudflare Pages` ⇒ **面板级配置目前无法自动化，只能手工点**。
- 因此凡是「能在应用层等效实现」的一律写进 `_worker.js`，不依赖面板操作。

### Zone 级版本：查证后判定「不适用本 zone」，维持现状不做

应用层已经在 `_worker.js` 落地了端口闸门（见下节）。Zone 级那条规则本可更彻底 ——
挡在 Worker 之前，连 Worker 调用都不消耗。**但 2026-09-24 查证后结论是：不要做。** 三条理由：

1. **套餐不支持**。本 zone 是**免费版**（`GET /zones?name=itinterview.com.cn` →
   `plan.legacy_id: "free"`, `is_subscribed: false`）。官方
   <https://developers.cloudflare.com/fundamentals/reference/network-ports/>
   的「How to block traffic on additional ports」一节写的是
   **"Block traffic on ports other than 80 and 443 in Cloudflare paid plans"**，
   渠道是 Cloudflare Managed Ruleset 的 `Anomaly:Port - Non Standard Port (not 80 or 443)`
   （默认关闭）—— 都是付费能力。免费版自定义规则的**字段集是受限的**，
   社区 MVP 明确讲 `cf.edge.server_port` 属付费字段。
2. **☠️ 免费版填了会「静默空转」**。这个表达式在免费版**能保存、不报错**，
   但规则不生效 —— 比直接报错危险得多，会让人以为已经防护住了。
   **所以别信「保存成功」= 生效**，唯一可靠的判据是从**外部**实测：
   非标准端口回 **Cloudflare `403`** 才是真生效；若仍回应用层那个
   **`404 nonstandard-port`**，说明规则空转，应把它删掉。
3. **收益是零头**。这一层省的只是「Worker 调用次数」。实测 2026-09-22~24
   共 11182 次请求，其中非标端口 **381 次（≈190/天）** ⇒ 加它顶多省下
   10 万/天 Worker 额度里的 **0.19%**。而真正的成本已经被应用层闸门吃掉了
   （不再吐整站页面、不再产生静态请求 / 缓存穿透）。

另：现有令牌本来也**无 `Zone WAF` 权限**（读 `/zones/<id>/rulesets` 报 `10000`、
读 zone settings 报 `9109`），自动化不了。

⇒ **结论：不做，只保留 `_worker.js` 里那道闸门。** 若哪天确有 edge 层需求：
`cf.edge.server_port` 在所有套餐的 **Single Redirect（Redirect Rules）** 字段集里是有的，
但语义是 301/303 跳回标准端口，比 404「软」，且多占一条规则位，通常也不划算。

> 以下是**原计划的规则原文**，仅作留档，勿照做：
> Dashboard → 站点 `itinterview.com.cn` → **Security → WAF → Custom rules** → Create rule
> → **Name** `Block non-standard ports` → 点 **`Edit expression`**（可视化构造器里没这个字段，
> 官方该用例原话就是 "Use the expression editor"）→ 表达式
> `not (cf.edge.server_port in {80 443})` → **Action** `Block`。
> 官方依据：<https://developers.cloudflare.com/waf/custom-rules/use-cases/require-specific-http-ports/>

**为什么值得关掉（应用层已关）**：Cloudflare 默认在 HTTP 端口 `80 / 8080 / 8880 / 2052 / 2082 /
2086 / 2095` 与 HTTPS 端口 `443 / 2053 / 2083 / 2087 / 2096 / 8443` 上都代理流量。
其中 **HTTP 侧会 301 到主域（无问题）**，但 **HTTPS 侧 5 个备用端口会直接把整站
页面吐出来** —— 2026-09-24 实测 `2053 / 2083 / 2087 / 2096 / 8443` 全部返回
**HTTP 200，且与主域内容逐字节相同**（sha256 一致），等于同一份内容在 6 个端口
重复对外暴露。后果：端口扫描器每一发都拿到 200（`tools/cf-quota-check.py` 的
「非标准端口请求」告警即由此而来），且每发都真实消耗一次 Pages 静态请求 +
Worker 调用；这些端口的**缓存是关闭的**，请求必然穿透到源。

## 验证清单（改完 `_worker.js` 后跑一遍）

| 场景 | 期望 |
| --- | --- |
| 浏览器正常打开首页 | 200，题库正常加载 |
| 浏览器点开任一 `q/<id>.html` 分享页 | 200（人类访客不会被拦） |
| `curl /data/published.json` | 403 `bot-ua` |
| 浏览器 UA 但不带 `Sec-Fetch-Site`/同源 Referer 直接请求 `/data/published.json` | 403 `missing-browser-signal` |
| 浏览器 UA + `Sec-Fetch-Site: same-origin` 请求 `/data/published.json` | 200 |
| `Googlebot` UA + 非搜索引擎 ASN（伪造）请求 `/q/<id>.html` | 403 `spoofed-search-bot-ua` |
| 真实搜索引擎抓 `q/<id>.html` | 200（SEO 不受影响） |
| `/tools/build-pages.mjs`、`/cloudflare/pages/_worker.js`、`/HANDOVER.md` | 404 |
| 带浏览器 UA 请求 `https://<域>:8443/`（备用 HTTPS 端口） | 404 `nonstandard-port` |
| 带浏览器 UA 请求 `https://<域>:2087/q/<id>.html` | 404 `nonstandard-port` |
| 主域 `https://<域>/`、`http://<域>/`（→301） | 正常，不受端口闸门影响 |

自动化：`node tools/pages-guard-test.mjs`（**51 条，CI 里必跑，不过则中止部署**）。

## 五道闸门一览

| # | 闸门 | 位置 | 作用 |
| --- | --- | --- | --- |
| ① | 仓库内部文件 | `INTERNAL_RE` | `tools/` `cloudflare/` `HANDOVER.md` … 一律 404，不出面 |
| ② | UA 识别 | `classifyUa` | 脚本 / 爬虫 / AI 训练抓取 / 伪造搜索引擎 UA → 全站 403 |
| ③ | 浏览器信号 | `isData` 分支 | `/data/*` 需 `Sec-Fetch-Site: same-origin` 或同源 Referer |
| ④ | 传输层加固 | `harden()` + 301 | http→https、HSTS、nosniff、frame-ancestors、Referrer-Policy |
| ⑤ | 端口闸门 | fetch 开头 | 非 80/443 一律 404，堵掉 5 个备用 HTTPS 端口的重复暴露 |

## 诚实的边界

这是**应用层**防护：能挡掉绝大多数随意采集（`curl` 一把梭、现成爬虫框架、
AI 训练抓取），但挡不住「会改请求头 + 肯租代理池」的定向攻击 ——
伪造 UA、手工补 `Sec-Fetch-Site` 仍能拿到数据。

想再进一步只有两条路：

1. 把 zone 升到**付费套餐**后启用 Cloudflare Managed Ruleset 的
   `Anomaly:Port - Non Standard Port (not 80 or 443)`（免费版做不了，见上节）。
   纯静态站为这一条升套餐不划算；
2. 改产品形态：把答案从静态 JSON / 分享页挪到需要登录的接口后面。
