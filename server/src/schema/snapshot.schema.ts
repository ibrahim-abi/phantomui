import { z } from 'zod';

/**
 * Zod schema for a single element descriptor.
 * Mirrors ElementDescriptor in types.ts and the serializer output in sdk/src/serializer.js.
 * Any change to the SDK snapshot shape MUST be reflected here.
 */
export const ElementDescriptorSchema = z.object({
  id:       z.string().min(1, 'Element id must not be empty'),
  role:     z.enum(['input', 'action', 'display', 'nav']).nullable(),
  action:   z.string().nullable(),
  label:    z.string().nullable(),
  context:  z.string().nullable(),
  required: z.boolean(),
  state:    z.string().nullable(),
  selector: z.string().min(1, 'Selector must not be empty'),
  source:   z.enum(['manual', 'auto']),
});

export const SnapshotMetaSchema = z.object({
  manualCount: z.number().int().nonnegative(),
  autoCount:   z.number().int().nonnegative(),
  sdkVersion:  z.string(),
});

/**
 * Full UI snapshot schema — the contract between SDK and MCP server.
 */
export const UiSnapshotSchema = z.object({
  url:       z.string().nullable(),
  timestamp: z.string().datetime({ message: 'timestamp must be ISO 8601' }),
  elements:  z.array(ElementDescriptorSchema),
  meta:      SnapshotMetaSchema,
});

export type ValidatedSnapshot = z.infer<typeof UiSnapshotSchema>;

/**
 * Validates a raw snapshot object. Throws a descriptive error on failure.
 */
export function validateSnapshot(raw: unknown): ValidatedSnapshot {
  const result = UiSnapshotSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid UI snapshot:\n${issues}`);
  }
  return result.data;
}
