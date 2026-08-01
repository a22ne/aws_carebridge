import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

const CHIPS = [
  { key: 'chipFall', emoji: '🤕' },
  { key: 'chipFever', emoji: '🌡️' },
  { key: 'chipAppetite', emoji: '🍚' },
  { key: 'chipBreathing', emoji: '💨' },
  { key: 'chipMental', emoji: '😵' },
  { key: 'chipOther', emoji: '❓' },
] as const;

export default function NewIncident() {
  const { t, lang } = useI18n();
  const { householdId, elderId } = useAppState();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleChip = (key: string) => {
    setSelectedChips(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!text.trim() || !householdId) return;
    setLoading(true);
    setErrorMsg('');

    // Step 1: Create incident
    const createRes = await api.createIncident({
      householdId,
      elderId: elderId || 'unknown',
      originalText: text.trim(),
      originalLanguage: lang === 'zh-TW' ? 'zh' : lang,
    });

    if (!createRes.success || !createRes.data) {
      setErrorMsg(createRes.error?.message || t('error'));
      setLoading(false);
      return;
    }

    const incidentId = (createRes.data as any).incidentId;

    // Step 2: Extract symptoms
    const extractRes = await api.extractSymptoms(incidentId, householdId);

    if (!extractRes.success) {
      // Extraction failed but incident is saved — still navigate to assessment
      console.warn('Extraction failed, proceeding to assessment:', extractRes.error);
    }

    setLoading(false);
    // Navigate to assessment with incident context
    navigate('/assessment', { state: { incidentId, householdId } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('incidentTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('incidentDesc')}</p>
      </div>

      {/* Voice input button */}
      <div className="card p-4 text-center">
        <button className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-3xl bg-primary text-3xl text-white shadow-lg">
          🎙
        </button>
        <strong className="mt-3 block text-sm">{t('voiceInput')}</strong>
        <span className="mt-1 block text-xs text-muted">點一下開始模擬錄音</span>
      </div>

      {/* Text input */}
      <div className="card p-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="例如：今天早上不太吃東西，走路不穩，呼吸有點急..."
          className="w-full resize-none rounded-2xl border border-line bg-[#FBFCFD] p-3 text-sm text-ink placeholder:text-muted/50"
          rows={4}
        />

        {/* Symptom chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleChip(chip.key)}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                selectedChips.includes(chip.key)
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-white text-primary-dark'
              }`}
            >
              {chip.emoji} {t(chip.key as any)}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="sticky bottom-20 bg-gradient-to-t from-background pt-4">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? t('loading') : t('startAssess')}
        </button>
      </div>
    </div>
  );
}
