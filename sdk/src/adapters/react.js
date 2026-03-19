/**
 * AI-UI SDK — React Adapter
 *
 * Provides a useAiSnapshot() hook that returns the current UI snapshot
 * and re-generates it on demand.
 *
 * Usage:
 *   import { useAiSnapshot } from '@phantomui/sdk/adapters/react';
 *
 *   function MyComponent() {
 *     const { snapshot, refresh, isReady } = useAiSnapshot();
 *     return <button onClick={refresh}>Snapshot</button>;
 *   }
 *
 * Requires React 16.8+ (hooks).
 * Zero additional dependencies — only peer-depends on react.
 */

// Lazy require so this adapter can be imported without React being globally available.
function getReact() {
  try { return require('react'); } catch {
    throw new Error('[ai-ui/sdk] React adapter requires react as a peer dependency.');
  }
}

function getSdk() {
  return require('../index.js');
}

/**
 * @param {object} [options]
 * @param {boolean} [options.autoTag=true]  - Include auto-tagged elements
 * @param {boolean} [options.lazy=false]    - If true, don't snapshot on mount; wait for refresh()
 * @returns {{ snapshot: object|null, refresh: function, isReady: boolean }}
 */
function useAiSnapshot(options) {
  var React = getReact();
  var opts  = options || {};

  var _useState  = React.useState(null);
  var snapshot   = _useState[0];
  var setSnapshot = _useState[1];

  var _useStateReady = React.useState(false);
  var isReady      = _useStateReady[0];
  var setReady     = _useStateReady[1];

  var refresh = React.useCallback(function () {
    try {
      var sdk  = getSdk();
      var snap = sdk.getSnapshot({ autoTag: opts.autoTag !== false });
      setSnapshot(snap);
      setReady(true);
    } catch (e) {
      console.error('[ai-ui/sdk] useAiSnapshot error:', e);
    }
  }, [opts.autoTag]);

  React.useEffect(function () {
    if (!opts.lazy) refresh();
  }, [refresh, opts.lazy]);

  return { snapshot: snapshot, refresh: refresh, isReady: isReady };
}

module.exports = { useAiSnapshot: useAiSnapshot };
