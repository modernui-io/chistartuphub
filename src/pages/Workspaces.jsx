import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { MapPin, Building2, Search, Filter, X, Map as MapIcon, List, ArrowUpRight } from "lucide-react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

// Lazy-load the map component so leaflet + react-leaflet are only fetched when the map view is shown
const WorkspacesMap = lazy(() => import("@/components/WorkspacesMap"));

const MapLoadingFallback = () => (
  <div className="w-full h-64 bg-gray-800 animate-pulse rounded-lg" />
);

export default function Workspaces() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => entities.Workspace.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const categories = [
    { id: "all", label: "All" },
    { id: "tech", label: "Tech" },
    { id: "diverse", label: "Diverse Founders" },
    { id: "corporate", label: "Corporate" },
    { id: "creative", label: "Creative" },
    { id: "freelance", label: "Freelance" }
  ];

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(workspace => {
      if (activeCategory !== "all") {
        const workspaceType = workspace.workspace_type || '';
        const amenities = workspace.amenities || [];
        const matchesCategory = workspaceType.toLowerCase().includes(activeCategory.toLowerCase()) ||
          amenities.some(a => a?.toLowerCase().includes(activeCategory.toLowerCase()));
        if (!matchesCategory) return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = (workspace.name || '').toLowerCase().includes(searchLower);
        const addressMatch = (workspace.address || '').toLowerCase().includes(searchLower);
        const descriptionMatch = (workspace.description || '').toLowerCase().includes(searchLower);
        const neighborhoodMatch = (workspace.neighborhood || '').toLowerCase().includes(searchLower);
        const amenitiesMatch = (workspace.amenities || []).some(item => item?.toLowerCase().includes(searchLower));
        if (!nameMatch && !addressMatch && !descriptionMatch && !neighborhoodMatch && !amenitiesMatch) return false;
      }

      return true;
    });
  }, [workspaces, activeCategory, searchQuery]);

  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  const chicagoCenter = [41.8781, -87.6298];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center">
          <div className="font-mono text-4xl text-white mb-4 animate-pulse">
            <span className="inline-block">LOADING</span>
          </div>
          <div className="w-48 h-[2px] bg-white/20 mx-auto">
            <div className="h-full bg-white/60 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="font-mono text-xs text-white/40 mt-4 uppercase tracking-[0.2em]">
            Fetching workspaces...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center border border-white/10 p-12">
          <span className="bureau-label block mb-4">[ERROR: CONNECTION_FAILED]</span>
          <p className="text-white/60">Unable to load workspaces. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="workspaces">
      <SEO
        title="Co-Working Spaces in Chicago"
        description="Find the perfect office or desk at Chicago's top co-working spaces and innovation hubs."
        keywords="coworking Chicago, office space, startup hubs, 1871, mHUB, shared office"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[DIRECTORY: WORKSPACES]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Chicago Workspaces
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Find the right co-working space, innovation hub, or office for your business.
            </p>

            {/* Stats */}
            <div 
              className={`flex items-center gap-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{workspaces.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Spaces</span>
              </div>
            </div>
          </div>
        </section>

        {/* View Mode Toggle */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-0 border border-white/10 w-fit">
              <button
                onClick={() => setViewMode("list")}
                className={`font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 flex items-center gap-2 transition-colors cursor-crosshair ${
                  viewMode === "list" 
                    ? "bg-white text-black" 
                    : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <List className="w-3 h-3" strokeWidth={1.5} />
                List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 flex items-center gap-2 border-l border-white/10 transition-colors cursor-crosshair ${
                  viewMode === "map" 
                    ? "bg-white text-black" 
                    : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <MapIcon className="w-3 h-3" strokeWidth={1.5} />
                Map
              </button>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="border border-white/10">
              {/* Search Row */}
              <div className="p-4 flex items-center gap-4 border-b border-white/10">
                <Search className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="SEARCH_WORKSPACES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none uppercase tracking-[0.1em]"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors flex items-center gap-2 cursor-crosshair"
                >
                  <Filter className="w-3 h-3" strokeWidth={1.5} />
                  Filters
                </button>
                <span className="font-mono text-xs text-white/30">
                  {filteredWorkspaces.length} RESULTS
                </span>
              </div>

              {/* Filter Row */}
              {showFilters && (
                <div className="p-4 flex flex-wrap items-center gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors cursor-crosshair ${
                        activeCategory === category.id
                          ? 'bg-white text-black border-white'
                          : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                  {(activeCategory !== "all" || searchQuery) && (
                    <button
                      onClick={clearFilters}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 text-white/30 hover:text-white transition-colors flex items-center gap-2 cursor-crosshair"
                    >
                      <X className="w-3 h-3" strokeWidth={1.5} />
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Map View */}
        {viewMode === "map" && filteredWorkspaces.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <div className="border border-white/10 p-4">
                <Suspense fallback={<MapLoadingFallback />}>
                  <WorkspacesMap workspaces={filteredWorkspaces} center={chicagoCenter} />
                </Suspense>
              </div>
            </div>
          </section>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              {filteredWorkspaces.length === 0 ? (
                <div className="border border-white/10 p-16 text-center">
                  <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                  <span className="bureau-label block mb-4">[NO_RESULTS]</span>
                  <p className="text-white/40 mb-6">No workspaces found matching your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                  {filteredWorkspaces.map((workspace, index) => (
                    <div
                      key={workspace.id || index}
                      className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-mono text-xs text-white/20">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {workspace.featured && (
                          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em] px-2 py-1 border border-white/10">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white/80 mb-2 group-hover:text-white transition-colors">
                        {workspace.name}
                      </h3>

                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <p className="text-white/40 text-xs">{workspace.address}</p>
                      </div>
                      
                      <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow">
                        {workspace.description}
                      </p>

                      {/* Amenities */}
                      {workspace.amenities && workspace.amenities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {workspace.amenities.slice(0, 3).map((item, i) => (
                              <span key={i} className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] px-2 py-1 border border-white/5">
                                {item}
                              </span>
                            ))}
                            {workspace.amenities.length > 3 && (
                              <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em] px-2 py-1">
                                +{workspace.amenities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-auto">
                        {workspace.website && (
                          <a 
                            href={workspace.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex-1"
                          >
                            <button className="w-full font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/10 text-white/40 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2 cursor-crosshair">
                              <span>Visit</span>
                              <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          </a>
                        )}
                        <ShareActions
                          resourceType="workspace"
                          resourceId={workspace.id}
                          resourceName={workspace.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
