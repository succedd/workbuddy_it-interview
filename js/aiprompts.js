/* =========================================================================
 *  aiprompts.js  —  AI Prompt 模板（DeepSeek Harness）
 * ========================================================================= */
(function () {
  "use strict";
  const P = {};

  P.SYSTEM = `你是一名资深IT技术面试官和IT技术体系专家。请根据提供的岗位名称、工作年限和岗位JD，生成高质量、可用于真实技术面试的题目。要求优先覆盖岗位JD中明确要求的技术栈，题目难度应匹配目标工作年限，题目需覆盖基础理论、实际场景、故障排查、设计思路等多个维度，每道题必须提供专业准确结构化的参考答案，避免重复题目和过于简单的问题，为每道题提供建议技术分类路径，如果现有技术体系中没有对应分类则在指定字段中说明，必须按照指定JSON结构返回不要输出JSON以外的解释文字，编程题应给出题目要求和考察点和参考解法和示例代码，系统设计题应给出架构思路和关键组件和风险点和扩展追问。`;

  P.analyzeJD = function (jd, years) {
    return `请解析以下岗位JD，提取结构化信息并以JSON返回，不要输出JSON以外的任何文字。
要求返回格式：
{
  "positionName": "识别到的岗位名称",
  "years": "工作年限要求",
  "required": ["必备技术栈列表"],
  "bonus": ["加分技术栈列表"],
  "soft": ["软技能要求列表"]
}
岗位JD原文：
"""
${jd}
"""
目标工作年限：${years || "未指定"}

 只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头、以 } 结尾。`;
  };

  P.generate = function (spec) {
    const diffPart = spec.diffRatio && Object.keys(spec.diffRatio).length
      ? `\n各难度题目数量比例（仅供参考，自行合理分配）：${JSON.stringify(spec.diffRatio)}` : "";
    const typePart = spec.typeRatio && Object.keys(spec.typeRatio).length
      ? `\n各题型数量比例：${JSON.stringify(spec.typeRatio)}` : "";
    const jdPart = spec.jd ? `\n岗位JD原文：\n"""\n${spec.jd}\n"""` : "";
    const techPart = spec.techList && spec.techList.length
      ? `\n必须覆盖的技术栈及建议题量：${JSON.stringify(spec.techList)}` : "";
    return `请根据以下信息生成面试题，并以JSON返回，不要输出JSON以外的任何文字。
岗位名称：${spec.positionName}
工作年限：${spec.years || "未指定"}
生成题目总数：${spec.count || 10}${jdPart}${techPart}${diffPart}${typePart}
${spec.answer !== false ? "为每道题生成标准答案。" : "不生成答案。"}
${spec.followup ? "为每道题生成2-3个面试追问问题。" : ""}

重要输出顺序要求：必须先输出完整的 questions 数组（这是核心内容），再输出其他字段。如果输出长度接近上限，优先保证 questions 完整，missingCategories 可省略。

返回JSON结构（按此顺序输出）：
{
  "positionName": "岗位名称",
  "techStack": ["识别到的技术栈"],
  "questions": [
    {
      "title": "题目标题",
      "body": "题目正文（Markdown）",
      "answer": "参考答案（Markdown，含代码示例）",
      "categoryPath": ["建议技术分类路径"],
      "difficulty": "初级|中级|高级|专家",
      "type": "单选题|多选题|判断题|填空题|简答题|编程题|场景题|故障排查题|系统设计题|开放讨论题",
      "tags": ["技术标签"],
      "years": "工作年限要求",
      "followups": ["追问问题"]
    }
  ],
  "missingCategories": [
    { "name": "建议新增的分类名称", "parentPath": "建议父级分类路径", "reason": "缺失原因" }
  ]
}

只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头。`;
  };

  P.optimize = function (question, action) {
    const map = {
      "optimize": "请优化以下题目的表述，指出表述是否清晰、有无歧义或不专业之处，并给出优化后的完整题目正文（Markdown）。",
      "answer": "请为以下题目补充或完善更详细专业的参考答案（Markdown，必要时含代码）。",
      "followup": "请基于以下题目生成3-5个适合深入追问的问题。",
      "similar": "请基于以下题目生成2-3道考查相同知识点但表述不同的相似题（含答案）。",
      "difficulty": "请评估以下题目的实际难度，给出建议难度等级（初级/中级/高级/专家）及修改意见。",
      "check": "请检查以下参考答案中是否存在技术性错误，逐条指出并给出修正。",
      "rubric": "请为以下题目生成面试官评分参考标准（按要点给分）。"
    };
    return `${map[action] || map.optimize}
请以JSON返回：{"result": "你的输出内容"}，不要输出JSON以外的文字，严禁使用 markdown 代码块围栏，必须直接以 { 开头、以 } 结尾。

题目：
标题：${question.title}
正文：${question.body}
参考答案：${question.answer || "（无）"}`;
  };

  P.completeness = function (categories, questionsCount) {
    return `我是IT面试题库管理员。当前技术分类体系如下（格式：分类名(题目数)）：
${categories.map(c => `- ${c.name}(${c.count})`).join("\n")}

请分析该技术体系与主流IT技术栈相比缺少哪些内容、哪些分类题目数量严重不足、是否存在命名不规范和分类层级不合理、是否存在内容重复。

以JSON返回：
{
  "gaps": [{"name":"建议新增分类","parentPath":"建议父级分类路径","reason":"缺失原因"}],
  "insufficient": [{"name":"题目不足的分类","count":当前数量,"suggest":建议数量}],
  "issues": [{"name":"分类名","problem":"规范性问题说明"}]
}
只返回JSON。严禁使用 markdown 代码块围栏，不要输出任何解释性文字，必须直接以 { 开头、以 } 结尾。`;
  };

  window.AIPrompts = P;
})();
