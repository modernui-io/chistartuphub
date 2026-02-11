import React, { useState } from 'react';
import { ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedLists } from '@/hooks/useSavedLists';

export function SaveListButton({ investors = [] }) {
  const { user, openLogin } = useAuth();
  const { saveList, isSaving } = useSavedLists();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim() || !investors.length) return;
    saveList({
      name: name.trim(),
      investorIds: investors.map((inv) => String(inv.id)),
    });
    setName('');
    setOpen(false);
  };

  if (!investors.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!user) { openLogin(); return; }
          setOpen(!open);
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 border transition-colors font-mono text-[10px] uppercase tracking-[0.1em]',
          'border-chi-ghost text-chi-muted hover:border-white hover:text-white'
        )}
        title="Save current results as a list"
      >
        <ListPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Save List</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-72 bg-chi-navy border border-chi-ghost z-[10000] shadow-lg p-4">
            <label className="text-[9px] uppercase tracking-[0.15em] text-chi-dim font-mono block mb-2">
              List Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Series A Healthcare VCs"
              maxLength={60}
              autoFocus
              className="w-full bg-black/40 border border-chi-ghost text-sm text-white placeholder:text-chi-dim p-2 focus:outline-none focus:border-white/50 font-mono mb-3"
            />
            <p className="text-[10px] text-chi-dim font-mono mb-3">
              Saves {investors.length} investor{investors.length !== 1 ? 's' : ''} as a static list
            </p>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="w-full py-2 bg-white text-chi-navy font-mono text-xs uppercase tracking-[0.1em] hover:bg-chi-silver transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save List'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SaveListButton;
