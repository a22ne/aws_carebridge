import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import {
  GENDER_OPTIONS,
  CHRONIC_CONDITION_OPTIONS,
  CITY_OPTIONS,
  labelForCode,
  labelsForCodes,
} from '@/constants/careOptions';

interface ElderData {
  displayName: string;
  age: number;
  birthday?: string;
  city?: string;
  gender?: string;
  chronicConditions: string[];
  otherConditions?: string;
  /** Backend-generated translations of `otherConditions` */
  otherConditionTranslations?: Record<string, string>;
}

interface ElderDetailProps {
  open: boolean;
  onClose: () => void;
  elder?: ElderData;
  onSave?: (data: ElderData) => void | Promise<void>;
}

/** Split stored conditions into known codes and legacy/free-text entries */
function splitConditions(values: string[]) {
  const known = new Set(CHRONIC_CONDITION_OPTIONS.map(o => o.code));
  return {
    codes: values.filter(v => known.has(v)),
    freeText: values.filter(v => !known.has(v)),
  };
}

export function ElderDetail({ open, onClose, elder, onSave }: ElderDetailProps) {
  const { t, tOptional, lang, formatDate } = useI18n();
  const { role } = useAppState();
  const canEdit = role === 'contact';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ElderData>({
    displayName: '', age: 0, birthday: '', city: '', gender: '', chronicConditions: [], otherConditions: '',
  });
  const [conditionCodes, setConditionCodes] = useState<string[]>([]);
  const [conditionFreeText, setConditionFreeText] = useState('');

  // Sync form with elder prop when it changes or the panel opens
  useEffect(() => {
    if (elder) {
      setForm({
        displayName: elder.displayName || '',
        age: elder.age || 0,
        birthday: elder.birthday || '',
        city: elder.city || '',
        gender: elder.gender || '',
        chronicConditions: elder.chronicConditions || [],
        otherConditions: elder.otherConditions || '',
      });

      const split = splitConditions(elder.chronicConditions || []);
      setConditionCodes(split.codes);
      setConditionFreeText(split.freeText.join(', '));
    }
  }, [elder, open]);

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    const freeText = conditionFreeText.split(',').map(s => s.trim()).filter(Boolean);
    await onSave?.({ ...form, chronicConditions: [...conditionCodes, ...freeText] });
    setSaving(false);
    setEditing(false);
  };

  const updateField = (key: keyof ElderData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleCondition = (code: string) => {
    setConditionCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Display values resolve codes to the current language, falling back to raw
  // text so records created before code-ification still render.
  const genderLabel = labelForCode('gender', elder?.gender, tOptional);
  const cityLabel = labelForCode('city', elder?.city, tOptional);
  const cityIsKnownCode = CITY_OPTIONS.some(o => o.code === form.city);
  const conditionLabels = labelsForCodes('condition', elder?.chronicConditions, tOptional);
  const otherConditionsText =
    elder?.otherConditionTranslations?.[lang] ?? elder?.otherConditions ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-auto rounded-t-3xl bg-white p-6 pb-10 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('elderDetail')}</h2>
          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="text-sm font-bold text-primary">
                {t('edit')}
              </button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-sm font-bold">
              ✕
            </button>
          </div>
        </div>

        {editing ? (
          /* Edit mode */
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-xs text-muted">{t('yourName')}</span>
              <input value={form.displayName} onChange={e => updateField('displayName', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('age')}</span>
                <input type="number" value={form.age || ''} onChange={e => updateField('age', Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('birthday')}</span>
                <input type="date" value={form.birthday || ''} onChange={e => updateField('birthday', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
            </div>

            <div>
              <span className="text-xs text-muted">{t('gender')}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {GENDER_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => updateField('gender', form.gender === opt.code ? '' : opt.code)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      form.gender === opt.code ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                    }`}
                  >
                    {t(opt.labelKey as any)}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-xs text-muted">{t('city')}</span>
              <select
                value={cityIsKnownCode ? form.city : ''}
                onChange={e => updateField('city', e.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
              >
                {/* Legacy free-text values stay visible until the contact picks a code */}
                <option value={cityIsKnownCode ? '' : form.city || ''}>
                  {cityIsKnownCode ? t('cityPlaceholder') : form.city || t('cityPlaceholder')}
                </option>
                {CITY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {t(opt.labelKey as any)}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs text-muted">{t('chronicConditions')}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {CHRONIC_CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => toggleCondition(opt.code)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      conditionCodes.includes(opt.code) ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                    }`}
                  >
                    {t(opt.labelKey as any)}
                  </button>
                ))}
              </div>
              <input
                value={conditionFreeText}
                onChange={e => setConditionFreeText(e.target.value)}
                placeholder={t('chronicConditionsExtraPlaceholder')}
                className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </div>

            <label className="block text-sm">
              <span className="text-xs text-muted">{t('otherConditions')}</span>
              <textarea value={form.otherConditions || ''} onChange={e => updateField('otherConditions', e.target.value)} rows={2} className="mt-1 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm" />
            </label>

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-50">
                {saving ? t('loading') : t('save')}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving} className="btn-ghost flex-1 text-sm">
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('yourName')}</span>
                <p className="mt-1 font-bold">{elder?.displayName || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('age')}</span>
                <p className="mt-1 font-bold">{elder?.age || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('birthday')}</span>
                <p className="mt-1 font-bold">{elder?.birthday ? formatDate(elder.birthday) : '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('city')}</span>
                <p className="mt-1 font-bold">{cityLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('gender')}</span>
                <p className="mt-1 font-bold">{genderLabel}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('chronicConditions')}</span>
                <p className="mt-1 font-bold">{conditionLabels.length ? conditionLabels.join('、') : '-'}</p>
              </div>
            </div>
            {elder?.otherConditions && (
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('otherConditions')}</span>
                <p className="mt-1 whitespace-pre-wrap text-sm">{otherConditionsText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
