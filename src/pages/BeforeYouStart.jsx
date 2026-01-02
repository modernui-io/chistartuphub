import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Rocket, Briefcase, Store, HelpCircle, ArrowRight, ArrowUpRight } from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

const PATHS = [
  {
    id: "startup",
    icon: Rocket,
    title: "Startup",
    subtitle: "Building a product designed to scale",
    description: "Software, tech, biotech, or consumer products with high-growth potential",
    link: "/resources",
    linkText: "View Startup Resources"
  },
  {
    id: "service",
    icon: Briefcase,
    title: "Service & Consulting",
    subtitle: "Offering expertise to clients",
    description: "Professional services, consulting, freelance, or agency work",
    link: "/service-resources",
    linkText: "View Service Resources"
  },
  {
    id: "small-business",
    icon: Store,
    title: "Small Business",
    subtitle: "Serving your local community",
    description: "Retail, restaurant, neighborhood service, or local establishment",
    link: "/small-business-resources",
    linkText: "View Small Business Resources"
  },
  {
    id: "not-sure",
    icon: HelpCircle,
    title: "Not Sure Yet",
    subtitle: "Still exploring options",
    description: "That's okay — we'll help you figure out the best path forward",
    link: "/business-type-explorer",
    linkText: "Help Me Decide"
  }
];

export default function BeforeYouStart() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative" data-page="before-you-start">
      <SEO
        title="Where to Start"
        description="Find the right resources for your journey. Whether you're building a startup, service business, or small business in Chicago."
        keywords="startup resources, Chicago startups, small business resources, service business"
      />

      {/* Background */}
      <BureauAtmosphere />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[NAVIGATION: START_HERE]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Where to Start
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mx-auto mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Select the path that best describes what you're building.
            </p>

            <p 
              className={`font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              We'll show you the most relevant resources.
            </p>
          </div>
        </section>

        {/* Path Selection Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div 
              className={`grid md:grid-cols-2 gap-0 border border-white/10 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '500ms' }}
            >
              {PATHS.map((path, index) => {
                const Icon = path.icon;
                const isHovered = hoveredPath === path.id;
                
                return (
                  <button
                    key={path.id}
                    onClick={() => navigate(path.link)}
                    onMouseEnter={() => setHoveredPath(path.id)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className={`
                      group relative p-8 md:p-10 text-left transition-all duration-0 cursor-crosshair
                      border-b border-r border-white/10 last:border-b-0 md:last:border-b md:nth-child(2):border-b
                      ${index % 2 === 1 ? 'md:border-r-0' : ''}
                      ${index >= 2 ? 'md:border-b-0' : ''}
                      ${isHovered ? 'bg-white' : 'bg-transparent'}
                    `}
                  >
                    {/* Index Number */}
                    <span className={`absolute top-4 right-4 font-mono text-[10px] tracking-[0.1em] transition-colors duration-0 ${isHovered ? 'text-black/30' : 'text-white/20'}`}>
                      0{index + 1}
                    </span>

                    {/* Icon */}
                    <div className={`mb-6 transition-colors duration-0 ${isHovered ? 'text-black' : 'text-white/40'}`}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3 className={`font-serif text-2xl md:text-3xl mb-2 transition-colors duration-0 ${isHovered ? 'text-black' : 'text-white'}`}>
                      {path.title}
                    </h3>

                    {/* Subtitle */}
                    <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-4 transition-colors duration-0 ${isHovered ? 'text-black/60' : 'text-white/50'}`}>
                      {path.subtitle}
                    </p>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed mb-6 transition-colors duration-0 ${isHovered ? 'text-black/70' : 'text-white/40'}`}>
                      {path.description}
                    </p>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors duration-0 ${isHovered ? 'text-black' : 'text-white/60'}`}>
                      <span>{path.linkText}</span>
                      <ArrowRight className={`w-3 h-3 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} strokeWidth={1.5} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Skip Option */}
            <div 
              className={`mt-8 text-center ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '600ms' }}
            >
              <Link 
                to="/resources"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors cursor-crosshair"
              >
                <span>Or skip and browse all resources</span>
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />
      </div>
    </div>
  );
}
