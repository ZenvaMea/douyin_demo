/**
 * 抖音链接提取 API（含 ASR 兜底）
 *
 * 流程：
 *   1. 抓 share 页面拿 desc + author + videoUrl
 *   2. 如果 desc 太短（< 30 字），自动触发 ASR 转写视频
 *   3. desc + ASR 结果合并返回
 */

import { NextRequest } from 'next/server';
import { extractDouyin, DouyinExtractError } from '@/lib/extractors/index.ts';
import { transcribeDouyinVideo, AsrError } from '@/lib/services/asr.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 视频下载 + ASR 可能需要时间

/**
 * desc 去掉话题标签后短于此长度则触发 ASR
 * 80% 的抖音视频 desc 都很短（仅标题+话题），需要 ASR 拿到视频里的真实内容
 */
const MIN_PURE_DESC_LENGTH = 80;

export async function POST(req: NextRequest) {
  let body: { url?: string; forceAsr?: boolean };
  try {
    body = (await req.json()) as { url?: string; forceAsr?: boolean };
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return Response.json({ error: '请粘贴抖音视频链接' }, { status: 400 });
  }

  try {
    // 1. 解析 share 页面
    const meta = await extractDouyin(url);
    // 去掉话题标签和空白后的纯文本长度
    const pureDesc = (meta.caption ?? '').replace(/#\S+/g, '').replace(/\s+/g, '').trim();
    const descTooShort = pureDesc.length < MIN_PURE_DESC_LENGTH;
    const shouldRunAsr = (descTooShort || body.forceAsr) && meta.videoUrl;

    let asrText: string | undefined;
    let asrError: string | undefined;

    if (shouldRunAsr && meta.videoUrl) {
      try {
        asrText = await transcribeDouyinVideo(meta.videoUrl);
      } catch (err) {
        asrError =
          err instanceof AsrError
            ? `${err.message}${err.hint ? ` — ${err.hint}` : ''}`
            : (err as Error).message;
      }
    }

    // 合并 desc 和 ASR 字幕
    const parts: string[] = [];
    if (meta.caption) parts.push(`【视频描述】${meta.caption}`);
    if (asrText) parts.push(`【视频内容】${asrText}`);
    const transcript = parts.join('\n\n').trim();

    return Response.json({
      ok: true,
      data: {
        source: 'douyin',
        url: meta.finalUrl,
        title: meta.title,
        author: meta.author,
        transcript: transcript || meta.caption,
        descLength: meta.caption.length,
        asrUsed: Boolean(asrText),
        asrLength: asrText?.length ?? 0,
        asrError,
        hashtags: meta.hashtags,
      },
    });
  } catch (err) {
    if (err instanceof DouyinExtractError) {
      return Response.json(
        { ok: false, error: err.message, hint: err.hint },
        { status: 422 },
      );
    }
    return Response.json(
      { ok: false, error: '提取失败', hint: (err as Error).message },
      { status: 500 },
    );
  }
}
