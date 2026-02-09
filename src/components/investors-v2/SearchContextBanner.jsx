import React from 'react';

export function SearchContextBanner({ message }) {
  if (!message) return null;

  return (
    <div className="border-l-2 border-l-amber-400 bg-black/40 px-5 py-4 mb-6">
      <div className="font-mono text-sm text-amber-400 font-semibold mb-1">
        {message.title}
      </div>
      <div className="font-mono text-xs text-chi-muted leading-relaxed">
        {message.body}
      </div>
    </div>
  );
}

export default SearchContextBanner;
