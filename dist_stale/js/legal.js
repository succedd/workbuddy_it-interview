/* =========================================================================
 *  js/legal.js — 隐私政策 / 用户协议（#/privacy、#/terms）
 *
 *  为什么单独拆一个文件：
 *   这两页是「文本型内容」，既要能被 SPA 路由渲染，也要能被
 *   tools/gen-legal-pages.js 读出来生成静态页 privacy.html / terms.html
 *   （爬虫不执行 JS，纯 SPA 页面在百度/必应眼里是空的）。
 *   因此正文一律以**纯数据结构**存放（不掺运行时变量），
 *   两端各自渲染，杜绝「网页上一套、静态页另一套」的口径漂移。
 *
 *  ⚠️ 内容维护原则：这里写的每一条都必须与代码实际行为一致。
 *     改后端存储字段、换 AI 服务商、调缓存时长后，同步改这里。
 *     依据：cloudflare/worker.js 接口表、cloudflare/schema.sql、cloudflare/部署指南.md。
 * ========================================================================= */
(function () {
  "use strict";

  const UPDATED = "2026-10-26";
  const CONTACT = "微信（见「关于本站」页）或 GitHub Issues：github.com/succedd/workbuddy_it-interview/issues";

  const DOCS = {
    /* ============================ 隐私政策 ============================ */
    privacy: {
      key: "privacy",
      route: "/privacy",
      file: "privacy.html",
      title: "隐私政策",
      updated: UPDATED,
      desc: "IT面试题库收集哪些信息、用于什么目的、保存多久，以及你如何导出或删除自己的数据。",
      intro: "本政策说明你使用 IT面试题库（itinterview.com.cn）时，我们收集哪些信息、为什么收集、保存多久，以及你如何查看、导出和删除这些数据。",
      sections: [
        {
          h: "一、一句话总结",
          p: ["不登录也能刷题：此时你的收藏、历史、错题只存在你这台设备的浏览器里，不会上传。",
              "登录只是为了让换设备时不丢数据。我们不会出售你的数据，也不会用它做广告投放。"],
        },
        {
          h: "二、我们收集哪些信息",
          p: ["按「你主动给的」和「使用过程中自动产生的」两类分开说："],
          ul: [
            "<b>账号信息</b>：邮箱、昵称（可选）、密码。密码经「加盐 + PBKDF2-SHA256 单向派生」后保存，服务端只存派生结果与随机盐，<b>不保存明文密码</b>，因此我们也无法找回，只能通过邮件重置。",
            "<b>学习数据</b>：收藏的题目、刷题历史（含浏览时间/次数）、错题本与复习进度、每日打卡记录、模拟面试的评分报告。登录后才上传，用于跨设备同步。",
            "<b>你主动提交的内容</b>：投稿的面试题、题目报错反馈（含你填写的联系方式）。投稿会记录提交时的 IP 用于防滥用限流。",
            "<b>访问与设备信息</b>：全站访问计数（累计/当日）、访客所属国家与城市（来自 Cloudflare 请求头，精确到城市级，不含街道或 GPS）、题目浏览计数。这些都是<b>聚合数字</b>，不与你的账号身份绑定。",
            "<b>安全与限流信息</b>：注册/登录/投稿/AI 功能按 IP 记录短窗口计数，用于拦住刷接口；密码重置记录邮箱重置令牌的哈希、IP 哈希与 30 分钟有效期。",
          ],
        },
        {
          h: "三、AI 功能会送出什么内容",
          p: ["本站的「AI 变式题」和「AI 改卷」调用第三方大模型服务（DeepSeek，接口 api.deepseek.com）完成推理。请求时会送出："],
          ul: [
            "AI 变式题：<b>题目标题、参考答案</b>、所属分类名与标签（用于生成同考点的变式练习）。",
            "AI 改卷：<b>题目标题、参考答案，以及你写下的回答</b>（用于按正确性/完整性/表达打分）。",
            "生成结果会被缓存复用：变式题缓存最长 180 天，改卷结果对「同一题 + 同一回答」缓存 7 天；过期自动失效。",
          ],
          p: ["请<b>不要</b>在回答里填写真实姓名、手机号、公司内网信息、客户名称或未公开的业务数据。这些内容一旦送出，我们无法从服务商侧撤回。"],
        },
        {
          h: "四、我们不做什么",
          ul: [
            "不使用广告追踪 Cookie，不接入任何广告联盟或用户画像平台。",
            "不向第三方出售或出租你的个人信息。",
            "不读取你设备上的其它数据；本站只使用自己域名下的浏览器本地存储。",
          ],
        },
        {
          h: "五、Cookie 与本地存储",
          p: ["本站不用 Cookie 记录身份，登录凭据（令牌，有效期 30 天）与未登录时的学习数据保存在浏览器的本地存储（localStorage / IndexedDB）中。你可以随时在浏览器设置里清除它们，代价是本机未同步的数据会一起丢失。"],
          p: ["人机验证（Cloudflare Turnstile）在注册/登录等环节启用，它会按自身策略进行必要校验。"],
        },
        {
          h: "六、信息保存多久",
          ul: [
            "账号与学习数据：<b>保留到你注销为止</b>；注销后按下面的流程删除。",
            "登录令牌：30 天，到期自动失效。",
            "密码重置令牌：30 分钟有效、一次性使用，且只保存哈希值。",
            "IP 限流计数：短窗口（分钟级到天级），到期自动淘汰。",
            "访问统计：聚合数字，保留用于观察站点趋势。",
          ],
        },
        {
          h: "七、你的权利",
          p: ["登录后在「我的帐号 → 数据与隐私」可以自助完成："],
          ul: [
            "<b>导出我的数据</b>：把云端的收藏、历史、错题与面试报告导出成 JSON 文件下载到本地。",
            "<b>清空云端学习数据</b>：删除云端的收藏、历史与错题记录（保留账号，本机数据不受影响）。",
            "<b>注销账号</b>：永久删除账号，以及云端的学习数据、模拟面试报告、投稿与反馈记录；注销不可撤销，请先导出需要保留的内容。",
          ],
          p: ["未登录用户的数据只在本机，清除浏览器数据即为删除。若你想让我们处理上述范围之外的请求，可以通过 " + CONTACT + " 联系我们。"],
        },
        {
          h: "八、未成年人",
          p: ["本站内容面向求职者与在职工程师。未满 14 周岁的儿童请在监护人陪同下使用；如我们发现在未取得监护人同意的情况下收集了儿童个人信息，会尽快删除。"],
        },
        {
          h: "九、政策更新",
          p: ["本政策随功能调整而更新，更新日期见页首。涉及收集范围、用途或第三方共享的重大变更，我们会在站内显著位置提示。"],
        },
      ],
    },

    /* ============================ 用户协议 ============================ */
    terms: {
      key: "terms",
      route: "/terms",
      file: "terms.html",
      title: "用户协议",
      updated: UPDATED,
      desc: "IT面试题库的服务说明、账号规则、投稿授权、AI 功能说明与免责条款。",
      intro: "本协议是你与 IT面试题库（itinterview.com.cn）之间的服务约定。开始使用即视为已阅读并同意本协议。",
      sections: [
        {
          h: "一、服务内容",
          p: ["本站提供免费的 IT 面试题浏览、分类与岗位检索、刷题与错题复习、模拟面试、技术教程等学习工具，以及登录后的跨设备云同步。"],
        },
        {
          h: "二、账号规则",
          ul: [
            "一人一号，请用真实可用的邮箱注册（找回密码需要它）。",
            "请自行保管密码。账号下的一切活动视为你本人的行为。",
            "不得批量注册、刷接口、抓取本站数据库或干扰他人正常使用；确有此类行为时，我们有权禁用账号。",
          ],
        },
        {
          h: "三、投稿与内容授权",
          ul: [
            "你投稿的题目应为你原创或有权发布的内容，不得侵犯他人著作权、商业秘密，也不得夹带真实客户名称、内部资料或未脱敏的生产数据。",
            "投稿即表示你<b>授权本站为运营与传播目的免费使用、复制、修改、整理与发布</b>该内容（包括收录进题库、生成分享页与导出文件），并同意我们在必要时做文字校对与结构调整。",
            "投稿会经过自动质检与人工/专家审核，未通过不会被收录；你可在「我的投稿」查看结果并撤回。",
          ],
        },
        {
          h: "四、AI 功能说明与免责",
          p: ["「AI 变式题」「AI 改卷」由第三方大模型生成，<b>可能不准确、不完整或与实际面试要求存在偏差</b>，仅作为练习参考，不构成评分、录用或能力认证的依据。AI 生成的内容不代表本站立场，请以官方文档与权威资料为准。"],
        },
        {
          h: "五、题库内容免责",
          p: ["题目与答案整理自公开资料、官方文档与真实面试场景，并由人工逐题核对，但技术发展快、场景差异大，我们<b>不保证内容完全准确、最新，也不保证面试命中</b>。因使用本站内容产生的决策后果，由使用者自行承担。本站内容不构成生产环境的操作建议，线上变更请先在测试环境验证。"],
        },
        {
          h: "六、服务可用性",
          p: ["本站运行在第三方云平台上，可能因网络、运营商、平台维护或不可抗力出现访问缓慢、加载失败或暂时不可用。我们会尽力保障可用性，但不承诺无中断服务。"],
        },
        {
          h: "七、协议的变更与终止",
          ul: [
            "协议更新后继续使用即视为接受更新后的条款。",
            "你可以随时在「我的帐号 → 数据与隐私」注销账号，注销后本协议对你终止。",
            "严重违反本协议（如侵犯他人权益、攻击站点）时，我们有权停止服务并保留相关记录。",
          ],
        },
        {
          h: "八、法律适用",
          p: ["本协议适用中华人民共和国大陆地区法律。因本协议产生的争议，应友好协商解决；协商不成的，提交本站运营者所在地有管辖权的人民法院处理。"],
        },
      ],
    },
  };

  window.LEGAL_DOCS = DOCS;

  /* ---------------- SPA 渲染（#/privacy、#/terms） ---------------- */
  function renderPage(key) {
    const doc = DOCS[key];
    if (!doc) return;
    document.title = doc.title + " · IT面试题库";
    /* SPA 路由（#/privacy）与静态页（privacy.html）正文同源。
       把 canonical 统一指向静态页，避免两个 URL 被当成重复内容各收一份。 */
    try {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", location.origin + "/" + doc.file);
    } catch (e) {}
    const set = (window.App && window.App._internals && window.App._internals.setMain) || window.setMain;
    const other = key === "privacy" ? DOCS.terms : DOCS.privacy;
    const body = doc.sections.map((s) => {
      const ps = (s.p || []).map(t => `<p class="lg-p">${t}</p>`).join("");
      const ul = (s.ul || []).length
        ? `<ul class="lg-ul">${(s.ul || []).map(t => `<li>${t}</li>`).join("")}</ul>` : "";
      return `<section class="lg-sec"><h2>${s.h}</h2>${ps}${ul}</section>`;
    }).join("");
    const html = `
      <div class="lg-wrap">
        <div class="lg-head">
          <h1>${doc.title}</h1>
          <p class="muted">最后更新：${doc.updated} · 生效日期：${doc.updated}</p>
        </div>
        <div class="card lg-card">
          <p class="lg-lead">${doc.intro}</p>
          ${body}
          <div class="lg-foot">
            <a class="btn btn-sm" href="${other.route}">阅读${other.title}</a>
            <a class="btn btn-sm" href="/about">关于本站</a>
            ${window.Account && window.Account.isLoggedIn && window.Account.isLoggedIn()
              ? `<a class="btn btn-sm" href="/account">我的帐号 · 数据与隐私</a>` : ""}
          </div>
        </div>
      </div>
      <style>
        .lg-wrap { max-width: 780px; margin: 0 auto; }
        .lg-head h1 { font-size: 24px; margin: 0 0 6px; }
        .lg-card { margin-top: 14px; line-height: 1.8; }
        .lg-lead { font-size: 15px; margin-bottom: 18px; }
        .lg-sec { margin-top: 20px; }
        .lg-sec h2 { font-size: 16px; margin-bottom: 8px; }
        .lg-p { margin: 8px 0; }
        .lg-ul { margin: 8px 0; padding-left: 20px; }
        .lg-ul li { margin: 6px 0; }
        .lg-foot { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border, #e2e8f0); }
      </style>`;
    if (typeof set === "function") set(html);
    else { const m = document.getElementById("main"); if (m) m.innerHTML = html; }
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  }

  window.pagePrivacy = function () { renderPage("privacy"); };
  window.pageTerms = function () { renderPage("terms"); };
})();
