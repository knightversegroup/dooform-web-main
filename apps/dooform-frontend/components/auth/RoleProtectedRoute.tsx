'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@dooform/shared/auth/hooks';
import type { RoleName } from '@dooform/shared/auth/types';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: RoleName[];
  requireQuota?: boolean;
  fallbackUrl?: string;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
}

/**
 * A component that protects routes based on user roles and quota.
 *
 * @param children - The content to render if access is granted
 * @param requiredRoles - Array of roles that can access this route (any one of them grants access)
 * @param requireQuota - If true, checks that user has remaining quota (or is admin)
 * @param fallbackUrl - URL to redirect to if access is denied (default: '/templates')
 * @param loadingComponent - Custom component to show while loading auth state
 * @param unauthorizedComponent - Custom component to show when unauthorized (instead of redirect)
 */
export function RoleProtectedRoute({
  children,
  requiredRoles,
  requireQuota = false,
  fallbackUrl = '/templates',
  loadingComponent,
  unauthorizedComponent,
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, hasRole, isAdmin, canGenerate } = useAuth();

  // Check if user has access based on roles
  const hasRequiredRole = !requiredRoles || requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  // Check if user has quota (or is admin, who bypasses quota)
  const hasQuotaAccess = !requireQuota || canGenerate;

  // Combined access check
  const hasAccess = isAuthenticated && hasRequiredRole && hasQuotaAccess;

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      // If not authenticated at all, redirect to login
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      // If authenticated but doesn't have access, and no custom unauthorized component, redirect
      if (!unauthorizedComponent) {
        router.replace(fallbackUrl);
      }
    }
  }, [isLoading, hasAccess, isAuthenticated, unauthorizedComponent, fallbackUrl, router]);

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized component if provided and user doesn't have access
  if (!hasAccess && unauthorizedComponent) {
    return <>{unauthorizedComponent}</>;
  }

  // Don't render children if access check failed (redirect will happen in useEffect)
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Convenience component for admin-only routes
 */
export function AdminOnlyRoute({
  children,
  fallbackUrl = '/templates',
  loadingComponent,
  unauthorizedComponent,
}: Omit<RoleProtectedRouteProps, 'requiredRoles' | 'requireQuota'>) {
  return (
    <RoleProtectedRoute
      requiredRoles={['admin']}
      fallbackUrl={fallbackUrl}
      loadingComponent={loadingComponent}
      unauthorizedComponent={unauthorizedComponent}
    >
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * Component to show when user doesn't have permission
 */
export function AccessDenied({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-destructive/10 rounded-full p-4 mb-4">
        <svg
          className="w-12 h-12 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {message || "You don't have permission to access this page."}
      </p>
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}

/**
 * Component to show when user doesn't have quota
 */
export function QuotaExhausted() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-warning/10 rounded-full p-4 mb-4">
        <svg
          className="w-12 h-12 text-warning"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Quota Exhausted</h2>
      <p className="text-muted-foreground text-center max-w-md mb-2">
        You have used all your available document generation quota.
      </p>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Please contact an administrator to request additional quota.
      </p>
    </div>
  );
}
