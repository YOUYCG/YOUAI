
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, FileData } from './types';
import { getLlmService } from './services/llm/llmServiceFactory';
import type { LLMProviderType, LLMStreamChunk, LLMService } from './services/llm/types';
import { LLM_PROVIDERS } from './constants';
import ChatInput from './components/ChatInput';
import ChatMessageComponent from './components/ChatMessage';
import QuickActionsPanel from './components/QuickActionsPanel';
import type { GroundingChunk } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>(LLM_PROVIDERS[0]?.id || 'gemini');
  
  const currentLlmServiceRef = useRef<LLMService>(getLlmService(selectedProvider));

  useEffect(() => {
    currentLlmServiceRef.current = getLlmService(selectedProvider);
    setMessages([]); // Clear messages when provider changes
    setError(null); // Clear error when provider changes
    
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `Hello! I'm YOUAI, powered by ${currentLlmServiceRef.current.providerName}. How can I help?`,
      timestamp: new Date(),
    };

    if (!currentLlmServiceRef.current.isApiKeyConfigured()) {
        const apiKeyError = `API Key for ${currentLlmServiceRef.current.providerName} is not configured. Please set the appropriate environment variable.`;
        setError(apiKeyError);
        welcomeMessage.text += `\n\nWarning: ${apiKeyError}`;
    }
    setMessages([welcomeMessage]);

  }, [selectedProvider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = (providerId: LLMProviderType) => {
    setSelectedProvider(providerId);
  };

  const handleSendMessage = useCallback(async (inputText: string, inputFile?: FileData | null) => {
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

    try {
      const stream = llmService.sendMessageStream({ 
        prompt: inputText, 
        fileData: inputFile,
        history: messages.filter(msg => msg.id !== loadingModelMessage.id) // Pass history without the current loading message
      });
      
      let accumulatedText = "";
      let finalSources: GroundingChunk[] | undefined = undefined;

      for await (const chunk of stream) {
        if (chunk.error) {
          throw new Error(chunk.error); // Propagate error from stream
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
      // Ensure the final state of the message is not loading
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

  return (
    <div className="flex h-screen antialiased text-gray-200 bg-gray-900 font-inter">
      <QuickActionsPanel 
        onActionClick={handleQuickActionClick}
        selectedProvider={selectedProvider}
        availableProviders={LLM_PROVIDERS}
        onProviderChange={handleProviderChange}
        currentProviderName={currentLlmServiceRef.current.providerName}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-800 custom-scrollbar">
          {messages.map(msg => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
          {error && !messages.some(msg => msg.text.includes(error)) && ( // Show general error if not part of a message
             <div className="p-4 rounded-md bg-red-800 text-red-100 my-4 mx-auto max-w-2xl">
                <p className="font-semibold text-sm">Error:</p>
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
