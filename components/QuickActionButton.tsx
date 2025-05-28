
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
      className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-gray-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {action.icon && <span className="flex-shrink-0 w-5 h-5">{action.icon}</span>}
      <span className="text-sm font-medium">{action.label}</span>
    </button>
  );
};

export default QuickActionButton;