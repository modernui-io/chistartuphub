import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Mail, Loader2, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";

const CSV_URL = "/downloads/top-50-chicago-investors.csv";

/**
 * DownloadInvestorListModal - Lead Magnet for Top 50 Chicago Investors
 * Bureau Design System | Systematic Modernism
 */
export default function DownloadInvestorListModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const triggerDownload = () => {
    const link = document.createElement('a');
    link.href = CSV_URL;
    link.download = 'Top-50-Chicago-Investors-ChiStartupHub.csv';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    // Save email to database (non-blocking)
    try {
      const { error } = await supabase
        .from('email_signups')
        .insert({
          email: email.trim(),
          name: name.trim() || null,
          source: 'investor_list_download'
        });

      if (error) {
        console.error('Email signup error (non-blocking):', error);
      }
    } catch (err) {
      console.error('Email signup exception (non-blocking):', err);
    }

    // Always trigger download and show success
    triggerDownload();
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-[#050A14] border border-white/10 w-full md:max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          // Success Screen
          <>
            <div className="bg-green-500/5 border-b border-green-500/20 p-4 md:p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-green-400">
                    Download Started
                  </span>
                </div>
                <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.05em]">
                  Your list is downloading now
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/5 transition-none duration-0 cursor-crosshair"
              >
                <X className="w-4 h-4 text-white/40" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div className="border border-white/10 p-6 text-center">
                <div className="w-12 h-12 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">
                  [DOWNLOAD: COMPLETE]
                </span>
                <h3 className="font-serif text-lg text-white mb-2">
                  Thank you{name ? `, ${name}` : ''}!
                </h3>
                <p className="font-mono text-[10px] text-white/40 tracking-[0.02em] mb-6">
                  Check your downloads folder for the CSV file. It includes investor names, firms, check sizes, focus areas, and contact info.
                </p>
                <button
                  onClick={triggerDownload}
                  className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair"
                >
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  Download Again
                </button>
              </div>

              <div className="text-center">
                <p className="font-mono text-[10px] text-white/30 tracking-[0.02em] mb-4">
                  You'll receive occasional updates on resources, events, and opportunities.
                </p>
                <button
                  onClick={handleClose}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-none duration-0 cursor-crosshair"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          // Form Screen
          <>
            <div className="border-b border-white/10 p-4 md:p-6 flex items-start justify-between">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="w-6 h-6 border border-white/20 flex items-center justify-center">
                    <Users className="w-3 h-3 text-white/50" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    Top 50 Chicago Investors
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 border border-green-500/30 text-green-400">
                    FREE
                  </span>
                </div>
                <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.05em]">
                  Active VCs and angels investing in Chicago startups
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/5 transition-none duration-0 cursor-crosshair"
              >
                <X className="w-4 h-4 text-white/40" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="border border-white/10 p-4 mb-6">
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-3">
                  What's Inside
                </span>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-white/30">—</span>
                    50 active investors in Chicago
                  </li>
                  <li className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-white/30">—</span>
                    Check sizes and stage focus
                  </li>
                  <li className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-white/30">—</span>
                    Sector preferences
                  </li>
                  <li className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-white/30">—</span>
                    Portfolio highlights
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" strokeWidth={1.5} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="YOUR@EMAIL.COM"
                      className="w-full pl-6 bg-transparent border-b border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 cursor-crosshair"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="YOUR NAME"
                    className="w-full bg-transparent border-b border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 cursor-crosshair"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-4 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                        Download Free List
                      </>
                    )}
                  </button>
                </div>

                <p className="font-mono text-[10px] text-white/30 text-center uppercase tracking-[0.05em]">
                  No spam. Just helpful founder resources.
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
