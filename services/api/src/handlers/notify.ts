import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, PutCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

const NOTIFY_SYSTEM_PROMPT = `You are a notification writer for CareBridge AI, used by families and foreign caregivers.

Rules:
- Base the summary ONLY on confirmed facts.
- Clearly mark unconfirmed information.
- Do NOT use diagnostic language.
- Do NOT exaggerate or downplay risk.
- Do NOT use markdown formatting.
- Keep it short and suitable for mobile reading.
- Include: symptoms observed, risk level, recommended next steps.
- Be consistent with the rule engine assessment result.
- Produce the summary in EVERY requested language. Preserve identical meaning
  across languages; do not add or omit information in any version.

Output JSON schema (one entry per requested language code):
{
  "title": {"zh-TW": "string", "en": "string", "id": "string", "vi": "string"},
  "summary": {"zh-TW": "string", "en": "string", "id": "string", "vi": "string"}
}`;

const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'id', 'vi'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// POST /incidents/{incidentId}/notify
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const incidentId = event.pathParameters?.incidentId;
    const body = JSON.parse(event.body || '{}');
    const { householdId } = body;

    if (!incidentId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'incidentId and householdId required', requestId });
    }

    // Get incident with assessment results
    const incident = await db.send(new GetCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
    }));

    if (!incident.Item) {
      return error({ code: 'NOT_FOUND', message: 'Incident not found', requestId, statusCode: 404 });
    }

    const item = incident.Item;
    if (!item.riskLevel) {
      return error({ code: 'INVALID_STATE', message: 'Assessment must be completed before notification', requestId });
    }

    const sourceLanguage: SupportedLanguage =
      SUPPORTED_LANGUAGES.includes(item.originalLanguage)
        ? item.originalLanguage
        : 'zh-TW';

    // Generate notification text via Bedrock
    const context = `
Incident details:
- Original text: ${item.originalText}
- Translated text: ${item.translatedText || 'N/A'}
- Extracted symptoms: ${JSON.stringify(item.extractedSymptoms)}
- Risk level: ${item.riskLevel}
- Triggered rules: ${JSON.stringify(item.triggeredRules)}
- Recommended actions: ${JSON.stringify(item.recommendedActions)}
- Missing information: ${JSON.stringify(item.missingInformation)}
`;

    const notifyContent = await converseJson<{
      title: Partial<Record<SupportedLanguage, string>>;
      summary: Partial<Record<SupportedLanguage, string>>;
    }>({
      systemPrompt: NOTIFY_SYSTEM_PROMPT,
      userMessage: `Requested languages: ${SUPPORTED_LANGUAGES.join(', ')}\nCaregiver's language: ${sourceLanguage}\n${context}`,
      maxTokens: 1500,
    });

    const titles = notifyContent.title || {};
    const summaries = notifyContent.summary || {};

    // Save notification
    const notificationId = generateId();
    const now = new Date().toISOString();

    const notification = {
      householdId,
      notificationId,
      incidentId,
      recipientRole: 'contact',
      // Per-language maps drive the UI; the flat fields below stay for
      // backward compatibility with notifications created before this change.
      titles,
      summaries,
      title: titles['zh-TW'] || titles[sourceLanguage] || '',
      originalSummary: summaries[sourceLanguage] || summaries['zh-TW'] || '',
      translatedSummary: summaries['zh-TW'] || '',
      readAt: null,
      responseStatus: 'pending',
      createdAt: now,
    };

    await db.send(new PutCommand({ TableName: config.notificationsTable, Item: notification }));

    console.log('[Notify]', { requestId, incidentId, notificationId });
    return success({ data: notification, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};
