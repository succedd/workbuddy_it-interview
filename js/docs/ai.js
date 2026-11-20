/* =========================================================================
 *  js/docs/ai.js — 技术教程「AI 大模型应用」方向数据
 *
 *  章节骨架参考：
 *    · OpenAI API Docs（Text generation / Function calling / Structured outputs / Evals）
 *    · Anthropic Docs（Prompt engineering / Tool use）与 Model Context Protocol 规范
 *    · Hugging Face LLM Course / PEFT 文档、vLLM 官方文档
 *    · LangChain / LlamaIndex 的 RAG 教程目录、OWASP Top 10 for LLM Applications
 *  正文为 Markdown；代码围栏用 ${F}、行内代码用 ${C}。
 *  ⚠ shell 里的变量必须写成 \${VAR}，否则会被当成 JS 模板插值。
 * ========================================================================= */
(function () {
  "use strict";
  const F = "\u0060\u0060\u0060";   // 代码块围栏
  const C = "\u0060";               // 行内代码

  const AI = {
    id: "ai",
    name: "AI 大模型应用",
    icon: "🤖",
    desc: "面向后端和全栈工程师的大模型应用开发路线：先把 AI、机器学习、深度学习、大模型的常用名词和概念讲透，再到会调 API、写好 Prompt，到搭 RAG 知识库、做 Agent 与工具调用，再到微调、推理部署、评测与安全。按 OpenAI / Anthropic 官方文档、Hugging Face 课程与 vLLM 文档的目录组织。",
    levels: [
      {
        id: "basic",
        name: "初级",
        desc: "搞懂 AI 与大模型的核心名词和概念，理解大模型怎么工作，能稳定调用 API、写出可控的 Prompt、拿到结构化结果。",
        chapters: [
          // <ai-basic>
          {
            id: "ai-concepts-map",
            title: "AI 入门概念地图：机器学习、深度学习与大模型",
            minutes: 15,
            updated: "2026-11-20",
            applies: "零基础入门，无需数学背景",
            tags: ["AI", "机器学习", "概念"],
            terms: ["人工智能", "机器学习", "深度学习", "监督学习", "过拟合", "损失函数", "梯度下降"],
            body: `
> **官方文档基线**：[Google · Machine Learning Glossary](https://developers.google.com/machine-learning/glossary) · [Google · Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) · [NVIDIA · AI Glossary](https://www.nvidia.com/en-us/glossary/)

## 一、四个词的包含关系

很多人把 AI、机器学习、深度学习、大模型混着说。它们其实是一层套一层的关系：

![AI、机器学习、深度学习与大模型的关系](/assets/diagrams/docs/ai-family.svg)

| 名词 | 一句话解释 | 典型例子 |
|---|---|---|
| 人工智能（AI） | 让机器做出「看起来有智能」的行为，方法不限 | 下棋程序、导航路线规划 |
| 机器学习（ML） | 不手写规则，给数据让程序自己找规律 | 垃圾邮件识别、房价预测 |
| 深度学习（DL） | 用多层神经网络做机器学习 | 人脸识别、语音转文字 |
| 大模型（LLM） | 参数量巨大、在海量文本上训练的深度学习模型 | ChatGPT、Claude、通义千问、DeepSeek |
| 生成式 AI（AIGC） | 能生成新内容（文字、图片、音视频）的 AI | 写文案、画图、生成代码 |

## 二、模型、参数、训练、推理

用「学生备考」来理解最直观：

- **模型**：学生的大脑，本质是一个带很多可调数字的数学函数。
- **参数（权重）**：大脑里的「知识」，就是那些可调的数字。7B 模型就是有 70 亿个参数。
- **训练**：刷题。看题、作答、对答案、改正，反复调整参数。
- **推理（Inference）**：上考场。参数不再变化，只用学到的东西回答新问题。我们平时调用 ChatGPT 都是推理。

训练成本极高，通常只有模型厂商做；推理是每次调用都发生的，应用开发者主要关心推理的速度和费用。

## 三、数据集与标签

- **样本**：一条数据，比如一封邮件。
- **特征**：描述样本的信息，比如邮件里有没有「中奖」二字。
- **标签**：正确答案，比如「垃圾邮件 / 正常邮件」。
- **训练集 / 验证集 / 测试集**：分别用来学习、调参、最终考试。常见比例 8:1:1，测试集训练时绝不能偷看。

## 四、几种学习方式

| 方式 | 有没有标签 | 怎么学 | 例子 |
|---|---|---|---|
| 监督学习 | 有 | 照着正确答案学 | 图片分类、情感分析 |
| 无监督学习 | 没有 | 自己发现数据里的结构 | 用户分群、异常检测 |
| 自监督学习 | 从数据本身造标签 | 遮住一部分让模型猜 | 大模型预训练「猜下一个词」 |
| 强化学习 | 只有奖励信号 | 试错，做对了加分 | AlphaGo、RLHF、推理模型训练 |

分类问题预测的是类别（是不是垃圾邮件），回归问题预测的是数值（房价多少），这是监督学习最常见的两类任务。

## 五、损失函数与梯度下降

**损失函数（Loss）** 是给模型打分的尺子：预测和正确答案差得越多，损失越大。训练的目标就是让损失尽量小。

**梯度下降** 是最小化损失的方法。想象蒙着眼下山：每一步先摸一下哪个方向最陡（梯度），然后往下走一小步。每步走多远叫**学习率**，太大容易来回跳过谷底，太小走得太慢。

${F}python
# 最简单的梯度下降：找到让 loss = (w - 3)^2 最小的 w
w, lr = 0.0, 0.1
for step in range(50):
    grad = 2 * (w - 3)      # loss 对 w 的导数
    w -= lr * grad          # 沿梯度反方向走一步
print(round(w, 3))          # 接近 3.0
${F}

## 六、过拟合与欠拟合

| 现象 | 像什么 | 表现 | 常见解决办法 |
|---|---|---|---|
| 欠拟合 | 没学会 | 训练集、测试集都差 | 换更大的模型、训练更久 |
| 过拟合 | 死记硬背 | 训练集很好，测试集差 | 加数据、正则化、Dropout、早停 |
| 泛化好 | 真正理解 | 两边都好 | 目标状态 |

**泛化能力**就是模型在没见过的数据上表现好不好，这是衡量模型价值的核心。

## 七、常用评估指标

- **准确率（Accuracy）**：预测对的比例。类别不平衡时会骗人：99% 是正常邮件，全猜正常也有 99%。
- **精确率（Precision）**：判为垃圾的里面，真垃圾占多少，关心「别误杀」。
- **召回率（Recall）**：所有真垃圾里，抓出来多少，关心「别漏掉」。
- **F1**：精确率和召回率的综合。

## ⚠ 常见误区

- **误区：AI 就等于大模型**。推荐系统、风控模型大多仍是传统机器学习，便宜、快、可解释。
- **误区：数据越多越好**。脏数据、错标签会直接教坏模型，质量比数量更重要。
- **误区：训练集分数高就是好模型**。只有测试集上的表现才说明问题。

## ✅ 自检清单

- 能画出 AI ⊃ 机器学习 ⊃ 深度学习 ⊃ 大模型 的关系。
- 能区分训练和推理，知道参数是什么。
- 能说出监督、无监督、强化学习各一个例子。
- 能解释过拟合，以及精确率和召回率的区别。

## 📚 延伸阅读

- Google Machine Learning Crash Course（有中文版）
- 吴恩达《Machine Learning Specialization》
- 周志华《机器学习》（西瓜书）第 1~2 章
`
          },
          {
            id: "ai-nn-terms",
            title: "神经网络与深度学习核心名词",
            minutes: 16,
            updated: "2026-11-20",
            applies: "看懂模型论文、技术文章的基础",
            tags: ["深度学习", "神经网络", "概念"],
            terms: ["神经网络", "激活函数", "反向传播", "Epoch", "Batch", "学习率", "CNN", "RNN", "Embedding"],
            body: `
> **官方文档基线**：[Google · ML Crash Course: Neural networks](https://developers.google.com/machine-learning/crash-course/neural-networks) · [PyTorch · Learn the Basics](https://pytorch.org/tutorials/beginner/basics/intro.html) · [Dive into Deep Learning（动手学深度学习）](https://zh.d2l.ai/)

## 一、神经元、层与网络

- **神经元**：接收多个输入，每个输入乘一个**权重**，加起来再加一个**偏置**，最后过一个激活函数。
- **层（Layer）**：一排神经元。输入层接数据，输出层给结果，中间的叫**隐藏层**。
- **深度**：隐藏层多就叫「深」。GPT 类模型通常有几十到上百层。
- **全连接层（Linear / Dense）**：上一层每个神经元都连到下一层每个神经元，是最基础的层。

**激活函数**给网络加入「非线性」。没有它，叠多少层都等价于一层线性计算。常见的有 ReLU（负数变 0）、Sigmoid（压到 0~1）、Softmax（把一组分数变成概率，合计为 1），大模型里常用 GELU、SwiGLU。

## 二、训练循环

![神经网络训练一轮在做什么](/assets/diagrams/docs/nn-training.svg)

| 名词 | 含义 | 常见取值 |
|---|---|---|
| Epoch | 把全部训练数据完整过一遍 | 小数据集几十轮；大模型预训练约 1 轮 |
| Batch Size | 一次喂给模型多少条样本 | 32、256，大模型按 Token 计 |
| Step / Iteration | 更新一次参数 | 步数 = 数据量 / batch × epoch |
| 学习率（LR） | 每次更新走多大一步 | 1e-3 ~ 1e-5，常配合预热和衰减 |
| 优化器 | 决定怎么用梯度更新参数 | SGD、Adam、AdamW |

${F}python
import torch, torch.nn as nn
model = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()
for x, y in loader:                 # 每次一个 batch
    loss = loss_fn(model(x), y)     # 前向 + 计算损失
    opt.zero_grad()
    loss.backward()                 # 反向传播求梯度
    opt.step()                      # 更新参数
${F}

## 三、防止过拟合的手段

- **正则化（L2 / Weight Decay）**：惩罚过大的权重，让模型更「简单」。
- **Dropout**：训练时随机关掉一部分神经元，逼模型不依赖个别特征。
- **早停（Early Stopping）**：验证集指标不再变好就停。
- **数据增强**：图片翻转裁剪、文本同义改写，凭空多出训练数据。
- **归一化（BatchNorm / LayerNorm）**：让每层输入分布稳定，训练更快更稳。Transformer 用 LayerNorm 或 RMSNorm。

## 四、经典网络结构

| 结构 | 擅长 | 核心思想 | 代表 |
|---|---|---|---|
| CNN 卷积网络 | 图像 | 用小窗口在图上滑动提取局部特征 | ResNet、YOLO |
| RNN / LSTM | 早期的文本、语音 | 一个字一个字按顺序处理，带记忆 | Seq2Seq 翻译 |
| Transformer | 文本、图像、语音全都行 | 注意力机制，所有位置并行计算 | GPT、BERT、ViT |
| Diffusion 扩散模型 | 图像、视频生成 | 从噪声一步步去噪还原出图 | Stable Diffusion、Sora |
| GAN 生成对抗网络 | 早期图像生成 | 生成器和判别器互相博弈 | StyleGAN |

RNN 必须按顺序算，难以并行，长文本还会「忘掉前面」。Transformer 用注意力一次看全部内容，既能并行训练又能处理长距离依赖，因此取代了 RNN。

## 五、Embedding 与注意力

**Embedding（嵌入）** 把离散的东西（词、商品、用户）变成一串数字向量。意思相近的词，向量也靠得近：「国王 - 男人 + 女人 ≈ 女王」是经典例子。它是 RAG 检索和推荐系统的基础。

**注意力（Attention）** 让模型在处理一个词时，自动决定该重点看哪些其他词。计算时每个词生成三个向量：Query（我要找什么）、Key（我是什么）、Value（我的内容），用 Query 和 Key 的相似度给 Value 加权求和。

**编码器与解码器**：BERT 只用编码器，擅长理解（分类、抽取）；GPT 只用解码器，擅长生成；T5 两者都有，适合翻译、摘要。

## ⚠ 常见误区

- **误区：神经网络像人脑一样思考**。它只是借用了「神经元」的名字，本质是大量矩阵乘法。
- **误区：层数越多越好**。层数过深会梯度消失，需要残差连接（ResNet 的核心发明）才能训练。
- **误区：学习率随便设**。学习率是最影响训练结果的超参数，通常第一个调它。

## ✅ 自检清单

- 能说出前向传播、损失、反向传播、更新参数四步。
- 能区分 epoch、batch、step。
- 知道 CNN、RNN、Transformer 各擅长什么。
- 能用一句话解释 Embedding 和注意力。

## 📚 延伸阅读

- 3Blue1Brown：《深度学习》系列动画视频
- 李沐《动手学深度学习》在线版
- Jay Alammar：The Illustrated Transformer
`
          },
          {
            id: "ai-llm-basics",
            title: "大模型是怎么工作的：Token、Transformer 与上下文窗口",
            minutes: 16,
            updated: "2026-11-20",
            applies: "GPT-4o / Claude / Qwen / DeepSeek 等主流模型",
            tags: ["大模型", "LLM", "Transformer"],
            terms: ["大模型", "LLM", "Transformer", "Token", "注意力"],
            body: `
> **官方文档基线**：[OpenAI · Text generation](https://platform.openai.com/docs/guides/text) · [Hugging Face LLM Course](https://huggingface.co/learn/llm-course) · [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

## 一、一句话理解大模型

大语言模型（LLM）做的事情只有一件：**根据前面的文字，预测下一个 Token 最可能是什么**，然后把预测出的 Token 接到后面，再预测下一个，循环直到结束。所谓「对话」「写代码」「总结」，都是这个过程反复执行的结果。

它能答对问题，是因为训练时读过海量文本，把语言规律和大量知识压缩进了几百亿个参数里。它也会「一本正经地胡说」（幻觉），因为它只是在生成「看起来最合理」的文字，并不会查证事实。

![大模型应用技术栈](/assets/diagrams/docs/llm-stack.svg)

## 二、Token：模型读写的最小单位

模型不直接处理汉字或单词，而是先用分词器（Tokenizer）切成 Token。英文大约 1 个 Token ≈ 4 个字符，中文在新模型里大约 1 个汉字 ≈ 1 Token（老模型可能 1 字 2 Token）。

| 概念 | 含义 | 为什么重要 |
|---|---|---|
| 输入 Token | 你发给模型的全部内容，含系统提示和历史对话 | 按量计费，历史越长越贵 |
| 输出 Token | 模型生成的内容 | 通常单价是输入的 2~4 倍，也决定响应时间 |
| 上下文窗口 | 一次请求输入 + 输出的总上限，如 128K | 超过就会报错或被截断 |

${F}python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(len(enc.encode("面试题库网站")))   # 看一段文字占多少 Token
${F}

## 三、Transformer 与注意力机制

现在的大模型几乎都基于 **Transformer 解码器**。核心是**自注意力（Self-Attention）**：生成每个 Token 时，模型会给前面所有 Token 打一个「相关度分数」，重点参考相关的部分。比如「小明把书给了小红，她很高兴」，生成「她」相关内容时会重点关注「小红」。

- **多头注意力**：同时从多个角度计算相关度（语法、指代、语义）。
- **位置编码**：注意力本身不知道先后顺序，需要额外加入位置信息，主流用 RoPE。
- **KV Cache**：生成第 N 个 Token 时，前面 Token 的计算结果缓存起来复用，这是推理加速的关键，也是显存占用大户。

## 四、训练三阶段

1. **预训练**：读万亿级 Token 的网页、书籍、代码，学会「接着写」。得到基座模型（Base）。
2. **指令微调（SFT）**：用人工写的「问题-优质回答」对训练，学会按指令回答。
3. **偏好对齐（RLHF / DPO）**：让人比较两个回答哪个更好，训练模型更有用、更安全。

## 五、几个关键参数

- ${C}temperature${C}：随机程度。0~0.3 适合抽取、分类、写代码；0.7~1.0 适合创意写作。
- ${C}top_p${C}：只从累计概率前 p 的候选里采样，一般和 temperature 二选一调整。
- ${C}max_tokens${C}：输出上限，防止失控生成和费用超支。

## ⚠ 常见误区

- **误区：模型知道最新的事**。模型知识停在训练截止日期，最新信息要靠 RAG 或联网工具提供。
- **误区：上下文越长越好**。内容塞太多，中间部分容易被忽略（lost in the middle），还更慢更贵。
- **误区：temperature=0 结果完全固定**。多数服务在 0 时也只是「基本稳定」，不保证每次逐字相同。

## ✅ 自检清单

- 能说清 Token、上下文窗口和计费的关系。
- 能用一句话解释自注意力和 KV Cache 的作用。
- 知道预训练、SFT、RLHF 各自解决什么问题。

## 📚 延伸阅读

- Andrej Karpathy：《Let's build GPT: from scratch》视频
- Jay Alammar：The Illustrated Transformer
- Hugging Face LLM Course 第 1~2 章
`
          },
          {
            id: "ai-llm-terms",
            title: "大模型名词详解：参数量、MoE、对齐、推理模型与多模态",
            minutes: 18,
            updated: "2026-11-20",
            applies: "看懂模型发布公告和评测榜单",
            tags: ["大模型", "LLM", "概念"],
            terms: ["参数量", "MoE", "预训练", "SFT", "RLHF", "DPO", "推理模型", "多模态", "幻觉", "蒸馏", "Scaling Law"],
            body: `
> **官方文档基线**：[Hugging Face · LLM Course](https://huggingface.co/learn/llm-course) · [Hugging Face · Mixture of Experts Explained](https://huggingface.co/blog/moe) · [OpenAI · Reasoning models](https://platform.openai.com/docs/guides/reasoning)

## 一、怎么读懂一个模型名

以 ${C}Qwen2.5-72B-Instruct-AWQ${C} 为例，拆开看：

| 片段 | 含义 |
|---|---|
| Qwen2.5 | 模型系列和版本 |
| 72B | 参数量 720 亿（B = Billion，十亿） |
| Instruct / Chat | 经过指令微调，能对话；不带后缀或带 Base 的只会续写 |
| AWQ / GPTQ / GGUF / Q4 | 量化格式，体积更小，精度略降 |
| 128K | 有时会标上下文窗口长度 |

常见规模：1.5B~8B 可以在单张消费级显卡或笔记本上跑；14B~32B 需要一张 24~80GB 显卡；70B 以上通常要多卡。

## 二、模型从哪来

![一个大模型从训练到上线](/assets/diagrams/docs/llm-lifecycle.svg)

| 名词 | 解释 |
|---|---|
| 预训练（Pre-training） | 在万亿级 Token 上学「预测下一个词」，最耗钱的一步 |
| 基座模型（Base Model） | 预训练的产物，会续写但不会好好回答问题 |
| SFT 监督微调 | 用「指令-回答」样例教它按要求回答 |
| RLHF | 人类给回答排序，训练奖励模型，再用强化学习优化 |
| DPO | 直接用「好回答 vs 差回答」对训练，比 RLHF 简单，开源模型常用 |
| 对齐（Alignment） | 让模型的行为符合人的意图和价值观：有用、诚实、无害 |
| 蒸馏（Distillation） | 用大模型（老师）的输出训练小模型（学生），小模型能力接近而成本低 |
| 合成数据 | 用模型生成的训练数据，弥补人工数据不足 |

## 三、Dense 与 MoE

- **Dense（稠密）模型**：每生成一个 Token，所有参数都参与计算，如 Llama 3 70B。
- **MoE（混合专家）模型**：内部有很多「专家」子网络，每个 Token 只激活其中几个。DeepSeek-V3 总参数 671B，每个 Token 只激活约 37B。

MoE 的好处是「知识容量大、计算量小」；代价是全部参数仍要放进显存，部署门槛高。看 MoE 模型要分清 **总参数** 和 **激活参数**。

## 四、推理模型与思维链

**思维链（Chain of Thought, CoT）**：让模型先写出推理步骤再给答案，数学和逻辑题正确率明显提高。

**推理模型（Reasoning Model）**：把「先想再答」训练进模型本身，回答前自动生成很长的内部思考，如 OpenAI o 系列、DeepSeek-R1。特点是：

- 数学、编程、复杂规划更强；
- 更慢、更贵（思考过程也算 Token）；
- 简单问答没必要用，普通对话模型更快。

**测试时计算（Test-time Compute）** 指推理阶段多花算力换更好答案，是推理模型背后的思路。

## 五、多模态

**多模态**指能同时处理文字以外的信息：

- **视觉理解**：看图回答问题、读截图和表格，如 GPT-4o、Qwen-VL。
- **图像生成**：文生图，常基于扩散模型，如 Stable Diffusion、Midjourney。
- **语音**：ASR 语音转文字（Whisper），TTS 文字转语音，以及端到端实时语音对话。
- **视频生成**：如 Sora、可灵。

**VLM** 是视觉语言模型（Vision Language Model）的缩写。

## 六、能力边界相关

| 名词 | 解释 | 应对 |
|---|---|---|
| 幻觉（Hallucination） | 自信地编造不存在的事实、链接、函数 | RAG 提供资料、要求引用来源、事后校验 |
| 知识截止日期 | 训练数据的最晚时间 | 联网搜索或 RAG 补充新信息 |
| 涌现能力 | 模型变大后突然出现的能力，如多步推理 | 了解即可，学界仍有争议 |
| Scaling Law | 参数、数据、算力按比例增加，损失按规律下降 | 解释了为什么模型越做越大 |
| 开源权重 vs 闭源 | 开源权重可下载自部署（Llama、Qwen、DeepSeek）；闭源只能调 API（GPT、Claude） | 数据敏感选自部署，追求效果先试闭源 |

## 七、怎么看评测榜单

- **MMLU**：57 个学科的选择题，测知识面。
- **GSM8K / MATH / AIME**：数学推理。
- **HumanEval / SWE-bench**：写代码、修真实 GitHub Issue。
- **C-Eval / CMMLU**：中文能力。
- **LMArena（Chatbot Arena）**：真人盲评投票排名，更接近实际体验。

榜单分数可能因为题目泄漏进训练数据而虚高。选型时一定要用自己业务的数据做一轮小评测。

## ⚠ 常见误区

- **误区：参数越大一定越好**。新一代 8B 模型常常超过上一代 70B，训练数据和方法更重要。
- **误区：开源就能随便商用**。要看具体许可证，部分模型限制用户规模或用途。
- **误区：推理模型什么都该用**。简单任务用它只会更慢更贵。

## ✅ 自检清单

- 能读懂模型名里的参数量、Instruct、量化后缀。
- 能说清预训练、SFT、RLHF/DPO 的先后和作用。
- 能区分 MoE 的总参数和激活参数。
- 知道幻觉是什么，以及至少两种缓解办法。

## 📚 延伸阅读

- Hugging Face Blog：Mixture of Experts Explained
- DeepSeek-R1 技术报告
- Andrej Karpathy：《Intro to Large Language Models》视频
`
          },
          {
            id: "ai-prompt",
            title: "Prompt 工程：写出稳定可控的提示词",
            minutes: 18,
            updated: "2026-11-20",
            applies: "所有对话式大模型",
            tags: ["Prompt", "提示词", "Few-shot"],
            terms: ["Prompt", "提示词", "Few-shot", "思维链", "CoT"],
            body: `
> **官方文档基线**：[OpenAI · Prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic · Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [Prompt Engineering Guide](https://www.promptingguide.ai/zh)

## 一、Prompt 的结构

一次 API 调用里的消息分三种角色：

| 角色 | 作用 | 示例 |
|---|---|---|
| system | 设定身份、规则、输出格式，整段对话都生效 | 你是资深 Java 面试官，只回答技术问题 |
| user | 用户的具体请求 | 帮我出 3 道 JVM 面试题 |
| assistant | 模型之前的回答，用于多轮对话或给示例 | （历史回复） |

一个好用的 Prompt 通常包含五部分：**角色、任务、背景资料、约束、输出格式**。

${F}text
你是一名有 10 年经验的后端面试官。
任务：根据候选人的简历，生成 5 道针对性的技术面试题。
简历：<resume>{简历内容}</resume>
要求：
1. 题目要覆盖简历里提到的项目和技术栈
2. 难度从易到难排列
3. 不要出简历里没有涉及的技术
输出格式：JSON 数组，每项包含 question、intent（考察点）、level（1-5）
${F}

## 二、六个最有效的技巧

1. **说清楚，别让模型猜**。「总结一下」不如「用 3 条要点总结，每条不超过 30 字，面向不懂技术的老板」。
2. **用分隔符包裹资料**。用 XML 标签或三引号把资料和指令分开，防止资料里的文字被当成指令。
3. **给示例（Few-shot）**。给 2~5 个输入输出示例，比写一大段规则更管用，尤其是格式和风格。
4. **让模型先想再答（思维链 CoT）**。复杂推理题加上「先一步步分析，再给结论」。推理模型（o 系列、DeepSeek-R1、Claude 扩展思考）已内置这一步，不必再写。
5. **拆分复杂任务**。一个 Prompt 只做一件事；「抽取 → 校验 → 生成」分成多次调用，每步都可测试。
6. **告诉模型不知道时怎么办**。「如果资料里没有答案，回答『资料中未提及』」，能明显减少幻觉。

## 三、Few-shot 示例写法

${F}python
messages = [
    {"role": "system", "content": "把用户评论分类为 正面/负面/中性，只输出类别。"},
    {"role": "user", "content": "物流很快，包装也好"},
    {"role": "assistant", "content": "正面"},
    {"role": "user", "content": "用了两天就坏了"},
    {"role": "assistant", "content": "负面"},
    {"role": "user", "content": comment},   # 真正要分类的评论
]
${F}

示例要覆盖边界情况（比如中性、讽刺），并且各类别数量大致均衡，否则模型会偏向示例多的类别。

## 四、Prompt 也要版本管理和测试

把 Prompt 当代码对待：

- 放进代码仓库或配置中心，带版本号，改动要评审。
- 准备 30~100 条测试用例，每次改 Prompt 都跑一遍，比较准确率，防止「修好一个、弄坏三个」。
- 线上记录 Prompt 版本、输入、输出，出问题能复现。

## ⚠ 踩坑

- **把用户输入直接拼进 system**：用户可以写「忽略之前的指令」进行提示词注入，用户内容必须放 user 消息并用分隔符包裹。
- **否定句太多**：「不要输出 Markdown」有时反而诱导输出 Markdown，改成正面描述「输出纯文本」。
- **一次要求太多**：十几条规则时模型会顾此失彼，按重要性排序，最重要的放最前和最后。

## ✅ 自检清单

- Prompt 是否写明了角色、任务、资料、约束和输出格式？
- 是否有一组固定测试用例验证改动效果？
- 用户输入是否和指令隔离？

## 📚 延伸阅读

- OpenAI Cookbook：Techniques to improve reliability
- Anthropic：Use XML tags / Chain of thought prompting
- 论文：Chain-of-Thought Prompting Elicits Reasoning in Large Language Models
`
          },
          {
            id: "ai-api",
            title: "调用大模型 API：流式输出、结构化输出与错误重试",
            minutes: 18,
            updated: "2026-11-20",
            applies: "OpenAI 兼容接口（DeepSeek、通义千问、Kimi、vLLM 等）",
            tags: ["API", "流式", "JSON"],
            terms: ["大模型", "API", "流式", "JSON", "LLM"],
            body: `
> **官方文档基线**：[OpenAI · Chat Completions API](https://platform.openai.com/docs/api-reference/chat) · [OpenAI · Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Anthropic · Messages API](https://docs.anthropic.com/en/api/messages)

## 一、最小可用调用

国内主流模型服务（DeepSeek、通义千问、Kimi、智谱）和自建的 vLLM 都兼容 OpenAI 接口格式，学会一套就能换着用，只需改 ${C}base_url${C}、${C}api_key${C} 和 ${C}model${C}。

${F}python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],          # 密钥放环境变量，不要写进代码
    base_url="https://api.deepseek.com",        # 换成对应厂商地址
)
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是简洁的技术助手"},
        {"role": "user", "content": "一句话解释 Redis 是什么"},
    ],
    temperature=0.3,
    max_tokens=300,
)
print(resp.choices[0].message.content)
print(resp.usage)   # prompt_tokens / completion_tokens，用来算成本
${F}

API 是**无状态**的：服务端不记得上一轮说了什么，多轮对话要把历史消息每次都带上。

## 二、流式输出

等模型完整生成可能要十几秒，流式输出让第一个字在 1 秒内出现，体验差别很大。

${F}python
stream = client.chat.completions.create(model="deepseek-chat", messages=msgs, stream=True)
for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
${F}

后端转发给浏览器时一般用 **SSE（Server-Sent Events）**：响应头 ${C}Content-Type: text/event-stream${C}，每段数据以 ${C}data: ...${C} 加空行结尾。Nginx 要关闭缓冲（${C}proxy_buffering off${C}），否则会攒满一批才下发。

## 三、结构化输出：让程序能直接用结果

业务里最常见的需求是「从文本中抽取字段」，必须拿到合法 JSON。可靠程度从低到高：

| 方式 | 做法 | 可靠性 |
|---|---|---|
| 只在 Prompt 里要求 | 「请输出 JSON」 | 偶尔多出解释文字或格式错误 |
| JSON Mode | ${C}response_format={"type": "json_object"}${C} | 保证是合法 JSON，不保证字段对 |
| Structured Outputs | 传入 JSON Schema，模型严格按结构生成 | 字段和类型都有保证 |

${F}python
from pydantic import BaseModel

class Candidate(BaseModel):
    name: str
    years: int
    skills: list[str]

resp = client.beta.chat.completions.parse(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": resume_text}],
    response_format=Candidate,
)
c = resp.choices[0].message.parsed   # 直接是 Candidate 对象
${F}

不支持 Schema 的模型，就用 Pydantic 做校验，失败时把错误信息回传给模型让它修正，最多重试 2 次。

## 四、生产环境必须处理的错误

| 状态码 | 原因 | 处理 |
|---|---|---|
| 429 | 超过速率或并发限制 | 指数退避重试（1s、2s、4s + 随机抖动） |
| 500 / 503 | 服务端过载 | 重试，多次失败切备用模型 |
| 400 | 参数错误或上下文超长 | 不要重试，截断历史或修正参数 |
| 超时 | 生成太长 | 设置合理超时，流式请求按「首字超时」判断 |

${F}python
from tenacity import retry, stop_after_attempt, wait_random_exponential

@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(4))
def chat(msgs):
    return client.chat.completions.create(model="deepseek-chat", messages=msgs, timeout=60)
${F}

## ⚠ 踩坑

- **前端直接调模型 API**：密钥会暴露，任何人都能刷你的额度，必须经过自己的后端转发。
- **不记录 usage**：月底账单超预期才发现，上线就要按用户、按功能统计 Token。
- **多轮对话无限增长**：保留最近 N 轮，更早的内容用模型总结成一段摘要。

## ✅ 自检清单

- 能写出带流式、超时、重试的调用代码。
- 知道 JSON Mode 和 Structured Outputs 的区别。
- 密钥在后端、用量有统计、上下文有上限。

## 📚 延伸阅读

- OpenAI Cookbook：How to stream completions / How to handle rate limits
- MDN：Using server-sent events
`
          },
          {
            id: "ai-app-terms",
            title: "AI 应用开发名词：Prompt、RAG、Agent、MCP 一次讲清",
            minutes: 15,
            updated: "2026-11-20",
            applies: "产品、开发、测试都能看懂的 AI 应用术语",
            tags: ["AI 应用", "Agent", "概念"],
            terms: ["System Prompt", "Few-shot", "RAG", "向量数据库", "Agent", "Function Calling", "MCP", "A2A", "Copilot", "AIGC"],
            body: `
> **官方文档基线**：[OpenAI · Function calling](https://platform.openai.com/docs/guides/function-calling) · [Anthropic · Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) · [Model Context Protocol](https://modelcontextprotocol.io/introduction)

## 一、和模型对话的名词

| 名词 | 一句话解释 |
|---|---|
| Prompt 提示词 | 发给模型的全部输入，包括指令、资料、示例 |
| System Prompt 系统提示 | 设定角色、规则、输出格式，整段对话都生效 |
| Zero-shot / Few-shot | 不给示例直接做 / 先给几个示例再做 |
| CoT 思维链 | 让模型「一步一步想」，先推理再给答案 |
| 上下文（Context） | 模型这次能看到的所有内容，包括历史对话 |
| 上下文工程 | 精心挑选放进上下文的资料、工具和记忆，比措辞技巧更重要 |
| 结构化输出 | 让模型按 JSON Schema 返回，方便程序解析 |
| 流式输出（Streaming） | 边生成边返回，打字机效果 |
| 多轮对话 | 每次请求都把历史消息带上，模型本身不记得上一次 |

**生成参数**：${C}temperature${C} 控制随机性，越低越稳定；${C}top_p${C} 限制候选词范围；${C}max_tokens${C} 限制输出长度；${C}stop${C} 遇到指定字符就停。

## 二、给模型补知识：RAG

**RAG（检索增强生成）**：先从知识库里搜出相关资料，再连同问题一起交给模型回答。相当于「开卷考试」。

![RAG 检索增强生成流程](/assets/diagrams/docs/rag-pipeline.svg)

| 名词 | 解释 |
|---|---|
| Chunk 切块 | 把长文档切成几百字的小段，方便检索 |
| Embedding 向量化 | 把文本变成向量，语义相近的向量距离近 |
| 向量数据库 | 存向量并快速找「最相似」的库，如 Milvus、pgvector、Elasticsearch |
| 召回 Top-K | 找出最相似的 K 段资料 |
| 混合检索 | 向量检索 + 关键词检索（BM25）结合，专有名词更准 |
| Rerank 重排 | 用专门模型给召回结果重新打分排序 |
| GraphRAG | 先从文档抽取实体关系图谱，再按图检索，适合跨文档综合问题 |

## 三、让模型做事：Agent

**Function Calling / Tool Use（工具调用）**：告诉模型有哪些函数可用，模型决定调用哪个、传什么参数，由你的程序执行，再把结果交还模型。

**Agent（智能体）**：模型在一个循环里自己规划步骤、调用工具、观察结果、决定下一步，直到完成任务。

![Agent 工具调用循环](/assets/diagrams/docs/agent-loop.svg)

| 名词 | 解释 |
|---|---|
| ReAct | 「思考 → 行动 → 观察」循环，最经典的 Agent 模式 |
| 工作流（Workflow） | 步骤由程序写死，模型只负责其中某些环节；比 Agent 更可控 |
| 规划（Planning） | 把大任务拆成子任务 |
| 记忆（Memory） | 短期记忆是当前对话，长期记忆存进数据库按需取回 |
| 多智能体（Multi-Agent） | 多个分工不同的 Agent 协作，如「写代码 + 审代码」 |
| MCP 模型上下文协议 | Anthropic 提出的开放标准，统一 AI 应用接入工具和数据源的方式，像 AI 的 USB 接口 |
| A2A | Google 提出的 Agent 之间互相通信协作的协议 |
| Computer Use / 浏览器 Agent | 让模型看屏幕截图、操作鼠标键盘完成任务 |
| Human-in-the-loop | 关键步骤需要人确认后才执行 |

## 四、产品形态名词

- **AIGC**：AI 生成内容，泛指 AI 写的文字、画的图、做的视频。
- **Copilot（副驾驶）**：嵌入现有软件里辅助人工作，人做决定，如 GitHub Copilot。
- **Chatbot**：对话机器人，如智能客服。
- **AI 编程助手 / Coding Agent**：能读代码库、改代码、跑测试，如 Cursor、Claude Code、Codex。
- **低代码 Agent 平台**：拖拽搭建 AI 应用，如 Dify、Coze、FastGPT。
- **开发框架**：LangChain、LlamaIndex、Spring AI 等，封装了模型调用、RAG、Agent 的常用代码。

## 五、怎么选方案

| 需求 | 优先方案 |
|---|---|
| 改输出风格、格式 | Prompt |
| 回答要基于公司内部文档 | RAG |
| 要查数据库、调接口、发消息 | Function Calling |
| 多步骤且步骤不固定 | Agent |
| 步骤固定、要求稳定 | Workflow |
| 固定格式、特定领域风格且量很大 | 微调 |

## ⚠ 常见误区

- **误区：Agent 越自主越好**。自主性越高越难控制，能用固定工作流解决的就别上 Agent。
- **误区：有 RAG 就不会幻觉**。检索不到正确资料时模型仍会编，要让它「找不到就说不知道」。
- **误区：MCP 是一种模型**。它是一个协议，规定应用和工具怎么对接，和用哪家模型无关。

## ✅ 自检清单

- 能区分 Prompt、RAG、微调各解决什么问题。
- 能解释 Function Calling 中模型和程序各干什么。
- 能说清 Agent 和 Workflow 的区别。
- 知道 MCP 和 A2A 分别连接什么。

## 📚 延伸阅读

- Anthropic：Building effective agents
- Lilian Weng：LLM Powered Autonomous Agents
- MCP 官方文档 Introduction 与 Architecture
`
          },
          {
            id: "ai-glossary",
            title: "AI 大模型名词速查表（80 个高频术语）",
            minutes: 12,
            updated: "2026-11-20",
            applies: "随时查阅，面试前快速过一遍",
            tags: ["AI", "名词", "速查"],
            terms: ["AI 名词", "大模型术语", "LLM 术语", "AGI", "Transformer", "Token", "LoRA", "vLLM"],
            body: `
> **官方文档基线**：[Google · Machine Learning Glossary](https://developers.google.com/machine-learning/glossary) · [Hugging Face · Glossary](https://huggingface.co/docs/transformers/glossary) · [NVIDIA · Glossary](https://www.nvidia.com/en-us/glossary/)

按主题分组，每个词一句话。想深入了解，可以看本方向对应的详细章节。

## 一、基础概念

| 术语 | 中文 | 一句话解释 |
|---|---|---|
| AI | 人工智能 | 让机器表现出智能行为的技术总称 |
| AGI | 通用人工智能 | 在几乎所有任务上达到人类水平的 AI，目前尚未实现 |
| ML | 机器学习 | 从数据中自动学习规律 |
| DL | 深度学习 | 用多层神经网络做机器学习 |
| Model | 模型 | 学到规律后的数学函数 |
| Parameter / Weight | 参数 / 权重 | 模型里可调的数字，7B 即 70 亿个 |
| Training | 训练 | 用数据调整参数的过程 |
| Inference | 推理 | 用训练好的模型做预测，参数不变 |
| Dataset | 数据集 | 训练用的数据，分训练、验证、测试集 |
| Label | 标签 | 样本的正确答案 |
| Loss | 损失 | 预测和正确答案的差距 |
| Gradient Descent | 梯度下降 | 沿损失下降最快的方向更新参数 |
| Overfitting | 过拟合 | 训练集好、新数据差，死记硬背 |
| Hyperparameter | 超参数 | 训练前人为设定的值，如学习率 |
| Benchmark | 基准测试 | 标准化的评测题集，如 MMLU |

## 二、神经网络

| 术语 | 中文 | 一句话解释 |
|---|---|---|
| Neural Network | 神经网络 | 多层神经元连接成的模型 |
| Activation | 激活函数 | 引入非线性，如 ReLU、GELU |
| Backpropagation | 反向传播 | 从输出往回计算梯度 |
| Epoch / Batch | 轮次 / 批次 | 完整过一遍数据 / 一次喂多少条 |
| Learning Rate | 学习率 | 每次参数更新的步长 |
| Optimizer | 优化器 | 决定怎么更新参数，如 AdamW |
| Dropout | 随机失活 | 训练时随机关神经元防过拟合 |
| CNN | 卷积神经网络 | 擅长图像 |
| RNN / LSTM | 循环神经网络 | 按顺序处理序列，已被 Transformer 取代 |
| Transformer | — | 基于注意力的架构，当前大模型的基础 |
| Attention | 注意力 | 计算每个位置该重点关注哪些位置 |
| Embedding | 嵌入 / 向量 | 把文字等变成表示语义的数字向量 |
| Encoder / Decoder | 编码器 / 解码器 | 理解输入 / 生成输出 |
| Diffusion | 扩散模型 | 从噪声逐步去噪生成图像 |

## 三、大模型

| 术语 | 中文 | 一句话解释 |
|---|---|---|
| LLM | 大语言模型 | 海量文本训练的超大 Transformer |
| Foundation Model | 基础模型 | 可适配多种下游任务的大模型 |
| Token | 词元 | 模型处理文本的最小单位 |
| Tokenizer | 分词器 | 把文本切成 Token |
| Context Window | 上下文窗口 | 一次请求能处理的 Token 上限 |
| Pre-training | 预训练 | 海量数据上学预测下一个词 |
| Base / Instruct | 基座 / 指令模型 | 只会续写 / 会按指令回答 |
| SFT | 监督微调 | 用问答样例教模型回答 |
| RLHF | 人类反馈强化学习 | 用人类偏好训练模型 |
| DPO | 直接偏好优化 | 不用奖励模型的偏好对齐方法 |
| Alignment | 对齐 | 让模型有用、诚实、无害 |
| MoE | 混合专家 | 每个 Token 只激活部分参数 |
| Reasoning Model | 推理模型 | 先长时间思考再回答，如 o 系列、R1 |
| CoT | 思维链 | 先写推理步骤再给答案 |
| Multimodal | 多模态 | 同时处理文本、图像、语音等 |
| VLM | 视觉语言模型 | 能看图的大模型 |
| Hallucination | 幻觉 | 编造不真实的内容 |
| Distillation | 蒸馏 | 大模型教小模型 |
| Scaling Law | 缩放定律 | 规模越大损失越低的经验规律 |
| Open Weights | 开源权重 | 权重可下载自部署 |

## 四、应用开发

| 术语 | 中文 | 一句话解释 |
|---|---|---|
| Prompt | 提示词 | 给模型的输入指令 |
| System Prompt | 系统提示词 | 全局角色和规则设定 |
| Few-shot | 少样本 | 在提示里给几个示例 |
| Temperature | 温度 | 控制输出随机性 |
| Structured Output | 结构化输出 | 按 JSON Schema 返回 |
| RAG | 检索增强生成 | 先检索资料再回答 |
| Vector DB | 向量数据库 | 按语义相似度检索 |
| Rerank | 重排序 | 对召回结果精细打分 |
| Function Calling | 函数调用 | 模型决定调用哪个工具 |
| Agent | 智能体 | 自主规划、调用工具完成任务 |
| Workflow | 工作流 | 预先编排好的固定步骤 |
| MCP | 模型上下文协议 | AI 应用接入工具和数据的统一标准 |
| A2A | 智能体互联协议 | Agent 之间通信协作的标准 |
| Guardrails | 护栏 | 对输入输出做安全检查 |
| Prompt Injection | 提示注入 | 用恶意文本劫持模型指令 |
| Eval | 评测 | 用测试集衡量应用效果 |
| LLM-as-a-Judge | 模型当裁判 | 用大模型给回答打分 |

## 五、训练、部署与算力

| 术语 | 中文 | 一句话解释 |
|---|---|---|
| Fine-tuning | 微调 | 在已有模型上用少量数据继续训练 |
| LoRA / QLoRA | 低秩适配 | 只训练很少的附加参数，省显存 |
| PEFT | 参数高效微调 | LoRA 等方法的统称 |
| Quantization | 量化 | 降低参数精度以省显存 |
| BF16 / FP8 / INT4 | 数值精度 | 每参数 2 / 1 / 0.5 字节 |
| GPU / VRAM | 显卡 / 显存 | 算力和模型存放位置 |
| FLOPS | 每秒浮点运算 | 衡量算力 |
| KV Cache | 键值缓存 | 缓存注意力结果加速生成 |
| TTFT | 首字延迟 | 多久出第一个 Token |
| Throughput | 吞吐量 | 单位时间处理的 Token 总数 |
| vLLM | — | 主流开源高性能推理引擎 |
| Ollama | — | 本地一键运行模型的工具 |
| CUDA | — | NVIDIA GPU 编程平台 |
| Tensor Parallel | 张量并行 | 把一层拆到多卡计算 |

## ⚠ 常见误区

- **误区：Inference 翻译成「推理」就是逻辑推理**。在部署语境里它指「运行模型得到输出」，和推理模型的 Reasoning 不是一回事。
- **误区：Token 等于字数**。中英文、不同模型的换算比例都不同，要用分词器实际计算。
- **误区：开源模型等于开源**。多数只开放权重，训练数据和代码并不公开。

## ✅ 自检清单

- 每组随机挑 5 个词，能用自己的话讲清楚。
- 能分清 Inference 和 Reasoning、Base 和 Instruct、RAG 和微调。

## 📚 延伸阅读

- Google Machine Learning Glossary（可按字母检索）
- Hugging Face Transformers Glossary
- 本方向「AI 入门概念地图」「大模型名词详解」「AI 算力与工程名词」章节
`
          },
        ]
      },
      {
        id: "mid",
        name: "中级",
        desc: "能独立搭建 RAG 知识库问答、实现工具调用和 Agent，并把它们接进业务系统。",
        chapters: [
          // <ai-mid>
          {
            id: "ai-embedding",
            title: "Embedding 与向量数据库：让程序理解「意思相近」",
            minutes: 16,
            updated: "2026-11-20",
            applies: "bge / text-embedding-3 / Milvus / pgvector / Elasticsearch",
            tags: ["Embedding", "向量", "向量数据库"],
            terms: ["向量", "Embedding", "Milvus", "相似度"],
            body: `
> **官方文档基线**：[OpenAI · Embeddings](https://platform.openai.com/docs/guides/embeddings) · [Milvus Docs](https://milvus.io/docs) · [pgvector README](https://github.com/pgvector/pgvector) · [MTEB 排行榜](https://huggingface.co/spaces/mteb/leaderboard)

## 一、Embedding 是什么

Embedding 模型把一段文字变成一串固定长度的数字（向量），比如 1024 维。**意思相近的文字，向量在空间里距离也近**。「怎么重置密码」和「忘记密码怎么办」字面不同，向量却很接近，这是关键词搜索做不到的。

${F}python
vec = client.embeddings.create(model="text-embedding-3-small", input="忘记密码怎么办").data[0].embedding
print(len(vec))   # 1536
${F}

中文场景常用开源模型：**bge-m3、bge-large-zh、gte、Qwen3-Embedding**，可以本地部署，数据不出内网。选型参考 MTEB 中文榜单，并一定用自己的数据测一遍。

## 二、相似度怎么算

| 方法 | 公式含义 | 说明 |
|---|---|---|
| 余弦相似度 | 两个向量夹角的余弦，-1 到 1 | 最常用，只看方向不看长度 |
| 点积 | 对应位相乘再求和 | 向量已归一化时等价于余弦，计算更快 |
| 欧氏距离 L2 | 两点直线距离 | 越小越相似 |

⚠ 入库和查询要用**同一个模型、同一种度量方式**。换了 Embedding 模型，全部数据都要重新向量化。

## 三、为什么需要向量数据库

100 万条 1024 维向量，逐条计算相似度太慢。向量数据库用**近似最近邻（ANN）索引**，牺牲一点点准确率换取毫秒级查询。

| 索引 | 原理 | 特点 |
|---|---|---|
| HNSW | 多层「小世界」图，从上层粗跳到下层细找 | 召回高、速度快，内存占用大，最常用 |
| IVF | 先聚类分桶，只搜最近的几个桶 | 内存省，参数 nprobe 控制精度 |
| PQ 量化 | 把向量压缩成短编码 | 亿级数据省内存，精度有损失 |

## 四、怎么选向量库

| 方案 | 适合场景 |
|---|---|
| **pgvector** | 已经在用 PostgreSQL、数据在千万级以内，最省运维 |
| **Milvus** | 亿级向量、需要分布式扩展的专业场景 |
| **Elasticsearch / OpenSearch** | 已有 ES，想同时做关键词 + 向量混合检索 |
| **Chroma / FAISS** | 本地原型验证、单机小数据 |
| Redis Stack / Qdrant / Weaviate | 也很常见，按团队技术栈选择 |

${F}sql
-- pgvector 示例
CREATE EXTENSION vector;
CREATE TABLE doc_chunk (id bigserial PRIMARY KEY, content text, embedding vector(1024));
CREATE INDEX ON doc_chunk USING hnsw (embedding vector_cosine_ops);
-- <=> 是余弦距离，越小越近
SELECT id, content FROM doc_chunk ORDER BY embedding <=> $1 LIMIT 5;
${F}

## 五、元数据过滤

实际业务要按权限、部门、时间筛选。把这些字段作为元数据和向量一起存，查询时先过滤再算相似度，避免员工检索到无权查看的文档。

## ⚠ 踩坑

- **文本太长直接向量化**：超过模型最大长度会被截断，后半段内容丢失，必须先切块。
- **只用向量检索**：型号、错误码、人名这类精确词，向量检索反而不准，要配合关键词（BM25）混合检索。
- **不评测召回率**：上线前准备问题和标准答案所在文档，统计 Top-5 命中率。

## ✅ 自检清单

- 能解释 Embedding、余弦相似度和 HNSW 的作用。
- 能根据数据规模和现有技术栈选向量库。
- 知道换 Embedding 模型需要全量重建。

## 📚 延伸阅读

- Pinecone Learn：Vector Database / HNSW 图解
- 论文：Efficient and robust approximate nearest neighbor search using HNSW graphs
`
          },
          {
            id: "ai-rag",
            title: "RAG 知识库问答：从切块到重排的完整链路",
            minutes: 22,
            updated: "2026-11-20",
            applies: "LangChain / LlamaIndex / 自研均适用",
            tags: ["RAG", "检索增强", "知识库"],
            terms: ["RAG", "检索增强", "知识库", "召回", "Rerank"],
            body: `
> **官方文档基线**：[LangChain · Build a RAG App](https://python.langchain.com/docs/tutorials/rag/) · [LlamaIndex · Understanding RAG](https://docs.llamaindex.ai/en/stable/understanding/rag/) · [OpenAI · Retrieval](https://platform.openai.com/docs/guides/retrieval)

## 一、RAG 解决什么问题

大模型不知道你公司的内部文档，也不知道昨天的新闻。**RAG（检索增强生成）**的思路很朴素：先从资料库里找出和问题相关的几段原文，塞进 Prompt，让模型「照着资料回答」。相比微调，RAG 更新资料只需重新入库，还能给出答案出处。

![RAG 检索增强生成流程](/assets/diagrams/docs/rag-pipeline.svg)

## 二、离线：建索引

**1. 文档解析**。PDF、Word、网页先转成纯文本或 Markdown。表格和图片是难点：表格要保留行列结构，扫描件要 OCR。解析质量直接决定上限。

**2. 切块（Chunking）**。块太大，检索不准还浪费 Token；块太小，丢失上下文。

| 策略 | 做法 | 适合 |
|---|---|---|
| 固定长度 | 每 500 字一块，重叠 50 字 | 简单通用的起点 |
| 按结构 | 按标题、段落、列表切分 | 技术文档、制度文件，效果通常最好 |
| 父子块 | 用小块检索，命中后返回所在大段 | 兼顾检索精度和上下文完整 |

每个块都要带上**元数据**：来源文件、标题路径、更新时间、权限。把「所属章节标题」拼到块开头，检索效果会明显提升。

**3. 向量化入库**。见上一章 Embedding。

## 三、在线：检索与生成

${F}python
def answer(question: str) -> str:
    q = rewrite(question)                          # 1. 结合历史改写成完整问题
    hits = hybrid_search(q, top_k=20)              # 2. 向量 + BM25 混合召回
    hits = rerank(q, hits)[:5]                     # 3. 用重排模型精选 5 段
    context = "\\n\\n".join(f"[{i+1}] {h.text}" for i, h in enumerate(hits))
    prompt = f"""根据下面的资料回答问题，并在句末标注引用编号如 [1]。
资料中没有答案时，回答“资料中未找到相关内容”。
<docs>
{context}
</docs>
问题：{q}"""
    return llm(prompt)
${F}

- **查询改写**：用户第二轮问「那它怎么配置」，单独检索「它」毫无意义，要先改写成「Redis 哨兵怎么配置」。
- **混合检索**：向量负责语义，BM25 负责精确词，两路结果用 RRF（倒数排名融合）合并。
- **重排（Rerank）**：用 bge-reranker 等交叉编码模型，对问题和每段资料逐对打分。召回 20 条再精排到 5 条，是性价比最高的优化。

## 四、效果不好怎么排查

先判断问题出在哪一段：

1. **正确资料根本没被召回** → 检索问题：检查切块、换 Embedding、加混合检索、做查询改写。
2. **召回了但排在后面没用上** → 加重排，或调大 Top-K。
3. **资料给了但答错或编造** → 生成问题：强化 Prompt 约束、换更强模型、减少无关资料干扰。

评测常用指标（RAGAS 框架）：**上下文召回率、上下文精确率、答案忠实度、答案相关性**。准备 100 条左右「问题 + 标准答案 + 出处」的测试集，每次改动都跑一遍。

## 五、进阶形态

- **GraphRAG**：先从文档抽取实体关系建知识图谱，适合「总结全部文档的主题」这类全局问题。
- **Agentic RAG**：让模型自己决定要不要检索、检索几次、用什么关键词。
- **长上下文 vs RAG**：资料只有几十页时，直接全塞进 128K 上下文可能更简单；资料成千上万份时仍需 RAG。

## ⚠ 踩坑

- **忽视权限**：检索时不按用户权限过滤，会把薪资表答给普通员工。
- **文档更新后不重建**：要有增量同步机制，按文件哈希判断是否需要重新入库。
- **只看 Demo 效果**：几条问题答得好不代表上线可用，必须有测试集。

## ✅ 自检清单

- 能画出离线建索引和在线问答两条链路。
- 能说出混合检索、重排、查询改写各解决什么问题。
- 能按「召回 → 排序 → 生成」三段定位效果问题。

## 📚 延伸阅读

- 论文：Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks（Lewis et al., 2020）
- RAGAS 文档：Metrics
- Microsoft GraphRAG 项目文档
`
          },
          {
            id: "ai-agent",
            title: "Agent 与工具调用：Function Calling、ReAct 和多步任务",
            minutes: 20,
            updated: "2026-11-20",
            applies: "OpenAI / Anthropic / Qwen 等支持 Tool Use 的模型",
            tags: ["Agent", "Function Calling", "ReAct"],
            terms: ["Agent", "智能体", "Function Calling", "工具调用", "ReAct"],
            body: `
> **官方文档基线**：[OpenAI · Function calling](https://platform.openai.com/docs/guides/function-calling) · [Anthropic · Tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) · [Anthropic · Building effective agents](https://www.anthropic.com/research/building-effective-agents)

## 一、Agent 是什么

普通调用是「问一次、答一次」。Agent 则让模型**自己决定下一步做什么**：需要查天气就调天气接口，需要算数就调计算器，拿到结果后再判断是继续调用还是给出最终答案。

可以记成一个公式：**Agent = 大模型（大脑）+ 工具（手脚）+ 记忆 + 循环控制**。

![Agent 循环](/assets/diagrams/docs/agent-loop.svg)

## 二、Function Calling：模型如何「调用」工具

模型本身不会执行任何代码。流程是：

1. 你把工具的名字、用途、参数 JSON Schema 发给模型；
2. 模型判断需要工具时，返回「要调用哪个工具、参数是什么」；
3. **你的程序**真正执行工具，把结果作为一条 tool 消息发回去；
4. 模型基于结果继续推理，直到不再请求工具。

${F}python
tools = [{
    "type": "function",
    "function": {
        "name": "get_order",
        "description": "按订单号查询订单状态",
        "parameters": {
            "type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"],
        },
    },
}]

messages = [{"role": "user", "content": "订单 A1024 到哪了？"}]
for step in range(5):                      # 一定要有最大步数
    resp = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
    msg = resp.choices[0].message
    messages.append(msg)
    if not msg.tool_calls:                 # 没有工具调用 = 最终答案
        print(msg.content)
        break
    for call in msg.tool_calls:
        args = json.loads(call.function.arguments)
        result = TOOLS[call.function.name](**args)
        messages.append({"role": "tool", "tool_call_id": call.id,
                         "content": json.dumps(result, ensure_ascii=False)})
${F}

## 三、ReAct：边想边做

ReAct（Reason + Act）让模型交替输出「思考 → 行动 → 观察」：

| 步骤 | 内容示例 |
| --- | --- |
| Thought | 用户问订单位置，需要先查订单 |
| Action | get_order(order_id="A1024") |
| Observation | {"status": "运输中", "city": "杭州"} |
| Thought | 已拿到结果，可以回答 |
| Answer | 您的订单正在杭州运输中 |

现在的 Function Calling 本质上就是把 ReAct 做进了模型和接口里，不再需要手写解析「Action:」文本。

## 四、常见架构模式

按 Anthropic《Building effective agents》的分类，**能用固定流程就别用自主 Agent**：

- **提示链（Prompt chaining）**：步骤固定，上一步输出喂给下一步，例如「提纲 → 正文 → 校对」。
- **路由（Routing）**：先分类，再交给不同 Prompt 或模型处理。
- **并行（Parallelization）**：多个子任务同时跑，最后汇总。
- **编排者-执行者（Orchestrator-workers）**：一个模型拆任务，多个模型执行。
- **自主 Agent**：步骤数不确定，模型自己循环，适合开放式任务，成本和风险最高。

## 五、记忆

- **短期记忆**：就是 messages 列表，超长时要摘要或截断早期轮次。
- **长期记忆**：把用户偏好、历史结论写进数据库或向量库，下次按需检索，本质上是 RAG。

## ⚠ 踩坑

- **没有最大步数**：模型反复调用同一个工具，账单失控。
- **工具描述含糊**：模型选错工具，大部分「Agent 不聪明」其实是工具名和描述写得差。
- **写操作不确认**：删除、转账、发邮件类工具必须人工确认或限制权限。
- **参数不校验**：模型给的参数可能缺字段或类型错，执行前按 Schema 校验。

## ✅ 自检清单

- 能说清 Function Calling 中「谁决定调用、谁真正执行」。
- 能写出带最大步数的工具调用循环。
- 能说出至少三种比自主 Agent 更简单的编排模式。

## 📚 延伸阅读

- 论文：ReAct: Synergizing Reasoning and Acting in Language Models（Yao et al., 2022）
- Anthropic：Building effective agents
- OpenAI Agents SDK 文档
`
          },
          {
            id: "ai-mcp",
            title: "MCP 协议与 LangChain / LangGraph 开发框架",
            minutes: 18,
            updated: "2026-11-20",
            applies: "MCP 2025 规范 / LangChain 0.3+ / LangGraph",
            tags: ["MCP", "LangChain", "LangGraph"],
            terms: ["MCP", "LangChain", "LangGraph", "Agent", "大模型"],
            body: `
> **官方文档基线**：[Model Context Protocol](https://modelcontextprotocol.io/introduction) · [LangChain Docs](https://python.langchain.com/docs/introduction/) · [LangGraph Docs](https://langchain-ai.github.io/langgraph/)

## 一、MCP 解决什么问题

每个 AI 应用都要接 GitHub、数据库、文件系统、浏览器……如果每个应用为每个工具各写一套适配，就是 M×N 的工作量。**MCP（Model Context Protocol）** 是 Anthropic 2024 年底开源的协议，被称为「AI 的 USB-C 接口」：工具方写一次 MCP Server，所有支持 MCP 的客户端（Claude Desktop、Cursor、VS Code 等）都能直接用。

## 二、三个角色与三类能力

| 角色 | 说明 |
| --- | --- |
| Host | 用户使用的 AI 应用，如 Claude Desktop、IDE |
| Client | Host 内部与某个 Server 保持一对一连接的组件 |
| Server | 对外暴露能力的轻量程序，如 GitHub Server、Postgres Server |

Server 可以暴露三类能力：

- **Tools（工具）**：模型可以调用的函数，例如「创建 Issue」。
- **Resources（资源）**：可读取的数据，例如文件内容、表结构。
- **Prompts（提示模板）**：预置的提示词工作流。

通信基于 **JSON-RPC 2.0**，传输方式有本地的 **stdio** 和远程的 **Streamable HTTP**。

## 三、写一个最小 MCP Server

${F}python
# pip install "mcp[cli]"
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")

@mcp.tool()
def get_weather(city: str) -> str:
    """查询城市当前天气"""
    return f"{city}：晴，22℃"

if __name__ == "__main__":
    mcp.run()          # 默认 stdio 传输
${F}

在客户端配置里登记启动命令后，模型就能看到并调用 get_weather。函数的类型注解和文档字符串会自动变成工具的参数 Schema 与描述。

## 四、LangChain：组件库

LangChain 把大模型应用拆成可组合的积木：模型（ChatModel）、提示模板、输出解析器、文档加载器、切块器、向量库、检索器。用 ${C}|${C} 把它们串起来（LCEL 语法）：

${F}python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template("用一句话解释：{topic}")
chain = prompt | ChatOpenAI(model="gpt-4o-mini")
print(chain.invoke({"topic": "向量数据库"}).content)
${F}

## 五、LangGraph：有状态的流程图

复杂 Agent 需要分支、循环、人工审批、断点恢复，单纯的链表达不了。LangGraph 用**状态图**描述流程：节点是函数，边决定下一步，状态在节点间传递并可持久化。

${F}python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(model="openai:gpt-4o-mini", tools=[get_weather])
agent.invoke({"messages": [("user", "北京天气怎么样")]})
${F}

## 六、怎么选

| 场景 | 建议 |
| --- | --- |
| 简单问答、单次调用 | 直接用官方 SDK，少一层依赖 |
| RAG、组件拼装 | LangChain 或 LlamaIndex |
| 多步 Agent、人工审批、可恢复 | LangGraph |
| 让 IDE/桌面助手接入内部系统 | 写 MCP Server |

## ⚠ 误区

- **把 MCP 当成框架**：它只是协议，和 LangChain 不冲突，LangChain 也可以作为 MCP Client 使用工具。
- **随便装第三方 MCP Server**：Server 能读文件、执行命令，等同于装软件，要审查来源和权限。
- **框架版本漂移**：LangChain 接口变化快，锁定版本并以官方文档为准。

## ✅ 自检清单

- 能说出 MCP 的 Host / Client / Server 和 Tools / Resources / Prompts。
- 能写一个暴露单个工具的 MCP Server。
- 能根据场景在 SDK、LangChain、LangGraph 之间做选择。

## 📚 延伸阅读

- MCP 规范：modelcontextprotocol.io/specification
- LangGraph 教程：Introduction to LangGraph
`
          },
        ]
      },
      {
        id: "adv",
        name: "高级",
        desc: "能做微调与私有化部署，建立评测体系，处理成本、延迟和安全问题。",
        chapters: [
          // <ai-adv>
          {
            id: "ai-infra-terms",
            title: "AI 算力与工程名词：GPU、显存、精度、并行与推理指标",
            minutes: 17,
            updated: "2026-11-20",
            applies: "做私有化部署、算力采购、性能优化前的必备概念",
            tags: ["GPU", "算力", "概念"],
            terms: ["GPU", "显存", "FLOPs", "BF16", "量化", "KV Cache", "TTFT", "吞吐", "张量并行", "CUDA", "NCCL"],
            body: `
> **官方文档基线**：[NVIDIA · Glossary](https://www.nvidia.com/en-us/glossary/) · [Hugging Face · Efficient Training on Multiple GPUs](https://huggingface.co/docs/transformers/perf_train_gpu_many) · [vLLM Documentation](https://docs.vllm.ai/)

## 一、为什么大模型离不开 GPU

神经网络的计算几乎全是矩阵乘法，可以拆成成千上万个小计算同时做。CPU 有几十个强核心，GPU 有上万个简单核心，做这种并行计算快几十到上百倍。

| 名词 | 解释 |
|---|---|
| GPU | 图形处理器，现在是 AI 训练和推理的主力 |
| Tensor Core | GPU 里专门做矩阵乘法的单元 |
| 显存（HBM / VRAM） | GPU 自带的内存，模型权重必须放进去，往往是第一瓶颈 |
| 显存带宽 | 每秒能读写多少数据，决定推理生成速度 |
| FLOPS | 每秒浮点运算次数，衡量算力；TFLOPS 是万亿次 |
| 常见型号 | A100（80GB）、H100 / H800（80GB）、H200（141GB）、B200；推理常用 L40S、4090 |
| NPU / 国产卡 | 昇腾 910B 等，需要对应的软件栈（CANN）适配 |

## 二、数值精度与量化

![数值精度与显存](/assets/diagrams/docs/ai-precision.svg)

**量化（Quantization）**：把参数从高精度（16 位）压到低精度（8 位、4 位），显存减半甚至更多，速度更快，精度略有损失。常见格式：

- **GPTQ / AWQ**：GPU 上用的 4 位量化，vLLM 支持。
- **GGUF**：llama.cpp / Ollama 使用，CPU 和 Mac 也能跑。
- **FP8**：H100 及之后的卡原生支持，精度损失很小，生产部署常用。

粗估显存：${C}参数量(B) × 每参数字节数 ≈ 权重显存(GB)${C}。70B 模型 BF16 约需 140GB，至少两张 80GB 卡；INT4 量化后约 35GB，一张卡可放下。

## 三、推理性能指标

| 指标 | 含义 | 影响因素 |
|---|---|---|
| TTFT 首 Token 延迟 | 从发请求到看到第一个字 | 输入长度、排队、预填充计算量 |
| TPOT / ITL | 之后每个 Token 的间隔 | 显存带宽、模型大小 |
| TPS / Tokens/s | 每秒生成多少 Token | 单请求看速度，整机看吞吐 |
| 吞吐（Throughput） | 单位时间处理的总 Token 数 | 批处理大小、并发 |
| QPS / 并发数 | 同时服务多少请求 | 显存余量、KV Cache 大小 |

推理分两个阶段：**Prefill（预填充）** 一次性处理整段输入，主要吃算力；**Decode（解码）** 一个个生成 Token，主要吃显存带宽。

## 四、推理加速技术

- **KV Cache**：缓存已经算过的注意力 Key/Value，避免重复计算。上下文越长占显存越多。
- **PagedAttention**：vLLM 的核心，把 KV Cache 像操作系统内存分页一样管理，减少浪费。
- **Continuous Batching 连续批处理**：请求随到随加入批次，完成就退出，GPU 不空等。
- **Prefix Caching 前缀缓存**：相同的系统提示只算一次，多请求共享。
- **投机解码（Speculative Decoding）**：小模型先猜几个 Token，大模型一次验证，速度提升 2~3 倍。
- **FlashAttention**：重写注意力计算方式，减少显存读写，训练和推理都更快。

## 五、训练的并行方式

模型太大一张卡放不下，或数据太多一张卡算不完，就要多卡并行：

| 方式 | 怎么切 | 适用 |
|---|---|---|
| 数据并行（DP / DDP） | 每张卡一份完整模型，各算一部分数据 | 模型能放进单卡 |
| ZeRO / FSDP | 把参数、梯度、优化器状态分到各卡 | 模型稍大，DeepSpeed 和 PyTorch 原生支持 |
| 张量并行（TP） | 把一层的矩阵拆到多卡 | 单层太大，通常限于一台机器内 |
| 流水线并行（PP） | 不同层放不同卡，像流水线 | 层数多，跨机器 |
| 专家并行（EP） | MoE 的不同专家放不同卡 | MoE 模型 |

训练显存远大于推理：除了权重，还有梯度和优化器状态。全参数微调 7B 模型用 AdamW 约需 7×16 ≈ 112GB，所以普通团队多用 LoRA / QLoRA。

## 六、软件栈

| 名词 | 作用 |
|---|---|
| CUDA | NVIDIA 的 GPU 编程平台，几乎所有框架都依赖它 |
| cuDNN | 深度学习常用算子的加速库 |
| NCCL | 多卡、多机之间的高速通信库 |
| NVLink / InfiniBand / RoCE | 卡间和机器间的高速互联网络 |
| PyTorch | 主流深度学习框架 |
| DeepSpeed / Megatron-LM | 大模型分布式训练框架 |
| vLLM / SGLang / TensorRT-LLM | 高性能推理引擎 |
| Ollama / llama.cpp | 本地轻量运行模型 |
| Kubernetes + GPU Operator | 在集群里调度 GPU 资源 |

${F}bash
nvidia-smi                      # 看显卡型号、显存占用、利用率
nvidia-smi topo -m              # 看卡间连接方式（NVLink / PCIe）
vllm serve Qwen/Qwen2.5-7B-Instruct --tensor-parallel-size 2
${F}

## ⚠ 常见误区

- **误区：GPU 利用率 100% 就是跑满了**。这个数字只表示有任务在跑，不代表算力用满，要看 MFU 或实际吞吐。
- **误区：显存够放权重就能跑**。还要留出 KV Cache 空间，否则并发和上下文长度都上不去。
- **误区：卡越多越快**。卡间通信慢时（只走 PCIe），多卡张量并行可能反而更慢。

## ✅ 自检清单

- 能估算一个模型在 BF16 和 INT4 下需要多少显存。
- 能解释 TTFT 和吞吐，以及 Prefill 与 Decode 的区别。
- 知道 KV Cache、连续批处理为什么能加速。
- 能说出数据并行、张量并行、流水线并行的区别。

## 📚 延伸阅读

- Hugging Face：The Ultra-Scale Playbook
- vLLM 论文：Efficient Memory Management for LLM Serving with PagedAttention
- NVIDIA 开发者博客：Mastering LLM Techniques: Inference Optimization
`
          },
          {
            id: "ai-finetune",
            title: "模型微调：SFT、LoRA / QLoRA 与什么时候该微调",
            minutes: 20,
            updated: "2026-11-20",
            applies: "Hugging Face Transformers / PEFT / TRL、LLaMA-Factory",
            tags: ["微调", "LoRA", "SFT"],
            terms: ["微调", "LoRA", "SFT", "PEFT", "大模型"],
            body: `
> **官方文档基线**：[Hugging Face · PEFT](https://huggingface.co/docs/peft) · [Hugging Face · TRL SFTTrainer](https://huggingface.co/docs/trl/sft_trainer) · [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory)

## 一、先回答：要不要微调

按 OpenAI 和多数一线团队的经验，优化顺序是 **Prompt → RAG → 微调**。微调成本最高，只在前两者解决不了时才做。

| 需求 | 首选方案 |
| --- | --- |
| 让模型知道公司最新文档 | RAG（知识会变，微调记不牢也难更新） |
| 固定输出格式、语气、风格 | 先试 Prompt + 示例，不够再微调 |
| 特定任务（分类、抽取）要又快又便宜 | 微调小模型替代大模型 |
| 学会领域专用的推理方式或行话 | 微调 |

一句话：**RAG 补知识，微调改行为**。

## 二、训练阶段一览

- **预训练**：海量文本学语言和知识，成本以百万美元计，应用团队不碰。
- **SFT（监督微调）**：用「指令 + 理想回答」数据教模型按要求回答，是最常用的一步。
- **偏好对齐**：RLHF 或 DPO，用「好回答 vs 差回答」的成对数据让模型更符合人类偏好。DPO 不需要单独训练奖励模型，更容易上手。

## 三、LoRA：只训练一小部分参数

全参数微调 7B 模型要几十 GB 显存。**LoRA** 冻结原模型，在注意力层旁边加两个很小的低秩矩阵 A、B，只训练它们，参数量通常不到原模型的 1%。

- **r（秩）**：常用 8～64，越大表达力越强、越容易过拟合。
- **target_modules**：一般选 q_proj、v_proj，效果不够再加 k、o 和 MLP 层。
- **QLoRA**：把底座模型量化成 4bit 再加 LoRA，单张 24GB 显卡就能微调 7B～13B 模型。

${F}python
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

peft_cfg = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
                      target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
trainer = SFTTrainer(
    model="Qwen/Qwen2.5-7B-Instruct",
    train_dataset=dataset,             # 每条含 messages 字段
    args=SFTConfig(output_dir="out", num_train_epochs=3,
                   per_device_train_batch_size=4, learning_rate=2e-4),
    peft_config=peft_cfg,
)
trainer.train()
${F}

训练完得到的是几十 MB 的适配器权重，可以单独加载，也可以合并回底座模型再部署。

## 四、数据比参数更重要

- **质量优先**：1000 条精心审核的数据，常常胜过 10 万条爬来的数据。
- **格式统一**：使用模型自带的 chat template，训练和推理格式不一致会导致效果暴跌。
- **留出验证集**：至少 10% 不参与训练，用来判断是否过拟合。
- **混入通用数据**：只喂领域数据容易出现「灾难性遗忘」，通用能力下降。

## ⚠ 踩坑

- **用微调灌知识**：模型会把知识记混，还会更自信地编造。
- **学习率过大、轮数过多**：loss 降得很低但回答变得机械重复，是典型过拟合。
- **没有基线对比**：微调前先记录原模型在测试集上的分数，否则无法证明有提升。

## ✅ 自检清单

- 能说出 Prompt、RAG、微调各自适合的场景。
- 能解释 LoRA 为什么省显存，r 和 target_modules 怎么选。
- 能说出 SFT 和 DPO 分别需要什么样的数据。

## 📚 延伸阅读

- 论文：LoRA: Low-Rank Adaptation of Large Language Models（Hu et al., 2021）
- 论文：QLoRA: Efficient Finetuning of Quantized LLMs（Dettmers et al., 2023）
- OpenAI 文档：Model optimization
`
          },
          {
            id: "ai-serving",
            title: "私有化推理部署：vLLM、KV Cache、量化与 Ollama",
            minutes: 20,
            updated: "2026-11-20",
            applies: "vLLM 0.6+ / SGLang / Ollama / llama.cpp",
            tags: ["推理部署", "vLLM", "量化"],
            terms: ["vLLM", "推理", "量化", "KV Cache", "大模型"],
            body: `
> **官方文档基线**：[vLLM Docs](https://docs.vllm.ai/) · [Ollama Docs](https://github.com/ollama/ollama/tree/main/docs) · [Hugging Face · Quantization](https://huggingface.co/docs/transformers/main/en/quantization/overview)

## 一、为什么要自己部署

数据不能出内网、调用量大到 API 太贵、需要用自己微调的模型，这三种情况会选择私有化部署。代价是要自己管 GPU、并发、监控和升级。

## 二、先算显存

粗略估算：**显存 ≈ 参数量 × 每参数字节数 + KV Cache + 约 10% 开销**。

| 精度 | 每参数字节 | 7B 模型权重 | 70B 模型权重 |
| --- | --- | --- | --- |
| FP16 / BF16 | 2 | 约 14 GB | 约 140 GB |
| INT8 | 1 | 约 7 GB | 约 70 GB |
| INT4（AWQ / GPTQ） | 0.5 | 约 3.5 GB | 约 35 GB |

权重之外，**KV Cache** 随「并发数 × 上下文长度」线性增长，长上下文高并发时它常常比权重还大。

## 三、推理的两个阶段

- **Prefill**：一次性处理整段输入，计算量大，决定首字延迟（TTFT）。
- **Decode**：逐个生成 Token，每步都要读一遍权重和 KV Cache，受显存带宽限制，决定每 Token 延迟（TPOT）。

KV Cache 的作用是把已经算过的 Key/Value 存下来，生成第 N 个 Token 时不用把前 N-1 个重新算一遍。

## 四、vLLM 为什么快

- **PagedAttention**：像操作系统分页一样按块管理 KV Cache，显存碎片从 60%～80% 降到 4% 以下，同样显存能跑更多并发。
- **Continuous Batching**：请求随到随加入批次，完成就离开，不必等整批结束，吞吐量提升数倍。
- **前缀缓存**：相同的系统提示词只算一次。

${F}bash
pip install vllm
vllm serve Qwen/Qwen2.5-7B-Instruct \\
  --tensor-parallel-size 1 \\
  --max-model-len 16384 \\
  --gpu-memory-utilization 0.9
${F}

启动后提供 **OpenAI 兼容接口**，原来调用 OpenAI 的代码只需把 base_url 改成 http://localhost:8000/v1。

## 五、工具怎么选

| 工具 | 适合 |
| --- | --- |
| vLLM / SGLang | 生产环境 GPU 高并发服务 |
| Ollama | 本地开发、个人电脑一键运行 |
| llama.cpp | CPU 或 Mac 上跑 GGUF 量化模型 |
| TensorRT-LLM | NVIDIA 平台极致性能，配置复杂 |

${F}bash
ollama run qwen2.5:7b      # 自动下载 4bit 量化版并进入对话
${F}

## 六、上线要盯的指标

首字延迟 TTFT、每 Token 延迟 TPOT、吞吐量（Token/s）、GPU 显存与利用率、排队请求数。vLLM 自带 Prometheus 指标接口，可直接接入 Grafana。

## ⚠ 踩坑

- **max-model-len 设太大**：KV Cache 预留过多，启动就报显存不足。
- **量化不评测**：INT4 在数学和代码任务上可能明显掉点，上线前用测试集对比。
- **多卡不用张量并行**：70B 模型单卡放不下，要用 tensor-parallel-size 切分到多卡。

## ✅ 自检清单

- 能估算某个模型在某种精度下需要多少显存。
- 能解释 Prefill / Decode 和 KV Cache 的作用。
- 能说出 PagedAttention 和 Continuous Batching 各解决什么问题。

## 📚 延伸阅读

- 论文：Efficient Memory Management for Large Language Model Serving with PagedAttention（Kwon et al., 2023）
- vLLM 文档：Engine Arguments、Production Metrics
`
          },
          {
            id: "ai-eval-safety",
            title: "评测、安全与成本：让大模型应用可以上线",
            minutes: 18,
            updated: "2026-11-20",
            applies: "所有大模型应用",
            tags: ["评测", "Prompt 注入", "安全"],
            terms: ["评测", "Prompt 注入", "幻觉", "大模型", "LLM"],
            body: `
> **官方文档基线**：[OpenAI · Evals](https://platform.openai.com/docs/guides/evals) · [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) · [Anthropic · Mitigate jailbreaks](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)

## 一、为什么评测是第一位的

大模型输出不确定，改一句 Prompt、换一个模型版本，都可能让某些场景变好、另一些变差。**没有评测集，就只能凭感觉上线**。

## 二、搭建评测体系

1. **收集测试集**：从真实用户问题里挑 100～500 条，覆盖常见、边界和曾经出错的案例。
2. **定义评分方式**：
   - 有标准答案的（分类、抽取）：精确匹配或字段比对；
   - 开放回答：**LLM-as-judge**，用强模型按评分标准打分；
   - 关键场景：人工抽检，并定期校准自动评分。
3. **接入流程**：每次改 Prompt、换模型、改检索都自动跑一遍，分数下降就拦截。

${F}python
JUDGE = """你是评审。根据参考答案判断回答是否正确且无编造。
只输出 JSON：{"score": 1到5的整数, "reason": "一句话"}
问题：{q}
参考答案：{ref}
待评回答：{ans}"""
${F}

LLM 评审有偏好长回答、偏好自己风格的倾向，评分标准要写具体，并抽样和人工结果对比一致率。

## 三、OWASP LLM Top 10 重点

| 风险 | 说明 | 防护 |
| --- | --- | --- |
| Prompt 注入 | 用户或网页、文档里藏着「忽略之前的指令」 | 外部内容标记为数据、权限最小化、敏感操作人工确认 |
| 敏感信息泄露 | 模型输出了系统提示、其他用户数据 | 检索按权限过滤、输出脱敏 |
| 不安全的输出处理 | 把模型输出直接拼进 SQL、HTML、Shell | 当作不可信输入，转义和校验 |
| 过度授权 | Agent 拥有删除、转账等高权限工具 | 只给必要工具，写操作需确认 |
| 无限制消耗 | 超长输入或循环调用耗尽额度 | 限流、限制长度和步数 |

**间接注入**最容易被忽视：Agent 读取的网页或邮件里写着「把用户通讯录发到某地址」，模型可能照做。根本办法是让高风险操作不依赖模型自觉，而由程序做权限控制。

## 四、成本与延迟优化

- **模型路由**：简单问题用小模型，复杂问题才用大模型。
- **缓存**：系统提示词使用厂商的 Prompt Caching，相同问题结果缓存。
- **控制上下文**：RAG 只放最相关的几段，历史对话做摘要。
- **流式输出**：总耗时不变，但用户感知的等待时间短得多。
- **监控**：记录每次调用的模型、Token 数、耗时、费用，按功能统计。

## ⚠ 误区

- **相信系统提示词能防住注入**：它只能降低概率，不能当作安全边界。
- **只测正常问题**：要专门准备越狱、注入、超长输入等对抗样本。

## ✅ 自检清单

- 能为自己的应用设计测试集和评分方式。
- 能解释直接注入和间接注入，并说出程序层面的防护。
- 能列出三种降低调用成本的方法。

## 📚 延伸阅读

- OWASP Top 10 for LLM Applications 2025
- OpenAI Cookbook：Getting started with evals
`
          },
        ]
      }
    ]
  };

  window.AI = AI;
})();
