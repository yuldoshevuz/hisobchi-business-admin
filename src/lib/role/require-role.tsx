import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, type AdminRole } from '@/stores/auth.store';

interface RequireAuthProps {
  children?: ReactNode;
}

/**
 * Route guard: pushes the visitor to /login when they have no session.
 * Preserves the attempted URL in `state.from` so the login page can bounce
 * them back after a successful sign-in.
 */
export function RequireAuth({ children }: RequireAuthProps): React.ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const admin = useAuthStore((s) => s.admin);
  const location = useLocation();

  if (!accessToken || !admin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children ?? <Outlet />}</>;
}

interface RequireAdminRoleProps {
  roles: AdminRole[];
  children?: ReactNode;
  /** Where to bounce when role doesn't match. Defaults to `/dashboard`. */
  redirectTo?: string;
}

/**
 * Route guard: only allows admins whose role is in `roles`. Renders
 * `Navigate` to `redirectTo` (or `/dashboard`) on mismatch.
 *
 * Use as either a wrapper element on a `<Route>` or as a direct child wrap.
 */
export function RequireAdminRole({
  roles,
  children,
  redirectTo = '/dashboard',
}: RequireAdminRoleProps): React.ReactElement {
  const admin = useAuthStore((s) => s.admin);
  if (!admin) return <Navigate to="/login" replace />;
  if (!roles.includes(admin.role)) return <Navigate to={redirectTo} replace />;
  return <>{children ?? <Outlet />}</>;
}

interface RoleGateProps {
  roles: AdminRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Inline UX gate for buttons / table actions. Hides children when the
 * current role doesn't satisfy `roles`. The server is still the source of
 * truth — this is a noise-reduction shortcut.
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: RoleGateProps): React.ReactElement | null {
  const admin = useAuthStore((s) => s.admin);
  if (!admin || !roles.includes(admin.role)) return <>{fallback}</>;
  return <>{children}</>;
}
