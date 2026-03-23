/*!
 * @phantomui/sdk v0.1.4
 * Zero-dependency SDK for AI-powered UI testing.
 * https://github.com/ibrahim-abi/phantomui
 * (c) Muhammad Ibrahim — MIT License
 */
/**
 * AI-UI SDK — Vue Adapter
 *
 * Provides a Vue 3 composable useAiSnapshot() and a Vue 2/3 plugin.
 *
 * Vue 3 Composition API usage:
 *   import { useAiSnapshot } from '@phantomui/sdk/adapters/vue';
 *
 *   export default {
 *     setup() {
 *       const { snapshot, refresh } = useAiSnapshot();
 *       return { snapshot, refresh };
 *     }
 *   }
 *
 * Vue plugin usage (registers $aiSdk on every component):
 *   import { AiSdkPlugin } from '@phantomui/sdk/adapters/vue';
 *   app.use(AiSdkPlugin);
 *   // then in any component: this.$aiSdk.getSnapshot()
 */

function getSdk() {
  return require('../index.js');
}

function getVue() {
  try { return require('vue'); } catch {
    throw new Error('[ai-ui/sdk] Vue adapter requires vue as a peer dependency.');
  }
}

/**
 * Vue 3 composable.
 *
 * @param {object} [options]
 * @param {boolean} [options.autoTag=true]
 * @param {boolean} [options.lazy=false]
 * @returns {{ snapshot: Ref, refresh: function, isReady: Ref }}
 */
function useAiSnapshot(options) {
  var Vue  = getVue();
  var opts = options || {};

  var snapshot = Vue.ref(null);
  var isReady  = Vue.ref(false);

  function refresh() {
    try {
      var sdk  = getSdk();
      snapshot.value = sdk.getSnapshot({ autoTag: opts.autoTag !== false });
      isReady.value  = true;
    } catch (e) {
      console.error('[ai-ui/sdk] useAiSnapshot error:', e);
    }
  }

  Vue.onMounted(function () {
    if (!opts.lazy) refresh();
  });

  return { snapshot: snapshot, refresh: refresh, isReady: isReady };
}

/**
 * Vue plugin — installs $aiSdk on every component instance.
 *
 * Usage:
 *   app.use(AiSdkPlugin)
 *   app.use(AiSdkPlugin, { autoTag: false })
 */
var AiSdkPlugin = {
  install: function (app, options) {
    var opts = options || {};
    app.config.globalProperties.$aiSdk = {
      getSnapshot: function () {
        return getSdk().getSnapshot({ autoTag: opts.autoTag !== false });
      },
      version: getSdk().version,
    };
  },
};

module.exports = { useAiSnapshot: useAiSnapshot, AiSdkPlugin: AiSdkPlugin };
