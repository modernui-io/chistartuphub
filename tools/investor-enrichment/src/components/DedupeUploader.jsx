// DedupeUploader.jsx
// Step for uploading existing data for deduplication

function DedupeUploader({
  selectedMode,
  existingFileName,
  existingData,
  onExistingUpload,
  onSkip,
  onBack,
  onContinue
}) {
  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) onExistingUpload(file)
  }

  return (
    <div className="step-content fade-in">
      <div className="step-header">
        <h2>Deduplicate Against Existing Data</h2>
        <p>Optionally upload your existing {selectedMode?.name?.toLowerCase() || 'entity'} list to check for duplicates before enrichment.</p>
      </div>

      <div className="dedupe-options">
        <div className="dedupe-option-card">
          <div className="dedupe-icon">📋</div>
          <h3>Upload Existing List</h3>
          <p>We'll compare your new data against your existing records and flag duplicates.</p>
          <label className="browse-button" style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}>
            <span>Choose Existing File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileInput}
            />
          </label>
          {existingFileName && (
            <div className="existing-file-badge">
              <span className="file-icon">✓</span>
              {existingFileName} ({existingData.length} records)
            </div>
          )}
        </div>

        <div className="dedupe-divider">
          <span>OR</span>
        </div>

        <div className="dedupe-option-card secondary">
          <div className="dedupe-icon">⏭</div>
          <h3>Skip Deduplication</h3>
          <p>Proceed directly to enrichment without checking for existing records.</p>
          <button onClick={onSkip} className="btn btn-secondary">
            Skip This Step
          </button>
        </div>
      </div>

      <div className="tips">
        <h4>Why deduplicate?</h4>
        <ul>
          <li>Avoid processing records you already have</li>
          <li>Identify updates vs. new additions</li>
          <li>Keep your database clean and accurate</li>
        </ul>
      </div>

      <div className="step-actions">
        <button onClick={onBack} className="btn btn-secondary">
          Back to Mapping
        </button>
        {existingData.length > 0 && (
          <button
            onClick={onContinue}
            className="btn btn-primary btn-lg"
            style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}
          >
            Continue with Deduplication
          </button>
        )}
      </div>
    </div>
  )
}

export default DedupeUploader
