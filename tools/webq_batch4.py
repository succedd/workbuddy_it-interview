# -*- coding: utf-8 -*-
"""第 4 批：前端 JavaScript/Vue/React + AI 工程化（来源：前端经典高频题 + 2026 面试趋势）"""
BATCH = "frontend-ai"

QUESTIONS = [
# ============ JavaScript [59] ============
dict(cat=59, title="JavaScript 的事件循环（Event Loop）机制是什么？宏任务与微任务的区别？",
     body="请说明 JS 单线程下的任务调度顺序：同步代码、微任务（Promise.then）、宏任务（setTimeout）的执行优先级。",
     diff="中级", years="1-3年", tags=["JavaScript","事件循环","Promise"],
     pos=["前端开发工程师","全栈开发工程师","Web全栈工程师"],
     answer="""**背景**：JS 是单线程语言，耗时任务会阻塞页面。事件循环让 JS 实现"异步非阻塞"——同步任务在调用栈直接执行，异步任务回调进入任务队列等待。

**一轮循环的顺序**：
1. 执行**同步代码**（调用栈清空）；
2. 清空**全部微任务队列**（microtask：Promise.then/catch/finally、MutationObserver、queueMicrotask）；
3. 取**一个宏任务**执行（macrotask：setTimeout/setInterval、I/O、UI 渲染、requestAnimationFrame）；
4. 每个宏任务结束后**再清空微任务**，如此往复；浏览器还会在合适时机进行渲染。

**经典题**：
```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
// 输出：1 4 3 2
```
同步 1、4 → 微任务 3 → 宏任务 2。

**关键点**：微任务优先级高于宏任务；`await` 后面的代码相当于放进 then（微任务）；Node.js 与浏览器的循环阶段划分不同（Node 有 process.nextTick 与阶段轮转），追问时注意区分环境。"""),
dict(cat=59, title="什么是闭包？有什么应用场景和问题？",
     body="请解释闭包的定义与形成条件，列举防抖节流、私有变量等应用，并说明内存泄漏风险。",
     diff="中级", years="1-3年", tags=["JavaScript","闭包","作用域"],
     pos=["前端开发工程师","全栈开发工程师","Web全栈工程师"],
     answer="""**定义**：函数与其创建时所处**词法作用域**的组合——内层函数引用了外层函数的变量，且内层函数在外层执行结束后仍然可达，这些变量就"活"了下来，别人无法直接访问。

```js
function counter() {
  let count = 0;               // 被 inner 闭包持有
  return () => ++count;
}
const inc = counter();
inc(); // 1   count 不会被销毁，也无法从外部直接修改
inc(); // 2
```

**形成条件**：函数嵌套 + 内层引用外层变量 + 内层函数被外部持有（return/事件回调/定时器）。

**应用场景**：①防抖/节流（保存定时器 id）；②私有变量与模块模式（IIFE 封装）；③柯里化/偏函数；④React Hooks 的 state 记忆（useCallback 依赖捕获）；⑤循环中保存每次迭代的值（经典的 var→let 问题本质就是闭包）。

**问题**：被闭包持有的变量无法回收，滥用导致**内存泄漏**——不再需要的闭包及时置 null、注意定时器/事件监听器里的大对象引用。面试常追问"闭包与内存泄漏的关系"，答"不是闭包必然泄漏，而是不当持有导致泄漏"。"""),
dict(cat=59, title="原型与原型链是什么？如何实现继承？",
     body="请说明 __proto__、prototype 的关系与属性查找规则，并对比 ES6 class 前后的继承方式。",
     diff="中级", years="1-3年", tags=["JavaScript","原型链","继承"],
     pos=["前端开发工程师","Web全栈工程师","前端架构师"],
     answer="""**核心规则**：
- 每个函数都有 `prototype`（原型对象），其 `constructor` 指回函数本身；
- 每个对象都有 `__proto__`（即 [[Prototype]]），指向创建它的构造函数的 `prototype`；
- **属性查找**：先找自身 → 沿 `__proto__` 逐级向上找 → 直到 `Object.prototype.__proto__ === null` 为止，这条链就是**原型链**。

```js
function Dog(name){ this.name = name; }
Dog.prototype.bark = function(){ return this.name + ': woof'; };
const d = new Dog('旺财');
d.bark();      // 自身没有 bark，沿原型链找到 Dog.prototype
d.toString();  // 继续向上找到 Object.prototype
```

**继承方式演进**：
1. 原型链继承（Child.prototype = new Parent()）：引用类型属性共享的缺陷；
2. 借用构造函数（Parent.call(this)）：无法继承原型方法；
3. 组合继承（1+2）：调用了两次父构造函数；
4. 寄生组合式（Object.create(Parent.prototype) + call）：最优解；
5. **ES6 class/extends**：语法糖，底层就是寄生组合式继承，静态方法、super、new.target 语义更完整——**实践直接用 class**，面试讲清演进即可。"""),
dict(cat=63, title="Vue3 的响应式原理是什么？为什么用 Proxy 替代 Object.defineProperty？",
     body="请说明 Vue3 基于 Proxy 的响应式实现（track/trigger），以及相比 Vue2 的 defineProperty 的优势。",
     diff="高级", years="3-5年", tags=["Vue3","响应式","Proxy"],
     pos=["前端开发工程师","前端架构师","全栈开发工程师"],
     answer="""**Vue2 的局限（Object.defineProperty）**：只能劫持**已存在属性**的 get/set——①新增/删除属性检测不到（需要 $set/$delete 补丁）；②数组下标赋值与 length 修改检测不到（要重写七个数组方法）；③初始化就要递归遍历整个 data，开销前置。

**Vue3 的方案（Proxy）**：`reactive(obj)` 返回 Proxy 代理，拦截**整个对象**的 13 种操作（get/set/deleteProperty/has/ownKeys 等）。
- **track（依赖收集）**：get 拦截里记录"当前正在运行的副作用函数 effect 与该属性的映射"（target→key→effect Set，WeakMap 结构）；
- **trigger（派发更新）**：set/delete 拦截里，按映射找到关联 effect 批量触发重新执行（组件重渲染）。

**优势**：①新增/删除属性天然响应，$set 移除；②数组索引、length 直接生效；③惰性代理——访问到哪层才代理哪层，初始化开销小；④支持 Map/Set。
**注意点**：Proxy 不能代理原生值——所以需要 `ref()` 包裹基本类型（内部用 value 的 get/set + 依赖收集实现）；解构 reactive 对象会丢失响应式（要用 toRefs）。"""),
dict(cat=64, title="React Hooks 的原理与使用规则是什么？",
     body="请解释 Hooks 基于链表的状态存储机制，说明两条使用规则的原因，以及闭包陷阱与 useEffect 依赖问题。",
     diff="高级", years="3-5年", tags=["React","Hooks","前端"],
     pos=["前端开发工程师","前端架构师","全栈开发工程师"],
     answer="""**实现原理**：函数组件每次渲染就是一次**函数调用**。Hooks 的状态不存在组件实例上，而是挂在 React 内部该组件的**单向链表**上——每次渲染按**调用顺序**逐一取出 hook（useState 返回对应槽位的 state，setter 触发重渲染重新执行函数）。这就是为什么 Hooks 必须**每次渲染以完全相同的顺序调用**。

**两条铁律的由来**：
1. **只在顶层调用，不要在循环/条件/嵌套函数里调用**——条件分支会让链表错位，state 串号；
2. **只在 React 函数组件或自定义 Hook 中调用**——状态必须挂到 React 管理的组件上。

**常见坑**：
- **闭包陷阱**：useEffect/事件回调里读到的 state 是**当次渲染的快照**（每次渲染都有独立的作用域），需要最新值时用 ref 或依赖数组让 effect 重新建立闭包；
- **依赖数组**：eslint-plugin-react-hooks 的 exhaustive-deps 规则帮助补全依赖；漏依赖导致读到旧值，多依赖导致 effect 频繁重跑，用 useCallback/useMemo 稳定引用；
- setState 是**异步批量**合并的（React 18 自动批处理），连续 set 读不到最新值，用函数式更新 `setX(prev => prev+1)`。"""),
dict(cat=59, title="浏览器的强缓存与协商缓存是如何工作的？",
     body="请说明 Cache-Control/Expires 与 Last-Modified/ETag 的工作流程与优先级，并给出缓存策略实践。",
     diff="中级", years="1-3年", tags=["浏览器","HTTP缓存","性能优化"],
     pos=["前端开发工程师","后端开发工程师","全栈开发工程师"],
     answer="""**强缓存**：浏览器**直接使用本地副本，不发请求**。
- `Cache-Control: max-age=31536000, immutable`（优先级高，HTTP/1.1）
- `Expires: <绝对时间>`（HTTP/1.0，受本地时钟影响，作为兼容降级）

**协商缓存**：强缓存过期后，浏览器**带条件发请求问服务器**"资源变了吗"：
- `ETag/If-None-Match`：资源指纹（内容 hash），服务器比对后**返回 304**（未变，用本地缓存，无 body）或 200+新内容；
- `Last-Modified/If-Modified-Since`：最后修改时间（秒级精度，有局限：1 秒内多次修改、内容不变时间变）。
ETag 优先级高于 Last-Modified。

**实践策略**（本站也在用）：
1. **带 hash 的静态资源**（js/css/图片）：`Cache-Control: max-age=1年, immutable`——文件名一变 URL 就变，强缓存拉满；
2. **入口 HTML**：`no-cache`——每次协商缓存，保证能第一时间发现新版本引用；
3. **API 响应**：一般不缓存或短缓存，防数据滞后；
4. Service Worker 层面可做更细粒度的 stale-while-revalidate（先给旧内容，后台更新）。"""),

# ============ AI 工程化 [187/194] ============
dict(cat=187, title="什么是 RAG？它的典型架构和流程是怎样的？",
     body="请说明检索增强生成（RAG）解决什么问题，以及离线建库与在线检索生成两个阶段的完整流程。",
     diff="中级", years="1-3年", tags=["RAG","大模型","向量检索"],
     pos=["AI应用开发工程师","算法工程师","AI产品工程师"],
     answer="""**RAG（Retrieval-Augmented Generation，检索增强生成）**：让大模型回答问题前，先从外部知识库**检索**相关内容，把检索结果作为上下文交给模型**生成**答案。

**解决的问题**：①模型训练数据有**截止时间**，不知道新知识；②**私有领域知识**（企业文档）不在训练语料里；③**幻觉**——无依据地编造；④微调成本高，RAG 只需更新知识库即可"热更新"知识。

**离线阶段（建库）**：
1. 文档加载（PDF/Word/网页）→ **切片 chunking**（按段落/语义切，带重叠窗口，常见 300~800 token）；
2. **向量化 embedding**（文本→高维向量）；
3. 存入**向量数据库**（Milvus、Chroma、pgvector 等）建索引。

**在线阶段（问答）**：
1. 用户问题同样向量化 → 在向量库中做**相似度检索**（常配混合检索：向量+关键词 BM25）→ 取 Top-K 片段；
2. **重排序 rerank** 精排，拼装 Prompt（问题+检索片段+指令）；
3. 大模型生成答案（可要求标注引用来源）。

**评估维度**：检索质量（召回率/命中率）、答案忠实度（是否基于检索内容）、相关性；常见优化点在切片策略、混合检索与 rerank、元数据过滤。"""),
dict(cat=194, title="什么是 AI Agent？它与大模型直接对话和 RAG 的区别是什么？",
     body="请说明 AI Agent 的核心组成（规划、记忆、工具、执行）与 ReAct 工作模式，并对比其与普通对话、RAG 的定位差异。",
     diff="中级", years="1-3年", tags=["AI Agent","大模型","工具调用"],
     pos=["AI Agent开发工程师","AI应用开发工程师","后端架构师"],
     answer="""**AI Agent（智能体）**：以大模型为"大脑"，能够**感知环境、自主规划、调用工具、执行多步任务**并根据反馈迭代的系统。

**四大核心组件**：
1. **规划 Planning**：任务拆解与反思——复杂目标拆成子步骤（CoT/任务分解），执行后自我检查纠错（ReAct 模式：Reason 思考→Act 行动→Observation 观察，循环直到完成）；
2. **记忆 Memory**：短期记忆（对话上下文窗口）+ 长期记忆（向量库存储历史，按需检索注入）；
3. **工具 Tools**：函数调用（Function Calling）/MCP 协议——查数据库、调 API、执行代码、搜索网页，突破"只会说话"的边界；
4. **执行 Action**：真正落地动作，并把结果反馈给模型形成闭环。

**三者定位对比**：
- **直接对话**：模型只会基于参数内知识回答，不能获取实时/私有信息，不能执行动作；
- **RAG**：加了"外挂知识库"，解决**知识**问题，但仍是"一问一答"；
- **Agent**：在 RAG 之上叠加**自主决策与行动**——不止回答"怎么做"，而是真的去做（查了 A 库、算了 B 报表、写了 C 邮件草稿）。RAG 常作为 Agent 的一个工具能力存在。

**工程挑战**：幻觉放大（一步错步步错）、多轮上下文管理、成本与延迟、结果评估（任务完成率）、安全（工具调用权限与沙箱）。"""),
]
