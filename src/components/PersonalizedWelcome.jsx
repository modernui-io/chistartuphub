import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowUpRight, DollarSign, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseClient';

const STAGE_LABELS = {
  'idea': 'Idea Stage Founder',
  'pre-revenue': 'Pre-Revenue Founder',
  'early-revenue': 'Early Revenue Founder',
  'growth': 'Growth Stage Founder',
  'scaling': 'Scaling Founder',
};

// Action Tile Component
const ActionTile = ({ to, icon: Icon, label, subtext, badge, badgeCount }) => (
  <Link to={to} className="block group">
    <div className="relative h-24 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-blue-500 hover:bg-gray-900/80">
      {/* Top Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white/70 group-hover:text-blue-400 transition-colors" />
          <span className="text-white font-medium text-sm">{label}</span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs">{subtext}</span>

        {/* Badge for Funding */}
        {badge && badgeCount > 0 && (
          <span className="flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full animate-pulse">
            {badgeCount} New
          </span>
        )}
      </div>
    </div>
  </Link>
);

export default function PersonalizedWelcome() {
  const { user, profile } = useAuth();

  // Query for hot opportunities count
  const { data: hotCount = 0 } = useQuery({
    queryKey: ['hot-opportunities-count'],
    queryFn: async () => {
      const all = await entities.FundingOpportunity.list('-created_date');
      const now = new Date();
      const timeSensitive = all.filter(opp => {
        if (opp.deadline) {
          const deadline = new Date(opp.deadline);
          const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 60;
        }
        return false;
      });
      return timeSensitive.length;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return null;

  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName?.split(' ')[0] || 'there';
  const stage = profile?.stage;

  // Define the action tiles
  const actionTiles = [
    {
      to: '/Funding',
      icon: DollarSign,
      label: 'Funding',
      subtext: hotCount > 0 ? `${hotCount} Active Sources` : 'Explore opportunities',
      badge: true,
      badgeCount: hotCount,
    },
    {
      to: '/Community',
      icon: Users,
      label: 'Communities',
      subtext: '22 Active Groups',
      badge: false,
      badgeCount: 0,
    },
    {
      to: '/Stories',
      icon: Sparkles,
      label: 'Blueprints',
      subtext: 'New Success Stories',
      badge: false,
      badgeCount: 0,
    },
  ];

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-start justify-between gap-8">
        {/* Left: Welcome Text */}
        <div className="flex-shrink-0">
          <h2 className="text-3xl font-bold text-white mb-1">
            Welcome back, {firstName}!
          </h2>
          {stage && STAGE_LABELS[stage] && (
            <p className="text-sm text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {STAGE_LABELS[stage]}
            </p>
          )}
          {!stage && profile?.role && (
            <p className="text-sm text-white/60">
              {profile.role === 'founder' ? 'Entrepreneur' :
               profile.role === 'investor' ? 'Investor' :
               profile.role === 'service-provider' ? 'Service Provider' :
               profile.role === 'student' ? 'Student' : 'Member'}
            </p>
          )}
        </div>

        {/* Right: Action Tiles Grid */}
        <div className="grid grid-cols-3 gap-3 flex-1 max-w-2xl">
          {actionTiles.map((tile, index) => (
            <ActionTile key={index} {...tile} />
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Welcome Text */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back, {firstName}!
          </h2>
          {stage && STAGE_LABELS[stage] && (
            <p className="text-sm text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {STAGE_LABELS[stage]}
            </p>
          )}
          {!stage && profile?.role && (
            <p className="text-sm text-white/60">
              {profile.role === 'founder' ? 'Entrepreneur' :
               profile.role === 'investor' ? 'Investor' :
               profile.role === 'service-provider' ? 'Service Provider' :
               profile.role === 'student' ? 'Student' : 'Member'}
            </p>
          )}
        </div>

        {/* Chicago Bean Image */}
        <div className="relative w-full h-32 rounded-xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80"
            alt="Chicago skyline"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <p className="text-white/80 text-xs font-medium">Your Chicago HQ</p>
          </div>
        </div>

        {/* Action Tiles - Stacked */}
        <div className="flex flex-col gap-3">
          {actionTiles.map((tile, index) => (
            <ActionTile key={index} {...tile} />
          ))}
        </div>
      </div>
    </div>
  );
}
