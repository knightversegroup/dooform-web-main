'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Shield, User, X, Plus, Minus } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { UserListItem, Role, QuotaTransaction } from '@/lib/auth/types';
import LogoLoaderInline from '@/app/components/LogoLoaderInline';

// ============================================================================
// Sub-components
// ============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LogoLoaderInline size="lg" />
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-sm text-red-600 mb-4">{message}</p>
        <button
          onClick={onBack}
          className="text-sm text-[#000091] hover:underline font-medium"
        >
          กลับไปหน้าก่อนหน้า
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

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
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
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
      alert('กรุณากรอกจำนวนที่ถูกต้อง');
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
      alert(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตโควต้าได้');
    } finally {
      setSubmittingQuota(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      alert('กรุณาเลือกบทบาท');
      return;
    }

    try {
      setSubmittingRole(true);
      await apiClient.assignRole(userId, selectedRole);
      setSelectedRole('');
      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถกำหนดบทบาทได้');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleRemoveRole = async (roleId: number, roleName: string) => {
    if (!confirm(`ต้องการลบบทบาท ${roleName === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'} จากผู้ใช้นี้หรือไม่?`)) {
      return;
    }

    try {
      await apiClient.removeRole(userId, roleId);
      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถลบบทบาทได้');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return <ErrorState message={error || 'ไม่พบผู้ใช้'} onBack={() => router.back()} />;
  }

  // Get available roles (not already assigned)
  const availableRoles = roles.filter(
    (role) => !user.roles.includes(role.name as 'admin' | 'user')
  );

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
  const quotaPercentage = user.quota?.total ? (user.quota.remaining / user.quota.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-6 py-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#000091] mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>กลับไปหน้าจัดการผู้ใช้</span>
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-[#000091]" />
            <h1 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
          </div>
          <p className="text-sm text-gray-500 ml-9">
            {displayName}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        {/* User Info Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            {user.picture_url ? (
              <img
                src={user.picture_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#000091]/10 flex items-center justify-center">
                <span className="text-2xl text-[#000091] font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {displayName}
              </h2>
              <p className="text-gray-500">{user.email || 'ไม่มีอีเมล'}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                  {user.auth_provider}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roles Section */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#000091]" />
              บทบาท
            </h3>

            {/* Current Roles */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">บทบาทปัจจุบัน:</p>
              <div className="flex gap-2 flex-wrap">
                {user.roles.length === 0 ? (
                  <span className="text-gray-400 text-sm">ยังไม่ได้กำหนดบทบาท</span>
                ) : (
                  user.roles.map((roleName) => {
                    const role = roles.find(r => r.name === roleName);
                    return (
                      <span
                        key={roleName}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded ${
                          roleName === 'admin'
                            ? 'bg-[#000091] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {roleName === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
                        {role && (
                          <button
                            onClick={() => handleRemoveRole(role.id, roleName)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
                >
                  <option value="">เลือกบทบาทที่ต้องการเพิ่ม...</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'} ({role.display_name})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={submittingRole || !selectedRole}
                  className="px-4 py-2 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#000091]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingRole ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                </button>
              </form>
            )}
          </div>

          {/* Quota Section */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#000091]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              โควต้า
            </h3>

            {/* Current Quota */}
            <div className="mb-4 p-4 bg-gray-50 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">โควต้าปัจจุบัน:</span>
                <span className="font-semibold text-gray-900">
                  {user.quota?.remaining ?? 0} / {user.quota?.total ?? 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#000091] h-2 rounded-full transition-all"
                  style={{ width: `${quotaPercentage}%` }}
                />
              </div>
            </div>

            {/* Modify Quota Form */}
            <form onSubmit={handleQuotaSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuotaMode('add')}
                  className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors flex items-center justify-center gap-1.5 ${
                    quotaMode === 'add'
                      ? 'bg-[#000091] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มโควต้า
                </button>
                <button
                  type="button"
                  onClick={() => setQuotaMode('set')}
                  className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${
                    quotaMode === 'set'
                      ? 'bg-[#000091] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  กำหนดโควต้า
                </button>
              </div>

              <input
                type="number"
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                placeholder={quotaMode === 'add' ? 'จำนวนที่ต้องการเพิ่ม' : 'จำนวนโควต้าใหม่'}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
              />

              <input
                type="text"
                value={quotaReason}
                onChange={(e) => setQuotaReason(e.target.value)}
                placeholder="เหตุผล (ไม่บังคับ)"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
              />

              <button
                type="submit"
                disabled={submittingQuota || !quotaAmount}
                className="w-full py-2 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#000091]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingQuota ? 'กำลังอัปเดต...' : quotaMode === 'add' ? 'เพิ่มโควต้า' : 'กำหนดโควต้า'}
              </button>
            </form>
          </div>
        </div>

        {/* Quota History */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 mt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">ประวัติโควต้า</h3>

          {quotaHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">ยังไม่มีประวัติการใช้งานโควต้า</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-sm text-gray-600">วันที่</th>
                    <th className="text-left px-4 py-3 font-medium text-sm text-gray-600">ประเภท</th>
                    <th className="text-left px-4 py-3 font-medium text-sm text-gray-600">จำนวน</th>
                    <th className="text-left px-4 py-3 font-medium text-sm text-gray-600">ยอดคงเหลือ</th>
                    <th className="text-left px-4 py-3 font-medium text-sm text-gray-600">เหตุผล</th>
                  </tr>
                </thead>
                <tbody>
                  {quotaHistory.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(tx.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            tx.transaction_type === 'add' || tx.transaction_type === 'refund'
                              ? 'bg-green-100 text-green-800'
                              : tx.transaction_type === 'use'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-[#000091]/10 text-[#000091]'
                          }`}
                        >
                          {tx.transaction_type === 'add' && 'เพิ่ม'}
                          {tx.transaction_type === 'use' && 'ใช้'}
                          {tx.transaction_type === 'refund' && 'คืน'}
                          {tx.transaction_type === 'set' && 'กำหนด'}
                          {tx.transaction_type === 'reset' && 'รีเซ็ต'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-medium ${
                            tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.balance_after}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
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
    </div>
  );
}
