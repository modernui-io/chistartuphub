import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * BureauFooter - The System Terminal
 * A 4-column technical footer with brand, sitemap, social, and status
 */
export function BureauFooter({ className = "" }) {
  const navigation = [
    { label: "CAPITAL", href: createPageUrl("Funding") },
    { label: "SPACES", href: createPageUrl("Workspaces") },
    { label: "COMMUNITY", href: createPageUrl("Community") },
    { label: "TOOLKIT", href: createPageUrl("Resources") },
  ];

  const network = [
    { label: "LINKEDIN", href: "https://linkedin.com/company/chistartuphub", external: true },
    { label: "TWITTER", href: "https://twitter.com/chistartuphub", external: true },
    { label: "EMAIL", href: "mailto:hello@chistartuphub.com", external: true },
  ];

  return (
    <footer className={`border-t border-white/15 bg-[#050A14]/95 backdrop-blur-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Col 1 - Brand */}
          <div className="lg:col-span-1">
            {/* Logo Square */}
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
              <span className="font-mono text-lg font-bold text-white">CS</span>
            </div>

            {/* Brand Text */}
            <p className="font-serif text-base text-white/70 leading-relaxed mb-6">
              ChiStartup Hub.
              <br />
              The Operating System for Chicago Founders.
            </p>

            {/* Copyright */}
            <span className="font-mono text-xs uppercase tracking-wider text-white/30">
              © 2025 // ALL_RIGHTS_RESERVED
            </span>
          </div>

          {/* Col 2 - Navigation */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              [NAVIGATION]
            </h4>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="font-mono text-sm uppercase tracking-wider text-white/50 hover:text-white transition-colors duration-0"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 - Network */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              [NETWORK]
            </h4>
            <ul className="space-y-3">
              {network.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="font-mono text-sm uppercase tracking-wider text-white/50 hover:text-white transition-colors duration-0"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - System Status */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              [SYSTEM_STATUS]
            </h4>

            {/* Status Indicator */}
            <div className="flex items-center gap-3 mb-4">
              {/* Pulsing Green Dot */}
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="font-mono text-sm uppercase tracking-wider text-emerald-400">
                OPERATIONAL
              </span>
            </div>

            {/* Last Updated */}
            <span className="font-mono text-xs text-white/30">
              Updated: 24h ago
            </span>

            {/* Version */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <span className="font-mono text-xs text-white/20 block">
                VERSION: 2.0.0
              </span>
              <span className="font-mono text-xs text-white/20 block mt-1">
                BUILD: 2025.01
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-white/20">
              SYSTEMATIC MODERNISM // PRECISION OVER DECORATION
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-white/20">
              BUILT IN CHICAGO
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default BureauFooter;
