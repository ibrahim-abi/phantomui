/**
 * Shared TypeScript types for the AI-UI MCP server.
 * The snapshot shape here mirrors the Zod schema in schema/snapshot.schema.ts
 * and the serializer output in sdk/src/serializer.js.
 */

export type ElementSource = 'manual' | 'auto';

export type ElementRole = 'input' | 'action' | 'display' | 'nav';

export interface ElementDescriptor {
  id:       string;
  role:     ElementRole | null;
  action:   string | null;
  label:    string | null;
  context:  string | null;
  required: boolean;
  state:    string | null;
  selector: string;
  source:   ElementSource;
}

export interface SnapshotMeta {
  manualCount: number;
  autoCount:   number;
  sdkVersion:  string;
}

export interface UiSnapshot {
  url:       string | null;
  timestamp: string;
  elements:  ElementDescriptor[];
  meta:      SnapshotMeta;
}

// ─── Test types (used in Phase 4) ────────────────────────────────────────────

export type TestStepAction = 'navigate' | 'fill' | 'click' | 'select' | 'assert' | 'wait';

export interface TestStep {
  action:      TestStepAction;
  target?:     string;   // selector or URL
  value?:      string;   // fill value or assertion text
  timeout?:    number;
  description?: string;
}

export interface TestScenario {
  name:        string;
  description: string;
  steps:       TestStep[];
}

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface StepResult {
  step:    TestStep;
  status:  TestStatus;
  error?:  string;
  durationMs: number;
}

export interface TestResult {
  runId:      string;
  scenario:   string;
  status:     TestStatus;
  steps:      StepResult[];
  startedAt:  string;
  finishedAt: string;
  durationMs: number;
  error?:     string;
}
