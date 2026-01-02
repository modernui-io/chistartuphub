import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Building2,
  Users,
  Calendar,
  BookOpen,
  Map,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { createPageUrl } from "@/utils";

/**
 * EcosystemSection - The Bureau Ecosystem Display
 * Systematic Modernism | Precision over Decoration
 * Version 2.0 - Premium refinements with animations
 *
 * Structure:
 * 1. Ecosystem Specs - Split editorial (1/2 + 1/2)
 * 2. Resource Grid - 6-card Bureau grid
 */

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
function useInView(threshold = 0.2) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

// ============================================
// SPEC CARD - Data Point Display (Enhanced)
// ============================================
function SpecCard({ index, label, value, delay = 0 }) {
  const [ref, isVisible] = useInView();

  return (
    <div 
      ref={ref}
      className={`
        p-8 lg:p-10
        ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/20 mb-4 block">
        {index}
      </span>
      <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white/80 mb-3">
        {label}
      </h4>
      <p className="font-serif text-base text-white/50 leading-relaxed">
        {value}
      </p>
    </div>
  );
}

// ============================================
// ECOSYSTEM SPECS - Split Editorial Section (Enhanced)
// ============================================
function EcosystemSpecs() {
  const [ref, isVisible] = useInView();

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
    <div className="border-b border-white/[0.12]">
      {/* 50/50 Split - Text + Image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Column - The Argument */}
        <div 
          ref={ref}
          className="bg-[#0A1220]/50 p-12 lg:p-20 border-r border-white/[0.12] flex flex-col justify-center"
        >
          <span 
            className={`
              bureau-label block mb-8
              ${isVisible ? 'animate-fade-in' : 'opacity-0'}
            `}
            style={{ animationDelay: '100ms' }}
          >
            [WHY BUILD HERE?]
          </span>
          <h3 
            className={`
              font-serif text-3xl lg:text-4xl xl:text-5xl text-white leading-[1.1] mb-8 tracking-tight
              ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
            `}
            style={{ animationDelay: '200ms' }}
          >
            World-class infrastructure
            <br />
            <span className="text-white/50">at a builder's pace.</span>
          </h3>
          <p 
            className={`
              font-serif text-lg text-white/40 leading-relaxed mb-10 max-w-lg
              ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
            `}
            style={{ animationDelay: '300ms' }}
          >
            Chicago offers deep talent pools, diverse markets, and a pragmatic
            culture that values revenue over hype. It is the most
            capital-efficient place to launch.
          </p>
          {/* Decorative Line */}
          <div 
            className={`
              w-20 h-px bg-white/20
              ${isVisible ? 'animate-fade-in' : 'opacity-0'}
            `}
            style={{ animationDelay: '400ms' }}
          />
        </div>

        {/* Right Column - Technical Image */}
        <div className="relative min-h-[450px] lg:min-h-[550px] overflow-hidden">
          {/* Background Image - Chicago Blueprint/Network */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80')`,
              filter: "grayscale(100%) contrast(1.2)",
            }}
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-[#050A14]/85 mix-blend-multiply" />

          {/* Grid/Radar Texture Overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, transparent 0%, #050A14 70%),
                linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 50px 50px, 50px 50px",
            }}
          />

          {/* Radial Scan Effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
            }}
          />

          {/* Corner Markers - Technical Feel */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l border-t border-white/15" />
          <div className="absolute top-8 right-8 w-12 h-12 border-r border-t border-white/15" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-l border-b border-white/15" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-r border-b border-white/15" />

          {/* Center Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-px h-8 bg-white/10 absolute left-1/2 -translate-x-1/2 -top-4" />
            <div className="w-px h-8 bg-white/10 absolute left-1/2 -translate-x-1/2 top-4" />
            <div className="h-px w-8 bg-white/10 absolute top-1/2 -translate-y-1/2 -left-4" />
            <div className="h-px w-8 bg-white/10 absolute top-1/2 -translate-y-1/2 left-4" />
          </div>

          {/* Coordinates Label */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-white/25">
              41.8781° N, 87.6298° W
            </span>
          </div>
        </div>
      </div>

      {/* 4-Point Data Grid - Below the split */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-white/[0.12]">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`
              ${i < 3 ? "lg:border-r border-white/[0.12]" : ""}
              ${i < 2 ? "md:border-r border-white/[0.12] lg:border-r-0" : ""}
              ${i < 2 ? "border-b border-white/[0.12] lg:border-b-0" : ""}
              ${i === 2 ? "md:border-r-0 lg:border-r border-white/[0.12]" : ""}
            `}
          >
            <SpecCard {...spec} delay={i * 100} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// RESOURCE CARD - Navigation Cell (Enhanced)
// ============================================
function ResourceCard({ index, icon: Icon, label, description, cta, href, external = false, delay = 0 }) {
  const [ref, isVisible] = useInView();
  const CardWrapper = external ? "a" : Link;
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { to: href };

  return (
    <CardWrapper
      ref={ref}
      {...linkProps}
      className={`
        group relative text-left p-8 lg:p-10
        bg-transparent hover:bg-white
        text-white hover:text-black
        transition-none duration-0
        cursor-crosshair
        border-r border-b border-white/[0.12]
        min-h-[280px] flex flex-col
        ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover Glow Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Index - Top Right */}
      <span className="absolute top-8 right-8 font-mono text-sm text-white/15 group-hover:text-black/15">
        {index}
      </span>

      {/* Icon + Label */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 flex items-center justify-center border border-white/[0.12] group-hover:border-black/20">
          {Icon && (
            <Icon
              className="w-5 h-5 text-white/40 group-hover:text-black/50"
              strokeWidth={1.5}
            />
          )}
        </div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.1em]">
          {label}
        </h3>
      </div>

      {/* Description */}
      <p className="font-serif text-base leading-relaxed text-white/45 group-hover:text-black/60 mb-auto max-w-[260px]">
        {description}
      </p>

      {/* CTA - Ghost Style */}
      <div className="flex items-center gap-3 mt-8 font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 group-hover:text-black">
        <span>{cta}</span>
        {external ? (
          <ArrowUpRight
            className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200"
            strokeWidth={1.5}
          />
        ) : (
          <ArrowRight
            className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200"
            strokeWidth={1.5}
          />
        )}
      </div>
    </CardWrapper>
  );
}

// ============================================
// RESOURCE GRID - 6-Card Bureau Grid (Enhanced)
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
    <div className="border-t border-l border-white/[0.12]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
        {resources.map((resource, i) => (
          <ResourceCard key={resource.label} {...resource} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// ECOSYSTEM SECTION - Main Export
// ============================================
export function EcosystemSection({ className = "" }) {
  const [ref, isVisible] = useInView();

  return (
    <section className={`${className}`}>
      {/* Section Header - Enhanced */}
      <div 
        ref={ref}
        className="px-8 lg:px-12 py-12 border-b border-white/[0.12]"
      >
        <span 
          className={`
            bureau-label block mb-4
            ${isVisible ? 'animate-fade-in' : 'opacity-0'}
          `}
          style={{ animationDelay: '100ms' }}
        >
          [SYSTEM: ECOSYSTEM_MAP]
        </span>
        <h2 
          className={`
            font-serif text-3xl lg:text-4xl text-white tracking-tight
            ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
          `}
          style={{ animationDelay: '200ms' }}
        >
          Everything you need to build.
        </h2>
      </div>

      {/* Ecosystem Specs - Split Editorial */}
      <EcosystemSpecs />

      {/* Resource Dashboard Header - Enhanced */}
      <div className="border-t border-white/[0.12] py-14 lg:py-16 px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left - Label */}
          <span className="bureau-label">
            [RESOURCE_INDEX]
          </span>

          {/* Center/Right - Headline */}
          <h3 className="font-serif text-3xl lg:text-4xl xl:text-5xl text-white tracking-tight">
            Your operational toolkit.
          </h3>

          {/* Right - Count */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl text-white/60">06</span>
            <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
              Resources
            </span>
          </div>
        </div>
      </div>

      {/* Resource Grid - 6 Cards */}
      <ResourceGrid />
    </section>
  );
}

export default EcosystemSection;
