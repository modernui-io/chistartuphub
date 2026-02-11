import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import posthog from 'posthog-js';

export const useSavedLists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedLists = [], isLoading } = useQuery({
    queryKey: ['saved-lists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
    retry: false,
  });

  const saveList = useMutation({
    mutationFn: async ({ name, investorIds }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('saved_lists')
        .insert({
          user_id: user.id,
          name,
          investor_ids: investorIds,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] });
      posthog.capture('list_saved', { count: data.investor_ids?.length || 0 });
      toast.success('List saved', {
        description: `"${data.name}" with ${data.investor_ids?.length || 0} investors`,
      });
    },
    onError: () => toast.error('Failed to save list'),
  });

  const deleteList = useMutation({
    mutationFn: async (id) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('saved_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] });
      toast.success('List removed');
    },
    onError: () => toast.error('Failed to remove list'),
  });

  const updateList = useMutation({
    mutationFn: async ({ id, name, investorIds }) => {
      if (!user) throw new Error('Must be logged in');
      const updates = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (investorIds !== undefined) updates.investor_ids = investorIds;
      const { data, error } = await supabase
        .from('saved_lists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] });
    },
    onError: () => toast.error('Failed to update list'),
  });

  return {
    savedLists,
    isLoading,
    saveList: saveList.mutate,
    deleteList: deleteList.mutate,
    updateList: updateList.mutate,
    isSaving: saveList.isPending,
  };
};
