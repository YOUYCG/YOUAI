
import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';

// Resolve Placeholder API key from multiple sources
function resolvePlaceholderKey(): string {
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.PLACEHOLDER_API_KEY : undefined;
  const env = (import.meta as any)?.env || {};
  const fromVitePrefixed = env.VITE_PLACEHOLDER_API_KEY;
  const fromViteUnprefixed = env.PLACEHOLDER_API_KEY;
  const fromLocalStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('PLACEHOLDER_API_KEY') || undefined : undefined;
  const fromWindow = typeof window !== 'undefined' ? (window as any).__PLACEHOLDER_API_KEY__ : undefined;
  return fromProcess || fromVitePrefixed || fromViteUnprefixed || fromLocalStorage || fromWindow || '';
}

const PLACEHOLDER_API_KEY = resolvePlaceholderKey();

class PlaceholderProvider implements LLMService {
  providerId: LLMProviderType = 'placeholder';
  providerName: string = 'Placeholder LLM';

  isApiKeyConfigured(): boolean {
    return !!PLACEHOLDER_API_KEY;
  }

  async *sendMessageStream(params: LLMChatMessageParams): AsyncIterableIterator<LLMStreamChunk> {
    if (!this.isApiKeyConfigured()) {
      yield { error: "Placeholder API Key is not configured.", isFinal: true };
      return;
    }

    yield { text: `Placeholder received: "${params.prompt}"` };
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (params.fileData) {
      yield { text: ` and file "${params.fileData.name}".` };
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const response = [
      "\n\nThis is a *simulated* response from the Placeholder LLM.",
      " It streams text like a real model would.",
      "\n\nHere's some **mock** data:\n",
      "- Item 1\n- Item 2\n- Item 3\n\n",
      "```javascript\nconsole.log('Hello from Placeholder!');\n```"
    ];

    for (const textPart of response) {
      yield { text: textPart };
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }
    
    // Simulate sources for testing
    yield { 
      sources: [
        { web: { uri: "https://example.com/placeholder-source1", title: "Placeholder Source 1" }},
        { web: { uri: "https://example.com/placeholder-source2", title: "Placeholder Source 2" }}
      ]
    };

    yield { isFinal: true };
  }
}

export default PlaceholderProvider;
