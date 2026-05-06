import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/use-login';

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  support: 'Support',
  billing: 'Billing',
};

export function Topbar(): React.ReactElement {
  const admin = useAuthStore((s) => s.admin);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight">
            {admin?.fullName ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {admin?.phoneNumber ?? admin?.email ?? ''}
          </p>
        </div>
        {admin ? (
          <Badge
            variant={admin.role === 'superadmin' ? 'default' : 'secondary'}
          >
            {ROLE_LABEL[admin.role] ?? admin.role}
          </Badge>
        ) : null}
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Chiqish">
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
