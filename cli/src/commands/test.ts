/**
 * `phantomui test <url>` — the core promise in one command.
 *
 * Flow:
 *   1. Capture UI snapshot via Playwright + PhantomUI SDK
 *   2. Generate test scenarios with the configured LLM
 *   3. Execute each scenario with Playwright
 *   4. Write an HTML (or JSON/JUnit) report
 *   5. Exit 0 (all pass) or 1 (any fail) — CI-friendly
 *
 * Usage:
 *   phantomui test <url>
 *   phantomui test <url> --format junit --out ./reports/results.xml
 *   phantomui test <url> --hints "focus on the login flow"
 *   phantomui test <url> --no-autotag
 */

import { resolve }         from 'path';
import { print }           from '../lib/print.js';
import { readConfig }      from '../lib/config.js';
import type { ReportFormat } from '../lib/config.js';

// Imported from the server workspace — no extra execution logic needed.
import { handleGetUiSnapshot }           from '@ai-ui/server/tools/snapshot';
import { generateTests }                 from '@ai-ui/server/generator';
import { executeScenario }               from '@ai-ui/server/executor';
import { generateReport, saveReport }    from '@ai-ui/server/reports';
import { closeBrowser }                  from '@ai-ui/server/browser';
import type { TestResult, TestScenario } from '@ai-ui/server/types';

// ─── Arg parsing ──────────────────────────────────────────────────────────────

interface TestArgs {
  url:       string;
  outPath:   string | null;
  format:    ReportFormat;
  hints:     string | undefined;
  autoTag:   boolean;
}

function parseTestArgs(rawArgs: string[]): TestArgs {
  const url = rawArgs.find(a => !a.startsWith('-'));
  if (!url) {
    print.error('Usage: phantomui test <url> [--format html|json|junit] [--out <path>] [--hints "..."]');
    process.exit(1);
  }

  const flag = (name: string) => {
    const idx = rawArgs.indexOf(name);
    return idx >= 0 ? rawArgs[idx + 1] : null;
  };

  const format = (flag('--format') ?? 'html') as ReportFormat;
  if (!['html', 'json', 'junit'].includes(format)) {
    print.error(`--format must be one of: html, json, junit`);
    process.exit(1);
  }

  return {
    url,
    outPath:  flag('--out'),
    format,
    hints:    flag('--hints') ?? undefined,
    autoTag:  !rawArgs.includes('--no-autotag'),
  };
}

// ─── Report path generation ───────────────────────────────────────────────────

function defaultReportPath(url: string, format: ReportFormat): string {
  const ext = format === 'junit' ? 'xml' : format;
  const slug = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `./reports/${slug}-${ts}.${ext}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runTest(rawArgs: string[]): Promise<void> {
  const args = parseTestArgs(rawArgs);

  // Load config (optional — CLI works without .phantomui.json)
  const config = await readConfig();

  print.heading(`PhantomUI — Testing ${args.url}`);

  const results: TestResult[] = [];
  let snapshotElementCount = 0;

  try {
    // ── 1. Snapshot ──────────────────────────────────────────────────────────
    print.step(`Capturing snapshot…`);

    const snapshotResult = await handleGetUiSnapshot({
      url:     args.url,
      autoTag: args.autoTag,
    });

    if (snapshotResult.isError) {
      const msg = (snapshotResult.content[0] as { text: string }).text;
      print.error(msg);
      process.exit(1);
    }

    const snapshot = JSON.parse((snapshotResult.content[0] as { text: string }).text);
    snapshotElementCount = snapshot.elements.length;

    print.ok(
      `Snapshot captured — ${snapshotElementCount} elements ` +
      `(${snapshot.meta.manualCount} manual, ${snapshot.meta.autoCount} auto)`
    );

    if (snapshot.warnings?.length) {
      for (const w of snapshot.warnings as string[]) {
        print.warn(w);
      }
    }

    if (snapshotElementCount === 0) {
      print.warn('No elements found. Add data-ai-id tags or enable --autotag.');
      print.warn('See docs/getting-started.md for tagging instructions.');
      process.exit(0);
    }

    // ── 2. Generate tests ─────────────────────────────────────────────────────
    print.step('Generating test scenarios with AI…');

    const genResult = await generateTests(snapshot, args.hints);

    if (genResult.scenarios.length === 0) {
      print.warn('AI generated 0 scenarios. Try adding --hints to guide generation.');
      process.exit(0);
    }

    const tokenNote = genResult.promptTokens > 0
      ? ` (${genResult.promptTokens} in / ${genResult.outputTokens} out tokens)`
      : '';

    print.ok(
      `Generated ${genResult.scenarios.length} scenario${genResult.scenarios.length !== 1 ? 's' : ''}` +
      ` with ${genResult.model}${tokenNote}`
    );

    if (genResult.rejected.length > 0) {
      print.warn(`${genResult.rejected.length} scenario(s) rejected by validator — check AI output`);
    }

    // ── 3. Execute scenarios ─────────────────────────────────────────────────
    console.log('');

    for (const scenario of genResult.scenarios as TestScenario[]) {
      print.step(`Running: ${scenario.name}…`);

      const result = await executeScenario(scenario);
      results.push(result);

      if (result.status === 'passed') {
        print.ok(`Passed  (${(result.durationMs / 1000).toFixed(1)}s)`);
      } else {
        const failedStep = result.steps.find(s => s.status === 'failed');
        const stepNum    = failedStep ? result.steps.indexOf(failedStep) + 1 : '?';
        const stepErr    = failedStep?.error ?? result.error ?? 'unknown error';
        print.fail(`Failed at step ${stepNum} — ${stepErr}`);
      }
    }

  } finally {
    // Always close the shared browser, even on error
    await closeBrowser();
  }

  // ── 4. Write report ──────────────────────────────────────────────────────────
  const reportFormat = args.format ?? config?.reportFormat ?? 'html';
  const reportDir    = config?.reportDir ?? './reports';
  const reportPath   = args.outPath ?? defaultReportPath(args.url, reportFormat);
  const absReport    = resolve(reportPath);

  const reportContent = generateReport(results, reportFormat);
  await saveReport(reportContent, absReport);

  // ── 5. Summary ───────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.status === 'passed').length;
  const failed  = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

  console.log('');
  print.divider();

  const statusLine = [
    failed  > 0 ? `${failed} failed`   : null,
    passed  > 0 ? `${passed} passed`   : null,
    skipped > 0 ? `${skipped} skipped` : null,
  ].filter(Boolean).join(', ') || 'no results';

  if (failed > 0) {
    print.fail(`Results: ${statusLine}  (${(totalMs / 1000).toFixed(1)}s)`);
  } else {
    print.ok(`Results: ${statusLine}  (${(totalMs / 1000).toFixed(1)}s)`);
  }

  print.info(`Report:  ${absReport}`);

  if (reportFormat === 'html') {
    print.info(`Open with: open "${absReport}"`);
  }

  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}
