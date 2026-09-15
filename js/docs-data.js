/* =========================================================================
 *  js/docs-data.js — 「学」版块：技术方向 × 分级 × 章节 的技术教程数据
 *
 *  设计原则（2026-09-14 定稿）：
 *   1. 一个方向一套文档，按 初级 → 中级 → 高级 分级，按顺序读即可，不做成一页内折叠
 *   2. 每篇固定含「原理 → 实战 → 踩坑 → 排障清单」，体现经验沉淀
 *   3. 每篇标注 updated / applies（技术文档最大风险是过时，这栏强制）
 *   4. 章末按 terms 关键词自动挂本知识点的题，学练闭环
 *
 *  正文为 Markdown（站点已内置 marked + highlight.js，直接复用）。
 *  注：正文里的代码围栏用 ${F}、行内代码用 ${C} 表示反引号，避免与模板字符串冲突。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

  /* ============================ 运维 / SRE ============================ */
  const OPS = {
    id: "ops",
    name: "运维 / SRE",
    icon: "🖥️",
    desc: "从「能上机器干活」到「能扛住大规模与事故」的完整成长路径。覆盖 Linux 基础、性能排障、日志与监控、K8s 集群、SLO 与事故管理。",
    levels: [
      /* ---------------- 初级 ---------------- */
      {
        id: "basic",
        name: "初级",
        desc: "能独立登录服务器完成日常操作：找文件、改配置、看进程、启停服务。",
        chapters: [
          {
            id: "fs-basics",
            title: "Linux 目录结构与文件操作",
            minutes: 12,
            updated: "2026-09-14",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "基础"],
            terms: ["Linux", "文件"],
            body: `
## 为什么先学目录结构

服务器上一切皆文件：配置在 ${C}/etc${C}、日志在 ${C}/var/log${C}、进程信息在 ${C}/proc${C}。
不知道东西该去哪找，就永远只能靠别人给命令。这一节的目标很简单：**给你一张地图**。

## 一、标准目录（FHS）速记

| 目录 | 放什么 | 常见动作 |
|---|---|---|
| ${C}/etc${C} | 系统和应用的**配置文件** | 改 Nginx/MySQL/SSH 配置 |
| ${C}/var/log${C} | 日志 | 排障第一站 |
| ${C}/var/lib${C} | 应用的**数据目录** | MySQL 数据、Docker 数据 |
| ${C}/usr/bin${C} ${C}/usr/local/bin${C} | 可执行文件 | 自己装的软件放后者 |
| ${C}/opt${C} | 第三方大型软件 | JDK、自研程序 |
| ${C}/home${C} | 普通用户家目录 | 个人文件 |
| ${C}/root${C} | root 家目录 | 只有 root 能进 |
| ${C}/tmp${C} | 临时文件（可能被清理） | 别放重要东西 |
| ${C}/proc${C} ${C}/sys${C} | 内核暴露的运行时信息 | 看进程、看内核参数 |
| ${C}/dev${C} | 设备文件 | 磁盘、null、random |

记忆口诀：**配置 etc、日志 var/log、数据 var/lib、程序 usr 与 opt、运行时 proc**。

## 二、最常用的文件操作

${F}bash
# 看
ls -lah /etc          # -l 详情 -a 含隐藏 -h 人类可读大小
cat  file             # 小文件直接看
less file             # 大文件分页看（q 退出，/ 搜索）
head -n 50 file       # 头 50 行
tail -n 100 -f file   # -f 实时跟随（看日志必备）

# 找
find /var/log -name "*.log" -mtime -1     # 1 天内修改过的日志
find / -type f -size +500M                # 大于 500M 的文件
grep -rn "ERROR" /var/log/app/            # 递归搜内容

# 空间
df -h                 # 各分区还剩多少
df -i                 # inode 还剩多少（inode 满也会写不进去！）
du -sh /var/*         # 谁占了空间
du -sh /var/* | sort -rh | head           # 按大小排序

# 增删
mkdir -p /data/app/logs      # -p 递归创建
cp -a src dst                # -a 保留属性（备份时用）
mv old new
rm -rf dir                   # ⚠ 危险，见踩坑
${F}

## 三、软链接与硬链接

${F}bash
ln -s /data/app/current /app      # 软链接：指向路径（可跨分区，源文件删了就失效）
ln    file1 file2                 # 硬链接：指向同一份数据（同分区，删一个还在）
${F}

**线上最常用的是软链接做版本切换**：发布时把 ${C}/app${C} 指向新版本目录，出问题把软链接指回去即可秒级回滚。

## 四、实战：一次典型的「磁盘满了」排查

${F}bash
df -h                                      # 1 确认哪个分区满了
du -sh /var/* | sort -rh | head            # 2 找出占空间的大目录
lsof | grep deleted                        # 3 ⚠ 文件已删但进程还占着（空间不释放）
${F}

第 3 步是最多人栽跟头的地方，详见中级「常见故障速查手册」。

## ⚠ 踩坑与经验

1. **${C}rm -rf${C} 之前一定先 ${C}ls${C} 一遍**：把路径先打出来确认，再替换成 rm。生产环境建议用 ${C}rm -ri${C} 或先 ${C}mv${C} 到 ${C}/tmp${C} 观察几天。
2. **${C}rm -rf /${C} 与变量未定义**：${C}rm -rf $DIR/*${C} 在 ${C}DIR${C} 为空时会变成 ${C}rm -rf /*${C}。Shell 脚本里一律写 ${C}rm -rf "\${DIR:?}"/*${C}，变量未定义直接报错退出。
3. **${C}/tmp${C} 会被清理**：systemd-tmpfiles 或定时任务会清，别往里放要长期留的东西。
4. **${C}df${C} 显示还有空间却写不进去**：90% 是 inode 耗尽（大量小文件），用 ${C}df -i${C} 确认。
5. **中英文与空格**：路径里有空格必须加引号，否则会被当两个参数。

## ✅ 排障清单

- [ ] 会用 ${C}df -h${C} / ${C}df -i${C} 判断是空间满还是 inode 满
- [ ] 会用 ${C}du -sh | sort -rh${C} 定位大目录
- [ ] 知道日志在 ${C}/var/log${C}、配置在 ${C}/etc${C}
- [ ] 会 ${C}tail -f${C} 实时看日志
- [ ] ${C}rm -rf${C} 前会先确认路径
`
          },
          {
            id: "perm-sudo",
            title: "用户、权限与 sudo",
            minutes: 14,
            updated: "2026-09-14",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "权限", "安全"],
            terms: ["Linux", "权限"],
            body: `
## 为什么这节最重要

初级运维 80% 的「命令执行不了」「服务起不来」「文件写不进去」，最后追下去都是**权限问题**。
把这一节吃透，能省掉大量无意义的排查时间。

## 一、rwx 到底是什么意思

${F}bash
ls -l /etc/passwd
# -rw-r--r-- 1 root root 2405 Sep  1 10:00 /etc/passwd
# ↑↑↑ ↑↑↑ ↑↑↑
#  |   |   └── 其他人 other
#  |   └────── 所属组 group
#  └────────── 所有者 user
${F}

- **文件**：${C}r${C}=能读内容，${C}w${C}=能改内容，${C}x${C}=**能当程序执行**
- **目录**：${C}r${C}=能列出里面有什么，${C}w${C}=能新建/删除里面的文件，${C}x${C}=**能进入这个目录**

⚠ **目录的 ${C}x${C} 是最容易被忽略的坑**：目录没有 ${C}x${C} 权限，即使里面有 ${C}r${C}，你也 ${C}cd${C} 不进去、访问不了任何子文件。

数字记法：${C}r=4 w=2 x=1${C}，相加即可。

${F}bash
chmod 755 file    # u=rwx(7) g=rx(5) o=rx(5)，脚本常用
chmod 644 file    # rw-r--r--，配置文件常用
chmod 600 file    # 只有自己能读写 —— 私钥/密码文件必须这个
chmod 400 file    # 只读，SSH 私钥推荐
chmod +x deploy.sh
chown -R app:app /data/app     # 改所有者，部署后必做
${F}

## 二、umask：为什么新建文件是 644

${C}umask${C} 决定默认权限：文件从 666 减、目录从 777 减。

${F}bash
umask           # 常见 022 → 文件 644、目录 755
umask 077       # 严格模式：新建只有自己能看（多用户服务器建议）
${F}

## 三、三个特殊位（懂就行，别乱设）

| 位 | 数字 | 作用 | 典型例子 |
|---|---|---|---|
| setuid | 4000 | 执行时以**文件所有者**身份运行 | ${C}/usr/bin/passwd${C} |
| setgid | 2000 | 目录中新建文件**继承目录的组** | 团队共享目录 |
| sticky | 1000 | 目录下**只有文件主能删自己的文件** | ${C}/tmp${C} |

${F}bash
chmod 2775 /data/team    # setgid：团队目录，谁建的文件组都是 team
chmod 1777 /tmp          # sticky：谁都能写，但只能删自己的
find / -perm -4000 -type f 2>/dev/null   # 安全巡检：找所有 setuid 文件
${F}

## 四、sudo 到底做了什么

${C}sudo${C} 不是「变成 root」，而是**按 /etc/sudoers 的规则，以另一个用户的身份执行这一条命令**。

${F}bash
sudo -l                  # 看自己能 sudo 什么（排查权限问题第一步）
sudo -u nginx cat /etc/nginx/nginx.conf    # 以 nginx 用户身份执行
sudo -i                  # 拿到 root 的完整登录环境（推荐）
sudo su -                # 同上，老写法
sudo -E cmd              # 保留当前环境变量
${F}

### sudoers 配置（**必须用 visudo**）

${F}bash
visudo                   # 会做语法检查，错了不让保存 —— 直接 vi 编辑可能把自己锁死
${F}

${F}bash
# 允许 ops 组无需密码执行 systemctl
%ops ALL=(ALL) NOPASSWD: /usr/bin/systemctl

# 只允许重启 nginx，别的都不行（最小权限原则）
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
${F}

## ⚠ 踩坑与经验（都是真金白银换来的）

1. **${C}sudo echo x > file${C} 会报 Permission denied**：重定向是**当前 shell** 做的，不是 sudo。正确写法：
   ${F}bash
   echo x | sudo tee file >/dev/null        # 推荐
   sudo sh -c 'echo x > file'               # 也可以
   ${F}
2. **${C}chmod 777${C} 是万恶之源**：看着问题解决了，实际是绕过。正确做法是搞清楚「谁要访问、需要什么权限」，再 ${C}chown${C} + 精确 ${C}chmod${C}。
3. **文件属主与运行用户不匹配**：部署完忘了 ${C}chown -R app:app${C}，服务以 app 用户跑却读不到 root 创建的文件 —— 这是服务启动失败的高频原因。
4. **HTTPS 私钥权限太松**：SSH 会直接拒绝使用权限为 644 的私钥，必须 600 或 400。
5. **父目录权限也要对**：即使文件是 777，只要上级目录没有 ${C}x${C}，照样访问不到。查权限要**从根往下一路查**。
6. **别用 root 跑应用**：出问题影响面大，且安全风险高。建专用用户（如 ${C}app${C}、${C}nginx${C}）。

## ✅ 排障清单

- [ ] 报错 Permission denied → 先 ${C}ls -l${C} 看属主和权限，再确认进程以哪个用户跑（${C}ps -ef | grep${C}）
- [ ] 查权限要一路查父目录的 ${C}x${C} 位
- [ ] 改 sudoers 一律 ${C}visudo${C}
- [ ] 服务部署后确认数据目录属主正确
- [ ] 私钥类文件权限 600/400
`
          },
          {
            id: "process-basics",
            title: "进程与资源查看入门",
            minutes: 12,
            updated: "2026-09-14",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "进程", "systemd"],
            terms: ["进程", "Linux"],
            body: `
## 一、进程是什么

程序是躺在磁盘上的文件，**进程是跑起来的程序**。每个进程有 PID（进程号）、PPID（父进程）、所属用户、占用的 CPU/内存。

运维日常就是：看进程在不在、占多少资源、卡在哪、怎么优雅地重启它。

## 二、查看进程

${F}bash
ps -ef | grep nginx                  # 看某个服务在不在
ps -ef --forest                      # 树状看父子关系
pstree -p                            # 更直观的进程树
ps -eo pid,ppid,user,%cpu,%mem,cmd --sort=-%mem | head    # 按内存排序

pgrep -a nginx                       # 按名字找 PID
pidof nginx
${F}

## 三、top：第一现场

${F}bash
top                 # 进入后：P 按 CPU 排、M 按内存排、1 看每核、q 退出
htop                # 更好看（需安装），支持鼠标和直接杀进程
${F}

**第一行 load average 怎么看**：

${F}
load average: 2.31, 1.85, 1.20
              1分钟 5分钟 15分钟
${F}

- load = **正在运行 + 等待运行(含等 IO)的进程数**
- 经验值：**load / CPU 核数 ≤ 1 算轻松，持续 > 1 说明有排队**
- ⚠ **load 高 ≠ CPU 高**：大量进程在等磁盘 IO 时，load 能飙到几十而 CPU 空闲。看 load 一定要配合 CPU 使用率和 IO 一起判断（详见中级性能篇）。

## 四、内存：别被 free 骗了

${F}bash
free -h
#               total   used    free   shared  buff/cache   available
# Mem:           7.7G   2.1G    512M     45M       5.1G        5.3G
${F}

**看 ${C}available${C}，不要看 ${C}free${C}**。Linux 会把空闲内存拿去做磁盘缓存（buff/cache），这部分随时可以释放给应用。${C}free${C} 很小是正常的，${C}available${C} 才是「还能用多少」。

## 五、磁盘与网络一眼看

${F}bash
df -h                      # 磁盘剩余
iostat -x 1                # 磁盘 IO（sysstat 包）
ss -lntp                   # 本机监听了哪些端口（推荐，比 netstat 快）
ss -antp | grep ESTAB | wc -l    # 当前连接数
${F}

## 六、信号：kill 不是只能 -9

| 信号 | 编号 | 含义 | 何时用 |
|---|---|---|---|
| ${C}TERM${C} | 15 | 优雅退出（默认） | **首选**，让程序保存状态、关连接 |
| ${C}INT${C} | 2 | 中断（等同 Ctrl+C） | 前台程序 |
| ${C}HUP${C} | 1 | 挂起/重载配置 | ${C}kill -HUP${C} 让 nginx 重读配置 |
| ${C}KILL${C} | 9 | 强制杀死，不可捕获 | **最后手段** |

${F}bash
kill -15 1234        # 先礼后兵
kill -9  1234        # 15 秒后还活着再 -9
pkill -f "java -jar app.jar"      # 按命令行匹配
${F}

⚠ **直接 ${C}kill -9${C} 的代价**：程序来不及刷盘、来不及释放锁、来不及从注册中心摘除，可能导致数据损坏或流量继续打进来。**永远先 ${C}-15${C}。**

## 七、前台后台与 nohup

${F}bash
cmd &                        # 放后台，但关终端就死
nohup cmd > app.log 2>&1 &   # 关终端也继续跑（输出重定向到日志）
jobs; fg; bg                 # 查看/切前台/切后台
${F}

**正经服务别用 nohup**：没有自动拉起、没有日志轮转、没有依赖管理。交给 **systemd**（见下一节的进阶内容）。

## 八、systemd 一句话入门

${F}bash
systemctl status nginx           # 看状态（报错信息基本都在这）
systemctl start|stop|restart nginx
systemctl enable nginx           # 开机自启
systemctl reload nginx           # 不中断服务重载配置（优先用这个）
journalctl -u nginx -f           # 看该服务的日志
journalctl -u nginx --since "10 min ago"
${F}

## ⚠ 踩坑与经验

1. **${C}ps aux | grep xxx${C} 总会带出 grep 自己**：用 ${C}pgrep -a${C} 或 ${C}grep [x]xx${C} 规避。
2. **进程还在但服务不可用**：进程活着 ≠ 能服务。要配合端口（${C}ss -lntp${C}）和健康检查接口判断。
3. **子进程变孤儿**：父进程被 -9 后，子进程会被 init(1) 收养，可能变成没人管的僵尸服务。
4. **僵尸进程（Z 状态）杀不掉**：它已经死了，只是父进程没回收。要杀它的**父进程**，或者让父进程正确处理 SIGCHLD。
5. **重启用 reload 不用 restart**：nginx/systemd 支持的配置重载不会断连接。

## ✅ 排障清单

- [ ] 服务「起不来」：${C}systemctl status${C} + ${C}journalctl -u${C} 看具体报错
- [ ] 服务「卡住」：${C}top${C} 看 CPU/内存，${C}ss${C} 看连接
- [ ] 杀进程先 ${C}-15${C}，等 15 秒，不行再 ${C}-9${C}
- [ ] 判断内存看 ${C}available${C} 不是 ${C}free${C}
- [ ] load 高要区分是 CPU 还是 IO 导致
`
          }
        ]
      },
      /* ---------------- 中级 ---------------- */
      {
        id: "mid",
        name: "中级",
        desc: "能独立定位性能瓶颈、搭起日志与监控、处理常见线上故障。",
        chapters: [
          {
            id: "perf-four",
            title: "性能分析四板斧：CPU / 内存 / 磁盘 / 网络",
            minutes: 18,
            updated: "2026-09-14",
            applies: "Linux 内核 3.10+",
            tags: ["性能", "排障"],
            terms: ["性能", "CPU", "内存"],
            body: `
## 一、方法论：先 USE，再往下钻

盲目 top 一圈是找不到瓶颈的。推荐 **USE 方法**（Brendan Gregg）：对每种资源依次看

- **U**tilization 使用率：资源忙不忙
- **S**aturation 饱和度：有没有排队（排队长度比使用率更早暴露问题）
- **E**rrors 错误：有没有报错

四类资源：**CPU、内存、磁盘、网络**，逐个过一遍，5 分钟就能圈定方向。

## 二、CPU

${F}bash
top                       # us(用户态) sy(内核态) id(空闲) wa(等IO) si(软中断)
vmstat 1                  # r=运行队列(>核数即排队)  cs=上下文切换  us/sy/wa
pidstat -u 1              # 每个进程的 CPU
pidstat -w 1              # 每个进程的上下文切换（切换暴增多半是锁竞争/线程过多）
${F}

**怎么看**：

- ${C}us${C} 高 → 应用自己在算（死循环、正则回溯、序列化、GC）
- ${C}sy${C} 高 → 系统调用频繁（大量小文件读写、频繁建连接、上下文切换多）
- ${C}wa${C} 高 → **不是 CPU 问题，是磁盘慢**，转磁盘章节
- ${C}si${C} 高 → 软中断集中在某核，常见于是网卡小包风暴

**Java 应用 CPU 飙高的标准定位法**：

${F}bash
top -Hp <pid>                          # 找出最耗 CPU 的线程 ID（十进制）
printf "%x\\n" <tid>                    # 转成十六进制
jstack <pid> | grep -A 30 <hex_tid>    # 直接看到是哪行代码
${F}

## 三、内存

${F}bash
free -h                    # 看 available
vmstat 1                   # si/so 非 0 = 正在交换（swap），性能会断崖下跌
sar -r 1                   # 内存趋势
${F}

**OOM 排查**：

${F}bash
dmesg -T | grep -i "out of memory"     # 内核 OOM Killer 日志
grep -i oom /var/log/messages
cat /sys/fs/cgroup/memory.max          # 容器场景看 cgroup 限制（K8s limits）
${F}

⚠ **容器里最经典的坑**：JVM 看不到 cgroup 限制，按宿主机内存算堆大小 → 一跑就 OOMKilled。
解决：JDK 8u191+ 默认支持容器感知，或用 ${C}-XX:MaxRAMPercentage=70.0${C} 显式设置（别用 ${C}-Xmx${C} 写死）。

## 四、磁盘 IO

${F}bash
iostat -x 1                # %util 接近 100 = 磁盘饱和；await 是平均等待 ms
iotop                      # 哪个进程在猛写
${F}

**关键指标**：

| 指标 | 含义 | 经验值 |
|---|---|---|
| ${C}%util${C} | 磁盘繁忙度 | 持续 > 80% 就危险了 |
| ${C}await${C} | IO 平均等待(ms) | SSD < 5ms；机械盘 > 20ms 已吃力 |
| ${C}svctm${C} | 设备服务时间 | 仅供参考 |
| ${C}r/s w/s${C} | 每秒读写次数 | 结合单次大小看 |

⚠ **${C}%util 100% 不一定代表磁盘到极限**：RAID/SSD 有并行度，要结合 ${C}await${C} 判断。真正的信号是 **await 明显上涨 + 应用变慢**。

## 五、网络

${F}bash
ss -s                      # 连接总数与各状态统计
ss -antp state established '( dport = :8080 )' | wc -l
ss -ant | awk '{print $1}' | sort | uniq -c     # 各状态连接数
sar -n DEV 1               # 网卡流量与包量（包量小但流量大 = 大包；反之小包风暴）
sar -n TCP,ETCP 1          # 重传(retrans)、建连失败
ethtool -S eth0 | grep -i drop         # 网卡丢包
${F}

**状态异常的含义**：

- **大量 TIME_WAIT**：短连接主动关闭方正常现象；多到影响端口复用才需要处理（见故障手册）
- **大量 CLOSE_WAIT**：**程序 bug** —— 对方已关闭，本地没调 close，连接泄漏
- **重传率高**：网络质量差或对端处理不过来

## 六、一把梭：一条命令看全局

${F}bash
# 安装 sysstat 后可用，10 秒出一份「哪儿不对」的总览
sar -u -r -n DEV -d 1 3
${F}

## ⚠ 踩坑与经验

1. **先看趋势再看瞬时**：瞬时 top 值很容易误导，${C}sar${C} / 监控图看 5 分钟以上趋势。
2. **别一上来就调内核参数**：90% 的性能问题在应用层（慢 SQL、无索引、死循环、连接没复用）。
3. **平均响应时间骗人**：P99 才是用户体验。一个接口平均 50ms 但 P99 3s，说明有长尾。
4. **容器里看宿主机指标会误判**：在容器里 ${C}top${C} 看到的是宿主机的 CPU 核数，要按 cgroup 限额看。
5. **保留现场**：性能问题复现难，定位到后立刻保存 ${C}jstack${C}/${C}perf${C}/${C}ss${C} 快照，再考虑重启。

## ✅ 排障清单

- [ ] USE 四问：使用率、饱和度、错误，逐个资源过
- [ ] CPU：区分 ${C}us${C} / ${C}sy${C} / ${C}wa${C} / ${C}si${C}
- [ ] 内存：${C}available${C} + ${C}si/so${C} + ${C}dmesg${C} 查 OOM
- [ ] 磁盘：${C}iostat -x${C} 看 ${C}%util${C} 与 ${C}await${C}
- [ ] 网络：${C}ss -s${C} 看状态分布，${C}sar -n${C} 看重传
- [ ] 定位后保存现场快照
`
          },
          {
            id: "log-system",
            title: "日志体系：收集、轮转与排障",
            minutes: 15,
            updated: "2026-09-14",
            applies: "systemd / rsyslog / ELK / Loki",
            tags: ["日志", "可观测性"],
            terms: ["日志"],
            body: `
## 一、日志为什么是运维的命根子

出故障时，日志是**唯一能还原现场的东西**。监控告诉你「出事了」，日志告诉你「为什么」。
但现实往往是：要么日志没打、要么打满磁盘、要么散在 50 台机器上要一台台登。

## 二、systemd 时代：journald

${F}bash
journalctl -u app -f                        # 实时跟
journalctl -u app --since "2026-09-14 10:00" --until "10:30"
journalctl -u app -p err --since today      # 只看错误级别
journalctl -k                               # 内核日志（等同 dmesg）
journalctl --disk-usage                     # 日志占了多少空间
journalctl --vacuum-size=1G                 # 清理到 1G 以内
${F}

**持久化**（默认重启后丢失，生产必须开）：

${F}bash
mkdir -p /var/log/journal && systemd-tmpfiles --create --prefix /var/log/journal
systemctl restart systemd-journald
${F}

配置 ${C}/etc/systemd/journald.conf${C}：

${F}ini
[Journal]
SystemMaxUse=2G        # 上限，防止打满磁盘
MaxRetentionSec=2week
${F}

## 三、logrotate：防止日志打爆磁盘

${F}bash
cat /etc/logrotate.d/myapp
${F}

${F}
/data/app/logs/*.log {
    daily                 # 每天轮转
    rotate 14             # 保留 14 份
    compress              # 压缩旧日志
    delaycompress         # 延后一轮再压（避免程序还握着句柄）
    missingok
    notifempty
    copytruncate          # ⚠ 程序不支持重开日志句柄时用这个
    create 0640 app app
    postrotate
        /usr/bin/systemctl reload app >/dev/null 2>&1 || true
    endscript
}
${F}

⚠ **${C}copytruncate${C} 与 ${C}postrotate${C} 二选一**：
- 程序支持收到信号重开日志（多数现代框架支持）→ 用 ${C}postrotate${C} 发 reload，不会丢日志
- 程序只会往旧 fd 写 → 用 ${C}copytruncate${C}，但**截断瞬间可能丢几行**

**自己测试配置是否正确**（别等出问题才发现没轮转）：

${F}bash
logrotate -d /etc/logrotate.d/myapp     # -d 演练，看会做什么
logrotate -f /etc/logrotate.d/myapp     # -f 强制执行一次
${F}

## 四、集中式日志：为什么必须上

单机日志只适合小项目。多台机器后必须有集中方案：

| 方案 | 特点 | 适用 |
|---|---|---|
| **ELK**（Elasticsearch + Logstash/Fluentd + Kibana） | 功能全、检索强，但重 | 中大型、需要复杂检索 |
| **Loki + Promtail + Grafana** | 轻量、按标签索引、成本低 | 已有 Grafana/Prometheus 栈 |
| 云厂商日志服务 | 开箱即用，按量付费 | 不想自己维护 |

**采集侧推荐 Filebeat / Promtail / Fluent Bit**，比 Logstash 轻得多。

## 五、日志该怎么写（给开发的规范）

运维能主导的一条：把日志规范写进上线标准。

1. **必须带 traceId/requestId**：一次请求跨多个服务全靠它串起来
2. **结构化（JSON）**：便于检索与聚合，别用纯文本拼接
3. **级别要准**：ERROR = 需要人处理；WARN = 需要关注；INFO = 关键节点；DEBUG 不上生产
4. **别打敏感信息**：密码、身份证、token 必须脱敏（合规红线）
5. **别在循环里打日志**：高并发下能直接把磁盘打满

${F}json
{"ts":"2026-09-14T10:23:11.123+08:00","level":"ERROR","traceId":"a1b2c3",
 "service":"order","msg":"create order failed","userId":10086,"err":"timeout"}
${F}

## ⚠ 踩坑与经验

1. **日志打满磁盘导致整机故障**：最常见的自伤。必须配 logrotate + journald 限额 + 磁盘告警（>80% 就报）。
2. **时间不同步导致排查崩溃**：多台机器日志对不上时间，等于白打。**所有机器必须 NTP 同步**，用 ${C}timedatectl${C} 确认，容器里注意时区（很多镜像默认 UTC）。
3. **日志丢失**：异步写缓冲未刷盘就 ${C}kill -9${C}；或 logrotate 与程序句柄没配合好。
4. **DEBUG 日志忘关**：一次压测把磁盘写满的经典原因。
5. **只打「发生了什么」，不打「为什么」**：错误信息要带上关键上下文（用户 ID、订单号、参数摘要），否则等于没打。

## ✅ 排障清单

- [ ] journald 已持久化且有容量上限
- [ ] 应用日志配了 logrotate，且验证过（${C}logrotate -d${C}）
- [ ] 多机环境有集中日志，支持 traceId 检索
- [ ] 所有机器 NTP 同步、时区一致
- [ ] 磁盘使用率有告警（80% 预警）
- [ ] 日志里无明文敏感信息
`
          },
          {
            id: "troubleshoot-manual",
            title: "常见故障速查手册",
            minutes: 20,
            updated: "2026-09-14",
            applies: "通用",
            tags: ["故障", "手册"],
            terms: ["故障", "排查"],
            body: `
> 这一篇是**可以按 Ctrl+F 搜症状的救命手册**。每个条目：现象 → 一句话定性 → 定位命令 → 处理。

## 1. 磁盘满了，但 du 加起来对不上

**定性**：文件被删除了，但还有进程持有它的句柄，空间没释放。

${F}bash
df -h                                   # 确认满
lsof | grep -i deleted                  # 找被删但还占着的（看 SIZE 列）
# 处理：重启对应进程即可释放；不想重启可临时清空
: > /proc/<pid>/fd/<fd号>               # ⚠ 谨慎，确认是日志文件
${F}

**预防**：删除大日志用 ${C}> file${C} 截断而不是 ${C}rm${C}，或配好 logrotate。

## 2. No space left on device，但 df 显示还有空间

**定性**：**inode 耗尽**（海量小文件），不是空间不够。

${F}bash
df -i                                   # IUse% 100% 即中招
for d in /var/*; do echo $(find $d -type f | wc -l) $d; done | sort -rn | head
${F}

**常见元凶**：邮件队列 ${C}/var/spool/postfix/maildrop${C}、session 文件、容器临时层、日志碎片。

## 3. 服务被 OOM 杀掉

${F}bash
dmesg -T | grep -i "out of memory"      # 看是谁被杀、当时的内存
journalctl -k | grep -i oom
cat /sys/fs/cgroup/memory.max           # 容器里看限制
${F}

**处理顺序**：① 确认是内存真不够还是 limit 设太小 → ② JVM 类检查堆参数是否容器感知 → ③ 加内存或加 swap 缓冲 → ④ 查内存泄漏（周期性上涨后突然掉底 = 泄漏特征）。

## 4. 端口被占用 / 服务起不来

${F}bash
ss -lntp | grep :8080                   # 谁占着
lsof -i :8080
# 确认可以杀再杀
kill -15 <pid>
${F}

⚠ 别急着杀：先确认是不是**上一个实例还没退出干净**（常见于重启逻辑没等待）。

## 5. TIME_WAIT 过多

**先判断是不是问题**：TIME_WAIT 是主动关闭方的正常状态，会占用端口但**不占内存描述符**。

${F}bash
ss -ant | awk '{print $1}' | sort | uniq -c
cat /proc/sys/net/ipv4/ip_local_port_range      # 可用端口范围
${F}

**要处理的情况**：作为客户端大量短连接（压测、爬虫、调用下游）导致端口耗尽，报 ${C}Cannot assign requested address${C}。

${F}bash
# 方案（按优先级）：
# 1. 改长连接 / 连接池 —— 根治
# 2. 让对端（服务端）主动关闭，TIME_WAIT 落在对方
sysctl -w net.ipv4.tcp_tw_reuse=1        # 允许复用 TIME_WAIT 连接（仅对客户端有效）
# ❌ 不要开 tcp_tw_recycle —— NAT 环境下会导致连接被随机丢弃，内核 4.12+ 已移除
${F}

## 6. CLOSE_WAIT 堆积

**定性**：**100% 是程序 bug**。对方已关闭连接，本地没调 ${C}close()${C}，连接泄漏。查代码里 http client 是否每次都关闭响应体。

## 7. DNS 解析慢导致接口超时

${F}bash
time nslookup api.example.com
cat /etc/resolv.conf                     # 检查 DNS 服务器
# 常见坑：resolv.conf 里配了不可达的 DNS，每次解析都要等超时
${F}

**优化**：应用内 DNS 缓存、${C}nscd${C}/${C}systemd-resolved${C}、容器里注意 ${C}ndots${C} 配置导致多次无效查询。

## 8. 证书过期导致 HTTPS 全线失败

${F}bash
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
${F}

**预防**：证书有效期监控（剩余 < 30 天告警）+ 自动续期（acme.sh / cert-manager）。这是**完全可以自动化却最常翻车**的一项。

## 9. 服务器时间漂移

${F}bash
timedatectl status                       # 看 NTP synchronized 是否为 yes
chronyc sources -v                       # chrony
ntpq -p                                  # ntpd
${F}

影响：证书校验失败、日志对不上、分布式锁异常、定时任务错乱。

## 10. 改了配置但不生效

按顺序自查：① 改的是**正确的配置文件**（有些程序加载顺序会覆盖）→ ② 语法检查（${C}nginx -t${C}、${C}sshd -t${C}）→ ③ 是 reload 还是 restart → ④ 是否有多处配置 / 容器里改的是宿主机的文件。

## ⚠ 通用经验（比具体命令更重要）

1. **止损优先于定位**：先恢复服务（重启/回滚/扩容/摘流量），再慢慢查原因。
2. **保留现场**：重启前先 ${C}jstack${C}/${C}jmap${C}/${C}ss${C}/${C}dmesg${C}/${C}top -H${C} 存一份，否则重启后无法复盘。
3. **先看「改了什么」**：80% 的故障与最近的变更有关 —— 发布时间、配置变更、流量变化。
4. **不要同时做多个改动**：排障时一次只改一处，否则无法判断哪个生效。
5. **记录时间线**：故障处理的每一步记下时间，事后复盘的原材料。

## ✅ 随身清单

- [ ] 磁盘满 → ${C}df -h${C} / ${C}df -i${C} / ${C}lsof | grep deleted${C}
- [ ] 服务没了 → ${C}dmesg${C} 查 OOM、${C}systemctl status${C} 看状态
- [ ] 端口起不来 → ${C}ss -lntp${C}
- [ ] 连接异常 → ${C}ss -ant${C} 看状态分布
- [ ] 接口慢 → DNS、下游、磁盘 IO 依次排除
- [ ] 每次操作前想好「怎么回滚」
`
          }
        ]
      },
      /* ---------------- 高级 ---------------- */
      {
        id: "adv",
        name: "高级",
        desc: "能设计可靠架构、用 SLO 量化稳定性、主导事故复盘与变更管理。",
        chapters: [
          {
            id: "k8s-ops",
            title: "Kubernetes 集群运维要点",
            minutes: 22,
            updated: "2026-09-14",
            applies: "Kubernetes 1.24+",
            tags: ["K8s", "云原生"],
            terms: ["Kubernetes", "K8s", "容器"],
            body: `
## 一、先建立正确的心智模型

K8s 的核心是**声明式**：你告诉它「我要 3 个副本跑这个镜像」，控制面持续对比实际状态并自动收敛。
所以排障的第一性问题永远是：**期望状态是什么？实际状态是什么？谁在阻止收敛？**

${F}bash
kubectl get pod -n prod -o wide          # 实际状态
kubectl describe pod <pod> -n prod       # ⚠ Events 在最后，90% 的原因在这
kubectl get events -n prod --sort-by=.lastTimestamp | tail -30
${F}

## 二、Pod 生命周期与典型异常

| 状态 | 常见原因 | 定位 |
|---|---|---|
| **Pending** | 资源不足、节点污点、PVC 未绑定 | ${C}describe${C} 看 Events（FailedScheduling） |
| **ImagePullBackOff** | 镜像名/标签错、私有仓库没配 secret | ${C}describe${C} + 手动 ${C}docker pull${C} 验证 |
| **CrashLoopBackOff** | 程序启动即退出（配置错、依赖连不上、探针太严） | ${C}kubectl logs --previous${C} 看上次崩溃日志 |
| **Running 但不可用** | 探针没配或配错、就绪探针失败 | ${C}kubectl get pod -o wide${C} 看 READY 列 |
| **Evicted** | 节点资源压力（磁盘/内存） | ${C}kubectl describe node${C} |

**黄金命令**：

${F}bash
kubectl logs <pod> -n prod --previous           # 上一次崩溃的日志（CrashLoop 必看）
kubectl exec -it <pod> -n prod -- sh
kubectl get pod <pod> -o yaml                   # 看最终生效的完整定义
kubectl describe node <node>                    # 节点资源与污点
kubectl top pod -n prod                         # 实际用量（需 metrics-server）
${F}

## 三、资源配额：request 与 limit 怎么设

${C}requests${C} 决定**调度**（往哪放），${C}limits${C} 决定**上限**（超了会被限流或杀掉）。

${F}yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2"
    memory: "2Gi"
${F}

**经验**：

- **CPU limit 慎用**：CPU 是可压缩资源，设了 limit 会在空闲时被无谓限流（CFS throttling），导致 P99 抖动。很多团队**只设 request 不设 CPU limit**。
- **Memory limit 必须设**：内存不可压缩，不设的话一个 Pod 泄漏能拖垮整个节点。
- **JVM 容器化**：务必让它按 cgroup 感知（JDK 8u191+ / JDK 11+ 默认支持），堆上限设为 memory limit 的 60~75%。
- **QoS 等级**：Guaranteed（request=limit）最不容易被驱逐，关键服务用它。

## 四、调度控制

- **亲和/反亲和**：让同类 Pod 分散到不同节点（避免单点）
- **污点与容忍**：专用节点（GPU、高性能盘）
- **拓扑分布约束（TopologySpreadConstraints）**：比反亲和更精细，推荐新项目用它

${F}yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: kubernetes.io/hostname
  whenUnsatisfiable: ScheduleAnyway
  labelSelector:
    matchLabels:
      app: order
${F}

## 五、网络：三层要分清

1. **CNI（Pod 网络）**：Flannel（简单、无策略）/ Calico（支持网络策略、性能好）/ Cilium（eBPF，可观测性强）
2. **Service**：ClusterIP（集群内）/ NodePort / LoadBalancer。kube-proxy 的 iptables 模式在大规模下规则膨胀，IPVS 模式更稳
3. **Ingress**：Ingress-Nginx / Traefik / Gateway API（新标准）

**必配 NetworkPolicy**：默认全通是巨大的安全与故障扩散隐患。

## 六、存储

- ${C}emptyDir${C}：Pod 删除就没了，只做临时缓存
- ${C}hostPath${C}：绑定节点，调度漂移会丢数据，慎用
- ${C}PVC + StorageClass${C}：有状态服务的正解
- **有状态服务优先考虑用云厂商托管**（RDS/Redis），别在 K8s 里自建数据库，除非你很清楚代价

## 七、集群运维 Checklist

- [ ] **高可用**：etcd 奇数节点（3/5）、控制面多实例、节点跨可用区
- [ ] **备份**：etcd 定期快照 + 定期演练恢复（没演练过的备份等于没有）
- [ ] **升级**：先升控制面再升节点；一次升一个小版本；提前看 deprecated API（用 ${C}pluto${C} / ${C}kubent${C} 扫描）
- [ ] **限额**：每个命名空间配 ResourceQuota + LimitRange，防止一个应用拖垮集群
- [ ] **PDB（PodDisruptionBudget）**：保证主动驱逐时最小可用副本数
- [ ] **可观测性**：metrics（Prometheus）+ logs（Loki/ELK）+ traces（Jaeger/Tempo）
- [ ] **禁止 latest 标签**：无法回滚、无法追溯

## ⚠ 踩坑与经验

1. **没配 readinessProbe 就上线**：Pod 还没预热完就被塞流量，发布期间大量 5xx。**就绪探针是必配项**。
2. **探针打到同一个重接口**：探针超时会杀掉正常的 Pod。探针要独立且轻量（如 ${C}/healthz${C}）。
3. **所有副本在同一节点**：没配反亲和，一个节点挂了服务全没。
4. **滚动发布太快**：${C}maxSurge/maxUnavailable${C} 全开，瞬间全换掉。生产建议保守配置 + 合理配置 ${C}minReadySeconds${C}。
5. **容器里用 root 跑**：安全合规风险，配 ${C}runAsNonRoot: true${C} + ${C}securityContext${C}。
6. **ConfigMap/Secret 改了不重启**：多数程序启动时才读配置，需要配合滚动重启（${C}kubectl rollout restart${C}）。
7. **etcd 磁盘慢导致整个集群抖**：etcd 对磁盘延迟极敏感，必须 SSD，且监控 fsync 延迟。

## ✅ 排障清单

- [ ] 先看 ${C}describe${C} 的 Events，再看 ${C}logs --previous${C}
- [ ] Pending → 调度资源/污点；CrashLoop → 上次日志；ImagePull → 镜像与 secret
- [ ] 探针、resources、反亲和三项是上线基本配置
- [ ] 变更前确认能回滚（镜像 tag 固定、有历史版本）
`
          },
          {
            id: "slo-sli",
            title: "SLO / SLI / 错误预算：把稳定性量化",
            minutes: 18,
            updated: "2026-09-14",
            applies: "通用方法论",
            tags: ["SRE", "稳定性"],
            terms: ["可用性"],
            body: `
## 一、三个概念，一句话分清

| 概念 | 是什么 | 谁关心 | 例子 |
|---|---|---|---|
| **SLI** | 指标（怎么测） | 工程 | 成功请求数 / 总请求数 |
| **SLO** | 内部目标（要多少） | 工程与业务 | 30 天成功率 ≥ 99.9% |
| **SLA** | 对外的合同承诺（没达到要赔） | 法务/客户 | 99.5%，未达标赔付代金券 |

**核心原则：SLA 是给客户的，SLO 是给自己的。SLO 应该比 SLA 更严格**，留出缓冲。

## 二、怎么选 SLI

好的 SLI 满足：**用户可感知、可测量、能反映真实体验**。

常用 SLI：

- **可用性**：${C}成功请求数 / 有效请求数${C}（HTTP 5xx 和超时算失败）
- **延迟**：${C}响应时间 < 阈值的请求占比${C}（如 < 300ms 占 99%）
- **吞吐/质量**：如消息不丢失率、数据新鲜度

⚠ **踩坑**：别拿「服务器 CPU/磁盘」当 SLI —— 用户感知不到。CPU 100% 但用户无感，就不该报警。

## 三、99.9% 到底意味着什么

| 可用性 | 每月可 downtime | 每年 |
|---|---|---|
| 99% | 7.3 小时 | 3.65 天 |
| 99.9% | 43.8 分钟 | 8.76 小时 |
| 99.99% | 4.4 分钟 | 52.6 分钟 |
| 99.999% | 26 秒 | 5.26 分钟 |

**每多一个 9，成本通常是数量级上升**。SLO 不是越高越好 —— 要和业务方一起定：**用户能接受多差？做到多好值这个成本？**

## 四、错误预算（Error Budget）

SLO 的反向表达：**99.9% 的可用性 = 每月 43.8 分钟的错误预算**。

**它的价值在于把「稳定 vs 快速迭代」的争论变成数据决策**：

- 预算充足 → 可以激进发布、做有风险的变更、跑实验
- 预算耗尽 → **冻结非必要变更**，全部精力投入稳定性改进

这是 SRE 里最优雅的机制：不再靠「感觉」吵架，靠预算说话。

## 五、告警：多窗口多燃烧率（Google 推荐）

不要用「成功率低于 99.9% 就告警」—— 太迟钝。用**燃烧率**：预算被消耗的速度。

| 窗口 | 燃烧率 | 含义 | 告警 |
|---|---|---|---|
| 1 小时 | 14.4 | 按此速度 2 天耗尽 30 天预算 | 紧急（Page） |
| 6 小时 | 6 | 5 天耗尽 | 紧急 |
| 3 天 | 1 | 30 天耗尽 | 工单（Ticket） |

${F}
告警条件：错误率 > (1 - SLO) × 燃烧率
例：SLO=99.9%，1 小时窗口燃烧率 14.4
    → 1 小时内错误率 > 0.1% × 14.4 = 1.44% 则告警
${F}

**好处**：既能快速发现严重故障（1 小时窗口），又不会因为短暂抖动就半夜叫醒人（短窗口 + 高阈值）。

## 六、落地步骤（从 0 到 1）

1. **选一个最关键的用户旅程**（如「下单」），不要一上来全站铺开
2. **定 SLI 与 SLO**：和業務方一起，先粗后细，写下来
3. **接数据**：Prometheus / 云监控，把 SLI 做成可查询的指标
4. **配多窗口告警**
5. **定错误预算策略**：耗尽了怎么办？谁有权决定？—— 这一步最需要管理层支持
6. **月度复盘**：看预算消耗，决定是否投入稳定性工作

## ⚠ 踩坑与经验

1. **SLO 定成 100%**：等于禁止任何变更，也做不到。**100% 是错误的目标**。
2. **SLO 定得太严导致告警疲劳**：团队开始忽略告警，比没有告警更糟。宁可先松，慢慢收紧。
3. **只有技术指标，没有业务视角**：SLO 应该围绕用户旅程定，不是围绕组件定。
4. **把 SLO 当 KPI 考核个人**：会导致瞒报、美化数据。SLO 是**团队共同的健康指标**。
5. **不做预算策略**：定了 SLO 但耗尽了没人管，等于没定。
6. **忘了排除合理的失败**：如客户端 4xx 不该算进服务端错误预算，需要先定义「有效请求」。

## ✅ 落地清单

- [ ] 选定 1~2 条核心用户旅程
- [ ] 定义清晰的 SLI 计算公式（含什么算有效请求）
- [ ] SLO 与业务方共同确认，并写进文档
- [ ] 数据可观测（有 Dashboard）
- [ ] 多窗口多燃烧率告警已生效
- [ ] 错误预算耗尽的处理流程与责任人明确
- [ ] 每月复盘
`
          },
          {
            id: "incident-review",
            title: "事故复盘与变更管理",
            minutes: 18,
            updated: "2026-09-14",
            applies: "通用方法论",
            tags: ["SRE", "流程"],
            terms: ["故障", "变更"],
            body: `
## 一、先说最重要的事：止损优先

故障发生时的第一优先级**永远是恢复服务**，不是找根因。

顺序：**止损 → 收敛影响 → 定位 → 根治**。

常见的止损手段（按见效速度）：回滚 > 摘流量/降级 > 扩容/重启 > 限流 > 修数据。
**能在 1 分钟内回滚的，不要在 10 分钟内定位。**

## 二、应急响应：角色分工

大故障最怕一群人围着一台机器各说各话。明确角色：

| 角色 | 职责 |
|---|---|
| **IC（Incident Commander）** | 唯一决策者，不亲自动手；分配任务、控制节奏 |
| **Ops Lead** | 执行变更操作（回滚、扩容） |
| **Communicator** | 对内对外同步进展（让其他人别来打断） |
| **Scribe** | 记录时间线（复盘的唯一依据） |

**小故障可以一人兼多角，但 IC 必须明确**——有人负责「看着全局」，而不是所有人都在低头查日志。

## 三、故障分级

| 级别 | 判定 | 响应 |
|---|---|---|
| P0 | 核心业务全面不可用 / 资金损失 | 立即召人，IC 上线，实时通报 |
| P1 | 核心功能严重受损、大量用户受影响 | 30 分钟内响应 |
| P2 | 部分功能异常、有替代方案 | 工作时间处理 |
| P3 | 轻微问题、不影响主流程 | 排期 |

**分级标准要提前定好并公开**，否则现场一定会为「这算 P0 还是 P1」吵起来。

## 四、复盘怎么做（Blameless）

**核心原则：对事不对人。** 如果复盘会变成批斗会，下次就没人敢说真话，你也拿不到真实原因。

### 复盘文档标准结构

1. **摘要**：一句话说清发生了什么、影响范围、持续时长
2. **时间线**（最重要）：从「故障开始」到「恢复」的每一分钟
   - 几点几分发生、几点几分发现、几点几分止损、几点几分完全恢复
   - ⚠ 一定要区分**发生时间 / 发现时间 / 恢复时间** —— 发现太慢往往比故障本身更值得改
3. **影响**：受影响用户数、订单量、金额、SLO 预算消耗
4. **根因**：连续追问「为什么」，直到找到**系统性问题**（不是「某人操作失误」就停）
5. **做对了什么**：也值得记录（比如告警及时、回滚快）
6. **行动项**：每条有 **负责人 + 截止时间 + 优先级**，并跟踪到关闭

### 根因追问示例

${F}
服务不可用
→ 为什么？数据库连不上
→ 为什么？连接池打满
→ 为什么？慢查询堆积
→ 为什么？昨天上线的 SQL 没走索引
→ 为什么？发布流程没有 SQL 审核环节   ← 这才是要改的系统性问题
${F}

## 五、变更管理：绝大多数故障来自变更

行业共识：**70%~80% 的故障由变更引起**（发布、配置、数据变更、基础设施调整）。

### 变更三板斧

1. **可灰度**：先 1% → 10% → 50% → 100%，每档观察
2. **可监控**：变更前后有明确的指标对比（错误率、延迟、SLO 消耗）
3. **可回滚**：**这是底线**。没有回滚方案的变更不许上线

### 变更检查清单

- [ ] 回滚方案是什么？验证过吗？
- [ ] 影响范围评估过吗？（依赖方、数据兼容性）
- [ ] 有灰度计划吗？观察指标是什么？
- [ ] 需要在低峰期做吗？
- [ ] 数据库变更：是否可回滚？是否有大表 DDL 风险？
- [ ] 通知了相关方吗？（值班、客服、依赖团队）

### 高危操作特别对待

删数据、 DROP TABLE、改路由、证书更换、集群升级 —— 一律要求**双人复核 + 先在预发演练**。

## 六、把经验变成制度

故障的最大浪费是：**同一个坑掉进去两次**。

有效的做法：

- **复盘行动项必须闭环**：下个复盘会先回顾上次的行动项完成情况
- **沉淀为检查清单**：把踩过的坑写进上线 CheckList
- **做成自动化拦截**：最理想的沉淀是「系统不让你犯错」（CI 卡住没审核的 SQL、发布系统强制灰度）
- **定期演练**：故障演练（混沌工程）与回滚演练，没演练过的预案等于没有

## ⚠ 踩坑与经验

1. **只追责不改系统**：罚了当事人，流程没变，下次换个人照样出。
2. **复盘文档写了没人看**：要公开、要检索、要在下次变更时能被翻出来。
3. **行动项没有截止时间和负责人**：等于没写。
4. **没有时间线**：事后谁都记不清几点发生了什么，复盘变成扯皮。**Scribe 角色不能省**。
5. **只关注技术原因，忽略「为什么发现这么慢」「为什么止损这么慢」**：监控与止损能力的改进，往往比修那个 bug 价值大得多。
6. **把「重启就好了」当结论**：重启恢复后如果不继续查，故障一定复发。

## ✅ 随身清单

- [ ] 故障发生：先止损，再定位
- [ ] 明确 IC，指定 Scribe 记时间线
- [ ] 记录发生 / 发现 / 恢复三个时间点
- [ ] 复盘对事不对人，根因追问到系统层面
- [ ] 行动项有负责人 + 截止时间 + 跟踪闭环
- [ ] 任何变更：可灰度、可监控、可回滚
`
          }
        ]
      }
    ]
  };

  /* ============================ 其他方向（目录先行） ============================
   * 内容尚未撰写，先把目录骨架放出来：既是给用户看全貌，也是内容待办清单。 */
  function skeleton(id, name, icon, desc, plan) {
    return {
      id, name, icon, desc, skeleton: true,
      levels: plan.map((lv, i) => ({
        id: ["basic", "mid", "adv"][i],
        name: lv[0],
        desc: lv[1],
        chapters: lv[2].map((t, j) => ({
          id: id + "-" + ["basic", "mid", "adv"][i] + "-" + (j + 1),
          title: t, minutes: 0, updated: "", applies: "", tags: [], terms: [], body: ""
        }))
      }))
    };
  }

  // devops / security 仍建设中，先用骨架占位（既是全貌也是内容待办）。
  // 注意：java / frontend / dba / network 四个方向已由 js/docs/*.js 在 index.html 中
  // 先于本文件加载并写入 window.*，这里不再放骨架，避免重复与死代码。
  const DIRS = [
    skeleton("devops", "云原生 / DevOps", "☁️", "容器、CI/CD、IaC 与交付效率。", [
      ["初级", "会用工具完成交付。",
        ["Docker 镜像与容器操作", "Git 与代码评审", "CI 流水线基本配置", "Linux 与网络基础"]],
      ["中级", "能搭建与维护交付体系。",
        ["Dockerfile 最佳实践与镜像瘦身", "CI/CD 流水线设计", "K8s 部署与 Helm", "基础设施即代码（Terraform）", "制品与版本管理"]],
      ["高级", "能设计平台与推进工程效能。",
        ["GitOps 与持续交付", "多集群与多环境管理", "发布策略（蓝绿/金丝雀）", "工程效能度量与改进", "平台化建设"]]
    ]),
    skeleton("security", "安全", "🔐", "Web 安全、渗透测试与加固合规。", [
      ["初级", "建立安全意识。",
        ["Web 安全基础（OWASP Top 10）", "常见漏洞原理（SQLi/XSS/CSRF）", "Linux 安全基线"]],
      ["中级", "能做漏洞发现与修复。",
        ["渗透测试流程与工具", "认证与授权设计", "加密与密钥管理", "日志审计与入侵排查"]],
      ["高级", "能做安全体系建设。",
        ["安全开发生命周期（SDL）", "WAF 与风控体系", "应急响应与取证", "合规与数据安全治理"]]
    ])
  ];

  window.DOCS = {
    version: "1.1",
    updated: "2026-09-15",
    // 侧栏顺序：运维/SRE → Java 后端 → 网络与操作系统 → 数据库/DBA → 前端 Web
    //           →(devops / security 仍建设中，置后)
    dirs: [
      OPS,
      window.JAVA, window.NETWORK, window.DBA, window.FRONTEND,
      ...DIRS
    ]
  };
})();
