import { z } from 'zod';

/**
 * Zod schema for a single test step — validates Claude's generated output.
 */
export const TestStepSchema = z.object({
  action: z.enum(['navigate', 'fill', 'click', 'select', 'assert', 'wait']),
  target: z.string().optional(),
  value:  z.string().optional(),
  description: z.string().optional(),
});

/**
 * Zod schema for a complete test scenario.
 */
export const TestScenarioSchema = z.object({
  name:        z.string().min(1).regex(/^[a-z0-9-]+$/, 'name must be kebab-case'),
  description: z.string().min(1),
  priority:    z.enum(['high', 'medium', 'low']),
  tags:        z.array(z.string()),
  steps:       z.array(TestStepSchema).min(1),
});

export type GeneratedScenario = z.infer<typeof TestScenarioSchema>;

/**
 * Validates an array of scenarios returned by Claude.
 * Filters out invalid entries and attaches validation errors to the result.
 */
export function validateScenarios(raw: unknown): {
  valid:    GeneratedScenario[];
  rejected: { index: number; error: string; raw: unknown }[];
} {
  if (!Array.isArray(raw)) {
    throw new Error('Claude did not return a JSON array of scenarios.');
  }

  const valid:    GeneratedScenario[]                           = [];
  const rejected: { index: number; error: string; raw: unknown }[] = [];

  for (let i = 0; i < raw.length; i++) {
    const result = TestScenarioSchema.safeParse(raw[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      rejected.push({
        index: i,
        error: result.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join('; '),
        raw:   raw[i],
      });
    }
  }

  return { valid, rejected };
}

/**
 * Zod schema for Claude's result analysis output.
 */
export const FailureAnalysisSchema = z.object({
  scenario:       z.string(),
  step:           z.string(),
  rootCause:      z.string(),
  recommendation: z.string(),
  shouldRetry:    z.boolean(),
});

export const ResultAnalysisSchema = z.object({
  summary:       z.string(),
  passed:        z.number().int().nonnegative(),
  failed:        z.number().int().nonnegative(),
  failures:      z.array(FailureAnalysisSchema),
  overallHealth: z.enum(['green', 'yellow', 'red']),
});

export type ResultAnalysis = z.infer<typeof ResultAnalysisSchema>;
