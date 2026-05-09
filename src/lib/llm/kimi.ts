/**
 * Kimi (Moonshot) Provider
 * OpenAI 兼容
 * 内置 $web_search builtin_function（按调用计费）
 */

import { OpenAICompatibleProvider } from './openai-compatible.ts';

export interface KimiConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class KimiProvider extends OpenAICompatibleProvider {
  constructor(config: KimiConfig) {
    super({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? 'https://api.moonshot.cn/v1',
      model: config.model ?? 'moonshot-v1-32k',
      providerName: 'kimi',
      capabilities: {
        toolUse: true,
        jsonSchema: true,
        webSearchNative: true,
        streaming: true,
      },
    });
  }
}
