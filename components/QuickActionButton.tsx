
import React from 'react';
import type { QuickAction } from '../types';

interface QuickActionButtonProps {
  action: QuickAction;
  onActionClick: (prompt: string) => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ action, onActionClick }) => {
  return (
    <button
      onClick={() => onActionClick(action.prompt)}
      title={action.description || action.label}
      className="w-full group relative text-left"
    >
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 blur transition-opacity"></div>
      <div className="relative flex items-center space-x-3 p-3 bg-slate-800/70 hover:bg-slate-700/70 rounded-xl text-slate-200 hover:text-white border border-slate-700 transition-colors">
        {action.icon && <span className="flex-shrink-0 w-5 h-5 text-sky-400">{action.icon}</span>}
        <span className="text-sm font-medium">{action.label}</span>
      </div>
    </button>
  );
};

export default QuickActionButton;