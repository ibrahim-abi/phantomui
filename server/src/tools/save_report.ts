import { z } from 'zod';
import { resolve } from 'path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { generateReport, saveReport, type ReportFormat } from '../reports/index.js';
import { getRecord, listRunIds } from '../runner/store.js';
import type { TestResult } from '../types.js';

// ─── Input schema ─────────────────────────────────────────────────────────────

export const SaveReportSchema = z.object({
  run_id: z.string().optional(),
  format: z.enum(['json', 'html', 'junit']),
  path:   z.string().min(1),
});

export type SaveReportArgs = z.infer<typeof SaveReportSchema>;

// ─── Tool definition ──────────────────────────────────────────────────────────

export const SAVE_REPORT_TOOL = {
  name: 'save_report',
  description:
    'Generates a test report and saves it to disk. ' +
    'Supports json (machine-readable), html (browser view), and junit (CI/CD) formats. ' +
    'If run_id is omitted, all stored test runs are included in the report. ' +
    'Returns the resolved file path, format, byte size, and number of runs included.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      run_id: {
        type: 'string',
        description:
          'Optional. The run ID returned by run_test. ' +
          'Omit to generate a report covering all stored test runs.',
      },
      format: {
        type: 'string',
        enum: ['json', 'html', 'junit'],
        description:
          'Output format: ' +
          'json (structured data), ' +
          'html (self-contained browser report), ' +
          'junit (XML for GitHub Actions / Jenkins / GitLab CI).',
      },
      path: {
        type: 'string',
        description:
          'File path to write the report to. ' +
          'Relative paths are resolved from the current working directory. ' +
          'Example: "./reports/run.html" or "/tmp/results.xml".',
      },
    },
    required: ['format', 'path'],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function handleSaveReport(args: unknown): Promise<CallToolResult> {
  const parsed = SaveReportSchema.parse(args);

  let results: TestResult[];

  if (parsed.run_id) {
    const record = getRecord(parsed.run_id);
    if (!record) {
      return {
        content: [{ type: 'text', text: `No run found with id: ${parsed.run_id}` }],
        isError: true,
      };
    }
    results = [record.result];
  } else {
    const ids = listRunIds();
    if (ids.length === 0) {
      return {
        content: [{ type: 'text', text: 'No test runs stored. Run a test first with run_test.' }],
        isError: true,
      };
    }
    results = ids
      .map(id => getRecord(id)?.result)
      .filter((r): r is TestResult => r !== undefined);
  }

  const content = generateReport(results, parsed.format as ReportFormat);
  const absPath = resolve(parsed.path);
  await saveReport(content, absPath);

  const bytes = Buffer.byteLength(content, 'utf-8');

  const hints: Record<string, string> = {
    html:  'Open the file in a browser to view the formatted report.',
    junit: 'Use this XML with the GitHub Actions test-reporter action or Jenkins JUnit plugin.',
    json:  'Parse the JSON to inspect individual step results programmatically.',
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        path:   absPath,
        format: parsed.format,
        bytes,
        runs:   results.length,
        hint:   hints[parsed.format],
      }, null, 2),
    }],
    isError: false,
  };
}
