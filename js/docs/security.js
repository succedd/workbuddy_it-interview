/* =========================================================================
 *  js/docs/security.js — 技术教程「安全」方向数据
 *
 *  编写基线（目录骨架取自官方文档，正文按官方目录逐节展开）：
 *    · OWASP Top 10:2021             https://owasp.org/Top10/
 *    · OWASP ASVS 4.0                应用安全验证标准（分级验证项）
 *    · OWASP WSTG                    Web 安全测试指南（测试用例分类）
 *    · OWASP Cheat Sheet Series      各主题防御速查
 *    · NIST SP 800-61r2              事件响应生命周期
 *    · NIST SP 800-63B               数字身份认证指南（口令/多因素）
 *    · CIS Benchmarks                Linux / 容器加固基线
 *    · RFC 6749 / 7636 / 7519        OAuth 2.0 / PKCE / JWT
 *    · RFC 8446                      TLS 1.3
 *    · 《网络安全法》《数据安全法》《个人信息保护法》、GB/T 22239-2019（等保 2.0）
 *
 *  风格：原理 → 官方规范 → 实战（脆弱 vs 修复对照）→ 误区 → 自检清单。
 *  正文为 Markdown，复用站点 marked + highlight.js。
 *  代码围栏用 ${F}、行内代码用 ${C} 表示反引号，避免与外层模板字符串冲突。
 *  ⚠ shell 变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏 ```
  const C = "\u0060";               // 行内代码 `

  const SECURITY = {
    id: "security",
    name: "安全",
    icon: "🔐",
    desc: "以 OWASP Top 10 / ASVS / WSTG、NIST 与等保 2.0 的官方目录为主线：从看懂漏洞、写不漏洞的代码，到渗透测试、认证授权设计、密钥管理，再到 SDL、应急响应与合规治理的完整安全能力栈。",
    levels: [
      /* ============================ 初级 ============================ */
      {
        id: "basic",
        name: "初级",
        desc: "建立攻击者视角：吃透 OWASP Top 10 的原理与防护，掌握注入 / XSS / CSRF / SSRF 的攻防对照，会做认证会话加固与 Linux 安全基线。",
        chapters: [
          {
            id: "security-basic-1",
            title: "Web 安全基础与 OWASP Top 10（2021）",
            minutes: 22,
            updated: "2026-09-16",
            applies: "所有 Web 应用 / API",
            tags: ["Web安全", "OWASP", "安全基线"],
            terms: ["OWASP", "Top 10", "失效的访问控制", "注入"],
            body: `
> **官方文档基线**：[OWASP Top 10:2021](https://owasp.org/Top10/) · [OWASP ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/) · [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

## 一、先换成攻击者视角

安全不是「加个验证码」「挂个 WAF」这类点状动作，而是**沿着数据流找破绽的思维方式**。OWASP 把全球真实泄露事件的根因归纳成一份榜单，就是 **OWASP Top 10**。它不是漏洞大全（覆盖不了逻辑漏洞、业务风险），但它是行业**事实上的共识清单**——一份被写进无数合规要求里的「安全必读书目」。

先把 2021 版十条记成一句话：

| 编号 | 名称 | 一句话本质 | 高频场景 |
|---|---|---|---|
| A01 | 失效的访问控制 | 该拦的没拦住 | 越权改 ID 看别人订单 |
| A02 | 加密机制失效 | 数据裸奔 | 明文存口令、HTTP 传身份 |
| A03 | 注入 | 数据被当成代码执行 | SQL 拼接、命令拼接 |
| A04 | 不安全设计 | 设计阶段就错了 | 无频控的转账、可暴力猜的券码 |
| A05 | 安全配置错误 | 默认配置没关 | 云存储桶公开、调试接口外网 |
| A06 | 易受攻击和过时的组件 | 用了带洞的依赖 | Log4Shell、旧版框架 |
| A07 | 身份识别与认证失效 | 证明「你是谁」的方式不牢 | 撞库、弱口令、会话不换 |
| A08 | 软件和数据完整性故障 | 信任了不该信任的输入 | 反序列化、CI 里拉未校验的包 |
| A09 | 安全日志与监控失效 | 出事了没人知道 | 无登录审计、无告警 |
| A10 | 服务端请求伪造（SSRF） | 让服务器替你去打内网 | 图片 URL 抓取打到元数据服务 |

## 二、逐条落地：从「知道」到「能防」

### A01 失效的访问控制（连续 5 年第一）

这是**最容易被忽视、也最容易出大事**的一类。它的本质是：**校验了「你登录了吗」，却没校验「这条数据是你的吗」**。

${F}java
// ❌ 脆弱：只验证了登录态，没验证归属
@GetMapping("/orders/{id}")
public Order get(@PathVariable Long id) {
    return orderRepo.findById(id).orElseThrow();   // 换个 id 就能看别人订单
}

// ✅ 修复：数据层强制带上主体条件（而不是先查再判）
@GetMapping("/orders/{id}")
public Order get(@PathVariable Long id, @AuthenticationPrincipal User me) {
    return orderRepo.findByIdAndUserId(id, me.getId())   // 归属写进 SQL
            .orElseThrow(() -> new NotFoundException()); // 统一 404，别泄露「存在但无权」
}
${F}

**三条工程习惯**：
1. **默认拒绝**：新接口默认「不可访问」，靠显式授权打开，而不是默认放行再逐个补权限。
2. **授权下沉到数据层**：把 ${C}user_id${C} 写进 WHERE 条件，别依赖上层 if 判断（上层总有被绕过或被复制粘贴漏掉的一天）。
3. **统一错误语义**：无权访问返回 404 而非 403，避免通过状态码枚举出资源是否存在。

### A02 加密机制失效

反面清单比正面清单更有用：

- 口令用 MD5/SHA-1 直接存（应使用 bcrypt / scrypt / Argon2id，见中级「加密与密钥管理」）
- 用 HTTP 传会话 Cookie、传输敏感数据
- 用 ECB 模式加密（相同明文块 → 相同密文块，泄露结构）
- 自己发明加密算法或「加密方案」（**这是必翻车项**）
- 硬编码密钥在代码仓库里

### A03 注入

注入的**统一本质**：**把不可信数据拼接进了「解释器」**。SQL、命令、LDAP、XPath、模板引擎都算。防御的统一解法也只有一条：**分离代码与数据**。

- SQL → 参数化查询（PreparedStatement / MyBatis ${C}#{ }${C}），见下一章精讲
- Shell → 不用 ${C}Runtime.exec(字符串)${C}，改用参数数组形式且做白名单
- 模板 → 不把用户输入当模板字符串编译

### A04 不安全设计（2021 新增）

这是**方法论层面的新增项**：漏洞的根子在需求与设计阶段，而不是某一行代码写错。

典型：优惠券码用 6 位数字（可枚举）、转账接口没有频控和二次确认、密码找回用「安全问题」（可社工）。这类问题**代码质量再高也救不回来**，只能靠威胁建模（见高级「SDL 与威胁建模」）在设计阶段拦掉。

### A05 安全配置错误

最高频、最廉价、也最不该出现的失分项：

- 生产环境开 ${C}debug=true${C}、${C}/actuator/env${C}、Swagger UI 暴露
- 云存储桶 ACL 设为 public-read
- 默认口令（admin/admin、redis 无密码且 0.0.0.0 监听）
- 未关闭目录列表、未删除测试账号、未移除示例应用
- CORS 写成 ${C}Access-Control-Allow-Origin: *${C} 且同时 ${C}Allow-Credentials: true${C}（浏览器会拒绝，但配置意图已暴露）

**落地做法**：把「安全配置」做成**声明式基线**（IaC / Helm values / ConfigMap 模板），用检查工具（如 kube-bench、Docker Bench）定期扫，而不是靠人记。

### A06 易受攻击和过时的组件

Log4Shell（CVE-2021-44228）让所有人记住了这条：**你的攻击面 = 你所有直接 + 间接依赖**。

- 建立 SBOM（软件物料清单），至少能回答「我用了哪个版本」
- CI 中接 SCA 扫描（Dependabot / Snyk / Trivy / OWASP Dependency-Check）
- 制定升级 SLA：高危漏洞 24–72 小时内处置
- 关注传递依赖，不能只看 ${C}pom.xml${C} 第一层

### A07 身份识别与认证失效

- 允许弱口令、无撞库防护、无多因素
- 会话 ID 可预测、登录成功后**不重建会话**（会话固定攻击）
- 允许用户名枚举（登录失败提示「用户不存在」vs「密码错误」）

### A08 软件和数据完整性故障

- Java 反序列化（${C}ObjectInputStream${C}、Fastjson/XStream 历史 RCE）
- 从不可信源加载代码 / 插件
- CI/CD 中未校验签名就部署制品（供应链投毒）

### A09 安全日志与监控失效

**「不知道被打了」比「被打」更严重**。至少要记：登录成功/失败、权限变更、数据导出、管理操作；并且日志要**集中收集、不可被攻击者删改**（应用进程不应有删除审计日志的权限）。

### A10 服务端请求伪造（SSRF）

应用「帮用户去访问一个 URL」时，攻击者就把这个能力变成了内网探测器：

${F}bash
# 云环境里最经典的一击：拿实例临时凭证
http://169.254.169.254/latest/meta-data/iam/security-credentials/
${F}

防护要点（细节见下一章）：协议白名单（只允许 http/https）、**解析后校验 IP**（防 DNS rebinding）、禁止访问内网网段与链路本地地址、出网走独立代理。

## 三、Top 10 与 ASVS 的分工

| | OWASP Top 10 | OWASP ASVS |
|---|---|---|
| 定位 | 风险意识清单（十大类） | 可验证的需求清单（几百条） |
| 用法 | 培训、评审提纲、汇报沟通 | 写进验收标准、自动化验证 |
| 粒度 | 类 | 具体验证项，分 L1/L2/L3 |

**实践建议**：团队内部用 Top 10 对齐认知，把 ASVS L1/L2 的条目**改写进需求文档与测试用例**，这样安全才真正落地为可交付物。

## ⚠ 常见误区

1. **「我们用了框架所以没有注入」**——MyBatis 的 ${C}\${ }${C} 拼接、JPA 的原生 SQL 依然会注入。
2. **「上线前扫一遍就安全了」**——扫描器查不出越权、逻辑漏洞、业务风控，这类必须人工+威胁建模。
3. **「内网系统不用管安全」**——内网横向移动才是现代攻击的主战场，SSRF 的存在让「内网」不再是边界。
4. **把 Top 10 当成「十条漏洞」**——它是十类**风险**，A04 不安全设计根本不是某个具体漏洞。

## ✅ 自检清单

- [ ] 每个涉及资源的接口，都能回答「谁在什么条件下可以访问这一条数据」
- [ ] 所有 SQL 均为参数化；搜索了 ${C}\${ }${C} / ${C}String.format${C} / 字符串拼接 SQL
- [ ] 口令使用 bcrypt/Argon2id 存储，全站强制 HTTPS
- [ ] 生产关闭调试与运维端点，或加内网+鉴权
- [ ] CI 里有依赖扫描与 SBOM 产出，高危漏洞有修复 SLA
- [ ] 登录、权限变更、数据导出有审计日志且异地留存
- [ ] 所有「由服务端发起的外部请求」都有目标白名单

## 📚 延伸阅读

- OWASP Top 10:2021 官方：[owasp.org/Top10](https://owasp.org/Top10/)
- OWASP Cheat Sheet Series：[cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/)
- OWASP ASVS：[owasp.org/www-project-application-security-verification-standard](https://owasp.org/www-project-application-security-verification-standard/)
`
          },
          {
            id: "security-basic-2",
            title: "常见漏洞原理与防护：注入 / XSS / CSRF / SSRF",
            minutes: 28,
            updated: "2026-09-16",
            applies: "所有 Web 应用 / API",
            tags: ["漏洞", "防护", "实战"],
            terms: ["SQL注入", "XSS", "CSRF", "SSRF"],
            body: `
> **官方文档基线**：[OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/)（WSTG-INPV 注入类） · [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) · [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) · [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) · [SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

## 一、SQL 注入：为什么「参数化」能一劳永逸

先看注入的分类，理解它们才能理解防护为什么这样设计：

| 类型 | 特征 | 探测手段 |
|---|---|---|
| 联合查询 | 直接把结果回显到页面 | ${C}' UNION SELECT ... --${C} |
| 报错注入 | 页面回显数据库报错 | ${C}extractvalue()${C}、类型转换报错 |
| 布尔盲注 | 页面只有「有/无」两种状态 | ${C}AND 1=1${C} vs ${C}AND 1=2${C} 比差异 |
| 时间盲注 | 页面状态无差异 | ${C}AND SLEEP(5)${C} 看响应时间 |
| 堆叠注入 | 支持多语句 | ${C}; DROP TABLE ...${C} |

**防护的唯一正解是参数化（预编译）**，原因是它改变了协议层的数据结构：

${F}java
// ❌ 脆弱：数据库收到的是「一条拼好的 SQL」，数据即代码
String sql = "SELECT * FROM users WHERE name='" + name + "'";
stmt.executeQuery(sql);
// 输入 ' OR '1'='1  → 变成 SELECT * FROM users WHERE name='' OR '1'='1'

// ✅ 修复：SQL 结构先发给数据库编译，数据后传，永远只是数据
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, name);   // 即使传 ' OR '1'='1 也只是「一个字面量字符串」
${F}

**转义为什么不够？** 因为「怎么转义才安全」取决于数据库、字符集、连接参数（${C}NO_BACKSLASH_ESCAPES${C} 等）。自己写转义函数 = 无穷的边界情况。**除非你比 JDBC 驱动更懂协议，否则永远用参数化。**

### 两个真实世界的坑

**坑 1：MyBatis 的 ${C}\${ }${C} 和 ${C}#{ }${C}**

${F}xml
<!-- ❌ ${C}\${ }${C} 是字符串直接替换 —— 等于手写拼接 -->
SELECT * FROM users WHERE name = '\${name}'

<!-- ✅ ${C}#{ }${C} 生成 ? 占位符，走 PreparedStatement -->
SELECT * FROM users WHERE name = #{name}
${F}

**坑 2：表名、字段名、排序字段无法参数化**

${C}ORDER BY ?${C} 不生效，因为占位符只能传「值」。这类只能**白名单映射**：

${F}java
private static final Map<String, String> SORTABLE = Map.of(
    "createdAt", "created_at", "score", "score");
String col = SORTABLE.get(req.getSortBy());
if (col == null) throw new IllegalArgumentException("非法排序字段");  // 拒绝而非回退默认值
String sql = "SELECT * FROM t ORDER BY " + col + " DESC";   // 此处拼的是白名单内的常量
${F}

同理，模糊查询不要 ${C}LIKE '%\${kw}%'${C} 拼接，而是 ${C}CONCAT('%', #{kw}, '%')${C}。

### 命令注入与 LDAP 注入

只要代码里出现 ${C}Runtime.exec${C} / ${C}ProcessBuilder${C} / ${C}exec(${C}(PHP) / ${C}os.system${C}，就必须警惕：

${F}bash
# ❌ 脆弱：ping "${C}8.8.8.8; rm -rf /${C}" → 命令被追加执行
${F}

**工程上最稳的做法是「不用 shell」**：优先使用语言原生库（如 Java 用 ${C}InetAddress.isReachable${C} 而不是调 ping），必须调外部命令时用**参数数组**形式并严格白名单校验参数。

## 二、XSS：三种形态与「上下文相关」的编码

XSS 的本质是**用户输入被浏览器当成 JS/HTML 执行**。分三类：

| 类型 | 数据流 | 记忆点 |
|---|---|---|
| 存储型 | 存入 DB → 别的用户打开页面即触发 | 危害最大，蠕虫级扩散 |
| 反射型 | 出现在 URL/请求里 → 立即回显 | 靠钓鱼链接投递 |
| DOM 型 | 完全在浏览器端，服务端日志里看不到 | 安全设备容易漏 |

**防御三层，缺一不可**：

**第 1 层：输出编码（主要防线）**——而且必须**按上下文选择编码方式**：

${F}java
// HTML 上下文
<div>\${HtmlUtils.htmlEscape(userInput)}</div>

// HTML 属性上下文（注意引号）
<input value="\${HtmlUtils.htmlEscape(userInput)}">

// JS 上下文（不要用 HTML 编码，会失效）
<script>var name = "\${JsEscape(userInput)}";</script>

// URL 参数上下文
<a href="/search?q=\${UrlEncoder.encode(userInput, StandardCharsets.UTF_8)}">
${F}

现代前端框架（React/Vue）默认对插值做转义，**但逃逸口仍然存在**：React 的 ${C}dangerouslySetInnerHTML${C}、Vue 的 ${C}v-html${C}、Angular 的 ${C}bypassSecurityTrustHtml${C}。**代码评审时优先搜这几个词。**

**第 2 层：CSP（纵深防御）**——限制「即使注入了脚本，它能干什么」：

${F}bash
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-<随机值>'; object-src 'none'; base-uri 'none'
${F}

注意：${C}'unsafe-inline'${C} 会让 CSP 形同虚设；改用 nonce 或 hash。

**第 3 层：Cookie 加固**——把会话 Cookie 设为 ${C}HttpOnly${C}，让 ${C}document.cookie${C} 读不到，攻击者偷不走会话。

**富文本怎么办？** 不能简单全转义（会把排版也干掉）。正确做法是**服务端用成熟的 HTML 白名单清洗库**（Java 用 OWASP Java HTML Sanitizer，Node 用 DOMPurify+jsdom），**不要自己写正则过滤**。

## 三、CSRF：借你的身份发请求

**原理**：浏览器发请求时**自动携带目标站 Cookie**，攻击者页面就能让受害者的浏览器「以他的身份」发一个请求。

${F}html
<!-- 受害者打开攻击者页面，就向银行发了一次转账 -->
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker"><input name="amount" value="10000">
</form>
<script>document.forms[0].submit()</script>
${F}

**防御，按优先级**：

1. **${C}SameSite${C} Cookie 属性（现代首选）**
   ${F}bash
   Set-Cookie: SESSION=xxx; Secure; HttpOnly; SameSite=Lax
   ${F}
   ${C}Lax${C} 允许顶级导航的 GET（保住「从外链点进来仍是登录态」的体验），阻止跨站 POST——覆盖绝大多数 CSRF。严格场景用 ${C}Strict${C}，跨站需要携带 Cookie 的场景（嵌入式）才用 ${C}None${C} 且必须配 ${C}Secure${C}。

2. **CSRF Token（Synchronizer Token Pattern）**：服务端下发随机 token，写进表单隐藏域或自定义请求头，提交时校验且**与会话绑定、一次性或有时效**。
   - 纯 JSON API 若用 ${C}Authorization: Bearer${C} 头传 token（而非 Cookie），**天然免疫 CSRF**，因为浏览器不会自动加这个头。
   - 但如果 API 是「靠 Cookie 认证」的，就**必须**有 CSRF 防护——「我们是 JSON API 所以不用防」是个常见错误认知。

3. **校验 Origin / Referer**：作为补充手段，注意有些代理会剥离 Referer。

**顺带一个高频问题**：为什么 CORS 配置不是 CSRF 防护？因为 CORS 管的是「响应能不能被 JS 读到」，而 CSRF 攻击**根本不需要读响应**——请求已经发出去并产生了副作用。

## 四、SSRF：让服务器当你的跳板

**触发点**：一切「服务端按用户提供的地址去请求」的功能——图片/文件 URL 抓取、Webhook 回调测试、PDF 导出、URL 预览、代理转发。

**危害升级路径**：读云元数据拿临时凭证 → 拿到角色权限 → 访问对象存储/RDS → 内网横向。

**分层防护（要叠加，单点都不够）**：

${F}java
// 1) 只允许 http/https 协议，禁止 file/gopher/dict/ftp
// 2) 域名白名单（业务允许时最优先）
// 3) 【关键】解析 DNS 后校验 IP，防 DNS rebinding
InetAddress addr = InetAddress.getByName(host);
if (addr.isLoopbackAddress() || addr.isSiteLocalAddress()
        || addr.isLinkLocalAddress() || addr.isAnyLocalAddress()) {
    throw new SecurityException("禁止访问内网地址");
}
// 4) 禁止 302 自动跟随（否则可用重定向绕过上面的校验）
conn.setInstanceFollowRedirects(false);
// 5) 出网走独立出口代理，网络层再拦一次内网
${F}

**别只做字符串黑名单**：${C}127.0.0.1${C} 可以写成 ${C}2130706433${C}（十进制）、${C}0x7f000001${C}（十六进制）、${C}127.1${C}，还有 ${C}[::1]${C}。**一定要在 DNS 解析之后、用 IP 做判断。**

DNS rebinding 的精髓：校验时域名解析到公网 IP，请求时域名解析到内网 IP —— 所以「校验」和「请求」必须用**同一个已解析的 IP**（先校验再固定连接到该 IP）。

## ⚠ 常见误区

1. **「前端做了校验，后端不用重复校验」**——前端校验是体验，后端校验是安全。抓包直接打后端。
2. **「转义了 ${C}<${C} ${C}>${C} 就防住 XSS」**——在 JS 上下文、URL 上下文里，单引号、反斜杠、换行都是逃逸点。
3. **「用了 CSP 就不需要输出编码」**——CSP 是第二道防线，会因为配置疏漏（jsonp 端点、旧浏览器）失效。
4. **「SSRF 只是读读网页」**——在云环境里它常是**从「一个普通功能」到「接管整个云账号」的跳板**。
5. **黑名单式过滤**（拦 ${C}127.0.0.1${C}、拦 ${C}select${C}）——绕过方式永远比你的黑名单多，**白名单才是可控的**。

## ✅ 自检清单

- [ ] 全库搜索 ${C}\${ }${C}（MyBatis）、${C}createQuery${C}、${C}executeQuery(${C}(拼接)、${C}f-string${C} 拼 SQL，全部改为参数化
- [ ] 排序/表名等无法参数化的地方，使用**白名单映射**且非法值直接拒绝
- [ ] 搜索 ${C}innerHTML${C} / ${C}v-html${C} / ${C}dangerouslySetInnerHTML${C} / ${C}bypassSecurityTrust${C}，逐个确认输入来源已清洗
- [ ] 响应头已配置 CSP、${C}X-Content-Type-Options: nosniff${C}、${C}Referrer-Policy${C}
- [ ] 会话 Cookie 带 ${C}HttpOnly; Secure; SameSite=Lax${C}（或更强）
- [ ] 依赖 Cookie 认证的写操作（POST/PUT/DELETE）都有 CSRF 防护
- [ ] 所有用户可控 URL 的请求：协议白名单 + 解析后内网 IP 拦截 + 禁止跟随跳转
- [ ] 云实例启用了 IMDSv2（需 PUT + Token），降低元数据被读风险
`
          },
          {
            id: "security-basic-3",
            title: "认证与会话安全：口令存储、多因素与 JWT",
            minutes: 24,
            updated: "2026-09-16",
            applies: "所有 Web 应用 / API",
            tags: ["认证", "会话", "JWT"],
            terms: ["认证", "bcrypt", "SameSite", "JWT"],
            body: `
> **官方文档基线**：[OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) · [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) · [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) · OWASP ASVS V2（认证）/ V3（会话） · NIST SP 800-63B · RFC 6238（TOTP） · RFC 7519（JWT）

## 一、口令存储：这一节基本是「送分题」，但线上系统仍在错

**口令绝不可逆存储**，只能存「慢哈希」。选择顺序与参数：

| 算法 | 推荐参数（2026 视角） | 说明 |
|---|---|---|
| **Argon2id** | m=19MiB, t=2, p=1（OWASP 最低建议） | 首选，抗 GPU/ASIC |
| **bcrypt** | cost=10~12（视机器性能） | 成熟稳妥；注意 72 字节截断 |
| **scrypt** | N=2^17, r=8, p=1 | 可接受 |
| PBKDF2 | SHA-256, ≥600,000 次 | 只在合规强制时用（FIPS） |
| ❌ MD5 / SHA-1 / SHA-256 单次 | — | **不是口令算法**，GB 级彩虹表秒破 |

**必须配盐**（每用户独立随机盐），现代库会自动处理：

${F}java
// ✅ Spring Security 标准做法：BCryptPasswordEncoder 自动生成并存储盐
@Bean
PasswordEncoder encoder() {
    return new BCryptPasswordEncoder(12);
}
String hash = encoder.encode(rawPassword);        // 存 hash
boolean ok  = encoder.matches(rawPassword, hash); // 校验（内部使用恒定时间比较）
${F}

**⚠ bcrypt 的 72 字节截断**：bcrypt 只取前 72 字节，超长口令后面的部分被静默丢弃。若允许超长口令又用 bcrypt，最好先做一次 SHA-256 预处理（base64 后传入），或直接换 Argon2id。

**永远不要**：
- 在日志、错误信息、URL 里出现明文口令
- 用「口令提示问题」做找回（社工即可绕过）
- 设置过于严苛的复杂度规则导致用户把口令写在便签上（NIST SP 800-63B 已建议：**优先长度、检查是否在泄露口令库中**，而非强制大小写+符号）

## 二、登录防护：对抗撞库与枚举

| 攻击 | 特征 | 防御 |
|---|---|---|
| 撞库 | 用别站泄露的账号口令库批量试 | 检查口令是否在泄露库（HIBP API / 本地库）、风险登录二次验证 |
| 暴力破解 | 单账号高频尝试 | 递增延迟、IP+账号双维度限流、失败 N 次锁定/验证码 |
| 用户名枚举 | 通过响应差异判断账号是否存在 | 统一提示「用户名或口令错误」，统一响应时间 |
| 时序攻击 | 通过比较耗时推断信息 | 使用恒定时间比较（${C}MessageDigest.isEqual${C} / ${C}crypto.timingSafeEqual${C}） |

**恒定时间比较**是个容易被忽略的细节：

${F}java
// ❌ String.equals 会在第一个不同字符处提前返回 → 泄露前缀信息
if (inputToken.equals(storedToken)) { ... }

// ✅ 恒定时间比较
if (MessageDigest.isEqual(inputToken.getBytes(UTF_8), storedToken.getBytes(UTF_8))) { ... }
${F}

## 三、多因素认证（MFA）：按强度排序

1. **WebAuthn / FIDO2 安全密钥或通行密钥（Passkey）**——最强，抗钓鱼（因为绑定 Origin，假站点拿不到凭据）。
2. **TOTP 动态口令**（RFC 6238，Google Authenticator 那类）——较强，但用户可能被实时钓鱼代理转发。
3. **短信 / 邮件验证码**——最弱（SIM 劫持、号码回收），仅作降级方案。

**落地要点**：MFA 至少覆盖「管理员后台 / 敏感操作 / 异地登录」；提供**恢复码**（一次性、离线保管）避免用户丢设备后永久锁死；短信/邮件 OTP 必须**限制尝试次数与有效期**（如 5 分钟、5 次），且**一次性作废**。

## 四、会话管理：Cookie 的每个属性都有理由

${F}bash
Set-Cookie: SESSION=随机值; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200
# 需要更强隔离时用 Cookie 前缀（浏览器强制约束）
Set-Cookie: __Host-SESSION=随机值; Secure; Path=/; HttpOnly   # 必须 Secure + Path=/ + 无 Domain
${F}

| 属性 | 作用 | 不加的后果 |
|---|---|---|
| ${C}Secure${C} | 仅 HTTPS 发送 | 明文网络下会话被窃 |
| ${C}HttpOnly${C} | JS 无法读取 | XSS 直接偷走会话 |
| ${C}SameSite${C} | 限制跨站携带 | CSRF 风险 |
| ${C}__Host-${C} 前缀 | 强制 Secure+Path=/+无 Domain | 子域可覆盖父域 Cookie |

**两个高频错误**：
1. **会话固定（Session Fixation）**：登录成功后**必须重新生成 Session ID**，否则攻击者预先给受害者一个已知 ID，受害者登录后该 ID 就成了有效会话。
   ${F}java
   // Spring Security 默认已处理；自研框架务必显式重建
   request.getSession().invalidate();   // 先让旧会话失效
   HttpSession s = request.getSession(true);  // 再开新会话
   ${F}
2. **会话不设超时 / 不提供「退出所有设备」**：应设空闲超时（如 30 分钟）+ 绝对超时（如 8 小时），并在口令修改后使**所有**会话失效。

## 五、JWT：三件事必须做对

JWT = Header.Payload.Signature，Base64Url 拼接。**它不是加密，只是签名**——Payload 任何人 base64 解码都能读。

${F}json
// Header
{ "alg": "RS256", "typ": "JWT" }
// Payload（勿放敏感信息！）
{ "sub": "1001", "role": "user", "exp": 1698888888, "iss": "auth.example.com", "aud": "api" }
${F}

**✔ 必须做的三件事**：

1. **强制指定算法，拒绝 ${C}none${C}，拒绝算法混淆**：
   ${F}java
   // ❌ 从 token header 里读 alg 来决定校验方式 → 可被改成 HS256 用公钥当密钥签名
   // ✅ 服务端固定算法
   Jwts.parserBuilder()
       .setSigningKey(publicKey)              // RS256 → 公钥验签
       .requireIssuer("auth.example.com")
       .requireAudience("api")
       .build().parseClaimsJws(token);        // 只接受已签名 token（parseClaimsJws 拒 none）
   ${F}
2. **校验 ${C}exp${C} / ${C}iss${C} / ${C}aud${C}**：不校验 ${C}aud${C} 会导致「A 系统的 token 能打 B 系统」。
3. **设置合理的有效期 + 刷新机制**：Access Token 短（5–15 分钟），Refresh Token 长但**可撤销**（服务端存状态）。

**哈希算法的选择**：用 Ed25519 或 ES256 / RS256（非对称，资源服务器能独立验签）；HS256（对称）只适合单体应用，且**密钥必须足够长且不外泄**——用公钥当 HS256 密钥是著名的 alg-confusion 攻击。

## ⚠ 常见误区

1. **「JWT 是无状态的，所以能撤销」**——不能。签发后到期前一直有效，除非维护黑名单（就等于有了状态）。**需要即时撤销的场景请用不透明 token + 服务端查表。**
2. **把敏感信息塞进 JWT Payload**——手机号、身份证号在 token 里等于公开。
3. **只在网关验签，业务代码里再解析一遍且不做校验**——解析（decode）≠ 验证（verify）。
4. **口令复杂度规则拉到最狠**——反而降低整体安全（用户复用/记录）。长度 + 泄露库检查更有效。
5. **短信验证码可无限次尝试**——等于 6 位口令可以被暴力破解。

## ✅ 自检清单

- [ ] 口令存储使用 Argon2id 或 bcrypt(cost≥10)，且已确认无 MD5/SHA-1 遗留
- [ ] 登录失败提示统一，响应时间无差异；有 IP + 账号双维度限流
- [ ] 管理员与敏感操作强制 MFA；提供离线恢复码
- [ ] 会话 Cookie 带 ${C}HttpOnly; Secure; SameSite${C}；登录后重建 Session ID
- [ ] 会话有空闲 + 绝对超时；支持「退出全部设备」
- [ ] JWT 校验固定算法 + ${C}exp/iss/aud${C}；Access Token ≤ 15 分钟
- [ ] 日志中无明文口令、无完整 token（打印时截断）

## 📚 延伸阅读

- OWASP Password Storage Cheat Sheet：[cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- NIST SP 800-63B（数字身份指南）：[pages.nist.gov/800-63-3/sp800-63b.html](https://pages.nist.gov/800-63-3/sp800-63b.html)
- RFC 7519（JWT）：[datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)
`
          },
          {
            id: "security-basic-4",
            title: "Linux 安全基线加固（CIS Benchmark 视角）",
            minutes: 22,
            updated: "2026-09-16",
            applies: "CentOS 7+ / Ubuntu 20.04+ / 国产 Linux",
            tags: ["Linux", "加固", "基线"],
            terms: ["SSH加固", "最小权限", "防火墙", "auditd"],
            body: `
> **官方文档基线**：[CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)（Distribution Independent Linux / Ubuntu Linux / RHEL） · [NIST SP 800-123](https://csrc.nist.gov/pubs/sp/800/123/final)（服务器安全指南） · ${C}man 5 sshd_config${C} / ${C}man 5 pam.d${C} / ${C}man 8 auditctl${C}

## 一、先建心智模型：基线加固的五个面

| 面 | 要回答的问题 | 主要手段 |
|---|---|---|
| 账号与权限 | 谁能进、进来能干什么 | SSH 配置、sudo、PAM、SUID 排查 |
| 文件系统 | 关键文件是否可能被改 | 权限、${C}chattr${C}、分区挂载选项 |
| 服务与网络 | 对外暴露了什么 | 关闭无用服务、防火墙、监听端口核查 |
| 补丁与内核 | 已知漏洞是否已修 | 自动更新、sysctl 加固 |
| 审计与完整性 | 出事能不能查出来 | auditd、aide、日志外送 |

**加固的原则是「最小化」**：最小安装、最小权限、最小暴露面。

## 二、账号与 SSH 加固（收益最高）

${F}bash
# 1) 禁止 root 直接登录 + 禁止空口令（/etc/ssh/sshd_config）
PermitRootLogin no
PermitEmptyPasswords no
PasswordAuthentication no          # 改为仅密钥登录（确认密钥可用后再改！）
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers deploy ops              # 白名单，配合 AllowGroups

# 2) 核查是否有 UID 0 的多余账号
awk -F: '$3==0 {print $1}' /etc/passwd     # 只应有 root

# 3) 清理无用账号 / 锁定长期未登录账号
lastlog | awk 'NR>1 && $2=="**Never" {print $1}'
usermod -L -s /sbin/nologin olduser

# 4) 口令策略（PAM pwquality）
# /etc/security/pwquality.conf
minlen = 12
minclass = 3
maxrepeat = 3
${F}

**⚠ 三个真实事故点**：
1. **先关密码登录再确认密钥可用** → 把自己锁在门外（务必先开一个新会话验证密钥能登）。
2. **换 SSH 端口当成安全措施** → 只是减少日志噪音，扫描器几秒就能发现新端口，**不能替代密钥认证 + fail2ban**。
3. **fail2ban 未配置白名单** → 把自己的办公出口 IP 封了。

${F}bash
# fail2ban 最小可用配置 /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 5
bantime = 3600
ignoreip = 127.0.0.1/8 10.0.0.0/8 203.0.113.10   # 你的办公/堡垒机出口
${F}

## 三、文件系统与 SUID 排查

${F}bash
# 1) 全盘找 SUID/SGID —— 提权常见跳板
find / -xdev -perm -4000 -type f -ls 2>/dev/null
find / -xdev -perm -2000 -type f -ls 2>/dev/null
# 关注：异常新增的、非包管理器安装的
rpm -Vf /usr/bin/passwd        # RHEL：校验文件是否被篡改
dpkg -V                        # Debian/Ubuntu：校验所有包文件完整性

# 2) 全局可写目录/文件（攻击者最爱落地 webshell 的地方）
find / -xdev -type d -perm -0002 ! -perm -1000 2>/dev/null   # 无 sticky bit 的全局可写目录
find / -xdev -type f -perm -0002 -newermt '-7 days' 2>/dev/null

# 3) 关键文件权限
chmod 600 /etc/shadow /etc/gshadow
chmod 644 /etc/passwd /etc/group
chattr +i /etc/passwd /etc/shadow /etc/ssh/sshd_config   # 防篡改（注意会影响正常改密操作）
${F}

**umask 基线**：${C}/etc/profile${C} 中设 ${C}umask 027${C}，保证新建文件默认不对 other 开放。

**分区挂载最小权限**（${C}/etc/fstab${C}）：

${F}bash
tmpfs  /tmp      tmpfs  defaults,noexec,nosuid,nodev,size=2G  0 0
/dev/sdb1 /var/log ext4  defaults,nosuid,nodev                 0 0
${F}

${C}/tmp${C} 加 ${C}noexec${C} 能挡住「上传脚本直接执行」的一大批 webshell——**但先确认业务不依赖在 /tmp 执行程序**（部分 Java 库会解压 native 到 /tmp 执行）。

## 四、服务与网络暴露面

${F}bash
# 1) 看清到底听了什么（ss 优先于过时的 netstat）
ss -tulnp | grep -v '127.0.0.1\|::1'      # 只看对外监听
# 常见高危：6379(redis) 3306(mysql) 9200(es) 27017(mongo) 0.0.0.0 监听且无认证

# 2) 关闭无用服务
systemctl list-unit-files --state=enabled
systemctl disable --now avahi-daemon cups bluetooth telnet.socket

# 3) 防火墙默认拒绝（firewalld 示例）
firewall-cmd --permanent --remove-service=dhcpv6-client
firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=10.0.0.0/8 port port=3306 protocol=tcp accept'
firewall-cmd --reload

# nftables 等价思路（默认 drop，仅放行必要）
# nft add rule inet filter input ct state established,related accept
# nft add rule inet filter input tcp dport { 22, 80, 443 } accept
# nft add rule inet filter input drop
${F}

**最常见的致命配置**：数据库/缓存/ES **监听 0.0.0.0 且无认证**，被公网扫到直接拖库。加固顺序永远是：**先绑内网（bind 127.0.0.1 或内网 IP）+ 开认证 + 防火墙兜底**，三者叠加。

## 五、补丁、内核参数与审计

${F}bash
# 1) 自动安全更新
apt install unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades   # Debian 系
dnf install dnf-automatic && systemctl enable --now dnf-automatic.timer          # RHEL 系

# 2) sysctl 加固要点（/etc/sysctl.d/99-hardening.conf）
net.ipv4.conf.all.rp_filter = 1              # 防 IP 欺骗
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1                  # SYN Flood 防护
net.ipv4.conf.all.log_martians = 1
kernel.dmesg_restrict = 1                    # 非特权用户不能读内核日志
kernel.kptr_restrict = 2
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
${F}

**审计（auditd）至少覆盖**：${C}/etc/passwd${C}、${C}/etc/sudoers${C}、${C}/etc/ssh/sshd_config${C} 的写操作，以及 ${C}execve${C} 系统调用（用于回溯「谁执行了什么」）：

${F}bash
auditctl -w /etc/passwd -p wa -k identity
auditctl -w /etc/sudoers -p wa -k privilege
auditctl -a always,exit -F arch=b64 -S execve -k exec_trace
ausearch -k identity -ts recent        # 事后检索
${F}

用 **aide / tripwire** 做文件完整性基线：首次生成数据库，之后定期比对，能发现「被悄悄改了但没触发审计」的后门文件。

## ⚠ 常见误区

1. **「装了杀毒/EDR 就够了」**——配置错误（0.0.0.0 + 无认证）不是病毒行为，EDR 不会拦。
2. **只加固新机器，存量机器不再扫**——基线要**周期性重新核查**（配置漂移是必然的）。
3. **${C}chattr +i /etc/shadow${C} 后忘了**——后续改密、加用户都会失败，需要先 ${C}-i${C}。
4. **把所有加固项一次全上，不做业务验证**——${C}noexec /tmp${C}、${C}PermitRootLogin no${C} 都可能影响业务脚本，**必须灰度 + 回归**。
5. **只改配置不改「谁有权改配置」**——加固项本身要纳入配置管理与变更审计。

## ✅ 自检清单

- [ ] SSH：禁 root 直登、禁空口令、密钥登录、${C}AllowUsers${C} 白名单、${C}MaxAuthTries${C} 已设
- [ ] 无多余 UID 0 账号；长期未登录账号已清理或锁定
- [ ] SUID/SGID 清单已建立并有「新增即告警」
- [ ] ${C}/etc/shadow${C} 权限 600；umask 027；关键文件有完整性校验（aide）
- [ ] 对外监听端口已逐条确认必要性；数据库/中间件绑定内网 + 认证 + 防火墙
- [ ] 防火墙默认拒绝，仅放行必要端口与来源网段
- [ ] 自动安全更新已开启，内核有重启计划（补丁生效需重启）
- [ ] sysctl 加固项与 auditd 关键规则已生效并持久化（${C}auditd.conf${C} / ${C}sysctl.d${C}）
`
          },
          // __MORE_BASIC__
        ]
      },
      /* ============================ 中级 ============================ */
      {
        id: "mid",
        name: "中级",
        desc: "能做漏洞发现与修复：按 PTES/WSTG 做渗透测试，设计抗打的认证授权与加密方案，会读日志做入侵排查，并管住依赖供应链风险。",
        chapters: [
          {
            id: "security-mid-1",
            title: "渗透测试流程与工具（PTES + OWASP WSTG）",
            minutes: 26,
            updated: "2026-09-16",
            applies: "已授权测试环境 / 自有系统",
            tags: ["渗透", "测试", "红队"],
            terms: ["PTES", "WSTG", "信息收集", "CVSS"],
            body: `
> **官方文档基线**：[OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/)（按 WSTG-INFO / CONF / IDNT / ATHN / SESS / ATHZ / CRYP / INPV / BUSL / CLNT 分类） · [PTES](http://www.pentest-standard.org/) · [CVSS v3.1 规范](https://www.first.org/cvss/v3.1/specification-document) · [OWASP ZAP](https://www.zaproxy.org/docs/)

## ⚠ 零、红线：授权是渗透测试的第一前提

**没有书面授权，测试就是入侵，可能构成犯罪。** 授权书必须明确：测试目标范围（域名/IP/账号）、时间窗口、允许的手段（是否允许社工、DoS、数据导出）、紧急联系人。跨出范围一步（比如打到了同一个云账号下的其他系统）都要立刻停止并报告。

**生产环境的压力测试/DoS 类测试**默认不做，除非客户明确书面同意并安排了业务低峰窗口。

## 一、流程：PTES 七阶段

| 阶段 | 产出 |
|---|---|
| 1 前期交互 | 目标、范围、规则、时间窗 |
| 2 情报收集 | 资产地图、技术栈、人员/邮箱 |
| 3 威胁建模 | 最可能的攻击路径（按资产价值排序） |
| 4 漏洞分析 | 候选漏洞清单 + 优先级 |
| 5 渗透攻击 | 验证漏洞可利用性、拿权限 |
| 6 后渗透 | 提权、横向、证明影响范围 |
| 7 报告 | 结论 + 复现步骤 + 修复建议 + 风险评级 |

对应 OWASP WSTG 的测试分类，把「测试什么」结构化了：

| WSTG 分类 | 测什么 |
|---|---|
| INFO | 信息收集（指纹、注释、备份文件、JS 里的接口） |
| CONF | 配置（HTTP 方法、旧文件、备份、HSTS、云存储） |
| IDNT | 身份管理（注册、账号枚举、弱策略） |
| ATHN | 认证（暴力破解、绕过、记住我、密码策略） |
| SESS | 会话（Cookie 属性、固定、注销、超时） |
| ATHZ | **授权（越权——最高价值区）** |
| CRYP | 密码学（传输、存储、弱算法） |
| INPV | 输入验证（XSS、SQLi、SSRF、XXE、命令注入…） |
| BUSL | 业务逻辑（流程绕过、竞态、参数篡改） |
| CLNT | 客户端（DOM XSS、点击劫持、CORS） |

**实战重点**：扫描器能覆盖 INPV/CONF 的大部分，但 **ATHZ（越权）和 BUSL（业务逻辑）几乎只能靠人工思考**——而它们恰恰是真实事故里最常见、危害最大的。所以一次测试的时间分配，建议「资产梳理 30% / 手工测试越权与逻辑 40% / 工具扫描 30%」。

## 二、信息收集：把资产地图先画出来

**被动收集（不接触目标，首选）**：
- 证书透明度日志找子域：${C}crt.sh${C}、${C}certspotter${C}
- 搜索引擎语法：${C}site:example.com filetype:pdf${C}、${C}site:example.com inurl:admin${C}
- 历史快照（Wayback）找已下线的旧接口

**主动收集（会留日志）**：
${F}bash
# 子域枚举（多种来源交叉，避免单点漏）
subfinder -d example.com -all -o subs.txt
dnsx -l subs.txt -a -resp -o resolved.txt      # 解析存活

# 端口与服务指纹
nmap -sS -sV -p- --min-rate 2000 -oA nmap_full target.com

# Web 指纹（框架/中间件/组件版本）
whatweb -a 3 https://target.com
httpx -l subs.txt -title -tech-detect -status-code -o http.txt

# 目录与敏感文件（控制速率！别把生产打挂）
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \\
     -u https://target.com/FUZZ -mc 200,301,302,403 -rate 50
${F}

**别漏的几处高价值信息**：前端 JS 里的接口与密钥（${C}/static/js/*.js${C} 全文搜 ${C}apiKey${C}、${C}token${C}、${C}internal${C}）、${C}robots.txt${C}、${C}sitemap.xml${C}、Swagger/Actuator 端点、Source Map（${C}.js.map${C} 能还原源码）、Git 泄露（${C}/.git/config${C}）。

## 三、漏洞发现与利用

**Burp Suite 工作流**（行业事实标准）：

| 模块 | 用途 |
|---|---|
| Proxy | 拦截改包，把所有流量记录成「站点地图」 |
| Repeater | 手工反复改单条请求（越权/逻辑测试主战场） |
| Intruder | 爆破/枚举（口令、ID、验证码） |
| Scanner | 自动化被动/主动扫描 |
| Comparer / Decoder | 比对与编解码 |

**授权测试（越权）的标准三步**：
1. 用 A 账号正常操作，记录所有带 ID/归属隐含信息的请求。
2. 换成 B 账号，用**同样的请求**打一遍，看能否拿到 A 的数据（横向越权）。
3. 用普通账号打管理接口（纵向越权），并尝试用「参数污染」「改字段」绕过前端限制。

**其他常用工具**：
- ${C}nuclei${C}：基于模板的批量漏洞验证（模板库社区维护，适合快速过一遍已知 CVE）
- ${C}sqlmap${C}：SQL 注入验证与利用（先手工确认注入点，再用它加速）
- ${C}httpx / ffuf / amass${C}：资产与目录
- ${C}ysoserial${C} / ${C}gadgetinspector${C}：Java 反序列化链（授权环境）

## 四、风险评级：用 CVSS 说话，而不是「我觉得很严重」

CVSS v3.1 向量示例：

${F}bash
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N   # 8.2 High
${F}

| 维度 | 取值含义 |
|---|---|
| AV 攻击路径 | N 网络 / A 相邻 / L 本地 / P 物理 |
| AC 复杂度 | L 低 / H 高 |
| PR 所需权限 | N 无 / L 低 / H 高 |
| UI 用户交互 | N 无需 / R 需要 |
| S 影响范围 | U 不变 / C 扩散 |
| C/I/A | 机密性/完整性/可用性：N 无 / L 低 / H 高 |

**但报告里不能只有 CVSS**。真实优先级要叠加**业务上下文**：一个 CVSS 6.5 的越权（任意用户可读他人订单，含手机号地址）比 CVSS 7.5 的、但只在极冷门功能上的 XSS 紧急得多。建议报告采用 **CVSS + 业务影响 + 利用难度** 三栏，给出明确的「建议修复时限」。

## 五、报告结构（客户真正看的部分）

${F}text
1. 概述        —— 一段话说清「我测了什么、发现什么、最该先修什么」
2. 风险总览    —— 按等级统计的漏洞表
3. 详细发现    —— 每个漏洞：名称 / 风险等级 / 影响路径 / 复现步骤（含请求响应）/ 证据截图 / 修复建议
4. 修复优先级  —— 按业务影响的排序建议，而非仅按 CVSS
5. 附录        —— 测试范围、时间、工具与限制说明
${F}

**修复建议要可执行**：不要写「修复 XSS 漏洞」，要写「在 ${C}OrderController.detail()${C} 返回前对 ${C}remark${C} 字段做 HTML 编码，或改用 ${C}textContent${C} 渲染；参考 OWASP XSS Prevention Cheat Sheet 规则 #2」。

## ⚠ 常见误区

1. **只跑扫描器就交报告**——扫描器查不出越权和逻辑漏洞，那才是客户最需要你找的。
2. **不控制速率**——目录爆破/漏洞扫描把生产打挂，属于事故。
3. **测试数据不清理**——上传的 webshell、插入的测试数据必须登记并在结束后清除。
4. **报告里只有漏洞没有「业务影响」**——研发看不懂「CWE-639」，但看得懂「任何人可查全部订单」。
5. **把「未发现漏洞」当成「没有漏洞」**——报告要写明测试范围与限制（未测的功能、未用的手段）。

## ✅ 自检清单

- [ ] 有书面授权，范围与手段已书面确认
- [ ] 资产清单完整（子域、端口、API、移动端、旧系统）
- [ ] 越权测试覆盖：横向（同级用户互相访问）+ 纵向（普通用户访问管理功能）
- [ ] 业务逻辑测试覆盖：金额/数量篡改、流程跳步、竞态（重复领券/重复下单）
- [ ] 每个漏洞都有可复现的完整请求响应 + 修复建议
- [ ] 风险评级同时给出 CVSS 向量与业务影响说明
- [ ] 测试产生的数据/账号/后门已全部清理并登记

## 📚 延伸阅读

- OWASP WSTG：[owasp.org/www-project-web-security-testing-guide](https://owasp.org/www-project-web-security-testing-guide/)
- FIRST CVSS v3.1：[first.org/cvss/v3.1/specification-document](https://www.first.org/cvss/v3.1/specification-document)
- OWASP ZAP 文档：[zaproxy.org/docs](https://www.zaproxy.org/docs/)
`
          },
          {
            id: "security-mid-2",
            title: "认证与授权设计：OAuth 2.0 / OIDC / RBAC / ABAC",
            minutes: 30,
            updated: "2026-09-16",
            applies: "通用后端 / 开放平台",
            tags: ["授权", "OAuth", "RBAC", "零信任"],
            terms: ["OAuth 2.0", "OIDC", "PKCE", "RBAC", "ABAC"],
            body: `
> **官方文档基线**：RFC 6749（OAuth 2.0）· RFC 7636（PKCE）· RFC 6750（Bearer Token）· [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) · [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics) · [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

## 一、先把「认证」和「授权」彻底分开

| | 认证（Authentication） | 授权（Authorization） |
|---|---|---|
| 回答 | 你是谁 | 你能做什么 / 能碰哪条数据 |
| 失败响应 | 401 Unauthorized | 403 Forbidden（或统一 404） |
| 常见技术 | 口令、MFA、OIDC、证书 | RBAC、ABAC、ReBAC、策略引擎 |

**A01「失效的访问控制」连续多年排名第一，根因几乎都在这句话上：系统只做了认证，没做授权（或授权只做了一半）。**

## 二、授权模型选型

| 模型 | 判定依据 | 适合 | 例子 |
|---|---|---|---|
| RBAC | 角色 | 权限边界清晰的内部系统 | 管理员/编辑/普通用户 |
| ABAC | 主体+资源+动作+环境 属性 | 需要细粒度、带上下文 | 「仅在工作时间、来自公司 IP、可读本部门文档」 |
| ReBAC | 关系图 | 协作/社交类（共享、父子） | 「我分享给他的文档他能看」（Google Zanzibar 模型） |

**工程上最实用的是混合**：**RBAC 定粗粒度（能不能进这个功能），ABAC/数据规则定细粒度（能看哪些行、哪些字段）**。

${F}java
// 粗粒度：角色（注解式，可审计）
@PreAuthorize("hasRole('ORDER_ADMIN')")
public List<Order> listAll() { ... }

// 细粒度：数据权限必须落到 SQL（不要靠内存过滤）
public List<Order> listMine(Long userId) {
    return repo.findAllByUserId(userId);       // 行级权限写进查询
}

// 列级权限：敏感字段单独授权，或用 DTO 按角色裁剪
${F}

**「先查出来再过滤」是典型反模式**：一旦某个分支忘记过滤、或分页在过滤之前执行，就会泄露。**权限条件必须参与查询本身。**

## 三、OAuth 2.0：它其实是「授权」协议，不是登录协议

OAuth 2.0 解决的是「第三方应用在用户授权下访问用户在资源服务器上的数据」。**「用微信登录」这个需求本质是 OIDC（在 OAuth 之上加了一层身份层）。**

**四种授权类型，以及 2026 年的取舍**：

| 类型 | 状态 | 说明 |
|---|---|---|
| 授权码 + PKCE | ✅ **唯一推荐** | 所有客户端类型（含 SPA、移动端）都用它 |
| 隐式（Implicit） | ❌ 已废弃 | token 出现在 URL fragment，易泄露 |
| 密码式（Password） | ❌ 已废弃 | 第三方应用拿到用户口令 |
| 客户端凭证 | ✅ 保留 | 无用户参与的服务间调用（M2M） |

**授权码 + PKCE 完整流程**：

${F}text
1) 客户端生成 code_verifier（随机串）+ code_challenge = SHA256(code_verifier)
2) 浏览器跳转：
   /authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=随机
             &code_challenge=...&code_challenge_method=S256
3) 用户在授权服务器登录并同意
4) 授权服务器回调 redirect_uri?code=AUTH_CODE&state=随机
5) 客户端【后端】用 code + code_verifier 换 token（/token）
6) 拿到 access_token（+id_token +refresh_token）
${F}

**PKCE 为什么必需**：移动端/SPA 无法安全保存 client_secret，而授权码可能被恶意 App 通过自定义 scheme 劫持。PKCE 让「劫持到 code 的人换不到 token」（因为他没有 code_verifier）。

**OAuth 的经典坑（几乎每条都对应一次真实事故）**：

| 坑 | 后果 | 正确做法 |
|---|---|---|
${C}state${C} 不校验 | CSRF 绑定攻击，把受害者绑到攻击者账号 | 生成随机 state，回调时严格比对 |
${C}redirect_uri${C} 宽松匹配 | 授权码被送到攻击者域名 | **精确全量匹配**注册过的 URI，禁止通配/子路径宽松 |
token 放 URL 参数 | 泄露到日志/Referer | 用 Authorization 头（RFC 6750） |
无 ${C}nonce${C}（OIDC） | id_token 重放 | 生成并校验 nonce |
scope 过大 | 一个泄漏 token 全量权限 | 最小权限，按需增量授权 |

## 四、OIDC：身份层要校验什么

${C}id_token${C} 是一个 JWT，**服务端必须校验**：签名（取 JWKS，注意 ${C}kid${C} 轮换）、${C}iss${C}、${C}aud${C}（必须等于自己的 client_id）、${C}exp${C}、${C}nonce${C}，以及不要用它当 access_token 用（用途不同）。

**JWKS 缓存与轮换**：不要每次请求都拉 ${C}/.well-known/jwks.json${C}（会拖慢 + 被限流）；按 ${C}kid${C} 缓存，并设置合理的刷新周期（如 1 小时）与「未知 kid 立即刷新一次」的兜底。

## 五、越权防护的工程化落地

1. **统一鉴权入口**：网关/拦截器做「认证」，业务层做「授权」；禁止各接口自己写 if 判断。
2. **资源归属写进查询**：见上文 A01 示例。
3. **敏感接口二次校验**：转账、改密、导出等操作，即使有 token 也要校验「当前会话是最近认证过的」（如 15 分钟内），业界称 **step-up authentication**。
4. **接口清单化**：维护「接口 → 所需权限」的映射表，新增接口必须登记；配套自动化用例（每个接口用无权限账号打一遍，断言 403/404）。
5. **前端隐藏 ≠ 权限**：前端不显示按钮只是体验，后端必须独立校验。

## 六、零信任的几个落地抓手

零信任（BeyondCorp 思路）不是买产品，而是三条原则：**永不默认信任（网络位置不等于身份）、最小权限、持续验证**。

可落地的具体动作：服务间调用用 **mTLS + SPIFFE 身份**（证书里的 SPIFFE ID 就是服务身份，替代「内网 IP 白名单」）；内部管理后台不暴露公网，走 **身份感知代理（IAP）**；所有访问都记审计并按风险动态调整（异地/新设备要求二次验证）。

## ⚠ 常见误区

1. **「内网接口不需要鉴权」**——SSRF、横向移动、内部人员风险，一样成立。
2. **把 access_token 当身份凭证解析使用**——access_token 是给资源服务器用的，身份请用 id_token。
3. **${C}redirect_uri${C} 支持通配**——${C}https://app.com/*${C} 等于把授权码送给攻击者。
4. **RBAC 角色硬编码在代码里**——权限变更要发版，最终没人敢改，只好给所有人管理员。
5. **授权判断用「列表长度 > 0」之类的间接信号**——边界情况（空列表、并发）直接绕过。

## ✅ 自检清单

- [ ] 认证（401）与授权（403/404）职责清晰分分离，接口都有授权校验
- [ ] 所有涉及资源的查询，权限条件在 SQL/查询层生效（不靠内存过滤）
- [ ] 每个接口都用「无权限账号」跑过自动化用例并断言拒绝
- [ ] OAuth 使用授权码 + PKCE；状态参数与 nonce 已校验；redirect_uri 精确匹配
- [ ] token 只走 Authorization 头；access_token 短效 + refresh_token 可撤销
- [ ] OIDC id_token 校验签名/iss/aud/exp/nonce，JWKS 有缓存与轮换兜底
- [ ] 敏感操作有 step-up 二次认证与完整审计

## 📚 延伸阅读

- RFC 6749 / 7636 / 6750：[datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749)
- OpenID Connect Core：[openid.net/specs/openid-connect-core-1_0.html](https://openid.net/specs/openid-connect-core-1_0.html)
- OAuth 2.0 Security BCP：[datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
`
          },
          {
            id: "security-mid-3",
            title: "加密与密钥管理：TLS / AES-GCM / KMS 与国密",
            minutes: 26,
            updated: "2026-09-16",
            applies: "通用后端 / 基础设施",
            tags: ["加密", "密钥", "TLS"],
            terms: ["AES-GCM", "TLS 1.3", "KMS", "国密"],
            body: `
> **官方文档基线**：RFC 8446（TLS 1.3）· NIST SP 800-38D（GCM）· NIST SP 800-57（密钥管理）· [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) · GB/T 32918（SM2）· GB/T 32907（SM4）

## 一、三条铁律，先记住再往下看

1. **不要自己发明密码学**（协议、算法、填充模式、构造方式，都不要）。
2. **不要自己实现密码学**（用 libsodium / BouncyCastle / 语言标准库 / KMS API，不要手写 AES 调用拼装协议）。
3. **分清三件事的用途**：**加密**（可逆，保密）、**哈希**（不可逆，完整性）、**HMAC/签名**（完整性 + 来源认证）。**用错了比不用更危险。**

## 二、对称加密：为什么只推荐 AES-GCM / ChaCha20-Poly1305

| 模式 | 是否认证 | 结论 |
|---|---|---|
| ECB | 否 | ❌ **禁用**（相同明文块→相同密文块，泄露结构） |
| CBC | 否 | ⚠ 需自己处理 IV 且易受 padding oracle；不推荐新系统 |
| CTR | 否 | ⚠ 仅加密不认证，可被篡改 |
| **GCM** | ✅ AEAD | ✅ 推荐（硬件加速好） |
| **ChaCha20-Poly1305** | ✅ AEAD | ✅ 推荐（无 AES 硬件加速时更快，移动端首选） |

**AEAD（带关联数据的认证加密）** 是关键词：它同时保证**机密性 + 完整性**，篡改一个 bit 就会解密失败，不会像 CBC 那样「解出垃圾数据还继续用」。

${F}java
// ✅ Java 标准库 AES-GCM 正确用法
byte[] nonce = new byte[12];                       // 96 bit，GCM 标准长度
new SecureRandom().nextBytes(nonce);               // 【必须】每次加密都换
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, nonce));
c.updateAAD(contextBytes);                          // 可绑定上下文（如 userId），防密文搬移
byte[] ct = c.doFinal(plaintext);
// 存储格式：nonce || ciphertext（nonce 不必保密，但绝不能复用）
${F}

**⚠ nonce 复用是 GCM 的致命错误**：同一密钥下 nonce 重复，攻击者可以**恢复出明文异或值甚至伪造认证标签**。这不是「降低安全性」，是**彻底击穿**。所以：
- 不要用计数器做 nonce（分布式下极易重复）
- 不要用固定 nonce
- 密钥 + 随机 96bit nonce 的组合在 2^32 次加密内碰撞概率可忽略，**但要在同一密钥加密次数接近上限时轮换密钥**

**密钥长度**：AES-128 已足够（NIST 认为 AES-128 在可预见未来安全），AES-256 用于合规要求或需要更强后量子余量时。

## 三、非对称加密：加密和签名是两件事

| 用途 | 算法 | 说明 |
|---|---|---|
| 加密（小数据/密钥封装） | RSA-OAEP（≥2048，推荐 3072+）/ ECIES | 不要用 RSA 直接加密大文件，只加密「数据密钥」 |
| 签名 | **Ed25519** / ECDSA P-256 / RSASSA-PSS | Ed25519 更简单更快更安全，新系统首选 |
| 密钥交换 | X25519 / ECDHE | TLS 1.3 已内置 |

**RSA 使用三不要**：不要用 PKCS#1 v1.5 加密（Bleichenbacher 类攻击）、不要共用「签名+加密」密钥、不要生成 1024 位密钥。

**签名验证的业务价值**：比 HMAC 更适合「多方场景」——验签方只需公钥，不需要共享密钥（所以 JWT 用 RS256/ES256 时资源服务器可以独立验签）。

## 四、口令 vs 一般哈希：别混用

- **数据完整性 / 去重 / 缓存键** → SHA-256 / BLAKE3（快是对的）
- **口令存储** → Argon2id / bcrypt / scrypt（**慢是对的**，见初级「认证与会话安全」）
- **消息完整性 + 认证** → HMAC-SHA256（不是裸 SHA-256，否则可被长度扩展攻击）

**恒定时间比较**（再次强调，因为它太常被漏掉）：

${F}java
// ❌ 提前返回 → 时序侧信道
// ✅ 恒定时间
boolean ok = MessageDigest.isEqual(a, b);
// Node.js: crypto.timingSafeEqual(bufA, bufB)
${F}

## 五、TLS：配置到位的检查点

**TLS 1.3（RFC 8446）的核心改进**：握手 1-RTT（甚至 0-RTT 恢复）、强制前向保密（只保留 ECDHE 类密钥交换）、移除了 RSA 密钥交换和一票弱套件、握手阶段即加密。

**服务端配置检查点**：
${F}bash
# 1) 协议版本：只留 1.2 / 1.3
ssl_protocols TLSv1.2 TLSv1.3;

# 2) 套件（1.3 套件由 openssl 自动优选，1.2 需显式指定 AEAD + ECDHE）
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers on;

# 3) 强制 HTTPS + HSTS（先在测试环境验证，preload 一旦提交很难撤销）
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# 4) 验证实际效果（别靠猜）
nmap --script ssl-enum-ciphers -p 443 example.com
testssl.sh https://example.com
${F}

**证书链完整**：中间证书必须一并下发，否则部分客户端（Android 老版本、Java 老版本）握手失败——这是「本机浏览器正常、App 报错」的典型原因。

**mTLS（双向认证）**：服务间通信应优先 mTLS，把「内网 IP 白名单」升级为「证书里的服务身份」。要点：私钥不落盘（用 KMS/HSM 或 SPIFFE 自动轮换短效证书）、证书有效期短（几小时到几天）、吊销机制（CRL/OCSP 或短效自动过期）。

## 六、密钥管理：加密最难的部分从来不是算法

**生命周期**：生成 → 分发 → 存储 → 使用 → 轮换 → 归档/销毁。每一环都要有制度与自动化。

**分级存储**：
- **根密钥（KEK）**：放 KMS / HSM，永不导出，仅用于加解密数据密钥
- **数据密钥（DEK）**：**信封加密**——用 KEK 加密后与密文一起存储
- **配置/密钥不进代码仓库**：用 Vault / KMS / Secret Manager，CI 中通过 OIDC 短期凭证获取（不要在 CI 里长期存静态密钥）

${F}bash
# 信封加密思路（伪代码）
DEK   = random(32 bytes)                    # 每次写入新生成
Wrapped = KMS.Encrypt(KEK_id, DEK)          # 交给 KMS
Blob  = { wrapped_dek: Wrapped, iv, ciphertext: AES_GCM(DEK, plaintext) }
# 读取时：DEK = KMS.Decrypt(Wrapped) → 解密 → DEK 立刻从内存丢弃
${F}

**为什么要信封加密**：① KMS 的加解密有配额与延迟，不适合直连大数据；② 只需轮换 KEK 时重封装 DEK（数据不用重加密）；③ 数据密钥泄露只影响单条数据。

**轮换策略**：KEK 定期轮换（如年）或按事件轮换（人员离职、疑似泄露立即轮换）；DEK 每次写入即新生成（天然无轮换负担）。**轮换必须演练过**——没演练过的轮换方案在真正需要时一定失败。

**国密与合规**：等保/密评场景可能要求 SM2（非对称）/ SM3（哈希）/ SM4（对称）。落地方式：优先选用支持国密的 TLS 库（GMTLS）与密码机；**不要把国密手搓进业务代码**。混合方案常见做法是「证书链 + 数据层国密」。

## ⚠ 常见误区

1. **「加密了就是安全的」**——没有完整性保护的加密可被篡改（如 CBC 位翻转），没有认证的加密可被替换。
2. **密钥硬编码/提交进 Git**——即使后来删除，Git 历史里还在。**泄露即轮换，不要只改代码。**
3. **Base64 当成加密**——Base64 是编码，无密钥。
4. **拿 MD5/SHA-1 做签名**——已有实际碰撞构造，签名必须用 SHA-256 及以上。
5. **自研「加盐拼接」方案**——等于发明密码学。
6. **TLS 配好就不管证书到期**——到期当天全站事故；必须有到期监控（提前 30 天告警）。

## ✅ 自检清单

- [ ] 无自研密码学；所有加密使用标准库/KMS
- [ ] 对称加密统一为 AES-GCM 或 ChaCha20-Poly1305，**nonce 每次随机且不复用**
- [ ] 口令用 Argon2id/bcrypt；其他哈希用 SHA-256/BLAKE3；完整性用 HMAC
- [ ] 签名使用 Ed25519/ECDSA/RSASSA-PSS；JWT 用非对称算法
- [ ] TLS 仅 1.2/1.3，套件已收敛，证书链完整，HSTS 已开
- [ ] 密钥存于 KMS/Vault，采用信封加密，有轮换策略与演练记录
- [ ] 代码仓库与 CI 中无长期静态密钥；有密钥泄露响应流程
- [ ] 证书与密钥到期有监控告警（提前 30 天）

## 📚 延伸阅读

- RFC 8446（TLS 1.3）：[datatracker.ietf.org/doc/html/rfc8446](https://datatracker.ietf.org/doc/html/rfc8446)
- OWASP Cryptographic Storage Cheat Sheet：[cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- NIST SP 800-57（密钥管理）：[csrc.nist.gov/pubs/sp/800/57/pt1/r5/final](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
`
          },
          {
            id: "security-mid-4",
            title: "日志审计与入侵排查",
            minutes: 24,
            updated: "2026-09-16",
            applies: "Linux / Web 应用",
            tags: ["审计", "入侵排查", "日志"],
            terms: ["审计日志", "入侵迹象", "webshell", "应急"],
            body: `
> **官方文档基线**：[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) · NIST SP 800-92（日志管理指南）· [MITRE ATT&CK](https://attack.mitre.org/)（对照攻击手法）· ${C}man 8 ausearch${C} / ${C}man 8 auditctl${C}

## 一、先想清楚：日志是给「三个月后的自己」看的

安全日志的目标只有一个：**在事后（或事中）能回答「谁、什么时候、对什么、做了什么、结果如何」**。做不到这一点的日志，量再大也没用。

**最低限度要记的事件**（OWASP Logging Cheat Sheet 的分类）：

| 类别 | 具体事件 |
|---|---|
| 认证 | 登录成功/失败、登出、口令修改、MFA 变更、锁定 |
| 授权 | 越权尝试（403）、角色/权限变更 |
| 会话 | 会话创建/失效、token 刷新、异常 IP 变更 |
| 数据 | 批量导出、删除、敏感字段访问 |
| 管理 | 配置变更、用户/角色管理、密钥操作 |
| 输入异常 | 校验失败（可能是攻击探测）、反序列化失败 |

**绝不能记**：明文口令、完整身份证/银行卡、完整 token、会话 ID、密钥。需要关联时记**哈希或掩码**（如 ${C}138****1234${C}）。

**日志的完整性**：应用进程**不应有删除/修改审计日志的权限**——日志应写入独立目录（只追加）、实时外送到集中平台（ELK/Loki/Splunk），并把本地日志设为 ${C}append-only${C}：
${F}bash
chattr +a /var/log/audit/audit.log      # 只允许追加
# 更稳的做法：syslog/fluent-bit 实时转发到中心，本地只留少量缓冲
${F}

## 二、Linux 侧排查：一套固定的「现场勘察」顺序

**排查的第一原则是「先保全，再清理」**：直接 ${C}kill -9${C} 或重启，会把内存里的证据（进程、连接、无文件后门）全部毁掉。

${F}bash
# ① 谁在登录 / 谁登录过
w; who                          # 当前会话
last -a -n 30                   # 成功登录历史
lastb -n 30                     # 失败登录（暴破痕迹）
grep -i 'Accepted\\|Failed' /var/log/auth.log | tail -50   # Debian 系
grep -i 'Accepted\\|Failed' /var/log/secure | tail -50     # RHEL 系

# ② 异常账号（后门账号的经典特征：UID 0 或可登录的 system 账号）
awk -F: '$3==0 || $3<1000 && $7!~/nologin|false/ {print}' /etc/passwd
grep -v '^#' /etc/sudoers /etc/sudoers.d/* 2>/dev/null        # sudo 提权后门
cat /etc/ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null   # 陌生公钥 = 持久化后门
ls -la ~/.ssh/ /root/.ssh/ 2>/dev/null

# ③ 进程与外联（挖矿/反弹 shell 最明显的两个特征）
ps -eo pid,ppid,user,lstart,cmd --sort=-%cpu | head -20
ls -l /proc/<PID>/exe                       # 可执行文件被删（无文件攻击）→ 显示 deleted
ls -l /proc/<PID>/cwd                       # 进程工作目录（常指向 /tmp）
ss -antp | grep ESTAB                       # 外连，关注非常见端口与境外 IP
ls -l /proc/<PID>/fd | head                 # 可疑 socket 与文件句柄

# ④ 持久化位置（攻击者最爱的几处）
crontab -l; ls -la /etc/cron.*/ /var/spool/cron/ 2>/dev/null
systemctl list-units --type=service --state=running | grep -v -f /dev/null
ls -la /etc/systemd/system/*.service | head -30
cat /etc/rc.local 2>/dev/null
ls -la /etc/ld.so.preload                  # 预加载劫持（rootkit 常用）

# ⑤ 落地文件（webshell / 挖矿程序）
find / -xdev -type f -newermt '-3 days' -not -path '*/proc/*' -not -path '*/sys/*' 2>/dev/null | head -50
find /var/www /tmp /dev/shm -type f -name '*.php' -o -name '*.jsp' -o -name '*.sh' 2>/dev/null | head
${F}

**webshell 的特征**：单文件、时间戳异常（与业务发版时间不符）、文件名随机或伪装成图片/日志、内容含 ${C}eval${C}/${C}assert${C}/${C}Runtime.exec${C}/${C}ProcessBuilder${C}/Base64 长串、权限与属主异常。

${F}bash
# 快速扫描（生产环境慎用 grep -r 全盘，会吃 IO）
grep -rlE 'eval\\(|assert\\(|Runtime\\.getRuntime|ProcessBuilder|base64_decode' /var/www --include='*.php' --include='*.jsp' 2>/dev/null | head
# 用完整性基线更高效
aide --check            # 与初始化时的文件指纹比对
rpm -Va | grep '^..5'   # RHEL：列出被改动过的包文件（MD5 不一致）
${F}

## 三、Web 层排查：从 access.log 找入口

${F}bash
# 1) 高频来源 IP（扫描/爆破特征）
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# 2) 可疑路径与 payload（注意日志里会有编码后的注入串）
grep -iE 'union.*select|\\.\\./|%2e%2e|base64|/etc/passwd|cmd=' access.log | head -20

# 3) 某 IP 的完整时间线（用时间窗缩小范围）
grep '203.0.113.10' access.log | awk '{print $4,$6,$7,$9}' | head -50

# 4) 成功上传可执行文件的请求（结合 webshell 时间戳反查）
grep -E 'POST .*\\.(php|jsp|jspx|war)' access.log | head
${F}

**关键动作是「时间线对齐」**：把「access.log 里的可疑请求时间」与「服务器上文件创建时间」对齐，往往能精确定位攻击入口与落地文件。

## 四、构建一条可用的事件时间线

${F}text
T0  攻击者扫描（大量 404 / 目录爆破）
T1  发现漏洞点（异常参数请求）
T2  上传 webshell 或触发 RCE（POST + 可疑 payload）
T3  建立持久化（新增 authorized_keys / cron / 服务）
T4  提权（sudo 日志 / SUID 调用 / 内核漏洞利用）
T5  横向移动（内网扫描、其他主机登录）
T6  数据外传（大流量出网、压缩打包、放到 /tmp 再上传）
T7  清理痕迹（删日志、删文件、history -c）
${F}

**把这条线与 ATT&CK 技术编号对应起来**（如 T1059 命令执行、T1543 创建服务、T1070 痕迹清除），报告会专业得多，也便于后续做检测规则。

## ⚠ 常见误区

1. **出事就重启/重装**——证据全毁了，且往往被二次入侵（漏洞没修）。
2. **只看应用日志不看系统日志**——攻击者提权/持久化的动作都在系统层。
3. **日志里存了敏感信息**——日志本身成为泄露源（且常被导出给第三方）。
4. **日志本地留存且可被 root 删除**——攻击者第一件事就是清日志，必须实时外送。
5. **没有基线，靠肉眼判断「这是不是可疑文件」**——有 aide/包校验基线，判断快十倍。

## ✅ 自检清单

- [ ] 认证、授权、数据导出、配置变更都有审计日志
- [ ] 日志中无明文口令/完整证件号/token
- [ ] 日志实时外送到集中平台，本地为 append-only，应用无删除权限
- [ ] 有 aide 或包校验基线，能快速发现被改动的文件
- [ ] 保留 ${C}/proc/<PID>/exe${C}、外连、持久化位置的排查剧本（runbook）
- [ ] 内网扫描/大流量出网有监测与告警
- [ ] 做过一次「模拟入侵 → 按剧本排查」的演练

## 📚 延伸阅读

- OWASP Logging Cheat Sheet：[cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- MITRE ATT&CK：[attack.mitre.org](https://attack.mitre.org/)
- NIST SP 800-92：[csrc.nist.gov/pubs/sp/800/92/final](https://csrc.nist.gov/pubs/sp/800/92/final)
`
          },
          {
            id: "security-mid-5",
            title: "安全编码与软件供应链安全（SBOM / SCA / SLSA）",
            minutes: 24,
            updated: "2026-09-16",
            applies: "研发团队 / CI 流水线",
            tags: ["安全编码", "供应链", "SBOM"],
            terms: ["安全编码", "SCA", "SBOM", "SLSA"],
            body: `
> **官方文档基线**：[OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)（安全编码主题集） · [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) · [SLSA 框架](https://slsa.dev/spec/) · [CycloneDX](https://cyclonedx.org/specification/overview/) / [SPDX](https://spdx.dev/) · [CISA SBOM 指南](https://www.cisa.gov/sbom)

## 一、安全编码：把「易错点」变成「默认对的写法」

安全编码不是让每个人都成为安全专家，而是**让安全成为默认路径**。核心就五条：

| 原则 | 落地动作 |
|---|---|
| 输入校验（白名单优先） | 类型、长度、范围、格式；**白名单接受，而不是黑名单拒绝** |
| 输出编码（按上下文） | HTML/属性/JS/URL/SQL 各用各的编码方式 |
| 最小权限 | 数据库账号不分库、容器非 root、进程按需授权 |
| 失败安全（fail-safe） | 异常时**拒绝**而不是放行；**不要吞异常后继续** |
| 不信任任何外部输入 | 包括内网服务、第三方回调、你自己的另一个服务 |

**「失败安全」有个经典反面案例**：

${F}java
// ❌ 异常被吞掉，权限校验「失败但放行了」
try {
    if (!authService.check(user, resource)) throw new DeniedException();
} catch (Exception e) {
    log.warn("auth check failed", e);   // 吞掉异常，代码继续往下执行 → 越权
}
return resource.getData();

// ✅ 校验失败必须阻断，异常向上抛给统一处理器（返回 403）
if (!authService.check(user, resource)) throw new DeniedException();
return resource.getData();
${F}

**按语言的高危 API 黑名单**（CI 里可以直接做静态规则）：

| 语言 | 高危 API | 替代 |
|---|---|---|
| Java | ${C}Runtime.exec${C}、${C}ObjectInputStream${C}、${C}Statement.execute(sql 拼接)${C}、${C}MD5${C} | 参数化、白名单校验、Argon2 |
| JS/Node | ${C}eval${C}、${C}new Function${C}、${C}child_process.exec${C}、${C}innerHTML${C} | ${C}execFile${C}+参数数组、${C}textContent${C} |
| Python | ${C}os.system${C}、${C}subprocess(shell=True)${C}、${C}pickle.loads${C}、${C}yaml.load${C} | ${C}subprocess${C} 列表形式、${C}yaml.safe_load${C} |
| PHP | ${C}eval${C}、${C}include($_GET)${C}、${C}unserialize${C} | 白名单路由、${C}json_decode${C} |

## 二、供应链安全：现代软件 90% 的代码不是自己写的

Log4Shell、xz-utils 后门、npm 恶意包投毒…… **攻击者发现「攻陷一个被广泛依赖的包」比攻陷一家公司划算得多**。

**四个抓手**：

**① SCA（软件成分分析）——知道自己在用什么**

${F}bash
# 各生态的扫描工具（示例）
mvn org.owasp:dependency-check-maven:check        # Java
npm audit --audit-level=high                      # Node
pip-audit                                         # Python
trivy fs --scanners vuln,secret,misconfig .       # 通用 + 镜像 + 密钥泄露
grype dir:.                                       # 通用 SBOM 扫描
${F}

**② SBOM（软件物料清单）——能回答「我到底用了哪些组件、什么版本、许可证是什么」**

${F}bash
# CycloneDX 生成示例（Java）
mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom
# 输出 target/bom.json —— 随每次发版归档，成为「资产台账」
${F}

SBOM 的价值在**漏洞爆发的那一刻**体现：某个组件爆出 CVE，你能在 5 分钟内查出「哪些系统受影响、哪些客户需要通知」，而不是花三天人工排查。这是监管（如美国 EO 14028、国内关键信息基础设施要求）已经明确的方向。

**③ 依赖治理——让「引入一个包」有成本**

- CI 中对新增/升级依赖做**评审门禁**（尤其是 post-install 脚本、首次引入的小众包）
- **锁定版本**（${C}package-lock.json${C} / ${C}pom.xml${C} + dependencyManagement / ${C}poetry.lock${C}）+ 私有代理仓库（Nexus/Artifactory）做**唯一入口**，禁止直接连公网源
- 关注「**传递依赖**」与「**下载量极低但权限很高**」的包
- 警惕**域名相似/拼写错误（typosquatting）**攻击：${C}crossenv${C} vs ${C}cross-env${C}

**④ 构建与制品完整性（SLSA 视角）**

| SLSA 等级 | 关键要求 |
|---|---|
| L1 | 构建过程有文档、可脚本化 |
| L2 | 使用托管 CI，构建服务签名生成来源信息 |
| L3 | 构建环境加固、来源信息不可伪造 |

落地抓手：制品（镜像/包）**签名**（Cosign / Sigstore），部署前**验签**；CI 凭证用**短期 OIDC 令牌**而不是长期静态密钥；构建产物与 SBOM 一起归档、可追溯。

## 三、把安全门禁放进 CI（否则规则永远不会被遵守）

${F}yaml
# GitHub Actions 片段：最小可用的安全门禁
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1) 依赖漏洞扫描（高危即失败）
      - name: SCA
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: HIGH,CRITICAL
          exit-code: '1'

      # 2) 密钥泄露扫描（历史上提交过的密钥也要查）
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2

      # 3) 生成并归档 SBOM
      - name: SBOM
        run: mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom
      - uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: target/bom.json

      # 4) 制品签名（需 OIDC 身份，无需长期密钥）
      - name: Sign image
        run: cosign sign --yes ghcr.io/org/app@\${{ steps.build.outputs.digest }}
${F}

**注意门禁的分级**：**High/Critical 阻断合并，Medium 只告警**——否则会因为噪声太多被人整体绕过（这是安全门禁最常见的死法）。

**密钥泄露扫描要扫历史**：git 历史里的密钥即使删了文件也还在，必须用 gitleaks/trufflehog 扫全历史，并**把扫出的密钥全部轮换**（不是删代码就完事）。

## ⚠ 常见误区

1. **「我们依赖都是大厂包，没问题」**——Log4j 就是「大厂包」，且**传递依赖**才是主要风险面。
2. **只扫直接依赖**——绝大多数 CVE 来自第三、四层传递依赖。
3. **扫描出 500 个 Medium 没人处理**——有效做法是「先处理可被外部利用的 + 有公开 EXP 的」，并写明 SLA。
4. **把 SBOM 生成一次就完事**——必须**每次发版归档**，才能与线上版本对应。
5. **CI 里用长期 AK/SK**——一旦 CI 配置泄露，攻击者可以直接推代码。**改用 OIDC 短期凭证。**

## ✅ 自检清单

- [ ] 团队有成文的「安全编码规范」，且覆盖语言级高危 API 黑名单
- [ ] CI 中有 SCA（高危阻断）、密钥扫描、SBOM 生成三步
- [ ] 每次发版归档 SBOM，能按组件名/版本反查受影响系统
- [ ] 依赖来源统一走私有代理仓库，版本已锁定
- [ ] 容器/制品签名并验签，部署前校验
- [ ] CI 使用短期凭证，无长期静态密钥
- [ ] 有漏洞响应 SLA（如 Critical 24h / High 72h）与责任人

## 📚 延伸阅读

- OWASP Cheat Sheet Series：[cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/)
- SLSA 框架：[slsa.dev](https://slsa.dev/)
- CycloneDX 规范：[cyclonedx.org](https://cyclonedx.org/)
`
          },
          // __MORE_MID__
        ]
      },
      /* ============================ 高级 ============================ */
      {
        id: "adv",
        name: "高级",
        desc: "能建安全体系：以 SDL 与威胁建模把安全左移，用 WAF 与风控承担纵深防御，具备应急响应与取证能力，并把等保/数安法/PIPL 的合规要求落成工程动作。",
        chapters: [
          {
            id: "security-adv-1",
            title: "安全开发生命周期（SDL）与威胁建模",
            minutes: 26,
            updated: "2026-09-16",
            applies: "研发流程 / 架构设计",
            tags: ["SDL", "威胁建模", "STRIDE"],
            terms: ["SDL", "威胁建模", "STRIDE", "SAMM"],
            body: `
> **官方文档基线**：[Microsoft SDL](https://www.microsoft.com/en-us/securityengineering/sdl)(已开源为社区实践) · [OWASP SAMM](https://owasp.org/www-project-samm/) · OWASP ASVS 4.0 · [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) · NIST SSDF（SP 800-218）

## 一、SDL 的本质：把「安全的时点」前移

一个漏洞的修复成本随阶段急剧升高：**设计阶段改一句话 ≈ 上线后打补丁 + 数据修复 + 公关**。SDL 就是一套「在每个阶段插入一个安全动作」的流程。

| 阶段 | 安全动作 | 产出物 |
|---|---|---|
| 需求 | 安全需求（对齐 ASVS L1/L2）、合规要求 | 安全需求清单 |
| 设计 | **威胁建模**、架构评审 | 数据流图 + 威胁清单 + 缓解措施 |
| 实现 | 安全编码规范、静态扫描（SAST）、IDE 插件 | 扫描报告、评审记录 |
| 验证 | DAST、SCA、渗透测试 | 测试报告、门禁通过记录 |
| 发布 | 制品签名、上线前检查单 | 发布审计 |
| 响应 | 漏洞管理、应急响应 | 事件记录、复盘改进 |

**判断 SDL 是否真的落地，看一个信号**：**没有通过安全门禁的代码能不能合并？** 如果不能，SDL 是真的；如果能（理由是「先上线，回头再修」），SDL 就是纸面的。

## 二、威胁建模：四问 + STRIDE

**四问**（微软经典）：
1. 我们在构建什么？（画数据流图）
2. 什么可能出错？（用 STRIDE 逐元素提问）
3. 我们要怎么应对？（缓解/转移/接受/消除）
4. 我们做得够好吗？（回看威胁清单与验证项）

**STRIDE 六类威胁，与安全属性的对应**：

| 字母 | 威胁 | 破坏的属性 | 典型例子 |
|---|---|---|---|
| **S** | Spoofing 假冒 | 认证 | 伪造 token、冒充服务 |
| **T** | Tampering 篡改 | 完整性 | 改请求参数、改数据库 |
| **R** | Repudiation 抵赖 | 不可否认性 | 没记日志，操作不认账 |
| **I** | Information Disclosure 信息泄露 | 机密性 | 越权读、报错泄露栈 |
| **D** | Denial of Service 拒绝服务 | 可用性 | 打满连接、慢查询 |
| **E** | Elevation of Privilege 权限提升 | 授权 | 普通用户变管理员 |

**提问是按「元素类型」来的**，这是威胁建模比「头脑风暴」有效的关键：

| DFD 元素 | 主要威胁 |
|---|---|
| 外部实体 | S（假冒用户/服务） |
| 进程 | S / T / R / I / D / E（全部适用） |
| 数据存储 | T / R / I / D（未授权读写、篡改） |
| 数据流 | T / I / D（窃听、篡改、洪泛） |
| 信任边界 | 所有跨界流量都要问一遍 |

## 三、实战：给「登录系统」做一次威胁建模

**① 画 DFD（文字版）**

${F}text
[用户浏览器] --(1 凭据 HTTPS)--> [信任边界] --> [认证服务] --(2 查询)--> [(用户库)]
                                                     |
                                              (3 签发 token)
                                                     v
                                            [会话/Token 存储]
[用户浏览器] --(4 携带 token)--> [资源服务] --(5 校验)--> [Token 校验]
${F}

**② 用 STRIDE 逐条提问并给出缓解**

| # | 威胁（STRIDE） | 场景 | 缓解措施 | 验证方式 |
|---|---|---|---|---|
| S | 假冒 | 撞库登录他人账号 | 限流 + 泄露口令检测 + MFA | 自动化：暴力测试应被拦截 |
| S | 假冒 | 伪造 JWT | 固定算法 + 校验签名/exp/aud | 单测：篡改 payload 应失败 |
| T | 篡改 | 改请求里的 userId | 服务端从会话取身份，**不信客户端传的 id** | 越权用例 |
| I | 信息泄露 | 登录报错区分「用户不存在/口令错误」 | 统一提示与响应时间 | 探针检查 |
| I | 信息泄露 | **token 写进 URL / 日志** | 仅放 Authorization 头，日志脱敏 | 日志审计 |
| R | 抵赖 | 管理操作无日志 | 全量审计 + 时间同步 | 抽查日志完整性 |
| D | 拒绝服务 | 无限次尝试打满 CPU（bcrypt 很贵） | 前置限流 + 验证码 + 缓存校验结果 | 压测 |
| E | 权限提升 | 普通用户调管理接口 | 统一授权 + 接口权限登记 | 越权用例 |

**③ 输出物**：这张表就是**安全需求**，直接写进研发任务；同时每条缓解措施都对应一条验证方式，可以自动化。

**这一步投入通常只要 2 小时，但能提前消灭掉后续 80% 的高危漏洞。**

## 四、度量与持续改进：OWASP SAMM

SDL 容易被做成「一次性运动」，SAMM 提供了可度量的框架：把安全能力分成 5 个业务功能（治理、设计、实现、验证、运营），每个功能分 3 个成熟度等级。

**实践做法**：先做一次 SAMM 自评（哪些完全没做、哪些做了但没制度化），选 2–3 个当前最痛的点立项，**每个季度提升一档**。比一次性推行全套流程现实得多。

## 五、把 SDL 变成「不增加太多负担」的工程动作

| 阻力 | 化解方式 |
|---|---|
| 研发嫌安全评审拖慢发版 | 把评审**并入已有的设计评审/技术方案评审**，不新增会议 |
| 安全规则太多没人看 | 门禁分级（高危阻断、中危告警）；把高频问题做成 **IDE 插件实时提示** |
| 扫描报告没人修 | 每周固定的「安全债清理日」（如周五下午 1 小时），纳入迭代容量 |
| 安全只有一个人懂 | **安全冠军（Security Champion）** 机制：每个研发小组指定一人做对接人 |

## ⚠ 常见误区

1. **把 SDL 做成「上线前统一渗透测试」**——那时已经很晚了，成本最高。
2. **威胁建模只做一次**——架构变更/新功能上线必须重做增量部分。
3. **威胁清单没有「验证方式」**——无法证明缓解措施真的生效，等于纸面工作。
4. **门禁全量阻断**——噪声过多导致团队集体绕过，反而更不安全。
5. **只关注技术漏洞，不管「不安全设计」（A04）**——设计级缺陷（可枚举的券码、无频控的转账）扫描器永远查不出来。

## ✅ 自检清单

- [ ] 需求阶段有安全需求条款（对齐 ASVS 条目）
- [ ] 新功能/架构变更都有威胁建模记录（DFD + STRIDE + 缓解 + 验证）
- [ ] CI 中有 SAST + SCA + 密钥扫描，且门禁分级合理
- [ ] 上线前检查单包含安全项，且有制品签名验证
- [ ] 有安全冠军机制，研发侧有明确的安全对接人
- [ ] 有安全度量指标（高危漏洞平均修复时长、门禁拦截率、重复问题率）
- [ ] 每季度做一次 SAMM 自评并立项改进

## 📚 延伸阅读

- OWASP SAMM：[owasp.org/www-project-samm](https://owasp.org/www-project-samm/)
- OWASP Threat Dragon：[owasp.org/www-project-threat-dragon](https://owasp.org/www-project-threat-dragon/)
- NIST SSDF（SP 800-218）：[csrc.nist.gov/pubs/sp/800/218/final](https://csrc.nist.gov/pubs/sp/800/218/final)
`
          },
          {
            id: "security-adv-2",
            title: "WAF 与风控体系",
            minutes: 22,
            updated: "2026-09-16",
            applies: "Web 防护 / 反欺诈",
            tags: ["WAF", "风控", "对抗"],
            terms: ["WAF", "ModSecurity", "设备指纹", "风控策略"],
            body: `
> **官方文档基线**：[OWASP ModSecurity Core Rule Set（CRS）](https://coreruleset.org/docs/) · [OWASP Automated Threats to Web Applications](https://owasp.org/www-project-automated-threats-to-web-applications/)（OAT-* 分类） · [Nginx ModSecurity 模块文档](https://github.com/SpiderLabs/ModSecurity-nginx)

## 一、WAF 能做什么、不能做什么

**能**：拦已知 Payload 模式、拦住低成本的自动化扫描与批量攻击、对 0day 提供「临时虚拟补丁」的窗口期。
**不能**：替代安全编码；拦不住越权与业务逻辑漏洞（因为这类请求「语法完全合法」）。

**这个边界必须写进预期管理**：如果团队以为「有 WAF 就不用修 SQL 注入了」，那 WAF 就成了负债。

## 二、WAF 的形态与技术路线

| 形态 | 说明 | 取舍 |
|---|---|---|
| 云 WAF | 托管在 CDN 边缘（如云厂商 WAF） | 部署快、有全球清洗能力；但**回源流量要正确还原真实 IP**，且配置盲区多 |
| 反向代理 WAF | 自建（Nginx + ModSecurity + CRS） | 可控、可自定义规则；运维成本高 |
| 主机/应用内 WAF | RASP / 语言级 | 能拿到上下文（更准）；性能与稳定性风险更高 |

**检测技术**：
- **规则/签名**：正则匹配（CRS 就是代表），可解释但易被编码绕过
- **语义分析**：解析 SQL/HTML 语法结构后判断，误报/绕过都更少
- **机器学习**：基于历史流量建模异常，适合对抗变种，但可解释性差、需持续调优

## 三、ModSecurity + CRS 落地要点

${F}nginx
# nginx.conf —— 最小可用接入
http {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;

    server {
        listen 443 ssl;
        # 用 SecRuleEngine DetectionOnly 先跑两周观察，再切 On
        modsecurity_rules '
            SecRuleEngine DetectionOnly
            SecRequestBodyAccess On
            SecResponseBodyAccess Off
        ';
    }
}
${F}

${F}bash
# CRS 推荐参数（4.x 系列改用 CRS 变量，不再直接改规则文件）
SecAction "id:900110,phase:1,pass,t:none,\\
  setvar:tx.inbound_anomaly_score_threshold=5,\\
  setvar:tx.outbound_anomaly_score_threshold=4,\\
  setvar:tx.paranoia_level=1"
${F}

**上线四步法（避免上线即误杀）**：
1. **DetectionOnly 观察**：只记录不阻断，跑 1–2 周覆盖完整业务周期（含月末、大促）
2. **分析告警**：剔除明显误报，把业务必需的「长得像攻击」的请求加**精确白名单**（按 URI + 参数 + 值，不要按 IP 全放）
3. **切换阻断 + PL1**（偏执等级 1），监控拦截量与业务错误率
4. **定期回顾**：新增业务功能后必须重新观察，**规则集要跟着业务升级**

**Paranoia Level（PL）** 是 CRS 的核心旋钮：PL1 误报低、覆盖常见攻击；PL4 严密但误报高，一般只在关键接口（登录、支付）局部使用。

## 四、风控：从「规则」到「策略体系」

风控 ≠ WAF。WAF 拦的是「非法请求」，风控拦的是「合法但不该发生的业务行为」——**自动化薅羊毛、撞库登录、刷单、批量注册、爬虫、垃圾内容**。

**OWASP Automated Threats（OAT）分类**是很好的对标清单，例如：

| 编号 | 威胁 | 典型场景 |
|---|---|---|
| OAT-004 | 指纹识别 | 探测账号是否存在 |
| OAT-007 | 凭据填充（撞库） | 用泄露库批量登录 |
| OAT-008 | 凭据破解 | 单账号暴破 |
| OAT-011 | 刷单/滥用优惠 | 批量领券、秒杀套利 |
| OAT-012 | 爬取 | 批量抓取商品/题库 |
| OAT-020 | 账号聚合 | 批量注册养号 |

**风控体系四层结构**：

${F}text
① 数据层：埋点采集（设备指纹、IP、行为序列、账号历史、交易特征）
② 特征层：把原始数据加工成特征（1 分钟登录次数、同设备关联账号数、请求间隔方差）
③ 决策层：规则 + 模型（名单 → 规则 → 模型评分 → 组合决策）
④ 处置层：放行 / 二次验证（验证码、短信、人脸）/ 限流降级 / 拦截 / 封禁
${F}

**设备指纹与行为特征**是关键：黑产可以用代理池换 IP，但**换设备成本高**。常用特征包括 Canvas/WebGL 指纹、TLS 指纹（JA3）、字体与屏幕参数、鼠标轨迹与按键节奏、请求间隔的规律性（脚本的间隔往往过于规整）。

**处置策略要与「对抗强度」匹配**，避免一刀切：

| 风险等级 | 处置 |
|---|---|
| 低 | 放行 + 记录 |
| 中 | 加验证码 / 短信二次验证（提高攻击成本） |
| 高 | 限流 + 降级（如只能看不能领） |
| 极高 | 直接拦截 + 加入名单 |

**名单体系**：黑名单（拦截）、白名单（放行，需严格审批）、灰名单（加强校验）。**名单要有有效期与复审机制**，否则半年后全是「历史误伤」。

## 五、对抗升级的常态化运营

风控是**持续对抗**，不是一次性项目。需要固定节奏的动作：
- 每周看误杀率与漏杀案例（业务反馈是关键输入）
- 每月复盘一次新出现的攻击模式，转为规则
- 大促/活动前做压力与策略预演（提前准备好临时策略）
- 关键策略变更必须**灰度 + 可一键回滚**（风控策略打挂业务是最惨的事故之一）

## ⚠ 常见误区

1. **「有 WAF 就安全了」**——越权、逻辑漏洞、0day 语义变种都拦不住。
2. **一开始就 PL4 全站阻断**——误杀正常业务，最后被业务方要求「关掉 WAF」。
3. **只按 IP 做风控**——代理池轻易绕过；要叠加设备指纹与账号维度。
4. **风控规则没人维护**——活动规则变了、页面改版了，特征失效却没人更新，形同虚设。
5. **只看拦截量当业绩**——高拦截可能意味着高误杀，要用「误杀率 + 漏杀案例」双向度量。

## ✅ 自检清单

- [ ] WAF 上线经过 DetectionOnly 观察期，且有精确白名单（非按 IP 全放）
- [ ] 回源已正确还原真实客户端 IP（否则风控与限流全部失效）
- [ ] 覆盖 OAT 中的撞库、爬取、薅羊毛等核心威胁场景
- [ ] 有设备指纹/行为特征，风控判定不依赖单一 IP 维度
- [ ] 处置分层（放行/验证/限流/拦截），不是一刀切
- [ ] 名单有有效期与复审机制
- [ ] 策略变更可灰度、可回滚，且有大促前预演

## 📚 延伸阅读

- OWASP CRS 文档：[coreruleset.org/docs](https://coreruleset.org/docs/)
- OWASP Automated Threats：[owasp.org/www-project-automated-threats-to-web-applications](https://owasp.org/www-project-automated-threats-to-web-applications/)
`
          },
          {
            id: "security-adv-3",
            title: "应急响应与取证（NIST SP 800-61）",
            minutes: 26,
            updated: "2026-09-16",
            applies: "安全运营 / 事件处置",
            tags: ["应急", "取证", "事件响应"],
            terms: ["应急响应", "遏制", "取证", "证据链"],
            body: `
> **官方文档基线**：NIST SP 800-61r2（计算机安全事件处理指南）· [NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final)（取证技术指南）· MITRE ATT&CK · FIRST 事件响应框架 · 等保 2.0「安全运维管理—应急预案与处置」

## 一、生命周期：四阶段，但「准备」决定一切

| 阶段 | 关键动作 | 常见失败点 |
|---|---|---|
| ① 准备 | 预案、通讯录、工具包、权限预授权 | 出事时找不到人/没权限做快照 |
| ② 检测与分析 | 确认是否事件、定级、界定范围 | 误判为「网络抖动」拖了两天 |
| ③ 遏制 / 根除 / 恢复 | 隔离、清理、修复、回归 | 一上来就格式化，证据全丢 |
| ④ 事后活动 | 复盘、改进、更新预案 | 只写报告不落地改进 |

**「准备」阶段必须预置的东西**（出事后现准备必然来不及）：
- **应急通讯录与升级路径**（含法务、公关、客户通知口径）
- **预授权**：谁有权下架服务、切断网络、封禁账号（避免出事时还在开会审批）
- **证据保全工具与存储**：镜像工具、独立证据盘、哈希校验工具
- **日志留存**：至少 6 个月（等保要求）且异地/云端留存
- **演练记录**：每年至少一次桌面推演 + 一次实操演练

## 二、检测与分析：先回答三个问题

1. **是不是安全事件？**（区分故障与攻击）
2. **影响范围多大？**（哪些系统、多少数据、是否有客户影响）
3. **攻击者还在不在？**（是否仍有活跃会话/持久化）

**分级与响应时限**（示例，需按组织定义）：

| 级别 | 判定 | 响应要求 |
|---|---|---|
| P0 | 核心业务中断 / 大规模数据泄露 / 勒索 | 立即启动，全员到岗，1 小时内上报 |
| P1 | 单系统被控 / 部分数据泄露 | 4 小时内响应 |
| P2 | 探测扫描 / 单账号被控 | 24 小时内处理 |
| P3 | 无害告警 | 常规工单 |

**取证原则：易失性顺序（Order of Volatility）**——先取最容易消失的：

${F}text
CPU 寄存器 / 缓存  >  内存  >  网络连接与路由表  >  运行中进程与打开文件  >  磁盘  >  备份/归档介质  >  打印件
${F}

所以**第一动作永远不是关机，而是内存与网络状态保全**：

${F}bash
# 内存镜像（Linux，需预装 LiME 或使用 /proc/kcore 的替代方案）
# 实践中更实用的是「先保全关键运行时状态」：
date -u > evidence_time.txt                 # 先固定时间基准（时间同步很重要）
ps -efww > ev_ps.txt
ss -antp > ev_netstat.txt
lsof -nP > ev_lsof.txt
netstat -rn > ev_route.txt
cat /proc/*/cmdline 2>/dev/null | tr '\\0' ' ' > ev_cmdline.txt
last -a > ev_last.txt; lastb -a > ev_lastb.txt
# 然后做磁盘镜像（用 dd 或 ddrescue，并计算哈希）
dd if=/dev/sda of=/evidence/disk.img bs=4M conv=noerror,sync
sha256sum /evidence/disk.img > /evidence/disk.img.sha256
${F}

**证据链（Chain of Custody）**：每一次证据的转移都要记录「谁、什么时候、为什么、做了什么」，并计算哈希防篡改。**没有证据链的电子证据在法律上可能不被采信。**

## 三、遏制策略：在「止损」和「钓鱼」之间取舍

| 策略 | 优点 | 风险 |
|---|---|---|
| 立即断网/关机 | 最快止损 | 攻击者会失去踪迹（丢失溯源线索）、可能触发自毁逻辑 |
| 隔离但保持运行（VLAN 隔离 / 只放行取证通道） | 可观察、可溯源 | 攻击者可能继续破坏 |
| 只清指定 IOC（精准清除） | 业务影响最小 | 容易留下未发现的持久化后门 |

**建议流程**：先**隔离**（保留运行以便观察）→ 观察攻击者行为、摸清全部落脚点 → 一次性清除 → 补漏洞 → 恢复 → 全程监控再入侵。

**「只清除发现的部分就恢复上线」是最常见的二次被入侵原因。**

## 四、根除与恢复的检查单

恢复上线前必须确认：
- 入口漏洞已修复（不是临时封 IP，而是真正修代码/改配置/升版本）
- 所有持久化位置已清理（账号、SSH 公钥、cron、服务、启动项、ld.so.preload）
- 用**干净镜像**重建，而不是「在受害系统上杀毒」
- 全量口令/密钥轮换（攻击者可能已获取凭据）
- 加固与监控加强（新增检测规则覆盖本次攻击手法）
- 确认无残留外联后再放开网络

${F}bash
# 恢复前最后一次核查（关键几条）
grep -r "" /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys 2>/dev/null
crontab -l; ls -la /etc/cron.*/ /var/spool/cron/* 2>/dev/null
ls -la /etc/ld.so.preload 2>/dev/null && cat /etc/ld.so.preload
ss -antp | grep ESTAB | grep -v ':443\\|:80'
find / -xdev -newermt '<事件时间>' -type f 2>/dev/null | grep -vE '^/(proc|sys|dev)'
${F}

## 五、事后复盘：写「改进项」，不写「责任人」

复盘报告结构：**时间线（含每次判断依据）→ 根因（技术根因 + 流程根因）→ 影响（数据量/客户/时长）→ 做对的地方 → 改进项（负责人 + 截止日期）**。

**避免两种错误复盘**：① 只写「某同事疏忽」（个人归因无法防止复发，要问「为什么流程允许这个疏忽发生」）；② 只写结论不列改进项（下次一定重演）。

**勒索软件专项要点**：**不要支付赎金**（不保证解密、且资助犯罪）；优先从离线备份恢复；确认备份未被同时加密；评估是否需要通知监管与客户（数据泄露有法定报告时限）。

## ⚠ 常见误区

1. **先关机再取证**——内存证据（无文件后门、活跃会话）永久丢失。
2. **在受害机器上分析、在同一台机器上保存证据**——证据被污染，且攻击者可能清理。
3. **急着恢复业务，跳过根因修复**——三天后二次入侵。
4. **不通知法务/合规**——涉及个人信息泄露有报告时限要求（如 PIPL、GDPR 72 小时）。
5. **复盘只发邮件了事**——改进项无人跟踪，等于没做。

## ✅ 自检清单

- [ ] 有书面应急预案，含通讯录、升级路径、预授权清单
- [ ] 有证据保全工具包与独立证据存储，并演练过
- [ ] 日志留存 ≥ 6 个月且异地存储
- [ ] 事件分级标准与响应时限已定义并被团队知晓
- [ ] 有「隔离优先、保存证据」的处置纪律（禁止直接关机/格式化）
- [ ] 恢复前有清理核查清单，并全量轮换凭据
- [ ] 每年至少一次演练，复盘改进项有负责人与截止日期

## 📚 延伸阅读

- NIST SP 800-61r2：[csrc.nist.gov/pubs/sp/800/61/r2/final](https://csrc.nist.gov/pubs/sp/800/61/r2/final)
- NIST SP 800-86（取证）：[csrc.nist.gov/pubs/sp/800/86/final](https://csrc.nist.gov/pubs/sp/800/86/final)
- MITRE ATT&CK：[attack.mitre.org](https://attack.mitre.org/)
`
          },
          {
            id: "security-adv-4",
            title: "云原生与容器安全（4C 模型）",
            minutes: 24,
            updated: "2026-09-16",
            applies: "Kubernetes / 容器平台",
            tags: ["云原生", "容器", "K8s"],
            terms: ["4C 模型", "Pod Security", "RBAC", "供应链"],
            body: `
> **官方文档基线**：[Kubernetes 官方文档 — Security](https://kubernetes.io/docs/concepts/security/) · [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) · [NSA/CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF) · [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes) · [NIST SP 800-190](https://csrc.nist.gov/pubs/sp/800/190/final)（容器安全指南）

## 一、4C 模型：从内到外，每层都要设防

${F}text
Code（应用代码）      ← 自己的代码与依赖（见「供应链安全」）
  Container（容器/镜像）← 镜像内容、运行时权限
    Cluster（集群）    ← K8s API、RBAC、网络策略、Secret
      Cloud（云/基础设施）← 网络、IAM、审计、主机加固
${F}

**关键认知**：内层安全不能靠外层兜底，但**外层一旦失守，内层全部暴露**。K8s 被拿 API 权限 = 所有业务 Pod 被接管。

## 二、Container 层：镜像与运行时

**镜像加固检查单**：

| 项 | 做法 |
|---|---|
| 基础镜像 | 用 distroless / alpine / 精简镜像，**不要用 latest**，固定 digest |
| 非 root 运行 | Dockerfile 里 ${C}USER 10001${C}，或用 ${C}runAsNonRoot: true${C} |
| 只读根文件系统 | ${C}readOnlyRootFilesystem: true${C}（需要写的目录挂 emptyDir） |
| 不装多余工具 | 不装 curl/wget/nc（攻击者最爱的下载器）；需要时用临时调试容器 |
| 不塞密钥 | 密钥用 Secret/外部注入，**绝不 COPY 进镜像层** |
| 扫描与签名 | 构建时 Trivy/Grype 扫描，签名用 Cosign，准入时验签 |

${F}dockerfile
# ✅ 安全基线 Dockerfile 片段
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S -G app -u 10001 app
WORKDIR /app
COPY --from=build --chown=app:app /build/app.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
${F}

**运行时限制**（在 Pod 里把「不需要的能力」全部关掉）：

${F}yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false        # 禁止提权（挡 setuid）
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]                        # 丢掉所有 Linux capabilities
    # 只在确实需要时 add: ["NET_BIND_SERVICE"]
seccompProfile:
  type: RuntimeDefault                   # 限制可用的系统调用
${F}

**加一条硬纪律**：**禁止 ${C}privileged: true${C}、禁止挂载 ${C}docker.sock${C}、禁止 ${C}mountPropagation: Bidirectional${C}**——这三个是「容器逃逸」的经典通道。

## 三、Cluster 层：K8s 的四道闸门

**① 认证与 RBAC（最小权限）**

${F}bash
# 检查是否存在过宽权限（最危险的是 cluster-admin 被滥用）
kubectl get clusterrolebindings -o json | \\
  jq -r '.items[] | select(.roleRef.name=="cluster-admin") | .metadata.name'
kubectl auth can-i --list --as=system:serviceaccount:default:default   # 默认 SA 权限
# 禁止 default SA 自动挂载 token
# 在 ServiceAccount 上设 automountServiceAccountToken: false
${F}

**② Pod Security Admission（PSA）——替代已废弃的 PSP**

${F}yaml
# 给命名空间打标签，强制 baseline（生产建议 restricted）
apiVersion: v1
kind: Namespace
metadata:
  name: prod
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
${F}

${C}restricted${C} 档位会强制：非 root、禁提权、丢 capabilities、必须设 seccomp、只读根文件系统等——**这是最低成本的集群加固动作**。

**③ 网络策略（默认拒绝）**

${F}yaml
# 先全拒绝，再按需放行（K8s 默认是「全通」，这是最大的认知陷阱）
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: prod }
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]
---
# 再为 app 放行：只允许来自网关的 8080，且只允许出到数据库
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-app, namespace: prod }
spec:
  podSelector: { matchLabels: { app: web } }
  policyTypes: ["Ingress","Egress"]
  ingress:
    - from: [{ podSelector: { matchLabels: { app: gateway } } }]
      ports: [{ port: 8080 }]
  egress:
    - to: [{ podSelector: { matchLabels: { app: db } } }]
      ports: [{ port: 5432 }]
${F}

**没有 NetworkPolicy 的 K8s 集群 = 平的二层网络**，任何一个 Pod 被拿下就能直接扫内网。

**④ Secret 与 etcd**

- Secret 默认只是 base64（**不是加密**），任何能读 Secret 的人都能解码
- 开 **etcd 静态加密**（EncryptionConfiguration），保护 etcd 备份与磁盘
- 生产建议用 **External Secrets Operator / Vault / 云 KMS** 把密钥从 K8s 里剥离
- **审计日志**（Audit Policy）必须开：至少记录 ${C}pods/exec${C}、${C}secrets${C} 的读写、RBAC 变更——${C}kubectl exec${C} 是入侵后最常用的动作

## 四、准入控制：把规则挡在「创建之前」

${F}text
API 请求 → 认证 → 授权(RBAC) → 准入控制(Admission) → etcd
                                   ↑
              MutatingWebhook（默认值注入）
              ValidatingWebhook（策略校验：OPA Gatekeeper / Kyverno）
${F}

**用 Kyverno 表达「禁止特权容器 + 必须来自可信仓库」**：

${F}yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: pod-security }
spec:
  validationFailureAction: Enforce
  rules:
    - name: disallow-privileged
      match: { any: [{ resources: { kinds: ["Pod"] } }] }
      validate:
        message: "禁止 privileged 容器"
        pattern:
          spec: { containers: [{ securityContext: { privileged: "false" } }] }
    - name: allowed-registry
      match: { any: [{ resources: { kinds: ["Pod"] } }] }
      validate:
        message: "镜像必须来自可信仓库"
        pattern:
          spec: { containers: [{ image: "registry.example.com/*" }] }
${F}

## 五、云（Cloud）层与运行时检测

- **云 IAM 最小权限**：Node 的角色不要给 ${C}*${C}；用 **IRSA/Workload Identity** 给 Pod 细粒度云权限，而不是给节点一个大权限角色
- **元数据服务**：启用 IMDSv2；对不需要访问元数据的 Pod 用 NetworkPolicy 拦截 ${C}169.254.169.254${C}
- **审计与告警**：云审计（CloudTrail/操作审计）+ K8s 审计 + 镜像仓库审计，三处都要能关联
- **运行时安全**：Falco 检测「容器内起 shell、读 /etc/shadow、异常外联、写入敏感目录」；配合 eBPF（如 Tetragon）做进程级策略

## ⚠ 常见误区

1. **「容器是隔离沙箱」**——容器共享内核，内核漏洞/特权容器/挂载 docker.sock 都能逃逸。
2. **Secret 是加密的**——base64 编码而已。
3. **K8s 网络默认是通的却以为不通**——必须显式加 NetworkPolicy。
4. **用最新的镜像 tag（如 :latest）**——不可重现，也无法回滚到确定版本；**用 digest**。
5. **只在构建时扫描镜像**——运行时还会出现新的 CVE，需要周期性重扫已部署镜像。

## ✅ 自检清单

- [ ] 镜像非 root、只读根文件系统、drop ALL capabilities、无 privileged
- [ ] 镜像固定 digest，构建时扫描 + 签名，部署前验签
- [ ] 命名空间启用 PSA（restricted），并有 Kyverno/Gatekeeper 准入策略
- [ ] 有 default-deny 的 NetworkPolicy，并按需最小放行
- [ ] RBAC 无滥用 cluster-admin；default SA 不自动挂载 token
- [ ] etcd 静态加密开启，Secret 来自外部密钥管理
- [ ] K8s 审计日志开启（覆盖 exec / secrets / RBAC 变更）
- [ ] 有运行时检测（Falco 等）与云 IAM 最小权限（Workload Identity）
- [ ] 镜像仓库定期重扫，有 CVE 修复流程

## 📚 延伸阅读

- Kubernetes Security 概念：[kubernetes.io/docs/concepts/security](https://kubernetes.io/docs/concepts/security/)
- Pod Security Standards：[kubernetes.io/docs/concepts/security/pod-security-standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- NIST SP 800-190：[csrc.nist.gov/pubs/sp/800/190/final](https://csrc.nist.gov/pubs/sp/800/190/final)
`
          },
          {
            id: "security-adv-5",
            title: "合规与数据安全治理（等保 2.0 / 数安法 / PIPL）",
            minutes: 24,
            updated: "2026-09-16",
            applies: "企业合规 / 数据治理",
            tags: ["合规", "数据治理", "等保"],
            terms: ["等保2.0", "数据分类分级", "个人信息保护", "数据出境"],
            body: `
> **官方文档基线**：GB/T 22239-2019（网络安全等级保护基本要求，即「等保 2.0」）· GB/T 35273（个人信息安全规范）· 《中华人民共和国网络安全法》《数据安全法》《个人信息保护法》 · [GDPR 官方文本](https://gdpr-info.eu/)（做跨境业务时对照） · ISO/IEC 27001 / 27701

## 一、三套体系各自管什么

| 体系 | 关注对象 | 核心要求 | 谁要遵守 |
|---|---|---|---|
| **等保 2.0** | 信息系统整体安全 | 定级-备案-建设整改-测评-监督检查 | 国内网络运营者（尤其关基、政务、金融、医疗） |
| **《数据安全法》** | **数据处理活动**（含重要数据） | 分类分级、重要数据目录、数据出境安全评估 | 所有数据处理者 |
| **《个人信息保护法》** | **个人信息** | 告知同意、最小必要、单独同意、影响评估、个人权利响应 | 处理个人信息的所有组织 |

**一句话区分**：等保管「系统」，数安法管「数据」，PIPL 管「人」。

## 二、等保 2.0：五个动作与「一个中心、三重防护」

**流程五步**：定级 → 备案 → 建设整改 → 等级测评 → 监督检查。二级两年一测、三级一年一测（实践中更严）。

**技术架构的核心思想是「一个中心，三重防护」**：

${F}text
              安全管理中心（集中管控：系统管理、审计管理、安全管理）
                              │
    ┌─────────────┬───────────┴──────────┬─────────────┐
  安全计算环境    安全区域边界          安全通信网络      安全管理（制度/机构/人员/建设/运维）
  （主机/应用/    （边界防护/访问控制     （网络架构/通信
    数据安全）     /入侵防范/恶意代码）     传输/可信接入）
${F}

**等保 2.0 相比 1.0 的三个重要扩展**：① 把**云计算、移动互联、物联网、工控**纳入（云等保成为独立章节）；② 强化**个人信息保护**要求；③ 强调**安全运维管理**（变更、备份、应急预案与演练）。

**工程落地视角**：等保的绝大部分条款对应的是**我们已经讲过的具体动作**——身份鉴别（MFA）、访问控制（授权设计）、安全审计（审计日志）、入侵防范（WAF/加固）、数据完整性（签名/哈希）、备份恢复（异地备份+演练）。**合规不是额外工作，而是「把已有安全动作留下证据」。**

**最容易失分的地方是「有措施但没证据」**：必须有制度文件、配置截图、日志样本、测评记录可查。

## 三、数据安全治理：从「数据地图」开始

**第 1 步：数据资产梳理与分类分级**

| 级别 | 判定 | 保护要求（示例） |
|---|---|---|
| L1 公开 | 可对外公开 | 完整性保护 |
| L2 内部 | 泄露影响有限 | 访问控制 + 审计 |
| L3 敏感 | 个人信息、业务敏感 | 加密存储 + 最小授权 + 脱敏 + 水印 |
| L4 重要 | 重要数据 / 关基数据 | 强加密 + 单独授权 + 全量审计 + 出境管控 |

**第 2 步：全生命周期管控（采集-传输-存储-使用-共享-销毁）**

${F}text
采集：最小必要 + 告知同意（敏感信息需【单独同意】，不得默认勾选）
传输：TLS 1.2+ / 国密；跨网传数据走加密通道
存储：分级加密（AES-GCM + KMS）；测试环境用脱敏数据，禁止直连生产
使用：最小授权 + 数据导出审批 + 动态脱敏 + 水印溯源
共享：第三方需签数据处理协议（DPA），明确用途与期限
销毁：可验证的删除（物理销毁/加密擦除），并留销毁记录
${F}

**第 3 步：个人信息保护的关键动作**

- **告知同意**：隐私政策必须「显著、易懂、可撤回」；敏感个人信息（生物识别、医疗、金融账户、行踪轨迹、14 岁以下儿童信息）需**单独同意**
- **最小必要**：只收集实现功能所必需的信息；拒绝非必要权限不得影响基本功能
- **个人权利响应（DSAR）**：提供查阅、复制、更正、删除、撤回同意的路径，并**在法定时限内响应**（一般为 15 个工作日）
- **个人信息保护影响评估（PIA）**：处理敏感信息、自动化决策、委托处理、向第三方提供、出境等场景**必须事前评估并留存记录 3 年**
- **泄露通知**：发生泄露须立即采取措施并**按规定通知监管部门与个人**

**第 4 步：数据出境**

三条合法路径任选其一：① 通过国家网信部门组织的**安全评估**；② 经专业机构**个人信息保护认证**；③ 签订标准合同并向省级网信部门**备案**。触发阈值与是否属「重要数据」需按现行规定逐项判断，**不确认就不要传**。

## 四、把合规做成「可运转的机制」而不是一次冲刺

| 机制 | 频率 | 产出 |
|---|---|---|
| 数据资产盘点与分级复核 | 半年 | 更新的数据地图与分级清单 |
| 权限与导出审计 | 月度 | 异常导出清单与整改 |
| PIA（新业务/新场景） | 触发式 | 影响评估报告 |
| 等保测评 | 按等级要求 | 测评报告与整改单 |
| 应急演练（含数据泄露场景） | 每年 | 演练记录与改进项 |
| 合规培训 | 每年 | 培训记录（等保要求留证） |

**技术抓手**：数据分类分级打标（元数据管理）、数据库审计（谁在何时导出了多少行）、DLP（防止敏感数据外发）、脱敏网关（对外接口自动脱敏）、密钥与审计日志分离管理。

## ⚠ 常见误区

1. **「等保过了就安全了」**——测评是基线检查，不代表能挡住真实攻击；**过级是起点不是终点**。
2. **只做制度文件、不落技术措施**——测评现场要验证技术配置，纸面材料过不了。
3. **把「匿名化」当「脱敏」**——去标识化后仍可能通过关联重识别，**匿名化标准极高**，别轻易声称已匿名。
4. **隐私政策默认勾选同意**——不符合「自愿、明确」要求。
5. **生产数据直接拷到测试环境**——这是数据泄露的高发路径，且明确违规。

## ✅ 自检清单

- [ ] 已完成数据资产盘点与分类分级，有数据地图与责任人
- [ ] 系统已完成定级备案，等保测评在有效期内，整改项已闭环
- [ ] 隐私政策可访问、可撤回；敏感信息取得单独同意
- [ ] 生产数据进测试环境必须脱敏，且有审批记录
- [ ] 数据导出有审批 + 审计 + 动态脱敏
- [ ] 涉敏感/出境/自动化决策场景已做 PIA 并留存
- [ ] 有个人信息权利响应流程（查阅/删除/更正）与时限承诺
- [ ] 数据出境路径已明确合法依据，未确认的不传
- [ ] 有泄露应急流程，包含监管报告与用户通知口径

## 📚 延伸阅读

- 等保 2.0 基本要求（GB/T 22239-2019）条文可在「全国标准信息公共服务平台」查询
- 《个人信息保护法》全文：[npc.gov.cn](http://www.npc.gov.cn/)（法律法规数据库）
- ISO/IEC 27001 / 27701（隐私信息管理体系）
`
          }
        ]
      }
    ]
  };

  window.SECURITY = SECURITY;
})();
