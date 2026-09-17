/* =========================================================================
 *  js/docs/frontend.js — 技术教程「前端 Web」方向数据（官方文档目录重构版）
 *  骨架取自：MDN Web Docs（HTML / CSS / JavaScript / DOM / HTTP）/ WHATWG
 *  Standards（DOM·HTML·Fetch）/ react.dev / Vue 3 Docs / Vite Guide /
 *  TypeScript Handbook / web.dev（Vitals·Rendering Performance）/
 *  Performance API / micro-frontends.org / OWASP Cheat Sheet Series。
 *  正文代码围栏用 ${F}、行内代码用 ${C}；shell/JS 里 ${C}VAR${C} 写成 \${VAR}。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

  const FRONTEND = {
    id: "frontend",
    name: "前端 Web",
    icon: "🎨",
    desc: "以 MDN Web Docs、WHATWG 标准、react.dev、Vue 3 官方文档、Vite Guide、TypeScript Handbook 与 web.dev 的官方目录为骨架，覆盖语义化布局、JS 核心、DOM 事件、HTTP 缓存、异步编程、框架原理、组件状态、工程化、TypeScript、渲染性能、监控、微前端与前端安全的完整前端知识体系。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "对应 MDN「Learn Web Development / HTML / CSS / JavaScript」入门到进阶章节：语义化布局、JS 核心语法、DOM 事件、HTTP 与缓存、响应式适配。",
        chapters: [
          {
            id: "html-css-layout",
            title: "HTML 语义化与 CSS 布局",
            minutes: 22,
            updated: "2026-09-17",
            applies: "HTML Living Standard / CSS（Flex·Grid）",
            tags: ["HTML", "CSS", "Flex", "Grid"],
            terms: ["HTML", "CSS", "Flex", "布局"],
            body: `
> **官方文档基线**：[MDN → HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element) · [MDN → CSS Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_layout)（Flexbox / Grid / Normal flow）· [WHATWG HTML Standard](https://html.spec.whatwg.org/multipage/)

## 一、语义化：标签是「含义」不是「样式」

MDN 的 HTML elements reference 给每个元素都标注了内容类别与语义角色。语义化的价值不在「道德正确」，而在三个实际收益：

1. **可访问性（a11y）**：读屏器靠地标元素（${C}nav${C} / ${C}main${C} / ${C}aside${C}）导航，MDN「Accessibility」章有专门论述；
2. **SEO**：搜索引擎对标题层级与语义结构加权；
3. **可维护性**：${C}<article>${C} 比 ${C}<div class="article">${C} 的信息密度高一个量级。

${F}html
<!-- 页面骨架：地标元素的正确用法 -->
<header>  站点头部（logo / 全局导航）</header>
<nav>     导航链接集合（可有多个，aria-label 区分）</nav>
<main>    页面唯一主体（每页只应有一个）</main>
  <article> 独立可分发的内容单元</article>
  <section> 按主题分组的内容块（通常带标题）</section>
<aside>   与主内容弱相关（侧栏、广告、延伸阅读）</aside>
<footer>  页脚</footer>
${F}

两个易混点（MDN 各有专页）：${C}section${C} 需要标题、是主题分组；${C}div${C} 无语义、纯样式容器。**找不到更贴切的语义标签时才用 div**。

## 二、CSS 盒模型与布局体系

MDN「CSS layout」模块的官方分类就是布局方案的学习目录：Normal flow → Flexbox → Grid → Float（遗留）→ Positioning。

**盒模型**：${C}box-sizing: border-box${C} 让 width 含 padding 与 border，是现代项目的默认起点：

${F}css
*, *::before, *::after { box-sizing: border-box; }
${F}

**Flexbox（一维布局）**——MDN「Flexbox」章核心概念速查：

${F}css
.container {
  display: flex;
  flex-direction: row;             /* 主轴方向 */
  justify-content: space-between;  /* 主轴对齐 */
  align-items: center;             /* 交叉轴对齐 */
  gap: 12px;                       /* 子项间距（代替 margin hack） */
}
.item { flex: 1 1 0; }             /* grow shrink basis：等分 */
${F}

**Grid（二维布局）**——同时控制行与列：

${F}css
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);  /* 12 栏栅格 */
  gap: 16px;
}
.card { grid-column: span 4; }              /* 占 4 栏 */
@media (max-width: 768px) { .card { grid-column: span 12; } }
${F}

**选型口诀**（MDN 观点）：内容沿一行或一列排布用 Flex；需要行+列的二维约束（整页框架、卡片栅格）用 Grid；两者可以嵌套共存。

## 三、居中的几种正统写法

${F}css
/* 水平+垂直居中（首选） */
.center { display: grid; place-items: center; }
/* Flex 版本 */
.center { display: flex; justify-content: center; align-items: center; }
/* 绝对定位版本（父元素需 position 非 static） */
.center-abs { position: absolute; inset: 0; margin: auto; }
${F}

## 四、层叠上下文与 z-index 的真相

MDN「Stacking context」章是面试高频出处：${C}z-index${C} 只在**同一层叠上下文**内比较。形成新层叠上下文的常见条件：根元素、${C}position${C} 非 static 且 ${C}z-index${C} 非 auto、${C}opacity < 1${C}、${C}transform${C}、${C}filter${C}、${C}isolation: isolate${C}。

这就是「z-index 设了 9999 却被盖住」的根因——父级形成了上下文，子元素的 z-index 被关在父级作用域里比较。治理办法：**z-index 收敛为设计 token（如 10/20/30），禁止组件里随意放大数值**。

## ⚠ 常见误区

1. **用 float 做布局**：float 的设计意图是文字环绕（MDN 已归为遗留布局手段）；排进清单只为维护老代码。
2. **rem/em 混用无章法**：${C}rem${C} 相对根字号（适合间距、字号），${C}em${C} 相对当前元素字号（适合组件内部比例）。混用会导致「改一处字号全站位移」。
3. **移动端写死 px 再用 JS 缩放**：正确路径是 viewport meta + 相对单位 + 媒体查询（见「响应式与移动端适配」篇）。
4. **${C}min-height: 100vh${C} 的 sticky footer 在 iOS 上想当然**：Safari 对 ${C}vh${C} 的计算包含地址栏区域，需要 ${C}dvh${C}（动态视口高度）兜底。

## ✅ 自检清单

- [ ] 新页面用语义地标元素搭骨架，main 唯一
- [ ] box-sizing: border-box 全局生效
- [ ] 布局选型有 Flex/Grid 决策依据
- [ ] z-index 有 token 化管理，无 9999
- [ ] 移动 Safari 上验证过 100vh 类布局

## 📚 延伸阅读

- MDN → CSS Layout（Flexbox / Grid 模块全读）
- MDN → Stacking context（层叠上下文形成条件的权威列表）
- web.dev → Learn CSS（Google 的交互式 CSS 教程，与 MDN 互补）
`
          },
          {
            id: "js-core",
            title: "JavaScript 核心语法",
            minutes: 24,
            updated: "2026-09-17",
            applies: "ES2024 / 所有现代浏览器",
            tags: ["JavaScript", "类型", "作用域"],
            terms: ["JavaScript", "闭包", "原型", "this"],
            body: `
> **官方文档基线**：[MDN → JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)（Grammar and types / Control flow / Functions / Objects）· [MDN → Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness) · [ECMA-262 规范](https://tc39.es/ecma262/)（查阅语义细节）

## 一、类型系统：动态弱类型的边界

MDN「Grammar and types」章：7 种原始类型（${C}number${C} / ${C}string${C} / ${C}boolean${C} / ${C}undefined${C} / ${C}null${C} / ${C}symbol${C} / ${C}bigint${C}）+ 对象类型。

typeof 的历史包袱（MDN Reference 页明确列出）：

${F}js
typeof null          // "object"  —— 历史遗留 bug，永远记住
typeof function(){}  // "function"（可辨识）
typeof NaN           // "number"  —— NaN 是 number 类型的一个值
Number.isNaN(NaN)    // true（推荐，不会误伤其他值）
0.1 + 0.2 === 0.3    // false —— IEEE 754；金额用整数分或 decimal 库
Object.is(0, -0)     // false —— 区分 +0/-0
${F}

**相等比较三件套**（MDN「Equality comparisons and sameness」专页）：

- ${C}==${C}：宽松相等，隐式转换（几乎不用，ESLint 默认禁）；
- ${C}===${C}：严格相等（NaN 不等自身）；
- ${C}Object.is${C}：同值相等（区分 ±0，NaN 等自身）。

## 二、作用域、闭包与变量提升

MDN「Closures」章的定义：**闭包 = 函数 + 其词法环境的引用**。函数记住它「出生地」的作用域链，即使在外部执行也能访问。

${F}js
function makeCounter() {
  let count = 0;              // 私有状态：外部无法直接改
  return { inc: () => ++count, get: () => count };
}
const c = makeCounter();
c.inc(); c.inc();
c.get(); // 2 —— count 被闭包捕获而存活
${F}

经典陷阱（for 循环 var vs let）：

${F}js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
// let 每次迭代创建新的绑定；var 是函数级单一绑定
${F}

## 三、this 的四条绑定规则

MDN「Function → this」章 + 官方规范口径，优先级从高到低：

1. **new 绑定**：指向新创建的实例；
2. **显式绑定**：${C}call${C} / ${C}apply${C} / ${C}bind${C} 指定的对象；
3. **隐式绑定**：${C}obj.fn()${C} 指向 ${C}obj${C}（看调用者）；
4. **默认绑定**：独立调用下非严格模式指向 ${C}globalThis${C}，严格模式是 ${C}undefined${C}。

**箭头函数没有自己的 this**——沿用定义处词法作用域的 this。因此「对象方法」不适合用箭头函数（this 不指向对象），而「回调中保持外层 this」恰恰是它的正确用途。

## 四、原型与继承

MDN「Inheritance and the prototype chain」章：每个对象都有内部插槽 ${C}[[Prototype]]${C}（通过 ${C}Object.getPrototypeOf${C} 访问）；属性访问沿原型链向上查找。

${F}js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + " makes a sound"; }
}
class Dog extends Animal {
  speak() { return this.name + " barks"; }
}
// class 是原型继承的语法糖：Dog.prototype.__proto__ === Animal.prototype
// 方法定义在 prototype 上；实例字段在构造器里（ES2022 类字段）
${F}

## 五、解构、展开与剩余参数

${F}js
// 解构 + 默认值 + 重命名（MDN Destructuring assignment）
const { name: userName = "anon", ...rest } = user;
const [first, , third] = list;         // 跳位解构
// 展开是浅拷贝（嵌套对象仍共享引用）
const copy = { ...obj, nested: { ...obj.nested } };
// 剩余参数收集实参
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
${F}

## ⚠ 常见误区

1. **展开运算符当深拷贝**：一层浅拷贝，嵌套引用仍共享；深拷贝用 ${C}structuredClone${C}（浏览器/Node 均已内建）。
2. **在循环里创建闭包却没意识到**：定时器/事件回调捕获大对象导致内存泄漏，用完要清理或用 ${C}AbortController${C}。
3. **依赖隐式类型转换**：${C}"5" - 2${C} 是 3 而 ${C}"5" + 2${C} 是 "52"；所有比较显式转型。
4. **${C}forEach${C} 里 await**：forEach 不等待异步回调（忽略返回的 Promise）；并发用 ${C}Promise.all${C}，串行用 ${C}for...of${C}。

## ✅ 自检清单

- [ ] 能口述 this 四条绑定规则与箭头函数的差异
- [ ] 闭包的内存泄漏风险有排查意识（DevTools Memory）
- [ ] 深浅拷贝场景用对工具（structuredClone vs 展开）
- [ ] 金额不用浮点直接运算
- [ ] 团队统一禁用 ==（ESLint eqeqeq）

## 📚 延伸阅读

- MDN → JavaScript Guide（从头到尾过一遍，官方体系最完整）
- MDN → Closures / Inheritance and the prototype chain
`
          },
          {
            id: "dom-event",
            title: "DOM 与事件",
            minutes: 22,
            updated: "2026-09-17",
            applies: "WHATWG DOM Standard / 所有现代浏览器",
            tags: ["DOM", "事件", "委托"],
            terms: ["DOM", "事件", "冒泡", "委托"],
            body: `
> **官方文档基线**：[WHATWG DOM Standard](https://dom.spec.whatwg.org/)（§2.7 Event dispatch 的权威定义）· [MDN → Introduction to events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) · [MDN → Event reference](https://developer.mozilla.org/en-US/docs/Web/Events)（全部事件类型索引）

## 一、DOM 树与节点操作

WHATWG DOM Standard 定义了 DOM 的全部接口。日常操作速查：

${F}js
// 创建与插入
const li = document.createElement("li");
li.textContent = "item";            // textContent 安全；innerHTML 有 XSS 风险
list.appendChild(li);
list.prepend(li);                   // 头部插入
list.replaceChildren(...newNodes);  // 一次性替换（性能优于清空+循环 append）

// 查询（现代标准：querySelector 系）
document.querySelector(".card[data-id='1']");
// contains / closest：判断祖先关系（事件委托的基石）
e.target.closest(".card");
${F}

**性能意识**：连续修改 DOM 触发同步重排（reflow）。批量操作用 ${C}DocumentFragment${C}，或先把元素 ${C}display:none${C} 改完再显示；读写分离——避免在循环里「读 ${C}offsetHeight${C} → 写样式 → 再读」交替触发布局抖动。

## 二、事件模型：捕获 → 目标 → 冒泡

WHATWG DOM §2.7 规定事件分派三阶段：

${F}text
window → document → ... → 父级      （捕获阶段，Capture Phase）
          ↓
      目标元素                       （目标阶段，Target Phase）
          ↓
父级 → ... → document → window     （冒泡阶段，Bubble Phase）
${F}

${F}js
el.addEventListener("click", handler, { capture: true }); // 捕获期触发
el.addEventListener("click", handler, { once: true });    // 触发一次自动移除
el.addEventListener("click", handler, { passive: true }); // 承诺不调 preventDefault
                                                          // （scroll/touch 必加，性能）
el.removeEventListener("click", handler); // 移除必须是同一函数引用
${F}

${C}stopPropagation()${C} 阻止继续传播；${C}stopImmediatePropagation()${C} 连同层后续监听器也停；${C}preventDefault()${C} 阻止默认行为（如表单提交、链接跳转）——**三者互不相干，别混淆**。

## 三、事件委托：内存与动态节点的标准解法

原理：利用冒泡，把监听器挂在父容器上，用 ${C}e.target${C} 找真正被点的元素。子元素增删无需重新绑事件，监听器数量 O(1)。

${F}js
list.addEventListener("click", (e) => {
  const item = e.target.closest("li.item");
  if (!item) return;                 // 点在容器空白处
  if (e.metaKey || e.ctrlKey) return; // 保留修饰键原生行为
  selectItem(item.dataset.id);
});
${F}

**不适合委托的场景**：不冒泡的事件（${C}focus${C} / ${C}blur${C} / ${C}load${C}——可用 ${C}focusin${C} / ${C}focusout${C} 替代）；对 ${C}input${C} 类实时值读取建议直接绑。

## 四、自定义事件与组件通信

${F}js
// 组件内部派发（浏览器原生 CustomEvent）
el.dispatchEvent(new CustomEvent("item-select", {
  bubbles: true,                    // 允许外层委托
  detail: { id: 42 },
}));
// 外层监听
host.addEventListener("item-select", (e) => console.log(e.detail.id));
${F}

这与 Web Components（MDN「Custom elements」章）的属性/事件对外协议一致：**组件对外暴露「属性进、事件出」**，不直接操作宿主 DOM。

## ⚠ 常见误区

1. **innerHTML 拼接用户输入**：XSS 直通车（本方向「前端安全」篇展开）；插入纯文本一律 ${C}textContent${C}。
2. **匿名函数 addEventListener 后无法 removeEventListener**：移除需要保留同一引用（组件卸载时成对清理，防泄漏）。
3. **scroll/touch 监听不加 passive**：阻塞合成器线程，滚动掉帧；Chrome DevTools 的 Performance 面板会明确警告。
4. **在委托里假设 e.target 就是监听元素**：e.target 是实际点击的最深层元素，必须 ${C}closest()${C} 归位；比较监听元素用 ${C}e.currentTarget${C}。

## ✅ 自检清单

- [ ] 批量 DOM 变更有 Fragment / replaceChildren 意识
- [ ] 动态列表事件用委托，无逐项绑定
- [ ] scroll/touch/touchmove 监听加 passive: true
- [ ] 组件卸载时移除全部监听（含 window 级）
- [ ] 纯文本插入用 textContent，杜绝 innerHTML 拼用户输入

## 📚 延伸阅读

- WHATWG DOM Standard → §2.7 Event dispatch（三阶段的规范原文）
- MDN → Event reference（按类别索引的全部事件）
- MDN → Web Components（Custom elements / Shadow DOM）
`
          },
          {
            id: "browser-http",
            title: "HTTP 与浏览器缓存",
            minutes: 24,
            updated: "2026-09-17",
            applies: "HTTP/1.1·2·3 / 浏览器网络栈",
            tags: ["HTTP", "缓存", "CORS"],
            terms: ["HTTP", "缓存", "强缓存", "协商缓存"],
            body: `
> **官方文档基线**：[MDN → HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)（Overview / Caching / CORS / Conditional requests）· [RFC 9110（HTTP Semantics）/ RFC 9111（HTTP Caching）](https://httpwg.org/specs/)

## 一、HTTP 方法与状态码：语义即契约

RFC 9110 定义方法的**安全性与幂等性**，这是接口设计与重试策略的依据：

| 方法 | 安全（不改状态） | 幂等（重复执行同效） | 典型用途 |
|---|---|---|---|
| GET | ✅ | ✅ | 查询 |
| HEAD | ✅ | ✅ | 探测（只取响应头） |
| POST | ❌ | ❌ | 创建 / 非幂等操作 |
| PUT | ❌ | ✅ | 全量替换 |
| PATCH | ❌ | ❌（按 RFC 5789 不保证） | 部分更新 |
| DELETE | ❌ | ✅ | 删除 |

状态码按类记忆（MDN「HTTP response status codes」）：2xx 成功、3xx 重定向（301 永久 / 302 临时 / 304 协商缓存命中）、4xx 客户端错（400/401/403/404/429）、5xx 服务端错。

## 二、HTTP 缓存：强缓存与协商缓存（RFC 9111）

${F}text
请求发出
  ├─ 强缓存命中（本地直接用，不发请求）
  │    Cache-Control: max-age=31536000   未过期 → 200 (from disk/memory cache)
  │    Cache-Control: no-store           永不缓存
  │    Cache-Control: no-cache           可缓存但每次必须协商验证
  └─ 协商缓存（发条件请求，命中返回 304 无 body）
       If-None-Match: "etag-xyz"   ↔  响应头 ETag（内容指纹，优先）
       If-Modified-Since: date     ↔  响应头 Last-Modified（秒级精度，兜底）
${F}

**静态资源黄金实践**：文件名带内容哈希（${C}app.a1b2c3.js${C}）+ ${C}Cache-Control: max-age=31536000, immutable${C}——内容变则 URL 变，缓存永不失效也永不陈旧。本站（it-interview）的 ${C}?v=版本号${C} 就是同一思想的查询串变体。

**HTML 入口文件**：${C}Cache-Control: no-cache${C}——每次协商验证，保证用户尽快拿到新版本引用。

## 三、CORS：浏览器的同源策略出口

同源 = 协议 + 域名 + 端口全同。跨域请求被浏览器拦截是**浏览器行为**（curl 不受限）。

${F}text
简单请求（GET/POST/HEAD + 安全头）：
  直接发出 → 响应需带 Access-Control-Allow-Origin，否则浏览器丢弃响应

预检请求（带自定义头 / JSON Content-Type / 非简单方法）：
  ① OPTIONS 预检（带 Origin / Access-Control-Request-Method）
  ② 服务端应答 Allow-Origin / Allow-Methods / Allow-Headers / Max-Age
  ③ 通过后才发真实请求
${F}

${C}Access-Control-Max-Age${C} 可缓存预检结果减少 OPTIONS 次数；带 cookie 需前后端同时配置 ${C}credentials: "include"${C} + ${C}Allow-Credentials: true${C} + 具体域名（不能是 *）。

## 四、Fetch 与请求生命周期

${F}js
// fetch 只有网络层失败才 reject（404/500 也走 then！）——必须手动检查
const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
if (!res.ok) throw new Error("HTTP " + res.status);
const data = await res.json();
${F}

MDN 明确强调这是 fetch 最常见的误用点。配套：${C}AbortController${C} 取消请求、${C}AbortSignal.timeout()${C} 超时、${C}keepalive${C} 页面卸载时仍发送（埋点场景）。

## ⚠ 常见误区

1. **POST 302 重定向后变 GET 引发困惑**：301/302 按规范允许改写方法，浏览器普遍把 POST 降为 GET；接口设计不要依赖「重定向保留 POST」。
2. **给 HTML 也设长 max-age**：发版后用户拿旧 HTML 引用旧哈希 JS，旧文件已被清理则白屏。入口文件 no-cache、静态资源才 immutable。
3. **CORS 报错去查服务端日志没头绪**：预检失败只看 OPTIONS 响应头；DevTools Network 面板勾选「Preserve log」并看 Console 的 CORS 具体提示。
4. **以为加了 CDN 就自动有缓存**：CDN 尊重源站 Cache-Control；${C}private${C} / ${C}no-store${C} 的资源 CDN 不缓存，需按目录策略明确配置。

## ✅ 自检清单

- [ ] 静态资源内容哈希 + immutable，HTML 入口 no-cache
- [ ] 接口方法幂等性设计过（重试安全的只有幂等接口）
- [ ] fetch 统一封装 res.ok 检查 + 超时 + 取消
- [ ] CORS 预检配置（Max-Age / credentials）明确成文
- [ ] 关键页面缓存策略有发版验证（改版后能立刻看到新版）

## 📚 延伸阅读

- MDN → HTTP Caching（强缓存/协商缓存官方讲义，含决策流程图）
- RFC 9111 HTTP Caching（规范原文）
- MDN → Fetch API（AbortController / Streams 全景）
`
          },
          {
            id: "responsive",
            title: "响应式与移动端适配",
            minutes: 20,
            updated: "2026-09-17",
            applies: "移动 Web / 所有现代浏览器",
            tags: ["响应式", "移动端", "viewport"],
            terms: ["响应式", "移动端", "适配", "媒体查询"],
            body: `
> **官方文档基线**：[MDN → Responsive design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design) · [MDN → viewport meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag) · [web.dev → Learn Responsive Design](https://web.dev/learn/design)

## 一、viewport：移动适配的第一行代码

没有 viewport meta，移动浏览器会按 980px 桌面布局再缩放——这是 IE 时代的历史兼容行为。MDN viewport 专页给的标准写法：

${F}html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<!-- 禁止用户缩放会伤害可访问性，官方明确不建议 user-scalable=no -->
${F}

## 二、媒体查询的推荐写法

${F}css
/* 移动优先（MDN/web.dev 共同推荐）：默认样式即移动端，向上增强 */
.card { padding: 12px; }

@media (min-width: 768px) {   /* 平板及以上 */
  .card { padding: 20px; }
}
@media (min-width: 1200px) {  /* 桌面 */
  .card { padding: 28px; }
}
/* 820px-1200px 之间的横屏平板常被遗漏，测试矩阵要覆盖 */
${F}

断点不必多：3 个左右 + 内容自然断流即可。断点数值应由**内容**决定（内容开始难看了才断），不是照抄某框架的魔法数。

## 三、相对单位体系

| 单位 | 相对于 | 适用 |
|---|---|---|
| ${C}rem${C} | 根元素字号 | 字号、间距、断点 |
| ${C}em${C} | 当前元素字号 | 组件内部比例 |
| ${C}%${C} | 父容器 | 宽度、流式布局 |
| ${C}vw / vh${C} | 视口宽/高 | 大区块、全屏 |
| ${C}dvh / svh / lvh${C} | 动态/最小/最大视口 | 移动端全屏（Safari 地址栏问题） |
| ${C}clamp(min, val, max)${C} | 流式钳制 | 一行实现流式字号 |

${F}css
/* 流式标题：小屏 24px，随视口放大，封顶 40px —— 无需媒体查询 */
h1 { font-size: clamp(1.5rem, 2vw + 1rem, 2.5rem); }
${F}

## 四、移动端三大高频坑（官方文档点名）

1. **点击延迟与 300ms**：正确设置 viewport 后现代浏览器已消除；不要再用 FastClick 类补丁。
2. **iOS 输入聚焦页面放大**：字号 < 16px 的 input 会触发 iOS 自动缩放；移动端表单字号 ≥ 16px。
3. **100vh 与地址栏**：全屏区块用 ${C}min-height: 100dvh${C}；旧浏览器用 ${C}@supports${C} 回退 ${C}100vh${C}。

${F}css
.fullscreen {
  min-height: 100vh;   /* 回退 */
  min-height: 100dvh;  /* 动态视口：现代浏览器生效 */
}
${F}

## 五、图片与性能

- **srcset + sizes**（MDN「Responsive images」章）：按设备分辨率/宽度下发合适尺寸，避免小屏拉桌面大图；
- **${C}<picture>${C}**：按格式支持切换（AVIF → WebP → JPEG 兜底）；
- **懒加载**：${C}loading="lazy"${C} 一行搞定首屏外图片；
- 首屏 LCP 图**禁止**懒加载，并预加载：${C}<link rel="preload" as="image">${C}。

## ⚠ 常见误区

1. **只缩浏览器窗口当移动端测试**：窗口缩放不模拟触屏、DPR、地址栏行为；必须真机或 DevTools 设备模拟双验证。
2. **媒体查询按设备列举**（${C}@media (max-width: 375px)${C} 只想 iPhone）：新设备一出就漏；用区间 + 内容驱动断点。
3. **hover 交互不做触屏降级**：触屏无 hover；用 ${C}@media (hover: hover)${C} 隔离 hover 样式，点击行为独立实现。
4. **横屏遗漏**：手机横屏宽高互换，纯竖向假设的布局会崩；关键页横屏过一遍。

## ✅ 自检清单

- [ ] viewport meta 正确（未禁缩放）
- [ ] 移动优先 + 内容驱动断点（≤3 组）
- [ ] iOS 真机验证过 100vh / input 聚焦 / hover 降级
- [ ] 图片 srcset + lazy + 首屏 LCP 图预加载
- [ ] 测试矩阵含：小屏安卓 / 大屏 iPhone / 横屏 / 桌面缩放

## 📚 延伸阅读

- web.dev → Learn Responsive Design（Google 官方课程，含媒体特性全表）
- MDN → Responsive images（srcset/sizes 决策指南）
- MDN → Using media queries（全部媒体特性）
`
          }
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "对应 MDN 异步编程、react.dev / Vue 3 官方文档、Vite Guide、TypeScript Handbook 核心章节：异步与事件循环、框架渲染原理、组件与状态管理、构建工程化、TS 类型系统。",
        chapters: [
          {
            id: "es6-async",
            title: "ES6+ 与异步编程",
            minutes: 28,
            updated: "2026-09-17",
            applies: "ES2015+ / 所有现代浏览器",
            tags: ["异步", "Promise", "事件循环"],
            terms: ["Promise", "异步", "事件循环", "async"],
            body: `
> **官方文档基线**：[MDN → Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) · [MDN → Concurrency model and the event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) · [WHATWG HTML → Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)（微任务/宏任务的规范定义）

## 一、事件循环：JS 并发模型的真相

MDN「Concurrency model and the event loop」章的模型：**调用栈空了 → 先清空全部微任务 → 再取一个宏任务 → 渲染 → 循环**。

${F}js
console.log("1");
setTimeout(() => console.log("2"), 0);        // 宏任务
Promise.resolve().then(() => console.log("3")); // 微任务
queueMicrotask(() => console.log("4"));       // 微任务
console.log("5");
// 输出：1 5 3 4 2
${F}

微任务源：${C}Promise.then/catch/finally${C}、${C}queueMicrotask${C}、${C}MutationObserver${C}。宏任务源：${C}setTimeout${C} / ${C}setInterval${C} / I/O / UI 事件。**微任务全部清空才轮到宏任务**——递归微任务会饿死渲染（Starvation），是「页面卡死但 CPU 不高」的经典根因。

## 二、Promise 三态与链式规则

${F}js
// 三态：pending → fulfilled / rejected，状态不可逆
// then 返回新 Promise —— 链式的基础
fetchUser(id)
  .then((u) => fetchOrders(u.id))   // 返回 Promise 会被自动展平
  .then((orders) => render(orders))
  .catch((err) => showError(err))   // 捕获链上任意一步的失败
  .finally(() => hideLoading());    // 无论成败都执行
${F}

组合器速查（MDN 各有专页）：

- ${C}Promise.all${C}：全成功才成功，一败即败（并发取数首选）；
- ${C}Promise.allSettled${C}：等全部落地，成败各归其位（批量上报/多源兜底）；
- ${C}Promise.race${C}：第一个落地者定胜负（超时竞速）；
- ${C}Promise.any${C}：第一个成功者（多 CDN 择优）。

${F}js
// 超时竞速惯用法（现代可直接用 AbortSignal.timeout）
const data = await Promise.race([
  fetch(url),
  new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
]);
${F}

## 三、async/await：同步风格的异步

${F}js
async function load() {
  try {
    const [user, config] = await Promise.all([fetchUser(), fetchConfig()]);
    // 注意：顺序执行的 await 会串行阻塞；无依赖的请求必须并行
    return { user, config };
  } catch (err) {
    report(err);
    throw err;   // 捕获后记得决定是否继续抛出
  }
}
${F}

三条纪律：① 无依赖的 await 用 ${C}Promise.all${C} 并行（串行 await 是接口耗时翻倍的常见原因）；② ${C}await${C} 只在 ${C}async${C} 函数内；forEach 回调里的 await 不生效（用 ${C}for...of${C} 串行）；③ async 函数永远返回 Promise，${C}return x${C} 等价 ${C}return Promise.resolve(x)${C}。

## 四、错误处理与取消

${F}js
// 取消：AbortController（MDN Fetch 章节，浏览器标准）
const ctrl = new AbortController();
fetch(url, { signal: ctrl.signal }).catch((e) => {
  if (e.name === "AbortError") return;   // 主动取消，静默
  throw e;
});
ctrl.abort();   // 路由切换/组件卸载时调用

// 超时的标准姿势（Chrome 103+）
fetch(url, { signal: AbortSignal.timeout(5000) });
${F}

## ⚠ 常见误区

1. **在 Promise 链里 try/catch**：链上错误只在 ${C}.catch${C} 出现；async 函数里才用 try/catch。
2. **new Promise 后又 .then 链再套回调**（Promise 构造反模式）：只有包装「真正的回调 API」时才用 ${C}new Promise${C}，且 resolve/reject 只能调用其一。
3. **漏 await 导致「悬空 Promise」**：错误无人接收（unhandledrejection）；ESLint 的 ${C}no-floating-promises${C}（TS 规则）可拦截。
4. **以为 setTimeout(fn, 0) 立即执行**：最少 4ms 嵌套限制 + 排队等待；要「DOM 更新后立即跑」用 ${C}queueMicrotask${C} 或 ${C}requestAnimationFrame${C}。

## ✅ 自检清单

- [ ] 能笔算混合微/宏任务输出顺序
- [ ] 并发/串行 await 决策正确，接口无串行浪费
- [ ] 所有 fetch 有超时与取消（AbortController）
- [ ] unhandledrejection 全局监听在跑
- [ ] Promise.all 的失败策略符合业务（all vs allSettled）

## 📚 延伸阅读

- MDN → Using promises（官方教程）+ Concurrency model and the event loop
- Jake Archibald → Tasks, microtasks, queues and schedules（事件循环时序的经典演示）
- MDN → AbortController / AbortSignal.timeout
`
          },
          {
            id: "framework-principle",
            title: "框架原理（React/Vue）",
            minutes: 30,
            updated: "2026-09-17",
            applies: "React 18/19 / Vue 3",
            tags: ["React", "Vue", "虚拟DOM"],
            terms: ["React", "Vue", "虚拟DOM", "响应式"],
            body: `
> **官方文档基线**：[react.dev → Learn React / Reference](https://react.dev/learn)（官方新文档：Describing the UI / Managing State / Escape Hatches）· [Vue 3 官方 → Deep Dive: Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) · [Vue 3 → Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html)

## 一、两大框架的更新模型本质

同一个问题「数据变了，DOM 怎么变」，两家给了不同答案：

| | React | Vue 3 |
|---|---|---|
| 变更感知 | **拉（Pull）**：setState 标记 dirty，下次渲染整体重跑函数，diff 找差异 | **推（Push）**：Proxy 拦截读写，精确知道谁依赖谁 |
| 单位 | 组件函数（重新执行） | 组件级 + effect 粒度依赖追踪 |
| 优化核心 | reconciliation（可中断渲染 Fiber）+ memo | 编译时优化（PatchFlags 静态提升）+ 细粒度更新 |

react.dev「Render and Commit」章描述的三阶段：**Trigger（触发）→ Render（渲染，纯计算）→ Commit（提交 DOM）**。React 18 的 Fiber 把 Render 阶段做成可中断、可恢复的链表遍历——这就是「并发渲染」的原理层。

## 二、React：单向数据流与 re-render 规则

react.dev 的核心心智模型：**UI = f(state)**。渲染必须纯——同样输入产生同样输出、不修改外部变量（官方「Keeping Components Pure」专章）。

${F}jsx
function Cart({ items }) {
  // 派生状态不要存进 state：渲染时现算（官方 State 章节）
  const total = items.reduce((s, i) => s + i.price, 0);
  return <div>Total: {total}</div>;
}
// memo：props 浅相等则跳过重渲染（配合稳定引用使用）
const MemoCard = React.memo(Card);
// useCallback/useMemo：稳定引用，防止子组件被「新函数/新对象」击穿 memo
const onSelect = useCallback((id) => pick(id), [pick]);
${F}

**重渲染不可怕，可怕的是无谓的重渲染**。官方性能章的顺序：先确认慢（DevTools Profiler 录制）→ 消除大子树的无谓重渲染（state 下放 / children 组合）→ 再 memo。

## 三、Vue 3：Proxy 响应式与依赖收集

Vue 官方「Reactivity in Depth」章的机制：

${F}text
读：effect 运行中读取 ref/reactive 属性 → track（记录 该属性 → 该effect）
写：属性被赋值 → trigger（通知所有依赖它的 effect 重新运行）
组件渲染本身就是 effect → 数据变了自动重渲染
${F}

与 React 的关键差异：**Vue 不需要整组件重跑**，只有「真正依赖变了」的 effect 重跑；且模板被编译器标注静态内容（PatchFlags），diff 时直接跳过静态子树。

## 四、Diff 算法与 key

两家都用「同层比较 + key 标识」的启发式 diff（React 官方「Reconciliation」旧文档思想依然适用；Vue 渲染机制章同）：

1. 不同类型的元素 → 销毁重建子树；
2. 同类型元素 → 保留 DOM，只更新变化的 props；
3. 列表用 **key** 匹配旧子节点——key 必须稳定且唯一。

${F}jsx
{todos.map((t) => <Todo key={t.id} todo={t} />)}   // ✅ 业务 ID
{todos.map((t, i) => <Todo key={i} todo={t} />)}   // ❌ 插入/删除时错位复用
${F}

用数组下标当 key，在「头部插入」场景会导致输入框内容错位、动画错乱——因为 React/Vue 以为「位置 0 的节点还是原来那个」。

## ⚠ 常见误区

1. **React 里直接改 state 再 setState**（${C}obj.x = 1${C}）：引用没变，React 认为没变化；必须创建新对象/新数组（不可变更新）。
2. **Vue 里解构 reactive 丢失响应**：${C}const { a } = reactive(obj)${C} 后 a 不再是响应式；用 ${C}toRefs${C} 或保持属性访问。
3. **把 useEffect 当生命周期钩子堆料**：react.dev「You Might Not Need an Effect」专章列了 9 种「不该用 effect」的场景（派生数据、事件处理、表单提交等）。
4. **memo 万能论**：memo 本身有比较成本；props 每次都变的组件加 memo 纯属负优化。

## ✅ 自检清单

- [ ] 能说清 React 拉模型与 Vue 推模型的区别
- [ ] 渲染函数保持纯（无副作用、无 Date.now 等不确定值）
- [ ] 列表 key 用业务 ID
- [ ] 性能优化先 Profiler 取证，再动手
- [ ] 了解 Fiber 可中断渲染与 Vue 编译时优化各自解决什么

## 📚 延伸阅读

- react.dev → Learn React（新官方文档，替代旧 docs 的事实标准）
- Vue 3 → Reactivity in Depth / Rendering Mechanism（官方原理双章）
- React 官方博客 → React Labs 系列（Fiber/并发特性的演进说明）
`
          },
          {
            id: "component-state",
            title: "组件设计与状态管理",
            minutes: 26,
            updated: "2026-09-17",
            applies: "React / Vue 3",
            tags: ["组件", "状态管理", "设计"],
            terms: ["组件", "状态管理", "Redux", "Pinia"],
            body: `
> **官方文档基线**：[react.dev → Managing State](https://react.dev/learn/managing-state)（Reacting to Input with State / Choosing the State Structure / Sharing State Between Components / Extracting State Logic into a Reducer）· [Vue 3 → State Management](https://vuejs.org/guide/scaling-up/state-management.html) · [Redux 官方 → Style Guide](https://redux.js.org/style-guide/)

## 一、状态的分类学（react.dev「Choosing the State Structure」）

先分类，再决定放哪——这一步做对，80% 的状态管理问题消失：

| 类别 | 例子 | 放哪 |
|---|---|---|
| 服务器数据 | 列表、详情 | 专用层（TanStack Query / SWR），不是全局 store |
| 全局 UI 状态 | 主题、语言、登录态 | 全局 store（Zustand / Pinia） |
| 局部交互状态 | 输入框值、开关 | 组件内部 useState/ref |
| 派生数据 | 过滤后的列表 | **渲染时现算**，不入库 |

**官方红线**：能算出来的不要存（单一数据源）；能放局部的不要上提（减少耦合面）。

## 二、状态提升与组合模式

react.dev「Sharing State Between Components」：两个兄弟组件要共享状态 → 提升到最近公共父级，通过 props 下发 + 回调上报。

${F}jsx
function FilterableList({ items }) {
  const [query, setQuery] = useState("");       // 提升到公共父级
  return (
    <>
      <SearchBox query={query} onChange={setQuery} />
      <List items={filter(items, query)} />
    </>
  );
}
${F}

进阶组合：${C}children${C} 插槽与「将 JSX 作为 props」（官方「Composition vs Inheritance」思想）——用组合代替继承与深层 props 透传：

${F}jsx
<Modal>
  <Modal.Title>标题</Modal.Title>
  <Modal.Body>{content}</Modal.Body>
</Modal>
${F}

## 三、全局 store 的现代形态

- **Zustand**（React 系）：无 Provider、按 selector 订阅，天然避免「无关重渲染」；
- **Pinia**（Vue 3 官方推荐，替代 Vuex）：组合式 API 定义 store，DevTools 集成、TS 友好；
- **Redux Toolkit**：大型团队规范场景，官方 Style Guide 强调「一个文件一个 slice、selector 记忆化」。

${F}js
// Zustand 极简示例
const useCart = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));
// 组件内按 selector 订阅：只订阅 items.length 时，items 内容变化不触发渲染
const count = useCart((s) => s.items.length);
${F}

## 四、受控与非受控（表单设计）

- **受控**：值与 onChange 都由 React/Vue 状态驱动——需要校验联动、动态禁用时用；
- **非受控**：DOM 自己持有值，提交时读取（${C}FormData${C}）——简单表单性能更好；
- 官方建议：**默认非受控，有联动需求才受控**；混合态（defaultValue + key 重置）也要会用。

## 五、组件 API 设计清单

- 属性进、事件出（单向数据流），组件不改 props；
- 泛化适度：一个组件只做一件事；通用 UI（按钮/输入）与业务组件（订单卡片）分层；
- 受控/非受控双模式（${C}value + onChange${C} 或 ${C}defaultValue${C}）是成熟组件的标配；
- 样式作用域封闭（CSS Modules / Shadow DOM / Tailwind 前缀），防止全局污染。

## ⚠ 常见误区

1. **把服务器数据复制进全局 store**：缓存、重验证、竞态全要自己造轮子；TanStack Query 一行解决（${C}useQuery({ queryKey, queryFn })${C}）。
2. **props 透传五六层**（prop drilling）：该用组合（children/slot）或就近的 context——但注意 context 变化会重渲染所有消费组件，高频数据别塞 context。
3. **reducer 里写副作用**：reducer 必须纯；副作用放事件处理器或 effect。
4. **组件巨型化**：单文件 800 行不是「能力强」而是职责没拆；按「一个组件 = 一个职责 + 可独立测试」切。

## ✅ 自检清单

- [ ] 状态按四类归位，无「能算却存」「该局部却全局」
- [ ] 服务器数据用专用查询层而非手写 store
- [ ] props 透传 ≤ 2 层，超过则组合或 context
- [ ] reducer / setter 纯函数
- [ ] 组件 API 有受控/非受控双模式（基础组件）

## 📚 延伸阅读

- react.dev → Managing State（官方状态章节，含 Reducer/useContext 模式）
- Vue 3 → State Management / Pinia 官方文档
- TanStack Query Docs（服务器状态管理的事实标准）
`
          },
          {
            id: "build-tooling",
            title: "构建工具与工程化",
            minutes: 26,
            updated: "2026-09-17",
            applies: "Vite 5+ / Rollup / esbuild",
            tags: ["Vite", "构建", "工程化"],
            terms: ["Vite", "构建", "Tree-shaking", "工程化"],
            body: `
> **官方文档基线**：[Vite 官方 → Guide: Why Vite](https://vitejs.dev/guide/why) · [Vite → Build Options / Dep Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling) · [Rollup → Tree-shaking](https://rollupjs.org/guide/en/) · [esbuild](https://esbuild.github.io/) · [ESM 规范](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 一、为什么是 ESM：构建范式的分水岭

Vite 官方「Why Vite」章说清了演进：webpack 时代「先打包整包再启动」→ 开发态改为 **原生 ESM 按需编译**——浏览器请求哪个模块，dev server 就即时编译哪个。启动时间从「全量构建 O(项目)」变成「按需 O(当前页面)」。

${F}text
Vite 开发态：浏览器 --按需请求--> dev server（esbuild 预构建依赖 + 源码原生 ESM）
Vite 生产态：Rollup 打包（与开发态行为对齐，产物可深度摇树）
${F}

**依赖预构建**（Dep Pre-Bundling）：node_modules 里的 CommonJS 依赖（如 lodash-es 之外的旧包）用 esbuild 预转换成 ESM 并合并请求。缓存于 ${C}node_modules/.vite${C}；依赖变化时自动失效，必要时 ${C}vite --force${C}。

## 二、Tree-shaking：摇掉死代码的条件

Rollup/ESM 的摇树基于**静态分析 import/export**。能摇干净的前提：

1. 用 ESM（${C}import/export${C}），别混 CommonJS；
2. 库本身是 ESM 且标注 ${C}"sideEffects": false${C}（package.json 字段，告诉打包器哪些文件有副作用可安全删除）；
3. 避免整体导入：${C}import _ from "lodash"${C} 拉全量，${C}import { debounce } from "lodash-es"${C} 按需。

${F}js
// 有副作用的模块陷阱：sideEffects 无法声明时，import 即保留
import "./polyfills";        // 有副作用（改原型）→ 不可摇
${F}

## 三、代码分割与产物优化

${F}js
// 路由级动态 import —— 分包的最重要手段
const Admin = lazy(() => import("./pages/Admin.vue"));
// vite.config 里手动分包：把稳定的第三方库拆成长缓存 chunk
build: {
  rollupOptions: {
    output: {
      manualChunks: { vendor: ["vue", "vue-router"], charts: ["echarts"] },
    },
  },
}
${F}

分包的收益逻辑：业务代码天天变 → 每次发版用户重新下载业务 chunk；vendor 稳定 → 命中强缓存不重下。**vendor chunk 的内容指纹不变，用户只拉业务部分**。

## 四、工程化基础设施清单

- **代码规范**：ESLint（可执行规则）+ Prettier（格式，与 ESLint 冲突规则互关）+ husky + lint-staged（只查暂存区）；
- **提交规范**：Conventional Commits + commitlint，changelog 可机读；
- **环境变量**：Vite 的 ${C}.env${C} 文件 + ${C}import.meta.env${C}（**VITE_ 前缀的才暴露给客户端**——塞进前端的所有变量都等于公开，密钥绝不放这）；
- **类型检查**：${C}vue-tsc --noEmit${C} / ${C}tsc --noEmit${C} 进 CI，不依赖编辑器自觉。

## 五、Monorepo 与包管理

pnpm workspace 是当前主流：硬链接省磁盘、严格依赖（防幽灵依赖——没声明的包 import 不到）。Turborepo/Nx 做任务编排（增量构建 + 远端缓存）。适用判断：**2+ 个包有共享代码或联发需求才上 monorepo**，否则单仓更简单。

## ⚠ 常见误区

1. **bundle 体积只看总量**：要看「首屏实际加载」——分析用 ${C}rollup-plugin-visualizer${C}，优化目标是关键路径 chunk。
2. **dev 环境配置与生产不对齐**：开发态不打包掩盖了摇树问题；上线前 ${C}vite build${C} 并核对产物体积。
3. **把密钥放进 VITE_ 变量**：任何进前端 bundle 的东西都是公开的；服务端代理才是正道。
4. **锁文件不提交 / 随意升级依赖**：${C}pnpm-lock.yaml${C} 必须入库；升级用 ${C}pnpm outdated${C} + 小步 + 跑回归。

## ✅ 自检清单

- [ ] 路由级代码分割 + vendor 长缓存分包
- [ ] 首屏产物体积有基线与告警（visualizer 定期看）
- [ ] ESLint/Prettier/类型检查进 CI，本地钩子兜底
- [ ] 环境变量无敏感信息，前缀纪律清晰
- [ ] 依赖升级流程化（lockfile 入库 + 变更日志）

## 📚 延伸阅读

- Vite → Why Vite / Dep Pre-Bundling / Building for Production
- web.dev → Reduce JavaScript Payloads with Tree Shaking
- pnpm 官方 → Motivation（幽灵依赖与严格性的原理）
          `
          },
          {
            id: "typescript",
            title: "TypeScript 实践",
            minutes: 26,
            updated: "2026-09-17",
            applies: "TS 5.x",
            tags: ["TypeScript", "类型", "泛型"],
            terms: ["TypeScript", "类型", "泛型", "接口"],
            body: `
> **官方文档基线**：[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)（The Basics / Everyday Types / Narrowing / More on Functions / Generics）· [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) · [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## 一、结构化类型：TS 的核心心智

TS 只看**形状**不看名字（Handbook「Type Compatibility」）：鸭子类型的静态版。

${F}ts
interface Point { x: number; y: number }
declare const p: { x: number; y: number; z: number };
const q: Point = p;   // ✅ 多出来的字段不妨碍赋值
// 但对象字面量有「 excess property check」：
// const r: Point = { x: 1, y: 2, z: 3 };  // ❌ 字面量多字段直接报错
${F}

${C}interface${C} vs ${C}type${C}（官方 FAQ 口径）：功能高度重叠；interface 可声明合并、extends 更快；type 能表达联合/交叉/条件类型。团队统一其一即可。

## 二、收窄（Narrowing）：让类型系统跟着控制流走

Handbook「Narrowing」章是日常写 TS 最重要的一章——**联合类型必须收窄后才能安全使用**：

${F}ts
function format(id: string | number) {
  if (typeof id === "string") return id.trim();  // 收窄为 string
  return id.toFixed(2);                          // 收窄为 number
}
// 判别联合（Discriminated Unions）：用字面量字段收窄——网络请求结果的标准建模
type Result =
  | { status: "ok"; data: User[] }
  | { status: "err"; message: string };
function handle(r: Result) {
  if (r.status === "ok") return r.data;   // 这里 r.data 才存在
  throw new Error(r.message);
}
${F}

**收窄失效场景**：回调/异步后的字段检查（类型系统不做跨函数追踪）→ 用类型守卫函数（${C}x is T${C}）显式声明：

${F}ts
function isUser(v: unknown): v is User {
  return !!v && typeof v === "object" && "id" in v;
}
${F}

## 三、泛型：写可复用的类型安全代码

${F}ts
// 泛型函数：输入输出关联
function first<T>(arr: T[]): T | undefined { return arr[0]; }
// 泛型约束：要求 T 至少有 id
function pick<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((i) => i.id === id);
}
// 常用内置工具类型（Handbook Utility Types 章，全部要熟）
Partial<User>;      // 全部可选（表单草稿）
Pick<User, "id" | "name">;   // 挑选字段
Omit<User, "password">;      // 排除字段
ReturnType<typeof fn>;       // 取函数返回类型
Record<string, number>;      // 键值映射
${F}

## 四、tsconfig 的关键开关

${F}json
{
  "strict": true,                    // 总开关：包含下面几个
  "noUncheckedIndexedAccess": true,  // arr[i] 类型带 undefined（强烈推荐）
  "noUnusedLocals": true,
  "moduleResolution": "bundler",     // 打包器项目用（Vite）
  "skipLibCheck": true               // 跳过第三方 .d.ts 检查，提速编译
}
${F}

**strict: true 是底线**；${C}any${C} 出现处应有注释说明为什么不能用 unknown。数据边界（接口返回、JSON.parse）用 ${C}unknown${C} 起步，经守卫收窄——**unknown 是「要求你验证」的 any**。

## 五、与运行时验证的关系

TS 类型在编译后**完全擦除**，运行时没有任何校验。接口数据不可信：手写守卫或用 zod（schema 即类型源：${C}z.infer<typeof schema>${C}）做运行时校验 + 类型导出二合一。

## ⚠ 常见误区

1. **as 断言当止痛药滥用**：断言是「我比编译器懂」的声明，错了运行时炸；能用收窄解决就不 as。
2. **interface 里放函数重载却不会实现签名**：重载签名列表 + 一个实现签名，参数类型取宽（官方 More on Functions 章）。
3. **枚举滥用**：数字 enum 有反向映射的意外行为；字面量联合（${C}type S = "a" | "b"${C}）+ ${C}as const${C} 是更轻的方案。
4. **类型体操炫技**：条件类型嵌套过深可读性归零；业务代码泛型两三层封顶，复杂推导封装成具名工具类型并注释。

## ✅ 自检清单

- [ ] strict: true 全量开启，any 有 whitelist 与理由
- [ ] 联合类型用判别联合建模，收窄后使用
- [ ] 边界数据（API 响应）经 unknown + 守卫/zod 校验
- [ ] 常用 Utility Types 熟练（Partial/Pick/Omit/Record/ReturnType）
- [ ] 类型检查进 CI（tsc --noEmit），不靠编辑器

## 📚 延伸阅读

- TypeScript Handbook → Narrowing / Generics（两章精读）
- Total TypeScript 免费教程（Matt Pocock，官方推荐外最好的进阶材料）
- TSConfig Reference（逐项说明每个开关）
          `
          }
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "对应 web.dev 性能方法论、Performance API、micro-frontends.org、跨端框架官方文档与 OWASP 前端安全清单：渲染性能、监控治理、微前端、跨端与安全。",
        chapters: [
          {
            id: "render-perf",
            title: "浏览器渲染原理与性能优化",
            minutes: 30,
            updated: "2026-09-17",
            applies: "Chromium 渲染管线 / web.dev",
            tags: ["性能", "渲染", "Core Web Vitals"],
            terms: ["性能", "渲染", "重排", "Vitals"],
            body: `
> **官方文档基线**：[web.dev → Rendering Performance](https://web.dev/articles/rendering-performance)（像素管线与合成器动画）· [web.dev → Core Web Vitals](https://web.dev/articles/vitals) · [MDN → Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API) · [MDN → Populating the page（渲染路径）](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)

## 一、渲染管线：从字节到像素

MDN「How browsers work」+ web.dev 的像素管线四步：

${F}text
JavaScript → Style（计算样式）→ Layout（几何布局/重排）→ Paint（绘制/重绘）→ Composite（合成）
${F}

**性能分级**（web.dev Rendering Performance 原文观点）：

- 只动 ${C}transform${C} / ${C}opacity${C}：**合成器线程完成，不占主线程**——动画首选；
- 动 ${C}color / background${C}：Paint（重绘）；
- 动几何（${C}width / top / margin${C}）：Layout（重排）→ 连锁 Paint + Composite，最贵。

${F}css
/* 动画性能对照：把「动 left」改成「动 transform」 */
.bad  { transition: left 0.3s; left: 0; }  .bad.move { left: 100px; }
.good { transition: transform 0.3s; }      .good.move { transform: translateX(100px); }
/* 长列表滚动：content-visibility 跳过屏外渲染 */
.card { content-visibility: auto; contain-intrinsic-size: 200px; }
${F}

## 二、Core Web Vitals：Google 官方三指标

| 指标 | 度量 | 良好线 | 主要优化手段 |
|---|---|---|---|
| **LCP** | 最大内容元素出现 | ≤ 2.5s | 关键图预加载、SSR、CDN、资源优先级 |
| **INP** | 全程交互响应延迟 | ≤ 200ms | 拆长任务（${C}scheduler.yield${C}）、减少主线程 JS |
| **CLS** | 累积布局偏移 | ≤ 0.1 | 图片/广告位定尺寸、字体 ${C}font-display: swap${C} + 尺寸预留 |

${F}js
// 用 PerformanceObserver 采集（web.dev 官方推荐方式，web-vitals 库同理）
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) report("LCP", e.startTime);
}).observe({ type: "largest-contentful-paint", buffered: true });
${F}

## 三、长任务与主线程让路

任何 > 50ms 的任务都是 Long Task（Performance API 定义）。长任务期间输入事件排队 → INP 劣化。官方解法是**任务切片 + 让路**：

${F}js
async function processLarge(list) {
  for (const item of list) {
    handle(item);
    if (scheduler?.yield) await scheduler.yield();     // 让出主线程（新标准）
    else if (navigator.scheduling?.isInputPending?.()) await nextFrame();
  }
}
${F}

## 四、资源加载优先级

- ${C}<link rel="preload">${C}：提前加载当前页关键资源（LCP 图、关键字体）；
- ${C}<link rel="preconnect">${C}：提前建 TCP/TLS 连接（第三方域）；
- ${C}fetchpriority="high"${C}：显式提升 LCP 图片优先级；
- 模块脚本默认 defer（不阻塞解析），关键内联 CSS 防止渲染阻塞请求瀑布。

## 五、内存泄漏排查

${F}js
// 常见泄漏源（Chrome DevTools Memory 面板 + Performance Monitor 排查）
window.addEventListener("resize", onResize);      // 单页应用不卸载 → 泄漏
const timer = setInterval(poll, 5000);            // 组件卸载未 clear
observer.observe(el);                              // 未 disconnect
// React: useEffect 返回清理函数；Vue: onUnmounted 里清理
${F}

判断法：操作页面 N 次 → DevTools Memory 拍堆快照对比 → 构造函数实例数单调增长即泄漏。

## ⚠ 常见误区

1. **用 Lighthouse 实验室分当真实用户体验**：实验数据是合成环境；上线要用真实用户监控（RUM）看 P75（web.dev 明确要求 P75 达标）。
2. **CSS 动画一定比 JS 动画快**：错误——关键在动什么属性；JS 驱动 ${C}transform${C} 同样走合成器，CSS 动 ${C}top${C} 照样重排。
3. **滥用 will-change**：每个 will-change 都预占合成层内存；只加在确实要动画的元素、动画后移除。
4. **打包越碎越好**：HTTP/2 下过细的 chunk 增加 request 开销；按路由/分组分，不按组件分。

## ✅ 自检清单

- [ ] 动画只用 transform/opacity
- [ ] RUM 采集 LCP/INP/CLS，P75 达标
- [ ] 长任务有切片或让路（scheduler.yield）
- [ ] LCP 资源 preload + fetchpriority
- [ ] 泄漏四件套（listener/timer/observer/闭包）在 code review 清单里

## 📚 延伸阅读

- web.dev → Rendering Performance / Core Web Vitals（Google 性能方法论源头）
- MDN → Performance API（PerformanceObserver 全家桶）
- 《High Performance Browser Networking》（网络层性能的原理书）
          `
          },
          {
            id: "fe-monitor",
            title: "前端监控与错误治理",
            minutes: 26,
            updated: "2026-09-17",
            applies: "Performance API / Sentry 架构",
            tags: ["监控", "错误上报", "Sentry"],
            terms: ["监控", "上报", "Sentry", "错误"],
            body: `
> **官方文档基线**：[MDN → Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API) · [web.dev → Custom Metrics](https://web.dev/articles/custom-metrics) · [Sentry 官方 Docs → Platforms: JavaScript](https://docs.sentry.io/platforms/javascript/) · [W3C Error Reporting 草案](https://wicg.github.io/error-reporting/)

## 一、监控的三层数据模型

${F}text
指标（Metrics）  ：LCP/INP/CLS、JS 错误率、接口成功率 —— 回答「健康吗」
轨迹（Traces）   ：一次用户操作跨「页面→接口→服务」的完整链路 —— 回答「慢在哪」
日志（Logs）     ：带上下文的错误详情与面包屑 —— 回答「为什么错」
${F}

## 二、错误采集的四条通道

${F}js
// ① JS 运行时错误（同步）
window.addEventListener("error", (e) => report({ type: "js", msg: e.message, stack: e.error?.stack }));
// ② Promise 未处理拒绝
window.addEventListener("unhandledrejection", (e) => report({ type: "promise", reason: String(e.reason) }));
// ③ 资源加载失败（error 事件不冒泡，必须捕获阶段监听）
window.addEventListener("error", (e) => {
  if (e.target !== window) report({ type: "resource", tag: e.target.tagName, src: e.target.src });
}, true);
// ④ 接口层：fetch/XHR 统一封装处上报状态码与耗时
${F}

## 三、上报设计的工程细节

1. **采样率**：全量上报在高峰期会打爆接收端；按用户尾号哈希采样（错误类 10%~100%，性能类 1%~10%），错误率高时自动提额（动态采样）。
2. **批量与容错**：队列 + 定时批量（${C}navigator.sendBeacon(url, blob)${C}——页面卸载也不丢，比 fetch keepalive 更省心）。
3. **上下文齐备**：版本号（release）、用户标识（哈希后）、面包屑（最近 20 个动作）、设备信息——没有 release 字段的错误无法对应代码版本，等于白收。
4. **Source Map 管控**：压缩产物 + map 文件**只传给监控平台，不部署到线上**（防源码泄露）；Sentry 的 release + sourcemaps 上传工作流即为此设计。

## 四、Sentry 的接入要点（官方 Quickstart 口径）

${F}js
Sentry.init({
  dsn: "https://xxx@sentry.io/yyy",
  release: "web@1.42.0",          // 与构建产物对应
  environment: "production",
  tracesSampleRate: 0.1,          // 性能轨迹采样
  beforeSend: (event) => filterPII(event),   // 脱敏：用户输入/地址等
});
// 手动上报带上下文
Sentry.captureException(err, { tags: { page: "checkout" } });
${F}

## 五、从「收错误」到「治理闭环」

${F}text
告警规则（新错误 5 分钟内通知）→ 归因聚合（指纹：message+stack 顶帧）
  → 指派 owner（对应代码路径）→ 修复 release → 验证错误率回落 → 复盘归档
${F}

关键指标：**每千次会话错误数（Errors per Session）**与其趋势，而非绝对条数——版本发布后错误率环比变化才是质量信号。

## ⚠ 常见误区

1. **只监控「有异常抛出」的错误**：白屏、接口静默失败、数据错乱不抛异常；需要「页面存活心跳 + 关键节点埋点」兜底。
2. **上报接口用普通 fetch**：页面关闭/崩溃时丢最后一批数据；卸载场景必须 ${C}sendBeacon${C}。
3. **错误堆栈没有 sourcemap 就当噪音**：压缩堆栈几乎不可读；release+sourcemap 是监控可用的前提。
4. **监控平台当垃圾桶**：无人值守的告警群比没有告警更糟；每条规则必须有 owner 与响应 SLA。

## ✅ 自检清单

- [ ] 四条错误通道齐备（js / promise / resource / api）
- [ ] sendBeacon 批量上报 + 采样率配置化
- [ ] release + sourcemap 工作流跑通，map 不上线
- [ ] 关键用户路径有自定义指标（web.dev Custom Metrics 口径）
- [ ] 告警有 owner、SLA 与修复闭环记录

## 📚 延伸阅读

- web.dev → Custom Metrics（如何定义自己的指标）
- MDN → Performance API / PerformanceObserver
- Sentry Docs → JavaScript 平台（enriching events / filtering 章节全读）
          `
          },
          {
            id: "micro-frontend",
            title: "微前端与大型项目管理",
            minutes: 26,
            updated: "2026-09-17",
            applies: "Module Federation / qiankun / 微前端架构",
            tags: ["微前端", "架构", "隔离"],
            terms: ["微前端", "隔离", "架构", "联邦"],
            body: `
> **官方文档基线**：[micro-frontends.org](https://micro-frontends.org/)（微前端概念的事实源头）· [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) · [Vite 官方 Module Federation 插件生态](https://github.com/originjs/vite-plugin-federation) · [qiankun 文档](https://qiankun.umijs.org/zh/guide)

## 一、微前端要解决的三个真问题

micro-frontends.org 定义的诉求：**多团队并行开发同一站点、技术栈无关、独立部署互不阻塞**。它不是性能优化手段，是**组织架构在代码上的投影**（康威定律）。

先问三个问题再决定上不上：

1. 团队是否真的存在「发布互相阻塞」？（每周发版都打架才需要）
2. 页面边界是否清晰？（按路由切分容易，同页混搭很难）
3. 是否准备好付出：复杂度、体验一致性、双倍基建的代价？

**单体 + 良好模块边界撑不到 20 人以上多团队时，微前端才划算。**

## 二、主流方案光谱

| 方案 | 原理 | 适用 |
|---|---|---|
| **路由分发（Nginx/网关）** | 按路径转发到不同应用 | 最简单，页面级切分首选 |
| **Module Federation** | 运行时远程加载彼此的模块（Webpack/Vite 插件） | 同一构建体系下的模块级共享 |
| **qiankun（single-spa 封装）** | 主应用加载子应用 HTML + JS 沙箱 | 多技术栈共存、渐进迁移 |
| **Web Components** | 自定义元素天然隔离 | 跨框架组件分发 |

## 三、Module Federation 核心配置

${F}js
// 提供方（ exposes：把本地模块暴露给运行时）
new ModuleFederationPlugin({
  name: "cart",
  filename: "remoteEntry.js",
  exposes: { "./Cart": "./src/Cart" },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});
// 消费方（ remotes：运行时拉取远端模块）
new ModuleFederationPlugin({
  name: "host",
  remotes: { cart: "cart@https://cdn.example.com/remoteEntry.js" },
  shared: { react: { singleton: true } },
});
// 使用：const Cart = React.lazy(() => import("cart/Cart"));
${F}

${C}shared + singleton: true${C} 让 React 只加载一份——**版本协商失败时会回退到一方自带版本**，两端 React 大版本必须兼容。

## 四、隔离：样式与 JS 沙箱

- **样式隔离**：Shadow DOM（最彻底但 React 事件/样式注入要适配）；qiankun 的 ${C}strictStyleIsolation${C}（Shadow DOM）与 ${C}experimentalStyleIsolation${C}（作用域前缀改写）；底线方案是 BEM/CSS Modules 约定前缀。
- **JS 沙箱**：qiankun 的 Proxy 快照沙箱——劫持子应用的 ${C}window${C} 读写，卸载时还原。防止子应用污染全局（改路由、挂全局变量）。
- **公共依赖治理**：React/路由等 singleton 共享；工具库按需 external 或各自携带（先测量再决定）。

## 五、跨团队契约：微前端的真正难点

${F}text
① 应用间通信：只走「自定义事件 / URL 参数 / 共享状态库」三种显式通道，禁直接互相 import
② 版本契约：host 与 remote 的 shared 依赖 semver 兼容区间，CI 里做兼容检查
③ 独立部署：每个子应用可单独发版上线，remoteEntry 有内容哈希 + 短缓存
④ 降级预案：子应用加载失败 → host 渲染兜底错误态，不白屏整页
${F}

## ⚠ 常见误区

1. **把微前端当架构升级 KPI**：小团队强上微前端，得到的是双倍构建配置 + 体验碎片化；路由分发 + monorepo 能解决 80% 场景。
2. **共享依赖版本不设防**：host 升 React 19、remote 还在 React 17，singleton 协商出诡异 bug；版本兼容矩阵必须成文。
3. **子应用直接读写 window**：沙箱不是保险箱，逃逸一次全局污染全站；约定「所有全局副作用走声明的 API」。
4. **样式裸奔**：子应用 ${C}body { ... }${C} 全局样式互杀；进入微前端前先做样式作用域改造。

## ✅ 自检清单

- [ ] 有「是否需要微前端」的论证记录（团队规模/发布冲突）
- [ ] 应用间通信只走显式通道
- [ ] shared 依赖版本兼容矩阵成文，CI 校验
- [ ] 样式隔离方案（Shadow DOM/前缀）落地
- [ ] 子应用加载失败有兜底 UI 与告警

## 📚 延伸阅读

- micro-frontends.org（思想源头，一篇讲透）
- Webpack Module Federation 官方文档（概念与 API）
- qiankun 指南（国内多栈共存场景的工程实践）
          `
          },
          {
            id: "cross-platform",
            title: "跨端方案与工程提效",
            minutes: 24,
            updated: "2026-09-17",
            applies: "React Native / 小程序 / Electron",
            tags: ["跨端", "React Native", "小程序"],
            terms: ["跨端", "React Native", "小程序", "Electron"],
            body: `
> **官方文档基线**：[React Native 官方 Docs → Get Started / Architecture](https://reactnative.dev/docs/getting-started) · [Electron Docs → Process Model / Security](https://www.electronjs.org/docs/latest/) · [微信小程序官方开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/) · [Taro / uni-app 官方文档](https://docs.taro.zone/)

## 一、跨端方案选型光谱

| 方案 | 渲染方式 | 性能特征 | 适用 |
|---|---|---|---|
| **React Native（新架构）** | 原生组件映射 + JSI 直调 | 近原生 | App 界面，React 技术栈 |
| **Flutter** | Skia 自绘引擎 | 一致性最强 | 重动画、双端一致性要求高 |
| **小程序 / Taro / uni-app** | Web-like（小程序容器） | 中 | 国内多端分发、轻交互 |
| **Electron / Tauri** | Chromium + Node（Tauri 用系统 WebView） | 桌面级 | 桌面工具、IDE 类 |
| **PWA** | 标准 Web | 纯 Web | 安装成本低的长尾入口 |

## 二、React Native 新架构的三个关键词

官方 Architecture 文档定义：

1. **JSI（JavaScript Interface）**：JS 与原生用 C++ 层直调，替代旧 Bridge 的异步 JSON 序列化——消除「桥」瓶颈；
2. **Fabric**：新渲染器，渲染指令可同步/优先级调度；
3. **TurboModules**：原生模块按需加载。

工程口径：**业务代码面向 RN 组件写，平台差异用 ${C}Platform.select${C} 隔离**；涉及相机/推送等原生能力时优先找社区模块（React Native Directory），自写原生模块是最后手段。

## 三、小程序的双线程模型

微信小程序官方文档的架构：**渲染层（WebView）与逻辑层（JsCore）分离**——逻辑层无法直接操作 DOM，setData 是唯一通道。

${F}js
// setData 的纪律（官方性能建议）
this.setData({ "list[3].status": "done" });  // ✅ 路径更新，最小数据量
this.setData({ list: wholeNewList });        // ❌ 全量替换大对象
// 通信有成本：频繁 setData 是小程序卡顿第一原因
${F}

Taro/uni-app 的价值：**用 React/Vue 语法编译到小程序 + H5 + App**——一次学习多端分发；代价是编译层调试与平台差异 API 的抽象损耗（各端条件编译 ${C}process.env.TARO_ENV${C}）。

## 四、Electron 的进程模型与安全边界

官方 Process Model：**主进程（Node，管窗口/系统能力）+ 渲染进程（Chromium，管 UI）**。安全的黄金法则（官方 Security 章逐条列出）：

${F}js
// ❌ 危险默认：nodeIntegration 让渲染进程直接碰 Node
new BrowserWindow({ webPreferences: { nodeIntegration: true, contextIsolation: false } });
// ✅ 安全默认：上下文隔离 + 预加载脚本白名单暴露
new BrowserWindow({ webPreferences: { contextIsolation: true, preload: "preload.js" } });
// preload 里用 contextBridge 暴露受控 API
contextBridge.exposeInMainWorld("appAPI", { readFile: (p) => ipcRenderer.invoke("read", p) });
${F}

**原则：渲染进程零 Node 权限，一切系统能力经 IPC 白名单**。Electron 应用历史上的供应链事故几乎都源于关掉这两个开关。

## 五、跨端代码组织策略

${F}text
分层：业务逻辑（纯 TS，全端共享）→ UI 组件（按方案分目录）→ 平台能力（适配层封装）
目录：packages/shared（逻辑+类型）/ packages/app-rn / packages/app-mini / packages/web
原则：平台差异收口在适配层（storage/请求/支付/分享），业务层不感知平台
${F}

## ⚠ 常见误区

1. **「一套代码全端」的过度承诺**：跨端框架省的是 70% 代码，剩下 30% 是平台差异——预算与排期必须包含它。
2. **RN 版本长期滞留旧架构**：新架构（0.68+）性能差异显著，升级要排期；社区模块的架构兼容性先查再说。
3. **小程序把 setData 当 setState 用**：全量 setData 是性能第一杀手；路径更新 + 数据瘦身。
4. **Electron 用默认配置裸奔**：contextIsolation 关闭 = 渲染进程 XSS 直接升级为系统级 RCE。

## ✅ 自检清单

- [ ] 跨端方案选型有性能/团队栈/分发渠道论证
- [ ] 平台差异收口在适配层，业务代码无平台 if
- [ ] 小程序 setData 路径更新纪律落地
- [ ] Electron contextIsolation + IPC 白名单
- [ ] 各端真机回归清单成文（发版必过）

## 📚 延伸阅读

- React Native Docs → Architecture（新架构权威说明）
- Electron Docs → Security（逐条安全清单）
- Taro 官方文档 → 跨端开发规范
          `
          },
          {
            id: "fe-security",
            title: "前端安全",
            minutes: 26,
            updated: "2026-09-17",
            applies: "OWASP Cheat Sheet / CSP / 全部前端",
            tags: ["XSS", "CSP", "前端安全"],
            terms: ["XSS", "CSRF", "CSP", "安全"],
            body: `
> **官方文档基线**：[OWASP Cheat Sheet Series → XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) / [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) · [MDN → Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) · [MDN → CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 一、XSS：三类与一条防线

XSS 的本质：**数据被当成代码执行**。OWASP 分类：

| 类型 | 注入点 | 例子 |
|---|---|---|
| 存储型 | 服务端存储后回显 | 评论区注入 script，所有访客中招 |
| 反射型 | URL 参数回显 | 恶意链接带 payload |
| DOM 型 | 纯前端 DOM 操作 | ${C}innerHTML = location.hash 片段${C} |

**唯一正解（OWASP XSS Prevention 原则）**：输出编码——数据与代码永远分离。按输出位置选编码：

${F}js
// HTML 正文：textContent（框架插值 {{ }} 默认安全）
el.textContent = userInput;
// 属性：框架插值即可（引号包裹）；JS URL 是禁区
// 必须 HTML 时：DOMPurify.sanitize(dirty) —— 白名单过滤库，事实标准
el.innerHTML = DOMPurify.sanitize(dirtyHtml);
// 永远别碰的三个 API（OWASP 明确点名）：
// innerHTML = userInput / document.write / eval
${F}

**框架的自动转义不是免死金牌**：${C}dangerouslySetInnerHTML${C}（React）与 ${C}v-html${C}（Vue）绕过防线，使用处必须过 DOMPurify 并 code review 记录。

## 二、CSP：纵深防御的宪法

CSP 用白名单声明「页面允许加载什么」——即使 XSS 漏了，payload 也跑不起来。MDN CSP 章核心指令：

${F}http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m';   /* 脚本白名单：同源 + 带 nonce */
  style-src 'self';
  img-src 'self' data: https://cdn.example.com;
  object-src 'none';                  /* 禁 Flash/嵌入对象 */
  frame-ancestors 'none';             /* 禁被 iframe 嵌套（防点击劫持） */
  report-uri /csp-report;             /* 违规上报 */
${F}

关键细节：**禁用 ${C}unsafe-inline${C}**（等于没防），内联脚本改用 nonce 或 hash；先上 ${C}Content-Security-Policy-Report-Only${C} 观察违规报告再收紧，避免一刀切弄瞎业务。

## 三、CSRF：请求伪造与 SameSite

CSRF 成立的条件：**浏览器自动携带 cookie + 接口不校验来源**。OWASP 推荐组合：

1. **SameSite=Lax/Strict**（cookie 属性，现代浏览器默认 Lax）——跨站请求不带 cookie，已挡掉大多数场景；
2. **CSRF Token**：服务端下发、表单/头携带、请求时校验——SameSite 之外的必须项（尤其兼容旧浏览器）；
3. **SameSite=None 必须 Secure + HTTPS**。

注意：**纯 token 认证（localStorage + Authorization 头）天然免疫 CSRF**——但 localStorage 存 token 引入 XSS 窃取面；两种方案是风险转移，不是消除（认证设计详见安全方向「认证授权设计」篇）。

## 四、其他必修项（OWASP/MDN 清单）

- **点击劫持**：${C}frame-ancestors 'none'${C}（CSP）或 ${C}X-Frame-Options: DENY${C}；
- **开放重定向**：${C}?redirect=参数${C} 必须校验白名单，防钓鱼跳转；
- **postMessage**：始终校验 ${C}e.origin${C}，接收数据不当可信输入；
- **依赖投毒**：锁定 lockfile、${C}npm audit${C} 进 CI、关键依赖用 scope 镜像（详见安全方向供应链篇）；
- **敏感数据**：密码输入框 ${C}autocomplete="new-password"${C}；尽量不把 PII 放 localStorage。

## ⚠ 常见误区

1. **「HTTPS 了就安全」**：HTTPS 防传输窃听，防不了注入、劫持、逻辑漏洞。
2. **转义一次到处用**：URL 编码 ≠ HTML 编码 ≠ JS 编码；按 OWASP 的「输出位置→编码方式」对照表选。
3. **CSP 上 unsafe-inline 了事**：等于宣布放弃 CSP 的脚本防护；用 nonce 迁移。
4. **前端校验当安全校验**：前端一切校验只为体验，安全判定必须在服务端（前端代码对用户完全可见可改）。

## ✅ 自检清单

- [ ] 全站无 innerHTML 直插用户输入（v-html/dangerouslySetInnerHTML 处过 DOMPurify）
- [ ] CSP 已上线（先 Report-Only 再强制），无 unsafe-inline
- [ ] cookie SameSite + CSRF Token（或明确的 token 方案论证）
- [ ] 重定向参数白名单、postMessage 校验 origin
- [ ] npm audit / 依赖更新进 CI

## 📚 延伸阅读

- OWASP Cheat Sheet Series → XSS / CSRF / DOM based XSS Prevention（三篇精读）
- MDN → Content Security Policy（指令全表 + nonce 用法）
- Google Web Fundamentals → Security（与 MDN 互补的工程视角）
          `
          }
        ]
      }
    ]
  };

  window.FRONTEND = FRONTEND;
})();
