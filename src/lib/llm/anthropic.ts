/**
 * Claude (Anthropic) Provider 适配器
 * 把 Anthropic 原生 Messages API 翻译成统一 ChatRequest/ChatResponse
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatRequest,
  ChatResponse,
  Citation,
  LLMProvider,
  ProviderCapabilities,
  ToolCall,
} from './types.ts';
import { LLMError } from './types.ts';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  readonly model: string;
  readonly capabilities: ProviderCapabilities = {
    toolUse: true,
    jsonSchema: true, // 用 tool_use 模拟最稳
    webSearchNative: true, // Claude 有原生 web_search server tool
    streaming: true,
  };

  private client: Anthropic;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'user' as const,
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: m.toolCallId ?? '',
                  content: m.content,
                },
              ],
            };
          }
          return { role: m.role as 'user' | 'assistant', content: m.content };
        });

      const tools = this.buildTools(request);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.1,
        system: request.system,
        messages,
        ...(tools.length > 0 ? { tools } : {}),
      });

      return this.parseResponse(response);
    } catch (err) {
      throw new LLMError(`Anthropic chat failed: ${(err as Error).message}`, this.name, err);
    }
  }

  private buildTools(request: ChatRequest): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = [];

    if (request.tools) {
      for (const t of request.tools) {
        tools.push({
          name: t.name,
          description: t.description,
          input_schema: t.parameters as Anthropic.Tool['input_schema'],
        });
      }
    }

    if (request.jsonSchema) {
      tools.push({
        name: 'respond_with_json',
        description: 'Respond using the required JSON schema. Always call this tool.',
        input_schema: request.jsonSchema as Anthropic.Tool['input_schema'],
      });
    }

    return tools;
  }

  private parseResponse(resp: Anthropic.Message): ChatResponse {
    let textContent = '';
    const toolCalls: ToolCall[] = [];
    const citations: Citation[] = [];

    for (const block of resp.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    const jsonToolCall = toolCalls.find((c) => c.name === 'respond_with_json');
    if (jsonToolCall) {
      textContent = JSON.stringify(jsonToolCall.arguments);
    }

    return {
      content: textContent,
      toolCalls: toolCalls.filter((c) => c.name !== 'respond_with_json'),
      citations: citations.length > 0 ? citations : undefined,
      usage: {
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
      },
      raw: resp,
    };
  }
}
