import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'dark' | 'light';
type Accent = 'sky' | 'emerald' | 'violet' | 'rose' | 'amber';

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  gradientFrom: string;
  gradientTo: string;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const ACCENT_MAP: Record<Accent, { from: string; to: string }> = {
  sky: { from: '#0ea5e9', to: '#22d3ee' },
  emerald: { from: '#10b981', to: '#34d399' },
  violet: { from: '#8b5cf6', to: '#a78bfa' },
  rose: { from: '#f43f5e', to: '#fb7185' },
  amber: { from: '#f59e0b', to: '#fbbf24' },
};

const THEME_KEY = 'YOUAI_THEME';
const ACCENT_KEY = 'YOUAI_ACCENT';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem(THEME_KEY) as ThemeMode) || 'dark');
  const [accent, setAccentState] = useState<Accent>(() => (localStorage.getItem(ACCENT_KEY) as Accent) || 'sky');

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {}
    // Write CSS variables for easy usage in inline styles
    const vars = ACCENT_MAP[accent];
    document.documentElement.style.setProperty('--accent-from', vars.from);
    document.documentElement.style.setProperty('--accent-to', vars.to);
  }, [accent]);

  const value = useMemo<ThemeContextType>(() => {
    const vars = ACCENT_MAP[accent];
    return {
      theme,
      setTheme: setThemeState,
      accent,
      setAccent: setAccentState,
      gradientFrom: vars.from,
      gradientTo: vars.to,
    };
  }, [theme, accent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};