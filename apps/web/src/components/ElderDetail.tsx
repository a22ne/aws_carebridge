import { useI18n } from '@/hooks/useI18n';

interface ElderDetailProps {
  open: boolean;
  onClose: () => void;
  elder?: {
    displayName: string;
    age: number;
    birthday?: string;
    city?: string;
    gender?: string;
    chronicConditions: string[];
    otherConditions?: string;
  };
}

export function ElderDetail({ open, onClose, elder }: ElderDetailProps) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md animate-[slideUp_0.3s_ease] rounded-t-3xl bg-white p-6 pb-10 shadow-xl">
        {/* Close button */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('elderDetail')}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {elder ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('yourName')}</span>
                <p className="mt-1 font-bold">{elder.displayName}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('age')}</span>
                <p className="mt-1 font-bold">{elder.age}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('birthday')}</span>
                <p className="mt-1 font-bold">{elder.birthday || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('city')}</span>
                <p className="mt-1 font-bold">{elder.city || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('gender')}</span>
                <p className="mt-1 font-bold">{elder.gender || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('chronicConditions')}</span>
                <p className="mt-1 font-bold">{elder.chronicConditions.join(', ') || '-'}</p>
              </div>
            </div>

            {elder.otherConditions && (
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('otherConditions')}</span>
                <p className="mt-1 text-sm">{elder.otherConditions}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted">{t('noData')}</p>
        )}
      </div>
    </div>
  );
}
