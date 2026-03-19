/**
 * Unit tests for the AI-UI SDK (scanner, autotagger, serializer).
 * Uses jsdom to provide a DOM environment and createRequire to load the CJS SDK.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// Point at the SDK source (CommonJS)
const sdkRoot = resolve(__dirname, '../../../sdk/src');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWindow(html: string) {
  const dom = new JSDOM(html);
  return dom.window;
}

// ─── scanner ─────────────────────────────────────────────────────────────────

describe('scanner', () => {
  const scanner = require(`${sdkRoot}/scanner`);

  test('finds all data-ai-id elements and marks source as manual', () => {
    const win = makeWindow(`
      <html><body>
        <input data-ai-id="email" data-ai-role="input" data-ai-label="Email" />
        <button data-ai-id="submit" data-ai-role="action" data-ai-label="Submit">Go</button>
      </body></html>
    `);
    const elements = scanner.scan(win.document);
    assert.equal(elements.length, 2);
    assert.ok(elements.every((e: any) => e.source === 'manual'));
    assert.ok(elements.some((e: any) => e.id === 'email'));
    assert.ok(elements.some((e: any) => e.id === 'submit'));
  });

  test('returns empty array when no tagged elements', () => {
    const win = makeWindow('<html><body><p>Hello</p></body></html>');
    const elements = scanner.scan(win.document);
    assert.equal(elements.length, 0);
  });
});

// ─── autotagger ───────────────────────────────────────────────────────────────

describe('autotagger', () => {
  const autotagger = require(`${sdkRoot}/autotagger`);

  test('finds untagged inputs, buttons, and links', () => {
    const win = makeWindow(`
      <html><body>
        <input type="text" placeholder="Name" />
        <button>Click me</button>
        <a href="/home">Home</a>
      </body></html>
    `);
    const elements = autotagger.autoTag(win.document);
    assert.ok(elements.length >= 3, `Expected ≥3 auto-tagged elements, got ${elements.length}`);
    assert.ok(elements.every((e: any) => e.source === 'auto'));
  });

  test('skips elements that already have data-ai-id', () => {
    const win = makeWindow(`
      <html><body>
        <input data-ai-id="tagged" type="text" />
        <input type="email" placeholder="Email" />
      </body></html>
    `);
    const elements = autotagger.autoTag(win.document);
    // Only the untagged input should appear
    assert.ok(elements.every((e: any) => e.id !== 'tagged'));
  });
});

// ─── serializer ───────────────────────────────────────────────────────────────

describe('serializer', () => {
  const serializer = require(`${sdkRoot}/serializer`);

  test('produces correct UiSnapshot shape with meta counts', () => {
    const manual = [
      { id: 'email',  role: 'input',  label: 'Email',  action: null, context: null, required: false, state: null, selector: '#email',  source: 'manual' },
      { id: 'submit', role: 'action', label: 'Submit', action: 'click', context: null, required: false, state: null, selector: '#submit', source: 'manual' },
    ];
    const auto = [
      { id: 'auto-input-0', role: 'input', label: null, action: null, context: null, required: false, state: null, selector: 'input[type=text]', source: 'auto' },
    ];

    const snapshot = serializer.serialize(manual, auto);

    assert.ok(typeof snapshot.url === 'string' || snapshot.url === null);
    assert.ok(typeof snapshot.timestamp === 'string');
    assert.equal(snapshot.elements.length, 3);
    assert.equal(snapshot.meta.manualCount, 2);
    assert.equal(snapshot.meta.autoCount, 1);
    assert.ok(typeof snapshot.meta.sdkVersion === 'string');
  });
});
