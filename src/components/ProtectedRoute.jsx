import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAILS } from '@/constants/adminEmails';
import PageSkeleton from '@/components/PageSkeleton';

/**
 * Route guard that requires authentication.
 * - Shows loading skeleton while checking auth state
 * - Redirects to home and opens login modal if not authenticated
 * - Optionally requires admin role
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, openLogin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If not loading and no user, prompt login
    if (!loading && !user) {
      openLogin();
    }
  }, [loading, user, openLogin]);

  // Still checking auth state
  if (loading) {
    return <PageSkeleton />;
  }

  // Not authenticated - redirect to home
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin) {
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
