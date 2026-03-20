/**
 * Central tool registry — exports definitions and handlers for all MCP tools.
 */

export { GET_UI_SNAPSHOT_TOOL,    handleGetUiSnapshot,     GetUiSnapshotSchema    } from './get_ui_snapshot.js';
export { LIST_ELEMENTS_TOOL,      handleListElements,      ListElementsSchema      } from './list_elements.js';
export { GENERATE_TESTS_TOOL,     handleGenerateTests,     GenerateTestsSchema     } from './generate_tests.js';
export { RUN_TEST_TOOL,           handleRunTest,           RunTestSchema           } from './run_test.js';
export { GET_RESULTS_TOOL,        handleGetResults,        GetResultsSchema        } from './get_results.js';
export { RETRY_FAILED_TOOL,       handleRetryFailed,       RetryFailedSchema       } from './retry_failed.js';
export { SAVE_REPORT_TOOL,        handleSaveReport,        SaveReportSchema        } from './save_report.js';
export { DIFF_SNAPSHOTS_TOOL,     handleDiffSnapshots,     DiffSnapshotsSchema     } from './diff_snapshots.js';
export { RUN_TESTS_PARALLEL_TOOL, handleRunTestsParallel,  RunTestsParallelSchema  } from './run_tests_parallel.js';

import { GET_UI_SNAPSHOT_TOOL    } from './get_ui_snapshot.js';
import { LIST_ELEMENTS_TOOL      } from './list_elements.js';
import { GENERATE_TESTS_TOOL     } from './generate_tests.js';
import { RUN_TEST_TOOL           } from './run_test.js';
import { GET_RESULTS_TOOL        } from './get_results.js';
import { RETRY_FAILED_TOOL       } from './retry_failed.js';
import { SAVE_REPORT_TOOL        } from './save_report.js';
import { DIFF_SNAPSHOTS_TOOL     } from './diff_snapshots.js';
import { RUN_TESTS_PARALLEL_TOOL } from './run_tests_parallel.js';

/** All tool definitions — passed to ListTools response */
export const ALL_TOOLS = [
  GET_UI_SNAPSHOT_TOOL,
  LIST_ELEMENTS_TOOL,
  GENERATE_TESTS_TOOL,
  RUN_TEST_TOOL,
  GET_RESULTS_TOOL,
  RETRY_FAILED_TOOL,
  SAVE_REPORT_TOOL,
  DIFF_SNAPSHOTS_TOOL,
  RUN_TESTS_PARALLEL_TOOL,
];
