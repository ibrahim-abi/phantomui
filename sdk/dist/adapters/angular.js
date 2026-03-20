/*!
 * @phantomui/sdk v0.1.1
 * Zero-dependency SDK for AI-powered UI testing.
 * https://github.com/ibrahim-abi/phantomui
 * (c) Muhammad Ibrahim — MIT License
 */
/**
 * AI-UI SDK — Angular Adapter
 *
 * Provides an AiSdkService that can be injected into any Angular component or service.
 *
 * Usage (standalone / module-based):
 *   // app.module.ts or standalone providers
 *   import { AiSdkService } from '@phantomui/sdk/adapters/angular';
 *   providers: [AiSdkService]
 *
 *   // In a component:
 *   constructor(private aiSdk: AiSdkService) {}
 *   ngOnInit() { this.snapshot = this.aiSdk.getSnapshot(); }
 *
 * Note: Angular apps are typically bundled — use a tree-shaking-friendly bundler
 * flag to strip this service in production (set NODE_ENV=production or use
 * Angular's environment files).
 */

var sdk = require('../index.js');

/**
 * Injectable service — drop-in for Angular's DI system.
 * Deliberately kept as a plain class so it works without Angular decorators
 * (avoids requiring @angular/core as a dependency of the SDK).
 * Wrap with @Injectable({ providedIn: 'root' }) in your Angular project.
 */
var AiSdkService = /** @class */ (function () {
  function AiSdkService() {
    this.version = sdk.version;
  }

  /**
   * Returns a snapshot of the current page's instrumented UI elements.
   * @param {{ autoTag?: boolean, root?: Element }} [options]
   * @returns {import('../serializer').UiSnapshot}
   */
  AiSdkService.prototype.getSnapshot = function (options) {
    return sdk.getSnapshot(options);
  };

  /**
   * Returns only elements matching a given role.
   * @param {'input'|'action'|'display'|'nav'} role
   * @returns {import('../serializer').UiSnapshot['elements']}
   */
  AiSdkService.prototype.getElementsByRole = function (role) {
    var snapshot = sdk.getSnapshot();
    return snapshot.elements.filter(function (el) { return el.role === role; });
  };

  /**
   * Returns only manually tagged elements (source: 'manual').
   */
  AiSdkService.prototype.getManualElements = function () {
    var snapshot = sdk.getSnapshot();
    return snapshot.elements.filter(function (el) { return el.source === 'manual'; });
  };

  return AiSdkService;
}());

module.exports = { AiSdkService: AiSdkService };
