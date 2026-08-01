import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, QueryCommand } from '../utils/db.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

// POST /daily-logs
export const create = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const body = JSON.parse(event.body || '{}');
    const { householdId, elderId, date, meals, medication, sleep, mobility, breathing, weight, mood, excretion, temperature, notes } = body;

    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const logId = generateId();
    const now = new Date().toISOString();

    const item = {
      householdId,
      logId,
      elderId: elderId || 'unknown',
      date: date || new Date().toISOString().split('T')[0],
      createdByRole: 'caregiver',
      meals: meals || { percentage: 0, notes: '' },
      medication: medication || { taken: false, notes: '' },
      sleep: sleep || { hours: 0, quality: 'unknown' },
      mobility: mobility || 'unknown',
      breathing: breathing || 'unknown',
      weight: weight || undefined,
      mood: mood || undefined,
      excretion: excretion || undefined,
      temperature: temperature || undefined,
      notes: notes || '',
      aiAlertTriggered: false,
      createdAt: now,
    };

    // Simple AI monitoring: check for combination of abnormals
    const abnormalCount = [
      meals?.percentage < 30,
      medication?.taken === false,
      sleep?.hours < 4,
      ['需攙扶', '無法行走', 'unstable'].includes(mobility),
      ['偏急促', '明顯困難', 'fast', 'difficult'].includes(breathing),
    ].filter(Boolean).length;

    if (abnormalCount >= 2) {
      item.aiAlertTriggered = true;
    }

    await db.send(new PutCommand({ TableName: config.dailyLogsTable, Item: item }));

    console.log('[DailyLog:create]', { requestId, logId, aiAlertTriggered: item.aiAlertTriggered });
    return success({ data: item, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /households/{householdId}/daily-logs
export const list = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const result = await db.send(new QueryCommand({
      TableName: config.dailyLogsTable,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      ScanIndexForward: false,
      Limit: 30,
    }));

    return success({ data: result.Items || [], requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
