import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * Custom hook for managing dark mode theme
 * Detects system preference and allows manual toggle
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';

    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;

    // Detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'system') {
      if (prefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    });
  };

  return { theme, setTheme, toggleTheme };
}
