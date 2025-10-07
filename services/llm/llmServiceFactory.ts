
import type { LLMService, LLMProviderType } from './types';
import GeminiProvider from './providers/geminiProvider';
import PlaceholderProvider from './providers/placeholderProvider';
import OpenAICompatibleProvider from './providers/openaiCompatibleProvider';
import AnthropicProvider from './providers/anthropicProvider';

// Cache instances to avoid re-creating them on every call if not necessary
const serviceInstances: Partial<Record<LLMProviderType, LLMService>> = {};

export const getLlmService = (providerType: LLMProviderType): LLMService => {
  if (serviceInstances[providerType]) {
    return serviceInstances[providerType]!;
  }

  let service: LLMService;
  switch (providerType) {
    case 'gemini':
      service = new GeminiProvider();
      break;
    case 'openai':
      service = new OpenAICompatibleProvider();
      break;
    case 'anthropic':
      service = new AnthropicProvider();
      break;
    case 'placeholder':
      service = new PlaceholderProvider();
      break;
    default:
      console.warn(`Unknown LLM provider type: ${providerType}. Falling back to placeholder.`);
      service = new PlaceholderProvider();
  }
  serviceInstances[providerType] = service;
  return service;
};
