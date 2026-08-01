import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from './config.js';

const bedrockClient = new BedrockRuntimeClient({ region: config.region });

interface ConverseOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

interface ConverseWithGuardrailOptions extends ConverseOptions {
  useGuardrail?: boolean;
}

export async function converse({ systemPrompt, userMessage, maxTokens = 2048, useGuardrail = false }: ConverseWithGuardrailOptions): Promise<string> {
  const input: any = {
    modelId: config.bedrockModelId,
    messages: [
      {
        role: 'user' as const,
        content: [{ text: userMessage }],
      },
    ],
    system: [{ text: systemPrompt }],
    inferenceConfig: {
      maxTokens,
      temperature: 0.1,
    },
  };

  // Apply guardrail if configured and requested
  if (useGuardrail && config.bedrockGuardrailId) {
    input.guardrailConfig = {
      guardrailIdentifier: config.bedrockGuardrailId,
      guardrailVersion: config.bedrockGuardrailVersion,
    };
  }

  const command = new ConverseCommand(input);
  const response = await bedrockClient.send(command);

  // Check if guardrail intervened
  if (response.stopReason === 'guardrail_intervened') {
    return JSON.stringify({
      blocked: true,
      message: 'CareBridge AI 不提供醫療診斷。如有疑慮請聯絡醫療專業人員。',
    });
  }

  const outputText = response.output?.message?.content?.[0]?.text;
  if (!outputText) {
    throw new Error('Empty response from Bedrock');
  }

  return outputText;
}

/**
 * Call Bedrock and parse JSON response with retry logic.
 */
export async function converseJson<T>(options: ConverseWithGuardrailOptions, maxRetries = 2): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await converse(options);
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Bedrock] Attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Bedrock converseJson failed after retries');
}
