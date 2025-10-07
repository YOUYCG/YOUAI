
import React, { useState } from 'react';
import type { QuickAction } from '../types';
import { QUICK_ACTIONS } from '../constants';
import QuickActionButton from './QuickActionButton';
import type { LLMProviderType, LLMProviderConfig } from '../services/llm/types';
import ApiKeySettings from './ApiKeySettings';

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

  return (
    <aside className="w-80 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900/80 p-4 border-r border-slate-800/70 flex flex-col h-full">
      {/* Brand */}
      <div className="relative mb-5">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 rounded-xl blur opacity-25"></div>
        <div className="relative flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 shadow-inner" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-wide">YOUAI</h1>
            <div className="flex items-center space-x-1">
              <span className={`inline-block w-2 h-2 rounded-full ${isProviderReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{currentProviderName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider selector */}
      <div className="mb-4">
        <label htmlFor="llm-provider-select" className="block text-[11px] font-semibold tracking-wide text-slate-400 mb-1">
          AI Provider
        </label>
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-400/20 blur-sm opacity-70 pointer-events-none" />
          <select
            id="llm-provider-select"
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value as LLMProviderType)}
            className="relative w-full p-2 bg-slate-800/70 text-slate-200 rounded-lg text-sm border border-slate-700 focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
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
          className="w-full text-left text-sm px-3 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 border border-slate-700 transition-colors"
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
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</h2>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton key={action.id} action={action} onActionClick={onActionClick} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-500">
          Powered by <span className="text-slate-300">{currentProviderName}</span>
        </p>
      </div>
    </aside>
  );
};

export default QuickActionsPanel;
