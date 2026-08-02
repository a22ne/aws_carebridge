import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import { BackButton } from '@/components/BackButton';
import type { Role } from '@carebridge/shared-types';

export default function RoleSelect() {
  const { t } = useI18n();
  const { setRole } = useAppState();
  const navigate = useNavigate();

  const handleSelect = (role: Role) => {
    setRole(role);
    if (role === 'caregiver') {
      navigate('/caregiver-profile');
    } else {
      // Contact goes to choice: create new family or join existing
      navigate('/contact-choice');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">{t('selectRole')}</h1>
        <p className="mt-2 text-sm text-muted">CareBridge AI</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => handleSelect('caregiver')}
          className="card w-full p-6 text-left transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-surface text-2xl">
            🧑‍⚕️
          </div>
          <h2 className="text-lg font-bold text-ink">{t('roleCaregiver')}</h2>
          <p className="mt-1 text-xs text-muted">{t('caregiverRoleDesc')}</p>
        </button>

        <button
          onClick={() => handleSelect('contact')}
          className="card w-full p-6 text-left transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF6F7] text-2xl">
            👨‍👩‍👧
          </div>
          <h2 className="text-lg font-bold text-ink">{t('roleContact')}</h2>
          <p className="mt-1 text-xs text-muted">{t('contactRoleDesc')}</p>
        </button>

        <BackButton />
      </div>
    </div>
  );
}
