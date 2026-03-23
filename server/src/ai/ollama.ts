/**
 * Ollama provider — calls the local Ollama REST API.
 * No extra dependencies: uses Node 18+ built-in fetch.
 *
 * Requires Ollama running: https://ollama.com
 *   ollama serve
 *   ollama pull llama3.1   (or any model you prefer)
 */

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

interface OllamaMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done:    boolean;
}

/**
 * Send a chat request to Ollama and return the response text.
 */
export async function ollamaAsk(
  systemPrompt: string,
  userPrompt:   string,
  model:        string,
  baseUrl       = DEFAULT_OLLAMA_BASE_URL,
): Promise<string> {
  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt   },
  ];

  const url = `${baseUrl}/api/chat`;

  let res: Response;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model, messages, stream: false }),
    });
  } catch (err) {
    throw new Error(
      `[phantomui] Could not reach Ollama at ${baseUrl}. ` +
      `Is it running? Start it with: ollama serve\n` +
      `Original error: ${(err as Error).message}`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `[phantomui] Ollama returned HTTP ${res.status}. ` +
      `Make sure the model is pulled: ollama pull ${model}\n` +
      `Response: ${body.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as OllamaChatResponse;
  return data.message.content.trim();
}

/**
 * List models available in the local Ollama instance.
 */
export async function listOllamaModels(
  baseUrl = DEFAULT_OLLAMA_BASE_URL,
): Promise<string[]> {
  try {
    const res  = await fetch(`${baseUrl}/api/tags`);
    const data = (await res.json()) as { models: { name: string }[] };
    return data.models.map(m => m.name);
  } catch {
    return [];
  }
}
