# @phantomui/sdk

[![npm version](https://img.shields.io/npm/v/@phantomui/sdk.svg)](https://www.npmjs.com/package/@phantomui/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ibrahim-abi/phantomui/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/@phantomui/sdk)](https://nodejs.org)

> AI-powered UI testing SDK using semantic HTML attributes instead of fragile CSS selectors.

UI tests break when you refactor. PhantomUI fixes that by replacing selectors like `div > form > input:nth-child(2)` with stable semantic attributes (`data-ai-id`, `data-ai-role`, `data-ai-label`) that describe **what** an element is — not where it sits in the DOM.

The SDK serialises your UI into a structured JSON snapshot. The [PhantomUI MCP server](https://github.com/ibrahim-abi/phantomui) uses that snapshot to let Claude generate, run, and analyse Playwright tests from plain English — no test code to write or maintain.

---

## Installation

```bash
npm install @phantomui/sdk
```

Or via script tag (no build step):

```html
<script src="https://unpkg.com/@phantomui/sdk/dist/ai-sdk.js"></script>
```

---

## Quick Start

### 1. Tag your HTML elements

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

<script src="https://unpkg.com/@phantomui/sdk/dist/ai-sdk.js"></script>
```

### 2. Get a snapshot

```js
const snapshot = window.__aiSdk.getSnapshot();
console.log(snapshot);
```

Output:

```json
{
  "url": "https://yourapp.com/login",
  "timestamp": "2026-03-20T12:00:00.000Z",
  "elements": [
    {
      "id": "login-email",
      "role": "input",
      "label": "Email Address",
      "context": "login-form",
      "required": true,
      "selector": "[data-ai-id='login-email']",
      "source": "manual"
    },
    {
      "id": "login-submit",
      "role": "action",
      "action": "submit",
      "label": "Sign In",
      "context": "login-form",
      "selector": "[data-ai-id='login-submit']",
      "source": "manual"
    }
  ],
  "meta": { "manualCount": 2, "autoCount": 0, "sdkVersion": "0.1.2" }
}
```

---

## Auto-Tagging

No annotations on your HTML? Auto-tagging discovers inputs, buttons, links, and headings automatically:

```js
const snapshot = window.__aiSdk.getSnapshot({ autoTag: true });
```

Auto-tagged elements are marked `"source": "auto"` so the AI knows to treat them with lower confidence than manually tagged elements.

---

## Attributes Reference

| Attribute | Required | Description |
|---|---|---|
| `data-ai-id` | Yes | Stable unique identifier for the element |
| `data-ai-role` | Yes | Semantic role: `input` · `action` · `display` · `nav` |
| `data-ai-label` | No | Human-readable label (falls back to `textContent`) |
| `data-ai-action` | No | What the element does: `submit` · `navigate` · `toggle` |
| `data-ai-context` | No | Parent form or section name |
| `data-ai-required` | No | `"true"` if the field is required |
| `data-ai-state` | No | Current state: `disabled` · `loading` · `active` · `empty` |

---

## Framework Adapters

### React

```jsx
import { useAiSnapshot } from '@phantomui/sdk/adapters/react';

function LoginForm() {
  const { getSnapshot } = useAiSnapshot();

  return (
    <input
      data-ai-id="login-email"
      data-ai-role="input"
      data-ai-label="Email Address"
    />
  );
}
```

### Vue

```vue
<script setup>
import { useAiSnapshot } from '@phantomui/sdk/adapters/vue';
const { getSnapshot } = useAiSnapshot();
</script>

<template>
  <input data-ai-id="login-email" data-ai-role="input" data-ai-label="Email" />
</template>
```

### Angular

```ts
import { AiSnapshotService } from '@phantomui/sdk/adapters/angular';

@Component({ ... })
export class LoginComponent {
  constructor(private aiSnapshot: AiSnapshotService) {}
  getSnapshot() { return this.aiSnapshot.getSnapshot(); }
}
```

---

## CommonJS / ESM

```js
// CommonJS
const { getSnapshot } = require('@phantomui/sdk');

// ESM
import { getSnapshot } from '@phantomui/sdk';
```

---

## Production Safety

The SDK **automatically disables itself** in production — it becomes a no-op when `NODE_ENV=production`. No test data is ever exposed in production builds.

---

## Full Platform

This SDK is part of the [PhantomUI platform](https://github.com/ibrahim-abi/phantomui):

- **SDK** (this package) — captures UI snapshots from the browser
- **MCP Server** (`@phantomui/server`) — connects to Claude and runs Playwright tests
- **9 MCP tools** — snapshot, generate, run, diff, retry, report, and more

```
Ask Claude: "Test the login form at http://localhost:3000"
Claude → get_ui_snapshot → run_test → save_report → done
```

---

## Links

- [GitHub Repository](https://github.com/ibrahim-abi/phantomui)
- [npm Package](https://www.npmjs.com/package/@phantomui/sdk)
- [Report an Issue](https://github.com/ibrahim-abi/phantomui/issues)

---

## License

[MIT](https://github.com/ibrahim-abi/phantomui/blob/main/LICENSE) — Muhammad Ibrahim
