
import React, { useState } from 'react';
import type { QuickAction } from '../types';
import { QUICK_ACTIONS } from '../constants';
import QuickActionButton from './QuickActionButton';
import type { LLMProviderType, LLMProviderConfig } from '../services/llm/types';
import ApiKeySettings from './ApiKeySettings';
import { useTheme } from './ThemeProvider';

interface QuickActionsPanelProps {
  onActionClick: (prompt: string) => void;
  selectedProvider: LLMProviderType;
  availableProviders: LLMProviderConfig[];
  onProviderChange: (providerId: LLMProviderType) => void;
  currentProviderName: string;
  isProviderReady?: boolean;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ 
  onActionClick, 
  selectedProvider, 
  availableProviders, 
  onProviderChange,
  currentProviderName,
  isProviderReady = true,
}) => {
  const [showApiSettings, setShowApiSettings] = useState(false);
  const { theme, gradientFrom, gradientTo } = useTheme();

  return (
    <aside className={`w-80 p-4 border-r flex flex-col h-full ${
      theme === 'dark' ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900/80 border-slate-800/70' : 'bg-white border-slate-200'
    }`}>
      {/* Brand */}
      <div className="relative mb-5">
        <div
          className="absolute -inset-0.5 rounded-xl blur opacity-25"
          style={{ background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})` }}
        />
        <div className={`relative flex items-center space-x-3 px-3 py-2 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div
            className="w-9 h-9 rounded-lg shadow-inner"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          />
          <div className="flex-1">
            <h1 className={`text-lg font-semibold tracking-wide ${theme === 'dark' ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' : 'text-slate-900'}`}>YOUAI</h1>
            <div className="flex items-center space-x-1">
              <span className={`inline-block w-2 h-2 rounded-full ${isProviderReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className={`text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{currentProviderName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider selector */}
      <div className="mb-4">
        <label htmlFor="llm-provider-select" className={`block text-[11px] font-semibold tracking-wide mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          AI Provider
        </label>
        <div className="relative">
          <div
            className="absolute -inset-0.5 rounded-lg blur-sm opacity-70 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${gradientFrom}33, ${gradientTo}33)` }}
          />
          <select
            id="llm-provider-select"
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value as LLMProviderType)}
            className={`relative w-full p-2 rounded-lg text-sm border focus:ring-2 ${
              theme === 'dark'
                ? 'bg-slate-800/70 text-slate-200 border-slate-700 focus:ring-sky-500/60 focus:border-sky-500/60'
                : 'bg-white text-slate-800 border-slate-300 focus:ring-sky-500/60 focus:border-sky-500/60'
            }`}
          >
            {availableProviders.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* API settings toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowApiSettings(v => !v)}
          className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
            theme === 'dark' ? 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          {showApiSettings ? '隐藏 API 配置' : '显示 API 配置'}
        </button>
        {showApiSettings && (
          <div className="mt-3">
            <ApiKeySettings />
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="space-y-2 flex-grow overflow-y-auto pr-1 custom-scrollbar">
        <h2 className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Quick Actions</h2>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton key={action.id} action={action} onActionClick={onActionClick} />
        ))}
      </div>

      {/* Footer */}
      <div className={`mt-auto pt-4 border-t text-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
          Powered by <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}>{currentProviderName}</span>
        </p>
      </div>
    </aside>
  );
};

export default QuickActionsPanel;
