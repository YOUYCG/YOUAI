
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`p-3 rounded-xl max-w-2xl break-words shadow-md ${ // Added shadow-md for better definition
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-200'
        }`}
      >
        {message.isLoading && message.role === 'model' && !message.text && !message.fileData ? (
            <div className="flex items-center space-x-2 p-2">
                <LoadingSpinner /> 
                <span>Thinking...</span>
            </div>
        ) : (
          <>
            {message.fileData && message.fileData.dataUrl && message.fileData.type.startsWith('image/') && (
              <div className="mb-2 border border-gray-500 rounded-lg overflow-hidden">
                <img 
                  src={message.fileData.dataUrl} 
                  alt={message.fileData.name || 'Uploaded image'} 
                  className="max-w-xs max-h-64 object-contain rounded-lg" // Constrained size
                />
              </div>
            )}
            {message.text && (
              <article className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              </article>
            )}
          </>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
            <ul className="list-disc list-inside space-y-1">
              {message.sources.map((source, index) => (
                source.web && (
                    <li key={index} className="text-xs">
                    <a 
                        href={source.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                        {source.web.title || source.web.uri}
                    </a>
                    </li>
                )
              ))}
            </ul>
          </div>
        )}
        <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;