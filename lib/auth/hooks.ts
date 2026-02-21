'use client';

import { useMemo } from 'react';
import { useAuth } from './context';
import type { QuotaInfo } from './types';

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
