import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Rocket, Briefcase, Store, HelpCircle, ArrowRight, ArrowUpRight, MapPin, Users, Compass, Zap } from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import { useAuth } from "@/contexts/AuthContext";

const PATHS = [
  {
    id: "startup",
    icon: Rocket,
    title: "Startup",
    subtitle: "Building a product designed to scale",
    description: "Software, tech, biotech, or consumer products with high-growth potential",
    whatYouGet: ["150+ accelerators & investors", "Founder community asks", "Startup Maturity Atlas toolkit"],
    link: "/resources",
    linkText: "View Startup Resources",
    recommended: true, // Most common path
  },
  {
    id: "service",
    icon: Briefcase,
    title: "Service & Consulting",
    subtitle: "Offering expertise to clients",
    description: "Professional services, consulting, freelance, or agency work",
    whatYouGet: ["Chicago service providers", "Client acquisition resources", "Professional networks"],
    link: "/service-resources",
    linkText: "View Service Resources",
  },
  {
    id: "small-business",
    icon: Store,
    title: "Small Business",
    subtitle: "Serving your local community",
    description: "Retail, restaurant, neighborhood service, or local establishment",
    whatYouGet: ["Local business grants", "Chicago neighborhood guides", "Small business programs"],
    link: "/small-business-resources",
    linkText: "View Small Business Resources",
  },
  {
    id: "not-sure",
    icon: HelpCircle,
    title: "Not Sure Yet",
    subtitle: "Still exploring options",
    description: "That's okay — we'll help you figure out the best path forward",
    whatYouGet: ["Quick assessment quiz", "Path comparison", "Personalized recommendation"],
    link: "/business-type-explorer",
    linkText: "Help Me Decide",
  }
];

// What ChiStartupHub offers - for context section
const VALUE_PROPS = [
  { icon: MapPin, label: "Chicago-focused", description: "Local resources, not generic advice" },
  { icon: Users, label: "Community-driven", description: "Connect with founders who get it" },
  { icon: Compass, label: "Curated paths", description: "We filter the noise for you" },
  { icon: Zap, label: "Action-oriented", description: "Resources that lead to results" },
];

export default function BeforeYouStart() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Personalized greeting based on user role
  const getRoleContext = () => {
    if (!profile?.role) return null;
    const roleMessages = {
      founder: "As a founder, you'll find resources to help you build, fund, and scale.",
      helper: "Connect with founders and share your expertise through our community asks.",
      investor: "Looking to connect with Chicago startups? Browse founder asks or explore the ecosystem.",
      'service-provider': "Find founders who need your expertise through our community asks.",
      student: "Explore what it takes to build in Chicago — resources, communities, and opportunities.",
    };
    return roleMessages[profile.role] || null;
  };

  const roleContext = getRoleContext();

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
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[NAVIGATION: GET_STARTED]</span>
            </div>

            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              {user ? `Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}` : 'Your Chicago Startup Journey'}
            </h1>

            <p
              className={`text-white/60 text-lg max-w-2xl mx-auto mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              {roleContext || "ChiStartupHub connects you with Chicago's startup ecosystem — curated resources, founder community, and tools to help you build."}
            </p>

            <p
              className={`font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 mb-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              Tell us what you're building and we'll show you where to focus.
            </p>
          </div>
        </section>

        {/* Value Props - What you get */}
        <section className="px-6 pb-12">
          <div
            className={`max-w-4xl mx-auto ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '450ms' }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 bg-black/20">
              {VALUE_PROPS.map((prop, index) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={prop.label}
                    className={`p-4 md:p-6 text-center ${index < 3 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b md:border-b-0 border-white/10' : ''}`}
                  >
                    <Icon className="w-5 h-5 text-white/40 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white mb-1">{prop.label}</p>
                    <p className="text-[11px] text-white/40">{prop.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section Header */}
        <section className="px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '480ms' }}
            >
              [SELECT YOUR PATH]
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
                      group relative p-6 md:p-8 text-left transition-all duration-0 cursor-crosshair
                      border-b border-r border-white/10 last:border-b-0 md:last:border-b md:nth-child(2):border-b
                      ${index % 2 === 1 ? 'md:border-r-0' : ''}
                      ${index >= 2 ? 'md:border-b-0' : ''}
                      ${isHovered ? 'bg-white' : 'bg-transparent'}
                    `}
                  >
                    {/* Index Number + Recommended Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {path.recommended && (
                        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 transition-colors duration-0 ${isHovered ? 'bg-black text-white' : 'bg-white/10 text-white/50'}`}>
                          Popular
                        </span>
                      )}
                      <span className={`font-mono text-[10px] tracking-[0.1em] transition-colors duration-0 ${isHovered ? 'text-black/30' : 'text-white/20'}`}>
                        0{index + 1}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`mb-4 transition-colors duration-0 ${isHovered ? 'text-black' : 'text-white/40'}`}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3 className={`font-serif text-2xl md:text-3xl mb-2 transition-colors duration-0 ${isHovered ? 'text-black' : 'text-white'}`}>
                      {path.title}
                    </h3>

                    {/* Subtitle */}
                    <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-3 transition-colors duration-0 ${isHovered ? 'text-black/60' : 'text-white/50'}`}>
                      {path.subtitle}
                    </p>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed mb-4 transition-colors duration-0 ${isHovered ? 'text-black/70' : 'text-white/40'}`}>
                      {path.description}
                    </p>

                    {/* What You Get */}
                    <div className={`mb-6 py-3 border-t transition-colors duration-0 ${isHovered ? 'border-black/10' : 'border-white/10'}`}>
                      <p className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-2 transition-colors duration-0 ${isHovered ? 'text-black/40' : 'text-white/30'}`}>
                        What you'll get:
                      </p>
                      <ul className="space-y-1">
                        {path.whatYouGet.map((item, i) => (
                          <li
                            key={i}
                            className={`text-xs flex items-center gap-2 transition-colors duration-0 ${isHovered ? 'text-black/60' : 'text-white/50'}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${isHovered ? 'bg-black/40' : 'bg-white/40'}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

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
