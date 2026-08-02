import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, UpdateCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';
import type { SymptomStatus, Language } from '@carebridge/shared-types';

/** Shape Bedrock is asked to return, before we normalise it for storage */
interface RawExtractionResult {
  originalLanguage: string;
  translatedTextZhTW: string;
  symptoms: Array<{
    code: string;
    labels?: Partial<Record<Language, string>>;
    /** Older prompt versions returned a single label */
    label?: string;
    status: SymptomStatus;
    evidence?: string;
  }>;
  uncertainties: string[];
}

const SYSTEM_PROMPT = `You are a medical information extraction assistant for CareBridge AI, a care coordination platform.

Your task is to extract structured symptom data from caregiver descriptions. You must:
1. Detect the original language of the input.
2. Translate the input to Traditional Chinese (zh-TW).
3. Extract each observable symptom with a code, a label in EVERY supported
   language (zh-TW, en, id, vi), status (present/absent/unknown), and evidence.
4. List any uncertainties where the text is ambiguous.

Rules:
- Do NOT diagnose any disease.
- Do NOT infer symptoms not mentioned or clearly implied.
- Mark ambiguous items as "unknown", never assume "absent".
- "code" must be a stable lowercase snake_case identifier (e.g. appetite_loss,
  rapid_breathing, unsteady_gait) — never a translated phrase.
- "labels" must contain the same symptom name in all four languages.
- Do NOT use markdown formatting.
- Output ONLY valid JSON matching the schema below.

Output JSON schema:
{
  "originalLanguage": "string (one of: zh-TW, en, id, vi)",
  "translatedTextZhTW": "string",
  "symptoms": [
    {
      "code": "string (stable snake_case identifier)",
      "labels": {"zh-TW": "string", "en": "string", "id": "string", "vi": "string"},
      "status": "present|absent|unknown",
      "evidence": "string (quoted from the original text)"
    }
  ],
  "uncertainties": ["string"]
}`;

// POST /incidents/{incidentId}/extract
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  const startTime = Date.now();

  try {
    const incidentId = event.pathParameters?.incidentId;
    const body = JSON.parse(event.body || '{}');
    const { householdId } = body;

    if (!incidentId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'incidentId and householdId required', requestId });
    }

    // Get incident
    const incident = await db.send(new GetCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
    }));

    if (!incident.Item) {
      return error({ code: 'NOT_FOUND', message: 'Incident not found', requestId, statusCode: 404 });
    }

    const originalText = incident.Item.originalText;
    if (!originalText) {
      return error({ code: 'INVALID_STATE', message: 'Incident has no original text', requestId });
    }

    // Call Bedrock
    const extraction = await converseJson<RawExtractionResult>({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Extract symptoms from this caregiver input:\n\n"${originalText}"`,
      maxTokens: 2000,
    });

    // Persist `label` alongside `labels` so consumers written against the
    // single-language shape (rule engine, older records) keep working.
    const symptoms = (extraction.symptoms || []).map(s => ({
      code: s.code,
      labels: s.labels ?? {},
      label: s.labels?.['zh-TW'] ?? s.label ?? s.code,
      status: s.status,
      evidence: s.evidence ?? '',
    }));

    await db.send(new UpdateCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
      UpdateExpression: 'SET extractedSymptoms = :symptoms, translatedText = :translated, originalLanguage = :lang, updatedAt = :now',
      ExpressionAttributeValues: {
        ':symptoms': symptoms,
        ':translated': extraction.translatedTextZhTW,
        ':lang': extraction.originalLanguage,
        ':now': new Date().toISOString(),
      },
    }));

    const duration = Date.now() - startTime;
    console.log('[Extract]', { requestId, incidentId, symptomsCount: symptoms.length, duration });

    return success({ data: { ...extraction, symptoms }, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
