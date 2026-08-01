import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Language } from '@carebridge/shared-types';
import { zhTW, en, id, vi } from '@carebridge/i18n';

type TranslationKey = keyof typeof zhTW;

const dictionaries: Record<Language, Record<string, string>> = {
  'zh-TW': zhTW as unknown as Record<string, string>,
  en: en as unknown as Record<string, string>,
  id: id as unknown as Record<string, string>,
  vi: vi as unknown as Record<string, string>,
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_STORAGE_KEY = 'carebridge-lang';

function getInitialLang(): Language {
  if (typeof window === 'undefined') return 'zh-TW';
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && ['zh-TW', 'en', 'id', 'vi'].includes(stored)) {
    return stored as Language;
  }
  return 'zh-TW';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = dictionaries[lang];
      const fallback = dictionaries['zh-TW'];
      return dict[key as string] || fallback[key as string] || (key as string);
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
