import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

export default function Trends() {
  const { t, lang } = useI18n();
  const { householdId } = useAppState();

  const [alertText, setAlertText] = useState<string | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    setAlertLoading(true);
    api.getTrendAlert(householdId, lang).then(res => {
      if (res.success && res.data) {
        const text = (res.data as any).alertText;
        setAlertText(text);
        // Check if it's the "insufficient data" message
        if (text && !text.includes('資料不足') && !text.includes('insufficient')) {
          setHasData(true);
        }
      }
      setAlertLoading(false);
    });
  }, [householdId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('trendTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('trendDesc')}</p>
      </div>

      {/* AI Trend Alert */}
      <div className="card border-[#F1DDB9] bg-[#FFF9ED] p-4">
        <h3 className="font-bold text-[#8B5B16]">{t('trendAlert')}</h3>
        {alertLoading ? (
          <p className="mt-1 animate-pulse text-xs text-[#705426]">AI 分析中...</p>
        ) : alertText ? (
          <p className="mt-1 text-xs leading-relaxed text-[#705426]">{alertText}</p>
        ) : (
          <p className="mt-1 text-xs text-[#705426]">{t('noTrendData')}</p>
        )}
      </div>

      {/* Only show charts if there's actual data */}
      {hasData ? (
        <>
          {/* Stats will be populated from real data */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 text-center">
              <strong className="text-lg">--</strong>
              <span className="block text-[11px] text-muted">{t('food')}</span>
            </div>
            <div className="card p-3 text-center">
              <strong className="text-lg">--</strong>
              <span className="block text-[11px] text-muted">{t('sleep')}</span>
            </div>
            <div className="card p-3 text-center">
              <strong className="text-lg">--</strong>
              <span className="block text-[11px] text-muted">{t('weight')}</span>
            </div>
          </div>
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
