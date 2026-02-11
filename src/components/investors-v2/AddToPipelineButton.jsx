import React, { useState } from 'react';
import { KanbanSquare, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestorPipeline } from '@/hooks/useInvestorPipeline';

const STAGES = [
  { value: 'research', label: 'Research' },
  { value: 'reach_out', label: 'Reach Out' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'follow_up', label: 'Follow Up' },
];

export function AddToPipelineButton({ investorId, variant = 'full' }) {
  const { user, openLogin } = useAuth();
  const { isInPipeline, getItem, addToPipeline, updateStage } = useInvestorPipeline();
  const [open, setOpen] = useState(false);

  const inPipeline = isInPipeline(investorId);
  const item = inPipeline ? getItem(investorId) : null;
  const currentStage = item?.stage;

  const handleClick = () => {
    if (!user) {
      openLogin();
      return;
    }
    if (inPipeline) {
      setOpen(!open);
    } else {
      addToPipeline({ investorId, stage: 'research' });
    }
  };

  const handleStageSelect = (stage) => {
    if (inPipeline) {
      updateStage({ investorId, stage });
    } else {
      addToPipeline({ investorId, stage });
    }
    setOpen(false);
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className={cn(
            'p-3 border transition-colors',
            inPipeline
              ? 'border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
              : 'border-chi-ghost text-chi-muted hover:text-white hover:border-white'
          )}
          title={inPipeline ? `In pipeline: ${currentStage?.replace('_', ' ')}` : 'Add to pipeline'}
        >
          <KanbanSquare className="w-4 h-4" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-44 bg-chi-navy border border-chi-ghost z-[10000] shadow-lg">
              <div className="px-3 py-2 border-b border-chi-ghost">
                <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">Move to stage</span>
              </div>
              {STAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStageSelect(value)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/5 flex items-center justify-between',
                    value === currentStage ? 'text-emerald-400' : 'text-chi-silver'
                  )}
                >
                  {label}
                  {value === currentStage && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border text-xs font-mono uppercase tracking-[0.08em] transition-colors',
          inPipeline
            ? 'border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
            : 'border-chi-ghost text-chi-muted hover:text-white hover:border-white'
        )}
      >
        <KanbanSquare className="w-4 h-4" />
        {inPipeline ? (
          <>
            {currentStage?.replace('_', ' ')}
            <ChevronDown className="w-3 h-3" />
          </>
        ) : (
          'Add to Pipeline'
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-44 bg-chi-navy border border-chi-ghost z-[10000] shadow-lg">
            <div className="px-3 py-2 border-b border-chi-ghost">
              <span className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono">Move to stage</span>
            </div>
            {STAGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStageSelect(value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/5 flex items-center justify-between',
                  value === currentStage ? 'text-emerald-400' : 'text-chi-silver'
                )}
              >
                {label}
                {value === currentStage && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AddToPipelineButton;
