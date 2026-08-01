import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, QueryCommand } from '../utils/db.js';
import { converse } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';

const TREND_SYSTEM_PROMPT = `You are a health trend analysis assistant for CareBridge AI. Analyze recent daily care logs and generate a brief alert text.

Rules:
- Identify declining trends (food intake, sleep, weight, mobility).
- Mention specific metrics that changed.
- Suggest increasing monitoring frequency if concerning.
- Do NOT diagnose.
- Keep it concise (2-3 sentences).
- Output in Traditional Chinese (zh-TW).
- If data is insufficient, say so clearly.`;

// POST /trends/{householdId}/alert
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const householdId = event.pathParameters?.householdId;
    if (!householdId) {
      return error({ code: 'INVALID_INPUT', message: 'householdId is required', requestId });
    }

    // Get recent daily logs
    const logs = await db.send(new QueryCommand({
      TableName: config.dailyLogsTable,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      ScanIndexForward: false,
      Limit: 14, // Last 2 weeks
    }));

    const items = logs.Items || [];

    if (items.length < 3) {
      return success({
        data: { alertText: '資料不足，需要至少 3 天的紀錄才能分析趨勢。' },
        requestId,
      });
    }

    // Summarize logs for Bedrock
    const summary = items.map((log: any) => ({
      date: log.date,
      mealPct: log.meals?.percentage,
      sleepHours: log.sleep?.hours,
      mobility: log.mobility,
      breathing: log.breathing,
      aiAlert: log.aiAlertTriggered,
    }));

    const alertText = await converse({
      systemPrompt: TREND_SYSTEM_PROMPT,
      userMessage: `Analyze these recent daily care logs (newest first):\n${JSON.stringify(summary, null, 2)}`,
      maxTokens: 300,
    });

    console.log('[Trend]', { requestId, householdId, logsAnalyzed: items.length });
    return success({ data: { alertText }, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
