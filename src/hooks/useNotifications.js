import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch notification counts for the current user
 * - pendingRequests: Connection requests waiting for founder's response
 * - respondedOffers: Offers the user made that have been responded to
 */
export function useNotifications() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return { pendingRequests: 0, respondedOffers: 0, total: 0 };

      // Get pending connection requests for my asks (I'm the founder)
      const { count: pendingRequests } = await supabase
        .from('connection_requests')
        .select('*', { count: 'exact', head: true })
        .eq('founder_id', user.id)
        .eq('status', 'pending');

      // Get offers I made that have been accepted (I'm the helper)
      const { count: acceptedOffers } = await supabase
        .from('connection_requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)
        .eq('status', 'accepted')
        .is('viewed_by_requester', null); // Only unviewed

      return {
        pendingRequests: pendingRequests || 0,
        respondedOffers: acceptedOffers || 0,
        total: (pendingRequests || 0) + (acceptedOffers || 0),
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  return {
    pendingRequests: data?.pendingRequests || 0,
    respondedOffers: data?.respondedOffers || 0,
    total: data?.total || 0,
    isLoading,
    refetch,
  };
}
