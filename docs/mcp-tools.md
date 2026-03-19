# MCP Tools Reference

The AI-UI MCP server exposes 7 tools to Claude. All tools are available in both
stdio mode (Claude Code / Claude Desktop) and HTTP mode.

---

## 1. `get_ui_snapshot`

Navigates to a URL and returns a structured snapshot of all UI elements.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✓ | Full URL to navigate to (e.g. `http://localhost:3000/login`) |
| `autoTag` | boolean | | Include auto-tagged elements. Default: `true` |
| `auth_token` | string | | Bearer token injected as `Authorization` header |

### Returns

`UiSnapshot` — see [sdk-reference.md](./sdk-reference.md) for shape.

### Example prompt

```
Take a snapshot of http://localhost:3000/login
```

---

## 2. `list_elements`

Filters and lists elements from a snapshot by role or source.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `snapshot` | UiSnapshot | ✓ | Output from `get_ui_snapshot` |
| `role` | string | | Filter by role: `input`, `action`, `display`, `nav` |
| `source` | string | | Filter by source: `manual`, `auto` |

### Returns

Array of `ElementDescriptor` objects.

### Example prompt

```
List all input elements from the snapshot
```

---

## 3. `generate_tests`

Uses Claude/Ollama to generate Playwright test scenarios from a snapshot.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `snapshot` | UiSnapshot | ✓ | Output from `get_ui_snapshot` |
| `hints` | string | | Natural language hints (e.g. "test the error state when password is wrong") |
| `count` | number | | Number of scenarios to generate. Default: 3 |

### Returns

Array of `TestScenario` objects with `name`, `description`, and `steps`.

### Example prompt

```
Generate 5 test scenarios for this login page, including an invalid credentials test
```

---

## 4. `run_test`

Executes a test scenario step-by-step using Playwright.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `scenario` | TestScenario | ✓ | Scenario with `name` and `steps` array |
| `session` | object | | Auth session: `cookies`, `localStorage`, `auth_token` |

### Step actions

| Action | `target` | `value` | Description |
|---|---|---|---|
| `navigate` | URL | — | Navigate to a URL |
| `fill` | CSS selector | text | Fill an input field |
| `click` | CSS selector | — | Click an element |
| `select` | CSS selector | option value | Select a dropdown option |
| `assert` | selector or `url` or `title` | pattern | Assert element/URL/title state |
| `wait` | CSS selector (optional) | ms or `visible`/`hidden` | Wait for element or duration |

### Assert patterns

| `target` | `value` | Checks |
|---|---|---|
| `url` | URL pattern (`**/path`) | Page URL matches |
| `title` | text | Page title contains text |
| any selector | `visible` | Element is visible |
| any selector | `hidden` | Element is hidden |
| any selector | `contains:<text>` | Element text contains text |
| any selector | `text:<text>` | Element text equals text |
| any selector | `attr:<name>=<value>` | Element attribute equals value |
| any selector | _(omitted)_ | Element exists and is visible |

### Returns

`{ runId, scenario, status, durationMs, steps }` — use `runId` with `get_results`.

### Example prompt

```
Run the login scenario from the generated tests
```

---

## 5. `get_results`

Fetches the full step-by-step result for a stored test run.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `run_id` | string | ✓ | The `runId` returned by `run_test` or `retry_failed` |

### Returns

Full `TestResult` with per-step status, errors, and timing.

---

## 6. `retry_failed`

Re-runs only the failed steps from a previous run, with optional overrides.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `run_id` | string | ✓ | Run to retry |
| `overrides` | object | | Step overrides: `{ stepIndex: { target?, value?, timeout? } }` |
| `session` | object | | New session config for the retry |

### Returns

New `TestResult` with a fresh `runId`.

---

## 7. `save_report`

Generates a report and saves it to disk.

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `format` | `json` \| `html` \| `junit` | ✓ | Output format |
| `path` | string | ✓ | File path to write to (relative or absolute) |
| `run_id` | string | | Specific run to report on. Omit to include all stored runs. |

### Returns

`{ path, format, bytes, runs, hint }` — absolute path + file size.

### Example prompts

```
Save an HTML report of all runs to ./reports/today.html
Save a JUnit XML report for run abc-123 to ./reports/abc-123.xml
```

---

## HTTP REST API (--port mode)

Start with `node dist/index.js --port 3100` then:

| Method | Route | Body / Params | Returns |
|---|---|---|---|
| `GET` | `/health` | — | `{ server, version, status, uptime }` |
| `POST` | `/snapshot` | `{ url, autoTag?, auth_token? }` | `UiSnapshot` |
| `POST` | `/run` | `{ scenario, session? }` | `{ runId, status, steps }` |
| `GET` | `/results/:runId` | — | `TestResult` |
| `POST` | `/report` | `{ runId?, format }` | report string (content-type varies) |

### Headers

- `X-Tenant-ID` — optional tenant identifier, echoed back in `Access-Control-Expose-Headers`
