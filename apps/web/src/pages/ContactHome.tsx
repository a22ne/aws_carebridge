import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { ElderDetail } from '@/components/ElderDetail';
import * as api from '@/services/api';
import type { Incident, ElderProfile } from '@carebridge/shared-types';

export default function ContactHome() {
  const { t } = useI18n();
  const { householdId, joinCode } = useAppState();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [elderProfile, setElderProfile] = useState<ElderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showElderDetail, setShowElderDetail] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    loadData();
  }, [householdId]);

  const loadData = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [householdRes, incidentsRes] = await Promise.all([
      api.getHousehold(householdId),
      api.getHouseholdIncidents(householdId),
    ]);

    if (householdRes.success && householdRes.data) {
      setElderProfile((householdRes.data as any).elderProfile || null);
    }
    if (incidentsRes.success && incidentsRes.data) {
      setIncidents(incidentsRes.data as Incident[]);
    }
    setLoading(false);
  };

  const handleElderSave = async (data: any) => {
    if (!householdId) return;
    setSaveError('');
    const res = await api.updateHousehold(householdId, {
      displayName: data.displayName,
      age: data.age,
      birthday: data.birthday,
      city: data.city,
      gender: data.gender,
      chronicConditions: data.chronicConditions,
      otherConditions: data.otherConditions,
    });

    if (res.success && res.data) {
      setElderProfile((res.data as any).elderProfile || null);
      setShowElderDetail(false);
    } else {
      setSaveError(res.error?.message || t('error'));
    }
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
        <div className="flex-1">
          <h2 className="text-lg font-bold">
            {elderProfile?.displayName || t('elderName')}
            {elderProfile?.age ? `, ${elderProfile.age}` : ''}
          </h2>
          <p className="text-xs text-muted">
            {elderProfile?.city ? `${elderProfile.city} · ` : ''}
            {elderProfile?.chronicConditions?.join(', ') || t('tapForDetail')}
          </p>
        </div>
      </button>

      {saveError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {saveError}
        </div>
      )}

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
                      {t(`risk_${inc.riskLevel}` as any) || inc.riskLevel}
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
      <button onClick={loadData} className="btn-ghost w-full text-sm">
        {t('refresh')}
      </button>

      <button onClick={() => navigate('/monthly-report')} className="btn-primary w-full text-sm">
        {t('generateReport')}
      </button>

      {/* Elder Detail Panel — editable for contact */}
      <ElderDetail
        open={showElderDetail}
        onClose={() => setShowElderDetail(false)}
        elder={elderProfile ? {
          displayName: elderProfile.displayName,
          age: elderProfile.age,
          birthday: elderProfile.birthday,
          city: elderProfile.city,
          gender: elderProfile.gender,
          chronicConditions: elderProfile.chronicConditions || [],
          otherConditions: elderProfile.otherConditions,
        } : undefined}
        onSave={handleElderSave}
      />
    </div>
  );
}
