/**
 * PhantomUI Local Dashboard
 *
 * Returns a self-contained HTML page served at GET / in HTTP mode.
 * No external dependencies — all CSS and JS are inline.
 * Matches the test-app dark-mode design system.
 */

export function renderDashboard(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PhantomUI Dashboard</title>
<style>
  /* ── Reset ─────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Base ──────────────────────────────────────────────────────────── */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
    line-height: 1.5;
  }

  /* ── Layout ────────────────────────────────────────────────────────── */
  .page { max-width: 900px; margin: 0 auto; padding: 24px 16px 48px; }

  /* ── Header ────────────────────────────────────────────────────────── */
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid #2d3748;
  }
  header h1 { font-size: 1.5rem; font-weight: 700; color: #a78bfa; letter-spacing: -0.02em; }
  header h1 span { color: #e2e8f0; font-weight: 400; }
  .server-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #94a3b8;
    background: #1a1f2e;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #2d3748;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #4ade80;
    flex-shrink: 0;
  }
  .status-dot.offline { background: #f87171; }

  /* ── Cards ─────────────────────────────────────────────────────────── */
  .card {
    background: #1a1f2e;
    border: 1px solid #2d3748;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
  }

  /* ── Buttons ────────────────────────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-primary { background: #7c3aed; color: #fff; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-primary:disabled { background: #4c1d95; color: #7c3aed; cursor: not-allowed; }
  .btn-secondary { background: #2d3748; color: #e2e8f0; }
  .btn-secondary:hover { background: #374151; }
  .btn-sm { padding: 5px 10px; font-size: 0.8rem; border-radius: 6px; }

  /* ── Form ───────────────────────────────────────────────────────────── */
  .input-row { display: flex; gap: 10px; }
  .input-row input {
    flex: 1;
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    padding: 8px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .input-row input:focus { border-color: #7c3aed; }
  .input-row input::placeholder { color: #4b5563; }

  /* ── Status badges ──────────────────────────────────────────────────── */
  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge.passed  { background: #16a34a20; color: #4ade80; }
  .badge.failed  { background: #dc262620; color: #f87171; }
  .badge.skipped { background: #d9770620; color: #fb923c; }
  .badge.pending { background: #2d374850; color: #94a3b8; }

  /* ── Role badges ────────────────────────────────────────────────────── */
  .role-badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .role-input   { background: #0891b220; color: #38bdf8; }
  .role-action  { background: #16a34a20; color: #4ade80; }
  .role-nav     { background: #d9770620; color: #fb923c; }
  .role-display { background: #7c3aed20; color: #c4b5fd; }

  /* ── Runs list ──────────────────────────────────────────────────────── */
  .runs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
  }
  .export-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  .run-card {
    border: 1px solid #2d3748;
    border-radius: 10px;
    margin-bottom: 10px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .run-card:hover { border-color: #4b5563; }

  .run-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    flex-wrap: wrap;
  }
  .run-name { font-weight: 500; font-size: 0.9rem; flex: 1; min-width: 120px; }
  .run-meta { font-size: 0.78rem; color: #64748b; }
  .run-chevron { color: #4b5563; font-size: 0.8rem; transition: transform 0.2s; flex-shrink: 0; }
  .run-card.expanded .run-chevron { transform: rotate(90deg); }

  .run-detail { display: none; border-top: 1px solid #2d3748; }
  .run-card.expanded .run-detail { display: block; }

  /* ── Steps table ────────────────────────────────────────────────────── */
  .steps-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  .steps-table th {
    text-align: left;
    padding: 8px 14px;
    background: #0f1117;
    color: #64748b;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .steps-table td {
    padding: 9px 14px;
    border-top: 1px solid #1e2535;
    vertical-align: top;
  }
  .steps-table tr:first-child td { border-top: none; }
  .icon-pass { color: #4ade80; font-weight: 700; }
  .icon-fail { color: #f87171; font-weight: 700; }
  .icon-skip { color: #fb923c; }
  code {
    background: #0f1117;
    border: 1px solid #2d3748;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.78rem;
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #a78bfa;
    word-break: break-all;
  }
  .step-error { color: #f87171; font-size: 0.78rem; margin-top: 4px; }
  .step-screenshot { max-width: 100%; margin-top: 8px; border-radius: 6px; border: 1px solid #2d3748; display: block; }

  /* ── Snapshot viewer ────────────────────────────────────────────────── */
  .snapshot-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    font-size: 0.8rem;
    color: #64748b;
  }
  .snapshot-meta span b { color: #e2e8f0; }

  .filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .filter-btn {
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid #2d3748;
    background: transparent;
    color: #94a3b8;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .filter-btn:hover { border-color: #7c3aed; color: #c4b5fd; }
  .filter-btn.active { background: #7c3aed20; border-color: #7c3aed; color: #c4b5fd; }

  .element-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }
  .element-card {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 8px;
    padding: 10px 12px;
    border-left: 3px solid #7c3aed;
    font-size: 0.8rem;
  }
  .element-card.source-auto { border-left-color: #0891b2; }
  .element-card .el-id { font-weight: 600; color: #e2e8f0; margin-bottom: 4px; word-break: break-all; }
  .element-card .el-label { color: #94a3b8; margin-bottom: 6px; font-size: 0.75rem; }
  .element-card .el-selector { color: #4b5563; font-size: 0.72rem; word-break: break-all; }
  .el-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }

  .json-toggle { width: 100%; text-align: left; margin-top: 12px; }
  details summary {
    cursor: pointer;
    font-size: 0.8rem;
    color: #64748b;
    padding: 6px 0;
    list-style: none;
    user-select: none;
  }
  details summary::-webkit-details-marker { display: none; }
  details summary::before { content: '▶ '; font-size: 0.7rem; }
  details[open] summary::before { content: '▼ '; }
  .json-output {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 6px;
    padding: 12px;
    font-size: 0.72rem;
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #94a3b8;
    overflow-x: auto;
    margin-top: 8px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre;
  }

  /* ── Misc ───────────────────────────────────────────────────────────── */
  .empty-state { text-align: center; padding: 32px; color: #4b5563; font-size: 0.9rem; }
  .empty-state p { margin-top: 8px; font-size: 0.8rem; }
  .error-card {
    background: #dc262610;
    border: 1px solid #dc262640;
    border-radius: 8px;
    padding: 12px 16px;
    color: #f87171;
    font-size: 0.85rem;
    margin-top: 12px;
  }
  .spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid #7c3aed40;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Responsive ─────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .card { padding: 14px 14px; }
    .input-row { flex-direction: column; }
    .element-grid { grid-template-columns: 1fr; }
    .steps-table { font-size: 0.75rem; }
    .steps-table th, .steps-table td { padding: 7px 10px; }
    .runs-header { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <header>
    <h1>Phantom<span>UI</span></h1>
    <div class="server-status" id="server-status">
      <span class="status-dot" id="status-dot"></span>
      <span id="status-text">connecting…</span>
    </div>
  </header>

  <!-- Quick Actions -->
  <div class="card">
    <div class="card-title">Take Snapshot</div>
    <div class="input-row">
      <input type="url" id="snapshot-url" placeholder="https://localhost:5173 or any URL…" />
      <button class="btn btn-primary" id="snapshot-btn" onclick="takeSnapshot()">Snapshot</button>
    </div>
    <div id="snapshot-error"></div>
  </div>

  <!-- Snapshot Viewer -->
  <div class="card" id="snapshot-viewer" style="display:none">
    <div class="card-title">Snapshot</div>
    <div class="snapshot-meta" id="snapshot-meta"></div>
    <div class="filter-row" id="filter-row"></div>
    <div class="element-grid" id="element-grid"></div>
    <details>
      <summary>Raw JSON</summary>
      <div class="json-output" id="snapshot-json"></div>
    </details>
  </div>

  <!-- Test Runs -->
  <div class="card">
    <div class="runs-header">
      <div class="card-title" style="margin-bottom:0">Test Runs</div>
      <div class="export-btns">
        <button class="btn btn-secondary btn-sm" onclick="downloadReport('html')">↓ HTML</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadReport('json')">↓ JSON</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadReport('junit')">↓ JUnit</button>
      </div>
    </div>
    <div id="runs-list"></div>
  </div>

</div>

<script>
  /* ── State ──────────────────────────────────────────────────────────── */
  const state = {
    runs: [],
    snapshot: null,
    snapshotFilter: 'all',
    expandedRunId: null,
    loadedDetails: {},
  };

  /* ── XSS escape ─────────────────────────────────────────────────────── */
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Time helpers ───────────────────────────────────────────────────── */
  function fmtDuration(ms) {
    return ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : ms + 'ms';
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }
  function timeSince(iso) {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return sec + 's ago';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
    return Math.floor(sec / 3600) + 'h ago';
  }

  /* ── API ────────────────────────────────────────────────────────────── */
  async function fetchHealth() {
    try {
      const r = await fetch('/health');
      const d = await r.json();
      document.getElementById('status-dot').classList.remove('offline');
      document.getElementById('status-text').textContent =
        'v' + esc(d.version) + ' · ' + Math.floor(d.uptime) + 's uptime';
    } catch {
      document.getElementById('status-dot').classList.add('offline');
      document.getElementById('status-text').textContent = 'disconnected';
    }
  }

  async function fetchRuns() {
    try {
      const r = await fetch('/runs');
      const d = await r.json();
      const newIds = (d.runs || []).map(r => r.runId).join(',');
      const oldIds = state.runs.map(r => r.runId).join(',');
      if (newIds !== oldIds) {
        state.runs = d.runs || [];
        renderRunsList();
      }
    } catch { /* silently retry next poll */ }
  }

  async function fetchRunDetail(runId) {
    if (state.loadedDetails[runId]) return state.loadedDetails[runId];
    const r = await fetch('/results/' + encodeURIComponent(runId));
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    state.loadedDetails[runId] = d;
    return d;
  }

  async function takeSnapshot() {
    const url = document.getElementById('snapshot-url').value.trim();
    if (!url) return;
    const btn = document.getElementById('snapshot-btn');
    const errEl = document.getElementById('snapshot-error');
    errEl.innerHTML = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading…';

    try {
      const r = await fetch('/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, autoTag: true }),
      });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Snapshot failed');
      state.snapshot = d;
      state.snapshotFilter = 'all';
      renderSnapshot();
      document.getElementById('snapshot-viewer').style.display = '';
    } catch (e) {
      errEl.innerHTML = '<div class="error-card">' + esc(e.message) + '</div>';
      document.getElementById('snapshot-viewer').style.display = 'none';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Snapshot';
    }
  }

  async function downloadReport(format) {
    try {
      const r = await fetch('/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert('Export failed: ' + (d.error || r.statusText));
        return;
      }
      const blob = await r.blob();
      const ext = format === 'junit' ? 'xml' : format;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'phantomui-report.' + ext;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert('Export error: ' + e.message);
    }
  }

  /* ── Render: Snapshot ───────────────────────────────────────────────── */
  function renderSnapshot() {
    const snap = state.snapshot;
    if (!snap) return;

    // Meta bar
    document.getElementById('snapshot-meta').innerHTML =
      '<span><b>' + esc(snap.meta?.sdkVersion || '?') + '</b> sdk</span>' +
      '<span><b>' + esc(snap.meta?.manualCount) + '</b> manual</span>' +
      '<span><b>' + esc(snap.meta?.autoCount) + '</b> auto</span>' +
      '<span>' + esc(fmtDate(snap.timestamp)) + '</span>';

    // Filter buttons
    const roles = ['all', 'input', 'action', 'nav', 'display'];
    document.getElementById('filter-row').innerHTML = roles.map(r =>
      '<button class="filter-btn' + (state.snapshotFilter === r ? ' active' : '') +
      '" onclick="setFilter(' + JSON.stringify(r) + ')">' + esc(r) + '</button>'
    ).join('');

    renderSnapshotGrid();

    // Raw JSON
    document.getElementById('snapshot-json').textContent = JSON.stringify(snap, null, 2);
  }

  function setFilter(role) {
    state.snapshotFilter = role;
    renderSnapshot();
  }

  function renderSnapshotGrid() {
    const snap = state.snapshot;
    const filter = state.snapshotFilter;
    const els = (snap?.elements || []).filter(e => filter === 'all' || e.role === filter);

    if (!els.length) {
      document.getElementById('element-grid').innerHTML =
        '<div class="empty-state">No elements match this filter.</div>';
      return;
    }

    document.getElementById('element-grid').innerHTML = els.map(el => {
      const roleClass = 'role-' + esc(el.role || 'display');
      const sourceClass = el.source === 'auto' ? 'source-auto' : '';
      return '<div class="element-card ' + sourceClass + '">' +
        '<div class="el-id">' + esc(el.id) + '</div>' +
        '<div class="el-badges">' +
          '<span class="role-badge ' + roleClass + '">' + esc(el.role || '—') + '</span>' +
          (el.source === 'auto' ? '<span class="role-badge" style="background:#2d374850;color:#64748b">auto</span>' : '') +
          (el.required ? '<span class="role-badge" style="background:#dc262620;color:#f87171">req</span>' : '') +
        '</div>' +
        (el.label ? '<div class="el-label">' + esc(el.label) + '</div>' : '') +
        '<div class="el-selector"><code>' + esc(el.selector) + '</code></div>' +
      '</div>';
    }).join('');
  }

  /* ── Render: Runs list ──────────────────────────────────────────────── */
  function renderRunsList() {
    const el = document.getElementById('runs-list');
    if (!state.runs.length) {
      el.innerHTML = '<div class="empty-state">No test runs yet.<p>Use <code>POST /run</code> or the MCP tools to execute a test scenario.</p></div>';
      return;
    }
    el.innerHTML = state.runs.map(run => buildRunCard(run)).join('');
  }

  function buildRunCard(run) {
    const isExpanded = state.expandedRunId === run.runId;
    const detail = state.loadedDetails[run.runId];
    return '<div class="run-card' + (isExpanded ? ' expanded' : '') + '" id="run-' + esc(run.runId) + '">' +
      '<div class="run-summary" onclick="toggleRun(' + JSON.stringify(run.runId) + ')">' +
        '<span class="badge ' + esc(run.status) + '">' + esc(run.status) + '</span>' +
        '<span class="run-name">' + esc(run.scenario) + '</span>' +
        '<span class="run-meta">' + esc(fmtDuration(run.durationMs)) + ' · ' +
          esc(run.passedSteps) + '/' + esc(run.stepCount) + ' steps · ' +
          esc(timeSince(run.startedAt)) +
        '</span>' +
        '<span class="run-chevron">▶</span>' +
      '</div>' +
      '<div class="run-detail" id="detail-' + esc(run.runId) + '">' +
        (isExpanded && detail ? buildStepTable(detail) : '<div style="padding:12px 16px;color:#4b5563;font-size:0.8rem"><span class="spinner"></span> Loading…</div>') +
      '</div>' +
    '</div>';
  }

  function buildStepTable(result) {
    if (!result.steps || !result.steps.length) {
      return '<div class="empty-state">No steps recorded.</div>';
    }
    const rows = result.steps.map((s, i) => {
      const icon =
        s.status === 'passed'  ? '<span class="icon-pass">✓</span>' :
        s.status === 'failed'  ? '<span class="icon-fail">✗</span>' :
                                 '<span class="icon-skip">—</span>';
      const target = s.step?.target ? '<code>' + esc(s.step.target) + '</code>' : '';
      const value  = s.step?.value  ? ' = ' + esc(s.step.value) : '';
      const desc   = s.step?.description ? '<div style="color:#64748b;font-size:0.75rem;margin-top:2px">' + esc(s.step.description) + '</div>' : '';
      const err    = s.error   ? '<div class="step-error">' + esc(s.error) + '</div>' : '';
      const shot   = (s.status === 'failed' && s.screenshotBase64)
        ? '<img class="step-screenshot" src="data:image/png;base64,' + s.screenshotBase64 + '" alt="failure screenshot" />'
        : '';
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + esc(s.step?.action || '?') + '</strong>' + desc + '</td>' +
        '<td>' + target + esc(value) + err + shot + '</td>' +
        '<td>' + icon + '</td>' +
        '<td>' + esc(fmtDuration(s.durationMs)) + '</td>' +
      '</tr>';
    }).join('');

    return '<table class="steps-table">' +
      '<thead><tr><th>#</th><th>Action</th><th>Target / Value</th><th>Status</th><th>Duration</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  }

  /* ── Toggle run expand ──────────────────────────────────────────────── */
  async function toggleRun(runId) {
    const wasExpanded = state.expandedRunId === runId;
    state.expandedRunId = wasExpanded ? null : runId;

    // Optimistically re-render list (collapses or shows spinner)
    renderRunsList();

    if (!wasExpanded) {
      try {
        await fetchRunDetail(runId);
        // After load, patch the detail section in-place
        const detailEl = document.getElementById('detail-' + runId);
        const cardEl   = document.getElementById('run-' + runId);
        if (detailEl && state.loadedDetails[runId]) {
          detailEl.innerHTML = buildStepTable(state.loadedDetails[runId]);
          cardEl?.classList.add('expanded');
        }
      } catch (e) {
        const detailEl = document.getElementById('detail-' + runId);
        if (detailEl) detailEl.innerHTML = '<div class="error-card" style="margin:12px">' + esc(e.message) + '</div>';
      }
    }
  }

  /* ── Snapshot on Enter key ──────────────────────────────────────────── */
  document.getElementById('snapshot-url').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') takeSnapshot();
  });

  /* ── Init + poll ────────────────────────────────────────────────────── */
  fetchHealth();
  fetchRuns();
  setInterval(fetchHealth, 10000);
  setInterval(fetchRuns,   10000);
</script>
</body>
</html>`;
}
