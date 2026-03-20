/**
 * `phantomui init` — detect project type, write .phantomui.json,
 * optionally update Claude Desktop MCP config.
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { print } from '../lib/print.js';
import { writeConfig, detectLlmProvider } from '../lib/config.js';
import { detectFramework, frameworkQuickstart } from '../lib/detect.js';
import {
  claudeDesktopConfigPath,
  claudeDesktopExists,
  addMcpEntry,
} from '../lib/claude-desktop.js';

// ─── Server path resolution ───────────────────────────────────────────────────

function findServerPath(): string | null {
  // In the monorepo: cli/ is sibling of server/
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const monoPath  = resolve(__dirname, '../../../server/dist/index.js');
  if (existsSync(monoPath)) return monoPath;

  // Installed as npm package: node_modules/@ai-ui/server/dist/index.js
  const pkgPath = resolve(process.cwd(), 'node_modules/@ai-ui/server/dist/index.js');
  if (existsSync(pkgPath)) return pkgPath;

  return null;
}

// ─── Prompt helper ────────────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) { resolve('n'); return; }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runInit(): Promise<void> {
  print.heading('PhantomUI — Project Setup');

  // 1. Detect framework
  print.step('Detecting project type…');
  const framework = await detectFramework();
  print.ok(`Framework: ${framework}`);

  // 2. Find server
  print.step('Locating MCP server…');
  const serverPath = findServerPath();
  if (!serverPath) {
    print.warn('Server not found. Run `npm run build` in the server/ directory first.');
    print.warn('Using placeholder path — edit .phantomui.json after building.');
  } else {
    print.ok(`Server: ${serverPath}`);
  }

  // 3. Detect LLM
  const llmProvider = detectLlmProvider();
  const llmNote = llmProvider === 'anthropic'
    ? 'Anthropic (ANTHROPIC_API_KEY detected)'
    : llmProvider === 'ollama'
      ? 'Ollama (local, free — see docs for setup)'
      : 'OpenAI-compatible';
  print.ok(`LLM provider: ${llmNote}`);

  // 4. Write config
  print.step('Writing .phantomui.json…');
  const config = {
    serverPath:   serverPath ?? './server/dist/index.js',
    framework,
    llmProvider,
    reportDir:    './reports',
    reportFormat: 'html' as const,
  };
  const configPath = await writeConfig(config);
  print.ok(`Written to ${configPath}`);

  // 5. Claude Desktop
  const desktopPath = claudeDesktopConfigPath();
  if (desktopPath && serverPath) {
    if (claudeDesktopExists(desktopPath)) {
      print.info(`Claude Desktop config found at:\n      ${desktopPath}`);
      const answer = await prompt('  Add PhantomUI MCP server entry? [Y/n]: ');
      if (!answer || answer.toLowerCase() !== 'n') {
        await addMcpEntry(desktopPath, serverPath);
        print.ok('MCP server entry added — restart Claude Desktop to apply.');
      } else {
        print.info('Skipped. Add manually — see docs/getting-started.md.');
      }
    } else {
      print.info('Claude Desktop config not found (Claude Desktop may not be installed).');
      print.info('To add the MCP server manually, see docs/getting-started.md.');
    }
  }

  // 6. Next steps
  print.divider();
  print.heading('Next steps:');
  console.log('  1. Add data-ai-id tags to your UI elements');
  console.log('  2. Run your app (e.g. npm run dev)');
  console.log('  3. npx phantomui test http://localhost:3000/login\n');

  if (llmProvider === 'ollama') {
    console.log('  Ollama setup:');
    console.log('    brew install ollama && ollama pull llama3.1');
    console.log('    ollama serve\n');
  } else if (llmProvider === 'anthropic' && !process.env['ANTHROPIC_API_KEY']) {
    console.log('  Set your API key:');
    console.log('    export ANTHROPIC_API_KEY=sk-ant-...\n');
  }

  console.log(frameworkQuickstart(framework));
  console.log('');
}
