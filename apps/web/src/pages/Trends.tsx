import { useI18n } from '@/hooks/useI18n';

const BARS_FOOD = [92, 82, 72, 58, 30];
const BARS_SLEEP = [78, 66, 58, 48];

export default function Trends() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('trendTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('trendDesc')}</p>
      </div>

      {/* AI Trend Alert */}
      <div className="card border-[#F1DDB9] bg-[#FFF9ED] p-4">
        <h3 className="font-bold text-[#8B5B16]">{t('trendAlert')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#705426]">
          近兩週食量與睡眠都有下降趨勢，且今日出現呼吸急促與行走不穩，建議提高追蹤頻率。
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <strong className="text-lg">-32%</strong>
          <span className="block text-[11px] text-muted">{t('food')}</span>
        </div>
        <div className="card p-3 text-center">
          <strong className="text-lg">-18%</strong>
          <span className="block text-[11px] text-muted">{t('sleep')}</span>
        </div>
        <div className="card p-3 text-center">
          <strong className="text-lg">-1.4kg</strong>
          <span className="block text-[11px] text-muted">{t('weight')}</span>
        </div>
      </div>

      {/* Food chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <strong>近兩週食量</strong>
          <span>14 days</span>
        </div>
        <div className="mt-3 flex h-32 items-end gap-2">
          {BARS_FOOD.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${h}%`,
                  background: i === BARS_FOOD.length - 1
                    ? 'linear-gradient(#e7b464, #f3d6a1)'
                    : 'linear-gradient(var(--tw-gradient-from, #7FB685), var(--tw-gradient-to, #B9D9BE))',
                }}
              />
              <span className="mt-1 text-[10px] text-muted">{[1, 4, 7, 10, 14][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <strong>睡眠時數</strong>
          <span>avg 5.6h</span>
        </div>
        <div className="mt-3 flex h-32 items-end gap-3">
          {BARS_SLEEP.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-lg bg-gradient-to-b from-primary to-[#B8CBD4]"
                style={{ height: `${h}%` }}
              />
              <span className="mt-1 text-[10px] text-muted">{['Mon', 'Wed', 'Fri', 'Sun'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
