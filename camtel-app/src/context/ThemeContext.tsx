import { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = 'camtel_theme';

function loadStored(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    /* ignore */
  }
  // fallback preference
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

/** Document typed loosely for `startViewTransition` — not every lib.dom
 *  version in this repo's TS toolchain ships the type yet, and the API
 *  itself is still unsupported in some browsers (Firefox, older Safari). */
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

/** Runs `apply` inside the View Transitions API so the whole page cross-fades
 *  between the old and new theme instead of snapping instantly. Falls back to
 *  applying the change directly when the API is unsupported or the visitor
 *  has asked for reduced motion. React's update is forced synchronous via
 *  flushSync so the DOM already reflects the new theme by the moment the
 *  browser captures the "after" snapshot for the transition. */
function withThemeTransition(apply: () => void) {
  const doc = document as ViewTransitionDocument;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reducedMotion) {
    apply();
    return;
  }
  doc.startViewTransition(() => flushSync(apply));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(loadStored);

  // sync layout effect
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    withThemeTransition(() => setThemeState(t));
  }, []);
  const toggleTheme = useCallback(() => {
    withThemeTransition(() => {
      setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
