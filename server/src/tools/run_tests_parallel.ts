import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeScenario } from '../runner/executor.js';

// ─── Input schema ─────────────────────────────────────────────────────────────

const TestStepSchema = z.object({
  action:        z.string(),
  target:        z.string().optional(),
  value:         z.string().optional(),
  timeout:       z.number().optional(),
  description:   z.string().optional(),
  frameSelector: z.string().optional(),
});

const NetworkMockSchema = z.object({
  urlPattern:   z.string(),
  status:       z.number().optional(),
  body:         z.unknown(),
  contentType:  z.string().optional(),
});

const TestScenarioSchema = z.object({
  name:          z.string(),
  description:   z.string(),
  steps:         z.array(TestStepSchema),
  networkMocks:  z.array(NetworkMockSchema).optional(),
});

export const RunTestsParallelSchema = z.object({
  scenarios:   z.array(TestScenarioSchema).min(1, 'At least one scenario required'),
  concurrency: z.number().int().min(1).max(10).optional().default(3),
});

export type RunTestsParallelArgs = z.infer<typeof RunTestsParallelSchema>;

// ─── Tool definition ──────────────────────────────────────────────────────────

export const RUN_TESTS_PARALLEL_TOOL = {
  name: 'run_tests_parallel',
  description:
    'Runs multiple test scenarios in parallel with a configurable concurrency limit. ' +
    'Returns a batch summary with per-scenario run IDs and statuses. ' +
    'Use get_results with each runId for full step details.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      scenarios: {
        type: 'array',
        description: 'Array of test scenarios to run. Each scenario runs in its own browser context.',
        items: { type: 'object' },
      },
      concurrency: {
        type: 'number',
        description: 'Maximum number of scenarios to run simultaneously (1–10). Default: 3.',
      },
    },
    required: ['scenarios'],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function handleRunTestsParallel(args: RunTestsParallelArgs): Promise<CallToolResult> {
  const { scenarios, concurrency } = args;
  const batchId = randomUUID();

  // Chunk scenarios into batches of `concurrency`
  const allResults: Awaited<ReturnType<typeof executeScenario>>[] = [];

  for (let i = 0; i < scenarios.length; i += concurrency) {
    const batch = scenarios.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(scenario => executeScenario(scenario as any))
    );
    allResults.push(...batchResults);
  }

  const passed = allResults.filter(r => r.status === 'passed').length;
  const failed = allResults.filter(r => r.status === 'failed').length;

  const runs = allResults.map(r => ({
    runId:    r.runId,
    scenario: r.scenario,
    status:   r.status,
    ...(r.error && { error: r.error }),
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        batchId,
        total:  allResults.length,
        passed,
        failed,
        runs,
        hint: 'Call get_results with any runId for full step details.',
      }, null, 2),
    }],
    isError: false,
  };
}
