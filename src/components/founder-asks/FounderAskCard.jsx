import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  MessageCircle,
  Building2,
  Clock,
  TrendingUp,
  Megaphone,
  EyeOff,
  HandHelping,
  Eye,
  Sparkles,
  Lock,
} from 'lucide-react';
import OptimizedImage from "@/components/OptimizedImage";

// ============================================
// CATEGORY CONFIG
// ============================================

const CATEGORY_CONFIG = {
  fundraising: {
    icon: DollarSign,
    label: 'Fundraising Guidance',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
  },
  fundraising_guidance: {
    icon: DollarSign,
    label: 'Fundraising Guidance',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
  },
  cofounder: {
    icon: Users,
    label: 'Co-founder',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
  },
  general_advice: {
    icon: MessageCircle,
    label: 'General Advice',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
  },
};

// ============================================
// FOUNDER ASK CARD COMPONENT
// ============================================

// Helper to check if created within last 24 hours
function isNewToday(createdAtRaw) {
  if (!createdAtRaw) return false;
  const createdDate = new Date(createdAtRaw);
  const now = new Date();
  const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

export default function FounderAskCard({ ask, index, onHelp }) {
  const categoryConfig = CATEGORY_CONFIG[ask.category] || CATEGORY_CONFIG.general_advice;
  const CategoryIcon = categoryConfig.icon;

  // Calculate days remaining
  const daysRemaining = ask.expiresAt
    ? Math.max(0, Math.ceil((new Date(ask.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  // Check if new today
  const isNew = isNewToday(ask.createdAtRaw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-white/10 hover:border-white/20 transition-colors group"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        {/* Index */}
        <span className="font-mono text-[10px] text-white/20">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Category Badge */}
        <div className={`flex items-center gap-2 px-2 py-1 ${categoryConfig.bgColor} ${categoryConfig.borderColor} border`}>
          <CategoryIcon className={`w-3 h-3 ${categoryConfig.color}`} strokeWidth={1.5} />
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
        </div>

        {/* Sector */}
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="w-4 h-4 text-white/30" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
            {ask.sector}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {isNew && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-400" title="Posted today">
              <Sparkles className="w-3 h-3" strokeWidth={1.5} />
              <span className="font-mono text-[10px] uppercase tracking-wider">New</span>
            </div>
          )}
          {ask.isAnonymous && (
            <div className="flex items-center gap-1 text-white/30" title="Anonymous">
              <EyeOff className="w-3 h-3" strokeWidth={1.5} />
            </div>
          )}
          {ask.allowAmplification && (
            <div className="flex items-center gap-1 text-white/30" title="Amplified by ChiStartupHub">
              <Megaphone className="w-3 h-3" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Founder Info (if not anonymous) */}
        {!ask.isAnonymous && ask.founderName && (
          <div className="flex items-center gap-3 mb-3">
            {ask.founderAvatar ? (
              <OptimizedImage
                src={ask.founderAvatar}
                alt={ask.founderName}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="font-mono text-[10px] text-white/50">
                  {ask.founderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm text-white font-medium block">{ask.founderName}</span>
              {ask.companyName && (
                <span className="text-xs text-white/40">{ask.companyName}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {ask.description}
        </p>

        {/* Fundraising Info - SEC Compliance: Hide amounts, show stage only */}
        {(ask.category === 'fundraising' || ask.category === 'fundraising_guidance') && (
          <>
            {/* Show stage only (amount hidden from public for SEC compliance) */}
            {ask.stage && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/40 uppercase">{ask.stage}</span>
              </div>
            )}

            {/* Privacy indicator - amounts shared after connection */}
            <div className="mb-4 p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                <p className="text-xs text-white/40 font-mono">
                  Fundraising details shared after connection
                </p>
              </div>
            </div>
          </>
        )}

        {/* Meta Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/30">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span className="font-mono text-[10px]">{ask.createdAt}</span>
            </div>
            {ask.viewCount > 0 && (
              <div className="flex items-center gap-1.5 text-white/30" title="Views">
                <Eye className="w-3 h-3" strokeWidth={1.5} />
                <span className="font-mono text-[10px]">{ask.viewCount}</span>
              </div>
            )}
          </div>
          {daysRemaining !== null && (
            <span className={`font-mono text-[10px] ${daysRemaining <= 2 ? 'text-amber-400' : 'text-white/30'}`}>
              {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} days left`}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onHelp(ask)}
          className="w-full flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] py-3 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair group-hover:border-white/40"
        >
          <HandHelping className="w-4 h-4" strokeWidth={1.5} />
          Offer Guidance
        </button>
      </div>
    </motion.div>
  );
}
