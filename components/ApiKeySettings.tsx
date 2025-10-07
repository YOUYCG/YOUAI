import React, { useEffect, useState } from 'react';

const mask = (v: string) => (v ? '•'.repeat(Math.min(v.length, 12)) : '');

type Preset = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
};

const OPENAI_PRESETS: Preset[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
  { id: 'xai', name: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1', model: 'grok-2' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'gpt-4o-mini' },
  { id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-gray-600 bg-gray-700">
    <div className="px-3 py-2 text-sm font-semibold text-gray-100 border-b border-gray-600">{title}</div>
    <div className="p-3 space-y-3">{children}</div>
  </div>
);

const ApiKeySettings: React.FC = () => {
  // Gemini
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-1.5-flash');

  // OpenAI-compatible
  const [oaiKey, setOaiKey] = useState<string>('');
  const [oaiBaseUrl, setOaiBaseUrl] = useState<string>('https://api.openai.com/v1');
  const [oaiModel, setOaiModel] = useState<string>('gpt-4o-mini');
  const [oaiPreset, setOaiPreset] = useState<string>('openai');

  // Anthropic
  const [anthKey, setAnthKey] = useState<string>('');
  const [anthBaseUrl, setAnthBaseUrl] = useState<string>('https://api.anthropic.com');
  const [anthModel, setAnthModel] = useState<string>('claude-3-5-sonnet-latest');

  // Placeholder
  const [placeholderKey, setPlaceholderKey] = useState<string>('');

  // Web search providers
  const [tavilyKey, setTavilyKey] = useState<string>('');
  const [serperKey, setSerperKey] = useState<string>('');
  const [maxResults, setMaxResults] = useState<number>(3);

  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    try {
      // Gemini
      setGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setGeminiModel(localStorage.getItem('GEMINI_MODEL') || 'gemini-1.5-flash');

      // OpenAI
      setOaiKey(localStorage.getItem('OPENAI_API_KEY') || '');
      setOaiBaseUrl(localStorage.getItem('OPENAI_BASE_URL') || 'https://api.openai.com/v1');
      setOaiModel(localStorage.getItem('OPENAI_MODEL') || 'gpt-4o-mini');

      // Anthropic
      setAnthKey(localStorage.getItem('ANTHROPIC_API_KEY') || '');
      setAnthBaseUrl(localStorage.getItem('ANTHROPIC_BASE_URL') || 'https://api.anthropic.com');
      setAnthModel(localStorage.getItem('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-latest');

      // Placeholder
      setPlaceholderKey(localStorage.getItem('PLACEHOLDER_API_KEY') || '');

      // Web search
      setTavilyKey(localStorage.getItem('TAVILY_API_KEY') || '');
      setSerperKey(localStorage.getItem('SERPER_API_KEY') || '');
      setMaxResults(Number(localStorage.getItem('WEBSEARCH_MAX_RESULTS') || '3'));
    } catch {
      // ignore
    }
  }, []);

  const applyOpenAIPreset = (id: string) => {
    setOaiPreset(id);
    const p = OPENAI_PRESETS.find(x => x.id === id);
    if (p) {
      setOaiBaseUrl(p.baseUrl);
      setOaiModel(p.model);
    }
  };

  const save = () => {
    try {
      // Gemini
      localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
      localStorage.setItem('GEMINI_MODEL', geminiModel.trim() || 'gemini-1.5-flash');

      // OpenAI-compatible
      localStorage.setItem('OPENAI_API_KEY', oaiKey.trim());
      localStorage.setItem('OPENAI_BASE_URL', oaiBaseUrl.trim().replace(/\/+$/, ''));
      localStorage.setItem('OPENAI_MODEL', oaiModel.trim() || 'gpt-4o-mini');

      // Anthropic
      localStorage.setItem('ANTHROPIC_API_KEY', anthKey.trim());
      localStorage.setItem('ANTHROPIC_BASE_URL', anthBaseUrl.trim().replace(/\/+$/, ''));
      localStorage.setItem('ANTHROPIC_MODEL', anthModel.trim() || 'claude-3-5-sonnet-latest');

      // Placeholder
      if (placeholderKey.trim()) {
        localStorage.setItem('PLACEHOLDER_API_KEY', placeholderKey.trim());
      } else {
        localStorage.removeItem('PLACEHOLDER_API_KEY');
      }

      // Web search
      if (tavilyKey.trim()) {
        localStorage.setItem('TAVILY_API_KEY', tavilyKey.trim());
      } else {
        localStorage.removeItem('TAVILY_API_KEY');
      }
      if (serperKey.trim()) {
        localStorage.setItem('SERPER_API_KEY', serperKey.trim());
      } else {
        localStorage.removeItem('SERPER_API_KEY');
      }
      localStorage.setItem('WEBSEARCH_MAX_RESULTS', String(Math.min(Math.max(maxResults || 3, 1), 8)));

      setStatus('已保存，正在刷新以应用设置…');
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      setStatus('保存失败：浏览器阻止了本地存储。');
    }
  };

  const clearAll = () => {
    try {
      // Gemini
      localStorage.removeItem('GEMINI_API_KEY');
      localStorage.removeItem('GEMINI_MODEL');

      // OpenAI-compatible
      localStorage.removeItem('OPENAI_API_KEY');
      localStorage.removeItem('OPENAI_BASE_URL');
      localStorage.removeItem('OPENAI_MODEL');

      // Anthropic
      localStorage.removeItem('ANTHROPIC_API_KEY');
      localStorage.removeItem('ANTHROPIC_BASE_URL');
      localStorage.removeItem('ANTHROPIC_MODEL');

      // Placeholder
      localStorage.removeItem('PLACEHOLDER_API_KEY');

      // Web search
      localStorage.removeItem('TAVILY_API_KEY');
      localStorage.removeItem('SERPER_API_KEY');
      localStorage.removeItem('WEBSEARCH_MAX_RESULTS');

      setStatus('已清除，正在刷新…');
      setTimeout(() => window.location.reload(), 300);
    } catch {
      setStatus('清除失败：浏览器阻止了本地存储。');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-300">
        在此设置各模型的访问配置（仅保存在当前浏览器的本地存储，不会上传服务器）。你也可以使用“OpenAI-compatible”填入任意兼容的 Base URL + Key + Model（如：OpenAI、Groq、xAI、OpenRouter、Together、DeepSeek 等）。
      </p>

      {/* Gemini */}
      <Section title="Gemini (Google)">
        <div className="space-y-1">
          <label className="block text-xs text-gray-300">API Key</label>
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
          <label className="block text-xs text-gray-300">模型（例如：gemini-2.0-flash、gemini-1.5-flash）</label>
          <input
            type="text"
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            placeholder="gemini-1.5-flash"
            className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Section>

      {/* OpenAI-compatible */}
      <Section title="OpenAI-compatible（OpenAI / Groq / xAI / OpenRouter / Together / DeepSeek ...）">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">API Key</label>
            <div className="flex items-center space-x-2">
              <input
                type={showOpenAI ? 'text' : 'password'}
                value={oaiKey}
                onChange={(e) => setOaiKey(e.target.value)}
                placeholder={oaiKey ? mask(oaiKey) : '粘贴你的 API Key'}
                className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(v => !v)}
                className="text-xs px-2 py-1 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-500"
              >
                {showOpenAI ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">预设</label>
            <select
              value={oaiPreset}
              onChange={(e) => applyOpenAIPreset(e.target.value)}
              className="w-full p-2 bg-gray-800 text-gray-200 rounded-md text-sm border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              {OPENAI_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">Base URL</label>
            <input
              type="text"
              value={oaiBaseUrl}
              onChange={(e) => setOaiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">模型（如：gpt-4o-mini、llama-3.1-70b、grok-2 等）</label>
            <input
              type="text"
              value={oaiModel}
              onChange={(e) => setOaiModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Section>

      {/* Anthropic */}
      <Section title="Claude（Anthropic）">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">API Key</label>
            <div className="flex items-center space-x-2">
              <input
                type={showAnthropic ? 'text' : 'password'}
                value={anthKey}
                onChange={(e) => setAnthKey(e.target.value)}
                placeholder={anthKey ? mask(anthKey) : '粘贴你的 Anthropic API Key'}
                className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(v => !v)}
                className="text-xs px-2 py-1 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-500"
              >
                {showAnthropic ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">Base URL（默认 https://api.anthropic.com）</label>
            <input
              type="text"
              value={anthBaseUrl}
              onChange={(e) => setAnthBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
              className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-300">模型（如：claude-3-5-sonnet-latest、claude-3-haiku）</label>
          <input
            type="text"
            value={anthModel}
            onChange={(e) => setAnthModel(e.target.value)}
            placeholder="claude-3-5-sonnet-latest"
            className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Section>

      {/* Web Search */}
      <Section title="Web Search（联网搜索）">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">Tavily API Key</label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder={tavilyKey ? mask(tavilyKey) : '可选，推荐用于联网搜索'}
              className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-300">Serper API Key</label>
            <input
              type="password"
              value={serperKey}
              onChange={(e) => setSerperKey(e.target.value)}
              placeholder={serperKey ? mask(serperKey) : '可选，Google 搜索代理'}
              className="w-full px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-300">每次搜索最大结果数（1-8）</label>
          <input
            type="number"
            min={1}
            max={8}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value || 3))}
            className="w-24 px-2 py-2 rounded-md bg-gray-800 text-gray-200 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-[11px] text-gray-400">
          开启联网搜索后，模型会在回答前查阅上述搜索结果的摘要，并在答案中引用来源链接。若未配置任何搜索 Key，将跳过联网搜索。
        </p>
      </Section>

      {/* Placeholder */}
      <Section title="Placeholder（占位符 Provider）">
        <div className="space-y-1">
          <label className="block text-xs text-gray-300">API Key（任意非空）</label>
          <div className="flex items-center space-x-2">
            <input
              type={showPlaceholder ? 'text' : 'password'}
              value={placeholderKey}
              onChange={(e) => setPlaceholderKey(e.target.value)}
              placeholder={placeholderKey ? mask(placeholderKey) : '例如 demo'}
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
      </Section>

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