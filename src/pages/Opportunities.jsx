import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  DollarSign,
  ArrowUpRight,
  Plus,
  Lock,
  Linkedin,
  Mail,
  Clock,
  Building2,
  TrendingUp
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BureauFooter from '@/components/bureau/BureauFooter';

// ============================================
// MOCK DATA - FOUNDER ASKS
// ============================================

const FOUNDER_ASKS = [
  {
    id: '1',
    sector: 'CleanTech & Energy',
    description: 'Building carbon tracking infrastructure for enterprise supply chains. Looking for investors who understand B2B SaaS and sustainability.',
    stage: 'Seed',
    target: '$2M',
    linkedIn: 'https://linkedin.com/in/example1',
    createdAt: '2 days ago',
    isActive: true,
  },
  {
    id: '2',
    sector: 'HealthTech',
    description: 'AI-powered diagnostic platform for community health clinics. Reducing wait times and improving patient outcomes.',
    stage: 'Pre-Seed',
    target: '$750K',
    linkedIn: 'https://linkedin.com/in/example2',
    createdAt: '5 hours ago',
    isActive: true,
  },
  {
    id: '3',
    sector: 'EdTech',
    description: 'Personalized learning paths powered by AI tutors for K-12 students. Partnered with 3 Chicago school districts.',
    stage: 'Pre-Seed',
    target: '$500K',
    linkedIn: 'https://linkedin.com/in/example3',
    createdAt: '12 hours ago',
    isActive: true,
  },
  {
    id: '4',
    sector: 'FinTech',
    description: 'Embedded banking infrastructure for gig economy platforms. Helping workers access their earnings instantly.',
    stage: 'Seed',
    target: '$3M',
    linkedIn: 'https://linkedin.com/in/example4',
    createdAt: '1 week ago',
    isActive: true,
  },
  {
    id: '5',
    sector: 'Logistics & Supply Chain',
    description: 'Last-mile delivery optimization for Chicago restaurants. Reducing delivery times by 40% through route intelligence.',
    stage: 'Pre-Seed',
    target: '$400K',
    linkedIn: 'https://linkedin.com/in/example5',
    createdAt: '3 days ago',
    isActive: true,
  },
];

// ============================================
// CONNECTION REQUEST MODAL
// ============================================

const ConnectionRequestModal = ({ isOpen, onClose, founder }) => {
  const [linkedIn, setLinkedIn] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!linkedIn.trim()) {
      toast.error('Please provide your LinkedIn profile URL');
      return;
    }
    if (!context.trim()) {
      toast.error('Please provide context for your connection request');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    
    toast.success('Connection request sent! The founder will review your LinkedIn and decide whether to connect.');
    onClose();
    setLinkedIn('');
    setContext('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
            [REQUEST: CONNECTION]
          </span>
          <h3 className="font-serif text-2xl text-white mt-2">Request to Connect</h3>
          <p className="text-sm text-white/40 mt-2">
            The founder will receive your LinkedIn profile and context. If interested, they'll connect with you directly on LinkedIn.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
              Your LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full bg-transparent border border-white/20 p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 font-mono"
              required
            />
          </div>

          <div className="mb-4">
            <label className="font-mono text-[10px] text-white/50 uppercase tracking-[0.1em] block mb-2">
              Why do you want to connect?
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Share your background and how you might be able to help this founder..."
              className="w-full h-28 bg-transparent border border-white/20 p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none font-mono"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ============================================
// FOUNDER ASK CARD
// ============================================

const FounderAskCard = ({ ask, index, onRequestConnection }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-white/10 hover:border-white/20 transition-colors group"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <span className="font-mono text-[10px] text-white/20">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="w-4 h-4 text-white/30" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
            {ask.sector}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          <span className="font-mono text-[10px]">{ask.createdAt}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {ask.description}
        </p>

        {/* Fundraising Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-white/30" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase">{ask.stage}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-white/30" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase">Target: {ask.target}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onRequestConnection(ask)}
            className="w-full flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] py-2.5 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair"
          >
            <Linkedin className="w-3 h-3" strokeWidth={1.5} />
            Request to Connect
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN PAGE
// ============================================

// Sector options for filtering
const SECTORS = [
  'All Sectors',
  'CleanTech & Energy',
  'HealthTech',
  'EdTech',
  'FinTech',
  'Logistics & Supply Chain',
  'Consumer',
  'Enterprise SaaS',
  'AI & Machine Learning',
  'PropTech',
  'FoodTech'
];

export default function Opportunities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedAsk, setSelectedAsk] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(false);

  // Filter asks based on search and sector
  const filteredAsks = FOUNDER_ASKS.filter(ask => {
    // Sector filter
    if (selectedSector !== 'All Sectors' && ask.sector !== selectedSector) {
      return false;
    }
    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      ask.sector.toLowerCase().includes(query) ||
      ask.description.toLowerCase().includes(query) ||
      ask.stage.toLowerCase().includes(query)
    );
  });

  const handleRequestConnection = (ask) => {
    if (!user) {
      toast.error('Please sign in to request a connection');
      return;
    }
    setSelectedAsk(ask);
    setShowIntroModal(true);
  };

  const handlePostAsk = () => {
    if (!user) {
      toast.error('Please sign in to post your ask');
      navigate('/auth');
      return;
    }
    // Navigate to post ask form (to be built)
    toast.info('Post Ask feature coming soon!');
  };

  return (
    <>
      <SEO
        title="Founder Asks | ChiStartup Hub"
        description="Discover Chicago founders who are fundraising. Connect with startups raising capital in CleanTech, HealthTech, FinTech, and more."
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
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight"
            >
              FOUNDER ASKS
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg max-w-2xl mb-8"
            >
              Chicago founders raising capital. Connect directly or request an introduction.
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <button
                onClick={handlePostAsk}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Post Your Ask
              </button>
              <div className="flex items-center gap-2 font-mono text-[10px] text-white/30 px-4">
                <Lock className="w-3 h-3" strokeWidth={1.5} />
                Vetted founders only
              </div>
            </motion.div>

            {/* Sector Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors cursor-crosshair ${
                    selectedSector === sector
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white/70'
                  }`}
                >
                  {sector}
                </button>
              ))}
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
                placeholder="SEARCH_BY_KEYWORD..."
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
                <span className="font-mono text-sm text-white">{new Set(FOUNDER_ASKS.map(a => a.sector)).size}</span>
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
            {filteredAsks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredAsks.map((ask, index) => (
                  <FounderAskCard
                    key={ask.id}
                    ask={ask}
                    index={index}
                    onRequestConnection={handleRequestConnection}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-white/10">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  [NO_RESULTS]
                </span>
                <p className="text-white/40 mt-4">No asks match your search.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-crosshair"
                >
                  Clear Search
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
            <h2 className="font-serif text-3xl text-white mb-8">Two Ways to Connect</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* How It Works - Single Path */}
              <div className="border border-white/10 p-6 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    Request to Connect
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <span className="font-mono text-[10px] text-white/30 block mb-2">01 — YOU</span>
                    <p className="text-sm text-white/40 leading-relaxed">
                      Share your LinkedIn profile and context about why you want to connect with this founder.
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-white/30 block mb-2">02 — FOUNDER</span>
                    <p className="text-sm text-white/40 leading-relaxed">
                      The founder receives your LinkedIn and reviews your profile. They stay anonymous until they decide.
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-white/30 block mb-2">03 — CONNECT</span>
                    <p className="text-sm text-white/40 leading-relaxed">
                      If interested, the founder connects with you directly on LinkedIn. Simple, no middleman.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        isOpen={showIntroModal}
        onClose={() => {
          setShowIntroModal(false);
          setSelectedAsk(null);
        }}
        founder={selectedAsk}
      />
    </>
  );
}
