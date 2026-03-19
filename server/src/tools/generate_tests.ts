import { z } from 'zod';
import { getPageWithSdk } from '../browser.js';
import { validateSnapshot } from '../schema/snapshot.schema.js';
import { generateTests } from '../ai/generator.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const GenerateTestsSchema = z.object({
  url:      z.string().url('url must be a valid URL'),
  hints:    z.string().optional(),
  autoTag:  z.boolean().optional().default(true),
  model:    z.string().optional(),
});

export type GenerateTestsArgs = z.infer<typeof GenerateTestsSchema>;

export const GENERATE_TESTS_TOOL = {
  name: 'generate_tests',
  description:
    '[HEADLESS/CI MODE ONLY] Navigates to a URL, captures the AI SDK snapshot, then ' +
    'uses a configured LLM (Ollama/Anthropic) to auto-generate test scenarios server-side. ' +
    'Use this only in automated pipelines without a human or Claude Code in the loop. ' +
    'When Claude Code is the client, call get_ui_snapshot instead — Claude will analyze ' +
    'the snapshot and write test scenarios itself without any extra API key.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the page to generate tests for.',
      },
      hints: {
        type: 'string',
        description:
          'Optional context for Claude — e.g. "focus on the login flow" or ' +
          '"this form creates a new user account".',
      },
      autoTag: {
        type: 'boolean',
        description: 'Include auto-tagged elements in the snapshot passed to Claude. Default: true.',
      },
      model: {
        type: 'string',
        description: 'Claude model to use. Defaults to claude-sonnet-4-6.',
      },
    },
    required: ['url'],
  },
};

export async function handleGenerateTests(args: GenerateTestsArgs): Promise<CallToolResult> {
  // Step 1: Get the UI snapshot
  const page = await getPageWithSdk(args.url);
  let snapshot;

  try {
    const raw = await page.evaluate((opts) => {
      const sdk = (window as any).__aiSdk;
      if (!sdk) return null;
      return sdk.getSnapshot({ autoTag: opts.autoTag });
    }, { autoTag: args.autoTag });

    if (!raw) {
      return {
        content: [{
          type: 'text',
          text: 'AI SDK not found on page. Ensure ai-sdk.js is loaded before calling generate_tests.',
        }],
        isError: true,
      };
    }

    snapshot = validateSnapshot(raw);
  } finally {
    await page.context().close();
  }

  // Step 2: Generate test scenarios with Claude
  const result = await generateTests(snapshot, args.hints, args.model);

  const output = {
    url:         args.url,
    snapshot: {
      elementCount: snapshot.elements.length,
      manualCount:  snapshot.meta.manualCount,
      autoCount:    snapshot.meta.autoCount,
    },
    generation: {
      model:       result.model,
      generatedAt: result.generatedAt,
      total:       result.scenarios.length,
      rejected:    result.rejected.length,
    },
    scenarios: result.scenarios,
    ...(result.rejected.length > 0 && { rejectedScenarios: result.rejected }),
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    isError: false,
  };
}
