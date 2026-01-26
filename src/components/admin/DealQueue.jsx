import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Status configuration
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  enriching: { label: 'Enriching', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  review: { label: 'Needs Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  verified: { label: 'Verified', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  published: { label: 'Published', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
};

// Confidence badge colors
function getConfidenceBadge(score) {
  if (score >= 90) return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (score >= 75) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default function DealQueue({ onSelectDeal, onShowProvenance }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [chicagoOnly, setChicagoOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [enriching, setEnriching] = useState(null);

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('deal_staging')
        .select(`
          *,
          primary_source:research_sources(name, slug, reliability_score)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply Chicago filter
      if (chicagoOnly) {
        query = query.eq('chicago_focused', true);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Filter by search term client-side
      let filtered = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          d =>
            d.company_name?.toLowerCase().includes(term) ||
            d.sector?.toLowerCase().includes(term) ||
            d.round_type?.toLowerCase().includes(term)
        );
      }

      setDeals(filtered);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, chicagoOnly, searchTerm]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Trigger AI enrichment for a deal
  const enrichDeal = async (dealId) => {
    setEnriching(dealId);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-deal-openai', {
        body: {
          deal_id: dealId,
          fields_to_enrich: ['sector', 'sub_sectors', 'company_description', 'business_model', 'chicago_focused']
        }
      });

      if (error) throw error;

      toast.success(`Enriched ${data.enriched_fields.length} fields with AI`);
      fetchDeals();
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('AI enrichment failed');
    } finally {
      setEnriching(null);
    }
  };

  // Quick verify a deal
  const quickVerify = async (dealId) => {
    try {
      const { error } = await supabase
        .from('deal_staging')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          needs_review: false
        })
        .eq('id', dealId);

      if (error) throw error;

      toast.success('Deal verified');
      fetchDeals();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Deal Queue</h3>
          <span className="text-sm text-gray-400">({deals.length} deals)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px] bg-gray-800/50 border-gray-700"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-gray-700' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeals}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 flex flex-wrap gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Status</label>
                <div className="flex gap-1 flex-wrap">
                  {['all', 'pending', 'review', 'verified', 'published'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`
                        px-3 py-1 text-xs rounded-full border transition-colors capitalize
                        ${statusFilter === status
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:border-gray-500'
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chicago Only */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Region</label>
                <button
                  onClick={() => setChicagoOnly(!chicagoOnly)}
                  className={`
                    flex items-center gap-2 px-3 py-1 text-xs rounded-full border transition-colors
                    ${chicagoOnly
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  <Building2 className="w-3 h-3" />
                  Chicago Only
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deal List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No deals found matching your filters
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onSelect={() => onSelectDeal(deal)}
              onShowProvenance={() => onShowProvenance(deal)}
              onEnrich={() => enrichDeal(deal.id)}
              onQuickVerify={() => quickVerify(deal.id)}
              isEnriching={enriching === deal.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Deal Card Component
function DealCard({ deal, onSelect, onShowProvenance, onEnrich, onQuickVerify, isEnriching }) {
  const statusConfig = STATUS_CONFIG[deal.status] || STATUS_CONFIG.pending;
  const hasAIFields = deal.ai_enriched_fields?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 hover:border-gray-600/50 transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white">{deal.company_name}</h4>
            {deal.chicago_focused && (
              <span className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Chicago
              </span>
            )}
            {hasAIFields && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            {deal.amount_raw && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {deal.amount_raw}
              </span>
            )}
            {deal.round_type && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {deal.round_type}
              </span>
            )}
            {deal.deal_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(deal.deal_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Status & Confidence */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full border ${getConfidenceBadge(deal.confidence_score)}`}>
            {deal.confidence_score}%
          </span>
        </div>
      </div>

      {/* Details Row */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
        {deal.sector && <span>{deal.sector}</span>}
        {deal.lead_investors?.length > 0 && (
          <span>Lead: {deal.lead_investors[0]}</span>
        )}
        {deal.primary_source && (
          <a
            href={deal.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {deal.primary_source.name}
          </a>
        )}
      </div>

      {/* AI Enriched Fields */}
      {hasAIFields && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.ai_enriched_fields.map((field) => (
            <span
              key={field}
              className="px-2 py-0.5 text-xs rounded bg-purple-500/5 text-purple-400/80 border border-purple-500/10"
            >
              {field.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelect}>
            <Eye className="w-4 h-4 mr-2" />
            Review
          </Button>
          <Button variant="outline" size="sm" onClick={onShowProvenance}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Provenance
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {deal.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEnrich}
              disabled={isEnriching}
            >
              {isEnriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enrich
                </>
              )}
            </Button>
          )}
          {deal.status === 'review' && deal.confidence_score >= 75 && (
            <Button size="sm" onClick={onQuickVerify}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Quick Verify
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
