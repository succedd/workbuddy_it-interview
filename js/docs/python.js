/* =========================================================================
 *  js/docs/python.js — 技术教程「Python」方向数据
 *
 *  章节骨架参考：
 *    · Python 官方教程（docs.python.org/3/tutorial）与语言参考、标准库文档
 *    · Real Python / Fluent Python 的进阶主题划分
 *    · Python Packaging User Guide、uv 文档、FastAPI / Django 官方教程
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 *  ⚠ shell 里的变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const PYTHON = {
    id: "python",
    name: "Python",
    icon: "🐍",
    desc: "从语法和内置数据结构，到装饰器、生成器、面向对象、类型注解，再到 asyncio、GIL 与并发、Web 框架和性能优化。按 Python 官方教程与标准库文档的目录组织，兼顾面试高频点。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "掌握语法、内置数据结构、函数与模块，能独立写脚本和小工具。",
        chapters: [
          // <py-basic>
          {
            id: "py-syntax",
            title: "Python 基础语法：变量、类型、控制流与可变性",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Python 3.10+",
            tags: ["Python", "基础语法"],
            terms: ["Python", "可变", "深拷贝", "is 和 =="],
            body: `
> **官方文档基线**：[The Python Tutorial](https://docs.python.org/3/tutorial/) · [Built-in Types](https://docs.python.org/3/library/stdtypes.html) · [Data model](https://docs.python.org/3/reference/datamodel.html)

## 一、Python 的定位

Python 是**动态类型、解释执行、强类型**的语言：变量不用声明类型，但 ${C}"1" + 1${C} 会直接报错，不会偷偷转换。它语法接近伪代码，生态覆盖 Web 后端、数据分析、AI、运维脚本，是 AI 时代使用最广的语言之一。

${F}bash
python3 --version          # 建议 3.10 及以上
python3 -c "print('hello')"
${F}

## 二、变量是「名字贴在对象上」

Python 里一切皆对象，变量只是指向对象的标签。赋值不复制对象，只是多贴一个标签：

${F}python
a = [1, 2, 3]
b = a          # b 和 a 指向同一个列表
b.append(4)
print(a)       # [1, 2, 3, 4]
print(a is b)  # True：同一个对象
${F}

- ${C}==${C} 比较**值**是否相等；${C}is${C} 比较是否**同一个对象**。判断 None 用 ${C}is None${C}。
- 浅拷贝 ${C}copy.copy${C} 只复制外层，深拷贝 ${C}copy.deepcopy${C} 递归复制所有层。

## 三、内置类型与可变性

| 类型 | 示例 | 可变 | 可作字典键 |
| --- | --- | --- | --- |
| int / float / bool | 42、3.14、True | 否 | 是 |
| str | "abc" | 否 | 是 |
| tuple | (1, 2) | 否 | 元素都不可变时是 |
| list | [1, 2] | 是 | 否 |
| dict | {"k": 1} | 是 | 否 |
| set | {1, 2} | 是 | 否 |

int 没有溢出问题，能表示任意大的整数。浮点数遵循 IEEE 754，${C}0.1 + 0.2 == 0.3${C} 为 False，金额计算用 ${C}decimal.Decimal${C}。

## 四、控制流

${F}python
score = 85
if score >= 90:
    level = "A"
elif score >= 60:
    level = "B"
else:
    level = "C"

for i, name in enumerate(["张三", "李四"]):   # 同时拿下标和值
    print(i, name)

for k, v in {"a": 1, "b": 2}.items():
    print(k, v)

# 3.10+ 结构化模式匹配
match command.split():
    case ["go", direction]:
        move(direction)
    case ["quit"]:
        exit()
    case _:
        print("未知命令")
${F}

Python 用**缩进**表示代码块，统一使用 4 个空格。真假判断中，${C}0${C}、空字符串、空列表、空字典、None 都视为假。

## 五、字符串常用操作

${F}python
name, age = "Tom", 18
s = f"{name} 今年 {age} 岁"        # f-string，最推荐的格式化方式
",".join(["a", "b", "c"])          # 'a,b,c'，拼接大量字符串用 join
"a,b,c".split(",")                 # ['a', 'b', 'c']
"  hi  ".strip()                   # 'hi'
s[0:3]                             # 切片：左闭右开
s[::-1]                            # 反转
${F}

## ⚠ 踩坑

- **可变默认参数**：${C}def f(x=[])${C} 的列表只在定义时创建一次，多次调用会共享，应写成 ${C}x=None${C} 再在函数内创建。
- **循环里修改正在遍历的列表**：会跳过元素，应遍历副本或用推导式生成新列表。
- **用 is 比较数字或字符串**：小整数有缓存，结果看似正确，换个数就出错。

## ✅ 自检清单

- 能解释 ${C}is${C} 和 ${C}==${C} 的区别、浅拷贝与深拷贝的区别。
- 能说出哪些内置类型可变、哪些能作字典的键。
- 知道可变默认参数的问题和正确写法。

## 📚 延伸阅读

- 官方教程第 3～5 章：An Informal Introduction、Control Flow、Data Structures
- PEP 8：Python 代码风格指南
`
          },
          {
            id: "py-datastruct",
            title: "内置数据结构：list、dict、set、tuple 与推导式",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Python 3.10+",
            tags: ["Python", "数据结构", "字典"],
            terms: ["Python", "字典", "列表", "推导式", "collections"],
            body: `
> **官方文档基线**：[Tutorial · Data Structures](https://docs.python.org/3/tutorial/datastructures.html) · [collections](https://docs.python.org/3/library/collections.html) · [TimeComplexity（Python Wiki）](https://wiki.python.org/moin/TimeComplexity)

## 一、四种核心容器

| 容器 | 底层实现 | 特点 | 典型用途 |
| --- | --- | --- | --- |
| list | 动态数组 | 有序、可重复、可修改 | 一组同类数据 |
| tuple | 定长数组 | 有序、不可修改 | 函数返回多个值、字典键 |
| dict | 哈希表 | 键唯一，3.7 起保持插入顺序 | 按键查找、计数、配置 |
| set | 哈希表 | 无序、元素唯一 | 去重、判断是否存在 |

## 二、时间复杂度（面试高频）

| 操作 | list | dict / set |
| --- | --- | --- |
| 按下标或键读取 | O(1) | O(1) 平均 |
| 末尾追加 append | O(1) 均摊 | — |
| 头部插入 insert(0, x) | O(n) | — |
| 判断是否存在 in | O(n) | O(1) 平均 |
| 删除 | O(n) | O(1) 平均 |

所以「在大列表里反复用 in 判断」是常见的性能问题，先转成 set 再判断，速度能差上千倍。需要两端频繁增删时用 ${C}collections.deque${C}。

## 三、dict 为什么快

dict 对键调用 ${C}hash()${C} 得到哈希值，映射到数组槽位，冲突时用开放寻址探测下一个位置。因此**键必须可哈希**（不可变）。CPython 3.6 起采用「紧凑字典」：索引数组和按插入顺序存放的条目数组分开，既省内存又保持顺序。

## 四、推导式

${F}python
nums = [1, 2, 3, 4, 5]
squares = [x * x for x in nums]                 # 列表推导式
evens = [x for x in nums if x % 2 == 0]         # 带过滤
name_len = {n: len(n) for n in ["ab", "cde"]}   # 字典推导式
uniq = {x % 3 for x in nums}                    # 集合推导式
total = sum(x * x for x in nums)                # 生成器表达式，不建中间列表
${F}

推导式比等价的 for 循环更快也更易读，但嵌套超过两层就该改回普通循环。

## 五、collections 里的好用工具

${F}python
from collections import Counter, defaultdict, deque, namedtuple

Counter("abracadabra").most_common(2)    # [('a', 5), ('b', 2)]

groups = defaultdict(list)               # 键不存在时自动建空列表
for name, dept in [("张三", "研发"), ("李四", "研发")]:
    groups[dept].append(name)

q = deque(maxlen=3)                      # 固定长度队列，满了自动丢最旧的
Point = namedtuple("Point", "x y")       # 轻量只读记录
${F}

排序用 ${C}sorted(items, key=lambda x: x["age"], reverse=True)${C}，Python 的排序是稳定的 Timsort。需要取最大或最小的前 K 个用 ${C}heapq.nlargest${C}。

## ⚠ 踩坑

- **${C}[[0] * 3] * 3${C} 建二维表**：三行是同一个列表，改一行全变。应写 ${C}[[0] * 3 for _ in range(3)]${C}。
- **遍历字典时增删键**：直接抛 RuntimeError。
- **用 list 做队列 pop(0)**：每次 O(n)，换 deque.popleft()。

## ✅ 自检清单

- 能说出 list 和 dict 主要操作的时间复杂度。
- 能解释 dict 为什么要求键可哈希。
- 会用 Counter、defaultdict、deque 简化代码。

## 📚 延伸阅读

- 《Fluent Python》第 2～3 章：序列、字典与集合
- Raymond Hettinger 演讲：Modern Python Dictionaries
`
          },
          {
            id: "py-func-module",
            title: "函数、模块与包管理：参数、作用域、venv、pip 与 uv",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Python 3.10+ / pip / uv",
            tags: ["Python", "函数", "虚拟环境"],
            terms: ["Python", "*args", "闭包", "虚拟环境", "pip"],
            body: `
> **官方文档基线**：[Tutorial · Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions) · [Tutorial · Modules](https://docs.python.org/3/tutorial/modules.html) · [Python Packaging User Guide](https://packaging.python.org/) · [uv Docs](https://docs.astral.sh/uv/)

## 一、参数的五种写法

${F}python
def f(a, b=2, *args, c, d=4, **kwargs):
    print(a, b, args, c, d, kwargs)

f(1, 3, 5, 6, c=7, e=8)
# 1 3 (5, 6) 7 4 {'e': 8}
${F}

| 写法 | 含义 |
| --- | --- |
| a | 位置参数 |
| b=2 | 默认参数 |
| *args | 收集多余的位置参数成元组 |
| c（在 *args 之后） | 只能用关键字传入 |
| **kwargs | 收集多余的关键字参数成字典 |

参数传递是**传对象引用**：函数内修改可变对象会影响外部，重新赋值则不会。

## 二、作用域与闭包（LEGB）

查找变量的顺序：**L**ocal → **E**nclosing（外层函数）→ **G**lobal → **B**uilt-in。

${F}python
def counter():
    n = 0
    def inc():
        nonlocal n      # 修改外层变量要声明 nonlocal
        n += 1
        return n
    return inc

c = counter()
c(); c()               # 2，n 被闭包保存下来
${F}

## 三、模块与包

- 一个 .py 文件就是一个**模块**；含 ${C}__init__.py${C} 的目录是**包**。
- ${C}import${C} 时模块代码只执行一次，结果缓存在 ${C}sys.modules${C}。
- ${C}if __name__ == "__main__":${C} 下的代码只在直接运行时执行，被导入时不执行。
- 循环导入会报 ImportError，通常靠拆分模块或把导入挪进函数内解决。

## 四、虚拟环境：每个项目一套依赖

不同项目可能依赖同一个库的不同版本，装进系统 Python 会互相冲突。

${F}bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install requests
pip freeze > requirements.txt
${F}

## 五、uv：新一代包管理工具

uv 由 Astral 用 Rust 编写，比 pip 快 10～100 倍，集成了 Python 版本管理、虚拟环境和锁文件，正在成为新项目的默认选择：

${F}bash
uv init myapp && cd myapp      # 生成 pyproject.toml
uv add fastapi                 # 安装并写入依赖和 uv.lock
uv run main.py                 # 自动使用项目虚拟环境
uv python install 3.12         # 安装指定 Python 版本
${F}

现代项目统一使用 **pyproject.toml** 描述项目信息和依赖，取代 setup.py 和零散的 requirements.txt。

## ⚠ 踩坑

- **用 sudo pip 装到系统**：可能破坏系统工具，新版 Linux 发行版会直接拒绝（PEP 668）。
- **文件名和标准库重名**：自己建了 random.py，导入 random 时拿到的是自己的文件。
- **不锁版本**：上线环境装到新版本库导致行为变化，要提交锁文件。

## ✅ 自检清单

- 能说清 *args、**kwargs 和仅关键字参数。
- 能解释 LEGB 和 nonlocal 的作用。
- 能用 venv 或 uv 为项目建立独立环境并锁定依赖。

## 📚 延伸阅读

- PEP 621：在 pyproject.toml 中声明项目元数据
- uv 文档：Working on projects
`
          },
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "理解装饰器、生成器、面向对象和类型注解，能写结构清晰的工程代码。",
        chapters: [
          // <py-mid>
          {
            id: "py-decorator-gen",
            title: "装饰器、生成器、迭代器与上下文管理器",
            minutes: 18,
            updated: "2026-11-20",
            applies: "Python 3.10+",
            tags: ["Python", "装饰器", "生成器"],
            terms: ["装饰器", "生成器", "yield", "迭代器", "with"],
            body: `
> **官方文档基线**：[Glossary · decorator](https://docs.python.org/3/glossary.html#term-decorator) · [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html) · [contextlib](https://docs.python.org/3/library/contextlib.html)

## 一、装饰器：给函数「包一层」

函数在 Python 里是普通对象，可以当参数传、当返回值。装饰器就是**接收一个函数、返回一个新函数**的函数，用来在不改原函数代码的前提下加功能：计时、日志、缓存、权限校验、重试。

${F}python
import functools, time

def timer(func):
    @functools.wraps(func)            # 保留原函数的名字和文档
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.perf_counter() - start:.3f}s")
        return result
    return wrapper

@timer                                 # 等价于 work = timer(work)
def work():
    time.sleep(0.5)
${F}

**带参数的装饰器**要再套一层：

${F}python
def retry(times=3):
    def deco(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if i == times - 1:
                        raise
        return wrapper
    return deco

@retry(times=5)
def call_api(): ...
${F}

标准库自带的常用装饰器：${C}@functools.lru_cache${C}（结果缓存）、${C}@property${C}、${C}@staticmethod${C}、${C}@classmethod${C}、${C}@dataclass${C}。

## 二、迭代器与生成器

- **可迭代对象**：能用 for 遍历的东西，实现了 ${C}__iter__${C}。
- **迭代器**：实现了 ${C}__next__${C}，每次返回一个值，没有了就抛 StopIteration。
- **生成器**：用 ${C}yield${C} 写的函数，自动成为迭代器，**用到哪算到哪**。

${F}python
def read_big_file(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if "ERROR" in line:
                yield line.strip()     # 每次只返回一行，内存占用极小

for err in read_big_file("app.log"):
    print(err)
${F}

处理 10GB 日志时，用列表一次读入会撑爆内存，生成器则只占几 KB。生成器表达式 ${C}(x * 2 for x in data)${C} 同理。${C}yield from${C} 可以把另一个生成器的值逐个转发出去。

## 三、上下文管理器：with 语句

with 保证资源**无论是否出异常都会释放**，背后是 ${C}__enter__${C} 和 ${C}__exit__${C} 两个方法。用 contextlib 写起来最简单：

${F}python
from contextlib import contextmanager

@contextmanager
def db_transaction(conn):
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

with db_transaction(conn) as c:
    c.execute("UPDATE ...")
${F}

## ⚠ 踩坑

- **装饰器忘了 functools.wraps**：被装饰函数的 ${C}__name__${C} 变成 wrapper，日志和框架路由都会出错。
- **生成器只能遍历一次**：第二次 for 什么也拿不到，需要的话重新调用函数。
- **lru_cache 缓存可变参数**：参数必须可哈希，传列表会报错。

## ✅ 自检清单

- 能手写计时装饰器和带参数的重试装饰器。
- 能说清可迭代对象、迭代器、生成器的关系。
- 能用 contextmanager 写一个资源管理器。

## 📚 延伸阅读

- PEP 318（装饰器）、PEP 255（生成器）、PEP 343（with 语句）
- 《Fluent Python》第 9 章：装饰器与闭包
`
          },
          {
            id: "py-oop",
            title: "面向对象：类、继承、MRO、魔术方法与 dataclass",
            minutes: 17,
            updated: "2026-11-20",
            applies: "Python 3.10+",
            tags: ["Python", "面向对象", "魔术方法"],
            terms: ["Python", "面向对象", "MRO", "魔术方法", "dataclass"],
            body: `
> **官方文档基线**：[Tutorial · Classes](https://docs.python.org/3/tutorial/classes.html) · [Data model · Special method names](https://docs.python.org/3/reference/datamodel.html#special-method-names) · [dataclasses](https://docs.python.org/3/library/dataclasses.html)

## 一、类的基本写法

${F}python
class Account:
    bank = "示例银行"                 # 类属性：所有实例共享

    def __init__(self, owner, balance=0):
        self.owner = owner           # 实例属性：每个对象一份
        self._balance = balance      # 单下划线：约定为内部使用

    @property
    def balance(self):               # 像属性一样读取，可加校验
        return self._balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("金额必须为正")
        self._balance += amount

    @classmethod
    def from_dict(cls, d):           # 备用构造器
        return cls(d["owner"], d.get("balance", 0))

    @staticmethod
    def is_valid_owner(name):        # 与实例无关的工具函数
        return bool(name)
${F}

Python 没有真正的 private。双下划线 ${C}__x${C} 只会触发名称改写（变成 ${C}_Account__x${C}），用于避免子类意外覆盖。

## 二、继承与 MRO

Python 支持多继承，方法查找顺序由 **MRO（方法解析顺序）** 决定，算法是 C3 线性化，可以用 ${C}类名.__mro__${C} 查看。${C}super()${C} 调用的是 MRO 中的**下一个类**，不一定是直接父类：

${F}python
class A:
    def hi(self): print("A")
class B(A):
    def hi(self): print("B"); super().hi()
class C(A):
    def hi(self): print("C"); super().hi()
class D(B, C):
    pass

D().hi()        # B C A
print(D.__mro__)  # D -> B -> C -> A -> object
${F}

实际工程中更推荐**组合优于继承**，多继承主要用于 Mixin（只提供方法、不保存状态的小类）。

## 三、魔术方法：让对象支持内置语法

| 方法 | 触发方式 |
| --- | --- |
| ${C}__init__${C} / ${C}__new__${C} | 创建对象（new 先创建，init 再初始化） |
| ${C}__repr__${C} / ${C}__str__${C} | repr(obj) / print(obj) |
| ${C}__eq__${C} / ${C}__hash__${C} | == 比较 / 放进 set 和 dict |
| ${C}__len__${C} / ${C}__getitem__${C} | len(obj) / obj[i] |
| ${C}__call__${C} | obj() 像函数一样调用 |
| ${C}__enter__${C} / ${C}__exit__${C} | with 语句 |

这种「实现某些方法就能被当作某种东西使用」的风格叫**鸭子类型**：像鸭子一样叫，就当它是鸭子。

## 四、dataclass：少写样板代码

${F}python
from dataclasses import dataclass, field

@dataclass(frozen=True, slots=True)
class User:
    id: int
    name: str
    tags: list[str] = field(default_factory=list)

u = User(1, "Tom")
print(u)            # User(id=1, name='Tom', tags=[])
${F}

自动生成 ${C}__init__${C}、${C}__repr__${C}、${C}__eq__${C}；frozen=True 让对象不可修改并可哈希；slots=True 节省内存。需要数据校验时用 Pydantic 的 BaseModel。

## ⚠ 踩坑

- **把可变对象当类属性**：所有实例共用同一个列表。
- **重写 ${C}__eq__${C} 不管 ${C}__hash__${C}**：对象会变得不可哈希，放不进 set。
- **在 ${C}__init__${C} 里做耗时操作**：网络请求、读大文件应放到单独方法或工厂函数里。

## ✅ 自检清单

- 能区分实例方法、classmethod、staticmethod 和 property。
- 能写出菱形继承的 MRO 顺序，并解释 super() 的行为。
- 能用 dataclass 定义数据类。

## 📚 延伸阅读

- 《Fluent Python》第 1 章：Python 数据模型
- Raymond Hettinger：Python's super() considered super!
`
          },
          {
            id: "py-exception-typing",
            title: "异常处理、类型注解与代码质量工具",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Python 3.10+ / mypy / Ruff / pytest",
            tags: ["Python", "异常", "类型注解"],
            terms: ["Python", "异常", "类型注解", "pytest", "typing"],
            body: `
> **官方文档基线**：[Tutorial · Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) · [typing](https://docs.python.org/3/library/typing.html) · [pytest Docs](https://docs.pytest.org/)

## 一、异常处理的完整结构

${F}python
try:
    data = load_config("app.yaml")
except FileNotFoundError:
    data = DEFAULT_CONFIG              # 只捕获预期内的具体异常
except (ValueError, KeyError) as e:
    raise ConfigError("配置格式错误") from e   # 保留原始异常链
else:
    print("没有异常时执行")
finally:
    print("无论如何都执行，常用于释放资源")
${F}

**原则**：只捕获你知道怎么处理的异常；处理不了就让它往上抛；不要用空的 ${C}except:${C} 吞掉一切，它连 Ctrl+C 都会拦住。

## 二、自定义异常

${F}python
class AppError(Exception):
    """项目所有业务异常的基类"""

class OrderNotFound(AppError):
    def __init__(self, order_id):
        super().__init__(f"订单不存在: {order_id}")
        self.order_id = order_id
${F}

有了统一基类，Web 框架可以在一个地方把 AppError 转成友好的错误响应。

## 三、类型注解

类型注解**不影响运行**，但能让 IDE 补全、让 mypy / pyright 在运行前发现错误，大型项目基本必备。

${F}python
from typing import Optional, Protocol, TypedDict

def find_user(uid: int) -> dict[str, str] | None:   # 3.10+ 用 | 表示联合类型
    ...

class Greeter(Protocol):          # 结构化类型：有 greet 方法就符合
    def greet(self, name: str) -> str: ...

class UserDict(TypedDict):
    id: int
    name: str
${F}

| 写法 | 含义 |
| --- | --- |
| list[int] | 整数列表 |
| dict[str, int] | 键为字符串、值为整数 |
| Optional[X] | 可能为 None，3.10+ 等价写法见上方示例 |
| Callable[[int], str] | 接收 int 返回 str 的函数 |
| TypeVar / 泛型 | 输入输出类型一致的通用函数 |

FastAPI 和 Pydantic 会读取类型注解来做请求校验和生成接口文档，注解在这里直接产生运行时价值。

## 四、质量工具链

${F}bash
uv add --dev ruff mypy pytest
ruff check . --fix      # 代码检查，替代 flake8、isort 等
ruff format .           # 格式化，兼容 black 风格
mypy src/               # 静态类型检查
pytest -q               # 运行测试
${F}

${F}python
# test_calc.py：pytest 只需要普通 assert
import pytest
from calc import div

def test_div():
    assert div(6, 3) == 2

def test_div_zero():
    with pytest.raises(ZeroDivisionError):
        div(1, 0)
${F}

## ⚠ 踩坑

- **捕获异常后只 print**：调用方以为成功了，问题被掩盖。至少要记录日志并决定是否重新抛出。
- **在 finally 里 return**：会吞掉正在抛出的异常。
- **以为注解会校验类型**：传错类型照样运行，需要 mypy 或 Pydantic。

## ✅ 自检清单

- 能写出 try / except / else / finally 并说清执行顺序。
- 能用 raise ... from e 保留异常链。
- 能给函数写类型注解，并用 ruff、mypy、pytest 检查项目。

## 📚 延伸阅读

- PEP 484（类型提示）、PEP 604（X | Y 联合类型）
- mypy 文档：Type hints cheat sheet
`
          },
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "掌握异步、并发模型、Web 服务与性能调优，理解解释器的内部机制。",
        chapters: [
          // <py-adv>
          {
            id: "py-asyncio",
            title: "asyncio 异步编程：事件循环、协程与 await",
            minutes: 18,
            updated: "2026-11-20",
            applies: "Python 3.11+",
            tags: ["Python", "asyncio", "协程"],
            terms: ["asyncio", "协程", "async", "await", "事件循环"],
            body: `
> **官方文档基线**：[asyncio](https://docs.python.org/3/library/asyncio.html) · [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html) · [Developing with asyncio](https://docs.python.org/3/library/asyncio-dev.html)

## 一、异步解决什么问题

Web 服务大部分时间在**等**：等数据库、等 HTTP 接口、等 Redis。同步代码等待时整个线程闲着；asyncio 让单线程在等待一个请求时去处理别的请求，适合**高并发 I/O 密集**场景，单进程就能维持上万个连接。

![asyncio 事件循环](/assets/diagrams/docs/py-asyncio.svg)

## 二、三个核心概念

- **协程**：用 ${C}async def${C} 定义的函数，调用后不会立即执行，只返回一个协程对象。
- **await**：在这里暂停，把控制权交还事件循环，等结果就绪再从这里继续。
- **事件循环**：调度中心，不断检查哪些协程可以继续执行。

${F}python
import asyncio, time

async def fetch(n):
    await asyncio.sleep(1)          # 模拟 1 秒的网络请求
    return n * 10

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(*(fetch(i) for i in range(100)))
    print(len(results), f"{time.perf_counter() - start:.1f}s")   # 100 1.0s

asyncio.run(main())
${F}

100 个各需 1 秒的请求，顺序执行要 100 秒，并发执行只要 1 秒。

## 三、并发控制

${F}python
async def main(urls):
    sem = asyncio.Semaphore(20)            # 最多同时 20 个请求
    async with httpx.AsyncClient(timeout=10) as client:
        async def one(url):
            async with sem:
                r = await client.get(url)
                return r.status_code

        async with asyncio.TaskGroup() as tg:  # 3.11+，任一失败会取消其余
            tasks = [tg.create_task(one(u)) for u in urls]
    return [t.result() for t in tasks]
${F}

| 工具 | 用途 |
| --- | --- |
| asyncio.gather | 并发运行并收集结果 |
| asyncio.TaskGroup | 结构化并发，异常处理更清晰 |
| asyncio.wait_for / timeout | 超时控制 |
| asyncio.Semaphore | 限制并发数，避免压垮下游 |
| asyncio.Queue | 生产者-消费者 |
| asyncio.to_thread | 把阻塞函数放到线程里跑 |

## 四、和线程、进程怎么选

| 场景 | 方案 |
| --- | --- |
| 大量网络 I/O，有异步库可用 | asyncio |
| I/O 密集，但只有同步库 | 线程池 ThreadPoolExecutor |
| CPU 密集（计算、图像处理） | 多进程 ProcessPoolExecutor |

## ⚠ 踩坑

- **在协程里调用阻塞函数**：${C}time.sleep${C}、${C}requests.get${C}、同步数据库驱动会卡住整个事件循环，所有请求一起变慢。换成 asyncio.sleep、httpx、asyncpg，或用 to_thread 包装。
- **忘了 await**：协程根本没执行，只得到一条 never awaited 警告。
- **create_task 后不保存引用**：任务可能被垃圾回收，要保存或用 TaskGroup。
- **无限制并发**：一次发出几万个请求，被对方限流或耗尽连接数。

## ✅ 自检清单

- 能解释协程、await、事件循环的关系。
- 能用 gather 或 TaskGroup 并发执行，并用 Semaphore 限流。
- 能判断一个任务该用 asyncio、线程还是进程。

## 📚 延伸阅读

- PEP 492：async 与 await 语法
- 官方文档：Developing with asyncio（调试模式与常见错误）
`
          },
          {
            id: "py-gil-concurrency",
            title: "GIL 与并发：线程、进程、自由线程版 Python",
            minutes: 16,
            updated: "2026-11-20",
            applies: "CPython 3.10～3.13",
            tags: ["Python", "GIL", "多线程"],
            terms: ["GIL", "多线程", "多进程", "Python", "concurrent"],
            body: `
> **官方文档基线**：[Glossary · GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock) · [concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html) · [PEP 703 · Making the GIL Optional](https://peps.python.org/pep-0703/)

## 一、GIL 是什么

GIL（全局解释器锁）是 CPython 解释器里的一把互斥锁：**同一时刻只有一个线程能执行 Python 字节码**。它让 CPython 的内存管理（引用计数）实现简单、单线程性能好，代价是多线程无法利用多核做计算。

![GIL 与线程调度](/assets/diagrams/docs/py-gil.svg)

## 二、GIL 什么时候释放

- **I/O 操作时**：读文件、网络请求、sleep 期间会释放 GIL，其他线程可以运行。所以**多线程对 I/O 密集任务依然有效**。
- **定时切换**：持有 GIL 的线程运行约 5 毫秒（${C}sys.getswitchinterval()${C}）后被要求让出。
- **C 扩展主动释放**：NumPy、Pandas 的很多底层计算会释放 GIL，因此能并行。

## 三、实测对比

${F}python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def cpu_task(n):
    return sum(i * i for i in range(n))

for Pool in (ThreadPoolExecutor, ProcessPoolExecutor):
    start = time.perf_counter()
    with Pool(max_workers=4) as ex:
        list(ex.map(cpu_task, [10_000_000] * 4))
    print(Pool.__name__, f"{time.perf_counter() - start:.1f}s")

# 4 核机器上的典型结果：
# ThreadPoolExecutor  约 3.2s（和单线程差不多）
# ProcessPoolExecutor 约 0.9s（接近 4 倍加速）
${F}

多进程能绕开 GIL，因为每个进程有自己的解释器和 GIL。代价是进程启动更慢、内存更多，进程间传数据要序列化。

## 四、选择指南

| 任务类型 | 推荐 | 原因 |
| --- | --- | --- |
| 网络请求、数据库查询 | asyncio 或线程池 | 等待时 GIL 已释放 |
| 纯 Python 计算 | 进程池 | 绕开 GIL 用满多核 |
| 数值计算 | NumPy 向量化 | 底层 C 代码释放 GIL 且更快 |
| 极致性能热点 | Cython / Rust（PyO3）扩展 | 编译成机器码 |

## 五、GIL 有了线程还要加锁吗

要。GIL 只保证字节码一条条执行，**不保证你的业务操作是原子的**。${C}count += 1${C} 会拆成读取、相加、写回多条字节码，中间可能被切换：

${F}python
import threading
lock = threading.Lock()

def add():
    global count
    for _ in range(100_000):
        with lock:              # 不加锁，多线程结果会小于预期
            count += 1
${F}

## 六、未来：自由线程 Python

PEP 703 已被接受。Python 3.13 起提供实验性的**无 GIL 构建**（python3.13t），3.14 进入官方支持阶段。它让多线程真正并行，但部分 C 扩展需要适配、单线程性能略有下降，生产使用前要验证依赖兼容性。

## ⚠ 误区

- **「Python 多线程没用」**：对 I/O 密集任务很有用，只是对 CPU 密集任务无效。
- **「GIL 是 Python 语言的特性」**：它是 CPython 实现的特性，Jython 等实现没有 GIL。
- **多进程传大对象**：每次都要序列化复制，可能比计算本身还慢，考虑共享内存。

## ✅ 自检清单

- 能解释 GIL 的作用、什么时候释放。
- 能根据任务类型选择线程、进程或 asyncio。
- 能说明为什么有 GIL 仍然需要加锁。

## 📚 延伸阅读

- David Beazley 演讲：Understanding the Python GIL
- Python 3.13 新特性：Free-threaded CPython
`
          },
          {
            id: "py-web",
            title: "Web 开发：FastAPI 与 Django 实战入门",
            minutes: 18,
            updated: "2026-11-20",
            applies: "FastAPI 0.110+ / Django 5.x",
            tags: ["Python", "FastAPI", "Django"],
            terms: ["FastAPI", "Django", "Flask", "Python", "ORM"],
            body: `
> **官方文档基线**：[FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/) · [Django Documentation](https://docs.djangoproject.com/) · [Pydantic Docs](https://docs.pydantic.dev/)

## 一、三大框架怎么选

| 框架 | 定位 | 适合 |
| --- | --- | --- |
| FastAPI | 异步、基于类型注解、自动生成接口文档 | API 服务、AI 应用后端、微服务 |
| Django | 大而全：ORM、后台管理、认证、迁移全内置 | 内容站、管理系统、需要快速交付的完整业务 |
| Flask | 极简核心，按需加插件 | 小工具、学习、高度定制 |

## 二、FastAPI：十几行写一个 API

${F}python
# pip install "fastapi[standard]"
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class ItemIn(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)

DB: dict[int, ItemIn] = {}

@app.post("/items/{item_id}")
async def create_item(item_id: int, item: ItemIn):
    DB[item_id] = item
    return {"id": item_id, **item.model_dump()}

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    if item_id not in DB:
        raise HTTPException(status_code=404, detail="不存在")
    return DB[item_id]
${F}

${F}bash
fastapi dev main.py      # 打开 http://127.0.0.1:8000/docs 即可在线调试
${F}

类型注解同时完成三件事：**参数解析、数据校验、接口文档**。传 price=-1 会自动返回 422 和清晰的错误说明。

**依赖注入**是 FastAPI 的另一核心，用来复用数据库连接、获取当前用户：

${F}python
from fastapi import Depends

async def get_current_user(token: str = Depends(oauth2_scheme)):
    return decode_token(token)

@app.get("/me")
async def me(user = Depends(get_current_user)):
    return user
${F}

## 三、Django：约定优于配置

${F}bash
django-admin startproject mysite
python manage.py startapp blog
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser     # 自带后台 /admin
${F}

${F}python
# blog/models.py
from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    created = models.DateTimeField(auto_now_add=True)

# ORM 查询
Post.objects.filter(title__contains="Python").order_by("-created")[:10]
${F}

Django 的请求流程：URL 路由 → 中间件 → 视图 → 模型（ORM）→ 模板或 JSON。做 REST API 时通常配合 Django REST Framework。

## 四、上线部署

- FastAPI：${C}uvicorn${C} 或 ${C}gunicorn -k uvicorn.workers.UvicornWorker${C}，进程数约为 CPU 核数。
- Django：${C}gunicorn mysite.wsgi${C}，静态文件交给 Nginx 或 CDN。
- 前面放 Nginx 处理 HTTPS、限流和静态资源，用 Docker 打包。

## ⚠ 踩坑

- **async 路由里用同步数据库驱动**：阻塞事件循环。用异步驱动，或把路由写成普通 def（FastAPI 会放进线程池执行）。
- **Django ORM 的 N+1 查询**：循环里访问外键会每次查一次库，用 select_related 或 prefetch_related。
- **生产环境开着 DEBUG**：会泄露配置和代码。

## ✅ 自检清单

- 能根据项目需求在 FastAPI、Django、Flask 之间做选择。
- 能用 FastAPI 写出带校验和依赖注入的接口。
- 能解释 N+1 查询问题及解决方法。

## 📚 延伸阅读

- FastAPI 文档：Concurrency and async / await
- Django 文档：Database access optimization
`
          },
          {
            id: "py-performance",
            title: "性能与内存：性能分析、垃圾回收与优化手段",
            minutes: 15,
            updated: "2026-11-20",
            applies: "CPython 3.11+",
            tags: ["Python", "性能优化", "垃圾回收"],
            terms: ["Python", "垃圾回收", "引用计数", "性能", "内存"],
            body: `
> **官方文档基线**：[The Python Profilers](https://docs.python.org/3/library/profile.html) · [gc](https://docs.python.org/3/library/gc.html) · [tracemalloc](https://docs.python.org/3/library/tracemalloc.html)

## 一、先测量，再优化

凭感觉优化往往改错地方。正确顺序：**找到最慢的那 10% 代码 → 优化 → 再测量**。

${F}bash
python -m cProfile -s cumtime app.py | head -30   # 函数级耗时排行
pip install py-spy
py-spy top --pid 12345                           # 不改代码，直接看线上进程
py-spy record -o flame.svg --pid 12345           # 生成火焰图
${F}

小段代码对比用 ${C}timeit${C}：

${F}bash
python -m timeit "'-'.join(str(i) for i in range(1000))"
${F}

## 二、内存管理：引用计数 + 分代回收

- **引用计数**：每个对象记录被引用的次数，降到 0 立即释放。大部分对象靠它回收，及时且可预测。
- **分代垃圾回收**：引用计数解决不了**循环引用**（A 引用 B，B 引用 A）。gc 模块定期扫描容器对象，把对象分为三代，新对象扫得勤，存活久的扫得少。

${F}python
import sys, gc
a = []
print(sys.getrefcount(a))     # 2（a 本身 + 传参的临时引用）
gc.collect()                  # 手动触发一次完整回收，返回回收数量
${F}

## 三、排查内存泄漏

${F}python
import tracemalloc
tracemalloc.start()
# ... 运行一段业务 ...
snapshot = tracemalloc.take_snapshot()
for stat in snapshot.statistics("lineno")[:10]:
    print(stat)               # 哪一行代码分配了最多内存
${F}

常见泄漏来源：不断增长的全局缓存或字典、未取消的回调、循环引用里带 ${C}__del__${C} 的对象。

## 四、常用优化手段

| 手段 | 效果 |
| --- | --- |
| 用 set / dict 替代 list 做查找 | O(n) 降到 O(1) |
| 用内置函数和推导式 | sum、map、sorted 在 C 层执行，比手写循环快 |
| 生成器替代大列表 | 内存从 GB 级降到 KB 级 |
| functools.lru_cache | 重复计算直接返回 |
| ${C}__slots__${C} 或 dataclass(slots=True) | 大量小对象节省 40% 以上内存 |
| NumPy / Pandas 向量化 | 数值计算快 10～100 倍 |
| 升级 Python 版本 | 3.11 相比 3.10 平均快约 25% |
| 热点改用 Cython、Rust 扩展 | 计算密集代码快数十倍 |

${F}python
# 慢：循环里反复拼接字符串
s = ""
for w in words:
    s += w
# 快：一次 join
s = "".join(words)
${F}

## ⚠ 踩坑

- **过早优化**：先让代码正确清晰，有性能数据后再动。
- **把全局变量放在热循环里频繁读取**：局部变量访问更快，热点函数内可以先赋值给局部变量。
- **在 Pandas 里逐行 iterrows**：比向量化慢上百倍。

## ✅ 自检清单

- 能用 cProfile 或 py-spy 找到热点函数。
- 能解释引用计数和分代回收各解决什么问题。
- 能用 tracemalloc 定位内存增长的代码行。

## 📚 延伸阅读

- 官方文档：What's New in Python 3.11（Faster CPython）
- 《High Performance Python》（Gorelick & Ozsvald）
`
          },
        ]
      }
    ]
  };

  window.PYTHON = PYTHON;
})();
