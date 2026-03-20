# SDK Reference

## `data-ai-*` Attributes

All attributes are optional — untagged elements are discovered automatically by the autotagger.

| Attribute | Values | Description |
|---|---|---|
| `data-ai-id` | any string | **Unique identifier** for this element. Used as the primary key in snapshots. Required for manual tagging. |
| `data-ai-role` | `input` \| `action` \| `display` \| `nav` | Semantic role. `input` = form field, `action` = button/link that triggers something, `display` = read-only content, `nav` = navigation link. |
| `data-ai-label` | any string | Human-readable label. Used by Claude to understand element purpose. Defaults to element text/placeholder if omitted. |
| `data-ai-action` | any string | Description of what happens when this element is interacted with. E.g. `"submits login form"`. |
| `data-ai-context` | any string | Additional context. E.g. `"only visible after authentication"`. |
| `data-ai-required` | `"true"` | Mark field as required. Claude uses this when generating test scenarios. |
| `data-ai-state` | any string | Current element state. E.g. `"disabled"`, `"loading"`, `"error"`. |

### Example

```html
<input
  data-ai-id="email"
  data-ai-role="input"
  data-ai-label="Email address"
  data-ai-required="true"
  type="email"
  placeholder="you@example.com"
/>

<button
  data-ai-id="submit"
  data-ai-role="action"
  data-ai-action="submits login form"
  data-ai-label="Sign in"
>
  Sign in
</button>
```

---

## `getSnapshot()` API

### Browser (via `window.__aiSdk`)

```js
const snapshot = window.__aiSdk.getSnapshot(options);
```

### Node / bundler

```js
const aiSdk = require('@phantomui/sdk');
const snapshot = aiSdk.getSnapshot({ root: document });
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `root` | `Element \| Document` | `document` | DOM node to scan from |
| `autoTag` | `boolean` | `true` | Include auto-discovered elements (inputs, buttons, links without `data-ai-id`) |
| `includeHidden` | `boolean` | `false` | Include hidden inputs in the snapshot |

---

## `UiSnapshot` Shape

```ts
interface UiSnapshot {
  url:       string | null;     // current page URL or null
  timestamp: string;            // ISO 8601 capture time
  elements:  ElementDescriptor[];
  warnings?: string[];          // duplicate data-ai-id warnings (if any)
  meta:      SnapshotMeta;
}

interface ElementDescriptor {
  id:       string;             // data-ai-id or auto-generated
  role:     'input' | 'action' | 'display' | 'nav' | null;
  action:   string | null;      // data-ai-action
  label:    string | null;      // data-ai-label
  context:  string | null;      // data-ai-context
  required: boolean;            // data-ai-required === "true"
  state:    string | null;      // data-ai-state
  selector: string;             // CSS selector to reach this element
  source:   'manual' | 'auto'; // how it was discovered
}

interface SnapshotMeta {
  manualCount: number;   // elements with data-ai-id
  autoCount:   number;   // auto-discovered elements
  sdkVersion:  string;   // e.g. "0.1.0"
}
```

---

## Auto-tagging

When `autoTag: true` (the default), the SDK scans for:

- `<input>`, `<textarea>`, `<select>` — tagged as `role: 'input'`
- `<button>`, `[type=submit]`, `[role=button]` — tagged as `role: 'action'`
- `<a href>` — tagged as `role: 'nav'`

Auto-tagged elements receive a generated `id` like `auto-input-0`. They are always skipped
if they already have a `data-ai-id` attribute.

---

## Framework Adapters

The SDK ships built-in adapters for React, Vue, and Angular. All are zero-dependency wrappers
that lazy-load the framework at runtime — they can safely be imported without the framework
being globally available.

### React — `useAiSnapshot` hook

Requires React 16.8+ (hooks).

```js
import { useAiSnapshot } from '@phantomui/sdk/adapters/react';

function MyComponent() {
  const { snapshot, refresh, isReady } = useAiSnapshot({ autoTag: true });

  if (!isReady) return <p>Loading snapshot…</p>;

  return (
    <div>
      <p>{snapshot.elements.length} elements found</p>
      <button onClick={refresh}>Re-snapshot</button>
    </div>
  );
}
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `autoTag` | `boolean` | `true` | Include auto-tagged elements |
| `lazy` | `boolean` | `false` | Don't snapshot on mount; wait for `refresh()` |

**Returns:** `{ snapshot, refresh, isReady }`

---

### Vue 3 — `useAiSnapshot` composable + `AiSdkPlugin`

#### Composable (Composition API)

```js
import { useAiSnapshot } from '@phantomui/sdk/adapters/vue';

export default {
  setup() {
    const { snapshot, refresh, isReady } = useAiSnapshot({ autoTag: true });
    return { snapshot, refresh, isReady };
  },
};
```

#### Plugin (registers `$aiSdk` globally)

```js
// main.js
import { createApp } from 'vue';
import { AiSdkPlugin } from '@phantomui/sdk/adapters/vue';
import App from './App.vue';

const app = createApp(App);
app.use(AiSdkPlugin, { autoTag: true });
app.mount('#app');

// In any component:
// this.$aiSdk.getSnapshot()
// this.$aiSdk.version
```

---

### Angular — `AiSdkService`

Add to your module/component providers, then inject as normal.

```ts
// app.module.ts
import { AiSdkService } from '@phantomui/sdk/adapters/angular';

@NgModule({
  providers: [AiSdkService],
})
export class AppModule {}

// my.component.ts
import { AiSdkService } from '@phantomui/sdk/adapters/angular';

@Component({ ... })
export class MyComponent implements OnInit {
  snapshot: any;

  constructor(private aiSdk: AiSdkService) {}

  ngOnInit() {
    this.snapshot = this.aiSdk.getSnapshot();
  }
}
```

**Methods:**

| Method | Returns | Description |
|---|---|---|
| `getSnapshot(options?)` | `UiSnapshot` | Full snapshot of current page |
| `getElementsByRole(role)` | `ElementDescriptor[]` | Filter elements by role |
| `getManualElements()` | `ElementDescriptor[]` | Only manually tagged elements |
