import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CreditCard,
  Globe,
  Phone,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, isExpired } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import { getFeatureLabel } from '@/features/features/feature-i18n';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/assign-subscription-dialog';
import {
  useAdminOrg,
  useOwnerSubscription,
} from '../hooks/use-organizations';
import type {
  OrganizationStatus,
  OwnerSubscriptionSnapshot,
} from '../api/organizations.api';

const STATUS_LABEL: Record<OrganizationStatus, string> = {
  active: 'Faol',
  suspended: "To'xtatilgan",
  archived: 'Arxiv',
};

const STATUS_VARIANT: Record<
  OrganizationStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  active: 'success',
  suspended: 'warning',
  archived: 'secondary',
};

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv',
  expired: 'Muddati tugagan',
  cancelled: 'Bekor qilingan',
};

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps): React.ReactElement {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

export function OrgDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orgId = Number(id);
  const org = useAdminOrg(Number.isFinite(orgId) ? orgId : null);
  const ownerSub = useOwnerSubscription(Number.isFinite(orgId) ? orgId : null);
  const [assignOpen, setAssignOpen] = useState(false);

  if (org.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (org.isError || !org.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(org.error) || 'Tashkilot topilmadi'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/organizations')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Tashkilotlar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {org.data.name}
          </CardTitle>
          <CardDescription>
            <Badge variant={STATUS_VARIANT[org.data.status]}>
              {STATUS_LABEL[org.data.status]}
            </Badge>
            <span className="ml-2 text-xs">
              ID: {org.data.id} · Yaratilgan: {formatDate(org.data.createdAt)}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ega</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              icon={Users}
              label="To‘liq ism"
              value={org.data.ownerName}
            />
            <InfoRow
              icon={Phone}
              label="Telefon"
              value={org.data.ownerPhoneNumber ?? '—'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sozlamalar</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              icon={Globe}
              label="Bazaviy valyuta / til"
              value={`${org.data.baseCurrency} · ${org.data.locale}`}
            />
            <InfoRow
              icon={Users}
              label="A‘zolar soni"
              value={org.data.memberCount}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Egasining obunasi</CardTitle>
              <CardDescription>
                Tashkilotdagi xodimlar shu obuna funksiyalaridan foydalanadi.
              </CardDescription>
            </div>
            <RoleGate roles={['superadmin', 'billing']}>
              <Button onClick={() => setAssignOpen(true)}>
                <CreditCard className="h-4 w-4" />
                Obuna tayinlash
              </Button>
            </RoleGate>
          </CardHeader>
          <CardContent>
            <OwnerSubscriptionSection snapshot={ownerSub.data} loading={ownerSub.isPending} error={ownerSub.error} />
          </CardContent>
        </Card>
      </div>

      <AssignSubscriptionDialog
        userId={org.data.ownerUserId}
        userLabel={org.data.ownerName}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </div>
  );
}

function OwnerSubscriptionSection({
  snapshot,
  loading,
  error,
}: {
  snapshot: OwnerSubscriptionSnapshot | undefined;
  loading: boolean;
  error: Error | null;
}): React.ReactElement {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="py-4 text-sm text-destructive">{getErrorMessage(error)}</p>
    );
  }
  if (!snapshot || (snapshot.subscription === null && snapshot.plan === null)) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Obuna mavjud emas. Avval default tarif yarating yoki yuqoridagi tugma
        orqali qo&apos;lda obuna tayinlang.
      </div>
    );
  }

  const sub = snapshot.subscription;
  const plan = snapshot.plan;
  const expired = sub?.endDate ? isExpired(sub.endDate) : false;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow
          icon={Sparkles}
          label="Tarif"
          value={
            plan ? (
              <span className="flex items-center gap-1.5">
                <span className="font-medium">{plan.name}</span>
                <code className="text-xs text-muted-foreground">
                  {plan.code}
                </code>
                {plan.isDefault ? (
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground">Tarif yo&apos;q</span>
            )
          }
        />
        <InfoRow
          icon={CalendarClock}
          label="Holati"
          value={
            sub ? (
              <span
                className={
                  sub.status === 'active' && !expired
                    ? 'text-green-700'
                    : 'text-destructive'
                }
              >
                {SUBSCRIPTION_STATUS_LABEL[sub.status] ?? sub.status}
                {sub.endDate
                  ? ` · Tugaydi: ${formatDate(sub.endDate)}`
                  : ' · Cheksiz muddat'}
                {expired ? ' (vaqti o‘tgan)' : ''}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Aktiv obuna yo&apos;q (default tarifdan foydalanmoqda)
              </span>
            )
          }
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Yoqilgan funksiyalar va limitlar
        </h4>
        <FeatureFlagsTable features={snapshot.features} />
      </div>
    </div>
  );
}

function FeatureFlagsTable({
  features,
}: {
  features: Record<string, boolean | number | null>;
}): React.ReactElement {
  const entries = Object.entries(features).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Funksiyalar yo&apos;q — tarifda hech qanday imkoniyat belgilanmagan.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Funksiya</th>
            <th className="px-3 py-2 font-medium">Qiymat</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map(([code, value]) => {
            const i18n = getFeatureLabel(code);
            return (
              <tr key={code}>
                <td className="px-3 py-2">
                  <div className="text-sm">{i18n.name}</div>
                  <code className="text-[10px] text-muted-foreground">
                    {code}
                  </code>
                </td>
                <td className="px-3 py-2">
                  {value === null ? (
                    <Badge variant="success">Cheksiz</Badge>
                  ) : typeof value === 'boolean' ? (
                    <Badge variant={value ? 'success' : 'secondary'}>
                      {value ? 'Yoqilgan' : "O'chirilgan"}
                    </Badge>
                  ) : (
                    <span className="tabular-nums">{value}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
