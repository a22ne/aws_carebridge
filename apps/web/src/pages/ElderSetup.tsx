import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

export default function ElderSetup() {
  const { t } = useI18n();
  const { setHousehold, setElder } = useAppState();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [conditions, setConditions] = useState('');
  const [otherConditions, setOtherConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim()) return;

    setLoading(true);
    setErrorMsg('');

    const res = await api.createHousehold({
      displayName: name.trim(),
      age: Number(age),
      birthday: birthday || undefined,
      city: city.trim() || undefined,
      gender: gender.trim() || undefined,
      chronicConditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
      otherConditions: otherConditions.trim() || undefined,
    });

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
        <button onClick={() => navigate(-1)} className="mb-3 text-lg">←</button>
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

        <div className="grid grid-cols-2 gap-3">
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

          <div className="card p-4">
            <label className="block text-sm font-bold text-ink">
              {t('gender')}
              <input
                type="text"
                value={gender}
                onChange={e => setGender(e.target.value)}
                placeholder={t('genderPlaceholder')}
                className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              />
            </label>
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

          <div className="card p-4">
            <label className="block text-sm font-bold text-ink">
              {t('city')}
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              />
            </label>
          </div>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('chronicConditionsLabel')}
            <input
              type="text"
              value={conditions}
              onChange={e => setConditions(e.target.value)}
              placeholder={t('chronicConditionsPlaceholder')}
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
            />
          </label>
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
      </form>
    </div>
  );
}
