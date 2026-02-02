import { DeepSeekProvider } from './providers/deepseek';
import { OpenCodeProvider } from './providers/opencode';
import { LLMProvider } from './types';

export * from './types';

export enum LLMProviderType {
  DEEPSEEK = 'deepseek',
  OPENCODE = 'opencode',
}

export class LLMFactory {
  static create(providerName: string = LLMProviderType.DEEPSEEK): LLMProvider {
    switch (providerName.toLowerCase()) {
      case LLMProviderType.DEEPSEEK:
        if (!process.env.DEEPSEEK_API_KEY) {
          throw new Error('DEEPSEEK_API_KEY is not configured in environment variables');
        }
        return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);

      case LLMProviderType.OPENCODE:
        if (!process.env.OPENCODE_API_KEY) {
          throw new Error('OPENCODE_API_KEY is not configured in environment variables');
        }
        return new OpenCodeProvider(process.env.OPENCODE_API_KEY, process.env.OPENCODE_BASE_URL);

      default:
        throw new Error(`Unknown LLM provider: ${providerName}`);
    }
  }
}
