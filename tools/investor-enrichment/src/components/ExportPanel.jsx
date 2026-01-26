// ExportPanel.jsx
// Export step - select tiers and export format

import { useState } from 'react'

function ExportPanel({
  selectedMode,
  tierData,
  stats,
  onExport,
  onBack,
  onReset
}) {
  const [exportSelection, setExportSelection] = useState({
    clean: true,
    reprocess: false,
    archive: false
  })
  const [exported, setExported] = useState(false)

  const handleExport = (format) => {
    onExport(format, exportSelection)
    setExported(true)
  }

  const selectedCount =
    (exportSelection.clean ? tierData.cleanTank.length : 0) +
    (exportSelection.reprocess ? tierData.reprocessQueue.length : 0) +
    (exportSelection.archive ? tierData.archive.length : 0)

  const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

  return (
    <div className="step-content fade-in">
      <div className="step-header center">
        <div className="success-icon">🎉</div>
        <h2>Your data is ready!</h2>
        <p>Select which tiers to export and choose your preferred format.</p>
      </div>

      {/* Tier Selection for Export */}
      <div className="export-tier-selection">
        <h4>Select Data to Export</h4>
        <div className="tier-checkboxes">
          <label className={`tier-checkbox ${exportSelection.clean ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={exportSelection.clean}
              onChange={(e) => setExportSelection({ ...exportSelection, clean: e.target.checked })}
            />
            <span className="tier-checkbox-content">
              <span className="tier-checkbox-icon">✅</span>
              <span className="tier-checkbox-label">Clean Tank</span>
              <span className="tier-checkbox-count">{tierData.cleanTank.length} records</span>
              <span className="tier-checkbox-desc">Ready for use ({thresholds.clean}%+)</span>
            </span>
          </label>
          <label className={`tier-checkbox ${exportSelection.reprocess ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={exportSelection.reprocess}
              onChange={(e) => setExportSelection({ ...exportSelection, reprocess: e.target.checked })}
            />
            <span className="tier-checkbox-content">
              <span className="tier-checkbox-icon">🔄</span>
              <span className="tier-checkbox-label">Re-Diligence</span>
              <span className="tier-checkbox-count">{tierData.reprocessQueue.length} records</span>
              <span className="tier-checkbox-desc">Medium confidence ({thresholds.review}-{thresholds.clean - 1}%)</span>
            </span>
          </label>
          <label className={`tier-checkbox ${exportSelection.archive ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={exportSelection.archive}
              onChange={(e) => setExportSelection({ ...exportSelection, archive: e.target.checked })}
            />
            <span className="tier-checkbox-content">
              <span className="tier-checkbox-icon">📦</span>
              <span className="tier-checkbox-label">Archive</span>
              <span className="tier-checkbox-count">{tierData.archive.length} records</span>
              <span className="tier-checkbox-desc">Low confidence (&lt;{thresholds.review}%)</span>
            </span>
          </label>
        </div>
        <div className="export-selection-summary">
          <strong>{selectedCount} records selected</strong>
        </div>
      </div>

      <div className="export-grid">
        <button
          onClick={() => handleExport('csv')}
          className={`export-card ${exported ? 'exported' : ''}`}
          disabled={selectedCount === 0}
        >
          <div className="export-icon">📄</div>
          <h3>CSV File</h3>
          <p>Comma-separated values, works everywhere</p>
          <span className="export-badge">Recommended</span>
        </button>

        <button
          onClick={() => handleExport('excel')}
          className={`export-card ${exported ? 'exported' : ''}`}
          disabled={selectedCount === 0}
        >
          <div className="export-icon">📊</div>
          <h3>Excel File</h3>
          <p>Native Excel format with formatting</p>
        </button>

        <button
          onClick={() => handleExport('json')}
          className={`export-card ${exported ? 'exported' : ''}`}
          disabled={selectedCount === 0}
        >
          <div className="export-icon">{'{ }'}</div>
          <h3>JSON File</h3>
          <p>Structured data for developers</p>
        </button>
      </div>

      {exported && (
        <div className="export-success fade-in">
          <span className="check-animation">✓</span>
          <p>File downloaded successfully!</p>
        </div>
      )}

      <div className="summary-card">
        <h4>Final Summary</h4>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Total Records</span>
            <span className="summary-value">{stats?.total}</span>
          </div>
          <div className="summary-item good">
            <span className="summary-label">✅ Clean Tank ({thresholds.clean}%+)</span>
            <span className="summary-value">{tierData.cleanTank.length}</span>
          </div>
          <div className="summary-item warning">
            <span className="summary-label">🔄 Re-Diligence ({thresholds.review}-{thresholds.clean - 1}%)</span>
            <span className="summary-value">{tierData.reprocessQueue.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">📦 Archive (&lt;{thresholds.review}%)</span>
            <span className="summary-value">{tierData.archive.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Score</span>
            <span className="summary-value">{stats?.avgConfidence}%</span>
          </div>
          {stats?.reEnrichedCount > 0 && (
            <div className="summary-item">
              <span className="summary-label">Re-Enriched</span>
              <span className="summary-value">{stats.reEnrichedCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="step-actions center">
        <button onClick={onBack} className="btn btn-secondary">
          Back to Review
        </button>
        <button
          onClick={onReset}
          className="btn btn-primary btn-lg"
          style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}
        >
          Start New Enrichment
        </button>
      </div>
    </div>
  )
}

export default ExportPanel
