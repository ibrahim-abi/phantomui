import { z } from 'zod';
import { getPageWithSdk } from '../browser.js';
import { validateSnapshot } from '../schema/snapshot.schema.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const GetUiSnapshotSchema = z.object({
  url:        z.string().url('url must be a valid URL'),
  autoTag:    z.boolean().optional().default(true),
  auth_token: z.string().optional(),
});

export type GetUiSnapshotArgs = z.infer<typeof GetUiSnapshotSchema>;

export const GET_UI_SNAPSHOT_TOOL = {
  name: 'get_ui_snapshot',
  description:
    'Navigates to a URL and returns a structured JSON snapshot of all UI elements ' +
    'discovered by the AI SDK (data-ai-* attributes + auto-tagged fallbacks). ' +
    'Use this as the first step before generating test scenarios.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the page to snapshot (e.g. http://localhost:3000/login)',
      },
      autoTag: {
        type: 'boolean',
        description: 'Include auto-tagged elements (elements without data-ai-id). Default: true.',
      },
      auth_token: {
        type: 'string',
        description: 'Optional Bearer token injected as Authorization header.',
      },
    },
    required: ['url'],
  },
};

export async function handleGetUiSnapshot(args: GetUiSnapshotArgs): Promise<CallToolResult> {
  const page = await getPageWithSdk(args.url);

  try {
    // Set auth header if provided
    if (args.auth_token) {
      await page.setExtraHTTPHeaders({ Authorization: `Bearer ${args.auth_token}` });
    }

    // Call the SDK
    const raw = await page.evaluate((opts) => {
      const sdk = (window as any).__aiSdk;
      if (!sdk) return null;
      return sdk.getSnapshot({ autoTag: opts.autoTag });
    }, { autoTag: args.autoTag });

    if (!raw) {
      return {
        content: [{ type: 'text', text: 'AI SDK not found on page. Ensure ai-sdk.js is loaded.' }],
        isError: true,
      };
    }

    const snapshot = validateSnapshot(raw);

    return {
      content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }],
      isError: false,
    };
  } finally {
    await page.context().close();
  }
}
