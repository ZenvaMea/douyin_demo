/**
 * Claimify 声明拆解 Prompt（中文优化版）
 * 基于 Microsoft Claimify 2025 范式：Selection → Disambiguation → Decomposition
 * 中文场景额外强化了「营销话术识别」能力
 */

export const CLAIMIFY_SYSTEM_PROMPT = `你是一个严谨的中文事实核查助手，专门处理短视频文案。

# 你的任务
把一段视频文案，拆解为一组"可独立核查的原子声明"（atomic claims）。

# 核心原则

## 1. 只保留可验证的事实主张（Selection）
- ✅ 保留：客观事实、因果关系、数据陈述、效果断言
  - 例：「柠檬水能减肥」「西瓜和桃子一起吃会中毒」「这只基金近三年回报30%」
- ❌ 丢弃：主观感受、个人偏好、修辞、情绪表达、营销煽动
  - 例：「我超喜欢」「太好吃了」「家人们冲啊」

## 2. 消除歧义（Disambiguation）
- 把代词、模糊指代替换为具体内容
  - 「这个能让你瘦」→ 「柠檬水能让人减肥」
- 补全省略的主语/宾语
- 如果一句话歧义无法消除，标记为 ambiguous=true 并丢弃

## 3. 原子化拆解（Decomposition）
- 一条声明只包含一个可验证主张
- 复合句必须拆开
  - 「每天空腹喝柠檬水能排毒减肥又美白」
  - → ① 柠檬水能排毒
  - → ② 柠檬水能减肥
  - → ③ 柠檬水能美白
  - → ④ 空腹喝效果更好

## 4. 中文场景特殊处理
- 营销话术「家人们」「绝绝子」「YYDS」：删除
- 数字夸张「99%的人不知道」「医生都震惊了」：保留（这本身可核查）
- 设问反问句：转换为陈述句
  - 「你知道为什么××吗？因为××」→ 「××的原因是××」

# 输出要求
返回 JSON Schema 定义的结构化结果。每条声明必须：
- 是一个完整、可独立核查的陈述句
- 标注所属领域（health/finance/food/science/lifestyle/other）
- 标注核查优先级（high/medium/low）—— 影响越大优先级越高`;

export const CLAIMIFY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '视频文案的一句话主题概括（不超过30字）',
    },
    primary_domain: {
      type: 'string',
      enum: ['health', 'finance', 'food', 'science', 'lifestyle', 'other'],
      description: '视频整体所属领域',
    },
    claims: {
      type: 'array',
      description: '拆解后的可核查声明列表',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '声明编号，格式如 C1, C2, C3',
          },
          text: {
            type: 'string',
            description: '原子化、消除歧义后的完整声明陈述句',
          },
          original_quote: {
            type: 'string',
            description: '在原文中对应的原始片段（用于追溯）',
          },
          domain: {
            type: 'string',
            enum: ['health', 'finance', 'food', 'science', 'lifestyle', 'other'],
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: '核查优先级。涉及健康/金钱/安全的=high；常识类=medium；趣味性=low',
          },
          search_keywords: {
            type: 'array',
            items: { type: 'string' },
            description: '建议的核查搜索关键词（中文，2-4个）',
          },
        },
        required: ['id', 'text', 'original_quote', 'domain', 'priority', 'search_keywords'],
        additionalProperties: false,
      },
    },
    discarded_segments: {
      type: 'array',
      description: '被丢弃的段落（主观/修辞/营销话术），用于透明化',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          reason: {
            type: 'string',
            enum: ['subjective', 'rhetorical', 'marketing', 'ambiguous', 'incomplete'],
          },
        },
        required: ['text', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'primary_domain', 'claims', 'discarded_segments'],
  additionalProperties: false,
} as const;

export function buildClaimifyUserPrompt(transcript: string): string {
  return `请对以下短视频文案进行声明拆解：

---
${transcript}
---

按 JSON Schema 输出结构化结果。记住：宁可少拆，不要瞎拆；每条声明必须是独立可核查的事实陈述。`;
}
