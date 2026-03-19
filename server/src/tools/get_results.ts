import { z } from 'zod';
import { getRecord } from '../runner/store.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const GetResultsSchema = z.object({
  run_id: z.string().min(1, 'run_id is required'),
});

export const GET_RESULTS_TOOL = {
  name: 'get_results',
  description:
    'Returns the full step-by-step results of a test run by runId. ' +
    'Use this after run_test to see which steps passed or failed, error messages, ' +
    'and durations. Claude uses this to decide whether to retry or report a bug.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      run_id: {
        type: 'string',
        description: 'The runId returned by run_test.',
      },
    },
    required: ['run_id'],
  },
};

export async function handleGetResults(args: unknown): Promise<CallToolResult> {
  const { run_id } = GetResultsSchema.parse(args);

  const record = getRecord(run_id);

  if (!record) {
    return {
      content: [{ type: 'text', text: `No result found for runId: ${run_id}` }],
      isError: true,
    };
  }

  const { result } = record;

  // Build a rich, Claude-readable report
  const report = {
    runId:      result.runId,
    scenario:   result.scenario,
    status:     result.status,
    startedAt:  result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    ...(result.error && { error: result.error }),
    steps: result.steps.map((s, i) => ({
      index:       i + 1,
      action:      s.step.action,
      target:      s.step.target  ?? null,
      value:       s.step.value   ?? null,
      description: s.step.description ?? null,
      status:      s.status,
      durationMs:  s.durationMs,
      ...(s.error && { error: s.error }),
    })),
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
    isError: false,
  };
}
