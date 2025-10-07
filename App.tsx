
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, FileData, Conversation, MessageSendOptions } from './types';
import { getLlmService } from './services/llm/llmServiceFactory';
import type { LLMProviderType, LLMService } from './services/llm/types';
import { LLM_PROVIDERS } from './constants';
import ChatInput from './components/ChatInput';
import ChatMessageComponent from './components/ChatMessage';
import QuickActionsPanel from './components/QuickActionsPanel';
import TopBar from './components/TopBar';
import type { GroundingChunk } from '@google/genai';
import { webSearch } from './services/search/webSearchService';

const SESS_KEY = 'YOUAI_SESSIONS_V1';
const ACTIVE_KEY = 'YOUAI_ACTIVE_SESSION_ID';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>(LLM_PROVIDERS[0]?.id || 'gemini');

  // Per-message augmentation options are provided via ChatInput (no global toggles here)
  const currentLlmServiceRef = useRef<LLMService>(getLlmService(selectedProvider));

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESS_KEY);
      const rawActive = localStorage.getItem(ACTIVE_KEY);
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw);
        parsed.forEach(s => s.messages.forEach(m => m.timestamp = new Date(m.timestamp)));
        setSessions(parsed);
        const id = rawActive && parsed.some(s => s.id === rawActive) ? rawActive : parsed[0]?.id;
        if (id) {
          setActiveId(id);
          const sess = parsed.find(s => s.id === id)!;
          setSelectedProvider(sess.provider as LLMProviderType);
          setMessages(sess.messages);
        }
        return;
      }
    } catch {}
    // Initialize with a default session
    const initialService = getLlmService(selectedProvider);
    const welcome: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `Hello! I'm YOUAI, powered by ${initialService.providerName}. How can I help?` + (!initialService.isApiKeyConfigured() ? `\n\nWarning: API Key for ${initialService.providerName} is not configured.` : ''),
      timestamp: new Date(),
    };
    const sess: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      provider: selectedProvider,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [welcome],
    };
    setSessions([sess]);
    setActiveId(sess.id);
    setMessages(sess.messages);
  }, []);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(SESS_KEY, JSON.stringify(sessions));
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    } catch {}
  }, [sessions, activeId]);

  // Update service on provider change
  useEffect(() => {
    currentLlmServiceRef.current = getLlmService(selectedProvider);
    if (activeId) {
      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, provider: selectedProvider, updatedAt: Date.now() } : s));
    }
  }, [selectedProvider, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Whenever messages change, write back to sessions
  useEffect(() => {
    if (!activeId) return;
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages, updatedAt: Date.now() } : s));
  }, [messages, activeId]);

  const handleProviderChange = (providerId: LLMProviderType) => {
    setSelectedProvider(providerId);
  };

  const handleSendMessage = useCallback(async (inputText: string, inputFile?: FileData | null, options?: MessageSendOptions) => {
    if ((!inputText.trim() && !inputFile) || isLoading) return;

    const llmService = currentLlmServiceRef.current;

    if (!llmService.isApiKeyConfigured()) {
        const apiKeyError = `API Key for ${llmService.providerName} is not configured. Cannot send message.`;
        setError(apiKeyError);
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            text: `Error: ${apiKeyError}`,
            timestamp: new Date()
        }]);
        return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
      fileData: inputFile,
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);
    setCurrentInput('');

    const modelMessageId = crypto.randomUUID();
    const loadingModelMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isLoading: true,
    };
    setMessages(prevMessages => [...prevMessages, loadingModelMessage]);

    // Prepare augmentation: web search + deep think + style controls
    let finalPrompt = inputText;
    let searchSources: GroundingChunk[] | undefined = undefined;

    const webEnabled = !!options?.webSearchEnabled;
    const deepEnabled = !!options?.deepThinkingEnabled;
    const maxRes = options?.webSearchResults ?? 3;
    const citationStyle = options?.citationStyle || 'numeric';
    const outputDetail = options?.outputDetail || 'balanced';

    try {
      if (webEnabled) {
        const results = await webSearch(inputText, maxRes);
        if (results.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
          const list = results.map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.snippet || ''}`).join('\n\n');
          const context = `Web search results (date: ${today}). Use these if relevant and cite sources:\n\n${list}\n\n`;
          finalPrompt = `${context}User question:\n${inputText}`;
          searchSources = results.map(r => ({ web: { uri: r.url, title: r.title } } as any));

          // attach rich previews to loading model message
          setMessages(prev =>
            prev.map(m =>
              m.id === modelMessageId ? { ...m, webPreviews: results.map(r => ({ title: r.title, url: r.url, snippet: r.snippet, content: r.content })) } : m
            )
          );
        }
      }

      // Build instruction parts based on deep thinking, citation style and output detail
      const instr: string[] = [];
      if (deepEnabled) {
        instr.push('Carefully reason internally and verify key steps. Do not reveal your hidden reasoning; provide only the final answer.');
      }
      if (citationStyle === 'numeric') {
        instr.push('When citing web sources, use numeric references like [n] with the link.');
      } else if (citationStyle === 'inline') {
        instr.push('When citing web sources, include inline links in parentheses, e.g., (source: URL).');
      } else if (citationStyle === 'footnote') {
        instr.push('When citing web sources, add a Footnotes section at the end listing [n] URL lines.');
      }
      if (outputDetail === 'concise') {
        instr.push('Answer concisely in 2-4 sentences or short bullet points.');
      } else if (outputDetail === 'balanced') {
        instr.push('Provide a balanced level of detail with clear structure.');
      } else if (outputDetail === 'verbose') {
        instr.push('Provide a comprehensive, well-structured answer with sections and examples where helpful.');
      }
      if (instr.length) {
        finalPrompt += `\n\nInstructions: ${instr.join(' ')}`;
      }

      const stream = llmService.sendMessageStream({ 
        prompt: finalPrompt, 
        fileData: inputFile,
        history: messages.filter(msg => msg.id !== loadingModelMessage.id)
      });
      
      let accumulatedText = "";
      let finalSources: GroundingChunk[] | undefined = searchSources;

      for await (const chunk of stream) {
        if (chunk.error) {
          throw new Error(chunk.error);
        }
        if (chunk.sources) {
            finalSources = (finalSources || []).concat(chunk.sources);
        }
        if (chunk.text) {
            accumulatedText += chunk.text;
        }
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, text: accumulatedText, isLoading: !chunk.isFinal, sources: finalSources } 
              : msg
          )
        );
        if (chunk.isFinal) break;
      }
      
    } catch (e) {
      console.error("Error during message streaming:", e);
      const errorMessageText = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`AI Error: ${errorMessageText}`);
      
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelMessageId
            ? { ...msg, text: `Error: ${errorMessageText}`, isLoading: false, role: 'model' as 'model' } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelMessageId
            ? { ...msg, isLoading: false }
            : msg
        )
      );
    }
  }, [isLoading, selectedProvider, messages]);

  const handleQuickActionClick = (prompt: string) => {
    setCurrentInput(prompt); 
  };

  // Session management handlers
  const newSession = () => {
    const svc = currentLlmServiceRef.current;
    const welcome: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `Hello! I'm YOUAI, powered by ${svc.providerName}. How can I help?` + (!svc.isApiKeyConfigured() ? `\n\nWarning: API Key for ${svc.providerName} is not configured.` : ''),
      timestamp: new Date(),
    };
    const sess: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      provider: selectedProvider,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [welcome],
    };
    setSessions(prev => [sess, ...prev]);
    setActiveId(sess.id);
    setMessages(sess.messages);
    setError(null);
  };

  const switchSession = (id: string) => {
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;
    setActiveId(id);
    setSelectedProvider(sess.provider as LLMProviderType);
    setMessages(sess.messages);
    setError(null);
  };

  const renameSession = (id: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title, updatedAt: Date.now() } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) {
      const next = sessions.find(s => s.id !== id);
      if (next) {
        switchSession(next.id);
      } else {
        newSession();
      }
    }
  };

  // Export helpers
  const exportJSON = () => {
    if (!activeId) return;
    const sess = sessions.find(s => s.id === activeId);
    if (!sess) return;
    const data = {
      id: sess.id,
      title: sess.title,
      provider: sess.provider,
      createdAt: new Date(sess.createdAt).toISOString(),
      updatedAt: new Date(sess.updatedAt).toISOString(),
      messages: sess.messages.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sess.title || 'conversation'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    if (!activeId) return;
    const sess = sessions.find(s => s.id === activeId);
    if (!sess) return;
    const md = [
      `# ${sess.title || 'Conversation'}`,
      ``,
      `- Provider: ${getLlmService(sess.provider).providerName}`,
      `- Created: ${new Date(sess.createdAt).toLocaleString()}`,
      `- Updated: ${new Date(sess.updatedAt).toLocaleString()}`,
      ``,
      ...sess.messages.map(m => `### ${m.role === 'user' ? 'User' : 'Assistant'} (${new Date(m.timestamp).toLocaleString()})\n\n${m.text}`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sess.title || 'conversation'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen antialiased font-inter">
      <QuickActionsPanel 
        onActionClick={handleQuickActionClick}
        selectedProvider={selectedProvider}
        availableProviders={LLM_PROVIDERS}
        onProviderChange={handleProviderChange}
        currentProviderName={currentLlmServiceRef.current.providerName}
        isProviderReady={currentLlmServiceRef.current.isApiKeyConfigured()}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar
          sessions={sessions}
          activeId={activeId}
          onNewSession={newSession}
          onSwitch={switchSession}
          onRename={renameSession}
          onDelete={deleteSession}
          onExportMarkdown={exportMarkdown}
          onExportJSON={exportJSON}
        />
        <main className="flex-grow p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {messages.map(msg => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
          {error && !messages.some(msg => msg.text.includes(error)) && (
             <div className="p-4 rounded-md bg-red-900/80 border border-red-800 text-red-100 my-4 mx-auto max-w-2xl shadow-md">
                <p className="font-semibold text-sm">Error</p>
                <p className="text-xs">{error}</p>
             </div>
          )}
        </main>
        <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            initialValue={currentInput}
        />
      </div>
    </div>
  );
};

export default App;
