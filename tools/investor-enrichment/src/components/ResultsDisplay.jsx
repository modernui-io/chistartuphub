// ResultsDisplay.jsx
// Results review step - shows enriched data with stats and tier management

import { getConfidenceColor } from '../lib/score'
import TierTabs from './TierTabs'

function ResultsDisplay({
  selectedMode,
  enrichedData,
  tierData,
  stats,
  activeView,
  onViewChange,
  onReEnrich,
  onBack,
  onContinue,
  loading
}) {
  // Get data for current view
  const getDisplayData = () => {
    switch (activeView) {
      case 'clean': return tierData.cleanTank
      case 'reprocess': return tierData.reprocessQueue
      case 'archive': return tierData.archive
      default: return enrichedData
    }
  }

  const displayData = getDisplayData()
  const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

  return (
    <div className="step-content fade-in">
      <div className="step-header">
        <h2>Review Enriched Data</h2>
        <p>Your data has been cleaned and enriched. Review the results below.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">{selectedMode?.icon || '📊'}</div>
          <div className="stat-value">{stats?.total}</div>
          <div className="stat-label">Total {selectedMode?.name || 'Investor'}s</div>
        </div>
        <div className="stat-card good">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats?.autoApprove}</div>
          <div className="stat-label">High Confidence ({thresholds.clean}+)</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{(stats?.highConfidence || 0) + (stats?.needsReview || 0)}</div>
          <div className="stat-label">Medium ({thresholds.review}-{thresholds.clean - 1})</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats?.avgConfidence}%</div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>

      {/* Deduplication Stats */}
      {stats?.dedupe && (
        <div className="dedupe-stats">
          <span className="dedupe-badge">
            Dedupe: {stats.dedupe.duplicatesRemoved} removed ({stats.dedupe.deduplicationRate})
            {stats.dedupe.existingMatches > 0 && (
              <span> • {stats.dedupe.existingMatches} matched existing</span>
            )}
            {stats.dedupe.batchMatches > 0 && (
              <span> • {stats.dedupe.batchMatches} within batch</span>
            )}
          </span>
        </div>
      )}

      {/* Tier Navigation Tabs */}
      <TierTabs
        activeView={activeView}
        onViewChange={onViewChange}
        enrichedData={enrichedData}
        tierData={tierData}
      />

      {/* Tier-Specific Action Panel */}
      {activeView === 'reprocess' && tierData.reprocessQueue.length > 0 && (
        <div className="tier-action-panel">
          <div className="tier-action-info">
            <h4>Intensive Re-Enrichment</h4>
            <p>
              Run a more aggressive enrichment pass on these {tierData.reprocessQueue.length} records
              to try to reach 75%+ confidence. This includes:
            </p>
            <ul className="methodology-list">
              <li>Fuzzy name matching against VC database</li>
              <li>Full website scraping with longer timeouts</li>
              <li>Check size extraction from descriptions</li>
              <li>Intensive scoring boosts (+35% potential)</li>
            </ul>
          </div>
          <button onClick={onReEnrich} className="btn btn-primary btn-lg" disabled={loading}>
            Start Intensive Re-Enrichment
          </button>
        </div>
      )}

      {activeView === 'clean' && tierData.cleanTank.length > 0 && (
        <div className="tier-action-panel tier-clean-panel">
          <div className="tier-action-info">
            <h4>✅ Ready for Use</h4>
            <p>
              These {tierData.cleanTank.length} records have {thresholds.clean}%+ confidence and are ready
              for immediate use in your outreach campaigns.
            </p>
          </div>
        </div>
      )}

      {activeView === 'archive' && tierData.archive.length > 0 && (
        <div className="tier-action-panel tier-archive-panel">
          <div className="tier-action-info">
            <h4>Archived for Later</h4>
            <p>
              These {tierData.archive.length} records have less than {thresholds.review}% confidence.
              They may need manual research or better source data.
            </p>
          </div>
        </div>
      )}

      {/* Re-enrichment Results */}
      {stats?.reEnrichedCount > 0 && (
        <div className="reenrich-results">
          <h4>Re-Enrichment Results</h4>
          <div className="reenrich-stats">
            <span className="reenrich-stat">
              <strong>{stats.reEnrichedCount}</strong> records re-processed
            </span>
            <span className="reenrich-stat good">
              <strong>{stats.improvedToClean || 0}</strong> moved to Clean Tank
            </span>
          </div>
        </div>
      )}

      {/* Enrichment Sources */}
      {(stats?.urlsValidated > 0 || stats?.dbEnriched > 0 || stats?.websitesScraped > 0) && (
        <div className="enrichment-summary">
          <h4>Enrichment Sources Used</h4>
          <div className="source-tags">
            {stats?.dbEnriched > 0 && (
              <span className="source-tag">DB Match: {stats.dbEnriched}</span>
            )}
            {stats?.urlsValidated > 0 && (
              <span className="source-tag">URLs Validated: {stats.urlsValidated}</span>
            )}
            {stats?.websitesScraped > 0 && (
              <span className="source-tag">Websites Scraped: {stats.websitesScraped}</span>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>
            {activeView === 'all' && 'All Investors'}
            {activeView === 'clean' && '✅ Clean Tank'}
            {activeView === 'reprocess' && 'Re-Diligence Queue'}
            {activeView === 'archive' && 'Archived'}
          </h3>
          <span className="record-count">{displayData.length} records</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Name</th>
                <th>Website</th>
                <th>Location</th>
                <th>Stages</th>
                <th>Sectors</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {displayData.slice(0, 20).map((row) => (
                <tr key={row.id} className={`${row.needsReview ? 'needs-review' : ''} ${row.reEnriched ? 're-enriched' : ''}`}>
                  <td>
                    <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(row.confidence) }}>
                      {row.confidence}
                      {row.reEnriched && <span className="re-enriched-badge" title="Re-enriched">↑</span>}
                    </div>
                  </td>
                  <td className="name-cell">{row.name || '—'}</td>
                  <td className="website-cell">
                    {row.website ? (
                      <span className="website-with-status">
                        <a href={row.website} target="_blank" rel="noopener noreferrer">
                          {row.website.replace('https://', '').substring(0, 20)}
                        </a>
                        {row.urlValidated && <span className="url-valid" title="URL verified">✓</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{row.location || '—'}</td>
                  <td>
                    <div className="tags">
                      {row.stages?.slice(0, 2).map((s, i) => (
                        <span key={i} className="tag tag-stage">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="tags">
                      {row.sectors?.slice(0, 2).map((s, i) => (
                        <span key={i} className="tag tag-sector">{s}</span>
                      ))}
                      {row.sectors?.length > 2 && <span className="tag tag-more">+{row.sectors.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="source-icons">
                      {row.sources?.includes('existing_db') && <span title="Matched in DB">🗃️</span>}
                      {row.urlValidated && <span title="URL Validated">🔗</span>}
                      {row.websiteScraped && <span title="Website Scraped">🌐</span>}
                      {row.sources?.length === 1 && row.sources[0] === 'csv_import' && <span title="CSV Only">📄</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayData.length > 20 && (
          <div className="table-footer">
            Showing 20 of {displayData.length} records
          </div>
        )}
      </div>

      <div className="step-actions">
        <button onClick={onBack} className="btn btn-secondary">
          Back to Options
        </button>
        <button
          onClick={onContinue}
          className="btn btn-primary btn-lg"
          style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}
        >
          Continue to Export
        </button>
      </div>
    </div>
  )
}

export default ResultsDisplay
