/**
 * In-memory result store.
 * Keyed by runId. Holds both the result and the original scenario
 * so retry_failed can re-run it without the caller re-sending it.
 */

import type { TestResult, TestScenario } from '../types.js';

interface RunRecord {
  result:   TestResult;
  scenario: TestScenario;
}

const store = new Map<string, RunRecord>();

export function storeResult(result: TestResult, scenario: TestScenario): void {
  store.set(result.runId, { result, scenario });
}

export function getRecord(runId: string): RunRecord | undefined {
  return store.get(runId);
}

export function listRunIds(): string[] {
  return [...store.keys()];
}

export function deleteRecord(runId: string): void {
  store.delete(runId);
}
