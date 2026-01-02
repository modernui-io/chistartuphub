import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Briefcase, 
  FileText, 
  Users, 
  DollarSign, 
  Scale, 
  Globe,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft
} from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

const RESOURCE_CATEGORIES = [
  {
    id: "legal",
    icon: Scale,
    title: "Legal & Contracts",
    description: "Contract templates, LLC formation, and legal basics for service providers",
    resources: [
      { name: "Illinois Secretary of State", url: "https://www.ilsos.gov/", type: "Government" },
      { name: "LegalZoom", url: "https://www.legalzoom.com/", type: "Tool" },
      { name: "Bonsai Contracts", url: "https://www.hellobonsai.com/", type: "Tool" },
      { name: "Chicago Lawyers' Committee", url: "https://www.clccrul.org/", type: "Legal Aid" }
    ]
  },
  {
    id: "finance",
    icon: DollarSign,
    title: "Finance & Invoicing",
    description: "Invoicing tools, payment processing, and financial management",
    resources: [
      { name: "Wave Accounting", url: "https://www.waveapps.com/", type: "Free Tool" },
      { name: "QuickBooks Self-Employed", url: "https://quickbooks.intuit.com/", type: "Tool" },
      { name: "Stripe", url: "https://stripe.com/", type: "Payments" },
      { name: "HoneyBook", url: "https://www.honeybook.com/", type: "CRM + Invoicing" }
    ]
  },
  {
    id: "clients",
    icon: Users,
    title: "Finding Clients",
    description: "Networking, lead generation, and client acquisition strategies",
    resources: [
      { name: "LinkedIn Sales Navigator", url: "https://business.linkedin.com/sales-solutions", type: "Tool" },
      { name: "Upwork", url: "https://www.upwork.com/", type: "Marketplace" },
      { name: "1871 Chicago", url: "https://1871.com/", type: "Community" },
      { name: "Chicago Freelancers Union", url: "https://www.freelancersunion.org/", type: "Community" }
    ]
  },
  {
    id: "proposals",
    icon: FileText,
    title: "Proposals & Pricing",
    description: "Proposal templates, pricing strategies, and scope management",
    resources: [
      { name: "Proposify", url: "https://www.proposify.com/", type: "Tool" },
      { name: "PandaDoc", url: "https://www.pandadoc.com/", type: "Tool" },
      { name: "The Futur Pricing Guide", url: "https://thefutur.com/", type: "Education" },
      { name: "Freelance Rate Calculator", url: "https://www.hellobonsai.com/rates", type: "Calculator" }
    ]
  },
  {
    id: "online",
    icon: Globe,
    title: "Online Presence",
    description: "Portfolio sites, personal branding, and digital marketing",
    resources: [
      { name: "Squarespace", url: "https://www.squarespace.com/", type: "Website Builder" },
      { name: "Calendly", url: "https://calendly.com/", type: "Scheduling" },
      { name: "Contra", url: "https://contra.com/", type: "Portfolio" },
      { name: "Substack", url: "https://substack.com/", type: "Newsletter" }
    ]
  }
];

const CHICAGO_RESOURCES = [
  { name: "SCORE Chicago", url: "https://www.score.org/chicago", description: "Free mentoring for small businesses" },
  { name: "Women's Business Development Center", url: "https://www.wbdc.org/", description: "Support for women entrepreneurs" },
  { name: "Chicago Urban League", url: "https://www.chiul.org/", description: "Economic empowerment programs" },
  { name: "Illinois SBDC", url: "https://www.ilsbdc.biz/", description: "Small Business Development Center" }
];

export default function ServiceResources() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative" data-page="service-resources">
      <SEO
        title="Service & Consulting Resources"
        description="Resources for service providers, consultants, and freelancers in Chicago. Legal, finance, client acquisition, and more."
        keywords="consulting resources, freelance Chicago, service business, client acquisition"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Back Navigation */}
        <div className="pt-24 px-6">
          <div className="max-w-5xl mx-auto">
            <Link 
              to="/before-you-start"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-crosshair"
            >
              <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
              <span>Back to Start</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="pt-8 pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[RESOURCES: SERVICE_CONSULTING]</span>
            </div>
            
            <div className="flex items-start gap-6 mb-6">
              <div className={`p-4 border border-white/20 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
                <Briefcase className="w-8 h-8 text-white/60" strokeWidth={1.5} />
              </div>
              <div>
                <h1 
                  className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: '200ms' }}
                >
                  Service & Consulting
                </h1>
                <p 
                  className={`text-white/50 text-lg max-w-2xl ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: '300ms' }}
                >
                  Resources for freelancers, consultants, and service providers. Build your practice, find clients, and grow sustainably.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        <section className="px-6 pb-16">
          <div className="max-w-5xl mx-auto">
            <div 
              className={`border border-white/10 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              {RESOURCE_CATEGORIES.map((category, index) => {
                const Icon = category.icon;
                const isExpanded = expandedCategory === category.id;
                
                return (
                  <div 
                    key={category.id}
                    className={`border-b border-white/10 last:border-b-0 ${isExpanded ? 'bg-white/5' : ''}`}
                  >
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full p-6 md:p-8 flex items-start gap-6 text-left hover:bg-white/5 transition-colors cursor-crosshair"
                    >
                      <span className="font-mono text-[10px] text-white/30 pt-1">0{index + 1}</span>
                      <Icon className="w-5 h-5 text-white/40 mt-1 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1">
                        <h3 className="font-serif text-xl md:text-2xl text-white mb-2">{category.title}</h3>
                        <p className="text-white/40 text-sm">{category.description}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-white/30 mt-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} strokeWidth={1.5} />
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 md:px-8 pb-6 md:pb-8 ml-16 md:ml-20">
                        <div className="grid md:grid-cols-2 gap-3">
                          {category.resources.map((resource, rIndex) => (
                            <a
                              key={rIndex}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between p-4 border border-white/10 hover:bg-white hover:border-white transition-all cursor-crosshair"
                            >
                              <div>
                                <span className="block text-white group-hover:text-black text-sm font-medium transition-colors">{resource.name}</span>
                                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/30 group-hover:text-black/50 transition-colors">{resource.type}</span>
                              </div>
                              <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-black transition-colors" strokeWidth={1.5} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Chicago-Specific Resources */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
              <span className="bureau-label block mb-6">[CHICAGO: LOCAL_SUPPORT]</span>
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-8">Chicago-Specific Resources</h2>
            </div>
            
            <div 
              className={`grid md:grid-cols-2 gap-0 border border-white/10 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '600ms' }}
            >
              {CHICAGO_RESOURCES.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    group p-6 md:p-8 border-b border-r border-white/10 hover:bg-white transition-all cursor-crosshair
                    ${index % 2 === 1 ? 'md:border-r-0' : ''}
                    ${index >= 2 ? 'md:border-b-0' : ''}
                    last:border-b-0
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono text-[10px] text-white/30 group-hover:text-black/30 transition-colors">0{index + 1}</span>
                    <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-black transition-colors" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-black mb-2 transition-colors">{resource.name}</h3>
                  <p className="text-white/40 group-hover:text-black/60 text-sm transition-colors">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
