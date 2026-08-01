import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  /** Literal role text entered by user */
  role?: string;
  /** i18n key — resolved at render time */
  roleKey?: string;
  enabled: boolean;
}

export default function Notify() {
  const { t } = useI18n();
  const { householdId } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  const incidentId = (location.state as any)?.incidentId;
  const hhId = (location.state as any)?.householdId || householdId;

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [incidentData, setIncidentData] = useState<any>(null);

  // Fetch incident data for summary
  useEffect(() => {
    if (!incidentId || !hhId) return;
    api.getIncident(incidentId, hhId).then(res => {
      if (res.success && res.data) {
        setIncidentData(res.data);
      }
    });
  }, [incidentId, hhId]);

  // Editable recipients
  const contactName = localStorage.getItem('carebridge-user-name') || '';
  const contactPhone = localStorage.getItem('carebridge-user-phone') || '';
  const contactRelation = localStorage.getItem('carebridge-user-relationship') || '';

  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: '1',
      name: contactName,
      phone: contactPhone,
      role: contactRelation || undefined,
      roleKey: contactRelation ? undefined : 'family',
      enabled: true,
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');

  const renderRole = (r: Recipient): string =>
    r.roleKey ? t(r.roleKey as any) : (r.role ?? '');

  const addRecipient = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setRecipients(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole.trim() || undefined,
      roleKey: newRole.trim() ? undefined : 'careOrg',
      enabled: true,
    }]);
    setNewName('');
    setNewPhone('');
    setNewRole('');
    setShowAdd(false);
  };

  const toggleRecipient = (id: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSend = async () => {
    if (!incidentId || !hhId) {
      setErrorKey('notifyErrorMissingIncident');
      setErrorText('');
      return;
    }
    setLoading(true);
    setErrorKey(null);
    setErrorText('');

    const res = await api.notifyContacts(incidentId, hhId);
    if (res.success) {
      setSent(true);
    } else if (res.error?.message) {
      setErrorText(res.error.message);
    } else {
      setErrorKey('error');
    }
    setLoading(false);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const displayError = errorKey ? t(errorKey as any) : errorText;

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-surface text-3xl text-green-700">
          ✓
        </div>
        <h2 className="text-xl font-bold">{t('notifySent')}</h2>
        <p className="mt-2 text-sm text-muted">{t('notifySentBody')}</p>
        <button onClick={() => navigate('/home')} className="btn-primary mt-6">
          {t('backHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-lg">←</button>
        <div>
          <h1 className="text-2xl font-bold">{t('notifyTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notifyDesc')}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <h3 className="mb-3 font-bold">{t('summaryTitle')}</h3>
        <div className="space-y-2 text-[13px]">
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('symptoms')}</span>
            <span>{incidentData?.extractedSymptoms?.filter((s: any) => s.status === 'present').map((s: any) => s.label).join('、') || t('noData')}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('risk')}</span>
            <span>{incidentData?.riskLevel ? t(`risk_${incidentData.riskLevel}` as any) || incidentData.riskLevel : t('noData')}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('suggest')}</span>
            <span>{incidentData?.recommendedActions?.map((a: string) => t(`action_${a}` as any) || a).join('、') || t('noData')}</span>
          </div>
        </div>
      </div>

      {/* Recipients — editable */}
      <div>
        <h3 className="mb-2 text-sm font-bold">{t('notifyRecipients')}</h3>
        <div className="space-y-2">
          {recipients.map(r => (
            <div key={r.id} className="card flex items-center justify-between p-3">
              <div className="flex-1">
                <strong className="text-sm">{r.name}</strong>
                <span className="block text-[11px] text-muted">{renderRole(r)} · {r.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCall(r.phone)}
                  className="text-sm text-primary"
                  aria-label={t('callContact')}
                >
                  📞
                </button>
                <button
                  onClick={() => toggleRecipient(r.id)}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                    r.enabled ? 'bg-accent' : 'bg-[#DDE5E8]'
                  }`}
                  aria-label={r.name}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    r.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new recipient */}
        {showAdd ? (
          <div className="mt-3 card p-4 space-y-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('yourName')}
              className="w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
            />
            <input
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder={t('yourPhone')}
              className="w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
            />
            <input
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              placeholder={t('rolePlaceholder')}
              className="w-full rounded-xl border border-line bg-[#FBFCFD] px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={addRecipient} className="btn-primary flex-1 text-sm">{t('confirm')}</button>
              <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1 text-sm">{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="mt-2 w-full rounded-2xl border-2 border-dashed border-line p-3 text-center text-sm text-muted">
            + {t('addRecipient')}
          </button>
        )}
      </div>

      {/* Notify options */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold">{t('notifyMethod')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleSend} disabled={loading} className="btn-primary text-sm disabled:opacity-50">
            {loading ? t('loading') : t('sendViaChat')}
          </button>
          <button
            onClick={() => {
              const enabled = recipients.filter(r => r.enabled);
              if (enabled.length > 0) handleCall(enabled[0].phone);
            }}
            className="btn-ghost text-sm"
          >
            {t('callEmergency')}
          </button>
        </div>
      </div>

      {displayError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {displayError}
        </div>
      )}
    </div>
  );
}
