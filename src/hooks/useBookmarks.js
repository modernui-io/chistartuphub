import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import posthog from 'posthog-js';

export const useBookmarks = (resourceType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's bookmarks
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id, resourceType],
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id);

        if (resourceType) {
          query = query.eq('resource_type', resourceType);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        // If table doesn't exist, return empty array silently
        if (error) {
          return [];
        }
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    retry: false, // Don't retry if table doesn't exist
  });

  // Add bookmark
  const addBookmark = useMutation({
    mutationFn: async ({ resourceType, resourceId, resourceName, resourceDescription, resourceUrl, notes }) => {
      if (!user) throw new Error('Must be logged in to bookmark');

      // Start with minimal required fields, then try adding optional columns
      const baseData = {
        user_id: user.id,
        resource_type: resourceType,
        resource_id: String(resourceId),
      };

      // Try with all fields first
      let result = await supabase
        .from('bookmarks')
        .insert({
          ...baseData,
          resource_name: resourceName || null,
          resource_description: resourceDescription || null,
          resource_url: resourceUrl || null,
          notes: notes || null,
        })
        .select()
        .single();

      // If columns don't exist, try progressively simpler inserts
      if (result.error?.code === 'PGRST204' || result.error?.message?.includes('column')) {
        result = await supabase
          .from('bookmarks')
          .insert({
            ...baseData,
            resource_name: resourceName || null,
            notes: notes || null,
          })
          .select()
          .single();
      }

      // If resource_name also doesn't exist, try with just base fields
      if (result.error?.code === 'PGRST204' || result.error?.message?.includes('column')) {
        result = await supabase
          .from('bookmarks')
          .insert({
            ...baseData,
            notes: notes || null,
          })
          .select()
          .single();
      }

      // Final fallback - just the absolute minimum
      if (result.error?.code === 'PGRST204' || result.error?.message?.includes('column')) {
        result = await supabase
          .from('bookmarks')
          .insert(baseData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });

      // Track bookmark creation
      posthog.capture('resource_saved', {
        resource_type: variables.resourceType,
        resource_id: variables.resourceId,
        resource_name: variables.resourceName,
      });

      toast.success('Bookmarked', {
        description: 'Added to your saved items',
      });
    },
    onError: (error) => {
      // More helpful error messages
      let errorMessage = 'Failed to bookmark';
      if (error.message?.includes('violates row-level security')) {
        errorMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'Already bookmarked!';
      } else if (error.message?.includes('does not exist')) {
        errorMessage = 'Bookmarks not set up yet. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Error', { description: errorMessage });
    },
  });

  // Remove bookmark
  const removeBookmark = useMutation({
    mutationFn: async (bookmarkId) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
    },
    onSuccess: (data, bookmarkId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });

      // Track bookmark removal
      posthog.capture('resource_unsaved', {
        bookmark_id: bookmarkId,
      });

      toast.success('Removed', {
        description: 'Removed from your saved items',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Failed to remove bookmark',
      });
    },
  });

  // Check if resource is bookmarked
  const isBookmarked = (resourceType, resourceId) => {
    return bookmarks.some(
      (b) => b.resource_type === resourceType && b.resource_id === resourceId
    );
  };

  // Get bookmark for resource
  const getBookmark = (resourceType, resourceId) => {
    return bookmarks.find(
      (b) => b.resource_type === resourceType && b.resource_id === resourceId
    );
  };

  return {
    bookmarks,
    isLoading,
    addBookmark: addBookmark.mutate,
    removeBookmark: removeBookmark.mutate,
    isBookmarked,
    getBookmark,
  };
};
