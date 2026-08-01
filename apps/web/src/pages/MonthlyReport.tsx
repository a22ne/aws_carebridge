import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

export default function MonthlyReport() {
  const { t } = useI18n();
  const { householdId } = useAppState();
  const navigate = useNavigate();

  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!householdId) return;
    setLoading(true);
    setError('');

    // Use trend alert API to generate a monthly summary
    const res = await api.getTrendAlert(householdId);
    if (res.success && res.data) {
      setReport((res.data as any).alertText);
    } else {
      setError(res.error?.message || t('error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-lg">←</button>
        <h1 className="text-xl font-bold">{t('monthlyReport')}</h1>
      </div>

      {!report && !loading && (
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <h2 className="font-bold">{t('monthlyReportTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('monthlyReportDesc')}</p>
          </div>
          <button
            onClick={generateReport}
            className="btn-primary w-full"
          >
            {t('generateReport')}
          </button>
        </div>
      )}

      {loading && (
        <div className="card animate-pulse p-6 text-center">
          <p className="text-sm text-muted">AI 正在生成月報...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={generateReport} className="ml-2 font-bold">{t('retry')}</button>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-2 font-bold">{t('monthlyReportTitle')}</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {report}
            </div>
          </div>
          <button onClick={() => navigate('/home')} className="btn-ghost w-full">
            {t('backHome')}
          </button>
        </div>
      )}
    </div>
  );
}
