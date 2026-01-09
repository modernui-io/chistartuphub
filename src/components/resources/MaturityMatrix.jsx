import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Box, Megaphone, Settings, Brain, X, ArrowUpRight, ArrowRight, Compass } from "lucide-react";

const phases = [
  {
    number: 1,
    title: "Validate",
    subtitle: "(Discover and Refine)",
  },
  {
    number: 2,
    title: "Systematize",
    subtitle: "(Build the Engine)",
  },
  {
    number: 3,
    title: "Scale",
    subtitle: "(Expand and Impact)",
  },
];

const dimensions = [
  {
    icon: Box,
    label: "Problem",
    cells: [
      {
        question: "Whose pain do we remove?",
        subtext: "Are we solving a real problem for a specific audience?",
        troubleshootingQuestions: [
          "Can you describe the specific pain point in one sentence?",
          "Have you interviewed at least 10 potential users about this problem?",
          "Can users clearly articulate why existing solutions don't work?",
          "Do you have evidence that people are actively trying to solve this problem today?",
        ],
      },
      {
        question: "How do we embed feedback?",
        subtext: "Are we building repeatable systems to capture insights?",
        troubleshootingQuestions: [
          "Do you have a documented process for collecting user feedback?",
          "How quickly can you implement changes based on user insights?",
          "Are you tracking feedback metrics consistently?",
          "Do you have regular check-ins scheduled with your core users?",
        ],
      },
      {
        question: "How do we stay ahead?",
        subtext: "Are we anticipating market shifts and new user needs?",
        troubleshootingQuestions: [
          "Do you have regular check-ins with users about emerging needs?",
          "Are you monitoring competitor movements and market trends?",
          "Do you have a roadmap that anticipates future user problems?",
          "Are you testing new problem areas quarterly?",
        ],
      },
    ],
  },
  {
    icon: Megaphone,
    label: "Growth",
    cells: [
      {
        question: "How do we reach our first users?",
        subtext: "Are we finding initial, non-scalable ways to get traction?",
        troubleshootingQuestions: [
          "Have you identified where your target users spend time online and offline?",
          "Are you personally reaching out and having conversations with potential users?",
          "Have you tested at least 3 different acquisition channels?",
          "Do you know which channels are bringing you the highest-quality users?",
        ],
      },
      {
        question: "How do we reach our target audience?",
        subtext: "Are we building a repeatable, predictable engine for acquisition?",
        troubleshootingQuestions: [
          "Do you know your cost per acquisition for each channel?",
          "Can you predict how many users you'll acquire next month?",
          "Have you documented your acquisition playbook?",
          "Are 1-2 channels consistently delivering results?",
        ],
      },
      {
        question: "How do we expand our reach?",
        subtext: "Are we diversifying channels and optimizing for market share?",
        troubleshootingQuestions: [
          "Are you active in at least 4-5 acquisition channels?",
          "Do you have automated systems for scaling your best channels?",
          "Are you testing new channels quarterly?",
          "Can your growth machine operate without founder involvement?",
        ],
      },
    ],
  },
  {
    icon: Settings,
    label: "Operations",
    cells: [
      {
        question: "How do we deliver the outcome?",
        subtext: "Can we manually and reliably produce results for early users?",
        troubleshootingQuestions: [
          "Can you successfully deliver value to users without automation?",
          "Do you understand every step of your delivery process?",
          "Are users getting the outcome they expected?",
          "Can you explain your operations to someone else clearly?",
        ],
      },
      {
        question: "Can we produce outcomes repeatedly?",
        subtext: "Are we documenting and automating processes to remove the founder?",
        troubleshootingQuestions: [
          "Have you documented your key operational processes?",
          "Could someone else deliver the same quality without you?",
          "What percentage of your operations are automated?",
          "Do you have quality control metrics in place?",
        ],
      },
      {
        question: "How do we deliver at scale?",
        subtext: "Are we building distributed, high-quality systems?",
        troubleshootingQuestions: [
          "Can your systems handle 10x current volume?",
          "Do you have monitoring and quality control in place?",
          "Are your operations distributed across teams or regions?",
          "Have you stress-tested your infrastructure?",
        ],
      },
    ],
  },
  {
    icon: Brain,
    label: "Brand",
    cells: [
      {
        question: "What do people believe about us?",
        subtext: "What is the initial perception we are creating with early users?",
        troubleshootingQuestions: [
          "Can users describe what makes you different in one sentence?",
          "What emotions do users associate with your product?",
          "Do users recommend you, and what do they say?",
          "Is your messaging resonating with your target audience?",
        ],
      },
      {
        question: "How do we codify our identity?",
        subtext: "Are we creating consistent messaging and brand assets?",
        troubleshootingQuestions: [
          "Do you have documented brand guidelines?",
          "Is your messaging consistent across all channels?",
          "Can your team articulate your brand positioning clearly?",
          "Do you have a content strategy that reinforces your brand?",
        ],
      },
      {
        question: "How do we own our category?",
        subtext: "Are we becoming the default choice in our market?",
        troubleshootingQuestions: [
          "Are you the first name mentioned in your category?",
          "Do you have significant market share in your target segment?",
          "Are competitors positioning themselves relative to you?",
          "Do you have strong brand recognition metrics?",
        ],
      },
    ],
  },
];

function MatrixCellModal({ isOpen, onClose, dimension, phase, question, subtext, troubleshootingQuestions }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/90"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-[#050A14] border border-white/20 w-full md:max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col md:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 pr-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">
              [{dimension.toUpperCase()}: PHASE_{phase}]
            </span>
            <h2 className="font-serif text-xl md:text-2xl text-white mb-2">{question}</h2>
            <p className="text-sm text-white/50">{subtext}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-white/20 hover:bg-white hover:text-black transition-colors cursor-crosshair"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">
            [TROUBLESHOOTING_QUESTIONS]
          </span>

          <div className="border border-white/10">
            {troubleshootingQuestions.map((q, index) => (
              <div
                key={index}
                className="border-b border-white/10 last:border-b-0 p-4 flex gap-4"
              >
                <span className="font-mono text-[10px] text-white/30 pt-0.5">0{index + 1}</span>
                <p className="text-sm text-white/70 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-white/50 leading-relaxed">
              <span className="text-white font-medium">Pro tip:</span> Use these questions to assess where you
              truly are in this phase. If you can't answer "yes" to most of them, you may need to focus more
              energy here before moving forward.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Mobile card view for a single dimension
function MobileDimensionCard({ dimension, onCellClick }) {
  const Icon = dimension.icon;

  return (
    <div className="border border-white/10">
      {/* Dimension Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/[0.02]">
        <Icon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
          {dimension.label}
        </span>
      </div>

      {/* Cells */}
      <div>
        {dimension.cells.map((cell, index) => (
          <button
            key={index}
            onClick={() => onCellClick({
              dimension: dimension.label,
              phase: index + 1,
              question: cell.question,
              subtext: cell.subtext,
              troubleshootingQuestions: cell.troubleshootingQuestions,
            })}
            className="w-full p-4 text-left border-b border-white/10 last:border-b-0 hover:bg-white hover:text-black transition-colors flex items-start gap-3 group cursor-crosshair"
          >
            <span className="font-mono text-[10px] text-white/30 group-hover:text-black/50 pt-0.5">
              0{index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-white group-hover:text-black mb-1 leading-snug">
                {cell.question}
              </h5>
              <p className="text-xs text-white/40 group-hover:text-black/60 line-clamp-2">{cell.subtext}</p>
            </div>
            <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-black/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MaturityMatrix() {
  const [selectedCell, setSelectedCell] = useState(null);

  return (
    <section id="maturity-matrix" className="mb-12">
      {/* Header */}
      <div className="mb-6">
        <span className="bureau-label block mb-3">[FROM_THE_STARTUP_MATURITY_ATLAS]</span>
        <h2 className="font-serif text-2xl md:text-3xl text-white mb-2">
          Startup Maturity Matrix
        </h2>
        <p className="text-white/40 text-sm max-w-2xl">
          A framework to diagnose where you are and identify your next focus area across four critical dimensions. 
          <span className="text-white/60"> Click any cell to explore troubleshooting questions.</span>
        </p>
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-4 mb-6">
        {/* Phase Legend */}
        <div className="flex border border-white/10">
          {phases.map((phase, index) => (
            <div
              key={phase.number}
              className={`flex-1 p-3 text-center ${index < phases.length - 1 ? 'border-r border-white/10' : ''}`}
            >
              <div className="font-mono text-[10px] text-white/30 mb-1">PHASE {phase.number}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-white">{phase.title}</div>
            </div>
          ))}
        </div>

        {/* Dimension Cards */}
        {dimensions.map((dimension) => (
          <MobileDimensionCard
            key={dimension.label}
            dimension={dimension}
            onCellClick={setSelectedCell}
          />
        ))}
      </div>

      {/* Desktop View - Grid */}
      <div className="hidden md:block overflow-x-auto">
        <div className="border border-white/10 min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-[180px_1fr_1fr_1fr] border-b border-white/10">
            {/* Empty corner cell */}
            <div className="p-4 border-r border-white/10 bg-white/[0.02]" />

            {/* Phase headers */}
            {phases.map((phase, index) => (
              <div
                key={phase.number}
                className={`p-4 text-center bg-white/[0.02] ${index < phases.length - 1 ? 'border-r border-white/10' : ''}`}
              >
                <div className="font-mono text-[10px] text-white/30 mb-1">PHASE {phase.number}</div>
                <div className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-0.5">
                  {phase.title}
                </div>
                <div className="text-[10px] text-white/40">{phase.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Dimension rows */}
          {dimensions.map((dimension, dimIndex) => {
            const Icon = dimension.icon;
            return (
              <div 
                key={dimension.label} 
                className={`grid grid-cols-[180px_1fr_1fr_1fr] ${dimIndex < dimensions.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                {/* Dimension label */}
                <div className="p-4 border-r border-white/10 bg-white/[0.02] flex items-center gap-3">
                  <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    {dimension.label}
                  </span>
                </div>

                {/* Cells for each phase */}
                {dimension.cells.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedCell({
                        dimension: dimension.label,
                        phase: index + 1,
                        question: cell.question,
                        subtext: cell.subtext,
                        troubleshootingQuestions: cell.troubleshootingQuestions,
                      });
                    }}
                    className={`p-4 text-left hover:bg-white hover:text-black transition-colors group cursor-crosshair ${index < dimension.cells.length - 1 ? 'border-r border-white/10' : ''}`}
                  >
                    <h5 className="text-sm font-medium text-white group-hover:text-black mb-1 leading-snug">
                      {cell.question}
                    </h5>
                    <p className="text-xs text-white/40 group-hover:text-black/60 leading-relaxed">{cell.subtext}</p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 p-4 border border-white/10 bg-white/[0.02]">
        <p className="text-white/50 text-xs leading-relaxed">
          <span className="text-white font-medium">Note:</span> The startup journey isn't linear—founders loop back
          between stages constantly. This matrix is meant to orient, not prescribe. Use it as a compass, not a
          schedule.
        </p>
      </div>

      {/* Assessment CTA */}
      <div className="mt-4 p-4 border border-white/20 bg-white/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-white/50" strokeWidth={1.5} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
              Find Your Position
            </p>
            <p className="text-white/40 text-xs">
              Take a quick assessment to see where you are on the matrix
            </p>
          </div>
        </div>
        <Link to="/assessment">
          <button className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 cursor-crosshair whitespace-nowrap">
            Take Assessment
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </Link>
      </div>

      <MatrixCellModal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        dimension={selectedCell?.dimension || ""}
        phase={selectedCell?.phase || 1}
        question={selectedCell?.question || ""}
        subtext={selectedCell?.subtext || ""}
        troubleshootingQuestions={selectedCell?.troubleshootingQuestions || []}
      />
    </section>
  );
}
