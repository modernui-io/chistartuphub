import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
          console.warn('Bookmarks query error (table may not exist):', error.message);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('Bookmarks fetch error:', err);
        return [];
      }
    },
    enabled: !!user,
    retry: false, // Don't retry if table doesn't exist
  });

  // Add bookmark
  const addBookmark = useMutation({
    mutationFn: async ({ resourceType, resourceId, resourceName, notes }) => {
      if (!user) throw new Error('Must be logged in to bookmark');

      console.log('Adding bookmark:', { resourceType, resourceId, resourceName, userId: user.id });

      // First try with resource_name, fall back to without it if column doesn't exist
      let result = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          resource_type: resourceType,
          resource_id: String(resourceId), // Ensure it's a string
          resource_name: resourceName || null,
          notes: notes || null,
        })
        .select()
        .single();

      // If resource_name column doesn't exist, try without it
      if (result.error && result.error.message?.includes('resource_name')) {
        console.log('Retrying without resource_name column...');
        result = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            resource_type: resourceType,
            resource_id: String(resourceId),
            notes: notes || null,
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Bookmark insert error:', JSON.stringify(result.error, null, 2));
        console.error('Error code:', result.error.code);
        console.error('Error message:', result.error.message);
        console.error('Error details:', result.error.details);
        console.error('Error hint:', result.error.hint);
        throw result.error;
      }

      console.log('Bookmark added successfully:', result.data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmarked', {
        description: 'Added to your saved items',
      });
    },
    onError: (error) => {
      console.error('Bookmark error:', error);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Removed', {
        description: 'Removed from your saved items',
      });
    },
    onError: (error) => {
      console.error('Remove bookmark error:', error);
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
