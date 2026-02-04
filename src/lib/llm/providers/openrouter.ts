import { LLMMessage, LLMOptions, LLMProvider, LLMResponse } from '../types';

/**
 * OpenRouter Provider - Access to multiple free models
 * Models:
 * - tngtech/deepseek-r1t-chimera:free - Reasoning/Planning/Coding (most capable)
 * - openai/gpt-oss-120b:free - General purpose fallback
 * - qwen/qwen3-coder:free - Coding tasks (rate limited to 8 req/min)
 */
export class OpenRouterProvider implements LLMProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private lastRequestTime = 0;
  private minRequestInterval = 10000; // 10 seconds between requests to avoid rate limits

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // Use a single reliable model for all tasks to simplify rate limiting
    // tngtech/deepseek-r1t-chimera:free supports both reasoning and coding
    const model = options?.model || 'tngtech/deepseek-r1t-chimera:free';
    const timeoutMs = options?.timeoutMs ?? 180000; // 3 minute timeout for free tier

    // Rate limiting: ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`[OpenRouter] Rate limiting: waiting ${delay}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://agent-os.local',
          'X-Title': 'AgentOS',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const errorData = await response.text();
        throw new Error(
          `OpenRouter rate limit exceeded. Please wait a minute before retrying. Details: ${errorData}`
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        choices: { message: { content: string; role: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model?: string;
      };
      const choice = data.choices[0];

      return {
        content: choice?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: data.model || model,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
}
