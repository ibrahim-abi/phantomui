/**
 * Unified LLM interface.
 *
 * Picks a provider based on environment variables:
 *   LLM_PROVIDER=ollama   → uses local Ollama (default if no Anthropic key)
 *   LLM_PROVIDER=anthropic → uses Claude API (requires ANTHROPIC_API_KEY)
 *
 * If neither is explicitly set:
 *   - ANTHROPIC_API_KEY present → Anthropic
 *   - Otherwise               → Ollama
 */

import { ask as anthropicAsk }        from './claude.js';
import { ollamaAsk }                  from './ollama.js';
import { openAiCompatibleAsk }        from './openai-compatible.js';

export type Provider = 'anthropic' | 'ollama' | 'openai-compatible';

function resolveProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === 'anthropic')        return 'anthropic';
  if (explicit === 'ollama')           return 'ollama';
  if (explicit === 'openai-compatible') return 'openai-compatible';
  // Auto-detect
  if (process.env.ANTHROPIC_API_KEY)                return 'anthropic';
  if (process.env.OPENAI_COMPATIBLE_BASE_URL)       return 'openai-compatible';
  return 'ollama';
}

function resolveModel(provider: Provider): string {
  if (provider === 'anthropic')         return process.env.AI_MODEL                      ?? 'claude-sonnet-4-6';
  if (provider === 'openai-compatible') return process.env.OPENAI_COMPATIBLE_MODEL        ?? 'gpt-4o';
  return process.env.OLLAMA_MODEL ?? 'llama3.1';
}

/**
 * Send a prompt to whichever LLM is configured.
 * Returns the raw text response.
 */
export async function ask(
  systemPrompt:  string,
  userPrompt:    string,
  modelOverride?: string,
): Promise<string> {
  const provider = resolveProvider();
  const model    = modelOverride ?? resolveModel(provider);

  process.stderr.write(`[ai-ui] provider=${provider}  model=${model}\n`);

  switch (provider) {
    case 'anthropic':
      return anthropicAsk(systemPrompt, userPrompt, model);

    case 'openai-compatible': {
      const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL!;
      const apiKey  = process.env.OPENAI_COMPATIBLE_API_KEY ?? '';
      return openAiCompatibleAsk(systemPrompt, userPrompt, model, baseUrl, apiKey);
    }

    case 'ollama':
    default: {
      const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
      return ollamaAsk(systemPrompt, userPrompt, model, baseUrl);
    }
  }
}

/**
 * Like ask(), but parses the response as JSON.
 * Strips markdown code fences if the model wraps output in them.
 */
export async function askJson<T>(
  systemPrompt: string,
  userPrompt:   string,
  modelOverride?: string,
): Promise<T> {
  const raw = await ask(systemPrompt, userPrompt, modelOverride);

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      '[ai-ui] LLM returned invalid JSON.\n' +
      'Raw response:\n' + raw.slice(0, 500)
    );
  }
}

export { resolveProvider, resolveModel };
