
import React from 'react';
import type { QuickAction } from '../types';
import { QUICK_ACTIONS } from '../constants';
import QuickActionButton from './QuickActionButton';
import type { LLMProviderType, LLMProviderConfig } from '../services/llm/types';

interface QuickActionsPanelProps {
  onActionClick: (prompt: string) => void;
  selectedProvider: LLMProviderType;
  availableProviders: LLMProviderConfig[];
  onProviderChange: (providerId: LLMProviderType) => void;
  currentProviderName: string;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ 
  onActionClick, 
  selectedProvider, 
  availableProviders, 
  onProviderChange,
  currentProviderName 
}) => {
  return (
    <div className="w-72 bg-gray-800 p-4 border-r border-gray-700 flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-4">
        <img src="https://picsum.photos/seed/youailogo/40/40" alt="YOUAI Logo" className="w-8 h-8 rounded-md" />
        <h1 className="text-xl font-semibold text-white">YOUAI</h1>
      </div>

      <div className="mb-4">
        <label htmlFor="llm-provider-select" className="block text-xs font-medium text-gray-400 mb-1">
          AI Provider
        </label>
        <select
          id="llm-provider-select"
          value={selectedProvider}
          onChange={(e) => onProviderChange(e.target.value as LLMProviderType)}
          className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {availableProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto pr-1 custom-scrollbar">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h2>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton key={action.id} action={action} onActionClick={onActionClick} />
        ))}
      </div>
       <div className="mt-auto pt-4 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">
                Powered by {currentProviderName}
            </p>
        </div>
    </div>
  );
};

export default QuickActionsPanel;
