import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';
import type { Incident } from '@carebridge/shared-types';

export default function CaregiverHome() {
  const { t } = useI18n();
  const { joinCode, householdId } = useAppState();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;
    api.getHouseholdIncidents(householdId).then(res => {
      if (res.success && res.data) {
        setIncidents(res.data as Incident[]);
      }
      setLoading(false);
    });
  }, [householdId]);

  return (
    <div className="space-y-4">
      {/* Elder Card */}
      <div className="card flex items-center gap-3 p-4">
        <div className="flex h-[74px] w-[74px] items-center justify-center rounded-3xl bg-[#dce9ee] text-3xl">
          👴
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">林先生，83歲</h2>
          <p className="text-xs text-muted">花蓮偏鄉 · 高血壓</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-surface px-2.5 py-1 text-xs font-bold text-green-700">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {t('todayAttention')}
          </span>
        </div>
      </div>

      {/* Household Code */}
      {joinCode && (
        <div className="card flex items-center justify-between p-3">
          <span className="text-xs text-muted">家庭代碼 (分享給聯絡人)</span>
          <span className="font-mono text-sm font-bold text-primary-dark">{joinCode}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <span className="text-xs text-muted">{t('mealIntake')}</span>
          <strong className="mt-2 block text-xl">20%</strong>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted">{t('breathingStatus')}</span>
          <strong className="mt-2 block text-xl">{t('breathingFast')}</strong>
        </div>
      </div>

      {/* AI Risk Alert */}
      <div className="card border-[#F1DDB9] bg-gradient-to-br from-[#FFF7EA] to-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold">{t('aiRiskReminder')}</h3>
          <span className="rounded-full bg-[#F9E6C7] px-2.5 py-1 text-[11px] font-bold text-[#9B621D]">
            {t('riskMidHigh')}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#7A5A28]">
          食慾下降、呼吸急促與行走不穩同時出現，建議立即完成 AI 風險判讀。
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/incident')} className="btn-primary text-sm">
          {t('newIncident')}
        </button>
        <button onClick={() => navigate('/daily-log')} className="btn-secondary text-sm">
          {t('dailyLogTitle')}
        </button>
      </div>

      {/* Recent Incidents */}
      <div className="space-y-2">
        {loading ? (
          <div className="card animate-pulse p-4">
            <div className="h-4 w-3/4 rounded bg-line" />
            <div className="mt-2 h-3 w-1/2 rounded bg-line" />
          </div>
        ) : incidents.length > 0 ? (
          incidents.slice(0, 5).map(inc => (
            <div key={inc.incidentId} className="card flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f7] text-base">
                {inc.riskLevel === 'emergency' ? '🚨' : inc.riskLevel === 'urgent' ? '⚠️' : '📋'}
              </span>
              <div className="flex-1">
                <strong className="text-[13px]">
                  {inc.translatedText?.slice(0, 20) || inc.originalText?.slice(0, 20) || '事件'}
                  {(inc.translatedText || inc.originalText || '').length > 20 ? '...' : ''}
                </strong>
                <span className="block text-[11px] text-muted">
                  {new Date(inc.createdAt).toLocaleTimeString()} · {inc.status}
                </span>
              </div>
              <span className="text-muted">›</span>
            </div>
          ))
        ) : (
          <div className="card flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f7] text-base">🍚</span>
            <div className="flex-1">
              <strong className="text-[13px]">早餐未完成</strong>
              <span className="block text-[11px] text-muted">08:10 · Siti</span>
            </div>
            <span className="text-muted">›</span>
          </div>
        )}
      </div>
    </div>
  );
}
