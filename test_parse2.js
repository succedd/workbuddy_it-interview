const fs = require('fs');
const code = fs.readFileSync(__dirname + '/js/api.js', 'utf8');
const window = {};
const AIPrompts = {};
const API = new Function('window', 'AIPrompts', code + '\nreturn window.API;')(window, AIPrompts);

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  -> ' + JSON.stringify(extra).slice(0,200) : '')); }
}

// === 原有测试（确保没回归）===
check('标准对象', (() => { const r = API.parseJSON('{"questions":[{"title":"t","body":"b"}]}'); return r && r.questions && r.questions.length === 1; })());
check('代码围栏+前后文字', (() => { const r = API.parseJSON('好的：\n```json\n{"questions":[{"title":"x"}]}\n```\n好！'); return r && r.questions && r.questions.length === 1; })());
check('字符串内真实换行', (() => { const r = API.parseJSON('{"questions":[{"title":"t","body":"a\\nb"}]}'); return r && r.questions[0].body === 'a\\nb'; })());
check('数组自动包装', (() => { const r = API.parseJSON('[{"title":"a"}]', {asQuestions:true}); return r && r.questions && r.questions.length === 1; })());
check('尾随逗号', (() => { const r = API.parseJSON('{questions:[{title:"t",body:"b"},],}'); return r && r.questions && r.questions.length === 1; })());
check('彻底无效返回raw', (() => { const r = API.parseJSON('抱歉无法生成'); return r && r.raw; })());

// === 新增：尽力提取测试 ===

// 场景1：外层 JSON 被截断尾部，但 questions 数组完整
const truncated1 = `{
  "positionName": "运维工程师",
  "techStack": ["Linux","Docker"],
  "questions": [
    {"title":"Linux进程状态","body":"请说明进程的 R/S/D/Z 状态","answer":"R运行/S睡眠/D不可中断/Z僵尸","difficulty":"中级","type":"简答题","tags":["Linux"],"followups":["如何查看僵尸进程？"]},
    {"title":"Docker容器网络","body":"解释 bridge 网络模式","answer":"默认使用 linux bridge...","difficulty":"高级","type":"场景题","tags":["Docker"]}
  ],
  "missingCategories": [
    {"name":"GPU运维","parentPath":"云计算","reason":"缺少GPU相关"}
`;
const r1 = API.parseJSON(truncated1, { asQuestions: true });
check('截断尾部-尽力提取questions', r1 && !r1.raw && Array.isArray(r1.questions) && r1.questions.length === 2 && r1._extracted, r1);

// 场景2：完全无 JSON 结构，但有散落的题目对象
const scattered = `以下是生成的题目：

题目1：
{"title":"TCP三次握手","body":"描述三次握手过程","answer":"SYN->SYN+ACK->ACK","difficulty":"初级","type":"简答题","tags":["网络"]}

题目2：
{"title":"HTTP状态码","body":"说明302和304区别","answer":"302临时重定向/304协商缓存","difficulty":"中级","type":"简答题","tags":["HTTP"]}

以上是全部题目。`;
const r2 = API.parseJSON(scattered, { asQuestions: true });
check('散落对象-逐个提取', r2 && !r2.raw && Array.isArray(r2.questions) && r2.questions.length === 2 && r2._extracted, r2);

// 场景3：questions 数组内部有真实换行（最坏情况组合）
const messy = `一些废话
\`\`\`
{
  "questions": [
    {
      "title": "多线程题",
      "body": "第一行
第二行
第三行",
      "answer": "步骤A
步骤B",
      "difficulty": "高级"
    }
  ]
}
\`\`\`
更多废话`;
const r3 = API.parseJSON(messy, { asQuestions: true });
check('围栏+换行+尽力提取', r3 && !r3.raw && Array.isArray(r3.questions) && r3.questions.length === 1, r3);

// 场景4：正常完整 JSON 不应走 _extracted 路径
const normal = '{"positionName":"test","questions":[{"title":"ok"}],"missingCategories":[]}';
const r4 = API.parseJSON(normal, { asQuestions: true });
check('正常JSON不走_extracted', r4 && r4.questions && r4.questions.length === 1 && !r4._extracted, r4);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
