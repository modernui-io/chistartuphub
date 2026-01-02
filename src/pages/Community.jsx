import React, { useState, useEffect } from "react";
import { Users, ExternalLink, Search, Loader2, ArrowUpRight } from "lucide-react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import ShareActions from "@/components/ShareActions";
import { BureauAtmosphere, BureauButton, BureauFooter } from "@/components/bureau";

export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: communities = [], isLoading, error } = useQuery({
    queryKey: ['communities'],
    queryFn: () => entities.Community.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const filteredCommunities = communities.filter(community => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = community.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = community.description?.toLowerCase().includes(searchLower);
      if (!nameMatch && !descriptionMatch) return false;
    }
    return true;
  });

  const featuredCommunities = filteredCommunities.filter(c => c.featured);
  const regularCommunities = filteredCommunities.filter(c => !c.featured);

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
            Fetching communities...
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
          <p className="text-white/60">Unable to load communities. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="community">
      <SEO
        title="Chicago Founder Communities"
        description="Join vibrant communities of founders, developers, and innovators in Chicago. Find your tribe."
        keywords="Chicago startup community, founder networks, tech meetups, Slack communities"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[NETWORK: COMMUNITIES]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Chicago Communities
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Connect with Chicago's vibrant founder communities, meetups, and builder groups.
            </p>

            {/* Stats */}
            <div 
              className={`flex items-center gap-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{communities.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Communities</span>
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
                placeholder="SEARCH_COMMUNITIES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none uppercase tracking-[0.1em]"
              />
              <span className="font-mono text-xs text-white/30">
                {filteredCommunities.length} RESULTS
              </span>
            </div>
          </div>
        </section>

        {/* Featured Communities */}
        {featuredCommunities.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <span className="bureau-label block mb-8">[FEATURED]</span>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {featuredCommunities.map((community, index) => (
                  <div
                    key={community.id || index}
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-colors">
                        <Users className="w-4 h-4 text-white/60 group-hover:text-black transition-colors" strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em] px-2 py-1 border border-white/10">
                        Featured
                      </span>
                    </div>

                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors">
                      {community.name}
                    </h3>
                    
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow">
                      {community.description}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <a 
                        href={community.website?.startsWith('http') ? community.website : `https://${community.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1"
                      >
                        <button className="w-full font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2 cursor-crosshair">
                          <span>Visit</span>
                          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </a>
                      <ShareActions
                        resourceType="community"
                        resourceId={community.id}
                        resourceName={community.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Communities */}
        {regularCommunities.length > 0 && (
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              <span className="bureau-label block mb-8">[ALL_COMMUNITIES]</span>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
                {regularCommunities.map((community, index) => (
                  <div
                    key={community.id || index}
                    className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 hover:bg-white/[0.02] transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-mono text-xs text-white/20">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white/80 mb-3 group-hover:text-white transition-colors">
                      {community.name}
                    </h3>
                    
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-grow">
                      {community.description}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <a 
                        href={community.website?.startsWith('http') ? community.website : `https://${community.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1"
                      >
                        <button className="w-full font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 border border-white/10 text-white/40 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2 cursor-crosshair">
                          <span>Visit</span>
                          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </a>
                      <ShareActions
                        resourceType="community"
                        resourceId={community.id}
                        resourceName={community.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredCommunities.length === 0 && (
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              <div className="border border-white/10 p-16 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                <span className="bureau-label block mb-4">[NO_RESULTS]</span>
                <p className="text-white/40">No communities found matching your search.</p>
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
