import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { X, Sparkles, ArrowRight, DollarSign, Calendar, Building2, Rocket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INTEREST_LINKS = {
  'Capital/Funding': { path: '/Funding', label: 'Funding', icon: DollarSign },
  'Co-Working Spaces': { path: '/Workspaces', label: 'Workspaces', icon: Building2 },
  'Networking Events': { path: '/Events', label: 'Events', icon: Calendar },
  'Accelerators/Incubators': { path: '/AcceleratorsIncubators', label: 'Accelerators', icon: Rocket },
  'Legal/Compliance': { path: '/Resources', label: 'Resources', icon: Building2 },
  'Product Development': { path: '/Resources', label: 'Resources', icon: Rocket },
  'Marketing/Growth': { path: '/Stories', label: 'Success Stories', icon: Sparkles },
  'Talent/Hiring': { path: '/Community', label: 'Communities', icon: Users },
};

const STAGE_LABELS = {
  'idea': 'Idea Stage Founder',
  'pre-revenue': 'Pre-Revenue Founder',
  'early-revenue': 'Early Revenue Founder',
  'growth': 'Growth Stage Founder',
  'scaling': 'Scaling Founder',
};

export default function PersonalizedWelcome() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName?.split(' ')[0] || 'there';
  const stage = profile?.stage;
  const role = profile?.role;

  // Ensure interests is always an array, even if stored as string
  let interests = profile?.interests || [];
  if (typeof interests === 'string') {
    try {
      interests = JSON.parse(interests);
    } catch {
      interests = [interests];
    }
  }
  if (!Array.isArray(interests)) {
    interests = [];
  }

  // Get quick links based on interests (max 3)
  const quickLinks = interests
    .filter(interest => interest && INTEREST_LINKS[interest])
    .slice(0, 3)
    .map(interest => ({
      ...INTEREST_LINKS[interest],
      interest
    }));

  // Smart default links based on role and stage if no interests selected
  const getSmartDefaults = () => {
    if (stage === 'idea' || stage === 'pre-revenue') {
      return [
        { path: '/Resources', label: 'Resources', icon: Building2 },
        { path: '/Events', label: 'Events', icon: Calendar },
        { path: '/Community', label: 'Communities', icon: Users },
      ];
    } else if (stage === 'early-revenue' || stage === 'growth' || stage === 'scaling') {
      return [
        { path: '/Funding', label: 'Funding', icon: DollarSign },
        { path: '/Events', label: 'Events', icon: Calendar },
        { path: '/Stories', label: 'Success Stories', icon: Sparkles },
      ];
    } else if (role === 'investor') {
      return [
        { path: '/Events', label: 'Events', icon: Calendar },
        { path: '/Community', label: 'Communities', icon: Users },
        { path: '/Stories', label: 'Success Stories', icon: Sparkles },
      ];
    }
    // Default fallback
    return [
      { path: '/Funding', label: 'Funding', icon: DollarSign },
      { path: '/Events', label: 'Events', icon: Calendar },
      { path: '/Stories', label: 'Success Stories', icon: Sparkles },
    ];
  };

  const linksToShow = quickLinks.length > 0 ? quickLinks : getSmartDefaults();

  return (
    <div className="relative bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/40 hover:text-white/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
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

        {/* Quick access links based on interests */}
        <div className="flex flex-wrap gap-2">
          {linksToShow.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link key={index} to={link.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-white/20 text-xs h-8 px-3 gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
