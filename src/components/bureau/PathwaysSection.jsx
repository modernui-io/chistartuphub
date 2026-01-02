import React, { useState } from "react";
import { DollarSign, Building2, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * PathwaysSection - The Bureau Navigation Grid
 * Systematic Modernism | Three Vectors to Accelerate
 *
 * Structure:
 * - 3-column grid with collapsed borders (gap-0)
 * - Custom pathway cards with meta-data positioning
 * - Terminal-style email subscription row
 */

// ============================================
// PATHWAY CARD - Custom Bureau Cell
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
}) {
  return (
    <Link
      to={href}
      className={`
        group relative text-left p-8 lg:p-10
        bg-transparent hover:bg-white
        text-white hover:text-black
        transition-none duration-0
        cursor-crosshair
        border-r border-white/15
        ${isLast ? "border-r-0" : ""}
        min-h-[280px] flex flex-col
      `}
    >
      {/* Top Row: Meta (Left) + Index (Right) */}
      <div className="flex items-start justify-between mb-8">
        <span className="font-mono text-xs tracking-wider text-white/40 group-hover:text-black/40">
          {meta}
        </span>
        <span className="font-mono text-sm text-white/30 group-hover:text-black/30">
          {index}
        </span>
      </div>

      {/* Label with Icon */}
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <Icon
            className="w-5 h-5 text-white/60 group-hover:text-black/60"
            strokeWidth={1.5}
          />
        )}
        <h3 className="font-mono text-lg font-bold uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {/* Body - Serif for readability */}
      <p className="font-serif text-base leading-relaxed text-white/60 group-hover:text-black/60 mb-auto">
        {body}
      </p>

      {/* Action - Bottom Left */}
      <div className="flex items-center gap-2 mt-8 font-mono text-xs uppercase tracking-widest text-white/50 group-hover:text-black">
        <span>{action}</span>
        <ArrowRight
          className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-150"
          strokeWidth={2}
        />
      </div>
    </Link>
  );
}

// ============================================
// TERMINAL EMAIL INPUT - Newsletter Row
// ============================================
function TerminalEmailRow() {
  const [email, setEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);

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
      className="border-b border-white/15 px-8 lg:px-10 py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
    >
      {/* Left: Label */}
      <span className="font-mono text-xs uppercase tracking-wider text-white/40 flex-shrink-0">
        [INTEL: WEEKLY_BRIEF]
      </span>

      {/* Right: Input + Submit */}
      <div className="flex items-center flex-1 max-w-xl">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ENTER_EMAIL_ADDRESS_FOR_ACCESS..."
          className="
            flex-1 bg-transparent
            font-mono text-sm uppercase tracking-wider
            text-white placeholder-white/30
            focus:outline-none
            px-0 py-2
          "
        />
        <button
          type="submit"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            font-mono text-xs uppercase tracking-wider
            px-4 py-2 ml-4
            border border-white/30
            transition-none duration-0
            cursor-crosshair
            ${isHovered ? "bg-white text-black border-white" : "bg-transparent text-white/60"}
          `}
        >
          [SUBMIT]
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
      body: "Access the directory. Filter by stage, check size, and thesis.",
      action: "ACCESS DATABASE",
      href: createPageUrl("Funding"),
    },
    {
      index: "02",
      meta: "[18+ HUBS]",
      icon: Building2,
      label: "SPACES",
      body: "Find your HQ. Co-working spaces, accelerators, and labs.",
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
      <div className="border-t border-b border-white/15">
        {/* 3-Column Grid - No Gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {pathways.map((pathway, i) => (
            <PathwayCard
              key={pathway.label}
              {...pathway}
              isLast={i === pathways.length - 1}
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
