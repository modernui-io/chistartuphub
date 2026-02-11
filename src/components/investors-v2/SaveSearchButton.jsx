import React, { useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export function SaveSearchButton({ query, searchMode, filters, activeCategory }) {
  const { user, openLogin } = useAuth();
  const { saveSearch, isSaving } = useSavedSearches();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    saveSearch({
      name: name.trim(),
      query,
      searchMode,
      filters,
      activeCategory,
    });
    setName('');
    setOpen(false);
  };

  if (!query?.trim()) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!user) { openLogin(); return; }
          setOpen(!open);
        }}
        className={cn(
          'flex items-center gap-2 px-4 py-3 border transition-colors font-mono text-[10px] uppercase tracking-[0.1em]',
          'border-chi-ghost text-chi-muted hover:border-white hover:text-white'
        )}
        title="Save this search"
      >
        <BookmarkPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Save Search</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-72 bg-chi-navy border border-chi-ghost z-[10000] shadow-lg p-4">
            <label className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono block mb-2">
              Search Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Chicago Seed VCs"
              maxLength={60}
              autoFocus
              className="w-full bg-black/40 border border-chi-ghost text-sm text-white placeholder:text-chi-dim p-2 focus:outline-none focus:border-white/50 font-mono mb-3"
            />
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] font-mono border',
                searchMode === 'semantic'
                  ? 'border-purple-400/40 text-purple-400'
                  : 'border-chi-ghost text-chi-silver'
              )}>
                {searchMode === 'semantic' ? 'AI' : 'Boolean'}
              </span>
              <span className="text-[10px] text-chi-dim font-mono truncate flex-1">
                "{query.substring(0, 40)}{query.length > 40 ? '...' : ''}"
              </span>
            </div>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="w-full py-2 bg-white text-chi-navy font-mono text-xs uppercase tracking-[0.1em] hover:bg-chi-silver transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SaveSearchButton;
