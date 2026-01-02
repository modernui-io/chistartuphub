import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FilterDropdown - The Bureau Filter Selector
 * Technical specification style: [FILTER: ALL]
 * Instant hover invert effect
 */
export function FilterDropdown({
  isOpen,
  onToggle,
  value,
  options,
  onSelect,
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className="
          font-mono text-sm uppercase tracking-wider
          text-white/60 hover:bg-white hover:text-black
          px-4 py-2 transition-none duration-0
        "
      >
        [FILTER: {value}]
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="
              absolute right-0 top-full mt-px
              bg-[#050A14]/95 backdrop-blur-md
              border border-white/15 z-50
            "
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`
                  w-full text-left px-4 py-3
                  font-mono text-sm uppercase tracking-wider
                  transition-none duration-0
                  ${value === option
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:bg-white hover:text-black'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterDropdown;
