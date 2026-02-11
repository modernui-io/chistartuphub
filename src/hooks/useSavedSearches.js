import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import posthog from 'posthog-js';

export const useSavedSearches = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedSearches = [], isLoading } = useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
    retry: false,
  });

  const saveSearch = useMutation({
    mutationFn: async ({ name, query, searchMode, filters, activeCategory }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name,
          query,
          search_mode: searchMode,
          filters: filters || {},
          active_category: activeCategory || 'all',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      posthog.capture('search_saved', {
        search_mode: data.search_mode,
        has_filters: Object.keys(data.filters || {}).length > 0,
      });
      toast.success('Search saved', { description: `"${data.name}" added to your saved searches` });
    },
    onError: (error) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Already saved');
      } else {
        toast.error('Failed to save search');
      }
    },
  });

  const deleteSearch = useMutation({
    mutationFn: async (id) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Search removed');
    },
    onError: () => {
      toast.error('Failed to remove search');
    },
  });

  return {
    savedSearches,
    isLoading,
    saveSearch: saveSearch.mutate,
    deleteSearch: deleteSearch.mutate,
    isSaving: saveSearch.isPending,
  };
};
