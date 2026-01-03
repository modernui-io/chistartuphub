import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, Mail, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

// ============================================
// HELP MODAL COMPONENT
// ============================================

export default function HelpModal({ isOpen, onClose, ask }) {
  const { user, profile } = useAuth();
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to help');
      return;
    }

    if (!linkedinUrl.trim()) {
      toast.error('Please provide your LinkedIn profile URL');
      return;
    }

    if (!message.trim()) {
      toast.error('Please share how you can help');
      return;
    }

    setLoading(true);

    try {
      // Check if already requested
      const { data: existing } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('ask_id', ask.id)
        .eq('requester_id', user.id)
        .single();

      if (existing) {
        toast.error('You have already offered to help with this ask');
        setLoading(false);
        return;
      }

      // Create connection request
      const { error: insertError } = await supabase
        .from('connection_requests')
        .insert({
          ask_id: ask.id,
          requester_id: user.id,
          founder_id: ask.userId,
          requester_linkedin: linkedinUrl,
          requester_context: message,
          requester_email: user.email,
          requester_name: profile?.full_name || user.email,
        });

      if (insertError) throw insertError;

      // Increment connection request count
      await supabase.rpc('increment_connection_count', { ask_uuid: ask.id });

      // TODO: Send email notification to founder
      // This will be handled by a Supabase Edge Function or webhook

      toast.success('Your offer to help has been sent!', {
        description: 'The founder has 48 hours to review and accept your request. You\'ll be notified when they respond.',
        duration: 6000,
      });

      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error sending help offer:', error);
      toast.error('Failed to send', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ask) return null;

  // Check if user is the ask owner
  const isOwnAsk = user?.id === ask.userId;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block">
                  [OFFER: HELP]
                </span>
                <h2 className="font-serif text-2xl text-white mt-1">I Can Help</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-colors cursor-crosshair"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Own ask warning */}
            {isOwnAsk && (
              <div className="mb-6 p-4 border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-sm text-white/50">
                    This is your own ask. You can't offer to help yourself!
                  </p>
                </div>
              </div>
            )}

            {/* Ask Summary */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">
                [ASK]
              </span>
              <p className="text-sm text-white/60 leading-relaxed">
                {ask.description}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="font-mono text-[10px] text-white/40 uppercase">
                  {ask.sector}
                </span>
                {ask.amount && (
                  <span className="font-mono text-[10px] text-emerald-400 uppercase">
                    ${ask.amount}
                  </span>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="mb-6 p-4 border border-white/10">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-3">
                [HOW_IT_WORKS]
              </span>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-white/40">1</span>
                  </div>
                  <p className="text-xs text-white/50">
                    You share your LinkedIn and how you can help
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-white/40">2</span>
                  </div>
                  <p className="text-xs text-white/50">
                    The founder receives an email with your info
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-white/40">3</span>
                  </div>
                  <p className="text-xs text-white/50">
                    If interested, they connect with you on LinkedIn
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* LinkedIn URL */}
              <div>
                <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                  Your LinkedIn Profile *
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full bg-transparent border border-white/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 font-mono"
                    required
                    disabled={isOwnAsk}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                  How can you help? *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your background and specifically how you might be able to help this founder..."
                  className="w-full h-28 bg-transparent border border-white/20 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none font-mono"
                  required
                  disabled={isOwnAsk}
                  maxLength={500}
                />
                <span className="font-mono text-[10px] text-white/30 block mt-1 text-right">
                  {message.length}/500
                </span>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isOwnAsk}
                  className="flex-1 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                  {loading ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
