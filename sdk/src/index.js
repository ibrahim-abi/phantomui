/**
 * AI UI SDK — Entry Point
 *
 * Exposes window.__aiSdk with:
 *   - getSnapshot(options?) → UiSnapshot
 *   - version → string
 *
 * Auto-disabled when NODE_ENV === "production".
 *
 * Usage (browser, script tag):
 *   <script src="ai-sdk.js"></script>
 *   const snapshot = window.__aiSdk.getSnapshot();
 *
 * Usage (Node / bundler):
 *   const aiSdk = require('@phantomui/sdk');
 *   const snapshot = aiSdk.getSnapshot({ root: document });
 */

var scanner    = require('./scanner');
var autotagger = require('./autotagger');
var serializer = require('./serializer');

var VERSION = '0.1.0';

/**
 * Generate a UI snapshot from the current DOM state.
 *
 * @param {object}  [options]
 * @param {Element} [options.root=document]     - Root node to scan
 * @param {boolean} [options.autoTag=true]      - Enable auto-tagging fallback
 * @param {boolean} [options.includeHidden=false] - Include hidden inputs in snapshot
 * @returns {UiSnapshot}
 */
function getSnapshot(options) {
  options = options || {};
  var root    = options.root    || (typeof document !== 'undefined' ? document : null);
  var doAuto  = options.autoTag !== false;

  if (!root) {
    throw new Error('[ai-sdk] No DOM root available. Pass options.root or run in a browser.');
  }

  var manual = scanner.scan(root);
  var auto   = doAuto ? autotagger.autoTag(root) : [];

  return serializer.serialize(manual, auto);
}

var sdk = {
  version:     VERSION,
  getSnapshot: getSnapshot,
};

// Register on window in browser environments
if (typeof window !== 'undefined') {
  // Safety: only activate outside production
  var isProduction = false;
  try {
    isProduction = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production');
  } catch(e) {}

  if (!isProduction) {
    window.__aiSdk = sdk;
  }
}

module.exports = sdk;
