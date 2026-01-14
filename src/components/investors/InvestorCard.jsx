import { ArrowUpRight, MapPin, Landmark, TrendingUp } from "lucide-react";

const TYPE_LABELS = {
  vc: { label: "VC", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  angel: { label: "Angel", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  accelerator: { label: "Accelerator", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  cvc: { label: "CVC", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  family_office: { label: "Family Office", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  pe: { label: "PE", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  other: { label: "Other", color: "text-white/60 bg-white/5 border-white/10" },
};

const STAGE_LABELS = {
  early: "Early Stage",
  multi: "Multi-Stage",
  growth: "Growth",
  late: "Late Stage",
  unknown: "Stage Flexible",
  pre_seed: "Pre-Seed",
  seed: "Seed",
};

const formatCheckSize = (min, max) => {
  const format = (n) => {
    if (!n) return null;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  const minStr = format(min);
  const maxStr = format(max);
  if (minStr && maxStr) return `${minStr} - ${maxStr}`;
  if (minStr) return `${minStr}+`;
  if (maxStr) return `Up to ${maxStr}`;
  return null;
};

export default function InvestorCard({ investor, onClick }) {
  const {
    canonical_name,
    investor_type,
    stage_focus,
    sectors = [],
    hq_city,
    hq_state,
    is_midwest,
    check_size_min,
    check_size_max,
    website,
    mvip_score,
  } = investor;

  const typeConfig = TYPE_LABELS[investor_type] || TYPE_LABELS.other;
  const stageLabel = STAGE_LABELS[stage_focus] || stage_focus;
  const checkSize = formatCheckSize(check_size_min, check_size_max);
  const location = [hq_city, hq_state].filter(Boolean).join(", ");

  const handleExternalClick = (e) => {
    e.stopPropagation();
    if (website) {
      const url = website.startsWith("http") ? website : `https://${website}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] p-6 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm text-white font-medium truncate group-hover:text-blue-400 transition-colors">
            {canonical_name}
          </h3>
          {location && (
            <div className="flex items-center gap-1.5 mt-1 text-white/40 text-xs">
              <MapPin size={12} />
              <span>{location}</span>
              {is_midwest && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider">
                  Midwest
                </span>
              )}
            </div>
          )}
        </div>

        {/* External Link */}
        {website && (
          <button
            onClick={handleExternalClick}
            className="p-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all"
            title="Visit website"
          >
            <ArrowUpRight size={14} className="text-white/60 group-hover:text-white" />
          </button>
        )}
      </div>

      {/* Type & Stage */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
        {stageLabel && (
          <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-white/60 uppercase tracking-wider">
            {stageLabel}
          </span>
        )}
      </div>

      {/* Sectors */}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sectors.slice(0, 4).map((sector, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/50"
            >
              {sector}
            </span>
          ))}
          {sectors.length > 4 && (
            <span className="px-2 py-0.5 text-[10px] text-white/30">
              +{sectors.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        {checkSize ? (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Landmark size={12} />
            <span className="font-mono">{checkSize}</span>
          </div>
        ) : (
          <div />
        )}

        {mvip_score >= 60 && (
          <div className="flex items-center gap-1 text-green-400/60 text-[10px]">
            <TrendingUp size={10} />
            <span className="font-mono">High Signal</span>
          </div>
        )}
      </div>
    </div>
  );
}
