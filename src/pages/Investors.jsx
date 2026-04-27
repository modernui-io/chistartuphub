import { useState, useEffect } from "react";
import { listBrowseInvestors } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { InvestorPageContent } from "@/components/investors-v2";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

export default function Investors() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: investors = [], isLoading, error } = useQuery({
    queryKey: ["investors", "browse"],
    queryFn: listBrowseInvestors,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BureauAtmosphere />
        <div className="relative z-10 text-center">
          <div className="font-mono text-4xl text-white mb-4 animate-pulse">
            <span className="inline-block">LOADING</span>
          </div>
          <div className="w-48 h-[2px] bg-white/20 mx-auto">
            <div className="h-full bg-white/60 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
          <p className="font-mono text-xs text-white/40 mt-4 uppercase tracking-[0.2em]">
            Fetching investor data...
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
          <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em] block mb-4">
            [ERROR: CONNECTION_FAILED]
          </span>
          <p className="text-white/60">Unable to load investor data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" data-page="investors">
      <SEO
        title="Investor Directory | ChiStartup Hub"
        description="Browse 2,000+ venture capital firms and angel investors. Filter by stage, sector, and location to find the right fit for your startup."
        keywords="startup investors, venture capital, angel investors, Chicago VCs, seed funding, Series A investors"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* System Label */}
            <div className={`${isLoaded ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em] block mb-8">
                [CHISTARTUPHUB: INVESTORS]
              </span>
            </div>

            {/* Headline - Noir Zine Style */}
            <h1
              className={`font-editorial text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[0.95] mb-6 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "200ms" }}
            >
              <span className="italic">Find Your Investors</span>
            </h1>

            <p
              className={`font-editorial italic text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "300ms" }}
            >
              "Capital for the bold ones building in the shadows of the Midwest."
            </p>
          </div>
        </section>

        {/* Investors Content - New Noir Zine Design */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <InvestorPageContent investors={investors} />
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
