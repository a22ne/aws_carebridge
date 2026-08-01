import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Copilot() {
  const { t, lang } = useI18n();
  const { householdId, elderId } = useAppState();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('copilotHello') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
      language: lang === 'zh-TW' ? 'zh-TW' : lang,
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
        setMessages(prev => [...prev, { role: 'assistant', content: '無法建立對話，請重試。' }]);
        setLoading(false);
        return;
      }

      const res = await api.sendCopilotMessage(convId, householdId, text.trim());

      if (res.success && res.data) {
        // Strip markdown formatting from AI response
        const rawResponse = (res.data as any).response || '抱歉，無法取得回覆。';
        const cleanResponse = rawResponse
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s/gm, '')
          .replace(/^-\s/gm, '• ');
        const reply: Message = {
          role: 'assistant',
          content: cleanResponse,
        };
        setMessages(prev => [...prev, reply]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.error?.retryable
            ? '暫時無法回覆，請稍後重試。'
            : (res.error?.message || '發生錯誤'),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '連線失敗，請檢查網路。' }]);
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
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[84%] animate-pulse rounded-2xl rounded-bl-md border border-line bg-white p-3 text-[13px] text-muted">
            思考中...
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
