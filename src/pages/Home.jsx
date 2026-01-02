import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import {
  BureauAtmosphere,
  BureauButton,
  PathwaysSection,
  EcosystemSection,
  BureauFooter,
} from "@/components/bureau";

/**
 * Home - The Bureau Landing Page
 * Systematic Modernism | Precision over Decoration
 */
export default function Home() {

  return (
    <div className="min-h-screen relative">
      <SEO
        title="The Operating System for Chicago Founders"
        description="Build faster with ChiStartup Hub. Access 90+ investors, 18+ workspaces, and curated founder playbooks. Your unified toolkit for Chicago's startup ecosystem."
        keywords="Chicago startups, venture capital, founder resources, startup funding, Chicago entrepreneurs"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ChiStartup Hub",
          "url": typeof window !== "undefined" ? window.location.origin : "",
          "description": "The Operating System for Chicago Founders.",
        }}
      />

      {/* Ghost City Background */}
      <BureauAtmosphere />

      {/* Main Content Layer */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          {/* System Status */}
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
              [SYSTEM: ONLINE]
            </span>
          </div>

          {/* Main Headline - Editorial Typography */}
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-center text-white tracking-tight leading-[0.9] mb-8">
            BUILD YOUR
            <br />
            <span className="text-white/80">VISION</span>
            <br />
            IN CHICAGO
          </h1>

          {/* Subtext - Monospace System Style */}
          <p className="font-mono text-sm md:text-base uppercase tracking-[0.2em] text-white/50 text-center mb-12 max-w-xl">
            The Operating System for Chicago Founders
          </p>

          {/* Primary CTA */}
          <Link to={createPageUrl("before-you-start")}>
            <BureauButton variant="primary" size="large" showArrow>
              INITIATE SEQUENCE
            </BureauButton>
          </Link>

          {/* Micro Stats */}
          <div className="mt-16 flex items-center gap-8 md:gap-12">
            {["90+ INVESTORS", "18+ SPACES", "22+ COMMUNITIES"].map((stat, i) => (
              <span
                key={i}
                className="font-mono text-xs tracking-wider text-white/30"
              >
                {stat}
              </span>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-px h-16 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </section>

        {/* Pathways Grid + Newsletter Terminal */}
        <div className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="pb-8">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
                [NAVIGATION: PATHWAYS]
              </h2>
              <p className="font-serif text-2xl md:text-3xl text-white/90">
                Three vectors to accelerate your trajectory.
              </p>
            </div>

            {/* PathwaysSection - Grid + Email Row */}
            <PathwaysSection />
          </div>
        </div>

        {/* Ecosystem Section - Why Chicago + Resource Grid */}
        <div className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <EcosystemSection />
          </div>
        </div>

        {/* Global Footer - System Terminal */}
        <BureauFooter />
      </div>
    </div>
  );
}
