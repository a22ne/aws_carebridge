import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';
import type { ChatMessage, Language } from '@carebridge/shared-types';

const POLL_INTERVAL_MS = 5000;

export default function Chat() {
  const { t, lang, formatTime } = useI18n();
  const { role, householdId } = useAppState();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'chat' | 'guidelines'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  // Guidelines state
  const [guidelines, setGuidelines] = useState('');
  /** Untranslated text — the contact edits this, not the translation */
  const [guidelinesOriginal, setGuidelinesOriginal] = useState('');
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [guidelinesInput, setGuidelinesInput] = useState('');
  const [savingGuidelines, setSavingGuidelines] = useState(false);

  // Contact info of the other party (for phone call)
  const [otherPartyPhone, setOtherPartyPhone] = useState('');
  const [otherPartyName, setOtherPartyName] = useState('');

  const myName = localStorage.getItem('carebridge-user-name') || '';

  const loadMessages = useCallback(async () => {
    if (!householdId) return;
    const res = await api.getChatMessages(householdId);
    if (res.success && Array.isArray(res.data)) {
      setMessages(res.data);
    }
  }, [householdId]);

  // Initial load: household (guidelines + other party) and messages
  useEffect(() => {
    if (!householdId) {
      setLoadingMessages(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const [householdRes] = await Promise.all([
        api.getHousehold(householdId),
        loadMessages(),
      ]);

      if (cancelled) return;

      if (householdRes.success && householdRes.data) {
        const hh = householdRes.data as any;
        // Show guidelines in the reader's language; fall back to the original
        setGuidelines(hh.careGuidelineTranslations?.[lang] || hh.careGuidelines || '');
        setGuidelinesOriginal(hh.careGuidelines || '');

        // The other party is whoever isn't me
        const other = role === 'caregiver' ? hh.contactProfile : hh.caregiverProfile;
        setOtherPartyPhone(other?.phone || '');
        setOtherPartyName(other?.name || '');
      }
      setLoadingMessages(false);
    })();

    return () => { cancelled = true; };
  }, [householdId, role, loadMessages]);

  // Poll for new messages while the chat tab is open
  useEffect(() => {
    if (activeTab !== 'chat' || !householdId) return;
    const id = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeTab, householdId, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async () => {
    if (!input.trim() || !householdId || !role || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    const res = await api.sendChatMessage(householdId, {
      senderRole: role,
      senderName: myName,
      originalText: text,
      originalLanguage: lang,
    });

    if (res.success && res.data) {
      setMessages(prev => [...prev, res.data as ChatMessage]);
    } else {
      // Restore the text so the user doesn't lose it
      setInput(text);
    }
    setSending(false);
  };

  const saveGuidelines = async () => {
    if (!householdId) return;
    setSavingGuidelines(true);
    // Pass the author's language so the backend translates from the right source
    const res = await api.updateCareGuidelines(householdId, guidelinesInput, lang);
    if (res.success && res.data) {
      const hh = res.data as any;
      setGuidelinesOriginal(hh.careGuidelines || guidelinesInput);
      setGuidelines(hh.careGuidelineTranslations?.[lang] || guidelinesInput);
      setEditingGuidelines(false);
    }
    setSavingGuidelines(false);
  };

  const handleCall = () => {
    if (otherPartyPhone) window.open(`tel:${otherPartyPhone}`, '_self');
  };

  /** Show the message in my language, falling back to the original text */
  const displayText = (msg: ChatMessage): string =>
    msg.translations?.[lang as Language] || msg.originalText;

  const isTranslated = (msg: ChatMessage): boolean =>
    msg.originalLanguage !== lang && Boolean(msg.translations?.[lang as Language]);

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 rounded-button py-2 text-sm font-bold ${
            activeTab === 'chat' ? 'bg-primary text-white' : 'border border-line bg-white text-ink'
          }`}
        >
          {t('chatRoom')}
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`flex-1 rounded-button py-2 text-sm font-bold ${
            activeTab === 'guidelines' ? 'bg-primary text-white' : 'border border-line bg-white text-ink'
          }`}
        >
          {t('careGuidelines')}
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Call button */}
          <button
            onClick={handleCall}
            disabled={!otherPartyPhone}
            className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-2.5 text-sm font-bold text-primary-dark disabled:opacity-50"
          >
            📞 {otherPartyName ? `${t('callContact')} · ${otherPartyName}` : t('callContact')}
          </button>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-auto pb-4">
            {loadingMessages ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-line/40" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t('chatEmpty')}
              </div>
            ) : (
              messages.map(msg => {
                const mine = msg.senderRole === role;
                const translated = isTranslated(msg);
                const revealed = showOriginal[msg.messageId];
                return (
                  <div
                    key={msg.messageId}
                    className={`max-w-[80%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                      mine
                        ? 'ml-auto rounded-br-md bg-primary text-white'
                        : 'rounded-bl-md border border-line bg-white'
                    }`}
                  >
                    {!mine && msg.senderName && (
                      <span className="mb-1 block text-[10px] font-bold opacity-70">{msg.senderName}</span>
                    )}
                    <span>{revealed ? msg.originalText : displayText(msg)}</span>
                    <span className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                      {formatTime(msg.createdAt)}
                      {translated && (
                        <button
                          onClick={() => setShowOriginal(prev => ({ ...prev, [msg.messageId]: !prev[msg.messageId] }))}
                          className="underline"
                        >
                          {revealed ? t('showTranslation') : t('translated')}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="ml-auto max-w-[80%] animate-pulse rounded-2xl rounded-br-md bg-primary/60 p-3 text-[13px] text-white">
                {t('sendingMessage')}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-line bg-background pt-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={t('chatPlaceholder')}
              className="flex-1 rounded-full border border-line bg-white px-4 py-3 text-sm"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </>
      ) : (
        /* Guidelines tab */
        <div className="flex-1 overflow-auto">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{t('careGuidelines')}</h3>
              {role === 'contact' && !editingGuidelines && (
                <button
                  onClick={() => { setGuidelinesInput(guidelinesOriginal); setEditingGuidelines(true); }}
                  className="text-xs font-bold text-primary"
                >
                  {t('edit')}
                </button>
              )}
            </div>

            {editingGuidelines ? (
              <div className="space-y-3">
                <textarea
                  value={guidelinesInput}
                  onChange={e => setGuidelinesInput(e.target.value)}
                  placeholder={t('guidelinesPlaceholder')}
                  rows={8}
                  className="w-full resize-none rounded-2xl border border-line bg-[#FBFCFD] p-3 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={saveGuidelines} disabled={savingGuidelines} className="btn-primary flex-1 text-sm disabled:opacity-50">
                    {savingGuidelines ? t('loading') : t('save')}
                  </button>
                  <button onClick={() => setEditingGuidelines(false)} disabled={savingGuidelines} className="btn-ghost flex-1 text-sm">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : guidelines ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {guidelines}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted">
                {role === 'contact' ? t('guidelinesEmptyContact') : t('guidelinesEmptyCaregiver')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
