import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Bookmark,
  User,
  Loader2,
  Sparkles,
  DollarSign,
  Building2,
  Calendar,
  Users,
  Rocket,
  ArrowRight,
  Trash2,
  MapPin,
  Globe,
  Copy,
  Check,
  Layers,
  Award,
  ExternalLink,
  Linkedin,
  Edit3,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MultiSelect, SingleSelect } from '@/components/ui/multi-select';

// ============================================
// STANDARDIZED OPTIONS FOR NO-ALGORITHM SEARCH
// ============================================

const SECTOR_OPTIONS = [
  // Core Sectors (The Bedrock) - 6 items
  "FinTech",
  "HealthTech",
  "Life Sciences",
  "Logistics & Supply Chain",
  "Food & AgTech",
  "Manufacturing 4.0",
  // Emerging Tech - 5 items
  "Web3 & Blockchain",
  "AI & Machine Learning",
  "CleanTech & Energy",
  "EdTech",
  "PropTech",
  // Consumer & Services - 5 items
  "DTC / CPG",
  "Marketplaces",
  "SaaS (B2B)",
  "GovTech / CivicTech",
  "HardTech / Hardware"
];
// Total: 16 sectors

const BADGE_OPTIONS = [
  // Professional Identity - 4 items
  "Technical Founder",
  "Non-Technical Founder",
  "Solo Founder",
  "Student Founder",
  // Achievements - 5 items
  "YC Alum",
  "Techstars Alum",
  "Bootstrapped",
  "Venture Backed",
  "Ex-FAANG",
  // Community & Diversity (CRITICAL - Opt-In) - 7 items
  "Woman Founder",
  "Black Founder",
  "Latino/a/x Founder",
  "Asian Founder",
  "LGBTQ+ Founder",
  "Veteran Founder",
  "Immigrant Founder"
];
// Total: 16 badges

const TECH_STACK_OPTIONS = [
  // Languages & Core
  "Python", "TypeScript", "JavaScript", "Golang", "Rust", "Swift", "Ruby", "Java", "C++",
  // Frontend & Mobile
  "React", "React Native", "Next.js", "Vue.js", "Tailwind CSS", "Flutter", "SwiftUI",
  // Backend & DB
  "Node.js", "Supabase", "Firebase", "PostgreSQL", "MongoDB", "GraphQL", "Django", "Rails",
  // Cloud & DevOps
  "AWS", "Vercel", "Docker", "Kubernetes", "Google Cloud", "Azure",
  // Design & Product
  "Figma", "Linear", "Notion", "Webflow", "Framer"
];

const OPPORTUNITY_TYPES = [
  "Talent (Hiring)",
  "Capital (Raising)",
  "Work (Looking for Role)",
  "Connect (Networking)"
];

// Badges that unlock Tech Stack field
const TECH_BADGES = ["Technical Founder", "Full Stack Dev"];

// Tech stack icons
const TECH_ICONS = {
  'React': '⚛️',
  'Tailwind': '🎨',
  'Supabase': '⚡',
  'Node.js': '🟢',
  'Vercel': '▲',
  'Python': '🐍',
  'TypeScript': '📘',
  'Next.js': '▲',
  'PostgreSQL': '🐘',
  'AWS': '☁️',
  'Firebase': '🔥',
  'GraphQL': '◈',
  'Docker': '🐳',
  'Figma': '🎨',
  'JavaScript': '💛',
  'Vue': '💚',
  'Angular': '🔴',
  'Go': '🔵',
  'Rust': '🦀',
};

// Stage badge config
const STAGE_CONFIG = {
  'idea': { label: 'Idea Stage', color: 'from-purple-500 to-violet-600' },
  'pre-revenue': { label: 'Pre-Revenue', color: 'from-blue-500 to-cyan-600' },
  'early-revenue': { label: 'Early Revenue', color: 'from-green-500 to-emerald-600' },
  'growth': { label: 'Growth Stage', color: 'from-orange-500 to-amber-600' },
  'scaling': { label: 'Scaling', color: 'from-red-500 to-rose-600' },
};

// Resource recommendations based on interests
const INTEREST_RESOURCES = {
  'Capital/Funding': { icon: DollarSign, title: 'Funding', link: '/Funding', color: 'from-green-500 to-emerald-600' },
  'Co-Working Spaces': { icon: Building2, title: 'Workspaces', link: '/Workspaces', color: 'from-purple-500 to-violet-600' },
  'Networking Events': { icon: Calendar, title: 'Events', link: '/Events', color: 'from-orange-500 to-amber-600' },
  'Accelerators/Incubators': { icon: Rocket, title: 'Accelerators', link: '/AcceleratorsIncubators', color: 'from-pink-500 to-rose-600' },
  'Legal/Compliance': { icon: Building2, title: 'Resources', link: '/Resources', color: 'from-slate-500 to-gray-600' },
  'Product Development': { icon: Rocket, title: 'Resources', link: '/Resources', color: 'from-indigo-500 to-blue-600' },
  'Marketing/Growth': { icon: Sparkles, title: 'Stories', link: '/Stories', color: 'from-yellow-500 to-orange-600' },
  'Talent/Hiring': { icon: Users, title: 'Community', link: '/Community', color: 'from-blue-500 to-cyan-600' }
};

export default function Profile() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { bookmarks, isLoading: bookmarksLoading, removeBookmark } = useBookmarks();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'preview');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    bio: '',
    linkedin_url: '',
    website_url: '',
    location: '',
    current_focus: '',
    focus_description: '',
    sectors: [],
    badges: [],
    tech_stack: [],
    opportunity_category: '',
  });

  // Check if tech stack should be visible (user selected Technical Founder or Full Stack Dev)
  const showTechStack = formData.badges?.some(badge => TECH_BADGES.includes(badge));

  useEffect(() => {
    if (profile || user) {
      // Ensure arrays are properly parsed
      let techStack = profile?.tech_stack || [];
      let sectors = profile?.sectors || profile?.industry_focus || [];
      let badges = profile?.badges || profile?.achievements || [];

      if (typeof techStack === 'string') {
        try { techStack = JSON.parse(techStack); } catch { techStack = []; }
      }
      if (typeof sectors === 'string') {
        try { sectors = JSON.parse(sectors); } catch { sectors = []; }
      }
      if (typeof badges === 'string') {
        try { badges = JSON.parse(badges); } catch { badges = []; }
      }

      setFormData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
        company_name: profile?.company_name || '',
        bio: profile?.bio || '',
        linkedin_url: profile?.linkedin_url || '',
        website_url: profile?.website_url || '',
        location: profile?.location || 'Chicago, IL',
        current_focus: profile?.current_focus || '',
        focus_description: profile?.focus_description || '',
        sectors: Array.isArray(sectors) ? sectors : [],
        badges: Array.isArray(badges) ? badges : [],
        tech_stack: Array.isArray(techStack) ? techStack : [],
        opportunity_category: profile?.opportunity_category || '',
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(formData);

    if (error) {
      toast.error('Error', { description: 'Failed to update profile' });
    } else {
      toast.success('Profile updated!', { description: 'Your changes have been saved' });
    }
    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user?.email || '');
    setCopied(true);
    toast.success('Email copied!', { description: user?.email });
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-20 px-6 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-white/60 mb-4 text-lg">Please log in to view your profile</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            Go Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Parse interests
  let userInterests = profile?.interests || [];
  if (typeof userInterests === 'string') {
    try { userInterests = JSON.parse(userInterests); } catch { userInterests = []; }
  }

  const stageBadge = STAGE_CONFIG[profile?.stage];
  const displayName = formData.full_name || user?.email?.split('@')[0] || 'Founder';
  const firstName = displayName.split(' ')[0];

  // Group bookmarks by type
  const bookmarksByType = bookmarks.reduce((acc, bookmark) => {
    if (!acc[bookmark.resource_type]) acc[bookmark.resource_type] = [];
    acc[bookmark.resource_type].push(bookmark);
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO title="My Profile" description="Manage your ChiStartupHub profile" />

      <div className="max-w-5xl mx-auto">

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bookmark size={16} />
              Saved ({bookmarks.length})
            </button>
          </div>
        </motion.div>

        {/* PREVIEW TAB - Bento Grid Profile Card */}
        {activeTab === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* LEFT: Identity Card */}
            <div className="md:col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center text-center">

              {/* Avatar */}
              <div className="relative mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-24 h-24 rounded-full object-cover border-2 border-white/10" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/10">
                    {getInitials(displayName)}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
              </div>

              {/* Name & Role */}
              <h1 className="text-xl font-bold text-white mb-1">{displayName}</h1>
              <p className="text-sm text-white/60 mb-3">
                {profile?.role === 'founder' && formData.company_name
                  ? `Founder @ ${formData.company_name}`
                  : profile?.role?.replace('-', ' ') || 'Member'}
              </p>

              {/* Stage Badge */}
              {stageBadge && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${stageBadge.color} text-white mb-3`}>
                  <Sparkles size={10} />
                  {stageBadge.label}
                </span>
              )}

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
                <MapPin size={12} />
                <span>{formData.location || 'Chicago, IL'}</span>
              </div>

              {/* Opportunity Category */}
              {formData.opportunity_category && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-400 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {formData.opportunity_category}
                </div>
              )}

              {/* Bio/Pitch */}
              {formData.bio && (
                <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl w-full">
                  <p className="text-sm text-white/70 leading-relaxed italic">"{formData.bio}"</p>
                </div>
              )}

              {/* Social Links */}
              {formData.linkedin_url && (
                <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-xs text-white/40 hover:text-blue-400 transition-colors">
                  <Linkedin size={14} />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>

            {/* RIGHT: Stack + Ask */}
            <div className="md:col-span-2 flex flex-col gap-4">

              {/* Stack Section */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">

                {/* Sectors */}
                {formData.sectors?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket size={14} className="text-purple-500" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Sectors</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.sectors.map((sector, i) => (
                        <span key={i} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-xs font-medium rounded-full text-purple-300">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.sectors?.length > 0 && formData.badges?.length > 0 && (
                  <div className="w-full h-px bg-white/[0.06] mb-6" />
                )}

                {/* Badges */}
                {formData.badges?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={14} className="text-yellow-500" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Identity & Badges</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.badges.map((badge, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] text-xs font-medium rounded-full text-white/70">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.sectors?.length > 0 || formData.badges?.length > 0) && formData.tech_stack?.length > 0 && (
                  <div className="w-full h-px bg-white/[0.06] mb-6" />
                )}

                {/* Tech Stack */}
                {formData.tech_stack?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Tool Stack</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {formData.tech_stack.map((tool, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/20 transition-all">
                          <span className="text-lg mb-1">{TECH_ICONS[tool] || '🔧'}</span>
                          <span className="text-[10px] text-white/40 font-medium">{tool}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!formData.sectors?.length && !formData.badges?.length && !formData.tech_stack?.length && (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm">Add your sectors, badges, and tech stack in the Edit tab</p>
                  </div>
                )}
              </div>

              {/* The Ask Section */}
              <div className="relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Current Focus</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {formData.current_focus || 'Set your current focus'}
                    </h3>
                    <p className="text-sm text-white/50">
                      {formData.focus_description || 'What are you working on? Add it in the Edit tab.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Copied!" : "Copy Email"}
                    </button>

                    {formData.website_url && (
                      <a href={formData.website_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.03] border border-white/[0.1] text-white/80 hover:text-white text-sm font-medium rounded-xl transition-all">
                        <Globe size={16} />
                        Visit Website
                        <ExternalLink size={12} className="opacity-50" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Links based on interests */}
              {userInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {userInterests.slice(0, 4).map((interest, i) => {
                    const resource = INTEREST_RESOURCES[interest];
                    if (!resource) return null;
                    const Icon = resource.icon;
                    return (
                      <Link key={i} to={resource.link}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-white/60 hover:text-white hover:border-white/[0.1] transition-all">
                        <Icon size={14} />
                        {resource.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* EDIT TAB */}
        {activeTab === 'edit' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/[0.02] border-white/[0.06] p-8 rounded-2xl">
              <form onSubmit={handleSaveProfile} className="space-y-8">

                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Full Name</Label>
                      <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Company/Startup</Label>
                      <Input value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Location</Label>
                      <Input value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Chicago, IL" className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Website URL</Label>
                      <Input value={formData.website_url} onChange={(e) => handleInputChange('website_url', e.target.value)}
                        placeholder="https://..." className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Bio / One-Line Pitch</Label>
                  <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Building the Stripe for Africa..." rows={3}
                    className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                </div>

                {/* Current Focus */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Current Focus / The Ask</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Focus Title</Label>
                      <Input value={formData.current_focus} onChange={(e) => handleInputChange('current_focus', e.target.value)}
                        placeholder="Raising Seed Round" className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">LinkedIn URL</Label>
                      <Input value={formData.linkedin_url} onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        placeholder="https://linkedin.com/in/..." className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/60 text-sm">Focus Description</Label>
                    <Textarea value={formData.focus_description} onChange={(e) => handleInputChange('focus_description', e.target.value)}
                      placeholder="Looking for strategic angels with deep networks in..." rows={2}
                      className="bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                  </div>
                </div>

                {/* Sectors */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sectors</h3>
                  <p className="text-white/40 text-sm mb-4">Select the industries you operate in (e.g., "FinTech" + "Web3"). Max 3.</p>
                  <MultiSelect
                    options={SECTOR_OPTIONS}
                    selected={formData.sectors}
                    onChange={(value) => handleInputChange('sectors', value)}
                    placeholder="Search and select sectors..."
                    maxItems={3}
                  />
                </div>

                {/* Opportunity Type - What are you here for? */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">What brings you here?</h3>
                  <p className="text-white/40 text-sm mb-4">Select one primary goal. This helps others find you on the Opportunity Board.</p>
                  <SingleSelect
                    options={OPPORTUNITY_TYPES}
                    selected={formData.opportunity_category}
                    onChange={(value) => handleInputChange('opportunity_category', value)}
                    placeholder="Select your primary goal..."
                  />
                </div>

                {/* Badges / Identity */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Identity & Badges</h3>
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-4">
                    <p className="text-blue-300/80 text-sm">
                      <span className="font-medium">Be Found:</span> Many investors look for specific backgrounds. Select any communities or achievements to help them find you (e.g., "Veteran Founder").
                    </p>
                  </div>
                  <MultiSelect
                    options={BADGE_OPTIONS}
                    selected={formData.badges}
                    onChange={(value) => handleInputChange('badges', value)}
                    placeholder="Search and select badges..."
                    maxItems={5}
                  />
                </div>

                {/* Tech Stack - Conditional */}
                {showTechStack && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">Tech Stack</h3>
                    <p className="text-white/40 text-sm mb-4">Select up to 8 tools you work with. These are searchable tags.</p>
                    <MultiSelect
                      options={TECH_STACK_OPTIONS}
                      selected={formData.tech_stack}
                      onChange={(value) => handleInputChange('tech_stack', value)}
                      placeholder="Search and select tools..."
                      maxItems={8}
                    />
                  </motion.div>
                )}

                {/* Save Button */}
                <div className="pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* BOOKMARKS TAB */}
        {activeTab === 'bookmarks' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {bookmarksLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <Card className="bg-white/[0.02] border-white/[0.06] p-16 text-center rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/60 mb-2 text-lg">No saved items yet</p>
                <p className="text-white/40 text-sm mb-8">Save resources by clicking the bookmark icon</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6">
                  <Link to="/Funding">Explore Funding</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(bookmarksByType).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-white mb-4 capitalize">
                      {type.replace(/_/g, ' ')}s ({items.length})
                    </h3>
                    <div className="grid gap-3">
                      {items.map((bookmark) => (
                        <Card key={bookmark.id} className="bg-white/[0.02] border-white/[0.06] p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{bookmark.resource_name || `${type} resource`}</p>
                              <p className="text-sm text-white/40">Saved {new Date(bookmark.created_at).toLocaleDateString()}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeBookmark(bookmark.id)}
                              className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
