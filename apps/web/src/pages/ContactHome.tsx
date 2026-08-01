import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { ElderDetail } from '@/components/ElderDetail';
import * as api from '@/services/api';
import type { Incident } from '@carebridge/shared-types';

export default function ContactHome() {
  const { t } = useI18n();
  const { householdId, joinCode } = useAppState();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showElderDetail, setShowElderDetail] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    loadIncidents();
  }, [householdId]);

  const loadIncidents = async () => {
    if (!householdId) return;
    setLoading(true);
    const res = await api.getHouseholdIncidents(householdId);
    if (res.success && res.data) {
      setIncidents(res.data as Incident[]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (incidentId: string, status: string) => {
    if (!householdId) return;
    setUpdatingId(incidentId);
    const res = await api.updateIncidentStatus(incidentId, householdId, status);
    if (res.success) {
      setIncidents(prev =>
        prev.map(inc => inc.incidentId === incidentId ? { ...inc, status: status as any } : inc)
      );
    }
    setUpdatingId(null);
  };

  const statusOptions = [
    { value: 'read', label: t('statusRead') },
    { value: 'contacted', label: t('statusContacted') },
    { value: 'scheduled', label: t('statusScheduled') },
    { value: 'resolved', label: t('statusResolved') },
  ];

  return (
    <div className="space-y-4">
      {/* Elder Card — clickable */}
      <button
        onClick={() => setShowElderDetail(true)}
        className="card flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dce9ee] text-2xl">
          👴
        </div>
        <div>
          <h2 className="text-lg font-bold">{t('elderName')}</h2>
          <p className="text-xs text-muted">{t('tapForDetail')}</p>
        </div>
      </button>

      {/* Household Code */}
      {joinCode && (
        <div className="card flex items-center justify-between p-3">
          <span className="text-xs text-muted">{t('householdCode')}</span>
          <span className="font-mono text-sm font-bold text-primary-dark">{joinCode}</span>
        </div>
      )}

      {/* Incidents / Notifications */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-muted">{t('eventsAndNotifications')}</h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="card animate-pulse p-4">
                <div className="h-4 w-3/4 rounded bg-line" />
                <div className="mt-2 h-3 w-1/2 rounded bg-line" />
              </div>
            ))}
          </div>
        ) : incidents.length > 0 ? (
          <div className="space-y-3">
            {incidents.map(inc => (
              <div
                key={inc.incidentId}
                className={`card p-4 ${
                  inc.riskLevel === 'emergency' || inc.riskLevel === 'urgent'
                    ? 'border-[#F1DDB9] bg-gradient-to-br from-[#FFF7EA] to-white'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm">
                    {inc.translatedText?.slice(0, 30) || inc.originalText?.slice(0, 30) || t('incident')}
                  </strong>
                  {inc.riskLevel && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      inc.riskLevel === 'emergency' ? 'bg-red-100 text-red-700' :
                      inc.riskLevel === 'urgent' ? 'bg-orange-100 text-orange-700' :
                      'bg-[#F9E6C7] text-[#9B621D]'
                    }`}>
                      {inc.riskLevel}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-muted">
                  {new Date(inc.createdAt).toLocaleString()} · {inc.status}
                </p>

                {/* Status update buttons */}
                {inc.status !== 'resolved' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions
                      .filter(opt => {
                        const order = ['pending', 'read', 'contacted', 'scheduled', 'resolved'];
                        return order.indexOf(opt.value) > order.indexOf(inc.status);
                      })
                      .slice(0, 2)
                      .map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusUpdate(inc.incidentId, opt.value)}
                          disabled={updatingId === inc.incidentId}
                          className="btn-primary flex-1 text-xs disabled:opacity-50"
                        >
                          {updatingId === inc.incidentId ? '...' : opt.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            {t('noEvents')}
          </div>
        )}
      </div>

      {/* Actions */}
      <button onClick={loadIncidents} className="btn-ghost w-full text-sm">
        {t('refresh')}
      </button>

      <button onClick={() => navigate('/monthly-report')} className="btn-primary w-full text-sm">
        {t('generateReport')}
      </button>

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
