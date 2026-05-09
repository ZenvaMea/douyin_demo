# 🛡️ 打假搭子 · Fact Buddy

> 抖音精选内容核查 AI · 把营销号谣言拆穿，把真相还给用户

赛道：抖音精选 · 内容重构 | 方向：从「理解」出发

---

## ⚡ 30 秒上手

```bash
# 1. 安装依赖（已完成）
npm install

# 2. 配置 API Key（任选一家）
cp .env.example .env
# 编辑 .env，填入 ANTHROPIC_API_KEY 或 DOUBAO_API_KEY 等

# 3. 跑通验证
npm run demo:health      # 健康类样例（柠檬水谣言）
npm run demo:finance     # 财经类样例（基金推销）
npm run demo:food        # 食品类样例（食物相克）
npm run demo:all         # 三个场景全跑
```

## 🔌 切换底层模型（核心特性）

修改 `.env` 中的 `LLM_PROVIDER` 即可，**无需改一行业务代码**：

| 值 | 模型 | 备注 |
|----|------|------|
| `anthropic` | Claude（默认） | 验证阶段用 |
| `doubao` | 字节豆包 | **抖音赛事推荐** |
| `deepseek` | DeepSeek | 性价比高 |
| `qwen` | 通义千问 | 阿里生态 |
| `kimi` | 月之暗面 | 联网原生支持 |

## 📁 项目结构

```
src/
├── llm/                    # LLM 抽象层（核心隔离）
│   ├── types.ts            # 统一类型定义
│   ├── provider.ts         # LLMProvider 接口
│   ├── anthropic.ts        # Claude 适配器
│   ├── openai-compatible.ts # OpenAI 兼容基类
│   ├── doubao.ts           # 豆包
│   ├── deepseek.ts         # DeepSeek
│   ├── qwen.ts             # 通义
│   ├── kimi.ts             # Kimi
│   └── index.ts            # 工厂方法（按 env 切换）
├── prompts/                # Prompt 工程
│   ├── claimify.ts         # 声明拆解（Microsoft Claimify 范式）
│   └── verify.ts           # 核查 + 三色标签
├── services/
│   ├── claim-extractor.ts  # 拆解服务
│   └── verifier.ts         # 核查服务（并发）
├── extractors/             # 抖音文案获取（待接 MCP）
├── samples/                # 三个领域真实样例
├── render.ts               # 终端美化输出
└── index.ts                # 端到端入口
```

## 🧪 端到端流程

```
抖音文案
   ↓
[Claimify 四阶段] → 原子声明列表（C1, C2, C3...）
   ↓
[并发核查] → 每条独立判定 🟢🟡🔴
   ↓
[报告渲染] → 终端可视化 + 内容可信度评分
```

## 🛠️ 后续接入计划

- [ ] 接入 `social-post-extractor-mcp` 实现一键 URL 输入
- [ ] 接入豆包/Kimi 原生 Web Search 提供联网证据
- [ ] Next.js 前端 + 同主题视频对照
- [ ] 浏览器插件：刷抖音时旁置「核查」按钮

详见 `方案.md` 和 `验证报告.md`。
