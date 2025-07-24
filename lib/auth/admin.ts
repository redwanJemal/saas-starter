// lib/auth/admin.ts
import { db } from '@/lib/db/drizzle';
import { users, userRoles, roles, permissions, rolePermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: 'admin' | 'staff';
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    roleType: string;
    permissions: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      action: string;
    }>;
  }>;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getUser();
  
  if (!user || (user.userType !== 'admin' && user.userType !== 'staff')) {
    return null;
  }

  // Get user roles and permissions
  const userWithRoles = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      userRoles: {
        with: {
          role: {
            with: {
              rolePermissions: {
                with: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!userWithRoles) {
    return null;
  }

  const adminUser: AdminUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType as 'admin' | 'staff',
    roles: userWithRoles.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
      roleType: ur.role.roleType,
      permissions: ur.role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        slug: rp.permission.slug,
        category: rp.permission.category,
        action: rp.permission.action
      }))
    }))
  };

  return adminUser;
}

export async function requireAdminUser(): Promise<AdminUser> {
  const adminUser = await getAdminUser();
  
  if (!adminUser) {
    redirect('/sign-in?redirect=/admin');
  }
  
  return adminUser;
}

export function hasPermission(adminUser: AdminUser, permissionSlug: string): boolean {
  return adminUser.roles.some(role => 
    role.permissions.some(permission => permission.slug === permissionSlug)
  );
}

export function hasRole(adminUser: AdminUser, roleSlug: string): boolean {
  return adminUser.roles.some(role => role.slug === roleSlug);
}

export async function requirePermission(permissionSlug: string): Promise<AdminUser> {
  const adminUser = await requireAdminUser();
  
  if (!hasPermission(adminUser, permissionSlug)) {
    redirect('/admin?error=insufficient_permissions');
  }
  
  return adminUser;
}

// Admin middleware helpers
export function withAdminAuth<T extends any[], R>(
  handler: (adminUser: AdminUser, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const adminUser = await requireAdminUser();
    return handler(adminUser, ...args);
  };
}

export function withPermission<T extends any[], R>(
  permissionSlug: string,
  handler: (adminUser: AdminUser, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const adminUser = await requirePermission(permissionSlug);
    return handler(adminUser, ...args);
  };
}