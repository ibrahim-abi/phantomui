import { z } from 'zod';
import { getPageWithSdk } from '../browser.js';
import { validateSnapshot } from '../schema/snapshot.schema.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ElementDescriptor } from '../types.js';

export const ListElementsSchema = z.object({
  url:         z.string().url('url must be a valid URL'),
  filter_role: z.enum(['input', 'action', 'display', 'nav']).optional(),
  filter_source: z.enum(['manual', 'auto']).optional(),
});

export type ListElementsArgs = z.infer<typeof ListElementsSchema>;

export const LIST_ELEMENTS_TOOL = {
  name: 'list_elements',
  description:
    'Returns a filtered list of UI elements from the AI SDK snapshot. ' +
    'Useful for inspecting what inputs or actions are available on a specific page ' +
    'before generating targeted test steps.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the page to inspect.',
      },
      filter_role: {
        type: 'string',
        enum: ['input', 'action', 'display', 'nav'],
        description: 'Optional: only return elements with this role.',
      },
      filter_source: {
        type: 'string',
        enum: ['manual', 'auto'],
        description: 'Optional: only return "manual" or "auto" tagged elements.',
      },
    },
    required: ['url'],
  },
};

export async function handleListElements(args: ListElementsArgs): Promise<CallToolResult> {
  const page = await getPageWithSdk(args.url);

  try {
    const raw = await page.evaluate(() => {
      const sdk = (window as any).__aiSdk;
      if (!sdk) return null;
      return sdk.getSnapshot();
    });

    if (!raw) {
      return {
        content: [{ type: 'text', text: 'AI SDK not found on page. Ensure ai-sdk.js is loaded.' }],
        isError: true,
      };
    }

    const snapshot = validateSnapshot(raw);

    let elements: ElementDescriptor[] = snapshot.elements;

    if (args.filter_role) {
      elements = elements.filter(e => e.role === args.filter_role);
    }
    if (args.filter_source) {
      elements = elements.filter(e => e.source === args.filter_source);
    }

    const summary = {
      url:      snapshot.url,
      total:    elements.length,
      elements: elements.map(e => ({
        id:       e.id,
        role:     e.role,
        label:    e.label,
        context:  e.context,
        selector: e.selector,
        source:   e.source,
        state:    e.state,
      })),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      isError: false,
    };
  } finally {
    await page.context().close();
  }
}
