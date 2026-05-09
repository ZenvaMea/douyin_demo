/**
 * DeepSeek Provider
 * OpenAI 兼容
 * 注意：DeepSeek 无原生 Web Search，需要外接 Bing/Tavily
 */

import { OpenAICompatibleProvider } from './openai-compatible.ts';

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(config: DeepSeekConfig) {
    super({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? 'https://api.deepseek.com',
      model: config.model ?? 'deepseek-chat',
      providerName: 'deepseek',
      capabilities: {
        toolUse: true,
        jsonSchema: true,
        webSearchNative: false, // 需自实现
        streaming: true,
      },
    });
  }
}
