'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, User, X, Plus, RotateCcw } from 'lucide-react';
import { apiClient } from '@dooform/shared/api/client';
import type { UserListItem, Role, QuotaTransaction } from '@dooform/shared/auth/types';
import { LogoLoaderInline } from '@dooform/shared';

// ============================================================================
// Sub-components
// ============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <LogoLoaderInline size="lg" />
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-red-600 mb-4">{message}</p>
      <button
        onClick={onBack}
        className="text-sm text-blue-600 hover:underline font-medium"
      >
        กลับไปหน้าก่อนหน้า
      </button>
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
    if (isNaN(amount) || (quotaMode === 'add' && amount <= 0) || (quotaMode === 'set' && amount < 0)) {
      alert(quotaMode === 'add' ? 'กรุณากรอกจำนวนที่มากกว่า 0' : 'กรุณากรอกจำนวนที่ถูกต้อง');
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

  const handleResetUsage = async () => {
    if (!confirm('ต้องการรีเซ็ตการใช้งานโควต้าหรือไม่? การดำเนินการนี้จะทำให้โควต้าที่ใช้ไปเป็น 0')) {
      return;
    }

    try {
      setSubmittingQuota(true);
      await apiClient.resetQuotaUsage(userId);
      fetchUser();
      fetchQuotaHistory();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถรีเซ็ตโควต้าได้');
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

  if (loading) return <LoadingState />;
  if (error || !user) return <ErrorState message={error || 'ไม่พบผู้ใช้'} onBack={() => router.back()} />;

  const availableRoles = roles.filter(
    (role) => !user.roles.includes(role.name as 'admin' | 'user')
  );

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
  const remaining = user.quota?.remaining ?? 0;
  const total = user.quota?.total ?? 0;
  const used = user.quota?.used ?? 0;
  const isNegative = remaining < 0;
  const quotaPercentage = total > 0 ? Math.max(0, (remaining / total) * 100) : 0;

  return (
    <div>
      {/* Back link + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>กลับไปหน้าจัดการผู้ใช้</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-sm text-gray-500 mt-1">{displayName}</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-4">
          {user.picture_url ? (
            <img
              src={user.picture_url}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl text-blue-600 font-medium">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </h2>
            <p className="text-sm text-gray-500 truncate">{user.email || 'ไม่มีอีเมล'}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
                {user.auth_provider}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  user.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
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
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            บทบาท
          </h3>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">บทบาทปัจจุบัน:</p>
            <div className="flex gap-2 flex-wrap">
              {user.roles.length === 0 ? (
                <span className="text-gray-400 text-sm">ยังไม่ได้กำหนดบทบาท</span>
              ) : (
                user.roles.map((roleName) => {
                  const role = roles.find(r => r.name === roleName);
                  return (
                    <span
                      key={roleName}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        roleName === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {roleName === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
                      {role && (
                        <button
                          onClick={() => handleRemoveRole(role.id, roleName)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {availableRoles.length > 0 && (
            <form onSubmit={handleAssignRole} className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingRole ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
              </button>
            </form>
          )}
        </div>

        {/* Quota Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            โควต้า
          </h3>

          {/* Current Quota */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">โควต้าปัจจุบัน:</span>
              <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
                {remaining} / {total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${isNegative ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
            {isNegative && (
              <p className="text-xs text-red-600 mt-2">
                ใช้งานเกินโควต้า {Math.abs(remaining)} รายการ (ใช้ไป {used}, กำหนด {total})
              </p>
            )}
            {used > 0 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">ใช้งานแล้ว: {used} รายการ</span>
                <button
                  type="button"
                  onClick={handleResetUsage}
                  disabled={submittingQuota}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ตการใช้งาน
                </button>
              </div>
            )}
          </div>

          {/* Modify Quota Form */}
          <form onSubmit={handleQuotaSubmit} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuotaMode('add')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  quotaMode === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มโควต้า
              </button>
              <button
                type="button"
                onClick={() => setQuotaMode('set')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                  quotaMode === 'set'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              min={quotaMode === 'add' ? '1' : '0'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="text"
              value={quotaReason}
              onChange={(e) => setQuotaReason(e.target.value)}
              placeholder="เหตุผล (ไม่บังคับ)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              type="submit"
              disabled={submittingQuota || !quotaAmount}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingQuota ? 'กำลังอัปเดต...' : quotaMode === 'add' ? 'เพิ่มโควต้า' : 'กำหนดโควต้า'}
            </button>
          </form>
        </div>
      </div>

      {/* Quota History */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">ประวัติโควต้า</h3>

        {quotaHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">ยังไม่มีประวัติการใช้งานโควต้า</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wider">วันที่</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wider">จำนวน</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wider">ยอดคงเหลือ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wider">เหตุผล</th>
                </tr>
              </thead>
              <tbody>
                {quotaHistory.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm text-gray-900">
                      {new Date(tx.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          tx.transaction_type === 'add' || tx.transaction_type === 'refund'
                            ? 'bg-green-50 text-green-700'
                            : tx.transaction_type === 'use'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {tx.transaction_type === 'add' && 'เพิ่ม'}
                        {tx.transaction_type === 'use' && 'ใช้'}
                        {tx.transaction_type === 'refund' && 'คืน'}
                        {tx.transaction_type === 'set' && 'กำหนด'}
                        {tx.transaction_type === 'reset' && 'รีเซ็ต'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <span
                        className={`font-medium ${
                          tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{tx.balance_after}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
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
