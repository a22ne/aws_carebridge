import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from '../utils/config.js';
import { db, GetCommand, UpdateCommand } from '../utils/db.js';
import { converseJson } from '../utils/bedrock.js';
import { success, error, serverError } from '../utils/response.js';
import { generateId } from '../utils/id.js';
import type { AssessmentQuestion } from '@carebridge/shared-types';

const QUESTION_SYSTEM_PROMPT = `You are a care assessment assistant. Based on the symptoms extracted and answers so far, determine the single most important unanswered question that would most affect risk assessment.

Rules:
- Output exactly ONE question.
- The question must be answerable with yes/no/unknown.
- Do NOT repeat questions already answered.
- Provide the question text in all 4 languages: zh-TW, en, id, vi.
- Do NOT diagnose.
- Output ONLY valid JSON.

Output JSON schema:
{
  "questionId": "string (unique identifier like q_fever, q_consciousness)",
  "textByLanguage": {
    "zh-TW": "string",
    "en": "string",
    "id": "string",
    "vi": "string"
  },
  "options": ["yes", "no", "unknown"],
  "isComplete": false
}

If all critical questions have been answered (typically 3-5 questions), return:
{
  "questionId": null,
  "textByLanguage": {},
  "options": [],
  "isComplete": true
}`;

// POST /incidents/{incidentId}/answer
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || generateId();
  try {
    const incidentId = event.pathParameters?.incidentId;
    const body = JSON.parse(event.body || '{}');
    const { householdId, questionId, answer } = body;

    if (!incidentId || !householdId) {
      return error({ code: 'INVALID_INPUT', message: 'incidentId and householdId required', requestId });
    }

    // Get current incident state
    const incident = await db.send(new GetCommand({
      TableName: config.incidentsTable,
      Key: { householdId, incidentId },
    }));

    if (!incident.Item) {
      return error({ code: 'NOT_FOUND', message: 'Incident not found', requestId, statusCode: 404 });
    }

    const currentAnswers = incident.Item.answers || [];
    const symptoms = incident.Item.extractedSymptoms || [];

    // Save new answer if provided
    if (questionId && answer) {
      const validAnswers = ['yes', 'no', 'unknown'];
      if (!validAnswers.includes(answer)) {
        return error({ code: 'INVALID_INPUT', message: 'Answer must be yes, no, or unknown', requestId });
      }

      currentAnswers.push({
        questionId,
        answer,
        timestamp: new Date().toISOString(),
      });

      await db.send(new UpdateCommand({
        TableName: config.incidentsTable,
        Key: { householdId, incidentId },
        UpdateExpression: 'SET answers = :answers, updatedAt = :now',
        ExpressionAttributeValues: {
          ':answers': currentAnswers,
          ':now': new Date().toISOString(),
        },
      }));
    }

    // Generate next question
    const context = `
Extracted symptoms: ${JSON.stringify(symptoms)}
Answers so far: ${JSON.stringify(currentAnswers)}
Number of questions asked: ${currentAnswers.length}
`;

    const nextQuestion = await converseJson<AssessmentQuestion & { isComplete?: boolean }>({
      systemPrompt: QUESTION_SYSTEM_PROMPT,
      userMessage: context,
      maxTokens: 800,
    });

    console.log('[Answer]', { requestId, incidentId, answersCount: currentAnswers.length, isComplete: nextQuestion.isComplete });

    return success({ data: nextQuestion, requestId });
  } catch (err) {
    return serverError(requestId, err);
  }
};
