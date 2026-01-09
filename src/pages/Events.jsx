import { useState, useEffect, useMemo } from "react";
import { Calendar, Search, ArrowUpRight } from "lucide-react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: eventHubs = [], isLoading, error } = useQuery({
    queryKey: ['event-hubs'],
    queryFn: () => entities.EventHub.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const filteredHubs = useMemo(() => {
    return eventHubs.filter(hub => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = hub.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = hub.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descriptionMatch) return false;
      }
      return true;
    });
  }, [eventHubs, searchQuery]);

  const featuredHubs = useMemo(() => filteredHubs.filter(hub => hub.featured), [filteredHubs]);
  const regularHubs = useMemo(() => filteredHubs.filter(hub => !hub.featured), [filteredHubs]);

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
            Fetching innovation hubs...
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
          <p className="text-white/60">Unable to load innovation hubs. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="events">
      <SEO
        title="Events at Innovation Hubs | ChiStartup Hub"
        description="Discover events, workshops, and networking opportunities at Chicago's leading innovation hubs."
        keywords="Chicago tech events, startup meetups, networking, workshops, innovation hubs, Lu.ma"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[EVENTS: INNOVATION_HUBS]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Events at Innovation Hubs
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Discover events, workshops, and networking opportunities at Chicago's leading innovation hubs. Each hub links directly to their event calendar.
            </p>

            {/* Stats */}
            <div 
              className={`flex items-center gap-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{eventHubs.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Innovation Hubs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="border border-white/10 p-4 flex items-center gap-4">
              <Search className="w-4 h-4 text-white/30" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="SEARCH_HUBS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none uppercase tracking-[0.1em]"
              />
              <span className="font-mono text-xs text-white/30">
                {filteredHubs.length} RESULTS
              </span>
            </div>
          </div>
        </section>

        {/* Featured Hubs */}
        {featuredHubs.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <span className="bureau-label block mb-8">[FEATURED_HUBS]</span>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {featuredHubs.map((hub, index) => (
                  <div
                    key={hub.id || index}
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-colors">
                        <Calendar className="w-4 h-4 text-white/60 group-hover:text-black transition-colors" strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em] px-2 py-1 border border-white/10">
                        Featured
                      </span>
                    </div>

                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors">
                      {hub.name}
                    </h3>
                    
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow">
                      {hub.description}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <a 
                        href={hub.registration_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1"
                      >
                        <button className="w-full font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2 cursor-crosshair">
                          <span>View Events</span>
                          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </a>
                      <ShareActions
                        resourceType="event"
                        resourceId={hub.id}
                        resourceName={hub.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Hubs */}
        {regularHubs.length > 0 && (
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              <span className="bureau-label block mb-8">[ALL_HUBS]</span>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {regularHubs.map((hub, index) => (
                  <div
                    key={hub.id || index}
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-mono text-xs text-white/20">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white/80 mb-3 group-hover:text-white transition-colors">
                      {hub.name}
                    </h3>
                    
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow">
                      {hub.description}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <a 
                        href={hub.registration_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1"
                      >
                        <button className="w-full font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/10 text-white/40 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2 cursor-crosshair">
                          <span>View Events</span>
                          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </a>
                      <ShareActions
                        resourceType="event"
                        resourceId={hub.id}
                        resourceName={hub.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredHubs.length === 0 && (
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              <div className="border border-white/10 p-16 text-center">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                <span className="bureau-label block mb-4">[NO_RESULTS]</span>
                <p className="text-white/40 mb-6">
                  {searchQuery ? 'No hubs match your search.' : 'No innovation hubs available yet.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
