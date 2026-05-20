'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THEMES, THEME_KEYS, THEME_TYPOGRAPHY, getStoredTheme, storeTheme, getSurfaceClass, getSurfaceStrongClass, type ThemeKey, type ThemeDefinition } from '@/lib/theme-config';

interface ThemeContextValue {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  config: ThemeDefinition;
  typography: typeof THEME_TYPOGRAPHY[ThemeKey];
  surfaceClass: string;
  surfaceStrongClass: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeKey>('default');

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  useEffect(() => {
    document.body.dataset.sibermasTheme = theme;
    document.documentElement.dataset.sibermasTheme = theme;
  }, [theme]);

  const setTheme = (next: ThemeKey) => {
    setThemeState(next);
    storeTheme(next);
  };

  const config = THEMES[theme];
  const typography = THEME_TYPOGRAPHY[theme];
  const surfaceClass = getSurfaceClass(config.useGlassLayer);
  const surfaceStrongClass = getSurfaceStrongClass(config.useGlassLayer);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config, typography, surfaceClass, surfaceStrongClass }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeSwitcher({ className }: { className?: string }): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex rounded-xl p-1 shadow-inner border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] ${className ?? ''}`} aria-label="Pilihan tema">
      {THEME_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          aria-label={`Pilih tema ${THEMES[key].label}`}
          aria-pressed={theme === key}
          className={`group relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${theme === key ? 'bg-[color:var(--profile-primary)] shadow-sm' : 'opacity-70 hover:bg-white/25 hover:opacity-100'}`}
        >
          <span className={`h-4 w-4 rounded-full bg-gradient-to-br ${THEMES[key].preview} ring-1 ring-white/60 transition-transform group-hover:scale-125`} />
          {theme === key && <span className="absolute -bottom-0.5 h-0.5 w-3 rounded-full bg-white/80" />}
        </button>
      ))}
    </div>
  );
}

/**
 * Wrapper that applies theme CSS variables and backdrop to its children.
 * Use this around page content that should be themed.
 */
export function ThemedPage({ children, className }: { children: ReactNode; className?: string }): React.JSX.Element {
  const { config, typography } = useTheme();

  return (
    <div
      className={`min-h-screen text-[color:var(--profile-text)] transition-all duration-700 ease-out ${typography.page} ${className ?? ''}`}
      style={{ ...config.vars, background: config.backdrop }}
    >
      {children}
    </div>
  );
}
