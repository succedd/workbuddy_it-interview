/* =========================================================================
 *  api.js  —  DeepSeek Harness API 调用（流式）
 * ========================================================================= */
(function () {
  "use strict";
  const API = {};
  const LS = {
    key: "it_hub_ai_key", base: "it_hub_ai_base", model: "it_hub_ai_model",
    store: "it_hub_ai_store", timeout: "it_hub_ai_timeout",
    temp: "it_hub_ai_temp", max: "it_hub_ai_max"
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} }

  API.defaults = { base: "https://api.deepseek.com/v1", model: "deepseek-chat", timeout: 300, temp: 0.7, max: 20, store: "local" };

  API.getConfig = function () {
    return {
      base: lsGet(LS.base) || API.defaults.base,
      model: lsGet(LS.model) || API.defaults.model,
      store: lsGet(LS.store) || API.defaults.store,
      timeout: parseInt(lsGet(LS.timeout)) || API.defaults.timeout,
      temp: parseFloat(lsGet(LS.temp)) || API.defaults.temp,
      max: parseInt(lsGet(LS.max)) || API.defaults.max
    };
  };
  API.saveConfig = function (cfg) {
    lsSet(LS.base, cfg.base); lsSet(LS.model, cfg.model); lsSet(LS.store, cfg.store);
    lsSet(LS.timeout, cfg.timeout); lsSet(LS.temp, cfg.temp); lsSet(LS.max, cfg.max);
  };
  API.getKey = function () {
    const store = lsGet(LS.store) || API.defaults.store;
    return store === "session" ? ssGet(LS.key) : lsGet(LS.key);
  };
  API.setKey = function (key) {
    const store = lsGet(LS.store) || API.defaults.store;
    if (store === "session") { ssSet(LS.key, key); lsSet(LS.key, null); }
    else { lsSet(LS.key, key); ssSet(LS.key, null); }
  };
  API.clearKey = function () { lsSet(LS.key, null); ssSet(LS.key, null); };

  /* 流式对话，返回完整文本。
   * opts:
   *   onToken(delta, full) — 每收到一个 token 回调
   *   onEvent(type, payload) — 生命周期事件：connecting/connected/first/done/error/tick
   *   maxTokens            — 传给 API 的 max_tokens（不传则不设）
   *   timeout              — 本次请求覆盖超时（秒），不传用配置值
   * 返回 AbortController（调用方可 .abort() 取消），以及完整文本。
   */
  API.streamChat = async function (messages, opts) {
    opts = opts || {};
    const ev = opts.onEvent;
    const cfg = API.getConfig();
    const key = API.getKey();
    if (!key) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const url = (cfg.base || API.defaults.base).replace(/\/$/, "") + "/chat/completions";
    if (ev) ev("connecting", { model: cfg.model || "deepseek-chat" });
    const ctrl = new AbortController();
    const effectiveTimeout = (opts.timeout || cfg.timeout || 300) * 1000;
    const timer = setTimeout(() => ctrl.abort(), effectiveTimeout);
    // 心跳：每 15 秒发一次 tick（含已耗时），让 UI 显示"仍在工作中"
    let t0 = Date.now(), heartbeat;
    const startHeartbeat = () => {
      heartbeat = setInterval(() => {
        if (ev) ev("tick", { elapsed: Math.round((Date.now() - t0) / 1000), chars: full.length });
      }, 15000);
    };
    const stopHeartbeat = () => { if (heartbeat) { clearInterval(heartbeat); heartbeat = null; } };
    let res;
    try {
      const body = { model: cfg.model || "deepseek-chat", messages: messages, stream: true, temperature: cfg.temp ?? 0.7 };
      if (opts.maxTokens) body.max_tokens = opts.maxTokens;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(timer); stopHeartbeat();
      if (e && e.name === "AbortError") {
        if (ev) ev("error", { code: "CANCELLED" });
        const err = new Error("CANCELLED"); err.code = "CANCELLED"; throw err;
      }
      if (ev) ev("error", { code: "CORS" });
      const err = new Error("CORS"); err.code = "CORS"; err.raw = e; throw err;
    }
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) {
      stopHeartbeat();
      if (ev) ev("error", { code: "INVALID_KEY" });
      const err = new Error("INVALID_KEY"); err.code = "INVALID_KEY"; throw err;
    }
    if (!res.ok) {
      stopHeartbeat();
      if (ev) ev("error", { code: "HTTP", status: res.status });
      const err = new Error("HTTP_" + res.status); err.code = "HTTP"; err.status = res.status; throw err;
    }
    if (ev) ev("connected", { model: cfg.model || "deepseek-chat" });
    startHeartbeat();

    if (!res.body) {
      stopHeartbeat();
      const j = await res.json();
      const content = j.choices && j.choices[0] && j.choices[0].message.content;
      if (ev) ev("done", { chars: (content || "").length, elapsed: Math.round((Date.now() - t0) / 1000) });
      return content;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", full = "", first = true;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          const c = j.choices && j.choices[0];
          if (c && c.delta && c.delta.content) {
            if (first) { first = false; if (ev) ev("first", {}); }
            full += c.delta.content; if (opts.onToken) opts.onToken(c.delta.content, full);
          }
        } catch (_) {}
      }
    }
    stopHeartbeat();
    if (ev) ev("done", { chars: full.length, elapsed: Math.round((Date.now() - t0) / 1000) });
    // 暴露控制器供外部取消
    full._ctrl = ctrl;
    return full;
  };

  /* 解析 AI 返回：尽可能容错地把"非标准 JSON"解析成对象。
   * 处理的常见故障：
   *   - markdown 代码围栏（```json / ``` 等）及前后多余解释文字
   *   - 字符串值内含真实换行符 / 制表符（JSON 只允许 \n / \t 转义）
   *   - 行内 // 或 /* *\/ 注释
   *   - 未加引号的对象键
   *   - 尾随逗号
   *   - 顶层直接是数组而非 {questions:[...]} 对象（配合 opts.asQuestions 自动包装）
   * 成功返回解析对象；彻底失败返回 { raw: text } 供上层降级展示。
   */
  const _UNSET = Symbol("unset");

  function _tryParseFull(s) {
    try { return JSON.parse(s); } catch (e) { return _UNSET; }
  }

  // 从文本中截取出最外层平衡括号包裹的区域。
  // 同时尝试 { 与 [ 作为起点，取能配平且跨度最大的那个（即真正的顶层结构）。
  function _extractBalanced(s) {
    const candidates = [];
    const bi = s.indexOf("{"), ai = s.indexOf("[");
    if (bi >= 0) candidates.push(bi);
    if (ai >= 0) candidates.push(ai);
    let best = null;
    for (const start of candidates) {
      const openCh = s[start];
      const closeCh = openCh === "{" ? "}" : "]";
      let depth = 0, inStr = false, escaped = false, end = -1;
      for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === openCh) depth++;
        else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end >= 0) {
        const region = s.slice(start, end + 1);
        if (!best || region.length > best.length) best = region;
      }
    }
    return best;
  }

  // 字符级容错清洗：转义字符串内的控制符、删除注释、修尾逗号、补未加引号的键
  function _cleanJSON(s) {
    let out = "", i = 0, inStr = false, escaped = false;
    while (i < s.length) {
      const c = s[i];
      if (escaped) { out += c; escaped = false; i++; continue; }
      if (c === "\\") { out += c; escaped = true; i++; continue; }
      if (c === '"') { out += c; inStr = !inStr; i++; continue; }
      if (inStr) {
        if (c === "\n") { out += "\\n"; i++; continue; }
        if (c === "\r") { i++; continue; }       // 丢弃回车
        if (c === "\t") { out += "\\t"; i++; continue; }
        out += c; i++; continue;
      }
      // 仅字符串外才处理注释
      if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
      if (c === "/" && s[i + 1] === "*") { i += 2; while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++; i += 2; continue; }
      out += c; i++;
    }
    // 尾随逗号：{,} 或 [,]
    out = out.replace(/,(\s*[}\]])/g, "$1");
    // 未加引号的对象键（仅 ASCII 标识符，降低误伤中文正文的风险）
    out = out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*):/g, '$1"$2"$3:');
    return out;
  }

  API.parseJSON = function (text, opts) {
    opts = opts || {};
    if (!text || !text.trim()) return null;
    let s = text.trim();

    // 1) 剥离 markdown 代码围栏（json / javascript / js / jsonc 等）
    const fence = s.match(/```(?:json|javascript|js|jsonc)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();

    // 2) 直接解析（模型听话时）
    let obj = _tryParseFull(s);
    if (obj === _UNSET) {
      // 3) 截取最外层平衡括号区域再解析
      const region = _extractBalanced(s);
      if (region) {
        obj = _tryParseFull(region);
        if (obj === _UNSET) obj = _tryParseFull(_cleanJSON(region)); // 容错清洗后重试
      }
    }
    if (obj === _UNSET) return { raw: text };

    // 顶层为数组时，按需包装成 { questions: [...] }
    if (opts.asQuestions && Array.isArray(obj)) obj = { questions: obj };
    return obj;
  };

  API.testConnection = async function () {
    const r = await API.streamChat([{ role: "user", content: "ping，只回复 OK" }]);
    return { ok: !!r, sample: (r || "").slice(0, 50) };
  };

  API.analyzeJD = async function (jd, years, onToken, onEvent) {
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.analyzeJD(jd, years) }],
      { onToken, onEvent }
    );
    return API.parseJSON(text);
  };

  API.generate = async function (spec, onToken, onEvent) {
    // 每道题预估 2000 token（含正文+答案+追问+元数据），给足空间避免截断
    const estTokens = Math.max(4000, (spec.count || 10) * 2000);
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.generate(spec) }],
      { onToken, onEvent, maxTokens: estTokens }
    );
    return API.parseJSON(text, { asQuestions: true });
  };

  API.optimize = async function (question, action, onToken, onEvent) {
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.optimize(question, action) }],
      { onToken, onEvent }
    );
    return API.parseJSON(text);
  };

  API.completeness = async function (categories, onToken, onEvent) {
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.completeness(categories) }],
      { onToken, onEvent }
    );
    return API.parseJSON(text);
  };

  window.API = API;
})();
