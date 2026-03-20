/**
 * Core test executor.
 * Takes a TestScenario, runs each step with Playwright, and returns a TestResult.
 */

import type { Page, Frame } from 'playwright';
import { randomUUID } from 'crypto';
import type { TestScenario, TestStep, TestResult, StepResult, TestStatus } from '../types.js';
import { storeResult } from './store.js';
import { applySession } from './session.js';
import type { SessionConfig } from './session.js';
import { ensureBrowser } from '../browser.js';

const DEFAULT_TIMEOUT = 15_000; // ms per step

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Execute a test scenario and return the full result.
 * Result is also persisted in the store under result.runId.
 */
export async function executeScenario(
  scenario: TestScenario,
  session?: SessionConfig,
  snapshotElementCount?: number,
  snapshotWarnings?: string[],
): Promise<TestResult> {
  const runId     = randomUUID();
  const startedAt = new Date().toISOString();
  const wallStart = Date.now();

  const browser  = await ensureBrowser();
  const context  = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page     = await context.newPage();

  // Apply network mocks before any navigation
  for (const mock of scenario.networkMocks ?? []) {
    await page.route(mock.urlPattern, route => route.fulfill({
      status:      mock.status ?? 200,
      contentType: mock.contentType ?? 'application/json',
      body:        JSON.stringify(mock.body),
    }));
  }

  if (session) {
    await applySession(page, context, session);
  }

  const stepResults: StepResult[]  = [];
  const coveredSelectors           = new Set<string>();
  let   scenarioStatus: TestStatus = 'passed';
  let   scenarioError:  string | undefined;

  for (let i = 0; i < scenario.steps.length; i++) {
    const step      = scenario.steps[i];
    const stepStart = Date.now();
    let   status: TestStatus = 'passed';
    let   error:  string | undefined;
    let   screenshotBase64: string | undefined;
    let   stateChange: { before: string | null; after: string | null } | undefined;

    // Read element state before action (for interactive steps with a target)
    const isInteractive = ['click', 'fill', 'select', 'hover', 'check'].includes(step.action);
    if (isInteractive && step.target) {
      try {
        const before = await page.getAttribute(step.target, 'data-ai-state').catch(() => null);
        if (before === 'disabled') {
          error = `Warning: element "${step.target}" has state "disabled" — proceeding anyway`;
        }
        stateChange = { before, after: null };
      } catch {
        // ignore state-read errors
      }
    }

    try {
      await runStep(page, step);

      // Track covered selectors for coverage report
      if (step.target && ['fill', 'click', 'select', 'assert', 'hover', 'check'].includes(step.action)) {
        coveredSelectors.add(step.target);
      }

      // Read state after action
      if (stateChange && step.target) {
        try {
          stateChange.after = await page.getAttribute(step.target, 'data-ai-state').catch(() => null);
        } catch {
          stateChange.after = null;
        }
      }
    } catch (err) {
      status         = 'failed';
      error          = (err as Error).message;
      scenarioStatus = 'failed';
      scenarioError  = error;

      // Capture screenshot on failure
      try {
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        screenshotBase64 = buf.toString('base64');
      } catch {
        // ignore screenshot errors
      }
    }

    stepResults.push({
      step,
      status,
      error,
      durationMs: Date.now() - stepStart,
      screenshotBase64,
      stateChange,
    });

    if (status === 'failed') {
      // Mark remaining steps as skipped
      for (let j = i + 1; j < scenario.steps.length; j++) {
        stepResults.push({ step: scenario.steps[j], status: 'skipped', durationMs: 0 });
      }
      break;
    }
  }

  await context.close();

  const result: TestResult = {
    runId,
    scenario:            scenario.name,
    status:              scenarioStatus,
    steps:               stepResults,
    startedAt,
    finishedAt:          new Date().toISOString(),
    durationMs:          Date.now() - wallStart,
    error:               scenarioError,
    coveredSelectors:    [...coveredSelectors],
    snapshotElementCount,
    snapshotWarnings,
  };

  storeResult(result, scenario);
  return result;
}

// ─── Step runner ──────────────────────────────────────────────────────────────

async function runStep(page: Page, step: TestStep): Promise<void> {
  const timeout = step.timeout ?? DEFAULT_TIMEOUT;

  // If frameSelector is set, operate inside that frame
  let target: Page | Frame = page;
  if (step.frameSelector) {
    const frame = page.frame({ url: step.frameSelector }) ?? page.frameLocator(step.frameSelector).first();
    target = frame as unknown as Frame;
  }

  switch (step.action) {
    case 'navigate':
      if (!step.target) throw new Error('navigate requires a target URL');
      await page.goto(step.target, { waitUntil: 'domcontentloaded', timeout });
      break;

    case 'fill':
      if (!step.target) throw new Error('fill requires a target selector');
      await page.waitForSelector(step.target, { state: 'visible', timeout });
      await page.fill(step.target, step.value ?? '');
      break;

    case 'click':
      if (!step.target) throw new Error('click requires a target selector');
      await page.waitForSelector(step.target, { state: 'visible', timeout });
      await page.click(step.target);
      break;

    case 'select':
      if (!step.target) throw new Error('select requires a target selector');
      await page.waitForSelector(step.target, { state: 'visible', timeout });
      await page.selectOption(step.target, step.value ?? '');
      break;

    case 'assert':
      await runAssert(page, step, timeout);
      break;

    case 'wait':
      if (step.target) {
        const state = step.value === 'hidden' ? 'hidden' : 'visible';
        await page.waitForSelector(step.target, { state, timeout });
      } else {
        const ms = parseInt(step.value ?? '1000', 10);
        await page.waitForTimeout(ms);
      }
      break;

    case 'hover':
      if (!step.target) throw new Error('hover requires a target selector');
      await page.hover(step.target, { timeout });
      break;

    case 'keyboard':
      if (!step.value) throw new Error('keyboard requires a value (key name, e.g. "Enter")');
      await page.keyboard.press(step.value);
      break;

    case 'scroll':
      if (step.target) {
        await page.locator(step.target).scrollIntoViewIfNeeded({ timeout });
      } else {
        const y = parseInt(step.value ?? '0', 10);
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      }
      break;

    case 'check':
      if (!step.target) throw new Error('check requires a target selector');
      await page.waitForSelector(step.target, { state: 'visible', timeout });
      if (step.value === 'false') {
        await page.uncheck(step.target);
      } else {
        await page.check(step.target);
      }
      break;

    default:
      throw new Error(`Unknown step action: ${(step as any).action}`);
  }
}

// ─── Assert handler ───────────────────────────────────────────────────────────

async function runAssert(page: Page, step: TestStep, timeout: number): Promise<void> {
  const { target, value } = step;

  if (!target) throw new Error('assert requires a target');

  // URL pattern — e.g. "**/dashboard" or "https://..."
  if (target === 'url') {
    if (!value) throw new Error('assert url requires a value pattern');
    await page.waitForURL(value, { timeout });
    return;
  }

  // Page title
  if (target === 'title') {
    const title = await page.title();
    if (!value || !title.includes(value)) {
      throw new Error(`Title "${title}" does not contain "${value}"`);
    }
    return;
  }

  // Element visibility
  if (value === 'visible') {
    await page.waitForSelector(target, { state: 'visible', timeout });
    return;
  }

  if (value === 'hidden') {
    await page.waitForSelector(target, { state: 'hidden', timeout });
    return;
  }

  // Text content — "contains:<text>"
  if (value?.startsWith('contains:')) {
    const expected = value.slice('contains:'.length);
    await page.waitForSelector(target, { state: 'visible', timeout });
    const content = await page.textContent(target);
    if (!content?.includes(expected)) {
      throw new Error(`"${target}" contains "${content}" — expected to include "${expected}"`);
    }
    return;
  }

  // Exact text match — "text:<text>"
  if (value?.startsWith('text:')) {
    const expected = value.slice('text:'.length).trim();
    await page.waitForSelector(target, { state: 'visible', timeout });
    const content = (await page.textContent(target))?.trim();
    if (content !== expected) {
      throw new Error(`"${target}" text is "${content}" — expected "${expected}"`);
    }
    return;
  }

  // Attribute check — "attr:<name>=<value>"
  if (value?.startsWith('attr:')) {
    const rest      = value.slice('attr:'.length);
    const [attrName, attrVal] = rest.split('=');
    await page.waitForSelector(target, { state: 'attached', timeout });
    const actual = await page.getAttribute(target, attrName);
    if (actual !== attrVal) {
      throw new Error(`"${target}" attr "${attrName}" is "${actual}" — expected "${attrVal}"`);
    }
    return;
  }

  // Default: just assert element is visible
  await page.waitForSelector(target, { state: 'visible', timeout });
}
