/**
 * Auto-tagging fallback for elements without data-ai-id.
 * Elements discovered here are flagged as source: "auto" so the AI
 * can apply lower confidence to them vs. manually tagged elements.
 */

/**
 * Heuristic rules. Evaluated in order — first match wins per element.
 * Each rule maps a CSS selector to a semantic role.
 */
var HEURISTICS = [
  { selector: 'input:not([type="hidden"]), textarea, select', role: 'input'   },
  { selector: 'button, [type="submit"], [type="button"], [type="reset"]', role: 'action'  },
  { selector: 'a[href]',                                                  role: 'nav'     },
  { selector: 'h1, h2, h3, h4, h5, h6',                                  role: 'display' },
];

/**
 * Scans the DOM for untagged elements and applies heuristic role assignment.
 *
 * @param {Document|Element} root - Root node to scan. Defaults to document.
 * @returns {ElementDescriptor[]}
 */
function autoTag(root) {
  root = root || document;

  // Build a set of already-tagged elements so we skip them
  var tagged = new Set(Array.from(root.querySelectorAll('[data-ai-id]')));

  var results = [];
  var counter = 0;
  var seen = new Set();

  for (var i = 0; i < HEURISTICS.length; i++) {
    var rule = HEURISTICS[i];
    var nodes = root.querySelectorAll(rule.selector);

    for (var j = 0; j < nodes.length; j++) {
      var el = nodes[j];
      if (tagged.has(el) || seen.has(el)) continue;
      seen.add(el);

      counter++;
      var autoId = 'auto-' + rule.role + '-' + counter;

      results.push({
        id:       autoId,
        role:     rule.role,
        action:   rule.role === 'action' ? deriveAction(el) : null,
        label:    deriveLabel(el),
        context:  null,
        required: el.hasAttribute ? el.hasAttribute('required') : false,
        state:    el.disabled ? 'disabled' : null,
        selector: buildSelector(el),
        source:   'auto',
      });
    }
  }

  return results;
}

function deriveAction(el) {
  var type = el.getAttribute ? el.getAttribute('type') : null;
  if (type === 'submit') return 'submit';
  if (type === 'reset')  return 'reset';
  return 'click';
}

function deriveLabel(el) {
  if (el.getAttribute) {
    var label = el.getAttribute('aria-label')   ||
                el.getAttribute('placeholder')  ||
                el.getAttribute('title')        ||
                el.getAttribute('alt');
    if (label) return label.trim();
  }
  var text = el.textContent ? el.textContent.trim() : null;
  return text || null;
}

/**
 * Builds a best-effort CSS selector for an untagged element.
 * Priority: id > name > class > tagname
 */
function buildSelector(el) {
  if (!el.tagName) return 'unknown';
  var tag = el.tagName.toLowerCase();

  if (el.id) return '#' + el.id;

  var name = el.getAttribute ? el.getAttribute('name') : null;
  if (name) return tag + '[name="' + name + '"]';

  if (el.className && typeof el.className === 'string') {
    var classes = el.className.trim().split(/\s+/).join('.');
    if (classes) return tag + '.' + classes;
  }

  return tag;
}

module.exports = { autoTag: autoTag };
