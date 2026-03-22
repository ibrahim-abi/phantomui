/**
 * Result store — in-memory cache backed by disk persistence.
 * Keyed by runId. Holds both the result and the original scenario
 * so retry_failed can re-run it without the caller re-sending it.
 *
 * Persistence: JSON files in RESULT_STORE_PATH (default ~/.ai-ui/runs/)
 * LRU eviction: oldest file deleted when file count exceeds 100.
 * Webhook: if WEBHOOK_URL is set, posts result JSON after each store (fire-and-forget).
 */

import type { TestResult, TestScenario, TestStatus } from '../types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface RunRecord {
  result:   TestResult;
  scenario: TestScenario;
}

const cache = new Map<string, RunRecord>();

const storeDir = process.env['RESULT_STORE_PATH'] ?? path.join(os.homedir(), '.ai-ui', 'runs');

async function ensureDir(): Promise<void> {
  await fs.mkdir(storeDir, { recursive: true }).catch(() => {});
}

function recordPath(runId: string): string {
  return path.join(storeDir, `${runId}.json`);
}

/** Evict oldest files when count exceeds 100 */
async function evictOldest(): Promise<void> {
  try {
    const files = await fs.readdir(storeDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length <= 100) return;

    const stats = await Promise.all(
      jsonFiles.map(async f => {
        const s = await fs.stat(path.join(storeDir, f)).catch(() => null);
        return { name: f, mtime: s?.mtime?.getTime() ?? 0 };
      })
    );
    stats.sort((a, b) => a.mtime - b.mtime);
    const toDelete = stats.slice(0, stats.length - 100);
    await Promise.all(toDelete.map(f => fs.unlink(path.join(storeDir, f.name)).catch(() => {})));
  } catch {
    // eviction is best-effort
  }
}

/** Fire-and-forget webhook post */
function fireWebhook(result: TestResult): void {
  const webhookUrl = process.env['WEBHOOK_URL'];
  if (!webhookUrl) return;
  fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(result),
  }).catch(err => {
    process.stderr.write(`[store] webhook error: ${err}\n`);
  });
}

export function storeResult(result: TestResult, scenario: TestScenario): void {
  cache.set(result.runId, { result, scenario });

  // Persist to disk (fire-and-forget)
  (async () => {
    try {
      await ensureDir();
      await fs.writeFile(recordPath(result.runId), JSON.stringify({ result, scenario }), 'utf8');
      await evictOldest();
    } catch (err) {
      process.stderr.write(`[store] persist error: ${err}\n`);
    }
  })();

  // Fire webhook
  fireWebhook(result);
}

export async function getRecord(runId: string): Promise<RunRecord | undefined> {
  // Hot cache
  const cached = cache.get(runId);
  if (cached) return cached;

  // Disk fallback
  try {
    const raw    = await fs.readFile(recordPath(runId), 'utf8');
    const parsed = JSON.parse(raw) as RunRecord;
    cache.set(runId, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

/** Synchronous cache-only read (for backwards compat with sync callers) */
export function getRecordSync(runId: string): RunRecord | undefined {
  return cache.get(runId);
}

export async function listRunIds(): Promise<string[]> {
  const inMemory = [...cache.keys()];
  try {
    await ensureDir();
    const files   = await fs.readdir(storeDir);
    const onDisk  = files.filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
    return [...new Set([...inMemory, ...onDisk])];
  } catch {
    return inMemory;
  }
}

export interface RunSummary {
  runId:       string;
  scenario:    string;
  status:      TestStatus;
  durationMs:  number;
  startedAt:   string;
  finishedAt:  string;
  stepCount:   number;
  passedSteps: number;
  failedSteps: number;
}

export async function listRunSummaries(): Promise<RunSummary[]> {
  const ids = await listRunIds();
  const summaries: RunSummary[] = [];
  for (const id of ids) {
    const record = await getRecord(id);
    if (!record) continue;
    const r = record.result;
    summaries.push({
      runId:       r.runId,
      scenario:    r.scenario,
      status:      r.status,
      durationMs:  r.durationMs,
      startedAt:   r.startedAt,
      finishedAt:  r.finishedAt,
      stepCount:   r.steps.length,
      passedSteps: r.steps.filter(s => s.status === 'passed').length,
      failedSteps: r.steps.filter(s => s.status === 'failed').length,
    });
  }
  summaries.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return summaries;
}

export function deleteRecord(runId: string): void {
  cache.delete(runId);
  fs.unlink(recordPath(runId)).catch(() => {});
}
