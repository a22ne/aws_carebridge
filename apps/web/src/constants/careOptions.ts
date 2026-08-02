/**
 * Stable codes stored in DynamoDB, with i18n label keys for display.
 *
 * Records created before code-ification hold free text (e.g. "男", "兒子").
 * Display helpers therefore fall back to the raw stored value when no
 * translation key matches, so legacy records keep rendering correctly.
 */

export interface CodedOption {
  code: string;
  labelKey: string;
}

function build(prefix: string, codes: string[]): CodedOption[] {
  return codes.map(code => ({ code, labelKey: `${prefix}_${code}` }));
}

export const GENDER_OPTIONS = build('gender', ['male', 'female', 'other']);

export const RELATIONSHIP_OPTIONS = build('relationship', [
  'son', 'daughter', 'spouse', 'grandchild', 'sibling', 'employer', 'case_manager', 'other',
]);

export const MOOD_OPTIONS = build('mood', [
  'calm', 'cheerful', 'restless', 'low', 'confused',
]);

export const EXCRETION_OPTIONS = build('excretion', [
  'normal', 'constipated', 'diarrhea', 'incontinent',
]);

export const MOBILITY_OPTIONS = build('mobility', [
  'normal', 'slightly_unstable', 'needs_support', 'unable_to_walk',
]);

export const BREATHING_OPTIONS = build('breathing', ['normal', 'rapid', 'difficult']);

/** Common chronic conditions offered as chips; free text stays available */
export const CHRONIC_CONDITION_OPTIONS = build('condition', [
  'hypertension', 'diabetes', 'heart_disease', 'copd', 'stroke_history',
  'dementia', 'kidney_disease', 'arthritis',
]);

/**
 * Resolve a stored value to a display label.
 * Falls back to the raw value for legacy free-text records.
 */
export function labelForCode(
  prefix: string,
  value: string | undefined | null,
  tOptional: (key: string) => string | null
): string {
  if (!value) return '-';
  return tOptional(`${prefix}_${value}`) ?? value;
}

/** Resolve a list of stored values (e.g. chronicConditions) */
export function labelsForCodes(
  prefix: string,
  values: string[] | undefined | null,
  tOptional: (key: string) => string | null
): string[] {
  if (!values || values.length === 0) return [];
  return values.map(v => tOptional(`${prefix}_${v}`) ?? v);
}
