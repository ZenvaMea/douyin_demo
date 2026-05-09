/**
 * 单条声明核查 Prompt
 * 输入：一条原子声明 + （未来）联网检索结果
 * 输出：三色标签 + 证据 + 科普重写
 */

export const VERIFY_SYSTEM_PROMPT = `你是一个严谨的中文事实核查员。

# 你的任务
针对单条原子声明，给出可信的核查结论。

# 核查输出三色标签
- 🟢 SUPPORTED（已验证）：有权威证据明确支持
- 🟡 NEI（证据不足/存疑）：证据不足、有争议、或需要前提条件
- 🔴 REFUTED（误导）：与公认事实/科学共识相悖

# 证据强度评分（1-5星）
- ⭐⭐⭐⭐⭐ 学术论文 / 国家级机构（WHO、卫健委、中科院、营养学会）
- ⭐⭐⭐⭐ 主流权威媒体 / 三甲医院 / 知名专家共识
- ⭐⭐⭐ 行业协会 / 主流科普平台（果壳、丁香医生、科普中国）
- ⭐⭐ 普通媒体报道 / 单一来源
- ⭐ 自媒体 / 社交平台传言

# 严格要求
1. **绝对禁止脑补**：你必须基于已有的训练知识做谨慎判断；不确定时直接选 NEI
2. **必须给出 quote**：如果引用某个机构/研究，必须明确说出该来源名称
3. **必须区分语境**：「柠檬有维C」是真，但「柠檬维C含量高」是假
4. **必须诚实标注时效**：如果结论可能因时间变化（如医学共识更新），明确说明
5. **科普重写要简短有力**：3-5 句话说清真相，不堆砌

# 输出
返回 JSON Schema 定义的结构化结果。`;

export const VERIFY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    claim_id: { type: 'string' },
    claim_text: { type: 'string' },
    verdict: {
      type: 'string',
      enum: ['SUPPORTED', 'NEI', 'REFUTED'],
      description: '核查结论：已验证/证据不足/误导',
    },
    confidence: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: '证据强度评分（1-5星）',
    },
    reasoning: {
      type: 'string',
      description: '核查推理过程（200字以内）',
    },
    evidence: {
      type: 'array',
      description: '支持/反驳的证据列表',
      items: {
        type: 'object',
        properties: {
          source_type: {
            type: 'string',
            enum: ['academic', 'official', 'mainstream_media', 'expert_consensus', 'professional_media', 'common_sense'],
          },
          source_name: { type: 'string', description: '具体的机构/期刊/媒体/专家名称' },
          claim_relation: {
            type: 'string',
            enum: ['supports', 'refutes', 'partially_supports', 'context_dependent'],
          },
          summary: { type: 'string', description: '该证据的核心结论（1-2句话）' },
        },
        required: ['source_type', 'source_name', 'claim_relation', 'summary'],
        additionalProperties: false,
      },
    },
    truth_rewrite: {
      type: 'string',
      description: '基于事实的科普重写（3-5句话）',
    },
    caveats: {
      type: 'array',
      items: { type: 'string' },
      description: '需要注意的前提/例外/适用人群',
    },
    needs_web_search: {
      type: 'boolean',
      description: '是否建议进一步联网检索（用于后续接入 Web Search 工具）',
    },
  },
  required: [
    'claim_id',
    'claim_text',
    'verdict',
    'confidence',
    'reasoning',
    'evidence',
    'truth_rewrite',
    'caveats',
    'needs_web_search',
  ],
  additionalProperties: false,
} as const;

export interface ClaimToVerify {
  id: string;
  text: string;
  domain: string;
  priority: string;
}

export function buildVerifyUserPrompt(claim: ClaimToVerify, contextHint?: string): string {
  return `请核查以下声明：

【声明编号】${claim.id}
【所属领域】${claim.domain}
【优先级】${claim.priority}
【声明内容】${claim.text}
${contextHint ? `\n【上下文提示】\n${contextHint}\n` : ''}

按 JSON Schema 输出核查结果。注意：你目前只能基于内置知识判断，如不确定务必选 NEI 并将 needs_web_search 设为 true。`;
}
