import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAuth } from '@/contexts/AuthContext';

export function SavedSearchesPanel({ onRestore }) {
  const { user } = useAuth();
  const { savedSearches, deleteSearch, isLoading } = useSavedSearches();
  const [expanded, setExpanded] = useState(false);

  if (!user || savedSearches.length === 0) return null;

  return (
    <div className="border border-chi-ghost/30 bg-black/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-chi-dim" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-chi-muted font-mono">
            Saved Searches
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-chi-silver font-mono">
            {savedSearches.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-chi-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-chi-dim" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-chi-ghost/30 max-h-64 overflow-y-auto">
          {savedSearches.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-chi-ghost/20 last:border-b-0 hover:bg-white/[0.02] group"
            >
              <button
                onClick={() => onRestore(s)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-white font-mono truncate">{s.name}</span>
                  <span className={cn(
                    'px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] font-mono border flex-shrink-0',
                    s.search_mode === 'semantic'
                      ? 'border-purple-400/40 text-purple-400'
                      : 'border-chi-ghost text-chi-silver'
                  )}>
                    {s.search_mode === 'semantic' ? 'AI' : 'BOOL'}
                  </span>
                </div>
                <span className="text-[10px] text-chi-dim font-mono truncate block">
                  "{s.query.substring(0, 50)}{s.query.length > 50 ? '...' : ''}"
                </span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSearch(s.id); }}
                className="p-1.5 text-chi-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedSearchesPanel;
