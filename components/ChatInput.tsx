
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XCircleIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import type { FileData } from '../types';
import { useTheme } from './ThemeProvider';

interface ChatInputProps {
  onSendMessage: (message: string, file?: FileData) => void;
  isLoading: boolean;
  initialValue?: string;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 4; // Gemini API limit for inline data

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, initialValue }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, gradientFrom, gradientTo } = useTheme();

  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight(textareaRef.current);
      }
    }
  }, [initialValue]);

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    const scrollHeight = element.scrollHeight;
    element.style.height = `${Math.min(scrollHeight, 200)}px`; // Max height 200px
    element.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setFileError(`Unsupported file type. Please select a PNG, JPEG, GIF or WEBP image.`);
        setSelectedFile(null);
        setFileDataUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        setFileDataUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileDataUrl(reader.result as string);
      };
      reader.onerror = () => {
        setFileError("Failed to read file.");
        setSelectedFile(null);
        setFileDataUrl(null);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDataUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input
    }
  };

  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if ((message.trim() || selectedFile) && !isLoading && !fileError) {
      const fileInfo: FileData | undefined = selectedFile && fileDataUrl
        ? { name: selectedFile.name, type: selectedFile.type, dataUrl: fileDataUrl }
        : undefined;
      
      onSendMessage(message.trim(), fileInfo);
      setMessage('');
      handleRemoveFile(); // Clear file after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  }, [message, selectedFile, fileDataUrl, isLoading, fileError, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  useEffect(() => {
    if (textareaRef.current) {
        adjustTextareaHeight(textareaRef.current);
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className={`p-4 border-t ${theme === 'dark' ? 'bg-gradient-to-t from-slate-900 to-slate-800 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      {fileError && (
        <div className={`mb-2 text-xs p-2 rounded-md ${theme === 'dark' ? 'text-red-400 bg-red-900/50' : 'text-red-700 bg-red-100'}`}>
          {fileError}
        </div>
      )}
      {selectedFile && fileDataUrl && (
        <div className={`mb-2 flex items-center justify-between text-xs p-2 rounded-lg border ${
          theme === 'dark' ? 'text-slate-300 bg-slate-800/80 border-slate-700' : 'text-slate-700 bg-white border-slate-300'
        }`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            <PaperClipIcon className={`w-4 h-4 flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className="truncate" title={selectedFile.name}>{selectedFile.name}</span>
            <span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} flex-shrink-0`}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button 
            type="button" 
            onClick={handleRemoveFile} 
            className={`p-1 rounded-full focus:outline-none ${theme === 'dark' ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600'}`}
            aria-label="Remove selected file"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className={`flex items-end space-x-2 rounded-2xl p-1 border backdrop-blur ${
        theme === 'dark' ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-300'
      }`}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={ACCEPTED_IMAGE_TYPES.join(",")} // "image/png, image/jpeg, image/gif, image/webp"
          aria-label="Attach file"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`p-3 transition-colors focus:outline-none ${
            theme === 'dark' ? 'text-slate-400 hover:text-sky-500 disabled:text-slate-600' : 'text-slate-500 hover:text-sky-600 disabled:text-slate-300'
          }`}
          aria-label="Attach file"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption or prompt for the image..." : "Type your message or drop code here..."}
          className={`flex-1 p-3 bg-transparent focus:outline-none resize-none overflow-y-hidden max-h-48 text-sm ${
            theme === 'dark' ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
          }`}
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || (!message.trim() && !selectedFile) || !!fileError}
          className={`p-3 rounded-xl text-white disabled:cursor-not-allowed focus:outline-none focus:ring-2 transition-all shadow ${
            theme === 'dark' 
              ? 'disabled:from-slate-600 disabled:to-slate-600 focus:ring-sky-500/50'
              : 'focus:ring-sky-600/40'
          }`}
          style={{ 
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
            opacity: isLoading || (!message.trim() && !selectedFile) || !!fileError ? 0.6 : 1
          }}
          aria-label="Send message"
        >
          {isLoading ? <LoadingSpinner /> : <PaperAirplaneIcon className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;