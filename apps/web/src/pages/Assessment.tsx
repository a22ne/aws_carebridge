import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useAppState } from '@/hooks/useAppState';
import * as api from '@/services/api';
import type { AssessmentResult } from '@carebridge/shared-types';

interface QuestionData {
  questionId: string | null;
  textByLanguage: Record<string, string>;
  options: string[];
  isComplete?: boolean;
}

export default function Assessment() {
  const { t, lang } = useI18n();
  const { householdId } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  const incidentId = (location.state as any)?.incidentId;
  const hhId = (location.state as any)?.householdId || householdId;

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Fetch first question on mount
  useEffect(() => {
    if (!incidentId || !hhId) return;
    fetchNextQuestion(null, null);
  }, [incidentId, hhId]);

  const fetchNextQuestion = async (questionId: string | null, answer: string | null) => {
    setLoading(true);
    setError('');

    const res = await api.submitAnswer(
      incidentId,
      hhId,
      questionId || '',
      answer || ''
    );

    if (res.success && res.data) {
      const q = res.data as unknown as QuestionData;
      if (q.isComplete) {
        // All questions answered — run assessment
        await runAssessment();
      } else {
        setCurrentQuestion(q);
        setProgress(Math.min(95, (answers.length + 1) * 20));
      }
    } else {
      setError(res.error?.message || t('error'));
    }
    setLoading(false);
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion?.questionId) return;
    const qId = currentQuestion.questionId;
    setAnswers(prev => [...prev, { q: qId, a: answer }]);
    fetchNextQuestion(qId, answer);
  };

  const runAssessment = async () => {
    setLoading(true);
    const res = await api.assessIncident(incidentId, hhId);
    if (res.success && res.data) {
      setResult(res.data as unknown as AssessmentResult);
      setProgress(100);
    } else {
      setError(res.error?.message || t('error'));
    }
    setLoading(false);
  };

  const langKey = lang === 'zh-TW' ? 'zh-TW' : lang;

  // Result view
  if (result) {
    const riskColors: Record<string, string> = {
      emergency: 'border-red-300 bg-gradient-to-br from-red-50 to-white',
      urgent: 'border-orange-300 bg-gradient-to-br from-orange-50 to-white',
      attention: 'border-[#F1DDB9] bg-gradient-to-br from-[#FFF6E6] to-white',
      monitor: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <strong>{t('assessmentTitle')}</strong>
          <span className="text-xs text-muted">完成</span>
        </div>

        {/* Risk Card */}
        <div className={`card p-4 ${riskColors[result.riskLevel] || ''}`}>
          <h3 className="text-lg font-bold capitalize">{result.riskLevel}</h3>
          <div className="mt-2 space-y-2 text-xs">
            {result.confirmedFacts.length > 0 && (
              <div>
                <strong className="text-muted">已確認：</strong>
                <span>{result.confirmedFacts.join('、')}</span>
              </div>
            )}
            {result.missingInformation.length > 0 && (
              <div>
                <strong className="text-muted">尚未確認：</strong>
                <span>{result.missingInformation.join('、')}</span>
              </div>
            )}
            {result.escalationWarnings.length > 0 && (
              <div className="font-bold text-red-600">
                ⚠ {result.escalationWarnings.join('、')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 text-xs">
          <strong>建議行動：</strong>
          <ul className="list-inside list-disc text-muted">
            {result.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-[#F1DFBC] bg-[#FFF9ED] p-3 text-xs text-[#805E29]">
          {result.disclaimer}
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/notify', { state: { incidentId, householdId: hhId } })}
            className="btn-primary text-sm"
          >
            {t('sendNotify')}
          </button>
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">
            {t('backHome')}
          </button>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <strong>{t('assessmentTitle')}</strong>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#E6EDF0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat history */}
      <div className="space-y-3">
        {answers.map((a, i) => (
          <div key={i} className="space-y-2">
            <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-line bg-white p-3 text-[13px] shadow-sm">
              {a.q}
            </div>
            <div className="ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-primary p-3 text-[13px] text-white">
              {a.a === 'yes' ? t('yes') : a.a === 'no' ? t('no') : t('unknown')}
            </div>
          </div>
        ))}

        {/* Current question */}
        {currentQuestion && !loading && (
          <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-line bg-white p-3 text-[13px] shadow-sm">
            {currentQuestion.textByLanguage[langKey] || currentQuestion.textByLanguage['zh-TW'] || currentQuestion.textByLanguage['en'] || ''}
          </div>
        )}

        {loading && (
          <div className="max-w-[84%] animate-pulse rounded-2xl rounded-bl-md border border-line bg-white p-3 text-[13px] text-muted">
            {t('loading')}
          </div>
        )}
      </div>

      {/* Answer buttons */}
      {currentQuestion && !loading && (
        <div className="flex flex-wrap gap-2">
          {(currentQuestion.options.length > 0 ? currentQuestion.options : ['yes', 'no', 'unknown']).map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-primary-dark transition-colors hover:bg-[#EEF6F7]"
            >
              {opt === 'yes' ? t('yes') : opt === 'no' ? t('no') : opt === 'unknown' ? t('unknown') : opt}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={() => fetchNextQuestion(null, null)} className="ml-2 font-bold">{t('retry')}</button>
        </div>
      )}

      <p className="text-center text-xs text-muted">{t('disclaimer')}</p>
    </div>
  );
}
