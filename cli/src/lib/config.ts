/**
 * .phantomui.json config — read/write helpers.
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

export type Framework = 'react' | 'vue' | 'angular' | 'html';
export type LlmProvider = 'anthropic' | 'ollama' | 'openai-compatible';
export type ReportFormat = 'html' | 'json' | 'junit';

export interface PhantomConfig {
  serverPath:  string;
  framework?:  Framework;
  llmProvider?: LlmProvider;
  reportDir:   string;
  reportFormat?: ReportFormat;
}

const CONFIG_FILE = '.phantomui.json';

export async function readConfig(dir = process.cwd()): Promise<PhantomConfig | null> {
  const path = resolve(dir, CONFIG_FILE);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as PhantomConfig;
}

export async function writeConfig(config: PhantomConfig, dir = process.cwd()): Promise<string> {
  const path = resolve(dir, CONFIG_FILE);
  await writeFile(path, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return path;
}

/** Detect LLM provider from env without loading the server. */
export function detectLlmProvider(): LlmProvider {
  const explicit = process.env['LLM_PROVIDER']?.toLowerCase();
  if (explicit === 'anthropic')         return 'anthropic';
  if (explicit === 'ollama')            return 'ollama';
  if (explicit === 'openai-compatible') return 'openai-compatible';
  if (process.env['ANTHROPIC_API_KEY'])              return 'anthropic';
  if (process.env['OPENAI_COMPATIBLE_BASE_URL'])     return 'openai-compatible';
  return 'ollama';
}
