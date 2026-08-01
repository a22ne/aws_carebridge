import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { Role, UserProfile } from '@carebridge/shared-types';

interface UserProfileCardProps {
  /** Whose profile this card shows */
  profileRole: Role;
  profile?: UserProfile;
  /** True when the viewer owns this profile and may edit it */
  editable: boolean;
  onSave?: (data: { name: string; phone: string; relationship?: string }) => void | Promise<void>;
}

export function UserProfileCard({ profileRole, profile, editable, onSave }: UserProfileCardProps) {
  const { t } = useI18n();

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  useEffect(() => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setRelationship(profile?.relationship || '');
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await onSave?.({
      name: name.trim(),
      phone: phone.trim(),
      relationship: profileRole === 'contact' ? relationship.trim() : undefined,
    });
    setSaving(false);
    setEditing(false);
  };

  const cancelEdit = () => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setRelationship(profile?.relationship || '');
    setEditing(false);
  };

  const roleLabel = profileRole === 'caregiver' ? t('roleCaregiverLabel') : t('roleContactLabel');
  const icon = profileRole === 'caregiver' ? '🧑‍⚕️' : '👨‍👩‍👧';
  const hasProfile = Boolean(profile?.name || profile?.phone);

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6f7] text-xl">
          {icon}
        </div>
        <div className="flex-1">
          <span className="block text-[11px] text-muted">
            {roleLabel}
            {editable ? ` · ${t('you')}` : ''}
          </span>
          <strong className="text-sm">{profile?.name || t('noData')}</strong>
        </div>
        <span className="text-muted">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-line p-3">
          {editing ? (
            <div className="space-y-2">
              <label className="block text-xs text-muted">
                {t('yourName')}
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs text-muted">
                {t('yourPhone')}
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm text-ink"
                />
              </label>
              {profileRole === 'contact' && (
                <label className="block text-xs text-muted">
                  {t('relationship')}
                  <input
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    placeholder={t('relationshipPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm text-ink"
                  />
                </label>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-xs disabled:opacity-50">
                  {saving ? t('loading') : t('save')}
                </button>
                <button onClick={cancelEdit} disabled={saving} className="btn-ghost flex-1 text-xs">
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#F7F8FA] p-2.5">
                  <span className="text-[10px] text-muted">{t('yourName')}</span>
                  <p className="mt-0.5 text-sm font-bold">{profile?.name || '-'}</p>
                </div>
                <div className="rounded-xl bg-[#F7F8FA] p-2.5">
                  <span className="text-[10px] text-muted">{t('yourPhone')}</span>
                  <p className="mt-0.5 text-sm font-bold">{profile?.phone || '-'}</p>
                </div>
              </div>
              {profileRole === 'contact' && (
                <div className="rounded-xl bg-[#F7F8FA] p-2.5">
                  <span className="text-[10px] text-muted">{t('relationship')}</span>
                  <p className="mt-0.5 text-sm font-bold">{profile?.relationship || '-'}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {editable ? (
                  <button onClick={() => setEditing(true)} className="btn-ghost flex-1 text-xs">
                    {t('edit')}
                  </button>
                ) : hasProfile && profile?.phone ? (
                  <button
                    onClick={() => window.open(`tel:${profile.phone}`, '_self')}
                    className="btn-ghost flex-1 text-xs"
                  >
                    📞 {t('callContact')}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
