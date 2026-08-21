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

  API.defaults = { base: "https://api.deepseek.com/v1", model: "deepseek-chat", timeout: 60, temp: 0.7, max: 20, store: "local" };

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

  /* 流式对话，返回完整文本；onToken(delta, full) 可选 */
  API.streamChat = async function (messages, opts) {
    opts = opts || {};
    const ev = opts.onEvent;
    const cfg = API.getConfig();
    const key = API.getKey();
    if (!key) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const url = (cfg.base || API.defaults.base).replace(/\/$/, "") + "/chat/completions";
    if (ev) ev("connecting", { model: cfg.model || "deepseek-chat" });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), (cfg.timeout || 60) * 1000);
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({ model: cfg.model || "deepseek-chat", messages: messages, stream: true, temperature: cfg.temp ?? 0.7 }),
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(timer);
      if (e && e.name === "AbortError") {
        if (ev) ev("error", { code: "TIMEOUT" });
        const err = new Error("TIMEOUT"); err.code = "TIMEOUT"; throw err;
      }
      if (ev) ev("error", { code: "CORS" });
      const err = new Error("CORS"); err.code = "CORS"; err.raw = e; throw err;
    }
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) {
      if (ev) ev("error", { code: "INVALID_KEY" });
      const err = new Error("INVALID_KEY"); err.code = "INVALID_KEY"; throw err;
    }
    if (!res.ok) {
      if (ev) ev("error", { code: "HTTP", status: res.status });
      const err = new Error("HTTP_" + res.status); err.code = "HTTP"; err.status = res.status; throw err;
    }
    if (ev) ev("connected", { model: cfg.model || "deepseek-chat" });

    if (!res.body) {
      const j = await res.json();
      const content = j.choices && j.choices[0] && j.choices[0].message.content;
      if (ev) ev("done", { chars: (content || "").length });
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
    if (ev) ev("done", { chars: full.length });
    return full;
  };

  /* 解析 AI 返回：优先 JSON；否则尝试提取代码块；失败返回 {raw} */
  API.parseJSON = function (text) {
    if (!text) return null;
    let s = text.trim();
    // 去 ```json 围栏
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    try { return JSON.parse(s); }
    catch (e) {
      // 尝试截取首个 { 到末个 }
      const a = s.indexOf("{"), b = s.lastIndexOf("}");
      if (a >= 0 && b > a) {
        try { return JSON.parse(s.slice(a, b + 1)); } catch (e2) {}
      }
      // 常见修复：去尾部逗号
      try { return JSON.parse(s.replace(/,\s*([}\]])/g, "$1")); } catch (e3) {}
      return { raw: text };
    }
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
    const text = await API.streamChat(
      [{ role: "system", content: AIPrompts.SYSTEM }, { role: "user", content: AIPrompts.generate(spec) }],
      { onToken, onEvent }
    );
    return API.parseJSON(text);
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
