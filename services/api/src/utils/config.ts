// Centralized configuration — all values from environment variables

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  // Tables
  householdsTable: requireEnv('HOUSEHOLDS_TABLE'),
  incidentsTable: requireEnv('INCIDENTS_TABLE'),
  dailyLogsTable: requireEnv('DAILY_LOGS_TABLE'),
  notificationsTable: requireEnv('NOTIFICATIONS_TABLE'),
  conversationsTable: requireEnv('CONVERSATIONS_TABLE'),

  // Bedrock
  bedrockModelId: requireEnv('BEDROCK_MODEL_ID'),
  bedrockGuardrailId: optionalEnv('BEDROCK_GUARDRAIL_ID', ''),
  bedrockGuardrailVersion: optionalEnv('BEDROCK_GUARDRAIL_VERSION', 'DRAFT'),

  // App
  appEnv: optionalEnv('APP_ENV', 'prod'),
  logLevel: optionalEnv('LOG_LEVEL', 'INFO'),
  region: optionalEnv('AWS_REGION', 'us-west-2'),
} as const;
