/* ============================================================
 * 节日背景自动切换（js/festival.js）
 * - 按当天日期在 <html> 上设置 data-festival="key"，配合 css/festival.css 生效
 * - 纯 CSS 渐变背景，无图片资源；明暗主题各有配色
 * - 左下角显示一个可关闭的小角标（点击 = 本次关闭并记住）
 * - 重新开启：localStorage.removeItem('iti_festival') 后刷新
 * - 农历节日（春节/元宵/端午/七夕/中秋/重阳）按公历日期表映射，覆盖 2026-2028；
 *   表外年份农历节日自动跳过，公历节日不受影响
 * 依赖：无（原生 JS，幂等，可重复执行）
 * ============================================================ */
(function () {
  "use strict";
  var LS_KEY = "iti_festival";

  /* 节日表：数组顺序即优先级（中秋排在国庆前，2028 年重叠时优先中秋） */
  var FESTIVALS = [
    /* ---- 农历节日（公历映射，2026-2028）---- */
    { key: "spring",     name: "春节",       dot: "#dc2626",
      ranges: [["2026-02-16", "2026-02-23"], ["2027-02-05", "2027-02-12"], ["2028-01-25", "2028-02-01"]] },
    { key: "lantern",    name: "元宵节",     dot: "#f43f5e",
      dates: ["2026-03-03", "2027-02-20", "2028-02-09"] },
    { key: "dragonboat", name: "端午节",     dot: "#059669",
      dates: ["2026-06-19", "2027-06-09", "2028-05-28"] },
    { key: "qixi",       name: "七夕",       dot: "#ec4899",
      dates: ["2026-08-19", "2027-08-08", "2028-08-26"] },
    { key: "midautumn",  name: "中秋节",     dot: "#d97706",
      dates: ["2026-09-25", "2027-09-15", "2028-10-03"] },
    { key: "double9",    name: "重阳节",     dot: "#ca8a04",
      dates: ["2026-10-18", "2027-10-08", "2028-10-27"] },
    /* ---- 公历节日（每年固定）---- */
    { key: "newyear",     name: "元旦",      dot: "#2563eb", md: [["01-01", "01-03"]] },
    { key: "qingming",    name: "清明",      dot: "#10b981", md: [["04-04", "04-06"]] },
    { key: "labor",       name: "劳动节",    dot: "#f97316", md: [["05-01", "05-05"]] },
    { key: "children",    name: "儿童节",    dot: "#ec4899", md: [["06-01", "06-01"]] },
    { key: "teachers",    name: "教师节",    dot: "#f59e0b", md: [["09-10", "09-10"]] },
    { key: "national",    name: "国庆节",    dot: "#dc2626", md: [["10-01", "10-07"]] },
    { key: "programmers", name: "程序员节",  dot: "#16a34a", md: [["10-24", "10-24"]] },
    { key: "christmas",   name: "圣诞节",    dot: "#15803d", md: [["12-24", "12-25"]] }
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* 本地时区的 YYYY-MM-DD */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function todayMD() { return todayISO().slice(5); }

  function inRanges(iso, ranges) {
    for (var i = 0; i < ranges.length; i++) {
      if (iso >= ranges[i][0] && iso <= ranges[i][1]) return true;
    }
    return false;
  }
  function inDates(iso, dates) { return dates.indexOf(iso) !== -1; }
  function inMD(md, mds) {
    for (var i = 0; i < mds.length; i++) {
      if (md >= mds[i][0] && md <= mds[i][1]) return true;
    }
    return false;
  }

  function matchFestival(iso) {
    var md = iso.slice(5);
    for (var i = 0; i < FESTIVALS.length; i++) {
      var f = FESTIVALS[i];
      if ((f.ranges && inRanges(iso, f.ranges)) ||
          (f.dates && inDates(iso, f.dates)) ||
          (f.md && inMD(md, f.md))) {
        return f;
      }
    }
    return null;
  }

  function removeBadge() {
    var el = document.getElementById("festival-badge");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function renderBadge(f) {
    var el = document.getElementById("festival-badge");
    if (!el) {
      el = document.createElement("button");
      el.id = "festival-badge";
      el.type = "button";
      el.title = "今天是「" + f.name + "」，已自动换上节日背景。点击关闭（可随时在设置里重新打开）";
      document.body.appendChild(el);
      el.addEventListener("click", function () {
        try { localStorage.setItem(LS_KEY, "off"); } catch (e) {}
        document.documentElement.removeAttribute("data-festival");
        removeBadge();
      });
    }
    el.innerHTML = '<span class="f-dot" style="background:' + f.dot + '"></span><span>' + f.name + '</span>';
  }

  function apply() {
    var root = document.documentElement;
    var off = false;
    try { off = localStorage.getItem(LS_KEY) === "off"; } catch (e) {}

    var f = matchFestival(todayISO());
    if (off || !f) {
      root.removeAttribute("data-festival");
      removeBadge();
      return;
    }
    if (root.getAttribute("data-festival") !== f.key) {
      root.setAttribute("data-festival", f.key);
    }
    renderBadge(f);
  }

  /* 导出（调试/设置页可用）：FestivalBG.apply() / FestivalBG.today() */
  window.FestivalBG = { apply: apply, today: function () { return matchFestival(todayISO()); } };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
