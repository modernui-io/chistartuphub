import React, { useState } from 'react';
import { Braces, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOOLEAN_OPERATORS = [
  { operator: 'AND',      example: 'fintech AND seed',        desc: 'Both terms must appear' },
  { operator: 'OR',       example: 'health OR biotech',       desc: 'Either term matches' },
  { operator: 'NOT',      example: 'NOT crypto',              desc: 'Exclude results with term' },
  { operator: '- (dash)', example: '-crypto',                 desc: 'Shorthand for NOT' },
  { operator: '" "',      example: '"series a"',              desc: 'Exact phrase match' },
];

const BOOLEAN_EXAMPLES = [
  { query: '"sequoia capital"',                      what: 'Find exact firm name' },
  { query: 'fintech AND chicago',                    what: 'Both keywords required' },
  { query: 'health OR biotech AND seed',             what: 'Health-related OR biotech seed investors' },
  { query: 'midwest -crypto -blockchain',            what: 'Midwest investors, exclude crypto/blockchain' },
  { query: '"early stage" AND (fintech OR saas)',     what: 'Early stage in fintech or SaaS' },
];

const SEMANTIC_EXAMPLES = [
  { query: 'VCs investing in climate tech at pre-seed in the midwest', what: 'Understands meaning — matches "seed," "clean energy," "Chicago"' },
  { query: 'early stage investors focused on AI and machine learning',  what: 'Knows AI = ML = artificial intelligence' },
  { query: 'diverse fund managers backing consumer startups',           what: 'Finds by theme, not exact keywords' },
  { query: 'fintech ai early stage investor midwest',                   what: 'Treats this as a natural description, not 5 AND\'d keywords' },
];

const SEMANTIC_REFINE_EXAMPLES = [
  { before: 'climate tech midwest investors',            after: 'climate tech midwest investors NOT crypto', what: 'Exclude crypto — keeps results matching any of your other words' },
  { before: 'AI startups seed stage',                    after: 'AI startups seed stage AND chicago',       what: 'Narrow down — AND requires both terms to appear' },
  { before: 'consumer health investors',                 after: 'consumer health investors -blockchain',    what: 'Quick exclude — dash is shorthand for NOT' },
];

export function SearchModeToggle({ mode, onModeChange }) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-0">
      {/* Toggle Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim font-mono mr-1">
          Search Mode
        </span>

        {/* Boolean Button */}
        <button
          onClick={() => onModeChange('boolean')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border transition-all duration-200 font-mono text-[10px] uppercase tracking-[0.1em]",
            mode === 'boolean'
              ? "border-white bg-white text-chi-navy"
              : "border-chi-ghost text-chi-muted hover:border-white/50 hover:text-white"
          )}
        >
          <Braces className="w-3 h-3" />
          Boolean
        </button>

        {/* Semantic Button */}
        <button
          onClick={() => onModeChange('semantic')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border transition-all duration-200 font-mono text-[10px] uppercase tracking-[0.1em]",
            mode === 'semantic'
              ? "border-chi-signal bg-chi-signal/20 text-chi-signal"
              : "border-chi-ghost text-chi-muted hover:border-chi-signal/50 hover:text-chi-signal/80"
          )}
        >
          <Sparkles className="w-3 h-3" />
          Semantic Search
          <span className="text-[8px] px-1 py-px bg-chi-signal/20 border border-chi-signal/40 rounded-sm tracking-[0.15em]">BETA</span>
        </button>

        {/* Guide Toggle */}
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex items-center gap-1 ml-auto px-2 py-1 text-chi-muted hover:text-white transition-colors font-mono text-[10px] uppercase tracking-[0.1em]"
        >
          How it works
          {guideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Search Guide (collapsible) */}
      {guideOpen && (
        <div className="mt-3 border border-chi-ghost/30 bg-black/40 backdrop-blur-sm">

          {mode === 'boolean' ? (
            <>
              {/* Boolean Mode Guide */}
              <div className="px-4 py-2.5 border-b border-chi-ghost/20">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white font-mono">
                  Boolean Search
                </span>
                <p className="text-[11px] text-chi-muted font-mono mt-1 leading-relaxed">
                  Exact keyword matching — results filter instantly as you type. Use operators to build precise queries across the full database.
                </p>
              </div>

              {/* Operators */}
              <div className="px-4 py-2 border-b border-chi-ghost/20">
                <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">
                  Operators
                </span>
              </div>
              <div className="divide-y divide-chi-ghost/10">
                {BOOLEAN_OPERATORS.map((row) => (
                  <div key={row.operator} className="flex items-center gap-4 px-4 py-2">
                    <code className="text-[11px] text-chi-signal font-mono w-16 shrink-0">
                      {row.operator}
                    </code>
                    <code className="text-[11px] text-white/70 font-mono flex-1">
                      {row.example}
                    </code>
                    <span className="text-[10px] text-chi-muted font-mono text-right">
                      {row.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Examples */}
              <div className="px-4 py-2 border-t border-chi-ghost/20">
                <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">
                  Examples
                </span>
              </div>
              <div className="divide-y divide-chi-ghost/10">
                {BOOLEAN_EXAMPLES.map((row) => (
                  <div key={row.query} className="flex items-start gap-3 px-4 py-2">
                    <code className="text-[11px] text-white/80 font-mono flex-1 shrink-0">
                      {row.query}
                    </code>
                    <span className="text-[10px] text-chi-muted font-mono text-right">
                      {row.what}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-chi-ghost/20 bg-white/[0.02]">
                <p className="text-[10px] text-chi-dim font-mono">
                  Tip: AND has higher precedence than OR — <code className="text-white/60">a OR b AND c</code> means <code className="text-white/60">a OR (b AND c)</code>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Semantic Mode Guide */}
              <div className="px-4 py-2.5 border-b border-chi-ghost/20">
                <span className="text-[10px] uppercase tracking-[0.15em] text-chi-signal font-mono">
                  Semantic Search
                </span>
                <p className="text-[11px] text-chi-muted font-mono mt-1 leading-relaxed">
                  Understands meaning, not just keywords. Type naturally — "fintech ai early stage midwest" is treated
                  as a description of what you want, not 5 keywords that all must match. Press Enter to search.
                  When you refine with operators, words default to OR (inclusive) so you see the full playing field. Use AND to narrow.
                </p>
              </div>

              {/* How it's different */}
              <div className="px-4 py-2 border-b border-chi-ghost/20">
                <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">
                  How it reads your query
                </span>
              </div>
              <div className="divide-y divide-chi-ghost/10">
                {SEMANTIC_EXAMPLES.map((row) => (
                  <div key={row.query} className="px-4 py-2.5">
                    <code className="text-[11px] text-white/80 font-mono block">
                      {row.query}
                    </code>
                    <span className="text-[10px] text-chi-muted font-mono mt-1 block">
                      → {row.what}
                    </span>
                  </div>
                ))}
              </div>

              {/* Refining with Boolean */}
              <div className="px-4 py-2 border-t border-chi-ghost/20">
                <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">
                  Refine with Boolean — add operators after results load
                </span>
              </div>
              <div className="divide-y divide-chi-ghost/10">
                {SEMANTIC_REFINE_EXAMPLES.map((row) => (
                  <div key={row.before} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-white/40 font-mono line-through">
                        {row.before}
                      </code>
                      <span className="text-[10px] text-chi-dim">→</span>
                      <code className="text-[11px] text-white/80 font-mono">
                        {row.after}
                      </code>
                    </div>
                    <span className="text-[10px] text-chi-muted font-mono mt-1 block">
                      {row.what}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-chi-ghost/20 bg-white/[0.02]">
                <p className="text-[10px] text-chi-dim font-mono">
                  Tip: Refining is inclusive by default — words act as OR so you see the broad playing field. Use <code className="text-white/60">AND</code> to require specific terms, <code className="text-white/60">NOT</code> or <code className="text-white/60">-</code> to exclude.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchModeToggle;
