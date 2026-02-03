import { DeepSeekProvider } from './providers/deepseek';
import { NimProvider } from './providers/nim';
import { OpenCodeProvider } from './providers/opencode';
import { LLMProvider } from './types';

export * from './types';

export enum LLMProviderType {
  DEEPSEEK = 'deepseek',
  OPENCODE = 'opencode',
  NIM = 'nim',
}

export class LLMFactory {
  static create(providerName: string = LLMProviderType.NIM): LLMProvider {
    switch (providerName.toLowerCase()) {
      case LLMProviderType.NIM: {
        const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NIM_API_KEY;
        if (!apiKey) {
          throw new Error('NVIDIA_NIM_API_KEY is not configured in environment variables');
        }
        return new NimProvider(apiKey, process.env.NVIDIA_NIM_BASE_URL);
      }

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
