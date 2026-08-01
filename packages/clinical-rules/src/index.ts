import type { RiskLevel, ExtractedSymptom, SymptomStatus } from '@carebridge/shared-types';
import rules from './clinical-rules.json';

export interface ClinicalRule {
  ruleId: string;
  title: string;
  version: string;
  conditions: RuleCondition[];
  riskLevel: RiskLevel;
  actionCode: string;
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  reviewedAt: string;
  status: 'active' | 'draft';
}

export interface RuleCondition {
  symptomCode: string;
  operator: 'equals' | 'includes' | 'greaterThan';
  value: string | number | boolean;
  unknownBehavior: 'skip' | 'conservative';
}

export interface RuleEvaluationResult {
  riskLevel: RiskLevel;
  triggeredRules: ClinicalRule[];
  allEvaluated: ClinicalRule[];
}

const RISK_PRECEDENCE: Record<RiskLevel, number> = {
  emergency: 4,
  urgent: 3,
  attention: 2,
  monitor: 1,
};

/**
 * Evaluate clinical rules against confirmed symptoms.
 * Returns the highest risk level and all triggered rules.
 */
export function evaluateRules(
  symptoms: ExtractedSymptom[],
  answers: Record<string, SymptomStatus>
): RuleEvaluationResult {
  const activeRules = (rules as ClinicalRule[]).filter(r => r.status === 'active');
  const triggered: ClinicalRule[] = [];

  for (const rule of activeRules) {
    if (isRuleTriggered(rule, symptoms, answers)) {
      triggered.push(rule);
    }
  }

  const highestRisk: RiskLevel = triggered.reduce<RiskLevel>((max, rule) => {
    return RISK_PRECEDENCE[rule.riskLevel] > RISK_PRECEDENCE[max]
      ? rule.riskLevel
      : max;
  }, 'monitor');

  return {
    riskLevel: highestRisk,
    triggeredRules: triggered,
    allEvaluated: activeRules,
  };
}

function isRuleTriggered(
  rule: ClinicalRule,
  symptoms: ExtractedSymptom[],
  answers: Record<string, SymptomStatus>
): boolean {
  return rule.conditions.every(condition => {
    const symptom = symptoms.find(s => s.code === condition.symptomCode);
    const answerStatus = answers[condition.symptomCode];
    const status: SymptomStatus = answerStatus || symptom?.status || 'unknown';

    if (status === 'unknown') {
      // Conservative: unknown does NOT prevent triggering for emergency rules
      return condition.unknownBehavior === 'conservative';
    }

    if (condition.operator === 'equals') {
      return status === condition.value;
    }

    return status === 'present';
  });
}

export { rules as clinicalRulesData };
