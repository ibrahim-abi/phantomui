import type { TestResult } from '../types.js';

/** Escape user strings for safe XML output. */
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a JUnit XML report compatible with GitHub Actions, Jenkins, and GitLab CI.
 * Step duration is reported in seconds (durationMs / 1000).toFixed(3).
 */
export function generateJunitReport(results: TestResult[]): string {
  const totalTests    = results.reduce((sum, r) => sum + r.steps.length, 0);
  const totalFailures = results.reduce((sum, r) => sum + r.steps.filter(s => s.status === 'failed').length, 0);
  const totalSkipped  = results.reduce((sum, r) => sum + r.steps.filter(s => s.status === 'skipped').length, 0);
  const totalTimeMs   = results.reduce((sum, r) => sum + r.durationMs, 0);

  const parts: string[] = [];

  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<testsuites name="AI-UI Tests" tests="${totalTests}" failures="${totalFailures}" ` +
    `skipped="${totalSkipped}" time="${(totalTimeMs / 1000).toFixed(3)}">`
  );

  for (const result of results) {
    const suiteTests    = result.steps.length;
    const suiteFailures = result.steps.filter(s => s.status === 'failed').length;
    const suiteSkipped  = result.steps.filter(s => s.status === 'skipped').length;
    const suiteTime     = (result.durationMs / 1000).toFixed(3);

    parts.push(
      `  <testsuite name="${escXml(result.scenario)}" tests="${suiteTests}" ` +
      `failures="${suiteFailures}" skipped="${suiteSkipped}" time="${suiteTime}" ` +
      `timestamp="${escXml(result.startedAt)}">`
    );

    for (const step of result.steps) {
      const stepName = step.step.description ??
        `${step.step.action}${step.step.target ? ' ' + step.step.target : ''}`;
      const stepTime = (step.durationMs / 1000).toFixed(3);

      if (step.status === 'passed') {
        parts.push(`    <testcase name="${escXml(stepName)}" time="${stepTime}"/>`);
      } else if (step.status === 'skipped' || step.status === 'pending') {
        parts.push(
          `    <testcase name="${escXml(stepName)}" time="${stepTime}">` +
          `<skipped/></testcase>`
        );
      } else {
        // failed
        const msg = escXml(step.error ?? 'Step failed');
        parts.push(
          `    <testcase name="${escXml(stepName)}" time="${stepTime}">` +
          `<failure message="${msg}">${msg}</failure></testcase>`
        );
      }
    }

    parts.push(`  </testsuite>`);
  }

  parts.push(`</testsuites>`);

  return parts.join('\n');
}
