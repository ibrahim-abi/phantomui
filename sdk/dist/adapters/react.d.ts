// @phantomui/sdk/adapters/react — TypeScript declarations
import type { UiSnapshot, SnapshotOptions } from '../index';

export interface UseAiSnapshotOptions extends SnapshotOptions {
  /** If true, don't snapshot on mount; wait for refresh() */
  lazy?: boolean;
}

export interface UseAiSnapshotResult {
  /** Current snapshot, or null before first capture */
  snapshot: UiSnapshot | null;
  /** Re-capture the snapshot */
  refresh: () => void;
  /** True after the first successful capture */
  isReady: boolean;
}

/**
 * React hook — captures a UI snapshot and refreshes on demand.
 *
 * @example
 * const { snapshot, refresh } = useAiSnapshot();
 */
export declare function useAiSnapshot(options?: UseAiSnapshotOptions): UseAiSnapshotResult;
