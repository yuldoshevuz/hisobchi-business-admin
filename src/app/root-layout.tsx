import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/use-login';

/**
 * Authed layout. Wires the idle-timeout watchdog and renders the
 * sidebar + topbar shell around `<Outlet />`.
 */
export function RootLayout(): React.ReactElement {
  const admin = useAuthStore((s) => s.admin);
  const navigate = useNavigate();
  const logout = useLogout();

  useIdleTimeout(
    env.IDLE_TIMEOUT_MIN,
    async () => {
      await logout();
      toast.info('Sessiya tugadi', `${env.IDLE_TIMEOUT_MIN} daqiqa harakatsizlik`);
      navigate('/login', { replace: true });
    },
    Boolean(admin),
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar role={admin?.role ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
