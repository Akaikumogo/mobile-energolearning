import { useEffect, useState, type ReactNode } from 'react';
import { AppContext, type Theme, type Lang } from '@/context/app-context';

export type { Theme, Lang };

const getInitialValue = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? (saved as T) : defaultValue;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialValue('theme', 'light'),
  );
  const [lang, setLangState] = useState<Lang>(() =>
    getInitialValue('lang', 'uz'),
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, lang, setLang }}>
      {children}
    </AppContext.Provider>
  );
};
