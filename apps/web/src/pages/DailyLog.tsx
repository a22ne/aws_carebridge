import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

/**
 * Stable codes stored in DynamoDB. Display labels come from i18n so the
 * backend monitoring rules stay language-independent.
 */
const MOBILITY_OPTIONS = [
  { code: 'normal', labelKey: 'mobility_normal' },
  { code: 'slightly_unstable', labelKey: 'mobility_slightly_unstable' },
  { code: 'needs_support', labelKey: 'mobility_needs_support' },
  { code: 'unable_to_walk', labelKey: 'mobility_unable_to_walk' },
] as const;

const BREATHING_OPTIONS = [
  { code: 'normal', labelKey: 'breathing_normal' },
  { code: 'rapid', labelKey: 'breathing_rapid' },
  { code: 'difficult', labelKey: 'breathing_difficult' },
] as const;

/**
 * Local calendar date (YYYY-MM-DD). Must match the Timeline date filter,
 * which also works in local time — using UTC here would shift the record
 * to the previous day for users ahead of UTC.
 */
function localDateKey(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function DailyLog() {
  const { t } = useI18n();
  const { householdId, elderId } = useAppState();
  const navigate = useNavigate();

  const [meals, setMeals] = useState('50');
  const [medTaken, setMedTaken] = useState<boolean | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [mobility, setMobility] = useState('');
  const [breathing, setBreathing] = useState('');
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState('');
  const [excretion, setExcretion] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId) {
      setErrorKey('dailyLogNoHousehold');
      setErrorText('');
      return;
    }

    setLoading(true);
    setErrorKey(null);
    setErrorText('');

    const res = await api.createDailyLog({
      householdId,
      elderId: elderId || 'unknown',
      date: localDateKey(),
      createdByRole: 'caregiver',
      meals: { percentage: Number(meals) || 0, notes: '' },
      medication: { taken: medTaken ?? false, notes: '' },
      sleep: { hours: Number(sleepHours) || 0, quality: 'unknown' },
      mobility: mobility || 'unknown',
      breathing: breathing || 'unknown',
      weight: weight ? Number(weight) : undefined,
      mood: mood || undefined,
      excretion: excretion || undefined,
      temperature: temperature ? Number(temperature) : undefined,
      notes: notes,
      aiAlertTriggered: false,
    } as any);

    if (res.success) {
      navigate('/timeline');
    } else if (res.error?.message) {
      setErrorText(res.error.message);
    } else {
      setErrorKey('error');
    }
    setLoading(false);
  };

  const displayError = errorKey ? t(errorKey as any) : errorText;

  return (
    <div className="min-h-screen bg-background p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-lg">←</button>
        <div>
          <h1 className="text-2xl font-bold">{t('dailyLogTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('dailyLogDesc')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Meals */}
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('mealPercentage')}
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={meals}
              onChange={e => setMeals(e.target.value)}
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>0%</span>
              <span className="font-bold text-ink">{meals}%</span>
              <span>100%</span>
            </div>
          </label>
        </div>

        {/* Medication */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('medicationTaken')}</span>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setMedTaken(true)}
              className={`flex-1 rounded-button py-2.5 text-sm font-bold ${
                medTaken === true ? 'bg-accent text-white' : 'border border-line bg-white text-ink'
              }`}
            >
              {t('yes')}
            </button>
            <button
              type="button"
              onClick={() => setMedTaken(false)}
              className={`flex-1 rounded-button py-2.5 text-sm font-bold ${
                medTaken === false ? 'bg-warning text-white' : 'border border-line bg-white text-ink'
              }`}
            >
              {t('no')}
            </button>
          </div>
        </div>

        {/* Sleep */}
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('sleepHours')}
            <input
              type="number"
              value={sleepHours}
              onChange={e => setSleepHours(e.target.value)}
              placeholder="6.5"
              step="0.5"
              min="0"
              max="24"
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink"
            />
          </label>
        </div>

        {/* Mobility */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('mobility')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOBILITY_OPTIONS.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setMobility(opt.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  mobility === opt.code ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                }`}
              >
                {t(opt.labelKey as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Breathing */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('breathing')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {BREATHING_OPTIONS.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setBreathing(opt.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  breathing === opt.code ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                }`}
              >
                {t(opt.labelKey as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-bold text-muted">{t('moreFieldsOptional')}</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-sm text-ink">
              {t('weightKg')}
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="0.1"
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-ink">
              {t('temperatureC')}
              <input
                type="number"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                step="0.1"
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-ink">
              {t('mood')}
              <input
                type="text"
                value={mood}
                onChange={e => setMood(e.target.value)}
                placeholder={t('moodPlaceholder')}
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-ink">
              {t('excretion')}
              <input
                type="text"
                value={excretion}
                onChange={e => setExcretion(e.target.value)}
                placeholder={t('excretionPlaceholder')}
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </details>

        {/* Notes */}
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('notes')}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-sm text-ink"
            />
          </label>
        </div>

        {displayError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {displayError}
          </div>
        )}

        <div className="sticky bottom-6 bg-gradient-to-t from-background pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? t('loading') : t('logSave')}
          </button>
        </div>
      </form>
    </div>
  );
}
