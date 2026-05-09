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

## 🎬 30 秒了解

```
⚠️  61% 的抖音健康类视频含夸大或错误信息
        ↓
🦉 老妈群里的「养生谣言」，AI 30 秒帮你拆穿
        ↓
✨ 抓重点 · 找证据 · 给真相 · 把判断权还给你
```

## ✨ 核心功能

| 能力 | 说明 |
|------|------|
| 🌟 **原文标注** | 在视频原文上 ❌🤔✅ 三色高亮，点击看真相对比 |
| 🎯 **三色核查** | 已验证 / 存疑 / 误导 + 5 星证据强度 + 引用源 |
| 🦉 **ASR 转写** | 抖音视频音频自动转文字（豆包多模态） |
| 📤 **转发家人** | 精美卡片，长按截图发家人群 |
| 📄 **PDF 报告** | 杂志风简约设计，单条/批量导出 |
| 📚 **核查仓库** | localStorage 记录，一键回看（不重调 API） |
| 🛡️ **防骗等级** | 6 级游戏化激励（🐣→🦉→🔍→🛡️→⚔️→👑） |
| 🎯 **互动 Quiz** | 「你信过几条谣言？」5 道经典题 |
| 🏛️ **谣言博物馆** | 12 条经典翻车案例（5 大分类） |

---

## 🚀 30 秒上手

```bash
git clone git@github.com:ZenvaMea/douyin_demo.git
cd douyin_demo

npm install
cp .env.example .env       # 填入 ARK_API_KEY
npm run dev                # → http://localhost:3000
```

最小配置：
```bash
LLM_PROVIDER=doubao
DOUBAO_API_KEY=ark-xxx     # 火山方舟控制台获取
DOUBAO_MODEL=doubao-seed-2-0-mini-260428
```

---

## 📐 技术架构

```
浏览器（Next.js 16 + React 19 + Tailwind 4）
   ↓ SSE 流式
Server Actions
   ├── /api/extract  抖音 share 页 + ASR
   ├── /api/check    Claimify 拆解 + 并发核查
   └── /api/samples  内置样例
   ↓
LLM 抽象层（5 家 Provider，0 代码切换）
   ├── 火山方舟豆包 ✓ 多模态 + ASR
   ├── Anthropic Claude
   ├── DeepSeek / 通义 / Kimi
```

### 关键技术点

- **🦉 抖音解析**：绕过 X-Bogus 签名，直接抓 share 页 SSR HTML
- **🎙️ ASR 转写**：复用同一 ARK key 调豆包多模态 `input_audio`
- **⚡ ffmpeg-static**：内置二进制，用户无需安装 ffmpeg
- **📡 SSE 流式**：声明逐条核查，前端实时彩色化
- **🌟 原文标注**：利用 Claimify 的 `original_quote` 字段，三色高亮
- **📄 PDF 导出**：React Portal + 浏览器原生 print，零依赖中文 PDF

---

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── check/        # SSE 流式核查
│   │   ├── extract/      # 抖音 + ASR
│   │   └── samples/      # 内置样例
│   ├── layout.tsx
│   ├── page.tsx          # 主页（输入 + 结果一体）
│   └── globals.css       # 多邻国主题 + @media print
├── components/
│   ├── AnnotatedTranscript.tsx  ★ 原文标注（核心创新）
│   ├── ClaimCard.tsx            ★ 三色核查卡
│   ├── CredibilityRing.tsx      ★ 评分环
│   ├── ShareCard.tsx            ★ 转发家人卡片
│   ├── ReportView.tsx           ★ PDF 报告
│   ├── HistoryDrawer.tsx        ★ 我的仓库
│   ├── MythQuiz.tsx             ★ 互动谣言测试
│   ├── RumorMuseum.tsx          ★ 谣言博物馆
│   ├── UserLevelBadge.tsx       ★ 防骗等级
│   ├── TickerStats.tsx          ★ 实时数据墙
│   ├── PainPoints.tsx           ★ 痛点共鸣
│   ├── ValueProps.tsx           ★ 价值点
│   ├── ThreeStepFlow.tsx        ★ 3 步流程
│   ├── UrgencyBanner.tsx        ★ 紧迫感横幅
│   └── ...                      （共 20 个组件）
├── lib/
│   ├── llm/              # LLM Provider 抽象（5 家）
│   ├── prompts/          # Claimify + Verify
│   ├── services/         # extractor / verifier / asr
│   ├── extractors/       # 抖音 share 页解析
│   └── utils/            # history / userLevel / cn
└── samples/              # 内置 demo 样例
```

---

## 📊 项目数据

| 指标 | 数据 |
|------|------|
| Commit | 19 次 |
| 代码量 | **6,480 行** |
| React 组件 | **20 个** |
| Lib 模块 | 22 个 |
| API 路由 | 3 个 |
| Prompt | 2 个核心（Claimify + Verify） |
| 端到端耗时 | 30-60 秒（含 ASR + 核查 11 条） |

---

## 📚 文档

- 📖 [**产品说明书**](./产品说明书.md) — 完整产品介绍 + 技术方案
- 🛠️ [**开发日志**](./开发日志.md) — 接手者上手指南
- 🎯 [**方案.md**](./方案.md) — 产品设计方案
- ✅ [**验证报告.md**](./验证报告.md) — 端到端验证记录

---

## 🎯 设计哲学

> **不下结论 · 只摆证据 · 把判断权还给你**

我们不做信息的"判官"，只做证据的"展示者"。最终判断，由你自己做。

---

## 🦉 致谢

- 🤖 **AI 模型** — 火山方舟豆包 `doubao-seed-2.0-mini`（多模态 + ASR）
- 📖 **拆解范式** — [Microsoft Claimify (2025)](https://github.com/AdamGustavsson/ClaimsMCP)
- 🏗️ **架构参考** — [OpenFactVerification (Loki)](https://github.com/Libr-AI/OpenFactVerification)
- 🎨 **设计语言** — [Duolingo Design System](https://design.duolingo.com/)
- 🛠️ **开发工具** — [Claude Code](https://www.anthropic.com/claude-code)

---

## 📜 License

MIT

---

🦉 **Fact Buddy** · 抖音精选 · 内容重构赛道作品

[![GitHub stars](https://img.shields.io/github/stars/ZenvaMea/douyin_demo?style=social)](https://github.com/ZenvaMea/douyin_demo)
