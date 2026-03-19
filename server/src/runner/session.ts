/**
 * Session / auth setup for Playwright before running a test scenario.
 * Supports: cookies, localStorage, and Authorization headers.
 */

import type { BrowserContext, Page } from 'playwright';

export interface SessionConfig {
  cookies?:      CookieEntry[];
  localStorage?: Record<string, string>;
  auth_token?:   string;
}

export interface CookieEntry {
  name:    string;
  value:   string;
  domain?: string;
  path?:   string;
}

/**
 * Applies session state to a Playwright context/page before test execution.
 */
export async function applySession(
  page:    Page,
  context: BrowserContext,
  session: SessionConfig,
): Promise<void> {
  // 1. Inject cookies
  if (session.cookies?.length) {
    await context.addCookies(
      session.cookies.map(c => ({
        name:   c.name,
        value:  c.value,
        domain: c.domain ?? 'localhost',
        path:   c.path   ?? '/',
      }))
    );
  }

  // 2. Inject auth header on every request
  if (session.auth_token) {
    await context.setExtraHTTPHeaders({
      Authorization: `Bearer ${session.auth_token}`,
    });
  }

  // 3. Inject localStorage (requires a page navigation first — set via initScript)
  if (session.localStorage && Object.keys(session.localStorage).length > 0) {
    const entries = session.localStorage;
    await context.addInitScript((data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        window.localStorage.setItem(key, value);
      }
    }, entries);
  }

  void page; // page param reserved for future per-page setup
}
