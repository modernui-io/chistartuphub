import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options...',
  maxItems = null,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option) => {
    if (selected.includes(option)) {
      // Remove if already selected
      onChange(selected.filter(item => item !== option));
    } else if (!maxItems || selected.length < maxItems) {
      // Add if under max limit
      onChange([...selected, option]);
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleRemove = (option, e) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && searchQuery === '' && selected.length > 0) {
      // Remove last item on backspace
      onChange(selected.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  const isMaxReached = maxItems && selected.length >= maxItems;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input Container */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          'min-h-[44px] px-3 py-2 rounded-xl border bg-white/[0.03] border-white/[0.08] cursor-text transition-all',
          'flex flex-wrap gap-1.5 items-center',
          isOpen && 'border-blue-500/50 ring-1 ring-blue-500/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Selected Pills */}
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300"
          >
            {item}
            <button
              type="button"
              onClick={(e) => handleRemove(item, e)}
              className="hover:bg-blue-500/30 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ''}
          disabled={disabled || isMaxReached}
          className={cn(
            'flex-1 min-w-[120px] bg-transparent text-white text-sm placeholder:text-white/30 outline-none',
            isMaxReached && 'hidden'
          )}
        />

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={cn(
            'text-white/40 transition-transform ml-auto flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Max Items Indicator */}
      {maxItems && (
        <div className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded',
          isMaxReached ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/40'
        )}>
          {selected.length}/{maxItems}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0f0f0f] border border-white/[0.1] rounded-xl shadow-xl">
          {/* Search indicator */}
          {searchQuery && (
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 text-white/40 text-xs">
              <Search size={12} />
              Searching "{searchQuery}"
            </div>
          )}

          {/* Options List - Scrollable */}
          <div
            className="overflow-y-scroll px-1 py-2"
            style={{
              maxHeight: '280px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-white/40 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                const isDisabled = isMaxReached && !isSelected;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => !isDisabled && handleSelect(option)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm rounded-lg transition-all flex items-center justify-between gap-2',
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-white/70 hover:bg-white/[0.05] hover:text-white',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={14} className="text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Single Select variant (for opportunity_category)
export function SingleSelect({
  options = [],
  selected = '',
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option === selected ? '' : option);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'h-11 px-3 rounded-xl border bg-white/[0.03] border-white/[0.08] cursor-pointer transition-all',
          'flex items-center justify-between gap-2',
          isOpen && 'border-blue-500/50 ring-1 ring-blue-500/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selected ? (
          <span className="inline-flex items-center gap-2 text-sm text-white">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {selected}
          </span>
        ) : (
          <span className="text-white/30 text-sm">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={cn('text-white/40 transition-transform', isOpen && 'rotate-180')}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 bg-[#0f0f0f] border border-white/[0.1] rounded-xl shadow-xl">
          {/* Search */}
          <div className="px-3 pb-2 mb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.03] rounded-lg">
              <Search size={14} className="text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto px-1">
            {/* Clear option */}
            {selected && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full px-3 py-2 text-left text-sm text-white/40 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
              >
                Clear selection
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm rounded-lg transition-all flex items-center justify-between gap-2',
                  selected === option
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                )}
              >
                <span>{option}</span>
                {selected === option && <Check size={14} className="text-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
