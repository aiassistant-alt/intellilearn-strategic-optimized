/**
 * @fileoverview Protected Route Component
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-12
 * @updated 2023-12-15
 * @version 1.0.0
 * 
 * @description
 * Authentication guard component that protects routes from unauthorized access.
 * Redirects unauthenticated users to the landing page.
 * 
 * @context
 * Core security component used to protect authenticated routes.
 * Used as a wrapper around private pages and components.
 * Integrates with the AuthContext to check authentication state.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added loading spinner
 * v1.0.2 - Fixed redirect logic
 */

'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

/**
 * Protected Route Props
 * @context Defines the expected props for the ProtectedRoute component
 */
type ProtectedRouteProps = {
  children: React.ReactNode
}

/**
 * Protected Route Component
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @returns {JSX.Element | null} The protected content or loading indicator
 * 
 * @context
 * Authentication guard for private routes.
 * 
 * @description
 * Wraps authenticated content and ensures only authenticated users can access it.
 * Behavior:
 * - Shows a loading spinner while checking authentication
 * - Redirects to the landing page if user is not authenticated
 * - Renders children if user is authenticated
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardLayout>
 *     <DashboardContent />
 *   </DashboardLayout>
 * </ProtectedRoute>
 * ```
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Get authentication state and router
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Debug logging
  useEffect(() => {
    console.log('🔒 [ProtectedRoute] State:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      loading,
      pathname: window.location.pathname 
    });
  }, [user, loading]);
  
  // Redirect effect
  useEffect(() => {
    // If not loading and no user, redirect to home page
    if (!loading && !user) {
      console.log('🔒 [ProtectedRoute] Redirecting to home - no user');
      router.push('/');
    }
  }, [loading, user, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('🔒 [ProtectedRoute] Showing loading spinner');
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // If not authenticated and not loading, render nothing while redirecting
  if (!user && !loading) {
    console.log('🔒 [ProtectedRoute] No user, returning null');
    return null;
  }

  // If authenticated, render the protected content
  console.log('🔒 [ProtectedRoute] User authenticated, rendering children');
  return <>{children}</>
}

export default ProtectedRoute 