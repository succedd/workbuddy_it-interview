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
            minutes: 20,
            updated: "2026-09-17",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "基础"],
            terms: ["Linux", "文件"],
            body: `
> **官方文档基线**：[Linux man-pages](https://man7.org/linux/man-pages/) · [The Linux Programming Interface](https://man7.org/tlpi/) · [GNU Coreutils 手册](https://www.gnu.org/software/coreutils/manual/coreutils.html) · [filesystem hierarchy(7)](https://man7.org/linux/man-pages/man7/file-hierarchy.7.html)

## 一、原理与底层机制

服务器上「一切皆文件」不是比喻，是 Linux 的统一抽象：硬件设备、进程、内核参数、管道、套接字都被暴露成文件，统一用「打开/读/写/关闭」那套接口操作。理解这一点，你就拿到了整张地图，不会再被「这个配置在哪」「那个进程信息怎么看」卡住。

- **VFS（虚拟文件系统）**：上层应用不直接碰具体文件系统（ext4/xfs/overlay/btrfs），而是走 VFS 这一层。所以 open()/read()/write() 对你的代码一模一样，底层是本地盘、网络盘还是内存盘对应用透明。换存储类型不用改业务代码。
- **inode 才是文件的本体**：目录里看到的名字只是「硬链接」——一个指向 inode 的指针。一个 inode 可以被多个名字指向（硬链接），删文件名只是减一个引用计数，引用归零才真正释放数据块。ls -i 能看到 inode 号；同一个 inode 的多个名字地位平等，没有「原文件」之分。
- **路径解析是逐层走的**：访问 /a/b/c 要先权限检查 /、/a、/a/b 每一级的 x（执行位=可进入）。这就是为什么「父目录没 x 权限，里面 777 也访问不到」——你连门都进不去，更别说读里面的文件。
- **FHS（文件系统层级标准）**规定各目录该放什么，所有发行版都遵守，所以你换一台机器也知道配置在 /etc、日志在 /var/log、数据在 /var/lib。这是运维的「肌肉记忆」起点。
- **一切皆文件也意味着一切皆路径**：看进程 ${C}cat /proc/<pid>/cmdline${C}；看内核参数 ${C}cat /proc/sys/...${C} 或 ${C}sysctl${C}；看挂载 ${C}cat /proc/mounts${C}。排障时这些路径比记命令更可靠。

## 二、规范与标准

| 目录 | 角色 | 运维常动作 | 红线 |
|---|---|---|---|
| /etc | 系统与应用的**配置文件** | 改 Nginx/MySQL/SSH 配置 | 改动前先备份、先 ${C}nginx -t${C} 类语法校验 |
| /var/log | 日志 | 排障第一站 | 必须配轮转，否则打满磁盘 |
| /var/lib | 应用**数据目录** | MySQL、Docker、容器数据 | 误删=丢数据，动之前三思并确认有备份 |
| /usr/bin /usr/local/bin | 可执行文件 | 自装软件放后者 | 别往系统目录乱塞，避免覆盖系统命令 |
| /opt | 第三方大软件 | JDK、自研程序 | 软链接做版本切换 |
| /home /root | 用户家目录 | 个人文件 | root 家目录只有 root 进，别把密钥放错地方 |
| /tmp | 临时文件 | 临时落盘 | 会被 systemd-tmpfiles 清理，别放长期文件 |
| /proc /sys | 内核运行时信息 | 看进程、看内核参数 | 别随意写 /proc、/sys，可能导致内核异常 |
| /dev | 设备文件 | 磁盘、null、random、stdin 等 | 理解设备节点，挂载/排障基础 |

## 三、实战

### 看（错误 vs 正确）
${F}bash
# ❌ 错误：大文件直接 cat 刷屏，关键信息看不到
cat /var/log/messages

# ✅ 正确：按场景选工具
ls -lah /etc          # -l 详情 -a 含隐藏 -h 人类可读大小
less -S file          # 大文件分页，S 不折行，/ 搜索，G 到末尾
head -n 50 file       # 头 50 行
tail -n 100 -f file   # -f 实时跟随（看日志必备，Ctrl+C 退出）
${F}

### 找（错误 vs 正确）
${F}bash
# ❌ 错误：遍历整个 / 很慢，还可能 Permission denied 刷屏
find / -name "*.log"

# ✅ 正确：限定目录 + 限定条件
find /var/log -name "*.log" -mtime -1          # 1 天内改过的日志
find / -type f -size +500M 2>/dev/null         # 大于 500M 的文件
find / -type f -mmin -30 2>/dev/null           # 30 分钟内新建的文件（查异常落盘）
grep -rn "ERROR" /var/log/app/                 # 递归搜内容
${F}

### 空间
${F}bash
df -h                 # 各分区还剩多少（人类可读）
df -i                 # inode 还剩多少（inode 满也会写不进去！）
du -sh /var/*         # 谁占了空间
du -sh /var/* | sort -rh | head -n 10   # 按大小排序取前 10
ncdu /var             # 交互式磁盘分析（推荐，比 du 直观）
${F}

### 增删与链接
${F}bash
mkdir -p /data/app/logs      # -p 递归创建，已存在不报错
cp -a src dst                # -a 保留属性（备份用，= -dR --preserve=all）
mv old new
rm -rf dir                   # ⚠ 危险，见误区
ln -s /data/app/current /app # 软链接：指向路径，可跨分区，源删了就失效
ln    f1 f2                  # 硬链接：指向同一 inode，同分区，删一个还在
${F}

**软链接做版本切换（线上最常用）**：发布时把 /app 指向新版本目录，出问题把软链接指回旧目录即可秒级回滚，比重新部署快得多。配合 ${C}ln -s new /app.tmp && mv -T /app.tmp /app${C} 还能做到原子切换。

## 四、覆盖广度

- **特殊文件**：/dev/null（黑洞，丢弃输出）、/dev/zero（无限 0）、/dev/random vs /dev/urandom（随机数源，加密用后者，random 会阻塞）、/dev/full（写满报错，测错误处理）。
- **字符设备 vs 块设备**：磁盘是块设备（随机读写，按扇区块），终端/串口是字符设备（流式），别混用；mount 时类型要对。
- **overlay 文件系统**：Docker 镜像分层、K8s emptyDir 都靠它；改容器里看到的内容要分清「只读层/可写层」，容器里看到的 /etc 可能和宿主机不同。
- **符号链接环**：ln -s . /tmp/loop 这类会让你 find/du 死循环，排查时加 -xdev 不跨文件系统，du 加 --one-file-system。
- **隐藏文件与点的含义**：以 . 开头的文件默认隐藏；.. 是父目录；路径里 . 是当前目录。
- **决策指引**：要「可进目录」给 x；要「列内容」给 r；删文件看的是父目录 w 不是文件本身权限；备份用 cp -a 或 rsync -a。

## 五、常见误区

1. **rm -rf / 与变量未定义**：rm -rf $DIR/* 在 DIR 为空时变成 rm -rf /*。脚本里一律写 rm -rf "\${DIR:?}"/*（变量未定义直接报错退出，不执行删除）。
2. **rm -rf 前不确认路径**：先把路径 ls 出来确认，或先 mv 到 /tmp 观察几天再删；生产用 rm -ri 逐条确认。
3. **以为 df 有空间就能写**：90% 是 inode 耗尽，用 df -i 确认；海量小文件（会话、缓存碎片）是元凶。
4. **往 /tmp 放要长期留的东西**：会被清理，丢了别喊冤；长期文件放 /var/lib 或专用数据盘。
5. **路径带空格不加引号**：rm -rf /data/old logs 会被当两个参数，必须加引号。
6. **硬链接跨分区**：硬链接只能同文件系统，跨分区用软链接；软链接源删了链接就断。
7. **改完配置不验证**：很多程序改错路径不报错，先确认文件真实存在再重启服务。

## 六、自检清单

- [ ] 能默写配置在 /etc、日志在 /var/log、数据在 /var/lib、程序在 /usr 与 /opt
- [ ] 会用 df -h / df -i 区分「空间满」与「inode 满」
- [ ] 会用 du -sh | sort -rh 与 ncdu 定位大目录
- [ ] 知道软链接做版本切换、硬链接同分区、原子切换 mv -T
- [ ] rm -rf 前先确认路径、变量加 :? 守卫
- [ ] 大文件用 less/tail -f，不盲目 cat
- [ ] 改动配置前先备份原文件

<!--dd:fs-basics-->

## 🔬 深挖：inode、链接与「为什么 du 和 df 不一致」

### 一、文件系统的基本构成

${C}${C}${C}
块设备 → 分区 → 文件系统（ext4 / XFS / Btrfs）→ 挂载点
文件系统内部：
  superblock   文件系统元信息（大小、块大小、inode 总数）
  inode 表     每个文件一个 inode（存元数据，不存文件名）
  data blocks  实际数据块
${C}${C}${C}

**inode 里有什么**：文件类型、权限、属主、大小、时间戳（atime/mtime/ctime）、**数据块的指针列表**、链接计数——**但没有文件名**。文件名保存在**目录项（dentry）**里，目录本质上是一张「文件名 → inode 号」的映射表。

这解释了三个反直觉的现象：
1. **硬链接为什么能存在**：多个文件名指向同一个 inode（链接计数 +1），删除一个名字只是计数 -1，数据不消失——**这就是「一个文件可以被多个路径访问」的本质**；
2. **软链接为什么能跨文件系统**：它存的是「路径字符串」，不是 inode 号，所以能跨分区、也能指向不存在的目标（悬空链接）；
3. **重命名为什么很快**：同文件系统内 ${C}mv${C} 只是改目录项，不搬数据。

${F}bash
ls -i file.txt                    # 看 inode 号
stat file.txt                     # 完整元数据（含链接计数、三个时间戳）
ln  a.txt hard.txt                # 硬链接（不能用在不同文件系统）
ln -s a.txt soft.txt              # 软链接
find / -inum 123456               # 按 inode 找所有硬链接
df -i                             # inode 使用率（★ 满了也会「写不进去」）
${F}

### 二、三个时间戳的含义与陷阱

| 时间戳 | 含义 | 何时更新 |
|---|---|---|
| atime | 访问时间 | 读文件时（受挂载参数影响） |
| mtime | 内容修改时间 | 内容变化时 |
| ctime | **inode 变更时间** | 内容、权限、属主、链接数变化时 |

**atime 不可靠**：现代发行版默认用 ${C}relatime${C} 挂载（只在 atime 早于 mtime 或超过 24h 时才更新），以节省写开销；要精确记录需 ${C}strictatime${C}（有性能代价）。**所以取证时不要只依赖 atime**。

**ctime 无法被伪造**（攻击者改 mtime 也不影响 ctime），因此排查被篡改文件时 **ctime 比 mtime 更可信**——这是「文件时间线分析」的一个关键技巧：

${F}bash
# 找最近 3 天 ctime 变化的文件（攻击者即使 touch 改了 mtime，ctime 也会变）
find / -xdev -ctime -3 -type f 2>/dev/null | head -30
# 找 mtime 与 ctime 明显不一致的文件（可能是被回改过时间的）
find / -xdev -type f -newer /etc/hostname 2>/dev/null | head
${F}

### 三、du 与 df 不一致的四种原因（这是最经典的困惑）

${C}${C}${C}
df   从 superblock 读「块分配情况」→ 反映文件系统整体占用
du   遍历目录、累加可见文件的大小 → 反映「你能看到的文件」
${C}${C}${C}

| 原因 | 说明 |
|---|---|
| **已删除但被进程持有** | 文件 deined 但进程还开着 fd → du 看不到、df 不释放 ★ 最常见 |
| 稀疏文件 | du 报实际占用块数，ls 报表观大小（两者本就不同） |
| 硬链接 | du 只算一次（同一 inode），多路径不重复计 |
| 挂载点覆盖 / 隐藏目录 | 目录被挂载覆盖后，原目录内容被「藏」起来，du 不计 |

${F}bash
lsof +L1                       # ★ 列出「已删除但仍被占用」的文件（含大小）
: > /proc/<pid>/fd/<n>         # 在线清空（不重启进程释放空间）
# 或重启持有该文件的进程
${F}

**另一个高频场景**：容器里的日志写到了可写层（未挂卷），容器重启才释放——这就是「容器磁盘占用只增不减」的常见根因。

### 四、挂载与容量的日常操作

${F}bash
mount | column -t                       # 当前挂载与参数
findmnt -T /data                        # 某个路径属于哪个挂载点（★ 比 mount 好读）
lsblk -f                                # 块设备与文件系统树（含 UUID）
blkid                                  # 分区 UUID（fstab 建议用 UUID 而非 /dev/sdX）
cat /etc/fstab                          # 持久挂载配置（★ 改错会导致开机失败，改前备份）
# 扩容（云盘在线扩容后）
growpart /dev/vda 1 && resize2fs /dev/vda1     # ext4
xfs_growfs /data                                # XFS（只能扩不能缩）
${F}

**安全修改 fstab**：用 ${C}mount -a${C} 先验证（不重启就能发现问题）；线上改动前保留原文件；对关键挂载加 ${C}nofail${C}（挂载失败不阻塞开机，避免「一块盘挂了整机起不来」）。

**tmpfs 与 swap 的取舍**：${C}/tmp${C} 若为 tmpfs 则占内存（重启即失，适合临时文件）；数据敏感或需持久化的目录**绝不能放 tmpfs**。swap 在云环境通常建议关闭或设小（避免内存压力下性能塌陷掩盖问题），但**完全无 swap 会让 OOM Killer 更早介入**——需要按场景权衡。

### 五、文件系统选型与常见操作风险

| 文件系统 | 特点 | 适用 |
|---|---|---|
| ext4 | 成熟稳定、可缩容、生态最好 | 通用默认 |
| XFS | 大文件与大并发性能好、**不可缩容** | 数据库、大容量数据盘 |
| Btrfs | 快照/子卷/校验和 | 需要快照的实验性场景 |
| ZFS | 校验和/去重/快照最强，内存需求高 | 存储服务器 |

**四个操作风险提醒**：① ${C}rm -rf${C} 在变量为空时可能变成 ${C}rm -rf /${C}——脚本里必须用 ${C}\${VAR:?}${C} 或先判断目录非空；② ${C}dd${C} 写错设备会毁数据（一定先 ${C}lsblk${C} 确认）；③ 磁盘写满会导致数据库拒绝写入与日志丢失（必须有容量告警，阈值 80%/90% 两级）；④ 在满盘的文件系统上删除文件**可能仍然无法写入**（ext4 保留 5% 给 root，普通进程仍受限）——要留出余量。

## 七、延伸

- 深入 inode 与 VFS：《The Linux Programming Interface》第 2~5 章（man7.org 可在线读）。
- stat、file、readlink -f 是定位「真实路径/链接链」的利器；namei -l /a/b/c 可逐级看路径权限。
- 进阶：理解 mount --bind、overlay、以及容器存储驱动，才能看懂 Docker/K8s 的磁盘占用与分层。
- 实战：写一个小脚本，每天巡检各分区使用率并超过阈值告警，把本章变成自动化能力。
`
          },
          {
            id: "perm-sudo",
            title: "用户、权限与 sudo",
            minutes: 22,
            updated: "2026-09-17",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "权限", "安全"],
            terms: ["Linux", "权限"],
            body: `
> **官方文档基线**：[file-hierarchy(7)](https://man7.org/linux/man-pages/man7/file-hierarchy.7.html) · [passwd(5)/credentials](https://man7.org/linux/man-pages/man5/passwd.5.html) · [sudoers 手册](https://www.sudo.ws/docs/man/sudoers.man/) · [TLPI 第 8 章 用户与组](https://man7.org/tlpi/) · [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)

## 一、原理与底层机制

Linux 的权限不是「这个文件谁能访问」一句话，而是**主体（谁）+ 客体（文件）+ 模式（怎么访问）+ 特殊位**的组合。初级运维 80% 的「命令执行不了」「服务起不来」「文件写不进去」，最后追下去都是权限问题。把这一节吃透，能省掉大量无意义的排查时间。

- **身份证明来自 uid/gid**：每个进程有真实 uid、有效 uid、文件系统 uid。进程以某个 uid 运行，对文件的访问权由文件的 owner/group/other 三套 rwx 决定。root（uid 0）默认绕过大部分 DAC 检查，所以 root 跑应用极其危险。
- **rwx 对文件和对目录含义不同**：文件 r=读内容、w=改内容、x=当作程序执行；目录 r=列出里面有什么、w=能新建/删除里面的文件、x=能进入这个目录（cd）。缺目录 x 位，里面 777 也访问不到。
- **权限判定顺序**：owner 命中看 owner 位；否则 group 命中看 group 位；否则看 other 位。没有「累加」——只看命中的那一组，不会把 owner 的 r 和 group 的 w 加起来。
- **umask 决定新建默认权限**：文件从 666 减 umask、目录从 777 减。常见 022 → 文件 644、目录 755；设 077 则新建只有自己能看（多用户服务器建议）。
- **三个特殊位**：setuid（以文件 owner 身份跑，如 passwd）、setgid（目录下新建文件继承组）、sticky（如 /tmp，只能删自己的）。

## 二、规范与标准

| 操作 | 推荐权限 | 理由 |
|---|---|---|
| 普通配置文件 | 644 (rw-r--r--) | 谁都能读，只有 owner 改 |
| 脚本/可执行 | 755 (rwxr-xr-x) | 别人能执行，不能改 |
| 私钥/密码文件 | 600 或 400 | 只有 owner 能读；SSH 私钥强制 600/400 |
| 团队共享写目录 | 2775 (setgid) | 谁建的文件都归 team 组 |
| 多用户服务器新建 | umask 077 | 默认只有自己能看 |
| 日志目录 | 750 或 640 | 运维可读，其他用户不可见 |

sudoers 铁律：**永远用 visudo 编辑**，它会做语法检查，错了不让保存；直接 vi 改错可能把自己锁死 root 权限。授权遵循最小权限：只给需要的命令，必要时 NOPASSWD 限定具体路径，绝不给 ALL 全部命令。

## 三、实战

### 修改权限（错误 vs 正确）
${F}bash
# ❌ 错误：图省事 777，等于任何人可读写执行，还绕过审计
chmod 777 app.conf

# ✅ 正确：先想清楚「谁要访问、需要什么权限」
chown app:app app.conf && chmod 640 app.conf   # owner 读写，组只读，其他无
chmod 600 /etc/ssl/private/key.pem              # 私钥
chmod +x deploy.sh                              # 脚本加执行位
chmod 400 /etc/ssl/private/key.pem              # 只读，私钥更稳
${F}

### sudo 用法
${F}bash
sudo -l                                   # 看自己能 sudo 什么（排查权限问题第一步）
sudo -u nginx cat /etc/nginx/nginx.conf   # 以 nginx 身份执行
sudo -i                                   # 拿 root 完整登录环境（推荐）
sudo -E cmd                               # 保留当前环境变量
${F}

### sudoers 片段
${F}bash
# 允许 ops 组无需密码执行 systemctl（最小化到具体命令）
%ops ALL=(ALL) NOPASSWD: /usr/bin/systemctl

# 只允许重启 nginx，别的都不行（最小权限原则）
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx

# 以另一个用户身份执行，不授予全部 root
%appops ALL=(app) NOPASSWD: /usr/bin/start.sh
${F}

### 安全巡检：找出所有 setuid 文件
${F}bash
find / -perm -4000 -type f 2>/dev/null     # setuid
find / -perm -2000 -type f 2>/dev/null     # setgid
${F}

## 四、覆盖广度

- **ACL（访问控制列表）**：当 owner/group/other 不够细时，用 setfacl/getfacl 给单个用户/组单独授权（如让运维组只读某目录而不动属主）。
- **capabilities**：比 setuid 更细的特权拆分（如只给绑定 80 端口的能力 CAP_NET_BIND_SERVICE），容器里常用，避免给整个程序 root。
- **不可变位**：chattr +i 让 root 也无法改/删（防误删、防篡改），lsattr 查看；chattr +a 只允许追加（适合日志）。
- **SELinux/AppArmor**：DAC 之上的强制访问控制，出问题常见「权限明明对了却拒绝」——用 getenforce 看状态，ausearch -m AVC 看拒绝日志，semanage 调策略。
- **umask 与部署**：CI/CD 部署出的文件默认 022，如果服务以低权用户跑，注意属主与 umask 协同。
- **决策指引**：服务以专用低权用户跑（app/nginx），绝不用 root；改 sudoers 一律 visudo；私钥 600；巡检 setuid/setgid。

## 五、常见误区

1. **sudo echo x > file 报 Permission denied**：重定向是当前 shell 做的，不是 sudo。正确：echo x | sudo tee file 或 sudo sh -c 'echo x > file'。
2. **chmod 777 是万恶之源**：看着解决了，实际是绕过。先搞清楚「谁要访问、需要什么权限」再精确授权。
3. **部署完忘 chown -R app:app**：服务以 app 跑却读不到 root 建的文件，启动失败高频原因。
4. **父目录没 x 也访问不到**：查权限要从根一路查父目录，不能只看目标文件。
5. **SSH 私钥 644 被拒**：必须 600/400，否则 ssh 直接拒绝使用。
6. **用 root 跑应用**：出问题影响面大，且安全风险高，合规不通过。
7. **sudoers 里给 ALL ALL=(ALL) ALL 再 NOPASSWD**：等于把 root 随便给人，应细化到命令。

## 六、自检清单

- [ ] 报错 Permission denied → 先 ls -l 看属主/权限，再 ps -ef 确认进程以哪个用户跑
- [ ] 查权限一路查父目录的 x 位
- [ ] 改 sudoers 一律 visudo，且只授权具体命令
- [ ] 部署后数据目录属主正确（chown -R app:app）
- [ ] 私钥类文件 600/400，应用不用 root
- [ ] 定期巡检 setuid/setgid 文件，发现异常
- [ ] 敏感目录用 ACL/capabilities 细化而非 777

<!--dd:perm-sudo-->

## 🔬 深挖：权限模型、ACL 与 sudo 策略

### 一、权限位与 umask 的完整关系

${C}${C}${C}
权限位：rwx rwx rwx（属主 / 属组 / 其他）
数字：  4=读 2=写 1=执行
  文件：读=看内容 写=改内容 执行=可运行（且需是二进制或带 shebang）
  目录：读=列目录名 写=在其中增删改名 执行=可进入/访问其中文件的元数据
       ★ 目录的「执行」位是访问其下文件的前提（常见「权限看着有但打不开」的根因）

umask 决定新建文件/目录的默认权限
  文件默认 666 & ~umask    目录默认 777 & ~umask
  umask 022 → 文件 644、目录 755（默认）
  umask 027 → 文件 640、目录 750（更安全，团队共享场景常用）
  umask 077 → 文件 600、目录 700（最私密）
${C}${C}${C}

**注意「文件默认无执行位」是刻意的设计**：避免新建的脚本被误执行。这也是「从别处拷来的脚本没执行权限」的原因（需要 ${C}chmod +x${C}）。

### 二、ACL：当 ugo 三个位不够用时

**场景**：一个目录要给「属主 + 属组 + 特定第三个用户 + 另一个组」不同权限——ugo 模型表达不了（只能加进属组，但会影响该组所有人）。

${F}bash
setfacl -m u:alice:rwx /data/project        # 给单独用户授权（不影响属组）
setfacl -m g:devops:rx  /data/project
setfacl -m d:u:alice:rwx /data/project      # ★ d: 前缀 = 默认 ACL，新建文件自动继承
getfacl /data/project                       # 查看（权限位末尾的 + 号表示有 ACL）
setfacl -x u:alice /data/project            # 删除某条
setfacl -b /data/project                    # 清空所有 ACL
${F}

**关键理解**：ACL 与传统的 mode 位**并存**，${C}ls -l${C} 显示的仍是 mode（ACL mask 会参与计算，可能让 group 位看起来变了）。**判断实际权限一律用 ${C}getfacl${C} 或 ${C}namei -l${C}**（后者能逐级显示路径上每一层的权限，是排查「为什么打不开」的神器）：

${F}bash
namei -l /data/project/sub/file.txt    # 逐级显示每一级目录与文件的权限
sudo -u alice test -r /path/file && echo readable   # 以目标用户身份实测
${F}

### 三、特殊权限位：把提权风险讲清楚

| 位 | 文件 | 目录 | 风险 |
|---|---|---|---|
| SUID(4000) | 执行时以**文件属主**身份运行 | 无实际意义 | 属主为 root 时 = 提权通道（${C}find / -perm -4000 -type f${C} 逐一审查） |
| SGID(2000) | 以文件**属组**身份运行 | 新建文件继承目录属组（**团队共享目录的正确用法**） | 获得额外组权限 |
| Sticky(1000) | 无实际意义 | 目录内文件**只有属主可删** | ${C}/tmp${C} 必须设置，否则任何用户可删他人文件 |

${F}bash
chmod g+s /data/team           # 团队共享目录：新文件自动属于 team 组
chmod +t /data/public          # 公共目录：防互删
chmod u-s /path/to/risky       # 去掉不必要的 SUID（加固常用动作）
find / -xdev -perm -4000 -type f -ls 2>/dev/null   # SUID 清单（对照基线核对）
${F}

### 四、sudo 策略：从「全权」到「最小授权」

${F}bash
# visudo -f /etc/sudoers.d/deploy     （★ 永远用 visudo，它会做语法检查，防止改坏后锁死 sudo）
# 语法：用户 主机=(以谁的身份) [NOPASSWD:] 命令(参数需精确匹配)

deploy  ALL=(root) NOPASSWD: /bin/systemctl restart myapp, /bin/systemctl status myapp
%devops ALL=(root) NOPASSWD: /usr/bin/docker ps, /usr/bin/docker logs *
alice   ALL=(ALL) ALL            # 注意：这等于给全部权限（仅限管理员）

# 危险写法（等于给了无限制的 root shell）
# bob ALL=(root) NOPASSWD: /bin/vi /etc/nginx/nginx.conf   ← vi 内可 :!sh 逃逸
# bob ALL=(root) NOPASSWD: /usr/bin/find                   ← find -exec 可执行任意命令
# 结论：需要给「能执行任意命令的程序」时，等于给了 root
${C}${C}${C}

**sudo 的关键技巧**：
- ${C}sudo -l${C} 查看自己能执行什么（排查「为什么 sudo 被拒」）；
- ${C}sudo -u appuser cmd${C} 以其他用户身份执行（用于验证权限问题）；
- **日志**：${C}/var/log/auth.log${C}（Debian）/ ${C}/var/log/secure${C}（RHEL）记录每次 sudo 调用，是审计的关键来源；配合 ${C}Defaults logfile${C} 单独记录；
- **避免 password-less ALL**：${C}NOPASSWD: ALL${C} 等于免密 root，一旦该账号泄露即完全失陷。

### 五、Linux Capabilities：比 SUID 更细的权限切分

传统模型里「需要绑定 80 端口」就得给 root；capabilities 允许只给「这一个能力」：

${F}bash
# 常用 capabilities：CAP_NET_BIND_SERVICE（绑低端口）、CAP_NET_ADMIN（网络配置）、
#                   CAP_SYS_TIME（改系统时间）、CAP_DAC_OVERRIDE（绕过文件权限）
getcap -r / 2>/dev/null                   # 查看已有 capability 的可执行文件
setcap cap_net_bind_service=+ep /usr/bin/myserver   # 允许非 root 绑 80 端口
getcap /usr/bin/myserver
setcap -r /usr/bin/myserver               # 移除

# 容器里同理（比 --privileged 精确得多）
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
${F}

**capabilities 的安全意义**：它把「root 的一揽子权限」拆成几十个独立能力，实践原则是 **drop ALL 再按需 add**。容器场景尤其重要——${C}--privileged${C} 等于给全部 capabilities + 关闭隔离，是容器逃逸的主要入口。

### 六、PAM：认证的插拔式栈

${C}${C}${C}
/etc/pam.d/sshd（服务名对应的栈配置），按顺序执行四类模块：
  auth      认证（口令、密钥、MFA）
  account   账号有效性（是否过期、是否允许登录）
  password  改密策略（复杂度、历史）
  session   会话设置（资源限制、挂载、环境）

控制标志：required（失败则最终失败，但继续执行后续）/
         requisite（失败立即返回）/ sufficient（成功即通过，跳过后续）/
         optional / [success=ok new_authtok_reqd=ok ignore=ignore ...]

常见用途：
  登录失败锁定    pam_tally2 / pam_faillock
  口令复杂度      pam_pwquality
  资源限制        pam_limits（对应 /etc/security/limits.conf）
  MFA             pam_google_authenticator
${C}${C}${C}

**两个实用认知**：① **SSH 的权限拒绝可能来自 PAM 而不是 sshd 配置**（如账号被 pam_faillock 锁定、${C}/etc/security/access.conf${C} 限制来源）——排查要同时看 sshd 日志与 PAM 日志；② **${C}limits.conf${C} 对 systemd 服务无效**（systemd 服务要用单元里的 ${C}LimitNOFILE=${C}）——这是「明明改了 limits 但服务仍然 too many open files」的根因。

## 七、延伸

- 深入 capability 与 setuid 安全：《TLPI》第 8、9 章。
- 生产环境接 LDAP/SSSD 做统一身份；服务器多后用 Ansible 的 file/acl 模块批量收敛权限。
- SELinux 排障：semanage、ausearch -m AVC、setsebool；容器里常需调容器 SELinux 策略。
- 进阶：把权限基线做成合规扫描（如 OpenSCAP），纳入上线卡点。
`
          },
          {
            id: "process-basics",
            title: "进程与资源查看入门",
            minutes: 20,
            updated: "2026-09-17",
            applies: "CentOS 7+ / Ubuntu 20.04+",
            tags: ["Linux", "进程", "systemd"],
            terms: ["进程", "Linux"],
            body: `
> **官方文档基线**：[proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) · [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html) · [systemd.service](https://www.freedesktop.org/software/systemd/man/systemd.service.html) · [TLPI 第 24~25 章 进程](https://man7.org/tlpi/) · [ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html)

## 一、原理与底层机制

程序是躺在磁盘上的文件，**进程是跑起来的程序**。每个进程有 PID、PPID（父进程）、所属 uid/gid、占用的 CPU/内存，以及一组文件描述符。运维日常就是：看进程在不在、占多少资源、卡在哪、怎么优雅地重启它。

- **进程树**：所有进程都是 init/PID 1 的后代；父进程退出，子进程被 init 收养（孤儿进程）。进程组、会话用于批量管理信号。
- **进程状态**：R 运行、S 可中断睡眠、D 不可中断睡眠（常等 IO，杀不掉）、Z 僵尸（已死但父进程没回收）、T 停止（被信号暂停）。
- **僵尸进程**：子进程退出后留一个 task_struct 等父进程 wait()；父进程不处理就会一直 Z，积累多了耗尽 PID 表，新进程起不来。
- **信号是进程间异步通知**：kill 本质是发信号，不是「杀死」。默认 SIGTERM 可被捕获做清理，SIGKILL 不可捕获。
- **systemd 管理服务生命周期**：start/stop/restart/reload/status，日志统一走 journalctl -u；它是绝大多数现代发行版的 init。

## 二、规范与标准

| 命令 | 用途 |
|---|---|
| ps -ef / pstree -p | 看进程与父子关系 |
| top / htop | 第一现场，P 按 CPU、M 按内存、1 看每核、c 看命令 |
| free -h | 看 available（不是 free） |
| ss -lntp | 本机监听端口（比 netstat 快，推荐） |
| systemctl status | 服务状态（报错基本在这） |
| journalctl -u | 该服务日志 |

**load average = 正在运行 + 等待运行（含等 IO）的进程数**；经验值 load/CPU 核数 ≤ 1 算轻松，持续 > 1 说明有排队。⚠ **load 高 ≠ CPU 高**：大量进程在等磁盘 IO 时，load 能飙到几十而 CPU 空闲，看 load 一定要配合 CPU 使用率和 IO 一起判断。

## 三、实战

### 查看与定位（错误 vs 正确）
${F}bash
# ❌ 错误：ps aux | grep 总会带出 grep 自己，且看不清父子
ps aux | grep nginx

# ✅ 正确：用 pgrep / forest，避免自匹配
pgrep -a nginx
ps -ef --forest
ps -eo pid,ppid,user,%cpu,%mem,cmd --sort=-%mem | head   # 按内存排序
pidstat -u 1                                        # 每个进程的 CPU（sysstat）
${F}

### 信号：kill 不是只能 -9
${F}bash
kill -15 1234        # 先礼后兵：TERM 优雅退出，让程序保存状态、关连接、摘流量
kill -9  1234        # 最后手段：KILL 不可捕获，来不及刷盘/释放锁/从注册中心摘除
kill -HUP <pid>      # 让 nginx 等重读配置（不中断）
pkill -f "java -jar app.jar"      # 按命令行匹配
${F}

### systemd 一句话入门
${F}bash
systemctl status nginx           # 看状态（报错信息基本都在这）
systemctl enable nginx           # 开机自启
systemctl reload nginx           # 不中断服务重载配置（优先用这个）
systemctl restart nginx          # 重启（会断连接）
journalctl -u nginx -f           # 看该服务的日志
journalctl -u nginx --since "10 min ago"
${F}

### 前台后台与 nohup
${F}bash
cmd &                        # 放后台，但关终端就死
nohup cmd > app.log 2>&1 &   # 关终端也继续跑（输出重定向到日志）
jobs; fg; bg                 # 查看/切前台/切后台
${F}

**正经服务别用 nohup**：没有自动拉起、没有日志轮转、没有依赖管理。交给 systemd（见进阶内容）。

## 四、覆盖广度

- **内存判断**：free 很小正常（被拿去做 buff/cache），available 才是「还能用多少」；available 持续偏低才危险。
- **D 状态进程**：等不可中断 IO（通常磁盘/网络存储），kill -9 也杀不掉，只能解决底层 IO 或重启；大量 D 状态往往指向存储故障。
- **僵尸处理**：杀其父进程（或让父进程正确处理 SIGCHLD）才能回收；若父进程是关键进程不能杀，需重启父进程。
- **孤儿进程**：父进程被 -9 后子进程被 init 收养，可能变成没人管的僵尸服务，监控要覆盖。
- **信号与优雅退出**：写服务时务必处理 SIGTERM 做清理（关连接、落盘、从注册中心注销），否则 kill -9 会雪崩。
- **决策指引**：服务不可用 ≠ 进程活着，要配合端口(ss)和健康接口；重启用 reload 不断连接；kill 先 -15 再 -9。

## 五、常见误区

1. **ps aux | grep 带出 grep 自己**：用 pgrep -a 或 grep [n]ginx 规避。
2. **进程在但服务不可用**：进程活着 ≠ 能服务。要配合端口（ss -lntp）和健康检查接口判断。
3. **子进程变孤儿**：父进程被 -9 后子进程被 init 收养，可能变没人管的僵尸服务。
4. **僵尸杀不掉**：它已经死了，杀其父进程或让父进程回收。
5. **重启用 restart 不用 reload**：nginx/systemd 支持的配置重载不会断连接，发布期间优先 reload。
6. **直接 kill -9**：来不及刷盘/释放锁/从注册中心摘除，可能导致数据损坏或流量继续打进来；永远先 -15。
7. **只看单进程不看树**：一个父进程带一堆子进程，要 top -Hp 看线程、pstree 看全貌。

## 六、自检清单

- [ ] 服务「起不来」：systemctl status + journalctl -u 看具体报错
- [ ] 服务「卡住」：top 看 CPU/内存，ss 看连接，pidstat 看上下文切换
- [ ] 杀进程先 -15，等 15 秒，不行再 -9
- [ ] 判断内存看 available 不是 free
- [ ] load 高要区分是 CPU 还是 IO 导致
- [ ] 大量 D 状态 → 查存储；大量 Z → 查父进程
- [ ] 发布/重启优先 reload 而非 restart

<!--dd:process-basics-->

## 🔬 深挖：/proc 视角下的进程与 OOM Killer

### 一、/proc 是理解 Linux 的钥匙

${C}${C}${C}
/proc/<pid>/cmdline   启动命令（参数以 \0 分隔）
/proc/<pid>/environ   环境变量（★ 可能含密钥，注意权限）
/proc/<pid>/fd/       打开的所有文件描述符（含 socket）
/proc/<pid>/limits    该进程的资源限制（ulimit 实际生效值）
/proc/<pid>/status    内存/线程/上下文切换/voluntary_ctxt_switches
/proc/<pid>/io        读写字节数（定位 IO 大户）
/proc/<pid>/stack     内核栈（D 状态进程卡在哪 → 需要 root）
/proc/<pid>/cgroup   所属 cgroup（容器边界的判定依据）
/proc/meminfo         系统内存全景
/proc/net/{tcp,dev}   网络连接与接口统计
/proc/pressure/*      资源压力（PSI：io/cpu/memory 的 stall 时间）
${C}${C}${C}

${F}bash
cat /proc/1234/cmdline | tr '\0' ' '; echo      # 完整启动命令
cat /proc/1234/limits | grep -i "open files"    # 实际生效的 FD 上限
ls -l /proc/1234/fd | wc -l                     # 当前 FD 数
cat /proc/1234/io                               # 该进程的 IO 字节数
cat /proc/1234/status | grep -E "State|Threads|VmRSS|voluntary"
cat /proc/1234/stack 2>/dev/null                # D 状态卡在哪（内核栈）
cat /proc/pressure/io                           # some/full 的 stall 微秒（PSI 最有用）
${F}

**PSI（Pressure Stall Information）是被低估的指标**：它直接量化「因为资源不足而 stall 的时间比例」，比 CPU 使用率更能反映用户体验。${C}/proc/pressure/{cpu,memory,io}${C} 的 ${C}full${C} 值高，说明确实有任务被资源卡住。

### 二、进程状态与 fork/exec 模型

${C}${C}${C}
ps 的 STAT 字符（组合出现）
  R  运行/可运行（在运行队列里）      S  可中断睡眠（等事件，正常）
  D  不可中断睡眠（等 IO，★ 大量 D = IO 瓶颈）
  Z  僵尸（已退出未被 wait）          T  停止（被信号挂起）
  s  会话首进程  l  多线程  +  前台   <  高优先级  N  低优先级

进程创建：fork() 复制父进程 → exec() 替换映像
  ★ fork 后 exec 前的窗口里，子进程与父进程共享代码，但地址空间是写时复制（COW）
  ★ 因此「大内存进程 fork」的开销主要在页表复制，不是内存复制（但 COW 累积会翻倍占用）
  ★ 这就是 Redis bgsave / JVM 之外的工具做 fork 快照时需要预留内存的原因
${C}${C}${C}

**僵尸进程的处理**：僵尸只占 PID 表项与少量内核结构，**杀它无效**（它已死），必须处理父进程（让它 wait，或 kill 父进程让 init 收养）。**大量僵尸说明程序有缺陷**（未回收子进程），不是运维问题。

**孤儿与守护化**：父进程退出后子进程被 ${C}init${C}（PID 1）或 subreaper 收养。systemd 服务下，若主进程退出而子进程仍在跑，systemd 会按 ${C}KillMode${C} 决定是否清理（默认 ${C}control-group${C} 会清理整个 cgroup——这是「为什么用 systemd 启动反而更干净」的原因）。

### 三、内存指标的正确读法

${C}${C}${C}
free -h 各列含义（★ 只看 free 是错的）
  total    物理内存总量
  used     已用（= total - free - buff/cache）
  free     完全未使用（通常很小很正常）
  buff/cache  页缓存与缓冲区（★ 可回收，不是「被占用」）
  available   估算的「新应用可用内存」 ← ★ 判断内存是否紧张看这个

/proc/meminfo 关键项
  MemAvailable   可用内存（同上，最权威）
  Dirty          待写回磁盘的脏页（大 = 写压力大或磁盘慢）
  Writeback      正在写回的页
  AnonPages      匿名页（堆/栈，不可回收，只能 swap）
  Slab/SReclaimable  内核对象缓存（SReclaimable 可回收）
  SwapCached     已换回内存的 swap 内容
  CommitLimit/Committed_AS  超售情况（Committed > Limit 有 OOM 风险）
${C}${C}${C}

**一条重要认知**：**Linux 会积极使用空闲内存做页缓存**（所以 ${C}free${C} 很小是正常的、且是好事）。反过来，看到「内存被占满」要先看 ${C}available${C}——如果 available 充足，说明只是缓存，不需要处理。

### 四、OOM Killer 的判定逻辑与预防

${C}${C}${C}
内核在「无法满足内存分配且无法回收/换出」时触发 OOM Killer
选择牺牲者的依据（/proc/<pid>/oom_score）：
  基础分 = 进程占用的内存（RSS + swap）占系统总内存的比例
  调整项 = /proc/<pid>/oom_score_adj（-1000 ~ 1000）
    -1000 → 永不被杀（关键进程保护）
  ★ 容器/服务通常应设 oom_score_adj 或改用 cgroup 内存限制（更可控）

cgroup v2 内存限制下的行为不同：
  容器触及 memory.max → 触发 cgroup 内 OOM，只杀该 cgroup 内的进程
  （不再影响整个系统）——这是容器比裸进程更安全的一点
${C}${C}${C}

${F}bash
# 预防与保护
systemctl edit myapp                 # 加 OOMScoreAdjust=-500（保护关键服务）
cat /proc/<pid>/oom_score            # 当前分数
cat /proc/<pid>/oom_score_adj
dmesg -T | grep -i "killed process"  # 查看历史 OOM 记录（含被杀进程与内存用量）★
journalctl -k | grep -i oom
# 容器的内存限制（更推荐）
docker run -m 1g --memory-swap 1g myapp
${F}

**「进程莫名消失」的第一反应应该是查 OOM**（${C}dmesg${C} 或 ${C}journalctl -k${C}），而不是先怀疑程序 bug——这是运维排障的常见起手式。

### 五、线程与进程的观测

${F}bash
ps -eLf | wc -l                     # 系统线程总数
ps -o nlwp,pid,cmd -p <pid>         # 某进程的线程数（nlwp）
ls /proc/<pid>/task | wc -l         # 等价做法
top -H -p <pid>                     # 按线程看 CPU（找热点线程）
cat /proc/<pid>/status | grep Threads
ulimit -u                           # 用户可创建的进程/线程上限
cat /sys/fs/cgroup/pids.max         # cgroup 的 PID 上限（容器常见瓶颈）
${F}

**「unable to create new native thread」的四个原因**：① ${C}ulimit -u${C} 太小；② cgroup pids.max 限制；③ 系统内存不足（每线程栈 1MB）；④ 应用线程泄漏（线程池无界或未复用）。**排查顺序：先看实际线程数是否合理，再看限制**——如果线程数远超预期，那是泄漏而不是限制问题。

**上下文切换**：${C}voluntary_ctxt_switches${C}（主动让出，如等 IO）与 ${C}nonvoluntary${C}（被抢占，说明 CPU 竞争激烈）。前者高是 IO 密集的正常表现，**后者高才是 CPU 不足的信号**——这比单纯看 CPU 使用率更有解释力。

## 七、延伸

- 深入 fork/exec、信号、僵尸：《TLPI》第 24~27 章。
- cgroups：systemd 用 cgroup 隔离资源，容器本质也是 cgroup + namespace；systemd-run 可临时起受限单元。
- 进阶：用 systemd 的 Restart=、MemoryMax=、TasksMax= 做自愈与限流；用 jemalloc/perf 配合 top -Hp 定位线程级热点。
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
            minutes: 28,
            updated: "2026-09-17",
            applies: "Linux 内核 3.10+",
            tags: ["性能", "排障"],
            terms: ["性能", "CPU", "内存"],
            body: `
> **官方文档基线**：[Brendan Gregg — Systems Performance](https://www.brendangregg.com/systems-performance.html) · [USE 方法](https://www.brendangregg.com/usemethod.html) · [Linux Performance 实战](https://www.brendangregg.com/linuxperf.html) · [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) · [vmstat(8)](https://man7.org/linux/man-pages/man8/vmstat.8.html)

## 一、原理与底层机制

性能排障的本质是**在四类资源上逐一回答三个问题**（USE 方法，Brendan Gregg）：
- **U**tilization 使用率：资源忙不忙
- **S**aturation 饱和度：有没有排队（排队长度比使用率更早暴露问题）
- **E**rrors 错误：有没有报错

四类资源：**CPU、内存、磁盘、网络**。盲目 top 一圈是找不到瓶颈的，按资源逐个过，5 分钟就能圈定方向。绝大多数性能问题是**局部的、可定位的**，关键是方法而非工具数量。

- **CPU 视角**：用户态(us)、内核态(sy)、等待 IO(wa)、软中断(si)。us 高=应用自己在算（死循环、正则回溯、序列化、GC）；sy 高=系统调用频繁（小文件 IO、频繁建连、上下文切换多）；wa 高=磁盘慢，转磁盘章节；si 高=软中断集中某核，常见网卡小包风暴。
- **内存视角**：available 才是「还能用多少」，free 小正常（被拿去做缓存）。si/so 非 0 说明在交换，性能断崖下跌；OOM 看 dmesg。
- **磁盘视角**：%util 接近 100 是饱和，await 是平均等待；真正信号是 await 涨+应用变慢，不是单纯 %util。
- **网络视角**：连接状态分布（TIME_WAIT/CLOSE_WAIT）、重传率、丢包；小包风暴与吞吐瓶颈表现不同。

## 二、规范与标准

| 资源 | 第一手命令 | 关键指标 | 危险阈值 |
|---|---|---|---|
| CPU | top / vmstat 1 / pidstat | run 队列 r、us/sy/wa、cs | r 持续 > 核数 |
| 内存 | free -h / vmstat | available、si/so | si/so 非 0 |
| 磁盘 | iostat -x 1 | %util、await、svctm | await 远超基线 |
| 网络 | ss -s / sar -n | 状态分布、retrans、drop | retrans 持续涨 |

线上规范：定位到瓶颈后**先保存现场快照**再重启；看趋势（sar/监控）而非瞬时；90% 问题在应用层（慢 SQL、死循环、连接不复用、锁竞争），不要一上来调内核参数。

## 三、实战

### CPU 定位（错误 vs 正确）
${F}bash
# ❌ 错误：只盯 top 一个瞬时值，且不会下钻
top

# ✅ 正确：USE 三问 + 钻取到线程
vmstat 1                  # r=运行队列(>核数即排队) cs=上下文切换 us/sy/wa
pidstat -u 1              # 每进程 CPU
pidstat -w 1              # 每进程上下文切换（暴增多半锁竞争/线程过多）
# Java CPU 飙高标准定位法
top -Hp <pid>                          # 最耗 CPU 的线程(十进制)
printf "%x\\n" <tid>                    # 转十六进制
jstack <pid> | grep -A 30 <hex_tid>   # 直接看到哪行代码
${F}

### 内存与 OOM
${F}bash
free -h                    # 看 available
vmstat 1                   # si/so 非 0 = 正在交换
dmesg -T | grep -i "out of memory"     # OOM Killer 日志
cat /sys/fs/cgroup/memory.max          # 容器看 cgroup 限制
grep -i oom /var/log/messages          # 有些发行版也记这里
${F}

### 磁盘与网络
${F}bash
iostat -x 1                # %util/await，看哪块盘
ss -s                      # 连接状态统计
sar -n DEV 1               # 网卡流量与包量（包量小但流量大=大包）
sar -n TCP,ETCP 1          # 重传(retrans)、建连失败
ethtool -S eth0 | grep -i drop         # 网卡丢包
${F}

**容器 OOM 经典坑**：JVM 看不到 cgroup 限制，按宿主机内存算堆 → 一跑就 OOMKilled。JDK 8u191+/11+ 默认容器感知，或显式 -XX:MaxRAMPercentage=70.0（别用 -Xmx 写死）。

## 四、覆盖广度

- **磁盘 IO 模型**：%util 100% 不一定到极限（RAID/SSD 有并行度），要结合 await 与业务变慢判断；真正的信号是 await 明显上涨 + 应用变慢。
- **网络状态语义**：TIME_WAIT 正常（主动关闭方，不占内存描述符）；CLOSE_WAIT=程序 bug（连接泄漏）；重传率高=网络差或对端慢；大量 SYN_RECV=可能被 SYN Flood。
- **上下文切换过多**：线程数爆炸或锁竞争，用 pidstat -w 看；中断不均用 mpstat -P ALL。
- **sys 高**：频繁小文件 IO、频繁建连、大量系统调用；考虑批处理、连接池、缓存。
- **平均响应时间骗人**：P99 才是用户体验，平均 50ms 但 P99 3s 说明有长尾；监控要盯分位。
- **决策指引**：load 高先分 CPU 还是 IO；容器里按 cgroup 限额看，别看宿主机；定位后保存 jstack/perf/ss 快照再重启。

## 五、常见误区

1. **只看瞬时 top**：瞬时值易误导，看 5 分钟以上趋势（sar/监控图）。
2. **一上来调内核参数**：90% 在应用层，先查慢 SQL/死循环/连接复用/锁。
3. **平均响应时间骗人**：P99 才是体验，长尾最伤用户。
4. **容器里看宿主机指标误判**：top 看到的是宿主机核数，要按 cgroup 限额。
5. **重启前不存现场**：jstack/perf/ss/dmesg 快照没了就复盘不了。
6. **把 wa 高当 CPU 问题**：wa 高指向磁盘 IO，去磁盘章节。
7. **忽视饱和度**：使用率不高但排队严重（如磁盘 %util 80% 但 await 暴涨）才是真瓶颈。

## 六、自检清单

- [ ] USE 四问覆盖 CPU/内存/磁盘/网络
- [ ] CPU：区分 us/sy/wa/si，run 队列是否 > 核数
- [ ] 内存：available + si/so + dmesg 查 OOM
- [ ] 磁盘：iostat -x 看 %util 与 await
- [ ] 网络：ss -s 看状态、sar -n 看重传与丢包
- [ ] Java：top -Hp + jstack 下钻线程
- [ ] 定位后保存现场快照再重启

<!--dd:perf-four-->

## 🔬 深挖：USE 方法与瓶颈的因果链

### 一、USE 方法：系统化而非凭经验

${C}${C}${C}
USE（Brendan Gregg）：对每个资源检查三项
  U 使用率（Utilization）：资源忙碌的时间比例
  S 饱和度（Saturation）：排队/等待的量（★ 最容易忽略，却最能反映问题）
  E 错误（Errors）：错误计数（网卡丢包、磁盘重映射、内存 ECC）

四类资源的 USE 检查项
  CPU     ：util = us+sy / 核心数；saturation = 运行队列长度（vmstat 的 r）/ PSI cpu
  内存    ：util = available 比例；saturation = swap 换出速率 / PSI memory
  磁盘    ：util = %util；saturation = await 与队列深度 avgqu-sz；errors = smartctl
  网络    ：util = 带宽利用率；saturation = 队列丢弃（tc/ifconfig dropped）；errors = errors
${C}${C}${C}

**为什么饱和度比使用率重要**：使用率 60% 但队列很长的资源，实际已经让请求排队；使用率 95% 但没有排队的资源（如批处理），对延迟影响反而不大。**「有排队 = 用户能感知」**。

### 二、CPU 分析的三个常见误读

${C}${C}${C}
① load average 不是「CPU 使用率」
   load 包含 R（可运行）+ D（不可中断睡眠）状态的进程数
   → load 10 在 16 核上完全正常；load 4 在 2 核上已经过载
   → load 高但 CPU 空闲 → 看 D 状态（IO 卡住）而不是加 CPU
   → 1/5/15 分钟三条曲线：只看 1 分钟会被瞬时抖动误判

② us 高 ≠ 用户代码慢
   us 高可能来自：JIT 编译线程、GC 线程（本质是内存问题）、加密/压缩计算
   → 用火焰图确认热点函数，不要凭「us 高」就下结论

③ sy 高说明系统调用/上下文切换开销大
   常见原因：大量小 IO（日志逐行写）、频繁网络小包、锁竞争导致的 futex 调用、
            频繁 fork/exec（脚本调用）
   定位：perf top 看内核函数（如 tcp_sendmsg / __x64_sys_write / futex_wait）
${C}${C}${C}

${F}bash
uptime; nproc                                   # load 与核心数（先算比例）
vmstat 1 10                                     # r/b/us/sy/id/wa/cs/in/cs
mpstat -P ALL 1 3                               # 每核的 us/sy/iowait（发现单核热点）
pidstat -u 1 5                                  # 按进程看 CPU
perf top -p <pid>                               # 实时看热点函数（内核态+用户态）
# 火焰图（采样原理：按固定频率抓调用栈，聚合后按宽度排序）
perf record -F 99 -p <pid> -g -- sleep 30 && perf script | stackcollapse-perf.pl | flamegraph.pl > cpu.svg
${F}

**火焰图的读法**：**宽度 = 占用时间比例**（不是次数），从下往上是调用链，最上层的宽条就是真正的热点。**不要看颜色**（颜色只是随机区分）。

### 三、IO 分析的因果链

${C}${C}${C}
应用写入 → 页缓存（内存）→ 回写线程 → 块层 → 设备队列 → 磁盘
瓶颈可能出现在任一环：
  ① 应用写太频繁（小 IO 多）→ 合并为大 IO 或改批量写
  ② 脏页回写压力（Dirty 过大）→ 调整 vm.dirty_ratio / dirty_background_ratio
  ③ 块层调度与队列深度（SSD 可调大 nr_requests、用 none/mq-deadline）
  ④ 设备本身饱和（%util 100 + await 上升）→ 升级盘或分片
  ⑤ 云盘 IOPS/吞吐配额（★ 云环境最常见的隐藏上限，控制台可见）
${C}${C}${C}

${F}bash
iostat -xz 1 5                  # -x 扩展：%util、await、r_await/w_await、avgqu-sz、aqu-sz
iotop -oPa                      # 按进程看实际 IO（-a 累计，-P 按进程，-o 只看有 IO 的）
cat /proc/pressure/io           # PSI：IO stall 比例（最直观的「IO 是否拖慢业务」）
cat /sys/block/vda/queue/scheduler
# 找出是谁在写（应用层视角）
pstree -p $(pgrep -f myapp)
strace -f -e trace=write,fsync -p <pid> 2>&1 | head   # 看写系统调用（谨慎，有开销）
${F}

**区分「顺序 IO」与「随机 IO」**：顺序吞吐看 MB/s（大文件读写、日志追加），随机性能看 IOPS 与 await（数据库）。**同一块盘，这两个指标的瓶颈完全不同**——所以「磁盘性能不够」必须说清是哪种。

### 四、网络性能的分析层次

${C}${C}${C}
① 带宽与包速率（是否打满配额）
② 错误与丢包（ifconfig/ip -s link 的 errors/dropped；ss -s 的 retrans）
③ 连接状态（TIME_WAIT/CLOSE_WAIT 数量异常 → 应用或内核参数问题）
④ 队列与缓冲（网卡 ring buffer 溢出：ethtool -S | grep -i drop）
⑤ 应用层（分阶段耗时：DNS/连接/TLS/TTFB/传输）
${C}${C}${C}

${F}bash
ip -s link                          # 每接口的包/字节/错误/丢弃
ss -s                               # 连接状态汇总
ss -ti                              # TCP 内部信息：rtt、cwnd、retrans、重传次数 ★ 极有用
ss -lnt "sport = :8080"             # 看监听队列（Recv-Q 堆积 = 应用处理不过来）
nstat -az | grep -iE "retrans|drop|overflow|prune"
ethtool -S eth0 | grep -iE "drop|error|miss"
sar -n DEV 1 5                      # 历史网络速率
${F}

**${C}ss -ti${C} 是最被低估的工具**：它能直接告诉你「这条连接的 RTT 多少、拥塞窗口多大、有没有重传」——不用抓包就能判断是网络问题还是应用问题。

### 五、perf 与 eBPF 的能力边界

| 工具族 | 能力 | 代价 | 适用 |
|---|---|---|---|
| vmstat/iostat/pidstat | 系统与进程级计数 | 极低 | 第一层排查（永远先用这些） |
| perf | 采样栈、硬件计数器、追踪点 | 低（采样有开销但可控） | 定位热点函数、找 CPU 方向 |
| strace/ltrace | 系统调用/库调用全量记录 | **高**（生产慎用） | 少量诊断（如「为什么卡在这」） |
| tcpdump | 抓包 | 中~高（取决于流量与过滤） | 网络协议层问题 |
| eBPF（bcc/bpftrace） | 内核级可编程可观测，低开销 | 低（但需内核支持与权限） | 生产环境深度排查（推荐方向） |

${F}bash
# eBPF 实用示例（bpftrace）
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { @[comm] = count(); }'      # 谁在频繁开文件
bpftrace -e 'kprobe:tcp_retransmit_skb { @[pid, comm] = count(); }'            # 谁在重传
bpftrace -e 'tracepoint:block:block_rq_issue { @[comm] = hist(args->bytes); }' # IO 大小分布
# 已经成熟的 eBPF 工具（直接可用，无需写脚本）
execsnoop-bpfcc        # 跟踪新进程（排查「谁在起进程」）
opensnoop-bpfcc        # 跟踪文件打开
biolatency-bpfcc       # IO 延迟直方图
tcplife-bpfcc          # TCP 连接生命周期
profile-bpfcc          # CPU 采样火焰图（不需要 perf）
${F}

**排障的工具选择纪律**：**先用低开销工具（vmstat/iostat/ss）确认方向，再用高开销工具（strace/tcpdump）确认细节**。直接在核心服务上跑 ${C}strace -f${C} 可能让延迟翻倍——这是「排障导致故障」的经典方式。

## 七、延伸

- Brendan Gregg 的 [Flame Graphs](https://www.brendangregg.com/flamegraphs.html)：用 perf/torch 生成火焰图，一眼看 CPU 花在哪。
- eBPF（bcc 工具集）：无侵入观测（biosnoop、offcputime、tcplife），取代很多老工具。
- 进阶：理解 run 队列、cgroup v2、以及 PSI（Pressure Stall Information）做精准饱和度判断；用 perf record 抓热点函数。
`
          },
          {
            id: "log-system",
            title: "日志体系：收集、轮转与排障",
            minutes: 24,
            updated: "2026-09-17",
            applies: "systemd / rsyslog / ELK / Loki",
            tags: ["日志", "可观测性"],
            terms: ["日志"],
            body: `
> **官方文档基线**：[systemd journald 文档](https://www.freedesktop.org/software/systemd/man/journalctl.html) · [journald.conf](https://www.freedesktop.org/software/systemd/man/journald.conf.html) · [logrotate(8)](https://man7.org/linux/man-pages/man8/logrotate.8.html) · [Grafana Loki 文档](https://grafana.com/docs/loki/latest/) · [Elasticsearch 文档](https://www.elastic.co/guide/index.html)

## 一、原理与底层机制

日志是故障现场的唯一还原手段：监控告诉你「出事了」，日志告诉你「为什么」。但现实常是——没打、打满磁盘、或散在 50 台机器各登各的。出故障时，日志是**唯一能还原现场的东西**，其它手段（指标、链路）只能告诉你「哪里慢/错了」，说不清「为什么」。

- **systemd 时代 journald 接管**：日志以二进制存 /run/log/journal（内存，重启丢）或 /var/log/journal（持久）。默认重启后丢失，**生产必须开持久化**，否则排障只能看从故障到现在的一小段。
- **元数据索引**：journald 给每条日志打时间戳、unit、pid、优先级，可按 --since/-p err/-u 过滤，比 grep 文件强得多；还能跨 boot 查（-b -1 看上一次启动）。
- **轮转的本质**：避免单文件无限增长打满磁盘。应用日志靠 logrotate；journald 靠自身容量上限（SystemMaxUse）。
- **集中式的必要**：多机后必须汇聚，靠 traceId 把一次请求跨服务串起来；否则 50 台机器一台台登着找日志不现实。

## 二、规范与标准

| 项 | 规范 |
|---|---|
| 持久化 | /var/log/journal 开启 + SystemMaxUse 设上限（如 2G） |
| 轮转 | 每应用配 logrotate，先 logrotate -d 演练 |
| 级别 | ERROR=需人处理；WARN=关注；INFO=关键节点；DEBUG 不上生产 |
| 格式 | 结构化 JSON，带 traceId/requestId |
| 脱敏 | 密码/身份证/token 必须脱敏（合规红线） |
| 时钟 | 所有机器 NTP 同步、时区一致（容器注意默认 UTC） |

## 三、实战

### journald（错误 vs 正确）
${F}bash
# ❌ 错误：只看某个文件，跨服务/跨 boot 无从关联
tail -f /var/log/app.log

# ✅ 正确：用 journald 的元数据过滤
journalctl -u app -f                              # 实时跟
journalctl -u app --since "2026-09-14 10:00" --until "10:30"
journalctl -u app -p err --since today           # 只看错误
journalctl -b -1 -u app                          # 上一次启动的该服务日志
journalctl --disk-usage                          # 占了多少
journalctl --vacuum-size=1G                      # 清理到 1G 内
${F}

持久化：
${F}bash
mkdir -p /var/log/journal && systemd-tmpfiles --create --prefix /var/log/journal
systemctl restart systemd-journald
${F}

配置 /etc/systemd/journald.conf：
${F}ini
[Journal]
Storage=persistent
SystemMaxUse=2G
MaxRetentionSec=2week
${F}

### logrotate（错误 vs 正确）
${F}
# ❌ 错误：程序不支持重开句柄却用 postrotate reload，日志写进已改名文件
/var/log/app/*.log { daily rotate 7 postrotate kill -HUP $(cat app.pid) endscript }

# ✅ 正确：能重开用 postrotate，不能重开用 copytruncate（截断可能丢几行）
/var/log/app/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0640 app app
}
${F}

验证：${C}logrotate -d /etc/logrotate.d/myapp${C}（演练看会做什么）、${C}-f${C}（强制执行一次）。

## 四、覆盖广度

- **集中方案选型**：ELK（Elasticsearch+Logstash/Fluentd+Kibana，检索强但重）、Loki+Promtail+Grafana（轻量、按标签索引、成本低）、云日志服务（开箱即用）。
- **采集端**：Filebeat/Promtail/Fluent Bit 比 Logstash 轻得多，边车或 DaemonSet 部署。
- **结构化日志样例**：{"ts":...,"level":"ERROR","traceId":"a1b2","service":"order","msg":"create failed","userId":10086}。
- **日志分级纪律**：别在循环里打日志（高并发能写满磁盘）；别只打「发生什么」不打「为什么」（带 userId/订单号/参数摘要）。
- **采集与存储分层**：热数据（近 7 天）全文检索，冷数据降采样或归档，控制成本。
- **决策指引**：先持久化+轮转+告警（防自伤），再多机集中+traceId（防排查崩溃）；DEBUG 日志生产默认关。

## 五、常见误区

1. **日志打满磁盘拖垮整机**：最常见自伤。必须 logrotate + journald 上限 + 磁盘 >80% 告警。
2. **时间不同步排查崩溃**：多机日志对不上时间等于白打，全机 NTP 同步、容器注意时区。
3. **日志丢失**：异步写缓冲未刷盘就 kill -9；或 logrotate 与程序句柄没配合好。
4. **DEBUG 忘关**：一次压测写满磁盘的经典原因。
5. **只打现象不打上下文**：缺 userId/参数，等于没打，复盘时无法关联。
6. **明文敏感信息**：密码、token、身份证进日志，合规事故。
7. **配置没演练**：logrotate 没验证过，真出问题才发现根本没轮转。

## 六、自检清单

- [ ] journald 已持久化且有容量上限（SystemMaxUse）
- [ ] 应用日志配 logrotate 且验证过（logrotate -d）
- [ ] 多机有集中日志，支持 traceId 检索
- [ ] 所有机器 NTP 同步、时区一致
- [ ] 磁盘使用率有告警（80% 预警）
- [ ] 日志无明文敏感信息，DEBUG 不上生产
- [ ] 关键错误有告警（不止落盘）

<!--dd:log-system-->

## 🔬 深挖：日志架构与轮转的隐藏陷阱

### 一、journald 与 rsyslog 的分工

${C}${C}${C}
systemd-journald        收集所有服务的 stdout/stderr 与内核消息
  优点：结构化字段（_PID/_UID/_SYSTEMD_UNIT/优先级）、二进制索引快、可按字段过滤
  缺点：二进制存储、默认不轮转到磁盘（重启丢失，除非配 Storage=persistent）、
        不适合长期与集中分析

rsyslog / syslog-ng     传统的文本转发与落盘
  /var/log/messages、/var/log/secure、/var/log/cron 等
  优点：文本易读、生态成熟、易转发到远端
  缺点：无结构，靠正则解析

★ 实践组合：应用日志统一写 stdout → journald 采集 → rsyslog/Vector 转发到中央
            关键主机两边都留（本地便于单机排障，远端用于审计与关联）
${C}${C}${C}

${F}bash
journalctl -u myapp --since "1 hour ago" -p warning    # 按单元+时间+级别
journalctl -u myapp -o json-pretty | head              # 看结构化字段（有哪些属性）
journalctl _PID=1234 -n 100                            # 按字段过滤
journalctl -b -1 -p err                                # 上次启动的错误（★ 排查重启原因）
journalctl --disk-usage; journalctl --vacuum-size=500M  # 占用与清理
# 限制占用（避免日志吃满磁盘）
# /etc/systemd/journald.conf: SystemMaxUse=1G  SystemKeepFree=2G  Storage=persistent
${F}

**journald 的两个关键配置**：${C}Storage=persistent${C}（否则重启丢日志，排障时最想要的历史恰恰是重启前那段）、${C}SystemMaxUse${C}（否则日志吃满磁盘导致服务全挂——这是真实事故的常见成因）。

### 二、日志级别的使用纪律

| 级别 | 何时用 | 生产是否保留 |
|---|---|---|
| ERROR | 需要人干预的失败 | ✅ 必须，且应告警 |
| WARN | 异常但已处理/可自愈 | ✅ 保留，关注趋势 |
| INFO | 关键业务事件（订单创建、支付成功） | ✅ 保留（业务审计价值） |
| DEBUG | 开发调试细节 | ❌ 生产关闭（或按需临时开） |

**三条纪律**：① **不要把正常流程打成 ERROR**（会让告警失效）；② **不要在循环里打 INFO**（日志量爆炸，且拖慢主流程）；③ **日志要带上下文**（trace_id、用户/订单号、耗时），否则一条孤立的错误日志价值极低。

**高并发场景的日志性能**：同步写日志会阻塞业务线程（尤其写文件 + fsync）。做法：使用异步 Appender（有界队列 + 丢弃策略）、按级别采样（同一错误每秒最多 N 条）、避免拼接大字符串（用占位符延迟求值）。

### 三、logrotate 与 copytruncate 的坑

${F}
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    rotate 14
    size 100M
    compress
    delaycompress
    missingok
    notifempty
    create 0640 app app
    sharedscripts
    postrotate
        /bin/kill -USR1 $(cat /var/run/myapp.pid)   # 让应用重新打开文件
    endscript
}
${F}

**核心问题：文件被 rename 后，进程还持有旧 inode**。日志轮转的原理是「改文件名 + 通知进程重开」，如果应用不支持重开（不知道 USR1 的处理、或不监听信号），就需要 **copytruncate**：

${C}${C}${C}
copytruncate 的做法：拷贝一份 → 把原文件截断为 0（不 rename）
  优点：应用无感，不需要支持信号
  缺点：★ 拷贝与截断之间写入的日志会丢失（竞态）；对大文件耗时且有 IO 峰值
结论：优先「信号重开」（应用配合）；copytruncate 只在无法改应用时用
${C}${C}${C}

**忘记配轮转的后果很真实**：日志文件涨到几十 GB，磁盘写满，服务全挂；或者更隐蔽——磁盘没满但 inode 用尽（大量小日志文件）。**所以「日志轮转」必须在服务上线时一起配好，而不是出事再补。**

### 四、集中式日志架构与成本控制

${C}${C}${C}
采集层：Filebeat / Fluent Bit / Vector（DaemonSet 或节点 Agent）
  职责：读文件或容器日志，加元数据（host/pod/namespace/version），做初步过滤
传输层：Kafka（削峰 + 解耦）；小规模可直发
    ★ Kafka 的价值在于「消费端挂了不会丢日志，也不会反压采集端」
存储与查询层：
  Elasticsearch：全文检索强，资源消耗大（内存/磁盘）
  Loki：按标签索引、日志体不索引 → 成本低得多（Grafana 生态推荐）
  ClickHouse：自建高压缩、查询快，适合大规模结构化日志
${C}${C}${C}

**成本与噪声治理的五个手段**：
1. **采集端过滤**（DEBUG 不入库、健康检查日志丢弃）——**最有效的省钱手段**，比事后清理便宜得多；
2. **采样**（高频重复日志按比例采样，保留首末与错误）；
3. **结构化 + 字段化**（可查询字段进标签，避免全文索引全部内容）；
4. **保留分级**（错误日志 90 天、INFO 7 天、DEBUG 不存）；
5. **限制单条长度**（截断超大堆栈与超大 payload——大日志是存储成本的黑洞）。

### 五、日志与审计的区别（合规视角）

${C}${C}${C}
系统日志（运维用途）：面向「排查问题」，允许采样、可轮转删除、格式自由
审计日志（合规用途）：面向「追溯责任」，要求
  ① 完整性（不可篡改、只追加）
  ② 完整性（保留期 ≥ 6 个月，《网络安全法》第二十一条）
  ③ 可检索（按人/时间/操作/结果查）
  ④ 覆盖关键事件（认证、授权、配置变更、数据访问）

★ 常见错误：把应用日志当审计日志用 —— 一旦轮转删除或采样，审计证据就没了
正确做法：审计事件单独通道（独立文件或独立索引），配置不可删除的保留策略
${C}${C}${C}

**认证与授权日志要落到「可回答四问」**：谁（账号/来源 IP）、何时、做了什么（操作+目标）、结果（成功/失败）。缺少任一项，事件追溯时都要靠猜。

## 七、延伸

- 可观测性三支柱：Logs（Loki/ELK）+ Metrics（Prometheus）+ Traces（Jaeger/Tempo），三者关联 traceId/spanId。
- 采样与成本：高流量下全量存成本高，按级别/采样率存；错误日志全量、INFO 采样。
- 进阶：日志生命周期（热/温/冷分层）、合规留存期、用 Promtail 的 pipeline 做结构化解析与脱敏。
`
          },
          {
            id: "troubleshoot-manual",
            title: "常见故障速查手册",
            minutes: 30,
            updated: "2026-09-17",
            applies: "通用",
            tags: ["故障", "手册"],
            terms: ["故障", "排查"],
            body: `
> **官方文档基线**：[Brendan Gregg — Linux Performance 实战](https://www.brendangregg.com/linuxperf.html) · [Google SRE Book — 故障应对](https://sre.google/sre-book/table-of-contents/) · [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) · [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html) · [openssl(1)](https://man7.org/linux/man-pages/man1/openssl.1.html)

## 一、原理与底层机制

故障排查是「现象 → 定性 → 定位 → 处理」的流水线。核心心法：**先想清楚是什么资源/哪一层的问题，再动手**，而不是凭直觉乱试。这一篇是**可以按 Ctrl+F 搜症状的救命手册**。

- **资源视角**：磁盘满、inode 满、内存 OOM、端口占用、连接泄漏，本质都是某类资源耗尽或异常。先 df/df -i/ss/dmesg 把资源状态拉出来。
- **时间视角**：发生时间 / 发现时间 / 恢复时间三者分离——发现太慢、止损太慢往往比故障本身更值得改（监控与止损能力）。
- **变更视角**：80% 故障与最近变更相关（发布、配置、数据、基础设施）。先问「最近改了什么」，能直接缩小范围。
- **分层视角**：网络→系统→应用→数据，自上而下或自下而上逐层排除，不要同时改多处。

## 二、规范与标准

每个排障条目统一格式：**现象 → 一句话定性 → 定位命令 → 处理**。随身优先级：**止损 > 定位**（回滚 > 摘流量/降级 > 扩容/重启 > 限流 > 修数据）。能在 1 分钟内回滚的，不要花 10 分钟定位。

| 故障 | 第一命令 | 定性 |
|---|---|---|
| 磁盘满但 du 对不上 | lsof | grep deleted | 删了但进程还占着 |
| df 有空间却写不进 | df -i | inode 耗尽 |
| 服务没了 | dmesg 查 OOM | 被 OOM Killer 杀 |
| 端口起不来 | ss -lntp | 被占用 |
| 接口慢 | DNS/下游/磁盘依次排 | 多因叠加 |

## 三、实战

### 1. 磁盘满了但 du 对不上
${F}bash
df -h                                   # 确认满
lsof | grep -i deleted                  # 找被删但还占着的（看 SIZE 列）
: > /proc/<pid>/fd/<fd号>               # 谨慎：确认是日志文件才清空
${F}
预防：删大日志用 > file 截断而非 rm，或配好 logrotate。

### 2. No space left on device 但 df 有空间
${F}bash
df -i                                   # IUse% 100% 即中招
for d in /var/*; do echo $(find $d -type f | wc -l) $d; done | sort -rn | head
${F}
常见元凶：邮件队列、session 文件、容器临时层、日志碎片。

### 3. 服务被 OOM 杀
${F}bash
dmesg -T | grep -i "out of memory"
journalctl -k | grep -i oom
cat /sys/fs/cgroup/memory.max           # 容器看限制
${F}
处理顺序：真不够 vs limit 太小 → JVM 是否容器感知 → 加内存/swap → 查泄漏（周期涨后突掉=特征）。

### 4. 端口被占用 / 服务起不来
${F}bash
ss -lntp | grep :8080
lsof -i :8080
# 确认可杀再杀；先确认是不是上一个实例没退干净（重启逻辑没等待）
${F}

### 5. TIME_WAIT 过多（错误 vs 正确）
${F}bash
# ❌ 错误：开 tcp_tw_recycle（NAT 下随机丢连接，4.12+ 已移除）
sysctl -w net.ipv4.tcp_tw_recycle=1
# ✅ 正确：客户端短连接场景用长连接/连接池根治，或仅客户端侧复用
sysctl -w net.ipv4.tcp_tw_reuse=1
${F}

### 6. CLOSE_WAIT 堆积
100% 程序 bug：对方已关闭，本地没调 close()，连接泄漏；查 http client 是否每次都关响应体。

### 7. DNS 解析慢导致超时
${F}bash
time nslookup api.example.com
cat /etc/resolv.conf
# 常见坑：resolv.conf 配了不可达的 DNS，每次解析等超时；容器 ndots 导致多次无效查询
${F}

### 8. 证书过期导致 HTTPS 全线失败
${F}bash
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
${F}
预防：剩余 < 30 天告警 + 自动续期（acme.sh/cert-manager）。这是「可自动化却最常翻车」的项。

### 9. 服务器时间漂移
${F}bash
timedatectl status                       # NTP synchronized 是否 yes
chronyc sources -v
${F}
影响：证书校验失败、日志对不上、分布式锁异常、定时任务错乱。

### 10. 改了配置但不生效
顺序自查：改对文件 → 语法校验（nginx -t/sshd -t）→ reload 还是 restart → 是否有多处配置/容器改了宿主机文件。

## 四、覆盖广度

- **OOM 处理顺序**：内存真不够 vs limit 太小 → JVM 容器感知 → 加内存/swap 缓冲 → 查泄漏。
- **连接异常**：CLOSE_WAIT=bug；TIME_WAIT=正常但客户端海量短连接时端口耗尽（Cannot assign requested address）。
- **DNS 慢**：resolv.conf 不可达 DNS 每次等超时；容器 ndots 多次无效查询。
- **时间漂移**：影响证书、日志、锁、定时任务。
- **配置不生效**：改错文件 → 语法校验 → reload/restart → 容器改了宿主机文件。
- **决策指引**：一次只改一处；操作前想好怎么回滚；重启前存现场（jstack/jmap/ss/dmesg/top -H）。

## 五、常见误区

1. **先定位后止损**：大故障先回滚/摘流量，再慢慢查；止损优先于定位。
2. **重启前不存现场**：jstack/jmap/ss/dmesg/top -H 存一份，否则无法复盘。
3. **不看变更**：80% 故障源于最近变更，先问「改了什么」。
4. **同时改多处**：无法判断哪个生效，复盘也糊涂。
5. **不记时间线**：事后扯皮，Scribe 角色不能省。
6. **只查一台机器**：分布式下要跨服务、跨节点关联（集中日志/traceId）。
7. **把重启当结论**：恢复后不查根因，故障必复发。

## 六、自检清单

- [ ] 磁盘满 → df -h / df -i / lsof | grep deleted
- [ ] 服务没了 → dmesg 查 OOM、systemctl status 看状态
- [ ] 端口起不来 → ss -lntp
- [ ] 连接异常 → ss -ant 看状态分布
- [ ] 接口慢 → DNS/下游/磁盘 IO 依次排除
- [ ] 证书 → openssl 查有效期，剩余 <30 天告警
- [ ] 每次操作前想好回滚

<!--dd:troubleshoot-manual-->

## 🔬 深挖：假设驱动的排障方法与常见故障树

### 一、排障的正确顺序（很多人反了）

${C}${C}${C}
① 确认影响面（谁受影响？多大比例？哪个功能？）—— 这决定「先止血还是先定位」
② 关联最近变更（发布/配置/容量/依赖升级/流量）—— 80%+ 的故障由变更引起
③ 看监控与日志（不要先 SSH 上机乱敲命令）
④ 提出最可能的假设 → 用最小代价验证（可逆、低影响）
⑤ 止血（回滚/切流/扩容/限流）—— 用户还在受损时优先止血
⑥ 根因分析（此时才有时间做） → 修复 → 加护栏（防止再发生）
${C}${C}${C}

**两个必须纠正的习惯**：
- **先止血再根因**：用户受损期间不要开技术研讨会，先回滚恢复，再慢慢分析；
- **一次只改一个变量**：同时改三处，即使修好了也不知道是哪个起作用（下次还会遇到）。

### 二、按现象的故障树（可直接照做）

${C}${C}${C}
【服务不可用 / 全部 5xx】
  → 网关/负载均衡是否可达？（curl 从外部）
  → Pod/进程是否存活？（kubectl get pod / systemctl status）
  → 健康检查是否通过？（readiness 失败会被摘流量）
  → 依赖是否可用？（数据库、缓存、下游服务连接）
  → 是否 OOM / 被驱逐？（kubectl describe / dmesg -T | grep -i oom）
  → 是否达到连接池/线程池上限？（池满 → 请求排队 → 超时）

【RT 变慢但错误率正常】
  → 是全部接口还是部分？（全量 → 资源/依赖；部分 → 代码/数据量）
  → 下游 RT 是否上升？（分布式追踪看链路哪一跳慢）
  → 数据库慢查询？（慢日志、连接数、锁等待）
  → 缓存命中率是否下降？（缓存被清/被穿透 → DB 压力上升）
  → 客户端网络是否变差？（地域/运营商视角的 RT）
  → GC 停顿？（jstat -gcutil 看 FGC 频率与耗时）

【磁盘空间不足】
  → df -h 哪个挂载点 → du 逐层下钻 → lsof +L1 找「已删除未释放」
  → 是否日志未轮转？是否临时文件堆积？是否容器可写层？（docker system df）
  → 立即止血：清理旧日志/临时文件（先确认可删！）

【DNS 解析失败】
  → /etc/resolv.conf 是否正确？（容器里可能是 127.0.0.11）
  → nslookup/dig 直连 DNS 服务器能否解析？
  → 本地 DNS 缓存（nscd/systemd-resolved）是否异常？
  → CoreDNS（K8s）是否健康？conntrack 是否满？（内核参数 nf_conntrack_count）
  → 是否是「部分域名失败」？（说明是上游权威服务器或特定域名问题）

【证书问题】
  → 是否过期？（echo | openssl s_client -connect host:443 | openssl x509 -noout -dates）
  → 证书链是否完整？（缺中间证书会导致部分客户端失败）
  → SNI / 域名匹配？（访问的域名是否在 SAN 里）
  → 时间是否同步？（系统时间偏移会让证书"未生效"）

【连接被拒 / 超时】
  → 被拒（Connection refused）：端口没监听？防火墙 REJECT？进程已死？
  → 超时（timeout）：中间网络丢包？防火墙 DROP？目标过载？backlog 满？
  → 区分：本机能连、外部不能 → 网络/防火墙；外部能连、本机不能 → 监听地址（127.0.0.1 vs 0.0.0.0）
${C}${C}${C}

### 三、分钟级排查清单（按资源层次）

${F}bash
# 30 秒掌握全局（顺序执行，输出都很短）
uptime                                  # load 与核心数比例
free -h                                 # 看 available，不是 free
df -h                                   # 磁盘是否满
df -i                                   # inode 是否满（★ 常被遗漏）
vmstat 1 3                              # CPU/内存/IO 整体压力
iostat -xz 1 2                          # 磁盘饱和度与延迟
ss -s                                   # 连接状态汇总（TIME_WAIT/CLOSE_WAIT）
ss -lntp | head -20                     # 监听与 Recv-Q 堆积
dmesg -T | tail -50                     # 内核最近消息（OOM/连接跟踪满/磁盘错误）★
journalctl -p err --since "10 min ago"  # 最近错误日志
top -b -n1 -o %CPU | head -15           # 最耗 CPU 的进程
${F}

**${C}dmesg -T | tail${C} 是性价比最高的一条命令**：OOM Killer、磁盘 IO 错误、连接跟踪表满（${C}nf_conntrack: table full${C}）、网卡错误都会在这里出现，而这些往往在应用日志里毫无痕迹。

### 四、四个「看起来像 A 实际是 B」的经典误判

| 现象 | 常见误判 | 真实原因 |
|---|---|---|
| CPU 使用率不高但吞吐上不去 | 「服务得加机器」 | 连接池上限 / 单线程瓶颈 / 锁竞争 / 上游限流 |
| load 很高 | 「CPU 不够」 | 大量 D 状态进程（IO 卡住）或线程数过多 |
| 内存「用满」 | 「内存泄漏」 | 页缓存占满（正常），要看 MemAvailable |
| 偶发超时、日志无异常 | 「网络抖动」 | 长 GC 停顿 / 定时任务抢占 / 连接池瞬时耗尽 / 慢 SQL 偶发 |

**结论：不要凭经验直接下结论，要回到「因果链」用数据验证每一环。**

### 五、把排障沉淀为可复用的资产

${C}${C}${C}
① Runbook（处置手册）：每类告警对应「怎么确认、怎么止血、升级路径」
   → 让 on-call 不必在凌晨从零研究
② 自动化诊断脚本：把上面的分钟级清单写成一个脚本（一键收集现场）
   → 附上 host/时间/PID 信息，打包给他人分析
③ 故障演练（GameDay / 混沌工程）：主动注入故障，验证「检测 + 响应」是否真的有效
   → 演练会发现「告警没配」「预案没人会执行」
④ 复盘改进项落地：每次故障产出「检测、止损、根治」三类改进，并检查完成情况
   → 不复盘的故障一定会再发生
${C}${C}${C}

**一键收集现场脚本的思路**（比手工敲命令可靠得多）：

${F}bash
#!/usr/bin/env bash
# collect.sh —— 故障现场一键采集（在受影响机器上执行）
D=/tmp/diag-$(hostname)-$(date +%Y%m%d%H%M%S); mkdir -p "$D"
{ date; uptime; hostname; uname -a; } > "$D/00-basic.txt"
{ free -h; df -h; df -i; } > "$D/01-res.txt"
vmstat 1 5 > "$D/02-vmstat.txt"; iostat -xz 1 3 > "$D/03-iostat.txt" 2>/dev/null
{ ss -s; ss -antp; } > "$D/04-net.txt"
ps auxf > "$D/05-ps.txt"; dmesg -T | tail -200 > "$D/06-dmesg.txt"
journalctl -p warning --since "-30 min" > "$D/07-journal.txt" 2>/dev/null
# 注意：采集脚本本身要低开销，不要在生产上跑 strace/tcpdump 全量
tar czf "$D.tgz" -C "$(dirname $D)" "$(basename $D)"; echo "collected: $D.tgz"
${F}

## 七、延伸

- 把高频条目做成 runbook，接入 ChatOps/告警自动建议，缩短 MTTR。
- 故障演练（混沌工程）：主动注入磁盘满、网络延迟，验证预案有效。
- 进阶：eBPF 做无侵入深度排障（offcputime、biosnoop、tcplife）；用 bpftrace 写一次性排障脚本。
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
            minutes: 32,
            updated: "2026-09-17",
            applies: "Kubernetes 1.24+",
            tags: ["K8s", "云原生"],
            terms: ["Kubernetes", "K8s", "容器"],
            body: `
> **官方文档基线**：[Kubernetes 官方文档](https://kubernetes.io/docs/) · [kubectl 参考](https://kubernetes.io/docs/reference/kubectl/) · [工作负载](https://kubernetes.io/docs/concepts/workloads/) · [网络模型](https://kubernetes.io/docs/concepts/cluster-administration/networking/) · [存储](https://kubernetes.io/docs/concepts/storage/) · [调度](https://kubernetes.io/docs/concepts/scheduling-eviction/)

## 一、原理与底层机制

K8s 的核心是**声明式**：你声明「要 3 个副本跑这镜像」，控制面持续对比实际状态并自动收敛。排障第一性问题永远是：**期望状态是什么？实际状态是什么？谁在阻止收敛？**

- **控制面**：API Server（唯一入口，鉴权/校验）、etcd（唯一状态源，一切配置与状态的真相）、Scheduler（调度决策）、Controller Manager（各类控制器维持期望，如 ReplicaSet 维持副本数）。
- **数据面**：kubelet（节点代理，管 Pod 生命周期）、kube-proxy（维护转发规则）、容器运行时（containerd/CRI-O）。
- **Pod 是最小调度单元**：一个 Pod 内多容器共享网络命名空间与存储卷；通常一个 Pod 跑一个主容器，加 sidecar（日志/代理）。
- **收敛循环**：Controller watch 实际状态，与 etcd 里的期望对比，驱动变更直到一致。所以「改了不生效」往往是因为期望状态没改对，或控制器被卡住。

## 二、规范与标准

| 上线必配项 | 要求 |
|---|---|
| readinessProbe / livenessProbe | 独立轻量接口（如 /healthz），不打到重接口 |
| resources | 必须设 memory limit；CPU limit 慎用；JVM 按 cgroup |
| 反亲和/拓扑分布 | 副本分散不同节点，避免单点 |
| 镜像标签 | 禁 latest，固定 tag 可回滚 |
| NetworkPolicy | 默认全通是大隐患，按最小暴露 |
| PDB | 主动驱逐保最小可用副本 |
| ResourceQuota/LimitRange | 每命名空间限额，防一个应用拖垮集群 |

## 三、实战

### 生命周期异常定位
${F}bash
kubectl get pod -n prod -o wide
kubectl describe pod <pod> -n prod       # Events 在最后，90% 原因在这
kubectl logs <pod> -n prod --previous    # 上次崩溃日志（CrashLoop 必看）
kubectl get events -n prod --sort-by=.lastTimestamp | tail -30
kubectl exec -it <pod> -n prod -- sh
kubectl top pod -n prod                  # 实际用量（需 metrics-server）
${F}

| 状态 | 常见原因 | 定位 |
|---|---|---|
| Pending | 资源不足/节点污点/PVC 未绑 | describe 看 FailedScheduling |
| ImagePullBackOff | 镜像名错/私有库无 secret | describe + 手动 pull 验证 |
| CrashLoopBackOff | 启动即退出/配置错/依赖连不上/探针太严 | logs --previous |
| Running 但不可用 | 就绪探针失败 | get pod -o wide 看 READY |
| Evicted | 节点资源压力（磁盘/内存） | describe node |

### 资源配额（错误 vs 正确）
${F}yaml
# ❌ 错误：内存不设 limit，一个 Pod 泄漏拖垮节点
resources:
  requests:
    memory: "1Gi"
# ✅ 正确：memory 必设 limit，CPU 可只设 request
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    memory: "2Gi"
${F}

## 四、覆盖广度

- **调度控制**：亲和/反亲和（同节点/同可用区）、污点容忍（专用节点 GPU/高性能盘）、TopologySpreadConstraints（比反亲和精细，推荐新项目）。
- **网络三层**：CNI（Flannel 简单/Calico 有策略/Cilium eBPF）、Service（ClusterIP/NodePort/LoadBalancer，kube-proxy IPVS 模式更稳）、Ingress（Ingress-Nginx/Traefik/Gateway API）。
- **存储**：emptyDir（临时）、hostPath（慎用，漂移丢数据）、PVC+StorageClass（正解）；有状态优先云托管 RDS/Redis，别在 K8s 自建数据库。
- **etcd 敏感度**：对磁盘延迟极敏感，必须 SSD，监控 fsync 延迟；慢则整个集群抖。
- **升级与废弃 API**：先升控制面后升节点；一次升一个小版本；用 pluto/kubent 扫废弃 API。
- **决策指引**：数据库别在 K8s 自建；配额+PDB 保稳定；禁 latest；探针/resources/反亲和是上线基本盘。

## 五、常见误区

1. **没配 readinessProbe 就上线**：Pod 未预热就被塞流量，发布期大量 5xx；就绪探针是必配项。
2. **探针打到重接口**：探针超时会杀正常 Pod；探针要独立轻量。
3. **所有副本同节点**：没反亲和，一挂全没。
4. **滚动太快**：maxSurge/maxUnavailable 全开瞬间全换；配 minReadySeconds 保守发布。
5. **容器用 root 跑**：配 runAsNonRoot + securityContext，降安全风险。
6. **ConfigMap 改了不重启**：多数程序启动才读，需 kubectl rollout restart。
7. **etcd 磁盘慢**：集群整体抖，必须 SSD + 监控。
8. **用 latest 标签**：无法回滚、无法追溯，事故时抓瞎。

## 六、自检清单

- [ ] 先看 describe 的 Events，再看 logs --previous
- [ ] Pending→调度/污点；CrashLoop→上次日志；ImagePull→镜像与 secret
- [ ] 探针/resources/反亲和三项上线基本配置
- [ ] 变更前确认可回滚（tag 固定、有历史版本）
- [ ] 每命名空间 ResourceQuota + LimitRange
- [ ] etcd 定期快照 + 演练恢复
- [ ] NetworkPolicy 已限制暴露面

<!--dd:k8s-ops-->

## 🔬 深挖：K8s 集群运维的排查链路

### 一、节点 NotReady 的排查链（按顺序）

${C}${C}${C}
① 节点状态与原因
   kubectl get nodes -o wide                 # 是否 NotReady / 是否 SchedulingDisabled
   kubectl describe node <node> | tail -30    # Conditions 与 Events（★ 直接给原因）

② kubelet 是否活着（节点上）
   systemctl status kubelet
   journalctl -u kubelet -n 200 --no-pager    # 最常见：证书过期 / 容器运行时不可用 / 磁盘压力

③ 容器运行时
   systemctl status containerd
   crictl ps -a | head                        # 用 crictl 而不是 docker（K8s 直连 containerd）

④ 资源压力导致的驱逐
   Conditions 里出现 MemoryPressure / DiskPressure / PIDPressure
   kubectl describe node | grep -A5 "Allocated resources"
   → 磁盘压力常见原因：镜像堆积（crictl rmi --prune）、日志/容器可写层占满

⑤ 网络
   节点是否能访问 API Server（kubelet 上报依赖它）
   CNI 插件 Pod 是否正常（Calico/Cilium 的 DaemonSet）
   kube-proxy 是否正常

⑥ 证书过期（★ 高频且容易忽略）
   kubeadm certs check-expiration
   → 证书过期后 kubelet 无法与 API Server 通信 → 节点 NotReady
${C}${C}${C}

### 二、etcd：集群的大脑，也是最大的单点风险

${F}bash
# 健康检查（在 etcd 节点上，或用 etcdctl 容器）
ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  endpoint health --cluster
etcdctl endpoint status --cluster -w table      # 成员状态、Raft 索引、DB 大小 ★
etcdctl member list -w table
etcdctl defrag --endpoints=...                  # 碎片整理（需逐成员进行，有轻微阻塞）

# 备份（必须定期且验证可恢复！）
etcdctl snapshot save /backup/etcd-$(date +%F).db
etcdctl snapshot status /backup/etcd-$(date +%F).db -w table
${F}

**etcd 的四个运维要点**：
1. **DB 大小限制默认 2GB**（${C}--quota-backend-bytes${C}），超限会进入只读（整个集群无法写入）——**必须监控 DB 大小**，这是最容易造成集群级故障的隐藏门槛；
2. **延迟敏感**：etcd 需要低延迟磁盘（强烈建议 SSD/NVMe），高 fsync 延迟会导致 leader 频繁切换；
3. **奇数节点**（3 或 5），跨可用区部署要评估网络延迟与仲裁可用性；
4. **备份必须演练恢复**：备份文件存在不等于可恢复（版本不匹配、证书不匹配、恢复步骤不熟都会导致灾难时失败）。

### 三、资源压力与驱逐

${F}bash
kubectl describe node <node> | grep -A 20 "Allocated resources"
kubectl get pods -A --field-selector status.phase=Failed
kubectl get events -A --sort-by=.lastTimestamp | tail -30      # 集群事件 ★ 排障必看
# 驱逐与 QoS
kubectl get pod <pod> -o jsonpath='{.status.qosClass}'          # Guaranteed/Burstable/BestEffort
# 节点磁盘压力常见的「元凶」
crictl images | wc -l; crictl rmi --prune                        # 清理无用镜像
du -sh /var/lib/containerd /var/log/pods | sort -h
${F}

**驱逐的判定与后果**：节点资源超过阈值（默认 ${C}memory.available<100Mi${C}、${C}nodefs.available<10%${C}）时，kubelet 会驱逐 Pod——**驱逐顺序按 QoS 与优先级**：BestEffort 先走。**因此关键服务必须设为 Guaranteed（request == limit），并可用 PriorityClass 提升优先级**（避免被别人的 Pod 挤掉）。

### 四、DNS 与网络：K8s 里最高频的疑难杂症

${C}${C}${C}
CoreDNS 排查链
  ① kubectl -n kube-system get pod -l k8s-app=kube-dns      # 是否运行、重启次数
  ② kubectl -n kube-system logs -l k8s-app=kube-dns --tail=100
  ③ 从业务 Pod 内测试：nslookup kubernetes.default
  ④ 检查 Service：kubectl get svc -n kube-system kube-dns（是否有 Endpoints）
  ⑤ 检查 ConfigMap（Corefile）是否被改坏
  ⑥ ★ conntrack 表满（高频根因）：
     cat /proc/sys/net/netfilter/nf_conntrack_count
     cat /proc/sys/net/netfilter/nf_conntrack_max
     现象：偶发 DNS 超时、随机连接失败

常见根因排序
  1. conntrack 表满（调大 nf_conntrack_max + 优化应用复用连接）
  2. ndots 配置导致解析放大（默认 ndots:5，外部域名会先试 5 个 search 域）
     → 对频繁访问外部域名的应用，设 dnsConfig.options: ndots:2 或直接用 FQDN（末尾加点）
  3. CoreDNS 副本太少 / 资源不足（DNS QPS 很高，容易被限流）
  4. 节点本地 DNS 缓存（NodeLocal DNSCache）未部署，导致大量小包与 conntrack 占用
${C}${C}${C}

**「给域名末尾加点」（${C}db.prod.internal.${C}）是零成本的优化**：它让解析器直接按绝对域名查询，跳过 search 域的组合尝试，能把 DNS 查询量降低数倍。

### 五、证书、升级与集群生命周期

${F}bash
# 证书检查（kubeadm 集群）
kubeadm certs check-expiration
kubeadm certs renew all && systemctl restart kubelet     # 续期（注意控制面组件也要重启）

# 查看 API Server 证书（外部视角）
echo | openssl s_client -connect <apiserver>:6443 2>/dev/null | openssl x509 -noout -dates

# 升级前检查
kubectl get nodes -o wide; kubectl version
kubectl get pods -A | grep -v Running | grep -v Completed   # 是否有不健康的 Pod
kubectl api-resources --verbs=list --namespaced -o name | xargs -n1 kubectl get --show-kind --ignore-not-found -A 2>/dev/null | grep -i deprecated
${F}

**升级纪律（K8s 版本升级是高风险操作）**：
1. **逐个小版本升**（不能跨 minor，1.28 → 1.29 → 1.30）；
2. **先升控制面再逐节点升 kubelet**（节点上先 ${C}drain${C} 再 ${C}uncordon${C}，务必配 PDB 保证可用性）；
3. **升级前检查废弃 API**（${C}kubectl deprecations${C} 插件或 ${C}kube-no-trouble${C}）——**这是升级失败率最高的原因**（旧 manifest 用了已移除的 API 版本）；
4. **在测试集群先演一遍**，尤其要验证「CRD 与 Operator 兼容性」（第三方 Operator 往往滞后于 K8s 版本）；
5. **备份 etcd**（升级前必须），并确认恢复流程可用。

### 六、日常巡检清单（每周/每月）

${C}${C}${C}
每天
  ☑ 节点状态、Pod 重启次数异常（kubectl get pods -A | grep -vE "Running|Completed"）
  ☑ 集群事件中的 Warning（可能揭示即将发生的问题）
  ☑ etcd DB 大小与延迟、控制面组件健康
  ☑ 证书剩余有效期（<30 天告警）
  ☑ 资源水位（节点 CPU/内存/磁盘，命名空间配额使用率）

每周
  ☑ 镜像仓库与节点磁盘清理（crictl rmi --prune、日志轮转）
  ☑ 集群组件版本与 CVE 公告对照
  ☑ 备份与恢复演练（抽一个命名空间验证恢复流程）

每月
  ☑ PDB 覆盖检查（哪些服务没配）
  ☑ RBAC 审计（是否有过宽的 ClusterRoleBinding、是否有未使用的 ServiceAccount 令牌）
  ☑ 资源 request/limit 与真实用量偏差复盘（长期严重偏离要调整）
  ☑ 节点池版本一致性与升级计划
${C}${C}${C}

**一条经验**：**集群的稳定性来自「日常巡检 + 演练」，而不是「出事时的应急」。** 上面这份清单里，维护成本最低、收益最高的三项是：**证书有效期监控、etcd 备份恢复演练、节点磁盘/镜像清理**——它们覆盖了集群级故障中最高频的三类成因。

## 七、延伸

- 可观测性：Prometheus（指标）+ Loki/ELK（日志）+ Jaeger/Tempo（链路）三件套。
- GitOps（Argo CD/Flux）：声明式发布+自动回滚+审计。
- 进阶：Operator 模式、多集群联邦、Cilium eBPF 无 kube-proxy 网络；用 kubectl debug 做排障容器。
`
          },
          {
            id: "slo-sli",
            title: "SLO / SLI / 错误预算：把稳定性量化",
            minutes: 26,
            updated: "2026-09-17",
            applies: "通用方法论",
            tags: ["SRE", "稳定性"],
            terms: ["可用性"],
            body: `
> **官方文档基线**：[Google SRE Book — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) · [Prometheus 告警实践](https://prometheus.io/docs/practices/alerting/) · [Grafana 告警](https://grafana.com/docs/grafana/latest/alerting/) · [错误预算](https://sre.google/sre-book/embracing-risk/) · [多窗口多燃烧率](https://sre.google/sre-book/alerting-on-slos/)

## 一、原理与底层机制

稳定性不能靠「感觉」，要量化成数字。三个概念：

- **SLI**（指标/Indicator）：怎么测，如 成功请求数/总请求数。
- **SLO**（内部目标/Objective）：要多少，如 30 天成功率 ≥ 99.9%。
- **SLA**（对外合同/Agreement）：没达到要赔，如 99.5% 赔付代金券。

核心：**SLA 是给客户的，SLO 是给自己的，且 SLO 应比 SLA 更严**，留出缓冲。错误预算把「稳定 vs 快速迭代」的争论变成数据决策：预算足→激进发布、做有风险的变更；预算耗尽→冻结非必要变更，全部精力投入稳定性改进。这是 SRE 里最优雅的机制。

## 二、规范与标准

| 可用性 | 每月可 downtime | 每年 |
|---|---|---|
| 99% | 7.3 小时 | 3.65 天 |
| 99.9% | 43.8 分钟 | 8.76 小时 |
| 99.99% | 4.4 分钟 | 52.6 分钟 |
| 99.999% | 26 秒 | 5.26 分钟 |

每多一个 9，成本常是数量级上升（冗余、多活、自动化）。好 SLI 满足：**用户可感知、可测量、能反映真实体验**。延迟类用「响应 < 阈值的请求占比」而非平均；吞吐/质量类用「消息不丢失率、数据新鲜度」。

## 三、实战

### 选 SLI（错误 vs 正确）
${F}
# ❌ 错误：拿服务器 CPU/磁盘当 SLI —— 用户感知不到，CPU 100% 用户无感也不该报警
SLI = cpu_usage < 80%

# ✅ 正确：围绕用户旅程，可感知可测量
SLI = 成功请求数 / 有效请求数        # 5xx + 超时算失败
SLI = 响应 < 300ms 的请求占比 >= 99%
${F}

### 多窗口多燃烧率告警（Google 推荐）
${F}
燃烧率 = 预算消耗速度（相对 SLO 允许的失败率）
告警条件：错误率 > (1 - SLO) × 燃烧率
例：SLO=99.9%，1 小时窗口燃烧率 14.4
    → 1 小时内错误率 > 0.1% × 14.4 = 1.44% 才告警
窗口：1h(14.4)/6h(6) 紧急(Page)；3d(1) 工单(Ticket)
${F}

**好处**：短窗口+高阈值快速发现严重故障，又不因短暂抖动半夜叫醒人（长窗口+低阈值兜底）。

## 四、覆盖广度

- **有效请求定义**：客户端 4xx 不算服务端错误预算，先定义边界，否则会被正常拒绝刷爆预算。
- **多窗口价值**：1h 窗口抓快故障，3d 窗口确认慢消耗，组合避免告警疲劳。
- **用户旅程优先**：围绕「下单」「登录」定，不围绕组件定；组件指标（CPU）不等于用户体验。
- **燃烧率档位**：1h(14.4) 快发现、6h(6) 确认、3d(1) 慢确认，组合成 Page/Ticket 两级。
- **决策指引**：SLO 与业务方共定，先粗后细、可松不可严，慢慢收紧；预算耗尽的处理流程需管理层支持。
- **多 SLO 场景**：不同用户旅程可设不同 SLO，核心链路更严，内部工具更松。

## 五、常见误区

1. **SLO 定 100%**：等于禁止任何变更，也做不到；100% 是错误的目标。
2. **定太严致告警疲劳**：团队开始忽略告警，比没有告警更糟；宁可先松，慢慢收紧。
3. **只有技术指标无业务视角**：围绕组件而非用户旅程，偏离真实体验。
4. **当 KPI 考核个人**：导致瞒报、美化数据；SLO 是团队共同的健康指标。
5. **不做预算策略**：定了 SLO 但耗尽了没人管，等于没定。
6. **忘排除合理失败**：4xx 算进预算，预算被正常流量吃光。
7. **只看月度总览**：不在 Dashboard 上实时看燃烧率，等事故才发现预算早没了。

## 六、自检清单

- [ ] 选定 1~2 条核心用户旅程
- [ ] 定义清晰 SLI 计算公式（含什么算有效请求）
- [ ] SLO 与业务方共定并写进文档
- [ ] 数据可观测（有 Dashboard 实时看燃烧率）
- [ ] 多窗口多燃烧率告警已生效（Page/Ticket 分级）
- [ ] 错误预算耗尽的处理流程与责任人明确
- [ ] 每月复盘，决定是否投入稳定性工作

<!--dd:slo-sli-->

## 🔬 深挖：错误预算如何变成决策机制

### 一、SLI 定义的四个必须澄清项

${C}${C}${C}
同一句「可用性 99.9%」，不同实现得到完全不同的数字。必须事先写清：

① 分母（valid events）：所有请求？排除健康检查？排除内部调用？排除压测流量？
② 成功标准（good events）：HTTP 200？还是「业务成功」（含 2xx 但业务失败的情况）？
③ 统计窗口：滚动 30 天 / 自然月 / 7 天？（★ 影响预算消耗速度与告警灵敏度）
④ 测点位置：边缘网关（含网络与客户端问题）/ 服务内部（更纯的服务质量）

推荐写法示例（可被一致实现）：
  「对外 HTTP 接口的可用性 SLI = 
    非健康检查的请求中，返回非 5xx 且业务码为成功的比例（过去 30 天滚动窗口），
    测点：边缘网关。」
${C}${C}${C}

**最实用的补充 SLI**：除了可用性，还应有**延迟 SLI**（如「P99 < 500ms 的请求比例」）——因为「全部返回 200 但慢到用户放弃」在可用性指标里是 100% 成功，这显然不符合用户感受。

### 二、错误预算的计算与「预算表」

${C}${C}${C}
SLO 99.9%，滚动 30 天（43200 分钟）
  允许不可用 = 43.2 分钟
  按请求算：100 万请求允许 1000 个失败

预算消耗的直观换算（便于与业务沟通）
  1 分钟完全不可用 = 消耗 1/43.2 ≈ 2.3% 的月度预算
  1 小时完全不可用 = 消耗 138% 的预算（★ 一次 1 小时的全站故障就用光一整月）
  → 这个换算能有效说服产品：一个月只能承受约 43 分钟的完全不可用
${C}${C}${C}

**多服务时的预算叠加**：如果前端页面依赖 5 个后端服务，每个 99.9%，串行可用性上界 ≈ 0.999⁵ ≈ 99.5%（年化停机约 44 小时）——**这解释了「为什么不能给每个服务都定 99.9% 然后指望整体 99.9%」**。依赖链越长，越需要更严的内部 SLO，或者在前端做优雅降级（依赖失败时页面仍可用）。

### 三、燃烧率告警的配置（可直接落地）

${C}${C}${C}
burn_rate = 实际错误率 / 允许错误率
  SLO 99.9% → 允许 0.1%
  实际错误率 1% → burn_rate = 10（预算以 10 倍速消耗）

推荐的多窗口配置（宽窄结合）
┌─────────────┬────────────┬──────────────────┬─────────────┐
│ 短窗口(检测) │ 长窗口(确认)│ 燃烧率阈值        │ 处置        │
├─────────────┼────────────┼──────────────────┼─────────────┤
│ 5m          │ 1h         │ 14.4 (2天烧完)    │ Page 立即   │
│ 30m         │ 6h         │ 6    (5天烧完)    │ Page 或工单 │
│ 2h          │ 3d         │ 1    (30天刚烧完) │ 工单        │
└─────────────┴────────────┴──────────────────┴─────────────┘
短窗 + 长窗同时超阈值才告警：短窗负责「快速发现」，长窗负责「过滤瞬时抖动」
${C}${C}${C}

${F}yaml
# Prometheus 告警规则示例（5m 短窗 + 1h 长窗，双条件）
- alert: SLOHighBurnRate
  expr: |
    (sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.0144)
    and
    (sum(rate(http_requests_total{code=~"5.."}[1h])) / sum(rate(http_requests_total[1h])) > 0.0144)
  labels: { severity: page }
  annotations:
    summary: "SLO 燃烧率过高（1 小时内可能烧掉 2 天预算）"
    runbook: "https://wiki/runbook/slo-burn"
${F}

### 四、把预算变成「发布政策」

${C}${C}${C}
预算充足（消耗 < 50%）→ 正常节奏发布，允许实验
预算吃紧（50%~100%） → 只发布修复与小改动，暂停有风险的变更
预算耗尽（> 100%）    → ★ 冻结功能发布，全员转入可靠性工作
                        （不是惩罚，而是「这个月已经把可靠性额度花完了」）
${C}${C}${C}

**这条政策的三重价值**：
1. **把争论变成数据**：「能不能发」不再由职级决定，而由预算决定；
2. **让可靠性工作有「预算配额」**：没有这个机制，可靠性工作永远排在业务需求之后；
3. **给团队安全边界**：明确「可以冒多少风险」，避免两个极端（零失误文化 / 裸奔）。

**注意 SLO 的三个落地陷阱**：① 给所有服务定 SLO（维护不动，很快作废）——**从一个关键服务开始**；② SLO 定得比实际能力还高（永远破线，团队麻木）——**目标应略低于实测能力**；③ 只看 SLO 不看用户（内部指标完美但用户在抱怨）——**SLO 需要定期与用户投诉/业务指标对齐**。

### 五、SLI/SLO 与「告警有效性」的关系

${C}${C}${C}
三层告警设计（配合 SLO）
  ① 症状告警（SLO 燃烧率）：用户是否受损 → ★ 必须能叫醒人（page）
  ② 原因告警（资源/依赖）：CPU 满、连接池满、下游错误率上升 → 工单（不必半夜叫人）
  ③ 预测告警（趋势）：磁盘将满、证书将过期、容量将在 7 天耗尽 → 工单
${C}${C}${C}

**为什么很多团队告警泛滥**：把「原因告警」当成「症状告警」往外发（如「CPU 使用率 > 80%」直接 page）——而 CPU 80% 往往不影响用户，半夜把人叫起来看一眼然后回去睡觉，几次之后就没人认真对待告警了。**page 只应发给「用户正在受损」的信号。**

### 六、SLO 的评审节奏

${C}${C}${C}
每月：看 SLO 达成情况 + 预算消耗分布（哪次故障吃掉了最多预算）
每季：审视 SLO 是否还合理（业务变化、架构变化、用户期望变化）
       是否应该收紧（用户要求更高）或放宽（成本不划算）
每次重大故障：复盘对 SLO 的影响，评估是否需要调整指标定义（可能指标本身没测到用户痛点）
${C}${C}${C}

**最有价值的一次 SLO 评审**通常是：「我们这个 SLI 没能反映用户的真实体验——用户抱怨的是慢，而我们只测了可用性。」**指标定义错误比指标不达标更危险**，因为它会让你在「指标全绿」的情况下持续流失用户。

## 七、延伸

- 错误预算策略需管理层支持：耗尽了谁有权冻结发布、谁有权决定冒险。
- SLO 与容量规划联动：预算消耗快=扩容/优化信号，提前行动。
- 进阶：在 Prometheus + Alertmanager 落地 multi-burn-rate 告警规则；用 Grafana 做 SLO 面板；把错误预算接入发布门禁（预算不足禁止发布）。
`
          },
          {
            id: "incident-review",
            title: "事故复盘与变更管理",
            minutes: 26,
            updated: "2026-09-17",
            applies: "通用方法论",
            tags: ["SRE", "流程"],
            terms: ["故障", "变更"],
            body: `
> **官方文档基线**：[Google SRE Book — 管理事件](https://sre.google/sre-book/managing-incidents/) · [事后复盘文化](https://sre.google/sre-book/postmortem-culture/) · [有效的事后复盘](https://sre.google/sre-book/example-postmortem/) · [变更管理](https://sre.google/sre-book/) · [ITIL 变更管理](https://www.axelos.com/best-practice-solutions/itil)

## 一、原理与底层机制

故障处理的第一优先级**永远是恢复服务**，不是找根因。顺序：**止损 → 收敛影响 → 定位 → 根治**。行业共识：**70%~80% 的故障由变更引起**（发布、配置、数据变更、基础设施调整）。所以变更管理比排障本身更重要——防住变更，就防住大多数故障。

- **止损手段排序**：回滚 > 摘流量/降级 > 扩容/重启 > 限流 > 修数据。能 1 分钟回滚就别 10 分钟定位。
- **复盘对事不对人**：批斗会让人不敢说真话，拿不到真实原因；无责复盘才能暴露系统问题。
- **根因要追问到系统层**：不是「某人操作失误」就停，而是「为什么流程允许他这么操作、为什么没有卡点」。

## 二、规范与标准

| 角色 | 职责 |
|---|---|
| IC（Incident Commander） | 唯一决策者，不亲自动手，分配任务、控制节奏 |
| Ops Lead | 执行变更操作（回滚、扩容） |
| Communicator | 对内对外同步进展（让其他人别来打断） |
| Scribe | 记录时间线（复盘的唯一依据） |

故障分级（提前公开定好）：P0 核心业务全面不可用/资金损失→立即召人、IC 上线、实时通报；P1 严重受损、大量用户→30 分钟内；P2 部分异常、有替代→工作时段；P3 轻微→排期。分级标准不公开，现场一定为「算 P0 还是 P1」吵起来。

## 三、实战

### 复盘文档结构（错误 vs 正确）
${F}
# ❌ 错误：结论写成「某某操作失误」，无时间线、无行动项
根因：张三没看文档就改了配置。

# ✅ 正确：时间线 + 系统根因 + 可闭环行动项
摘要：下单接口 5xx，影响 12% 用户，持续 18 分钟。
时间线：10:02 发生 / 10:09 发现 / 10:14 回滚止损 / 10:20 恢复
根因：昨天上线 SQL 没走索引 → 连接池打满 → 数据库连不上
      （系统问题：发布流程缺 SQL 审核环节）
行动项：① 加 SQL 审核卡点(负责人A, 9-30, P0) ② 慢查询告警(负责人B, 10-7, P1)
${F}

### 变更三板斧
${F}bash
# 可灰度：1% -> 10% -> 50% -> 100%，每档观察指标
# 可监控：变更前后对比错误率/延迟/SLO 消耗
# 可回滚：底线，没有回滚方案的变更不许上线
${F}

## 四、覆盖广度

- **时间线三时间点**：发生/发现/恢复必须区分；发现慢、止损慢常比故障本身更值得改（监控与止损能力）。
- **根因追问链**：服务不可用→DB 连不上→连接池满→慢查询→无索引 SQL→无 SQL 审核（系统层）。
- **高危操作**：删数据/DROP TABLE/改路由/换证书/集群升级 → 双人复核 + 预发演练。
- **把经验变制度**：行动项闭环、沉淀 CheckList、做成自动化拦截（CI 卡未审核 SQL、发布系统强制灰度）、定期演练。
- **变更窗口与审批**：低峰期做、通知相关方（值班、客服、依赖团队）、数据库变更评估大表 DDL 风险。
- **决策指引**：任何变更先问「怎么回滚、影响谁、观察什么指标、谁来盯」。

## 五、常见误区

1. **只追责不改系统**：罚了当事人，流程没变，下次换个人照样出。
2. **复盘文档没人看**：要公开、可检索、变更时能被翻出。
3. **行动项无截止/负责人**：等于没写，石沉大海。
4. **没时间线**：事后扯皮，Scribe 角色不能省。
5. **只关注技术忽略发现/止损慢**：监控与止损改进价值往往大于修那个 bug。
6. **「重启就好了」当结论**：不继续查，故障必复发。
7. **变更不灰度直接全量**：一次把 100% 流量暴露给未验证的变更，赌运气。

## 六、自检清单

- [ ] 故障发生：先止损再定位
- [ ] 明确 IC，指定 Scribe 记时间线
- [ ] 记录发生/发现/恢复三时间点
- [ ] 复盘对事不对人，根因追问到系统层
- [ ] 行动项有负责人+截止+跟踪闭环
- [ ] 任何变更：可灰度、可监控、可回滚
- [ ] 高危操作双人复核 + 预发演练

<!--dd:incident-review-->

## 🔬 深挖：变更管理与复盘的闭环

### 一、变更分级与管理窗口

${C}${C}${C}
变更分级（按风险而非按团队意愿）
  A 级（高风险）：架构变更、数据库 schema/索引变更、核心链路发布、
                 权限与认证变更、网络与网关变更
    → 必须：评审 + 灰度 + 可回滚方案 + 变更窗口（避开业务高峰与周五）+ 有人值守
  B 级（中风险）：常规功能发布、配置调整（限流/超时/开关）
    → 必须：评审 + 自动验证 + 可回滚
  C 级（低风险）：文案、样式、日志级别
    → 自动流程即可

变更窗口的意义
  避开：业务高峰、大促、周五与节假日前（出问题没人处理/难找人）
  保留：紧急修复通道（明确审批人与事后补评审流程）
${C}${C}${C}

**变更冻结（Change Freeze）** 是双刃剑：大促期间冻结能显著降低故障率，但长期冻结会让变更积压、在解冻时集中爆发（风险反而更高）。**正确做法是「冻结高风险变更，保留低风险与修复通道」。**

### 二、复盘的四个问题与三类产出

${C}${C}${C}
四个问题（顺序不能变）
  ① 发生了什么？（时间线：事实，不含评价与猜测）
  ② 为什么没有更早发现？（检测缺口：没日志？没规则？有规则没人看？告警不响？）
  ③ 为什么影响范围这么大？（遏制缺口：权限过大？无隔离？没有降级？恢复太慢？）
  ④ 哪三条改进能最大程度降低再发生概率？（负责人 + 截止时间 + 验证方式）

三类产出（缺一类就不算完整复盘）
  ✔ 检测改进：把本次的特征变成告警规则（IOC、错误模式、指标阈值）
  ✔ 止损改进：缩短恢复时间的措施（一键回滚、开关、自动降级、预案修订）
  ✔ 根治改进：消除根因的工程改动（架构、测试、护栏、流程）
${C}${C}${C}

**「为什么没有更早发现」这个问题是最有价值的**：多数故障的真实损失并非来自根因本身，而是「已经坏了 40 分钟才有人知道」。**缩短检测时间（MTTD）的收益往往大于缩短修复时间（MTTR）**，且成本更低。

### 三、变更失败率：把「变更管理」变成可度量的事

${C}${C}${C}
DORA 中的「变更失败率」= 导致故障/回滚/热修的变更占比
  好的团队：< 15%（甚至 < 10%）
  差的团队：> 30%（说明缺少测试/灰度/评审）

与之配套的四个度量
  部署频率：反映批量大小（批量越小、单次风险越低）
  变更前置时间：从提交到生产 → 反映流程效率
  MTTR：恢复时长 → 反映可恢复能力
  ★ 四者一起看才有意义：高频 + 低失败率 = 小批量 + 自动化验证 + 快速回滚

反模式：用「变更数量」考核
  → 会逼迫团队把变更合并（减少「次数」）或偷偷改（不走流程），风险反而上升
${C}${C}${C}

**度量变更失败率的关键是「统一口径」**：什么算「失败」（回滚算？热修算？降级算？功能不达预期算？）。**建议口径**：导致需要回滚、热修、或触发告警并人工介入的变更计为失败——并在团队内达成一致，否则数据无法比较。

### 四、应急预案：写下来、演练过、才叫预案

${C}${C}${C}
一份可用的预案必须包含
  ① 触发条件（什么现象、什么阈值、谁判断）
  ② 处置步骤（具体命令/操作路径，不要写「重启服务」这种模糊描述）
  ③ 决策点与授权（谁有权断网/回滚/切流；升级路径与联系方式）
  ④ 验证方式（怎么确认已恢复）
  ⑤ 回写要求（手工变更后必须回写配置/Git，避免自愈系统把它改回去）

演练（GameDay / 混沌工程）的三个层次
  ① 桌面推演：只讨论流程（成本最低，能发现「联系人过时」「权限没人有」）
  ② 注入故障：真实注入（杀 Pod、断依赖、限流）验证检测与自愈
  ③ 全链路演练：模拟机房级故障（成本高，关键系统年度一次）
${C}${C}${C}

**演练最常暴露的三类问题**（都是纸面预案看不出来的）：**权限不在需要的人手上**（半夜找不到有权限的人）、**告警没响**（以为有监控，实际没配规则）、**步骤过时**（文档写的命令在实际版本上已不适用）。

### 五、On-call 制度：让值班可持续

${C}${C}${C}
必须明确
  ① 响应时限（SLA）与升级路径（多久没响应就找备班/主管）
  ② 值班范围（哪些告警属于本班；不属于的转给谁）
  ③ 交接机制（交接文档：未完成事项、遗留风险、临时状态）★ 最容易缺失
  ④ 补偿与休整（长期被打断会导致疲劳与离职，是可靠性的隐形杀手）
  ⑤ 值班质量反馈（值班体验差、告警噪音多，必须有人负责改进）

三条红线
  ✗ 让一个人长期 7×24（必然导致离职或麻木）
  ✗ 告警无 runbook（on-call 变成研究者而不是恢复者）
  ✗ 值班后无复盘（同样的告警每月叫醒同样的人）
${C}${C}${C}

**「无责文化」不是「不追责」，而是「先改系统、再谈个人」**：如果一个人能在生产上误删数据，说明「缺少防误删的护栏」（权限、二次确认、备份），比「这个人不小心」更值得修。**先修护栏，再谈人的问题**——这是让团队愿意如实汇报事故（而不是掩盖）的前提，而如实汇报是复盘有效的基础。

### 六、从单次事故到系统性改进

${C}${C}${C}
单次事故 → 三类改进（检测/止损/根治）
   ↓ 横向推广：同类系统/同类变更/同类依赖，是否都有同样的问题？
   （这次是 A 服务的连接池打满，B、C 服务是否也一样？）
   ↓ 沉淀为默认值：把结论变成模板、模块、流水线门禁、平台默认配置
   （如「所有新服务的连接池必须配超时与监控」→ 写进脚手架模板）
   ↓ 复盘的复盘：改进项是否按时完成？没完成的原因是什么？
${C}${C}${C}

**最有价值的一次改进是把「个案修复」升级为「默认正确」**：修一个服务的连接池只是修了一个服务；把它写进脚手架模板与流水线检查，就让**下一个新服务默认不会犯同样的错误**。这也是平台工程与 SRE 的交汇点——**把事故教训编码进默认路径**，是工程组织积累可靠性的唯一可规模化方式。

## 七、延伸

- 混沌工程：主动注入故障验证预案与回滚有效（没演练的预案=没有）。
- 将复盘行动项接入 tracker 自动跟踪关闭，下次复盘先回顾上次行动项。
- 进阶：建设「错误预算策略」与「变更冻结」机制，把稳定性变成组织能力；用 GameDay 定期演练重大故障。
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
    //           → 云原生/DevOps → 安全
    //           （安全方向正文在 js/docs/security.js、云原生/DevOps 方向在 js/docs/devops.js 中定义，
    //            两者加载顺序均先于本文件）
    dirs: [
      OPS,
      window.JAVA, window.NETWORK, window.DBA, window.FRONTEND,
      window.DEVOPS, window.SECURITY
    ]
  };
})();
