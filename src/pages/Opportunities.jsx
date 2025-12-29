import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  DollarSign,
  Briefcase,
  Handshake,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

// ============================================
// FILTER TABS
// ============================================

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'talent', label: 'Talent', icon: Users },
  { id: 'capital', label: 'Capital', icon: DollarSign },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'connect', label: 'Connect', icon: Handshake },
];

// ============================================
// MOCK DATA
// ============================================

const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    type: 'capital',
    headline: 'Raising $2M Seed Round',
    oneLiner: 'Building the operating system for carbon tracking across supply chains.',
    sectors: ['CleanTech & Energy', 'SaaS (B2B)'],
    badges: ['Technical Founder', 'Techstars Alum'],
    userName: 'Jordan Lee',
    userInitials: 'JL',
    avatarColor: 'from-green-500 to-emerald-600',
    isVerified: true,
    isActive: true,
    createdAt: '2d ago',
  },
  {
    id: '2',
    type: 'talent',
    headline: 'Hiring Senior Full-Stack Engineer',
    oneLiner: 'AI-powered diagnostic platform transforming how clinics operate.',
    sectors: ['HealthTech', 'AI & Machine Learning'],
    badges: ['Venture Backed', 'YC Alum'],
    userName: 'Sarah Chen',
    userInitials: 'SC',
    avatarColor: 'from-blue-500 to-cyan-600',
    isVerified: true,
    isActive: true,
    createdAt: '5h ago',
  },
  {
    id: '3',
    type: 'work',
    headline: 'CTO Seeking Next Opportunity',
    oneLiner: '15+ years building scalable fintech infrastructure at Stripe and Square.',
    sectors: ['FinTech', 'SaaS (B2B)'],
    badges: ['Ex-FAANG', 'Technical Founder'],
    userName: 'Michael Torres',
    userInitials: 'MT',
    avatarColor: 'from-purple-500 to-violet-600',
    isVerified: true,
    isActive: false,
    createdAt: '1w ago',
  },
  {
    id: '4',
    type: 'connect',
    headline: 'Looking for HealthTech Founders',
    oneLiner: 'Building a founder community focused on HIPAA-compliant startups.',
    sectors: ['HealthTech', 'Life Sciences'],
    badges: ['Non-Technical Founder', 'Black Founder'],
    userName: 'Chris Johnson',
    userInitials: 'CJ',
    avatarColor: 'from-orange-500 to-amber-600',
    isVerified: true,
    isActive: true,
    createdAt: '3d ago',
  },
  {
    id: '5',
    type: 'capital',
    headline: 'Pre-Seed: $500K Target',
    oneLiner: 'Personalized learning paths powered by AI tutors for K-12 students.',
    sectors: ['EdTech', 'AI & Machine Learning'],
    badges: ['Student Founder', 'Woman Founder'],
    userName: 'Priya Sharma',
    userInitials: 'PS',
    avatarColor: 'from-pink-500 to-rose-600',
    isVerified: true,
    isActive: true,
    createdAt: '12h ago',
  },
  {
    id: '6',
    type: 'talent',
    headline: 'Looking for Head of Growth',
    oneLiner: 'Revolutionizing last-mile delivery for Chicago restaurants.',
    sectors: ['Logistics & Supply Chain', 'Marketplaces'],
    badges: ['Solo Founder', 'Bootstrapped'],
    userName: 'Alex Rivera',
    userInitials: 'AR',
    avatarColor: 'from-indigo-500 to-blue-600',
    isVerified: false,
    isActive: true,
    createdAt: '4d ago',
  },
];

// ============================================
// TAG COLORS BY TYPE
// ============================================

const getTagStyle = (tag) => {
  // Sector tags
  if (tag.includes('Tech') || tag.includes('SaaS') || tag.includes('AI')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
  if (tag.includes('Clean') || tag.includes('Energy')) {
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  }
  if (tag.includes('Health') || tag.includes('Life')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
  if (tag.includes('Ed')) {
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  }
  if (tag.includes('Logistics') || tag.includes('Market')) {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  }
  // Badge tags
  if (tag.includes('Founder')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
  if (tag.includes('Alum') || tag.includes('Backed')) {
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }
  if (tag.includes('FAANG') || tag.includes('Ex-')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  return 'bg-white/5 text-white/60 border-white/10';
};

// ============================================
// OPPORTUNITY CARD COMPONENT
// ============================================

const OpportunityCard = ({ opportunity }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-[#111111] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.15] transition-all duration-300"
    >
      {/* Header: Avatar + Status */}
      <div className="flex items-start justify-between mb-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opportunity.avatarColor} flex items-center justify-center text-lg font-bold text-white shadow-lg`}>
            {opportunity.userInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">{opportunity.userName}</span>
              {opportunity.isVerified && (
                <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/20" />
              )}
            </div>
            <span className="text-xs text-white/40">{opportunity.createdAt}</span>
          </div>
        </div>

        {/* Status Badge */}
        {opportunity.isActive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[11px] font-medium text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Body: Title + Subtitle */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
          {opportunity.headline}
        </h3>
        <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
          {opportunity.oneLiner}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {opportunity.sectors.slice(0, 2).map((sector, idx) => (
          <span
            key={`sector-${idx}`}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getTagStyle(sector)}`}
          >
            {sector}
          </span>
        ))}
        {opportunity.badges.slice(0, 1).map((badge, idx) => (
          <span
            key={`badge-${idx}`}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getTagStyle(badge)}`}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Action Button */}
      <Button
        asChild
        className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white/80 hover:text-white rounded-xl h-11 transition-all duration-300"
      >
        <Link to={`/Directory`}>
          View Profile
          <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Opportunities() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = MOCK_OPPORTUNITIES;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(opp => opp.type === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.headline.toLowerCase().includes(query) ||
        opp.oneLiner.toLowerCase().includes(query) ||
        opp.userName.toLowerCase().includes(query) ||
        opp.sectors.some(s => s.toLowerCase().includes(query)) ||
        opp.badges.some(b => b.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen">
      <SEO
        title="The Exchange | Opportunities"
        description="Direct connections to Chicago's verified founders and builders. Find talent, capital, roles, and connections."
      />

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            The Exchange
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/50 mb-10 max-w-xl mx-auto"
          >
            Direct connections to Chicago's verified founders and builders.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto mb-8"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
              type="text"
              placeholder="Search by keyword, sector, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-[#111111] border-white/[0.08] hover:border-white/[0.15] focus:border-white/[0.2] text-white text-base placeholder:text-white/30 rounded-2xl transition-all"
            />
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === 'all'
                ? MOCK_OPPORTUNITIES.length
                : MOCK_OPPORTUNITIES.filter(o => o.type === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80 border border-white/[0.06]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-black/70' : ''} />
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-black/10' : 'bg-white/[0.06]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* GRID CONTENT */}
      {/* ============================================ */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-white/50 text-sm">
              Showing <span className="text-white font-medium">{filteredOpportunities.length}</span> {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp, index) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <OpportunityCard opportunity={opp} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-medium text-white/80 mb-2">No opportunities found</h3>
              <p className="text-white/40 mb-6">Try adjusting your search or filters</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1]"
              >
                Clear all filters
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 md:p-12"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Have an opportunity to share?
                </h3>
                <p className="text-white/50 max-w-md">
                  Post your ask to The Exchange and connect with Chicago's founder community.
                </p>
              </div>

              <Button
                asChild
                className="bg-white hover:bg-white/90 text-black font-semibold rounded-xl px-8 h-12 text-base shrink-0"
              >
                <Link to="/Profile?tab=edit">
                  Post Your Ask
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
