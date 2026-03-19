import type { UiSnapshot } from '../types.js';

/**
 * System prompt for test scenario generation.
 * Instructs Claude on the snapshot format, output schema, and test strategy.
 */
export const TEST_GENERATION_SYSTEM_PROMPT = `
You are an expert UI test engineer. You receive structured JSON snapshots of web application interfaces and generate comprehensive, executable test scenarios.

## Snapshot Format
Each element in the snapshot has:
- id: stable unique identifier (use this in selectors)
- role: "input" | "action" | "display" | "nav"
- action: what the element does (submit, navigate, toggle, etc.)
- label: human-readable description
- context: which form or section it belongs to
- required: true if the field must be filled
- state: current state (disabled, loading, active, empty, null)
- selector: CSS selector — always prefer [data-ai-id='...'] selectors from manually tagged elements
- source: "manual" (explicitly tagged, high confidence) | "auto" (heuristically discovered, lower confidence)

## Test Strategy
Generate scenarios covering:
1. **Happy path** — all required fields filled with valid data, successful completion
2. **Validation** — missing required fields, invalid formats (bad email, short password, etc.)
3. **Edge cases** — empty strings, boundary values, special characters, max length
4. **Negative cases** — wrong credentials, forbidden actions, disabled states
5. **Navigation** — page transitions, back/forward, redirects after actions

## Output Rules
- Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.
- Each scenario must match this exact TypeScript type:

\`\`\`typescript
interface TestScenario {
  name: string;           // kebab-case, unique
  description: string;   // one sentence describing the user intent
  priority: "high" | "medium" | "low";
  tags: string[];         // e.g. ["auth", "happy-path", "validation"]
  steps: TestStep[];
}

interface TestStep {
  action: "navigate" | "fill" | "click" | "select" | "assert" | "wait";
  target?: string;   // CSS selector or URL (for navigate/assert url)
  value?: string;    // fill value, assertion text, or wait duration in ms
  description?: string; // short human description of this step
}
\`\`\`

## Selector Priority
1. Use [data-ai-id='<id>'] for manually tagged elements (source: "manual")
2. Use the selector field directly for auto-tagged elements (source: "auto")
3. Never invent selectors not present in the snapshot

## Assert Step Usage
- action: "assert", target: "url", value: "**/dashboard" — checks URL pattern
- action: "assert", target: "<selector>", value: "visible" — element is visible
- action: "assert", target: "<selector>", value: "hidden" — element is hidden
- action: "assert", target: "<selector>", value: "contains:<text>" — element contains text
- action: "assert", target: "title", value: "<page title text>" — page title check

## Wait Step Usage
- action: "wait", value: "2000" — wait 2000ms
- action: "wait", target: "<selector>", value: "visible" — wait for element to appear
`.trim();

/**
 * Builds the user prompt for test generation from a snapshot.
 */
export function buildGenerationPrompt(snapshot: UiSnapshot, hints?: string): string {
  const elementCount = snapshot.elements.length;
  const manualCount  = snapshot.meta.manualCount;
  const autoCount    = snapshot.meta.autoCount;

  const contexts = [...new Set(
    snapshot.elements
      .map(e => e.context)
      .filter(Boolean)
  )];

  return `
## UI Snapshot
URL: ${snapshot.url ?? 'unknown'}
Captured: ${snapshot.timestamp}
Elements: ${elementCount} total (${manualCount} manually tagged, ${autoCount} auto-tagged)
${contexts.length ? `Contexts detected: ${contexts.join(', ')}` : ''}
${hints ? `\n## Additional Context\n${hints}` : ''}

## Elements
\`\`\`json
${JSON.stringify(snapshot.elements, null, 2)}
\`\`\`

Generate comprehensive test scenarios for this UI. Return only a JSON array.
`.trim();
}

/**
 * System prompt for result analysis.
 * Claude uses this to review test results and recommend retries or fixes.
 */
export const RESULT_ANALYSIS_SYSTEM_PROMPT = `
You are a UI test analyst. You receive test execution results from a Playwright runner and provide:
1. A concise summary of what passed and failed
2. Root cause analysis for each failure
3. Specific, actionable fix recommendations
4. A retry decision: which failures are worth retrying and with what changes

## Output Format
Return a JSON object with this shape:
{
  "summary": string,              // 1-2 sentence overall summary
  "passed": number,
  "failed": number,
  "failures": [
    {
      "scenario": string,
      "step": string,
      "rootCause": string,        // likely reason for failure
      "recommendation": string,  // specific fix
      "shouldRetry": boolean
    }
  ],
  "overallHealth": "green" | "yellow" | "red"
}

Return ONLY valid JSON. No markdown, no explanation.
`.trim();

/**
 * Builds the user prompt for result analysis.
 */
export function buildAnalysisPrompt(results: unknown[]): string {
  return `
## Test Results
\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

Analyze these results and provide your assessment. Return only a JSON object.
`.trim();
}
