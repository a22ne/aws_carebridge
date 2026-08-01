import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '../utils/db.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId, generateJoinCode } from '../utils/id.js';

// POST /households
export const create = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const body = JSON.parse(event.body || '{}');
    const { elderProfile } = body;

    if (!elderProfile?.displayName || !elderProfile?.age) {
      return error({ code: 'INVALID_INPUT', message: 'elderProfile.displayName and age are required', requestId });
    }

    const householdId = generateId();
    const joinCode = generateJoinCode();
    const now = new Date().toISOString();

    const item = {
      householdId,
      joinCode,
      elderProfile: {
        elderId: generateId(),
        displayName: elderProfile.displayName,
        age: Number(elderProfile.age),
        birthday: elderProfile.birthday || '',
        city: elderProfile.city || '',
        gender: elderProfile.gender || '',
        chronicConditions: elderProfile.chronicConditions || [],
        otherConditions: elderProfile.otherConditions || '',
        medications: elderProfile.medications || [],
        allergies: elderProfile.allergies || [],
        baselineMobility: elderProfile.baselineMobility || 'unknown',
        baselineCognition: elderProfile.baselineCognition || 'unknown',
      },
      createdAt: now,
      updatedAt: now,
    };

    await db.send(new PutCommand({ TableName: config.householdsTable, Item: item }));

    console.log('[Household:create]', { requestId, householdId, joinCode });
    return success({ data: item, requestId, statusCode: 201 });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// POST /households/join
export const join = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const body = JSON.parse(event.body || '{}');
    const { joinCode } = body;

    if (!joinCode || joinCode.length !== 6) {
      return error({ code: 'INVALID_INPUT', message: 'joinCode must be 6 characters', requestId });
    }

    const result = await db.send(new QueryCommand({
      TableName: config.householdsTable,
      IndexName: 'JoinCodeIndex',
      KeyConditionExpression: 'joinCode = :code',
      ExpressionAttributeValues: { ':code': joinCode.toUpperCase() },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return error({ code: 'NOT_FOUND', message: 'Invalid household code', requestId, statusCode: 404 });
    }

    console.log('[Household:join]', { requestId, householdId: result.Items[0].householdId });
    return success({ data: result.Items[0], requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// GET /households/{householdId}
export const get = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const result = await db.send(new GetCommand({
      TableName: config.householdsTable,
      Key: { householdId },
    }));

    if (!result.Item) {
      return error({ code: 'NOT_FOUND', message: 'Household not found', requestId, statusCode: 404 });
    }

    return success({ data: result.Item, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};

// PATCH /households/{householdId}
export const update = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    const body = JSON.parse(event.body || '{}');
    const { elderProfile } = body;

    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }
    if (!elderProfile) {
      return error({ code: 'INVALID_INPUT', message: 'elderProfile is required', requestId });
    }

    // Get existing household to preserve elderId and other fields
    const existing = await db.send(new GetCommand({
      TableName: config.householdsTable,
      Key: { householdId },
    }));

    if (!existing.Item) {
      return error({ code: 'NOT_FOUND', message: 'Household not found', requestId, statusCode: 404 });
    }

    const currentProfile = existing.Item.elderProfile || {};
    const now = new Date().toISOString();

    const updatedProfile = {
      elderId: currentProfile.elderId || generateId(),
      displayName: elderProfile.displayName ?? currentProfile.displayName ?? '',
      age: elderProfile.age !== undefined ? Number(elderProfile.age) : (currentProfile.age ?? 0),
      birthday: elderProfile.birthday ?? currentProfile.birthday ?? '',
      city: elderProfile.city ?? currentProfile.city ?? '',
      gender: elderProfile.gender ?? currentProfile.gender ?? '',
      chronicConditions: elderProfile.chronicConditions ?? currentProfile.chronicConditions ?? [],
      otherConditions: elderProfile.otherConditions ?? currentProfile.otherConditions ?? '',
      medications: elderProfile.medications ?? currentProfile.medications ?? [],
      allergies: elderProfile.allergies ?? currentProfile.allergies ?? [],
      baselineMobility: elderProfile.baselineMobility ?? currentProfile.baselineMobility ?? 'unknown',
      baselineCognition: elderProfile.baselineCognition ?? currentProfile.baselineCognition ?? 'unknown',
    };

    const result = await db.send(new UpdateCommand({
      TableName: config.householdsTable,
      Key: { householdId },
      UpdateExpression: 'SET elderProfile = :profile, updatedAt = :now',
      ExpressionAttributeValues: {
        ':profile': updatedProfile,
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    console.log('[Household:update]', { requestId, householdId });
    return success({ data: result.Attributes, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
