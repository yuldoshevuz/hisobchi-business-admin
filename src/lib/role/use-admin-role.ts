import { useAuthStore, type AdminRole } from '@/stores/auth.store';

export interface AdminRoleApi {
  role: AdminRole | null;
  is: (role: AdminRole) => boolean;
  isAny: (...roles: AdminRole[]) => boolean;
  isSuperadmin: boolean;
}

export function useAdminRole(): AdminRoleApi {
  const role = useAuthStore((s) => s.admin?.role ?? null);
  return {
    role,
    is: (target) => role === target,
    isAny: (...roles) => (role ? roles.includes(role) : false),
    isSuperadmin: role === 'superadmin',
  };
}
