/**
 * 豆包 Provider（火山引擎）
 * 完全 OpenAI 兼容，主要差异：
 * - base_url: https://ark.cn-beijing.volces.com/api/v3
 * - 联网通过「联网内容插件」实现（暂未在本适配器中接入）
 */

import { OpenAICompatibleProvider } from './openai-compatible.ts';

export interface DoubaoConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class DoubaoProvider extends OpenAICompatibleProvider {
  constructor(config: DoubaoConfig) {
    super({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? 'https://ark.cn-beijing.volces.com/api/v3',
      model: config.model ?? 'doubao-seed-2.0-pro',
      providerName: 'doubao',
      capabilities: {
        toolUse: true,
        jsonSchema: true,
        webSearchNative: true, // 通过联网插件
        streaming: true,
      },
    });
  }
}
