import { useState, useCallback } from 'react';

function formatCheckSize(min, max) {
  const fmt = (n) => {
    if (!n) return '';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  const a = fmt(min), b = fmt(max);
  if (a && b) return `${a}-${b}`;
  if (b) return `Up to ${b}`;
  if (a) return `${a}+`;
  return '';
}

function escapeCSV(val) {
  if (val == null) return '';
  let s = String(val);
  // Prevent CSV formula injection (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes("'")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const useInvestorExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = useCallback((investors, filename = 'investors') => {
    const headers = [
      'Name', 'Type', 'Check Size Min', 'Check Size Max', 'Check Size',
      'Stage Focus', 'City', 'State', 'Midwest', 'Website', 'Sectors',
      'Pipeline Stage', 'Tag', 'Notes',
    ];

    const rows = investors.map((inv) => [
      inv.canonical_name || inv.investor?.canonical_name || '',
      inv.investor_type || inv.investor?.investor_type || '',
      inv.check_size_min || inv.investor?.check_size_min || '',
      inv.check_size_max || inv.investor?.check_size_max || '',
      formatCheckSize(
        inv.check_size_min || inv.investor?.check_size_min,
        inv.check_size_max || inv.investor?.check_size_max
      ),
      inv.stage_focus || inv.investor?.stage_focus || '',
      inv.hq_city || inv.investor?.hq_city || '',
      inv.hq_state || inv.investor?.hq_state || '',
      (inv.is_midwest ?? inv.investor?.is_midwest) ? 'Yes' : 'No',
      inv.website || inv.investor?.website || '',
      (inv.sectors || inv.investor?.sectors || []).join('; '),
      inv.stage || '',
      inv.tag || '',
      inv.notes || '',
    ]);

    const csv = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportPDF = useCallback(async (investors, filename = 'investors', profile = null) => {
    setIsExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      const bgColor = [10, 10, 10];
      const textWhite = [255, 255, 255];
      const textGray = [150, 150, 150];
      const textDark = [100, 100, 100];
      const borderColor = [50, 50, 50];

      const newPage = () => {
        doc.addPage();
        doc.setFillColor(...bgColor);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      };

      // Background
      doc.setFillColor(...bgColor);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header
      doc.setDrawColor(...textGray);
      doc.rect(margin, yPos, 12, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textWhite);
      doc.text('CS', margin + 6, yPos + 7, { align: 'center' });
      doc.setFontSize(9);
      doc.text('CHISTARTUPHUB', margin + 16, yPos + 7);
      doc.setFontSize(8);
      doc.setTextColor(...textDark);
      doc.text(
        `EXPORTED ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`,
        pageWidth - margin, yPos + 7, { align: 'right' }
      );
      yPos += 20;

      doc.setDrawColor(...borderColor);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Title
      doc.setFontSize(8);
      doc.setTextColor(...textDark);
      doc.text('[EXPORT: INVESTOR_DATA]', margin, yPos);
      yPos += 8;
      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textWhite);
      doc.text('Investor Report', margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setTextColor(...textGray);
      doc.text(`Prepared by ${profile?.full_name || 'ChiStartupHub Member'}`, margin, yPos);
      yPos += 15;

      // Stats
      doc.setFillColor(15, 15, 15);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(margin, yPos, contentWidth, 20, 0, 0, 'FD');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textWhite);
      doc.text(String(investors.length), margin + 10, yPos + 13);
      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      doc.text('INVESTORS', margin + 10, yPos + 17);
      yPos += 30;

      // Cards
      investors.forEach((inv, index) => {
        if (yPos > pageHeight - 55) newPage();

        const name = (inv.canonical_name || inv.investor?.canonical_name || 'Unknown').substring(0, 50);
        const type = (inv.investor_type || inv.investor?.investor_type || 'VC').toUpperCase();
        const checkSize = formatCheckSize(
          inv.check_size_min || inv.investor?.check_size_min,
          inv.check_size_max || inv.investor?.check_size_max
        );
        const city = inv.hq_city || inv.investor?.hq_city || '';
        const state = inv.hq_state || inv.investor?.hq_state || '';
        const location = city && state ? `${city}, ${state}` : city || state || 'National';
        const stage = inv.stage_focus || inv.investor?.stage_focus || '';
        const tag = inv.tag || '';
        const pipelineStage = inv.stage || '';

        const cardHeight = 30;
        doc.setFillColor(12, 12, 12);
        doc.setDrawColor(...borderColor);
        doc.rect(margin, yPos, contentWidth, cardHeight, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(...textDark);
        doc.text(String(index + 1).padStart(2, '0'), margin + 5, yPos + 8);

        // Type badge
        doc.setFontSize(6);
        doc.setTextColor(...textGray);
        const typeW = doc.getTextWidth(type) + 6;
        doc.setDrawColor(...borderColor);
        doc.rect(pageWidth - margin - typeW - 5, yPos + 3, typeW, 8);
        doc.text(type, pageWidth - margin - typeW / 2 - 5, yPos + 8, { align: 'center' });

        // Tag badge if present
        if (tag) {
          const tagText = tag.toUpperCase().replace('_', ' ');
          doc.setFontSize(6);
          const tagW = doc.getTextWidth(tagText) + 6;
          doc.rect(pageWidth - margin - typeW - tagW - 12, yPos + 3, tagW, 8);
          doc.text(tagText, pageWidth - margin - typeW - tagW / 2 - 12, yPos + 8, { align: 'center' });
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textWhite);
        doc.text(name.toUpperCase(), margin + 15, yPos + 14);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textGray);
        const details = [checkSize, stage, location, pipelineStage].filter(Boolean).join('  |  ');
        doc.text(details.substring(0, 90), margin + 5, yPos + 22);

        yPos += cardHeight + 2;
      });

      // Footer
      const lastPage = doc.internal.getNumberOfPages();
      for (let i = 1; i <= lastPage; i++) {
        doc.setPage(i);
        const fy = pageHeight - 15;
        doc.setDrawColor(...borderColor);
        doc.line(margin, fy - 5, pageWidth - margin, fy - 5);
        doc.setFontSize(7);
        doc.setTextColor(...textDark);
        doc.text('CHISTARTUPHUB — BUILD YOUR VISION IN CHICAGO', margin, fy);
        doc.text('chistartuphub.com', pageWidth - margin, fy, { align: 'right' });
      }

      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportCSV, exportPDF, isExporting };
};
