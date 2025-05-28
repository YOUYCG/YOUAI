
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XCircleIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import type { FileData } from '../types';

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
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
      {fileError && (
        <div className="mb-2 text-xs text-red-400 bg-red-900 bg-opacity-50 p-2 rounded-md">
          {fileError}
        </div>
      )}
      {selectedFile && fileDataUrl && (
        <div className="mb-2 flex items-center justify-between text-xs text-gray-300 bg-gray-700 p-2 rounded-md">
          <div className="flex items-center space-x-2 overflow-hidden">
            <PaperClipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate" title={selectedFile.name}>{selectedFile.name}</span>
            <span className="text-gray-500 flex-shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button 
            type="button" 
            onClick={handleRemoveFile} 
            className="text-gray-400 hover:text-red-400 p-1 rounded-full focus:outline-none"
            aria-label="Remove selected file"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-end space-x-2 bg-gray-700 rounded-xl p-1">
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
          className="p-3 text-gray-400 hover:text-blue-500 disabled:text-gray-600 disabled:cursor-not-allowed focus:outline-none"
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
          className="flex-1 p-3 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none overflow-y-hidden max-h-48 text-sm"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || (!message.trim() && !selectedFile) || !!fileError}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Send message"
        >
          {isLoading ? <LoadingSpinner /> : <PaperAirplaneIcon className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;