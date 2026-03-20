import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ElementDescriptor, UiSnapshot } from '../types.js';

// ─── Input schema ─────────────────────────────────────────────────────────────

const ElementDescriptorSchema = z.object({
  id:       z.string(),
  role:     z.enum(['input', 'action', 'display', 'nav']).nullable(),
  action:   z.string().nullable(),
  label:    z.string().nullable(),
  context:  z.string().nullable(),
  required: z.boolean(),
  state:    z.string().nullable(),
  selector: z.string(),
  source:   z.enum(['manual', 'auto']),
});

const SnapshotSchema = z.object({
  url:       z.string().nullable(),
  timestamp: z.string(),
  elements:  z.array(ElementDescriptorSchema),
  warnings:  z.array(z.string()).optional(),
  meta:      z.object({
    manualCount: z.number(),
    autoCount:   z.number(),
    sdkVersion:  z.string(),
  }),
});

export const DiffSnapshotsSchema = z.object({
  snapshot_a: SnapshotSchema,
  snapshot_b: SnapshotSchema,
});

export type DiffSnapshotsArgs = z.infer<typeof DiffSnapshotsSchema>;

// ─── Tool definition ──────────────────────────────────────────────────────────

export const DIFF_SNAPSHOTS_TOOL = {
  name: 'diff_snapshots',
  description:
    'Compares two UI snapshots and returns a diff showing added, removed, and changed elements. ' +
    'Use this to detect UI regressions between builds or after deployments.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      snapshot_a: {
        type: 'object',
        description: 'The baseline snapshot (before).',
      },
      snapshot_b: {
        type: 'object',
        description: 'The new snapshot (after).',
      },
    },
    required: ['snapshot_a', 'snapshot_b'],
  },
};

// ─── Diff logic ───────────────────────────────────────────────────────────────

type ChangedField = keyof Omit<ElementDescriptor, 'id'>;

interface ChangedElement {
  id:            string;
  before:        ElementDescriptor;
  after:         ElementDescriptor;
  changedFields: ChangedField[];
}

const COMPARE_FIELDS: ChangedField[] = ['role', 'action', 'label', 'context', 'required', 'state', 'selector', 'source'];

function buildMap(snapshot: UiSnapshot): Map<string, ElementDescriptor> {
  const map = new Map<string, ElementDescriptor>();
  for (const el of snapshot.elements) {
    map.set(el.id, el);
  }
  return map;
}

export async function handleDiffSnapshots(args: DiffSnapshotsArgs): Promise<CallToolResult> {
  const { snapshot_a, snapshot_b } = args;

  const mapA = buildMap(snapshot_a as UiSnapshot);
  const mapB = buildMap(snapshot_b as UiSnapshot);

  const added:   ElementDescriptor[] = [];
  const removed: ElementDescriptor[] = [];
  const changed: ChangedElement[]    = [];

  // Added: in B but not in A
  for (const [id, el] of mapB) {
    if (!mapA.has(id)) added.push(el);
  }

  // Removed: in A but not in B
  for (const [id, el] of mapA) {
    if (!mapB.has(id)) removed.push(el);
  }

  // Changed: in both but fields differ
  for (const [id, elA] of mapA) {
    const elB = mapB.get(id);
    if (!elB) continue;

    const changedFields = COMPARE_FIELDS.filter(
      field => JSON.stringify(elA[field]) !== JSON.stringify(elB[field])
    );

    if (changedFields.length > 0) {
      changed.push({ id, before: elA, after: elB, changedFields });
    }
  }

  const summaryParts: string[] = [];
  if (added.length)   summaryParts.push(`${added.length} element(s) added`);
  if (removed.length) summaryParts.push(`${removed.length} element(s) removed`);
  if (changed.length) summaryParts.push(`${changed.length} element(s) changed`);
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : 'No differences found';

  const diff = { added, removed, changed, summary };

  return {
    content: [{ type: 'text', text: JSON.stringify(diff, null, 2) }],
    isError: false,
  };
}
