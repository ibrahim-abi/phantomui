/**
 * Terminal output helpers with ANSI colours (no external deps).
 */

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const WHITE  = '\x1b[37m';

function isColor(): boolean {
  return process.stdout.isTTY !== false && process.env.NO_COLOR === undefined;
}

function c(code: string, text: string): string {
  return isColor() ? code + text + RESET : text;
}

export const print = {
  /** ○ dim prefix — in-progress step */
  step(msg: string): void {
    process.stdout.write(c(DIM, '  ○ ') + msg + '\n');
  },

  /** ✓ green — success */
  ok(msg: string): void {
    process.stdout.write(c(GREEN, '  ✓ ') + msg + '\n');
  },

  /** ✗ red — failure */
  fail(msg: string): void {
    process.stdout.write(c(RED, '  ✗ ') + msg + '\n');
  },

  /** ⚠ yellow — warning */
  warn(msg: string): void {
    process.stdout.write(c(YELLOW, '  ⚠ ') + msg + '\n');
  },

  /** Plain bold heading */
  heading(msg: string): void {
    process.stdout.write('\n' + c(BOLD + WHITE, msg) + '\n');
  },

  /** Error to stderr */
  error(msg: string): void {
    process.stderr.write(c(RED, 'Error: ') + msg + '\n');
  },

  /** Dim separator line */
  divider(): void {
    process.stdout.write(c(DIM, '  ' + '─'.repeat(46)) + '\n');
  },

  /** Cyan info line */
  info(msg: string): void {
    process.stdout.write(c(CYAN, '  → ') + msg + '\n');
  },
};
