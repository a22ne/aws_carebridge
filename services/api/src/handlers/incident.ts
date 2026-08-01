import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '../utils/db.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

// POST /incidents
export const create = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const body = JSON.parse(event.body || '{}');
    const { householdId, elderId, originalText, originalLanguage } = body;

    if (!householdId || !originalText?.trim()) {
      return error({ code: 'INVALID_INPUT', message: 'householdId and originalText are required', requestId });
    }

    const incidentId = generateId();
    const now = new Date().toISOString();

    const item = {
      householdId,
      incidentId,
      elderId: elderId || 'unknown',
      createdByRole: 'caregiver',
      originalLanguage: originalLanguage || 'unknown',
      originalText: originalText.trim(),
      translatedText: null,
      extractedSymptoms: [],
      answers: [],
      riskLevel: null,
      triggeredRules: [],
      missingInformation: [],
      recommendedActions: [],
      sourceIds: [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await db.send(new PutCommand({ TableName: config.incidentsTable, Item: item }));

    console.log('[Incident:create]', { requestId, incidentId, householdId });
    return success({ data: item, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /incidents/{incidentId}
export const get = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const incidentId = event.pathParameters?.incidentId;
    const householdId = event.queryStringParameters?.householdId;

    if (!incidentId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'incidentId and householdId are required', requestId });
    }

    const result = await db.send(new GetCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
    }));

    if (!result.Item) {
      return error({ code: 'NOT_FOUND', message: 'Incident not found', requestId, statusCode: 404 });
    }

    return success({ data: result.Item, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /households/{householdId}/incidents
export const list = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const result = await db.send(new QueryCommand({
      TableName: config.incidentsTable,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      ScanIndexForward: false, // newest first
    }));

    return success({ data: result.Items || [], requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// PATCH /incidents/{incidentId}/status
export const updateStatus = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const incidentId = event.pathParameters?.incidentId;
    const body = JSON.parse(event.body || '{}');
    const { householdId, status } = body;

    const validStatuses = ['pending', 'read', 'contacted', 'scheduled', 'resolved'];
    if (!incidentId || !householdId || !validStatuses.includes(status)) {
      return error({ code: 'INVALID_INPUT', message: 'Valid incidentId, householdId, and status required', requestId });
    }

    const result = await db.send(new UpdateCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
      UpdateExpression: 'SET #s = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': status, ':now': new Date().toISOString() },
      ReturnValues: 'ALL_NEW',
    }));

    console.log('[Incident:updateStatus]', { requestId, incidentId, status });
    return success({ data: result.Attributes, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
