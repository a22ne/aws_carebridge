import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';

interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  content: string;
  translatedContent?: string;
  timestamp: string;
}

export default function Chat() {
  const { t } = useI18n();
  const { role } = useAppState();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'chat' | 'guidelines'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [guidelinesInput, setGuidelinesInput] = useState('');

  // Load saved guidelines
  useEffect(() => {
    const saved = localStorage.getItem('carebridge-guidelines');
    if (saved) setGuidelines(saved);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, msg]);
    setInput('');

    // TODO: Send to backend for translation + real-time sync
    // For now simulate a translated echo
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'other',
        content: `[${t('translated')}] ${input.trim()}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  const saveGuidelines = () => {
    localStorage.setItem('carebridge-guidelines', guidelinesInput);
    setGuidelines(guidelinesInput);
    setEditingGuidelines(false);
  };

  const handleCall = () => {
    const phone = localStorage.getItem('carebridge-user-phone');
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

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
            className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-2.5 text-sm font-bold text-primary-dark"
          >
            📞 {t('callContact')}
          </button>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-auto pb-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t('chatEmpty')}
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                  msg.sender === 'me'
                    ? 'ml-auto rounded-br-md bg-primary text-white'
                    : 'rounded-bl-md border border-line bg-white'
                }`}
              >
                {msg.content}
                <span className="mt-1 block text-[10px] opacity-60">{msg.timestamp}</span>
              </div>
            ))}
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
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
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
                  onClick={() => { setGuidelinesInput(guidelines); setEditingGuidelines(true); }}
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
                  <button onClick={saveGuidelines} className="btn-primary flex-1 text-sm">
                    {t('save')}
                  </button>
                  <button onClick={() => setEditingGuidelines(false)} className="btn-ghost flex-1 text-sm">
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
