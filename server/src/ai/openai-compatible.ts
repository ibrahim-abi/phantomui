/**
 * OpenAI-compatible provider.
 * Works with any server that implements POST /v1/chat/completions:
 *   - LM Studio   (http://localhost:1234/v1)
 *   - vLLM        (http://localhost:8000/v1)
 *   - Groq        (https://api.groq.com/openai/v1)
 *   - Together AI (https://api.together.xyz/v1)
 *   - Perplexity  (https://api.perplexity.ai)
 *   - any Ollama  (http://localhost:11434/v1)  ← Ollama also supports /v1
 */

interface ChatMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

export async function openAiCompatibleAsk(
  systemPrompt: string,
  userPrompt:   string,
  model:        string,
  baseUrl:      string,
  apiKey        = '',
): Promise<string> {
  const url      = baseUrl.replace(/\/$/, '') + '/chat/completions';
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt   },
  ];

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });
  } catch (err) {
    throw new Error(
      `[phantomui] Could not reach OpenAI-compatible server at ${baseUrl}.\n` +
      `Original error: ${(err as Error).message}`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `[phantomui] OpenAI-compatible server returned HTTP ${res.status}.\n` +
      `Response: ${body.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as ChatCompletionResponse;
  return data.choices[0]?.message?.content?.trim() ?? '';
}
