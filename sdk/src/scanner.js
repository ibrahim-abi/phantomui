const ATTRS = require('./attributes');

/**
 * Scans the DOM for manually tagged elements (those with data-ai-id).
 * Returns an array of element descriptors with source: "manual".
 *
 * @param {Document|Element} root - Root node to scan. Defaults to document.
 * @returns {ElementDescriptor[]}
 */
function scan(root) {
  root = root || document;
  const nodes = root.querySelectorAll('[' + ATTRS.ID + ']');
  return Array.from(nodes).map(function(el) {
    return readElement(el);
  });
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
