import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';
import type { Incident } from '@carebridge/shared-types';

const FILTERS = ['filterAll', 'filterDiet', 'filterMeds', 'filterSleep', 'filterEvent'] as const;

export default function Timeline() {
  const { t } = useI18n();
  const { householdId } = useAppState();
  const [activeFilter, setActiveFilter] = useState('filterAll');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    api.getHouseholdIncidents(householdId).then(res => {
      if (res.success && res.data) {
        setIncidents(res.data as Incident[]);
      }
      setLoading(false);
    });
  }, [householdId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('timelineTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('timelineDesc')}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
              activeFilter === f
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-muted'
            }`}
          >
            {t(f as any)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse p-4">
              <div className="h-4 w-3/4 rounded bg-line" />
              <div className="mt-2 h-3 w-1/2 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : incidents.length > 0 ? (
        <div className="relative space-y-3 pl-10">
          <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-[#DDE8ED]" />
          {incidents.map((inc, i) => (
            <div key={inc.incidentId || i} className="relative flex gap-3">
              <span className="absolute -left-10 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-base">
                {inc.riskLevel === 'emergency' ? '🚨' :
                 inc.riskLevel === 'urgent' ? '⚠️' :
                 '📋'}
              </span>
              <div className="card flex-1 p-3">
                <strong className="text-[13px]">
                  {inc.translatedText?.slice(0, 40) || inc.originalText?.slice(0, 40) || t('incident')}
                </strong>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {new Date(inc.createdAt).toLocaleString()} · {inc.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-sm text-muted">{t('noRecords')}</p>
        </div>
      )}
    </div>
  );
}
