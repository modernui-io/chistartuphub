// TierTabs.jsx
// Tab navigation for different data tiers (clean, reprocess, archive)

function TierTabs({
  activeView,
  onViewChange,
  enrichedData,
  tierData
}) {
  const tabs = [
    { id: 'all', label: 'All', icon: '📊', count: enrichedData.length },
    { id: 'clean', label: 'Clean Tank', icon: '✅', count: tierData.cleanTank.length, className: 'tier-clean' },
    { id: 'reprocess', label: 'Re-Diligence', icon: '🔄', count: tierData.reprocessQueue.length, className: 'tier-reprocess' },
    { id: 'archive', label: 'Archive', icon: '📦', count: tierData.archive.length, className: 'tier-archive' }
  ]

  return (
    <div className="tier-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tier-tab ${tab.className || ''} ${activeView === tab.id ? 'active' : ''}`}
          onClick={() => onViewChange(tab.id)}
        >
          {tab.icon} {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  )
}

export default TierTabs
