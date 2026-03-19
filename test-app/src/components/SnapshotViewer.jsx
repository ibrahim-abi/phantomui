import React, { useState } from 'react'
import aiSdk from '@phantomui/sdk'

export default function SnapshotViewer() {
  const [snapshot, setSnapshot] = useState(null)
  const [filter, setFilter] = useState('all')

  function captureSnapshot() {
    const result = aiSdk.getSnapshot({ root: document, autoTag: true })
    setSnapshot(result)
  }

  const roles = ['all', 'input', 'action', 'nav', 'display']

  const filtered = snapshot
    ? snapshot.elements.filter(el => filter === 'all' || el.role === filter)
    : []

  return (
    <div className="card snapshot-card">
      <h2 data-ai-id="snapshot-title" data-ai-role="display" data-ai-label="Snapshot Viewer Title">
        Live UI Snapshot
      </h2>
      <p className="snapshot-desc">
        Captures all <code>data-ai-*</code> tagged elements currently in the DOM.
      </p>

      <button
        data-ai-id="capture-snapshot-btn"
        data-ai-role="action"
        data-ai-label="Capture Snapshot Button"
        data-ai-action="captures the current UI snapshot"
        className="btn btn-primary"
        onClick={captureSnapshot}
      >
        Capture Snapshot
      </button>

      {snapshot && (
        <>
          <div className="snapshot-meta">
            <span>SDK v{aiSdk.version}</span>
            <span>Manual: <strong>{snapshot.meta.manualCount}</strong></span>
            <span>Auto: <strong>{snapshot.meta.autoCount}</strong></span>
            <span>Total: <strong>{snapshot.elements.length}</strong></span>
            <span className="timestamp">{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="filter-row">
            {roles.map(r => (
              <button
                key={r}
                data-ai-id={`filter-${r}`}
                data-ai-role="action"
                data-ai-label={`Filter by ${r}`}
                className={`filter-btn ${filter === r ? 'active' : ''}`}
                onClick={() => setFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="element-grid">
            {filtered.map(el => (
              <div key={el.id} className={`element-card source-${el.source}`}>
                <div className="element-header">
                  <code className="element-id">{el.id}</code>
                  <span className={`badge role-${el.role}`}>{el.role}</span>
                  <span className={`badge source-badge`}>{el.source}</span>
                </div>
                {el.label && <div className="element-label">{el.label}</div>}
                {el.action && <div className="element-action">⚡ {el.action}</div>}
                {el.context && <div className="element-context">📁 {el.context}</div>}
                {el.state && <div className="element-state">◉ {el.state}</div>}
                {el.required && <div className="element-required">* Required</div>}
              </div>
            ))}
          </div>

          <details className="raw-json">
            <summary>Raw JSON</summary>
            <pre>{JSON.stringify(snapshot, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  )
}
