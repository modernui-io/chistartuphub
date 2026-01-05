import React from "react";
import { Users, ArrowUpRight } from "lucide-react";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import SEO from "@/components/SEO";

export default function CommunityResources() {
  const communities = [
    {
      name: "1871",
      description: "Chicago's premier tech and entrepreneurship center",
      link: "https://1871.com"
    },
    {
      name: "mHUB",
      description: "The nation's leading manufacturing and hardtech innovation center",
      link: "https://www.mhubchicago.com"
    },
    {
      name: "MATTER",
      description: "The premier healthcare technology incubator",
      link: "https://matter.health"
    },
    {
      name: "Chicago Innovation",
      description: "Celebrating, educating and connecting innovators",
      link: "https://www.chicagoinnovation.com"
    },
    {
      name: "The Hatchery",
      description: "A non-profit food and beverage incubator helping local entrepreneurs build & grow successful businesses",
      link: "https://thehatcherychicago.org"
    },
    {
      name: "2112 Chicago",
      description: "Supporting entrepreneurship in creative industries through training, mentorship, and networking",
      link: "https://2112inc.com"
    }
  ];

  return (
    <div className="min-h-screen relative" data-page="community-resources">
      <SEO
        title="Community Resources | ChiStartup Hub"
        description="Connect with Chicago's leading innovation communities and entrepreneurship hubs."
        keywords="Chicago innovation, startup communities, tech hubs, 1871, mHUB, MATTER"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">
              [SYSTEM: COMMUNITY_RESOURCES]
            </span>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6">
              Community Resources
            </h1>

            <p className="text-white/50 text-lg max-w-xl mb-4">
              Connect with Chicago's leading innovation communities and entrepreneurship hubs.
            </p>

            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              {communities.length} communities available
            </span>
          </div>
        </section>

        {/* Communities Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community, index) => (
                <a
                  key={index}
                  href={community.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/10 p-6 hover:border-white/30 transition-all flex flex-col group cursor-crosshair"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" strokeWidth={1.5} />
                  </div>

                  <h3 className="font-serif text-xl text-white mb-3 group-hover:text-white/80 transition-colors">
                    {community.name}
                  </h3>

                  <p className="text-white/50 text-sm leading-relaxed flex-grow">
                    {community.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 group-hover:text-white transition-colors">
                      Visit Website
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
