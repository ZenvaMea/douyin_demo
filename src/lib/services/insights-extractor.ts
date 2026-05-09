/**
 * 内容理解服务
 * 一次 LLM 调用 → 核心要点 + 工具化输出
 */

import type { LLMProvider } from '../llm/types.ts';
import {
  INSIGHTS_SYSTEM_PROMPT,
  INSIGHTS_JSON_SCHEMA,
  buildInsightsUserPrompt,
} from '../prompts/insights.ts';

export type ToolkitType =
  | 'cooking'
  | 'fitness'
  | 'workplace'
  | 'learning'
  | 'finance'
  | 'travel'
  | 'lifestyle'
  | 'other';

export interface ToolkitStep {
  order: number;
  title: string;
  detail?: string;
  meta?: string;
}

export interface ToolkitChecklistItem {
  item: string;
  qty?: string;
  note?: string;
}

export interface ToolkitData {
  steps?: ToolkitStep[];
  checklist?: ToolkitChecklistItem[];
  reminders?: string[];
}

export interface InsightsResult {
  summary_30s: string;
  key_points: string[];
  key_data: { label: string; value: string }[];
  action_takeaways: string[];
  toolkit_type: ToolkitType;
  toolkit_title: string;
  toolkit: ToolkitData;
}

export async function extractInsights(
  provider: LLMProvider,
  transcript: string,
  title?: string,
  author?: string,
): Promise<InsightsResult> {
  const response = await provider.chat({
    system: INSIGHTS_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildInsightsUserPrompt(transcript, title, author) },
    ],
    jsonSchema: INSIGHTS_JSON_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.0,
    maxTokens: 4096,
  });

  try {
    return JSON.parse(response.content) as InsightsResult;
  } catch (err) {
    throw new Error(
      `Insights 解析失败：${(err as Error).message}\n原始内容: ${response.content.slice(0, 500)}`,
    );
  }
}
