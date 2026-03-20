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
        content: [{
          type: 'text',
          text:
            'AI SDK not found on page (window.__aiSdk is undefined).\n\n' +
            'To fix this, load the SDK before running tests:\n\n' +
            '  Option 1 — Script tag (plain HTML):\n' +
            '    <script src="node_modules/@phantomui/sdk/dist/ai-sdk.js"></script>\n\n' +
            '  Option 2 — npm install:\n' +
            '    npm install @phantomui/sdk\n' +
            '    Then in your app: import "@phantomui/sdk"  (or require("@phantomui/sdk"))\n\n' +
            'For framework-specific setup (React/Vue/Angular) see:\n' +
            '  https://github.com/ibrahim-abi/phantomui/blob/main/docs/getting-started.md',
        }],
        isError: true,
      };
    }

    const snapshot = validateSnapshot(raw);

    let text = JSON.stringify(snapshot, null, 2);
    if (snapshot.warnings && snapshot.warnings.length > 0) {
      const warningBlock =
        '⚠ Snapshot Quality Warnings:\n' +
        snapshot.warnings.map(w => `• ${w}`).join('\n') +
        '\n\n';
      text = warningBlock + text;
    }

    return {
      content: [{ type: 'text', text }],
      isError: false,
    };
  } finally {
    await page.context().close();
  }
}
