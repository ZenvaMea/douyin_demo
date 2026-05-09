/**
 * 抖音视频文案提取
 *
 * 实现路径：
 *   1. 接受短链（v.douyin.com/xxx）或完整链接
 *   2. 跟随重定向，从最终 URL 提取 aweme_id（19 位数字）
 *   3. 调用 iesdouyin.com 旧版 iteminfo 接口拿 desc/作者/视频
 *
 * 关键点：
 *   - 必须用移动端 UA（桌面端会触发 ttwid/msToken 校验）
 *   - desc 字段就是用户发布时的"文案"——绝大多数情况下不需要 ASR
 *   - 接口偶发 412/403，需要 Referer 兜底
 */

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

export interface DouyinExtraction {
  awemeId: string;
  title: string;
  author: string;
  authorAvatar?: string;
  caption: string;
  hashtags: string[];
  videoCover?: string;
  videoUrl?: string; // 无水印视频下载 URL
  duration?: number;
  finalUrl: string;
}

export class DouyinExtractError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = 'DouyinExtractError';
  }
}

/**
 * 从任意抖音文本/链接中提取出 URL 和 aweme_id
 */
function extractUrlFromText(input: string): string {
  // 1. 直接 URL
  const urlMatch = input.match(/https?:\/\/[^\s]+/);
  if (urlMatch) return urlMatch[0];
  // 2. 用户可能直接粘贴 19 位 ID
  const idMatch = input.match(/^(\d{15,})$/);
  if (idMatch) return `https://www.iesdouyin.com/share/video/${idMatch[1]}/`;
  throw new DouyinExtractError('未找到有效的抖音链接', '请粘贴 v.douyin.com 短链或完整网页链接');
}

async function followRedirect(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': MOBILE_UA },
      redirect: 'follow',
    });
    console.log('[douyin debug] start url:', url);
    console.log('[douyin debug] final url:', resp.url);
    return resp.url;
  } catch (err) {
    throw new DouyinExtractError(`短链跳转失败: ${(err as Error).message}`, '请检查网络或链接是否有效');
  }
}

function extractAwemeId(url: string): string {
  // 19 位 ID 通常在 URL 路径中，如：
  //   https://www.iesdouyin.com/share/video/7382729384729384738/
  //   https://www.douyin.com/video/7382729384729384738
  const match = url.match(/\/(\d{15,})/);
  if (!match) {
    throw new DouyinExtractError(
      `从 URL 中未提取到 aweme_id`,
      `URL: ${url} —— 可能是用户主页或私密视频`,
    );
  }
  return match[1] as string;
}

interface ParsedItem {
  desc: string;
  nickname: string;
  hashtags: string[];
  cover?: string;
  videoUrl?: string;
  videoUri?: string;
}

/**
 * 从 share 页面 HTML 中提取视频信息
 *
 * 实测：iesdouyin 的 iteminfo 接口在 2025 末已要求 X-Bogus 签名，
 * 但 share 页面（https://www.iesdouyin.com/share/video/{id}/）依然 SSR 注入了
 * desc / nickname 等字段，可以直接正则提取。
 *
 * 改用此方案可绕过签名要求。
 */
async function fetchSharePage(awemeId: string): Promise<ParsedItem> {
  const url = `https://www.iesdouyin.com/share/video/${awemeId}/`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': MOBILE_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    redirect: 'follow',
  });

  console.log('[douyin debug] share page status:', resp.status);

  if (!resp.ok) {
    throw new DouyinExtractError(
      `抖音 share 页面返回 ${resp.status}`,
      `aweme_id=${awemeId} | 可能已被风控或视频不存在`,
    );
  }

  const html = await resp.text();
  console.log('[douyin debug] html length:', html.length);

  // 多种正则备选，抖音可能随版本更换字段位置
  const descMatch =
    html.match(/"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/) ??
    html.match(/"share_desc"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const nicknameMatch = html.match(/"nickname"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const coverMatch = html.match(/"cover"\s*:\s*\{[^}]*?"url_list"\s*:\s*\["([^"]+)"/);
  // play_addr 含视频 URL：playwm 是带水印版，play 是无水印版
  const playAddrMatch = html.match(/"play_addr"\s*:\s*\{[^}]*?"uri"\s*:\s*"([^"]+)"[^}]*?"url_list"\s*:\s*\["([^"]+)"/);

  if (!descMatch && !nicknameMatch) {
    throw new DouyinExtractError(
      '抖音 share 页面未提取到关键字段',
      `aweme_id=${awemeId} | 页面结构可能已更新。HTML 大小=${html.length}, 前 200 字: ${html.slice(0, 200).replace(/\s+/g, ' ')}`,
    );
  }

  const decode = (s: string) => {
    try {
      // 处理 unicode 转义 + 普通转义
      return JSON.parse(`"${s}"`);
    } catch {
      return s;
    }
  };

  const rawDesc = descMatch ? decode(descMatch[1] as string) : '';
  const nickname = nicknameMatch ? decode(nicknameMatch[1] as string) : '未知作者';

  // 从 desc 中提取 #话题
  const hashtags = Array.from(rawDesc.matchAll(/#([^\s#]+)/g)).map((m) => (m as RegExpMatchArray)[1] as string);

  let videoUri: string | undefined;
  let videoUrl: string | undefined;
  if (playAddrMatch) {
    videoUri = playAddrMatch[1];
    const playwmUrl = decode(playAddrMatch[2] as string);
    // 把 playwm（带水印）替换为 play（无水印）
    videoUrl = playwmUrl.replace('/playwm/', '/play/').replace('playwm', 'play');
  }

  return {
    desc: rawDesc,
    nickname,
    hashtags,
    cover: coverMatch ? decode(coverMatch[1] as string) : undefined,
    videoUri,
    videoUrl,
  };
}

export async function extractDouyin(input: string): Promise<DouyinExtraction> {
  const startUrl = extractUrlFromText(input.trim());
  const finalUrl = await followRedirect(startUrl);
  const awemeId = extractAwemeId(finalUrl);
  const item = await fetchSharePage(awemeId);

  const caption = (item.desc ?? '').trim();
  if (!caption) {
    throw new DouyinExtractError(
      '该视频没有文字文案',
      '可能是纯口播视频，目前需要用户改用粘贴文案模式（语音转文字尚未接入）',
    );
  }

  // 标题取去话题后的纯文本前若干字
  const titleClean = caption.replace(/#\S+/g, '').trim();
  const title = titleClean.length > 0 ? titleClean.split('\n')[0]!.slice(0, 60) : caption.slice(0, 60);

  return {
    awemeId,
    title,
    author: item.nickname,
    caption,
    hashtags: item.hashtags,
    videoCover: item.cover,
    videoUrl: item.videoUrl,
    finalUrl,
  };
}
