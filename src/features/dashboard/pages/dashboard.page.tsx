import { Link } from 'react-router-dom';
import { Building2, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth.store';
import { useAdminsList } from '@/features/admins/hooks/use-admins';
import { useAdminOrgs } from '@/features/organizations/hooks/use-organizations';
import { useFeatures } from '@/features/features/hooks/use-features';
import { usePlans } from '@/features/plans/hooks/use-plans';

interface StatCardProps {
  to: string;
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

function StatCard({
  to,
  title,
  value,
  description,
  icon: Icon,
  loading,
}: StatCardProps): React.ReactElement {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? <Spinner /> : value}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage(): React.ReactElement {
  const admin = useAuthStore((s) => s.admin);
  const orgs = useAdminOrgs({ page: 1, limit: 1 });
  const admins = useAdminsList();
  const plans = usePlans();
  const features = useFeatures();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Salom, {admin?.fullName ?? 'admin'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Hisobchi platformasini boshqarish paneli
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          to="/organizations"
          title="Tashkilotlar"
          value={orgs.data?.meta.total ?? 0}
          description="Faol tashkilotlar soni"
          icon={Building2}
          loading={orgs.isPending}
        />
        <StatCard
          to="/plans"
          title="Tariflar"
          value={plans.data?.length ?? 0}
          description="Mavjud narx rejalari"
          icon={CreditCard}
          loading={plans.isPending}
        />
        <StatCard
          to="/features"
          title="Funksiyalar"
          value={features.data?.length ?? 0}
          description="Funksiyalar katalogi"
          icon={Sparkles}
          loading={features.isPending}
        />
        <StatCard
          to="/admins"
          title="Adminlar"
          value={admins.data?.length ?? 0}
          description="Platforma operatorlari"
          icon={ShieldCheck}
          loading={admins.isPending}
        />
      </div>
    </div>
  );
}
