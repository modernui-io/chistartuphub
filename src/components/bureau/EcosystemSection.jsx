import React from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Building2,
  Users,
  Calendar,
  BookOpen,
  Map,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { createPageUrl } from "@/utils";

/**
 * EcosystemSection - The Bureau Ecosystem Display
 * Systematic Modernism | Precision over Decoration
 *
 * Structure:
 * 1. Ecosystem Specs - Split editorial (1/3 + 2/3)
 * 2. Resource Grid - 6-card Bureau grid
 */

// ============================================
// SPEC CARD - Data Point Display
// ============================================
function SpecCard({ index, label, value }) {
  return (
    <div className="p-6 lg:p-8">
      <span className="font-mono text-xs text-white/30 mb-3 block">{index}</span>
      <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-white mb-2">
        {label}
      </h4>
      <p className="font-serif text-base text-white/60 leading-relaxed">
        {value}
      </p>
    </div>
  );
}

// ============================================
// ECOSYSTEM SPECS - Split Editorial Section
// ============================================
function EcosystemSpecs() {
  const specs = [
    {
      index: "01",
      label: "INFRASTRUCTURE",
      value: "Access to premier co-working hubs and innovation centers.",
    },
    {
      index: "02",
      label: "TALENT DENSITY",
      value: "Home to 2 top-10 global universities and deep tech talent.",
    },
    {
      index: "03",
      label: "MARKET ACCESS",
      value: "Most diverse economy in the US. Real customers, real problems.",
    },
    {
      index: "04",
      label: "CAPITAL EFFICIENCY",
      value: "Extend your runway 2x vs coastal cities.",
    },
  ];

  return (
    <div className="border-b border-white/15">
      {/* 50/50 Split - Text + Image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Column - The Argument */}
        <div className="bg-[#0A1220] p-10 lg:p-16 border-r border-white/15 flex flex-col justify-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-6 block">
            [WHY BUILD HERE?]
          </span>
          <h3 className="font-serif text-3xl lg:text-4xl text-white leading-tight mb-6">
            World-class infrastructure at a builder's pace.
          </h3>
          <p className="font-serif text-lg text-white/50 leading-relaxed mb-8">
            Chicago offers deep talent pools, diverse markets, and a pragmatic
            culture that values revenue over hype. It is the most
            capital-efficient place to launch.
          </p>
          {/* Decorative Line */}
          <div className="w-16 h-px bg-white/20" />
        </div>

        {/* Right Column - Technical Image */}
        <div className="relative min-h-[400px] lg:min-h-[500px] overflow-hidden">
          {/* Background Image - Chicago Blueprint/Network */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80')`,
              filter: "grayscale(100%) contrast(1.2)",
            }}
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-[#050A14]/80 mix-blend-multiply" />

          {/* Grid/Radar Texture Overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, transparent 0%, #050A14 70%),
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 40px 40px, 40px 40px",
            }}
          />

          {/* Radial Scan Effect */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }}
          />

          {/* Corner Markers - Technical Feel */}
          <div className="absolute top-6 left-6 w-8 h-8 border-l border-t border-white/20" />
          <div className="absolute top-6 right-6 w-8 h-8 border-r border-t border-white/20" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-l border-b border-white/20" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-r border-b border-white/20" />

          {/* Coordinates Label */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className="font-mono text-xs tracking-widest text-white/30">
              41.8781° N, 87.6298° W
            </span>
          </div>
        </div>
      </div>

      {/* 4-Point Data Grid - Below the split */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-white/15">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`
              ${i < 3 ? "lg:border-r border-white/15" : ""}
              ${i < 2 ? "md:border-r border-white/15 lg:border-r-0" : ""}
              ${i < 2 ? "border-b border-white/15 lg:border-b-0" : ""}
              ${i === 2 ? "md:border-r-0 lg:border-r border-white/15" : ""}
            `}
          >
            <SpecCard {...spec} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// RESOURCE CARD - Navigation Cell
// ============================================
function ResourceCard({ index, icon: Icon, label, description, cta, href, external = false }) {
  const CardWrapper = external ? "a" : Link;
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { to: href };

  return (
    <CardWrapper
      {...linkProps}
      className={`
        group relative text-left p-8 lg:p-10
        bg-transparent hover:bg-white
        text-white hover:text-black
        transition-none duration-0
        cursor-crosshair
        border-r border-b border-white/15
        min-h-[240px] flex flex-col
      `}
    >
      {/* Index - Top Right */}
      <span className="absolute top-6 right-6 font-mono text-sm text-white/20 group-hover:text-black/20">
        {index}
      </span>

      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <Icon
            className="w-5 h-5 text-white/50 group-hover:text-black/50"
            strokeWidth={1.5}
          />
        )}
        <h3 className="font-mono text-base font-bold uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {/* Description */}
      <p className="font-serif text-base leading-relaxed text-white/50 group-hover:text-black/60 mb-auto">
        {description}
      </p>

      {/* CTA - Ghost Style */}
      <div className="flex items-center gap-2 mt-6 font-mono text-xs uppercase tracking-widest text-white/40 group-hover:text-black">
        <span>{cta}</span>
        <ArrowRight
          className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-150"
          strokeWidth={2}
        />
      </div>
    </CardWrapper>
  );
}

// ============================================
// RESOURCE GRID - 6-Card Bureau Grid
// ============================================
function ResourceGrid() {
  const resources = [
    {
      index: "01",
      icon: DollarSign,
      label: "CAPITAL",
      description: "Access 90+ active investors. Filter by stage and check size.",
      cta: "FIND FUNDING",
      href: createPageUrl("Funding"),
    },
    {
      index: "02",
      icon: Building2,
      label: "WORKSPACES",
      description: "Find your HQ. 18+ co-working spaces and innovation labs.",
      cta: "VIEW SPACES",
      href: createPageUrl("Workspaces"),
    },
    {
      index: "03",
      icon: Users,
      label: "COMMUNITY",
      description: "Don't build alone. Connect with 22+ founder communities.",
      cta: "JOIN GROUPS",
      href: createPageUrl("Community"),
    },
    {
      index: "04",
      icon: Calendar,
      label: "HUBS & EVENTS",
      description: "Pitch nights, demo days, and workshops across the city.",
      cta: "SEE EVENTS",
      href: createPageUrl("Events"),
    },
    {
      index: "05",
      icon: BookOpen,
      label: "STARTUP TOOLKIT",
      description: "Operational guides, legal docs, and local resources.",
      cta: "GET GUIDES",
      href: createPageUrl("Resources"),
    },
    {
      index: "06",
      icon: Map,
      label: "DIRECTORY",
      description: "Browse the full list of 250+ Chicago startups.",
      cta: "EXPLORE",
      href: "https://airtable.com/appfgBVkCSJj3MA6Y/shrnrUGzMVQLvpd1S/tblc2AYt94oP5CwVr?viewControls=on",
      external: true,
    },
  ];

  return (
    <div className="border-t border-l border-white/15">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
        {resources.map((resource) => (
          <ResourceCard key={resource.label} {...resource} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// ECOSYSTEM SECTION - Main Export
// ============================================
export function EcosystemSection({ className = "" }) {
  return (
    <section className={`${className}`}>
      {/* Section Header */}
      <div className="px-8 lg:px-12 py-8 border-b border-white/15">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-2 block">
          [SYSTEM: ECOSYSTEM_MAP]
        </span>
        <h2 className="font-serif text-2xl lg:text-3xl text-white">
          Everything you need to build.
        </h2>
      </div>

      {/* Ecosystem Specs - Split Editorial */}
      <EcosystemSpecs />

      {/* Resource Dashboard Header */}
      <div className="border-t border-white/15 py-10 lg:py-12 px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left - Label */}
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
            [RESOURCE_INDEX]
          </span>

          {/* Center/Right - Headline */}
          <h3 className="font-serif text-3xl lg:text-4xl text-white">
            Everything you need to build.
          </h3>

          {/* Right - Scroll Indicator */}
          <div className="flex items-center gap-2 text-white/30">
            <span className="font-mono text-xs uppercase tracking-wider">
              [SCROLL_FOR_DATA]
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Resource Grid - 6 Cards */}
      <ResourceGrid />
    </section>
  );
}

export default EcosystemSection;
