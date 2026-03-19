/**
 * Core test executor.
 * Takes a TestScenario, runs each step with Playwright, and returns a TestResult.
 */

import { chromium } from 'playwright';
import type { Page } from 'playwright';
import { randomUUID } from 'crypto';
import type { TestScenario, TestStep, TestResult, StepResult, TestStatus } from '../types.js';
import { storeResult } from './store.js';
import { applySession } from './session.js';
import type { SessionConfig } from './session.js';

const DEFAULT_TIMEOUT = 15_000; // ms per step

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Execute a test scenario and return the full result.
 * Result is also persisted in the store under result.runId.
 */
export async function executeScenario(
  scenario: TestScenario,
  session?: SessionConfig,
): Promise<TestResult> {
  const runId     = randomUUID();
  const startedAt = new Date().toISOString();
  const wallStart = Date.now();

  const headless = process.env.HEADLESS !== 'false';
  const browser  = await chromium.launch({ headless });
  const context  = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page     = await context.newPage();

  if (session) {
    await applySession(page, context, session);
  }

  const stepResults: StepResult[] = [];
  let   scenarioStatus: TestStatus = 'passed';
  let   scenarioError:  string | undefined;
  let   failedIndex = -1;

  for (let i = 0; i < scenario.steps.length; i++) {
    const step      = scenario.steps[i];
    const stepStart = Date.now();
    let   status: TestStatus = 'passed';
    let   error:  string | undefined;

    try {
      await runStep(page, step);
    } catch (err) {
      status         = 'failed';
      error          = (err as Error).message;
      scenarioStatus = 'failed';
      scenarioError  = error;
      failedIndex    = i;
    }

    stepResults.push({
      step,
      status,
      error,
      durationMs: Date.now() - stepStart,
    });

    if (status === 'failed') {
      // Mark remaining steps as skipped
      for (let j = i + 1; j < scenario.steps.length; j++) {
        stepResults.push({ step: scenario.steps[j], status: 'skipped', durationMs: 0 });
      }
      break;
    }
  }

  await browser.close();

  const result: TestResult = {
    runId,
    scenario:   scenario.name,
    status:     scenarioStatus,
    steps:      stepResults,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - wallStart,
    error:      scenarioError,
  };

  storeResult(result, scenario);
  return result;
}

// ─── Step runner ──────────────────────────────────────────────────────────────

async function runStep(page: Page, step: TestStep): Promise<void> {
  const timeout = step.timeout ?? DEFAULT_TIMEOUT;

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
        // Wait for element state
        const state = step.value === 'hidden' ? 'hidden' : 'visible';
        await page.waitForSelector(step.target, { state, timeout });
      } else {
        // Wait fixed duration
        const ms = parseInt(step.value ?? '1000', 10);
        await page.waitForTimeout(ms);
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
