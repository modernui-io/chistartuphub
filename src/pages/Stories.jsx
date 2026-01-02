import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X, Sparkles, Shield, ChevronDown, ArrowUpRight, Building2, Users, TrendingUp, Clock, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import { generateSlug } from "@/lib/utils";
import BureauFooter from "@/components/bureau/BureauFooter";

export default function Stories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [moatFilter, setMoatFilter] = useState("all");
  const [unicornFilter, setUnicornFilter] = useState(false);
  const [exitFilter, setExitFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => entities.Story.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const sectors = useMemo(() => [
    { id: "all", label: "All" },
    { id: "Consumer Tech", label: "Consumer" },
    { id: "FinTech", label: "FinTech" },
    { id: "SaaS", label: "SaaS" },
    { id: "HealthTech", label: "Health" },
    { id: "Logistics Tech", label: "Logistics" },
    { id: "B2B SaaS", label: "B2B" },
    { id: "FoodTech", label: "Food" },
    { id: "E-commerce", label: "Ecommerce" },
    { id: "AI & IoT", label: "AI/IoT" },
    { id: "LegalTech", label: "Legal" },
    { id: "InsurTech", label: "Insurance" },
    { id: "Creator Economy", label: "Creator" },
    { id: "HR Tech", label: "HR" },
    { id: "AI/ML", label: "AI/ML" },
    { id: "Hospitality Tech", label: "Hospitality" },
    { id: "Marketplace", label: "Marketplace" }
  ], []);

  const moats = useMemo(() => [
    { id: "all", label: "All" },
    { id: "Scale Economies", label: "Scale" },
    { id: "Network Effects", label: "Network" },
    { id: "Switching Costs", label: "Switching" },
    { id: "Branding", label: "Brand" },
    { id: "Counter-Positioning", label: "Counter-Pos" },
    { id: "Cornered Resource", label: "Resource" },
    { id: "Process Power", label: "Process" }
  ], []);

  // Helper functions
  const getFounderName = (story) => {
    if (story.founders && Array.isArray(story.founders)) {
      return story.founders.join(', ');
    }
    if (story.founder_name) return story.founder_name;
    return 'Unknown Founder';
  };

  const getJourneySummary = (story) => {
    return story.description || story.journey_summary || story.tagline || '';
  };

  const getCategory = (story) => {
    return story.sector || story.category || 'Technology';
  };

  const getExitValue = (story) => {
    return story.funding_raised || story.valuation || story.exit_value || '';
  };

  const getFounded = (story) => {
    return story.founded_year || story.founded || '';
  };

  const getPrimaryPower = (story) => {
    return story.competitive_moat || story.primary_power || '';
  };

  const isUnicorn = (story) => {
    if (story.is_unicorn) return true;
    const valuation = (story.valuation || story.exit_value || '').toLowerCase();
    const funding = (story.funding_raised || '').toLowerCase();
    return valuation.includes("unicorn") ||
           valuation.includes("$1b") ||
           valuation.includes("billion") ||
           /\$[\d.]+\s*b/i.test(valuation) ||
           /\$[\d.]+\s*b/i.test(funding);
  };

  const isExit = (story) => {
    const funding = (story.funding_raised || '').toLowerCase();
    const companyName = (story.company_name || '').toLowerCase();
    const knownExits = ['braintree', 'grubhub', 'simple mills', 'cleversafe', 'fieldglass', 'tock', 'bonobos', 'villagemd'];
    return funding.includes('acquired') ||
           funding.includes('exit') ||
           funding.includes('paypal') ||
           funding.includes('ibm') ||
           funding.includes('sap') ||
           funding.includes('walmart') ||
           funding.includes('squarespace') ||
           funding.includes('flowers') ||
           knownExits.includes(companyName);
  };

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const category = getCategory(story);
      if (sectorFilter !== "all" && category !== sectorFilter) return false;

      if (moatFilter !== "all") {
        const primaryPower = getPrimaryPower(story).toLowerCase();
        const secondaryPower = (story.secondary_power || story.moat_description || '').toLowerCase();
        const moatLower = moatFilter.toLowerCase();
        if (!primaryPower.includes(moatLower) && !secondaryPower.includes(moatLower)) return false;
      }

      if (unicornFilter && !isUnicorn(story)) return false;
      if (exitFilter && !isExit(story)) return false;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const companyMatch = (story.company_name || '').toLowerCase().includes(searchLower);
        const founderMatch = getFounderName(story).toLowerCase().includes(searchLower);
        const categoryMatch = category.toLowerCase().includes(searchLower);
        const summaryMatch = getJourneySummary(story).toLowerCase().includes(searchLower);
        if (!companyMatch && !founderMatch && !categoryMatch && !summaryMatch) return false;
      }

      return true;
    });
  }, [stories, sectorFilter, moatFilter, unicornFilter, exitFilter, searchQuery]);

  const paginatedStories = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredStories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStories, page]);

  const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  useEffect(() => {
    setPage(0);
  }, [searchQuery, sectorFilter, moatFilter, unicornFilter, exitFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSectorFilter("all");
    setMoatFilter("all");
    setUnicornFilter(false);
    setExitFilter(false);
  };

  const activeFilterCount = useMemo(() => {
    return [
      searchQuery !== "",
      sectorFilter !== "all",
      moatFilter !== "all",
      unicornFilter,
      exitFilter
    ].filter(Boolean).length;
  }, [searchQuery, sectorFilter, moatFilter, unicornFilter, exitFilter]);

  const featuredStory = useMemo(() => {
    const featured = filteredStories.filter(s => s.featured);
    return featured.length > 0 ? featured[0] : null;
  }, [filteredStories]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-4xl text-white mb-4">
            <span className="inline-block animate-pulse">LOADING</span>
          </div>
          <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
            [BLUEPRINTS: LOADING]
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="text-center">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
            [ERROR: LOAD_FAILED]
          </span>
          <p className="text-white/50">Error loading stories. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Chicago Blueprints: Startup Success Stories"
        description="How Groupon, ShipBob, and Cameo built billion-dollar companies. Deconstructed playbooks showing their competitive moats and paths to success."
        keywords="Chicago startups, founder playbooks, success blueprints, competitive moats, how they did it, startup strategy"
      />

      <div className="min-h-screen bg-[#050A14] text-white" data-page="stories">
        {/* Hero Section with Chicago Background */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          {/* Chicago Marina City Background - Unique architectural landmark */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=1920&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(100%) brightness(0.15)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050A14]/80 via-[#050A14]/60 to-[#050A14] z-[1]" />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [ARCHIVE: BLUEPRINTS]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight"
            >
              CHICAGO BLUEPRINTS
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg max-w-2xl mb-8"
            >
              How Groupon, ShipBob, and Cameo actually did it. Deconstructed playbooks showing competitive moats and paths to success.
            </motion.p>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/10 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/30 uppercase">Total Stories</span>
                <span className="font-mono text-sm text-white">{stories.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/30 uppercase">Showing</span>
                <span className="font-mono text-sm text-white">{filteredStories.length}</span>
              </div>
              {unicornFilter && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-[10px] text-amber-400 uppercase">Unicorns Only</span>
                </div>
              )}
              {exitFilter && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono text-[10px] text-emerald-400 uppercase">Exits Only</span>
                </div>
              )}
            </div>
            <div className="font-mono text-[10px] text-white/20 uppercase">
              Page {page + 1} of {totalPages || 1}
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="py-8 px-6 border-b border-white/10">
          <div className="max-w-6xl mx-auto">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="SEARCH_COMPANIES_FOUNDERS_MOATS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-white/10 py-4 pl-12 pr-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors cursor-crosshair"
              >
                <Filter className="w-3 h-3" strokeWidth={1.5} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/10 text-white text-[9px]">{activeFilterCount}</span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 hover:text-white transition-colors cursor-crosshair"
                >
                  <X className="w-3 h-3" strokeWidth={1.5} />
                  Clear All
                </button>
              )}
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 space-y-6">
                    {/* Sector Filter */}
                    <div>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mb-3">Sector</span>
                      <div className="flex flex-wrap gap-1">
                        {sectors.map((sector) => (
                          <button
                            key={sector.id}
                            onClick={() => setSectorFilter(sector.id)}
                            className={`font-mono text-[10px] uppercase tracking-[0.05em] px-4 py-2.5 border transition-colors cursor-crosshair ${
                              sectorFilter === sector.id
                                ? 'bg-white text-black border-white'
                                : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {sector.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Moat Filter */}
                    <div>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mb-3 flex items-center gap-2">
                        <Shield className="w-3 h-3" strokeWidth={1.5} />
                        Competitive Moat
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {moats.map((moat) => (
                          <button
                            key={moat.id}
                            onClick={() => setMoatFilter(moat.id)}
                            className={`font-mono text-[10px] uppercase tracking-[0.05em] px-4 py-2.5 border transition-colors cursor-crosshair ${
                              moatFilter === moat.id
                                ? 'bg-white text-black border-white'
                                : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {moat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Special Filters */}
                    <div>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mb-3">Special</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setUnicornFilter(!unicornFilter)}
                          className={`font-mono text-[10px] uppercase tracking-[0.05em] px-4 py-2.5 border transition-colors cursor-crosshair flex items-center gap-2 ${
                            unicornFilter
                              ? 'bg-amber-500 text-black border-amber-500'
                              : 'border-white/10 text-white/50 hover:border-amber-500/50 hover:text-amber-400'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                          Unicorns ($1B+)
                        </button>
                        <button
                          onClick={() => setExitFilter(!exitFilter)}
                          className={`font-mono text-[10px] uppercase tracking-[0.05em] px-4 py-2.5 border transition-colors cursor-crosshair flex items-center gap-2 ${
                            exitFilter
                              ? 'bg-emerald-500 text-black border-emerald-500'
                              : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'
                          }`}
                        >
                          <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                          Exits (Acquired)
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Featured Story */}
        {featuredStory && (
          <section className="py-12 px-6 border-b border-white/10">
            <div className="max-w-6xl mx-auto">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
                [FEATURED: BLUEPRINT]
              </span>
              
              <Link 
                to={`/stories/${generateSlug(featuredStory.company_name)}`}
                className="block border border-white/10 hover:border-white/30 transition-colors group"
              >
                <div className="grid md:grid-cols-2">
                  {/* Image */}
                  <div className="aspect-video md:aspect-auto bg-white/5 relative overflow-hidden">
                    {featuredStory.image_url ? (
                      <img 
                        src={featuredStory.image_url} 
                        alt={featuredStory.company_name}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-white/10" strokeWidth={1} />
                      </div>
                    )}
                    {isUnicorn(featuredStory) && (
                      <div className="absolute top-4 left-4 flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-black/50 px-2 py-1">
                        <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                        UNICORN
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono text-[10px] text-white/30 uppercase">{getCategory(featuredStory)}</span>
                      {getFounded(featuredStory) && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="font-mono text-[10px] text-white/30 uppercase">Founded {getFounded(featuredStory)}</span>
                        </>
                      )}
                    </div>

                    <h2 className="font-serif text-3xl md:text-4xl text-white mb-2 group-hover:text-white/80 transition-colors">
                      {featuredStory.company_name}
                    </h2>
                    
                    <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-4">
                      {getFounderName(featuredStory)}
                    </p>

                    <p className="text-sm text-white/50 leading-relaxed mb-6 flex-1">
                      {getJourneySummary(featuredStory).slice(0, 200)}...
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPrimaryPower(featuredStory) && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                            <span className="font-mono text-[10px] text-white/40 uppercase">{getPrimaryPower(featuredStory)}</span>
                          </div>
                        )}
                        {getExitValue(featuredStory) && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                            <span className="font-mono text-[10px] text-white/40 uppercase">{getExitValue(featuredStory)}</span>
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Stories Grid */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">
              [ALL: BLUEPRINTS]
            </span>

            {filteredStories.length === 0 ? (
              <div className="text-center py-16 border border-white/10">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
                  [NO_RESULTS]
                </span>
                <p className="text-white/40 mb-4">No stories match your current filters.</p>
                <button
                  onClick={clearFilters}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-crosshair"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 border-l border-t border-white/10">
                  {paginatedStories.map((story, index) => (
                    <Link
                      key={story.id}
                      to={`/stories/${generateSlug(story.company_name)}`}
                      className="border-r border-b border-white/10 p-6 hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Index */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] text-white/20">
                          {String(page * ITEMS_PER_PAGE + index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2">
                          {isUnicorn(story) && (
                            <div className="flex items-center gap-1 font-mono text-[9px] text-amber-400">
                              <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
                              UNICORN
                            </div>
                          )}
                          {isExit(story) && (
                            <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                              <DollarSign className="w-2.5 h-2.5" strokeWidth={1.5} />
                              EXIT
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Company */}
                      <h3 className="font-serif text-xl text-white mb-1 group-hover:text-white/80 transition-colors">
                        {story.company_name}
                      </h3>
                      <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">
                        {getFounderName(story)}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="font-mono text-[9px] text-white/40 px-2 py-0.5 border border-white/10 uppercase">
                          {getCategory(story)}
                        </span>
                        {getFounded(story) && (
                          <span className="font-mono text-[9px] text-white/40 px-2 py-0.5 border border-white/10 uppercase">
                            {getFounded(story)}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2">
                        {getJourneySummary(story).slice(0, 120)}...
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          {getPrimaryPower(story) && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-white/20" strokeWidth={1.5} />
                              <span className="font-mono text-[9px] text-white/30 uppercase">{getPrimaryPower(story).split(' ')[0]}</span>
                            </div>
                          )}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" strokeWidth={1.5} />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={!hasPrevPage}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="font-mono text-[10px] text-white/30">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={!hasNextPage}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </>
  );
}
