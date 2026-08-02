import { converseJson } from './bedrock.js';

export const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'id', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type TranslationMap = Partial<Record<SupportedLanguage, string>>;

const TRANSLATE_SYSTEM_PROMPT = `You are a translation service for a caregiving app used by families and foreign caregivers.

Translate the given text into every requested target language.

Rules:
- Preserve the original meaning exactly. Do not add advice or commentary.
- Keep the tone natural and practical.
- Do NOT use markdown formatting.
- Names, numbers, dosages and medication names must stay unchanged.
- Preserve line breaks and any numbered or bulleted structure.
- Output ONLY valid JSON matching the schema.

Output JSON schema:
{
  "translations": {
    "zh-TW": "string",
    "en": "string",
    "id": "string",
    "vi": "string"
  }
}`;

/**
 * Translate free text into all supported languages.
 *
 * Never throws: on failure the source text is returned under every language so
 * callers can still persist the record. Returns `null` for blank input.
 */
export async function translateToAllLanguages(
  text: string,
  sourceLanguage: SupportedLanguage = 'zh-TW'
): Promise<TranslationMap | null> {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const targets = SUPPORTED_LANGUAGES.filter(l => l !== sourceLanguage);

  try {
    const result = await converseJson<{ translations: Record<string, string> }>({
      systemPrompt: TRANSLATE_SYSTEM_PROMPT,
      userMessage: `Source language: ${sourceLanguage}\nTarget languages: ${targets.join(', ')}\n\nText:\n"""\n${trimmed}\n"""`,
      maxTokens: 2000,
    });

    return { ...result.translations, [sourceLanguage]: trimmed } as TranslationMap;
  } catch (err) {
    console.warn('[translate] failed, storing source text for all languages', {
      message: err instanceof Error ? err.message : err,
    });
    return SUPPORTED_LANGUAGES.reduce<TranslationMap>((acc, lang) => {
      acc[lang] = trimmed;
      return acc;
    }, {});
  }
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
