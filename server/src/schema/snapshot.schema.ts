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
  warnings:  z.array(z.string()).optional(),
  meta:      SnapshotMetaSchema,
});

export type ValidatedSnapshot = z.infer<typeof UiSnapshotSchema>;

const SERVER_MAJOR = 0; // must match SDK major version

/**
 * Validates a raw snapshot object. Throws a descriptive error on failure.
 * Also enforces SDK ↔ server major version compatibility.
 */
export function validateSnapshot(raw: unknown): ValidatedSnapshot {
  const result = UiSnapshotSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid UI snapshot:\n${issues}`);
  }

  const sdkVersion = result.data.meta.sdkVersion;
  const sdkMajor   = parseInt(sdkVersion.split('.')[0]!, 10);
  if (!isNaN(sdkMajor) && sdkMajor !== SERVER_MAJOR) {
    throw new Error(
      `SDK version ${sdkVersion} is incompatible with server v${SERVER_MAJOR}.x. ` +
      `Update @phantomui/sdk to a v${SERVER_MAJOR}.x release.`
    );
  }

  return result.data;
}
