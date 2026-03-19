import type { TestResult } from '../types.js';

/** Escape user strings to prevent XSS in HTML output. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a self-contained HTML test report (inline CSS, no external deps).
 */
export function generateHtmlReport(results: TestResult[]): string {
  const passed          = results.filter(r => r.status === 'passed').length;
  const failed          = results.filter(r => r.status === 'failed').length;
  const skipped         = results.filter(r => r.status === 'skipped').length;
  const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  const parts: string[] = [];

  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI-UI Test Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
  .header { background: #1a1a2e; color: #fff; padding: 24px 32px; }
  .header h1 { font-size: 1.5rem; font-weight: 600; }
  .header .sub { font-size: 0.875rem; color: #aaa; margin-top: 4px; }
  .summary { display: flex; gap: 16px; padding: 24px 32px; flex-wrap: wrap; }
  .card { background: #fff; border-radius: 8px; padding: 16px 24px; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .card .label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: .05em; }
  .card .value { font-size: 2rem; font-weight: 700; margin-top: 4px; }
  .card.total .value { color: #1a1a2e; }
  .card.pass  .value { color: #16a34a; }
  .card.fail  .value { color: #dc2626; }
  .card.skip  .value { color: #d97706; }
  .card.dur   .value { font-size: 1.25rem; color: #555; }
  .scenarios { padding: 0 32px 32px; display: flex; flex-direction: column; gap: 16px; }
  .scenario { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); overflow: hidden; }
  .scenario-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #eee; }
  .scenario-header h2 { font-size: 1rem; font-weight: 600; flex: 1; }
  .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 10px; border-radius: 12px; text-transform: uppercase; }
  .badge.passed  { background: #dcfce7; color: #16a34a; }
  .badge.failed  { background: #fee2e2; color: #dc2626; }
  .badge.skipped { background: #fef3c7; color: #d97706; }
  .badge.pending { background: #f3f4f6; color: #6b7280; }
  .meta { font-size: 0.75rem; color: #888; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: #666; padding: 10px 20px; background: #fafafa; border-bottom: 1px solid #eee; }
  td { padding: 10px 20px; font-size: 0.875rem; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .icon-pass { color: #16a34a; font-weight: 700; }
  .icon-fail { color: #dc2626; font-weight: 700; }
  .icon-skip { color: #d97706; }
  .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 4px; }
  code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 0.8rem; font-family: 'SFMono-Regular', Consolas, monospace; }
</style>
</head>
<body>
<div class="header">
  <h1>AI-UI Test Report</h1>
  <div class="sub">Generated at ${escHtml(new Date().toISOString())}</div>
</div>
<div class="summary">
  <div class="card total"><div class="label">Total Runs</div><div class="value">${results.length}</div></div>
  <div class="card pass"><div class="label">Passed</div><div class="value">${passed}</div></div>
  <div class="card fail"><div class="label">Failed</div><div class="value">${failed}</div></div>
  <div class="card skip"><div class="label">Skipped</div><div class="value">${skipped}</div></div>
  <div class="card dur"><div class="label">Duration</div><div class="value">${(totalDurationMs / 1000).toFixed(2)}s</div></div>
</div>
<div class="scenarios">`);

  for (const result of results) {
    const stepsPassed  = result.steps.filter(s => s.status === 'passed').length;
    const stepsFailed  = result.steps.filter(s => s.status === 'failed').length;
    const stepsSkipped = result.steps.filter(s => s.status === 'skipped').length;

    parts.push(`<div class="scenario">
  <div class="scenario-header">
    <h2>${escHtml(result.scenario)}</h2>
    <span class="badge ${escHtml(result.status)}">${escHtml(result.status)}</span>
    <span class="meta">${(result.durationMs / 1000).toFixed(2)}s &nbsp;|&nbsp; ✓&nbsp;${stepsPassed} &nbsp;✗&nbsp;${stepsFailed} &nbsp;—&nbsp;${stepsSkipped}</span>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Action</th><th>Target / Value</th><th>Status</th><th>Duration</th></tr>
    </thead>
    <tbody>`);

    result.steps.forEach((step, i) => {
      const icon =
        step.status === 'passed'  ? '<span class="icon-pass">✓</span>' :
        step.status === 'failed'  ? '<span class="icon-fail">✗</span>' :
                                    '<span class="icon-skip">—</span>';

      const target    = step.step.target ? `<code>${escHtml(step.step.target)}</code>` : '';
      const value     = step.step.value  ? ` = ${escHtml(step.step.value)}` : '';
      const desc      = step.step.description ? escHtml(step.step.description) : '';
      const errorHtml = step.error ? `<div class="error-msg">${escHtml(step.error)}</div>` : '';

      parts.push(`      <tr>
        <td>${i + 1}</td>
        <td><strong>${escHtml(step.step.action)}</strong>${desc ? `<div class="meta">${desc}</div>` : ''}</td>
        <td>${target}${value}${errorHtml}</td>
        <td>${icon}</td>
        <td class="meta">${step.durationMs}ms</td>
      </tr>`);
    });

    parts.push(`    </tbody>
  </table>
</div>`);
  }

  parts.push(`</div>
</body>
</html>`);

  return parts.join('\n');
}
