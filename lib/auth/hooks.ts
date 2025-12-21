'use client';

import { useMemo } from 'react';
import { useAuth } from './context';
import type { RoleName, QuotaInfo } from './types';

/**
 * Hook to get the current user's roles
 */
export function useRoles(): RoleName[] {
  const { user } = useAuth();
  return user?.roles ?? [];
}

/**
 * Hook to check if the current user has a specific role
 */
export function useHasRole(role: RoleName): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}

/**
 * Hook to get quota information
 */
export function useQuota(): {
  quota: QuotaInfo | undefined;
  hasQuota: boolean;
  remaining: number;
  refreshQuota: () => Promise<void>;
} {
  const { user, refreshQuota } = useAuth();

  return useMemo(() => ({
    quota: user?.quota,
    hasQuota: (user?.quota?.total ?? 0) > 0,
    remaining: user?.quota?.remaining ?? 0,
    refreshQuota,
  }), [user?.quota, refreshQuota]);
}

/**
 * Hook to check if the user can perform a specific action
 */
export function useCanPerformAction(action: 'create_template' | 'edit_template' | 'delete_template' | 'generate_document' | 'manage_users'): boolean {
  const { isAdmin, canGenerate } = useAuth();

  switch (action) {
    case 'create_template':
    case 'edit_template':
    case 'delete_template':
    case 'manage_users':
      // Only admins can create/edit/delete templates or manage users
      return isAdmin;
    case 'generate_document':
      // Users need quota, admins can always generate
      return canGenerate;
    default:
      return false;
  }
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(): {
  canCreateTemplate: boolean;
  canEditTemplate: boolean;
  canDeleteTemplate: boolean;
  canGenerateDocument: boolean;
  canManageUsers: boolean;
  isAdmin: boolean;
} {
  const { isAdmin, canGenerate } = useAuth();

  return useMemo(() => ({
    canCreateTemplate: isAdmin,
    canEditTemplate: isAdmin,
    canDeleteTemplate: isAdmin,
    canGenerateDocument: canGenerate,
    canManageUsers: isAdmin,
    isAdmin,
  }), [isAdmin, canGenerate]);
}
