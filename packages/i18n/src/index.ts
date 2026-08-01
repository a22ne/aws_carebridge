import type { Language } from '@carebridge/shared-types';
import { zhTW } from './locales/zh-TW';
import { en } from './locales/en';
import { id } from './locales/id';
import { vi } from './locales/vi';

export type TranslationKey = keyof typeof zhTW;

const dictionaries: Record<Language, Record<string, string>> = {
  'zh-TW': zhTW,
  en,
  id,
  vi,
};

export function t(key: TranslationKey, lang: Language): string {
  return dictionaries[lang]?.[key] || dictionaries['zh-TW'][key] || key;
}

export function getDict(lang: Language): Record<string, string> {
  return dictionaries[lang] || dictionaries['zh-TW'];
}

export { zhTW, en, id, vi };
