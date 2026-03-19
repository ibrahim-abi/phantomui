/**
 * Canonical attribute names for the AI SDK contract.
 * All SDK modules must import from here — never hardcode attribute strings.
 */
const ATTRS = {
  ID:       'data-ai-id',       // Required. Stable unique identifier.
  ROLE:     'data-ai-role',     // Required. Semantic role: input | action | display | nav
  ACTION:   'data-ai-action',   // Optional. What the element does: submit | navigate | toggle
  LABEL:    'data-ai-label',    // Optional. Human label (falls back to textContent).
  CONTEXT:  'data-ai-context',  // Optional. Parent section / form name.
  REQUIRED: 'data-ai-required', // Optional. "true" if element is required in a form.
  STATE:    'data-ai-state',    // Optional. Current state: disabled | loading | active | empty
};

module.exports = ATTRS;
