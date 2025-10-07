import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';
import type { ChatMessage as AppChatMessage } from '../../../types';
import { SYSTEM_PROMPT } from '../../../constants';

// Read config from multiple sources with localStorage overrides
function get(key: string, fallback = ''): string {
  // localStorage first so users can set without rebuild
  const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(key) || undefined : undefined;
  if (fromLocal !== undefined) return fromLocal;
  const env = (import.meta as any)?.env || {};
  const fromVite = env[`VITE_${key}`] || env[key];
  if (fromVite) return fromVite;
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.[key] : undefined;
  return fromProcess || fallback;
}

function getOpenAIBaseUrl(): string {
  // Default to OpenAI, but this can be any OpenAI-compatible gateway:
  // - https://api.openai.com/v1
  // - https://api.groq.com/openai/v1
  // - https://api.x.ai/v1
  // - https://openrouter.ai/api/v1
  // - https://api.together.xyz/v1
  // - https://api.deepseek.com
  const url = get('OPENAI_BASE_URL', 'https://api.openai.com/v1').trim();
  return url.replace(/\/+$/, ''); // trim trailing slash
}

function convertToOAIHistory(history: AppChatMessage[], userPrompt: string) {
  const msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  if (SYSTEM_PROMPT) {
    msgs.push({ role: 'system', content: SYSTEM_PROMPT });
  }
  for (const m of history) {
    if (!m.text) continue;
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
  }
  msgs.push({ role: 'user', content: userPrompt || '(empty message)' });
  return msgs;
}

async function* streamOpenAI(resp: Response): AsyncIterableIterator<string> {
  // Expects SSE style "data: {json}\n\n"
  const reader = resp.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split by double newlines for SSE events
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n').map(l => l.trim());
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.text ?? '';
          if (token) {
            yield token as string;
          }
        } catch {
          // ignore parse errors, continue
        }
      }
    }
  }
}

class OpenAICompatibleProvider implements LLMService {
  providerId: LLMProviderType = 'openai';
  providerName: string = 'OpenAI-compatible';

  isApiKeyConfigured(): boolean {
    const key = get('OPENAI_API_KEY', '');
    return !!key;
  }

  async *sendMessageStream(params: LLMChatMessageParams): AsyncIterableIterator<LLMStreamChunk> {
    const apiKey = get('OPENAI_API_KEY', '').trim();
    const baseUrl = getOpenAIBaseUrl();
    const model = get('OPENAI_MODEL', 'gpt-4o-mini');

    if (!apiKey) {
      yield { error: 'OpenAI-compatible API Key is not configured.', isFinal: true };
      return;
    }

    const url = `${baseUrl}/chat/completions`;

    const body = {
      model,
      stream: true,
      messages: convertToOAIHistory(params.history, params.prompt),
      temperature: 0.7,
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => '');
        const detail = text || resp.statusText || 'Unknown error';
        yield { error: `OpenAI-compatible request failed: ${resp.status} ${detail}`, isFinal: true };
        return;
      }

      for await (const token of streamOpenAI(resp)) {
        yield { text: token };
      }
      yield { isFinal: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err || 'Unknown error');
      yield { error: `OpenAI-compatible error: ${message}`, isFinal: true };
    }
  }
}

export default OpenAICompatibleProvider;