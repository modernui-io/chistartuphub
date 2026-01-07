import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// ============================================
// FUNDRAISING DISCLAIMER MODAL
// ============================================
// SEC compliance guardrail for Founder Asks
// Ensures users understand this is guidance-seeking, not investment solicitation

export default function FundraisingDisclaimerModal({ isOpen, onClose, onAcknowledge }) {
  const [checkedItems, setCheckedItems] = useState({
    guidance: false,
    compliance: false,
    noTerms: false,
  });

  const allChecked = checkedItems.guidance && checkedItems.compliance && checkedItems.noTerms;

  const handleCheckboxChange = (key) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = () => {
    if (allChecked) {
      onAcknowledge();
      // Reset checkboxes for next time
      setCheckedItems({
        guidance: false,
        compliance: false,
        noTerms: false,
      });
    }
  };

  const handleCancel = () => {
    // Reset checkboxes
    setCheckedItems({
      guidance: false,
      compliance: false,
      noTerms: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[95vw] sm:max-w-md bg-[#0a0f1a] border border-amber-500/30 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[10px] text-amber-400/70 uppercase tracking-[0.2em] block">
                  [IMPORTANT: LEGAL NOTICE]
                </span>
                <h2 className="font-serif text-xl text-amber-400 mt-1">
                  Fundraising Guidance Disclaimer
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              This category is for seeking <span className="text-white font-medium">advice on fundraising strategy</span> and <span className="text-white font-medium">introductions to capital sources</span> — not for public investment solicitation.
            </p>

            <div className="space-y-4 mb-6">
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checkedItems.guidance}
                    onChange={() => handleCheckboxChange('guidance')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border transition-colors ${
                    checkedItems.guidance
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/30 group-hover:border-white/50'
                  }`}>
                    {checkedItems.guidance && (
                      <svg className="w-full h-full text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-white/70 leading-snug">
                  I understand this is for guidance and connections, not investment solicitation
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checkedItems.compliance}
                    onChange={() => handleCheckboxChange('compliance')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border transition-colors ${
                    checkedItems.compliance
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/30 group-hover:border-white/50'
                  }`}>
                    {checkedItems.compliance && (
                      <svg className="w-full h-full text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-white/70 leading-snug">
                  I am responsible for compliance with securities laws
                </span>
              </label>

              {/* Checkbox 3 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checkedItems.noTerms}
                    onChange={() => handleCheckboxChange('noTerms')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border transition-colors ${
                    checkedItems.noTerms
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/30 group-hover:border-white/50'
                  }`}>
                    {checkedItems.noTerms && (
                      <svg className="w-full h-full text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-white/70 leading-snug">
                  I will NOT post specific fundraising terms or amounts publicly
                </span>
              </label>
            </div>

            {/* Terms link */}
            <p className="text-xs text-white/40 mb-6">
              By continuing, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-amber-400 hover:text-amber-300 underline">
                Terms of Service
              </a>
              , including Section 7: Fundraising Disclaimers.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={!allChecked}
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
              >
                I Understand — Continue
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
