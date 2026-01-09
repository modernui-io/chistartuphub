import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  Loader2,
  MessageSquarePlus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Category labels
const CATEGORY_LABELS = {
  fundraising: 'Fundraising',
  cofounder: 'Co-founder',
  general_advice: 'General Advice',
};

/**
 * ProfileAsksTab - Shows founder's asks
 *
 * @param {Object} props
 * @param {Array} props.asks - List of asks
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onPostAsk - Handler to open post ask modal
 * @param {Function} props.onViewRequests - Handler to switch to requests tab
 */
export default function ProfileAsksTab({
  asks = [],
  loading = false,
  onPostAsk,
  onViewRequests,
}) {
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header with Post Ask button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">My Asks</h2>
          <p className="text-sm text-white/50 mt-1">Manage your asks to the Chicago ecosystem</p>
        </div>
        <Button
          onClick={onPostAsk}
          className="bg-white text-black hover:bg-white/90 rounded-none"
        >
          <Plus size={16} className="mr-2" />
          Post New Ask
        </Button>
      </div>

      {asks.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-16 text-center rounded-none">
          <div className="w-16 h-16 rounded-none bg-black/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <MessageSquarePlus className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/60 mb-2 text-lg">No asks yet</p>
          <p className="text-white/40 text-sm mb-2">Share what you need — fundraising intros, co-founder matching, or expert advice.</p>
          <p className="text-white/30 text-xs mb-8">Your ask is visible for 14 days. Helpers can offer to connect with you.</p>
          <Button
            onClick={onPostAsk}
            className="bg-white text-black hover:bg-white/90 rounded-none px-6"
          >
            <Plus size={16} className="mr-2" />
            Post Your First Ask
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {asks.map((ask) => (
            <AskCard
              key={ask.id}
              ask={ask}
              onViewRequests={onViewRequests}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Individual ask card
 */
function AskCard({ ask, onViewRequests }) {
  const isActive = ask.is_active;
  const expiresAt = new Date(ask.expires_at);
  const isExpired = expiresAt < new Date();
  const daysLeft = Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)));
  const helpersCount = ask.connection_requests?.[0]?.count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-none p-6"
    >
      {/* Status + Category */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-[10px] font-mono uppercase tracking-[0.1em] border ${
            isExpired
              ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              : isActive
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {isExpired ? 'Expired' : isActive ? 'Active' : 'Pending'}
          </span>
          <span className="text-xs text-white/40 uppercase tracking-wider">
            {CATEGORY_LABELS[ask.category] || ask.category}
          </span>
        </div>
        {!isExpired && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock size={12} />
            {daysLeft} days left
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-white/80 text-sm leading-relaxed mb-4">
        {ask.description}
      </p>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
        <span className="px-2 py-1 bg-white/5 rounded">{ask.sector}</span>
        {ask.amount && (
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {ask.amount}
          </span>
        )}
        {ask.stage && <span>{ask.stage}</span>}
      </div>

      {/* Helpers count + View requests */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-white/40" />
          <span className="text-sm text-white/60">
            {helpersCount} {helpersCount === 1 ? 'person' : 'people'} offered to help
          </span>
        </div>
        {helpersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewRequests}
            className="border-white/10 text-white/60 hover:bg-white/5 rounded-none text-xs"
          >
            View Requests
            <ArrowRight size={12} className="ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
