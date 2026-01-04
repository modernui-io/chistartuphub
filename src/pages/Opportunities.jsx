import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  DollarSign,
  Users,
  MessageCircle,
  Plus,
  Lock,
  HandHelping,
  Filter,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BureauFooter from '@/components/bureau/BureauFooter';

import { useFounderAsks } from '@/hooks/useFounderAsks';
import { FounderAskCard, PostAskModal, HelpModal } from '@/components/founder-asks';

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES = [
  { value: 'all', label: 'All Asks', icon: Filter },
  { value: 'fundraising', label: 'Fundraising', icon: DollarSign },
  { value: 'cofounder', label: 'Co-founder', icon: Users },
  { value: 'general_advice', label: 'General Advice', icon: MessageCircle },
];

const SECTORS = [
  'All Sectors',
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

// ============================================
// MAIN PAGE
// ============================================

export default function Opportunities() {
  const { user, profile, openSignup, openLogin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedAsk, setSelectedAsk] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPostAskModal, setShowPostAskModal] = useState(false);

  // Fetch real data from Supabase
  const { asks, loading: asksLoading, error: asksError, refetch } = useFounderAsks();

  // Filter asks based on search, category, and sector (memoized for performance)
  const filteredAsks = useMemo(() => {
    return asks.filter(ask => {
      // Category filter
      if (selectedCategory !== 'all' && ask.category !== selectedCategory) {
        return false;
      }
      // Sector filter
      if (selectedSector !== 'All Sectors' && ask.sector !== selectedSector) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        ask.sector?.toLowerCase().includes(query) ||
        ask.description?.toLowerCase().includes(query) ||
        ask.stage?.toLowerCase().includes(query) ||
        ask.founderName?.toLowerCase().includes(query) ||
        ask.companyName?.toLowerCase().includes(query)
      );
    });
  }, [asks, selectedCategory, selectedSector, searchQuery]);

  const handleHelp = async (ask) => {
    if (!user) {
      toast('Sign up to connect with founders', {
        description: 'Create an account to offer your help and expertise.',
        action: {
          label: 'Sign Up',
          onClick: openSignup,
        },
        duration: 5000,
      });
      return;
    }

    // Increment view count (fire and forget)
    supabase.rpc('increment_ask_view_count', { ask_uuid: ask.id }).catch(() => {});

    setSelectedAsk(ask);
    setShowHelpModal(true);
  };

  const handlePostAsk = () => {
    if (!user) {
      toast('Sign up to post your ask', {
        description: 'Create an account to share your ask with the Chicago startup community.',
        action: {
          label: 'Sign Up',
          onClick: openSignup,
        },
      });
      return;
    }
    
    // Check if user is a founder
    if (profile?.role !== 'founder') {
      toast.error('Posting is limited to founders only', {
        description: 'This is intentional to maintain quality asks. If you\'re a founder, update your profile role to "Founder" to unlock this feature.',
        duration: 6000,
      });
      return;
    }
    
    setShowPostAskModal(true);
  };

  // Stats (memoized for performance)
  const categoryStats = useMemo(() => ({
    fundraising: asks.filter(a => a.category === 'fundraising').length,
    cofounder: asks.filter(a => a.category === 'cofounder').length,
    general_advice: asks.filter(a => a.category === 'general_advice').length,
  }), [asks]);

  return (
    <>
      <SEO
        title="Founder Asks | ChiStartup Hub"
        description="What help do you need? Post your ask for fundraising, co-founders, or advice. The Chicago startup community is here to help."
      />

      <div className="min-h-screen bg-[#050A14] text-white" data-page="opportunities">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [FOUNDER: ASKS]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6"
            >
              What Help Do You Need?<br /><span className="text-white/40">Ask the Chicago Community.</span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg max-w-2xl mb-8"
            >
              Founders ask. Helpers connect. We amplify.
            </motion.p>

            {/* Actions - Different states based on auth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              {!user ? (
                /* Not logged in state */
                <div className="border border-white/10 p-4 inline-block">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={openSignup}
                      className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                      Post Your Ask
                    </button>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em]">
                        Sign up or login to post
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openSignup}
                          className="font-mono text-[10px] text-white hover:text-white/70 uppercase tracking-[0.1em] underline cursor-crosshair"
                        >
                          Sign Up
                        </button>
                        <span className="text-white/30">or</span>
                        <button
                          onClick={openLogin}
                          className="font-mono text-[10px] text-white hover:text-white/70 uppercase tracking-[0.1em] underline cursor-crosshair"
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : profile?.role !== 'founder' ? (
                /* Logged in but not a founder */
                <div className="border border-amber-500/20 bg-amber-500/5 p-4 inline-block">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => toast.error('Posting is limited to founders only', {
                        description: 'Update your profile role to "Founder" to unlock this feature.',
                      })}
                      className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white/20 text-white/50 border border-white/10 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" strokeWidth={1.5} />
                      Post Your Ask
                    </button>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-amber-400 uppercase tracking-[0.1em]">
                        Founders only
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        Your role: <span className="text-white/60 capitalize">{profile?.role || 'not set'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Logged in as founder - full access */
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handlePostAsk}
                    className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    Post Your Ask
                  </button>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-white/30 px-4">
                    <Lock className="w-3 h-3" strokeWidth={1.5} />
                    One ask per 14 days
                  </div>
                </div>
              )}
            </motion.div>

            {/* Category Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = cat.value === 'all' ? asks.length : categoryStats[cat.value] || 0;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] px-3 sm:px-4 py-2.5 sm:py-2 border transition-colors cursor-crosshair ${
                      selectedCategory === cat.value
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-3 sm:h-3" strokeWidth={1.5} />
                    {cat.label}
                    <span className={`ml-1 ${selectedCategory === cat.value ? 'text-black/50' : 'text-white/30'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Sector Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="overflow-x-auto -mx-6 px-6 scrollbar-hide"
            >
              <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-6 pb-2 sm:pb-0">
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] px-3 sm:px-4 py-2.5 border transition-colors cursor-crosshair whitespace-nowrap ${
                      selectedSector === sector
                        ? 'bg-white/10 text-white border-white/40'
                        : 'bg-transparent text-white/30 border-white/10 hover:border-white/20 hover:text-white/50'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="SEARCH_ASKS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-white/10 py-4 pl-12 pr-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/10 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/30 uppercase">Active Asks</span>
                <span className="font-mono text-sm text-white">{filteredAsks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/30 uppercase">Sectors</span>
                <span className="font-mono text-sm text-white">{new Set(asks.map(a => a.sector)).size}</span>
              </div>
            </div>
            <div className="font-mono text-[10px] text-white/20 uppercase">
              Sorted by most recent
            </div>
          </div>
        </section>

        {/* Asks Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            {asksLoading ? (
              <div className="text-center py-16 border border-white/10">
                <div className="w-6 h-6 border border-white/30 border-t-white animate-spin mx-auto mb-4" />
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  [LOADING_ASKS...]
                </span>
              </div>
            ) : asksError ? (
              <div className="text-center py-16 border border-white/10">
                <span className="font-mono text-[10px] text-red-400/80 uppercase tracking-[0.2em]">
                  [ERROR]
                </span>
                <p className="text-white/40 mt-4">Failed to load asks. Please try again.</p>
                <p className="text-white/20 text-xs mt-2 font-mono max-w-md mx-auto break-words">
                  {asksError}
                </p>
                <button
                  onClick={refetch}
                  className="mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-crosshair"
                >
                  Retry
                </button>
              </div>
            ) : filteredAsks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredAsks.map((ask, index) => (
                  <FounderAskCard
                    key={ask.id}
                    ask={ask}
                    index={index}
                    onHelp={handleHelp}
                  />
                ))}
              </div>
            ) : asks.length === 0 ? (
              <div className="text-center py-16 border border-white/10">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  [NO_ASKS_YET]
                </span>
                <p className="text-white/40 mt-4 mb-6">Be the first to share your ask with the Chicago startup community.</p>
                <button
                  onClick={handlePostAsk}
                  className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
                >
                  <Plus className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
                  Post Your Ask
                </button>
              </div>
            ) : (
              <div className="text-center py-16 border border-white/10">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  [NO_RESULTS]
                </span>
                <p className="text-white/40 mt-4">No asks match your filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedSector('All Sectors'); }}
                  className="mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-crosshair"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
              [HOW_IT_WORKS]
            </span>
            <h2 className="font-serif text-3xl text-white mb-8">The Flywheel</h2>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <span className="font-mono text-[11px] text-white/50">01</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    Founders Ask
                  </span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  Post what you need: fundraising intros, co-founder search, or general advice. One ask per 14 days keeps it focused.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <span className="font-mono text-[11px] text-white/50">02</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    Helpers Connect
                  </span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  See an ask you can help with? Click "I Can Help" and share how. The founder gets an email and connects on LinkedIn.
                </p>
              </div>

              {/* Step 3 */}
              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <span className="font-mono text-[11px] text-white/50">03</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    We Amplify
                  </span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  Opt-in to let ChiStartupHub share your ask on LinkedIn and our newsletter. More visibility, more connections.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>

      {/* Post Ask Modal */}
      <PostAskModal
        isOpen={showPostAskModal}
        onClose={() => setShowPostAskModal(false)}
        onSuccess={() => {
          refetch();
          setShowPostAskModal(false);
        }}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => {
          setShowHelpModal(false);
          setSelectedAsk(null);
        }}
        ask={selectedAsk}
      />
    </>
  );
}
