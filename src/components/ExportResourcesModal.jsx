import { useState, useRef } from "react";
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
      // Lazy-load jsPDF only when user exports (saves 350KB from initial bundle)
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Colors
      const bgColor = [10, 10, 10];
      const textWhite = [255, 255, 255];
      const textGray = [150, 150, 150];
      const textDark = [100, 100, 100];
      const borderColor = [50, 50, 50];

      // Draw dark background
      doc.setFillColor(...bgColor);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);

      // Logo box
      doc.setDrawColor(...textGray);
      doc.rect(margin, yPos, 12, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textWhite);
      doc.text('CS', margin + 6, yPos + 7, { align: 'center' });

      // Logo text
      doc.setFontSize(9);
      doc.text('CHISTARTUPHUB', margin + 16, yPos + 7);

      // Date
      doc.setFontSize(8);
      doc.setTextColor(...textDark);
      const dateText = `EXPORTED ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`;
      doc.text(dateText, pageWidth - margin, yPos + 7, { align: 'right' });

      yPos += 20;

      // Separator line
      doc.setDrawColor(...borderColor);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Title section
      doc.setFontSize(8);
      doc.setTextColor(...textDark);
      doc.text('[EXPORT: SAVED_RESOURCES]', margin, yPos);
      yPos += 8;

      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textWhite);
      doc.text('Curated Resources', margin, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setTextColor(...textGray);
      doc.text(`Prepared by ${profile?.full_name || 'ChiStartupHub Member'}`, margin, yPos);
      yPos += 15;

      // Stats box
      doc.setFillColor(15, 15, 15);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(margin, yPos, contentWidth, 20, 0, 0, 'FD');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textWhite);
      doc.text(String(selectedResources.length), margin + 10, yPos + 13);

      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      doc.text('RESOURCES', margin + 10, yPos + 17);

      const uniqueCategories = [...new Set(selectedResources.map(r => r.resource_type))].length;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textWhite);
      doc.text(String(uniqueCategories), margin + 50, yPos + 13);

      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      doc.text('CATEGORIES', margin + 50, yPos + 17);

      yPos += 30;

      // Resources list
      selectedResources.forEach((item, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 50) {
          doc.addPage();
          doc.setFillColor(...bgColor);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          yPos = margin;
        }

        const cardHeight = 35;

        // Card background
        doc.setFillColor(12, 12, 12);
        doc.setDrawColor(...borderColor);
        doc.rect(margin, yPos, contentWidth, cardHeight, 'FD');

        // Number
        doc.setFontSize(8);
        doc.setTextColor(...textDark);
        doc.text(String(index + 1).padStart(2, '0'), margin + 5, yPos + 8);

        // Type badge
        const typeText = getTypeLabel(item.resource_type).toUpperCase();
        doc.setFontSize(6);
        doc.setTextColor(...textGray);
        const typeWidth = doc.getTextWidth(typeText) + 6;
        doc.setDrawColor(...borderColor);
        doc.rect(pageWidth - margin - typeWidth - 5, yPos + 3, typeWidth, 8);
        doc.text(typeText, pageWidth - margin - typeWidth / 2 - 5, yPos + 8, { align: 'center' });

        // Name
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textWhite);
        const name = item.resource_name.substring(0, 50) + (item.resource_name.length > 50 ? '...' : '');
        doc.text(name.toUpperCase(), margin + 15, yPos + 15);

        // Description
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textGray);
        const description = (item.resource_description || `A curated ${getTypeLabel(item.resource_type).toLowerCase()} from Chicago's startup ecosystem.`).substring(0, 80);
        doc.text(description + (description.length >= 80 ? '...' : ''), margin + 5, yPos + 23);

        // URL if present
        if (item.resource_url) {
          doc.setFontSize(7);
          doc.setTextColor(...textDark);
          const url = item.resource_url.substring(0, 60) + (item.resource_url.length > 60 ? '...' : '');
          doc.text(url, margin + 5, yPos + 30);
        }

        yPos += cardHeight + 2;
      });

      // Footer
      yPos = pageHeight - 15;
      doc.setDrawColor(...borderColor);
      doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      doc.text('CHISTARTUPHUB — BUILD YOUR VISION IN CHICAGO', margin, yPos);
      doc.text('chistartuphub.com', pageWidth - margin, yPos, { align: 'right' });

      // Save the PDF with direct download
      const fileName = `chistartuphub-resources-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 500);

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
      <div className="relative w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3 sm:gap-4">
            <FileText className="w-5 h-5 text-white/50 hidden sm:block" strokeWidth={1.5} />
            <div>
              <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.15em] text-white">
                Export Resources
              </h2>
              <p className="text-white/40 text-xs mt-1 hidden sm:block">
                {step === "select"
                  ? `Select up to ${MAX_EXPORT} resources to export`
                  : "Preview your export before downloading"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "select" ? (
            <div className="p-4 sm:p-6">
              {/* Selection Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={selectAll}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 sm:px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black transition-colors"
                  >
                    Select First 10
                  </button>
                  <button
                    onClick={clearSelection}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 sm:px-4 py-2 border border-white/20 text-white/40 hover:text-white transition-colors"
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
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-0.5 border border-white/20">
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
                  "Generating PDF..."
                ) : (
                  <>
                    <Download className="w-3 h-3" strokeWidth={1.5} />
                    Download PDF
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
