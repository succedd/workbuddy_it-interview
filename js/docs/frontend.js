/* =========================================================================
 *  js/docs/frontend.js — 技术教程「前端 Web」方向数据（标准实战篇）
 *  风格：原理 → 实战 → 踩坑 → 排障清单。正文 Markdown，复用 marked + highlight.js。
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
    desc: "从「还原设计稿」到「掌控渲染与性能、做架构选型」的完整路径。覆盖 HTML/CSS/JS 基础、ES6 异步、框架原理、工程化、渲染性能与前端安全。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "能还原设计稿、完成交互：语义化结构、CSS 布局、JS 基础、DOM 事件与浏览器/HTTP 基础。",
        chapters: [
          {
            id: "html-css-layout",
            title: "HTML 语义化与 CSS 布局",
            minutes: 15,
            updated: "2026-09-15",
            applies: "HTML5 / CSS3（Flex/Grid）",
            tags: ["HTML", "CSS", "布局"],
            terms: ["HTML", "CSS", "Flex", "布局"],
            body: `
## 一、语义化：标签是「含义」不是「样式」

${C}<div>${C} 什么都装，但读屏软件和搜索引擎看不懂结构。语义化标签（${C}<header> <nav> <main> <article> <section> <footer>${C}）表达的是**内容角色**，好处：可访问性（a11y）、SEO、可维护性都更好。

## 二、盒模型：所有布局的基石

每个元素是个盒子：**content + padding + border + margin**。默认 ${C}box-sizing: content-box${C}（width 不含 padding/border，算尺寸容易错），工程上统一：

${F}css
* { box-sizing: border-box; }   /* width 就包含 padding+border，心智负担最小 */
${F}

## 三、Flex 与 Grid：现代布局双雄

- **Flex**：一维布局（一行或一列），做导航、卡片排列、垂直居中极方便
- **Grid**：二维布局（行列同时管），做整体页面骨架

${F}css
/* 经典三栏：侧边固定 + 中间自适应 + 侧边固定 */
.layout { display: grid; grid-template-columns: 200px 1fr 200px; gap: 16px; }
/* 经典居中：Flex 一行三句 */
.center { display: flex; align-items: center; justify-content: center; }
${F}

⚠ 别再用 float 做整体布局了——它是为文字环绕设计的，做布局又臭又长（清除浮动、margin 塌陷一堆坑）。

## 四、定位与层叠

${C}position${C}：static（默认）/ relative（相对自身）/ absolute（相对最近定位祖先）/ fixed（相对视口）/ sticky（滚动吸附）。层叠顺序靠 z-index，但**只在同一层叠上下文里比**，父子 z-index 不能直接跨层级比较。

## ⚠ 踩坑与经验

1. **滥用 div + 行内样式**：结构无语义、样式不可维护，后期改版地狱。
2. **忘了 box-sizing**：算宽度总差 padding，统一设 border-box。
3. **float 清浮动忘写**：后面元素跑上去，加 ${C}clearfix${C} 或用 Flex/Grid 替代。
4. **z-index 失效**：父元素设了 transform/opacity 形成新层叠上下文，子 z-index 被关在里面，跨级无效。
5. **margin 塌陷**：相邻块级 margin 取大值而非相加，用 padding 或 BFC 处理。

## ✅ 排障清单

- [ ] 用语义化标签，别全 div
- [ ] 全局 box-sizing: border-box
- [ ] 整体布局用 Flex/Grid，不靠 float
- [ ] 理解 position 五种值 + 层叠上下文
- [ ] 移动端用 viewport + rem/vw 适配
`
          },
          {
            id: "js-core",
            title: "JavaScript 核心语法",
            minutes: 16,
            updated: "2026-09-15",
            applies: "ECMAScript 2017+",
            tags: ["JavaScript", "语法", "基础"],
            terms: ["JavaScript", "JS", "闭包", "原型"],
            body: `
## 一、类型：JS 的「七种」与隐式转换坑

原始类型：number / string / boolean / null / undefined / symbol / bigint；其余是对象。JS 的**隐式类型转换**是 bug 重灾区：

${F}js
[] == false      // true（[] 转成 '' 再转 0，false 也转 0）
null == undefined  // true，但 null == 0 是 false
${C}0.1 + 0.2 === 0.3${C}  // false！浮点精度误差
${F}

**纪律：永远用 ${C}===${C}（严格相等），不碰 ${C}==${C}；浮点金额用整数分存储或 decimal 库。**

## 二、原型和原型链

JS 没有「类」（ES6 class 是语法糖），对象通过 **prototype 原型**共享方法，访问属性时沿 **__proto__ 链**向上找。理解原型链，才懂继承、${C}instanceof${C}、方法查找。

${F}js
function Person(name){ this.name = name; }
Person.prototype.say = function(){ return this.name; };
const p = new Person('Tom');
p.say();  // 自身没有 say，沿原型链找到 Person.prototype.say
${F}

## 三、闭包：函数记住了它的词法作用域

闭包 = 函数 + 它定义时的环境。常见用途：私有变量、函数工厂、回调保留上下文。

${F}js
function makeCounter(){
  let n = 0;                       // 被闭包「私人占有」
  return () => ++n;               // 每次调用都访问同一个 n
}
const c = makeCounter();
c(); c();  // 1, 2
${F}

⚠ **闭包陷阱**：循环里用 ${C}var${C} + 闭包，i 全是同一个（循环结束后的值）。用 ${C}let${C} 块级作用域或 ${C}forEach${C} 解决。

## 四、this：谁调用归谁

${C}this${C} 指向**调用时的对象**，不是定义时的。箭头函数没有自己的 this，沿用外层。这也是 React 里要 bind 或用箭头函数的原因。

## ⚠ 踩坑与经验

1. **${C}==${C} 比较各种诡异结果**：一律 ${C}===${C}。
2. **浮点金额直接加减**：0.1+0.2 不等于 0.3，用整数分或 decimal。
3. **循环闭包用 var**：i 共享，异步回调拿到的都是最后一个值。
4. **误解 this**：回调/定时器中 this 丢失，用箭头函数或 bind。
5. **var 变量提升引发混乱**：用 ${C}let/const${C}，杜绝 hoisting 带来的诡异。

## ✅ 排障清单

- [ ] 比较用 ===，金额用整数/decimal
- [ ] 理解原型链与 instanceof
- [ ] 闭包保留环境，循环用 let 避免共享
- [ ] this 看「谁调用」，箭头函数沿用外层
- [ ] 变量声明用 let/const，不用 var
`
          },
          {
            id: "dom-event",
            title: "DOM 与事件",
            minutes: 14,
            updated: "2026-09-15",
            applies: "浏览器 DOM API",
            tags: ["DOM", "事件", "浏览器"],
            terms: ["DOM", "事件", "浏览器"],
            body: `
## 一、DOM：HTML 在内存里的树

浏览器把 HTML 解析成 **DOM 树**，JS 通过 DOM API 增删改查节点，浏览器再渲染。DOM 操作有成本，**频繁操作要批处理**，别在循环里反复改 DOM（回流重排）。

## 二、事件流：捕获 → 目标 → 冒泡

点击一个按钮，事件先**从 window 往下捕获**到目标，再**从目标往上冒泡**到 window。

- ${C}addEventListener('click', fn, false)${C}：冒泡阶段（默认）
- ${C}true${C}：捕获阶段

## 三、事件委托：用冒泡省内存

列表里每个 item 都绑事件？N 个子节点 = N 个监听器。改成**在父节点上监听**，靠事件冒泡 + ${C}e.target${C} 判断是哪个子节点触发：

${F}js
list.addEventListener('click', (e) => {
  const item = e.target.closest('li');   // 找到实际点的 li
  if (item) handle(item);
});
${F}

好处：动态新增的 li 也自动生效，不用重新绑定。

## 四、阻止默认与冒泡

- ${C}e.preventDefault()${C}：阻止默认行为（如表单提交、a 跳转）
- ${C}e.stopPropagation()${C}：阻止冒泡（别滥用，会破坏委托）

## ⚠ 踩坑与经验

1. **循环里逐个 addEventListener**：几百个节点几百个监听器，性能差、易漏解绑。用事件委托。
2. **频繁 DOM 操作触发重排**：循环改 style，浏览器一次次重排。先改完再一次性插入（DocumentFragment）。
3. **stopPropagation 滥用**：破坏事件委托，导致上层逻辑收不到，调试抓狂。
4. **没解绑事件导致内存泄漏**：SPA 切换页面时旧监听器没清，越用越卡。
5. **直接改 innerHTML 拼用户输入**：XSS 漏洞（见前端安全篇），用 textContent 或转义。

## ✅ 排障清单

- [ ] 列表事件用委托，不在每个子节点绑
- [ ] DOM 操作批量进行，避免循环内反复重排
- [ ] 切页面/组件卸载时解绑事件，防内存泄漏
- [ ] 用户输入用 textContent，禁止未转义 innerHTML
- [ ] 慎用 stopPropagation，避免破坏委托
`
          },
          {
            id: "browser-http",
            title: "HTTP 与浏览器基础",
            minutes: 14,
            updated: "2026-09-15",
            applies: "浏览器 / HTTP/1.1·2",
            tags: ["HTTP", "浏览器", "缓存"],
            terms: ["HTTP", "浏览器", "缓存", "CORS"],
            body: `
## 一、浏览器从输入 URL 到页面呈现

${C}DNS 解析 → 建立 TCP(→TLS) 连接 → 发 HTTP 请求 → 服务器响应 → 解析 HTML → 下载 CSS/JS/图片 → 构建 DOM/CSSOM → 渲染树 → 布局 → 绘制${C}

理解这条链路，才能定位「白屏慢在哪一步」。

## 二、浏览器缓存：性能的第一杠杆

| 缓存 | 控制 | 特点 |
|---|---|---|
| 强缓存 | ${C}Cache-Control: max-age${C} / Expires | 未过期直接读本地，不发请求 |
| 协商缓存 | ${C}ETag / Last-Modified${C} | 发请求问「变没变」，没变返回 304 |

**实战配置**：HTML 用协商缓存（每次问），静态资源（JS/CSS/图片）文件名带 hash + 强缓存一年——内容变了 hash 变、URL 变，自动破缓存。

## 三、CORS：浏览器的同源策略

同源 = 协议 + 域名 + 端口都相同。跨域请求浏览器会拦。服务端返回 ${C}Access-Control-Allow-Origin${C} 等头放行：

${F}http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
${F}

⚠ **CORS 是浏览器限制，不是服务器不能收**：后端其实收到了请求，是浏览器拦了响应。复杂请求（带自定义头/非简单方法）会先发 **OPTIONS 预检**。

## 四、Cookie / SessionStorage / LocalStorage

| 存储 | 生命周期 | 随请求发送 | 大小 |
|---|---|---|---|
| Cookie | 可设过期 | 是（每次请求） | ~4KB |
| localStorage | 永久 | 否 | ~5MB |
| sessionStorage | 标签页关即清 | 否 | ~5MB |

## ⚠ 踩坑与经验

1. **静态资源没加 hash + 强缓存**：发版后用户还是旧 JS，白屏/报错。hash + 长缓存是正解。
2. **Cookie 存大对象**：每次请求都带，浪费带宽，超 4KB 还存不下。
3. **CORS 以为是后端没收到**：其实是浏览器拦响应，看 Network 的 OPTIONS 预检和响应头。
4. **依赖 localStorage 存敏感信息**：明文、易被 XSS 读走，token 别放这。
5. **缓存配置把 HTML 也强缓存了**：用户永远拿不到新页面，HTML 用协商缓存。

## ✅ 排障清单

- [ ] 静态资源文件名带 hash + 强缓存，HTML 用协商缓存
- [ ] CORS 看预检 OPTIONS 和响应头，不是后端没收到
- [ ] 敏感信息不存 localStorage，token 走 httpOnly Cookie
- [ ] Cookie 不放大对象，仅放必要标识
- [ ] 白屏排查沿 URL→连接→响应→渲染链路逐段看
`
          },
          {
            id: "responsive",
            title: "响应式与移动端适配",
            minutes: 13,
            updated: "2026-09-15",
            applies: "移动端 Web / 小程序",
            tags: ["响应式", "移动端", "适配"],
            terms: ["响应式", "移动端", "rem", "vw"],
            body: `
## 一、Viewport：移动端的第一步

不设 viewport，手机会按桌面宽度（980px）渲染再缩放，字小到看不清。必须：

${F}html
<meta name="viewport" content="width=device-width, initial-scale=1">
${F}

## 二、适配方案：rem / vw

设计稿通常是 750px（2x）。常见做法：
- **rem 方案**：根字号 ${C}font-size${C} 随屏宽动态算（如 ${C}html{font-size: 屏宽/10}${C}），元素用 rem 表达，等比缩放
- **vw 方案**：1vw = 屏宽 1%，直接用 vw 写尺寸，更直观，无需 JS

${F}css
/* 750 设计稿下，元素宽 200px → 200/750*100 = 26.67vw */
.box { width: 26.67vw; }
${F}

## 三、媒体查询与弹性布局

${F}css
@media (max-width: 768px) {
  .sidebar { display: none; }   /* 小屏隐藏侧栏 */
}
${F}

Flex/Grid 本身弹性好，配合 max-width、百分比、min/max 函数（${C}clamp()${C}）做流式布局，少写媒体查询。

## 四、1px 边框与高清屏

Retina 屏 devicePixelRatio=2/3，1px CSS 边框会变粗/模糊。用 transform scale 或 0.5px 方案处理视觉 1px。

## ⚠ 踩坑与经验

1. **忘了 viewport**：移动端页面被缩放，布局全乱。
2. **rem 基准算错**：根字号没随屏宽更新（或更新时机晚），适配错位。用 lib-flexible 或纯 vw。
3. **固定 px 不缩放**：大屏小屏一样大，移动端挤成一团。用 rem/vw。
4. **媒体查询断点过细**：断点一堆难维护，用流式布局 + 少量断点。
5. **图片不按 DPR 给**：高清屏糊，用 srcset / picture 按 DPR 出图。

## ✅ 排障清单

- [ ] 必设 viewport，移动端按设计稿做 rem/vw 适配
- [ ] 流式布局为主，媒体查询断点从简
- [ ] 高清屏图片用 srcset/picture 按 DPR 出图
- [ ] 1px 边框按 DPR 处理视觉
- [ ] 真机多尺寸验证，不只看模拟器
`
          }
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "能独立负责模块、排查兼容与性能：ES6 异步、框架原理、组件与状态、工程化、TypeScript。",
        chapters: [
          {
            id: "es6-async",
            title: "ES6+ 与异步编程",
            minutes: 17,
            updated: "2026-09-15",
            applies: "ECMAScript 2017+（async/await）",
            tags: ["ES6", "异步", "Promise"],
            terms: ["ES6", "Promise", "async", "异步"],
            body: `
## 一、为什么异步是前端命脉

JS 单线程，网络请求/定时器不能阻塞主线程，否则页面卡死。所以一切「可能慢」的操作都是**异步回调**。

## 二、从回调地狱到 Promise 到 async/await

${F}js
// 回调地狱（反例）
getUser(id, (u) => getOrders(u, (os) => render(os, () => {})));

// Promise：链式，可读
getUser(id).then(u => getOrders(u)).then(render).catch(err => ...);

// async/await：写起来像同步，可读性最佳
async function load() {
  try {
    const u = await getUser(id);
    const os = await getOrders(u);
    render(os);
  } catch (e) { handle(e); }
}
${F}

⚠ **await 不是并行**：上面两个 await 是串行的（第二个依赖第一个）。**无依赖的并行用 ${C}Promise.all${C}**，否则白白多等一倍时间。

## 三、Promise 的坑

- **吞错误**：Promise 链里没 ${C}catch${C}，错误静默消失，难以排查
- **Promise.all 一拒全拒**：一个失败整体 reject，用 ${C}Promise.allSettled${C} 拿每个结果
- **忘记 return**：then 里没 return，下一环拿到 undefined

## 四、微任务与宏任务：事件循环

JS 异步靠**事件循环**：同步代码 → 微任务（Promise.then、queueMicrotask）→ 宏任务（setTimeout、IO）。**微任务清空才执行下一个宏任务**。

${F}js
console.log(1);
setTimeout(() => console.log(2));      // 宏任务
Promise.resolve().then(() => console.log(3)); // 微任务
console.log(4);
// 输出：1 4 3 2
${F}

## ⚠ 踩坑与经验

1. **串行 await 拖慢接口**：能并行的不并行，首屏慢一倍。无依赖用 Promise.all。
2. **async 函数忘了 await**：返回的是 Promise 不是值，拿到 undefined 一脸懵。
3. **Promise 链没 catch**：错误被吞，线上静默失败。
4. **在循环里 await**：一个一个等，改用 ${C}Promise.all(arr.map(...))${C}。
5. **误以为 setTimeout 准时**：它只保证「至少延迟」，主线程忙时更晚，别用于精确计时。

## ✅ 排障清单

- [ ] 无依赖异步用 Promise.all 并行
- [ ] async 函数调用处加 await，链尾加 catch
- [ ] 区别 all / allSettled，按是否需要「一拒全拒」
- [ ] 理解微任务先于宏任务执行
- [ ] 不把 setTimeout 当精确定时器
`
          },
          {
            id: "framework-principle",
            title: "框架原理（React/Vue）",
            minutes: 18,
            updated: "2026-09-15",
            applies: "React 18 / Vue 3",
            tags: ["React", "Vue", "框架", "原理"],
            terms: ["React", "Vue", "虚拟DOM", "框架"],
            body: `
## 一、为什么有虚拟 DOM（VDOM）

直接操作真实 DOM 很贵（触发重排重绘）。框架维护一个**内存里的 JS 对象树（VDOM）**，数据变了先算新旧 VDOM 的差异（diff），**只把差异部分更新到真实 DOM**。这就是「数据驱动视图」。

## 二、React 的心智模型

${C}UI = f(state)${C}——给定状态，视图是状态的纯函数。核心是：
- **组件**：函数返回 JSX（描述 UI 的语法糖）
- **状态**：${C}useState${C} 管理，变了触发重渲染
- **单向数据流**：数据自上而下，子组件通过回调通知父组件改状态

${F}jsx
function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>点了 {n} 次</button>;
}
${F}

⚠ **不要在渲染里直接改 props/state**：React 靠不可变更新（setState 用新对象）来感知变化。直接改对象属性，diff 发现不了。

## 三、Vue 的响应式

Vue 3 用 **Proxy** 代理数据对象，访问/修改时收集依赖、触发更新。模板里 ${C}{{ }}${C} 绑定，改数据自动刷新对应视图。

**React vs Vue 关键差异**：React 靠「显式 setState + 重新执行组件」；Vue 靠「响应式拦截自动追踪依赖」。一个显式可控，一个自动省心。

## 四、diff 的代价与优化

VDOM diff 不是免费的。大列表用 **key**（稳定的唯一标识）帮框架识别节点，避免全量重建。没有 key 或 key 用 index，会导致错乱和性能问题。

## ⚠ 踩坑与经验

1. **key 用数组 index**：列表增删时节点错位、状态串台。key 用稳定业务 ID。
2. **在渲染中改状态**：造成无限循环重渲染，页面卡死。改状态放事件/副作用里。
3. **直接 mutate state 对象**：React 感知不到，视图不更新。用不可变更新。
4. **组件太大、重渲染范围过广**：拆小组件 + memo，避免一处变全树刷。
5. **useEffect 依赖写错**：依赖缺失导致闭包拿到旧值，或依赖过多频繁触发。

## ✅ 排障清单

- [ ] key 用稳定唯一 ID，不用 index
- [ ] state 用不可变更新，不在渲染期改状态
- [ ] 大列表用 key + 虚拟化，避免全量 diff
- [ ] 拆小组件 + memo 缩小重渲染范围
- [ ] useEffect 依赖数组写准，避免闭包陷阱
`
          },
          {
            id: "component-state",
            title: "组件设计与状态管理",
            minutes: 16,
            updated: "2026-09-15",
            applies: "React / Vue 通用",
            tags: ["组件", "状态管理", "设计"],
            terms: ["组件", "状态管理", "Redux", "Vuex"],
            body: `
## 一、组件设计的三个原则

- **单一职责**：一个组件只做一件事，好复用好测
- **受控 vs 非受控**：表单值由父组件管（受控）还是组件自己管（非受控），按需选
- **组合优于继承**：用 children / slot 组合，而非层层继承

## 二、状态该放哪：局部还是全局

判断标准：**这个状态有几个组件需要？**
- 只有自己用 → 组件内部 state
- 父子用 → 往上提一层（提升状态）
- **多个不相邻的组件都要** → 全局状态（Redux / Pinia / Zustand）

⚠ 别把所有状态塞全局——全局状态越多，追踪变更越难、重渲染越广。从局部开始，需要时再提升。

## 三、全局状态库的取舍

| 库 | 风格 | 适合 |
|---|---|---|
| Redux (React) | 单一 store + 纯函数 reducer + 不可变 | 大型、需时间旅行调试 |
| Zustand (React) | 极简 hooks API | 中小型、讨厌样板 |
| Pinia (Vue) | Vue 官方，组合式 | Vue 项目首选 |

## 四、状态管理的高频坑

${F}js
// 把服务端数据直接当响应式源，反复拉取
// 正确：请求一次缓存、用 loading/error 态管理，避免重复请求
${F}

## ⚠ 踩坑与经验

1. **全局状态滥用**：所有 state 都塞 store，组件耦合、重渲染广。从局部开始。
2. **prop drilling 八层深**：层层传参，改用 Context/全局或组合。
3. **状态放在错误的组件**：该提升没提升，兄弟组件拿不到，靠 hack 解决。
4. **直接改 store 对象**：Redux 要 dispatch action 不可变更新，直接改不触发。
5. **重复请求不缓存**：组件卸载重挂就再拉，用请求缓存/SWR/React Query。

## ✅ 排障清单

- [ ] 状态就近原则：局部够用就不全局
- [ ] 组件单一职责，用组合而非继承
- [ ] 全局库按需选（Redux/Zustand/Pinia）
- [ ] 服务端数据做请求缓存，避免重复拉取
- [ ] store 用规范 action/不可变更新，不直接 mutate
`
          },
          {
            id: "build-tooling",
            title: "构建工具与工程化",
            minutes: 16,
            updated: "2026-09-15",
            applies: "Vite / Webpack / npm",
            tags: ["构建", "工程化", "Vite", "Webpack"],
            terms: ["构建", "Vite", "Webpack", "工程化"],
            body: `
## 一、构建工具在解决什么

浏览器不认 TypeScript、不认 JSX、不认 import 路径别名。构建工具做：**编译（TS/JSX）→ 模块打包 → 代码分割 → 压缩混淆 → 资源处理**，产出浏览器能跑的产物。

## 二、Webpack vs Vite：范式差异

- **Webpack**：先打包再起服务，项目大时启动/热更新慢
- **Vite**：开发时用浏览器原生 ESM + 按需编译，启动秒级；生产用 Rollup 打包

⚠ Vite 不是「更快的 Webpack」，而是**开发模式换了思路**（不预打包全部，按需编译）。新项目基本无脑 Vite。

## 三、代码分割：别让用户一次下完整个应用

${F}js
// 路由级懒加载，访问才下载对应 chunk
const Home = React.lazy(() => import('./Home'));
// 或 Vite 动态 import 自动分包
${F}

配 ${C}splitChunks${C} 把公共库（react、lodash）抽成单独 chunk，多页面共享缓存。

## 四、工程化的其他拼图

- **包管理**：npm / pnpm（pnpm 硬链接省空间、依赖严格）
- **Lint / Format**：ESLint + Prettier，CI 卡住不规范的代码
- **CI/CD**：提交即构建+测试+部署，质量前移
- **环境变量**：区分 dev/test/prod，敏感配置走环境变量

## ⚠ 踩坑与经验

1. **没做代码分割**：首屏下载几 MB，白屏十几秒。路由懒加载 + 抽公共包。
2. **lock 文件不提交**：devDependencies 版本漂移，别人装出不一样的环境，「我本地是好的」。提交 package-lock / pnpm-lock。
3. **dev 和生产用不同打包器逻辑**：行为不一致，构建产物和本地差很多。统一走同一套配置。
4. **依赖全装 dependencies**：构建工具、类型声明应是 devDependencies，别进生产包。
5. **大库整体引入**：import 整个 lodash，tree-shaking 失效，用 ${C}import { debounce } from 'lodash-es'${C}。

## ✅ 排障清单

- [ ] 路由级懒加载 + splitChunks 抽公共库
- [ ] 提交 lock 文件，固定依赖版本
- [ ] dev/prod 用同一套构建逻辑
- [ ] 构建工具/类型声明归 devDependencies
- [ ] 按需引入，开启 tree-shaking，别整包 import
`
          },
          {
            id: "typescript",
            title: "TypeScript 实践",
            minutes: 15,
            updated: "2026-09-15",
            applies: "TypeScript 5.x",
            tags: ["TypeScript", "类型", "工程"],
            terms: ["TypeScript", "类型", "TS"],
            body: `
## 一、TS 的价值：把 bug 挡在编译期

JS 是动态类型，很多错误运行时才暴露。TS 在**编译时**检查类型，配合 IDE 智能提示，大型项目维护和重构安全感完全不同。

## 二、从 any 到精确类型

${F}ts
// 反例：any 等于放弃类型检查
function f(x: any) { return x.foo.bar; }   // 运行时才崩

// 正例：定义结构
interface User { id: number; name: string; }
function getName(u: User): string { return u.name; }
${F}

⚠ **别用 any 逃避类型**：any 会「传染」——任何和 any 交互的结果都变 any，类型保护形同虚设。用 ${C}unknown${C} + 类型守卫替代。

## 三、实用类型工具

${F}ts
type Partial<T>   // 所有属性可选
type Pick<T, K>   // 挑几个属性
type Omit<T, K>   // 排除几个属性
type ReturnType<typeof fn>  // 提取函数返回类型
${F}

配合**泛型**，写出可复用又类型安全的工具函数。

## 四、渐进式采用

老 JS 项目不必一步到位：先 ${C}allowJs${C} 混编，逐步给文件加 ${C}.ts${C}；开 ${C}strict${C} 模式收益最大（null 检查、隐式 any 报错）。

## ⚠ 踩坑与经验

1. **any 到处用**：等于没上 TS，错误照样运行时爆。用 unknown + 守卫。
2. **类型断言硬转**：${C}as${C} 把错误类型蒙混过关，隐患留在运行时。先确认真的能转。
3. **过度设计类型**：一层套一层泛型，可读性崩。类型服务于业务，别炫技。
4. **strict 不开**：隐式 any、null 不检查，TS 价值少一半。新项目默认 strict。
5. **后端接口类型对不上**：手写类型和实际响应脱节。用代码生成（openapi → ts）保持同步。

## ✅ 排障清单

- [ ] 控制 any，用 unknown + 类型守卫
- [ ] 新项目开 strict，类型检查最大化
- [ ] 善用 Partial/Pick/Omit/泛型提效
- [ ] 后端类型用 openapi 生成，避免手写出错
- [ ] 类型服务业务，不过度设计
`
          }
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "能做架构与技术选型：渲染性能、前端监控、微前端、跨端、前端安全。",
        chapters: [
          {
            id: "render-perf",
            title: "浏览器渲染原理与性能优化",
            minutes: 19,
            updated: "2026-09-15",
            applies: "现代浏览器渲染管线",
            tags: ["渲染", "性能", "优化"],
            terms: ["渲染", "性能", "重排", "重绘"],
            body: `
## 一、渲染流水线（搞懂才能优化）

${C}JS/CSS → 样式计算(Style) → 布局(Layout/重排) → 绘制(Paint/重绘) → 合成(Composite)${C}

- **重排（Layout）**：改了几何属性（宽高/位置），要重新算布局，最贵
- **重绘（Paint）**：只改颜色等，不必重新布局，较贵
- **合成（Composite）**：transform/opacity 走 GPU 合成层，最便宜

## 二、关键渲染指标（Core Web Vitals）

| 指标 | 含义 | 良好线 |
|---|---|---|
| LCP | 最大内容绘制（加载速度） | < 2.5s |
| CLS | 累积布局偏移（视觉稳定） | < 0.1 |
| INP | 交互到响应的延迟 | < 200ms |

## 三、优化套路（按性价比排序）

1. **减少重排重绘**：批量改样式、用 transform/opacity 动画（走合成）、避免强制同步布局（读 offset 后立即写触发 reflow）
2. **减少主线程阻塞**：长任务拆分（requestIdleCallback / 分片）、Web Worker 跑计算
3. **加载提速**：代码分割、资源压缩、图片懒加载、HTTP 缓存、CDN
4. **渲染优化**：列表虚拟化（万级数据只渲染可视区）、防抖节流

${F}js
// 防抖：停止操作 N 秒后才执行（搜索联想）
// 节流：每 N 秒最多执行一次（滚动/resize）
${F}

## 四、长列表虚拟化

渲染 1 万条 DOM 直接卡死。虚拟化只渲染视口内的几十行，滚动时回收复用——react-window / vue-virtual-scroller。

## ⚠ 踩坑与经验

1. **布局抖动（Layout Thrash）**：JS 里循环读 offset 再写样式，每次都强制同步重排。批量读、批量写。
2. **动画用 top/left**：触发重排，用 transform: translate 走合成层。
3. **一次性渲染大列表**：几千 DOM 节点，首屏卡。虚拟化。
4. **首屏 JS 太大**：白屏久，代码分割 + 关键资源预加载。
5. **图片不懒加载不压缩**：带宽和内存双炸，用 loading="lazy" + 响应式图。

## ✅ 排障清单

- [ ] 动画用 transform/opacity（合成），避免重排
- [ ] 批量读写样式，消除布局抖动
- [ ] 大列表虚拟化，只渲染可视区
- [ ] 关注 LCP/CLS/INP，代码分割提速
- [ ] 长任务拆分到 Worker / 空闲回调
`
          },
          {
            id: "fe-monitor",
            title: "前端监控与错误治理",
            minutes: 16,
            updated: "2026-09-15",
            applies: "前端可观测性",
            tags: ["监控", "错误", "埋点"],
            terms: ["监控", "错误", "埋点", "性能"],
            body: `
## 一、前端也要可观测：你不知道的bug最多

后端有日志监控，前端同样需要。三大类：
- **错误监控**：JS 异常、Promise 未捕获、资源加载失败
- **性能监控**：LCP/CLS/INP、接口耗时、白屏
- **行为埋点**：用户操作路径，用于分析转化与定位问题

## 二、错误捕获的「缝隙」

${F}js
// 全局 JS 错误
window.addEventListener('error', e => report(e));
// Promise 未捕获（error 事件抓不到！）
window.addEventListener('unhandledrejection', e => report(e.reason));
// React 错误边界：catch 渲染期错误
class EB extends React.Component {
  componentDidCatch(err, info) { report(err, info); }
}
${F}

⚠ **${C}window.onerror${C} 抓不到 Promise 拒绝**，必须单独监听 ${C}unhandledrejection${C}。React 渲染错误要用 Error Boundary，否则整页白屏。

## 三、Source Map：线上错误回源码

生产代码被压缩混淆，报错堆栈是一串 abc:1:1234。上传 **Source Map** 到监控平台，错误自动映射回你的源码行号——否则线上报错你根本看不懂。

## 四、采样与脱敏

全量上报浪费带宽且淹没有效信息。错误全量、性能/埋点**采样**（如 10%）。上报内容**脱敏**：用户密码、token、身份证绝不进监控。

## ⚠ 踩坑与经验

1. **只监听 onerror 漏掉 Promise 拒绝**：未捕获的 async 错误全丢。补 unhandledrejection。
2. **没上传 Source Map**：线上堆栈是压缩代码，定位靠猜。
3. **没 Error Boundary**：一个组件渲染崩，整页白屏，用户看到的是「网站挂了」。
4. **全量上报拖性能**：高频错误刷屏，采样 + 聚合。
5. **监控里打了敏感信息**：合规事故。上报前脱敏。

## ✅ 排障清单

- [ ] 错误监控覆盖 onerror + unhandledrejection
- [ ] React 用 Error Boundary 防整页白屏
- [ ] 上传 Source Map，错误映射到源码
- [ ] 性能/埋点采样上报，错误内容脱敏
- [ ] 监控告警分级，避免无效轰炸
`
          },
          {
            id: "micro-frontend",
            title: "微前端与大型项目管理",
            minutes: 17,
            updated: "2026-09-15",
            applies: "qiankun / Module Federation",
            tags: ["微前端", "架构", "大型项目"],
            terms: ["微前端", "架构", "Module Federation"],
            body: `
## 一、什么时候才需要微前端

单体前端随团队扩大，构建变慢、技术栈锁死、多团队互相踩。微前端把**一个巨应用拆成多个独立开发部署的子应用**，各自技术栈、独立发布。

⚠ **不是银弹**：引入通信、样式隔离、版本协调的复杂度。小团队/单应用别上，先靠**模块拆分 + Monorepo** 解决。

## 二、主流方案

| 方案 | 思路 | 适合 |
|---|---|---|
| qiankun（基于 single-spa） | 运行时主应用加载子应用 | 多技术栈并存、逐步迁移 |
| Module Federation | 构建期共享模块，运行时按需加载 | Webpack5 生态、细粒度共享 |
| iframe | 物理隔离最强 | 完全独立、交互少的子系统 |

## 三、三个必须解决的核心问题

1. **样式隔离**：子应用 CSS 互相污染。用 Shadow DOM / 加前缀 / 运行时 scoped。
2. **JS 隔离**：避免全局变量冲突（沙箱）。
3. **通信**：主子应用、子子应用间如何传数据（全局状态总线 / 自定义事件）。

## 四、Monorepo：不那么重的替代

很多「微前端需求」其实用 **Monorepo（pnpm workspace / Turborepo）** 就能解决：多包单仓、共享依赖、统一构建，但没有运行时的隔离复杂度。先考虑它。

## ⚠ 踩坑与经验

1. **小项目硬上微前端**：复杂度爆炸，构建部署反而更慢。先 Monorepo。
2. **样式没隔离互相污染**：全局 CSS 冲突，UI 错乱。用沙箱/前缀/scoped。
3. **子应用加载慢拖垮整体**：预加载、懒加载、共享依赖去重。
4. **版本不一致**：基础库多个版本并存，行为分叉。统一依赖版本。
5. **通信耦合回单体**：子应用直接调对方内部，等于没拆。走规范通信总线。

## ✅ 排障清单

- [ ] 先评估 Monorepo 能否解决，再上微前端
- [ ] 样式隔离 + JS 沙箱 + 规范通信三件套齐备
- [ ] 共享依赖去重，避免多版本并存
- [ ] 子应用懒加载/预加载，控制加载成本
- [ ] 统一基础库版本，防行为分叉
`
          },
          {
            id: "cross-platform",
            title: "跨端方案与工程提效",
            minutes: 15,
            updated: "2026-09-15",
            applies: "React Native / Taro / 小程序",
            tags: ["跨端", "提效", "工程"],
            terms: ["跨端", "小程序", "工程化", "提效"],
            body: `
## 一、跨端的本质：一次开发，多端运行

目标是在 Web / iOS / Android / 小程序之间复用代码，降低多端维护成本。代价是**对原生能力的表达受限**，复杂交互还是要写原生。

## 二、方案谱系

| 方案 | 产物 | 特点 |
|---|---|---|
| WebView 壳（Cordova/ Capacitor） | 套原生壳的 H5 | 最简单，性能受限 |
| React Native / Flutter | 原生组件（RN 桥 / Flutter 自绘） | 接近原生体验 |
| 小程序多端框架（Taro / uni-app） | 各平台小程序代码 | 一套转多小程序 |
| 编译到原生 Web（Web Components） | 跨框架复用 | 组件级复用 |

## 三、工程提效的杠杆（比跨端更普适）

跨端解决「多端代码」，但**日常提效**更靠：
- **组件库 / 物料**：沉淀通用 UI，不重复造
- **脚手架 / 代码生成**：一条命令起项目、生成 CRUD
- **Monorepo + 共享包**：多项目复用逻辑
- **CI 自动化**：提交即构建测试，质量前移

## 四、别高估跨端的收益

⚠ **80% 业务能跨端，20% 核心体验还是要原生**。如果为了跨端牺牲了关键性能/体验，得不偿失。按业务重要性分配投入。

## ⚠ 踩坑与经验

1. **为跨端牺牲核心体验**：某端体验明显差却硬撑，用户流失。关键路径可写原生。
2. **低估原生桥成本**：RN 频繁桥接通信反而比原生慢，重计算放原生。
3. **小程序平台差异硬踩**：各小程序 API/限制不同，没做适配层，一处改处处崩。
4. **只追跨端忽略工程提效**：组件库/脚手架/CI 的收益往往更大且更稳。
5. **过度抽象一套代码**：兼容所有端的 if-else 满天飞，可读性崩。按需拆分。

## ✅ 排障清单

- [ ] 跨端前先算 ROI，关键体验可原生补
- [ ] 选方案按目标端（小程序/H5/原生）匹配
- [ ] 重计算/频繁桥接放原生，别全压 JS
- [ ] 同步建设组件库/脚手架/CI 提效
- [ ] 平台差异集中适配，避免散落 if-else
`
          },
          {
            id: "fe-security",
            title: "前端安全",
            minutes: 17,
            updated: "2026-09-15",
            applies: "Web 安全通用",
            tags: ["安全", "XSS", "CSRF", "前端"],
            terms: ["安全", "XSS", "CSRF", "前端安全"],
            body: `
## 一、前端是安全的第一道防线（也是攻击面）

很多攻击最终落在浏览器：XSS 偷 cookie、CSRF 冒充用户、点击劫持、第三方脚本投毒。前端不能只管展示。

## 二、XSS：最经典的注入

**跨站脚本**：攻击者把恶意 JS 注入页面，在受害者浏览器执行（偷 token、钓鱼、篡改）。

${F}js
// 危险：把用户输入直接当 HTML 插入
el.innerHTML = userInput;     // 若 userInput = <script>steal()</script> 即中招
// 安全：用 textContent，或渲染前转义
el.textContent = userInput;
${F}

⚠ 现代框架（React/Vue）默认**对插值做转义**，${C}{ { } }${C} 不会执行 HTML。但用 ${C}dangerouslySetInnerHTML${C} / ${C}v-html${C} 时又回到裸奔——必须服务端转义或白名单过滤（DOMPurify）。

## 三、CSRF：冒充你发请求

攻击者诱导已登录用户访问恶意页，自动发起请求（利用浏览器自动带 cookie）。防御：
- **CSRF Token**：请求带服务端下发的随机 token，攻击者拿不到
- **SameSite Cookie**：${C}SameSite=Lax/Strict${C} 限制跨站带 cookie
- 关键操作校验二次（短信/验证码）

## 四、其它要点

- **CSP（内容安全策略）**：白名单限制能加载的脚本源，即使 XSS 注入也执行不了外部脚本
- **第三方脚本风险**：统计/广告 SDK 一旦被投毒，全站受影响，要审查 + SRI 校验
- **敏感信息不进前端存储**：token 用 httpOnly Cookie，避免 JS 读取

## ⚠ 踩坑与经验

1. **dangerouslySetInnerHTML / v-html 不转义**：直接渲染用户内容 = XSS 后门。先 DOMPurify。
2. **token 存 localStorage**：XSS 一行脚本全偷走。用 httpOnly Cookie。
3. **只防 XSS 不防 CSRF**：两者不同，CSRF 靠 token/SameSite。
4. **第三方脚本无 SRI/审查**：被篡改的 SDK 全站中招，限制并校验外部脚本。
5. **错误信息透出内部细节**：把堆栈/SQL 返回给浏览器，帮攻击者定位。生产关详细错误。

## ✅ 排障清单

- [ ] 用户输入渲染前转义，慎用 dangerouslySetInnerHTML/v-html（配 DOMPurify）
- [ ] token 放 httpOnly Cookie，不存 localStorage
- [ ] CSRF Token + SameSite Cookie 双防
- [ ] 配置 CSP 白名单，限制脚本源
- [ ] 第三方脚本审查 + SRI，生产不暴露内部错误
`
          }
        ]
      }
    ]
  };

  window.FRONTEND = FRONTEND;
})();
