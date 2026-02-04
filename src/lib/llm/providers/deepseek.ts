import { LLMMessage, LLMOptions, LLMProvider, LLMResponse } from '../types';

export class DeepSeekProvider implements LLMProvider {
  name = 'deepseek';
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || 'deepseek-chat';
    const timeoutMs = options?.timeoutMs ?? 120000; // Default 2 minute timeout

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // DeepSeek API is OpenAI compatible
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          response_format: options?.responseFormat,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API Error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        choices: { message: { content: string; reasoning_content?: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model?: string;
      };
      const choice = data.choices[0];
      const message = choice.message;

      return {
        content: message.content || '',
        reasoning: message.reasoning_content, // Capture R1 reasoning if present
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
        throw new Error(`DeepSeek LLM request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
}
