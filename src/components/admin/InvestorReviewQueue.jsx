import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Merge,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Building2,
  Globe,
  MapPin,
  DollarSign,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Priority labels and styles
const PRIORITY_LABELS = {
  1: { label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  2: { label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  3: { label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  4: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  5: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  6: { label: 'Normal', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  7: { label: 'Low', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  8: { label: 'Low', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  9: { label: 'Very Low', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  10: { label: 'Very Low', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

// Review type labels
const REVIEW_TYPE_LABELS = {
  low_confidence: { label: 'Low Confidence', icon: AlertTriangle },
  conflict: { label: 'Data Conflict', icon: AlertCircle },
  new_record: { label: 'New Record', icon: Building2 },
  manual: { label: 'Manual Review', icon: Eye },
};

// Confidence badge colors
function getConfidenceBadge(score) {
  if (score >= 80) return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  if (score >= 40) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default function InvestorReviewQueue() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  // Fetch review queue items
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('enrichment_review_queue')
        .select(`
          *,
          staging:investor_enrichment_staging(*),
          existing:funding_opportunities(*)
        `)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_enrichment_stats');
      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [fetchReviews, fetchStats]);

  // Handle review decision
  const handleDecision = async (reviewId, decision, notes = '') => {
    try {
      setProcessing(reviewId);

      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Update review queue
      const { error: reviewError } = await supabase
        .from('enrichment_review_queue')
        .update({
          status: decision === 'skip' ? 'deferred' : (decision === 'delete' ? 'rejected' : 'approved'),
          decision: decision,
          decision_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (reviewError) throw reviewError;

      // Update staging record status
      let newStatus = 'reviewed';
      if (decision === 'approve_staging' || decision === 'merge_manual') {
        newStatus = 'merged';

        // Merge into funding_opportunities
        if (review.staging) {
          const mergeData = {
            name: review.staging.name,
            organization: review.staging.organization,
            description: review.staging.description,
            website: review.staging.website,
            opportunity_type: review.staging.opportunity_type || 'vc',
            check_size_min: review.staging.check_size_min,
            check_size_max: review.staging.check_size_max,
            stage: review.staging.stage,
            sectors: review.staging.sectors,
            chicago_focused: review.staging.chicago_focused,
            is_active: true,
            updated_at: new Date().toISOString()
          };

          if (review.existing_record_id) {
            // Update existing
            await supabase
              .from('funding_opportunities')
              .update(mergeData)
              .eq('id', review.existing_record_id);
          } else {
            // Insert new
            await supabase
              .from('funding_opportunities')
              .insert(mergeData);
          }
        }
      } else if (decision === 'delete') {
        newStatus = 'rejected';
      }

      await supabase
        .from('investor_enrichment_staging')
        .update({ status: newStatus, merged_at: decision.includes('approve') ? new Date().toISOString() : null })
        .eq('id', review.staging_id);

      // Log action
      await supabase
        .from('enrichment_audit_log')
        .insert({
          entity_type: 'review',
          entity_id: reviewId,
          action: 'reviewed',
          actor_type: 'user',
          changes: { decision, notes },
          metadata: { staging_id: review.staging_id }
        });

      toast.success(`Review ${decision === 'approve_staging' ? 'approved' : decision === 'skip' ? 'skipped' : 'processed'}`);
      fetchReviews();
      fetchStats();
    } catch (error) {
      console.error('Error processing decision:', error);
      toast.error('Failed to process decision');
    } finally {
      setProcessing(null);
    }
  };

  // Filter reviews by search
  const filteredReviews = reviews.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.staging?.name?.toLowerCase().includes(search) ||
      r.review_reason?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investor Enrichment Review</h1>
        <p className="text-gray-400">Review and approve enriched investor data</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard label="Total Staging" value={stats.total_staging} icon={Building2} />
          <StatsCard label="Pending" value={stats.pending_count} icon={Clock} color="yellow" />
          <StatsCard label="Review Queue" value={stats.review_pending} icon={AlertCircle} color="orange" />
          <StatsCard label="Enriched" value={stats.enriched_count} icon={CheckCircle2} color="blue" />
          <StatsCard label="Merged" value={stats.merged_count} icon={Check} color="green" />
          <StatsCard label="Avg Confidence" value={`${stats.avg_confidence || 0}%`} icon={TrendingUp} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-700"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {['pending', 'approved', 'deferred', 'all'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-white text-black' : 'border-gray-700 text-gray-400'}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { fetchReviews(); fetchStats(); }}
          className="border-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl mb-2">No reviews pending</p>
          <p>All caught up! Check back after the next enrichment run.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onDecision={handleDecision}
                processing={processing === review.id}
                onSelect={() => setSelectedReview(review)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
            onDecision={handleDecision}
            processing={processing === selectedReview.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
function StatsCard({ label, value, icon: Icon, color = 'white' }) {
  const colorClasses = {
    white: 'text-white',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

// Review Card Component
function ReviewCard({ review, onDecision, processing, onSelect }) {
  const staging = review.staging || {};
  const TypeIcon = REVIEW_TYPE_LABELS[review.review_type]?.icon || AlertCircle;
  const priority = PRIORITY_LABELS[review.priority] || PRIORITY_LABELS[5];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold truncate">{staging.name || 'Unknown Investor'}</h3>

            {/* Badges */}
            <span className={`px-2 py-0.5 text-xs rounded-full border ${getConfidenceBadge(staging.confidence_score || 0)}`}>
              {staging.confidence_score || 0}% confidence
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${priority.color}`}>
              {priority.label}
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/50 text-gray-300 flex items-center gap-1">
              <TypeIcon className="w-3 h-3" />
              {REVIEW_TYPE_LABELS[review.review_type]?.label || review.review_type}
            </span>
          </div>

          {/* Review Reason */}
          <p className="text-sm text-gray-400 mb-3">{review.review_reason}</p>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {staging.website && (
              <a href={staging.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">
                <Globe className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{staging.website.replace('https://', '')}</span>
              </a>
            )}
            {staging.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {staging.location}
              </span>
            )}
            {(staging.check_size_min || staging.check_size_max) && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatCheckSize(staging.check_size_min, staging.check_size_max)}
              </span>
            )}
            {staging.chicago_focused && (
              <span className="flex items-center gap-1 text-green-400">
                <Target className="w-3 h-3" />
                Chicago Focused
              </span>
            )}
          </div>

          {/* Conflicts */}
          {review.field_conflicts && (
            <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/20">
              <p className="text-xs text-orange-400 font-medium mb-1">Data Conflicts:</p>
              <div className="text-xs text-gray-400">
                {Object.entries(review.field_conflicts).map(([field, values]) => (
                  <div key={field}>
                    <strong>{field}:</strong> Staging: {String(values.staging)} vs Existing: {String(values.existing)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onSelect}
            className="border-gray-700"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            onClick={() => onDecision(review.id, 'approve_staging')}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecision(review.id, 'skip')}
            disabled={processing}
            className="border-gray-700 text-gray-400"
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Skip
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Detail Modal Component
function ReviewDetailModal({ review, onClose, onDecision, processing }) {
  const staging = review.staging || {};
  const existing = review.existing || {};
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1a1a1a] rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">{staging.name || 'Review Details'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Comparison View */}
          {review.existing_record_id && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-400">Staging (New Data)</h3>
                <DataView data={staging} />
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-blue-400">Existing Record</h3>
                <DataView data={existing} />
              </div>
            </div>
          )}

          {/* Single View (for new records) */}
          {!review.existing_record_id && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Enriched Data</h3>
              <DataView data={staging} showSources />
            </div>
          )}

          {/* Field Sources */}
          {staging.field_sources && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Field Sources & Confidence</h3>
              <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-2">
                {Object.entries(staging.field_sources).map(([field, source]) => (
                  <div key={field} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{field.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{source.source}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceBadge(source.confidence)}`}>
                        {source.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <Label>Decision Notes (optional)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about this decision..."
              className="mt-2 bg-[#0a0a0a] border-gray-700"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <Button
            onClick={() => onDecision(review.id, 'approve_staging', notes)}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Approve & Merge
          </Button>
          {review.existing_record_id && (
            <Button
              onClick={() => onDecision(review.id, 'approve_existing', notes)}
              disabled={processing}
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              Keep Existing
            </Button>
          )}
          <Button
            onClick={() => onDecision(review.id, 'skip', notes)}
            disabled={processing}
            variant="outline"
            className="border-gray-700"
          >
            Skip
          </Button>
          <Button
            onClick={() => onDecision(review.id, 'delete', notes)}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Data View Component
function DataView({ data, showSources = false }) {
  const fields = [
    { key: 'name', label: 'Name', icon: Building2 },
    { key: 'website', label: 'Website', icon: Globe },
    { key: 'description', label: 'Description', icon: null },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'check_size_min', label: 'Min Check', icon: DollarSign, format: v => v ? `$${(v/1000).toFixed(0)}K` : '-' },
    { key: 'check_size_max', label: 'Max Check', icon: DollarSign, format: v => v ? `$${(v/1000000).toFixed(1)}M` : '-' },
    { key: 'stage', label: 'Stages', icon: TrendingUp, format: v => v?.join(', ') || '-' },
    { key: 'sectors', label: 'Sectors', icon: Target, format: v => v?.join(', ') || '-' },
    { key: 'chicago_focused', label: 'Chicago Focused', icon: MapPin, format: v => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-3">
      {fields.map(({ key, label, icon: Icon, format }) => {
        const value = data[key];
        if (value === undefined || value === null) return null;

        return (
          <div key={key} className="text-sm">
            <div className="flex items-center gap-1 text-gray-500 mb-1">
              {Icon && <Icon className="w-3 h-3" />}
              <span>{label}</span>
            </div>
            <div className="text-white truncate">
              {format ? format(value) : String(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper: Format check size
function formatCheckSize(min, max) {
  const formatNum = n => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `${formatNum(min)}+`;
  if (max) return `Up to ${formatNum(max)}`;
  return '-';
}
