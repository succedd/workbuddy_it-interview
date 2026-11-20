/* =========================================================================
 *  js/docs/golang.js — 技术教程「Go」方向数据
 *
 *  章节骨架参考：
 *    · A Tour of Go、Effective Go、The Go Memory Model、Go Blog
 *    · go.dev/doc（Modules / Testing / Diagnostics / GC Guide）
 *    · 《Go 语言设计与实现》的运行时章节划分；Gin、gRPC-Go 官方文档
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 *  ⚠ shell 里的变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const GOLANG = {
    id: "golang",
    name: "Go",
    icon: "🐹",
    desc: "云原生时代的后端主力语言：从语法、切片与 map、结构体与接口、错误处理，到 goroutine、channel、context，再到 GMP 调度、GC 与内存、工程化和微服务。按 A Tour of Go、Effective Go 与 go.dev 官方文档组织。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "掌握基础语法、内置类型、结构体、接口与错误处理，能写出地道的 Go 代码。",
        chapters: [
          // <go-basic>
          {
            id: "go-basics",
            title: "Go 入门：语法、类型、函数与包",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "基础语法"],
            terms: ["Go ", "Golang", "零值", "defer"],
            body: `
> **官方文档基线**：[A Tour of Go](https://go.dev/tour/) · [Effective Go](https://go.dev/doc/effective_go) · [The Go Programming Language Specification](https://go.dev/ref/spec)

## 一、为什么是 Go

Go 由 Google 在 2009 年发布，设计目标是**简单、编译快、天然支持并发**。Docker、Kubernetes、etcd、Prometheus 等云原生核心项目都用 Go 编写，它也是国内大厂后端和中间件的主力语言之一。编译产物是单个静态二进制文件，部署只需拷贝一个文件。

${F}bash
go version                  # 建议 1.22+
mkdir hello && cd hello
go mod init example.com/hello
go run .
${F}

${F}go
package main

import "fmt"

func main() {
    fmt.Println("hello, 世界")
}
${F}

## 二、变量与零值

${F}go
var a int            // 声明不赋值，得到零值 0
var s string         // 零值 ""
b := 3.14            // 短变量声明，类型自动推断，只能在函数内用
const Pi = 3.14159

x, y := 1, 2
x, y = y, x          // 交换
${F}

Go 没有未初始化的变量，每种类型都有**零值**：数值为 0、bool 为 false、string 为空串、指针/切片/map/channel/函数/接口为 nil。好的 Go 代码会让零值直接可用，例如 ${C}sync.Mutex${C} 和 ${C}bytes.Buffer${C} 声明后就能用。

## 三、基本类型

| 类型 | 说明 |
| --- | --- |
| int、int64、uint8（byte） | 整数，int 在 64 位机器上是 64 位 |
| float64 | 浮点数 |
| string | 不可变的 UTF-8 字节序列 |
| rune | 一个 Unicode 码点（int32） |
| bool | true / false |

Go **没有隐式类型转换**，int 和 int64 相加也要显式转换：${C}int64(a) + b${C}。

${F}go
s := "Go语言"
fmt.Println(len(s))              // 8：按字节计数，中文 UTF-8 占 3 字节
for i, r := range s {            // range 字符串按 rune 遍历
    fmt.Println(i, string(r))
}
${F}

## 四、控制流

Go 只有 for 一种循环，if 和 switch 可以带初始化语句：

${F}go
for i := 0; i < 3; i++ { }
for cond { }                     // 相当于 while
for { break }                    // 死循环

if v, err := strconv.Atoi("42"); err == nil {
    fmt.Println(v)
}

switch day {                     // 不需要 break，默认不贯穿
case "Sat", "Sun":
    fmt.Println("周末")
default:
    fmt.Println("工作日")
}
${F}

## 五、函数与包

${F}go
func divide(a, b float64) (float64, error) {   // 多返回值
    if b == 0 {
        return 0, errors.New("除数不能为 0")
    }
    return a / b, nil
}

add := func(x, y int) int { return x + y }     // 匿名函数 / 闭包
${F}

- 一个目录就是一个包，同包文件可以互相访问。
- **首字母大写**的标识符才能被其他包访问（导出），小写为包内私有。
- 导入了不用、声明了变量不用，都会**编译报错**。
- ${C}gofmt${C} 统一代码格式，团队不需要争论代码风格。

## ⚠ 踩坑

- **用 len 取中文字符数**：要用 ${C}utf8.RuneCountInString${C}。
- **:= 在内层作用域意外创建新变量**：以为改了外层的 err，实际是新变量（变量遮蔽）。
- **忽略多返回值里的 err**：Go 不会强制处理，要靠规范和 lint 工具。

## ✅ 自检清单

- 能说出各类型的零值。
- 知道导出规则和「未使用即报错」规则。
- 能写出返回 (结果, error) 的函数。

## 📚 延伸阅读

- A Tour of Go：Basics 章节
- Go Blog：Strings, bytes, runes and characters in Go
`
          },
          {
            id: "go-slice-map",
            title: "切片与 map：底层结构、扩容与常见陷阱",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "slice", "map"],
            terms: ["切片", "slice", "map", "扩容"],
            body: `
> **官方文档基线**：[Go Slices: usage and internals](https://go.dev/blog/slices-intro) · [Go maps in action](https://go.dev/blog/maps) · [Effective Go: Slices](https://go.dev/doc/effective_go#slices)

## 一、数组与切片的区别

数组长度是类型的一部分，${C}[3]int${C} 和 ${C}[4]int${C} 是两种类型，赋值和传参都会**整体拷贝**。日常代码几乎都用切片。切片本身是一个只有三个字段的小结构体，叫**切片头**：

| 字段 | 含义 |
| --- | --- |
| ptr | 指向底层数组某个位置的指针 |
| len | 当前可访问的元素个数 |
| cap | 从 ptr 开始到底层数组末尾的容量 |

${F}go
arr := [5]int{1, 2, 3, 4, 5}
s := arr[1:3]           // [2 3], len=2, cap=4
s[0] = 100              // arr 也变成 [1 100 3 4 5]，二者共享底层数组
fmt.Println(len(s), cap(s))
${F}

切片传参只拷贝切片头（24 字节），**底层数组是共享的**，所以函数里修改元素，调用方能看到；但函数里 append 导致扩容后，调用方看不到新元素。

## 二、append 与扩容规则

${C}append${C} 在容量够时直接写入底层数组；容量不够时分配新数组、拷贝旧数据。Go 1.18 起的增长策略大致是：

- 容量小于 256 时，新容量翻倍。
- 超过 256 后，增长系数从 2 平滑过渡到约 1.25。
- 最后按内存分配器的 size class 向上取整，所以实际容量可能比公式略大。

${F}go
s := make([]int, 0, 4)
for i := 0; i < 10; i++ {
    s = append(s, i)
    fmt.Println(len(s), cap(s)) // cap: 4 4 4 4 8 8 8 8 16 16
}
${F}

**已知长度时预分配**：${C}make([]T, 0, n)${C} 能避免多次扩容和拷贝，是最简单的性能优化。

## 三、map 的底层结构

map 是哈希表。Go 1.24 之前的实现由 bucket 数组组成，每个 bucket 存 8 个键值对，冲突时挂溢出桶；装载因子超过 6.5 时**渐进式扩容**，每次写操作搬迁一部分数据。Go 1.24 换成了 Swiss Table 实现，查找更快，但对使用者的语义没有变化。

${F}go
m := map[string]int{"a": 1}
v, ok := m["b"]       // 不存在时 v 为零值，ok 为 false
delete(m, "a")
for k, v := range m { // 遍历顺序是随机的，不要依赖
    fmt.Println(k, v)
}
${F}

map 的键必须是**可比较类型**，切片、map、函数不能做键。

## 四、map 不是并发安全的

多个 goroutine 同时读写一个 map，运行时会直接报 ${C}fatal error: concurrent map writes${C}，这种错误无法用 recover 捕获。常用方案：

| 方案 | 适用场景 |
| --- | --- |
| ${C}sync.RWMutex${C} + map | 通用，读多写少时用读锁 |
| ${C}sync.Map${C} | 键集合稳定、读远多于写，或各 goroutine 操作不相交的键 |
| 分片加锁 | 高并发缓存，把锁冲突分散到多个分片 |

## ⚠ 踩坑

- **子切片持有大数组**：从 1GB 的切片里切出 10 字节长期保存，整个数组都无法回收，应 ${C}copy${C} 出来。
- **append 共享底层数组**：${C}a := s[:2]; a = append(a, 9)${C} 会覆盖 ${C}s[2]${C}。需要隔离时用三下标切片 ${C}s[:2:2]${C} 限制容量。
- **nil map 不能写**：${C}var m map[string]int; m["a"] = 1${C} 会 panic，必须先 ${C}make${C}。
- **range 拿到的是副本**：修改结构体切片元素要用下标 ${C}s[i].X = 1${C}。

## ✅ 自检清单

- 能画出切片头三个字段，并解释共享底层数组的后果。
- 能说出 append 扩容的大致规则和预分配的意义。
- 知道 map 遍历无序、不可并发写，以及三种并发方案的取舍。

## 📚 延伸阅读

- Go Blog：Arrays, slices (and strings): The mechanics of append
- Go 1.24 Release Notes：Swiss Table map 实现
`
          },
          {
            id: "go-struct-interface",
            title: "结构体、方法与接口：组合优于继承",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "interface", "泛型"],
            terms: ["接口", "interface", "结构体", "泛型"],
            body: `
> **官方文档基线**：[A Tour of Go: Methods and interfaces](https://go.dev/tour/methods/1) · [Effective Go: Interfaces](https://go.dev/doc/effective_go#interfaces) · [Tutorial: Getting started with generics](https://go.dev/doc/tutorial/generics)

## 一、结构体与方法

Go 没有类，用结构体加方法表达对象。方法就是带**接收者**的函数：

${F}go
type User struct {
    Name string
    Age  int
}

func (u User) Greet() string { return "hi, " + u.Name } // 值接收者
func (u *User) Birthday()    { u.Age++ }                // 指针接收者
${F}

| 选择 | 什么时候用 |
| --- | --- |
| 指针接收者 | 需要修改接收者；结构体较大；类型里有 Mutex 等不能拷贝的字段 |
| 值接收者 | 小而不可变的类型，如 ${C}time.Time${C} |

同一类型的方法应**统一用一种接收者**，避免方法集混乱。

## 二、接口是隐式实现的

只要一个类型实现了接口的全部方法，它就自动满足这个接口，不需要写 implements。这让接口可以由**使用方定义**，保持小而专注：

${F}go
type Notifier interface {
    Notify(msg string) error
}

type Email struct{ To string }

func (e Email) Notify(msg string) error { return nil }

func Send(n Notifier) { _ = n.Notify("hello") }
${F}

标准库的 ${C}io.Reader${C}、${C}io.Writer${C} 都只有一个方法，这是 Go 接口设计的典范：接受接口，返回具体类型。

**方法集规则**：值类型 ${C}T${C} 的方法集只包含值接收者方法；${C}*T${C} 包含全部方法。所以只有指针接收者方法时，必须传 ${C}&User{}${C} 才能赋给接口。

## 三、nil 接口陷阱

接口值内部是（类型，值）两部分，**两者都为 nil 时接口才等于 nil**：

${F}go
func find() error {
    var e *MyErr = nil
    return e // 接口的类型部分是 *MyErr，不等于 nil
}

if err := find(); err != nil {
    fmt.Println("这里会被执行") // 经典 bug
}
${F}

正确写法是没有错误时直接 ${C}return nil${C}。

## 四、嵌入：组合代替继承

${F}go
type Logger struct{}
func (Logger) Log(s string) { fmt.Println(s) }

type Service struct {
    Logger          // 嵌入，Service 直接拥有 Log 方法
    name string
}

s := Service{name: "order"}
s.Log("started")
${F}

嵌入只是语法糖上的方法提升，不存在多态覆盖。

## 五、泛型（Go 1.18+）

${F}go
type Number interface {
    ~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
    var total T
    for _, x := range xs {
        total += x
    }
    return total
}
${F}

泛型适合容器和通用算法；业务代码里能用接口解决的，优先用接口。

## ⚠ 踩坑

- 返回具体类型的 nil 指针给 error 接口，判断永远不为 nil。
- 用类型断言 ${C}v.(T)${C} 不带 ok 时，类型不符会 panic，应写 ${C}v, ok := x.(T)${C}。
- 结构体含 ${C}sync.Mutex${C} 时用值接收者，锁会被拷贝，${C}go vet${C} 会提示。

## ✅ 自检清单

- 能说清值接收者与指针接收者的区别和方法集规则。
- 能解释 nil 接口陷阱的原因。
- 能写一个带类型约束的泛型函数。

## 📚 延伸阅读

- Go FAQ：Why is my nil error value not equal to nil?
- Go Blog：An Introduction To Generics
`
          },
          {
            id: "go-error",
            title: "错误处理：error、包装、defer 与 panic",
            minutes: 13,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "error", "defer"],
            terms: ["error", "panic", "recover", "defer"],
            body: `
> **官方文档基线**：[Error handling and Go](https://go.dev/blog/error-handling-and-go) · [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors) · [Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover)

## 一、错误就是值

Go 不用异常表达业务失败，而是把 ${C}error${C} 作为最后一个返回值。${C}error${C} 只是一个接口：

${F}go
type error interface {
    Error() string
}

f, err := os.Open("config.yaml")
if err != nil {
    return fmt.Errorf("load config: %w", err)
}
defer f.Close()
${F}

「每一步都判断 err」看起来啰嗦，但错误路径一目了然，不会被层层 try 吞掉。

## 二、包装与判断

Go 1.13 起用 ${C}%w${C} 包装错误，保留原始错误链，再用 ${C}errors.Is${C} 和 ${C}errors.As${C} 判断：

| 函数 | 作用 | 典型用法 |
| --- | --- | --- |
| ${C}fmt.Errorf("...: %w", err)${C} | 加上下文并保留原错误 | 每一层补充「在做什么」 |
| ${C}errors.Is(err, target)${C} | 链上是否有某个哨兵错误 | ${C}errors.Is(err, sql.ErrNoRows)${C} |
| ${C}errors.As(err, &t)${C} | 链上是否有某种类型的错误，并取出来 | 取 ${C}*os.PathError${C} 的路径 |
| ${C}errors.Join(a, b)${C} | 合并多个错误（1.20+） | 批量操作汇总失败 |

${F}go
var ErrNotFound = errors.New("not found")   // 哨兵错误

type ValidationError struct{ Field string }
func (e *ValidationError) Error() string { return "invalid " + e.Field }

err := fmt.Errorf("create user: %w", &ValidationError{Field: "email"})
var ve *ValidationError
if errors.As(err, &ve) {
    fmt.Println(ve.Field) // email
}
${F}

**原则**：错误只处理一次。要么记日志后降级，要么包装后向上返回，不要既打日志又返回，否则日志会重复多次。

## 三、defer 的执行规则

- 函数返回前按**后进先出**顺序执行。
- 参数在 defer 语句执行时就求值，而不是在函数结束时。
- defer 可以修改**具名返回值**。

${F}go
func demo() (n int) {
    defer func() { n *= 2 }()
    for i := 0; i < 3; i++ {
        defer fmt.Println(i) // 输出 2 1 0
    }
    return 5 // 最终返回 10
}
${F}

## 四、panic 与 recover

panic 用于**程序无法继续的错误**，比如数组越界、初始化失败。recover 只能在 defer 函数里生效，常用于 HTTP 服务的中间件，防止一个请求把整个进程打挂：

${F}go
func Recover(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if v := recover(); v != nil {
                log.Printf("panic: %v", v)
                http.Error(w, "internal error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
${F}

## ⚠ 踩坑

- **recover 管不了别的 goroutine**：子 goroutine 里的 panic 会让整个进程退出，每个长期运行的 goroutine 都要自己兜底。
- **循环里 defer**：在 for 里打开文件并 defer Close，文件要到函数结束才关闭，应抽成小函数。
- **用 ${C}==${C} 比较包装后的错误**：包装后不再相等，必须用 ${C}errors.Is${C}。

## ✅ 自检清单

- 能用 ${C}%w${C}、${C}errors.Is${C}、${C}errors.As${C} 组织错误链。
- 能写出 defer 的执行顺序和对具名返回值的影响。
- 知道 panic 和 error 各自的使用边界。

## 📚 延伸阅读

- Go Blog：Errors are values
- Uber Go Style Guide：Errors 章节
`
          },
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "熟练使用 goroutine、channel、sync 和 context，能写正确的并发程序和工程化项目。",
        chapters: [
          // <go-mid>
          {
            id: "go-goroutine-channel",
            title: "goroutine 与 channel：用通信来共享内存",
            minutes: 17,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "并发", "channel"],
            terms: ["goroutine", "channel", "select", "协程"],
            body: `
> **官方文档基线**：[A Tour of Go: Concurrency](https://go.dev/tour/concurrency/1) · [Effective Go: Concurrency](https://go.dev/doc/effective_go#concurrency) · [Go Concurrency Patterns: Pipelines](https://go.dev/blog/pipelines)

## 一、goroutine

goroutine 是由 Go 运行时调度的轻量线程，初始栈只有 2KB，可以按需增长。一台机器跑几十万个 goroutine 很常见，而操作系统线程通常几千个就吃紧。

${F}go
go func() {
    fmt.Println("在新的 goroutine 里执行")
}()
${F}

| 对比 | goroutine | 系统线程 |
| --- | --- | --- |
| 初始栈 | 约 2KB，可伸缩 | 通常 1~8MB 固定 |
| 创建与切换 | 用户态，纳秒到百纳秒级 | 内核态，微秒级 |
| 调度者 | Go 运行时（GMP） | 操作系统 |

## 二、channel 的类型和行为

![channel 示意图](/assets/diagrams/docs/go-channel.svg)

Go 的格言是：**不要通过共享内存来通信，而要通过通信来共享内存。** channel 就是 goroutine 之间传递数据的管道。

${F}go
unbuf := make(chan int)     // 无缓冲：发送方会阻塞，直到有人接收
buf := make(chan int, 10)   // 有缓冲：缓冲区满了才阻塞

go func() { unbuf <- 42 }()
v := <-unbuf
${F}

各种操作在不同状态下的行为是面试高频题：

| 操作 | nil channel | 已关闭 channel | 正常 channel |
| --- | --- | --- | --- |
| 发送 | 永久阻塞 | **panic** | 阻塞或成功 |
| 接收 | 永久阻塞 | 立即返回零值，ok=false | 阻塞或成功 |
| 关闭 | **panic** | **panic** | 成功 |

**关闭原则**：由发送方关闭，接收方不要关；有多个发送方时，用 sync.WaitGroup 等全部发送完再由协调者关闭。

## 三、select 多路复用

${F}go
select {
case msg := <-msgCh:
    handle(msg)
case <-time.After(3 * time.Second):
    fmt.Println("超时")
case <-ctx.Done():
    return ctx.Err()
default:
    // 都没就绪时立即走这里，实现非阻塞收发
}
${F}

多个 case 同时就绪时，select **随机**选一个，防止某个 case 饿死。

## 四、常用并发模式

**Worker Pool**：固定数量的 worker 从任务 channel 取活，控制并发度。

${F}go
jobs := make(chan int, 100)
results := make(chan int, 100)
var wg sync.WaitGroup

for w := 0; w < 4; w++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for j := range jobs { // jobs 关闭后循环结束
            results <- j * j
        }
    }()
}
for i := 1; i <= 9; i++ {
    jobs <- i
}
close(jobs)
wg.Wait()
close(results)
${F}

其他常见模式还有 Pipeline（多阶段串联）、Fan-out/Fan-in（分发与汇总）、用带缓冲 channel 做信号量限流。

## ⚠ 踩坑

- **goroutine 泄漏**：goroutine 阻塞在没人接收的 channel 上永远不退出，内存持续上涨。每个 goroutine 都要有明确的退出路径，通常靠 ctx.Done()。
- **for 循环里的 time.After**：每次循环都创建新定时器，高频循环应复用 ${C}time.NewTimer${C}。
- **main 退出不等子 goroutine**：要用 WaitGroup 或 channel 同步。

## ✅ 自检清单

- 能背出 nil、已关闭、正常 channel 三种状态下的收发关行为。
- 能写出 Worker Pool，并说清谁来关闭 channel。
- 能识别并避免 goroutine 泄漏。

## 📚 延伸阅读

- Go Blog：Share Memory By Communicating
- 演讲：Rob Pike《Concurrency is not Parallelism》
`
          },
          {
            id: "go-sync-context",
            title: "sync 包与 context：锁、原子操作与超时取消",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "sync", "context"],
            terms: ["Mutex", "WaitGroup", "context", "errgroup"],
            body: `
> **官方文档基线**：[sync 包文档](https://pkg.go.dev/sync) · [Go Concurrency Patterns: Context](https://go.dev/blog/context) · [The Go Memory Model](https://go.dev/ref/mem)

## 一、sync 包常用工具

channel 适合传递数据和事件；保护一小块共享状态时，锁往往更直接。

| 工具 | 用途 | 一句话要点 |
| --- | --- | --- |
| ${C}sync.Mutex${C} | 互斥锁 | Lock 后立刻 defer Unlock |
| ${C}sync.RWMutex${C} | 读写锁 | 读多写少时用 RLock |
| ${C}sync.WaitGroup${C} | 等一组 goroutine 结束 | Add 要在启动 goroutine 之前调用 |
| ${C}sync.Once${C} | 只执行一次 | 懒加载单例、初始化配置 |
| ${C}sync.Pool${C} | 临时对象复用 | 降低 GC 压力，对象随时可能被回收 |
| ${C}sync/atomic${C} | 原子操作 | 计数器、状态标志，比锁更轻 |

${F}go
type Counter struct {
    mu sync.Mutex
    m  map[string]int
}

func (c *Counter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.m[key]++
}

var hits atomic.Int64 // Go 1.19+ 的类型化原子变量
hits.Add(1)
${F}

## 二、context：在调用链上传递取消信号

一个 HTTP 请求可能派生出查库、调下游、写缓存等多个 goroutine。客户端断开或超时后，这些工作都应该停下来。context 就是把**取消信号、截止时间和请求级数据**沿调用链传下去的标准方式。

${F}go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel() // 一定要调用，释放定时器资源

    user, err := queryUser(ctx, 42)
    if errors.Is(err, context.DeadlineExceeded) {
        http.Error(w, "timeout", http.StatusGatewayTimeout)
        return
    }
    fmt.Fprintln(w, user)
}

func queryUser(ctx context.Context, id int) (string, error) {
    select {
    case <-time.After(3 * time.Second): // 模拟慢查询
        return "tom", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}
${F}

| 函数 | 作用 |
| --- | --- |
| ${C}context.Background()${C} | 根 context，用在 main 和测试 |
| ${C}WithCancel${C} | 手动取消 |
| ${C}WithTimeout${C} / ${C}WithDeadline${C} | 超时自动取消 |
| ${C}WithValue${C} | 携带 traceID 等请求级数据，不要用来传业务参数 |

**约定**：context 作为函数第一个参数，命名为 ctx，不要存到结构体里。

## 三、errgroup：并发任务出错即取消

${F}go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8) // 限制并发数
for _, url := range urls {
    g.Go(func() error { // Go 1.22 起循环变量每轮独立，无需再拷贝
        return fetch(ctx, url)
    })
}
if err := g.Wait(); err != nil {
    return err // 返回第一个错误，其余任务通过 ctx 被取消
}
${F}

## ⚠ 踩坑

- **锁被拷贝**：含 Mutex 的结构体按值传递，锁失效，${C}go vet${C} 能查出来。
- **在 goroutine 里 wg.Add**：可能 Wait 先执行，直接返回。
- **重入死锁**：Go 的 Mutex 不可重入，同一 goroutine 二次 Lock 会死锁。
- **忘记 cancel**：WithTimeout 返回的 cancel 不调用，定时器要等超时才释放。

## ✅ 自检清单

- 能根据场景在 channel、Mutex、atomic 之间做选择。
- 能用 context 实现请求超时，并让下游及时退出。
- 会用 errgroup 管理一组并发任务。

## 📚 延伸阅读

- pkg.go.dev：golang.org/x/sync/errgroup
- Go Blog：Introducing the Go Race Detector
`
          },
          {
            id: "go-module-test",
            title: "工程化：Go Modules、项目结构、测试与静态检查",
            minutes: 14,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "go mod", "测试"],
            terms: ["go mod", "单元测试", "benchmark", "race"],
            body: `
> **官方文档基线**：[Go Modules Reference](https://go.dev/ref/mod) · [testing 包文档](https://pkg.go.dev/testing) · [Organizing a Go module](https://go.dev/doc/modules/layout)

## 一、Go Modules 依赖管理

${F}bash
go mod init github.com/acme/order   # 生成 go.mod
go get github.com/gin-gonic/gin@v1.10.0
go mod tidy                          # 补齐缺失、删除未用依赖
go mod download                      # CI 中预拉依赖
export GOPROXY=https://goproxy.cn,direct   # 国内加速
${F}

| 文件 | 作用 |
| --- | --- |
| go.mod | 模块路径、Go 版本、直接依赖及版本 |
| go.sum | 依赖内容的校验和，防止被篡改，要提交到仓库 |

Go 采用**最小版本选择（MVS）**：在所有依赖声明的版本里选能满足要求的最低版本，构建结果可复现。

## 二、常见项目结构

${F}text
order/
├── cmd/order-api/main.go   # 程序入口，只做组装
├── internal/               # 私有代码，外部模块无法导入
│   ├── handler/
│   ├── service/
│   └── repo/
├── pkg/                    # 可被外部复用的库（可选）
├── api/                    # proto、OpenAPI 定义
└── go.mod
${F}

${C}internal${C} 目录由编译器强制限制访问范围，是 Go 唯一的「包级私有」机制。

## 三、表驱动测试

${F}go
func TestAdd(t *testing.T) {
    cases := []struct {
        name string
        a, b int
        want int
    }{
        {"正数", 1, 2, 3},
        {"负数", -1, -2, -3},
        {"零", 0, 0, 0},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := Add(c.a, c.b); got != c.want {
                t.Errorf("Add(%d,%d)=%d, want %d", c.a, c.b, got, c.want)
            }
        })
    }
}

func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}
${F}

${F}bash
go test ./... -cover            # 全部测试 + 覆盖率
go test -race ./...             # 数据竞争检测，CI 必开
go test -bench=. -benchmem      # 基准测试，显示每次分配
${F}

## 四、静态检查

- ${C}gofmt${C} / ${C}goimports${C}：统一格式，无需争论代码风格。
- ${C}go vet${C}：检查锁拷贝、Printf 参数不匹配等常见错误。
- ${C}golangci-lint${C}：聚合 staticcheck、errcheck 等几十个检查器，团队里最常用。

## ⚠ 踩坑

- 修改 import 后忘了 ${C}go mod tidy${C}，CI 报 missing go.sum entry。
- 测试依赖真实数据库和网络，跑得慢又不稳定；应把依赖抽成接口，测试时注入假实现。
- 只在本地跑测试，不开 ${C}-race${C}，并发 bug 留到线上。

## ✅ 自检清单

- 理解 go.mod、go.sum 的作用和最小版本选择。
- 能写表驱动测试和基准测试。
- CI 中包含 vet、lint、race 三项检查。

## 📚 延伸阅读

- go.dev：Tutorial: Add a test
- golangci-lint 官方文档
`
          },
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "理解 GMP 调度、内存分配与 GC，能做性能分析，并用 Gin、gRPC 构建服务。",
        chapters: [
          // <go-adv>
          {
            id: "go-gmp",
            title: "GMP 调度模型：goroutine 是怎么跑起来的",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "调度器", "GMP"],
            terms: ["GMP", "调度器", "work stealing", "抢占"],
            body: `
> **官方文档基线**：[runtime 包文档](https://pkg.go.dev/runtime) · [Scalable Go Scheduler Design Doc](https://golang.org/s/go11sched) · [Go 1.14 Release Notes：异步抢占](https://go.dev/doc/go1.14#runtime)

## 一、三个角色

![GMP 调度模型](/assets/diagrams/docs/go-gmp.svg)

| 角色 | 全称 | 是什么 |
| --- | --- | --- |
| G | Goroutine | 要执行的任务，保存栈和程序计数器 |
| M | Machine | 操作系统线程，真正执行代码的实体 |
| P | Processor | 逻辑处理器，持有本地运行队列；数量等于 ${C}GOMAXPROCS${C}，默认为 CPU 核数 |

一句话：**M 必须绑定一个 P 才能执行 G。** P 的数量决定了同一时刻最多有几个 goroutine 在并行运行。

## 二、调度流程

1. ${C}go func()${C} 创建 G，优先放进当前 P 的本地队列（容量 256），满了就把一半挪到全局队列。
2. M 从绑定的 P 的本地队列取 G 执行。
3. 本地队列空了：先查全局队列，再查网络轮询器（netpoller）里就绪的 G，最后去**别的 P 偷一半**（work stealing）。
4. 为了公平，每调度 61 次会强制检查一次全局队列，防止全局队列里的 G 饿死。

## 三、阻塞时发生什么

| 场景 | 调度器的处理 |
| --- | --- |
| channel、锁、time.Sleep 等阻塞 | G 挂起放到等待队列，M 继续执行别的 G，开销很小 |
| 网络 IO | 交给 netpoller（epoll/kqueue），就绪后 G 重新入队 |
| 系统调用（如文件读写）阻塞 | M 和 G 一起陷入内核，P 被 sysmon 拿走交给别的 M，保证 CPU 不闲着 |

这就是 Go 能用同步写法写出高并发网络服务的原因：看起来是阻塞调用，底层是 IO 多路复用。

## 四、抢占

- Go 1.14 之前是**协作式抢占**：只在函数调用时检查是否该让出，${C}for {}${C} 死循环会一直霸占 P。
- Go 1.14 起加入**基于信号的异步抢占**：后台线程 sysmon 发现某个 G 运行超过 10ms，就给它的 M 发 SIGURG 信号，强制切走。

${F}go
runtime.GOMAXPROCS(0)  // 查询当前 P 的数量
runtime.NumGoroutine() // 当前 goroutine 数，监控泄漏常用
runtime.Gosched()      // 主动让出 CPU
${F}

## ⚠ 误区

- **goroutine 越多越快**：CPU 密集任务的并行度上限就是 P 的数量，开太多只会增加调度和内存开销。
- **容器里 GOMAXPROCS 等于 CPU 限额**：Go 1.25 之前读取的是宿主机核数，在 2 核限额的 Pod 里可能被设成 64，导致 CPU 被节流。旧版本可用 ${C}go.uber.org/automaxprocs${C}。

## ✅ 自检清单

- 能画出 G、M、P 的关系，并说出 P 的数量由什么决定。
- 能讲清 work stealing 和系统调用时的 P 转移。
- 知道协作式和异步抢占的区别。

## 📚 延伸阅读

- 《Go 语言设计与实现》：调度器章节
- Go 1.25 Release Notes：容器感知的 GOMAXPROCS
`
          },
          {
            id: "go-memory-gc",
            title: "内存与 GC：逃逸分析、三色标记与调优参数",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "GC", "内存"],
            terms: ["GC", "逃逸分析", "三色标记", "GOGC"],
            body: `
> **官方文档基线**：[A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide) · [Go FAQ: Stack or heap](https://go.dev/doc/faq#stack_or_heap) · [runtime/debug 包](https://pkg.go.dev/runtime/debug)

## 一、栈与堆

| 位置 | 分配与回收 | 成本 |
| --- | --- | --- |
| 栈 | 函数返回时自动释放 | 极低，不需要 GC |
| 堆 | 由 GC 扫描回收 | 分配和回收都有开销 |

Go 程序员不需要手动选择位置，编译器通过**逃逸分析**决定。变量的生命周期超出函数作用域，就会「逃逸」到堆上。

## 二、逃逸分析

${F}go
func newUser() *User {
    u := User{Name: "tom"}
    return &u // 返回局部变量指针，u 逃逸到堆
}

func sum() int {
    xs := make([]int, 100) // 大小确定且不外传，留在栈上
    return len(xs)
}
${F}

${F}bash
go build -gcflags='-m' ./...   # 打印逃逸分析结果
# ./main.go:10:2: moved to heap: u
${F}

常见逃逸原因：返回局部变量指针；赋值给 interface（如传给 ${C}fmt.Println${C}）；闭包捕获外部变量；切片大小在编译期未知或过大。

## 三、三色标记清除

Go 的 GC 是**并发、非分代、不移动对象**的标记清除。对象被分为三种颜色：

| 颜色 | 含义 |
| --- | --- |
| 白色 | 还没扫描到，标记结束后仍是白色的就是垃圾 |
| 灰色 | 已发现，但它引用的对象还没扫完 |
| 黑色 | 自身和引用都扫描完成，存活 |

流程：从根对象（全局变量、各 goroutine 的栈）出发，全部标灰；不断取出灰色对象，把它引用的白色对象标灰、自己标黑；灰色集合为空时，剩下的白色对象被回收。

因为标记和业务代码**并发进行**，业务代码可能在标记过程中修改指针，导致存活对象被漏标。Go 用**混合写屏障**（Go 1.8 起）在指针写入时额外标灰对象，从而把 STW 停顿压缩到通常 1ms 以内。

## 四、调优参数

| 参数 | 作用 |
| --- | --- |
| ${C}GOGC=100${C} | 默认值，堆增长到上次存活堆的 2 倍时触发 GC；调大则 GC 更少、内存更多 |
| ${C}GOMEMLIMIT=1GiB${C} | Go 1.19+ 的软内存上限，接近上限时 GC 更积极，容器环境强烈建议设置 |
| ${C}GODEBUG=gctrace=1${C} | 每次 GC 打印一行耗时和堆大小 |

容器里常见做法：把 GOMEMLIMIT 设为 Pod 内存上限的 80%~90%，既避免 OOM，又不需要把 GOGC 调得很小。

## 五、减少分配的手段

- 切片、map 预分配容量。
- 高频临时对象用 ${C}sync.Pool${C} 复用，比如 bytes.Buffer。
- 拼接字符串用 ${C}strings.Builder${C}。
- 热点路径避免把值装进 interface。

## ⚠ 误区

- **「Go 有 GC 就不会内存泄漏」**：goroutine 泄漏、全局 map 只增不删、子切片引用大数组，都会让内存持续上涨。
- **盲目设 GOGC=off**：短任务可以，长期服务会把内存吃光。

## ✅ 自检清单

- 能用 ${C}-gcflags='-m'${C} 看逃逸，并说出几种典型原因。
- 能讲清三色标记的流程和写屏障解决的问题。
- 知道 GOGC 和 GOMEMLIMIT 的含义和容器里的设置方法。

## 📚 延伸阅读

- Go Blog：Getting to Go: The Journey of Go's Garbage Collector
- Go 1.25 实验性 Green Tea GC 说明
`
          },
          {
            id: "go-pprof",
            title: "性能分析：pprof、trace 与火焰图",
            minutes: 12,
            updated: "2026-11-20",
            applies: "Go 1.22+",
            tags: ["Go", "pprof", "性能"],
            terms: ["pprof", "火焰图", "trace", "性能分析"],
            body: `
> **官方文档基线**：[Diagnostics](https://go.dev/doc/diagnostics) · [Profiling Go Programs](https://go.dev/blog/pprof) · [net/http/pprof 包](https://pkg.go.dev/net/http/pprof)

## 一、先测量，再优化

性能问题靠猜往往猜错。Go 内置了完整的诊断工具，线上服务开启 pprof 的开销很小。

| profile 类型 | 回答的问题 |
| --- | --- |
| cpu | CPU 时间花在哪些函数上 |
| heap | 内存分配在哪里，当前存活对象有多少 |
| goroutine | 当前所有 goroutine 的调用栈，排查泄漏和死锁 |
| mutex / block | 锁竞争和阻塞等待发生在哪里 |
| trace | 时间线视角：调度延迟、GC 停顿、goroutine 执行情况 |

## 二、在服务中开启

${F}go
import _ "net/http/pprof"

func main() {
    go func() {
        // 只监听本地或内网端口，不要暴露到公网
        log.Println(http.ListenAndServe("127.0.0.1:6060", nil))
    }()
    // ... 业务代码
}
${F}

## 三、采集与分析

${F}bash
# 采集 30 秒 CPU profile 并打开 Web 界面（含火焰图）
go tool pprof -http=:8081 http://127.0.0.1:6060/debug/pprof/profile?seconds=30

# 内存分配
go tool pprof -http=:8081 http://127.0.0.1:6060/debug/pprof/heap

# goroutine 数量异常时，直接看文本调用栈
curl http://127.0.0.1:6060/debug/pprof/goroutine?debug=1

# 执行轨迹
curl -o trace.out http://127.0.0.1:6060/debug/pprof/trace?seconds=5
go tool trace trace.out
${F}

pprof 命令行里最常用的是 ${C}top${C}（按耗时排序）、${C}list 函数名${C}（逐行耗时）和 ${C}web${C}（调用图）。

**读火焰图**：横轴宽度代表占用比例，越宽越值得优化；纵轴是调用栈深度，顶部是正在执行的函数。

## 四、典型排查思路

1. **CPU 高**：看 cpu profile 的 top，常见元凶是 JSON 序列化、正则、日志格式化、频繁 GC。
2. **内存涨**：对比两个时间点的 heap（${C}-base${C} 参数），找持续增长的分配点。
3. **goroutine 数持续上升**：看 goroutine profile，找大量 goroutine 卡在同一行，通常是 channel 没人收或缺少超时。
4. **延迟毛刺**：用 trace 看是否是 GC 停顿或调度延迟。

## ⚠ 踩坑

- pprof 端口暴露到公网，会泄露代码结构，还可能被用来消耗资源。
- 在压测流量不足时采样，profile 里看不到真实热点。
- 只看 flat 不看 cum：flat 是函数自身耗时，cum 包含它调用的子函数。

## ✅ 自检清单

- 能在服务中安全开启 pprof 并采集 cpu、heap、goroutine。
- 能读火焰图并定位热点函数。
- 能按 CPU、内存、goroutine、延迟四类问题选对工具。

## 📚 延伸阅读

- go.dev：Profile-guided optimization (PGO)
- Brendan Gregg：Flame Graphs
`
          },
          {
            id: "go-web-grpc",
            title: "Web 与微服务：net/http、Gin 与 gRPC",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Go 1.22+ · Gin 1.10 · gRPC-Go 1.6x",
            tags: ["Go", "Gin", "gRPC"],
            terms: ["Gin", "gRPC", "protobuf", "微服务"],
            body: `
> **官方文档基线**：[net/http 包](https://pkg.go.dev/net/http) · [Gin 文档](https://gin-gonic.com/docs/) · [gRPC Go Quick start](https://grpc.io/docs/languages/go/quickstart/)

## 一、标准库就能写服务

Go 1.22 起，标准库路由支持请求方法和路径参数，小服务不引入框架也够用：

${F}go
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"id": id})
})

srv := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  5 * time.Second,  // 一定要设置超时
    WriteTimeout: 10 * time.Second,
}
log.Fatal(srv.ListenAndServe())
${F}

## 二、Gin：最流行的 Web 框架

${F}go
type CreateReq struct {
    Name  string ${C}json:"name" binding:"required"${C}
    Email string ${C}json:"email" binding:"required,email"${C}
}

r := gin.Default() // 自带 Logger 和 Recovery 中间件
api := r.Group("/api/v1")
api.POST("/users", func(c *gin.Context) {
    var req CreateReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    c.JSON(201, gin.H{"name": req.Name})
})
r.Run(":8080")
${F}

| 框架 | 特点 |
| --- | --- |
| Gin | 生态最大，基于 httprouter，资料最多 |
| Echo | API 设计简洁，与 Gin 相近 |
| Hertz / Kratos / go-zero | 国内大厂开源的微服务框架，带代码生成和治理能力 |

## 三、gRPC：服务间通信

gRPC 基于 HTTP/2 和 Protocol Buffers，接口先用 proto 定义，再生成代码：

${F}protobuf
syntax = "proto3";
package user.v1;
option go_package = "example.com/api/user/v1;userv1";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
}
message GetUserRequest { int64 id = 1; }
message User { int64 id = 1; string name = 2; }
${F}

${F}bash
protoc --go_out=. --go-grpc_out=. api/user/v1/user.proto
${F}

${F}go
type server struct {
    userv1.UnimplementedUserServiceServer
}

func (s *server) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.User, error) {
    return &userv1.User{Id: req.Id, Name: "tom"}, nil
}

lis, _ := net.Listen("tcp", ":9090")
g := grpc.NewServer()
userv1.RegisterUserServiceServer(g, &server{})
g.Serve(lis)
${F}

| 对比 | REST + JSON | gRPC |
| --- | --- | --- |
| 协议 | HTTP/1.1 或 2，文本 | HTTP/2，二进制 |
| 接口约束 | 靠文档 | proto 强类型，自动生成客户端 |
| 流式 | 需要 WebSocket/SSE | 原生支持双向流 |
| 适合 | 对外开放 API、浏览器 | 内部服务间调用 |

## 四、优雅退出

${F}go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
go srv.ListenAndServe()
<-ctx.Done()
shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
srv.Shutdown(shutdownCtx) // 停止接收新请求，等待处理中的请求完成
${F}

Kubernetes 滚动更新时先发 SIGTERM，没做优雅退出就会丢请求。

## ⚠ 踩坑

- ${C}http.Server${C} 不设超时，慢连接会耗尽资源；${C}http.Client${C} 默认也没有超时。
- 每次请求新建 ${C}http.Client${C}，连接无法复用；应全局复用一个。
- gRPC 调用不传带超时的 ctx，下游卡住时上游也一起卡住。

## ✅ 自检清单

- 能用标准库或 Gin 写出带参数校验的 REST 接口。
- 能写 proto 并生成 gRPC 服务端代码。
- 能实现监听 SIGTERM 的优雅退出。

## 📚 延伸阅读

- gRPC 官方文档：Core concepts
- go.dev：Tutorial: Developing a RESTful API with Go and Gin
`
          },
        ]
      }
    ]
  };

  window.GOLANG = GOLANG;
})();
