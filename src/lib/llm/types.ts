export type LLMRole = 'system' | 'user' | 'assistant' | 'developer';

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: { type: 'json_object' | 'text' };
  reasoning?: boolean; // Request reasoning/chain-of-thought if available
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  content: string;
  reasoning?: string; // For models like DeepSeek R1
  usage: LLMUsage;
  model: string;
}

export interface LLMProvider {
  name: string;
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  stream?(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string, void, unknown>;
}
