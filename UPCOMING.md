# PhantomUI — Incoming Updates

Features and improvements planned for future releases.
This file is updated as new work is scoped. Items are ordered by priority.

---

## Phase 5 — Scale

### 5.1 SQLite Persistence `P1`
**File:** `server/src/runner/store.ts` + `server/package.json`

Replace the current file-per-run JSON store with a single SQLite database via `better-sqlite3`.

**Why:** Faster reads, proper `ORDER BY` / `LIMIT` queries, atomic writes, no file-count juggling.

**Schema:**
```sql
CREATE TABLE runs (
  run_id        TEXT PRIMARY KEY,
  scenario_name TEXT,
  status        TEXT,
  started_at    TEXT,
  finished_at   TEXT,
  duration_ms   INTEGER,
  result_json   TEXT,   -- full TestResult JSON
  scenario_json TEXT    -- full TestScenario JSON
);
```

**Details:**
- `better-sqlite3` is synchronous — no async/await needed
- DB path: `process.env.DB_PATH ?? ~/.ai-ui/phantomui.db`
- Keep in-memory `Map` cache on top for hot reads
- `listRunIds()` → `SELECT run_id FROM runs ORDER BY started_at DESC LIMIT 100`
- On startup: import any existing `~/.ai-ui/runs/*.json` files into SQLite, then delete them

---

### 5.2 Visual Regression Testing `P2`
**New file:** `server/src/runner/visual.ts`
**Modified:** `server/src/types.ts`, `server/src/runner/executor.ts`

Add a `screenshot` step action that captures an element screenshot and diffs it against a saved baseline.

**Step usage:**
```json
{ "action": "screenshot", "target": "[data-ai-id='hero-banner']", "value": "0.1" }
```
`value` = diff threshold in percent (e.g. `"0.1"` = 0.1% pixel tolerance).

**Behaviour:**
1. `page.locator(selector).screenshot()` → PNG buffer
2. Check for baseline at `~/.ai-ui/baselines/<urlHash>/<elementId>.png`
3. No baseline → save as baseline, step passes with status `baseline-created`
4. Baseline exists → pixel-by-pixel diff (pure Node.js, no native deps)
5. `diffPercent > threshold` → step fails; diff image saved as `StepResult.screenshotBase64`

---

### 5.3 Shadow DOM + iframe Support `P2`
**Files:** `sdk/src/scanner.js`, `sdk/src/autotagger.js`, `server/src/runner/executor.ts`, `server/src/types.ts`

**SDK side:**
- `scanner.js` / `autotagger.js`: add `pierceShadowRoots` option — after scanning `root`, walk all elements for `.shadowRoot` and recursively scan into it

**Server side:**
- `TestStep.frameSelector?: string` — if set, executor runs the step inside that frame
- New step action `switch_frame` to explicitly navigate in/out of iframes

**Step usage:**
```json
{ "action": "fill", "target": "#email", "frameSelector": "#login-iframe" }
```

---

## Phase 4 — Ecosystem

### 4.1 VS Code Extension `P1`
**New workspace:** `vscode-extension/`

```
vscode-extension/
  package.json        (publisher, activationEvents, contributes.commands)
  tsconfig.json
  src/
    extension.ts      (activate / deactivate)
    diagnostics.ts    (duplicate data-ai-id squiggles)
    coverage.ts       (sidebar WebviewProvider showing tagged vs. untagged count)
    quickfix.ts       (CodeActionProvider: "Add data-ai-id" on untagged inputs/buttons)
```

**Features:**
- **Diagnostics** — on save/open, scan HTML for duplicate `data-ai-id` values, report as errors
- **Coverage panel** — TreeView showing count of tagged vs. total interactive elements
- **Quick Fix** — offer "Add PhantomUI tag" on `<input>`/`<button>` without `data-ai-id`
- **Decorations** — green gutter icon for tagged elements, yellow for untagged interactive elements

---

## Cross-cutting

### Adapter Unit Tests `—`
**New files:** `sdk/tests/adapters/react.test.js`, `vue.test.js`, `angular.test.js`

JSDOM-based tests (add `jest` + `jsdom` to sdk devDeps):
- `useAiSnapshot()` calls `getSnapshot()` on mount; `refresh()` re-calls it
- `PhantomProvider` re-snapshots on `popstate` / patched `pushState`
- `usePhantomUI()` throws outside `<PhantomProvider>`
- `AiSdkService.getElementsByRole()` filters correctly (Angular)
- `AiSdkPlugin.install()` registers `$aiSdk` on Vue app instance

---

## Notes

- Items marked `P1` are planned for the next release cycle
- Items marked `P2` are planned but can be deferred
- Open an issue on GitHub to discuss or reprioritize any item
