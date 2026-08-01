import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

export default function CaregiverProfile() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    // Save to localStorage for now
    localStorage.setItem('carebridge-user-name', name.trim());
    localStorage.setItem('carebridge-user-phone', phone.trim());
    navigate('/join');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('caregiverProfileTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('caregiverProfileDesc')}</p>
      </div>

      <form onSubmit={handleNext} className="space-y-4">
        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('yourName')}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              required
            />
          </label>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-bold text-ink">
            {t('yourPhone')}
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+62 812 3456 7890"
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#FBFCFD] px-4 py-3 text-ink placeholder:text-muted/50"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !phone.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {t('next')}
        </button>
      </form>
    </div>
  );
}
