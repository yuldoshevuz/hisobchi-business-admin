import { NavLink } from 'react-router-dom';
import {
  Bot,
  Building2,
  CalendarRange,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/stores/auth.store';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles that may see this entry. Empty/undefined = visible to all. */
  visibleTo?: AdminRole[];
}

const NAV: NavEntry[] = [
  { to: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
  { to: '/platform-users', label: 'Foydalanuvchilar', icon: Users },
  { to: '/organizations', label: 'Tashkilotlar', icon: Building2 },
  { to: '/plans', label: 'Tariflar', icon: CreditCard },
  { to: '/features', label: 'Funksiyalar', icon: Sparkles },
  { to: '/system-categories', label: 'Tizim kategoriyalari', icon: Tag },
  { to: '/bot-templates', label: 'Bot xabarlari', icon: MessageSquare },
  { to: '/broadcasts', label: 'Ommaviy xabarlar', icon: Megaphone },
  { to: '/raw-messages', label: 'AI xabarlar', icon: Bot },
  {
    to: '/admins',
    label: 'Adminlar',
    icon: ShieldCheck,
  },
  { to: '/audit-log', label: 'Audit log', icon: ClipboardList },
];

interface SidebarProps {
  role: AdminRole | null;
  collapsed?: boolean;
}

export function Sidebar({
  role,
  collapsed = false,
}: SidebarProps): React.ReactElement {
  const visible = NAV.filter(
    (n) => !n.visibleTo || (role && n.visibleTo.includes(role)),
  );

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-[width]',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <CalendarRange className="h-4 w-4 text-primary" />
          </div>
          {!collapsed ? (
            <span className="text-sm font-semibold">Hisobchi Admin</span>
          ) : null}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {visible.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
