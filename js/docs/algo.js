/* =========================================================================
 *  js/docs/algo.js — 技术教程「算法与数据结构」方向数据
 *
 *  章节骨架参考：
 *    · 《Hello 算法》（hello-algo.com）的目录：复杂度 → 数据结构 → 算法
 *    · labuladong 的算法笔记：按解题框架归类（双指针、回溯、动态规划）
 *    · LeetCode Hot 100 题单与官方题解
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const ALGO = {
    id: "algo",
    name: "算法与数据结构",
    icon: "🧮",
    desc: "从复杂度分析和数组、链表、哈希表、栈与队列打基础，到树与堆、排序、二分、双指针，再到回溯、动态规划、图论和贪心。按《Hello 算法》目录和 LeetCode Hot 100 解题框架组织，代码用 Python 和 Java。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "会分析时间和空间复杂度，熟练使用数组、链表、哈希表、栈和队列。",
        chapters: [
          // <algo-basic>
          {
            id: "algo-complexity",
            title: "复杂度分析：大 O、时间与空间",
            minutes: 12,
            updated: "2026-11-20",
            applies: "通用",
            tags: ["算法", "复杂度"],
            terms: ["算法", "时间复杂度", "空间复杂度", "大O"],
            body: `
> **官方文档基线**：[Hello 算法 · 复杂度分析](https://www.hello-algo.com/chapter_computational_complexity/) · [LeetCode 学习计划](https://leetcode.cn/studyplan/)

## 一、为什么要分析复杂度

同一个问题，两种写法在 100 条数据时都很快，到了 100 万条，一个 0.1 秒跑完，另一个要跑几小时。复杂度分析不看具体秒数，只看**数据规模 n 变大时，耗时和内存增长得有多快**。面试官看到你的解法，第一句往往就是"复杂度多少，能不能更优"。

![复杂度增长曲线](/assets/diagrams/docs/algo-complexity.svg)

## 二、常见复杂度从快到慢

| 复杂度 | 名称 | 典型场景 | n = 10⁶ 时大致操作数 |
| --- | --- | --- | --- |
| O(1) | 常数 | 数组按下标取值、哈希表查找 | 1 |
| O(log n) | 对数 | 二分查找、平衡树查找 | 20 |
| O(n) | 线性 | 遍历数组、单层循环 | 10⁶ |
| O(n log n) | 线性对数 | 快速排序、归并排序、堆排序 | 2×10⁷ |
| O(n²) | 平方 | 双层循环、冒泡排序 | 10¹² |
| O(2ⁿ) | 指数 | 子集枚举、暴力递归 | 无法完成 |
| O(n!) | 阶乘 | 全排列 | 无法完成 |

经验值：一般机器每秒约 10⁸ 次简单操作。题目给 n ≤ 10⁵，就要找 O(n log n) 以内的解法；n ≤ 20，指数级回溯也能过。

## 三、怎么算时间复杂度

规则只有三条：**只看循环次数最多的那部分、忽略常数、忽略低阶项**。

${F}python
def demo(nums):
    total = 0                 # O(1)
    for x in nums:            # O(n)
        total += x
    for i in range(len(nums)):             # 外层 n 次
        for j in range(i + 1, len(nums)):  # 内层平均 n/2 次
            if nums[i] + nums[j] == 0:
                return True
    return False
# 总计 O(1) + O(n) + O(n²) = O(n²)
${F}

对数复杂度来自"每次把问题规模减半"：

${F}python
i = n
while i > 1:
    i //= 2      # 循环约 log₂n 次 → O(log n)
${F}

递归的复杂度 = 递归调用次数 × 每次调用的工作量。斐波那契朴素递归每层分成两支，调用次数约 2ⁿ，所以是 O(2ⁿ)；加上记忆化后每个值只算一次，降到 O(n)。

## 四、空间复杂度

空间复杂度统计的是**额外**使用的内存，不算输入本身。

| 写法 | 空间 |
| --- | --- |
| 只用几个变量 | O(1) |
| 新建一个长度 n 的数组或哈希表 | O(n) |
| 递归深度为 n | O(n)（调用栈） |
| 二维 dp 表 n×m | O(nm) |

常见优化就是**用空间换时间**：两数之和用哈希表多花 O(n) 空间，把 O(n²) 降到 O(n)。

## 五、最好、最坏与均摊

- **最坏情况**：面试默认说的就是最坏，比如快速排序最坏 O(n²)。
- **平均情况**：快速排序随机选基准时平均 O(n log n)。
- **均摊**：动态数组扩容时偶尔要复制 n 个元素，但摊到每次 ${C}append${C} 上仍是 O(1)。

## ⚠ 踩坑

- 把库函数当 O(1)：Python 的 ${C}list.insert(0, x)${C}、${C}x in list${C} 都是 O(n)，Java 的 ${C}ArrayList.remove(0)${C} 也是 O(n)。
- 字符串拼接：在循环里反复 ${C}s += c${C}，某些语言每次都复制，整体变 O(n²)，应改用 ${C}"".join()${C} 或 ${C}StringBuilder${C}。
- 忘了递归栈：DFS 写得再省变量，递归深度 n 也是 O(n) 空间。

## ✅ 自检清单

- 能写出 7 种常见复杂度并按快慢排序。
- 能根据 n 的范围反推需要的复杂度。
- 能说清楚为什么二分查找是 O(log n)。
- 能分析一段递归代码的时间和空间复杂度。

## 📚 延伸阅读

- 《Hello 算法》第 2 章：复杂度分析
- 《算法导论》第 3 章：函数的增长
`
          },
          {
            id: "algo-array-list",
            title: "数组与链表：增删查改和经典链表题",
            minutes: 14,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "数组", "链表"],
            terms: ["数组", "链表", "动态数组", "虚拟头节点"],
            body: `
> **官方文档基线**：[Hello 算法 · 数组与链表](https://www.hello-algo.com/chapter_array_and_linkedlist/) · [LeetCode 链表题单](https://leetcode.cn/tag/linked-list/)

## 一、两种最基础的存储方式

数组把元素放在**一段连续内存**里，链表把元素放在**分散的节点**里，每个节点存一个指向下一个节点的指针。几乎所有数据结构（栈、队列、哈希表、树、图）都建立在这两者之上。

| 操作 | 数组 | 链表 |
| --- | --- | --- |
| 按下标访问 | O(1)，地址 = 首地址 + i × 元素大小 | O(n)，只能从头一个个走 |
| 头部插入/删除 | O(n)，后面元素要整体挪动 | O(1)，改指针即可 |
| 已知节点后插入/删除 | O(n) | O(1) |
| 内存 | 连续，缓存友好 | 分散，每个节点多存指针 |

## 二、动态数组

Python 的 ${C}list${C}、Java 的 ${C}ArrayList${C} 都是动态数组：容量不够时申请一块更大的内存（通常扩到 1.5～2 倍）并把旧数据复制过去。单次扩容 O(n)，均摊到每次追加仍是 O(1)。

${F}java
List<Integer> list = new ArrayList<>(1000); // 已知规模时预设容量，避免反复扩容
list.add(1);
list.get(0);
${F}

## 三、链表节点与遍历

${F}python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def print_list(head):
    cur = head
    while cur:
        print(cur.val)
        cur = cur.next
${F}

链表题的两个万能工具：

- **虚拟头节点（dummy）**：在真正的头前面放一个假节点，删除或插入头节点时就不用单独处理。
- **快慢指针**：慢指针一次走一步，快指针一次走两步，用来找中点、判环、找倒数第 k 个。

## 四、经典题：反转链表（LeetCode 206）

${F}python
def reverse_list(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next     # 先记住下一个
        cur.next = prev    # 反转指针
        prev, cur = cur, nxt
    return prev
${F}

时间 O(n)，空间 O(1)。画图时把每一步 prev、cur、nxt 三个指针的位置写出来，就不容易丢节点。

## 五、经典题：环形链表（LeetCode 141/142）

${F}python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:              # 相遇说明有环
            p = head
            while p is not slow:      # 从头和相遇点同时走，再次相遇处就是入环点
                p, slow = p.next, slow.next
            return p
    return None
${F}

## 六、高频链表题清单

| 题目 | 关键技巧 |
| --- | --- |
| 21 合并两个有序链表 | dummy + 双指针 |
| 19 删除倒数第 N 个节点 | 快指针先走 N 步 |
| 876 链表的中间节点 | 快慢指针 |
| 160 相交链表 | 两指针走完自己再走对方 |
| 234 回文链表 | 找中点 + 反转后半段 |
| 146 LRU 缓存 | 哈希表 + 双向链表 |

## ⚠ 踩坑

- 改指针前没保存 ${C}next${C}，链表直接断掉。
- 循环条件写成 ${C}while fast.next${C}，当 ${C}fast${C} 为空时报错，应写 ${C}while fast and fast.next${C}。
- 删除头节点时忘了处理，用 dummy 可以统一逻辑。

## ✅ 自检清单

- 能说出数组和链表在访问、插入上的复杂度差异。
- 能 3 分钟内写出反转链表的迭代版和递归版。
- 能用快慢指针判环并找到入环点。

## 📚 延伸阅读

- 《Hello 算法》第 4 章：数组与链表
- labuladong：双指针技巧秒杀七道链表题
`
          },
          {
            id: "algo-hash",
            title: "哈希表：原理、冲突处理与高频题",
            minutes: 12,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "哈希"],
            terms: ["哈希", "哈希冲突", "负载因子", "HashMap"],
            body: `
> **官方文档基线**：[Hello 算法 · 哈希表](https://www.hello-algo.com/chapter_hashing/) · [Java HashMap 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashMap.html)

## 一、哈希表解决什么问题

数组按下标查找是 O(1)，但我们常常要按"名字""ID"之类的键查找。哈希表用**哈希函数**把任意键变成一个数组下标，于是按键查找、插入、删除平均都是 O(1)。它是刷题中使用频率最高的数据结构。

${F}python
cnt = {}
for w in ["go", "java", "go"]:
    cnt[w] = cnt.get(w, 0) + 1
print(cnt)   # {'go': 2, 'java': 1}
${F}

## 二、哈希冲突

不同的键可能算出同一个下标，这叫冲突。两种主流解决办法：

| 方式 | 做法 | 代表 |
| --- | --- | --- |
| 链地址法 | 每个桶挂一个链表，冲突的元素都挂上去 | Java HashMap（链表长度 ≥ 8 且容量 ≥ 64 时转红黑树） |
| 开放寻址 | 冲突就往后找下一个空位 | Python dict、Go map 的部分实现思路 |

**负载因子** = 元素个数 / 桶数量。Java HashMap 默认 0.75，超过就扩容到 2 倍并重新分配元素，保证链表不会太长。

## 三、套路一：用哈希表记录"见过什么"

两数之和（LeetCode 1）：

${F}python
def two_sum(nums, target):
    seen = {}                      # 值 -> 下标
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
${F}

把暴力 O(n²) 降到 O(n)，代价是 O(n) 额外空间。

## 四、套路二：分组与计数

字母异位词分组（LeetCode 49）：把排序后的字符串当键。

${F}python
from collections import defaultdict
def group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        groups["".join(sorted(s))].append(s)
    return list(groups.values())
${F}

## 五、套路三：前缀和 + 哈希

和为 K 的子数组（LeetCode 560）：如果 ${C}pre[j] - pre[i] == k${C}，说明 i 到 j 之间的子数组和为 k。

${F}python
def subarray_sum(nums, k):
    cnt = {0: 1}
    pre = ans = 0
    for x in nums:
        pre += x
        ans += cnt.get(pre - k, 0)
        cnt[pre] = cnt.get(pre, 0) + 1
    return ans
${F}

## 六、高频题清单

| 题目 | 思路 |
| --- | --- |
| 1 两数之和 | 值 → 下标 |
| 49 字母异位词分组 | 排序串作键 |
| 128 最长连续序列 | 集合 + 只从序列起点开始数 |
| 560 和为 K 的子数组 | 前缀和计数 |
| 3 无重复字符的最长子串 | 哈希 + 滑动窗口 |

## ⚠ 踩坑

- Java 中自定义对象作键，必须同时重写 ${C}equals${C} 和 ${C}hashCode${C}，否则查不到。
- 可变对象（如 Python 的 ${C}list${C}）不能作字典键，需要转成 ${C}tuple${C}。
- 哈希表遍历顺序不保证（Java HashMap），需要有序时用 ${C}TreeMap${C} 或 ${C}LinkedHashMap${C}。

## ✅ 自检清单

- 能解释哈希冲突和两种解决方式。
- 能说出 Java HashMap 扩容和树化的条件。
- 能用前缀和 + 哈希解决子数组求和问题。

## 📚 延伸阅读

- 《Hello 算法》第 6 章：哈希表
- OpenJDK HashMap 源码注释
`
          },
          {
            id: "algo-stack-queue",
            title: "栈与队列：括号匹配、单调栈与单调队列",
            minutes: 13,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "栈", "队列"],
            terms: ["栈", "队列", "单调栈", "双端队列"],
            body: `
> **官方文档基线**：[Hello 算法 · 栈与队列](https://www.hello-algo.com/chapter_stack_and_queue/) · [Java Deque 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Deque.html)

## 一、两种受限的线性结构

| 结构 | 规则 | 生活类比 | 典型用途 |
| --- | --- | --- | --- |
| 栈 | 后进先出（LIFO） | 一摞盘子 | 括号匹配、函数调用、撤销操作、DFS |
| 队列 | 先进先出（FIFO） | 排队买票 | BFS、任务调度、消息队列 |
| 双端队列 | 两头都能进出 | 两头开口的管道 | 滑动窗口最大值 |

## 二、各语言怎么用

${F}python
stack = []
stack.append(1); stack.append(2)
stack.pop()          # 2

from collections import deque
q = deque()
q.append(1); q.append(2)
q.popleft()          # 1，O(1)；不要用 list.pop(0)，那是 O(n)
${F}

${F}java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.pop();
Queue<Integer> queue = new ArrayDeque<>();
queue.offer(1); queue.poll();
${F}

Java 官方建议用 ${C}ArrayDeque${C} 代替老的 ${C}Stack${C} 类。

## 三、经典题：有效的括号（LeetCode 20）

${F}python
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    st = []
    for ch in s:
        if ch in pairs:
            if not st or st.pop() != pairs[ch]:
                return False
        else:
            st.append(ch)
    return not st
${F}

## 四、单调栈：找"下一个更大元素"

栈里元素保持单调递减。新元素比栈顶大时，栈顶就找到了它右边第一个更大的数。每个元素最多进出栈一次，整体 O(n)。

每日温度（LeetCode 739）：

${F}python
def daily_temperatures(t):
    ans = [0] * len(t)
    st = []                         # 存下标，对应温度单调递减
    for i, x in enumerate(t):
        while st and t[st[-1]] < x:
            j = st.pop()
            ans[j] = i - j
        st.append(i)
    return ans
${F}

同一套路还能解：496 下一个更大元素、84 柱状图中最大的矩形、42 接雨水。

## 五、单调队列：滑动窗口最大值（LeetCode 239）

双端队列里存下标，对应的值单调递减；队头就是当前窗口最大值。

${F}python
from collections import deque
def max_sliding_window(nums, k):
    dq, ans = deque(), []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                 # 比 x 小的都没机会当最大值了
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()             # 队头已滑出窗口
        if i >= k - 1:
            ans.append(nums[dq[0]])
    return ans
${F}

## 六、用两个栈实现队列（LeetCode 232）

入队压进 in 栈；出队时如果 out 栈为空，就把 in 栈全部倒进 out 栈再弹出。每个元素只搬一次，均摊 O(1)。这道题常用来考察对两种结构本质的理解。

## ⚠ 踩坑

- 弹栈前没判空，空栈 ${C}pop${C} 会抛异常。
- 单调栈里存值还是存下标要想清楚，需要算距离时必须存下标。
- Python 用 ${C}list.pop(0)${C} 当队列，数据量大时直接超时。

## ✅ 自检清单

- 能说出栈和队列各自适合的三个场景。
- 能写出单调栈模板并解决每日温度。
- 能解释滑动窗口最大值为什么是 O(n)。

## 📚 延伸阅读

- 《Hello 算法》第 5 章：栈与队列
- labuladong：单调栈结构解决三道算法题
`
          },
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "掌握二叉树、堆、排序、二分查找、双指针与滑动窗口。",
        chapters: [
          // <algo-mid>
          {
            id: "algo-sort",
            title: "排序算法：快排、归并、堆排序与稳定性",
            minutes: 15,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "排序"],
            terms: ["排序", "快速排序", "归并排序", "稳定性"],
            body: `
> **官方文档基线**：[Hello 算法 · 排序](https://www.hello-algo.com/chapter_sorting/) · [Python Sorting HOW TO](https://docs.python.org/3/howto/sorting.html)

## 一、排序算法总览

| 算法 | 平均时间 | 最坏时间 | 空间 | 稳定 | 一句话原理 |
| --- | --- | --- | --- | --- | --- |
| 冒泡 | O(n²) | O(n²) | O(1) | 是 | 相邻比较，大的往后冒 |
| 选择 | O(n²) | O(n²) | O(1) | 否 | 每轮选最小放前面 |
| 插入 | O(n²) | O(n²) | O(1) | 是 | 像整理扑克牌，基本有序时接近 O(n) |
| 快速排序 | O(n log n) | O(n²) | O(log n) | 否 | 选基准，小的放左大的放右，递归 |
| 归并排序 | O(n log n) | O(n log n) | O(n) | 是 | 拆成两半分别排好，再合并 |
| 堆排序 | O(n log n) | O(n log n) | O(1) | 否 | 建大顶堆，反复把堆顶换到末尾 |
| 计数/桶/基数 | O(n + k) | O(n + k) | O(n + k) | 是 | 不比较，按值分桶，适合范围小的整数 |

**稳定性**指相等元素排序后相对顺序不变。按成绩排序后再按班级排序，想让同班同学仍按成绩排，就需要稳定排序。

## 二、快速排序

${F}python
import random
def quick_sort(a, lo, hi):
    if lo >= hi:
        return
    p = random.randint(lo, hi)        # 随机基准，避免有序数据退化成 O(n²)
    a[p], a[hi] = a[hi], a[p]
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]         # 基准归位
    quick_sort(a, lo, i - 1)
    quick_sort(a, i + 1, hi)
${F}

快排的"分区"思想还能用来做**快速选择**：找第 k 大只需递归一边，平均 O(n)。

## 三、归并排序

${F}python
def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    res, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:       # 用 <= 保证稳定
            res.append(left[i]); i += 1
        else:
            res.append(right[j]); j += 1
    return res + left[i:] + right[j:]
${F}

归并的"合并"阶段可以顺带统计**逆序对**（剑指 Offer 51），也是外部排序（数据大到内存放不下）的基础。

## 四、语言内置排序用的是什么

| 语言 | 实现 |
| --- | --- |
| Python ${C}sorted${C} / ${C}list.sort${C} | Timsort（归并 + 插入），稳定 |
| Java ${C}Arrays.sort(int[])${C} | 双轴快排，不稳定 |
| Java ${C}Arrays.sort(Object[])${C} / ${C}Collections.sort${C} | Timsort，稳定 |
| Go ${C}sort.Slice${C} / ${C}slices.Sort${C} | pdqsort，不稳定；稳定用 ${C}sort.SliceStable${C} |

实际写题直接用内置排序，掌握自定义比较：

${F}python
people.sort(key=lambda p: (-p.score, p.name))   # 分数降序，同分按名字升序
${F}

${F}java
list.sort(Comparator.comparingInt((Person p) -> p.score).reversed()
        .thenComparing(p -> p.name));
${F}

## 五、高频题清单

| 题目 | 考点 |
| --- | --- |
| 912 排序数组 | 手写快排/归并 |
| 215 第 K 大元素 | 快速选择 |
| 56 合并区间 | 按左端点排序后扫描 |
| 75 颜色分类 | 三指针分区（荷兰国旗） |
| 148 排序链表 | 链表归并 |

## ⚠ 误区

- 快排固定选第一个元素当基准，遇到有序数组就退化成 O(n²)。
- 大量重复元素时普通快排也会退化，需要三路划分。
- Java 比较器写成 ${C}a - b${C}，遇到大整数会溢出，应该用 ${C}Integer.compare(a, b)${C}。

## ✅ 自检清单

- 能默写快排和归并，并说出各自的复杂度和稳定性。
- 能解释为什么快排平均比堆排序快（缓存友好）。
- 能用自定义比较器实现多字段排序。

## 📚 延伸阅读

- 《Hello 算法》第 11 章：排序
- Tim Peters：Timsort 设计说明（CPython listsort.txt）
`
          },
          {
            id: "algo-tree-heap",
            title: "二叉树与堆：遍历、BST 与 Top K",
            minutes: 16,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "二叉树", "堆"],
            terms: ["二叉树", "二叉搜索树", "堆", "优先队列"],
            body: `
> **官方文档基线**：[Hello 算法 · 树](https://www.hello-algo.com/chapter_tree/) · [Hello 算法 · 堆](https://www.hello-algo.com/chapter_heap/) · [Python heapq 文档](https://docs.python.org/3/library/heapq.html)

## 一、二叉树的基本概念

每个节点最多有左右两个孩子。常见类型：

| 类型 | 特点 |
| --- | --- |
| 满二叉树 | 每层都排满 |
| 完全二叉树 | 除最后一层外都满，最后一层从左往右排，可以用数组存（堆就是） |
| 二叉搜索树（BST） | 左子树所有值 < 根 < 右子树所有值 |
| 平衡二叉树 | 任意节点左右子树高度差 ≤ 1，如 AVL、红黑树 |

## 二、四种遍历

![二叉树遍历顺序](/assets/diagrams/docs/tree-traversal.svg)

| 遍历 | 顺序 | 用途 |
| --- | --- | --- |
| 前序 | 根 → 左 → 右 | 复制树、序列化 |
| 中序 | 左 → 根 → 右 | BST 中序得到有序序列 |
| 后序 | 左 → 右 → 根 | 先算子树再算自己，如求高度、删除树 |
| 层序 | 一层一层 | 求每层信息、最短深度 |

${F}python
def inorder(root, res):
    if not root:
        return
    inorder(root.left, res)
    res.append(root.val)      # 放在这里就是中序；挪到前面是前序，挪到后面是后序
    inorder(root.right, res)

from collections import deque
def level_order(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):   # 当前层的节点数
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res
${F}

## 三、递归解题的两种思路

labuladong 总结得很清楚：二叉树题要么**遍历一遍**（用外部变量记录答案），要么**分解问题**（用子树的返回值推出当前答案）。

${F}python
def max_depth(root):
    # 分解问题：当前深度 = 1 + 左右子树深度的较大值
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
${F}

## 四、二叉搜索树

查找、插入、删除平均 O(log n)，但插入有序数据会退化成链表变 O(n)，所以工程中用红黑树（Java ${C}TreeMap${C}）保持平衡。验证 BST（LeetCode 98）要给每个节点传上下界，不能只比较父子。

## 五、堆与优先队列

堆是一棵完全二叉树，小顶堆中每个父节点都 ≤ 孩子，所以堆顶是最小值。插入和弹出 O(log n)，查看堆顶 O(1)。

${F}python
import heapq
def top_k_largest(nums, k):
    heap = []                     # 维护大小为 k 的小顶堆
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)   # 弹出最小的，留下最大的 k 个
    return heap                   # 堆顶就是第 k 大
${F}

${F}java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
${F}

Top K 用堆是 O(n log k)，比全排序 O(n log n) 快，而且适合数据流。

## 六、高频题清单

| 题目 | 思路 |
| --- | --- |
| 104 二叉树最大深度 | 后序分解 |
| 226 翻转二叉树 | 前序交换左右 |
| 102 层序遍历 | 队列按层 |
| 236 最近公共祖先 | 后序，左右都找到则当前是答案 |
| 98 验证 BST | 传上下界 |
| 215 第 K 大元素 | 小顶堆或快速选择 |
| 23 合并 K 个有序链表 | 小顶堆 |

## ⚠ 踩坑

- 递归忘写终止条件 ${C}if not root${C}，空指针报错。
- Python 的 ${C}heapq${C} 只有小顶堆，要大顶堆就存负数。
- 层序遍历必须先取 ${C}len(q)${C} 再循环，否则会把下一层也算进来。

## ✅ 自检清单

- 能写出前中后序的递归版和层序遍历。
- 能说清"遍历"和"分解问题"两种思路的区别。
- 能用堆在 O(n log k) 内求 Top K。

## 📚 延伸阅读

- 《Hello 算法》第 7、8 章：树与堆
- labuladong：东哥带你刷二叉树（纲领篇）
`
          },
          {
            id: "algo-binary-search",
            title: "二分查找：模板、边界与二分答案",
            minutes: 12,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "二分查找"],
            terms: ["二分查找", "左边界", "右边界", "二分答案"],
            body: `
> **官方文档基线**：[Hello 算法 · 二分查找](https://www.hello-algo.com/chapter_searching/binary_search/) · [Python bisect 文档](https://docs.python.org/3/library/bisect.html)

## 一、核心思想

在**有序**区间里，每次看中间元素，就能排除一半。100 万个数最多比较 20 次。思想简单，难点全在边界：${C}left <= right${C} 还是 ${C}<${C}，${C}mid + 1${C} 还是 ${C}mid${C}。

## 二、统一用"找第一个满足条件的位置"

最不容易出错的写法是**左闭右开区间 + 找第一个 >= target 的位置**（相当于 C++ 的 ${C}lower_bound${C}、Python 的 ${C}bisect_left${C}）：

${F}python
def lower_bound(nums, target):
    lo, hi = 0, len(nums)          # 区间 [lo, hi)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1           # 答案在右边
        else:
            hi = mid               # mid 可能就是答案，保留
    return lo                      # 第一个 >= target 的下标，可能等于 len(nums)
${F}

其它问题都能转成它：

| 要找 | 写法 |
| --- | --- |
| target 是否存在 | ${C}i = lower_bound(t)${C}，再判断 ${C}i < n and nums[i] == t${C} |
| 第一个 > target | ${C}lower_bound(t + 1)${C}（整数）或 ${C}bisect_right${C} |
| 最后一个 <= target | ${C}lower_bound(t + 1) - 1${C} |
| target 出现次数 | ${C}lower_bound(t + 1) - lower_bound(t)${C} |

Java 写法相同，注意中点用 ${C}lo + (hi - lo) / 2${C} 防止溢出：

${F}java
int lo = 0, hi = nums.length;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (nums[mid] < target) lo = mid + 1; else hi = mid;
}
${F}

## 三、旋转数组（LeetCode 33）

数组被旋转后，任意切一刀，**至少有一半是有序的**。先判断哪一半有序，再看 target 在不在这半里。

${F}python
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:                 # 左半有序
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                     # 右半有序
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
${F}

## 四、二分答案

很多题看起来不是查找，但"答案越大越容易满足"具有单调性，就可以对答案二分。爱吃香蕉的珂珂（LeetCode 875）：速度越快越能吃完，找最小可行速度。

${F}python
import math
def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        k = (lo + hi) // 2
        if sum(math.ceil(p / k) for p in piles) <= h:
            hi = k            # 可行，试试更小
        else:
            lo = k + 1
    return lo
${F}

同类题：1011 在 D 天内送达包裹、410 分割数组的最大值。

## ⚠ 踩坑

- 区间定义和循环条件不一致：左闭右开配 ${C}lo < hi${C}，左闭右闭配 ${C}lo <= hi${C}。
- ${C}hi = mid${C} 和 ${C}lo = mid${C} 同时出现时，${C}mid${C} 要向上取整，否则死循环。
- 忘记返回值可能越界（等于数组长度）。

## ✅ 自检清单

- 能用一个 lower_bound 模板解决查找、左右边界、计数问题。
- 能解释旋转数组为什么还能二分。
- 能识别"二分答案"类题目的单调性。

## 📚 延伸阅读

- 《Hello 算法》第 10 章：搜索
- labuladong：我写了首诗，把二分搜索变成了默写题
`
          },
          {
            id: "algo-two-pointers",
            title: "双指针与滑动窗口",
            minutes: 13,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "双指针", "滑动窗口"],
            terms: ["双指针", "滑动窗口", "对撞指针", "快慢指针"],
            body: `
> **官方文档基线**：[LeetCode 双指针题单](https://leetcode.cn/tag/two-pointers/) · [LeetCode 滑动窗口题单](https://leetcode.cn/tag/sliding-window/)

## 一、为什么双指针能提速

暴力解法常常是双层循环 O(n²)。双指针利用数据的**有序性或单调性**，让两个指针各自只往一个方向走，总共走 O(n) 步。

| 类型 | 指针走法 | 典型题 |
| --- | --- | --- |
| 对撞指针 | 一左一右向中间靠 | 有序两数之和、三数之和、盛最多水的容器 |
| 快慢指针 | 同向，一快一慢 | 移除元素、移动零、链表判环 |
| 滑动窗口 | 同向，维护一个区间 | 最长无重复子串、最小覆盖子串 |

## 二、对撞指针：盛最多水的容器（LeetCode 11）

面积由短板决定。移动长板只会让宽度变小、高度不变或更小，所以每次**移动短板**。

${F}python
def max_area(h):
    l, r, ans = 0, len(h) - 1, 0
    while l < r:
        ans = max(ans, min(h[l], h[r]) * (r - l))
        if h[l] < h[r]:
            l += 1
        else:
            r -= 1
    return ans
${F}

## 三、三数之和（LeetCode 15）

先排序，固定一个数，剩下两个用对撞指针，注意去重。

${F}python
def three_sum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i - 1]:
            continue                         # 跳过重复的第一个数
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                l += 1; r -= 1
    return res
${F}

## 四、快慢指针：移动零（LeetCode 283）

${F}python
def move_zeroes(nums):
    slow = 0                       # slow 之前都是非零
    for fast in range(len(nums)):
        if nums[fast] != 0:
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow += 1
${F}

## 五、滑动窗口模板

右指针不断扩大窗口，窗口不满足条件时左指针收缩。每个元素进出窗口各一次，O(n)。

${F}python
def length_of_longest_substring(s):
    window = {}
    l = ans = 0
    for r, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1      # 1. 扩大窗口
        while window[ch] > 1:                   # 2. 不满足条件就收缩
            window[s[l]] -= 1
            l += 1
        ans = max(ans, r - l + 1)               # 3. 更新答案
    return ans
${F}

套用时只需要想清楚三件事：窗口里维护什么信息、什么时候收缩、在哪里更新答案。求**最长**一般在收缩之后更新，求**最短**一般在收缩循环里更新。

## 六、高频题清单

| 题目 | 类型 |
| --- | --- |
| 11 盛最多水的容器 | 对撞 |
| 15 三数之和 | 排序 + 对撞 |
| 42 接雨水 | 对撞（或单调栈） |
| 283 移动零 | 快慢 |
| 3 无重复字符的最长子串 | 滑动窗口 |
| 76 最小覆盖子串 | 滑动窗口 + 计数 |
| 438 找到字符串中所有字母异位词 | 定长滑动窗口 |

## ⚠ 踩坑

- 三数之和去重不完整，结果里出现重复三元组。
- 数组含负数时，"和 ≥ k 的最短子数组"不能直接用滑动窗口，因为窗口和不再单调，要用前缀和 + 单调队列。
- 窗口收缩时忘了更新计数，导致条件判断错误。

## ✅ 自检清单

- 能说出三种双指针各自的适用条件。
- 能默写滑动窗口模板并解决最长无重复子串。
- 能解释盛水容器为什么移动短板是正确的。

## 📚 延伸阅读

- labuladong：我写了一个模板，把滑动窗口算法变成了默写题
- LeetCode Hot 100：双指针、滑动窗口分类
`
          },
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "掌握回溯、动态规划、图论和贪心，能套框架解决 Hot 100 高频题。",
        chapters: [
          // <algo-adv>
          {
            id: "algo-backtrack",
            title: "回溯：排列、组合、子集与剪枝",
            minutes: 14,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "回溯", "DFS"],
            terms: ["回溯", "剪枝", "决策树", "DFS"],
            body: `
> **官方文档基线**：[Hello 算法 · 回溯](https://www.hello-algo.com/chapter_backtracking/) · [LeetCode 回溯题单](https://leetcode.cn/tag/backtracking/)

## 一、回溯是什么

回溯就是**在一棵决策树上做深度优先搜索**：每一步做一个选择，走到底后记录结果，再撤销选择回到上一步试别的路。凡是题目要求"列出所有方案"，基本都是回溯。

## 二、通用模板

${F}python
def backtrack(path, choices):
    if 满足结束条件:
        res.append(path[:])        # 注意拷贝
        return
    for c in choices:
        if 不合法(c):
            continue               # 剪枝
        path.append(c)             # 做选择
        backtrack(path, 新的选择列表)
        path.pop()                 # 撤销选择
${F}

三个要素：**路径**（已做的选择）、**选择列表**（还能选什么）、**结束条件**。

## 三、三类经典问题

| 类型 | 区别 | 控制方式 | 题目 |
| --- | --- | --- | --- |
| 排列 | 顺序不同算不同方案 | ${C}used${C} 数组标记已用元素 | 46 全排列 |
| 组合 | 顺序无关 | 传 ${C}start${C}，只往后选 | 77 组合、39 组合总和 |
| 子集 | 每个节点都是一个答案 | 传 ${C}start${C}，每层都收集 | 78 子集 |

全排列（LeetCode 46）：

${F}python
def permute(nums):
    res, path, used = [], [], [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True; path.append(x)
            dfs()
            used[i] = False; path.pop()
    dfs()
    return res
${F}

子集（LeetCode 78）：

${F}python
def subsets(nums):
    res, path = [], []
    def dfs(start):
        res.append(path[:])            # 每个节点都是一个子集
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
    dfs(0)
    return res
${F}

## 四、去重与剪枝

- **含重复元素**（47 全排列 II、40 组合总和 II、90 子集 II）：先排序，同一层里如果 ${C}nums[i] == nums[i-1]${C} 且前一个没被用，就跳过。
- **数值剪枝**：组合总和里先排序，当前和已经超过 target 就 ${C}break${C}，后面更大的不用试了。
- **可行性剪枝**：N 皇后放一个皇后前，先检查列和两条对角线是否冲突。

## 五、网格上的回溯：单词搜索（LeetCode 79）

${F}python
def exist(board, word):
    m, n = len(board), len(board[0])
    def dfs(i, j, k):
        if k == len(word):
            return True
        if not (0 <= i < m and 0 <= j < n) or board[i][j] != word[k]:
            return False
        tmp, board[i][j] = board[i][j], "#"    # 标记已访问
        found = any(dfs(i + di, j + dj, k + 1)
                    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[i][j] = tmp                        # 恢复
        return found
    return any(dfs(i, j, 0) for i in range(m) for j in range(n))
${F}

## ⚠ 踩坑

- 收集结果时写 ${C}res.append(path)${C}，后面 ${C}path${C} 被修改，结果全变成空列表，必须拷贝。
- 做了选择没撤销，状态污染下一条分支。
- 回溯复杂度通常是指数级，n 超过 20 左右就要考虑动态规划或其他方法。

## ✅ 自检清单

- 能默写回溯模板，说出三要素。
- 能区分排列、组合、子集的写法差异。
- 能处理含重复元素的去重。

## 📚 延伸阅读

- 《Hello 算法》第 13 章：回溯
- labuladong：回溯算法秒杀所有排列/组合/子集问题
`
          },
          {
            id: "algo-dp",
            title: "动态规划：解题四步、背包与经典模型",
            minutes: 18,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "动态规划"],
            terms: ["动态规划", "状态转移方程", "背包问题", "记忆化搜索"],
            body: `
> **官方文档基线**：[Hello 算法 · 动态规划](https://www.hello-algo.com/chapter_dynamic_programming/) · [LeetCode 动态规划题单](https://leetcode.cn/tag/dynamic-programming/)

## 一、什么问题适合动态规划

动态规划（DP）适合满足两个条件的问题：

- **重叠子问题**：暴力递归时同一个子问题被算了很多次。
- **最优子结构**：大问题的最优解可以由小问题的最优解推出。

题目问"最大/最小/最长/方案数/能否做到"，而且不需要列出所有方案时，优先考虑 DP。

## 二、解题四步

![动态规划解题步骤](/assets/diagrams/docs/dp-steps.svg)

1. **定义状态**：${C}dp[i]${C} 表示什么，一定要用一句完整的话写下来。
2. **找转移方程**：${C}dp[i]${C} 怎么由更小的状态得到。
3. **初始化**：最小的子问题答案是多少。
4. **确定遍历顺序**：保证算 ${C}dp[i]${C} 时依赖的状态已经算好。

## 三、从递归到递推：爬楼梯（LeetCode 70）

${F}python
from functools import lru_cache
@lru_cache(None)               # 记忆化搜索：自顶向下
def climb(n):
    if n <= 2:
        return n
    return climb(n - 1) + climb(n - 2)

def climb_dp(n):               # 递推：自底向上，空间压缩到 O(1)
    a, b = 1, 2
    for _ in range(n - 1):
        a, b = b, a + b
    return a
${F}

## 四、经典模型

| 模型 | 状态定义 | 转移方程 | 代表题 |
| --- | --- | --- | --- |
| 线性 DP | dp[i]：前 i 个的最优值 | dp[i] = max(dp[i-1], dp[i-2] + nums[i]) | 198 打家劫舍 |
| 最长递增子序列 | dp[i]：以 i 结尾的 LIS 长度 | dp[i] = max(dp[j] + 1)，j < i 且 nums[j] < nums[i] | 300 |
| 0-1 背包 | dp[j]：容量 j 的最大价值 | dp[j] = max(dp[j], dp[j-w] + v)，j 倒序 | 416 分割等和子集 |
| 完全背包 | 同上 | 同上，j 正序 | 322 零钱兑换、518 零钱兑换 II |
| 双串 DP | dp[i][j]：两串前缀的答案 | 末字符相等与不等两种情况 | 1143 LCS、72 编辑距离 |
| 网格 DP | dp[i][j]：走到 (i,j) 的答案 | 来自上方和左方 | 62 不同路径、64 最小路径和 |
| 区间 DP | dp[i][j]：区间 [i,j] 的答案 | 由更短区间推出 | 5 最长回文子串、516 |

## 五、背包问题详解

0-1 背包：每件物品最多选一次。分割等和子集（LeetCode 416）就是"能否恰好装满容量为总和一半的背包"。

${F}python
def can_partition(nums):
    s = sum(nums)
    if s % 2:
        return False
    target = s // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for x in nums:
        for j in range(target, x - 1, -1):   # 倒序，保证每个数只用一次
            dp[j] = dp[j] or dp[j - x]
    return dp[target]
${F}

完全背包：物品可以无限次选，内层改为**正序**。零钱兑换（LeetCode 322）：

${F}python
def coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount               # dp[j]：凑出 j 的最少硬币数
    for c in coins:
        for j in range(c, amount + 1):      # 正序
            dp[j] = min(dp[j], dp[j - c] + 1)
    return dp[amount] if dp[amount] != INF else -1
${F}

## 六、双串 DP：编辑距离（LeetCode 72）

${F}java
int minDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];          // dp[i][j]：a 前 i 个变成 b 前 j 个的最少操作
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[m][n];
}
${F}

## ⚠ 踩坑

- 状态定义含糊，写到一半自己也说不清 ${C}dp[i]${C} 是"前 i 个"还是"以 i 结尾"。
- 0-1 背包一维数组内层写成正序，同一物品被重复使用。
- dp 数组大小少开 1，下标 ${C}i - 1${C} 和 ${C}i${C} 混用导致越界。

## ✅ 自检清单

- 能说出 DP 的两个前提和解题四步。
- 能写出 0-1 背包和完全背包，并解释内层循环方向。
- 能独立推出 LCS 和编辑距离的转移方程。

## 📚 延伸阅读

- 《Hello 算法》第 14 章：动态规划
- 背包九讲（崔添翼）
- labuladong：动态规划解题套路框架
`
          },
          {
            id: "algo-graph",
            title: "图论：BFS/DFS、拓扑排序、最短路与并查集",
            minutes: 17,
            updated: "2026-11-20",
            applies: "Python 3 / Java 17",
            tags: ["算法", "图"],
            terms: ["图", "BFS", "拓扑排序", "Dijkstra", "并查集"],
            body: `
> **官方文档基线**：[Hello 算法 · 图](https://www.hello-algo.com/chapter_graph/) · [LeetCode 图题单](https://leetcode.cn/tag/graph/)

## 一、图的表示

图由顶点和边组成，可以有向或无向，边可以带权重。刷题中最常用**邻接表**：

| 表示 | 空间 | 查两点是否相连 | 适用 |
| --- | --- | --- | --- |
| 邻接矩阵 | O(V²) | O(1) | 稠密图、点数少 |
| 邻接表 | O(V + E) | O(度数) | 稀疏图，大多数题目 |

${F}python
from collections import defaultdict
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)        # 无向图两边都加
${F}

二维网格也是图：每个格子是顶点，上下左右相邻格子之间有边。

## 二、DFS 与 BFS

| 方式 | 数据结构 | 特点 | 用途 |
| --- | --- | --- | --- |
| DFS | 递归/栈 | 一条路走到底 | 连通块、找路径、回溯 |
| BFS | 队列 | 一圈一圈向外扩 | **无权图最短路**、层数 |

岛屿数量（LeetCode 200），DFS 把连通的陆地"淹掉"：

${F}python
def num_islands(grid):
    m, n = len(grid), len(grid[0])
    def dfs(i, j):
        if not (0 <= i < m and 0 <= j < n) or grid[i][j] != "1":
            return
        grid[i][j] = "0"
        dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1)
    count = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == "1":
                dfs(i, j); count += 1
    return count
${F}

腐烂的橘子（LeetCode 994）是**多源 BFS**：把所有腐烂橘子一起放进队列，按层扩散，层数就是分钟数。

## 三、拓扑排序

有向无环图中，把顶点排成一列，使每条边都从前指向后。常用于任务依赖、课程安排（LeetCode 207/210）。Kahn 算法：反复取出入度为 0 的点。

${F}python
from collections import deque
def can_finish(n, prerequisites):
    graph, indeg = [[] for _ in range(n)], [0] * n
    for a, b in prerequisites:          # 学 a 之前要先学 b：b -> a
        graph[b].append(a); indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    done = 0
    while q:
        u = q.popleft(); done += 1
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return done == n                    # 有环时有些点入度永远不为 0
${F}

## 四、最短路

| 算法 | 适用 | 复杂度 |
| --- | --- | --- |
| BFS | 无权图（或边权都相同） | O(V + E) |
| Dijkstra | 非负权图，单源 | O(E log V)（堆优化） |
| Bellman-Ford / SPFA | 有负权边 | O(VE) |
| Floyd | 多源，点数少（≤ 400 左右） | O(V³) |

${F}python
import heapq
def dijkstra(graph, src, n):          # graph[u] = [(v, w), ...]
    dist = [float("inf")] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue                  # 过期记录
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    return dist
${F}

## 五、并查集

并查集用来快速判断"两个点是否连通"并合并集合，配合路径压缩，单次操作接近 O(1)。

${F}python
parent = list(range(n))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]  # 路径压缩
        x = parent[x]
    return x
def union(a, b):
    parent[find(a)] = find(b)
${F}

用途：连通分量个数（547 省份数量）、判断加边是否成环（684 冗余连接）、Kruskal 最小生成树。

## ⚠ 踩坑

- BFS 在出队时才标记已访问，同一节点会被多次入队，应在**入队时**标记。
- 有权图用 BFS 求最短路，结果错误。
- Dijkstra 遇到负权边结果不对，需要换 Bellman-Ford。
- 递归 DFS 在大网格上可能栈溢出，Python 要调 ${C}sys.setrecursionlimit${C} 或改 BFS。

## ✅ 自检清单

- 能用邻接表建图，写出 DFS 和 BFS 模板。
- 能用 Kahn 算法做拓扑排序并判环。
- 能根据边权情况选择最短路算法，写出堆优化 Dijkstra。
- 能写出带路径压缩的并查集。

## 📚 延伸阅读

- 《Hello 算法》第 9 章：图
- 《算法（第 4 版）》第 4 章：图
`
          },
          {
            id: "algo-greedy-hot100",
            title: "贪心算法与 Hot 100 刷题路线",
            minutes: 14,
            updated: "2026-11-20",
            applies: "LeetCode Hot 100",
            tags: ["算法", "贪心", "刷题"],
            terms: ["贪心", "区间调度", "Hot 100", "解题框架"],
            body: `
> **官方文档基线**：[LeetCode 热题 100](https://leetcode.cn/studyplan/top-100-liked/) · [Hello 算法 · 贪心](https://www.hello-algo.com/chapter_greedy/)

## 一、贪心是什么

贪心算法每一步都选**当前看起来最好的**，不回头。它比 DP 简单高效，但只有在"局部最优能推出全局最优"时才正确。判断方法：试着举反例，举不出来再尝试证明（常用交换论证：把最优解中的某一步换成贪心选择，结果不会变差）。

## 二、经典题型

| 题型 | 贪心策略 | 代表题 |
| --- | --- | --- |
| 跳跃游戏 | 维护能到达的最远位置 | 55、45 |
| 区间调度 | 按右端点排序，尽早结束的先选 | 435 无重叠区间、452 射气球 |
| 买卖股票 | 记录历史最低价 | 121 |
| 分配问题 | 小饼干给胃口小的孩子 | 455 |
| 划分字母区间 | 记录每个字母最后出现的位置 | 763 |

跳跃游戏（LeetCode 55）：

${F}python
def can_jump(nums):
    far = 0
    for i, x in enumerate(nums):
        if i > far:
            return False          # 当前位置已经到不了
        far = max(far, i + x)
    return True
${F}

无重叠区间（LeetCode 435）：

${F}python
def erase_overlap_intervals(intervals):
    intervals.sort(key=lambda x: x[1])   # 按结束时间排序
    end, keep = float("-inf"), 0
    for s, e in intervals:
        if s >= end:
            keep += 1; end = e
    return len(intervals) - keep
${F}

## 三、贪心与 DP 怎么选

零钱兑换用面额 [1, 3, 4] 凑 6：贪心先拿 4 再拿 1、1，共 3 枚；最优是 3 + 3，共 2 枚。贪心失败，只能用 DP。**没把握时先用 DP，贪心作为优化**。

## 四、Hot 100 按专题刷

LeetCode 热题 100 覆盖了面试最常见的考点。建议按专题刷，同一专题集中练会形成模板：

| 专题 | 题号示例 | 对应章节 |
| --- | --- | --- |
| 哈希 | 1、49、128 | 哈希表 |
| 双指针 | 283、11、15、42 | 双指针与滑动窗口 |
| 滑动窗口 | 3、438 | 双指针与滑动窗口 |
| 子串 | 560、239、76 | 哈希、单调队列 |
| 链表 | 206、141、21、146 | 数组与链表 |
| 二叉树 | 94、104、102、236 | 二叉树与堆 |
| 图论 | 200、994、207、208 | 图论 |
| 回溯 | 46、78、39、79 | 回溯 |
| 二分查找 | 35、33、153 | 二分查找 |
| 栈 | 20、155、739、84 | 栈与队列 |
| 堆 | 215、347、295 | 二叉树与堆 |
| 贪心 | 121、55、45、763 | 本章 |
| 动态规划 | 70、198、322、300、1143、72 | 动态规划 |

## 五、刷题方法

1. **先想 10～15 分钟**，没思路直接看题解，不要死磕。
2. 看懂后**关掉题解自己写一遍**，能写出来才算会。
3. 每道题记三件事：属于哪个专题、关键思路一句话、踩过的坑。
4. 间隔复习：第 1、3、7 天各重做一次。
5. 面试时先说暴力解法和复杂度，再逐步优化，边写边讲。

${F}text
面试答题顺序
1. 复述题目，确认输入范围和边界（空数组、负数、重复元素）
2. 说暴力解法及复杂度
3. 提出优化思路（哈希、双指针、二分、DP……）
4. 写代码
5. 用一个小例子手动走一遍，再说最终复杂度
${F}

## ⚠ 误区

- 没验证就用贪心，在零钱兑换这类题上直接答错。
- 只刷题不总结，换个题面就认不出是同一个模型。
- 一上来写代码不沟通，面试官更看重思路表达。

## ✅ 自检清单

- 能举例说明贪心何时失效。
- 能写出跳跃游戏和区间调度的贪心解。
- 能说出 Hot 100 的主要专题和每个专题的核心模板。

## 📚 延伸阅读

- 《Hello 算法》第 15 章：贪心
- LeetCode 热题 100 官方题解
- labuladong 算法笔记：刷题框架总结
`
          },
        ]
      }
    ]
  };

  window.ALGO = ALGO;
})();
