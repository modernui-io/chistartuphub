import React, { useState, useEffect } from "react";
import { Send, Download, HelpCircle, Search, X, ChevronDown, ChevronRight, ArrowUpRight, Compass, BookOpen, Wrench, TrendingUp, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import MaturityMatrix from "@/components/resources/MaturityMatrix";
import FounderGuidesSection from "@/components/resources/FounderGuidesSection";
import AIToolsSection from "@/components/resources/AIToolsSection";
import OperationalToolsSection from "@/components/resources/OperationalToolsSection";
import LearningResourcesSection from "@/components/resources/LearningResourcesSection";
import GlossarySection from "@/components/resources/GlossarySection";
import DownloadToolkitModal from "@/components/DownloadToolkitModal";

const SECTIONS = [
  {
    id: "framework",
    icon: Compass,
    title: "Framework",
    subtitle: "Startup Maturity Matrix",
    description: "A framework to diagnose where you are and identify your next focus area",
    defaultOpen: true
  },
  {
    id: "guides",
    icon: BookOpen,
    title: "Guides",
    subtitle: "Core Pillars",
    description: "Master the essential pillars of startup success",
    defaultOpen: false
  },
  {
    id: "tools",
    icon: Wrench,
    title: "Tools",
    subtitle: "AI & Operational",
    description: "Production tools organized by workflow and business function",
    defaultOpen: false
  },
  {
    id: "insights",
    icon: TrendingUp,
    title: "Insights",
    subtitle: "Stay Current",
    description: "Podcasts, newsletters, and market insights to stay ahead of trends",
    defaultOpen: false
  },
  {
    id: "glossary",
    icon: FileText,
    title: "Glossary",
    subtitle: "Terms Decoded",
    description: "The language of fundraising and growth, decoded",
    defaultOpen: false
  }
];

export default function Resources() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState(["framework"]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId) => expandedSections.includes(sectionId);

  return (
    <div className="min-h-screen relative" data-page="resources">
      <SEO
        title="Startup Toolkit"
        description="Tools, frameworks, and Chicago-specific resources organized by what you need to build. AI tools, operational guides, legal compliance, and startup glossary."
        keywords="startup toolkit, founder resources, AI tools, Illinois business formation, Chicago legal compliance, startup glossary"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-5xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[TOOLKIT: FOUNDER_RESOURCES]</span>
            </div>
            
            <h1 
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Startup Toolkit
            </h1>

            <p 
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Tools, frameworks, and Chicago-specific resources—organized by what you need to build.
            </p>

            {/* Action Buttons */}
            <div 
              className={`flex flex-wrap items-center gap-3 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <button
                onClick={() => setShowDownloadModal(true)}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-5 py-3 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 cursor-crosshair"
              >
                <Download className="w-3 h-3" strokeWidth={1.5} />
                Download Toolkit
                <span className="bg-black/10 text-black/70 text-[9px] px-1.5 py-0.5">FREE</span>
              </button>
              <Link to={createPageUrl("SubmitResource")}>
                <button className="font-mono text-[10px] uppercase tracking-[0.15em] px-5 py-3 border border-white/20 text-white/70 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair">
                  <Send className="w-3 h-3" strokeWidth={1.5} />
                  Submit Resource
                </button>
              </Link>
              <Link to="/before-you-start">
                <button className="font-mono text-[10px] uppercase tracking-[0.15em] px-5 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors flex items-center gap-2 cursor-crosshair">
                  <HelpCircle className="w-3 h-3" strokeWidth={1.5} />
                  Where to Start?
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <div 
              className={`border border-white/10 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '500ms' }}
            >
              <div className="p-4 flex items-center gap-4">
                <Search className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="SEARCH_RESOURCES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/30 focus:outline-none uppercase tracking-[0.1em]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-white/30 hover:text-white transition-colors cursor-crosshair"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Collapsible Sections */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div 
              className={`border border-white/10 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '600ms' }}
            >
              {SECTIONS.map((section, index) => {
                const Icon = section.icon;
                const expanded = isExpanded(section.id);
                
                return (
                  <div 
                    key={section.id}
                    className={`border-b border-white/10 last:border-b-0 ${expanded ? 'bg-white/[0.02]' : ''}`}
                  >
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-6 md:p-8 flex items-start gap-6 text-left hover:bg-white/[0.02] transition-colors cursor-crosshair"
                    >
                      <span className="font-mono text-[10px] text-white/30 pt-1">0{index + 1}</span>
                      <Icon className="w-5 h-5 text-white/40 mt-1 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="font-serif text-xl md:text-2xl text-white">{section.title}</h2>
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/30 border border-white/10 px-2 py-0.5">
                            {section.subtitle}
                          </span>
                        </div>
                        <p className="text-white/40 text-sm">{section.description}</p>
                      </div>
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-white/30 mt-2" strokeWidth={1.5} />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/30 mt-2" strokeWidth={1.5} />
                      )}
                    </button>
                    
                    {/* Section Content */}
                    {expanded && (
                      <div className="px-6 md:px-8 pb-8">
                        {section.id === "framework" && (
                          <div className="ml-11 md:ml-16">
                            <MaturityMatrix />
                          </div>
                        )}
                        
                        {section.id === "guides" && (
                          <div className="ml-11 md:ml-16">
                            <FounderGuidesSection searchQuery={searchQuery} />
                          </div>
                        )}
                        
                        {section.id === "tools" && (
                          <div className="ml-11 md:ml-16 space-y-8">
                            <div>
                              <span className="bureau-label block mb-4">[AI_TOOLS]</span>
                              <AIToolsSection searchQuery={searchQuery} />
                            </div>
                            <div>
                              <span className="bureau-label block mb-4">[OPERATIONAL_TOOLS]</span>
                              <OperationalToolsSection searchQuery={searchQuery} />
                            </div>
                          </div>
                        )}
                        
                        {section.id === "insights" && (
                          <div className="ml-11 md:ml-16">
                            <LearningResourcesSection searchQuery={searchQuery} />
                          </div>
                        )}
                        
                        {section.id === "glossary" && (
                          <div className="ml-11 md:ml-16">
                            <GlossarySection searchQuery={searchQuery} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>

      <DownloadToolkitModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </div>
  );
}
