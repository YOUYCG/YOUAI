
import type { GroundingChunk } from "@google/genai";    

export interface FileData {
  name: string;
  type: string; // MIME type
  dataUrl: string; // base64 encoded data URL
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: GroundingChunk[];
  fileData?: FileData | null; // Optional file data for user messages
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: React.ReactNode;
  description?: string;
}