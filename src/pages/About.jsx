import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Target,
  Users,
  Heart,
  Shield,
  CheckCircle2,
  Mail,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauButton, BureauFooter } from "@/components/bureau";

export default function About() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      title: "Capital",
      description: "Find active investors, funding programs, and non-dilutive resources—organized so you can build a realistic outreach plan."
    },
    {
      title: "Workspaces",
      description: "Explore coworking spaces, innovation hubs, and places built for founders—so you can stop bouncing between tabs."
    },
    {
      title: "Hubs & Events",
      description: "Track the places and gatherings that move the ecosystem forward: demo days, community events, pitch nights."
    },
    {
      title: "Community",
      description: "Find communities by stage, identity, industry, and focus, so support isn't accidental."
    },
    {
      title: "Founder Playbooks",
      description: "Tactical guidance for the messy middle: fundraising, GTM, product, hiring, and operations."
    },
    {
      title: "The Blueprints",
      description: "A walk through of how other entrepreneurs have succeeded in Chicago."
    }
  ];

  const forWhom = [
    "First-time founders trying to find a starting point",
    "Repeat founders looking for signal over noise",
    "Operators building momentum inside early-stage teams",
    "Builders relocating to Chicago and learning the terrain",
    "Community leaders who want resources to be easier to access"
  ];

  const curationCriteria = [
    { title: "Recency", description: "Active within a recent window (not dead lists)" },
    { title: "Specificity", description: "Clear criteria, clear focus, clear path to engage" },
    { title: "Accessibility", description: "Founders can actually take action from the information" },
    { title: "Credibility", description: "Reputable sources, transparent organizations, real proof of work" },
    { title: "Clarity", description: "No vague \"reach out for details\" when details should be public" }
  ];

  const values = [
    {
      icon: Target,
      title: "Access builds equity",
      description: "Founders shouldn't need insider knowledge to find basic resources."
    },
    {
      icon: Shield,
      title: "Clarity beats complexity",
      description: "The best ecosystems reduce friction. We design for action."
    },
    {
      icon: Heart,
      title: "Chicago deserves a better map",
      description: "The ecosystem is strong but information is scattered. We're fixing that."
    },
    {
      icon: Users,
      title: "Build with the community",
      description: "This hub improves with participation, feedback, and shared ownership."
    }
  ];

  return (
    <div className="min-h-screen relative" data-page="about">
      <SEO
        title="About ChiStartup Hub"
        description="ChiStartup Hub is a living map of Chicago's startup ecosystem, built to help founders move faster with less guesswork."
        keywords="about ChiStartup Hub, Chicago startup ecosystem, founder resources, Billy Ndizeye"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[ABOUT: CHISTARTUPHUB]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Chicago is full of opportunity.
              <br />
              <span className="text-white/50">The hard part is finding it.</span>
            </h1>

            <p 
              className={`font-mono text-sm text-white/50 uppercase tracking-[0.15em] ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Your Launchpad for Chicago
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <p className="font-serif text-xl md:text-2xl text-white/90 leading-relaxed mb-6">
                ChiStartupHub is a living map of Chicago's startup ecosystem, built to help founders move faster with less guesswork.
              </p>
              <p className="text-white/60 text-lg leading-relaxed">
                If you're building in Chicago, you shouldn't need perfect connections to discover investors, workspaces, community hubs, and playbooks that actually help. We organize what's already here, make it searchable, and keep it practical.
              </p>
            </div>
          </div>
        </section>

        {/* What We Give You */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <span className="bureau-label block mb-4">[SYSTEM: FEATURES]</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              What ChiStartupHub gives you
            </h2>
            <p className="text-white/50 mb-12 max-w-2xl">
              We've structured the site around the real questions founders ask when they're trying to get momentum.
            </p>

            {/* 2x3 Grid with collapsed borders */}
            <div className="grid md:grid-cols-2 border border-white/10">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 md:p-8 border-b border-r border-white/10 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 md:odd:border-r md:even:border-r-0 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-white/30">0{index + 1}</span>
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-3 group-hover:text-white transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <span className="bureau-label block mb-4">[TARGET: AUDIENCE]</span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                Who this is for
              </h2>
              <p className="text-white/60 text-lg mb-8">
                ChiStartupHub is built for people doing the work:
              </p>
              <ul className="space-y-4 mb-8">
                {forWhom.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="font-mono text-xs text-white/30 mt-1">—</span>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="font-serif text-xl text-white">
                If you're serious about building, this is for you.
              </p>
            </div>
          </div>
        </section>

        {/* Curation Standards */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <span className="bureau-label block mb-4">[PROTOCOL: CURATION]</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              How we curate
            </h2>
            <p className="text-white/50 mb-12">
              We care about usefulness over hype. Resources are prioritized based on:
            </p>

            <div className="space-y-0 border border-white/10">
              {curationCriteria.map((criteria, index) => (
                <div
                  key={index}
                  className="p-6 border-b border-white/10 last:border-b-0 flex items-start gap-6 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-mono text-xs text-white/30">0{index + 1}</span>
                  <div>
                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-2">
                      {criteria.title}
                    </h3>
                    <p className="text-white/50 text-sm">{criteria.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-white/40 text-sm mt-6 font-mono">
              Updated on a weekly basis.
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <span className="bureau-label block mb-4">[CORE: VALUES]</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-12">
              Our values
            </h2>

            <div className="grid md:grid-cols-2 gap-0 border border-white/10">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="p-8 border-b border-r border-white/10 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 md:odd:border-r md:even:border-r-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <Icon className="w-6 h-6 text-white/40 mb-4" strokeWidth={1.5} />
                    <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-3">
                      {value.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who's Behind This */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <span className="bureau-label block mb-4">[FOUNDER: PROFILE]</span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                Who's behind ChiStartup Hub
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                ChiStartupHub was built by <span className="text-white font-medium">Billy Ndizeye</span>.
              </p>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                I've spent years working inside Chicago's startup and innovation ecosystem, supporting founders, building programs, hosting events, and learning where people get stuck. ChiStartupHub is the resource I wish existed.
              </p>
              <p className="font-serif text-xl text-white mb-6">
                This project is simple: make it easier for others to build here in Chicago.
              </p>
              <p className="text-white/40 text-sm italic">
                If you're a partner org and want your resources accurately represented, I'd love to connect.
              </p>
            </div>
          </div>
        </section>

        {/* Help Improve */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <span className="bureau-label block mb-4">[ACTION: CONTRIBUTE]</span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
                Help improve the map
              </h2>
              <p className="text-white/60 text-lg mb-8">
                ChiStartupHub is a living project. If something is missing, outdated, or wrong—we want to fix it.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Link to={createPageUrl("Resources") + "#submit"}>
                  <BureauButton variant="primary" showArrow>
                    SUBMIT A RESOURCE
                  </BureauButton>
                </Link>
                <a href="mailto:hello@chistartuphub.com?subject=Report%20an%20Issue">
                  <BureauButton variant="secondary">
                    REPORT AN ISSUE
                  </BureauButton>
                </a>
                <a href="mailto:hello@chistartuphub.com?subject=Partnership%20Inquiry">
                  <BureauButton variant="secondary">
                    PARTNER WITH US
                  </BureauButton>
                </a>
              </div>
              <p className="text-white/40 text-sm">
                If you're building something valuable for founders, we want it included.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <span className="bureau-label block mb-4">[CONTACT: INFO]</span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                Contact
              </h2>
              <p className="text-white/60 text-lg mb-6">
                Questions, corrections, partnerships, or press:
              </p>
              <a 
                href="mailto:hello@chistartuphub.com" 
                className="inline-flex items-center gap-3 font-mono text-sm uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors group"
              >
                <Mail className="w-4 h-4" strokeWidth={1.5} />
                <span>hello@chistartuphub.com</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </section>

        {/* Independence Note */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                A quick note on independence
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                ChiStartupHub is built to be useful first. If we ever use affiliate links, sponsorships, or partnerships, we'll disclose them clearly.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
