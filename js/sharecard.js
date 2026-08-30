/* 题目分享卡片：用 canvas 渲染一张精美的题目卡片 PNG
 * - 移动端优先走 navigator.share({files}) 直接分享到微信，桌面降级为下载
 * - 二维码走外部服务，加载失败（或画布被跨域污染）时自动降级为纯文字网址
 */
(function () {
  const W = 800, H = 1120;          // 逻辑尺寸（导出时按 2 倍像素，保证清晰）
  const SCALE = 2;
  const PAD = 40;                   // 卡片外边距
  const CARD_W = W - PAD * 2;       // 720
  const CARD_H = H - PAD * 2;       // 1040
  const HEAD_H = 420;               // 顶部渐变区高度
  const X0 = PAD, Y0 = PAD;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* 去掉 Markdown 标记，取纯文本摘要 */
  function stripMd(s) {
    return String(s || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/\*([^*]*)\*/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* 结构化答案摘要：保留「编号 / 要点 / 分段」的层次。
     旧版把答案整体 stripMd 成一段再硬折 7 行，编号和段落全糊在一起，观感很差。
     这里按空行和行首编号/项目符号切块，每块独立折行绘制，块间留缝。 */
  function answerBlocks(src, maxBlocks) {
    const text = String(src || "").replace(/```[\s\S]*?```/g, " ").replace(/\r\n/g, "\n");
    const blocks = [];
    let cur = "";
    const flush = () => {
      const s = stripMd(cur).trim();
      if (s) blocks.push(s);
      cur = "";
    };
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) { flush(); continue; }
      if (/^([0-9]{1,2}[.、)]|[①②③④⑤⑥⑦⑧⑨⑩]|[-*+]\s|#{1,6}\s)/.test(line)) {
        flush();
        cur = line;
      } else {
        cur = cur ? cur + " " + line : line;
      }
    }
    flush();
    return blocks.slice(0, maxBlocks);
  }

  /* 逐字符折行（中文无空格，不能按词折行） */
  function wrap(ctx, text, maxW, maxLines) {
    const lines = [];
    let cur = "";
    for (const ch of String(text || "")) {
      if (ch === "\n") { lines.push(cur); cur = ""; if (lines.length >= maxLines) break; continue; }
      const t = cur + ch;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        if (lines.length >= maxLines) { cur = ""; break; }
        cur = ch;
      } else cur = t;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length === maxLines) {
      // 末行放不下时补省略号
      let last = lines[maxLines - 1];
      while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + "…";
    }
    return lines;
  }

  function drawPill(ctx, x, y, text, opt) {
    opt = opt || {};
    ctx.font = (opt.font || "500 21px") + ' -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = ctx.measureText(text).width;
    const h = 42, padX = 16;
    const w = tw + padX * 2;
    ctx.fillStyle = opt.bg || "#EFF6FF";
    rr(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = opt.fg || "#1D4ED8";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y + h / 2 + 1);
    return w;
  }

  /* 画卡片主体（二维码随后叠加） */
  function drawCard(ctx, q, meta) {
    ctx.clearRect(0, 0, W, H);
    // 外层底色
    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(0, 0, W, H);

    // 卡片裁剪区
    ctx.save();
    rr(ctx, X0, Y0, CARD_W, CARD_H, 36);
    ctx.clip();

    // 顶部渐变
    const g = ctx.createLinearGradient(X0, Y0, X0 + CARD_W, Y0 + HEAD_H);
    g.addColorStop(0, "#1E40AF");
    g.addColorStop(0.55, "#2563EB");
    g.addColorStop(1, "#6D28D9");
    ctx.fillStyle = g;
    ctx.fillRect(X0, Y0, CARD_W, HEAD_H);
    // 渐变区装饰圆
    ctx.fillStyle = "rgba(255,255,255,.07)";
    ctx.beginPath(); ctx.arc(X0 + CARD_W - 60, Y0 + 40, 130, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(X0 + 40, Y0 + HEAD_H - 30, 90, 0, Math.PI * 2); ctx.fill();

    // 品牌
    const bx = X0 + 40, by = Y0 + 44;
    ctx.fillStyle = "rgba(255,255,255,.20)";
    rr(ctx, bx, by, 44, 44, 12); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = '700 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText("IT", bx + 10, by + 23);
    ctx.font = '700 25px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("IT 面试题库", bx + 58, by + 17);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = '15px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("it-interview.is-a.dev", bx + 58, by + 38);

    // 题目标题
    ctx.fillStyle = "#fff";
    ctx.font = '700 38px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const titleLines = wrap(ctx, q.title, CARD_W - 80, 4);
    let ty = Y0 + 150;
    for (const ln of titleLines) { ctx.fillText(ln, X0 + 40, ty); ty += 54; }

    // 下半部白底
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(X0, Y0 + HEAD_H, CARD_W, CARD_H - HEAD_H);

    // 标签
    let px = X0 + 40;
    const py = Y0 + HEAD_H + 40;
    const tags = meta.tags.slice(0, 3);
    for (const t of tags) {
      const w = drawPill(ctx, px, py, t);
      px += w + 12;
      if (px > X0 + CARD_W - 120) break;
    }

    // 参考答案摘要（按编号/要点分块绘制，块间留缝，不再整段糊在一起）
    ctx.fillStyle = "#94A3B8";
    ctx.font = '500 19px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("参考答案", X0 + 40, Y0 + HEAD_H + 128);
    ctx.fillStyle = "#334155";
    ctx.font = '25px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    let ay = Y0 + HEAD_H + 162;
    let budget = meta.answerLines || 7;
    for (let bi = 0; bi < meta.answerBlocks.length && budget > 0; bi++) {
      const isLastBlock = bi === meta.answerBlocks.length - 1;
      const lines = wrap(ctx, meta.answerBlocks[bi], CARD_W - 80, budget);
      budget -= lines.length;
      if (budget <= 0 && !isLastBlock && !/…$/.test(lines[lines.length - 1])) {
        let last = lines[lines.length - 1];
        while (last && ctx.measureText(last + "…").width > CARD_W - 80) last = last.slice(0, -1);
        lines[lines.length - 1] = last + "…";
      }
      for (const ln of lines) { ctx.fillText(ln, X0 + 40, ay); ay += 42; }
      if (budget > 0) ay += 10;   // 块间距
    }

    // 底部分隔线
    const fy = Y0 + CARD_H - 130;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X0 + 40, fy); ctx.lineTo(X0 + CARD_W - 40, fy); ctx.stroke();

    // 左下文案 + 网址
    ctx.fillStyle = "#64748B";
    ctx.font = '18px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(meta.hasQr ? "微信扫码查看完整答案与解析" : "复制链接到浏览器查看完整答案", X0 + 40, fy + 38);
    ctx.fillStyle = "#2563EB";
    ctx.font = '700 21px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const urlTxt = meta.url.replace(/^https?:\/\//, "");
    ctx.fillText(urlTxt.length > 34 ? urlTxt.slice(0, 34) + "…" : urlTxt, X0 + 40, fy + 74);

    ctx.restore();
  }

  /* 二维码：失败或跨域污染时返回 null，卡片降级为纯文字 */
  function loadQr(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const done = v => resolve(v);
      const t = setTimeout(() => done(null), 6000);
      img.onload = () => { clearTimeout(t); done(img); };
      img.onerror = () => { clearTimeout(t); done(null); };
      img.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(url);
    });
  }

  function drawQr(ctx, img) {
    const size = 104;
    const x = X0 + CARD_W - 40 - size;
    const y = Y0 + CARD_H - 122;
    ctx.save();
    rr(ctx, x - 6, y - 6, size + 12, size + 12, 12);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    try { ctx.drawImage(img, x, y, size, size); } catch (e) {}
  }

  const ShareCard = {
    /* 题目对象 → meta */
    meta(q, url) {
      const tags = [];
      if (q.catName) tags.push(q.catName);
      if (q.difficulty) tags.push(q.difficulty);
      if (q.years) tags.push(q.years);
      if (q.type && tags.length < 3) tags.push(q.type);
      return {
        url,
        tags: tags.length ? tags : ["面试题"],
        answerBlocks: answerBlocks(q.answer || q.body || "", 8),
        answerLines: 7
      };
    },

    /* 渲染卡片，返回 {canvas, meta}（二维码可用时已叠加） */
    async render(q, url) {
      const meta = ShareCard.meta(q, url);
      const cv = document.createElement("canvas");
      cv.width = W * SCALE; cv.height = H * SCALE;
      const ctx = cv.getContext("2d");
      ctx.scale(SCALE, SCALE);
      ctx.textBaseline = "alphabetic";

      // 先按无二维码排版（底部文案不同），拿到二维码后重绘并叠加
      meta.hasQr = false;
      drawCard(ctx, q, meta);
      const qr = await loadQr(url);
      if (qr) {
        // 校验是否污染画布：污染则 toDataURL 抛错，此时放弃二维码
        try { cv.toDataURL("image/png"); meta.hasQr = true; } catch (e) { meta.hasQr = false; }
      }
      if (meta.hasQr) {
        drawCard(ctx, q, meta); drawQr(ctx, qr);
        // 二次校验：二维码服务未正确返回 CORS 时画布会被污染，toDataURL 抛 SecurityError；此时降级为无二维码卡片
        try { cv.toDataURL("image/png"); }
        catch (e) { meta.hasQr = false; drawCard(ctx, q, meta); }
      }
      return { canvas: cv, meta };
    },

    /* canvas → PNG 文件 */
    toFile(canvas, filename) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error("toBlob failed")); return; }
          resolve(new File([blob], filename, { type: "image/png" }));
        }, "image/png");
      });
    }
  };

  /* ============================ 学习周报分享卡 ============================ */
  function weekCardRender(st) {
    st = st || {};
    return new Promise((resolve, reject) => {
      const W = 800, H = 1120, S = 2, PAD = 40;
      const cv = document.createElement("canvas");
      cv.width = W * S; cv.height = H * S;
      const ctx = cv.getContext("2d");
      ctx.scale(S, S); ctx.textBaseline = "alphabetic";
      const F = (w, px) => w + " " + px + "px -apple-system, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
      const CX = PAD, CY = PAD, CW = W - PAD * 2, CH = H - PAD * 2;
      try {
        ctx.fillStyle = "#F1F5F9"; ctx.fillRect(0, 0, W, H);
        ctx.save();
        rr(ctx, CX, CY, CW, CH, 36); ctx.clip();
        const g = ctx.createLinearGradient(CX, CY, CX + CW, CY + 320);
        g.addColorStop(0, "#1E40AF"); g.addColorStop(0.55, "#2563EB"); g.addColorStop(1, "#6D28D9");
        ctx.fillStyle = g; ctx.fillRect(CX, CY, CW, 320);
        ctx.fillStyle = "rgba(255,255,255,.07)";
        ctx.beginPath(); ctx.arc(CX + CW - 50, CY + 30, 120, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = F("700", 24);
        ctx.fillText("IT 面试题库 · 学习周报", CX + 40, CY + 66);
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = F("500", 17);
        ctx.fillText(String(st.range || ""), CX + 40, CY + 98);
        ctx.font = F("700", 40);
        ctx.fillText(String(st.slogan || "坚持就是胜利").slice(0, 15), CX + 40, CY + 210);
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(CX, CY + 320, CW, CH - 320);
        const stats = [["本周刷题", st.total || 0, "#2563EB"], ["打卡天数", st.days || 0, "#D97706"], ["新增薄弱", st.weakNew || 0, "#DC2626"]];
        stats.forEach((it, i) => {
          const cx = CX + 40 + (i + 0.5) * (CW - 80) / 3;
          ctx.textAlign = "center";
          ctx.fillStyle = it[2]; ctx.font = F("800", 54);
          ctx.fillText(String(it[1]), cx, CY + 432);
          ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 18);
          ctx.fillText(it[0], cx, CY + 464);
          ctx.textAlign = "left";
        });
        ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 17);
        ctx.fillText("每日刷题分布", CX + 40, CY + 545);
        const bBase = CY + 705, bMax = 125;
        const maxN = Math.max(1, ...(st.daily || []).map(d => d.n || 0));
        (st.daily || []).forEach((d, i) => {
          const cx = CX + 40 + (i + 0.5) * (CW - 80) / 7;
          const h = d.n ? Math.max(8, Math.round(d.n / maxN * bMax)) : 4;
          ctx.fillStyle = d.label === "今" ? "#1D4ED8" : "#93C5FD";
          rr(ctx, cx - 22, bBase - h, 44, h, 5); ctx.fill();
          ctx.textAlign = "center";
          if (d.n) { ctx.fillStyle = "#475569"; ctx.font = F("600", 16); ctx.fillText(String(d.n), cx, bBase - h - 8); }
          ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 16);
          ctx.fillText(d.label, cx, bBase + 24);
          ctx.textAlign = "left";
        });
        ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 17);
        ctx.fillText(st.weakIsWeek ? "本周新增薄弱 Top" : "累计薄弱 Top", CX + 40, CY + 795);
        let px = CX + 40, py = CY + 838;
        (st.weakTop || []).slice(0, 3).forEach(w => {
          const txt = String(w.name || "").slice(0, 12) + " " + (w.n || 0);
          const pw = drawPill(ctx, px, py - 21, txt, { bg: "#FEF3C7", fg: "#B45309", font: "600 18" });
          px += pw + 12;
          if (px > CX + CW - 140) { px = CX + 40; py += 46; }
        });
        const fy = CY + CH - 128;
        ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(CX + 40, fy); ctx.lineTo(CX + CW - 40, fy); ctx.stroke();
        ctx.fillStyle = "#64748B"; ctx.font = F("500", 18);
        ctx.fillText("坚持学习的人，运气都不会太差", CX + 40, fy + 36);
        ctx.fillStyle = "#2563EB"; ctx.font = F("700", 21);
        ctx.fillText("it-interview.is-a.dev", CX + 40, fy + 72);
        ctx.restore();
      } catch (e) { reject(e); return; }
      loadQr("https://it-interview.is-a.dev/").then(img => {
        if (img) {
          const size = 104, x = CX + CW - 40 - size, y = CY + CH - 122;
          ctx.save();
          rr(ctx, x - 6, y - 6, size + 12, size + 12, 12); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2; ctx.stroke();
          ctx.restore();
          try { ctx.drawImage(img, x, y, size, size); } catch (e) {}
        }
        resolve({ canvas: cv });
      });
    });
  }
  window.WeekCard = { render: weekCardRender, toFile: ShareCard.toFile };
  window.ShareCard = ShareCard;
})();
