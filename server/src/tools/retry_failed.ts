import { z } from 'zod';
import { getRecord } from '../runner/store.js';
import { executeScenario } from '../runner/executor.js';
import type { TestStep } from '../types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const RetryFailedSchema = z.object({
  run_id:    z.string().min(1, 'run_id is required'),
  overrides: z.record(z.object({
    value:   z.string().optional(),
    target:  z.string().optional(),
    timeout: z.number().optional(),
  })).optional(),
  full_rerun: z.boolean().optional().default(false),
});

export const RETRY_FAILED_TOOL = {
  name: 'retry_failed',
  description:
    'Re-runs a previously failed test scenario. By default, re-runs only the failed ' +
    'and skipped steps from the original run. Pass full_rerun: true to restart from step 1. ' +
    'Pass overrides (keyed by step index) to adjust selectors or values before retrying. ' +
    'Claude calls this after analyzing get_results output.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      run_id: {
        type: 'string',
        description: 'The runId of the failed test run.',
      },
      overrides: {
        type: 'object',
        description:
          'Optional per-step overrides, keyed by step index (0-based). ' +
          'E.g. { "2": { "value": "new-password" } } changes step 3\'s value.',
        additionalProperties: {
          type: 'object',
          properties: {
            value:   { type: 'string' },
            target:  { type: 'string' },
            timeout: { type: 'number' },
          },
        },
      },
      full_rerun: {
        type: 'boolean',
        description: 'If true, re-run the entire scenario from step 1. Default: false (failed+skipped only).',
      },
    },
    required: ['run_id'],
  },
};

export async function handleRetryFailed(args: unknown): Promise<CallToolResult> {
  const { run_id, overrides, full_rerun } = RetryFailedSchema.parse(args);

  const record = await getRecord(run_id);
  if (!record) {
    return {
      content: [{ type: 'text', text: `No result found for runId: ${run_id}` }],
      isError: true,
    };
  }

  const { result, scenario } = record;

  // Build the step list to re-run
  let stepsToRun: TestStep[];

  if (full_rerun) {
    stepsToRun = [...scenario.steps];
  } else {
    // Only failed + skipped steps (keep their original indices for override lookup)
    const failedIndices = result.steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status === 'failed' || s.status === 'skipped')
      .map(({ i }) => i);

    stepsToRun = failedIndices.map(i => ({ ...scenario.steps[i] }));
  }

  // Apply overrides
  if (overrides) {
    stepsToRun = stepsToRun.map((step, i) => {
      const override = overrides[String(i)];
      if (!override) return step;
      return {
        ...step,
        ...(override.target  !== undefined && { target:  override.target  }),
        ...(override.value   !== undefined && { value:   override.value   }),
        ...(override.timeout !== undefined && { timeout: override.timeout }),
      };
    });
  }

  const retryScenario = {
    ...scenario,
    name: `${scenario.name}-retry`,
    steps: stepsToRun,
  };

  const retryResult = await executeScenario(retryScenario);

  const passed  = retryResult.steps.filter(s => s.status === 'passed').length;
  const failed  = retryResult.steps.filter(s => s.status === 'failed').length;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        originalRunId: run_id,
        retryRunId:    retryResult.runId,
        stepsRetried:  stepsToRun.length,
        status:        retryResult.status,
        steps: { passed, failed },
        ...(retryResult.error && { error: retryResult.error }),
        hint: 'Call get_results with retryRunId for full details.',
      }, null, 2),
    }],
    isError: false,
  };
}
