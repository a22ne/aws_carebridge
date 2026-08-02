import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Language } from '@carebridge/shared-types';
import { zhTW, en, id, vi } from '@carebridge/i18n';

type TranslationKey = keyof typeof zhTW;

const dictionaries: Record<Language, Record<string, string>> = {
  'zh-TW': zhTW as unknown as Record<string, string>,
  en: en as unknown as Record<string, string>,
  id: id as unknown as Record<string, string>,
  vi: vi as unknown as Record<string, string>,
};

/** BCP 47 tags for Intl formatting */
const LOCALE_TAGS: Record<Language, string> = {
  'zh-TW': 'zh-TW',
  en: 'en-US',
  id: 'id-ID',
  vi: 'vi-VN',
};

interface I18nContextValue {
  lang: Language;
  /** BCP 47 tag matching `lang`, for Intl / toLocaleString */
  locale: string;
  setLang: (lang: Language) => void;
  /** Translate a known key. Never returns null. */
  t: (key: TranslationKey) => string;
  /**
   * Translate a dynamic key that may not exist (e.g. `gender_${storedValue}`).
   * Returns null when the key is missing so callers can fall back to the raw
   * stored value — `t()` cannot be used for this because it returns the key
   * itself, which is truthy and would leak key names into the UI.
   */
  tOptional: (key: string) => string | null;
  /** Format an ISO timestamp using the selected app language, not the browser's */
  formatDateTime: (iso: string) => string;
  formatDate: (iso: string) => string;
  formatTime: (iso: string) => string;
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

  const locale = LOCALE_TAGS[lang];

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

  const tOptional = useCallback(
    (key: string): string | null => {
      const dict = dictionaries[lang];
      const fallback = dictionaries['zh-TW'];
      return dict[key] ?? fallback[key] ?? null;
    },
    [lang]
  );

  const formatDateTime = useCallback(
    (iso: string): string => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(locale, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    },
    [locale]
  );

  const formatDate = useCallback(
    (iso: string): string => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(locale, {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
    },
    [locale]
  );

  const formatTime = useCallback(
    (iso: string): string => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    },
    [locale]
  );

  const value = useMemo(
    () => ({ lang, locale, setLang, t, tOptional, formatDateTime, formatDate, formatTime }),
    [lang, locale, setLang, t, tOptional, formatDateTime, formatDate, formatTime]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
