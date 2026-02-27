'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, ChevronRight, LayoutGrid, List } from 'lucide-react';
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
    <div className="flex items-center justify-center py-20">
      <LogoLoaderInline size="lg" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-red-600 mb-4">{message}</p>
      <button onClick={onRetry} className="text-sm text-blue-600 hover:underline font-medium">
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900">ไม่พบผู้ใช้</p>
      <p className="text-sm text-gray-500 mt-1">ลองปรับคำค้นหา</p>
    </div>
  );
}

function UserAvatar({ name, pictureUrl, size = 'md' }: { name: string; pictureUrl?: string | null; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${dims} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${dims} rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0`}>
      <span className={`text-blue-600 font-medium ${textSize}`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        role === 'admin'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        active
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {active ? 'ใช้งาน' : 'ปิดใช้งาน'}
    </span>
  );
}

function UserCard({ user, onManage, onDelete }: {
  user: UserListItem;
  onManage: () => void;
  onDelete: () => void;
}) {
  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar name={displayName} pictureUrl={user.picture_url} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user.email || 'ไม่มีอีเมล'}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {user.roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
          <StatusBadge active={user.is_active} />
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="text-gray-500">
            โควต้า:{' '}
            {user.quota ? (
              <span className="text-gray-900 font-medium">{user.quota.remaining}<span className="text-gray-400">/{user.quota.total}</span></span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
          <span className="text-xs text-gray-400 capitalize">{user.auth_provider}</span>
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onManage}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            จัดการ
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            ลบ
          </button>
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
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group cursor-pointer"
      onClick={onManage}
    >
      <UserAvatar name={displayName} pictureUrl={user.picture_url} size="sm" />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {displayName}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {user.email || 'ไม่มีอีเมล'}
        </p>
      </div>

      <div className="hidden md:flex gap-1.5 flex-shrink-0">
        {user.roles.map((role) => (
          <RoleBadge key={role} role={role} />
        ))}
      </div>

      <div className="hidden lg:block text-sm text-gray-500 w-20 flex-shrink-0 text-center">
        {user.quota ? (
          <span>
            <span className="font-medium text-gray-900">{user.quota.remaining}</span>
            <span className="text-gray-400">/{user.quota.total}</span>
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </div>

      <div className="hidden lg:block flex-shrink-0">
        <StatusBadge active={user.is_active} />
      </div>

      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onManage}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          จัดการ
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          ลบ
        </button>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [, setRoles] = useState<Role[]>([]);
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

  if (loading && users.length === 0) return <LoadingState />;
  if (error && users.length === 0) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการผู้ใช้, บทบาท, และโควต้า
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยอีเมลหรือชื่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 flex-shrink-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title="มุมมองการ์ด"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title="มุมมองรายการ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="text-sm text-gray-500 mb-3">
        {total > 0 ? `${startIndex + 1}–${endIndex} จาก ${total} ผู้ใช้` : 'ไม่พบผู้ใช้'}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
