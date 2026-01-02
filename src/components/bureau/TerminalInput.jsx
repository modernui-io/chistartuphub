import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";

/**
 * TerminalInput - The Bureau Search Bar
 * A minimal search input with:
 * - No background, no surrounding border
 * - Single border-bottom only
 * - Monospace uppercase placeholder
 * - Optional filter dropdown integration
 */
export const TerminalInput = forwardRef(function TerminalInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onClear,
  placeholder = "SEARCH BY KEYWORD...",
  className = "",
  showClear = true,
  rightElement,
}, ref) {
  return (
    <div className={`flex items-center border-b border-white/30 ${className}`}>
      {/* Search Icon */}
      <Search
        className="w-5 h-5 text-white/40 flex-shrink-0"
        strokeWidth={1.5}
      />

      {/* Input Field */}
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="
          flex-1 bg-transparent px-4 py-5
          text-white placeholder-white/30
          focus:outline-none
          font-mono text-sm uppercase tracking-wider
        "
      />

      {/* Clear Button */}
      {showClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="p-2 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}

      {/* Right Element (e.g., Filter Dropdown) */}
      {rightElement && (
        <>
          <div className="h-6 w-px bg-white/20 mx-4" />
          {rightElement}
        </>
      )}
    </div>
  );
});

export default TerminalInput;
