import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      data: {
        service: 'CareBridge AI API',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        region: process.env.AWS_REGION || 'us-west-2',
      },
      error: null,
      requestId: event.requestContext?.requestId || 'local',
    }),
  };
};
