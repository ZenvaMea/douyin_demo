/**
 * 核查服务
 * 对每条原子声明独立核查，输出三色标签 + 证据 + 科普重写
 */

import type { LLMProvider } from '../llm/types.ts';
import {
  VERIFY_SYSTEM_PROMPT,
  VERIFY_JSON_SCHEMA,
  buildVerifyUserPrompt,
  type ClaimToVerify,
} from '../prompts/verify.ts';

export type Verdict = 'SUPPORTED' | 'NEI' | 'REFUTED';

export interface Evidence {
  source_type: string;
  source_name: string;
  claim_relation: 'supports' | 'refutes' | 'partially_supports' | 'context_dependent';
  summary: string;
}

export interface VerificationResult {
  claim_id: string;
  claim_text: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: Evidence[];
  truth_rewrite: string;
  caveats: string[];
  needs_web_search: boolean;
}

export async function verifyClaim(
  provider: LLMProvider,
  claim: ClaimToVerify,
): Promise<VerificationResult> {
  const response = await provider.chat({
    system: VERIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildVerifyUserPrompt(claim),
      },
    ],
    jsonSchema: VERIFY_JSON_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.0,
    maxTokens: 2048,
  });

  try {
    return JSON.parse(response.content) as VerificationResult;
  } catch (err) {
    throw new Error(
      `核查结果解析失败：${(err as Error).message}\n原始内容: ${response.content.slice(0, 500)}`,
    );
  }
}

/**
 * 并发核查所有声明
 * 使用 Promise.all 并发调用，失败不阻塞其他声明
 */
export async function verifyClaimsBatch(
  provider: LLMProvider,
  claims: ClaimToVerify[],
  options: { concurrency?: number } = {},
): Promise<Array<VerificationResult | { error: string; claim_id: string }>> {
  const concurrency = options.concurrency ?? 3;
  const results: Array<VerificationResult | { error: string; claim_id: string }> = [];

  for (let i = 0; i < claims.length; i += concurrency) {
    const batch = claims.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (c) => {
        try {
          return await verifyClaim(provider, c);
        } catch (err) {
          return { error: (err as Error).message, claim_id: c.id };
        }
      }),
    );
    results.push(...batchResults);
  }

  return results;
}
