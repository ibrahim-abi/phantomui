const ATTRS = require('./attributes');

/**
 * Scans the DOM for manually tagged elements (those with data-ai-id).
 * Returns an object with element descriptors (source: "manual") and
 * a warnings array listing any duplicate data-ai-id values found.
 *
 * @param {Document|Element} root - Root node to scan. Defaults to document.
 * @returns {{ elements: ElementDescriptor[], warnings: string[] }}
 */
function scan(root) {
  root = root || document;
  const nodes = root.querySelectorAll('[' + ATTRS.ID + ']');
  var elements = Array.from(nodes).map(function(el) {
    return readElement(el);
  });

  // Detect duplicate data-ai-id values
  var seen = {};
  var duplicates = {};
  var warnings = [];
  for (var i = 0; i < elements.length; i++) {
    var id = elements[i].id;
    if (seen[id]) {
      if (!duplicates[id]) {
        duplicates[id] = true;
        var msg = '[ai-sdk] Duplicate data-ai-id "' + id + '" — each ID must be unique. ' +
                  'Duplicate IDs produce ambiguous selectors and unreliable test generation.';
        console.warn(msg);
        warnings.push(msg);
      }
    } else {
      seen[id] = true;
    }
  }

  return { elements: elements, warnings: warnings };
}

/**
 * Reads all data-ai-* attributes from an element and returns a descriptor.
 *
 * @param {Element} el
 * @returns {ElementDescriptor}
 */
function readElement(el) {
  var id = el.getAttribute(ATTRS.ID);
  return {
    id:       id,
    role:     el.getAttribute(ATTRS.ROLE)     || null,
    action:   el.getAttribute(ATTRS.ACTION)   || null,
    label:    el.getAttribute(ATTRS.LABEL)    || (el.textContent ? el.textContent.trim() : null) || null,
    context:  el.getAttribute(ATTRS.CONTEXT)  || null,
    required: el.getAttribute(ATTRS.REQUIRED) === 'true',
    state:    el.getAttribute(ATTRS.STATE)    || null,
    selector: "[data-ai-id='" + id + "']",
    source:   'manual',
  };
}

module.exports = { scan: scan, readElement: readElement };
