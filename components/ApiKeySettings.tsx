import React, { useEffect, useState } from 'react';

const mask = (v: string) => (v ? '•'.repeat(Math.min(v.length, 12)) : '');

const ApiKeySettings: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [placeholderKey, setPlaceholderKey] = useState<string>('');
  const [showGemini, setShowGemini] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    try {
      const g = localStorage.getItem('GEMINI_API_KEY') || '';
      const p = localStorage.getItem('PLACEHOLDER_API_KEY') || '';
      setGeminiKey(g);
      setPlaceholderKey(p);
    } catch {
      // ignore
    }
  }, []);

  const save = () => {
    try {
      localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
      if (placeholderKey.trim()) {
        localStorage.setItem('PLACEHOLDER_API_KEY', placeholderKey.trim());
      }
      setStatus('已保存，正在刷新以应用设置…');
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      setStatus('保存失败：浏览器阻止了本地存储。');
    }
  };

  const clearAll = () => {
    try {
      localStorage.removeItem('GEMINI_API_KEY');
      localStorage.removeItem('PLACEHOLDER_API_KEY');
      setStatus('已清除，正在刷新…');
      setTimeout(() => window.location.reload(), 300);
    } catch {
      setStatus('清除失败：浏览器阻止了本地存储。');
    }
  };

  return (
    <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
      <p className="text-xs text-gray-300">
        在此设置 API Key（仅保存在当前浏览器的本地存储，不会上传服务器）。
      </p>

      <div className="space-y-1">
        <label className="block text-xs text-gray-300">Gemini API Key</label>
        <div className="flex items-center space-x-2">
          <input
            type={showGemini ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder={geminiKey ? mask(geminiKey) : '粘贴你的 Gemini API Key'}
            className="flex-1 px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowGemini(v => !v)}
            className="text-xs px-2 py-1 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-500"
          >
            {showGemini ? '隐藏' : '显示'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs text-gray-300">Placeholder API Key（可选）</label>
        <div className="flex items-center space-x-2">
          <input
            type={showPlaceholder ? 'text' : 'password'}
            value={placeholderKey}
            onChange={(e) => setPlaceholderKey(e.target.value)}
            placeholder={placeholderKey ? mask(placeholderKey) : '非空即可，例如 demo'}
            className="flex-1 px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPlaceholder(v => !v)}
            className="text-xs px-2 py-1 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-500"
          >
            {showPlaceholder ? '隐藏' : '显示'}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          onClick={save}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          保存并刷新
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-100 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          清除并刷新
        </button>
        {status && <span className="text-xs text-gray-300">{status}</span>}
      </div>
    </div>
  );
};

export default ApiKeySettings;