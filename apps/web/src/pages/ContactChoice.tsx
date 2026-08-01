import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

export default function ContactChoice() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">{t('contactChoiceTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('contactChoiceDesc')}</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => navigate('/contact-profile')}
          className="card w-full p-6 text-left transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-surface text-2xl">
            ➕
          </div>
          <h2 className="text-lg font-bold text-ink">{t('createNewFamily')}</h2>
          <p className="mt-1 text-xs text-muted">{t('createNewFamilyDesc')}</p>
        </button>

        <button
          onClick={() => navigate('/join')}
          className="card w-full p-6 text-left transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF6F7] text-2xl">
            🔗
          </div>
          <h2 className="text-lg font-bold text-ink">{t('joinExistingFamily')}</h2>
          <p className="mt-1 text-xs text-muted">{t('joinExistingFamilyDesc')}</p>
        </button>
      </div>
    </div>
  );
}
