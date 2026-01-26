import { useState, useEffect } from 'react'
import { exportToCSV, exportToExcel, exportToJSON } from './lib/parser'
import { setDatabase, getDatabaseSize } from './lib/enrich-from-db'
import { getMode } from './lib/modes'

// Components
import {
  ModeSelector,
  FileUploader,
  ColumnMapper,
  DedupeUploader,
  EnrichmentPanel,
  TierTabs,
  ResultsDisplay,
  ExportPanel
} from './components'

// Hooks
import { useFileUpload, useExistingDataUpload } from './hooks/useFileUpload'
import { useEnrichment } from './hooks/useEnrichment'

// Dynamic steps based on selected mode
const getSteps = (mode) => [
  { id: 0, name: 'Mode', icon: '🎯', description: 'Select enrichment type' },
  { id: 1, name: 'Upload', icon: '📤', description: `Import your ${mode?.name?.toLowerCase() || 'entity'} data` },
  { id: 2, name: 'Map', icon: '🧹', description: 'Map columns & normalize' },
  { id: 3, name: 'Existing', icon: '📋', description: 'Upload existing data for dedupe' },
  { id: 4, name: 'Enrich', icon: '🔮', description: 'Smart enrichment' },
  { id: 5, name: 'Review', icon: '🔍', description: 'Check confidence scores' },
  { id: 6, name: 'Export', icon: '✨', description: 'Download enriched data' }
]

function App() {
  // Core navigation state
  const [step, setStep] = useState(0)
  const [selectedMode, setSelectedMode] = useState(null)
  const [dbSize, setDbSize] = useState(0)
  const [globalError, setGlobalError] = useState(null)
  const [activeView, setActiveView] = useState('all')

  // Use custom hooks
  const fileUpload = useFileUpload(selectedMode)
  const existingUpload = useExistingDataUpload()
  const enrichment = useEnrichment(selectedMode)

  const STEPS = getSteps(selectedMode)

  // Load VC database on mount
  useEffect(() => {
    loadVcDatabase()
  }, [])

  const loadVcDatabase = async () => {
    try {
      const response = await fetch('/vc-database.json')
      if (response.ok) {
        const data = await response.json()
        const count = setDatabase(data)
        setDbSize(count)
      }
    } catch (err) {
      console.log('No local VC database found, enrichment will be limited')
    }
  }

  // Mode selection
  const handleModeSelect = (modeId) => {
    const mode = getMode(modeId)
    setSelectedMode(mode)
    setStep(1)
  }

  // File upload complete
  const handleFileUploadComplete = async (file) => {
    const result = await fileUpload.handleFileUpload(file)
    if (result.success) setStep(2)
  }

  // Existing data upload
  const handleExistingUploadComplete = async (file) => {
    const result = await existingUpload.handleExistingUpload(file)
    if (result.success) setStep(4)
  }

  // Process enrichment
  const handleEnrichment = async () => {
    const result = await enrichment.processEnrichment(
      fileUpload.rawData,
      fileUpload.mappings,
      existingUpload.existingData
    )
    if (result.success) {
      setActiveView('all')
      setStep(5)
    }
  }

  // Quick process
  const handleQuickProcess = () => {
    const result = enrichment.processQuick(fileUpload.rawData, fileUpload.mappings)
    if (result.success) {
      setActiveView('all')
      setStep(5)
    }
  }

  // Export handler
  const handleExport = (format, exportSelection) => {
    let dataToExport = []
    const tierLabels = []

    if (exportSelection.clean) {
      dataToExport = [...dataToExport, ...enrichment.tierData.cleanTank.map(r => ({ ...r, tier: 'clean_tank' }))]
      tierLabels.push('clean')
    }
    if (exportSelection.reprocess) {
      dataToExport = [...dataToExport, ...enrichment.tierData.reprocessQueue.map(r => ({ ...r, tier: 'rediligence' }))]
      tierLabels.push('rediligence')
    }
    if (exportSelection.archive) {
      dataToExport = [...dataToExport, ...enrichment.tierData.archive.map(r => ({ ...r, tier: 'archive' }))]
      tierLabels.push('archive')
    }

    const exportData = dataToExport.map(({ id, fieldScores, urlValidated, websiteScraped, reEnriched, ...rest }) => ({
      ...rest,
      reEnriched: reEnriched || false
    }))

    const tierSuffix = tierLabels.length === 3 ? 'all' : tierLabels.join('-')
    const entityName = selectedMode?.name?.toLowerCase() || 'data'
    const filename = `${entityName}-${tierSuffix}-${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'csv': exportToCSV(exportData, `${filename}.csv`); break
      case 'excel': exportToExcel(exportData, `${filename}.xlsx`); break
      case 'json': exportToJSON(exportData, `${filename}.json`); break
    }
  }

  // Reset everything
  const handleReset = () => {
    setStep(0)
    setSelectedMode(null)
    setActiveView('all')
    fileUpload.resetFileState()
    existingUpload.clearExistingData()
    enrichment.resetEnrichment()
  }

  // Combined loading and error state
  const isLoading = fileUpload.loading || existingUpload.loading || enrichment.loading
  const error = globalError || fileUpload.error || existingUpload.error || enrichment.error
  const clearError = () => {
    setGlobalError(null)
    fileUpload.setError(null)
    existingUpload.error && existingUpload.clearExistingData()
    enrichment.setError(null)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">{selectedMode?.icon || '💎'}</span>
            <div>
              <h1>{selectedMode ? `${selectedMode.name} Enrichment` : 'Data Enrichment'}</h1>
              <p className="tagline">{selectedMode?.description || 'Transform raw data into actionable insights'}</p>
            </div>
          </div>
          <div className="header-right">
            {selectedMode && dbSize > 0 && (
              <span className="db-badge" title={`${selectedMode.name} database loaded`}>
                🗃️ {dbSize.toLocaleString()} records
              </span>
            )}
            {selectedMode && (
              <span className="mode-badge" style={{ backgroundColor: selectedMode.color + '20', color: selectedMode.color }}>
                {selectedMode.icon} {selectedMode.name} Mode
              </span>
            )}
            {step > 0 && (
              <button onClick={handleReset} className="btn btn-ghost">
                <span>↺</span> Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="steps">
          {STEPS.map((s, index) => (
            <div key={s.id} className={`step ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
              <div className="step-icon">{s.icon}</div>
              <div className="step-info">
                <span className="step-name">{s.name}</span>
                <span className="step-desc">{s.description}</span>
              </div>
              {index < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Main Content */}
      <main className="main">
        {step === 0 && <ModeSelector onModeSelect={handleModeSelect} />}

        {step === 1 && selectedMode && (
          <FileUploader
            selectedMode={selectedMode}
            onFileUpload={handleFileUploadComplete}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && selectedMode && (
          <ColumnMapper
            selectedMode={selectedMode}
            rawData={fileUpload.rawData}
            headers={fileUpload.headers}
            mappings={fileUpload.mappings}
            setMappings={fileUpload.setMappings}
            fileName={fileUpload.fileName}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && selectedMode && (
          <DedupeUploader
            selectedMode={selectedMode}
            existingData={existingUpload.existingData}
            existingFileName={existingUpload.existingFileName}
            onExistingUpload={handleExistingUploadComplete}
            onSkip={() => { existingUpload.clearExistingData(); setStep(4) }}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && selectedMode && (
          <EnrichmentPanel
            selectedMode={selectedMode}
            rawData={fileUpload.rawData}
            dbSize={dbSize}
            enrichmentOptions={enrichment.enrichmentOptions}
            setEnrichmentOptions={enrichment.setEnrichmentOptions}
            onProcess={handleEnrichment}
            onQuickProcess={handleQuickProcess}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && selectedMode && (
          <ResultsDisplay
            selectedMode={selectedMode}
            enrichedData={enrichment.enrichedData}
            tierData={enrichment.tierData}
            stats={enrichment.stats}
            activeView={activeView}
            setActiveView={setActiveView}
            onReEnrich={enrichment.handleReEnrich}
            onBack={() => setStep(4)}
            onContinue={() => setStep(6)}
          />
        )}

        {step === 6 && selectedMode && (
          <ExportPanel
            selectedMode={selectedMode}
            tierData={enrichment.tierData}
            stats={enrichment.stats}
            onExport={handleExport}
            onBack={() => setStep(5)}
            onReset={handleReset}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-card">
              <div className="spinner" />
              <p>
                {step === 1 || step === 3 ? 'Reading file...' :
                 step === 4 ? `Enriching data... ${enrichment.progress.current}/${enrichment.progress.total}` :
                 step === 5 && enrichment.progress.total > 0 ? `🔮 Intensive Re-Enrichment... ${enrichment.progress.current}/${enrichment.progress.total}` :
                 'Processing data...'}
              </p>
              {(step === 4 || step === 5) && enrichment.progress.total > 0 && (
                <div className="enrichment-progress">
                  <div
                    className="enrichment-progress-bar"
                    style={{ width: `${(enrichment.progress.current / enrichment.progress.total) * 100}%` }}
                  />
                </div>
              )}
              <span className="loading-hint">
                {step === 5 && enrichment.progress.total > 0 ?
                  'Running intensive enrichment with fuzzy matching and website scraping...' :
                  enrichment.enrichmentOptions.scrapeWebsites ?
                    'Scraping websites takes a bit longer...' :
                    'This usually takes a few seconds'}
              </span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="error-toast">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={clearError}>×</button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
