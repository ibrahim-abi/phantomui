import type { TestResult } from '../types.js';

/**
 * Generates a JSON test report aggregating all run results.
 */
export function generateJsonReport(results: TestResult[]): string {
  const passed  = results.filter(r => r.status === 'passed').length;
  const failed  = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  const report = {
    generatedAt:    new Date().toISOString(),
    totalRuns:      results.length,
    passed,
    failed,
    skipped,
    totalDurationMs,
    results,
  };

  return JSON.stringify(report, null, 2);
}
