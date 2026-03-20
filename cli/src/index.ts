#!/usr/bin/env node
/**
 * PhantomUI CLI — entry point
 *
 * Usage:
 *   npx phantomui init
 *   npx phantomui test <url> [options]
 */

import 'dotenv/config';
import { runInit } from './commands/init.js';
import { runTest } from './commands/test.js';
import { print }   from './lib/print.js';

const [,, command, ...args] = process.argv;

function showHelp(): void {
  console.log(`
phantomui — AI-powered UI testing

USAGE
  npx phantomui <command> [options]

COMMANDS
  init                      Detect project type and configure PhantomUI
  test <url> [options]      Run AI-generated tests against a live URL

TEST OPTIONS
  --format  html|json|junit  Report format (default: html)
  --out     <path>           Report output path
  --hints   "<text>"         Prompt hint for the AI (e.g. "focus on login flow")
  --no-autotag               Disable auto-discovery of untagged elements

EXAMPLES
  npx phantomui init
  npx phantomui test http://localhost:3000/login
  npx phantomui test http://localhost:3000 --format junit --out ./reports/ci.xml
  npx phantomui test http://localhost:3000/checkout --hints "test the payment flow"
`);
}

async function main(): Promise<void> {
  switch (command) {
    case 'init':
      await runInit();
      break;

    case 'test':
      await runTest(args);
      break;

    case undefined:
    case '--help':
    case '-h':
      showHelp();
      break;

    case '--version':
    case '-v':
      console.log('0.1.0');
      break;

    default:
      print.error(`Unknown command: "${command}"`);
      showHelp();
      process.exit(1);
  }
}

main().catch(err => {
  print.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
