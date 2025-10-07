import React, { useMemo, useState } from 'react';
import { useTheme } from './ThemeProvider';
import type { Conversation } from '../types';
import { DownloadIcon, MoonIcon, PlusIcon, SearchIcon, SunIcon, TrashIcon, PencilIcon } from './icons';

interface SearchHit {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  role: 'user' | 'model';
  snippet: string;
  time: string;
}

interface TopBarProps {
  sessions: Conversation[];
  activeId: string;
  onNewSession: () => void;
  onSwitch: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onExportMarkdown: () => void;
  onExportJSON: () => void;
}

const ACCENTS: Array<{ id: ReturnType<typeof String>; color: string; value: Parameters<ReturnType<typeof useTheme>['setAccent']>[0] }> = [
  { id: 'sky', color: '#0ea5e9', value: 'sky' as any },
  { id: 'emerald', color: '#10b981', value: 'emerald' as any },
  { id: 'violet', color: '#8b5cf6', value: 'violet' as any },
  { id: 'rose', color: '#f43f5e', value: 'rose' as any },
  { id: 'amber', color: '#f59e0b', value: 'amber' as any },
];

const TopBar: React.FC<TopBarProps> = ({
  sessions, activeId, onNewSession, onSwitch, onRename, onDelete, onExportMarkdown, onExportJSON
}) => {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(true);

  const hits = useMemo<SearchHit[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const res: SearchHit[] = [];
    for (const s of sessions) {
      for (const m of s.messages) {
        if (!m.text) continue;
        const idx = m.text.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const snippet = m.text.substring(Math.max(0, idx - 20), Math.min(m.text.length, idx + 80)).replace(/\n/g, ' ');
          res.push({
            sessionId: s.id,
            sessionTitle: s.title,
            messageId: m.id,
            role: m.role,
            snippet,
            time: new Date(m.timestamp).toLocaleString(),
          });
          if (res.length >= 50) break;
        }
      }
      if (res.length >= 50) break;
    }
    return res;
  }, [query, sessions]);

  const currentTitle = sessions.find(s => s.id === activeId)?.title || 'Untitled';

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-black/20 border-b border-slate-800">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Sessions selector */}
        <div className="flex items-center gap-2">
          <select
            value={activeId}
            onChange={(e) => onSwitch(e.target.value)}
            className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-sm text-slate-200"
            title="Switch conversation"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <button
            className="px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70 text-sm"
            onClick={onNewSession}
            title="New conversation"
          >
            <span className="inline-flex items-center gap-1"><PlusIcon className="w-4 h-4" /> 新建</span>
          </button>
          <button
            className="px-2 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70"
            onClick={() => {
              const title = prompt('重命名会话', currentTitle);
              if (title && title.trim()) onRename(activeId, title.trim());
            }}
            title="Rename"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            className="px-2 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-red-200 hover:bg-red-900/30"
            onClick={() => { if (confirm('删除当前会话？')) onDelete(activeId); }}
            title="Delete conversation"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-3xl">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700">
            <SearchIcon className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索全部会话…"
              onFocus={() => setShowResults(true)}
              className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500"
            />
            {query && (
              <span className="text-xs text-slate-400">{hits.length} 个结果</span>
            )}
          </div>
          {showResults && query && hits.length > 0 && (
            <div className="absolute mt-1 w-full max-h-72 overflow-y-auto custom-scrollbar rounded-xl bg-slate-900/95 border border-slate-700 shadow-lg z-10">
              {hits.map((h, i) => (
                <button
                  key={`${h.sessionId}-${h.messageId}-${i}`}
                  onClick={() => { onSwitch(h.sessionId); setShowResults(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/70"
                >
                  <div className="text-xs text-slate-400">{h.sessionTitle} • {h.role} • {h.time}</div>
                  <div className="text-sm text-slate-200 line-clamp-2">{h.snippet}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70 text-sm"
            onClick={onExportMarkdown}
            title="Export Markdown"
          >
            <span className="inline-flex items-center gap-1"><DownloadIcon className="w-4 h-4" /> MD</span>
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70 text-sm"
            onClick={onExportJSON}
            title="Export JSON"
          >
            <span className="inline-flex items-center gap-1"><DownloadIcon className="w-4 h-4" /> JSON</span>
          </button>
        </div>

        {/* Theme + Accent */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 hover:bg-slate-700/70"
            title="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700">
            {ACCENTS.map(a => (
              <button
                key={a.id as string}
                onClick={() => setAccent(a.value as any)}
                className={`w-4 h-4 rounded-full ring-2 ${accent === a.id ? 'ring-white' : 'ring-transparent'}`}
                style={{ backgroundColor: a.color }}
                title={`Accent: ${a.id}`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;