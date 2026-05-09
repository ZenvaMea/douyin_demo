/**
 * 通义 Qwen Provider（阿里 DashScope OpenAI 兼容模式）
 * Web Search 通过 Responses API（本基础实现暂不接入）
 */

import { OpenAICompatibleProvider } from './openai-compatible.ts';

export interface QwenConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class QwenProvider extends OpenAICompatibleProvider {
  constructor(config: QwenConfig) {
    super({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: config.model ?? 'qwen-plus',
      providerName: 'qwen',
      capabilities: {
        toolUse: true,
        jsonSchema: true,
        webSearchNative: true,
        streaming: true,
      },
    });
  }
}
