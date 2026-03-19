/**
 * Shared Playwright browser management.
 * A single browser instance is reused across tool calls in the same session.
 */

import { chromium, Browser, Page } from 'playwright';

let browser: Browser | undefined;

export async function ensureBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;

  browser = await chromium.launch({ headless: true });
  browser.on('disconnected', () => { browser = undefined; });
  return browser;
}

export async function newPage(): Promise<Page> {
  const b = await ensureBrowser();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  return ctx.newPage();
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = undefined;
  }
}

/**
 * Navigate to a URL and wait for window.__aiSdk to be available.
 * If the SDK is not present on the page, injects the bundled dist/ai-sdk.js.
 */
export async function getPageWithSdk(url: string): Promise<Page> {
  const page = await newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Check if __aiSdk is already on the page
  const hasSDK = await page.evaluate(() => typeof (window as any).__aiSdk !== 'undefined');

  if (!hasSDK) {
    // Inject the SDK bundle into the page
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, resolve } = await import('path');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const sdkPath = resolve(__dirname, '../../sdk/dist/ai-sdk.js');

    try {
      const sdkCode = readFileSync(sdkPath, 'utf-8');
      await page.addInitScript(sdkCode);
      await page.reload({ waitUntil: 'domcontentloaded' });
    } catch {
      // SDK file not found — continue without injection; snapshot will be empty
    }
  }

  return page;
}
