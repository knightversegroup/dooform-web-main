'use client';

import { ReactNode } from 'react';
import { AdminOnlyRoute, AccessDenied } from '@/components/auth/RoleProtectedRoute';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminOnlyRoute
      unauthorizedComponent={
        <AccessDenied message="You need administrator privileges to access this area." />
      }
    >
      <div className="admin-section">
        {children}
      </div>
    </AdminOnlyRoute>
  );
}
