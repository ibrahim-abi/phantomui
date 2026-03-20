/**
 * Builds the final UI snapshot object.
 * This is the binding contract between the SDK and the MCP server.
 * Do not change the shape of this output without updating the Zod schema in server/.
 */

/**
 * @param {ElementDescriptor[]} manualElements  - Elements tagged with data-ai-id
 * @param {ElementDescriptor[]} autoElements    - Elements discovered by auto-tagger
 * @param {string[]}            [warnings]      - Warnings from the scan (e.g. duplicate IDs)
 * @returns {UiSnapshot}
 */
function serialize(manualElements, autoElements, warnings) {
  var url = null;
  try { url = typeof window !== 'undefined' ? window.location.href : null; } catch(e) {}

  return {
    url:       url,
    timestamp: new Date().toISOString(),
    elements:  manualElements.concat(autoElements),
    warnings:  warnings && warnings.length > 0 ? warnings : undefined,
    meta: {
      manualCount: manualElements.length,
      autoCount:   autoElements.length,
      sdkVersion:  '0.1.0',
    },
  };
}

module.exports = { serialize: serialize };
