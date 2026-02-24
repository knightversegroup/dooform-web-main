'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, ChevronRight, Shield, User, Mail, LayoutGrid, List } from 'lucide-react';
import { apiClient } from '@dooform/shared/api/client';
import type { UserListItem, Role } from '@dooform/shared/auth/types';
import { LogoLoaderInline } from '@dooform/shared';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'list';

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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <p className="text-sm text-red-600 mb-4">{message}</p>
      <button onClick={onRetry} className="text-sm text-[#000091] hover:underline font-medium">
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-900 font-medium">ไม่พบผู้ใช้</p>
      <p className="text-sm text-gray-500 mt-1">ลองปรับคำค้นหา</p>
    </div>
  );
}

function UserCard({ user, onManage, onDelete }: {
  user: UserListItem;
  onManage: () => void;
  onDelete: () => void;
}) {
  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
  const isAdmin = user.roles.includes('admin');

  return (
    <div className="bg-white border border-gray-200 rounded-sm hover:border-gray-300 hover:shadow-sm transition-all group">
      <div className="p-5">
        {/* User Avatar & Name */}
        <div className="flex items-center gap-3 mb-4">
          {user.picture_url ? (
            <img
              src={user.picture_url}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#000091]/10 flex items-center justify-center">
              <span className="text-[#000091] font-medium text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user.email || 'ไม่มีอีเมล'}
            </p>
          </div>
        </div>

        {/* Roles */}
        <div className="flex gap-1 flex-wrap mb-4">
          {user.roles.map((role) => (
            <span
              key={role}
              className={`px-2 py-1 text-xs font-medium rounded ${
                role === 'admin'
                  ? 'bg-[#000091] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
            </span>
          ))}
        </div>

        {/* Quota & Status */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="text-gray-600">
            <span className="font-medium">โควต้า:</span>{' '}
            {user.quota ? (
              <span>
                <span className="text-gray-900">{user.quota.remaining}</span>
                <span className="text-gray-400"> / {user.quota.total}</span>
              </span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
          <span
            className={`px-2 py-1 text-xs rounded ${
              user.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
          </span>
        </div>

        {/* Provider Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
            {user.auth_provider}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onManage}
              className="px-3 py-1.5 text-sm bg-[#000091] text-white rounded hover:bg-[#000091]/90 transition-colors"
            >
              จัดการ
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onManage, onDelete }: {
  user: UserListItem;
  onManage: () => void;
  onDelete: () => void;
}) {
  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';

  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors group">
      {/* Avatar */}
      {user.picture_url ? (
        <img
          src={user.picture_url}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#000091]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[#000091] font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Name & Email */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#000091] transition-colors truncate">
          {displayName}
        </h3>
        <p className="text-sm text-gray-500 truncate">
          {user.email || 'ไม่มีอีเมล'}
        </p>
      </div>

      {/* Roles */}
      <div className="flex gap-1 flex-shrink-0 w-24">
        {user.roles.map((role) => (
          <span
            key={role}
            className={`px-2 py-1 text-xs font-medium rounded ${
              role === 'admin'
                ? 'bg-[#000091] text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
          </span>
        ))}
      </div>

      {/* Quota */}
      <div className="text-sm text-gray-600 w-30 flex-shrink-0 text-center">
        {user.quota ? (
          <span>
            <span className="font-medium text-gray-900">{user.quota.remaining}</span>
            <span className="text-gray-400">/{user.quota.total}</span>
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </div>

      {/* Provider */}
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize flex-shrink-0">
        {user.auth_provider}
      </span>

      {/* Status */}
      <span
        className={`px-2 py-1 text-xs rounded flex-shrink-0 ${
          user.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
      </span>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0 w-32">
        <button
          onClick={onManage}
          className="px-3 py-1.5 text-sm bg-[#000091] text-white rounded hover:bg-[#000091]/90 transition-colors"
        >
          จัดการ
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          ลบ
        </button>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#000091] flex-shrink-0" />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getUsers(page, itemsPerPage, searchQuery || undefined);
      setUsers(result.users);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, searchQuery]);

  const fetchRoles = useCallback(async () => {
    try {
      const result = await apiClient.getRoles();
      setRoles(result);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    try {
      await apiClient.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(page * itemsPerPage, total);

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <ErrorState message={error} onRetry={fetchUsers} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-[#000091]" />
            <h1 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
          </div>
          <p className="text-sm text-gray-500 ml-9">
            จัดการผู้ใช้, บทบาท, และโควต้า
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-gray-200 p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยอีเมลหรือชื่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent text-sm"
            />
          </div>
        </form>
      </div>

      {/* Results Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-600">
          {total > 0 ? `${startIndex + 1} – ${endIndex} จาก ${total} ผู้ใช้` : 'ไม่พบผู้ใช้'}
        </span>
        <div className="flex items-center gap-4">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">แสดง:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="text-sm border border-gray-300 rounded-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#000091]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#000091] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="มุมมองการ์ด"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-[#000091] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="มุมมองรายการ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onManage={() => router.push(`/users/${user.id}`)}
                onDelete={() => handleDeleteUser(user.id)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="w-10 flex-shrink-0"></div>
              <div className="flex-1">ผู้ใช้</div>
              <div className="w-24 flex-shrink-0">บทบาท</div>
              <div className="w-30 flex-shrink-0 text-center">โควต้า</div>
              <div className="flex-shrink-0">Provider</div>
              <div className="flex-shrink-0">สถานะ</div>
              <div className="w-32 flex-shrink-0">การดำเนินการ</div>
              <div className="w-5 flex-shrink-0"></div>
            </div>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onManage={() => router.push(`/users/${user.id}`)}
                onDelete={() => handleDeleteUser(user.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 border-t border-gray-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ก่อนหน้า
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1.5 text-sm border rounded-sm ${
                  page === pageNum
                    ? 'bg-[#000091] text-white border-[#000091]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
