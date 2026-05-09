/**
 * LLM 统一类型定义
 * 设计原则：以 OpenAI Chat Completions 为「中间表示」
 * 各 Provider 适配器负责双向翻译到自家格式
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** 系统提示词，单独传，避免各家 system 字段差异 */
  system?: string;
  tools?: ToolDefinition[];
  /** JSON Schema 用于结构化输出 */
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  /** 是否启用联网搜索（各家实现不同） */
  webSearch?: boolean;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  /** 引用源（仅在 webSearch=true 时填充） */
  citations?: Citation[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** 原始响应，调试用 */
  raw?: unknown;
}

export interface Citation {
  url: string;
  title?: string;
  snippet?: string;
}

/**
 * 统一的 LLM Provider 抽象
 * 所有 Provider 必须实现这个接口
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  readonly capabilities: ProviderCapabilities;

  /** 单次对话 */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /** 流式对话（可选） */
  chatStream?(request: ChatRequest): AsyncIterable<StreamChunk>;
}

export interface ProviderCapabilities {
  /** 是否原生支持工具调用 */
  toolUse: boolean;
  /** 是否原生支持结构化输出 */
  jsonSchema: boolean;
  /** 是否原生支持联网搜索 */
  webSearchNative: boolean;
  /** 是否支持流式 */
  streaming: boolean;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done';
  text?: string;
  toolCall?: ToolCall;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
