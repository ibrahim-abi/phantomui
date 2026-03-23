#!/usr/bin/env node
import 'dotenv/config';
/**
 * AI-UI MCP Server — Entry Point
 *
 * Runs in stdio mode by default (for Claude Code / Claude Desktop).
 * Pass --port <n> for HTTP mode.
 *
 * Stdio usage (Claude Code):
 *   claude mcp add --transport stdio phantomui node dist/index.js
 *
 * HTTP usage:
 *   node dist/index.js --port 3100
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ALL_TOOLS } from './tools/index.js';
import {
  handleGetUiSnapshot,    GetUiSnapshotSchema,
  handleListElements,     ListElementsSchema,
  handleGenerateTests,    GenerateTestsSchema,
  handleRunTest,          RunTestSchema,
  handleGetResults,       GetResultsSchema,
  handleRetryFailed,      RetryFailedSchema,
  handleSaveReport,       SaveReportSchema,
  handleDiffSnapshots,    DiffSnapshotsSchema,
  handleRunTestsParallel, RunTestsParallelSchema,
} from './tools/index.js';

const SERVER_NAME    = 'phantomui-mcp';
const SERVER_VERSION = '0.1.1';

// ─── Parse CLI args ────────────────────────────────────────────────────────
function parseArgs(): { port?: number } {
  const args = process.argv.slice(2);
  const opts: { port?: number } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      opts.port = parseInt(args[i + 1], 10);
    }
  }
  return opts;
}

// ─── Server setup ──────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  // Dispatch tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'get_ui_snapshot': {
          const parsed = GetUiSnapshotSchema.parse(args);
          return await handleGetUiSnapshot(parsed);
        }
        case 'list_elements': {
          const parsed = ListElementsSchema.parse(args);
          return await handleListElements(parsed);
        }
        case 'generate_tests': {
          const parsed = GenerateTestsSchema.parse(args);
          return await handleGenerateTests(parsed);
        }
        case 'run_test': {
          const parsed = RunTestSchema.parse(args);
          return await handleRunTest(parsed);
        }
        case 'get_results': {
          const parsed = GetResultsSchema.parse(args);
          return await handleGetResults(parsed);
        }
        case 'retry_failed': {
          const parsed = RetryFailedSchema.parse(args);
          return await handleRetryFailed(parsed);
        }
        case 'save_report': {
          const parsed = SaveReportSchema.parse(args);
          return await handleSaveReport(parsed);
        }
        case 'diff_snapshots': {
          const parsed = DiffSnapshotsSchema.parse(args);
          return await handleDiffSnapshots(parsed);
        }
        case 'run_tests_parallel': {
          const parsed = RunTestsParallelSchema.parse(args);
          return await handleRunTestsParallel(parsed);
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Tool error [${name}]: ${message}` }],
        isError: true,
      };
    }
  });

  // ─── HTTP mode ─────────────────────────────────────────────────────────
  if (opts.port) {
    const { startHttpServer } = await import('./http.js');
    await startHttpServer(opts.port);
    return;
  }

  // ─── Stdio mode (default) ──────────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(`[phantomui-mcp] MCP server running (stdio) — ${ALL_TOOLS.length} tools registered\n`);

  // Graceful shutdown
  async function shutdown() {
    const { closeBrowser } = await import('./browser.js');
    await closeBrowser();
    process.exit(0);
  }
  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  process.stderr.write(`[phantomui-mcp] Fatal: ${err}\n`);
  process.exit(1);
});
