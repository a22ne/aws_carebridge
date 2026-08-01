import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '../utils/db.js';
import { converse } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

const COPILOT_SYSTEM_PROMPT = `You are CareBridge AI Care Copilot, a context-aware care guidance assistant for caregivers of elderly individuals.

Your role:
- Help caregivers understand what to observe and when to escalate.
- Provide care guidance in the caregiver's language.
- Help organize situations and prepare notifications.
- Suggest next steps based on common care practices.

Rules you MUST follow:
- NEVER provide medical diagnosis.
- NEVER recommend starting, stopping, or changing medications.
- NEVER claim to replace emergency services or medical professionals.
- If information is insufficient, say so clearly instead of guessing.
- Always recommend contacting medical professionals for serious concerns.
- NEVER use markdown formatting (no **, *, #, or bullet symbols). Use plain text only.
- Keep responses SHORT: maximum 3-4 sentences.
- Address only ONE concern at a time. Do not list multiple topics.
- If asked about something outside care guidance, politely redirect.

End every response with the reminder that you are not a diagnostic tool when discussing health concerns.`;

// POST /copilot/conversations
export const createConversation = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const body = JSON.parse(event.body || '{}');
    const { householdId, elderId, language, context: ctx } = body;

    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const conversationId = generateId();
    const now = new Date().toISOString();

    const item = {
      householdId,
      conversationId,
      elderId: elderId || 'unknown',
      startedByRole: 'caregiver',
      language: language || 'zh-TW',
      context: ctx || 'standalone',
      relatedIncidentId: null,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.send(new PutCommand({ TableName: config.conversationsTable, Item: item }));

    console.log('[Copilot:create]', { requestId, conversationId });
    return success({ data: item, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// POST /copilot/conversations/{conversationId}/messages
export const sendMessage = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  const startTime = Date.now();

  try {
    const conversationId = event.pathParameters?.conversationId;
    const body = JSON.parse(event.body || '{}');
    const { householdId, content } = body;

    if (!conversationId || !householdId || !content?.trim()) {
      return error({ code: 'INVALID_INPUT', message: 'conversationId, householdId, and content required', requestId });
    }

    // Get conversation
    const conv = await db.send(new GetCommand({
      TableName: config.conversationsTable,
      Key: { householdId, conversationId },
    }));

    if (!conv.Item) {
      return error({ code: 'NOT_FOUND', message: 'Conversation not found', requestId, statusCode: 404 });
    }

    const messages = conv.Item.messages || [];
    const now = new Date().toISOString();

    // Add user message
    messages.push({ role: 'user', content: content.trim(), translatedContent: null, timestamp: now });

    // Build conversation context for Bedrock
    const historyContext = messages
      .slice(-10) // Last 10 messages for context window
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    // Call Bedrock with guardrail
    const response = await converse({
      systemPrompt: COPILOT_SYSTEM_PROMPT,
      userMessage: `Conversation history:\n${historyContext}\n\nUser's latest message: ${content.trim()}\n\nRespond in the user's language. Keep it concise and actionable.`,
      maxTokens: 1024,
      useGuardrail: true,
    });

    // Check if response was blocked by guardrail
    let responseContent: string;
    let blocked = false;
    try {
      const parsed = JSON.parse(response);
      if (parsed.blocked) {
        responseContent = parsed.message;
        blocked = true;
      } else {
        responseContent = response;
      }
    } catch {
      responseContent = response;
    }

    // Add assistant message
    messages.push({ role: 'assistant', content: responseContent, translatedContent: null, timestamp: new Date().toISOString() });

    // Update conversation
    await db.send(new UpdateCommand({
      TableName: config.conversationsTable,
      Key: { householdId, conversationId },
      UpdateExpression: 'SET messages = :msgs, updatedAt = :now',
      ExpressionAttributeValues: { ':msgs': messages, ':now': new Date().toISOString() },
    }));

    const duration = Date.now() - startTime;
    console.log('[Copilot:message]', { requestId, conversationId, blocked, duration });

    return success({
      data: {
        response: responseContent,
        translatedResponse: null,
        suggestedFollowUps: [],
      },
      requestId,
    });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /copilot/conversations/{conversationId}
export const getConversation = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const conversationId = event.pathParameters?.conversationId;
    const householdId = event.queryStringParameters?.householdId;

    if (!conversationId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'conversationId and householdId required', requestId });
    }

    const result = await db.send(new GetCommand({
      TableName: config.conversationsTable,
      Key: { householdId, conversationId },
    }));

    if (!result.Item) {
      return error({ code: 'NOT_FOUND', message: 'Conversation not found', requestId, statusCode: 404 });
    }

    return success({ data: result.Item, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /households/{householdId}/conversations
export const listConversations = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId required', requestId });
    }

    const result = await db.send(new QueryCommand({
      TableName: config.conversationsTable,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      ScanIndexForward: false,
    }));

    return success({ data: result.Items || [], requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
