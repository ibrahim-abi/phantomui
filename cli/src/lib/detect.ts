/**
 * Project-type detection — reads package.json deps to identify framework.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { Framework } from './config.js';

export type { Framework };

export async function detectFramework(dir = process.cwd()): Promise<Framework> {
  const pkgPath = resolve(dir, 'package.json');
  if (!existsSync(pkgPath)) return 'html';

  try {
    const raw  = await readFile(pkgPath, 'utf-8');
    const pkg  = JSON.parse(raw) as Record<string, unknown>;
    const deps = {
      ...pkg['dependencies']    as Record<string, string> | undefined,
      ...pkg['devDependencies'] as Record<string, string> | undefined,
      ...pkg['peerDependencies'] as Record<string, string> | undefined,
    };

    if (deps['@angular/core']) return 'angular';
    if (deps['vue'])           return 'vue';
    if (deps['react'])         return 'react';
  } catch {
    // malformed package.json — fall through
  }

  return 'html';
}

export function frameworkQuickstart(framework: Framework): string {
  switch (framework) {
    case 'react':
      return [
        '  React quickstart:',
        '    import { useAiSnapshot } from \'@phantomui/sdk/adapters/react\';',
        '',
        '    function MyApp() {',
        '      const { snapshot } = useAiSnapshot();',
        '      // snapshot.elements contains all tagged UI elements',
        '    }',
      ].join('\n');

    case 'vue':
      return [
        '  Vue quickstart:',
        '    import { useAiSnapshot } from \'@phantomui/sdk/adapters/vue\';',
        '',
        '    export default {',
        '      setup() {',
        '        const { snapshot, refresh } = useAiSnapshot();',
        '        return { snapshot, refresh };',
        '      }',
        '    }',
      ].join('\n');

    case 'angular':
      return [
        '  Angular quickstart:',
        '    import { AiSdkService } from \'@phantomui/sdk/adapters/angular\';',
        '    // Add AiSdkService to providers, then inject:',
        '    constructor(private aiSdk: AiSdkService) {}',
        '    ngOnInit() { this.snapshot = this.aiSdk.getSnapshot(); }',
      ].join('\n');

    default:
      return [
        '  HTML quickstart:',
        '    <script src="node_modules/@phantomui/sdk/dist/ai-sdk.js"></script>',
        '    <script>',
        '      const snapshot = window.__aiSdk.getSnapshot();',
        '    </script>',
      ].join('\n');
  }
}
