import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Megaphone, EyeOff, DollarSign, Users, MessageCircle, Linkedin, ArrowRight, Sparkles, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES = [
  { 
    value: 'fundraising', 
    label: 'Fundraising', 
    icon: DollarSign,
    description: 'Looking for investors, angels, or VCs'
  },
  { 
    value: 'cofounder', 
    label: 'Co-founder', 
    icon: Users,
    description: 'Seeking a co-founder or key team member'
  },
  { 
    value: 'general_advice', 
    label: 'General Advice', 
    icon: MessageCircle,
    description: 'Need guidance, intros, or expertise'
  },
];

const SECTORS = [
  'FinTech',
  'HealthTech',
  'EdTech',
  'CleanTech & Energy',
  'Logistics & Supply Chain',
  'Consumer',
  'Enterprise SaaS',
  'AI & Machine Learning',
  'PropTech',
  'FoodTech',
  'Other',
];

const STAGES = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B+',
  'Revenue-based',
];

// ============================================
// ADMIN EMAILS (bypass posting restrictions)
// ============================================
const ADMIN_EMAILS = [
  'admin@test.chistartuphub.com',
  'hello@chistartuphub.com',
  'billy@chistartuphub.com',
];

// ============================================
// POST ASK MODAL COMPONENT
// ============================================

export default function PostAskModal({ isOpen, onClose, onSuccess }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user is admin (bypasses restrictions)
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Form state
  const [category, setCategory] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowAmplification, setAllowAmplification] = useState(true);

  // Check if user can post (one ask per 14 days, unless admin)
  useEffect(() => {
    const checkCanPost = async () => {
      if (!user) return;

      // Admins can always post
      if (ADMIN_EMAILS.includes(user.email)) {
        setCanPost(true);
        return;
      }

      try {
        // Try RPC first
        const { data, error } = await supabase
          .rpc('can_create_ask', { user_uuid: user.id });

        if (!error) {
          setCanPost(data);

          if (!data) {
            const { data: days } = await supabase
              .rpc('days_until_next_ask', { user_uuid: user.id });
            setDaysUntilNext(days || 0);
          }
          return;
        }
      } catch (rpcError) {
        console.warn('RPC not available, using fallback query');
      }

      // Fallback: query directly
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: recentAsks, error: queryError } = await supabase
        .from('founder_asks')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!queryError) {
        if (recentAsks && recentAsks.length > 0) {
          setCanPost(false);
          const lastAskDate = new Date(recentAsks[0].created_at);
          const daysPassed = Math.floor((Date.now() - lastAskDate.getTime()) / (1000 * 60 * 60 * 24));
          setDaysUntilNext(Math.max(0, 14 - daysPassed));
        } else {
          setCanPost(true);
        }
      }
    };

    if (isOpen) {
      checkCanPost();
    }
  }, [user, isOpen]);

  // Pre-fill LinkedIn from profile
  useEffect(() => {
    if (profile?.linkedin_url) {
      setLinkedinUrl(profile.linkedin_url);
    }
  }, [profile]);

  const resetForm = () => {
    setStep(1);
    setCategory('');
    setSector('');
    setDescription('');
    setAmount('');
    setStage('');
    setIsAnonymous(false);
    setAllowAmplification(true);
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to post an ask');
      return;
    }

    // Validate required fields
    if (!category || !sector || !description || !linkedinUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (category === 'fundraising' && !amount) {
      toast.error('Please specify your fundraising amount');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('founder_asks')
        .insert({
          user_id: user.id,
          category,
          sector,
          description,
          amount: category === 'fundraising' ? amount : null,
          stage: category === 'fundraising' ? stage : null,
          linkedin_url: linkedinUrl,
          is_anonymous: isAnonymous,
          allow_amplification: allowAmplification,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Show success state instead of closing immediately
      setShowSuccess(true);
      if (onSuccess) onSuccess(data);
    } catch (error) {
      console.error('Error posting ask:', error);
      toast.error('Failed to post ask', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Check if user is a founder (or admin - admins can always post)
  const isFounder = profile?.role === 'founder' || isAdmin;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[95vw] sm:max-w-lg bg-[#0a0f1a] border border-white/10 overflow-hidden max-h-[90vh] sm:max-h-none"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block">
                  {showSuccess ? '[STATUS: LIVE]' : '[CREATE: ASK]'}
                </span>
                <h2 className="font-serif text-2xl text-white mt-1">
                  {showSuccess ? 'Success!' : 'Post Your Ask'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-colors cursor-crosshair"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Progress - hide on success */}
            {!showSuccess && (
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 transition-colors ${
                      step >= s ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
            {/* Admin notice */}
            {!showSuccess && isAdmin && (
              <div className="mb-6 p-4 border border-green-500/30 bg-green-500/5">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-green-400 mb-1">
                      Admin Mode
                    </p>
                    <p className="text-sm text-white/50">
                      You're posting as an admin. Rate limits and founder restrictions are bypassed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Not a founder warning */}
            {!showSuccess && !isFounder && !isAdmin && (
              <div className="mb-6 p-4 border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber-400 mb-1">
                      Posting is Limited to Founders
                    </p>
                    <p className="text-sm text-white/50">
                      This is intentional to maintain quality and trust in our community. If you're a founder, go to your Profile and update your role to "Founder" to unlock this feature.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Can't post yet warning (not shown for admins) */}
            {!showSuccess && isFounder && !canPost && !isAdmin && (
              <div className="mb-6 p-4 border border-blue-500/30 bg-blue-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-blue-400 mb-1">
                      One Ask Per 14 Days
                    </p>
                    <p className="text-sm text-white/50">
                      You can post a new ask in {daysUntilNext} days. You can refresh your existing ask anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Category & Sector */}
            {!showSuccess && step === 1 && (
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-3">
                    What do you need help with? *
                  </label>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`w-full flex items-center gap-4 p-4 border transition-colors cursor-crosshair ${
                            category === cat.value
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-white border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className={`w-10 h-10 flex items-center justify-center border ${
                            category === cat.value ? 'border-black/20' : 'border-white/20'
                          }`}>
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                          <div className="text-left">
                            <span className="font-mono text-[11px] uppercase tracking-[0.1em] block">
                              {cat.label}
                            </span>
                            <span className={`text-xs ${category === cat.value ? 'text-black/60' : 'text-white/40'}`}>
                              {cat.description}
                            </span>
                          </div>
                          {category === cat.value && (
                            <Check className="w-5 h-5 ml-auto" strokeWidth={2} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sector Selection */}
                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-3">
                    Your Sector *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSector(s)}
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border transition-colors cursor-crosshair ${
                          sector === s
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/50 border-white/20 hover:border-white/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setStep(2)}
                  disabled={!category || !sector}
                  className="w-full font-mono text-[11px] uppercase tracking-[0.1em] py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Details */}
            {!showSuccess && step === 2 && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                    Describe your ask *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      category === 'fundraising' 
                        ? "What are you building? What stage? What kind of investors are you looking for?"
                        : category === 'cofounder'
                        ? "What role are you looking for? What skills? What's the equity situation?"
                        : "What specific help or advice do you need?"
                    }
                    className="w-full h-32 bg-transparent border border-white/20 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none font-mono"
                    maxLength={500}
                  />
                  <span className="font-mono text-[10px] text-white/30 block mt-1 text-right">
                    {description.length}/500
                  </span>
                </div>

                {/* Fundraising-specific fields */}
                {category === 'fundraising' && (
                  <>
                    <div>
                      <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                        How much are you raising? *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="e.g., 500K, 2M, 5M"
                          className="w-full bg-transparent border border-white/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
                        Stage
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STAGES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStage(s)}
                            className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border transition-colors cursor-crosshair ${
                              stage === s
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-white/50 border-white/20 hover:border-white/40'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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
                    />
                  </div>
                  <span className="font-mono text-[10px] text-white/30 block mt-1">
                    Helpers will use this to connect with you
                  </span>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!description || (category === 'fundraising' && !amount) || !linkedinUrl}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Privacy & Amplification */}
            {!showSuccess && step === 3 && (
              <div className="space-y-6">
                {/* Anonymous Toggle */}
                <div className="p-4 border border-white/10">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`w-12 h-7 rounded-full relative transition-colors ${
                        isAnonymous ? 'bg-white' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                        isAnonymous ? 'left-6 bg-black' : 'left-1 bg-white/60'
                      }`} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <EyeOff className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                          Stay Anonymous
                        </span>
                      </div>
                      <p className="text-xs text-white/40">
                        {isAnonymous 
                          ? "Your name won't be shown. Helpers will only see your sector and ask."
                          : "Your name and company will be visible to everyone."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amplification Toggle */}
                <div className="p-4 border border-white/10">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setAllowAmplification(!allowAmplification)}
                      className={`w-12 h-7 rounded-full relative transition-colors ${
                        allowAmplification ? 'bg-white' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                        allowAmplification ? 'left-6 bg-black' : 'left-1 bg-white/60'
                      }`} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Megaphone className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                          Let ChiStartupHub Amplify
                        </span>
                      </div>
                      <p className="text-xs text-white/40">
                        {allowAmplification
                          ? "We may share your ask on our LinkedIn and newsletter to help you find connections."
                          : "Your ask will only be visible on this platform."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-white/5 border border-white/10">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-3">
                    [SUMMARY]
                  </span>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/40">Category</span>
                      <span className="text-white">{CATEGORIES.find(c => c.value === category)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Sector</span>
                      <span className="text-white">{sector}</span>
                    </div>
                    {category === 'fundraising' && amount && (
                      <div className="flex justify-between">
                        <span className="text-white/40">Raising</span>
                        <span className="text-white">${amount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/40">Visibility</span>
                      <span className="text-white">{isAnonymous ? 'Anonymous' : 'Public'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Expires</span>
                      <span className="text-white">14 days</span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isFounder || !canPost}
                    className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Posting...' : 'Post Ask'}
                  </button>
                </div>
              </div>
            )}

            {/* Success State */}
            {showSuccess && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-6 border-2 border-green-400 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-green-400" strokeWidth={1.5} />
                </div>

                <h3 className="font-serif text-2xl text-white mb-2">
                  Your Ask is Live
                </h3>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-8">
                  Community helpers can now see your ask and reach out. We'll notify you when someone offers to help.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleClose();
                      navigate('/profile?tab=connections');
                    }}
                    className="w-full font-mono text-[11px] uppercase tracking-[0.1em] py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair flex items-center justify-center gap-2"
                  >
                    View Your Asks
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  {/* Share to LinkedIn */}
                  <button
                    onClick={() => {
                      const shareText = `I just posted an ask on @ChiStartupHub - looking for ${CATEGORIES.find(c => c.value === category)?.label.toLowerCase() || 'help'} in the ${sector} space. If you can help or know someone who can, check it out!`;
                      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://chistartuphub.com/opportunities')}&title=${encodeURIComponent(shareText)}`;
                      window.open(shareUrl, '_blank', 'width=600,height=400');
                    }}
                    className="w-full font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors cursor-crosshair flex items-center justify-center gap-2"
                  >
                    <Linkedin className="w-4 h-4" strokeWidth={1.5} />
                    Share on LinkedIn
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
                  >
                    Keep Browsing
                  </button>
                </div>

                <p className="mt-6 text-[11px] text-white/30 font-mono">
                  Tip: Sharing amplifies your reach beyond the platform
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
