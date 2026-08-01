import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useI18n } from '@/hooks/useI18n';
import type { Language } from '@carebridge/shared-types';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'zh-TW', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export function AppShell() {
  const { lang, setLang } = useI18n();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
            <span className="absolute h-1.5 w-5 rounded-full bg-primary-dark" />
            <span className="absolute h-5 w-1.5 rounded-full bg-accent" />
          </span>
          <div>
            <strong className="text-[15px] leading-tight">CareBridge AI</strong>
            <span className="block text-[11px] text-muted">{useI18n().t('appSubtitle')}</span>
          </div>
        </div>
        <select
          value={lang}
          onChange={e => setLang(e.target.value as Language)}
          className="rounded-full border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-primary-dark"
          aria-label="Language selector"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto px-4 pb-24 pt-3">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
