/**
 * 抖音视频 ASR 服务
 *
 * 流程：
 *   视频 URL
 *      ↓ fetch (带移动端 UA)
 *   下载 mp4 到临时文件
 *      ↓ ffmpeg 抽音频
 *   mp3
 *      ↓ base64
 *   调用豆包多模态 chat 接口（input_audio）
 *      ↓
 *   返回完整字幕文案
 *
 * 用同一个 ARK_API_KEY，无需开通额外服务。
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

export class AsrError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = 'AsrError';
  }
}

/** 下载视频到本地临时文件 */
async function downloadVideo(videoUrl: string): Promise<string> {
  const resp = await fetch(videoUrl, {
    headers: { 'User-Agent': MOBILE_UA, Referer: 'https://www.douyin.com/' },
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new AsrError(`视频下载失败 ${resp.status}`, `URL: ${videoUrl.slice(0, 100)}...`);
  }
  const ab = await resp.arrayBuffer();
  const tmpFile = join(tmpdir(), `douyin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
  await fs.writeFile(tmpFile, new Uint8Array(ab));
  console.log(`[asr] 视频已下载: ${tmpFile} (${(ab.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  return tmpFile;
}

/** ffmpeg 把视频抽音频成 mp3 */
async function extractAudio(videoPath: string): Promise<string> {
  if (!ffmpegPath) throw new AsrError('ffmpeg-static 未正确加载');
  const audioPath = videoPath.replace(/\.mp4$/, '.mp3');
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, [
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-ab',
      '64k', // 64kbps 足够 ASR 识别
      '-ar',
      '16000', // 16kHz 采样率
      '-ac',
      '1', // 单声道
      audioPath,
    ]);
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new AsrError(`ffmpeg 失败 (code=${code})`, stderr.split('\n').slice(-5).join('\n')));
    });
    proc.on('error', (err) => reject(new AsrError(`ffmpeg 启动失败: ${err.message}`)));
  });
  const stat = await fs.stat(audioPath);
  console.log(`[asr] 音频已抽出: ${audioPath} (${(stat.size / 1024).toFixed(1)} KB)`);
  return audioPath;
}

/** 调豆包多模态接口转写 */
async function transcribeViaArk(audioPath: string): Promise<string> {
  const apiKey = process.env.DOUBAO_API_KEY ?? process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new AsrError(
      '未配置 DOUBAO_API_KEY',
      '请在 .env 中设置 DOUBAO_API_KEY=ark-xxx',
    );
  }

  const baseURL = process.env.DOUBAO_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.DOUBAO_ASR_MODEL ?? process.env.DOUBAO_MODEL ?? 'doubao-seed-1-6-flash-250715';

  const audioBuffer = await fs.readFile(audioPath);
  const base64 = audioBuffer.toString('base64');

  console.log(`[asr] 调用 ${model}，音频 ${(audioBuffer.length / 1024).toFixed(1)} KB`);

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请把这段音频里的中文内容完整、准确地转写成文字。直接输出转写后的文本，不要添加任何解释、前缀或标点之外的格式。如果有多个说话人，按时间顺序合并成一段完整文本。',
            },
            {
              type: 'input_audio',
              input_audio: { data: base64, format: 'mp3' },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new AsrError(
      `豆包 ASR 失败 ${resp.status}`,
      `model=${model} | 响应片段: ${text.slice(0, 300)}`,
    );
  }

  let json: { choices?: Array<{ message?: { content?: string } }>; error?: { message: string } };
  try {
    json = JSON.parse(text);
  } catch {
    throw new AsrError('豆包返回非 JSON', text.slice(0, 200));
  }
  if (json.error) {
    throw new AsrError(`豆包业务错误: ${json.error.message}`);
  }
  const transcription = json.choices?.[0]?.message?.content?.trim();
  if (!transcription) {
    throw new AsrError('豆包返回空文本', `完整响应: ${text.slice(0, 300)}`);
  }
  return transcription;
}

/** 清理临时文件 */
async function cleanup(...paths: string[]): Promise<void> {
  await Promise.all(
    paths.map((p) => fs.unlink(p).catch(() => undefined)),
  );
}

/**
 * 主入口：从抖音视频 URL → 完整字幕文案
 */
export async function transcribeDouyinVideo(videoUrl: string): Promise<string> {
  let videoPath: string | undefined;
  let audioPath: string | undefined;
  try {
    videoPath = await downloadVideo(videoUrl);
    audioPath = await extractAudio(videoPath);
    return await transcribeViaArk(audioPath);
  } finally {
    if (videoPath || audioPath) {
      await cleanup(...[videoPath, audioPath].filter((x): x is string => Boolean(x)));
    }
  }
}
