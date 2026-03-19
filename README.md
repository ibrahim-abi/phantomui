# ai-ui — AI-Powered UI Testing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/@ai-ui/sdk.svg)](https://www.npmjs.com/package/@ai-ui/sdk)
[![CI](https://github.com/muhammad-ibrahim/ai-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/muhammad-ibrahim/ai-ui/actions/workflows/ci.yml)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![Node Version](https://img.shields.io/node/v/@ai-ui/sdk)](https://nodejs.org)

> The invisible hand that tests your UI. Tag your elements once — let Claude do the rest.

- **Zero-dependency SDK** — one `<script>` tag, no build step required
- **7-tool MCP server** — Claude generates, runs, and analyses Playwright tests through natural language
- **Three report formats** — JSON, HTML dashboard, and JUnit XML for CI pipelines

---

## How It Works

```
1. Tag your HTML with data-ai-* attributes (or let auto-tagging handle it)
2. SDK produces a structured JSON snapshot of your UI
3. MCP server exposes the snapshot as Claude tools
4. Claude generates test scenarios from plain English
5. Playwright executes them and Claude analyses the results
```

---

## Features

| Frontend SDK | MCP Server |
|---|---|
| Zero dependencies | 7 MCP tools (snapshot, generate, run, report…) |
| Auto-tagging heuristics | HTTP REST API on any port |
| Production self-disable | Full Playwright test runner |
| Structured JSON snapshots | JSON, HTML & JUnit XML reports |
| `data-ai-*` attribute system | Claude-powered test analysis |
| < 5 KB minified | TypeScript, fully typed |

---

## Installation

### SDK — script tag (no build step)

```html
<script src="https://unpkg.com/@ai-ui/sdk/dist/ai-sdk.js"></script>
```

### SDK — bundler / npm

```bash
npm install @ai-ui/sdk
```

### MCP Server — add to Claude

```bash
claude mcp add ai-ui-server -- npx @ai-ui/server
```

Or run the HTTP server directly:

```bash
npx @ai-ui/server --port 3100
```

---

## Quick Start

**Step 1 — Tag your HTML**

```html
<input
  data-ai-id="login-email"
  data-ai-role="input"
  data-ai-label="Email Address"
  data-ai-context="login-form"
  data-ai-required="true"
/>
<button
  data-ai-id="login-submit"
  data-ai-role="action"
  data-ai-action="submit"
  data-ai-context="login-form"
>Sign In</button>

<script src="https://unpkg.com/@ai-ui/sdk/dist/ai-sdk.js"></script>
```

**Step 2 — Start the MCP server**

```bash
npx @ai-ui/server
```

**Step 3 — Ask Claude**

```
Test the login form at http://localhost:3000 — check happy path and invalid email scenarios.
```

Claude will call `get_snapshot` → `generate_tests` → `run_tests` → `save_report` automatically.

---

## MCP Tools

| Tool | Description |
|---|---|
| `get_snapshot` | Captures the `data-ai-*` element map from a live URL |
| `generate_tests` | Produces Playwright test code from a snapshot |
| `run_tests` | Executes generated tests via Playwright |
| `analyze_results` | Claude summarises pass/fail with actionable findings |
| `save_report` | Persists results to JSON / HTML / JUnit XML |
| `load_snapshot` | Loads a previously saved snapshot from disk |
| `list_reports` | Lists all saved reports in the output directory |

---

## Reports

Three output formats, generated with `save_report`:

**JSON** — machine-readable, CI-friendly

```json
{
  "url": "http://localhost:3000/login",
  "timestamp": "2026-03-19T10:00:00.000Z",
  "summary": { "total": 4, "passed": 3, "failed": 1 },
  "results": [ ... ]
}
```

**HTML** — visual dashboard with pass/fail indicators, open in any browser

**JUnit XML** — plug straight into Jenkins, GitHub Actions test summary, or any CI system

```xml
<testsuite name="AI UI Tests" tests="4" failures="1">
  <testcase name="happy path login" classname="login-form" time="1.23" />
  <testcase name="invalid email rejects" classname="login-form" time="0.87">
    <failure message="Expected error message not found" />
  </testcase>
</testsuite>
```

---

## Documentation

| Guide | Description |
|---|---|
| [Getting Started](./docs/getting-started.md) | Full setup walkthrough from zero to first test run |
| [SDK Reference](./docs/sdk-reference.md) | `data-ai-*` attributes, snapshot shape, auto-tagging |
| [MCP Tools](./docs/mcp-tools.md) | All 7 tools — inputs, outputs, and examples |
| [Reports](./docs/reports.md) | Report formats, file locations, CI integration |

---

## Project Structure

```
ai-ui/
├── sdk/                    # @ai-ui/sdk — zero-dependency frontend SDK
│   ├── src/ai-sdk.js       # SDK source
│   ├── dist/ai-sdk.js      # Built output (bundled)
│   └── scripts/build.js    # Build script
├── server/                 # @ai-ui/server — MCP server + HTTP API
│   ├── src/
│   │   ├── index.ts        # MCP + HTTP entry point
│   │   ├── tools/          # 7 MCP tool implementations
│   │   ├── reports/        # JSON / HTML / JUnit reporters
│   │   └── tests/          # Test suite
│   └── tsconfig.json
├── runner/                 # Playwright test runner
├── examples/               # Example HTML pages
│   ├── login-form.html
│   ├── checkout-form.html
│   └── auto-tag-demo.html
└── docs/                   # Guides and API reference
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development setup, commit conventions,
and links to all related projects.

---

## License

[MIT](./LICENSE) — Muhammad Ibrahim, 2026
