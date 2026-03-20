# PhantomUI — AI-Powered UI Testing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/@phantomui/sdk.svg)](https://www.npmjs.com/package/@phantomui/sdk)
[![CI](https://github.com/ibrahim-abi/phantomui/actions/workflows/ci.yml/badge.svg)](https://github.com/ibrahim-abi/phantomui/actions/workflows/ci.yml)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![Node Version](https://img.shields.io/node/v/@phantomui/sdk)](https://nodejs.org)

> Stop writing brittle CSS-selector tests by hand. Tag your elements once — let Claude generate, run, and analyse your entire test suite.

UI tests break constantly because they depend on selectors like `div.container > form > input:nth-child(2)`. One refactor and 40 tests fail.

PhantomUI replaces fragile selectors with **semantic HTML attributes** (`data-ai-id`, `data-ai-role`, `data-ai-label`) that describe *what* an element is, not *where* it sits in the DOM. The MCP server exposes 9 tools that Claude uses to snapshot your UI, generate Playwright scenarios from natural language, execute them, and report results — with no test code to write or maintain.

---

## How It Works

```
1. Add data-ai-* attributes to your HTML (or let auto-tagging handle it)
2. SDK serialises your UI into a structured JSON snapshot
3. PhantomUI MCP server connects to Claude Desktop / Claude Code
4. Claude calls get_ui_snapshot → run_test → save_report automatically
5. You get passing/failing results, HTML dashboards, and JUnit XML
```

---

## Features

### Frontend SDK (`@phantomui/sdk`)

| Feature | Detail |
|---|---|
| Zero dependencies | One `<script>` tag, no build step, no bundler |
| Manual tagging | `data-ai-id`, `data-ai-role`, `data-ai-label`, `data-ai-context`, `data-ai-state`, `data-ai-required` |
| Auto-tagging | Heuristic discovery of inputs, buttons, links, headings — no annotations needed |
| Duplicate ID warnings | Scanner warns when two elements share the same `data-ai-id` |
| Framework adapters | React, Vue, Angular helpers included |
| Production self-disable | SDK is a no-op when `NODE_ENV=production` |
| Size | < 5 KB minified |

### MCP Server (`@phantomui/server`)

| Feature | Detail |
|---|---|
| 9 MCP tools | Usable from Claude Desktop, Claude Code, or any MCP client |
| Playwright execution | Real Chromium browser — click, fill, hover, keyboard, scroll, check, assert |
| Session injection | Inject cookies, localStorage, and Bearer auth tokens per test run |
| Network mocking | Intercept and stub any URL pattern with custom response body and status |
| State tracking | Reads `data-ai-state` before and after each interactive step |
| Coverage tracking | Tracks which snapshot elements were exercised; shown in reports |
| Screenshot on failure | Base64 PNG captured on every failed step, embedded in report |
| Parallel runner | Run up to 10 scenarios concurrently; configurable batch size |
| Retry failed steps | Re-run any previous run with optional per-step selector/value/timeout overrides |
| UI snapshot diff | Compare any two snapshots — shows added, removed, changed elements |
| SDK auto-injection | If a page doesn't load the SDK, the server injects the bundle automatically |
| Persistent result store | Disk-backed, LRU-evicted (100 runs max), optional webhook on every result |
| Multiple LLM backends | Anthropic, Ollama, OpenAI-compatible — auto-detected from env vars |

### Reports

| Format | Output |
|---|---|
| JSON | Machine-readable, full step details, CI-friendly |
| HTML | Self-contained dashboard — coverage card, per-step table, inline failure screenshots, snapshot warnings |
| JUnit XML | Plug into GitHub Actions, Jenkins, GitLab CI; includes `<property name="coverage"/>` per suite |

---

## Installation

### SDK — script tag (no build step)

```html
<script src="https://unpkg.com/@phantomui/sdk/dist/ai-sdk.js"></script>
```

### SDK — npm / bundler

```bash
npm install @phantomui/sdk
```

### MCP Server — Claude Desktop / Claude Code

```bash
claude mcp add phantomui -- npx @phantomui/server
```

Or run as a standalone HTTP server:

```bash
npx @phantomui/server --port 3100
```

---

## Quick Start

**Step 1 — Tag your HTML**

```html
<input
  id="email"
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

<script src="https://unpkg.com/@phantomui/sdk/dist/ai-sdk.js"></script>
```

Don't want to annotate your HTML? Auto-tagging discovers inputs, buttons, and links automatically.

**Step 2 — Start the MCP server**

```bash
npx @phantomui/server
```

**Step 3 — Ask Claude**

```
Test the login form at http://localhost:3000.
Cover the happy path, invalid email, and empty password cases.
Save an HTML report when done.
```

Claude calls `get_ui_snapshot` → `run_test` → `save_report` automatically. You get a full report with pass/fail per step, screenshots on failure, and a coverage summary.

---

## MCP Tools

| Tool | What it does |
|---|---|
| `get_ui_snapshot` | Navigates to a URL, injects the SDK if needed, returns a structured element map |
| `list_elements` | Lists snapshot elements with optional `role` or `source` filter |
| `generate_tests` | **CI/headless mode** — navigates to a URL, captures snapshot, calls configured LLM to auto-generate scenarios |
| `run_test` | Runs one scenario step-by-step with Playwright; returns a `runId` |
| `run_tests_parallel` | Runs multiple scenarios concurrently (1–10 at once); returns batch summary with all `runId`s |
| `get_results` | Returns full step-by-step details, errors, durations, and failure screenshots for a `runId` |
| `retry_failed` | Re-runs failed steps from a prior run; supports per-step `target`, `value`, `timeout` overrides |
| `diff_snapshots` | Compares two snapshots; returns added, removed, and changed elements with field-level diff |
| `save_report` | Writes results to disk as `json`, `html`, or `junit`; omit `run_id` to include all stored runs |

### Step actions

`run_test` supports: `navigate` · `fill` · `click` · `select` · `assert` · `wait`

`run_tests_parallel` supports all of the above plus: `hover` · `keyboard` · `scroll` · `check`

### Session injection

Pass a `session` object to `run_test` to inject auth state before the scenario runs:

```json
{
  "scenario": { "name": "...", "steps": [] },
  "session": {
    "cookies":      [{ "name": "token", "value": "abc", "domain": "localhost" }],
    "localStorage": { "theme": "dark" },
    "auth_token":   "Bearer eyJ..."
  }
}
```

### Network mocking

Pass `networkMocks` to `run_tests_parallel` to intercept and stub API calls:

```json
{
  "scenarios": [{
    "name": "checkout with mocked payment",
    "steps": [{ "action": "navigate", "target": "http://localhost:3000/checkout" }],
    "networkMocks": [
      { "urlPattern": "**/api/payment", "status": 200, "body": { "status": "approved" } }
    ]
  }]
}
```

---

## Configuration

| Environment variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | auto-detect | `anthropic` · `ollama` · `openai-compatible` |
| `ANTHROPIC_API_KEY` | — | Required for Anthropic provider |
| `AI_MODEL` | `claude-sonnet-4-6` | Model override for Anthropic |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.1` | Ollama model name |
| `OPENAI_COMPATIBLE_BASE_URL` | — | Base URL for OpenAI-compatible endpoints |
| `OPENAI_COMPATIBLE_MODEL` | `gpt-4o` | Model for OpenAI-compatible provider |
| `RESULT_STORE_PATH` | `~/.ai-ui/runs` | Directory for persisted test results |
| `WEBHOOK_URL` | — | POST each test result JSON here after every run |
| `HEADLESS` | `true` | Set to `false` to see the browser during test runs |

---

## Reports

**HTML dashboard** — open in any browser, no server needed

```
Summary:  Total 4 · Passed 3 · Failed 1 · Duration 2.4s · Coverage 3/5 (60%)

⚠ Snapshot Quality Warnings
  • [ai-sdk] Duplicate data-ai-id "submit-btn" — each ID must be unique.

Login flow  [PASSED]  1.23s  ✓ 3  ✗ 0  — 0
  1  navigate  https://...    ✓  412ms
  2  fill      #email         ✓  198ms
  3  click     #submit        ✓  624ms
```

Failed steps include an inline screenshot — no separate file needed.

**JUnit XML** — compatible with GitHub Actions test summary, Jenkins, GitLab CI

```xml
<testsuite name="Login flow" tests="3" failures="0" time="1.234">
  <properties><property name="coverage" value="3/5"/></properties>
  <testcase name="navigate http://localhost:3000/login" time="0.412"/>
  <testcase name="fill #email" time="0.198"/>
  <testcase name="click #submit" time="0.624"/>
</testsuite>
```

---

## Project Structure

```
phantomui/
├── sdk/                        # @phantomui/sdk — zero-dependency browser SDK
│   └── src/
│       ├── scanner.js          # Manual data-ai-* element discovery + duplicate warnings
│       ├── autotagger.js       # Heuristic discovery for untagged elements + buildSelector
│       ├── serializer.js       # Snapshot serialisation (SDK ↔ server contract)
│       ├── attributes.js       # Canonical attribute name constants
│       └── adapters/           # React / Vue / Angular helpers
├── server/                     # @phantomui/server — MCP server + HTTP API
│   └── src/
│       ├── tools/              # 9 MCP tool implementations
│       ├── runner/
│       │   ├── executor.ts     # Playwright runner — all step actions, state/coverage tracking
│       │   ├── session.ts      # Cookie, localStorage, auth header injection
│       │   └── store.ts        # Disk-backed result store with LRU eviction + webhook
│       ├── ai/
│       │   ├── llm.ts          # Unified LLM interface (Anthropic / Ollama / OpenAI-compatible)
│       │   └── generator.ts    # Test scenario generation prompt + response parser
│       ├── reports/            # JSON / HTML / JUnit XML generators
│       ├── schema/             # Zod snapshot validation + SDK version compatibility check
│       └── tests/              # Test suite (Playwright integration + unit)
├── examples/                   # HTML fixtures
│   ├── login-form.html         # Manual data-ai-* tagging
│   ├── checkout-form.html      # Multi-section form with payment fields
│   ├── auto-tag-demo.html      # Auto-tagging with zero annotations
│   └── interactive.html        # Hover, keyboard, scroll, checkbox fixture
└── docs/                       # Guides and API reference
```

---

## Documentation

| Guide | Description |
|---|---|
| [Getting Started](./docs/getting-started.md) | Full setup walkthrough — zero to first test run |
| [SDK Reference](./docs/sdk-reference.md) | `data-ai-*` attributes, snapshot shape, auto-tagging |
| [MCP Tools](./docs/mcp-tools.md) | All 9 tools — inputs, outputs, and examples |
| [Reports](./docs/reports.md) | Report formats, CI integration, HTML dashboard |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, commit conventions, and contribution guidelines.

---

## License

[MIT](./LICENSE) — Muhammad Ibrahim, 2026
