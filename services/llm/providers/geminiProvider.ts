
import { GoogleGenAI, type Chat, type GenerateContentResponse, HarmCategory, HarmBlockThreshold, type Content, Part as GeminiPart } from "@google/genai";
import { SYSTEM_PROMPT } from '../../../constants';
import type { FileData, ChatMessage as AppChatMessage } from '../../../types';
import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';

// Resolve API key from multiple sources to be robust across different build systems
function resolveGeminiApiKey(): string {
  // 1) Build-time injected via Vite define (process.env.*)
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : undefined;
  // 2) Vite standard env exposure (only VITE_* are exposed)
  const env = (import.meta as any)?.env || {};
  const fromVitePrefixed = env.VITE_GEMINI_API_KEY;
  const fromViteUnprefixed = env.GEMINI_API_KEY; // in case user explicitly defined it
  // 3) Optional client-side overrides (useful for debugging without rebuild)
  const fromLocalStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || undefined : undefined;
  const fromWindow = typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY__ : undefined;

  return fromProcess || fromVitePrefixed || fromViteUnprefixed || fromLocalStorage || fromWindow || '';
}

const GEMINI_API_KEY = resolveGeminiApiKey();

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const modelConfig = {
  model: "gemini-2.5-flash-preview-04-17",
  config: {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ]
};

// Helper to convert base64 data URL to a Gemini Part object
function fileToGenerativePart(dataUrl: string, mimeType: string): GeminiPart {
  const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

// Helper to convert app chat history to Gemini history format
function convertToGeminiHistory(history: AppChatMessage[]): Content[] {
  return history.map(msg => {
    const parts: GeminiPart[] = [];
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    if (msg.fileData && msg.fileData.dataUrl && msg.fileData.type.startsWith('image/')) {
      parts.push(fileToGenerativePart(msg.fileData.dataUrl, msg.fileData.type));
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model', // Role is 'user' or 'model' (string literals)
      parts: parts,
    };
  }).filter(content => content.parts.length > 0); // Ensure parts are not empty
}


class GeminiProvider implements LLMService {
  providerId: LLMProviderType = 'gemini';
  providerName: string = 'Gemini (Flash)';

  isApiKeyConfigured(): boolean {
    return !!GEMINI_API_KEY && !!ai;
  }

  async *sendMessageStream(params: LLMChatMessageParams): AsyncIterableIterator<LLMStreamChunk> {
    if (!ai) {
      console.warn("Gemini API client is not initialized. GEMINI_API_KEY available:", !!GEMINI_API_KEY, "length:", GEMINI_API_KEY?.length || 0);
      yield { error: "Gemini API client is not initialized. Check API Key.", isFinal: true };
      return;
    }
    if (!this.isApiKeyConfigured()) {
      yield { error: "Gemini API Key is not configured.", isFinal: true };
      return;
    }

    try {
      const geminiHistory = convertToGeminiHistory(params.history);
      
      const chat: Chat = ai.chats.create({
        ...modelConfig,
        history: geminiHistory, // Pass converted history to the chat session
      });
      
      const messageParts: GeminiPart[] = [];
      if (params.prompt) {
        messageParts.push({ text: params.prompt });
      }
      if (params.fileData && params.fileData.dataUrl && params.fileData.type.startsWith('image/')) {
        messageParts.push(fileToGenerativePart(params.fileData.dataUrl, params.fileData.type));
      } else if (params.fileData) {
        console.warn("Gemini Provider: Non-image file provided, it will be ignored by the model:", params.fileData.name, params.fileData.type);
      }

      if (messageParts.length === 0) {
        messageParts.push({ text: "(empty message)" });
      }
      
      const result: AsyncIterableIterator<GenerateContentResponse> = await chat.sendMessageStream({ message: messageParts });

      for await (const chunk of result) {
        const llmChunk: LLMStreamChunk = {};
        if (chunk.text) {
          llmChunk.text = chunk.text;
        }
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          llmChunk.sources = chunk.candidates[0].groundingMetadata.groundingChunks;
        }
        yield llmChunk;
      }
      yield { isFinal: true };

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      let errorMessage = "An unknown error occurred while communicating with Gemini.";
      if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            errorMessage = "The provided Gemini API key is not valid. Please check your configuration.";
        } else if (error.message.includes("fetch_error") || error.message.includes("NetworkError")) {
            errorMessage = "A network error occurred while trying to reach the Gemini API. Please check your internet connection.";
        } else {
            errorMessage = error.message;
        }
      }
      yield { error: errorMessage, isFinal: true };
    }
  }
}

export default GeminiProvider;
