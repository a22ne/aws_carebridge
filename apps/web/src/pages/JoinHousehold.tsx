import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

export default function JoinHousehold() {
  const { t } = useI18n();
  const { setHousehold, setElder } = useAppState();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setErrorKey('joinCodeLengthError');
      setErrorText('');
      return;
    }

    setLoading(true);
    setErrorKey(null);
    setErrorText('');

    const res = await api.joinHousehold(code.toUpperCase());

    if (res.success && res.data) {
      setHousehold(res.data.householdId, res.data.joinCode);
      if (res.data.elderProfile?.elderId) {
        setElder(res.data.elderProfile.elderId);
      }
      navigate('/home');
    } else if (res.error?.message) {
      setErrorText(res.error.message);
    } else {
      setErrorKey('joinCodeInvalidError');
    }

    setLoading(false);
  };

  const displayError = errorKey ? t(errorKey as any) : errorText;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">{t('joinFamilyTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('joinFamilyDesc')}</p>
      </div>

      <form onSubmit={handleJoin} className="w-full max-w-xs space-y-4">
        <div className="card p-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            maxLength={6}
            className="w-full border-0 bg-transparent text-center font-mono text-2xl font-bold tracking-[0.3em] text-ink outline-none placeholder:text-muted/30"
            autoFocus
            aria-label={t('householdCode')}
          />
          <div className="mt-2 flex justify-center gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i < code.length ? 'bg-primary' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>

        {displayError && (
          <p className="text-center text-sm text-red-500">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={code.length !== 6 || loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? t('loading') : t('confirm')}
        </button>
      </form>
    </div>
  );
}
