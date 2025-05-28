
import React from 'react';
import type { QuickAction } from './types';
import { SparklesIcon, CodeBracketIcon, DocumentTextIcon, ArrowPathIcon } from './components/icons';
import type { LLMProviderConfig } from './services/llm/types';

export const SYSTEM_PROMPT = `You are YOUAI, a helpful AI assistant.
Provide clear, concise, and helpful responses.
Format code snippets using markdown code blocks.
If a user's request is ambiguous, ask for clarification.`;

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'explain-code',
    label: 'Explain Code',
    prompt: 'Explain the following code snippet:\n\n```\n[PASTE CODE HERE]\n```\n\nWhat does it do? How does it work? Are there any potential issues or improvements?',
    icon: <SparklesIcon />,
    description: "Get an explanation for a piece of code."
  },
  {
    id: 'refactor-code',
    label: 'Refactor Code',
    prompt: 'Refactor the following code snippet for better readability, performance, or maintainability:\n\n```\n[PASTE CODE HERE]\n```\n\nExplain the changes made.',
    icon: <ArrowPathIcon />,
    description: "Improve existing code."
  },
  {
    id: 'write-test',
    label: 'Write Unit Test',
    prompt: 'Write a unit test for the following code snippet using [TESTING FRAMEWORK e.g., Jest, PyTest]:\n\n```\n[PASTE CODE HERE]\n```',
    icon: <CodeBracketIcon />,
    description: "Generate unit tests for your code."
  },
  {
    id: 'generate-docs',
    label: 'Generate Documentation',
    prompt: 'Generate documentation (e.g., docstrings, README section) for the following code snippet:\n\n```\n[PASTE CODE HERE]\n```',
    icon: <DocumentTextIcon />,
    description: "Create documentation for code."
  },
  {
    id: 'summarize-text',
    label: 'Summarize Text',
    prompt: 'Summarize the following text:\n\n[PASTE TEXT HERE]\n\nProvide a concise summary of the key points.',
    icon: <SparklesIcon className="w-5 h-5 text-yellow-400" />,
    description: "Get a quick summary of a longer text."
  }
];

export const LLM_PROVIDERS: LLMProviderConfig[] = [
  { id: 'gemini', name: 'Gemini (Flash)' },
  { id: 'placeholder', name: 'Placeholder LLM' },
];
