import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useInvestorPipeline } from '@/hooks/useInvestorPipeline';
import { PipelineCard } from './PipelineCard';
import { PipelineHeader } from './PipelineHeader';
import { InvestorModal } from '@/components/investors-v2/InvestorModal';
import { KanbanSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
  { stage: 'research', label: 'Research', accent: 'border-t-blue-400' },
  { stage: 'reach_out', label: 'Reach Out', accent: 'border-t-amber-400' },
  { stage: 'feedback', label: 'Feedback / Notes', accent: 'border-t-purple-400' },
  { stage: 'follow_up', label: 'Follow Up', accent: 'border-t-emerald-400' },
];

export function PipelineBoard() {
  const { pipelineItems, isLoading, getByStage, updateStage, removeFromPipeline } = useInvestorPipeline();
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const navigate = useNavigate();

  const filteredItems = tagFilter
    ? pipelineItems.filter((p) => p.tag === tagFilter)
    : pipelineItems;

  if (isLoading) {
    return (
      <div className="border border-white/10 p-16 text-center bg-black/40">
        <div className="font-mono text-2xl text-white mb-4 animate-pulse">LOADING</div>
        <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
          Fetching pipeline...
        </p>
      </div>
    );
  }

  if (pipelineItems.length === 0) {
    return (
      <div className="border border-white/10 p-16 text-center bg-black/40">
        <KanbanSquare className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">
          [EMPTY_PIPELINE]
        </span>
        <p className="text-white/40 mb-6">
          Your investor pipeline is empty. Browse investors and add them to start tracking your outreach.
        </p>
        <button
          onClick={() => navigate('/investors')}
          className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
        >
          Browse Investors
        </button>
      </div>
    );
  }

  const getColumnItems = (stage) => {
    const items = tagFilter
      ? filteredItems.filter((p) => p.stage === stage)
      : getByStage(stage);
    return items;
  };

  return (
    <div>
      <PipelineHeader
        pipelineItems={pipelineItems}
        activeTagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
      />

      {/* Kanban Board */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ stage, label, accent }) => {
          const items = getColumnItems(stage);
          return (
            <div
              key={stage}
              className={cn('border border-white/10 bg-black/20 min-h-[200px]', 'border-t-2', accent)}
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white">
                  {label}
                </span>
                <span className="font-mono text-[10px] text-white/40 px-1.5 py-0.5 bg-white/5">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.1em]">
                      No investors
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <PipelineCard
                      key={item.id}
                      item={item}
                      onStageChange={(investorId, newStage) =>
                        updateStage({ investorId, stage: newStage })
                      }
                      onRemove={(investorId) => removeFromPipeline(investorId)}
                      onInvestorClick={(inv) => setSelectedInvestor(inv)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <InvestorModal
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
      />
    </div>
  );
}

export default PipelineBoard;
