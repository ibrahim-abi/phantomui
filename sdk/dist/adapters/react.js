/*!
 * @phantomui/sdk v0.1.1
 * Zero-dependency SDK for AI-powered UI testing.
 * https://github.com/ibrahim-abi/phantomui
 * (c) Muhammad Ibrahim — MIT License
 */
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

// ─── PhantomProvider ──────────────────────────────────────────────────────────

/**
 * PhantomProvider — wraps your SPA root and re-snapshots on every route change.
 *
 * Usage:
 *   import { PhantomProvider, usePhantomUI } from '@phantomui/sdk/adapters/react';
 *
 *   function App() {
 *     return (
 *       <PhantomProvider>
 *         <Router>...</Router>
 *       </PhantomProvider>
 *     );
 *   }
 *
 *   function SomeComponent() {
 *     const { snapshot, sendToServer } = usePhantomUI();
 *     return <button onClick={() => sendToServer('http://localhost:3100/snapshot')}>Send</button>;
 *   }
 */

var PhantomContext = null;

function getPhantomContext() {
  if (!PhantomContext) {
    var React = getReact();
    PhantomContext = React.createContext(null);
  }
  return PhantomContext;
}

function PhantomProvider(props) {
  var React   = getReact();
  var sdk     = getSdk();
  var Context = getPhantomContext();

  var _useState    = React.useState(null);
  var snapshot     = _useState[0];
  var setSnapshot  = _useState[1];

  // Capture snapshot on mount and on every popstate/pushState event
  React.useEffect(function () {
    function capture() {
      try {
        var snap = sdk.getSnapshot({ autoTag: true });
        setSnapshot(snap);
      } catch (e) {
        console.error('[ai-ui/sdk] PhantomProvider capture error:', e);
      }
    }

    capture();

    // Patch history.pushState to fire a custom event
    var originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = function () {
      originalPushState.apply(window.history, arguments);
      window.dispatchEvent(new Event('phantomui:navigate'));
    };

    window.addEventListener('popstate',            capture);
    window.addEventListener('phantomui:navigate',  capture);

    return function () {
      window.removeEventListener('popstate',           capture);
      window.removeEventListener('phantomui:navigate', capture);
      window.history.pushState = originalPushState;
    };
  }, []);

  /**
   * POST the current snapshot to a PhantomUI server snapshot endpoint.
   * @param {string} serverUrl - e.g. "http://localhost:3100/snapshot"
   */
  function sendToServer(serverUrl) {
    if (!snapshot) return Promise.resolve(null);
    return fetch(serverUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ snapshot: snapshot }),
    }).then(function (r) { return r.json(); });
  }

  var value = { snapshot: snapshot, sendToServer: sendToServer };

  return React.createElement(Context.Provider, { value: value }, props.children);
}

/**
 * Hook to access the current snapshot and server sender from any child component.
 * Must be used inside <PhantomProvider>.
 *
 * @returns {{ snapshot: object|null, sendToServer: function }}
 */
function usePhantomUI() {
  var React   = getReact();
  var Context = getPhantomContext();
  var ctx     = React.useContext(Context);
  if (!ctx) throw new Error('[ai-ui/sdk] usePhantomUI must be used inside <PhantomProvider>');
  return ctx;
}

module.exports = { useAiSnapshot: useAiSnapshot, PhantomProvider: PhantomProvider, usePhantomUI: usePhantomUI };
