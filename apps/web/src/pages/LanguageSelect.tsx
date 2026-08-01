import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import type { Language } from '@carebridge/shared-types';

const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: 'zh-TW', label: '繁體中文', native: '繁體中文' },
  { value: 'en', label: 'English', native: 'English' },
  { value: 'id', label: 'Bahasa Indonesia', native: 'Bahasa Indonesia' },
  { value: 'vi', label: 'Tiếng Việt', native: 'Tiếng Việt' },
];

export default function LanguageSelect() {
  const { setLang } = useI18n();
  const navigate = useNavigate();

  const handleSelect = (lang: Language) => {
    setLang(lang);
    navigate('/role');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <span className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
          <span className="absolute h-1.5 w-7 rounded-full bg-primary-dark" />
          <span className="absolute h-7 w-1.5 rounded-full bg-accent" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">CareBridge AI</h1>
        <p className="mt-1 text-sm text-muted">Select your language</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {LANGUAGES.map(lang => (
          <button
            key={lang.value}
            onClick={() => handleSelect(lang.value)}
            className="card flex w-full items-center justify-between p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-base font-bold text-ink">{lang.native}</span>
            <span className="text-sm text-muted">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
