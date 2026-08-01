import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

const NAV_ITEMS = [
  { key: 'navHome', path: '/home', icon: '⌂' },
  { key: 'navChat', path: '/chat', icon: '💬' },
  { key: 'navCopilot', path: '/copilot', icon: 'AI' },
  { key: 'navTimeline', path: '/timeline', icon: '◷' },
  { key: 'navTrend', path: '/trend', icon: '↗' },
] as const;

export function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-3 py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex min-h-[44px] flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'bg-[#EEF6F7] text-primary-dark'
                  : 'text-muted hover:text-primary-dark'
              }`}
              aria-label={t(item.key as any)}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{t(item.key as any)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
