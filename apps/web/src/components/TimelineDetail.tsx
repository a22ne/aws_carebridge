import { useI18n } from '@/hooks/useI18n';
import { labelForCode } from '@/constants/careOptions';
import type { Incident, DailyLog, ExtractedSymptom } from '@carebridge/shared-types';

export type TimelineDetailTarget =
  | { kind: 'incident'; data: Incident }
  | { kind: 'dailyLog'; data: DailyLog };

interface TimelineDetailProps {
  open: boolean;
  onClose: () => void;
  target: TimelineDetailTarget | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#F7F8FA] p-2.5">
      <span className="text-[10px] text-muted">{label}</span>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

export function TimelineDetail({ open, onClose, target }: TimelineDetailProps) {
  const { t } = useI18n();

  if (!open || !target) return null;

  const symptomStatusLabel = (s: ExtractedSymptom['status']) =>
    s === 'present' ? t('symptomPresent')
      : s === 'absent' ? t('symptomAbsent')
        : t('symptomUnknown');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-auto rounded-t-3xl bg-white p-6 pb-10 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {target.kind === 'incident' ? t('incidentDetail') : t('timelineDetail')}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-sm font-bold"
            aria-label={t('cancel')}
          >
            ✕
          </button>
        </div>

        {target.kind === 'incident' ? (
          <IncidentBody incident={target.data} symptomStatusLabel={symptomStatusLabel} />
        ) : (
          <DailyLogBody log={target.data} />
        )}
      </div>
    </div>
  );
}

function IncidentBody({
  incident,
  symptomStatusLabel,
}: {
  incident: Incident;
  symptomStatusLabel: (s: ExtractedSymptom['status']) => string;
}) {
  const { t, tOptional, lang, formatDateTime } = useI18n();
  const symptoms = incident.extractedSymptoms || [];

  const statusLabel =
    tOptional(`status${incident.status.charAt(0).toUpperCase()}${incident.status.slice(1)}`)
    ?? incident.status;

  // Rule IDs resolve to translated titles; unknown IDs show the raw ID
  const ruleTitles = (incident.triggeredRules || []).map(
    id => tOptional(`rule_${id}`) ?? id
  );

  const missingInfo =
    (incident as any).missingInformationByLanguage?.[lang] ?? incident.missingInformation ?? [];

  return (
    <div className="space-y-2.5">
      {/* Risk level banner */}
      {incident.riskLevel && (
        <div
          className={`rounded-xl p-3 text-sm font-bold ${
            incident.riskLevel === 'emergency' ? 'bg-red-50 text-red-700'
              : incident.riskLevel === 'urgent' ? 'bg-orange-50 text-orange-700'
                : incident.riskLevel === 'attention' ? 'bg-[#FFF6E6] text-[#8B5B16]'
                  : 'bg-green-50 text-green-700'
          }`}
        >
          {t(`risk_${incident.riskLevel}` as any) || incident.riskLevel}
        </div>
      )}

      <Row label={t('recordedAt')} value={formatDateTime(incident.createdAt)} />
      <Row label={t('status')} value={statusLabel} />

      {incident.originalText && (
        <Row label={t('originalText')} value={incident.originalText} />
      )}
      {incident.translatedText && (
        <Row label={t('translatedText')} value={incident.translatedText} />
      )}

      {/* Extracted symptoms */}
      {symptoms.length > 0 && (
        <div className="rounded-xl bg-[#F7F8FA] p-2.5">
          <span className="text-[10px] text-muted">{t('extractedSymptoms')}</span>
          <ul className="mt-1 space-y-1">
            {symptoms.map((s, i) => (
              <li key={`${s.code}-${i}`} className="flex items-center justify-between text-sm">
                <span>{s.labels?.[lang] ?? s.label ?? s.code}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    s.status === 'present' ? 'bg-orange-100 text-orange-700'
                      : s.status === 'absent' ? 'bg-green-100 text-green-700'
                        : 'bg-line text-muted'
                  }`}
                >
                  {symptomStatusLabel(s.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {incident.recommendedActions?.length > 0 && (
        <div className="rounded-xl bg-[#F7F8FA] p-2.5">
          <span className="text-[10px] text-muted">{t('recommendedActions')}</span>
          <ul className="mt-1 list-inside list-disc text-sm">
            {incident.recommendedActions.map((a, i) => (
              <li key={i}>{t(`action_${a}` as any) || a}</li>
            ))}
          </ul>
        </div>
      )}

      {missingInfo.length > 0 && (
        <Row label={t('unconfirmedInfo')} value={missingInfo.join('、')} />
      )}

      {ruleTitles.length > 0 && (
        <Row label={t('triggeredRules')} value={ruleTitles.join('、')} />
      )}

      <p className="pt-1 text-[11px] leading-relaxed text-muted">{t('disclaimer')}</p>
    </div>
  );
}

function DailyLogBody({ log }: { log: DailyLog }) {
  const { t, tOptional, formatDate, formatDateTime } = useI18n();

  // Codes resolve to the current language; legacy free text falls through
  const mobilityLabel = labelForCode('mobility', log.mobility, tOptional);
  const breathingLabel = labelForCode('breathing', log.breathing, tOptional);
  const moodLabel = labelForCode('mood', log.mood, tOptional);
  const excretionLabel = labelForCode('excretion', log.excretion, tOptional);

  return (
    <div className="space-y-2.5">
      {log.aiAlertTriggered && (
        <div className="rounded-xl bg-[#FFF6E6] p-3 text-sm font-bold text-[#8B5B16]">
          ⚠ {t('aiAlertTriggered')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Row label={t('recordedAt')} value={formatDate(log.date || log.createdAt)} />
        <Row label={t('mealPercentage')} value={`${log.meals?.percentage ?? 0}%`} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Row label={t('medicationTaken')} value={log.medication?.taken ? t('yes') : t('no')} />
        <Row label={t('sleepHours')} value={log.sleep?.hours ? `${log.sleep.hours} h` : '-'} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Row label={t('mobility')} value={mobilityLabel} />
        <Row label={t('breathing')} value={breathingLabel} />
      </div>

      {(log.weight || log.temperature) && (
        <div className="grid grid-cols-2 gap-2.5">
          <Row label={t('weightKg')} value={log.weight ? String(log.weight) : '-'} />
          <Row label={t('temperatureC')} value={log.temperature ? String(log.temperature) : '-'} />
        </div>
      )}

      {log.mood && <Row label={t('mood')} value={moodLabel} />}
      {log.excretion && <Row label={t('excretion')} value={excretionLabel} />}
      {log.notes && <Row label={t('notes')} value={log.notes} />}

      <p className="pt-1 text-[11px] text-muted">
        {formatDateTime(log.createdAt)}
      </p>
    </div>
  );
}
