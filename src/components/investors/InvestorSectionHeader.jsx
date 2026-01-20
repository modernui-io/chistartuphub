import { Building2, User, MapPin } from "lucide-react";

const QUICK_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'vc', label: 'VCs', icon: Building2 },
  { id: 'angel', label: 'Angels', icon: User },
  { id: 'midwest', label: 'Midwest', icon: MapPin },
];

export default function InvestorSectionHeader({
  investorCount,
  activeFilter,
  onFilterClick,
  isSticky = false,
}) {
  return (
    <div
      className={`
        flex items-center justify-between gap-4 py-4 px-4
        transition-all duration-300
        ${isSticky
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
        }
      `}
    >
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em]">
          [INVESTORS]
        </span>
        <span className="font-mono text-xs text-white/30">
          {investorCount} total
        </span>
      </div>

      {/* Quick filter pills */}
      <div className="flex items-center gap-1.5">
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => onFilterClick(filter.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                font-mono text-[10px] uppercase tracking-[0.1em]
                border transition-all duration-200
                ${isActive
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/50 border-white/15 hover:text-white hover:border-white/30'
                }
              `}
            >
              {Icon && <Icon size={10} strokeWidth={1.5} />}
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
