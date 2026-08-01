import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, PutCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

const NOTIFY_SYSTEM_PROMPT = `You are a notification writer for CareBridge AI. Generate a concise notification summary in Traditional Chinese (zh-TW) for family members and care contacts.

Rules:
- Base the summary ONLY on confirmed facts.
- Clearly mark unconfirmed information.
- Do NOT use diagnostic language.
- Do NOT exaggerate or downplay risk.
- Keep it short and suitable for mobile reading.
- Include: symptoms observed, risk level, recommended next steps.
- Be consistent with the rule engine assessment result.

Output JSON schema:
{
  "title": "string (short title for notification)",
  "originalSummary": "string (summary in caregiver's language)",
  "translatedSummary": "string (summary in zh-TW)"
}`;

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
      title: string;
      originalSummary: string;
      translatedSummary: string;
    }>({
      systemPrompt: NOTIFY_SYSTEM_PROMPT,
      userMessage: context,
      maxTokens: 800,
    });

    // Save notification
    const notificationId = generateId();
    const now = new Date().toISOString();

    const notification = {
      householdId,
      notificationId,
      incidentId,
      recipientRole: 'contact',
      title: notifyContent.title,
      originalSummary: notifyContent.originalSummary,
      translatedSummary: notifyContent.translatedSummary,
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
