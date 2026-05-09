/**
 * LLM Provider 工厂
 * 通过环境变量 LLM_PROVIDER 切换底层模型
 */

import 'dotenv/config';
import { AnthropicProvider } from './anthropic.ts';
import { DoubaoProvider } from './doubao.ts';
import { DeepSeekProvider } from './deepseek.ts';
import { QwenProvider } from './qwen.ts';
import { KimiProvider } from './kimi.ts';
import type { LLMProvider } from './types.ts';

export type ProviderName = 'anthropic' | 'doubao' | 'deepseek' | 'qwen' | 'kimi';

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少必要环境变量: ${name}`);
  return v;
}

export function createProvider(name?: ProviderName): LLMProvider {
  const provider = (name ?? process.env.LLM_PROVIDER ?? 'anthropic') as ProviderName;

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider({
        apiKey: envRequired('ANTHROPIC_API_KEY'),
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      });

    case 'doubao':
      return new DoubaoProvider({
        apiKey: envRequired('DOUBAO_API_KEY'),
        baseURL: process.env.DOUBAO_BASE_URL,
        model: process.env.DOUBAO_MODEL,
      });

    case 'deepseek':
      return new DeepSeekProvider({
        apiKey: envRequired('DEEPSEEK_API_KEY'),
        baseURL: process.env.DEEPSEEK_BASE_URL,
        model: process.env.DEEPSEEK_MODEL,
      });

    case 'qwen':
      return new QwenProvider({
        apiKey: envRequired('QWEN_API_KEY'),
        baseURL: process.env.QWEN_BASE_URL,
        model: process.env.QWEN_MODEL,
      });

    case 'kimi':
      return new KimiProvider({
        apiKey: envRequired('KIMI_API_KEY'),
        baseURL: process.env.KIMI_BASE_URL,
        model: process.env.KIMI_MODEL,
      });

    default:
      throw new Error(`未知的 Provider: ${provider}`);
  }
}

export * from './types.ts';
