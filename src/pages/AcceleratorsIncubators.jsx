import React, { useState, useEffect, useMemo } from "react";
import { Rocket, ExternalLink, Search, Filter, X, Building2, Loader2 } from "lucide-react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import SEO from "@/components/SEO";

export default function AcceleratorsIncubators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['accelerators'],
    queryFn: () => entities.Accelerator.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const filterCategories = [
    "all",
    "Tech",
    "Healthcare",
    "Food & Beverage",
    "Manufacturing",
    "Real Estate",
    "Creative Industries",
    "University-Based",
    "Energy & CleanTech"
  ];

  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      if (activeFilter !== "all" && !program.category?.includes(activeFilter)) {
        return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = program.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = program.description?.toLowerCase().includes(searchLower);
        const categoryMatch = program.category?.some(cat => cat.toLowerCase().includes(searchLower));

        if (!nameMatch && !descriptionMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [programs, activeFilter, searchQuery]);

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
  };

  const activeFilterCount = [
    activeFilter !== "all",
    searchQuery !== ""
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-screen relative" data-page="accelerators">
        <BureauAtmosphere />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Loading programs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative" data-page="accelerators">
        <BureauAtmosphere />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-white/50">Error loading programs. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="accelerators">
      <SEO
        title="Accelerators & Incubators | ChiStartup Hub"
        description="Connect with Chicago's leading accelerator and incubator programs. Find the right program to accelerate your startup's growth."
        keywords="Chicago accelerators, startup incubators, tech accelerators, 1871, mHUB, Techstars Chicago"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[SYSTEM: ACCELERATORS]</span>
            </div>

            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Accelerators & Incubators
            </h1>

            <p
              className={`text-white/50 text-lg max-w-xl mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Connect with Chicago's leading accelerator and incubator programs.
            </p>

            <div className={`${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                {programs.length} programs available
              </span>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="border border-white/10 bg-black/40 backdrop-blur-sm p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Search programs by name, category, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 font-mono text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair flex items-center justify-center gap-3"
                >
                  <Filter className="w-3 h-3" strokeWidth={1.5} />
                  Filter by Category
                  {activeFilterCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 text-[9px]">{activeFilterCount}</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="pt-4 border-t border-white/10">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-4">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filterCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveFilter(category)}
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors cursor-crosshair ${
                          activeFilter === category
                            ? 'bg-white text-black border-white'
                            : 'border-white/20 text-white/60 hover:border-white/40'
                        }`}
                      >
                        {category === "all" ? "All Categories" : category}
                      </button>
                    ))}
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="flex items-center gap-3 flex-wrap pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Active:</span>
                      {activeFilter !== "all" && (
                        <span className="font-mono text-[10px] px-3 py-1 border border-white/20 text-white/60">
                          {activeFilter}
                        </span>
                      )}
                      {searchQuery && (
                        <span className="font-mono text-[10px] px-3 py-1 border border-white/20 text-white/60">
                          Search: "{searchQuery}"
                        </span>
                      )}
                      <button
                        onClick={clearFilters}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" strokeWidth={1.5} />
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Count */}
        <section className="px-6 pb-4">
          <div className="max-w-7xl mx-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              Showing <span className="text-white">{filteredPrograms.length}</span> programs
            </p>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-7xl mx-auto">
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-24 border border-white/10 bg-black/40">
                <Building2 className="w-12 h-12 text-white/20 mx-auto mb-6" strokeWidth={1} />
                <p className="text-white/40 mb-6">No programs found matching your filters</p>
                <button
                  onClick={clearFilters}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program, index) => (
                  <div
                    key={program.id || index}
                    className={`border border-white/10 bg-black/40 backdrop-blur-sm p-6 hover:border-white/30 transition-all duration-300 flex flex-col group ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Rocket className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                        <h3 className="font-serif text-xl text-white group-hover:text-white/90 transition-colors">
                          {program.name}
                        </h3>
                      </div>
                      {program.featured && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-1 bg-white text-black">
                          Featured
                        </span>
                      )}
                    </div>

                    {program.founded && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 mb-4">
                        Founded: {program.founded}
                      </p>
                    )}

                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-grow">
                      {program.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {program.category?.map((cat, i) => (
                        <span
                          key={i}
                          className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border border-white/10 text-white/40"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={program.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair text-center flex items-center justify-center gap-2"
                      >
                        Learn More
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                      </a>
                      <ShareActions
                        resourceType="accelerator"
                        resourceId={program.id}
                        resourceName={program.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
