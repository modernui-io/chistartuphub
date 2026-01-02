import React, { useState, useEffect, useRef } from "react";
import { DollarSign, Building2, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * PathwaysSection - The Bureau Navigation Grid
 * Systematic Modernism | Three Vectors to Accelerate
 * Version 2.0 - Premium refinements with animations
 *
 * Structure:
 * - 3-column grid with collapsed borders (gap-0)
 * - Custom pathway cards with meta-data positioning
 * - Terminal-style email subscription row
 */

// ============================================
// PATHWAY CARD - Custom Bureau Cell (Enhanced)
// ============================================
function PathwayCard({
  index,
  meta,
  icon: Icon,
  label,
  body,
  action,
  href,
  isLast = false,
  delay = 0,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={cardRef}
      to={href}
      className={`
        group relative text-left p-8 lg:p-12
        bg-transparent hover:bg-white
        text-white hover:text-black
        transition-none duration-0
        cursor-crosshair
        border-r border-white/[0.12]
        ${isLast ? "border-r-0" : ""}
        min-h-[320px] lg:min-h-[360px] flex flex-col
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

      {/* Top Row: Meta (Left) + Index (Right) */}
      <div className="flex items-start justify-between mb-10">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 group-hover:text-black/40">
          {meta}
        </span>
        <span className="font-mono text-base text-white/20 group-hover:text-black/20">
          {index}
        </span>
      </div>

      {/* Label with Icon */}
      <div className="flex items-center gap-4 mb-5">
        {Icon && (
          <div className="w-10 h-10 flex items-center justify-center border border-white/[0.12] group-hover:border-black/20">
            <Icon
              className="w-5 h-5 text-white/50 group-hover:text-black/60"
              strokeWidth={1.5}
            />
          </div>
        )}
        <h3 className="font-mono text-lg font-semibold uppercase tracking-[0.1em]">
          {label}
        </h3>
      </div>

      {/* Body - Serif for readability */}
      <p className="font-serif text-lg leading-relaxed text-white/50 group-hover:text-black/60 mb-auto max-w-[280px]">
        {body}
      </p>

      {/* Action - Bottom Left */}
      <div className="flex items-center gap-3 mt-10 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 group-hover:text-black">
        <span>{action}</span>
        <ArrowRight
          className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200"
          strokeWidth={1.5}
        />
      </div>
    </Link>
  );
}

// ============================================
// TERMINAL EMAIL INPUT - Newsletter Row (Enhanced)
// ============================================
function TerminalEmailRow() {
  const [email, setEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Open Tally form with email pre-filled
      window.open(`https://tally.so/r/ob6dJP?email=${encodeURIComponent(email)}`, "_blank");
      setEmail("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        border-b border-white/[0.12] px-8 lg:px-12 py-8 
        flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6
        transition-colors duration-300
        ${isFocused ? 'bg-white/[0.02]' : ''}
      `}
    >
      {/* Left: Label */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-2 h-2 bg-emerald-400/60 animate-pulse-subtle" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          [INTEL: CAPITAL_ACCESS_PROJECT]
        </span>
      </div>

      {/* Right: Input + Submit */}
      <div className="flex items-center flex-1 max-w-xl gap-4">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="ENTER_EMAIL_ADDRESS..."
            className="
              w-full bg-transparent
              font-mono text-sm uppercase tracking-[0.1em]
              text-white placeholder-white/20
              focus:outline-none
              px-0 py-3
              border-b border-white/[0.12] focus:border-white/40
              transition-colors duration-300
            "
          />
          {/* Cursor blink effect when focused */}
          {isFocused && !email && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-white/60 animate-blink" />
          )}
        </div>
        <button
          type="submit"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            font-mono text-[10px] uppercase tracking-[0.15em]
            px-6 py-3
            border border-white/50
            transition-none duration-0
            cursor-crosshair
            whitespace-nowrap
            ${isHovered ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/50"}
          `}
        >
          SUBMIT
        </button>
      </div>
    </form>
  );
}

// ============================================
// PATHWAYS SECTION - Main Export
// ============================================
export function PathwaysSection({ className = "" }) {
  const pathways = [
    {
      index: "01",
      meta: "[90+ ACTIVE]",
      icon: DollarSign,
      label: "CAPITAL",
      body: "Access the directory. Filter by stage, check size, and investment thesis.",
      action: "ACCESS DATABASE",
      href: createPageUrl("Funding"),
    },
    {
      index: "02",
      meta: "[18+ SPACES]",
      icon: Building2,
      label: "SPACES",
      body: "Find your HQ. Co-working spaces, accelerators, and innovation labs.",
      action: "LOCATE HQ",
      href: createPageUrl("Workspaces"),
    },
    {
      index: "03",
      meta: "[22+ GROUPS]",
      icon: Users,
      label: "COMMUNITY",
      body: "Join the network. Founder communities and builder collectives.",
      action: "INITIATE UPLINK",
      href: createPageUrl("Community"),
    },
  ];

  return (
    <section className={`${className}`}>
      {/* Grid Container */}
      <div className="border-t border-b border-white/[0.12]">
        {/* 3-Column Grid - No Gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {pathways.map((pathway, i) => (
            <PathwayCard
              key={pathway.label}
              {...pathway}
              isLast={i === pathways.length - 1}
              delay={i * 150}
            />
          ))}
        </div>

        {/* Terminal Email Row */}
        <TerminalEmailRow />
      </div>
    </section>
  );
}

export default PathwaysSection;
