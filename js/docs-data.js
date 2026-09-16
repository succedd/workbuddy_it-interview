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

  /* ============================ 云原生 / DevOps & 安全 ============================
   * 这两个方向已补齐完整实战正文（与 ops / java 等方向同结构）。 */
  const DEVOPS = {
    id: "devops",
    name: "云原生 / DevOps",
    icon: "☁️",
    desc: "从「会装会用工具」到「能设计交付平台与工程效能体系」。覆盖容器、CI/CD、K8s/Helm、IaC、GitOps、发布策略与平台工程。",
    levels: [
      /* ---------------- 初级 ---------------- */
      {
        id: "basic",
        name: "初级",
        desc: "会用工具完成日常交付：打包镜像、提交代码、跑通一条流水线、看懂基础网络。",
        chapters: [
          {
            id: "devops-basic-1",
            title: "Docker 镜像与容器操作",
            minutes: 14,
            updated: "2026-09-16",
            applies: "Docker 20.10+ / Linux / macOS",
            tags: ["Docker", "容器"],
            terms: ["Docker", "容器", "镜像"],
            body: `
## 为什么先学 Docker

现代交付的最小单元不是「一台装好环境的机器」，而是**一个可复制、不可变的镜像**。
DevOps 里 90% 的「我本地能跑」问题，根源都是环境不一致；容器把代码和环境一起打包，从根上消除它。

## 一、镜像与容器的关系

- **镜像（Image）**：只读模板，像「安装光盘」，由多层只读层叠加而成。
- **容器（Container）**：镜像的运行实例，在镜像之上加一层可写层，像「装好光盘正在跑的电脑」。

${F}bash
docker images                      # 看本地有哪些镜像
docker ps -a                       # 看所有容器（含已退出的）
docker run -d -p 8080:80 --name web nginx:alpine   # 后台起一个 nginx
docker exec -it web sh             # 进容器里看一眼
docker logs -f web                # 看容器日志
docker stop web && docker rm web  # 停并删
${F}

## 二、从零打一个镜像

新建 ${C}Dockerfile${C}：

${F}dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
${F}

${F}bash
docker build -t myapp:1.0 .
docker run -p 3000:3000 myapp:1.0
${F}

## 三、数据怎么留下来

容器一删，可写层也没了。**持久化数据必须挂卷（volume）**：

${F}bash
docker volume create appdata
docker run -v appdata:/data myapp
# 千万别把数据库文件写在容器内部不挂卷！
${F}

## ⚠ 踩坑与经验

1. **容器里 PID 1 的进程死了，容器就退出**：前台跑的必须是主进程，别用 ${C}nohup ... &${C} 把主进程弄成后台。
2. **数据不挂卷 = 容器一删全没**：数据库、上传文件、日志一律挂 volume 或 bind mount。
3. **exit code 非零会被编排平台判失败**：脚本里 ${C}set -e${C} 要谨慎，别因无关命令失败导致容器起不来。
4. **别用 ${C}latest${C} 标签上生产**：版本漂移会让「同一镜像名」在不同机器跑出不同内容，无法回滚。
5. **镜像里别写密钥**：构建上下文可能进镜像层，用运行时挂载或 secret 注入。

## ✅ 排障清单

- [ ] 分得清镜像和容器，会用 ${C}ps${C}/${C}images${C}/${C}logs${C}/${C}exec${C}
- [ ] 能写最小 Dockerfile 并 ${C}build${C}/${C}run${C} 起来
- [ ] 知道数据必须挂卷持久化
- [ ] 不用 ${C}latest${C} 上生产，固定版本号
`
          },
          {
            id: "devops-basic-2",
            title: "Git 与代码评审",
            minutes: 16,
            updated: "2026-09-16",
            applies: "Git 2.x",
            tags: ["Git", "协作"],
            terms: ["Git", "分支", "PR"],
            body: `
## 为什么协同先学 Git

代码评审（Code Review）是现代工程协作的底线：它不是「找茬」，而是**在合并前共享上下文、拦截低级错误、沉淀团队规范**。
而评审的前提，是每个人都清楚自己的改动落在哪、怎么干净地交出去。

## 一、三个区的概念

${F}bash
# 工作区(你改的文件) → 暂存区(index) → 本地仓库 → 远端
git status                 # 看当前站在哪、哪些改了没暂存
git add -p                 # 交互式挑着加，避免把调试代码一起提交
git commit -m "feat: 支持导出 CSV"
git push origin feature/x  # 推到远端分支
${F}

## 二、一条干净的评审流程

1. 从最新的 ${C}main${C} 切出 ${C}feature/x${C} 分支开发。
2. 小步提交，commit message 写「为什么」而不是「改了什么」。
3. 提 PR/MR 前先 ${C}git rebase main${C} 让历史线性、无多余 merge。
4. 自审 diff，确认没把密钥、注释、调试代码带进去。
5. 指定 reviewer，描述「这个改动要解决什么、怎么测的」。

## 三、rebase 还是 merge

${F}bash
git rebase main   # 把你的提交「重放」到 main 最新之上，历史干净（推荐本地用）
git merge main    # 产生一个 merge commit，保留真实分支拓扑（推荐集成分支用）
${F}

**经验**：自己分支没推过远端前，放心 rebase；已经推给别人 review 了，就别再 rebase 改写历史。

## ⚠ 踩坑与经验

1. **${C}git push --force${C} 是危险操作**：会覆盖远端历史，误伤他人提交。协作分支用 ${C}--force-with-lease${C}。
2. **大文件别直接进 Git**：用 Git LFS 或对象存储，否则仓库越来越胖、clone 越来越慢。
3. **merge 冲突先别慌**：${C}git status${C} 看冲突文件，${C}<<<<<<<${C} 之间是你要保留的内容，解决后 ${C}git add${C} 再提交。
4. **${C}.gitignore${C} 尽早加**：日志、node_modules、env、构建产物别进库。
5. **commit 粒度适中**：一个 commit 做一件事，方便回滚和 bisect。

## ✅ 排障清单

- [ ] 理解工作区/暂存区/仓库/远端四区
- [ ] 会用 ${C}add -p${C} 选择性提交
- [ ] 能走通 feature 分支 + rebase + PR 流程
- [ ] 知道 rebase 与 merge 的取舍
- [ ] 配好 ${C}.gitignore${C}，不提交密钥和构建产物
`
          },
          {
            id: "devops-basic-3",
            title: "CI 流水线基本配置",
            minutes: 15,
            updated: "2026-09-16",
            applies: "GitHub Actions / GitLab CI",
            tags: ["CI", "自动化"],
            terms: ["CI", "流水线", "GitHub Actions"],
            body: `
## 为什么需要 CI

把「构建、测试、代码检查」交给机器在每次提交时自动跑，能**在合并前拦住坏代码**，也让人从重复劳动里解脱。
CI（Continuous Integration，持续集成）的核心是：频繁合并 + 自动验证。

## 一、一条最小流水线长什么样

以 GitHub Actions 为例，${C}.github/workflows/ci.yml${C}：

${F}yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "18" }
      - run: npm ci
      - run: npm run lint
      - run: npm test
${F}

## 二、流水线该分哪些阶段

1. **安装依赖**：用 lockfile 保证可复现，开缓存加速。
2. **静态检查（lint）**：风格、潜在 bug、安全告警。
3. **测试**：单元 + 必要的集成，覆盖率作为参考而非唯一指标。
4. **构建/打包**：产出可部署制品。
5. **（可选）部署到预发**：合并到 main 后自动发预发环境。

## 三、密钥怎么用

${F}yaml
- run: npm publish
  env:
    NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}   # 只在该步注入，不落盘
${F}

## ⚠ 踩坑与经验

1. **密钥永远走 secrets**：绝不写进仓库或打印到日志。
2. **测试用例要稳定（不 flaky）**：一个偶发失败的测试比没有测试更伤信任，先修 flaky 再合代码。
3. **缓存要带版本键**：依赖变了缓存却没失效，会跑出诡异结果。
4. **CI 里别依赖交互**：所有命令必须非交互、能超时退出。
5. **流水线要快**：超过 10 分钟的 CI 会被人绕过，优先并行阶段。

## ✅ 排障清单

- [ ] 能写一条含 lint/test/build 的最小流水线
- [ ] 知道密钥走 secrets、不落盘
- [ ] 会用缓存加速依赖安装
- [ ] 理解「频繁合并 + 自动验证」是 CI 的本质
`
          },
          {
            id: "devops-basic-4",
            title: "Linux 与网络基础",
            minutes: 14,
            updated: "2026-09-16",
            applies: "Linux 任意发行版",
            tags: ["Linux", "网络"],
            terms: ["Linux", "端口", "DNS"],
            body: `
## 为什么 DevOps 要懂网络

容器、服务、负载均衡，底层全是 Linux 网络。
「服务起不来」「端口被占」「DNS 解析慢」这类问题，不懂网络就只能重启试试。这一节给你一套排查工具。

## 一、端口与进程

${F}bash
ss -ltnp        # 看哪些端口在监听、被哪个进程占用（-p 要 root）
lsof -i :8080   # 谁占了 8080
kill -9 <pid>   # 实在不行再杀
${F}

## 二、连通性排查四件套

${F}bash
ping 8.8.8.8          # 1 网络通不通（ICMP，有些环境禁）
curl -v https://api  # 2 应用层能不能通，看状态码与 TLS 握手
nslookup api          # 3 DNS 解析对不对
telnet host 3306      # 4 特定端口通不通（无 curl 时替代）
${F}

## 三、DNS 解析去哪看

${F}bash
cat /etc/resolv.conf        # 看 DNS 服务器
cat /etc/hosts              # 本地静态映射（排查诡异解析先查这里）
systemd-resolve --status    # systemd 环境看当前解析配置
${F}

## 四、防火墙

${F}bash
iptables -L -n -v           # 传统 iptables 规则
# 或 firewalld：
firewall-cmd --list-all
${F}

## ⚠ 踩坑与经验

1. **${C}localhost${C} 不等于 ${C}0.0.0.0${C}**：服务只绑 ${C}127.0.0.1${C} 时容器/外部访问不到，应绑 ${C}0.0.0.0${C} 或具体网卡。
2. **容器网络是独立的**：容器内 ${C}localhost${C} 指向容器自己，跨容器要用服务名或 IP。
3. **DNS 缓存导致解析旧 IP**：改了 hosts/解析后清缓存或等 TTL。
4. **防火墙默认丢包**：端口通了应用却连不上，八成是防火墙拦了。
5. **MTU/分片问题**：某些 overlay 网络下大包被丢，表现为「小请求行、大请求卡」。

## ✅ 排障清单

- [ ] 会用 ${C}ss${C}/${C}lsof${C} 看端口占用
- [ ] 会用 ${C}curl -v${C}/${C}nslookup${C}/${C}telnet${C} 分层排查
- [ ] 知道 localhost 与 0.0.0.0 的区别
- [ ] 知道去 ${C}/etc/hosts${C}/${C}/etc/resolv.conf${C} 查解析
`
          }
        ]
      },
      /* ---------------- 中级 ---------------- */
      {
        id: "mid",
        name: "中级",
        desc: "能搭建与维护交付体系：优化镜像、设计流水线、上 K8s、写 IaC、管好制品。",
        chapters: [
          {
            id: "devops-mid-1",
            title: "Dockerfile 最佳实践与镜像瘦身",
            minutes: 16,
            updated: "2026-09-16",
            applies: "Docker 20.10+",
            tags: ["Docker", "镜像优化"],
            terms: ["Dockerfile", "多阶段构建", "层缓存"],
            body: `
## 为什么要瘦身

镜像越小：拉取越快、攻击面越小、存储越省。
一个 1.2GB 的 Node 镜像和一个 80MB 的 alpine 镜像，部署体验和安全性天差地别。

## 一、理解分层与缓存

Dockerfile 每行是一个层，**只有前面层不变，后面的缓存才有效**。
把「变动少的」放前面、「变动多的（如源码 COPY）」放后面：

${F}dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./     # 先拷依赖清单
RUN npm ci --omit=dev      # 装依赖（这层缓存命中率高）
COPY . .                  # 再拷源码（频繁变动，放最后）
${F}

## 二、多阶段构建：构建环境和运行环境分离

${F}dockerfile
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine          # 运行时只要构建产物
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
${F}

## 三、.dockerignore

${F}bash
# .dockerignore：避免把 node_modules、.git、env 打进构建上下文
node_modules
.git
*.env
${F}

## ⚠ 踩坑与经验

1. **别把密钥 COPY 进镜像**：哪怕后面 ${C}RUN rm${C}，密钥也留在了不可见的层里，用 multi-stage 或 build secret。
2. **用 ${C}alpine${C} 注意 libc 差异**：部分二进制（如 Puppeteer）依赖 glibc，alpine 缺库会起不来，必要时用 ${C}debian-slim${C}。
3. **${C}apt-get${C} 要清缓存**：装完 ${C}rm -rf /var/lib/apt/lists/*${C}，否则层里多一堆垃圾。
4. **固定基础镜像版本 + digest**：${C}node:18-alpine@sha256:...${C} 杜绝底层漂移。
5. **一个容器一个进程**：别在容器里跑 supervisord 塞一堆服务。

## ✅ 排障清单

- [ ] 会用多阶段构建分离构建/运行环境
- [ ] 会排 Dockerfile 顺序提升缓存命中
- [ ] 配了 ${C}.dockerignore${C}
- [ ] 知道 alpine 与 glibc 的兼容坑
- [ ] 不用 ${C}latest${C}、固定版本与 digest
`
          },
          {
            id: "devops-mid-2",
            title: "CI/CD 流水线设计",
            minutes: 18,
            updated: "2026-09-16",
            applies: "GitHub Actions / GitLab CI",
            tags: ["CI/CD", "交付"],
            terms: ["CD", "制品晋级", "质量门"],
            body: `
## CI 与 CD 的区别

- **CI（持续集成）**：代码合并前自动构建+测试。
- **CD（持续交付/部署）**：合并后自动把产物交付到各环境，甚至自动上线。

两者合起来才是「从提交到上线」的完整链路。

## 一、阶段化设计

${F}text
代码提交 → 编译 → 单元测试 → 代码扫描(质量门) → 打包制品
   → 部署预发 → 集成测试 → 部署生产(可手动审批/金丝雀)
${F}

## 二、制品晋级：同一个包走全流程

**关键原则：构建一个不可变制品，逐级晋级，绝不每环境重打。**
预发和生产跑的是同一个镜像 digest，差别只在配置（通过环境变量/配置中心注入）。

${F}yaml
# 伪代码：部署前先等质量门通过
deploy-staging:
  needs: [build, test, scan]
  if: github.ref == 'refs/heads/main'
deploy-prod:
  needs: deploy-staging
  environment: production   # 触发审批
${F}

## 三、质量门与卡点

- 测试覆盖率不低于阈值
- 静态扫描无高危漏洞
- 依赖无已知 CVE（SCA）
- 许可证合规

## ⚠ 踩坑与经验

1. **每环境重打镜像 = 埋雷**：你测的是 A 包，上线的是 B 包，问题无法复现。
2. **手动审批别形同虚设**：生产部署前的关键卡点要真有人看变更说明。
3. **流水线失败要阻断合并**：让红灯有约束力，否则 CI 沦为装饰。
4. **数据库变更要单独管理**：应用可回滚，表结构变更往往不能，用 migration 工具并先备份。
5. **密钥按环境隔离**：预发和生产密钥分开存，禁止互相串。

## ✅ 排障清单

- [ ] 分得清 CI 与 CD
- [ ] 做到「一个不可变制品逐级晋级」
- [ ] 设了质量门（测试/扫描/许可证）
- [ ] 生产部署有审批卡点
- [ ] 数据库变更有 migration 与回滚预案
`
          },
          {
            id: "devops-mid-3",
            title: "K8s 部署与 Helm",
            minutes: 20,
            updated: "2026-09-16",
            applies: "Kubernetes 1.24+ / Helm 3",
            tags: ["K8s", "云原生"],
            terms: ["Pod", "Deployment", "Service", "Helm"],
            body: `
## 为什么上 K8s

当服务从几个变成几十个，手工管容器就崩溃了。
K8s 提供**声明式调度、自愈、弹性伸缩、服务发现**，让你描述「想要什么状态」，它负责「达到并保持」。

## 一、三个核心对象

${F}yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: myapp:1.0
          ports: [{ containerPort: 3000 }]
          resources:          # 必配！否则被驱逐或抢占
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "256Mi" }
          readinessProbe:     # 就绪探针：没就绪不接流量
            httpGet: { path: /healthz, port: 3000 }
            initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 3000 }]
${F}

## 二、常用 kubectl

${F}bash
kubectl get pods -l app=web
kubectl describe pod web-xxx      # 看事件，排查 Pending/CrashLoop
kubectl logs -f deploy/web
kubectl rollout status deploy/web # 看发布进度
kubectl rollout undo deploy/web   # 回滚
${F}

## 三、Helm：把 YAML 参数化

Helm 用 ${C}values.yaml${C} 覆盖默认值，一套模板部署多套环境：

${F}bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install myweb bitnami/nginx -f my-values.yaml
helm upgrade myweb bitnami/nginx -f my-values.yaml
${F}

## ⚠ 踩坑与经验

1. **不配 requests/limits = 灾难**：节点资源被吃满，调度器乱分配，关键 Pod 被驱逐。
2. **只配 liveness 不配 readiness**：进程活着但没初始化完就被打流量，雪崩。
3. **标签对不上 selector**：Service 找不到后端，一直是 ${C}<none>${C} endpoints。
4. **镜像用 ${C}latest${C}**：滚动更新时新 Pod 可能拉到旧缓存，行为不一致。
5. **Helm 升级前先 ${C}helm diff${C}**：看清会改哪些资源，避免误删。

## ✅ 排障清单

- [ ] 会写 Deployment + Service 最小可用 yaml
- [ ] 给每个容器配 requests/limits 与探针
- [ ] 会用 ${C}kubectl describe/logs/rollout${C} 排查
- [ ] 理解 Helm values 参数化部署
`
          },
          {
            id: "devops-mid-4",
            title: "基础设施即代码（Terraform）",
            minutes: 17,
            updated: "2026-09-16",
            applies: "Terraform 1.x",
            tags: ["IaC", "Terraform"],
            terms: ["Terraform", "provider", "state"],
            body: `
## 为什么用 IaC

手动在控制台点出来的环境，**不可复现、易漂移、离职即失传**。
IaC 把基础设施写成代码：可版本化、可 review、可一键重建。

## 一、基本工作流

${F}bash
terraform init      # 初始化 provider 与模块
terraform plan      # 预览将要发生的变更（上生产前必看）
terraform apply     # 真正执行
terraform destroy   # 回收
${F}

## 二、一个最小配置

${F}hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}
provider "aws" {
  region = "ap-guangzhou"
}
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs-2026"
}
${F}

## 三、state 是核心

state 文件记录了「现实资源」与「代码声明」的对应关系。
**state 损坏 = 不知道改了什么 = 可能误删资源**，必须妥善管理。

${F}bash
# 用远端后端（如 S3 + DynamoDB 锁）存 state，团队共享且防并发
terraform state list        # 看当前管理了哪些资源
terraform import aws_s3_bucket.logs existing-bucket  # 接管已有资源
${F}

## ⚠ 踩坑与经验

1. **state 别放本地、别进 Git**：用远端后端 + 锁，防止两人同时 apply 冲突。
2. **${C}apply${C} 前必看 ${C}plan${C}**：尤其带 ${C}destroy${C} 标记的变更，确认不是误删。
3. **敏感变量走 ${C}variable${C} + 后端加密**：别把 AK/SK 写死在 .tf 里。
4. **防范 drift（漂移）**：控制台手动改了资源，state 就和实际不一致，定期 ${C}plan${C} 检查。
5. **模块化复用**：同一套网络/VPC 抽成 module，避免每个项目复制粘贴。

## ✅ 排障清单

- [ ] 走通 init/plan/apply 基本流程
- [ ] state 用远端后端 + 锁管理
- [ ] ${C}apply${C} 前审查 ${C}plan${C}
- [ ] 敏感信息不落代码
- [ ] 会用 ${C}import${C} 接管已有资源
`
          },
          {
            id: "devops-mid-5",
            title: "制品与版本管理",
            minutes: 14,
            updated: "2026-09-16",
            applies: "任意制品仓库",
            tags: ["制品", "版本"],
            terms: ["SemVer", "不可变制品", "依赖锁定"],
            body: `
## 为什么制品管理很重要

代码能回滚，但如果「依赖的包」飘了、或「同一个版本号」内容变了，回滚也没用。
制品管理回答两个问题：**怎么给版本编号**、**怎么保证拿到的总是同一份**。

## 一、语义化版本 SemVer

${C}主版本.次版本.修订号${C}，如 ${C}2.3.1${C}：
- **主版本**：不兼容的 API 变更
- **次版本**：向下兼容的新功能
- **修订号**：向下兼容的 bug 修复

## 二、制品必须不可变

${F}bash
# 好的做法：发布后 v1.0.0 的内容永远不变，修 bug 发 v1.0.1
# 坏的做法：反复覆盖同一个 latest / 1.0，谁都不知道线上跑的是哪次
docker tag myapp:1.0.1 registry/app:1.0.1
docker push registry/app:1.0.1
${F}

## 三、依赖锁定

${F}bash
# Node：package-lock.json 锁定 exact 版本
npm ci                 # 严格按 lockfile 装，忽略 package.json 的 ^ 范围
# Python：pip freeze > requirements.lock 或 poetry.lock
# Go：go.sum
${F}

## 四、制品仓库分层

- **源码仓库**：Git
- **镜像仓库**：Harbor / ECR / GCR
- **依赖代理**：Nexus / Artifactory（内网加速 + 缓存 + 审计）

## ⚠ 踩坑与经验

1. **${C}^${C} 和 ${C}~${C} 范围导致不确定性**：CI 用 ${C}npm ci${C} 而非 ${C}npm install${C}，锁定 exact。
2. **覆盖发布=定时炸弹**：永远发新版本号，不覆盖旧的。
3. **制品要带构建溯源**：记录 commit、构建号、时间，出问题能定位是哪次构建。
4. **定期清理旧制品**：设保留策略，避免仓库无限膨胀。
5. **私有依赖要走代理**：既加速又能在上游不可用时兜底。

## ✅ 排障清单

- [ ] 理解 SemVer 三段含义
- [ ] 制品不可变，发新版不覆盖旧版
- [ ] CI 用 lockfile 安装依赖
- [ ] 制品带构建溯源信息
`
          }
        ]
      },
      /* ---------------- 高级 ---------------- */
      {
        id: "adv",
        name: "高级",
        desc: "能设计平台与推进工程效能：GitOps、多集群、发布策略、效能度量、平台工程。",
        chapters: [
          {
            id: "devops-adv-1",
            title: "GitOps 与持续交付",
            minutes: 18,
            updated: "2026-09-16",
            applies: "Argo CD / Flux",
            tags: ["GitOps", "持续交付"],
            terms: ["GitOps", "声明式", "reconcile"],
            body: `
## 什么是 GitOps

一句话：**Git 仓库是系统期望状态的唯一事实源，集群自动向它对齐**。
传统 CD 是「流水线主动 push 到集群」；GitOps 是「控制器持续 pull Git 状态并 reconcile」。

## 一、核心原则

1. **声明式**：系统状态全用 Git 里的 YAML 描述。
2. **Git 为唯一事实源**：改生产 = 提 PR 到 Git，不是登机器敲命令。
3. **自动 reconcile**：控制器观测实际状态，持续纠正偏离。
4. **可观测+可回滚**：状态有偏差立即告警；回滚 = 把 Git 回退一个 commit。

## 二、Argo CD 最小示例

${F}yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: web, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/org/gitops.git
    path: apps/web
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: web
  syncPolicy:
    automated: { prune: true, selfHeal: true }   # 自动同步 + 自愈
${F}

${F}bash
argocd app get web        # 看同步状态（Synced / OutOfSync）
argocd app rollback web   # 回滚到上一版本
${F}

## ⚠ 踩坑与经验

1. **${C}selfHeal${C} 是把双刃剑**：手动改集群会被自动覆盖，但也意味着误操作能自动修复——前提是你改的是 Git。
2. **secret 别直接进 Git**：用 sealed-secrets / external-secrets 加密或外挂。
3. **${C}prune${C} 要谨慎**：它会删 Git 里已移除的资源，确认无误再开。
4. **多环境用多目录/多分支**：别用同一个 path 塞所有环境。

## ✅ 排障清单

- [ ] 理解 GitOps 四原则
- [ ] 分得清「push CD」与「pull GitOps」
- [ ] 会用 Argo CD 看同步状态与回滚
- [ ] secret 不落明文 Git
`
          },
          {
            id: "devops-adv-2",
            title: "多集群与多环境管理",
            minutes: 19,
            updated: "2026-09-16",
            applies: "Kubernetes 多集群",
            tags: ["多集群", "多环境"],
            terms: ["环境分级", "集群拓扑", "配置分离"],
            body: `
## 为什么要分多环境/多集群

- **环境分级**：dev → staging → prod，越往后越接近真实、越要严格。
- **多集群**：隔离故障域（一个集群挂了不影响全局）、满足合规（数据不出境）、就近访问。

## 一、环境管理三要素

1. **代码同一份，配置分环境**：通过 ${C}values-{env}.yaml${C} 或配置中心区分。
2. **数据隔离**：各环境用自己的库，禁止共用。
3. **网络隔离**：prod 与 dev 不通，减少横向移动风险。

## 二、多集群拓扑

${F}text
                    统一 GitOps 仓库
                           │
        ┌──────────┬───────┴────────┬──────────┐
      cluster-dev  cluster-staging  cluster-prod(华东)  cluster-prod(海外)
${F}

每个集群跑一个 Argo CD，都指向同一 Git 仓库的不同 path/分支。

## 三、配置与密钥分离

- **非敏感配置**：ConfigMap / Helm values
- **敏感配置**：External Secrets 从 Vault/云 KMS 拉，不进 Git

## ⚠ 踩坑与经验

1. **环境与生产「长得太不一样」**：staging 用不同版本、不同拓扑，导致问题只在 prod 暴露。尽量同构。
2. **跨集群服务发现复杂**：用服务网格（Istio）或全局负载均衡，别手写 hosts。
3. **配置漂移**：控制台手动改了某集群，与 Git 不一致，靠 reconcile 自愈兜底。
4. **成本失控**：每个环境都开满副本数，dev 也 3 副本简直浪费，按环境缩放。

## ✅ 排障清单

- [ ] 做到「代码同份、配置分环境」
- [ ] 各环境数据/网络隔离
- [ ] 理解多集群故障域与合规价值
- [ ] 密钥走 External Secrets 不进 Git
`
          },
          {
            id: "devops-adv-3",
            title: "发布策略（蓝绿/金丝雀）",
            minutes: 18,
            updated: "2026-09-16",
            applies: "K8s + Service Mesh / Ingress",
            tags: ["发布策略", "灰度"],
            terms: ["蓝绿", "金丝雀", "滚动更新"],
            body: `
## 为什么发布策略重要

${C}kubectl apply${C} 默认的滚动更新虽然平滑，但**一旦新版本有 bug，影响的是全部用户**，且回滚有窗口期。
发布策略的目标：**降低爆炸半径、可快速止损、可观测可回退**。

## 一、三种主流策略

| 策略 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| 滚动更新 | 逐批替换旧 Pod | 简单、资源省 | 新旧混跑，回滚慢 |
| 蓝绿 | 起一套全新（绿），切流量 | 秒级切换/回滚 | 双倍资源 |
| 金丝雀 | 先放 1%~5% 流量验证 | 爆炸半径最小 | 需要流量治理 |

## 二、金丝雀（以 Istio 为例）

${F}yaml
# 把 90% 流量给稳定版，10% 给金丝雀
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  http:
    - route:
        - destination: { host: web, subset: stable }
          weight: 90
        - destination: { host: web, subset: canary }
          weight: 10
${F}

## 三、回滚要点

${F}bash
kubectl rollout undo deploy/web          # 滚动/蓝绿回滚
# 金丝雀：把 canary weight 调回 0 即可，几乎瞬时
${F}

## ⚠ 踩坑与经验

1. **数据库不兼容是头号杀手**：新代码写的新字段，旧版本读不了。用「向后兼容」的扩展式迁移。
2. **只切流量不算真发布**：要同时监控错误率/延迟/业务指标，有异常立即回滚。
3. **金丝雀只看「不报错」不够**：错误率没变但延迟翻倍，也要判失败。
4. **资源要预留**：蓝绿双份、金丝雀叠加，提前算好容量。

## ✅ 排障清单

- [ ] 分得清滚动/蓝绿/金丝雀的取舍
- [ ] 会用权重控制金丝雀流量
- [ ] 发布同时盯错误率/延迟/业务指标
- [ ] 数据库迁移保证向后兼容
`
          },
          {
            id: "devops-adv-4",
            title: "工程效能度量与改进",
            minutes: 16,
            updated: "2026-09-16",
            applies: "团队效能",
            tags: ["效能", "DORA"],
            terms: ["DORA", "部署频率", "变更失败率"],
            body: `
## 为什么要度量

「我们效率很高」是感觉，「每周部署 5 次、失败率 2%」是数据。
度量的目的是**找到瓶颈、验证改进是否有效**，不是用来考核个人。

## 一、DORA 四大指标

| 指标 | 含义 | 优秀区间 |
|---|---|---|
| 部署频率 | 多久发一次 | 按需每日多次 |
| 交付前置时间 | 提交到上线多久 | 一小时以内 |
| 变更失败率 | 发布导致故障比例 | 0%~15% |
| 服务恢复时间(MTTR) | 故障到恢复 | 一小时以内 |

## 二、常见瓶颈与方向

- **合并冲突多、分支寿命长** → 推行小批量、短生命周期分支，频繁合 main。
- **手工部署慢且易错** → 投资 CI/CD 自动化，消除人工步骤。
- **测试慢/flaky** → 分层的、可靠的测试金字塔，并行执行。
- **回滚难** → 发布策略 + 不可变制品 + 数据库兼容迁移。

## 三、度量的坑

${F}text
❌ 用「代码行数 / 工时」考核 → 鼓励堆量
❌ 只看「部署次数」→ 可能变相鼓励小改动刷数
✅ 看「价值流动效率」：从需求到上线的端到端时间
${F}

## ⚠ 踩坑与经验

1. **指标是仪表盘不是鞭子**：公开排名会诱发刷数据。
2. **先打通「可观测」再谈改进**：连部署频率都统计不出来，无从优化。
3. **小步快跑优于大版本**：大版本发布风险高、回滚难，拆小更易稳。
4. **改进要闭环**：提出假设 → 改流程 → 看指标变化 → 复盘。

## ✅ 排障清单

- [ ] 知道 DORA 四指标及优秀区间
- [ ] 能识别团队当前瓶颈环节
- [ ] 理解「度量用于改进而非考核」
`
          },
          {
            id: "devops-adv-5",
            title: "平台化建设",
            minutes: 17,
            updated: "2026-09-16",
            applies: "平台工程",
            tags: ["平台工程", "IDP"],
            terms: ["Internal Developer Platform", "黄金路径", "自助服务"],
            body: `
## 什么是平台工程

当团队多了，每个组都在重复造「脚手架、CI 模板、监控接入」。
平台工程把共性能力做成**内部开发者平台（IDP）**，让业务团队自助使用，少踩坑、快交付。

## 一、黄金路径（Golden Path）

给开发者一条「被验证过的最佳实践」默认路线：

${F}text
开发者只需：git clone 模板 → 填业务代码 → git push
平台自动：生成 CI/CD、创建环境、接入监控/日志/告警、发预览链接
${F}

## 二、平台该提供什么

- **脚手架**：一行命令生成符合规范的服务骨架。
- **标准化流水线**：内置 lint/test/scan/部署，业务方零配置。
- **可观测性开箱即用**：日志、指标、链路追踪默认接入。
- **环境自助**：自助申请预发/测试环境，按时回收。

## 三、平台与业务的解耦

${F}bash
# 平台提供「能力」，业务只声明「需求」
# 例：业务描述要一个带 DB 的服务，平台按策略自动供给
platform-cli new service order --with db,redis,cache
${F}

## ⚠ 踩坑与经验

1. **别做成「又一个要填的工单系统」**：自助、自助、自助，关键是减少摩擦。
2. **抽象要适度**：过度抽象让特殊需求无法实现，留好逃生舱（escape hatch）。
3. **平台也要 SLO**：平台挂了全员停工，平台自身的稳定性得有保障。
4. **先解决真实痛点**：从最高频的重复劳动下手，别一上来就宏大架构。

## ✅ 排障清单

- [ ] 理解平台工程解决「重复造轮子」的本质
- [ ] 能说出黄金路径的要素
- [ ] 知道抽象要留逃生舱
- [ ] 平台自身要有 SLO
`
          }
        ]
      }
    ]
  };

  /* ============================ 安全 ============================ */
  const SECURITY = {
    id: "security",
    name: "安全",
    icon: "🔐",
    desc: "从「知道有哪些坑」到「能建安全体系」。覆盖 Web 安全、渗透测试、认证授权、加密、审计应急与合规治理。",
    levels: [
      /* ---------------- 初级 ---------------- */
      {
        id: "basic",
        name: "初级",
        desc: "建立安全意识：认识常见Web漏洞与Linux加固基线。",
        chapters: [
          {
            id: "security-basic-1",
            title: "Web 安全基础（OWASP Top 10）",
            minutes: 16,
            updated: "2026-09-16",
            applies: "通用 Web 应用",
            tags: ["Web安全", "OWASP"],
            terms: ["OWASP", "注入", "失效访问控制"],
            body: `
## 为什么先背 OWASP Top 10

OWASP Top 10 是业界对「最危险 Web 安全风险」的共识清单。
**开发写得对不对、测试该盯哪、面试常考什么，基本都在这 10 条里**。

## 一、2021 版十大速览

1. **失效的访问控制**：越权访问别人的数据（A1，最普遍）。
2. **密码学失效**：明文存储、弱哈希、硬编码密钥。
3. **注入**：SQL/命令/XXE 注入，拼接输入导致。
4. **不安全的设计**：架构层面缺安全考虑。
5. **安全配置错误**：默认口令、多余端口、详错页面。
6. **易受攻击的组件**：用了有 CVE 的依赖。
7. **身份识别与认证失败**：会话固定、弱密码、JWT 不校验。
8. **软件和数据完整性故障**：不校验更新的完整性。
9. **安全日志和监控失效**：出事了没记录、没告警。
10. **服务端请求伪造（SSRF）**：服务端替你发任意请求。

## 二、最该先堵的两个

${F}text
① 失效的访问控制：每个接口都必须校验「当前用户是否有权看这个资源」
② 注入：任何拼接输入的地方（SQL/命令/HTML）都要参数化或转义
${F}

## ⚠ 踩坑与经验

1. **「前端隐藏按钮」不是权限控制**：攻击者直接调 API 就能绕过 UI。
2. **依赖不是「能用就行」**：定期扫 CVE（如 ${C}npm audit${C}），老版本可能自带漏洞。
3. **错误信息别暴露细节**：堆栈/SQL 报错直接返回给前端，等于给黑客画地图。
4. **默认配置最危险**：框架装好就上线，默认口令、调试模式都没关。

## ✅ 排障清单

- [ ] 能说出 Top 10 里最危险的 2~3 条
- [ ] 知道「前端隐藏 ≠ 鉴权」
- [ ] 会扫依赖 CVE、关掉多余错误暴露
`
          },
          {
            id: "security-basic-2",
            title: "常见漏洞原理（SQLi/XSS/CSRF）",
            minutes: 18,
            updated: "2026-09-16",
            applies: "通用 Web 应用",
            tags: ["漏洞", "防护"],
            terms: ["SQL注入", "XSS", "CSRF"],
            body: `
## 三大高频漏洞

这三者占了 Web 攻击的绝大多数，理解原理才能从根本上防护。

## 一、SQL 注入（SQLi）

**原理**：把用户输入直接拼进 SQL，用户输入变成了「命令」。

${F}text
恶意输入：' OR '1'='1
拼接后：SELECT * FROM user WHERE name='' OR '1'='1'   → 恒真，全表泄露
${F}

**防护**：永远用**参数化查询（预编译）**，绝拼接：

${F}js
// ❌ 危险
db.query("SELECT * FROM user WHERE id = " + req.query.id);
// ✅ 安全
db.query("SELECT * FROM user WHERE id = ?", [req.query.id]);
${F}

## 二、跨站脚本（XSS）

**原理**：把用户输入当 HTML/JS 执行。分三类：
- **存储型**：恶意脚本存进数据库，别人打开就中招。
- **反射型**：诱骗点击带 payload 的链接。
- **DOM 型**：前端 JS 把不可信数据写进 DOM。

**防护**：输出转义 + CSP（Content-Security-Policy）限制脚本来源。

## 三、跨站请求伪造（CSRF）

**原理**：攻击者诱导已登录用户浏览器，向目标站点发一个非本意的请求（如转账）。

**防护**：
- 同源策略 + **CSRF Token**（每个表单带随机 token，服务端校验）。
- 关键接口要求**二次确认/重新鉴权**。
- Cookie 设 ${C}SameSite=Strict/Lax${C}。

## ⚠ 踩坑与经验

1. **参数化不是「加引号」**：手写转义极易漏，用框架提供的绑定参数。
2. **富文本场景 XSS 难防**：用白名单标签过滤（如 DOMPurify），别自己正则。
3. **${C}SameSite=None${C} 必须配 ${C}Secure${C}**：否则 Cookie 不发送。
4. **JSONP / 老接口是 CSRF 重灾区**：已弃用的跨域方式尽量少留。

## ✅ 排障清单

- [ ] 理解 SQLi 用参数化根治
- [ ] 知道 XSS 三类与转义+CSP 防护
- [ ] 知道 CSRF 用 token + SameSite 防护
`
          },
          {
            id: "security-basic-3",
            title: "Linux 安全基线",
            minutes: 15,
            updated: "2026-09-16",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "加固"],
            terms: ["SSH加固", "防火墙", "最小权限"],
            body: `
## 为什么先加固基线

一台新服务器默认有很多「方便但不安全」的设置：允许 root 直登、弱口令、全端口开放。
**基线加固是运维/安全的第一步，也是等保的入门要求**。

## 一、账号与密码策略

${F}bash
# 禁用/锁定无用账号
passwd -l nobody
# 密码复杂度（/etc/login.defs / pam_pwquality）
# 定期改密、设最短长度与复杂度
${F}

## 二、SSH 加固

${F}bash
# /etc/ssh/sshd_config
PermitRootLogin no          # 禁止 root 直接登录
PasswordAuthentication no    # 只用密钥登录
Port 2222                   # 改默认端口，减少扫描噪音（非绝对安全）
AllowUsers deploy           # 限定可登录用户
${F}

改完 ${C}systemctl restart sshd${C}（注意别把自己踢出去，先留一个会话测试）。

## 三、防火墙与最小化

${F}bash
# 只开必要端口
firewall-cmd --add-port=2222/tcp --permanent
firewall-cmd --remove-service=dhcpv6-client --permanent
firewall-cmd --reload
# 关掉用不到的服务
systemctl disable --now telnet.socket
${F}

## 四、文件与权限

- 关键配置文件 ${C}chmod 600${C}（如 ${C}/etc/shadow${C}）。
- 用专用低权用户跑应用，不用 root。
- 定期审计 SUID 文件：${C}find / -perm -4000 -type f 2>/dev/null${C}。

## ⚠ 踩坑与经验

1. **改 SSH 前先开第二个会话测试**：否则配错直接失联，只能去机房/控制台救。
2. **密钥登录也要保护私钥**：私钥文件权限 ${C}600${C}，别到处拷。
3. **防火墙别一刀切**：先加放行规则再删默认，避免把自己关外面。
4. **最小化=少装少开**：每个多余服务都是攻击面。

## ✅ 排障清单

- [ ] 禁 root 直登、用密钥
- [ ] 防火墙只放必要端口
- [ ] 应用用低权用户跑
- [ ] 定期审计 SUID 与账号
`
          }
        ]
      },
      /* ---------------- 中级 ---------------- */
      {
        id: "mid",
        name: "中级",
        desc: "能做漏洞发现与修复：渗透测试、认证授权设计、加密密钥管理、审计入侵排查。",
        chapters: [
          {
            id: "security-mid-1",
            title: "渗透测试流程与工具",
            minutes: 19,
            updated: "2026-09-16",
            applies: "授权环境",
            tags: ["渗透", "红队"],
            terms: ["信息收集", "漏洞扫描", "Burp Suite"],
            body: `
## 什么是渗透测试

**在授权范围内，模拟攻击者的方法找漏洞**，目的是在真黑客之前发现问题。
⚠ 未经授权的渗透测试违法，务必拿到书面授权、限定范围。

## 一、标准流程（PTES 简化版）

1. **前期交互**：明确范围、目标、时间窗、报告形式。
2. **情报收集（ recon）**：
   ${F}bash
nmap -sV -p- target.com          # 端口与版本探测
subfinder -d target.com          # 子域名枚举
whatweb target.com               # 识别 Web 框架/组件
   ${F}
3. **漏洞扫描**：用 AWVS / Nessus / nuclei 扫已知漏洞。
4. **利用（exploitation）**：用 sqlmap 验证注入、Burp 改包测越权。
5. **后渗透**：拿 shell 后看能提权/横向到哪。
6. **报告**：漏洞 + 危害 + 复现步骤 + 修复建议。

## 二、必备工具

- **Burp Suite**：拦截/改包、重放、扫描 Web 漏洞。
- **sqlmap**：自动化 SQL 注入检测与利用。
- **nmap / masscan**：端口与资产探测。
- **Metasploit**：漏洞利用框架。

## ⚠ 踩坑与经验

1. **只扫不验证 = 噪音**：扫描器报的「中危」要人工确认是否误报。
2. **注意测试强度**：暴力破解、大流量扫描可能把目标打挂，约定速率。
3. **报告要可复现**：给 PoC（如具体请求），开发才能修。
4. **授权边界内行动**：多扫一个域名都可能越界，严格按范围。

## ✅ 排障清单

- [ ] 理解渗透测试「授权先行」的红线
- [ ] 走通 recon→扫描→利用→报告 流程
- [ ] 会用 nmap / Burp / sqlmap 基础能力
- [ ] 报告含可复现 PoC 与修复建议
`
          },
          {
            id: "security-mid-2",
            title: "认证与授权设计",
            minutes: 18,
            updated: "2026-09-16",
            applies: "通用后端",
            tags: ["认证", "授权"],
            terms: ["认证", "RBAC", "JWT"],
            body: `
## 认证 vs 授权

- **认证（Authentication）**：你是谁？——登录、令牌。
- **授权（Authorization）**：你能干啥？——权限、角色。

两者都漏一个，系统就不安全。

## 一、认证设计要点

${F}text
✅ 密码用慢哈希存储：bcrypt / scrypt / Argon2（绝不 md5/sha1+盐裸存）
✅ 登录失败限流 + 锁定，防暴破
✅ 支持 MFA（多因素），关键操作二次验证
✅ 会话用安全 Cookie：HttpOnly + Secure + SameSite
${F}

## 二、授权：RBAC 最小权限

${F}js
// 角色→权限，用户→角色；接口按权限点校验
function can(user, action) {
  return user.roles.some(r => ROLES[r].perms.includes(action));
}
// 每个请求都必须查「这个用户对这个资源有权吗」
if (!can(ctx.user, "order:read:" + ctx.params.id))
  return forbidden();
${F}

## 三、JWT 的坑

- **别把敏感信息塞 payload**：它只是 base64，谁都能解码。
- **必须校验签名与过期**：不校验 = 伪造令牌任意登录。
- **无法即时吊销**：退出登录要靠短过期 + 黑名单/刷新令牌机制。

## ⚠ 踩坑与经验

1. **越权（IDOR）最高发**：接口只信前端传的 ${C}userId${C}，不校验归属，A 改 B 的数据。
2. **权限点在代码散落**：用统一中间件/注解集中校验，避免漏。
3. **JWT 用 none 算法攻击**：服务端必须显式拒绝 ${C}alg: none${C}。
4. **退出登录要真失效**：只清前端 Cookie 不够，服务端也要记失效。

## ✅ 排障清单

- [ ] 密码用慢哈希，支持 MFA
- [ ] 授权用 RBAC + 每个请求校验归属
- [ ] 知道 JWT 不能存敏感、必须校验签名
- [ ] 防 IDOR 越权
`
          },
          {
            id: "security-mid-3",
            title: "加密与密钥管理",
            minutes: 17,
            updated: "2026-09-16",
            applies: "通用",
            tags: ["加密", "密钥"],
            terms: ["对称加密", "非对称加密", "KMS"],
            body: `
## 为什么加密不是「调个函数」

选错算法、密钥乱放，等于没加密。
加密要解决两个问题：**数据 confidentiality（保密）** 和 **integrity（完整不可篡改）**。

## 一、对称 vs 非对称

- **对称（AES）**：一把密钥加解密，快，适合加密大量数据。
- **非对称（RSA/ECC）**：公钥加密私钥解，慢，适合交换密钥/签名。
- **实战组合**：用 RSA 交换 AES 密钥，再用 AES 加密正文（TLS 思路）。

## 二、TLS 是底线

${F}bash
# 检查站点 TLS 配置与证书链
openssl s_client -connect target.com:443 -servername target.com
# 看证书有效期、是否启用强套件
${F}

**杜绝**：自签证书上生产、TLS 1.0/1.1、弱套件（RC4/3DES）。

## 三、密钥管理（KMS / Vault）

${F}text
❌ 密钥写进代码/配置文件提交 Git
❌ 明文存在服务器磁盘
✅ 用 KMS（云密钥管理）或 HashiCorp Vault 集中管
✅ 密钥定期轮换，泄露可秒级吊销
✅ 应用运行时动态拉取，不落盘
${F}

## ⚠ 踩坑与经验

1. **自己发明加密算法 = 自寻死路**：用经过审计的标准库（如 libsodium）。
2. **硬编码 AK/SK 进前端**：任何人都能从 JS 里抠出来，前端只放临时令牌。
3. **密钥不轮换**：一旦泄露影响面随时间扩大。
4. **随机数要用密码学安全源**：${C}Math.random${C} 不适合做密钥/令牌。

## ✅ 排障清单

- [ ] 会用 AES 对称 + RSA 非对称组合
- [ ] 站点强制 TLS 1.2+ 强套件
- [ ] 密钥走 KMS/Vault 不落代码
- [ ] 有密钥轮换与吊销机制
`
          },
          {
            id: "security-mid-4",
            title: "日志审计与入侵排查",
            minutes: 16,
            updated: "2026-09-16",
            applies: "Linux / 应用",
            tags: ["审计", "入侵排查"],
            terms: ["日志审计", "入侵迹象", "取证"],
            body: `
## 日志是安全的眼睛

没有日志，攻击发生了你都不知道；日志不全，出了事无法溯源。
**安全建设九成靠「看得见」**。

## 一、该采集哪些日志

- **系统**：${C}/var/log/auth.log${C}（登录）、${C}/var/log/syslog${C}
- **应用**：访问日志、错误日志、关键操作审计日志
- **网络/边界**：WAF、防火墙、LB 访问日志
- **云**：CloudTrail / 操作审计

## 二、入侵排查步骤

${F}bash
# 1 看异常登录
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
# 2 看谁在线、起过什么
w ; last ; history
# 3 看可疑进程/连接
ss -antp | grep ESTAB
# 4 看定时任务（常被种后门）
crontab -l ; ls /etc/cron.*
# 5 看新出现的 SUID / 异常文件
find / -perm -4000 -type f 2>/dev/null
${F}

## 三、集中化

${F}text
单机 tail 不够用：用 ELK / Loki / 云日志服务集中收集
→ 统一检索 + 告警规则（如「1 分钟 50 次失败登录」触发告警）
${F}

## ⚠ 踩坑与经验

1. **日志只存本地 = 易被删**：攻击者清掉 ${C}/var/log${C} 就抹痕，集中化留存。
2. **没时间戳/时区混乱**：统一 NTP 时间，排查时才对得上序。
3. **只记成功不记失败**：失败尝试（登录、越权）往往更关键。
4. **告警无意义阈值**：满屏告警等于没告警，按真实风险设规则。

## ✅ 排障清单

- [ ] 知道要采集系统/应用/边界/云四类日志
- [ ] 会用命令排查异常登录/进程/后门
- [ ] 日志集中化 + 有告警规则
- [ ] 统一时间源
`
          }
        ]
      },
      /* ---------------- 高级 ---------------- */
      {
        id: "adv",
        name: "高级",
        desc: "能做安全体系建设：SDL、WAF 与风控、应急响应取证、合规与数据治理。",
        chapters: [
          {
            id: "security-adv-1",
            title: "安全开发生命周期（SDL）",
            minutes: 18,
            updated: "2026-09-16",
            applies: "研发流程",
            tags: ["SDL", "安全左移"],
            terms: ["SDL", "威胁建模", "安全测试"],
            body: `
## 什么是 SDL

Security Development Lifecycle：把安全活动**嵌入软件开发的每个阶段**，而不是上线前临门一脚。
核心理念是**安全左移**——问题越早发现，修复成本越低。

## 一、各阶段的安全活动

${F}text
需求   → 明确安全/合规要求、定义信任边界
设计   → 威胁建模（STRIDE）：身份 spoofing / 篡改 tampering / 抵赖
        / 信息泄露 / 拒绝服务 / 越权
编码   → 安全编码规范 + 静态扫描（SAST）
测试   → 依赖扫描（SCA）+ 动态扫描（DAST）+ 渗透测试
发布   → 安全配置基线 + 上线检查单
运营   → 监控告警 + 应急响应预案
${F}

## 二、威胁建模（STRIDE）示例

${F}text
场景：用户上传头像
S 伪造身份？→ 强制登录校验
T 文件被篡改？→ 校验类型/大小/病毒扫描
I 泄露他人头像？→ 对象存储设私有 + 签名 URL
D 上传打挂服务？→ 限流 + 限制文件大小
E 越权访问？→ 校验归属，防 IDOR
${F}

## 三、把安全做成卡点

- **CI 内置 SAST/SCA**：高危漏洞不让合并。
- **依赖更新自动化**：Dependabot 自动提 PR 修 CVE。
- **安全门禁**：发布前必须过安全 checklist。

## ⚠ 踩坑与经验

1. **SDL 不是安全团队一个人的事**：开发/测试/运维都要有安全职责。
2. **威胁建模别写成八股**：聚焦真实数据流和信任边界，别堆文档。
3. **卡点太多会失效**：只在关键节点设强卡点，其余靠工具自动。
4. **遗留系统难一步到位**：先补可落地的自动化扫描，再逐步建模。

## ✅ 排障清单

- [ ] 理解安全左移与各阶段活动
- [ ] 会用 STRIDE 做威胁建模
- [ ] 安全活动嵌入 CI 卡点
`
          },
          {
            id: "security-adv-2",
            title: "WAF 与风控体系",
            minutes: 17,
            updated: "2026-09-16",
            applies: "Web 防护",
            tags: ["WAF", "风控"],
            terms: ["WAF", "规则", "风控模型"],
            body: `
## 什么是 WAF

Web Application Firewall：在 HTTP 层**过滤恶意请求**（SQLi、XSS、扫描器、CC 攻击）。
它是纵深防御的一环，不是银弹——代码层漏洞仍要修。

## 一、WAF 工作模式

${F}text
反向代理模式：流量先过 WAF 再到源站（云 WAF 常用）
透明桥接模式：串在链路里，源站无感知
规则来源：OWASP CRS 通用规则 + 业务自定义规则
${F}

## 二、风控体系（比 WAF 更上层）

WAF 防「攻击流量」，风控防「滥用行为」：

${F}text
规则引擎：同 IP 短时高频 → 限流；异地登录 → 二次验证
模型引擎：用户行为基线异常（如平时小额、突然大额）→ 拦截复核
名单体系：黑/白/灰名单，设备指纹、账户信誉分
${F}

## 三、配置要点

${F}bash
# 先「观察模式」跑一段时间，确认不误杀再切「拦截模式」
# 典型误杀：老浏览器、特定 UA、内网探针
${F}

## ⚠ 踩坑与经验

1. **一上来就拦截 = 误杀客户**：先用观察模式收集误报，再逐步收紧。
2. **WAF 拦不住逻辑漏洞**：越权、业务逻辑 bug 得靠代码和风控。
3. **规则要随业务更新**：新接口、新参数要补白名单，否则正常请求被拦。
4. **风控别只靠规则**：纯规则易被绕过，叠加模型和行为分析。

## ✅ 排障清单

- [ ] 理解 WAF 与风控的分工
- [ ] 先观察模式再拦截，防止误杀
- [ ] 知道 WAF 拦不了逻辑/越权漏洞
- [ ] 风控规则+模型+名单结合
`
          },
          {
            id: "security-adv-3",
            title: "应急响应与取证",
            minutes: 18,
            updated: "2026-09-16",
            applies: "安全事件",
            tags: ["应急", "取证"],
            terms: ["应急响应", "遏制", "取证"],
            body: `
## 为什么需要应急响应预案

出事时慌乱最致命。**有预案 = 知道第一步该干嘛、谁来决定、怎么止血**。
应急响应（Incident Response）是安全体系的「救命绳」。

## 一、标准流程（NIST IR）

1. **准备（Preparation）**：预案、联系人、工具、权限就绪。
2. **检测与分析（Detection）**：告警/用户反馈 → 确认是否真事件、定级。
3. **遏制（Containment）**：先止血！断网、封 IP、改口令、下线服务。
4. **根除（Eradication）**：清后门、补漏洞、加固。
5. **恢复（Recovery）**：从干净备份恢复，监控确认无异常。
6. **复盘（Lessons Learned）**：写报告、改流程、补漏洞。

## 二、取证要点（边处置边留证）

${F}bash
# 别急着重启！先采集易失数据
cp /var/log/auth.log /evidence/        # 日志
ps aux > /evidence/proc.txt            # 进程快照
ss -antp > /evidence/net.txt           # 网络连接
# 文件完整性：记录关键文件 hash 便于比对
md5sum /usr/bin/* > /evidence/bin.md5
${F}

## 三、黄金法则

${F}text
先遏制再溯源：止血优先于抓黑客
保留证据链：操作留痕，便于复盘与可能的司法取证
单点处置不如整体加固：修复根因，不止封一个 IP
${F}

## ⚠ 踩坑与经验

1. **一发现就重启 = 销毁证据**：内存里的后门、连接全没了，先取证再重启。
2. **只封 IP 不治本**：攻击者换 IP 又来，必须根除漏洞。
3. **没有备份 = 恢复无望**：定期演练从备份恢复，别等出事才发现备份是坏的。
4. **复盘对事不对人**：目标是改流程，不是追责任。

## ✅ 排障清单

- [ ] 记住 IR 六阶段（准备→检测→遏制→根除→恢复→复盘）
- [ ] 先遏制止血，再取证溯源
- [ ] 处置前先采集易失证据
- [ ] 有可恢复的备份并演练过
`
          },
          {
            id: "security-adv-4",
            title: "合规与数据安全治理",
            minutes: 17,
            updated: "2026-09-16",
            applies: "企业合规",
            tags: ["合规", "数据治理"],
            terms: ["等保", "数据分级", "隐私保护"],
            body: `
## 为什么要合规

合规不是纸上谈兵：等保 2.0、GDPR、个人信息保护法，都是**法律刚性要求**。
不合规 = 罚款、停业、法律责任；同时合规也是安全建设的框架。

## 一、数据分类分级

${F}text
公开 / 内部 / 敏感 / 核心（绝密）
→ 不同级别：加密要求、访问审批、留存期限、跨境限制都不同
例：身份证号、手机号 = 个人敏感信息，须脱敏存储与展示
${F}

## 二、合规落地的关键控制项

- **访问控制**：最小权限 + 审批留痕。
- **加密**：传输 TLS、存储加密、密钥集中管。
- **审计**：操作全程留痕、日志不可篡改。
- **留存与销毁**：到期自动销毁，不无限囤数据。
- **跨境/第三方**：数据出域评估，供应商签 DPA。

## 三、隐私保护设计（Privacy by Design）

${F}text
✅ 默认最少采集：不收集的就不问
✅ 展示脱敏：手机号 138****8000
✅ 用户可撤回授权、可删除（被遗忘权）
✅ 数据用途明示并限定，不外溢
${F}

## ⚠ 踩坑与经验

1. **合规不是堆文档**：制度要有技术控制支撑，否则一查就露馅。
2. **过度收集数据 = 风险自找**：收集越多，泄露代价越大，也越难合规。
3. **第三方/外包是盲区**：供应商出事你也担责，合同 + 审计不能少。
4. **等保「测评过」≠ 真安全**：测评是快照，日常运营才是长期仗。

## ✅ 排障清单

- [ ] 理解数据分类分级与差异化管控
- [ ] 知道合规关键控制项（访问/加密/审计/留存）
- [ ] 落实隐私 by Design（最少采集、脱敏、可撤回）
- [ ] 管好第三方数据风险
`
          }
        ]
      }
    ]
  };

  window.DOCS = {
    version: "1.2",
    updated: "2026-09-16",
    // 侧栏顺序：运维/SRE → Java 后端 → 网络与操作系统 → 数据库/DBA → 前端 Web
    //           → 云原生/DevOps → 安全（已完成正文）
    dirs: [
      OPS,
      window.JAVA, window.NETWORK, window.DBA, window.FRONTEND,
      DEVOPS, SECURITY
    ]
  };
})();
