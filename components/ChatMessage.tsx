
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { useTheme } from './ThemeProvider';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { theme, gradientFrom, gradientTo } = useTheme();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`px-4 py-3 rounded-2xl max-w-3xl break-words shadow-lg ring-1 ${
          isUser 
            ? 'text-white ring-blue-500/20'
            : theme === 'dark'
              ? 'bg-slate-800/80 text-slate-100 ring-slate-700'
              : 'bg-white text-slate-800 ring-slate-200'
        }`}
        style={isUser ? { background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` } : undefined}
      >
        {message.isLoading && message.role === 'model' && !message.text && !message.fileData ? (
            <div className="flex items-center space-x-2 p-2">
                <LoadingSpinner /> 
                <span>Thinking...</span>
            </div>
        ) : (
          <>
            {message.fileData && message.fileData.dataUrl && message.fileData.type.startsWith('image/') && (
              <div className={`mb-2 rounded-lg overflow-hidden ${theme === 'dark' ? 'border border-slate-600' : 'border border-slate-200'}`}>
                <img 
                  src={message.fileData.dataUrl} 
                  alt={message.fileData.name || 'Uploaded image'} 
                  className="max-w-xs max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
            {message.text && (
              <article className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              </article>
            )}
          </>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className={`mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`}>
            <h4 className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Sources</h4>
            <ul className="list-disc list-inside space-y-1">
              {message.sources.map((source, index) => (
                source.web && (
                    <li key={index} className="text-xs">
                    <a 
                        href={source.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                        {source.web.title || source.web.uri}
                    </a>
                    </li>
                )
              ))}
            </ul>
          </div>
        )}
        <div className={`text-[10px] mt-2 ${isUser ? 'text-blue-200/90' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;