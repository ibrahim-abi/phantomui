// @phantomui/sdk/adapters/angular — TypeScript declarations
import type { UiSnapshot, SnapshotOptions } from '../index';

/** Injectable Angular service for capturing UI snapshots */
export declare class AiSdkService {
  /** Capture current UI snapshot */
  getSnapshot(options?: SnapshotOptions): UiSnapshot;
  readonly version: string;
}
