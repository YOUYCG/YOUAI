
import type { LLMService, LLMProviderType } from './types';
import GeminiProvider from './providers/geminiProvider';
import PlaceholderProvider from './providers/placeholderProvider';

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
    case 'placeholder':
      service = new PlaceholderProvider();
      break;
    default:
      // Fallback or throw error for unknown provider
      console.warn(`Unknown LLM provider type: ${providerType}. Falling back to placeholder.`);
      service = new PlaceholderProvider(); // Or throw new Error(`Unsupported LLM provider: ${providerType}`);
  }
  serviceInstances[providerType] = service;
  return service;
};
