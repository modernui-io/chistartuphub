import React, { useState, useRef } from "react";
import { X, Download, Check, FileText, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ExportResourcesModal({ isOpen, onClose, resources, getTypeLabel }) {
  const { profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState([]);
  const [step, setStep] = useState("select"); // select | preview
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const MAX_EXPORT = 10;

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < MAX_EXPORT) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    const ids = resources.slice(0, MAX_EXPORT).map((r) => r.id);
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectedResources = resources.filter((r) => selectedIds.includes(r.id));

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ChiStartupHub - Saved Resources</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              background: #0a0a0a;
              color: #ffffff;
              padding: 40px;
              min-height: 100vh;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 32px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              margin-bottom: 32px;
            }
            
            .logo {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .logo-box {
              width: 40px;
              height: 40px;
              border: 2px solid rgba(255,255,255,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Space Mono', monospace;
              font-weight: 700;
              font-size: 14px;
            }
            
            .logo-text {
              font-family: 'Space Mono', monospace;
              font-size: 14px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
            
            .date {
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              color: rgba(255,255,255,0.4);
              text-transform: uppercase;
              letter-spacing: 0.15em;
            }
            
            .title-section {
              margin-bottom: 40px;
            }
            
            .label {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              color: rgba(255,255,255,0.4);
              text-transform: uppercase;
              letter-spacing: 0.2em;
              margin-bottom: 12px;
            }
            
            h1 {
              font-size: 32px;
              font-weight: 400;
              letter-spacing: -0.02em;
              margin-bottom: 8px;
            }
            
            .subtitle {
              color: rgba(255,255,255,0.5);
              font-size: 14px;
            }
            
            .stats {
              display: flex;
              gap: 32px;
              margin-bottom: 40px;
              padding: 20px;
              background: rgba(255,255,255,0.02);
              border: 1px solid rgba(255,255,255,0.1);
            }
            
            .stat-value {
              font-family: 'Space Mono', monospace;
              font-size: 24px;
              font-weight: 700;
            }
            
            .stat-label {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              color: rgba(255,255,255,0.4);
              text-transform: uppercase;
              letter-spacing: 0.15em;
            }
            
            .resources-grid {
              display: grid;
              gap: 0;
              border: 1px solid rgba(255,255,255,0.1);
            }
            
            .resource-card {
              padding: 24px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              background: rgba(0,0,0,0.3);
            }
            
            .resource-card:last-child {
              border-bottom: none;
            }
            
            .resource-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
            }
            
            .resource-number {
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              color: rgba(255,255,255,0.2);
            }
            
            .resource-type {
              font-family: 'Space Mono', monospace;
              font-size: 9px;
              color: rgba(255,255,255,0.5);
              text-transform: uppercase;
              letter-spacing: 0.15em;
              padding: 4px 8px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            
            .resource-name {
              font-family: 'Space Mono', monospace;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-bottom: 8px;
            }
            
            .resource-description {
              color: rgba(255,255,255,0.6);
              font-size: 13px;
              line-height: 1.6;
              margin-bottom: 12px;
            }
            
            .resource-url {
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              color: rgba(255,255,255,0.4);
              word-break: break-all;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 24px;
              border-top: 1px solid rgba(255,255,255,0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .footer-text {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              color: rgba(255,255,255,0.3);
              text-transform: uppercase;
              letter-spacing: 0.15em;
            }
            
            .footer-url {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              color: rgba(255,255,255,0.5);
            }
            
            @media print {
              body {
                background: #0a0a0a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .resource-card {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <div class="logo-box">CS</div>
                <span class="logo-text">ChiStartup Hub</span>
              </div>
              <span class="date">Exported ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div class="title-section">
              <div class="label">[Export: Saved_Resources]</div>
              <h1>Curated Resources</h1>
              <p class="subtitle">Prepared by ${profile?.full_name || 'ChiStartupHub Member'}</p>
            </div>
            
            <div class="stats">
              <div>
                <div class="stat-value">${selectedResources.length}</div>
                <div class="stat-label">Resources</div>
              </div>
              <div>
                <div class="stat-value">${[...new Set(selectedResources.map(r => r.resource_type))].length}</div>
                <div class="stat-label">Categories</div>
              </div>
            </div>
            
            <div class="resources-grid">
              ${selectedResources.map((item, index) => `
                <div class="resource-card">
                  <div class="resource-header">
                    <span class="resource-number">${String(index + 1).padStart(2, '0')}</span>
                    <span class="resource-type">${getTypeLabel(item.resource_type)}</span>
                  </div>
                  <div class="resource-name">${item.resource_name}</div>
                  <div class="resource-description">${item.resource_description || `A curated ${getTypeLabel(item.resource_type).toLowerCase()} from Chicago's startup ecosystem.`}</div>
                  ${item.resource_url ? `<div class="resource-url">${item.resource_url}</div>` : ''}
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <span class="footer-text">ChiStartupHub — Build Your Vision in Chicago</span>
              <span class="footer-url">chistartuphub.com</span>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <FileText className="w-5 h-5 text-white/50" strokeWidth={1.5} />
            <div>
              <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-white">
                Export Resources
              </h2>
              <p className="text-white/40 text-xs mt-1">
                {step === "select"
                  ? `Select up to ${MAX_EXPORT} resources to export`
                  : "Preview your export before downloading"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "select" ? (
            <div className="p-6">
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={selectAll}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black transition-colors"
                  >
                    Select First 10
                  </button>
                  <button
                    onClick={clearSelection}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/40 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <span className="font-mono text-xs text-white/50">
                  {selectedIds.length} / {MAX_EXPORT} selected
                </span>
              </div>

              {/* Resources List */}
              <div className="space-y-2">
                {resources.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isDisabled = !isSelected && selectedIds.length >= MAX_EXPORT;

                  return (
                    <button
                      key={item.id}
                      onClick={() => !isDisabled && toggleSelect(item.id)}
                      disabled={isDisabled}
                      className={`w-full p-4 border text-left transition-all flex items-center gap-4 ${
                        isSelected
                          ? "border-white/30 bg-white/5"
                          : isDisabled
                          ? "border-white/5 opacity-40 cursor-not-allowed"
                          : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-white bg-white"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-black" strokeWidth={2} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-white/20">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-sm uppercase tracking-[0.1em] text-white truncate">
                            {item.resource_name}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] px-2 py-1 border border-white/10 flex-shrink-0">
                        {getTypeLabel(item.resource_type)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="p-6">
              <div
                ref={previewRef}
                className="bg-[#0a0a0a] border border-white/10 p-8 max-w-2xl mx-auto"
              >
                {/* Preview Header */}
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-white/30 flex items-center justify-center font-mono text-sm font-bold">
                      CS
                    </div>
                    <span className="font-mono text-xs uppercase tracking-[0.1em]">
                      ChiStartup Hub
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Preview Title */}
                <div className="mb-8">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em] block mb-3">
                    [Export: Saved_Resources]
                  </span>
                  <h3 className="font-serif text-2xl text-white mb-2">
                    Curated Resources
                  </h3>
                  <p className="text-white/50 text-sm">
                    Prepared by {profile?.full_name || "ChiStartupHub Member"}
                  </p>
                </div>

                {/* Preview Stats */}
                <div className="flex gap-8 p-4 bg-white/[0.02] border border-white/10 mb-8">
                  <div>
                    <span className="font-mono text-xl font-bold text-white block">
                      {selectedResources.length}
                    </span>
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                      Resources
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xl font-bold text-white block">
                      {[...new Set(selectedResources.map((r) => r.resource_type))].length}
                    </span>
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                      Categories
                    </span>
                  </div>
                </div>

                {/* Preview Resources */}
                <div className="border border-white/10">
                  {selectedResources.slice(0, 3).map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-[10px] text-white/20">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[9px] text-white/50 uppercase tracking-[0.15em] px-2 py-0.5 border border-white/20">
                          {getTypeLabel(item.resource_type)}
                        </span>
                      </div>
                      <h4 className="font-mono text-xs uppercase tracking-[0.1em] text-white mb-1">
                        {item.resource_name}
                      </h4>
                      <p className="text-white/50 text-xs line-clamp-1">
                        {item.resource_description || `A curated ${getTypeLabel(item.resource_type).toLowerCase()}`}
                      </p>
                    </div>
                  ))}
                  {selectedResources.length > 3 && (
                    <div className="p-4 text-center">
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                        + {selectedResources.length - 3} more resources
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
                    ChiStartupHub — Build Your Vision in Chicago
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    chistartuphub.com
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          {step === "preview" ? (
            <>
              <button
                onClick={() => setStep("select")}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/20 text-white/60 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                Back to Selection
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  "Exporting..."
                ) : (
                  <>
                    <Download className="w-3 h-3" strokeWidth={1.5} />
                    Export PDF
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                {selectedIds.length === 0
                  ? "Select resources to continue"
                  : `${selectedIds.length} resource${selectedIds.length !== 1 ? "s" : ""} selected`}
              </span>
              <button
                onClick={() => setStep("preview")}
                disabled={selectedIds.length === 0}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-3 h-3" strokeWidth={1.5} />
                Preview Export
                <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
