import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  X,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Link2,
  ExternalLink,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  Briefcase,
  Quote
} from 'lucide-react';

// Field configuration with icons and labels
const FIELD_CONFIG = {
  company_name: { label: 'Company Name', icon: Building2 },
  amount_raw: { label: 'Amount (Display)', icon: DollarSign },
  amount_usd: { label: 'Amount (USD)', icon: DollarSign },
  round_type: { label: 'Round Type', icon: TrendingUp },
  lead_investors: { label: 'Lead Investors', icon: Users },
  other_investors: { label: 'Other Investors', icon: Users },
  valuation_usd: { label: 'Valuation', icon: TrendingUp },
  sector: { label: 'Sector', icon: Briefcase },
  sub_sectors: { label: 'Sub-sectors', icon: Briefcase },
  company_description: { label: 'Company Description', icon: FileText },
  business_model: { label: 'Business Model', icon: Briefcase },
  company_website: { label: 'Website', icon: Globe },
  company_location: { label: 'Location', icon: MapPin },
  chicago_focused: { label: 'Chicago Focused', icon: Building2 },
  chicago_connection: { label: 'Chicago Connection', icon: MapPin },
  deal_date: { label: 'Deal Date', icon: Calendar }
};

// Source type badges
const SOURCE_TYPE_STYLES = {
  government: 'bg-green-500/10 text-green-400 border-green-500/20',
  news: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  aggregator: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  company: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ai_enriched: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
};

// Verification status badges
const VERIFICATION_STATUS = {
  pending: { label: 'Pending', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Clock },
  verified: { label: 'Verified', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2 },
  disputed: { label: 'Disputed', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
  superseded: { label: 'Superseded', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Info }
};

export default function ProvenanceView({ deal, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [sources, setSources] = useState({});
  const [expandedFields, setExpandedFields] = useState({});
  const [activeTab, setActiveTab] = useState('fields');

  // Fetch verification history for the deal
  useEffect(() => {
    if (isOpen && deal?.id) {
      fetchProvenance();
    }
  }, [isOpen, deal?.id]);

  const fetchProvenance = async () => {
    try {
      setLoading(true);

      // Fetch all field verifications for this deal
      const { data: verificationData, error: verError } = await supabase
        .from('deal_field_verifications')
        .select(`
          *,
          source:research_sources(id, name, slug, source_type, reliability_score, base_url)
        `)
        .eq('deal_id', deal.id)
        .order('verified_at', { ascending: false });

      if (verError) throw verError;
      setVerifications(verificationData || []);

      // Group verifications by field
      const groupedByField = {};
      for (const ver of verificationData || []) {
        if (!groupedByField[ver.field_name]) {
          groupedByField[ver.field_name] = [];
        }
        groupedByField[ver.field_name].push(ver);
      }

      // Also fetch source details for field_sources JSONB
      const sourceIds = new Set();
      if (deal.field_sources) {
        for (const fieldData of Object.values(deal.field_sources)) {
          if (fieldData?.source_id) {
            sourceIds.add(fieldData.source_id);
          }
        }
      }
      if (deal.primary_source_id) {
        sourceIds.add(deal.primary_source_id);
      }

      if (sourceIds.size > 0) {
        const { data: sourceData } = await supabase
          .from('research_sources')
          .select('*')
          .in('id', Array.from(sourceIds));

        const sourceMap = {};
        for (const src of sourceData || []) {
          sourceMap[src.id] = src;
        }
        setSources(sourceMap);
      }

    } catch (error) {
      console.error('Error fetching provenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldName) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Get field-level provenance from deal.field_sources
  const getFieldProvenance = (fieldName) => {
    if (!deal.field_sources || !deal.field_sources[fieldName]) {
      return null;
    }
    const fieldData = deal.field_sources[fieldName];
    const source = fieldData.source_id ? sources[fieldData.source_id] : null;
    return { ...fieldData, source };
  };

  // Get verification history for a field
  const getFieldVerifications = (fieldName) => {
    return verifications.filter(v => v.field_name === fieldName);
  };

  // Check if field is AI-enriched
  const isAIEnriched = (fieldName) => {
    return deal.ai_enriched_fields?.includes(fieldName);
  };

  // Get field value (handle arrays and objects)
  const getFieldValue = (fieldName) => {
    const value = deal[fieldName];
    if (value === null || value === undefined) return 'Not set';
    if (Array.isArray(value)) return value.join(', ') || 'None';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Calculate overall provenance score
  const calculateProvenanceScore = () => {
    let totalWeight = 0;
    let weightedScore = 0;

    const weights = {
      company_name: 15,
      amount_usd: 20,
      round_type: 10,
      lead_investors: 15,
      deal_date: 10,
      sector: 10,
      chicago_focused: 10,
      company_description: 5,
      other_investors: 5
    };

    for (const [field, weight] of Object.entries(weights)) {
      const prov = getFieldProvenance(field);
      if (prov && prov.source) {
        totalWeight += weight;
        const reliability = prov.source.reliability_score || 70;
        const aiPenalty = prov.ai_generated ? 15 : 0;
        weightedScore += weight * Math.max(0, reliability - aiPenalty) / 100;
      } else if (deal[field]) {
        // Field has value but no provenance - lower score
        totalWeight += weight;
        weightedScore += weight * 0.5;
      }
    }

    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  };

  if (!isOpen) return null;

  const provenanceScore = calculateProvenanceScore();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-white">Provenance & Audit Trail</h2>
                </div>
                <p className="text-gray-400">{deal.company_name}</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Provenance Score */}
                <div className="text-right">
                  <div className="text-sm text-gray-400">Provenance Score</div>
                  <div className={`text-2xl font-bold ${
                    provenanceScore >= 80 ? 'text-green-400' :
                    provenanceScore >= 60 ? 'text-blue-400' :
                    provenanceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {provenanceScore}%
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { id: 'fields', label: 'Field Sources', icon: Database },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'summary', label: 'Summary', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-400 hover:bg-gray-800'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Field Sources Tab */}
                {activeTab === 'fields' && (
                  <div className="space-y-3">
                    {Object.entries(FIELD_CONFIG).map(([fieldName, config]) => {
                      const value = getFieldValue(fieldName);
                      const provenance = getFieldProvenance(fieldName);
                      const fieldVerifications = getFieldVerifications(fieldName);
                      const aiEnriched = isAIEnriched(fieldName);
                      const isExpanded = expandedFields[fieldName];
                      const IconComponent = config.icon;

                      if (value === 'Not set' && !provenance && fieldVerifications.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={fieldName}
                          className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden"
                        >
                          {/* Field Header */}
                          <button
                            onClick={() => toggleField(fieldName)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-white">{config.label}</span>
                              {aiEnriched && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  <Sparkles className="w-3 h-3" />
                                  AI
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {provenance?.source && (
                                <span className={`px-2 py-1 text-xs rounded-full border ${SOURCE_TYPE_STYLES[provenance.source.source_type] || SOURCE_TYPE_STYLES.news}`}>
                                  {provenance.source.name}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Field Details (Expanded) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-gray-700/50"
                              >
                                <div className="p-4 space-y-4">
                                  {/* Current Value */}
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Current Value</div>
                                    <div className="text-sm text-white bg-gray-900/50 rounded p-2">
                                      {value}
                                    </div>
                                  </div>

                                  {/* Source Details */}
                                  {provenance && (
                                    <div className="bg-gray-900/50 rounded-lg p-3">
                                      <div className="text-xs text-gray-500 mb-2">Source Details</div>
                                      <div className="space-y-2">
                                        {provenance.source && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-sm">Provider:</span>
                                            <span className="text-white text-sm">{provenance.source.name}</span>
                                            <span className={`px-1.5 py-0.5 text-xs rounded ${
                                              provenance.source.reliability_score >= 90 ? 'bg-green-500/10 text-green-400' :
                                              provenance.source.reliability_score >= 70 ? 'bg-blue-500/10 text-blue-400' :
                                              'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                              {provenance.source.reliability_score}% reliable
                                            </span>
                                          </div>
                                        )}
                                        {provenance.source_url && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-sm">URL:</span>
                                            <a
                                              href={provenance.source_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary text-sm hover:underline flex items-center gap-1"
                                            >
                                              <Link2 className="w-3 h-3" />
                                              View Source
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          </div>
                                        )}
                                        {provenance.added_at && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-sm">Added:</span>
                                            <span className="text-gray-300 text-sm">
                                              {new Date(provenance.added_at).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        {provenance.ai_generated && (
                                          <div className="flex items-center gap-2 mt-2 p-2 bg-purple-500/10 rounded">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <span className="text-purple-400 text-sm">
                                              AI-generated using {deal.ai_model_used || 'OpenAI GPT-4'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Verification History */}
                                  {fieldVerifications.length > 0 && (
                                    <div>
                                      <div className="text-xs text-gray-500 mb-2">Verification History</div>
                                      <div className="space-y-2">
                                        {fieldVerifications.map((ver, idx) => {
                                          const statusConfig = VERIFICATION_STATUS[ver.verification_status] || VERIFICATION_STATUS.pending;
                                          const StatusIcon = statusConfig.icon;

                                          return (
                                            <div
                                              key={ver.id || idx}
                                              className={`p-3 rounded-lg border ${ver.is_current ? 'bg-gray-900/50 border-gray-600' : 'bg-gray-900/30 border-gray-700/50 opacity-60'}`}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                  </span>
                                                  {ver.is_current && (
                                                    <span className="text-xs text-green-400">Current</span>
                                                  )}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                  {new Date(ver.verified_at).toLocaleString()}
                                                </span>
                                              </div>

                                              {ver.field_value && (
                                                <div className="text-sm text-gray-300 mb-2">
                                                  Value: {ver.field_value}
                                                </div>
                                              )}

                                              {ver.source && (
                                                <div className="text-sm text-gray-400">
                                                  Source: {ver.source.name}
                                                </div>
                                              )}

                                              {ver.source_url && (
                                                <a
                                                  href={ver.source_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                                >
                                                  <ExternalLink className="w-3 h-3" />
                                                  {ver.source_url.substring(0, 50)}...
                                                </a>
                                              )}

                                              {ver.source_quote && (
                                                <div className="mt-2 p-2 bg-gray-800/50 rounded border-l-2 border-gray-600">
                                                  <Quote className="w-3 h-3 text-gray-500 mb-1" />
                                                  <p className="text-xs text-gray-400 italic">
                                                    "{ver.source_quote}"
                                                  </p>
                                                </div>
                                              )}

                                              {ver.ai_generated && ver.ai_prompt_used && (
                                                <details className="mt-2">
                                                  <summary className="text-xs text-purple-400 cursor-pointer">
                                                    View AI prompt used
                                                  </summary>
                                                  <pre className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-400 overflow-x-auto">
                                                    {ver.ai_prompt_used}
                                                  </pre>
                                                </details>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* No provenance warning */}
                                  {!provenance && fieldVerifications.length === 0 && value !== 'Not set' && (
                                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                                      <span className="text-sm text-yellow-400">
                                        No provenance data available for this field
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {verifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No verification history available
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700" />

                        {verifications.map((ver, idx) => {
                          const fieldConfig = FIELD_CONFIG[ver.field_name] || { label: ver.field_name, icon: FileText };
                          const IconComponent = fieldConfig.icon;
                          const statusConfig = VERIFICATION_STATUS[ver.verification_status] || VERIFICATION_STATUS.pending;

                          return (
                            <div key={ver.id || idx} className="relative pl-10 pb-6">
                              {/* Timeline dot */}
                              <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                                ver.ai_generated
                                  ? 'bg-purple-500/20 border-purple-500'
                                  : 'bg-green-500/20 border-green-500'
                              } flex items-center justify-center`}>
                                {ver.ai_generated ? (
                                  <Sparkles className="w-3 h-3 text-purple-400" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                )}
                              </div>

                              <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-white">{fieldConfig.label}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig.color}`}>
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(ver.verified_at).toLocaleString()}
                                  </span>
                                </div>

                                {ver.field_value && (
                                  <p className="text-sm text-gray-300 mb-2">
                                    Set to: {ver.field_value}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  {ver.source && (
                                    <span>Source: {ver.source.name}</span>
                                  )}
                                  {ver.source_url && (
                                    <a
                                      href={ver.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    {/* Provenance Overview */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
                      <h3 className="text-lg font-medium text-white mb-4">Provenance Overview</h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{provenanceScore}%</div>
                          <div className="text-xs text-gray-400">Overall Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {Object.keys(deal.field_sources || {}).length}
                          </div>
                          <div className="text-xs text-gray-400">Fields with Sources</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {deal.ai_enriched_fields?.length || 0}
                          </div>
                          <div className="text-xs text-gray-400">AI-Enriched Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {verifications.length}
                          </div>
                          <div className="text-xs text-gray-400">Verifications</div>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            provenanceScore >= 80 ? 'bg-green-500' :
                            provenanceScore >= 60 ? 'bg-blue-500' :
                            provenanceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${provenanceScore}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low Confidence</span>
                        <span>High Confidence</span>
                      </div>
                    </div>

                    {/* Primary Source */}
                    {deal.primary_source_id && sources[deal.primary_source_id] && (
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
                        <h3 className="text-lg font-medium text-white mb-3">Primary Source</h3>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${SOURCE_TYPE_STYLES[sources[deal.primary_source_id].source_type]}`}>
                            <Globe className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {sources[deal.primary_source_id].name}
                            </div>
                            <div className="text-sm text-gray-400 capitalize">
                              {sources[deal.primary_source_id].source_type.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {sources[deal.primary_source_id].reliability_score}%
                            </div>
                            <div className="text-xs text-gray-400">Reliability</div>
                          </div>
                        </div>
                        {deal.primary_source_url && (
                          <a
                            href={deal.primary_source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-2 text-primary hover:underline text-sm"
                          >
                            <Link2 className="w-4 h-4" />
                            {deal.primary_source_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* AI Enrichment Details */}
                    {deal.ai_enriched_fields?.length > 0 && (
                      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-medium text-white">AI Enrichment</h3>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Model:</span>
                            <span className="text-white">{deal.ai_model_used || 'gpt-4-turbo'}</span>
                          </div>
                          {deal.ai_enrichment_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">Enriched:</span>
                              <span className="text-white">
                                {new Date(deal.ai_enrichment_date).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {deal.ai_enriched_fields.map(field => {
                            const config = FIELD_CONFIG[field] || { label: field };
                            return (
                              <span
                                key={field}
                                className="px-3 py-1 text-sm rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              >
                                {config.label}
                              </span>
                            );
                          })}
                        </div>

                        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                            <p className="text-sm text-gray-400">
                              AI-enriched fields should be verified by a human before publishing.
                              These fields are marked and tracked separately for audit purposes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Metadata</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white ml-2">
                            {deal.created_at ? new Date(deal.created_at).toLocaleString() : 'Unknown'}
                          </span>
                        </div>
                        {deal.verified_at && (
                          <div>
                            <span className="text-gray-400">Verified:</span>
                            <span className="text-white ml-2">
                              {new Date(deal.verified_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {deal.intake_source && (
                          <div>
                            <span className="text-gray-400">Intake Source:</span>
                            <span className="text-white ml-2 capitalize">
                              {deal.intake_source.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        {deal.intake_batch_id && (
                          <div>
                            <span className="text-gray-400">Batch ID:</span>
                            <span className="text-white ml-2 font-mono text-xs">
                              {deal.intake_batch_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {deal.confidence_score !== undefined && (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Confidence: {deal.confidence_score}%</span>
                </>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
