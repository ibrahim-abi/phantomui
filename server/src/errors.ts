/**
 * UserFriendlyError — an Error subclass that carries an actionable hint string.
 * Surfaced directly in MCP tool error responses so users know exactly how to fix issues.
 *
 * Usage:
 *   throw new UserFriendlyError(
 *     'Playwright not installed',
 *     'Run: npx playwright install chromium'
 *   );
 */
export class UserFriendlyError extends Error {
  constructor(
    message: string,
    public readonly hint: string,
  ) {
    super(message);
    this.name = 'UserFriendlyError';
  }
}
