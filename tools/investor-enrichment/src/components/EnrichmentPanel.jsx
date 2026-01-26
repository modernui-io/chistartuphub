// EnrichmentPanel.jsx
// Enrichment options step - configure how to enrich data

function EnrichmentPanel({
  selectedMode,
  rawData,
  dbSize,
  enrichmentOptions,
  onOptionsChange,
  onBack,
  onSkipEnrichment,
  onStartEnrichment
}) {
  const handleOptionToggle = (optionKey, value) => {
    onOptionsChange({ ...enrichmentOptions, [optionKey]: value })
  }

  // Calculate expected confidence improvement
  const getExpectedConfidence = () => {
    const { useDatabase, validateUrls, scrapeWebsites } = enrichmentOptions
    if (useDatabase && validateUrls && scrapeWebsites) return '90'
    if (useDatabase && validateUrls) return '85'
    if (useDatabase || validateUrls) return '75'
    return '65'
  }

  return (
    <div className="step-content fade-in">
      <div className="step-header">
        <h2>Smart Enrichment</h2>
        <p>Choose how you want to enrich your <strong>{rawData.length}</strong> {selectedMode?.name?.toLowerCase() || 'record'}s.</p>
      </div>

      <div className="enrichment-options">
        <div className="option-card">
          <div className="option-header">
            <h3>Database Matching</h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={enrichmentOptions.useDatabase}
                onChange={(e) => handleOptionToggle('useDatabase', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <p>Match against our verified database of {dbSize.toLocaleString()} VCs to fill in missing data.</p>
          <div className="option-stats">
            <span className="stat-pill">+15-25 confidence</span>
            <span className="stat-pill">Instant</span>
            <span className="stat-pill green">Free</span>
          </div>
        </div>

        <div className="option-card">
          <div className="option-header">
            <h3>URL Validation</h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={enrichmentOptions.validateUrls}
                onChange={(e) => handleOptionToggle('validateUrls', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <p>Verify that each investor's website is live and responding.</p>
          <div className="option-stats">
            <span className="stat-pill">+20-30 confidence</span>
            <span className="stat-pill">~{Math.ceil(rawData.length / 5)}s</span>
            <span className="stat-pill green">Free</span>
          </div>
        </div>

        <div className="option-card">
          <div className="option-header">
            <h3>Website Scraping</h3>
            <label className="toggle">
              <input
                type="checkbox"
                checked={enrichmentOptions.scrapeWebsites}
                onChange={(e) => handleOptionToggle('scrapeWebsites', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <p>Extract descriptions, sectors, and stages from each investor's website.</p>
          <div className="option-stats">
            <span className="stat-pill">+25-35 confidence</span>
            <span className="stat-pill">~{Math.ceil(rawData.length * 2)}s</span>
            <span className="stat-pill green">Free</span>
          </div>
          {enrichmentOptions.scrapeWebsites && (
            <div className="option-warning">
              This may take longer and some sites may block requests
            </div>
          )}
        </div>
      </div>

      <div className="enrichment-preview">
        <h4>Expected Results</h4>
        <div className="preview-stats">
          <div className="preview-stat">
            <span className="preview-label">Without enrichment</span>
            <span className="preview-value">~65% avg confidence</span>
          </div>
          <div className="preview-stat highlight">
            <span className="preview-label">With selected options</span>
            <span className="preview-value">~{getExpectedConfidence()}% avg confidence</span>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
        <button onClick={onSkipEnrichment} className="btn btn-ghost">
          Skip Enrichment
        </button>
        <button
          onClick={onStartEnrichment}
          className="btn btn-primary btn-lg"
          style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}
        >
          Start Enrichment
        </button>
      </div>
    </div>
  )
}

export default EnrichmentPanel
