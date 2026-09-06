/* ============================================================
 * 每日一句 · 实时在线模块（无本地内置数据）
 *  - 名言：Hitokoto (https://v1.hitokoto.cn)  CORS:*
 *  - 配图：LoremFlickr (https://loremflickr.com) 按名言类型关键词实时取图，CORS:* 可 canvas 合成
 *  - 每天不同：按「年内第几天」做 lock 保证当天稳定；按日期 localStorage 缓存保证当天不跳动
 * ============================================================ */
(function () {
  "use strict";

  var CACHE_KEY = "dq_cache_v2";
  // Hitokoto 类型 -> 配图关键词（中文意境匹配）
  var KW = {
    i: "chinese,ink",        // 诗词
    k: "mountain,abstract",  // 哲学
    d: "library,books",      // 文学
    a: "anime,sky",          // 动画
    b: "comic,color",        // 漫画
    c: "game,neon",          // 游戏
    f: "code,screen",        // 网络
    g: "nature,cloud",       // 其他
    h: "film,cinema",        // 影视
    j: "music,night",        // 网易云
    l: "light,fun"           // 抖机灵
  };
  // 兜底名言（接口全挂时仍可展示，不含任何本地图）
  var FALLBACK = [
    { text: "我们所爱之物，昭示着我们究竟是谁。", author: "托马斯·阿奎纳" },
    { text: "知者不惑，仁者不忧，勇者不惧。", author: "《论语》" },
    { text: "技术应当服务于人，而非相反。", author: "佚名" }
  ];

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function dayOfYear() {
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  function kwFor(t) { return KW[t] || "nature,sky"; }
  function imgUrl(kw, lock) { return "https://loremflickr.com/1600/900/" + kw + "?lock=" + lock; }

  function fetchQuote() {
    var url = "https://v1.hitokoto.cn/?encode=json&c=i&c=k&c=d&c=a&c=b&c=c&c=f&c=g&c=h&c=j&c=l";
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("hitokoto " + r.status);
      return r.json();
    }).then(function (j) {
      return {
        text: j.hitokoto || "",
        author: j.from_who || j.from || "佚名",
        type: j.type || "g",
        id: j.id || ""
      };
    });
  }

  function getCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) { return null; }
  }
  function setCache(o) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch (e) {}
  }

  function mount(el) {
    if (!el) return;
    el.innerHTML =
      '<div class="daily-quote">' +
        '<img class="daily-quote__bg" alt="">' +
        '<div class="daily-quote__overlay"></div>' +
        '<div class="daily-quote__inner">' +
          '<span class="daily-quote__label">💡 每日一句 · <span id="dq-date"></span></span>' +
          '<div class="daily-quote__text" id="dq-text"><span class="daily-quote__spinner"></span> 正在为你准备今天的灵感…</div>' +
          '<div class="daily-quote__author" id="dq-author"></div>' +
          '<div class="daily-quote__actions">' +
            '<span class="dq-btn" id="dq-shuffle">🎲 换一条</span>' +
            '<span class="dq-btn" id="dq-share">🖼️ 分享图片</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    var d = new Date();
    var dateLabel = (d.getMonth() + 1) + "月" + d.getDate() + "日";
    document.getElementById("dq-date").textContent = dateLabel;

    var bg = el.querySelector(".daily-quote__bg");
    var textEl = document.getElementById("dq-text");
    var authorEl = document.getElementById("dq-author");

    function paint(q, opts) {
      opts = opts || {};
      textEl.classList.remove("loading");
      textEl.textContent = "“" + q.text + "”";
      authorEl.innerHTML = "—— <b>" + (q.author || "佚名") + "</b>";
      var lock = opts.fresh ? Math.floor(Math.random() * 100000) : dayOfYear();
      var url = imgUrl(kwFor(q.type), lock);
      bg.classList.remove("show");
      bg.crossOrigin = "anonymous";
      bg.onload = function () { bg.classList.add("show"); };
      bg.onerror = function () { bg.classList.remove("show"); }; // 图挂了就保留渐变底
      bg.src = url;
    }

    function load(useCache) {
      if (useCache) {
        var c = getCache();
        if (c && c.date === todayStr() && c.text) {
          paint(c);
          return;
        }
      }
      fetchQuote().then(function (q) {
        q.date = todayStr();
        setCache(q);
        paint(q);
      }).catch(function () {
        var f = FALLBACK[dayOfYear() % FALLBACK.length];
        textEl.classList.remove("loading");
        textEl.textContent = "“" + f.text + "”";
        authorEl.innerHTML = "—— <b>" + f.author + "</b> <span style='opacity:.6;font-size:12px'>(离线兜底)</span>";
      });
    }

    document.getElementById("dq-shuffle").addEventListener("click", function () {
      textEl.classList.add("loading");
      textEl.innerHTML = '<span class="daily-quote__spinner"></span> 换一条中…';
      authorEl.textContent = "";
      fetchQuote().then(function (q) {
        paint(q, { fresh: true });
      }).catch(function () {
        textEl.classList.remove("loading");
        textEl.textContent = "😅 暂时没取到，换个网络再试？";
      });
    });

    document.getElementById("dq-share").addEventListener("click", function () {
      composeShare(bg, textEl.textContent, authorEl.textContent);
    });

    load(true);
  }

  /* —— 分享：背景图 + 名言合成 1200x630 社交卡，下载 + 尝试复制 —— */
  function composeShare(bgImg, text, author) {
    text = (text || "").replace(/^[“"]|[”"]$/g, "");
    author = (author || "").replace(/^——\s*/, "");
    var W = 1200, H = 630;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    // 底色
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
    // 背景图（已 crossOrigin，未污染即可绘制）
    var draw = function () {
      try {
        if (bgImg && bgImg.complete && bgImg.naturalWidth) {
          var r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          var dw = bgImg.naturalWidth * r, dh = bgImg.naturalHeight * r;
          ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        }
      } catch (e) { /* tainted: 忽略，用底色 */ }
      // 暗色叠层
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(8,12,20,.42)"); g.addColorStop(1, "rgba(8,12,20,.74)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 文案
      ctx.fillStyle = "#fff";
      ctx.font = "600 44px 'PingFang SC','Microsoft YaHei',sans-serif";
      wrapText(ctx, "“" + text + "”", 80, 250, W - 160, 62);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "italic 28px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText("—— " + author, 80, H - 90);
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "500 22px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText("每日一句 · IT 面试题库", 80, H - 50);
      // 导出
      cv.toBlob(function (blob) {
        if (!blob) { alert("当前图片跨域，无法合成，可长按横幅截图分享"); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = "daily-quote.png";
        document.body.appendChild(a); a.click(); a.remove();
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
              .then(function () { if (window.U && U.toast) U.toast("已复制到剪贴板并下载", "success"); })
              .catch(function () {});
          }
        } catch (e) {}
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, "image/png");
    };
    if (bgImg && !bgImg.complete) { bgImg.onload = draw; bgImg.onerror = draw; }
    else draw();
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    var chars = text.split("");
    var line = "", lines = [];
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = chars[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    lines = lines.slice(0, 4);
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], x, y + j * lh);
  }

  window.DailyQuote = { mount: mount };
})();
