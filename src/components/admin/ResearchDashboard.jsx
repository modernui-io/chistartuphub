import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  FileText,
  TrendingUp,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Newspaper,
  Search,
  Filter,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';
import DealQueue from './DealQueue';
import DealVerifier from './DealVerifier';
import ProvenanceView from './ProvenanceView';

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'queue', label: 'Deal Queue', icon: Clock },
  { id: 'verify', label: 'Verifier', icon: CheckCircle2 },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper }
];

export default function ResearchDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showProvenance, setShowProvenance] = useState(false);
  const [automationStatus, setAutomationStatus] = useState({
    secEdgar: { running: false, lastRun: null },
    rssFeed: { running: false, lastRun: null }
  });

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch deal counts by status
      const { data: dealCounts, error: dealError } = await supabase
        .from('deal_staging')
        .select('status', { count: 'exact', head: false })
        .then(async () => {
          const statuses = ['pending', 'enriching', 'review', 'verified', 'published'];
          const counts = {};

          for (const status of statuses) {
            const { count } = await supabase
              .from('deal_staging')
              .select('*', { count: 'exact', head: true })
              .eq('status', status);
            counts[status] = count || 0;
          }

          return { data: counts, error: null };
        });

      // Fetch Chicago-focused deal count
      const { count: chicagoCount } = await supabase
        .from('deal_staging')
        .select('*', { count: 'exact', head: true })
        .eq('chicago_focused', true)
        .in('status', ['verified', 'published']);

      // Fetch AI-enriched field count
      const { data: aiDeals } = await supabase
        .from('deal_staging')
        .select('ai_enriched_fields')
        .not('ai_enriched_fields', 'is', null);

      const aiFieldCount = aiDeals?.reduce(
        (sum, d) => sum + (d.ai_enriched_fields?.length || 0),
        0
      ) || 0;

      // Fetch verification stats
      const { data: verificationData } = await supabase
        .from('deal_field_verifications')
        .select('verification_status, ai_generated')
        .eq('is_current', true);

      const verificationStats = {
        total: verificationData?.length || 0,
        verified: verificationData?.filter(v => v.verification_status === 'verified').length || 0,
        aiGenerated: verificationData?.filter(v => v.ai_generated).length || 0
      };

      // Fetch latest newsletter
      const { data: latestNewsletter } = await supabase
        .from('newsletter_editions')
        .select('*')
        .order('edition_date', { ascending: false })
        .limit(1)
        .single();

      // Fetch source stats
      const { data: sources } = await supabase
        .from('research_sources')
        .select('name, reliability_score')
        .eq('is_active', true)
        .order('reliability_score', { ascending: false });

      setStats({
        deals: dealCounts || {},
        chicagoDeals: chicagoCount || 0,
        aiFields: aiFieldCount,
        verifications: verificationStats,
        latestNewsletter,
        sources: sources || []
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Trigger SEC EDGAR fetch
  const runSecEdgarFetch = async () => {
    setAutomationStatus(prev => ({
      ...prev,
      secEdgar: { ...prev.secEdgar, running: true }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-sec-edgar', {
        body: { state: 'IL', days_back: 7 }
      });

      if (error) throw error;

      toast.success(`SEC EDGAR: Found ${data.total_found} filings, created ${data.new_deals_created} deals`);
      fetchStats();
    } catch (error) {
      console.error('SEC EDGAR fetch error:', error);
      toast.error('SEC EDGAR fetch failed');
    } finally {
      setAutomationStatus(prev => ({
        ...prev,
        secEdgar: { running: false, lastRun: new Date() }
      }));
    }
  };

  // Trigger RSS feed fetch
  const runRssFetch = async () => {
    setAutomationStatus(prev => ({
      ...prev,
      rssFeed: { ...prev.rssFeed, running: true }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-rss-feeds', {
        body: { hours_back: 24, chicago_only: false }
      });

      if (error) throw error;

      toast.success(`RSS Feeds: Processed ${data.feeds_processed} feeds, created ${data.new_deals_created} deals`);
      fetchStats();
    } catch (error) {
      console.error('RSS fetch error:', error);
      toast.error('RSS feed fetch failed');
    } finally {
      setAutomationStatus(prev => ({
        ...prev,
        rssFeed: { running: false, lastRun: new Date() }
      }));
    }
  };

  // Generate newsletter
  const generateNewsletter = async () => {
    try {
      toast.loading('Generating newsletter...');

      const { data, error } = await supabase.functions.invoke('generate-newsletter', {
        body: { include_opportunities: true }
      });

      if (error) throw error;

      toast.dismiss();
      toast.success(`Newsletter generated: ${data.deals_included} deals, ${data.opportunities_included} opportunities`);
      fetchStats();
    } catch (error) {
      toast.dismiss();
      console.error('Newsletter generation error:', error);
      toast.error('Newsletter generation failed');
    }
  };

  // Handle deal selection
  const handleSelectDeal = (deal) => {
    setSelectedDeal(deal);
    setActiveTab('verify');
  };

  // Handle showing provenance
  const handleShowProvenance = (deal) => {
    setSelectedDeal(deal);
    setShowProvenance(true);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Capital Access newsletter research and verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
              ${activeTab === tab.id
                ? 'bg-gray-800 text-white border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Pending Review"
                value={stats?.deals?.pending || 0}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="Verified Deals"
                value={stats?.deals?.verified || 0}
                icon={CheckCircle2}
                color="green"
              />
              <StatCard
                title="Chicago Focused"
                value={stats?.chicagoDeals || 0}
                icon={Building2}
                color="blue"
              />
              <StatCard
                title="AI Enriched Fields"
                value={stats?.aiFields || 0}
                icon={AlertCircle}
                color="purple"
              />
            </div>

            {/* Automation Controls */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Data Intake Automation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">SEC EDGAR</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Illinois Form D Filings
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Fetch recent Form D filings for Illinois companies
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runSecEdgarFetch}
                    disabled={automationStatus.secEdgar.running}
                    className="w-full"
                  >
                    {automationStatus.secEdgar.running ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run SEC Fetch
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-orange-400" />
                      <span className="font-medium text-white">RSS Feeds</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      TechCrunch, PRNewswire, Crain's
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Monitor news feeds for funding announcements
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runRssFetch}
                    disabled={automationStatus.rssFeed.running}
                    className="w-full"
                  >
                    {automationStatus.rssFeed.running ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run RSS Fetch
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Progress */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Verification Progress
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Fields Tracked</span>
                  <span className="text-white font-medium">
                    {stats?.verifications?.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Human Verified</span>
                  <span className="text-green-400 font-medium">
                    {stats?.verifications?.verified || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AI Generated (Needs Review)</span>
                  <span className="text-yellow-400 font-medium">
                    {stats?.verifications?.aiGenerated || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats?.verifications?.total
                          ? (stats.verifications.verified / stats.verifications.total) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Newsletter Generation
                </h3>
                <Button onClick={generateNewsletter}>
                  <Newspaper className="w-4 h-4 mr-2" />
                  Generate Newsletter
                </Button>
              </div>
              {stats?.latestNewsletter && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">
                      {stats.latestNewsletter.title}
                    </span>
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full border
                      ${stats.latestNewsletter.status === 'published'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }
                    `}>
                      {stats.latestNewsletter.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {stats.latestNewsletter.total_deals} deals •{' '}
                    {stats.latestNewsletter.total_chicago_deals} Chicago •{' '}
                    ${(stats.latestNewsletter.total_funding_amount / 1000000).toFixed(1)}M total
                  </div>
                </div>
              )}
            </div>

            {/* Source Reliability */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Source Reliability Scores
              </h3>
              <div className="space-y-2">
                {stats?.sources?.slice(0, 8).map((source) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{source.name}</span>
                        <span className="text-sm text-gray-400">
                          {source.reliability_score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            source.reliability_score >= 90
                              ? 'bg-green-500'
                              : source.reliability_score >= 80
                              ? 'bg-blue-500'
                              : source.reliability_score >= 70
                              ? 'bg-yellow-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${source.reliability_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DealQueue
              onSelectDeal={handleSelectDeal}
              onShowProvenance={handleShowProvenance}
            />
          </motion.div>
        )}

        {activeTab === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DealVerifier
              deal={selectedDeal}
              onDealUpdated={() => {
                fetchStats();
                setSelectedDeal(null);
              }}
              onBack={() => {
                setSelectedDeal(null);
                setActiveTab('queue');
              }}
            />
          </motion.div>
        )}

        {activeTab === 'newsletter' && (
          <motion.div
            key="newsletter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <NewsletterManager onRefresh={fetchStats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provenance Modal */}
      {showProvenance && selectedDeal && (
        <ProvenanceView
          deal={selectedDeal}
          onClose={() => {
            setShowProvenance(false);
            setSelectedDeal(null);
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Newsletter Manager Component (inline for now)
function NewsletterManager({ onRefresh }) {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const { data, error } = await supabase
          .from('newsletter_editions')
          .select('*')
          .order('edition_date', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNewsletters(data || []);
      } catch (error) {
        console.error('Error fetching newsletters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Newsletter Editions</h3>
      </div>

      <div className="space-y-3">
        {newsletters.map((newsletter) => (
          <div
            key={newsletter.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{newsletter.title}</span>
              <span className={`
                px-2 py-0.5 text-xs rounded-full border
                ${newsletter.status === 'published'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : newsletter.status === 'approved'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }
              `}>
                {newsletter.status}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {newsletter.total_deals} deals • {newsletter.total_chicago_deals} Chicago
              {newsletter.total_funding_amount > 0 && (
                <> • ${(newsletter.total_funding_amount / 1000000).toFixed(1)}M total</>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {newsletter.period_start} to {newsletter.period_end}
            </div>
          </div>
        ))}

        {newsletters.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No newsletters generated yet
          </div>
        )}
      </div>
    </div>
  );
}
