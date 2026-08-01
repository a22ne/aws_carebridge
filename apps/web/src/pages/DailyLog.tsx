import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

export default function DailyLog() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [meals, setMeals] = useState('');
  const [medTaken, setMedTaken] = useState<boolean | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [mobility, setMobility] = useState('');
  const [breathing, setBreathing] = useState('');
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Call POST /daily-logs API
      navigate('/timeline');
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('dailyLogTitle')}</h1>
        <p className="mt-1 text-sm text-muted">記錄今日照護情況</p>
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
              value={meals || '50'}
              onChange={e => setMeals(e.target.value)}
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>0%</span>
              <span className="font-bold text-ink">{meals || '50'}%</span>
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
            {['正常', '稍不穩', '需攙扶', '無法行走'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setMobility(opt)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  mobility === opt ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Breathing */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('breathing')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {['正常', '偏急促', '明顯困難'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setBreathing(opt)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  breathing === opt ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-bold text-muted">更多欄位 (選填)</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-sm text-ink">
              體重 (kg)
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="0.1"
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-ink">
              體溫 (°C)
              <input
                type="number"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                step="0.1"
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-ink">
              情緒
              <input
                type="text"
                value={mood}
                onChange={e => setMood(e.target.value)}
                placeholder="平靜、焦躁、低落..."
                className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </details>

        {/* Notes */}
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            備註
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="其他觀察..."
              rows={2}
              className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-sm text-ink"
            />
          </label>
        </div>

        <div className="sticky bottom-20 bg-gradient-to-t from-background pt-4">
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
