import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, UpdateCommand } from '../utils/db.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';
import type { RiskLevel, SymptomStatus, AssessmentResult } from '@carebridge/shared-types';

// Inline rule engine (imported logic from clinical-rules package concept)
interface ClinicalRule {
  ruleId: string;
  title: string;
  conditions: { symptomCode: string; operator: string; value: string; unknownBehavior: string }[];
  riskLevel: RiskLevel;
  actionCode: string;
  sourceTitle: string;
  sourceUrl: string;
  status: string;
}

// Import rules from local copy (source of truth: packages/clinical-rules/src/clinical-rules.json)
import clinicalRules from '../rules/clinical-rules.json';

const RISK_PRECEDENCE: Record<RiskLevel, number> = { emergency: 4, urgent: 3, attention: 2, monitor: 1 };

function evaluateRules(symptoms: any[], answers: any[]): { riskLevel: RiskLevel; triggered: ClinicalRule[] } {
  const activeRules = (clinicalRules as ClinicalRule[]).filter(r => r.status === 'active');

  // Build symptom status map from extracted symptoms + answers
  const statusMap: Record<string, SymptomStatus> = {};
  for (const s of symptoms) {
    statusMap[s.code] = s.status;
  }
  for (const a of answers) {
    // Map answer to symptom status
    if (a.answer === 'yes') statusMap[a.questionId] = 'present';
    else if (a.answer === 'no') statusMap[a.questionId] = 'absent';
    else statusMap[a.questionId] = 'unknown';
  }

  const triggered: ClinicalRule[] = [];

  for (const rule of activeRules) {
    const matches = rule.conditions.every(cond => {
      const status = statusMap[cond.symptomCode] || 'unknown';
      if (status === 'unknown') {
        return cond.unknownBehavior === 'conservative';
      }
      return status === 'present';
    });
    if (matches) triggered.push(rule);
  }

  const riskLevel: RiskLevel = triggered.reduce<RiskLevel>((max, rule) => {
    return RISK_PRECEDENCE[rule.riskLevel] > RISK_PRECEDENCE[max] ? rule.riskLevel : max;
  }, 'monitor');

  return { riskLevel, triggered };
}

// POST /incidents/{incidentId}/assess
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const incidentId = event.pathParameters?.incidentId;
    const body = JSON.parse(event.body || '{}');
    const { householdId } = body;

    if (!incidentId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'incidentId and householdId required', requestId });
    }

    const incident = await db.send(new GetCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
    }));

    if (!incident.Item) {
      return error({ code: 'NOT_FOUND', message: 'Incident not found', requestId, statusCode: 404 });
    }

    const symptoms = incident.Item.extractedSymptoms || [];
    const answers = incident.Item.answers || [];

    // Run deterministic rule engine (Layer 1 — cannot be overridden by AI)
    const { riskLevel, triggered } = evaluateRules(symptoms, answers);

    // Symptom names come from Bedrock in all four languages. Emit per-language
    // maps so the UI can render in the reader's language, and keep the flat
    // arrays for backward compatibility with existing clients/records.
    const LANGS = ['zh-TW', 'en', 'id', 'vi'] as const;

    const labelIn = (s: any, lang: string): string =>
      s.labels?.[lang] ?? s.labels?.['zh-TW'] ?? s.label ?? s.code;

    const present = symptoms.filter((s: any) => s.status === 'present');
    const unknownSymptoms = symptoms.filter((s: any) => s.status === 'unknown');

    const buildMap = (list: any[]) =>
      LANGS.reduce<Record<string, string[]>>((acc, lang) => {
        acc[lang] = list.map(s => labelIn(s, lang));
        return acc;
      }, {});

    const confirmedFactsByLanguage = buildMap(present);
    const missingInformationByLanguage = buildMap(unknownSymptoms);

    const confirmedFacts = confirmedFactsByLanguage['zh-TW'];
    const missingInformation = missingInformationByLanguage['zh-TW'];

    const recommendedActions = triggered.map(r => r.actionCode);
    const sourceIds = triggered.map(r => r.ruleId);
    const escalationWarnings = triggered
      .filter(r => r.riskLevel === 'emergency')
      .map(r => r.title);

    const result: AssessmentResult & {
      confirmedFactsByLanguage: Record<string, string[]>;
      missingInformationByLanguage: Record<string, string[]>;
    } = {
      riskLevel,
      triggeredRules: triggered.map(r => r.ruleId),
      confirmedFacts,
      missingInformation,
      confirmedFactsByLanguage,
      missingInformationByLanguage,
      recommendedActions: [...new Set(recommendedActions)],
      // Chinese titles from the rule file. The UI prefers translating from
      // sourceIds and only falls back to these.
      escalationWarnings,
      sourceIds,
      // Localised in the UI via the `disclaimer` i18n key; kept here so API
      // consumers always receive the required non-diagnosis statement.
      disclaimer: 'CareBridge AI 不是醫療診斷工具。如出現急性惡化或生命危險，請立即聯絡當地緊急服務或醫療專業人員。',
    };

    // Update incident with assessment result
    await db.send(new UpdateCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
      UpdateExpression: 'SET riskLevel = :risk, triggeredRules = :rules, missingInformation = :missing, missingInformationByLanguage = :missingByLang, confirmedFactsByLanguage = :confirmedByLang, recommendedActions = :actions, sourceIds = :sources, updatedAt = :now',
      ExpressionAttributeValues: {
        ':risk': riskLevel,
        ':rules': sourceIds,
        ':missing': missingInformation,
        ':missingByLang': missingInformationByLanguage,
        ':confirmedByLang': confirmedFactsByLanguage,
        ':actions': result.recommendedActions,
        ':sources': sourceIds,
        ':now': new Date().toISOString(),
      },
    }));

    console.log('[Assess]', { requestId, incidentId, riskLevel, triggeredCount: triggered.length });
    return success({ data: result, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
