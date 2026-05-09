/**
 * 声明拆解服务
 * 调用 LLM，把视频文案拆解成可核查的原子声明
 */

import type { LLMProvider } from '../llm/types.ts';
import {
  CLAIMIFY_SYSTEM_PROMPT,
  CLAIMIFY_JSON_SCHEMA,
  buildClaimifyUserPrompt,
} from '../prompts/claimify.ts';

export interface ExtractedClaim {
  id: string;
  text: string;
  original_quote: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
  search_keywords: string[];
}

export interface DiscardedSegment {
  text: string;
  reason: string;
}

export interface ClaimExtractionResult {
  summary: string;
  primary_domain: string;
  claims: ExtractedClaim[];
  discarded_segments: DiscardedSegment[];
}

export async function extractClaims(
  provider: LLMProvider,
  transcript: string,
): Promise<ClaimExtractionResult> {
  const response = await provider.chat({
    system: CLAIMIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildClaimifyUserPrompt(transcript),
      },
    ],
    jsonSchema: CLAIMIFY_JSON_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.0,
    maxTokens: 4096,
  });

  try {
    return JSON.parse(response.content) as ClaimExtractionResult;
  } catch (err) {
    throw new Error(
      `Claim 拆解结果解析失败：${(err as Error).message}\n原始内容: ${response.content.slice(0, 500)}`,
    );
  }
}
