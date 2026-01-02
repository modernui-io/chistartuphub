import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing founder asks
 */
export function useFounderAsks() {
  const [asks, setAsks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all active asks
  const fetchAsks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      // Transform data for UI
      const transformedAsks = (data || []).map(ask => ({
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
        expiresAt: ask.expires_at,
        isActive: ask.is_active,
        userId: ask.user_id,
      }));

      setAsks(transformedAsks);
    } catch (err) {
      console.error('Error fetching founder asks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsks();
  }, [fetchAsks]);

  return { asks, loading, error, refetch: fetchAsks };
}

/**
 * Hook for creating a founder ask
 */
export function useCreateFounderAsk() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createAsk = async (askData) => {
    if (!user) {
      throw new Error('Must be logged in to create an ask');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      console.error('Error creating founder ask:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { createAsk, loading, error };
}

/**
 * Hook for connection requests
 */
export function useConnectionRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendRequest = async (askId, founderId, linkedinUrl, context) => {
    if (!user) {
      throw new Error('Must be logged in to send a connection request');
    }

    try {
      setLoading(true);
      setError(null);

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

      const { data, error: insertError } = await supabase
        .from('connection_requests')
        .insert({
          ask_id: askId,
          requester_id: user.id,
          founder_id: founderId,
          requester_linkedin: linkedinUrl,
          requester_context: context,
          requester_email: user.email,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Increment connection request count
      await supabase.rpc('increment_connection_count', { ask_uuid: askId });

      return { data, error: null };
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { sendRequest, loading, error };
}

/**
 * Hook for founder to view their requests
 */
export function useMyConnectionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching connection requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const respondToRequest = async (requestId, status, response = null) => {
    try {
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({
          status,
          founder_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('founder_id', user.id);

      if (updateError) throw updateError;

      // Refresh requests
      await fetchRequests();
      return { error: null };
    } catch (err) {
      console.error('Error responding to request:', err);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests, respondToRequest };
}

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
}
