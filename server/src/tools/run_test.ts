import { z } from 'zod';
import { executeScenario } from '../runner/executor.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// ─── Input schema ─────────────────────────────────────────────────────────────

const TestStepSchema = z.object({
  action:      z.enum(['navigate', 'fill', 'click', 'select', 'assert', 'wait']),
  target:      z.string().optional(),
  value:       z.string().optional(),
  description: z.string().optional(),
  timeout:     z.number().optional(),
});

const TestScenarioSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional().default(''),
  steps:       z.array(TestStepSchema).min(1),
});

const SessionSchema = z.object({
  cookies: z.array(z.object({
    name:   z.string(),
    value:  z.string(),
    domain: z.string().optional(),
    path:   z.string().optional(),
  })).optional(),
  localStorage: z.record(z.string()).optional(),
  auth_token:   z.string().optional(),
}).optional();

export const RunTestSchema = z.object({
  scenario: TestScenarioSchema,
  session:  SessionSchema,
});

export type RunTestArgs = z.infer<typeof RunTestSchema>;

// ─── Tool definition ──────────────────────────────────────────────────────────

export const RUN_TEST_TOOL = {
  name: 'run_test',
  description:
    'Executes a test scenario step-by-step using Playwright. ' +
    'Pass a scenario object with a name and steps array. Each step has an action ' +
    '(navigate, fill, click, select, assert, wait), a target selector or URL, and an optional value. ' +
    'Returns a runId — use get_results to fetch the full outcome.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      scenario: {
        type: 'object',
        description: 'The test scenario to execute.',
        properties: {
          name:        { type: 'string', description: 'Unique kebab-case name for this scenario.' },
          description: { type: 'string', description: 'One sentence describing the user intent.' },
          steps: {
            type: 'array',
            description: 'Ordered list of test steps.',
            items: {
              type: 'object',
              properties: {
                action:      { type: 'string', enum: ['navigate', 'fill', 'click', 'select', 'assert', 'wait'] },
                target:      { type: 'string', description: 'CSS selector or URL.' },
                value:       { type: 'string', description: 'Fill value, assert pattern, or wait duration.' },
                description: { type: 'string', description: 'Human-readable step description.' },
                timeout:     { type: 'number', description: 'Step timeout in ms. Default: 15000.' },
              },
              required: ['action'],
            },
          },
        },
        required: ['name', 'steps'],
      },
      session: {
        type: 'object',
        description: 'Optional session state to inject before running (cookies, localStorage, auth_token).',
        properties: {
          cookies:      { type: 'array',  items: { type: 'object' } },
          localStorage: { type: 'object' },
          auth_token:   { type: 'string' },
        },
      },
    },
    required: ['scenario'],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function handleRunTest(args: unknown): Promise<CallToolResult> {
  const parsed = RunTestSchema.parse(args);

  const result = await executeScenario(
    {
      name:        parsed.scenario.name,
      description: parsed.scenario.description ?? '',
      steps:       parsed.scenario.steps as any,
    },
    parsed.session ?? undefined,
  );

  // Return a concise summary + runId so Claude can decide next steps
  const passed  = result.steps.filter(s => s.status === 'passed').length;
  const failed  = result.steps.filter(s => s.status === 'failed').length;
  const skipped = result.steps.filter(s => s.status === 'skipped').length;

  const summary = {
    runId:      result.runId,
    scenario:   result.scenario,
    status:     result.status,
    durationMs: result.durationMs,
    steps: { total: result.steps.length, passed, failed, skipped },
    ...(result.error && { error: result.error }),
    hint: result.status === 'failed'
      ? 'Call get_results with this runId for full step-by-step details and retry options.'
      : 'All steps passed. Call get_results for the full report.',
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
    isError: false,
  };
}
