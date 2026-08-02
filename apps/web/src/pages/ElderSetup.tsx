import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { BackButton } from '@/components/BackButton';
import { GENDER_OPTIONS, CHRONIC_CONDITION_OPTIONS, CITY_OPTIONS } from '@/constants/careOptions';
import * as api from '@/services/api';

export default function ElderSetup() {
  const { t, lang } = useI18n();
  const { setHousehold, setElder } = useAppState();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [conditionCodes, setConditionCodes] = useState<string[]>([]);
  const [extraConditions, setExtraConditions] = useState('');
  const [otherConditions, setOtherConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleCondition = (code: string) => {
    setConditionCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim()) return;

    setLoading(true);
    setErrorMsg('');

    // Coded conditions first, then any free-text additions the caregiver typed
    const freeText = extraConditions
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const res = await api.createHousehold(
      {
        displayName: name.trim(),
        age: Number(age),
        birthday: birthday || undefined,
        city: city || undefined,
        gender: gender || undefined,
        chronicConditions: [...conditionCodes, ...freeText],
        otherConditions: otherConditions.trim() || undefined,
      },
      lang
    );

    if (res.success && res.data) {
      setHousehold(res.data.householdId, res.data.joinCode);
      setElder(res.data.elderProfile?.elderId || 'unknown');
      navigate('/home');
    } else {
      setErrorMsg(res.error?.message || t('error'));
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('createFamilyTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('createFamilyDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('yourName')}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('elderNamePlaceholder')}
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              required
            />
          </label>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('age')}
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="83"
              min="0"
              max="120"
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              required
            />
          </label>
        </div>

        {/* Gender — coded so it renders in every language */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('gender')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setGender(gender === opt.code ? '' : opt.code)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold ${
                  gender === opt.code ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                }`}
              >
                {t(opt.labelKey as any)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <label className="block text-sm font-bold text-ink">
              {t('birthday')}
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink"
              />
            </label>
          </div>

          {/* City — coded so the address renders in the reader's language */}
          <div className="card p-4">
            <label className="block text-sm font-bold text-ink">
              {t('city')}
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink"
              >
                <option value="">{t('cityPlaceholder')}</option>
                {CITY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {t(opt.labelKey as any)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Chronic conditions — common ones coded, free text for the rest */}
        <div className="card p-4">
          <span className="block text-sm font-bold text-ink">{t('chronicConditionsLabel')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHRONIC_CONDITION_OPTIONS.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => toggleCondition(opt.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  conditionCodes.includes(opt.code)
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-white text-ink'
                }`}
              >
                {t(opt.labelKey as any)}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={extraConditions}
            onChange={e => setExtraConditions(e.target.value)}
            placeholder={t('chronicConditionsExtraPlaceholder')}
            className="mt-3 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-sm text-ink placeholder:text-muted/50"
          />
        </div>

        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('otherConditions')}
            <textarea
              value={otherConditions}
              onChange={e => setOtherConditions(e.target.value)}
              placeholder={t('otherConditionsPlaceholder')}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
            />
          </label>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {errorMsg}
            <button type="button" onClick={() => setErrorMsg('')} className="ml-2 font-bold">{t('retry')}</button>
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || !age.trim() || loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? t('loading') : t('confirm')}
        </button>

        <BackButton />
      </form>
    </div>
  );
}
