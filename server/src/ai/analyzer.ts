/**
 * Result analyzer.
 * Takes completed test results and asks Claude to analyze failures,
 * identify root causes, and decide which tests are worth retrying.
 */

import { askJson } from './llm.js';
import { RESULT_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompts.js';
import { ResultAnalysisSchema } from './schema.js';
import type { ResultAnalysis } from './schema.js';

/**
 * Sends test results to Claude for analysis.
 *
 * @param results - Array of TestResult objects from the Playwright runner
 * @param model   - Claude model to use
 * @returns Structured analysis with root causes, recommendations, and retry decisions
 */
export async function analyzeResults(
  results: unknown[],
  model?:  string,
): Promise<ResultAnalysis> {
  if (results.length === 0) {
    return {
      summary:       'No test results to analyze.',
      passed:        0,
      failed:        0,
      failures:      [],
      overallHealth: 'green',
    };
  }

  const userPrompt = buildAnalysisPrompt(results);

  const raw = await askJson<unknown>(
    RESULT_ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
    model,
  );

  const parsed = ResultAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Claude returned an invalid analysis object: ${issues}`);
  }

  return parsed.data;
}
