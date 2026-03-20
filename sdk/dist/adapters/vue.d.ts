// @phantomui/sdk/adapters/vue — TypeScript declarations
import type { App, Ref } from 'vue';
import type { UiSnapshot, SnapshotOptions } from '../index';

export interface UseAiSnapshotOptions extends SnapshotOptions {
  lazy?: boolean;
}

export interface UseAiSnapshotResult {
  snapshot: Ref<UiSnapshot | null>;
  refresh: () => void;
  isReady: Ref<boolean>;
}

/**
 * Vue 3 composable — captures a UI snapshot and refreshes on demand.
 *
 * @example
 * const { snapshot, refresh } = useAiSnapshot();
 */
export declare function useAiSnapshot(options?: UseAiSnapshotOptions): UseAiSnapshotResult;

/**
 * Vue plugin — registers `$aiSdk` on every component instance.
 *
 * @example
 * app.use(AiSdkPlugin)
 * // then in any component: this.$aiSdk.getSnapshot()
 */
export declare const AiSdkPlugin: { install(app: App, options?: SnapshotOptions): void };
