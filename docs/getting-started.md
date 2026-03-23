# Getting Started — PhantomUI in 5 Minutes

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

### React

```js
import { useAiSnapshot } from '@phantomui/sdk/adapters/react';

function MyApp() {
  const { snapshot, refresh, isReady } = useAiSnapshot();
  // snapshot.elements contains all tagged + auto-tagged UI elements
}
```

### Vue 3

```js
import { useAiSnapshot, AiSdkPlugin } from '@phantomui/sdk/adapters/vue';

// Option A: Composition API composable
const { snapshot, refresh } = useAiSnapshot();

// Option B: Plugin (adds this.$aiSdk to every component)
app.use(AiSdkPlugin);
```

### Angular

```ts
import { AiSdkService } from '@phantomui/sdk/adapters/angular';

// Add to providers, then inject:
constructor(private aiSdk: AiSdkService) {}
ngOnInit() { this.snapshot = this.aiSdk.getSnapshot(); }
```

See [sdk-reference.md](./sdk-reference.md#framework-adapters) for full adapter API docs.

---

## Step 3 — Install the MCP server

```bash
cd server
npm install
npm run build
```

Add to Claude Code (stdio transport):

```bash
claude mcp add --transport stdio phantomui node /absolute/path/to/server/dist/index.js
```

Or add to `~/.claude/claude_desktop_config.json` for Claude Desktop:

```json
{
  "mcpServers": {
    "phantomui": {
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

Start as a REST API + local dashboard server:

```bash
node dist/index.js --port 3100
```

Then open `http://localhost:3100` in your browser for the full dashboard UI (snapshot capture, element grid, test run history, one-click report export). For the raw API, see [http-api.md](./http-api.md) and [mcp-tools.md](./mcp-tools.md).

---

## LLM Provider Configuration

PhantomUI supports multiple LLM backends. The server auto-detects which provider to use based
on environment variables — no code changes required.

### Anthropic Claude (default)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# Optionally override the model:
export AI_MODEL=claude-opus-4-6
```

### Ollama (local, free)

Run tests entirely offline using a local Ollama instance. No API key needed.

```bash
# Install Ollama: https://ollama.ai
ollama pull llama3.1

export LLM_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1          # default: llama3.1
export OLLAMA_BASE_URL=http://localhost:11434  # default
```

### OpenAI-compatible APIs

Works with OpenAI, Azure OpenAI, Together AI, Groq, or any OpenAI-compatible endpoint.

```bash
export LLM_PROVIDER=openai-compatible
export OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
export OPENAI_COMPATIBLE_API_KEY=sk-...
export OPENAI_COMPATIBLE_MODEL=gpt-4o   # default: gpt-4o
```

### Auto-detection priority

If `LLM_PROVIDER` is not set, the server picks a provider automatically:

1. `ANTHROPIC_API_KEY` is set → use Anthropic Claude
2. `OPENAI_COMPATIBLE_BASE_URL` is set → use OpenAI-compatible
3. Neither → fall back to local Ollama (`http://localhost:11434`)
