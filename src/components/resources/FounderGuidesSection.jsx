import React, { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

// Organized by category/stage
const guideCategories = [
  {
    category: "Communicate Your Vision",
    icon: "📣",
    guides: [
      {
        title: "Storytelling & Design",
        description: "Master the art of communicating your vision through clear storytelling and compelling design.",
        links: [
          { title: "Sequoia - Writing a Business Plan", url: "https://www.sequoiacap.com/article/writing-a-business-plan/" },
          { title: "YC - How to Build a Pitch Deck", url: "https://www.ycombinator.com/library/2u-how-to-build-a-pitch-deck" },
          { title: "Slidebean - Pitch Deck Examples", url: "https://slidebean.com/blog/startups-pitch-deck-presentation-complete-guide" }
        ],
        topics: ["Communication", "Design", "Presentation"]
      },
      {
        title: "The Art of the Pitch",
        description: "Perfect your pitch delivery—present confidently, answer tough questions, and persuade investors.",
        links: [
          { title: "YC - How to Pitch Your Startup", url: "https://www.ycombinator.com/library/4D-how-to-pitch-your-startup" },
          { title: "First Round - Master the Art of Influence", url: "https://review.firstround.com/master-the-art-of-influence-persuasion-as-a-skill-and-habit/" }
        ],
        topics: ["Pitching", "Persuasion", "Communication"]
      },
    ],
  },
  {
    category: "Raise Capital",
    icon: "💰",
    guides: [
      {
        title: "Fundraising Strategy",
        description: "Navigate the fundraising landscape—from identifying investors to closing with optimal terms.",
        links: [
          { title: "YC - Guide to Seed Fundraising", url: "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising" },
          { title: "First Round - Fundraising Wisdom of 30 Founders", url: "https://review.firstround.com/the-fundraising-wisdom-that-helped-our-founders-raise-18b-in-follow-on-capital/" },
          { title: "NFX - Non-Obvious Guide to Fundraising", url: "https://www.nfx.com/post/fundraising-guide" }
        ],
        topics: ["Fundraising", "Investor Relations", "Term Sheets"]
      },
      {
        title: "Monetization & Pricing",
        description: "Develop a winning pricing strategy that maximizes revenue while delivering customer value.",
        links: [
          { title: "Paddle - SaaS Pricing Strategy Guide", url: "https://www.paddle.com/resources/saas-pricing-models" },
          { title: "YC - Pricing Guide", url: "https://www.ycombinator.com/library/5x-pricing" }
        ],
        topics: ["Pricing", "Revenue", "Unit Economics"]
      },
    ],
  },
  {
    category: "Build Your Product",
    icon: "🔧",
    guides: [
      {
        title: "Customer Discovery",
        description: "Conduct meaningful customer conversations, validate assumptions, and uncover real market needs.",
        links: [
          { title: "Rob Fitzpatrick (The Mom Test) - Workshop", url: "https://www.youtube.com/watch?v=_tl0vcJpbf8" },
          { title: "YC - How to Talk to Users", url: "https://www.ycombinator.com/library/Iq-how-to-talk-to-users" }
        ],
        topics: ["User Research", "Validation", "Customer Interviews"]
      },
      {
        title: "Product Development",
        description: "Build products users love by mastering product strategy and achieving product-market fit.",
        links: [
          { title: "First Round - Superhuman Product/Market Fit Engine", url: "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/" },
          { title: "Basecamp - Shape Up (Free Book)", url: "https://basecamp.com/shapeup" }
        ],
        topics: ["Product Strategy", "Iteration", "Market Fit"]
      },
    ],
  },
  {
    category: "Grow Your Business",
    icon: "📈",
    guides: [
      {
        title: "Go-to-Market (GTM)",
        description: "Launch strategically with a proven go-to-market plan that drives early adoption.",
        links: [
          { title: "First Round - Go-to-Market Fit Framework", url: "https://review.firstround.com/the-founder-s-guide-to-generating-demand-the-go-to-market-fit-framework/" },
          { title: "YC - Startup Launch List", url: "https://www.ycombinator.com/launch" }
        ],
        topics: ["Launch", "Positioning", "Market Entry"]
      },
      {
        title: "Growth & Acquisition",
        description: "Master proven growth tactics and customer acquisition strategies that scale sustainably.",
        links: [
          { title: "Growth Unhinged - Emerging Startup Playbook", url: "https://www.growthunhinged.com/p/the-emerging-startup-playbook" },
          { title: "First Round - Growth Tactics (FB/Twitter/Wealthfront)", url: "https://review.firstround.com/indispensable-growth-frameworks-from-my-years-at-facebook-twitter-and-wealthfront/" }
        ],
        topics: ["Growth", "CAC", "Scaling"]
      },
      {
        title: "Metrics & Analytics",
        description: "Track the metrics that matter—measure growth, define KPIs, and make data-driven decisions.",
        links: [
          { title: "a16z - 16 Metrics for Growth", url: "https://a16z.com/16-metrics-guide/" },
          { title: "a16z - Guide to Growth Metrics", url: "https://a16z.com/introducing-a16z-growths-guide-to-growth-metrics/" }
        ],
        topics: ["Metrics", "Analytics", "KPIs"]
      },
    ],
  },
  {
    category: "Build Your Team",
    icon: "👥",
    guides: [
      {
        title: "Team & Talent",
        description: "Build a world-class founding team by recruiting top talent and structuring equity fairly.",
        links: [
          { title: "YC - How to Scale a Growth Strategy and Team", url: "https://www.ycombinator.com/library/59-how-to-set-up-hire-and-scale-a-growth-strategy-and-team" },
          { title: "Holloway - Guide to Equity Compensation", url: "https://www.holloway.com/g/equity-compensation" }
        ],
        topics: ["Hiring", "Equity", "Team Building"]
      },
      {
        title: "Culture & Values",
        description: "Create a strong company culture that attracts talent and aligns your team around shared values.",
        links: [
          { title: "Netflix - Culture Deck", url: "https://jobs.netflix.com/culture" },
          { title: "First Round - Give Away Your Legos", url: "https://review.firstround.com/give-away-your-legos-and-other-commandments-for-scaling-startups/" }
        ],
        topics: ["Culture", "Values", "Team Dynamics"]
      },
    ],
  },
];

export default function FounderGuidesSection({ searchQuery = "" }) {
  const [expandedCategories, setExpandedCategories] = useState([]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Filter guides based on search query
  const filteredCategories = searchQuery.trim() === ""
    ? guideCategories
    : guideCategories
        .map((category) => ({
          ...category,
          guides: category.guides.filter((guide) => {
            const query = searchQuery.toLowerCase();
            return (
              guide.title.toLowerCase().includes(query) ||
              guide.description.toLowerCase().includes(query) ||
              guide.topics.some(topic => topic.toLowerCase().includes(query))
            );
          }),
        }))
        .filter((category) => category.guides.length > 0);

  if (searchQuery.trim() !== "" && filteredCategories.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <p className="text-white/50 text-sm">
          Master the essential pillars of startup success—organized by what you need to build
        </p>
      </div>

      {/* Categories */}
      <div className="border border-white/10">
        {filteredCategories.map((category, index) => {
          const isExpanded = expandedCategories.includes(category.category) || searchQuery.trim() !== "";
          
          return (
            <div 
              key={category.category}
              className={`${index < filteredCategories.length - 1 ? 'border-b border-white/10' : ''}`}
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
                  {category.guides.length} GUIDES
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                )}
              </button>

              {/* Category Guides */}
              {isExpanded && (
                <div className="border-t border-white/10">
                  {category.guides.map((guide, guideIndex) => (
                    <div
                      key={guide.title}
                      className={`p-4 pl-16 ${guideIndex < category.guides.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                      <div className="flex gap-4">
                        <span className="font-mono text-[10px] text-white/30 pt-0.5">
                          {String(guideIndex + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-mono text-xs uppercase tracking-[0.05em] text-white mb-1">
                            {guide.title}
                          </h4>
                          <p className="text-xs text-white/50 mb-3">{guide.description}</p>
                          
                          {/* Topics */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {guide.topics.map((topic) => (
                              <span
                                key={topic}
                                className="font-mono text-[9px] px-2 py-0.5 border border-white/10 text-white/30 uppercase tracking-wider"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                          
                          {/* Links */}
                          <div className="space-y-1">
                            {guide.links.map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-white/50 hover:text-white hover:bg-white/5 py-1 px-2 -ml-2 transition-colors group cursor-crosshair"
                              >
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback CTA */}
      <div className="mt-4 p-4 border border-white/10 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
        <MessageSquare className="w-4 h-4 text-white/30" strokeWidth={1.5} />
        <p className="text-xs text-white/40 flex-1">
          See something missing? Have a resource that's helped you?
        </p>
        <Link 
          to="/submitresource" 
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-white border border-white/20 px-3 py-1.5 hover:bg-white hover:text-black transition-colors cursor-crosshair"
        >
          Submit Resource
        </Link>
      </div>
    </section>
  );
}
