import { useState, useMemo } from "react";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import InvestorCard from "./InvestorCard";

const ITEMS_PER_PAGE = 12;

const INVESTOR_TYPES = [
  { value: "all", label: "All Types" },
  { value: "vc", label: "Venture Capital" },
  { value: "angel", label: "Angel" },
  { value: "accelerator", label: "Accelerator" },
];

const STAGE_FILTERS = [
  { value: "all", label: "All Stages" },
  { value: "early", label: "Early Stage" },
  { value: "multi", label: "Multi-Stage" },
  { value: "growth", label: "Growth" },
  { value: "late", label: "Late Stage" },
];

const SECTORS = [
  "Enterprise", "FinTech", "HealthTech", "Consumer", "DeepTech",
  "CleanTech", "EdTech", "FoodTech", "Logistics", "PropTech"
];

const QUICK_TABS = [
  { id: "all", label: "All" },
  { id: "vc", label: "VCs" },
  { id: "angel", label: "Angels" },
  { id: "midwest", label: "Midwest" },
];

export default function InvestorsContent({ investors = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  // Filter investors
  const filteredInvestors = useMemo(() => {
    return investors.filter((inv) => {
      if (!inv) return false;

      // Quick tab filter
      if (activeTab === "midwest" && !inv.is_midwest) return false;
      if (activeTab === "vc" && inv.investor_type !== "vc") return false;
      if (activeTab === "angel" && inv.investor_type !== "angel") return false;

      // Type filter
      if (typeFilter !== "all" && inv.investor_type !== typeFilter) return false;

      // Stage filter
      if (stageFilter !== "all" && inv.stage_focus !== stageFilter) return false;

      // Sector filter
      if (sectorFilter !== "all") {
        const sectors = inv.sectors || [];
        if (!sectors.some(s => s.toLowerCase() === sectorFilter.toLowerCase())) {
          return false;
        }
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = inv.canonical_name?.toLowerCase().includes(q);
        const locationMatch = `${inv.hq_city} ${inv.hq_state}`.toLowerCase().includes(q);
        const sectorMatch = (inv.sectors || []).some(s => s.toLowerCase().includes(q));
        if (!nameMatch && !locationMatch && !sectorMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Midwest first, then by MVIP score
      if (a.is_midwest !== b.is_midwest) return b.is_midwest ? 1 : -1;
      return (b.mvip_score || 0) - (a.mvip_score || 0);
    });
  }, [investors, activeTab, typeFilter, stageFilter, sectorFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE);
  const paginatedInvestors = filteredInvestors.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  // Stats - single pass for efficiency
  const stats = useMemo(() => {
    let vcs = 0, angels = 0, midwest = 0;
    for (const inv of investors) {
      if (inv.investor_type === "vc") vcs++;
      else if (inv.investor_type === "angel") angels++;
      if (inv.is_midwest) midwest++;
    }
    return { total: investors.length, vcs, angels, midwest };
  }, [investors]);

  const clearFilters = () => {
    setActiveTab("all");
    setTypeFilter("all");
    setStageFilter("all");
    setSectorFilter("all");
    setSearchQuery("");
    setPage(0);
  };

  const hasActiveFilters = typeFilter !== "all" || stageFilter !== "all" || sectorFilter !== "all" || searchQuery;

  return (
    <div>
      {/* Stats Row */}
      <div className="flex items-center gap-8 mb-8">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl text-white">{stats.total}</span>
          <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Investors</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl text-white">{stats.vcs}</span>
          <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">VCs</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl text-amber-400">{stats.midwest}</span>
          <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Midwest</span>
        </div>
      </div>

      {/* Quick Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(0); }}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] border transition-all ${
              activeTab === tab.id
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white hover:border-white/15"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search investors, locations, sectors..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-white/40 font-mono text-sm focus:outline-none focus:border-white/20"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 border font-mono text-xs uppercase tracking-[0.15em] transition-all ${
            showFilters || hasActiveFilters
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white"
          }`}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-white/[0.02] border border-white/[0.08]">
          {/* Type Filter */}
          <div>
            <label className="block font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
              Investor Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-white/20"
            >
              {INVESTOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
              Stage Focus
            </label>
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-white/20"
            >
              {STAGE_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
              Sector Focus
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => { setSectorFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-white/20"
            >
              <option value="all">All Sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1.5 text-white/50 hover:text-white font-mono text-xs transition-colors"
              >
                <X size={12} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs text-white/40">
          {filteredInvestors.length} investor{filteredInvestors.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Grid */}
      {paginatedInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {paginatedInvestors.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-white/[0.06]">
          <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">
            [NO_RESULTS]
          </span>
          <p className="text-white/50 mt-2">
            No investors match your filters. Try adjusting your search.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-white/[0.05] border border-white/[0.1] text-white/70 hover:text-white font-mono text-xs uppercase tracking-[0.1em] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] text-white/50 hover:text-white hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-[0.1em] transition-all"
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          <span className="font-mono text-xs text-white/40">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] text-white/50 hover:text-white hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-[0.1em] transition-all"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
