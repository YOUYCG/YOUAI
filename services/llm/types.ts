
import type { ChatMessage, FileData } from '../../types';
import type { GroundingChunk } from "@google/genai";

export type LLMProviderType = 'gemini' | 'placeholder';

export interface LLMProviderConfig {
  id: LLMProviderType;
  name: string;
}

export interface LLMChatMessageParams {
  prompt: string;
  fileData?: FileData | null;
  history: ChatMessage[];
  // systemInstruction?: string; // Could be added for per-call override
}

export interface LLMStreamChunk {
  text?: string;
  sources?: GroundingChunk[];
  error?: string; // If there's an error specific to this chunk or a final error
  isFinal?: boolean; // To indicate the end of the stream or final state
}

export interface LLMService {
  providerId: LLMProviderType;
  providerName: string;
  isApiKeyConfigured(): boolean;
  sendMessageStream(params: LLMChatMessageParams): AsyncIterableIterator<LLMStreamChunk>;
}
