/**
 * Express HTTP REST API for AI-UI MCP Server.
 *
 * Routes:
 *   GET  /                 → dashboard UI
 *   GET  /health           → server info + uptime
 *   GET  /runs             → list all test runs with summary data
 *   POST /snapshot         → capture UI snapshot from a URL
 *   POST /run              → execute a test scenario
 *   GET  /results/:runId   → fetch stored test result
 *   POST /report           → generate report (json | html | junit)
 */

import express, { Request, Response, NextFunction } from 'express';
import { getRecord, listRunIds, listRunSummaries } from './runner/store.js';
import { renderDashboard } from './dashboard.js';
import { executeScenario } from './runner/executor.js';
import { generateReport, type ReportFormat } from './reports/index.js';
import type { TestResult } from './types.js';

const SERVER_NAME    = 'phantomui-mcp';
const SERVER_VERSION = '0.1.1';

export async function startHttpServer(port: number): Promise<void> {
  const app = express();

  // ── 1. JSON body parser ────────────────────────────────────────────────────
  app.use(express.json());

  // ── 2. CORS ───────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Tenant-ID');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
  });

  // ── 3. Tenant extractor ───────────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals['tenantId'] = req.headers['x-tenant-id'] ?? 'default';
    next();
  });

  // ── Routes ────────────────────────────────────────────────────────────────

  /** Dashboard UI */
  app.get('/', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(renderDashboard());
  });

  /** Health check */
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      server:  SERVER_NAME,
      version: SERVER_VERSION,
      status:  'ok',
      uptime:  process.uptime(),
    });
  });

  /** List all test runs with lightweight summary data */
  app.get('/runs', async (_req: Request, res: Response) => {
    try {
      const runs = await listRunSummaries();
      res.json({ runs });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** Capture a UI snapshot from a live URL */
  app.post('/snapshot', async (req: Request, res: Response) => {
    const { url, autoTag, auth_token } = req.body as {
      url?: string;
      autoTag?: boolean;
      auth_token?: string;
    };

    if (!url) {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    try {
      const { handleGetUiSnapshot } = await import('./tools/get_ui_snapshot.js');
      const result = await handleGetUiSnapshot({ url, autoTag: autoTag ?? true, auth_token });

      if (result.isError) {
        const text = (result.content[0] as { type: string; text: string }).text;
        res.status(500).json({ error: text });
        return;
      }

      const text = (result.content[0] as { type: string; text: string }).text;
      res.json(JSON.parse(text));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** Run a test scenario */
  app.post('/run', async (req: Request, res: Response) => {
    const { scenario, session } = req.body as { scenario?: unknown; session?: unknown };

    if (!scenario) {
      res.status(400).json({ error: 'scenario is required' });
      return;
    }

    try {
      const result = await executeScenario(scenario as any, session as any);
      res.json({
        runId:  result.runId,
        status: result.status,
        steps:  result.steps,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** Fetch a stored test result by runId */
  app.get('/results/:runId', async (req: Request, res: Response) => {
    const runId  = String(req.params['runId']);
    const record = await getRecord(runId);
    if (!record) {
      res.status(404).json({ error: `Run not found: ${runId}` });
      return;
    }
    res.json(record.result);
  });

  /** Generate a report for a stored run (or all runs) */
  app.post('/report', async (req: Request, res: Response) => {
    const { runId, format } = req.body as { runId?: string; format?: string };

    if (!format || !['json', 'html', 'junit'].includes(format)) {
      res.status(400).json({ error: 'format must be one of: json, html, junit' });
      return;
    }

    let results: TestResult[];

    if (runId) {
      const record = await getRecord(runId);
      if (!record) {
        res.status(404).json({ error: `Run not found: ${runId}` });
        return;
      }
      results = [record.result];
    } else {
      const ids = await listRunIds();
      const records = await Promise.all(ids.map(id => getRecord(id)));
      results = records.map(r => r?.result).filter((r): r is TestResult => r !== undefined);

      if (results.length === 0) {
        res.status(404).json({ error: 'No test runs stored. Run a test first via POST /run.' });
        return;
      }
    }

    const content = generateReport(results, format as ReportFormat);

    const contentType =
      format === 'html'  ? 'text/html' :
      format === 'junit' ? 'application/xml' :
                           'application/json';

    res.setHeader('Content-Type', contentType);
    res.send(content);
  });

  // ── 4. Error handler (4 params required by Express) ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    process.stderr.write(`[phantomui-mcp] HTTP error: ${err.message}\n`);
    res.status(500).json({ error: err.message });
  });

  // ── Start listening ────────────────────────────────────────────────────────
  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      process.stderr.write(`[phantomui-mcp] HTTP server listening on http://localhost:${port}\n`);
      resolve();
    });
  });
}
