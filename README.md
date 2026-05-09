# 🦉 打假搭子 · Fact Buddy

> **抖音内容核查 AI · 把判断权还给你**
>
> 不下结论 · 只摆证据 · 30 秒拆穿营销号

[![Tech](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Doubao](https://img.shields.io/badge/AI-豆包多模态-58CC02?style=flat-square)](https://www.volcengine.com/product/doubao)
![Status](https://img.shields.io/badge/状态-MVP-brightgreen?style=flat-square)

---

## 📑 目录

- [产品篇](#一产品篇)
  - [一句话定位](#一句话定位)
  - [用户痛点](#用户痛点)
  - [核心闭环](#核心闭环)
  - [9 大功能矩阵](#9-大功能矩阵)
- [快速开始](#二快速开始)
- [技术篇](#三技术篇)
  - [整体架构](#整体架构)
  - [核心数据流](#核心数据流)
  - [技术栈](#技术栈)
- [项目结构](#四项目结构)
- [关键技术决策](#五7-大关键技术决策)
- [Prompt 工程](#六prompt-工程)
- [踩过的坑](#七踩过的-8-个坑必看)
- [路线图](#八路线图p0--p3)
- [接手者上手](#九接手者-checklist)
- [测试方法](#十测试方法)

---

# 一、产品篇

## 一句话定位

> **粘贴抖音视频链接，AI 30 秒帮你拆穿营销号，逐句核查 + 引用权威源 + 推荐正规科普。**

## 用户痛点

```
🔴 抖音 61% 健康类视频含夸大或错误信息
🔴 老妈群里每天转「专家说不能吃 XX」
🔴 「90% 的人不知道」「医生都震惊了」点开就掉坑
🔴 自己百度查证太累，AI 总结又不可信
```

## 差异化

| 维度 | 现有方案 | 打假搭子 |
|------|--------|---------|
| 输出形态 | 摘要 / 文字 | **三色证据** + 真相重写 |
| 核查粒度 | 整体打个分 | **逐句拆解 + 单独核查** |
| 信源 | AI 自说自话 | **必须引用具体机构** |
| 用户视角 | 抽象声明 | **原文标红 + 点击对比** |
| 闭环 | 只打假 | **打假 + 推荐正规科普** |

## 核心闭环

```
🔴 AI 说这是假的
        ↓
👀 用户：那真的科普应该看哪？
        ↓
📚 推荐抖音精选权威账号
（健康中国 / 中国营养学会 / 张文宏医生 / 丁香医生）
        ↓
[去抖音看正版] 一键跳转
```

## 9 大功能矩阵

| # | 功能 | 文件 | 简介 |
|---|------|------|------|
| 1 | 🌟 **原文标注** | `AnnotatedTranscript.tsx` | 在视频原文上 ❌🤔✅ 三色高亮，点击看真相对比 |
| 2 | 🎯 **三色核查** | `ClaimCard.tsx` | 已验证 / 存疑 / 误导 + 5 星证据强度 + 引用源 |
| 3 | 🦉 **ASR 转写** | `services/asr.ts` | 抖音视频音频自动转文字（豆包多模态） |
| 4 | 📤 **转发家人** | `ShareCard.tsx` | 精美卡片，长按截图发家人群 |
| 5 | 📄 **PDF 报告** | `ReportView.tsx` | 杂志风简约设计，单条/批量导出 |
| 6 | 📚 **核查仓库** | `HistoryDrawer.tsx` | localStorage 记录，一键回看（不重调 API） |
| 7 | 🛡️ **防骗等级** | `UserLevelBadge.tsx` | 6 级游戏化（🐣→🦉→🔍→🛡️→⚔️→👑） |
| 8 | 🎯 **互动 Quiz** | `MythQuiz.tsx` | 「你信过几条谣言？」5 道经典题 |
| 9 | 🏛️ **谣言博物馆** | `RumorMuseum.tsx` | 12 条经典翻车案例（5 大分类） |
| ★ | 📚 **权威源闭环** | `AuthoritativeSources.tsx` | 21 个抖音权威账号智能推荐 |

---

# 二、快速开始

## 30 秒上手

```bash
git clone git@github.com:ZenvaMea/douyin_demo.git
cd douyin_demo

npm install
cp .env.example .env       # 编辑填入 ARK_API_KEY
npm run dev                # → http://localhost:3000
```

## 必填环境变量

```bash
LLM_PROVIDER=doubao
DOUBAO_API_KEY=ark-xxx
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-seed-2-0-mini-260428
```

## 怎么获取 ARK Key

1. 登录 https://console.volcengine.com/ark
2. 「在线推理」→「自定义推理接入点」
3. 选模型：**doubao-seed-2.0-mini** 或 **doubao-seed-1.6-flash**（必须支持音频的多模态）
4. 创建后拿到 endpoint ID（格式 `doubao-seed-x-x-xxx-yyy`），填到 `DOUBAO_MODEL`
5. 「API Key 管理」创建 key（格式 `ark-xxx`），填到 `DOUBAO_API_KEY`

## CLI 演示（不需要 Web UI）

```bash
npm run demo:health     # 柠檬水谣言（6 条声明）
npm run demo:finance    # 基金推销（8 条声明）
npm run demo:food       # 食物相克（5 条声明）
npm run demo:all        # 三个全跑
```

---

# 三、技术篇

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                 浏览器端（Next.js 16）                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  多邻国风 UI + 营销钩子 + 互动组件                │  │
│  │  原文标注 / 三色卡 / 评分环 / 谣言墙 / Quiz       │  │
│  └────────────────────┬─────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        ↓ SSE 流式
┌─────────────────────────────────────────────────────────┐
│            Next.js Server Actions (Node.js)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/extract  抖音 share 页解析 + ASR 转写       │  │
│  │  /api/check    SSE 流式核查（拆解 + 并发核查）    │  │
│  │  /api/samples  内置样例                          │  │
│  └────────────────────┬─────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│           LLM 抽象层 + 抖音 + ASR                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ LLM Provider│  │ 抖音 share 页│  │ 火山方舟 ASR │  │
│  │ 5 家可切换  │  │ HTML 解析    │  │ 多模态接口   │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 核心数据流

```
[1] 用户粘贴抖音链接
        ↓
[2] 短链 302 跟随 → 提取 19 位 aweme_id
        ↓
[3] 抓 share 页 HTML（绕过 X-Bogus 签名）→ desc / videoUrl
        ↓
[4] desc 太短？→ 下载 mp4 → ffmpeg 抽 mp3 → 豆包 ASR 转写
        ↓
[5] Claimify 四阶段拆解 → 原子声明列表（带 original_quote）
        ↓
[6] 并发核查每条声明 → 三色 + 证据 + 真相重写（SSE 流式）
        ↓
[7] 前端渲染：
    ├── 原文标注（点击红字看真相）
    ├── 评分环 + 三色统计
    ├── 详细核查列表
    ├── 抖音精选权威源推荐 ★ 闭环
    └── 自动保存到本地仓库
```

## 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | **Next.js 16** + React 19 | App Router + SSE + Turbopack |
| 样式 | **Tailwind CSS 4** | `@theme` 现代写法 + JIT |
| 动画 | **framer-motion 12** | spring 动画 + layoutId 共享元素 |
| 字体 | **Nunito + Geist** | 圆润粗体（多邻国感） |
| 类型 | **TypeScript 5.7** + 严格模式 | 0 错误 |
| LLM SDK | **Anthropic SDK + OpenAI SDK** | 双轨制 |
| 视频 | **ffmpeg-static** | 内置二进制，无需用户装 |
| 主模型 | **豆包 doubao-seed-2-0-mini** | 抖音赛事 + 多模态原生支持 |

---

# 四、项目结构

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                      # ★ 主页（输入 + 结果一体）
│   ├── globals.css                   # ★ 多邻国主题 + @media print
│   └── api/
│       ├── check/route.ts            # ★ SSE 流式核查
│       ├── extract/route.ts          # ★ 抖音 + ASR
│       └── samples/route.ts
├── components/                       # 21 个 React 组件
│   ├── ★ AnnotatedTranscript.tsx     # 原文三色标注（核心创新）
│   ├── ★ ClaimCard.tsx               # 三色核查卡（含证据/真相）
│   ├── ★ CredibilityRing.tsx         # 可信度评分环
│   ├── ★ ShareCard.tsx               # 转发家人卡（信息丰富版）
│   ├── ★ ReportView.tsx              # PDF 报告（Portal 渲染）
│   ├── ★ HistoryDrawer.tsx           # 我的核查仓库
│   ├── ★ AuthoritativeSources.tsx    # 抖音权威源推荐（闭环）
│   ├── MythQuiz.tsx                  # 5 道谣言互动测试
│   ├── RumorMuseum.tsx               # 12 条谣言博物馆
│   ├── UserLevelBadge.tsx            # 防骗等级
│   ├── TickerStats.tsx               # 实时数据（数字爬升）
│   ├── PainPoints.tsx                # 6 条痛点共鸣
│   ├── ValueProps.tsx                # 4 个差异化价值点
│   ├── ThreeStepFlow.tsx             # 3 步流程
│   ├── UrgencyBanner.tsx             # 紧迫感横幅
│   ├── Header.tsx                    # 顶栏
│   ├── AppleButton.tsx               # 多邻国 3D 按钮
│   ├── SegmentedControl.tsx          # iOS 风分段控件
│   ├── SampleCard.tsx                # 样例卡
│   ├── ProgressBar.tsx
│   └── Toast.tsx                     # 全局提示
├── lib/
│   ├── llm/                          # ★ LLM 抽象层（5 家 Provider）
│   │   ├── types.ts                  # LLMProvider 接口
│   │   ├── anthropic.ts              # Claude 适配器
│   │   ├── openai-compatible.ts      # OpenAI 兼容基类
│   │   ├── doubao.ts                 # 豆包
│   │   ├── deepseek.ts               # DeepSeek
│   │   ├── qwen.ts                   # 通义
│   │   ├── kimi.ts                   # Kimi
│   │   └── index.ts                  # createProvider 工厂
│   ├── prompts/                      # ★ Prompt 工程
│   │   ├── claimify.ts               # 声明拆解（Microsoft 范式）
│   │   └── verify.ts                 # 三色核查
│   ├── services/
│   │   ├── claim-extractor.ts        # 拆解服务
│   │   ├── verifier.ts               # 核查服务（含批量并发）
│   │   └── asr.ts                    # ★ ASR（下载+ffmpeg+豆包）
│   ├── extractors/
│   │   ├── index.ts                  # 统一接口
│   │   └── douyin.ts                 # ★ 抖音 share 页解析
│   ├── data/
│   │   └── authoritative.ts          # ★ 21 个权威账号数据库
│   ├── utils/
│   │   ├── cn.ts                     # clsx + twMerge
│   │   ├── userLevel.ts              # 防骗等级 localStorage
│   │   └── history.ts                # 核查记录 CRUD
│   ├── cli.ts                        # CLI 入口
│   └── render.ts                     # CLI 美化输出
└── samples/                          # 内置 demo 样例
    ├── health.ts                     # 柠檬水谣言
    ├── finance.ts                    # 基金推销
    └── food.ts                       # 食物相克
```

---

# 五、7 大关键技术决策

## 1. LLM 抽象层（多模型可切换）

**问题：** 想随时切换 Claude / 豆包 / DeepSeek 但又不想到处改代码

**解法：** 以 OpenAI Chat Completions 为中间表示，每家 < 50 行薄适配器

```typescript
// 切换豆包 ↔ Claude ↔ DeepSeek 只需改环境变量
LLM_PROVIDER=doubao  // anthropic / deepseek / qwen / kimi

// 业务代码 0 改动
const provider = createProvider();
const result = await provider.chat(request);
```

**位置：** `src/lib/llm/`

## 2. 抖音内容获取（绕过 X-Bogus 签名）

**问题：** 2025 年 iesdouyin 的 `iteminfo` API 已强制要求 X-Bogus 签名（逆向极复杂）

**解法：** 直接抓 `share/video/{id}/` 页面 HTML，从 SSR 注入的 `<script>` 数据里正则提取

```typescript
// 关键正则
const descMatch = html.match(/"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/);
const playAddrMatch = html.match(
  /"play_addr"\s*:\s*\{[^}]*?"uri"\s*:\s*"([^"]+)"[^}]*?"url_list"\s*:\s*\["([^"]+)"/
);
// playwm → play 转无水印
videoUrl = playwmUrl.replace('/playwm/', '/play/');
```

**位置：** `src/lib/extractors/douyin.ts`

## 3. ASR 语音转写（复用同一 ARK Key）

**调研发现：** 火山方舟 ARK 没有独立 ASR 端点，但**多模态豆包**支持 `input_audio`！

**实施：**
```
视频 mp4 (11MB)
  ↓ ffmpeg-static (内置二进制，无需用户安装)
mp3 (16kHz / 单声道 / 64kbps)
  ↓ base64 编码
豆包 chat/completions + input_audio
  ↓
完整文字转写（实测 683 字精准）
```

**优势：** 复用同一个 `ark-key`，零额外开通。

**位置：** `src/lib/services/asr.ts`

## 4. SSE 流式核查（实时反馈）

**事件序列：**
```
event: meta          → { provider, model }
event: phase         → { phase: 'extracting', label }
event: extraction    → { claims: [...] }
event: phase         → { phase: 'verifying', total }
event: verification  → { progress, total, result }  // 每条单独推送
event: done          → { ok }
```

**前端体验：** 声明逐条出现 spinner，核查完成立刻变彩色

**位置：** `src/app/api/check/route.ts`

## 5. 原文标注算法（核心创新）

**用户视角升级：** 从抽象 C1/C2 列表 → 原文上直接标红

```typescript
// 1. 利用 AI 提取的 original_quote
matches = claims.map(c => ({
  start: transcript.indexOf(c.original_quote),
  end: ...,
  verdict: verifications.get(c.id).verdict,
}));

// 2. 排序 + 去重叠
filtered = matches.sort((a,b) => a.start - b.start).filter(no_overlap);

// 3. 切分原文为 segments
segments = build_text_mark_segments(transcript, filtered);

// 4. 渲染：text 普通显示，mark 三色高亮
```

**位置：** `src/components/AnnotatedTranscript.tsx`

## 6. PDF 导出（React Portal + 浏览器原生 print）

**踩坑：** 报告 div 嵌套在父容器内，被 `@media print` 的 visibility 规则误隐藏

**解决：** React Portal 渲染到 `document.body` 直接子节点

```typescript
return createPortal(
  <div className="report-print-root">...</div>,
  document.body,  // 关键：脱离 React 树挂到 body
);
```

**优势：** 零依赖、完美中文、文字可复制可搜索

**位置：** `src/components/ReportView.tsx` + `globals.css` `@media print`

## 7. 多邻国 3D 按钮（视觉灵魂）

```css
.duo-btn-primary {
  background: var(--color-duo);            /* #58CC02 */
  color: white;
  box-shadow: 0 4px 0 var(--color-duo-shadow);  /* 底部 4px 实心阴影 */
}
.duo-btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 currentColor;          /* 按下阴影消失 = 物理按键反馈 */
}
```

**位置：** `src/app/globals.css`

---

# 六、Prompt 工程

## Claimify 四阶段拆解（基于 Microsoft 2025 SOTA）

```
1. Selection（选择）        → 只保留可验证的事实主张
2. Disambiguation（消歧）   → 替换代词 / 补全省略
3. Decomposition（原子化）  → 复合句拆为独立声明
4. 中文增强                 → 营销话术过滤、设问句转换
```

中文场景特殊处理：
- 「家人们」「绝绝子」→ 删除（marketing）
- 「99% 的人不知道」→ 保留（这本身可核查）
- 「你知道为什么 X 吗？因为 Y」→ 「X 的原因是 Y」

**位置：** `src/lib/prompts/claimify.ts`

## 三色核查 Prompt（强制 quote + URL）

```
1. 三色标签 + 5 星证据强度
2. 必须给出具体机构名（中国营养学会 / 卫健委 / WHO...）
3. 必须区分语境（柠檬有维 C ≠ 柠檬维 C 含量高）
4. 不确定时强制选 NEI（防止脑补）
5. 真相重写 3-5 句话点睛
```

**位置：** `src/lib/prompts/verify.ts`

---

# 七、踩过的 8 个坑（必看）

避免接手者重蹈覆辙：

## 坑 ①：豆包不支持 `response_format.json_schema`

**现象：** 调结构化输出报 `400: json_schema is not supported`
**修复：** `src/lib/llm/openai-compatible.ts` **统一走 tool 调用模拟** JSON Schema（跨厂商最稳）

## 坑 ②：iesdouyin iteminfo 接口要求 X-Bogus 签名

**现象：** 调 `iteminfo?item_ids=xxx` 返回 `status_code: 11110, "encrypt_data_miss"`
**修复：** 改抓 `share/video/{id}/` 页面 HTML，从 SSR 数据里正则提取
**位置：** `src/lib/extractors/douyin.ts` 的 `fetchSharePage()`

## 坑 ③：ffmpeg-static 在 Next.js Turbopack 下路径错乱

**现象：** ASR 报 `ENOENT: spawn /ROOT/node_modules/ffmpeg-static/ffmpeg`
**原因：** Turbopack 把 `__dirname` 改写为虚拟路径
**修复：** 在 `next.config.ts` 加 `serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg']`

## 坑 ④：纯字幕 + BGM 视频 ASR 转出"无中文语音内容"

**现象：** 某些抖音视频用字幕滚动 + 背景音乐，没有人声
**修复：** 暂时无解（需要 OCR）。**TODO**：后续接 OCR

## 坑 ⑤：globals.css `@import` 顺序

**现象：** Tailwind 4 报 `@import rules must precede all rules`
**修复：** **所有 `@import` 必须放在文件最顶部**

## 坑 ⑥：Next.js 不接受 `.js` 扩展名 import

**现象：** `Module not found: Can't resolve '@/lib/llm/index.js'`
**修复：** 全项目 `.js` import 替换为 `.ts`

## 坑 ⑦：豆包 ASR 触发阈值

**修复：** 改用「去掉话题标签后的纯文本长度」判断，阈值提高到 80
**位置：** `src/app/api/extract/route.ts`

## 坑 ⑧：PDF 导出空白 + setState during render

**坑 8a：** PDF 空白
- **原因：** `body > *:not(.report-print-root)` 选择器误杀嵌套结构
- **修复：** ReportView 用 `createPortal` 渲染到 `document.body` 直接子节点

**坑 8b：** Cannot update Header while rendering Home
- **原因：** 在 setState updater 里调用 `addHistory()`（同步触发其他组件 setState）
- **修复：** 把保存逻辑移到 `useEffect([phase])`

---

# 八、路线图（P0 → P3）

按优先级排，**接手立刻能做的优化**：

## 🔥 P0：立刻能做的体验提升

- [ ] **`/api/extract` 改 SSE 流式**：当前 ASR 阶段前端等 30-60 秒，应该实时推送「下载中 / 抽音频 / 转写中」
- [ ] **缓存抖音解析结果**：同一 URL 重复粘贴时不重复下载
- [ ] **首页加 demo 视频示意图 / 截图**：用户不懂"粘贴抖音文案"是啥
- [ ] **错误展示美化**：当前 ASR 失败错误是裸字符串

## 🚀 P1：核心能力增强

- [ ] **接入豆包 / Kimi 的原生 Web Search**：当前核查仅靠模型知识。Kimi 有 `$web_search`，豆包有联网插件
  - 关键：在 `verify.ts` prompt 里允许调用 search tool
  - 关键：在 `LLMProvider.capabilities.webSearchNative` 上接入路径
- [ ] **OCR 视频字幕**：处理"纯字幕 + BGM"类视频（约 15%）
  - 思路：ffmpeg 抽帧 → 豆包 `input_image` 多帧理解
- [ ] **跨视频对照**：同主题的不同视频合并核查报告

## 🎨 P2：产品形态扩展

- [ ] **部署 Vercel / 火山引擎**：拿到公开 URL 给评委看
  - **注意：Vercel Serverless 函数超时 10s，不够 ASR 用**。要么部署到火山函数计算
- [ ] **分享卡片**：可以把核查结果生成图片分享
- [ ] **浏览器插件**：刷抖音时旁边自动出现「核查」按钮

## 📊 P3：数据 / 监控

- [ ] **结构化日志**：当前用 console.log，应该接 Sentry / OpenObserve
- [ ] **核查质量评估**：对内置 demo 跑批次，记录三色判定准确率
- [ ] **拆解质量监控**：用 FEVERFact 6 维度评分

---

# 九、接手者 Checklist

按顺序做，**30 分钟可上手**：

- [ ] **Step 1：能跑起来（5 分钟）**
  - [ ] `git clone git@github.com:ZenvaMea/douyin_demo.git`
  - [ ] `npm install`
  - [ ] `cp .env.example .env` 并填入 ARK key
  - [ ] `npm run dev` 看到 http://localhost:3000 能打开

- [ ] **Step 2：跑通核心链路（10 分钟）**
  - [ ] CLI demo：`npm run demo:health` 能看到三色卡片
  - [ ] Web 粘贴文案：粘贴 `src/samples/health.ts` 内容能跑通
  - [ ] Web 抖音链接：粘贴 `https://v.douyin.com/sjLnwb9CoL4/` 能跑通 ASR 全流程

- [ ] **Step 3：理解架构（10 分钟）**
  - [ ] 读 `src/lib/llm/types.ts` —— 抽象层
  - [ ] 读 `src/lib/extractors/douyin.ts` —— 抖音解析
  - [ ] 读 `src/lib/services/asr.ts` —— ASR 链路
  - [ ] 读 `src/app/api/check/route.ts` —— SSE 协议
  - [ ] 读 `src/components/AnnotatedTranscript.tsx` —— 核心创新

- [ ] **Step 4：选第一个 P0 任务动手（5 分钟）**
  - 推荐：`/api/extract` 改 SSE 流式（用户体验提升最大）

---

# 十、测试方法

## 离线冒烟（不调 API）

```bash
npx tsx src/lib/llm/_smoke.ts
# 验证所有 5 家 Provider 能正确实例化
```

## 真实 API 冒烟

```bash
npm run test:provider
# 调一次最小请求，确认网络 + key 可用
```

## 三个内置场景（真实模型）

```bash
npm run demo:health
npm run demo:finance
npm run demo:food
npm run demo:all
```

## 类型检查

```bash
npx tsc --noEmit
# 应该 0 错误
```

## 已验证可用的真实抖音链接

- https://v.douyin.com/sjLnwb9CoL4/ —— 「小涛医生」医学科普
  - **实测：** 683 字 ASR / 11 条声明 / 可信度 59/100

---

# 十一、性能数据

| 指标 | 数据 |
|------|------|
| 端到端核查耗时 | 30-60 秒（含 ASR） |
| 单条声明核查 | ~5 秒 |
| 视频下载 | ~3 秒（11MB） |
| ffmpeg 抽音频 | ~2 秒 |
| ASR 转写 | ~15 秒 |
| AI 拆解 | ~5 秒 |
| 并发核查（10条） | ~30 秒 |

---

# 十二、项目数据

| 指标 | 数据 |
|------|------|
| Commit | 21+ 次 |
| 代码量 | **6,933+ 行** |
| React 组件 | **21 个** |
| Lib 模块 | 22 个 |
| API 路由 | 3 个 |
| Prompt | 2 个核心（Claimify + Verify） |
| 权威账号库 | 21 个（5 大领域） |

---

# 十三、设计哲学

> **不下结论 · 只摆证据 · 把判断权还给你**

我们不做信息的"判官"，只做证据的"展示者"。最终判断，由你自己做。

---

# 🦉 致谢

| | |
|---|---|
| **AI 模型** | 火山方舟豆包 `doubao-seed-2.0-mini`（多模态 + ASR） |
| **拆解范式** | [Microsoft Claimify (2025)](https://github.com/AdamGustavsson/ClaimsMCP) |
| **架构参考** | [OpenFactVerification (Loki)](https://github.com/Libr-AI/OpenFactVerification) |
| **设计语言** | [Duolingo Design System](https://design.duolingo.com/) |
| **开发工具** | [Claude Code](https://www.anthropic.com/claude-code) |

---

## 📜 License

MIT

---

🦉 **Fact Buddy** · 抖音精选 · 内容重构赛道作品

> 别让营销号偷走你的判断 · 刷之前先核一下 ✓

[![GitHub stars](https://img.shields.io/github/stars/ZenvaMea/douyin_demo?style=social)](https://github.com/ZenvaMea/douyin_demo)
