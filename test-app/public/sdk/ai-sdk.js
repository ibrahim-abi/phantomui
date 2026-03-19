/*!
 * AI UI SDK v0.1.0
 * Zero-dependency frontend SDK for AI-powered UI testing.
 * https://github.com/muhammadibrahim/ai-ui
 *
 * (c) Muhammad Ibrahim — MIT License
 *
 * Usage:
 *   <script src="ai-sdk.js"></script>
 *   const snapshot = window.__aiSdk.getSnapshot();
 */
(function (global) {
  'use strict';

  // ─── Safety: disable in production ────────────────────────────────────────
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') return;
  } catch (e) {}

  var VERSION = '0.1.0';

  // ─── Attribute constants ──────────────────────────────────────────────────
  var ATTRS = {
    ID:       'data-ai-id',
    ROLE:     'data-ai-role',
    ACTION:   'data-ai-action',
    LABEL:    'data-ai-label',
    CONTEXT:  'data-ai-context',
    REQUIRED: 'data-ai-required',
    STATE:    'data-ai-state',
  };

  // ─── Scanner ──────────────────────────────────────────────────────────────
  function scan(root) {
    var nodes = root.querySelectorAll('[' + ATTRS.ID + ']');
    return Array.from(nodes).map(function (el) {
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
    });
  }

  // ─── Auto-tagger ─────────────────────────────────────────────────────────
  var HEURISTICS = [
    { selector: 'input:not([type="hidden"]), textarea, select', role: 'input'   },
    { selector: 'button, [type="submit"], [type="button"], [type="reset"]', role: 'action' },
    { selector: 'a[href]',                                                  role: 'nav'    },
    { selector: 'h1, h2, h3, h4, h5, h6',                                  role: 'display'},
  ];

  function autoTag(root) {
    var tagged  = new Set(Array.from(root.querySelectorAll('[data-ai-id]')));
    var results = [];
    var counter = 0;
    var seen    = new Set();

    for (var i = 0; i < HEURISTICS.length; i++) {
      var rule  = HEURISTICS[i];
      var nodes = root.querySelectorAll(rule.selector);

      for (var j = 0; j < nodes.length; j++) {
        var el = nodes[j];
        if (tagged.has(el) || seen.has(el)) continue;
        seen.add(el);
        counter++;

        results.push({
          id:       'auto-' + rule.role + '-' + counter,
          role:     rule.role,
          action:   rule.role === 'action' ? deriveAction(el) : null,
          label:    deriveLabel(el),
          context:  null,
          required: el.hasAttribute('required'),
          state:    el.disabled ? 'disabled' : null,
          selector: buildSelector(el),
          source:   'auto',
        });
      }
    }
    return results;
  }

  function deriveAction(el) {
    var t = el.getAttribute('type');
    if (t === 'submit') return 'submit';
    if (t === 'reset')  return 'reset';
    return 'click';
  }

  function deriveLabel(el) {
    var label = el.getAttribute('aria-label')  ||
                el.getAttribute('placeholder') ||
                el.getAttribute('title')       ||
                el.getAttribute('alt');
    if (label) return label.trim();
    var text = el.textContent ? el.textContent.trim() : null;
    return text || null;
  }

  function buildSelector(el) {
    var tag = el.tagName.toLowerCase();
    if (el.id) return '#' + el.id;
    var name = el.getAttribute('name');
    if (name) return tag + '[name="' + name + '"]';
    if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\s+/).join('.');
      if (cls) return tag + '.' + cls;
    }
    return tag;
  }

  // ─── Serializer ───────────────────────────────────────────────────────────
  function serialize(manual, auto) {
    return {
      url:       global.location ? global.location.href : null,
      timestamp: new Date().toISOString(),
      elements:  manual.concat(auto),
      meta: {
        manualCount: manual.length,
        autoCount:   auto.length,
        sdkVersion:  VERSION,
      },
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function getSnapshot(options) {
    options  = options || {};
    var root = options.root    || global.document;
    var doAuto = options.autoTag !== false;

    if (!root) throw new Error('[ai-sdk] No DOM root. Pass options.root or run in a browser.');

    var manual = scan(root);
    var auto   = doAuto ? autoTag(root) : [];
    return serialize(manual, auto);
  }

  // Expose on window
  global.__aiSdk = {
    version:     VERSION,
    getSnapshot: getSnapshot,
  };

}(typeof window !== 'undefined' ? window : this));
