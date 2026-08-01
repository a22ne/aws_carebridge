import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, QueryCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'id', 'vi'] as const;

const TRANSLATE_SYSTEM_PROMPT = `You are a translation service for a caregiving app used by families and foreign caregivers.

Translate the user's message into every requested target language.

Rules:
- Preserve the original meaning exactly. Do not add advice or commentary.
- Keep the tone natural and conversational.
- Do NOT use markdown formatting.
- Names, numbers, and medication names must stay unchanged.
- Output ONLY valid JSON matching the schema.

Output JSON schema:
{
  "translations": {
    "zh-TW": "string",
    "en": "string",
    "id": "string",
    "vi": "string"
  }
}`;

// POST /households/{householdId}/chat
export const send = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  const startTime = Date.now();

  try {
    const householdId = event.pathParameters?.householdId;
    const body = JSON.parse(event.body || '{}');
    const { senderRole, senderName, originalText, originalLanguage } = body;

    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }
    if (!originalText?.trim()) {
      return error({ code: 'INVALID_INPUT', message: 'originalText is required', requestId });
    }
    if (senderRole !== 'caregiver' && senderRole !== 'contact') {
      return error({ code: 'INVALID_INPUT', message: 'senderRole must be caregiver or contact', requestId });
    }

    const sourceLanguage = SUPPORTED_LANGUAGES.includes(originalLanguage)
      ? originalLanguage
      : 'zh-TW';

    const text = originalText.trim();
    const targets = SUPPORTED_LANGUAGES.filter(l => l !== sourceLanguage);

    // Translate for the other party. Message is still saved if translation fails.
    let translations: Record<string, string> = { [sourceLanguage]: text };
    try {
      const result = await converseJson<{ translations: Record<string, string> }>({
        systemPrompt: TRANSLATE_SYSTEM_PROMPT,
        userMessage: `Source language: ${sourceLanguage}\nTarget languages: ${targets.join(', ')}\n\nMessage:\n"${text}"`,
        maxTokens: 800,
      });
      translations = { ...result.translations, [sourceLanguage]: text };
    } catch (translateErr) {
      console.warn('[Chat:send] translation failed, saving original only', {
        requestId,
        message: translateErr instanceof Error ? translateErr.message : translateErr,
      });
    }

    const messageId = generateId();
    const item = {
      householdId,
      messageId,
      senderRole,
      senderName: senderName || '',
      originalText: text,
      originalLanguage: sourceLanguage,
      translations,
      createdAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({ TableName: config.chatMessagesTable, Item: item }));

    console.log('[Chat:send]', {
      requestId,
      householdId,
      messageId,
      senderRole,
      duration: Date.now() - startTime,
    });
    return success({ data: item, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /households/{householdId}/chat
export const list = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const limitParam = Number(event.queryStringParameters?.limit);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;

    const result = await db.send(new QueryCommand({
      TableName: config.chatMessagesTable,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      // ULID sort keys are chronological — ascending keeps chat order natural
      ScanIndexForward: true,
      Limit: limit,
    }));

    return success({ data: result.Items || [], requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
