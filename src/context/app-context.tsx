import { createContext } from 'react';

export type Theme = 'light' | 'dark';
export type Lang = 'uz' | 'uz-cyrl' | 'en' | 'ru';

export interface AppContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);
