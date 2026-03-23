import Anthropic from '@anthropic-ai/sdk';

/**
 * Singleton Anthropic client.
 * Reads ANTHROPIC_API_KEY from the environment.
 * Throws a clear error if the key is missing.
 */
let _client: Anthropic | undefined;

export function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[phantomui] ANTHROPIC_API_KEY is not set. ' +
      'Export it before starting the server:\n' +
      '  export ANTHROPIC_API_KEY=sk-ant-...'
    );
  }

  _client = new Anthropic({ apiKey });
  return _client;
}

export const DEFAULT_MODEL   = 'claude-sonnet-4-6';
export const DEFAULT_MAX_TOKENS = 8192;

export interface LlmUsage {
  inputTokens:  number;
  outputTokens: number;
}

/**
 * Sends a single-turn message to Claude and returns the text response plus real token usage.
 */
export async function askWithUsage(
  systemPrompt: string,
  userPrompt:   string,
  model = DEFAULT_MODEL,
): Promise<{ text: string; usage: LlmUsage }> {
  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('[phantomui] Unexpected Claude response type: ' + block.type);
  }

  return {
    text: block.text,
    usage: {
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

/**
 * Sends a single-turn message to Claude and returns the text response.
 *
 * @param systemPrompt - The system prompt (instructions)
 * @param userPrompt   - The user message (data/context)
 * @param model        - Claude model ID (defaults to claude-sonnet-4-6)
 */
export async function ask(
  systemPrompt: string,
  userPrompt:   string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const { text } = await askWithUsage(systemPrompt, userPrompt, model);
  return text;
}

/**
 * Like ask(), but parses the response as JSON.
 * Strips markdown code fences if Claude wraps the output anyway.
 */
export async function askJson<T>(
  systemPrompt: string,
  userPrompt:   string,
  model = DEFAULT_MODEL,
): Promise<T> {
  const raw = await ask(systemPrompt, userPrompt, model);

  // Strip ```json ... ``` or ``` ... ``` fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      '[phantomui] Claude returned invalid JSON.\n' +
      'Raw response:\n' + raw.slice(0, 500)
    );
  }
}
