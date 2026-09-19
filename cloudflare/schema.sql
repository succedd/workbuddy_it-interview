-- IT 面试题库用户系统 schema（D1 / SQLite）
-- 帐号
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  nick          TEXT NOT NULL DEFAULT '',
  pass_hash     TEXT NOT NULL,           -- hex(PBKDF2-SHA256(iter=100000))
  salt          TEXT NOT NULL,           -- hex 16 bytes
  role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  status        INTEGER NOT NULL DEFAULT 1,     -- 1 正常 / 0 禁用
  created_at    INTEGER NOT NULL,               -- epoch ms
  last_login_at INTEGER DEFAULT 0
);

-- 登录会话（token -> user）
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,           -- 随机 32 bytes hex
  user_id    INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- 收藏（每用户每题一条）
CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, question_id)
);

-- 刷题历史：保留最近浏览时间与次数
CREATE TABLE IF NOT EXISTS histories (
  user_id    INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  views      INTEGER NOT NULL DEFAULT 1,
  viewed_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, question_id)
);

-- 错题本（20260910b 起含艾宾浩斯复习进度；已有旧表由 worker 启动时 ALTER TABLE 动态补列）
CREATE TABLE IF NOT EXISTS weak_bank (
  user_id    INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  box        INTEGER DEFAULT 0,            -- 记忆曲线阶段（0-7）
  due_at     INTEGER,                      -- 下次到期时间戳 ms
  marked     TEXT,                         -- 标记类型 familiar/unknown
  last_ok_at INTEGER,                      -- 最近一次「会了」时间
  updated_at INTEGER,                      -- 最后改动时间（新者胜合并依据）
  PRIMARY KEY (user_id, question_id)
);

-- 每日打卡（今日5题完成记录）：每用户每天一行，question_ids 为 JSON 数组文本
CREATE TABLE IF NOT EXISTS daily_done (
  user_id      INTEGER NOT NULL,
  day          TEXT NOT NULL,               -- YYYY-MM-DD (本地时区)
  question_ids TEXT NOT NULL DEFAULT '[]',  -- JSON 数组：完成的题目 id
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);

-- 注册/登录 IP 限流：60 秒窗口计数
CREATE TABLE IF NOT EXISTS rl_auth (
  ip           TEXT PRIMARY KEY,
  cnt          INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- 模拟面试报告（历次成绩，用于趋势对比）
CREATE TABLE IF NOT EXISTS mock_reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,               -- epoch ms
  position   TEXT NOT NULL DEFAULT '',       -- 岗位名
  years      TEXT NOT NULL DEFAULT '',       -- 年限
  total      INTEGER NOT NULL DEFAULT 0,     -- 题目数
  master     INTEGER NOT NULL DEFAULT 0,     -- 掌握
  familiar   INTEGER NOT NULL DEFAULT 0,     -- 不熟悉
  unknown    INTEGER NOT NULL DEFAULT 0,     -- 不会
  duration   INTEGER NOT NULL DEFAULT 0,     -- 用时（秒）
  coverage   TEXT NOT NULL DEFAULT ''        -- 技术覆盖，顿号分隔
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON mock_reports(user_id, created_at);

-- ============ 用户投稿 + AI 质检 + 专家审核（20260920a 新增）============
-- 说明：本文件是「文档 + 手动建表」用；worker.js 里的 ensureSubmitTables() 会在启动时
-- 用 CREATE TABLE IF NOT EXISTS 再兜一次（幂等），所以即使忘了跑 d1 execute 也能自愈。

-- 投稿（提交时冻结快照，之后编辑端改动不影响审计）
CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,

  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  answer        TEXT NOT NULL DEFAULT '',
  difficulty    TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '',      -- JSON 数组文本
  category_id   TEXT NOT NULL DEFAULT '',
  source_note   TEXT NOT NULL DEFAULT '',

  -- AI 质检
  ai_verdict    TEXT NOT NULL DEFAULT 'pending',  -- pending|pass|reject_non_it|reject_quality|reject_duplicate|error
  ai_score      INTEGER DEFAULT 0,
  ai_json       TEXT NOT NULL DEFAULT '',         -- AI 原始返回（审计/复查）
  ai_at         INTEGER DEFAULT 0,
  ai_error      TEXT NOT NULL DEFAULT '',

  -- 人工审核
  review_status TEXT NOT NULL DEFAULT 'pending',  -- pending|reviewing|approved|rejected
  review_by     INTEGER DEFAULT 0,
  review_at     INTEGER DEFAULT 0,
  review_note   TEXT NOT NULL DEFAULT '',
  bank_id       TEXT NOT NULL DEFAULT '',         -- 入库后回填题库 id
  edited_by_reviewer INTEGER NOT NULL DEFAULT 0,  -- 审核者是否改过题
  edited_json   TEXT NOT NULL DEFAULT '',         -- 改题后的内容快照（原文仍在上面的列里）

  -- 风控 / 路由
  non_it_strike INTEGER NOT NULL DEFAULT 0,       -- 1=计入非 IT 次数（管理员可清零）
  group_id      INTEGER NOT NULL DEFAULT 0,       -- 0=未分配（所有专家可审）
  locked_by     INTEGER DEFAULT 0,                -- 抢单锁
  locked_at     INTEGER DEFAULT 0,
  ip            TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_sub_user    ON submissions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sub_review  ON submissions(review_status, created_at);
CREATE INDEX IF NOT EXISTS idx_sub_strike  ON submissions(user_id, non_it_strike);

-- 专家群组（按技术方向分域）
CREATE TABLE IF NOT EXISTS expert_groups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  scope        TEXT NOT NULL DEFAULT '',        -- 负责方向说明（给人看）
  category_ids TEXT NOT NULL DEFAULT '[]',      -- 负责的分类 id（JSON 数组，用于自动路由）
  created_at   INTEGER NOT NULL,
  created_by   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id   INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_gm_user ON group_members(user_id);

-- 审核动作流水（含被推翻的那一次；只存最后一态不够审计）
CREATE TABLE IF NOT EXISTS review_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  actor_id      INTEGER NOT NULL,
  action        TEXT NOT NULL,                  -- claim|release|pass|reject|edit|revert
  note          TEXT NOT NULL DEFAULT '',
  at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rlog_sub ON review_log(submission_id, at);

-- 投稿 IP 限流（沿用 rl_auth 的窗口计数写法）
CREATE TABLE IF NOT EXISTS rl_submit (
  ip           TEXT PRIMARY KEY,
  cnt          INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
