// ModeSelector.jsx
// Mode selection step - allows users to choose what type of entity to enrich

import { getAllModes } from '../lib/modes'

function ModeSelector({ onModeSelect }) {
  const modes = getAllModes()

  return (
    <div className="step-content fade-in">
      <div className="step-header center">
        <h2>What are you enriching today?</h2>
        <p>Select an enrichment mode to get started. Each mode is optimized for its specific data type.</p>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className="mode-card"
            onClick={() => onModeSelect(mode.id)}
            style={{ '--mode-color': mode.color }}
          >
            <div className="mode-icon">{mode.icon}</div>
            <h3>{mode.name}</h3>
            <p>{mode.description}</p>
            <div className="mode-fields">
              {mode.fields.slice(0, 4).map((field) => (
                <span key={field.key} className="mode-field-tag">
                  {field.label}
                </span>
              ))}
              {mode.fields.length > 4 && (
                <span className="mode-field-tag more">+{mode.fields.length - 4} more</span>
              )}
            </div>
            <div className="mode-sources">
              <span className="mode-source-label">Enrichment sources:</span>
              <span className="mode-source-count">{mode.enrichmentSources.length} available</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mode-tips">
        <h4>How it works</h4>
        <ul>
          <li><strong>Mode-specific fields:</strong> Each mode knows what data to look for</li>
          <li><strong>Smart column mapping:</strong> We'll auto-detect columns based on your mode</li>
          <li><strong>Tailored enrichment:</strong> Different sources for investors vs contacts vs companies</li>
          <li><strong>Custom mode:</strong> Create your own field structure for unique use cases</li>
        </ul>
      </div>
    </div>
  )
}

export default ModeSelector
