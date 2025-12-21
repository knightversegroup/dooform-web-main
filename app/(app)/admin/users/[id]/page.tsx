'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { UserListItem, Role, QuotaTransaction } from '@/lib/auth/types';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserListItem | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [quotaHistory, setQuotaHistory] = useState<QuotaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quota form state
  const [quotaAmount, setQuotaAmount] = useState('');
  const [quotaReason, setQuotaReason] = useState('');
  const [quotaMode, setQuotaMode] = useState<'add' | 'set'>('add');
  const [submittingQuota, setSubmittingQuota] = useState(false);

  // Role form state
  const [selectedRole, setSelectedRole] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getUser(userId);
      setUser(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchRoles = useCallback(async () => {
    try {
      const result = await apiClient.getRoles();
      setRoles(result);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  const fetchQuotaHistory = useCallback(async () => {
    try {
      const result = await apiClient.getUserQuotaHistory(userId);
      setQuotaHistory(result);
    } catch (err) {
      console.error('Failed to fetch quota history:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
    fetchRoles();
    fetchQuotaHistory();
  }, [fetchUser, fetchRoles, fetchQuotaHistory]);

  const handleQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(quotaAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      setSubmittingQuota(true);
      if (quotaMode === 'add') {
        await apiClient.addQuota(userId, amount, quotaReason || undefined);
      } else {
        await apiClient.setUserQuota(userId, amount, quotaReason || undefined);
      }
      setQuotaAmount('');
      setQuotaReason('');
      fetchUser();
      fetchQuotaHistory();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update quota');
    } finally {
      setSubmittingQuota(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    try {
      setSubmittingRole(true);
      await apiClient.assignRole(userId, selectedRole);
      setSelectedRole('');
      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleRemoveRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Remove ${roleName} role from this user?`)) {
      return;
    }

    try {
      await apiClient.removeRole(userId, roleId);
      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error || 'User not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-secondary rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get available roles (not already assigned)
  const availableRoles = roles.filter(
    (role) => !user.roles.includes(role.name as 'admin' | 'user')
  );

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Manage User</h1>
          <p className="text-muted-foreground">
            {user.display_name || user.email || 'Unknown user'}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          {user.picture_url ? (
            <img
              src={user.picture_url}
              alt={user.display_name || ''}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl text-primary font-medium">
                {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name'}
            </h2>
            <p className="text-muted-foreground">{user.email || 'No email'}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 text-xs bg-muted rounded-full capitalize">
                {user.auth_provider}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  user.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roles Section */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Roles</h3>

          {/* Current Roles */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Current roles:</p>
            <div className="flex gap-2 flex-wrap">
              {user.roles.length === 0 ? (
                <span className="text-muted-foreground text-sm">No roles assigned</span>
              ) : (
                user.roles.map((roleName) => {
                  const role = roles.find(r => r.name === roleName);
                  return (
                    <span
                      key={roleName}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full ${
                        roleName === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {roleName}
                      {role && (
                        <button
                          onClick={() => handleRemoveRole(role.id, roleName)}
                          className="ml-1 hover:opacity-70"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Role Form */}
          {availableRoles.length > 0 && (
            <form onSubmit={handleAssignRole} className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select role to add...</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.display_name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submittingRole || !selectedRole}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                {submittingRole ? 'Adding...' : 'Add'}
              </button>
            </form>
          )}
        </div>

        {/* Quota Section */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Quota</h3>

          {/* Current Quota */}
          <div className="mb-4 p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Current quota:</span>
              <span className="font-semibold">
                {user.quota?.remaining ?? 0} / {user.quota?.total ?? 0}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: user.quota?.total
                    ? `${(user.quota.remaining / user.quota.total) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Modify Quota Form */}
          <form onSubmit={handleQuotaSubmit} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuotaMode('add')}
                className={`flex-1 py-2 text-sm rounded-md ${
                  quotaMode === 'add'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                Add Quota
              </button>
              <button
                type="button"
                onClick={() => setQuotaMode('set')}
                className={`flex-1 py-2 text-sm rounded-md ${
                  quotaMode === 'set'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                Set Quota
              </button>
            </div>

            <input
              type="number"
              value={quotaAmount}
              onChange={(e) => setQuotaAmount(e.target.value)}
              placeholder={quotaMode === 'add' ? 'Amount to add' : 'New total quota'}
              min="1"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />

            <input
              type="text"
              value={quotaReason}
              onChange={(e) => setQuotaReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />

            <button
              type="submit"
              disabled={submittingQuota || !quotaAmount}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {submittingQuota ? 'Updating...' : quotaMode === 'add' ? 'Add Quota' : 'Set Quota'}
            </button>
          </form>
        </div>
      </div>

      {/* Quota History */}
      <div className="bg-card rounded-lg border shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Quota History</h3>

        {quotaHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No quota transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">Date</th>
                  <th className="text-left p-2 font-medium text-sm">Type</th>
                  <th className="text-left p-2 font-medium text-sm">Amount</th>
                  <th className="text-left p-2 font-medium text-sm">Balance After</th>
                  <th className="text-left p-2 font-medium text-sm">Reason</th>
                </tr>
              </thead>
              <tbody>
                {quotaHistory.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="p-2 text-sm">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full capitalize ${
                          tx.transaction_type === 'add' || tx.transaction_type === 'refund'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : tx.transaction_type === 'use'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      <span
                        className={
                          tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td className="p-2 text-sm font-medium">{tx.balance_after}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {tx.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
