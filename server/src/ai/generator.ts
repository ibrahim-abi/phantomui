/**
 * Test scenario generator.
 * Takes a validated UI snapshot and returns Claude-generated test scenarios.
 */

import { askWithUsage } from './llm.js';
import { TEST_GENERATION_SYSTEM_PROMPT, buildGenerationPrompt } from './prompts.js';
import { validateScenarios } from './schema.js';
import type { UiSnapshot }        from '../types.js';
import type { GeneratedScenario } from './schema.js';

export interface GenerationResult {
  scenarios:   GeneratedScenario[];
  rejected:    { index: number; error: string; raw: unknown }[];
  model:       string;
  promptTokens:  number;
  outputTokens:  number;
  generatedAt: string;
}

/**
 * Generates test scenarios for a given UI snapshot using Claude.
 *
 * @param snapshot - Validated UI snapshot from the SDK
 * @param hints    - Optional free-text context from the caller (e.g. "focus on the login flow")
 * @param model    - Claude model to use (defaults to claude-sonnet-4-6)
 */
export async function generateTests(
  snapshot: UiSnapshot,
  hints?:   string,
  model?:   string,
): Promise<GenerationResult> {
  if (snapshot.elements.length === 0) {
    return {
      scenarios:    [],
      rejected:     [],
      model:        model ?? 'claude-sonnet-4-6',
      promptTokens:  0,
      outputTokens:  0,
      generatedAt:  new Date().toISOString(),
    };
  }

  const userPrompt = buildGenerationPrompt(snapshot, hints);

  const { text: rawText, usage } = await askWithUsage(
    TEST_GENERATION_SYSTEM_PROMPT,
    userPrompt,
    model,
  );

  // Strip markdown code fences if the model wrapped the output
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let raw: unknown[];
  try {
    raw = JSON.parse(cleaned) as unknown[];
  } catch {
    throw new Error(
      '[ai-ui] LLM returned invalid JSON.\nRaw response:\n' + rawText.slice(0, 500)
    );
  }

  const { valid, rejected } = validateScenarios(raw);

  return {
    scenarios:    valid,
    rejected,
    model:        model ?? 'claude-sonnet-4-6',
    promptTokens:  usage.inputTokens,
    outputTokens:  usage.outputTokens,
    generatedAt:  new Date().toISOString(),
  };
}
