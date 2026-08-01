import type { APIGatewayProxyResultV2 } from 'aws-lambda';

interface SuccessOptions<T> {
  data: T;
  requestId: string;
  statusCode?: number;
}

interface ErrorOptions {
  code: string;
  message: string;
  retryable?: boolean;
  requestId: string;
  statusCode?: number;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
};

export function success<T>({ data, requestId, statusCode = 200 }: SuccessOptions<T>): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      data,
      error: null,
      requestId,
    }),
  };
}

export function error({ code, message, retryable = false, requestId, statusCode = 400 }: ErrorOptions): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      data: null,
      error: { code, message, retryable },
      requestId,
    }),
  };
}

export function serverError(requestId: string, err?: unknown): APIGatewayProxyResultV2 {
  console.error('[ServerError]', { requestId, error: err instanceof Error ? err.message : err });
  return error({
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    retryable: true,
    requestId,
    statusCode: 500,
  });
}
