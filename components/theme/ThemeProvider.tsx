'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  getTheme,
  type Theme,
} from '@/lib/themes';

type ThemeContextValue = {
  theme: Theme; // Resolved theme object with colors and map config
  themeId: string;
  setThemeId: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return ctx;
}

// Provides the active theme to the picker and Mapbox config.
// Colors flow through CSS custom properties, not this context.
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) return;

      const resolved = getTheme(stored).id;
      setThemeIdState(resolved);

      // Clean up dead theme IDs from storage if they were retired
      if (resolved !== stored) window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch {
      // Private mode or storage disabled — stay on the default.
    }
  }, []);

  const setThemeId = useCallback((id: string) => {
    const resolved = getTheme(id);
    setThemeIdState(resolved.id);
    document.documentElement.setAttribute('data-theme', resolved.id);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolved.id);
    } catch {
      // Choice applies for this session and simply won't persist.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: getTheme(themeId), themeId, setThemeId }),
    [themeId, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
