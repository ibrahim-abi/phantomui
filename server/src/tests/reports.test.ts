/**
 * Unit tests for report generators (JSON, HTML, JUnit XML).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateJsonReport  } from '../reports/json.js';
import { generateHtmlReport  } from '../reports/html.js';
import { generateJunitReport } from '../reports/junit.js';
import type { TestResult } from '../types.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const passedResult: TestResult = {
  runId:      'run-001',
  scenario:   'Login flow',
  status:     'passed',
  startedAt:  new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: 1234,
  steps: [
    {
      step:       { action: 'navigate', target: 'https://example.com/login' },
      status:     'passed',
      durationMs: 400,
    },
    {
      step:       { action: 'fill', target: '#email', value: 'user@example.com' },
      status:     'passed',
      durationMs: 200,
    },
    {
      step:       { action: 'click', target: '#submit' },
      status:     'passed',
      durationMs: 634,
    },
  ],
};

const failedResult: TestResult = {
  runId:      'run-002',
  scenario:   'Checkout <script>alert(1)</script>',  // XSS test
  status:     'failed',
  startedAt:  new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: 800,
  error:      'Element not found: #buy-button',
  steps: [
    {
      step:       { action: 'navigate', target: 'https://example.com/shop' },
      status:     'passed',
      durationMs: 300,
    },
    {
      step:       { action: 'click', target: '#buy-button' },
      status:     'failed',
      error:      'Element not found: #buy-button',
      durationMs: 500,
    },
    {
      step:       { action: 'assert', target: 'url', value: '**/checkout' },
      status:     'skipped',
      durationMs: 0,
    },
  ],
};

const results = [passedResult, failedResult];

// ─── JSON report ──────────────────────────────────────────────────────────────

describe('generateJsonReport', () => {
  test('produces parseable JSON', () => {
    const output = generateJsonReport(results);
    assert.doesNotThrow(() => JSON.parse(output));
  });

  test('has correct aggregate counts', () => {
    const report = JSON.parse(generateJsonReport(results));
    assert.equal(report.totalRuns, 2);
    assert.equal(report.passed,    1);
    assert.equal(report.failed,    1);
    assert.equal(report.skipped,   0);
  });

  test('includes all results', () => {
    const report = JSON.parse(generateJsonReport(results));
    assert.equal(report.results.length, 2);
  });

  test('has generatedAt field', () => {
    const report = JSON.parse(generateJsonReport(results));
    assert.ok(typeof report.generatedAt === 'string');
  });
});

// ─── HTML report ──────────────────────────────────────────────────────────────

describe('generateHtmlReport', () => {
  test('starts with DOCTYPE html', () => {
    const html = generateHtmlReport(results);
    assert.ok(html.startsWith('<!DOCTYPE html>'));
  });

  test('contains scenario names', () => {
    const html = generateHtmlReport(results);
    assert.ok(html.includes('Login flow'));
  });

  test('contains error message for failed step', () => {
    const html = generateHtmlReport(results);
    assert.ok(html.includes('Element not found: #buy-button'));
  });

  test('XSS-escapes script tags in scenario names', () => {
    const html = generateHtmlReport(results);
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });
});

// ─── JUnit XML report ─────────────────────────────────────────────────────────

describe('generateJunitReport', () => {
  test('starts with XML declaration', () => {
    const xml = generateJunitReport(results);
    assert.ok(xml.startsWith('<?xml'));
  });

  test('contains testsuites root element', () => {
    const xml = generateJunitReport(results);
    assert.ok(xml.includes('<testsuites'));
    assert.ok(xml.includes('</testsuites>'));
  });

  test('contains failure element for failed steps', () => {
    const xml = generateJunitReport(results);
    assert.ok(xml.includes('<failure'));
  });

  test('contains skipped element for skipped steps', () => {
    const xml = generateJunitReport(results);
    assert.ok(xml.includes('<skipped/>'));
  });

  test('reports time in seconds (not ms)', () => {
    const xml = generateJunitReport(results);
    // Total time is 1234 + 800 = 2034ms = 2.034s
    assert.ok(xml.includes('time="2.034"'), `Expected time="2.034" in:\n${xml.slice(0, 300)}`);
  });
});
