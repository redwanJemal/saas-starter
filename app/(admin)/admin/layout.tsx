// app/admin/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply AdminAuthGuard to login page to prevent redirect loops
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <AdminAuthGuard>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthGuard>
  );
}