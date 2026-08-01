import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';

const FILTERS = ['filterAll', 'filterDiet', 'filterMeds', 'filterSleep', 'filterEvent'] as const;

const TIMELINE_ITEMS = [
  { icon: '⚠', title: '中高風險事件', desc: '09:42 · 食慾下降、呼吸急促、行走不穩。已通知家屬。', type: 'event' },
  { icon: '🍚', title: '早餐食量偏低', desc: '08:10 · 粥只吃約 20%，喝水正常。', type: 'diet' },
  { icon: '💊', title: '高血壓用藥', desc: '07:40 · 已服藥，無嘔吐。', type: 'meds' },
  { icon: '🌙', title: '昨夜睡眠', desc: '06:30 · 睡眠約 5.2 小時，比平常少。', type: 'sleep' },
];

export default function Timeline() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState('filterAll');

  const filtered = activeFilter === 'filterAll'
    ? TIMELINE_ITEMS
    : TIMELINE_ITEMS.filter(item => {
        if (activeFilter === 'filterDiet') return item.type === 'diet';
        if (activeFilter === 'filterMeds') return item.type === 'meds';
        if (activeFilter === 'filterSleep') return item.type === 'sleep';
        if (activeFilter === 'filterEvent') return item.type === 'event';
        return true;
      });

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

      {/* Timeline */}
      <div className="relative space-y-3 pl-10">
        <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-[#DDE8ED]" />
        {filtered.map((item, i) => (
          <div key={i} className="relative flex gap-3">
            <span className="absolute -left-10 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-base">
              {item.icon}
            </span>
            <div className="card flex-1 p-3">
              <strong className="text-[13px]">{item.title}</strong>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
