import React, { useMemo, useState, useEffect } from "react";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import FundingOpportunitiesContent from "../components/funding/FundingOpportunitiesContent";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

export default function Funding() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: opportunities = [], isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: () => entities.FundingOpportunity.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const { data: upcomingOpportunities = [], isLoading: upcomingLoading, error: upcomingError } = useQuery({
    queryKey: ['upcoming-opportunities'],
    queryFn: () => entities.UpcomingOpportunity.list('-deadline'),
    staleTime: 1000 * 60 * 5,
  });

  // Filter out closed opportunities for accurate counts
  const activeOpportunities = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return opportunities.filter(opp => {
      if (!opp.deadline) return true;
      const deadline = new Date(opp.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now;
    });
  }, [opportunities]);

  const activeUpcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return upcomingOpportunities.filter(opp => {
      if (!opp.deadline) return true;
      const deadline = new Date(opp.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= now;
    });
  }, [upcomingOpportunities]);

  if (opportunitiesLoading || upcomingLoading) {
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
            Fetching funding data...
          </p>
        </div>
      </div>
    );
  }

  if (opportunitiesError || upcomingError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center border border-white/10 p-12">
          <span className="bureau-label block mb-4">[ERROR: CONNECTION_FAILED]</span>
          <p className="text-white/60">Unable to load funding data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="funding">
      <SEO
        title="Chicago Startup Funding & Investors"
        description="Build faster with direct access to 90+ active Chicago investors. No warm intros required—filter by stage, check size, and focus area to find your funding match."
        keywords="Chicago venture capital, angel investors, startup funding, pre-seed, seed funding, Series A"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[CAPITAL: FUNDING_OPPORTUNITIES]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Capital Resources
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Your comprehensive guide to funding opportunities in Chicago's startup ecosystem. Filter by type, stage, and focus area.
            </p>

            {/* Stats */}
            <div 
              className={`flex items-center gap-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{activeOpportunities.length + activeUpcoming.length}+</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Opportunities</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{activeOpportunities.filter(o => {
                  const days = o.deadline ? Math.ceil((new Date(o.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  return days !== null && days >= 0 && days <= 30;
                }).length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Closing Soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* Funding Content */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <FundingOpportunitiesContent
              opportunities={opportunities}
              upcomingOpportunities={upcomingOpportunities}
            />
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
