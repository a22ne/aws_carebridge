import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  /** Literal text (user input or AI response) */
  content?: string;
  /** i18n key — resolved at render time so language switches apply immediately */
  contentKey?: string;
}

export default function Copilot() {
  const { t, lang } = useI18n();
  const { householdId, elderId } = useAppState();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', contentKey: 'copilotHello' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Resolve a message to display text
  const renderMessage = (msg: Message): string =>
    msg.contentKey ? t(msg.contentKey as any) : (msg.content ?? '');

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    if (!householdId) return null;

    const res = await api.createConversation({
      householdId,
      elderId: elderId || 'unknown',
      language: lang,
      context: 'standalone',
    });

    if (res.success && res.data) {
      const id = (res.data as any).conversationId;
      setConversationId(id);
      return id;
    }
    return null;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const convId = await ensureConversation();
      if (!convId || !householdId) {
        setMessages(prev => [...prev, { role: 'assistant', contentKey: 'copilotErrorCreate' }]);
        setLoading(false);
        return;
      }

      const res = await api.sendCopilotMessage(convId, householdId, text.trim());

      if (res.success && res.data) {
        const rawResponse = (res.data as any).response;
        if (!rawResponse) {
          setMessages(prev => [...prev, { role: 'assistant', contentKey: 'copilotErrorNoReply' }]);
        } else {
          // Strip markdown formatting from AI response
          const cleanResponse = rawResponse
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/^#+\s/gm, '')
            .replace(/^-\s/gm, '• ');
          setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
        }
      } else if (res.error?.retryable) {
        setMessages(prev => [...prev, { role: 'assistant', contentKey: 'copilotErrorRetryable' }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.error?.message,
          contentKey: res.error?.message ? undefined : 'error',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', contentKey: 'copilotErrorNetwork' }]);
    }

    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="mb-3">
        <h1 className="text-xl font-bold">{t('copilotTitle')}</h1>
        <p className="text-xs text-muted">{t('copilotDesc')}</p>
      </div>

      <div className="mb-2 rounded-2xl border border-[#F1DFBC] bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#805E29]">
        {t('disclaimer')}
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-3 overflow-auto pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[84%] rounded-2xl p-3 text-[13px] leading-relaxed shadow-sm ${
              msg.role === 'assistant'
                ? 'rounded-bl-md border border-line bg-white'
                : 'ml-auto rounded-br-md bg-primary text-white'
            }`}
          >
            {renderMessage(msg)}
          </div>
        ))}
        {loading && (
          <div className="max-w-[84%] animate-pulse rounded-2xl rounded-bl-md border border-line bg-white p-3 text-[13px] text-muted">
            {t('thinking')}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="flex gap-2 overflow-auto pb-2">
        <button
          onClick={() => send(t('suggestedQ1'))}
          className="whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-primary-dark"
        >
          {t('suggestedQ1')}
        </button>
        <button
          onClick={() => send(t('suggestedQ2'))}
          className="whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-primary-dark"
        >
          {t('suggestedQ2')}
        </button>
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-line bg-background pt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder={t('copilotPlaceholder')}
          className="flex-1 rounded-full border border-line bg-white px-4 py-3 text-sm"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white disabled:opacity-50"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
