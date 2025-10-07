import type { LLMService, LLMChatMessageParams, LLMStreamChunk, LLMProviderType } from '../types';
import type { ChatMessage as AppChatMessage } from '../../../types';
import { SYSTEM_PROMPT } from '../../../constants';

function get(key: string, fallback = ''): string {
  const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(key) || undefined : undefined;
  if (fromLocal !== undefined) return fromLocal;
  const env = (import.meta as any)?.env || {};
  const fromVite = env[`VITE_${key}`] || env[key];
  if (fromVite) return fromVite;
  const fromProcess = typeof process !== 'undefined' ? (process.env as any)?.[key] : undefined;
  return fromProcess || fallback;
}

function getAnthropicBaseUrl(): string {
  // Official: https://api.anthropic.com
  const url = get('ANTHROPIC_BASE_URL', 'https://api.anthropic.com').trim();
  return url.replace(/\/+$/, '');
}

function convertToAnthropicMessages(history: AppChatMessage[], userPrompt: string) {
  const msgs: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of history) {
    if (!m.text) continue;
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
  }
  msgs.push({ role: 'user', content: userPrompt || '(empty message)' });
  return msgs;
}

async function* streamAnthropic(resp: Response): AsyncIterableIterator<string> {
  // Anthropic streams SSE with specific events. We only care about "content_block_delta".
  const reader = resp.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n').map(l => l.trim());
      let event = '';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data = line.slice(5).trim();
      }
      if (event === 'content_block_delta' && data) {
        try {
          const json = JSON.parse(data);
          const token = json.delta?.text || '';
          if (token) yield token as string;
        } catch {
          // ignore
        }
      }
    }
  }
}

class AnthropicProvider implements LLMService {
  providerId: LLMProviderType = 'anthropic';
  providerName: string = 'Claude (Anthropic)';

  isApiKeyConfigured(): boolean {
    return !!get('ANTHROPIC_API_KEY', '');
  }

  async *sendMessageStream(params: LLMChatMessageParams): AsyncIterableIterator<LLMStreamChunk> {
    const apiKey = get('ANTHROPIC_API_KEY', '').trim();
    const base = getAnthropicBaseUrl();
    const model = get('ANTHROPIC_MODEL', 'claude-3-5-sonnet-latest');

    if (!apiKey) {
      yield { error: 'Anthropic API key is not configured.', isFinal: true };
      return;
    }

    const url = `${base}/v1/messages`;
    const body = {
      model,
      stream: true,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: convertToAnthropicMessages(params.history, params.prompt),
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => '');
        yield { error: `Anthropic request failed: ${resp.status} ${text || resp.statusText}`, isFinal: true };
        return;
      }

      for await (const token of streamAnthropic(resp)) {
        yield { text: token };
      }
      yield { isFinal: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err || 'Unknown error');
      yield { error: `Anthropic error: ${message}`, isFinal: true };
    }
  }
}

export default AnthropicProvider;