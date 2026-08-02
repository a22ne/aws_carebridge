import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { TimelineDetail, type TimelineDetailTarget } from '@/components/TimelineDetail';
import * as api from '@/services/api';
import type { Incident, DailyLog } from '@carebridge/shared-types';

type TypeFilter = 'all' | 'incident' | 'dailyLog';

interface TimelineItem {
  id: string;
  kind: 'incident' | 'dailyLog';
  createdAt: string;
  /** YYYY-MM-DD used for date filtering */
  dateKey: string;
  incident?: Incident;
  dailyLog?: DailyLog;
}

const TYPE_FILTERS: { value: TypeFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'incident', labelKey: 'filterIncident' },
  { value: 'dailyLog', labelKey: 'filterDailyLog' },
];

/** Local date key (YYYY-MM-DD) so filtering matches what the user sees */
function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function Timeline() {
  const { t } = useI18n();
  const { householdId } = useAppState();

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<TimelineDetailTarget | null>(null);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.getHouseholdIncidents(householdId),
      api.getHouseholdDailyLogs(householdId),
    ]).then(([incidentsRes, logsRes]) => {
      if (cancelled) return;

      const merged: TimelineItem[] = [];

      if (incidentsRes.success && Array.isArray(incidentsRes.data)) {
        for (const inc of incidentsRes.data as Incident[]) {
          merged.push({
            id: `incident-${inc.incidentId}`,
            kind: 'incident',
            createdAt: inc.createdAt,
            dateKey: toDateKey(inc.createdAt),
            incident: inc,
          });
        }
      }

      if (logsRes.success && Array.isArray(logsRes.data)) {
        for (const log of logsRes.data as DailyLog[]) {
          merged.push({
            id: `dailyLog-${log.logId}`,
            kind: 'dailyLog',
            createdAt: log.createdAt,
            // Prefer the explicit care date, fall back to the write timestamp
            dateKey: log.date || toDateKey(log.createdAt),
            dailyLog: log,
          });
        }
      }

      // Newest first
      merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      setItems(merged);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [householdId]);

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (typeFilter !== 'all' && item.kind !== typeFilter) return false;
      if (dateFilter && item.dateKey !== dateFilter) return false;
      return true;
    });
  }, [items, typeFilter, dateFilter]);

  const hasActiveFilter = typeFilter !== 'all' || dateFilter !== '';

  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('timelineTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('timelineDesc')}</p>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`flex-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
              typeFilter === f.value
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-muted'
            }`}
          >
            {t(f.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="card flex items-center gap-2 p-3">
        <label className="flex-1 text-xs text-muted">
          {t('timelineFilterByDate')}
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm text-ink"
          />
        </label>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="self-end rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-primary-dark"
          >
            {t('timelineClearFilter')}
          </button>
        )}
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
      ) : visibleItems.length > 0 ? (
        <div className="relative space-y-3 pl-10">
          <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-[#DDE8ED]" />
          {visibleItems.map(item => (
            <TimelineRow
              key={item.id}
              item={item}
              onOpen={() => {
                if (item.kind === 'incident' && item.incident) {
                  setDetailTarget({ kind: 'incident', data: item.incident });
                } else if (item.kind === 'dailyLog' && item.dailyLog) {
                  setDetailTarget({ kind: 'dailyLog', data: item.dailyLog });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-sm text-muted">
            {hasActiveFilter ? t('timelineNoRecordsOnDate') : t('noRecords')}
          </p>
        </div>
      )}

      <TimelineDetail
        open={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        target={detailTarget}
      />
    </div>
  );
}

function TimelineRow({ item, onOpen }: { item: TimelineItem; onOpen: () => void }) {
  const { t, tOptional, formatDateTime } = useI18n();

  let icon = '📋';
  let title = '';
  let subtitle = '';
  let badge: { text: string; className: string } | null = null;

  if (item.kind === 'incident' && item.incident) {
    const inc = item.incident;
    icon = inc.riskLevel === 'emergency' ? '🚨' : inc.riskLevel === 'urgent' ? '⚠️' : '📋';

    const presentSymptoms = (inc.extractedSymptoms || [])
      .filter(s => s.status === 'present')
      .map(s => s.label);

    title = presentSymptoms.length > 0
      ? presentSymptoms.join('、')
      : (inc.translatedText?.slice(0, 40) || inc.originalText?.slice(0, 40) || t('incident'));

    const statusLabel =
      tOptional(`status${inc.status.charAt(0).toUpperCase()}${inc.status.slice(1)}`) ?? inc.status;
    subtitle = `${formatDateTime(inc.createdAt)} · ${statusLabel}`;

    if (inc.riskLevel) {
      badge = {
        text: tOptional(`risk_${inc.riskLevel}`) ?? inc.riskLevel,
        className:
          inc.riskLevel === 'emergency' ? 'bg-red-100 text-red-700'
            : inc.riskLevel === 'urgent' ? 'bg-orange-100 text-orange-700'
              : inc.riskLevel === 'attention' ? 'bg-[#F9E6C7] text-[#9B621D]'
                : 'bg-green-100 text-green-700',
      };
    }
  } else if (item.dailyLog) {
    const log = item.dailyLog;
    icon = log.aiAlertTriggered ? '⚠️' : '📝';
    title = t('dailyLogEntry');

    const parts: string[] = [];
    if (log.meals?.percentage !== undefined) parts.push(`${t('food')} ${log.meals.percentage}%`);
    if (log.sleep?.hours) parts.push(`${t('sleep')} ${log.sleep.hours}h`);

    subtitle = `${formatDateTime(log.createdAt)}${parts.length ? ` · ${parts.join(' · ')}` : ''}`;

    if (log.aiAlertTriggered) {
      badge = { text: t('aiAlertTriggered'), className: 'bg-[#F9E6C7] text-[#9B621D]' };
    }
  }

  return (
    <div className="relative flex gap-3">
      <span className="absolute -left-10 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-base">
        {icon}
      </span>
      <button onClick={onOpen} className="card flex-1 p-3 text-left transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <strong className="text-[13px]">{title}</strong>
          {badge && (
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
      </button>
    </div>
  );
}
