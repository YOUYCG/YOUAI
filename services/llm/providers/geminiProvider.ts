
import { GoogleGenAI, type Chat, type GenerateContentResponse, HarmCategory, HarmBlockThreshold, type Content, Part as GeminiPart } from "@google/genai";
import { SYSTEM_PROMPT } from '../../../constants';
import type { FileData, ChatMessage as AppChatMessage } from '../../../types';
import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';

// Resolve API key from multiple sources to be robust across different build systems
function resolveGeminiApiKey(): string {
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : undefined;
  const env = (import.meta as any)?.env || {};
  const fromVitePrefixed = env.VITE_GEMINI_API_KEY;
  const fromViteUnprefixed = env.GEMINI_API_KEY;
  const fromLocalStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || undefined : undefined;
  const fromWindow = typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY__ : undefined;
  return fromProcess || fromVitePrefixed || fromViteUnprefixed || fromLocalStorage || fromWindow || '';
}

// Resolve model name with sensible defaults and overrides
function resolveGeminiModel(): string {
  const env = (import.meta as any)?.env || {};
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.GEMINI_MODEL : undefined;
  const fromVitePrefixed = env.VITE_GEMINI_MODEL;
  const fromViteUnprefixed = env.GEMINI_MODEL;
  const fromLocalStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_MODEL') || undefined : undefined;
  const fromWindow = typeof window !== 'undefined' ? (window as any).__GEMINI_MODEL__ : undefined;
  // Default to a widely available model
  return fromLocalStorage || fromWindow || fromProcess || fromVitePrefixed || fromViteUnprefixed || 'gemini-1.5-flash';
}

const GEMINI_API_KEY = resolveGeminiApiKey();
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Common config (without model name)
const baseConfig = {
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
} as const;

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
      role: msg.role === 'user' ? 'user' : 'model',
      parts: parts,
    };
  }).filter(content => content.parts.length > 0);
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  const lower = msg.toLowerCase();
  return lower.includes('not found') || lower.includes('404') || lower.includes('listmodels') || lower.includes('does not support');
}

async function* streamWithModel(chat: Chat, parts: GeminiPart[]): AsyncIterableIterator<LLMStreamChunk> {
  const result: AsyncIterableIterator<GenerateContentResponse> = await chat.sendMessageStream({ message: parts });
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

    const geminiHistory = convertToGeminiHistory(params.history);
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

    // Model candidates: user-provided first, then safe fallbacks
    const candidates = Array.from(new Set([
      resolveGeminiModel(),
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]));

    let lastErr: unknown = undefined;

    for (const modelName of candidates) {
      try {
        const chat: Chat = ai.chats.create({
          ...baseConfig,
          model: modelName,
          history: geminiHistory,
        });
        // On first successful model, stream and return
        yield* streamWithModel(chat, messageParts);
        return;
      } catch (err) {
        lastErr = err;
        if (isModelNotFoundError(err)) {
          console.warn(`Gemini model "${modelName}" not available. Trying next fallback...`);
          continue; // try next model
        }
        // Non-model-not-found error: report and stop
        console.error("Error sending message to Gemini:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error while communicating with Gemini.";
        yield { error: errorMessage, isFinal: true };
        return;
      }
    }

    // If we exhausted candidates
    const msg = lastErr instanceof Error ? lastErr.message : "All candidate models unavailable.";
    yield { error: `No available Gemini model. ${msg}`, isFinal: true };
  }
}

export default GeminiProvider;
