import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  Building2,
  DollarSign,
  Users,
  Calendar,
  Tag,
  FileText,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Field configuration for display and editing
const FIELD_CONFIG = {
  company_name: { label: 'Company Name', icon: Building2, required: true },
  company_website: { label: 'Website', icon: Globe },
  company_description: { label: 'Description', icon: FileText, multiline: true },
  amount_raw: { label: 'Amount (Display)', icon: DollarSign },
  amount_usd: { label: 'Amount (USD)', icon: DollarSign, type: 'number' },
  round_type: { label: 'Round Type', icon: Tag },
  lead_investors: { label: 'Lead Investors', icon: Users, isArray: true },
  other_investors: { label: 'Other Investors', icon: Users, isArray: true },
  deal_date: { label: 'Deal Date', icon: Calendar, type: 'date' },
  sector: { label: 'Sector', icon: Tag },
  sub_sectors: { label: 'Sub-Sectors', icon: Tag, isArray: true },
  chicago_focused: { label: 'Chicago Focused', icon: Building2, type: 'boolean' },
  chicago_connection: { label: 'Chicago Connection', icon: Building2 }
};

export default function DealVerifier({ deal, onDealUpdated, onBack }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedDeal, setEditedDeal] = useState(null);
  const [fieldVerifications, setFieldVerifications] = useState([]);
  const [sources, setSources] = useState([]);
  const [verifyingField, setVerifyingField] = useState(null);

  // Initialize edited deal
  useEffect(() => {
    if (deal) {
      setEditedDeal({ ...deal });
      fetchFieldVerifications(deal.id);
      fetchSources();
    }
  }, [deal]);

  // Fetch existing field verifications
  const fetchFieldVerifications = async (dealId) => {
    try {
      const { data, error } = await supabase
        .from('deal_field_verifications')
        .select(`
          *,
          source:research_sources(name, slug, reliability_score)
        `)
        .eq('deal_id', dealId)
        .eq('is_current', true)
        .order('field_name');

      if (error) throw error;
      setFieldVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  // Fetch available sources
  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('research_sources')
        .select('id, name, slug, reliability_score')
        .eq('is_active', true)
        .order('reliability_score', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  // Handle field value change
  const handleFieldChange = (fieldName, value) => {
    setEditedDeal(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle array field change
  const handleArrayFieldChange = (fieldName, value) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    setEditedDeal(prev => ({
      ...prev,
      [fieldName]: items
    }));
  };

  // Verify a specific field
  const verifyField = async (fieldName, sourceSlug, sourceUrl) => {
    if (!editedDeal) return;

    setVerifyingField(fieldName);
    try {
      const fieldValue = editedDeal[fieldName];
      const valueStr = Array.isArray(fieldValue)
        ? JSON.stringify(fieldValue)
        : String(fieldValue ?? '');

      // Get source ID
      const source = sources.find(s => s.slug === sourceSlug);
      if (!source) throw new Error('Source not found');

      // Create verification record
      const { error: verifError } = await supabase
        .from('deal_field_verifications')
        .insert({
          deal_id: editedDeal.id,
          field_name: fieldName,
          field_value: valueStr,
          field_value_json: Array.isArray(fieldValue) ? fieldValue : null,
          source_id: source.id,
          source_url: sourceUrl || editedDeal.primary_source_url,
          ai_generated: false,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          is_current: true
        });

      if (verifError) throw verifError;

      // Update field_sources in deal
      const newFieldSources = {
        ...editedDeal.field_sources,
        [fieldName]: {
          source_id: source.id,
          source_url: sourceUrl || editedDeal.primary_source_url,
          ai_generated: false,
          verified_at: new Date().toISOString()
        }
      };

      await supabase
        .from('deal_staging')
        .update({ field_sources: newFieldSources })
        .eq('id', editedDeal.id);

      toast.success(`${FIELD_CONFIG[fieldName]?.label || fieldName} verified`);
      fetchFieldVerifications(editedDeal.id);

    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify field');
    } finally {
      setVerifyingField(null);
    }
  };

  // Save all changes
  const saveChanges = async () => {
    if (!editedDeal) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('deal_staging')
        .update({
          company_name: editedDeal.company_name,
          company_website: editedDeal.company_website,
          company_description: editedDeal.company_description,
          amount_raw: editedDeal.amount_raw,
          amount_usd: editedDeal.amount_usd,
          round_type: editedDeal.round_type,
          lead_investors: editedDeal.lead_investors,
          other_investors: editedDeal.other_investors,
          deal_date: editedDeal.deal_date,
          sector: editedDeal.sector,
          sub_sectors: editedDeal.sub_sectors,
          chicago_focused: editedDeal.chicago_focused,
          chicago_connection: editedDeal.chicago_connection,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedDeal.id);

      if (error) throw error;

      toast.success('Changes saved');
      onDealUpdated?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Mark deal as verified
  const markVerified = async () => {
    if (!editedDeal) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('deal_staging')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          needs_review: false
        })
        .eq('id', editedDeal.id);

      if (error) throw error;

      toast.success('Deal marked as verified');
      onDealUpdated?.();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify deal');
    } finally {
      setSaving(false);
    }
  };

  // Reject deal
  const rejectDeal = async () => {
    if (!editedDeal) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('deal_staging')
        .update({
          status: 'rejected',
          needs_review: false
        })
        .eq('id', editedDeal.id);

      if (error) throw error;

      toast.success('Deal rejected');
      onDealUpdated?.();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject deal');
    } finally {
      setSaving(false);
    }
  };

  if (!deal) {
    return (
      <div className="text-center py-12 text-gray-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Select a deal from the queue to verify</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Queue
        </Button>
      </div>
    );
  }

  if (!editedDeal) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get verification status for a field
  const getFieldVerification = (fieldName) => {
    return fieldVerifications.find(v => v.field_name === fieldName);
  };

  // Check if field is AI-generated
  const isAIGenerated = (fieldName) => {
    return editedDeal.ai_enriched_fields?.includes(fieldName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Verify: {editedDeal.company_name}
            </h3>
            <p className="text-sm text-gray-400">
              Review and verify each field with source links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveChanges} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={rejectDeal} disabled={saving}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button onClick={markVerified} disabled={saving}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Verify Deal
          </Button>
        </div>
      </div>

      {/* Primary Source */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-white">Primary Source</p>
              <a
                href={editedDeal.primary_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline flex items-center gap-1"
              >
                {editedDeal.primary_source_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <span className={`
            px-2 py-1 text-xs rounded-full border
            ${editedDeal.confidence_score >= 80
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }
          `}>
            {editedDeal.confidence_score}% confidence
          </span>
        </div>
      </div>

      {/* Field Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(FIELD_CONFIG).map(([fieldName, config]) => (
          <FieldEditor
            key={fieldName}
            fieldName={fieldName}
            config={config}
            value={editedDeal[fieldName]}
            onChange={(value) => handleFieldChange(fieldName, value)}
            onArrayChange={(value) => handleArrayFieldChange(fieldName, value)}
            verification={getFieldVerification(fieldName)}
            isAIGenerated={isAIGenerated(fieldName)}
            onVerify={(sourceSlug, sourceUrl) => verifyField(fieldName, sourceSlug, sourceUrl)}
            verifying={verifyingField === fieldName}
            sources={sources}
            primarySourceUrl={editedDeal.primary_source_url}
          />
        ))}
      </div>

      {/* AI Enriched Notice */}
      {editedDeal.ai_enriched_fields?.length > 0 && (
        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-purple-400">AI Enriched Fields</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            These fields were populated by AI ({editedDeal.ai_model_used}) and should be verified:
          </p>
          <div className="flex flex-wrap gap-2">
            {editedDeal.ai_enriched_fields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                {FIELD_CONFIG[field]?.label || field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Field Editor Component
function FieldEditor({
  fieldName,
  config,
  value,
  onChange,
  onArrayChange,
  verification,
  isAIGenerated,
  onVerify,
  verifying,
  sources,
  primarySourceUrl
}) {
  const [showVerify, setShowVerify] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState(primarySourceUrl);

  const Icon = config.icon || FileText;
  const isVerified = verification?.verification_status === 'verified';

  // Display value for array fields
  const displayValue = config.isArray
    ? (Array.isArray(value) ? value.join(', ') : '')
    : (config.type === 'boolean' ? String(value ?? false) : (value ?? ''));

  const handleVerifyClick = () => {
    if (selectedSource) {
      onVerify(selectedSource, sourceUrl);
      setShowVerify(false);
    }
  };

  return (
    <div className={`
      bg-gray-800/50 rounded-lg p-4 border transition-colors
      ${isVerified
        ? 'border-green-500/30'
        : isAIGenerated
        ? 'border-purple-500/30'
        : 'border-gray-700/50'
      }
    `}>
      {/* Field Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <Label className="text-sm font-medium text-gray-300">
            {config.label}
            {config.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          {isAIGenerated && (
            <span className="flex items-center gap-1 text-xs text-purple-400">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
          {isVerified ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <button
              onClick={() => setShowVerify(!showVerify)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Field Input */}
      {config.type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(true)}
            className={`
              px-3 py-1 text-sm rounded border transition-colors
              ${value === true
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-700/50 text-gray-400 border-gray-600'
              }
            `}
          >
            Yes
          </button>
          <button
            onClick={() => onChange(false)}
            className={`
              px-3 py-1 text-sm rounded border transition-colors
              ${value === false
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-gray-700/50 text-gray-400 border-gray-600'
              }
            `}
          >
            No
          </button>
        </div>
      ) : config.multiline ? (
        <Textarea
          value={displayValue}
          onChange={(e) => config.isArray ? onArrayChange(e.target.value) : onChange(e.target.value)}
          className="bg-gray-900/50 border-gray-700 text-white"
          rows={3}
        />
      ) : (
        <Input
          type={config.type || 'text'}
          value={displayValue}
          onChange={(e) => {
            const val = config.type === 'number' ? Number(e.target.value) : e.target.value;
            config.isArray ? onArrayChange(e.target.value) : onChange(val);
          }}
          className="bg-gray-900/50 border-gray-700 text-white"
          placeholder={config.isArray ? 'Comma-separated values' : ''}
        />
      )}

      {/* Verification Source */}
      {verification && (
        <div className="mt-2 text-xs text-gray-500">
          Source: {verification.source?.name} •
          <a
            href={verification.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline ml-1"
          >
            View
          </a>
        </div>
      )}

      {/* Verify Panel */}
      {showVerify && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-gray-700/50 space-y-2"
        >
          <div>
            <Label className="text-xs text-gray-400">Source</Label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded text-white"
            >
              <option value="">Select source...</option>
              {sources.map((source) => (
                <option key={source.slug} value={source.slug}>
                  {source.name} ({source.reliability_score}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Source URL</Label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="mt-1 bg-gray-900/50 border-gray-700 text-white text-sm"
              placeholder="https://..."
            />
          </div>
          <Button
            size="sm"
            onClick={handleVerifyClick}
            disabled={!selectedSource || verifying}
            className="w-full"
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm Verification
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
