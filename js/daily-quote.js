/* ============================================================
 * 每日一句 · 实时在线模块（无本地内置数据）
 *  - 名言：Hitokoto (https://v1.hitokoto.cn)  CORS:*
 *  - 配图：LoremFlickr (https://loremflickr.com) 按名言类型关键词实时取图，CORS:* 可 canvas 合成
 *  - 每天不同：按「年内第几天」做 lock 保证当天稳定；按日期 localStorage 缓存保证当天不跳动
 *  - 节日联动（v20261001e）：当天有节日且用户未关闭节日背景时，横幅换节日专属
 *    深色配色 + 节日文案胶囊，分享卡同步；无节日/已关闭则保持每日轮换配色
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
  // 每日配色：按「年内第几天」轮换横幅底色与点缀色（当天稳定，隔天自动换新；全部为深色系保证白字可读）
  var PALETTES = [
    { name: "靛蓝",   c1: "#1e3a8a", c2: "#3730a3", accent: "rgba(129,140,248,.22)" },
    { name: "松石绿", c1: "#064e3b", c2: "#047857", accent: "rgba(52,211,153,.20)" },
    { name: "紫罗兰", c1: "#4c1d95", c2: "#6d28d9", accent: "rgba(196,181,253,.22)" },
    { name: "玫瑰红", c1: "#831843", c2: "#9f1239", accent: "rgba(251,113,133,.20)" },
    { name: "青碧",   c1: "#134e4a", c2: "#0f766e", accent: "rgba(45,212,191,.20)" },
    { name: "暖橙",   c1: "#7c2d12", c2: "#9a3412", accent: "rgba(251,146,60,.20)" },
    { name: "深海蓝", c1: "#0c4a6e", c2: "#0369a1", accent: "rgba(56,189,248,.22)" },
    { name: "石墨灰", c1: "#1e293b", c2: "#334155", accent: "rgba(148,163,184,.20)" }
  ];
  function dayPalette() { return PALETTES[dayOfYear() % PALETTES.length]; }

  /* ---- 节日联动（v20261001e）----
   * 当天有节日且用户未关闭节日背景时，横幅改用节日专属深色配色与文案；
   * 无节日/已关闭则走上面的每日轮换配色。键与 js/festival.js 的 key 一一对应。 */
  var FEST_PAL = {
    newyear:     { c1: "#1e3a8a", c2: "#1d4ed8", accent: "rgba(147,197,253,.25)", wish: "新年快乐 · 万事顺遂" },
    spring:      { c1: "#7f1d1d", c2: "#b91c1c", accent: "rgba(252,165,165,.25)", wish: "新春快乐 · 万事如意" },
    lantern:     { c1: "#831843", c2: "#be123c", accent: "rgba(253,164,175,.25)", wish: "元宵快乐 · 团团圆圆" },
    qingming:    { c1: "#14532d", c2: "#15803d", accent: "rgba(134,239,172,.22)", wish: "清明 · 慎终追远" },
    labor:       { c1: "#7c2d12", c2: "#c2410c", accent: "rgba(253,186,116,.25)", wish: "劳动节快乐 · 致敬奋斗者" },
    children:    { c1: "#9d174d", c2: "#db2777", accent: "rgba(249,168,212,.25)", wish: "儿童节快乐 · 保持好奇" },
    dragonboat:  { c1: "#14532d", c2: "#047857", accent: "rgba(110,231,183,.22)", wish: "端午安康" },
    qixi:        { c1: "#831843", c2: "#a21caf", accent: "rgba(240,171,252,.25)", wish: "七夕快乐" },
    midautumn:   { c1: "#1e3a8a", c2: "#b45309", accent: "rgba(252,211,77,.25)", wish: "中秋快乐 · 人月两团圆" },
    double9:     { c1: "#713f12", c2: "#a16207", accent: "rgba(253,224,71,.22)", wish: "重阳 · 登高望远" },
    national:    { c1: "#7f1d1d", c2: "#b91c1c", accent: "rgba(252,165,165,.25)", wish: "国庆节快乐" },
    programmers: { c1: "#14532d", c2: "#16a34a", accent: "rgba(134,239,172,.22)", wish: "1024 · 节日快乐" },
    teachers:    { c1: "#713f12", c2: "#b45309", accent: "rgba(252,211,77,.25)", wish: "教师节快乐 · 感恩师长" },
    christmas:   { c1: "#166534", c2: "#15803d", accent: "rgba(252,165,165,.30)", wish: "圣诞快乐 · 平安喜乐" }
  };
  /* 当前生效的配色与节日（composeShare 合成分享卡时读取，与横幅保持一致） */
  var CUR = { pal: null, festName: "", wish: "" };

  /* ---- 节日主题文案池（v20261001f）：有节日时名言直接换成节日文案，按天稳定取一条、
   * 「换一条」在池内随机换；无节日仍走 Hitokoto。键与 js/festival.js 的 key 一一对应。 ---- */
  var FEST_QUOTES = {
    newyear: [
      { text: "新岁序开，同赴山海。愿你眼里有光，心中有梦，脚下有路。", author: "元旦寄语" },
      { text: "新年快乐！愿所有的好运，都在新的一年里如约而至。", author: "元旦寄语" },
      { text: "一元复始，万象更新；愿新年代码无 bug，来年更胜今年。", author: "元旦寄语" }
    ],
    spring: [
      { text: "爆竹声中一岁除，春风送暖入屠苏。新春快乐，阖家幸福！", author: "春节寄语" },
      { text: "愿新的一年：所求皆如愿，所行化坦途，多喜乐，长安宁。", author: "春节寄语" },
      { text: "辞旧迎新，山河锦绣；愿君岁岁平安，年年有为。", author: "春节寄语" }
    ],
    lantern: [
      { text: "火树银花合，星桥铁锁开。元宵快乐，团团圆圆！", author: "元宵寄语" },
      { text: "一碗汤圆，盛满团圆；愿你所念之人，皆在身边。", author: "元宵寄语" }
    ],
    qingming: [
      { text: "清明时节雨纷纷，路上行人欲断魂。慎终追远，珍惜眼前人。", author: "清明寄语" },
      { text: "气清景明，万物生长。愿你不负春光，砥砺前行。", author: "清明寄语" }
    ],
    labor: [
      { text: "人世间的一切幸福，都需要靠辛勤的劳动来创造。劳动节快乐！", author: "劳动节寄语" },
      { text: "致敬每一双创造美好的手——劳动最光荣！", author: "劳动节寄语" }
    ],
    children: [
      { text: "愿你出走半生，归来仍是少年。儿童节快乐！", author: "儿童节寄语" },
      { text: "永远保持好奇，永远热泪盈眶——这是最好的童年礼物。", author: "儿童节寄语" }
    ],
    dragonboat: [
      { text: "粽叶飘香，龙舟竞渡。端午安康，诸事顺遂！", author: "端午寄语" },
      { text: "路漫漫其修远兮，吾将上下而求索。端午安康！", author: "端午寄语" }
    ],
    qixi: [
      { text: "两情若是久长时，又岂在朝朝暮暮。七夕快乐！", author: "七夕寄语" },
      { text: "愿有岁月可回首，且以深情共白头。七夕快乐！", author: "七夕寄语" }
    ],
    midautumn: [
      { text: "但愿人长久，千里共婵娟。中秋快乐，阖家团圆！", author: "中秋寄语" },
      { text: "海上生明月，天涯共此时。愿人月两团圆。", author: "中秋寄语" }
    ],
    double9: [
      { text: "岁岁重阳，今又重阳。愿长辈福寿安康，笑口常开。", author: "重阳寄语" },
      { text: "登高望远，秋光正好。重阳安康！", author: "重阳寄语" }
    ],
    national: [
      { text: "山河远阔，国泰民安；愿以寸心寄华夏，且将岁月赠山河。", author: "国庆献礼" },
      { text: "家有山河锦绣，国有岁月芳华。祝祖国生日快乐，愿你假期愉快！", author: "国庆献礼" },
      { text: "以青春之名，书写清澈挚爱；以心中红星，献礼盛世中华。", author: "国庆献礼" },
      { text: "你所站立的地方，正是你的中国；你怎么样，中国便怎么样。", author: "国庆献礼" }
    ],
    programmers: [
      { text: "代码改变世界，而你正在其中。1024 程序员节快乐！", author: "1024 寄语" },
      { text: "愿你的生活如代码般简洁，如算法般高效。1024 节日快乐！", author: "1024 寄语" },
      { text: "愿你 commit 全绿，永无 996。程序员节快乐！", author: "1024 寄语" }
    ],
    teachers: [
      { text: "师者，所以传道受业解惑也。教师节快乐，感恩每一位引路人！", author: "教师节寄语" },
      { text: "三尺讲台系国运，一支粉笔写春秋。老师，您辛苦了！", author: "教师节寄语" }
    ],
    christmas: [
      { text: "铃儿响叮当，愿望挂枝头。圣诞快乐，愿你所盼皆成真。", author: "圣诞寄语" },
      { text: "愿你的代码 merry，屏幕 bright。圣诞快乐，平安喜乐！", author: "圣诞寄语" }
    ]
  };
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

    // 节日联动：data-festival 属性在（=用户未关闭节日背景且今天有节日）时换装，否则走每日轮换配色
    var fest = null;
    try {
      if (window.FestivalBG && document.documentElement.hasAttribute("data-festival")) fest = FestivalBG.today();
    } catch (e) {}
    var fpal = fest && FEST_PAL[fest.key] ? FEST_PAL[fest.key] : null;
    var festPool = fest && FEST_QUOTES[fest.key] ? FEST_QUOTES[fest.key] : [];
    var pal = fpal || dayPalette();
    CUR.pal = pal;
    CUR.festName = fpal ? fest.name : "";
    CUR.wish = fpal ? fpal.wish : "";

    // 每日配色：横幅底色渐变 + 点缀色（覆盖 CSS 默认深色，隔天自动换；节日当天用节日配色）
    var box = el.querySelector(".daily-quote");
    if (box) {
      box.style.background = "linear-gradient(135deg, " + pal.c1 + ", " + pal.c2 + ")";
      box.style.setProperty("--dq-accent", pal.accent);
    }

    // 节日文案：标签换 🎉 并追加节日胶囊（无节日不动，保持原样）
    var labelPill = el.querySelector(".daily-quote__label");
    if (fpal && labelPill) {
      labelPill.innerHTML = "🎉 每日一句 · <span id=\"dq-date\"></span>";
      document.getElementById("dq-date").textContent = dateLabel;
      var festPill = document.createElement("span");
      festPill.className = "daily-quote__label daily-quote__fest";
      festPill.textContent = fpal.wish;
      labelPill.parentNode.insertBefore(festPill, labelPill.nextSibling);
    }

    // 节日风背景：整幅横幅改为节日风格（金色星点 + 节日色光晕，不加载随机图），见 css .daily-quote.is-fest
    if (fpal && box) {
      box.classList.add("is-fest");
      var STAR_POS = [[6,18],[14,72],[24,35],[38,80],[52,15],[66,68],[78,28],[88,75],[94,20],[46,55]];
      var stars = document.createElement("div");
      stars.className = "daily-quote__stars";
      var html = "";
      for (var si = 0; si < STAR_POS.length; si++) {
        html += '<span style="left:' + STAR_POS[si][0] + '%;top:' + STAR_POS[si][1] + '%;animation-delay:' + (si * 0.37).toFixed(2) + 's">' + (si % 3 === 0 ? "★" : "✦") + "</span>";
      }
      stars.innerHTML = html;
      box.insertBefore(stars, box.querySelector(".daily-quote__inner"));
    }

    var bg = el.querySelector(".daily-quote__bg");
    var textEl = document.getElementById("dq-text");
    var authorEl = document.getElementById("dq-author");

    function paint(q, opts) {
      opts = opts || {};
      textEl.classList.remove("loading");
      textEl.textContent = "“" + q.text + "”";
      authorEl.innerHTML = "—— <b>" + (q.author || "佚名") + "</b>";
      if (CUR.festName) { bg.classList.remove("show"); return; } // 节日模式：不加载随机图，保持节日风格底
      var lock = opts.fresh ? Math.floor(Math.random() * 100000) : dayOfYear();
      var url = imgUrl(kwFor(q.type), lock);
      bg.classList.remove("show");
      bg.crossOrigin = "anonymous";
      bg.onload = function () { bg.classList.add("show"); };
      bg.onerror = function () { bg.classList.remove("show"); }; // 图挂了就保留渐变底
      bg.src = url;
    }

    function load(useCache) {
      // 节日模式：直接上节日文案池（按年内天取一条，当天稳定），不走 Hitokoto 与缓存
      if (festPool.length) {
        paint(festPool[dayOfYear() % festPool.length]);
        return;
      }
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
      // 节日模式：在节日文案池内随机换
      if (festPool.length) {
        paint(festPool[Math.floor(Math.random() * festPool.length)]);
        return;
      }
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

    // —— 鼠标放到名言上 → 背景图缓缓放大、提亮；移开恢复 ——
    var inner = el.querySelector(".daily-quote__inner");
    if (box && inner) {
      inner.addEventListener("mouseenter", function () { box.classList.add("is-hover"); });
      inner.addEventListener("mouseleave", function () { box.classList.remove("is-hover"); });
      // 触屏设备：点击切换（touchstart 后立即生效，click 时移除）
      inner.addEventListener("touchstart", function () { box.classList.add("is-hover"); }, { passive: true });
      inner.addEventListener("touchend", function () {
        setTimeout(function () { box.classList.remove("is-hover"); }, 1200);
      }, { passive: true });
    }

    load(true);
  }

  /* —— 分享：背景图 + 名言合成 1200x630 社交卡，下载 + 尝试复制 —— */
  function composeShare(bgImg, text, author) {
    text = (text || "").replace(/^[“"「]|[”"」]$/g, "");
    author = (author || "").replace(/^——\s*/, "");
    var W = 1200, H = 630;
    var pal = CUR.pal || dayPalette(); // 分享卡底色跟随横幅当前配色（节日当天同节日色）
    var festName = CUR.festName;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");

    var FONT_QUOTE = "600 54px 'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Source Han Sans SC',serif";
    var FONT_AUTHOR = "italic 300 32px 'PingFang SC','Microsoft YaHei',serif";
    var FONT_META = "500 22px 'PingFang SC','Microsoft YaHei',sans-serif";
    var FONT_BADGE = "600 18px 'PingFang SC','Microsoft YaHei',sans-serif";
    var FONT_FOOTER = "500 22px 'PingFang SC','Microsoft YaHei',sans-serif";

    var draw = function () {
      // 1) 底色（图片缺失/跨域污染时兜底）
      var gradBG = ctx.createLinearGradient(0, 0, W, H);
      gradBG.addColorStop(0, pal.c1);
      gradBG.addColorStop(1, pal.c2);
      ctx.fillStyle = gradBG; ctx.fillRect(0, 0, W, H);

      // 2) 背景图（已 crossOrigin，未污染即可绘制）
      try {
        if (bgImg && bgImg.complete && bgImg.naturalWidth) {
          var r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          var dw = bgImg.naturalWidth * r, dh = bgImg.naturalHeight * r;
          ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        }
      } catch (e) { /* tainted: 忽略，用底色 */ }

      // 3) 多层暗色叠层（增加深度与文字可读性）
      var baseOv = ctx.createLinearGradient(0, 0, 0, H);
      baseOv.addColorStop(0, "rgba(8,12,20,.30)");
      baseOv.addColorStop(0.55, "rgba(8,12,20,.55)");
      baseOv.addColorStop(1, "rgba(8,12,20,.85)");
      ctx.fillStyle = baseOv; ctx.fillRect(0, 0, W, H);

      // 4) 顶部柔和光晕（跟随当日点缀色，提升层次感）
      var glow = ctx.createRadialGradient(180, 0, 0, 180, 0, 720);
      glow.addColorStop(0, pal.accent);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // 4.5) 节日模式：金色星点点缀，与横幅节日风背景呼应
      if (festName) {
        ctx.save();
        ctx.font = "300 34px 'PingFang SC','Georgia',serif";
        ctx.fillStyle = "rgba(253,230,138,.95)";
        var starPos = [[180, 140], [1050, 110], [980, 500], [240, 500], [620, 92], [1120, 300], [92, 300]];
        for (var i = 0; i < starPos.length; i++) {
          ctx.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(i * 1.7));
          ctx.fillText(i % 3 === 0 ? "★" : "✦", starPos[i][0], starPos[i][1]);
        }
        ctx.restore();
      }

      // 5) 大号装饰性引号（右上角半透明 ❝）
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.font = "300 320px 'PingFang SC','Georgia','Times New Roman',serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("❝", W - 230, 290);
      ctx.restore();

      // 6) 顶部品牌徽章（圆角胶囊 + 细边框；节日当天带节日名）
      drawBadge(ctx, 60, 56, (festName ? "🎉 " + festName + " · " : "💡  ") + "IT 面试题库 · 每日一句", {
        fill: "rgba(255,255,255,.10)",
        stroke: "rgba(255,255,255,.28)",
        text: "rgba(255,255,255,.95)",
        font: FONT_BADGE
      });

      // 7) 名言正文（智能换行，垂直居中偏上）
      var maxLines = 4;
      var lineHeight = 78;
      var paddingX = 100;
      var maxW = W - paddingX * 2;
      var fullText = "「" + text + "」";
      ctx.font = FONT_QUOTE;
      var lines = smartWrap(ctx, fullText, maxW, maxLines);

      var quoteBlockH = lines.length * lineHeight;
      var quoteStartY = (H - quoteBlockH) / 2 + 10; // 略偏上，让作者与底部留白更平衡

      // 名言投影增强可读性
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 24; ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#ffffff";
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, paddingX, quoteStartY + i * lineHeight);
      });
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

      // 8) 作者分隔线 + 作者名
      var authorY = quoteStartY + quoteBlockH + 28;
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillRect(paddingX, authorY, 60, 3);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = FONT_AUTHOR;
      ctx.fillText("—— " + author, paddingX, authorY + 42);

      // 9) 底部分隔线
      var footY = H - 56;
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.fillRect(60, footY - 28, W - 120, 1);

      // 10) 页脚：左品牌名 / 右日期 + 域名
      ctx.fillStyle = "rgba(255,255,255,.70)";
      ctx.font = FONT_FOOTER;
      ctx.textAlign = "left";
      ctx.fillText(festName ? "每日一句 · " + festName : "每日一句", 60, footY);

      var d = new Date();
      var dateStr = (d.getMonth() + 1) + "月" + d.getDate() + "日 · " + d.getFullYear();
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "500 20px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(dateStr + "   ·   " + location.host, W - 60, footY);
      ctx.textAlign = "left";

      // 11) 导出 PNG + 下载 + 尝试复制
      cv.toBlob(function (blob) {
        if (!blob) { alert("当前图片跨域，无法合成，可长按横幅截图分享"); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = "daily-quote-" + d.getFullYear() + (d.getMonth()+1 < 10 ? "0"+(d.getMonth()+1) : (d.getMonth()+1)) + (d.getDate() < 10 ? "0"+d.getDate() : d.getDate()) + ".png";
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

  function drawBadge(ctx, x, y, text, st) {
    ctx.save();
    ctx.font = st.font;
    var tw = ctx.measureText(text).width;
    var padX = 22, padY = 12;
    var fs = parseInt((st.font.match(/(\d+)px/) || ["0", "18"])[1], 10) || 18;
    var w = tw + padX * 2, h = fs + padY * 2 - 6;
    var r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = st.fill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = st.stroke;
    ctx.stroke();
    ctx.fillStyle = st.text;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y + h / 2 + 1);
    ctx.restore();
  }

  /* 智能换行：优先在中文标点处断行，控制在 maxLines 行内 */
  function smartWrap(ctx, text, maxW, maxLines) {
    var chars = text.split("");
    var lines = [], cur = "";
    var PUNCT = /[，。！？；：、,!?;:.\s]/;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) {
        // 在当前行最近 8 个字符内找最佳断点（标点优先）
        var bestIdx = -1;
        var from = Math.max(0, cur.length - 8);
        for (var j = cur.length - 1; j >= from; j--) {
          if (PUNCT.test(cur[j])) { bestIdx = j; break; }
        }
        if (bestIdx >= from) {
          lines.push(cur.substring(0, bestIdx + 1));
          cur = cur.substring(bestIdx + 1) + ch;
        } else {
          lines.push(cur); cur = ch;
        }
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    // 限制最大行数；超长截断加省略号
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + "…";
    }
    return lines;
  }

  window.DailyQuote = { mount: mount };
})();
