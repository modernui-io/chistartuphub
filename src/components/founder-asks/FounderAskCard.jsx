import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  MessageCircle,
  Building2,
  Clock,
  TrendingUp,
  Linkedin,
  Megaphone,
  EyeOff,
  HandHelping,
} from 'lucide-react';

// ============================================
// CATEGORY CONFIG
// ============================================

const CATEGORY_CONFIG = {
  fundraising: {
    icon: DollarSign,
    label: 'Fundraising',
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

export default function FounderAskCard({ ask, index, onHelp }) {
  const categoryConfig = CATEGORY_CONFIG[ask.category] || CATEGORY_CONFIG.general_advice;
  const CategoryIcon = categoryConfig.icon;

  // Calculate days remaining
  const daysRemaining = ask.expiresAt 
    ? Math.max(0, Math.ceil((new Date(ask.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

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
              <img 
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

        {/* Fundraising Info */}
        {ask.category === 'fundraising' && (
          <div className="flex items-center gap-4 mb-4">
            {ask.amount && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-emerald-400/60" strokeWidth={1.5} />
                <span className="font-mono text-[11px] text-emerald-400 uppercase">
                  {ask.amount}
                </span>
              </div>
            )}
            {ask.stage && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/40 uppercase">{ask.stage}</span>
              </div>
            )}
          </div>
        )}

        {/* Meta Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white/30">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            <span className="font-mono text-[10px]">{ask.createdAt}</span>
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
          I Can Help
        </button>
      </div>
    </motion.div>
  );
}
