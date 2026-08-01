import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { ElderDetail } from '@/components/ElderDetail';
import * as api from '@/services/api';
import type { Incident } from '@carebridge/shared-types';

export default function CaregiverHome() {
  const { t } = useI18n();
  const { householdId } = useAppState();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showElderDetail, setShowElderDetail] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    api.getHouseholdIncidents(householdId).then(res => {
      if (res.success && res.data) {
        setIncidents(res.data as Incident[]);
      }
      setLoading(false);
    });
  }, [householdId]);

  const latestIncident = incidents[0];

  return (
    <div className="space-y-4">
      {/* Elder Card — clickable for detail */}
      <button
        onClick={() => setShowElderDetail(true)}
        className="card flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-[74px] w-[74px] items-center justify-center rounded-3xl bg-[#dce9ee] text-3xl">
          👴
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t('elderName')}</h2>
          <p className="text-xs text-muted">{t('tapForDetail')}</p>
        </div>
      </button>

      {/* AI Risk Alert — only show if there are incidents with risk */}
      {latestIncident?.riskLevel && latestIncident.riskLevel !== 'monitor' && (
        <div className="card border-[#F1DDB9] bg-gradient-to-br from-[#FFF7EA] to-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold">{t('aiRiskReminder')}</h3>
            <span className="rounded-full bg-[#F9E6C7] px-2.5 py-1 text-[11px] font-bold text-[#9B621D]">
              {latestIncident.riskLevel}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#7A5A28]">
            {latestIncident.translatedText || latestIncident.originalText || ''}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/incident')} className="btn-primary text-sm">
          {t('newIncident')}
        </button>
        <button onClick={() => navigate('/daily-log')} className="btn-secondary text-sm">
          {t('dailyLogTitle')}
        </button>
      </div>

      {/* Latest record — no arrow */}
      {loading ? (
        <div className="card animate-pulse p-4">
          <div className="h-4 w-3/4 rounded bg-line" />
          <div className="mt-2 h-3 w-1/2 rounded bg-line" />
        </div>
      ) : latestIncident ? (
        <div className="card flex items-center gap-3 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f7] text-base">
            {latestIncident.riskLevel === 'emergency' ? '🚨' : latestIncident.riskLevel === 'urgent' ? '⚠️' : '📋'}
          </span>
          <div className="flex-1">
            <strong className="text-[13px]">
              {latestIncident.translatedText?.slice(0, 30) || latestIncident.originalText?.slice(0, 30) || t('latestRecord')}
            </strong>
            <span className="block text-[11px] text-muted">
              {new Date(latestIncident.createdAt).toLocaleTimeString()} · {latestIncident.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center text-sm text-muted">
          {t('noRecords')}
        </div>
      )}

      {/* Elder Detail Panel */}
      <ElderDetail
        open={showElderDetail}
        onClose={() => setShowElderDetail(false)}
        elder={{
          displayName: t('elderName'),
          age: 0,
          chronicConditions: [],
        }}
      />
    </div>
  );
}
