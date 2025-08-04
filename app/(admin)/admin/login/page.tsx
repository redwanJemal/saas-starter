// app/admin/login/page.tsx
import { Suspense } from 'react';
import { getAdminUser } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { AdminLogin } from '@/components/admin/admin-login';

export default async function AdminLoginPage() {
  // Check if already logged in as admin
  const adminUser = await getAdminUser();
  if (adminUser) {
    redirect('/admin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLogin />
    </Suspense>
  );
}
