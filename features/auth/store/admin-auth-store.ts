// features/auth/store/admin-auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
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
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, isAuthenticated: false, loading: false }),
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some(role => 
          role.permissions.some(perm => perm.slug === permission)
        );
      },
      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some(userRole => userRole.slug === role);
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);