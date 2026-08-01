import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

interface ReportData {
  summary: string | null;
  dailyLogCount: number;
  incidentCount: number;
  totalRecords: number;
}

export default function MonthlyReport() {
  const { t, lang } = useI18n();
  const { householdId } = useAppState();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const generateReport = async () => {
    if (!householdId) return;
    setLoading(true);
    setErrorKey(null);
    setErrorText('');

    // Gather AI summary plus record counts for the reward calculation
    const [trendRes, logsRes, incidentsRes] = await Promise.all([
      api.getTrendAlert(householdId, lang),
      api.getHouseholdDailyLogs(householdId),
      api.getHouseholdIncidents(householdId),
    ]);

    if (!trendRes.success && !logsRes.success && !incidentsRes.success) {
      setErrorKey('error');
      setLoading(false);
      return;
    }

    const dailyLogCount = logsRes.success && Array.isArray(logsRes.data) ? logsRes.data.length : 0;
    const incidentCount = incidentsRes.success && Array.isArray(incidentsRes.data) ? incidentsRes.data.length : 0;

    setReport({
      summary: trendRes.success && trendRes.data ? trendRes.data.alertText : null,
      dailyLogCount,
      incidentCount,
      totalRecords: dailyLogCount + incidentCount,
    });

    setLoading(false);
  };

  const displayError = errorKey ? t(errorKey as any) : errorText;

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
          <button onClick={generateReport} className="btn-primary w-full">
            {t('generateReport')}
          </button>
        </div>
      )}

      {loading && (
        <div className="card animate-pulse p-6 text-center">
          <p className="text-sm text-muted">{t('reportGenerating')}</p>
        </div>
      )}

      {displayError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {displayError}
          <button onClick={generateReport} className="ml-2 font-bold">{t('retry')}</button>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* AI summary */}
          <div className="card p-4">
            <h3 className="mb-2 font-bold">{t('monthlyReportTitle')}</h3>
            {report.summary ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {report.summary}
              </div>
            ) : (
              <p className="text-sm text-muted">{t('noTrendData')}</p>
            )}
          </div>

          {/* Record statistics — basis for caregiver reward */}
          <div className="card p-4">
            <h3 className="mb-3 font-bold">{t('recordStatistics')}</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <strong className="block text-xl">{report.dailyLogCount}</strong>
                <span className="text-[11px] text-muted">{t('dailyLogRecords')}</span>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <strong className="block text-xl">{report.incidentCount}</strong>
                <span className="text-[11px] text-muted">{t('incidentRecords')}</span>
              </div>
              <div className="rounded-xl bg-accent-surface p-3">
                <strong className="block text-xl text-green-700">{report.totalRecords}</strong>
                <span className="text-[11px] text-green-700">{t('totalRecords')}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {t('rewardBasisNote')}
            </p>
          </div>

          <button onClick={() => navigate('/home')} className="btn-ghost w-full">
            {t('backHome')}
          </button>
        </div>
      )}
    </div>
  );
}
