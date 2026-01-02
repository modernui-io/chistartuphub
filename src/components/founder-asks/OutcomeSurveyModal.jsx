import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ThumbsUp, ThumbsDown, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

// ============================================
// OUTCOME OPTIONS
// ============================================

const ACHIEVED_OPTIONS = [
  { value: 'yes', label: 'Yes!', icon: ThumbsUp, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  { value: 'partially', label: 'Partially', icon: Check, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { value: 'no', label: 'Not yet', icon: ThumbsDown, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  { value: 'ongoing', label: 'Still working on it', icon: RefreshCw, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
];

const OUTCOME_TYPES = {
  fundraising: [
    { value: 'funded', label: 'Got funded' },
    { value: 'in_progress', label: 'In active conversations' },
    { value: 'changed_direction', label: 'Changed fundraising strategy' },
    { value: 'paused', label: 'Paused fundraising' },
    { value: 'other', label: 'Other' },
  ],
  cofounder: [
    { value: 'found_cofounder', label: 'Found a co-founder' },
    { value: 'in_conversations', label: 'In conversations with candidates' },
    { value: 'changed_direction', label: 'Changed what I\'m looking for' },
    { value: 'still_searching', label: 'Still searching' },
    { value: 'other', label: 'Other' },
  ],
  general_advice: [
    { value: 'got_advice', label: 'Got helpful advice' },
    { value: 'made_connections', label: 'Made valuable connections' },
    { value: 'changed_direction', label: 'Changed my approach' },
    { value: 'still_searching', label: 'Still looking for help' },
    { value: 'other', label: 'Other' },
  ],
};

// ============================================
// OUTCOME SURVEY MODAL
// ============================================

export default function OutcomeSurveyModal({ isOpen, onClose, ask, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [achievedGoal, setAchievedGoal] = useState('');
  const [outcomeType, setOutcomeType] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const outcomeOptions = OUTCOME_TYPES[ask?.category] || OUTCOME_TYPES.general_advice;

  const handleSubmit = async () => {
    if (!user || !ask) return;

    setLoading(true);

    try {
      // Save outcome
      const { error: outcomeError } = await supabase
        .from('ask_outcomes')
        .insert({
          ask_id: ask.id,
          user_id: user.id,
          achieved_goal: achievedGoal,
          outcome_type: outcomeType,
          feedback: feedback || null,
        });

      if (outcomeError) throw outcomeError;

      // Deactivate the ask
      const { error: updateError } = await supabase
        .from('founder_asks')
        .update({ is_active: false })
        .eq('id', ask.id);

      if (updateError) throw updateError;

      toast.success('Thanks for sharing!', {
        description: 'Your feedback helps us improve ChiStartupHub.',
      });

      onClose();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving outcome:', error);
      toast.error('Failed to save', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user || !ask) return;

    setLoading(true);

    try {
      // Call the refresh function
      const { error } = await supabase.rpc('refresh_founder_ask', { ask_uuid: ask.id });

      if (error) throw error;

      toast.success('Ask refreshed!', {
        description: 'Your ask is now active for another 14 days.',
      });

      onClose();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error refreshing ask:', error);
      toast.error('Failed to refresh', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ask) return null;

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
          className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block">
                  [OUTCOME: SURVEY]
                </span>
                <h2 className="font-serif text-2xl text-white mt-1">
                  {step === 1 ? 'Your Ask is Expiring' : 'Tell Us What Happened'}
                </h2>
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
            {/* Step 1: Refresh or Close */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Ask Summary */}
                <div className="p-4 bg-white/5 border border-white/10">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">
                    [YOUR_ASK]
                  </span>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {ask.description?.substring(0, 150)}...
                  </p>
                  <p className="font-mono text-[10px] text-white/40 mt-2">
                    {ask.sector} • Posted {ask.createdAt}
                  </p>
                </div>

                <p className="text-white/50 text-sm">
                  Your ask is about to expire. Would you like to keep it active or close it?
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 border border-white/20 hover:bg-white hover:text-black transition-colors cursor-crosshair group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-white/50 group-hover:text-black" strokeWidth={1.5} />
                      <div className="text-left">
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] block">
                          Keep it Active
                        </span>
                        <span className="text-xs text-white/40 group-hover:text-black/60">
                          Refresh for another 14 days
                        </span>
                      </div>
                    </div>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-black" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-between p-4 border border-white/10 hover:border-white/30 transition-colors cursor-crosshair group"
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                      <div className="text-left">
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white block">
                          Close This Ask
                        </span>
                        <span className="text-xs text-white/40">
                          Share what happened (helps us improve)
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Did you achieve your goal? */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-3">
                    Did you achieve your goal?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACHIEVED_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setAchievedGoal(option.value)}
                          className={`flex items-center gap-3 p-4 border transition-colors cursor-crosshair ${
                            achievedGoal === option.value
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-white border-white/10 hover:border-white/30'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${achievedGoal === option.value ? 'text-black' : option.color}`} strokeWidth={1.5} />
                          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!achievedGoal}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: What happened? */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-3">
                    What happened?
                  </label>
                  <div className="space-y-2">
                    {outcomeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setOutcomeType(option.value)}
                        className={`w-full flex items-center gap-3 p-3 border transition-colors cursor-crosshair text-left ${
                          outcomeType === option.value
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                          outcomeType === option.value ? 'border-black bg-black' : 'border-white/30'
                        }`}>
                          {outcomeType === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                    Any feedback for us? (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What worked? What could be better? Any suggestions?"
                    className="w-full h-24 bg-transparent border border-white/20 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none font-mono"
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !outcomeType}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
