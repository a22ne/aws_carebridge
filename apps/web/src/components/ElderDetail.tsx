import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';

interface ElderData {
  displayName: string;
  age: number;
  birthday?: string;
  city?: string;
  gender?: string;
  chronicConditions: string[];
  otherConditions?: string;
}

interface ElderDetailProps {
  open: boolean;
  onClose: () => void;
  elder?: ElderData;
  onSave?: (data: ElderData) => void | Promise<void>;
}

export function ElderDetail({ open, onClose, elder, onSave }: ElderDetailProps) {
  const { t } = useI18n();
  const { role } = useAppState();
  const canEdit = role === 'contact';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ElderData>({
    displayName: '', age: 0, birthday: '', city: '', gender: '', chronicConditions: [], otherConditions: '',
  });

  // Sync form with elder prop when it changes or panel opens
  useEffect(() => {
    if (elder) {
      setForm({
        displayName: elder.displayName || '',
        age: elder.age || 0,
        birthday: elder.birthday || '',
        city: elder.city || '',
        gender: elder.gender || '',
        chronicConditions: elder.chronicConditions || [],
        otherConditions: elder.otherConditions || '',
      });
    }
  }, [elder, open]);

  // Reset editing state when panel closes
  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave?.(form);
    setSaving(false);
    setEditing(false);
  };

  const updateField = (key: keyof ElderData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-10 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('elderDetail')}</h2>
          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button onClick={() => { setForm(elder || form); setEditing(true); }} className="text-sm font-bold text-primary">
                {t('edit')}
              </button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-sm font-bold">
              ✕
            </button>
          </div>
        </div>

        {editing ? (
          /* Edit mode */
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-xs text-muted">{t('yourName')}</span>
              <input value={form.displayName} onChange={e => updateField('displayName', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('age')}</span>
                <input type="number" value={form.age || ''} onChange={e => updateField('age', Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('gender')}</span>
                <input value={form.gender || ''} onChange={e => updateField('gender', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('birthday')}</span>
                <input type="date" value={form.birthday || ''} onChange={e => updateField('birthday', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted">{t('city')}</span>
                <input value={form.city || ''} onChange={e => updateField('city', e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-xs text-muted">{t('chronicConditions')}</span>
              <input value={form.chronicConditions.join(', ')} onChange={e => updateField('chronicConditions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="text-xs text-muted">{t('otherConditions')}</span>
              <textarea value={form.otherConditions || ''} onChange={e => updateField('otherConditions', e.target.value)} rows={2} className="mt-1 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm" />
            </label>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-50">
                {saving ? t('loading') : t('save')}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving} className="btn-ghost flex-1 text-sm">
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('yourName')}</span>
                <p className="mt-1 font-bold">{elder?.displayName || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('age')}</span>
                <p className="mt-1 font-bold">{elder?.age || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('birthday')}</span>
                <p className="mt-1 font-bold">{elder?.birthday || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('city')}</span>
                <p className="mt-1 font-bold">{elder?.city || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('gender')}</span>
                <p className="mt-1 font-bold">{elder?.gender || '-'}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('chronicConditions')}</span>
                <p className="mt-1 font-bold">{elder?.chronicConditions?.join(', ') || '-'}</p>
              </div>
            </div>
            {elder?.otherConditions && (
              <div className="rounded-xl bg-[#F7F8FA] p-3">
                <span className="text-xs text-muted">{t('otherConditions')}</span>
                <p className="mt-1 text-sm">{elder.otherConditions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
