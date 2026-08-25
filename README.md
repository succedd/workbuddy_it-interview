# IT 面试题库管理系统

[![Site](https://img.shields.io/badge/在线访问-it--interview.is--a.dev-2563EB)](https://it-interview.is-a.dev)
[![GitHub](https://img.shields.io/badge/GitHub-succedd/workbuddy__it--interview-181717?logo=github)](https://github.com/succedd/workbuddy_it-interview)

纯静态、无后端的 IT 各岗位面试题库管理与刷题平台。前端全部使用原生 HTML/CSS/JS 实现，数据默认存在浏览器 IndexedDB 中；题库快照通过 GitHub Pages 分发，支持"访客自动同步云端题库 + 管理员一键发布到 GitHub"。

## 主要功能

### 访客端
- **首页仪表盘**：展示技术体系、岗位体系、面试路线、最近更新等快捷入口。
- **技术体系**：279 个分类的树状目录，支持按分类浏览题目。
- **岗位体系**：141 个岗位、146 条岗位技术栈，支持按岗位查看对应技能与题目。
- **题目详情**：Markdown 渲染答案 + 代码高亮，支持收藏、浏览计数、相关题推荐。
- **搜索**：全局搜索题目、技术、岗位、标签。
- **刷题模式**：`#/practice` 按分类/岗位/收藏随机抽题。
- **模拟面试**：`#/mock` 模拟真实面试流程抽题。
- **收藏与历史**：本地保存个人收藏与浏览历史。
- **暗色/亮色/跟随系统**主题切换。

### 管理端
> 管理员密码与权限只保存在**当前浏览器本地**，不会同步到云端。换一台设备需要重新设置。

- **管理员登录/首次设置密码**：基于 Web Crypto PBKDF2 哈希，登录态保存在 `sessionStorage`。
- **仪表盘**：题目数量、分类分布、岗位覆盖、访问统计等图表。
- **题目管理**：增删改查题目，字段包含标题、题干、答案、难度、题型、分类、适用岗位、工作年限、标签。
- **分类管理**：维护技术分类树。
- **岗位管理**：维护岗位体系与岗位方向。
- **AI 出题**：可配置 OpenAI API Key，通过大模型按分类/岗位/难度批量生成题目。
- **批量导入**：支持 JSON / Excel 导入题库。
- **备份恢复**：导出/导入完整本地题库 JSON。
- **系统设置**：
  - 配置 GitHub 发布 Token、仓库、分支；
  - 配置 Cloudflare Worker 访问统计接口；
  - 配置 AI 服务地址、模型与 API Key；
  - 手动同步云端题库。

### 云端共享题库
- 云端主库：`data/published.json`，随 GitHub Pages 一起发布。
- **访客**：首次打开自动拉取云端题库并覆盖本地种子数据；之后若云端有更新自动同步。
- **编辑端**：在管理后台配置了 GitHub 发布 Token 的浏览器被视为编辑端，本地数据不会自动被云端覆盖；编辑完成后点"发布"即可把本地题库推送到 GitHub 仓库，所有访客下一次打开自动获取最新题库。
- **自动发布**（v20260824a）：编辑端开启后（默认开启），题目/分类/岗位的任何增删改（含 AI 出题、批量导入）停止 10 秒后自动推送到 GitHub，顶栏徽章实时显示「未发布 / 发布中 / 已同步 / 失败」状态，失败自动重试；关闭页面前若有未发布改动会弹出提醒。
- **本地数据加密云备份**（v20260825a）：设置页可配置备份密码，把只存本机的数据（发布 Token、AI 配置与 Key、管理员密码、统计配置、收藏、浏览历史）以 AES-256-GCM（PBKDF2-SHA256 派生密钥，**迭代次数 600,000**）加密后备份到 `data/local-backup.json`（公开仓库上只有密文），随每次自动发布同步更新；清缓存/换设备后凭备份密码一键恢复。密文 payload 内含 `iter` 字段记录派生迭代次数，旧备份（无 `iter`、按 150,000 回退）仍可正常解密，升级不破坏历史备份。
- **数据保护**：本机已有历史数据但从未同步过的用户，不会自动覆盖，会提示手动同步（避免误删个人数据）。

### 统计
- **百度统计**：`index.html` 内联百度统计代码，Tracking ID 为 `856d2b08330e4b9f225cf101d6f14103`。
- **Cloudflare Worker 访问统计**（可选）：
  - 接口：`/visit`、`/view?id=123`、`/stats`
  - 功能：全局访问计数、当日访问、访客国家地理分布、热门城市、热门题目。
  - 代码在 `cloudflare/worker.js`，需绑定 KV `STATS`。

## 项目结构

```
.
├── index.html              # 入口页（百度统计、资源引用、加载动效）
├── CNAME                   # 自定义域名 it-interview.is-a.dev
├── data/
│   ├── seed.js             # 种子数据：分类树、岗位、岗位技能、示例题
│   └── published.json      # 云端题库快照（GitHub Pages 分发）
├── js/
│   ├── app.js              # 路由、顶部栏、侧边栏、全部页面渲染
│   ├── auth.js             # 管理员密码哈希与登录态
│   ├── db.js               # IndexedDB 封装（Dexie）与种子写入
│   ├── cloud.js            # 云端同步 + 发布/自动发布到 GitHub
│   ├── backup.js           # 本地数据 AES-256-GCM 加密云备份/恢复
│   ├── search.js           # 搜索与 Fuse.js 索引
│   ├── services.js         # 题目/岗位/分类的 CRUD 服务层
│   ├── api.js              # AI 接口调用与流式输出
│   ├── aiprompts.js        # AI 出题 Prompt 模板
│   ├── importexport.js     # JSON/Excel 导入导出
│   └── utils.js            # 通用工具函数与图标
├── css/                    # 样式文件
├── tools/
│   └── gen-published.js    # 由 seed.js 生成初始 published.json
└── cloudflare/
    ├── worker.js           # 访问统计 Cloudflare Worker
    └── wrangler.toml       # Wrangler 配置示例
```

## 快速开始

### 1. 本地预览
本项目是纯静态站点，无需构建：

```bash
# 方式一：直接打开 index.html

# 方式二：用任意静态服务器
npx serve .
```

### 2. 初始化管理员
首次进入管理页（`#/admin/dashboard`）会提示设置管理员密码。密码经 PBKDF2 哈希后存在浏览器 IndexedDB，**不会上传到任何服务器**。

### 3. 配置 AI 出题（可选）
进入 `#/admin/settings`：
- 设置 OpenAI 兼容的 API 地址、模型名、API Key。
- 之后可在 `#/admin/ai` 按分类/岗位/难度生成题目。

### 4. 配置云端发布（可选）
如果你是题库维护者，进入 `#/admin/settings`：
- 填入 GitHub Personal Access Token（需要 `repo` 权限）。
- 仓库默认 `succedd/workbuddy_it-interview`，分支默认 `main`。
- 本地编辑后点击"发布"即可推送 `data/published.json` 到 GitHub。

### 5. 生成新的 published.json
如果 `data/seed.js` 有改动，执行：

```bash
node tools/gen-published.js
```

生成后的 `data/published.json` 可手动提交，也可通过管理后台发布。

## 重要说明：别人访问网站也需要设置管理员密码吗？

**不需要。**

- 管理员密码是**本地功能**，只控制当前浏览器能否进入管理后台。
- 普通访客打开网站后，只要第一次拉取到云端 `data/published.json`，就能直接浏览 225 道题、搜索、刷题、收藏。
- 每个浏览器都有自己独立的管理员密码（以及收藏、历史等个人数据），互不影响。
- 只有当你想"编辑题库并发布到 GitHub"时，才需要配置 GitHub Token（这个 Token 也只存在当前浏览器 localStorage）。

## 更新日志

### 2026-08-24

- feat: 自动发布——编辑端题目/分类/岗位增删改（含 AI 出题、批量导入，经 Dexie 表钩子全路径监听）停止 10 秒后自动推送 GitHub，失败自动重试，关页前未发布提醒，顶栏新增状态徽章（可关闭）。
- feat: 本地数据加密云备份——新增 `js/backup.js`，发布 Token、AI 配置、管理员密码、统计配置、收藏、历史经 AES-256-GCM（PBKDF2 派生密钥）加密后备份到 `data/local-backup.json`，设置页支持设置备份密码、立即备份、凭密码一键恢复。
- refactor: `cloud.js` 抽出通用 `putFile` 上传助手供题库发布与加密备份共用。

### 2026-08-25
- security: 加密备份密钥派生 PBKDF2-SHA256 迭代次数由 150,000 提升至 600,000（`js/backup.js` v20260825a）；`deriveKey` 新增 `iterations` 参数，加密 payload 写入 `iter` 字段、解密按 `payload.iter` 读取（缺失回退 150,000），保证仓库内既有旧备份向后兼容、升级不会导致历史备份无法解密。

### 2026-08-23
- `5ef58ec` analytics: 百度统计切换为 it-interview.is-a.dev 新站点 Tracking ID `856d2b...`。
- `333a3c3` restore: 从旧浏览器 IndexedDB WAL 抢救恢复 126 道历史题目，题库总数 225 道。
- `6fb7f71` 恢复 CNAME：旧浏览器数据导出完成，正式域名重新上线。
- `37b0a2d` 添加 CNAME 文件，绑定正式域名 `it-interview.is-a.dev`。

### 2026-08-22
- `a51d7f5` feat: 云端共享题库——访客自动同步 + 管理员一键发布到 GitHub。
- `0fa80d2` feat: 集成百度统计。
- `8a0af25` feat: 接入 Cloudflare Worker 访客统计，支持实时人数、地理分布、题目热度。
- `a756d93` feat: 首次进入加载动效（进度条 + 代码雨 + IT 岗位名飘动）。
- `6e47a4e` feat: 编辑题目技术分类改为可搜索组合框。
- `1f210de` feat: 岗位支持细分方向（direction）。
- `172f920` feat: 岗位与分类/题目关联改造。
- 大量 AI 出题体验优化：实时日志、进度动画、生成提速、JSON 解析健壮化、取消按钮等。

### 2026-08-21
- `3c7c807` feat: IT 面试题库管理系统纯静态站点完整实现。

## 技术栈

- 原生 HTML5 / CSS3 / ES6+（无框架）
- [Dexie.js](https://dexie.org/)：IndexedDB 封装
- [marked](https://marked.js.org/)：Markdown 渲染
- [highlight.js](https://highlightjs.org/)：代码高亮
- [Fuse.js](https://fusejs.io/)：模糊搜索
- [ECharts](https://echarts.apache.org/)：图表
- [SheetJS](https://sheetjs.com/)：Excel 导入导出
- GitHub Pages + GitHub Contents API：静态托管与题库发布
- Cloudflare Workers + KV：可选访问统计后端

## 许可证

MIT License — 开源可自由使用与修改。
