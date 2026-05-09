/**
 * OpenAI 兼容 Provider 适配器（通用基类）
 * 适用于：豆包 / DeepSeek / 通义 / Kimi / GLM / MiniMax / 其他兼容厂商
 *
 * 各家差异通过子类覆盖 buildRequest / parseResponse 处理。
 */

import OpenAI from 'openai';
import type {
  ChatRequest,
  ChatResponse,
  LLMProvider,
  ProviderCapabilities,
  ToolCall,
} from './types.ts';
import { LLMError } from './types.ts';

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  /** Provider 名称，如 'doubao' / 'deepseek' */
  providerName: string;
  capabilities: ProviderCapabilities;
}

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  readonly capabilities: ProviderCapabilities;

  protected client: OpenAI;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.providerName;
    this.model = config.model;
    this.capabilities = config.capabilities;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const params = this.buildRequest(request);
      const resp = await this.client.chat.completions.create(params);
      return this.parseResponse(resp as OpenAI.Chat.ChatCompletion);
    } catch (err) {
      throw new LLMError(`${this.name} chat failed: ${(err as Error).message}`, this.name, err);
    }
  }

  protected buildRequest(
    request: ChatRequest,
  ): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }

    for (const m of request.messages) {
      if (m.role === 'tool') {
        messages.push({
          role: 'tool',
          content: m.content,
          tool_call_id: m.toolCallId ?? '',
        });
      } else if (m.role === 'system') {
        messages.push({ role: 'system', content: m.content });
      } else if (m.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: m.content,
          ...(m.toolCalls && m.toolCalls.length > 0
            ? {
                tool_calls: m.toolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
                })),
              }
            : {}),
        });
      } else {
        messages.push({ role: 'user', content: m.content });
      }
    }

    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? 4096,
    };

    const tools: OpenAI.Chat.ChatCompletionTool[] = [];

    if (request.tools) {
      for (const t of request.tools) {
        tools.push({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters as Record<string, unknown>,
          },
        });
      }
    }

    if (request.jsonSchema) {
      // 跨厂商最稳的方式：统一用 tool 调用模拟结构化输出
      // 实测：豆包/DeepSeek/Qwen/Kimi 对 response_format.json_schema 支持差异极大
      // 但所有家都稳定支持 function calling
      tools.push({
        type: 'function',
        function: {
          name: 'respond_with_json',
          description: 'You MUST respond by calling this function with the required JSON structure.',
          parameters: request.jsonSchema as Record<string, unknown>,
        },
      });
      params.tool_choice = {
        type: 'function',
        function: { name: 'respond_with_json' },
      };
    }

    if (tools.length > 0) {
      params.tools = tools;
    }

    return params;
  }

  protected parseResponse(resp: OpenAI.Chat.ChatCompletion): ChatResponse {
    const choice = resp.choices[0];
    if (!choice) {
      throw new LLMError('Empty choices in response', this.name);
    }
    const message = choice.message;

    let content = message.content ?? '';
    const toolCalls: ToolCall[] = [];

    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        if (tc.type !== 'function') continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = { _raw: tc.function.arguments };
        }
        if (tc.function.name === 'respond_with_json') {
          content = JSON.stringify(args);
        } else {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          });
        }
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: resp.usage
        ? {
            inputTokens: resp.usage.prompt_tokens,
            outputTokens: resp.usage.completion_tokens,
          }
        : undefined,
      raw: resp,
    };
  }
}
