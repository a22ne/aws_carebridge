import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { TrendBarChart, type BarDatum } from '@/components/TrendBarChart';
import * as api from '@/services/api';
import type { DailyLog } from '@carebridge/shared-types';

/** Matches the backend trend analysis window */
const WINDOW_SIZE = 14;

interface Delta {
  /** Formatted for display, e.g. "-32%" or "-1.4kg" */
  display: string;
  direction: 'down' | 'up' | 'flat';
}

/** MM/DD axis label from a YYYY-MM-DD date or an ISO timestamp */
function axisLabel(log: DailyLog): string {
  const raw = log.date || log.createdAt;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/** Relative change between the oldest and newest reading */
function percentDelta(values: number[]): Delta | null {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return null;
  const pct = Math.round(((last - first) / first) * 100);
  return {
    display: `${pct > 0 ? '+' : ''}${pct}%`,
    direction: pct < 0 ? 'down' : pct > 0 ? 'up' : 'flat',
  };
}

/** Absolute change, used for weight where percentages read oddly */
function absoluteDelta(values: number[], unit: string): Delta | null {
  if (values.length < 2) return null;
  const diff = values[values.length - 1] - values[0];
  const rounded = Math.round(diff * 10) / 10;
  return {
    display: `${rounded > 0 ? '+' : ''}${rounded}${unit}`,
    direction: rounded < 0 ? 'down' : rounded > 0 ? 'up' : 'flat',
  };
}

export default function Trends() {
  const { t, lang } = useI18n();
  const { householdId } = useAppState();

  const [alertText, setAlertText] = useState<string | null>(null);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [minDays, setMinDays] = useState(3);
  const [currentDays, setCurrentDays] = useState(0);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.getTrendAlert(householdId, lang),
      api.getHouseholdDailyLogs(householdId),
    ]).then(([alertRes, logsRes]) => {
      if (cancelled) return;

      if (alertRes.success && alertRes.data) {
        const d = alertRes.data;
        setHasEnoughData(d.hasEnoughData === true);
        setMinDays(d.minimumDaysRequired ?? 3);
        setCurrentDays(d.currentDays ?? 0);
        setAlertText(d.alertText ?? null);
      }

      if (logsRes.success && Array.isArray(logsRes.data)) {
        // API returns newest first — flip to chronological for charts
        const ordered = [...(logsRes.data as DailyLog[])]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .slice(-WINDOW_SIZE);
        setLogs(ordered);
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [householdId, lang]);

  const metrics = useMemo(() => {
    const foodBars: BarDatum[] = [];
    const sleepBars: BarDatum[] = [];
    const weightBars: BarDatum[] = [];

    const foodValues: number[] = [];
    const sleepValues: number[] = [];
    const weightValues: number[] = [];

    for (const log of logs) {
      const label = axisLabel(log);

      const food = log.meals?.percentage;
      const hasFood = typeof food === 'number';
      foodBars.push({ label, value: hasFood ? food : null });
      if (hasFood) foodValues.push(food);

      const sleep = log.sleep?.hours;
      const hasSleep = typeof sleep === 'number' && sleep > 0;
      sleepBars.push({ label, value: hasSleep ? sleep : null });
      if (hasSleep) sleepValues.push(sleep);

      const weight = log.weight;
      const hasWeight = typeof weight === 'number' && weight > 0;
      weightBars.push({ label, value: hasWeight ? weight : null });
      if (hasWeight) weightValues.push(weight);
    }

    const avgSleep = sleepValues.length
      ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10
      : null;

    return {
      foodBars,
      sleepBars,
      weightBars,
      foodDelta: percentDelta(foodValues),
      sleepDelta: percentDelta(sleepValues),
      weightDelta: absoluteDelta(weightValues, 'kg'),
      avgSleep,
      hasWeight: weightValues.length > 0,
    };
  }, [logs]);

  const insufficientMessage = t('trendInsufficientData')
    .replace('{min}', String(minDays))
    .replace('{current}', String(currentDays));

  const daysCaption = t('trendDaysCaption').replace('{n}', String(logs.length));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('trendTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('trendDesc')}</p>
      </div>

      {/* AI Trend Alert */}
      <div className="card border-[#F1DDB9] bg-[#FFF9ED] p-4">
        <h3 className="font-bold text-[#8B5B16]">{t('trendAlert')}</h3>
        {loading ? (
          <p className="mt-1 animate-pulse text-xs text-[#705426]">{t('aiAnalyzing')}</p>
        ) : hasEnoughData && alertText ? (
          <p className="mt-1 text-xs leading-relaxed text-[#705426]">{alertText}</p>
        ) : (
          <p className="mt-1 text-xs text-[#705426]">{insufficientMessage}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="card h-20 animate-pulse" />
          <div className="card h-44 animate-pulse" />
        </div>
      ) : hasEnoughData ? (
        <>
          {/* Stat cards — computed from the daily logs */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t('food')} delta={metrics.foodDelta} />
            <StatCard label={t('sleep')} delta={metrics.sleepDelta} />
            <StatCard label={t('weight')} delta={metrics.weightDelta} />
          </div>

          <TrendBarChart
            title={t('trendChartFood')}
            caption={daysCaption}
            data={metrics.foodBars}
            unit="%"
          />

          <TrendBarChart
            title={t('trendChartSleep')}
            caption={metrics.avgSleep !== null ? `${t('trendAvg')} ${metrics.avgSleep}h` : daysCaption}
            data={metrics.sleepBars}
            fill="linear-gradient(#6D8EA0, #B8CBD4)"
            lastFill="linear-gradient(#456B7E, #8FAEBC)"
            unit="h"
          />

          {metrics.hasWeight && (
            <TrendBarChart
              title={t('trendChartWeight')}
              caption={daysCaption}
              data={metrics.weightBars}
              fill="linear-gradient(#A8B8C4, #D3DCE3)"
              lastFill="linear-gradient(#6D8EA0, #B8CBD4)"
              unit="kg"
            />
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <div className="mb-3 text-4xl">📊</div>
          <p className="text-sm text-muted">{t('noTrendData')}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, delta }: { label: string; delta: Delta | null }) {
  const color =
    delta === null ? 'text-muted'
      : delta.direction === 'down' ? 'text-[#9B621D]'
        : delta.direction === 'up' ? 'text-green-700'
          : 'text-ink';

  return (
    <div className="card p-3 text-center">
      <strong className={`text-lg ${color}`}>{delta?.display ?? '--'}</strong>
      <span className="block text-[11px] text-muted">{label}</span>
    </div>
  );
}
