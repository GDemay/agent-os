import { LLMMessage, LLMOptions, LLMProvider, LLMResponse } from '../types';

export class NimProvider implements LLMProvider {
  name = 'nim';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://integrate.api.nvidia.com/v1';
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || 'moonshotai/kimi-k2-5';

    const extraBody: Record<string, unknown> = {};
    if (options?.reasoning) {
      extraBody.chat_template_kwargs = { thinking: true };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: options?.responseFormat,
        stream: false,
        ...(Object.keys(extraBody).length > 0 ? { extra_body: extraBody } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NVIDIA NIM API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
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
  }
}
