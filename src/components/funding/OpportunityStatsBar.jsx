import { Flame, Gift, Rocket, Trophy } from "lucide-react";

const STAT_CONFIGS = [
  {
    id: 'hot',
    label: 'Hot',
    icon: Flame,
    getCount: (stats) => stats.hot,
    color: 'text-orange-400',
    activeColor: 'bg-orange-500 text-white'
  },
  {
    id: 'Grant',
    label: 'Grants',
    icon: Gift,
    getCount: (stats) => stats.grants,
    color: 'text-green-400',
    activeColor: 'bg-green-500 text-white'
  },
  {
    id: 'Accelerator',
    label: 'Accelerators',
    icon: Rocket,
    getCount: (stats) => stats.accelerators,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500 text-white'
  },
  {
    id: 'Competition',
    label: 'Competitions',
    icon: Trophy,
    getCount: (stats) => stats.competitions,
    color: 'text-purple-400',
    activeColor: 'bg-purple-500 text-white'
  },
];

export default function OpportunityStatsBar({ stats, activeFilter, onFilterClick }) {
  return (
    <div className="grid grid-cols-4 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
      {STAT_CONFIGS.map((config, index) => {
        const Icon = config.icon;
        const count = config.getCount(stats);
        const isActive = activeFilter === config.id;
        const isLast = index === STAT_CONFIGS.length - 1;

        return (
          <button
            key={config.id}
            onClick={() => onFilterClick(config.id)}
            className={`
              group relative p-4 md:p-5 transition-all duration-200
              ${!isLast ? 'border-r border-white/10' : ''}
              ${isActive
                ? `${config.activeColor}`
                : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
              }
            `}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-50" />
            )}

            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon
                  size={14}
                  className={isActive ? 'opacity-80' : `${config.color} opacity-60`}
                  strokeWidth={1.5}
                />
                <span
                  className={`
                    font-mono text-xl md:text-2xl font-light
                    ${isActive ? '' : config.color}
                  `}
                >
                  {count}
                </span>
              </div>
              <span
                className={`
                  font-mono text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em]
                  ${isActive ? 'opacity-70' : 'text-white/40'}
                `}
              >
                {config.label}
              </span>
            </div>

            {/* Hover hint */}
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/0 group-hover:bg-white/[0.02] transition-colors pointer-events-none">
                <span className="opacity-0 group-hover:opacity-100 absolute bottom-1.5 right-2 font-mono text-[8px] text-white/30 uppercase tracking-wider transition-opacity hidden md:block">
                  Filter
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
