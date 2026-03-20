// @phantomui/sdk v0.1.1 — TypeScript declarations

export type ElementRole = 'input' | 'action' | 'display' | 'nav';
export type ElementSource = 'manual' | 'auto';

export interface ElementDescriptor {
  /** Stable unique identifier (data-ai-id) */
  id: string;
  /** Semantic role of the element */
  role: ElementRole | null;
  /** What the element does, e.g. "submits login form" */
  action: string | null;
  /** Human-readable label */
  label: string | null;
  /** Parent section / form this element belongs to */
  context: string | null;
  /** Whether the field is required */
  required: boolean;
  /** Current state: disabled | loading | active | empty */
  state: string | null;
  /** CSS selector to target this element */
  selector: string;
  /** How the element was discovered */
  source: ElementSource;
}

export interface SnapshotMeta {
  manualCount: number;
  autoCount: number;
  sdkVersion: string;
}

export interface UiSnapshot {
  /** Page URL at capture time, or null if unavailable */
  url: string | null;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** All discovered elements (manual + auto) */
  elements: ElementDescriptor[];
  meta: SnapshotMeta;
}

export interface SnapshotOptions {
  /** Root node to scan. Defaults to document. */
  root?: Document | Element;
  /** Include auto-tagged elements. Defaults to true. */
  autoTag?: boolean;
}

/** Capture the current UI snapshot from the DOM */
export declare function getSnapshot(options?: SnapshotOptions): UiSnapshot;

/** SDK version string */
export declare const version: string;

declare const aiSdk: {
  getSnapshot: typeof getSnapshot;
  version: string;
};

export default aiSdk;
