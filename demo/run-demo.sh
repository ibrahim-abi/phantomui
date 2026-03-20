#!/usr/bin/env bash
# PhantomUI — end-to-end demo
#
# Starts a local HTTP server serving the login-form example,
# then runs `phantomui test` against it.
#
# Requirements:
#   - Node.js 18+
#   - Built SDK:    npm run build --workspace sdk
#   - Built server: npm run build --workspace server
#   - Built CLI:    npm run build --workspace cli
#   - ANTHROPIC_API_KEY set (or LLM_PROVIDER=ollama for free local mode)
#
# Usage:
#   bash demo/run-demo.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLES_DIR="$ROOT_DIR/examples"
PORT=18080
URL="http://localhost:$PORT/login-form.html"
REPORT_DIR="$ROOT_DIR/demo/reports"

# ─── Colours ──────────────────────────────────────────────────────────────────
BOLD=$'\e[1m'; RESET=$'\e[0m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; CYAN=$'\e[36m'

banner() { echo "${BOLD}${CYAN}  $*${RESET}"; }
ok()     { echo "${GREEN}  ✓ $*${RESET}"; }
info()   { echo "${CYAN}  → $*${RESET}"; }

# ─── Pre-flight checks ────────────────────────────────────────────────────────
banner "PhantomUI Demo — AI-powered UI testing"
echo ""

if [ ! -f "$ROOT_DIR/server/dist/index.js" ]; then
  echo "  Server not built. Run: npm run build --workspace server"
  exit 1
fi

if [ ! -f "$ROOT_DIR/cli/dist/index.js" ]; then
  echo "  CLI not built. Run: npm run build --workspace cli"
  exit 1
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ "${LLM_PROVIDER:-}" != "ollama" ]; then
  echo "${YELLOW}  ⚠ ANTHROPIC_API_KEY not set.${RESET}"
  echo "  Set it to use Claude, or set LLM_PROVIDER=ollama for local mode."
  echo ""
fi

# ─── Start static file server ─────────────────────────────────────────────────
info "Starting demo server on port $PORT…"

# Use Node's built-in http module to serve the SDK + examples
node - <<EOF &
const http = require('http');
const fs   = require('fs');
const path = require('path');

const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
const ROOT  = '$ROOT_DIR';

http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? '/examples/login-form.html' : req.url);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}).listen($PORT);
EOF

SERVER_PID=$!

# Give the server a moment to start
sleep 1

ok "Demo server started (PID $SERVER_PID)"
info "Serving: $URL"
echo ""

# ─── Run phantomui test ───────────────────────────────────────────────────────
mkdir -p "$REPORT_DIR"

banner "Running: phantomui test $URL"
echo ""

set +e
node "$ROOT_DIR/cli/dist/index.js" test "$URL" \
  --out "$REPORT_DIR/login-demo.html" \
  --hints "Test the login form — valid credentials, missing fields, and form submission"
EXIT_CODE=$?
set -e

# ─── Cleanup ──────────────────────────────────────────────────────────────────
kill $SERVER_PID 2>/dev/null || true

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  ok "Demo complete — all tests passed!"
else
  echo "  Some tests failed (expected — validates error handling)."
fi

info "Open the report: open \"$REPORT_DIR/login-demo.html\""
echo ""

exit $EXIT_CODE
