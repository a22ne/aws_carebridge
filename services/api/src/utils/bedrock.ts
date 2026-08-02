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

/**
 * Returned by `converse` when Bedrock Guardrails blocks the exchange.
 *
 * Deliberately a language-neutral sentinel rather than a human-readable string:
 * this utility has no idea which of the four app languages the reader uses, so
 * the wording belongs in the UI's i18n dictionary.
 */
export const GUARDRAIL_BLOCKED = '__GUARDRAIL_BLOCKED__';

/** Thrown by `converseJson` when the guardrail blocks — never worth retrying. */
export class GuardrailBlockedError extends Error {
  readonly code = 'MEDICAL_ADVICE_BLOCKED';
  constructor() {
    super('Blocked by Bedrock Guardrails');
    this.name = 'GuardrailBlockedError';
  }
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

  // Guardrail intervened — hand back a sentinel and let the caller localise it
  if (response.stopReason === 'guardrail_intervened') {
    console.log('[Bedrock] guardrail intervened', { guardrailId: config.bedrockGuardrailId });
    return GUARDRAIL_BLOCKED;
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
      if (raw === GUARDRAIL_BLOCKED) throw new GuardrailBlockedError();
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      // A guardrail block is a decision, not a transient failure — do not retry
      if (err instanceof GuardrailBlockedError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Bedrock] Attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Bedrock converseJson failed after retries');
}
