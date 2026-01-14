import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Calendar, Search, X, Flame, ChevronLeft, ChevronRight, ArrowUpRight, Users, Building2, TrendingUp, ExternalLink } from "lucide-react";
import ShareActions from "@/components/ShareActions";
import FundingDetailModal from "./FundingDetailModal";

// Inline Investors Grid component for VC tab
function InvestorsGrid({ investors }) {
  const [investorPage, setInvestorPage] = useState(0);
  const INVESTORS_PER_PAGE = 12;

  const totalInvestorPages = Math.ceil(investors.length / INVESTORS_PER_PAGE);
  const paginatedInvestors = investors.slice(
    investorPage * INVESTORS_PER_PAGE,
    (investorPage + 1) * INVESTORS_PER_PAGE
  );

  return (
    <>
      <div className="grid md:grid-cols-2 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
        {paginatedInvestors.map((investor, index) => (
          <a
            key={investor.id || index}
            href={investor.website || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-b border-r border-white/10 md:[&:nth-child(2n)]:border-r-0 bg-black/20 hover:bg-black/30 hover:border-white/25 transition-all group flex flex-col"
          >
            {/* Badges */}
            <div className="flex items-start justify-end gap-2 mb-4">
              {investor.is_midwest && (
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-[0.15em] px-2 py-1 border border-amber-400/30">
                  Midwest
                </span>
              )}
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-1 border border-white/20">
                {investor.investor_type === 'vc' ? 'VC' : investor.investor_type === 'angel' ? 'Angel' : 'Investor'}
              </span>
            </div>

            <h3 className="font-mono text-sm font-medium uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors line-clamp-2">
              {investor.canonical_name}
            </h3>

            <p className="text-[13px] text-white/50 leading-relaxed mb-6 flex-grow line-clamp-2">
              {investor.description || `${investor.hq_city ? `${investor.hq_city}, ${investor.hq_state}` : 'US-based'} ${investor.investor_type === 'vc' ? 'venture capital firm' : 'angel investor'}`}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10">
              <div className="flex items-center gap-4">
                {investor.check_size_min && (
                  <span className="font-mono text-xs text-white/70 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {investor.check_size_min}
                  </span>
                )}
                {investor.hq_city && (
                  <span className="font-mono text-xs text-white/50">
                    {investor.hq_city}, {investor.hq_state}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border border-white/20 text-white/60 group-hover:bg-white group-hover:text-black group-hover:border-white transition-colors flex items-center gap-1.5">
                Website
                <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      {totalInvestorPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setInvestorPage(p => p - 1)}
            disabled={investorPage === 0}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
          >
            <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
            Prev
          </button>
          <span className="font-mono text-xs text-white/40 px-4">
            {investorPage + 1} / {totalInvestorPages}
          </span>
          <button
            onClick={() => setInvestorPage(p => p + 1)}
            disabled={investorPage >= totalInvestorPages - 1}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* View Full Directory CTA */}
      <div className="mt-8 text-center">
        <Link
          to="/investors"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors"
        >
          View Full Investor Directory
          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>
    </>
  );
}

const ITEMS_PER_PAGE = 12;

export default function FundingOpportunitiesContent({ opportunities = [], investors = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [focusFilter, setFocusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const quickTabs = [
    { id: "all", label: "All" },
    { id: "hot", label: "Hot" },
    { id: "Grant", label: "Grants" },
    { id: "Accelerator", label: "Accelerators" },
    { id: "Competition", label: "Competitions" },
    { id: "VC", label: "Investors" },
  ];

  const focusAreas = [
    "all", "AI", "B2B", "CleanTech", "Consumer", "EdTech", "FinTech",
    "FoodTech", "Healthcare", "HealthTech", "SaaS", "Social Impact", "Technology"
  ];

  const stages = [
    { value: "all", label: "All Stages" },
    { value: "Pre-Seed", label: "Pre-Seed" },
    { value: "Seed", label: "Seed" },
    { value: "Early Stage", label: "Early Stage" },
    { value: "Growth", label: "Growth" },
    { value: "Series A+", label: "Series A+" }
  ];

  const regions = [
    { value: "all", label: "All Regions" },
    { value: "chicago", label: "Chicago/Illinois" },
    { value: "us-national", label: "US National" },
    { value: "europe", label: "Europe" },
    { value: "asia", label: "Asia Pacific" },
    { value: "africa", label: "Africa" }
  ];

  // Helper functions
  const getOpportunityUrl = (opp) => opp?.website || opp?.link || '';
  const getOpportunityDescription = (opp) => opp?.description || opp?.note || opp?.subtitle || '';
  const getOpportunitySectors = (opp) => opp?.sectors || opp?.focus_areas || [];

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

  const getRegion = (opp) => {
    if (!opp) return 'us-national';
    const name = (opp.name || '').toLowerCase();
    const org = (opp.organization || '').toLowerCase();
    const desc = getOpportunityDescription(opp).toLowerCase();
    const location = (opp.location || '').toLowerCase();
    const combined = `${name} ${org} ${desc} ${location}`;
    if (combined.includes('chicago') || combined.includes('illinois') || combined.includes('midwest')) return 'chicago';
    if (combined.includes('europe') || combined.includes('eic') || combined.includes(' eu ') || combined.includes(' uk ')) return 'europe';
    if (combined.includes('africa') || combined.includes('nigeria') || combined.includes('kenya')) return 'africa';
    if (combined.includes('asia') || combined.includes('singapore') || combined.includes('korea')) return 'asia';
    return 'us-national';
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

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (!item) return false;
      const status = getDeadlineStatus(item);
      if (status === 'closed') return false;
      if (activeTab === "hot") {
        const days = getDaysUntilDeadline(item.deadline);
        if (days === null || days < 0 || days > 30) return false;
      } else if (activeTab !== "all") {
        const type = getOpportunityType(item);
        if (type !== activeTab) return false;
      }
      if (focusFilter !== "all") {
        const sectors = getOpportunitySectors(item);
        if (!sectors.some((f) => f.toLowerCase() === focusFilter.toLowerCase() || f === "All sectors" || f === "All")) {
          return false;
        }
      }
      if (stageFilter !== "all") {
        const stageArr = Array.isArray(item.stage) ? item.stage : [item.stage];
        if (!stageArr.some(s => s?.toLowerCase().includes(stageFilter.toLowerCase()))) {
          return false;
        }
      }
      if (regionFilter !== "all") {
        const region = getRegion(item);
        if (region !== regionFilter) return false;
      }
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const descMatch = getOpportunityDescription(item).toLowerCase().includes(searchLower);
        const orgMatch = item.organization?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch && !orgMatch) return false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, activeTab, focusFilter, stageFilter, regionFilter, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts = { all: 0, hot: 0, Grant: 0, Accelerator: 0, Competition: 0, VC: 0 };
    // Count opportunities
    opportunities.forEach(opp => {
      if (!opp) return;
      const status = getDeadlineStatus(opp);
      if (status === 'closed') return;
      counts.all++;
      const type = getOpportunityType(opp);
      if (counts[type] !== undefined) counts[type]++;
      const days = getDaysUntilDeadline(opp.deadline);
      if (days !== null && days >= 0 && days <= 30) counts.hot++;
    });
    // Add investors to "all" and set VC count
    counts.VC = investors.length;
    counts.all += investors.length;
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, investors]);

  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const paginatedOpportunities = filteredOpportunities.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  const clearFilters = () => {
    setActiveTab("all");
    setFocusFilter("all");
    setStageFilter("all");
    setRegionFilter("all");
    setSearchQuery("");
    setPage(0);
  };

  const activeFilterCount = useMemo(() => [
    focusFilter !== "all",
    stageFilter !== "all",
    regionFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length, [focusFilter, stageFilter, regionFilter, searchQuery]);

  // Investor stats
  const investorStats = useMemo(() => {
    const vcs = investors.filter(i => i.investor_type === 'vc').length;
    const angels = investors.filter(i => i.investor_type === 'angel').length;
    const midwest = investors.filter(i => i.is_midwest).length;
    return { total: investors.length, vcs, angels, midwest };
  }, [investors]);

  // Featured investors (top 6 by MVIP score)
  const featuredInvestors = useMemo(() => {
    return investors
      .filter(i => i.mvip_score && i.canonical_name)
      .sort((a, b) => (b.mvip_score || 0) - (a.mvip_score || 0))
      .slice(0, 6);
  }, [investors]);

  return (
    <div>
      {/* Search - Full Width, Prominent */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/10 font-mono text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Quick Filter Tabs - Pill Style */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {quickTabs.map((tab) => {
          const count = tabCounts[tab.id] || 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(0); }}
              className={`font-mono text-xs font-medium uppercase tracking-[0.1em] px-4 py-2.5 flex items-center gap-2 transition-all border ${
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white/60 border-white/15 hover:text-white hover:border-white/30"
              }`}
            >
              {tab.id === "hot" && <Flame className="w-3.5 h-3.5" strokeWidth={1.5} />}
              <span>{tab.label}</span>
              <span className={`text-[10px] ${isActive ? 'text-black/50' : 'text-white/40'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filters - Always Visible Inline */}
      <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-white/10">
        <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Filter:</span>
        <select
          value={focusFilter}
          onChange={(e) => { setFocusFilter(e.target.value); setPage(0); }}
          className="bg-transparent border border-white/15 font-mono text-xs text-white/70 px-3 py-2 focus:outline-none focus:border-white/30 hover:border-white/25 transition-colors"
        >
          {focusAreas.map((area) => (
            <option key={area} value={area} className="bg-[#0a0a0a]">
              {area === "all" ? "All Sectors" : area}
            </option>
          ))}
        </select>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
          className="bg-transparent border border-white/15 font-mono text-xs text-white/70 px-3 py-2 focus:outline-none focus:border-white/30 hover:border-white/25 transition-colors"
        >
          {stages.map((stage) => (
            <option key={stage.value} value={stage.value} className="bg-[#0a0a0a]">
              {stage.label}
            </option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
          className="bg-transparent border border-white/15 font-mono text-xs text-white/70 px-3 py-2 focus:outline-none focus:border-white/30 hover:border-white/25 transition-colors"
        >
          {regions.map((region) => (
            <option key={region.value} value={region.value} className="bg-[#0a0a0a]">
              {region.label}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors flex items-center gap-1.5 ml-auto"
          >
            <X className="w-3 h-3" strokeWidth={1.5} />
            Clear
          </button>
        )}
        <span className="font-mono text-xs text-white/40 ml-auto">
          {activeTab === "VC" ? investors.length : filteredOpportunities.length} result{(activeTab === "VC" ? investors.length : filteredOpportunities.length) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Investors Grid - when VC tab selected */}
      {activeTab === "VC" ? (
        <InvestorsGrid investors={investors} />
      ) : filteredOpportunities.length === 0 ? (
        <div className="border border-white/10 p-16 text-center">
          <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <span className="bureau-label block mb-4">[NO_RESULTS]</span>
          <p className="text-white/40 mb-6">No opportunities match your filters.</p>
          <button
            onClick={clearFilters}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
            {paginatedOpportunities.map((opp, index) => {
              const type = getOpportunityType(opp);
              const days = getDaysUntilDeadline(opp.deadline);
              const isHot = days !== null && days >= 0 && days <= 30;
              const url = getOpportunityUrl(opp);
              const description = getOpportunityDescription(opp);
              const sectors = getOpportunitySectors(opp);

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!hasPrevPage}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                Prev
              </button>
              <span className="font-mono text-xs text-white/40 px-4">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-crosshair flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Investors Section */}
      {investors.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em] block mb-3">[INVESTORS]</span>
              <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                Investor Directory
              </h2>
            </div>
            <Link
              to="/investors"
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2"
            >
              View All {investorStats.total}+
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Before You Reach Out - Guidance Note */}
          <div className="border border-white/10 bg-white/[0.02] p-6 mb-8">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 mb-3">
              Before You Reach Out
            </h3>
            <p className="text-[13px] text-white/60 leading-relaxed">
              Unlike opportunities above, investors are <em>firms</em>—not applications with deadlines.
              Each has their own thesis, check size, and focus areas.{" "}
              <span className="text-white/50">Visit their websites. Read their portfolio. Check for conflicts before making contact.</span>
            </p>
          </div>

          {/* Investor Stats Row */}
          <div className="grid grid-cols-4 gap-0 border border-white/10 mb-8">
            <div className="p-5 border-r border-white/10">
              <span className="font-mono text-2xl md:text-3xl text-white font-light block mb-1">{investorStats.total}+</span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Total</span>
            </div>
            <div className="p-5 border-r border-white/10">
              <span className="font-mono text-2xl md:text-3xl text-white font-light block mb-1">{investorStats.vcs}</span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">VCs</span>
            </div>
            <div className="p-5 border-r border-white/10">
              <span className="font-mono text-2xl md:text-3xl text-white font-light block mb-1">{investorStats.angels}</span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Angels</span>
            </div>
            <div className="p-5">
              <span className="font-mono text-2xl md:text-3xl text-amber-400 font-light block mb-1">{investorStats.midwest}</span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Midwest</span>
            </div>
          </div>

          {/* Featured Investors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
            {featuredInvestors.map((investor, index) => (
              <Link
                key={investor.id || index}
                to="/investors"
                className="p-6 border-b border-r border-white/10 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {investor.is_midwest && (
                      <span className="font-mono text-[9px] text-amber-400 uppercase tracking-[0.15em] px-1.5 py-0.5 border border-amber-400/30">
                        Midwest
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.15em]">
                      {investor.investor_type === 'vc' ? 'VC' : investor.investor_type === 'angel' ? 'Angel' : 'Investor'}
                    </span>
                  </div>
                </div>
                <h3 className="font-mono text-sm font-medium uppercase tracking-[0.1em] text-white mb-2 group-hover:text-white transition-colors line-clamp-1">
                  {investor.canonical_name}
                </h3>
                <p className="text-[12px] text-white/40 line-clamp-1">
                  {investor.hq_city && investor.hq_state ? `${investor.hq_city}, ${investor.hq_state}` : 'US'}
                  {investor.check_size_min && ` · ${investor.check_size_min}`}
                </p>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <Link
              to="/investors"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
            >
              Browse full investor directory
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
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
