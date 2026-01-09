import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Store, 
  FileText, 
  DollarSign, 
  MapPin, 
  Megaphone,
  Users,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft
} from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

const RESOURCE_CATEGORIES = [
  {
    id: "licenses",
    icon: FileText,
    title: "Licenses & Permits",
    description: "Business licenses, permits, and regulatory requirements for Chicago businesses",
    resources: [
      { name: "Chicago Business License Portal", url: "https://www.chicago.gov/city/en/depts/bacp/provdrs/bus.html", type: "Government" },
      { name: "Illinois Business Portal", url: "https://www2.illinois.gov/business", type: "Government" },
      { name: "Chicago BACP", url: "https://www.chicago.gov/city/en/depts/bacp.html", type: "Government" },
      { name: "SBA License & Permit Guide", url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits", type: "Guide" }
    ]
  },
  {
    id: "funding",
    icon: DollarSign,
    title: "Funding & Grants",
    description: "Small business loans, grants, and financial assistance programs",
    resources: [
      { name: "Chicago Small Business Grants", url: "https://www.chicago.gov/city/en/depts/bacp/provdrs/bus/svcs/small-business-improvement-fund.html", type: "Grant" },
      { name: "Illinois Finance Authority", url: "https://www.il-fa.com/", type: "Loans" },
      { name: "Accion Chicago", url: "https://us.accion.org/", type: "Microloans" },
      { name: "Kiva Chicago", url: "https://www.kiva.org/", type: "Crowdfunding" }
    ]
  },
  {
    id: "location",
    icon: MapPin,
    title: "Location & Real Estate",
    description: "Finding and leasing commercial space in Chicago neighborhoods",
    resources: [
      { name: "LoopNet Chicago", url: "https://www.loopnet.com/", type: "Commercial Real Estate" },
      { name: "Chicago Neighborhoods", url: "https://www.chicago.gov/city/en/depts/dcd.html", type: "City Planning" },
      { name: "Local Initiatives Support Corp", url: "https://www.lisc.org/chicago/", type: "Community Development" },
      { name: "Chicago SSA Programs", url: "https://www.chicago.gov/city/en/depts/dcd/supp_info/special_service_areasssa.html", type: "Business Districts" }
    ]
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing & Visibility",
    description: "Local marketing, Google Business, and community engagement",
    resources: [
      { name: "Google Business Profile", url: "https://business.google.com/", type: "Free Tool" },
      { name: "Yelp for Business", url: "https://business.yelp.com/", type: "Free Tool" },
      { name: "Nextdoor Business", url: "https://business.nextdoor.com/", type: "Local Marketing" },
      { name: "Chicago Chamber of Commerce", url: "https://www.chicagolandchamber.org/", type: "Networking" }
    ]
  },
  {
    id: "hiring",
    icon: Users,
    title: "Hiring & Employment",
    description: "Hiring resources, employment law, and workforce development",
    resources: [
      { name: "Illinois Job Link", url: "https://illinoisjoblink.illinois.gov/", type: "Job Board" },
      { name: "Chicago Workforce Development", url: "https://www.chicago.gov/city/en/depts/fss/provdrs/empl.html", type: "Government" },
      { name: "Gusto Payroll", url: "https://gusto.com/", type: "Payroll Tool" },
      { name: "Illinois Employment Law", url: "https://www.illinois.gov/idol", type: "Regulations" }
    ]
  }
];

const CHICAGO_RESOURCES = [
  { name: "Neighborhood Business Development Centers", url: "https://www.chicago.gov/city/en/depts/bacp/provdrs/bus/svcs/neighborhood-business-development-centers.html", description: "Free business consulting in your neighborhood" },
  { name: "Chicago Neighborhood Initiatives", url: "https://www.cnigroup.org/", description: "Community development and small business support" },
  { name: "Greater Englewood CDC", url: "https://www.greaterenglewoodcdc.org/", description: "South Side business development" },
  { name: "Back of the Yards Neighborhood Council", url: "https://www.bync.org/", description: "Southwest Side business support" }
];

export default function SmallBusinessResources() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative" data-page="small-business-resources">
      <SEO
        title="Small Business Resources"
        description="Resources for small businesses in Chicago. Licenses, funding, location, marketing, and local support."
        keywords="small business Chicago, business license Chicago, small business grants, local business resources"
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
              <span className="bureau-label block mb-6">[RESOURCES: SMALL_BUSINESS]</span>
            </div>
            
            <div className="flex items-start gap-6 mb-6">
              <div className={`p-4 border border-white/20 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
                <Store className="w-8 h-8 text-white/60" strokeWidth={1.5} />
              </div>
              <div>
                <h1 
                  className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: '200ms' }}
                >
                  Small Business
                </h1>
                <p 
                  className={`text-white/50 text-lg max-w-2xl ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: '300ms' }}
                >
                  Resources for local businesses serving Chicago communities. Licenses, funding, location, and neighborhood support.
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
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 group-hover:text-black/50 transition-colors">{resource.type}</span>
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

        {/* Chicago Neighborhood Resources */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
              <span className="bureau-label block mb-6">[CHICAGO: NEIGHBORHOOD_SUPPORT]</span>
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-8">Neighborhood Resources</h2>
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
