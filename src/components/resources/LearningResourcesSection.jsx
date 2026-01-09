import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";

const insightsResources = [
  {
    category: "Founder Voices (Podcasts)",
    icon: "🎙",
    items: [
      { name: "The Full Ratchet", desc: "Chicago-based podcast on startups and venture capital with Nick Moran", link: "https://fullratchet.net/" },
      { name: "Lenny's Podcast", desc: "In-depth conversations with founders and leaders building innovative companies", link: "https://www.lennysnewsletter.com/podcast" },
      { name: "20VC (The Twenty Minute VC)", desc: "Interviews with top founders, investors, and operators on building billion-dollar companies", link: "https://www.thetwentyminutevc.com/" },
      { name: "Acquired", desc: "Deep dives into the strategies, stories, and lessons from iconic acquisitions and companies", link: "https://www.acquired.fm/" },
    ],
  },
  {
    category: "Market Briefs (Newsletters)",
    icon: "📧",
    items: [
      { name: "Ben's Bites", desc: "Daily curated AI news, trends, and insights from the forefront of artificial intelligence", link: "https://bensbites.co/" },
      { name: "The Diff", desc: "Strategic analysis of technology trends and their business implications", link: "https://thediff.co/" },
      { name: "Founder's Journal", desc: "Practical lessons, frameworks, and wisdom from experienced founders and operators", link: "https://podcasts.apple.com/us/podcast/founders-journal/id1509276485" },
      { name: "Paul Graham Essays", desc: "Influential essays on startups, entrepreneurship, and the technology landscape", link: "http://paulgraham.com/articles.html" },
    ],
  },
  {
    category: "Chicago Tech News",
    icon: "🏙",
    items: [
      { name: "Built In Chicago", desc: "Jobs, news, and resources for the Chicago tech and startup community", link: "https://www.builtinchicago.org/" },
      { name: "Technori", desc: "Chicago startup news, events, and connections for founders and entrepreneurs", link: "https://technori.com/" },
      { name: "Chicago Innovation", desc: "Driving innovation and economic growth across Chicago's startup and technology ecosystem", link: "https://chicagoinnovation.com/" },
      { name: "Chicago Business Journal", desc: "Business news, insights, and events covering Chicago's entrepreneurial and corporate landscape", link: "https://www.bizjournals.com/chicago" },
    ],
  },
];

export default function LearningResourcesSection({ searchQuery = "" }) {
  const [expandedCategories, setExpandedCategories] = useState([]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Filter resources based on search query
  const filteredResources = searchQuery.trim() === ""
    ? insightsResources
    : insightsResources
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

  if (searchQuery.trim() !== "" && filteredResources.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <p className="text-white/50 text-sm">
          Founder voices, market insights, and community resources to stay current on trends
        </p>
      </div>

      {/* Categories */}
      <div className="border border-white/10">
        {filteredResources.map((category, index) => {
          const isExpanded = expandedCategories.includes(category.category) || searchQuery.trim() !== "";
          
          return (
            <div 
              key={category.category}
              className={`${index < filteredResources.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-crosshair"
              >
                <span className="font-mono text-[10px] text-white/30">0{index + 1}</span>
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-lg">
                  {category.icon}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white flex-1">
                  {category.category}
                </span>
                <span className="font-mono text-[10px] text-white/30 mr-2">
                  {category.items.length} RESOURCES
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
