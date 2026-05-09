/**
 * 核查 API（Server-Sent Events 流式输出）
 *
 * 聚焦打假：
 *   1. 声明拆解
 *   2. 每条核查（陆续返回三色 + 证据 + 真相版本）
 *
 * 请求体：
 *   { transcript: string, title?: string, author?: string }
 */

import { NextRequest } from 'next/server';
import { createProvider } from '@/lib/llm/index.ts';
import { extractClaims } from '@/lib/services/claim-extractor.ts';
import { verifyClaim } from '@/lib/services/verifier.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface CheckRequestBody {
  transcript: string;
  title?: string;
  author?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CheckRequestBody;
  const { transcript } = body;

  if (!transcript || transcript.trim().length < 10) {
    return new Response(JSON.stringify({ error: '文案过短，请粘贴完整内容' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const provider = createProvider();
        send('meta', { provider: provider.name, model: provider.model });
        send('phase', { phase: 'extracting', label: '正在拆解可核查声明...' });

        const extraction = await extractClaims(provider, transcript);
        send('extraction', extraction);

        send('phase', {
          phase: 'verifying',
          label: `正在并发核查 ${extraction.claims.length} 条声明...`,
          total: extraction.claims.length,
        });

        let done = 0;
        await Promise.all(
          extraction.claims.map(async (claim) => {
            try {
              const result = await verifyClaim(provider, {
                id: claim.id,
                text: claim.text,
                domain: claim.domain,
                priority: claim.priority,
              });
              done += 1;
              send('verification', { progress: done, total: extraction.claims.length, result });
            } catch (err) {
              done += 1;
              send('verification', {
                progress: done,
                total: extraction.claims.length,
                result: {
                  claim_id: claim.id,
                  claim_text: claim.text,
                  error: (err as Error).message,
                },
              });
            }
          }),
        );

        send('done', { ok: true });
        controller.close();
      } catch (err) {
        send('error', { message: (err as Error).message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
