import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import type { TestResult } from '../types.js';
import { generateJsonReport }  from './json.js';
import { generateHtmlReport }  from './html.js';
import { generateJunitReport } from './junit.js';

export type ReportFormat = 'json' | 'html' | 'junit';

export { generateJsonReport }  from './json.js';
export { generateHtmlReport }  from './html.js';
export { generateJunitReport } from './junit.js';

/**
 * Generate a report string in the requested format.
 */
export function generateReport(results: TestResult[], format: ReportFormat): string {
  switch (format) {
    case 'json':  return generateJsonReport(results);
    case 'html':  return generateHtmlReport(results);
    case 'junit': return generateJunitReport(results);
  }
}

/**
 * Write report content to disk, creating parent directories as needed.
 */
export async function saveReport(content: string, filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}
