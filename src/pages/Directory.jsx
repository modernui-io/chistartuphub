import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProfileCard from '@/components/ProfileCard';
import SEO from '@/components/SEO';
import { supabase } from '@/api/supabaseClient';
import OptimizedImage from "@/components/OptimizedImage";

const STAGE_FILTERS = [
  { value: 'all', label: 'All Stages' },
  { value: 'idea', label: 'Idea' },
  { value: 'pre-revenue', label: 'Pre-Revenue' },
  { value: 'early-revenue', label: 'Early Revenue' },
  { value: 'growth', label: 'Growth' },
  { value: 'scaling', label: 'Scaling' },
];

// Transform Supabase profile to Directory format
const transformProfile = (profile) => {
  // Build role string from role + startup/company name
  const roleLabel = {
    'founder': 'Founder',
    'investor': 'Investor',
    'service-provider': 'Service Provider',
    'student': 'Student',
    'other': ''
  }[profile.role] || '';

  const companyPart = profile.startup_name || profile.company_name;
  const roleString = companyPart
    ? `${roleLabel}${roleLabel ? ' @ ' : ''}${companyPart}`
    : roleLabel || profile.role || 'Member';

  // Parse arrays that might be strings
  let sectors = profile.sectors || profile.industry_focus || [];
  let badges = profile.badges || profile.achievements || [];
  let techStack = profile.tech_stack || [];

  if (typeof sectors === 'string') try { sectors = JSON.parse(sectors); } catch { sectors = []; }
  if (typeof badges === 'string') try { badges = JSON.parse(badges); } catch { badges = []; }
  if (typeof techStack === 'string') try { techStack = JSON.parse(techStack); } catch { techStack = []; }

  return {
    id: profile.id,
    name: profile.full_name || 'Anonymous',
    role: roleString,
    location: profile.location || 'Chicago, IL',
    pitch: profile.bio || '',
    website_url: profile.website_url,
    email: profile.email,
    linkedin_url: profile.linkedin_url,
    currentFocus: profile.current_focus || '',
    focusDescription: profile.focus_description || '',
    sectors: Array.isArray(sectors) ? sectors : [],
    badges: Array.isArray(badges) ? badges : [],
    techStack: Array.isArray(techStack) ? techStack : [],
    stage: profile.stage || 'idea',
    avatar_url: profile.avatar_url,
    opportunity_category: profile.opportunity_category,
  };
};

export default function Directory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Fetch profiles from Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform and filter profiles that have at least a name
        const transformedProfiles = (data || [])
          .filter(p => p.full_name) // Only show profiles with names
          .map(transformProfile);

        setProfiles(transformedProfiles);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Filter profiles based on search and stage
  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      profile.name?.toLowerCase().includes(searchLower) ||
      profile.role?.toLowerCase().includes(searchLower) ||
      profile.pitch?.toLowerCase().includes(searchLower) ||
      profile.sectors?.some(s => s.toLowerCase().includes(searchLower)) ||
      profile.badges?.some(b => b.toLowerCase().includes(searchLower)) ||
      profile.techStack?.some(t => t.toLowerCase().includes(searchLower)) ||
      profile.currentFocus?.toLowerCase().includes(searchLower);

    const matchesStage = stageFilter === 'all' || profile.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Founder Directory"
        description="Connect with Chicago's top founders. A high-signal, low-noise professional directory."
      />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Users size={16} />
            <span>Founder Directory</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            High-Signal Connections
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            No feeds. No likes. No DMs. Just pure utility and identity.
            Find the right founders and make meaningful connections.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search founders, skills, or achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {STAGE_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={stageFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStageFilter(filter.value)}
                className={`whitespace-nowrap ${
                  stageFilter === filter.value
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6 text-sm text-white/50"
        >
          <Sparkles size={14} className="text-blue-400" />
          <span>
            {loading ? 'Loading...' : `${filteredProfiles.length} founder${filteredProfiles.length !== 1 ? 's' : ''} found`}
          </span>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-white/50">Loading directory...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white/80 mb-2">Failed to load directory</h3>
            <p className="text-white/50 text-sm mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Profile Grid */}
        {!loading && !error && (
          <>
            {selectedProfile ? (
              // Full Profile View
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProfile(null)}
                  className="mb-6 text-white/60 hover:text-white"
                >
                  ← Back to Directory
                </Button>
                <ProfileCard user={selectedProfile} />
              </motion.div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setSelectedProfile(profile)}
                    className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 transition-all duration-300"
                  >
                    {/* Mini Profile Card */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {profile.avatar_url ? (
                        <OptimizedImage
                          src={profile.avatar_url}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                          {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                          {profile.name}
                        </h3>
                        <p className="text-white/50 text-sm truncate">{profile.role}</p>
                      </div>
                    </div>

                    {/* Pitch */}
                    {profile.pitch && (
                      <p className="mt-4 text-sm text-white/60 line-clamp-2">
                        {profile.pitch}
                      </p>
                    )}

                    {/* Sectors */}
                    {profile.sectors?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {profile.sectors.slice(0, 3).map((sector, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 rounded-full"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Badges */}
                    {profile.badges?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.badges.slice(0, 2).map((badge, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/[0.04] text-[10px] text-white/50 rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                        {profile.badges.length > 2 && (
                          <span className="px-2 py-0.5 text-[10px] text-white/30">
                            +{profile.badges.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Current Focus Indicator */}
                    {profile.currentFocus && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-400/80 font-medium truncate">
                            {profile.currentFocus}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Opportunity Category Badge */}
                    {profile.opportunity_category && !profile.currentFocus && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 font-medium">
                          {profile.opportunity_category}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProfiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white/80 mb-2">
              {profiles.length === 0 ? 'No profiles yet' : 'No founders found'}
            </h3>
            <p className="text-white/50 text-sm">
              {profiles.length === 0
                ? 'Be the first to create your profile!'
                : 'Try adjusting your search or filters'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
