#!/usr/bin/env node
/**
 * Build script for @ai-ui/sdk
 *
 * Outputs:
 *   dist/index.cjs          — CommonJS bundle (Node / bundlers)
 *   dist/index.mjs          — ES Module bundle (Vite / webpack / rollup)
 *   dist/ai-sdk.js          — IIFE browser bundle (<script> tag)
 *   dist/index.d.ts         — TypeScript declarations
 *   dist/adapters/react.js  — React adapter (CJS)
 *   dist/adapters/react.d.ts
 *   dist/adapters/vue.js    — Vue 3 adapter (CJS)
 *   dist/adapters/vue.d.ts
 *   dist/adapters/angular.js — Angular adapter (CJS)
 *   dist/adapters/angular.d.ts
 */

const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const pkg     = require(path.join(root, 'package.json'));
const VERSION = pkg.version;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function write(relPath, content) {
  const full = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
  console.log(`  ✔ dist/${relPath} (${kb} KB)`);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, 'src', relPath), 'utf-8');
}

// ─── Shared inline core (used by CJS, ESM, IIFE) ─────────────────────────────

const CORE = `
  var VERSION = '${VERSION}';

  var ATTRS = {
    ID:       'data-ai-id',
    ROLE:     'data-ai-role',
    ACTION:   'data-ai-action',
    LABEL:    'data-ai-label',
    CONTEXT:  'data-ai-context',
    REQUIRED: 'data-ai-required',
    STATE:    'data-ai-state',
  };

  function scan(root) {
    var nodes = root.querySelectorAll('[' + ATTRS.ID + ']');
    return Array.from(nodes).map(function (el) {
      var id = el.getAttribute(ATTRS.ID);
      return {
        id:       id,
        role:     el.getAttribute(ATTRS.ROLE)     || null,
        action:   el.getAttribute(ATTRS.ACTION)   || null,
        label:    el.getAttribute(ATTRS.LABEL)    || (el.textContent ? el.textContent.trim() : null) || null,
        context:  el.getAttribute(ATTRS.CONTEXT)  || null,
        required: el.getAttribute(ATTRS.REQUIRED) === 'true',
        state:    el.getAttribute(ATTRS.STATE)    || null,
        selector: "[data-ai-id='" + id + "']",
        source:   'manual',
      };
    });
  }

  var HEURISTICS = [
    { selector: 'input:not([type="hidden"]), textarea, select', role: 'input'   },
    { selector: 'button, [type="submit"], [type="button"], [type="reset"]', role: 'action'  },
    { selector: 'a[href]',                                                  role: 'nav'     },
    { selector: 'h1, h2, h3, h4, h5, h6',                                  role: 'display' },
  ];

  function autoTag(root) {
    var tagged  = new Set(Array.from(root.querySelectorAll('[data-ai-id]')));
    var results = [];
    var counter = 0;
    var seen    = new Set();
    for (var i = 0; i < HEURISTICS.length; i++) {
      var rule  = HEURISTICS[i];
      var nodes = root.querySelectorAll(rule.selector);
      for (var j = 0; j < nodes.length; j++) {
        var el = nodes[j];
        if (tagged.has(el) || seen.has(el)) continue;
        seen.add(el); counter++;
        results.push({
          id:       'auto-' + rule.role + '-' + counter,
          role:     rule.role,
          action:   rule.role === 'action' ? deriveAction(el) : null,
          label:    deriveLabel(el),
          context:  null,
          required: el.hasAttribute('required'),
          state:    el.disabled ? 'disabled' : null,
          selector: buildSelector(el),
          source:   'auto',
        });
      }
    }
    return results;
  }

  function deriveAction(el) {
    var t = el.getAttribute('type');
    if (t === 'submit') return 'submit';
    if (t === 'reset')  return 'reset';
    return 'click';
  }

  function deriveLabel(el) {
    var label = el.getAttribute('aria-label')  ||
                el.getAttribute('placeholder') ||
                el.getAttribute('title')       ||
                el.getAttribute('alt');
    if (label) return label.trim();
    return el.textContent ? el.textContent.trim() : null;
  }

  function buildSelector(el) {
    var tag = el.tagName.toLowerCase();
    if (el.id) return '#' + el.id;
    var name = el.getAttribute('name');
    if (name) return tag + '[name="' + name + '"]';
    if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\\s+/).join('.');
      if (cls) return tag + '.' + cls;
    }
    return tag;
  }

  function serialize(manual, auto, globalScope) {
    var url = null;
    try { url = (globalScope || (typeof window !== 'undefined' ? window : null)).location.href; } catch(e) {}
    return {
      url:       url,
      timestamp: new Date().toISOString(),
      elements:  manual.concat(auto),
      meta: { manualCount: manual.length, autoCount: auto.length, sdkVersion: VERSION },
    };
  }

  function getSnapshot(options) {
    options = options || {};
    var root   = options.root   || (typeof document !== 'undefined' ? document : null);
    var doAuto = options.autoTag !== false;
    if (!root) throw new Error('[ai-sdk] No DOM root available. Pass options.root or run in a browser.');
    return serialize(scan(root), doAuto ? autoTag(root) : []);
  }
`;

const BANNER = `/*!
 * @ai-ui/sdk v${VERSION}
 * Zero-dependency SDK for AI-powered UI testing.
 * https://github.com/ibrahim-abi/phantomui
 * (c) Muhammad Ibrahim — MIT License
 */`;

// ─── 1. CJS bundle ───────────────────────────────────────────────────────────

write('index.cjs', `${BANNER}
'use strict';
${CORE}
var aiSdk = { version: VERSION, getSnapshot: getSnapshot };
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__aiSdk = aiSdk;
}
module.exports = aiSdk;
module.exports.default = aiSdk;
module.exports.getSnapshot = getSnapshot;
module.exports.version = VERSION;
`);

// ─── 2. ESM bundle ───────────────────────────────────────────────────────────

write('index.mjs', `${BANNER}
${CORE}
var aiSdk = { version: VERSION, getSnapshot: getSnapshot };
if (typeof window !== 'undefined') {
  try {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
      window.__aiSdk = aiSdk;
    }
  } catch(e) {}
}
export { getSnapshot, VERSION as version };
export default aiSdk;
`);

// ─── 3. IIFE browser bundle ──────────────────────────────────────────────────

write('ai-sdk.js', `${BANNER}
(function (global) {
  'use strict';
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') return;
  } catch(e) {}
${CORE}
  global.__aiSdk = { version: VERSION, getSnapshot: getSnapshot };
}(typeof window !== 'undefined' ? window : this));
`);

// ─── 4. TypeScript declarations ──────────────────────────────────────────────

write('index.d.ts', `// @ai-ui/sdk v${VERSION} — TypeScript declarations

export type ElementRole = 'input' | 'action' | 'display' | 'nav';
export type ElementSource = 'manual' | 'auto';

export interface ElementDescriptor {
  /** Stable unique identifier (data-ai-id) */
  id: string;
  /** Semantic role of the element */
  role: ElementRole | null;
  /** What the element does, e.g. "submits login form" */
  action: string | null;
  /** Human-readable label */
  label: string | null;
  /** Parent section / form this element belongs to */
  context: string | null;
  /** Whether the field is required */
  required: boolean;
  /** Current state: disabled | loading | active | empty */
  state: string | null;
  /** CSS selector to target this element */
  selector: string;
  /** How the element was discovered */
  source: ElementSource;
}

export interface SnapshotMeta {
  manualCount: number;
  autoCount: number;
  sdkVersion: string;
}

export interface UiSnapshot {
  /** Page URL at capture time, or null if unavailable */
  url: string | null;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** All discovered elements (manual + auto) */
  elements: ElementDescriptor[];
  meta: SnapshotMeta;
}

export interface SnapshotOptions {
  /** Root node to scan. Defaults to document. */
  root?: Document | Element;
  /** Include auto-tagged elements. Defaults to true. */
  autoTag?: boolean;
}

/** Capture the current UI snapshot from the DOM */
export declare function getSnapshot(options?: SnapshotOptions): UiSnapshot;

/** SDK version string */
export declare const version: string;

declare const aiSdk: {
  getSnapshot: typeof getSnapshot;
  version: string;
};

export default aiSdk;
`);

// ─── 5. React adapter ────────────────────────────────────────────────────────

const reactSrc = read('adapters/react.js');
write('adapters/react.js', `${BANNER}\n${reactSrc}`);

write('adapters/react.d.ts', `// @ai-ui/sdk/adapters/react — TypeScript declarations
import type { UiSnapshot, SnapshotOptions } from '../index';

export interface UseAiSnapshotOptions extends SnapshotOptions {
  /** If true, don't snapshot on mount; wait for refresh() */
  lazy?: boolean;
}

export interface UseAiSnapshotResult {
  /** Current snapshot, or null before first capture */
  snapshot: UiSnapshot | null;
  /** Re-capture the snapshot */
  refresh: () => void;
  /** True after the first successful capture */
  isReady: boolean;
}

/**
 * React hook — captures a UI snapshot and refreshes on demand.
 *
 * @example
 * const { snapshot, refresh } = useAiSnapshot();
 */
export declare function useAiSnapshot(options?: UseAiSnapshotOptions): UseAiSnapshotResult;
`);

// ─── 6. Vue adapter ──────────────────────────────────────────────────────────

const vueSrc = read('adapters/vue.js');
write('adapters/vue.js', `${BANNER}\n${vueSrc}`);

write('adapters/vue.d.ts', `// @ai-ui/sdk/adapters/vue — TypeScript declarations
import type { App, Ref } from 'vue';
import type { UiSnapshot, SnapshotOptions } from '../index';

export interface UseAiSnapshotOptions extends SnapshotOptions {
  lazy?: boolean;
}

export interface UseAiSnapshotResult {
  snapshot: Ref<UiSnapshot | null>;
  refresh: () => void;
  isReady: Ref<boolean>;
}

/**
 * Vue 3 composable — captures a UI snapshot and refreshes on demand.
 *
 * @example
 * const { snapshot, refresh } = useAiSnapshot();
 */
export declare function useAiSnapshot(options?: UseAiSnapshotOptions): UseAiSnapshotResult;

/**
 * Vue plugin — registers \`$aiSdk\` on every component instance.
 *
 * @example
 * app.use(AiSdkPlugin)
 * // then in any component: this.$aiSdk.getSnapshot()
 */
export declare const AiSdkPlugin: { install(app: App, options?: SnapshotOptions): void };
`);

// ─── 7. Angular adapter ──────────────────────────────────────────────────────

const angularSrc = read('adapters/angular.js');
write('adapters/angular.js', `${BANNER}\n${angularSrc}`);

write('adapters/angular.d.ts', `// @ai-ui/sdk/adapters/angular — TypeScript declarations
import type { UiSnapshot, SnapshotOptions } from '../index';

/** Injectable Angular service for capturing UI snapshots */
export declare class AiSdkService {
  /** Capture current UI snapshot */
  getSnapshot(options?: SnapshotOptions): UiSnapshot;
  readonly version: string;
}
`);

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n@ai-ui/sdk v${VERSION} built successfully.\n`);
