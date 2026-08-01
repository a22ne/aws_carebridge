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
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('請輸入 6 位家庭代碼');
      return;
    }

    setLoading(true);
    setError('');

    const res = await api.joinHousehold(code.toUpperCase());

    if (res.success && res.data) {
      setHousehold(res.data.householdId, res.data.joinCode);
      if (res.data.elderProfile?.elderId) {
        setElder(res.data.elderProfile.elderId);
      }
      navigate('/home');
    } else {
      setError(res.error?.message || '代碼無效，請重試');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">加入照護家庭</h1>
        <p className="mt-2 text-sm text-muted">請輸入照顧者提供的家庭代碼</p>
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

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
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
