/**
 * Claude Desktop config — detect location and add MCP server entry.
 *
 * Config paths by platform:
 *   macOS:   ~/Library/Application Support/Claude/claude_desktop_config.json
 *   Windows: %APPDATA%\Claude\claude_desktop_config.json
 *   Linux:   ~/.config/Claude/claude_desktop_config.json
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

export function claudeDesktopConfigPath(): string | null {
  const home = homedir();

  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': {
      const appData = process.env['APPDATA'] ?? join(home, 'AppData', 'Roaming');
      return join(appData, 'Claude', 'claude_desktop_config.json');
    }
    default:
      return join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Returns true if the config file exists on disk.
 */
export function claudeDesktopExists(configPath: string): boolean {
  return existsSync(configPath);
}

/**
 * Adds or updates the PhantomUI MCP server entry in the Claude Desktop config.
 * Creates the file (with empty config) if it doesn't exist.
 */
export async function addMcpEntry(configPath: string, serverDistPath: string): Promise<void> {
  let config: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    const raw = await readFile(configPath, 'utf-8');
    try { config = JSON.parse(raw); } catch { /* ignore parse errors, overwrite safely */ }
  }

  if (!config['mcpServers'] || typeof config['mcpServers'] !== 'object') {
    config['mcpServers'] = {};
  }

  (config['mcpServers'] as Record<string, unknown>)['phantomui'] = {
    command: 'node',
    args:    [serverDistPath],
  };

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
