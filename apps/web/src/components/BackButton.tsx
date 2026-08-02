import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

/**
 * Bottom-of-page back control used across the onboarding flow.
 * Always steps one entry back in browser history so the button behaves
 * the same regardless of which branch the user came from.
 */
export function BackButton({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`btn-ghost w-full text-sm ${className}`}
    >
      ← {t('back')}
    </button>
  );
}
