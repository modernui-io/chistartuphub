import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Heart,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Linkedin,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Status badge styles
const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  declined: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

// Category labels
const CATEGORY_LABELS = {
  fundraising: 'Fundraising',
  cofounder: 'Co-founder Search',
  general_advice: 'General Advice',
};

/**
 * ProfileOffersTab - Shows helper's sent help offers
 *
 * @param {Object} props
 * @param {Array} props.offers - List of offers
 * @param {boolean} props.loading - Loading state
 */
export default function ProfileOffersTab({ offers = [], loading = false }) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">My Offers</h2>
          <p className="text-sm text-white/50 mt-1">Track the help you've offered to founders</p>
        </div>
        <Button
          asChild
          className="bg-white text-black hover:bg-white/90 rounded-none"
        >
          <Link to="/opportunities">
            <Plus size={16} className="mr-2" />
            Help More Founders
          </Link>
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-16 text-center rounded-none">
          <div className="w-16 h-16 rounded-none bg-black/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/60 mb-2 text-lg">No offers sent yet</p>
          <p className="text-white/40 text-sm mb-2">Browse founder asks and offer your expertise to help them grow.</p>
          <p className="text-white/30 text-xs mb-8">Your offers appear here so you can track their status.</p>
          <Button asChild className="bg-white text-black hover:bg-white/90 rounded-none px-6">
            <Link to="/opportunities">
              <ArrowRight size={16} className="mr-2" />
              Browse Opportunities
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Individual offer card
 */
function OfferCard({ offer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-none p-6"
    >
      {/* Status + Category */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-[10px] font-mono uppercase tracking-[0.1em] border flex items-center gap-1.5 ${STATUS_STYLES[offer.status] || STATUS_STYLES.pending}`}>
            {offer.status === 'pending' && <Clock size={10} />}
            {offer.status === 'accepted' && <CheckCircle2 size={10} />}
            {offer.status === 'declined' && <XCircle size={10} />}
            {offer.status === 'expired' && <Timer size={10} />}
            {offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1) || 'Pending'}
          </span>
          {offer.founder_asks && (
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {CATEGORY_LABELS[offer.founder_asks.category] || offer.founder_asks.category}
            </span>
          )}
        </div>
        <span className="text-xs text-white/30">
          {new Date(offer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Original Ask */}
      {offer.founder_asks && (
        <div className="mb-4 p-4 bg-black/30 border border-white/5">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">
            [ORIGINAL ASK]
          </span>
          <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
            {offer.founder_asks.description}
          </p>
          <span className="text-[10px] text-white/40 mt-2 block">
            {offer.founder_asks.sector}
          </span>
        </div>
      )}

      {/* Your offer context */}
      <div className="mb-4">
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">
          [YOUR OFFER]
        </span>
        <p className="text-sm text-white/80 leading-relaxed">
          {offer.requester_context || 'No context provided'}
        </p>
      </div>

      {/* Accepted state - show founder's LinkedIn */}
      {offer.status === 'accepted' && offer.founder_linkedin && (
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-sm text-green-400 font-medium">Connection Accepted!</span>
          </div>
          <p className="text-xs text-white/40 mb-2">The founder shared their LinkedIn - reach out to connect:</p>
          <a
            href={offer.founder_linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Linkedin size={14} />
            Connect on LinkedIn
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Pending state */}
      {offer.status === 'pending' && (
        <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/40">
          <Clock size={12} />
          <span>Waiting for founder to respond...</span>
        </div>
      )}

      {/* Declined state */}
      {offer.status === 'declined' && (
        <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/40">
          <XCircle size={12} />
          <span>The founder declined this offer. Keep helping others!</span>
        </div>
      )}
    </motion.div>
  );
}
