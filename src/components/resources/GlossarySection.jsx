import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const glossarySections = [
  {
    stage: "Business Legal Structures",
    subtitle: "Understanding the foundational legal frameworks for your startup",
    icon: "⚖️",
    definitions: [
      { term: "Sole Proprietorship", definition: "An unincorporated business owned by one individual. Easiest and least expensive to set up with minimal paperwork. However, there is no legal distinction between owner and business, meaning unlimited personal liability for business debts and obligations." },
      { term: "LLC (Limited Liability Company)", definition: "A hybrid legal entity offering liability protection like a corporation, but simpler operation. Pros: Limited personal liability, flexible taxation (pass-through or corporate), less complex than C-Corp. Cons: More expensive than sole proprietorship, some states have annual fees, potential for self-employment taxes." },
      { term: "C-Corp (C Corporation)", definition: "Standard corporation structure offering the strongest liability protection. It's a separate legal entity with unlimited shareholders. Most venture-backed startups are C-Corps. Subject to double taxation (corporate profits are taxed, then dividends are taxed again at individual level). Pros: Unlimited growth potential, can issue stock options, preferred by VCs. Cons: More complex compliance and reporting requirements, double taxation." },
      { term: "S-Corp (S Corporation)", definition: "An elective tax status (not a legal entity type) that passes income/losses directly to owners' personal income without corporate tax rates. Avoids double taxation. Pros: Pass-through taxation, limited liability. Cons: Stricter ownership rules (max 100 shareholders, all must be U.S. citizens/residents), not venture-fundable, no stock option flexibility." },
      { term: "Delaware C-Corp", definition: "Most venture-backed startups incorporate as Delaware C-Corps due to well-established corporate law, business-friendly courts, and investor familiarity. Even if your startup is in Chicago, you can incorporate in Delaware (though you'll need to register as a 'foreign entity' in Illinois if doing business there)." },
    ],
  },
  {
    stage: "Stage 1: Idea → Validation",
    subtitle: "Finding real evidence that you're solving a real problem for a specific group",
    icon: "💡",
    definitions: [
      { term: "Problem–Solution Fit", definition: "The first step. This is the evidence—from interviews and experiments—that a specific customer group agrees you are solving a painful, real-world problem for them." },
      { term: "ICP (Ideal Customer Profile)", definition: "A clear, specific description of the exact person or company that gets the most value from your solution and is easiest to sell to. At this stage, your ICP is a hypothesis you are testing." },
      { term: "Value Proposition", definition: "A short, clear statement on why your ideal customer should choose your solution. What is the specific value you promise to deliver?" },
      { term: "Bias Toward Action", definition: "The habit of running small, fast experiments (like interviews or a simple landing page) to get real-world answers instead of just debating theory." },
    ],
  },
  {
    stage: "Stage 2: Create → Refine",
    subtitle: "Building the solution (MVP) and looking for proof that people will actually use it",
    icon: "🔧",
    definitions: [
      { term: "Product/Market Fit (PMF)", definition: "The magic moment when you've built a product that a large group of people actively uses and would be very disappointed to lose. The market is pulling the product from you, not you pushing it on them." },
      { term: "Activation", definition: "The 'Aha!' moment. This is the first time a new user experiences the core value you promised. For a music app, it's not signing up; it's successfully playing their first song." },
      { term: "Retention Curve", definition: "A chart showing what percentage of your users (by start date) are still active over time. A curve that 'flattens' (doesn't go to zero) proves your product has durable, long-term value." },
      { term: "Growth Loop", definition: "A system where your own users create the 'fuel' for new growth. For example, a user shares a link (Referral), which brings in a new user (Acquisition), who then shares, starting the loop over." },
    ],
  },
  {
    stage: "Stage 3: Go-to-Market → Traction",
    subtitle: "Building a repeatable system for finding and keeping customers",
    icon: "🚀",
    definitions: [
      { term: "Positioning", definition: "Defining what 'box' your product fits in and how it's different from the competition, all in a way your Ideal Customer Profile (ICP) understands and cares about." },
      { term: "CAC (Customer Acquisition Cost)", definition: "The total amount you spend on sales and marketing (including salaries) to get one new paying customer." },
      { term: "LTV (or CLV)", definition: "'Lifetime Value.' The total profit you expect to make from an average customer over the entire time they stay with you." },
      { term: "CAC Payback", definition: "The number of months it takes for the profit from a new customer to 'pay back' the CAC you spent to get them. A healthy business has a short payback period (e.g., under 12 months)." },
    ],
  },
  {
    stage: "Stage 4: Fund → Scale",
    subtitle: "Fuel (capital) and efficiency to grow bigger, faster, and more sustainably",
    icon: "📈",
    definitions: [
      { term: "ARR / MRR", definition: "'Annual' or 'Monthly Recurring Revenue.' The standard, normalized way to measure the predictable revenue of a subscription business." },
      { term: "Gross Margin", definition: "The percentage of money left over from a sale after you subtract the direct costs of making/delivering the product (like server costs or raw materials)." },
      { term: "Runway", definition: "The number of months your company can stay in business before you run out of cash, based on your current spending rate (your 'burn')." },
      { term: "Cap Table", definition: "The official spreadsheet that lists every single owner (founders, investors, employees) of your company and what percentage they own." },
      { term: "Vesting & Cliff", definition: "The schedule for 'earning' stock options. A 1-year cliff means you get 0% of your options if you leave before one year. Vesting is the process of earning the rest in small pieces over time (e.g., 4 years)." },
    ],
  },
  {
    stage: "Legal & Compliance",
    subtitle: "Critical legal concepts throughout your journey",
    icon: "📋",
    definitions: [
      { term: "Trademark Search (USPTO TESS)", definition: "Checking the official government database to make sure your company or product name isn't already legally claimed by someone else. You do this before you spend money on branding." },
      { term: "83(b) Election", definition: "A critical, time-sensitive (30 days!) tax form. When you are granted founder stock (at a very low value), you file this to pay taxes on that low value now, so you don't pay massive taxes on its (hopefully huge) value later." },
      { term: "HIPAA", definition: "U.S. health data privacy & security standards. Absolutely mandatory if you handle healthcare data." },
      { term: "GDPR", definition: "EU personal-data regulation. Mandatory if you have European customers." },
    ],
  },
];

export default function GlossarySection({ searchQuery = "" }) {
  const [expandedSections, setExpandedSections] = useState([]);

  const toggleSection = (stage) => {
    setExpandedSections(prev => 
      prev.includes(stage) 
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  // Filter glossary based on search query
  const filteredSections = searchQuery.trim() === ""
    ? glossarySections
    : glossarySections
        .map((section) => ({
          ...section,
          definitions: section.definitions.filter((def) => {
            const query = searchQuery.toLowerCase();
            return (
              def.term.toLowerCase().includes(query) ||
              def.definition.toLowerCase().includes(query)
            );
          }),
        }))
        .filter((section) => section.definitions.length > 0);

  if (searchQuery.trim() !== "" && filteredSections.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <p className="text-white/50 text-sm">
          The language of fundraising and growth, decoded
        </p>
      </div>

      {/* Glossary Sections */}
      <div className="border border-white/10">
        {filteredSections.map((section, index) => {
          const isExpanded = expandedSections.includes(section.stage) || searchQuery.trim() !== "";
          
          return (
            <div 
              key={section.stage}
              className={`${index < filteredSections.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.stage)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-crosshair"
              >
                <span className="font-mono text-[10px] text-white/30">0{index + 1}</span>
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-lg">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white block">
                    {section.stage}
                  </span>
                  <span className="text-[10px] text-white/40">{section.subtitle}</span>
                </div>
                <span className="font-mono text-[10px] text-white/30 mr-2">
                  {section.definitions.length} TERMS
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                )}
              </button>

              {/* Section Definitions */}
              {isExpanded && (
                <div className="border-t border-white/10">
                  {section.definitions.map((def, defIndex) => (
                    <div
                      key={def.term}
                      className={`p-4 pl-16 ${defIndex < section.definitions.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                      <div className="flex gap-4">
                        <span className="font-mono text-[10px] text-white/20 pt-0.5">
                          {String(defIndex + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-mono text-xs uppercase tracking-[0.05em] text-white mb-2">
                            {def.term}
                          </h4>
                          <p className="text-xs text-white/50 leading-relaxed">{def.definition}</p>
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
    </section>
  );
}
