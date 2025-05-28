
import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';

const PLACEHOLDER_API_KEY = process.env.PLACEHOLDER_API_KEY;

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
