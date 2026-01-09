import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { sendConnectionAcceptedEmail, sendConnectionDeclinedEmail } from '@/lib/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Clock,
  Check,
  X,
  Linkedin,
  ExternalLink,
  AlertCircle,
  Inbox,
  CheckCircle2,
  XCircle,
  Timer,
  Plus,
  MessageSquarePlus
} from 'lucide-react';
import { toast } from 'sonner';

// Category labels for display
const CATEGORY_LABELS = {
  fundraising: 'Fundraising',
  cofounder: 'Co-founder Search',
  general_advice: 'General Advice',
};

// Status badge styles
const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  declined: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

// Format time remaining
function formatTimeRemaining(expiresAt) {
  if (!expiresAt) return 'Unknown';
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  
  return `${minutes}m left`;
}

export default function ConnectionRequests({ hasAsks = true, onPostAsk }) {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, all, accepted, declined

  // Fetch connection requests
  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          founder_asks (
            id,
            category,
            sector,
            description
          )
        `)
        .eq('founder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('connection_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `founder_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  // Handle accept request
  const handleAccept = (request) => {
    setSelectedRequest(request);
    setLinkedInUrl(profile?.linkedin_url || '');
    setShowLinkedInModal(true);
  };

  // Confirm accept with LinkedIn
  const confirmAccept = async () => {
    if (!linkedInUrl.trim()) {
      toast.error('Please enter your LinkedIn URL');
      return;
    }

    if (!linkedInUrl.includes('linkedin.com')) {
      toast.error('Please enter a valid LinkedIn URL');
      return;
    }

    setProcessingId(selectedRequest.id);

    try {
      // Call the database function to accept
      const { error } = await supabase.rpc('accept_connection_request', {
        request_uuid: selectedRequest.id,
        linkedin_url: linkedInUrl.trim()
      });

      if (error) throw error;

      // Fetch requester's email from encrypted store and send notification
      const { data: requesterProfile } = await supabase
        .from('user_profiles_decrypted')
        .select('email')
        .eq('id', selectedRequest.requester_id)
        .single();

      if (requesterProfile?.email) {
        const emailResult = await sendConnectionAcceptedEmail(requesterProfile.email, {
          helperName: selectedRequest.requester_name || 'Helper',
          founderName: profile?.full_name || 'Founder',
          founderEmail: user.email,
          founderLinkedIn: linkedInUrl.trim(),
          askDescription: selectedRequest.founder_asks?.description || 'Your ask',
        });

        if (!emailResult.success) {
          console.warn('[CONNECTION] Email notification failed:', emailResult.error);
        }
      }

      toast.success('Request accepted!', {
        description: 'Your LinkedIn has been shared with the helper'
      });

      setShowLinkedInModal(false);
      setSelectedRequest(null);
      setLinkedInUrl('');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle decline request
  const handleDecline = async (request) => {
    setProcessingId(request.id);

    try {
      // Call the database function to decline
      const { error } = await supabase.rpc('decline_connection_request', {
        request_uuid: request.id
      });

      if (error) throw error;

      // Fetch requester's email from encrypted store and send notification
      const { data: requesterProfile } = await supabase
        .from('user_profiles_decrypted')
        .select('email')
        .eq('id', request.requester_id)
        .single();

      if (requesterProfile?.email) {
        const emailResult = await sendConnectionDeclinedEmail(requesterProfile.email, {
          helperName: request.requester_name || 'Helper',
          founderName: profile?.full_name || 'Founder',
          askDescription: request.founder_asks?.description || 'The ask',
        });

        if (!emailResult.success) {
          console.warn('[CONNECTION] Decline email failed:', emailResult.error);
        }
      }

      toast.success('Request declined');
      fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Connection Requests</h2>
          <p className="text-sm text-white/50 mt-1">
            People who want to help with your asks
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['pending', 'accepted', 'declined', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === status
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-black/20 border border-white/5 rounded-lg"
        >
          {!hasAsks ? (
            <>
              <div className="w-16 h-16 rounded-none bg-black/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                <MessageSquarePlus className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/60 mb-2 text-lg">No requests yet</p>
              <p className="text-white/40 text-sm mb-2">This is where you'll manage connection requests from helpers.</p>
              <p className="text-white/30 text-xs mb-8">Post your first ask to start receiving help from the community.</p>
              {onPostAsk && (
                <Button
                  onClick={onPostAsk}
                  className="bg-white text-black hover:bg-white/90 rounded-none px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Post an Ask
                </Button>
              )}
            </>
          ) : (
            <>
              <Inbox className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/60 mb-2">
                {filter === 'pending' ? 'No pending requests' : `No ${filter} requests`}
              </h3>
              <p className="text-sm text-white/40 mb-2">
                {filter === 'pending'
                  ? 'This is where you\'ll manage connection requests from helpers.'
                  : 'Requests will appear here once you have some'}
              </p>
              {filter === 'pending' && (
                <p className="text-white/30 text-xs">Founders typically receive responses within 48 hours of posting an ask.</p>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Request cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black/40 border border-white/10 rounded-lg p-5"
            >
              {/* Header: Name + Status */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">
                      {request.requester_name || 'Anonymous'}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] border ${STATUS_STYLES[request.status]}`}>
                      {request.status === 'pending' && <Clock size={10} className="inline mr-1" />}
                      {request.status === 'accepted' && <CheckCircle2 size={10} className="inline mr-1" />}
                      {request.status === 'declined' && <XCircle size={10} className="inline mr-1" />}
                      {request.status === 'expired' && <Timer size={10} className="inline mr-1" />}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Ask reference */}
                  {request.founder_asks && (
                    <p className="text-xs text-white/40">
                      Re: {CATEGORY_LABELS[request.founder_asks.category] || request.founder_asks.category} • {request.founder_asks.sector}
                    </p>
                  )}
                </div>

                {/* Time remaining for pending */}
                {request.status === 'pending' && request.expires_at && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20">
                    <Clock size={12} className="text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-400">
                      {formatTimeRemaining(request.expires_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* How they can help */}
              <div className="bg-black/30 border border-white/5 rounded-lg p-4 mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">How they can help</p>
                <p className="text-sm text-white/80 leading-relaxed">
                  {request.requester_context || 'No context provided'}
                </p>
              </div>

              {/* LinkedIn preview */}
              <a
                href={request.requester_linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-4"
              >
                <Linkedin size={14} />
                View their LinkedIn
                <ExternalLink size={12} />
              </a>

              {/* Actions for pending requests */}
              {request.status === 'pending' && (
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => handleAccept(request)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check size={16} className="mr-2" />
                        Accept & Share LinkedIn
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDecline(request)}
                    disabled={processingId === request.id}
                    variant="outline"
                    className="flex-1 border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                  >
                    <X size={16} className="mr-2" />
                    Decline
                  </Button>
                </div>
              )}

              {/* Show shared LinkedIn for accepted */}
              {request.status === 'accepted' && request.founder_linkedin && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-white/40 mb-2">You shared your LinkedIn:</p>
                  <a
                    href={request.founder_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-400 hover:text-green-300"
                  >
                    {request.founder_linkedin}
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LinkedIn Modal */}
      <AnimatePresence>
        {showLinkedInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLinkedInModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Share Your LinkedIn</h3>
              <p className="text-sm text-white/60 mb-6">
                By accepting, your LinkedIn URL will be shared with{' '}
                <span className="text-white">{selectedRequest?.requester_name}</span> so they can connect with you.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="linkedin" className="text-white/70 text-sm">
                    Your LinkedIn URL
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="mt-1.5 bg-black/40 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">
                    The conversation will happen on LinkedIn. ChiStartupHub is just the connector.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setShowLinkedInModal(false)}
                    variant="outline"
                    className="flex-1 border-white/10 text-white/60"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmAccept}
                    disabled={processingId}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Accept & Share'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
