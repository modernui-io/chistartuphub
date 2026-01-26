// ColumnMapper.jsx
// Column mapping step - maps CSV columns to mode fields

function ColumnMapper({
  selectedMode,
  rawData,
  headers,
  mappings,
  onMappingsChange,
  fileName,
  onBack,
  onContinue
}) {
  const handleMappingChange = (fieldKey, value) => {
    onMappingsChange({ ...mappings, [fieldKey]: value })
  }

  return (
    <div className="step-content fade-in">
      <div className="step-header">
        <h2>Column Mapping</h2>
        <p>
          We detected <strong>{rawData.length}</strong> {selectedMode?.name?.toLowerCase() || 'record'}s
          from <strong>{fileName}</strong>. Review the column mappings below.
        </p>
      </div>

      <div className="mapping-card">
        <div className="mapping-grid">
          {selectedMode?.fields.map((field) => (
            <div key={field.key} className="mapping-row">
              <label className="mapping-label">
                {field.label}
                {field.required && <span className="required-badge">*</span>}
              </label>
              <div className="mapping-select-wrapper">
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="mapping-select"
                >
                  <option value="">— Not mapped —</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {mappings[field.key] && <span className="mapping-check">✓</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mapping-preview">
          <h4>Preview (first 3 rows)</h4>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {headers.slice(0, 5).map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {headers.slice(0, 5).map(h => <td key={h}>{row[h] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
        <button
          onClick={onContinue}
          className="btn btn-primary btn-lg"
          style={{ backgroundColor: selectedMode?.color || '#3b82f6' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default ColumnMapper
