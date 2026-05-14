import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CreditCard,
  Mail,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { formatDate, formatDateTime, isExpired } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import {
  usePlatformUser,
  useRestorePlatformUser,
  useRevokeSubscription,
  useSoftDeletePlatformUser,
} from '../hooks/use-platform-users';
import { GrantSubscriptionDialog } from '../components/grant-subscription-dialog';
import type {
  PlatformUserDetail,
  PlatformUserSubscription,
} from '../api/platform-users.api';

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv',
  expired: 'Muddati tugagan',
  cancelled: 'Bekor qilingan',
};

const SUBSCRIPTION_STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  active: 'success',
  expired: 'warning',
  cancelled: 'secondary',
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

export function PlatformUserDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);
  const user = usePlatformUser(Number.isFinite(userId) ? userId : null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeFor, setRevokeFor] = useState<PlatformUserSubscription | null>(
    null,
  );

  const softDelete = useSoftDeletePlatformUser();
  const restore = useRestorePlatformUser();
  const revoke = useRevokeSubscription();

  if (user.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (user.isError || !user.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(user.error) || 'Foydalanuvchi topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const u = user.data;

  async function handleSoftDelete(): Promise<void> {
    try {
      await softDelete.mutateAsync(userId);
      toast.success("Foydalanuvchi o'chirildi");
      setDeleteOpen(false);
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }

  async function handleRestore(): Promise<void> {
    try {
      await restore.mutateAsync(userId);
      toast.success('Foydalanuvchi qayta tiklandi');
    } catch (err) {
      toast.error('Qayta tiklab bo&apos;lmadi', getErrorMessage(err));
    }
  }

  async function handleRevoke(): Promise<void> {
    if (revokeFor === null) return;
    try {
      await revoke.mutateAsync({
        userId,
        subscriptionId: revokeFor.id,
      });
      toast.success('Obuna bekor qilindi');
      setRevokeFor(null);
    } catch (err) {
      toast.error('Bekor qilib bo&apos;lmadi', getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/platform-users')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Foydalanuvchilar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {u.fullName}
            {u.deletedAt ? (
              <Badge variant="destructive">O&apos;chirilgan</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            <span className="text-xs">
              ID: {u.id} · Ro&apos;yxatdan o&apos;tgan: {formatDateTime(u.createdAt)}
              {u.deletedAt
                ? ` · O'chirilgan: ${formatDateTime(u.deletedAt)}`
                : ''}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {u.deletedAt ? (
            <Button
              variant="outline"
              onClick={handleRestore}
              disabled={restore.isPending}
            >
              {restore.isPending ? <Spinner /> : <RotateCcw className="h-4 w-4" />}
              Qayta tiklash
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={softDelete.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Foydalanuvchini o&apos;chirish
            </Button>
          )}
          <Button onClick={() => setGrantOpen(true)} disabled={Boolean(u.deletedAt)}>
            <CreditCard className="h-4 w-4" />
            Obuna berish
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aloqa ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              icon={Phone}
              label="Telefon"
              value={u.phoneNumber ?? '—'}
            />
            <InfoRow icon={Mail} label="Email" value={u.email ?? '—'} />
            <InfoRow
              icon={Send}
              label="Telegram ID"
              value={u.telegramId ?? '—'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tashkilotlar</CardTitle>
            <CardDescription>
              Foydalanuvchi a&apos;zo bo&apos;lgan tashkilotlar
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              icon={Building2}
              label="Asosiy tashkilot"
              value={
                u.primaryOrganizationName && u.primaryOrganizationId ? (
                  <Link
                    to={`/organizations/${u.primaryOrganizationId}`}
                    className="text-primary hover:underline"
                  >
                    {u.primaryOrganizationName}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              icon={Building2}
              label="Egasi bo&apos;lgan tashkilotlar"
              value={u.ownedOrganizationsCount}
            />
            <InfoRow
              icon={Building2}
              label="A&apos;zoliklar soni"
              value={u.membershipsCount}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tashkilotlardagi a&apos;zoliklari</CardTitle>
        </CardHeader>
        <CardContent>
          {u.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hech qaysi tashkilotda a&apos;zo emas
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Tashkilot</th>
                    <th className="px-3 py-2 font-medium">Holati</th>
                    <th className="px-3 py-2 font-medium">Qo&apos;shilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {u.memberships.map((m) => (
                    <tr key={m.memberId}>
                      <td className="px-3 py-2">
                        <Link
                          to={`/organizations/${m.organizationId}`}
                          className="text-primary hover:underline"
                        >
                          {m.organizationName}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{m.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatDateTime(m.joinedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Obunalari</CardTitle>
          <CardDescription>
            Aktiv va tarixiy obunalar — har bir aktiv obunani bekor qilish mumkin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionsTable
            subscriptions={u.subscriptions}
            onRevoke={(sub) => setRevokeFor(sub)}
          />
        </CardContent>
      </Card>

      <GrantSubscriptionDialog
        userId={u.id}
        userLabel={u.fullName}
        open={grantOpen}
        onOpenChange={setGrantOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Foydalanuvchini o&apos;chirish"
        description={
          <span>
            <strong>{u.fullName}</strong> foydalanuvchisini o&apos;chirmoqchimisiz?
            Foydalanuvchi tizimga kira olmaydi, lekin ma&apos;lumotlari saqlanadi
            va keyinchalik qayta tiklash mumkin.
          </span>
        }
        confirmLabel="Ha, o&apos;chirish"
        destructive
        loading={softDelete.isPending}
        onConfirm={handleSoftDelete}
      />

      <ConfirmDialog
        open={revokeFor !== null}
        onOpenChange={(o) => {
          if (!o) setRevokeFor(null);
        }}
        title="Obunani bekor qilish"
        description={
          revokeFor ? (
            <span>
              <strong>{revokeFor.planName}</strong> tarifidagi obunani bekor
              qilmoqchimisiz? Bekor qilingach, foydalanuvchiga avtomatik
              ravishda default tarif beriladi.
            </span>
          ) : (
            ''
          )
        }
        confirmLabel="Ha, bekor qilish"
        destructive
        loading={revoke.isPending}
        onConfirm={handleRevoke}
      />
    </div>
  );
}

function SubscriptionsTable({
  subscriptions,
  onRevoke,
}: {
  subscriptions: PlatformUserDetail['subscriptions'];
  onRevoke: (s: PlatformUserSubscription) => void;
}): React.ReactElement {
  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Foydalanuvchining hech qanday obunasi yo&apos;q
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Tarif</th>
            <th className="px-3 py-2 font-medium">Holati</th>
            <th className="px-3 py-2 font-medium">Boshlangan</th>
            <th className="px-3 py-2 font-medium">Tugaydi</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {subscriptions.map((s) => {
            const expired = s.endDate ? isExpired(s.endDate) : false;
            return (
              <tr key={s.id}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{s.planName}</span>
                    <code className="text-[10px] text-muted-foreground">
                      {s.planCode}
                    </code>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={SUBSCRIPTION_STATUS_VARIANT[s.status]}>
                    {SUBSCRIPTION_STATUS_LABEL[s.status] ?? s.status}
                  </Badge>
                  {expired && s.status === 'active' ? (
                    <span className="ml-1 text-xs text-amber-600">
                      (vaqti o&apos;tgan)
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {formatDate(s.startDate)}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {s.endDate ? (
                    formatDate(s.endDate)
                  ) : (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      Cheksiz
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {s.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRevoke(s)}
                    >
                      Bekor qilish
                    </Button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
