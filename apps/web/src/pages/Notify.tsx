import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

export default function Notify() {
  const { t } = useI18n();
  const { householdId } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  const incidentId = (location.state as any)?.incidentId;
  const hhId = (location.state as any)?.householdId || householdId;

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toggles, setToggles] = useState({ family: true, org: true, manager: false });

  const handleSend = async () => {
    if (!incidentId || !hhId) {
      setErrorMsg('無法送出通知：缺少事件資訊');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await api.notifyContacts(incidentId, hhId);

    if (res.success) {
      setSent(true);
    } else {
      setErrorMsg(res.error?.message || t('error'));
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('notifyTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('notifyDesc')}</p>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <h3 className="mb-3 font-bold">{t('summaryTitle')}</h3>
        <div className="space-y-2 text-[13px]">
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('symptoms')}</span>
            <span>食慾下降、呼吸急促、行走不穩</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('risk')}</span>
            <span>中高風險，建議安排醫療評估</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-line pt-2">
            <span className="font-bold text-muted">{t('suggest')}</span>
            <span>聯繫家屬，持續觀察意識與呼吸，安排診所或醫療評估。</span>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        {[
          { key: 'family' as const, label: t('family'), sub: '兒子 · 台北' },
          { key: 'org' as const, label: t('careOrg'), sub: '花蓮社區照護站' },
          { key: 'manager' as const, label: t('caseManager'), sub: 'Long-term care case manager' },
        ].map(r => (
          <div key={r.key} className="card flex items-center justify-between p-3">
            <div>
              <strong className="text-sm">{r.label}</strong>
              <span className="block text-[11px] text-muted">{r.sub}</span>
            </div>
            <button
              onClick={() => setToggles(prev => ({ ...prev, [r.key]: !prev[r.key] }))}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                toggles[r.key] ? 'bg-accent' : 'bg-[#DDE5E8]'
              }`}
              aria-label={`Toggle ${r.label}`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  toggles[r.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-2xl bg-[#EFF5F7] p-4">
        <strong className="text-sm">{t('notifyPreview')}</strong>
        <div className="mt-2 rounded-2xl bg-white p-3 text-xs leading-relaxed text-muted">
          CareBridge AI：林先生今日出現食慾下降、呼吸急促與行走不穩。AI 判定中高風險，建議儘速聯繫照顧者並安排醫療評估。
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? t('loading') : t('sendNotify')}
      </button>
    </div>
  );
}
