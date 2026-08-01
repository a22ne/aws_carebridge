import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, UpdateCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';
import type { SymptomExtractionResult } from '@carebridge/shared-types';

const SYSTEM_PROMPT = `You are a medical information extraction assistant for CareBridge AI, a care coordination platform.

Your task is to extract structured symptom data from caregiver descriptions. You must:
1. Detect the original language of the input.
2. Translate the input to Traditional Chinese (zh-TW).
3. Extract each observable symptom with a code, label, status (present/absent/unknown), and evidence from the text.
4. List any uncertainties where the text is ambiguous.

Rules:
- Do NOT diagnose any disease.
- Do NOT infer symptoms not mentioned or clearly implied.
- Mark ambiguous items as "unknown", never assume "absent".
- Output ONLY valid JSON matching the schema below.

Output JSON schema:
{
  "originalLanguage": "string (ISO 639-1 code)",
  "translatedTextZhTW": "string",
  "symptoms": [
    { "code": "string", "label": "string", "status": "present|absent|unknown", "evidence": "string" }
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
    const extraction = await converseJson<SymptomExtractionResult>({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Extract symptoms from this caregiver input:\n\n"${originalText}"`,
      maxTokens: 1500,
    });

    // Update incident with extraction results
    await db.send(new UpdateCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
      UpdateExpression: 'SET extractedSymptoms = :symptoms, translatedText = :translated, originalLanguage = :lang, updatedAt = :now',
      ExpressionAttributeValues: {
        ':symptoms': extraction.symptoms,
        ':translated': extraction.translatedTextZhTW,
        ':lang': extraction.originalLanguage,
        ':now': new Date().toISOString(),
      },
    }));

    const duration = Date.now() - startTime;
    console.log('[Extract]', { requestId, incidentId, symptomsCount: extraction.symptoms.length, duration });

    return success({ data: extraction, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
