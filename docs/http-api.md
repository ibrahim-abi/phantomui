# PhantomUI HTTP API Reference

The server exposes a REST API when started with `--port`. This is an alternative to the MCP stdio transport and is suitable for CI pipelines, dashboards, or any non-Claude client.

## Starting the HTTP server

```bash
node dist/index.js --port 3100
```

## Common headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Required for POST requests with a body |
| `X-Tenant-ID: <id>` | Optional tenant identifier (returned in response headers) |
| `Authorization: Bearer <token>` | Optional — forwarded to the browser when snapshotting authenticated pages |

## CORS

All origins are allowed (`Access-Control-Allow-Origin: *`). Preflight `OPTIONS` requests are handled automatically.

## Error shape

All error responses use HTTP 4xx/5xx status codes with a JSON body:

```json
{ "error": "Human-readable description of what went wrong" }
```

---

## Routes

### `GET /health`

Returns server info and uptime. Useful for liveness probes.

**Response `200`**

```json
{
  "server":  "ai-ui-mcp",
  "version": "0.1.0",
  "status":  "ok",
  "uptime":  42.3
}
```

**curl example**

```bash
curl http://localhost:3100/health
```

---

### `POST /snapshot`

Navigates to a URL, injects the PhantomUI SDK, and returns a structured `UiSnapshot` JSON.

**Request body**

```json
{
  "url":        "https://your-app.example/login",
  "autoTag":    true,
  "auth_token": "optional-bearer-token"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✓ | Full URL of the page to snapshot |
| `autoTag` | boolean | | Include auto-tagged elements. Default: `true` |
| `auth_token` | string | | Bearer token injected as `Authorization` header |

**Response `200`** — `UiSnapshot` JSON

```json
{
  "url":       "https://your-app.example/login",
  "timestamp": "2026-03-20T12:00:00.000Z",
  "elements":  [...],
  "warnings":  [],
  "meta": {
    "manualCount": 4,
    "autoCount":   2,
    "sdkVersion":  "0.1.1"
  }
}
```

**curl example**

```bash
curl -X POST http://localhost:3100/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:3000/login","autoTag":true}'
```

---

### `POST /run`

Executes a `TestScenario` with Playwright and returns the result.

**Request body**

```json
{
  "scenario": {
    "name":        "login-happy-path",
    "description": "User logs in with valid credentials",
    "steps": [
      { "action": "navigate", "target": "http://localhost:3000/login" },
      { "action": "fill",     "target": "[data-ai-id='email']",    "value": "user@example.com" },
      { "action": "fill",     "target": "[data-ai-id='password']", "value": "secret123" },
      { "action": "click",    "target": "[data-ai-id='login-btn']" },
      { "action": "assert",   "target": "url", "value": "**/dashboard" }
    ]
  },
  "session": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scenario` | TestScenario | ✓ | Scenario to execute |
| `session` | SessionConfig | | Optional cookie/localStorage session |

**Response `200`**

```json
{
  "runId":  "550e8400-e29b-41d4-a716-446655440000",
  "status": "passed",
  "steps":  [...]
}
```

**curl example**

```bash
curl -X POST http://localhost:3100/run \
  -H 'Content-Type: application/json' \
  -d @scenario.json
```

---

### `GET /results/:runId`

Returns the full `TestResult` for a completed run.

**Path parameter**

| Param | Description |
|-------|-------------|
| `runId` | The UUID returned by `POST /run` |

**Response `200`** — full `TestResult` JSON including all steps, durations, errors, and coverage.

**Response `404`** — `{ "error": "Run not found: <runId>" }`

**curl example**

```bash
curl http://localhost:3100/results/550e8400-e29b-41d4-a716-446655440000
```

---

### `POST /report`

Generates a test report for one or all stored runs.

**Request body**

```json
{
  "runId":  "550e8400-e29b-41d4-a716-446655440000",
  "format": "html"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runId` | string | | Specific run to report. Omit for all stored runs. |
| `format` | `"json"` \| `"html"` \| `"junit"` | ✓ | Output format |

**Response content types**

| Format | Content-Type |
|--------|-------------|
| `json` | `application/json` |
| `html` | `text/html` |
| `junit` | `application/xml` |

**curl examples**

```bash
# HTML report for all runs
curl -X POST http://localhost:3100/report \
  -H 'Content-Type: application/json' \
  -d '{"format":"html"}' \
  -o report.html

# JUnit XML for a specific run
curl -X POST http://localhost:3100/report \
  -H 'Content-Type: application/json' \
  -d '{"runId":"<id>","format":"junit"}' \
  -o results.xml
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required for `generate_tests` MCP tool |
| `RESULT_STORE_PATH` | `~/.ai-ui/runs` | Directory for persisted run JSON files |
| `WEBHOOK_URL` | — | If set, POSTs each `TestResult` JSON to this URL after every run |
| `LLM_PROVIDER` | `anthropic` | LLM backend: `anthropic` or `openai` |
| `OPENAI_API_KEY` | — | Required if `LLM_PROVIDER=openai` |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model name |
