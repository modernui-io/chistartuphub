import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import posthog from 'posthog-js';

// Query key constants
export const FOUNDER_ASKS_KEY = ['founder-asks'];
export const CONNECTION_REQUESTS_KEY = ['connection-requests'];

// Fetch function for founder asks
async function fetchFounderAsks() {
  const { data, error } = await supabase
    .from('founder_asks')
    .select(`
      *,
      user_profiles (
        full_name,
        avatar_url,
        company_name
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ERROR] Failed to fetch founder asks:', error.message);
    throw error;
  }

  // Transform data for UI
  return (data || []).map(ask => ({
    id: ask.id,
    category: ask.category || 'general_advice',
    sector: ask.sector,
    description: ask.description,
    stage: ask.stage,
    amount: ask.amount,
    target: ask.target_amount,
    linkedIn: ask.linkedin_url,
    companyName: ask.company_name || ask.user_profiles?.company_name,
    founderName: ask.is_anonymous ? null : ask.user_profiles?.full_name,
    founderAvatar: ask.is_anonymous ? null : ask.user_profiles?.avatar_url,
    isAnonymous: ask.is_anonymous,
    allowAmplification: ask.allow_amplification,
    isVerified: ask.is_verified,
    viewCount: ask.view_count,
    connectionCount: ask.connection_request_count,
    createdAt: formatTimeAgo(ask.created_at),
    createdAtRaw: ask.created_at,
    expiresAt: ask.expires_at,
    isActive: ask.is_active,
    userId: ask.user_id,
  }));
}

/**
 * Hook for managing founder asks with React Query caching
 */
export function useFounderAsks() {
  const { data: asks = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: FOUNDER_ASKS_KEY,
    queryFn: fetchFounderAsks,
  });

  return {
    asks,
    loading,
    error: error?.message || null,
    refetch
  };
}

/**
 * Hook for creating a founder ask with automatic cache invalidation
 */
export function useCreateFounderAsk() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (askData) => {
      if (!user) {
        throw new Error('Must be logged in to create an ask');
      }

      const { data, error } = await supabase
        .from('founder_asks')
        .insert({
          user_id: user.id,
          category: askData.category,
          sector: askData.sector,
          description: askData.description,
          stage: askData.stage,
          amount: askData.amount,
          target_amount: askData.targetAmount,
          company_name: askData.companyName,
          linkedin_url: askData.linkedinUrl,
          website_url: askData.websiteUrl,
          is_anonymous: askData.isAnonymous,
          allow_amplification: askData.allowAmplification,
        })
        .select()
        .single();

      if (error) throw error;

      // Track founder ask creation
      posthog.capture('founder_ask_posted', {
        category: askData.category,
        sector: askData.sector,
        stage: askData.stage,
        is_anonymous: askData.isAnonymous,
        allow_amplification: askData.allowAmplification,
        has_amount: !!askData.amount,
      });

      return data;
    },
    onSuccess: () => {
      // Invalidate founder asks cache to refetch fresh data
      queryClient.invalidateQueries({ queryKey: FOUNDER_ASKS_KEY });
    },
  });

  // Wrapper to maintain API compatibility
  const createAsk = async (askData) => {
    try {
      const data = await mutation.mutateAsync(askData);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating founder ask:', err);
      return { data: null, error: err };
    }
  };

  return {
    createAsk,
    loading: mutation.isPending,
    error: mutation.error?.message || null
  };
}

/**
 * Hook for connection requests with cache invalidation
 */
export function useConnectionRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ askId, founderId, linkedinUrl, context }) => {
      if (!user) {
        throw new Error('Must be logged in to send a connection request');
      }

      // Check if request already exists
      const { data: existing } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('ask_id', askId)
        .eq('requester_id', user.id)
        .single();

      if (existing) {
        throw new Error('You have already requested to connect with this founder');
      }

      // NOTE: requester_email removed - fetch from user_profiles_decrypted via requester_id when needed
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          ask_id: askId,
          requester_id: user.id,
          founder_id: founderId,
          requester_linkedin: linkedinUrl,
          requester_context: context,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment connection request count
      await supabase.rpc('increment_connection_count', { ask_uuid: askId });

      // Track connection request
      posthog.capture('connection_requested', {
        ask_id: askId,
        has_linkedin: !!linkedinUrl,
        has_context: !!context,
      });

      return data;
    },
    onSuccess: () => {
      // Invalidate both asks and connection requests cache
      queryClient.invalidateQueries({ queryKey: FOUNDER_ASKS_KEY });
      queryClient.invalidateQueries({ queryKey: CONNECTION_REQUESTS_KEY });
    },
  });

  // Wrapper to maintain API compatibility
  const sendRequest = async (askId, founderId, linkedinUrl, context) => {
    try {
      const data = await mutation.mutateAsync({ askId, founderId, linkedinUrl, context });
      return { data, error: null };
    } catch (err) {
      console.error('Error sending connection request:', err);
      return { data: null, error: err };
    }
  };

  return {
    sendRequest,
    loading: mutation.isPending,
    error: mutation.error?.message || null
  };
}

/**
 * Hook for founder to view their requests with React Query caching
 */
export function useMyConnectionRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for fetching connection requests
  const { data: requests = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: [...CONNECTION_REQUESTS_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          founder_asks (
            sector,
            description,
            stage
          )
        `)
        .eq('founder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Mutation for responding to requests
  const respondMutation = useMutation({
    mutationFn: async ({ requestId, status, response }) => {
      const { error } = await supabase
        .from('connection_requests')
        .update({
          status,
          founder_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('founder_id', user.id);

      if (error) throw error;

      // Track connection response
      posthog.capture('connection_responded', {
        request_id: requestId,
        status: status, // 'accepted', 'declined', etc.
        has_response_message: !!response,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_REQUESTS_KEY });
    },
  });

  const respondToRequest = async (requestId, status, response = null) => {
    try {
      await respondMutation.mutateAsync({ requestId, status, response });
      return { error: null };
    } catch (err) {
      console.error('Error responding to request:', err);
      return { error: err };
    }
  };

  return {
    requests,
    loading,
    error: error?.message || null,
    refetch,
    respondToRequest
  };
}

// Helper function to format time ago with date validation
function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);

  // Validate date is valid
  if (isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  // Handle future dates
  if (seconds < 0) return 'just now';

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
}
