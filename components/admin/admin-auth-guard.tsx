'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Shield, Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminAuthGuard({ children, requiredPermission }: AdminAuthGuardProps) {
  const { user, loading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/admin/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      // TODO: Add permission checking logic here if requiredPermission is provided
      // if (requiredPermission && !hasPermission(user, requiredPermission)) {
      //   router.push('/admin?error=insufficient_permissions');
      //   return;
      // }

      setIsChecking(false);
    }
  }, [loading, isAuthenticated, router, requiredPermission]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}