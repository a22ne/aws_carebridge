import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '../utils/db.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId, generateJoinCode } from '../utils/id.js';
import { translateToAllLanguages, isSupportedLanguage } from '../utils/translate.js';

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

    const sourceLang = isSupportedLanguage(body.language) ? body.language : 'zh-TW';
    const otherConditionTranslations = elderProfile.otherConditions
      ? (await translateToAllLanguages(String(elderProfile.otherConditions), sourceLang)) ?? {}
      : {};

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
        otherConditionTranslations,
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

function mergeUserProfile(incoming: any, current: any = {}) {
  return {
    name: incoming.name ?? current.name ?? '',
    phone: incoming.phone ?? current.phone ?? '',
    relationship: incoming.relationship ?? current.relationship ?? '',
    language: incoming.language ?? current.language ?? 'zh-TW',
    updatedAt: new Date().toISOString(),
  };
}

// PATCH /households/{householdId}
// Accepts any subset of: elderProfile, caregiverProfile, contactProfile, careGuidelines
export const update = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    const body = JSON.parse(event.body || '{}');
    const { elderProfile, caregiverProfile, contactProfile, careGuidelines } = body;

    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    const hasUpdate =
      elderProfile !== undefined ||
      caregiverProfile !== undefined ||
      contactProfile !== undefined ||
      careGuidelines !== undefined;

    if (!hasUpdate) {
      return error({
        code: 'INVALID_INPUT',
        message: 'At least one of elderProfile, caregiverProfile, contactProfile, careGuidelines is required',
        requestId,
      });
    }

    // Get existing household to preserve untouched fields
    const existing = await db.send(new GetCommand({
      TableName: config.householdsTable,
      Key: { householdId },
    }));

    if (!existing.Item) {
      return error({ code: 'NOT_FOUND', message: 'Household not found', requestId, statusCode: 404 });
    }

    const now = new Date().toISOString();
    const setClauses: string[] = ['updatedAt = :now'];
    const values: Record<string, unknown> = { ':now': now };

    if (elderProfile !== undefined) {
      const current = existing.Item.elderProfile || {};

      // Re-translate when the text changed, or when an earlier attempt left no
      // translations behind (records created before this field existed, or a
      // save that happened while Bedrock was unreachable).
      let otherConditionTranslations: Record<string, string> | undefined;
      const incomingOther = elderProfile.otherConditions ?? current.otherConditions;
      const textChanged =
        elderProfile.otherConditions !== undefined &&
        elderProfile.otherConditions !== current.otherConditions;
      const translationsMissing =
        !current.otherConditionTranslations ||
        Object.keys(current.otherConditionTranslations).length === 0;

      if (incomingOther && (textChanged || translationsMissing)) {
        const sourceLang = isSupportedLanguage(body.language) ? body.language : 'zh-TW';
        otherConditionTranslations =
          (await translateToAllLanguages(String(incomingOther), sourceLang)) ?? {};
      }

      values[':elderProfile'] = {
        elderId: current.elderId || generateId(),
        displayName: elderProfile.displayName ?? current.displayName ?? '',
        age: elderProfile.age !== undefined ? Number(elderProfile.age) : (current.age ?? 0),
        birthday: elderProfile.birthday ?? current.birthday ?? '',
        city: elderProfile.city ?? current.city ?? '',
        gender: elderProfile.gender ?? current.gender ?? '',
        chronicConditions: elderProfile.chronicConditions ?? current.chronicConditions ?? [],
        otherConditions: elderProfile.otherConditions ?? current.otherConditions ?? '',
        otherConditionTranslations: otherConditionTranslations ?? current.otherConditionTranslations ?? {},
        medications: elderProfile.medications ?? current.medications ?? [],
        allergies: elderProfile.allergies ?? current.allergies ?? [],
        baselineMobility: elderProfile.baselineMobility ?? current.baselineMobility ?? 'unknown',
        baselineCognition: elderProfile.baselineCognition ?? current.baselineCognition ?? 'unknown',
      };
      setClauses.push('elderProfile = :elderProfile');
    }

    if (caregiverProfile !== undefined) {
      values[':caregiverProfile'] = mergeUserProfile(caregiverProfile, existing.Item.caregiverProfile);
      setClauses.push('caregiverProfile = :caregiverProfile');
    }

    if (contactProfile !== undefined) {
      values[':contactProfile'] = mergeUserProfile(contactProfile, existing.Item.contactProfile);
      setClauses.push('contactProfile = :contactProfile');
    }

    if (careGuidelines !== undefined) {
      const text = String(careGuidelines);
      values[':careGuidelines'] = text;
      values[':guidelinesUpdatedAt'] = now;
      setClauses.push('careGuidelines = :careGuidelines');
      setClauses.push('careGuidelinesUpdatedAt = :guidelinesUpdatedAt');

      // The caregiver may not read the contact's language, so store every
      // translation up front and let the UI pick the right one.
      const sourceLang = isSupportedLanguage(body.language) ? body.language : 'zh-TW';
      const translations = await translateToAllLanguages(text, sourceLang);
      values[':guidelineTranslations'] = translations ?? {};
      setClauses.push('careGuidelineTranslations = :guidelineTranslations');
    }

    const result = await db.send(new UpdateCommand({
      TableName: config.householdsTable,
      Key: { householdId },
      UpdateExpression: `SET ${setClauses.join(', ')}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));

    console.log('[Household:update]', {
      requestId,
      householdId,
      updated: {
        elderProfile: elderProfile !== undefined,
        caregiverProfile: caregiverProfile !== undefined,
        contactProfile: contactProfile !== undefined,
        careGuidelines: careGuidelines !== undefined,
      },
    });
    return success({ data: result.Attributes, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
