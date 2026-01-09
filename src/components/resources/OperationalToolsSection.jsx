import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";

const operationalTools = [
  {
    category: "Business Formation",
    icon: "B",
    items: [
      { name: "Stripe Atlas", desc: "Incorporate a Delaware C-corp and open a business bank account", link: "https://stripe.com/atlas" },
      { name: "CHibizHub", desc: "Chicago's comprehensive business resource hub for registration, licensing, permits, and compliance", link: "https://www.chibizhub.org/" },
      { name: "Illinois Secretary of State", desc: "Official portal for registering your business in Illinois", link: "https://www.ilsos.gov" },
      { name: "Chicago BACP", desc: "City-level business licenses and permits", link: "https://www.chicago.gov/bacp" },
      { name: "SBA Chicago District Office", desc: "Small Business Administration resources", link: "https://www.sba.gov/offices/district/il/chicago" },
      { name: "SCORE Chicago", desc: "Free mentoring and workshops", link: "https://chicago.score.org" },
      { name: "Illinois SBDC", desc: "Free business consulting and training", link: "https://www.ilsbdc.biz" },
    ],
  },
  {
    category: "Legal & Compliance",
    icon: "L",
    items: [
      { name: "Clerky", desc: "Incorporation, equity management, and legal documents for startups", link: "https://www.clerky.com" },
      { name: "Cooley GO", desc: "Free legal documents for startups", link: "https://www.cooleygo.com" },
      { name: "Orrick Startup Forms", desc: "Free startup legal document library", link: "https://www.orrick.com/en/Total-Access/Tool-Kit" },
      { name: "SAFE Agreements (YC)", desc: "Simple Agreement for Future Equity", link: "https://www.ycombinator.com/documents" },
      { name: "Termsfeed", desc: "Privacy policy and terms generators", link: "https://www.termsfeed.com" },
    ],
  },
  {
    category: "Finance & Accounting",
    icon: "F",
    items: [
      { name: "Pilot", desc: "Bookkeeping, tax prep, and CFO services for startups", link: "https://pilot.com" },
      { name: "QuickBooks", desc: "Accounting software for small businesses and startups", link: "https://quickbooks.intuit.com" },
      { name: "Bench", desc: "Online bookkeeping service", link: "https://bench.co" },
      { name: "Brex", desc: "Corporate cards and expense management", link: "https://www.brex.com" },
      { name: "Mercury", desc: "Banking built for startups", link: "https://mercury.com" },
      { name: "Stripe", desc: "Payment processing infrastructure", link: "https://stripe.com" },
    ],
  },
  {
    category: "HR & People Ops",
    icon: "H",
    items: [
      { name: "Gusto", desc: "Payroll, benefits, and HR management platform", link: "https://gusto.com" },
      { name: "Rippling", desc: "All-in-one HR, IT, and Finance platform", link: "https://www.rippling.com" },
      { name: "Justworks", desc: "All-in-one HR and payroll", link: "https://justworks.com" },
      { name: "Lever", desc: "Applicant tracking software", link: "https://www.lever.co" },
      { name: "Greenhouse", desc: "Hiring and onboarding platform", link: "https://www.greenhouse.io" },
      { name: "Lattice", desc: "Performance management", link: "https://lattice.com" },
    ],
  },
  {
    category: "Operations & Productivity",
    icon: "O",
    items: [
      { name: "Notion", desc: "All-in-one workspace for notes, docs, projects, and wikis", link: "https://www.notion.so" },
      { name: "Slack", desc: "Team communication and collaboration platform", link: "https://slack.com" },
      { name: "Airtable", desc: "Spreadsheet-database hybrid", link: "https://airtable.com" },
      { name: "Zapier", desc: "Automate workflows between your apps and services without coding", link: "https://zapier.com" },
      { name: "Asana", desc: "Project management", link: "https://asana.com" },
      { name: "Linear", desc: "Issue tracking for software teams", link: "https://linear.app" },
    ],
  },
];

export default function OperationalToolsSection({ searchQuery = "" }) {
  const [expandedCategories, setExpandedCategories] = useState([]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Filter tools and categories based on search query
  const filteredTools = searchQuery.trim() === ""
    ? operationalTools
    : operationalTools
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => {
            const query = searchQuery.toLowerCase();
            return (
              item.name.toLowerCase().includes(query) ||
              item.desc.toLowerCase().includes(query)
            );
          }),
        }))
        .filter((category) => category.items.length > 0);

  // Don't render section if no results match search
  if (searchQuery.trim() !== "" && filteredTools.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <p className="text-white/50 text-sm">
          Operational tools for business formation, legal compliance, finance, hiring, and productivity
        </p>
      </div>

      {/* Categories */}
      <div className="border border-white/10">
        {filteredTools.map((category, index) => {
          const isExpanded = expandedCategories.includes(category.category) || searchQuery.trim() !== "";
          
          return (
            <div 
              key={category.category}
              className={`${index < filteredTools.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-crosshair"
              >
                <span className="font-mono text-[10px] text-white/30">0{index + 1}</span>
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                  <span className="font-mono text-xs text-white/70">{category.icon}</span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white flex-1">
                  {category.category}
                </span>
                <span className="font-mono text-[10px] text-white/30 mr-2">
                  {category.items.length} TOOLS
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                )}
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className="border-t border-white/10">
                  {category.items.map((item, itemIndex) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-start gap-4 p-4 pl-16 hover:bg-white hover:text-black transition-colors group cursor-crosshair ${itemIndex < category.items.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                      <span className="font-mono text-[10px] text-white/20 group-hover:text-black/40 pt-0.5">
                        {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-xs uppercase tracking-[0.05em] text-white group-hover:text-black mb-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-white/40 group-hover:text-black/60">{item.desc}</p>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-black/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
