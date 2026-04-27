import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Calendar, Flame, ArrowUpRight, Building2, MessageSquarePlus, Gift, Rocket, Trophy, Clock, Target, Filter, X, ChevronDown, MapPin, Layers, Briefcase } from "lucide-react";
import ShareActions from "@/components/ShareActions";
import FundingDetailModal from "./FundingDetailModal";
import InvestorStatsBar from "@/components/investors/InvestorStatsBar";
import OpportunityStatsBar from "./OpportunityStatsBar";

const OPPORTUNITIES_PREVIEW_LIMIT = 6; // 3 rows × 2 columns for dashboard preview
const INVESTORS_PREVIEW_LIMIT = 6; // 3 rows × 2 columns for dashboard preview

export default function FundingOpportunitiesContent({ opportunities = [], investors = [] }) {
  const [activeOpportunityFilter, setActiveOpportunityFilter] = useState("hot"); // Default to hot/urgent
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // Investor section state
  const [investorFilter, setInvestorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setStageFilter("all");
    setSectorFilter("all");
    setLocationFilter("all");
  };

  const hasActiveAdvancedFilters = stageFilter !== "all" || sectorFilter !== "all" || locationFilter !== "all";

  // Helper functions
  const getOpportunityUrl = (opp) => opp?.website || opp?.link || '';
  const getOpportunityDescription = (opp) => opp?.description || opp?.note || opp?.subtitle || '';

  const getOpportunityType = (opp) => {
    if (!opp) return 'Grant';
    const type = (opp.opportunity_type || '').toLowerCase();
    if (type === 'grant') return 'Grant';
    if (type === 'accelerator' || type === 'accelerator_application') return 'Accelerator';
    if (type === 'competition' || type === 'pitch_competition') return 'Competition';
    // Check stage array for type hints
    const stageArr = Array.isArray(opp.stage) ? opp.stage : [opp.stage];
    if (stageArr.some(s => s?.toLowerCase() === 'accelerator')) return 'Accelerator';
    if (stageArr.some(s => s?.toLowerCase() === 'competition')) return 'Competition';
    return 'Grant'; // Default to Grant for remaining opportunities
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = (opp) => {
    if (!opp) return 'rolling';
    const days = getDaysUntilDeadline(opp.deadline);
    if (days === null) return 'rolling';
    if (days < 0) return 'closed';
    if (days <= 30) return 'closing-soon';
    return 'open';
  };

  // Filter opportunities based on active filter
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (!item) return false;
      const status = getDeadlineStatus(item);
      if (status === 'closed') return false;

      // Apply filter
      if (activeOpportunityFilter === "hot") {
        const days = getDaysUntilDeadline(item.deadline);
        if (days === null || days < 0 || days > 30) return false;
      } else if (activeOpportunityFilter !== "all") {
        const type = getOpportunityType(item);
        if (type !== activeOpportunityFilter) return false;
      }
      return true;
    }).sort((a, b) => {
      const daysA = getDaysUntilDeadline(a.deadline);
      const daysB = getDaysUntilDeadline(b.deadline);
      if (daysA !== null && daysB !== null) return daysA - daysB;
      if (daysA !== null) return -1;
      if (daysB !== null) return 1;
      return 0;
    });
  }, [opportunities, activeOpportunityFilter]);

  // Opportunity stats for the stats bar
  const opportunityStats = useMemo(() => {
    let hot = 0, grants = 0, accelerators = 0, competitions = 0;
    opportunities.forEach(opp => {
      if (!opp) return;
      const status = getDeadlineStatus(opp);
      if (status === 'closed') return;

      const type = getOpportunityType(opp);
      if (type === 'Grant') grants++;
      if (type === 'Accelerator') accelerators++;
      if (type === 'Competition') competitions++;

      const days = getDaysUntilDeadline(opp.deadline);
      if (days !== null && days >= 0 && days <= 30) hot++;
    });
    return { hot, grants, accelerators, competitions };
  }, [opportunities]);

  // Preview opportunities (limited to 6 for dashboard view)
  const previewOpportunities = filteredOpportunities.slice(0, OPPORTUNITIES_PREVIEW_LIMIT);

  // Investor stats
  const investorStats = useMemo(() => {
    const vcs = investors.filter(i => i.investor_type === 'vc').length;
    const angels = investors.filter(i => i.investor_type === 'angel').length;
    const midwest = investors.filter(i => i.is_midwest).length;
    return { total: investors.length, vcs, angels, midwest };
  }, [investors]);

  // Get unique stages from investors
  const availableStages = useMemo(() => {
    const stages = new Set();
    investors.forEach(i => {
      if (i.stage_focus) stages.add(i.stage_focus);
    });
    return Array.from(stages).sort();
  }, [investors]);

  // Helper to get top N items by count
  const getTopCounts = (items, getValue, limit) => {
    const counts = {};
    items.forEach(item => {
      const values = [getValue(item)].flat().filter(Boolean);
      values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  };

  // Get unique sectors and locations from investors
  const availableSectors = useMemo(() => getTopCounts(investors, i => i.sectors || [], 15), [investors]);
  const availableLocations = useMemo(() => getTopCounts(investors, i => i.hq_state, 10), [investors]);

  // Sorted investors by MVIP score (for filtering)
  const sortedInvestors = useMemo(() => {
    return investors
      .filter(i => i.canonical_name)
      .sort((a, b) => (b.mvip_score || 0) - (a.mvip_score || 0));
  }, [investors]);

  // Filtered investors based on active filter and advanced filters
  const filteredInvestors = useMemo(() => {
    return sortedInvestors.filter(investor => {
      // Main category filter
      if (investorFilter === 'vc' && investor.investor_type !== 'vc') return false;
      if (investorFilter === 'angel' && investor.investor_type !== 'angel') return false;
      if (investorFilter === 'midwest' && !investor.is_midwest) return false;

      // Stage filter
      if (stageFilter !== 'all' && investor.stage_focus !== stageFilter) return false;

      // Sector filter
      if (sectorFilter !== 'all') {
        const sectors = investor.sectors || [];
        if (!sectors.some(s => s.toLowerCase() === sectorFilter.toLowerCase())) return false;
      }

      // Location filter
      if (locationFilter !== 'all' && investor.hq_state !== locationFilter) return false;

      return true;
    });
  }, [sortedInvestors, investorFilter, stageFilter, sectorFilter, locationFilter]);

  // Preview investors (limited to 6 for dashboard view)
  const previewInvestors = filteredInvestors.slice(0, INVESTORS_PREVIEW_LIMIT);

  return (
    <div>
      {/* ========================================
          SECTION 1: OPPORTUNITIES
          ======================================== */}

      {/* Opportunities Definition Section */}
      <section className="mb-10">
        <div className="flex items-start gap-4 p-6 border border-green-500/20 bg-gradient-to-r from-green-950/20 to-transparent">
          <div className="shrink-0 p-3 bg-green-500/10 border border-green-500/20">
            <Target size={24} className="text-green-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-white mb-2">
              What are Opportunities?
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed">
              <strong className="text-white/80">Opportunities</strong> are time-sensitive funding programs with
              <span className="text-orange-400"> application deadlines</span>. This includes grants, accelerator programs,
              pitch competitions, and other programs where you submit an application and get selected.
              Unlike investors (who you pitch directly), these have <em>open calls</em> with specific windows.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Gift size={14} className="text-green-400" strokeWidth={1.5} />
                <span>Grants — Non-dilutive funding</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Rocket size={14} className="text-blue-400" strokeWidth={1.5} />
                <span>Accelerators — Programs + investment</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Trophy size={14} className="text-purple-400" strokeWidth={1.5} />
                <span>Competitions — Prize-based funding</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Stats Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em]">
            [OPPORTUNITIES]
          </span>
          <span className="font-mono text-xs text-white/30">
            {filteredOpportunities.length} available
          </span>
        </div>
        <OpportunityStatsBar
          stats={opportunityStats}
          activeFilter={activeOpportunityFilter}
          onFilterClick={setActiveOpportunityFilter}
        />
      </div>

      {/* Opportunities Grid - Limited to 6 items */}
      {previewOpportunities.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.01] p-16 text-center">
          <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <span className="bureau-label block mb-4">[NO_UPCOMING]</span>
          <p className="text-white/40 mb-6">No opportunities with upcoming deadlines in this category.</p>
          <button
            onClick={() => setActiveOpportunityFilter('hot')}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
          >
            View Hot Opportunities
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
          {previewOpportunities.map((opp, index) => {
            const type = getOpportunityType(opp);
            const days = getDaysUntilDeadline(opp.deadline);
            const isHot = days !== null && days >= 0 && days <= 30;
            const url = getOpportunityUrl(opp);
            const description = getOpportunityDescription(opp);

            return (
              <div
                key={opp.id || index}
                onClick={(e) => {
                  setModalPosition({ x: e.clientX, y: e.clientY });
                  setSelectedOpportunity(opp);
                }}
                className="p-8 border-b border-r border-white/10 md:[&:nth-child(2n)]:border-r-0 bg-black/20 hover:bg-black/30 hover:border-white/25 transition-all group flex flex-col cursor-pointer"
              >
                {/* Badges - Top Right */}
                <div className="flex items-start justify-end gap-2 mb-4">
                  {isHot && (
                    <span className="font-mono text-[10px] text-orange-400 uppercase tracking-[0.15em] px-2 py-1 border border-orange-400/30 flex items-center gap-1">
                      <Flame className="w-3 h-3" strokeWidth={1.5} />
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-1 border border-white/20">
                    {type}
                  </span>
                </div>

                <h3 className="font-mono text-sm font-medium uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors line-clamp-2">
                  {opp.name}
                </h3>

                <p className="text-[13px] text-white/50 leading-relaxed mb-6 flex-grow line-clamp-2">
                  {description || opp.check_size || opp.organization || 'Funding opportunity'}
                </p>

                {/* Footer with divider */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {opp.check_size && (
                      <span className="font-mono text-xs text-white/70 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {opp.check_size}
                      </span>
                    )}
                    {opp.deadline && (
                      <span className="font-mono text-xs text-white/50 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <ShareActions
                      resourceType="funding_opportunity"
                      resourceId={opp.id}
                      resourceName={opp.name}
                      resourceDescription={description}
                      resourceUrl={url}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPosition({ x: e.clientX, y: e.clientY });
                        setSelectedOpportunity(opp);
                      }}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-1.5 cursor-crosshair"
                    >
                      Details
                      <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Opportunities CTA */}
      {filteredOpportunities.length > OPPORTUNITIES_PREVIEW_LIMIT && (
        <div className="mt-6 text-center">
          <Link
            to="/funding"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors"
          >
            View All Opportunities
            <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      )}

      {/* Suggestion prompt for opportunities */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="mailto:hello@chistartuphub.com?subject=Suggest%20an%20Opportunity"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <MessageSquarePlus size={12} strokeWidth={1.5} />
          Know an opportunity we're missing?
        </a>
        <a
          href="https://s3gadvisors.notion.site/Chicago-Small-Business-Funding-Wiki-42081a119ab24aa0b18084a15485e320"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
        >
          Browse Chicago Funding Wiki
          <ArrowUpRight size={10} strokeWidth={1.5} />
        </a>
      </div>

      {/* ========================================
          SECTION 2: INVESTORS
          ======================================== */}
      {investors.length > 0 && (
        <section className="mt-16 pt-12 border-t border-blue-500/20">
          {/* Investor Definition Section */}
          <div className="flex items-start gap-4 p-6 border border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-transparent mb-10">
            <div className="shrink-0 p-3 bg-blue-500/10 border border-blue-500/20">
              <Building2 size={24} className="text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-white mb-2">
                What are Investors?
              </h2>
              <p className="text-[13px] text-white/60 leading-relaxed">
                <strong className="text-white/80">Investors</strong> are firms and individuals who provide
                <span className="text-blue-400"> equity funding</span> in exchange for ownership stakes.
                Unlike opportunities, there's no application window—you pitch directly, build relationships,
                and close deals on your own timeline.
              </p>
              <p className="text-[12px] text-white/40 mt-3 italic">
                Research their portfolio, check for conflicts, and warm intros beat cold emails.
              </p>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em]">
              [INVESTORS]
            </span>
            <span className="font-mono text-xs text-white/30">
              {investorStats.total} total
            </span>
          </div>

          {/* Interactive Investor Stats Bar */}
          <div className="mb-4">
            <InvestorStatsBar
              stats={investorStats}
              activeFilter={investorFilter}
              onFilterClick={setInvestorFilter}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`
                flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5
                border transition-all
                ${showAdvancedFilters || hasActiveAdvancedFilters
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
                }
              `}
            >
              <Filter size={12} strokeWidth={1.5} />
              Advanced Filters
              {hasActiveAdvancedFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] rounded-full">
                  {[stageFilter, sectorFilter, locationFilter].filter(f => f !== 'all').length}
                </span>
              )}
              <ChevronDown
                size={12}
                strokeWidth={1.5}
                className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Advanced Filter Dropdowns */}
            {showAdvancedFilters && (
              <div className="mt-4 p-4 border border-white/10 bg-black/40 backdrop-blur-sm">
                <div className="flex flex-wrap gap-4">
                  {/* Stage Filter */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="flex items-center gap-1.5 font-mono text-[9px] text-white/40 uppercase tracking-[0.15em] mb-2">
                      <Layers size={10} strokeWidth={1.5} />
                      Stage
                    </label>
                    <select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 text-white/80 text-[11px] font-mono px-3 py-2 focus:outline-none focus:border-white/40"
                    >
                      <option value="all">All Stages</option>
                      {availableStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sector Filter */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="flex items-center gap-1.5 font-mono text-[9px] text-white/40 uppercase tracking-[0.15em] mb-2">
                      <Briefcase size={10} strokeWidth={1.5} />
                      Sector
                    </label>
                    <select
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 text-white/80 text-[11px] font-mono px-3 py-2 focus:outline-none focus:border-white/40"
                    >
                      <option value="all">All Sectors</option>
                      {availableSectors.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="flex items-center gap-1.5 font-mono text-[9px] text-white/40 uppercase tracking-[0.15em] mb-2">
                      <MapPin size={10} strokeWidth={1.5} />
                      Location
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 text-white/80 text-[11px] font-mono px-3 py-2 focus:outline-none focus:border-white/40"
                    >
                      <option value="all">All Locations</option>
                      {availableLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveAdvancedFilters && (
                    <div className="flex items-end">
                      <button
                        onClick={clearAdvancedFilters}
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 text-white/50 hover:text-white border border-white/15 hover:border-white/30 transition-colors"
                      >
                        <X size={10} strokeWidth={1.5} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Active filter count */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <span className="font-mono text-[10px] text-white/40">
                    Showing {filteredInvestors.length} of {investors.length} investors
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Featured Investors Grid - 2 columns, 3 rows */}
          <div className="grid md:grid-cols-2 gap-0 border border-white/10 bg-black/20 backdrop-blur-sm">
            {previewInvestors.map((investor, index) => (
              <Link
                key={investor.id || index}
                to="/investors"
                className="p-6 border-b border-r border-white/10 md:[&:nth-child(2n)]:border-r-0 hover:bg-white/[0.03] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {investor.is_midwest && (
                      <span className="font-mono text-[9px] text-amber-400 uppercase tracking-[0.15em] px-1.5 py-0.5 border border-amber-400/30 bg-amber-500/10">
                        Midwest
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.15em]">
                      {investor.investor_type === 'vc' ? 'VC' : investor.investor_type === 'angel' ? 'Angel' : 'Investor'}
                    </span>
                  </div>
                </div>
                <h3 className="font-mono text-sm font-medium uppercase tracking-[0.1em] text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {investor.canonical_name}
                </h3>
                {investor.description && (
                  <p className="text-[11px] text-white/40 line-clamp-1 mb-2">
                    {investor.description.length > 60
                      ? investor.description.slice(0, 57) + '...'
                      : investor.description
                    }
                  </p>
                )}
                <p className="text-[12px] text-white/30 line-clamp-1">
                  {investor.hq_city && investor.hq_state ? `${investor.hq_city}, ${investor.hq_state}` : 'US'}
                  {investor.check_size_min && ` · ${investor.check_size_min}`}
                </p>
              </Link>
            ))}
          </div>

          {/* View All Investors CTA */}
          {filteredInvestors.length > INVESTORS_PREVIEW_LIMIT && (
            <div className="mt-6 text-center">
              <Link
                to="/investors"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors"
              >
                View All {filteredInvestors.length} {investorFilter !== 'all' ?
                  (investorFilter === 'vc' ? 'VCs' : investorFilter === 'angel' ? 'Angels' : 'Midwest Investors')
                  : 'Investors'}
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            </div>
          )}

          {/* Suggest investor */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/investors"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors"
            >
              Browse Full Directory ({investorStats.total}+)
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
            <a
              href="mailto:hello@chistartuphub.com?subject=Suggest%20an%20Investor"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
            >
              <MessageSquarePlus size={12} strokeWidth={1.5} />
              Know an investor we're missing?
            </a>
          </div>
        </section>
      )}

      {/* External Resources */}
      <section className="mt-20">
        <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em] block mb-8">[EXTERNAL_RESOURCES]</span>
        <div className="grid md:grid-cols-2 gap-0 border border-white/10">
          {[
            {
              name: "NFX Signal Database",
              description: "Search thousands of investors by stage, sector, and check size",
              link: "https://signal.nfx.com/investors"
            },
            {
              name: "Chicago Funding Wiki",
              description: "Comprehensive wiki of funding resources for Chicago startups",
              link: "https://s3gadvisors.notion.site/Chicago-Small-Business-Funding-Wiki-42081a119ab24aa0b18084a15485e320"
            }
          ].map((resource, index) => (
            <a
              key={index}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-8 border-b border-r border-white/10 md:[&:nth-child(2n)]:border-r-0 hover:bg-white/[0.02] transition-all group flex flex-col"
            >
              <h3 className="font-mono text-sm font-medium uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors">
                {resource.name}
              </h3>
              <p className="text-[13px] text-white/50 leading-relaxed mb-6 flex-grow">
                {resource.description}
              </p>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 group-hover:text-white transition-colors">
                Visit
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Detail Modal */}
      <FundingDetailModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        position={modalPosition}
      />
    </div>
  );
}
