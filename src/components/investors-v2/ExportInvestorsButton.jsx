import React, { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvestorExport } from '@/hooks/useInvestorExport';
import { useAuth } from '@/contexts/AuthContext';

export function ExportInvestorsButton({ investors = [], filename = 'investors' }) {
  const [open, setOpen] = useState(false);
  const { exportCSV, exportPDF, isExporting } = useInvestorExport();
  const { profile } = useAuth();

  if (!investors.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-2 px-3 py-2 border border-chi-ghost text-chi-muted',
          'hover:border-white hover:text-white transition-colors font-mono text-[10px] uppercase tracking-[0.1em]',
          isExporting && 'opacity-50 cursor-wait'
        )}
      >
        <Download className="w-3 h-3" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-44 bg-chi-navy border border-chi-ghost z-[10000] shadow-lg">
            <button
              onClick={() => {
                exportCSV(investors, filename);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-mono text-chi-silver hover:bg-white/5 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export as CSV
            </button>
            <button
              onClick={() => {
                exportPDF(investors, filename, profile);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-mono text-chi-silver hover:bg-white/5 flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportInvestorsButton;
