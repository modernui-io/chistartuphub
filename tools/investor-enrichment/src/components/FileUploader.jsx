// FileUploader.jsx
// File upload component with drag-and-drop support

import { useState, useCallback } from 'react'

function FileUploader({
  selectedMode,
  onFileUpload,
  onBack,
  title,
  description,
  expectedFields = null
}) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileUpload(file)
  }, [onFileUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) onFileUpload(file)
  }

  // Use provided fields or derive from mode
  const fieldsToShow = expectedFields || selectedMode?.fields || []

  return (
    <div className="step-content fade-in">
      <div className="step-header">
        <h2>{title || `Upload your ${selectedMode?.name?.toLowerCase() || 'entity'} data`}</h2>
        <p>
          {description || `Import your ${selectedMode?.name?.toLowerCase() || 'entity'} list in CSV or Excel format. We'll auto-detect columns for ${selectedMode?.name || 'your'} mode.`}
        </p>
      </div>

      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon" style={{ color: selectedMode?.color || '#3b82f6' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3>Drop your {selectedMode?.name?.toLowerCase() || 'data'} file here</h3>
          <p>or click to browse your computer</p>
          <div className="file-types">
            <span className="file-type">.CSV</span>
            <span className="file-type">.XLSX</span>
            <span className="file-type">.XLS</span>
          </div>
          <label className="browse-button" style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}>
            <span>Choose File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {fieldsToShow.length > 0 && (
        <div className="tips">
          <h4>Expected Columns for {selectedMode?.name || 'This'} Mode</h4>
          <ul>
            {fieldsToShow.filter(f => f.required).map(field => (
              <li key={field.key}><strong>{field.label}</strong> (required)</li>
            ))}
            {fieldsToShow.filter(f => !f.required).slice(0, 4).map(field => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
        </div>
      )}

      {onBack && (
        <div className="step-actions">
          <button onClick={onBack} className="btn btn-secondary">
            Back
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUploader
