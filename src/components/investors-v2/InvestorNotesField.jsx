import React, { useState, useRef, useEffect } from 'react';

export function InvestorNotesField({ notes, onSave }) {
  const [value, setValue] = useState(notes || '');
  const [dirty, setDirty] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setValue(notes || '');
  }, [notes]);

  const handleChange = (e) => {
    const text = e.target.value.slice(0, 500);
    setValue(text);
    setDirty(true);

    // Auto-save after 1s of inactivity
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(text);
      setDirty(false);
    }, 1000);
  };

  const handleBlur = () => {
    clearTimeout(timerRef.current);
    if (dirty) {
      onSave(value);
      setDirty(false);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-3">
        Private Notes
      </h3>
      <textarea
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Add private notes about this investor..."
        maxLength={500}
        rows={3}
        className="w-full bg-black/40 border border-chi-ghost text-sm text-chi-silver placeholder:text-chi-dim p-3 focus:outline-none focus:border-white/50 transition-colors resize-none font-mono"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-chi-dim font-mono">
          {dirty ? 'Saving...' : ''}
        </span>
        <span className="text-[9px] text-chi-dim font-mono">
          {value.length}/500
        </span>
      </div>
    </div>
  );
}

export default InvestorNotesField;
