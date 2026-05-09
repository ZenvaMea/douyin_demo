/**
 * 抖音内容获取（统一接口）
 */

import { extractDouyin } from './douyin.ts';

export interface VideoContent {
  source: 'paste' | 'douyin' | 'asr';
  url?: string;
  title?: string;
  author?: string;
  transcript: string;
  hashtags?: string[];
  videoCover?: string;
}

/** 直接传入文案（适合纯口播或用户已有文案） */
export function fromTranscript(transcript: string, meta?: Partial<VideoContent>): VideoContent {
  return {
    source: 'paste',
    transcript,
    ...meta,
  };
}

/**
 * 从抖音 URL 提取文案
 * 实现：iesdouyin.com iteminfo 接口（无需登录、无需签名）
 */
export async function fetchFromUrl(url: string): Promise<VideoContent> {
  const data = await extractDouyin(url);
  return {
    source: 'douyin',
    url: data.finalUrl,
    title: data.title,
    author: data.author,
    transcript: data.caption,
    hashtags: data.hashtags,
    videoCover: data.videoCover,
  };
}

export { extractDouyin, DouyinExtractError } from './douyin.ts';
export type { DouyinExtraction } from './douyin.ts';
