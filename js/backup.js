/* =========================================================================
 *  backup.js  —  本地数据加密云备份（v20260824a）
 *  作用：把「只存在本机、清缓存即丢」的数据完整加密备份到 GitHub 仓库：
 *    - localStorage：发布 Token / 仓库分支 / AI Key 与配置 / 统计配置 / 主题
 *    - IndexedDB settings 表：管理员密码哈希等
 *    - IndexedDB favorites / histories：收藏与浏览历史
 *  安全：文件以 AES-256-GCM 加密（PBKDF2 派生密钥），仓库公开也只有密文；
 *        备份密码只存在本机 localStorage，清缓存后需凭记忆的密码恢复。
 *  位置：data/local-backup.json（与题库快照 data/published.json 并列）
 * ========================================================================= */
(function () {
  "use strict";

  const LS_PASS = "backup_passphrase";
  const FILE_PATH = "data/local-backup.json";

  /* 需要备份的 localStorage 键（云端发布 + AI + 统计 + 主题） */
  const LS_KEYS = [
    "gh_publish_token", "gh_publish_repo", "gh_publish_branch", "gh_autopublish",
    "baidu_tid", "stats_api", "stats_key",
    "it_hub_theme",
    "it_hub_ai_key", "it_hub_ai_base", "it_hub_ai_model", "it_hub_ai_store",
    "it_hub_ai_timeout", "it_hub_ai_temp", "it_hub_ai_max"
  ];

  const B = {};
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* ---------- base64 工具（Uint8Array <-> string） ---------- */
  function b64enc(u8) { let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function b64dec(str) { const s = atob(str); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; }

  /* ---------- 密钥派生：PBKDF2 -> AES-256-GCM ---------- */
  async function deriveKey(pass, salt) {
    const km = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  /* ---------- 备份密码 ---------- */
  B.hasPassphrase = () => !!(typeof localStorage !== "undefined" && localStorage.getItem(LS_PASS));
  B.getPassphrase = () => (typeof localStorage !== "undefined" ? (localStorage.getItem(LS_PASS) || "") : "");
  B.setPassphrase = function (p) {
    if (typeof localStorage === "undefined") return;
    if (p) localStorage.setItem(LS_PASS, p);
    else localStorage.removeItem(LS_PASS);
  };

  /* ---------- 收集本地数据 ---------- */
  B.collect = async function () {
    const db = DB.db;
    const ls = {};
    LS_KEYS.forEach(k => {
      const v = (typeof localStorage !== "undefined") ? localStorage.getItem(k) : null;
      if (v != null) ls[k] = v;
    });
    const [settings, favorites, histories] = await Promise.all([
      db.settings.toArray(), db.favorites.toArray(), db.histories.toArray()
    ]);
    return {
      version: 1, savedAt: Date.now(),
      localStorage: ls,
      settings: settings, favorites: favorites, histories: histories
    };
  };

  /* ---------- 加密 / 解密 ---------- */
  B.encrypt = async function (plainObj, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(plainObj)));
    return {
      v: 1, alg: "AES-256-GCM/PBKDF2-SHA256-150k",
      savedAt: plainObj.savedAt || Date.now(),
      salt: b64enc(salt), iv: b64enc(iv), ciphertext: b64enc(new Uint8Array(ct))
    };
  };

  B.decrypt = async function (payload, pass) {
    if (!payload || payload.v !== 1 || !payload.ciphertext) throw new Error("备份文件格式不正确");
    const key = await deriveKey(pass, b64dec(payload.salt));
    let plain;
    try {
      plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64dec(payload.iv) }, key, b64dec(payload.ciphertext));
    } catch (e) { throw new Error("解密失败：备份密码不正确"); }
    return JSON.parse(dec.decode(plain));
  };

  /* ---------- 发布加密备份到 GitHub ---------- */
  B.publishBackup = async function () {
    if (!Cloud || !Cloud.token()) throw new Error("尚未配置发布 Token");
    const pass = B.getPassphrase();
    if (!pass) throw new Error("尚未设置备份密码");
    const payload = await B.encrypt(await B.collect(), pass);
    await Cloud.putFile(FILE_PATH, JSON.stringify(payload),
      "备份本地数据（加密） " + new Date(payload.savedAt).toLocaleString("zh-CN"));
    try { await DB.setSetting("backupAt", payload.savedAt); } catch (e) {}
    return { savedAt: payload.savedAt };
  };

  /* ---------- 从云端恢复 ---------- */
  B.fetchBackup = async function () {
    const r = await fetch(FILE_PATH + "?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("云端没有备份文件（HTTP " + r.status + "）");
    return await r.json();
  };

  B.restore = async function (pass) {
    const payload = await B.fetchBackup();
    const data = await B.decrypt(payload, pass);
    /* 1) localStorage */
    if (typeof localStorage !== "undefined" && data.localStorage) {
      Object.keys(data.localStorage).forEach(k => localStorage.setItem(k, data.localStorage[k]));
    }
    /* 2) IndexedDB：settings / favorites / histories */
    const db = DB.db;
    B._suppress++;
    try {
    await db.transaction("rw", [db.settings, db.favorites, db.histories], async () => {
      if (Array.isArray(data.settings)) await db.settings.bulkPut(data.settings);
      if (Array.isArray(data.favorites)) {
        await db.favorites.clear();
        if (data.favorites.length) await db.favorites.bulkAdd(data.favorites);
      }
      if (Array.isArray(data.histories)) {
        await db.histories.clear();
        if (data.histories.length) await db.histories.bulkAdd(data.histories);
      }
    });
    } finally { B._suppress--; }
    return {
      savedAt: data.savedAt || payload.savedAt || 0,
      settings: (data.settings || []).length,
      favorites: (data.favorites || []).length,
      histories: (data.histories || []).length,
      hasToken: !!(data.localStorage && data.localStorage.gh_publish_token)
    };
  };

  /* ---------- 自动备份引擎（v20260824b）：不依赖题目发布 ---------- */
  B._timer = 0; B._backing = false; B._suppress = 0;
  B._state = "idle";        // idle | dirty | backing | error
  B._lastError = ""; B._lastAt = 0;
  B._hooked = false; B._lsWrapped = false;
  const BACKUP_DELAY = 12000, BACKUP_RETRY = 90000;

  B.scheduleBackup = function () {
    if (!B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    B._state = "dirty"; B._emit();
    clearTimeout(B._timer);
    B._timer = setTimeout(() => B._runBackup(), BACKUP_DELAY);
  };

  B._emit = function () {
    try {
      const chip = document.getElementById("bk-chip");
      if (!chip) return;
      chip.style.display = "";
      if (B._state === "backing") { chip.textContent = "⏳ 备份中"; chip.className = "vis-chip bk backing"; }
      else if (B._state === "dirty") { chip.textContent = "● 待备份"; chip.className = "vis-chip bk dirty"; }
      else if (B._state === "error") { chip.textContent = "⚠ 备份失败"; chip.className = "vis-chip bk error"; chip.title = B._lastError; }
      else { chip.textContent = "✓ 已备云端"; chip.className = "vis-chip bk ok"; }
    } catch (e) {}
  };

  B._runBackup = async function () {
    if (B._backing || !B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    B._backing = true; B._state = "backing"; B._emit();
    try {
      await B.publishBackup();
      B._state = "idle"; B._lastAt = Date.now(); B._lastError = "";
      try { U.toast("本地数据已自动加密备份到云端", "success"); } catch (e) {}
    } catch (e) {
      B._state = "error"; B._lastError = String((e && e.message) || e);
      console.warn("自动备份失败", e);
      clearTimeout(B._timer);
      B._timer = setTimeout(() => B._runBackup(), BACKUP_RETRY);
    } finally { B._backing = false; B._emit(); }
  };

  B.initAuto = function () {
    if (!B.hasPassphrase() || !Cloud || !Cloud.isEditor()) return;
    /* Dexie 钩子：设置 / 收藏 / 历史 任意增删改 */
    if (!B._hooked && typeof Dexie !== "undefined" && DB && DB.db) {
      const db = DB.db;
      const hook = (t) => {
        if (!t) return;
        try {
          t.hook("creating", () => { if (B._suppress <= 0) B.scheduleBackup(); });
          t.hook("updating", () => { if (B._suppress <= 0) B.scheduleBackup(); });
          t.hook("deleting", () => { if (B._suppress <= 0) B.scheduleBackup(); });
        } catch (e) {}
      };
      [db.settings, db.favorites, db.histories].forEach(hook);
      B._hooked = true;
    }
    /* 包装 localStorage.setItem：配置类键被写入时顺带备份 */
    if (!B._lsWrapped && typeof localStorage !== "undefined" && localStorage.setItem) {
      try {
        const _set = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (k, v) {
          const ret = _set(k, v);
          if (B._suppress <= 0 && LS_KEYS.indexOf(k) >= 0) B.scheduleBackup();
          return ret;
        };
        B._lsWrapped = true;
      } catch (e) { console.warn("无法包装 localStorage", e); }
    }
    B._emit();
  };

  if (typeof window !== "undefined") window.Backup = B;
})();
