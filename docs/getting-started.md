# Getting Started — AI-UI in 5 Minutes

This guide gets you from zero to running AI-generated Playwright tests against your UI.

---

## Step 1 — Tag your UI elements

Add `data-ai-id` attributes to the elements you want to test:

```html
<input data-ai-id="email"    data-ai-role="input"  data-ai-label="Email address" />
<input data-ai-id="password" data-ai-role="input"  data-ai-label="Password" />
<button data-ai-id="submit"  data-ai-role="action" data-ai-label="Sign in">Sign in</button>
```

The SDK also auto-discovers untagged inputs, buttons, and links — tagging is optional but
gives Claude better context for generating accurate tests.

**Available attributes:** see [sdk-reference.md](./sdk-reference.md).

---

## Step 2 — Load the SDK

### Browser (script tag)

```html
<script src="path/to/ai-sdk.js"></script>
```

### Bundler / Node

```js
const aiSdk = require('@phantomui/sdk');
const snapshot = aiSdk.getSnapshot({ root: document });
```

---

## Step 3 — Install the MCP server

```bash
cd server
npm install
npm run build
```

Add to Claude Code (stdio transport):

```bash
claude mcp add --transport stdio ai-ui node dist/index.js
```

Or add to `~/.claude/claude_desktop_config.json` for Claude Desktop:

```json
{
  "mcpServers": {
    "ai-ui": {
      "command": "node",
      "args": ["/absolute/path/to/server/dist/index.js"]
    }
  }
}
```

---

## Step 4 — Ask Claude to test your UI

Open Claude and try:

```
Take a snapshot of http://localhost:3000/login and generate test scenarios.
Then run the login scenario and save an HTML report to ./reports/login.html
```

Claude will automatically:
1. Call `get_ui_snapshot` to discover your UI elements
2. Call `generate_tests` to create Playwright scenarios
3. Call `run_test` to execute them
4. Call `save_report` to write the report

---

## Step 5 — View the report

```bash
# Open the HTML report in your browser
start reports/login.html        # Windows
open reports/login.html         # macOS
xdg-open reports/login.html     # Linux
```

---

## HTTP mode (optional)

Start as a REST API server:

```bash
node dist/index.js --port 3100
curl http://localhost:3100/health
```

See [mcp-tools.md](./mcp-tools.md) and the HTTP routes for full API details.
