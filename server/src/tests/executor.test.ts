/**
 * Integration tests for the Playwright test executor.
 * Runs against local file:// HTML examples — no network required.
 */

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { executeScenario } from '../runner/executor.js';
import { closeBrowser } from '../browser.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(__dirname, '../../../examples');

/** Convert a filesystem path to a file:// URL (works on Windows too). */
function fileUrl(filePath: string): string {
  return 'file://' + filePath.replace(/\\/g, '/');
}

const loginFormUrl = fileUrl(resolve(examplesDir, 'login-form.html'));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('executeScenario', () => {
  after(async () => {
    // Close the shared browser to prevent process hang
    await closeBrowser();
  });

  test('navigate + assert passes on login-form.html', async () => {
    const result = await executeScenario({
      name:        'basic-navigation',
      description: 'Navigate to login form and assert it loaded',
      steps: [
        { action: 'navigate', target: loginFormUrl },
        { action: 'assert',   target: '#email' },
      ],
    });

    assert.equal(result.status, 'passed');
    assert.equal(result.steps.length, 2);
    assert.equal(result.steps[0]!.status, 'passed');
    assert.equal(result.steps[1]!.status, 'passed');
  });

  test('wrong title assertion results in failed status', async () => {
    const result = await executeScenario({
      name:        'wrong-title-assert',
      description: 'Assert a title that does not match',
      steps: [
        { action: 'navigate', target: loginFormUrl },
        { action: 'assert',   target: 'title', value: 'This Title Does Not Exist 12345' },
      ],
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.steps[1]!.status, 'failed');
    assert.ok(result.steps[1]!.error !== undefined);
  });

  test('step after a failure is marked as skipped', async () => {
    const result = await executeScenario({
      name:        'skip-after-failure',
      description: 'Steps following a failure should be skipped',
      steps: [
        { action: 'navigate', target: loginFormUrl },
        { action: 'assert',   target: 'title', value: 'WRONG TITLE XXXYYY' },
        { action: 'click',    target: '#submit', description: 'This should be skipped' },
      ],
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.steps[1]!.status, 'failed');
    assert.equal(result.steps[2]!.status, 'skipped');
  });
});
