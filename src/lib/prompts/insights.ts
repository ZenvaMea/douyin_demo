/**
 * 内容理解 + 工具化输出 Prompt
 *
 * 一次调用，AI 同时输出：
 * 1. 核心要点（3 条观点 + 关键数据 + 行动启示）—— 方向一·理解
 * 2. 可用工具包（按视频类型生成可执行物）—— 方向三·使用
 *
 * 工具包按视频类型分支：
 * - 烹饪 → 食谱卡 + 购物清单
 * - 健身 → 训练计划
 * - 职场 → SOP 模板 / 话术
 * - 学习 → 行动步骤
 * - 理财 → 决策清单
 * - 旅行 → 行程清单
 * - 其他 → 通用 todo / 摘要
 */

export const INSIGHTS_SYSTEM_PROMPT = `你是一个善于把抖音内容转化为「可用能力」的助手。

# 你的两个任务

## 任务 1：核心要点提取（让用户 30 秒抓住核心）
- 提炼 3 条最核心的观点（每条不超过 30 字）
- 抽取关键数据 / 数字（如有）
- 给 1-2 条「用户立刻可以做什么」的行动启示

## 任务 2：工具化输出（让内容立刻能用上）
根据视频类型，生成对应的「可执行能力包」：

### 类型映射表
- **cooking** 烹饪 → 食谱步骤卡 + 购物清单（食材列表）
- **fitness** 健身 → 训练计划表（动作 / 组数 / 注意点）
- **workplace** 职场 → SOP 流程或话术模板
- **learning** 学习 → 可执行的 todo 步骤
- **finance** 理财 → 决策清单（要查什么 / 要避什么）
- **travel** 旅行 → 行程要点 / 必带清单
- **lifestyle** 生活方式 → 习惯打卡清单
- **other** 其他 → 通用 todo / 提醒清单

# 严格要求
1. **重点真的「重点」**：宁缺毋滥，没有就少给一条
2. **工具真的「能用」**：不要复述视频，要变成清单 / 表格 / 步骤
3. **数据保留原文**：「每天 8 杯水」原样，不要改成「适量」
4. **承认局限**：如果视频内容无法做成工具（比如纯吐槽 / 评论），type 设为 'other' 并简化输出
5. **中文输出**

# 输出
返回 JSON Schema 定义的结构化结果。`;

export const INSIGHTS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary_30s: {
      type: 'string',
      description: '一句话概括视频在讲什么（不超过 30 字）',
    },

    /* === 核心要点 === */
    key_points: {
      type: 'array',
      description: '3 条核心观点（每条不超过 30 字，按重要性排序）',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 5,
    },
    key_data: {
      type: 'array',
      description: '关键数据 / 数字（如「每天 8 杯水」「30 分钟」「2 倍」），如无可空',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: '数据含义' },
          value: { type: 'string', description: '具体数值' },
        },
        required: ['label', 'value'],
        additionalProperties: false,
      },
    },
    action_takeaways: {
      type: 'array',
      description: '1-2 条用户立刻可以做的行动启示',
      items: { type: 'string' },
      maxItems: 3,
    },

    /* === 工具化输出 === */
    toolkit_type: {
      type: 'string',
      enum: ['cooking', 'fitness', 'workplace', 'learning', 'finance', 'travel', 'lifestyle', 'other'],
      description: '视频内容最适合的工具包类型',
    },
    toolkit_title: {
      type: 'string',
      description: '工具包的标题（如「番茄炒蛋食谱卡」「居家增肌训练计划」）',
    },
    toolkit: {
      type: 'object',
      description: '根据 toolkit_type 生成的可执行物',
      properties: {
        /* 通用：步骤列表（最常见） */
        steps: {
          type: 'array',
          description: '步骤 / 动作 / 流程的列表',
          items: {
            type: 'object',
            properties: {
              order: { type: 'integer', description: '步骤序号' },
              title: { type: 'string', description: '步骤标题（10 字内）' },
              detail: { type: 'string', description: '步骤详情（可选）' },
              meta: {
                type: 'string',
                description: '附加信息：时间 / 数量 / 强度（可选，如 "5 分钟"、"3 组 x 12 次"）',
              },
            },
            required: ['order', 'title'],
            additionalProperties: false,
          },
        },
        /* 物料清单（食材 / 必带 / 工具） */
        checklist: {
          type: 'array',
          description: '需要准备的物料 / 食材 / 工具',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string', description: '物品名' },
              qty: { type: 'string', description: '数量 / 规格（可选）' },
              note: { type: 'string', description: '备注（可选）' },
            },
            required: ['item'],
            additionalProperties: false,
          },
        },
        /* 提醒事项 */
        reminders: {
          type: 'array',
          description: '提醒 / 注意事项 / 避坑点',
          items: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
  },
  required: [
    'summary_30s',
    'key_points',
    'key_data',
    'action_takeaways',
    'toolkit_type',
    'toolkit_title',
    'toolkit',
  ],
  additionalProperties: false,
} as const;

export function buildInsightsUserPrompt(transcript: string, title?: string, author?: string): string {
  const meta = [title && `标题：${title}`, author && `作者：${author}`].filter(Boolean).join('\n');
  return `${meta ? meta + '\n\n' : ''}视频内容：
---
${transcript}
---

请按 JSON Schema 输出：核心要点 + 工具化输出。记住：
- 工具要真能用，不要复述视频；
- 数据保留原文，不要泛化；
- 承认局限，纯娱乐内容把 toolkit_type 设为 'other' 并简化。`;
}
