import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUpRight } from "lucide-react";

/**
 * BureauFooter - The System Terminal
 * Version 2.0 - Premium refinements
 * A 4-column technical footer with brand, sitemap, social, and status
 */
export function BureauFooter({ className = "" }) {
  const navigation = [
    { label: "CAPITAL", href: createPageUrl("Funding") },
    { label: "SPACES", href: createPageUrl("Workspaces") },
    { label: "COMMUNITY", href: createPageUrl("Community") },
    { label: "EVENTS", href: createPageUrl("Events") },
    { label: "TOOLKIT", href: createPageUrl("Resources") },
  ];

  const network = [
    { label: "LINKEDIN", href: "https://linkedin.com/company/chistartuphub", external: true },
    { label: "TWITTER", href: "https://twitter.com/chistartuphub", external: true },
    { label: "EMAIL", href: "mailto:hello@chistartuphub.com", external: true },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-white/[0.12] bg-[#050A14]/98 backdrop-blur-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-12">
          {/* Col 1 - Brand */}
          <div className="lg:col-span-1">
            {/* Logo Square */}
            <div className="w-14 h-14 border border-white/15 flex items-center justify-center mb-8 group hover:bg-white hover:border-white transition-none cursor-crosshair">
              <span className="font-mono text-xl font-bold text-white group-hover:text-black">CS</span>
            </div>

            {/* Brand Text */}
            <p className="font-serif text-lg text-white/60 leading-relaxed mb-8">
              ChiStartup Hub.
              <br />
              <span className="text-white/40">Your Launchpad for Chicago.</span>
            </p>

            {/* Copyright */}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
              © {currentYear} // ALL_RIGHTS_RESERVED
            </span>
          </div>

          {/* Col 2 - Navigation */}
          <div>
            <h4 className="bureau-label mb-8">
              [NAVIGATION]
            </h4>
            <ul className="space-y-4">
              {navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.1em] text-white/40 hover:text-white transition-none"
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 - Network */}
          <div>
            <h4 className="bureau-label mb-8">
              [NETWORK]
            </h4>
            <ul className="space-y-4">
              {network.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.1em] text-white/40 hover:text-white transition-none"
                  >
                    <span>{item.label}</span>
                    {item.external && (
                      <ArrowUpRight 
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" 
                        strokeWidth={1.5}
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>


        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.08]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/15">
              MAKE NO SMALL PLANS // SYSTEMATIC MODERNISM
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/15">
                BUILT IN CHICAGO
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default BureauFooter;
