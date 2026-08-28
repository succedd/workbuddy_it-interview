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

-- 错题本
CREATE TABLE IF NOT EXISTS weak_bank (
  user_id    INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
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
